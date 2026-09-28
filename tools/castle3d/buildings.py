# buildings.py - the buildings stage: the inner rooms' runs, floors and
# columns, the great hall's trusses and roof, and the hall's #853 windows,
# gables and corbels (increment 4a).
#
# Snapped to the blueprint (#500), and reading nothing else: never another
# stage's objects, which is what lets `--only buildings` build alone. Every
# number is the blueprint's or a named constant below, from SPECS.md's
# increment 4 open calls, in the game's frame. Everything this stage adds that
# realises no plan piece carries modelOnly "#853" and no planId.
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
# EAVE_PAST beyond the north run's outer face, the south slope on at the same
# pitch to the curtain's face, both slopes less the drum discs; closed at each
# end by a GABLE m board gable in the same object, clear of the drum discs.
#
# THE CORBELS (CORBELS_great-hall, modelOnly #853). One stone block under
# each south truss foot that is not inside a drum disc, in the material of
# the wall piece whose box face is behind it.

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
ROOF_BOARDS = 'old_planks_02'          # masons-lodge-roof's slug: the hall roof's underside
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
# in that wall: a look call, not a rule. 4b adds the other rooms' windows.
WINDOW_LIKE = ('kings-hall-south-3', 'kings-hall-south-4')
WINDOWS = {
    'great-hall-north': [-30, -22, -18, -14, -10],
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


def check_box(ob, piece, faces):
    """Raises unless `ob`'s world box is within BOX_TOLERANCE of the piece's box
    on each of `faces` ('min y', 'max z', ..., or 'centre x'), naming the piece
    and the worst face. Returns the worst difference."""
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
        raise ValueError(f"buildings: {ob.name} (piece {piece['id']}) is off its blueprint box by {worst:.3f} m "
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
def build_roof(s, bp, room, roofs, runs, discs):
    """The hall's roof over `room` from the section of its `roofs` pieces:
    slot 0 slates, slot 1 boards. Returns (north eave z, south z, ridge top)."""
    z0, z1, y0, y1, zr, k = section(roofs)
    rb = room['bounds']
    rx0, rx1, south = rb['min']['x'], rb['max']['x'], rb['max']['z']
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

    for rect, under in (((rx0, rx1, eave, zr), under_n), ((rx0, rx1, zr, south), under_s)):
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

    # the runs, with #853's windows
    windows = 0
    for p in runs:
        cols = masonry.colliders_of(bp, p['id'])
        for block in window_blocks(bp, p, props):
            cols = walls.minus_block(cols, block)
            windows += 1
        s = masonry.Solid()
        walls.build_run(s, p, cols, None, batter=False)
        s.finish(f"WALL_{p['id']}", col, [materials.library(p['material'])], plan_id=p['id'])

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
    s = masonry.Solid()
    eave, south, ridge = build_roof(s, bp, rooms[ROOF_OF], roofs, runs, discs)
    roof = s.finish(f"ROOF_{ROOF_OF}", col, [materials.library(ROOF_SLATES), materials.library(ROOF_BOARDS)],
                    plan_ids=sorted(p['id'] for p in roofs), smooth_angle=5.0)
    s = masonry.Solid()
    corbels, slug = build_corbels(s, bp, trusses, discs)
    ob = s.finish(f"CORBELS_{ROOF_OF}", col, [materials.library(slug)])
    ob['modelOnly'] = MODEL_ONLY

    bpy.context.view_layer.update()
    worst = max(check_box(ob, p, faces) for ob, p, faces in checked)
    print(f"buildings: {len(runs)} runs ({windows} #853 windows), {len(decks)} deck, {len(uppers)} upper floors, "
          f"{len(grounds)} ground floors ({n_disc} discs), {len(columns)} columns, {len(trusses)} trusses; "
          f"columns and trusses within {worst:.4f} m of their boxes; {roof.name} over {ROOF_OF} with planIds "
          f"{list(roof['planIds'])}, eave z {eave:g}, south z {south:g}, ridge top {ridge:.2f}; "
          f"{corbels} corbels in {slug}, modelOnly {MODEL_ONLY}")
