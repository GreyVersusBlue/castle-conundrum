// quest-manager.js — the adapter between the quest graph (src/quest-graph.js,
// data/quest.json) and the game: NPC dialogue, the riddle overlay, the gate and
// the victory screen. Holds no quest state of its own; the graph does. What
// lives here is the list of actions the graph is allowed to name, and the code
// that runs each one.

import { QuestGraph, judgeAnswer, renderLines } from './quest-graph.js';

export class QuestManager {
  /**
   * The actions data/quest.json may name. validateQuest checks against this
   * list. The last four are the v2 frame's (WISHLIST.md, Phase 1) and are listed
   * so the frame validates; the page does not run the frame until Phase 7, and
   * until then each of them only logs. test/mystery.mjs drives the engine they
   * will call.
   */
  static actions = ['openRiddle', 'openGate', 'showVictory', 'ringBell', 'openJournal', 'openAccusation', 'showEpilogue'];

  /**
   * @param quest      parsed data/quest.json
   * @param riddle     parsed data/riddle.json
   * @param npcs       NPC instances (need .id, .name, .talking, .dialogueState, .getDialogueLines())
   * @param ui         the UI (setObjective, openDialogue, openRiddle, closeRiddle, setRiddleFeedback, showVictory)
   * @param castle     needs .openGate()
   * @param controlsRef { lock: fn } to re-lock the pointer after overlays
   * @param schedule   (fn, ms) => void; defaults to setTimeout. Injectable so a suite can see the delay.
   * @param restart    what the victory screen's button does; defaults to a reload.
   * @param saved      { stage, riddleWrong } from the save slot, or null: begin the graph there rather than at `start`.
   * @param onChange   called after every batch of effects with { stage, riddleWrong }; main.js marks the autosave.
   */
  constructor({ quest, riddle, npcs, ui, castle, controlsRef, schedule, restart, saved = null, onChange = null }) {
    this.graph = new QuestGraph(quest, QuestManager.actions);
    this.riddle = riddle;
    this.npcs = npcs;
    this.ui = ui;
    this.castle = castle;
    this.controlsRef = controlsRef;
    this._schedule = schedule || ((fn, ms) => setTimeout(fn, ms));
    this._restart = restart || (() => window.location.reload());
    this._wrongCount = Number.isInteger(saved?.riddleWrong) && saved.riddleWrong >= 0 ? saved.riddleWrong : 0;
    this._onChange = onChange;

    this._actions = {
      openRiddle: () => this.ui.openRiddle(
        this.riddle.riddle,
        (answer) => this._checkAnswer(answer),
        () => this.controlsRef.lock()
      ),
      openGate: () => this.castle.openGate(),
      showVictory: () => this.ui.showVictory(() => this._restart()),
      ringBell: () => console.info('[quest] ringBell: the bell is Phase 6'),
      openJournal: () => console.info('[quest] openJournal: the journal is Phase 7'),
      openAccusation: () => console.info('[quest] openAccusation: the accusation is Phase 7'),
      showEpilogue: () => console.info('[quest] showEpilogue: the epilogue is Phase 7'),
    };

    // Resume at a saved stage the graph has (save.js's repair has already reset
    // one it lacks to `start`), re-running that stage's enter effects so the
    // objective, the dialogue state and a terminal stage's open gate come back.
    if (saved?.stage && quest.stages[saved.stage] && saved.stage !== quest.start) {
      this.graph.stage = saved.stage;
      this._apply(this.graph._enterEffects());
    } else {
      this._apply(this.graph.begin());
    }
  }

  /** How many wrong riddle answers so far; the save carries it as `riddleWrong`. */
  get wrongCount() { return this._wrongCount; }

  /** The current stage id, for anything that wants to read it (the browser suite does). */
  get stage() { return this.graph.stage; }

  /** True once the graph is in a terminal stage. main.js reads this. */
  get victory() { return this.graph.done; }

  /**
   * Wire into InteractionSystem.onInteract for a word-locked door. The graph
   * decides whether anything happens: pressing E at the muniment room's lock in
   * the stage that listens for it opens the riddle, and pressing E at it after
   * the word is answered does nothing at all, because the stage that listened
   * has been left behind.
   */
  handleLock(id) {
    this._apply(this.graph.dispatch(`lock:${id}`));
  }

  /** Wire into InteractionSystem.onInteract */
  handleInteract(npc) {
    npc.talking = true;
    const lines = renderLines(npc.getDialogueLines(), this.graph.tokens);
    this.ui.openDialogue(npc.name, lines, () => {
      npc.talking = false;
      this._apply(this.graph.dispatch(`talked:${npc.id}`));
    });
  }

  _checkAnswer(raw) {
    const verdict = judgeAnswer(this.riddle, raw, this._wrongCount);
    if (verdict.ok) {
      this.ui.closeRiddle();
      this._apply(this.graph.dispatch('riddle:solved'));
    } else {
      this._wrongCount = verdict.wrongCount;
      this.ui.setRiddleFeedback(verdict.feedback);
      this._onChange?.({ stage: this.graph.stage, riddleWrong: this._wrongCount });
    }
  }

  _apply(effects) {
    for (const e of effects) {
      if (e.type === 'objective') this.ui.setObjective(e.text);
      else if (e.type === 'dialogueState') for (const npc of this.npcs) npc.dialogueState = e.state;
      else if (e.type === 'action') {
        const run = this._actions[e.name];
        if (e.after > 0) this._schedule(run, e.after);
        else run();
      }
    }
    if (effects.length) this._onChange?.({ stage: this.graph.stage, riddleWrong: this._wrongCount });
  }
}
