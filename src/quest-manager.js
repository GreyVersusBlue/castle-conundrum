// quest-manager.js — riddle logic, keystone state, gate/victory flow.
// Owns the game's single piece of quest state and drives NPC dialogue states.

export class QuestManager {
  constructor(riddleData, npcs, ui, castle, controlsRef) {
    this.riddle = riddleData;
    this.npcs = npcs;
    this.ui = ui;
    this.castle = castle;
    this.controlsRef = controlsRef; // { lock: fn } to re-lock pointer after overlays

    this.hasKeystone = false;
    this.victory = false;
    this._wrongCount = 0;

    ui.setObjective('Find someone who knows how to open the gate.');
  }

  /** Wire into InteractionSystem.onInteract */
  handleInteract(npc) {
    npc.talking = true;
    const lines = npc.getDialogueLines().map((l) =>
      l === '{RIDDLE}' ? '(The Scholar clears his throat and poses his riddle…)' : l
    );
    const hasRiddleToken = npc.getDialogueLines().includes('{RIDDLE}');

    this.ui.openDialogue(npc.name, lines, () => {
      npc.talking = false;
      if (npc.id === 'scholar' && hasRiddleToken && !this.hasKeystone) {
        this._openRiddle();
      } else if (npc.id === 'guard' && this.hasKeystone && !this.victory) {
        this._winSequence(npc);
      }
    });
  }

  _openRiddle() {
    this.ui.openRiddle(
      this.riddle.riddle,
      (answer) => this._checkAnswer(answer),
      () => this.controlsRef.lock()
    );
  }

  _checkAnswer(raw) {
    const answer = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    const accepted = this.riddle.acceptedAnswers.map((a) => a.trim().toLowerCase());
    if (accepted.includes(answer)) {
      this._grantKeystone();
    } else {
      this._wrongCount++;
      const responses = this.riddle.wrongAnswerResponses;
      let msg = responses[Math.min(this._wrongCount - 1, responses.length - 1)];
      if (this._wrongCount >= 2) msg += ` Hint: ${this.riddle.hint}`;
      this.ui.setRiddleFeedback(msg);
    }
  }

  _grantKeystone() {
    this.hasKeystone = true;
    this.ui.closeRiddle();
    for (const npc of this.npcs) npc.dialogueState = 'hasKeystone';
    this.ui.setObjective('You hold the Keystone! Present it to the Guard at the gate.');
  }

  _winSequence(guard) {
    this.victory = true;
    this.castle.openGate();
    for (const npc of this.npcs) npc.dialogueState = 'afterVictory';
    this.ui.setObjective('The gate is open. Walk free — or stay and chat.');
    // let the gate visibly swing before the victory screen appears
    setTimeout(() => this.ui.showVictory(() => window.location.reload()), 2600);
  }
}
