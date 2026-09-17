// ui.js — all DOM overlay wiring. No game logic lives here; quest-manager calls
// in and hands back callbacks. Phase 7 added the three things the mystery needs
// a screen for: a toast for anything the engine says that is not a clue, the
// journal (read-only on J, and a picker when a conversation offers Present), and
// the accusation panel, which is also where the verdict and the epilogue are
// read. The victory screen went with the riddle quest.

/** What the map calls each storey (#589). The levels are the plan's; the words are here. */
const STOREY_NAMES = { 0: 'The ground', 1: 'The first floor', 2: 'The wall walks and the top rooms', 3: 'The tower roofs' };

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
      room: document.getElementById('hud-room'),
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
      journalTabs: document.getElementById('journal-tabs'),
      journalTabClues: document.getElementById('journal-tab-clues'),
      journalTabRead: document.getElementById('journal-tab-read'),
      journalTabMap: document.getElementById('journal-tab-map'),
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
      hint: document.getElementById('controls-hint'),
      touchToggle: document.getElementById('touch-toggle'),
      touchHud: document.getElementById('touch-hud'),
      touchRing: document.getElementById('touch-ring'),
      touchKnob: document.getElementById('touch-knob'),
      touchE: document.getElementById('touch-e'),
      touchJ: document.getElementById('touch-j'),
    };

    // The two control hints, one per scheme (#530). Held here rather than in
    // index.html's markup so the toggle can swap them without a reload.
    this._hints = {
      mouse: this.el.hint ? this.el.hint.innerHTML : '',
      touch: 'Left thumb — move &nbsp;·&nbsp; Right thumb — look &nbsp;·&nbsp; Push the stick over — sprint &nbsp;·&nbsp; E — talk / examine / ring &nbsp;·&nbsp; Journal',
    };
    this._touch = false;

    this._dialogueLines = [];
    this._dialogueIndex = 0;
    this._onDialogueEnd = null;
    this._onPresent = null;
    this._onRiddleSubmit = null;
    this._onRiddleClose = null;
    this._onJournalPick = null;
    this._acc = null;
    this._toastTimer = null;
    // The journal's three tabs (#551, #589): only meaningful cold, on J;
    // `openJournal` resets it to `clues` every time the journal opens fresh.
    this._journalTab = 'clues';
    this._journalClues = { entries: [], empty: '' };
    this._journalRead = { entries: [], empty: '' };
    this._journalMap = null;
    // The id of the room the HUD's line names, or null on open ground: the
    // map's "you are here" is read off the same answer as the line (#515).
    this._roomHere = null;

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
    this.el.journalTabClues?.addEventListener('click', () => this._setJournalTab('clues'));
    this.el.journalTabRead?.addEventListener('click', () => this._setJournalTab('read'));
    this.el.journalTabMap?.addEventListener('click', () => this._setJournalTab('map'));
    this.el.accusationCancel.addEventListener('click', () => this.closeAccusation());
  }

  /** Anything modal: E and J are the overlay's while one of these is up. */
  isOverlayOpen() { return this.isRiddleOpen() || this.isJournalOpen() || this.isAccusationOpen(); }

  /* ---- The thumb's HUD (#530) ---- */

  /** Is the touch scheme showing? */
  isTouch() { return this._touch; }

  /**
   * Show or hide the touch HUD and swap the start panel's control hint. The
   * page picks the first value by detection and the toggle changes it; both go
   * through here, so there is one place that knows what "touch mode" looks
   * like on the screen.
   */
  setTouch(on) {
    this._touch = !!on;
    this.el.touchHud?.classList.toggle('hidden', !this._touch);
    document.body.classList.toggle('touch', this._touch);
    if (this.el.hint) this.el.hint.innerHTML = this._touch ? this._hints.touch : this._hints.mouse;
    if (this.el.touchToggle) this.el.touchToggle.textContent = `Touch controls: ${this._touch ? 'on' : 'off'}`;
    if (!this._touch) this.setStick(null);
  }

  /** The toggle on the start panel: `fn(next)` is called with the new state. */
  onTouchToggle(fn) {
    if (!this.el.touchToggle) return;
    this.el.touchToggle.onclick = () => fn(!this._touch);
  }

  /** The E and Journal buttons. Both call straight into InteractionSystem. */
  onTouchButtons({ interact, journal }) {
    if (this.el.touchE) this.el.touchE.onclick = () => interact();
    if (this.el.touchJ) this.el.touchJ.onclick = () => journal();
  }

  /** Where the left thumb is, in CSS pixels, or null when it has let go. */
  setStick(at) {
    const ring = this.el.touchRing, knob = this.el.touchKnob;
    if (!ring || !knob) return;
    if (!at) { ring.classList.add('hidden'); return; }
    ring.classList.remove('hidden');
    ring.style.left = `${at.x0}px`;
    ring.style.top = `${at.y0}px`;
    knob.style.left = `${33 + (at.x - at.x0)}px`;
    knob.style.top = `${33 + (at.y - at.y0)}px`;
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

  /** Which of the four bells the castle is on. */
  setWatch(text) { if (this.el.watch) this.el.watch.textContent = text; }

  /** Where the player is, by name (#515). */
  /** The HUD's room line (#515), and with it the room id the map marks as here. */
  setRoom(text, id = null) { if (this.el.room) this.el.room.textContent = text; this._roomHere = id; }

  setInteractPrompt(visible, text = '') {
    this.el.prompt.classList.toggle('hidden', !visible);
    if (text) this.el.prompt.innerHTML = text.replace(' E ', ' <b>E</b> ');
    // The touch E button wears the prompt's own words, minus the key that is
    // not there: one button that means talk, examine or ring depending on what
    // is in front of the player, which is what the row asked for (#530).
    if (this.el.touchE) {
      this.el.touchE.textContent = visible && text
        ? text.replace(/^Press E to\s*/i, '').trim() || 'E'
        : 'E';
      this.el.touchE.disabled = false;
    }
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
   * Held clues, in the order they were found, and — cold, on J, never from a
   * conversation's Present picker — the documents read, same order (#551).
   * `present` turns every clue row into a button: that is the same list the J
   * key shows, offered from inside a conversation, and picking one presses the
   * person in front of you with it. The two tabs only appear when `present` is
   * null: presenting is about clues alone, and offering "Things read" as
   * something to present would open a document on a press of the button that
   * is supposed to hand over evidence. `map` is the third tab (#589): every
   * room the plan builds, `{id, name, level, bounds, shape, visited}`, drawn
   * as the castle's plan a storey at a time and filled in as they are entered.
   */
  openJournal(entries, { empty = '', present = null, read = null, readEmpty = '', map = null } = {}) {
    this._onJournalPick = present;
    this._journalClues = { entries, empty };
    this._journalRead = { entries: read ?? [], empty: readEmpty };
    this._journalMap = map;
    this._journalTab = 'clues';
    this.el.journalTabs?.classList.toggle('hidden', !!present || (read === null && map === null));
    this.el.journalTabRead?.classList.toggle('hidden', read === null);
    this.el.journalTabMap?.classList.toggle('hidden', map === null);
    this.el.journal.classList.remove('hidden');
    document.exitPointerLock?.();
    this._renderJournalTab();
  }

  /** Switch tabs without re-opening the overlay; a no-op mid-Present. */
  _setJournalTab(tab) {
    if (this._onJournalPick) return;
    this._journalTab = tab;
    this._renderJournalTab();
  }

  _renderJournalTab() {
    const present = this._onJournalPick;
    const tab = present ? 'clues' : this._journalTab;
    const showingRead = tab === 'read';
    const showingMap = tab === 'map' && !!this._journalMap;
    this.el.journalTitle.textContent = present ? 'Present what?' : showingRead ? 'Things read' : showingMap ? 'The castle' : 'What you know';
    this.el.journalTabClues?.classList.toggle('active', !showingRead && !showingMap);
    this.el.journalTabRead?.classList.toggle('active', showingRead);
    this.el.journalTabMap?.classList.toggle('active', showingMap);
    this.el.journalList.replaceChildren();
    if (showingMap) { this._renderJournalMap(this._journalMap); return; }
    const { entries, empty } = showingRead ? this._journalRead : this._journalClues;
    if (!entries.length) {
      const p = document.createElement('p');
      p.className = 'journal-empty';
      p.textContent = empty;
      this.el.journalList.append(p);
    }
    for (const c of entries) {
      const row = document.createElement(present ? 'button' : 'div');
      row.className = 'journal-row';
      row.dataset.id = c.id; // so test/play-castle.mjs can click one by name
      const h = document.createElement('b');
      h.textContent = c.title;
      const t = document.createElement('span');
      t.textContent = c.text;
      row.append(h, t);
      if (present) row.addEventListener('click', () => this._onJournalPick?.(c.id));
      this.el.journalList.append(row);
    }
  }

  /**
   * THE MAP (#589). One drawing per storey, every storey on the same frame so
   * a tower's rooms stack under each other down the page, each room the
   * shape the plan gives it — a disc for a tower interior, a box for
   * everything else — in world metres straight into the SVG's user space,
   * north up because the plan's -z is north. A room stood in is filled, a
   * room not yet stood in is an outline, and the one the HUD's line names is
   * ringed. Under each drawing the same rooms by name, because forty unlabelled
   * shapes is a puzzle and the journal is not where the puzzles are. Every
   * room is a `.map-room[data-id][data-visited]` twice over, shape and name,
   * which is what test/map.mjs reads.
   */
  _renderJournalMap(rooms) {
    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs = {}) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      return el;
    };
    const stood = rooms.filter((r) => r.visited).length;
    const count = document.createElement('p');
    count.id = 'journal-map-count';
    count.className = 'journal-map-count';
    count.textContent = `${stood} of ${rooms.length} rooms stood in`;
    this.el.journalList.append(count);
    if (!rooms.length) return;
    // One frame for every storey: the castle's whole extent plus a metre.
    const pad = 1;
    const minX = Math.min(...rooms.map((r) => r.bounds.min.x)) - pad;
    const maxX = Math.max(...rooms.map((r) => r.bounds.max.x)) + pad;
    const minZ = Math.min(...rooms.map((r) => r.bounds.min.z)) - pad;
    const maxZ = Math.max(...rooms.map((r) => r.bounds.max.z)) + pad;
    const levels = [...new Set(rooms.map((r) => r.level))].sort((a, b) => a - b);
    for (const level of levels) {
      const here = rooms.filter((r) => r.level === level);
      const section = document.createElement('section');
      section.className = 'map-storey';
      section.dataset.level = level;
      const h = document.createElement('h3');
      h.textContent = `${STOREY_NAMES[level] ?? `Level ${level}`} — ${here.filter((r) => r.visited).length} of ${here.length}`;
      const svg = svgEl('svg', { viewBox: `${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`, class: 'map-plan', role: 'img', 'aria-label': h.textContent });
      const names = document.createElement('div');
      names.className = 'map-names';
      for (const r of here) {
        const isHere = r.id === this._roomHere;
        const attrs = { class: `map-room${r.visited ? ' visited' : ''}${isHere ? ' here' : ''}`, 'data-id': r.id, 'data-visited': r.visited ? '1' : '0' };
        const shape = r.shape?.kind === 'disc'
          ? svgEl('circle', { cx: r.shape.cx, cy: r.shape.cz, r: r.shape.radius, ...attrs })
          : svgEl('rect', { x: r.bounds.min.x, y: r.bounds.min.z, width: r.bounds.max.x - r.bounds.min.x, height: r.bounds.max.z - r.bounds.min.z, ...attrs });
        const title = svgEl('title');
        title.textContent = r.visited ? r.name : `${r.name} (not yet)`;
        shape.append(title);
        svg.append(shape);
        const name = document.createElement('span');
        name.className = attrs.class;
        name.dataset.id = r.id;
        name.dataset.visited = attrs['data-visited'];
        name.textContent = r.visited ? r.name : '· · ·';
        name.title = r.visited ? r.name : 'Not yet stood in';
        names.append(name);
      }
      section.append(h, svg, names);
      this.el.journalList.append(section);
    }
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
   * The verdict, in place of the picker. The only way out is the button, and
   * what the button says is the caller's (#537): "The next morning" at the end
   * of a day one that has a second day behind it, "Play Again" at the end of
   * the second day or of a verdict that has none. The pane is the same pane
   * both times, because the second day ends where the first one did.
   */
  showEpilogue({ convicted, epilogue }, onButton, { label = 'Play Again' } = {}) {
    this.el.accusationPick.classList.add('hidden');
    this.el.verdict.classList.remove('hidden');
    this.el.verdictConvicted.textContent = convicted;
    this.el.verdictEpilogue.textContent = epilogue;
    this.el.accusation.classList.remove('hidden');
    this.el.restartBtn.textContent = label;
    this.el.restartBtn.onclick = onButton;
    document.exitPointerLock?.();
  }
}
