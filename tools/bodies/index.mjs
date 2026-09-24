#!/usr/bin/env node
// tools/bodies/index.mjs: activity clips, written into the four human bodies
// by this repo (#787, #788).
//
//   node tools/bodies/index.mjs        (from the repo root)
//   npm run bodies:render
//
// WHAT THIS IS FOR. Rank 6's household wants people who sweep, stir, hammer,
// spar and drill, and Quaternius's kit ships 24 clips with none of those in
// it. This container cannot reach any asset host, so the five are made here
// from clips.json, the way tools/pixel/ makes the stone (#742).
//
// HOW A CLIP IS MADE. Each generated clip is the body's own Idle, all 108
// channels, keyed at Idle's own key times, with the table's moves composed on
// top. A move is a rotation about an axis in the body's model frame (+y up, +z
// the way it faces), applied to a bone as
//
//   local' = inverse(parentWorld_k) * R(axis, angle_k) * parentWorld_k * local_k
//
// rotation only, root to tip, so a bone's parentWorld_k already carries every
// move above it. Model-frame axes are why one table serves four bodies whose
// Idle poses differ by up to 90.5 degrees (#788): "swing the right arm
// forward" means the same thing to Woman as to King even though her joints do
// not point where his do. The angle is rest + amp * sin(2 pi (cycles * k / 50
// + phase)); at an integer `cycles` key 50 is key 0 again, and Idle loops, so
// the clip loops by construction. test/assets.mjs check 7 holds it anyway.
//
// PROVENANCE IS REPRODUCTION (#743, #787). test/assets.mjs calls renderBody
// on each of the four and holds the result byte-equal to the file on disk, so
// a hand-edited clip, or a row edited without a re-render, fails there.
//
// IT IS THE ENCODER FOR THESE FOUR (#506). The body is read with
// EXT_meshopt_compression and written back with it, so check 5 holds and the
// loader (three's GLTFLoader with MeshoptDecoder, src/npc.js) reads it as it
// read the kit's clips. Rotations stay normalised int16 like the kit's.
// Nothing else under assets/ is read: Hen.glb does not round-trip
// gltf-transform stably (#788).
//
// RE-RUNNING IS A NO-OP. A body whose render equals what is on disk is not
// rewritten. Woman.glb grew 20,616 bytes on its first pass through
// gltf-transform, which is the writer, not the clips, and holds after that.
//
// AND THE ANIMALS, BUILT FROM NOTHING (#787, #789, increment 2b). bodies.json
// is a second table, one row per animal: joints, boxes and prisms each rigidly
// weighted to one joint, materials, and clips written the way clips.json's are
// but onto a rig this script also made, so a move is simply the joint's local
// rotation (every joint binds unrotated, so its parent frame is the model
// frame at rest). `renderAnimal(row)` is the whole .glb from the row and
// nothing else: no file is read, so it cannot drift from a hand-edit, and it
// goes through `meshopt({ encoder, cleanup: false })`, the call
// tools/encode-assets.mjs makes (#506). test/assets.mjs check 7's cow half
// holds it byte-equal to assets/NPCs/Cow.glb and to #789's four caps.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Document, Logger, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');

export const TABLE = path.join(HERE, 'clips.json');
export const ANIMAL_TABLE = path.join(HERE, 'bodies.json');

export function animals() {
  return JSON.parse(fs.readFileSync(ANIMAL_TABLE, 'utf8')).animals;
}

/** The four bodies, repo-relative. The hound and the hen are not here: they
 *  are animal rigs with no arms, and Hen.glb is not stable through the writer. */
export const BODIES = [
  'assets/NPCs/Woman.glb',
  'assets/NPCs/Farmer.glb',
  'assets/NPCs/Adventurer.glb',
  'assets/NPCs/King.glb',
];

/** Keys per clip, less one. The kit's clips are 51 keys, so a generated clip
 *  is keyed exactly where Idle is. */
export const STEPS = 50;

/** Written into each generated clip's `extras`, which is how a render finds
 *  the clips the last one wrote. */
const GENERATOR = 'tools/bodies/index.mjs';

/** The clip the generated ones are built on. */
const BASE = 'Idle';

export function clips() {
  return JSON.parse(fs.readFileSync(TABLE, 'utf8')).clips;
}

/* -------------------------------------------------------- quaternions ---
 * [x, y, z, w], the glTF order. Eight lines rather than three.js, so this
 * tool imports nothing the page does and its arithmetic cannot move with a
 * three upgrade.
 */
const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qinv = (q) => [-q[0], -q[1], -q[2], q[3]];
const qnorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]); return q.map((v) => v / l); };
const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
function axisAngle(axis, degrees) {
  const a = typeof axis === 'string' ? AXES[axis] : axis;
  if (!a || a.length !== 3) throw new Error(`axis ${JSON.stringify(axis)} is not x, y, z or a 3-vector`);
  const l = Math.hypot(a[0], a[1], a[2]);
  const h = (degrees * Math.PI) / 360;
  const s = Math.sin(h) / l;
  return [a[0] * s, a[1] * s, a[2] * s, Math.cos(h)];
}

/* ---------------------------------------------------- int16 rotations ---
 * The kit stores every rotation output as a normalised int16 (the meshopt
 * QUATERNION filter's input), so this reads and writes the same.
 */
const I16 = 32767;
const fromI16 = (v) => Math.max(v / I16, -1);
const toI16 = (v) => Math.round(Math.min(1, Math.max(-1, v)) * I16);

function rowsOf(accessor) {
  const arr = accessor.getArray();
  const n = accessor.getElementSize();
  const norm = accessor.getNormalized() && arr instanceof Int16Array;
  const out = [];
  for (let i = 0; i < accessor.getCount(); i++) {
    const row = [];
    for (let j = 0; j < n; j++) row.push(norm ? fromI16(arr[i * n + j]) : arr[i * n + j]);
    out.push(row);
  }
  return out;
}

let io;
async function reader() {
  if (io) return io;
  await MeshoptDecoder.ready;
  await MeshoptEncoder.ready;
  io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  return io;
}

/**
 * One body, rendered: the file's bytes with every table clip dropped and
 * written again from the table. Reads the file, writes nothing.
 * @param {string} file repo-relative or absolute path to a .glb
 * @returns {Promise<Uint8Array>}
 */
export async function renderBody(file, table = clips()) {
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  const doc = await (await reader()).read(abs);
  const root = doc.getRoot();
  const buffer = root.listBuffers()[0];
  const names = new Set(table.map((c) => c.name));

  // Drop last render's clips, and the accessors only they used, so a second
  // render starts from the same document the first one did. A clip is last
  // render's if the table names it or if it carries GENERATOR in its extras,
  // so a row deleted from the table takes its clip out of the body with it.
  for (const anim of root.listAnimations()) {
    if (!names.has(anim.getName()) && anim.getExtras().generator !== GENERATOR) continue;
    const accessors = new Set(anim.listSamplers().flatMap((s) => [s.getInput(), s.getOutput()]));
    for (const c of anim.listChannels()) c.dispose();
    for (const s of anim.listSamplers()) s.dispose();
    anim.dispose();
    for (const a of accessors) if (a.listParents().every((p) => p === root)) a.dispose();
  }

  const base = root.listAnimations().find((a) => a.getName() === BASE);
  if (!base) throw new Error(`${file} has no ${BASE} clip to build on`);
  const joints = new Set(root.listSkins().flatMap((s) => s.listJoints()));
  const byName = new Map([...joints].map((j) => [j.getName(), j]));

  // Idle, channel by channel: target, path, its keys as rows, its accessor type.
  const channels = base.listChannels().map((c) => ({
    node: c.getTargetNode(),
    path: c.getTargetPath(),
    interpolation: c.getSampler().getInterpolation(),
    input: c.getSampler().getInput(),
    output: c.getSampler().getOutput(),
  }));
  // Idle keys most channels at 51 uniform times and a few constant ones at
  // two. The clip is keyed at the densest channel's times and every channel is
  // read at those times: exactly where Idle has a key, interpolated where it
  // does not, so the generated clip has one time accessor for all 108.
  const densest = channels.reduce((a, c) => (c.input.getCount() > a.input.getCount() ? c : a));
  const keys = densest.input.getCount();
  const last = densest.input.getMax([])[0];
  const dt = last / (keys - 1);
  const idle = new Map(channels.map((c) => [`${c.node.getName()}:${c.path}`, {
    times: Array.from(c.input.getArray()),
    rows: rowsOf(c.output),
    raw: c.output.getArray(),
  }]));
  for (const [id, ch] of idle) {
    if (Math.abs(ch.times[ch.times.length - 1] - last) > 1e-5 || ch.times[0] !== 0)
      throw new Error(`${file}'s ${BASE} channel ${id} runs ${ch.times[0]} to ${ch.times[ch.times.length - 1]} s, not 0 to ${last}`);
  }
  // Idle at key k of this clip: the time, wrapped onto Idle's own length, and
  // either the index of Idle's key there or two keys and a fraction.
  const at = (ch, k) => {
    const t = k === 0 || k % (keys - 1) ? (k % (keys - 1)) * dt : last;
    const i = ch.times.findIndex((x) => Math.abs(x - t) < 1e-5);
    if (i >= 0) return { i };
    let j = 1;
    while (j < ch.times.length - 1 && ch.times[j] < t) j++;
    return { a: j - 1, b: j, f: (t - ch.times[j - 1]) / (ch.times[j] - ch.times[j - 1]) };
  };
  const value = (ch, k, isRotation) => {
    const p = at(ch, k);
    if (p.i !== undefined) return ch.rows[p.i];
    const A = ch.rows[p.a];
    let B = ch.rows[p.b];
    if (isRotation && A[0] * B[0] + A[1] * B[1] + A[2] * B[2] + A[3] * B[3] < 0) B = B.map((v) => -v);
    const mix = A.map((v, n) => v + (B[n] - v) * p.f);
    return isRotation ? qnorm(mix) : mix;
  };

  // Root to tip, over the node tree the joints sit in, from the scene down, so
  // parentWorld includes anything above Root. Rotation only: every node in the
  // four bodies has unit scale, and a move turns a bone about its own pivot.
  const order = [];
  const parentOf = new Map();
  const walk = (node, parent) => {
    order.push(node);
    parentOf.set(node, parent);
    for (const child of node.listChildren()) walk(child, node);
  };
  for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, null);

  for (const row of table) {
    for (const m of row.moves) {
      if (!byName.has(m.bone))
        throw new Error(`clips.json row ${row.name} moves "${m.bone}", which is not a joint of ${path.basename(file)}: glTF names, not three's sanitised ones`);
      if (!idle.has(`${m.bone}:rotation`))
        throw new Error(`clips.json row ${row.name} moves "${m.bone}", which ${BASE} keys no rotation for, so the move would have no channel to live in`);
    }
    if (!byName.has(row.driver)) throw new Error(`clips.json row ${row.name}'s driver "${row.driver}" is not a joint of ${path.basename(file)}`);

    const times = new Float32Array(STEPS + 1);
    for (let k = 0; k <= STEPS; k++) times[k] = k * dt;
    const input = doc.createAccessor(`${row.name}_time`).setType('SCALAR').setArray(times).setBuffer(buffer);

    // Every joint's local rotation at every key, moves composed in.
    const rotations = new Map(); // node -> [q per key]
    for (let k = 0; k <= STEPS; k++) {
      const world = new Map();
      for (const node of order) {
        const keyed = idle.get(`${node.getName()}:rotation`);
        let local = joints.has(node) && keyed ? value(keyed, k, true) : node.getRotation();
        const parent = parentOf.get(node);
        const pw = parent ? world.get(parent) : [0, 0, 0, 1];
        const moves = row.moves.filter((m) => m.bone === node.getName());
        if (moves.length) {
          let r = [0, 0, 0, 1];
          for (const m of moves) {
            const angle = m.rest + m.amp * Math.sin(2 * Math.PI * ((row.cycles * k) / STEPS + m.phase));
            r = qmul(axisAngle(m.axis, angle), r);
          }
          let q = qnorm(qmul(qmul(qmul(qinv(pw), r), pw), local));
          // Stay in local's hemisphere, so a key never flips sign against
          // Idle's and the linear interpolation between keys stays short.
          if (q[0] * local[0] + q[1] * local[1] + q[2] * local[2] + q[3] * local[3] < 0) q = q.map((v) => -v);
          local = q;
          if (!rotations.has(node)) rotations.set(node, []);
          rotations.get(node).push(q);
        }
        world.set(node, qmul(pw, local));
      }
    }

    const anim = doc.createAnimation(row.name).setExtras({ generator: GENERATOR });
    for (const c of channels) {
      const n = c.output.getElementSize();
      const src = c.output.getArray();
      const ch = idle.get(`${c.node.getName()}:${c.path}`);
      const moved = c.path === 'rotation' ? rotations.get(c.node) : null;
      const out = new src.constructor((STEPS + 1) * n);
      for (let k = 0; k <= STEPS; k++) {
        if (moved) {
          const q = moved[k];
          for (let j = 0; j < n; j++) out[k * n + j] = src instanceof Int16Array ? toI16(q[j]) : q[j];
        } else {
          // Idle's own stored number where Idle has a key, so a copied
          // channel is Idle's bytes and not a requantised copy of them.
          const p = at(ch, k);
          if (p.i !== undefined) for (let j = 0; j < n; j++) out[k * n + j] = src[p.i * n + j];
          else {
            const v = value(ch, k, c.path === 'rotation');
            for (let j = 0; j < n; j++) out[k * n + j] = src instanceof Int16Array ? toI16(v[j]) : v[j];
          }
        }
      }
      const output = doc.createAccessor(`${row.name}_${c.node.getName()}_${c.path}`)
        .setType(c.output.getType())
        .setArray(out)
        .setNormalized(c.output.getNormalized())
        .setBuffer(buffer);
      const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation(c.interpolation);
      anim.addSampler(sampler).addChannel(
        doc.createAnimationChannel().setTargetNode(c.node).setTargetPath(c.path).setSampler(sampler),
      );
    }
  }
  return (await reader()).writeBinary(doc);
}

/* ------------------------------------------------------------ animals ---
 * A box is six quads; a prism is `sides` quads round its axis and two fans
 * for its ends, 4 * sides - 4 triangles. Every face has its own four (or
 * `sides`) vertices and its own normal, so the animal is flat-shaded, and
 * every vertex is weighted 1 to its part's joint. A face is wound so its
 * normal points away from the part's centre.
 */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return a.map((v) => v / l); };

function facesOf(part) {
  const [cx, cy, cz] = part.center;
  const [sx, sy, sz] = part.size;
  if (part.shape === 'box') {
    const c = (i, j, k) => [cx + (i - 0.5) * sx, cy + (j - 0.5) * sy, cz + (k - 0.5) * sz];
    return [
      [c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)],
      [c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0)],
      [c(0, 1, 0), c(0, 1, 1), c(1, 1, 1), c(1, 1, 0)],
      [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)],
      [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)],
      [c(0, 0, 0), c(0, 1, 0), c(1, 1, 0), c(1, 0, 0)],
    ];
  }
  if (part.shape === 'prism') {
    const n = part.sides;
    if (!Number.isInteger(n) || n < 3) throw new Error(`a prism needs an integer number of sides, 3 or more, not ${JSON.stringify(n)}`);
    // The ring is laid in the two axes across `axis`, a vertex straight up (or
    // across) at angle 90 degrees, and scaled so the ring's extent is `size`.
    const along = { x: 0, y: 1, z: 2 }[part.axis ?? 'z'];
    if (along === undefined) throw new Error(`prism axis ${JSON.stringify(part.axis)} is not x, y or z`);
    const [u, v] = [0, 1, 2].filter((i) => i !== along);
    const ring = Array.from({ length: n }, (_, i) => [Math.cos(Math.PI / 2 + (2 * Math.PI * i) / n), Math.sin(Math.PI / 2 + (2 * Math.PI * i) / n)]);
    const du = Math.max(...ring.map((r) => r[0])) || 1, dv = Math.max(...ring.map((r) => r[1])) || 1;
    const at = (r, end) => {
      const p = [...part.center];
      p[u] += (r[0] / du) * part.size[u] / 2;
      p[v] += (r[1] / dv) * part.size[v] / 2;
      p[along] += (end - 0.5) * part.size[along];
      return p;
    };
    const faces = [];
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n];
      faces.push([at(a, 0), at(b, 0), at(b, 1), at(a, 1)]);
    }
    faces.push(ring.map((r) => at(r, 0)));
    faces.push(ring.map((r) => at(r, 1)));
    return faces;
  }
  throw new Error(`part shape ${JSON.stringify(part.shape)} is not box or prism`);
}

/**
 * One animal, built: the .glb's bytes from its bodies.json row and nothing
 * else. Pure; writes nothing.
 * @returns {Promise<Uint8Array>}
 */
export async function renderAnimal(row) {
  const out = await reader();
  const d = new Document().setLogger(new Logger(Logger.Verbosity.WARN));
  const buffer = d.createBuffer();
  const root = d.getRoot();

  // Joints, in table order, root first; each one's node is translated from
  // its parent's head to its own and binds unrotated.
  const jointIndex = new Map();
  const nodes = [];
  for (const [i, j] of row.joints.entries()) {
    if (jointIndex.has(j.name)) throw new Error(`bodies.json ${row.name}: two joints called ${j.name}`);
    const parent = j.parent == null ? null : row.joints[jointIndex.get(j.parent)];
    if (j.parent != null && !parent) throw new Error(`bodies.json ${row.name}: joint ${j.name}'s parent ${j.parent} is not a joint listed before it`);
    const node = d.createNode(j.name).setTranslation(parent ? sub(j.head, parent.head) : [...j.head]);
    if (parent) nodes[jointIndex.get(j.parent)].addChild(node);
    jointIndex.set(j.name, i);
    nodes.push(node);
  }

  // One primitive per material that is not drawn inside another; a material
  // with `primitive` is that primitive's vertex colour.
  const mats = row.materials;
  const primitiveOf = (name) => {
    const m = mats[name];
    if (!m) throw new Error(`bodies.json ${row.name}: material ${JSON.stringify(name)} is not in its materials`);
    if (m.primitive && (!mats[m.primitive] || mats[m.primitive].primitive)) throw new Error(`bodies.json ${row.name}: material ${name} is drawn inside ${m.primitive}, which is not a primitive of its own`);
    return m.primitive ?? name;
  };
  const coloured = new Set(Object.values(mats).map((m) => m.primitive).filter(Boolean));
  const groups = new Map(); // primitive material -> { pos, nrm, col, jnt, idx }
  for (const part of row.parts) {
    const prim = primitiveOf(part.material);
    if (!jointIndex.has(part.joint)) throw new Error(`bodies.json ${row.name}: a part is weighted to ${JSON.stringify(part.joint)}, which is not one of its joints`);
    if (!groups.has(prim)) groups.set(prim, { pos: [], nrm: [], col: [], jnt: [], idx: [] });
    const g = groups.get(prim);
    const colour = mats[part.material].color;
    for (let face of facesOf(part)) {
      let n = unit(cross(sub(face[1], face[0]), sub(face[2], face[0])));
      const mid = face.reduce((s, p) => [s[0] + p[0] / face.length, s[1] + p[1] / face.length, s[2] + p[2] / face.length], [0, 0, 0]);
      if (dot(n, sub(mid, part.center)) < 0) { face = [...face].reverse(); n = n.map((x) => -x); }
      const base = g.pos.length / 3;
      for (const p of face) {
        g.pos.push(...p);
        g.nrm.push(...n);
        g.col.push(...colour);
        g.jnt.push(jointIndex.get(part.joint), 0, 0, 0);
      }
      for (let k = 1; k < face.length - 1; k++) g.idx.push(base, base + k, base + k + 1);
    }
  }

  const mesh = d.createMesh(row.name);
  for (const [name, g] of groups) {
    const count = g.pos.length / 3;
    const weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) weights[i * 4] = 1;
    const m = mats[name];
    const material = d.createMaterial(name)
      .setBaseColorFactor(coloured.has(name) ? [1, 1, 1, 1] : [...m.color, 1])
      .setMetallicFactor(0)
      .setRoughnessFactor(0.9);
    const prim = d.createPrimitive()
      .setMaterial(material)
      .setIndices(d.createAccessor().setType('SCALAR').setArray(new Uint16Array(g.idx)).setBuffer(buffer))
      .setAttribute('POSITION', d.createAccessor().setType('VEC3').setArray(new Float32Array(g.pos)).setBuffer(buffer))
      .setAttribute('NORMAL', d.createAccessor().setType('VEC3').setArray(new Float32Array(g.nrm)).setBuffer(buffer))
      .setAttribute('JOINTS_0', d.createAccessor().setType('VEC4').setArray(new Uint16Array(g.jnt)).setBuffer(buffer))
      .setAttribute('WEIGHTS_0', d.createAccessor().setType('VEC4').setArray(weights).setBuffer(buffer));
    if (coloured.has(name)) prim.setAttribute('COLOR_0', d.createAccessor().setType('VEC3').setArray(new Float32Array(g.col)).setBuffer(buffer));
    mesh.addPrimitive(prim);
  }

  // The skin: every joint's inverse bind is its head, negated.
  const ibm = new Float32Array(row.joints.length * 16);
  for (const [i, j] of row.joints.entries()) {
    ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -j.head[0], -j.head[1], -j.head[2], 1], i * 16);
  }
  const skin = d.createSkin(`${row.name}_Skin`)
    .setSkeleton(nodes[0])
    .setInverseBindMatrices(d.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buffer));
  for (const n of nodes) skin.addJoint(n);
  const body = d.createNode(`${row.name}_Mesh`).setMesh(mesh).setSkin(skin);
  const armature = d.createNode(row.name).addChild(nodes[0]).addChild(body);
  d.createScene(row.name).addChild(armature);
  root.setDefaultScene(root.listScenes()[0]);

  // Clips. Every clip keys every joint's rotation, and the translation of
  // every joint any clip translates, so the same (joint, path) pairs are in
  // all of them and a cross-fade never drops a bone to bind pose.
  const translated = new Set(row.clips.flatMap((c) => c.moves.filter((m) => m.path === 'translation').map((m) => m.bone)));
  for (const clip of row.clips) {
    for (const m of clip.moves) {
      if (!jointIndex.has(m.bone)) throw new Error(`bodies.json ${row.name} clip ${clip.name} moves "${m.bone}", which is not one of its joints`);
      if (m.rate != null && !Number.isInteger(m.rate)) throw new Error(`bodies.json ${row.name} clip ${clip.name}: a move's rate is ${m.rate}, not an integer`);
    }
    if (!jointIndex.has(clip.driver)) throw new Error(`bodies.json ${row.name} clip ${clip.name}'s driver "${clip.driver}" is not one of its joints`);
    const times = new Float32Array(STEPS + 1);
    for (let k = 0; k <= STEPS; k++) times[k] = (clip.seconds * k) / STEPS;
    const input = d.createAccessor(`${row.name}_${clip.name}_time`).setType('SCALAR').setArray(times).setBuffer(buffer);
    const anim = d.createAnimation(clip.name).setExtras({ generator: GENERATOR });
    const angle = (m, k) => m.rest + m.amp * Math.sin(2 * Math.PI * ((clip.cycles * (m.rate ?? 1) * k) / STEPS + m.phase));
    const channel = (node, pathName, output) => {
      const sampler = d.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
      anim.addSampler(sampler).addChannel(d.createAnimationChannel().setTargetNode(node).setTargetPath(pathName).setSampler(sampler));
    };
    for (const [i, j] of row.joints.entries()) {
      const moves = clip.moves.filter((m) => m.bone === j.name);
      const rot = new Int16Array((STEPS + 1) * 4);
      for (let k = 0; k <= STEPS; k++) {
        let q = [0, 0, 0, 1];
        for (const m of moves) if ((m.path ?? 'rotation') === 'rotation') q = qmul(axisAngle(m.axis, angle(m, k)), q);
        q = qnorm(q);
        for (let c = 0; c < 4; c++) rot[k * 4 + c] = toI16(q[c]);
      }
      channel(nodes[i], 'rotation', d.createAccessor(`${row.name}_${clip.name}_${j.name}_rotation`).setType('VEC4').setArray(rot).setNormalized(true).setBuffer(buffer));
      if (translated.has(j.name)) {
        const rest = nodes[i].getTranslation();
        const pos = new Float32Array((STEPS + 1) * 3);
        for (let k = 0; k <= STEPS; k++) {
          const p = [...rest];
          for (const m of moves) if (m.path === 'translation') {
            const a = AXES[m.axis];
            if (!a) throw new Error(`bodies.json ${row.name} clip ${clip.name}: a translation axis is ${JSON.stringify(m.axis)}, not x, y or z`);
            const off = angle(m, k);
            for (let c = 0; c < 3; c++) p[c] += a[c] * off;
          }
          pos.set(p, k * 3);
        }
        channel(nodes[i], 'translation', d.createAccessor(`${row.name}_${clip.name}_${j.name}_translation`).setType('VEC3').setArray(pos).setBuffer(buffer));
      }
    }
  }

  await d.transform(meshopt({ encoder: MeshoptEncoder, cleanup: false }));
  // Quantising a skinned mesh gives it a new skin with the quantisation folded
  // into its inverse binds and leaves the old one behind; `cleanup: false`
  // keeps it, which is how Hound.glb carries two. Only the one a node wears
  // goes in the file, so the joint cap is read off one skin.
  for (const s of root.listSkins()) {
    if (s.listParents().some((p) => p.propertyType === 'Node')) continue;
    const inverse = s.getInverseBindMatrices();
    s.dispose();
    if (inverse && inverse.listParents().every((p) => p === root)) inverse.dispose();
  }
  return out.writeBinary(d);
}

/* ---------------------------------------------------------------- main ---
 * Render all four and every animal, write the ones that differ, say which.
 * Exits non-zero on any throw, so a bad row cannot half-write the set.
 */
async function main() {
  const table = clips();
  const rendered = [];
  for (const rel of BODIES) rendered.push([rel, await renderBody(rel, table)]);
  for (const row of animals()) rendered.push([row.file, await renderAnimal(row)]);
  for (const [rel, bytes] of rendered) {
    const abs = path.join(ROOT, rel);
    const before = fs.existsSync(abs) ? fs.readFileSync(abs) : Buffer.alloc(0);
    if (before.length && Buffer.compare(before, Buffer.from(bytes)) === 0) {
      console.log(`  same   ${rel} (${bytes.length} bytes)`);
      continue;
    }
    fs.writeFileSync(abs, bytes);
    console.log(`  wrote  ${rel} (${before.length} -> ${bytes.length} bytes)`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
