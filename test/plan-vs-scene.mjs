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
import { makePlan, walkability, surfacesAt, EYE_HEIGHT } from '../src/castle-plan.js';

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
const riddleText = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/riddle.json'), 'utf8')).riddle;
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

  /* ------------------------------------------------ the muniment word-lock ---
   * Phase 4 took the riddle off the Scholar and carved it over the muniment
   * room's door, which made a door an interaction target for the first time. The
   * Node suites can see the graph (test/quest.mjs) and the geometry
   * (test/layout.mjs) and neither can see the wiring between them: the prompt,
   * the facing test, the line of sight to a leaf that hangs off a hinge at its
   * own edge, and E reaching the quest.
   *
   * WHY THIS IS ALLOWED HERE AND NOT UNDER #53. Nothing below moves or is timed.
   * The camera is placed, not walked; two frames are waited for so the render
   * loop's own interaction.update() runs; and what is read back is a string in
   * the DOM. A software rasteriser puts the camera exactly where a GPU does. The
   * WALK to this door is play-castle.mjs's, and stays there.
   */
  console.log('');
  const lock = await page.evaluate(async () => {
    // Two metres out in front of the muniment room's door, inside the King's
    // Hall, looking at it. YXZ yaw 0 faces -z.
    window.__cam.position.set(21, 1.7, -12);
    window.__cam.rotation.set(0, -0.026, 0, 'YXZ');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = document.getElementById('interact-prompt');
    const prompt = el && !el.classList.contains('hidden') ? el.textContent.trim() : null;
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const overlay = document.getElementById('riddle-overlay');
    return {
      prompt,
      riddleOpen: overlay && !overlay.classList.contains('hidden'),
      riddleText: document.getElementById('riddle-text')?.textContent?.trim() ?? null,
      stage: window.__quest?.stage ?? null,
    };
  });
  if (!lock.prompt) fail('standing two metres in front of the muniment room\'s door, looking at it, offers no prompt — the leaf is not an interaction target, or nothing can see it');
  else if (!/word-lock/i.test(lock.prompt)) fail(`the door prompts "${lock.prompt}", which is not its own prompt`);
  else pass(`the door prompts "${lock.prompt}"`);
  if (!lock.riddleOpen) fail(`E at the word-lock opened no riddle (stage ${lock.stage})`);
  else if (lock.riddleText !== riddleText) fail(`the overlay shows ${JSON.stringify(lock.riddleText)}, and riddle.json says ${JSON.stringify(riddleText)}`);
  else pass('E at it opens the riddle overlay with riddle.json\'s riddle');

  /* ---------------------------------------------- standing, on every level ---
   * Phase 5 gave the player a y, and every Node suite can still only say that
   * the plan's floors connect. This is the seam for the floors: the camera is
   * put at every room's anchor on every level, at that room's floor height plus
   * the eye, and the runtime's own PlayerController.settle() — the same code
   * that runs after every step of a walk — is asked what it stands on. Its
   * answer has to be the plan's floor to 0.01 m: a slab the browser built a
   * storey too low, a deck the builder forgot, a flight standing on nothing,
   * would each put the camera somewhere else. THE CAMERA IS PUT A STEP TOO
   * HIGH, 0.3 m over the floor plus the eye, and settle() has to bring it
   * down: placed exactly right, a settle() that did nothing would pass, and
   * the first version of this beat did exactly that (#34). Nothing moves and
   * nothing is timed; the anchor is the reachable grid cell nearest the room's centre,
   * from the same fill test/layout.mjs runs, and for the two rooms nothing
   * reaches — the cell, the muniment room — the plan's surface at the centre.
   */
  console.log('');
  const grid = walkability(plan);
  const anchors = grid.rooms().map((r) => {
    const cx = (r.bounds.min.x + r.bounds.max.x) / 2, cz = (r.bounds.min.z + r.bounds.max.z) / 2;
    if (r.reachable) {
      const near = r.at.slice().sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
      return { id: r.id, level: r.level, x: near.x, z: near.z, h: near.h };
    }
    const on = surfacesAt(plan, cx, cz).find((f) => f.level === r.level);
    return on ? { id: r.id, level: r.level, x: cx, z: cz, h: on.h } : { id: r.id, level: r.level, x: cx, z: cz, h: null };
  });
  const stood = await page.evaluate(async ({ anchors, eye }) => anchors.map((a) => {
    if (a.h == null) return { ...a, got: null };
    window.__cam.position.set(a.x, a.h + 0.3 + eye, a.z);
    const on = window.__player.settle();
    return { ...a, got: on ? on.h : null, camY: window.__cam.position.y, surface: on ? on.surface : null };
  }), { anchors, eye: EYE_HEIGHT });
  let worstStand = -1, worstRoom = null, stoodOk = 0;
  for (const s of stood) {
    if (s.h == null) { fail(`${s.id} (level ${s.level}) has no floor at its centre in the plan — nothing to stand the camera on`); continue; }
    if (s.got == null) { fail(`standing the camera at (${s.x.toFixed(2)}, ${s.z.toFixed(2)}) in ${s.id}, level ${s.level}, the runtime finds nothing under it within a step of the plan's floor at ${s.h.toFixed(2)}`); continue; }
    const d = Math.abs(s.got - s.h);
    if (d > worstStand) { worstStand = d; worstRoom = s.id; }
    if (d > TOL) fail(`in ${s.id} (level ${s.level}) the plan's floor is at ${s.h.toFixed(3)} and the runtime stands on ${s.surface} at ${s.got.toFixed(3)}, ${d.toFixed(3)} m off`);
    else if (Math.abs(s.camY - (s.got + EYE_HEIGHT)) > TOL) fail(`in ${s.id} the eye settled at y ${s.camY.toFixed(3)} over a floor at ${s.got.toFixed(3)}, not ${EYE_HEIGHT} above it`);
    else stoodOk++;
  }
  const perLevel = [0, 1, 2].map((l) => `${stood.filter((s) => s.level === l).length} on level ${l}`).join(', ');
  if (stoodOk === stood.length) pass(`the camera stands on the plan's floor in all ${stood.length} rooms (${perLevel}), worst ${Math.max(0, worstStand).toFixed(4)} m in ${worstRoom}`);

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
