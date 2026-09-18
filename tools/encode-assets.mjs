#!/usr/bin/env node
// encode-assets.mjs — re-encode assets/ for the GPU, in place, once.
//
//   node tools/encode-assets.mjs          (from the repo root)
//   npm run assets:encode
//
// WHAT THIS IS FOR. Every 1k jpg under assets/ used to be decoded to 4 MB of
// RGBA in video memory and every mesh shipped as raw float glTF. This script
// turns the textures into KTX2/Basis, which stays compressed on the GPU, and
// the geometry into EXT_meshopt_compression, which three r169 reads with the
// loaders it already ships. It writes over the originals: git history is the
// originals (#390's reasoning) and a second copy on disk is exactly what
// test/assets.mjs check 4 exists to refuse (#506).
//
// It is a COMMITTED re-encode, not a build step (#506). Seven suites read
// assets/ off disk at repo-relative paths, test/built.mjs diffs the file set
// the dev server and the bundle serve, and a build-time pipeline would make
// those two differ by construction. So this runs by hand, its output is
// committed, and `npm run build` still just copies.
//
// This is a deliverable rather than a convenience: BACKLOG ranks 2 (a fourth
// body) and 7 (the town side) both add assets, and an asset that did not come
// through here is an uncompressed one nothing would notice.
//
// WHAT IT NEEDS. KTX-Software's `ktx` on PATH, 4.3 or newer. That is the tool
// @gltf-transform/cli shells out to for the same job; this script uses the
// three @gltf-transform libraries that CLI wraps and shells `ktx` itself, so
// it can pick a codec per texture SLOT rather than per file — a normal map and
// the diffuse beside it in the same material want different codecs (#507).
// Point KTX at it if it is not on PATH:
//
//   KTX=/path/to/ktx node tools/encode-assets.mjs
//
// Re-running is safe. A texture already in KTX2 and a file already carrying
// EXT_meshopt_compression are both skipped, so adding one asset and re-running
// encodes that asset and nothing else.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRTextureBasisu } from '@gltf-transform/extensions';
import { dedup, meshopt, listTextureSlots } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const KTX = process.env.KTX || 'ktx';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'castle-encode-'));

/* ---------------------------------------------------------------- codecs ---
 * ETC1S (basis-lz) for colour, UASTC for anything whose channels mean
 * different things (#507).
 *
 * ETC1S quantises RGB jointly against a shared palette, which is right for a
 * photograph of stone and wrong for a normal map, whose three channels are the
 * x, y and z of a direction, and equally wrong for an ARM map, whose three
 * channels are ambient occlusion, roughness and metalness. src/assets.js feeds
 * an ARM map's blue channel straight into `metalness`, so colour bleed between
 * its channels is not a soft artefact: it is 8 m of castle wall rendering as
 * sheet metal, which is the failure loadPBRMaterial's own comment describes.
 *
 * A `rough` map is one channel of the same number repeated and takes ETC1S
 * without complaint.
 *
 * UASTC at 1k is about 1 MB before supercompression, which is LARGER than the
 * jpg it replaces. That is allowed and expected: the 200 MB ceiling (#499) has
 * 158 MB of headroom and the number this row exists to move is video memory,
 * where UASTC is 1 byte per pixel against RGBA8's 4.
 */
const UASTC = ['normal', 'arm'];
const UASTC_GLTF_SLOTS = ['normalTexture', 'occlusionTexture', 'metallicRoughnessTexture'];
const SRGB_GLTF_SLOTS = ['baseColorTexture', 'emissiveTexture'];

/**
 * One image to one .ktx2 on disk.
 *
 * Every input goes through sharp to a 3-channel PNG first. Four of the `rough`
 * maps are single-channel greyscale JPEGs, and `ktx create --format R8_UNORM`
 * would hand back a red-only texture — three reads roughness out of GREEN, so
 * that texture is a roughness of zero everywhere and a castle of mirrors.
 * Widening to three channels costs nothing after Basis has deduplicated them.
 */
async function toKTX2(src, out, { srgb, codec }) {
  const png = path.join(TMP, `${path.basename(out, '.ktx2')}.png`);
  await sharp(src).removeAlpha().toColourspace('srgb').png({ compressionLevel: 1 }).toFile(png);
  const args = [
    'create',
    '--format', srgb ? 'R8G8B8_SRGB' : 'R8G8B8_UNORM',
    '--assign-tf', srgb ? 'srgb' : 'linear',
    '--generate-mipmap',
    '--encode', codec,
  ];
  // qlevel 200 of 255: the default 128 visibly posterises a 1k stone diffuse.
  if (codec === 'basis-lz') args.push('--clevel', '4', '--qlevel', '200');
  // RDO at lambda 1.0 makes the UASTC payload compress; zstd 18 is what then
  // takes it down. Without the pair a UASTC map is a flat 1 MB per level.
  else args.push('--uastc-quality', '2', '--uastc-rdo', '--uastc-rdo-l', '1.0', '--zstd', '18');
  execFileSync(KTX, [...args, png, out], { stdio: ['ignore', 'ignore', 'inherit'] });
  fs.rmSync(png);
}

const MB = (n) => `${(n / 1048576).toFixed(2)} MB`;
const sizeOf = (f) => fs.statSync(f).size;
const totals = { texturesBefore: 0, texturesAfter: 0, meshBefore: 0, meshAfter: 0 };

/* ------------------------------------------- 1: the standalone map sets ---
 * Ten Poly Haven texture packs that carry no model at all: their maps are
 * named one by one by data/scene-config.json's `materials`, loaded by
 * src/assets.js's loadPBRMaterial, and applied to the walls, the grounds, the
 * floors and the gate leaves. Nothing about them is glTF, so they are encoded
 * straight and the config's paths are rewritten from .jpg to .ktx2.
 */
async function encodeMaterialMaps() {
  const configFile = path.join(ROOT, 'data/scene-config.json');
  let text = fs.readFileSync(configFile, 'utf8');
  const config = JSON.parse(text);
  let done = 0;

  for (const [name, spec] of Object.entries(config.materials)) {
    for (const [slot, rel] of Object.entries(spec)) {
      if (rel.endsWith('.ktx2')) continue;
      const src = path.join(ROOT, rel);
      const outRel = rel.replace(/\.(jpe?g|png)$/i, '.ktx2');
      const out = path.join(ROOT, outRel);
      const codec = UASTC.includes(slot) ? 'uastc' : 'basis-lz';
      process.stdout.write(`  ${name}.${slot} ${codec} `);
      totals.texturesBefore += sizeOf(src);
      await toKTX2(src, out, { srgb: slot === 'diffuse', codec });
      totals.texturesAfter += sizeOf(out);
      console.log(`${MB(sizeOf(src))} -> ${MB(sizeOf(out))}`);
      fs.rmSync(src);
      // The path, not the whole file: data/scene-config.json is 67 KB of hand
      // formatting and a JSON.stringify round-trip would rewrite all of it.
      text = text.split(JSON.stringify(rel)).join(JSON.stringify(outRel));
      done++;
    }
  }
  fs.writeFileSync(configFile, text);
  console.log(`  ${done} map(s) re-encoded, data/scene-config.json rewritten\n`);
}

/* ------------------------------------------------- 2 & 3: the glTF files ---
 * The ten Poly Haven prop packs (.gltf + .bin + textures/) and the
 * Quaternius NPC bodies (.glb, zero images, 24 animation clips each).
 *
 * meshopt is applied to both and NOT to the Kenney kit (#508). The kit is
 * 2.1 MB across 106 GLBs of 64 px pixel art and the saving would not pay for
 * the risk: test/assets.mjs measures the gate archway's opening out of
 * wall-fortified-gate.glb triangle by triangle, and that is the one
 * measurement in the project that reads raw index and position buffers.
 */
async function encodeGLTF(file, { textures, mesh }) {
  // The encoder and decoder are dependencies of EXT_meshopt_compression rather
  // than arguments to it: the extension reaches for `meshopt.encoder` when it
  // writes and `meshopt.decoder` when it reads. Both, because re-running this
  // script has to be able to READ a file it compressed last time.
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.read(file);
  const dir = path.dirname(file);
  const before = { tex: 0, mesh: 0 };
  const label = path.relative(ROOT, file);

  const bufferNames = doc.getRoot().listBuffers().map((b) => b.getURI());
  const already = doc.getRoot().listExtensionsUsed().map((e) => e.extensionName);

  if (mesh && !already.includes('EXT_meshopt_compression')) {
    for (const b of doc.getRoot().listBuffers()) {
      const uri = b.getURI();
      if (uri) before.mesh += sizeOf(path.join(dir, uri));
    }
    if (!before.mesh) before.mesh = sizeOf(file);
    // cleanup off: prune() and dedup() would be free to merge or drop nodes and
    // primitives, and src/castle-plan.js's boxes are a union of PER-PRIMITIVE
    // bounds with each node's transform applied (test/gltf.mjs's partsOf).
    // Changing how many primitives a file has changes that union.
    await doc.transform(meshopt({ encoder: MeshoptEncoder, cleanup: false }));
    // Back to the name the file arrived with, so a diff of the directory is one
    // line per file rather than a rename plus an orphan.
    doc.getRoot().listBuffers().forEach((b, i) => { if (bufferNames[i]) b.setURI(bufferNames[i]); });
  }

  const retired = [];
  if (textures) {
    // Poly Haven ship brass_candleholders with its flame map listed twice, as
    // two images with the same URI, and encoding each separately writes two
    // different encodings of the same picture to one filename. Textures only:
    // dedup over meshes or accessors would be free to change how many
    // primitives a file has, which is what partsOf measures.
    await doc.transform(dedup({ propertyTypes: [PropertyType.TEXTURE] }));
    for (const tex of doc.getRoot().listTextures()) {
      if (tex.getMimeType() === 'image/ktx2') continue;
      const uri = tex.getURI();
      const slots = listTextureSlots(tex);
      const srgb = slots.some((s) => SRGB_GLTF_SLOTS.includes(s));
      const codec = slots.some((s) => UASTC_GLTF_SLOTS.includes(s)) ? 'uastc' : 'basis-lz';
      const stem = (uri ? path.basename(uri).replace(/\.\w+$/, '') : tex.getName() || 'texture');
      const srcTmp = path.join(TMP, `${stem}-src`);
      fs.writeFileSync(srcTmp, Buffer.from(tex.getImage()));
      const outTmp = path.join(TMP, `${stem}.ktx2`);
      before.tex += tex.getImage().byteLength;
      await toKTX2(srcTmp, outTmp, { srgb, codec });
      tex.setImage(new Uint8Array(fs.readFileSync(outTmp))).setMimeType('image/ktx2');
      if (uri) {
        tex.setURI(uri.replace(/\.\w+$/, '.ktx2'));
        retired.push(path.join(dir, uri));
      }
      fs.rmSync(srcTmp); fs.rmSync(outTmp);
    }
    // Required, not optional: there is no jpg left to fall back to, and a
    // loader without KTX2 should say so rather than render an untextured prop.
    if (!already.includes('KHR_texture_basisu')) doc.createExtension(KHRTextureBasisu).setRequired(true);
  }

  // A file with nothing left to encode is not rewritten. On a CRLF checkout the
  // writer's LF turned ten untouched Poly Haven .gltf files into ten diffs.
  if (!before.tex && !before.mesh) { console.log(`  ${label}: nothing to do`); return; }

  await io.write(file, doc);
  for (const old of retired) if (fs.existsSync(old)) fs.rmSync(old);

  const after = { tex: 0, mesh: 0 };
  const written = await io.readAsJSON(file).catch(() => null);
  for (const tex of (written?.json.images || [])) {
    if (tex.uri) after.tex += sizeOf(path.join(dir, decodeURIComponent(tex.uri)));
  }
  for (const b of (written?.json.buffers || [])) {
    if (b.uri) after.mesh += sizeOf(path.join(dir, decodeURIComponent(b.uri)));
  }
  if (!after.mesh && mesh) after.mesh = sizeOf(file);

  totals.texturesBefore += before.tex; totals.texturesAfter += after.tex;
  totals.meshBefore += before.mesh; totals.meshAfter += after.mesh;
  const bits = [];
  if (before.tex) bits.push(`textures ${MB(before.tex)} -> ${MB(after.tex)}`);
  if (before.mesh) bits.push(`geometry ${MB(before.mesh)} -> ${MB(after.mesh)}`);
  console.log(`  ${label}: ${bits.join(', ') || 'nothing to do'}`);
}

/* ----------------------------------------------------------------- main ---- */

try {
  const version = execFileSync(KTX, ['--version'], { encoding: 'utf8' }).trim();
  console.log(`encode-assets, using ${version}\n`);
} catch {
  // A check that only prints is a check that gets ignored (#13), and so is a
  // pipeline that silently encodes nothing.
  console.error(`encode-assets: cannot run \`${KTX}\`.

KTX-Software's \`ktx\` (4.3 or newer) has to be on PATH, or named in KTX=.
It is what @gltf-transform/cli shells out to for the same job. Build it from
https://github.com/KhronosGroup/KTX-Software, or install a release.`);
  process.exit(1);
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

console.log('the ten material map sets, named one by one by data/scene-config.json');
await encodeMaterialMaps();

console.log('the ten Poly Haven prop packs');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));
const npcs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/npcs.json'), 'utf8'));
const props = new Set([
  ...config.interiorProps.map((p) => config.polyhavenBase + p.model),
  ...npcs.cast.filter((n) => n.heldProp).map((n) => config.polyhavenBase + n.heldProp),
]);
for (const rel of [...props].sort()) await encodeGLTF(path.join(ROOT, rel), { textures: true, mesh: true });

console.log('\nthe NPC bodies');
// The household's bodies too (#645). Until the hound, every body the populace
// wore was one the cast already named; the first one it did not would have
// landed raw with every suite green, which is #605's lesson at a second door.
const populace = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/populace.json'), 'utf8'));
const bodies = new Set([...npcs.cast.map((n) => n.modelPath), ...(populace.people ?? []).map((p) => p.modelPath)]);
for (const rel of [...bodies].sort())
  await encodeGLTF(path.join(ROOT, rel), { textures: false, mesh: true });

fs.rmSync(TMP, { recursive: true, force: true });

console.log(`
textures  ${MB(totals.texturesBefore)} -> ${MB(totals.texturesAfter)} on disk
geometry  ${MB(totals.meshBefore)} -> ${MB(totals.meshAfter)} on disk

Disk is not the point and may go up: UASTC is bigger than the jpg it replaces.
What moved is video memory, and renderer.info.memory off the live page is where
that number comes from.`);
