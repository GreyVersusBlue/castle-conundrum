// castle-plan.js — where every piece of the castle stands, as one pure answer
// both the builder and the suite read.
//
// NO THREE, NO DOM, NO FILESYSTEM. It takes data/scene-config.json and a
// `boundsOf(modelPath)` the caller supplies, and hands back the finished
// placement: `{tile, pieces, colliders, surfaces, rooms, curtain, spawn}`.
// `castle-builder.js` loads each piece and applies the plan's transform. It
// computes no transform of its own, and the colliders the player walks into
// are the plan's objects, not boxes measured off a live scene.
//
// WHY THIS EXISTS. Until now `test/layout.mjs` re-implemented `tileToWorld`,
// `normalizeToTile`, `normalizeHeight` and `groundAndCenter` in Node and said
// so in its own header: "it cannot catch a change to that math — if
// `normalizeToTile` starts scaling off X again, this file scales off Z and
// agrees with itself." That is the #34 failure in its purest form, written
// down and shipped anyway because there was nowhere else to put the math. This
// is that somewhere. There is one implementation now and both sides call it.
//
// `boundsOf(modelPath)` RETURNS `{parts}`, NOT A BOX, and that is a deliberate
// departure from the phase's plan, which wrote it as "three's `Box3` of the
// loaded model". `Box3.setFromObject` unions per-mesh corner-transformed boxes
// rather than measuring vertices, so a placed model's runtime box is not a
// function of its whole-model box. Collapsing `parts` to one box and running
// `test/plan-vs-scene.mjs` puts brass_candleholders 0.129 m and
// GothicCabinet_01 0.113 m away from the castle the browser builds, against
// that file's 0.01 m tolerance. With `parts`, the worst piece in the castle is
// 0.0000 m out. See `test/gltf.mjs`'s `partsOf` for the Node half.

/** The walkability grid's cell size, in metres. */
export const GRID = 0.5;
/** A step this tall or shorter is walked up; anything taller is a wall. */
export const STEP_UP = 0.35;
/** The column a standing body needs clear above the floor it stands on. */
const HEAD_LOW = 0.3, HEAD_HIGH = 1.9;
/** player-controller.js's EYE_HEIGHT. Constant until Phase 5 gives the player a y. */
export const EYE_HEIGHT = 1.7;
/** Below this, a thing is scenery on the floor rather than something to walk into. */
const MIN_COLLIDER_HEIGHT = 0.3;
/** How much of a prop's footprint a surface must cover to be holding it up. */
const SURFACE_COVERAGE = 0.5;

/* ------------------------------------------------------------------ maths ---
 * Column-major 4x4, three's order and glTF's, so a node matrix out of
 * `partsOf` or off a live `Object3D` drops straight in.
 */
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

function applyPoint(m, x, y, z) {
  return {
    x: m[0] * x + m[4] * y + m[8] * z + m[12],
    y: m[1] * x + m[5] * y + m[9] * z + m[13],
    z: m[2] * x + m[6] * y + m[10] * z + m[14],
  };
}

/** T(position) * Ry(degrees) * S(scale), the only transform this castle uses. */
function placementMatrix({ position = [0, 0, 0], rotationY = 0, scale = 1 }) {
  const r = rotationY * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return [
    c * scale, 0, -s * scale, 0,
    0, scale, 0, 0,
    s * scale, 0, c * scale, 0,
    position[0], position[1], position[2], 1,
  ];
}

const EMPTY = () => ({
  min: { x: Infinity, y: Infinity, z: Infinity },
  max: { x: -Infinity, y: -Infinity, z: -Infinity },
});

function expand(box, p) {
  for (const k of ['x', 'y', 'z']) {
    if (p[k] < box.min[k]) box.min[k] = p[k];
    if (p[k] > box.max[k]) box.max[k] = p[k];
  }
  return box;
}

/**
 * The box three would report for `parts` placed by `matrix`: every part's own
 * local AABB, its eight corners through (matrix * part.matrix), unioned. This
 * is `Box3.setFromObject` written out, and it is the only place a box is made.
 */
function boxOfParts(parts, matrix = IDENTITY) {
  const box = EMPTY();
  for (const part of parts) {
    const m = multiply(matrix, part.matrix || IDENTITY);
    for (const x of [part.min.x, part.max.x])
      for (const y of [part.min.y, part.max.y])
        for (const z of [part.min.z, part.max.z])
          expand(box, applyPoint(m, x, y, z));
  }
  return box;
}

const boxHeight = (b) => b.max.y - b.min.y;
const covers2D = (b, x, z) => x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z;
/** Do two boxes share any area in plan? Touching faces do not count. */
const meets2D = (b, x0, z0, x1, z1) =>
  Math.min(b.max.x, x1) > Math.max(b.min.x, x0) &&
  Math.min(b.max.z, z1) > Math.max(b.min.z, z0);

/** A tile coordinate in world metres. The castle's one unit conversion. */
export function tileToWorld(tileSize, tx, tz) {
  return [tx * tileSize, 0, tz * tileSize];
}

/* ------------------------------------------------------------------- plan --- */

/**
 * `scaleBy` is the old `normalizeToTile` / `normalizeHeight` / `groundAndCenter`
 * split, moved out of the builder and named by the config's own model prefixes.
 * Depth for wall and tower pieces (every piece in the kit is authored 1 unit
 * deep, so depth is the one dimension a "half" piece does not halve); height for
 * columns; native scale for everything Poly Haven ships.
 */
function scaleRuleFor(model) {
  if (/^(tower|wall)/.test(model)) return 'depth';
  if (/^column/.test(model)) return 'height';
  return 'native';
}

function scaleFor(rule, tileSize, parts) {
  if (rule === 'native') return 1;
  const box = boxOfParts(parts);
  const size = rule === 'depth' ? box.max.z - box.min.z : box.max.y - box.min.y;
  return size > 0.0001 ? tileSize / size : 1;
}

/**
 * Place one model: scale by its rule, rotate about Y, ground it so its lowest
 * point sits at `lift`, and move it to its tile. Rotation about Y cannot change
 * a Y extent, so grounding before or after the rotation is the same number —
 * which is why the builder's old pre-rotation `position.y -= box.min.y` and this
 * post-rotation one agree.
 */
function place({ parts, tileSize, tile, rotationY = 0, scaleRule, lift = 0 }) {
  const scale = scaleFor(scaleRule, tileSize, parts);
  const [wx, , wz] = tileToWorld(tileSize, tile[0], tile[1]);
  const spun = boxOfParts(parts, placementMatrix({ rotationY, scale }));
  const position = [wx, lift - spun.min.y, wz];
  const transform = { position, rotationY, scale };
  return { transform, box: boxOfParts(parts, placementMatrix(transform)) };
}

/**
 * Height of the highest surface already holding `box` up, or 0 for the ground.
 * Lifted out of `castle-builder.js` unchanged, comment and all, because the
 * reasoning is the thing worth keeping:
 *
 * Overlap is a real 2D rectangle test, not a centre-point test: the brass
 * candleholders are a 1.08 m spread of three separate candlesticks, so a centre
 * hit says nothing about whether the outer two have anything beneath them. But
 * bare overlap is not enough either. The gothic statue stands on the floor 1.4 m
 * behind the hall table and its 1.56 m footprint clips the table's by 0.12 m, so
 * an any-overlap rule stands the statue on the table; the statue then becomes a
 * 2.29 m surface the candleholders clip by 4 cm, and they go on top of THAT. A
 * surface has to be under most of the object to be holding it up.
 */
function surfaceHeightUnder(stack, box) {
  const area = Math.max(1e-6, (box.max.x - box.min.x) * (box.max.z - box.min.z));
  let best = 0;
  for (const s of stack) {
    const ox = Math.min(s.max.x, box.max.x) - Math.max(s.min.x, box.min.x);
    const oz = Math.min(s.max.z, box.max.z) - Math.max(s.min.z, box.min.z);
    if (ox <= 0 || oz <= 0) continue;
    if ((ox * oz) / area < SURFACE_COVERAGE) continue;
    if (s.max.y > best) best = s.max.y;
  }
  return best;
}

/**
 * The gate leaf is built, not loaded, so its parts come from the numbers the
 * config already declares: a `width` rectangle up to `springline`, capped by a
 * semicircle of `archRadius`, extruded `thickness` and centred on the archway's
 * plane. `buildGateLeaf` in castle-builder.js draws exactly that shape, and
 * `test/assets.mjs` holds those numbers to the archway's measured opening.
 */
function gateLeafParts({ width, springline, archRadius, thickness }) {
  return [{
    min: { x: -width / 2, y: 0, z: -thickness / 2 },
    max: { x: width / 2, y: springline + archRadius, z: thickness / 2 },
    matrix: IDENTITY,
  }];
}

/**
 * The archway's stone, as three colliders instead of none.
 *
 * `gate-arch` carried `noCollide: true` with the comment "a doorway is meant to
 * have a hole in it", and the hole it got was the whole 4 m piece. The opening
 * is 1.9 m; the leaf fills 1.9 m; the two 1.05 m strips of stone either side of
 * it stopped nobody. A player could walk through the gatehouse wall beside the
 * shut gate, and `walkability().sealed()` said so the first time it ran. The
 * jambs and the lintel are the fix: the piece keeps its doorway and loses the
 * two gaps. The opening's size comes from `gateDoor.leaf`, which `assets.mjs`
 * already measures against the model's real hole.
 */
function archColliders(id, box, leaf) {
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const half = leaf.width / 2, apex = leaf.springline + leaf.archRadius;
  const across = (box.max.x - box.min.x) >= (box.max.z - box.min.z);
  const lo = across ? box.min.x : box.min.z, hi = across ? box.max.x : box.max.z;
  const c = across ? cx : cz;
  const slab = (from, to, yTop) => (across
    ? { min: { x: from, y: box.min.y, z: box.min.z }, max: { x: to, y: yTop, z: box.max.z } }
    : { min: { x: box.min.x, y: box.min.y, z: from }, max: { x: box.max.x, y: yTop, z: to } });
  const out = [];
  if (c - half > lo) out.push({ id: `${id}-jamb-a`, box: slab(lo, c - half, box.max.y) });
  if (hi > c + half) out.push({ id: `${id}-jamb-b`, box: slab(c + half, hi, box.max.y) });
  if (box.max.y > box.min.y + apex) {
    const lintel = slab(lo, hi, box.max.y);
    lintel.min.y = box.min.y + apex;
    out.push({ id: `${id}-lintel`, box: lintel });
  }
  return out;
}

/**
 * The whole castle, placed.
 *
 * @param {object} config  data/scene-config.json
 * @param {(modelPath: string) => {parts: Array}} boundsOf
 *        Every mesh under the model, as `{min, max, matrix}` in the model's own
 *        root space. `test/gltf.mjs`'s `partsOf` in Node; a traversal of the
 *        loaded `Object3D` in the browser. NOT a single box — see the header.
 */
export function makePlan(config, boundsOf) {
  const tileSize = config.tileSize;
  const kBase = config.kenneyBase, pBase = config.polyhavenBase;
  const pieces = [], colliders = [], surfaces = [];
  let seq = 0;

  const collide = (id, box) => {
    // paper-thin and ground-hugging decor never blocked movement and does not
    // start now: castle-builder.js's addCollider dropped anything under 0.3 m.
    if (boxHeight(box) < MIN_COLLIDER_HEIGHT) return;
    colliders.push({ id, box });
  };

  const addPiece = (p) => { pieces.push(p); return p; };

  /* --- the ground: one surface, no collider, the only thing at level 0 that
   *     is not stone. `config.ground.size` is the plane's full width. */
  const half = config.ground.size / 2;
  const groundBox = { min: { x: -half, y: 0, z: -half }, max: { x: half, y: 0, z: half } };
  surfaces.push({ id: 'ground', box: groundBox, top: 0, level: 0, slope: null });

  /* --- wall runs --- */
  for (const run of config.courtyard.wallRuns) {
    const parts = boundsOf(kBase + run.model).parts;
    for (let i = 0; i < run.count; i++) {
      const tile = [run.start[0] + run.step[0] * i, run.start[1] + run.step[1] * i];
      const { transform, box } = place({
        parts, tileSize, tile, rotationY: run.rotationY || 0, scaleRule: scaleRuleFor(run.model),
      });
      const id = `${run.model.replace(/\.glb$/, '')}-${seq++}`;
      addPiece({
        id, kind: 'wall', model: kBase + run.model, level: 0, curtain: !!run.curtain,
        label: run.comment ? run.comment.split(/[.,]/)[0] : run.model,
        transform, box,
      });
      collide(id, box);
    }
  }

  /* --- individual placements: towers, the gate archway, props, trees --- */
  for (const p of config.courtyard.placements) {
    const parts = boundsOf(kBase + p.model).parts;
    const { transform, box } = place({
      parts, tileSize, tile: p.tile, rotationY: p.rotationY || 0, scaleRule: scaleRuleFor(p.model),
    });
    const kind = p.id === 'gate-arch' ? 'gate-arch'
      : /^tower/.test(p.model) ? 'tower'
      : /^(wall|column)/.test(p.model) ? 'wall' : 'decor';
    const id = p.id || `${p.model.replace(/\.glb$/, '')}-${seq++}`;
    addPiece({
      id, kind, model: kBase + p.model, level: 0, curtain: !!p.curtain,
      label: p.comment || p.model, transform, box,
    });
    // `noCollide` means one thing everywhere: this piece contributes no
    // colliders. It used to be ignored on the archway, which made re-adding it
    // to `gate-arch` a silent no-op — a config flag that reads as "open the
    // gatehouse back up" and did nothing at all. What stops it being re-added
    // now is `walkability().sealed()`, not a special case here.
    if (!p.noCollide) {
      if (kind === 'gate-arch') for (const c of archColliders(id, box, config.gateDoor.leaf)) collide(c.id, c.box);
      else collide(id, box);
    }
  }

  /* --- the gate leaf, built rather than loaded ---
   * The hinge sits half a leaf-width off the archway centre, rotated with the
   * gate, so the leaf's world midpoint lands on the archway centre at any
   * rotationY. The un-rotated `gatePos.x - size.x / 2` was only that midpoint
   * for rotationY 0, and this gate is at 180: it put the whole leaf on the wrong
   * side of x 0, never crossing the archway at any point in the swing.
   */
  const g = config.gateDoor;
  const leafParts = gateLeafParts(g.leaf);
  const leafRot = g.rotationY || 0, rad = leafRot * Math.PI / 180;
  const leafSize = boxOfParts(leafParts);
  const width = leafSize.max.x - leafSize.min.x;
  const [gx, , gz] = tileToWorld(tileSize, g.tile[0], g.tile[1]);
  const pivot = [gx - (width / 2) * Math.cos(rad), 0, gz + (width / 2) * Math.sin(rad)];
  // the leaf hangs off the hinge along the pivot's local +X
  const leafTransform = {
    position: [pivot[0] + (width / 2) * Math.cos(rad), 0, pivot[2] - (width / 2) * Math.sin(rad)],
    rotationY: leafRot, scale: 1,
  };
  const leafBox = boxOfParts(leafParts, placementMatrix(leafTransform));
  addPiece({
    id: 'gate-door', kind: 'gate-leaf', built: 'gate-leaf', level: 0, curtain: false,
    label: 'the gate leaf',
    // The scene graph the builder makes: a pivot at the hinge, carrying the
    // rotation, with the leaf parented `offset` along the pivot's local +X.
    // `transform` is the same placement flattened to world space, which is what
    // `box` is measured from and what test/plan-vs-scene.mjs compares against.
    pivot: { position: pivot, rotationY: leafRot, offset: [width / 2, 0, 0] },
    transform: leafTransform, box: leafBox,
  });
  collide('gate-door', leafBox);

  /* --- interior props, in config order, each able to stand on any before it --- */
  const stack = [];
  for (const p of config.interiorProps) {
    const parts = boundsOf(pBase + p.model).parts;
    const flat = place({ parts, tileSize, tile: p.tile, rotationY: p.rotationY || 0, scaleRule: 'native' });
    const lift = surfaceHeightUnder(stack, flat.box) + (p.yOffset || 0);
    const { transform, box } = place({
      parts, tileSize, tile: p.tile, rotationY: p.rotationY || 0, scaleRule: 'native', lift,
    });
    const id = p.model.split('/')[0].replace(/_1k\.gltf$/, '');
    addPiece({ id, kind: 'prop', model: pBase + p.model, level: 0, curtain: false, label: id, transform, box });
    if (!p.noCollide) {
      collide(id, box);
      stack.push(box);
      surfaces.push({ id, box, top: box.max.y, level: 0, slope: null });
    }
  }

  /* --- the curtain: the outer face of everything the config calls curtain --- */
  const curtain = EMPTY();
  for (const piece of pieces) if (piece.curtain) { expand(curtain, piece.box.min); expand(curtain, piece.box.max); }

  const rooms = (config.rooms || []).map((r) => ({
    id: r.id, level: r.level || 0, ward: r.ward || null,
    bounds: {
      min: { x: r.bounds.min[0], z: r.bounds.min[1] },
      max: { x: r.bounds.max[0], z: r.bounds.max[1] },
    },
  }));

  return {
    tile: tileSize,
    spawn: { position: config.spawn.position.slice(), lookAt: config.spawn.lookAt.slice(), level: 0 },
    pieces, colliders, surfaces, rooms, curtain,
  };
}

/* ----------------------------------------------------------- walkability ---
 *
 * A 0.5 m grid over the plan. A cell centre at height `h` is standable when a
 * surface covers it at `h` and no collider crosses the column above it between
 * `h + 0.3` and `h + 1.9` — head height for a body standing on that floor.
 * Cells connect when adjacent and no more than 0.35 m apart in height, or when
 * both sit on the same sloped surface, which is how a ramp steeper than a step
 * still gets walked up. Flood fill from the spawn.
 *
 * WHAT IT SAMPLES IS A POINT. The grid asks whether a body's CENTRE can stand
 * somewhere, not whether a 0.45 m radius fits, so a crack narrower than the
 * player can pass through still reads as connected if a cell centre lands in
 * it. That is deliberate at this size: the failures this exists to catch are a
 * missing wall piece and an unreachable room, both metres wide. A clearance
 * check is a different tool and is not this one.
 *
 * IT ALSO KNOWS ONLY WHAT THE PLAN KNOWS. `scene-setup.js` builds the three
 * brazier stands at runtime and registers them through `castle.addCollider`, so
 * they are in the game's collider list and not in this grid. They are 0.42 m
 * posts standing in open ground; nothing this answers turns on them.
 */
export function walkability(plan, { grid = GRID, stepUp = STEP_UP } = {}) {
  const half = grid / 2;
  const bounds = EMPTY();
  for (const s of plan.surfaces) { expand(bounds, s.box.min); expand(bounds, s.box.max); }

  const i0 = Math.floor(bounds.min.x / grid), i1 = Math.ceil(bounds.max.x / grid);
  const j0 = Math.floor(bounds.min.z / grid), j1 = Math.ceil(bounds.max.z / grid);
  const cx = (i) => i * grid + half, cz = (j) => j * grid + half;

  /* Heights per surface at a point. A flat surface answers `top`; a ramp
   * interpolates between `slope.from` and `slope.to`, each `[x, z, y]`. */
  const heightOn = (s, x, z) => {
    if (!s.slope) return s.top;
    const [ax, az, ay] = s.slope.from, [bx, bz, by] = s.slope.to;
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz;
    if (len2 < 1e-9) return ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
    return ay + (by - ay) * t;
  };

  /* A COLLIDER BLOCKS A WHOLE CELL, NOT A POINT IN IT, and that is the one
   * place this grid is deliberately conservative. The first run of this file
   * flooded the entire 140 m ground plane through a shut gate: the leaf is
   * 0.16 m thick and no 0.5 m cell centre lands inside it, so a centre test
   * stepped over the door the way it would step over any wall thinner than the
   * grid. Overlapping the cell's square instead also happens to be the truer
   * model of a body — the player is 0.9 m across, wider than a cell, so a cell
   * with stone in any corner of it is not somewhere to stand. */
  const blocked = (i, j, h) => {
    const x0 = i * grid, z0 = j * grid, x1 = x0 + grid, z1 = z0 + grid;
    return plan.colliders.some(c =>
      meets2D(c.box, x0, z0, x1, z1) && c.box.min.y < h + HEAD_HIGH && c.box.max.y > h + HEAD_LOW);
  };

  const key = (i, j, h) => `${i},${j},${h.toFixed(3)}`;
  const cells = new Map();
  const at = (i, j) => {
    const k = `${i},${j}`;
    if (cells.has(k)) return cells.get(k);
    const x = cx(i), z = cz(j);
    const found = [];
    for (const s of plan.surfaces) {
      if (!covers2D(s.box, x, z)) continue;
      const h = heightOn(s, x, z);
      if (found.some(f => Math.abs(f.h - h) < 1e-6)) continue;
      if (blocked(i, j, h)) continue;
      found.push({ h, surface: s.id, level: s.level });
    }
    cells.set(k, found);
    return found;
  };

  /* --- flood fill from the spawn --- */
  const si = Math.floor(plan.spawn.position[0] / grid), sj = Math.floor(plan.spawn.position[2] / grid);
  // config.spawn.position is an EYE position, so the floor it stands on is a
  // head-height below it. Ties go to the nearest candidate rather than to 0, so
  // a spawn written on an upper storey starts the fill on that storey.
  const floor = plan.spawn.position[1] - EYE_HEIGHT;
  const start = at(si, sj)
    .slice()
    .sort((a, b) => Math.abs(a.h - floor) - Math.abs(b.h - floor))[0];

  const outsideCurtain = (i, j) =>
    cx(i) < plan.curtain.min.x || cx(i) > plan.curtain.max.x ||
    cz(j) < plan.curtain.min.z || cz(j) > plan.curtain.max.z;

  const reached = new Map(); // key -> {i, j, h, surface, level}
  /* Where the fill crossed the curtain, recorded as it happens.
   * Picking "the leak" out of the finished set afterwards does not work: a
   * breach in the north wall floods the whole 140 m ground plane, and any
   * after-the-fact sort — nearest the origin, nearest the curtain, nearest the
   * spawn — then picks one of seventy thousand cells that has nothing to do
   * with the hole. The first version of this message pointed at (-14.25, 0.25)
   * for a hole at (0, -14) and reported "9999 cells" because that was the
   * limit it had asked for. A cell reached FROM an inside cell is the hole. */
  const breaches = [];
  if (start) {
    const queue = [{ i: si, j: sj, ...start }];
    reached.set(key(si, sj, start.h), queue[0]);
    while (queue.length) {
      const cur = queue.pop();
      const curOut = outsideCurtain(cur.i, cur.j);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = cur.i + di, nj = cur.j + dj;
        if (ni < i0 || ni > i1 || nj < j0 || nj > j1) continue;
        for (const cand of at(ni, nj)) {
          const sameRamp = cand.surface === cur.surface &&
            plan.surfaces.find(s => s.id === cand.surface)?.slope;
          if (!sameRamp && Math.abs(cand.h - cur.h) > stepUp) continue;
          const k = key(ni, nj, cand.h);
          if (reached.has(k)) continue;
          const cell = { i: ni, j: nj, ...cand };
          if (!curOut && outsideCurtain(ni, nj)) breaches.push(cell);
          reached.set(k, cell);
          queue.push(cell);
        }
      }
    }
  }

  const list = [...reached.values()];
  const outside = list.filter(c => outsideCurtain(c.i, c.j));

  return {
    grid,
    /** Every cell the spawn can reach, as `{i, j, h, surface, level}`. */
    cells: list,
    started: !!start,
    /** Can a body standing at (x, z) on `level` be walked to from the spawn? */
    reachable(x, z, level = 0) {
      const i = Math.floor(x / grid), j = Math.floor(z / grid);
      return list.some(c => c.i === i && c.j === j && c.level === level);
    },
    /** Each room in the plan, with whether anything in it can be reached. */
    rooms() {
      return plan.rooms.map((r) => {
        const inside = list.filter(c =>
          c.level === r.level &&
          cx(c.i) >= r.bounds.min.x && cx(c.i) <= r.bounds.max.x &&
          cz(c.j) >= r.bounds.min.z && cz(c.j) <= r.bounds.max.z);
        return { ...r, cells: inside.length, reachable: inside.length > 0 };
      });
    },
    /** True when nothing reachable from the spawn lies outside the curtain. */
    sealed() { return outside.length === 0; },
    /** How many reachable cells are outside the curtain. */
    get leaked() { return outside.length; },
    /** The cells the fill stepped through the curtain at — the hole itself. */
    breaches(limit = 3) {
      return breaches
        .slice(0, limit)
        .map(c => ({ x: +cx(c.i).toFixed(2), z: +cz(c.j).toFixed(2), h: c.h, level: c.level }));
    },
  };
}
