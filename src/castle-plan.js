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
 * The cell's bars, as the one box they fill: a plate `width` by `height` by
 * `thickness`, centred on x and grounded, exactly like the gate leaf's shape.
 * `castle-builder.js` draws the uprights and the two rails inside it.
 */
function barsParts({ width, height, thickness }) {
  return [{
    min: { x: -width / 2, y: 0, z: -thickness / 2 },
    max: { x: width / 2, y: height, z: thickness / 2 },
    matrix: IDENTITY,
  }];
}

/**
 * Hang a leaf in an opening: the hinge sits half a leaf-width off the opening's
 * centre, rotated with it, so the leaf's world midpoint lands on the centre at
 * any angle. The un-rotated `centre.x - width / 2` was only that midpoint at
 * rotationY 0, and not one door in this castle is at 0.
 *
 * Shared by config.gates and by the doors in the drum towers' rings, which is
 * the reason it is a function: a door in a ring is hung on the chord of its
 * doorway at the ring's own angle, and that is the same arithmetic as a gate in
 * a wall.
 */
function hangLeaf(parts, centre, shutAngle, leafAngle) {
  const size = boxOfParts(parts);
  const width = size.max.x - size.min.x;
  const sr = shutAngle * Math.PI / 180, lr = leafAngle * Math.PI / 180;
  const pivot = [centre[0] - (width / 2) * Math.cos(sr), 0, centre[1] + (width / 2) * Math.sin(sr)];
  const transform = {
    position: [pivot[0] + (width / 2) * Math.cos(lr), 0, pivot[2] - (width / 2) * Math.sin(lr)],
    rotationY: leafAngle, scale: 1,
  };
  return {
    width,
    pivot: { position: pivot, rotationY: leafAngle, offset: [width / 2, 0, 0] },
    transform,
    box: boxOfParts(parts, placementMatrix(transform)),
  };
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
  // `base` lifts a run off the ground. The curtain and every room wall start at
  // 0; the mason's lodge roof is a run at base 4, and Phase 5's floor slabs are
  // the same thing at 3.8.
  const y0 = run.base || 0, y1 = y0 + run.height;
  return axis === 'x'
    ? { min: { x: lo, y: y0, z: cross - t }, max: { x: hi, y: y1, z: cross + t } }
    : { min: { x: cross - t, y: y0, z: lo }, max: { x: cross + t, y: y1, z: hi } };
}

/**
 * A run's stone, as the boxes the builder emits and the player walks into: one
 * box when the run is solid, and three per doorway — the wall either side of it
 * and the lintel over it.
 *
 * A DOORWAY IS A GAP IN THE COLLIDERS, WHICH IS WHY IT IS HERE AND NOT IN THE
 * BUILDER. The walkability grid floods through a doorway because there is no
 * collider in it below the lintel, not because anything told the grid a door
 * exists. `height` is the head of the opening: the grid asks for 1.9 m clear
 * above the floor, so a lintel at 2.5 leaves the cell standable and a lintel at
 * 1.5 does not. The run's whole box is still `runBox`, and the lintel is what
 * makes that true — remove it and the run stops reaching over its own doorway.
 *
 * `at` is a TILE coordinate along the run, the same units as `from` and `to`;
 * `width` and `height` are metres.
 */
function runBoxes(run, tileSize) {
  const whole = runBox(run, tileSize);
  const doors = run.doorways || [];
  if (!doors.length) return [whole];
  const axis = runAxis(run);
  const k = axis === 'x' ? 'x' : 'z';
  const cuts = doors.map((d) => {
    const c = d.at * tileSize;
    return { lo: c - d.width / 2, hi: c + d.width / 2, top: whole.min.y + d.height, at: d.at };
  }).sort((a, b) => a.lo - b.lo);

  const slice = (lo, hi, yMin) => {
    const b = { min: { ...whole.min }, max: { ...whole.max } };
    b.min[k] = lo; b.max[k] = hi;
    if (yMin != null) b.min.y = yMin;
    return b;
  };

  const out = [];
  let cursor = whole.min[k];
  for (const cut of cuts) {
    if (cut.lo < cursor - 1e-9) throw new Error(`[castle-plan] wall run "${run.id}" has a doorway at tile ${cut.at} that starts before the run does, or overlaps the doorway before it`);
    if (cut.hi > whole.max[k] + 1e-9) throw new Error(`[castle-plan] wall run "${run.id}" has a doorway at tile ${cut.at} that runs past the end of the wall`);
    if (cut.top >= whole.max.y - 1e-9) throw new Error(`[castle-plan] wall run "${run.id}" has a doorway ${cut.top - whole.min.y} m high in a ${run.height} m wall, which leaves no lintel over it`);
    if (cut.lo > cursor + 1e-9) out.push(slice(cursor, cut.lo));
    out.push(slice(cut.lo, cut.hi, cut.top));
    cursor = cut.hi;
  }
  if (whole.max[k] > cursor + 1e-9) out.push(slice(cursor, whole.max[k]));
  return out;
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
 * HOLLOW, AND WHERE THE DOOR IS. Phase 3 shipped these solid and wrote down why
 * (#433): a drum standing on a tile-thick wall cannot be entered from the ward,
 * because at a corner the two runs meeting there overlap in neither axis and the
 * ward and the drum meet at a pinch of exactly zero width. That reading was
 * right about the pinch and wrong about the fix. A drum is 8 m across on a 4 m
 * wall, so two metres of every one of them stands PROUD of the wall's inner
 * face, inside the ward or inside the room behind it; the quarter of the ring
 * facing that way is clear of both runs. The doorway goes there, in the drum's
 * own ring, and no run is cut at all. `interior.door.theta` is that bearing.
 *
 * THE RING IS THE SAME POLYGON AS THE GEOMETRY, still. Each collider is the box
 * over one sector's four ring vertices — two at `radius` and two at
 * `interior.radius` — where the solid version used the centre and two. The
 * door's sectors keep their box and lose their bottom: `min.y` rises to the
 * opening's head, which IS the lintel, and which is why a doorway does not
 * change the drum's own box by a millimetre. A shut door (the cell's bars, the
 * muniment room's leaf before the riddle) puts that bottom back.
 *
 * A BOX OVER AN ARC BULGES INWARD. At 24 sides and an inner radius of 2.8 m the
 * worst sector box reaches 0.19 m past the ring into the room, at the diagonals.
 * That is conservative in the direction that matters — the room reads slightly
 * smaller than it is and nothing false is ever called standable.
 */
function doorArc(drum, door, segments, step) {
  const from = door.theta - door.arc / 2;
  const whole = (v) => Math.abs(v - Math.round(v)) < 1e-6;
  if (!(door.arc > 0) || !whole(door.arc / step) || !whole(from / step)) {
    throw new Error(`[castle-plan] ${drum.id}'s doorway spans ${door.arc} degrees from ${from}, which does not start and end on one of this drum's ${step}-degree vertices. A doorway off the vertices makes the wall and the hole two different polygons`);
  }
  if (!(door.height > 0) || door.height >= drum.height) {
    throw new Error(`[castle-plan] ${drum.id}'s doorway is ${door.height} m high in a ${drum.height} m tower, which leaves no lintel over it`);
  }
  const n = Math.round(door.arc / step), first = Math.round(from / step);
  const sectors = new Set();
  for (let k = 0; k < n; k++) sectors.add((((first + k) % segments) + segments) % segments);
  return { sectors, from, arc: door.arc, theta: door.theta, height: door.height, count: n };
}

function drumParts(drum, tileSize, { shut = false } = {}) {
  const [cx, , cz] = tileToWorld(tileSize, drum.tile[0], drum.tile[1]);
  const r = drum.radius;
  const segments = drum.segments || 24;
  const step = 360 / segments;
  const interior = drum.interior || null;
  const inner = interior ? interior.radius : 0;
  if (interior && !(inner > 0 && inner < r)) {
    throw new Error(`[castle-plan] ${drum.id}'s interior radius ${inner} is not inside its ${r} m drum`);
  }
  const door = interior && interior.door ? doorArc(drum, interior.door, segments, step) : null;

  const box = EMPTY();
  const colliders = [];
  for (let i = 0; i < segments; i++) {
    const a0 = i * step, a1 = (i + 1) * step;
    const ring = [ringPoint(cx, cz, r, a0), ringPoint(cx, cz, r, a1)];
    if (inner) ring.push(ringPoint(cx, cz, inner, a0), ringPoint(cx, cz, inner, a1));
    else ring.push({ x: cx, z: cz });
    const seg = EMPTY();
    for (const pt of ring) {
      expand(seg, { x: pt.x, y: 0, z: pt.z });
      expand(seg, { x: pt.x, y: drum.height, z: pt.z });
    }
    // The drum's own box is the stone's, doorway or not: the lintel reaches the
    // same ring vertices the missing wall would have.
    expand(box, seg.min); expand(box, seg.max);
    const open = door && door.sectors.has(i) && !shut;
    colliders.push({
      id: `${drum.id}-sector-${i}`, sector: i,
      box: open ? { min: { ...seg.min, y: door.height }, max: { ...seg.max } } : seg,
    });
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

  return { cx, cz, radius: r, segments, box, colliders, turret, inner, door, shut };
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
export function makePlan(config, boundsOf, { closed = [], opened = [] } = {}) {
  const tileSize = config.tileSize;
  const kBase = config.kenneyBase, pBase = config.polyhavenBase;
  const forceClosed = new Set(closed);
  const forceOpen = new Set(opened);
  const pieces = [], colliders = [], surfaces = [], gates = [];
  let seq = 0;

  /* Which room is behind which drum. A tower's door, its floor and its lock all
   * belong to the room, and the room names the drum, so none of the three is
   * written down twice. */
  const roomOfDrum = new Map();
  for (const r of config.rooms || []) {
    if (!r.drum) continue;
    if (roomOfDrum.has(r.drum)) throw new Error(`[castle-plan] rooms "${roomOfDrum.get(r.drum).id}" and "${r.id}" both claim drum "${r.drum}"`);
    roomOfDrum.set(r.drum, r);
  }

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
    const boxes = runBoxes(run, tileSize);
    addPiece({
      id: run.id, kind: 'wall', built: 'run', level: run.level || 0, curtain: !!run.curtain,
      material: run.material, repeatMetres: run.repeatMetres || null,
      label: run.comment ? run.comment.split(/[.,]/)[0] : run.id,
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box, boxes,
    });
    // One collider per emitted box. A solid run keeps its own id, so nothing
    // that names a curtain run by id had to change; a run with a doorway in it
    // is three boxes and three ids, which is also how the deliberate break
    // "wall a doorway shut" is written — put the box back and the room goes dark.
    boxes.forEach((b, i) => collide(boxes.length === 1 ? run.id : `${run.id}-${i}`, b));

    // Battlements are the castle's outer edge, not a room's. An interior
    // partition is 1 m of wall between two rooms with a ceiling coming in Phase
    // 5; crenellating it would put merlons inside the Great Hall.
    if (run.interior) continue;

    // battlements ride the run's outer edge, along its long axis, at its top
    const theta = outwardTheta(run, tileSize);
    const axis = runAxis(run);
    const cross = run.from[axis === 'x' ? 1 : 0] * tileSize;
    const lo = axis === 'x' ? box.min.x : box.min.z, hi = axis === 'x' ? box.max.x : box.max.z;
    const from = axis === 'x' ? [lo, cross] : [cross, lo];
    const to = axis === 'x' ? [hi, cross] : [cross, hi];
    merlonRun(from, to, box.max.y, theta + 180);
  }

  /* --- eight drums, hollow, each with a doorway in its ring --- */
  const drumShapes = [];
  for (const drum of config.drums) {
    const room = roomOfDrum.get(drum.id) || null;
    if (drum.interior && !room) throw new Error(`[castle-plan] drum "${drum.id}" has an interior and no room in config.rooms names it`);
    const spec = drum.interior && drum.interior.door ? drum.interior.door : null;
    const leafSpec = spec && spec.leaf ? spec.leaf : null;
    const barsSpec = spec && spec.bars ? spec.bars : null;
    if (leafSpec && barsSpec) throw new Error(`[castle-plan] ${drum.id}'s doorway carries both a leaf and bars`);
    // A leaf can be forced either way, which is how test/layout.mjs floods the
    // castle once with the word-lock shut and once with it answered. Bars are not
    // a door that opens: nothing forces them, and the doorway they fill stays
    // open stone so that the BARS are what holds, not the wall around them.
    const leafShut = !!leafSpec && !forceOpen.has(room && room.id) &&
      (forceClosed.has(room && room.id) || !!leafSpec.closed);
    const d = drumParts(drum, tileSize, { shut: leafShut });
    drumShapes.push({ drum, room: room && room.id, ...d });
    addPiece({
      id: drum.id, kind: 'tower', built: 'drum', level: drum.level || 0, curtain: !!drum.curtain,
      material: drum.material, label: drum.comment ? drum.comment.split(/[.,]/)[0] : drum.id,
      drum: {
        cx: d.cx, cz: d.cz, radius: d.radius, height: drum.height,
        segments: d.segments, turret: d.turret,
        // The ring and its doorway. These were left off the first time and the
        // builder read `inner` as undefined, so every tower rendered as the solid
        // cylinder Phase 3 shipped while the plan, the colliders and the whole
        // suite said hollow. test/plan-vs-scene.mjs could not see it: a solid
        // drum's bounds are a hollow one's bounds, to the millimetre. It came out
        // of deleting the lintel on purpose and watching nothing happen (#34).
        inner: d.inner,
        door: d.door ? { from: d.door.from, arc: d.door.arc, count: d.door.count, height: d.door.height } : null,
      },
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box: d.box,
      // The twenty-four sectors, not the 8 x 8 m square `box` bounds them with.
      // A drum's corners are ward floor, and a check that reads `box` calls a
      // chest standing in that floor "inside South-west Tower".
      boxes: d.colliders.map((c) => c.box),
    });
    // A shut leaf blocks through the ring's own sectors rather than through its
    // own rotated box: the sector boxes are the doorway exactly, and the builder
    // drops them by id when the leaf swings. An open doorway's sectors are the
    // lintel over it and block nothing at head height.
    const blocks = [];
    for (const c of d.colliders) {
      const shutHere = leafShut && d.door && d.door.sectors.has(c.sector);
      const id = shutHere ? `${room.id}-shut-${c.sector}` : c.id;
      if (shutHere) blocks.push(id);
      collide(id, c.box);
    }

    if (spec && (leafSpec || barsSpec)) {
      // The plate hangs on the chord of its own doorway, at the middle of the
      // ring's thickness. Its width is that chord, worked out from the arc rather
      // than written down, so a wider doorway carries a wider door.
      const mid = (d.inner + drum.radius) / 2;
      const th = d.door.theta * Math.PI / 180;
      const centre = [d.cx + mid * Math.sin(th), d.cz + mid * Math.cos(th)];
      const width = 2 * mid * Math.sin((d.door.arc / 2) * Math.PI / 180);
      const shutAngle = d.door.theta;
      if (leafSpec) {
        const archRadius = width / 2;
        const leaf = { width, springline: d.door.height - archRadius, archRadius, thickness: leafSpec.thickness };
        if (leaf.springline <= 0) throw new Error(`[castle-plan] ${drum.id}'s doorway is ${d.door.height} m high and ${width.toFixed(2)} m wide, so a round-headed leaf has no straight side at all`);
        const openAngle = shutAngle + (leafSpec.openDegrees || 0);
        const hung = hangLeaf(gateLeafParts(leaf), centre, shutAngle, leafShut ? shutAngle : openAngle);
        addPiece({
          id: room.id, kind: 'gate-leaf', built: 'gate-leaf', level: 0, curtain: false,
          material: leafSpec.material, label: `${room.id} door`, leaf,
          evidence: leafSpec.evidence || null,
          pivot: hung.pivot, transform: hung.transform, box: hung.box,
        });
        gates.push({
          id: room.id, quest: leafSpec.quest || null, closed: leafShut, shutAngle, openAngle, blocks,
          // A leaf the player presses E at. `lock` is the prompt it shows, and
          // `centre` is what the interaction system aims at, which is the leaf
          // and not its hinge.
          lock: leafSpec.lock || null,
          centre: [(hung.box.min.x + hung.box.max.x) / 2, (hung.box.min.y + hung.box.max.y) / 2, (hung.box.min.z + hung.box.max.z) / 2],
        });
      } else {
        const bars = { width, height: d.door.height, thickness: barsSpec.thickness, count: barsSpec.count };
        const hung = hangLeaf(barsParts(bars), centre, shutAngle, shutAngle);
        addPiece({
          id: `${room.id}-bars`, kind: 'fixture', built: 'bars', level: 0, curtain: false,
          material: barsSpec.material, label: `${room.id} bars`, bars,
          transform: hung.transform, box: hung.box,
        });
        // The bars are the only thing between the Great Hall and the cell.
        collide(`${room.id}-bars`, hung.box);
      }
    }

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
    const isClosed = !forceOpen.has(g.id) && (forceClosed.has(g.id) || !!g.closed);
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
      label: `${g.id} leaf`, material: g.material, leaf: g.leaf,
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
      blocks: isClosed ? [g.id] : [],
    });
  }

  /* --- individual placements: loose kit decor --- */
  for (const p of config.courtyard.placements) {
    const parts = boundsOf(kBase + p.model).parts;
    const { transform, box } = place({
      parts, tileSize, tile: p.tile, rotationY: p.rotationY || 0,
      // A number is a scale and a string is a rule (see scaleFor). The kit's
      // props are authored at 1 unit and the rules only know walls, towers and
      // columns, so a 4 m post and a 0.32 m dais step say their own number.
      scaleRule: typeof p.scale === 'number' ? p.scale : scaleRuleFor(p.model),
    });
    const kind = /^tower/.test(p.model) ? 'tower'
      : /^(wall|column)/.test(p.model) ? 'wall' : 'decor';
    const id = p.id || `${p.model.replace(/\.glb$/, '')}-${seq++}`;
    addPiece({
      id, kind, model: kBase + p.model, level: 0, curtain: !!p.curtain,
      label: p.comment || p.model, evidence: p.evidence || null,
      transform, box, boxes: p.noCollide ? [] : [box],
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
    const id = p.id || p.model.split('/')[0].replace(/_1k\.gltf$/, '');
    addPiece({ id, kind: 'prop', model: pBase + p.model, level: 0, curtain: false, label: id, evidence: p.evidence || null, transform, box });
    if (!p.noCollide) {
      collide(id, box);
      stack.push(box);
      surfaces.push({ id, box, top: box.max.y, level: 0, slope: null });
    }
  }

  /* --- built props: a box of a named size, for the one or two things the kit
   * and Poly Haven between them have no model of. The cloak is the only one:
   * WISHLIST.md rules out kite_shield as the wrong shape and no cloth map is on
   * the stone list, so it is a slab in a colour. Axis-aligned, because a rotated
   * slab would need a matrix to describe a rectangle and buy nothing. --- */
  for (const b of config.builtProps || []) {
    const [bx, , bz] = tileToWorld(tileSize, b.tile[0], b.tile[1]);
    const [w, h, d] = b.size;
    const y0 = b.base || 0;
    const box = {
      min: { x: bx - w / 2, y: y0, z: bz - d / 2 },
      max: { x: bx + w / 2, y: y0 + h, z: bz + d / 2 },
    };
    addPiece({
      id: b.id, kind: 'prop', built: 'slab', level: 0, curtain: false,
      material: b.material, label: b.id, evidence: b.evidence || null,
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box,
    });
    collide(b.id, box);
  }

  /* --- the curtain: the outer face of everything the config calls curtain --- */
  const curtain = EMPTY();
  for (const piece of pieces) if (piece.curtain) { expand(curtain, piece.box.min); expand(curtain, piece.box.max); }

  /* --- the fourteen ground rooms ---
   * A room is either a rectangle of whole tiles or a tower interior, and a tower
   * interior's bounds are its drum's, not a second set of numbers that could
   * disagree with it. `locked` is read off the doorway the room's own drum
   * carries: the muniment room until the riddle is answered, the cell forever.
   */
  const rooms = (config.rooms || []).map((r) => {
    const half = tileSize / 2;
    let b, locked = null, shape = null;
    if (r.drum) {
      const d = drumShapes.find((x) => x.drum.id === r.drum);
      if (!d) throw new Error(`[castle-plan] room "${r.id}" names drum "${r.drum}", which config.drums does not have`);
      if (!d.inner) throw new Error(`[castle-plan] room "${r.id}" is inside drum "${r.drum}", which has no \`interior\` and is solid stone`);
      b = { min: { x: d.cx - d.inner, z: d.cz - d.inner }, max: { x: d.cx + d.inner, z: d.cz + d.inner } };
      // A TOWER ROOM IS A DISC AND ITS BOUNDING SQUARE IS NOT THE ROOM. The
      // square's corners sit at 1.414 * 2.8 = 3.96 m, which is out in the ring —
      // and the doorway's own cells are in the ring. Counting the square said a
      // tower whose way in had been walled up was still "reachable, 4 cells",
      // because the four cells standing IN the blocked doorway are inside the
      // square. Found by walling one up on purpose and watching the suite stay
      // green (#34). The disc is the floor; the square is only the index.
      shape = { kind: 'disc', cx: d.cx, cz: d.cz, radius: d.inner };
      const door = d.drum.interior.door || {};
      locked = door.bars ? 'bars' : (door.leaf && door.leaf.closed ? 'riddle' : null);
    } else if (r.tiles) {
      b = { min: { x: r.tiles.min[0] * tileSize - half, z: r.tiles.min[1] * tileSize - half },
            max: { x: r.tiles.max[0] * tileSize + half, z: r.tiles.max[1] * tileSize + half } };
    } else {
      b = { min: { x: r.bounds.min[0], z: r.bounds.min[1] },
            max: { x: r.bounds.max[0], z: r.bounds.max[1] } };
    }
    return { id: r.id, level: r.level || 0, ward: r.ward || null, drum: r.drum || null, floor: r.floor || null, locked, bounds: b, shape };
  });

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
  /* A room's floor is a patch of its own material laid inside it: a rectangle
   * for a walled room, a disc for a tower. At the base's y, like every other
   * patch, so the walkability grid's 1e-6 dedupe reads one floor and not a
   * second storey over half the castle. Which rooms get one is WISHLIST.md's
   * stone table: rock tile in the two halls, floor tiles in the chapel, old
   * planks in the service rooms. A room with no `floor` keeps the ground it
   * stands on, which is why the five pavers-floored towers cost nothing. */
  for (const r of rooms) {
    if (!r.floor) continue;
    const d = r.drum ? drumShapes.find((x) => x.drum.id === r.drum) : null;
    grounds.push({
      id: `floor-${r.id}`, material: r.floor, patch: true, fallbackColor: null,
      disc: d ? { cx: d.cx, cz: d.cz, radius: d.inner } : null,
      box: { min: { x: r.bounds.min.x, y: 0, z: r.bounds.min.z },
             max: { x: r.bounds.max.x, y: 0, z: r.bounds.max.z } },
    });
  }

  for (const g of grounds) {
    addPiece({
      id: g.id, kind: 'ground', built: 'ground', level: 0, curtain: false,
      material: g.material, label: g.id, patch: g.patch, disc: g.disc || null,
      transform: { position: [0, 0, 0], rotationY: 0, scale: 1 }, box: g.box,
    });
    surfaces.push({ id: g.id, box: g.box, top: 0, level: 0, slope: null });
  }

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

  /* THE DRUMS ARE ALREADY IN THIS BOX, and Phase 4 nearly shipped a second rule
   * saying so. Hollowing the towers puts walkable floor 0.8 m past the curtain's
   * outer FACE, which looked like it needed the seal test taught that a tower
   * interior is inside the castle. It did not: `curtain: true` is on all eight
   * drums, so the box has run z -20..20 rather than -18..18 since Phase 3, and a
   * cell in a tower was never outside it. The extra rule was written, tested by
   * deleting it, and found to change no answer at all — which is the same thing
   * as not being a check (#13), so it is not here. */
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
          cz(c.j) >= r.bounds.min.z && cz(c.j) <= r.bounds.max.z &&
          (r.shape?.kind !== 'disc' ||
            Math.hypot(cx(c.i) - r.shape.cx, cz(c.j) - r.shape.cz) <= r.shape.radius));
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
