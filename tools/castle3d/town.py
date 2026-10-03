# town.py - the town stage: Mereford, the town wall and its trees, and Wykes's
# yard (increment 5, #857, #858).
#
# Snapped to the blueprint (#500), and reading nothing else: never another
# stage's objects, which is what lets `--only town` build alone. Every number
# is the blueprint's or a named constant below, from SPECS.md's increment 5
# open calls, in the game's frame. The 59 pieces STAGE_OF gives this stage
# from 7b (#957, #958) are carried by 42 objects' planId or planIds. What departs from a piece's box
# inside an object that carries its planId (a jetty, a chimney, a roof above
# its pitch boxes) is held in a named constant citing #857; what realises no
# piece (the town gates' leaves) carries modelOnly "#857" and no planId.
#
# WHICH PIECE IS WHICH, by rule, and a piece no rule takes raises, naming it:
# RUNS, HOUSES and CHURCH by id; CROSS by id; a deck is any other wall with no
# collider of its own; a pitch is a decor whose id ends -pitch or -pitch-<n>,
# and it belongs to the one wall piece whose box top is its foot and whose
# plan rectangle holds it; the trees, barrels and crate by their model's file.
#
# THE RUNS (WALL_<id>). walls.build_run on the plan's colliders, unbattered, so
# the two town gates are the plan's openings exactly (#705: no parapet). Each
# gate takes LEAVES_<run id>: two open oak leaves against the passage sides,
# hinged LEAF_HINGE_IN inside the run's outer face.
#
# THE HOUSES (HOUSE_<id>, ROOF_<id>). A solid (#703), two storeys, jettied to
# the street; each house draws from random.Random("town:<id>") in a fixed
# order (frame, jetty, tint, door bay, windows, chimney), so a house's look
# does not move when another's does. Plaster FRAME_PROUD inside the plan box,
# a rough_wood box frame flush with it, shut doors and shutters. The rear face
# is found from the road; the jetty code alone moves the street face.
#
# THE ROOFS (ROOF_<wall id>). Thatch everywhere (#857, "tatch everywhere"):
# the steeper of the pitches' own and THATCH_MIN_PITCH, the underside through
# the walls' outer top arrises at the pitches' foot, THATCH thick, THATCH_EAVE
# eaves, VERGE verges stopped at any other wall piece's box, a ridge roll. A
# house's jetty or street eave past the road's edge raises.
#
# THE CHURCH (CHURCH_<id>). Solids with openings recessed RECESS into the
# stone, pointed by two chords, the recesses in materials.dressing().
#
# THE REST. The shed's deck and the yard floor as their boxes; the cross, the
# barrels and the crate generated to their boxes; the trees are terrain's
# tree_small_02 template (terrain._APPENDED), TOWN_TREE_METRES tall, and a
# tree's box meeting any other object's the stage built raises.
#
# THE QUAY (7b, #956, #957). TOLL_quay-toll-house, a box solid in its own
# stone, with DOOR_quay-toll-house (modelOnly "#957") on its road face;
# ROOF_quay-toll-house-roof, the plan's gable (`built`, `ridge`) and nothing
# more, slopes in TOLL_ROOF's slate and its ends in its stone; DOCK_quay-front,
# one box over the eight dock pieces, which must tile it, its top in the quay
# floor's paving; BANK_quay-bank-north and -south in the terrain's mud; and
# WATER_quay-water, the plan's slab in materials.water(). Each is held to its
# box (the dock to the union) on every face. The crane is props.py's (#958).

import math
import os
import random
import re

import bpy
from mathutils import Matrix, Vector

import common
import masonry
import materials
import terrain
import walls
from buildings import (BOX_TOLERANCE, EVERY_FACE, GABLE, GROUND_Y, ROOF_BOARDS, TIMBER, check_box, openings)
from materials import DRESSED

EPS = 1e-6
MODEL_ONLY = '#857'

# Which piece is which.
RUNS = r'^(town-wall|wykes-yard-)'
HOUSES = r'^mereford-house-'
CHURCH = r'^mereford-church-(nave|tower)$'
CROSS = 'mereford-churchyard-cross'
PITCH = r'-pitch(-\d+)?$'
MODELS = {'tree-large.glb': 'tree', 'barrels.glb': 'barrels', 'detail-crate.glb': 'crate'}
ROAD = 'outside-road'
OAK, IRON = 'oak', 'iron'                    # through materials.ALIAS
BOARDS_SET = 'wood_planks'                   # the crate's panels

# The roofs (#857): thatch at 50 degrees, not the kit's 33.7 slate pitch.
THATCH_MIN_PITCH = 50.0                      # degrees; a roof takes the steeper of this and its pitches'
THATCH = 0.45                                # thick, measured vertically
THATCH_EAVE = 0.4                            # out from each wall line
VERGE = 0.3                                  # past each gable end, stopped at another wall piece's box
ROLL = (12, 0.22, 0.05)                      # the ridge roll's facets, radius, centre under the ridge top

# The house (#857): a solid, two storeys, jettied, framed.
FRAME_PROUD = 0.05                           # the plaster this far inside the box; timber flush with it
MEMBER = 0.1                                 # every frame member's depth from the box face inward
PLINTH = 0.3                                 # the full box, y 0 to this, in DRESSED
FIRST = 2.6                                  # the first floor: the jetty's foot
EAVES_Y = 5.0                                # the wall plate's top, the plan box's top
JOIST = (0.15, 0.5, 0.25, 2.45)              # square, centres, first in from each end, foot y
BAY = 2.0
POST = 0.2                                   # wide at a bay line, square at a corner
SILL_BEAM = (0.3, 0.5)
HEAD_RAIL = (2.4, 2.6)
BRESSUMER = (2.6, 2.85)                      # the street face's upper foot, at the jetty
GIRDING = (2.6, 2.8)                         # the other three faces' upper foot
WALL_PLATE = (4.8, 5.0)
MID_RAIL = {'ground': (1.35, 1.55), 'upper': (3.7, 3.9)}
BRACE = (0.15, 0.9)                          # wide, and how far along its foot lands on the mid rail
CLOSE = (0.15, 0.5)                          # a close frame's stud width and centres
KING_POST = 0.2
DOOR = (1.0, 2.0, 0.03)                      # wide, tall (from the plinth's top), out from the plaster
DOOR_HEAD = (2.3, 2.45)
DOOR_STRAP = (0.06, 0.01, (0.4, 1.8), 0.8)   # tall, proud of the leaf, over the threshold, of the width
WINDOW = {'ground': (0.8, 1.0, 1.8), 'upper': (0.8, 3.4, 4.3), 'gable': (0.6, 3.5, 4.2)}  # wide, sill, head
WINDOW_TIMBER = (0.1, 0.2)                   # the sill and head timbers' height, and their width over the opening's
SHUTTER = (0.005, 0.03)                      # each half the width less this, and out from the plaster
CHIMNEY = (0.8, 0.9, 1.0)                    # square, its centre in from the gable, over its ridge top
# The houses' four washes on LOOK's cream (#861): limewash, yellow ochre, red
# ochre and unwashed grey daub, 9.2 to 15.7 apart in CIE dE76 and stepping down
# in L* (46.6, 42.8, 40.2, 37.7). Four, since the draw is rng.randrange(4) and six
# would move every later draw. TINT_APART is the rail: #857's four had their
# closest pair 0.089 apart as RGB triples and read as one terrace; these, 0.179.
PLASTER_TINTS = [(1.0, 1.0, 1.0), (1.0, 0.80, 0.48), (0.95, 0.66, 0.58), (0.60, 0.64, 0.66)]
TINT_APART = 0.15
_near = min(((math.dist(a, b), i, j) for i, a in enumerate(PLASTER_TINTS)
             for j, b in enumerate(PLASTER_TINTS) if i < j), default=None)
if _near is not None and _near[0] < TINT_APART:
    _d, _i, _j = _near
    raise ValueError(f"town: PLASTER_TINTS {_i} {PLASTER_TINTS[_i]} and {_j} {PLASTER_TINTS[_j]} are "
                     f"{_d:.3f} apart, under TINT_APART {TINT_APART}")

# The church (#857): recessed openings, (width, sill, springing, apex).
RECESS = 0.3
LANCET = (0.7, 2.2, 4.6, 5.2)
EAST_WINDOW = (1.4, 2.4, 5.2, 6.2)
NAVE_DOOR = (1.4, 0.0, 2.4, 3.1)
BELFRY = (0.5, 12.8, 13.9, 14.3)
DOOR_OFF = 0.06                              # the nave door's leaf off the core
CHURCH_OPENINGS = {
    'mereford-church-nave': {'north': [(LANCET, -96), (LANCET, -92), (LANCET, -88)],
                             'south': [(LANCET, -93), (LANCET, -89), (NAVE_DOOR, -97)],
                             'east': [(EAST_WINDOW, -18)]},
    'mereford-church-tower': {f: [(BELFRY, None)] for f in ('north', 'south', 'east', 'west')},
}

# The town gates' leaves (#857, model only).
LEAF = (0.1, 0.02, 0.3, 0.1)                 # thick, off the passage side, hinge in from the outer face, under the head
LEAF_STRAP = (0.08, 0.01, (1.0, 4.2), 0.8)   # tall, proud, centre heights, of the leaf's length from the hinge

# The cross, the barrels, the crate (#857, generated to their boxes).
CROSS_STEPS = ((0.8, 0.0, 0.3), (0.55, 0.3, 0.6))   # square, foot, top
CROSS_SHAFT = (0.3, 0.6, 4.0)
CROSS_ARM = 0.8                              # along x
CROSS_ARM_Y = (3.2, 3.45, 0.3)               # foot, top, depth in z
BARREL = (16, 0.8, (0.0, 0.10, 0.16, 0.5, 0.84, 0.90, 1.0), ((0.10, 0.16), (0.84, 0.90)))
CRATE = (0.06, 0.02)                         # the battens' square, the panels' inset

# The trees (#857): terrain's template, at town height.
TREE_ASSET = 'tree_small_02'
TOWN_TREE_METRES = (4.0, 4.6)
TREE_SINK = 0.05                             # as terrain's trees

# The quay (7b, #956, #957), each piece by id; a quay piece no rule takes falls
# to `other` and raises, as every town piece does.
TOLL = 'quay-toll-house'                     # a box solid in its own material
TOLL_ROOF = ('slate', 'medieval_blocks_02')  # the gable's slopes, through ALIAS, and its two ends (#957)
TOLL_DOOR = 'max z'                          # the road face, where DOOR's shut leaf stands (#957)
TOLL_ONLY = '#957'
DOCK = r'^quay-dock-(side-\d+|corner-(north|south))$'
DOCK_STONE = ('medieval_blocks_02', 'stone_pavers')  # its faces, the toll-house's stone; its top, the quay floor's
DOCK_TILE = 0.01                             # m2 on the area sum, and metres of overlap, the eight may differ by
BANK = r'^quay-bank-(north|south)$'
BANK_GROUND = 'mud'                          # materials.GROUND's, the terrain's mud; no forest_ground_06 (#957)
RIVER = 'quay-water'                         # the plan's water slab, MAT_water (#956)


# ------------------------------------------------------------------ helpers --
def _overlap(a, b):
    return all(min(a['max'][k], b['max'][k]) - max(a['min'][k], b['min'][k]) > EPS for k in 'xyz')


def _gap(a, b):
    """The distance between two boxes, 0 when they meet."""
    return math.sqrt(sum(max(0.0, a['min'][k] - b['max'][k], b['min'][k] - a['max'][k]) ** 2 for k in 'xyz'))


def _box(x0, x1, y0, y1, z0, z1):
    return {'min': {'x': x0, 'y': y0, 'z': z0}, 'max': {'x': x1, 'y': y1, 'z': z1}}


def _tight(ob):
    """The object's world bounding box from its vertices through matrix_world,
    as a game box: a turned tree's own canopy, not its local box's corners."""
    mw = ob.matrix_world
    pts = [mw @ v.co for v in ob.data.vertices]
    return _box(min(q.x for q in pts), max(q.x for q in pts), min(q.z for q in pts), max(q.z for q in pts),
                min(-q.y for q in pts), max(-q.y for q in pts))


def _has_col(bp, pid):
    return any(c['id'] == pid or (c['id'].startswith(pid + '-') and c['id'][len(pid) + 1:].isdigit())
               for c in bp['colliders'])


def _bits(flags):
    return ''.join('W' if f else '-' for f in flags)


class Face:
    """A vertical face of a house: normal axis `n` ('z' or 'x'), the plane `P`
    (the box face, where the timbers are flush), `inn` the sign into the house,
    and the span `lo` to `hi` along it. Depths are measured from P inward."""

    def __init__(self, n, P, inn, lo, hi):
        self.n, self.P, self.inn, self.lo, self.hi = n, P, inn, lo, hi

    def box(self, s, a0, a1, y0, y1, d0, d1, slot):
        c0, c1 = sorted((self.P + self.inn * d0, self.P + self.inn * d1))
        a0, a1 = sorted((a0, a1))
        if self.n == 'z':
            s.box(a0, a1, y0, y1, c0, c1, slot)
        else:
            s.box(c0, c1, y0, y1, a0, a1, slot)

    def poly(self, s, pts, d0, d1, slot):
        c0, c1 = sorted((self.P + self.inn * d0, self.P + self.inn * d1))
        s.plate(pts, c0, c1, slot=slot, axis='z' if self.n == 'z' else 'x')


# ------------------------------------------------------------ the house draws --
def draws(pid):
    """The house's draws, one call each in SPECS' order, from its own
    random.Random("town:<id>") and never the global random (#840)."""
    rng = random.Random(f"town:{pid}")
    d = {'frame': rng.choice(('square', 'close')), 'jetty': rng.choice((0.3, 0.45, 0.6)),
         'tint': rng.randrange(4), 'door': rng.randrange(4)}
    d['drew'] = d['tint']
    d['ground_street'] = [rng.random() < 0.5 for _ in range(4)]
    d['upper_street'] = [rng.random() < 0.6 for _ in range(4)]
    d['ground_rear'] = [rng.random() < 0.35 for _ in range(4)]
    d['upper_rear'] = [rng.random() < 0.4 for _ in range(4)]
    d['gables'] = [rng.random() < 0.5 for _ in range(2)]
    d['chimney'] = rng.choice((None, 'west', 'east'))
    d['ground_street'][d['door']] = False
    if not any(d['upper_street']):
        d['upper_street'][(d['door'] + 2) % 4] = True
    return d


def fix_tints(houses, road_z, looks):
    """Going west from the gate along each row, a house whose tint equals the
    house before it takes the next."""
    for north in (True, False):
        row = sorted((p for p in houses if ((p['box']['min']['z'] + p['box']['max']['z']) / 2 < road_z) == north),
                     key=lambda p: -p['box']['max']['x'])
        for a, b in zip(row, row[1:]):
            if looks[b['id']]['tint'] == looks[a['id']]['tint']:
                looks[b['id']]['tint'] = (looks[b['id']]['tint'] + 1) % 4


# ---------------------------------------------------------------- the frame --
def lines_of(face):
    n = max(1, round((face.hi - face.lo) / BAY))
    step = (face.hi - face.lo) / n
    return [face.lo + step * k for k in range(n + 1)]


def bay_edges(lines, k):
    """A bay's clear span between its posts' inner edges."""
    left = lines[k] + (POST if k == 0 else POST / 2)
    right = lines[k + 1] - (POST if k + 1 == len(lines) - 1 else POST / 2)
    return left, right


def build_frame(s, face, rails, frame, opens, long_face, door=None):
    """The box frame on one face of one storey: rails (bottom, top, mid) as
    (y0, y1); posts at the bay lines (corners, 0.2 square, on a long face
    only, so a corner is built once); a square frame's mid rails and end-bay
    braces, left out of a bay holding an opening; a close frame's studs on a
    long face. `opens` is {bay: (lo, hi, sill, head)}; `door` (lo, hi) splits
    the sill beam. Slot 1, TIMBER."""
    bottom, top, mid = rails
    lines = lines_of(face)
    n = len(lines) - 1
    # rails, the sill beam split round a door's leaf
    spans = [(face.lo, face.hi)]
    if door is not None:
        spans = [(face.lo, door[0]), (door[1], face.hi)]
    for a, b in spans:
        face.box(s, a, b, bottom[0], bottom[1], 0, MEMBER, 1)
    face.box(s, face.lo, face.hi, top[0], top[1], 0, MEMBER, 1)
    # posts, full storey height
    for k, x in enumerate(lines):
        if k in (0, n):
            if long_face:
                a = x if k == 0 else x - POST
                face.box(s, a, a + POST, bottom[0], top[1], 0, POST, 1)
        else:
            face.box(s, x - POST / 2, x + POST / 2, bottom[0], top[1], 0, MEMBER, 1)
    if frame == 'square' or not long_face:
        for k in range(n):
            if k in opens:
                continue
            left, right = bay_edges(lines, k)
            face.box(s, left, right, mid[0], mid[1], 0, MEMBER, 1)
            for end, (ax, sign) in ((0, (left, 1)), (n - 1, (right, -1))):
                if k != end:
                    continue
                A = (ax, top[0])
                B = (ax + sign * min(BRACE[1], right - left), mid[1])   # never past its bay
                dx, dy = B[0] - A[0], B[1] - A[1]
                ln = math.hypot(dx, dy)
                px, py = -dy / ln * BRACE[0] / 2, dx / ln * BRACE[0] / 2
                face.poly(s, [(A[0] + px, A[1] + py), (B[0] + px, B[1] + py), (B[0] - px, B[1] - py),
                              (A[0] - px, A[1] - py)], 0, MEMBER, 1)
    else:
        for k in range(n):
            count = max(1, round((lines[k + 1] - lines[k]) / CLOSE[1]))
            for j in range(1, count):
                c = lines[k] + CLOSE[1] * j
                a, b = c - CLOSE[0] / 2, c + CLOSE[0] / 2
                parts = [(bottom[1], top[0])]
                if k in opens:
                    lo, hi, sill, head = opens[k]
                    if sill is None:                       # the door
                        if min(b, hi) - max(a, lo) > EPS:
                            parts = [(DOOR_HEAD[1], top[0])]
                    elif min(b, hi + WINDOW_TIMBER[0]) - max(a, lo - WINDOW_TIMBER[0]) > EPS:
                        parts = [(bottom[1], sill - WINDOW_TIMBER[0]), (head + WINDOW_TIMBER[0], top[0])]
                for y0, y1 in parts:
                    if y1 - y0 > EPS:
                        face.box(s, a, b, y0, y1, 0, MEMBER, 1)
    return lines


def build_window(s, face, c, spec):
    """A shut window centred at `c`: sill and head timbers flush with the box
    face (slot 1) and two oak shutters out from the plaster (slot 3)."""
    w, sill, head = spec
    th, over = WINDOW_TIMBER
    face.box(s, c - (w + over) / 2, c + (w + over) / 2, sill - th, sill, 0, MEMBER, 1)
    face.box(s, c - (w + over) / 2, c + (w + over) / 2, head, head + th, 0, MEMBER, 1)
    gap, out = SHUTTER
    face.box(s, c - w / 2, c - gap, sill, head, FRAME_PROUD - out, FRAME_PROUD, 3)
    face.box(s, c + gap, c + w / 2, sill, head, FRAME_PROUD - out, FRAME_PROUD, 3)
    return (c - w / 2, c + w / 2, sill, head)


def build_door(s, face, lines, k):
    """The shut door in bay k: an oak leaf (slot 3) out from the plaster, a
    head timber across the bay (slot 1), two iron straps (slot 4)."""
    c = (lines[k] + lines[k + 1]) / 2
    w, h, out = DOOR
    lo, hi = c - w / 2, c + w / 2
    y0 = PLINTH
    face.box(s, lo, hi, y0, y0 + h, FRAME_PROUD - out, FRAME_PROUD, 3)
    left, right = bay_edges(lines, k)
    face.box(s, left, right, DOOR_HEAD[0], DOOR_HEAD[1], 0, MEMBER, 1)
    tall, proud, ats, part = DOOR_STRAP
    for at in ats:
        face.box(s, lo, lo + w * part, y0 + at - tall / 2, y0 + at + tall / 2,
                 FRAME_PROUD - out - proud, FRAME_PROUD - out, 4)
    return (lo, hi)


# ---------------------------------------------------------------- the roofs --
def roof_pitch(pitches):
    """The pitches' own rise over run, from their union's box: ridge along x."""
    z0 = min(p['box']['min']['z'] for p in pitches)
    z1 = max(p['box']['max']['z'] for p in pitches)
    y0 = min(p['box']['min']['y'] for p in pitches)
    y1 = max(p['box']['max']['y'] for p in pitches)
    return (y1 - y0) / ((z1 - z0) / 2)


def build_thatch(s, name, x0, x1, z0, z1, foot, k, others):
    """A thatched roof over walls x0..x1, z0..z1 (the outer arrises at `foot`),
    ridge along x: two THATCH slabs, eaves THATCH_EAVE out, verges VERGE past
    each end unless another wall piece's box stops them, and the ridge roll.
    Slot 0, materials.thatch(). Returns what the print line and the gables need."""
    zr, half = (z0 + z1) / 2, (z1 - z0) / 2
    under_ridge = foot + k * half
    top = under_ridge + THATCH
    facets, radius, drop = ROLL
    roll_top = top - drop + radius
    ez0, ez1 = z0 - THATCH_EAVE, z1 + THATCH_EAVE
    eave_under = foot - k * THATCH_EAVE
    verges, stopped = [x0 - VERGE, x1 + VERGE], [None, None]
    for p in others:
        b = p['box']
        for i, (va, vb) in enumerate(((x0 - VERGE, x0), (x1, x1 + VERGE))):
            vbox = _box(va, vb, eave_under, roll_top, ez0, ez1)
            if not _overlap(vbox, b):
                continue
            if i == 0 and b['max']['x'] <= x0 + EPS:
                verges[0], stopped[0] = max(verges[0], b['max']['x']), p['id']
            elif i == 1 and b['min']['x'] >= x1 - EPS:
                verges[1], stopped[1] = min(verges[1], b['min']['x']), p['id']
            else:
                raise ValueError(f"town: {name}'s verge at x {va:g} to {vb:g} enters {p['id']}'s box, which is not "
                                 f"beyond its gable end")
    xa, xb = verges
    for (za, zb), under in (((ez0, zr), lambda x, z: foot + k * (z - z0)), ((zr, ez1), lambda x, z: foot + k * (z1 - z))):
        s.slab([(xa, za), (xb, za), (xb, zb), (xa, zb)], under, THATCH, slot=0)
    yc = top - drop
    ring = [(zr + radius * math.sin(2 * math.pi * i / facets), yc + radius * math.cos(2 * math.pi * i / facets))
            for i in range(facets)]
    s.plate(ring, xa, xb, slot=0, axis='x')
    return {'zr': zr, 'under_ridge': under_ridge, 'top': top, 'roll_top': roll_top, 'eaves': (ez0, ez1),
            'eave_under': eave_under, 'verges': (xa, xb), 'stopped': stopped, 'k': k}


def roof_line(name, r):
    return (f"town: {name} pitch {math.degrees(math.atan(r['k'])):.1f} deg, eave z {r['eaves'][0]:.3f} and "
            f"{r['eaves'][1]:.3f} (underside {r['eave_under']:.3f}, top {r['eave_under'] + THATCH:.3f}), ridge top "
            f"{r['top']:.3f}, roll top {r['roll_top']:.3f}, verges x {r['verges'][0]:.3f} and {r['verges'][1]:.3f}"
            + ''.join(f" ({'west' if i == 0 else 'east'} stopped at {sid})" for i, sid in enumerate(r['stopped']) if sid))


# ---------------------------------------------------------------- the house --
def build_house(s, p, look, road, k_plan, foot):
    """HOUSE_'s solid into `s`; returns the roof's walls (z0, z1), the jetty
    face and the rear face, for the roof, the road check and check_box."""
    b = p['box']
    a0, a1 = b['min']['x'], b['max']['x']
    road_z = (road['min']['z'] + road['max']['z']) / 2
    # the street face is the one nearer the road's centre line; the rear the other
    out = 1 if (b['min']['z'] + b['max']['z']) / 2 < road_z else -1   # rear to street, along z
    zs = b['max']['z'] if out > 0 else b['min']['z']
    zb = b['min']['z'] if out > 0 else b['max']['z']
    # THE JETTY (#857): the street face moved `jetty` toward the road; only this moves it
    side = out
    street_face = b['max']['z'] if side > 0 else b['min']['z']
    street_p = street_face + side * look['jetty']
    upper_in = -side
    k = max(k_plan, math.tan(math.radians(THATCH_MIN_PITCH)))
    z0, z1 = sorted((zb, street_p))
    zr = (z0 + z1) / 2
    apex = foot + k * (z1 - z0) / 2
    ridge_top = apex + THATCH

    # the plinth, and the plaster FRAME_PROUD inside the box and the jetty
    s.box(a0, a1, 0.0, PLINTH, b['min']['z'], b['max']['z'], slot=2)
    s.box(a0 + FRAME_PROUD, a1 - FRAME_PROUD, PLINTH, FIRST, *sorted((zb + out * FRAME_PROUD, zs - out * FRAME_PROUD)),
          slot=0)
    ra, sa = zb + out * FRAME_PROUD, street_p + upper_in * FRAME_PROUD
    s.plate([(ra, FIRST), (sa, FIRST), (sa, EAVES_Y), (zr, apex), (ra, EAVES_Y)],
            a0 + FRAME_PROUD, a1 - FRAME_PROUD, slot=0, axis='x')
    # the joists' ends under the jetty
    size, step, first, jy = JOIST
    x = a0 + first
    while x <= a1 - first + EPS:
        s.box(x - size / 2, x + size / 2, jy, FIRST, *sorted((zs, street_p)), slot=1)
        x += step

    ground = (SILL_BEAM, HEAD_RAIL, MID_RAIL['ground'])
    faces = {
        ('ground', 'street'): (Face('z', zs, -out, a0, a1), ground),
        ('ground', 'rear'): (Face('z', zb, out, a0, a1), ground),
        ('ground', 'west'): (Face('x', a0, 1, *sorted((zb, zs))), ground),
        ('ground', 'east'): (Face('x', a1, -1, *sorted((zb, zs))), ground),
        ('upper', 'street'): (Face('z', street_p, upper_in, a0, a1), (BRESSUMER, WALL_PLATE, MID_RAIL['upper'])),
        ('upper', 'rear'): (Face('z', zb, out, a0, a1), (GIRDING, WALL_PLATE, MID_RAIL['upper'])),
        ('upper', 'west'): (Face('x', a0, 1, z0, z1), (GIRDING, WALL_PLATE, MID_RAIL['upper'])),
        ('upper', 'east'): (Face('x', a1, -1, z0, z1), (GIRDING, WALL_PLATE, MID_RAIL['upper'])),
    }
    for (storey, which), (face, rails) in faces.items():
        lines = lines_of(face)
        long_face = which in ('street', 'rear')
        opens, door = {}, None
        if long_face:
            flags = look[f"{storey}_{which}"]
            for bay, on in enumerate(flags):
                if on:
                    c = (lines[bay] + lines[bay + 1]) / 2
                    opens[bay] = build_window(s, face, c, WINDOW[storey])
            if storey == 'ground' and which == 'street':
                door = build_door(s, face, lines, look['door'])
                opens[look['door']] = (door[0], door[1], None, None)
        elif storey == 'upper' and look['gables'][0 if which == 'west' else 1]:
            mid = (len(lines) - 1) // 2               # the face's middle bay (3 bays: bay 1)
            c = (lines[mid] + lines[mid + 1]) / 2
            opens[mid] = build_window(s, face, c, WINDOW['gable'])
        build_frame(s, face, rails, look['frame'], opens, long_face, door)
        if storey == 'upper' and not long_face:
            face.box(s, zr - KING_POST / 2, zr + KING_POST / 2, EAVES_Y, apex, 0, MEMBER, 1)
    if look['chimney']:
        side_c, over = CHIMNEY[0] / 2, CHIMNEY[1]
        cx = a0 + over if look['chimney'] == 'west' else a1 - over
        s.box(cx - side_c, cx + side_c, EAVES_Y, ridge_top + CHIMNEY[2], zr - side_c, zr + side_c, slot=2)
    rear_face = 'min z' if zb < zs else 'max z'
    return z0, z1, street_p, side, rear_face, ridge_top, k


def check_street(pid, look, street_p, eave_z, road, out):
    edge = road['min']['z'] if out > 0 else road['max']['z']
    for what, z in (('jetty', street_p), ('street eave', eave_z)):
        if (z - edge) * out > 1e-6:
            raise ValueError(f"town: {pid}'s {what} at z {z:.3f} passes the road's edge at z {edge:g} "
                             f"(jetty {look['jetty']:g}, THATCH_EAVE {THATCH_EAVE:g})")


# --------------------------------------------------------------- the church --
def build_church(s, p, opens, apex):
    """CHURCH_'s solid: a core inset RECESS on each face with an opening, a
    RECESS skin on it split at each opening, a pointed head of two chords,
    the recess faces in slot 1, the nave door's oak leaf in slot 2, and the
    gable prism along x. Returns (openings, faces painted)."""
    b = p['box']
    bx0, bx1, by0, by1, bz0, bz1 = (b['min']['x'], b['max']['x'], b['min']['y'], b['max']['y'],
                                    b['min']['z'], b['max']['z'])
    has = {f: bool(opens.get(f)) for f in ('north', 'south', 'east', 'west')}
    core = _box(bx0 + (RECESS if has['west'] else 0), bx1 - (RECESS if has['east'] else 0), by0, by1,
                bz0 + (RECESS if has['north'] else 0), bz1 - (RECESS if has['south'] else 0))
    faces = {   # (normal, outer plane, inward sign, along lo, along hi)
        'north': ('z', bz0, 1, bx0, bx1), 'south': ('z', bz1, -1, bx0, bx1),
        'west': ('x', bx0, 1, core['min']['z'], core['max']['z']),
        'east': ('x', bx1, -1, core['min']['z'], core['max']['z']),
    }
    cuts = {'x': [], 'y': [], 'z': []}
    placed, leaves = [], []
    for f, items in opens.items():
        n, P, inn, lo, hi = faces[f]
        face = Face(n, P, inn, lo, hi)
        along = 'x' if n == 'z' else 'z'
        ops = []
        for spec, c in items:
            w, sill, spring, top_ = spec
            if c is None:
                c = (lo + hi) / 2
            ops.append((c - w / 2, c + w / 2, sill, spring, top_))
        ops.sort()
        ycuts = sorted({v for o in ops for v in (o[2], o[4]) if by0 + EPS < v < by1 - EPS})
        at = lo
        for a, bb, sill, spring, ap in ops + [(hi, hi, None, None, None)]:
            if a - at > EPS:                       # a strip with no opening, cut at the sills and apexes
                ys = [by0] + ycuts + [by1]
                for y0, y1 in zip(ys, ys[1:]):
                    face.box(s, at, a, y0, y1, 0, RECESS, 0)
            if sill is None:
                break
            if sill - by0 > EPS:
                face.box(s, a, bb, by0, sill, 0, RECESS, 0)
            mid = (a + bb) / 2
            face.poly(s, [(a, spring), (mid, ap), (mid, by1), (a, by1)], 0, RECESS, 0)
            face.poly(s, [(mid, ap), (bb, spring), (bb, by1), (mid, by1)], 0, RECESS, 0)
            cuts[along] += [a, bb]
            cuts['y'] += [sill, ap]
            placed.append((f, n, P, inn, along, a, bb, sill, spring, ap))
            if sill <= by0 + EPS:
                leaves.append((face, a, bb, sill, spring, ap))
            at = bb
    for part in masonry.split_boxes([{'id': p['id'], 'box': core}], cuts):
        q = part['box']
        s.box(q['min']['x'], q['max']['x'], q['min']['y'], q['max']['y'], q['min']['z'], q['max']['z'], slot=0)

    def recess(x, y, z):
        pt = {'x': x, 'y': y, 'z': z}
        for _f, n, P, inn, along, a, bb, sill, _spring, ap in placed:
            depth = (pt[n] - P) * inn
            if a - EPS <= pt[along] <= bb + EPS and sill - EPS <= y <= ap + EPS and -EPS <= depth <= RECESS + EPS:
                return True
        return False
    painted = s.paint(recess, 1)
    for face, a, bb, sill, spring, ap in leaves:    # after the paint, so the leaf keeps slot 2
        face.poly(s, [(a, sill), (bb, sill), (bb, spring), ((a + bb) / 2, ap), (a, spring)],
                  RECESS - DOOR_OFF, RECESS, 2)
    zr = (bz0 + bz1) / 2
    s.plate([(bz0, by1), (zr, apex), (bz1, by1)], bx0, bx1, slot=0, axis='x')
    return placed, painted, len(leaves)


# ----------------------------------------------------------- the town gates --
def build_leaves(s, p, gap, centre):
    """Two open oak leaves (slot 0) against the passage sides, iron straps
    (slot 1) on the passage side. Returns their x span."""
    b = p['box']
    thick, off, hinge_in, under = LEAF
    tx = centre[0]
    outer = b['max']['x'] if abs(b['max']['x'] - tx) > abs(b['min']['x'] - tx) else b['min']['x']
    toward = 1 if tx > outer else -1
    hinge = outer + toward * hinge_in
    za, zb = gap['a']
    length = (zb - za) / 2
    xa, xb = sorted((hinge, hinge + toward * length))
    y1 = gap['y'][1] - under
    tall, proud, ats, part = LEAF_STRAP
    sx = sorted((hinge, hinge + toward * length * part))
    for z0, z1, face, sign in ((za + off, za + off + thick, za + off + thick, 1),
                               (zb - off - thick, zb - off, zb - off - thick, -1)):
        s.box(xa, xb, gap['y'][0], y1, z0, z1, slot=0)
        for at in ats:
            s.box(sx[0], sx[1], at - tall / 2, at + tall / 2, *sorted((face, face + sign * proud)), slot=1)
    return xa, xb


# ---------------------------------------------------- the cross, the barrels --
def build_cross(s, p):
    b = p['box']
    cx, cz = (b['min']['x'] + b['max']['x']) / 2, (b['min']['z'] + b['max']['z']) / 2
    y0 = b['min']['y']
    for side, fy, ty in CROSS_STEPS + ((CROSS_SHAFT[0], CROSS_SHAFT[1], CROSS_SHAFT[2]),):
        h = side / 2
        s.box(cx - h, cx + h, y0 + fy, y0 + ty, cz - h, cz + h)
    fy, ty, depth = CROSS_ARM_Y
    s.box(cx - CROSS_ARM / 2, cx + CROSS_ARM / 2, y0 + fy, y0 + ty, cz - depth / 2, cz + depth / 2)


def barrel(s, cx, cz, y0, h, belly):
    """One barrel on (cx, cz) from y0, h tall, `belly` at its widest, BARREL's
    staves in slot 0 and hoops in slot 1. build_barrels draws two; props.py's
    detail-barrel one (#866)."""
    facets, end, rings, hoops = BARREL
    rim = belly * end

    def radius(t):
        return rim + (belly - rim) * math.sin(math.pi * t)
    for t0, t1 in zip(rings, rings[1:]):
        slot = 1 if any(abs(t0 - a) < EPS and abs(t1 - c) < EPS for a, c in hoops) else 0

        def ring(y):
            r = radius((y - y0) / h)
            return [masonry.ring_point(cx, cz, r, 360.0 * i / facets) for i in range(facets)]
        s.prism(ring, [y0 + t0 * h, y0 + t1 * h], slot)


def build_barrels(s, p):
    b = p['box']
    x0, dx = b['min']['x'], b['max']['x'] - b['min']['x']
    dz = b['max']['z'] - b['min']['z']
    cz = (b['min']['z'] + b['max']['z']) / 2
    y0, h = b['min']['y'], b['max']['y'] - b['min']['y']
    belly = min(dx / 4, dz / 2)
    for cx in (x0 + dx / 4, x0 + 3 * dx / 4):
        barrel(s, cx, cz, y0, h, belly)
    return belly


def build_crate(s, p):
    b = p['box']
    r = math.radians(p['transform']['rotationY'])
    c, sn = math.cos(r), math.sin(r)
    dx = b['max']['x'] - b['min']['x']
    side = dx / (abs(c) + abs(sn))
    h = side / 2
    cx, cz = (b['min']['x'] + b['max']['x']) / 2, (b['min']['z'] + b['max']['z']) / 2
    y0, y1 = b['min']['y'], b['max']['y']

    def put(lx0, lx1, ya, yb, lz0, lz1, slot):
        pts = [(cx + x * c + z * sn, cz - x * sn + z * c) for x, z in ((lx0, lz0), (lx1, lz0), (lx1, lz1), (lx0, lz1))]
        s.prism(lambda y: pts, [ya, yb], slot)
    t, inset = CRATE
    for sx in (-1, 1):
        for sz in (-1, 1):
            put(*sorted((sx * h, sx * (h - t))), y0, y1, *sorted((sz * h, sz * (h - t))), 0)
    for ya, yb in ((y0, y0 + t), (y1 - t, y1)):
        for sz in (-1, 1):
            put(-h, h, ya, yb, *sorted((sz * h, sz * (h - t))), 0)
        for sx in (-1, 1):
            put(*sorted((sx * h, sx * (h - t))), ya, yb, -h, h, 0)
    put(-h + inset, h - inset, y0 + inset, y1 - inset, -h + inset, h - inset, 1)
    return side


# ------------------------------------------------------------------- the quay --
def _box_solid(b, slot=0):
    s = masonry.Solid()
    s.box(b['min']['x'], b['max']['x'], b['min']['y'], b['max']['y'], b['min']['z'], b['max']['z'], slot)
    return s


def dock_union(dock):
    """The eight dock pieces' union box, raising unless they tile it: their plan
    areas sum to its area within DOCK_TILE and no two overlap by more (#957)."""
    if len(dock) != 8:
        raise ValueError(f"town: the quay front is {len(dock)} dock pieces, not 8: {[p['id'] for p in dock]}")
    union = _box(*(f(p['box'][e][k] for p in dock) for k in 'xyz' for e, f in (('min', min), ('max', max))))
    area = (union['max']['x'] - union['min']['x']) * (union['max']['z'] - union['min']['z'])
    total = sum((p['box']['max']['x'] - p['box']['min']['x']) * (p['box']['max']['z'] - p['box']['min']['z'])
                for p in dock)
    if abs(total - area) > DOCK_TILE:
        raise ValueError(f"town: the dock pieces' plan areas sum to {total:.3f} m2, not their union's {area:.3f}; "
                         f"they do not tile it")
    for i, a in enumerate(dock):
        for b in dock[i + 1:]:
            over = min(min(a['box']['max'][k], b['box']['max'][k]) - max(a['box']['min'][k], b['box']['min'][k])
                       for k in 'xz')
            if over > DOCK_TILE:
                raise ValueError(f"town: {a['id']} and {b['id']} overlap by {over:.3f} m; the dock pieces tile")
    return union, area


def build_quay(col, toll, toll_roof, dock, banks, river, done_, checked):
    """TOLL_, DOOR_ and ROOF_ for the toll-house, DOCK_quay-front, the BANK_s and
    WATER_quay-water (#956, #957). Returns the print lines."""
    log = []
    for p in toll:
        ob = done_(_box_solid(p['box']).finish(f"TOLL_{p['id']}", col, [materials.library(p['material'])],
                                               plan_id=p['id']))
        checked.append((ob, p, EVERY_FACE))
        # the shut door on the road face, town.DOOR's leaf with DOOR_STRAP's straps
        b = p['box']
        if TOLL_DOOR != 'max z':
            raise ValueError(f"town: TOLL_DOOR {TOLL_DOOR!r}; the toll-house's road face is its max z")
        face = Face('z', b['max']['z'], -1, b['min']['x'], b['max']['x'])
        w, h, out = DOOR
        c = (b['min']['x'] + b['max']['x']) / 2
        lo, hi = c - w / 2, c + w / 2
        y0 = b['min']['y']
        s = masonry.Solid()
        face.box(s, lo, hi, y0, y0 + h, -out, 0.0, 0)
        tall, proud, ats, part = DOOR_STRAP
        for at in ats:
            face.box(s, lo, lo + w * part, y0 + at - tall / 2, y0 + at + tall / 2, -out - proud, -out, 1)
        ob = done_(s.finish(f"DOOR_{p['id']}", col, [materials.library(OAK), materials.library(IRON)]))
        ob['modelOnly'] = TOLL_ONLY
        log.append(f"town: {ob.name} (modelOnly {TOLL_ONLY}) x {lo:g} to {hi:g}, y {y0:g} to {y0 + h:g}, "
                   f"z {b['max']['z']:g} to {b['max']['z'] + out:g}, {len(ats)} straps")
    for p in toll_roof:
        if p.get('built') != 'gable' or p.get('ridge') not in ('x', 'z'):
            raise ValueError(f"town: {p['id']} is built {p.get('built')!r} with ridge {p.get('ridge')!r}; the toll-house "
                             f"roof is the plan's gable, built 'gable' with ridge 'x' or 'z' (#957)")
        b = p['box']
        x0, x1, y0, y1, z0, z1 = (b[e][k] for k in 'xyz' for e in ('min', 'max'))
        s = masonry.Solid()
        if p['ridge'] == 'x':
            s.plate([(z0, y0), ((z0 + z1) / 2, y1), (z1, y0)], x0, x1, slot=0, axis='x')
            ends = s.paint(lambda x, y, z: abs(x - x0) < 1e-4 or abs(x - x1) < 1e-4 or abs(y - y0) < 1e-4, 1)
        else:
            s.plate([(x0, y0), ((x0 + x1) / 2, y1), (x1, y0)], z0, z1, slot=0, axis='z')
            ends = s.paint(lambda x, y, z: abs(z - z0) < 1e-4 or abs(z - z1) < 1e-4 or abs(y - y0) < 1e-4, 1)
        ob = done_(s.finish(f"ROOF_{p['id']}", col, [materials.library(TOLL_ROOF[0]), materials.library(TOLL_ROOF[1])],
                            plan_id=p['id'], smooth_angle=5.0))
        checked.append((ob, p, EVERY_FACE))
        log.append(f"town: {ob.name} gable, ridge {p['ridge']} at y {y1:g}, foot y {y0:g}, x {x0:g} to {x1:g}, "
                   f"z {z0:g} to {z1:g}; slopes {materials.library(TOLL_ROOF[0]).name}, {ends} faces (ends and "
                   f"underside) {materials.library(TOLL_ROOF[1]).name}")
    if dock:
        union, area = dock_union(dock)
        s = _box_solid(union)
        top = s.paint(lambda x, y, z: abs(y - union['max']['y']) < 1e-4, 1)
        ids = sorted(p['id'] for p in dock)
        ob = done_(s.finish('DOCK_quay-front', col, [materials.library(DOCK_STONE[0]), materials.library(DOCK_STONE[1])],
                            plan_ids=ids))
        checked.append((ob, {'id': 'the quay front (' + ', '.join(ids) + ')', 'box': union}, EVERY_FACE))
        log.append(f"town: {ob.name} x {union['min']['x']:g} to {union['max']['x']:g}, y {union['min']['y']:g} to "
                   f"{union['max']['y']:g}, z {union['min']['z']:g} to {union['max']['z']:g}, {area:.2f} m2 tiled by "
                   f"{len(ids)} pieces; {top} top face in {materials.library(DOCK_STONE[1]).name}")
    for p in banks:
        ob = done_(_box_solid(p['box']).finish(f"BANK_{p['id']}", col, [materials.ground(BANK_GROUND)],
                                               plan_id=p['id']))
        checked.append((ob, p, EVERY_FACE))
    for p in river:
        ob = done_(_box_solid(p['box']).finish(f"WATER_{p['id']}", col, [materials.water()], plan_id=p['id']))
        ob['noCollide'] = bool(p.get('noCollide'))
        checked.append((ob, p, EVERY_FACE))
        b = p['box']
        log.append(f"town: {ob.name} x {b['min']['x']:g} to {b['max']['x']:g}, y {b['min']['y']:g} to "
                   f"{b['max']['y']:.2f}, z {b['min']['z']:g} to {b['max']['z']:g}; banks "
                   + ', '.join(f"BANK_{q['id']}" for q in banks) + f" in {materials.ground(BANK_GROUND).name}")
    return log


# ------------------------------------------------------------------- build --
def build(bp):
    col = common.stage_collection('town')
    table = common.STAGE_OF(bp)
    mine = [p for p in bp['pieces'] if table[p['id']] == 'town']
    pieces = {p['id']: p for p in bp['pieces']}
    road = pieces[ROAD]['box']

    walls_ = [p for p in mine if p['kind'] == 'wall']
    runs = [p for p in walls_ if re.search(RUNS, p['id'])]
    runs.sort(key=lambda p: (0 if p['id'].startswith('town-wall') else 1))
    houses = [p for p in walls_ if re.search(HOUSES, p['id'])]
    church = [p for p in walls_ if re.search(CHURCH, p['id'])]
    cross = [p for p in walls_ if p['id'] == CROSS]
    decks = [p for p in walls_ if p not in runs + houses + church + cross and not _has_col(bp, p['id'])]
    pitches = [p for p in mine if p['kind'] == 'decor' and re.search(PITCH, p['id'])]
    modelled = {}
    for p in mine:
        if p['kind'] == 'decor' and p not in pitches and p.get('model'):
            what = MODELS.get(os.path.basename(p['model']))
            if what:
                modelled.setdefault(what, []).append(p)
    floors = [p for p in mine if p['kind'] == 'ground']
    toll = [p for p in mine if p['id'] == TOLL]
    toll_roof = [p for p in mine if p['kind'] == 'prop']
    dock = [p for p in mine if re.search(DOCK, p['id'])]
    banks = [p for p in mine if re.search(BANK, p['id'])]
    river = [p for p in mine if p['id'] == RIVER]
    quay = toll + toll_roof + dock + banks + river
    decks = [p for p in decks if p not in quay]
    done = (runs + houses + church + cross + decks + pitches + floors + quay
            + [q for v in modelled.values() for q in v])
    other = [p['id'] for p in mine if p not in done]
    if other:
        raise ValueError(f"town: STAGE_OF gives this stage pieces no rule takes: {other}")

    # each pitch to the one wall piece it sits on
    roofed = {}
    for q in pitches:
        qb = q['box']
        hosts = [w for w in walls_ if abs(w['box']['max']['y'] - qb['min']['y']) < EPS
                 and all(w['box']['min'][k] <= qb['min'][k] + EPS and w['box']['max'][k] >= qb['max'][k] - EPS
                         for k in 'xz')]
        if len(hosts) != 1:
            raise ValueError(f"town: pitch {q['id']} sits on {len(hosts)} wall pieces "
                             f"({', '.join(w['id'] for w in hosts) or 'none'}); it needs one")
        ry = q['transform']['rotationY'] % 360
        if abs(ry - 90) > EPS and abs(ry - 270) > EPS:
            raise ValueError(f"town: pitch {q['id']} has rotationY {q['transform']['rotationY']}, a ridge along z; "
                             f"no town roof runs along z")
        roofed.setdefault(hosts[0]['id'], []).append(q)
    for wid, qs in roofed.items():
        if len({round(q['transform']['rotationY'] % 180, 6) for q in qs}) != 1:
            raise ValueError(f"town: {wid}'s pitches disagree on their ridge's axis")

    order = []        # every object the stage built, in build order
    checked = []      # (ob, piece, faces)
    lines = []

    def done_(ob):
        order.append(ob)
        return ob

    # the runs, and the town gates' leaves
    union = {'min': {k: min(p['box']['min'][k] for p in runs if p['id'].startswith('town-wall')) for k in 'xz'},
             'max': {k: max(p['box']['max'][k] for p in runs if p['id'].startswith('town-wall')) for k in 'xz'}}
    centre = ((union['min']['x'] + union['max']['x']) / 2, (union['min']['z'] + union['max']['z']) / 2)
    leaf_log = []
    for p in runs:
        cols = masonry.colliders_of(bp, p['id'])
        s = masonry.Solid()
        walls.build_run(s, p, cols, None, batter=False)
        done_(s.finish(f"WALL_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id']))
        gaps = openings(p, cols)
        if gaps:
            if len(gaps) != 1 or abs(gaps[0]['y'][0] - p['box']['min']['y']) > EPS:
                raise ValueError(f"town: {p['id']} has {len(gaps)} openings; a town gate is one, on the ground")
            s = masonry.Solid()
            xa, xb = build_leaves(s, p, gaps[0], centre)
            ob = done_(s.finish(f"LEAVES_{p['id']}", col, [materials.library(OAK), materials.library(IRON)]))
            ob['modelOnly'] = MODEL_ONLY
            leaf_log.append(f"{ob.name} x {xa:.3f} to {xb:.3f}, z {gaps[0]['a'][0]:g} to {gaps[0]['a'][1]:g}, "
                            f"to y {gaps[0]['y'][1] - LEAF[3]:.2f}")

    # the shed's deck and the yard's floor
    for p in decks:
        b = p['box']
        s = masonry.Solid()
        s.box(b['min']['x'], b['max']['x'], b['min']['y'], b['max']['y'], b['min']['z'], b['max']['z'])
        done_(s.finish(f"DECK_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id']))
    for p in floors:
        b = p['box']
        s = masonry.Solid()
        s.box(b['min']['x'], b['max']['x'], GROUND_Y[0], GROUND_Y[1], b['min']['z'], b['max']['z'])
        done_(s.finish(f"FLOOR_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id']))

    def others(p):
        return [w for w in walls_ if w is not p]

    # the deck's roof, a board gable at each end no wall stops
    for p in decks:
        qs = roofed.get(p['id'], [])
        if not qs:
            continue
        b = p['box']
        k = max(roof_pitch(qs), math.tan(math.radians(THATCH_MIN_PITCH)))
        foot = min(q['box']['min']['y'] for q in qs)
        s = masonry.Solid()
        r = build_thatch(s, f"ROOF_{p['id']}", b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z'], foot, k,
                         others(p))
        tri = [(b['min']['z'], foot), (r['zr'], r['under_ridge']), (b['max']['z'], foot)]
        gables = []
        if r['stopped'][0] is None:
            s.plate(tri, b['min']['x'], b['min']['x'] + GABLE, slot=1, axis='x')
            gables.append(f"x {b['min']['x']:g} to {b['min']['x'] + GABLE:g}")
        if r['stopped'][1] is None:
            s.plate(tri, b['max']['x'] - GABLE, b['max']['x'], slot=1, axis='x')
            gables.append(f"x {b['max']['x'] - GABLE:g} to {b['max']['x']:g}")
        ob = done_(s.finish(f"ROOF_{p['id']}", col, [materials.thatch(), materials.library(ROOF_BOARDS)],
                            plan_ids=sorted(q['id'] for q in qs), smooth_angle=35.0))
        lines.append(roof_line(ob.name, r) + f"; board gable {', '.join(gables)}")

    # the houses: draws, the tint fix-up along each row, then the solids and roofs
    road_z = (road['min']['z'] + road['max']['z']) / 2
    looks = {p['id']: draws(p['id']) for p in houses}
    fix_tints(houses, road_z, looks)
    house_log = []
    for p in houses:
        look = looks[p['id']]
        qs = roofed.get(p['id'], [])
        if not qs:
            raise ValueError(f"town: house {p['id']} has no pitches over it")
        foot = min(q['box']['min']['y'] for q in qs)
        s = masonry.Solid()
        z0, z1, street_p, side, rear_face, ridge_top, k = build_house(s, p, look, road, roof_pitch(qs), foot)
        ob = s.finish(f"HOUSE_{p['id']}", col, [materials.library(p['material']), materials.library(TIMBER),
                                                 materials.library(DRESSED), materials.library(OAK),
                                                 materials.library(IRON)], plan_id=p['id'])
        ob.color = (*PLASTER_TINTS[look['tint']], 1.0)
        done_(ob)
        checked.append((ob, p, ['min x', 'max x', 'min y', rear_face]))
        s = masonry.Solid()
        r = build_thatch(s, f"ROOF_{p['id']}", p['box']['min']['x'], p['box']['max']['x'], z0, z1, foot, k, others(p))
        eave = r['eaves'][1] if street_p > r['zr'] else r['eaves'][0]
        out = 1 if (p['box']['min']['z'] + p['box']['max']['z']) / 2 < road_z else -1
        check_street(p['id'], look, street_p, eave, road, out)
        ob = done_(s.finish(f"ROOF_{p['id']}", col, [materials.thatch()], plan_ids=sorted(q['id'] for q in qs)))
        lines.append(roof_line(ob.name, r))
        tint = f"{look['tint']}" + (f" (drew {look['drew']})" if look['tint'] != look['drew'] else '')
        house_log.append(f"town: house {p['id'][len('mereford-house-'):]} | {look['frame']} | jetty {look['jetty']:g} | "
                         f"tint {tint} | door bay {look['door']} | ground street {_bits(look['ground_street'])} | "
                         f"upper street {_bits(look['upper_street'])} | ground rear {_bits(look['ground_rear'])} | "
                         f"upper rear {_bits(look['upper_rear'])} | gables {_bits(look['gables'])} | chimney "
                         f"{look['chimney'] or 'none'} | ridge top {ridge_top:.3f}")

    # the church
    church_log = []
    for p in church:
        qs = roofed.get(p['id'], [])
        if not qs:
            raise ValueError(f"town: {p['id']} has no pitches over it")
        b = p['box']
        k = max(roof_pitch(qs), math.tan(math.radians(THATCH_MIN_PITCH)))
        foot = min(q['box']['min']['y'] for q in qs)
        apex = foot + k * (b['max']['z'] - b['min']['z']) / 2
        s = masonry.Solid()
        placed, painted, doors = build_church(s, p, CHURCH_OPENINGS[p['id']], apex)
        mats = [materials.library(p['material']), materials.dressing()] + ([materials.library(OAK)] if doors else [])
        ob = done_(s.finish(f"CHURCH_{p['id']}", col, mats, plan_id=p['id']))
        checked.append((ob, p, ['min x', 'max x', 'min z', 'max z', 'min y']))
        church_log.append(f"town: {ob.name} {len(placed)} recessed openings ("
                          + ', '.join(f"{f} {a:g} to {bb:g} y {sill:g} to {ap:g}" for f, _n, _P, _i, _al, a, bb, sill, _sp, ap
                                      in placed)
                          + f"), {painted} faces in {materials.dressing().name}, {doors} door leaf, gable apex {apex:.3f}")
        s = masonry.Solid()
        r = build_thatch(s, f"ROOF_{p['id']}", b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z'], foot, k,
                         others(p))
        ob = done_(s.finish(f"ROOF_{p['id']}", col, [materials.thatch()], plan_ids=sorted(q['id'] for q in qs)))
        lines.append(roof_line(ob.name, r))

    # the cross, the barrels, the crate
    for p in cross:
        s = masonry.Solid()
        build_cross(s, p)
        ob = done_(s.finish(f"CROSS_{p['id']}", col, [materials.dressing()], plan_id=p['id']))
        checked.append((ob, p, [f"{e} {k}" for e in ('min', 'max') for k in 'xyz']))
    for p in modelled.get('barrels', []):
        s = masonry.Solid()
        belly = build_barrels(s, p)
        ob = done_(s.finish(f"BARRELS_{p['id']}", col, [materials.library(TIMBER), materials.library(IRON)],
                            plan_id=p['id']))
        checked.append((ob, p, [f"{e} {k}" for e in ('min', 'max') for k in 'xyz']))
    for p in modelled.get('crate', []):
        s = masonry.Solid()
        side = build_crate(s, p)
        ob = done_(s.finish(f"CRATE_{p['id']}", col, [materials.library(TIMBER), materials.library(BOARDS_SET)],
                            plan_id=p['id'], smooth_angle=5.0))
        checked.append((ob, p, [f"{e} {k}" for e in ('min', 'max') for k in 'xyz']))

    # the quay (7b): the toll-house, its door and gable, the dock front, the
    # banks and the plan's water slab, each held to its box on every face
    quay_log = build_quay(col, toll, toll_roof, dock, banks, river, done_, checked)

    # the trees: terrain's template (appended here only when terrain did not run)
    trees = modelled.get('tree', [])
    tree_log = []
    if trees:
        lib = bpy.data.collections.new('TOWN_library')
        lib.use_fake_user = True
        templates = terrain.append_model(TREE_ASSET, lib)
        if not lib.objects:
            bpy.data.collections.remove(lib)
        if len(templates) != 1:
            raise ValueError(f"town: {TREE_ASSET} gives {len(templates)} templates; the town's trees need one")
        t = templates[0]
        for mat in {sl.material for sl in t.material_slots if sl.material}:
            if mat.name.endswith('_leaves'):
                materials.tint_leaves(mat)
        native = terrain.native_height(t)
        heights = {}
        for p in trees:
            rng = random.Random(f"town:{p['id']}")
            h = rng.uniform(*TOWN_TREE_METRES)
            sc = h / native
            x, _y, z = p['transform']['position']
            ob = bpy.data.objects.new(f"TREE_{p['id']}", t.data)
            ob.matrix_basis = (Matrix.Translation(Vector(common.to_blender((x, -TREE_SINK, z))))
                               @ Matrix.Rotation(common.rotation_z(p['transform']['rotationY']), 4, 'Z')
                               @ Matrix.Diagonal((sc, sc, sc, 1.0)))
            ob['planId'] = p['id']
            ob['model'] = t.name
            col.objects.link(ob)
            done_(ob)
            heights[ob.name] = h

    bpy.context.view_layer.update()
    worst = max(check_box(ob, p, faces, stage='town') for ob, p, faces in checked)

    # a tree's box may meet no other object's, FLOOR_ and TREE_ aside, in build order
    boxes = [(ob, _tight(ob)) for ob in order]
    for ob, tb in boxes:
        if not ob.name.startswith('TREE_'):
            continue
        best = None
        for other, ob_box in boxes:
            if other is ob or other.name.startswith(('FLOOR_', 'TREE_')):
                continue
            if _overlap(tb, ob_box):
                raise ValueError(f"town: {ob.name} ({heights[ob.name]:.3f} m, its box x {tb['min']['x']:.2f} to "
                                 f"{tb['max']['x']:.2f}, z {tb['min']['z']:.2f} to {tb['max']['z']:.2f}) meets "
                                 f"{other.name}'s box (x {ob_box['min']['x']:.2f} to {ob_box['max']['x']:.2f}, y "
                                 f"{ob_box['min']['y']:.2f} to {ob_box['max']['y']:.2f}, z {ob_box['min']['z']:.2f} to "
                                 f"{ob_box['max']['z']:.2f})")
            g = _gap(tb, ob_box)
            if best is None or g < best[0]:
                best = (g, other.name)
        tree_log.append(f"{ob.name} {heights[ob.name]:.3f} m, nearest {best[1]} {best[0]:.2f} m clear")

    for line in house_log:
        print(line)
    for line in lines:
        print(line)
    for line in church_log:
        print(line)
    for line in quay_log:
        print(line)
    print(f"town: leaves (modelOnly {MODEL_ONLY}): {'; '.join(leaf_log)}")
    print(f"town: trees ({TREE_ASSET}, native {native:.3f} m): {'; '.join(tree_log)}" if trees else 'town: no trees')
    asset, size, rise, look = materials.THATCH_SET
    print(f"town: thatch {materials.thatch().name} from THATCH_SET {materials.THATCH_SET}"
          + (" - STAND-IN thatch (#857), until Devon picks the set" if asset == 'rough_wood' else ''))
    carried = sum(1 for ob in order if 'planId' in ob.keys() or 'planIds' in ob.keys())
    ids = sum(1 for ob in order if 'planId' in ob.keys()) + sum(len(ob['planIds']) for ob in order if 'planIds' in ob.keys())
    print(f"town: {len(order)} objects, {carried} carrying {ids} planIds of {len(mine)} pieces; boxes held within "
          f"{worst:.4f} m (tolerance {BOX_TOLERANCE} m); house tints "
          + ', '.join(f"HOUSE_{p['id']} {tuple(round(c, 2) for c in PLASTER_TINTS[looks[p['id']]['tint']])}" for p in houses))