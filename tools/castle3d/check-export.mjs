#!/usr/bin/env node
// tools/castle3d/check-export.mjs: the export check (#898 call 7).
//
//   node tools/castle3d/check-export.mjs --out <dir> [--glb <file>] [--markers <file>] [--blueprint <file>]
//   (or through build.mjs, after export.py, on a full build or --export-only)
//
// Facts about the two files export.py wrote, which check.py never sees: it
// runs over the .blend before export, so an exporter that drops an object (as
// it drops the hinges) or a writer with a frame error (a z sign, an unswapped
// slope) is invisible to lines 3 and 6. Node reads both without a fourth
// Blender. Not a check.py line: #844's count stays nine. Exits 1 on any FAIL
// (#13). Each problem prints its own `FAIL  export:` line; passing prints one
// `ok    export:` line, which the report quotes whole.
//
// (a) castle.glb: glTF 2; no KHR_draco_mesh_compression; every image in a
// bufferView, none by uri; no camera and no KHR_lights_punctual; no node named
// GUIDE_ or by one of common.py's MARKER_PREFIXES; every blueprint piece named
// by some node's extras.planId or extras.planIds unless allow.json names it
// (line 6 over what was written); each LEAF_<gate id> a root node within 0.01 m
// of its gate's pivot and 0.1 degree of its rotationY about +Y. Those are read
// off the raw JSON chunk first, so an image by uri fails here rather than as a
// reader error. Then the numbers, by the pinned @gltf-transform/core (#898 call
// 5, no npx): bytes, sha256, triangles unique and placed, meshes, nodes,
// materials, images by MIME type, image bytes, texture memory
// (ImageUtils.getVRAMByteLength, uncompressed with mips).
// (b) markers.json: its ids the blueprint's, list by list, and each position or
// box within 0.5 m of the blueprint's unless `allowed` names it: line 3's rule
// over the written file.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NodeIO, ImageUtils } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WHERE_TOLERANCE = 0.5;   // metres, check.py line 3 (#895)
const PIVOT_TOLERANCE = 0.01;  // metres, check.py line 2
const TURN_TOLERANCE = 0.1;    // degrees, check.py lines 2 and 9

/** common.py's MARKER_PREFIXES, read from the file so there is one list. */
export function markerPrefixes() {
  const src = fs.readFileSync(path.join(HERE, 'common.py'), 'utf8');
  const m = src.match(/^MARKER_PREFIXES\s*=\s*\(([^)]*)\)/m);
  if (!m) throw new Error('check-export: common.py has no MARKER_PREFIXES tuple');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function sha256File(file) {
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 22);
  try {
    for (;;) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (n === 0) break;
      h.update(buf.subarray(0, n));
    }
  } finally {
    fs.closeSync(fd);
  }
  return h.digest('hex');
}

/** The GLB's JSON chunk, read without the binary chunk. */
function glbJson(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(20);
    fs.readSync(fd, head, 0, 20, 0);
    if (head.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${path.basename(file)} is not a GLB (no glTF magic)`);
    const len = head.readUInt32LE(12);
    if (head.toString('ascii', 16, 20) !== 'JSON') throw new Error(`${path.basename(file)}'s first chunk is not JSON`);
    const body = Buffer.alloc(len);
    fs.readSync(fd, body, 0, len, 20);
    return { version: head.readUInt32LE(4), json: JSON.parse(body.toString('utf8')) };
  } finally {
    fs.closeSync(fd);
  }
}

const fmt = (v) => `(${v.map((c) => Number(c.toFixed(4))).join(', ')})`;
const dist = (a, b) => Math.hypot(...a.map((c, i) => c - b[i]));
const centre = (box) => ['x', 'y', 'z'].map((k) => (box.min[k] + box.max[k]) / 2);
const worstFace = (a, b) => Math.max(...['min', 'max'].flatMap((e) => ['x', 'y', 'z'].map((k) => Math.abs(a[e][k] - b[e][k]))));

/** The angle between quaternion q [x, y, z, w] and a turn of `deg` about +Y. */
function offTurn(q, deg) {
  const h = (deg * Math.PI) / 360;
  const dot = Math.abs(q[1] * Math.sin(h) + q[3] * Math.cos(h));
  return (2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI;
}

// ------------------------------------------------------------------ (a) glb --
async function checkGlb(glbPath, bp, allow, prefixes, fail) {
  const name = path.basename(glbPath);
  const { version, json } = glbJson(glbPath);
  const before = fail.count;
  if (version !== 2 || json.asset?.version !== '2.0') fail(`${name} is glTF ${json.asset?.version} (GLB ${version}), not 2.0`);
  const used = new Set([...(json.extensionsUsed || []), ...(json.extensionsRequired || [])]);
  if (used.has('KHR_draco_mesh_compression')) fail(`${name} uses KHR_draco_mesh_compression; Draco is off (#897)`);
  (json.images || []).forEach((img, i) => {
    if (img.uri !== undefined) fail(`${name} image ${i} is by uri ${img.uri}; every image is embedded`);
    else if (img.bufferView === undefined) fail(`${name} image ${i} has no bufferView; every image is embedded`);
  });
  if ((json.cameras || []).length) fail(`${name} carries ${json.cameras.length} camera(s); cameras are off (#897)`);
  if (used.has('KHR_lights_punctual')) fail(`${name} uses KHR_lights_punctual; lights are off (#897)`);
  const nodes = json.nodes || [];
  const bad = nodes.map((n) => n.name || '').filter((n) => n.startsWith('GUIDE_') || prefixes.some((p) => n.startsWith(p)));
  if (bad.length) {
    fail(`${name} has ${bad.length} node(s) named as a marker or GUIDE: ${bad.slice(0, 12).join(', ')}${bad.length > 12 ? ' ...' : ''}`);
  }
  // every piece named, unless allow.json names it (line 6 over the written file)
  const named = new Set();
  for (const n of nodes) {
    const x = n.extras || {};
    if (x.planId !== undefined) named.add(String(x.planId));
    if (Array.isArray(x.planIds)) x.planIds.forEach((i) => named.add(String(i)));
  }
  const missing = bp.pieces.filter((p) => !named.has(p.id) && !(p.id in allow)).map((p) => p.id);
  if (missing.length) {
    fail(`${missing.length} blueprint piece(s) no glb node names: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' ...' : ''}`);
  }
  const piecesNamed = bp.pieces.filter((p) => named.has(p.id)).length;
  // the leaves, on their pivots, in the game's frame
  const children = new Set(nodes.flatMap((n) => n.children || []));
  const leaves = bp.pieces.filter((p) => p.pivot);
  for (const p of leaves) {
    const i = nodes.findIndex((n) => n.name === `LEAF_${p.id}`);
    if (i < 0) { fail(`${name} has no node LEAF_${p.id}; ${p.id} has a pivot at ${fmt(p.pivot.position)}`); continue; }
    const n = nodes[i];
    if (children.has(i)) { fail(`LEAF_${p.id} is not a root node; the exporter drops the hinge and roots the leaf`); continue; }
    if (n.matrix) { fail(`LEAF_${p.id} carries a matrix, not a translation and rotation`); continue; }
    const t = n.translation || [0, 0, 0];
    const q = n.rotation || [0, 0, 0, 1];
    const d = dist(t, p.pivot.position);
    if (d > PIVOT_TOLERANCE) fail(`LEAF_${p.id} stands ${d.toFixed(3)} m from ${p.id}'s pivot ${fmt(p.pivot.position)}`);
    const off = offTurn(q, p.pivot.rotationY);
    if (off > TURN_TOLERANCE) fail(`LEAF_${p.id} is ${off.toFixed(2)} deg off ${p.id}'s rotationY ${p.pivot.rotationY} about +Y`);
  }
  if (fail.count > before) return null;

  // the numbers, by the pinned core
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(glbPath);
  const root = doc.getRoot();
  const trisOf = new Map();
  let unique = 0;
  for (const mesh of root.listMeshes()) {
    let t = 0;
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      const count = idx ? idx.getCount() : pos ? pos.getCount() : 0;
      const mode = prim.getMode();
      if (mode === 4) t += count / 3;
      else if (mode === 5 || mode === 6) t += Math.max(0, count - 2);
    }
    trisOf.set(mesh, t);
    unique += t;
  }
  let placed = 0;
  for (const node of root.listNodes()) if (node.getMesh()) placed += trisOf.get(node.getMesh());
  const byType = {};
  let imageBytes = 0;
  let vram = 0;
  for (const tex of root.listTextures()) {
    const mime = tex.getMimeType();
    const data = tex.getImage();
    byType[mime] = (byType[mime] || 0) + 1;
    imageBytes += data ? data.byteLength : 0;
    vram += (data && ImageUtils.getVRAMByteLength(data, mime)) || 0;
  }
  const bytes = fs.statSync(glbPath).size;
  return {
    bytes, sha256: sha256File(glbPath), triangles: unique, placed, meshes: root.listMeshes().length,
    nodes: root.listNodes().length, materials: root.listMaterials().length, images: root.listTextures().length,
    byType, imageBytes, vram, piecesNamed, leaves: leaves.length,
  };
}

// ---------------------------------------------------------- (b) markers.json --
function checkMarkers(mjPath, bp, bpSha, fail) {
  const name = path.basename(mjPath);
  const before = fail.count;
  const m = JSON.parse(fs.readFileSync(mjPath, 'utf8'));
  if (m.blueprintSha256 !== bpSha) fail(`${name}'s blueprintSha256 ${m.blueprintSha256} is not this blueprint's ${bpSha}`);
  const pieceOf = (key) => new Map(bp.pieces.filter((p) => p[key] !== null && p[key] !== undefined).map((p) => [p[key], p]));
  const evid = pieceOf('evidence');
  const reads = pieceOf('read');
  const bells = bp.pieces.filter((p) => p.bell === true);
  const want = {
    rooms: [...bp.rooms.map((r) => r.id), ...bp.openRooms.rooms.map((o) => o.id)],
    colliders: bp.colliders.map((c) => c.id),
    gates: bp.gates.map((g) => g.id),
    ramps: bp.ramps.map((r) => r.id),
    evidence: [...evid.keys()],
    read: [...reads.keys()],
    bells: bells.map((p) => p.id),
  };
  for (const [list, ids] of Object.entries(want)) {
    const have = (m[list] || []).map((e) => e.id);
    const i = ids.findIndex((id, k) => have[k] !== id);
    if (have.length !== ids.length || i >= 0) {
      const at = i >= 0 ? i : Math.min(have.length, ids.length);
      fail(`${name} ${list}: ${have.length} ids against the blueprint's ${ids.length}; first difference at ${at}, `
        + `${have[at] ?? '(none)'} against ${ids[at] ?? '(none)'}`);
    }
  }
  if (!m.spawn) fail(`${name} has no spawn`);
  if (fail.count > before) return null;

  // each position or box against the blueprint's (line 3's rule)
  const allowed = m.allowed || {};
  const far = [];
  let count = 0;
  const hold = (marker, d, ref) => {
    count += 1;
    if (d > WHERE_TOLERANCE && !(marker in allowed)) far.push({ marker, d, ref });
  };
  const bpRooms = new Map(bp.rooms.map((r) => [r.id, r]));
  const cur = bp.curtain;
  const gx = bp.openRooms.gateX;
  const open = new Map(bp.openRooms.rooms.map((o) => [o.id, o]));
  for (const r of m.rooms) {
    const c = [(r.bounds.min.x + r.bounds.max.x) / 2, (r.bounds.min.z + r.bounds.max.z) / 2];
    if (open.has(r.id)) {
      const o = open.get(r.id);
      const x0 = o.west ? gx[o.west] : cur.min.x;
      const x1 = o.east ? gx[o.east] : cur.max.x;
      // line 3's rule for an open place: its centre strictly inside its band
      const inside = x0 < c[0] && c[0] < x1 && cur.min.z < c[1] && c[1] < cur.max.z;
      hold(`ROOM_${r.id}`, inside ? 0 : WHERE_TOLERANCE + 1, `its band x ${x0}..${x1}, z ${cur.min.z}..${cur.max.z}`);
    } else {
      const b = bpRooms.get(r.id);
      const want2 = [(b.bounds.min.x + b.bounds.max.x) / 2, (b.bounds.min.z + b.bounds.max.z) / 2];
      hold(`ROOM_${r.id}`, Math.max(dist(c, want2), Math.abs(r.top - b.top)), fmt(want2));
    }
  }
  const bpCols = new Map(bp.colliders.map((c) => [c.id, c]));
  for (const c of m.colliders) hold(`COL_${c.id}`, worstFace(c.box, bpCols.get(c.id).box), `collider ${c.id}'s box`);
  const pieces = new Map(bp.pieces.map((p) => [p.id, p]));
  for (const g of m.gates) {
    const row = bp.gates.find((x) => x.id === g.id);
    let pt = null;
    if (row.x !== undefined && row.z !== undefined) pt = [row.x, 0, row.z];
    else if (row.centre) pt = row.centre;
    else {
      const r = bpRooms.get(g.id);
      if (r && r.shape) pt = [r.shape.cx, r.top, r.shape.cz];
    }
    if (pt === null) fail(`${name}: the blueprint gives gate ${g.id} no point`);
    else hold(`GATE_${g.id}`, dist(g.position, pt), fmt(pt));
    const leaf = pieces.get(g.id);
    if (leaf && leaf.pivot) {
      if (!g.pivot) fail(`${name}: gate ${g.id} has no pivot; the blueprint's is at ${fmt(leaf.pivot.position)}`);
      else hold(`GATE_${g.id}_HINGE`, dist(g.pivot.position, leaf.pivot.position), fmt(leaf.pivot.position));
    } else if (g.pivot) fail(`${name}: gate ${g.id} has a pivot the blueprint does not`);
  }
  const bpRamps = new Map(bp.ramps.map((r) => [r.id, r]));
  for (const r of m.ramps) {
    const b = bpRamps.get(r.id);
    hold(`STAIR_${r.id}`, worstFace(r.box, b.box), `ramp ${r.id}'s box`);
    for (const [end, k] of [['LOW', 'from'], ['HIGH', 'to']]) {
      if (!r.slope || !r.slope[k]) { fail(`${name}: ramp ${r.id} has no slope.${k}`); continue; }
      hold(`STAIR_${r.id}_${end}`, dist(r.slope[k], b.slope[k]), fmt(b.slope[k]));
    }
  }
  hold('SPAWN', dist(m.spawn.position, bp.spawn.position), fmt(bp.spawn.position));
  for (const [list, prefix, of] of [['evidence', 'EVID_', evid], ['read', 'READ_', reads]]) {
    for (const e of m[list]) {
      const pt = centre(of.get(e.id).box);
      hold(`${prefix}${e.id}`, dist(e.position, pt), fmt(pt));
    }
  }
  for (const e of m.bells) {
    const pt = centre(pieces.get(e.id).box);
    hold(`BELL_${e.id}`, dist(e.position, pt), fmt(pt));
  }
  if (far.length) {
    const f = far[0];
    fail(`${name}: ${far.length} of ${count} markers more than ${WHERE_TOLERANCE} m from the blueprint; first ${f.marker}, `
      + `${f.d.toFixed(3)} m from ${f.ref}`);
    return null;
  }
  return { count, sha256: sha256File(mjPath), allowed: Object.keys(allowed).length };
}

/**
 * Holds <out>/castle.glb and <out>/markers.json against the blueprint. Prints
 * a FAIL line per problem or one ok line; returns true when it passed.
 */
export async function checkExport({ out, glb, markers, blueprint }) {
  glb = glb || path.join(out, 'castle.glb');
  markers = markers || path.join(out, 'markers.json');
  blueprint = blueprint || path.join(out, 'blueprint.json');
  const bpText = fs.readFileSync(blueprint);
  const bp = JSON.parse(bpText.toString('utf8'));
  const bpSha = crypto.createHash('sha256').update(bpText).digest('hex');
  const allow = JSON.parse(fs.readFileSync(path.join(HERE, 'allow.json'), 'utf8'));
  const fail = (msg) => { fail.count += 1; console.log(`FAIL  export: ${msg}`); };
  fail.count = 0;
  for (const f of [glb, markers]) if (!fs.existsSync(f)) fail(`${f} does not exist; export.py writes it`);
  if (fail.count) return false;
  const g = await checkGlb(glb, bp, allow, markerPrefixes(), fail);
  const mk = checkMarkers(markers, bp, bpSha, fail);
  if (fail.count || !g || !mk) return false;
  const types = Object.entries(g.byType).map(([k, n]) => `${n} ${k.replace('image/', '').toUpperCase()}`).join(', ');
  console.log(`ok    export: ${path.basename(glb)} ${g.bytes} bytes, sha256 ${g.sha256}; ${g.triangles} triangles `
    + `(${g.placed} placed), ${g.meshes} meshes, ${g.nodes} nodes, ${g.materials} materials, ${g.images} images (${types}, `
    + `${g.imageBytes} bytes, ${(g.vram / 1048576).toFixed(1)} MB of texture memory); no Draco, every image embedded, `
    + `no GUIDE or marker node, ${g.piecesNamed} pieces named, ${g.leaves} leaves on their pivots; ${path.basename(markers)} `
    + `${mk.count} markers, sha256 ${mk.sha256}, each within ${WHERE_TOLERANCE} m of the blueprint, ${mk.allowed} allowed`);
  console.log(`export: texture memory ${g.vram} bytes`);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const opt = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const out = opt('--out');
  if (!out) {
    console.error('check-export: needs --out <dir> [--glb <file>] [--markers <file>] [--blueprint <file>]');
    process.exit(1);
  }
  checkExport({ out, glb: opt('--glb'), markers: opt('--markers'), blueprint: opt('--blueprint') })
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((e) => { console.error(`check-export: ${e.stack || e}`); process.exit(1); });
}
