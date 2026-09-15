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
import { castleNav } from '../src/stations.js';

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
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));

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

  /* ------------------------------------------- the twelve, and the bell ---
   * Phase 6 put the cast on the screen and the day on a bell, and the Node
   * suites can see neither: test/mystery.mjs holds the schedule to the castle's
   * floor, and only the page can say whether twelve bodies really stand on
   * those points, whether a tint reached a material, and whether pressing E at
   * the bell in the chapel moves the watch, the sky and the evidence.
   *
   * WHY THIS IS ALLOWED HERE AND NOT UNDER #53. Nothing below is a walk. The
   * bodies are read where the page put them at load; the bell is pressed the
   * way the word-lock is pressed above, camera placed and two frames waited
   * for; and what is asserted after the ring is a watch id, a fog colour, a
   * hidden object and a line of DOM. The twelve then WALK to their Terce
   * stations, and nothing here waits for them or times them — that walk is
   * play-castle.mjs's, on a machine with a GPU.
   */
  console.log('');
  const mystery = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mystery.json'), 'utf8'));
  const nav = castleNav(plan, mystery);
  const due = Object.keys(mystery.schedule)
    .map((id) => ({ id, at: nav.at(id, mystery.watches[0]) }))
    .filter((n) => n.at);
  const bodies = await page.evaluate(async () => (window.__cast || []).map((n) => {
    const colours = [];
    n.group.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m && m.color) colours.push(`${m.name}:${m.color.getHexString()}`);
      }
    });
    return {
      id: n.id, visible: n.group.visible,
      x: n.group.position.x, y: n.group.position.y, z: n.group.position.z,
      skin: colours.filter((c) => /^Skin:/.test(c)).join(),
      cloth: colours.filter((c) => !/^(Skin|Eye|Eyebrows|Hair)/.test(c)).sort().join(),
    };
  }));
  const seen = new Map(bodies.map((b) => [b.id, b]));
  check(bodies.length === 12, `the page spawns ${bodies.length} bodies`, 'twelve is the cast');
  let offStation = 0;
  for (const { id, at } of due) {
    const b = seen.get(id);
    if (!b) { fail(`${id} is in the schedule at Prime and the page spawned no such body`); offStation++; continue; }
    if (!b.visible) { fail(`${id} is due in ${at.room} at Prime and the page left the body hidden`); offStation++; continue; }
    if (at.h == null) { fail(`${id} is due in ${at.room} at Prime and the grid finds no floor there`); offStation++; continue; }
    const d = Math.max(Math.abs(b.x - at.x), Math.abs(b.z - at.z), Math.abs(b.y - at.h));
    if (d > TOL) { fail(`${id} stands at (${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)}) and the plan's Prime station is (${at.x.toFixed(2)}, ${at.h.toFixed(2)}, ${at.z.toFixed(2)}), ${d.toFixed(3)} m off`); offStation++; }
  }
  if (!offStation) pass(`all ${due.length} bodies due at Prime stand on their own station within ${TOL} m, on ${new Set(due.map((n) => n.at.level)).size} level(s)`);
  /* AND THE ONE ON THE UPPER FLOOR IS ON IT. Lady Alys is in the royal
   * apartments at Prime, over the King's Hall, and her feet belong at 4.0.
   * The check above could not say so while the station carried no height and
   * both sides of it read `h ?? 0`: she stood on the ground floor inside the
   * hall and everything agreed she was where she should be (#147). */
  const upstairs = due.filter((n) => n.at.level > 0);
  const grounded = upstairs.filter((n) => (seen.get(n.id)?.y ?? 0) < 0.5);
  check(upstairs.length > 0 && grounded.length === 0,
    `${upstairs.length} of them stand above the ground floor, on their own floor: ${upstairs.map((n) => `${n.id} at y ${(seen.get(n.id)?.y ?? 0).toFixed(1)}`).join(', ')}`,
    grounded.length ? `${grounded.map((n) => n.id).join(', ')} on the ground` : 'nobody is upstairs at Prime, so this checks nothing');
  const absent = bodies.filter((b) => !b.visible).map((b) => b.id);
  check(absent.join() === 'merchant', 'the one who is not in the castle at Prime is hidden rather than standing at the origin', `hidden: ${absent.join(', ') || 'nobody'}`);
  // The tint (#419). Three bodies, twelve people: the cloth has to differ
  // twelve ways and the skin must not differ at all, or the tint went onto
  // faces. Reading the live materials is the only thing that can say so —
  // npcs.json's twelve hexes being distinct is a fact about the file.
  const cloth = new Set(bodies.map((b) => b.cloth));
  check(cloth.size === 12, `the twelve read as twelve: ${cloth.size} distinct sets of cloth colours off three bodies`);
  const skins = new Set(bodies.map((b) => b.skin).filter(Boolean));
  check(skins.size === 1, `and one skin colour across all of them`, [...skins].join(' | '));

  // The bell. Stand at the reachable cell nearest it, look at it, press E.
  const bellPiece = plan.pieces.find((p) => p.bell);
  const bellAt = bellPiece ? { x: (bellPiece.box.min.x + bellPiece.box.max.x) / 2, z: (bellPiece.box.min.z + bellPiece.box.max.z) / 2 } : null;
  if (!bellAt) fail('the plan carries no piece marked `bell`, so there is nothing in the chapel to ring');
  else {
    const chapel = grid.rooms().find((r) => r.id === 'chapel');
    /* SOMEWHERE IN THE CHAPEL THE BELL CAN BE RUNG. Which cell that is, this
     * file does not get to decide: two of the twelve stand in this room at
     * Prime, InteractionSystem offers the nearest target that is also in front
     * of you and in sight, and modelling that here would be re-implementing the
     * thing under test (#34). So the candidates are every cell between 1.2 and
     * 3.0 m of the bell, nearest first, and the page is asked which of them
     * offers the bell — the assertion is that one of them does. The first
     * version picked one cell by arithmetic and stood the camera 0.16 m inside
     * the Constable, where the direction to him is noise and the facing test
     * rejects everyone including the bell.
     */
    const spots = chapel.at
      .map((c) => ({ ...c, d: Math.hypot(c.x - bellAt.x, c.z - bellAt.z) }))
      .filter((c) => c.d > 1.2 && c.d < 3.0)
      .sort((a, b) => a.d - b.d)
      .slice(0, 12);
    if (!spots.length) fail('nowhere in the chapel to stand between 1.2 and 3.0 m from the bell');
    else {
      const rung = await page.evaluate(async ({ spots, bellAt, eye }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        // The word-lock beat above left the riddle overlay open, and an open
        // overlay owns the input: interaction.update() hides the prompt and E
        // goes to the riddle. Shut it the way the player would.
        document.getElementById('riddle-cancel').click();
        await frame();
        const promptNow = () => {
          const el = document.getElementById('interact-prompt');
          return el && !el.classList.contains('hidden') ? el.textContent.trim() : null;
        };
        let chosen = null, prompt = null, tried = 0;
        for (const spot of spots) {
          tried += 1;
          window.__cam.position.set(spot.x, spot.h + eye, spot.z);
          window.__cam.rotation.set(0, Math.atan2(-(bellAt.x - spot.x), -(bellAt.z - spot.z)), 0, 'YXZ');
          await frame();
          const p = promptNow();
          if (p && /ring the bell/i.test(p)) { chosen = spot; prompt = p; break; }
          if (!chosen) prompt = p;
        }
        if (!chosen) return { chosen, prompt, tried };
        const before = { watch: window.__mystery.watch, fog: window.__scene.fog.color.getHexString() };
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
        await frame();
        const lantern = [];
        window.__scene.traverse((o) => { if (o.userData?.planId === 'lantern-chapel') lantern.push(o.visible); });
        return {
          chosen, prompt, tried, before,
          watch: window.__mystery.watch,
          fog: window.__scene.fog.color.getHexString(),
          hud: document.getElementById('quest-watch')?.textContent?.trim() ?? null,
          saved: window.__save?.state?.watch ?? null,
          body: lantern,
        };
      }, { spots, bellAt, eye: EYE_HEIGHT });
      if (!rung.chosen) {
        fail(`none of the ${rung.tried} cells in the chapel between 1.2 and 3.0 m of the bell offers it${rung.prompt ? ` (the nearest offered "${rung.prompt}")` : ' — no prompt at all'}`);
      } else {
        pass(`the bell prompts "${rung.prompt}" from ${rung.chosen.d.toFixed(2)} m away, the ${rung.tried} of ${spots.length} nearest cells tried`);
        if (rung.before.watch !== mystery.watches[0]) fail(`the page opened on ${rung.before.watch}, not ${mystery.watches[0]}`);
        else if (rung.watch !== mystery.watches[1]) fail(`E at the bell left the watch at ${rung.watch}`);
        else pass(`E at the bell moves ${rung.before.watch} to ${rung.watch}, and the tracker says "${rung.hud}"`);
        const wantFog = config.lighting.watches[mystery.watches[1]].fog.replace('#', '').toLowerCase();
        if (rung.fog !== wantFog) fail(`the fog is #${rung.fog} after the bell and ${mystery.watches[1]}'s sky is #${wantFog}`);
        else if (rung.fog === rung.before.fog) fail(`the fog did not change at all: both #${rung.fog}`);
        else pass(`the sky follows the bell: fog #${rung.before.fog} to #${rung.fog}`);
        const bodyWatches = mystery.evidence.find((e) => e.id === 'body').watches;
        if (bodyWatches.includes(mystery.watches[1])) fail(`the body is examinable at ${mystery.watches[1]} now, so this beat is checking nothing`);
        else if (rung.body.some(Boolean)) fail('the mason\'s body is still in the chapel after the bell, and mystery.json says it is a Prime-only thing');
        else pass('the evidence that is only there at Prime is gone with the bell');
        check(rung.saved === 1, 'and the save carries the new watch', `saved watch ${rung.saved}`);
      }
    }
  }

  /* ------------------------------------------ the HUD the mystery needs ---
   * Phase 7 put the engine on the screen: E on a thing examines it, J opens
   * the journal, and a second conversation with the Constable opens the
   * accusation panel. test/quest.mjs drives every one of those through the real
   * manager against a UI that records instead of rendering, which is the whole
   * of the logic and none of the wiring — the prompts, the element ids, the
   * classList toggles and the keydown handlers are here.
   *
   * WHY THIS IS ALLOWED UNDER #53, again: nothing below moves or is timed. The
   * camera is placed, frames are waited for so interaction.update() runs, and
   * what comes back is text and a count of DOM nodes.
   *
   * The watch is Terce by now: the bell beat above rang it.
   */
  console.log('');
  {
    const evidencePiece = plan.pieces.find((p) => p.evidence === 'candle');
    const wantName = mystery.evidence.find((e) => e.id === 'candle').name;
    if (!evidencePiece) fail('no piece in the plan carries the `candle` evidence, so there is nothing in the chapel to examine');
    else {
      const at = {
        x: (evidencePiece.box.min.x + evidencePiece.box.max.x) / 2,
        z: (evidencePiece.box.min.z + evidencePiece.box.max.z) / 2,
      };
      // Same shape as the bell beat: this file does not get to decide which
      // cell works, it offers the near ones and asks the page which of them
      // the running InteractionSystem actually offers the candles from.
      const spots = grid.rooms().find((r) => r.id === 'chapel').at
        .map((c) => ({ ...c, d: Math.hypot(c.x - at.x, c.z - at.z) }))
        .filter((c) => c.d > 0.9 && c.d < 2.8)
        .sort((a, b) => a.d - b.d)
        .slice(0, 12);
      const looked = await page.evaluate(async ({ spots, at, eye }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const hidden = (id) => document.getElementById(id).classList.contains('hidden');
        const promptNow = () => (hidden('interact-prompt') ? null : document.getElementById('interact-prompt').textContent.trim());
        let chosen = null, prompt = null, tried = 0;
        for (const spot of spots) {
          tried++;
          window.__cam.position.set(spot.x, spot.h + eye, spot.z);
          window.__cam.rotation.set(0, Math.atan2(-(at.x - spot.x), -(at.z - spot.z)), 0, 'YXZ');
          await frame();
          const p = promptNow();
          if (p && /examine/i.test(p)) { chosen = spot; prompt = p; break; }
        }
        if (!chosen) return { chosen: null, tried, prompt: promptNow() };
        const before = [...window.__mystery.state.clues];
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
        await frame();
        // THE TEXT, NOT THE CLASS. The toast hides itself 3.2 s after it is
        // written, and `await frame()` is two requestAnimationFrames — which
        // under a software rasteriser with no compositor can take longer than
        // that, and once did: the text was right and the element was already
        // `hidden` again. Asserting the class here would be a wall-clock
        // assertion under exactly the renderer #53 calls inconclusive. What is
        // being checked is that the manager wrote the clue to the toast at all.
        const toast = document.getElementById('toast').textContent.trim();
        const gained = window.__mystery.state.clues.filter((c) => !before.includes(c));
        // J, twice: it opens the journal and closes it again.
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
        await frame();
        const journal = {
          open: !hidden('journal-overlay'),
          rows: document.querySelectorAll('#journal-list .journal-row').length,
          title: document.getElementById('journal-title').textContent.trim(),
          text: document.getElementById('journal-list').textContent,
        };
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
        await frame();
        return { chosen, tried, prompt, toast, gained, journal, shut: hidden('journal-overlay'), held: window.__mystery.state.clues.length };
      }, { spots, at, eye: EYE_HEIGHT });

      if (!looked.chosen) fail(`none of the ${looked.tried} cells between 0.9 and 2.8 m of the chapel candles offers them${looked.prompt ? ` (the nearest offered "${looked.prompt}")` : ' — no prompt at all'}`);
      else {
        check(looked.prompt === `Press E to examine the ${wantName}`, `evidence prompts with mystery.json's own name: "${looked.prompt}"`, `mystery.json says ${JSON.stringify(wantName)}`);
        check(looked.gained.includes('chapel-candle'), 'E on it lands its clue in the engine', looked.gained.join(', ') || 'nothing landed');
        check(!!looked.toast && /^New clue: /.test(looked.toast), 'and the manager writes it to the toast', JSON.stringify(looked.toast));
        check(looked.journal.open && looked.journal.rows === looked.held, `J opens the journal with all ${looked.held} held clues`, `${looked.journal.rows} rows`);
        check(/What you know/.test(looked.journal.title), 'read-only, not the picker', looked.journal.title);
        check(/candle/i.test(looked.journal.text), 'and the clue just found is in it');
        check(looked.shut, 'J again shuts it');
      }
    }

    // The Constable, and the panel his last line asks for. The first
    // conversation moves `arrive` on; the second opens the accusation.
    const due = nav.at('constable', mystery.watches[1]);
    if (!due) fail(`the Constable has no station at ${mystery.watches[1]}`);
    else {
      const room = grid.rooms().find((r) => r.id === due.room && (r.level ?? 0) === (due.level ?? 0));
      const spots = (room?.at ?? [])
        .map((c) => ({ ...c, d: Math.hypot(c.x - due.x, c.z - due.z) }))
        .filter((c) => c.d > 1.0 && c.d < 2.8)
        .sort((a, b) => a.d - b.d)
        .slice(0, 16);
      const said = await page.evaluate(async ({ spots, due, eye }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const hidden = (id) => document.getElementById(id).classList.contains('hidden');
        const E = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); await frame(); };
        /* PUT THE CAST AT THE WATCH, WITHOUT THE WALK. The bell beat above rang
         * Terce in, and ringing a bell sends twelve people walking: the
         * Constable is somewhere between the chapel and the King's Hall for
         * several seconds afterwards, so standing at his Terce station finds
         * nobody there. Waiting for him to arrive would be a timed assertion,
         * which is what #53 rules out of this file. `applyWatch(watch, {walk:
         * false})` is the call main.js makes at load for exactly this reason —
         * a save resumed at Sext opens with everyone already standing where
         * Sext says — so it puts them there with no motion to time. */
        window.__quest.applyWatch(window.__mystery.watch, { walk: false });
        await frame();
        let chosen = null, prompt = null, tried = 0;
        for (const spot of spots) {
          tried++;
          window.__cam.position.set(spot.x, spot.h + eye, spot.z);
          window.__cam.rotation.set(0, Math.atan2(-(due.x - spot.x), -(due.z - spot.z)), 0, 'YXZ');
          await frame();
          const el = document.getElementById('interact-prompt');
          const p = hidden('interact-prompt') ? null : el.textContent.trim();
          if (p && /Lestrange/.test(p)) { chosen = spot; prompt = p; break; }
        }
        if (!chosen) return { chosen: null, tried };
        // One conversation: E to open, then one E per line until it shuts.
        const out = { chosen, tried, prompt, lines: [] };
        for (let i = 0; i < 12 && (i === 0 || !hidden('dialogue-box')); i++) {
          await E();
          if (!hidden('dialogue-box')) out.lines.push(document.getElementById('dialogue-text').textContent.trim());
        }
        out.stageAfterFirst = window.__quest.stage;
        out.panelAfterFirst = !hidden('accusation-overlay');
        // And again.
        for (let i = 0; i < 12 && (i === 0 || !hidden('dialogue-box')); i++) await E();
        out.panelAfterSecond = !hidden('accusation-overlay');
        out.names = document.querySelectorAll('#accusation-people .pick-person').length;
        out.clues = document.querySelectorAll('#accusation-clues .pick-clue').length;
        out.count = document.getElementById('accusation-count').textContent.trim();
        out.sayDisabled = document.getElementById('accusation-say').disabled;
        out.held = window.__mystery.state.clues.length;
        return out;
      }, { spots, due, eye: EYE_HEIGHT });

      if (!room) fail(`the plan has no room ${due.room} on level ${due.level ?? 0}, where the Constable stands at ${mystery.watches[1]}`);
      else if (!said.chosen) fail(`none of the ${said.tried} cells within 2.8 m of the Constable's ${mystery.watches[1]} station offers him`);
      else {
        check(said.lines.length >= 3, `E opens his dialogue and steps through ${said.lines.length} lines`, said.prompt);
        check(!said.lines.includes('{ACCUSE}'), 'the {ACCUSE} token is substituted, not shown raw', JSON.stringify(said.lines.at(-1)));
        check(said.stageAfterFirst === 'investigate', 'the first conversation moves the day to `investigate`', said.stageAfterFirst);
        check(!said.panelAfterFirst, 'and opens no accusation panel');
        check(said.panelAfterSecond, 'the second conversation opens it');
        check(said.names === 13, 'twelve names and a fall', `${said.names} buttons`);
        check(said.clues === said.held, `and the ${said.held} clues held so far`, `${said.clues} buttons`);
        check(/0 of 3/.test(said.count), 'nothing presented yet, up to three allowed', said.count);
        check(said.sayDisabled, 'and the button is dead until somebody is named');
      }
    }
  }

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
