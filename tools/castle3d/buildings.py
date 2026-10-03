# buildings.py - the buildings stage: the inner rooms' runs, floors and
# columns, the great hall's trusses and roof, and the hall's #853 windows,
# gables and corbels (increment 4a); the other rooms' #853 roofs, beams,
# windows and plaster, #854's dressed openings and the hall's louvre (4b).
#
# Snapped to the blueprint (#500), and reading nothing else: never another
# stage's objects, which is what lets `--only buildings` build alone. Every
# number is the blueprint's or a named constant below, from SPECS.md's
# increment 4 open calls, in the game's frame. Everything this stage adds that
# realises no plan piece carries modelOnly "#853" (the louvre "#854") and no
# planId.
#
# THE RUNS (WALL_<id>). walls.build_run on the plan's colliders clipped to the
# piece's box, unbattered (no run here is `curtain`), so the seven doorways and
# Lady Alys's window are openings exactly as the plan cuts them. #853's
# windows copy that one window: WINDOW_LIKE's two colliders give its width,
# sill and head, and each window in WINDOWS is cut through the run's whole
# depth by walls.minus_block, straight and unglazed. A window whose block grown
# by WINDOW_CLEAR meets a props-stage piece's box raises, naming both.
#
# THE FLOORS (FLOOR_<id>, DECK_masons-lodge-roof). Every slab less every
# drum's outer circle (masonry.minus_discs), since a slab left inside a drum
# shows in the drum's room or fights its floor. The upper floors are their
# collider clipped to their box; the carpet is CARPET[1] m of its set over the
# rest in CARPET[2], so the King's hall's ceiling is boards. The rectangular
# ground floors are their box from GROUND_Y[0] to GROUND_Y[1] (walls.WALK_LIFT
# over the terrain), the three disc ground floors their `disc` at
# towers.DISC_FACETS, uncut. The lodge's deck is its box; its four posts are
# kit decor, increment 6's, so the deck floats until then.
#
# THE COLUMNS (COLUMN_<id>). A square plinth, a round shaft and a square
# capital filling the box exactly; the damaged one loses the capital's
# quadrant facing the hall's centre (DAMAGED_QUADRANT), and still reaches its
# box on every face. Held within BOX_TOLERANCE of the box on every face.
#
# THE TRUSSES (TRUSS_hall-truss-<n>, one each, so the trusses stay trusses,
# #528). A king-post truss in the piece's (z, y) plane: two principal rafters
# RAFTER deep, measured vertically, under the section's slope lines; a tie
# beam TIE tall on the eaves' line; a king post KING wide from the tie beam to
# the apex; two struts STRUT wide from the king post's foot to each rafter's
# midpoint; every member MEMBER across x, centred on the piece's x. The piece
# is 0.5 m thick and a 0.5 m oak member is twice what a hall truss carries, so
# the check holds the y and z faces and the x centre within BOX_TOLERANCE.
#
# THE ROOF (ROOF_great-hall, planIds the seven hall-roof ids). The pieces'
# own section, underside on the trusses' top edges, ROOF_BOARDS under
# ROOF_SLATES, with #853's departures: the hall's own x, the north eave
# EAVE_PAST beyond the north run's outer face, both slopes less the drum
# discs; closed at each end by a GABLE m board gable in the same object, clear
# of the drum discs. The south slope stops at the hall-roof pieces' own south
# face (#922, taking back #853's run on to the curtain's face), so #527's
# 0.75 m slot of sky stands between it and the curtain as it does in the game,
# and the four drum walk doors #855 shut under it open onto that slot. Held:
# the roof's world box ends within BOX_TOLERANCE of the pieces' south face, or
# the stage raises.
#
# THE CORBELS (CORBELS_great-hall, modelOnly #853). One stone block under
# each south truss foot that is not inside a drum disc, in the material of
# the wall piece whose box face is behind it.
#
# INCREMENT 4b, #853 for the other rooms and #854's rulings; model only, so no
# object below carries a planId and line 6 stays where 4a left it.
#
# THE DRESSED OPENINGS (#854). In a run whose slug is not materials.DRESSED,
# after the windows are cut, `openings` finds each gap the colliders leave;
# each is grown by DRESS along the run and in y (a door, standing on the foot,
# grows no sill band), masonry.split_boxes cuts the colliders at the grown
# boxes' planes, and Solid.paint gives every face whose centre is inside a
# grown box slot 1, materials.dressing(). A slot moves no vertex: every opening
# stays the plan's size (#500). Two grown openings that meet, or one that
# leaves the run's box, raise, naming the run and both by their centres.
#
# THE FLAT ROOFS AND THE LEAN-TO (ROOF_<room id>, modelOnly #853). Each of
# FLAT_ROOFS over its clear span (the room's bounds moved in to the face of
# every run that straddles them, `clear_span`) less the drum discs, FLAT_Y,
# FLAT_TOP's pavers over FLAT_BOARDS, flush with the walls' tops and the walks.
# LEAN_TO from EAVE_PAST beyond its low run's outer face to the curtain, its
# underside through the low run's OUTER top edge (#855, amending #853's inner
# edge, which put the wall's arris up through the slates) and the curtain's
# top less the hall roof's thickness, in the hall roof's two sets. A roof's
# box that meets a props-stage piece's box raises, naming both.
#
# THE WALL PLATE (PLATE_steward-chamber, modelOnly #855). TIMBER filling the
# wedge the lean-to leaves over its low run's top, open to the chamber.
#
# #855's four shut drum walk doors (DOOR_prison-tower-1, -2, DOOR_sw-tower-1,
# -2) are gone (#922): the hall roof is cut back instead, so the drums' walk
# doors stand open in the model as they do in the game.
#
# THE BEAMS (BEAMS_<room id>, modelOnly #853). BEAM square, at BEAMS' tile
# centres, under each upper floor and each flat roof, spanning the clear span
# in z, or from a drum's face where a disc cuts the end, BEAR into the stone
# at each end, in TIMBER. A beam's box that meets a props-stage piece's box
# raises, naming both, which is the chandelier break.
#
# THE PLASTER (PLASTER_<room id>, modelOnly #853). In PLASTERED, PLASTER m of
# PLASTER_SET on the room-facing face of every run whose box face is on the
# clear span's edge, from the upper floor's top to FLAT_Y[0], built from the
# boxes build_run received less the window blocks, so every opening stays
# open; in a dressed run it also stops at each grown opening, so the band shows
# inside as stone. Drum faces stay stone.
#
# THE LOUVRE (LOUVRE_great-hall, modelOnly #854). LOUVRE_SIZE on the ridge
# over the bay at LOUVRE_X: rough_wood sills, corner posts and head plates
# LOUVRE_FRAME square, the heads' tops LOUVRE_RISE over the ridge top;
# LOUVRE_SLATS slats of SLAT on each long side, low edge outward; the ends
# boarded GABLE thick; a cap of the hall roof's section, LOUVRE_EAVE past the
# footprint. The hall roof is opened under it inside the frame. The hole's x
# span grown by LOUVRE_CLEAR that meets a hall-truss piece's box raises, naming
# it, and so does the louvre's box grown by LOUVRE_CLEAR meeting a prop's.

import math

import bpy

import common
import masonry
import materials
import towers
import walls
from gates import world_box

EPS = 1e-6
BOX_TOLERANCE = 0.01
MODEL_ONLY = '#853'

# The plan's null-material pieces (SPECS "The 16 null pieces' materials").
TIMBER = 'rough_wood'                  # the trusses, and every #853 beam (4b)
ROOF_BOARDS = 'wood_planks'            # the roofs' boards from below (#856: old_planks_02 streaked)
ROOF_SLATES = towers.ROOF_MATERIAL     # roof_slates_02, imported, not copied
COLUMN_STONE = 'medieval_blocks_02'    # the plan's dressed stone (#541)

# floor-royal-apartments: (its slug, the carpet's thickness, the boards under it)
CARPET = ('dirty_carpet', 0.02, 'wood_planks')
GROUND_Y = (-0.1, walls.WALK_LIFT)     # a ground floor, 5 mm over the terrain

# The windows (#853). WINDOW_LIKE is the plan's one window in these runs,
# kings-hall-south between its colliders -3 (top, the sill) and -4 (foot, the
# head); its x span is the width. WINDOWS gives each run the tile lines its
# windows are centred on, along the run's long axis. The hall's sixth tile
# line, -26, is left out because hall-fireplace stands under it and its flue is
# in that wall: a look call, not a rule. 4b adds the other rooms' windows: the
# Clerk's chamber and the dormitory over the outer ward, and the nave's north
# window over the pulpit and its east window, a z, 0.54 m over the rood. None
# in the royal apartments, which have Lady Alys's, and none in the Steward's
# chamber, whose 4 m wall a 5 m sill does not fit.
WINDOW_LIKE = ('kings-hall-south-3', 'kings-hall-south-4')
WINDOWS = {
    'great-hall-north': [-30, -22, -18, -14, -10],
    'clerk-office-south': [-30],
    'kitchen-south': [-22, -18],
    'chapel-nave-north': [14],
    'chapel-nave-east': [10],
}
WINDOW_CLEAR = 0.1                     # a window block grown by this may meet no prop

# The columns.
PLINTH = 0.3
CAPITAL = 0.3
SHAFT_R = 0.3
COLUMN_FACETS = 32
DAMAGED = 'column-damaged'             # the id prefix of the column that loses a quadrant
DAMAGED_QUADRANT = (-1, 1)             # (x, z) signs: towards the hall's centre

# The trusses.
RAFTER = 0.3
TIE = 0.3
KING = 0.25
STRUT = 0.2
MEMBER = 0.3

# The roof.
ROOF_OF = 'great-hall'                 # the room the hall-truss and hall-roof pieces roof
BOARDS = 0.12
SLATES = 0.06
EAVE_PAST = 0.3                        # the north eave past the north run's outer face
GABLE = 0.05

# The corbels.
CORBEL_HALF = 0.2
CORBEL_Z = (13.0, 14.0)
CORBEL_Y = (7.4, 8.0)

# The dressed openings (#854): the band round each opening in rubble.
DRESS = 0.25

# The roofs the plan leaves open (#853, 4b).
FLAT_ROOFS = ('clerk-chamber', 'dormitory', 'royal-apartments', 'chapel-nave')
FLAT_Y = (7.8, 8.0)                    # flush with the walls' tops and the walks
FLAT_TOP = ('stone_pavers', 0.05)      # the plan's flat-roof slug (#849) and its thickness
FLAT_BOARDS = 'wood_planks'            # the rest of FLAT_Y under it
LEAN_TO = 'steward-chamber'            # from its 4 m north run up to the curtain at 8 m

# The beams (#853, 4b): the tile centres, where the trusses stand, which clear
# every hung prop; the tile lines between them put one through the chandelier.
BEAM = 0.3
BEAR = 0.25                            # each end into the stone it bears on
BEAMS = {
    'clerk-office': [-32, -28], 'clerk-chamber': [-32, -28],
    'kitchen': [-24, -20, -16], 'dormitory': [-24, -20, -16],
    'kings-hall': [4, 8, 12, 16, 20], 'royal-apartments': [4, 8, 12, 16, 20],
    'chapel-nave': [12, 16],
}

# The plaster (#853, 4b; darkened by materials.LOOK, #854): the three upper
# rooms only, since the plan chose their stone for the ground rooms under them.
PLASTERED = ('clerk-chamber', 'dormitory', 'royal-apartments')
PLASTER = 0.015
PLASTER_SET = 'plastered_wall_04'

# The ridge louvre (#854), over the bay between hall-truss-5 and -6: clear of
# the Prison Tower's cut of the south slope, and not over the fireplace.
LOUVRE_ONLY = '#854'
LOUVRE_X = -14
LOUVRE_SIZE = (2.4, 2.0)               # along the ridge (x), across it (z)
LOUVRE_RISE = 0.72                     # the head plates' top over the hall roof's ridge top
LOUVRE_FRAME = 0.12                    # sills, posts and heads, square
LOUVRE_SLATS = 4                       # per long side
SLAT = (0.25, 0.025, 45)               # width, thickness, tip in degrees, low edge outward
LOUVRE_EAVE = 0.1                      # the cap past the footprint on all four sides
LOUVRE_CLEAR = 0.1                     # the hole and the louvre grown by this meet no truss or prop

# The lean-to's wall plate (#855).
PLATE_ONLY = '#855'
PLATE_CLEAR = 0.1                      # the plate grown by this meets no prop


# ------------------------------------------------------------------ helpers --
def _collider(bp, cid):
    c = next((c for c in bp['colliders'] if c['id'] == cid), None)
    if c is None:
        raise ValueError(f"buildings: the blueprint has no collider {cid}")
    return c['box']


def _overlap(a, b):
    return all(min(a['max'][k], b['max'][k]) - max(a['min'][k], b['min'][k]) > EPS for k in 'xyz')


def _grown(box, d):
    return {'min': {k: box['min'][k] - d for k in 'xyz'}, 'max': {k: box['max'][k] + d for k in 'xyz'}}


def discs_of(bp):
    """Every drum's outer circle, (cx, cz, radius), from the tower pieces."""
    return [(p['drum']['cx'], p['drum']['cz'], p['drum']['radius']) for p in bp['pieces'] if p['kind'] == 'tower']


def in_disc(discs, x, z):
    return any(math.hypot(x - cx, z - cz) < r for cx, cz, r in discs)


def check_box(ob, piece, faces, stage='buildings'):
    """Raises unless `ob`'s world box is within BOX_TOLERANCE of the piece's box
    on each of `faces` ('min y', 'max z', ..., or 'centre x'), naming the piece
    and the worst face; `stage` prefixes the message (town.py imports this
    rather than copying it, #857). Returns the worst difference."""
    have, want = world_box(ob), piece['box']
    worst, face = 0.0, None
    for f in faces:
        end, k = f.split()
        if end == 'centre':
            h = (have['min'][k] + have['max'][k]) / 2
            w = (want['min'][k] + want['max'][k]) / 2
        else:
            h, w = have[end][k], want[end][k]
        if abs(h - w) > worst:
            worst, face = abs(h - w), f"{f} {h:.3f} against {w:.3f}"
    if worst > BOX_TOLERANCE:
        raise ValueError(f"{stage}: {ob.name} (piece {piece['id']}) is off its blueprint box by {worst:.3f} m "
                         f"at its worst face, {face} (game frame, tolerance {BOX_TOLERANCE} m)")
    return worst


EVERY_FACE = [f"{e} {k}" for e in ('min', 'max') for k in 'xyz']
TRUSS_FACES = ['min y', 'max y', 'min z', 'max z', 'centre x']


# ---------------------------------------------------------------- windows --
def window_blocks(bp, run, props):
    """#853's window blocks for `run`, as game boxes; raises if one leaves the
    run's box or, grown by WINDOW_CLEAR, meets a props-stage piece's box."""
    like_sill, like_head = (_collider(bp, c) for c in WINDOW_LIKE)
    width = like_sill['max']['x'] - like_sill['min']['x']
    sill, head = like_sill['max']['y'], like_head['min']['y']
    if not (head > sill and abs(width - (like_head['max']['x'] - like_head['min']['x'])) < EPS):
        raise ValueError(f"buildings: WINDOW_LIKE {WINDOW_LIKE} is not one window (width, sill {sill:g}, head {head:g})")
    b = run['box']
    along = 'x' if b['max']['x'] - b['min']['x'] > b['max']['z'] - b['min']['z'] else 'z'
    across = 'z' if along == 'x' else 'x'
    out = []
    for c in WINDOWS.get(run['id'], []):
        block = {'min': {along: c - width / 2, across: b['min'][across], 'y': sill},
                 'max': {along: c + width / 2, across: b['max'][across], 'y': head}}
        if block['min'][along] < b['min'][along] - EPS or block['max'][along] > b['max'][along] + EPS \
                or head > b['max']['y'] + EPS:
            raise ValueError(f"buildings: the window at {along} {c:g} leaves {run['id']}'s box")
        grown = _grown(block, WINDOW_CLEAR)
        for p in props:
            if _overlap(grown, p['box']):
                raise ValueError(f"buildings: the window at {along} {c:g} in {run['id']} (y {sill:g} to {head:g}), "
                                 f"grown by {WINDOW_CLEAR} m, meets props piece {p['id']}'s box")
        out.append(block)
    return out


# ----------------------------------------------------------------- columns --
def build_column(s, piece):
    b = piece['box']
    x0, x1, y0, y1, z0, z1 = b['min']['x'], b['max']['x'], b['min']['y'], b['max']['y'], b['min']['z'], b['max']['z']
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    s.box(x0, x1, y0, y0 + PLINTH, z0, z1)
    shaft = [masonry.ring_point(cx, cz, SHAFT_R, 360.0 * k / COLUMN_FACETS) for k in range(COLUMN_FACETS)]
    s.prism(lambda y: shaft, [y0 + PLINTH, y1 - CAPITAL])
    if not piece['id'].startswith(DAMAGED):
        s.box(x0, x1, y1 - CAPITAL, y1, z0, z1)
        return False
    for qx, (a, c) in ((-1, (x0, cx)), (1, (cx, x1))):
        for qz, (d, e) in ((-1, (z0, cz)), (1, (cz, z1))):
            if (qx, qz) != DAMAGED_QUADRANT:
                s.box(a, c, y1 - CAPITAL, y1, d, e)
    return True


# ----------------------------------------------------------------- trusses --
def section(pieces):
    """The hall's section from its pieces' boxes: (z0, z1, y0, y1, zr, k), the
    eaves' z and y, the ridge's y and z, and the pitch."""
    z0 = min(p['box']['min']['z'] for p in pieces)
    z1 = max(p['box']['max']['z'] for p in pieces)
    y0 = min(p['box']['min']['y'] for p in pieces)
    y1 = max(p['box']['max']['y'] for p in pieces)
    zr = (z0 + z1) / 2
    return z0, z1, y0, y1, zr, (y1 - y0) / (zr - z0)


def build_truss(s, piece):
    b = piece['box']
    z0, z1, y0, y1, zr, k = section([piece])
    xc = (b['min']['x'] + b['max']['x']) / 2
    xa, xb = xc - MEMBER / 2, xc + MEMBER / 2

    def top(z):
        return y1 - k * abs(z - zr)

    def member(poly):
        s.plate(poly, xa, xb, axis='x')

    foot = RAFTER / k
    member([(z0, y0), (zr, y1), (zr, y1 - RAFTER), (z0 + foot, y0)])
    member([(z1, y0), (z1 - foot, y0), (zr, y1 - RAFTER), (zr, y1)])
    member([(z0, y0), (z1, y0), (z1, y0 + TIE), (z0, y0 + TIE)])
    ka, kb = zr - KING / 2, zr + KING / 2
    member([(ka, y0 + TIE), (kb, y0 + TIE), (kb, top(kb)), (zr, y1), (ka, top(ka))])
    for side, zm in ((-1, (z0 + zr) / 2), (1, (zr + z1) / 2)):
        fz, fy = zr + side * KING / 2, y0 + TIE
        ez, ey = zm, top(zm) - RAFTER / 2
        dz, dy = ez - fz, ey - fy
        n = math.hypot(dz, dy)
        pz, py = -dy / n * STRUT / 2, dz / n * STRUT / 2
        member([(fz - pz, fy - py), (ez - pz, ey - py), (ez + pz, ey + py), (fz + pz, fy + py)])


# -------------------------------------------------------------------- roof --
def build_roof(s, bp, room, roofs, runs, discs, hole=None):
    """The hall's roof over `room` from the section of its `roofs` pieces:
    slot 0 slates, slot 1 boards. `hole` (x0, x1, z0, z1) opens it under the
    louvre (#854): each slope is then three rectangles, the two either side
    of the hole's x span whole and the middle one stopping at the hole's z.
    The south slope stops at the pieces' south face, z1 (#922). Returns
    (north eave z, south z, ridge top)."""
    z0, z1, y0, y1, zr, k = section(roofs)
    rb = room['bounds']
    rx0, rx1, south = rb['min']['x'], rb['max']['x'], z1
    north = [r for r in runs if r['box']['min']['z'] - EPS <= rb['min']['z'] <= r['box']['max']['z'] + EPS
             and r['box']['max']['z'] - r['box']['min']['z'] < r['box']['max']['x'] - r['box']['min']['x']
             and r['box']['min']['x'] <= rx0 + EPS and r['box']['max']['x'] >= rx1 - EPS]
    if len(north) != 1:
        raise ValueError(f"buildings: {room['id']} needs one north run under its eave, found {[r['id'] for r in north]}")
    eave = north[0]['box']['min']['z'] - EAVE_PAST

    def under_n(x, z):
        return y0 + k * (z - z0)

    def under_s(x, z):
        return y0 + k * (z1 - z)

    slopes = [((rx0, rx1, eave, zr), under_n), ((rx0, rx1, zr, south), under_s)]
    if hole is not None:
        hx0, hx1, hz0, hz1 = hole
        if not (rx0 < hx0 < hx1 < rx1 and eave < hz0 < zr < hz1 < south):
            raise ValueError(f"buildings: the louvre's hole x {hx0:g} to {hx1:g}, z {hz0:g} to {hz1:g} is not inside "
                             f"both slopes of {room['id']}'s roof")
        slopes = [((rx0, hx0, eave, zr), under_n), ((hx1, rx1, eave, zr), under_n), ((hx0, hx1, eave, hz0), under_n),
                  ((rx0, hx0, zr, south), under_s), ((hx1, rx1, zr, south), under_s), ((hx0, hx1, hz1, south), under_s)]
    for rect, under in slopes:
        poly = masonry.minus_discs(rect, discs)
        s.slab(poly, under, BOARDS, slot=1)
        s.slab(poly, lambda x, z, under=under: under(x, z) + BOARDS, SLATES, slot=0)

    tri = [(z0, y0), (zr, y1), (z1, y0)]
    for xa, xb in ((rx0, rx0 + GABLE), (rx1 - GABLE, rx1)):
        lo, hi = z0, z1
        for cx, cz, r in discs:
            dx = min(abs(xa - cx), abs(xb - cx))
            if dx >= r:
                continue
            h = math.sqrt(r * r - dx * dx)
            a, c = cz - h, cz + h
            if c <= lo or a >= hi:
                continue
            if a <= lo and c < hi:
                lo = c
            elif c >= hi and a > lo:
                hi = a
            else:
                raise ValueError(f"buildings: the gable at x {xa:g} is split by the disc at ({cx:g}, {cz:g})")
        poly = masonry.clip_rect(tri, lo, hi, -1e9, 1e9)
        if poly:
            s.plate(poly, xa, xb, slot=1, axis='x')
    return eave, south, y1 + BOARDS + SLATES


def build_corbels(s, bp, trusses, discs):
    """One block under each south truss foot not inside a drum disc; returns
    (count, the slug) and raises unless every foot's wall is one slug."""
    slugs = set()
    n = 0
    for t in trusses:
        b = t['box']
        xc, fz = (b['min']['x'] + b['max']['x']) / 2, b['max']['z']
        if in_disc(discs, xc, fz):
            continue
        behind = [p for p in bp['pieces'] if p['kind'] == 'wall' and p['level'] == 0
                  and abs(p['box']['min']['z'] - CORBEL_Z[1]) < EPS
                  and p['box']['min']['x'] <= xc - CORBEL_HALF + EPS and p['box']['max']['x'] >= xc + CORBEL_HALF - EPS]
        here = {p['material'] for p in behind}
        if len(here) != 1:
            raise ValueError(f"buildings: the corbel under {t['id']} has {len(here)} wall slugs behind it at z "
                             f"{CORBEL_Z[1]:g} ({', '.join(p['id'] for p in behind) or 'none'}); it needs one")
        slugs |= here
        s.box(xc - CORBEL_HALF, xc + CORBEL_HALF, CORBEL_Y[0], CORBEL_Y[1], CORBEL_Z[0], CORBEL_Z[1])
        n += 1
    if len(slugs) != 1:
        raise ValueError(f"buildings: the hall's corbels stand against {len(slugs)} slugs ({sorted(slugs)}); they need one")
    return n, slugs.pop()


# ------------------------------------------------------- dressed openings --
def _axes(piece):
    b = piece['box']
    along = 'x' if b['max']['x'] - b['min']['x'] > b['max']['z'] - b['min']['z'] else 'z'
    return along, ('z' if along == 'x' else 'x')


def _clipped(piece, cols):
    """The collider boxes clipped to the piece's box, as build_run clips them."""
    b = piece['box']
    out = []
    for c in cols:
        q = {'min': {k: max(c['box']['min'][k], b['min'][k]) for k in 'xyz'},
             'max': {k: min(c['box']['max'][k], b['max'][k]) for k in 'xyz'}}
        if all(q['max'][k] - q['min'][k] > EPS for k in 'xyz'):
            out.append(q)
    return out


def openings(piece, cols):
    """The piece box less the colliders, as {'a': (lo, hi), 'y': (lo, hi)}
    along the run: found on the grid of the colliders' edges, merged along the
    run and then in y. Raises if a gap does not span the run's whole depth."""
    b = piece['box']
    along, across = _axes(piece)
    boxes = _clipped(piece, cols)
    A = sorted({b['min'][along], b['max'][along]} | {q[e][along] for q in boxes for e in ('min', 'max')})
    Y = sorted({b['min']['y'], b['max']['y']} | {q[e]['y'] for q in boxes for e in ('min', 'max')})
    depth = b['max'][across] - b['min'][across]
    rows = {}
    for y0, y1 in zip(Y, Y[1:]):
        for a0, a1 in zip(A, A[1:]):
            cover = [q for q in boxes if min(q['max'][along], a1) - max(q['min'][along], a0) > EPS
                     and min(q['max']['y'], y1) - max(q['min']['y'], y0) > EPS]
            if cover:
                if not any(q['max'][across] - q['min'][across] > depth - EPS for q in cover):
                    raise ValueError(f"buildings: {piece['id']} has a gap at {along} {a0:g} to {a1:g}, y {y0:g} to "
                                     f"{y1:g} that does not span its {depth:g} m depth")
                continue
            row = rows.setdefault((y0, y1), [])
            if row and abs(row[-1][1] - a0) < EPS:
                row[-1] = (row[-1][0], a1)
            else:
                row.append((a0, a1))
    out = []
    for (y0, y1), row in sorted(rows.items()):
        for a in row:
            up = next((o for o in out if abs(o['a'][0] - a[0]) < EPS and abs(o['a'][1] - a[1]) < EPS
                       and abs(o['y'][1] - y0) < EPS), None)
            if up:
                up['y'] = (up['y'][0], y1)
            else:
                out.append({'a': a, 'y': (y0, y1)})
    return out


def dressed(piece, cols):
    """#854: the run's openings grown by DRESS along the run and in y, a door
    (an opening on the piece's foot) with no sill band; raises if one leaves
    the piece box or two meet, naming the run and both by their centres."""
    b = piece['box']
    along, _across = _axes(piece)

    def centre(o):
        return f"({along} {(o['a'][0] + o['a'][1]) / 2:g}, y {(o['y'][0] + o['y'][1]) / 2:g})"
    grown = []
    for o in openings(piece, cols):
        door = abs(o['y'][0] - b['min']['y']) < EPS
        g = {'a': (o['a'][0] - DRESS, o['a'][1] + DRESS),
             'y': (o['y'][0] if door else o['y'][0] - DRESS, o['y'][1] + DRESS), 'of': o}
        if g['a'][0] < b['min'][along] - EPS or g['a'][1] > b['max'][along] + EPS \
                or g['y'][0] < b['min']['y'] - EPS or g['y'][1] > b['max']['y'] + EPS:
            raise ValueError(f"buildings: {piece['id']}'s opening at {centre(o)} grown by DRESS {DRESS:g} m leaves "
                             f"the run's box")
        for h in grown:
            ya, yb = max(g['y'][0], h['y'][0]), min(g['y'][1], h['y'][1])
            if min(g['a'][1], h['a'][1]) - max(g['a'][0], h['a'][0]) > EPS and yb - ya > EPS:
                raise ValueError(f"buildings: {piece['id']}'s openings at {centre(h['of'])} and {centre(o)}, grown by "
                                 f"DRESS {DRESS:g} m, overlap from y {ya:g} to {yb:g}")
        grown.append(g)
    return grown


def cuts_of(piece, grown):
    along, _across = _axes(piece)
    return {along: [v for g in grown for v in g['a']], 'y': [v for g in grown for v in g['y']]}


def in_grown(piece, grown):
    """test(x, y, z) for Solid.paint: inside a grown opening along and in y,
    across the piece box's full depth."""
    b = piece['box']
    along, across = _axes(piece)

    def test(x, y, z):
        p = {'x': x, 'y': y, 'z': z}
        if not b['min'][across] - EPS <= p[across] <= b['max'][across] + EPS:
            return False
        return any(g['a'][0] + EPS < p[along] < g['a'][1] - EPS and g['y'][0] + EPS < y < g['y'][1] - EPS
                   for g in grown)
    return test


# ------------------------------------------------ roofs, beams and plaster --
def clear_span(room, walls):
    """(x0, x1, z0, z1): the room's bounds moved in to the inner face of every
    level-0 wall piece that straddles one of its edges, and the pieces that
    did it per edge {'x0': [...], ...}."""
    rb = room['bounds']
    x0, x1, z0, z1 = rb['min']['x'], rb['max']['x'], rb['min']['z'], rb['max']['z']
    by = {'x0': [], 'x1': [], 'z0': [], 'z1': []}
    for p in walls:
        q = p['box']
        over_x = min(q['max']['x'], rb['max']['x']) - max(q['min']['x'], rb['min']['x']) > EPS
        over_z = min(q['max']['z'], rb['max']['z']) - max(q['min']['z'], rb['min']['z']) > EPS
        if over_z and q['min']['x'] + EPS < rb['min']['x'] < q['max']['x'] - EPS:
            x0 = max(x0, q['max']['x'])
            by['x0'].append(p)
        if over_z and q['min']['x'] + EPS < rb['max']['x'] < q['max']['x'] - EPS:
            x1 = min(x1, q['min']['x'])
            by['x1'].append(p)
        if over_x and q['min']['z'] + EPS < rb['min']['z'] < q['max']['z'] - EPS:
            z0 = max(z0, q['max']['z'])
            by['z0'].append(p)
        if over_x and q['min']['z'] + EPS < rb['max']['z'] < q['max']['z'] - EPS:
            z1 = min(z1, q['min']['z'])
            by['z1'].append(p)
    return (x0, x1, z0, z1), by


def _meets_props(what, box, props, grow=0.0):
    g = _grown(box, grow) if grow else box
    for p in props:
        if _overlap(g, p['box']):
            raise ValueError(f"buildings: {what} (x {box['min']['x']:g} to {box['max']['x']:g}, y {box['min']['y']:g} "
                             f"to {box['max']['y']:g}, z {box['min']['z']:g} to {box['max']['z']:g})"
                             + (f", grown by {grow:g} m," if grow else '') + f" meets props piece {p['id']}'s box")


def _box(x0, x1, y0, y1, z0, z1):
    return {'min': {'x': x0, 'y': y0, 'z': z0}, 'max': {'x': x1, 'y': y1, 'z': z1}}


def build_beams(s, room_id, xs, span, y1, discs, props):
    """BEAM square beams at `xs`, their tops at y1, over `span` in z, from a
    drum's face where a disc holds an end, BEAR into the stone at each end.
    Raises if one leaves the span in x or its box meets a prop's."""
    x0, x1, z0, z1 = span
    for x in xs:
        a, b = x - BEAM / 2, x + BEAM / 2
        if a < x0 - EPS or b > x1 + EPS:
            raise ValueError(f"buildings: the beam at x {x:g} in {room_id} leaves its clear span x {x0:g} to {x1:g}")
        za, zb = z0, z1
        for cx, cz, r in discs:
            if abs(x - cx) >= r:
                continue
            h = math.sqrt(r * r - (x - cx) ** 2)
            if cz - h < za + EPS < cz + h:
                za = cz + h
            if cz - h < zb - EPS < cz + h:
                zb = cz - h
        box = _box(a, b, y1 - BEAM, y1, za - BEAR, zb + BEAR)
        _meets_props(f"the beam at x {x:g} in {room_id}", box, props)
        s.box(a, b, y1 - BEAM, y1, za - BEAR, zb + BEAR)


def build_plaster(s, room_id, span, y0, y1, bp, walls, run_cols, grown_of):
    """The skin on every run face on the clear span's edge, less each box's
    openings and, in a dressed run, its grown openings; returns the runs."""
    x0, x1, z0, z1 = span
    edges = (('x', x0, 'max', 1, 'z', (z0, z1)), ('x', x1, 'min', -1, 'z', (z0, z1)),
             ('z', z0, 'max', 1, 'x', (x0, x1)), ('z', z1, 'min', -1, 'x', (x0, x1)))
    used = []
    for k, plane, end, inward, along, (a0, a1) in edges:
        for p in walls:
            q = p['box']
            if abs(q[end][k] - plane) > EPS or min(q['max'][along], a1) - max(q['min'][along], a0) < EPS \
                    or q['max']['y'] < y1 - EPS:
                continue
            cols = run_cols.get(p['id']) or masonry.colliders_of(bp, p['id'])
            grown = grown_of.get(p['id'], [])
            if grown:
                cols = masonry.split_boxes(cols, cuts_of(p, grown))
            inside = in_grown(p, grown)
            used.append(p['id'])
            for c in _clipped(p, cols):
                if abs(c[end][k] - plane) > EPS:
                    continue
                ca, cb = max(c['min'][along], a0), min(c['max'][along], a1)
                ya, yb = max(c['min']['y'], y0), min(c['max']['y'], y1)
                if cb - ca < EPS or yb - ya < EPS:
                    continue
                mid = {k: plane, along: (c['min'][along] + c['max'][along]) / 2, 'y': (c['min']['y'] + c['max']['y']) / 2}
                if grown and inside(mid['x'], mid['y'], mid['z']):
                    continue
                ka, kb = sorted((plane, plane + inward * PLASTER))
                if k == 'x':
                    s.box(ka, kb, ya, yb, ca, cb)
                else:
                    s.box(ca, cb, ya, yb, ka, kb)
    if not used:
        raise ValueError(f"buildings: {room_id} has no run on its clear span's edges to plaster")
    return used


def build_lean_to(s, room_id, span, by, walls, discs):
    """The lean-to from EAVE_PAST beyond the low run's outer face to the
    curtain: underside through the low run's OUTER top edge (#855: "The roof
    should sit on the wall") and the curtain's top less the hall roof's
    thickness; slot 0 slates, slot 1 boards. Returns (eave z, eave underside,
    pitch, its box, the low run's box, under(x, z))."""
    x0, x1, z0, z1 = span
    if len(by['z0']) != 1:
        raise ValueError(f"buildings: {room_id}'s lean-to needs one low run on its north edge, found "
                         f"{[p['id'] for p in by['z0']]}")
    low = by['z0'][0]['box']
    high = [p for p in walls if abs(p['box']['min']['z'] - z1) < EPS
            and min(p['box']['max']['x'], x1) - max(p['box']['min']['x'], x0) > EPS]
    heights = {p['box']['max']['y'] for p in high}
    if len(heights) != 1:
        raise ValueError(f"buildings: {room_id}'s lean-to meets {len(heights)} wall tops at z {z1:g}; it needs one")
    ya, za = low['max']['y'], low['min']['z']
    yb = heights.pop() - BOARDS - SLATES
    k = (yb - ya) / (z1 - za)
    eave = low['min']['z'] - EAVE_PAST

    def under(x, z):
        return ya + k * (z - za)
    poly = masonry.minus_discs((x0, x1, eave, z1), discs)
    s.slab(poly, under, BOARDS, slot=1)
    s.slab(poly, lambda x, z: under(x, z) + BOARDS, SLATES, slot=0)
    return eave, under(0, eave), k, _box(x0, x1, under(0, eave), yb + BOARDS + SLATES, eave, z1), low, under


def build_plate(s, span, low, under):
    """#855: the wall plate filling the wedge between the low run's top and
    the lean-to's underside, over the roof's x span: a plate in (z, y)."""
    x0, x1, _z0, _z1 = span
    za, zb, y = low['min']['z'], low['max']['z'], low['max']['y']
    s.plate([(za, y), (zb, y), (zb, under(0, zb)), (za, under(0, za))], x0, x1, axis='x')
    return _box(x0, x1, y, under(0, zb), za, zb)


# -------------------------------------------------------------- the louvre --
def louvre_hole(roofs):
    """The hole under the louvre, inside its sills and posts: (x0, x1, z0, z1)."""
    _z0, _z1, _y0, _y1, zr, _k = section(roofs)
    hx = LOUVRE_SIZE[0] / 2 - LOUVRE_FRAME
    hz = LOUVRE_SIZE[1] / 2 - LOUVRE_FRAME
    return (LOUVRE_X - hx, LOUVRE_X + hx, zr - hz, zr + hz)


def check_hole(hole, trusses):
    """Raises if the hole's x span grown by LOUVRE_CLEAR meets a hall-truss
    piece's box, naming it."""
    hx0, hx1, hz0, hz1 = hole
    for t in trusses:
        b = t['box']
        if min(b['max']['x'], hx1 + LOUVRE_CLEAR) - max(b['min']['x'], hx0 - LOUVRE_CLEAR) > EPS \
                and min(b['max']['z'], hz1) - max(b['min']['z'], hz0) > EPS:
            raise ValueError(f"buildings: the louvre's hole x {hx0:g} to {hx1:g} (LOUVRE_X {LOUVRE_X:g}), grown by "
                             f"{LOUVRE_CLEAR:g} m, meets {t['id']}'s box (x {b['min']['x']:g} to {b['max']['x']:g})")


def build_louvre(s, roofs):
    """The louvre over the ridge at LOUVRE_X: slot 0 slates, 1 boards, 2
    rough_wood. Returns (foot y, head y, cap ridge y, its box)."""
    _z0, _z1, _y0, y1, zr, k = section(roofs)
    top = y1 + BOARDS + SLATES                           # the hall roof's ridge top
    w, d, f = LOUVRE_SIZE[0], LOUVRE_SIZE[1], LOUVRE_FRAME
    fx0, fx1, fz0, fz1 = LOUVRE_X - w / 2, LOUVRE_X + w / 2, zr - d / 2, zr + d / 2
    foot = top - k * d / 2                               # the roof's top under the sills' outer edge
    head = top + LOUVRE_RISE
    apex = head + k * d / 2                              # the cap's underside at the ridge
    for za, zb in ((fz0, fz0 + f), (fz1 - f, fz1)):
        s.box(fx0, fx1, foot, foot + f, za, zb, slot=2)      # sill
        s.box(fx0, fx1, head - f, head, za, zb, slot=2)      # head plate
        for xa in (fx0, fx1 - f):
            s.box(xa, xa + f, foot + f, head - f, za, zb, slot=2)  # corner post
    sw, st, tip = SLAT
    c, sn = math.cos(math.radians(tip)), math.sin(math.radians(tip))
    pitch = (head - f - (foot + f)) / LOUVRE_SLATS
    for out, zc in ((-1, fz0 + f / 2), (1, fz1 - f / 2)):
        dz, dy = -out * c, sn                              # up the slat, inward: its low edge is outward
        nz, ny = -dy, dz
        for i in range(LOUVRE_SLATS):
            yc = foot + f + pitch * (i + 0.5)
            poly = [(zc + sa * dz * sw / 2 + sb * nz * st / 2, yc + sa * dy * sw / 2 + sb * ny * st / 2)
                    for sa, sb in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            s.plate(poly, fx0 + f, fx1 - f, slot=1, axis='x')
    for xa, xb in ((fx0, fx0 + GABLE), (fx1 - GABLE, fx1)):
        s.plate([(fz0, foot), (zr, top), (zr, apex), (fz0, head)], xa, xb, slot=1, axis='x')
        s.plate([(zr, top), (fz1, foot), (fz1, head), (zr, apex)], xa, xb, slot=1, axis='x')
    e = LOUVRE_EAVE
    for rect, under in (((fx0 - e, fx1 + e, fz0 - e, zr), lambda x, z: apex - k * (zr - z)),
                        ((fx0 - e, fx1 + e, zr, fz1 + e), lambda x, z: apex - k * (z - zr))):
        x0, x1, z0, z1 = rect
        poly = [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]
        s.slab(poly, under, BOARDS, slot=1)
        s.slab(poly, lambda x, z, under=under: under(x, z) + BOARDS, SLATES, slot=0)
    ridge = apex + BOARDS + SLATES
    return foot, head, ridge, _box(fx0 - e, fx1 + e, foot, ridge, fz0 - e, fz1 + e)


# ------------------------------------------------------------------- build --
def build(bp):
    col = common.stage_collection('buildings')
    table = common.STAGE_OF(bp)
    mine = [p for p in bp['pieces'] if table[p['id']] == 'buildings']
    props = [p for p in bp['pieces'] if table[p['id']] == 'props']
    rooms = {r['id']: r for r in bp['rooms']}
    discs = discs_of(bp)
    has_col = {p['id'] for p in mine if any(c['id'] == p['id'] or (c['id'].startswith(p['id'] + '-') and
               c['id'][len(p['id']) + 1:].isdigit()) for c in bp['colliders'])}

    columns = [p for p in mine if p['kind'] == 'wall' and p['id'].startswith('column')]
    decks = [p for p in mine if p['kind'] == 'wall' and p not in columns and p['id'] not in has_col]
    runs = [p for p in mine if p['kind'] == 'wall' and p not in columns and p not in decks]
    uppers = [p for p in mine if p['kind'] == 'floor']
    grounds = [p for p in mine if p['kind'] == 'ground']
    trusses = [p for p in mine if p['kind'] == 'decor' and p['id'].startswith('hall-truss-')]
    roofs = [p for p in mine if p['kind'] == 'decor' and p['id'].startswith('hall-roof-')]
    done = columns + decks + runs + uppers + grounds + trusses + roofs
    other = [p['id'] for p in mine if p not in done]
    if other:
        raise ValueError(f"buildings: STAGE_OF gives this stage pieces it does not build: {other}")
    unknown = sorted(set(WINDOWS) - {p['id'] for p in runs})
    if unknown:
        raise ValueError(f"buildings: WINDOWS names {unknown}, which are not runs of this stage")

    # the runs, with #853's windows, and #854's dressing round every opening in rubble
    windows = 0
    run_cols, grown_of, dress_log = {}, {}, []
    for p in runs:
        cols = masonry.colliders_of(bp, p['id'])
        for block in window_blocks(bp, p, props):
            cols = walls.minus_block(cols, block)
            windows += 1
        run_cols[p['id']] = cols
        mats = [materials.library(p['material'])]
        grown = [] if p['material'] == materials.DRESSED else dressed(p, cols)
        if grown:
            grown_of[p['id']] = grown
            cols = masonry.split_boxes(cols, cuts_of(p, grown))
        s = masonry.Solid()
        walls.build_run(s, p, cols, None, batter=False)
        if grown:
            dress_log.append(f"{p['id']} {len(grown)} openings, {s.paint(in_grown(p, grown), 1)} faces")
            mats.append(materials.dressing())
        s.finish(f"WALL_{p['id']}", col, mats, plan_id=p['id'])

    # the lodge's deck
    for p in decks:
        b = p['box']
        poly = masonry.minus_discs((b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z']), discs)
        s = masonry.Solid()
        s.prism(lambda y, poly=poly: poly, [b['min']['y'], b['max']['y']])
        s.finish(f"DECK_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id'])

    # the upper floors, their collider clipped to their box, less the discs
    for p in uppers:
        b = p['box']
        s = masonry.Solid()
        carpet = p['material'] == CARPET[0]
        for c in masonry.colliders_of(bp, p['id']):
            cb = c['box']
            rect = (max(cb['min']['x'], b['min']['x']), min(cb['max']['x'], b['max']['x']),
                    max(cb['min']['z'], b['min']['z']), min(cb['max']['z'], b['max']['z']))
            y0, y1 = max(cb['min']['y'], b['min']['y']), min(cb['max']['y'], b['max']['y'])
            poly = masonry.minus_discs(rect, discs)
            if carpet:
                s.prism(lambda y, poly=poly: poly, [y0, y1 - CARPET[1]], slot=1)
                s.prism(lambda y, poly=poly: poly, [y1 - CARPET[1], y1], slot=0)
            else:
                s.prism(lambda y, poly=poly: poly, [y0, y1])
        mats = [materials.library(p['material'])] + ([materials.library(CARPET[2])] if carpet else [])
        s.finish(f"FLOOR_{p['id']}", col, mats, plan_id=p['id'])

    # the ground floors: a disc uncut, a rectangle less the discs
    n_disc = 0
    for p in grounds:
        b = p['box']
        if p.get('disc'):
            d = p['disc']
            poly = [masonry.ring_point(d['cx'], d['cz'], d['radius'], 360.0 * k / towers.DISC_FACETS)
                    for k in range(towers.DISC_FACETS)]
            n_disc += 1
        else:
            poly = masonry.minus_discs((b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z']), discs)
        s = masonry.Solid()
        s.prism(lambda y, poly=poly: poly, list(GROUND_Y))
        s.finish(f"FLOOR_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id'])

    # the columns
    checked = []
    for p in columns:
        s = masonry.Solid()
        build_column(s, p)
        ob = s.finish(f"COLUMN_{p['id']}", col, [materials.library(COLUMN_STONE)], plan_id=p['id'])
        checked.append((ob, p, EVERY_FACE))

    # the trusses, one object each (#528)
    for p in trusses:
        s = masonry.Solid()
        build_truss(s, p)
        ob = s.finish(f"TRUSS_{p['id']}", col, [materials.library(TIMBER)], plan_id=p['id'], smooth_angle=5.0)
        checked.append((ob, p, TRUSS_FACES))

    # the roof, carrying the seven hall-roof ids, its gables, and the corbels
    covered = {p['roofs'] for p in trusses + roofs}
    if covered != {ROOF_OF}:
        raise ValueError(f"buildings: the trusses and roof pieces roof {sorted(covered)}, not {ROOF_OF}")
    hole = louvre_hole(roofs)
    check_hole(hole, trusses)
    s = masonry.Solid()
    eave, south, ridge = build_roof(s, bp, rooms[ROOF_OF], roofs, runs, discs, hole)
    roof = s.finish(f"ROOF_{ROOF_OF}", col, [materials.library(ROOF_SLATES), materials.library(ROOF_BOARDS)],
                    plan_ids=sorted(p['id'] for p in roofs), smooth_angle=5.0)
    s = masonry.Solid()
    corbels, slug = build_corbels(s, bp, trusses, discs)
    ob = s.finish(f"CORBELS_{ROOF_OF}", col, [materials.library(slug)])
    ob['modelOnly'] = MODEL_ONLY

    # #854: the ridge louvre over the opened bay
    s = masonry.Solid()
    foot, head, cap, lbox = build_louvre(s, roofs)
    _meets_props(f"LOUVRE_{ROOF_OF}", lbox, props, LOUVRE_CLEAR)
    ob = s.finish(f"LOUVRE_{ROOF_OF}", col, [materials.library(ROOF_SLATES), materials.library(ROOF_BOARDS),
                                             materials.library(TIMBER)], smooth_angle=5.0)
    ob['modelOnly'] = LOUVRE_ONLY
    left = max((t for t in trusses if (t['box']['min']['x'] + t['box']['max']['x']) / 2 < LOUVRE_X),
               key=lambda t: t['box']['min']['x'])
    right = min((t for t in trusses if (t['box']['min']['x'] + t['box']['max']['x']) / 2 > LOUVRE_X),
                key=lambda t: t['box']['min']['x'])
    louvre_log = (f"{ob.name} over the bay between {left['id']} and {right['id']} at x {LOUVRE_X:g}, hole x "
                  f"{hole[0]:g} to {hole[1]:g}, z {hole[2]:g} to {hole[3]:g}, foot y {foot:.3f}, head y {head:.3f}, "
                  f"cap ridge y {cap:.3f}, modelOnly {LOUVRE_ONLY}")

    # #853, 4b: the other rooms' roofs, beams and plaster
    level0 = [p for p in bp['pieces'] if p['kind'] == 'wall' and p['level'] == 0]
    unknown = sorted((set(BEAMS) | set(FLAT_ROOFS) | set(PLASTERED) | {LEAN_TO}) - set(rooms))
    if unknown:
        raise ValueError(f"buildings: BEAMS, FLAT_ROOFS, PLASTERED or LEAN_TO name {unknown}, which are not rooms")
    spans = {rid: clear_span(rooms[rid], level0) for rid in set(BEAMS) | set(FLAT_ROOFS) | set(PLASTERED) | {LEAN_TO}}
    roof_log = []
    for rid in FLAT_ROOFS:
        x0, x1, z0, z1 = spans[rid][0]
        s = masonry.Solid()
        poly = masonry.minus_discs((x0, x1, z0, z1), discs)
        s.prism(lambda y, poly=poly: poly, [FLAT_Y[0], FLAT_Y[1] - FLAT_TOP[1]], slot=1)
        s.prism(lambda y, poly=poly: poly, [FLAT_Y[1] - FLAT_TOP[1], FLAT_Y[1]], slot=0)
        _meets_props(f"ROOF_{rid}", _box(x0, x1, FLAT_Y[0], FLAT_Y[1], z0, z1), props)
        ob = s.finish(f"ROOF_{rid}", col, [materials.library(FLAT_TOP[0]), materials.library(FLAT_BOARDS)])
        ob['modelOnly'] = MODEL_ONLY
        roof_log.append(f"{ob.name} x {x0:g} to {x1:g}, z {z0:g} to {z1:g}")
    s = masonry.Solid()
    l_eave, l_y, l_k, l_box, low, l_under = build_lean_to(s, LEAN_TO, *spans[LEAN_TO], level0, discs)
    _meets_props(f"ROOF_{LEAN_TO}", l_box, props)
    ob = s.finish(f"ROOF_{LEAN_TO}", col, [materials.library(ROOF_SLATES), materials.library(ROOF_BOARDS)],
                  smooth_angle=5.0)
    ob['modelOnly'] = MODEL_ONLY
    roof_log.append(f"{ob.name} lean-to, pitch {l_k:.3f}, eave z {l_eave:g} underside {l_y:.3f} top "
                    f"{l_y + BOARDS + SLATES:.3f}")

    # #855: the lean-to's wall plate
    s = masonry.Solid()
    pbox = build_plate(s, spans[LEAN_TO][0], low, l_under)
    _meets_props(f"PLATE_{LEAN_TO}", pbox, props, PLATE_CLEAR)
    ob = s.finish(f"PLATE_{LEAN_TO}", col, [materials.library(TIMBER)])
    ob['modelOnly'] = PLATE_ONLY
    roof_log.append(f"{ob.name} x {pbox['min']['x']:g} to {pbox['max']['x']:g}, z {pbox['min']['z']:g} to "
                    f"{pbox['max']['z']:g}, y {pbox['min']['y']:g} to {pbox['max']['y']:.3f}, modelOnly {PLATE_ONLY}")
    ceiling = {}
    for rid in BEAMS:
        if rid in FLAT_ROOFS:
            ceiling[rid] = FLAT_Y[0]
            continue
        rb = rooms[rid]['bounds']
        over = [p for p in uppers if all(abs(p['box'][e][k] - rb[e][k]) < EPS for e in ('min', 'max') for k in 'xz')]
        if len(over) != 1:
            raise ValueError(f"buildings: {rid} has BEAMS but {len(over)} upper floors over it and no flat roof")
        ceiling[rid] = over[0]['box']['min']['y']
    beams = 0
    for rid, xs in BEAMS.items():
        s = masonry.Solid()
        build_beams(s, rid, xs, spans[rid][0], ceiling[rid], discs, props)
        ob = s.finish(f"BEAMS_{rid}", col, [materials.library(TIMBER)])
        ob['modelOnly'] = MODEL_ONLY
        beams += len(xs)

    plaster_log = []
    floors = {p['id']: p for p in uppers}
    for rid in PLASTERED:
        fl = floors.get(f"floor-{rid}")
        if fl is None:
            raise ValueError(f"buildings: {rid} is PLASTERED but has no upper floor floor-{rid}")
        s = masonry.Solid()
        used = build_plaster(s, rid, spans[rid][0], fl['box']['max']['y'], FLAT_Y[0], bp, level0, run_cols, grown_of)
        ob = s.finish(f"PLASTER_{rid}", col, [materials.library(PLASTER_SET)])
        ob['modelOnly'] = MODEL_ONLY
        plaster_log.append(f"{ob.name} on {len(used)} runs")

    bpy.context.view_layer.update()
    worst = max(check_box(ob, p, faces) for ob, p, faces in checked)
    # #922: the hall roof ends at the hall-roof pieces' south face, leaving #527's slot to the curtain
    roof_south, pieces_south = world_box(roof)['max']['z'], section(roofs)[1]
    if abs(roof_south - pieces_south) > BOX_TOLERANCE:
        raise ValueError(f"buildings: {roof.name} reaches z {roof_south:.3f}, past the hall-roof pieces' south face at "
                         f"z {pieces_south:g}; #922 cuts it back to #527's slot (tolerance {BOX_TOLERANCE} m)")
    slot = rooms[ROOF_OF]['bounds']['max']['z'] - roof_south
    print(f"buildings: {len(runs)} runs ({windows} #853 windows), {len(decks)} deck, {len(uppers)} upper floors, "
          f"{len(grounds)} ground floors ({n_disc} discs), {len(columns)} columns, {len(trusses)} trusses; "
          f"columns and trusses within {worst:.4f} m of their boxes; {roof.name} over {ROOF_OF} with planIds "
          f"{list(roof['planIds'])}, eave z {eave:g}, south z {south:g}, ridge top {ridge:.2f}, "
          f"#922 slot of sky to the curtain {slot:.3f} m; "
          f"{corbels} corbels in {slug}, modelOnly {MODEL_ONLY}")
    print(f"buildings 4b: dressed openings (DRESS {DRESS:g} m): {'; '.join(dress_log)}; {'; '.join(roof_log)}; "
          f"{beams} beams in {len(BEAMS)} BEAMS_ objects; {'; '.join(plaster_log)}; all modelOnly {MODEL_ONLY}")
    print(f"buildings 4b: {louvre_log}")
    look = materials.LOOK.get(PLASTER_SET, {})
    print(f"buildings 4b: MAT_{PLASTER_SET} LOOK {look}")
