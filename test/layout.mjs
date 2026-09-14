// layout.mjs — where data/scene-config.json puts things, in world space, against
// the walls it puts them between. Node only, no browser.
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
// EMBEDDED and nothing else. Nothing in CI looked at this at all, and nothing
// anywhere put a number on how far a thing stands from the wall behind it.
//
// WHAT THIS IS NOT. It re-implements castle-builder.js's placement math
// (`tileToWorld`, `normalizeToTile`, `normalizeHeight`, `groundAndCenter`) in
// Node rather than reading it out of a live scene, so it cannot catch a change
// to that math — if `normalizeToTile` starts scaling off X again, this file
// scales off Z and agrees with itself. What it catches is the config drifting:
// a tile number moved into stone, or a prop nudged so far off its wall that the
// hall reads as a warehouse. That is the failure that has actually happened
// here, four times. `play-castle.mjs`'s beat is the one that holds this file and
// the builder together, and it has to keep being hand-run for that reason.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { triangles } from './gltf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));
const T = config.tileSize;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);

/* ------------------------------------------------------------- placement ---
 * castle-builder.js in four lines. Scale (by depth for wall/tower pieces, by
 * height for columns, not at all for the Poly Haven props), rotate about Y,
 * ground, translate to the tile. `yOffset` and `surfaceHeightUnder` only move
 * things in Y, and every wall here runs the full 0..4 m of it, so neither
 * changes any answer below.
 */
function boxOf(rel, { tile, rotationY = 0, scaleBy }) {
  const { verts } = triangles(path.join(ROOT, rel));
  const span = (vs, i) => Math.max(...vs.map(v => v[i])) - Math.min(...vs.map(v => v[i]));
  let s = 1;
  if (scaleBy === 'depth') s = T / span(verts, 2);
  if (scaleBy === 'height') s = T / span(verts, 1);
  const r = rotationY * Math.PI / 180, cos = Math.cos(r), sin = Math.sin(r);
  const placed = verts.map(([x, y, z]) => {
    const [sx, sy, sz] = [x * s, y * s, z * s];
    return [sx * cos + sz * sin, sy, -sx * sin + sz * cos];
  });
  const lift = -Math.min(...placed.map(v => v[1]));
  return {
    min: [Math.min(...placed.map(v => v[0])) + tile[0] * T, 0, Math.min(...placed.map(v => v[2])) + tile[1] * T],
    max: [Math.max(...placed.map(v => v[0])) + tile[0] * T, Math.max(...placed.map(v => v[1])) + lift, Math.max(...placed.map(v => v[2])) + tile[1] * T],
  };
}

const K = config.kenneyBase, P = config.polyhavenBase;

const stone = [];
for (const run of config.courtyard.wallRuns)
  for (let i = 0; i < run.count; i++)
    stone.push({
      label: run.comment ? run.comment.split(/[.,]/)[0] : run.model,
      box: boxOf(K + run.model, {
        tile: [run.start[0] + run.step[0] * i, run.start[1] + run.step[1] * i],
        rotationY: run.rotationY, scaleBy: 'depth',
      }),
    });
for (const p of config.courtyard.placements) {
  const scaleBy = /^(tower|wall)/.test(p.model) ? 'depth' : /^column/.test(p.model) ? 'height' : null;
  if (!scaleBy) continue; // crates, fences and trees are decor, not architecture
  if (p.id === 'gate-arch') continue; // a doorway is meant to have a hole in it
  stone.push({ label: p.comment || p.model, box: boxOf(K + p.model, { tile: p.tile, rotationY: p.rotationY, scaleBy }) });
}

const props = config.interiorProps.map(p => ({
  name: p.model.split('/')[0].replace(/_1k\.gltf$/, ''),
  box: boxOf(P + p.model, { tile: p.tile, rotationY: p.rotationY, scaleBy: null }),
}));

/* --------------------------------------- 1: no interior prop is in a wall ---
 * Every prop against every wall run, tower and column, not the four the browser
 * beat names. Overlap in x and z is enough: the walls run the full height of the
 * hall, so a prop that overlaps one in plan overlaps it in space.
 */
console.log('interior props against the stone around them');
for (const prop of props) {
  const hit = stone.find(s =>
    Math.min(prop.box.max[0], s.box.max[0]) - Math.max(prop.box.min[0], s.box.min[0]) > 0 &&
    Math.min(prop.box.max[2], s.box.max[2]) - Math.max(prop.box.min[2], s.box.min[2]) > 0);
  if (hit) fail(`${prop.name} at x ${prop.box.min[0].toFixed(2)}..${prop.box.max[0].toFixed(2)}, z ${prop.box.min[2].toFixed(2)}..${prop.box.max[2].toFixed(2)} is inside ${hit.label}`);
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
 */
const HALL_WEST_FACE = -6, HALL_EAST_FACE = 6; // inner faces of the hall side walls
const MIN_GAP = 0.02, MAX_GAP = 0.30;

console.log('\nthe cabinet and the commode against their side walls');
for (const [name, face, edge] of [
  ['GothicCabinet_01', HALL_WEST_FACE, 'min'],
  ['GothicCommode_01', HALL_EAST_FACE, 'max'],
]) {
  const prop = props.find(p => p.name === name);
  if (!prop) { fail(`${name} is not in interiorProps — nothing to measure`); continue; }
  const gap = edge === 'min' ? prop.box.min[0] - face : face - prop.box.max[0];
  if (gap < MIN_GAP) fail(`${name} stands ${gap.toFixed(3)} m from the hall wall at x ${face} — its back is in the stone`);
  else if (gap > MAX_GAP) fail(`${name} stands ${gap.toFixed(3)} m off the hall wall at x ${face}, over the ${MAX_GAP} m this room reads as "against the wall"`);
  else pass(`${name} stands ${gap.toFixed(3)} m off the wall at x ${face}`);
}

/* The column each one had to get past, measured rather than restated: whichever
 * stone piece shares its x band is the one in the way, and the gap that matters
 * is in z. Asserting it keeps a later southward nudge from walking either piece
 * back into the column it was moved out of.
 */
const columns = config.courtyard.placements.filter(p => /^column/.test(p.model))
  .map(p => ({ model: p.model, box: boxOf(K + p.model, { tile: p.tile, rotationY: p.rotationY, scaleBy: 'height' }) }));
for (const name of ['GothicCabinet_01', 'GothicCommode_01']) {
  const prop = props.find(p => p.name === name);
  if (!prop) continue;
  const col = columns.find(c =>
    Math.min(prop.box.max[0], c.box.max[0]) - Math.max(prop.box.min[0], c.box.min[0]) > 0);
  if (!col) { pass(`${name} shares no x band with either column`); continue; }
  const gap = prop.box.min[2] - col.box.max[2];
  if (gap <= 0) fail(`${name} is ${(-gap).toFixed(3)} m into ${col.model}, which shares its x band`);
  else pass(`${name} clears ${col.model} by ${gap.toFixed(3)} m in z`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
