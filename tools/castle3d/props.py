# props.py - the props stage: every interior prop, built prop and kit decor
# piece the plan places (increment 6, #863 to #868).
#
# Snapped to the blueprint (#500), and reading nothing else: never another
# stage's objects, which is what lets `--only props` build alone. STAGE_OF
# gives this stage 187 pieces, 107 `prop` and 80 `decor`, and each is realised
# by exactly one object, PROP_<piece id>, carrying `planId` and `noCollide`
# from the blueprint (#843), in the PROPS collection, built and checked in
# blueprint order (kit 80, Poly Haven 12, Devon 75, built 20), so a break names
# the first piece in that order. Nothing here is model-only.
#
# THE KIT (80, #866). Generated, no fetch. Each is drawn in its kit file's
# local frame (x across, y up, z toward its front) so its local bounds are
# KIT_LOCAL's row times the piece's `scale`, then placed by the piece's
# transform: its bound_box through matrix_world is then what the plan's
# boxOfParts computed. Numbers written in metres below are metres; the rest
# are local and times `scale`. KIT_LOCAL is checked against every kit piece's
# blueprint box on every build, so it cannot drift from the files.
#
# THE POLY HAVEN 12 (#864). The game's own nine assets at 1k, each model's
# .blend appended whole; *_LOD[1-9] meshes and every non-mesh deleted, the
# meshes under an empty PROP_<piece id> at their authored offsets (not zeroed:
# the cabinet's doors and the three candleholders stand off the origin); a
# second row of an asset is a linked copy. Their own materials, untouched.
#
# DEVON'S 75 (#863). Appended from the pinned castle_props.blend (#867) by
# collection, the file stem; the root empty renamed PROP_<piece id> and placed
# by the transform; a second row of a file is a copy of the tree sharing mesh
# data. Re-materialed per face by the atlas region under its UV centroid, the
# region names read from tools/props/atlas.py (checked against the packed
# atlas within ATLAS_TOL), into one of five PBR kinds (REGION_KIND), MAT_flame
# (EMIT, #874) or kept on Devon's own atlas material (KEEP). A face in none
# raises. devon_trees() is the append and the re-material in one, which
# lighting.py calls too for the game's three braziers (#874).
#
# THE BUILT 20 (#865). Each its blueprint box exactly, materials.library of its
# slug, three of which (`slate`, `parchment`, `wool`) resolve through ALIAS.
#
# THE PLASTER (#868). A piece whose box meets a PLASTERED room's skin is pushed
# into the room until its back stands HANG_GAP proud of the plaster; a push
# over HANG_MAX, or a pushed box still in a skin, raises: that is the plan's.
#
# Every object is held to its (pushed) blueprint box on every face within
# buildings.BOX_TOLERANCE: check_tree for a tree under an empty, check_box for
# one mesh.

import math
import os
import re
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

import common
import masonry
import materials
import terrain
import town
from buildings import (BOX_TOLERANCE, EVERY_FACE, FLAT_Y, PLASTER, PLASTERED, TIMBER, check_box, clear_span)
from gates import world_box
from materials import DRESSED

# tools/props/atlas.py, read only (#863, amending #830 for this family): its
# region names and the pixels they name, painted at import. Appended to the
# path, not inserted, since tools/props/ has a build.py of its own.
_PROPS_TOOLS = os.path.normpath(os.path.join(common.HERE, '..', 'props'))
if _PROPS_TOOLS not in sys.path:
    sys.path.append(_PROPS_TOOLS)
import atlas  # noqa: E402

EPS = 1e-6
PROPS_BLEND = 'castle_props:blend'
ATLAS_TOL = 0.0025          # atlas.py's painted IMG against the packed image; 8-bit rounding is 0.00196
HANG_GAP = 0.002            # a pushed prop's back this far proud of the plaster (#868)
HANG_MAX = 0.01             # a push larger than this is the plan's fault

# ------------------------------------------------------------ the regions --
# Region name -> kind (#863): 28 names, 7,542 faces. EMIT is the four flame
# regions, 172 faces, on MAT_flame (#874). KEEP is the other 71 in use, 4,169
# faces, on Devon's own atlas material: cloth, leather, paper, food, clay,
# glass, and every tile he drew a picture on.
REGION_KIND = {}
for _kind, _names in (
        ('wood', ('wood_light', 'wood', 'wood_dark', 'wood_grey', 'wood_red', 'planks', 'log_end')),
        ('stone', ('stone', 'stone_light', 'stone_dark', 'stone_warm', 'soot', 'blocks', 'bricks_warm', 'fireback')),
        ('iron', ('iron', 'iron_dark', 'iron_rust', 'steel')),
        ('brass', ('brass', 'brass_dark', 'gold', 'pewter')),
        ('straw', ('rope', 'straw', 'straw_dark', 'herb_dried', 'skep'))):
    for _n in _names:
        REGION_KIND[_n] = _kind
KEEP = frozenset((
    'cloth_red', 'cloth_red_dark', 'cloth_blue', 'cloth_blue_dark', 'cloth_green', 'cloth_cream', 'cloth_brown',
    'cloth_ochre', 'burlap', 'burlap_light', 'paper', 'paper_dark', 'ink', 'wax_red', 'candle', 'ash', 'bread', 'bread_dark', 'meat', 'meat_roast', 'apple_red', 'apple_green', 'leaf', 'leaf_dark',
    'lavender', 'soil', 'mud', 'mud_wet', 'leather', 'leather_dark', 'water', 'glass_green', 'residue', 'dregs', 'wine',
    'bone', 'clay', 'clay_dark', 'glaze_green', 'horn', 'feather', 'void', 'stew', 'cork', 'tar', 'cabbage', 'carrot',
    'flour', 'blood_old', 'spines', 'writing', 'rug_a', 'rug_b', 'rug_c', 'cobweb', 'cobweb_b', 'morris', 'mail', 'bill',
    'roster', 'dial', 'frontal', 'linenfold', 'crest_a', 'crest_b', 'crest_c', 'crest_d', 'tapestry_tree',
    'tapestry_lattice', 'tapestry_stag', 'stained_glass'))
# The flame regions (#874): emissive, on MAT_flame, slot FLAME_SLOT. lighting.py
# finds its practicals by the same names.
EMIT = frozenset(('flame', 'flame_core', 'ember', 'coals'))
for _a, _b in ((set(REGION_KIND), KEEP), (set(REGION_KIND), EMIT), (KEEP, EMIT)):
    if _a & _b:
        raise ValueError(f"props: REGION_KIND, KEEP and EMIT share {sorted(_a & _b)}")
# The slots on every Devon mesh: 0 its own material, then the kinds in order,
# then MAT_flame.
KINDS = ('wood', 'stone', 'iron', 'brass', 'straw')
FLAME_SLOT = 1 + len(KINDS)
for _k in KINDS:
    if _k not in materials.PROP_KINDS:
        raise ValueError(f"props: kind {_k!r} is not in materials.PROP_KINDS")
RECTS = [(n, r) for d in (atlas.SW, atlas.T16, atlas.T32) for n, r in d.items()]

# --------------------------------------------------------------- the kit --
# Each kit file's local bounds, (x, y, z) pairs, metres at scale 1, measured
# through test/gltf.mjs's partsOf (the union of its parts), and the builder.
KIT_LOCAL = {
    'structure-pole.glb': ((-0.05, 0.05), (0.0, 1.0), (-0.05, 0.05)),
    'detail-crate.glb': ((-0.15, 0.15), (0.0, 0.3), (-0.15, 0.15)),
    'detail-crate-small.glb': ((-0.1, 0.1), (0.0, 0.2), (-0.1, 0.1)),
    'detail-crate-ropes.glb': ((-0.15, 0.15), (0.0, 0.3), (-0.15, 0.15)),
    'barrels.glb': ((-0.296, 0.296), (0.0, 0.492), (-0.15, 0.15)),
    'detail-barrel.glb': ((-0.123, 0.123), (0.0, 0.3), (-0.123, 0.123)),
    'bricks.glb': ((-0.2098, 0.2978), (0.0, 0.1722), (-0.2227, 0.24)),
    'floor-steps.glb': ((-0.5, 0.5), (0.0, 0.2), (-0.5, 0.5)),
    'ladder.glb': ((-0.15, 0.15), (0.0, 1.0), (-0.025, 0.025)),
    'structure-cross.glb': ((-0.5, 0.5), (0.0, 1.0), (-0.5, 0.5)),
    'fence.glb': ((-0.5, 0.5), (0.0, 0.5), (0.0, 0.0)),
    'pulley.glb': ((-0.05, 0.05), (-0.95, 0.05), (-0.6, 0.0)),
    'pulley-crate.glb': ((-0.1837, 0.1837), (-0.95, 0.05), (-0.7337, 0.0)),
    'tree-shrub.glb': ((-0.4596, 0.4596), (0.0, 0.7), (-0.4596, 0.4596)),
}
BOARDS = town.BOARDS_SET          # the crate's panels, as Mereford's
IRON = 'iron'                     # the barrels' hoops, through materials.ALIAS
DECK = 'wood_floor_deck'          # the dais tiles
BRICK_GAP = 0.01                  # local: each bottom block stops this short of the footprint's midlines
LADDER = (0.06, 0.04, 0.25, 0.3, 0.15)   # metres: stile width, rung square, first rung, pitch, top clear
FRAME = (0.12, 0.08)              # metres: the braced frame's members and braces, square
HURDLE = (0.02, 0.06, (-0.47, 0.0, 0.47), 0.04, (0.12, 0.38))  # local: depth, post width, posts, rail height, rail feet
HOIST = {                         # local, times scale
    'post': ((-0.05, 0.05), (-0.1, 0.0)),
    'arm': ((-0.05, 0.05), (-0.05, 0.05), (-0.6, 0.0)),
    'wheel': (16, 0.06, 0.03, -0.12, -0.52),         # facets, radius, thick across x, centre y, centre z
    'rope': (0.008, -0.52, -0.18, -0.64),            # square, z, from y, to y (pulley)
    'crate': ((-0.1837, 0.1837), (-0.95, -0.5826), (-0.7337, -0.3663)),
    'bell': (16, -0.64, -0.84, ((0.0, 0.024), (0.3, 0.032), (0.7, 0.040), (1.0, 0.05))),
}
ROPE_SWATCH, BELL_SWATCH = 'rope', 'bronze'
SHRUB_ASSET = 'tree_small_02'

# ------------------------------------------------------------- Poly Haven --
PH_MODEL = r'^assets/poly-haven/(.+)_1k\.gltf/'
LOD_DROP = r'_LOD[1-9]$'


# ------------------------------------------------------------------ helpers --
def _overlap(a, b):
    return all(min(a['max'][k], b['max'][k]) - max(a['min'][k], b['min'][k]) > EPS for k in 'xyz')


def _box(x0, x1, y0, y1, z0, z1):
    return {'min': {'x': x0, 'y': y0, 'z': z0}, 'max': {'x': x1, 'y': y1, 'z': z1}}


def _moved(box, push):
    return {e: {k: box[e][k] + push.get(k, 0.0) for k in 'xyz'} for e in ('min', 'max')}


def _scale(p):
    s = p['transform']['scale']
    return (float(s),) * 3 if isinstance(s, (int, float)) else tuple(float(v) for v in s)


def placement(p, push=None):
    """The piece's transform as a Blender matrix, moved by `push` (game axes)."""
    x, y, z = p['transform']['position']
    push = push or {}
    at = Vector(common.to_blender((x + push.get('x', 0.0), y + push.get('y', 0.0), z + push.get('z', 0.0))))
    return Matrix.Translation(at) @ Matrix.Rotation(common.rotation_z(p['transform']['rotationY']), 4, 'Z')


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def region_rgb(name):
    """The region's mean atlas.IMG colour, sRGB to linear per channel (#863)."""
    x, y, w, h = atlas.cell(name)
    mean = atlas.IMG[y:y + h, x:x + w, :3].reshape(-1, 3).mean(axis=0)
    return tuple(srgb_to_linear(float(c)) for c in mean) + (1.0,)


def region_at(u, v):
    px, py = u * atlas.SIZE, (1.0 - v) * atlas.SIZE
    hits = [n for n, (x, y, w, h) in RECTS if x <= px < x + w and y <= py < y + h]
    return hits[0] if len(hits) == 1 else None


def write_uvmap(me):
    """A `UVMap` per face by its dominant normal axis in object-local metres,
    masonry.finish's rule, for the kinds' normal maps."""
    uv = me.uv_layers.new(name='UVMap')
    co = [v.co for v in me.vertices]
    data = []
    for poly in me.polygons:
        nx, ny, nz = (abs(c) for c in poly.normal)
        for li in poly.loop_indices:
            q = co[me.loops[li].vertex_index]
            if nx >= ny and nx >= nz:
                data += (q.y, q.z)
            elif ny >= nz:
                data += (q.x, q.z)
            else:
                data += (q.x, q.y)
    uv.data.foreach_set('uv', data)
    return uv


def write_atlas_rgb(me, colour_of_face):
    attr = me.color_attributes.new('atlas_rgb', 'FLOAT_COLOR', 'CORNER')
    data = []
    for poly in me.polygons:
        c = colour_of_face(poly)
        for _li in poly.loop_indices:
            data += c
    attr.data.foreach_set('color', data)


def tree_box(root):
    """The union of every mesh in the tree's bound_box through matrix_world, as a game box."""
    obs = [root] + list(root.children_recursive)
    boxes = [world_box(o) for o in obs if o.type == 'MESH']
    if not boxes:
        raise ValueError(f"props: {root.name} has no mesh under it")
    return {'min': {k: min(b['min'][k] for b in boxes) for k in 'xyz'},
            'max': {k: max(b['max'][k] for b in boxes) for k in 'xyz'}}


def check_tree(root, piece, push):
    """Raises unless the union of the tree's meshes is within BOX_TOLERANCE of
    the piece's box moved by `push` on every face, in check_box's words."""
    have, want = tree_box(root), _moved(piece['box'], push)
    worst, face = 0.0, None
    for e in ('min', 'max'):
        for k in 'xyz':
            d = abs(have[e][k] - want[e][k])
            if d > worst:
                worst, face = d, f"{e} {k} {have[e][k]:.3f} against {want[e][k]:.3f}"
    if worst > BOX_TOLERANCE:
        raise ValueError(f"props: {root.name} (piece {piece['id']}) is off its blueprint box by {worst:.3f} m "
                         f"at its worst face, {face} (game frame, tolerance {BOX_TOLERANCE} m)")
    return worst


def tag(ob, p):
    ob['planId'] = p['id']
    ob['noCollide'] = bool(p['noCollide'])
    return ob


# ---------------------------------------------------------- the plaster --
def skins(bp):
    """Each PLASTERED room's four skins over its clear span, from its upper
    floor's top to FLAT_Y[0]: (room, axis, plane, inward, box), taken whole
    along each edge, openings included, so the rule is the blueprint's alone."""
    rooms = {r['id']: r for r in bp['rooms']}
    pieces = {p['id']: p for p in bp['pieces']}
    level0 = [p for p in bp['pieces'] if p['kind'] == 'wall' and p['level'] == 0]
    out = []
    for rid in PLASTERED:
        (x0, x1, z0, z1), _by = clear_span(rooms[rid], level0)
        floor = pieces.get(f"floor-{rid}")
        if floor is None:
            raise ValueError(f"props: {rid} is PLASTERED but has no floor-{rid}")
        y0, y1 = floor['box']['max']['y'], FLAT_Y[0]
        out += [(rid, 'x', x0, 1, _box(x0, x0 + PLASTER, y0, y1, z0, z1)),
                (rid, 'x', x1, -1, _box(x1 - PLASTER, x1, y0, y1, z0, z1)),
                (rid, 'z', z0, 1, _box(x0, x1, y0, y1, z0, z0 + PLASTER)),
                (rid, 'z', z1, -1, _box(x0, x1, y0, y1, z1 - PLASTER, z1))]
    return out


def push_of(p, skin_list, log):
    """{axis: metres} moving the piece off every skin its box meets (#868)."""
    b = p['box']
    push = {}
    for rid, k, plane, inward, sb in skin_list:
        if not _overlap(b, sb):
            continue
        gap = b['min'][k] - plane if inward > 0 else plane - b['max'][k]
        amount = PLASTER - gap + HANG_GAP
        if k in push:
            raise ValueError(f"props: {p['id']} meets two {k} skins; a prop cannot be pushed off both")
        if abs(amount) > HANG_MAX:
            raise ValueError(f"props: {p['id']} needs a push of {amount:.5f} m off {rid}'s plaster at {k} {plane:g}, "
                             f"over HANG_MAX {HANG_MAX}; a prop set that deep is the plan's")
        push[k] = inward * amount
        log.append(f"{p['id']} {amount:.5f} toward {'+' if inward > 0 else '-'}{k} ({PLASTER - gap:.5f} into "
                   f"{rid}'s plaster at {k} {plane:g})")
    if push:
        moved = _moved(b, push)
        for rid, k, plane, inward, sb in skin_list:
            if _overlap(moved, sb):
                depth = (plane + inward * PLASTER - moved['min'][k]) if inward > 0 else (moved['max'][k] - (plane - PLASTER))
                before = PLASTER - ((b['min'][k] - plane) if inward > 0 else (plane - b['max'][k]))
                raise ValueError(f"props: {p['id']} is {depth:.3f} m into the {rid}'s plaster at {k} {plane:g} after "
                                 f"its push of {push[k] if k in push else 0.0:+.5f} m ({before:.3f} m before it; "
                                 f"HANG_GAP {HANG_GAP})")
    return push


# ------------------------------------------------------------ line 4 share --
class Ledger:
    """What this stage adds to check.py line 4, by source: TEX_IMAGE nodes in
    materials and node groups new since the stage began, and the images they
    read that are new too (#860's correction: measured, not predicted)."""

    def __init__(self):
        self.mats = set(bpy.data.materials)
        self.groups = set(bpy.data.node_groups)
        self.images = set(bpy.data.images)
        self.source = {}      # material -> label, for the sources that are not by name

    def mark(self, label, before):
        for m in bpy.data.materials:
            if m not in before and m not in self.source:
                self.source[m] = label

    def label(self, m):
        if m.name == 'MAT_flame':
            return 'MAT_flame'
        # by name before by source: devon_trees makes the kinds after the append
        if m.name in {v[5] for v in materials.PROP_KINDS.values()}:
            return 'MAT_*_prop and _brass'
        if m in self.source:
            return self.source[m]
        return 'library() sets'

    def split(self):
        order, nodes, images, seen = [], {}, {}, set()
        owners = [(self.label(m), m.node_tree) for m in bpy.data.materials
                  if m not in self.mats and m.users > 0 and m.node_tree]
        owners += [('node groups', g) for g in bpy.data.node_groups if g not in self.groups and g.users > 0]
        for label, tree in owners:
            if label not in nodes:
                order.append(label)
                nodes[label], images[label] = 0, 0
            for n in tree.nodes:
                if n.type != 'TEX_IMAGE':
                    continue
                nodes[label] += 1
                if n.image is not None and n.image not in self.images and n.image not in seen:
                    seen.add(n.image)
                    images[label] += 1
        return order, nodes, images


# ---------------------------------------------------------------- the kit --
def kit_check(p, name):
    """Raises unless the piece's blueprint box is its transform applied to
    KIT_LOCAL's row within BOX_TOLERANCE, naming the piece and the face."""
    (x0, x1), (y0, y1), (z0, z1) = KIT_LOCAL[name]
    sx, sy, sz = _scale(p)
    r = math.radians(p['transform']['rotationY'])
    c, s = math.cos(r), math.sin(r)
    px, py, pz = p['transform']['position']
    pts = []
    for x in (x0 * sx, x1 * sx):
        for z in (z0 * sz, z1 * sz):
            pts.append((px + x * c + z * s, pz - x * s + z * c))
    have = _box(min(q[0] for q in pts), max(q[0] for q in pts), py + y0 * sy, py + y1 * sy,
                min(q[1] for q in pts), max(q[1] for q in pts))
    worst, face = 0.0, None
    for e in ('min', 'max'):
        for k in 'xyz':
            d = abs(have[e][k] - p['box'][e][k])
            if d > worst:
                worst, face = d, f"{e} {k} {have[e][k]:.3f} against {p['box'][e][k]:.3f}"
    if worst > BOX_TOLERANCE:
        raise ValueError(f"props: KIT_LOCAL['{name}'] does not give {p['id']}'s box: off {worst:.3f} m at {face} "
                         f"(its scale is {p['transform']['scale']}); KIT_LOCAL has drifted from the kit file")


def kit_solid(p, name, library):
    """The kit piece drawn in its file's local frame at its scale: (Solid, mats, atlas colours or None)."""
    (lx0, lx1), (ly0, ly1), (lz0, lz1) = KIT_LOCAL[name]
    sx, sy, sz = _scale(p)
    if not (abs(sx - sy) < EPS and abs(sy - sz) < EPS):
        raise ValueError(f"props: kit piece {p['id']} has a non-uniform scale {p['transform']['scale']}; no generator draws one")
    k = sx
    x0, x1, y0, y1, z0, z1 = lx0 * k, lx1 * k, ly0 * k, ly1 * k, lz0 * k, lz1 * k
    local = _box(x0, x1, y0, y1, z0, z1)
    s = masonry.Solid()
    lib = materials.library
    if name in ('structure-pole.glb',):
        s.box(x0, x1, y0, y1, z0, z1)
        return s, [lib(TIMBER)], None
    if name == 'floor-steps.glb':
        s.box(x0, x1, y0, y1, z0, z1)
        return s, [lib(DECK)], None
    if name in ('detail-crate.glb', 'detail-crate-small.glb', 'detail-crate-ropes.glb'):
        town.build_crate(s, {'box': local, 'transform': {'rotationY': 0}})
        return s, [lib(TIMBER), lib(BOARDS)], None
    if name == 'barrels.glb':
        town.build_barrels(s, {'box': local})
        return s, [lib(TIMBER), lib(IRON)], None
    if name == 'detail-barrel.glb':
        town.barrel(s, (x0 + x1) / 2, (z0 + z1) / 2, y0, y1 - y0, (x1 - x0) / 2)
        return s, [lib(TIMBER), lib(IRON)], None
    if name == 'bricks.glb':
        dx, dz, h = x1 - x0, z1 - z0, y1 - y0
        g = BRICK_GAP * k
        mx, mz = x0 + dx / 2, z0 + dz / 2
        for a, b in ((x0, mx - g), (mx + g, x1)):
            for c, d in ((z0, mz - g), (mz + g, z1)):
                s.box(a, b, y0, y0 + h / 2, c, d)
        s.box(x0 + 0.2 * dx, x0 + 0.8 * dx, y0 + h / 2, y1, z0 + 0.25 * dz, z0 + 0.75 * dz)
        return s, [lib(DRESSED)], None
    if name == 'ladder.glb':
        stile, rung, first, pitch, clear = LADDER
        s.box(x0, x0 + stile, y0, y1, z0, z1)
        s.box(x1 - stile, x1, y0, y1, z0, z1)
        zc = (z0 + z1) / 2
        y = y0 + first
        while y <= y1 - clear + EPS:
            s.box(x0 + stile, x1 - stile, y - rung / 2, y + rung / 2, zc - rung / 2, zc + rung / 2)
            y += pitch
        return s, [lib(TIMBER)], None
    if name == 'structure-cross.glb':
        m, br = FRAME
        for xa, xb in ((x0, x0 + m), (x1 - m, x1)):
            for za, zb in ((z0, z0 + m), (z1 - m, z1)):
                s.box(xa, xb, y0, y1, za, zb)                       # the four posts
        for ya, yb in ((y0, y0 + m), (y1 - m, y1)):
            for za, zb in ((z0, z0 + m), (z1 - m, z1)):
                s.box(x0 + m, x1 - m, ya, yb, za, zb)               # rails along x
            for xa, xb in ((x0, x0 + m), (x1 - m, x1)):
                s.box(xa, xb, ya, yb, z0 + m, z1 - m)               # rails along z

        def band(a, b):
            ux, uy = b[0] - a[0], b[1] - a[1]
            n = math.hypot(ux, uy)
            nx, ny = -uy / n * br / 2, ux / n * br / 2
            return [(a[0] - nx, a[1] - ny), (b[0] - nx, b[1] - ny), (b[0] + nx, b[1] + ny), (a[0] + nx, a[1] + ny)]
        # one brace per vertical face, foot corner to the opposite head corner, at the face
        s.plate(band((x0 + m, y0 + m), (x1 - m, y1 - m)), z1 - br, z1, axis='z')
        s.plate(band((x1 - m, y0 + m), (x0 + m, y1 - m)), z0, z0 + br, axis='z')
        s.plate(band((z0 + m, y0 + m), (z1 - m, y1 - m)), x0, x0 + br, axis='x')
        s.plate(band((z1 - m, y0 + m), (z0 + m, y1 - m)), x1 - br, x1, axis='x')
        return s, [lib(TIMBER)], None
    if name == 'fence.glb':
        depth, post, posts, rail, feet = HURDLE
        d = depth * k / 2
        for cx in posts:
            s.box(cx * k - post * k / 2, cx * k + post * k / 2, y0, y1, -d, d)
        for fy in feet:
            s.box(x0, x1, fy * k, (fy + rail) * k, -d, d)
        return s, [lib(TIMBER)], None
    if name in ('pulley.glb', 'pulley-crate.glb'):
        (pa, pb), (pc, pd) = HOIST['post']
        s.box(pa * k, pb * k, y0, y1, pc * k, pd * k, 0)
        (aa, ab), (ac, ad), (ae, af) = HOIST['arm']
        s.box(aa * k, ab * k, ac * k, ad * k, ae * k, af * k, 0)
        facets, r, thick, wy, wz = HOIST['wheel']
        s.plate([(wz * k + r * k * math.cos(2 * math.pi * i / facets), wy * k + r * k * math.sin(2 * math.pi * i / facets))
                 for i in range(facets)], -thick * k / 2, thick * k / 2, slot=0, axis='x')
        sq, rz, ry0, ry1 = HOIST['rope']
        if name == 'pulley-crate.glb':
            (cx0, cx1), (cy0, cy1), (cz0, cz1) = HOIST['crate']
            ry1 = cy1
        s.box(-sq * k / 2, sq * k / 2, ry1 * k, ry0 * k, rz * k - sq * k / 2, rz * k + sq * k / 2, 1)
        colours = {1: region_rgb(ROPE_SWATCH)}
        if p.get('bell') is True:
            facets, crown, mouth, profile = HOIST['bell']

            def ring(y, facets=facets, crown=crown, mouth=mouth, profile=profile):
                t = (crown * k - y) / ((crown - mouth) * k)
                for (t0, r0), (t1, r1) in zip(profile, profile[1:]):
                    if t0 - EPS <= t <= t1 + EPS:
                        rr = r0 + (r1 - r0) * (t - t0) / (t1 - t0)
                        break
                return [masonry.ring_point(0.0, rz * k, rr * k, 360.0 * i / facets) for i in range(facets)]
            s.prism(ring, sorted((crown * k - t * (crown - mouth) * k) for t, _r in profile), 2)
            colours[2] = region_rgb(BELL_SWATCH)
        mats = [lib(TIMBER), materials.prop_material('straw'), materials.prop_material('brass')]
        if name == 'pulley-crate.glb':
            (cx0, cx1), (cy0, cy1), (cz0, cz1) = HOIST['crate']
            before = set(s.bm.faces)
            town.build_crate(s, {'box': _box(cx0 * k, cx1 * k, cy0 * k, cy1 * k, cz0 * k, cz1 * k),
                                 'transform': {'rotationY': 0}})
            # the crate's battens stay on TIMBER (slot 0); its panels take slot 3, after the hoist's three
            for f in s.bm.faces:
                if f not in before and f.material_index == 1:
                    f.material_index = 3
            mats.append(lib(BOARDS))
        return s, mats, colours
    raise ValueError(f"props: no generator for kit file {name} ({p['id']})")


def shrub(p, col, library):
    """tree_small_02's canopy, leaves only, fitted per axis onto the kit
    shrub's local bounds times scale (#866), one mesh per piece."""
    templates = terrain.append_model(SHRUB_ASSET, library)
    if len(templates) != 1:
        raise ValueError(f"props: {SHRUB_ASSET} gives {len(templates)} templates; a shrub needs one")
    t = templates[0]
    leaves = [i for i, m in enumerate(t.data.materials) if m and m.node_tree and any(
        n.type == 'TEX_IMAGE' and n.image and '_leaves_diff' in n.image.name for n in m.node_tree.nodes)]
    if len(leaves) != 1:
        raise ValueError(f"props: {t.name} has {len(leaves)} leaf materials; a shrub needs one")
    mat = t.data.materials[leaves[0]]
    materials.tint_leaves(mat)
    bm = bmesh.new()
    bm.from_mesh(t.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index != leaves[0]], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    for f in bm.faces:
        f.material_index = 0
    (lx0, lx1), (ly0, ly1), (lz0, lz1) = KIT_LOCAL['tree-shrub.glb']
    k = _scale(p)[0]
    # Blender local (X, Y, Z) is kit local (x, -z, y)
    want = ((lx0 * k, lx1 * k), (-lz1 * k, -lz0 * k), (ly0 * k, ly1 * k))
    have = [(min(v.co[a] for v in bm.verts), max(v.co[a] for v in bm.verts)) for a in range(3)]
    for v in bm.verts:
        v.co = Vector(tuple(want[a][0] + (v.co[a] - have[a][0]) * (want[a][1] - want[a][0]) / (have[a][1] - have[a][0])
                            for a in range(3)))
    me = bpy.data.meshes.new(f"PROP_{p['id']}")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = bpy.data.objects.new(f"PROP_{p['id']}", me)
    col.objects.link(ob)
    return ob


# ------------------------------------------------------------- Devon's 75 --
def _dedupe(before, datablocks):
    """Each datablock new since `before` whose name is an earlier one's plus
    .NNN, which is the same file appended twice (props, then lighting's
    braziers), remapped onto the earlier one and removed, so line 4 counts the
    atlas once."""
    names = {d.name: d for d in before}
    for d in [d for d in datablocks if d not in before]:
        base = re.sub(r'\.\d{3}$', '', d.name)
        if base != d.name and base in names:
            d.user_remap(names[base])
            datablocks.remove(d)


def append_devon(stems, col):
    """The pinned file's collections named by `stems`, every object moved into
    `col` and the collections removed. Returns {stem: root empty}."""
    row = common.source(PROPS_BLEND)
    path = common.source_path(row)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"props: {row['id']} is not a file at {path}")
    mats, imgs = set(bpy.data.materials), set(bpy.data.images)
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        missing = [s for s in stems if s not in src.collections]
        if missing:
            raise ValueError(f"props: {path} has no collection {missing}")
        dst.collections = list(stems)
    roots = {}
    for stem, c in zip(stems, dst.collections):
        obs = list(c.all_objects)
        top = [o for o in obs if o.parent is None]
        if len(top) != 1 or top[0].type != 'EMPTY' or top[0].name != stem:
            raise ValueError(f"props: collection {stem} has roots {[o.name for o in top]}; it needs one empty named {stem}")
        for o in obs:
            col.objects.link(o)
        bpy.data.collections.remove(c)
        roots[stem] = top[0]
    _dedupe(mats, bpy.data.materials)
    _dedupe(imgs, bpy.data.images)
    return roots


def atlas_check(img):
    pix = np.empty(img.size[0] * img.size[1] * 4, np.float32)
    img.pixels.foreach_get(pix)
    pix = pix.reshape(img.size[1], img.size[0], 4)[::-1]
    if pix.shape != atlas.IMG.shape:
        raise ValueError(f"props: the packed {img.name} is {img.size[:]}, atlas.py paints {atlas.IMG.shape[:2]}")
    diff = float(np.abs(pix - atlas.IMG).max())
    if diff > ATLAS_TOL:
        raise ValueError(f"props: tools/props/atlas.py paints an atlas {diff:.5f} from the packed {img.name} at its "
                         f"worst texel, over ATLAS_TOL {ATLAS_TOL}: its region names may no longer name the pixels "
                         f"the faces sample")
    return diff


def rematerial(meshes, file_of, atlas_img):
    """Every Devon mesh re-materialed per face by the region under its UV
    centroid (#863), EMIT's onto MAT_flame (#874). Returns faces per kind (and
    'flame' and 'kept') and regions in use."""
    kind_mats = [materials.prop_material(k) for k in KINDS] + [materials.flame_material(atlas_img)]
    counts = {k: 0 for k in KINDS + ('flame', 'kept')}
    used = set()
    for ob in meshes:
        me = ob.data
        if len(me.materials) != 1 or len(me.uv_layers) != 1:
            raise ValueError(f"props: {ob.name} in {file_of[ob]} has {len(me.materials)} materials and "
                             f"{len(me.uv_layers)} UV layers; a Devon mesh has one of each")
        layer = me.uv_layers[0]
        layer.name = 'atlas'
        uvs = layer.data
        region = []
        for poly in me.polygons:
            u = sum(uvs[i].uv[0] for i in poly.loop_indices) / poly.loop_total
            v = sum(uvs[i].uv[1] for i in poly.loop_indices) / poly.loop_total
            name = region_at(u, v)
            if name is None or (name not in REGION_KIND and name not in KEEP and name not in EMIT):
                raise ValueError(f"props: a face of {ob.name} in {file_of[ob]} samples region {name!r} (uv {u:.4f}, "
                                 f"{v:.4f}), in none of REGION_KIND, EMIT and KEEP")
            region.append(name)
            used.add(name)
        for poly, name in zip(me.polygons, region):
            if name in REGION_KIND:
                poly.material_index = 1 + KINDS.index(REGION_KIND[name])
                counts[REGION_KIND[name]] += 1
            elif name in EMIT:
                poly.material_index = FLAME_SLOT
                counts['flame'] += 1
            else:
                poly.material_index = 0
                counts['kept'] += 1
        for m in kind_mats:
            me.materials.append(m)
        colours = {n: region_rgb(n) for n in set(region)}
        write_atlas_rgb(me, lambda poly: colours[region[poly.index]])
        write_uvmap(me)
        me.uv_layers['atlas'].active_render = True
        me.uv_layers.active = me.uv_layers['atlas']
    return counts, used


def devon_trees(stems, col):
    """The append and the re-material of Devon's `stems` in one (#863, #874),
    which props.build and lighting.py's braziers both call: append_devon, the
    one atlas the appended materials read, atlas_check, rematerial. Returns
    a dict: roots, meshes (one per mesh data, in stem order), file_of, atlas,
    atlas_diff, counts, used."""
    roots = append_devon(stems, col)
    meshes, file_of, seen = [], {}, set()
    for stem in stems:
        for o in [roots[stem]] + list(roots[stem].children_recursive):
            if o.type == 'MESH' and o.data not in seen:
                seen.add(o.data)
                meshes.append(o)
                file_of[o] = f"{stem}.glb"
    imgs = {n.image for o in meshes for m in o.data.materials if m and m.node_tree
            for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image}
    if len(imgs) != 1:
        raise ValueError(f"props: castle_props.blend brings {len(imgs)} images; its materials read one atlas")
    atlas_img = imgs.pop()
    atlas_diff = atlas_check(atlas_img)
    counts, used = rematerial(meshes, file_of, atlas_img)
    return {'roots': roots, 'meshes': meshes, 'file_of': file_of, 'atlas': atlas_img, 'atlas_diff': atlas_diff,
            'counts': counts, 'used': used}


def copy_tree(root, col):
    """A copy of the root and every descendant, sharing mesh data."""
    new = {}
    for o in [root] + list(root.children_recursive):
        c = o.copy()
        col.objects.link(c)
        new[o] = c
    for o, c in new.items():
        if o.parent is not None:
            mpi = o.matrix_parent_inverse.copy()
            c.parent = new[o.parent]
            c.matrix_parent_inverse = mpi
    return new[root]


# ---------------------------------------------------------- Poly Haven 12 --
def append_asset(asset, log, col):
    """Every object of the asset's cached .blend: its images made absolute, the
    *_LOD[1-9] meshes and every non-mesh deleted, the meshes' matrix_world
    kept. Returns [(mesh object, matrix)] in name order. The objects are
    linked into `col` and the view layer updated before any matrix_world is
    read: an appended object in no scene reads identity there, which put
    GothicCabinet_01's doors 0.449 m below the floor."""
    row = common.source(f"{asset}:blend")
    path = common.cached(row)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"props: {row['id']} is not a file at {path}")
    before = set(bpy.data.images)
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = list(src.objects)
    terrain.absolute_images(before, os.path.dirname(path))
    obs = [o for o in dst.objects if o is not None]
    for o in obs:
        col.objects.link(o)
    bpy.context.view_layer.update()
    kept, deleted = [], []
    for o in obs:
        if o.type == 'MESH' and not re.search(LOD_DROP, o.name):
            kept.append((o, o.matrix_world.copy()))
    keep = {o for o, _m in kept}
    for o in obs:
        if o not in keep:
            deleted.append(o.name)
            data = o.data if o.type == 'MESH' else None
            bpy.data.objects.remove(o)
            if data is not None and data.users == 0:
                bpy.data.meshes.remove(data)
    for o, m in kept:
        o.parent = None
        o.matrix_basis = m
    if not kept:
        raise ValueError(f"props: {path} holds no mesh outside {LOD_DROP}")
    log.append(f"{asset} kept {len(kept)} ({', '.join(sorted(o.name for o, _m in kept))}), deleted {len(deleted)}"
               + (f" ({', '.join(sorted(deleted))})" if deleted else ''))
    return sorted(kept, key=lambda t: t[0].name)


def place_asset(p, meshes, col, first):
    """An empty PROP_<piece id> at the piece's transform with the asset's
    meshes under it at their authored offsets; a second row links copies."""
    root = bpy.data.objects.new(f"PROP_{p['id']}", None)
    root.empty_display_size = 0.2
    col.objects.link(root)
    for o, m in meshes:
        c = o if first else o.copy()
        if not first:
            col.objects.link(c)
        c.parent = root
        c.matrix_parent_inverse = Matrix.Identity(4)
        c.matrix_basis = m
    return root


# ------------------------------------------------------------------- build --
def build(bp):
    col = common.stage_collection('props')
    table = common.STAGE_OF(bp)
    mine = [p for p in bp['pieces'] if table[p['id']] == 'props']
    kit, ph, devon, built = [], [], [], []
    for p in mine:
        model = p.get('model') or ''
        if p['kind'] == 'decor':
            if os.path.basename(model) not in KIT_LOCAL:
                raise ValueError(f"props: kit piece {p['id']} is {model}, which KIT_LOCAL has no row for")
            kit.append(p)
        elif re.search(PH_MODEL, model):
            ph.append(p)
        elif model.startswith('assets/props/'):
            devon.append(p)
        elif not model:
            built.append(p)
        else:
            raise ValueError(f"props: {p['id']} is {model}, which no group takes")
    ledger = Ledger()
    skin_list = skins(bp)
    push_log = []
    pushes = {p['id']: push_of(p, skin_list, push_log) for p in mine}
    placed = []      # (object, piece, 'tree' or 'box') in blueprint order

    # the kit
    library = bpy.data.collections.new('PROPS_library')
    library.use_fake_user = True
    for p in kit:
        name = os.path.basename(p['model'])
        kit_check(p, name)
        if name == 'tree-shrub.glb':
            before = set(bpy.data.materials)
            ob = shrub(p, col, library)
            ledger.mark('tree template', before)
        else:
            s, mats, colours = kit_solid(p, name, library)
            ob = s.finish(f"PROP_{p['id']}", col, mats, smooth_angle=35.0)
            if colours:
                write_atlas_rgb(ob.data, lambda poly, colours=colours: colours.get(poly.material_index, (1.0, 1.0, 1.0, 1.0)))
        ob.matrix_world = placement(p, pushes[p['id']])
        placed.append((tag(ob, p), p, 'box'))
    if not library.objects:
        bpy.data.collections.remove(library)

    # the Poly Haven 12
    ph_log = []
    appended = {}
    for p in ph:
        asset = re.search(PH_MODEL, p['model']).group(1)
        first = asset not in appended
        if first:
            before = set(bpy.data.materials)
            appended[asset] = append_asset(asset, ph_log, col)
            ledger.mark(asset, before)
        root = place_asset(p, appended[asset], col, first)
        root.matrix_world = placement(p, pushes[p['id']])
        root.scale = _scale(p)
        placed.append((tag(root, p), p, 'tree'))

    # Devon's 75
    before = set(bpy.data.materials)
    stems = sorted({os.path.basename(p['model'])[:-len('.glb')] for p in devon})
    dv = devon_trees(stems, col)
    roots = dv['roots']
    ledger.mark('atlas', before)
    used_roots = set()
    for p in devon:
        stem = os.path.basename(p['model'])[:-len('.glb')]
        root = roots[stem] if stem not in used_roots else copy_tree(roots[stem], col)
        used_roots.add(stem)
        root.name = f"PROP_{p['id']}"
        root.matrix_world = placement(p, pushes[p['id']])
        root.scale = _scale(p)
        placed.append((tag(root, p), p, 'tree'))
    meshes, atlas_img, atlas_diff, counts, used = dv['meshes'], dv['atlas'], dv['atlas_diff'], dv['counts'], dv['used']
    faces = sum(len(o.data.polygons) for o in meshes)

    # the built 20
    for p in built:
        b = _moved(p['box'], pushes[p['id']])
        s = masonry.Solid()
        s.box(b['min']['x'], b['max']['x'], b['min']['y'], b['max']['y'], b['min']['z'], b['max']['z'])
        ob = s.finish(f"PROP_{p['id']}", col, [materials.library(p['material'])])
        placed.append((tag(ob, p), p, 'built'))

    # every object on its (pushed) box, in blueprint order
    bpy.context.view_layer.update()
    worst_tree, worst_box = (0.0, None), (0.0, None)
    for ob, p, how in placed:
        if how == 'tree':
            w = check_tree(ob, p, pushes[p['id']])
            if w >= worst_tree[0]:
                worst_tree = (w, ob.name)
        else:
            moved = dict(p, box=_moved(p['box'], pushes[p['id']]))
            w = check_box(ob, moved, EVERY_FACE, stage='props')
            if w >= worst_box[0]:
                worst_box = (w, ob.name)
    if len(placed) != len(mine) or len({ob.name for ob, _p, _h in placed}) != len(mine):
        raise ValueError(f"props: {len(placed)} objects for {len(mine)} pieces")

    order, nodes, images = ledger.split()
    print(f"props: {len(mine)} pieces by group: {len(kit)} kit, {len(ph)} Poly Haven, {len(devon)} Devon "
          f"({len(stems)} files), {len(built)} built; {sum(1 for p in mine if p['noCollide'])} noCollide")
    print(f"props: atlas check {atlas_img.name} against tools/props/atlas.py: {atlas_diff:.5f} (ATLAS_TOL {ATLAS_TOL})")
    print(f"props: Devon's {len(meshes)} meshes, {faces} faces, {len(used)} regions in use; faces per kind: "
          + ', '.join(f"{k} {counts[k]}" for k in KINDS + ('flame', 'kept')))
    print(f"props: pushes off the plaster ({len(push_log)}, HANG_GAP {HANG_GAP}): {'; '.join(push_log) or 'none'}")
    print(f"props: Poly Haven: {'; '.join(ph_log) or 'none'}")
    print(f"props: worst check_tree {worst_tree[0]:.5f} m ({worst_tree[1]}), worst check_box {worst_box[0]:.5f} m "
          f"({worst_box[1]}), tolerance {BOX_TOLERANCE} m")
    print(f"props: line 4 share: {sum(nodes.values())} image texture nodes, {sum(images.values())} images new in "
          f"this stage (" + ', '.join(f"{k} {nodes[k]}/{images[k]}" for k in order) + ')')
