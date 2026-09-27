#!/usr/bin/env node
// tools/castle3d/build.mjs: the launcher for the realistic castle model
// (rank 2h, "Castle in Blender", #839 to #844).
//
//   npm run castle3d:build                    a full build, <out>/castle.blend
//   npm run castle3d:build -- --only guide    <out>/partial/guide.blend
//
// In order, and each step exits non-zero on its own failure (#13):
//  1. refuse under CI (#842). Nothing in `npm test` or CI runs Blender.
//  2. find Blender at CASTLE3D_BLENDER, then the Steam install. Never at
//     BLENDER, which rank 1 points at a 4.5 (#805).
//  3. run `--version` and refuse anything not starting `Blender 5.2` (#840).
//  4. resolve the output folder, CASTLE3D_OUT or the default below, and
//     refuse one inside the repo (#841), so assets/ cannot take a byte.
//  5. write <out>/blueprint.json from makePlan (export-blueprint.mjs).
//  6. fetch and hash every sources.json row (fetch.mjs).
//  7. build: a factory-startup Blender runs build.py, PYTHONHASHSEED=0.
//  8. check: a second Blender opens the saved file and runs check.py (#844).
// Every Blender launch carries --python-exit-code 1: without it an uncaught
// Python exception exits 0 (#805's reason, #842).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exportBlueprint } from './export-blueprint.mjs';
import { fetchSources } from './fetch.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const STEAM_BLENDER = path.join('C:\\', 'Program Files (x86)', 'Steam', 'steamapps', 'common', 'Blender', 'blender.exe');
const DEFAULT_OUT = path.join('C:\\', 'Users', 'devon', 'OneDrive', 'Documents', 'Claude Files', 'Blender Projects', 'Castle', 'castle3d');

const refuse = (msg) => { console.error(`castle3d: ${msg}`); process.exit(1); };

/** True when `dir` is the repo root or anything under it. Case-blind on Windows. */
export function insideRepo(dir, root = ROOT) {
  const norm = (p) => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
  const rel = path.relative(norm(root), norm(dir));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function parseArgs(argv) {
  const out = { only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') {
      out.only = argv[++i];
      if (!out.only) refuse('--only needs a comma-separated stage list');
    } else refuse(`unknown argument ${argv[i]}`);
  }
  return out;
}

function blender(exe, args, env = process.env) {
  console.log(`castle3d: ${path.basename(exe)} ${args.join(' ')}`);
  const r = spawnSync(exe, args, { stdio: 'inherit', env });
  if (r.error) refuse(`could not run ${exe}: ${r.error.message}`);
  return r.status;
}

async function main() {
  // 1. never under CI (#842)
  if (process.env.CI !== undefined && process.env.CI !== '') {
    refuse(`CI is set (${JSON.stringify(process.env.CI)}); this builds on Devon's machine only and never in CI (#842)`);
  }
  const args = parseArgs(process.argv.slice(2));

  // 2. which Blender (#842)
  const exe = process.env.CASTLE3D_BLENDER || STEAM_BLENDER;
  const via = process.env.CASTLE3D_BLENDER ? 'CASTLE3D_BLENDER' : 'the Steam path';
  if (!fs.existsSync(exe)) refuse(`no Blender at ${exe} (from ${via}); set CASTLE3D_BLENDER to a Blender 5.2`);

  // 3. which version (#840)
  const v = spawnSync(exe, ['--version'], { encoding: 'utf8' });
  if (v.error) refuse(`${exe} --version did not run: ${v.error.message}`);
  const first = (v.stdout || '').split(/\r?\n/).find((l) => l.trim()) || '';
  if (!first.startsWith('Blender 5.2')) {
    refuse(`${exe} (from ${via}) says "${first.trim() || '(nothing)'}", not "Blender 5.2"; this family is pinned to 5.2 (#840)`);
  }
  console.log(`castle3d: ${first.trim()} at ${exe}`);

  // 4. where (#841)
  const out = path.resolve(process.env.CASTLE3D_OUT || DEFAULT_OUT);
  if (insideRepo(out)) refuse(`output folder ${out} is inside the repo ${ROOT}; the model lives outside it (#841)`);
  fs.mkdirSync(out, { recursive: true });

  // 5, 6. the blueprint and the inputs, before Blender starts
  const blueprint = await exportBlueprint(out);
  await fetchSources(out);

  // 7. build
  const script = (name) => path.join(HERE, name);
  const env = { ...process.env, PYTHONHASHSEED: '0' };
  const buildArgs = ['-b', '--factory-startup', '--python-exit-code', '1', '--python', script('build.py'),
    '--', '--out', out, '--blueprint', blueprint];
  if (args.only) buildArgs.push('--only', args.only);
  const last = path.join(out, 'last-build.txt');
  fs.rmSync(last, { force: true });
  const built = blender(exe, buildArgs, env);
  if (built !== 0) refuse(`build.py exited ${built}`);

  // build.py writes the path it saved into <out>/last-build.txt, so the
  // launcher checks the file that was written rather than one it guessed.
  if (!fs.existsSync(last)) refuse(`build.py exited 0 but wrote no ${last}`);
  const saved = fs.readFileSync(last, 'utf8').trim();
  if (!fs.existsSync(saved)) refuse(`build.py reported ${saved}, which does not exist`);

  // 8. check, in a second Blender over the saved file (#844)
  const checked = blender(exe, ['-b', saved, '--factory-startup', '--python-exit-code', '1', '--python', script('check.py'),
    '--', '--blueprint', blueprint], env);
  if (checked !== 0) refuse(`check.py exited ${checked} over ${saved}`);
  console.log(`castle3d: built and checked ${saved}`);
}

main().catch((e) => refuse(e.stack || String(e)));
