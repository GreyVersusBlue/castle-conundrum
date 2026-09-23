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
//   4. every byte under assets/poly-haven, assets/NPCs and assets/pixel is
//      reachable from one of those references, and everything a reference needs
//      is there
//   5. every prop and body is meshopt-encoded (#506)
//   7. the five activity clips tools/bodies/ writes into the four human bodies
//      are there, loop, move and are byte-equal to their render (#787, #788)
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
import { rows as pixelRows, render as renderPixel, SIZE as GENERATOR_PX, OUT_DIR as PIXEL_DIR } from '../tools/pixel/index.mjs';
import { renderBody } from '../tools/bodies/index.mjs';
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
  ...config.interiorProps.map(p => [config.polyhavenBase + p.model, p.model]),
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
 * The rule, for `assets/poly-haven`, `assets/NPCs` and `assets/pixel`: a file
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
    ...config.interiorProps.map(p => [config.polyhavenBase + p.model, p.model.split('/')[0]]),
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
  for (const rel of [...walk('assets/poly-haven'), ...walk('assets/NPCs'), ...walk('assets/pixel')]) {
    if (needed.has(rel)) continue;
    dead++;
    deadBytes += fs.statSync(path.join(ROOT, rel)).size;
    if (dead <= 8) fail(`nothing references ${rel}`);
  }
  if (dead > 8) fail(`...and ${dead - 8} more unreferenced files`);
  if (dead) fail(`${dead} unreferenced file(s) under assets/, ${(deadBytes / 1048576).toFixed(1)} MB`);
  else pass(`${needed.size} files under assets/poly-haven, assets/NPCs and assets/pixel, every one of them asked for`);

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
    ...config.interiorProps.map(p => config.polyhavenBase + p.model),
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
      for (const c of anim.listChannels()) {
        const out = c.getSampler().getOutput();
        const N = out.getCount() - 1;
        const v = Array.from({ length: N + 1 }, (_, k) => rowOf(out, k));
        const worst = Math.max(...v[0].map((x, i) => Math.abs(x - v[N][i])));
        if (worst > LOOP_STEPS / I16 + 1e-9) {
          bad.push(`${clip}'s ${c.getTargetNode().getName()} ${c.getTargetPath()} ends ${(worst * I16).toFixed(1)} int16 steps from where it starts, over ${LOOP_STEPS}, so the clip jumps at every loop`);
          break;
        }
        if (N < 3) continue;
        let kinked = null;
        for (let i = 0; i < v[0].length && !kinked; i++) {
          let inner = 0;
          for (let k = 1; k < N; k++) inner = Math.max(inner, Math.abs(v[k + 1][i] - 2 * v[k][i] + v[k - 1][i]));
          const seam = Math.abs((v[1][i] - v[0][i]) - (v[N][i] - v[N - 1][i]));
          if (seam > SEAM_KINK * (inner + 4 / I16)) kinked = { seam, inner };
        }
        if (kinked) {
          bad.push(`${clip}'s ${c.getTargetNode().getName()} ${c.getTargetPath()} turns back at the loop: its speed changes by ${kinked.seam.toExponential(2)} across the seam against ${kinked.inner.toExponential(2)} at most inside the clip. A non-integer \`cycles\` does this`);
          break;
        }
      }
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

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
