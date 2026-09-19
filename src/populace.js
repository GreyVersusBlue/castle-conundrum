// populace.js — the other people in the castle: who they are, where they stand
// at each of the four bells, and what they are doing while they stand there.
//
// The twelve in data/npcs.json are the mystery's. Every one of them holds a
// statement, a lie or a clue, and src/mystery.js refuses a schedule that puts
// one of them somewhere unreachable. The people in data/populace.json hold
// nothing. They are the household — the bakehouse, the well, the muster, the
// garden — and the only question anybody asks of them is whether the castle
// reads as lived in (BACKLOG.md rank 6, WISHLIST.md theme 1).
//
// A POPULACE STOP IS NOT A PLAN PIECE AND HAS NO `planId` (#500). Do not go
// looking for one of these tiles in src/castle-plan.js: the plan builds stone,
// and `test/plan-vs-scene.mjs` diffs the stone the plan computed against the
// stone the builder placed. A populace body is data the page spawns on top of
// the finished castle, the same way the twelve are, and what holds it honest
// is `validatePopulace` below against the plan's own walk grid.
//
// A ROUTINE IS A LOOP INSIDE A WATCH (#547, answer 3). The game's clock is the
// four bells the player rings and it does not move between them, so a populace
// body is not on a timetable: it is on a ring of stops it walks round and
// round until the next bell. `routine.prime` is a LIST, and a list of one is a
// body that stands still for the whole watch. That is what lets a boy fetch
// water again and again without a minute hand existing anywhere.
//
// WHY THE VALIDATOR IS HERE AND ITS SUITE IS test/mystery.mjs (#529).
// test/layout.mjs owns every fact derivable from the plan in Node and
// test/mystery.mjs owns the stations. Whether a tile is inside the room its
// stop names is not derivable from the plan alone — it needs the room list in
// data/mystery.json — so it is a station question, and it is asked beside the
// twelve's own.

import { STATION_CLEARANCE } from './stations.js';
import { EYE_HEIGHT } from './castle-plan.js';

/**
 * WHAT A BODY IS DOING AT A STOP, AND THE CLIP THE KIT ALREADY HAS FOR IT.
 *
 * The three bodies under assets/NPCs each ship the same 24 Quaternius clips,
 * and not one of them is a sweep, a stir, a hammer or a spar. So the first
 * increment of this row adds no clip and no asset (SPECS.md, "Life: a
 * populace"): the vocabulary below is deliberately restricted to jobs a body
 * does STANDING STILL, and every one of them resolves to one of three idle
 * variants. A baker at the oven and a boy waiting with a yoke really do look
 * like a person standing, which is why these five were the ones chosen and
 * `sweep`, `stir`, `hammer` and `spar` were not.
 *
 * The map is the validator's rail as well as the player's: an `activity` the
 * data uses and this object does not name is refused at load, because the
 * failure it would otherwise cause is silent — `pickClip` in src/npc.js
 * returns null for a clip nobody ships and the body stands there frozen,
 * which looks exactly like a body standing there idling.
 *
 * test/mystery.mjs reads the animation list out of each .glb on disk and
 * fails if any clip named here is missing from any body, because a typo in
 * this table is the same silent freeze one level up.
 */
export const ACTIVITY_CLIPS = {
  // Idle: hands empty, weight on both feet. The default body at rest.
  wait: 'Idle',
  haul: 'Idle',
  serve: 'Idle',
  // Idle_Neutral: a slower, smaller-amplitude stand. Reads as somebody who
  // is occupied with something in front of them rather than waiting on one.
  bake: 'Idle_Neutral',
  draw: 'Idle_Neutral',
  tend: 'Idle_Neutral',
  gossip: 'Idle_Neutral',
  // Idle_Sword: the stance with a weapon in hand. The garrison, and nobody
  // else — a gardener in this pose is a gardener holding a sword.
  guard: 'Idle_Sword',
  muster: 'Idle_Sword',
  /* THE HOUND'S TWO (#644). Hound.glb ships twelve clips off Quaternius's
   * animal rig and not one of them is a human's, so these two exist in one
   * body and `wait` exists in all five. The clip check in test/mystery.mjs
   * is per person against the body that person wears, not every clip
   * against every body, which is the change a second rig forced on it. */
  sniff: 'Idle_2_HeadLow',
  eat: 'Eating',
  /* THE HEN'S ONE (#684). Hen.glb is Quaternius's Farm Animals bird, five
   * clips off a seven-joint rig, and `Idle_Peck` is the head going to the
   * ground and back. `wait` is its Idle and `Run` is what it walks with. */
  peck: 'Idle_Peck',
};

/**
 * WHERE A HELD PROP LIVES (#685). The King's mace is a Poly Haven prop and
 * `heldProp` has always been read as a path under `polyhavenBase`. The
 * garrison's spear is not Poly Haven's — it is a Quaternius file under
 * `assets/NPCs/`, beside the bodies — so a `heldProp` that already starts
 * with `assets/` is repo-relative and is left alone. One function, used by
 * npc.js to load it, by test/assets.mjs to check it and by
 * tools/encode-assets.mjs to encode it, so the three cannot disagree about
 * which file is meant.
 */
export function heldPropPath(polyhavenBase, heldProp) {
  if (!heldProp) return null;
  return heldProp.startsWith('assets/') ? heldProp : polyhavenBase + heldProp;
}

/** How long a body stands at one stop before walking to the next, in seconds. */
export const DWELL = 9;

/**
 * Turn data/populace.json into the defs src/npc.js's NPC constructor takes.
 *
 * `populace: true` is what src/main.js keys the two differences off: a body
 * with no dialogue is not something to press E at, and its prompt is a label
 * rather than an offer. Neither is a name check — nothing anywhere knows one
 * of these ten by id, exactly as nothing knows one of the twelve by id.
 */
export function populaceDefs(populace) {
  return (populace?.people ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    modelPath: p.modelPath,
    // A body authored at a different height is normalised to it, not to
    // npc.js's 1.8 (#603): the women's pack is 1.65 and a populace woman
    // who left this line out would stand a head over the cook.
    modelHeight: p.modelHeight,
    tint: p.tint,
    hideNodes: p.hideNodes ?? [],
    hideMaterials: p.hideMaterials ?? [],
    // The three fields BACKLOG.md rank 10 added (#643), all optional and all
    // npc.js's: a bone scaled after the height, a clip named ahead of the
    // body's own list, and a pace. The child and the hound are what use them.
    boneScale: p.boneScale,
    clips: p.clips,
    speed: p.speed,
    // A held prop and how it sits in the hand (#685): the garrison's spear.
    // `heldProp` is the cast's field, resolved by `heldPropPath`; `heldPropFit`
    // is new and optional, {length, grip, tipUp}, and npc.js reads it.
    heldProp: p.heldProp,
    heldPropFit: p.heldPropFit,
    dialogue: {},
    populace: true,
    // The HUD's one line about them, and it does not say "Press E" because
    // pressing E does nothing. `role` is the whole of what the castle tells
    // the player about the household in this increment.
    prompt: p.role ? `${p.name} — ${p.role}` : p.name,
  }));
}

/** A stop's world point, on the same grid src/stations.js reads a station off. */
export function stopWorld(nav, stop) {
  if (!stop || !Array.isArray(stop.tile) || stop.tile.length !== 2) return null;
  const tile = nav.plan.tile;
  const level = stop.level ?? 0;
  const x = stop.tile[0] * tile, z = stop.tile[1] * tile;
  const cell = nav.walk.cellAt(x, z, level);
  return { x, z, level, h: cell ? cell.h : null, room: stop.room, activity: stop.activity, facing: stop.facing ?? null };
}

/**
 * Every routine in data/populace.json against the castle, the four bells and
 * the twelve. Returns a list of problems, empty when the file is good.
 *
 * `nav` is src/stations.js's castleNav over the same plan the builder uses.
 * Without it only the shape is checked, which is what a caller with no plan in
 * hand gets; src/main.js and test/mystery.mjs both pass one.
 */
export function validatePopulace(populace, { nav = null, mystery = {}, cast = [] } = {}) {
  const problems = [];
  const say = (m) => problems.push(m);
  if (!populace || typeof populace !== 'object') return ['populace is not an object'];

  const people = populace.people;
  if (!Array.isArray(people) || !people.length) return ['populace.people: no people in it'];

  const watches = mystery.watches ?? [];
  const rooms = new Map((mystery.rooms ?? []).map((r) => [`${r.id}/${r.level ?? 0}`, r]));
  const roomIds = new Set((mystery.rooms ?? []).map((r) => r.id));
  const castIds = new Set(cast.map((n) => n.id));
  const castTints = new Map(cast.map((n) => [String(n.tint).toLowerCase(), n.id]));

  /* --- 1: who they are. --- */
  const ids = new Set();
  const tints = new Map();
  for (const [i, p] of people.entries()) {
    const at = p?.id ? p.id : `people[${i}]`;
    if (!p || typeof p !== 'object') { say(`${at}: not an object`); continue; }
    if (typeof p.id !== 'string' || !p.id.trim()) say(`${at}: no id`);
    else if (ids.has(p.id)) say(`${p.id}: two people share that id`);
    else if (castIds.has(p.id)) say(`${p.id}: shares an id with one of the twelve in npcs.json, and src/main.js spawns both lists into one castle`);
    else ids.add(p.id);
    if (typeof p.name !== 'string' || !p.name.trim()) say(`${at}: no name, so the HUD's label over them would read "undefined"`);
    if (typeof p.modelPath !== 'string' || !p.modelPath.trim()) say(`${at}: no modelPath`);
    /* A TINT IS WHAT MAKES TWO BODIES OFF ONE MODEL TWO PEOPLE (#419), and
     * this row spends ten more tints on three bodies that already wear
     * thirteen. Sharing one with a suspect is the case that matters: a
     * populace body in the Steward's exact green, at the bell the player is
     * looking for the Steward, is a body the player walks up to and finds
     * has nothing to say. */
    if (!/^#[0-9a-f]{6}$/i.test(String(p.tint))) say(`${at}: tint ${JSON.stringify(p.tint)} is not a #rrggbb hex`);
    else {
      const key = String(p.tint).toLowerCase();
      if (castTints.has(key)) say(`${at}: wears the same tint as the ${castTints.get(key)}, one of the twelve`);
      else if (tints.has(key)) say(`${at}: wears the same tint as ${tints.get(key)}`);
      else tints.set(key, p.id ?? at);
    }
    /* THE THREE FIELDS RANK 10 ADDED (#643), each refused in the shape that
     * would fail silently on screen: a bone scale of 0 is a body with no
     * head, a speed of 0 is a body that never arrives and holds `walking`
     * true for the rest of the watch, and a follow with no radius is a dog
     * that follows from anywhere in the castle. */
    if (p.boneScale != null) {
      if (typeof p.boneScale !== 'object' || Array.isArray(p.boneScale)) say(`${at}: boneScale is not an object of bone name to scale`);
      else for (const [bone, s] of Object.entries(p.boneScale)) if (!(Number.isFinite(s) && s > 0)) say(`${at}: boneScale.${bone} is ${JSON.stringify(s)}, not a positive number`);
    }
    if (p.speed != null && !(Number.isFinite(p.speed) && p.speed > 0)) say(`${at}: speed ${JSON.stringify(p.speed)} is not a positive number of m/s`);
    if (p.clips != null && (typeof p.clips !== 'object' || Array.isArray(p.clips) || Object.values(p.clips).some((c) => typeof c !== 'string'))) say(`${at}: clips is not an object of npc.js clip key to clip name`);
    if (p.follow != null) {
      const f = p.follow;
      if (typeof f !== 'object' || !(Number.isFinite(f.radius) && f.radius > 0) || !(Number.isFinite(f.keep) && f.keep > 0)) say(`${at}: follow needs a positive radius and keep, in metres`);
      else if (f.keep >= f.radius) say(`${at}: follow.keep ${f.keep} is not inside follow.radius ${f.radius}, so it would never set off`);
    }
    /* A HELD PROP AND ITS FIT (#685). The path is a string test/assets.mjs
     * resolves to a file; the fit is refused in the shapes that fail
     * silently in a hand: a length of 0 is a prop scaled to nothing, and a
     * grip outside 0..1 is a hand holding the air past one end of it. */
    if (p.heldProp != null && (typeof p.heldProp !== 'string' || !p.heldProp.trim())) say(`${at}: heldProp ${JSON.stringify(p.heldProp)} is not a path`);
    if (p.heldPropFit != null) {
      const f = p.heldPropFit;
      if (typeof f !== 'object' || Array.isArray(f)) say(`${at}: heldPropFit is not an object of length, grip and tipUp`);
      else {
        if (f.length != null && !(Number.isFinite(f.length) && f.length > 0)) say(`${at}: heldPropFit.length ${JSON.stringify(f.length)} is not a positive number of metres`);
        if (f.grip != null && !(Number.isFinite(f.grip) && f.grip >= 0 && f.grip <= 1)) say(`${at}: heldPropFit.grip ${JSON.stringify(f.grip)} is not a fraction from 0 (the butt) to 1 (the tip)`);
        if (f.tipUp != null && typeof f.tipUp !== 'boolean') say(`${at}: heldPropFit.tipUp ${JSON.stringify(f.tipUp)} is not true or false`);
      }
      if (p.heldProp == null) say(`${at}: heldPropFit with no heldProp to fit`);
    }
  }

  /* --- 2: the routine's shape, and the activity vocabulary. --- */
  for (const p of people) {
    const who = p?.id ?? '?';
    const routine = p?.routine;
    if (!routine || typeof routine !== 'object') { say(`${who}: no routine`); continue; }
    for (const extra of Object.keys(routine)) {
      if (!watches.includes(extra)) say(`${who}: routine names ${JSON.stringify(extra)}, which is not one of the four bells`);
    }
    for (const w of watches) {
      const stops = routine[w];
      /* AN ABSENT WATCH IS A BODY THAT IS NOT IN THE CASTLE, and that is
       * allowed and is said out loud here rather than left to be inferred:
       * src/main.js hides the body, the same answer it gives the merchant
       * before Terce. A watch written as an EMPTY list is not that; it is a
       * routine somebody started and did not finish, and it reads on screen
       * as a body that vanishes for one bell for no reason. */
      if (stops == null) continue;
      if (!Array.isArray(stops)) { say(`${who}: routine.${w} is not a list of stops`); continue; }
      if (!stops.length) { say(`${who}: routine.${w} is an empty list — leave the watch out to keep them out of the castle, or give them a stop`); continue; }
      for (const [i, s] of stops.entries()) {
        const at = `${who} at ${w}, stop ${i + 1}`;
        if (!s || typeof s !== 'object') { say(`${at}: not an object`); continue; }
        if (!Array.isArray(s.tile) || s.tile.length !== 2 || !s.tile.every((n) => Number.isFinite(n))) say(`${at}: tile ${JSON.stringify(s.tile)} is not two numbers`);
        if (typeof s.room !== 'string' || !roomIds.has(s.room)) { say(`${at}: room ${JSON.stringify(s.room)} is not a room in mystery.json`); continue; }
        if (!rooms.has(`${s.room}/${s.level ?? 0}`)) say(`${at}: ${s.room} is not on level ${s.level ?? 0}`);
        if (!ACTIVITY_CLIPS[s.activity]) say(`${at}: activity ${JSON.stringify(s.activity)} is one src/npc.js has no clip for — pick from ${Object.keys(ACTIVITY_CLIPS).join(', ')}`);
        if (s.facing != null && !Number.isFinite(s.facing)) say(`${at}: facing ${JSON.stringify(s.facing)} is not a number of degrees`);
      }
    }
  }

  if (!nav) return problems;

  /* --- 3: the stops against the castle.
   *
   * THE SAME FIVE QUESTIONS validateMystery ASKS OF A STATION, minus the one
   * that does not apply and plus the one a loop brings with it. There is
   * floor there; it is inside the room the stop names; two bodies are not
   * standing in each other; and there is a walk from each stop to the next.
   * What is dropped is the bars: nobody in this file is behind them, so every
   * stop asks for the floor itself rather than for talking range of it.
   *
   * THE ROOM CHECK IS `roomAt` AND NOT `inNamedRoom`, which is the one place
   * this validator is stronger than the twelve's. `inNamedRoom` answers null
   * for the four open rooms — the two wards, the barbican and the garden have
   * no bounds to be inside of — and six of the ten below stand in open ground
   * for at least one bell. `roomAt` settles it the way the HUD's own room line
   * settles it (#515): a disc beats a box, and open ground is read off the
   * three gates. So a stop that says `inner-ward` and lands west of the
   * porter gate is caught, and under `inNamedRoom` it would not have been. */
  const worlds = new Map(); // "id/watch" -> [{x, z, level, h, ...}]
  for (const p of people) {
    const who = p?.id ?? '?';
    for (const w of watches) {
      const stops = p?.routine?.[w];
      if (!Array.isArray(stops) || !stops.length) continue;
      const points = [];
      for (const [i, s] of stops.entries()) {
        const at = `${who} at ${w}, stop ${i + 1}`;
        const point = stopWorld(nav, s);
        if (!point) continue; // the shape pass already said so
        if (point.h == null) { say(`${at}: tile (${s.tile.join(', ')}) on level ${point.level} has no floor to stand on`); continue; }
        const here = nav.roomAt(point.x, point.z, point.h);
        if (here.id !== s.room || here.level !== (s.level ?? 0)) {
          say(`${at}: tile (${s.tile.join(', ')}) is in ${here.id} on level ${here.level}, not in ${s.room} on level ${s.level ?? 0}`);
        }
        if (!nav.walkable(point)) say(`${at}: tile (${s.tile.join(', ')}) in ${s.room} is floor the player cannot walk to, so nobody would ever see them there`);
        points.push({ ...point, at, index: i });
      }
      worlds.set(`${who}/${w}`, points);

      /* A RING HAS TO CLOSE. Stop 3 walks back to stop 1, so the wrap is
       * checked like any other leg; a body whose last stop cannot reach its
       * first walks the loop once and then teleports, once per watch, for as
       * long as the player stands there. A ring of one has no legs at all. */
      if (points.length > 1) {
        for (let i = 0; i < points.length; i++) {
          const a = points[i], b = points[(i + 1) % points.length];
          if (!nav.route(a, b)) say(`${who} at ${w}: no walk from stop ${a.index + 1} in ${a.room} to stop ${b.index + 1} in ${b.room}`);
        }
      }
    }
    /* AND SO DOES THE BELL ITSELF. The last stop of one watch is where the
     * body is standing when the player rings; the first stop of the next is
     * where it is due. src/main.js routes between exactly those two points,
     * and a pair with no walk between them is a body that slides through a
     * wall in front of whoever rang the bell. */
    let previous = null, previousWatch = null;
    for (const w of watches) {
      const points = worlds.get(`${p?.id}/${w}`) ?? [];
      if (!points.length) { previous = null; previousWatch = null; continue; }
      if (previous && !nav.route(previous, points[0])) {
        say(`${p?.id}: no walk from where ${previousWatch} left them in ${previous.room} to their first stop at ${w} in ${points[0].room}`);
      }
      previous = points[points.length - 1]; previousWatch = w;
    }
  }

  /* --- 4: nobody stands inside anybody else.
   *
   * EVERY STOP AGAINST EVERY STOP, WHICH IS ON PURPOSE CONSERVATIVE. Two
   * bodies walking rings inside one watch have no phase anybody can compute —
   * DWELL is the same for all of them but the walks between stops are not the
   * same length, so two rings that share a tile WILL eventually share it at
   * the same moment. Asking whether two rings ever come within
   * STATION_CLEARANCE of each other, rather than whether they do so at some
   * particular instant, is the only version of this question that has an
   * answer. It costs the data a little room and buys the castle bodies that
   * never stand inside one another.
   *
   * The twelve are in here too, and they are compared as the single station
   * they are: a populace stop 1.2 m from where the cook is due at Sext is a
   * body wearing the cook at the bell the player came to find her. */
  for (const w of watches) {
    const mine = [];
    for (const p of people) for (const point of worlds.get(`${p?.id}/${w}`) ?? []) mine.push({ who: p?.id, label: `stop ${point.index + 1}`, point });
    const theirs = [];
    for (const n of cast) {
      const point = nav.at(n.id, w);
      if (point && point.h != null) theirs.push({ who: n.id, label: `station`, point });
    }
    const gapOf = (a, b) => (a.level !== b.level ? Infinity : Math.hypot(a.x - b.x, a.z - b.z));
    for (let i = 0; i < mine.length; i++) {
      for (let j = i + 1; j < mine.length; j++) {
        if (mine[i].who === mine[j].who) continue;
        const gap = gapOf(mine[i].point, mine[j].point);
        if (gap < STATION_CLEARANCE) say(`${mine[i].who}'s ${mine[i].label} and ${mine[j].who}'s ${mine[j].label} at ${w} are ${gap.toFixed(2)} m apart, inside the ${STATION_CLEARANCE} m two bodies need`);
      }
      for (const other of theirs) {
        const gap = gapOf(mine[i].point, other.point);
        if (gap < STATION_CLEARANCE) say(`${mine[i].who}'s ${mine[i].label} at ${w} is ${gap.toFixed(2)} m from the ${other.who}'s station, inside the ${STATION_CLEARANCE} m two bodies need`);
      }
    }
  }

  return problems;
}

/**
 * The thing that makes the ten move: one ring per body per watch, walked at
 * DWELL seconds a stop.
 *
 * NO three.js IN HERE, DELIBERATELY. Everything this touches is an NPC's own
 * public surface — `placeAt`, `walkTo`, `playActivity`, `walking` — and a
 * world point is `{x, z, h}`. That is what lets src/mystery.js's suite import
 * the validator above without pulling a renderer into Node, and the driver
 * stays beside the validator rather than in a third file (#529's shape: the
 * data, its rail and its engine in one place).
 *
 * THE RINGS ARE STAGGERED, AND NOT RANDOMLY. Ten bodies given the same dwell
 * at the same bell step off together, which reads as a parade rather than as a
 * household; ten bodies given `Math.random()` read differently on every load
 * and cannot be asserted about at all. The offset is the body's own index, so
 * the castle is the same castle twice and nobody moves in lockstep.
 */
export class Populace {
  constructor({ people, npcs, nav, dwell = DWELL }) {
    this.nav = nav;
    this.dwell = dwell;
    const byId = new Map(npcs.map((n) => [n.id, n]));
    this.bodies = people
      .filter((p) => byId.has(p.id))
      .map((p, i) => ({
        person: p,
        npc: byId.get(p.id),
        stops: [],
        index: 0,
        timer: 0,
        // 0, 0.37, 0.74, 0.11, ... of a dwell: ten offsets that do not repeat
        // inside ten and do not need a generator to reproduce.
        phase: (i * 0.37) % 1,
        settled: false,
      }));
  }

  /**
   * Put everybody where the bell says they are. `walk: false` is a load or a
   * reload — the castle is already at this watch and nobody should be seen
   * crossing it to get there — and is the same flag src/main.js passes the
   * twelve for the same reason.
   */
  setWatch(watch, { walk = true } = {}) {
    for (const body of this.bodies) {
      const stops = (body.person.routine?.[watch] ?? [])
        .map((s) => stopWorld(this.nav, s))
        .filter((p) => p && p.h != null);
      body.stops = stops;
      body.index = 0;
      body.settled = false;
      body.timer = this.dwell * (0.5 + body.phase);
      if (!stops.length) { body.npc.group.visible = false; continue; }
      const to = stops[0];
      const from = body.npc.group.visible
        ? { x: body.npc.group.position.x, z: body.npc.group.position.z, level: to.level }
        : null;
      body.npc.group.visible = true;
      const route = walk && from ? this.nav.route(from, to) : null;
      if (route && route.length > 1) body.npc.walkTo(route);
      else this._arrive(body);
    }
  }

  /**
   * Called every frame from src/main.js's loop, after the bodies' own update.
   * `player` is the camera's position, and only a body with `follow` reads it.
   */
  update(dt, player = null) {
    for (const body of this.bodies) {
      if (!body.stops.length || !body.npc.group.visible) continue;
      if (body.person.follow && player && this._follow(body, player, dt)) continue;
      if (body.npc.walking) { body.settled = false; continue; }
      if (!body.settled) { this._arrive(body); continue; }
      if (body.stops.length < 2) continue;
      body.timer -= dt;
      if (body.timer > 0) continue;
      const from = { x: body.npc.group.position.x, z: body.npc.group.position.z, level: body.stops[body.index].level };
      body.index = (body.index + 1) % body.stops.length;
      const route = this.nav.route(from, body.stops[body.index]);
      body.timer = this.dwell;
      if (route && route.length > 1) { body.npc.walkTo(route); body.settled = false; }
      else this._arrive(body);
    }
  }

  /**
   * THE HOUND (#644, and the one behaviour SPECS.md's "Bodies" asks of a dog).
   * A body with `follow: {radius, keep}` leaves its ring when the player
   * comes within `radius` metres of it on a floor it can walk to, trots to
   * `keep` metres short of them along the grid, turns to face them, and
   * goes back to the stop it left when they are gone. Returns true while it
   * is the player and not the ring that has the body, so `update` above
   * leaves the ring's timer alone.
   *
   * NO PATH IS WALKED OFF THE GRID. The route is `nav.route` to the cell the
   * player is standing in, cut short at `keep`, so a dog following through a
   * doorway is a dog that took the doorway. A player somewhere the grid has
   * no cell for — the wall walk's stair, mid-jump, out past the barbican —
   * is a player the dog cannot reach, and it stays where it is rather than
   * sliding through a wall to get there. Re-routed at most every half
   * second, because the player moves every frame and a route is a search.
   */
  _follow(body, player, dt) {
    const f = body.person.follow;
    const me = body.npc.group.position;
    const gap = Math.hypot(player.x - me.x, player.z - me.z);
    const feet = player.y - EYE_HEIGHT;
    const there = this.nav.roomAt(player.x, player.z, feet);
    body.reroute = (body.reroute ?? 0) - dt;
    // Two metres of hysteresis on the way out, so a player standing right on
    // the radius does not make a dog that sets off and turns back each frame.
    const near = gap <= (body.following ? f.radius + 2 : f.radius);
    if (near && Math.abs(feet - me.y) < 2.5) {
      if (gap <= f.keep + 0.3) {
        // Close enough: stop where it is, and look at them.
        if (body.npc.walking) body.npc.walkTo([]);
        body.npc.facePlayer(player);
        body.npc.playActivity('wait');
        body.following = true;
        return true;
      }
      if (body.reroute <= 0) {
        body.reroute = 0.5;
        const from = { x: me.x, z: me.z, level: body.level ?? body.stops[body.index].level };
        const to = { x: player.x, z: player.z, level: there.level };
        const route = this.nav.route(from, to);
        if (route && route.length > 1) {
          // Stop `keep` short of the player: drop the cells inside that ring.
          const cut = route.filter((c, i) => i === 0 || Math.hypot(player.x - c.x, player.z - c.z) > f.keep);
          if (cut.length > 1) { body.npc.walkTo(cut); body.level = cut[cut.length - 1].level; }
          body.following = true;
          body.settled = false;
          return true;
        }
      }
      if (body.following) return true;
      return false;
    }
    if (!body.following) return false;
    // The player is gone: back to the stop this body left, along the grid.
    body.following = false;
    const stop = body.stops[body.index];
    const route = this.nav.route({ x: me.x, z: me.z, level: body.level ?? stop.level }, stop);
    body.level = stop.level;
    if (route && route.length > 1) { body.npc.walkTo(route); body.settled = false; }
    else this._arrive(body);
    return false;
  }

  /** Standing at the stop it is on: on the floor, facing, and doing the job. */
  _arrive(body) {
    const stop = body.stops[body.index];
    body.npc.placeAt({ x: stop.x, y: stop.h, z: stop.z, facing: stop.facing == null ? null : (stop.facing * Math.PI) / 180 });
    body.npc.playActivity(stop.activity);
    body.timer = this.dwell * (body.settled ? 1 : 0.5 + body.phase);
    body.settled = true;
  }
}
