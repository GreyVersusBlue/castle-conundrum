// plan-vs-scene.mjs — the plan against the castle the browser actually builds.
//
//   node test/plan-vs-scene.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. `src/castle-plan.js` is arithmetic and `test/layout.mjs`
// checks the arithmetic, but neither of them loads a model, and neither of them
// watches `castle-builder.js` apply a transform. The plan could be perfect and
// the builder could put the north wall in the sea. This is the seam between
// them: load the page for real, read every object the builder tagged with a
// `planId`, take its live `Box3`, and diff it against the plan's box.
//
// WHY IT IS ALLOWED IN CI when `play-castle.mjs` is not. #53 is about
// real-time movement and physics under a software-rendered Chromium being
// inconclusive either way. Nothing here moves, nothing is timed, and no pointer
// lock is taken: the page loads, the castle is built once, and static boxes are
// compared. A software rasteriser puts geometry in exactly the same place a GPU
// does.
//
// THE TOLERANCE IS 0.01 m AND IT IS NOT ARBITRARY. Deliberately collapsing
// `boundsOf` to one whole-model box puts brass_candleholders 0.129 m and
// GothicCabinet_01 0.113 m out; measuring per mesh, as test/gltf.mjs's partsOf
// does, puts every one of the 59 pieces at 0.0000 m. There is nothing in
// between to be tolerant of, and 0.01 m is loose enough that float32 geometry
// round-tripped through a GPU buffer cannot trip it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch, prepPage } from '../../../Tools/board-check/harness.mjs';
import { attachSceneProbe, waitForProbe } from '../../../Tools/board-check/drive.mjs';
import { partsOf } from './gltf.mjs';
import { makePlan } from '../src/castle-plan.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const PORT = 8125; // not 8123 (the other checks) and not 8124 (play-castle.mjs)
const BASE = `http://127.0.0.1:${PORT}`;
const GAME = `${BASE}/Projects/Castle%20Conundrum/`;
// Must match what the game's import map resolves 'three' to, or the probe
// patches a second copy of the module and captures nothing.
const THREE_URL = '/Projects/Castle%20Conundrum/libs/three.module.js';
const TOL = 0.01;

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));
const measured = new Map();
const plan = makePlan(config, (rel) => {
  if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel)));
  return measured.get(rel);
});

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);

console.log(`the plan against the scene: ${plan.pieces.length} pieces, ${TOL} m\n`);

const server = await serve(PORT);
const browser = await launch();
const page = await prepPage(browser, BASE, { width: 900, height: 700, dsf: 1 });

try {
  // A save resumes the quest, and a resumed quest opens the gate — which swings
  // the leaf out of the plan's closed position and drops its collider. Clear the
  // one key (src/save.js, castleConundrumSave_v1) BEFORE the game is ever
  // loaded, from a cheap page on the same origin. Loading the game and then
  // reloading it works too and costs a false failure: the reload aborts the
  // model requests the first load had in flight, and `page.__errs` outlives the
  // navigation, so the run ends by reporting a missing wall.glb that loaded fine.
  await page.goto(`${BASE}/404.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('castleConundrumSave_v1'));
  await page.goto(GAME, { waitUntil: 'load' });
  // The start overlay only appears after CastleBuilder.build() has resolved.
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 120000 });
  pass('the castle finished building');

  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);

  const live = await page.evaluate(async (url) => {
    const THREE = await import(url);
    const out = [];
    window.__scene.traverse((o) => {
      const id = o.userData && o.userData.planId;
      if (!id) return;
      const b = new THREE.Box3().setFromObject(o);
      out.push({
        id,
        min: { x: b.min.x, y: b.min.y, z: b.min.z },
        max: { x: b.max.x, y: b.max.y, z: b.max.z },
        placeholder: !!o.userData.isPlaceholder,
      });
    });
    return out;
  }, THREE_URL);

  const byId = new Map(live.map(o => [o.id, o]));
  if (byId.size !== live.length) fail(`${live.length} tagged objects but only ${byId.size} distinct planIds — the builder placed something twice`);
  else pass(`${live.length} objects in the scene carry a planId, all distinct`);

  const stray = live.filter(o => !plan.pieces.some(p => p.id === o.id));
  for (const o of stray) fail(`the scene has "${o.id}", which the plan does not name`);
  const placeholders = live.filter(o => o.placeholder);
  for (const o of placeholders) fail(`"${o.id}" loaded as a magenta placeholder box — its model is missing or broken`);

  let worst = 0, worstId = null;
  for (const piece of plan.pieces) {
    const got = byId.get(piece.id);
    if (!got) { fail(`the plan places "${piece.id}" (${piece.kind}) and the scene has no such object`); continue; }
    let d = 0;
    for (const edge of ['min', 'max'])
      for (const axis of ['x', 'y', 'z'])
        d = Math.max(d, Math.abs(got[edge][axis] - piece.box[edge][axis]));
    if (d > worst) { worst = d; worstId = piece.id; }
    if (d > TOL) {
      const show = (b) => `x ${b.min.x.toFixed(3)}..${b.max.x.toFixed(3)}  y ${b.min.y.toFixed(3)}..${b.max.y.toFixed(3)}  z ${b.min.z.toFixed(3)}..${b.max.z.toFixed(3)}`;
      fail(`"${piece.id}" (${piece.kind}) is ${d.toFixed(3)} m off the plan\n          plan  ${show(piece.box)}\n          scene ${show(got)}`);
    }
  }
  if (!failures) pass(`every piece within ${TOL} m of its plan box, worst ${worst.toFixed(4)} m on ${worstId}`);
} catch (err) {
  fail(`the run threw: ${err && err.message ? err.message : err}`);
} finally {
  const errs = page.__errs || [];
  if (errs.length) fail(`the page reported ${errs.length} error(s): ${errs.slice(0, 3).join(' | ')}`);
  else pass('the page loaded with no console errors, page errors or failed requests');
  await page.close();
  await browser.close();
  server.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
