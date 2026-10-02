// layout-edit.mjs — what a drag on the floor plan does to one row (SPECS.md
// "The floor plan you can see", increments 2 and 3).
//
// PURE, FOR THE SAME REASON tools/place.mjs AND tools/plan-sheet.mjs ARE. No
// `three`, no DOM, no `node:` import: src/edit-layout.js imports this in a
// browser and test/tools.mjs imports the same bytes in Node. Each function
// takes a row of data/scene-config.json and hands back a NEW row, with every
// key it did not touch carried over in the order it had, so the `move` that
// posts it rewrites the fields that changed and no others (#639).
//
// IT WORKS IN THE ROW'S OWN UNITS AND COMPUTES NO BOX (#500). A room by
// `tiles` is moved in tiles and a room by `bounds` in metres, which is the
// only arithmetic here: a drag is a delta, snapped by the caller, added to the
// numbers the row already has. Where the result stands in the world is
// `makePlan`'s answer, which the page asks for before it writes anything
// (#749). The one place a world extent comes in is `clampOpening`, and it comes
// in as an argument read off the plan's own box for that run.
//
// A DOORWAY IS A FIELD OF ITS RUN (#749). Moving one, widening one and cutting
// one are all a new `walls` row with a different `doorways` list, so the write
// is the same `move` verb a run's end uses and no nested-path splice exists
// anywhere.

/** Whole tiles, and a quarter tile with Alt held: the two snaps the sheet offers. */
export const SNAP = 1;
export const FINE_SNAP = 0.25;
/** An opening slides in tenths of a metre: its `at` is in tiles, so that is 0.025 of a 4 m tile. */
export const OPENING_SNAP_METRES = 0.1;

/** Six places, which is finer than anything the file spells and coarse enough to lose `0.30000000000000004`. */
const tidy = (n) => Number(n.toFixed(6));

/** `n` rounded to the nearest multiple of `step`, tidied. */
export function snapTo(n, step) {
  return tidy(Math.round(n / step) * step);
}

/**
 * A room row with some of its four edges moved by `dx`, `dz` tiles.
 *
 * `edges` names which of `minX`, `maxX`, `minZ`, `maxZ` move; all four is a
 * move of the whole rectangle and fewer is a resize. A room by `tiles` takes
 * the delta as it is, and a room by `bounds` takes it times `tile` metres, so
 * one whole-tile drag moves either kind by the same 4 m. A room by `drum` has
 * no rectangle of its own to drag — its disc is the drum's — and is refused.
 * So is a resize that would turn the rectangle inside out.
 */
export function dragRoom(row, { dx = 0, dz = 0, edges = ALL_EDGES, tile = 4 } = {}) {
  const field = 'tiles' in row ? 'tiles' : 'bounds' in row ? 'bounds' : null;
  if (!field) throw new Error(`layout: room "${row.id}" is by drum, and its extent is that drum's`);
  const scale = field === 'tiles' ? 1 : tile;
  const r = row[field];
  const min = [r.min[0] + (edges.minX ? dx * scale : 0), r.min[1] + (edges.minZ ? dz * scale : 0)].map(tidy);
  const max = [r.max[0] + (edges.maxX ? dx * scale : 0), r.max[1] + (edges.maxZ ? dz * scale : 0)].map(tidy);
  if (min[0] > max[0] || min[1] > max[1]) throw new Error(`layout: room "${row.id}" would be inside out (${field} min ${min.join(', ')} past max ${max.join(', ')})`);
  return { ...row, [field]: { ...r, min, max } };
}
export const ALL_EDGES = Object.freeze({ minX: true, maxX: true, minZ: true, maxZ: true });

/** A run row with its `from` or its `to` moved by `dx`, `dz` tiles. The caller keeps the drag on the run's axis; this only adds. */
export function dragRunEnd(row, end, { dx = 0, dz = 0 } = {}) {
  if (end !== 'from' && end !== 'to') throw new Error(`layout: a run's end is "from" or "to", not ${JSON.stringify(end)}`);
  const was = row[end];
  return { ...row, [end]: [tidy(was[0] + dx), tidy(was[1] + dz)] };
}

/** `row.doorways[index]`, or a throw naming both numbers: a stale panel naming an opening that is gone must write nothing. */
function doorwayAt(row, index) {
  const list = Array.isArray(row.doorways) ? row.doorways : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length)
    throw new Error(`layout: run "${row.id}" has ${list.length} doorway(s), so there is no doorway ${index}`);
  return list;
}

/** A run row with doorway `index` replaced by `fn(doorway)`; every other doorway is the object it was. */
function withDoorway(row, index, fn) {
  const list = doorwayAt(row, index);
  return { ...row, doorways: list.map((d, i) => (i === index ? fn(d) : d)) };
}

/**
 * Where an opening's centre may go along a run, in the row's own unit (tiles):
 * `at` held so the whole `width` stays inside [`lo`, `hi`], which are the
 * run's extent along its axis in metres, off the plan's own box for that run.
 * A run shorter than the opening has nowhere to put it and gets its middle.
 */
export function clampOpening(at, width, lo, hi, tile = 4) {
  const a = (lo + width / 2) / tile, b = (hi - width / 2) / tile;
  if (a > b) return tidy((lo + hi) / 2 / tile);
  return tidy(Math.min(b, Math.max(a, at)));
}

/** Doorway `index` slid to `at` (tiles). */
export function moveOpening(row, index, at) {
  if (!Number.isFinite(at)) throw new Error('layout: an opening\'s `at` must be a number');
  return withDoorway(row, index, (d) => ({ ...d, at: tidy(at) }));
}

/** Doorway `index` given a new `width` in metres. */
export function widenOpening(row, index, width) {
  if (!(Number.isFinite(width) && width > 0)) throw new Error(`layout: an opening is wider than nothing, and ${JSON.stringify(width)} is not`);
  return withDoorway(row, index, (d) => ({ ...d, width: tidy(width) }));
}

/**
 * Doorway `index` cut out of its run. The last one out takes the `doorways`
 * key with it rather than leaving `[]`: no run in the file spells an empty
 * list, and a row with no openings is a row with no `doorways`. Anything a
 * person wrote about them (`doorwaysComment`) is theirs and stays.
 */
export function cutOpening(row, index) {
  const list = doorwayAt(row, index);
  const rest = list.filter((_, i) => i !== index);
  if (rest.length) return { ...row, doorways: rest };
  const { doorways, ...out } = row;
  return out;
}

/**
 * `config` with row `index` of array `key` swapped for `row`, and nothing else
 * copied: every other array is the same object. This is what the page hands to
 * `makePlan` to ask whether the castle still builds before it posts (#749).
 */
export function withRow(config, key, index, row) {
  const list = config[key];
  if (!Array.isArray(list) || !Number.isInteger(index) || index < 0 || index >= list.length)
    throw new Error(`layout: config has no ${key}[${index}]`);
  return { ...config, [key]: list.map((r, i) => (i === index ? row : r)) };
}
