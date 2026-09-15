// mystery.js — the mystery as data, validated and run without a page. No DOM,
// no three, no timers. `validateMystery` reads data/mystery.json against the
// twelve in data/npcs.json's `cast` and the frame in data/quest.json and
// returns every problem it finds, each naming the id it is about.
// `createMystery` runs the same data: discovery is a fixed point (a deduction
// lands the instant both premises are held), a press moves an NPC only if the
// clue is held and the NPC is in a state the press leaves from, the bell
// advances the watch, and the Constable judges what is presented, not what is
// true. Every call returns a list of effects for a manager to apply; nothing
// here applies them. test/mystery.mjs drives this file directly.
//
// WHY THE VALIDATOR IS THE POINT. Thirty-nine clues, twelve NPCs, four
// watches, eight presses and an accusation table are a graph a session cannot
// hold in its head, and every mistake in it is silent: a premise nothing can
// discover, a press keyed on a clue that is only held after the state it leaves
// from, a statement the schedule makes unspeakable, a red herring that is only
// a herring because nobody noticed it leads nowhere. The four breaks named in
// WISHLIST.md's Phase 1 entry are each one of those, and each has to fail here
// with the message written there.

import { STATION_CLEARANCE, TALK_RANGE } from './stations.js';

const KINDS = new Set(['S', 'E', 'D', 'L']);
/** The seven `ui` lines the HUD reads out of mystery.json. */
const UI_LINES = ['asleep', 'absent', 'gone', 'locked', 'known', 'empty', 'fall'];

const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** Index the data once. Every validator rail and the engine read from this. */
function index(mystery, npcs) {
  const watches = Array.isArray(mystery?.watches) ? mystery.watches : [];
  const watchIdx = new Map(watches.map((w, i) => [w, i]));
  const rooms = new Map((mystery?.rooms ?? []).map((r) => [r.id, r]));
  const clues = new Map((mystery?.clues ?? []).map((c) => [c.id, c]));
  const evidence = new Map((mystery?.evidence ?? []).map((e) => [e.id, e]));
  const locks = new Map((mystery?.locks ?? []).map((l) => [l.id, l]));
  const cast = new Map((npcs ?? []).map((n) => [n.id, n]));
  const schedule = mystery?.schedule ?? {};
  const presses = mystery?.presses ?? [];
  const accusation = mystery?.accusation ?? {};
  // The NPC states anything can put an NPC in: `default`, and every press target.
  const statesOf = (npcId) => new Set(['default', ...presses.filter((p) => p.npc === npcId).map((p) => p.to)]);
  const station = (npcId, watch) => schedule[npcId]?.[watch] ?? null;
  const speakable = (npcId, watch) => { const s = station(npcId, watch); return !!s && !s.asleep; };
  return { watches, watchIdx, rooms, clues, evidence, locks, cast, schedule, presses, accusation, statesOf, station, speakable };
}

/**
 * The earliest watch (as an index into `watches`, or Infinity when never) at
 * which each clue can be held, and each (npc, state) can be reached, assuming a
 * player who does everything as early as it becomes possible. A fixed point
 * over the whole graph; `Infinity` is "not discoverable". The validator's
 * discoverability rails and the length rails both read this.
 */
export function earliest(mystery, npcs) {
  const ix = index(mystery, npcs);
  const { watches, clues, evidence, presses, statesOf, speakable } = ix;
  const clueAt = new Map([...clues.keys()].map((id) => [id, Infinity]));
  const stateAt = new Map(); // "npc/state" -> watch index
  for (const npcId of ix.cast.keys()) for (const s of statesOf(npcId)) stateAt.set(`${npcId}/${s}`, s === 'default' ? 0 : Infinity);
  const wIdx = (w) => (ix.watchIdx.has(w) ? ix.watchIdx.get(w) : Infinity);
  const maxOf = (ids) => ids.reduce((m, id) => Math.max(m, clueAt.get(id) ?? Infinity), 0);
  // The first watch >= `from` in `allowed` (a list of watch ids), or Infinity.
  const firstFrom = (from, allowed) => {
    let best = Infinity;
    for (const w of allowed) { const i = wIdx(w); if (i >= from && i < best) best = i; }
    return best;
  };
  for (let changed = true, guard = 0; changed && guard < 1000; guard++) {
    changed = false;
    const set = (map, key, v) => { if (v < (map.get(key) ?? Infinity)) { map.set(key, v); changed = true; } };
    for (const p of presses) {
      const from = Math.min(...asList(p.from).map((s) => stateAt.get(`${p.npc}/${s}`) ?? Infinity));
      const on = clueAt.get(p.on) ?? Infinity;
      const at = Math.max(from, on);
      // Pressing needs the NPC in front of you: the first watch >= `at` they can be spoken to.
      const when = firstFrom(at, watches.filter((w) => speakable(p.npc, w)));
      if (when < Infinity) set(stateAt, `${p.npc}/${p.to}`, when);
    }
    for (const c of clues.values()) {
      const src = c.source ?? {};
      let at = Infinity;
      if (c.kind === 'S' && src.npc && src.state) {
        const reached = stateAt.get(`${src.npc}/${src.state}`) ?? Infinity;
        const allowed = (src.watches ?? watches).filter((w) => speakable(src.npc, w));
        at = firstFrom(reached, allowed);
      } else if (c.kind === 'E' && src.evidence) {
        const e = evidence.get(src.evidence);
        if (e) {
          const need = maxOf(asList(e.requires));
          const lockAt = e.lock ? (ix.locks.has(e.lock) ? 0 : Infinity) : 0; // a lock opens on its riddle, any watch
          at = firstFrom(Math.max(need, lockAt), asList(e.watches));
        }
      } else if (c.kind === 'D' && Array.isArray(src.premises)) {
        at = src.premises.length ? maxOf(src.premises) : Infinity;
      } else if (c.kind === 'L' && src.room) {
        at = ix.rooms.has(src.room) ? 0 : Infinity;
      }
      if (at < Infinity) set(clueAt, c.id, at);
    }
  }
  return { clueAt, stateAt, watches };
}

/**
 * The actions a player has to take to hold a set of clues, as a set of
 * distinct interaction keys ("talk:cook", "examine:pouch", "press:steward/admits",
 * "enter:cross-walk", "unlock:muniment"), following the graph back through
 * premises, presses and `requires`. A talk in `default` state yields every
 * default statement at once, and a press yields the statements of the state it
 * moves to, so one key covers several clues.
 */
export function actionsFor(mystery, npcs, clueIds) {
  const ix = index(mystery, npcs);
  const acts = new Set();
  const seen = new Set();
  const need = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const c = ix.clues.get(id);
    if (!c) return;
    const src = c.source ?? {};
    if (c.kind === 'S') {
      if (src.state === 'default') acts.add(`talk:${src.npc}`);
      else reach(src.npc, src.state);
    } else if (c.kind === 'E') {
      const e = ix.evidence.get(src.evidence);
      if (!e) return;
      acts.add(`examine:${e.id}`);
      for (const r of asList(e.requires)) need(r);
      if (e.lock) acts.add(`unlock:${e.lock}`);
    } else if (c.kind === 'D') {
      for (const p of asList(src.premises)) need(p);
    } else if (c.kind === 'L') {
      acts.add(`enter:${src.room}`);
    }
  };
  const reach = (npcId, state) => {
    if (state === 'default') return;
    const key = `press:${npcId}/${state}`;
    if (acts.has(key)) return;
    acts.add(key);
    // Prefer the press that leaves from default; it is the shortest way there.
    const options = ix.presses.filter((p) => p.npc === npcId && p.to === state);
    const p = options.find((o) => asList(o.from).includes('default')) ?? options[0];
    if (!p) return;
    need(p.on);
    if (!asList(p.from).includes('default')) reach(npcId, asList(p.from)[0]);
  };
  for (const id of clueIds) need(id);
  return acts;
}

/**
 * The shortest path to the accusation of `truth.who`: the fewest interactions
 * that hold `needs` of that person's convicting clues (plus the motive for the
 * full ending), across the fewest watches. Interactions are the distinct
 * actions from `actionsFor`, plus one bell ring per watch after the first and
 * one accusation. Returns { watches, interactions, clues, actions } or null when
 * no convicting set is discoverable.
 */
export function shortestPath(mystery, npcs, { full = true } = {}) {
  const ix = index(mystery, npcs);
  const acc = ix.accusation;
  const who = acc.truth?.who;
  const list = (acc.convicts?.[who] ?? []);
  const needs = acc.needs ?? 2;
  const { clueAt } = earliest(mystery, npcs);
  const fromIdx = ix.watchIdx.has(acc.from) ? ix.watchIdx.get(acc.from) : 0;
  const combos = [];
  const pick = (start, chosen) => {
    if (chosen.length === needs) { combos.push(chosen); return; }
    for (let i = start; i < list.length; i++) pick(i + 1, [...chosen, list[i]]);
  };
  pick(0, []);
  let best = null;
  for (const combo of combos) {
    const clues = full && acc.truth?.motive ? [...combo, acc.truth.motive] : combo;
    const at = Math.max(fromIdx, ...clues.map((id) => clueAt.get(id) ?? Infinity));
    if (!Number.isFinite(at)) continue;
    const actions = actionsFor(mystery, npcs, clues);
    const interactions = actions.size + at + 1; // `at` rings to reach that watch, one accusation
    const watches = at + 1;
    if (!best || watches < best.watches || (watches === best.watches && interactions < best.interactions)) {
      best = { watches, interactions, clues, actions: [...actions] };
    }
  }
  return best;
}

/**
 * Every problem in the data, each naming the id it is about. Empty means the
 * mystery is coherent: every clue can be held, every press can fire, every
 * statement can be spoken where it is available, every clue leads somewhere,
 * the accusation table is complete, and the shortest convicting path is two
 * to three watches long.
 *
 * @param mystery parsed data/mystery.json
 * @param npcs    data/npcs.json's `cast` (the twelve)
 * @param quest   the frame: a quest graph definition (data/quest.json's `frame`)
 * @param nav     src/stations.js's `castleNav(plan, mystery)`, or null. With it
 *   the schedule is checked against the castle itself: floor under every
 *   station, the room it names around it, everyone at one bell standing apart,
 *   the player able to get within talking range, and a walk from each station
 *   to the next. Without it none of those five run and the rest are unchanged,
 *   which is what lets `earliest` and `shortestPath` stay geometry-free.
 */
export function validateMystery(mystery, npcs, quest, nav = null) {
  const problems = [];
  const say = (m) => problems.push(m);
  if (!mystery || typeof mystery !== 'object') return ['mystery is not an object'];
  const ix = index(mystery, npcs);
  const { watches, rooms, clues, evidence, locks, cast, presses, accusation, statesOf, station, speakable } = ix;

  if (watches.length !== 4) say(`watches: expected four bells, found ${watches.length}`);
  // The HUD's own lines, for the five answers that are not a clue (Phase 7).
  // A missing one shows as an empty toast, which reads as nothing happening.
  for (const k of UI_LINES) {
    if (typeof mystery.ui?.[k] !== 'string' || !mystery.ui[k].trim()) say(`ui.${k}: no line, so the HUD would say nothing at all when it has something to say`);
  }
  if (!clues.size) say('clues: none');
  if (!cast.size) say('npcs: none in the cast');

  // --- Sources. Every clue has one, of its kind, naming things that exist.
  for (const c of clues.values()) {
    if (!KINDS.has(c.kind)) { say(`${c.id}: kind ${JSON.stringify(c.kind)} is not S, E, D or L`); continue; }
    const src = c.source;
    if (!src || typeof src !== 'object') { say(`${c.id}: no source`); continue; }
    if (c.kind === 'S') {
      if (!src.npc || !src.state) say(`${c.id}: a statement's source needs npc and state`);
      else if (!cast.has(src.npc)) say(`${c.id}: source npc ${src.npc} is not in the cast`);
      else {
        const lines = cast.get(src.npc).dialogue?.[src.state];
        if (!Array.isArray(lines) || !lines.length) say(`${c.id}: source state ${src.npc}/${src.state} has no dialogue lines in npcs.json`);
        if (!statesOf(src.npc).has(src.state)) say(`${c.id}: source state ${src.npc}/${src.state} is reached by no press and no stage`);
        for (const w of src.watches ?? []) if (!ix.watchIdx.has(w)) say(`${c.id}: watch ${JSON.stringify(w)} is not one of the four`);
        // Available only when it can be said: every listed watch has the npc present and awake.
        for (const w of src.watches ?? []) {
          if (!speakable(src.npc, w)) say(`${c.id}: available at ${w}, when the ${src.npc} cannot be spoken to about it`);
        }
        const speakableAt = (src.watches ?? watches).filter((w) => speakable(src.npc, w));
        if (!speakableAt.length) say(`${c.id}: at no watch can the ${src.npc} be spoken to`);
      }
    } else if (c.kind === 'E') {
      if (!src.evidence) say(`${c.id}: an evidence clue's source needs evidence`);
      else if (!evidence.has(src.evidence)) say(`${c.id}: source evidence ${src.evidence} is not in evidence`);
      else if (!asList(evidence.get(src.evidence).clue).includes(c.id)) say(`${c.id}: evidence ${src.evidence} does not list it as its clue`);
    } else if (c.kind === 'D') {
      const p = src.premises;
      if (!Array.isArray(p) || p.length < 2) say(`${c.id}: a deduction needs at least two premises`);
      else for (const id of p) if (!clues.has(id)) say(`${c.id}: premise ${id} is not a clue`);
    } else if (c.kind === 'L') {
      if (!src.room) say(`${c.id}: a location's source needs a room`);
      else if (!rooms.has(src.room)) say(`${c.id}: source room ${src.room} is not a room`);
      else if (src.level != null && rooms.get(src.room).level !== src.level) say(`${c.id}: room ${src.room} is on level ${rooms.get(src.room).level}, not ${src.level}`);
    }
    for (const id of asList(c.contradicts)) if (!clues.has(id)) say(`${c.id}: contradicts ${id}, which is not a clue`);
  }

  // --- Evidence: in a room, in a watch, reachable, listing clues that exist.
  for (const e of evidence.values()) {
    // Phase 7 puts a prompt on every piece of evidence in the castle, and the
    // prompt is this name: "Press E to examine the tally stick". A row without
    // one reads "examine the undefined" on a real wall, which is the class of
    // thing nothing downstream can catch, because `undefined` renders fine.
    if (typeof e.name !== 'string' || !e.name.trim()) say(`${e.id}: no \`name\`, so its prompt would read "Press E to examine the ${e.name}"`);
    if (!e.room || !rooms.has(e.room)) say(`${e.id}: in no room (${JSON.stringify(e.room)})`);
    else if (e.level != null && rooms.get(e.room).level !== e.level) say(`${e.id}: room ${e.room} is on level ${rooms.get(e.room).level}, not ${e.level}`);
    const ws = asList(e.watches);
    if (!ws.length) say(`${e.id}: in no watch`);
    for (const w of ws) if (!ix.watchIdx.has(w)) say(`${e.id}: watch ${JSON.stringify(w)} is not one of the four`);
    if (!asList(e.clue).length) say(`${e.id}: yields no clue`);
    for (const id of asList(e.clue)) {
      if (!clues.has(id)) say(`${e.id}: clue ${id} is not a clue`);
      else if (clues.get(id).kind !== 'E' || clues.get(id).source?.evidence !== e.id) say(`${e.id}: clue ${id} does not name it as its source`);
    }
    for (const id of asList(e.requires)) if (!clues.has(id)) say(`${e.id}: requires ${id}, which is not a clue`);
    if (e.lock && !locks.has(e.lock)) say(`${e.id}: behind lock ${e.lock}, which is not a lock`);
    // Phase 3 wires the plan in; until then every room is reachable, and this
    // rail can only fire on a room the file does not have.
  }
  for (const l of locks.values()) if (!l.room || !rooms.has(l.room)) say(`lock ${l.id}: in no room`);

  // --- Rooms and the schedule.
  for (const r of rooms.values()) {
    if (!['outer', 'inner'].includes(r.ward)) say(`room ${r.id}: ward ${JSON.stringify(r.ward)} is not outer or inner`);
    if (![0, 1, 2].includes(r.level)) say(`room ${r.id}: level ${JSON.stringify(r.level)} is not 0, 1 or 2`);
  }
  for (const npcId of cast.keys()) {
    if (!ix.schedule[npcId]) { say(`${npcId}: no schedule`); continue; }
    for (const w of watches) {
      if (!(w in ix.schedule[npcId])) say(`${npcId}: no station at ${w} (use null for not in the castle)`);
      const s = station(npcId, w);
      if (s && !rooms.has(s.room)) say(`${npcId}: station at ${w} is in no room (${JSON.stringify(s.room)})`);
      else if (s && s.level != null && rooms.get(s.room).level !== s.level) say(`${npcId}: station at ${w} says level ${s.level} but ${s.room} is on ${rooms.get(s.room).level}`);
    }
  }
  for (const npcId of Object.keys(ix.schedule)) if (!cast.has(npcId)) say(`schedule: ${npcId} is not in the cast`);

  /* --- The schedule against the castle. Five questions the data alone cannot
   * answer, each of which was open until Phase 6 put the twelve on the screen:
   * is there floor there, is it in the room the station names, can two people
   * stand there at once, can the player reach them, and can they get there
   * from where they were at the bell before. A station is a place a body
   * stands, and a body that cannot walk to its next station teleports. */
  if (nav) {
    const code = (id) => rooms.get(id)?.code ?? id;
    const where = (npcId, w) => {
      const p = nav.at(npcId, w);
      return p ? `${code(p.room)} at ${w}` : `nowhere at ${w}`;
    };
    for (const npcId of cast.keys()) {
      if (!ix.schedule[npcId]) continue;
      let previous = null, previousWatch = null;
      for (const w of watches) {
        const point = nav.at(npcId, w);
        const s = station(npcId, w);
        if (s && !point) { say(`${npcId}: station at ${w} has no tile`); continue; }
        if (!point) continue;
        if (!nav.standable(point)) {
          say(`${npcId}: station at ${w} is at tile (${s.tile.join(', ')}) on level ${point.level}, where there is no floor to stand on`);
        } else {
          if (nav.inNamedRoom(point) === false) say(`${npcId}: station at ${w} is at tile (${s.tile.join(', ')}), which is not inside ${s.room}`);
          /* WHICH STATIONS THE PLAYER HAS TO REACH IS THE MYSTERY'S ANSWER, NOT
           * THE CASTLE'S. Every station but one is somewhere he walks up to;
           * Madoc's is behind bars that never open, and mystery.json's `barred`
           * is the fact that says so, the same field test/layout.mjs takes the
           * cell's shutness from. So a barred room asks only for somewhere to
           * stand within talking range, on the other side of the bars, and
           * everywhere else asks for the floor itself. Standing on top of
           * something is the failure this catches: the first Prime station for
           * the Constable was floor by every other rail and was the top of the
           * chapel's candlesticks, 0.84 m up, a step nobody can take. */
          if (rooms.get(s.room)?.barred) {
            if (!nav.talkable(point)) say(`${npcId}: station at ${w} is in ${code(s.room)}, behind bars with nowhere within ${TALK_RANGE} m of them to stand`);
          } else if (!nav.walkable(point)) {
            say(`${npcId}: station at ${w} is at tile (${s.tile.join(', ')}) in ${code(s.room)}, which the player cannot walk to`);
          }
          if (previous && !nav.route(previous, point)) {
            say(`${npcId}: no path from ${where(npcId, previousWatch)} to ${where(npcId, w)}`);
          }
        }
        previous = point; previousWatch = w;
      }
    }
    // Two bodies in one place at one bell is one body the player can never talk to.
    for (const w of watches) {
      const here = [...cast.keys()].map((id) => [id, nav.at(id, w)]).filter(([, p]) => p);
      for (let a = 0; a < here.length; a++) {
        for (let b = a + 1; b < here.length; b++) {
          const [idA, pA] = here[a], [idB, pB] = here[b];
          if (pA.level !== pB.level) continue;
          const gap = Math.hypot(pA.x - pB.x, pA.z - pB.z);
          if (gap < STATION_CLEARANCE) {
            say(`${idA} and ${idB} stand ${gap.toFixed(2)} m apart at ${w}, inside the ${STATION_CLEARANCE} m two bodies need`);
          }
        }
      }
    }
  }

  // --- Presses: name an npc, a clue, states that exist and are reached.
  for (const p of presses) {
    const where = `press ${p.npc}/${p.to}`;
    if (!cast.has(p.npc)) { say(`${where}: ${p.npc} is not in the cast`); continue; }
    if (!clues.has(p.on)) say(`${where}: on ${p.on}, which is not a clue`);
    if (!p.to || p.to === 'default') say(`${where}: \`to\` must be a state other than default`);
    else if (!Array.isArray(cast.get(p.npc).dialogue?.[p.to]) || !cast.get(p.npc).dialogue[p.to].length) say(`${where}: ${p.npc} has no dialogue.${p.to} lines`);
    for (const f of asList(p.from)) if (!statesOf(p.npc).has(f)) say(`${where}: leaves from ${f}, a state no press and no stage reaches`);
  }
  // Every non-default dialogue state on every NPC is reached by a press or named by a stage.
  const stageStates = new Set(Object.values(quest?.stages ?? {}).map((s) => s.dialogueState));
  for (const [id, npc] of cast) {
    for (const state of Object.keys(npc.dialogue ?? {})) {
      if (state !== 'default' && !statesOf(id).has(state) && !stageStates.has(state)) say(`${id}: state ${state} is reached by no press and no stage`);
    }
    for (const state of stageStates) {
      if (!Array.isArray(npc.dialogue?.[state]) || !npc.dialogue[state].length) say(`${id}: no dialogue.${state} lines for a stage in that dialogueState`);
    }
  }
  for (const [id, npc] of cast) {
    if (typeof npc.tint !== 'string' || !/^#[0-9a-f]{6}$/i.test(npc.tint)) say(`${id}: tint ${JSON.stringify(npc.tint)} is not a #rrggbb hex`);
    if (typeof npc.modelPath !== 'string') say(`${id}: names no body (modelPath)`);
  }

  // --- Discoverability: the fixed point, and what it says about each clue.
  const { clueAt, stateAt } = earliest(mystery, npcs);
  const held = (id) => Number.isFinite(clueAt.get(id));
  for (const c of clues.values()) {
    if (c.kind === 'D' && Array.isArray(c.source?.premises)) {
      for (const p of c.source.premises) if (clues.has(p) && !held(p)) say(`${c.id}: premise ${p} is discoverable from nothing`);
    }
  }
  for (const p of presses) {
    if (!clues.has(p.on) || held(p.on)) continue;
    // The statements this press unlocks can never be heard: name each of them.
    const unlocked = [...clues.values()].filter((c) => c.kind === 'S' && c.source?.npc === p.npc && c.source?.state === p.to);
    if (!unlocked.length) say(`press ${p.npc}/${p.to}: its press is on a clue that cannot be held (${p.on})`);
    for (const c of unlocked) say(`${c.id}: its press is on a clue that cannot be held (${p.on})`);
  }
  // A press keyed on a clue only held after the state it leaves from is a cycle:
  // the earliest fixed point never reaches `to`, which the rail above reports.
  // Say so by name when the cause is a cycle rather than an orphan.
  for (const p of presses) {
    if (!clues.has(p.on) || !held(p.on)) continue;
    const to = stateAt.get(`${p.npc}/${p.to}`);
    if (!Number.isFinite(to)) say(`press ${p.npc}/${p.to}: never fires (on ${p.on}, from ${asList(p.from).join('|')}), a cycle or a state nothing reaches`);
  }
  for (const c of clues.values()) {
    if (c.kind === 'S' && cast.has(c.source?.npc) && !held(c.id)) {
      const st = stateAt.get(`${c.source.npc}/${c.source.state}`);
      if (Number.isFinite(st)) say(`${c.id}: the ${c.source.npc} reaches ${c.source.state} at ${watches[st]} and is never spoken to after it`);
    }
    if (c.kind === 'E' && evidence.has(c.source?.evidence) && !held(c.id)) say(`${c.id}: its evidence can never be examined`);
  }

  // --- Every clue leads somewhere: to an accusation, a press, a contradiction,
  // or is a default-state statement (colour), or says it is a herring.
  const convicting = new Set(Object.values(accusation.convicts ?? {}).flat());
  if (accusation.truth?.motive) convicting.add(accusation.truth.motive);
  const useful = new Set();
  for (const c of clues.values()) {
    if (convicting.has(c.id) || asList(c.contradicts).length || c.herring) useful.add(c.id);
    if (c.kind === 'S' && c.source?.state === 'default') useful.add(c.id);
  }
  for (let changed = true; changed;) {
    changed = false;
    const mark = (id) => { if (clues.has(id) && !useful.has(id)) { useful.add(id); changed = true; } };
    for (const c of clues.values()) {
      if (!useful.has(c.id)) continue;
      if (c.kind === 'D') for (const p of asList(c.source?.premises)) mark(p);
      if (c.kind === 'E') for (const r of asList(evidence.get(c.source?.evidence)?.requires)) mark(r);
      if (c.kind === 'S' && c.source && c.source.state !== 'default') {
        for (const p of presses) if (p.npc === c.source.npc && p.to === c.source.state) mark(p.on);
      }
    }
  }
  for (const c of clues.values()) if (!useful.has(c.id)) say(`${c.id}: on no path to any accusation`);
  for (const c of clues.values()) if (c.herring && convicting.has(c.id)) say(`${c.id}: marked herring but convicts someone`);

  // --- The accusation table.
  if (!cast.has(accusation.judge)) say(`accusation: judge ${JSON.stringify(accusation.judge)} is not in the cast`);
  if (accusation.from != null && !ix.watchIdx.has(accusation.from)) say(`accusation: from ${JSON.stringify(accusation.from)} is not a watch`);
  const needs = accusation.needs;
  if (!(Number.isInteger(needs) && needs >= 1)) say(`accusation: needs must be a positive integer (${JSON.stringify(needs)})`);
  if (!(Number.isInteger(accusation.refusals) && accusation.refusals >= 1)) say('accusation: refusals must be a positive integer');
  const who = accusation.truth?.who;
  if (!cast.has(who)) say(`accusation: truth.who ${JSON.stringify(who)} is not in the cast`);
  if (accusation.truth?.motive && !clues.has(accusation.truth.motive)) say(`accusation: truth.motive ${accusation.truth.motive} is not a clue`);
  for (const [name, list] of Object.entries(accusation.convicts ?? {})) {
    if (!cast.has(name)) say(`convicts: ${name} is not in the cast`);
    for (const id of list) {
      if (!clues.has(id)) say(`convicts ${name}: ${id} is not a clue`);
      else if (!held(id)) say(`convicts ${name}: ${id} is not discoverable`);
    }
    if (!accusation.verdicts?.[name]?.convicted || !accusation.verdicts?.[name]?.epilogue) say(`verdicts: ${name} can be accused and has no verdict text`);
  }
  if (!accusation.verdicts?.nobody?.convicted || !accusation.verdicts?.nobody?.epilogue) say('verdicts: nobody (a fall) has no verdict text');
  if (accusation.truth?.motive && (!accusation.verdicts?.full?.convicted || !accusation.verdicts?.full?.epilogue)) say('verdicts: full (the truth with its motive) has no verdict text');
  if (cast.has(who) && (accusation.convicts?.[who] ?? []).length < (needs ?? 2)) say(`accusation: truth.who ${who} has a convicts list shorter than needs (${(accusation.convicts?.[who] ?? []).length} < ${needs})`);
  if (typeof accusation.refused !== 'string' || !accusation.refused) say('accusation: no refused line');

  // --- The two length rails: neither solvable at Prime nor lost by Vespers.
  if (cast.has(who) && problems.length === 0) {
    const best = shortestPath(mystery, npcs, { full: true });
    if (!best) say(`accusation: no discoverable set of ${needs} clues convicts ${who}`);
    else if (best.watches < 2) say(`accusation: the shortest convicting path is ${best.watches} watch (${best.clues.join(', ')}); it must take at least two`);
    else if (best.watches > 3) say(`accusation: the shortest convicting path is ${best.watches} watches (${best.clues.join(', ')}); it must take no more than three`);
  }
  return problems;
}

/** A fresh, empty state in the save's shape. */
export function freshState(quest) {
  return {
    stage: quest?.start ?? 'start',
    watch: 0,
    clues: [],
    pressed: {},
    taken: [],
    locks: [],
    accusations: [],
    refusals: 0,
    riddleWrong: 0,
    player: null,
  };
}

/**
 * The engine. `state` is the save's shape (see src/save.js) and is mutated in
 * place so a caller can autosave it; every method returns the effects of the
 * call as a list of plain objects, in order, and never throws on a bad id.
 *
 *   { discover, talk, press, ring, enter, examine, unlock, accuse, available,
 *     stationOf, journal, state, watch, npcState, holds }
 */
export function createMystery({ mystery, npcs, state }) {
  const ix = index(mystery, npcs);
  const { watches, clues, evidence, presses, accusation } = ix;
  const st = state ?? freshState();
  st.clues ??= []; st.pressed ??= {}; st.taken ??= []; st.locks ??= []; st.accusations ??= [];
  st.refusals ??= 0; st.watch ??= 0;

  const watchId = () => watches[Math.min(st.watch, watches.length - 1)];
  const holds = (id) => st.clues.includes(id);
  const npcState = (npcId) => st.pressed[npcId]?.at(-1) ?? 'default';
  const ended = () => st.accusations.some((a) => a.verdict);

  // Deductions are a fixed point: land every D whose premises are all held.
  const settle = (effects) => {
    for (let changed = true; changed;) {
      changed = false;
      for (const c of clues.values()) {
        if (c.kind !== 'D' || holds(c.id)) continue;
        if (asList(c.source?.premises).every(holds)) {
          st.clues.push(c.id);
          effects.push({ type: 'clue', id: c.id, kind: 'D', title: c.title, text: c.text });
          changed = true;
        }
      }
    }
    return effects;
  };
  const grant = (id, effects) => {
    const c = clues.get(id);
    if (!c || holds(id)) return effects;
    st.clues.push(id);
    effects.push({ type: 'clue', id, kind: c.kind, title: c.title, text: c.text });
    effects.push({ type: 'event', name: `clue:${id}` });
    return settle(effects);
  };

  /** The statements an NPC's current state yields at the current watch. */
  const statementsOf = (npcId) => {
    const s = npcState(npcId);
    return [...clues.values()].filter((c) => c.kind === 'S' && c.source?.npc === npcId && c.source?.state === s
      && (!c.source.watches || c.source.watches.includes(watchId()))).map((c) => c.id);
  };

  const api = {
    get state() { return st; },
    get watch() { return watchId(); },
    holds,
    npcState,

    stationOf(npcId, watch = watchId()) { return ix.station(npcId, watch); },

    /** Null when the NPC is not in the castle or asleep; else their state, station and the statements a talk would grant. */
    available(npcId) {
      if (!ix.cast.has(npcId) || !ix.speakable(npcId, watchId())) return null;
      return { npc: npcId, state: npcState(npcId), station: ix.station(npcId, watchId()), statements: statementsOf(npcId) };
    },

    discover(clueId) { return grant(clueId, []); },

    /** A conversation finished: every statement of that NPC's state lands. */
    talk(npcId) {
      const a = api.available(npcId);
      if (!a) return [];
      const effects = [{ type: 'talked', npc: npcId, state: a.state }];
      for (const id of a.statements) grant(id, effects);
      effects.push({ type: 'event', name: `talked:${npcId}` });
      return effects;
    },

    /** Present a held clue. Moves the NPC only if a press leaves from their current state on that clue. */
    press(npcId, clueId) {
      const a = api.available(npcId);
      if (!a || !holds(clueId)) return [{ type: 'shrug', npc: npcId, clue: clueId }];
      const p = presses.find((x) => x.npc === npcId && x.on === clueId && asList(x.from).includes(a.state));
      if (!p) return [{ type: 'shrug', npc: npcId, clue: clueId }];
      (st.pressed[npcId] ??= []).push(p.to);
      const effects = [{ type: 'state', npc: npcId, state: p.to }, { type: 'event', name: `press:${npcId}:${clueId}` }];
      for (const id of statementsOf(npcId)) grant(id, effects);
      return effects;
    },

    /** The bell. The fourth ring ends the day: the Constable demands the accusation. */
    ring() {
      if (ended()) return [];
      const effects = [];
      if (st.watch < watches.length - 1) {
        st.watch += 1;
        const n = st.watch;
        effects.push({ type: 'watch', watch: watches[n], index: n });
        effects.push({ type: 'stations', stations: Object.fromEntries([...ix.cast.keys()].map((id) => [id, ix.station(id, watches[n])])) });
        effects.push({ type: 'event', name: `bell:${n}` });
      } else {
        // The fourth ring. The watch stays at Vespers (the save clamps it to the
        // four); the Constable demands the accusation, and the frame moves.
        effects.push({ type: 'demand', judge: accusation.judge });
        effects.push({ type: 'event', name: `bell:${watches.length}` });
      }
      return effects;
    },

    enter(room, level = null) {
      const effects = [{ type: 'entered', room, level }];
      for (const c of clues.values()) {
        if (c.kind === 'L' && c.source?.room === room && (c.source.level == null || level == null || c.source.level === level)) grant(c.id, effects);
      }
      return effects;
    },

    examine(evidenceId) {
      const e = evidence.get(evidenceId);
      if (!e) return [];
      // Every effect carries the row's `name`, so the HUD that shows the result
      // does not have to hold a second copy of mystery.json to say what was
      // examined. validateMystery makes the name compulsory.
      const of = (type, extra = {}) => ({ type, evidence: evidenceId, name: e.name, ...extra });
      if (st.taken.includes(evidenceId)) return [of('gone')];
      if (!asList(e.watches).includes(watchId())) return [of('absent', { watch: watchId() })];
      if (!asList(e.requires).every(holds)) return [of('locked', { requires: asList(e.requires).filter((r) => !holds(r)) })];
      if (e.lock && !st.locks.includes(e.lock)) return [of('locked', { lock: e.lock })];
      const effects = [of('examined')];
      for (const id of asList(e.clue)) grant(id, effects);
      if (e.take) { st.taken.push(evidenceId); effects.push(of('taken')); }
      return effects;
    },

    unlock(lockId) {
      if (!ix.locks.has(lockId) || st.locks.includes(lockId)) return [];
      st.locks.push(lockId);
      return [{ type: 'unlocked', lock: lockId }];
    },

    /**
     * Name someone (an npc id, or "nobody" for a fall) and present up to
     * `accusation.present` held clues. The Constable judges what is presented.
     */
    accuse(who, clueIds = []) {
      if (ended()) return [];
      const presented = [...new Set(clueIds)].filter(holds).slice(0, accusation.present ?? 3);
      const fromIdx = ix.watchIdx.get(accusation.from) ?? 0;
      if (st.watch < fromIdx) return [{ type: 'early', judge: accusation.judge, text: accusation.early ?? '' }];
      // The Constable hears it: the frame moves to `accusing` before he answers.
      const asked = { type: 'event', name: 'ask:accuse' };
      const record = (verdict, extra = {}) => {
        st.accusations.push({ who, clues: presented, verdict, watch: watchId() });
        const v = accusation.verdicts?.[verdict === 'full' ? 'full' : who === 'nobody' ? 'nobody' : who] ?? {};
        const cls = verdict === 'full' ? 'full' : who === 'nobody' ? 'fall' : who === accusation.truth?.who ? 'right' : 'wrong';
        return [
          asked,
          { type: 'verdict', who, verdict, class: cls, clues: presented, convicted: v.convicted ?? '', epilogue: v.epilogue ?? '', ...extra },
          { type: 'event', name: `accused:${who}` },
          { type: 'event', name: `verdict:${cls}` },
        ];
      };
      if (who === 'nobody') return record('fall');
      if (!(who in (accusation.convicts ?? {}))) return refuse();
      const list = accusation.convicts[who];
      const backing = presented.filter((id) => list.includes(id));
      // The prisoner: an empty convicts list, accepted on nothing at all.
      if (list.length === 0) return record(who === accusation.truth?.who ? 'right' : 'wrong');
      if (backing.length < (accusation.needs ?? 2)) return refuse();
      if (who !== accusation.truth?.who) return record('wrong');
      const motive = accusation.truth?.motive;
      return record(motive && presented.includes(motive) ? 'full' : 'right');

      function refuse() {
        st.refusals += 1;
        st.accusations.push({ who, clues: presented, verdict: null, watch: watchId() });
        if (st.refusals >= (accusation.refusals ?? 3)) {
          const v = accusation.verdicts?.nobody ?? {};
          st.accusations.push({ who: 'nobody', clues: [], verdict: 'fall', watch: watchId() });
          return [
            asked,
            { type: 'refused', who, refusals: st.refusals, text: accusation.refused ?? '' },
            { type: 'verdict', who: 'nobody', verdict: 'fall', class: 'fall', clues: [], convicted: v.convicted ?? '', epilogue: v.epilogue ?? '', exhausted: true },
            { type: 'event', name: 'accused:nobody' },
            { type: 'event', name: 'verdict:fall' },
          ];
        }
        return [asked, { type: 'refused', who, refusals: st.refusals, text: accusation.refused ?? '' }];
      }
    },

    /** Held clues in the order found, with their text. */
    journal() {
      return st.clues.map((id) => clues.get(id)).filter(Boolean).map((c) => ({ id: c.id, kind: c.kind, title: c.title, text: c.text, herring: !!c.herring }));
    },
  };
  return api;
}
