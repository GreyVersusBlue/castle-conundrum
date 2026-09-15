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
import { attachSceneProbe, waitForProbe, walkTo as driveTo, wait, textContent } from './drive.mjs';
import fs from 'node:fs';
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

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
let shotN = 0;

const ok = (label, detail = '') => console.log(`  ok    ${label}${detail ? '  ' + detail : ''}`);
const bad = (label, detail = '') => { failures++; console.log(`  FAIL  ${label}${detail ? '  ' + detail : ''}`); };
const assert = (cond, label, detail = '') => (cond ? ok(label, detail) : bad(label, detail));

const server = await serveDev(PORT);
const THREE_URL = await threeUrl(BASE);
const browser = await launch({ headed: true });
const page = await prepPage(browser, { width: 1200, height: 800, dsf: 1 });

const snap = async (label) => {
  await page.screenshot({ path: path.join(OUT, `${String(++shotN).padStart(2, '0')}-${label}.png`) });
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
const walkTo = (target, who) =>
  driveTo(page, target, async () => (await state()).prompt?.includes(who));

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
  assert(rigs.count === 12, 'twelve rigged NPC bodies in the scene', `found ${rigs.count}`);
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

  // --- Start. A real trusted click is what pointer lock requires.
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
  const goTo = async (target, label, tol = 0.7, maxBursts = 30) => {
    const r = await driveTo(page, target, async (dist) => dist < tol, { maxBursts, nearAt: 2.5, longMs: 250, shortMs: 90 });
    assert(!!r, `reached ${label}`, r ? `${r.dist}m after ${r.bursts} bursts, y ${await heightAt()}` : `never got within ${tol} m, y ${await heightAt()}`);
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
    // Down the Bakehouse Tower: its upper flight's top is at the east end of its
    // well in the south half, its lower flight's top at the north end of the
    // tower's east half, and the door out is on the inner-ward side.
    const legs4 = [
      [[-0.5, 14.6], 'the Bakehouse Tower\'s top room'],
      [[1.75, 16.75], 'the top of the Bakehouse upper flight'],
      [[-1.8, 16.75], 'the foot of the upper flight'],
      [[-2.25, 16.75], 'the first floor, west crescent'],
      [[-1, 15], 'the first floor, north-west'],
      [[0.75, 14.3], 'the top of the lower flight'],
      [[0.75, 17.6], 'the foot of the lower flight'],
      [[0.25, 18.2], 'the bakehouse, south crescent'],
      [[2.3, 16.2], 'the bakehouse, east of the flight'],
      [[4.2, 12.6], 'the inner ward, out of the bakehouse door'],
    ];
    if (ok) for (const [t, label] of legs4) { if (!(ok = await goTo(t, label))) break; }
    if (ok) assert(near(await heightAt(), 1.7), 'the camera is back at ground eye height in the inner ward', `y ${await heightAt()}`);
    await snap('inner-ward-from-the-walk');
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
    const walked = await walkTo(due.at, nameRe.source.replace(/\W/g, ''));
    assert(!!walked, `walked to the ${label} in ${due.room}`, walked ? `${walked.dist}m after ${walked.bursts} bursts` : 'never got in range');
    if (!walked) return null;
    await page.keyboard.press('KeyE');
    await wait(400);
    let s2 = await state();
    if (!s2.dialogueOpen) { bad(`${label}: E opened no dialogue`, JSON.stringify(s2.prompt)); return null; }
    assert(nameRe.test(s2.dialogueName || ''), `E opened the ${label}'s dialogue`, s2.dialogueName);
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
    const walked = await walkTo(at, 'examine');
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
  assert(panel.names.length === 13 && panel.names.includes('nobody'), 'twelve names and a fall', `${panel.names.length}: ${panel.names.join(', ')}`);
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
      done: window.__quest.victory,
    };
  }, ['sentry-sighting', 'wax-matches', 'lead-sold']);
  assert(/3 of 3/.test(said.count), 'three clues selected', said.count);
  assert(!said.dead, 'and the button came alive once the Clerk was named');
  assert(said.stage === 'full' && said.done === true, 'the Clerk on the sighting, the wax and the lead: the full ending', `stage ${said.stage}`);
  assert(said.verdictShown && !said.pickerShown, 'the panel becomes the verdict');
  assert(/Ferrour hangs/.test(said.convicted), 'Master Robert Ferrour hangs', said.convicted.slice(0, 60));
  assert(/Wykes/.test(said.epilogue), "and the lead is found in Thomas Wykes's yard", said.epilogue.slice(0, 60));
  await snap('epilogue');

  // The button erases the save and starts the day again from nothing.
  await page.click('#restart-button');
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 90000 });
  const wiped = await page.evaluate(() => ({
    stored: localStorage.getItem('castleConundrumSave_v1'),
    stage: window.__quest?.stage,
    watch: window.__mystery?.watch,
    clues: window.__mystery?.state.clues.length,
  }));
  assert(wiped.stage === 'arrive' && wiped.watch === 'prime' && wiped.clues === 0, 'Play Again starts a fresh day at Prime with an empty journal', JSON.stringify(wiped));
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
