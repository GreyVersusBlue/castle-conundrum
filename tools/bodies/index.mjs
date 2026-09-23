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
// Nothing else under assets/ is touched: Hen.glb does not round-trip
// gltf-transform stably (#788).
//
// RE-RUNNING IS A NO-OP. A body whose render equals what is on disk is not
// rewritten. Woman.glb grew 20,616 bytes on its first pass through
// gltf-transform, which is the writer, not the clips, and holds after that.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');

export const TABLE = path.join(HERE, 'clips.json');

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

/* ---------------------------------------------------------------- main ---
 * Render all four, write the ones that differ, say which. Exits non-zero on
 * any throw, so a bad row cannot half-write the set.
 */
async function main() {
  const table = clips();
  const rendered = [];
  for (const rel of BODIES) rendered.push([rel, await renderBody(rel, table)]);
  for (const [rel, bytes] of rendered) {
    const abs = path.join(ROOT, rel);
    const before = fs.readFileSync(abs);
    if (Buffer.compare(before, Buffer.from(bytes)) === 0) {
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
