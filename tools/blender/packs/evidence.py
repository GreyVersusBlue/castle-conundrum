# evidence.py - the evidence props pack (SPECS.md "Blender: evidence props",
# #810 to #812, #816, #819, #830).
#
# One function per asset, dispatched on the row's `name`. Every asset shares
# one palette, PALETTE below, so the pack's atlas is the same 16 x 16 board in
# every file. Round things are lathed at the row's `sides` (8 to 12) and
# nothing is subdivided. Built Z-up with the front at -Y, as common.frame()
# expects.

import os
import sys
import math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402

# Wood from tools/pixel/textures.json's `wood_planks` and `old_planks_02`,
# iron from `castle_wall_slates`, wick and ink from `wooden_gate`, steel from
# `rock_tile_floor`, flour and parchment from `plastered_wall_04`, leather
# from `dirty_carpet`. TALLOW is the pack's one extraColour (packs.json says
# why).
WOOD_DARK = '#553a22'
WOOD = '#6d4a2e'
WOOD_LIGHT = '#855a3a'
WOOD_EDGE = '#916240'
INTERIOR = '#463d33'
IRON = '#343b40'
WICK = '#1c1410'
TALLOW = '#e6d9a8'
STEEL = '#7e898d'
PARCHMENT = '#cbbfa3'
LEATHER = '#5a352e'
PALETTE = [WOOD_DARK, WOOD, WOOD_LIGHT, WOOD_EDGE, INTERIOR, IRON, WICK, TALLOW, STEEL, PARCHMENT, LEATHER]


def lathe(bm, profile, sides, centre=(0.0, 0.0, 0.0)):
    """A solid of revolution about Z through `centre`: `profile` is a list of
    (radius, z) from the bottom up. A ring of radius 0 is a point; the first
    and last rings with a radius are capped. Returns (bands, caps): `bands[i]`
    is the faces between profile points i and i + 1, so a caller can colour a
    hoop apart from the staves. Ring vertices start at angle 0, so with an
    even `sides` the solid's box is centred on its axis."""
    cx, cy, cz = centre
    rings = []
    for r, z in profile:
        if r <= 0:
            rings.append([bm.verts.new((cx, cy, cz + z))])
            continue
        rings.append([bm.verts.new((cx + r * math.cos(2 * math.pi * k / sides),
                                    cy + r * math.sin(2 * math.pi * k / sides),
                                    cz + z)) for k in range(sides)])
    bands, caps = [], []
    for a, b in zip(rings, rings[1:]):
        band = []
        for k in range(sides):
            if len(a) == 1:
                band.append(bm.faces.new((a[0], b[(k + 1) % sides], b[k])))
            elif len(b) == 1:
                band.append(bm.faces.new((a[k], a[(k + 1) % sides], b[0])))
            else:
                band.append(bm.faces.new((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k])))
        bands.append(band)
    if len(rings[0]) > 1:
        caps.append(bm.faces.new(list(reversed(rings[0]))))
    if len(rings[-1]) > 1:
        caps.append(bm.faces.new(rings[-1]))
    return bands, caps


def candle(bm, coloured, x, y, z, height, radius, sides):
    """A tallow candle standing at (x, y, z), its wick a box on its top."""
    bands, caps = lathe(bm, [(radius, 0.0), (radius, height)], sides, (x, y, z))
    coloured.append((bands[0] + caps, TALLOW))
    coloured.append((common.box(bm, (x, y, z + height + 0.006), (0.004, 0.004, 0.012)), WICK))


def aumbry_candles(row):
    """The aumbry by the vestry door, open-fronted, with the three tallow
    candles left in it at Lauds standing on its floor, tallest to the left.
    `candle-count`: four at Compline, three at Lauds."""
    w, d, h, t = row['width'], row['depth'], row['height'], row['board']
    bm = bmesh.new()
    coloured = []
    # the carcass: back, two sides, floor and roof, open at the front (-Y)
    coloured.append((common.box(bm, (0, d / 2 - t / 2, h / 2), (w, t, h)), WOOD_DARK))
    for sign in (-1, 1):
        coloured.append((common.box(bm, (sign * (w / 2 - t / 2), 0, h / 2), (t, d, h)), WOOD))
    coloured.append((common.box(bm, (0, 0, t / 2), (w - 2 * t, d - t, t)), WOOD_LIGHT))
    coloured.append((common.box(bm, (0, 0, h - t / 2), (w - 2 * t, d - t, t)), WOOD))
    # a lip along the floor's front edge and a hood over the roof's
    coloured.append((common.box(bm, (0, -d / 2 + 0.01, t + 0.01), (w - 2 * t, 0.02, 0.02)), WOOD_EDGE))
    coloured.append((common.box(bm, (0, -0.01, h + 0.015), (w + 0.04, d + 0.02, 0.03)), WOOD_EDGE))
    # the three candles, tallest to the left as the player faces it
    heights = row['candles']
    gapx = (w - 2 * t) / (len(heights) + 1)
    for i, ch in enumerate(heights):
        x = -(w - 2 * t) / 2 + gapx * (i + 1)
        candle(bm, coloured, x, 0.01, t, ch, row['candleRadius'], row['sides'])
    return finish(row, bm, coloured)


BUILDERS = {
    'aumbry-candles': aumbry_candles,
}


def finish(row, bm, coloured):
    mat = common.palette_material(row['pack'], PALETTE)
    for faces, colour in coloured:
        for f in faces:
            common.swatch_uv(bm, f, colour)
    mesh = bpy.data.meshes.new(row['name'])
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(row['name'], mesh)
    bpy.context.scene.collection.objects.link(obj)
    common.flat(obj)
    return [obj]


def build(row):
    if row['name'] not in BUILDERS:
        raise ValueError(f"evidence.py has no builder for {row['name']} (it has {', '.join(BUILDERS)})")
    return BUILDERS[row['name']](row)


common.main(build)
