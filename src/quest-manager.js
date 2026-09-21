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
// the class event walks the graph into a verdict stage whose `showEpilogue`
// reads the stash. Nothing is scheduled and nothing is reordered.
//
// AND THE SIDE QUESTS (BACKLOG.md rank 9). data/quests/*.json are the same
// QuestGraph this file already runs, one per file, each driving one person's
// lines and nothing else. They are not a second manager and not a second class:
// they hear the same event stream the frame hears, through `_event` below, and
// the only thing they can do with it is move a stage, which `_syncStates` reads
// as one more layer between a press and the frame's own floor. Everything that
// makes them side quests rather than a second mystery is in
// `validateQuestSet` (src/quest-graph.js) and is checked before any of them
// runs.
//
// AND THE MORNING AFTER (#533 to #537). The four verdict stages are not the end
// any more: their pane's button dispatches `day:2`, the graph moves to
// `morning`, and `applyDay` is one call into the engine whose answer is the
// whole second day — which watch, who is missing, where the rest of them stand
// and what each of them says about it. There are no clues, no bell and no
// accusation on day two, so nothing below grew a branch for those: the engine
// already refuses all three once a verdict is recorded.

import { QuestGraph, judgeAnswer, renderLines, WARDS } from './quest-graph.js';
import { dayTwoApplies } from './mystery.js';

/** "prime" -> "Prime". The four bells are shown as they are named in the data. */
const label = (id) => (typeof id === 'string' && id ? id[0].toUpperCase() + id.slice(1) : '');

/**
 * How long one caption of a sermon or a song stays up (#592). Long lines earn
 * longer, because the band is read and not clicked past: a line is on screen
 * for a beat to notice it plus about twenty-two characters a second, floored so
 * a three-word line does not flash and capped so the longest one does not
 * outstay the player's patience. Nothing waits for it and nothing blocks on it,
 * so being wrong here is a pace and never a stall.
 */
const captionMs = (line) => Math.min(7200, Math.max(2600, 1200 + 45 * String(line ?? '').length));

/** A counter off a save, held to a whole number of favours. */
const nonNegInt = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);

/**
 * The line a list of `{at, line}` is at, for a count, or null below the first
 * threshold. The list is in ascending order of `at` and the highest one
 * reached wins; `validateQuestSet` is what holds both of those, and holds
 * every `at` to a number of errands that actually exists to be finished.
 */
const bandAt = (list, count) => {
  let line = null;
  for (const e of list ?? []) { if (count >= e?.at) line = e.line; }
  return line ?? null;
};

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
  static actions = ['openRiddle', 'openLock', 'ringBell', 'openJournal', 'openAccusation', 'showEpilogue', 'applyDay'];

  /**
   * The actions a file in data/quests/ may name, which is none of them. A side
   * quest in this increment is stages and lines: it moves, it changes what one
   * person says, and it does nothing else. The list is here rather than absent
   * so that the first side quest that needs an action adds it in one place and
   * `validateQuestSet` rejects every other name by name, the way
   * `QuestManager.actions` already does for the frame.
   */
  static sideActions = [];

  /**
   * @param quest      parsed data/quest.json
   * @param sideQuests parsed data/quests/*.json (BACKLOG.md rank 9), already
   *                   through `validateQuestSet`. Each gets its own graph and
   *                   hears every event the frame hears.
   * @param mystery    parsed data/mystery.json. Read for two things only: `ui`,
   *                   the lines the HUD says when the engine returns something
   *                   that is not a clue, and `accusation`, for how many clues
   *                   may be presented and what the verdicts say.
   * @param riddle     parsed data/riddle.json
   * @param documents  data/documents.json's `documents` (#551), or undefined
   * @param npcs       NPC instances (need .id, .name, .talking, .dialogueState, .getDialogueLines())
   * @param ui         the UI (src/ui.js)
   * @param castle     needs .openLock(id, {instant}) and .setEvidenceVisible(id, visible)
   * @param schedule   (fn, ms) => void; defaults to setTimeout. Injectable so a suite can see the delay.
   * @param restart    what the epilogue's button does; defaults to a reload.
   * @param saved      the loaded save, or null: begin the graph at its `stage` rather than at `start`.
   * @param onChange   called after every batch of effects; main.js marks the autosave.
   * @param engine     src/mystery.js's `createMystery`, or null.
   * @param onWatch    (watchId, {walk}) => void: the world half of a bell.
   * @param audio      src/audio.js, or anything with `bell()`. Injected the way
   *                   `ui` is, so test/quest.mjs hands in a recorder.
   * @param rooms      src/stations.js's `nav.rooms()`: every room the plan
   *                   builds, for the journal's map (BACKLOG.md rank 10). An
   *                   empty list is a journal with no map tab.
   * @param performances data/npcs.json's `performances` (#592): the sermons and
   *                   the songs, `{sermons: [...], songs: [...]}`. Omitted is a
   *                   castle where nobody performs, which is what every suite
   *                   that does not care about them gets.
   * @param reputation data/npcs.json's `reputation` (BACKLOG.md rank 8): the
   *                   lines the two ward counters are read out by, and the one
   *                   the epilogue pane carries. Omitted is a castle that keeps
   *                   the counters and never says them out loud, which is what
   *                   every suite above this row gets.
   */
  constructor({ quest, sideQuests = [], mystery = null, riddle, documents = [], npcs, ui, castle, schedule, restart, saved = null, onChange = null, engine = null, onWatch = null, audio = null, rooms = [], performances = null, reputation = null }) {
    this.graph = new QuestGraph(quest, QuestManager.actions);
    this.mystery = mystery;
    this.riddle = riddle;
    this.documents = documents;
    this.npcs = npcs;
    this.ui = ui;
    this.castle = castle;
    this._schedule = schedule || ((fn, ms) => setTimeout(fn, ms));
    this._restart = restart || (() => window.location.reload());
    this._wrongCount = Number.isInteger(saved?.riddleWrong) && saved.riddleWrong >= 0 ? saved.riddleWrong : 0;
    this._onChange = onChange;
    this.engine = engine;
    this._onWatch = onWatch;
    this.audio = audio;
    this.rooms = rooms;
    /* THE SET PIECES (#592, BACKLOG.md rank 8). data/npcs.json's `performances`,
     * flattened to one map keyed by the room and the bell, which is the only
     * question this file ever asks of it: the player is standing in `room` at
     * `watch`, is anybody performing?
     *
     * A PLACE HOLDS A LIST SINCE #648, and the list is in file order, because
     * the `rumours` pool's three pieces are all the guardroom at Lauds and
     * which one is said is the verdict and the journal. The first that applies
     * wins; `validateLore` (src/lore.js, run by test/lore.mjs and not by the
     * page) has already refused every piece an earlier one answers for
     * everywhere, so a place still never has a choice to make, only an order to
     * read in. `_heard` is what makes it once (#594):
     * per page rather than per save, because a sermon is a thing that happens
     * in a room and not a thing the player holds (#39: nothing about it has
     * to survive a reload, and a reload standing in the chapel at Vespers
     * hearing Vespers again is right rather than wrong). */
    this._performances = new Map();
    for (const [pool, entries] of Object.entries(performances ?? {})) {
      for (const e of entries ?? []) {
        const place = `${e.room}/${e.watch}`;
        if (!this._performances.has(place)) this._performances.set(place, []);
        this._performances.get(place).push({ ...e, pool });
      }
    }
    this._heard = new Set();
    this._playing = null; // the piece the band is in the middle of, or null
    this._room = null;    // where the player is standing, per `handleEnter`

    // The lock the player last pressed E at. `openLock` unlocks that one, so no
    // door id is written down in this file.
    this._lockAsked = null;
    // The last verdict the engine handed back, for `showEpilogue`. A save
    // resumed in a verdict stage has none and rebuilds it from `accusations`.
    this._verdict = null;
    // What each of the thirteen says on the morning after, once `applyDay` has
    // asked the engine. Null on day one, and null is what says which day it is
    // to every method below that has to answer differently.
    this._dayLines = null;
    // The ending the player reached, for the `rumours` pool (#648). Same null,
    // same reason: no verdict is what day one is, and a conditioned piece with
    // no verdict to read applies to nothing.
    this._dayOutcome = null;

    this._actions = {
      // THE POINTER IS NOT THIS FILE'S ANY MORE (#660). This used to pass a
      // third argument, `() => this.controlsRef.lock()`, and it was the only
      // one of the four overlays that had one. src/ui.js owns both halves now.
      openRiddle: () => this.ui.openRiddle(this.riddle.riddle, (answer) => this._checkAnswer(answer)),
      // The word held. The room is open in the engine (so the ledger inside it
      // can be examined) and the leaf swings in the castle.
      openLock: () => {
        if (!this._lockAsked) return;
        this.engine?.unlock(this._lockAsked);
        this.castle.openLock?.(this._lockAsked);
      },
      // The ring itself is `handleBell` below — it is what dispatched the event
      // this action is reacting to — so what is left for the stage to do is the
      // tracker, which `applyWatch` has already written. THE SOUND IS NOT HERE
      // EITHER (#520), though SPECS.md proposed it: this action only runs for a
      // stage that carries a `bell:<n>` transition, and the bell rings whether
      // the graph is listening or not. It is on the engine's own event instead.
      ringBell: () => {},
      openJournal: () => this._openJournal(),
      openAccusation: () => this._openAccusation(),
      showEpilogue: () => this._showEpilogue(),
      applyDay: () => this._applyDay(),
    };

    /* REPUTATION BY WARD (BACKLOG.md rank 8). Two counters, `outer` and
     * `inner`, one moved per errand finished in that ward, and the lines they
     * are read out by. The counters come off the save rather than off the
     * stages the graphs are about to be set to, which is the difference
     * between a record of favours done and a view of where five graphs are
     * standing: src/save.js's `repair` clamps each to the number of quests
     * that ward has and does not re-derive it, and neither does this. They
     * are set BEFORE the catch-up below, because a catch-up that walks a
     * quest into its ending is a favour finished now and has to count. */
    this._reputationLines = reputation;
    this._reputation = Object.fromEntries(WARDS.map((w) => [w, nonNegInt(saved?.reputation?.[w])]));

    // The side quests, before the frame begins, because the frame's own
    // `begin()` ends in a `dialogueState` effect and `_syncStates` reads these.
    // A saved stage this quest no longer has has already been reset to its
    // `start` by save.js's repair, the same rail the frame's stage goes
    // through; resuming is a stage assignment and nothing else, because a side
    // quest has no `enter` actions to re-run and its lines come out of
    // `_syncStates` below rather than out of an effect.
    this.sideQuests = sideQuests.map((def) => {
      const graph = new QuestGraph(def, QuestManager.sideActions);
      const at = saved?.quests?.[def.id];
      if (typeof at === 'string' && def.stages[at]) graph.stage = at;
      return { def, graph };
    });
    // And a save written before #597 may be sitting in exactly the stage that
    // rule describes: a stage waiting on a clue the save already holds. The
    // engine is built by now, so the same walk runs once here, and a quest it
    // moves toasts the way a move does, because it is one.
    for (const q of this.sideQuests) {
      const before = q.graph.stage;
      this._catchUp(q);
      q.moved = q.graph.stage !== before;
    }
    this._inBatch = false;
    this._settleSide();

    // Resume at a saved stage the graph has (save.js's repair has already reset
    // one it lacks to `start`), re-running that stage's enter effects so the
    // objective, the dialogue states, a verdict stage's epilogue pane and the
    // morning after's whole castle all come back.
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

  /**
   * True once the graph is in a terminal stage. THAT IS NO LONGER "THE DAY IS
   * JUDGED" (#537): the four verdict stages stopped being terminal when the
   * second day arrived, so between the epilogue pane and the inspector this is
   * false and the player is walking a castle again. `judged` is the other
   * question, and main.js and both browser suites wanted that one all along.
   */
  get victory() { return this.graph.done; }

  /** True once a verdict is recorded: the first day is over, whatever comes after. */
  get judged() { return (this.engine?.state?.accusations ?? []).some((a) => a.verdict); }

  /** 1 or 2. The second day begins when the epilogue's button is pressed. */
  get day() { return this.engine?.day ?? 1; }

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
    // The bell is the end of whatever was being said and the start of whatever
    // is said at the next one. Stopping first matters: without it, a sermon
    // begun at Sext would go on being captioned over a Vespers castle.
    this._stopPerformance();
    this._maybePerform();
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
    // The sound is on the engine's own `bell:<n>`, which every ring emits and
    // which a day already ended emits none of, so the fourth ring rings and a
    // press after the verdict does not (#520). Which ring it is goes with it,
    // because the four are not the same bell (#682).
    const rang = effects.find((e) => e.type === 'event' && e.name.startsWith('bell:'));
    if (rang) this.audio?.bell(Number(rang.name.slice('bell:'.length)));
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
    // THE READING IS DAY ONE'S (#539). The muniment door is shut again on the
    // morning after in six of the seven endings, and it is a lock target again
    // with it, so the riddle can be answered a second time. What must not
    // happen is the examine: `word-lock` is not listed at Lauds, so the engine
    // answers `absent` and the HUD says "Nothing there now." about a door the
    // player is standing in front of.
    if (evidenceId && this.engine?.day !== 2) this.handleExamine(evidenceId);
    this._event(`lock:${id}`);
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
   * E at one of the six readable documents (#551). Opens the same overlay a
   * conversation uses — a title and one long line the player steps past to
   * close — and marks it read on the engine's own `state.read` the instant it
   * opens, the same instant `examine()` marks a taken piece of evidence gone.
   * `state` is the save (src/save.js), so `read` reaches disk the next
   * autosave the way `taken` and `clues` already do, with no engine change:
   * this file is the only thing that ever writes to it.
   */
  handleRead(id) {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc || !this.engine) return;
    const list = (this.engine.state.read ??= []);
    if (!list.includes(id)) list.push(id);
    this.ui.openDialogue(doc.title, [doc.text], null);
    this._onChange?.(this._snapshot());
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
    const lines = renderLines(this._linesFor(npc), this.graph.tokens);
    this.ui.openDialogue(npc.name, lines, () => {
      npc.talking = false;
      if (this.engine) this._surface(this.engine.talk(npc.id));
      else this._event(`talked:${npc.id}`);
      this._onChange?.(this._snapshot());
    }, { onPresent: this.engine && !this._dayLines ? () => this._present(npc) : null });
  }

  /**
   * Whose words come out of somebody's mouth. On day one it is their own
   * `dialogue[state]`; on the morning after it is the set `applyDay` got from
   * the engine, which depends on what the player said at the accusation. The
   * day-two lines are in mystery.json rather than npcs.json because there are
   * seven of them per person and which one is spoken is a fact about the
   * mystery and not about the body (#534).
   */
  _linesFor(npc) {
    if (this._dayLines) return this._dayLines[npc.id] ?? npc.getDialogueLines();
    const lines = npc.getDialogueLines();
    const aside = this._reputationAside(npc);
    return aside ? [...lines, aside] : lines;
  }

  /**
   * What the ward has to say about the player, on the end of whatever the
   * person you walked up to was going to say. Null until a threshold is
   * reached, which is most of most days.
   *
   * THREE THINGS IT IS DELIBERATELY NOT. It is not a state, so it cannot
   * collide with a press or with an errand and `validateQuestSet`'s one-voice
   * rule has nothing to arbitrate. It is not on the morning after: `_dayLines`
   * replaces every line set in npcs.json, and a castle burying a man is not
   * the place for what the kitchen thinks of you (the same line `_dispatchSide`
   * draws, #576). And it is not on a press: `handlePress` answers the clue the
   * player pushed at somebody, which is the mystery's beat, and the castle's
   * gossip after a confession would be the wrong voice in the wrong second.
   */
  _reputationAside(npc) {
    const ward = npc?.def?.ward;
    if (!ward || !this._reputationLines?.[ward]) return null;
    return bandAt(this._reputationLines[ward], this._reputation[ward] ?? 0);
  }

  /**
   * The one line the closing pane carries under the verdict, keyed to both
   * counters added together, or null for a player who ran no errand — who is
   * shown nothing rather than a line saying they did nothing.
   */
  _reputationClosing() {
    const total = WARDS.reduce((n, w) => n + (this._reputation[w] ?? 0), 0);
    return bandAt(this._reputationLines?.closing, total);
  }

  /**
   * The player has walked into a room. `walk-crosses` is the only clue in
   * mystery.json granted this way, and without this the Clerk's `lady-window`
   * is unreachable in the browser while every Node suite that calls
   * `engine.enter` directly says it is fine. Since rank 10's map, main.js
   * calls this for every room the HUD's room line changes to, and the first
   * visit to any room is a save-worthy change the same way a clue is: the
   * engine says so with a `visited` effect, once per room (#588).
   */
  handleEnter(room, level = null) {
    if (!room) return [];
    // WHERE THE PLAYER IS STANDING IS THIS FILE'S ONLY COPY OF IT, and it is
    // set before the engine is asked anything, because a castle with no engine
    // still has rooms and a suite that drives one still walks between them.
    this._room = room;
    // You cannot hear the chapel from the hall: a piece in the room the player
    // just left is cut off where it stands. One already running in THIS room is
    // not, because main.js calls this on a change of room and a suite calling it
    // twice for one room should not silence what it started.
    if (this._playing && this._playing.piece.room !== room) this._stopPerformance();
    this._maybePerform();
    if (!this.engine) return [];
    const effects = this.engine.enter(room, level);
    this._surface(effects);
    if (effects.some((e) => e.type === 'clue' || e.type === 'visited')) this._onChange?.(this._snapshot());
    return effects;
  }

  /* ----------------------------------------------- the sermon and the song ---
   * WISHLIST.md theme 3's two set pieces (#592). A piece is one person saying
   * or singing one thing, in one room, at one bell, a caption at a time, to
   * whoever is standing there. It grants nothing, holds nothing up and takes
   * no input: the player keeps every key through the whole of it and walking
   * out is how you leave. What it tells is lore, the ids in its `cites`,
   * which data/lore.json's own `sources` name back, and that is the whole of
   * what it is for.
   */

  /**
   * The piece due where the player is standing at the bell the engine is on,
   * or null: the first in this place whose conditions the play answers.
   *
   * An unconditioned piece is every piece written for one of the four bells
   * (src/lore.js refuses a condition there, because a verdict is a thing only
   * the morning after has), so day one takes the same road it always did. A
   * `rumours` piece reads the ending `_applyDay` recorded and the journal the
   * save carried over, live off the engine rather than copied, the way
   * `dayTwoKnew` reads `state.clues` (#573).
   *
   * ONCE THE FIRST APPLICABLE PIECE HAS BEEN HEARD THE PLACE IS QUIET. It does
   * not fall through to the next one: two rumours in one guardroom at one bell
   * is the castle saying two things about the same morning, and which of them
   * is true is what the conditions already decided.
   */
  performanceHere() {
    if (!this._room) return null;
    const here = this._performances.get(`${this._room}/${this.watch}`) ?? [];
    const piece = here.find((e) => this._pieceApplies(e));
    return piece && !this._heard.has(piece.id) ? piece : null;
  }

  /** Does one piece answer to this play? Unconditioned pieces always do. */
  _pieceApplies(e) {
    if (e.when == null && e.unless == null && e.knew == null) return true;
    return dayTwoApplies(e, this._dayOutcome, this.engine?.state?.clues ?? []);
  }

  /** What the band is saying now, or null: the piece, not the line. */
  get performing() { return this._playing?.piece ?? null; }

  /**
   * Start the piece due here, if there is one and it has not been heard. The
   * lines step on `this._schedule`, the same injectable clock the dialogue's
   * delayed effects use, so a suite can run a whole sermon in no time at all.
   */
  _maybePerform() {
    const piece = this.performanceHere();
    if (!piece) return null;
    // A PERFORMANCE OUT-RANKS TALK (#728): two of the household gossiping are
    // cut off where they stand for a sermon, and never the other way round.
    if (this._playing?.talk) this._stopPerformance();
    this._heard.add(piece.id);
    const who = this.npcs?.find((n) => n.id === piece.npc);
    const name = who?.name ?? piece.npc;
    this._run(piece, () => name);
    return piece;
  }

  /**
   * Step one piece's lines onto the band, a caption at a time.
   *
   * The run is its own object and the step closes over it, so `_stopPerformance`
   * only has to drop the reference: a step that wakes up to find itself no
   * longer the run does nothing. No timer is ever cancelled, which is what
   * lets `_schedule` stay a two-argument function a suite can replace with a
   * queue (there is no `clearTimeout` to stand in for).
   */
  _run(piece, nameOf, talk = false) {
    const run = { piece, talk };
    this._playing = run;
    let i = 0;
    const step = () => {
      if (this._playing !== run) return;
      if (i >= piece.lines.length) { this._playing = null; this.ui.clearCaption?.(); return; }
      const name = nameOf(i);
      const line = piece.lines[i++];
      this.ui.caption?.(name, line);
      this._schedule(step, captionMs(line));
    };
    step();
  }

  /**
   * TWO OF THE HOUSEHOLD, OVERHEARD (#727, #728). src/populace.js hands over a
   * `talk` pair from data/populace.json when the player is in earshot of its
   * two speakers, with `room` set to where they stand, and `names` in
   * speaking order. The lines alternate between the two names, the first
   * line the first name's.
   *
   * ONE BAND AND ONE CLOCK. A talk run is a run like a sermon's: the same
   * `_playing`, the same `_heard`, the same `_schedule` and `captionMs`. So it
   * is once per page and never saved (#594, #39), it says nothing while
   * anything else is on the band, a bell stops it through `_stopPerformance`,
   * and because the pair carries `room`, `handleEnter`'s own room line stops
   * it when the player walks out.
   */
  overhear(pair, names = []) {
    if (!pair?.id || !Array.isArray(pair.lines)) return null;
    if (this._heard.has(pair.id) || this._playing) return null;
    this._heard.add(pair.id);
    this._run(pair, (i) => names[i % 2] ?? '', true);
    return pair;
  }

  /** The player walked out of earshot of `id`: the band goes dark if it is that pair's. */
  stopTalk(id) {
    if (this._playing?.talk && this._playing.piece.id === id) this._stopPerformance();
  }

  /** The band goes dark: the player left the room, or the bell moved. */
  _stopPerformance() {
    if (!this._playing) return;
    this._playing = null;
    this.ui.clearCaption?.();
  }

  /** The J key. The graph decides whether the journal opens here. */
  handleJournal() {
    this._event('ask:journal');
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
    // A shrug falls back to the side quest's lines when one holds this person,
    // and to `default` when none does. Falling straight to `default` put Marged
    // back on "a knife gone since yesterday" one conversation after she had
    // been told where it went, for no reason but a wrong clue presented.
    const floor = this._sideState(npc.id) ?? 'default';
    const lines = renderLines(this._dayLines?.[npc.id] ?? (shrugged ? (npc.def?.dialogue?.[floor] ?? npc.getDialogueLines()) : npc.getDialogueLines()), this.graph.tokens);
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

  /** Documents read, in the order they were opened, as the journal's second tab shows them (#551). */
  readJournal() {
    const ids = this.engine?.state?.read ?? [];
    return ids.map((id) => this.documents.find((d) => d.id === id)).filter(Boolean).map((d) => ({ id: d.id, title: d.title, text: d.text }));
  }

  /**
   * Every room the plan builds, with whether the player has stood in it, as
   * the journal's third tab draws them (BACKLOG.md rank 10). The set is the
   * engine's `visited`, which the save carries and `repair` holds to the
   * rooms the plan has; the list is the nav's, so a room the plan stops
   * building leaves the map the same load it leaves the save.
   */
  mapJournal() {
    const visited = new Set(this.engine?.state?.visited ?? []);
    return this.rooms.map((r) => ({ ...r, visited: visited.has(r.id) }));
  }

  _openJournal() {
    this.ui.openJournal(this.journal(), {
      empty: this.line('empty'), present: null,
      read: this.readJournal(), readEmpty: 'Nothing read yet.',
      map: this.rooms.length ? this.mapJournal() : null,
      quests: this.questJournal(),
    });
  }

  /** The Present button inside a conversation: clues alone, with a click that presses. Nothing read is offered here (#551): presenting is what a clue does. */
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
      // Twelve names and a fall. The thirteenth is the King's inspector, who
      // has not dismounted, and `arrives` is the field that says so (#534):
      // offering him would be offering an alibi nobody could ever break.
      people: this.npcs.filter((n) => ((n.def?.arrives ?? 1) === 1)).map((n) => ({ id: n.id, name: n.name })),
      fall: { id: 'nobody', name: this.line('fall') },
      clues: this.journal(),
      present: acc.present ?? 3,
      empty: this.line('empty'),
      onAccuse: (who, clueIds) => this.handleAccuse(who, clueIds),
    });
  }

  /**
   * The verdict and the epilogue, in the panel the accusation was made in, and
   * then on the second day the same pane again with the sheet signed.
   *
   * THE BUTTON IS WHAT CHANGED (#537). It used to do one thing: erase the save
   * and start the day over. Now, at the end of a day one that has a morning
   * after to go to, it reads "The next morning" and dispatches `day:2`, which
   * is the event the four verdict stages listen for. Which of the two it is is
   * read off the stage the graph is actually in rather than off a stage id
   * written here: a verdict stage with no `day:2` transition gets the old
   * button, which is how one ending is made final without touching this file.
   */
  _showEpilogue() {
    // The errands, under the verdict, in both panes: one line, computed once,
    // and null for a player who ran none (BACKLOG.md rank 8). It is the same
    // line on the morning after because it is about the day before, which is
    // the day the errands were run on and the only day they could have been.
    const reputation = this._reputationClosing();
    if (this.engine?.day === 2) {
      const e = this.engine.dayTwoEnding?.();
      if (!e) return;
      this.ui.showEpilogue({ ...(this._savedVerdict() ?? {}), convicted: e.signed, epilogue: e.after, reputation },
        () => this._restart(), { label: 'Play Again' });
      return;
    }
    const v = this._verdict ?? this._savedVerdict();
    if (!v) return;
    const morning = this._hasMorning();
    this.ui.showEpilogue({ ...v, reputation }, morning ? () => this._nextMorning() : () => this._restart(),
      { label: morning ? 'The next morning' : 'Play Again' });
  }

  /** Does this ending have a second day to go to? */
  _hasMorning() {
    return !!this.mystery?.day2 && (this.graph.current?.transitions ?? []).some((t) => t.on === 'day:2');
  }

  /** The epilogue's button, when there is a morning after. */
  _nextMorning() { this._event('day:2'); }

  /**
   * The morning after, applied to the whole game: the save says day 2, the sky
   * and the HUD say Lauds, the evidence is off the ground because none of it is
   * listed at that watch, the cast is placed by `onWatch` from the day-aware
   * station lookup, and every one of them is carrying the lines the verdict
   * earned them. The panel the epilogue was read in is closed and the pointer
   * goes back, because the next thing that happens is walking.
   *
   * IT IS IDEMPOTENT ON PURPOSE. It runs on entering `morning` and again on
   * entering `end`, so a save resumed in either stage comes back to a castle at
   * Lauds rather than to one still standing at Vespers behind the pane.
   */
  _applyDay() {
    const day = this.engine?.beginDay2?.();
    if (!day) return;
    this._dayLines = day.lines;
    // BEFORE `applyWatch` BELOW, which performs: a rumour read against a null
    // outcome applies to nothing, and the guardroom would be silent on the one
    // morning the pool exists for.
    this._dayOutcome = day.outcome ?? null;
    this.ui.closeAccusation?.();
    // The stone's half (#539). `day.castle` is already resolved for the ending
    // the player reached, so nothing here knows what a verdict is.
    this.castle?.applyDay?.(day.castle ?? []);
    this.applyWatch(day.watch, { walk: false });
    this._syncStates();
    this._onChange?.(this._snapshot());
  }

  /** Rebuild the last verdict from the save, for a reload after the accusation. */
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
    // One batch for the side quests (#597): an event inside it marks a mover,
    // and `_settleSide` after the loop is where the catch-up and the toast are.
    // Nested batches are not a thing, and a throw mid-loop must not leave the
    // flag up, or every later event would settle nothing.
    const outer = this._inBatch;
    this._inBatch = true;
    try { for (const e of effects) {
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
        case 'event': this._event(e.name); break;
        default: break; // talked, state, shrug, watch, stations, entered, unlocked, demand: read by the caller
      }
    } } finally { this._inBatch = outer; }
    if (!this._inBatch) this._settleSide();
    // An `examined` with no clue after it is evidence already read. Saying so
    // beats an unchanged screen, which reads as a prompt that does not work.
    if (examined && !effects.some((e) => e.type === 'clue' || e.type === 'taken')) this.ui.toast(this.line('known'));
    return effects;
  }

  _snapshot() {
    return {
      stage: this.graph.stage, riddleWrong: this._wrongCount, day: this.engine?.day ?? 1,
      quests: Object.fromEntries(this.sideQuests.map((q) => [q.def.id, q.graph.stage])),
      reputation: { ...this._reputation },
    };
  }

  /** The two ward counters as they stand. A copy: nothing outside moves them. */
  reputation() { return { ...this._reputation }; }

  /**
   * Every side quest and where it stands. `started` is the one thing the
   * journal's tab needs that the stage alone does not say: a quest sitting in
   * its start stage is a thread nobody has pulled (the cook has not mentioned
   * her knife yet), and putting it on the page would be the journal telling
   * the player about an errand before the errand exists.
   */
  openQuests() {
    return this.sideQuests.map((q) => ({
      id: q.def.id, title: q.def.title, objective: q.graph.objective,
      done: q.graph.done, started: q.graph.stage !== q.def.start,
    }));
  }

  /**
   * The journal's fourth tab (BACKLOG.md rank 9): the quests the player has
   * actually met, with what each one is asking now, or null when there are
   * none yet and the tab is not offered at all. NULL AND NOT AN EMPTY LIST,
   * the same shape `map` already uses: a tab that opens on "nothing here"
   * tells the player there are errands they have not found, which is exactly
   * what the toast on a move (#579) was too quiet to say and not what the
   * journal is for.
   */
  questJournal() {
    const met = this.openQuests().filter((q) => q.started);
    return met.length ? met.map(({ id, title, objective, done }) => ({ id, title, objective, done })) : null;
  }

  /**
   * One event to the frame and then to every side quest. THE ORDER IS THE
   * POINT: the frame moves first, so a side quest can never be the reason a
   * stage change was missed, and a side quest that throws would throw after
   * the frame had already applied its effects rather than instead of them.
   */
  _event(name) {
    this._apply(this.graph.dispatch(name));
    this._dispatchSide(name);
  }

  /**
   * The side quests' half. THE KNIFE THREAD IS DAY ONE'S: on the morning after
   * `_dayLines` replaces every line set in npcs.json (`_linesFor`), so a side
   * quest that moved at Lauds would change a state nobody could hear and write
   * a stage into the save that the player never saw reached. They are frozen
   * from the moment the second day begins.
   */
  _dispatchSide(name) {
    if (this.engine?.day === 2) return;
    let moved = false;
    for (const q of this.sideQuests) {
      const before = q.graph.stage;
      const effects = q.graph.dispatch(name);
      if (!effects.length) continue;
      // `dialogueState` is the only effect a side quest can produce, because
      // `QuestManager.sideActions` is empty and `validateQuest` refuses every
      // action name against it. The frame's own `_actions` table is deliberately
      // NOT reachable from here: a side action added later that happened to be
      // spelled `showEpilogue` would otherwise end the game from a quest file.
      // The first real side action gets its own table beside this line.
      if (effects.some((e) => e.type === 'dialogueState')) this._syncStates();
      if (q.graph.stage === before) continue;
      // The toast and the save are `_settleSide`'s, at the end of the batch
      // this event is part of (#597): a quest can move twice in one
      // conversation and the player is owed one line, for where it ended up.
      q.moved = true;
    }
    if (!this._inBatch) this._settleSide();
  }

  /**
   * The end of a batch of events, for the side quests: every quest that
   * moved is walked forward through the clues the player already holds
   * (`_catchUp`), and then toasted once for the stage it ended up in, and then
   * the move reaches the save. Every caller of `_event` except `handleLock`
   * and `handleJournal` marks the autosave afterwards on its own; those two do
   * not, and a side quest that turns on a word-lock or the J key would move
   * and be forgotten by the next reload.
   *
   * WHY THE END OF THE BATCH AND NOT THE MOVE. The engine's `talk()` returns
   * its clues and then `talked:<npc>`, in one list. Caught up on the clue,
   * Marged's knife thread went `unheard`, `hunting`, `found` on the clue and
   * `settled` on the `talked:` three effects later, in the one conversation
   * where she first mentioned the knife: the player heard her `default` lines
   * and the errand was over, with the two line sets that are the errand never
   * said. Catching up after the batch leaves the thread at `found` for the
   * next conversation, which is the one the player would have had anyway.
   * The tracker is the frame's one line and stays the frame's (#393); what a
   * side quest gets is the toast a clue already gets, on the move and not on a
   * resume, which is why a resume calls this only when a catch-up moved it.
   */
  _settleSide() {
    let moved = false;
    for (const q of this.sideQuests) {
      if (!q.moved) continue;
      q.moved = false;
      moved = true;
      this._catchUp(q);
      // An errand finished moves its ward's counter, once, here and nowhere
      // else. Once is not a guard, it is the graph: `validateQuest` refuses a
      // terminal stage with a transition that leaves it (#393), so a quest
      // that has arrived at an ending cannot move again and cannot be counted
      // again — including across a reload, where the save carries the counter
      // and the resume is a stage assignment that moves nothing.
      if (q.graph.done && q.def.ward in this._reputation) this._reputation[q.def.ward] += 1;
      this.ui.toast(`${q.def.title}: ${q.graph.objective}`);
    }
    if (moved) this._onChange?.(this._snapshot());
  }

  /**
   * A CLUE THE PLAYER ALREADY HOLDS IS AN EVENT THAT ALREADY HAPPENED (#597).
   * `clue:<id>` fires once, when the engine grants it, and never again: the
   * barrel says `gone` on a second E. So a quest that reaches a stage listening
   * for a clue the player found earlier would sit there for the rest of the day:
   * open the bakehouse barrel before Marged mentions her knife and the knife
   * thread opened on `hunting` and never left it, because the one event that
   * moves it had fired an hour before the stage existed to hear it. The cook's
   * knife shipped with that hole (#576) and the lady's hawk would have had it
   * worse, since the walk is somewhere a player goes for the mystery long before
   * a lady mentions a bird.
   *
   * So on arriving anywhere, a quest walks forward through every `clue:`
   * transition the new stage has for a clue the engine already holds, and does
   * it again for the stage that puts it in, until a stage waits on something the
   * player has not done. The player never stood in the skipped stage, so the
   * one toast is for the stage they arrive at. Conversations are not caught up:
   * `talked:` is a thing that happens, not a thing the player has. Bounded by
   * the stage count because a graph is allowed a cycle.
   */
  _catchUp(q) {
    if (!this.engine) return;
    for (let n = Object.keys(q.def.stages).length; n > 0; n--) {
      const held = (q.graph.current.transitions ?? []).find((t) => {
        const m = /^clue:(.+)$/.exec(t.on);
        return m && t.to && this.engine.holds(m[1]);
      });
      if (!held) return;
      const effects = q.graph.dispatch(held.on);
      if (effects.some((e) => e.type === 'dialogueState')) this._syncStates();
    }
  }

  /**
   * The state a side quest wants this person in, or null. `default` is not an
   * answer: it is the floor the frame already sets, and a quest sitting in its
   * start stage has to leave the frame in charge rather than pin them.
   */
  _sideState(npcId) {
    for (const q of this.sideQuests) {
      if (q.def.npc !== npcId) continue;
      const state = q.graph.dialogueState;
      if (state && state !== 'default') return state;
    }
    return null;
  }

  /**
   * Whose lines each NPC gives, in three layers. The engine is the authority
   * once a press has moved somebody; a side quest is next, for the one person
   * it names; the stage's `dialogueState` is the floor everybody starts on.
   * Without this the graph's own `dialogueState` effect would put a pressed
   * Steward back into `default` at the next stage change and lose his
   * admission.
   *
   * THE MYSTERY WINS OVER A SIDE QUEST AND NOT THE OTHER WAY ROUND (#550,
   * question 6). A press is the payoff for work the player did in the mystery;
   * a side quest that could cover it would be gating a clue by the back door,
   * which is the thing rank 9 is not allowed to do. `validateQuestSet` stops a
   * quest naming a pressed state at all, and this line is the second half of
   * the same rule: even if one did, the press would still be what is heard.
   */
  _syncStates() {
    for (const npc of this.npcs) {
      const pressed = this.engine?.npcState(npc.id);
      if (pressed && pressed !== 'default') { npc.dialogueState = pressed; continue; }
      npc.dialogueState = this._sideState(npc.id) ?? this.graph.dialogueState;
    }
  }

  _checkAnswer(raw) {
    const verdict = judgeAnswer(this.riddle, raw, this._wrongCount);
    if (verdict.ok) {
      this.ui.closeRiddle();
      this._event('riddle:solved');
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
