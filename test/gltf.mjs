// gltf.mjs — enough of the glTF format to get world-space triangles out of a
// .glb or a .gltf+.bin on disk. Three's own GLTFLoader wants fetch against
// http(s); these files are next to this script.
//
// This was inline in assets.mjs until layout.mjs needed the same reader, and it
// grew one thing on the way out: it walks the node hierarchy and applies each
// node's TRS. assets.mjs's old inline copy did not, which was harmless for the
// two things it measured (wall-fortified-gate.glb and the preview balls are
// both single untransformed nodes) and wrong for anything else —
// GothicCabinet_01 is five nodes, four of them doors translated up to 1.75 m
// off the carcass and rotated open, so an untransformed read understates its
// bounding box by most of its height.

import fs from 'node:fs';
import path from 'node:path';

const COMPONENT = { 5126: ['getFloat32', 4], 5125: ['getUint32', 4], 5123: ['getUint16', 2], 5121: ['getUint8', 1] };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

export function readGLTF(file) {
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

/* Column-major 4x4, the order glTF stores `node.matrix` in. */
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

function apply(m, v) {
  return [0, 1, 2].map(r => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r]);
}

function localMatrix(node) {
  if (node.matrix) return node.matrix;
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const r = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w),
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w),
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y),
  ];
  return [
    r[0] * sx, r[1] * sx, r[2] * sx, 0,
    r[3] * sy, r[4] * sy, r[5] * sy, 0,
    r[6] * sz, r[7] * sz, r[8] * sz, 0,
    tx, ty, tz, 1,
  ];
}

/**
 * Every triangle in the file, in the model's own root space, with each node's
 * TRS chain applied. `verts` is a flat list of [x,y,z]; `tris` indexes into it.
 */
export function triangles(file) {
  const g = readGLTF(file);
  const verts = [], tris = [];
  const nodes = g.json.nodes || [];
  const roots = (g.json.scenes?.[g.json.scene ?? 0]?.nodes)
    ?? nodes.map((_, i) => i).filter(i => !nodes.some(n => (n.children || []).includes(i)));
  const walk = (index, parent) => {
    const node = nodes[index];
    const world = multiply(parent, localMatrix(node));
    if (node.mesh !== undefined) {
      for (const prim of g.json.meshes[node.mesh].primitives) {
        if (prim.indices === undefined) continue;
        const p = accessor(g, prim.attributes.POSITION).map(v => apply(world, v));
        const idx = accessor(g, prim.indices);
        const base = verts.length;
        verts.push(...p);
        for (let i = 0; i < idx.length; i += 3) tris.push([base + idx[i], base + idx[i + 1], base + idx[i + 2]]);
      }
    }
    for (const child of node.children || []) walk(child, world);
  };
  for (const root of roots) walk(root, IDENTITY);
  return { json: g.json, verts, tris };
}

/* There used to be a `boundsOf(file)` here returning the vertex-tight AABB.
 * Nothing called it — assets.mjs reads `triangles` and the old layout.mjs did
 * too — and `castle-plan.js` takes a parameter by that name meaning something
 * else entirely, so leaving a same-named export with a different return shape
 * in the file everyone imports was a trap. Removed 2026-09-14. `partsOf` is
 * below, and the tight box is `triangles(file).verts` if anything wants it.
 */

/* ------------------------------------------------------------------ parts ---
 * What `src/castle-plan.js` needs, and why a single box is not it.
 *
 * three's `Box3.setFromObject(obj)` does NOT measure vertices. It walks the
 * meshes under `obj` and, for each one, transforms the eight corners of that
 * mesh's own `geometry.boundingBox` by that mesh's `matrixWorld`, then unions
 * the results. GLTFLoader builds one Mesh per glTF primitive, so "per mesh"
 * means per primitive, and the box a rotated model reports at runtime is the
 * union of per-primitive corner-rotated boxes — always at least as large as the
 * vertex-tight box, and not derivable from the whole-model box either.
 *
 * Measured against the live scene by running `test/plan-vs-scene.mjs` with this
 * collapsed to one whole-model box: brass_candleholders comes out 0.129 m wrong
 * and GothicCabinet_01 0.113 m, against a 0.01 m tolerance. The cabinet is the
 * instructive one — it is placed at 90 degrees, where rotating corners is
 * exact — because the error there is not the placement rotation at all. Its
 * four doors are separate nodes translated up to 1.75 m off the carcass and
 * rotated open, and three boxes each of those separately.
 *
 * Hence `partsOf`: each primitive's local AABB (glTF requires POSITION
 * accessors to carry `min` and `max`, which is exactly `geometry.boundingBox`)
 * paired with the matrix its node chain gives it. `castle-plan.js` applies the
 * placement transform on top and unions, and gets the number three gets.
 */
export function partsOf(file) {
  const g = readGLTF(file);
  const nodes = g.json.nodes || [];
  const roots = (g.json.scenes?.[g.json.scene ?? 0]?.nodes)
    ?? nodes.map((_, i) => i).filter(i => !nodes.some(n => (n.children || []).includes(i)));
  const parts = [];
  const walk = (index, parent) => {
    const node = nodes[index];
    const world = multiply(parent, localMatrix(node));
    if (node.mesh !== undefined) {
      for (const prim of g.json.meshes[node.mesh].primitives) {
        const a = g.json.accessors[prim.attributes.POSITION];
        let lo = a.min, hi = a.max;
        if (!lo || !hi) {
          const p = accessor(g, prim.attributes.POSITION);
          lo = [0, 1, 2].map(i => Math.min(...p.map(v => v[i])));
          hi = [0, 1, 2].map(i => Math.max(...p.map(v => v[i])));
        }
        parts.push({
          min: { x: lo[0], y: lo[1], z: lo[2] },
          max: { x: hi[0], y: hi[1], z: hi[2] },
          matrix: world.slice(),
        });
      }
    }
    for (const child of node.children || []) walk(child, world);
  };
  for (const root of roots) walk(root, IDENTITY);
  return { parts };
}
