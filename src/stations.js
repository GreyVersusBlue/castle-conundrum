// stations.js — where the twelve stand at each of the four bells, and how they
// walk from one to the next. The bridge between data/mystery.json's `schedule`
// and src/castle-plan.js's grid, and the only place the two meet.
//
// A station is `{room, level?, tile}` in mystery.json. `tile` is a fractional
// tile coordinate, the same unit scene-config.json's props are placed in, and
// it is what makes a station a PLACE rather than a room: six people stand in
// the Great Hall at Vespers and each of them has to be somewhere you can walk
// up to and talk to on their own.
//
// The walk between two stations is breadth-first over the walkability grid,
// which is the same grid the player stands on. Nothing here interpolates or
// smooths: the waypoints are cell centres, 0.5 m apart, and npc.js walks them
// in order.
//
// WHY THE FILL IS SEEDED. `walkability` floods from the spawn, which answers
// the player's question. One of the twelve stands where the player never does:
// Madoc, behind bars that never open. His floor is still floor and his
// station is still a station, so the nav seeds the fill with every station's
// own point and asks `fromSpawn` separately for the question that is about the
// player — can he be reached and talked to, which for Madoc means through the
// bars, from the other side.

import { walkability, tileToWorld } from './castle-plan.js';

/** How far apart two people standing at the same bell have to be, in metres. */
export const STATION_CLEARANCE = 1.5;
/** interaction.js's INTERACT_RANGE: how close the player gets before E works. */
export const TALK_RANGE = 3.2;

/** A station's world point. Null for a station that is not in the castle. */
export function stationWorld(plan, station) {
  if (!station || !Array.isArray(station.tile) || station.tile.length !== 2) return null;
  const [x, , z] = tileToWorld(plan.tile, station.tile[0], station.tile[1]);
  return { x, z, level: station.level ?? 0 };
}

/**
 * The navigation view of one plan: the seeded grid, every station's point, and
 * the walk between any two of them.
 *
 * @param plan    src/castle-plan.js's makePlan result
 * @param mystery parsed data/mystery.json
 */
export function castleNav(plan, mystery) {
  const schedule = mystery?.schedule ?? {};
  const watches = mystery?.watches ?? [];
  const rooms = new Map((mystery?.rooms ?? []).map((r) => [r.id, r]));

  const points = new Map(); // "npc/watch" -> {room, level, x, z} | null
  const seeds = [];
  for (const [npcId, byWatch] of Object.entries(schedule)) {
    for (const watch of watches) {
      const station = byWatch?.[watch] ?? null;
      const world = stationWorld(plan, station);
      points.set(`${npcId}/${watch}`, world ? { ...world, room: station.room, note: station.note ?? null, asleep: !!station.asleep } : null);
      if (world) seeds.push([world.x, world.z]);
    }
  }

  const walk = walkability(plan, { seeds });
  /* AND THE FLOOR EACH OF THEM STANDS ON. A station is a tile and a level, and
   * the height is the grid's, not a third number in the data: Lady Alys's
   * chamber is level 1 and her feet are at 4.0, and the fill is the only thing
   * that knows that. `h` is null where there is no floor, which is a station
   * the validator refuses. Without it both the page and the check that watches
   * the page read `h ?? 0`, agreed, and stood her on the ground floor inside
   * the King's Hall (#470). */
  for (const point of points.values()) {
    if (!point) continue;
    const cell = walk.cellAt(point.x, point.z, point.level);
    point.h = cell ? cell.h : null;
  }
  const planRooms = new Map(plan.rooms.map((r) => [`${r.id}/${r.level}`, r]));

  const api = {
    walk,
    plan,
    /** Where `npcId` stands at `watch`, or null when they are not in the castle. */
    at(npcId, watch) { return points.get(`${npcId}/${watch}`) ?? null; },
    /** Is there floor to stand on there at all? */
    standable(point) { return !!point && !!walk.cellAt(point.x, point.z, point.level ?? 0); },
    /** Can the player walk to the tile itself — the spawn's own component? */
    walkable(point) { return !!point && walk.fromSpawn(point.x, point.z, point.level ?? 0); },
    /** Can the player walk to within `TALK_RANGE` of it — through bars or not? */
    talkable(point, range = TALK_RANGE) {
      if (!point) return false;
      const { grid } = walk;
      const span = Math.ceil(range / grid);
      const i0 = Math.floor(point.x / grid), j0 = Math.floor(point.z / grid);
      for (let i = i0 - span; i <= i0 + span; i++) {
        for (let j = j0 - span; j <= j0 + span; j++) {
          const x = i * grid + grid / 2, z = j * grid + grid / 2;
          if (Math.hypot(x - point.x, z - point.z) > range) continue;
          for (const level of [0, 1, 2]) {
            if (walk.fromSpawn(x, z, level)) return true;
          }
        }
      }
      return false;
    },
    /** Is the point inside the room its station names? Null when nothing can say. */
    inNamedRoom(point) {
      if (!point) return null;
      const named = rooms.get(point.room);
      // The two wards, the barbican and the garden are open ground with no
      // bounds anywhere to be inside of, so nothing here can tell the outer
      // ward from the inner one. `talkable` and the walk rails are what hold a
      // station in open ground honest (#147: say what the arithmetic cannot
      // distinguish out loud).
      if (named?.open) return null;
      const r = planRooms.get(`${point.room}/${point.level ?? 0}`);
      if (!r) return null;
      const inside = point.x >= r.bounds.min.x && point.x <= r.bounds.max.x &&
        point.z >= r.bounds.min.z && point.z <= r.bounds.max.z &&
        (r.shape?.kind !== 'disc' || Math.hypot(point.x - r.shape.cx, point.z - r.shape.cz) <= r.shape.radius);
      return inside;
    },
    /**
     * Is a point standing inside one named room, on one level (Phase 7)? The
     * player's own position goes in; `clue:walk-crosses` is what comes out of
     * it, the one clue in mystery.json granted by being somewhere rather than
     * by looking at something or asking somebody.
     *
     * THIS ASKS ABOUT ONE ROOM ON PURPOSE. The first version answered "which
     * room is this point in", and that question has no single answer in this
     * castle: the towers' discs overlap the walks that cross their roofs and
     * the cell's disc overlaps the Great Hall's box, so ten of the forty-five
     * stations came back named as a room their own schedule does not call
     * them. Whichever room won was whichever `plan.rooms` happened to list
     * first. "Am I inside cross-walk at level 2" has one answer, and it is the
     * only question anything actually asks.
     *
     * THE LEVEL IS CONFIRMED AGAINST THE FLOOR, not the bounds: the towers are
     * discs stacked three deep at identical x and z, so bounds alone cannot
     * tell the King's Tower's muniment room from the walk over its roof.
     * `feet` is the player's floor height, not the eye's.
     */
    inRoom(roomId, level, x, z, feet) {
      const r = planRooms.get(`${roomId}/${level ?? 0}`);
      if (!r) return false;
      if (x < r.bounds.min.x || x > r.bounds.max.x || z < r.bounds.min.z || z > r.bounds.max.z) return false;
      if (r.shape?.kind === 'disc' && Math.hypot(x - r.shape.cx, z - r.shape.cz) > r.shape.radius) return false;
      const cell = walk.cellAt(x, z, level ?? 0);
      return !!cell && Math.abs(cell.h - feet) <= 1.0;
    },

    /**
     * The cell centres to walk from one station to the next, or null when
     * there is no walk between them. A body already standing at its next
     * station gets a one-point path, which is how everyone who does not move
     * between two bells reads here.
     */
    route(from, to) {
      if (!from || !to) return null;
      return walk.path(from, to);
    },
  };
  return api;
}
