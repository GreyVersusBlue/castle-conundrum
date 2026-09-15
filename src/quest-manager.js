// quest-manager.js — the adapter between the quest graph (src/quest-graph.js,
// data/quest.json), the mystery engine (src/mystery.js) and the game: dialogue,
// the journal, presses, the word-lock's riddle, the bell and the accusation.
// Holds no state of its own. The graph holds the stage; the engine holds the
// watch, the clues, who has been pressed and what has been accused; the save is
// the engine's own `state` object.
//
// PHASE 7 IS WHERE THIS FILE STOPS BEING A RIDDLE QUEST. Through Phases 1 to 6
// the page played three stages about a Keystone while the engine ran beside it
// in Node, and `openJournal`, `openAccusation` and `showEpilogue` were three
// console.info calls waiting for a HUD. They are wired now, `openGate` and
// `showVictory` are gone with the three stages, and the riddle survives as
// `openLock`: the word over the muniment room's door, answered, unlocks the room
// in the engine and swings the leaf.
//
// WHAT ORDER BUYS. Every handler below is one pass over the engine's effect
// list, in the order the engine returned it, and `_surface` is the only place
// an effect becomes a call. That is what makes the accusation work without a
// special case: `accuse()` returns `[ask:accuse, verdict, accused:x,
// verdict:<class>]`, so the panel re-renders, the verdict is stashed, and then
// the class event walks the graph into a terminal stage whose `showEpilogue`
// reads the stash. Nothing is scheduled and nothing is reordered.

import { QuestGraph, judgeAnswer, renderLines } from './quest-graph.js';

/** "prime" -> "Prime". The four bells are shown as they are named in the data. */
const label = (id) => (typeof id === 'string' && id ? id[0].toUpperCase() + id.slice(1) : '');

/**
 * The dialogue tokens this manager answers, and the action each one names.
 * `validateAgainstNpcs` holds the two halves to each other in both directions:
 * a line ending in `{ACCUSE}` needs a stage that runs `openAccusation` after
 * that conversation, and a stage that runs it needs lines that offer it.
 */
export const MANAGER_PAIRS = [
  { action: 'openRiddle', token: '{RIDDLE}' },
  { action: 'openAccusation', token: '{ACCUSE}' },
];

export class QuestManager {
  /**
   * The actions data/quest.json may name. validateQuest checks against this
   * list, so an action here that nothing implements is caught at load and a
   * stage naming one that is missing refuses to construct.
   */
  static actions = ['openRiddle', 'openLock', 'ringBell', 'openJournal', 'openAccusation', 'showEpilogue'];

  /**
   * @param quest      parsed data/quest.json
   * @param mystery    parsed data/mystery.json. Read for two things only: `ui`,
   *                   the lines the HUD says when the engine returns something
   *                   that is not a clue, and `accusation`, for how many clues
   *                   may be presented and what the verdicts say.
   * @param riddle     parsed data/riddle.json
   * @param npcs       NPC instances (need .id, .name, .talking, .dialogueState, .getDialogueLines())
   * @param ui         the UI (src/ui.js)
   * @param castle     needs .openLock(id, {instant}) and .setEvidenceVisible(id, visible)
   * @param controlsRef { lock: fn } to re-lock the pointer after overlays
   * @param schedule   (fn, ms) => void; defaults to setTimeout. Injectable so a suite can see the delay.
   * @param restart    what the epilogue's button does; defaults to a reload.
   * @param saved      the loaded save, or null: begin the graph at its `stage` rather than at `start`.
   * @param onChange   called after every batch of effects; main.js marks the autosave.
   * @param engine     src/mystery.js's `createMystery`, or null.
   * @param onWatch    (watchId, {walk}) => void: the world half of a bell.
   */
  constructor({ quest, mystery = null, riddle, npcs, ui, castle, controlsRef, schedule, restart, saved = null, onChange = null, engine = null, onWatch = null }) {
    this.graph = new QuestGraph(quest, QuestManager.actions);
    this.mystery = mystery;
    this.riddle = riddle;
    this.npcs = npcs;
    this.ui = ui;
    this.castle = castle;
    this.controlsRef = controlsRef;
    this._schedule = schedule || ((fn, ms) => setTimeout(fn, ms));
    this._restart = restart || (() => window.location.reload());
    this._wrongCount = Number.isInteger(saved?.riddleWrong) && saved.riddleWrong >= 0 ? saved.riddleWrong : 0;
    this._onChange = onChange;
    this.engine = engine;
    this._onWatch = onWatch;
    // The lock the player last pressed E at. `openLock` unlocks that one, so no
    // door id is written down in this file.
    this._lockAsked = null;
    // The last verdict the engine handed back, for `showEpilogue`. A save
    // resumed in a terminal stage has none and rebuilds it from `accusations`.
    this._verdict = null;

    this._actions = {
      openRiddle: () => this.ui.openRiddle(
        this.riddle.riddle,
        (answer) => this._checkAnswer(answer),
        () => this.controlsRef.lock()
      ),
      // The word held. The room is open in the engine (so the ledger inside it
      // can be examined) and the leaf swings in the castle.
      openLock: () => {
        if (!this._lockAsked) return;
        this.engine?.unlock(this._lockAsked);
        this.castle.openLock?.(this._lockAsked);
      },
      // The ring itself is `handleBell` below — it is what dispatched the event
      // this action is reacting to — so what is left for the stage to do is the
      // tracker, which `applyWatch` has already written.
      ringBell: () => {},
      openJournal: () => this._openJournal(),
      openAccusation: () => this._openAccusation(),
      showEpilogue: () => this._showEpilogue(),
    };

    // Resume at a saved stage the graph has (save.js's repair has already reset
    // one it lacks to `start`), re-running that stage's enter effects so the
    // objective, the dialogue states and a terminal stage's epilogue come back.
    if (saved?.stage && quest.stages[saved.stage] && saved.stage !== quest.start) {
      this.graph.stage = saved.stage;
      this._apply(this.graph._enterEffects());
    } else {
      this._apply(this.graph.begin());
    }
  }

  /** How many wrong riddle answers so far; the save carries it as `riddleWrong`. */
  get wrongCount() { return this._wrongCount; }

  /** The current stage id, for anything that wants to read it (both suites do). */
  get stage() { return this.graph.stage; }

  /** True once the graph is in a terminal stage: the day is judged. */
  get victory() { return this.graph.done; }

  /** The watch the engine is on, or null when this manager has none (a stand-in suite). */
  get watch() { return this.engine ? this.engine.watch : null; }

  /** One of mystery.json's `ui` lines, or '' when there is no mystery to read. */
  line(key) { return this.mystery?.ui?.[key] ?? ''; }

  /* ------------------------------------------------------------ the world --- */

  /**
   * Put the world at a watch without ringing anything: the sky, the evidence
   * that is there at that bell, and everyone standing at their station for it.
   * main.js calls this once at load, so a save resumed at Sext opens at Sext.
   */
  applyWatch(watch, opts = {}) {
    this.ui.setWatch?.(label(watch));
    this._showEvidence(watch);
    this._onWatch?.(watch, opts);
  }

  /**
   * What is on the ground at this bell. Three of the ten come and go with the
   * watch — the body at Prime, the cloak until it is washed, the merchant's
   * cart at Terce — and two leave the world for good when they are taken.
   *
   * THE TAKEN HALF IS WHY THIS IS HERE AND NOT IN main.js. Reading `watches`
   * alone put the pouch back on the body at Terce after the player had already
   * pocketed it at Prime, with `taken` in the save saying so; the manager owns
   * `taken`, so the manager owns the answer, and test/quest.mjs can see it.
   */
  _showEvidence(watch) {
    const taken = this.engine?.state?.taken ?? [];
    for (const e of this.mystery?.evidence ?? []) {
      this.castle.setEvidenceVisible?.(e.id, (e.watches ?? []).includes(watch) && !taken.includes(e.id));
    }
  }

  /**
   * The chapel bell. The engine moves the watch on, the world follows it, and
   * the graph hears `bell:<n>`. The fourth ring moves no watch: it is the
   * Constable demanding an answer, and the frame moves to `accusing`.
   */
  handleBell() {
    if (!this.engine) return [];
    const before = this.engine.watch;
    const effects = this.engine.ring();
    if (this.engine.watch !== before) this.applyWatch(this.engine.watch);
    this._surface(effects);
    this._onChange?.(this._snapshot());
    return effects;
  }

  /* ------------------------------------------------------- what E lands on --- */

  /**
   * E at a word-locked door. Reading the word and being asked it are one press:
   * the leaf carries the evidence id (`lock`, in mystery.json), so examining it
   * lands `word-lock` in the journal, and then the graph decides whether the
   * overlay opens. Pressing E at it once the word is answered does nothing at
   * all, because `locks()` stops offering an opened leaf.
   */
  handleLock(id, evidenceId = null) {
    this._lockAsked = id;
    if (evidenceId) this.handleExamine(evidenceId);
    this._apply(this.graph.dispatch(`lock:${id}`));
  }

  /**
   * E at a piece of evidence. Everything the engine can say back has a line:
   * a clue toasts its title, a taken thing leaves the world, and the three
   * refusals (not at this bell, already taken, still behind the lock) say so
   * rather than nothing, which would read as a broken prompt.
   */
  handleExamine(evidenceId) {
    if (!this.engine) return [];
    const effects = this.engine.examine(evidenceId);
    this._surface(effects);
    this._onChange?.(this._snapshot());
    return effects;
  }

  /**
   * E at somebody. The lines are shown first and the engine is told after the
   * conversation ends, which is what makes a statement land when the player has
   * actually read it. Somebody asleep says the castle's `asleep` line instead;
   * `available()` is the engine's own answer, not a flag written here.
   */
  handleInteract(npc) {
    if (this.engine && !this.engine.available(npc.id)) {
      this.ui.openDialogue(npc.name, [this.line('asleep')], null);
      return;
    }
    npc.talking = true;
    const lines = renderLines(npc.getDialogueLines(), this.graph.tokens);
    this.ui.openDialogue(npc.name, lines, () => {
      npc.talking = false;
      if (this.engine) this._surface(this.engine.talk(npc.id));
      else this._apply(this.graph.dispatch(`talked:${npc.id}`));
      this._onChange?.(this._snapshot());
    }, { onPresent: this.engine ? () => this._present(npc) : null });
  }

  /**
   * The player has walked into a room. `walk-crosses` is the only clue in
   * mystery.json granted this way, and without this the Clerk's `lady-window`
   * is unreachable in the browser while every Node suite that calls
   * `engine.enter` directly says it is fine.
   */
  handleEnter(room, level = null) {
    if (!this.engine || !room) return [];
    const effects = this.engine.enter(room, level);
    this._surface(effects);
    if (effects.some((e) => e.type === 'clue')) this._onChange?.(this._snapshot());
    return effects;
  }

  /** The J key. The graph decides whether the journal opens here. */
  handleJournal() {
    this._apply(this.graph.dispatch('ask:journal'));
  }

  /**
   * Present a held clue to somebody. A press that moves them opens their new
   * lines; a press that moves nobody gets their `default` lines back, so a
   * wrong present is answered rather than met with silence. A shrug is not a
   * conversation: it dispatches no `talked:` event, so presenting the wrong
   * thing to the Constable does not also open the accusation panel.
   */
  handlePress(npc, clueId) {
    if (!this.engine) return [];
    this.ui.closeJournal?.();
    const effects = this.engine.press(npc.id, clueId);
    this._surface(effects);
    this._syncStates();
    const shrugged = effects.some((e) => e.type === 'shrug');
    const lines = renderLines(shrugged ? (npc.def?.dialogue?.default ?? npc.getDialogueLines()) : npc.getDialogueLines(), this.graph.tokens);
    npc.talking = true;
    this.ui.openDialogue(npc.name, lines, () => { npc.talking = false; }, { onPresent: () => this._present(npc) });
    this._onChange?.(this._snapshot());
    return effects;
  }

  /**
   * Name somebody, or call it a fall, on up to `accusation.present` clues. The
   * Constable's answer is the engine's; everything this does is show it.
   */
  handleAccuse(who, clueIds = []) {
    if (!this.engine) return [];
    const effects = this.engine.accuse(who, clueIds);
    this._surface(effects);
    this._onChange?.(this._snapshot());
    return effects;
  }

  /* -------------------------------------------------------------- the HUD --- */

  /** Held clues, newest last, as the journal and the accusation panel show them. */
  journal() { return this.engine ? this.engine.journal() : []; }

  _openJournal() {
    this.ui.openJournal(this.journal(), { empty: this.line('empty'), present: null });
  }

  /** The Present button inside a conversation: the same list, with a click that presses. */
  _present(npc) {
    this.ui.openJournal(this.journal(), {
      empty: this.line('empty'),
      present: (clueId) => this.handlePress(npc, clueId),
    });
  }

  _openAccusation() {
    if (!this.engine) return;
    const acc = this.mystery?.accusation ?? {};
    this.ui.openAccusation({
      people: this.npcs.map((n) => ({ id: n.id, name: n.name })),
      fall: { id: 'nobody', name: this.line('fall') },
      clues: this.journal(),
      present: acc.present ?? 3,
      empty: this.line('empty'),
      onAccuse: (who, clueIds) => this.handleAccuse(who, clueIds),
      onClose: () => this.controlsRef?.lock?.(),
    });
  }

  /**
   * The verdict and the epilogue, in the panel the accusation was made in. The
   * button erases the save and starts the day again — `restart` is injected, so
   * a suite sees the call rather than a reload.
   */
  _showEpilogue() {
    const v = this._verdict ?? this._savedVerdict();
    if (!v) return;
    this.ui.showEpilogue(v, () => this._restart());
  }

  /** Rebuild the last verdict from the save, for a reload in a terminal stage. */
  _savedVerdict() {
    const acc = this.mystery?.accusation ?? {};
    const a = (this.engine?.state?.accusations ?? []).filter((x) => x.verdict).at(-1);
    if (!a) return null;
    const v = acc.verdicts?.[a.verdict === 'full' ? 'full' : a.who] ?? {};
    return { who: a.who, class: a.verdict, clues: a.clues ?? [], convicted: v.convicted ?? '', epilogue: v.epilogue ?? '' };
  }

  /* ------------------------------------------------------------- plumbing --- */

  /**
   * One engine effect list becomes one pass of HUD calls and graph dispatches,
   * in the order the engine returned them. Every effect type the engine can
   * emit is named here; a new one added to src/mystery.js and not to this list
   * is silently dropped, which is why test/quest.mjs counts them.
   */
  _surface(effects) {
    let examined = false;
    for (const e of effects) {
      switch (e.type) {
        case 'clue': this.ui.toast(`New clue: ${e.title}`); break;
        case 'taken': this.castle.setEvidenceVisible?.(e.evidence, false); break;
        case 'absent': this.ui.toast(this.line('absent')); break;
        case 'gone': this.ui.toast(this.line('gone')); break;
        case 'locked': this.ui.toast(this.line('locked')); break;
        case 'examined': examined = true; break;
        case 'early': this.ui.setAccusationNote?.(e.text); break;
        case 'refused': this.ui.setAccusationNote?.(e.text); break;
        case 'verdict': this._verdict = e; break;
        case 'event': this._apply(this.graph.dispatch(e.name)); break;
        default: break; // talked, state, shrug, watch, stations, entered, unlocked, demand: read by the caller
      }
    }
    // An `examined` with no clue after it is evidence already read. Saying so
    // beats an unchanged screen, which reads as a prompt that does not work.
    if (examined && !effects.some((e) => e.type === 'clue' || e.type === 'taken')) this.ui.toast(this.line('known'));
    return effects;
  }

  _snapshot() { return { stage: this.graph.stage, riddleWrong: this._wrongCount }; }

  /**
   * Whose lines each NPC gives. The engine is the authority once a press has
   * moved somebody; the stage's `dialogueState` is the floor everybody starts
   * on. Without this the graph's own `dialogueState` effect would put a pressed
   * Steward back into `default` at the next stage change and lose his
   * admission.
   */
  _syncStates() {
    for (const npc of this.npcs) {
      const pressed = this.engine?.npcState(npc.id);
      npc.dialogueState = pressed && pressed !== 'default' ? pressed : this.graph.dialogueState;
    }
  }

  _checkAnswer(raw) {
    const verdict = judgeAnswer(this.riddle, raw, this._wrongCount);
    if (verdict.ok) {
      this.ui.closeRiddle();
      this._apply(this.graph.dispatch('riddle:solved'));
    } else {
      this._wrongCount = verdict.wrongCount;
      this.ui.setRiddleFeedback(verdict.feedback);
      this._onChange?.(this._snapshot());
    }
  }

  _apply(effects) {
    for (const e of effects) {
      if (e.type === 'objective') this.ui.setObjective(e.text);
      else if (e.type === 'dialogueState') this._syncStates();
      else if (e.type === 'action') {
        const run = this._actions[e.name];
        if (e.after > 0) this._schedule(run, e.after);
        else run();
      }
    }
    if (effects.length) this._onChange?.(this._snapshot());
  }
}
