# interiors.py - the interiors kit (SPECS.md "Blender: an interiors kit",
# #813 to #816, #819, #830).
#
# Modular pieces as functions, composed into sets by the row (#815): a row's
# `pieces` is a list of [piece, x, y, z, rotationY] in the set's own metres,
# +Y up and the front at +Z as the exported file is, and `sizes` carries each
# piece's dimensions. build_set() builds every piece into ONE bmesh, so a set
# is one mesh, one primitive, one material and one draw call. Nothing here
# covers a wall or a floor (#813). Built Z-up with the front at -Y, as
# common.frame() expects, so a piece at [x, y, z] stands at Blender (x, -z, y).

import os
import sys
import math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

# Wood from tools/pixel/textures.json's `wood_planks` and `old_planks_02`,
# iron from `castle_wall_slates`, earthenware from `castle_brick_02_red`,
# dough from `plastered_wall_04`. LINEN is the pack's one extraColour
# (packs.json says why).
WOOD_DARK = '#553a22'
WOOD = '#6d4a2e'
WOOD_LIGHT = '#855a3a'
WOOD_EDGE = '#916240'
INTERIOR = '#463d33'
IRON = '#343b40'
EARTHEN = '#9a4430'
EARTHEN_DARK = '#7a3626'
DOUGH = '#cbbfa3'
LINEN = '#ebe5d6'
PALETTE = [WOOD_DARK, WOOD, WOOD_LIGHT, WOOD_EDGE, INTERIOR, IRON, EARTHEN, EARTHEN_DARK, DOUGH, LINEN]


def paint(bm, faces, colour):
    for f in faces:
        common.swatch_uv(bm, f, colour)


def cbox(bm, centre, size, colour):
    """common.box, painted."""
    paint(bm, common.box(bm, centre, size), colour)


def lathe(bm, profile, sides, colours, cap_colours):
    """A solid of revolution about Z: `profile` is (radius, z) from the bottom
    up, `colours[i]` paints the band between points i and i + 1, and
    `cap_colours` the bottom and top caps. Ring vertices start at angle 0, so
    with an even `sides` the solid's box is centred on its axis."""
    rings = [[bm.verts.new((r * math.cos(2 * math.pi * k / sides), r * math.sin(2 * math.pi * k / sides), z))
              for k in range(sides)] for r, z in profile]
    for (a, b), colour in zip(zip(rings, rings[1:]), colours):
        paint(bm, [bm.faces.new((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k])) for k in range(sides)], colour)
    paint(bm, [bm.faces.new(list(reversed(rings[0])))], cap_colours[0])
    paint(bm, [bm.faces.new(rings[-1])], cap_colours[1])


# ---------------------------------------------------------------- the pieces --
# Each builds at its own origin, base at z 0, long axis along X, front at -Y.

def trestle_board(bm, s):
    """A board on two trestles: the table of every working room. Each trestle
    is a head rail under the board, two legs and a stretcher."""
    length, depth, height, top, leg = s['length'], s['depth'], s['height'], s['top'], s['leg']
    cbox(bm, (0, 0, height - top / 2), (length, depth, top), WOOD_LIGHT)
    under = height - top
    for sx in (-1, 1):
        x = sx * (length / 2 - s['inset'])
        cbox(bm, (x, 0, under - leg / 2), (leg, depth * 0.8, leg), WOOD_DARK)
        for sy in (-1, 1):
            cbox(bm, (x, sy * depth * 0.3, (under - leg) / 2), (leg, leg, under - leg), WOOD)
        cbox(bm, (x, 0, s['stretcher']), (leg * 0.7, depth * 0.6 - leg, leg * 0.7), WOOD_DARK)
    # the long stretcher that keeps the two trestles from folding
    cbox(bm, (0, 0, s['stretcher']), (length - 2 * s['inset'] - leg * 0.7, leg * 0.7, leg * 0.7), WOOD_DARK)


def bench(bm, s):
    """A plank seat on four legs with a rail between each pair. `bevel` rounds
    the legs' edges at that many segments; it is 0 in every row, because a
    bench leg's silhouette needs none ("The look"), and it is the knob check
    8's cap is broken with (#34)."""
    length, depth, height, seat, leg = s['length'], s['depth'], s['height'], s['seat'], s['leg']
    cbox(bm, (0, 0, height - seat / 2), (length, depth, seat), WOOD_EDGE)
    under = height - seat
    for sx in (-1, 1):
        x = sx * (length / 2 - s['inset'])
        for sy in (-1, 1):
            first = len(bm.faces)
            common.box(bm, (x, sy * (depth / 2 - leg / 2), under / 2), (leg, leg, under))
            if s.get('bevel', 0) > 0:
                bm.faces.ensure_lookup_table()
                faces = list(bm.faces)[first:]
                geom = list(dict.fromkeys([v for f in faces for v in f.verts] + [e for f in faces for e in f.edges])) + faces
                bmesh.ops.bevel(bm, geom=geom, offset=leg * 0.2, segments=s['bevel'], profile=0.5, affect='EDGES')
            bm.faces.ensure_lookup_table()
            paint(bm, list(bm.faces)[first:], WOOD)
        cbox(bm, (x, 0, under * 0.4), (leg * 0.7, depth - leg, leg * 0.7), WOOD_DARK)


def trough(bm, s):
    """A dough trough: a floor, four boards and the dough in it."""
    length, depth, height, wall = s['length'], s['depth'], s['height'], s['wall']
    cbox(bm, (0, 0, wall / 2), (length, depth, wall), WOOD_DARK)
    for sy in (-1, 1):
        cbox(bm, (0, sy * (depth / 2 - wall / 2), (height + wall) / 2), (length, wall, height - wall), WOOD)
    for sx in (-1, 1):
        cbox(bm, (sx * (length / 2 - wall / 2), 0, (height + wall) / 2), (wall, depth - 2 * wall, height - wall), WOOD)
    cbox(bm, (0, 0, wall + s['dough'] / 2), (length - 2 * wall, depth - 2 * wall, s['dough']), DOUGH)


def vessel(bm, s):
    """An earthenware pot or crock: a foot, a belly, a neck and a rim, lathed,
    with the dark of its inside a little under the rim."""
    r, h, sides = s['radius'], s['height'], s['sides']
    profile = [(r * 0.6, 0.0), (r, h * 0.45), (r * 0.72, h * 0.85), (r * 0.84, h), (r * 0.66, h), (r * 0.66, h * 0.9)]
    lathe(bm, profile, sides, [EARTHEN_DARK, EARTHEN, EARTHEN, EARTHEN_DARK, INTERIOR], (EARTHEN_DARK, INTERIOR))


def rack(bm, s):
    """A standing rack: two side boards, the shelves between them and a rail
    along the top of the back. No back board: the wall behind it is the
    room's (#813)."""
    width, depth, height, board = s['width'], s['depth'], s['height'], s['board']
    for sx in (-1, 1):
        cbox(bm, (sx * (width / 2 - board / 2), 0, height / 2), (board, depth, height), WOOD)
    for z in s['shelves']:
        cbox(bm, (0, 0, z - board / 2), (width - 2 * board, depth, board), WOOD_LIGHT)
    cbox(bm, (0, depth / 2 - board / 2, height - 0.05), (width - 2 * board, board, 0.1), WOOD_DARK)


def cloth(bm, s):
    """A linen cloth along a board: a runner on top and a fall at each end.
    It lies on a table, so it covers no face of the room (#813)."""
    length, depth, drop, t = s['length'], s['depth'], s['drop'], s['thickness']
    cbox(bm, (0, 0, t / 2), (length, depth, t), LINEN)
    for sx in (-1, 1):
        cbox(bm, (sx * (length / 2 + t / 2), 0, t - drop / 2), (t, depth, drop), LINEN)


PIECES = {
    'trestle-board': trestle_board,
    'bench': bench,
    'trough': trough,
    'pot': vessel,
    'crock': vessel,
    'rack': rack,
    'cloth': cloth,
}


# ------------------------------------------------------------------- the set --
def build_set(row):
    """Place row.pieces into one bmesh and hand back one object (#815)."""
    mat = common.palette_material(row['pack'], PALETTE)
    bm = bmesh.new()
    for entry in row['pieces']:
        piece, x, y, z, rotation_y = entry
        if piece not in PIECES:
            raise ValueError(f"interiors.py has no piece {piece} (it has {', '.join(PIECES)})")
        if piece not in row['sizes']:
            raise ValueError(f"{row['name']} places a {piece} and gives it no sizes")
        first = len(bm.verts)
        PIECES[piece](bm, row['sizes'][piece])
        bm.verts.ensure_lookup_table()
        verts = list(bm.verts)[first:]
        # the set's +Y up, front +Z is Blender's +Z up, front -Y; a turn about
        # the one is the same turn about the other
        m = Matrix.Translation(Vector((x, -z, y))) @ Matrix.Rotation(math.radians(rotation_y), 4, 'Z')
        bmesh.ops.transform(bm, matrix=m, verts=verts)
    mesh = bpy.data.meshes.new(row['name'])
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(row['name'], mesh)
    bpy.context.scene.collection.objects.link(obj)
    common.flat(obj)
    return [obj]


common.main(build_set)
