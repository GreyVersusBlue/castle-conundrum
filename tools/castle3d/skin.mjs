#!/usr/bin/env node
// tools/castle3d/skin.mjs: the castle skin, cut from the master by stage
// (rank 2i, SPECS.md "Castle in Blender: the integration row", #963 to #968).
//
//   npm run castle3d:skin                                   skin.py, then the cut
//   npm run castle3d:skin -- --cut-only                     the cut from an existing <out>/skin/skin-full.glb
//   npm run castle3d:skin -- --stages curtain,buildings     override data/castle-skin.json's stages
//   npm run castle3d:skin -- --dest <file>                  write the cut there, not assets/castle3d/skin.glb
//   npm run castle3d:skin -- --drop <stage>                 take one stage out of the written file, no Blender
//
// In order, each step exiting non-zero on its own failure (#13):
//  1. refuse under CI (#842), as build.mjs does.
//  2. the stages: --stages, else data/castle-skin.json's `stages` (and its
//     `keep`), else refuse. The destination: --dest, else the config's `file`,
//     else assets/castle3d/skin.glb. The manifest: tools/castle3d/
//     skin-manifest.json for a destination in the repo, else skin-manifest.json
//     beside the destination, so a cut outside the repo writes nothing in it.
//  3. hash every input (#968): castle.glb and castle.blend (the master),
//     skin.py, blueprint.json, this file, data/castle-skin.json, and
//     <out>/skin/skin-full.glb. A text file is hashed with its CRLFs read as
//     LF, so a Windows checkout and CI's agree (#632). When the manifest's
//     inputs are these and the destination is the file it recorded, print
//     "unchanged" and write nothing (--cut-only compares the cut's inputs
//     alone).
//  4. unless --cut-only: find Blender as build.mjs does (CASTLE3D_BLENDER, else
//     the Steam path, never BLENDER, #840 #842), refuse anything not 5.2, and
//     run skin.py over <out>/castle.blend with PYTHONHASHSEED=0. castle.blend's
//     sha256 is taken before and after, and a run that moved it fails: skin.py
//     never saves the master (#963).
//  5. the cut, with the pinned @gltf-transform/core: keep the nodes whose
//     extras.stage is listed and whose plan id is not in `keep`; prune; drop
//     KHR_materials_specular and KHR_materials_ior so three builds the game's
//     MeshStandardMaterial; the leaf materials to MASK at 0.5 (#968). Written
//     raw: KTX2 and meshopt are `npm run assets:encode`'s (#967).
//     Before the cut, every texture is held to skin.py's caps by glTF slot.
//  6. measure: per stage, draws (primitives placed) and triangles placed;
//     cumulative to each stage, images, texture memory as RGBA8 with full mips
//     (#963's calibration) and as KTX2 at budget.mjs's fromKTX2 rates, ETC1S
//     0.5 and UASTC 1 byte a pixel by glTF slot as encode-assets.mjs picks
//     (#507), a PNG of 128 px or under as RGBA8 times 4/3 (#831).
//  7. the manifest, its newline taken from the file when it exists (#632).
//
// Windows: an absolute import() would need pathToFileURL; this file imports
// only packages and relative modules, and spawns Blender with an argument
// array, no shell, so nothing here leans on brace expansion.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NodeIO, ImageUtils } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, cloneDocument, listTextureSlots } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { eolOf } from '../place.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const STEAM_BLENDER = path.join('C:\\', 'Program Files (x86)', 'Steam', 'steamapps', 'common', 'Blender', 'blender.exe');
const DEFAULT_OUT = path.join('C:\\', 'Users', 'devon', 'OneDrive', 'Documents', 'Claude Files', 'Blender Projects', 'Castle', 'castle3d');

export const SKIN_STAGES = ['curtain', 'buildings', 'town', 'land'];
export const CONFIG = path.join(ROOT, 'data', 'castle-skin.json');
export const DEFAULT_DEST = 'assets/castle3d/skin.glb';
export const REPO_MANIFEST = path.join(HERE, 'skin-manifest.json');
const DROPPED_EXTENSIONS = ['KHR_materials_specular', 'KHR_materials_ior'];
const LEAF_CUTOFF = 0.5;
const UASTC_GLTF_SLOTS = ['normalTexture', 'occlusionTexture', 'metallicRoughnessTexture']; // encode-assets.mjs (#507)
const SMALL_PX = 128; // #831
const MB = 1048576;
// skin.py's caps (#968), held again over what the exporter wrote: a texture in
// one of these slots larger on either side fails the run before anything is
// written. Poly Haven's leaves keep their BSDF in a node group, and a cap pass
// that did not walk groups once left their normal and roughness at 1024.
export const CAPS = { baseColorTexture: 1024, emissiveTexture: 1024, normalTexture: 512, metallicRoughnessTexture: 512,
  occlusionTexture: 512 };

const refuse = (msg) => { console.error(`castle3d:skin: ${msg}`); process.exit(1); };

/** True when `p` is the repo root or under it. Case-blind on Windows (build.mjs's insideRepo). */
export function insideRepo(p, root = ROOT) {
  const norm = (x) => (process.platform === 'win32' ? path.resolve(x).toLowerCase() : path.resolve(x));
  const rel = path.relative(norm(root), norm(p));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** sha256 of a binary file, streamed. */
export function sha256File(file) {
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

/** sha256 of a text, its CRLFs read as LF, so a checkout's line endings do not move it (#632). */
export const sha256Text = (text) => crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
const sha256TextFile = (file) => (fs.existsSync(file) ? sha256Text(fs.readFileSync(file, 'utf8')) : null);

function parseArgs(argv) {
  const a = { cutOnly: false, stages: null, dest: null, drop: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const val = () => { const v = argv[++i]; if (!v) refuse(`${k} needs a value`); return v; };
    if (k === '--cut-only') a.cutOnly = true;
    else if (k === '--stages') a.stages = val().split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--dest') a.dest = val();
    else if (k === '--drop') a.drop = val();
    else refuse(`unknown argument ${k}`);
  }
  if (a.drop && (a.cutOnly || a.stages)) refuse('--drop takes a stage out of the written file and goes with nothing but --dest');
  return a;
}

/** Stages in SKIN_STAGES' order; refuses an unknown or repeated one. */
export function orderStages(list) {
  const bad = list.filter((s) => !SKIN_STAGES.includes(s));
  if (bad.length) throw new Error(`no stage ${bad.join(', ')}; the stages are ${SKIN_STAGES.join(', ')} (#964)`);
  if (new Set(list).size !== list.length) throw new Error(`a stage is listed twice in ${list.join(',')}`);
  if (!list.length) throw new Error('no stages listed');
  return SKIN_STAGES.filter((s) => list.includes(s));
}

const idsOf = (extras) => [
  ...(extras.planId !== undefined ? [String(extras.planId)] : []),
  ...(Array.isArray(extras.planIds) ? extras.planIds.map(String) : []),
];

let io = null;
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
 * Cuts `doc` in place to `stages` less `keep`: every node whose extras.stage
 * is not listed, or which names a kept plan id, goes; then prune, the two
 * extensions, and the leaves to MASK. Throws on a node with no stage, since
 * skin.py stages every object it exports.
 */
export async function cut(doc, stages, keep = []) {
  const root = doc.getRoot();
  const kept = new Set(keep);
  const unstaged = root.listNodes().filter((n) => typeof n.getExtras().stage !== 'string').map((n) => n.getName());
  if (unstaged.length) throw new Error(`${unstaged.length} node(s) carry no extras.stage: ${unstaged.slice(0, 8).join(', ')}`);
  for (const node of root.listNodes()) {
    const x = node.getExtras();
    if (!stages.includes(x.stage) || idsOf(x).some((id) => kept.has(id))) node.dispose();
  }
  await doc.transform(prune({ keepAttributes: true, keepSolidTextures: true }));
  for (const ext of root.listExtensionsUsed()) if (DROPPED_EXTENSIONS.includes(ext.extensionName)) ext.dispose();
  const masked = [];
  for (const m of root.listMaterials()) {
    if (m.getAlphaMode() === 'BLEND' && /leaves/.test(m.getName())) {
      m.setAlphaMode('MASK');
      m.setAlphaCutoff(LEAF_CUTOFF);
      masked.push(m.getName());
    }
  }
  return { masked };
}

/** The KTX2 bytes on the GPU a texture of w x h would take at `perPixel`, full chain (budget.mjs's fromKTX2). */
const chain = (w, h, perPixel) => {
  let bytes = 0;
  const levels = Math.floor(Math.log2(Math.max(w, h))) + 1;
  for (let i = 0; i < levels; i++) bytes += Math.max(1, w >> i) * Math.max(1, h >> i) * perPixel;
  return bytes;
};

/** Draws and triangles placed, images, RGBA8 and projected KTX2 texture memory. */
export function measure(doc) {
  const root = doc.getRoot();
  let draws = 0;
  let triangles = 0;
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    for (const prim of mesh.listPrimitives()) {
      draws += 1;
      const idx = prim.getIndices();
      const count = idx ? idx.getCount() : prim.getAttribute('POSITION').getCount();
      if (prim.getMode() === 4) triangles += count / 3;
      else if (prim.getMode() === 5 || prim.getMode() === 6) triangles += Math.max(0, count - 2);
    }
  }
  let rgba8 = 0;
  let ktx2 = 0;
  const textures = root.listTextures();
  for (const tex of textures) {
    const data = tex.getImage();
    const mime = tex.getMimeType();
    const [w, h] = tex.getSize() || [0, 0];
    rgba8 += (data && ImageUtils.getVRAMByteLength(data, mime)) || 0;
    if (mime === 'image/png' && w <= SMALL_PX && h <= SMALL_PX) ktx2 += (w * h * 4 * 4) / 3;
    else ktx2 += chain(w, h, listTextureSlots(tex).some((s) => UASTC_GLTF_SLOTS.includes(s)) ? 1 : 0.5);
  }
  return { draws, triangles, images: textures.length, rgba8MB: +(rgba8 / MB).toFixed(1), ktx2MB: +(ktx2 / MB).toFixed(1) };
}

/** Each texture over its slot's cap, as a line naming it. */
export function overCaps(doc) {
  const bad = [];
  for (const tex of doc.getRoot().listTextures()) {
    const [w, h] = tex.getSize() || [0, 0];
    for (const slot of listTextureSlots(tex)) {
      if (CAPS[slot] !== undefined && Math.max(w, h) > CAPS[slot]) {
        bad.push(`${tex.getName() || '(unnamed)'} is ${w}x${h} in ${slot}; the cap is ${CAPS[slot]} (#968)`);
      }
    }
  }
  return bad;
}

/** Per stage, its own draws and triangles; cumulative to it, images and texture memory. */
async function measureStages(full, keep) {
  const rows = {};
  for (let i = 0; i < SKIN_STAGES.length; i++) {
    const s = SKIN_STAGES[i];
    const alone = cloneDocument(full);
    await cut(alone, [s], keep);
    const upTo = cloneDocument(full);
    await cut(upTo, SKIN_STAGES.slice(0, i + 1), keep);
    const a = measure(alone);
    const c = measure(upTo);
    rows[s] = { draws: a.draws, triangles: a.triangles, imagesCumulative: c.images, rgba8MBCumulative: c.rgba8MB,
      ktx2MBCumulative: c.ktx2MB };
  }
  return rows;
}

function writeManifest(file, doc) {
  const eol = fs.existsSync(file) ? eolOf(fs.readFileSync(file, 'utf8')) : '\n';
  const text = JSON.stringify(doc, null, 2).replace(/\n/g, eol) + eol;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.part`, text);
  fs.renameSync(`${file}.part`, file);
}

const shown = (p) => (insideRepo(p) ? path.relative(ROOT, p).split(path.sep).join('/') : p);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function findBlender() {
  const exe = process.env.CASTLE3D_BLENDER || STEAM_BLENDER;
  const via = process.env.CASTLE3D_BLENDER ? 'CASTLE3D_BLENDER' : 'the Steam path';
  if (!fs.existsSync(exe)) refuse(`no Blender at ${exe} (from ${via}); set CASTLE3D_BLENDER to a Blender 5.2`);
  const v = spawnSync(exe, ['--version'], { encoding: 'utf8' });
  if (v.error) refuse(`${exe} --version did not run: ${v.error.message}`);
  const first = (v.stdout || '').split(/\r?\n/).find((l) => l.trim()) || '';
  if (!first.startsWith('Blender 5.2')) {
    refuse(`${exe} (from ${via}) says "${first.trim() || '(nothing)'}", not "Blender 5.2"; this family is pinned to 5.2 (#840)`);
  }
  console.log(`castle3d:skin: ${first.trim()} at ${exe}`);
  return exe;
}

async function drop(stage, dest, manifestPath) {
  if (!fs.existsSync(dest)) refuse(`--drop: ${dest} does not exist`);
  if (!fs.existsSync(manifestPath)) refuse(`--drop: no manifest ${manifestPath} beside the file`);
  const man = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!man.stages.includes(stage)) refuse(`--drop ${stage}: ${shown(dest)} holds ${man.stages.join(', ')}`);
  const doc = await (await reader()).read(dest);
  let gone = 0;
  for (const node of doc.getRoot().listNodes()) if (node.getExtras().stage === stage) { node.dispose(); gone += 1; }
  await doc.transform(prune({ keepAttributes: true, keepSolidTextures: true }));
  const bytes = Buffer.from(await (await reader()).writeBinary(doc));
  fs.writeFileSync(`${dest}.part`, bytes);
  fs.renameSync(`${dest}.part`, dest);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  const stages = man.stages.filter((s) => s !== stage);
  const key = man.encoded ? 'encoded' : 'cut';
  writeManifest(manifestPath, { ...man, stages, [key]: { bytes: bytes.length, sha256: sha }, dropped: [...(man.dropped || []), stage] });
  if (fs.existsSync(CONFIG)) {
    const text = fs.readFileSync(CONFIG, 'utf8');
    const cfg = JSON.parse(text);
    if (Array.isArray(cfg.stages) && cfg.stages.includes(stage) && path.resolve(ROOT, cfg.file || DEFAULT_DEST) === path.resolve(dest)) {
      const eol = eolOf(text);
      fs.writeFileSync(CONFIG, JSON.stringify({ ...cfg, stages: cfg.stages.filter((s) => s !== stage) }, null, 2).replace(/\n/g, eol) + eol);
      console.log(`castle3d:skin: ${shown(CONFIG)} no longer lists ${stage}`);
    }
  }
  console.log(`castle3d:skin: dropped ${stage} (${gone} nodes) from ${shown(dest)}: ${bytes.length} bytes, sha256 ${sha}; stages ${stages.join(', ') || '(none)'}`);
}

async function main() {
  // 1. never under CI (#842)
  if (process.env.CI !== undefined && process.env.CI !== '') {
    refuse(`CI is set (${JSON.stringify(process.env.CI)}); the skin is cut on Devon's machine only and never in CI (#842)`);
  }
  const args = parseArgs(process.argv.slice(2));

  // 2. stages, keep, destination, manifest
  const cfgText = fs.existsSync(CONFIG) ? fs.readFileSync(CONFIG, 'utf8') : null;
  const cfg = cfgText ? JSON.parse(cfgText) : null;
  const dest = path.resolve(ROOT, args.dest || (cfg && cfg.file) || DEFAULT_DEST);
  const manifestPath = insideRepo(dest) ? REPO_MANIFEST : path.join(path.dirname(dest), 'skin-manifest.json');
  if (args.drop) { await drop(args.drop, dest, manifestPath); return; }
  let stages;
  try {
    const list = args.stages || (cfg && cfg.stages);
    if (!list) throw new Error(`no stages: pass --stages, or list them in ${shown(CONFIG)}`);
    stages = orderStages(list);
  } catch (e) { refuse(e.message); }
  const keep = (cfg && cfg.keep) || [];

  const out = path.resolve(process.env.CASTLE3D_OUT || DEFAULT_OUT);
  if (insideRepo(out)) refuse(`output folder ${out} is inside the repo ${ROOT}; the model lives outside it (#841)`);
  const master = path.join(out, 'castle.blend');
  const masterGlb = path.join(out, 'castle.glb');
  const blueprint = path.join(out, 'blueprint.json');
  const skinFull = path.join(out, 'skin', 'skin-full.glb');
  const skinPy = path.join(HERE, 'skin.py');

  // 3. the inputs, and "unchanged"
  const cutInputs = {
    'skin.mjs': sha256TextFile(fileURLToPath(import.meta.url)),
    'data/castle-skin.json': cfgText === null ? null : sha256Text(cfgText),
    stages,
    keep,
  };
  let upstream = null;
  if (!args.cutOnly) {
    for (const f of [master, masterGlb, blueprint]) if (!fs.existsSync(f)) refuse(`${f} does not exist; run npm run castle3d:build`);
    upstream = {
      'castle.glb': sha256File(masterGlb),
      'castle.blend': sha256File(master),
      'skin.py': sha256TextFile(skinPy),
      'blueprint.json': sha256File(blueprint),
    };
  }
  const prev = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
  if (prev && fs.existsSync(skinFull) && fs.existsSync(dest)) {
    const destSha = sha256File(dest);
    const fullSha = sha256File(skinFull);
    const wrote = [prev.cut && prev.cut.sha256, prev.encoded && prev.encoded.sha256].filter(Boolean);
    if (same(prev.inputs && prev.inputs.cut, cutInputs) && prev.inputs['skin-full.glb'] === fullSha
      && (args.cutOnly || same(prev.inputs.upstream, upstream)) && wrote.includes(destSha)) {
      console.log(`castle3d:skin: unchanged: ${shown(dest)} sha256 ${destSha} is ${stages.join(', ')} cut from `
        + `skin-full.glb ${fullSha}, and no input has moved since ${shown(manifestPath)}; nothing written`);
      return;
    }
  }

  // 4. skin.py, unless --cut-only
  if (!args.cutOnly) {
    const exe = findBlender();
    const before = upstream['castle.blend'];
    const cmd = ['-b', master, '--factory-startup', '--python-exit-code', '1', '--python', skinPy, '--', '--out', out];
    console.log(`castle3d:skin: ${path.basename(exe)} ${cmd.join(' ')}`);
    const r = spawnSync(exe, cmd, { stdio: 'inherit', env: { ...process.env, PYTHONHASHSEED: '0' } });
    if (r.error) refuse(`could not run ${exe}: ${r.error.message}`);
    if (r.status !== 0) refuse(`skin.py exited ${r.status} over ${master}`);
    const after = sha256File(master);
    if (after !== before) refuse(`castle.blend's sha256 moved from ${before} to ${after}; skin.py never saves the master (#963)`);
    console.log(`castle3d:skin: castle.blend unmoved, sha256 ${after}`);
  }
  if (!fs.existsSync(skinFull)) refuse(`${skinFull} does not exist; run without --cut-only`);
  const fullSha = sha256File(skinFull);
  if (args.cutOnly) {
    // the master's provenance carries over only when the manifest recorded this very skin-full.glb
    upstream = prev && prev.inputs && prev.inputs['skin-full.glb'] === fullSha ? prev.inputs.upstream : null;
  }

  // 5. the cut, and 6. the numbers
  const full = await (await reader()).read(skinFull);
  const over = overCaps(full);
  if (over.length) refuse(`${over.length} texture(s) in skin-full.glb over their caps, nothing written: ${over.join('; ')}`);
  const perStage = await measureStages(full, keep);
  const doc = cloneDocument(full);
  const { masked } = await cut(doc, stages, keep);
  const m = measure(doc);
  const bytes = Buffer.from(await (await reader()).writeBinary(doc));
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(`${dest}.part`, bytes);
  fs.renameSync(`${dest}.part`, dest);

  for (const s of SKIN_STAGES) {
    const r = perStage[s];
    console.log(`castle3d:skin: stage ${s.padEnd(9)} ${String(r.draws).padStart(4)} draws, ${String(r.triangles).padStart(7)} triangles; `
      + `to here ${r.imagesCumulative} images, ${r.rgba8MBCumulative} MB as RGBA8, ${r.ktx2MBCumulative} MB as KTX2`);
  }
  console.log(`castle3d:skin: wrote ${shown(dest)}: ${stages.join(', ')}, ${bytes.length} bytes, sha256 ${sha}; `
    + `${m.draws} draws, ${m.triangles} triangles, ${m.images} images, ${m.ktx2MB} MB as KTX2; `
    + `${DROPPED_EXTENSIONS.join(' and ')} dropped; MASK at ${LEAF_CUTOFF}: ${masked.join(', ') || 'no leaf material in the cut'}`);

  // 7. the manifest
  writeManifest(manifestPath, {
    comment: 'castle3d:skin\'s record (#968): the inputs\' sha256 and the cut it wrote. A text input is hashed with '
      + 'CRLF read as LF (#632). Per stage, draws and triangles are the stage alone; images and texture memory are '
      + 'cumulative to it, KTX2 projected at budget.mjs\'s fromKTX2 rates.',
    file: shown(dest),
    stages,
    keep,
    inputs: { upstream, 'skin-full.glb': fullSha, cut: cutInputs },
    cut: { bytes: bytes.length, sha256: sha },
    measured: perStage,
  });
  console.log(`castle3d:skin: recorded ${shown(manifestPath)}`);
}

main().catch((e) => refuse(e.stack || String(e)));
