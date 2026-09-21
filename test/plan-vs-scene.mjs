// plan-vs-scene.mjs — the plan against the castle the browser actually builds.
//
//   node test/plan-vs-scene.mjs        (from the repo root)
//
// Runs against `vite dev` — source, not the bundle. test/built.mjs is the one
// check that loads what `npm run build` produced.
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
// WHAT THIS FILE IS FOR, AND WHAT layout.mjs IS FOR (#529). `layout.mjs` is
// every fact derivable from the plan in Node: geometry, reachability, the plan
// against `mystery.json`. THIS FILE IS THE SEAMS ONLY — that the builder placed
// what the plan named (the box diff), that the runtime stands where the plan
// says (`settle()`), that a tint reached a material, and that the DOM wiring
// works (prompt, E, J, bell, panel). **Nothing asserted here may be provable in
// Node.** Where this file needs a Node fact to do its job — a room to anchor
// in, floor under a station — it states it as a precondition that throws, names
// the suite that owns it, and asserts nothing. `test/mystery.mjs` owns the
// stations, through `validateMystery`'s nav rails.
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
import { serveDev, launch, prepPage, threeUrl } from './harness.mjs';
import { attachSceneProbe, waitForProbe } from './drive.mjs';
import { partsOf } from './gltf.mjs';
import { makePlan, walkability, surfacesAt, EYE_HEIGHT } from '../src/castle-plan.js';
import { castleNav } from '../src/stations.js';
import { stopWorld } from '../src/populace.js';
import { dayTwoCastle, dayTwoOutcomes } from '../src/mystery.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const PORT = 8125; // not 8124 (play-castle.mjs) and not 8126 (built.mjs)
const BASE = `http://127.0.0.1:${PORT}`;
const GAME = `${BASE}/`;
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

const server = await serveDev(PORT);
const THREE_URL = await threeUrl(BASE);
const browser = await launch();
const page = await prepPage(browser, { width: 900, height: 700, dsf: 1 });

try {
  // A save resumes the quest, and a resumed quest opens the gate — which swings
  // the leaf out of the plan's closed position and drops its collider. Clear the
  // one key (src/save.js, castleConundrumSave_v1) BEFORE the game is ever
  // loaded, from a cheap page on the same origin. See test/blank.html for why it
  // is not a reload.
  await page.goto(`${BASE}/test/blank.html`, { waitUntil: 'domcontentloaded' });
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
  /* A PRECONDITION, NOT A CHECK (#529). Whether every room has somewhere to
   * stand at its centre is arithmetic over the plan, `layout.mjs` check 15
   * owns it, and it used to be asserted here as well. What is left is the
   * suite refusing to run on a castle it cannot anchor in, rather than quietly
   * measuring fewer rooms than there are. */
  const anchorless = anchors.filter((a) => a.h == null);
  if (anchorless.length) throw new Error(`no floor at the centre of ${anchorless.map((a) => a.id).join(', ')} — test/layout.mjs check 15 should have failed first`);
  const stood = await page.evaluate(async ({ anchors, eye }) => anchors.map((a) => {
    if (a.h == null) return { ...a, got: null };
    window.__cam.position.set(a.x, a.h + 0.3 + eye, a.z);
    const on = window.__player.settle();
    return { ...a, got: on ? on.h : null, camY: window.__cam.position.y, surface: on ? on.surface : null };
  }), { anchors, eye: EYE_HEIGHT });
  let worstStand = -1, worstRoom = null, stoodOk = 0;
  for (const s of stood) {
    if (s.got == null) { fail(`standing the camera at (${s.x.toFixed(2)}, ${s.z.toFixed(2)}) in ${s.id}, level ${s.level}, the runtime finds nothing under it within a step of the plan's floor at ${s.h.toFixed(2)}`); continue; }
    const d = Math.abs(s.got - s.h);
    if (d > worstStand) { worstStand = d; worstRoom = s.id; }
    if (d > TOL) fail(`in ${s.id} (level ${s.level}) the plan's floor is at ${s.h.toFixed(3)} and the runtime stands on ${s.surface} at ${s.got.toFixed(3)}, ${d.toFixed(3)} m off`);
    else if (Math.abs(s.camY - (s.got + EYE_HEIGHT)) > TOL) fail(`in ${s.id} the eye settled at y ${s.camY.toFixed(3)} over a floor at ${s.got.toFixed(3)}, not ${EYE_HEIGHT} above it`);
    else stoodOk++;
  }
  const perLevel = plan.levels.map((l) => `${stood.filter((s) => s.level === l).length} on level ${l}`).join(', ');
  if (stoodOk === stood.length) pass(`the camera stands on the plan's floor in all ${stood.length} rooms (${perLevel}), worst ${Math.max(0, worstStand).toFixed(4)} m in ${worstRoom}`);

  /* AND THE HUD SAYS WHERE (#515). The room line is written by the page's own
   * `nav.roomAt` on the next frame after the camera moves, so with the camera
   * settled in each room the line has to read what the same resolver, run
   * here in Node over the same plan, names for that point. Two frames are
   * waited for, not timed. Assert against the DOM for what just happened
   * (#39): a resolver that is right and a HUD line nobody writes to would pass
   * everything above. */
  {
    const hudNav = castleNav(plan, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mystery.json'), 'utf8')));
    const want = stood.filter((s) => s.h != null).map((s) => ({ ...s, name: hudNav.roomAt(s.x, s.z, s.h).name }));
    const read = await page.evaluate(async ({ want, eye }) => {
      const out = [];
      const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
      for (const a of want) {
        window.__cam.position.set(a.x, a.h + 0.3 + eye, a.z);
        window.__player.settle();
        await frame(); await frame();
        out.push({ id: a.id, shown: document.getElementById('hud-room')?.textContent ?? null });
      }
      return out;
    }, { want, eye: EYE_HEIGHT });
    let named = 0;
    for (let i = 0; i < want.length; i++) {
      if (read[i].shown === want[i].name) named++;
      else fail(`standing in ${want[i].id} the HUD's room line reads ${JSON.stringify(read[i].shown)}, and roomAt names it ${JSON.stringify(want[i].name)}`);
    }
    if (named === want.length) pass(`the HUD's room line names the room the camera stands in, all ${named} rooms`);
  }

  /* --------------------------------------- a shadow, and a hand (rank 11) ---
   * BACKLOG.md rank 11's first increment, and the Node half of it.
   * `src/player-rig.js` puts two objects in the scene that no plan piece
   * describes: a blob shadow that sits on whatever the feet are standing on,
   * and a hand that comes up out of the bottom of the frame and reaches for a
   * door's lock. What a GPU has to answer is whether either of them READS — a
   * blob on stone against a blob on grass, a hand that looks like a hand — and
   * that is the row's other acceptance criterion, under #53.
   *
   * What a browser can settle without a frame rate is asserted here: that the
   * shadow is where the feet are in every room the castle has, that the hand is
   * out of the frame with no door in front of it and out at the lock with one,
   * and that NEITHER OBJECT CAN BLOCK A RAY. The last of those is the one that
   * would break the castle quietly rather than loudly: the rig is a top-level
   * child of the scene, and interaction.js's line-of-sight test calls every
   * top-level child that is not a target an occluder. A shadow under the
   * player's own feet would sit in the path of every ray the player casts
   * downhill, and the prompt would just stop appearing. So the control is built
   * into the assertion: the ray is cast twice, once with the rig's own
   * `raycast` and once with THREE.Mesh's put back, and the second one has to
   * hit (#34).
   *
   * NOTHING BELOW IS TIMED. `__rig.settle()` collapses the reach's smoothing
   * the same way `__player.settle()` collapses a step down to the floor, so
   * every number read here is a position and none of them is a duration.
   */
  console.log('');
  {
    const doorPose = { x: 21, y: 1.7, z: -12, yaw: -0.026 }; // the word-lock beat's own
    const feel = await page.evaluate(async ({ anchors, eye, pose }) => {
      const THREE = window.__THREE;   // stashed by attachSceneProbe
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const rig = window.__rig;
      const cam = window.__cam;
      const p = (v) => ({ x: v.x, y: v.y, z: v.z });
      const promptNow = () => {
        const el = document.getElementById('interact-prompt');
        return el && !el.classList.contains('hidden') ? el.textContent.trim() : null;
      };
      /* The riddle overlay has been open since the word-lock beat, and an open
       * overlay owns the input: interaction.update() hides the prompt and never
       * picks a target, so the hand would have nothing to reach for. Shut it the
       * way two beats below this one do — and press E at the door again on the
       * way out, because those beats say in their own comments that they found
       * it open and this one is not going to make that a lie (#147). */
      document.getElementById('riddle-cancel').click();
      await frame();

      // Is either object something the plan thinks it placed? It must not be:
      // the rig moves with the player and the box diff above compares live
      // boxes against fixed ones.
      const tagged = [rig.shadow, rig.hand].filter((o) => o.userData && o.userData.planId).length;
      const rooted = rig.group.parent === window.__scene;
      // And the flag play-castle.mjs's two scenery sweeps skip it by. That
      // suite is the one CI cannot run (#53), so the fact it depends on is
      // asserted here, in the suite that does.
      const flagged = rig.group.userData.playerRig === true;

      // 1. The shadow, in every room the standing beat stands in.
      const feet = [];
      for (const a of anchors) {
        if (a.h == null) continue;
        cam.position.set(a.x, a.h + 0.3 + eye, a.z);
        const on = window.__player.settle();
        rig.settle();
        feet.push({
          id: a.id, level: a.level, surface: on ? on.surface : null, floor: on ? on.h : null,
          cam: p(cam.position), shadow: p(rig.shadow.position),
        });
      }

      // 2. The hand, with the door behind the player and then in front of it.
      const look = (yaw) => {
        cam.position.set(pose.x, pose.y, pose.z);
        cam.rotation.set(0, yaw, 0, 'YXZ');
        window.__player.settle(); // the feet, which is what the shadow is on
      };
      look(pose.yaw + Math.PI);
      await frame();
      rig.settle();
      const away = { reach: rig.reach, visible: rig.hand.visible, prompt: promptNow() };

      look(pose.yaw);
      await frame();
      rig.settle();
      const lock = window.__castle.locks()[0] || null;
      const handle = lock && lock.focus ? p(lock.focus) : null;
      const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      const toHand = new THREE.Vector3().subVectors(rig.hand.position, cam.position);
      const at = {
        reach: rig.reach, visible: rig.hand.visible, prompt: promptNow(),
        hand: p(rig.hand.position),
        fromEye: toHand.length(),
        inFront: toHand.clone().normalize().dot(ahead),
        toHandle: handle ? new THREE.Vector3(handle.x, handle.y, handle.z).distanceTo(rig.hand.position) : null,
        restToHandle: null,
      };
      /* How far the hand is from the handle when it is NOT reaching, off the
       * same camera in the same place, so "it reaches" is a comparison and not
       * a bare number. `want` is what the next frame would smooth towards;
       * settling it to 0 and back to 1 asks the rig for both ends of its own
       * lerp without moving the player. */
      const held = rig.hand.position.clone();
      rig.want = 0; rig.settle();
      at.restToHandle = handle ? new THREE.Vector3(handle.x, handle.y, handle.z).distanceTo(rig.hand.position) : null;
      rig.want = 1; rig.settle();
      at.returned = rig.hand.position.distanceTo(held);

      // 3. The rays, each cast twice: the rig's own raycast, then THREE.Mesh's.
      const both = (object, from, dir, far) => {
        const ray = new THREE.Raycaster(from.clone(), dir.clone().normalize(), 0.02, far);
        const withRig = ray.intersectObject(object, true).length;
        const saved = object.raycast;
        object.raycast = THREE.Mesh.prototype.raycast;
        const withMesh = ray.intersectObject(object, true).length;
        object.raycast = saved;
        return { withRig, withMesh };
      };
      const rays = {
        shadow: both(rig.shadow, cam.position, new THREE.Vector3(0, -1, 0), 4),
        hand: both(rig.hand, cam.position, toHand, toHand.length() + 0.5),
      };

      // Put the riddle back up, the way the player would.
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
      await frame();
      const riddleBack = !document.getElementById('riddle-overlay').classList.contains('hidden');
      return { tagged, rooted, flagged, feet, away, at, rays, riddleBack };
    }, { anchors, eye: EYE_HEIGHT, pose: doorPose });

    check(feel.rooted && feel.tagged === 0 && feel.flagged,
      'the rig is one flagged group in the scene and neither of its objects carries a planId',
      `${feel.tagged} tagged, ${feel.flagged ? 'flagged' : 'NOT flagged as the player rig'}`);

    let worstFeet = -1, worstFeetRoom = null, onFeet = 0;
    for (const f of feel.feet) {
      const flat = Math.max(Math.abs(f.shadow.x - f.cam.x), Math.abs(f.shadow.z - f.cam.z));
      const lift = f.shadow.y - f.floor;
      if (flat > worstFeet) { worstFeet = flat; worstFeetRoom = f.id; }
      if (flat > TOL) fail(`standing in ${f.id} the shadow is ${flat.toFixed(3)} m from under the player`);
      else if (!(lift > 0 && lift <= 0.05)) fail(`in ${f.id} the shadow sits ${lift.toFixed(3)} m over a floor at ${f.floor.toFixed(3)} — it is buried in it, or hovering`);
      else onFeet++;
    }
    const surfaces = new Set(feel.feet.map((f) => f.surface).filter(Boolean));
    check(onFeet === feel.feet.length && feel.feet.length > 0,
      `the shadow lies on the floor under the player's feet in all ${feel.feet.length} rooms, over ${surfaces.size} kinds of surface`,
      `worst ${Math.max(0, worstFeet).toFixed(4)} m in ${worstFeetRoom}`);
    /* A SHADOW NAILED TO ONE SPOT WOULD PASS EVERY LINE ABOVE IF THE PLAYER
     * NEVER MOVED, AND THE LINES ABOVE MOVE THE PLAYER FORTY TIMES WITHOUT EVER
     * SAYING THE SHADOW WENT WITH IT. It is the trap the standing beat answers
     * by putting the camera a step too high: assert that the thing moved, not
     * only that it agrees. */
    const spots = new Set(feel.feet.map((f) => `${f.shadow.x.toFixed(2)},${f.shadow.y.toFixed(2)},${f.shadow.z.toFixed(2)}`));
    // The floor is in the key as well as x and z: two rooms on two levels can
    // sit over each other, and a shadow that only tracked x and z would be
    // right in both of them for the wrong reason.
    const stoodAt = new Set(feel.feet.map((f) => `${f.cam.x.toFixed(2)},${f.floor.toFixed(2)},${f.cam.z.toFixed(2)}`));
    check(spots.size === stoodAt.size, `and it is somewhere different in each of the ${stoodAt.size} places that is`, `${spots.size} places`);

    check(feel.rays.shadow.withRig === 0 && feel.rays.shadow.withMesh > 0,
      'a ray straight down from the eye passes through the shadow, and hits it with THREE.Mesh\'s own raycast put back',
      `${feel.rays.shadow.withRig} hit, ${feel.rays.shadow.withMesh} with the control`);
    check(feel.rays.hand.withRig === 0 && feel.rays.hand.withMesh > 0,
      'and a ray from the eye through the reaching hand does the same',
      `${feel.rays.hand.withRig} hit, ${feel.rays.hand.withMesh} with the control`);

    check(feel.away.reach === 0 && feel.away.visible === false,
      'with the word-lock behind the player the hand is not on the screen at all',
      `reach ${feel.away.reach}, ${feel.away.prompt ? `prompting "${feel.away.prompt}"` : 'no prompt'}`);
    check(feel.at.prompt && /word-lock/i.test(feel.at.prompt) && feel.at.reach === 1 && feel.at.visible,
      'and turning round to it brings the hand out',
      `reach ${feel.at.reach}, prompt ${JSON.stringify(feel.at.prompt)}`);
    check(feel.at.toHandle != null && feel.at.toHandle < feel.at.restToHandle && feel.at.returned === 0,
      'the hand it brings out is nearer the lock than the one it keeps below the frame',
      `${feel.at.toHandle?.toFixed(2)} m against ${feel.at.restToHandle?.toFixed(2)} m`);
    check(feel.at.fromEye <= 1.0 && feel.at.inFront > 0.3,
      'and it reaches from the player rather than flying to the door',
      `${feel.at.fromEye.toFixed(2)} m from the eye, ${feel.at.inFront.toFixed(2)} of the way in front of it`);
    check(feel.riddleBack, 'and the beat leaves the riddle overlay open, the way it found it');
  }

  /* --------------------------------- eight drums, eight tints, two sets ---
   * The drums were one stone at one size and from the walk they were eight of
   * one thing; each carries a `tint` now (#516). Rank 4 split them by ward
   * (#541): the four inner drums are castle_brick_02_red, the four outer stay
   * defense_wall, so a tower tells you which ward you are in before its tint
   * does. The tint lands on the material's colour when the diffuse arrives,
   * and the maps are cached by URL, so the eight materials read exactly the
   * two textures the plan names them — one per ward, not one for all eight
   * any more. Both halves are read off the live scene: every drum's material
   * colour is the tint the plan gives it, eight tints all different, and each
   * drum's map is the one its own plan piece names. The first version asked
   * only for eight distinct colours, and a drum whose tint was deleted on
   * purpose came back white, which is distinct too (#34).
   */
  {
    const want = plan.pieces.filter((p) => p.built === 'drum').map((p) => ({ id: p.id, material: p.material, tint: p.tint ? p.tint.replace('#', '').toLowerCase() : null }));
    const drums = await page.evaluate((ids) => ids.map((id) => {
      let mesh = null;
      window.__scene.traverse((o) => { if (!mesh && o.userData?.planId === id) o.traverse((m) => { if (!mesh && m.isMesh) mesh = m; }); });
      const mat = mesh && (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);
      return { id, colour: mat ? mat.color.getHexString() : null, map: mat && mat.map ? mat.map.uuid : null };
    }), want.map((w) => w.id));
    const wrong = want.filter((w, i) => !w.tint || drums[i].colour !== w.tint).map((w, i) => `${w.id} wants ${w.tint ?? 'no tint at all'} and shows ${drums[want.indexOf(w)].colour}`);
    const tints = new Set(want.map((w) => w.tint));
    const materials = new Set(want.map((w) => w.material)), maps = new Set(drums.map((d) => d.map));
    check(want.length === 8 && tints.size === 8 && !wrong.length, `${want.length} drums, each the colour of its own tint, ${tints.size} tints all different`, wrong.join('; ') || `${tints.size} distinct tints`);
    const perMaterial = new Set(want.map((w, i) => `${w.material} ${drums[i].map}`));
    check(maps.size === materials.size && !maps.has(null) && perMaterial.size === materials.size,
      `and ${materials.size} diffuse map(s) between them, one per stone`, `${maps.size} maps over ${materials.size} materials`);
  }

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
  /* AND SO IS THIS (#529). "There is floor under every station" is
   * `validateMystery`'s rail and test/mystery.mjs fails on it by name; a body
   * with no floor to stand on cannot be compared against a point in a browser
   * either way. */
  const floorless = due.filter((n) => n.at.h == null);
  if (floorless.length) throw new Error(`${floorless.map((n) => n.id).join(', ')} are due at Prime where the grid finds no floor — test/mystery.mjs's validateMystery should have failed first`);
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
  check(bodies.length === 13, `the page spawns ${bodies.length} bodies`, "twelve for the day and the King's inspector for the morning after (#534)");
  let offStation = 0;
  for (const { id, at } of due) {
    const b = seen.get(id);
    if (!b) { fail(`${id} is in the schedule at Prime and the page spawned no such body`); offStation++; continue; }
    if (!b.visible) { fail(`${id} is due in ${at.room} at Prime and the page left the body hidden`); offStation++; continue; }
    const d = Math.max(Math.abs(b.x - at.x), Math.abs(b.z - at.z), Math.abs(b.y - at.h));
    if (d > TOL) { fail(`${id} stands at (${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)}) and the plan's Prime station is (${at.x.toFixed(2)}, ${at.h.toFixed(2)}, ${at.z.toFixed(2)}), ${d.toFixed(3)} m off`); offStation++; }
  }
  if (!offStation) pass(`all ${due.length} bodies due at Prime stand on their own station within ${TOL} m, on ${new Set(due.map((n) => n.at.level)).size} level(s)`);
  /* AND THE ONE ON THE UPPER FLOOR IS ON IT. Lady Alys is in the royal
   * apartments at Prime, over the King's Hall, and her feet belong at 4.0.
   * The check above could not say so while the station carried no height and
   * both sides of it read `h ?? 0`: she stood on the ground floor inside the
   * hall and everything agreed she was where she should be (#147). That
   * somebody IS upstairs at Prime — without which this line asserts nothing —
   * is a fact about `mystery.json`'s schedule and test/mystery.mjs holds it
   * beside the schedule (#529). */
  const upstairs = due.filter((n) => n.at.level > 0);
  const grounded = upstairs.filter((n) => (seen.get(n.id)?.y ?? 0) < 0.5);
  check(grounded.length === 0,
    `${upstairs.length} of them stand above the ground floor, on their own floor: ${upstairs.map((n) => `${n.id} at y ${(seen.get(n.id)?.y ?? 0).toFixed(1)}`).join(', ')}`,
    grounded.map((n) => n.id).join(', ') + ' on the ground');
  const absent = bodies.filter((b) => !b.visible).map((b) => b.id).sort();
  check(absent.join() === 'inspector,merchant', 'the two who are not in the castle at Prime are hidden rather than standing at the origin', `hidden: ${absent.join(', ') || 'nobody'}`);
  /* --- AND THE OTHER TEN (#616). The household spawns off data/populace.json
   * beside the thirteen and is a separate list on purpose: `window.__cast`
   * above is counted by id and by name, and folding the ten into it would
   * have left every assertion in this beat reading the same and meaning
   * something else (#147).
   *
   * WHAT ONLY THE PAGE CAN SAY. Node has already run `validatePopulace` over
   * every stop of every routine in test/mystery.mjs, so where they are DUE is
   * settled. What is not is whether ten more NPC instances were built at all
   * and put where the first stop of the ring says — the body count comes out
   * of a Promise.all over ten `build()` calls and the placement out of
   * `Populace.setWatch`, which the read below calls for itself (see the park
   * note), and neither of those exists in Node. */
  {
    const populace = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/populace.json'), 'utf8'));
    const dueNow = populace.people
      .map((p) => ({ id: p.id, stop: (p.routine?.[mystery.watches[0]] ?? [])[0] }))
      .filter((p) => p.stop)
      .map((p) => ({ ...p, at: stopWorld(nav, p.stop) }));
    /* PARK THE RINGS BEFORE MEASURING, AND SAY WHAT THAT COSTS (#724, #147).
     * `Populace.setWatch` places a body and starts its first dwell at
     * `DWELL * (0.5 + phase)` seconds — 4.5 s for the first ring, 11.2 s for
     * the last — so on a machine slow enough to spend that long between the
     * page's own `setWatch` and this read, a body is already walking its ring
     * and stands nowhere near stop 1. This beat was green six times in six
     * here and red twice in CI, 0.055 m off on 2026-09-18 and 0.408 m off on
     * the merge of PR #47: two distances from one stop are two points on a leg
     * that can be the length of the room, which is a wall clock and not a
     * jitter. Calling `setWatch(watch, {walk: false})` here re-places every
     * body on stop 0 with no route and no motion — the call src/main.js makes
     * at load, so a save resumed at Sext opens with the household already
     * standing where Sext says — and what is measured below is static
     * geometry again. `TOL` stays 0.01 m, which is what this file diffs static
     * geometry at: the number a walking body is owed is `stop walking`, not a
     * larger epsilon (#13).
     *
     * WHAT THE BEAT NO LONGER SAYS is that the page called `setWatch` at load
     * at all — the line below would place these thirteen even if `init` never
     * had. That the cast is placed at load is the thirteen's own beat further
     * up, which reads bodies nothing here touches. What survives is
     * `Populace.setWatch` against Node's own `stopWorld`: the routine lookup,
     * the level, the floor height and the facing, none of which Node can
     * place. */
    await page.evaluate((watch) => window.__populace.setWatch(watch, { walk: false }), mystery.watches[0]);
    const folk = await page.evaluate(async () => (window.__folk || []).map((n) => ({
      id: n.id, name: n.name, label: n.label, prompt: n.prompt || null, visible: n.group.visible,
      x: n.group.position.x, y: n.group.position.y, z: n.group.position.z,
    })));
    check(folk.length === populace.people.length,
      `the page spawns ${folk.length} more bodies for the household, beside the thirteen`,
      `data/populace.json has ${populace.people.length}`);
    check(folk.every((f) => f.label === true && f.prompt && !/Press E/.test(f.prompt)),
      'every one of them carries a label rather than an offer to press E',
      folk.filter((f) => !f.label || !f.prompt).map((f) => f.id).join(', '));
    const byId = new Map(folk.map((f) => [f.id, f]));
    let off = 0;
    for (const { id, at, stop } of dueNow) {
      const body = byId.get(id);
      if (!body) { fail(`${id} is due at Prime in ${stop.room} and the page spawned no such body`); off++; continue; }
      if (!body.visible) { fail(`${id} is due at Prime in ${stop.room} and the page left the body hidden`); off++; continue; }
      const d = Math.max(Math.abs(body.x - at.x), Math.abs(body.z - at.z), Math.abs(body.y - at.h));
      if (d > TOL) { fail(`${id} stands at (${body.x.toFixed(2)}, ${body.y.toFixed(2)}, ${body.z.toFixed(2)}) and the first stop of the Prime ring is (${at.x.toFixed(2)}, ${at.h.toFixed(2)}, ${at.z.toFixed(2)}), ${d.toFixed(3)} m off`); off++; }
    }
    if (!off) pass(`all ${dueNow.length} of them stand on the first stop of their Prime ring within ${TOL} m, on ${new Set(dueNow.map((d) => d.at.level)).size} level(s)`);
    /* AND THE ONE WHO IS NOT IN THE CASTLE YET IS HIDDEN. A routine with no
     * Prime in it is a body that has not arrived, which is the merchant's own
     * answer one list over; standing them at the origin instead would put a
     * carter inside the west barbican's ground at every load. */
    const notYet = populace.people.filter((p) => !(p.routine?.[mystery.watches[0]] ?? []).length).map((p) => p.id);
    check(notYet.length > 0 && notYet.every((id) => byId.get(id) && !byId.get(id).visible),
      `and ${notYet.join(', ')} — who has no Prime stop — is hidden rather than standing at the origin`,
      notYet.length ? notYet.filter((id) => byId.get(id)?.visible).join(', ') : 'nobody in the file skips Prime, so this asserts nothing');
  }
  /* AND THE RING ACTUALLY TURNS (#616). Everything above is where a body was
   * PUT; this is the only assertion that a routine of more than one stop is a
   * loop rather than a list nobody reads past the first entry. `Populace`
   * counts a dwell down, asks the nav for a route, hands it to `walkTo` and
   * waits for `walking` to go false, and none of those four exists in Node.
   *
   * THIS IS NOT THE REAL-TIME ASSERTION #53 FORBIDS. The dt is supplied —
   * 0.05 s a step, the same clamp main.js's loop applies — rather than
   * measured off a clock, and the loop below is driven by hand instead of by
   * `setAnimationLoop`. What comes out is arithmetic over a fixed step, and a
   * software rasteriser with no compositor changes none of it. What this
   * could not say is how it LOOKS, and that is `npm run play`'s.
   */
  {
    const turned = await page.evaluate(async ({ dt, cap }) => {
      const pop = window.__populace;
      const body = pop.bodies.find((b) => b.stops.length > 1 && b.npc.group.visible);
      if (!body) return null;
      const from = body.index;
      const to = body.stops[(from + 1) % body.stops.length];
      const home = body.npc.group.position.clone();
      const clipNow = () => (body.npc._current ? body.npc._current.getClip().name : null);
      let steps = 0, walked = false, onArrival = null;
      while (steps < cap) {
        const wasWalking = body.npc.walking;
        body.npc.update(dt, window.__player.camera.position);
        /* THE FRAME THE ROUTE ENDS ON, READ BEFORE THE DRIVER GETS TO SEE IT.
         * `Populace._arrive` sets the activity a moment later whatever npc.js
         * did, so reading the clip after both have run says nothing about
         * which of them chose it — that version of this assertion passed with
         * the bug reintroduced on purpose (#34). What is read here is npc.js's
         * own answer to "the walk is over, what now", and that is `_restKey`. */
        if (wasWalking && !body.npc.walking && onArrival === null) onArrival = clipNow();
        pop.update(dt);
        steps += 1;
        if (body.npc.walking) walked = true;
        if (body.index !== from && !body.npc.walking) break;
      }
      const out = {
        id: body.person.id, name: body.npc.name, stops: body.stops.length,
        from, index: body.index, walked, seconds: +(steps * dt).toFixed(2), capped: steps >= cap,
        off: Math.max(Math.abs(body.npc.group.position.x - to.x), Math.abs(body.npc.group.position.z - to.z), Math.abs(body.npc.group.position.y - to.h)),
        activity: body.stops[body.index].activity,
        rest: body.npc._restKey, onArrival,
      };
      body.npc.group.position.copy(home);
      return out;
    }, { dt: 0.05, cap: 4000 });
    if (!turned) fail('no populace body at Prime has a ring of more than one stop, so nothing here turns');
    else {
      check(!turned.capped && turned.index !== turned.from,
        `${turned.name}'s ${turned.stops}-stop Prime ring steps from stop ${turned.from + 1} to stop ${turned.index + 1} after ${turned.seconds} s of supplied time`,
        turned.capped ? 'the loop hit its step cap and the ring never turned' : '');
      check(turned.walked, 'and gets there by walking a route rather than by appearing at the next stop');
      check(turned.off <= TOL, `and stands on it within ${TOL} m`, `${turned.off.toFixed(3)} m off`);
      /* AND IT DOES NOT BLINK BACK TO STANDING ON THE WAY. npc.js's arrival
       * branch played the literal `idle` until this row, so a body that
       * walked to the oven dropped out of `bake` for the frame it arrived on
       * and was put back into it by the driver on the next one. `_restKey` is
       * what makes the arrival branch play the job instead, and reverting that
       * one word is what this line fails on.
       *
       * IT IS THE PREVIOUS STOP'S JOB ON THAT FRAME, not the next one's, which
       * is why the assertion is "not Idle" rather than a named clip: npc.js
       * knows what the body was doing and the driver is what knows where it is
       * now going. Both stops of the ring under test are `bake`, so the one
       * thing that separates the two versions is the bare Idle. */
      check(turned.onArrival && turned.onArrival !== 'Idle',
        `and the frame the walk ends on it is already in "${turned.onArrival}" rather than blinking back to Idle`,
        `npc.js chose ${turned.onArrival} at the end of the route`);
      check(turned.rest === `do:${turned.activity}`,
        `and settles in its stop's own activity, "${turned.activity}"`,
        `rest key is ${turned.rest}`);
    }
  }
  /* AND A HIDDEN BODY IS NOT SOMETHING TO PRESS E AT (#538). Two of the
   * thirteen are invisible at Prime and on the morning after the man who
   * hanged is invisible at the station the accusation was made at, which is
   * somewhere the player is certain to walk. `InteractionSystem` skips a
   * target whose `active` is false and NPCs did not have one, so the HUD
   * offered his name over an empty floor. Only the page can say this: the
   * prompt is the product of a camera, a facing test and a line-of-sight cast,
   * and modelling any of that here would be re-implementing the thing under
   * test (#34).
   *
   * THE CONTROL IS THE SAME CAMERA AND THE SAME SPOT. A "no prompt" on its own
   * proves nothing — the camera might be looking at a wall — so the hidden body
   * is made visible without moving anything and the prompt has to appear. One
   * beat, two reads, and the second is what gives the first its meaning. */
  {
    const hall = grid.rooms().find((r) => r.id === 'great-hall');
    const stand = hall?.at?.[Math.floor((hall.at?.length ?? 0) / 2)] ?? null;
    const look = stand ? hall.at.find((c) => c.level === stand.level && Math.abs(Math.hypot(c.x - stand.x, c.z - stand.z) - 2.0) < 0.35) : null;
    const who = bodies.find((b) => !b.visible)?.id ?? null;
    if (!stand || !look || !who) fail('no hidden body and two cells 2 m apart in the Great Hall to try it from');
    else {
      const seen = await page.evaluate(async ({ at, from, id, eye }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const promptNow = () => { const el = document.getElementById('interact-prompt'); return el && !el.classList.contains('hidden') ? el.textContent.trim() : null; };
        // The word-lock beat above left the riddle overlay open, and an open
        // overlay owns the input: `interaction.update()` hides the prompt
        // whatever is in front of the camera. Shut it the way the player would,
        // which is what the bell beat below does for the same reason. The
        // control is what found this: the first run of this beat reported no
        // prompt for a VISIBLE body, which would have made the line under it
        // pass while asserting nothing.
        document.getElementById('riddle-cancel').click();
        await frame();
        const n = window.__cast.find((x) => x.id === id);
        const home = n.group.position.clone();
        n.group.position.set(at.x, at.h, at.z);
        window.__player.camera.position.set(from.x, from.h + eye, from.z);
        window.__player.camera.rotation.set(0, Math.atan2(-(at.x - from.x), -(at.z - from.z)), 0, 'YXZ');
        await frame();
        const hidden = promptNow();
        n.group.visible = true;
        await frame();
        const shown = promptNow();
        n.group.visible = false;
        n.group.position.copy(home);
        return { hidden, shown, name: n.name };
      }, { at: stand, from: look, id: who, eye: EYE_HEIGHT });
      check(!!seen.shown && seen.shown.includes(seen.name),
        `the same body, made visible on the same spot, prompts "${seen.shown}"`,
        seen.shown === null ? 'no prompt at all, so the camera is not looking at him and the line below proves nothing' : seen.shown);
      check(seen.hidden === null, `and hidden, 2 m in front of the camera, ${who} offers nothing to press E at`,
        seen.hidden ? `the HUD said "${seen.hidden}" over a body nobody can see` : '');
    }
  }
  /* AND A LABEL NEVER TAKES THE PROMPT OFF SOMEBODY WHO HAS SOMETHING TO SAY
   * (#617). `InteractionSystem` picked the nearest target in range and nothing
   * else until the household arrived. The twelve are held 1.5 m apart from the
   * ten by `STATION_CLEARANCE` and E reaches 3.2 m, so a populace body between
   * the player and a suspect is legitimately the NEARER of the two — and under
   * the old rule the HUD read "Iorwerth — the baker's lad" while the Constable
   * stood a metre behind him with the whole mystery in his mouth.
   *
   * THE CONTROL IS THE SAME CAMERA AND THE SAME TWO BODIES. A prompt naming
   * the suspect proves nothing on its own — the label body might be out of
   * range, or behind the camera — so the suspect is hidden without moving
   * anything and the label has to take the prompt. Two reads, and the second
   * is what gives the first its meaning.
   */
  {
    const hall = grid.rooms().find((r) => r.id === 'great-hall');
    const stand = hall?.at?.[Math.floor((hall.at?.length ?? 0) / 2)] ?? null;
    const look = stand ? hall.at.find((c) => c.level === stand.level && Math.abs(Math.hypot(c.x - stand.x, c.z - stand.z) - 2.4) < 0.35) : null;
    if (!stand || !look) fail('no two cells 2.4 m apart in the Great Hall to try the prompt from');
    else {
      const seen = await page.evaluate(async ({ at, from, eye }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const promptNow = () => { const el = document.getElementById('interact-prompt'); return el && !el.classList.contains('hidden') ? el.textContent.trim() : null; };
        const suspect = window.__cast.find((n) => n.group.visible);
        const folk = window.__folk[0];
        const homes = [suspect.group.position.clone(), folk.group.position.clone()];
        const wasVisible = folk.group.visible;
        // The suspect at the far point, the label body a third of the way
        // there: strictly nearer to the camera, strictly in range, strictly
        // in the line of sight.
        suspect.group.position.set(at.x, at.h, at.z);
        folk.group.visible = true;
        folk.group.position.set(from.x + (at.x - from.x) / 3, at.h, from.z + (at.z - from.z) / 3);
        window.__player.camera.position.set(from.x, from.h + eye, from.z);
        window.__player.camera.rotation.set(0, Math.atan2(-(at.x - from.x), -(at.z - from.z)), 0, 'YXZ');
        await frame();
        const both = promptNow();
        const gap = {
          label: Math.hypot(folk.group.position.x - from.x, folk.group.position.z - from.z),
          suspect: Math.hypot(at.x - from.x, at.z - from.z),
        };
        // The control: take the suspect away and the label is all there is.
        suspect.group.visible = false;
        await frame();
        const alone = promptNow();
        suspect.group.visible = true;
        suspect.group.position.copy(homes[0]);
        folk.group.position.copy(homes[1]);
        folk.group.visible = wasVisible;
        return { both, alone, gap, suspect: suspect.name, folk: folk.name };
      }, { at: stand, from: look, eye: EYE_HEIGHT });
      check(seen.gap.label < seen.gap.suspect,
        `the label body stands ${seen.gap.label.toFixed(2)} m from the camera and the suspect ${seen.gap.suspect.toFixed(2)} m, so nearest-wins would pick the label`,
        JSON.stringify(seen.gap));
      check(!!seen.both && seen.both.includes(seen.suspect),
        `and the HUD offers "${seen.both}" past ${seen.folk} standing in front of him`,
        seen.both === null ? 'no prompt at all, so the camera is not looking at either of them and both lines here prove nothing' : seen.both);
      check(!!seen.alone && seen.alone.includes(seen.folk),
        `and with the suspect hidden on the same spot it falls back to "${seen.alone}"`,
        seen.alone === null ? 'no prompt at all, so the label body was never in range and the line above proves nothing' : seen.alone);
    }
  }
  /* AND WHAT THE VERDICT DOES TO THE STONE (#539). `castle-builder.js`'s
   * `applyDay` is the one half of the second day that Node cannot run: it takes
   * a mesh out of a live scene and its box out of a live collider list, and
   * `test/layout.mjs` can only say what the plan would allow. The rows are not
   * copied in here — they come out of `src/mystery.js` for a named ending, the
   * same way the manager gets them — and what is asserted is that the piece the
   * data names really goes, collider and all, and really comes back.
   *
   * THE COLLIDER IS THE HALF WORTH THE BEAT. Hiding a mesh is one line and hard
   * to get wrong; leaving its box in `castle.colliders` is a wall nobody can
   * see, standing in an open cell on the morning the smith was let out of it.
   */
  {
    const full = dayTwoCastle(mystery, dayTwoOutcomes(mystery).find((o) => o.key === 'full'));
    const hide = full.find((c) => c.set === 'gone');
    if (!hide) fail('no ending hides a piece of the castle, so this beat has nothing to watch');
    else {
      const swung = await page.evaluate(async ({ changes, id }) => {
        const castle = window.__castle;
        const boxes = () => castle.colliders.filter((c) => c.id === id).length;
        const obj = castle.objects.get(id);
        const before = { visible: obj.visible, boxes: boxes() };
        castle.applyDay(changes);
        const after = { visible: obj.visible, boxes: boxes() };
        castle.applyDay(changes.map((c) => ({ ...c, set: c.set === 'gone' ? 'shown' : c.set })));
        const back = { visible: obj.visible, boxes: boxes() };
        return { before, after, back, planned: castle.plan.colliders.filter((c) => c.id === id).length };
      }, { changes: full, id: hide.piece });
      check(swung.before.visible && swung.before.boxes === swung.planned && swung.planned > 0,
        `${hide.piece} starts the day standing, with its ${swung.planned} collider${swung.planned === 1 ? '' : 's'} in the live list`,
        JSON.stringify(swung.before));
      check(swung.after.visible === false, `and the full ending's own rows take it out of the scene`, JSON.stringify(swung.after));
      check(swung.after.boxes === 0, `and its box out of the colliders, so the cell is not a wall nobody can see`, `${swung.after.boxes} left`);
      check(swung.back.visible === true && swung.back.boxes === swung.planned, 'and putting it back puts both back', JSON.stringify(swung.back));
    }

    /* AND `shut` PUTS THE STONE BACK, which is the half of `applyDay` that no
     * fill in Node can reach. `test/layout.mjs` can only say that shutting a
     * leaf the plan already builds shut takes nothing away; what it cannot say
     * is that `shutLeaf` restores the boxes `openLock` spliced out of the LIVE
     * list, because `openLock` empties `gd.blocks` on its way past and the ids
     * have to be rebuilt. Six of the seven endings shut this door. */
    const leaf = (mystery.day2.castle ?? []).find((c) => c.set === 'shut');
    if (!leaf) fail('no ending shuts a door, so there is nothing to watch here');
    else {
      const shut = await page.evaluate(async ({ id }) => {
        const castle = window.__castle;
        const gd = castle.gates.get(id);
        const boxes = () => gd.blockIds.filter((b) => castle.colliders.some((c) => c.id === b)).length;
        const angle = () => +gd.pivot.rotation.y.toFixed(4);
        // The word-lock beat above answered the riddle, so this leaf is open
        // when we get here. Drive it round the whole cycle rather than assume
        // either end of it, and put it back to open on the way out so the beats
        // below see the castle they were written against.
        castle.applyDay([{ piece: id, set: 'shut' }]);
        const closed = { boxes: boxes(), angle: angle() };
        castle.openLock(id, { instant: true });
        const open = { boxes: boxes(), angle: angle() };
        castle.applyDay([{ piece: id, set: 'shut' }]);
        const back = { boxes: boxes(), angle: angle() };
        castle.openLock(id, { instant: true });
        return { wants: gd.blockIds.length, closed, open, back, left: { boxes: boxes(), angle: angle() } };
      }, { id: leaf.piece });
      check(shut.wants > 0 && shut.closed.boxes === shut.wants, `${leaf.piece} shut again stands in for all ${shut.wants} pieces of stone the plan gives it`, JSON.stringify(shut.closed));
      check(shut.open.boxes === 0 && shut.open.angle !== shut.closed.angle, 'answering the word swings it and takes that stone away again', JSON.stringify(shut.open));
      check(shut.back.boxes === shut.wants && shut.back.angle === shut.closed.angle,
        'and the morning after puts the leaf and every one of its boxes back a second time',
        JSON.stringify(shut.back));
      check(shut.left.boxes === 0, 'and the beat leaves the door as it found it, open', JSON.stringify(shut.left));

      /* AND EACH SWING IS A CUE (#696). test/layout.mjs check 14 holds every
       * cue to a sound in the file; what only the page can say is that the
       * builder fires one, that main.js wired it to the audio, and that it
       * fires on a change of state and not on every call: the cycle above is
       * shut, open, shut, open, and a second `openLock` on an open leaf has
       * to be silence, or the second day's idempotent `applyDay` is two
       * doors. No speaker is asked anything (#53): `events()` is the log. */
      const cued = await page.evaluate(async ({ id }) => {
        const castle = window.__castle, audio = window.__audio;
        const gd = castle.gates.get(id);
        const before = audio.events().length;
        castle.openLock(id, { instant: true }); // already open: no cue
        castle.applyDay([{ piece: id, set: 'shut' }]);
        castle.applyDay([{ piece: id, set: 'shut' }]); // already shut: no cue
        castle.openLock(id, { instant: true });
        const fired = audio.events().slice(before);
        const c = gd.centre;
        return { fired, centre: c ? { x: c.x, y: c.y, z: c.z } : null };
      }, { id: leaf.piece });
      const cues = cued.fired.map((e) => e.cue);
      check(cues.join(' ') === 'door-shut door-open',
        `shutting it and opening it again cues door-shut then door-open, once each, and the two calls that changed nothing cue nothing`,
        `cued: ${cues.join(', ') || 'nothing'}`);
      check(cued.fired.every((e) => e.sound), 'and each cue resolved to a sound in data/sounds.json', JSON.stringify(cued.fired.map((e) => e.sound)));
      const off = cued.fired.map((e) => (e.at && cued.centre) ? Math.hypot(e.at.x - cued.centre.x, e.at.y - cued.centre.y, e.at.z - cued.centre.z) : Infinity);
      check(off.every((d) => d < 0.01), `and each is heard from the leaf's own centre`, off.map((d) => d.toFixed(2)).join(', '));
    }
  }

  /* THE HOUND'S BARK (#696). `Populace._follow` cues `hound-near` every
   * frame the hound is inside its radius, and the audio's cadence turns the
   * frames into a bark `firstSeconds` after the approach. The camera is put
   * beside the hound, the loop is driven by hand with a supplied dt as the
   * ring beat above is, and the clock the cadence reads is the page's own,
   * so the wait is a real one of `firstSeconds` and a margin, which is well
   * under a second. What is held is that a bark is cued from where the hound
   * stands and none before the wait is up; how it sounds is #53's. */
  {
    const barked = await page.evaluate(async ({ dt }) => {
      const pop = window.__populace, audio = window.__audio, cam = window.__cam;
      const body = pop.bodies.find((b) => b.person.follow && b.npc.group.visible);
      if (!body) return null;
      const sounds = await (await fetch('data/sounds.json')).json();
      const cad = sounds.events.sounds[sounds.events.byCue['hound-near']].cadence;
      const me = body.npc.group.position;
      const home = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
      cam.position.set(me.x + 1.5, me.y + 1.7, me.z);
      const before = audio.events().length;
      const t0 = performance.now();
      let early = 0, frames = 0;
      while (performance.now() - t0 < cad.firstSeconds * 1000 + 400) {
        pop.update(dt, cam.position);
        frames++;
        if (performance.now() - t0 < cad.firstSeconds * 1000 - 50 && audio.events().length > before) early++;
        await new Promise((r) => requestAnimationFrame(r));
      }
      const fired = audio.events().slice(before).filter((e) => e.cue === 'hound-near');
      cam.position.set(home.x, home.y, home.z);
      return { id: body.person.id, name: body.npc.name, at: { x: me.x, y: me.y, z: me.z }, fired, early, frames, first: cad.firstSeconds };
    }, { dt: 0.05 });
    if (!barked) fail('no populace body follows the player at Prime, so nothing here can bark');
    else {
      check(barked.fired.length >= 1, `${barked.name} beside the player cues a bark inside ${barked.first} s plus a margin (${barked.frames} frames driven)`, `${barked.fired.length} cued`);
      check(barked.early === 0, `and none before the cadence's ${barked.first} s were up`, `${barked.early} frames had one early`);
      const d = barked.fired.length ? Math.hypot(barked.fired[0].at.x - barked.at.x, barked.fired[0].at.z - barked.at.z) : Infinity;
      check(d < 0.01, `and it is heard from where the hound stands`, `${d.toFixed(2)} m off`);
    }
  }

  // The tint (#419). Three bodies, thirteen people: the cloth has to differ
  // thirteen ways and the skin must not differ at all, or the tint went onto
  // faces. Reading the live materials is the only thing that can say so —
  // npcs.json's thirteen hexes being distinct is a fact about the file.
  const cloth = new Set(bodies.map((b) => b.cloth));
  check(cloth.size === 13, `the thirteen read as thirteen: ${cloth.size} distinct sets of cloth colours off three bodies`);
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
        // WHAT EVERY CELL OFFERED, AND NOT A PROMPT READ AFTER THE LOOP (#147).
        // Until #721 the failure read `promptNow()` once the sweep was over and
        // printed it as "the nearest offered", which is the twelfth cell's
        // answer under the first cell's name — and the twelfth is the far one,
        // 1.58 m out with the bell at 1.17 m, so the message blamed the bell for
        // a beat the Constable was losing.
        const offered = [];
        for (const spot of spots) {
          tried++;
          window.__cam.position.set(spot.x, spot.h + eye, spot.z);
          window.__cam.rotation.set(0, Math.atan2(-(at.x - spot.x), -(at.z - spot.z)), 0, 'YXZ');
          await frame();
          const p = promptNow();
          offered.push(`${spot.d.toFixed(2)} m: ${p ? JSON.stringify(p) : 'nothing'}`);
          if (p && /examine/i.test(p)) { chosen = spot; prompt = p; break; }
        }
        if (!chosen) return { chosen: null, tried, offered };
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

      if (!looked.chosen) fail(`none of the ${looked.tried} cells between 0.9 and 2.8 m of the chapel candles offers them, nearest cell first — ${looked.offered.join('; ')}`);
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
  await server.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
