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
// PLAN.md's Phase 1 entry are each one of those, and each has to fail here
// with the message written there.

import { STATION_CLEARANCE, TALK_RANGE } from './stations.js';
import { DAY_SETS } from './castle-plan.js';

const KINDS = new Set(['S', 'E', 'D', 'L']);
/** The eight `ui` lines the HUD reads out of mystery.json. `quiet` is the walking day's (open call 9). */
const UI_LINES = ['asleep', 'absent', 'gone', 'locked', 'known', 'empty', 'fall', 'quiet'];

const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/* ------------------------------------------------------------- the second day ---
 * THE MORNING AFTER IS A `day` FIELD, AND IT NAMES ITS OWN BELLS (#533, #699).
 * #533 said two things in one sentence and only one of them was argued for.
 * `watches` is asserted to be exactly four in this file, `ring()`'s fourth is
 * the Constable demanding an answer, and every rail about a two-to-three-watch
 * path is written against one day: eight ids in that one list would have made
 * all of it say nothing. That half stands. What the same sentence also said,
 * without saying so, was that the morning after could never move, and #699
 * overturns that clause. `day2.watches` is the morning's own list of bell ids,
 * none of them one of the four, and the engine reads WHICHEVER LIST THE DAY
 * NAMES. `watches` on day one, `day2.watches` on day two, with `state.watch`
 * an index into that list rather than into the four. `dayWatchesOf` is the one
 * place that choice is made; src/save.js, src/stations.js and src/lore.js read
 * the list and no longer a single id.
 *
 * IT IS ONE LONG TODAY, ON PURPOSE. `day2.schedule` is one station per person
 * for the whole morning and `day2.lines` is keyed by the verdict and not by the
 * bell, so a second morning bell with nothing written per-bell behind it is a
 * sky change and a noise. What the list buys is that the row which wants one
 * writes it in data/mystery.json instead of in here.
 *
 * WHAT THE PLAYER SAID IS THE ONLY INPUT. Seven endings, and every one of them
 * is a different castle on the morning after: a different man missing, a
 * different thing for everyone else to say about it. `outcomeOf` reads the
 * recorded accusation and returns the three names a day two is keyed by — the
 * `key` (one of `accusation.verdicts`' own seven), the `class` (one of the four
 * the engine emits as `verdict:<class>`), and `who` hangs. */

/* ------------------------------------------------------------ the day before ---
 * THE WALKING DAY IS THE SAME `day` FIELD, A THIRD VALUE (#750 to #756). Devon
 * took the walking day as the main mode (#751) and as the day BEFORE the death
 * (#752), so which of the three days a save is on is what tells them apart and
 * a `mode` field would be a second name for one fact (#754). `day0` is
 * `day2`'s sibling in data/mystery.json and names its own four bells for
 * `day2.watches`' reason: src/stations.js keys its points `npc/watch`, so
 * reusing `prime` would make one key mean two stations.
 *
 * A THIRD BRANCH AND NOT A GENERALISATION (open call 1). `dayWatchesOf` is
 * generalised because it is one list lookup keyed by a day number; every other
 * site gains an `onDayZero()` beside `onDayTwo()` rather than turning
 * `if (onDayTwo())` into a silent three-way. Four things hold that line: this
 * function keys on the literals 0 and 2 and everything else is the four;
 * `watches` is still asserted to be exactly four; `repair` can only produce 0,
 * 1 or 2 (src/save.js); and test/mystery.mjs asserts `dayWatchesOf(m, 1)` and
 * `dayWatchesOf(m, 7)` are both the four.
 *
 * WHAT THE WALKING DAY HAS NONE OF: clues, presses, locks, an accusation, a
 * verdict. `examine` answers `ui.quiet` and grants nothing, `press` shrugs,
 * `accuse` is refused, and `enter` still fills the map in but grants no `L`
 * clue. So the incoherence rail in `repair` is one line: a `day: 0` carrying a
 * clue or a recorded verdict is a save saying the mystery happened before the
 * day before it. */

/**
 * The bells of a day, in order: `day0.watches` for the walking day (#750),
 * `watches` for day one, `day2.watches` for the morning after (#699). Every
 * reader of a watch id goes through this rather than through `mystery.watches`
 * plus a special case, because the special case is what made `day2.watch` a
 * single id in four files at once.
 *
 * A day with no list of its own falls back to the four instead of to nothing:
 * `validateMystery` refuses that data, and a day with no bell to stand at
 * would put the engine on `undefined` rather than on a wrong bell.
 */
export function dayWatchesOf(mystery, day = 1) {
  const four = Array.isArray(mystery?.watches) ? mystery.watches : [];
  if (day !== 0 && day !== 2) return four;
  const own = asList(day === 0 ? mystery?.day0?.watches : mystery?.day2?.watches).filter((w) => typeof w === 'string' && w.trim());
  return own.length ? own : four;
}

/** The outcome of a finished day, or null while it is still running. */
export function outcomeOf(mystery, state) {
  const a = (state?.accusations ?? []).filter((x) => x && x.verdict).at(-1);
  if (!a) return null;
  return { key: a.verdict === 'full' ? 'full' : a.who, class: a.verdict, who: a.who };
}

/**
 * Every outcome a day can end in, read off `accusation.verdicts` rather than
 * listed here: `full`, one per accusable, and `nobody`. The validator walks all
 * seven, so a sixth accusable added to the data is a sixth morning the day-two
 * rails ask about without anybody editing this file.
 */
export function dayTwoOutcomes(mystery) {
  const acc = mystery?.accusation ?? {};
  const truth = acc.truth?.who;
  return Object.keys(acc.verdicts ?? {}).map((key) => {
    if (key === 'full') return { key, class: 'full', who: truth };
    if (key === 'nobody') return { key, class: 'fall', who: 'nobody' };
    return { key, class: key === truth ? 'right' : 'wrong', who: key };
  });
}

/**
 * Who is not in the castle on the morning after. `accused` is the man the last
 * accusation named, hanged at first light; `also` is whoever else that ending
 * takes, which for the full ending is the Steward in irons and the merchant
 * taken in the town. Both halves are data: the file cannot know what the
 * player said, and this file must not know who the Steward is.
 */
export function dayTwoAbsent(mystery, outcome) {
  const rule = mystery?.day2?.absent ?? {};
  const gone = new Set();
  if (rule.accused && outcome?.who && outcome.who !== 'nobody') gone.add(outcome.who);
  for (const id of asList(rule.also?.[outcome?.key])) gone.add(id);
  return gone;
}

/** A line set, or null: a non-empty list of non-empty strings and nothing else. */
const linesOf = (v) => (Array.isArray(v) && v.length && v.every((l) => typeof l === 'string' && l.trim()) ? v : null);

/**
 * One person's lines for one outcome: `day2.knew` first when the player is
 * holding the clue a row names, then the exact ending, then the verdict class,
 * then `default`. Two vocabularies on purpose — the laundress has one thing to
 * say when it is her own husband who hanged and another when it is anybody
 * else, and the Constable has seven — and one resolver, so nothing downstream
 * has to know which of the three a given entry was written in.
 *
 * `held` is the player's journal (`state.clues`), or null for "do not ask".
 * The validator calls it null on purpose: the `key`/`class`/`default` cascade
 * has to resolve for every reachable ending on its own, so a `knew` row can
 * only ever be an extra answer and never the only one.
 */
export function dayTwoLines(mystery, npcId, outcome, held = null) {
  if (!outcome) return null;
  const knew = dayTwoKnew(mystery, npcId, outcome, held);
  if (knew) return knew;
  const table = mystery?.day2?.lines?.[npcId];
  if (!table) return null;
  return linesOf(table[outcome.key] ?? table[outcome.class] ?? table.default);
}

/**
 * THE MORNING AFTER KNOWS WHAT THE PLAYER READ (#573). Every line on day two
 * is keyed by what the player SAID (`outcomeOf`) and nothing at all by what he
 * FOUND, and that made two of the shipped line sets say the wrong thing to a
 * player who had done the work: the inspector telling a clerk who had the gaol
 * roll off the barrel-head that nobody in the castle had ever looked at it,
 * and Nest saying nobody asked her whether Madoc had a wife to the one clerk
 * who had asked her exactly that. A `knew` row is `{npc, clue, when?, unless?,
 * lines, why}` and it wins over the cascade when the clue is in the journal
 * the save carried over. It may only ever REPLACE a line set that already
 * resolves, never supply the only one — see `dayTwoLines`.
 */
export function dayTwoKnew(mystery, npcId, outcome, held) {
  if (!held || !outcome) return null;
  const has = held instanceof Set ? (id) => held.has(id) : (id) => asList(held).includes(id);
  for (const row of mystery?.day2?.knew ?? []) {
    if (!row || row.npc !== npcId || !has(row.clue) || !appliesTo(row, outcome)) continue;
    const lines = linesOf(row.lines);
    if (lines) return lines;
  }
  return null;
}

/** Which key in a line table `outcome` would read, or null when none would. */
function dayTwoLineKey(mystery, npcId, outcome) {
  const table = mystery?.day2?.lines?.[npcId];
  if (!table) return null;
  for (const k of [outcome.key, outcome.class, 'default']) if (k in table) return k;
  return null;
}

/** Does one `when`/`unless` list name this ending, by its key or its class? */
const namesOutcome = (list, outcome) => asList(list).some((k) => k === outcome.key || k === outcome.class);

/**
 * Does one `when`/`unless` row apply to this ending? The grammar is shared by
 * `day2.castle`'s rows (#539) and `day2.knew`'s, so a row that names an ending
 * means the same thing in both.
 */
function appliesTo(row, outcome) {
  if (!row || !outcome) return false;
  if (row.when != null && !namesOutcome(row.when, outcome)) return false;
  if (row.unless != null && namesOutcome(row.unless, outcome)) return false;
  return true;
}

/**
 * THE SAME GRAMMAR, PLUS THE JOURNAL, FOR EVERYTHING OUTSIDE THIS FILE (#647).
 * `when`/`unless` name the ending; `knew` names clues the player has to be
 * holding, all of them, the way `day2.knew`'s single `clue` does for one. This
 * is the export because a second copy of the grammar is a second copy that
 * drifts: `data/lore.json`'s `since` rows and `data/npcs.json`'s `rumours`
 * pieces are both read through this and not through a reimplementation of it.
 *
 * `held` is the journal (`state.clues`), a Set or a list, or null for "the
 * player is holding nothing", which is what makes a row with a `knew` fail
 * closed rather than open.
 */
export function dayTwoApplies(row, outcome, held = null) {
  if (!appliesTo(row, outcome)) return false;
  const need = asList(row.knew);
  if (!need.length) return true;
  const has = held instanceof Set ? (id) => held.has(id) : (id) => asList(held).includes(id);
  return need.every(has);
}

/**
 * What the verdict does to the stone (#539). The rows of `day2.castle` that
 * apply to this ending, in the order they are written, each naming a `planId`
 * and one of `castle-plan.js`'s `DAY_SETS` verbs. `castle-builder.js` applies
 * them and nothing here knows what a collider is.
 */
export function dayTwoCastle(mystery, outcome) {
  return (mystery?.day2?.castle ?? []).filter((c) => appliesTo(c, outcome)).map((c) => ({ piece: c.piece, set: c.set }));
}

/** True for a cast member who is not in the castle until the second day. */
const arrivesLate = (npc) => (npc?.arrives ?? 1) > 1;

/**
 * True for a cast member who is in the castle on the walking day and no other
 * (open call 8). `arrives: 0` is Hywel and is the one thing that reads as
 * present on day one if nobody asks: every existing rail asks `> 1`, which is
 * false for 0, so a fourteenth body with no day-one schedule would have been a
 * missing-schedule failure in this file and a prompt over an empty patch of
 * floor in the castle. Exported beside `arrivesLate` because src/lore.js asks
 * the same question of a chatter pair and of a performance.
 */
export const beforeDayOne = (npc) => (npc?.arrives ?? 1) < 1;

/**
 * The inverse of a day overlay: what takes it off the castle again (#539).
 * `open` and `shut` are each other's undo and so are `gone` and `shown`, so
 * this is the row list with every verb flipped and nothing else — the order is
 * kept, because two rows on one piece are refused by `validateMystery` and a
 * reordering here would be the one thing that could make them matter.
 *
 * `beginDay1` hands this back for `day0.castle`, which is how the walking day's
 * overlay comes off the stone on the way into the mystery. The block is empty
 * today, so the round trip is what keeps it honest until it is not:
 * test/layout.mjs asserts `collidersWith(plan, undoDay(rows))` is
 * `plan.colliders` and `undoDay(undoDay(rows))` is `rows`.
 */
export function undoDay(rows = []) {
  const back = { open: 'shut', shut: 'open', gone: 'shown', shown: 'gone' };
  return asList(rows).filter((r) => r && typeof r.piece === 'string').map((r) => ({ piece: r.piece, set: back[r.set] ?? r.set }));
}

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
export function validateMystery(mystery, npcs, quest, nav = null, sideQuests = []) {
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
  // THE STOREYS ARE THE CASTLE'S, NOT A LITERAL HERE (#523). This read
  // `[0, 1, 2]` and the tower roofs at level 3 would have been refused by the
  // validator while the plan built them. With no plan to ask — a suite calling
  // this on the data alone — any whole level from the ground up passes, because
  // a ceiling invented in this file is a second copy of `storey` that can
  // disagree with the one in castle-plan.js.
  const storeys = nav?.plan?.levels || null;
  for (const r of rooms.values()) {
    if (!['outer', 'inner'].includes(r.ward)) say(`room ${r.id}: ward ${JSON.stringify(r.ward)} is not outer or inner`);
    const bad = storeys ? !storeys.includes(r.level) : !(Number.isInteger(r.level) && r.level >= 0);
    if (bad) say(`room ${r.id}: level ${JSON.stringify(r.level)} is not ${storeys ? `one of the castle's levels ${storeys.join(', ')}` : 'a whole number of storeys above the ground'}`);
  }
  for (const [npcId, npc] of cast) {
    // A cast member with `arrives: 2` is not in the castle on day one and has
    // no day-one schedule to check; the day-two section below is where he is
    // held to a station instead. The other direction still fires: a day-one
    // person with no schedule is a person the bell cannot place.
    if (arrivesLate(npc)) {
      if (ix.schedule[npcId]) say(`${npcId}: arrives on day ${npc.arrives} and still has a day-one schedule`);
      continue;
    }
    /* AND THE ONE WHO IS ONLY IN THE CASTLE THE DAY BEFORE (#752, open call 8).
     * `arrives: 0` is the walking day and no other, so a day-one schedule for
     * him is a dead man standing at a station, and no `day0` schedule at all is
     * a fourteenth body the walking day cannot place. Both directions, because
     * each of them is silent on the screen: `npc.js`'s `get active()` hides a
     * body with no station, so the second failure is an empty lodge. */
    if (beforeDayOne(npc)) {
      if (ix.schedule[npcId]) say(`${npcId}: is in the castle on the walking day only (arrives: 0) and still has a day-one schedule`);
      if (!mystery.day0?.schedule?.[npcId]) say(`${npcId}: is in the castle on the walking day only (arrives: 0) and has no station in day0.schedule, so nothing can place him on it`);
      continue;
    }
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

  /* --- The walking day (#750 to #756). The day BEFORE the death, and the five
   * nav rails it reuses are day one's five: floor under the station, inside the
   * room it names, 1.5 m clear of everybody else at that bell, somewhere the
   * player can reach, and a walk from where the body stood at the bell before.
   * What is new is the walk at the END of it: whoever is at a station at the
   * last bell of the walking day has to be able to get from there to his
   * day-one Prime station on his own feet, which is the day-two rail's
   * "overnight is still a walk" pointed forward instead of back. It skips the
   * man who is only here the day before and the man who is not here until
   * Terce, for the reason the day-two one skips a man with no Vespers station:
   * there is nothing to walk from or to. */
  const d0 = mystery.day0;
  if (!d0 || typeof d0 !== 'object') {
    say('day0: no walking day, so the castle opens on the morning the mason is already dead');
  } else {
    const w0list = asList(d0.watches);
    if (!Array.isArray(d0.watches) || w0list.length !== 4) say(`day0.watches: ${JSON.stringify(d0.watches)} is not a list of four bell ids`);
    const morningSet = new Set(asList(mystery.day2?.watches));
    const seen0 = new Set();
    for (const w of w0list) {
      if (typeof w !== 'string' || !w.trim()) say(`day0.watches: ${JSON.stringify(w)} is not a watch id`);
      else if (ix.watchIdx.has(w)) say(`day0.watches: ${w} is one of the four bells, and a bell of the walking day is the walking day's own`);
      else if (morningSet.has(w)) say(`day0.watches: ${w} is one of the morning's bells, and a bell of the walking day is the walking day's own`);
      else if (seen0.has(w)) say(`day0.watches: ${w} is listed twice, so two bells of the walking day are one bell`);
      else seen0.add(w);
    }
    // Everybody who is in the castle that day is somewhere at every bell of it,
    // or nowhere on purpose. The one who does not arrive until the morning after
    // is the one exception, and he is the only `arrives: 2` there is.
    for (const [npcId, npc] of cast) {
      if (arrivesLate(npc)) {
        if (d0.schedule?.[npcId]) say(`${npcId}: arrives on day ${npc.arrives} and still has a station on the walking day`);
        continue;
      }
      if (!d0.schedule?.[npcId]) { say(`${npcId}: no row in day0.schedule, so the walking day cannot place him`); continue; }
      for (const w of w0list) {
        if (!(w in d0.schedule[npcId])) say(`${npcId}: no station at ${w} (use null for not in the castle)`);
        const s = d0.schedule[npcId][w];
        if (s && !rooms.has(s.room)) say(`${npcId}: station at ${w} is in no room (${JSON.stringify(s.room)})`);
        else if (s && s.level != null && rooms.get(s.room).level !== s.level) say(`${npcId}: station at ${w} says level ${s.level} but ${s.room} is on ${rooms.get(s.room).level}`);
      }
    }
    for (const npcId of Object.keys(d0.schedule ?? {})) if (!cast.has(npcId)) say(`day0.schedule: ${npcId} is not in the cast`);

    // What is on the ground that day: six ids, each an evidence row the castle
    // really builds a prop for. A name with no row is a prop that never comes
    // back, and for the muniment leaf that is a hole in the King's Tower wall.
    for (const id of asList(d0.evidence)) {
      if (!evidence.has(id)) say(`day0.evidence: ${id} is not an evidence row, so nothing in the castle answers to it`);
    }
    // The pane the last ring puts up. A missing half of it is a blank pane, the
    // same failure `day2.endings` has its own rail for.
    for (const k of ['title', 'text', 'button']) {
      if (typeof d0.night?.[k] !== 'string' || !d0.night[k].trim()) say(`day0.night.${k}: no text, so the walking day would end on a blank pane`);
    }

    // The stations themselves, against the castle, exactly as day one is.
    if (nav) {
      const code = (id) => rooms.get(id)?.code ?? id;
      for (const npcId of cast.keys()) {
        if (!d0.schedule?.[npcId]) continue;
        let previous = null, previousWatch = null;
        for (const w of w0list) {
          const point = nav.at(npcId, w);
          const s = d0.schedule[npcId][w];
          if (s && !point) { say(`${npcId}: station at ${w} has no tile`); continue; }
          if (!point) continue;
          if (!nav.standable(point)) {
            say(`${npcId}: station at ${w} is at tile (${s.tile.join(', ')}) on level ${point.level}, where there is no floor to stand on`);
          } else {
            if (nav.inNamedRoom(point) === false) say(`${npcId}: station at ${w} is at tile (${s.tile.join(', ')}), which is not inside ${s.room}`);
            if (rooms.get(s.room)?.barred) {
              if (!nav.talkable(point)) say(`${npcId}: station at ${w} is in ${code(s.room)}, behind bars with nowhere within ${TALK_RANGE} m of them to stand`);
            } else if (!nav.walkable(point)) {
              say(`${npcId}: station at ${w} is at tile (${s.tile.join(', ')}) in ${code(s.room)}, which the player cannot walk to`);
            }
            if (previous && !nav.route(previous, point)) {
              say(`${npcId}: no path from ${code(previous.room)} at ${previousWatch} to ${code(point.room)} at ${w}`);
            }
          }
          previous = point; previousWatch = w;
        }
        /* AND THE WALK INTO THE NIGHT. The last bell of the walking day to the
         * first bell of the day of the death: the castle sleeps in between and
         * nobody is carried anywhere (open call 4), so a body that cannot walk
         * it wakes up somewhere it teleported to. */
        const lastW = w0list[w0list.length - 1];
        const from = nav.at(npcId, lastW);
        const to = watches.length ? nav.at(npcId, watches[0]) : null;
        if (from && to && !nav.route(from, to)) {
          say(`${npcId}: no path from ${code(from.room)} at ${lastW} to ${code(to.room)} at ${watches[0]}`);
        }
      }
      // Two bodies in one place at one bell is one body the player can never talk to.
      for (const w of w0list) {
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
  }

  /* --- The second day (#533 to #537). Everything below is about `day2`, and
   * the five nav rails it reuses are the five above: floor under the station,
   * inside the room it names, 1.5 m clear of everybody else at that bell,
   * somewhere the player can reach, and a walk from where the body stood at
   * the bell before — which for the morning after is the Vespers station, so a
   * cast that teleports overnight is caught the same way a cast that teleports
   * at Terce is. What is new is that a day two has seven shapes, one per
   * ending, and every one of them has to hold. */
  const d2 = mystery.day2;
  if (!d2 || typeof d2 !== 'object') {
    say('day2: no second day, so the epilogue is the end of the game');
  } else {
    /* THE MORNING'S OWN BELLS (#699). A list, in order, none of them one of the
     * four: `watches` is still exactly four (asserted at the top of this file)
     * and `state.watch` indexes whichever list the day names, so an id in both
     * lists is a save index that means two different bells. The station rails
     * below run against the morning's FIRST bell, because `day2.schedule` is
     * one station per person for the whole morning; a morning that ever writes
     * a station per bell is the row that has to walk this loop per bell. */
    const w2list = asList(d2.watches);
    if (!Array.isArray(d2.watches) || !w2list.length) say(`day2.watches: ${JSON.stringify(d2.watches)} is not a non-empty list of bell ids`);
    if ('watch' in d2) say('day2.watch: the morning names its bells in `watches`, a list, and there is one spelling of it (#699)');
    const seen2 = new Set();
    for (const w of w2list) {
      if (typeof w !== 'string' || !w.trim()) say(`day2.watches: ${JSON.stringify(w)} is not a watch id`);
      else if (ix.watchIdx.has(w)) say(`day2.watches: ${w} is one of the four bells, and a morning bell is the morning's own`);
      else if (seen2.has(w)) say(`day2.watches: ${w} is listed twice, so two bells of the morning are one bell`);
      else seen2.add(w);
    }
    const w2 = w2list[0];
    const outcomes = dayTwoOutcomes(mystery);
    if (!outcomes.length) say('day2: the accusation table has no verdicts, so no morning has a shape');

    // Everybody in the cast is somewhere on the morning after, or nowhere on purpose.
    for (const [npcId, npc] of cast) {
      // The walking day's own man is not here at all, and a row for him would be
      // a station for somebody who is dead by this bell (#752, open call 8).
      if (beforeDayOne(npc)) {
        if (npcId in (d2.schedule ?? {})) say(`${npcId}: is in the castle on the walking day only (arrives: 0) and still has a station at ${w2}`);
        continue;
      }
      if (!(npcId in (d2.schedule ?? {}))) say(`${npcId}: no station at ${w2} (use null for not in the castle)`);
    }
    for (const npcId of Object.keys(d2.schedule ?? {})) if (!cast.has(npcId)) say(`day2.schedule: ${npcId} is not in the cast`);

    // The one whose conversation ends it.
    const ends = d2.ends;
    if (!cast.has(ends)) say(`day2.ends: ${JSON.stringify(ends)} is not in the cast, so nothing ends the second day`);
    else if (!d2.schedule?.[ends]) say(`day2.ends: ${ends} has no station at ${w2}, so the one conversation that ends the day cannot be had`);

    // The stations themselves, against the castle, exactly as day one is.
    if (nav && w2) {
      const code = (id) => rooms.get(id)?.code ?? id;
      const here = [];
      for (const [npcId, st] of Object.entries(d2.schedule ?? {})) {
        if (!cast.has(npcId) || !st) continue;
        if (!rooms.has(st.room)) { say(`${npcId}: station at ${w2} is in no room (${JSON.stringify(st.room)})`); continue; }
        if (st.level != null && rooms.get(st.room).level !== st.level) say(`${npcId}: station at ${w2} says level ${st.level} but ${st.room} is on ${rooms.get(st.room).level}`);
        const point = nav.at(npcId, w2);
        if (!point) { say(`${npcId}: station at ${w2} has no tile`); continue; }
        if (!nav.standable(point)) { say(`${npcId}: station at ${w2} is at tile (${st.tile.join(', ')}) on level ${point.level}, where there is no floor to stand on`); continue; }
        if (nav.inNamedRoom(point) === false) say(`${npcId}: station at ${w2} is at tile (${st.tile.join(', ')}), which is not inside ${st.room}`);
        if (rooms.get(st.room)?.barred) {
          if (!nav.talkable(point)) say(`${npcId}: station at ${w2} is in ${code(st.room)}, behind bars with nowhere within ${TALK_RANGE} m of them to stand`);
        } else if (!nav.walkable(point)) {
          say(`${npcId}: station at ${w2} is at tile (${st.tile.join(', ')}) in ${code(st.room)}, which the player cannot walk to`);
        }
        // Overnight is still a walk. Whoever was in the castle at the last bell
        // of day one has to be able to get from there to here on his own feet.
        const last = watches.length ? nav.at(npcId, watches[watches.length - 1]) : null;
        if (last && !nav.route(last, point)) say(`${npcId}: no path from ${code(last.room)} at ${watches[watches.length - 1]} to ${code(st.room)} at ${w2}`);
        here.push([npcId, point]);
      }
      for (let a = 0; a < here.length; a++) {
        for (let b = a + 1; b < here.length; b++) {
          const [idA, pA] = here[a], [idB, pB] = here[b];
          if (pA.level !== pB.level) continue;
          const gap = Math.hypot(pA.x - pB.x, pA.z - pB.z);
          if (gap < STATION_CLEARANCE) say(`${idA} and ${idB} stand ${gap.toFixed(2)} m apart at ${w2}, inside the ${STATION_CLEARANCE} m two bodies need`);
        }
      }
    }

    /* THE MAN WHO HANGS IS NOT AT HIS STATION IN THE MORNING. `absent` is the
     * rule that takes him out and it is one field, which makes it exactly the
     * kind of thing that can be switched off without anything on the screen
     * saying so: the castle would open at Lauds with the Clerk at his desk on
     * the morning he was hanged from the Stockhouse Tower, and every other rail
     * in this file would still pass. SPECS.md proposed breaking this by writing
     * the Clerk a day-two station; that does not break it and should not, since
     * the Clerk has a morning in the four endings he lives through. The rule
     * itself is the thing worth guarding (#535). */
    const hangsAndStands = new Map();
    for (const o of outcomes) {
      if (!o.who || o.who === 'nobody') continue;
      if (!d2.schedule?.[o.who]) continue;
      if (dayTwoAbsent(mystery, o).has(o.who)) continue;
      if (!hangsAndStands.has(o.who)) hangsAndStands.set(o.who, []);
      hangsAndStands.get(o.who).push(o.key);
    }
    for (const [who, keys] of hangsAndStands) say(`${who}: has a station at ${w2} and hangs in ${keys.join(', ')}`);
    for (const o of outcomes) {
      for (const id of dayTwoAbsent(mystery, o)) if (!cast.has(id)) say(`day2.absent: ${o.key} takes ${id}, who is not in the cast`);
    }

    /* EVERY MORNING RESOLVES TO LINES, AND EVERY SET OF LINES IS SOME MORNING'S.
     * Both halves, because they fail in opposite directions and neither shows
     * on the screen: a missing set opens the dialogue box on `undefined`, and a
     * set nothing reaches is content written for an ending that cannot happen,
     * which reads as work done. */
    for (const o of outcomes) {
      const gone = dayTwoAbsent(mystery, o);
      for (const npcId of cast.keys()) {
        if (gone.has(npcId) || !d2.schedule?.[npcId]) continue;
        if (!dayTwoLines(mystery, npcId, o)) say(`${npcId}: no day-two lines after the verdict ${o.key} (a ${o.class})`);
      }
    }
    for (const npcId of Object.keys(d2.lines ?? {})) {
      if (!cast.has(npcId)) { say(`day2.lines: ${npcId} is not in the cast`); continue; }
      const used = new Set();
      for (const o of outcomes) {
        if (dayTwoAbsent(mystery, o).has(npcId) || !d2.schedule?.[npcId]) continue;
        const k = dayTwoLineKey(mystery, npcId, o);
        if (k) used.add(k);
      }
      for (const k of Object.keys(d2.lines[npcId])) {
        if (!used.has(k)) say(`${npcId}: day-two lines for ${k} that no ending ever reaches`);
      }
    }

    /* --- WHAT THE PLAYER READ, ON THE MORNING AFTER (#573). `day2.knew` rows
     * replace a line set for a player holding a named clue. Nine ways one can
     * be dead and none of them shows on the screen, because the cascade behind
     * the row still answers and the morning reads exactly as it did before the
     * row was written: a speaker not in the cast, a speaker with no station at
     * this watch, a clue the mystery does not have, a clue nothing in the
     * castle yields (that one is below, beside `held`), no lines, no `why`, a
     * `when` naming no ending the accusation table can reach, a row on a
     * morning its speaker is hanged on, and two rows on one person and one
     * clue that both fire on one morning, where only the first is read. The
     * tenth — a row that is the ONLY answer for some ending — cannot happen by
     * construction, because the rail above calls `dayTwoLines` with no
     * journal. */
    (d2.knew ?? []).forEach((row, i) => {
      const where = `day2.knew[${i}]`;
      if (!row || typeof row !== 'object') { say(`${where}: not an object`); return; }
      if (!cast.has(row.npc)) { say(`${where}: ${JSON.stringify(row.npc)} is not in the cast`); return; }
      if (!d2.schedule?.[row.npc]) say(`${where}: ${row.npc} has no station at ${w2}, so the lines are never spoken`);
      if (!clues.has(row.clue)) say(`${where}: ${JSON.stringify(row.clue)} is not a clue, so nothing can be holding it`);
      if (!linesOf(row.lines)) say(`${where}: no lines, so a player who knew would be told nothing`);
      if (typeof row.why !== 'string' || !row.why.trim()) say(`${where}: no \`why\`, so nothing says what the player knowing changes`);
      for (const [field, list] of [['when', row.when], ['unless', row.unless]]) {
        if (list == null) continue;
        for (const k of asList(list)) {
          if (!outcomes.some((o) => o.key === k || o.class === k)) say(`${where}: \`${field}\` names ${JSON.stringify(k)}, which is neither an ending nor a verdict class`);
        }
      }
      const live = outcomes.filter((o) => appliesTo(row, o) && !dayTwoAbsent(mystery, o).has(row.npc));
      if (!live.length) say(`${where}: applies to no ending ${row.npc} is alive and in the castle for, so the lines are never read`);
    });
    for (const o of outcomes) {
      const seen = new Map();
      (d2.knew ?? []).forEach((row, i) => {
        if (!row || !cast.has(row.npc) || !appliesTo(row, o)) return;
        const key = `${row.npc}/${row.clue}`;
        if (seen.has(key)) say(`day2.knew: ${row.npc} has two rows on ${row.clue} that both fire after the verdict ${o.key} (rows ${seen.get(key)} and ${i}), and only the first would be read`);
        else seen.set(key, i);
      });
    }

    /* --- The castle's own half (#539). The rows name pieces the plan builds
     * and verbs the builder implements, and the two lists are held to each
     * other here rather than discovered on the one morning the change was
     * meant to happen. What this cannot check is what the change looks like;
     * what it can check is that it is possible at all, that somebody wrote
     * down why, and that nothing in it takes the castle away from the player
     * — the last of which is `test/layout.mjs`'s, against two real fills. */
    const piecesById = new Map((nav?.plan?.pieces ?? []).map((pc) => [pc.id, pc]));
    const gateIds = new Set((nav?.plan?.gates ?? []).map((g) => g.id));
    const surfaceIds = new Set((nav?.plan?.surfaces ?? []).map((sf) => sf.id));
    (d2.castle ?? []).forEach((ch, i) => {
      const where = `day2.castle[${i}]`;
      if (!ch || typeof ch !== 'object') { say(`${where}: not an object`); return; }
      if (!DAY_SETS.includes(ch.set)) { say(`${where}: \`set\` ${JSON.stringify(ch.set)} is not one of ${DAY_SETS.join(', ')}`); return; }
      if (typeof ch.why !== 'string' || !ch.why.trim()) say(`${where}: no \`why\`, so nothing says what the verdict did to ${ch.piece}`);
      for (const [field, list] of [['when', ch.when], ['unless', ch.unless]]) {
        if (list == null) continue;
        for (const k of asList(list)) {
          if (!outcomes.some((o) => o.key === k || o.class === k)) say(`${where}: \`${field}\` names ${JSON.stringify(k)}, which is neither an ending nor a verdict class`);
        }
      }
      if (!outcomes.some((o) => appliesTo(ch, o))) say(`${where}: applies to no ending, so ${ch.piece} never changes`);
      if (nav?.plan) {
        const piece = piecesById.get(ch.piece);
        if (!piece) { say(`${where}: the castle builds no piece called ${JSON.stringify(ch.piece)}`); return; }
        const isGate = gateIds.has(ch.piece);
        if ((ch.set === 'open' || ch.set === 'shut') && !isGate) say(`${where}: ${ch.piece} is a ${piece.kind}, and only a gate leaf can be ${ch.set}`);
        if ((ch.set === 'gone' || ch.set === 'shown') && isGate) say(`${where}: ${ch.piece} is a gate leaf, so say open or shut rather than ${ch.set}`);
        // A floor that vanishes is a hole the player falls through, and the
        // walkability grid reads `surfaces` rather than colliders, so nothing
        // downstream would notice it had gone.
        if (ch.set === 'gone' && surfaceIds.has(ch.piece)) say(`${where}: ${ch.piece} is floor the player stands on, and hiding it leaves a hole nothing else can see`);
      }
    });
    // Two rows on one piece must not both fire on one morning.
    for (const o of outcomes) {
      const seen = new Map();
      (d2.castle ?? []).forEach((ch, i) => {
        if (!appliesTo(ch, o)) return;
        if (seen.has(ch.piece)) say(`day2.castle: ${ch.piece} is set twice after the verdict ${o.key} (rows ${seen.get(ch.piece)} and ${i}), and only the last would show`);
        else seen.set(ch.piece, i);
      });
    }

    // The closing pane, one per ending.
    for (const o of outcomes) {
      const e = d2.endings?.[o.key];
      if (!e || typeof e.signed !== 'string' || !e.signed.trim() || typeof e.after !== 'string' || !e.after.trim()) {
        say(`day2.endings: ${o.key} has no signed/after text, so the second day would end on a blank pane`);
      }
    }
    for (const key of Object.keys(d2.endings ?? {})) {
      if (!outcomes.some((o) => o.key === key)) say(`day2.endings: ${key} is not an ending the accusation table can reach`);
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
  // Every non-default dialogue state on every NPC is reached by a press, named
  // by a stage, or named by a side quest that holds that person (rank 9). The
  // side quests are kept per-npc rather than poured into one set, so a knife
  // state on the cook does not quietly excuse the same key on the Steward.
  const stageStates = new Set(Object.values(quest?.stages ?? {}).map((s) => s.dialogueState));
  const sideStates = new Map();
  for (const q of sideQuests ?? []) {
    if (!q?.npc) continue;
    if (!sideStates.has(q.npc)) sideStates.set(q.npc, new Set());
    for (const st of Object.values(q.stages ?? {})) sideStates.get(q.npc).add(st.dialogueState);
  }
  for (const [id, npc] of cast) {
    for (const state of Object.keys(npc.dialogue ?? {})) {
      if (state !== 'default' && !statesOf(id).has(state) && !stageStates.has(state) && !sideStates.get(id)?.has(state)) say(`${id}: state ${state} is reached by no press, no stage and no side quest`);
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

  /* A `knew` row keyed on a clue nothing can yield is a morning nobody ever
   * sees, and it reads as written content. Here rather than in the day-two
   * section above because `held` is the discoverability fixed point and that is
   * computed between the two. */
  for (const [i, row] of (mystery.day2?.knew ?? []).entries()) {
    if (row && clues.has(row.clue) && !held(row.clue)) say(`day2.knew[${i}]: ${row.clue} is not discoverable, so nobody can ever be holding it at ${dayWatchesOf(mystery, 2)[0]}`);
  }

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
    day: 1,
    watch: 0,
    clues: [],
    pressed: {},
    taken: [],
    read: [],
    visited: [],
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
  st.clues ??= []; st.pressed ??= {}; st.taken ??= []; st.read ??= []; st.visited ??= []; st.locks ??= []; st.accusations ??= [];
  st.refusals ??= 0; st.watch ??= 0; st.day ??= 1;

  const day2 = mystery?.day2 ?? null;
  const onDayTwo = () => st.day === 2 && !!day2;
  /* AND THE DAY BEFORE, A THIRD BRANCH BESIDE IT (#750 to #756, open call 1).
   * `onDayZero()` is deliberately its own predicate and every clause below that
   * needs it says so out loud, rather than `onDayTwo()` becoming a three-way
   * that means "not day one". The two days have almost nothing in common: the
   * morning after has a verdict and no clues, and the walking day has neither. */
  const day0 = mystery?.day0 ?? null;
  const onDayZero = () => st.day === 0 && !!day0;
  // The day names its bells and `st.watch` indexes that list, not the four
  // (#699). All three lists are read once here; `dayWatchesOf` is the only
  // place that picks between them.
  const dayOneWatches = dayWatchesOf(mystery, 1);
  const morningWatches = dayWatchesOf(mystery, 2);
  const walkingWatches = dayWatchesOf(mystery, 0);
  const dayWatches = () => (onDayZero() ? walkingWatches : onDayTwo() ? morningWatches : dayOneWatches);
  const watchId = () => { const list = dayWatches(); return list[Math.min(Math.max(st.watch, 0), list.length - 1)]; };
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

    /** The bells of the day the save is on, in order (#699). */
    get watches() { return [...dayWatches()]; },
    holds,
    npcState,

    /**
     * Which day the save is on: 0 on the walking day, 1 from the mystery's own
     * first bell, 2 after the epilogue's button (#750 to #756, #533).
     */
    get day() { return onDayZero() ? 0 : onDayTwo() ? 2 : 1; },

    /** The ending the recorded accusation is, or null while the day is running. */
    outcome() { return outcomeOf(mystery, st); },

    /**
     * Where somebody stands, at a watch on whichever day this is. The day-two
     * lookup is the day-two schedule with `absent` already taken out of it, so
     * a caller that asks "is there anybody there" gets the hanged man's answer
     * without knowing there was a hanging. main.js is that caller.
     *
     * A bell of the morning is any id in `day2.watches` (#699), and the
     * schedule is one station per person for the whole of it, so every bell of
     * the morning reads the same row.
     */
    stationOf(npcId, watch = watchId()) {
      if (day2 && asList(day2.watches).includes(watch)) {
        if (!onDayTwo()) return null;
        if (dayTwoAbsent(mystery, outcomeOf(mystery, st)).has(npcId)) return null;
        return day2.schedule?.[npcId] ?? null;
      }
      // A bell of the walking day is any id in `day0.watches`, and the schedule
      // is a station per person per bell, so it is read per bell the way day
      // one's is. Nobody is absent on it: the walking day has no verdict to take
      // anybody out of the castle.
      if (day0 && asList(day0.watches).includes(watch)) {
        if (!onDayZero()) return null;
        return day0.schedule?.[npcId]?.[watch] ?? null;
      }
      return ix.station(npcId, watch);
    },

    /** The lines somebody speaks on the morning after, or null on day one. */
    dayTwoLinesFor(npcId) { return onDayTwo() ? dayTwoLines(mystery, npcId, outcomeOf(mystery, st), st.clues) : null; },

    /** Null when the NPC is not in the castle or asleep; else their state, station and the statements a talk would grant. */
    available(npcId) {
      if (!ix.cast.has(npcId)) return null;
      /* THE WALKING DAY HAS STATIONS AND NO STATEMENTS. There are no clues on it,
       * so there is nothing for a conversation to grant; what the player gets is
       * the `day0` line set, which is the stage's `dialogueState` and is
       * npcs.json's (open call 6). `asleep` IS honoured, unlike the morning
       * after's: the sentry keeps the night watch the evening before as well, and
       * a body the player cannot talk to is the same body either day. */
      if (onDayZero()) {
        const station = api.stationOf(npcId);
        if (!station || station.asleep) return null;
        return { npc: npcId, state: npcState(npcId), station, statements: [] };
      }
      if (onDayTwo()) {
        const station = api.stationOf(npcId);
        // NOBODY IS ASLEEP ON THE MORNING AFTER. `asleep` is a day-one station
        // flag; a day-two station is somewhere a body stands and can be spoken
        // to, and there are no statements to grant because there are no clues.
        return station ? { npc: npcId, state: npcState(npcId), station, statements: [] } : null;
      }
      if (!ix.speakable(npcId, watchId())) return null;
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
      // The journal is still in the player's hand on the morning after and the
      // presses are still in the data. Nobody is moved by any of them: the day
      // they belonged to is over, and a Steward pressed into `admits` at Lauds
      // would be granting a clue against a verdict already written down.
      // And on the walking day for the same reason from the other end: the
      // journal is empty, there are no clues to hold and nothing anybody says
      // yet is a thing to be pushed back at them.
      if (onDayZero() || onDayTwo() || !a || !holds(clueId)) return [{ type: 'shrug', npc: npcId, clue: clueId }];
      const p = presses.find((x) => x.npc === npcId && x.on === clueId && asList(x.from).includes(a.state));
      if (!p) return [{ type: 'shrug', npc: npcId, clue: clueId }];
      (st.pressed[npcId] ??= []).push(p.to);
      const effects = [{ type: 'state', npc: npcId, state: p.to }, { type: 'event', name: `press:${npcId}:${clueId}` }];
      for (const id of statementsOf(npcId)) grant(id, effects);
      return effects;
    },

    /**
     * The bell, on whichever day it is. The last ring of a day moves no watch:
     * on day one that is the fourth, and the Constable demands the accusation.
     *
     * THE MORNING'S BELL IS A BELL AGAIN (#700). This opened with a bare
     * `if (ended())`, and `ended()` is true from the verdict onward, so the
     * chapel bell rope at Lauds returned no effects at all: no sound, no event,
     * nothing. The guard is what stops a ring between the verdict and the
     * epilogue (#520) and it still does, because that is a day one that has
     * ended. The morning has no Constable to demand anything, so its last ring
     * is the ring and the sound and nothing else, and with one bell in
     * `day2.watches` every morning ring is that one. Rings are numbered within
     * the day's OWN list so the morning borrows the four characters
     * data/sounds.json already has (#701, and test/layout.mjs holds it).
     */
    ring() {
      if (ended() && !onDayTwo()) return [];
      const list = dayWatches();
      const effects = [];
      if (st.watch < list.length - 1) {
        st.watch += 1;
        const n = st.watch;
        effects.push({ type: 'watch', watch: list[n], index: n });
        effects.push({ type: 'stations', stations: Object.fromEntries([...ix.cast.keys()].map((id) => [id, api.stationOf(id, list[n])])) });
        effects.push({ type: 'event', name: `bell:${n}` });
      } else if (onDayZero()) {
        /* THE LAST RING OF THE WALKING DAY IS THE NIGHT (#755, open call 5). It
         * moves no watch and does not wrap: a day before a death is a day that
         * ends. `night` is the effect the manager puts the pane up on, exactly
         * as `demand` is the one it opens the accusation on, and `bell:4` goes
         * with it so the graph moves and data/sounds.json's fourth character
         * rings (#701). The day is numbered within its own list, so the walking
         * day's four rings are `bell:1` to `bell:4` and nothing was written
         * into that file. */
        effects.push({ type: 'night', watch: list[st.watch] });
        effects.push({ type: 'event', name: `bell:${list.length}` });
      } else if (onDayTwo()) {
        effects.push({ type: 'event', name: `bell:${list.length}` });
      } else {
        // The fourth ring. The watch stays at Vespers (the save clamps it to the
        // four); the Constable demands the accusation, and the frame moves.
        effects.push({ type: 'demand', judge: accusation.judge });
        effects.push({ type: 'event', name: `bell:${list.length}` });
      }
      return effects;
    },

    /**
     * The player has walked into a room. Two things come of it. Every `L` clue
     * whose source is the room lands, which is how `walk-crosses` is found;
     * and the room goes on `visited`, the map's set (BACKLOG.md rank 10), once
     * — a `visited` effect the first time and nothing the second, so the
     * manager can mark the autosave on a first visit and not on every step
     * back through a doorway. The engine does not know which rooms the plan
     * builds; main.js only calls this for one that is, and `repair` drops
     * anything that is not (src/save.js).
     */
    enter(room, level = null) {
      const effects = [{ type: 'entered', room, level }];
      if (typeof room === 'string' && room && !st.visited.includes(room)) {
        st.visited.push(room);
        effects.push({ type: 'visited', room, level });
      }
      /* THE MAP IS FILLED IN BY WALKING, ON EVERY DAY THERE IS (open call 3);
       * THE CLUE IS NOT. `visited` is a fact about the player and carries across
       * the night, so the walking day is worth walking for the map alone. An `L`
       * clue is a fact about the case, and `walk-crosses` in a walking day's
       * journal would be the mystery started the day before it happened. */
      if (onDayZero()) return effects;
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
      /* AND ON THE WALKING DAY THERE IS NOTHING TO LOOK FOR (open call 9). One
       * effect, `ui.quiet`'s, and nothing granted, nothing taken and nothing
       * refused: the six things `day0.evidence` leaves on the ground are
       * furniture the day before, and the other five are not in the castle at
       * all because the manager never shows them. This is above `taken` on
       * purpose — a thing pocketed in the mystery is not pocketed the day
       * before it, and a day-0 save cannot be carrying `taken` anyway. */
      if (onDayZero()) return [of('quiet')];
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
      // Nobody is dead yet, so there is nobody to name (#752). Nothing reaches
      // this on the walking day — `explore` runs no `openAccusation` and the
      // Constable's `day0` lines carry no `{ACCUSE}` — and it is refused here as
      // well, because an accusation recorded on a day 0 is the one thing
      // `repair`'s incoherence rail cannot tell from a hand-edited save.
      if (onDayZero() || ended()) return [];
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

    /**
     * The morning after. Sets `day` to 2 on the save and hands back the shape
     * of the castle it makes: which watch, who is where, who is gone and what
     * each of them says, all read off the one accusation the player actually
     * made. Idempotent — calling it twice reads the same recorded verdict and
     * returns the same morning — which is what lets a save resumed in either
     * day-two stage run it again on the way in.
     *
     * THE MORNING STARTS AT ITS FIRST BELL, AND ONLY THE FIRST TIME (#699).
     * `st.watch` is an index into the day's own list, so it has to come back to
     * 0 when day one leaves it at 3. It must NOT come back to 0 on the second
     * call: this runs again on entering `end` and on every reload in either
     * day-two stage, and a morning that has rung on would be rewound by being
     * re-entered.
     */
    /**
     * THE WALKING DAY, APPLIED (#750 to #756). Sets `day` to 0 on the save and
     * hands back the shape of the castle that makes: which bell, who is standing
     * where — the twelve and Hywel, nobody absent, because there is no verdict to
     * take anybody out — what is on the ground, what the overlay does to the
     * stone, and the pane the last ring ends on.
     *
     * `beginDay2`'s shape, including its guard (#699): `st.watch` is an index
     * into the day's own list, so it comes back to 0 on the way in and MUST NOT
     * on the second call. This runs on entering `explore`, which is every load
     * of a walking-day save, and a walking day that has rung on would be
     * rewound by being re-entered.
     *
     * There are no `lines` in what comes back, unlike the morning after's: what
     * the thirteen say on the walking day is their own `day0` set in npcs.json,
     * reached by the stage's `dialogueState`, so `_linesFor` needs no day-0
     * branch and the errands go on speaking over it (open call 6).
     */
    beginDay0() {
      if (!day0) return null;
      if (st.day !== 0) { st.day = 0; st.watch = 0; }
      const stations = {};
      for (const npcId of ix.cast.keys()) stations[npcId] = api.stationOf(npcId, watchId());
      return {
        day: 0, watch: watchId(), watches: [...walkingWatches], stations,
        evidence: asList(day0.evidence), night: day0.night ?? null,
        castle: asList(day0.castle).map((c) => ({ piece: c.piece, set: c.set })),
      };
    },

    /**
     * AND THE MYSTERY BEGINNING (#755). The other half of `beginDay0`: sets
     * `day` to 1, puts the watch back to the first of the four, and hands back
     * the day-one castle — everybody at their Prime station, and `undoDay` of
     * the walking day's overlay, which is what takes the day before's stone off
     * again. It is what `day:1` runs, from the night pane's button or from
     * `QuestManager.enterMystery()`, and it is the only thing that writes day 1.
     *
     * The same guard, for the same reason: on a day-one state at Sext it leaves
     * the watch at Sext, because `arrive` carries this on `enter` and a save
     * resumed there must not be rewound to Prime.
     */
    beginDay1() {
      if (st.day !== 1) { st.day = 1; st.watch = 0; }
      const stations = {};
      for (const npcId of ix.cast.keys()) stations[npcId] = api.stationOf(npcId, watchId());
      return {
        day: 1, watch: watchId(), watches: [...dayOneWatches], stations,
        castle: undoDay(asList(day0?.castle)),
      };
    },

    beginDay2() {
      const outcome = outcomeOf(mystery, st);
      if (!day2 || !outcome) return null;
      if (st.day !== 2) { st.day = 2; st.watch = 0; }
      const gone = dayTwoAbsent(mystery, outcome);
      const stations = {}, lines = {};
      for (const npcId of ix.cast.keys()) {
        const station = gone.has(npcId) ? null : (day2.schedule?.[npcId] ?? null);
        stations[npcId] = station;
        if (!station) continue;
        // The journal the save carried over is the fourth argument: a `knew`
        // row reads it and the cascade behind it does not (`dayTwoLines`).
        const said = dayTwoLines(mystery, npcId, outcome, st.clues);
        if (said) lines[npcId] = said;
      }
      return { day: 2, watch: watchId(), watches: [...morningWatches], outcome, stations, lines, absent: [...gone], ends: day2.ends ?? null, castle: dayTwoCastle(mystery, outcome) };
    },

    /** The second day's closing pane for the recorded ending, or null. */
    dayTwoEnding() {
      const outcome = outcomeOf(mystery, st);
      return outcome ? (day2?.endings?.[outcome.key] ?? null) : null;
    },

    /** Held clues in the order found, with their text. */
    journal() {
      return st.clues.map((id) => clues.get(id)).filter(Boolean).map((c) => ({ id: c.id, kind: c.kind, title: c.title, text: c.text, herring: !!c.herring }));
    },
  };
  return api;
}
