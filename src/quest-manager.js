// quest-manager.js — the adapter between the quest graph (src/quest-graph.js,
// data/quest.json) and the game: NPC dialogue, the riddle overlay, the gate and
// the victory screen. Holds no quest state of its own; the graph does. What
// lives here is the list of actions the graph is allowed to name, and the code
// that runs each one.

import { QuestGraph, judgeAnswer, renderLines } from './quest-graph.js';

export class QuestManager {
  /** The actions data/quest.json may name. validateQuest checks against this list. */
  static actions = ['openRiddle', 'openGate', 'showVictory'];

  /**
   * @param quest      parsed data/quest.json
   * @param riddle     parsed data/riddle.json
   * @param npcs       NPC instances (need .id, .name, .talking, .dialogueState, .getDialogueLines())
   * @param ui         the UI (setObjective, openDialogue, openRiddle, closeRiddle, setRiddleFeedback, showVictory)
   * @param castle     needs .openGate()
   * @param controlsRef { lock: fn } to re-lock the pointer after overlays
   * @param schedule   (fn, ms) => void; defaults to setTimeout. Injectable so a suite can see the delay.
   * @param restart    what the victory screen's button does; defaults to a reload.
   */
  constructor({ quest, riddle, npcs, ui, castle, controlsRef, schedule, restart }) {
    this.graph = new QuestGraph(quest, QuestManager.actions);
    this.riddle = riddle;
    this.npcs = npcs;
    this.ui = ui;
    this.castle = castle;
    this.controlsRef = controlsRef;
    this._schedule = schedule || ((fn, ms) => setTimeout(fn, ms));
    this._restart = restart || (() => window.location.reload());
    this._wrongCount = 0;

    this._actions = {
      openRiddle: () => this.ui.openRiddle(
        this.riddle.riddle,
        (answer) => this._checkAnswer(answer),
        () => this.controlsRef.lock()
      ),
      openGate: () => this.castle.openGate(),
      showVictory: () => this.ui.showVictory(() => this._restart()),
    };

    this._apply(this.graph.begin());
  }

  /** The current stage id, for anything that wants to read it (the browser suite does). */
  get stage() { return this.graph.stage; }

  /** True once the graph is in a terminal stage. main.js reads this. */
  get victory() { return this.graph.done; }

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
  }
}
