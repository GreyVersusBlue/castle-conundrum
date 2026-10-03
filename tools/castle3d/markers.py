# markers.py - the MARKERS stage: #843's contract, written from the blueprint
# (#893 to #896).
#
# Every marker is placed from blueprint.json through common.to_blender and
# common.rotation_z and nothing else (#500), linked into MARKERS and no other
# collection, tagged `marker` (its kind) and hidden from render on the object as
# well as on the collection, so a dropped collection flag cannot put one into a
# still or the glb. A field that is null in the blueprint is not written.
#
#   ROOM_<room id>          mesh, WIRE: a box from `bounds` or a 32-sided
#                           cylinder of the disc's radius, `top` to `top + storey`,
#                           origin on the floor at the plan-view centre
#   ROOM_<open id>          the same over an open place's band, 0 to `storey`
#   COL_<collider id>       empty CUBE 1, at the box's centre, scaled to its half extents
#   GATE_<gate id>          empty PLAIN_AXES 0.5, at the opening, the centre or the room
#   GATE_<gate id>_HINGE    gates.py's hinge, adopted; made here when gates did not run
#   STAIR_<ramp id>         empty CUBE 1, as COL_ from the ramp's box
#   STAIR_<ramp id>_LOW     empty PLAIN_AXES 0.25 at slope.from ([x, z, y])
#   STAIR_<ramp id>_HIGH    the same at slope.to
#   SPAWN                   empty ARROWS 0.5 at the eye, its -Z aimed at lookAt
#   EVID_<evidence id>      empty SPHERE 0.15 at the carrying piece's box centre
#   READ_<read id>          the same
#   BELL_<piece id>         the same, where `bell` is true
#
# Boxes are empties, never a shared mesh: an empty has no geometry to render or
# export, and its box is exactly location +- scale, which check.py line 3 reads.
# No child collections under MARKERS (#894). Reads the blueprint and, for the
# hinges, what gates.py made, and nothing else, so `--only markers` builds alone.

import math

import bpy
from mathutils import Vector

import common

ROOM_SIDES = 32

# A marker moved off the blueprint, after every marker is placed and before
# SPAWN is aimed: {'<marker name>': ((dx, dy, dz), '<why>')}, game metres (#895).
# An edit made to the master over MCP is lost on the next build unless it is
# written back here (#841). Empty: no marker is more than 0.0000056 m from the
# object that realises it (measured, #895). Past 0.5 m, allow.json needs a reason.
ADJUST = {}


def _new(name, data, col):
    if bpy.data.objects.get(name) is not None:
        raise ValueError(f"markers: {name} already exists; each marker is made once (#843)")
    ob = bpy.data.objects.new(name, data)
    col.objects.link(ob)
    return ob


def _tag(ob, kind, col, **fields):
    """`marker`, the fields the blueprint does not leave null, hidden from
    render, and in MARKERS alone."""
    for c in list(ob.users_collection):
        if c != col:
            c.objects.unlink(ob)
    if col not in ob.users_collection:
        col.objects.link(ob)
    ob['marker'] = kind
    for k, v in fields.items():
        if v is not None:
            ob[k] = v
    ob.hide_render = True
    return ob


def _empty(name, display, size, col, at):
    ob = _new(name, None, col)
    ob.empty_display_type = display
    ob.empty_display_size = size
    ob.location = at
    return ob


def _box_empty(name, box, col):
    lo, hi = common.box_to_blender(box)
    ob = _empty(name, 'CUBE', 1.0, col, tuple((a + b) / 2 for a, b in zip(lo, hi)))
    ob.scale = tuple((b - a) / 2 for a, b in zip(lo, hi))
    return ob


def _room_mesh(name, centre, half, radius, height, col):
    """A box of half extents `half` (game x, z) or a ROOM_SIDES-gon of `radius`,
    its origin on the floor at `centre` (game x, y, z), `height` tall."""
    if radius is not None:
        ring = [(radius * math.cos(2 * math.pi * i / ROOM_SIDES), radius * math.sin(2 * math.pi * i / ROOM_SIDES))
                for i in range(ROOM_SIDES)]
    else:
        hx, hz = half
        ring = [(-hx, -hz), (hx, -hz), (hx, hz), (-hx, hz)]
    n = len(ring)
    verts = [(x, y, 0.0) for x, y in ring] + [(x, y, height) for x, y in ring]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = _new(name, me, col)
    ob.display_type = 'WIRE'
    ob.location = common.to_blender(centre)
    return ob


def _centre(box):
    return tuple((box['min'][k] + box['max'][k]) / 2 for k in 'xyz')


def build(bp):
    col = common.stage_collection('markers')
    storey = bp['storey']
    pieces = {p['id']: p for p in bp['pieces']}
    rooms = {r['id']: r for r in bp['rooms']}
    counts = {}

    def count(kind):
        counts[kind] = counts.get(kind, 0) + 1

    # rooms: the blueprint's, then the mystery's open places
    for r in bp['rooms']:
        b, shape = r['bounds'], r.get('shape')
        disc = bool(shape and shape.get('kind') == 'disc')
        if disc:
            centre, half, radius = (shape['cx'], r['top'], shape['cz']), None, shape['radius']
        else:
            centre = ((b['min']['x'] + b['max']['x']) / 2, r['top'], (b['min']['z'] + b['max']['z']) / 2)
            half, radius = ((b['max']['x'] - b['min']['x']) / 2, (b['max']['z'] - b['min']['z']) / 2), None
        ob = _room_mesh(f"ROOM_{r['id']}", centre, half, radius, storey, col)
        _tag(ob, 'room', col, roomId=r['id'], level=int(r['level']), ward=r.get('ward') or '', drum=r.get('drum'),
             shape='disc' if disc else 'box', open=False, top=float(r['top']))
        count('ROOM_')
    cur, gate_x = bp['curtain'], bp['openRooms']['gateX']
    for o in bp['openRooms']['rooms']:
        x0 = gate_x[o['west']] if o['west'] else cur['min']['x']
        x1 = gate_x[o['east']] if o['east'] else cur['max']['x']
        if not x0 < x1:
            raise ValueError(f"markers: open place {o['id']} has an empty band {x0}..{x1}")
        z0, z1 = cur['min']['z'], cur['max']['z']
        ob = _room_mesh(f"ROOM_{o['id']}", ((x0 + x1) / 2, 0.0, (z0 + z1) / 2), ((x1 - x0) / 2, (z1 - z0) / 2), None,
                        storey, col)
        _tag(ob, 'room', col, roomId=o['id'], level=int(o['level']), ward=o.get('ward') or '', shape='box', open=True,
             top=0.0)
        count('ROOM_')

    # colliders
    for c in bp['colliders']:
        _tag(_box_empty(f"COL_{c['id']}", c['box'], col), 'collider', col, colliderId=c['id'])
        count('COL_')

    # gates: where the plan stands each one, and what it mirrors
    for gate in bp['gates']:
        gid = gate['id']
        if gate.get('x') is not None and gate.get('z') is not None:
            at, where = 'opening', (gate['x'], 0.0, gate['z'])
        elif gate.get('centre') is not None:
            at, where = 'centre', tuple(gate['centre'])
        else:
            room = rooms.get(gid)
            if room is None or not room.get('shape') or room['shape'].get('kind') != 'disc':
                raise ValueError(f"markers: gate {gid} has no x and z, no centre, and no disc room {gid}")
            at, where = 'room', (room['shape']['cx'], room['top'], room['shape']['cz'])
        leaf = pieces.get(gid)
        level = leaf['level'] if leaf is not None else rooms[gid]['level']
        ob = _empty(f"GATE_{gid}", 'PLAIN_AXES', 0.5, col, common.to_blender(where))
        _tag(ob, 'gate', col, gateId=gid, level=int(level), at=at, closed=gate.get('closed'),
             shutAngle=gate.get('shutAngle'), openAngle=gate.get('openAngle'), bar=gate.get('bar'),
             blocks=list(gate['blocks']) if gate.get('blocks') is not None else None, quest=gate.get('quest'),
             lock=gate.get('lock'), evidence=gate.get('evidence'))
        count('GATE_')

    # hinges: gates.py's, adopted; made here when gates did not run
    made = 0
    for p in bp['pieces']:
        if not p.get('pivot'):
            continue
        h = bpy.data.objects.get(f"GATE_{p['id']}_HINGE")
        if h is None:
            import gates
            h = gates.hinge_empty(p, col)
            made += 1
        _tag(h, 'hinge', col, gateId=p['id'], level=int(p['level']))
        count('hinges')

    # ramps and their two ends; slope points are [x, z, y]
    for r in bp['ramps']:
        _tag(_box_empty(f"STAIR_{r['id']}", r['box'], col), 'stair', col, rampId=r['id'], level=int(r['level']),
             drum=r.get('drum'))
        count('STAIR_')
        for end, a in (('LOW', r['slope']['from']), ('HIGH', r['slope']['to'])):
            ob = _empty(f"STAIR_{r['id']}_{end}", 'PLAIN_AXES', 0.25, col, common.to_blender((a[0], a[2], a[1])))
            _tag(ob, f"stair-{end.lower()}", col, rampId=r['id'], level=int(r['level']))
            count('ends')

    # the spawn, aimed below once ADJUST has run
    sp = bp['spawn']
    spawn = _empty('SPAWN', 'ARROWS', 0.5, col, common.to_blender(sp['position']))
    _tag(spawn, 'spawn', col, level=int(sp['level']), lookAt=[float(v) for v in sp['lookAt']])
    count('SPAWN')

    # the pieces that carry evidence, a read or the bell
    for p in bp['pieces']:
        at = common.to_blender(_centre(p['box']))
        if p.get('evidence') is not None:
            ob = _empty(f"EVID_{p['evidence']}", 'SPHERE', 0.15, col, at)
            _tag(ob, 'evidence', col, evidenceId=p['evidence'], planId=p['id'], level=int(p['level']))
            count('EVID_')
        if p.get('read') is not None:
            ob = _empty(f"READ_{p['read']}", 'SPHERE', 0.15, col, at)
            _tag(ob, 'read', col, readId=p['read'], planId=p['id'], level=int(p['level']))
            count('READ_')
        if p.get('bell') is True:
            ob = _empty(f"BELL_{p['id']}", 'SPHERE', 0.15, col, at)
            _tag(ob, 'bell', col, planId=p['id'], level=int(p['level']))
            count('BELL_')

    # ADJUST, then the spawn's aim
    for name, entry in ADJUST.items():
        ob = bpy.data.objects.get(name)
        if ob is None or col not in ob.users_collection or 'marker' not in ob.keys():
            raise ValueError(f"markers: ADJUST names {name}, which is no marker")
        (dx, dy, dz), why = entry
        if not isinstance(why, str) or not why.strip():
            raise ValueError(f"markers: ADJUST's {name} has no why")
        ob.location = Vector(ob.location) + Vector(common.to_blender((dx, dy, dz)))
    target = Vector(common.to_blender(sp['lookAt']))
    spawn.rotation_euler = (target - Vector(spawn.location)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()

    total = sum(counts.values())
    print(f"markers: {total} in MARKERS: " + ', '.join(f"{n} {k}" for k, n in counts.items())
          + f"; {made} hinge(s) made here, {counts.get('hinges', 0) - made} adopted from gates")
    print('markers: ADJUST ' + ('empty' if not ADJUST else ', '.join(
        f"{k} by game {v[0]} ({v[1]})" for k, v in ADJUST.items())))
