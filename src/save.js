// save.js — the one save slot for Castle Conundrum, through `./gvb-save.js`,
// this repo's vendored copy of the site-wide save module (#502; relative
// import so this file runs in Node too). Key `castleConundrumSave_v1`, game
// `castle-conundrum`, version 6. The key never changes (#36), and it does not
// change here either: what moved is the version number inside it.
//
//   { stage, quests{id: stage}, reputation{outer, inner}, day, watch,
//     clues[], pressed{npc: state[]},
//     taken[], read[], visited[], locks[], accusations[{who, clues, verdict, watch}],
//     refusals, riddleWrong, player{x, y, z, yaw} | null }
//
// VERSION 2 IS THE SECOND DAY (#533). #413 said the schema was complete so that
// no later phase would add a field, and no phase did: all seven shipped against
// version 1. A day two is the thing after the plan rather than a part of it, and
// the honest record of a field arriving is a version number, not a `repair`
// default that pretends the field was always there (#37 draws exactly that
// line). So `day` comes in through `migrate`, which runs only on the drift, and
// `repair` then holds it to the two values it can have on every load, including
// the ones `migrate` never touched.
//
// VERSION 3 IS `read` (#551, the six readable documents). Unlike `day`,
// nothing about an old save's `read` can be incoherent the way a version-1
// save claiming day 2 was — there is no verdict-shaped fact a missing `read`
// could contradict — so `repair`'s own default (an empty list, the same way a
// missing `taken` always defaulted to one) would be correct on its own.
// `migrate` still gets the version, because #37's line is about the field's
// arrival being honest, not about whether repair could have covered for it.
//
// VERSION 4 IS THE SIDE QUESTS (BACKLOG.md rank 9). `quests` is one stage id
// per file in data/quests/, and it is `read`'s case rather than `day`'s: there
// is no fact a missing `quests` could contradict, because a quest that has
// never moved is a quest at its own `start`, which is what repair writes
// anyway. The version goes up because the field arriving is what a version
// number is for (#37), not because migrate has anything to do.
//
// VERSION 5 IS `visited` (BACKLOG.md rank 10, the map). One room id per room
// the player has stood in, in the order they were first entered, and it is
// `read`'s case again: a room never entered is a room not on the list, which
// is what repair writes for a save with no list at all. The catalog's rooms
// come off data/scene-config.json's `rooms`, which is the list `makePlan`
// builds the castle's rooms from and nothing else, so a room the plan stops
// building is a room repair drops from the set on the next load.
//
// VERSION 6 IS `reputation` (BACKLOG.md rank 8). Two counters, `outer` and
// `inner`, one moved per side quest finished in that ward. It is `day`'s case
// and not `read`'s: a version-5 save already says where every side quest
// stands, so a player who finished three errands yesterday has a true answer
// sitting in the file, and defaulting the new field to zero would say they had
// done nothing. So `migrate` counts the terminal quests that save is already
// carrying, per ward, and that is the one thing about this field only `migrate`
// can say — `repair`'s own rail would answer a missing `reputation` with zeroes
// whether migrate ran or not (#37, #147). `repair` then clamps each counter to
// the number of quests data/quests/ has in that ward, which is the most a
// counter can honestly read: one per errand, and an errand finishes once.
//
// AND WHY THERE IS NO VERSION 7 (#699). The morning after names its own bells
// now (#696) and `watch` is an index into whichever list the day says, where
// on day two it used to be ignored outright. No field arrived and no field
// changed shape, so there is no drift for `migrate` to be honest about. #37's
// line runs the other way here. What moved is `repair`, which runs on every
// load: `watch` clamps against the repaired `day`'s own list, and the demotion
// of an incoherent `day: 2` re-clamps against day one on the way past. A
// version-6 save carrying `day: 2, watch: 3` is not a save from another
// schema, it is a save carrying a number that never meant anything, and 0 is
// what it has always been worth.
//
// `validate` refuses a non-object and a non-string stage and nothing else;
// everything past that is `repair`'s, which runs on every load (#37) and
// builds its catalog from data/mystery.json, data/quest.json and
// data/documents.json rather than from a list written beside it, so the ids a
// save may carry cannot drift from the ids the game renders. Unknown ids are
// dropped from every list, a stage the graph does not have resets to `start`,
// `watch` clamps to the four, and a `player` with a non-finite coordinate is
// nulled. test/save.mjs asserts every rail twice: the repaired value, and what
// goes wrong without it.

import { createSaveSlot } from './gvb-save.js';
import { dayWatchesOf } from './mystery.js';
// The two wards, from the file that defines them for the quest files themselves,
// so the save cannot come to know a third one the validator has never heard of.
import { WARDS } from './quest-graph.js';

export const SAVE_KEY = 'castleConundrumSave_v1';
export const SAVE_GAME = 'castle-conundrum';
export const SAVE_VERSION = 6;

/**
 * Every id a save may carry, read off the data. `quest` is data/quest.json,
 * which from Phase 7 holds one graph: the frame was promoted and the three
 * riddle-quest stages went with it. A save still carrying `seek-keystone` is
 * not migrated, it is repaired — the stage is not in the catalog, so it resets
 * to `start` and the day begins again, which is the only honest answer when the
 * quest it was halfway through no longer exists. The key does not change (#36).
 */
export function buildCatalog(mystery, quest, documents = [], sideQuests = [], rooms = []) {
  const stages = new Set(Object.keys(quest?.stages ?? {}));
  // One entry per side quest, each with its own start and its own stage ids, so
  // a save carrying a stage of a quest that has since been rewritten resets to
  // that quest's start and a save naming a quest file that is gone drops it
  // entirely — the same two rails `stage` has had since #413.
  // `ward` and `terminals` are reputation's (version 6): the ward is which
  // counter an errand moves and the terminals are which stages mean it is
  // finished, both read off the quest files rather than written beside them,
  // so a quest that changes ward or gains an ending changes what the counters
  // mean on the next load and not a release later.
  const quests = new Map();
  const wards = Object.fromEntries(WARDS.map((w) => [w, 0]));
  for (const q of sideQuests ?? []) {
    if (!q || typeof q.id !== 'string') continue;
    const terminals = new Set(Object.entries(q.stages ?? {}).filter(([, st]) => st?.terminal).map(([id]) => id));
    quests.set(q.id, { start: q.start, ward: q.ward, stages: new Set(Object.keys(q.stages ?? {})), terminals });
    if (q.ward in wards) wards[q.ward] += 1;
  }
  const watches = dayWatchesOf(mystery, 1);
  // The morning's own bells (#696). `watch` is an index into whichever list the
  // day names, so the clamp has to know which day it is repairing.
  const morningWatches = dayWatchesOf(mystery, 2);
  const clues = new Set((mystery?.clues ?? []).map((c) => c.id));
  const evidence = new Set((mystery?.evidence ?? []).map((e) => e.id));
  const locks = new Set((mystery?.locks ?? []).map((l) => l.id));
  const documentIds = new Set((documents ?? []).map((d) => d.id));
  const roomIds = new Set((rooms ?? []).map((r) => r?.id).filter((id) => typeof id === 'string'));
  const npcs = new Map();
  for (const id of Object.keys(mystery?.schedule ?? {})) npcs.set(id, new Set(['default']));
  for (const p of mystery?.presses ?? []) { if (npcs.has(p.npc)) npcs.get(p.npc).add(p.to); }
  const accusables = new Set([...npcs.keys(), 'nobody']);
  const verdicts = new Set(['full', 'right', 'wrong', 'fall']);
  return { start: quest?.start ?? 'start', stages, quests, wards, watches, morningWatches, clues, evidence, locks, documents: documentIds, rooms: roomIds, npcs, accusables, verdicts };
}

/**
 * How much reputation a set of quest stages is worth, by ward: one per quest
 * sitting in one of its own terminal stages. Exported because it is what
 * `migrate` reads a version-5 save's finished errands with, and a suite that
 * cannot call it cannot tell migrate from repair (#147).
 */
export function reputationIn(quests, catalog) {
  const out = Object.fromEntries(WARDS.map((w) => [w, 0]));
  const at = quests && typeof quests === 'object' && !Array.isArray(quests) ? quests : {};
  for (const [id, q] of catalog.quests ?? new Map()) {
    if (q.ward in out && q.terminals?.has(at[id])) out[q.ward] += 1;
  }
  return out;
}

const nonNegInt = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
/** A save's `watch`, held to the bells of the day it says it is on (#696). */
const clampWatch = (v, day, catalog) => {
  const list = day === 2 ? (catalog.morningWatches ?? []) : (catalog.watches ?? []);
  const top = Math.max(0, list.length - 1);
  return Number.isInteger(v) ? Math.min(Math.max(v, 0), top) : 0;
};
const idsIn = (list, set) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string' && set.has(id)))] : []);

/** The repair pass, exported so test/save.mjs can call it on a bare object. */
export function repairState(state, catalog) {
  const s = state && typeof state === 'object' ? state : {};
  const out = {};
  out.stage = typeof s.stage === 'string' && catalog.stages.has(s.stage) ? s.stage : catalog.start;
  /* THE SIDE QUESTS. Keyed by quest id and written from the catalog rather than
   * from what came in, so an unknown id is dropped by never being copied and a
   * known id with a stage that quest does not have resets to its own start. */
  out.quests = {};
  const inQuests = s.quests && typeof s.quests === 'object' && !Array.isArray(s.quests) ? s.quests : {};
  for (const [id, q] of catalog.quests ?? new Map()) {
    const at = inQuests[id];
    out.quests[id] = typeof at === 'string' && q.stages.has(at) ? at : q.start;
  }
  /* REPUTATION BY WARD (version 6). Two counters and the one rail that can be
   * put on them: a ward's counter cannot read higher than the number of
   * errands that ward has, because the game moves it one per errand and an
   * errand finishes once. That is the ceiling a hand-edited 99 comes down to,
   * and it is also what drops a counter that was earned on quest files the
   * directory no longer has. It is deliberately NOT recomputed from
   * `out.quests`: a favour done is a thing that happened, and repair's job on
   * this field is to refuse the impossible, not to re-derive the possible. */
  out.reputation = {};
  for (const w of WARDS) out.reputation[w] = Math.min(nonNegInt(s.reputation?.[w]), catalog.wards?.[w] ?? 0);
  /* THE DAY, AND THE ONE THING THAT MAKES IT INCOHERENT. `day` is 1 or 2 and
   * nothing else; a hand-edited 7, a "2", a NaN all read as day one. And a
   * `day: 2` with no verdict in `accusations` is a save that says the morning
   * after happened without the day before it: the engine would look up a
   * verdict that is not there, place nobody, hand the manager no lines, and
   * open the dialogue box on `undefined` at a station with no one at it. That
   * is not version drift, so it is here and not in `migrate` (#37). The
   * accusations are repaired above this line, so what is tested is the list
   * that survives repair rather than the one that came in. */
  out.day = s.day === 2 ? 2 : 1;
  /* THE WATCH IS AN INDEX INTO THE DAY'S OWN LIST (#696), so what it clamps to
   * depends on `out.day` above: 0..3 on day one, 0..(the morning's bells minus
   * one) on day two. It stays in this slot because test/save.mjs asserts the
   * fifteen fields in order; the demotion below re-clamps when it moves the
   * day, which is the only thing that can change the answer after this line. */
  out.watch = clampWatch(s.watch, out.day, catalog);
  out.clues = idsIn(s.clues, catalog.clues);
  out.pressed = {};
  if (s.pressed && typeof s.pressed === 'object' && !Array.isArray(s.pressed)) {
    for (const [npc, states] of Object.entries(s.pressed)) {
      if (!catalog.npcs.has(npc)) continue;
      const kept = Array.isArray(states) ? states.filter((st) => typeof st === 'string' && st !== 'default' && catalog.npcs.get(npc).has(st)) : [];
      if (kept.length) out.pressed[npc] = kept;
    }
  }
  out.taken = idsIn(s.taken, catalog.evidence);
  out.read = idsIn(s.read, catalog.documents);
  out.visited = idsIn(s.visited, catalog.rooms ?? new Set());
  out.locks = idsIn(s.locks, catalog.locks);
  out.accusations = [];
  for (const a of Array.isArray(s.accusations) ? s.accusations : []) {
    if (!a || typeof a !== 'object' || !catalog.accusables.has(a.who)) continue;
    out.accusations.push({
      who: a.who,
      clues: idsIn(a.clues, catalog.clues),
      verdict: catalog.verdicts.has(a.verdict) ? a.verdict : null,
      watch: catalog.watches.includes(a.watch) ? a.watch : null,
    });
  }
  if (out.day === 2 && !out.accusations.some((a) => a.verdict)) { out.day = 1; out.watch = clampWatch(s.watch, 1, catalog); }
  out.refusals = nonNegInt(s.refusals);
  out.riddleWrong = nonNegInt(s.riddleWrong);
  const p = s.player;
  out.player = p && typeof p === 'object' && ['x', 'y', 'z', 'yaw'].every((k) => Number.isFinite(p[k]))
    ? { x: p.x, y: p.y, z: p.z, yaw: p.yaw }
    : null;
  return out;
}

/**
 * The slot. `storage` is injectable for tests (a Map-backed stub); in the
 * browser it is localStorage with gvb-save's private-mode fallback.
 */
export function createCastleSlot({ mystery, quest, documents = [], sideQuests = [], rooms = [], storage = null }) {
  const catalog = buildCatalog(mystery, quest, documents, sideQuests, rooms);
  const slot = createSaveSlot({
    game: SAVE_GAME,
    key: SAVE_KEY,
    version: SAVE_VERSION,
    validate: (s) => !!s && typeof s === 'object' && typeof s.stage === 'string',
    // Version drift, and only that (#37). A version-1 save was written before
    // there was a second day, so it is a save of the first one: `day: 1`. An
    // unversioned save reads as version 0 and comes through the same line.
    // `read` has no such coherence question (see the file's header comment),
    // so its own line only keeps the field's arrival honest against the
    // version number; repair's own default is the same either way.
    migrate: (s, from) => {
      let out = from < 2 ? { ...s, day: 1 } : s;
      if (from < 3) out = { ...out, read: out.read ?? [] };
      if (from < 4) out = { ...out, quests: out.quests ?? {} };
      if (from < 5) out = { ...out, visited: out.visited ?? [] };
      // And the one line in here that is not a default. A version-5 save knows
      // where every side quest stands, so the errands it already finished are
      // reputation it already earned; writing zeroes would be the save saying
      // the player had done none of them.
      if (from < 6) out = { ...out, reputation: out.reputation ?? reputationIn(out.quests, catalog) };
      return out;
    },
    repair: (s) => repairState(s, catalog),
    defaults: () => repairState({}, catalog),
    storage,
  });
  slot.catalog = catalog;
  return slot;
}
