// shot-yard.mjs: photograph Thomas Wykes's yard (BACKLOG.md rank 4c), once.
//
// Hand-run, on the dev machine, with a real GPU (#53):
//
//   node tools/shot-yard.mjs
//
// Rank 4c's acceptance asks for "a screenshot and one sentence [saying]
// whether the yard reads as a yard". The yard is 20 m outside a castle the
// player cannot leave, so there is no walk to it and `npm run play` has no
// beat that would ever face that way.
//
// HOW IT GETS THE CAMERA THERE, and why not by moving the spawn. Moving
// `config.spawn` out of the castle moves the walkability fill with it, and
// `validatePopulace` then throws on the page before it finishes building: ten
// people's forty stops become "floor the player cannot walk to" the moment the
// fill starts somewhere else. So the spawn is left alone and the camera is
// pinned instead, through the same `updateMatrixWorld` patch test/drive.mjs's
// scene probe already uses. The rig writes `camera.position` every frame and
// this writes it back, after, on the same frame, before the render.
//
// NOTHING HERE ASSERTS ANYTHING and nothing here is in `npm test`. It is a
// picture, and the two views inside the yard are views the shipped game never
// gives anybody.
import fs from 'node:fs';
import path from 'node:path';
import { serveDev, launch, prepPage, threeUrl, ROOT } from '../test/harness.mjs';

const OUT = path.join(ROOT, 'shots', 'yard');
const PORT = 8130; // not 8124..8129, which the six driving suites hold

/**
 * Where to stand, what to look at, and how far down. `at` is a world x/z; the
 * pitch is separate because a yard 20 m below the only place you can see it
 * from is all pitch.
 */
const VIEWS = [
  {
    name: '1-in-the-yard',
    from: [-51.5, 1.7, -6.5],
    at: [-61, -14],
    pitch: -0.05,
    says: 'In the yard, looking north-west at the shed, the three courses and the marked block. No player view: nothing in the game puts a body here.',
  },
  {
    name: '2-yard-mouth',
    from: [-59.5, 1.7, -6],
    at: [-40, -4],
    pitch: 0.02,
    says: 'From the yard mouth back up the road at the barbican, for the distance between the two. Also no player view.',
  },
  {
    name: '3-nw-tower-roof',
    from: [-38.5, 13.7, -16.3],
    at: [-58, -12.5],
    pitch: -0.45,
    says: 'The North-west Tower roof at 12 m, at its west edge, looking down over the crown. This is the best view the player is given of the yard.',
  },
  {
    name: '4-nw-tower-roof-road',
    from: [-38.5, 13.7, -13.6],
    at: [-70, -3],
    pitch: -0.34,
    says: 'The same roof, turned south-west down the road at the town gate, for what the wall and the gate read as at 30 m.',
  },
  {
    name: '5-west-curtain-walk',
    from: [-35, 9.7, -12.6],
    at: [-58, -12.6],
    pitch: -0.18,
    says: "The west curtain's walk at 8 m, aimed at the yard and seeing none of it: the North-west Tower's drum is 4 m of stone standing in that exact line. The walk is not a vantage on the yard and the tower roof over it is.",
  },
  {
    name: '6-the-spawn',
    from: [-40, 1.7, 0],
    at: [-60, 0],
    pitch: 0,
    says: 'The real spawn, looking west, for comparison: at ground level the barbican\'s west face is 8 m of unbroken stone.',
  },
];

/** Pin the camera every frame, after the rig has had its go at it. */
const pin = (page, view) => page.evaluate(({ from, at, pitch }) => {
  window.__pin = { from, at, pitch };
  if (window.__pinned) return;
  window.__pinned = true;
  const O = window.__THREE.Object3D.prototype;
  const umw = O.updateMatrixWorld;
  O.updateMatrixWorld = function (f) {
    const p = window.__pin;
    if (this.isCamera && p) {
      this.position.set(p.from[0], p.from[1], p.from[2]);
      this.rotation.order = 'YXZ';
      this.rotation.set(p.pitch, Math.atan2(p.at[0] - p.from[0], p.at[1] - p.from[2]) + Math.PI, 0);
    }
    return umw.call(this, f);
  };
}, view);

fs.mkdirSync(OUT, { recursive: true });
const server = await serveDev(PORT, { hmr: false });
const browser = await launch({ headed: true });
try {
  const page = await prepPage(browser, { width: 1600, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__castle, { timeout: 60000 });
  // The probe's own patch is what stashes window.__THREE for the pin above.
  const { attachSceneProbe, waitForProbe } = await import('../test/drive.mjs');
  await attachSceneProbe(page, await threeUrl(`http://127.0.0.1:${PORT}`));
  const start = await page.$('#start-button');
  if (start) await start.click();
  await waitForProbe(page);
  for (const view of VIEWS) {
    await pin(page, view);
    await new Promise((r) => setTimeout(r, 1400));
    const file = path.join(OUT, `${view.name}.png`);
    await page.screenshot({ path: file });
    console.log(`${view.name}: ${view.says}`);
    console.log(`  ${file}`);
  }
} finally {
  await browser.close();
  await server.close();
}
