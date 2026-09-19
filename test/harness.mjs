// harness.mjs — a server and a headless Chromium for the two suites that need
// a real page.
//
// Came across from tools-and-games' Tools/board-check/harness.mjs when the
// project moved (HISTORY.md #491), and it is a lot shorter than the original,
// because two of that file's three jobs were site-wide and neither is this
// project's:
//
//   - the fonts.googleapis.com shim. Castle Conundrum has never asked a font
//     host for anything; every glyph on its screens is a system stack in
//     src/ui.css. Nothing to stand in for.
//   - the cdn.jsdelivr.net/npm/three@X shim. That was for board pages that
//     hotlinked three. This page gets three from node_modules through Vite.
//
// What is left is the part that is actually this project's: start the same
// server a developer starts, open a page on it, and refuse every request that
// tries to leave the origin so a suite can prove the page made none.

import { createServer, preview } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The URL the page's own `import 'three'` resolved to, read back out of the
 * module Vite actually served.
 *
 * test/drive.mjs's scene probe has to import this EXACT string. Under the old
 * import map it was a constant, `./libs/three.module.js`, and could be written
 * down. Under Vite it cannot: the dev server rewrites the bare specifier to
 * `/node_modules/three/build/three.module.js?v=<hash>`, and the query is part
 * of the module's identity. Import the path without the query and the browser
 * fetches the same bytes into a SECOND registry entry with its own
 * `Object3D.prototype` — the probe patches that copy, the game keeps using the
 * first, and `waitForProbe` sits there until it times out with no scene.
 *
 * The hash is derived from the lockfile and is stable in practice. That is not
 * a good enough reason to hardcode it, so this reads the rewritten source of
 * the page's own entry module and takes the specifier out of it. No browser
 * needed, and it is right by construction rather than by coincidence.
 */
export async function threeUrl(base) {
  const src = await fetch(`${base}/src/main.js`).then(r => r.text());
  const m = src.match(/from\s+["']([^"']*three\/build\/three\.module\.js[^"']*)["']/);
  if (!m) throw new Error(
    `src/main.js as served by ${base} has no import of three/build/three.module.js. ` +
    'Either optimizeDeps stopped excluding three (vite.config.js) or main.js ' +
    'stopped importing it directly.');
  return m[1];
}

/**
 * The dev server, which is what the suites run against: source, not the bundle.
 * Returns { base, close }.
 *
 * `hmr: false` TURNS HMR OFF, and `npm run play` passes it.
 * Vite full-reloads the page when anything in its module graph changes on disk,
 * which is correct for a developer and fatal to a suite: the reload throws away
 * `window.__cam` and `window.__scene` that test/drive.mjs's probe patched in,
 * and the next `camState` fails with "Cannot read properties of undefined
 * (reading 'updateWorldMatrix')" — an error that names the probe and says
 * nothing about the page having restarted underneath it.
 *
 * It is not hypothetical and it is not rare. `npm run play` is a ten-minute
 * walk on a machine somebody is USING, and this repo is on a synced drive with
 * other sessions working in it. Measured on 2026-09-17: five screenshots
 * written into `shots/play/` left the probe alive, and one touch of
 * `src/main.js` with its own unchanged bytes killed it. The run that found this
 * died between the wall walk and the north walk with fourteen beats left
 * unplayed, and the log looked like a bug in the castle.
 *
 * No suite here wants HMR: each loads the page once and drives it. It is a
 * dev-server convenience with nothing to offer them and one way to ruin a run.
 *
 * IT IS `hmr` AND NOT `watch`, and both were measured. `server.watch: null`
 * reads like the lever and is not one: with the watcher nulled, the touch still
 * reloaded the page and still killed the probe. `hmr: false` alone held.
 */
export async function serveDev(port, { hmr = true } = {}) {
  const server = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.js'),
    logLevel: 'warn',
    server: { port, strictPort: true, host: '127.0.0.1', ...(hmr ? {} : { hmr: false }) },
  });
  await server.listen();
  return { base: `http://127.0.0.1:${port}`, close: () => server.close() };
}

/**
 * `dist/`, which is what test/built.mjs runs against — the one check that loads
 * the built page rather than the source.
 */
export async function servePreview(port) {
  const server = await preview({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.js'),
    logLevel: 'warn',
    preview: { port, strictPort: true, host: '127.0.0.1' },
  });
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.httpServer.close(r)),
  };
}

// @sparticuz/chromium ships a Chromium built for AWS Lambda's Linux runtime
// only — there is no Windows or macOS executable in the package at all, so
// `chromium.executablePath()` resolves to a path that does not exist there.
// Windows is the dev machine (CLAUDE.md), so everywhere but Linux this drives
// whatever Chrome or Edge is already installed, through Playwright. No browser
// download for that: `channel: 'chrome'` reuses the system install.
//
// `headed: true` opens a real visible window, and only `npm run play` wants
// one. It wants it for a specific reason: real GPU rendering needs a browser
// that is actually compositing frames to a screen, and so does any reading of
// how far a held key carries a body. A software-rendered headless Chromium can
// put static geometry exactly where a GPU would — that is why plan-vs-scene.mjs
// is allowed in CI — but it cannot settle a question about movement or physics
// either way (#53).
//
// THE POINTER LOCK API IS NOT ON THAT LIST, though this comment said it was
// until 2026-09-18. Headless Chromium takes pointer lock on a trusted click,
// reports `document.pointerLockElement`, drops it on `exitPointerLock()` and
// takes it back on the next request, and it enforces the same four-request
// ration a headed one does (#659, #661). test/overlays.mjs runs in CI on the
// strength of that.
//
// Chrome slows or stops requestAnimationFrame, timers and compositing in a
// window it thinks nobody is looking at, so a headed walk covers no ground the
// moment the person running it clicks another application. These three flags
// are the difference between a suite that tests the castle and a suite that
// tests whether the person running it sat still.
const NO_BACKGROUNDING = [
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
];

export async function launch({ headed = false } = {}) {
  if (process.platform === 'linux') {
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;
    const browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: !headed,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
             '--font-render-hinting=none', '--force-color-profile=srgb',
             '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
             '--hide-scrollbars', '--disable-lcd-text', '--mute-audio',
             ...NO_BACKGROUNDING],
    });
    browser.__engine = 'puppeteer';
    return browser;
  }

  const { chromium: pwChromium } = await import('playwright-core');
  let lastErr;
  for (const channel of ['chrome', 'msedge', undefined]) {
    try {
      const browser = await pwChromium.launch({
        channel,
        headless: !headed,
        args: ['--font-render-hinting=none', '--force-color-profile=srgb',
               '--hide-scrollbars', '--disable-lcd-text', '--mute-audio',
               ...NO_BACKGROUNDING],
      });
      browser.__engine = 'playwright';
      return browser;
    } catch (e) { lastErr = e; }
  }
  throw new Error(
    'No local Chrome or Edge found for Playwright to drive, and no bundled ' +
    'Chromium is installed. Install Google Chrome or Microsoft Edge, or run ' +
    '`npx playwright install chromium` in this folder.\n' +
    `(last launch error: ${lastErr?.message})`);
}

/**
 * A page with error collection and offsite refusal attached.
 *
 * page.__errs     page errors, console errors, failed requests
 * page.__requests every URL the page asked for, query stripped, in order.
 * page.__served  the subset that came back under 400, query stripped.
 *                test/built.mjs diffs the source page's set against the built
 *                page's. It has to be the SERVED set and not the requested one:
 *                a build that dropped a texture still has the game ask for it,
 *                so the two request lists come back identical and the diff
 *                passes on a broken build. Found by deleting one .jpg out of
 *                dist/ on purpose (#501) — the requested-set version of this
 *                assertion stayed green and only the console-error assertion
 *                below caught it.
 * page.__blocked  offsite URLs that were refused — every one of them is a real
 *                 external dependency this page still has. The list is asserted
 *                 empty, and that assertion is the zero-offsite-requests rule
 *                 in CLAUDE.md with teeth on it.
 *
 * Nothing is shimmed here, which is the difference from the file this came
 * from: there, `__blocked` could come back empty while the page happily
 * hotlinked Google Fonts, because the font shim satisfied those requests before
 * the block saw them. Here an empty `__blocked` means what it looks like.
 */
/**
 * `touch: true` gives the page a thumb: touch events, `navigator.maxTouchPoints`
 * over zero, and the mobile device-metrics flag that makes `(pointer: coarse)`
 * answer yes (#530). Both engines then take taps through `page.touchscreen`,
 * which is the one API `test/touch.mjs` needs and the one both of them spell
 * the same way.
 */
export async function prepPage(browser, { width = 1280, height = 1000, dsf = 1, jsEnabled = true, touch = false } = {}) {
  const playwright = browser.__engine === 'playwright';
  let page, context;

  if (playwright) {
    context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: dsf, javaScriptEnabled: jsEnabled,
      hasTouch: touch, isMobile: touch,
    });
    page = await context.newPage();
    const closePage = page.close.bind(page);
    page.close = async opts => { await closePage(opts); await context.close(); };
  } else {
    page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: dsf, hasTouch: touch, isMobile: touch });
    if (!jsEnabled) await page.setJavaScriptEnabled(false);
  }

  const blocked = [];
  const requests = [];
  const offsite = (u) => /^https?:\/\/(?!127\.0\.0\.1|localhost)/.test(u);
  const note = (u) => {
    requests.push(u.split('?')[0]);
    if (!offsite(u)) return false;
    blocked.push(u.split('?')[0]);
    return true;
  };

  if (playwright) {
    await page.route('**/*', route => {
      if (note(route.request().url())) return route.abort();
      route.continue();
    });
  } else {
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (note(r.url())) return r.abort();
      r.continue();
    });
  }

  const served = [];
  page.on('response', r => { if (r.status() < 400) served.push(r.url().split('?')[0]); });

  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  // A cancelled request is not a failure, and `net::ERR_ABORTED` is every
  // cancellation there is — a suite that navigates away cancels whatever the
  // browser had in flight. An offsite URL refused above still reports, because
  // `abort()` surfaces as `net::ERR_FAILED`, not `net::ERR_ABORTED`.
  page.on('requestfailed', (r) => {
    const why = r.failure?.()?.errorText || '';
    if (why === 'net::ERR_ABORTED') return;
    errs.push(`reqfail: ${why || '?'} ${r.url().slice(0, 120)}`);
  });
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  page.__errs = errs;
  page.__blocked = blocked;
  page.__requests = requests;
  page.__served = served;
  // Which driver is behind this page. Scripts should not normally care — that
  // is the point of this file — but a few browser features are reached through
  // engine-specific API and guessing wrong hangs rather than failing.
  page.__engine = browser.__engine;
  return page;
}

export const settle = async (page, ms = 700) => {
  await new Promise(r => setTimeout(r, ms));
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 300));
};
