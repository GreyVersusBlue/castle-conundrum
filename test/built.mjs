// built.mjs — the one check that loads what `npm run build` produced.
//
//   node test/built.mjs        (from the repo root; builds first)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS, WHEN SIX OTHER SUITES ALREADY PASS. Every one of them runs
// against source: the five Node suites import src/ directly and
// plan-vs-scene.mjs drives `vite dev`, which serves the same files a developer
// edits. None of them would notice a build that dropped the 43 MB of glTF on
// the floor, or an index.html that came out still pointing at a libs/ folder
// that no longer exists. Those are the failures the bundler can invent on its
// own, and this is where they get caught.
//
// It is deliberately NOT a second plan-vs-scene. That suite compares 308 boxes
// against the plan and takes a minute; re-running it on the bundle would be
// checking Rollup's arithmetic, which nobody suspects. What is checked here is
// narrower: the page gets to the same point — a castle finished building, every
// model real — while asking nothing of the network beyond its own origin.

import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { serveDev, servePreview, launch, prepPage, ROOT } from './harness.mjs';

const PORT = 8126; // not 8124 (play-castle.mjs) and not 8125 (plan-vs-scene.mjs)
const DEV_PORT = 8127;

let failures = 0;
const fail = (msg, detail = '') => { console.log(`  FAIL  ${msg}${detail ? ` — ${detail}` : ''}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(msg, detail));

console.log('the built page\n');

await build({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), logLevel: 'warn' });
const dist = path.join(ROOT, 'dist');

/* ---- what the build emitted, before a browser is involved ---------------- */

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
check(!/type="importmap"/.test(html),
  'the built index.html carries no import map',
  'Vite resolved the bare specifiers; an import map left behind would resolve them a second way');
check(!/libs\//.test(html),
  'and no reference to libs/, which is gone');
check(!fs.existsSync(path.join(ROOT, 'libs')),
  'libs/ is not in the repo either');

const bytes = (dir) => fs.readdirSync(dir, { withFileTypes: true, recursive: true })
  .filter(e => e.isFile())
  .reduce((n, e) => n + fs.statSync(path.join(e.parentPath ?? e.path, e.name)).size, 0);

// 200 MB, and that is a locked decision (HISTORY.md #499), not a number somebody
// felt was about right. The old ceiling was 44.4 MB, set when the whole site
// shared one Firebase deploy; this repo deploys alone and the assets it is
// allowed to grow into are the point of rank 1's compression work.
const CEILING = 200 * 1048576;
const total = bytes(dist);
check(total <= CEILING,
  `dist/ is ${(total / 1048576).toFixed(1)} MB, under the 200 MB ceiling`,
  `${(total / 1048576).toFixed(1)} MB`);

for (const dir of ['assets', 'data']) {
  const there = fs.existsSync(path.join(dist, dir));
  check(there, `dist/${dir}/ is there`, 'vite.config.js’s copy plugin did not run');
}

/* ---- and what it does in a browser --------------------------------------- */

const browser = await launch();

/**
 * Load a page and hand back every asset and data file it fetched.
 *
 * The save is cleared from a cheap same-origin document first, for the reason
 * test/blank.html gives: a reload of the game itself aborts the model requests
 * the first load had in flight and the run ends reporting a missing wall.glb
 * that loaded fine. blank.html is a source file and is not in dist/, so the
 * cheap document is one of the game's own data files, which both servers have.
 */
async function loadAndWatch(base, label) {
  const page = await prepPage(browser, { width: 900, height: 700, dsf: 1 });
  await page.goto(`${base}/data/riddle.json`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.removeItem('castleConundrumSave_v1'));
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 180000 });
  pass(`${label}: the castle finished building`);
  const files = new Set(page.__served
    .map(u => u.startsWith(base) ? u.slice(base.length) : u)
    .filter(u => /^\/(assets|data)\//.test(u)));
  return { page, files };
}

const preview = await servePreview(PORT);
const dev = await serveDev(DEV_PORT);

try {
  const built = await loadAndWatch(preview.base, 'the bundle');
  const source = await loadAndWatch(dev.base, 'the source');

  // THE ONE QUESTION THIS SUITE EXISTS TO ANSWER. Not "did it build" — Vite
  // says that itself and exits non-zero if it did not — but "does the built
  // page load the same castle the source page loads". A bundler is free to
  // rewrite the URL of anything it can see in the module graph, and it cannot
  // see any of this: every glTF and every texture is fetched by a string out of
  // data/scene-config.json at runtime. So a build that shipped a stale copy of
  // assets/, or dropped a file out of it, or resolved one path differently,
  // fails here and nowhere else.
  //
  // Both sides are what the server SERVED, not what the page asked for. The
  // first version of this compared requests and stayed green when one .jpg was
  // deleted out of dist/ on purpose: the game asks for a missing texture just
  // as loudly as it asks for one that is there (harness.mjs, page.__served).
  const missing = [...source.files].filter(f => !built.files.has(f));
  const extra = [...built.files].filter(f => !source.files.has(f));
  check(!missing.length && !extra.length,
    `the built page fetched the same ${source.files.size} files under assets/ and data/ as the source page`,
    [missing.length ? `${missing.length} missing (${missing.slice(0, 3).join(', ')})` : '',
     extra.length ? `${extra.length} unexpected (${extra.slice(0, 3).join(', ')})` : ''].filter(Boolean).join('; '));

  check(built.page.__blocked.length === 0,
    'the built page made no offsite request',
    built.page.__blocked.join(', '));
  // A missing model logs `MISSING MODEL` through assets.js, a broken texture
  // logs `MISSING TEXTURE`, and a data file that did not get copied throws —
  // all three at console.error, all three collected here.
  check(built.page.__errs.length === 0,
    'no console errors, page errors or failed requests',
    built.page.__errs.slice(0, 6).join(' | '));

  // Last, because it is the one beat that can log on its own: the click is not
  // a trusted gesture, so requestPointerLock is refused and three's
  // PointerLockControls says so at console.error. The assertions above have
  // already read page.__errs by then.
  const started = await built.page.evaluate(() => {
    document.getElementById('start-button').click();
    return !document.getElementById('crosshair').classList.contains('hidden');
  });
  check(started, 'and Enter the Castle puts the crosshair on the screen');

  await built.page.close();
  await source.page.close();
} finally {
  await browser.close();
  await dev.close();
  await preview.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
