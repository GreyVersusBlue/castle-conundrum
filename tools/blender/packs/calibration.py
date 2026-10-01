# calibration.py - the pipeline's one proof: a crate (#808).
#
# A real prop that stays in the larder, and the file a pack's author reads
# first. The shape of every pack script is here: import common (which runs
# the pin), define build(row) returning the asset's objects, end on
# common.main(build). One object, one material, one atlas, flat.
#
# The crate, built Z-up with its front at -Y: four sides of three planks
# each, a lid of four, and two upright battens, one on the front and one on
# the back. 18 boxes, 216 triangles, under check 8's 300.

import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402

# Every colour is a swatch of tools/pixel/textures.json's `wood_planks`, so
# the crate needs no `extraColours`.
PLANKS = ['#6d4a2e', '#795234', '#855a3a']
LID = '#916240'
BATTEN = '#553a22'


def build(row):
    s = row['size']           # the crate's side, metres
    t = row['plank']          # plank thickness
    gap = row['gap']          # between planks
    rows = 3                  # planks per side
    mat = common.palette_material(row['pack'], PLANKS + [LID, BATTEN])

    bm = bmesh.new()
    coloured = []             # (faces, colour)

    # The sides stop a plank short of the top; the lid sits on them.
    wall = s - t
    ph = (wall - (rows - 1) * gap) / rows
    for i in range(rows):
        z = i * (ph + gap) + ph / 2
        for sign in (-1, 1):
            # front and back run the full width
            coloured.append((common.box(bm, (0, sign * (s / 2 - t / 2), z), (s, t, ph)), random.choice(PLANKS)))
            # the two ends sit between them
            coloured.append((common.box(bm, (sign * (s / 2 - t / 2), 0, z), (t, s - 2 * t, ph)), random.choice(PLANKS)))

    # The lid: four planks running front to back, each a few mm shy of the
    # full depth by its own draw, so the lid does not read as one slab.
    n = 4
    pw = (s - (n - 1) * gap) / n
    for i in range(n):
        x = -s / 2 + pw / 2 + i * (pw + gap)
        depth = s - random.uniform(0.0, 0.012)
        coloured.append((common.box(bm, (x, 0, s - t / 2), (pw, depth, t)), LID))

    # Two battens, upright, across the planks of the front and the back.
    bw, bt = row['batten'], t * 0.7
    for sign in (-1, 1):
        coloured.append((common.box(bm, (0, sign * (s / 2 + bt / 2), wall / 2), (bw, bt, wall)), BATTEN))

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


common.main(build)
