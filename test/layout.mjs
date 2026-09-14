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
const mystery = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mystery.json'), 'utf8'));

const f2 = (n) => n.toFixed(2);
/** How many cells the player can stand on within `within` metres of a point. */
const standableNear = (x, z, within = 1.5) =>
  walk.cells.filter(c => Math.hypot((c.i * GRID + GRID / 2) - x, (c.j * GRID + GRID / 2) - z) <= within).length;
const stone = plan.pieces.filter(p => p.kind === 'wall' || p.kind === 'tower');
const props = plan.pieces.filter(p => p.kind === 'prop');

/* --------------------------------------- 1: no interior prop is in a wall ---
 * Every prop against every wall run, tower and column, not the four the browser
 * beat names. Overlap in x and z is enough: the walls run the full height of the
 * hall, so a prop that overlaps one in plan overlaps it in space.
 */
console.log('interior props against the stone around them');
const overlaps = (a, b) =>
  Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > 0 &&
  Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > 0;
for (const prop of props) {
  // Against each piece's OWN collider boxes, not the box that bounds them. A
  // drum is twenty-four sectors of a circle and `piece.box` is the 8 x 8 m
  // square around it, three quarters of a metre of which is ward floor at each
  // corner; reading `box` here called the Great Hall's cabinet "inside
  // South-west Tower" while it stood 0.2 m clear of the tower's actual stone.
  const hit = stone.find(s => s.boxes.some(b => overlaps(prop.box, b)));
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
 * The faces are measured off the stone rather than typed in, so a phase that
 * moves the hall's side walls moves this check with them.
 */
const MIN_GAP = 0.02, MAX_GAP = 0.30;

/* THE FACE, NOT THE ROOM BOUNDARY, and that is the Phase 4 correction. This read
 * `hall.bounds.min.x` and `hall.bounds.max.x`, which were the same numbers as
 * the walls while every wall of the Great Hall was a curtain run on the room's
 * own tile edge. The hall has a built partition on its east side now, and an
 * interior partition is centred ON the tile edge, so half its thickness stands
 * inside the room and the room's boundary is half a metre out in the air. What
 * "against the wall" means is against the stone, so the stone is what this
 * measures: whichever piece is nearest in x while sharing the prop's z band. */
const faceBeside = (prop, dir) => {
  let best = null;
  for (const st of stone) for (const b of st.boxes) {
    if (Math.min(b.max.z, prop.box.max.z) - Math.max(b.min.z, prop.box.min.z) <= 0) continue;
    if (dir < 0 ? b.max.x > prop.box.min.x : b.min.x < prop.box.max.x) continue;
    const face = dir < 0 ? b.max.x : b.min.x;
    if (best === null || (dir < 0 ? face > best.face : face < best.face)) best = { face, id: st.id };
  }
  return best;
};

console.log('\nthe cabinet and the commode against their side walls');
for (const [name, dir] of [['GothicCabinet_01', -1], ['GothicCommode_01', 1]]) {
  const prop = props.find(p => p.id === name);
  if (!prop) { fail(`${name} is not in interiorProps — nothing to measure`); continue; }
  const near = faceBeside(prop, dir);
  if (!near) { fail(`${name} has no stone either side of it in x — the hall has lost a wall`); continue; }
  const gap = dir < 0 ? prop.box.min.x - near.face : near.face - prop.box.max.x;
  if (gap < MIN_GAP) fail(`${name} stands ${gap.toFixed(3)} m from ${near.id} at x ${near.face} — its back is in the stone`);
  else if (gap > MAX_GAP) fail(`${name} stands ${gap.toFixed(3)} m off ${near.id} at x ${near.face}, over the ${MAX_GAP} m this room reads as "against the wall"`);
  else pass(`${name} stands ${gap.toFixed(3)} m off ${near.id} at x ${near.face}`);
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
 * nobody can reach is a room that may as well not be built, and this is the
 * check Phase 4's deliberate break is aimed at: wall a doorway shut and the room
 * behind it names itself here.
 *
 * TWO OF THE FOURTEEN ARE NOT WALKED INTO, AND THAT IS THE POINT OF THEM. The
 * muniment room is behind the word-lock until the riddle is answered, and the
 * cell is behind bars that never open. Both are asserted below rather than
 * excused: the muniment room opens when the lock does and not before, and the
 * cell stays shut while the player can stand at its bars and talk through them.
 */
console.log(`\nwalkability: ${walk.cells.length} cells on a ${GRID} m grid from the spawn`);
if (!walk.started) fail(`the spawn at ${config.spawn.position} stands on nothing the grid calls a floor`);
else pass(`the spawn at [${config.spawn.position.join(', ')}] stands on a floor`);
const rooms = walk.rooms();
if (rooms.length !== 14) fail(`${rooms.length} rooms in the plan, not the fourteen WISHLIST.md's room table names`);

/* WHICH ROOMS ARE SHUT IS MYSTERY.JSON'S ANSWER, NOT THE CASTLE'S. The first
 * version of this took the expectation from `room.locked`, which the plan derives
 * from the very field being tested — so shipping the muniment room's leaf
 * `closed: false` moved the expectation with the break and the suite stayed green
 * (#34, and #147: a claim the arithmetic cannot distinguish). The mystery is the
 * independent half: `locks` names the rooms a riddle opens and the cell carries
 * `barred`, and those are facts about the crime, not about the geometry. */
const expected = new Map(rooms.map(r => {
  const m = mystery.rooms.find(x => x.id === r.id && x.level === 0);
  const lock = (mystery.locks ?? []).find(l => l.room === r.id);
  return [r.id, lock ? 'riddle' : (m && m.barred ? 'bars' : null)];
}));
for (const room of rooms) {
  const want = expected.get(room.id);
  const shut = `x ${room.bounds.min.x}..${room.bounds.max.x}, z ${room.bounds.min.z}..${room.bounds.max.z}`;
  if (room.locked !== want) {
    fail(`${room.id} is ${room.locked ? `shut with ${room.locked}` : 'open'} in scene-config.json and ${want ? `shut with ${want}` : 'open'} in mystery.json`);
  }
  if (want) {
    if (room.reachable) fail(`${room.id} is reachable from the spawn with its ${want === 'bars' ? 'bars in place' : 'word-lock unanswered'} — ${room.cells} standable cells in ${shut}`);
    else pass(`${room.id} is shut (${want}), 0 cells`);
  } else if (!room.reachable) {
    fail(`${room.id} (${room.ward} ward, level ${room.level}) cannot be reached on foot from the spawn — 0 standable cells in ${shut}`);
  } else {
    pass(`${room.id} reachable, ${room.cells} cells`);
  }
}

/* --------------------------------------- 3b: the word-lock is what shuts it ---
 * Flood a second time with the muniment room's leaf forced open. The room has to
 * come alive and nothing else may move: a lock that opens the castle rather than
 * one room is not a lock. This is the opposite assertion to check 3's "muniment
 * is shut", and deleting either leaves a hole — without check 3 the door could
 * stand open from the start, without this one it could be a wall.
 */
console.log('\nthe muniment room, with the word-lock answered');
{
  const unlocked = walkability(makePlan(config, boundsOf, { opened: ['muniment'] })).rooms();
  const mun = unlocked.find(r => r.id === 'muniment');
  if (!mun) fail('no muniment room in the plan');
  else if (!mun.reachable) fail('the muniment room is still unreachable with its leaf open — the lock is not what was shutting it');
  else pass(`the muniment room opens to ${mun.cells} cells when the word-lock does`);
  const moved = unlocked.filter(r => r.id !== 'muniment' && r.reachable !== rooms.find(x => x.id === r.id).reachable);
  if (moved.length) fail(`opening the word-lock also opened ${moved.map(r => r.id).join(', ')} — it is not one room's door`);
  else pass('every other room is exactly as it was');
}

/* ------------------------------------------------- 3c: the bars are the door ---
 * The cell is the one ground room the player never enters, and the mystery's
 * clue rests on talking to the man inside through the bars. So both halves are
 * facts to hold: nothing standable inside (check 3 above), and somewhere to
 * stand outside within arm's reach of them.
 */
console.log('\nthe cell');
{
  const bars = plan.pieces.find(p => p.built === 'bars');
  if (!bars) fail('no bars in the plan — the cell has no door at all');
  else {
    const bx = (bars.box.min.x + bars.box.max.x) / 2, bz = (bars.box.min.z + bars.box.max.z) / 2;
    const near = standableNear(bx, bz);
    if (!near) fail(`nothing within 1.5 m of the cell's bars at (${f2(bx)}, ${f2(bz)}) can be reached — the player cannot get close enough to talk through them`);
    else pass(`${near} standable cells within 1.5 m of the bars at (${f2(bx)}, ${f2(bz)})`);
  }
}

/* ------------------------- 3d: the castle's rooms and the mystery's are one ---
 * `data/mystery.json` puts twelve people and ten pieces of evidence in rooms by
 * id, and `data/scene-config.json` builds rooms by id. Nothing made those two
 * lists agree until now; Phase 1 wrote room ids that the scene config did not
 * have (`clerk-office` against `clerks-office`, `lodge` against `masons-lodge`)
 * and nothing said so. They are the same fourteen ids now and this is what keeps
 * them that way. The four level-0 rooms mystery.json marks `open` are the two
 * wards, the barbican and the garden — ground, not rooms with doors.
 */
console.log('\nthe fourteen rooms, against mystery.json');
{
  const want = mystery.rooms.filter(r => r.level === 0 && !r.open).map(r => r.id).sort();
  const got = plan.rooms.map(r => r.id).sort();
  const missing = want.filter(id => !got.includes(id));
  const extra = got.filter(id => !want.includes(id));
  for (const id of missing) fail(`mystery.json puts people or evidence in "${id}" and the castle has no such room`);
  for (const id of extra) fail(`the castle builds a room "${id}" that the mystery has never heard of`);
  if (!missing.length && !extra.length) pass(`${got.length} rooms, the same ids in both files`);
  for (const r of plan.rooms) {
    const m = mystery.rooms.find(x => x.id === r.id && x.level === 0);
    if (m && m.ward !== r.ward) fail(`${r.id} is in the ${r.ward} ward in scene-config.json and the ${m.ward} ward in mystery.json`);
  }
}

/* ------------------------------ 3e: the evidence has something to stand on ---
 * Every level-0 row in mystery.json's `evidence` names a room and a prop. Phase
 * 7 makes them examinable; Phase 4 owes them an object in the right room, and
 * this is the check that the object is where the mystery thinks it is rather
 * than somewhere that merely looked right in a screenshot.
 */
console.log('\nthe evidence the mystery names, as objects');
for (const e of mystery.evidence.filter(e => e.level === 0)) {
  const piece = plan.pieces.find(p => p.evidence === e.id);
  const room = plan.rooms.find(r => r.id === e.room);
  const ground = mystery.rooms.find(r => r.id === e.room && r.level === 0 && r.open);
  if (!piece) { fail(`evidence "${e.id}" is in ${e.room} and nothing in the castle carries \`evidence: "${e.id}"\``); continue; }
  if (!room && !ground) { fail(`evidence "${e.id}" names room "${e.room}", which the castle does not build`); continue; }
  const cx2 = (piece.box.min.x + piece.box.max.x) / 2, cz2 = (piece.box.min.z + piece.box.max.z) / 2;
  if (piece.model && !piece.model.endsWith(e.prop)) { fail(`evidence "${e.id}" is ${piece.model}, and mystery.json says ${e.prop}`); continue; }
  if (piece.built === 'gate-leaf' || piece.built === 'bars') {
    // A room's own door stands in its wall, which is outside the room's bounds by
    // half the ring's thickness. What it has to be is that room's door.
    if (piece.id !== e.room && piece.id !== `${e.room}-bars`) fail(`evidence "${e.id}" is the door "${piece.id}", which is not ${e.room}'s`);
    else pass(`${e.id}: ${piece.id}, ${e.room}'s own door`);
  } else if (room) {
    const inside = cx2 >= room.bounds.min.x && cx2 <= room.bounds.max.x && cz2 >= room.bounds.min.z && cz2 <= room.bounds.max.z;
    if (!inside) fail(`evidence "${e.id}" stands at (${f2(cx2)}, ${f2(cz2)}), outside ${e.room} (x ${room.bounds.min.x}..${room.bounds.max.x}, z ${room.bounds.min.z}..${room.bounds.max.z})`);
    else pass(`${e.id}: ${piece.id} in ${e.room}`);
  } else {
    // Open ground has no bounds to be inside. What it has instead is that the
    // player can walk up to it, which a rectangle would not have told us anyway.
    const near = standableNear(cx2, cz2);
    if (!near) fail(`evidence "${e.id}" stands at (${f2(cx2)}, ${f2(cz2)}) in the ${e.room}, with nothing standable within 1.5 m of it`);
    else pass(`${e.id}: ${piece.id} in the ${e.room}, ${near} cells within reach`);
  }
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

/* ------------------------- 4b: the cross-wall is the only ground crossing ---
 *
 * The fact the whole mystery turns on. "The porter's gate is the only crossing
 * at ground level and the porter logs it" — so who was in which ward at which
 * bell is knowable, and an NPC who says they never crossed can be caught. If a
 * second way through the cross-wall exists, every one of the thirty-nine clues
 * that rests on a logged crossing rests on nothing.
 *
 * Flooded a second time with the porter's gate forced shut, which is what
 * `closed` is for: with the one crossing sealed, NOTHING in the inner ward can
 * be reached from a spawn in the west barbican. That is the opposite assertion
 * to check 3's, not a restatement of it — check 3 says the inner ward IS
 * reachable with the gate as the castle actually ships it, open. Deleting either
 * leaves a real hole: without check 3 the cross-wall could be solid and the
 * inner ward dead; without this one it could be a colander.
 */
console.log('\nthe cross-wall, with the porter\'s gate shut');
{
  const shut = makePlan(config, boundsOf, { closed: ['porter-gate'] });
  const sealedWalk = walkability(shut);
  const inner = sealedWalk.rooms().filter(r => r.ward === 'inner');
  if (!inner.length) fail('no inner-ward rooms in config.rooms — nothing to divide');
  const open = inner.filter(r => r.reachable);
  if (open.length) {
    fail(`inner ward reachable at level 0 with the porter's gate closed: ${open.map(r => `${r.id} (${r.cells} cells)`).join(', ')}. The cross-wall has a second way through it`);
  } else {
    pass(`inner ward sealed off at level 0 with the porter's gate closed — ${inner.map(r => r.id).join(', ')} all at 0 cells, against ${walk.rooms().filter(r => r.ward === 'inner').reduce((n, r) => n + r.cells, 0)} with it open`);
  }
  // and the outer ward is still there, so a fill that simply died proves nothing
  const outerShut = sealedWalk.rooms().filter(r => r.ward === 'outer' && r.reachable).length;
  const outerOpen = walk.rooms().filter(r => r.ward === 'outer' && r.reachable).length;
  if (outerShut !== outerOpen) fail(`shutting the porter's gate changed the OUTER ward too, ${outerOpen} rooms to ${outerShut} — the second fill did not run the castle it was meant to`);
  else pass(`the outer ward is unchanged by it, ${outerShut} rooms either way`);
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
