#!/usr/bin/env node
// tools/castle3d/fetch.mjs: every input the build reads, into <out>/cache/,
// each held to its sources.json hash (#840).
//
//   node tools/castle3d/fetch.mjs <out dir>
//   (or through build.mjs, which calls fetchSources before Blender starts)
//
// A row is `{ id, kind, url | path, resolution, licence, sha256, bytes }`.
// A `url` row is downloaded into <out>/cache/ unless a file with the right
// hash is already there; a download that hashes differently is deleted and
// the run exits non-zero, so a file Poly Haven changed under a stable URL is
// a failure rather than a different castle. A `path` row (the props .blend)
// is not copied, only hashed where it stands. This is the only network use
// in the family: Blender never touches the network.
//
// sources.json is empty in increment 0, so this reads nothing and writes
// nothing but the cache folder.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SOURCES = path.join(HERE, 'sources.json');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

export function cachePath(outDir, row) {
  const name = row.url ? decodeURIComponent(new URL(row.url).pathname.split('/').pop()) : path.basename(row.path);
  return path.join(outDir, 'cache', `${row.id}__${name}`);
}

/** Resolves when every row is present with its hash; throws naming the row otherwise. */
export async function fetchSources(outDir, rows = JSON.parse(fs.readFileSync(SOURCES, 'utf8'))) {
  if (!Array.isArray(rows)) throw new Error('fetch: sources.json is not an array');
  fs.mkdirSync(path.join(outDir, 'cache'), { recursive: true });
  const seen = new Set();
  let fetched = 0, cached = 0;
  for (const row of rows) {
    if (!row.id || seen.has(row.id)) throw new Error(`fetch: row id "${row.id}" is missing or repeated`);
    seen.add(row.id);
    if (!/^[0-9a-f]{64}$/.test(row.sha256 || '')) throw new Error(`fetch: ${row.id} has no sha256`);
    if (!row.licence) throw new Error(`fetch: ${row.id} has no licence`);
    if (!!row.url === !!row.path) throw new Error(`fetch: ${row.id} needs exactly one of url and path`);

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
    const res = await fetch(row.url);
    if (!res.ok) throw new Error(`fetch: ${row.id}: ${row.url} answered ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const got = sha256(buf);
    if (got !== row.sha256) throw new Error(`fetch: ${row.id}: ${row.url} hashes ${got}, sources.json says ${row.sha256}; not kept`);
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
