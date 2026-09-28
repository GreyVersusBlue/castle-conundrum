# towers.py - the towers stage: the eight drums, their floors and roofs, and
# their eighteen flights (increment 2).
#
# Snapped to the blueprint (#500). A drum is its `tower` piece's `drum` block:
# centre, radius, the interior radius it is hollow to, and `stone`, the plan's
# own stone per 15-degree sector as height intervals. That list already holds
# every door (a gap in a sector's intervals) and the crown (#514: the top of
# the even sectors at `crown.merlon` over the drum's height and the odd at
# `crown.crenel`), so the ring is drawn from it and computes neither. Each
# sector is an annular wedge per interval, its outer arc faceted at no more
# than 3.75 degrees, in the drum's `material` (#849).
#
# THE PLINTH. The outer face splays PLINTH[0] m at the foot over the bottom
# PLINTH[1] m, the drum's own batter beside the curtain's (walls.py).
#
# ARROW SLITS. One per storey (0, 4 and 8 m, SLIT_BASE over each) in every
# SLIT_EVERY-th sector whose stone covers the slit and a margin, unless the
# sector's outer face is buried in a curtain run's collider box: a real gap,
# SLIT wide at the outer face and SLIT_TALL tall, through the ring.
#
# FLOORS AND ROOFS. Each floor piece is the plan's disc (`disc`: cx, cz,
# radius) at its box's height, cut to the plan's colliders for it, which is
# where the stair well is. The four drums with no turret have that disc at
# 12 m as a flat roof (the `-roof` piece, stone_pavers) inside the crown. The
# four with a turret carry it on top, solid (#523), capping the drum at 12 m,
# with a cone of roof_slates_02 over it. The turret, its cap and its cone are
# faces of the drum's own object, so one object realises one drum and the
# break "delete a drum" is one delete.
#
# FLIGHTS. Each ramp as solid stone steps along its `slope` (from and to are
# the plan's [x, z, y]), about RISER high, across its box's width, in
# defense_wall, since the plan gives a flight no material of its own.

import math

import masonry
import materials
import common

PLINTH = (0.4, 2.0)          # outward splay at the foot, over this height
SLIT = 0.1                   # an arrow slit's width at the drum's outer face
SLIT_TALL = 1.2
SLIT_BASE = 1.0              # over each storey's floor
SLIT_MARGIN = 0.3            # stone the slit keeps above and below it
SLIT_EVERY = 3               # sectors between slits
STOREYS = (0.0, 4.0, 8.0)
RISER = 0.18
STAIR_MATERIAL = 'defense_wall'   # the plan's flights carry material null
ROOF_MATERIAL = 'roof_slates_02'
CONE = (0.35, 3.2)           # the cone's eave past the turret, and its height over the turret's top
DISC_FACETS = 96
EPS = 1e-6


def _buried(bp, walls, x, z):
    """True when plan point (x, z) is inside a walls-stage run's collider box."""
    for c in walls:
        b = c['box']
        if b['min']['x'] - EPS <= x <= b['max']['x'] + EPS and b['min']['z'] - EPS <= z <= b['max']['z'] + EPS:
            return True
    return False


def _wedge(solid, d, a0, a1, y0, y1, slot=0):
    cx, cz, r, inner = d['cx'], d['cz'], d['radius'], d['inner']
    n = len(masonry.arc(cx, cz, r, a0, a1))

    def ring(y):
        s = masonry.splay(y, *PLINTH)
        outer = masonry.arc(cx, cz, r + s, a0, a1)
        return outer + list(reversed(masonry.arc(cx, cz, inner, a0, a1)))
    assert n >= 2
    solid.prism(ring, masonry.levels(y0, y1, PLINTH[1]), slot)


def _minus(intervals, lo, hi):
    out = []
    for a, b in intervals:
        if b <= lo or a >= hi:
            out.append((a, b))
            continue
        if a < lo:
            out.append((a, lo))
        if b > hi:
            out.append((hi, b))
    return out


def build_drum(solid, bp, piece, walls):
    """The ring from the plan's per-sector stone, with its slits, and the
    turret and cone where it has one. Returns the number of slits."""
    d = piece['drum']
    stone, segments = d['stone'], d['segments']
    step = 360.0 / segments
    if len(stone) != segments:
        raise ValueError(f"towers: {piece['id']} has {len(stone)} stone sectors for {segments} segments")
    if not (0 < d['inner'] < d['radius']):
        raise ValueError(f"towers: {piece['id']} is not hollow (inner {d['inner']}, radius {d['radius']})")
    half = math.degrees(SLIT / 2 / d['radius'])
    slits = 0
    for i, intervals in enumerate(stone):
        a0, a1 = i * step, (i + 1) * step
        am = (a0 + a1) / 2
        cuts = []
        if i % SLIT_EVERY == 1:
            ox, oz = masonry.ring_point(d['cx'], d['cz'], d['radius'] + 0.5, am)
            if not _buried(bp, walls, ox, oz):
                for base in STOREYS:
                    lo, hi = base + SLIT_BASE, base + SLIT_BASE + SLIT_TALL
                    if any(a <= lo - SLIT_MARGIN and hi + SLIT_MARGIN <= b for a, b in intervals):
                        cuts.append((lo, hi))
        if not cuts:
            for a, b in intervals:
                _wedge(solid, d, a0, a1, a, b)
            continue
        slit_stone = list(intervals)
        for lo, hi in cuts:
            slit_stone = _minus(slit_stone, lo, hi)
        slits += len(cuts)
        for a, b in intervals:
            _wedge(solid, d, a0, am - half, a, b)
            _wedge(solid, d, am + half, a1, a, b)
        for a, b in slit_stone:
            _wedge(solid, d, am - half, am + half, a, b)

    t = d.get('turret')
    if t:
        # The cap the turret stands on, the drum's ceiling at 12 m inside the ring.
        top = d['height']
        cap = [masonry.ring_point(d['cx'], d['cz'], d['inner'], 360.0 * k / DISC_FACETS) for k in range(DISC_FACETS)]
        solid.prism(lambda y: cap, [top - 0.2, top])
        body = [masonry.ring_point(t['cx'], t['cz'], t['radius'], 360.0 * k / DISC_FACETS) for k in range(DISC_FACETS)]
        solid.prism(lambda y: body, [t['base'], t['base'] + t['height']])
        crown_top = t['base'] + t['height']
        solid.cone(t['cx'], t['cz'], t['radius'] + CONE[0], crown_top, crown_top + CONE[1], DISC_FACETS, slot=1)
    return slits


def build_floor(solid, bp, piece):
    """The plan's disc at the piece's height, cut to the piece's colliders."""
    disc, b = piece['disc'], piece['box']
    if not disc:
        raise ValueError(f"towers: floor {piece['id']} has no disc")
    circle = [masonry.ring_point(disc['cx'], disc['cz'], disc['radius'], 360.0 * k / DISC_FACETS) for k in range(DISC_FACETS)]
    parts = 0
    for c in masonry.colliders_of(bp, piece['id']):
        cb = c['box']
        poly = masonry.clip_rect(circle, cb['min']['x'], cb['max']['x'], cb['min']['z'], cb['max']['z'])
        if poly:
            solid.prism(lambda y, poly=poly: poly, [b['min']['y'], b['max']['y']])
            parts += 1
    if not parts:
        raise ValueError(f"towers: floor {piece['id']}'s colliders leave nothing of its disc")


def build_flight(solid, ramp):
    """Solid steps from the ramp's slope.from to slope.to, [x, z, y] each."""
    (fx, fz, fy), (tx, tz, ty) = ramp['slope']['from'], ramp['slope']['to']
    b = ramp['box']
    dx, dz, rise = tx - fx, tz - fz, ty - fy
    along_x = abs(dx) > abs(dz)
    if (abs(dx) > EPS) == (abs(dz) > EPS):
        raise ValueError(f"towers: {ramp['id']}'s slope is not along one axis")
    run = abs(dx) if along_x else abs(dz)
    n = max(1, round(rise / RISER))
    tread, riser = run / n, rise / n
    base = b['min']['y']
    for k in range(n):
        top = fy + (k + 1) * riser
        if along_x:
            a, c = fx + math.copysign(k * tread, dx), fx + math.copysign((k + 1) * tread, dx)
            solid.box(min(a, c), max(a, c), base, top, b['min']['z'], b['max']['z'])
        else:
            a, c = fz + math.copysign(k * tread, dz), fz + math.copysign((k + 1) * tread, dz)
            solid.box(b['min']['x'], b['max']['x'], base, top, min(a, c), max(a, c))
    return n, riser


def build(bp):
    col = common.stage_collection('towers')
    table = common.STAGE_OF(bp)
    mine = [p for p in bp['pieces'] if table[p['id']] == 'towers']
    drums = [p for p in mine if p['kind'] == 'tower']
    stairs = {p['id'] for p in mine if p['kind'] == 'stair'}
    floors = [p for p in mine if p['kind'] == 'floor']
    ramps = {r['id']: r for r in bp['ramps']}
    if stairs - set(ramps):
        raise ValueError(f"towers: stair piece(s) with no ramp: {sorted(stairs - set(ramps))}")
    walls = [c for p in bp['pieces'] if table[p['id']] == 'walls' and p['kind'] == 'wall'
             for c in masonry.colliders_of(bp, p['id'])]

    slits = 0
    for p in drums:
        s = masonry.Solid()
        slits += build_drum(s, bp, p, walls)
        mats = [materials.library(p['material'])]
        if p['drum'].get('turret'):
            mats.append(materials.library(ROOF_MATERIAL))
        s.finish(f"DRUM_{p['id']}", col, mats, plan_id=p['id'])
    for p in floors:
        s = masonry.Solid()
        build_floor(s, bp, p)
        s.finish(f"FLOOR_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id'])
    steps = []
    for rid in sorted(stairs):
        s = masonry.Solid()
        steps.append(build_flight(s, ramps[rid]))
        s.finish(f"FLIGHT_{rid}", col, [materials.library(STAIR_MATERIAL)], plan_id=rid, smooth_angle=5.0)

    turrets = sum(1 for p in drums if p['drum'].get('turret'))
    print(f"towers: {len(drums)} drums ({turrets} with a turret and cone, {len(drums) - turrets} with a flat roof), "
          f"{slits} slits, {len(floors)} floors and roofs, {len(steps)} flights of {min(n for n, _ in steps)} to "
          f"{max(n for n, _ in steps)} steps, risers {min(r for _, r in steps):.3f} to {max(r for _, r in steps):.3f} m")
