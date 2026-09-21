// built.mjs — the one check that loads what `npm run build` produced.
//
//   node test/built.mjs        (from the repo root; builds first)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS, WHEN SIX OTHER SUITES ALREADY PASS. Every one of them runs
// against source: the five Node suites import src/ directly and
// plan-vs-scene.mjs drives `vite dev`, which serves the same files a developer
// edits. None of them would notice a build that dropped the 40 MB of glTF on
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

// og:image is a crawler fetch, not a page fetch, so nothing the browser half of
// this suite watches (page.__served) ever sees it (#493 is untouched either
// way). The only way to catch a stale meta tag is to read it and look. Break:
// rename the file; this line names the meta tag rather than the file, the way
// #501 already learned to.
{
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)">/)?.[1];
  const rel = ogImage && ogUrl && ogImage.startsWith(ogUrl) ? ogImage.slice(ogUrl.length) : null;
  check(rel && fs.existsSync(path.join(dist, rel)),
    `og:image's path exists in dist/`,
    rel ? rel : `og:image (${ogImage}) is not under og:url (${ogUrl})`);
}

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

// THE DECODERS, AND WHY THEY GET THEIR OWN LINE. Every texture under assets/ is
// KTX2/Basis now (#506), and KTX2Loader reaches basis_transcoder.js and .wasm by
// URL rather than by import, so Rollup never sees them and cannot be relied on
// to emit them. A build that dropped them still builds, still copies 40 MB of
// assets, and still serves a page — one where the first texture 404s inside a
// worker. Both files, by name: the .js alone loads and then asks for the .wasm.
for (const name of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
  check(fs.existsSync(path.join(dist, 'decoders/basis', name)),
    `dist/decoders/basis/${name} is there`,
    'vite.config.js’s decoder plugin did not copy it out of node_modules/three');
}

/* THE PLACEMENT EDITOR IS NOT IN HERE (BACKLOG.md rank 13). `?edit=1` on the
 * dev server mounts src/edit-mode.js, which can write data/scene-config.json
 * through a Vite middleware. Neither half may reach a built page: the client
 * is behind `import.meta.env.DEV` in main.js, which Vite replaces with `false`
 * and drops, and the writer is a plugin with `apply: "serve"`.
 *
 * THIS IS A GREP OF WHAT GOT BUILT AND NOT A COUNT OF WHAT GOT FETCHED, which
 * is #501's lesson pointed at a new target. The served-set diff below cannot
 * see this one: a built page never asks for the editor, and neither does a
 * source page without `?edit=1`, so the two file sets agree perfectly while
 * the editor's code sits inside the bundle a browser downloaded. What catches
 * it is the sentinel string itself being absent from every byte shipped. */
{
  const bundle = path.join(dist, 'bundle');
  const files = fs.existsSync(bundle) ? fs.readdirSync(bundle) : [];
  check(files.some((f) => f.endsWith('.js')), `dist/bundle/ has a script (${files.length} files)`);
  const sentinel = /castle-placement-editor-v1/;
  const src = fs.readFileSync(path.join(ROOT, 'src/edit-mode.js'), 'utf8');
  check(sentinel.test(src), 'src/edit-mode.js carries the sentinel this check greps for',
    'the editor renamed its sentinel and this check went quiet');
  const leaked = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const at = path.join(dir, e.name);
      if (e.isDirectory()) { if (at !== path.join(dist, 'assets')) walk(at); continue; }
      if (!/\.(js|css|html|json)$/.test(e.name)) continue;
      if (sentinel.test(fs.readFileSync(at, 'utf8'))) leaked.push(path.relative(dist, at));
    }
  };
  walk(dist);
  check(leaked.length === 0, 'the placement editor is in no file dist/ ships', leaked.join(', '));
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
    .filter(u => /^\/(assets|data|decoders)\//.test(u)));
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
    `the built page fetched the same ${source.files.size} files under assets/, data/ and decoders/ as the source page`,
    [missing.length ? `${missing.length} missing (${missing.slice(0, 3).join(', ')})` : '',
     extra.length ? `${extra.length} unexpected (${extra.slice(0, 3).join(', ')})` : ''].filter(Boolean).join('; '));

  // A silent fall back to jpg would pass every line above: the file sets would
  // still match, the castle would still finish, and the row would have shipped
  // nothing. So the format is asserted by name, on what the server actually
  // served, on BOTH pages — if only the bundle had lost its .ktx2 the diff
  // above would say so, and if both had, only this line would.
  const ktx2 = (side) => [...side.files].filter(f => f.endsWith('.ktx2')).length;
  check(ktx2(built) > 0 && ktx2(built) === ktx2(source),
    `both pages fetched the same ${ktx2(source)} KTX2 textures`,
    `bundle ${ktx2(built)}, source ${ktx2(source)}`);
  // Poly Haven and the NPC bodies only. The Kenney kit is 106 GLBs of 64 px
  // pixel art beside its own PNGs and tools/encode-assets.mjs leaves it alone
  // on purpose (#508), so a rail that read "no png anywhere" would be a rail
  // that fails on the state this row shipped. It said exactly that the first
  // time it ran, naming cobblestone.png.
  const uncompressed = [...built.files]
    .filter(f => /^\/assets\/(poly-haven|NPCs)\//.test(f) && /\.(jpe?g|png)$/i.test(f));
  check(!uncompressed.length,
    'and neither asked for a jpg or a png under assets/poly-haven or assets/NPCs',
    uncompressed.slice(0, 3).join(', '));

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
  //
  // AND IT IS THE SECOND DOOR THAT IS PRESSED (#755). The built page opens on
  // the walking day like the source one (#751), so `#start-mystery` is the
  // button that has to survive the bundler: it is wired in `src/ui.js` and
  // handed its callback in `src/main.js`, and a build that dropped either would
  // ship a panel with a dead second button and nothing else would notice.
  // `quest.enterMystery()` runs before `player.lock()` in that callback, so the
  // day is already 1 when this synchronous click returns.
  const started = await built.page.evaluate(() => {
    const btn = document.getElementById('start-mystery');
    if (!btn) return { missing: true };
    btn.click();
    return {
      crosshair: !document.getElementById('crosshair').classList.contains('hidden'),
      panel: !document.getElementById('start-overlay').classList.contains('hidden'),
      day: window.__quest?.day ?? null,
    };
  });
  check(!started.missing && started.crosshair && !started.panel,
    'and the built page\'s second start button puts the crosshair on the screen',
    started.missing ? 'there is no #start-mystery in the built page at all' : `crosshair ${started.crosshair}, panel still up ${started.panel}`);
  check(started.day === 1, 'and opens on the day of the death, not the day before it', `day ${started.day}`);

  await built.page.close();
  await source.page.close();
} finally {
  await browser.close();
  await dev.close();
  await preview.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
