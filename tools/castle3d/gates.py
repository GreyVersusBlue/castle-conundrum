# gates.py - the gates stage: the three gate arches, the four leaves on their
# hinges, the west portcullis, the cell's bars and the Stockhouse walk bar, and
# #851's shut outer gate in barbican-west (increment 3).
#
# Every number is the blueprint's (#500) or a named constant below, from
# SPECS.md's increment 3 open calls. All five arches run their passage along
# game x, so "across" is z.
#
# THE ARCH (ARCH_<gate id>, planId <gate id>-arch). The game's drawn opening,
# not the collider rectangle: straight jambs at the jamb colliders' inner faces
# (z -+0.95) to the leaf's `springline` (2.0), a semicircular head of the
# leaf's `archRadius` (0.95) to a crown at the lintel collider's foot (2.95),
# through the arch's whole depth, and the lintel box from the crown to the
# arch's top (4). Per side one prism whose inner face follows that outline,
# HEAD_STEPS rings through the head at equal angles. The stone is the
# `material` of the level-0 wall pieces whose boxes touch the arch box's z
# faces, which must be one slug. Where those runs are battered (walls.BATTER),
# the arch's outer face splays with them through masonry.splay, so a curtain
# foot at z -+2 meets a jamb foot of the same splay; the porter arch stands in
# the plumb cross-wall and stays plumb.
#
# THE PORTCULLIS (PORT_<gate>, no planId: the plan has no portcullis piece, so
# line 6 neither needs nor sees one). In the west gate and #851's outer gate, a
# SLOT m slot centred SLOT_IN inside the outer face, cut SLOT_JAMB into each
# jamb, ground to the arch's top; in the slot's x band the arch is its two
# jamb boxes only. A timber grid of seven verticals and six horizontals, iron
# points under the verticals and iron straps over the two lowest horizontals.
# The west one is raised, its tips RAISED_BELOW_CROWN under the crown; the
# outer one stands on the ground.
#
# THE LEAVES (LEAF_<id>, planId <id>). Built in the hinge's local frame from
# the piece's `leaf` and `pivot`, never from shutAngle or openAngle: the
# pivot's rotationY is already the posed angle (#500). u runs 0 to `width`
# from the hinge, w is across the leaf: iron straps, seven planks each the
# outline clipped to its strip, two ledges. Parented, identity inverse, to
# GATE_<id>_HINGE, a plain-axes empty in MARKERS at `pivot.position` turned by
# `pivot.rotationY`, with no planId (#843; increment 8's markers.py adopts it
# by name). A hinge can never stand in for a deleted leaf: line 6 ignores
# MARKERS.
#
# THE BOX CHECK. Each LEAF_, BARS_ and BAR_ object's world box, its local
# bounds through matrix_world (what the plan measures, boxOfParts), must be
# within BOX_TOLERANCE of its blueprint box on every face, or the stage raises
# naming the piece and the worst face.
#
# #851. ARCH_barbican-outer is the block walls.OUTER_GATE cut out of
# WALL_barbican-west, built from the like-arch's three colliders with x
# replaced by the run's; two shut leaves, LEAF_barbican-outer-a (z -0.95 to 0)
# and -b (0 to 0.95), each half the west gate's leaf with a quarter-circle
# head, in the block's middle plane, ledges on the barbican side; and
# PORT_barbican-outer, lowered. None carries a planId; each carries
# modelOnly "#851" and none is named GATE_ (#843 keeps that for the plan's
# gates).

import math

import bpy
from mathutils import Matrix, Vector

import common
import masonry
import materials
import walls

EPS = 1e-6
BOX_TOLERANCE = 0.01
HEAD_STEPS = 16          # rings through an arch's head, at equal angles
LEAF_SEGMENTS = 24       # a leaf's semicircle, as buildGateLeaf's curveSegments

# The leaf's layers across w, from its centre plane (the leaf is 0.16 m).
STRAP_W = (-0.08, -0.07)
PLANK_W = (-0.07, 0.03)
LEDGE_W = (0.03, 0.08)
PLANKS = 7
PLANK_GAP = 0.005
LEDGE_TALL = 0.2
LEDGE_AT = (0.2, 0.6)    # of the springline, the ledges' centres
LEDGE_INSET = 0.05       # in from each edge
STRAP_TALL = 0.06
STRAP_REACH = 0.85       # of the width, from the hinge edge
OUTER_PLANKS = 4         # per half leaf of #851's gate

# The portcullis and its slot.
SLOT = 0.15
SLOT_IN = 0.25           # the slot's centre, inside the outer face
SLOT_JAMB = 0.15         # cut into each jamb past the opening
PORT_WIDTH = 2.2
GRID_TALL = 3.0
POINT = 0.2
POINT_R = 0.04
VERTICALS = 7
VERT_PITCH = 0.35
VERT_W = 0.1
BAR_D = 0.06             # a vertical's and a horizontal's depth; the grid is 0.12
HORIZONTALS = 6
HORIZ_T = 0.1
PSTRAP = (0.08, 0.01)    # a portcullis strap's height and thickness
RAISED_BELOW_CROWN = 0.3
PORTCULLIS = ('west-gate-arch',)   # the plan's arches with a slot; #851's outer gate has one too

# The cell's bars and the walk bar.
UPRIGHT = 0.05
RAIL_TALL = 0.06
CHAMFER = 0.01

HINGE_SIZE = 0.3
MODEL_ONLY = '#851'


# ------------------------------------------------------------------ helpers --
def _collider(bp, cid):
    c = next((c for c in bp['colliders'] if c['id'] == cid), None)
    if c is None:
        raise ValueError(f"gates: the blueprint has no collider {cid}")
    return c['box']


def arch_shape(bp, arch_id, leaf):
    """The opening from the arch's three colliders and its gate's leaf, in the
    arch's own z: {'jz', 'oz', 'spring', 'r', 'crown', 'top', 'cz', 'y0'}."""
    a = _collider(bp, f"{arch_id}-jamb-a")
    b = _collider(bp, f"{arch_id}-jamb-b")
    lintel = _collider(bp, f"{arch_id}-lintel")
    if not (a['max']['z'] < b['min']['z']):
        raise ValueError(f"gates: {arch_id}'s jambs do not stand either side of a passage along x")
    cz = (a['max']['z'] + b['min']['z']) / 2
    jz = (b['min']['z'] - a['max']['z']) / 2
    oz = b['max']['z'] - cz
    if abs((cz - a['min']['z']) - oz) > EPS:
        raise ValueError(f"gates: {arch_id}'s jambs are not symmetric about z {cz:g}")
    spring, r = leaf['springline'], leaf['archRadius']
    crown, top = lintel['min']['y'], lintel['max']['y']
    if abs(spring + r - crown) > EPS or abs(r - jz) > EPS:
        raise ValueError(f"gates: {arch_id}'s leaf (springline {spring:g}, archRadius {r:g}) does not fit its "
                         f"colliders' opening (half width {jz:g}, crown {crown:g})")
    return {'jz': jz, 'oz': oz, 'spring': spring, 'r': r, 'crown': crown, 'top': top, 'cz': cz, 'y0': a['min']['y']}


def _inner(sh, y):
    """The opening's half width at game height y."""
    if y <= sh['spring'] + EPS:
        return sh['jz']
    d = y - sh['spring']
    return math.sqrt(max(0.0, sh['r'] ** 2 - d * d))


def build_arch(s, sh, x0, x1, outer=None, slot=None):
    """The arch from x0 to x1. `outer` is -1 when the face at x0 is battered,
    1 when the face at x1 is, None for plumb. `slot` (a, b) is the portcullis
    band, where the arch is only its two jamb boxes, cut SLOT_JAMB deeper."""
    cz, jz, oz, y0, top = sh['cz'], sh['jz'], sh['oz'], sh['y0'], sh['top']
    head = [sh['spring'] + sh['r'] * math.sin(math.radians(90.0 * k / HEAD_STEPS)) for k in range(1, HEAD_STEPS)]
    ys = masonry.levels(y0, sh['crown'], sh['spring'], walls.BATTER[1], *head)
    bands = [(x0, x1)] if slot is None else [(x0, slot[0]), (slot[1], x1)]
    for xa, xb in bands:
        if xb - xa < EPS:
            continue
        for side in (-1, 1):
            def ring(y, xa=xa, xb=xb, side=side):
                sp = masonry.splay(y, *walls.BATTER)
                a = xa - sp if outer == -1 and abs(xa - x0) < EPS else xa
                b = xb + sp if outer == 1 and abs(xb - x1) < EPS else xb
                zi, zo = cz + side * _inner(sh, y), cz + side * oz
                z0, z1 = min(zi, zo), max(zi, zo)
                return [(a, z0), (b, z0), (b, z1), (a, z1)]
            s.prism(ring, ys)
        s.box(xa, xb, sh['crown'], top, cz - oz, cz + oz)
    if slot is not None:
        cut = jz + SLOT_JAMB
        s.box(slot[0], slot[1], y0, top, cz - oz, cz - cut)
        s.box(slot[0], slot[1], y0, top, cz + cut, cz + oz)


def slot_band(x0, x1, outer):
    """The portcullis slot's x band, SLOT_IN inside the outer face."""
    if outer is None:
        raise ValueError('gates: a portcullis slot needs an outer face')
    c = x0 + SLOT_IN if outer == -1 else x1 - SLOT_IN
    return (c - SLOT / 2, c + SLOT / 2), c


def arch_stone(bp, arch):
    """(slug, outer): the material of the level-0 wall pieces touching the arch
    box's z faces, which must be one slug, and the outer face's sign (-1 at
    min x, 1 at max x, None when those runs are not battered)."""
    b = arch['box']
    touching = []
    for p in bp['pieces']:
        if p['kind'] != 'wall' or p['level'] != 0:
            continue
        q = p['box']
        if not (abs(q['max']['z'] - b['min']['z']) < EPS or abs(q['min']['z'] - b['max']['z']) < EPS):
            continue
        if min(q['max']['x'], b['max']['x']) - max(q['min']['x'], b['min']['x']) < EPS:
            continue
        if min(q['max']['y'], b['max']['y']) - max(q['min']['y'], b['min']['y']) < EPS:
            continue
        touching.append(p)
    slugs = sorted({p['material'] for p in touching})
    if len(slugs) != 1:
        raise ValueError(f"gates: {arch['id']} touches wall pieces in {len(slugs)} materials "
                         f"({', '.join(p['id'] + ' ' + str(p['material']) for p in touching) or 'none'}); it needs one")
    return slugs[0], outer_of(bp, arch['id'], touching)


def outer_of(bp, what, runs):
    """The sign of the battered face the `runs` beside `what` share (-1 min x,
    1 max x), or None when they are plumb; raises when they disagree."""
    kinds = {walls.battered(p) for p in runs}
    if kinds == {False}:
        return None
    if len(kinds) != 1:
        raise ValueError(f"gates: {what} stands between battered and plumb runs ({', '.join(p['id'] for p in runs)})")
    facings = {walls.facing_of(bp, p) for p in runs}
    if len(facings) != 1:
        raise ValueError(f"gates: the runs beside {what} face different ways: {sorted(facings)}")
    axis, sign = facings.pop()
    if axis != 'z':
        raise ValueError(f"gates: the runs beside {what} run along {axis}; an arch's passage runs along x")
    return sign


# ------------------------------------------------------------------- leaves --
def leaf_outline(u0, u1, spring, uc, r):
    """top(u): the leaf's height at u, a rectangle to `spring` capped by the
    circle of radius r about (uc, spring); and the circle's points in [u0, u1]
    at LEAF_SEGMENTS per half turn."""
    def top(u):
        d = u - uc
        return spring + math.sqrt(max(0.0, r * r - d * d))
    arc = [uc + r * math.cos(math.pi * k / LEAF_SEGMENTS) for k in range(LEAF_SEGMENTS + 1)]
    return top, [u for u in arc if u0 - EPS <= u <= u1 + EPS]


def build_leaf(s, u0, u1, spring, uc, r, hinge, planks=PLANKS, wood=0, iron=1):
    """A leaf in its own frame, game (u, y, w): planks across [u0, u1], ledges
    on +w, straps on -w from the `hinge` edge (u0 or u1)."""
    top, arc = leaf_outline(u0, u1, spring, uc, r)
    width = u1 - u0
    pw = (width - (planks - 1) * PLANK_GAP) / planks
    for i in range(planks):
        a = u0 + i * (pw + PLANK_GAP)
        b = a + pw
        inside = sorted((u for u in arc if a + 1e-4 < u < b - 1e-4), reverse=True)
        poly = [(a, 0.0), (b, 0.0), (b, top(b))] + [(u, top(u)) for u in inside] + [(a, top(a))]
        s.plate(poly, PLANK_W[0], PLANK_W[1], wood)
    for f in LEDGE_AT:
        c = f * spring
        s.box(u0 + LEDGE_INSET, u1 - LEDGE_INSET, c - LEDGE_TALL / 2, c + LEDGE_TALL / 2,
              LEDGE_W[0], LEDGE_W[1], wood)
        reach = STRAP_REACH * width
        sa, sb = (u0, u0 + reach) if abs(hinge - u0) < EPS else (u1 - reach, u1)
        s.box(sa, sb, c - STRAP_TALL / 2, c + STRAP_TALL / 2, STRAP_W[0], STRAP_W[1], iron)


def _check_thickness(piece):
    t = piece['leaf']['thickness']
    if abs(t - (LEDGE_W[1] - STRAP_W[0])) > EPS:
        raise ValueError(f"gates: {piece['id']}'s leaf is {t:g} m thick; the layers fill {LEDGE_W[1] - STRAP_W[0]:g}")


def hinge_empty(piece, markers):
    name = f"GATE_{piece['id']}_HINGE"
    if bpy.data.objects.get(name) is not None:
        raise ValueError(f"gates: {name} already exists; the hinge is made once (#843)")
    h = bpy.data.objects.new(name, None)
    h.empty_display_type = 'PLAIN_AXES'
    h.empty_display_size = HINGE_SIZE
    h.location = common.to_blender(piece['pivot']['position'])
    h.rotation_euler = (0.0, 0.0, common.rotation_z(piece['pivot']['rotationY']))
    markers.objects.link(h)
    return h


# -------------------------------------------------------------- portcullis --
def build_portcullis(s, xc, cz, foot, inward, wood=0, iron=1):
    """A grid centred on (xc, cz), its points' tips at `foot`. `inward` is the
    barbican side's sign in x, where the horizontals and the straps lie."""
    yf, yt = foot + POINT, foot + POINT + GRID_TALL
    hx = (xc - BAR_D, xc) if inward < 0 else (xc, xc + BAR_D)     # horizontals
    vx = (xc, xc + BAR_D) if inward < 0 else (xc - BAR_D, xc)     # verticals
    half = PORT_WIDTH / 2
    first = -(VERTICALS - 1) * VERT_PITCH / 2
    for k in range(VERTICALS):
        z = cz + first + k * VERT_PITCH
        s.box(vx[0], vx[1], yf, yt, z - VERT_W / 2, z + VERT_W / 2, wood)
        s.cone((vx[0] + vx[1]) / 2, z, POINT_R, yf, foot, 4, iron)
    step = (GRID_TALL - HORIZ_T) / (HORIZONTALS - 1)
    for j in range(HORIZONTALS):
        y = yf + j * step
        s.box(hx[0], hx[1], y, y + HORIZ_T, cz - half, cz + half, wood)
        if j < 2:
            m = y + HORIZ_T / 2
            sx = (hx[0] - PSTRAP[1], hx[0]) if inward < 0 else (hx[1], hx[1] + PSTRAP[1])
            s.box(sx[0], sx[1], m - PSTRAP[0] / 2, m + PSTRAP[0] / 2, cz - half, cz + half, iron)
    return yt


# ---------------------------------------------------------------- the check --
def world_box(ob):
    """The object's local bounds through matrix_world, as a game box: what the
    plan measures (boxOfParts: a part's box corners through its matrix)."""
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    gx = [p.x for p in pts]
    gy = [p.z for p in pts]
    gz = [-p.y for p in pts]
    return {'min': {'x': min(gx), 'y': min(gy), 'z': min(gz)}, 'max': {'x': max(gx), 'y': max(gy), 'z': max(gz)}}


def check_box(ob, piece):
    have, want = world_box(ob), piece['box']
    worst, face = 0.0, None
    for end in ('min', 'max'):
        for k in 'xyz':
            d = abs(have[end][k] - want[end][k])
            if d > worst:
                worst, face = d, f"{end} {k} {have[end][k]:.3f} against {want[end][k]:.3f}"
    if worst > BOX_TOLERANCE:
        raise ValueError(f"gates: {ob.name} (piece {piece['id']}) is off its blueprint box by {worst:.3f} m "
                         f"at its worst face, {face} (game frame, tolerance {BOX_TOLERANCE} m)")
    return worst


# -------------------------------------------------------------------- build --
def build(bp):
    col = common.stage_collection('gates')
    markers = common.stage_collection('markers')
    table = common.STAGE_OF(bp)
    mine = [p for p in bp['pieces'] if table[p['id']] == 'gates']
    by = {p['id']: p for p in bp['pieces']}
    arches = [p for p in mine if p['kind'] == 'gate-arch']
    leaves = [p for p in mine if p['kind'] == 'gate-leaf']
    bars = [p for p in mine if p['kind'] == 'fixture']
    walk_bars = [p for p in mine if p['id'] == 'walk-bar']
    other = [p['id'] for p in mine if p not in arches + leaves + bars + walk_bars]
    if other:
        raise ValueError(f"gates: STAGE_OF gives this stage pieces it does not build: {other}")
    wood = materials.library('wooden_gate')
    iron = materials.library('iron')
    checked = []

    # the plan's three arches, and the west gate's portcullis
    for arch in arches:
        gate = arch['id'][:-len('-arch')]
        if gate not in by or not by[gate].get('leaf'):
            raise ValueError(f"gates: {arch['id']}'s gate {gate} has no leaf in the blueprint")
        sh = arch_shape(bp, arch['id'], by[gate]['leaf'])
        slug, outer = arch_stone(bp, arch)
        b = arch['box']
        x0, x1 = b['min']['x'], b['max']['x']
        slot, xc = slot_band(x0, x1, outer) if arch['id'] in PORTCULLIS else (None, None)
        s = masonry.Solid()
        build_arch(s, sh, x0, x1, outer, slot)
        s.finish(f"ARCH_{gate}", col, [materials.library(slug)], plan_id=arch['id'])
        if slot is not None:
            p = masonry.Solid()
            build_portcullis(p, xc, sh['cz'], sh['crown'] - RAISED_BELOW_CROWN, outer, 0, 1)
            p.finish(f"PORT_{gate}", col, [wood, iron])

    # the plan's four leaves, each on its hinge
    for piece in leaves:
        _check_thickness(piece)
        lf, pv = piece['leaf'], piece['pivot']
        if abs(pv['offset'][0] - lf['width'] / 2) > EPS:
            raise ValueError(f"gates: {piece['id']}'s pivot offset {pv['offset'][0]:g} is not half its width")
        hinge = hinge_empty(piece, markers)
        s = masonry.Solid()
        build_leaf(s, 0.0, lf['width'], lf['springline'], lf['width'] / 2, lf['archRadius'], 0.0)
        ob = s.finish(f"LEAF_{piece['id']}", col, [materials.library(piece['material']), iron], plan_id=piece['id'])
        ob.parent = hinge
        ob.matrix_parent_inverse = Matrix.Identity(4)
        checked.append((ob, piece))

    # the cell's bars: the plan's `bars` in the placement's own frame
    for piece in bars:
        br = piece['bars']
        w, h, t, n = br['width'], br['height'], br['thickness'], br['count']
        s = masonry.Solid()
        span = w - t
        for i in range(n):
            u = -span / 2 + span * i / (n - 1)
            s.box(u - UPRIGHT / 2, u + UPRIGHT / 2, RAIL_TALL, h - RAIL_TALL, -UPRIGHT / 2, UPRIGHT / 2)
        s.box(-w / 2, w / 2, 0.0, RAIL_TALL, -t / 2, t / 2)
        s.box(-w / 2, w / 2, h - RAIL_TALL, h, -t / 2, t / 2)
        ob = s.finish(f"BARS_{piece['id']}", col, [materials.library(piece['material'])], plan_id=piece['id'])
        tr = piece['transform']
        ob.location = common.to_blender(tr['position'])
        ob.rotation_euler = (0.0, 0.0, common.rotation_z(tr['rotationY']))
        checked.append((ob, piece))

    # the walk bar: one squared timber, chamfered, standing in its box
    for piece in walk_bars:
        b = piece['box']
        x0, x1, z0, z1 = b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z']
        c = CHAMFER
        oct_ = [(x0 + c, z0), (x1 - c, z0), (x1, z0 + c), (x1, z1 - c), (x1 - c, z1), (x0 + c, z1), (x0, z1 - c), (x0, z0 + c)]
        s = masonry.Solid()
        s.prism(lambda y: oct_, [b['min']['y'], b['max']['y']])
        ob = s.finish(f"BAR_{piece['id']}", col, [materials.library(piece['material'])], plan_id=piece['id'])
        checked.append((ob, piece))

    # #851: the outer gate, model-only
    block = walls.outer_gate_block(bp)
    like = by[walls.OUTER_GATE['like']]
    like_gate = like['id'][:-len('-arch')]
    run = by[walls.OUTER_GATE['run']]
    sh = arch_shape(bp, like['id'], by[like_gate]['leaf'])
    outer = outer_of(bp, "#851's outer gate", [run])
    x0, x1 = block['min']['x'], block['max']['x']
    slot, xc = slot_band(x0, x1, outer)
    s = masonry.Solid()
    build_arch(s, sh, x0, x1, outer, slot)
    outer_obs = [s.finish('ARCH_barbican-outer', col, [materials.library(run['material'])])]
    p = masonry.Solid()
    build_portcullis(p, xc, sh['cz'], sh['y0'], -outer if outer else 1, 0, 1)
    outer_obs.append(p.finish('PORT_barbican-outer', col, [wood, iron]))
    lf = by[like_gate]['leaf']
    half = lf['width'] / 2
    mid = (x0 + x1) / 2
    for tag, (u0, u1) in (('a', (0.0, half)), ('b', (-half, 0.0))):
        s = masonry.Solid()
        build_leaf(s, u0, u1, lf['springline'], 0.0, lf['archRadius'], u1 if tag == 'a' else u0, OUTER_PLANKS)
        ob = s.finish(f"LEAF_barbican-outer-{tag}", col, [wood, iron])
        # local w -> the barbican side (+x when the outer face is at min x), u -> -z
        ob.location = common.to_blender((mid, sh['y0'], sh['cz']))
        ob.rotation_euler = (0.0, 0.0, common.rotation_z(90.0 if (outer or -1) < 0 else 270.0))
        outer_obs.append(ob)
    for ob in outer_obs:
        ob['modelOnly'] = MODEL_ONLY

    bpy.context.view_layer.update()
    worst = max(check_box(ob, piece) for ob, piece in checked)
    print(f"gates: {len(arches)} arches, {len(leaves)} leaves on hinges in MARKERS, {len(bars)} bars, "
          f"{len(walk_bars)} walk bar, {len(PORTCULLIS)} portcullis raised; each leaf and bar within "
          f"{worst:.4f} m of its blueprint box; #851's outer gate in {run['id']}: {len(outer_obs)} objects, "
          f"modelOnly, no planId")
