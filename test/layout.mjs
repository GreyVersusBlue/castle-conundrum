// layout.mjs — where the castle actually is, read out of src/castle-plan.js.
//
//   node test/layout.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. Four separate objects in this project have been found sealed
// inside a wall, none of them by a check: the hall table and the gothic statue
// (round 2, found and not fixed), then GothicCabinet_01 and GothicCommode_01,
// both entirely inside the corner where the north wall meets a hall side wall,
// invisible from every angle. `play-castle.mjs` grew a beat for it afterwards —
// but that beat needs a real browser and real GPU compositing, so it is outside
// CI on purpose (#353), it names four objects by hand, and it says clear or
// EMBEDDED and nothing else.
//
// WHAT CHANGED ON 2026-09-14. This file used to re-implement `tileToWorld`,
// `normalizeToTile`, `normalizeHeight` and `groundAndCenter` in Node, and its
// own header said what that cost: "it cannot catch a change to that math — if
// `normalizeToTile` starts scaling off X again, this file scales off Z and
// agrees with itself." There is one implementation of that math now,
// `src/castle-plan.js`, and both the game and this file call it. A break in the
// placement math now fails here instead of being agreed with.
//
// What it still cannot see is the loading and the scene graph — that the game
// really does apply the plan's transform to the object the plan names.
// `test/plan-vs-scene.mjs` is that check, headless, and `npm run play` is the
// walk.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { partsOf } from './gltf.mjs';
import { makePlan, walkability, GRID } from '../src/castle-plan.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);

/* The Node half of `boundsOf`. One read per file; `makePlan` asks for the same
 * wall model seven times over a run. */
const measured = new Map();
const boundsOf = (rel) => {
  if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel)));
  return measured.get(rel);
};

const plan = makePlan(config, boundsOf);
const walk = walkability(plan);

const f2 = (n) => n.toFixed(2);
const stone = plan.pieces.filter(p => p.kind === 'wall' || p.kind === 'tower');
const props = plan.pieces.filter(p => p.kind === 'prop');

/* --------------------------------------- 1: no interior prop is in a wall ---
 * Every prop against every wall run, tower and column, not the four the browser
 * beat names. Overlap in x and z is enough: the walls run the full height of the
 * hall, so a prop that overlaps one in plan overlaps it in space.
 */
console.log('interior props against the stone around them');
for (const prop of props) {
  const hit = stone.find(s =>
    Math.min(prop.box.max.x, s.box.max.x) - Math.max(prop.box.min.x, s.box.min.x) > 0 &&
    Math.min(prop.box.max.z, s.box.max.z) - Math.max(prop.box.min.z, s.box.min.z) > 0);
  if (hit) fail(`${prop.id} at x ${f2(prop.box.min.x)}..${f2(prop.box.max.x)}, z ${f2(prop.box.min.z)}..${f2(prop.box.max.z)} is inside ${hit.label}`);
}
if (!failures) pass(`${props.length} interior props, none of them inside any of the ${stone.length} stone pieces`);

/* ------------------------------ 2: the cabinet and the commode stand close ---
 * The other half of the same number. Not being in the wall is the floor; these
 * two are meant to be AGAINST their side walls, and until 2026-09-14 they stood
 * 1.14 m and 1.31 m off them, out in the room, because the hall columns sit in
 * the obvious path west and east (world x -6..-5.2 and 5.2..6, z -10..-9.2) and
 * the session that placed them took clear-of-column over flush-to-wall.
 *
 * The columns are only 0.8 m deep in z, so the two constraints were never
 * actually in conflict: moving each piece 0.6 m and 0.75 m south takes it out of
 * the column's z band entirely, and then the wall is reachable. Both are within
 * 0.12 m of their wall now and both clear their column.
 *
 * The band is a band on purpose. A margin of 0 means the carcass is in the
 * stone; a margin much over 0.3 m is the thing this row was opened about. Read
 * the FAIL and pick a tile, do not widen the band to make it green.
 *
 * The two faces are read off the plan's own great-hall room rather than typed
 * in, so a phase that moves the hall's side walls moves this check with them.
 */
const hall = plan.rooms.find(r => r.id === 'great-hall');
if (!hall) fail('no great-hall in config.rooms — nothing to measure the cabinet against');
const MIN_GAP = 0.02, MAX_GAP = 0.30;

console.log('\nthe cabinet and the commode against their side walls');
for (const [name, face, edge] of hall ? [
  ['GothicCabinet_01', hall.bounds.min.x, 'min'],
  ['GothicCommode_01', hall.bounds.max.x, 'max'],
] : []) {
  const prop = props.find(p => p.id === name);
  if (!prop) { fail(`${name} is not in interiorProps — nothing to measure`); continue; }
  const gap = edge === 'min' ? prop.box.min.x - face : face - prop.box.max.x;
  if (gap < MIN_GAP) fail(`${name} stands ${gap.toFixed(3)} m from the hall wall at x ${face} — its back is in the stone`);
  else if (gap > MAX_GAP) fail(`${name} stands ${gap.toFixed(3)} m off the hall wall at x ${face}, over the ${MAX_GAP} m this room reads as "against the wall"`);
  else pass(`${name} stands ${gap.toFixed(3)} m off the wall at x ${face}`);
}

/* The column each one had to get past, measured rather than restated: whichever
 * stone piece shares its x band is the one in the way, and the gap that matters
 * is in z. Asserting it keeps a later southward nudge from walking either piece
 * back into the column it was moved out of.
 */
const columns = plan.pieces.filter(p => /column/.test(p.model || ''));
for (const name of ['GothicCabinet_01', 'GothicCommode_01']) {
  const prop = props.find(p => p.id === name);
  if (!prop) continue;
  const col = columns.find(c =>
    Math.min(prop.box.max.x, c.box.max.x) - Math.max(prop.box.min.x, c.box.min.x) > 0);
  if (!col) { pass(`${name} shares no x band with either column`); continue; }
  const gap = prop.box.min.z - col.box.max.z;
  if (gap <= 0) fail(`${name} is ${(-gap).toFixed(3)} m into ${col.id}, which shares its x band`);
  else pass(`${name} clears ${col.id} by ${gap.toFixed(3)} m in z`);
}

/* ------------------------------------------ 3: every room can be walked to ---
 * The plan's rooms against the walkability flood fill from the spawn. A room
 * nobody can reach is a room that may as well not be built, and the shape of
 * this castle is about to change in four consecutive phases.
 */
console.log(`\nwalkability: ${walk.cells.length} cells on a ${GRID} m grid from the spawn`);
if (!walk.started) fail(`the spawn at ${config.spawn.position} stands on nothing the grid calls a floor`);
else pass(`the spawn at [${config.spawn.position.join(', ')}] stands on a floor`);
for (const room of walk.rooms()) {
  if (!room.reachable) fail(`${room.id} (${room.ward} ward, level ${room.level}) cannot be reached on foot from the spawn — 0 standable cells in x ${room.bounds.min.x}..${room.bounds.max.x}, z ${room.bounds.min.z}..${room.bounds.max.z}`);
  else pass(`${room.id} reachable, ${room.cells} cells`);
}

/* ---------------------------------------------- 4: the castle is shut in ---
 * Nothing reachable from the spawn lies outside the curtain's outer face, with
 * the gate closed. This is the check that found the gatehouse: `gate-arch`
 * carried `noCollide: true`, which exempted the whole 4 m piece rather than its
 * 1.9 m doorway, and a player could walk through the stone beside a shut gate.
 * `castle-plan.js`'s archColliders gives the piece two jambs and a lintel now.
 */
console.log('\nthe curtain');
if (walk.sealed()) {
  pass(`nothing reachable outside x ${f2(plan.curtain.min.x)}..${f2(plan.curtain.max.x)}, z ${f2(plan.curtain.min.z)}..${f2(plan.curtain.max.z)}`);
} else {
  const where = walk.breaches(3).map(c => `(${c.x}, ${c.z})`).join(', ') || 'nowhere the fill crossed — the spawn is already outside';
  fail(`the castle leaks: ${walk.leaked} reachable cells outside the curtain at x ${f2(plan.curtain.min.x)}..${f2(plan.curtain.max.x)}, z ${f2(plan.curtain.min.z)}..${f2(plan.curtain.max.z)}. The fill stepped through at ${where}`);
}

/* ------------------------------------- 5: every NPC stands somewhere real ---
 * Both lists in npcs.json: the three the page spawns today and the twelve under
 * `cast` that Phase 1 wrote. The cast carry no `position` yet — Phase 6 fills
 * them — so this binds the moment one appears rather than waiting to be
 * remembered then.
 */
const npcData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/npcs.json'), 'utf8'));
const standing = [...(npcData.npcs || []), ...(npcData.cast || [])].filter(n => Array.isArray(n.position));
console.log(`\nwhere the NPCs stand (${standing.length} with a position, ${(npcData.npcs || []).length + (npcData.cast || []).length} defined)`);
for (const npc of standing) {
  const [x, , z] = npc.position;
  if (!walk.reachable(x, z, npc.level || 0)) fail(`${npc.id} stands at (${x}, ${z}) on level ${npc.level || 0}, which the player cannot reach — in stone, outside the curtain, or shut in`);
  else pass(`${npc.id} at (${x}, ${z}) is reachable`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
