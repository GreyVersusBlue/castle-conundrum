// route.mjs — the castle's shortest walk, thinned to waypoints a body can drive.
//
// `walkability(plan).path()` answers "which cells connect", and that is not
// quite the question a driven body asks. Two things it gets wrong for a player,
// both measured on a GPU on 2026-09-19 (#710):
//
// THE FLIGHT IS FLOOR TO THE GRID. A tower's lower flight stands ON the tower's
// floor, so its footprint is the only surface over those cells and the fill
// walks up it the way it walks across a room. The shortest route out of the
// chapel therefore crosses the Chapel Tower's ramp, `driveTo` holds W into it,
// and the body arrives a storey up. `hike` then re-plans from where the body
// is, gets the same route from a cell one storey higher, and after three
// identical answers gives up — the run stalled at (22.4, 15.2) L1 and then at
// (23.4, 14.4) L1, which is #630's own recorded coordinate. Worse than the
// chapel: clerk-office to porter-lodge came back 132 cells long with 76 of them
// off the ground and a high point of 8.00 m, which is the wall walk.
//
// A DOORWAY IS A CORNER A BODY'S WIDTH WIDE. The thinning keeps every turn, so
// a leg between two marks is a straight run of collinear cell centres — and a
// cell centre is on a 0.5 m lattice that no doorway is obliged to line up with.
// A 1.2 m opening whose centre is 0.25 m off the lattice leaves 0.35 m for a
// 0.45 m body, and the aim-and-hold loop puts it in the jamb: measured at
// (-18.9, -14.3) inside the Kitchen Tower and at (-33.5, 5.0) and (-26.5, 5.0)
// along the Great Hall's north wall, whose doorways are at x -20 and -12.
//
// WHY THIS IS IN test/ AND NOT IN THE PLAN'S OWN GRAPH. `src/stations.js` walks
// the twelve along the same graph and has neither problem: a station is never
// on a ramp and an NPC is steered cell by cell rather than aimed at, so it
// takes the doorway's own cells at 0.5 m and turns in them. Narrowing the graph
// would move twelve bodies to fix one. The player is the one that is aimed and
// held, so the thinning is the player's.
//
// `test/layout.mjs` holds the level rail over every pair of ground rooms
// (#529: it is derivable from the plan in Node, so it is not in
// plan-vs-scene.mjs), and `test/play-castle.mjs`'s `hike` drives what comes
// out of here.

import { GRID, STEP_UP, HEAD_LOW, HEAD_HIGH, BODY_RADIUS } from '../src/castle-plan.js';

/**
 * Which storey a floor height is on.
 *
 * READ OFF THE HEIGHT, NOT OFF THE SURFACE. A cell carries the `level` of the
 * surface it stands on, and a flight's surface carries the level it STARTS
 * from: a cell four metres up the Chapel Tower's lower flight says `level: 0`
 * while the body standing on it is on the first floor. `play-castle.mjs`'s
 * `playerAt` has always read the camera's y for exactly this reason, and this
 * is the same arithmetic against a floor height instead of an eye height.
 */
export const storeyOf = (plan, h) => Math.max(0, Math.round(h / plan.storey));

/** Is this cell a storey's floor, rather than part way up a flight to it? */
export const onStorey = (plan, cell) =>
  Math.abs(cell.h - storeyOf(plan, cell.h) * plan.storey) <= STEP_UP + 1e-9;

/* One graph per walkability object, built the first time something asks and
 * kept against the object itself. `layout.mjs` asks 66 times. */
const graphs = new WeakMap();

/**
 * The fill's cells minus everything that is not a storey's own floor: a flight
 * keeps its foot, where a body stands level with the floor it leaves, and loses
 * every tread above it. Adjacency is the fill's own rule with the slope
 * arithmetic gone, because every cell left in here is flat.
 */
function storeyGraph(plan, walk) {
  if (graphs.has(walk)) return graphs.get(walk);
  const byIJ = new Map();
  for (const c of walk.cells) {
    if (!onStorey(plan, c)) continue;
    const k = `${c.i},${c.j}`;
    if (!byIJ.has(k)) byIJ.set(k, []);
    byIJ.get(k).push(c);
  }
  const key = (c) => `${c.i},${c.j},${c.h.toFixed(3)}`;
  const nodes = new Map();
  for (const list of byIJ.values()) for (const c of list) nodes.set(key(c), c);
  const priced = new Map();
  const g = {
    key,
    nodes,
    /** The cells at (i, j) standing on storey `s`. */
    at: (i, j, s) => (byIJ.get(`${i},${j}`) || []).filter((c) => storeyOf(plan, c.h) === s),
    /** What walking through this cell costs. Measured once; `layout.mjs` asks 66 times. */
    cost: (c) => {
      const k = key(c);
      if (!priced.has(k)) priced.set(k, clearance(plan, centreOf(c.i), centreOf(c.j), c.h) >= BODY_RADIUS ? 1 : TIGHT);
      return priced.get(k);
    },
  };
  graphs.set(walk, g);
  return g;
}

const centreOf = (i) => i * GRID + GRID / 2;
const indexOf = (x) => Math.round((x - GRID / 2) / GRID);

/** How far the nearest stone crossing a standing body's head band is, in metres. */
export function clearance(plan, x, z, feet) {
  const low = feet + HEAD_LOW, high = feet + HEAD_HIGH;
  let best = Infinity;
  for (const { box } of plan.colliders) {
    if (box.min.y >= high - 1e-6 || box.max.y <= low + 1e-6) continue;
    const nx = Math.min(Math.max(x, box.min.x), box.max.x);
    const nz = Math.min(Math.max(z, box.min.z), box.max.z);
    const d = Math.hypot(x - nx, z - nz);
    if (d < best) best = d;
  }
  return best;
}

/**
 * What a cell costs to walk through, in cells. One, unless a 0.45 m body does
 * not fit in it, and then five.
 *
 * THE GRID SAMPLES A POINT AND THE PLAYER IS 0.9 M ACROSS (#511, and
 * `walkability`'s own header says so). So the fill's shortest route is happy to
 * hug a wall, and two props in this castle stand close enough to one to wedge a
 * body against it: `foundation-stone` leaves 0.60 m between itself and the
 * cross-wall at (-2.6, 4.0), and `barrels-91` leaves 0.52 m inside the
 * North-west Tower's door. Both are a cell centre the grid calls walkable and a
 * body cannot occupy, and the shortest route went through both.
 *
 * A PENALTY RATHER THAN A BAN, because the lattice cuts the other way too: a
 * 1.2 m doorway whose middle is 0.25 m off the grid has no cell centre with
 * room for a body in it, and banning tight cells outright cut 21 of the 66
 * room-to-room routes, the porter's lodge and the guardroom among them. Five
 * says a detour of up to four cells — two metres — is worth taking to keep the
 * body out of a squeeze, and nothing is ever unreachable.
 */
const TIGHT = 5;

/**
 * The shortest walk from one standing point to another, as cell centres.
 *
 * When both ends are on the same storey this searches that storey's floor
 * alone, so no answer it gives can climb a flight or cross the wall walk. When
 * they are not — the player walking up to a tower room — it is the fill's own
 * `path`, flights and all, because a flight is the only way up.
 *
 * Cheapest-first over `TIGHT`, in buckets rather than a heap: every cell costs
 * a whole number of cells, so the bucket a cell lands in is its distance, and
 * the buckets are walked in order. Breadth-first is this with every cost 1.
 *
 * Each waypoint carries `storey` beside the cell's own `level`; see `storeyOf`
 * for why those are two different numbers on a flight.
 */
export function routeThrough(plan, walk, from, to) {
  const a = walk.cellAt(from.x, from.z, from.level ?? 0);
  const b = walk.cellAt(to.x, to.z, to.level ?? 0);
  if (!a || !b) return null;
  const mark = (c) => ({ x: centreOf(c.i), z: centreOf(c.j), h: c.h, level: c.level, storey: storeyOf(plan, c.h) });
  const sa = storeyOf(plan, a.h), sb = storeyOf(plan, b.h);
  if (sa !== sb || !onStorey(plan, a) || !onStorey(plan, b)) {
    const p = walk.path(from, to);
    return p && p.map((w) => ({ ...w, storey: storeyOf(plan, w.h) }));
  }
  const g = storeyGraph(plan, walk);
  const ka = g.key(a), kb = g.key(b);
  if (!g.nodes.has(ka) || !g.nodes.has(kb)) return null;
  if (ka === kb) return [mark(a)];
  const prev = new Map([[ka, null]]);
  const dist = new Map([[ka, 0]]);
  const buckets = [[ka]];
  let found = false;
  for (let d = 0; d < buckets.length && !found; d++) {
    for (const k of buckets[d] || []) {
      if (dist.get(k) !== d) continue; // already reached cheaper
      if (k === kb) { found = true; break; }
      const cur = g.nodes.get(k);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (const n of g.at(cur.i + di, cur.j + dj, sa)) {
          if (Math.abs(n.h - cur.h) > STEP_UP + 1e-9) continue;
          const kn = g.key(n);
          const nd = d + g.cost(n);
          if (dist.has(kn) && dist.get(kn) <= nd) continue;
          dist.set(kn, nd);
          prev.set(kn, k);
          (buckets[nd] ||= []).push(kn);
        }
      }
    }
  }
  if (!prev.has(kb)) return null;
  const out = [];
  for (let k = kb; k != null; k = prev.get(k)) out.push(mark(g.nodes.get(k)));
  return out.reverse();
}

/**
 * Is this route cell a doorway — somewhere the walk is pinched to the width of
 * an opening? Both cells to the side of the direction of travel have to be off
 * the floor, which is stone in a wall run's opening and stone in a drum's ring.
 * A corridor two cells wide reads as open and gets no mark, which is right: the
 * body has most of a metre either side of it there.
 *
 * AND IT IS NOT RAILED, WHICH IS SAID HERE RATHER THAN HIDDEN (#13, #34). Once
 * the route is priced by clearance, taking these marks out again changes no
 * answer `layout.mjs`'s check 8b can see: 66 of 66 walks either way, 4811
 * bursts against 4813, and the driven body pushed off stone on 1936 steps of
 * 31,103 rather than 1913. Take the pricing out as well and they carry the
 * walks the body cannot drive from 14 down to 4. They are kept because the
 * thing they were written for was measured on a GPU — the player sliding along
 * the Great Hall's north wall at (-33.5, 5.0) and (-26.5, 5.0) with the
 * doorways at x -20 and -12 — and the model above has none of the aim-and-hold
 * loop's overshoot in it (#53 cuts this way too). Rank 2's run is what can
 * confirm them or kill them.
 */
const isDoorway = (g, before, cell, after, storey) => {
  const alongX = Math.abs(after.x - before.x) >= Math.abs(after.z - before.z);
  const perp = alongX ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
  const i = indexOf(cell.x), j = indexOf(cell.z);
  return perp.every(([di, dj]) => g.at(i + di, j + dj, storey).length === 0);
};

/**
 * The widest point of the opening a doorway cell sits in, on the line across
 * the direction of travel. The lattice is 0.5 m and an opening's middle owes it
 * nothing, so the cell centre can be 0.25 m off the middle of a gap that only
 * has 0.15 m to spare.
 *
 * THE SEARCH STOPS AT THE FIRST THING IN THE WAY, in each direction
 * separately. Without that it walks THROUGH a jamb: a metre of stone has no
 * clearance at all, but the room on the far side of it has plenty, and the
 * widest point on the whole line would be in the next room.
 */
const widest = (plan, walk, before, cell, after, storey) => {
  const alongX = Math.abs(after.x - before.x) >= Math.abs(after.z - before.z);
  let best = { x: cell.x, z: cell.z, d: clearance(plan, cell.x, cell.z, cell.h) };
  for (const way of [1, -1]) {
    for (let o = 0.05; o <= 0.75 + 1e-9; o += 0.05) {
      const x = alongX ? cell.x : cell.x + way * o;
      const z = alongX ? cell.z + way * o : cell.z;
      const d = clearance(plan, x, z, cell.h);
      const floor = walk.cellAt(x, z, storey);
      if (d < 1e-6 || !floor || Math.abs(floor.h - cell.h) > STEP_UP + 1e-9) break;
      if (d > best.d + 1e-9) best = { x, z, d };
    }
  }
  return { ...cell, x: best.x, z: best.z };
};

/**
 * The route thinned to the points worth steering to: every corner, a point
 * every `spacing` metres along a straight run, and the middle of every doorway
 * it passes through. The ends are not in the list — the caller is standing on
 * the first and aiming at the last.
 *
 * Driving every cell turns a 45 m walk into ninety bursts of 0.5 m and a lot of
 * stopping; driving only the corners walks into door jambs. Both were tried.
 */
export function marksAlong(plan, walk, route, { spacing = 2.5 } = {}) {
  if (!route || route.length < 3) return [];
  const storey = route[0].storey ?? 0;
  const flat = route.every((w) => (w.storey ?? 0) === storey);
  const g = storeyGraph(plan, walk);
  const marks = [];
  let last = route[0];
  for (let k = 1; k < route.length - 1; k++) {
    const cell = route[k], after = route[k + 1], before = route[k - 1];
    const turn = Math.sign(cell.x - last.x) !== Math.sign(after.x - cell.x) ||
      Math.sign(cell.z - last.z) !== Math.sign(after.z - cell.z);
    const door = flat && isDoorway(g, before, cell, after, storey);
    if (!turn && !door && Math.hypot(cell.x - last.x, cell.z - last.z) < spacing) continue;
    marks.push(door ? widest(plan, walk, before, cell, after, storey) : cell);
    last = marks[marks.length - 1];
  }
  return marks;
}

/** `routeThrough` and `marksAlong` together, or null when there is no walk. */
export function routeMarks(plan, walk, from, to, options) {
  const route = routeThrough(plan, walk, from, to);
  return route && { route, marks: marksAlong(plan, walk, route, options) };
}
