// quest-graph.js — the quest as data, and nothing else. No DOM, no three, no
// timers: a stage machine read out of data/quest.json, plus the riddle's
// answer-judging, both plain enough to run in Node. quest-manager.js is the
// adapter that turns the effects this returns into UI calls; test/quest.mjs
// drives this file directly.
//
// The previous manager was two booleans (`hasKeystone`, `victory`) and an
// if/else that knew the Scholar's and the Guard's ids by name. Nothing could
// check it without a browser and a walk. Here the graph is validated before it
// runs — every `to` names a stage, every action names something the manager
// implements, every stage can reach the end — and the manager's own coupling to
// npcs.json (a stage's dialogueState has to exist on every npc, or the dialogue
// box opens on `undefined`) is checked by `validateAgainstNpcs`.

/**
 * What a graph definition has to look like. Throws a single Error naming every
 * problem found, so a broken quest.json fails at load and not on the walk to the
 * Guard. `actions` is the list of action names the runtime implements.
 */
export function validateQuest(def, actions) {
  const problems = [];
  const stages = def?.stages && typeof def.stages === 'object' ? def.stages : null;
  if (!stages) return ['`stages` is missing or not an object'];
  const ids = Object.keys(stages);
  if (ids.length === 0) problems.push('`stages` is empty');
  if (typeof def.start !== 'string' || !stages[def.start]) problems.push(`\`start\` (${JSON.stringify(def.start)}) is not a stage`);

  const known = new Set(actions);
  const checkAction = (a, where) => {
    const name = typeof a === 'string' ? a : a?.do;
    if (typeof name !== 'string' || !known.has(name)) problems.push(`${where}: unknown action ${JSON.stringify(name)} (known: ${[...known].join(', ')})`);
    if (a && typeof a === 'object' && 'after' in a && !(Number.isFinite(a.after) && a.after >= 0)) problems.push(`${where}: \`after\` must be a non-negative number of ms`);
  };

  const objectives = new Map();
  for (const id of ids) {
    const s = stages[id];
    if (typeof s.objective !== 'string' || !s.objective.trim()) problems.push(`${id}: \`objective\` must be a non-empty string`);
    else if (objectives.has(s.objective)) problems.push(`${id}: objective is the same text as ${objectives.get(s.objective)} — the tracker could not show which stage the player is in`);
    else objectives.set(s.objective, id);
    if (typeof s.dialogueState !== 'string' || !s.dialogueState) problems.push(`${id}: \`dialogueState\` must be a non-empty string`);
    const transitions = s.transitions ?? [];
    if (!Array.isArray(transitions)) problems.push(`${id}: \`transitions\` must be an array`);
    else {
      if (s.terminal && transitions.some((t) => t.to)) problems.push(`${id}: a terminal stage has a transition that leaves it`);
      const seen = new Set();
      transitions.forEach((t, i) => {
        const where = `${id}.transitions[${i}]`;
        if (typeof t.on !== 'string' || !t.on) problems.push(`${where}: \`on\` must name an event`);
        else if (seen.has(t.on)) problems.push(`${where}: a second transition on ${t.on} — only the first would ever fire`);
        else seen.add(t.on);
        if ('to' in t && !stages[t.to]) problems.push(`${where}: \`to\` names no stage (${JSON.stringify(t.to)})`);
        if (!('to' in t) && !(t.do?.length)) problems.push(`${where}: neither moves nor does anything`);
        for (const a of t.do ?? []) checkAction(a, where);
      });
    }
    for (const a of s.enter ?? []) checkAction(a, `${id}.enter`);
  }

  // Reachability, both ways: every stage from the start, and some terminal stage
  // from every stage. A stage nothing leads to is dead data; a stage that cannot
  // reach the end is a quest the player can strand themselves in.
  if (stages[def.start]) {
    const next = (id) => (stages[id].transitions ?? []).map((t) => t.to).filter((to) => to && stages[to]);
    const reach = new Set([def.start]);
    for (const q = [def.start]; q.length;) for (const to of next(q.shift())) if (!reach.has(to)) { reach.add(to); q.push(to); }
    for (const id of ids) if (!reach.has(id)) problems.push(`${id}: no path from \`start\` reaches it`);
    const terminals = ids.filter((id) => stages[id].terminal);
    if (!terminals.length) problems.push('no stage is `terminal`');
    for (const id of ids) {
      const seen = new Set([id]);
      for (const q = [id]; q.length;) for (const to of next(q.shift())) if (!seen.has(to)) { seen.add(to); q.push(to); }
      if (!terminals.some((t) => seen.has(t))) problems.push(`${id}: no path from it reaches a terminal stage`);
    }
  }
  return problems;
}

/**
 * The graph against the cast it drives. Every stage's dialogueState has to be a
 * non-empty list of strings on every npc; every `{TOKEN}` in a line has to be in
 * `tokens`. And an overlay is opened by exactly the conversations that end in
 * its token, in both directions: a stage that opens it on `talked:x` needs lines
 * that offer it, and lines that offer it need a stage that opens it.
 *
 * THE RAIL IS A LIST OF PAIRS, NOT THE RIDDLE (Phase 7). It was written for one
 * pair, `openRiddle`/`{RIDDLE}`, and hard-coded both names. The accusation is
 * the same shape — the Constable's `default` lines end in `{ACCUSE}` the way the
 * Scholar's ended in `{RIDDLE}`, and `openAccusation` is what a stage does about
 * it — so `pairs` is the argument now and the riddle is its default entry. A
 * second pair costs a line of data; without this it cost a second copy of forty
 * lines of checking.
 *
 * A TOKEN MAY ALSO BE A LOCK, and from Phase 4 the riddle is. `lock:<id>` is the
 * player pressing E at a word-locked door, so an action on a `lock:` event is
 * the other legal shape and nobody poses it. What this file cannot check is that
 * the lock exists: it knows the graph and the cast and not the castle.
 * `test/quest.mjs` reads scene-config.json and mystery.json and holds every
 * `lock:<id>` here to a door that is really there and really starts shut.
 */
export function validateAgainstNpcs(def, npcs, { pairs = [{ action: 'openRiddle', token: '{RIDDLE}' }] } = {}) {
  const problems = [];
  const stages = def.stages ?? {};
  const tokens = def.tokens ?? {};
  for (const [id, s] of Object.entries(stages)) {
    for (const npc of npcs) {
      const lines = npc.dialogue?.[s.dialogueState];
      if (!Array.isArray(lines) || !lines.length || lines.some((l) => typeof l !== 'string' || !l.trim())) {
        problems.push(`${id}: npc ${npc.id} has no \`dialogue.${s.dialogueState}\` lines — the dialogue box would open on undefined`);
      }
    }
  }
  for (const npc of npcs) {
    for (const [state, lines] of Object.entries(npc.dialogue ?? {})) {
      for (const line of lines) {
        for (const tok of line.match(/\{[A-Z_]+\}/g) ?? []) {
          if (!(tok in tokens)) problems.push(`npc ${npc.id}, dialogue.${state}: token ${tok} is not in quest.tokens`);
        }
      }
    }
  }
  // One pass per pair. `posers` is the "npcId/state" whose lines carry the
  // token; `openers` is the "npcId/state" a stage runs the action after. Each
  // set has to be the other, or somebody offers something no stage answers, or
  // a stage answers something nobody offers.
  for (const { action, token } of pairs) {
    const posers = new Set();
    for (const npc of npcs) {
      for (const [state, lines] of Object.entries(npc.dialogue ?? {})) {
        if (lines.includes(token)) posers.add(`${npc.id}/${state}`);
      }
    }
    const openers = new Set();
    for (const [id, s] of Object.entries(stages)) {
      for (const t of s.transitions ?? []) {
        const does = (t.do ?? []).map((a) => (typeof a === 'string' ? a : a.do));
        if (!does.includes(action)) continue;
        const m = /^talked:(.+)$/.exec(t.on);
        if (m) { openers.add(`${m[1]}/${s.dialogueState}`); continue; }
        if (/^lock:.+$/.test(t.on)) continue;
        problems.push(`${id}: ${action} runs on ${t.on}, which is neither the end of a conversation (talked:<npc>) nor a word-lock (lock:<id>)`);
      }
    }
    for (const p of posers) if (!openers.has(p)) problems.push(`npc/state ${p} poses ${token} but no stage in that dialogueState runs ${action} after that conversation`);
    for (const o of openers) if (!posers.has(o)) problems.push(`${action} runs after ${o} but those lines never pose it (${token})`);
  }
  return problems;
}

/** Dialogue lines with `{TOKEN}`s substituted. Unknown tokens are left as they are. */
export function renderLines(lines, tokens = {}) {
  return lines.map((l) => (l in tokens ? tokens[l] : l));
}

/**
 * Judge one riddle answer. Pure: `wrongCount` is how many wrong answers came
 * before this one, and the result carries the new count. Whitespace and case
 * are ignored; the hint joins from the second wrong answer on; the responses
 * escalate and then hold at the last.
 */
export function judgeAnswer(riddle, raw, wrongCount = 0) {
  const answer = String(raw ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const accepted = riddle.acceptedAnswers.map((a) => a.trim().toLowerCase());
  if (accepted.includes(answer)) return { ok: true, wrongCount };
  const n = wrongCount + 1;
  const responses = riddle.wrongAnswerResponses;
  let feedback = responses[Math.min(n - 1, responses.length - 1)];
  if (n >= 2) feedback += ` Hint: ${riddle.hint}`;
  return { ok: false, wrongCount: n, feedback };
}

const asAction = (a) => (typeof a === 'string' ? { type: 'action', name: a } : { type: 'action', name: a.do, after: a.after });

export class QuestGraph {
  /**
   * @param def the parsed quest.json
   * @param actions names of the actions the runtime implements, for validation
   */
  constructor(def, actions) {
    const problems = validateQuest(def, actions);
    if (problems.length) throw new Error(`quest.json is not a valid quest graph:\n  - ${problems.join('\n  - ')}`);
    this.def = def;
    this.stage = def.start;
  }

  get current() { return this.def.stages[this.stage]; }
  get objective() { return this.current.objective; }
  get dialogueState() { return this.current.dialogueState; }
  get done() { return !!this.current.terminal; }
  get tokens() { return this.def.tokens ?? {}; }

  /** Every event any transition listens for. */
  events() {
    return [...new Set(Object.values(this.def.stages).flatMap((s) => (s.transitions ?? []).map((t) => t.on)))];
  }

  /** The effects of arriving in the start stage: objective, dialogue state, enter actions. */
  begin() {
    this.stage = this.def.start;
    return this._enterEffects();
  }

  /**
   * Feed one event in. Returns the effects to apply, in order, and an empty list
   * when the current stage has nothing for it — an unknown event, a repeat, or a
   * terminal stage — so callers never need to guard.
   */
  dispatch(event) {
    const t = (this.current.transitions ?? []).find((x) => x.on === event);
    if (!t) return [];
    const effects = (t.do ?? []).map(asAction);
    if (t.to) {
      this.stage = t.to;
      effects.push(...this._enterEffects());
    }
    return effects;
  }

  _enterEffects() {
    const s = this.current;
    return [
      { type: 'stage', id: this.stage },
      { type: 'objective', text: s.objective },
      { type: 'dialogueState', state: s.dialogueState },
      ...(s.enter ?? []).map(asAction),
    ];
  }
}

/* ------------------------------------------------------------ side quests ---
 * BACKLOG.md rank 8. A side quest is the same graph this file already
 * validates, in its own file under data/quests/, driving one person's lines
 * and nothing else. What makes it a side quest rather than a second mystery is
 * what it may not do, and that is what `validateQuestSet` is: the per-file
 * checks `validateQuest` already runs, plus six rules across the set.
 *
 * WHY THE RULES ARE ABOUT `dialogueState` AND NOT ABOUT AN EFFECT. The obvious
 * reading of "a quest never gates or removes a mystery clue" (#550, question 6)
 * is an effect that writes a clue key, and there is no such effect: a side
 * quest's action list is empty in this increment and the engine's idea of who
 * is in what state is `st.pressed` (src/mystery.js:879), which nothing in
 * data/quests/ can reach. So a side quest cannot grant a clue by accident, and
 * a rule against an effect that does not exist would be a rule with nothing to
 * bite.
 *
 * What a side quest CAN do is name a state the clue graph owns. Put the Clerk
 * in `cornered` from a side quest and quest-manager.js's `_syncStates` will
 * show his confession to a player who never pressed him: the clue is not
 * granted, but the text that is the reward for granting it is on screen for
 * free. That is the real shape of the violation, it is the key the rule names,
 * and `test/quest.mjs` breaks it on purpose.
 */

/** The two wards a side quest can belong to: the outer ward's errands, the inner ward's confidences. */
export const WARDS = ['outer', 'inner'];

/** The event shapes the game emits, for holding a quest's `on` to something real. */
const EVENT_SHAPES = [
  [/^clue:(.+)$/, 'clues'],
  [/^talked:(.+)$/, 'npcs'],
  [/^press:([^:]+):(.+)$/, 'press'],
  [/^bell:(\d+)$/, 'bells'],
  [/^lock:(.+)$/, 'locks'],
  [/^accused:(.+)$/, 'accusables'],
  [/^verdict:(full|right|wrong|fall)$/, null],
  [/^(riddle:solved|ask:journal|ask:accuse|day:2)$/, null],
];

/**
 * Every side quest in data/quests/, against each other, the cast and the
 * mystery. Returns a flat list of problems naming the file, so a bad quest
 * fails a Node suite rather than a walk.
 *
 * @param quests  [{ file, def }] — the parsed files, with the name they came from
 * @param npcs    data/npcs.json's `cast`
 * @param mystery data/mystery.json
 * @param actions the action names quest-manager.js implements for side quests
 * @param tokens  the keys of data/quest.json's `tokens`, or none. Rule 6 is the
 *                only thing that reads them: a person whose `default` lines pose
 *                one of these is a person a quest may not park out of `default`.
 * @param reputation data/npcs.json's `reputation` (BACKLOG.md rank 8), or null.
 *                 It is checked here and nowhere else because this is the only
 *                 function that knows how many errands each ward actually has,
 *                 which is the one thing a threshold can be wrong about.
 */
export function validateQuestSet(quests, { npcs = [], mystery = {}, actions = [], tokens = [], reputation = null } = {}) {
  const problems = [];
  const cast = new Map(npcs.map((n) => [n.id, n]));
  const clueIds = new Set((mystery.clues ?? []).map((c) => c.id));
  const lockIds = new Set((mystery.locks ?? []).map((l) => l.id));
  const bells = (mystery.watches ?? []).length;
  const accusables = new Set([...Object.keys(mystery.schedule ?? {}), 'nobody']);

  // Which states the clue graph owns, per npc: every state a statement is
  // sourced from, and every state a press moves somebody into. `default` is
  // nobody's to own — it is the floor every stage in every graph stands on.
  const owned = new Map();
  const own = (npc, state, why) => {
    if (!npc || !state || state === 'default') return;
    if (!owned.has(npc)) owned.set(npc, new Map());
    if (!owned.get(npc).has(state)) owned.get(npc).set(state, why);
  };
  for (const c of mystery.clues ?? []) own(c.source?.npc, c.source?.state, `clue ${c.id}`);
  for (const p of mystery.presses ?? []) own(p.npc, p.to, `press on ${p.on}`);

  const seenIds = new Map();
  const voices = new Map(); // npc -> [{file, states}]

  for (const { file, def } of quests) {
    const at = (msg) => problems.push(`${file}: ${msg}`);
    for (const p of validateQuest(def, actions)) at(p);

    const base = String(file).replace(/\.json$/, '');
    if (typeof def.id !== 'string' || !def.id.trim()) at('`id` must be a non-empty string');
    else {
      if (def.id !== base) at(`\`id\` is ${JSON.stringify(def.id)} but the file is ${JSON.stringify(base)} — the save keys quests by id and a session reading the directory keys them by name`);
      if (seenIds.has(def.id)) at(`a second quest with id ${JSON.stringify(def.id)} (${seenIds.get(def.id)})`);
      else seenIds.set(def.id, file);
    }
    if (typeof def.title !== 'string' || !def.title.trim()) at('`title` must be a non-empty string');
    // `ward` is which of the two counters reputation-by-ward will move when it
    // comes (SPECS.md, rank 8). A file that names neither is a favour nobody
    // remembers, and a file that spells one wrong is the same thing found later.
    if (!WARDS.includes(def.ward)) at(`\`ward\` is ${JSON.stringify(def.ward)} and has to be one of ${WARDS.join(', ')}`);

    const npc = cast.get(def.npc);
    if (!npc) { at(`\`npc\` (${JSON.stringify(def.npc)}) is not an id in npcs.json's cast`); continue; }

    const states = [...new Set(Object.values(def.stages ?? {}).map((s) => s.dialogueState).filter((s) => typeof s === 'string'))];
    for (const state of states) {
      if (!Array.isArray(npc.dialogue?.[state]) || !npc.dialogue[state].length) {
        at(`${def.npc} has no \`dialogue.${state}\` lines — the dialogue box would open on undefined`);
      }
    }

    // Rule 1, the clue-isolation rule (#550, question 6). A side quest may not
    // put its person into a state the mystery's clue graph owns.
    for (const state of states) {
      const why = owned.get(def.npc)?.get(state);
      if (why) at(`a stage puts ${def.npc} in \`${state}\`, which is a state mystery.json's clue graph owns (${why}) — a side quest never gates or removes a mystery clue (#550, question 6)`);
    }

    // Rule 2's half: collect who speaks for whom.
    const spoken = states.filter((s) => s !== 'default');
    if (spoken.length) {
      if (!voices.has(def.npc)) voices.set(def.npc, []);
      voices.get(def.npc).push({ file, states: spoken });
    }

    // Rule 3: every event a transition listens for is one the game emits.
    for (const [id, s] of Object.entries(def.stages ?? {})) {
      for (const t of s.transitions ?? []) {
        if (typeof t.on !== 'string' || !t.on) continue;
        const shape = EVENT_SHAPES.find(([re]) => re.test(t.on));
        if (!shape) { at(`${id}: \`on\` is ${JSON.stringify(t.on)}, which is not an event this game emits`); continue; }
        const [re, kind] = shape;
        const m = re.exec(t.on);
        const bad =
          kind === 'clues' ? (!clueIds.has(m[1]) && `no clue ${m[1]} in mystery.json`)
          : kind === 'npcs' ? (!cast.has(m[1]) && `no npc ${m[1]} in npcs.json`)
          : kind === 'press' ? (!cast.has(m[1]) ? `no npc ${m[1]} in npcs.json` : !clueIds.has(m[2]) && `no clue ${m[2]} in mystery.json`)
          : kind === 'bells' ? (!(Number(m[1]) >= 1 && Number(m[1]) <= bells) && `there are ${bells} bells`)
          : kind === 'locks' ? (!lockIds.has(m[1]) && `no lock ${m[1]} in mystery.json`)
          : kind === 'accusables' ? (!accusables.has(m[1]) && `${m[1]} cannot be accused`)
          : false;
        if (bad) at(`${id}: \`on\` is ${JSON.stringify(t.on)} and ${bad}`);
      }
    }

    /* RULE 6: A QUEST GIVES BACK A PERSON WHO POSES ONE OF THE FRAME'S TOKENS
     * (BACKLOG.md rank 8, #661). `{ACCUSE}` is a line in Sir Roger's `default`
     * set and it is how the player is asked for a name; `validateAgainstNpcs`
     * already holds that token and `openAccusation` to each other, but it looks
     * only at the frame and cannot see this directory at all. A side quest that
     * ended on a state of its own would take the day's own question off the
     * screen from whenever the errand finished until Vespers, in the one
     * conversation everything else is pointed at, and every suite would stay
     * green because the overlay still opens: the transition is on
     * `talked:constable` and not on the line. So the rule is about the terminal
     * stages, which are the permanent ones, and the middle stages are the
     * file's own business — rogers-verse.json answers those by ending every one
     * of Sir Roger's errand states with the question in his own words. */
    const posed = (npc.dialogue?.default ?? []).find((l) => tokens.includes(l));
    if (posed) {
      for (const [id, s] of Object.entries(def.stages ?? {})) {
        if (s.terminal && s.dialogueState !== 'default') {
          at(`${id} is terminal and leaves ${def.npc} in \`${s.dialogueState}\` for the rest of the day, but ${posed} is a line in their \`default\` set — an ending has to give them back`);
        }
      }
    }
  }

  // Rule 2, one voice per person. Two quests that both change what somebody
  // says have no order between them: which of the two the player hears is
  // whichever the loader happened to read first, at every bell. The conservative
  // form is what is enforced — only one quest per person may hold a non-default
  // state at all — and an increment that wants two threads on one cook replaces
  // it with a co-activity check rather than relaxing it.
  for (const [npc, holders] of voices) {
    if (holders.length < 2) continue;
    problems.push(`${holders.map((h) => h.file).join(' and ')}: both change what ${npc} says (${holders.map((h) => `${h.file} wants ${h.states.join('/')}`).join('; ')}) — only one quest per person may hold a non-default dialogueState`);
  }

  /* RULE 5: REPUTATION'S THRESHOLDS ARE REACHABLE (BACKLOG.md rank 8). The
   * counters move one per errand finished in a ward, so the most a ward's
   * counter can ever read is the number of quest files in that ward and the
   * most `closing` can read is the whole set. A line keyed above that is a
   * line nobody will ever hear, which is the failure mode this block exists
   * for: it is silent, it looks exactly like a line that has not been earned
   * yet, and nothing else in the project would ever say so. The rest is shape,
   * because a `line` that is not a string reaches the dialogue box as one. */
  if (reputation != null) {
    const per = { closing: quests.length };
    for (const w of WARDS) per[w] = quests.filter(({ def }) => def?.ward === w).length;
    if (typeof reputation !== 'object' || Array.isArray(reputation)) {
      problems.push('`reputation` is not an object of ward lists');
    } else for (const [key, list] of Object.entries(reputation)) {
      const at = (msg) => problems.push(`reputation.${key}: ${msg}`);
      if (!(key in per)) { at(`is not one of ${[...WARDS, 'closing'].join(', ')}`); continue; }
      if (!Array.isArray(list)) { at('is not a list of {at, line}'); continue; }
      let last = 0;
      for (const e of list) {
        const where = `at ${JSON.stringify(e?.at)}`;
        if (!Number.isInteger(e?.at) || e.at < 1) at(`${where} is not a whole number of errands, one or more`);
        else if (e.at <= last) at(`${where} does not come after ${last} — the list is read in order and the highest threshold reached wins`);
        else if (e.at > per[key]) at(`${where} is past the ${per[key]} errand(s) there are to finish, so nobody will ever hear it`);
        else last = e.at;
        if (typeof e?.line !== 'string' || !e.line.trim()) at(`${where} has no \`line\``);
      }
    }
  }
  return problems;
}
