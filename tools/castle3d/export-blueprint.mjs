#!/usr/bin/env node
// tools/castle3d/export-blueprint.mjs: writes <out>/blueprint.json, the plan
// the Blender build snaps to (#500, #841, #843).
//
//   node tools/castle3d/export-blueprint.mjs <out dir>
//   (or through build.mjs, which calls exportBlueprint before every build)
//
// WHAT IT IS. `makePlan` run in Node exactly the way test/layout.mjs runs it:
// scene-config.json, and `boundsOf` built on test/gltf.mjs's `partsOf` with one
// read per file (layout.mjs line 69). What the plan returns is copied into the
// file in the game's frame, metres and Y-up, and nothing here computes a
// transform of its own. Blender converts on its side, in common.py's
// `to_blender`, which is #843's contract.
//
// TWO FIELDS ARE READ RATHER THAN COPIED (#843):
//  - each piece's `noCollide`: true when no plan collider has the piece's id
//    as its own id. That is how a config row's `noCollide` reaches the plan
//    (castle-plan.js `collide(id, box)` for decor and interior props). Built
//    stone names its colliders `<id>-<n>`, `<id>-sector-<n>`, `<id>-jamb-a`
//    and so on, so on walls, drums, arches and floors this field says nothing;
//    it is for the `PROP_<id>` objects of increment 6. A prefix rule was tried
//    and rejected: `cloak` would have taken `cloak-crate`'s collider.
//  - `braziers` (#871): scene-config.json's three, which main.js builds at
//    runtime through `castle.tileToWorld` and the plan does not carry, each
//    `position` from castle-plan.js's own `tileToWorld(plan.tile, ...tile)`.
//  - `cameras` (#872): cameras.json's five, each eye's `stand` from the plan's
//    `standAt(plan, x, z, eye.y - EYE_HEIGHT)` and `reachable` from
//    `walkability(plan).reachable(x, z, stand.level)`, the spawn's flood fill.
//    `"eye": "spawn"` is `plan.spawn`'s position and lookAt. check.py line 8
//    reads the answer and never re-derives it (#500).
//  - `openRooms`: data/mystery.json's rooms marked `open`, with their ward,
//    beside the three gates' x that cut the ground into them. The band each
//    lies in is src/stations.js line 207's rule, written out below as a table,
//    and a fifth open room with no row in it is refused by name.
//
// NOT COMMITTED, EVER (#841): written fresh before every build, outside the
// repo, so there is no second copy of the plan for anything to drift from.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, '..', '..');

/* Which gate bounds each open place, west side then east side; null is the
 * curtain's own edge. src/stations.js `roomAt`: west of the west gate is the
 * barbican, east of the east gate the garden, east of the cross-wall the
 * inner ward, and the rest the outer ward. */
const BAND = {
  'west-barbican': [null, 'west-gate'],
  'outer-ward': ['west-gate', 'porter-gate'],
  'inner-ward': ['porter-gate', 'east-gate'],
  'garden': ['east-gate', null],
};

/* `leaf` (width, springline, archRadius, thickness; the four gate leaves) and
 * `bars` (width, height, thickness, count; cell-bars) from increment 3, copied
 * as the plan returns them, so gates.py draws the game's round-headed leaf and
 * six bars without a second copy of scene-config.json's numbers (#500). */
const PIECE_FIELDS = ['id', 'kind', 'level', 'curtain', 'material', 'model', 'transform', 'box',
  'drum', 'disc', 'pivot', 'evidence', 'read', 'bell', 'roofs', 'leaf', 'bars'];

/** cameras.json's rows with each eye's stand and reachability, by the plan's own functions (#872). */
export function camerasOf(plan, rows, { standAt, walkability, EYE_HEIGHT, STEP_UP }) {
  let walk = null;
  return rows.map((c) => {
    const spawn = c.eye === 'spawn';
    const eye = spawn ? plan.spawn.position.slice() : c.eye;
    const target = spawn ? plan.spawn.lookAt.slice() : c.target;
    if (!Array.isArray(eye) || eye.length !== 3 || !Array.isArray(target) || target.length !== 3) {
      throw new Error(`export-blueprint: camera "${c.name}" needs an eye and a target, each [x, y, z], or "eye": "spawn"`);
    }
    if ((c.lens == null) === (c.fovY == null)) {
      throw new Error(`export-blueprint: camera "${c.name}" needs exactly one of lens and fovY`);
    }
    const found = standAt(plan, eye[0], eye[2], eye[1] - EYE_HEIGHT);
    const stand = found ? { h: found.h, surface: found.surface, level: found.level } : null;
    if (stand && !walk) walk = walkability(plan);
    const reachable = stand ? walk.reachable(eye[0], eye[2], stand.level) : false;
    return { name: c.name, eye, target, lens: c.lens ?? null, fovY: c.fovY ?? null, exposure: c.exposure,
      samples: c.samples, feet: eye[1] - EYE_HEIGHT, eyeHeight: EYE_HEIGHT, stepUp: STEP_UP, stand, reachable };
  });
}

export async function makeBlueprint() {
  const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
  const plans = await imp('src/castle-plan.js');
  const { makePlan, tileToWorld } = plans;
  const { partsOf } = await imp('test/gltf.mjs');
  const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const config = read('data/scene-config.json');
  const mystery = read('data/mystery.json');
  const cameraRows = JSON.parse(fs.readFileSync(path.join(HERE, 'cameras.json'), 'utf8'));

  const measured = new Map();
  const boundsOf = (rel) => {
    if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel)));
    return measured.get(rel);
  };
  const plan = makePlan(config, boundsOf);

  const colliderIds = new Set(plan.colliders.map((c) => c.id));
  const pieces = plan.pieces.map((p) => {
    const out = {};
    for (const k of PIECE_FIELDS) out[k] = p[k] ?? null;
    out.noCollide = !colliderIds.has(p.id);
    return out;
  });

  const gateX = {};
  for (const g of plan.gates) if (typeof g.x === 'number') gateX[g.id] = g.x;
  const open = mystery.rooms.filter((r) => r.open).map((r) => {
    const band = BAND[r.id];
    if (!band) throw new Error(`export-blueprint: open room "${r.id}" has no band; add it to BAND beside src/stations.js roomAt`);
    for (const g of band) if (g && !(g in gateX)) throw new Error(`export-blueprint: gate "${g}" has no x in the plan`);
    return { id: r.id, name: r.name ?? null, ward: r.ward ?? null, level: r.level ?? 0, west: band[0], east: band[1] };
  });

  const braziers = (config.braziers || []).map((b, i) => ({
    id: `brazier-${i + 1}`, tile: b.tile.slice(), position: tileToWorld(plan.tile, ...b.tile), comment: b.comment ?? null,
  }));
  const cameras = camerasOf(plan, cameraRows, plans);

  return {
    comment: 'Written by tools/castle3d/export-blueprint.mjs from makePlan. Game frame: metres, Y-up. Not committed (#841).',
    tile: plan.tile, storey: plan.storey, slab: plan.slab, levels: plan.levels,
    spawn: plan.spawn, curtain: plan.curtain,
    rooms: plan.rooms, gates: plan.gates, ramps: plan.ramps, drums: plan.drums, grounds: plan.grounds,
    pieces, colliders: plan.colliders,
    openRooms: { gateX, rooms: open },
    braziers, cameras,
    counts: {
      pieces: pieces.length, colliders: plan.colliders.length, rooms: plan.rooms.length,
      open: open.length, gates: plan.gates.length, ramps: plan.ramps.length, drums: plan.drums.length,
      braziers: braziers.length, cameras: cameras.length,
      standing: cameras.filter((c) => c.stand && c.reachable).length,
    },
  };
}

/** Writes <outDir>/blueprint.json and returns its path. Prints the counts. */
export async function exportBlueprint(outDir) {
  const bp = await makeBlueprint();
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'blueprint.json');
  fs.writeFileSync(file, JSON.stringify(bp));
  const c = bp.counts;
  console.log(`blueprint: ${c.pieces} pieces, ${c.colliders} colliders, ${c.rooms} rooms, ${c.open} open, ` +
    `${c.gates} gates, ${c.ramps} ramps, ${c.drums} drums, ${c.braziers} braziers, ${c.cameras} cameras, ` +
    `${c.standing} standing -> ${file}`);
  return file;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('usage: node tools/castle3d/export-blueprint.mjs <out dir>'); process.exit(2); }
  exportBlueprint(path.resolve(out)).catch((e) => { console.error(e); process.exit(1); });
}
