// ui.js — all DOM overlay wiring. No game logic lives here; quest-manager calls
// in and hands back callbacks. Phase 7 added the three things the mystery needs
// a screen for: a toast for anything the engine says that is not a clue, the
// journal (read-only on J, and a picker when a conversation offers Present), and
// the accusation panel, which is also where the verdict and the epilogue are
// read. The victory screen went with the riddle quest.

export class UI {
  constructor() {
    this.el = {
      loading: document.getElementById('loading-screen'),
      loadingBar: document.getElementById('loading-bar'),
      loadingStatus: document.getElementById('loading-status'),
      start: document.getElementById('start-overlay'),
      startBtn: document.getElementById('start-button'),
      crosshair: document.getElementById('crosshair'),
      tracker: document.getElementById('quest-tracker'),
      objective: document.getElementById('quest-objective'),
      watch: document.getElementById('quest-watch'),
      prompt: document.getElementById('interact-prompt'),
      toast: document.getElementById('toast'),
      dialogue: document.getElementById('dialogue-box'),
      dialogueName: document.getElementById('dialogue-name'),
      dialogueText: document.getElementById('dialogue-text'),
      dialoguePresent: document.getElementById('dialogue-present'),
      riddle: document.getElementById('riddle-overlay'),
      riddleText: document.getElementById('riddle-text'),
      riddleInput: document.getElementById('riddle-input'),
      riddleSubmit: document.getElementById('riddle-submit'),
      riddleCancel: document.getElementById('riddle-cancel'),
      riddleFeedback: document.getElementById('riddle-feedback'),
      journal: document.getElementById('journal-overlay'),
      journalTitle: document.getElementById('journal-title'),
      journalList: document.getElementById('journal-list'),
      journalClose: document.getElementById('journal-close'),
      accusation: document.getElementById('accusation-overlay'),
      accusationPick: document.getElementById('accusation-pick'),
      accusationNote: document.getElementById('accusation-note'),
      accusationPeople: document.getElementById('accusation-people'),
      accusationClues: document.getElementById('accusation-clues'),
      accusationCount: document.getElementById('accusation-count'),
      accusationSay: document.getElementById('accusation-say'),
      accusationCancel: document.getElementById('accusation-cancel'),
      verdict: document.getElementById('verdict-pane'),
      verdictConvicted: document.getElementById('verdict-convicted'),
      verdictEpilogue: document.getElementById('verdict-epilogue'),
      restartBtn: document.getElementById('restart-button'),
    };

    this._dialogueLines = [];
    this._dialogueIndex = 0;
    this._onDialogueEnd = null;
    this._onPresent = null;
    this._onRiddleSubmit = null;
    this._onRiddleClose = null;
    this._onJournalPick = null;
    this._acc = null;
    this._toastTimer = null;

    this.el.riddleSubmit.addEventListener('click', () => this._submitRiddle());
    this.el.riddleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submitRiddle();
      e.stopPropagation(); // don't let WASD/E/J leak into the game while typing
    });
    this.el.riddleCancel.addEventListener('click', () => this.closeRiddle());
    // The Present button lives inside the dialogue box, and a click anywhere in
    // the box advances the dialogue. Without this the same click would show the
    // journal and step past the line that offered it.
    this.el.dialoguePresent.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._onPresent) this._onPresent();
    });
    this.el.journalClose.addEventListener('click', () => this.closeJournal());
    this.el.accusationCancel.addEventListener('click', () => this.closeAccusation());
  }

  /** Anything modal: E and J are the overlay's while one of these is up. */
  isOverlayOpen() { return this.isRiddleOpen() || this.isJournalOpen() || this.isAccusationOpen(); }

  // ---- Loading ----
  setLoadingProgress(loaded, total) {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
    this.el.loadingBar.style.width = pct + '%';
    this.el.loadingStatus.textContent = `Summoning stonework… ${loaded}/${total}`;
  }
  hideLoading() {
    this.el.loading.classList.add('fade-out');
    setTimeout(() => this.el.loading.classList.add('hidden'), 700);
  }

  // ---- Start / HUD ----
  showStart(onStart) {
    this.el.start.classList.remove('hidden');
    this.el.startBtn.onclick = () => {
      this.el.start.classList.add('hidden');
      this.el.crosshair.classList.remove('hidden');
      this.el.tracker.classList.remove('hidden');
      onStart();
    };
  }
  showStartAgain() {
    this.el.start.classList.remove('hidden');
  }

  setObjective(text) { this.el.objective.textContent = text; }

  /** Which of the four bells the castle is on. */
  setWatch(text) { if (this.el.watch) this.el.watch.textContent = text; }

  setInteractPrompt(visible, text = '') {
    this.el.prompt.classList.toggle('hidden', !visible);
    if (text) this.el.prompt.innerHTML = text.replace(' E ', ' <b>E</b> ');
  }

  /**
   * A line under the crosshair for a few seconds: a clue landing, or one of
   * mystery.json's `ui` lines. Toasts replace each other rather than queue —
   * examining the pouch lands two clues and a take, and three stacked banners
   * would cover the castle.
   */
  toast(text) {
    if (!text) return;
    this.el.toast.textContent = text;
    this.el.toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.el.toast.classList.add('hidden'), 3200);
  }

  // ---- Dialogue ----
  isDialogueOpen() { return !this.el.dialogue.classList.contains('hidden'); }

  openDialogue(name, lines, onEnd, { onPresent = null } = {}) {
    this._dialogueLines = lines;
    this._dialogueIndex = 0;
    this._onDialogueEnd = onEnd || null;
    this._onPresent = onPresent;
    this.el.dialogueName.textContent = name;
    this.el.dialoguePresent.classList.toggle('hidden', !onPresent);
    this.el.dialogue.classList.remove('hidden');
    this._showCurrentLine();
  }

  _showCurrentLine() {
    this.el.dialogueText.textContent = this._dialogueLines[this._dialogueIndex];
  }

  advanceDialogue() {
    this._dialogueIndex++;
    if (this._dialogueIndex >= this._dialogueLines.length) {
      this.closeDialogue(true);
    } else {
      this._showCurrentLine();
    }
  }

  closeDialogue(completed = false) {
    this.el.dialogue.classList.add('hidden');
    this._onPresent = null;
    this.el.dialoguePresent.classList.add('hidden');
    const cb = this._onDialogueEnd;
    this._onDialogueEnd = null;
    if (completed && cb) cb();
  }

  // ---- Riddle ----
  isRiddleOpen() { return !this.el.riddle.classList.contains('hidden'); }

  openRiddle(riddleText, onSubmit, onClose) {
    this._onRiddleSubmit = onSubmit;
    this._onRiddleClose = onClose || null;
    this.el.riddleText.textContent = riddleText;
    this.el.riddleFeedback.textContent = '';
    this.el.riddleInput.value = '';
    this.el.riddle.classList.remove('hidden');
    document.exitPointerLock?.();
    setTimeout(() => this.el.riddleInput.focus(), 50);
  }

  _submitRiddle() {
    if (this._onRiddleSubmit) this._onRiddleSubmit(this.el.riddleInput.value);
  }

  setRiddleFeedback(text) {
    this.el.riddleFeedback.textContent = text;
    this.el.riddleInput.value = '';
    this.el.riddleInput.focus();
  }

  closeRiddle() {
    this.el.riddle.classList.add('hidden');
    const cb = this._onRiddleClose;
    this._onRiddleClose = null;
    if (cb) cb();
  }

  // ---- Journal ----
  isJournalOpen() { return !this.el.journal.classList.contains('hidden'); }

  /**
   * Held clues, in the order they were found. `present` turns every row into a
   * button: that is the same list the J key shows, offered from inside a
   * conversation, and picking one presses the person in front of you with it.
   */
  openJournal(entries, { empty = '', present = null } = {}) {
    this._onJournalPick = present;
    this.el.journalTitle.textContent = present ? 'Present what?' : 'What you know';
    this.el.journalList.replaceChildren();
    if (!entries.length) {
      const p = document.createElement('p');
      p.className = 'journal-empty';
      p.textContent = empty;
      this.el.journalList.append(p);
    }
    for (const c of entries) {
      const row = document.createElement(present ? 'button' : 'div');
      row.className = 'journal-row';
      row.dataset.id = c.id; // so Tools/board-check/play-castle.mjs can click one by name
      const h = document.createElement('b');
      h.textContent = c.title;
      const t = document.createElement('span');
      t.textContent = c.text;
      row.append(h, t);
      if (present) row.addEventListener('click', () => this._onJournalPick?.(c.id));
      this.el.journalList.append(row);
    }
    this.el.journal.classList.remove('hidden');
    document.exitPointerLock?.();
  }

  closeJournal() {
    this.el.journal.classList.add('hidden');
    this._onJournalPick = null;
  }

  // ---- The accusation, the verdict and the epilogue ----
  isAccusationOpen() { return !this.el.accusation.classList.contains('hidden'); }

  /**
   * Name one of the twelve or call it a fall, and present up to `present`
   * clues. Nothing here judges anything: `onAccuse(who, clueIds)` goes to the
   * engine, and what comes back is either a note (too early, or refused) or the
   * verdict pane below.
   */
  openAccusation({ people, fall, clues, present = 3, empty = '', onAccuse, onClose }) {
    this._acc = { who: null, picked: [], present, onAccuse, onClose };
    this.el.accusationNote.textContent = '';
    this.el.verdict.classList.add('hidden');
    this.el.accusationPick.classList.remove('hidden');

    this.el.accusationPeople.replaceChildren();
    for (const p of [...people, fall]) {
      const b = document.createElement('button');
      b.className = 'pick-person';
      b.textContent = p.name;
      b.dataset.id = p.id;
      b.addEventListener('click', () => {
        this._acc.who = p.id;
        for (const other of this.el.accusationPeople.children) other.classList.toggle('on', other === b);
        this._refreshAccusation();
      });
      this.el.accusationPeople.append(b);
    }

    this.el.accusationClues.replaceChildren();
    if (!clues.length) {
      const p = document.createElement('p');
      p.className = 'journal-empty';
      p.textContent = empty;
      this.el.accusationClues.append(p);
    }
    for (const c of clues) {
      const b = document.createElement('button');
      b.className = 'pick-clue';
      b.textContent = c.title;
      b.dataset.id = c.id;
      b.addEventListener('click', () => {
        const at = this._acc.picked.indexOf(c.id);
        if (at !== -1) this._acc.picked.splice(at, 1);
        else if (this._acc.picked.length < this._acc.present) this._acc.picked.push(c.id);
        b.classList.toggle('on', this._acc.picked.includes(c.id));
        this._refreshAccusation();
      });
      this.el.accusationClues.append(b);
    }

    this.el.accusationSay.onclick = () => {
      if (!this._acc?.who) return;
      this._acc.onAccuse(this._acc.who, [...this._acc.picked]);
    };
    this._refreshAccusation();
    this.el.accusation.classList.remove('hidden');
    document.exitPointerLock?.();
  }

  _refreshAccusation() {
    const a = this._acc;
    if (!a) return;
    this.el.accusationCount.textContent = `${a.picked.length} of ${a.present}`;
    this.el.accusationSay.disabled = !a.who;
  }

  /** The Constable's "not yet" and his refusals, in the panel that is already up. */
  setAccusationNote(text) {
    if (text) this.el.accusationNote.textContent = text;
  }

  closeAccusation() {
    this.el.accusation.classList.add('hidden');
    const cb = this._acc?.onClose;
    this._acc = null;
    if (cb) cb();
  }

  /**
   * The verdict, in place of the picker. The day is over: the only way out is
   * the button, which erases the save and starts again.
   */
  showEpilogue({ convicted, epilogue }, onRestart) {
    this.el.accusationPick.classList.add('hidden');
    this.el.verdict.classList.remove('hidden');
    this.el.verdictConvicted.textContent = convicted;
    this.el.verdictEpilogue.textContent = epilogue;
    this.el.accusation.classList.remove('hidden');
    this.el.restartBtn.onclick = onRestart;
    document.exitPointerLock?.();
  }
}
