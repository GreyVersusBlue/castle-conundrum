// play-castle.mjs — end-to-end smoke test for Castle Conundrum.
//
// Came across from tools-and-games' Tools/board-check/ when the project moved
// (HISTORY.md #491). It was always this project's file; ownership.json said so
// in prose because the sweep that manifest feeds only reads .html.
//
// Plays the whole day with real input: pointer lock, WASD, E presses, typing into
// the riddle box, the J key, the Present button and the accusation panel. From
// Phase 7 it walks the intended path in PLAN.md end to end — twelve people,
// ten pieces of evidence, three bells, a reload at Sext and the full ending —
// and exits 1 on the first beat that doesn't happen. Screenshots land in
// ./shots/play/ for eyeballing.
//
// TEN OF ELEVEN, AND WHICH ONE IS NOT WALKED (#571). The gaol roll is the
// eleventh piece of evidence and it is not on the intended path: it lies on
// the barrel-head in the guardroom, it convicts nobody, and the path through
// PLAN.md's full ending never enters the North-west Tower. No beat was written
// for it from a container that cannot render, because a beat that cannot be
// run is a beat that cannot be trusted (#53). Whoever takes the GPU run
// (BACKLOG.md, ranks 2 and 3) should walk into the guardroom and press E at
// it: a 0.4 x 0.3 m parchment slab resting on the barrels, 3 mm over their
// top, which is the first built slab in this castle whose support is another
// prop rather than floor or stone.
//
// WHY THIS EXISTS: sessions 2, 3 and 4 each verified Castle Conundrum by reading
// the code and checking the first frame, because the sandboxed browser they had
// couldn't acquire pointer lock. Nobody had actually pressed E on the Scholar.
// When session 5 finally did, it immediately found the Guard standing sealed
// inside the gatehouse wall — the interact prompt appeared happily on blank stone,
// because interaction.js tests proximity and facing but never line of sight.
// That class of bug is invisible to every other check in this folder.
//
// WHY HEADED: pointer lock needs a browser compositing frames to a real screen,
// and so does GPU rendering. `launch({ headed: true })` is the whole difference.
// A window will open and visibly play the game. That is expected.
//
// WHY IT IS NOT IN CI: everything above. #53 — a real-time movement assertion
// under a software-rendered Chromium is inconclusive, not confirmed, in either
// direction. This one is hand-run, from a machine with a GPU.
//
// npm run play

import { serveDev, launch, prepPage, threeUrl, ROOT } from './harness.mjs';
import { makePlan, walkability } from '../src/castle-plan.js';
import { partsOf } from './gltf.mjs';
import { attachSceneProbe, waitForProbe, walkTo as driveTo, wait, textContent, aimAt } from './drive.mjs';
import fs from 'node:fs';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'shots', 'play');
const PORT = 8124; // not 8125 (plan-vs-scene.mjs) and not 8126 (built.mjs)
const BASE = `http://127.0.0.1:${PORT}`;
const GAME = `${BASE}/`;

// WHERE PEOPLE ARE IS DATA NOW (Phase 6). `SCHOLAR = [10, -10]` and
// `GUARD = [-5.5, 0]` lived here for three phases and had to be moved by hand
// every time the castle under them changed. The Guard, the Scholar and the
// Wizard are gone; the twelve of data/mystery.json's `schedule` stand where it
// says, at whichever of the four bells the game is on, and `stationOf` below
// asks the running game where somebody is due rather than carrying a number.
const TILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'scene-config.json'), 'utf8')).tileSize;
// The mystery itself, for the second day's own beats (#539): where the cell is,
// and what the HUD calls it once the bars are off it.
const mystery = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'mystery.json'), 'utf8'));
// Where to stand to read the muniment room's word-lock. Phase 4 took the riddle
// off the Scholar and carved it over that door, which is in the King's Tower's
// ring at world (21.06, -14.30), facing south-west into the King's Hall. This is
// two metres out in front of it, inside the hall, with a clear line to the leaf.
const MUNIMENT_LOCK = [21.0, -12.0];
// The hall brazier, per data/scene-config.json's braziers[2].tile [-5, 2.5].
// If that moves, move this.
const HALL_BRAZIER = [-20.0, 10.0];

// Geometry the placement beats below check against. Measured from the live scene,
// not read off the config: every one of these models arrives at its own authored
// scale, so the hall "table" is 0.55 m tall and the "stool" next to it is 0.18 m.
// Phase 3 moved the whole hall cluster out of the old courtyard and into the
// Great Hall, x -34..-6 and z 6..14; these are its numbers there, read back off
// src/castle-plan.js.
const HALL_TABLE = { min: [-20.9, 0, 10.171], max: [-19.1, 0.549, 10.829] };

/* ---------------------------------------------------------------- the map ---
 *
 * NOTHING IN THIS FILE COULD FIND ITS WAY ACROSS THE CASTLE, and every beat of
 * the intended path is a walk across the castle. `driveTo` aims at the target,
 * holds W, and nudges sideways once when the distance stops changing. That is
 * enough in open ground and it is hopeless against a wall with a door in it:
 * the run that got this far for the first time reported "walked to the cook in
 * kitchen — never got in range" with the player pressed against the inner
 * ward's side of the porter's gate, and the same for the porter, the apprentice
 * and the bell. Every one of those reads as a person who cannot be reached and
 * every one of them is a straight line through masonry.
 *
 * THE CASTLE ALREADY KNOWS THE WAY. `walkability(plan).path(from, to)` is the
 * breadth-first shortest walk between two standing cells, cell centre by cell
 * centre, and it is not new or unproven: it is what `src/stations.js` walks the
 * twelve along when a bell goes, and `test/layout.mjs` floods the same graph
 * eight ways. This asks it for the player's route and then drives the answer.
 *
 * TWO FILLS, because one door in this castle opens during the day. The
 * muniment room's word-lock is shut at Prime and answered at Sext, and the
 * ledger is behind it; the shut fill has no path to it at all. Ask the shut one
 * first, since that is the castle for three of the four watches, and fall back
 * to the opened one rather than tracking quest state in here.
 *
 * IT IS A PRE-WALK, NOT A REPLACEMENT. The path ends at a cell centre, and what
 * every beat below actually wants is "close enough that the prompt names the
 * thing". So the hike gets the player into the room and the old aim-and-hold
 * loop still does the last few metres, which keeps every arrival predicate in
 * this file exactly as it was.
 */
const measured = new Map();
const boundsOf = (rel) => {
  if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel)));
  return measured.get(rel);
};
const sceneConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'scene-config.json'), 'utf8'));
const NAV = [
  walkability(makePlan(sceneConfig, boundsOf)),
  walkability(makePlan(sceneConfig, boundsOf, { opened: ['muniment'] })),
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
let shotN = 0;
/** Who has had their portrait taken. See `converse` below. */
const photographed = new Set();

const ok = (label, detail = '') => console.log(`  ok    ${label}${detail ? '  ' + detail : ''}`);
const bad = (label, detail = '') => { failures++; console.log(`  FAIL  ${label}${detail ? '  ' + detail : ''}`); };
const assert = (cond, label, detail = '') => (cond ? ok(label, detail) : bad(label, detail));

// `hmr: false`: a file changing under src/ or data/ mid-run full-reloads the
// page and throws away the scene probe. See harness.mjs's serveDev.
const server = await serveDev(PORT, { hmr: false });
const THREE_URL = await threeUrl(BASE);
const browser = await launch({ headed: true });
const page = await prepPage(browser, { width: 1200, height: 800, dsf: 1 });

const snap = async (label) => {
  await page.screenshot({ path: path.join(OUT, `${String(++shotN).padStart(2, '0')}-${label}.png`) });
};

/**
 * Mean luma of a rectangle of the live canvas, 0 to 255.
 *
 * #438 is the rule this exists for: MEASURE THE PIXEL, DO NOT JUDGE THE
 * THUMBNAIL. Two screenshots of the shadowed cross-wall at hemisphere 0.55 and
 * 1.1 looked identical and the fill was nearly written off as the wrong lever;
 * the reads were 6 of 255 and 14, a clean doubling that no eye could see at
 * that base. The Great Hall's covering (BACKLOG.md rank 5) is the one change
 * left that can make a room dark, and what the hall measures OPEN is the number
 * a covered hall has to be compared against. This prints rather than asserts,
 * deliberately: there is no covering yet, so there is no threshold to hold it
 * to, only a baseline to write down.
 */
const luma = async (label, clip) => {
  const buf = await page.screenshot({ clip });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  const mean = sum / (info.width * info.height);
  console.log(`  read  ${label}  mean luma ${mean.toFixed(1)} of 255 over ${info.width}x${info.height} px`);
  return +mean.toFixed(1);
};

/** Everything the assertions need, read straight off the live DOM + camera. */
const state = () => page.evaluate(() => {
  const c = window.__cam;
  const hidden = (id) => document.getElementById(id).classList.contains('hidden');
  const text = (id) => document.getElementById(id).textContent;
  return {
    pos: [+c.position.x.toFixed(2), +c.position.z.toFixed(2)],
    prompt: hidden('interact-prompt') ? null : text('interact-prompt'),
    dialogueOpen: !hidden('dialogue-box'),
    dialogueName: text('dialogue-name'),
    dialogueText: text('dialogue-text'),
    riddleOpen: !hidden('riddle-overlay'),
    journalOpen: !hidden('journal-overlay'),
    accusationOpen: !hidden('accusation-overlay'),
    objective: text('quest-objective'),
    locked: !!document.pointerLockElement,
  };
});

/** Walk until the interact prompt names `who`. drive.mjs owns the aim/strafe loop. */
/**
 * Pointer lock back after an overlay, and a note when it had to be taken.
 *
 * SHUTTING THE JOURNAL LEAVES THE PLAYER UNABLE TO MOVE, and that is a bug in
 * the game rather than in this file. Opening it releases pointer lock, which is
 * right — the journal is a thing you point at. Shutting it gives nothing back:
 * nothing calls `player.lock()`, and main.js's `unlock` listener only offers
 * the "click to resume" panel when no overlay is open, which was false at the
 * moment it fired. So the overlay goes away, the castle comes back, and W, A,
 * S, D and the mouse all do nothing, with no panel and no prompt to say why.
 *
 * Measured on 2026-09-17, on a real GPU with a real keyboard: before the
 * journal, W moves the player 3.7 m; after J and J again, W moves 0.00 m; a
 * plain click on the canvas changes nothing, because there is no handler on it
 * to change anything; `window.__player.lock()` restores it and W moves 3.7 m
 * again. A player has no `window.__player`. THEY ARE STUCK, and the only way
 * out of a castle they cannot walk is to reload the page.
 *
 * This is asserted once, at the journal, where it is first provable — see that
 * beat. Everywhere else it is taken back quietly so the rest of the day can be
 * played, because a suite that stops at the first bug stops finding the second.
 * WHEN THE GAME FIXES THIS, THE ASSERTION GOES GREEN AND EVERY `regrip()` CALL
 * BELOW BECOMES DEAD AND SHOULD COME OUT.
 */
const regrip = async (where) => {
  if (await page.evaluate(() => !!document.pointerLockElement)) return true;
  await page.evaluate(() => window.__player?.lock());
  await wait(300);
  const back = await page.evaluate(() => !!document.pointerLockElement);
  console.log(`  note  pointer lock had to be taken back after ${where}${back ? '' : ' AND COULD NOT BE'}`);
  return back;
};

/** Where the player is standing, and which storey that is. */
const playerAt = async () => {
  const p = await page.evaluate(() => ({ x: window.__cam.position.x, z: window.__cam.position.z, y: window.__cam.position.y }));
  return { x: p.x, z: p.z, level: Math.max(0, Math.round((p.y - 1.7) / 4)) };
};

/**
 * Walk the castle's own shortest route to a point, then hand back.
 *
 * The path comes back one 0.5 m cell centre at a time, which is far finer than
 * anything worth steering to, so it is thinned to a waypoint every ~2.5 m and
 * to every corner. Driving every cell would turn a 45 m walk into ninety
 * bursts of 0.5 m and a lot of stopping; driving only the corners walks into
 * door jambs, because the route through a doorway is a corner a body's radius
 * wide. Both were tried.
 *
 * Returns false when neither fill has a route — a target on a storey the player
 * is not on, or a genuinely sealed room — and every caller treats that as
 * "carry on the old way" rather than as a failure, because the old way is what
 * worked before this existed and a pre-walk that cannot help should not stop a
 * beat that does not need it.
 */
const hike = async (target, level = 0) => {
  const from = await playerAt();
  const to = { x: target[0], z: target[1], level };
  const route = NAV.map((w) => w.path(from, to)).find((p) => p && p.length > 1);
  if (!route) return false;
  const marks = [];
  let last = route[0];
  for (let i = 1; i < route.length - 1; i++) {
    const c = route[i], n = route[i + 1];
    const turn = Math.sign(c.x - last.x) !== Math.sign(n.x - c.x) || Math.sign(c.z - last.z) !== Math.sign(n.z - c.z);
    if (turn || Math.hypot(c.x - last.x, c.z - last.z) >= 2.5) { marks.push(c); last = c; }
  }
  for (const w of marks) {
    await driveTo(page, [w.x, w.z], async (d) => d < 1.0, { maxBursts: 16, nearAt: 2.5, longMs: 200, shortMs: 90 });
  }
  return true;
};

/* `maxBursts` 90, not driveTo's default 40, and a hike in front of it. The
 * longest walk in the day is the Kitchen to the chapel, 45 m across two wards
 * and a gate; 40 bursts is that distance with nothing in the way, and there is
 * a great deal in the way. The hike does the castle and this does the doorstep. */
/* `within` EXISTS BECAUSE "examine" IS NOT A NAME. An NPC's prompt carries
 * their own name and matches nobody else; a piece of evidence's prompt is the
 * word "examine" and every one of the eleven says it. The body and the pouch
 * lie a metre apart on the same chapel floor, so a predicate that only reads
 * the word returns "arrived" for whichever the camera happens to be aimed at —
 * the run that found this took the pouch's two clues off the body and the
 * body's off the pouch, and then reported the cloak "reached" from 59.36 m away
 * and the gaol roll from 67.38 m, standing in the chapel the whole time.
 * A distance with it is what makes the word mean this one. */
const walkTo = async (target, who, level = 0, within = Infinity) => {
  const near = async (d = Infinity) => d <= within && !!(await state()).prompt?.includes(who);
  if (!(await near(0))) await hike(target, level);
  return driveTo(page, target, near, { maxBursts: 90 });
};

/**
 * Where somebody is due, in world metres, at the watch the game is on: the
 * engine's own `stationOf`, through the one unit conversion the castle has.
 * Null when they are not in the castle at this bell.
 */
const stationOf = async (npcId) => {
  const st = await page.evaluate((id) => {
    const s = window.__mystery?.stationOf(id);
    return s && Array.isArray(s.tile) ? { tile: s.tile, room: s.room, level: s.level ?? 0 } : null;
  }, npcId);
  return st ? { at: [st.tile[0] * TILE, st.tile[1] * TILE], room: st.room, level: st.level } : null;
};

/** Where a body actually is right now, which after a bell is somewhere on a walk. */
const bodyAt = async (npcId) => page.evaluate((id) => {
  const n = (window.__cast || []).find((x) => x.id === id);
  return n && n.group.visible ? { x: n.group.position.x, y: n.group.position.y, z: n.group.position.z } : null;
}, npcId);

/** Wait for somebody to finish walking to where they are due, or give up. */
const arrives = async (npcId, timeout = 45000) => {
  const due = await stationOf(npcId);
  if (!due) return null;
  const started = Date.now();
  for (;;) {
    const at = await bodyAt(npcId);
    const d = at ? Math.hypot(at.x - due.at[0], at.z - due.at[1]) : Infinity;
    if (d <= 0.6) return { ...due, dist: +d.toFixed(2), took: Date.now() - started };
    if (Date.now() - started > timeout) return { ...due, dist: +d.toFixed(2), took: Date.now() - started, late: true };
    await wait(500);
  }
};

console.log('playing Castle Conundrum end to end\n');

try {
  await page.goto(GAME, { waitUntil: 'load' });
  // A stale save from a previous run would resume mid-day, with the journal
  // already full and the muniment room already open. Clear the one key
  // (src/save.js, castleConundrumSave_v1) and load again from nothing.
  await page.evaluate(() => localStorage.removeItem('castleConundrumSave_v1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 90000 });
  const loadStatus = await textContent(page, '#loading-status');
  ok('reached the start screen', loadStatus);

  // Live scene + camera handles. See drive.mjs for why this has to patch
  // Object3D.prototype rather than WebGLRenderer.prototype.render.
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);

  // --- The twelve NPCs built, and their rigs are actually bound to their own bones.
  // Object3D.clone() on a SkinnedMesh keeps the ORIGINAL skeleton, which leaves the
  // body frozen while the mixer happily runs. assets.js clones via SkeletonUtils to
  // avoid that; this is the assertion that keeps it that way.
  const rigs = await page.evaluate(async () => {
    const s = window.__scene;
    const groups = new Map();
    s.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      let root = o;
      while (root.parent && root.parent !== s) root = root.parent;
      let boneRoot = o.skeleton?.bones?.[0];
      while (boneRoot?.parent) boneRoot = boneRoot.parent;
      if (!groups.has(root)) groups.set(root, { rebound: boneRoot === s });
      if (boneRoot !== s) groups.get(root).rebound = false;
    });
    const hands = [];
    s.traverse((o) => { if (o.isBone && /^wrist\.?r$/i.test(o.name)) hands.push(o); });
    const before = JSON.stringify(hands.map((b) => b.matrixWorld.elements.slice(12, 15)));
    await new Promise((r) => setTimeout(r, 700));
    const after = JSON.stringify(hands.map((b) => b.matrixWorld.elements.slice(12, 15)));
    return {
      count: groups.size,
      allRebound: [...groups.values()].every((g) => g.rebound),
      handBones: hands.length,
      animating: before !== after,
    };
  });
  assert(rigs.count === 13, "thirteen rigged NPC bodies in the scene: the twelve of the day and the King's inspector, who is hidden until the morning after (#534)", `found ${rigs.count}`);
  assert(rigs.allRebound, 'every skeleton rebound into the scene tree (SkeletonUtils clone)');
  assert(rigs.animating, 'rigs are animating', `${rigs.handBones} hand bones tracked`);

  // --- Textures are sampled for a 64 px pixel-art kit, not smeared across a 4 m wall.
  // The Kenney retro kit's glTF samplers declare minFilter and nothing else, so
  // GLTFLoader defaults magFilter to LinearFilter and bilinearly interpolates a
  // 64x64 cobblestone over 4 m of stone. That is the "blurry walls" report that
  // stood open from v6 §8 to v7 §8. assets.js now gives every texture the GPU's
  // anisotropy ceiling and switches magnification to NEAREST for anything 128 px
  // or smaller. Both halves are asserted because they fail independently: drop
  // setTextureQuality() and anisotropy silently returns to 1 while the walls stay
  // crisp; drop the NEAREST branch and the smear comes back at full anisotropy.
  const sampling = await page.evaluate(async () => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    const seen = new Set();
    const all = [];
    const SLOTS = ['map', 'normalMap', 'aoMap', 'roughnessMap', 'metalnessMap', 'emissiveMap'];
    window.__scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material || [])) {
        for (const k of SLOTS) {
          const t = m?.[k];
          if (!t || seen.has(t.uuid)) continue;
          seen.add(t.uuid);
          all.push({ px: Math.max(t.image?.width || 0, t.image?.height || 0), mag: t.magFilter, aniso: t.anisotropy });
        }
      }
    });
    const cv = document.createElement('canvas');
    const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    const cap = ext ? gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    const small = all.filter((t) => t.px > 0 && t.px <= 128);
    const large = all.filter((t) => t.px > 128);
    return {
      cap,
      total: all.length,
      small: small.length,
      large: large.length,
      smallAllNearest: small.length > 0 && small.every((t) => t.mag === THREE.NearestFilter),
      largeAllLinear: large.length > 0 && large.every((t) => t.mag === THREE.LinearFilter),
      allAtCap: all.length > 0 && all.every((t) => t.aniso === cap),
      worstAniso: Math.min(...all.map((t) => t.aniso)),
    };
  });
  assert(sampling.smallAllNearest, 'every pixel-art texture magnifies NEAREST',
    `${sampling.small} textures at <=128px`);
  assert(sampling.largeAllLinear, 'the 1k Poly Haven maps still magnify LINEAR',
    `${sampling.large} textures over 128px`);
  assert(sampling.allAtCap, 'every texture is at the GPU anisotropy ceiling',
    `cap ${sampling.cap}, worst ${sampling.worstAniso}, ${sampling.total} textures`);

  // --- The interior hall walls are the same height as every outer wall, and the
  // hall columns reach the ceiling. normalizeToTile used to scale wall-half.glb
  // off its own X size (0.5, the one dimension that's deliberately NOT 1 unit for
  // a half-width piece), which doubled its height and depth to 8m instead of 4m.
  // castle-builder now scales off Z, the dimension that actually is 1 unit on
  // every piece in the kit. Separately, column.glb had no scale branch at all and
  // sat at its native 1m/20cm-thick size, invisible in every screenshot.
  const geometry = await page.evaluate(async () => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    const s = window.__scene;
    const heights = (pattern) => {
      const out = [];
      s.traverse((o) => {
        if (!o.isMesh || !pattern.test(o.name || '')) return;
        const b = new THREE.Box3().setFromObject(o);
        out.push(+(b.max.y - b.min.y).toFixed(2));
      });
      return out;
    };
    const outerWalls = heights(/^wall_/);
    const hallWalls = heights(/^wall-half/);
    const columns = heights(/^column/);
    return { outerWalls, hallWalls, columns };
  });
  const wallHeightsMatch = geometry.outerWalls.length > 0 && geometry.hallWalls.length > 0
    && geometry.outerWalls.every((h) => Math.abs(h - 4) < 0.05)
    && geometry.hallWalls.every((h) => Math.abs(h - 4) < 0.05);
  assert(wallHeightsMatch, 'interior hall walls are the same height as the outer walls',
    `outer ${[...new Set(geometry.outerWalls)]}m, hall ${[...new Set(geometry.hallWalls)]}m`);
  // Each column mesh has multiple material slots (separate submeshes per name,
  // like the wall pieces above), so this counts distinct heights, not meshes.
  assert(geometry.columns.length > 0 && geometry.columns.every((h) => Math.abs(h - 4) < 0.05),
    'hall columns reach the same height as the walls, not a 1m stub',
    `${[...new Set(geometry.columns)]}m across ${geometry.columns.length} submeshes`);

  // --- Nothing in the hall is standing in mid-air or inside the furniture.
  // Two separate bugs, one check: the lantern and the candleholders carried
  // `yOffset: 0.95` against a 0.55 m table and hung 0.40 m above it, and the
  // Scholar stood 0.57 m inside that same table. castle-builder now measures the
  // surface under a prop instead of trusting a typed-in height, so this asserts
  // the measurement, not the number that came out of it.
  const hall = await page.evaluate(async ({ table }) => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    const s = window.__scene;
    const tableBox = new THREE.Box3(new THREE.Vector3(...table.min), new THREE.Vector3(...table.max));

    // Tabletop items: the ones sitting above the table's base whose footprint is
    // MOSTLY over it. "Mostly" is doing real work — the gothic statue stands on the
    // floor behind the table and its 1.56 m footprint clips the table's z range by
    // 0.12 m, so an any-overlap test calls a correctly placed statue a tabletop
    // item floating 1.74 m in the air.
    const resting = [];
    for (const c of s.children) {
      const b = new THREE.Box3().setFromObject(c);
      if (!isFinite(b.min.x) || b.min.y < 0.2) continue;
      const ox = Math.min(b.max.x, tableBox.max.x) - Math.max(b.min.x, tableBox.min.x);
      const oz = Math.min(b.max.z, tableBox.max.z) - Math.max(b.min.z, tableBox.min.z);
      if (ox <= 0 || oz <= 0) continue;
      const covered = (ox * oz) / Math.max(1e-6, (b.max.x - b.min.x) * (b.max.z - b.min.z));
      if (covered < 0.5) continue;
      resting.push({
        gap: +(b.min.y - tableBox.max.y).toFixed(3),
        // fully supported, i.e. no part of it hangs off the table
        overhang: +Math.max(
          tableBox.min.x - b.min.x, b.max.x - tableBox.max.x,
          tableBox.min.z - b.min.z, b.max.z - tableBox.max.z, 0
        ).toFixed(3),
      });
    }

    // Every body in the castle against the table. This used to be the Scholar's
    // alone, found by standing within 1.2 m of a hard-coded coordinate; the
    // twelve move, so the question is now "is anybody in it", asked of all of
    // them wherever the bell has put them.
    const roots = new Set();
    s.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      let r = o;
      while (r.parent && r.parent !== s) r = r.parent;
      roots.add(r);
    });
    let clip = -99, bodies = 0;
    for (const r of roots) {
      if (!r.visible) continue;
      bodies++;
      const b = new THREE.Box3().setFromObject(r);
      const overlap = Math.min(
        Math.min(b.max.x, tableBox.max.x) - Math.max(b.min.x, tableBox.min.x),
        Math.min(b.max.z, tableBox.max.z) - Math.max(b.min.z, tableBox.min.z)
      );
      if (overlap > clip) clip = +overlap.toFixed(3);
    }
    if (!bodies) clip = null;

    // Braziers: every emissive coal has iron under it, the iron reaches the floor,
    // and the whole thing is standing somewhere a player can see rather than sealed
    // inside a wall. That last one is v5 decision 26 applied to scenery instead of
    // to an NPC: a PointLight is not occluded by geometry in this renderer, so both
    // gate braziers lit the courtyard convincingly from inside 4 m of solid stone.
    const stoneBoxes = [];
    for (const c of s.children) {
      const b = new THREE.Box3().setFromObject(c);
      if (!isFinite(b.min.x)) continue;
      if (b.max.y - b.min.y < 1.5) continue;     // scenery, not structure
      if (b.max.x - b.min.x > 100) continue;     // the ground plane
      let skinned = false;
      c.traverse((o) => { if (o.isSkinnedMesh) skinned = true; });
      if (skinned) continue;
      stoneBoxes.push({ box: b, name: c.name || c.type });
    }
    const braziers = [];
    for (const c of s.children) {
      let coal = null;
      c.traverse((o) => { if (o.isMesh && o.material?.emissiveIntensity > 1) coal = o; });
      if (!coal) continue;
      const whole = new THREE.Box3().setFromObject(c);
      const coalBox = new THREE.Box3().setFromObject(coal);
      const bowl = coalBox.getCenter(new THREE.Vector3());
      let solid = 0;
      c.traverse((o) => { if (o.isMesh && o !== coal) solid++; });
      braziers.push({
        floor: +whole.min.y.toFixed(3),
        coalY: +coalBox.min.y.toFixed(3),
        parts: solid,
        at: [+bowl.x.toFixed(1), +bowl.z.toFixed(1)],
        inside: stoneBoxes.find((sb) => sb.box.containsPoint(bowl))?.name || null,
      });
    }
    return { resting, clip, braziers };
  }, { table: HALL_TABLE });

  // 5 mm, not 0: Box3.setFromObject walks transformed vertices, so a surface and the
  // thing resting on it round to within about a millimetre of each other, not to zero.
  assert(hall.resting.length >= 2 && hall.resting.every((r) => Math.abs(r.gap) <= 0.005),
    'every tabletop item rests on the table, not above it',
    `${hall.resting.length} items, gaps ${hall.resting.map((r) => r.gap).join('/')}`);
  assert(hall.resting.every((r) => r.overhang <= 0), 'no tabletop item overhangs the table',
    `worst overhang ${Math.max(0, ...hall.resting.map((r) => r.overhang))}m`);
  assert(hall.clip !== null && hall.clip <= 0, 'nobody is standing in the hall table',
    hall.clip === null ? 'found no bodies at all' : `${hall.clip > 0 ? hall.clip + 'm INSIDE it' : Math.abs(hall.clip) + 'm clear'}`);
  assert(hall.braziers.length === 3 && hall.braziers.every((b) => b.floor < 0.02 && b.parts >= 5),
    'every brazier has a stand that reaches the floor',
    hall.braziers.map((b) => `coal@${b.coalY} base@${b.floor} ${b.parts}parts`).join(' '));
  assert(hall.braziers.length === 3 && hall.braziers.every((b) => !b.inside),
    'no brazier is sealed inside the stonework',
    hall.braziers.map((b) => `${JSON.stringify(b.at)}${b.inside ? ' IN ' + b.inside : ''}`).join(' '));

  // --- The closed gate door actually crosses the archway it's meant to fill.
  // castle-builder.js's hinge-pivot math derived the door's world position
  // assuming rotationY = 0; the one gate this castle used to have is at 180, and
  // the un-rotated formula put the whole leaf on the wrong side of world x 0
  // entirely — never blocking anything in any quest state or appearing in any
  // capture frame, regardless of what "closed" or "open" meant.
  //
  // It looks the leaf up BY ITS PLAN ID now rather than hunting the scene for an
  // object of about the right size near z 12. Phase 3 put three gates in the
  // castle and moved all of them; a positional search finds whatever happens to
  // be at the old coordinates, which after a layout change is either nothing or
  // the wrong thing, and either way it is not a check. `east-gate` is the leaf
  // the riddle quest opens, at world (24, 0) in a wall running north-south, so
  // the axis it has to cross is z.
  //
  // PHASE 4 MOVED WHAT THE QUEST OPENS. The riddle is the muniment room's
  // word-lock now and `openGate` means that leaf; the east gate is a gate that
  // never opens again. The leaf checked here is still the one the quest swings,
  // which is the point of the beat, and it hangs in a tower ring at 300 degrees
  // rather than in a wall, so it crosses both axes and the assertion is that it
  // stands across its own doorway rather than that it crosses z.
  const gateDoorBox = await page.evaluate(async () => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    let found = null;
    window.__scene.traverse((o) => {
      if (found || o.userData?.planId !== 'muniment') return;
      const b = new THREE.Box3().setFromObject(o);
      if (!isFinite(b.min.x)) return;
      found = { min: [b.min.x, b.min.z], max: [b.max.x, b.max.z] };
    });
    return found;
  });
  assert(!!gateDoorBox &&
    (gateDoorBox.max[0] - gateDoorBox.min[0]) > 1.5 && (gateDoorBox.max[1] - gateDoorBox.min[1]) > 1.5,
    'the shut word-lock door stands across its own doorway',
    gateDoorBox ? `x[${gateDoorBox.min[0].toFixed(2)}, ${gateDoorBox.max[0].toFixed(2)}] z[${gateDoorBox.min[1].toFixed(2)}, ${gateDoorBox.max[1].toFixed(2)}]` : 'not found');

  // --- The hall table, the gothic statue, and the two side cabinets clear the
  // wall behind them. Round 2 found (but did not fix) the table and the statue
  // sitting inside the north wall — nothing had ever checked furniture against
  // the wall, only against the table and the floor (see the checks above). This
  // session's own sweep found two more of the same bug: GothicCabinet_01 and
  // GothicCommode_01 were both fully sealed in the corners where the north wall
  // meets the hall's own side walls.
  //
  // Deliberately NOT the "stoneBoxes" height>1.5m heuristic the brazier check
  // above uses — the gothic statue (1.74m) and GothicCabinet_01 (2.36m) are
  // both taller than that themselves, so that filter would count each piece of
  // furniture as its own wall and report every one of them "embedded" against
  // itself (caught by running this check once and seeing exactly that). Wall/
  // tower/column pieces are the only scene children whose top-level group name
  // starts with wall, tower or column — match on that instead.
  const wallCheck = await page.evaluate(async () => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    const s = window.__scene;
    const stoneBoxes = [];
    for (const c of s.children) {
      if (!/^(wall|tower|column)/.test(c.name || '')) continue;
      const b = new THREE.Box3().setFromObject(c);
      if (!isFinite(b.min.x)) continue;
      stoneBoxes.push(b);
    }
    const findByMesh = (pattern) => {
      let found = null;
      s.children.forEach((c) => {
        if (found) return;
        let hit = false;
        c.traverse((o) => { if (o.isMesh && pattern.test(o.name || '')) hit = true; });
        if (hit) found = c;
      });
      return found;
    };
    const targets = {
      table: findByMesh(/^WoodenTable_01$/),
      statue: findByMesh(/^gothic_statue$/),
      cabinet: findByMesh(/^GothicCabinet_01/),
      commode: findByMesh(/^GothicCommode_01/),
    };
    const results = {};
    for (const [name, obj] of Object.entries(targets)) {
      if (!obj) { results[name] = 'not found'; continue; }
      const b = new THREE.Box3().setFromObject(obj);
      let embedded = false;
      for (const sb of stoneBoxes) {
        const ox = Math.min(b.max.x, sb.max.x) - Math.max(b.min.x, sb.min.x);
        const oy = Math.min(b.max.y, sb.max.y) - Math.max(b.min.y, sb.min.y);
        const oz = Math.min(b.max.z, sb.max.z) - Math.max(b.min.z, sb.min.z);
        if (ox > 0 && oy > 0 && oz > 0) { embedded = true; break; }
      }
      results[name] = embedded ? 'EMBEDDED' : 'clear';
    }
    return results;
  });
  assert(Object.values(wallCheck).every((v) => v === 'clear'),
    'the hall table, statue, cabinet and commode all clear the wall behind them',
    JSON.stringify(wallCheck));

  // --- Start. A real trusted click is what pointer lock requires, AND A
  // FOCUSED WINDOW. Chrome refuses `requestPointerLock` on a document whose
  // window is not the foreground one, with `WrongDocumentError: The root
  // document of this element is not valid for pointer lock` — which is not a
  // permissions error and does not name focus, so it reads like a bug in the
  // page. It is not: run this file from a shell that did not take window focus
  // (a background job, a second monitor, anything that leaves the launched
  // Chrome behind another app) and the click lands, the overlay closes and the
  // lock silently never happens. Verified both ways on 2026-09-17: the same
  // script run in the foreground locked on a plain click, run backgrounded it
  // threw WrongDocumentError, and `bringToFront()` fixed the backgrounded run.
  // One line, and it is the difference between this suite being runnable
  // unattended and not.
  await page.bringToFront();
  await page.click('#start-button');
  await wait(600);
  let s = await state();
  assert(s.locked, 'pointer lock engaged');
  if (!s.locked) throw new Error('without pointer lock there is nothing left to test — is this running headed?');

  // --- The hall brazier now has a collider (it used to have none, same as the
  // bare coal it replaced). Walk straight at its centre and confirm the player
  // is stopped short rather than walking through it. Bounded burst count: if the
  // collider is missing this would otherwise "arrive" in a couple of strides.
  const toBrazier = await driveTo(page, HALL_BRAZIER, async (dist) => dist < 0.25, { maxBursts: 20 });
  assert(!toBrazier, 'the hall brazier collider stops the player walking into it',
    toBrazier ? `reached ${toBrazier.dist}m — no collider` : 'blocked as expected');

  // --- Real mouse movement drives the look.
  const yaw0 = await page.evaluate(() => +window.__cam.rotation.y.toFixed(4));
  await page.mouse.move(700, 400);
  await page.mouse.move(500, 400);
  await wait(200);
  const yaw1 = await page.evaluate(() => +window.__cam.rotation.y.toFixed(4));
  assert(yaw0 !== yaw1, 'mouse look turns the camera', `${yaw0} -> ${yaw1}`);

  // --- The upper level and the wall walk (Phase 5). Up the Kitchen Tower's
  // two flights, east along the north walk, through the Stockhouse Tower's walk
  // door, south over the cross-wall to the Bakehouse Tower, down its two flights
  // into the bakehouse and out into the inner ward. The camera's y is read at
  // each landing: 5.7 on a first floor (4 + the eye), 9.7 on the walk, 1.7 in
  // the ward. This is the one beat in the file that #53 makes inconclusive on a
  // software renderer: a walk that clips through a deck or stalls on a flight
  // here is a walk to re-run on a real GPU before it is called a bug.
  //
  // WAYPOINTS ARE WORLD METRES OFF src/castle-plan.js'S OWN PLACEMENT. The
  // Kitchen Tower is centred at (-20, -16); its lower flight runs along z in
  // the tower's east half rising toward the ward, foot at the north end, and its
  // upper flight along x in the north half rising east. The Bakehouse Tower is
  // the mirror at (0, 16). A flight is entered at its foot and left at its top
  // through the crescent of floor beside it, which is 0.5 to 0.8 m wide, so the
  // strides here are short.
  const heightAt = async () => +(await page.evaluate(() => window.__cam.position.y)).toFixed(2);
  /* THE BURST BUDGET IS NOT AN ASSERTION AND WAS BEING READ AS ONE. It was 30,
   * and a burst is 250 ms of held W inside a tower and 250 ms in open ground
   * too — call it 0.7 m each once the aim and the strafe nudge are paid for.
   * The first leg below is 21 m from where the brazier stops the player to the
   * Kitchen Tower's door, so it needed 28 of the 30 in the best case. It made
   * it in 18 on one run and ran out on the next two, which reported "never got
   * within 0.7 m" — a sentence about the castle for a fact about the budget.
   * 70 is four times the best observed leg and still bounded; a walk that is
   * genuinely blocked fails as loudly, just later.
   *
   * AND THE FAILURE SAYS WHERE IT STOPPED NOW. "never got within 0.7 m, y 1.7"
   * was true of a player wedged in a kitchen corner 20 m from the door and of a
   * player standing on the doorstep, and the two want completely different
   * answers. */
  const goTo = async (target, label, tol = 0.7, maxBursts = 70) => {
    const r = await driveTo(page, target, async (dist) => dist < tol, { maxBursts, nearAt: 2.5, longMs: 250, shortMs: 90 });
    const at = await page.evaluate(() => [+window.__cam.position.x.toFixed(2), +window.__cam.position.z.toFixed(2)]);
    assert(!!r, `reached ${label}`,
      r ? `${r.dist}m after ${r.bursts} bursts, y ${await heightAt()}`
        : `never got within ${tol} m — stopped at (${at[0]}, ${at[1]}), y ${await heightAt()}, wanted (${target[0]}, ${target[1]})`);
    return !!r;
  };
  const near = (a, b) => Math.abs(a - b) < 0.35;
  let onWalk = false;
  {
    const y0 = await heightAt();
    assert(near(y0, 1.7), 'the camera starts at ground eye height', `y ${y0}`);
    // Into the Kitchen Tower by its door on the kitchen side, round the west of
    // the lower flight to its foot at the north end, and up it.
    const legs = [
      [[-20, -11.6], 'the Kitchen Tower door'],
      [[-20.6, -14.6], 'the larder, west of the lower flight'],
      [[-20.6, -17.4], 'the north-west of the larder'],
      [[-19.25, -17.5], 'the foot of the lower flight'],
      [[-19.25, -14.3], 'the top of the lower flight'],
      [[-19.75, -13.8], 'the first floor, south crescent'],
    ];
    let ok = true;
    for (const [t, label] of legs) { if (!(ok = await goTo(t, label))) break; }
    if (ok) assert(near(await heightAt(), 5.7), 'the camera is one storey up on the Kitchen Tower\'s first floor', `y ${await heightAt()}`);
    await snap('kitchen-tower-first-floor');
    const legs2 = [
      [[-21.6, -14.6], 'the west of the first floor'],
      [[-21.75, -16.75], 'the foot of the upper flight'],
      [[-18.2, -16.75], 'the top of the upper flight'],
      [[-17.7, -15.0], 'the top room, at the walk'],
    ];
    if (ok) for (const [t, label] of legs2) { if (!(ok = await goTo(t, label))) break; }
    if (ok) {
      const y = await heightAt();
      onWalk = near(y, 9.7);
      assert(onWalk, 'the camera is two storeys up, at the wall walk', `y ${y}`);
    }
    await snap('kitchen-tower-top');

    /* --- THE THIRD FLIGHT, AND A TOWER ROOF FROM 12 M (#523) -------------
     * Four towers grew a roof room at their own height and nothing has ever
     * stood on one. The view over the whole plan from 12 m is the thing that
     * row was for and no check in CI can see it, so this is a climb and a
     * photograph rather than a measurement.
     *
     * WHY THE KITCHEN TOWER AND NOT THE NORTH-WEST ONE. `SPECS.md` says the
     * North-west Tower's roof. This takes the Kitchen Tower's instead, and the
     * reason is that the walk is already standing on it. The North-west Tower's
     * ground door is at theta 60 where the Kitchen Tower's is at 0, so
     * `doorEast` is true there and false here, `sideX` flips, and every one of
     * the ten waypoints above is mirrored about the drum's centre — a set of
     * guesses nobody has walked, bolted to the front of the one climb in this
     * file that is known to work. The question #523 asks is what 12 m over this
     * castle looks like, and it is the same 12 m from either drum, four
     * hundredths of the castle's width apart.
     *
     * THE CLIMB IS NOT A SWITCHBACK (#523, again). The third flight stands
     * directly on the second — same tile, same bearing, one storey up — so it
     * takes no walkable metre of the level-2 floor, which is the wall walk's
     * junction and has none to spare. The cost is that a body leaves the second
     * flight at its HEAD and has to walk back round its well to start the third
     * at its FOOT, four metres over where it started. That walk round is the
     * first leg below and it is the leg most likely to fail.
     *
     * AND IT PUTS THE PLAYER BACK. `legs3` starts from the top room at 8 m; a
     * player left standing on the roof would walk the north walk beat off a
     * 12 m parapet. The descent is asserted into `ok` for exactly that reason,
     * so a climb that cannot be undone stops the walk instead of corrupting it. */
    if (ok && onWalk) {
      /* SQUARE ON TO THE FLIGHT, AND THAT IS THE WHOLE TRICK. The first cut of
       * these legs walked at the flight diagonally, from the top room's middle
       * to a point near its foot, and the body never got on it: `standAt` finds
       * NOTHING over the flight's own footprint at floor height (measured — at
       * z -16.75 and feet 8.00, x -21.65 and -21.40 answer with the third
       * flight and x -21.00 through -18.60 answer with nothing at all, because
       * the flight has risen out of a step's reach and the level-2 floor has a
       * well cut through it there). A body crossing that band is refused, slides
       * along, and comes to rest at the east end on the SECOND flight's head at
       * 7.90 — one step down from the floor it started on, pointing down. The
       * run that found this reported "never got within 0.8 m, y 6.67" and it
       * read like a hole in the tower.
       *
       * So: get to the flight's own z first, west of its foot, then walk due
       * east along its axis. Walked in Node with the controller's own
       * `moveBody` before it was walked here: 0.05 m steps from x -22.40 climb
       * 8.00 to 12.00 without one refusal. */
      const roofLegs = [
        [[-21.0, -15.0], 'the top room, west of the well'],
        [[-22.3, -15.6], "the top room's west wall"],
        [[-22.3, -16.75], 'the foot of the third flight, square on to it'],
        [[-18.6, -16.75], 'up the third flight, due east'],
        [[-18.0, -16.6], 'off the third flight onto the roof'],
        // ROUND THE WELL, NOT ACROSS IT. The third flight's well in the roof
        // floor is its own footprint, x -21.65..-18.35 by z -17.50..-16.00, and
        // a straight line from the flight's head to the middle of the roof
        // clips its north-east corner. The run that found this reported
        // "stopped at (-20.38, -16), y 11.2" — the player had walked into the
        // hole and slid back down the flight they had just climbed.
        [[-18.0, -15.0], "the roof, east of the third flight's well"],
        [[-19.8, -14.8], "the middle of the Kitchen Tower's roof"],
      ];
      let roofOk = true;
      for (const [t, label] of roofLegs) { if (!(roofOk = await goTo(t, label, 0.8))) break; }
      if (roofOk) {
        const y = await heightAt();
        assert(near(y, 13.7), "the camera is three storeys up, on the Kitchen Tower's roof at 12 m", `y ${y}`);
        // East, down the length of the castle: the north curtain, the
        // Stockhouse and King's Towers, the garden wall 44 m away. Pitched a
        // little down so the ward is in the frame and not just sky.
        await aimAt(page, [24, -16], -0.22);
        await wait(350);
        await snap('a-tower-roof-from-12m');
      }
      // Back down, whatever happened above: from the roof, from the flight, or
      // from wherever the climb stalled.
      const down = [
        [[-18.0, -15.0], "back east of the third flight's well"],
        [[-18.0, -16.75], 'the head of the third flight, going down'],
        [[-22.3, -16.75], 'down the third flight, due west'],
        [[-21.0, -15.0], 'back on the level-2 floor'],
        [[-17.7, -15.0], 'back in the top room, at the walk'],
      ];
      for (const [t, label] of down) { if (!(ok = await goTo(t, label, 0.9))) break; }
      if (ok) assert(near(await heightAt(), 9.7), 'back at the wall walk, 9.7', `y ${await heightAt()}`);
    }

    const legs3 = [
      [[-15, -15], 'the north walk east of the Kitchen Tower'],
      [[-6, -15], 'the north walk at the Stockhouse Tower'],
      [[-1.5, -15], 'the Stockhouse Tower\'s top room, through the walk door'],
      [[-1, -12.6], 'the cross-wall walk\'s north end'],
      [[-1, 0], 'the cross-wall walk over the porter\'s gate'],
      [[-1, 12.6], 'the cross-wall walk\'s south end'],
    ];
    if (ok) for (const [t, label] of legs3) { if (!(ok = await goTo(t, label, 0.9))) break; }
    if (ok) assert(near(await heightAt(), 9.7), 'still at 9.7 over the porter\'s head', `y ${await heightAt()}`);
    await snap('cross-wall-walk');
    /* --- DOWN THE BAKEHOUSE TOWER, AND THIS WAS WRONG END TO END ------------
     * These ten waypoints were written as a mirror of the Kitchen Tower's and
     * the mirror was never applied to the STAIRS, only to the coordinates. The
     * Bakehouse's ground door faces the other way, so `doorEast` flips,
     * `sideX` flips with it, and its upper flight rises the opposite way along
     * x: read off the plan, `bakehouse-tower-stair-2` slopes from (1.65, 4.00)
     * to (-1.65, 7.90), so its HEAD is at x -1.65 in the WEST and its FOOT is
     * at x +1.65 in the EAST. The old legs called x +1.75 "the top" and x -1.8
     * "the foot", which is both labels the wrong way round, and the lower
     * flight's two legs stood at x +0.75 against a flight the plan puts at
     * x -0.75.
     *
     * WHAT THAT DOES TO A BODY, rather than to a reader: from the level-2 floor
     * at 8.00 the only way onto this flight is at its head, 7.90, one 0.10 m
     * step down. At the foot end the flight is at 4.12 under a floor at 8.00,
     * a 3.88 m drop, and `standAt` refuses it — so the player walks to the east
     * end, is refused, and stands there at 8.00 for the rest of the day. That
     * is what the run reported: four legs "reached" at y 9.7 with not one metre
     * of descent in them, then a failure in the bakehouse, then a Constable who
     * could not be reached because the player was two storeys over his head.
     * Walked in Node with the controller's own `moveBody` before it was walked
     * here: the old route holds 8.00 from its first leg to its last, and this
     * one goes 8.00, 4.42, 4.00, 3.78, 0.06, 0.00.
     *
     * SQUARE ON TO EACH FLIGHT, for the reason the third flight needed it
     * above: over a flight's own footprint there is nothing to stand on at
     * floor height, so a body crossing that band diagonally is refused and
     * slides along it. Reach the flight's own axis first, then walk down it. */
    const legs4 = [
      [[-0.5, 14.6], "the Bakehouse Tower's top room"],
      [[-2.2, 15.0], 'west of the upper flight, on the level-2 floor'],
      [[-2.2, 16.75], 'the head of the upper flight, square on to it'],
      [[1.6, 16.75], 'down the upper flight, due east'],
      [[1.9, 16.4], 'off it onto the first floor'],
      [[1.6, 14.6], 'the first floor, north-east'],
      [[-0.75, 14.2], 'the head of the lower flight, square on to it'],
      [[-0.75, 17.9], 'down the lower flight, due south'],
      [[0.4, 18.2], 'the bakehouse floor, south crescent'],
      [[2.3, 16.2], 'the bakehouse, east of the flight'],
      [[4.2, 12.6], "out of the bakehouse door, into the Steward's chamber"],
    ];
    if (ok) for (const [t, label] of legs4) { if (!(ok = await goTo(t, label))) break; }
    if (ok) assert(near(await heightAt(), 1.7), 'the camera is back at ground eye height, two flights down', `y ${await heightAt()}`);
    await snap('inner-ward-from-the-walk');

    /* AND OUT OF THE STEWARD'S CHAMBER, WHICH IS WHERE THE BAKEHOUSE DOOR PUTS
     * YOU. The leg above was labelled "the inner ward" and is not in it: the
     * Bakehouse Tower's ground door stands at theta 120, world (3.46, 14), and
     * what is on the other side of it is the Steward's chamber, x 2..10 by
     * z 6..14, a closed room with one doorway at (6, 6). The HUD said so in the
     * frame the run aborted on — "Steward's chamber", the player face-first into
     * its east wall.
     *
     * NOTHING HERE PATHFINDS. `walkTo` aims at the target and holds W, with one
     * sideways nudge when the distance stops changing, and that is enough in
     * open ground and hopeless out of a room whose door is behind you. The
     * intended path begins with the Constable in the chapel, 20 m east and
     * through two walls, so the day could not start at all. Four legs put the
     * player in open ward first. Walked in Node with `moveBody` before it was
     * walked here. */
    if (ok) {
      const toWard = [
        [[6, 9], "the Steward's chamber, under its door"],
        [[6, 3.5], 'through that door, into the inner ward'],
        [[18, 3.5], 'east across the inner ward'],
        [[19.3, 13.3], "outside the Chapel Tower's door"],
      ];
      for (const [t, label] of toWard) { if (!(ok = await goTo(t, label, 0.9))) break; }
    }
    if (!ok) bad('the walk over the top did not complete', 'see the legs above; #53 applies on a software renderer');
  }

  /* ======================================================================
   * THE INTENDED PATH (PLAN.md). Phase 7 put the
   * mystery on the screen, and this is the only thing anywhere that plays it
   * with a hand: walk to somebody, press E, read what they say, open the
   * journal, present a clue, ring the bell, and at the end name a man to the
   * Constable and read the epilogue.
   *
   * WHAT THIS SEES THAT NOTHING ELSE DOES. test/quest.mjs drives the same path
   * through the real manager against a UI that records instead of rendering, so
   * it sees every decision and none of the reaching: whether the player can
   * actually get within 3.2 m of the Steward at Sext, whether the pouch on the
   * chapel floor is low enough to look at, whether walking onto the cross-wall
   * walk is noticed at all. test/plan-vs-scene.mjs sees the prompts and the
   * overlays under a software rasteriser, camera placed rather than walked.
   * This walks.
   *
   * #53 APPLIES TO EVERY TIMING BELOW. A walk that does not arrive, or a body
   * still moving after 45 s, is inconclusive under a software renderer and only
   * means something from a machine with real GPU compositing.
   * ====================================================================== */

  /** Every held clue's id, straight off the engine. */
  const held = () => page.evaluate(() => [...window.__mystery.state.clues]);
  /** The world point a piece of evidence's prompt is aimed at. */
  const evidenceAt = async (id) => page.evaluate((eid) => {
    const t = (window.__evidence || []).find((x) => x.id === eid);
    return t ? [t.focus.x, t.focus.z] : null;
  }, id);

  /** Walk to somebody's station at this bell and step through what they say. */
  const converse = async (npcId, nameRe, label = npcId) => {
    const due = await stationOf(npcId);
    if (!due) { bad(`${label}: not in the castle at this bell`); return null; }
    await arrives(npcId);
    const walked = await walkTo(due.at, nameRe.source.replace(/\W/g, ''), due.level ?? 0);
    assert(!!walked, `walked to the ${label} in ${due.room}`, walked ? `${walked.dist}m after ${walked.bursts} bursts` : 'never got in range');
    if (!walked) return null;
    await page.keyboard.press('KeyE');
    await wait(400);
    let s2 = await state();
    if (!s2.dialogueOpen) { bad(`${label}: E opened no dialogue`, JSON.stringify(s2.prompt)); return null; }
    assert(nameRe.test(s2.dialogueName || ''), `E opened the ${label}'s dialogue`, s2.dialogueName);
    /* ONE PHOTOGRAPH PER BODY, WHICH IS HALF OF WHAT THIS ROW IS FOR (#417,
     * #419; PLAN.md, Risks). Twelve people come off three Kenney bodies told
     * apart by tint, and that was accepted as a RISK, not as a solution —
     * accepted by sessions that could not render a frame. The wide shot of the
     * Great Hall at Vespers below answers whether six read as a crowd; this
     * answers the harder half, which is whether the man standing at interact
     * range with his name on the screen is distinguishable from the last one.
     * A screenshot, not an assertion: no number here can answer it and nobody
     * should pretend one does.
     *
     * ONCE PER PERSON. `present()` calls `converse()` again to open the box
     * before it clicks the button, and the Clerk is presented to twice, so
     * without this the run would file four portraits of him and none of them
     * would be new evidence. */
    if (!photographed.has(npcId)) { photographed.add(npcId); await snap(`face-${npcId}`); }
    const lines = [];
    for (let i = 0; i < 10 && (await state()).dialogueOpen; i++) {
      lines.push((await state()).dialogueText);
      await page.keyboard.press('KeyE');
      await wait(320);
    }
    return { due, lines };
  };

  /** E on a piece of evidence, and what it put in the journal. */
  const examine = async (evidenceId, label = evidenceId) => {
    const at = await evidenceAt(evidenceId);
    if (!at) { bad(`${label}: not an interaction target — nothing in the plan carries that evidence, or it is hidden at this bell`); return null; }
    const walked = await walkTo(at, 'examine', 0, 3.5);
    assert(!!walked, `walked to the ${label}`, walked ? `${walked.dist}m after ${walked.bursts} bursts` : 'never got in range');
    if (!walked) return null;
    const before = await held();
    await page.keyboard.press('KeyE');
    await wait(400);
    const after = await held();
    const gained = after.filter((c) => !before.includes(c));
    return { gained, toast: await textContent(page, '#toast') };
  };

  /**
   * Present a clue to somebody: open their dialogue, click Present, click the
   * row. The journal rows carry their clue id, so this names a clue rather than
   * counting rows.
   */
  const present = async (npcId, clueId, nameRe, label = npcId) => {
    const c = await converse(npcId, nameRe, label);
    if (!c) return null;
    // converse() ran the dialogue out. Re-open it and use the button instead.
    await page.keyboard.press('KeyE');
    await wait(350);
    if (!(await state()).dialogueOpen) { bad(`${label}: could not re-open the dialogue to present ${clueId}`); return null; }
    const hasButton = await page.evaluate(() => !document.getElementById('dialogue-present').classList.contains('hidden'));
    assert(hasButton, `the ${label}'s dialogue offers Present`);
    if (!hasButton) return null;
    await page.click('#dialogue-present');
    await wait(300);
    const row = await page.evaluate((id) => !!document.querySelector(`#journal-list .journal-row[data-id="${id}"]`), clueId);
    assert(row, `${clueId} is in the list the Present button opens`);
    if (!row) return null;
    const before = await held();
    await page.evaluate((id) => document.querySelector(`#journal-list .journal-row[data-id="${id}"]`).click(), clueId);
    await wait(400);
    const stateAfter = await page.evaluate((id) => window.__mystery.npcState(id), npcId);
    const after = await held();
    return { state: stateAfter, gained: after.filter((x) => !before.includes(x)) };
  };

  // ---- Prime: the Constable over the body -------------------------------
  const first = await converse('constable', /Roger/, 'Constable');
  if (!first) throw new Error('cannot start the day without the Constable');
  assert(!first.lines.includes('{ACCUSE}'), 'his last line is the {ACCUSE} token, substituted', JSON.stringify(first.lines.at(-1)));
  let stage = await page.evaluate(() => window.__quest.stage);
  assert(stage === 'investigate', 'the first conversation moves the day to `investigate`', stage);
  assert(await page.evaluate(() => document.getElementById('accusation-overlay').classList.contains('hidden')), 'and opens no accusation panel yet');
  assert((await held()).includes('constable-accident'), '"he fell" is in the journal');
  await snap('constable-at-the-body');

  /* THE CHAPEL AT PRIME, WITH THE TWO WHO STAND OVER THE BODY. `SPECS.md`
   * calls this shot "constable, chaplain, apprentice nearby". THE APPRENTICE IS
   * NOT HERE: `data/mystery.json`'s schedule has Ieuan in the mason's lodge at
   * Prime and in this chapel at Vespers, at the vigil. So this frame carries
   * two of the twelve, not three, and the apprentice's own portrait comes off
   * his conversation in the lodge a few beats below. A screenshot, not an
   * assertion. */
  {
    const chaplainDue = await stationOf('chaplain');
    await driveTo(page, [25.5, 17.6], async (d) => d < 1.0, { maxBursts: 22, nearAt: 3 });
    if (chaplainDue) await aimAt(page, [(chaplainDue.at[0] + 23.6) / 2, (chaplainDue.at[1] + 16.8) / 2], -0.1);
    await wait(350);
    await snap('the-chapel-at-prime');
  }

  const body = await examine('body', 'body at the stair foot');
  assert(body && body.gained.includes('body-stair'), 'E on the body: he is at the foot of the stair', body?.gained.join(', '));
  assert(!!body?.toast && /New clue/.test(body.toast), 'and the toast says so', JSON.stringify(body?.toast));
  const pouch = await examine('pouch', "mason's pouch");
  assert(pouch && pouch.gained.includes('summons-note') && pouch.gained.includes('pouch-empty'), 'the pouch: a summons and no tallies', pouch?.gained.join(', '));
  const pouchGone = await page.evaluate(() => {
    const t = (window.__evidence || []).find((x) => x.id === 'pouch');
    return !!t && t.group.visible === false;
  });
  assert(pouchGone, 'and it leaves the world, because take:true means the player has it');
  await snap('the-pouch-taken');

  // The journal, on J.
  await page.keyboard.press('KeyJ');
  await wait(300);
  const journal = await page.evaluate(() => ({
    open: !document.getElementById('journal-overlay').classList.contains('hidden'),
    rows: [...document.querySelectorAll('#journal-list .journal-row')].map((r) => r.dataset.id),
    title: document.getElementById('journal-title').textContent.trim(),
  }));
  assert(journal.open, 'J opens the journal');
  assert(JSON.stringify(journal.rows) === JSON.stringify(await held()), `it lists all ${journal.rows.length} held clues in the order they were found`, journal.rows.join(', '));
  assert(/What you know/.test(journal.title), 'read-only, not the picker', journal.title);
  await snap('journal');
  await page.keyboard.press('KeyJ');
  await wait(250);
  assert(await page.evaluate(() => document.getElementById('journal-overlay').classList.contains('hidden')), 'J again shuts it');

  /* AND IT GIVES THE CASTLE BACK, WHICH IT DOES NOT. This is the one assertion
   * in this file that nothing but a hand on a keyboard could ever have written,
   * and it is the answer to what `npm run play` is for. See `regrip` above for
   * the measurements. It is red on purpose and stays red until the game calls
   * `lock()` when an overlay closes, or offers the resume panel it already has. */
  const afterJournal = await page.evaluate(() => !!document.pointerLockElement);
  assert(afterJournal, 'shutting the journal gives the player back the castle',
    afterJournal ? '' : 'pointer lock is gone, no resume panel is offered, and W does nothing — the player can only reload');
  await regrip('the journal');

  // The rest of Prime.
  await converse('cook', /Marged/, 'cook');
  assert((await held()).includes('lantern-set-down'), 'the cook, and the deduction lands with her');
  await converse('porter', /Gwilym/, 'porter');
  assert((await held()).includes('porter-barred'), 'the porter: "barred as always"');
  const cloak = await examine('cloak', 'cloak on the crate');
  assert(cloak && cloak.gained.includes('cloak-wax'), 'the cloak in the laundry, with wax on it', cloak?.gained.join(', '));
  await converse('apprentice', /Ieuan/, 'apprentice');
  assert((await held()).includes('tallies-taken'), 'the apprentice, and tallies-taken deduced');

  // The sentry is asleep at Prime, and the box says so rather than opening on
  // lines he is in no state to give.
  const sleeping = await stationOf('sentry');
  if (sleeping) {
    const walked = await walkTo(sleeping.at, 'Dafydd');
    if (walked) {
      await page.keyboard.press('KeyE');
      await wait(400);
      const said = await textContent(page, '#dialogue-text');
      assert(/asleep/i.test(said || ''), 'the sentry is asleep at Prime and the box says so', JSON.stringify(said));
      await page.keyboard.press('KeyE');
      await wait(300);
    }
  }
  /* --- THE GAOL ROLL, AND THE FIRST SLAB HERE THAT RESTS ON ANOTHER PROP
   * (#571). The eleventh piece of evidence, the only one that convicts nobody,
   * and the one this file's own header says the intended path never reaches.
   * THAT HEADER IS WRONG and this beat is where it shows: the sentry is asleep
   * in the guardroom at Prime and the beat above walks to him, so the path has
   * been standing inside the North-west Tower all along, three metres from a
   * roll nobody pressed E on. It cost two lines to reach, not a detour.
   *
   * WHAT ONLY A RENDER ANSWERS: whether a 0.4 x 0.3 m parchment slab resting
   * 3 mm over a pair of barrels reads as a roll lying on a barrel-head or as a
   * box floating above one. `test/layout.mjs` check 1d can say something is
   * under it and can never say what it looks like. So the photograph comes
   * BEFORE the E press, because evidence that has been taken stops being drawn.
   *
   * AND IT CHANGES THE SECOND DAY ON PURPOSE. `gaol-dates` in the journal is
   * what `day2.knew` is keyed on (#575), so taking it here means the King's man
   * on the morning after says the lines for a player who read the dates. That
   * is the branch nothing has ever walked. */
  {
    const rollAt = await evidenceAt('gaol-roll');
    if (!rollAt) {
      bad('the gaol roll is not an interaction target at Prime');
    } else {
      const walked = await walkTo(rollAt, 'examine', 0, 3.5);
      assert(!!walked, 'walked into the guardroom to the gaol roll',
        walked ? `${walked.dist}m after ${walked.bursts} bursts` : 'never got in range');
      if (walked) {
        await aimAt(page, rollAt, -0.42);
        await wait(300);
        await snap('the-gaol-roll-on-the-barrel-head');
      }
      const roll = await examine('gaol-roll', 'gaol roll');
      assert(roll && roll.gained.includes('gaol-dates'),
        'E on the roll: the dates that put Madoc at the forge by day and behind the bars by night',
        roll?.gained.join(', ') || 'nothing gained');
    }
  }

  await snap('end-of-prime');

  // ---- The bell -----------------------------------------------------------
  const bellAt = await page.evaluate(async () => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    let box = null;
    window.__scene.traverse((o) => {
      if (o.userData?.planId !== 'chapel-bell') return;
      const b = new THREE.Box3().setFromObject(o);
      box = [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2];
    });
    return box;
  });
  assert(!!bellAt, 'the chapel bell is in the scene', JSON.stringify(bellAt));
  const ring = async (n) => {
    const toBell = await walkTo(bellAt, 'ring the bell');
    assert(!!toBell, `walked to the bell for ring ${n}`, toBell ? `${toBell.dist}m after ${toBell.bursts} bursts` : 'never got in range');
    if (!toBell) throw new Error('cannot ring a bell that cannot be reached');
    await page.keyboard.press('KeyE');
    await wait(700);
    return page.evaluate(() => window.__mystery.watch);
  };
  assert((await ring(1)) === 'terce', 'the first ring: Terce');
  await snap('terce');

  // ---- Terce --------------------------------------------------------------
  const cart = await examine('cart', 'cart under the sacking');
  assert(cart && cart.gained.includes('merchant-cart'), "under the merchant's sacking: the King's lead", cart?.gained.join(', '));
  const merchant = await present('merchant', 'merchant-cart', /Wykes/, 'merchant');
  assert(merchant && merchant.state === 'admits', 'presented with the cart, the merchant admits', JSON.stringify(merchant));
  assert(merchant && merchant.gained.includes('merchant-admits'), 'and says who sold it to him');
  await snap('merchant-admits');

  await converse('sentry', /Dafydd/, 'sentry');
  assert((await held()).includes('sentry-sighting'), 'the sentry, awake at Terce, saw fur on the walk');

  // The cross-wall walk IS a clue: standing on it is how `walk-crosses` is
  // found. Nothing but a walking player can trip this — main.js asks `inRoom`
  // on the frames the player is moving, and no other check walks.
  const crossing = await driveTo(page, [-1, 0], async () => (await held()).includes('walk-crosses'));
  assert((await held()).includes('walk-crosses'), 'walking onto the cross-wall walk lands walk-crosses',
    crossing ? `${crossing.dist}m after ${crossing.bursts} bursts` : 'never got there, or got there and nothing noticed');
  await snap('cross-walk-crossing');

  const walkDoor = await examine('walk-door', 'bar beside the Stockhouse door');
  assert(walkDoor && walkDoor.gained.includes('door-unbarred'), 'the Stockhouse door, unbarred', walkDoor?.gained.join(', '));
  const tally = await examine('tally', 'tally stick');
  assert(tally && tally.gained.includes('tally-on-walk'), 'the tally stick in the gutter of the south walk', tally?.gained.join(', '));
  const candle = await examine('candle', 'chapel candles');
  assert(candle && candle.gained.includes('wax-matches'), 'the chapel candles, and wax-matches deduced against the cloak', candle?.gained.join(', '));

  assert((await ring(2)) === 'sext', 'the second ring: Sext');
  await snap('sext');

  // ---- Sext ---------------------------------------------------------------
  await converse('lady', /Alys/, 'Lady Alys');
  assert((await held()).includes('summons-is-stewards'), "her sevens: the summons is in the Steward's hand");
  const alys = await present('lady', 'walk-crosses', /Alys/, 'Lady Alys');
  assert(alys && alys.gained.includes('lady-window'), 'presented with the walk, she says what she saw from her window', JSON.stringify(alys));
  const steward = await present('steward', 'summons-is-stewards', /Piers/, 'Steward');
  assert(steward && steward.state === 'admits' && steward.gained.includes('steward-admits'), 'the Steward admits the summons', JSON.stringify(steward));
  const chaplain = await present('chaplain', 'steward-admits', /Anselm/, 'chaplain');
  assert(chaplain && chaplain.gained.includes('chaplain-feet'), 'the chaplain heard two sets of feet on the stair', JSON.stringify(chaplain));
  await snap('pressed-three');

  // --- The word-lock. The riddle is carved over the muniment room's door in the
  // King's Tower; pressing E at it reads the word into the journal AND opens the
  // overlay, which is one press doing both (Phase 7). Nothing in Node sees the
  // prompt, the facing test or the line of sight to a leaf hanging off a hinge
  // at its own edge.
  const toLock = await walkTo(MUNIMENT_LOCK, 'word-lock');
  assert(!!toLock, "walked to the muniment room's door", toLock ? `${toLock.dist}m after ${toLock.bursts} bursts` : 'never got in range');
  await snap('at-word-lock');
  if (!toLock) throw new Error('cannot reach the word-lock, so the ledger can never be read');
  s = await state();
  assert(/word-lock/i.test(s.prompt || ''), 'the door offers its own prompt, not "talk to"', JSON.stringify(s.prompt));

  await page.keyboard.press('KeyE');
  await wait(500);
  s = await state();
  assert(s.riddleOpen, 'E at the word-lock opened the riddle overlay');
  assert(!s.locked, 'pointer lock released so the answer can be typed');
  assert((await held()).includes('word-lock'), 'and the same press read the word-lock into the journal');
  await snap('riddle');
  if (!s.riddleOpen) throw new Error('no riddle, so the muniment room never opens');

  // Wrong answers: distinct responses, and the hint from the second one on.
  await page.fill('#riddle-input', 'a door');
  await page.press('#riddle-input', 'Enter');
  await wait(300);
  const wrong1 = await textContent(page, '#riddle-feedback');
  await page.fill('#riddle-input', 'the sky');
  await page.press('#riddle-input', 'Enter');
  await wait(300);
  const wrong2 = await textContent(page, '#riddle-feedback');
  assert(!!wrong1 && wrong1 !== wrong2, 'wrong answers give escalating responses');
  assert(/Hint:/.test(wrong2), 'the second wrong answer adds the hint');

  await page.fill('#riddle-input', 'River');
  await page.press('#riddle-input', 'Enter');
  await wait(900);
  s = await state();
  assert(!s.riddleOpen, 'the right answer closed the riddle');
  assert(s.locked, 'pointer lock re-acquired after the overlay');
  assert(await page.evaluate(() => window.__mystery.state.locks.includes('muniment')), 'and the muniment room is unlocked in the engine');
  await snap('word-holds');

  // --- Reload: the save (src/save.js) resumes the day where it was. The
  // autosave flushes on pagehide, so nothing has to wait for its timer here.
  // test/save.mjs holds the repair rails in Node; this is the one beat that sees
  // a real reload carry the watch, the journal, a pressed NPC and the camera.
  const before = await page.evaluate(() => ({ x: window.__cam.position.x, z: window.__cam.position.z, clues: window.__mystery.state.clues.length }));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 90000 });
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);
  const resumed = await page.evaluate(() => ({
    stage: window.__quest?.stage,
    watch: window.__mystery?.watch,
    clues: window.__save?.state?.clues?.length,
    steward: window.__mystery?.npcState('steward'),
    wrong: window.__save?.state?.riddleWrong,
    unlocked: window.__save?.state?.locks?.includes('muniment'),
    x: window.__cam.position.x, z: window.__cam.position.z,
  }));
  assert(resumed.stage === 'investigate' && resumed.watch === 'sext', 'after a reload the day is still at Sext, mid-investigation', JSON.stringify(resumed));
  assert(resumed.clues === before.clues, `all ${before.clues} clues survived the reload`, String(resumed.clues));
  assert(resumed.steward === 'admits', 'and the Steward is still pressed');
  assert(resumed.wrong === 2, 'the two wrong answers survived the reload', String(resumed.wrong));
  assert(resumed.unlocked, 'and the muniment room is still unlocked');
  assert(Math.abs(resumed.x - before.x) < 0.05 && Math.abs(resumed.z - before.z) < 0.05, 'the camera came back where it was', `${before.x.toFixed(2)},${before.z.toFixed(2)} -> ${resumed.x.toFixed(2)},${resumed.z.toFixed(2)}`);
  // THE LEAF IS OPEN AGAIN, not shut behind a riddle that will never be offered
  // twice. `openLock` is on a transition in data/quest.json, so main.js re-opens
  // every lock in the save at load; without that the ledger is unreachable after
  // any reload and every Node suite still passes.
  const leafOpen = await page.evaluate(() => {
    const t = (window.__evidence || []).find((x) => x.id === 'ledger');
    return !!t;
  });
  assert(leafOpen, 'the ledger is still an interaction target after the reload');
  await page.click('#start-button');
  await wait(400);
  assert((await state()).locked, 'pointer lock after the reload');
  await snap('reloaded-at-sext');

  const ledger = await examine('ledger', 'works ledger');
  assert(ledger && ledger.gained.includes('lead-sold'), 'the ledger, and lead-sold deduced against the apprentice\'s count', ledger?.gained.join(', '));
  const clerk1 = await present('clerk', 'wax-matches', /Ferrour/, 'Clerk');
  assert(clerk1 && clerk1.gained.includes('clerk-cloak'), '"since Sunday"', JSON.stringify(clerk1));
  const clerk2 = await present('clerk', 'lead-sold', /Ferrour/, 'Clerk');
  assert(clerk2 && clerk2.state === 'cornered', 'the Clerk, cornered', JSON.stringify(clerk2));
  await snap('clerk-cornered');

  assert((await ring(3)) === 'vespers', 'the third ring: Vespers');
  await snap('vespers');

  // ---- Vespers ------------------------------------------------------------
  // The cook is due in the Great Hall at Vespers and was in the kitchen a moment
  // ago. This is the walk that only a real bell can produce.
  const cook = await arrives('cook');
  assert(cook && !cook.late, `the cook walked from the kitchen to the ${cook?.room}`,
    cook ? `${cook.dist}m from her station after ${(cook.took / 1000).toFixed(1)}s${cook.late ? ' — still walking' : ''}` : 'she is not in the castle at Vespers');

  /* --- SIX IN ONE ROOM, AND SOMEBODY LOOKS AT THEM (PLAN.md, Risks) -------
   * Constable, Steward, Clerk, cook, sentry and laundress all stand in the
   * Great Hall at Vespers, and they are six of the three Kenney bodies this
   * castle has. Whether that reads as six people or as three men wearing four
   * colours is the question the whole row exists to ask, and it has never been
   * asked of a frame a GPU drew.
   *
   * WHERE THIS STANDS, AND WHY NOT THE DOORWAY `SPECS.md` NAMES. The two north
   * doorways are at world x -20 and -12, and the six stand from x -27.2 to
   * -12 — so the doorway the spec picks is in the MIDDLE of them and half the
   * cast is behind the camera. The hall is 28 m long and its west end is the
   * only place in it where all six are in one frame. That is where this stands.
   *
   * WAIT FOR ALL SIX, not just the cook. `arrives` polls one body at a time;
   * a bell sends all six walking at once, and a photograph taken while four of
   * them are still crossing the ward is a photograph of an empty hall. */
  const HALL_SIX = ['constable', 'steward', 'clerk', 'cook', 'sentry', 'laundress'];
  const late = [];
  for (const id of HALL_SIX) { const a = await arrives(id); if (!a || a.late) late.push(id); }
  assert(late.length === 0, 'all six of the Great Hall are standing at their stations at Vespers',
    late.length ? `still walking: ${late.join(', ')}` : HALL_SIX.join(', '));

  await driveTo(page, [-30.5, 10], async (d) => d < 1.2, { maxBursts: 45, nearAt: 3 });
  // Bodies, not stations: where the twelve ACTUALLY are this frame, counted
  // inside the hall's own walls (x -33..-6.5, z 6.5..13.5). A station says
  // where somebody is due; this says who is there.
  const inHall = await page.evaluate(() => (window.__cast || [])
    .filter((n) => n.group.visible && n.group.position.x > -33 && n.group.position.x < -6.5
      && n.group.position.z > 6.5 && n.group.position.z < 13.5)
    .map((n) => n.id).sort());
  assert(inHall.length === 6, 'six bodies are standing inside the Great Hall', inHall.join(', '));
  await aimAt(page, [-6, 10], 0);
  await wait(400);
  await snap('twelve-at-vespers');

  /* SEVEN TRUSSES AT 8 M, AND WHETHER THEY READ AS A ROOF (#527). Each is
   * `structure-cross.glb` stretched to 0.5 x 2.5 x 7.25, and #528 left the
   * space between them open because no container could judge which it looks
   * like: a hammerbeam roof or scaffolding over a ruin. THIS SHOT IS WHAT
   * DECIDES WHETHER RANK 5 IS WORTH TAKING AT ALL. Same spot, pitched up. */
  await aimAt(page, [-6, 10], 0.72);
  await wait(300);
  await snap('the-hall-trusses');

  /* AND THE FLOOR, MEASURED (#438). This is the covering row's baseline: what
   * the hall reads OPEN is the number a covered hall has to be compared
   * against, and `SPECS.md` puts the line at about 25 of 255, under which a
   * second brazier at the east end is one config line. Pitched hard down so
   * the clip is floor and not wall. */
  await aimAt(page, [-6, 10], -1.0);
  await wait(300);
  await luma('the Great Hall floor at Vespers, OPEN, no covering', { x: 450, y: 300, width: 300, height: 200 });
  await snap('the-hall-floor-open');

  const porter = await present('porter', 'door-unbarred', /Gwilym/, 'porter');
  assert(porter && porter.gained.includes('porter-admits'), 'the porter, on the cross-wall walk, admits the door', JSON.stringify(porter));

  // The Constable, at the high table. He is standing where the player can SEE
  // him, not sealed inside the stonework: the prompt alone proves nothing, and
  // the Guard of v1 offered one from 0.16 m inside the gatehouse wall.
  const constableDue = await stationOf('constable');
  assert(!!constableDue, 'the data has the Constable somewhere at Vespers', JSON.stringify(constableDue));
  await arrives('constable');
  const visible = await page.evaluate(async ({ gx, gz }) => {
    const THREE = window.__THREE;   // stashed by attachSceneProbe
    const sc = window.__scene, cam = window.__cam;
    const npcRoots = new Set();
    sc.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      let r = o;
      while (r.parent && r.parent !== sc) r = r.parent;
      npcRoots.add(r);
    });
    const world = sc.children.filter((c) => !npcRoots.has(c));
    const from = cam.position.clone();
    const to = new THREE.Vector3(gx, 1.2, gz);
    const dist = from.distanceTo(to);
    const ray = new THREE.Raycaster(from, new THREE.Vector3().subVectors(to, from).normalize(), 0.01, dist);
    const blocker = ray.intersectObjects(world, true).find((h) => h.distance < dist - 0.05);
    return { dist: +dist.toFixed(2), blockedBy: blocker?.object.name || null };
  }, { gx: constableDue.at[0], gz: constableDue.at[1] });
  assert(!visible.blockedBy, 'the Constable is actually visible from interact range',
    visible.blockedBy ? `blocked by ${visible.blockedBy}` : `${visible.dist}m, clear`);

  const last = await converse('constable', /Roger/, 'Constable');
  if (!last) throw new Error('cannot finish without reaching the Constable');
  await wait(400);
  const panel = await page.evaluate(() => ({
    open: !document.getElementById('accusation-overlay').classList.contains('hidden'),
    names: [...document.querySelectorAll('#accusation-people .pick-person')].map((b) => b.dataset.id),
    clues: [...document.querySelectorAll('#accusation-clues .pick-clue')].map((b) => b.dataset.id),
    count: document.getElementById('accusation-count').textContent.trim(),
    dead: document.getElementById('accusation-say').disabled,
  }));
  assert(panel.open, 'his {ACCUSE} line opens the accusation panel');
  assert(panel.names.length === 13 && panel.names.includes('nobody') && !panel.names.includes('inspector'),
    "twelve names and a fall, and not the King's inspector", `${panel.names.length}: ${panel.names.join(', ')}`);
  assert(panel.clues.length === (await held()).length, `and the ${panel.clues.length} clues held`, panel.clues.length ? '' : 'the journal did not reach the panel');
  assert(/0 of 3/.test(panel.count), 'nothing presented yet, up to three allowed', panel.count);
  assert(panel.dead, 'and the button is dead until somebody is named');
  await snap('accusation-panel');

  // Name the Clerk on the sighting, the wax and the lead: the full ending.
  const said = await page.evaluate(async (clues) => {
    const click = (sel) => document.querySelector(sel)?.click();
    click('#accusation-people .pick-person[data-id="clerk"]');
    for (const id of clues) click(`#accusation-clues .pick-clue[data-id="${id}"]`);
    const count = document.getElementById('accusation-count').textContent.trim();
    const dead = document.getElementById('accusation-say').disabled;
    document.getElementById('accusation-say').click();
    await new Promise((r) => setTimeout(r, 400));
    return {
      count, dead,
      verdictShown: !document.getElementById('verdict-pane').classList.contains('hidden'),
      pickerShown: !document.getElementById('accusation-pick').classList.contains('hidden'),
      convicted: document.getElementById('verdict-convicted').textContent.trim(),
      epilogue: document.getElementById('verdict-epilogue').textContent.trim(),
      stage: window.__quest.stage,
      judged: window.__quest.judged,
      button: document.getElementById('restart-button').textContent.trim(),
    };
  }, ['sentry-sighting', 'wax-matches', 'lead-sold']);
  assert(/3 of 3/.test(said.count), 'three clues selected', said.count);
  assert(!said.dead, 'and the button came alive once the Clerk was named');
  assert(said.stage === 'full' && said.judged === true, 'the Clerk on the sighting, the wax and the lead: the full ending', `stage ${said.stage}`);
  assert(said.verdictShown && !said.pickerShown, 'the panel becomes the verdict');
  assert(/Ferrour hangs/.test(said.convicted), 'Master Robert Ferrour hangs', said.convicted.slice(0, 60));
  assert(/Wykes/.test(said.epilogue), "and the lead is found in Thomas Wykes's yard", said.epilogue.slice(0, 60));
  assert(said.button === 'The next morning', 'and the pane\'s button offers the second day (#537)', said.button);
  await snap('epilogue');

  /* --- THE MORNING AFTER (#533 to #537). Two beats: the button, and the
   * inspector. The full ending is the one being played, so the castle the
   * button opens is three men short — the Clerk hanged, the Steward in irons,
   * the merchant taken in the town — and what is asserted here is the world
   * that comes back, because this is the suite with a GPU under it. */
  await page.click('#restart-button');
  await wait(600);
  const morning = await page.evaluate(() => {
    const cast = window.__cast || [];
    return {
      stage: window.__quest.stage,
      day: window.__quest.day,
      watch: document.getElementById('quest-watch').textContent.trim(),
      objective: document.getElementById('quest-objective').textContent.trim(),
      paneShut: document.getElementById('accusation-overlay').classList.contains('hidden'),
      visible: cast.filter((n) => n.group.visible).map((n) => n.id).sort(),
      hidden: cast.filter((n) => !n.group.visible).map((n) => n.id).sort(),
      saved: JSON.parse(localStorage.getItem('castleConundrumSave_v1') || '{}').day,
      // And the stone (#539): the full ending lets Madoc out, so the cell's
      // bars are off and their box is out of the player's collider list.
      bars: window.__castle.objects.get('cell-bars')?.visible ?? null,
      barsBlock: window.__castle.colliders.filter((c) => c.id === 'cell-bars').length,
    };
  });
  assert(morning.stage === 'morning' && morning.day === 2, 'the button opens the second day', `${morning.stage}, day ${morning.day}`);
  assert(morning.paneShut, 'the epilogue pane is closed and the castle is walkable again');
  assert(morning.watch === 'Lauds', 'the HUD reads Lauds', String(morning.watch));
  assert(morning.hidden.join() === 'clerk,merchant,steward',
    'the Clerk hanged, the Steward is in irons and the merchant is taken: three bodies are gone from the castle',
    `hidden: ${morning.hidden.join(', ')}`);
  assert(morning.visible.includes('inspector'), "and the King's inspector is standing in it", morning.visible.join(', '));
  assert(morning.saved === 2, 'and the save on disk says day two, so a reload comes back here', String(morning.saved));
  assert(morning.bars === false && morning.barsBlock === 0,
    "the cell's bars are off and the player can walk in: Madoc the smith goes home at noon",
    `visible ${morning.bars}, ${morning.barsBlock} collider(s)`);
  await snap('the-morning-after');
  /* AND THE PLAYER WALKS INTO THE CELL. It is the one ground room of the
   * fourteen nobody has ever been able to stand in: the bars never opened, and
   * Madoc's whole clue was spoken through them. On the morning he is let out
   * they are off, and this is a real walk under real compositing, which is why
   * it is here and not in test/plan-vs-scene.mjs (#53). The HUD's own room line
   * is what says he got there; nothing here measures a distance. */
  {
    const cellTile = mystery.day2.schedule.prisoner.tile;
    const cellName = mystery.rooms.find((r) => r.id === 'cell').name;
    const got = await driveTo(page, [cellTile[0] * TILE, cellTile[1] * TILE],
      async () => (await page.evaluate(() => document.getElementById('hud-room').textContent.trim())) === cellName);
    const where = await page.evaluate(() => document.getElementById('hud-room').textContent.trim());
    assert(where === cellName, `the player walks into the cell and the HUD says so: "${where}"`,
      got ? '' : 'never got inside the bars that were taken off this morning');
    await snap('the-empty-cell');
  }

  // Walk to him in the King's Hall and have the conversation that ends it.
  // `converse` asks the engine where he is due at the watch the game is on,
  // which on day two is the day-two schedule, so no coordinate is written here.
  const heard = await converse('inspector', /Fraunceys/, "King's inspector");
  assert(heard && heard.lines.length >= 3, `the inspector says ${heard?.lines.length ?? 0} lines about the ending that was played`, heard?.lines?.[0]?.slice(0, 60));
  await wait(500);
  const signed = await page.evaluate(() => ({
    stage: window.__quest.stage,
    done: window.__quest.victory,
    shown: !document.getElementById('verdict-pane').classList.contains('hidden'),
    convicted: document.getElementById('verdict-convicted').textContent.trim(),
    button: document.getElementById('restart-button').textContent.trim(),
  }));
  assert(signed.stage === 'end' && signed.done === true, 'and the conversation with him is the end of the game', `stage ${signed.stage}`);
  assert(signed.shown && /Fraunceys signs/.test(signed.convicted), 'the pane comes back with the sheet signed', signed.convicted.slice(0, 60));
  assert(signed.button === 'Play Again', 'and the button is the old one again', signed.button);
  await snap('the-sheet-is-signed');

  // The button erases the save and starts the day again from nothing.
  await page.click('#restart-button');
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 90000 });
  const wiped = await page.evaluate(() => ({
    stored: localStorage.getItem('castleConundrumSave_v1'),
    stage: window.__quest?.stage,
    watch: window.__mystery?.watch,
    clues: window.__mystery?.state.clues.length,
  }));
  assert(wiped.stage === 'arrive' && wiped.watch === 'prime' && wiped.clues === 0 && !wiped.stored, 'Play Again starts a fresh day at Prime with an empty journal and no key in storage', JSON.stringify(wiped));
  await snap('a-fresh-day');

  // --- Nothing broke, and nothing reached for a CDN.
  assert(page.__errs.length === 0, 'no page/console errors', page.__errs.slice(0, 4).join(' | '));
  assert(page.__blocked.length === 0, 'no offsite requests', page.__blocked.slice(0, 4).join(' | '));
} catch (err) {
  failures++;
  console.log(`\n  ABORTED  ${err.message}`);
  await snap('aborted').catch(() => {});
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${failures ? `${failures} failure(s)` : 'all beats passed'} — shots in ${path.relative(HERE, OUT)}`);
process.exit(failures ? 1 : 0);
