# folk.py - the household's shared body (SPECS.md "Blender: a shared rig with
# swappable parts", #820 to #823).
#
# One row, `folk`, and one file, folk.glb: a 20-joint armature, 22 parts each
# its own one-material mesh object named `<slot>-<variant>`, and eleven clips.
# The rig, the parts catalogue and the clips table are the row's params, so
# all three are inside the source hash (#806).
#
# Built Z-up with the front at -Y, so the body's left is +X. The row's `rig`
# and `clips` speak the model frame the page sees (+x left, +y up, +z the way
# it faces); common.py's `to_blender` is the one place the two meet.
#
# What this script does that common.main() does not, and why it has its own
# entry (#820): the frame is the Root joint at the origin and the soles on
# z 0 by construction, never the box centre; there are two materials, `Cloth`
# and `Bare`, over the one palette image; the export carries a skin and
# animations; and the contact sheet is six assembled people, not 22 parts.
# common.py is untouched, so no other pack's source hash moves.
#
# Shapes, by the catalogue's `shape`:
#   skin     a head, a neck, two ears, eyes, a nose, two hands
#   garment  a torso and skirt to `hem`, two sleeves, legs if the hem shows
#            them, two shoes
#   shell    a cap over the head, open where the face is: hair, and the hats
#            that wrap (coif, wimple, hood), with a tail, a drape, a bun, a
#            beard or a point
#   crown    a hat that sits on top: rings, and a brim if it has one
#   over     rings round the body and which eighths of each band are cloth
#
# Every ring is 8 or 6 flat sides and nothing is subdivided or bevelled.

import os
import sys
import json
import math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402

SLOTS = ('skin', 'garment', 'hair', 'over', 'hat')
MATERIALS = ('Cloth', 'Bare')

# The atlas. Skin, old skin and linen are the pack's three extraColours
# (packs.json says why); eye and brown hair are `wooden_gate`, dark hair
# `wood_planks`, grey `stone_pavers`, fair `wood_floor_deck`, steel
# `rock_tile_floor`, and the two cloth shades `plastered_wall_04`. The cloth
# swatches are the light end, so the tint carries the colour (#644, #684).
PALETTE = ['#d9aa84', '#d0b096', '#ebe5d6', '#1c1410', '#503a28', '#2a1d12', '#aaa292', '#a17f58',
           '#7e898d', '#565d61', '#3a2a1c', '#cbbfa3', '#a49882']

# The head every skin shares and every shell wraps: (z, rx, ry), bottom up.
# The jaw ring's rx is the skin's own `jaw`.
HEAD = [(1.52, 0.085, 0.085), (1.57, 0.098, 0.105), (1.63, 0.105, 0.11),
        (1.69, 0.105, 0.112), (1.735, 0.085, 0.095), (1.76, 0.045, 0.05)]
# Which eighths of a ring are which side of the head, with the ring's first
# vertex at 22.5 degrees from +X: eighth k faces (k + 1) * 45 degrees.
BACK, SIDES, TEMPLES, FRONT = (0, 1, 2), (3, 7), (4, 6), (5,)


def body_w(z, x):
    """Which joints a vertex at height z, on the side x is on, follows."""
    s = 'L' if x >= 0 else 'R'
    if z >= 1.52:
        return {'Head': 1.0}
    if z >= 1.44:
        return {'Neck': 1.0}
    if z >= 1.20:
        return {'Chest': 1.0}
    if z >= 1.04:
        return {'Torso': 1.0}
    if z >= 0.90:
        return {'Hips': 1.0}
    if z >= 0.70:
        t = (z - 0.70) / 0.20
        return {'Hips': t, f'UpperLeg.{s}': 1.0 - t}
    if z >= 0.50:
        return {f'UpperLeg.{s}': 1.0}
    t = min(1.0, (0.50 - z) / 0.25) * 0.8
    return {f'UpperLeg.{s}': 1.0 - t, f'LowerLeg.{s}': t}


# ------------------------------------------------------------------ the shapes --
def skin(p, spec):
    tone = spec['tone']
    head = {'Head': 1.0}
    p.tube([((0, 0, 1.40), 0.05, 0.05, {'Neck': 1.0}), ((0, 0, 1.535), 0.052, 0.052, head)], 6, tone)
    rings = [((0, 0, z), spec['jaw'] if i == 0 else rx, ry, head) for i, (z, rx, ry) in enumerate(HEAD)]
    p.tube(rings, 8, tone, bottom=True, top=True)
    nose = spec['nose']
    p.box((0, -(0.0955 + nose / 2), 1.60), (0.02, nose, 0.035), tone, head)
    for sg in (-1, 1):
        p.box((sg * 0.03, -0.1, 1.635), (0.02, 0.012, 0.02), spec['eye'], head)
        if spec.get('brow'):
            p.box((sg * 0.03, -0.101, 1.66), (0.03, 0.012, 0.008), spec['brow'], head)
        p.box((sg * 0.106, 0.0, 1.63), (0.016, 0.03, 0.04), tone, head)
        side = 'L' if sg > 0 else 'R'
        p.box((sg * 0.23, 0, 0.835), (0.04, 0.07, 0.075), tone, {f'Wrist.{side}': 1.0})
        p.box((sg * 0.23, 0, 0.76), (0.035, 0.065, 0.08), tone, {f'Fingers.{side}': 1.0})


def garment(p, spec):
    hem, (fx, fy) = spec['hem'], spec['flare']
    body = spec['body']
    rings = [((0, 0, 1.45), 0.09, 0.07, None), ((0, 0, 1.40), 0.20, 0.10, None),
             ((0, 0, 1.28), 0.19, 0.115, None), ((0, 0, 1.10), 0.165, 0.105, None),
             ((0, 0, 1.05), 0.165, 0.105, None), ((0, 0, 0.94), 0.18, 0.115, None)]
    colours = [body, body, body, spec['belt'], body]
    bands = max(1, math.ceil((0.94 - hem) / 0.3 - 1e-9))
    for j in range(1, bands + 1):
        t = j / bands
        rings.append(((0, 0, 0.94 + (hem - 0.94) * t), 0.18 + (fx - 0.18) * t, 0.115 + (fy - 0.115) * t, None))
        colours.append(body)
    rings.reverse()
    colours.reverse()
    p.tube(rings, 8, colours, bottom=True, top=True)
    for sg in (-1, 1):
        s = 'L' if sg > 0 else 'R'
        upper, lower = f'UpperArm.{s}', f'LowerArm.{s}'
        p.tube([((sg * 0.23, 0, 0.885), spec['cuff'], spec['cuff'], {lower: 1.0}),
                ((sg * 0.22, 0, 1.13), 0.052, 0.052, {upper: 0.5, lower: 0.5}),
                ((sg * 0.215, 0, 1.33), 0.062, 0.062, {upper: 1.0}),
                ((sg * 0.21, 0, 1.43), 0.05, 0.05, {'Chest': 0.5, upper: 0.5})], 6, body, bottom=True, top=True)
        if hem > 0.3:
            thigh, shin = f'UpperLeg.{s}', f'LowerLeg.{s}'
            p.tube([((sg * 0.09, 0, 0.09), 0.045, 0.045, {shin: 1.0}),
                    ((sg * 0.09, 0, 0.50), 0.06, 0.06, {thigh: 0.5, shin: 0.5}),
                    ((sg * 0.09, 0, 0.93), 0.085, 0.085, {'Hips': 0.5, thigh: 0.5})], 6, spec['legs'], bottom=True, top=True)
        p.box((sg * 0.09, -0.04, 0.045), (0.095, 0.22, 0.09), spec['shoes'], {f'Foot.{s}': 1.0})


def shell(p, spec):
    s, colour = spec['scale'], spec['colour']
    head = {'Head': 1.0}
    rings = [((0, 0, z if z <= 1.63 else 1.63 + (z - 1.63) * s), rx * s, ry * s, head) for z, rx, ry in HEAD]
    limit = {}
    for ks, key in ((BACK, 'nape'), (SIDES, 'sides'), (TEMPLES, 'temple'), (FRONT, 'brow')):
        for k in ks:
            limit[k] = spec[key]
    cover = [[k for k in range(8) if HEAD[i][0] >= limit[k] - 1e-6] for i in range(len(HEAD) - 1)]
    p.tube(rings, 8, colour, top=True, cover=cover)
    z0, rx0, ry0 = HEAD[0]
    if spec.get('tail'):
        # hair down the back: the back three eighths, from the nape ring down
        low = [((0, yo, z), rx, ry, None) for z, rx, ry, yo in reversed(spec['tail'])]
        p.tube(low + [((0, 0, z0), rx0 * s, ry0 * s, head)], 8, colour, cover=[list(BACK)] * len(low))
    if spec.get('drape'):
        # cloth round the throat and over the shoulders, all the way round
        low = [((0, 0, z), rx, ry, None) for z, rx, ry in reversed(spec['drape'])]
        p.tube(low + [((0, 0, z0), rx0 * s, ry0 * s, head)], 8, colour)
    if spec.get('bun'):
        y, z, size = spec['bun']
        p.box((0, y, z), (size, size, size), colour, head)
    if spec.get('beard'):
        w, d, h = spec['beard']
        p.box((0, -0.075, 1.545), (w, d, h), colour, head)
    if spec.get('point'):
        y, z, size = spec['point']
        p.box((0, y, z), (size * 0.8, size * 1.6, size), colour, head)


def crown(p, spec):
    head = {'Head': 1.0}
    rings = [((0, 0, z), rx, ry, head) for z, rx, ry in spec['rings']]
    made = p.tube(rings, 8, [spec['band']] + [spec['colour']] * (len(rings) - 2), top=True)
    if spec.get('brim'):
        z, width = spec['brim']
        _, rx, ry = spec['rings'][0]
        outer = p.ring((0, 0, z - 0.02), rx + width, ry + width, 8, head)
        under_in = p.ring((0, 0, z - 0.004), rx, ry, 8, head)
        under_out = p.ring((0, 0, z - 0.024), rx + width, ry + width, 8, head)
        for k in range(8):
            j = (k + 1) % 8
            p.f((made[0][k], outer[k], outer[j], made[0][j]), spec['colour'])
            p.f((under_in[j], under_out[j], under_out[k], under_in[k]), spec['band'])


def over(p, spec):
    cover = list(reversed(spec['cover']))
    colours = [spec['edge'] if len(c) == 8 else spec['colour'] for c in cover]
    for inside in (False, True):
        d = 0.006 if inside else 0.0
        rings = [((0, 0, z), rx - d, ry - d, None) for z, rx, ry in reversed(spec['rings'])]
        p.tube(rings, 8, colours, cover=cover, inside=inside)


SHAPES = {'skin': skin, 'garment': garment, 'shell': shell, 'crown': crown, 'over': over}


# ------------------------------------------------------------------- the parts --
def materials(row):
    return common.pair_materials(row['pack'], PALETTE, 'Cloth')


def build_parts(row, mats, names=None, dx=0.0, suffix=''):
    """The catalogue's parts (or only `names`) as mesh objects, in the rest
    pose, each with one material and a vertex group per joint."""
    order = [j['name'] for j in row['rig']]
    joints = {name: i for i, name in enumerate(order)}
    seen, objects = set(), []
    for spec in row['parts']:
        name = spec['name']
        slot = name.split('-', 1)[0]
        if slot not in SLOTS or '-' not in name or '.' in name:
            raise ValueError(f'{name} is not <slot>-<variant> with the slot one of {", ".join(SLOTS)}')
        if name in seen:
            raise ValueError(f'{name} is in the catalogue twice')
        seen.add(name)
        if spec['material'] not in MATERIALS:
            raise ValueError(f'{name}\'s material is {spec["material"]}, not Cloth or Bare (#820)')
        if spec['shape'] not in SHAPES:
            raise ValueError(f'{name}\'s shape is {spec["shape"]}, and folk.py has {", ".join(SHAPES)}')
        if names is not None and name not in names:
            continue
        part = common.Part(joints, dx, body_w)
        SHAPES[spec['shape']](part, spec)
        loose = [v for v in part.bm.verts if not v.link_faces]
        if loose:
            bmesh.ops.delete(part.bm, geom=loose, context='VERTS')
        mesh = bpy.data.meshes.new(name + suffix)
        part.bm.to_mesh(mesh)
        part.bm.free()
        mesh.materials.append(mats[spec['material']])
        obj = bpy.data.objects.new(name + suffix, mesh)
        bpy.context.scene.collection.objects.link(obj)
        for joint in order:
            obj.vertex_groups.new(name=joint)
        common.flat(obj)
        objects.append(obj)
    if names is not None:
        missing = [n for n in names if n not in seen]
        if missing:
            raise ValueError(f'the sheet names {", ".join(missing)}, not in the catalogue')
    return objects


def build(row):
    mats = materials(row)
    arm = common.build_rig(row['rig'])
    objects = build_parts(row, mats)
    for obj in objects:
        obj.parent = arm
        mod = obj.modifiers.new('Armature', 'ARMATURE')
        mod.object = arm
    common.check_frame(arm, objects)
    common.key_clips(row, arm)
    return arm, objects


def main():
    argv = common.args_after_dashes()
    sheet = common.arg(argv, '--sheet')
    if sheet is not None:
        row = json.loads(sheet)[0]
        common.empty_scene()
        common.seed(row)
        mats = materials(row)
        people = []
        for i, names in enumerate(row['sheet']):
            people += build_parts(row, mats, names, dx=i * 0.8, suffix=f'.{i}')
        common.contact_sheet(row['pack'], people)
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
