// shot-feel.mjs: photograph rank 11's three looks, once (BACKLOG.md, "Feel").
//
// Hand-run, on the dev machine, with a real GPU (#53):
//
//   node tools/shot-feel.mjs [outDir]
//
// The three are the row's own GPU criteria: does the blob shadow read on stone
// and on grass at the same bell, what does the flat disc do on a flight of
// stairs going up and going down, and does the hand read as a hand at the
// muniment room's word-lock, settled and while the player turns to it.
//
// HOW THE CAMERA GETS THERE. The camera is pinned the way tools/shot-yard.mjs
// pins it, through an `updateMatrixWorld` patch, and the feet are put under it
// with `__player.settle()`, which is the same `standAt` the walk uses. So the
// shadow is on the plan's own floor and the eye is EYE_HEIGHT over it, as in
// play. Every shot is taken three more times to measure the disc (`measure`).
//
// NOTHING HERE ASSERTS ANYTHING and nothing here is in `npm test`. Every shot
// is logged to `shots.log` beside the PNGs with its eye, the feet, the shadow
// and the hand.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { serveDev, launch, prepPage, threeUrl, ROOT } from '../test/harness.mjs';

const OUT = path.resolve(ROOT, process.argv[2] || path.join('looks', 'shots-feel'));
const ONLY = process.argv[3] || '';   // a name prefix: `c` re-takes the hand alone
const PORT = 8131; // not 8124..8130: the six driving suites and shot-yard

// [x, z] of a point on a flight at fraction u of its run, and the ramp's height there.
const onFlight = (f, u) => [f.from[0] + (f.to[0] - f.from[0]) * u, f.from[1] + (f.to[1] - f.from[1]) * u];

const NW1 = { from: [-36.75, -17.65], to: [-36.75, -14.35], y: [0, 3.9] };  // nw-tower-stair-1, rises north to south
const KT2 = { from: [-21.65, -16.75], to: [-18.35, -16.75], y: [4, 7.9] };   // kitchen-tower-stair-2, rises west to east
const rampY = (f, u) => f.y[0] + (f.y[1] - f.y[0]) * u;

const SHOTS = [
  // 1. The shadow, stone and grass, the same bell, two pitches each.
  { name: 'a1-shadow-stone-inner-ward-terce-down', sky: 'terce', stand: [14, -4], at: [14, -5], pitch: -1.35 },
  { name: 'a2-shadow-stone-inner-ward-terce-glance', sky: 'terce', stand: [14, -4], at: [14, -5], pitch: -0.95 },
  { name: 'a3-shadow-grass-outer-ward-terce-down', sky: 'terce', stand: [-14, -2], at: [-14, -3], pitch: -1.35 },
  { name: 'a4-shadow-grass-outer-ward-terce-glance', sky: 'terce', stand: [-14, -2], at: [-14, -3], pitch: -0.95 },
  { name: 'a5-shadow-stone-inner-ward-vespers-down', sky: 'vespers', stand: [14, -4], at: [14, -5], pitch: -1.35 },
  { name: 'a6-shadow-grass-outer-ward-vespers-down', sky: 'vespers', stand: [-14, -2], at: [-14, -3], pitch: -1.35 },

  // 2. The disc on two flights, going up and going down, at two points on each.
  ...[['nw1', NW1], ['kt2', KT2]].flatMap(([tag, f]) => [0.3, 0.62].flatMap((u) => {
    const s = onFlight(f, u);
    const up = onFlight(f, 1.5), down = onFlight(f, -0.5);
    const pct = Math.round(u * 100);
    const h = rampY(f, u);
    return [
      { name: `b-${tag}-${pct}-going-up`, sky: 'terce', stand: s, h, at: up, pitch: -0.9 },
      { name: `b-${tag}-${pct}-going-down`, sky: 'terce', stand: s, h, at: down, pitch: -0.9 },
      { name: `b-${tag}-${pct}-feet`, sky: 'terce', stand: s, h, at: up, pitch: -1.35 },
    ];
  })),

  // 3. The hand at the word-lock. The pose is plan-vs-scene's own door pose.
  { name: 'c1-hand-word-lock-turned-away', sky: 'prime', stand: [21, -12], yaw: -0.026 + Math.PI, pitch: 0 },
  { name: 'c2-hand-word-lock-at-rest', sky: 'prime', stand: [21, -12], yaw: -0.026, pitch: 0 },
  { name: 'c3-hand-word-lock-closer', sky: 'prime', stand: [21.0, -13.2], yaw: -0.026, pitch: -0.1 },
];
// While turning: the same pose, the camera swung from facing away to facing the
// door over 0.6 s of real frames, the rig's own smoothing left running.
const TURN = { name: 'c5-hand-word-lock-turning', sky: 'prime', stand: [21, -12], from: -0.026 + 1.9, to: -0.026, pitch: 0, ms: 1500, frames: [300, 700, 900, 1100, 1700] };

const pinScript = ({ from, yaw, pitch }) => {
  window.__pin = { from, yaw, pitch };
  if (window.__pinned) return;
  window.__pinned = true;
  const O = window.__THREE.Object3D.prototype;
  const umw = O.updateMatrixWorld;
  O.updateMatrixWorld = function (f) {
    const p = window.__pin;
    if (this.isCamera && p) {
      this.position.set(p.from[0], p.from[1], p.from[2]);
      this.rotation.order = 'YXZ';
      this.rotation.set(p.pitch, p.yaw, 0);
    }
    return umw.call(this, f);
  };
};
const yawTo = (from, at) => Math.atan2(at[0] - from[0], at[1] - from[2]) + Math.PI;

/**
 * How much of the disc a player can see from here, by rendering the frame three
 * ways: as shot (A), with the shadow hidden (B), and with the shadow drawn over
 * everything, depthTest off (C). C against B is the disc's whole footprint on
 * the screen; A against B is the part of it that survived the depth test. A
 * second B is the noise floor (the populace keeps moving). A pixel counts when
 * any channel moved by more than 6 of 255.
 */
async function measure(page, A) {
  const shot = async (mode) => {
    await page.evaluate((mode) => {
      const s = window.__rig.shadow;
      s.visible = mode !== 'hidden';
      s.material.depthTest = mode !== 'over';
      s.material.needsUpdate = true;
    }, mode);
    await new Promise((r) => setTimeout(r, 250));
    return page.screenshot();
  };
  const B = await shot('hidden'), C = await shot('over'), B2 = await shot('hidden');
  await shot('normal');
  const raw = async (b) => (await sharp(b).removeAlpha().raw().toBuffer());
  const [a, bb, c, b2] = await Promise.all([A, B, C, B2].map(raw));
  let foot = 0, seen = 0, noise = 0, drop = 0, base = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = (x, y) => Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2])) > 6;
    const lum = (x) => 0.2126 * x[i] + 0.7152 * x[i + 1] + 0.0722 * x[i + 2];
    if (d(b2, bb)) noise++;
    if (!d(c, bb)) continue;
    foot++;
    if (d(a, bb)) { seen++; drop += lum(bb) - lum(a); base += lum(bb); }
  }
  const pct = foot ? (100 * seen / foot).toFixed(0) : '-';
  const contrast = seen ? (100 * drop / base).toFixed(0) : '-';
  return `footprint ${foot} px, visible ${seen} px (${pct}%), darkens ${contrast}% of the floor under it, noise ${noise} px`;
}

fs.mkdirSync(OUT, { recursive: true });
const log = [];
const server = await serveDev(PORT, { hmr: false });
const browser = await launch({ headed: true });
try {
  const page = await prepPage(browser, { width: 1600, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__castle && !!window.__rig, { timeout: 90000 });
  const { attachSceneProbe, waitForProbe } = await import('../test/drive.mjs');
  await attachSceneProbe(page, await threeUrl(`http://127.0.0.1:${PORT}`));
  const start = await page.$('#start-button');
  if (start) await start.click();
  await waitForProbe(page);

  // Stand the player at (x, z), on whatever floor the plan has there, and say where the eye ended up.
  // `h` is the floor the shot means: 0 for the ground, the ramp's height on a flight.
  const stand = (s, h, sky, yaw, pitch) => page.evaluate(({ s, h, sky, yaw, pitch }) => {
    const rig = window.__rig;
    if (rig.__frozen) { rig.update = rig.__frozen; delete rig.__frozen; }
    window.__pin = null;
    window.__quest._onWatch(sky, { walk: false, sky });
    const cam = window.__cam;
    // 0.3 over the floor meant, as the suite's shadow beat does, so standAt
    // takes that floor and not one a storey away.
    cam.position.set(s[0], h + 0.3 + 1.7, s[1]);
    cam.rotation.set(pitch, yaw, 0, 'YXZ');
    const on = window.__player.settle();
    rig.settle();
    return { eye: [cam.position.x, cam.position.y, cam.position.z], feet: window.__player.feet, surface: on && on.surface };
  }, { s, h, sky, yaw, pitch });

  const read = () => page.evaluate(() => {
    const el = document.getElementById('interact-prompt');
    const r = (v) => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
    return {
      prompt: el && !el.classList.contains('hidden') ? el.textContent.trim() : null,
      shadow: r(window.__rig.shadow.position), hand: window.__rig.hand.visible ? r(window.__rig.hand.position) : 'hidden',
      reach: +window.__rig.reach.toFixed(3),
      mem: window.__renderer ? window.__renderer.info.memory : null,
    };
  });

  for (const shot of SHOTS.filter((s) => s.name.startsWith(ONLY))) {
    const yaw = shot.yaw ?? yawTo([shot.stand[0], 0, shot.stand[1]], shot.at);
    const st = await stand(shot.stand, shot.h ?? 0, shot.sky, yaw, shot.pitch ?? 0);
    await page.evaluate(pinScript, { from: st.eye, yaw, pitch: shot.pitch ?? 0 });
    await new Promise((r) => setTimeout(r, 900));
    const state = await read();
    // Kept as JPEG, quality 90: a still to judge by eye, a third the size of the PNG.
    // The measurement below reads the lossless frame, never the JPEG.
    const A = await page.screenshot();
    await sharp(A).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(OUT, `${shot.name}.jpg`));
    const m = await measure(page, A);
    const line = `${shot.name} | disc ${m} | sky ${shot.sky} | eye ${st.eye.map((n) => n.toFixed(2))} yaw ${yaw.toFixed(3)} pitch ${shot.pitch ?? 0} | feet ${st.feet.toFixed(3)} on ${st.surface} | prompt ${JSON.stringify(state.prompt)} | shadow ${state.shadow} | hand ${state.hand} reach ${state.reach}`;
    console.log(line);
    log.push(line);
  }

  // While turning.
  if ('c5'.startsWith(ONLY) || ONLY.startsWith('c')) {
    const st = await stand(TURN.stand, 0, TURN.sky, TURN.from, TURN.pitch);
    await page.evaluate(pinScript, { from: st.eye, yaw: TURN.from, pitch: TURN.pitch });
    await new Promise((r) => setTimeout(r, 900));
    const t0 = Date.now();
    await page.evaluate(({ from, to, eye, pitch, ms }) => {
      const t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        const e = k * k * (3 - 2 * k);
        window.__pin = { from: eye, yaw: from + (to - from) * e, pitch };
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { from: TURN.from, to: TURN.to, eye: st.eye, pitch: TURN.pitch, ms: TURN.ms });
    for (const ms of TURN.frames) {
      const wait = ms - (Date.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const state = await read();
      const yawNow = await page.evaluate(() => window.__pin.yaw);
      const name = `${TURN.name}-${String(ms).padStart(3, '0')}ms`;
      await sharp(await page.screenshot()).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(OUT, `${name}.jpg`));
      const line = `${name} | sky ${TURN.sky} | eye ${st.eye.map((n) => n.toFixed(2))} yaw ${yawNow.toFixed(3)} pitch 0 | prompt ${JSON.stringify(state.prompt)} | shadow ${state.shadow} | hand ${state.hand} reach ${state.reach}`;
      console.log(line);
      log.push(line);
    }
  }
  fs.writeFileSync(path.join(OUT, 'shots.log'), log.join('\n') + '\n');
} finally {
  await browser.close();
  await server.close();
}
