// ui.js — all DOM overlay wiring. No game logic lives here; quest-manager calls in.

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
      prompt: document.getElementById('interact-prompt'),
      dialogue: document.getElementById('dialogue-box'),
      dialogueName: document.getElementById('dialogue-name'),
      dialogueText: document.getElementById('dialogue-text'),
      riddle: document.getElementById('riddle-overlay'),
      riddleText: document.getElementById('riddle-text'),
      riddleInput: document.getElementById('riddle-input'),
      riddleSubmit: document.getElementById('riddle-submit'),
      riddleCancel: document.getElementById('riddle-cancel'),
      riddleFeedback: document.getElementById('riddle-feedback'),
      victory: document.getElementById('victory-screen'),
      restartBtn: document.getElementById('restart-button'),
    };

    this._dialogueLines = [];
    this._dialogueIndex = 0;
    this._onDialogueEnd = null;
    this._onRiddleSubmit = null;
    this._onRiddleClose = null;

    this.el.riddleSubmit.addEventListener('click', () => this._submitRiddle());
    this.el.riddleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submitRiddle();
      e.stopPropagation(); // don't let WASD/E leak into the game while typing
    });
    this.el.riddleCancel.addEventListener('click', () => this.closeRiddle());
  }

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

  setInteractPrompt(visible, text = '') {
    this.el.prompt.classList.toggle('hidden', !visible);
    if (text) this.el.prompt.innerHTML = text.replace(' E ', ' <b>E</b> ');
  }

  // ---- Dialogue ----
  isDialogueOpen() { return !this.el.dialogue.classList.contains('hidden'); }

  openDialogue(name, lines, onEnd) {
    this._dialogueLines = lines;
    this._dialogueIndex = 0;
    this._onDialogueEnd = onEnd || null;
    this.el.dialogueName.textContent = name;
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

  // ---- Victory ----
  showVictory(onRestart) {
    this.el.victory.classList.remove('hidden');
    document.exitPointerLock?.();
    this.el.restartBtn.onclick = onRestart;
  }
}
