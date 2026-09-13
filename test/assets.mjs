// assets.mjs — what data/scene-config.json points at, checked against the files
// on disk. Node only, no browser: everything here is glTF parsing and geometry.
//
//   node test/assets.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. The config used to name `wooden_gate_1k.gltf` as the gate
// door's model. It is not a gate. Poly Haven ship a material-preview ball with
// every TEXTURE pack — one node named `sphere_gltf`, one mesh named
// `Sphere.001` — and wooden_gate is a texture pack, so the archway held a
// 1.93-unit sphere, auto-scaled to 3.6 m across, grounded, hinged, and swung
// 105 degrees when the quest completed. Twenty of the forty-eight Poly Haven
// folders in this project are texture packs carrying that same ball. Nothing
// caught it because a preview sphere loads perfectly: no 404, no console error,
// no placeholder box. The only signal is the shape of what it hands back.
//
// Three checks:
//   1. every `model` in the config resolves to a file that exists
//   2. no `model` resolves to a Poly Haven preview ball
//   3. the gate leaf's built dimensions match the archway's own opening,
//      measured out of wall-fortified-gate.glb rather than restated from the
//      config — the point is to catch the two drifting apart.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* ------------------------------------------------------------ glTF reading ---
 * Enough of the format to get triangles out of a .glb or a .gltf+.bin. Three's
 * own GLTFLoader wants fetch against http(s); these files are on disk.
 */
const COMPONENT = { 5126: ['getFloat32', 4], 5125: ['getUint32', 4], 5123: ['getUint16', 2], 5121: ['getUint8', 1] };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function readGLTF(file) {
  if (file.endsWith('.glb')) {
    const buf = fs.readFileSync(file);
    let off = 12, json = null, bin = null;
    while (off < buf.length) {
      const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
      const body = buf.subarray(off + 8, off + 8 + len);
      if (type === 0x4e4f534a) json = JSON.parse(body.toString('utf8'));
      if (type === 0x004e4942) bin = body;
      off += 8 + len;
    }
    return { json, buffers: [bin] };
  }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const buffers = (json.buffers || []).map(b =>
    b.uri ? fs.readFileSync(path.join(path.dirname(file), decodeURIComponent(b.uri))) : null);
  return { json, buffers };
}

function accessor({ json, buffers }, index) {
  const a = json.accessors[index];
  const bv = json.bufferViews[a.bufferView];
  const buf = buffers[bv.buffer];
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const [reader, bytes] = COMPONENT[a.componentType];
  const n = NUM[a.type];
  const stride = bv.byteStride || bytes * n;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = [];
  for (let i = 0; i < a.count; i++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(view[reader](base + i * stride + c * bytes, true));
    out.push(n === 1 ? row[0] : row);
  }
  return out;
}

function triangles(file) {
  const g = readGLTF(file);
  const verts = [], tris = [];
  for (const mesh of g.json.meshes || []) {
    for (const prim of mesh.primitives) {
      if (prim.indices === undefined) continue;
      const p = accessor(g, prim.attributes.POSITION);
      const idx = accessor(g, prim.indices);
      const base = verts.length;
      verts.push(...p);
      for (let i = 0; i < idx.length; i += 3) tris.push([base + idx[i], base + idx[i + 1], base + idx[i + 2]]);
    }
  }
  return { json: g.json, verts, tris };
}

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

console.log('scene-config model references');
const refs = [
  ...config.courtyard.wallRuns.map(r => [config.kenneyBase + r.model, r.comment || 'wall run']),
  ...config.courtyard.placements.map(p => [config.kenneyBase + p.model, p.id || p.model]),
  ...config.interiorProps.map(p => [config.polyhavenBase + p.model, p.model]),
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
 * The archway is wall-fortified-gate.glb, placed through normalizeToTile, which
 * scales every kit piece by tileSize / its own depth. The opening is measured
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

console.log('\nthe gate leaf against the archway it hangs in');
const arch = config.courtyard.placements.find(p => p.id === 'gate-arch');
if (!arch) fail('no placement with id gate-arch — the gate leaf has nothing to be measured against');
else {
  const file = path.join(ROOT, config.kenneyBase + arch.model);
  const { verts } = triangles(file);
  const depth = Math.max(...verts.map(v => v[2])) - Math.min(...verts.map(v => v[2]));
  const scale = config.tileSize / depth; // normalizeToTile
  const open = openingOf(file, scale);
  const leaf = config.gateDoor.leaf;
  const gate = config.gateDoor;
  // A solid piece has no hole to measure, and everything below would read as a
  // TypeError rather than as the answer, which is that there is no doorway.
  if (!open) fail(`${arch.model} has no opening in it — nothing for a gate to fill`);

  if (open && !near(gate.tile[0], arch.tile[0], 1e-9) || !near(gate.tile[1], arch.tile[1], 1e-9))
    fail(`the gate leaf is on tile ${gate.tile} and the archway on ${arch.tile}`);
  else pass(`leaf and archway share tile ${arch.tile}`);

  // 0.11 m of tolerance: the head is a faceted circle, so a row's measured
  // width lands just inside the true one, and the sample grid is 0.02 m.
  const TOL = 0.11;
  const apex = leaf.springline + leaf.archRadius;
  const checks = open ? [
    ['width', leaf.width, open.width, 'clears the jamb'],
    ['springline', leaf.springline, open.springline, 'meets the arch where it springs'],
    ['apex', apex, open.apex, 'reaches the crown'],
  ] : [];
  for (const [what, built, measured, why] of (open ? checks : [])) {
    if (built > measured) fail(`leaf ${what} ${built} m is wider than the opening's ${measured.toFixed(3)} m — it would clip the stone`);
    else if (!near(built, measured, TOL)) fail(`leaf ${what} ${built} m leaves a ${(measured - built).toFixed(3)} m gap in a ${measured.toFixed(3)} m opening — it no longer ${why}`);
    else pass(`leaf ${what} ${built} m in a ${measured.toFixed(3)} m opening`);
  }

  // The head is drawn as an arc of archRadius springing at springline, so a leaf
  // whose half-width and radius disagree gets a straight step in its outline.
  if (!near(leaf.width / 2, leaf.archRadius, 1e-9))
    fail(`leaf half-width ${leaf.width / 2} and archRadius ${leaf.archRadius} disagree — the head would step in or out at the springline`);
  else pass('the head springs straight off the jamb line');

  // How far the leaf can swing before it stops being an opened gate and starts
  // being a plank in a wall. Hinged at half its own width off centre, at angle θ
  // its furthest point sits `width·cos θ + (thickness/2)·sin θ` in x from the
  // hinge, and the jamb is at half the opening's width from the centre.
  const swing = (gate.openDegrees || 0) * Math.PI / 180;
  const reach = leaf.width / 2
    + leaf.width * Math.abs(Math.cos(swing))
    + (leaf.thickness / 2) * Math.abs(Math.sin(swing));
  const jamb = (open?.width ?? 0) / 2;
  if (!open) { /* already reported */ }
  else if (gate.openDegrees < 80)
    fail(`the gate opens to ${gate.openDegrees} degrees — still across the doorway the quest just unlocked`);
  else if (reach > jamb + leaf.thickness)
    fail(`opened to ${gate.openDegrees} degrees the leaf reaches ${reach.toFixed(2)} m from centre, ${(reach - jamb).toFixed(2)} m into a jamb at ${jamb.toFixed(2)} m`);
  else pass(`opened to ${gate.openDegrees} degrees the leaf stands at ${reach.toFixed(2)} m against a jamb at ${jamb.toFixed(2)} m`);

  for (const [slot, rel] of Object.entries(gate.textures || {})) {
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`gate ${slot} map missing — ${rel}`);
  }
  if (gate.model) fail('gateDoor still carries a `model` — the leaf is built from `leaf` and `textures` now');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
