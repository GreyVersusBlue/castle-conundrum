// render.mjs — `npm run blender:render [pack ...]`. Devon's machines only,
// huginn or Windows, with Blender 5.2 (#804, #878, #879). Never in CI.
//
//   1. refuse if CI is set (#804)
//   2. find Blender at BLENDER or on PATH and refuse anything but 5.2 before
//      any pack (#805, #879)
//   3. for each row of each pack named (every pack if none is):
//        blender -b --factory-startup --python-exit-code 1
//                -P tools/blender/packs/<script> -- --row <json>
//                --out tools/blender/.staging/<pack>/<name>.glb
//      with PYTHONHASHSEED=0, then finish.mjs over what landed, and write
//      assets/blender/<pack>/<name>.glb only if its bytes moved. One line per
//      file: written, or unchanged.
//   4. one more Blender per pack for the contact sheet, shots/blender/<pack>.png
//   5. the pack's rows of tools/blender/manifest.json, in the file's own line
//      ending (#632), written only if the text moved
//
// BLENDER_THREADS=<n>, when set, passes `-t <n>` to every Blender. It moves no
// byte; it is for a machine that cannot spare every core. Unset passes nothing.
//
// Every path is built with path.join and handed to Blender as an argument, so
// nothing here leans on a shell, on brace expansion or on `/` (Windows).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { finish, fileOf, ROOT } from './finish.mjs';
import { eolOf } from '../place.mjs';

const HERE = path.join(ROOT, 'tools', 'blender');
const STAGING = path.join(HERE, '.staging');
const MANIFEST = path.join(HERE, 'manifest.json');
const MANIFEST_COMMENT = 'Written by `npm run blender:render` and never by hand (#806). One row per file under assets/blender/: its bytes and sha256 as committed, its triangles and images, the Blender that made it, and `source`, the sha256 over common.py, its script, finish.mjs and its packs.json row with every text file normalised to LF. test/assets.mjs check 8 holds every row.';

const refuse = (msg) => { console.error(`blender:render: ${msg}`); process.exit(1); };

function table() {
  return JSON.parse(fs.readFileSync(path.join(HERE, 'packs.json'), 'utf8'));
}

function blenderArgs() {
  const t = process.env.BLENDER_THREADS;
  if (t === undefined || t === '') return [];
  if (!/^[1-9][0-9]*$/.test(t)) refuse(`BLENDER_THREADS is ${JSON.stringify(t)}, not a whole number of threads`);
  return ['-t', t];
}

function run(exe, args) {
  const r = spawnSync(exe, args, {
    encoding: 'utf8',
    env: { ...process.env, PYTHONHASHSEED: '0' },
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) refuse(`${exe} did not run: ${r.error.message}`);
  return r;
}

function manifestText(rows, eol) {
  const json = JSON.stringify({ comment: MANIFEST_COMMENT, blender: '5.2', rows }, null, 2);
  return `${json}\n`.replace(/\n/g, eol);
}

async function main() {
  // 1
  if (process.env.CI !== undefined && process.env.CI !== '') {
    refuse(`CI is set (${JSON.stringify(process.env.CI)}); Blender runs on Devon's machines only and never in CI (#804)`);
  }

  // 2
  const exe = process.env.BLENDER || 'blender';
  const v = run(exe, ['--version']);
  const first = (v.stdout || '').split(/\r?\n/).find((l) => l.trim()) || '';
  if (!/^Blender 5\.2\./.test(first.trim())) {
    refuse(`${exe} says "${first.trim() || '(nothing)'}", not "Blender 5.2.x"; this pipeline is pinned to 5.2 (#879). Set BLENDER to a 5.2 LTS`);
  }
  console.log(`blender:render: ${first.trim()} at ${exe}`);

  const t = table();
  const known = [...new Set(t.rows.map((r) => r.pack))];
  const asked = process.argv.slice(2);
  for (const p of asked) if (!known.includes(p)) refuse(`no pack "${p}" in tools/blender/packs.json (it has ${known.join(', ')})`);
  const packs = asked.length ? asked : known;
  const threads = blenderArgs();

  const made = [];
  for (const pack of packs) {
    const rows = t.rows.filter((r) => r.pack === pack);
    for (const row of rows) {
      const script = path.join(HERE, 'packs', row.script);
      if (!fs.existsSync(script)) refuse(`${pack}/${row.name}: no script ${script}`);
      const staged = path.join(STAGING, pack, `${row.name}.glb`);
      fs.rmSync(staged, { force: true });
      fs.rmSync(`${staged}.json`, { force: true });
      const r = run(exe, ['-b', '--factory-startup', ...threads, '--python-exit-code', '1', '-P', script,
        '--', '--row', JSON.stringify(row), '--out', staged]);
      if (r.status !== 0 || !fs.existsSync(staged)) {
        process.stdout.write(r.stdout || '');
        process.stderr.write(r.stderr || '');
        refuse(`${pack}/${row.name}: Blender exited ${r.status}${fs.existsSync(staged) ? '' : ' and wrote nothing'}`);
      }
      const { bytes, manifestRow } = await finish(staged, row);
      const out = path.join(ROOT, ...fileOf(row).split('/'));
      const same = fs.existsSync(out) && Buffer.compare(fs.readFileSync(out), bytes) === 0;
      if (!same) {
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, bytes);
      }
      console.log(`${fileOf(row)}: ${same ? 'unchanged' : 'written'} (${bytes.length} bytes, ${manifestRow.triangles} triangles)`);
      made.push(manifestRow);
    }

    // 4
    const sheet = run(exe, ['-b', '--factory-startup', ...threads, '--python-exit-code', '1',
      '-P', path.join(HERE, 'packs', rows[0].script), '--', '--sheet', JSON.stringify(rows)]);
    if (sheet.status !== 0) {
      process.stdout.write(sheet.stdout || '');
      process.stderr.write(sheet.stderr || '');
      refuse(`${pack}: the contact sheet's Blender exited ${sheet.status}`);
    }
    console.log(`shots/blender/${pack}.png: the contact sheet`);
  }

  // 5
  const before = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, 'utf8') : '';
  const eol = before ? eolOf(before) : '\n';
  const old = before ? JSON.parse(before).rows : [];
  const rows = [
    ...old.filter((r) => !packs.includes(r.pack)),
    ...made,
  ].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  const text = manifestText(rows, eol);
  if (text !== before) {
    fs.writeFileSync(MANIFEST, text);
    console.log('tools/blender/manifest.json: written');
  } else {
    console.log('tools/blender/manifest.json: unchanged');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
