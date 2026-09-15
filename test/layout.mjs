// layout.mjs — where the castle actually is, read out of src/castle-plan.js.
//
//   node test/layout.mjs        (from the repo root)
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
//
// WHAT THIS FILE IS FOR, AND WHAT plan-vs-scene.mjs IS FOR (#529). **This file
// is every fact derivable from the plan in Node**: geometry, reachability, the
// plan against `mystery.json`. `plan-vs-scene.mjs` is the seams only — the box
// diff, `settle()`, a tint on a live material, the DOM wiring — and nothing it
// asserts may be provable here. `test/mystery.mjs` owns the stations, through
// `validateMystery`'s nav rails. The two files overlapped for a phase and the
// cost was not the clock, it was that a reader could not tell which one to add
// a line to.
//
// PHASE 5 GAVE THE CASTLE THREE LEVELS, and this file three more questions:
// can every upper room be reached (check 3, now on every level), by its own
// tower's stairs and not only along the walk from the next tower (check 6), and
// does the walk cross the wards over the porter's head while his bar, were it
// in place, would stop it (check 4b). The head room under every slab is check
// 7. A player falling through a floor is silent to all of them; what they hold
// is that the floors, the flights and the doors the plan describes connect the
// way the mystery needs, and plan-vs-scene.mjs holds that the page stands the
// camera on those same floors.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { partsOf } from './gltf.mjs';
import { makePlan, walkability, moveBody, GRID, HEAD_LOW, HEAD_HIGH, BODY_RADIUS } from '../src/castle-plan.js';
import { stepClassOf } from '../src/audio.js';

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
 * beat names. Overlap in all three axes: until Phase 5 x and z were enough,
 * because every wall ran the full height of its room and every prop stood on
 * the ground, and a prop that overlapped a wall in plan overlapped it in space.
 * The bar beside the Stockhouse walk door stands on the top of a curtain stub
 * that reaches into the tower, 8 m over the ground, in plan exactly where that
 * stub is.
 */
console.log('interior props against the stone around them');
const overlaps = (a, b) =>
  Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > 0 &&
  Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > 0 &&
  Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > 0;
for (const prop of props) {
  // Against each piece's OWN collider boxes, not the box that bounds them. A
  // drum is twenty-four sectors of a circle and `piece.box` is the 8 x 8 m
  // square around it, three quarters of a metre of which is ward floor at each
  // corner; reading `box` here called the Great Hall's cabinet "inside
  // South-west Tower" while it stood 0.2 m clear of the tower's actual stone.
  const hit = stone.find(s => s.boxes.some(b => overlaps(prop.box, b)));
  if (hit) fail(`${prop.id} at x ${f2(prop.box.min.x)}..${f2(prop.box.max.x)}, y ${f2(prop.box.min.y)}..${f2(prop.box.max.y)}, z ${f2(prop.box.min.z)}..${f2(prop.box.max.z)} is inside ${hit.label}`);
}
if (!failures) pass(`${props.length} interior props, none of them inside any of the ${stone.length} stone pieces`);

/* ----------------------------------------- 1b: no prop is inside a flight ---
 * A flight is a surface and no collider, so a prop standing in its footprint
 * is drawn through it and blocks nothing the grid can see. Phase 4 placed the
 * chapel's candles and the laundry's cloak crate where Phase 5's lower flights
 * came to stand; this is what said so.
 */
{
  const flights = plan.pieces.filter(p => p.kind === 'stair');
  const inFlight = [];
  for (const prop of [...props, ...plan.pieces.filter(p => p.kind === 'decor' && p.label !== 'battlement')]) {
    const hit = flights.find(f => overlaps(prop.box, f.box));
    if (hit) inFlight.push(`${prop.id} stands in ${hit.label}`);
  }
  for (const line of inFlight) fail(line);
  if (!inFlight.length) pass(`no prop stands in any of the ${flights.length} flights`);
}

/* ------------------------ 1c: nothing pressable stands inside the stone ---
 * Check 1 above covers `prop` pieces, and the bell is `decor`: a kit model
 * placed through `courtyard.placements`, like the crates and the shrubs. It got
 * through check 1 with 0.9 m of its box inside the Chapel Tower's ring, because
 * its TILE POINT stood on clear floor and the model reaches 1.4 m past its own
 * origin at that rotation. What said so was the line-of-sight test in
 * interaction.js refusing to offer it — the same rail that caught the Guard
 * sealed 0.16 m inside the gatehouse in v1, and the same class of bug.
 *
 * So: anything the player presses E at is held clear of every wall and tower,
 * whatever kind of piece it is. Doors are the exception and the reason is not a
 * fudge — a door IS in a wall, and it is the wall's own opening.
 */
console.log('\nthe pieces the player presses E at');
{
  const pressable = plan.pieces.filter(p => p.bell);
  if (!pressable.length) fail('no piece in the plan carries `bell`, so the chapel has nothing to ring and this check tests nothing');
  for (const piece of pressable) {
    const hit = stone.find(s => s.boxes.some(b => overlaps(piece.box, b)));
    if (hit) fail(`${piece.id} at x ${f2(piece.box.min.x)}..${f2(piece.box.max.x)}, z ${f2(piece.box.min.z)}..${f2(piece.box.max.z)} is inside ${hit.label} — a prompt on it would be a prompt on blank stone`);
    else pass(`${piece.id} stands clear of all ${stone.length} stone pieces`);
  }
}

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
 * The plan's rooms against the walkability flood fill from the spawn, on all
 * three levels now. A room nobody can reach is a room that may as well not be
 * built, and this is the check Phase 4's deliberate break is aimed at: wall a
 * doorway shut and the room behind it names itself here. Phase 5's first break
 * — delete the Kitchen Tower's lower flight — does NOT fire here, and that is a
 * finding rather than a gap: with sixteen flights in place the wall walk joins
 * every tower at level 2, so a tower that has lost its way up is still reached
 * from the tower next door, along the walk and down. Check 6 is the one that
 * fires, by flooding with one tower's stairs at a time.
 *
 * TWO OF THE FOURTEEN GROUND ROOMS ARE NOT WALKED INTO, AND THAT IS THE POINT
 * OF THEM. The muniment room is behind the word-lock until the riddle is
 * answered, and the cell is behind bars that never open. Both are asserted
 * below rather than excused: the muniment room opens when the lock does and not
 * before, and the cell stays shut while the player can stand at its bars and
 * talk through them.
 */
console.log(`\nwalkability: ${walk.cells.length} cells on a ${GRID} m grid from the spawn, ${walk.perLevel().map(([l, n]) => `${n} on level ${l}`).join(', ')}`);
if (!walk.started) fail(`the spawn at ${config.spawn.position} stands on nothing the grid calls a floor`);
else pass(`the spawn at [${config.spawn.position.join(', ')}] stands on a floor`);
const rooms = walk.rooms();
const groundRooms = rooms.filter(r => r.level === 0);
if (groundRooms.length !== 14) fail(`${groundRooms.length} ground rooms in the plan, not the fourteen PLAN.md's room table names`);
// The levels the castle has, read off the plan (#523), not a literal `[1, 2]`
// that a fourth storey has to be remembered into.
const upper = plan.levels.filter(l => l > 0);
for (const level of upper) {
  if (!walk.perLevel().some(([l]) => l === level)) fail(`nothing on level ${level} can be reached from the spawn`);
}

/* WHICH ROOMS ARE SHUT IS MYSTERY.JSON'S ANSWER, NOT THE CASTLE'S. The first
 * version of this took the expectation from `room.locked`, which the plan derives
 * from the very field being tested — so shipping the muniment room's leaf
 * `closed: false` moved the expectation with the break and the suite stayed green
 * (#34, and #147: a claim the arithmetic cannot distinguish). The mystery is the
 * independent half: `locks` names the rooms a riddle opens and the cell carries
 * `barred`, and those are facts about the crime, not about the geometry. */
const expected = new Map(rooms.map(r => {
  const m = mystery.rooms.find(x => x.id === r.id && x.level === r.level);
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
    pass(`${room.id} reachable, ${room.cells} cells (level ${room.level})`);
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
 * and nothing said so. They are the same fourteen ids at level 0 and this is
 * what keeps them that way. The four level-0 rooms mystery.json marks `open`
 * are the two wards, the barbican and the garden — ground, not rooms with
 * doors.
 *
 * ABOVE THE GROUND THE MATCH IS ONE WAY. The mystery names four rooms on level
 * 1 and four on level 2, and every one of them has to be built at that level in
 * that ward. The castle builds more: every tower has a first floor and a top
 * room whether anybody's schedule puts them there or not, so that the suite can
 * hold each tower's flights to reaching them. Those may exist unnamed only if
 * they are a tower's own (`drum`); a stretch of decking the mystery has never
 * heard of is a mistake in one file or the other.
 */
console.log('\nthe rooms, against mystery.json');
{
  const want = mystery.rooms.filter(r => r.level === 0 && !r.open).map(r => r.id).sort();
  const got = plan.rooms.filter(r => r.level === 0).map(r => r.id).sort();
  const missing = want.filter(id => !got.includes(id));
  const extra = got.filter(id => !want.includes(id));
  for (const id of missing) fail(`mystery.json puts people or evidence in "${id}" and the castle has no such room`);
  for (const id of extra) fail(`the castle builds a room "${id}" that the mystery has never heard of`);
  if (!missing.length && !extra.length) pass(`${got.length} ground rooms, the same ids in both files`);
  for (const level of upper) {
    const named = mystery.rooms.filter(r => r.level === level && !r.open);
    for (const m of named) {
      const r = plan.rooms.find(x => x.id === m.id);
      if (!r) fail(`mystery.json puts people or evidence in "${m.id}" on level ${level} and the castle builds no such room`);
      else if (r.level !== level) fail(`${m.id} is on level ${r.level} in scene-config.json and level ${level} in mystery.json`);
    }
    const unnamed = plan.rooms.filter(r => r.level === level && !named.some(m => m.id === r.id) && !r.drum);
    for (const r of unnamed) fail(`the castle builds "${r.id}" on level ${level}, which is not a tower's own room and which the mystery has never heard of`);
    if (named.every(m => plan.rooms.find(x => x.id === m.id && x.level === level)) && !unnamed.length) {
      pass(`level ${level}: the mystery's ${named.length} rooms are built, and the ${plan.rooms.filter(r => r.level === level).length - named.length} others are towers' own`);
    }
  }
  for (const r of plan.rooms) {
    const m = mystery.rooms.find(x => x.id === r.id && x.level === r.level);
    if (m && m.ward !== r.ward) fail(`${r.id} is in the ${r.ward} ward in scene-config.json and the ${m.ward} ward in mystery.json`);
  }
}

/* ------------------------------ 3e: the evidence has something to stand on ---
 * Every row in mystery.json's `evidence` names a room and a prop. Phase 7 makes
 * them examinable; Phase 4 owed the ground ones an object in the right room and
 * Phase 5 owes the two on the walk theirs, and this is the check that the
 * object is where the mystery thinks it is rather than somewhere that merely
 * looked right in a screenshot.
 */
console.log('\nthe evidence the mystery names, as objects');
for (const e of mystery.evidence) {
  const piece = plan.pieces.find(p => p.evidence === e.id);
  const room = plan.rooms.find(r => r.id === e.room);
  const ground = mystery.rooms.find(r => r.id === e.room && r.level === 0 && r.open);
  if (!piece) { fail(`evidence "${e.id}" is in ${e.room} and nothing in the castle carries \`evidence: "${e.id}"\``); continue; }
  if (!room && !ground) { fail(`evidence "${e.id}" names room "${e.room}", which the castle does not build`); continue; }
  const cx2 = (piece.box.min.x + piece.box.max.x) / 2, cz2 = (piece.box.min.z + piece.box.max.z) / 2;
  if (piece.model && !piece.model.endsWith(e.prop)) { fail(`evidence "${e.id}" is ${piece.model}, and mystery.json says ${e.prop}`); continue; }
  if (room && (e.level ?? 0) !== room.level) { fail(`evidence "${e.id}" is on level ${e.level} in mystery.json and its room ${room.id} is on level ${room.level}`); continue; }
  if (piece.built === 'gate-leaf' || piece.built === 'bars') {
    // A room's own door stands in its wall, which is outside the room's bounds by
    // half the ring's thickness. What it has to be is that room's door.
    if (piece.id !== e.room && piece.id !== `${e.room}-bars`) fail(`evidence "${e.id}" is the door "${piece.id}", which is not ${e.room}'s`);
    else pass(`${e.id}: ${piece.id}, ${e.room}'s own door`);
  } else if (room) {
    const inside = cx2 >= room.bounds.min.x && cx2 <= room.bounds.max.x && cz2 >= room.bounds.min.z && cz2 <= room.bounds.max.z;
    if (!inside) fail(`evidence "${e.id}" stands at (${f2(cx2)}, ${f2(cz2)}), outside ${e.room} (x ${room.bounds.min.x}..${room.bounds.max.x}, z ${room.bounds.min.z}..${room.bounds.max.z})`);
    else if (piece.box.min.y < room.top - 0.01 || piece.box.min.y > room.top + 1.5) fail(`evidence "${e.id}" stands with its base at y ${f2(piece.box.min.y)} in ${e.room}, whose floor is at ${room.top}`);
    else pass(`${e.id}: ${piece.id} in ${e.room}${room.level ? ` (level ${room.level}, base y ${f2(piece.box.min.y)})` : ''}`);
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
 * On the walk it is the parapet: the merlons are colliders and the strip of
 * wall-top outside the decking is no surface, so nothing reachable stands past
 * the outer face two storeys up either.
 */
console.log('\nthe curtain');
if (walk.sealed()) {
  pass(`nothing reachable outside x ${f2(plan.curtain.min.x)}..${f2(plan.curtain.max.x)}, z ${f2(plan.curtain.min.z)}..${f2(plan.curtain.max.z)}, on any level`);
} else {
  const where = walk.breaches(3).map(c => `(${c.x}, ${c.z}, level ${c.level})`).join(', ') || 'nowhere the fill crossed — the spawn is already outside';
  fail(`the castle leaks: ${walk.leaked} reachable cells outside the curtain at x ${f2(plan.curtain.min.x)}..${f2(plan.curtain.max.x)}, z ${f2(plan.curtain.min.z)}..${f2(plan.curtain.max.z)}. The fill stepped through at ${where}`);
}

/* ---------------------------- 4b: two crossings, one logged and one not ---
 *
 * The fact the whole mystery turns on. "The porter's gate is the only crossing
 * at ground level and the porter logs it" — so who was in which ward at which
 * bell is knowable, and an NPC who says they never crossed can be caught. And
 * "the wall walk is the crossing nobody logs": it runs over the cross-wall and
 * through the Stockhouse Tower's top room, past a door the porter swears he
 * bars and did not. If a second way through the cross-wall exists at ground
 * level, every clue that rests on a logged crossing rests on nothing; if the
 * walk does NOT cross, the Clerk could not have done what the clues say he did;
 * and if the walk door's bar would not have stopped him, the porter's lie is
 * not a lie that matters.
 *
 * Three floods. With the porter's gate forced shut and the walk door as it
 * ships (open), the inner ward is still reachable, and only over the top: level
 * 2 connects the wards. With the walk door barred as well, NOTHING in the inner
 * ward can be reached on any level: the bar separates them, and the gate was
 * the only ground crossing. The third is check 3 itself, with everything as
 * shipped. Deleting any one leaves a real hole: without the first the walk
 * could be two dead ends; without the second the cross-wall could be a
 * colander, or the bar a curtain.
 */
console.log('\nthe crossings, with the porter\'s gate shut');
{
  const walkDoor = plan.gates.find(g => g.id === 'stockhouse-walk');
  if (!walkDoor) fail('no walk door in the plan: the Stockhouse Tower\'s top room has nothing in its west doorway that could be barred');
  else if (walkDoor.closed) fail('the Stockhouse walk door ships barred in scene-config.json, and the mystery needs it open: door-unbarred is the porter\'s lie');
  else pass('the Stockhouse walk door is in the plan, and ships open');

  const over = walkability(makePlan(config, boundsOf, { closed: ['porter-gate'] })).rooms();
  const innerOver = over.filter(r => r.ward === 'inner' && r.reachable);
  const need = ['cross-walk', 'stockhouse-walk', 'kings-hall', 'royal-apartments'];
  const missed = need.filter(id => !innerOver.some(r => r.id === id));
  if (missed.length) {
    fail(`level 2 does not connect the wards: with the porter's gate shut and the walk door open, ${missed.join(', ')} cannot be reached — ${innerOver.length} inner-ward rooms can (${innerOver.map(r => r.id).join(', ') || 'none'})`);
  } else {
    pass(`level 2 connects the wards: with the porter's gate shut, ${innerOver.length} inner-ward rooms are still reached over the walk, ${need.join(', ')} among them`);
  }

  const barred = walkability(makePlan(config, boundsOf, { closed: ['porter-gate', 'stockhouse-walk'] }));
  const innerBarred = barred.rooms().filter(r => r.ward === 'inner' && r.reachable);
  if (innerBarred.length) {
    fail(`the barred door does not separate the wards: with the porter's gate shut and the Stockhouse walk door barred, ${innerBarred.map(r => `${r.id} (level ${r.level}, ${r.cells} cells)`).join(', ')} can still be reached. There is a second way across`);
  } else {
    pass(`the barred door separates them: with the porter's gate shut and the walk door barred, every inner-ward room is at 0 cells, against ${walk.rooms().filter(r => r.ward === 'inner').reduce((n, r) => n + r.cells, 0)} with both open`);
  }
  // and the outer ward is still there, so a fill that simply died proves nothing
  const outerBarred = barred.rooms().filter(r => r.ward === 'outer' && r.reachable).length;
  const outerOpen = walk.rooms().filter(r => r.ward === 'outer' && r.reachable).length;
  if (outerBarred !== outerOpen) fail(`shutting the crossings changed the OUTER ward too, ${outerOpen} rooms to ${outerBarred} — the fill did not run the castle it was meant to`);
  else pass(`the outer ward is unchanged by it, ${outerBarred} rooms either way`);

  // the cross-wall walk is one deck from tower to tower, not two stubs
  const cross = rooms.find(r => r.id === 'cross-walk');
  if (!cross) fail('no cross-walk room in the plan');
  else {
    const zs = cross.at.map(c => c.z);
    const [lo, hi] = [Math.min(...zs), Math.max(...zs)];
    if (!cross.reachable || lo > -12 || hi < 12) fail(`the cross-wall walk is not one deck: its reachable cells run z ${f2(lo)}..${f2(hi)}, and it has to reach both towers`);
    else pass(`the cross-wall walk is one deck, z ${f2(lo)}..${f2(hi)}, over the porter's gate`);
  }
}

/* ------------------- 6: every tower's upper rooms, by its own stairs ---
 * Check 3 floods with every flight in place, and the walk joins the towers at
 * level 2, so it cannot tell a tower that has lost a flight from one that has
 * not: the Kitchen Tower's first floor is reached from the North-west Tower's
 * stairs, along the north walk and down. So each tower is flooded on its own,
 * with only its flights built and every other tower's left out, and its
 * level-1 room, its level-2 room and the chamber its level-1 door serves all
 * have to be reached. This is the check the phase's first deliberate break is
 * aimed at.
 *
 * TWO TOWERS HAVE NO LOWER FLIGHT (#455). The Prison Tower's ground room is the
 * cell and the King's Tower's is the muniment room, both shut, and a stair from
 * a shut room to the walk is a way round what shuts it: the first time every
 * tower had both flights, check 3 read the cell reachable with its bars in
 * place and the muniment room reachable with its word-lock unanswered. Those
 * two are flooded from their own top room instead, and asked two things: that
 * the upper flight reaches the first floor, and that nothing reaches the ground
 * room, which is the lock holding from above.
 */
console.log('\neach tower\'s upper rooms, by its own stairs alone');
{
  const serves = { 'nw-tower': 'clerk-chamber', 'kitchen-tower': 'dormitory', 'kings-tower': 'royal-apartments' };
  for (const drum of config.drums) {
    if (!drum.stairs) { fail(`${drum.id} has no stairs`); continue; }
    const top = plan.rooms.find(r => r.drum === drum.id && r.level === 2);
    const fromTop = drum.lowerFlight === false && top
      ? { spawn: { position: [top.shape.cx, top.top + 1.7, top.shape.cz], level: 2 } } : {};
    const own = walkability(makePlan(config, boundsOf, { stairs: drum.id, ...fromTop })).rooms();
    const wanted = plan.rooms.filter(r => r.drum === drum.id && r.level > 0).map(r => r.id);
    if (serves[drum.id]) wanted.push(serves[drum.id]);
    const missed = wanted.filter(id => !own.find(r => r.id === id)?.reachable);
    const flights = plan.pieces.filter(p => p.kind === 'stair' && p.id.startsWith(`${drum.id}-stair-`)).length;
    const n = `its own ${flights} flight${flights === 1 ? '' : 's'}`;
    const how = drum.lowerFlight === false ? `${n}, from its top room` : n;
    if (missed.length) fail(`${missed.join(' and ')} cannot be reached by ${drum.id}'s ${drum.lowerFlight === false ? 'upper flight' : 'own stairs'} — ${missed.map(id => `${id} unreachable`).join(', ')}`);
    else pass(`${drum.id}: ${wanted.join(', ')} reached by ${how}`);
    if (drum.lowerFlight === false) {
      const ground = own.find(r => r.drum === drum.id && r.level === 0);
      if (!ground) fail(`${drum.id} has no ground room`);
      else if (!ground.locked) fail(`${drum.id} has no lower flight and its ground room ${ground.id} is open — only a shut room may keep its stairs from the walk`);
      else if (ground.reachable) fail(`${ground.id} can be reached down ${drum.id}'s stairs from the walk — ${ground.cells} cells — and it is shut for a reason`);
      else pass(`${ground.id} cannot be reached from above`);
    }
  }
}

/* ------------------------ 6b: the walk is one circuit, from one stair ---
 * With every flight built, a missing door in a tower's top room costs nothing
 * the fill can see: the deck beyond it is reached from the next tower's stairs.
 * So the castle is flooded once more with only the North-west Tower's flights
 * in place — the way up at the far corner of the outer ward — and every level-2
 * room has to be reached, and every stretch of decking the mystery names has
 * to be reached end to end, which is the walk running through every tower on
 * the way: KT and ST along the north, over the cross-wall, BT and CT along the
 * south, KG up the east.
 */
console.log('\nthe walk, from the North-west Tower\'s stairs alone');
{
  const only = walkability(makePlan(config, boundsOf, { stairs: 'nw-tower' })).rooms();
  const top = only.filter(r => r.level === 2);
  const dark = top.filter(r => !r.reachable);
  if (dark.length) fail(`from the North-west Tower's stairs alone the walk does not reach ${dark.map(r => r.id).join(', ')} — a tower's top room has lost a door, or a deck is missing`);
  else pass(`from the North-west Tower's stairs alone all ${top.length} level-2 rooms are reached`);
  for (const [id, axis, lo, hi] of [['north-walk', 'x', -31, -5], ['south-walk', 'x', 5, 21], ['cross-walk', 'z', -12, 12]]) {
    const r = top.find(x => x.id === id);
    if (!r || !r.reachable) continue;
    const vals = r.at.map(c => c[axis]);
    const [a, b] = [Math.min(...vals), Math.max(...vals)];
    if (a > lo || b < hi) fail(`${id} is reached only over ${axis} ${f2(a)}..${f2(b)} from the North-west Tower's stairs, not ${lo}..${hi} — the walk is broken part way along it`);
    else pass(`${id} reached end to end, ${axis} ${f2(a)}..${f2(b)}`);
  }
}

/* ------------------------------ 6c: nothing stands inside a flight ---
 * A flight is a surface with no collider, so what keeps a body out of its
 * wedge — off the slab under the upper flight, out of the tower floor under
 * the lower one — is `surfacesAt` discarding every floor between a ramp's foot
 * and its height at the point. Without that, the grid stands a body on the
 * first floor with the upper flight passing through its chest, and reports one
 * more reachable cell and no failure. So: no reachable cell may lie in a
 * flight's footprint below the flight, unless it is on the flight itself.
 */
console.log('\nnothing stands inside a flight');
{
  const ramps = plan.surfaces.filter(s => s.slope);
  const inside = [];
  for (const c of walk.cells) {
    const x = c.i * GRID + GRID / 2, z = c.j * GRID + GRID / 2;
    for (const r of ramps) {
      if (c.surface === r.id) continue;
      if (x < r.box.min.x || x > r.box.max.x || z < r.box.min.z || z > r.box.max.z) continue;
      const [ax, az, ay] = r.slope.from, [bx, bz, by] = r.slope.to;
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
      const h = ay + (by - ay) * t;
      if (c.h >= r.box.min.y - 1e-6 && c.h < h - 1e-6) inside.push({ c, r, h });
    }
  }
  if (inside.length) fail(`${inside.length} reachable cells stand inside a flight's body, e.g. (${(inside[0].c.i * GRID + GRID / 2).toFixed(2)}, ${(inside[0].c.j * GRID + GRID / 2).toFixed(2)}) at ${inside[0].c.h.toFixed(2)} under ${inside[0].r.id}, which is at ${inside[0].h.toFixed(2)} there`);
  else pass(`no reachable cell is inside any of the ${ramps.length} flights`);
}

/* ------------------------------- 7: head room under every upper floor ---
 * A slab is a collider, and the grid refuses a cell whose head band a collider
 * crosses, so no reachable cell ever has a ceiling under HEAD_HIGH: that claim
 * is true by construction and a check of it would change no answer (#13). What
 * CAN go wrong silently is a slab written too low over a room the fill never
 * enters anyway — the cell, the muniment room — or over a room whose loss looks
 * like a walled doorway. So this reads the geometry: every upper floor against
 * every room beneath it in plan, slab bottom less room floor, no less than the
 * height a standing body needs. The phase's second break lowers the royal
 * apartments to 1.6 m and this is the line that names it.
 */
console.log('\nhead room under the upper floors');
{
  const slabs = plan.pieces.filter(p => p.built === 'floor' && !p.flush);
  let checked = 0;
  for (const slab of slabs) {
    for (const r of plan.rooms) {
      if (r.level >= slab.level) continue;
      const over = Math.min(slab.box.max.x, r.bounds.max.x) - Math.max(slab.box.min.x, r.bounds.min.x) > 0.5 &&
        Math.min(slab.box.max.z, r.bounds.max.z) - Math.max(slab.box.min.z, r.bounds.min.z) > 0.5;
      if (!over) continue;
      checked++;
      const clear = slab.box.min.y - r.top;
      if (clear < HEAD_HIGH - 1e-9) fail(`${slab.id} hangs ${clear.toFixed(2)} m over ${r.id}'s floor at ${r.top} — a standing body needs ${HEAD_HIGH}`);
    }
  }
  if (!checked) fail('no upper floor lies over any room — nothing was measured');
  else pass(`${slabs.length} upper floors over ${checked} rooms beneath them, every one ${HEAD_HIGH} m or more clear`);
}

/* ------------------------------ 8: a body can climb every flight ---
 * The grid samples a cell CENTRE and its top cell on every flight reads fine
 * (#459). A body is 0.45 m across, and for a year nothing in Node walked one:
 * the slab beside a well is a wall while the feet are under its top less
 * HEAD_LOW, on a 1:1 flight that is everything but the last 0.20 m of run,
 * and the strip past the well's top end holds a body 0.45 m short of the
 * edge, where the slab is a 0.55 m climb and STEP_UP is 0.35. Every flight in
 * the castle was a wall at its top and every suite was green (#511). So this
 * walks the controller's own `moveBody` along each flight in 0.05 m steps,
 * starting on the flight a body's radius in from one end, and asks that the
 * feet end on the floor at the other end, which they can only do once the
 * body's centre is past the flight's own edge; then the same the other way. It
 * starts on the flight rather than before it because a metre before a lower
 * flight's foot is inside the tower's ring.
 */
console.log('\na body up and down every flight');
{
  const walkFlight = (ramp, up) => {
    const [ax, az, ay] = ramp.slope.from, [bx, bz, by] = ramp.slope.to;
    const len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len, uz = (bz - az) / len;
    // the flight's ends are its own surface; the floors it joins are the storeys either side
    const [sx, sz, sy, tx, tz] = up ? [ax, az, ay, bx, bz] : [bx, bz, by, ax, az];
    const ty = plan.storey * (ramp.level + (up ? 1 : 0));
    const dir = up ? 1 : -1;
    const rise = (by - ay) / len;
    let body = { x: sx + ux * dir * BODY_RADIUS, z: sz + uz * dir * BODY_RADIUS, feet: sy + dir * rise * BODY_RADIUS };
    let pushed = new Set();
    for (let i = 0; i < 200; i++) {
      const r = moveBody(plan, plan.colliders, body, ux * dir * 0.05, uz * dir * 0.05);
      r.pushedBy.forEach((id) => pushed.add(id));
      if (r.refused) break;
      body = r;
    }
    const past = ((body.x - tx) * ux + (body.z - tz) * uz) * dir;
    // A flight at a curtain's end faces the pier that run drives 2 m into the
    // tower, 0.35 m past the flight's end, and that pier is an 8 m wall: a
    // body walking straight on stops a radius from it, 0.1 m onto the flight,
    // and leaves through the crescent beside the flight instead, the way
    // play-castle.mjs's walk has always described it. So one sidestep of a
    // body's width, either way, counts.
    let side = null;
    if (Math.abs(body.feet - ty) > 1e-6) {
      for (const sgn of [1, -1]) {
        let b = body;
        for (let i = 0; i < 20 && Math.abs(b.feet - ty) > 1e-6; i++) {
          const r = moveBody(plan, plan.colliders, b, -uz * sgn * 0.05, ux * sgn * 0.05);
          if (r.refused) break;
          b = r;
        }
        if (Math.abs(b.feet - ty) <= 1e-6) { side = sgn; body = b; break; }
      }
    }
    return { body, past, side, pushed: [...pushed], top: ty, edge: up ? by : ay };
  };
  let climbed = 0, sidestepped = 0;
  for (const ramp of plan.ramps) {
    const piece = plan.pieces.find(p => p.id === ramp.id);
    const label = piece ? piece.label : ramp.id;
    for (const up of [true, false]) {
      const r = walkFlight(ramp, up);
      const ok = Math.abs(r.body.feet - r.top) < 1e-6;
      if (ok) { climbed++; if (r.side) sidestepped++; continue; }
      const short = Math.max(0, -r.past);
      fail(`${label} cannot be ${up ? 'climbed' : 'descended'}: the body stops at feet ${r.body.feet.toFixed(2)}, ${short.toFixed(2)} m short of the ${up ? 'top' : 'bottom'} edge at ${r.edge.toFixed(2)}${r.pushed.length ? `, pushed by ${r.pushed.join(', ')}` : ''}`);
    }
  }
  if (!plan.ramps.length) fail('the plan has no flights, so nothing was climbed');
  else if (climbed === plan.ramps.length * 2) pass(`${plan.ramps.length} flights, each climbed and descended by a ${BODY_RADIUS} m body onto the floor beyond, ${sidestepped} of the ${climbed} walks leaving through the crescent beside the flight`);
}

/* ------------------------------ 9: every merlon stands on stone ---
 * battlement.glb is authored with its body 0.3 to 0.6 behind its origin, and
 * `place` moves nothing in plan, so at scale 4 a merlon's stone stands 1.2 to
 * 2.4 m outward of wherever it is anchored. On a 4 m thick run that is the
 * outer 0.8 m of the wall top and 0.4 m over the face. On a drum of radius 4,
 * anchored on the rim, it was radius 5.2 to 6.4: twelve merlons per tower
 * hanging in the air with 1.2 m of nothing between them and the stone, seen
 * by nobody until Devon saw them (#514). plan-vs-scene.mjs could not: the
 * plan box carries the same offset the scene does. So: at least half of every
 * merlon's footprint lies over a collider whose top is the merlon's base.
 */
console.log('\nevery merlon stands on stone');
{
  const merlons = plan.pieces.filter(p => p.label === 'battlement');
  const tops = plan.colliders;
  let floating = 0;
  for (const m of merlons) {
    const area = (m.box.max.x - m.box.min.x) * (m.box.max.z - m.box.min.z);
    let over = 0;
    for (const c of tops) {
      if (Math.abs(c.box.max.y - m.box.min.y) > 1e-6) continue;
      const ox = Math.min(c.box.max.x, m.box.max.x) - Math.max(c.box.min.x, m.box.min.x);
      const oz = Math.min(c.box.max.z, m.box.max.z) - Math.max(c.box.min.z, m.box.min.z);
      if (ox > 0 && oz > 0) over += ox * oz;
    }
    if (over / area >= 0.5) continue;
    floating++;
    const near = tops.filter(c => Math.abs(c.box.max.y - m.box.min.y) < 1e-6)
      .map(c => ({ id: c.id, d: Math.hypot(Math.max(c.box.min.x - m.box.max.x, m.box.min.x - c.box.max.x, 0), Math.max(c.box.min.z - m.box.max.z, m.box.min.z - c.box.max.z, 0)) }))
      .sort((p, q) => p.d - q.d)[0];
    fail(`${m.id} at y ${m.box.min.y.toFixed(2)} has ${Math.round(100 * over / area)}% of its footprint over stone; nearest stone with a top at ${m.box.min.y.toFixed(2)} is ${near ? `${near.id}, ${near.d.toFixed(2)} m away` : 'nowhere'}`);
  }
  if (!merlons.length) fail('the plan has no merlons, so nothing was checked');
  else if (!floating) pass(`${merlons.length} merlons, every one at least half over stone whose top is its base`);
}

/* ----------------------------- 9b: every hollow drum wears a crown ---
 * The drum's parapet is stone in its own sectors (#514), and a sector that
 * stops at the drum's height is a gap in it that a body on a future tower top
 * would walk off. Every sector reaches over HEAD_LOW above the drum, and at
 * least one reaches the crown's merlon height.
 */
console.log('\nthe drums\' crowns');
{
  const crown = config.battlements.crown;
  if (!crown) fail('config.battlements has no crown');
  for (const drum of config.drums) {
    if (!drum.interior) continue;
    const sectors = plan.colliders.filter(c => c.id.startsWith(`${drum.id}-sector-`));
    const top = new Map();
    for (const c of sectors) {
      const i = +c.id.split('-sector-')[1].split('-')[0];
      top.set(i, Math.max(top.get(i) || 0, c.box.max.y));
    }
    const low = [...top.entries()].filter(([, y]) => y < drum.height + HEAD_LOW + 1e-6);
    const merlon = [...top.values()].some(y => Math.abs(y - (drum.height + (crown ? crown.merlon : 0))) < 1e-6);
    if (low.length) fail(`${drum.id} sector ${low[0][0]} crowns at ${low[0][1].toFixed(2)}, under the ${(drum.height + HEAD_LOW).toFixed(2)} a body on the lid would need stopping by`);
    else if (!merlon) fail(`${drum.id} has no sector at the crown's merlon height ${drum.height + (crown ? crown.merlon : 0)}`);
    else pass(`${drum.id}: ${top.size} sectors, none under ${(drum.height + HEAD_LOW).toFixed(2)}, merlons at ${(drum.height + crown.merlon).toFixed(2)}`);
  }
}

/* ------------------------- 10: no two upward faces share a plane ---
 * The ground-floor rooms flickered on Devon's machine and no suite could say
 * so: the base pavers, the outer ward's grass and the Great Hall's rock tile
 * were three meshes at y 0 over the same 128 m², two of them carrying the same
 * polygon offset, and the walk's decking lay flush in the curtain's top. A
 * depth fight is not a property the plan can see, but two pieces whose tops
 * share a height over a common footprint is, and it is the only way one
 * starts (#513). So: over every box of every ground, floor, wall and tower
 * piece, no two boxes of different pieces have tops within a millionth and
 * footprints that overlap by more than a square centimetre.
 */
console.log('\nno two upward faces on one plane');
{
  // Not the drums: a run's box reaches into a drum's ring, and its top there
  // is inside the stone, seen by nobody. A wall's top is open sky.
  const faced = plan.pieces.filter(p => ['ground', 'floor', 'wall'].includes(p.kind) && (p.boxes || p.box));
  const entries = faced.flatMap(p => (p.boxes || [p.box]).map(b => ({ id: p.id, b, disc: p.disc || null, outline: p.outline || null })));
  // A tower floor is a disc and its box is the square round it; the corners
  // of that square are inside the ring's stone, so a run's top meeting them is
  // seen by nobody. A rectangular slab is cut back to the drums it meets and
  // its box is the box round that outline. The overlap is counted at 0.05 m
  // over the rectangle, disc pieces by their disc and outline pieces by their
  // polygon.
  const inPolygon = (poly, x, z) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, zi] = poly[i], [xj, zj] = poly[j];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  };
  const inShape = (e, x, z) => e.disc ? Math.hypot(x - e.disc.cx, z - e.disc.cz) <= e.disc.radius : e.outline ? inPolygon(e.outline, x, z) : true;
  const area = (a, b, x0, x1, z0, z1) => {
    let n = 0, total = 0;
    for (let x = x0 + 0.025; x < x1; x += 0.05) for (let z = z0 + 0.025; z < z1; z += 0.05) { total++; if (inShape(a, x, z) && inShape(b, x, z)) n++; }
    return total ? (x1 - x0) * (z1 - z0) * n / total : 0;
  };
  const shared = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i], b = entries[j];
      if (a.id === b.id || Math.abs(a.b.max.y - b.b.max.y) > 1e-6) continue;
      const x0 = Math.max(a.b.min.x, b.b.min.x), x1 = Math.min(a.b.max.x, b.b.max.x);
      const z0 = Math.max(a.b.min.z, b.b.min.z), z1 = Math.min(a.b.max.z, b.b.max.z);
      if (x1 - x0 <= 0 || z1 - z0 <= 0) continue;
      const over = area(a, b, x0, x1, z0, z1);
      if (over <= 1e-4) continue;
      shared.push(`${a.id} and ${b.id} share a top at ${a.b.max.y.toFixed(3)} over ${over.toFixed(2)} m² at x ${x0.toFixed(1)}..${x1.toFixed(1)}, z ${z0.toFixed(1)}..${z1.toFixed(1)}`);
    }
  }
  const seen = new Set();
  for (const line of shared) if (!seen.has(line)) { seen.add(line); fail(line); }
  if (!shared.length) pass(`${entries.length} boxes over ${faced.length} pieces, no two tops on one plane over a common footprint`);
}

/* ------------------------------ 11: every room has something in it ---
 * Twenty-five of thirty-six rooms had nothing in them, every room above the
 * ground among them, and eight identical drums on one stone: Devon could not
 * tell where he was (#517). A room that is not open ground and not shut has
 * at least one prop or piece of decor standing on its own floor, with its
 * box centre inside the room's bounds; a room emptied by a later move reads
 * `has nothing in it` here rather than in a walk.
 */
console.log('\nsomething in every room');
{
  const things = plan.pieces.filter(p => p.kind === 'prop' || (p.kind === 'decor' && p.label !== 'battlement'));
  let filled = 0;
  for (const r of plan.rooms) {
    if (r.locked) continue;
    const inside = things.filter(p => {
      const x = (p.box.min.x + p.box.max.x) / 2, z = (p.box.min.z + p.box.max.z) / 2;
      return x >= r.bounds.min.x && x <= r.bounds.max.x && z >= r.bounds.min.z && z <= r.bounds.max.z &&
        (r.shape?.kind !== 'disc' || Math.hypot(x - r.shape.cx, z - r.shape.cz) <= r.shape.radius) &&
        Math.abs(p.box.min.y - r.top) < 1.0;
    });
    if (inside.length) filled++;
    else fail(`${r.id} (level ${r.level}) has nothing in it`);
  }
  const open = plan.rooms.filter(r => r.locked).length;
  if (filled + open === plan.rooms.length) pass(`${filled} rooms each hold at least one thing, ${open} shut rooms not asked`);
}

/* ------------------------------- 13: nothing stands inside a turret ---
 * A turret is two metres of solid cylinder on four drums' tops, and until #523
 * it had no collider at all: the drum's box knew about it and nothing else did.
 * Nothing could reach 12 m, which is exactly how a hole like this lives for
 * four phases — and this row builds a floor at 12 m, so the question stops
 * being hypothetical. The rule is 6c's, one shape up: no reachable cell may lie
 * inside a turret's own disc between its base and its top. A turret over a
 * reachable floor fails here rather than being walked through in a render.
 */
console.log('\nnothing stands inside a turret');
{
  const turrets = plan.pieces.filter(p => p.drum && p.drum.turret).map(p => ({ id: p.id, t: p.drum.turret }));
  if (!turrets.length) fail('no drum carries a turret — this check measured nothing');
  const inside = [];
  for (const c of walk.cells) {
    const x = c.i * GRID + GRID / 2, z = c.j * GRID + GRID / 2;
    for (const { id, t } of turrets) {
      if (Math.hypot(x - t.cx, z - t.cz) > t.radius) continue;
      // The feet inside it, or the head band crossing it: a body standing 0.2 m
      // under a turret's base is in the turret from the chest up.
      if (c.h >= t.base + t.height - 1e-6 || c.h + HEAD_LOW >= t.base + t.height - 1e-6) continue;
      if (c.h + HEAD_HIGH <= t.base + 1e-6) continue;
      inside.push(`a body at (${f2(x)}, ${f2(z)}) standing at ${f2(c.h)} is inside ${id}'s turret, which runs ${f2(t.base)} to ${f2(t.base + t.height)} within ${t.radius} m of (${f2(t.cx)}, ${f2(t.cz)})`);
    }
  }
  for (const line of inside.slice(0, 6)) fail(line);
  if (inside.length > 6) fail(`... and ${inside.length - 6} more cells inside a turret`);
  if (!inside.length) pass(`${turrets.length} turrets, ${walk.cells.length} reachable cells, none of them in one`);
}

/* --------------------------- 14: a roof is over its room and nothing else ---
 * The Great Hall has been open to the sky since Phase 3 and PLAN.md said it had
 * a flat ceiling; #527 puts seven trusses across it. A piece with `roofs` is
 * over a room rather than standing in it, and three things have to hold or it is
 * either in the way or not there: it clears a standing body over that room's
 * floor, its footprint is inside that room's own rectangle, and no reachable
 * cell anywhere has its head band inside the piece's box, GROWN BY A BODY'S
 * RADIUS: the grid samples a cell centre and a body is 0.9 m across, which is
 * the whole of #511 one storey up. The last one is read off the BOX and not off
 * the colliders, because these carry `noCollide` (#427) — a truss that reaches
 * over the south walk would be walked through rather than walked into, and
 * walked through is worse. It is also the line that set the trusses' span: at
 * the hall's full 8 m the fourth reaches into the Prison Tower's disc, which
 * pokes 0.5 m into the hall's rectangle and has a body standing in it at 8 m.
 */
console.log('\na roof over its room and out of everyone\'s way');
{
  const roofs = plan.pieces.filter(p => p.roofs);
  if (!roofs.length) fail('no piece in the castle roofs a room — this check measured nothing');
  const byId = new Map(plan.rooms.map(r => [r.id, r]));
  let clear = 0;
  for (const piece of roofs) {
    const room = byId.get(piece.roofs);
    if (!room) { fail(`${piece.id} says it roofs "${piece.roofs}", which is not a room`); continue; }
    const head = piece.box.min.y - room.top;
    if (head < HEAD_HIGH - 1e-9) { fail(`${piece.id} hangs ${f2(head)} m over ${room.id}'s floor at ${f2(room.top)} — a standing body needs ${HEAD_HIGH}`); continue; }
    const out = [];
    if (piece.box.min.x < room.bounds.min.x - 1e-6) out.push(`${f2(room.bounds.min.x - piece.box.min.x)} m past its west wall`);
    if (piece.box.max.x > room.bounds.max.x + 1e-6) out.push(`${f2(piece.box.max.x - room.bounds.max.x)} m past its east wall`);
    if (piece.box.min.z < room.bounds.min.z - 1e-6) out.push(`${f2(room.bounds.min.z - piece.box.min.z)} m past its north wall`);
    if (piece.box.max.z > room.bounds.max.z + 1e-6) out.push(`${f2(piece.box.max.z - room.bounds.max.z)} m past its south wall`);
    if (out.length) { fail(`${piece.id} reaches outside ${room.id}: ${out.join(', ')}`); continue; }
    const blocked = walk.cells.filter(c => {
      const x = c.i * GRID + GRID / 2, z = c.j * GRID + GRID / 2;
      if (x < piece.box.min.x - BODY_RADIUS || x > piece.box.max.x + BODY_RADIUS) return false;
      if (z < piece.box.min.z - BODY_RADIUS || z > piece.box.max.z + BODY_RADIUS) return false;
      return c.h + HEAD_LOW < piece.box.max.y - 1e-6 && c.h + HEAD_HIGH > piece.box.min.y + 1e-6;
    });
    if (blocked.length) {
      const where = blocked[0];
      fail(`${piece.id} blocks ${blocked.length} reachable cell(s), the first at (${f2(where.i * GRID + GRID / 2)}, ${f2(where.j * GRID + GRID / 2)}) standing at ${f2(where.h)} on ${where.surface}`);
      continue;
    }
    clear++;
  }
  if (clear === roofs.length) pass(`${roofs.length} roof pieces, each inside its room and ${f2(Math.min(...roofs.map(p => p.box.min.y - byId.get(p.roofs).top)))} m or more over its floor, none in a reachable head band`);
}

/* ---------------------- 12: every surface a foot can land on makes a noise ---
 * The castle has made no sound for seven phases and now makes two (#519). The
 * footstep is chosen by the surface under the feet, so every one of the plan's
 * surfaces has to resolve to a step class and every class it resolves to has to
 * be defined — an unknown material has to fail here, in Node, and not shrug at
 * runtime (#13). The resolution is `stepClassOf` from src/audio.js itself, not
 * a copy of the rule written out again in this file: a check that
 * re-implements the thing it checks is not a check (#34).
 */
console.log('\nevery surface has a step sound');
{
  const sounds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sounds.json'), 'utf8'));
  const classes = sounds.steps.classes;
  const used = new Map();
  let unresolved = 0;
  for (const s of plan.surfaces) {
    const cls = stepClassOf(sounds, s);
    if (!cls) {
      fail(`"${s.id}" is a ${s.material ? `${s.material} ` : ''}${s.kind || 'surface'} and data/sounds.json says nothing about what standing on it sounds like`);
      unresolved++;
      continue;
    }
    if (!classes[cls]) {
      fail(`"${s.id}" resolves to the step class "${cls}", which data/sounds.json's classes do not define`);
      unresolved++;
      continue;
    }
    used.set(cls, (used.get(cls) || 0) + 1);
  }
  if (!unresolved) {
    const spread = [...used].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${n} ${c}`).join(', ');
    pass(`all ${plan.surfaces.length} surfaces have a step class: ${spread}`);
  }
  // And nothing in the file that no surface can reach: a class defined and
  // never used is a tuning nobody will ever hear, and the four here are
  // exactly the four the castle stands on.
  const dead = Object.keys(classes).filter(c => !used.has(c));
  if (dead.length) fail(`data/sounds.json defines step ${dead.length === 1 ? 'class' : 'classes'} ${dead.map(c => `"${c}"`).join(', ')} that no surface in the castle resolves to`);
  else pass(`all ${Object.keys(classes).length} step classes are reachable from some surface`);
}

/* --------------------------------------------------- WHERE CHECK 5 WENT ---
 * It read both lists in `npcs.json` for entries with a `position` array.
 * `npcs` was deleted in Phase 6 (#472) and no `cast` entry has ever carried a
 * `position` — stations live in `mystery.json`'s `schedule` — so
 * `standing.length` was 0 and the loop asserted nothing at all (#13). The
 * question it was asking is `validateMystery`'s now, in `test/mystery.mjs`:
 * floor under every station, reachable, and walkable from the one before it.
 * Deleted rather than fixed, and the break that proves the job is done
 * elsewhere is in HISTORY.md under #529.
 *
 * AND WHY NO CHECK 15 CAME THE OTHER WAY. `plan-vs-scene.mjs` used to assert,
 * in a browser, that every room had a floor at its centre to stand the camera
 * on. That is arithmetic over the plan and it belongs in this file — and
 * written down here it cannot fail. A room the fill reaches has cells by
 * definition; the two it does not reach are ground rooms with the base pavers
 * under them; barring the Stockhouse walk door leaves the room reachable up
 * its own stairs; deleting a tower room's floor stops the room naming one at
 * all. The nearest falsifiable neighbour, "a room that names a floor is stood
 * on it", was written and could not be made to fail either. So nothing was
 * added: the browser suite states it as a precondition that throws with the
 * room named and asserts nothing, and a third dead line guarding the same
 * absence is exactly what this row existed to avoid (#34, #147, #13).
 */

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
