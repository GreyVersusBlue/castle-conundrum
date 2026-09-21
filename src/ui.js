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
      caption: document.getElementById('caption'),
      captionName: document.getElementById('caption-name'),
      captionLine: document.getElementById('caption-line'),
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
      journalTabQuests: document.getElementById('journal-tab-quests'),
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
      verdictReputation: document.getElementById('verdict-reputation'),
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
    // Who takes the pointer back when the last overlay goes away. main.js
    // injects it through `usePointer`; null until it does, which is every
    // Node stand-in for this class and is why `_takePointer` is a no-op then.
    this._relock = null;
    this._onJournalPick = null;
    this._acc = null;
    this._toastTimer = null;
    // The journal's three tabs (#551, #589): only meaningful cold, on J;
    // `openJournal` resets it to `clues` every time the journal opens fresh.
    this._journalTab = 'clues';
    this._journalClues = { entries: [], empty: '' };
    this._journalRead = { entries: [], empty: '' };
    this._journalMap = null;
    this._journalQuests = null;
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
    this.el.journalTabQuests?.addEventListener('click', () => this._setJournalTab('quests'));
    this.el.accusationCancel.addEventListener('click', () => this.closeAccusation());
  }

  /** Anything modal: E and J are the overlay's while one of these is up. */
  isOverlayOpen() { return this.isRiddleOpen() || this.isJournalOpen() || this.isAccusationOpen(); }

  /* ---- Who holds the pointer (#660) ----
   *
   * ONE PLACE LETS IT GO AND ONE PLACE TAKES IT BACK, and every screen that
   * covers the castle goes through both. It was four `document.exitPointerLock()`
   * calls scattered through this file and one `controlsRef.lock()` over in
   * quest-manager.js, and the arithmetic of that is a player who opens the
   * journal once and never walks again: the overlay goes away, the castle comes
   * back, and W, A, S, D and the mouse all do nothing with no panel to say why
   * (#626, #627). A fifth overlay added below inherits both halves or neither.
   *
   * A DIALOGUE IS IN THIS LIST TOO, which it never used to be. It is not modal
   * — E steps it and the player keeps the HUD — but it carries the Present
   * button, and a button is a thing you point at. While pointer lock is held
   * every pointer event goes to the locked element, so the canvas ate the click
   * and no real mouse could reach that button at all; presenting a clue is how
   * four of the twelve are pressed.
   */

  /** main.js hands over the one thing that can ask for pointer lock back. */
  usePointer(relock) { this._relock = relock; }

  /** Is anything on screen still something the player has to point at? */
  wantsPointer() { return this.isOverlayOpen() || this.isDialogueOpen(); }

  /** Every open goes through here. */
  _freePointer() { document.exitPointerLock?.(); }

  /**
   * Every close goes through here, and it asks `wantsPointer` first: shutting
   * the Present picker drops back into the dialogue that opened it, and
   * quest-manager.js's `handlePress` closes the journal and opens the next
   * lines in one call. Taking the pointer back between those two would be a
   * lock and an unlock in the same frame, which is a flicker at best and
   * Chrome's own rate limiter at worst.
   */
  _takePointer() { if (!this.wantsPointer()) this._relock?.(); }

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

  /**
   * One line of a sermon or a song, over the top of the castle (#592, #594). The
   * band is not modal and takes no input: the player keeps WASD, E and J
   * through the whole of it and can walk out of the room mid-verse, which is
   * what `clearCaption` is for. WHO IS SPEAKING IS DRAWN EVERY LINE and not
   * only on the first, because a player who looks up in the middle of a song
   * gets a voice with no name on it otherwise.
   */
  caption(name, line) {
    if (!this.el.caption) return;
    this.el.captionName.textContent = name || '';
    this.el.captionLine.textContent = line || '';
    this.el.caption.classList.remove('hidden');
  }

  /** The band goes away: the piece is over, or the player left the room. */
  clearCaption() {
    if (!this.el.caption) return;
    this.el.caption.classList.add('hidden');
    this.el.captionName.textContent = '';
    this.el.captionLine.textContent = '';
  }

  /** What the band is saying, or null. Read by the suites. */
  captionText() {
    if (!this.el.caption || this.el.caption.classList.contains('hidden')) return null;
    return this.el.captionLine.textContent;
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
    this._freePointer();
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
    // The callback first, THEN the pointer: the last line of a conversation is
    // what opens the accusation panel, and a relock in front of it would be
    // undone by that panel's own release a moment later.
    if (completed && cb) cb();
    this._takePointer();
  }

  // ---- Riddle ----
  isRiddleOpen() { return !this.el.riddle.classList.contains('hidden'); }

  openRiddle(riddleText, onSubmit) {
    this._onRiddleSubmit = onSubmit;
    this.el.riddleText.textContent = riddleText;
    this.el.riddleFeedback.textContent = '';
    this.el.riddleInput.value = '';
    this.el.riddle.classList.remove('hidden');
    this._freePointer();
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
    this._takePointer();
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
   * `quests` is the fourth (BACKLOG.md rank 9): the side quests the player has
   * met, `{id, title, objective, done}`, the open ones first and the finished
   * ones under them. Null for any of the three is that tab not offered.
   */
  openJournal(entries, { empty = '', present = null, read = null, readEmpty = '', map = null, quests = null } = {}) {
    this._onJournalPick = present;
    this._journalClues = { entries, empty };
    this._journalRead = { entries: read ?? [], empty: readEmpty };
    this._journalMap = map;
    this._journalQuests = quests;
    this._journalTab = 'clues';
    this.el.journalTabs?.classList.toggle('hidden', !!present || (read === null && map === null && quests === null));
    this.el.journalTabRead?.classList.toggle('hidden', read === null);
    this.el.journalTabMap?.classList.toggle('hidden', map === null);
    this.el.journalTabQuests?.classList.toggle('hidden', quests === null);
    this.el.journal.classList.remove('hidden');
    this._freePointer();
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
    const showingQuests = tab === 'quests' && !!this._journalQuests;
    this.el.journalTitle.textContent = present ? 'Present what?'
      : showingRead ? 'Things read' : showingMap ? 'The castle' : showingQuests ? 'Asked of you' : 'What you know';
    this.el.journalTabClues?.classList.toggle('active', !showingRead && !showingMap && !showingQuests);
    this.el.journalTabRead?.classList.toggle('active', showingRead);
    this.el.journalTabMap?.classList.toggle('active', showingMap);
    this.el.journalTabQuests?.classList.toggle('active', showingQuests);
    this.el.journalList.replaceChildren();
    if (showingMap) { this._renderJournalMap(this._journalMap); return; }
    if (showingQuests) { this._renderJournalQuests(this._journalQuests); return; }
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
   * THE OPEN QUESTS (BACKLOG.md rank 9). One row per quest the player has met:
   * its title and what it is asking of them now, which is the stage's own
   * objective and the same line the toast said once as it moved (#579). A
   * finished quest does not leave the page: it goes under the heading at the
   * bottom, struck through, because "you did this" is half of what a list of
   * errands is for. Every row is a `.journal-row[data-id][data-done]`, which is
   * what test/quest.mjs reads.
   */
  _renderJournalQuests(quests) {
    const rows = (list, done) => {
      for (const q of list) {
        const row = document.createElement('div');
        row.className = `journal-row${done ? ' quest-done' : ''}`;
        row.dataset.id = q.id;
        row.dataset.done = done ? '1' : '0';
        const h = document.createElement('b');
        h.textContent = q.title;
        const t = document.createElement('span');
        t.textContent = q.objective;
        row.append(h, t);
        this.el.journalList.append(row);
      }
    };
    const open = quests.filter((q) => !q.done);
    const done = quests.filter((q) => q.done);
    rows(open, false);
    if (done.length) {
      const h = document.createElement('h3');
      h.className = 'journal-done-head';
      h.textContent = 'Done';
      this.el.journalList.append(h);
      rows(done, true);
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
   *
   * THE ROOMS OUTSIDE THE WALLS ARE A DRAWING OF THEIR OWN (#726). Wykes's
   * yard and Mereford's street and church are rooms the plan builds and
   * nobody stands in (#703), 33 to 44 m west of the castle: on the storeys'
   * shared frame they would take it from 67.6 m wide to about 135, with the
   * castle half of it. So the storeys, their frame, their "n of m" and the
   * count read only the rooms that are not `ward: "outside"`, and the outside
   * rooms get a last drawing on their own frame, dashed and named from the
   * first: a name earned by standing somewhere nobody can stand is never
   * earned. The split is on the room's own `ward`, so the map is still the
   * plan's list and not a second one (#588).
   */
  _renderJournalMap(rooms) {
    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs = {}) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      return el;
    };
    const outside = rooms.filter((r) => r.ward === 'outside');
    const castle = rooms.filter((r) => r.ward !== 'outside');
    const stood = castle.filter((r) => r.visited).length;
    const count = document.createElement('p');
    count.id = 'journal-map-count';
    count.className = 'journal-map-count';
    count.textContent = `${stood} of ${castle.length} rooms stood in`;
    this.el.journalList.append(count);
    if (!rooms.length) return;
    // A frame round some rooms: their whole extent plus a metre.
    const pad = 1;
    const frameOf = (list) => {
      const minX = Math.min(...list.map((r) => r.bounds.min.x)) - pad;
      const maxX = Math.max(...list.map((r) => r.bounds.max.x)) + pad;
      const minZ = Math.min(...list.map((r) => r.bounds.min.z)) - pad;
      const maxZ = Math.max(...list.map((r) => r.bounds.max.z)) + pad;
      return `${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`;
    };
    const shapeOf = (r, attrs) => (r.shape?.kind === 'disc'
      ? svgEl('circle', { cx: r.shape.cx, cy: r.shape.cz, r: r.shape.radius, ...attrs })
      : svgEl('rect', { x: r.bounds.min.x, y: r.bounds.min.z, width: r.bounds.max.x - r.bounds.min.x, height: r.bounds.max.z - r.bounds.min.z, ...attrs }));
    // One frame for every storey: the castle's own extent, not the town's.
    const frame = castle.length ? frameOf(castle) : null;
    const levels = [...new Set(castle.map((r) => r.level))].sort((a, b) => a - b);
    for (const level of levels) {
      const here = castle.filter((r) => r.level === level);
      const section = document.createElement('section');
      section.className = 'map-storey';
      section.dataset.level = level;
      const h = document.createElement('h3');
      h.textContent = `${STOREY_NAMES[level] ?? `Level ${level}`} — ${here.filter((r) => r.visited).length} of ${here.length}`;
      const svg = svgEl('svg', { viewBox: frame, class: 'map-plan', role: 'img', 'aria-label': h.textContent });
      const names = document.createElement('div');
      names.className = 'map-names';
      for (const r of here) {
        const isHere = r.id === this._roomHere;
        const attrs = { class: `map-room${r.visited ? ' visited' : ''}${isHere ? ' here' : ''}`, 'data-id': r.id, 'data-visited': r.visited ? '1' : '0' };
        const shape = shapeOf(r, attrs);
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
    if (!outside.length) return;
    const section = document.createElement('section');
    section.className = 'map-storey map-outside';
    section.dataset.level = 'outside';
    const h = document.createElement('h3');
    h.textContent = 'Outside the walls';
    const svg = svgEl('svg', { viewBox: frameOf(outside), class: 'map-plan', role: 'img', 'aria-label': h.textContent });
    const names = document.createElement('div');
    names.className = 'map-names';
    for (const r of outside) {
      const attrs = { class: 'map-room seen', 'data-id': r.id, 'data-outside': '1', 'data-visited': '0' };
      const shape = shapeOf(r, attrs);
      const title = svgEl('title');
      title.textContent = `${r.name} (seen from the walls)`;
      shape.append(title);
      svg.append(shape);
      const name = document.createElement('span');
      name.className = attrs.class;
      name.dataset.id = r.id;
      name.dataset.outside = '1';
      name.dataset.visited = '0';
      name.textContent = r.name;
      name.title = 'Seen from the walls';
      names.append(name);
    }
    section.append(h, svg, names);
    this.el.journalList.append(section);
  }

  closeJournal() {
    this.el.journal.classList.add('hidden');
    this._onJournalPick = null;
    this._takePointer();
  }

  // ---- The accusation, the verdict and the epilogue ----
  isAccusationOpen() { return !this.el.accusation.classList.contains('hidden'); }

  /**
   * Name one of the twelve or call it a fall, and present up to `present`
   * clues. Nothing here judges anything: `onAccuse(who, clueIds)` goes to the
   * engine, and what comes back is either a note (too early, or refused) or the
   * verdict pane below.
   */
  openAccusation({ people, fall, clues, present = 3, empty = '', onAccuse }) {
    this._acc = { who: null, picked: [], present, onAccuse };
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
    this._freePointer();
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
    this._acc = null;
    this._takePointer();
  }

  /**
   * The verdict, in place of the picker. The only way out is the button, and
   * what the button says is the caller's (#537): "The next morning" at the end
   * of a day one that has a second day behind it, "Play Again" at the end of
   * the second day or of a verdict that has none. The pane is the same pane
   * both times, because the second day ends where the first one did.
   */
  showEpilogue({ convicted, epilogue, reputation = null }, onButton, { label = 'Play Again' } = {}) {
    this.el.accusationPick.classList.add('hidden');
    this.el.verdict.classList.remove('hidden');
    this.el.verdictConvicted.textContent = convicted;
    this.el.verdictEpilogue.textContent = epilogue;
    // Null is a player who ran no errand, and the line is not there at all.
    this.el.verdictReputation.textContent = reputation ?? '';
    this.el.verdictReputation.classList.toggle('hidden', !reputation);
    this.el.accusation.classList.remove('hidden');
    this.el.restartBtn.textContent = label;
    this.el.restartBtn.onclick = onButton;
    this._freePointer();
  }
}
