// plan-sheet.mjs — the overlay a top-down review of the castle draws over the
// real scene (BACKLOG.md rank 13, SPECS.md "The floor plan you can see",
// increment 1).
//
// PURE, AND FOR THE SAME REASON tools/place.mjs IS. No `three`, no DOM, no
// `node:` import, so src/edit-layout.js imports this file in a browser and
// test/tools.mjs imports the same bytes in Node. Anything here that needed a
// Box3 or a document would be a second module nobody could test in two seconds.
//
// IT RECOMPUTES NOTHING (#500). Every box and every bound this module hands
// back is the object `makePlan` put in `plan.pieces[i].box` and
// `plan.rooms[i].bounds`, by reference, not a copy and not a re-derivation.
// `src/castle-plan.js` is the single source the builder and every suite read,
// and a review tool that worked out where a room was from its `tiles` would be
// a second answer to the castle's geometry — which is the failure that file was
// written to end. test/tools.mjs asserts the identity, so a copy slipped in
// here fails before it can drift.
//
// WHY THE OPENINGS COME IN THROUGH `config` AND NOTHING ELSE DOES. A doorway is
// not a thing the plan carries: `runBoxes` turns a run with a `doorways` entry
// into the stone left AROUND the opening, so the opening itself survives only as
// the hole between boxes. Reading it back out of those boxes was tried and is
// wrong — by the time the drums have been cut back out of a run and
// `oneFacePerPlane` has shortened the columns that share a plane,
// `north-curtain-west` is nine boxes whose x columns disagree about y, and the
// column at x [-34, -33.2] reports a phantom opening from 7.8 m to 8 m that is
// nothing but a shortened face. So the opening's `at`, `width`, `height` and
// `base` are read from the run's own row in data/scene-config.json, and where
// that opening SITS in the world is the plan's: the run piece's own box gives
// the cross coordinate and the y the opening is measured up from. No box is
// built here either way.

/** A storey's y span: floor at `level * plan.storey`, ceiling one storey up. */
export function storeySpan(plan, level) {
  const floor = level * plan.storey;
  return { floor, ceiling: floor + plan.storey };
}

const EPS = 1e-6;

/**
 * Where a box sits against one storey: `'below'`, `'on'` or `'above'`.
 *
 * `'on'` is an overlap of the open interval, so an 8 m curtain on a 4 m storey
 * is on level 0 and on level 1 and above neither — it is the same stone from
 * both floors, and a review that hid it from one of them would draw a courtyard
 * with no wall round it. A box with no height (a ground patch, a sill) is on the
 * storey its plane falls in, because an open interval contains nothing of it.
 */
export function storeyOf(plan, box, level) {
  const { floor, ceiling } = storeySpan(plan, level);
  if (box.max.y - box.min.y <= EPS) {
    if (box.min.y < floor - EPS) return 'below';
    return box.min.y < ceiling - EPS ? 'on' : 'above';
  }
  if (box.max.y <= floor + EPS) return 'below';
  if (box.min.y >= ceiling - EPS) return 'above';
  return 'on';
}

/** Which axis a run travels, read off the plan's own box: the longer side of it. */
function axisOfBox(box) {
  return (box.max.x - box.min.x) >= (box.max.z - box.min.z) ? 'x' : 'z';
}

/** The union of every room's bounds, so the camera frames the same rectangle on every storey. */
function roomExtent(rooms) {
  const out = { min: { x: Infinity, z: Infinity }, max: { x: -Infinity, z: -Infinity } };
  for (const r of rooms) {
    out.min.x = Math.min(out.min.x, r.bounds.min.x);
    out.min.z = Math.min(out.min.z, r.bounds.min.z);
    out.max.x = Math.max(out.max.x, r.bounds.max.x);
    out.max.z = Math.max(out.max.z, r.bounds.max.z);
  }
  return out;
}

/**
 * The sheet for one storey.
 *
 * @param plan     what `makePlan(config, boundsOf)` returned
 * @param level    a storey number out of `plan.levels`
 * @param config   data/scene-config.json, for the `doorways` the plan does not
 *                 carry. Left out, `openings` is empty and nothing else changes.
 * @param mystery  data/mystery.json, whose `rooms` name the rooms the mystery
 *                 happens in. Left out, every room's `inMystery` is `null`,
 *                 which is "not asked" and not "no".
 * @returns {{
 *   level: number, floor: number, ceiling: number,
 *   extent: object, pieces: object[], rooms: object[], openings: object[],
 * }}
 */
export function planSheet(plan, level, { config = null, mystery = null } = {}) {
  const { floor, ceiling } = storeySpan(plan, level);

  // `box` and `boxes` by reference. test/tools.mjs asserts the identity, which
  // is the cheapest possible statement of #500: there is one box, and this is
  // it.
  const pieces = plan.pieces
    .filter((p) => storeyOf(plan, p.box, level) === 'on')
    .map((p) => ({
      id: p.id, kind: p.kind, built: p.built, label: p.label,
      material: p.material, curtain: p.curtain, level: p.level,
      box: p.box, boxes: p.boxes || null,
    }));

  const named = mystery && Array.isArray(mystery.rooms)
    ? new Set(mystery.rooms.map((r) => r.id)) : null;
  // A room is a name over an extent at one level (castle-plan.js's `rooms`
  // pass), so presence on a storey is the level it declares. `bounds` and
  // `shape` are the plan's own objects.
  const rooms = plan.rooms
    .filter((r) => r.level === level)
    .map((r) => ({
      id: r.id, name: r.name, ward: r.ward, level: r.level, drum: r.drum,
      locked: r.locked, top: r.top, bounds: r.bounds, shape: r.shape,
      inMystery: named ? named.has(r.id) : null,
    }));

  const openings = [];
  if (config && Array.isArray(config.walls)) {
    const pieceOf = new Map(plan.pieces.map((p) => [p.id, p]));
    for (const run of config.walls) {
      const piece = pieceOf.get(run.id);
      if (!piece || !Array.isArray(run.doorways)) continue;
      const axis = axisOfBox(piece.box);
      for (const d of run.doorways) {
        // The opening's floor is the run's own base plus the doorway's, which
        // is exactly what `runBoxes` cuts with; the height is the doorway's.
        const base = piece.box.min.y + (d.base || 0);
        const box = {
          min: { x: piece.box.min.x, y: base, z: piece.box.min.z },
          max: { x: piece.box.max.x, y: base + d.height, z: piece.box.max.z },
        };
        const along = d.at * plan.tile;
        if (axis === 'x') { box.min.x = along - d.width / 2; box.max.x = along + d.width / 2; }
        else { box.min.z = along - d.width / 2; box.max.z = along + d.width / 2; }
        if (storeyOf(plan, box, level) !== 'on') continue;
        openings.push({
          id: `${run.id}@${d.at}${d.base ? `+${d.base}` : ''}`,
          run: run.id, axis, at: d.at, width: d.width, height: d.height,
          base: d.base || 0,
          point: {
            x: axis === 'x' ? along : (piece.box.min.x + piece.box.max.x) / 2,
            y: base,
            z: axis === 'x' ? (piece.box.min.z + piece.box.max.z) / 2 : along,
          },
          box,
        });
      }
    }
  }

  return { level, floor, ceiling, extent: roomExtent(plan.rooms), pieces, rooms, openings };
}
