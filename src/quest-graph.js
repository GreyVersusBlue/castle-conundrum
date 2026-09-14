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
 * `tokens`. And the riddle is opened by exactly the conversations that end in a
 * `{RIDDLE}` line — the Scholar's `default` lines pose it, so the stage whose
 * dialogueState is `default` must open it on `talked:scholar`, and no other
 * (npc, state) pair may carry the token.
 */
export function validateAgainstNpcs(def, npcs, { riddleAction = 'openRiddle', riddleToken = '{RIDDLE}' } = {}) {
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
  const posers = new Set(); // "npcId/state" pairs whose lines end in the riddle token
  for (const npc of npcs) {
    for (const [state, lines] of Object.entries(npc.dialogue ?? {})) {
      for (const line of lines) {
        for (const tok of line.match(/\{[A-Z_]+\}/g) ?? []) {
          if (!(tok in tokens)) problems.push(`npc ${npc.id}, dialogue.${state}: token ${tok} is not in quest.tokens`);
        }
      }
      if (lines.includes(riddleToken)) posers.add(`${npc.id}/${state}`);
    }
  }
  const openers = new Set();
  for (const [id, s] of Object.entries(stages)) {
    for (const t of s.transitions ?? []) {
      const does = (t.do ?? []).map((a) => (typeof a === 'string' ? a : a.do));
      if (!does.includes(riddleAction)) continue;
      const m = /^talked:(.+)$/.exec(t.on);
      if (!m) { problems.push(`${id}: ${riddleAction} runs on ${t.on}, not at the end of a conversation`); continue; }
      openers.add(`${m[1]}/${s.dialogueState}`);
    }
  }
  for (const p of posers) if (!openers.has(p)) problems.push(`npc/state ${p} poses ${riddleToken} but no stage in that dialogueState opens the riddle after that conversation`);
  for (const o of openers) if (!posers.has(o)) problems.push(`the riddle opens after ${o} but those lines never pose it (${riddleToken})`);
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
