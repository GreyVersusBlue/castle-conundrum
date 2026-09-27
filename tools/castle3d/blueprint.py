# blueprint.py - the GUIDE stage: today's plan, as wireframes, to build against.
#
# One wireframe box per blueprint piece and per ramp, one box or 32-sided
# cylinder per room from its floor to one storey up, and one box per open room
# over its gate band, clipped to the curtain's x and z, floor to one storey
# (the open call in SPECS.md). Every shape is the blueprint's own box turned
# into Blender's frame by common.box_to_blender; nothing is re-derived (#500).
#
# GUIDE objects carry `guide` and `guideId`, never `planId`: a guide box does
# not realise a piece, and check.py line 6 counts `planId` as coverage. The
# collection is hidden from render and excluded from export (increment 9).

import math

import bpy

import common

CYLINDER_SIDES = 32


def _mesh_object(name, verts, faces, col, kind, gid, level):
    if name in bpy.data.objects:
        raise ValueError(f"guide: two guide objects named {name}")
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    ob.display_type = 'WIRE'
    ob.hide_render = True
    ob['guide'] = kind
    ob['guideId'] = gid
    ob['level'] = int(level or 0)
    col.objects.link(ob)
    return ob


def _box(name, lo, hi, col, kind, gid, level):
    (x0, y0, z0), (x1, y1, z1) = lo, hi
    verts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
             (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return _mesh_object(name, verts, faces, col, kind, gid, level)


def _cylinder(name, cx, cy, r, z0, z1, col, kind, gid, level):
    ring = [(cx + r * math.cos(2 * math.pi * i / CYLINDER_SIDES), cy + r * math.sin(2 * math.pi * i / CYLINDER_SIDES))
            for i in range(CYLINDER_SIDES)]
    verts = [(x, y, z0) for x, y in ring] + [(x, y, z1) for x, y in ring]
    n = CYLINDER_SIDES
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return _mesh_object(name, verts, faces, col, kind, gid, level)


def build(bp):
    col = common.stage_collection('guide')
    common.print_stage_table(bp)
    storey = bp['storey']
    counts = {'piece': 0, 'ramp': 0, 'room': 0, 'open': 0}

    for p in bp['pieces']:
        lo, hi = common.box_to_blender(p['box'])
        _box(f"GUIDE_piece_{p['id']}", lo, hi, col, 'piece', p['id'], p['level'])
        counts['piece'] += 1

    for r in bp['ramps']:
        lo, hi = common.box_to_blender(r['box'])
        _box(f"GUIDE_ramp_{r['id']}", lo, hi, col, 'ramp', r['id'], r['level'])
        counts['ramp'] += 1

    for room in bp['rooms']:
        floor = room['top']
        name = f"GUIDE_room_{room['id']}"
        shape = room.get('shape')
        if shape and shape.get('kind') == 'disc':
            cx, cy, _ = common.to_blender((shape['cx'], 0, shape['cz']))
            ob = _cylinder(name, cx, cy, shape['radius'], floor, floor + storey, col, 'room', room['id'], room['level'])
            ob['shape'] = 'disc'
        else:
            b = room['bounds']
            box = {'min': {'x': b['min']['x'], 'y': floor, 'z': b['min']['z']},
                   'max': {'x': b['max']['x'], 'y': floor + storey, 'z': b['max']['z']}}
            lo, hi = common.box_to_blender(box)
            ob = _box(name, lo, hi, col, 'room', room['id'], room['level'])
            ob['shape'] = 'box'
        if room.get('drum'):
            ob['drum'] = room['drum']
        ob['ward'] = room.get('ward') or ''
        counts['room'] += 1

    cur = bp['curtain']
    gate_x = bp['openRooms']['gateX']
    for o in bp['openRooms']['rooms']:
        x0 = gate_x[o['west']] if o['west'] else cur['min']['x']
        x1 = gate_x[o['east']] if o['east'] else cur['max']['x']
        if not x0 < x1:
            raise ValueError(f"guide: open room {o['id']} has an empty band {x0}..{x1}")
        box = {'min': {'x': x0, 'y': 0, 'z': cur['min']['z']}, 'max': {'x': x1, 'y': storey, 'z': cur['max']['z']}}
        lo, hi = common.box_to_blender(box)
        ob = _box(f"GUIDE_open_{o['id']}", lo, hi, col, 'open', o['id'], o['level'])
        ob['ward'] = o['ward'] or ''
        counts['open'] += 1

    want = {'piece': len(bp['pieces']), 'ramp': len(bp['ramps']), 'room': len(bp['rooms']),
            'open': len(bp['openRooms']['rooms'])}
    if counts != want:
        raise ValueError(f"guide: built {counts}, blueprint has {want}")
    print(f"guide: {counts['piece']} piece boxes, {counts['ramp']} ramp boxes, {counts['room']} room volumes, "
          f"{counts['open']} open-room boxes")
