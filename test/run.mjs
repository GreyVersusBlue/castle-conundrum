// run.mjs — every suite, in one command, exiting non-zero if any of them fails.
//
//   npm test
//
// The order is cheapest first, so a broken data file fails in two seconds
// rather than after two minutes of browser. Nothing here is conditional and
// nothing is skippable: a check that only prints is a check that gets ignored
// (#13), and a runner that lets a suite opt out of the exit code is the same
// mistake one level up.
//
// `npm run play` is NOT here. It opens a real visible window, holds W and
// asserts the walk in real time, and a real-time movement assertion under a
// software-rendered Chromium is inconclusive rather than confirmed (#53). It is
// hand-run from a machine with a GPU.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2);

const SUITES = [
  // Node only: glTF off disk and arithmetic. Seconds each.
  ['gltf', 'the glTF reader the other suites measure with'],
  ['assets', 'every reference resolves, and nothing on disk is unasked for'],
  ['layout', 'the plan: rooms, doors, head room, walkability'],
  ['quest', 'the quest graph against the cast'],
  ['mystery', "the mystery's validator and engine"],
  ['save', "the save's repair rails"],
  // Headless browser against `vite dev`: source, not the bundle.
  ['plan-vs-scene', 'the plan against the castle the browser actually builds'],
  // Headless browser against dist/: the one check that loads the build.
  ['built', 'the built page fetches the same castle the source page does'],
];

const run = SUITES.filter(([name]) => !only.length || only.includes(name));
if (only.length && run.length !== only.length) {
  const known = SUITES.map(([n]) => n).join(', ');
  console.error(`unknown suite in "${only.join(' ')}" — pick from: ${known}`);
  process.exit(2);
}

const failed = [];
for (const [name, what] of run) {
  console.log(`\n${'='.repeat(72)}\n${name}.mjs — ${what}\n${'='.repeat(72)}`);
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(HERE, `${name}.mjs`)],
    { stdio: 'inherit', cwd: path.join(HERE, '..') });
  const secs = ((Date.now() - t) / 1000).toFixed(1);
  // A suite killed by a signal has no status. Reporting that as 0 is how a
  // runner ends up green on a crash.
  if (r.status !== 0) failed.push(`${name} (${r.status === null ? `signal ${r.signal}` : `exit ${r.status}`}, ${secs}s)`);
  else console.log(`\n  -- ${name} passed in ${secs}s`);
}

console.log(`\n${'='.repeat(72)}`);
if (failed.length) {
  console.log(`${failed.length} of ${run.length} suites failed:`);
  for (const f of failed) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`all ${run.length} suites passed`);
