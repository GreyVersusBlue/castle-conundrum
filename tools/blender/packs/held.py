# held.py - rigid tools a person holds (SPECS.md "Blender: a shared rig with
# swappable parts", #820): one row per tool, on the existing `heldProp`.
#
# A held tool is not skinned, because a skinned tool would be one more
# skinned draw per holder; `_attachHeldProp` parents a static mesh to the
# hand. Each is authored standing on its grip end, so in the file +Y runs
# from the grip to the working end, and it is one mesh with one material.
# Built Z-up, as common.frame() expects.

import os
import sys
import math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402

# Ash and beech from tools/pixel/textures.json's `wood_floor_deck` and
# `wood_planks`, the end grain `wood_planks`' darkest, iron from
# `castle_wall_slates`. No extraColours.
ASH = '#967651'
BEECH = '#855a3a'
END_GRAIN = '#553a22'
IRON = '#343b40'
PALETTE = [ASH, BEECH, END_GRAIN, IRON]


def mallet(row):
    """A carter's mallet: a round haft, a block head across its top with the
    end grain on its two striking faces, and an iron band inside each."""
    length, r, sides, band = row['length'], row['haft'], row['sides'], row['band']
    hw, hd, hh = row['head']
    bm = bmesh.new()
    coloured = []
    # the haft, from the floor to the middle of the head
    top = length - hh / 2
    rings = [[bm.verts.new((r * math.cos(2 * math.pi * k / sides), r * math.sin(2 * math.pi * k / sides), z))
              for k in range(sides)] for z in (0.0, top)]
    haft = [bm.faces.new((rings[0][k], rings[0][(k + 1) % sides], rings[1][(k + 1) % sides], rings[1][k]))
            for k in range(sides)]
    haft.append(bm.faces.new(list(reversed(rings[0]))))
    coloured.append((haft, ASH))
    # the head: the block, an end-grain slice on each striking face, a band
    # inside each slice
    z = length - hh / 2
    grain = 0.006
    coloured.append((common.box(bm, (0, 0, z), (hw - 2 * grain, hd, hh)), BEECH))
    for sg in (-1, 1):
        coloured.append((common.box(bm, (sg * (hw / 2 - grain / 2), 0, z), (grain, hd, hh)), END_GRAIN))
        coloured.append((common.box(bm, (sg * (hw / 2 - grain - band), 0, z), (band, hd + 0.006, hh + 0.006)), IRON))
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


BUILDERS = {'mallet': mallet}


def build(row):
    if row['name'] not in BUILDERS:
        raise ValueError(f"held.py has no builder for {row['name']} (it has {', '.join(BUILDERS)})")
    return BUILDERS[row['name']](row)


common.main(build)
