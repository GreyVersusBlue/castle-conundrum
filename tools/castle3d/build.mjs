#!/usr/bin/env node
// tools/castle3d/build.mjs: the launcher for the realistic castle model
// (rank 2h, "Castle in Blender", #839 to #844).
//
//   npm run castle3d:build                    a full build, <out>/castle.blend
//   npm run castle3d:build -- --only guide    <out>/partial/guide.blend
//   npm run castle3d:build -- --export-only   castle.glb and markers.json from the existing master
//
// In order, and each step exits non-zero on its own failure (#13):
//  1. refuse under CI (#842). Nothing in `npm test` or CI runs Blender.
//  2. find Blender at CASTLE3D_BLENDER, then the Steam install. Never at
//     BLENDER, which is rank 1's (#805, #879).
//  3. run `--version` and refuse anything not starting `Blender 5.2` (#840).
//  4. resolve the output folder, CASTLE3D_OUT or the default below, and
//     refuse one inside the repo (#841), so assets/ cannot take a byte.
//  5. write <out>/blueprint.json from makePlan (export-blueprint.mjs).
//  6. fetch and hash every sources.json row (fetch.mjs).
//  7. build: a factory-startup Blender runs build.py, PYTHONHASHSEED=0.
//  8. check: a second Blender opens the saved file and runs check.py (#844).
//  9. export, on a full build only, never on --only: a third Blender opens the
//     master and runs export.py, which writes castle.glb and markers.json and
//     never saves the .blend (#897).
// 10. the export check, check-export.mjs, over those two files (#898).
// --export-only writes the blueprint fresh (#841), skips 6 to 8, refuses when
// <out>/castle.blend is missing, and runs 9 and 10 over it (#897).
// Every Blender launch carries --python-exit-code 1: without it an uncaught
// Python exception exits 0 (#805's reason, #842).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exportBlueprint } from './export-blueprint.mjs';
import { fetchSources } from './fetch.mjs';
import { checkExport } from './check-export.mjs';

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
  const out = { only: null, exportOnly: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') {
      out.only = argv[++i];
      if (!out.only) refuse('--only needs a comma-separated stage list');
    } else if (argv[i] === '--export-only') out.exportOnly = true;
    else refuse(`unknown argument ${argv[i]}`);
  }
  if (out.only && out.exportOnly) refuse('--only and --export-only do not go together; export runs over the master only (#897)');
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

  // 5. the blueprint, fresh on every run, --export-only included (#841)
  const blueprint = await exportBlueprint(out);
  const script = (name) => path.join(HERE, name);
  const env = { ...process.env, PYTHONHASHSEED: '0' };
  const master = path.join(out, 'castle.blend');

  // 9, 10. export in a third Blender over the master, then the export check
  const exportMaster = async () => {
    const exported = blender(exe, ['-b', master, '--factory-startup', '--python-exit-code', '1', '--python',
      script('export.py'), '--', '--out', out, '--blueprint', blueprint], env);
    if (exported !== 0) refuse(`export.py exited ${exported} over ${master}`);
    if (!(await checkExport({ out, blueprint }))) refuse(`the export check failed over ${out}`);
    console.log(`castle3d: exported and checked ${path.join(out, 'castle.glb')} and ${path.join(out, 'markers.json')}`);
  };
  if (args.exportOnly) {
    if (!fs.existsSync(master)) refuse(`--export-only needs the master ${master}, which does not exist; run a full build`);
    await exportMaster();
    return;
  }

  // 6. the inputs, before Blender starts
  await fetchSources(out);

  // 7. build
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

  // 9, 10. a full build only; an --only build never exports (#897)
  if (!args.only) await exportMaster();
}

main().catch((e) => refuse(e.stack || String(e)));
