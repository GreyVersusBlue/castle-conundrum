#!/usr/bin/env node
// tools/castle3d/fetch.mjs: every input the build reads, into <out>/cache/,
// each held to its sources.json hash (#840).
//
//   node tools/castle3d/fetch.mjs <out dir>
//   (or through build.mjs, which calls fetchSources before Blender starts)
//
// A row is `{ id, kind, asset, file, url, resolution, licence, sha256, bytes }`
// or, for the props .blend, `{ id, kind: "blend", path, licence, sha256 }`.
// A `url` row lands at <out>/cache/<asset>/<file> (cachePath), unless a file
// with the right hash is already there. `asset` is the Poly Haven slug and
// `file` the path inside its folder: the URL's file name for a texture map, an
// HDRI or a model's .blend, and the API's `include` key verbatim
// (`textures/island_tree_01_leaves_diff_1k.png`) for an include, so a Poly
// Haven .blend finds its textures/ beside it exactly as Poly Haven laid them
// out. common.cached(row) in the Blender side is the same path in one line.
//
// A download that hashes differently is not kept, and a cached file that
// hashes differently is deleted, and either exits non-zero: a file Poly Haven
// changed under a stable URL is a failure rather than a different castle. A
// `path` row (the props .blend) is not copied, only hashed where it stands.
// This is the only network use in the family: Blender never touches it.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SOURCES = path.join(HERE, 'sources.json');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Why `value` cannot be a relative cache path segment list, or null when it can. */
function badRelative(value) {
  if (typeof value !== 'string' || value === '') return 'is missing';
  if (value.includes('\\')) return 'holds a backslash';
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value) || path.isAbsolute(value)) return 'is absolute';
  if (value.split('/').some((s) => s === '..')) return 'holds a ".." segment';
  if (value.split('/').some((s) => s === '' || s === '.')) return 'holds an empty or "." segment';
  return null;
}

/** <out>/cache/<asset>/<file>, the file's segments joined by path.join. Throws naming the row. */
export function cachePath(outDir, row) {
  for (const field of ['asset', 'file']) {
    const why = badRelative(row[field]);
    if (why) throw new Error(`fetch: ${row.id}: ${field} ${JSON.stringify(row[field] ?? null)} ${why}`);
  }
  if (row.asset.includes('/')) throw new Error(`fetch: ${row.id}: asset ${JSON.stringify(row.asset)} holds a "/"`);
  return path.join(outDir, 'cache', row.asset, ...row.file.split('/'));
}

/** Resolves when every row is present with its hash; throws naming the row otherwise. */
export async function fetchSources(outDir, rows = JSON.parse(fs.readFileSync(SOURCES, 'utf8'))) {
  if (!Array.isArray(rows)) throw new Error('fetch: sources.json is not an array');
  fs.mkdirSync(path.join(outDir, 'cache'), { recursive: true });
  const seen = new Set();
  const where = new Map(); // cache path, case-blind on Windows -> row id
  for (const row of rows) {
    if (!row.id || seen.has(row.id)) throw new Error(`fetch: row id "${row.id}" is missing or repeated`);
    seen.add(row.id);
    if (!/^[0-9a-f]{64}$/.test(row.sha256 || '')) throw new Error(`fetch: ${row.id} has no sha256`);
    if (!row.licence) throw new Error(`fetch: ${row.id} has no licence`);
    if (!!row.url === !!row.path) throw new Error(`fetch: ${row.id} needs exactly one of url and path`);
    if (row.url) {
      const file = cachePath(outDir, row);
      const key = process.platform === 'win32' ? file.toLowerCase() : file;
      if (where.has(key)) throw new Error(`fetch: ${row.id} and ${where.get(key)} both resolve to ${file}`);
      where.set(key, row.id);
    }
  }

  let fetched = 0, cached = 0;
  for (const row of rows) {
    if (row.path) {
      if (!fs.existsSync(row.path)) throw new Error(`fetch: ${row.id}: ${row.path} does not exist`);
      const got = sha256(fs.readFileSync(row.path));
      if (got !== row.sha256) throw new Error(`fetch: ${row.id}: ${row.path} hashes ${got}, sources.json says ${row.sha256}`);
      cached++;
      continue;
    }
    const file = cachePath(outDir, row);
    if (fs.existsSync(file)) {
      const got = sha256(fs.readFileSync(file));
      if (got === row.sha256) { cached++; continue; }
      fs.rmSync(file);
      throw new Error(`fetch: ${row.id}: cached ${file} hashes ${got}, sources.json says ${row.sha256}; deleted`);
    }
    console.log(`fetch: ${row.id} <- ${row.url}`);
    const res = await fetch(row.url);
    if (!res.ok) throw new Error(`fetch: ${row.id}: ${row.url} answered ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const got = sha256(buf);
    if (got !== row.sha256) throw new Error(`fetch: ${row.id}: ${row.url} hashes ${got}, sources.json says ${row.sha256}; not kept`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
    fetched++;
  }
  console.log(`fetch: ${rows.length} sources, ${cached} already held, ${fetched} downloaded`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('usage: node tools/castle3d/fetch.mjs <out dir>'); process.exit(2); }
  fetchSources(path.resolve(out)).catch((e) => { console.error(e.message); process.exit(1); });
}
