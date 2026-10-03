// assets.mjs — what data/scene-config.json and data/npcs.json point at, checked
// against the files on disk, and what is on disk checked back against them.
// Node only, no browser: everything here is glTF parsing and geometry.
//
//   node test/assets.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. The config used to name `wooden_gate_1k.gltf` as the gate
// door's model. It is not a gate. Poly Haven ship a material-preview ball with
// every TEXTURE pack — one node named `sphere_gltf`, one mesh named
// `Sphere.001` — and wooden_gate is a texture pack, so the archway held a
// 1.93-unit sphere, auto-scaled to 3.6 m across, grounded, hinged, and swung
// 105 degrees when the quest completed. Nothing caught it because a preview
// sphere loads perfectly: no 404, no console error, no placeholder box. The
// only signal is the shape of what it hands back.
//
// Twenty of the forty-eight Poly Haven folders this project vendored carried
// that ball, at 2.3 MB of .bin each, and thirty-six of the forty-eight were
// referenced by nothing at all. They are gone (2026-09-14): 165 MB of assets
// against 1,525 lines of code is now 29 MB, and check 4 below is what stops it
// growing back.
//
// Four checks:
//   1. every `model` in either data file resolves to a file that exists
//   2. no `model` resolves to a Poly Haven preview ball
//   3. every gate leaf's built dimensions match the archway's own opening,
//      measured out of wall-fortified-gate.glb rather than restated from the
//      config — the point is to catch the two drifting apart — and every pixel
//      material is one 128 px map, at most 32 colours, wrapping at both edges
//      and pixel-identical to the row tools/pixel/ draws it from (#742, #743)
//   4. every byte under assets/poly-haven, assets/NPCs, assets/pixel,
//      assets/props and assets/blender is
//      reachable from one of those references, and everything a reference needs
//      is there
//   5. every prop and body is meshopt-encoded (#506)
//   7. the five activity clips tools/bodies/ writes into the four human bodies
//      are there, loop, move and are byte-equal to their render (#787, #788),
//      and the cow it builds from nothing is inside #789's four caps, skinned
//      soundly, loops, reads as four-legged and is byte-equal to its render
//   8. every file under assets/blender is its tools/blender/manifest.json row
//      byte for byte, rendered by Blender 5.2 from inputs that have not moved
//      since, inside its pack's caps, in the castle's palette, and made from
//      no input file (#803, #806, #808)
//   9. Devon's props under assets/props are meshopt with one material and one
//      PNG atlas of 128 px or under (#831)
//
// Everything it reads is compressed as of 2026-09-15 (#506 to #508): KTX2/Basis
// textures and EXT_meshopt_compression geometry. `triangles()` decodes meshopt
// now (test/gltf.mjs) and `partsOf` dequantises, so the two measurements below
// are unchanged in kind. Nothing here decodes a KTX2 — what is asserted about a
// prop's textures is their paths.
//
// THE FIFTEEN 128 px PNGs ARE THE EXCEPTION, and they are decoded (#742). They
// are exempt from the encoder by size (#508), they are the only images in this
// project that a program in this project drew, and check 3b holds each one to
// its row's own output byte for byte — which is a claim about pixels and cannot
// be made about a path. sharp does the decoding; it is already a devDependency,
// because tools/encode-assets.mjs uses it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { readGLTF, triangles } from './gltf.mjs';
import { heldPropPath } from '../src/populace.js';
import { propPath } from '../src/castle-plan.js';
import { rows as pixelRows, render as renderPixel, SIZE as GENERATOR_PX, OUT_DIR as PIXEL_DIR } from '../tools/pixel/index.mjs';
import { renderBody, renderAnimal, animals as animalRows } from '../tools/bodies/index.mjs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));
const npcData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/npcs.json'), 'utf8'));
// The household (BACKLOG.md rank 6). A fourth file that names a body.
const populace = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/populace.json'), 'utf8'));

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* ==================================== what a texture this repo draws is =====
 * #742's two numbers, held here and not in the generator, because a rail that
 * reads its own subject's constant is the check that re-implements the thing it
 * checks (#34). tools/pixel/index.mjs changing SIZE to 256 has to fail here.
 *
 * 128 px: `tuneTexture` magnifies NEAREST at 128 and under, which is the branch
 * the Kenney kit already takes, and 128 over the 3 m world repeat (#434) is 43
 * texels a metre. It is also what keeps the textures out of the encoder by
 * size (#508, as #742 restates it): this is the rail that exemption rests on.
 *
 * 32 colours: what tells a drawn texture from a photograph in Node. A 1k jpg
 * of stone has tens of thousands; the fifteen rows have six to nine. A row that
 * needs more argues for it in HISTORY.md.
 */
const PIXEL_PX = 128;
const PIXEL_MAX_COLOURS = 32;
/* The seam rule. A tile drawn on a torus joins its own last column to its first
 * the way it joins any two adjacent columns, so the difference across that pair
 * should be unremarkable: at most 1.5 times the MEDIAN difference between
 * adjacent interior columns. The median rather than the mean because a coursed
 * stone's mortar lines are a handful of very loud adjacencies and a mean would
 * hide a real seam behind them. */
const SEAM_RATIO = 1.5;

/* -------------------------------------------------- 1 & 2: model references ---
 * A Poly Haven preview ball is recognised by its node name, which is
 * `sphere_gltf` in every one of them, and confirmed by its bounds: a ball is
 * within a percent of the same size on all three axes and centred on its own
 * origin. Both, so that a real model that happens to be round-ish and a real
 * model that happens to be named oddly are each safe.
 */
function isPreviewBall(file) {
  const { json, verts } = triangles(file);
  const names = (json.nodes || []).map(n => n.name);
  if (!(names.length === 1 && names[0] === 'sphere_gltf')) return false;
  const lo = [0, 1, 2].map(i => Math.min(...verts.map(v => v[i])));
  const hi = [0, 1, 2].map(i => Math.max(...verts.map(v => v[i])));
  const size = [0, 1, 2].map(i => hi[i] - lo[i]);
  const cubic = Math.max(...size) / Math.min(...size) < 1.02;
  const centred = [0, 1, 2].every(i => Math.abs(lo[i] + hi[i]) < 0.02 * size[i]);
  return cubic && centred;
}

console.log('model references in data/');
// npcs.json is in here because it is the other file that names a Poly Haven
// model, and until 2026-09-14 nothing checked it: the King's `heldProp` is
// ornate_medieval_mace_1k, and a preview ball in that slot is the same #374 bug
// in a hand rather than an archway.
const refs = [
  [config.kenneyBase + config.battlements.model, 'the battlements'],
  ...(config.stairs ? [[config.kenneyBase + config.stairs.model, 'the tower stairs']] : []),
  ...config.gates.map(g => [config.kenneyBase + g.archModel, `${g.id}'s archway`]),
  ...config.courtyard.placements.map(p => [config.kenneyBase + p.model, p.id || p.model]),
  ...config.interiorProps.map(p => [propPath(config.polyhavenBase, p.model), p.model]),
  ...npcData.cast.map(n => [n.modelPath, `${n.id || n.name}'s body`]),
  ...npcData.cast.filter(n => n.heldProp).map(n => [config.polyhavenBase + n.heldProp, `${n.id || n.name}'s heldProp`]),
  /* AND THE TEN OF THE HOUSEHOLD. They wear bodies the cast already names, so
   * this line adds nothing to the set today and catches the day one of them
   * stops doing so — a typo in a populace modelPath is a body that never
   * loads, and `build()` rejects on it inside a Promise.all in main.js, which
   * is a loading screen that stops with no castle behind it. */
  ...(populace.people ?? []).map(p => [p.modelPath, `${p.id || p.name}'s body`]),
  // And what they carry (#685): the garrison's spear is the first held prop
  // the cast does not, and the first that is not Poly Haven's.
  ...(populace.people ?? []).filter(p => p.heldProp).map(p => [heldPropPath(config.polyhavenBase, p.heldProp), `${p.id || p.name}'s heldProp`]),
];
const seen = new Set();
for (const [rel, label] of refs) {
  if (seen.has(rel)) continue;
  seen.add(rel);
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { fail(`${label}: no such file — ${rel}`); continue; }
  if (isPreviewBall(file)) fail(`${label}: ${rel} is a Poly Haven material-preview ball, not a model`);
}
if (!failures) pass(`${seen.size} model references, all present, none a preview ball`);

/* ------------------------------------------------- 3: the gate leaf's fit ---
 * The archway is wall-fortified-gate.glb, which src/castle-plan.js scales by
 * tileSize / its own depth like every other kit piece (`scaleFor`, rule
 * 'depth'; it was `castle-builder.js`'s `normalizeToTile` until 2026-09-14).
 * That factor is worked out again below rather than read off the plan, and it
 * is the one duplication in this project that does not matter: both sides of
 * every comparison here are the same model scaled by the same number, so a
 * wrong factor cancels out. Where the piece ENDS UP is layout.mjs's and
 * plan-vs-scene.mjs's question, and both read the plan. The opening is measured
 * by projecting the piece's front and back faces onto XY and finding the hole:
 * the tunnel's own walls run parallel to that projection and contribute no area
 * to it, so what is left uncovered is the doorway and nothing else.
 */
function openingOf(file, scale) {
  const { verts, tris } = triangles(file);
  const facing = tris.filter(t => {
    const [a, b, c] = t.map(i => verts[i]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    return Math.abs(n[2] / len) > 0.7;
  });
  const covered = (px, py) => facing.some(t => {
    const [a, b, c] = t.map(i => verts[i]);
    const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
    const d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]);
    const d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);
    return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0)));
  });
  const lo = [0, 1].map(i => Math.min(...verts.map(v => v[i])));
  const hi = [0, 1].map(i => Math.max(...verts.map(v => v[i])));
  const N = 200;
  const rows = [];
  for (let j = 0; j < N; j++) {
    const y = lo[1] + (j + 0.5) * (hi[1] - lo[1]) / N;
    let left = null, right = null;
    for (let i = 0; i < N; i++) {
      const x = lo[0] + (i + 0.5) * (hi[0] - lo[0]) / N;
      if (covered(x, y)) continue;
      if (left === null) left = x;
      right = x;
    }
    if (left !== null) rows.push({ y, left, right });
  }
  if (!rows.length) return null;
  const step = (hi[0] - lo[0]) / N / 2; // the sample sits mid-cell
  return {
    width: (Math.max(...rows.map(r => r.right)) - Math.min(...rows.map(r => r.left)) + 2 * step) * scale,
    apex: (rows[rows.length - 1].y + (hi[1] - lo[1]) / N / 2) * scale,
    // the highest row still at full width — where the semicircular head springs
    springline: rows.filter(r => r.right - r.left >= (Math.max(...rows.map(x => x.right - x.left)) - 2 * step))
      .map(r => r.y).pop() * scale,
  };
}

console.log('\nevery gate leaf against the archway it hangs in');
// PER GATE NOW, not once. Phase 3 put three of these in the castle — the west
// gate the clerk came in through, the east gate onto the garden, and the
// porter's gate through the cross-wall — and they are the same archway model at
// the same scale with the same leaf numbers. Checking one of three and calling
// it the gate is how a config grows a second copy that nobody measured.
for (const gate of config.gates) {
  const file = path.join(ROOT, config.kenneyBase + gate.archModel);
  if (!fs.existsSync(file)) { fail(`${gate.id}: no archway model at ${gate.archModel}`); continue; }
  const { verts } = triangles(file);
  const depth = Math.max(...verts.map(v => v[2])) - Math.min(...verts.map(v => v[2]));
  const scale = config.tileSize / depth; // castle-plan.js's scaleFor, rule 'depth'
  const open = openingOf(file, scale);
  const leaf = gate.leaf;
  // A solid piece has no hole to measure, and everything below would read as a
  // TypeError rather than as the answer, which is that there is no doorway.
  if (!open) { fail(`${gate.id}: ${gate.archModel} has no opening in it — nothing for a gate to fill`); continue; }

  // 0.11 m of tolerance: the head is a faceted circle, so a row's measured
  // width lands just inside the true one, and the sample grid is 0.02 m.
  const TOL = 0.11;
  const apex = leaf.springline + leaf.archRadius;
  for (const [what, built, measured, why] of [
    ['width', leaf.width, open.width, 'clears the jamb'],
    ['springline', leaf.springline, open.springline, 'meets the arch where it springs'],
    ['apex', apex, open.apex, 'reaches the crown'],
  ]) {
    if (built > measured) fail(`${gate.id}: leaf ${what} ${built} m is wider than the opening's ${measured.toFixed(3)} m — it would clip the stone`);
    else if (!near(built, measured, TOL)) fail(`${gate.id}: leaf ${what} ${built} m leaves a ${(measured - built).toFixed(3)} m gap in a ${measured.toFixed(3)} m opening — it no longer ${why}`);
    else pass(`${gate.id}: leaf ${what} ${built} m in a ${measured.toFixed(3)} m opening`);
  }

  // The head is drawn as an arc of archRadius springing at springline, so a leaf
  // whose half-width and radius disagree gets a straight step in its outline.
  if (!near(leaf.width / 2, leaf.archRadius, 1e-9))
    fail(`${gate.id}: leaf half-width ${leaf.width / 2} and archRadius ${leaf.archRadius} disagree — the head would step in or out at the springline`);

  // How far the leaf can swing before it stops being an opened gate and starts
  // being a plank in a wall. Hinged at half its own width off centre, at angle θ
  // its furthest point sits `width·cos θ + (thickness/2)·sin θ` in x from the
  // hinge, and the jamb is at half the opening's width from the centre. This one
  // binds on every gate, open or shut: the west gate and the porter's gate are
  // PLACED at `openDegrees`, so an angle the opening cannot take is not a future
  // animation there, it is where the leaf is standing right now.
  const swing = (gate.openDegrees || 0) * Math.PI / 180;
  const reach = leaf.width / 2
    + leaf.width * Math.abs(Math.cos(swing))
    + (leaf.thickness / 2) * Math.abs(Math.sin(swing));
  const jamb = open.width / 2;
  if (gate.openDegrees < 80)
    fail(`${gate.id} opens to ${gate.openDegrees} degrees — still across the doorway`);
  else if (reach > jamb + leaf.thickness)
    fail(`${gate.id}: opened to ${gate.openDegrees} degrees the leaf reaches ${reach.toFixed(2)} m from centre, ${(reach - jamb).toFixed(2)} m into a jamb at ${jamb.toFixed(2)} m`);
  else pass(`${gate.id}: opened to ${gate.openDegrees} degrees the leaf stands at ${reach.toFixed(2)} m against a jamb at ${jamb.toFixed(2)} m`);

  if (gate.model) fail(`${gate.id} still carries a \`model\` — the leaf is built from \`leaf\` and \`material\` now`);
  if (!config.pixelMaterials[gate.material]) fail(`${gate.id} names material "${gate.material}", which config.pixelMaterials does not define`);
}

/* ------------------------- 3b: every pixel material is one map we drew ---
 * WHAT THIS REPLACED. Until 2026-09-21 this check read "every material is a
 * complete set": a diffuse, a normal, and exactly one of `arm` and `rough`,
 * over fifteen Poly Haven packs. #742 replaced the fifteen with fifteen 128 px
 * PNGs this repo draws, one map each, so there is no set left to be complete
 * and the old rail retired with the section it asserted over.
 *
 * WHAT IT ASSERTS NOW. Six things per entry, and the last is the one that makes
 * the other five worth having:
 *
 *   1. one `map` and nothing else but an optional `roughness`. A normal beside
 *      it means somebody re-introduced a PBR set one slot at a time.
 *   2. a .png under assets/pixel/, which is where the generator writes and
 *      where check 4 sweeps. A map under assets/poly-haven/ is the swap being
 *      quietly undone.
 *   3. 128 x 128, read off the IHDR rather than off a decoder, because this is
 *      the rail the encoder exemption rests on (#508, #742).
 *   4. at most 32 colours, which is what tells a drawing from a photograph.
 *   5. it wraps at both edges, by SEAM_RATIO above.
 *   6. IT IS PIXEL-IDENTICAL TO WHAT tools/pixel/index.mjs DRAWS FOR ITS ROW.
 *      That is #743 as a check rather than a sentence: the provenance of every
 *      byte under assets/pixel/ is a program in this repo, and a texture from
 *      an image model, from a texture site, or from an edit in a paint program
 *      fails here by construction. It is also what says a PNG is STALE — a row
 *      whose seed or palette moved without a re-render is this line, naming the
 *      row.
 */
console.log('\nevery pixel material is one 128 px map this repo drew');
{
  if (GENERATOR_PX !== PIXEL_PX)
    fail(`tools/pixel/index.mjs draws at ${GENERATOR_PX} px and this suite holds the castle's textures to ${PIXEL_PX} — one of the two moved without the other, and the encoder exemption (#508) rests on the size`);

  const table = new Map(pixelRows().map((r) => [r.name, r]));
  const named = new Set();

  /** Mean absolute difference between two equal-length pixel runs, per channel. */
  const mad = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    return sum / a.length;
  };
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  /** The seam against the interior, down both edges. RGB only: alpha is 255. */
  const seams = (data, w, h) => {
    const col = (x) => { const o = []; for (let y = 0; y < h; y++) for (let c = 0; c < 3; c++) o.push(data[(y * w + x) * 4 + c]); return o; };
    const row = (y) => { const o = []; for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) o.push(data[(y * w + x) * 4 + c]); return o; };
    const cols = []; for (let x = 0; x < w - 1; x++) cols.push(mad(col(x), col(x + 1)));
    const rowsd = []; for (let y = 0; y < h - 1; y++) rowsd.push(mad(row(y), row(y + 1)));
    return {
      col: mad(col(w - 1), col(0)), colMid: median(cols),
      row: mad(row(h - 1), row(0)), rowMid: median(rowsd),
    };
  };

  for (const [name, spec] of Object.entries(config.pixelMaterials)) {
    const extra = Object.keys(spec).filter((k) => k !== 'map' && k !== 'roughness');
    if (extra.length)
      fail(`pixel material "${name}" declares ${extra.map((k) => `\`${k}\``).join(' and ')} beside its \`map\` — a pixel material is one map, lit and diffuse only (#742, open call 2), and src/assets.js reads nothing else`);
    const rel = spec.map;
    if (!rel) { fail(`pixel material "${name}" has no \`map\``); continue; }
    if (!rel.startsWith(`${PIXEL_DIR}/`) || !rel.endsWith('.png'))
      fail(`pixel material "${name}"'s map is ${rel} — a pixel material's map is a .png under ${PIXEL_DIR}/, which is what tools/pixel/ writes and what check 4 sweeps`);
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) { fail(`pixel material "${name}" names ${rel}, which is not there — run \`npm run pixel:render\``); continue; }

    // 128 x 128 by the IHDR: the first chunk of a PNG, 13 bytes at offset 16.
    const head = fs.readFileSync(file);
    const isPNG = head.length > 24 && head.readUInt32BE(0) === 0x89504e47 && head.subarray(12, 16).toString('latin1') === 'IHDR';
    if (!isPNG) {
      fail(`${rel} has no PNG IHDR — it opens 0x${head.subarray(0, 4).toString('hex')}, and a pixel texture is a PNG (#742, open call 6)`);
    } else {
      const w = head.readUInt32BE(16), h = head.readUInt32BE(20);
      if (w !== PIXEL_PX || h !== PIXEL_PX)
        fail(`${rel} is ${w} x ${h} by its IHDR, not ${PIXEL_PX} x ${PIXEL_PX} — the size is what keeps it out of tools/encode-assets.mjs (#508) and what keeps tuneTexture on its NEAREST branch`);
    }

    /* DECODED, NOT JUST READ. The rails below are about pixels, and a file this
     * cannot decode is one the page cannot use either: a KTX2 named here — the
     * swap being quietly undone one slot at a time — throws in sharp rather
     * than returning anything, and an uncaught throw would take the rest of
     * this suite with it and report a crash instead of a name. */
    let data, info;
    try {
      ({ data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
    } catch (err) {
      fail(`${rel} cannot be decoded as an image at all (${err.message}) — a pixel material's map is a PNG this repo drew, and nothing in Node can read what is at that path`);
      continue;
    }

    const colours = new Set();
    for (let i = 0; i < data.length; i += 4) colours.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    if (colours.size > PIXEL_MAX_COLOURS)
      fail(`${rel} holds ${colours.size} colours, over ${PIXEL_MAX_COLOURS} — that is a photograph, not a drawing (#742, open call 5)`);

    const s2 = seams(data, info.width, info.height);
    if (s2.col > SEAM_RATIO * s2.colMid)
      fail(`${rel} does not wrap left to right: its last column differs from its first by ${s2.col.toFixed(2)} against a median interior column step of ${s2.colMid.toFixed(2)}, over ${SEAM_RATIO} times it. Every coordinate in tools/pixel/ is taken modulo ${PIXEL_PX}, so a seam here means something was drawn off the torus`);
    if (s2.row > SEAM_RATIO * s2.rowMid)
      fail(`${rel} does not wrap top to bottom: its last row differs from its first by ${s2.row.toFixed(2)} against a median interior row step of ${s2.rowMid.toFixed(2)}, over ${SEAM_RATIO} times it`);

    const row = table.get(name);
    if (!row) {
      fail(`pixel material "${name}" has no row in tools/pixel/textures.json — nothing in this repo can say where ${rel} came from (#743)`);
    } else {
      named.add(name);
      const want = renderPixel(row);
      if (info.width !== PIXEL_PX || info.height !== PIXEL_PX) {
        fail(`${rel} is ${info.width} x ${info.height}, so it cannot be compared with the ${PIXEL_PX} x ${PIXEL_PX} its row draws`);
      } else {
        let differ = 0, firstAt = -1;
        for (let i = 0; i < want.length; i++) if (want[i] !== data[i]) { differ++; if (firstAt < 0) firstAt = i; }
        if (differ) {
          const px = Math.floor(firstAt / 4);
          fail(`${rel} is not what tools/pixel/index.mjs draws for row "${name}": ${differ} of ${want.length} bytes differ, the first at pixel (${px % PIXEL_PX}, ${Math.floor(px / PIXEL_PX)}), ${data[firstAt]} where the row says ${want[firstAt]}. Either the row moved and the PNG is stale — \`npm run pixel:render\` — or those bytes did not come from this repo (#743)`);
        } else {
          pass(`pixel material "${name}": ${colours.size} colours, wraps at ${s2.col.toFixed(2)}/${s2.row.toFixed(2)} against ${s2.colMid.toFixed(2)}/${s2.rowMid.toFixed(2)}, and every one of its ${want.length / 4} pixels is its row's`);
        }
      }
    }
  }

  // And the table has no row the castle does not wear. An orphan row renders a
  // PNG that check 4 then reports as dead weight, which is the same finding two
  // checks later and with the wrong name on it.
  const orphans = [...table.keys()].filter((n) => !(n in config.pixelMaterials));
  for (const n of orphans) fail(`tools/pixel/textures.json has a row "${n}" that data/scene-config.json's pixelMaterials does not name`);
  if (!orphans.length && named.size === table.size)
    pass(`${table.size} rows in tools/pixel/textures.json, ${Object.keys(config.pixelMaterials).length} materials in scene-config.json, the same names`);
}

/* --------------------------------- 3c: every plain material is a colour ---
 * The opposite shape, and the reason `plainMaterials` is a second section rather
 * than two loose entries in the first. Phase 4 needed two surfaces the stone list
 * has no map for — the cell's iron bars and the wool cloak over the laundry crate
 * — and putting a colour-only entry in `pixelMaterials` would have meant weakening
 * the rail above to "one map we drew, unless there is none". So these live apart
 * and carry the opposite assertion: a colour, and no path to anything.
 */
console.log('\nevery plain material is a colour and nothing else');
for (const [name, spec] of Object.entries(config.plainMaterials || {})) {
  if (!/^#[0-9a-fA-F]{6}$/.test(spec.color || '')) fail(`plain material "${name}" has no six-digit hex \`color\``);
  const maps = Object.entries(spec).filter(([, v]) => typeof v === 'string' && v.includes('/'));
  if (maps.length) fail(`plain material "${name}" names ${maps.map(([k]) => k).join(' and ')} — anything with a map belongs in \`pixelMaterials\`, where check 3b can see it`);
  else pass(`plain material "${name}": ${spec.color}`);
}

/* ------------------------------ 3d: everything built names a real material ---
 * Every wall run, drum, ground, room floor and door leaf names a material by
 * string. A typo in one of them throws in the browser at build time, inside a
 * promise, after the loading bar has already run — and nowhere in Node. There
 * are 28 runs, 8 drums and 14 rooms now, which is 50 strings nobody reads.
 */
console.log('\nevery built thing names a material that exists');
{
  const known = new Set([...Object.keys(config.pixelMaterials), ...Object.keys(config.plainMaterials || {})]);
  const named = [];
  for (const w of config.walls) named.push([w.material, `wall run ${w.id}`]);
  for (const d of config.drums) {
    named.push([d.material, `drum ${d.id}`]);
    for (const [i, door] of (d.interior?.doors || []).entries()) {
      if (door.leaf) named.push([door.leaf.material, `${d.id}'s door ${i} leaf`]);
      if (door.bars) named.push([door.bars.material, `${d.id}'s door ${i} bars`]);
      if (door.bar) named.push([door.bar.material, `${d.id}'s door ${i} bar`]);
    }
  }
  if (config.walk) named.push([config.walk.material, 'the wall walk\'s decking']);
  named.push([config.ground.base.material, 'the base ground']);
  for (const patch of config.ground.patches || []) named.push([patch.material, `ground patch ${patch.id}`]);
  for (const out of config.ground.outside || []) named.push([out.material, `outside ground ${out.id}`]);
  for (const r of config.rooms || []) if (r.floor) named.push([r.floor, `${r.id}'s floor`]);
  for (const b of config.builtProps || []) named.push([b.material, `built prop ${b.id}`]);
  const bad = named.filter(([m]) => !known.has(m));
  for (const [m, where] of bad) fail(`${where} names material "${m}", which scene-config.json does not define`);
  if (!bad.length) pass(`${named.length} material names across the walls, drums, doors, the walk, grounds, floors and built props, every one of them defined`);
}

/* ------------------------------------------------- 4: nothing dead on disk ---
 * The reverse of checks 1 and 2. Those ask "does every reference resolve?"; this
 * asks "is every file referenced?", which is the question nobody was asking when
 * this project carried 165 MB of assets for 1,525 lines of code. Thirty-six of
 * the forty-eight Poly Haven folders were named by nothing, and twenty of the
 * forty-eight carried a 2.3 MB material-preview ball as their .gltf + .bin —
 * including the two that ARE used, where only the `textures/` beside the ball
 * were ever loaded.
 *
 * The rule, for `assets/poly-haven`, `assets/NPCs`, `assets/pixel`, since
 * #830 `assets/props`, and since #808 `assets/blender`: a file
 * may be there if some entry in data/ names it, or if a .gltf that some entry
 * in data/ names declares it as a buffer or an image. Nothing else. A rendered
 * texture no material wears is in that rule too: tools/pixel/ writes whatever
 * its table says, so a row deleted from scene-config.json and left in
 * textures.json leaves a PNG here, and this is where it is found.
 *
 * `assets/kenney_retro-fantasy-kit` is deliberately NOT swept that way. It is a
 * kit, vendored whole: 106 GLBs of which the config places 14, and adding a
 * fifteenth should be a one-line config edit, not a re-download. What is checked
 * there is narrower and is the thing that actually cost bytes — the kit shipped
 * the same models three times over, in FBX, OBJ and GLB, and loadModel reads
 * exactly one of those.
 */
console.log('\nnothing on disk that nothing asks for');
{
  const needed = new Map(); // repo-relative path -> what asks for it
  const need = (rel, why) => { if (!needed.has(rel)) needed.set(rel, why); };

  const gltfRefs = [
    ...config.interiorProps.map(p => [propPath(config.polyhavenBase, p.model), p.id || p.model.split('/')[0]]),
    ...npcData.cast.filter(n => n.heldProp)
      .map(n => [config.polyhavenBase + n.heldProp, `${n.id || n.name}'s heldProp`]),
    ...(populace.people ?? []).filter(p => p.heldProp)
      .map(p => [heldPropPath(config.polyhavenBase, p.heldProp), `${p.id || p.name}'s heldProp`]),
  ];
  for (const [rel, why] of gltfRefs) {
    need(rel, why);
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue; // check 1 already said so
    const { json } = readGLTF(file);
    const dir = path.posix.dirname(rel);
    for (const uri of [...(json.buffers || []), ...(json.images || [])].map(x => x.uri).filter(Boolean))
      need(path.posix.join(dir, decodeURIComponent(uri)), `${why}'s glTF declares it`);
  }
  // Every map under config.pixelMaterials, whether a wall, a drum, a ground or a
  // gate leaf is the thing naming it. This is the list that made restoring a set
  // without referencing it produce three unreferenced-file failures (#390), and
  // on 2026-09-21 it is what holds the other half of that: the fifteen Poly
  // Haven set folders left in the commit their names stopped pointing at them,
  // and one left on disk is reported here as dead weight in megabytes.
  for (const [name, spec] of Object.entries(config.pixelMaterials))
    if (spec.map) need(spec.map, `pixel material ${name}'s map`);
  for (const n of npcData.cast) need(n.modelPath, `${n.id || n.name}'s body`);
  for (const p of populace.people ?? []) need(p.modelPath, `${p.id || p.name}'s body`);

  const walk = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.posix.join(rel, e.name)) : [path.posix.join(rel, e.name)]);
  };

  let dead = 0, deadBytes = 0;
  for (const rel of [...walk('assets/poly-haven'), ...walk('assets/NPCs'), ...walk('assets/pixel'), ...walk('assets/props'), ...walk('assets/blender')]) {
    if (needed.has(rel)) continue;
    dead++;
    deadBytes += fs.statSync(path.join(ROOT, rel)).size;
    if (dead <= 8) fail(`nothing references ${rel}`);
  }
  if (dead > 8) fail(`...and ${dead - 8} more unreferenced files`);
  if (dead) fail(`${dead} unreferenced file(s) under assets/, ${(deadBytes / 1048576).toFixed(1)} MB`);
  else pass(`${needed.size} files under assets/poly-haven, assets/NPCs, assets/pixel, assets/props and assets/blender, every one of them asked for`);

  for (const [rel, why] of needed) {
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`${why} needs ${rel}, which is not there`);
  }

  const formats = 'assets/kenney_retro-fantasy-kit/Models';
  const kept = fs.readdirSync(path.join(ROOT, formats)).sort();
  if (kept.join('|') !== 'glb-format')
    fail(`${formats} holds ${kept.join(', ')} — loadModel reads GLB and nothing else, so the rest is dead weight`);
  else pass('the Kenney kit ships only the format loadModel reads');
}

/* ------------------------------------- 5: everything went through the encoder ---
 * #506 says every asset is compressed by tools/encode-assets.mjs before it is
 * committed, and until #604 nothing held a mesh to it: the fourth body sat in
 * assets/NPCs at 1.55 MB of raw floats with every suite green, because the
 * encoder finds bodies through `cast` and the body was on disk before `cast`
 * named it. The Kenney kit is exempt on purpose (#508).
 */
console.log('\nevery Poly Haven prop and every NPC body is meshopt-encoded');
{
  const files = [...new Set([
    ...config.interiorProps.map(p => propPath(config.polyhavenBase, p.model)),
    ...npcData.cast.filter(n => n.heldProp).map(n => config.polyhavenBase + n.heldProp),
    ...npcData.cast.map(n => n.modelPath),
    // And the household's: the hound is the first body the cast does not
    // wear (#644), and this list found bodies through `cast` until then (#645).
    ...(populace.people ?? []).map(p => p.modelPath),
    // And what the household carries (#685), which is not Poly Haven's.
    ...(populace.people ?? []).filter(p => p.heldProp).map(p => heldPropPath(config.polyhavenBase, p.heldProp)),
  ])].filter(rel => fs.existsSync(path.join(ROOT, rel)));
  const raw = files.filter(rel => !(readGLTF(path.join(ROOT, rel)).json.extensionsUsed || []).includes('EXT_meshopt_compression'));
  for (const rel of raw) fail(`${rel} has no EXT_meshopt_compression — run \`npm run assets:encode\` before committing it (#506)`);
  if (!raw.length) pass(`${files.length} files, every one carrying EXT_meshopt_compression`);
}

/* ------------------------- 7: the activity clips this repo generates (#788) ---
 * tools/bodies/ writes Sweep, Stir, Hammer, Spar and Drill into the four human
 * bodies from tools/bodies/clips.json (#787). SPECS.md numbers this check 7;
 * the pixel provenance it sits beside is 3b above. Seven lines, each with the
 * break that turns it red (#34):
 *
 *   1. present: the kit's 24 clips by name and the five, 29 in all
 *   2. targets: a generated clip keys exactly the (joint, path) pairs Idle
 *      does, every one a joint of the body's skin, so a cross-fade never drops
 *      a bone to bind pose
 *   3. duration: its last key is Idle's last key, within 1e-4 s
 *   4. loops: every channel's first and last keys within two int16 steps,
 *      and no turn at the seam the clip does not make anywhere else
 *   5. moves: the row's `driver` joint is 20 degrees or more off Idle's
 *      rotation of it at some key. Line 6 is green on a clip that is only
 *      Idle, which is why this line exists
 *   6. provenance: renderBody(file) is the file on disk, byte for byte (#743)
 *   7. size: each body at most its pre-increment size plus 250,000 bytes
 *
 * The names, the counts and the sizes are held here, not read off the
 * generator, because a rail that reads its subject's constants re-implements
 * the thing it checks (#34). `driver` is the one thing read off the table: it
 * is which joint to look at, not what to find there.
 */
const KIT_CLIPS = [
  'Death', 'Gun_Shoot', 'HitRecieve', 'HitRecieve_2', 'Idle', 'Idle_Gun', 'Idle_Gun_Pointing', 'Idle_Gun_Shoot',
  'Idle_Neutral', 'Idle_Sword', 'Interact', 'Kick_Left', 'Kick_Right', 'Punch_Left', 'Punch_Right', 'Roll',
  'Run', 'Run_Back', 'Run_Left', 'Run_Right', 'Run_Shoot', 'Sword_Slash', 'Walk', 'Wave',
];
const GENERATED_CLIPS = ['Sweep', 'Stir', 'Hammer', 'Spar', 'Drill'];
/** Bytes on disk before 2a, and the room it was given: about twice the kit's
 *  25.7 KB a clip, five times over (SPECS.md, "The generated half"). */
const BODY_BYTES_BEFORE = {
  'assets/NPCs/Woman.glb': 1073992,
  'assets/NPCs/Farmer.glb': 1041692,
  'assets/NPCs/Adventurer.glb': 1215560,
  'assets/NPCs/King.glb': 1255852,
};
const CLIP_BYTES_ALLOWED = 250000;
const DRIVER_MIN_DEGREES = 20;
const LOOP_STEPS = 2;
const SEAM_KINK = 1.5;
/** Line 4, for any clip: null if every channel's first and last keys are
 *  within LOOP_STEPS int16 steps and no channel turns at the seam, else what
 *  went wrong. Shared by the humans' five and the cow's three. */
const rowOfAcc = (acc, i) => {
  const n = acc.getElementSize(), a = acc.getArray(), norm = acc.getNormalized() && a instanceof Int16Array;
  return Array.from({ length: n }, (_, j) => (norm ? Math.max(a[i * n + j] / 32767, -1) : a[i * n + j]));
};
function seamOf(anim) {
  const I16 = 32767;
  for (const c of anim.listChannels()) {
    const out = c.getSampler().getOutput();
    const N = out.getCount() - 1;
    const v = Array.from({ length: N + 1 }, (_, k) => rowOfAcc(out, k));
    const worst = Math.max(...v[0].map((x, i) => Math.abs(x - v[N][i])));
    if (worst > LOOP_STEPS / I16 + 1e-9)
      return `${c.getTargetNode().getName()} ${c.getTargetPath()} ends ${(worst * I16).toFixed(1)} int16 steps from where it starts, over ${LOOP_STEPS}, so the clip jumps at every loop`;
    if (N < 3) continue;
    for (let i = 0; i < v[0].length; i++) {
      let inner = 0;
      for (let k = 1; k < N; k++) inner = Math.max(inner, Math.abs(v[k + 1][i] - 2 * v[k][i] + v[k - 1][i]));
      const seam = Math.abs((v[1][i] - v[0][i]) - (v[N][i] - v[N - 1][i]));
      if (seam > SEAM_KINK * (inner + 4 / I16))
        return `${c.getTargetNode().getName()} ${c.getTargetPath()} turns back at the loop: its speed changes by ${seam.toExponential(2)} across the seam against ${inner.toExponential(2)} at most inside the clip. A non-integer \`cycles\` does this`;
    }
  }
  return null;
}
console.log('\nthe five generated activity clips in the four human bodies');
{
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/bodies/clips.json'), 'utf8')).clips;
  const I16 = 32767;
  const rowOf = (acc, i) => {
    const n = acc.getElementSize(), a = acc.getArray(), norm = acc.getNormalized() && a instanceof Int16Array;
    return Array.from({ length: n }, (_, j) => (norm ? Math.max(a[i * n + j] / I16, -1) : a[i * n + j]));
  };
  // Idle's rotation at time t, linear between its keys and renormalised: what
  // three's mixer would show, to well under the 20 degrees asked about.
  const rotationAt = (sampler, t) => {
    const times = sampler.getInput().getArray();
    let j = 1;
    while (j < times.length - 1 && times[j] < t) j++;
    const f = Math.min(1, Math.max(0, (t - times[j - 1]) / (times[j] - times[j - 1])));
    const A = rowOf(sampler.getOutput(), j - 1);
    let B = rowOf(sampler.getOutput(), j);
    if (A.reduce((s, v, i) => s + v * B[i], 0) < 0) B = B.map((v) => -v);
    const q = A.map((v, i) => v + (B[i] - v) * f);
    const l = Math.hypot(...q);
    return q.map((v) => v / l);
  };
  const degreesBetween = (a, b) => (2 * Math.acos(Math.min(1, Math.abs(a.reduce((s, v, i) => s + v * b[i], 0)))) * 180) / Math.PI;

  for (const [rel, before] of Object.entries(BODY_BYTES_BEFORE)) {
    const name = path.basename(rel);
    const bytes = fs.readFileSync(path.join(ROOT, rel));
    const doc = await io.readBinary(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    const root = doc.getRoot();
    const anims = new Map(root.listAnimations().map((a) => [a.getName(), a]));
    const bad = [];

    // 1. present
    const want = [...KIT_CLIPS, ...GENERATED_CLIPS];
    const missing = want.filter((n) => !anims.has(n));
    const extra = [...anims.keys()].filter((n) => !want.includes(n));
    if (missing.length || extra.length || anims.size !== 29)
      fail(`${name} carries ${anims.size} clips, not 29${missing.length ? `; missing ${missing.join(', ')}` : ''}${extra.length ? `; unexpected ${extra.join(', ')}` : ''}; run \`npm run bodies:render\``);
    const idle = anims.get('Idle');
    if (!idle) { fail(`${name} has no Idle to hold the generated clips to`); continue; }
    const pairs = (a) => new Set(a.listChannels().map((c) => `${c.getTargetNode()?.getName()}:${c.getTargetPath()}`));
    const idlePairs = pairs(idle);
    const idleLast = Math.max(...idle.listSamplers().map((s) => s.getInput().getMax([])[0]));
    const joints = new Set(root.listSkins().flatMap((s) => s.listJoints()));

    for (const clip of GENERATED_CLIPS) {
      const anim = anims.get(clip);
      if (!anim) continue; // line 1 said so
      // 2. targets
      const off = anim.listChannels().filter((c) => !joints.has(c.getTargetNode())).map((c) => c.getTargetNode()?.getName() ?? '(none)');
      if (off.length) bad.push(`${clip} keys ${off.join(', ')}, not a joint of the skin`);
      const got = pairs(anim);
      const lost = [...idlePairs].filter((p) => !got.has(p));
      const added = [...got].filter((p) => !idlePairs.has(p));
      if (lost.length || added.length)
        bad.push(`${clip}'s channels are not Idle's: ${lost.length ? `lacks ${lost.slice(0, 4).join(', ')}` : ''}${added.length ? ` adds ${added.slice(0, 4).join(', ')}` : ''}, and a cross-fade from Idle would leave those bones where they were`);
      // 3. duration
      const last = Math.max(...anim.listSamplers().map((s) => s.getInput().getMax([])[0]));
      if (Math.abs(last - idleLast) > 1e-4) bad.push(`${clip} ends at ${last.toFixed(4)} s, Idle at ${idleLast.toFixed(4)} s`);
      // 4. loops. The same place at both ends, and the same speed: a sine at
      // 1.5 cycles and phase 0 ends where it began, going the other way, and
      // the first half of this line alone stayed green on exactly that break
      // (#34, #147). So the step into the seam and the step out of it may
      // differ by at most SEAM_KINK times the largest such change inside the
      // clip, plus four int16 steps of slack. Measured on the green render:
      // 1.01 at worst, Idle's own seams 0.75.
      const seam = seamOf(anim);
      if (seam) bad.push(`${clip}'s ${seam}`);
      // 5. moves (and line 2's other half: every bone a row moves is a joint
      // of this body by its glTF name, so a generator that skipped an unknown
      // bone instead of throwing still goes red here)
      const row = table.find((r) => r.name === clip);
      if (!row) { bad.push(`${clip} has no row in tools/bodies/clips.json to name its driver`); continue; }
      const jointNames = new Set([...joints].map((j) => j.getName()));
      const strays = [...new Set(row.moves.map((m) => m.bone))].filter((b) => !jointNames.has(b));
      if (strays.length) bad.push(`${clip}'s row moves ${strays.map((b) => JSON.stringify(b)).join(', ')}, not a joint of this body: glTF names (\`UpperArm.R\`), not three's sanitised ones (\`UpperArmR\`)`);
      const find = (a) => a.listChannels().find((c) => c.getTargetNode()?.getName() === row.driver && c.getTargetPath() === 'rotation');
      const mine = find(anim), theirs = find(idle);
      if (!mine || !theirs) { bad.push(`${clip}'s driver ${row.driver} has no rotation channel to compare`); continue; }
      const times = mine.getSampler().getInput().getArray();
      let most = 0;
      for (let k = 0; k < times.length; k++)
        most = Math.max(most, degreesBetween(rowOf(mine.getSampler().getOutput(), k), rotationAt(theirs.getSampler(), times[k])));
      if (most < DRIVER_MIN_DEGREES)
        bad.push(`${clip}'s driver ${row.driver} never gets more than ${most.toFixed(1)} degrees from Idle, under ${DRIVER_MIN_DEGREES}: the clip is Idle with a new name`);
    }
    for (const b of bad) fail(`${name}: ${b}`);

    // 6. provenance
    let rendered = null;
    try { rendered = await renderBody(rel); }
    catch (err) { fail(`${name}: tools/bodies/index.mjs cannot render it: ${err.message}`); }
    if (rendered) {
      const same = Buffer.compare(Buffer.from(rendered), bytes) === 0;
      if (!same) {
        let at = 0;
        while (at < Math.min(rendered.length, bytes.length) && rendered[at] === bytes[at]) at++;
        fail(`${name} is not what tools/bodies/index.mjs renders from clips.json: ${bytes.length} bytes on disk, ${rendered.length} rendered, first difference at byte ${at}. Either a row moved and the body is stale, so run \`npm run bodies:render\`, or those bytes did not come from this repo (#743, #787)`);
      } else if (!bad.length && !missing.length && !extra.length) {
        pass(`${name}: 29 clips, the five generated ones looping on Idle's channels and ${idleLast.toFixed(2)} s, byte-equal to their render`);
      }
    }
    // 7. size
    if (bytes.length > before + CLIP_BYTES_ALLOWED)
      fail(`${name} is ${bytes.length} bytes, over its ${before} before the five clips plus ${CLIP_BYTES_ALLOWED} (#499)`);
  }
}

/* ------------------- 7, the cow half: an animal this repo builds (#789) ---
 * tools/bodies/ builds assets/NPCs/Cow.glb from bodies.json's one row, and
 * #789 raised MAX_SKINNED_TOTAL for it only because it is small. Five lines,
 * each with the break that turns it red (#34):
 *
 *   1. caps: joints, triangles, primitives and bytes at or under #789's four
 *   2. skin: every vertex's weights sum to 1 within 1e-3 and every joint
 *      index is inside the skin
 *   3. clips: Idle (at least 2.0 s), Walk and Eating, every channel on a
 *      joint of the skin, the same (joint, path) pairs in all three, and each
 *      loops by line 4 above
 *   4. four-legged: the bind-pose box, skinned, is at least 1.3 times as long
 *      (z) as it is tall (y)
 *   5. provenance: renderAnimal(row) is the file on disk, byte for byte
 *
 * The caps are held here and not read off the table, for the reason given at
 * the top of this check.
 */
const COW = 'assets/NPCs/Cow.glb';
const COW_MAX_JOINTS = 16;
const COW_MAX_TRIANGLES = 1000;
const COW_MAX_PRIMITIVES = 4;
const COW_MAX_BYTES = 80000;
const COW_CLIPS = ['Idle', 'Walk', 'Eating'];
const COW_IDLE_MIN_SECONDS = 2.0;
const COW_LENGTH_OVER_HEIGHT = 1.3;
console.log('\nthe generated cow, inside #789\'s caps');
{
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const abs = path.join(ROOT, COW);
  if (!fs.existsSync(abs)) fail(`${COW} is not there; run \`npm run bodies:render\``);
  else {
    const bytes = fs.readFileSync(abs);
    const doc = await io.readBinary(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    const root = doc.getRoot();
    const skins = root.listSkins();
    const joints = skins.flatMap((sk) => sk.listJoints());
    const prims = root.listMeshes().flatMap((m) => m.listPrimitives());
    const triangles = prims.reduce((n, p) => n + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);

    // 1. caps
    const over = [];
    if (skins.length !== 1) over.push(`${skins.length} skins, not one`);
    if (joints.length > COW_MAX_JOINTS) over.push(`${joints.length} joints, over ${COW_MAX_JOINTS}`);
    if (triangles > COW_MAX_TRIANGLES) over.push(`${triangles} triangles, over ${COW_MAX_TRIANGLES}`);
    if (prims.length > COW_MAX_PRIMITIVES) over.push(`${prims.length} primitives, over ${COW_MAX_PRIMITIVES}`);
    if (bytes.length > COW_MAX_BYTES) over.push(`${bytes.length} bytes, over ${COW_MAX_BYTES}`);
    if (over.length) fail(`${COW}: ${over.join('; ')}. #789 raised MAX_SKINNED_TOTAL for a body inside those caps and no other`);
    else pass(`${COW}: ${joints.length} joints, ${triangles} triangles, ${prims.length} primitives, ${bytes.length} bytes, inside ${COW_MAX_JOINTS}, ${COW_MAX_TRIANGLES}, ${COW_MAX_PRIMITIVES} and ${COW_MAX_BYTES}`);

    // 2. skin, and 4's bind-pose box, which is the same walk over the vertices:
    // a vertex skinned at rest is sum_i w_i * jointWorld_i * inverseBind_i * v.
    const skin = skins[0];
    const ibm = skin?.getInverseBindMatrices();
    const mul = (a, b) => { // column-major 4x4
      const o = new Array(16).fill(0);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
      return o;
    };
    const bind = joints.map((j, i) => mul(j.getWorldMatrix(), ibm ? ibm.getElement(i, []) : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    const skinBad = [];
    for (const [pi, p] of prims.entries()) {
      const pos = p.getAttribute('POSITION'), jnt = p.getAttribute('JOINTS_0'), wgt = p.getAttribute('WEIGHTS_0');
      if (!jnt || !wgt) { skinBad.push(`primitive ${pi} has no JOINTS_0 or WEIGHTS_0`); continue; }
      const v = [], ji = [], w = [];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v); jnt.getElement(i, ji); wgt.getElement(i, w);
        const sum = w.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1) > 1e-3) { skinBad.push(`primitive ${pi} vertex ${i}'s weights sum to ${sum.toFixed(4)}`); break; }
        const outside = ji.filter((j) => !(Number.isInteger(j) && j >= 0 && j < joints.length));
        if (outside.length) { skinBad.push(`primitive ${pi} vertex ${i} is weighted to joint ${outside.join(', ')}, and the skin has ${joints.length} (0 to ${joints.length - 1})`); break; }
        const out = [0, 0, 0];
        for (let k = 0; k < 4; k++) {
          if (!w[k]) continue;
          const m = bind[ji[k]];
          for (let r = 0; r < 3; r++) out[r] += w[k] * (m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r]);
        }
        for (let r = 0; r < 3; r++) { lo[r] = Math.min(lo[r], out[r]); hi[r] = Math.max(hi[r], out[r]); }
      }
    }
    if (skinBad.length) fail(`${COW}'s skin: ${skinBad.join('; ')}`);
    else pass(`${COW}: every vertex's weights sum to 1 and name a joint of its ${joints.length}`);

    // 3. clips
    const anims = new Map(root.listAnimations().map((a) => [a.getName(), a]));
    const clipBad = [];
    const missing = COW_CLIPS.filter((n) => !anims.has(n));
    if (missing.length) clipBad.push(`no ${missing.join(', ')} (it carries ${[...anims.keys()].join(', ') || 'none'})`);
    const pairsOf = (a) => [...new Set(a.listChannels().map((c) => `${c.getTargetNode()?.getName()}:${c.getTargetPath()}`))].sort().join(',');
    const idle = anims.get('Idle');
    if (idle) {
      const len = Math.max(...idle.listSamplers().map((sm) => sm.getInput().getMax([])[0]));
      if (len < COW_IDLE_MIN_SECONDS - 1e-4) clipBad.push(`Idle runs ${len.toFixed(2)} s, under ${COW_IDLE_MIN_SECONDS}`);
    }
    for (const name of COW_CLIPS) {
      const anim = anims.get(name);
      if (!anim) continue;
      const off = anim.listChannels().filter((c) => !joints.includes(c.getTargetNode())).map((c) => c.getTargetNode()?.getName() ?? '(none)');
      if (off.length) clipBad.push(`${name} keys ${off.join(', ')}, not a joint of the skin`);
      if (idle && pairsOf(anim) !== pairsOf(idle)) clipBad.push(`${name}'s channels are not Idle's, so a cross-fade would leave a bone where the last clip put it`);
      const seam = seamOf(anim);
      if (seam) clipBad.push(`${name}'s ${seam}`);
    }
    if (clipBad.length) fail(`${COW}'s clips: ${clipBad.join('; ')}`);
    else pass(`${COW}: ${COW_CLIPS.join(', ')}, on its own joints, the same channels in all three, each one looping`);

    // 4. four-legged
    const tall = hi[1] - lo[1], long = hi[2] - lo[2];
    if (!(tall > 0) || long < COW_LENGTH_OVER_HEIGHT * tall)
      fail(`${COW}'s bind pose is ${long.toFixed(2)} m long and ${tall.toFixed(2)} m tall, under ${COW_LENGTH_OVER_HEIGHT} to 1: that is not a thing on four legs`);
    else pass(`${COW}'s bind pose is ${long.toFixed(2)} m long by ${tall.toFixed(2)} m tall, ${(long / tall).toFixed(2)} to 1`);

    // 5. provenance
    const row = animalRows().find((r) => r.file === COW);
    if (!row) fail(`tools/bodies/bodies.json has no row whose file is ${COW}, so nothing in this repo made it (#787)`);
    else {
      let rendered = null;
      try { rendered = await renderAnimal(row); }
      catch (err) { fail(`${COW}: tools/bodies/index.mjs cannot render it: ${err.message}`); }
      if (rendered) {
        if (Buffer.compare(Buffer.from(rendered), bytes) === 0) pass(`${COW} is byte-equal to its render from bodies.json`);
        else {
          let at = 0;
          while (at < Math.min(rendered.length, bytes.length) && rendered[at] === bytes[at]) at++;
          fail(`${COW} is not what tools/bodies/index.mjs renders from bodies.json: ${bytes.length} bytes on disk, ${rendered.length} rendered, first difference at byte ${at}. Either the row moved and the cow is stale, so run \`npm run bodies:render\`, or those bytes did not come from this repo (#743, #787)`);
        }
      }
    }
  }
}

/* ----------------------------------- 8: what Blender made (#803, #806, #808) ---
 * tools/blender/render.mjs runs Blender on Devon's machine and writes
 * assets/blender/<pack>/<name>.glb and a row of tools/blender/manifest.json
 * per file. CI cannot run Blender (#804), so this cannot reproduce a file the
 * way 3b and 7 do: it proves the committed bytes are the bytes the manifest
 * recorded and that no input moved since the render, and nothing more (#803
 * says so out loud). Eight lines, each with the break that turns it red (#34):
 *
 *   1. the pin: every row's `blender` starts 5.2. (#805, #879)
 *   2. the bytes: every row's file exists, is `bytes` long, hashes to `sha256`
 *   3. both ways: every file under assets/blender/ is a manifest row, and
 *      every manifest row is a packs.json row and back
 *   4. not stale: every row's `source` is today's hash of its inputs
 *   5. both endings (#632): each row's inputs hash the same as LF and as
 *      CRLF, and manifest.json has one kind of line ending
 *   6. the shape: meshopt, no basisu, no unlit, no COLOR_0, one material at
 *      metallic 0, the row's triangles and under the pack's caps, its box on
 *      y 0 and centred in x and z to 1 mm. Two amendments for a skinned pack
 *      (#820): `materials` on the pack's caps line names the materials the
 *      file carries, all over one image (one unnamed material without it),
 *      and a pack with `joints` is framed on its `Root` joint at x and z 0
 *      to 1 mm, with its bind-pose box on y 0, in place of the box centre
 *   7. the images: PNG, at most 128 px a side and 32 colours, every texel in
 *      the castle's palettes or the pack's `extraColours` (at most 8, each
 *      with a `why`)
 *   8. no input files (#803): no .blend under tools/ or assets/, and nothing
 *      under tools/blender/ that opens or imports a file or imports `time`
 *
 * The caps are one line per pack, held here and never read off the generator
 * (#34). A pack that adds a line argues it in HISTORY.md (#611).
 *
 * The skinned half, over a pack whose caps line has `joints` (#820 to #823):
 * five more lines, each with its break, every one a re-render (#34):
 *
 *   1. rig: one skin, at most `joints` joints, `Head` and `Wrist.R` among
 *      them, and `Wrist.R` with a child joint, which is what a held prop is
 *      aimed along. Break: drop `Fingers.R`
 *   2. parts: every mesh node is one primitive, its material one of the caps
 *      line's, its name `<slot>-<variant>` with the slot one of the five, and
 *      `skin` and `garment` each have at least one. Break: join `hat-helm`
 *      and `hat-coif` into one object with two materials
 *   3. a person's triangles: the heaviest part of each slot, summed, is at
 *      most `person`, which bounds every combination without naming one.
 *      Break: subdivide `garment-robe` past it
 *   4. skin: every mesh node is bound to the one skin, and every vertex's
 *      weights sum to 1 within 1e-3 and index inside it, the cow's rail
 *      (#794). Break: weight `hat-cap` to joint 20
 *   5. clips: exactly FOLK_CLIPS; every channel on a joint of the skin; every
 *      clip loops (`seamOf`); Idle at least 2.0 s; each activity clip's
 *      `driver` 20 degrees off Idle at some key. Break: `cycles: 1.5` on Sweep
 *
 * As in check 7, `driver` is the one thing read off the row: which joint to
 * look at, not what to find there.
 *
 * The animal half, over a pack whose caps line has `primitives` (#826, #827):
 * the same walk over the same file, with five lines of its own in place of
 * the five above. A parts file is many meshes worn a few at a time and an
 * animal is one mesh worn whole, so lines 1 and 2 above (a hand to hold a
 * prop, parts by slot) and 3 (a person's triangles) do not apply to it, and
 * the skin and the clip lines are the same code under the animal's numbers.
 * Each break is a re-render but the third (#34):
 *
 *   1. caps: one skin, and joints, triangles, primitives and bytes at or
 *      under the pack's line, #789's cow caps with 2 primitives in place of
 *      4. Break: a third material on the pig's snout
 *   2. topology: the joint names are exactly those of the topology its row
 *      names, the quadruped's 16 here (a goose's 12 is one more line of
 *      ANIMAL_TOPOLOGIES). Break: rename the goat's `Tail1`
 *   3. skin: line 4 above. Break: the cat's ear weighted to joint 16, in the
 *      file, since Blender's exporter cannot write an index outside the skin
 *   4. clips: exactly the topology's three; every channel on a joint of the
 *      skin; each loops (`seamOf`); Idle at least 2.0 s; the eating clip's
 *      `Head` 20 degrees off Idle at some key. Break: `cycles: 1.5` on the
 *      horse's Walk
 *   5. four-legged: a quadruped's bind-pose box is at least 1.15 times as
 *      long (z) as it is tall (y), the cow's 1.3 less the goat's horns.
 *      Break: swap the sheep body's y and z
 *
 * `topology` is read off the row the way `driver` is: which list to hold the
 * file to, not what is in it. The lists are held here.
 */
const BLENDER_CAPS = {
  calibration: { triangles: 300, bytes: 24000 },
  evidence: { triangles: 600, bytes: 32000 },
  countryside: { triangles: 6000, bytes: 160000 },
  folk: { triangles: 12000, bytes: 400000, person: 1500, joints: 20, materials: ['Cloth', 'Bare'], clips: 11 },
  held: { triangles: 300, bytes: 16000 },
  animals: { triangles: 1000, bytes: 80000, joints: 16, primitives: 2, materials: ['Coat', 'Bare'] },
};
const ANIMAL_TOPOLOGIES = {
  quadruped: {
    joints: ['Root', 'Body', 'Neck1', 'Head', 'Ear.L', 'Ear.R', 'FrontUpperLeg.L', 'FrontLowerLeg.L', 'FrontUpperLeg.R', 'FrontLowerLeg.R',
      'BackUpperLeg.L', 'BackLowerLeg.L', 'BackUpperLeg.R', 'BackLowerLeg.R', 'Tail1', 'Tail2'],
    clips: ['Idle', 'Walk', 'Eating'],
    eats: 'Eating',
    long: 1.15,
  },
};
const ANIMAL_DRIVER = 'Head';
const FOLK_SLOTS = ['skin', 'garment', 'hair', 'over', 'hat'];
const FOLK_CLIPS = ['Idle', 'Idle_Neutral', 'Idle_Sword', 'Walk', 'Run', 'Wave', 'Sweep', 'Stir', 'Hammer', 'Spar', 'Drill'];
const FOLK_IDLE_MIN_SECONDS = 2.0;
const BLENDER_DIR = 'assets/blender';
const BLENDER_EXTRA_MAX = 8;
console.log('\nwhat Blender made: the manifest, the bytes and the inputs');
{
  const { sourceOf, sourceTexts, fileOf } = await import('../tools/blender/finish.mjs');
  const { eolOf } = await import('../tools/place.mjs');
  const { partsOf } = await import('./gltf.mjs');
  const bad = [];
  const say = (line, msg) => bad.push(`check 8 line ${line}: ${msg}`);
  const saySkinned = (line, msg) => bad.push(`check 8 skinned line ${line}: ${msg}`);
  const sayAnimal = (line, msg) => bad.push(`check 8 animal line ${line}: ${msg}`);
  const skinnedPassed = [];
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const manifestFile = path.join(ROOT, 'tools/blender/manifest.json');
  const manifestText = fs.readFileSync(manifestFile, 'utf8');
  const manifest = JSON.parse(manifestText);
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/blender/packs.json'), 'utf8'));
  const tableRows = new Map(table.rows.map((r) => [fileOf(r), r]));
  const crypto = await import('node:crypto');
  const walk = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.posix.join(rel, e.name)) : [path.posix.join(rel, e.name)]);
  };

  // 1. the pin
  if (manifest.blender !== '5.2') say(1, `tools/blender/manifest.json says blender ${JSON.stringify(manifest.blender)}, not "5.2" (#879)`);
  for (const r of manifest.rows) {
    if (!String(r.blender ?? '').startsWith('5.2.'))
      say(1, `${r.file} was rendered by Blender ${JSON.stringify(r.blender)}, not 5.2; the pin is 5.2 and moves only by a HISTORY entry and a full re-render (#805, #879)`);
  }

  // 2. the bytes
  for (const r of manifest.rows) {
    const abs = path.join(ROOT, r.file);
    if (!fs.existsSync(abs)) { say(2, `${r.file} is a manifest row and not on disk`); continue; }
    const bytes = fs.readFileSync(abs);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== r.bytes) say(2, `${r.file} is ${bytes.length} bytes, the manifest says ${r.bytes}: it changed after its render`);
    if (sha !== r.sha256) say(2, `${r.file} hashes to ${sha}, the manifest says ${r.sha256}: it changed after its render`);
  }

  // 3. both ways
  const rowFiles = new Set(manifest.rows.map((r) => r.file));
  for (const rel of walk(BLENDER_DIR)) if (!rowFiles.has(rel)) say(3, `${rel} is under ${BLENDER_DIR}/ and is no row of tools/blender/manifest.json; only npm run blender:render writes there (#806)`);
  for (const r of manifest.rows) if (!tableRows.has(r.file)) say(3, `${r.file} is a manifest row and no row of tools/blender/packs.json makes it`);
  for (const f of tableRows.keys()) if (!rowFiles.has(f)) say(3, `tools/blender/packs.json has a row for ${f} and the manifest does not; run \`npm run blender:render ${tableRows.get(f).pack}\` on a machine with Blender 5.2`);
  const sorted = [...manifest.rows].map((r) => r.file);
  if (sorted.join('|') !== [...sorted].sort().join('|')) say(3, 'tools/blender/manifest.json\'s rows are not sorted by file');

  // 4. not stale, and 5's first half
  for (const r of manifest.rows) {
    const row = tableRows.get(r.file);
    if (!row) continue; // line 3 said so
    let texts;
    try { texts = sourceTexts(row); } catch (err) { say(4, `${r.file}'s inputs cannot be read: ${err.message}`); continue; }
    const today = sourceOf(texts, row);
    if (today !== r.source)
      say(4, `${r.file}'s source hash is ${today} today and ${r.source} at its render: common.py, ${row.script}, finish.mjs or its packs.json row moved without a render. Run \`npm run blender:render ${row.pack}\` on a machine with Blender 5.2 (#803, #879)`);
    const lf = Object.fromEntries(Object.entries(texts).map(([k, v]) => [k, v.replace(/\r\n/g, '\n')]));
    const crlf = Object.fromEntries(Object.entries(lf).map(([k, v]) => [k, v.replace(/\n/g, '\r\n')]));
    const a = sourceOf(lf, row), b = sourceOf(crlf, row);
    if (a !== b) say(5, `${r.file}'s inputs hash to ${a} as LF and ${b} as CRLF; the same commit would read stale on one machine (#632)`);
  }

  // 5's second half
  const eol = eolOf(manifestText);
  const other = eol === '\r\n' ? /(^|[^\r])\n/.test(manifestText) : manifestText.includes('\r\n');
  if (other) say(5, `tools/blender/manifest.json mixes line endings; its first is ${JSON.stringify(eol)} and render.mjs writes the file's own (#632)`);

  // 6. the shape, and 7. the images
  const palette = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/pixel/textures.json'), 'utf8')).rows
    .flatMap((row) => row.palette.map((h) => h.toLowerCase())));
  for (const [pack, spec] of Object.entries(table.packs ?? {})) {
    const extra = spec.extraColours ?? [];
    if (extra.length > BLENDER_EXTRA_MAX) say(7, `pack ${pack} lists ${extra.length} extraColours, over ${BLENDER_EXTRA_MAX}`);
    for (const e of extra) if (!/^#[0-9a-f]{6}$/i.test(e?.colour ?? '') || !e.why) say(7, `pack ${pack}'s extraColours entry ${JSON.stringify(e)} is not { colour: "#rrggbb", why }`);
  }
  for (const r of manifest.rows) {
    const abs = path.join(ROOT, r.file);
    if (!fs.existsSync(abs)) continue; // line 2 said so
    const caps = BLENDER_CAPS[r.pack];
    if (!caps) { say(6, `${r.file} is pack ${r.pack}, which has no line in BLENDER_CAPS; a pack argues its caps in HISTORY.md (#611)`); continue; }
    const g = readGLTF(abs);
    const { json } = g;
    const used = json.extensionsUsed || [];
    if (!used.includes('EXT_meshopt_compression')) say(6, `${r.file} has no EXT_meshopt_compression; finish.mjs writes it (#506, #806)`);
    for (const ext of ['KHR_texture_basisu', 'KHR_materials_unlit']) if (used.includes(ext)) say(6, `${r.file} declares ${ext}; a Blender asset is lit with one PNG atlas ("The look")`);
    if ((json.meshes || []).some((m) => m.primitives.some((p) => 'COLOR_0' in p.attributes))) say(6, `${r.file} carries COLOR_0; colour is the atlas, not vertex colours`);
    const mats = json.materials || [];
    if (caps.materials) {
      const got = mats.map((m) => m.name ?? '(unnamed)');
      if (got.length !== caps.materials.length || caps.materials.some((n) => !got.includes(n)))
        say(6, `${r.file} has ${got.length} material(s), ${got.join(', ') || 'none'}, not ${caps.materials.join(' and ')} (#820)`);
      const images = new Set(mats.map((m) => json.textures?.[m.pbrMetallicRoughness?.baseColorTexture?.index]?.source));
      if (images.size !== 1 || images.has(undefined))
        say(6, `${r.file}'s materials sample ${images.size} images, not the one palette atlas (#820)`);
    } else if (mats.length !== 1) say(6, `${r.file} has ${mats.length} materials, not one`);
    for (const m of mats) {
      const metal = m.pbrMetallicRoughness?.metallicFactor ?? 1;
      if (metal !== 0) say(6, `${r.file}'s material ${m.name} has metallic ${metal}, not 0`);
    }
    const tris = triangles(abs).tris.length;
    if (tris !== r.triangles) say(6, `${r.file} has ${tris} triangles and its manifest row says ${r.triangles}`);
    if (tris > caps.triangles) say(6, `${r.file} has ${tris} triangles, over pack ${r.pack}'s cap of ${caps.triangles}`);
    const size = fs.statSync(abs).size;
    if (size > caps.bytes) say(6, `${r.file} is ${size} bytes, over pack ${r.pack}'s cap of ${caps.bytes}`);
    if (caps.joints) {
      // The skinned half, and line 6's frame for a skinned pack: the file is
      // framed on its Root joint, not on its box (#820).
      const bytes = fs.readFileSync(abs);
      const doc = await io.readBinary(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
      const root = doc.getRoot();
      const before = bad.length;

      // Which half: a parts file has `person`, an animal has `primitives`.
      // The skin and the clips are the same lines under either's numbers.
      const animal = caps.primitives !== undefined;
      const sayRig = (msg) => (animal ? sayAnimal(1, msg) : saySkinned(1, msg));
      const saySkin = (msg) => (animal ? sayAnimal(3, msg) : saySkinned(4, msg));
      const sayClips = (msg) => (animal ? sayAnimal(4, msg) : saySkinned(5, msg));
      const topology = animal ? ANIMAL_TOPOLOGIES[tableRows.get(r.file)?.topology] : null;

      // 1. rig (the animal's 1, caps, with its primitives below)
      const skins = root.listSkins();
      const joints = skins.flatMap((sk) => sk.listJoints());
      const named = new Map(joints.map((j) => [j.getName(), j]));
      if (skins.length !== 1) sayRig(`${r.file} has ${skins.length} skins, not one`);
      if (joints.length > caps.joints) sayRig(`${r.file} has ${joints.length} joints, over pack ${r.pack}'s cap of ${caps.joints}`);
      if (!animal) {
        for (const need of ['Head', 'Wrist.R']) if (!named.has(need)) saySkinned(1, `${r.file} has no joint ${need}; boneScale and the held prop find them by that name (#823)`);
        const hand = named.get('Wrist.R');
        if (hand && !hand.listChildren().some((c) => joints.includes(c)))
          saySkinned(1, `${r.file}'s Wrist.R has no child joint, so a held prop would be aimed back up the arm (#823)`);
      }

      // the animal's 2. topology
      if (animal) {
        if (!topology) sayAnimal(2, `${r.file}'s packs.json row names topology ${JSON.stringify(tableRows.get(r.file)?.topology)}, and check 8 holds ${Object.keys(ANIMAL_TOPOLOGIES).join(', ')}`);
        else {
          const got = joints.map((j) => j.getName());
          const lacks = topology.joints.filter((n) => !got.includes(n));
          const adds = got.filter((n) => !topology.joints.includes(n));
          if (lacks.length || adds.length || got.length !== topology.joints.length)
            sayAnimal(2, `${r.file}'s joints are not the ${tableRows.get(r.file).topology}'s ${topology.joints.length}${lacks.length ? `: it lacks ${lacks.join(', ')}` : ''}${adds.length ? `${lacks.length ? ' and' : ':'} it adds ${adds.join(', ')}` : ''}${!lacks.length && !adds.length ? `: it has ${got.length}` : ''} (#826)`);
        }
      }

      // line 6, the frame
      const rootJoint = named.get('Root');
      if (!rootJoint) say(6, `${r.file} has no Root joint to be framed on (#820)`);
      else {
        const at = rootJoint.getWorldTranslation();
        for (const [k, axis] of [[0, 'x'], [2, 'z']])
          if (Math.abs(at[k]) > 1e-3) say(6, `${r.file}'s Root joint is at ${axis} ${at[k].toFixed(4)}, not 0 within 1 mm; a skinned pack is framed on its Root joint (#820)`);
      }

      // 2. parts, and 3. a person's triangles
      const meshNodes = root.listNodes().filter((n) => n.getMesh());
      const heaviest = new Map();
      const names = new Set();
      const primitives = meshNodes.flatMap((n) => n.getMesh().listPrimitives());
      if (animal) {
        if (primitives.length > caps.primitives) sayAnimal(1, `${r.file} has ${primitives.length} primitives, over ${caps.primitives}`);
        for (const p of primitives) {
          const mat = p.getMaterial()?.getName() ?? '(none)';
          if (!caps.materials.includes(mat)) sayAnimal(1, `${r.file} has a primitive in material ${mat}, not ${caps.materials.join(' or ')} (#827)`);
        }
      }
      for (const n of animal ? [] : meshNodes) {
        const name = n.getName();
        const prims = n.getMesh().listPrimitives();
        const [slot, ...rest] = name.split('-');
        if (!FOLK_SLOTS.includes(slot) || !rest.join('-') || /[^a-z0-9-]/.test(name))
          saySkinned(2, `${r.file}'s mesh node ${JSON.stringify(name)} is not <slot>-<variant> with the slot one of ${FOLK_SLOTS.join(', ')}`);
        if (names.has(name)) saySkinned(2, `${r.file} has two mesh nodes called ${name}`);
        names.add(name);
        if (prims.length !== 1) saySkinned(2, `${r.file}'s ${name} is ${prims.length} primitives, not one: a part is one draw (#820)`);
        for (const p of prims) {
          const mat = p.getMaterial()?.getName() ?? '(none)';
          if (!caps.materials.includes(mat)) saySkinned(2, `${r.file}'s ${name} wears material ${mat}, not ${caps.materials.join(' or ')}`);
        }
        const count = prims.reduce((sum, p) => sum + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);
        heaviest.set(slot, Math.max(heaviest.get(slot) ?? 0, count));
      }
      for (const need of animal ? [] : ['skin', 'garment']) if (![...names].some((n) => n.startsWith(`${need}-`))) saySkinned(2, `${r.file} has no ${need}-* part, and every person wears one`);
      const person = [...heaviest.values()].reduce((a, b) => a + b, 0);
      const perSlot = FOLK_SLOTS.filter((sl) => heaviest.has(sl)).map((sl) => `${sl} ${heaviest.get(sl)}`).join(', ');
      if (!animal && person > caps.person)
        saySkinned(3, `${r.file}'s heaviest part in each slot comes to ${person} triangles (${perSlot}), over a person's cap of ${caps.person} (#823)`);

      // 4. skin, and the bind-pose box line 6 stands on y 0: a vertex at rest
      // is sum_i w_i * jointWorld_i * inverseBind_i * v, as the cow's rail.
      const skin = skins[0];
      const ibm = skin?.getInverseBindMatrices();
      const mul = (a, b) => { // column-major 4x4
        const o = new Array(16).fill(0);
        for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) for (let k = 0; k < 4; k++) o[c * 4 + rr] += a[k * 4 + rr] * b[c * 4 + k];
        return o;
      };
      const bind = joints.map((j, i) => mul(j.getWorldMatrix(), ibm ? ibm.getElement(i, []) : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (const n of meshNodes) {
        const name = n.getName();
        if (n.getSkin() !== skin || !skin) { saySkin(`${r.file}'s ${name} is not bound to the file's one skin`); continue; }
        for (const p of n.getMesh().listPrimitives()) {
          const pos = p.getAttribute('POSITION'), jnt = p.getAttribute('JOINTS_0'), wgt = p.getAttribute('WEIGHTS_0');
          if (!jnt || !wgt) { saySkin(`${r.file}'s ${name} has no JOINTS_0 or WEIGHTS_0`); continue; }
          const v = [], ji = [], w = [];
          for (let i = 0; i < pos.getCount(); i++) {
            pos.getElement(i, v); jnt.getElement(i, ji); wgt.getElement(i, w);
            const sum = w.reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 1) > 1e-3) { saySkin(`${r.file}'s ${name} vertex ${i}'s weights sum to ${sum.toFixed(4)}, not 1`); break; }
            const outside = ji.filter((j, k) => w[k] > 0 && !(Number.isInteger(j) && j >= 0 && j < joints.length));
            if (outside.length) { saySkin(`${r.file}'s ${name} vertex ${i} is weighted to joint ${outside.join(', ')}, and the skin has ${joints.length} (0 to ${joints.length - 1})`); break; }
            const out = [0, 0, 0];
            for (let k = 0; k < 4; k++) {
              if (!w[k]) continue;
              const m = bind[ji[k]];
              for (let rr = 0; rr < 3; rr++) out[rr] += w[k] * (m[rr] * v[0] + m[4 + rr] * v[1] + m[8 + rr] * v[2] + m[12 + rr]);
            }
            for (let rr = 0; rr < 3; rr++) { lo[rr] = Math.min(lo[rr], out[rr]); hi[rr] = Math.max(hi[rr], out[rr]); }
          }
        }
      }
      if (Math.abs(lo[1]) > 1e-3) say(6, `${r.file}'s bind pose starts at y ${lo[1].toFixed(4)}, not 0 within 1 mm; the soles stand on the floor (#820)`);

      // 5. clips
      const anims = new Map(root.listAnimations().map((a) => [a.getName(), a]));
      const wantClips = animal ? (topology?.clips ?? []) : FOLK_CLIPS;
      const clipCount = animal ? wantClips.length : caps.clips;
      const missing = wantClips.filter((n) => !anims.has(n));
      const extra = [...anims.keys()].filter((n) => !wantClips.includes(n));
      if (missing.length || extra.length || root.listAnimations().length !== clipCount)
        sayClips(`${r.file} carries ${root.listAnimations().length} clips, not ${clipCount}${missing.length ? `; missing ${missing.join(', ')}` : ''}${extra.length ? `; unexpected ${extra.join(', ')}` : ''}`);
      const lastOf = (a) => Math.max(...a.listSamplers().map((sm) => sm.getInput().getMax([])[0]));
      const idle = anims.get('Idle');
      if (idle && lastOf(idle) < FOLK_IDLE_MIN_SECONDS - 1e-4) sayClips( `${r.file}'s Idle runs ${lastOf(idle).toFixed(2)} s, under ${FOLK_IDLE_MIN_SECONDS}`);
      for (const [name, anim] of anims) {
        const off = anim.listChannels().filter((c) => !joints.includes(c.getTargetNode())).map((c) => c.getTargetNode()?.getName() ?? '(none)');
        if (off.length) sayClips(`${r.file}'s ${name} keys ${[...new Set(off)].join(', ')}, not a joint of the skin`);
        const seam = seamOf(anim);
        if (seam) sayClips(`${r.file}'s ${name}'s ${seam}`);
      }
      const rotationAt = (sampler, t) => {
        const times = sampler.getInput().getArray();
        let j = 1;
        while (j < times.length - 1 && times[j] < t) j++;
        const f = Math.min(1, Math.max(0, (t - times[j - 1]) / (times[j] - times[j - 1])));
        const A = rowOfAcc(sampler.getOutput(), j - 1);
        let B = rowOfAcc(sampler.getOutput(), j);
        if (A.reduce((sum, x, i) => sum + x * B[i], 0) < 0) B = B.map((x) => -x);
        const q = A.map((x, i) => x + (B[i] - x) * f);
        const l = Math.hypot(...q);
        return q.map((x) => x / l);
      };
      const degreesBetween = (a, b) => (2 * Math.acos(Math.min(1, Math.abs(a.reduce((sum, x, i) => sum + x * b[i], 0)))) * 180) / Math.PI;
      const clipRows = tableRows.get(r.file)?.clips ?? [];
      // A parts file's five activity clips each name their driver in the row;
      // an animal's one is its eating clip, and its driver is Head (#827).
      for (const clip of animal ? (topology ? [topology.eats] : []) : GENERATED_CLIPS) {
        const anim = anims.get(clip);
        if (!anim || !idle) continue; // the names line said so
        const driver = animal ? ANIMAL_DRIVER : clipRows.find((c) => c.name === clip)?.driver;
        if (!driver) { sayClips(`${r.file}'s ${clip} has no \`driver\` in its packs.json row to hold off Idle`); continue; }
        const find = (a) => a.listChannels().find((c) => c.getTargetNode()?.getName() === driver && c.getTargetPath() === 'rotation');
        const mine = find(anim), theirs = find(idle);
        if (!mine || !theirs) { sayClips(`${r.file}'s ${clip}'s driver ${driver} has no rotation channel to compare`); continue; }
        const times = mine.getSampler().getInput().getArray();
        let most = 0;
        for (let k = 0; k < times.length; k++)
          most = Math.max(most, degreesBetween(rowOfAcc(mine.getSampler().getOutput(), k), rotationAt(theirs.getSampler(), times[k])));
        if (most < DRIVER_MIN_DEGREES)
          sayClips(`${r.file}'s ${clip}'s driver ${driver} never gets more than ${most.toFixed(1)} degrees from Idle, under ${DRIVER_MIN_DEGREES}: the clip is Idle with a new name`);
      }
      // the animal's 5. four-legged
      const tall = hi[1] - lo[1], long = hi[2] - lo[2];
      if (animal && topology?.long && (!(tall > 0) || long < topology.long * tall))
        sayAnimal(5, `${r.file}'s bind pose is ${long.toFixed(2)} m long and ${tall.toFixed(2)} m tall, under ${topology.long} to 1: that is not a thing on four legs (#827)`);
      if (bad.length === before && animal)
        skinnedPassed.push(`${r.file}: one skin of the ${tableRows.get(r.file).topology}'s ${joints.length} joints with Root at the origin, ${tris} triangles in ${primitives.length} primitives (${caps.materials.join(', ')}), ${size} bytes, every weight inside the skin, ${[...anims.keys()].join(', ')} looping with Idle over ${idle ? lastOf(idle).toFixed(2) : '?'} s and ${topology.eats}'s ${ANIMAL_DRIVER} ${DRIVER_MIN_DEGREES} degrees off it, ${long.toFixed(2)} m long by ${tall.toFixed(2)} m tall, ${(long / tall).toFixed(2)} to 1`);
      else if (bad.length === before)
        skinnedPassed.push(`${r.file}: one skin of ${joints.length} joints with Root at the origin, ${meshNodes.length} parts each one primitive in ${caps.materials.join(' or ')}, a person at most ${person} triangles of ${caps.person} (${perSlot}), every weight inside the skin, ${anims.size} clips looping${idle ? ` over ${lastOf(idle).toFixed(2)} s` : ''} with the five activity drivers ${DRIVER_MIN_DEGREES} degrees off Idle`);
    } else {
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (const part of partsOf(abs).parts) {
        const m = part.matrix;
        for (const x of [part.min.x, part.max.x]) for (const y of [part.min.y, part.max.y]) for (const z of [part.min.z, part.max.z]) {
          for (let k = 0; k < 3; k++) {
            const v = m[k] * x + m[4 + k] * y + m[8 + k] * z + m[12 + k];
            lo[k] = Math.min(lo[k], v); hi[k] = Math.max(hi[k], v);
          }
        }
      }
      if (Math.abs(lo[1]) > 1e-3) say(6, `${r.file}'s box starts at y ${lo[1].toFixed(4)}, not 0 within 1 mm; common.py's frame() puts the base on the floor`);
      for (const [k, axis] of [[0, 'x'], [2, 'z']]) {
        const mid = (lo[k] + hi[k]) / 2;
        if (Math.abs(mid) > 1e-3) say(6, `${r.file}'s box is centred at ${axis} ${mid.toFixed(4)}, not 0 within 1 mm`);
      }
    }

    // 7
    const extra = new Set((table.packs?.[r.pack]?.extraColours ?? []).map((e) => String(e.colour).toLowerCase()));
    for (const [i, img] of (json.images || []).entries()) {
      const label = `${r.file}'s image ${i}`;
      if (img.mimeType !== 'image/png') { say(7, `${label} is ${img.mimeType || img.uri || 'untyped'}, not a PNG`); continue; }
      const bv = json.bufferViews?.[img.bufferView];
      const buf = bv && g.buffers[bv.buffer];
      if (!buf) { say(7, `${label} has no bytes this suite can read`); continue; }
      const png = buf.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
      let data, info;
      try {
        ({ data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
      } catch (err) { say(7, `${label} cannot be decoded: ${err.message}`); continue; }
      if (info.width > PIXEL_PX || info.height > PIXEL_PX) say(7, `${label} is ${info.width} x ${info.height}, over ${PIXEL_PX} px`);
      const colours = new Set();
      for (let p = 0; p < data.length; p += 4) colours.add(`#${[data[p], data[p + 1], data[p + 2]].map((c) => c.toString(16).padStart(2, '0')).join('')}`);
      if (colours.size > PIXEL_MAX_COLOURS) say(7, `${label} holds ${colours.size} colours, over ${PIXEL_MAX_COLOURS}`);
      const stray = [...colours].filter((c) => !palette.has(c) && !extra.has(c));
      if (stray.length) say(7, `${label} has texels in ${stray.slice(0, 6).join(', ')}, in no palette of tools/pixel/textures.json and not in pack ${r.pack}'s extraColours`);
    }
  }

  // 8. no input files
  const blends = [...walk('tools'), ...walk('assets')].filter((rel) => /\.blend\d*$/i.test(rel));
  for (const rel of blends) say(8, `${rel} is a .blend; a Blender asset is built from the factory startup by a committed script, and nothing is opened (#803)`);
  const INPUTS = [
    [/\bimport_scene\s*\./, 'import_scene'],
    [/\bopen_mainfile\b/, 'open_mainfile'],
    [/\blibraries\s*\.\s*load\b/, 'libraries.load'],
    [/\bimages\s*\.\s*load\b/, 'images.load'],
    [/^\s*(?:import\s+(?:[\w.]+\s*,\s*)*time\b|from\s+time\s+import\b)/m, 'import time'],
  ];
  for (const rel of walk('tools/blender').filter((f) => !f.startsWith('tools/blender/.staging/'))) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const [re, what] of INPUTS) {
      if (re.test(text)) say(8, `${rel} calls ${what}; a Blender asset is made from nothing but its script and its row (#803)`);
    }
  }

  for (const b of bad) fail(b);
  if (!bad.length) {
    const t = manifest.rows.map((r) => `${r.file} ${r.triangles} triangles ${r.bytes} bytes`).join('; ');
    pass(`${manifest.rows.length} Blender file(s), each its manifest row, rendered by 5.2 from today's inputs, meshopt, one lit material, palette texels only, nothing opened: ${t}`);
    for (const line of skinnedPassed) pass(line);
  }
}

/* ------------------------------------------------- 9: Devon's props (#831) ---
 * assets/props/ is a family made outside this repo by Devon's own Blender
 * script (#830; the script is in tools/props/ and nothing runs it). Every file
 * carries the same 128 x 128 atlas, NEAREST, and two of them (the cobwebs) and
 * net-rack an alpha mask. The encoder's size exemption is what keeps that atlas
 * a PNG, and it was missing: the first run over these files turned every atlas
 * into ETC1S, which blurs a hard pixel edge, and dropped the mask through
 * `removeAlpha()`, with all fifteen suites green. So this holds the family's
 * shape as it must arrive in a commit: meshopt-encoded (#506), one material,
 * one image, that image a PNG no bigger than PIXEL_PX on either side by its
 * own IHDR, and no KHR_texture_basisu declared. Check 8, above, is the
 * Blender pipeline's.
 */
console.log("\nDevon's props: meshopt, one material, one small PNG atlas");
{
  const dir = 'assets/props';
  const abs = path.join(ROOT, dir);
  const files = fs.existsSync(abs) ? fs.readdirSync(abs).filter(n => n.endsWith('.glb')).sort().map(n => `${dir}/${n}`) : [];
  if (!files.length) fail(`${dir} holds no .glb, so this check tests nothing`);
  let bad = 0;
  for (const rel of files) {
    const g = readGLTF(path.join(ROOT, rel));
    const { json } = g;
    const said = [];
    const used = json.extensionsUsed || [];
    if (!used.includes('EXT_meshopt_compression')) said.push('has no EXT_meshopt_compression');
    if (used.includes('KHR_texture_basisu')) said.push('declares KHR_texture_basisu');
    const mats = (json.materials || []).length, imgs = json.images || [];
    if (mats !== 1) said.push(`has ${mats} materials, not one`);
    if (imgs.length !== 1) said.push(`has ${imgs.length} images, not one`);
    for (const img of imgs) {
      if (img.mimeType !== 'image/png') { said.push(`'s image is ${img.mimeType || img.uri || 'untyped'}, not a PNG of ${PIXEL_PX} px or under`); continue; }
      const bv = json.bufferViews?.[img.bufferView];
      const buf = bv && g.buffers[bv.buffer];
      if (!buf) { said.push("'s image has no bytes this suite can read"); continue; }
      const head = buf.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + Math.min(bv.byteLength, 24));
      const isPNG = head.length >= 24 && head.readUInt32BE(0) === 0x89504e47 && head.subarray(12, 16).toString('latin1') === 'IHDR';
      if (!isPNG) { said.push(`'s image says image/png and opens 0x${head.subarray(0, 4).toString('hex')}`); continue; }
      const w = head.readUInt32BE(16), h = head.readUInt32BE(20);
      if (w > PIXEL_PX || h > PIXEL_PX) said.push(`'s image is a ${w} x ${h} PNG, over ${PIXEL_PX} px, which the encoder does not exempt`);
    }
    if (!said.length) continue;
    bad++;
    for (const x of said) fail(`${rel}${x.startsWith("'") ? '' : ' '}${x} (#831)`);
  }
  if (!bad && files.length) pass(`${files.length} files under ${dir}, each meshopt-encoded with one material and one PNG atlas of ${PIXEL_PX} px or under`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
