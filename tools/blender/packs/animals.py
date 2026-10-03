# animals.py - the farm's and the house's animals (SPECS.md "Blender: the
# animals", #826 to #829).
#
# One row per kind and one file per row: pig, goat, sheep, horse, cat, goose. Each is
# an armature on one of TOPOLOGIES' joint lists, one mesh of two primitives
# (`Coat`, which the tint multiplies, and `Bare`, which it does not, over the
# one palette image) and three clips. The rig, the parts and the clips are the
# row's params, so all three are inside the source hash (#806).
#
# A row's `rig`, `parts` and `clips` speak the model frame the page sees (+x
# the animal's left, +y up, +z the way it faces), which is the frame
# tools/bodies/bodies.json describes the cow in; common.py's `to_blender` is
# the one place that frame meets Blender's. Nothing is read from tools/bodies/
# and the cow is not re-made (#807): what the quadrupeds share with it is its
# fifteen joint names, and what every kind shares with it is its clip grammar.
#
# The rig, the clips, the frame on Root, the two materials and the mesh
# builder are common.py's "a skinned pack", as folk.py's are.
#
# A part is one of two shapes, flat-shaded, rigid on one joint:
#   box    { center, size, joint, material, colour }, and `pitch`, degrees
#          about the box's own centre round +x: positive tips its top forward
#   prism  the same with `sides`, and `ends`, the scale of its back and front
#          faces: a barrel along z, which is a body
#
# A topology is a joint list and the clips a kind on it carries: the
# quadruped's 16 and the bird's 12, which is the goose's (increment 2). A third
# is a line in each of the two tables below and a row in packs.json.

import os
import sys
import json
import math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402

MATERIALS = ('Coat', 'Bare')

TOPOLOGIES = {
    # The cow's fifteen (#794), which are the hound's where it has one, and Root.
    'quadruped': ('Root', 'Body', 'Neck1', 'Head', 'Ear.L', 'Ear.R',
                  'FrontUpperLeg.L', 'FrontLowerLeg.L', 'FrontUpperLeg.R', 'FrontLowerLeg.R',
                  'BackUpperLeg.L', 'BackLowerLeg.L', 'BackUpperLeg.R', 'BackLowerLeg.R',
                  'Tail1', 'Tail2'),
    # The goose's own (#826): a quadruped's front legs are wings on nothing, and
    # the hen's seven joints are a sourced file's (#803). Two neck joints, since
    # a goose's neck is most of what it is; one wing joint a side; no ears.
    'bird': ('Root', 'Body', 'Neck1', 'Neck2', 'Head', 'Wing.L', 'Wing.R',
             'UpperLeg.L', 'UpperLeg.R', 'LowerLeg.L', 'LowerLeg.R', 'Tail1'),
}
# So `wait`, `eat` and `peck` resolve through ACTIVITY_CLIPS as it stands
# (#827): `Idle_Peck` is the name the hen's file gave `peck` (#684).
CLIPS = {
    'quadruped': ('Idle', 'Walk', 'Eating'),
    'bird': ('Idle', 'Walk', 'Idle_Peck'),
}

# The atlas, one for the pack. The first three are `plastered_wall_04`'s light
# end and are what a coat is made of, so the tint carries the colour (#644,
# #684). Then what the tint must leave alone: eye and hoof `wooden_gate`, mane
# `wood_planks`, the sheep's face `wood_floor_deck`, horn `stone_pavers`, the
# cat's nose `dirty_carpet` and its eye `forest_ground_06`. The last is the
# pack's one extraColour (packs.json says why), the pig's snout and the
# geese's bills and feet. The goose adds no colour, because a twelfth swatch
# would move the atlas, and with it the bytes of the five files before it.
PALETTE = ['#cbbfa3', '#b1a58d', '#978b77', '#1c1410', '#3a2a1c', '#2a1d12', '#33261a', '#aaa292',
           '#7a473c', '#57643e', '#d49a8c']


def corners(spec):
    """A box's eight corners in Blender's frame, indexed the way
    common.Part.hull winds them: low or high in Blender's x, y and z, which is
    the model's x, its -z and its y."""
    cx, cy, cz = spec['center']
    hx, hy, hz = (s / 2 for s in spec['size'])
    a = math.radians(spec.get('pitch', 0))
    out = []
    for i in (0, 1):
        plane = []
        for j in (0, 1):
            line = []
            for k in (0, 1):
                y, z = (2 * k - 1) * hy, (1 - 2 * j) * hz
                # +x, right-handed: +y turns towards +z, so the top goes forward
                y, z = y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a)
                line.append(tuple(common.to_blender((cx + (2 * i - 1) * hx, cy + y, cz + z))))
            plane.append(line)
        out.append(plane)
    return out


def box(p, spec, w):
    p.hull(corners(spec), spec['colour'], w)


def prism(p, spec, w):
    cx, cy, cz = spec['center']
    sx, sy, sz = spec['size']
    n = spec['sides']
    back, front = spec.get('ends', (1, 1))
    rings = []
    for z, s in ((cz - sz / 2, back), (cz + sz / 2, front)):
        ring = []
        for k in range(n):
            a = 2 * math.pi * (k + 0.5) / n
            ring.append(p.v(*common.to_blender((cx + s * sx / 2 * math.cos(a), cy + s * sy / 2 * math.sin(a), z)), w))
        rings.append(ring)
    a, b = rings
    for k in range(n):
        j = (k + 1) % n
        p.f((a[k], a[j], b[j], b[k]), spec['colour'])
    p.f(list(reversed(a)), spec['colour'])
    p.f(b, spec['colour'])


SHAPES = {'box': box, 'prism': prism}


def check_row(row):
    """A row on a topology has exactly its joints and exactly its clips. The
    rail that holds the file to this is test/assets.mjs check 8, with its own
    copy of both lists (#34); this is the error at the render, not the check."""
    kind = row.get('topology')
    if kind not in TOPOLOGIES:
        raise ValueError(f'{row["name"]}\'s topology is {kind}, and animals.py has {", ".join(TOPOLOGIES)}')
    rig = [j['name'] for j in row['rig']]
    if sorted(rig) != sorted(TOPOLOGIES[kind]):
        raise ValueError(f'{row["name"]}\'s rig is not the {kind}\'s {len(TOPOLOGIES[kind])} joints: {", ".join(rig)}')
    clips = [c['name'] for c in row['clips']]
    if sorted(clips) != sorted(CLIPS[kind]):
        raise ValueError(f'{row["name"]}\'s clips are {", ".join(clips)}, not the {kind}\'s {", ".join(CLIPS[kind])}')


def build_mesh(row, mats, dx=0.0):
    """The row's parts as one mesh object of two material slots, in the rest
    pose, each part rigid on its joint."""
    order = [j['name'] for j in row['rig']]
    part = common.Part({name: i for i, name in enumerate(order)}, dx)
    for spec in row['parts']:
        if spec['material'] not in MATERIALS:
            raise ValueError(f'{row["name"]}: a part\'s material is {spec["material"]}, not Coat or Bare (#827)')
        if spec['shape'] not in SHAPES:
            raise ValueError(f'{row["name"]}: a part\'s shape is {spec["shape"]}, and animals.py has {", ".join(SHAPES)}')
        before = len(part.bm.faces)
        part.material = MATERIALS.index(spec['material'])
        SHAPES[spec['shape']](part, spec, {spec['joint']: 1.0})
        # Every part is convex, so a face that looks at its own part's middle
        # is wound backwards and would be culled from outside.
        part.bm.faces.ensure_lookup_table()
        faces = part.bm.faces[before:]
        part.bm.normal_update()
        seen = list(dict.fromkeys(v for f in faces for v in f.verts))
        mid = sum((v.co for v in seen), seen[0].co * 0) / len(seen)
        for f in faces:
            if f.normal.dot(f.calc_center_median() - mid) <= 0:
                raise ValueError(f'{row["name"]}: a {spec["shape"]} on {spec["joint"]} has a face wound inwards')
    mesh = bpy.data.meshes.new(row['name'])
    part.bm.to_mesh(mesh)
    part.bm.free()
    for name in MATERIALS:
        mesh.materials.append(mats[name])
    obj = bpy.data.objects.new(row['name'], mesh)
    bpy.context.scene.collection.objects.link(obj)
    for joint in order:
        obj.vertex_groups.new(name=joint)
    common.flat(obj)
    return obj


def materials(row):
    return common.pair_materials(row['pack'], PALETTE, 'Coat')


def build(row):
    check_row(row)
    mats = materials(row)
    arm = common.build_rig(row['rig'])
    obj = build_mesh(row, mats)
    obj.parent = arm
    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    common.check_frame(arm, [obj])
    common.key_clips(row, arm)
    return arm, obj


def main():
    argv = common.args_after_dashes()
    sheet = common.arg(argv, '--sheet')
    if sheet is not None:
        rows = json.loads(sheet)
        common.empty_scene()
        mats = materials(rows[0])
        laid, x = [], 0.0
        for row in rows:
            common.seed(row)
            check_row(row)
            width = max(abs(s['center'][0]) + s['size'][0] / 2 for s in row['parts']) * 2
            laid.append(build_mesh(row, mats, dx=x + width / 2))
            x += width + 1.0
        common.contact_sheet(rows[0]['pack'], laid)
        return
    row = json.loads(common.arg(argv, '--row'))
    out = common.arg(argv, '--out')
    if not out:
        raise SystemExit('blender: --out is required')
    common.empty_scene()
    common.seed(row)
    build(row)
    common.export_skinned(out)
    print(f'blender: exported {out}')


main()
