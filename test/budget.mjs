// budget.mjs — what the castle costs, per ward, read out of src/castle-plan.js.
//
//   node test/budget.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. Every other Node suite asks whether the castle WORKS: does a
// room have a floor, can a station be reached, does a prop stand in a wall.
// Nothing asked what it costs. Rank 6 is about to put ten more bodies in it and
// rank 10 calls its own row "a shared low-poly rig for the fifty", and neither
// spec could say what the ceiling was, because nobody had counted. This counts:
// draw calls, point lights and skinned bodies, per ward, and texture memory for
// the whole castle, against ceilings held as named constants below.
//
// WHY IT IS NOT IN layout.mjs (#529, #611). #529 says layout.mjs is every fact
// derivable from the plan in Node, and by the letter of that this file's
// arithmetic belongs in it. What #529 was actually drawn to fix was "a reader
// cannot tell which of two files to add a line to", and this file answers that
// question rather than blurring it: a fact about whether the castle works goes
// in layout.mjs, a fact about what it costs goes here. The two share no
// assertion. layout.mjs is 1137 lines, and the ceilings below are the one thing
// in this project a content row is expected to come back and renegotiate.
//
// WHY THE DRAW-CALL COUNT IS NOT A GUESS. It would have been very easy to write
// "a drum is 24 sectors, so call it 48 shells" in here and end up with a suite
// agreeing with itself about a number neither half had measured — the exact
// failure #500 took the placement math off layout.mjs to stop, and the one #34
// names outright. So the count calls `buildPiece` from src/castle-builder.js,
// the same function `build()` calls, and counts the meshes it really returns. A
// model piece is not built but loaded, and there one glTF mesh primitive is one
// three.js Mesh is one draw call, so `partsOf` on the file is the count.
//
// WHAT THE NUMBER IS NOT. It is every mesh whose box reaches into a ward, not
// what the GPU submits on a frame: three.js frustum-culls, so standing in a
// corner of the outer ward draws fewer than the outer ward's number, and the
// sun's shadow map re-draws every caster, so a frame submits more. It is a
// budget, not a profile. The profile is `renderer.info` on a real machine and
// it belongs to rank 2's GPU run.
//
// WHAT A WARD IS, HERE. Two rectangles: the curtain's own footprint, cut at the
// cross-wall's centreline. A mesh counts in EVERY ward its box reaches into,
// which is why the two towers standing astride the cross-wall come out split
// and why the ground planes are counted in both — a mesh that spans the
// boundary is drawn whichever side of it you stand on. Anything reaching
// neither rectangle is `outside`: the road, the outside ground, the trees
// (#546), Wykes's yard and Mereford's town (#725).
//
// AN OUTSIDE MESH IS PAID FOR IN BOTH WARDS (#727). It has no ceiling of its
// own because it is not a third place anybody stands: it is what the player
// sees over the curtain, from the North-west Tower's roof in the outer ward
// and over the cross-wall from an inner-ward roof, and three.js draws it from
// either. So the claim is `calls[w] + calls.outside` against the one
// per-ward ceiling, for each ward, with no new constant. What bounds the town
// is then 1200 less the busier ward, and when that fails the first answer is
// still #611's: merge a drum's sectors before deleting a house.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { partsOf, readGLTF } from './gltf.mjs';
import { makePlan, tileToWorld } from '../src/castle-plan.js';
import { buildPiece, carriesOwnWorldPosition } from '../src/castle-builder.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));
const mystery = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mystery.json'), 'utf8'));
const npcs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/npcs.json'), 'utf8'));
const populace = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/populace.json'), 'utf8'));
const { heldPropPath } = await import('../src/populace.js');

let failures = 0;
let textureMB = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);

/* ==================================================== THE CEILINGS ==========
 *
 * EVERY NUMBER IN THIS BLOCK IS A GUESS. Nobody has profiled this castle on a
 * phone, and SPECS.md's open call for this row recommended guessing in one
 * named place with a comment saying so rather than waiting for a device, the
 * way `touch-controls.js` already holds its six (#530). A session that measures
 * on real hardware replaces these and records the measurement with a decision
 * number; a session that merely wants more room has to argue for it in
 * HISTORY.md, which is the point of the file.
 *
 * What each guess is anchored on is written beside it, and where the castle
 * stands against it is printed at the bottom of the run.
 */

/** Meshes whose box reaches into one ward. See WHAT THE NUMBER IS NOT, above. */
const MAX_DRAW_CALLS_PER_WARD = 1200;
/* Anchored on what is there: the outer ward is at 965 and the whole castle is
 * 1539 meshes, of which 970 — 63 % of everything — is the eight tower drums, at
 * about 120 ring sections and caps each. A mid-range phone holding 60 fps with
 * one shadow-casting sun submits each of these about twice. 1200 leaves the
 * outer ward 235, and the first answer when this fails is to merge a drum's
 * sectors into one geometry, not to delete a building: eight towers at 120 each
 * is the biggest single line in the castle and nothing has ever looked at it. */

/** Point lights whose position falls in one ward, and in the whole scene. */
const MAX_POINT_LIGHTS_PER_WARD = 6;
const MAX_POINT_LIGHTS_TOTAL = 8;
/* The per-ward number is what this row was asked for; the total is the one that
 * actually bites, because three.js does not cull lights by ward. Every
 * PointLight in the scene is in every MeshStandardMaterial's uniform block and
 * costs a per-fragment term on every lit pixel in the castle, so a light in the
 * inner ward is paid for while standing in the outer one. Three today. */

/** Skinned bodies standing in one ward at one watch, and in the whole cast. */
const MAX_SKINNED_PER_WARD = 20;
const MAX_SKINNED_TOTAL = 32;
/* Anchored on rank 6 rather than on hardware, because rank 6 is what is about
 * to spend it: twelve cast plus its first ten populace is 22, which fits 32
 * with room left for somebody to be standing in rank 4c's yard. The "7 today"
 * this comment once gave the outer ward was the schedule alone; section 3 has
 * counted the household since #730, and with rank 6's last five (#729) the
 * page builds 32, exactly this ceiling, and the outer ward peaks at 18 of 20.
 * The next body is an argument in HISTORY.md. Rank 10's "the fifty" fits neither number
 * and is not meant to: fifty bodies is fifty AnimationMixers and fifty skinned
 * draw calls, and this is the file that says so out loud. */

/** Every image the page can load, decoded, in megabytes of video memory. */
const MAX_TEXTURE_MB = 64;
/* THE ONE CEILING IN THIS BLOCK THAT WAS MEASURED BEFORE IT WAS GUESSED (#742,
 * #744). #506 read 79.3 MB off `renderer.info.memory` on the live page, and the
 * arithmetic in section 4 over every .ktx2 on disk gave 79.3 MB to the decimal,
 * which is why this count is trusted at all: it is the one number here with a
 * live measurement behind it. Of that 79.3, 44.2 was fifteen 1k Poly Haven
 * material sets on the built stone; #742 replaced them with fifteen 128 px PNGs
 * this repo draws, at 0.085 MB each with their mip chains.
 *
 * 64 is anchored on what is left: the ten prop packs at 35.1, the kit and the
 * hen's atlas at 1.5, the fifteen at 1.3, and room for about three hundred more
 * pixel textures after that — increment 2's forty, a wall and a floor per named
 * room, costs 3.4. It is DELIBERATELY BELOW the 79.3 the castle carried on
 * 2026-09-20, so the swap had to land for this suite to go green: a ceiling a
 * row can meet by doing nothing is not a ceiling. What will hit it first is not
 * a count of textures, it is one more photoscanned prop at 3.3 MB a pack.
 *
 * NOT PER WARD. Every texture in the scene is resident whichever ward the
 * player is in — three.js uploads on first use and keeps it — so unlike draw
 * calls this is one number for the castle. There is no per-ward form of this
 * question to ask. */

/* ============================================== the plan and the two wards === */

const measured = new Map();
const boundsOf = (rel) => {
  if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel)));
  return measured.get(rel);
};
const plan = makePlan(config, boundsOf);

/* The boundary is the cross-wall, read off the plan rather than typed as 0.
 * Named by id, and the suite stops if the ids are not there: a renamed
 * cross-wall should fail loudly rather than quietly move the line between the
 * wards and re-baseline every number below it. */
console.log('the two wards');
const crossPieces = plan.pieces.filter((p) => p.id === 'cross-wall-north' || p.id === 'cross-wall-south');
if (crossPieces.length !== 2) {
  fail(`the cross-wall is the boundary between the wards, and the plan has ${crossPieces.length} of its two runs — budget.mjs cannot say which ward anything is in`);
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
const crossX = crossPieces.reduce((a, p) => a + (p.box.min.x + p.box.max.x) / 2, 0) / crossPieces.length;
const curtain = plan.curtain;
const REGIONS = {
  outer: { x0: curtain.min.x, x1: crossX, z0: curtain.min.z, z1: curtain.max.z },
  inner: { x0: crossX, x1: curtain.max.x, z0: curtain.min.z, z1: curtain.max.z },
};
const WARDS = Object.keys(REGIONS);
pass(`the cross-wall's centreline is x ${crossX}, and the curtain runs x ${curtain.min.x}..${curtain.max.x}, z ${curtain.min.z}..${curtain.max.z}`);

const reaches = (box, r) =>
  Math.min(box.max.x, r.x1) >= Math.max(box.min.x, r.x0) &&
  Math.min(box.max.z, r.z1) >= Math.max(box.min.z, r.z0);
/** Every ward a box reaches into, or ['outside'] if it reaches neither. */
const wardsOf = (box) => {
  const hit = WARDS.filter((w) => reaches(box, REGIONS[w]));
  return hit.length ? hit : ['outside'];
};

/* Every room in the plan declares a ward, and the two rectangles above have to
 * agree with what it declares: a room that says `inner` and lies wholly west of
 * the cross-wall means one of the two is wrong and every count below is
 * bucketed off the wrong line. This is also the rail that catches a room added
 * with no ward at all, which would otherwise be silently invisible to the
 * populace budget. `cross-walk` is the interesting one — the walk over the
 * porter's gate, declared `inner`, reaching both. */
/* `outside` IS THE THIRD ANSWER, from rank 4c. Wykes's yard is a room past the
 * curtain and `wardsOf` has always had a bucket for it; what it had not got was
 * permission to be a room's declared ward. It is not a loosening: `wardsOf`
 * returns `['outside']` exactly when the box reaches neither rectangle, so a
 * yard declaring `outside` and drifting into the outer ward fails on the same
 * line an outer room drifting out of it does. test/layout.mjs check 4c is the
 * other half, and holds the same rooms to being clear of the curtain and
 * reachable by nobody. */
for (const r of plan.rooms) {
  if (r.ward !== 'outer' && r.ward !== 'inner' && r.ward !== 'outside') {
    fail(`room "${r.id}" declares ward ${JSON.stringify(r.ward)}, which is none of "outer", "inner" or "outside"`);
    continue;
  }
  if (!wardsOf(r.bounds).includes(r.ward)) {
    fail(`room "${r.id}" says ward "${r.ward}" but its bounds x ${r.bounds.min.x}..${r.bounds.max.x} do not reach that ward's rectangle`);
  }
}
if (!failures) pass(`all ${plan.rooms.length} rooms declare a ward, and every one of them reaches the ward it declares`);

/* =================================================== 1: draw calls per ward ===
 *
 * One mesh, one draw call. A built piece is built by the builder's own
 * `buildPiece` and its meshes counted; a model piece is one Mesh per glTF mesh
 * primitive, and `partsOf` has them.
 *
 * WHICH BOX A MESH IS BUCKETED BY. A piece the builder adds to the scene with
 * no transform carries its world position inside its own geometry, so each of
 * its meshes has a world box and is bucketed by that — which is how the
 * Stockhouse and Bakehouse drums, standing astride the cross-wall, come out
 * split across the two wards rather than landing whole in one. Everything else
 * is placed by `piece.transform`, which this file does not apply, so all of
 * that piece's meshes are bucketed by the plan's own `piece.box`. That is five
 * pieces — the four gate leaves and the cell's bars — and a gate leaf is 1.9 m
 * wide, so nothing is lost by treating one as a point.
 */
console.log('\ndraw calls per ward');
const material = new THREE.MeshStandardMaterial();
const calls = { outer: 0, inner: 0, outside: 0 };
const perPiece = [];
let meshTotal = 0;
for (const piece of plan.pieces) {
  let boxes;
  if (piece.built) {
    const obj = buildPiece(piece, material, config.repeatMetres);
    if (!obj) {
      fail(`the plan's piece "${piece.id}" says built: ${JSON.stringify(piece.built)} and castle-builder.js's buildPiece has no branch for it — the budget cannot count what it cannot build`);
      continue;
    }
    obj.updateMatrixWorld(true);
    const meshes = [];
    obj.traverse((o) => { if (o.isMesh) meshes.push(o); });
    boxes = carriesOwnWorldPosition(piece)
      ? meshes.map((o) => new THREE.Box3().setFromObject(o))
      : meshes.map(() => piece.box);
  } else {
    boxes = partsOf(path.join(ROOT, piece.model)).parts.map(() => piece.box);
  }
  meshTotal += boxes.length;
  const here = { outer: 0, inner: 0, outside: 0 };
  for (const box of boxes) for (const w of wardsOf(box)) { calls[w]++; here[w]++; }
  perPiece.push({ id: piece.id, kind: piece.kind, meshes: boxes.length, here });
}
for (const w of WARDS) {
  if (calls[w] > MAX_DRAW_CALLS_PER_WARD) {
    // The three biggest pieces in the ward, because a ward over its ceiling is
    // almost never over it by a hundred small things.
    const worst = perPiece.filter((p) => p.here[w] > 0).sort((a, b) => b.here[w] - a.here[w]).slice(0, 3);
    fail(`the ${w} ward draws ${calls[w]} meshes, over the ceiling of ${MAX_DRAW_CALLS_PER_WARD}. Its three biggest: ${worst.map((p) => `${p.id} (${p.here[w]})`).join(', ')}`);
  } else {
    pass(`the ${w} ward draws ${calls[w]} meshes, ${MAX_DRAW_CALLS_PER_WARD - calls[w]} under the ceiling of ${MAX_DRAW_CALLS_PER_WARD}`);
  }
}
pass(`${meshTotal} meshes in the castle, ${calls.outside} of them outside both wards`);
// What is drawn outside both wards is seen from each, so it counts against
// each (#727, and WHAT A WARD IS above). The fail names the outside bucket's
// three biggest pieces, since that is the half of the sum this line adds.
{
  const worstOutside = perPiece.filter((p) => p.here.outside > 0).sort((a, b) => b.here.outside - a.here.outside).slice(0, 3);
  for (const w of WARDS) {
    const sum = calls[w] + calls.outside;
    if (sum > MAX_DRAW_CALLS_PER_WARD) {
      fail(`the ${w} ward's ${calls[w]} meshes and the ${calls.outside} outside both wards come to ${sum}, over the ceiling of ${MAX_DRAW_CALLS_PER_WARD}: what is out there is drawn from inside. The outside bucket's three biggest: ${worstOutside.map((p) => `${p.id} (${p.here.outside})`).join(', ')}`);
    } else {
      pass(`the ${w} ward's ${calls[w]} and the outside's ${calls.outside} come to ${sum}, ${MAX_DRAW_CALLS_PER_WARD - sum} under the ceiling of ${MAX_DRAW_CALLS_PER_WARD}`);
    }
  }
}

/* ================================================== 2: point lights per ward ===
 *
 * THE COUNT IS THE BRAZIERS, AND THAT CLAIM IS CHECKED RATHER THAN COMMENTED.
 * `src/main.js` makes one stand per row of `config.braziers` and `createBrazier`
 * gives each stand exactly one PointLight, so the count is the length of the
 * config's list — as long as nothing else in src/ makes a point light. That
 * clause is the whole risk: rank 11's fire and candles are the obvious next
 * lights, and a light added anywhere else would leave this suite counting three
 * and reporting green while the scene carried nine. So src/ is grepped for the
 * constructor and the grep has to find exactly the one call in scene-setup.js.
 * A second call is not a bug — it is a signal that this file has to learn where
 * the new lights are before it can keep claiming a number.
 *
 * The sun and the hemisphere are not counted: one directional and one
 * hemisphere light, both global, both in the shader for every material already,
 * and neither scaling with content, which is what a budget is about.
 */
console.log('\npoint lights');
{
  const made = [];
  for (const file of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(ROOT, 'src', file), 'utf8');
    const n = (text.match(/new THREE\.PointLight\(/g) || []).length;
    if (n) made.push(`${file} x${n}`);
  }
  if (made.length === 1 && made[0] === 'scene-setup.js x1') {
    pass('exactly one `new THREE.PointLight` in src/, in scene-setup.js, so a brazier row is a point light');
  } else {
    fail(`src/ makes point lights in ${made.length ? made.join(', ') : 'nowhere at all'} — this file counts data/scene-config.json's braziers, and one per brazier is no longer the whole story. Teach it the new lights before trusting the numbers below.`);
  }

  const lights = { outer: 0, inner: 0, outside: 0 };
  for (const b of config.braziers) {
    const [x, , z] = tileToWorld(plan.tile, b.tile[0], b.tile[1]);
    const point = { min: { x, z }, max: { x, z } };
    for (const w of wardsOf(point)) lights[w]++;
  }
  for (const w of WARDS) {
    if (lights[w] > MAX_POINT_LIGHTS_PER_WARD) fail(`the ${w} ward has ${lights[w]} point lights, over the ceiling of ${MAX_POINT_LIGHTS_PER_WARD}`);
    else pass(`the ${w} ward has ${lights[w]} point lights, ceiling ${MAX_POINT_LIGHTS_PER_WARD}`);
  }
  const total = config.braziers.length;
  if (total > MAX_POINT_LIGHTS_TOTAL) fail(`${total} point lights in the scene, over the ceiling of ${MAX_POINT_LIGHTS_TOTAL} — and a light is paid for in both wards whichever one it stands in`);
  else pass(`${total} point lights in the scene, ceiling ${MAX_POINT_LIGHTS_TOTAL}`);
}

/* ================================================ 3: skinned bodies per ward ===
 *
 * TWO LISTS, BECAUSE THE PAGE BUILDS TWO (#730). The twelve are one body per
 * person on mystery.json's schedule at the watch it names, in the ward of the
 * room the station is in; a person with no station at a watch is not
 * standing anywhere then (the merchant is only at the castle at Terce). The
 * household is data/populace.json, and until #730 this section never read
 * it: it printed 12 bodies in the castle while src/main.js built 27.
 *
 * A POPULACE BODY COUNTS IN EVERY WARD ANY STOP OF ITS RING IS IN, at that
 * watch, by mystery.json's `rooms`. A ring is walked round for the whole
 * watch, so its mixer is paid for wherever the body can be when the player
 * is standing there, which is #608's reaching rule applied to a body: the
 * baker's lad at Terce hauls from the outer ward to the bakehouse and back,
 * and is counted in both. A body with `follow` counts in both wards at every
 * watch it has a ring, because the hound leaves its ring for the player and
 * the porter gate does not stop it.
 *
 * THE TOTAL IS EVERY BODY src/main.js BUILDS: all of npcs.json's `cast`, the
 * inspector included because he is built on day one and hidden, and all of
 * data/populace.json's `people`. src/npc.js's `update` runs every mixer each
 * frame before anything reads `visible`, so a hidden body is paid for too.
 *
 * Every one of these is a skinned mesh off one of the Quaternius bodies
 * (#419, the woman's at #603, the hound's and the hen's at #644 and #684)
 * with an AnimationMixer of its own, which is the cost that does not come off
 * the plan and does not frustum-cull away: three.js updates a skeleton
 * whether or not the mesh is on screen.
 */
console.log('\nskinned bodies per ward, at each watch, the cast and the household');
{
  const wardOfRoom = new Map(mystery.rooms.map((r) => [r.id, r.ward]));
  const peak = { outer: 0, inner: 0 };
  const peakAt = { outer: null, inner: null };
  const wardsAt = new Map(); // "person/watch" -> Set of wards, for the named case
  for (const watch of mystery.watches) {
    const cast = { outer: 0, inner: 0 };
    const folk = { outer: 0, inner: 0 };
    for (const [who, schedule] of Object.entries(mystery.schedule)) {
      const station = schedule[watch];
      if (!station) continue;
      const ward = wardOfRoom.get(station.room);
      if (ward !== 'outer' && ward !== 'inner') {
        fail(`${who} stands in "${station.room}" at ${watch} and mystery.json gives that room ward ${JSON.stringify(ward)} — the body cannot be budgeted`);
        continue;
      }
      cast[ward]++;
    }
    for (const p of populace.people) {
      const ring = p.routine?.[watch] ?? [];
      if (!ring.length) continue;
      const wards = new Set();
      for (const stop of ring) {
        const ward = wardOfRoom.get(stop.room);
        if (ward !== 'outer' && ward !== 'inner') {
          fail(`${p.id} has a stop in "${stop.room}" at ${watch} and mystery.json gives that room ward ${JSON.stringify(ward)} — the body cannot be budgeted`);
          continue;
        }
        wards.add(ward);
      }
      if (p.follow) for (const w of WARDS) wards.add(w);
      wardsAt.set(`${p.id}/${watch}`, wards);
      for (const w of wards) folk[w]++;
    }
    const here = { outer: cast.outer + folk.outer, inner: cast.inner + folk.inner };
    for (const w of WARDS) if (here[w] > peak[w]) { peak[w] = here[w]; peakAt[w] = watch; }
    console.log(`        ${watch}: ${WARDS.map((w) => `${w} ${here[w]} (${cast[w]} + ${folk[w]})`).join(', ')}`);
  }
  /* THE NAMED CASE, the way `cross-walk` is #608's: a ring that crosses the
   * porter gate is counted on both sides of it. Count only a ring's first
   * stop and the baker's lad at Terce is outer-ward only, and this line says
   * so before any total moves. */
  const lad = wardsAt.get('baker-lad/terce');
  if (!lad) fail('the baker\'s lad has no ring at Terce, so the named case for a ring across two wards names nobody');
  else if (lad.has('outer') && lad.has('inner')) pass('the baker\'s lad at Terce, hauling from the outer ward to the bakehouse, is counted in both wards');
  else fail(`the baker's lad at Terce hauls from the outer ward to the bakehouse and is counted in ${[...lad].join(' and ')} only`);
  for (const w of WARDS) {
    if (peak[w] > MAX_SKINNED_PER_WARD) fail(`the ${w} ward holds ${peak[w]} skinned bodies at ${peakAt[w]}, over the ceiling of ${MAX_SKINNED_PER_WARD}`);
    else pass(`the ${w} ward peaks at ${peak[w]} skinned bodies (${peakAt[w]}), ${MAX_SKINNED_PER_WARD - peak[w]} under the ceiling of ${MAX_SKINNED_PER_WARD}`);
  }
  const built = npcs.cast.length + populace.people.length;
  if (built > MAX_SKINNED_TOTAL) fail(`${built} bodies built, over the ceiling of ${MAX_SKINNED_TOTAL} (${npcs.cast.length} cast and ${populace.people.length} household)`);
  else pass(`${built} bodies built, ${npcs.cast.length} cast and ${populace.people.length} household, ${MAX_SKINNED_TOTAL - built} under the ceiling of ${MAX_SKINNED_TOTAL}`);
}

/* ================================================= 4: texture memory =========
 *
 * WHAT IT COUNTS. Every image any file the page loads names: the ten Poly Haven
 * prop packs' three maps each, the Kenney kit's ten 64 px PNGs, the hen's atlas
 * (#684), and the fifteen 128 px PNGs the built stone wears (#742). Deduplicated
 * by path, because src/assets.js deduplicates by URL — eight tinted drums over
 * one map is one texture on the GPU, not eight (#516) — and because the kit's
 * 106 GLBs name the same ten images over and over.
 *
 * HOW IT COUNTS, AND WHY THE ARITHMETIC IS NOT A GUESS. A KTX2 header carries
 * `pixelWidth`, `pixelHeight`, `levelCount` and `supercompressionScheme`, and
 * this repo's encoder pairs scheme 1 with ETC1S and scheme 2 with UASTC (#507),
 * which are 0.5 and 1 byte a pixel on the GPU. So a texture is the sum over its
 * mip levels of width times height at its own rate. A PNG is decoded to RGBA8,
 * 4 bytes a pixel, and three builds its mip chain at upload, which is the
 * familiar 4/3. Over every .ktx2 on disk on 2026-09-20 that came to 79.3 MB,
 * and 79.3 MB is what #506 measured off `renderer.info.memory` on the live
 * page. THAT AGREEMENT IS THE CALIBRATION: it is what says this section counts
 * something real rather than agreeing with itself (#34). Re-check it against
 * `renderer.info` on the next GPU sitting and write the pair down.
 *
 * WHAT IT IS NOT. Render targets — the sun's shadow map is a depth texture and
 * costs megabytes on its own — and anything three allocates internally. It is
 * the content's bill, which is the half a content row can move.
 */
console.log('\ntexture memory, from the image headers');
{
  const images = new Map(); // repo-relative path or glb#i -> { bytes, why, what }

  /** A KTX2 header: a 12-byte identifier, then 4-byte little-endian fields. */
  const fromKTX2 = (buf) => {
    const w = buf.readUInt32LE(20), h = buf.readUInt32LE(24);
    const levels = Math.max(1, buf.readUInt32LE(40));
    const scheme = buf.readUInt32LE(44);
    // 1 is basis-lz/ETC1S and 2 is zstd, which this encoder only ever writes
    // over UASTC (#507). Anything else is a format nobody here produces, and
    // the honest answer is to refuse to price it rather than to pick a number.
    if (scheme !== 1 && scheme !== 2) return null;
    const perPixel = scheme === 1 ? 0.5 : 1;
    let bytes = 0;
    for (let i = 0; i < levels; i++) bytes += Math.max(1, w >> i) * Math.max(1, h >> i) * perPixel;
    return { bytes, what: `${w}x${h} ${scheme === 1 ? 'ETC1S' : 'UASTC'}, ${levels} levels` };
  };
  /** A PNG IHDR, plus the mip chain three builds for it: RGBA8 times 4/3. */
  const fromPNG = (buf) => {
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    return { bytes: w * h * 4 * 4 / 3, what: `${w}x${h} RGBA8 + mips` };
  };
  const measure = (buf) => {
    if (buf.length > 48 && buf[0] === 0xab && buf[1] === 0x4b && buf[2] === 0x54) return fromKTX2(buf);
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return fromPNG(buf);
    return null;
  };
  const add = (key, buf, why) => {
    if (images.has(key)) return;
    const m = measure(buf);
    if (!m) { fail(`${key} (${why}) is neither a KTX2 this encoder wrote nor a PNG — the texture bill cannot price it, so the total below is not the whole bill`); return; }
    images.set(key, { ...m, why });
  };

  /* EVERY FILE THE PAGE LOADS, not every file on disk. The kit is 106 GLBs and
   * src/castle-plan.js places fourteen of them; test/assets.mjs check 4 is what
   * holds the rest to being a vendored kit rather than dead weight, and a budget
   * that priced all 106 would be pricing a download. */
  const loaded = [
    [config.kenneyBase + config.battlements.model, 'the battlements'],
    ...(config.stairs ? [[config.kenneyBase + config.stairs.model, 'the tower stairs']] : []),
    ...config.gates.map((g) => [config.kenneyBase + g.archModel, `${g.id}'s archway`]),
    ...config.courtyard.placements.map((p) => [config.kenneyBase + p.model, p.id || p.model]),
    ...config.interiorProps.map((p) => [config.polyhavenBase + p.model, p.model.split('/')[0]]),
    ...npcs.cast.map((n) => [n.modelPath, `${n.id || n.name}'s body`]),
    ...npcs.cast.filter((n) => n.heldProp).map((n) => [config.polyhavenBase + n.heldProp, `${n.id || n.name}'s heldProp`]),
    ...(populace.people ?? []).map((p) => [p.modelPath, `${p.id || p.name}'s body`]),
    ...(populace.people ?? []).filter((p) => p.heldProp).map((p) => [heldPropPath(config.polyhavenBase, p.heldProp), `${p.id || p.name}'s heldProp`]),
  ];
  const seenFiles = new Set();
  for (const [rel, why] of loaded) {
    if (seenFiles.has(rel)) continue;
    seenFiles.add(rel);
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue; // test/assets.mjs check 1 is what says so
    const { json, buffers } = readGLTF(abs);
    const dir = path.posix.dirname(rel);
    for (const [i, img] of (json.images || []).entries()) {
      if (img.uri) {
        const key = path.posix.join(dir, decodeURIComponent(img.uri));
        if (images.has(key) || !fs.existsSync(path.join(ROOT, key))) continue;
        add(key, fs.readFileSync(path.join(ROOT, key)), why);
      } else {
        // Embedded in the GLB's own BIN chunk, which is the kit and the hen.
        const bv = json.bufferViews[img.bufferView];
        const buf = buffers[bv.buffer];
        if (!buf) continue;
        const from = bv.byteOffset || 0;
        add(`${rel}#${i}`, buf.subarray(from, from + bv.byteLength), why);
      }
    }
  }
  /* EVERY PATH IN A MATERIAL ROW, not just `map`. src/assets.js reads `map` and
   * nothing else, so by the letter only `map` is loaded — but this is the count
   * that has to refuse "supplement" (#742, open call 1). A row that kept its old
   * 1k normal and arm beside its new PNG would be 3 MB of video memory for no
   * variety, and pricing only `map` would let fifteen of those through green
   * while test/assets.mjs alone objected. So every slot in the row is priced,
   * and the two suites refuse a supplement for their own reasons. */
  for (const [name, spec] of Object.entries(config.pixelMaterials || {})) {
    for (const [slot, rel] of Object.entries(spec)) {
      if (typeof rel !== 'string' || !rel.includes('/')) continue;
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) continue;
      add(rel, fs.readFileSync(abs), `${name}'s ${slot}`);
    }
  }

  let bytes = 0;
  for (const v of images.values()) bytes += v.bytes;
  const mb = bytes / 1048576;
  const biggest = [...images].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 3);
  if (mb > MAX_TEXTURE_MB) {
    fail(`${images.size} textures come to ${mb.toFixed(1)} MB of video memory, over the ceiling of ${MAX_TEXTURE_MB}. The three biggest: ${biggest.map(([k, v]) => `${k} (${(v.bytes / 1048576).toFixed(2)} MB, ${v.what})`).join(', ')}`);
  } else {
    pass(`${images.size} textures come to ${mb.toFixed(1)} MB of video memory, ${(MAX_TEXTURE_MB - mb).toFixed(1)} under the ceiling of ${MAX_TEXTURE_MB}`);
  }
  const pixel = [...images].filter(([k]) => k.startsWith('assets/pixel/'));
  const pixelMB = pixel.reduce((a, [, v]) => a + v.bytes, 0) / 1048576;
  pass(`${pixel.length} of them are the stone this repo drew, at ${pixelMB.toFixed(2)} MB in total (#742); the biggest single image is ${biggest[0][0]} at ${(biggest[0][1].bytes / 1048576).toFixed(2)} MB`);
  textureMB = mb;
}

/* -------------------------------------------------------------- the sheet --- */
console.log('\nwhere the castle stands, against ceilings that are guesses:');
for (const w of WARDS) console.log(`  ${w.padEnd(7)} ${String(calls[w]).padStart(5)} / ${MAX_DRAW_CALLS_PER_WARD} draw calls`);
console.log(`  ${'outside'.padEnd(7)} ${String(calls.outside).padStart(5)}   counted in each ward (#727): ${WARDS.map((w) => `${w} ${calls[w] + calls.outside} / ${MAX_DRAW_CALLS_PER_WARD}`).join(', ')}`);
console.log(`  ${'texture'.padEnd(7)} ${textureMB.toFixed(1).padStart(5)} / ${MAX_TEXTURE_MB} MB of video memory, the whole castle`);

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
