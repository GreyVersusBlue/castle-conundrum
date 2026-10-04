// finish.mjs — the Node half of a Blender render, and the only writer of the
// bytes that are committed (#806).
//
// Blender exports into tools/blender/.staging/, which is gitignored, because
// the exporter's bytes are not trusted: it stamps its own and Blender's
// version into `asset.generator`, and it cannot write meshopt. So this reads
// what landed with gltf-transform, sets the generator to a fixed string,
// drops `asset.copyright` and every `extras`, applies the same
// `meshopt({ encoder, cleanup: false })` tools/encode-assets.mjs and
// tools/bodies/ make, and hands back the bytes and the manifest row.
// render.mjs decides whether either is new.
//
// A skinned file takes two more steps (#820, #823), and a file with no skin
// takes neither, so its bytes are what they were. gltf-transform's quantize
// folds each mesh's position scale into a copy of the skin's inverse bind
// matrices, one copy per mesh, so folk.glb's one armature left here as 23
// skins, where the pack's rail and three's one Skeleton per skin both want
// one. So a skinned file is quantized over the scene's volume, not each
// mesh's, which makes every copy the same matrices, and then the copies and
// every equal accessor are merged and what nothing references is dropped.
//
// `sourceHash` is exported from here so test/assets.mjs check 8 and the
// writer agree by import. Check 8's line 5 is what stops that being a test
// that re-implements its subject: it builds each input as LF and as CRLF and
// asks this function for both.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, dedup, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, '..', '..');
export const GENERATOR = 'castle-conundrum tools/blender';

/** A row's committed file, repo-relative with forward slashes. */
export const fileOf = (row) => `assets/blender/${row.pack}/${row.name}.glb`;

/** JSON with every object's keys sorted, at every depth. */
export function sortedJSON(value) {
  if (Array.isArray(value)) return `[${value.map(sortedJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${sortedJSON(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * The source hash over texts already read: `common.py`, the row's script,
 * this file, in that order, each normalised to LF first so a CRLF checkout
 * and an LF one hash the same (#632), and then the row with its keys sorted.
 */
export function sourceOf({ common, script, finish }, row) {
  const h = crypto.createHash('sha256');
  for (const [name, text] of [['common.py', common], [row.script, script], ['finish.mjs', finish]]) {
    h.update(`${name}\0`);
    h.update(text.replace(/\r\n/g, '\n'));
    h.update('\0');
  }
  h.update(sortedJSON(row));
  return h.digest('hex');
}

/** The texts `sourceOf` reads, as they are on disk. */
export function sourceTexts(row) {
  const read = (rel) => fs.readFileSync(path.join(HERE, rel), 'utf8');
  return { common: read('common.py'), script: read(path.join('packs', row.script)), finish: read('finish.mjs') };
}

/** The source hash of a row as the tree stands. */
export function sourceHash(row) {
  return sourceOf(sourceTexts(row), row);
}

let io = null;
async function reader() {
  if (io) return io;
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  return io;
}

/**
 * `staged` is the .glb Blender wrote; `${staged}.json` beside it carries
 * `bpy.app.version_string`, which common.py's export() writes.
 * Returns `{ bytes, manifestRow }`.
 */
export async function finish(staged, row) {
  const { blender } = JSON.parse(fs.readFileSync(`${staged}.json`, 'utf8'));
  const doc = await (await reader()).read(staged);
  const root = doc.getRoot();
  const asset = root.getAsset();
  asset.generator = GENERATOR;
  delete asset.copyright;
  delete asset.extras;
  for (const prop of [root, ...root.listScenes(), ...root.listNodes(), ...root.listMeshes(),
    ...root.listMeshes().flatMap((m) => m.listPrimitives()), ...root.listMaterials(),
    ...root.listTextures(), ...root.listAccessors(), ...root.listBuffers()]) {
    prop.setExtras({});
  }
  if (root.listSkins().length === 0) {
    await doc.transform(meshopt({ encoder: MeshoptEncoder, cleanup: false }));
  } else {
    await doc.transform(
      meshopt({ encoder: MeshoptEncoder, cleanup: false, quantizationVolume: 'scene' }),
      dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.SKIN] }),
      prune({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.SKIN], keepAttributes: true, keepIndices: true, keepLeaves: true }),
    );
  }
  const bytes = Buffer.from(await (await reader()).writeBinary(doc));

  let triangles = 0;
  for (const prim of root.listMeshes().flatMap((m) => m.listPrimitives())) {
    if (prim.getMode() !== 4) throw new Error(`${fileOf(row)}: a primitive in mode ${prim.getMode()}, not triangles`);
    const idx = prim.getIndices();
    triangles += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3;
  }
  const images = root.listTextures().map((t) => t.getSize() || [0, 0]);

  return {
    bytes,
    manifestRow: {
      file: fileOf(row),
      pack: row.pack,
      name: row.name,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      triangles,
      images,
      blender,
      source: sourceHash(row),
    },
  };
}
