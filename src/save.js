// save.js — the one save slot for Castle Conundrum, through the site's shared
// gvb-save.js (relative import so this file runs in Node; see that file's
// header). Key `castleConundrumSave_v1`, game `castle-conundrum`, version 1
// (#413). The key never changes (#36).
//
// The schema is complete now so no later phase adds a field:
//
//   { stage, watch, clues[], pressed{npc: state[]}, taken[], locks[],
//     accusations[{who, clues, verdict, watch}], refusals, riddleWrong,
//     player{x, y, z, yaw} | null }
//
// `validate` refuses a non-object and a non-string stage and nothing else;
// everything past that is `repair`'s, which runs on every load (#37) and
// builds its catalog from data/mystery.json and data/quest.json rather than
// from a list written beside it, so the ids a save may carry cannot drift from
// the ids the game renders. Unknown ids are dropped from every list, a stage
// the graph does not have resets to `start`, `watch` clamps to the four, and a
// `player` with a non-finite coordinate is nulled. test/save.mjs asserts every
// rail twice: the repaired value, and what goes wrong without it.

import { createSaveSlot } from '../../../assets/js/gvb-save.js';

export const SAVE_KEY = 'castleConundrumSave_v1';
export const SAVE_GAME = 'castle-conundrum';
export const SAVE_VERSION = 1;

/**
 * Every id a save may carry, read off the data. `quest` is data/quest.json
 * whole: its top-level stages are the graph the page plays and `frame` is the
 * v2 graph the engine runs; a save may be in either until Phase 7 retires one.
 */
export function buildCatalog(mystery, quest) {
  const stages = new Set([...Object.keys(quest?.stages ?? {}), ...Object.keys(quest?.frame?.stages ?? {})]);
  const watches = Array.isArray(mystery?.watches) ? mystery.watches : [];
  const clues = new Set((mystery?.clues ?? []).map((c) => c.id));
  const evidence = new Set((mystery?.evidence ?? []).map((e) => e.id));
  const locks = new Set((mystery?.locks ?? []).map((l) => l.id));
  const npcs = new Map();
  for (const id of Object.keys(mystery?.schedule ?? {})) npcs.set(id, new Set(['default']));
  for (const p of mystery?.presses ?? []) { if (npcs.has(p.npc)) npcs.get(p.npc).add(p.to); }
  const accusables = new Set([...npcs.keys(), 'nobody']);
  const verdicts = new Set(['full', 'right', 'wrong', 'fall']);
  return { start: quest?.start ?? 'start', stages, watches, clues, evidence, locks, npcs, accusables, verdicts };
}

const nonNegInt = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
const idsIn = (list, set) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string' && set.has(id)))] : []);

/** The repair pass, exported so test/save.mjs can call it on a bare object. */
export function repairState(state, catalog) {
  const s = state && typeof state === 'object' ? state : {};
  const out = {};
  out.stage = typeof s.stage === 'string' && catalog.stages.has(s.stage) ? s.stage : catalog.start;
  const top = Math.max(0, catalog.watches.length - 1);
  out.watch = Number.isInteger(s.watch) ? Math.min(Math.max(s.watch, 0), top) : 0;
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
export function createCastleSlot({ mystery, quest, storage = null }) {
  const catalog = buildCatalog(mystery, quest);
  const slot = createSaveSlot({
    game: SAVE_GAME,
    key: SAVE_KEY,
    version: SAVE_VERSION,
    validate: (s) => !!s && typeof s === 'object' && typeof s.stage === 'string',
    migrate: (s) => s, // version 1 is the first; nothing to drift from yet
    repair: (s) => repairState(s, catalog),
    defaults: () => repairState({}, catalog),
    storage,
  });
  slot.catalog = catalog;
  return slot;
}
