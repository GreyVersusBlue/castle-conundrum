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
  // A number is a scale, not a rule. Phase 3's battlements are the only pieces
  // placed that way: battlement.glb is authored 1.0 x 0.4 x 0.3, and none of the
  // three rules gives it the 4 m merlon run a 4 m tile wants — 'depth' would
  // scale it off its 0.3 depth and hand back a 13 m block.
  if (typeof rule === 'number') return rule;
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
 * two gaps. The opening's size comes from each gate's `leaf`, which `assets.mjs`
 * already measures against the model's real hole.
 */
function archColliders(id, box, leaf, rotationY = 180) {
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const half = leaf.width / 2, apex = leaf.springline + leaf.archRadius;
  // WHICH WAY THE JAMBS RUN IS THE GATE'S ROTATION, NOT THE BOX'S SHAPE. This
  // read `(box.max.x - box.min.x) >= (box.max.z - box.min.z)` while there was one
  // gate in the castle and it sat in a wall running east-west. The archway is a
  // 4 x 4 x 4 m cube at every rotation, so that comparison is `4 >= 4` — true for
  // every gate in the castle, including the three Phase 3 turns 90 degrees into
  // north-south walls. It would have slabbed their jambs across the passage and
  // left the doorway's real sides open, which is #426's bug again with the
  // opposite sign. The leaf's width runs along x at 0 and 180 and along z at 90
  // and 270, and the jambs stand at its ends.
  const across = ((rotationY % 180) + 180) % 180 === 0;
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

/* ------------------------------------------------------- built stone (v2) ---
 *
 * Phase 3 stopped building the curtain out of kit pieces. `wall.glb` is a 64 px
 * pixel-art cube; nine runs of it made a 7x7 courtyard, and Conwy's plan is 16
 * tiles by 9 with eight drums and a cross-wall through it. What carries the
 * castle now is built geometry with a Poly Haven map on it (#411 reversed the
 * round-1 "leave the walls stylised" call), and built geometry is the one thing
 * this file can describe exactly: a run IS its box, so the plan's box and the
 * BoxGeometry the builder emits are the same eight numbers rather than two
 * measurements that have to agree.
 */

/** Which axis a run travels, from its own endpoints, or its declared `axis`. */
function runAxis(run) {
  const dx = run.from[0] !== run.to[0], dz = run.from[1] !== run.to[1];
  if (run.axis) return run.axis;
  if (dx && dz) throw new Error(`[castle-plan] wall run "${run.id}" is diagonal; every run in this castle is axis-aligned`);
  if (dx) return 'x';
  if (dz) return 'z';
  throw new Error(`[castle-plan] wall run "${run.id}" starts and ends on the same tile and declares no "axis"`);
}

/**
 * A run's world box. It spans its `from` and `to` tiles WHOLE — world extent
 * [from*tile - tile/2, to*tile + tile/2] — so a run written `from [-8,-4] to
 * [-6,-4]` covers the three `##` tiles the map draws and meets its neighbours at
 * the tile edge rather than at their centres. Across the run it is `thickness`
 * metres, centred on the perpendicular tile's centre.
 */
function runBox(run, tileSize) {
  const axis = runAxis(run);
  const half = tileSize / 2, t = run.thickness / 2;
  const along = axis === 'x' ? 0 : 1;
  const lo = Math.min(run.from[along], run.to[along]) * tileSize - half;
  const hi = Math.max(run.from[along], run.to[along]) * tileSize + half;
  const cross = run.from[axis === 'x' ? 1 : 0] * tileSize;
  return axis === 'x'
    ? { min: { x: lo, y: 0, z: cross - t }, max: { x: hi, y: run.height, z: cross + t } }
    : { min: { x: cross - t, y: 0, z: lo }, max: { x: cross + t, y: run.height, z: hi } };
}

/**
 * Which way a run faces, as three's cylinder angle (0 is +z, 90 is +x), so the
 * battlement rotation below is one formula for a wall and for a drum. Read off
 * the run's own position: this castle is a rectangle about the origin, so a run
 * north of it faces north. Not a config field, because a field here would be a
 * second copy of the geometry that could disagree with it.
 */
function outwardTheta(run, tileSize) {
  const axis = runAxis(run);
  const cross = run.from[axis === 'x' ? 1 : 0] * tileSize;
  if (axis === 'x') return cross < 0 ? 180 : 0;
  return cross < 0 ? 270 : 90;
}

/** three.js CylinderGeometry's own vertex ring, so a plan box is not an estimate. */
const ringPoint = (cx, cz, radius, thetaDeg) => {
  const t = thetaDeg * Math.PI / 180;
  return { x: cx + radius * Math.sin(t), z: cz + radius * Math.cos(t) };
};

/**
 * A drum tower: a `segments`-sided solid cylinder of `material`, and the four
 * inner-ward drums a turret on top.
 *
 * THE DISC IS A POLYGON IN BOTH HALVES. The builder emits
 * `CylinderGeometry(r, r, h, segments)`, whose vertices sit at `r*sin(theta)`,
 * `r*cos(theta)` for theta stepped round the circle; the colliders below are the
 * boxes over the centre and each consecutive pair of those same vertices. So the
 * stone the player walks into and the stone drawn on the screen are the same
 * twenty-four-sided figure, not a circle approximated twice. A sector box never
 * reaches more than the polygon's own sagitta past the circle — 0.034 m at
 * radius 4 with 24 sides.
 *
 * WHY SOLID, AND WHY THE EIGHT TOWER ROOMS ARE PHASE 4'S. A hollow drum with a
 * doorway in its ring does not produce a tower you can walk into, and the drum
 * is not what stops you. The curtain is a whole tile thick, so at a corner the
 * two runs meeting there — say the west run at x -38..-34 and the north run at
 * z -18..-14 — overlap in neither axis: they touch at the single point
 * (-34, -14). The ward is the quadrant south-east of that point and the drum is
 * the quadrant north-west of it, and the two meet at a pinch of exactly zero
 * width. No radius up to the map's 4 m opens it, and the six towers that are not
 * mid-run are all built that way. What opens it is a doorway cut THROUGH the
 * adjacent run, which is Phase 4's "doorways as gaps the plan's walkability
 * sees, and door frames from wall-door.glb where a doorway needs a lintel", and
 * Phase 4's exit is the one that reads "fourteen rooms reachable". So this phase
 * ships the six rooms that are open ground inside the wards and leaves the eight
 * tower interiors as solid stone for the phase that gives them doors (#433).
 */
function drumParts(drum, tileSize) {
  const [cx, , cz] = tileToWorld(tileSize, drum.tile[0], drum.tile[1]);
  const r = drum.radius;
  const segments = drum.segments || 24;
  const step = 360 / segments;

  const box = EMPTY();
  const colliders = [];
  for (let i = 0; i < segments; i++) {
    const a = ringPoint(cx, cz, r, i * step), b = ringPoint(cx, cz, r, (i + 1) * step);
    const seg = EMPTY();
    for (const pt of [{ x: cx, z: cz }, a, b]) {
      expand(seg, { x: pt.x, y: 0, z: pt.z });
      expand(seg, { x: pt.x, y: drum.height, z: pt.z });
    }
    colliders.push({ id: `${drum.id}-sector-${i}`, box: seg });
    expand(box, seg.min); expand(box, seg.max);
  }

  // The turret is narrower than the drum, so it cannot reach past the disc's box
  // in plan; it is unioned anyway rather than assumed, because a later phase that
  // widens one would otherwise leave the plan box behind and only
  // test/plan-vs-scene.mjs would say so.
  let turret = null;
  if (drum.turret) {
    turret = { radius: drum.turret.radius, height: drum.turret.height, base: drum.height, cx, cz, segments };
    for (let i = 0; i <= segments; i++) {
      const pt = ringPoint(cx, cz, drum.turret.radius, i * step);
      expand(box, { x: pt.x, y: drum.height, z: pt.z });
      expand(box, { x: pt.x, y: drum.height + drum.turret.height, z: pt.z });
    }
  }

  return { cx, cz, radius: r, segments, box, colliders, turret };
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
export function makePlan(config, boundsOf, { closed = [] } = {}) {
  const tileSize = config.tileSize;
  const kBase = config.kenneyBase, pBase = config.polyhavenBase;
  const forceClosed = new Set(closed);
  const pieces = [], colliders = [], surfaces = [];
  let seq = 0;

  const collide = (id, box) => {
    // paper-thin and ground-hugging decor never blocked movement and does not
    // start now: castle-builder.js's addCollider dropped anything under 0.3 m.
    if (boxHeight(box) < MIN_COLLIDER_HEIGHT) return;
    colliders.push({ id, box });
  };

  const addPiece = (p) => { pieces.push(p); return p; };

  /* --- the curtain, the cross-wall and the two barbicans, as built boxes --- */
  const battle = config.battlements;
  const merlons = []; // { tile: [worldX, worldZ] as metres, rotationY, y }
  const merlonRun = (from, to, y, rotationY) => {
    // one per `spacing` metres, centred in the run so a 12 m run gets three
    // whole merlons rather than two and a stub at one end
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const n = Math.max(1, Math.round(len / battle.spacing));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      merlons.push({ at: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t], y, rotationY });
    }
  };

  for (const run of config.walls) {
    const box = runBox(run, tileSize);
    addPiece({
      id: run.id, kind: 'wall', built: 'run', level: run.level || 0, curtain: !!run.curtain,
      material: run.material, label: run.comment ? run.comment.split(/[.,]/)[0] : run.id,
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box, boxes: [box],
    });
    collide(run.id, box);

    // battlements ride the run's outer edge, along its long axis, at its top
    const theta = outwardTheta(run, tileSize);
    const axis = runAxis(run);
    const cross = run.from[axis === 'x' ? 1 : 0] * tileSize;
    const lo = axis === 'x' ? box.min.x : box.min.z, hi = axis === 'x' ? box.max.x : box.max.z;
    const from = axis === 'x' ? [lo, cross] : [cross, lo];
    const to = axis === 'x' ? [hi, cross] : [cross, hi];
    merlonRun(from, to, run.height, theta + 180);
  }

  /* --- eight drums --- */
  const drumShapes = [];
  for (const drum of config.drums) {
    const d = drumParts(drum, tileSize);
    drumShapes.push({ drum, ...d });
    addPiece({
      id: drum.id, kind: 'tower', built: 'drum', level: drum.level || 0, curtain: !!drum.curtain,
      material: drum.material, label: drum.comment ? drum.comment.split(/[.,]/)[0] : drum.id,
      drum: {
        cx: d.cx, cz: d.cz, radius: d.radius, height: drum.height,
        segments: d.segments, turret: d.turret,
      },
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box: d.box,
      // The twenty-four sectors, not the 8 x 8 m square `box` bounds them with.
      // A drum's corners are ward floor, and a check that reads `box` calls a
      // chest standing in that floor "inside South-west Tower".
      boxes: d.colliders.map((c) => c.box),
    });
    for (const c of d.colliders) collide(c.id, c.box);

    // merlons round the drum's rim, one every 360/perDrum degrees
    for (let i = 0; i < battle.perDrum; i++) {
      const th = (i / battle.perDrum) * 360;
      const at = ringPoint(d.cx, d.cz, d.radius, th);
      merlons.push({ at: [at.x, at.z], y: drum.height, rotationY: th + 180 });
    }
  }

  const merlonParts = boundsOf(kBase + battle.model).parts;
  for (const m of merlons) {
    const { transform, box } = place({
      parts: merlonParts, tileSize, tile: [m.at[0] / tileSize, m.at[1] / tileSize],
      rotationY: m.rotationY, scaleRule: battle.scale, lift: m.y,
    });
    const id = `merlon-${seq++}`;
    addPiece({
      id, kind: 'decor', model: kBase + battle.model, level: 0, curtain: false,
      label: 'battlement', transform, box,
    });
    // no collider: Phase 5 puts the wall walk under these, and until then the
    // only body in the castle is on the ground 8 m below them.
  }

  /* --- three gates: an archway, and a leaf hung in it ---
   * The west gate stands open (the clerk was let in through it and the spawn is
   * behind it in the barbican), the east gate is shut until the riddle quest
   * opens it onto the garden, the porter's gate is open all day. `closed` forces
   * any of them shut, which is how test/layout.mjs floods the castle with the
   * cross-wall's one crossing sealed.
   */
  const gates = [];
  for (const g of config.gates) {
    const archParts = boundsOf(kBase + g.archModel).parts;
    const { transform, box } = place({
      parts: archParts, tileSize, tile: g.tile, rotationY: g.rotationY || 0,
      scaleRule: scaleRuleFor(g.archModel),
    });
    const archId = `${g.id}-arch`;
    addPiece({
      id: archId, kind: 'gate-arch', model: kBase + g.archModel, level: 0, curtain: !!g.curtain,
      label: g.comment ? g.comment.split(/[.,]/)[0] : archId, transform, box,
      boxes: archColliders(archId, box, g.leaf, g.rotationY || 0).map((c) => c.box),
    });
    for (const c of archColliders(archId, box, g.leaf, g.rotationY || 0)) collide(c.id, c.box);

    /* The hinge sits half a leaf-width off the archway centre, rotated with the
     * gate, so the leaf's world midpoint lands on the archway centre at any
     * rotationY. The un-rotated `gatePos.x - size.x / 2` was only that midpoint
     * for rotationY 0, and the one gate this castle used to have is at 180.
     */
    const leafParts = gateLeafParts(g.leaf);
    const shut = g.rotationY || 0;
    const isClosed = forceClosed.has(g.id) || !!g.closed;
    const leafRot = shut + (isClosed ? 0 : (g.openDegrees || 0));
    const shutRad = shut * Math.PI / 180, leafRad = leafRot * Math.PI / 180;
    const leafSize = boxOfParts(leafParts);
    const width = leafSize.max.x - leafSize.min.x;
    const [gx, , gz] = tileToWorld(tileSize, g.tile[0], g.tile[1]);
    const pivot = [gx - (width / 2) * Math.cos(shutRad), 0, gz + (width / 2) * Math.sin(shutRad)];
    // the leaf hangs off the hinge along the pivot's local +X
    const leafTransform = {
      position: [pivot[0] + (width / 2) * Math.cos(leafRad), 0, pivot[2] - (width / 2) * Math.sin(leafRad)],
      rotationY: leafRot, scale: 1,
    };
    const leafBox = boxOfParts(leafParts, placementMatrix(leafTransform));
    addPiece({
      id: g.id, kind: 'gate-leaf', built: 'gate-leaf', level: 0, curtain: false,
      label: `${g.id} leaf`, material: g.material,
      // The scene graph the builder makes: a pivot at the hinge, carrying the
      // rotation, with the leaf parented `offset` along the pivot's local +X.
      // `transform` is the same placement flattened to world space, which is what
      // `box` is measured from and what test/plan-vs-scene.mjs compares against.
      pivot: { position: pivot, rotationY: leafRot, offset: [width / 2, 0, 0] },
      transform: leafTransform, box: leafBox,
    });
    // An open leaf is against the jamb, not across the doorway: it blocks
    // nothing the arch's own jambs do not already block.
    if (isClosed) collide(g.id, leafBox);
    gates.push({
      id: g.id, quest: g.quest || null, closed: isClosed,
      shutAngle: shut, openAngle: shut + (g.openDegrees || 0),
    });
  }

  /* --- individual placements: loose kit decor --- */
  for (const p of config.courtyard.placements) {
    const parts = boundsOf(kBase + p.model).parts;
    const { transform, box } = place({
      parts, tileSize, tile: p.tile, rotationY: p.rotationY || 0, scaleRule: scaleRuleFor(p.model),
    });
    const kind = /^tower/.test(p.model) ? 'tower'
      : /^(wall|column)/.test(p.model) ? 'wall' : 'decor';
    const id = p.id || `${p.model.replace(/\.glb$/, '')}-${seq++}`;
    addPiece({
      id, kind, model: kBase + p.model, level: 0, curtain: !!p.curtain,
      label: p.comment || p.model, transform, box, boxes: p.noCollide ? [] : [box],
    });
    // `noCollide` means one thing everywhere: this piece contributes no colliders.
    if (!p.noCollide) collide(id, box);
  }

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

  /* --- the ground, LAST, because its size is the curtain's ---
   * "The 140 m ground plane shrinks to the curtain's footprint plus 2 m; outside
   * it is fog." Worked out from the placed stone rather than written down, so a
   * phase that moves a wall moves the ground under it and cannot leave the old
   * number behind. The base is pavers; the outer ward's grassy cobbles lie on it
   * at the same y, which walkability's own cell dedupe reads as one floor.
   */
  const gm = config.ground.base.margin;
  const baseBox = {
    min: { x: curtain.min.x - gm, y: 0, z: curtain.min.z - gm },
    max: { x: curtain.max.x + gm, y: 0, z: curtain.max.z + gm },
  };
  const grounds = [{ id: 'ground', material: config.ground.base.material, box: baseBox,
                     fallbackColor: config.ground.base.fallbackColor, patch: false }];
  for (const patch of config.ground.patches || []) {
    const half = tileSize / 2;
    grounds.push({
      id: patch.id, material: patch.material, patch: true, fallbackColor: patch.fallbackColor,
      box: {
        min: { x: patch.tiles.min[0] * tileSize - half, y: 0, z: patch.tiles.min[1] * tileSize - half },
        max: { x: patch.tiles.max[0] * tileSize + half, y: 0, z: patch.tiles.max[1] * tileSize + half },
      },
    });
  }
  for (const g of grounds) {
    addPiece({
      id: g.id, kind: 'ground', built: 'ground', level: 0, curtain: false,
      material: g.material, label: g.id, patch: g.patch,
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box: g.box,
    });
    surfaces.push({ id: g.id, box: g.box, top: 0, level: 0, slope: null });
  }

  const rooms = (config.rooms || []).map((r) => {
    const half = tileSize / 2;
    const b = r.tiles
      ? { min: { x: r.tiles.min[0] * tileSize - half, z: r.tiles.min[1] * tileSize - half },
          max: { x: r.tiles.max[0] * tileSize + half, z: r.tiles.max[1] * tileSize + half } }
      : { min: { x: r.bounds.min[0], z: r.bounds.min[1] },
          max: { x: r.bounds.max[0], z: r.bounds.max[1] } };
    return { id: r.id, level: r.level || 0, ward: r.ward || null, bounds: b };
  });

  return {
    tile: tileSize,
    spawn: { position: config.spawn.position.slice(), lookAt: config.spawn.lookAt.slice(), level: 0 },
    pieces, colliders, surfaces, rooms, curtain, gates, grounds, drums: drumShapes,
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
