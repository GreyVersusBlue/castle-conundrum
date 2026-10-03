# check.py - the net over a saved castle3d file (#844).
#
#   blender -b <saved .blend> --factory-startup --python-exit-code 1
#           --python tools/castle3d/check.py -- --blueprint <file>
#
# Runs in a second Blender that opened the saved file, not in the one that
# built it: the builder can see an image it loaded but never saved with a path
# that resolves, and the saved file is what export and Devon open.
#
# Nine lines (#844, amended to eight by #876 and to nine by #895). Each prints its own line, `ok`, `FAIL` or `--` (did not run), and
# why. A line runs when the stage it checks is in scene["castle3d_stages"];
# a line that did not run says so and passes nothing. A line whose stage ran
# but whose body is not written yet FAILS, so a stage cannot ship ahead of its
# net. Exits 1 when any line failed (#13).
#
#   1 rooms     (markers)   one ROOM_ per blueprint room and open place;      LIVE
#                           every mystery room has one
#   2 gates     (markers)   every gate a GATE_ with the blueprint's fields,   LIVE
#                           a _HINGE on each pivot holding its LEAF_
#   3 where     (markers)   every marker within 0.5 m of the blueprint,       LIVE
#                           allow.json aside, and of the object realising it
#   4 images    (always)    every Image Texture node resolves and loads   LIVE
#   5 ground    (terrain)   level-0 room corners and centres at 0 +- 0.02 m  LIVE
#   6 coverage  (geometry)  each piece of a stage that ran is named by a      LIVE
#                           planId or planIds outside GUIDE and MARKERS
#   7 light     (lighting)  one clamped HDRI World, SUN on the file's sun,    LIVE
#                           each practical in its source, each BRAZIER_ placed
#   8 cameras   (lighting)  one CAM_ per blueprint camera at its eye and aim, LIVE
#                           each on a floor the spawn reaches; CAM_spawn is the scene's
#   9 markers   (markers)   one COL_ per collider, a STAIR_ and both ends per LIVE
#                           ramp, SPAWN aimed, each EVID_, READ_, BELL_; every
#                           marker hidden from render and nothing else in MARKERS;
#                           when props ran, each PROP_ its piece's noCollide (#898)
# Lines 5 and 6 are live from increment 1, whose terrain is the first geometry
# stage; 7 and 8 from increment 7 (#876); 1, 2, 3 and 9 from increment 8
# (#895). Line 9 is last so no line renumbers.

import os
import sys
import json
import math

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # no __pycache__ in the repo; .gitignore stays as it is
sys.path.insert(0, HERE)

import bpy

import common  # the pin

argv = common.args_after_dashes()
bp_path = common.arg(argv, '--blueprint')
if not bp_path:
    raise SystemExit('check.py: needs -- --blueprint <file>')
bp = common.load_blueprint(bp_path)
with open(os.path.join(HERE, 'allow.json'), 'r', encoding='utf-8') as f:
    allow = json.load(f)

scene = bpy.context.scene
stages_text = scene.get('castle3d_stages')
if not stages_text:
    raise RuntimeError(f"check.py: {bpy.data.filepath} carries no castle3d_stages; it was not written by build.py")
stages = stages_text.split(',')

failed = []


def report(n, name, ok, why):
    print(f"  {'ok  ' if ok else 'FAIL'}  line {n} {name}: {why}")
    if not ok:
        failed.append(n)


def skipped(n, name, why):
    print(f"  --    line {n} {name}: did not run ({why})")


def not_written(n, name, stage):
    report(n, name, False, f"{stage} was built but this line has no body yet; write it with the stage")


# ------------------------------------------------------------------ helpers --
from mathutils import Vector


def g(v):
    """A game point, printed as the spec writes it."""
    return '(' + ', '.join(f"{float(c):g}" for c in v) + ')'


from common import to_game  # the inverse of to_blender, shared with export.py (#898)


def tree_bounds(root):
    """A root and its descendants' meshes' world bounds, as a game box."""
    pts = []
    for o in [root] + list(root.children_recursive):
        if o.type == 'MESH':
            pts += [to_game(o.matrix_world @ Vector(c)) for c in o.bound_box]
    if not pts:
        return None
    return {'min': {k: min(p[i] for p in pts) for i, k in enumerate('xyz')},
            'max': {k: max(p[i] for p in pts) for i, k in enumerate('xyz')}}


def box_centre(box):
    return tuple((box['min'][k] + box['max'][k]) / 2 for k in 'xyz')


def worst_face(a, b):
    """The largest of the six face differences between two game boxes."""
    return max(abs(a[e][k] - b[e][k]) for e in ('min', 'max') for k in 'xyz')


def empty_box(ob):
    """A CUBE empty's world box, location +- its scale, as a game box."""
    t = ob.matrix_world.translation
    s = ob.matrix_world.to_scale() * ob.empty_display_size
    lo, hi = t - s, t + s
    return {'min': {'x': lo.x, 'y': lo.z, 'z': -hi.y}, 'max': {'x': hi.x, 'y': hi.z, 'z': -lo.y}}


def is_marker_name(name):
    return name.startswith(common.MARKER_PREFIXES)


# ---------------------------------------------- what each marker should be --
# Built here from the blueprint alone, never from markers.py's placement, so a
# placement bug there is a difference here rather than the same bug twice (#34).
WHERE_TOLERANCE = 0.5        # metres, line 3 (#895)
HINGE_TOLERANCE = 0.01       # metres, line 2
TURN_TOLERANCE = 0.1         # degrees, lines 2 and 9
GATE_FIELDS = ('closed', 'shutAngle', 'openAngle', 'bar', 'blocks', 'quest', 'lock', 'evidence')

expect = {}   # marker name -> what the blueprint says it is
for r in bp['rooms']:
    b, shape = r['bounds'], r.get('shape')
    expect[f"ROOM_{r['id']}"] = {
        'kind': 'room', 'id': r['id'], 'level': r['level'], 'open': False, 'top': r['top'],
        'shape': 'disc' if shape and shape.get('kind') == 'disc' else 'box',
        'cx': (b['min']['x'] + b['max']['x']) / 2, 'cz': (b['min']['z'] + b['max']['z']) / 2}
_cur, _gx = bp['curtain'], bp['openRooms']['gateX']
for o in bp['openRooms']['rooms']:
    expect[f"ROOM_{o['id']}"] = {
        'kind': 'room', 'id': o['id'], 'level': o['level'], 'open': True, 'top': 0, 'shape': 'box',
        'band': (_gx[o['west']] if o['west'] else _cur['min']['x'], _gx[o['east']] if o['east'] else _cur['max']['x']),
        'zs': (_cur['min']['z'], _cur['max']['z'])}
for c in bp['colliders']:
    expect[f"COL_{c['id']}"] = {'kind': 'collider', 'id': c['id'], 'box': c['box']}
_bp_rooms = {r['id']: r for r in bp['rooms']}
_pieces = {p['id']: p for p in bp['pieces']}
for gt in bp['gates']:
    if 'x' in gt and 'z' in gt:
        at, pt = 'opening', (gt['x'], 0, gt['z'])
    elif gt.get('centre') is not None:
        at, pt = 'centre', tuple(gt['centre'])
    else:
        rm = _bp_rooms.get(gt['id'])
        at = 'room'
        pt = (rm['shape']['cx'], rm['top'], rm['shape']['cz']) if rm and rm.get('shape') else None
    expect[f"GATE_{gt['id']}"] = {'kind': 'gate', 'id': gt['id'], 'at': at, 'point': pt, 'row': gt}
for p in bp['pieces']:
    if p.get('pivot'):
        expect[f"GATE_{p['id']}_HINGE"] = {'kind': 'hinge', 'id': p['id'], 'point': tuple(p['pivot']['position']),
                                           'turn': p['pivot']['rotationY']}
for r in bp['ramps']:
    expect[f"STAIR_{r['id']}"] = {'kind': 'stair', 'id': r['id'], 'box': r['box']}
    for end, a in (('LOW', r['slope']['from']), ('HIGH', r['slope']['to'])):
        expect[f"STAIR_{r['id']}_{end}"] = {'kind': f"stair-{end.lower()}", 'id': r['id'], 'point': (a[0], a[2], a[1])}
expect['SPAWN'] = {'kind': 'spawn', 'id': 'spawn', 'point': tuple(bp['spawn']['position'])}
for p in bp['pieces']:
    for key, prefix, kind in (('evidence', 'EVID_', 'evidence'), ('read', 'READ_', 'read')):
        if p.get(key) is not None:
            expect[f"{prefix}{p[key]}"] = {'kind': kind, 'id': p[key], 'planId': p['id'], 'point': box_centre(p['box'])}
    if p.get('bell') is True:
        expect[f"BELL_{p['id']}"] = {'kind': 'bell', 'id': p['id'], 'planId': p['id'], 'point': box_centre(p['box'])}

_mcol = bpy.data.collections.get('MARKERS')
in_markers = set(_mcol.all_objects) if _mcol else set()
obj = bpy.data.objects.get

# ----------------------------------------------------------------- 1: rooms --
# One ROOM_ per blueprint room and open place, each a mesh in MARKERS with
# marker, roomId, level, shape and open; every data/mystery.json room among
# them; no ROOM_ naming neither (#894).
if 'markers' in stages:
    with open(os.path.join(HERE, '..', '..', 'data', 'mystery.json'), 'r', encoding='utf-8') as f:
        mystery = [r['id'] for r in json.load(f)['rooms']]
    probs = []
    rooms_want = {k: e for k, e in expect.items() if e['kind'] == 'room'}
    for name, e in rooms_want.items():
        ob = obj(name)
        if ob is None:
            what = f"{e['id']} is {'an open place' if e['open'] else 'a blueprint room'} (level {e['level']})"
            probs.append(f"{name} missing; {what}" + (' and a mystery room' if e['id'] in mystery else ''))
            continue
        if ob.type != 'MESH' or ob not in in_markers:
            probs.append(f"{name} is a {ob.type}{'' if ob in in_markers else ' outside MARKERS'}; a ROOM_ is a mesh in MARKERS")
        for k, v in (('marker', 'room'), ('roomId', e['id']), ('level', e['level']), ('shape', e['shape']),
                     ('open', e['open'])):
            if k not in ob.keys() or ob[k] != v:
                probs.append(f"{name}'s {k} is {ob[k] if k in ob.keys() else 'missing'}, not {v}")
    for m in mystery:
        if f"ROOM_{m}" not in rooms_want:
            probs.append(f"mystery room {m} is neither a blueprint room nor an open place")
    for ob in bpy.data.objects:
        if ob.name.startswith('ROOM_') and ob.name not in rooms_want:
            probs.append(f"{ob.name} names neither a blueprint room nor an open place")
    if probs:
        report(1, 'rooms', False, '; '.join(probs[:12]) + (' ...' if len(probs) > 12 else ''))
    else:
        nb = len(bp['rooms'])
        nd = sum(1 for e in rooms_want.values() if not e['open'] and e['shape'] == 'disc')
        report(1, 'rooms', True, f"{len(rooms_want)} ROOM_ ({nb} blueprint rooms, {nd} of them discs, and "
               f"{len(rooms_want) - nb} open places); the {len(mystery)} mystery rooms each have one")
else:
    skipped(1, 'rooms', 'markers was not built')

# ----------------------------------------------------------------- 2: gates --
# One GATE_ per blueprint gate, gateId, `at` and every mirrored field equal to
# the blueprint's (a null field absent); one _HINGE per pivot, on it within
# HINGE_TOLERANCE and turned to its rotationY within TURN_TOLERANCE; `bar`
# True on a gate with no hinge; and when gates ran, each hinge parents exactly
# LEAF_<gate id>, whose origin is on it (#894, #895).
if 'markers' in stages:
    probs = []
    gates_ran = 'gates' in stages
    hinged = {e['id'] for e in expect.values() if e['kind'] == 'hinge'}
    for name, e in expect.items():
        if e['kind'] != 'gate':
            continue
        ob, row = obj(name), e['row']
        if ob is None:
            probs.append(f"{name} missing; the blueprint has gate {e['id']}")
            continue
        for k, v in (('marker', 'gate'), ('gateId', e['id']), ('at', e['at'])):
            if k not in ob.keys() or ob[k] != v:
                probs.append(f"{name}'s {k} is {ob[k] if k in ob.keys() else 'missing'}, not {v}")
        for k in GATE_FIELDS:
            v = row.get(k)
            have = ob.get(k)
            if hasattr(have, 'to_list'):
                have = have.to_list()
            elif have is not None and not isinstance(have, (str, int, float, bool)):
                have = list(have)
            if v is None and k in ob.keys():
                probs.append(f"{name} carries {k} {have}, which the blueprint leaves null")
            elif v is not None and (k not in ob.keys() or have != v):
                probs.append(f"{name}'s {k} is {have if k in ob.keys() else 'missing'}, not the blueprint's {v}")
        if e['id'] not in hinged and row.get('bar') is not True:
            probs.append(f"gate {e['id']} has no hinge and is no bar")
    for name, e in expect.items():
        if e['kind'] != 'hinge':
            continue
        h = obj(name)
        leaf = obj(f"LEAF_{e['id']}") if gates_ran else None
        if h is None:
            msg = f"{name} missing; {e['id']} has a pivot at game {g(round(c, 4) for c in e['point'])}"
            if gates_ran:
                msg += (f"; LEAF_{e['id']}'s parent is {leaf.parent.name if leaf and leaf.parent else 'none'}, "
                        f"not {name}")
            probs.append(msg)
            continue
        if h.get('gateId') != e['id']:
            probs.append(f"{name}'s gateId is {h.get('gateId')}, not {e['id']}")
        d = (h.matrix_world.translation - Vector(common.to_blender(e['point']))).length
        if d > HINGE_TOLERANCE:
            probs.append(f"{name} is {d:.3f} m from {e['id']}'s pivot {g(round(c, 4) for c in e['point'])}")
        m = h.matrix_world.to_3x3()
        turn = math.degrees(math.atan2(m[1][0], m[0][0]))
        off = abs((turn - e['turn'] + 180) % 360 - 180)
        if off > TURN_TOLERANCE:
            probs.append(f"{name} is turned {turn % 360:.2f} deg, {off:.2f} off {e['id']}'s rotationY {e['turn']:g}")
        if gates_ran:
            kids = sorted(c.name for c in h.children)
            if kids != [f"LEAF_{e['id']}"]:
                probs.append(f"{name} holds {', '.join(kids) or 'nothing'}, not LEAF_{e['id']} alone")
            elif (leaf.matrix_world.translation - h.matrix_world.translation).length > HINGE_TOLERANCE:
                probs.append(f"LEAF_{e['id']}'s origin is off {name}")
    if probs:
        report(2, 'gates', False, '; '.join(probs))
    else:
        gs = [e for e in expect.values() if e['kind'] == 'gate']
        parts = []
        for at, words in (('opening', 'at the opening'), ('centre', 'at its centre'), ('room', 'at its room')):
            ids = [e['id'] for e in gs if e['at'] == at]
            if ids:
                bars = [e['id'] for e in gs if e['at'] == at and e['id'] not in hinged and e['row'].get('bar')]
                parts.append(f"{', '.join(ids)} {words}" + (', bar' if bars else ''))
        nh = len(hinged)
        tail = 'each holding its LEAF_' if gates_ran else 'made by markers (gates did not run)'
        report(2, 'gates', True, f"{len(gs)} GATE_ ({', '.join(parts)}), {nh} hinges at their pivots, {tail}")
else:
    skipped(2, 'gates', 'markers was not built')

# ----------------------------------------------------------------- 3: where --
# (a) Against the blueprint, every marker in `expect` that exists: a ROOM_'s
# plan-view centre against its bounds' centre and its lowest vertex against
# `top`; an open place's centre strictly inside its band and the curtain; a
# COL_ or STAIR_ box by its worst face; every point marker by its distance.
# Past WHERE_TOLERANCE fails unless allow.json names the marker with a reason;
# an entry with no reason, one for a marker within the tolerance (stale), and
# one under a marker prefix naming no marker, each fail. (b) Against the model:
# a STAIR_, EVID_, READ_ or BELL_ whose item exactly one object outside GUIDE
# and MARKERS realises by planId, its point against that object's bounds'
# centre or its box by the worst face. Past WHERE_TOLERANCE fails and
# allow.json cannot excuse it: an entry records a departure from the plan,
# never from the model the marker describes (#895, amending #844).
if 'markers' in stages:
    probs, allowed = [], []
    marker_allow = {k: v for k, v in allow.items() if is_marker_name(k)}
    worst = {'room': 0.0, 'box': 0.0, 'point': 0.0}
    within, open_ok, measured = 0, 0, {}
    for name, e in expect.items():
        ob = obj(name)
        if ob is None:
            continue
        if e['kind'] == 'room':
            vs = [ob.matrix_world @ v.co for v in ob.data.vertices] if ob.type == 'MESH' else [ob.matrix_world.translation]
            cx = (min(v.x for v in vs) + max(v.x for v in vs)) / 2
            cz = -(min(v.y for v in vs) + max(v.y for v in vs)) / 2
            low = min(v.z for v in vs)
            if ob.get('level') != e['level']:
                probs.append(f"{name}'s level is {ob.get('level')}, not {e['level']}")
            if e['open']:
                (x0, x1), (z0, z1) = e['band'], e['zs']
                inside = x0 < cx < x1 and z0 < cz < z1
                d = 0.0 if inside else WHERE_TOLERANCE + 1
                why = f"{name}'s centre game ({cx:g}, {cz:g}) is outside its band x {x0:g}..{x1:g}, z {z0:g}..{z1:g}"
                kind = None
            else:
                dc, df = math.hypot(cx - e['cx'], cz - e['cz']), abs(low - e['top'])
                d, kind = max(dc, df), 'room'
                why = (f"{name}'s centre is {dc:.3f} m from {e['id']}'s ({e['cx']:g}, {e['cz']:g}) in plan"
                       if dc >= df else f"{name}'s floor is {df:.3f} m from {e['id']}'s top {e['top']:g}")
                why += f" (limit {WHERE_TOLERANCE:g})"
        elif 'box' in e:
            d, kind = worst_face(empty_box(ob), e['box']), 'box'
            why = f"{name}'s box is {d:.3f} m from {e['kind']} {e['id']}'s at its worst face (limit {WHERE_TOLERANCE:g})"
        else:
            if e['point'] is None:
                probs.append(f"{name}: the blueprint gives gate {e['id']} no point")
                continue
            d = (ob.matrix_world.translation - Vector(common.to_blender(e['point']))).length
            kind = 'point'
            why = f"{name} is {d:.3f} m from {g(round(c, 4) for c in e['point'])} (limit {WHERE_TOLERANCE:g})"
        measured[name] = d
        reason = marker_allow.get(name)
        if name in marker_allow and not (isinstance(reason, str) and reason.strip()):
            continue  # named below as having no reason
        if d > WHERE_TOLERANCE:
            if name in marker_allow:
                allowed.append(f"{name} {d:.3f} m ({reason})")
            else:
                probs.append(f"{why} and allow.json has no {name}")
        elif name in marker_allow:
            probs.append(f"allow.json's {name} is stale: {name} is {d:.3f} m from the blueprint, "
                         f"within {WHERE_TOLERANCE:g}; delete the entry")
        else:
            within += 1
            if kind is None:
                open_ok += 1
            else:
                worst[kind] = max(worst[kind], d)
    for k, v in marker_allow.items():
        if not (isinstance(v, str) and v.strip()):
            probs.append(f"allow.json's {k} has no reason")
        elif k not in measured:
            probs.append(f"allow.json's {k} names no marker in the file")
    # (b) the model
    realised, model_worst, model_text = 0, 0.0, None
    if any(s in stages for s in common.GEOMETRY):
        outside = set(in_markers)
        gcol = bpy.data.collections.get('GUIDE')
        if gcol:
            outside |= set(gcol.all_objects)
        by_plan = {}
        for o in bpy.data.objects:
            if o not in outside and 'planId' in o.keys():
                by_plan.setdefault(str(o['planId']), []).append(o)
        for name, e in expect.items():
            pid = e['id'] if e['kind'] == 'stair' else e.get('planId')
            ob = obj(name)
            if pid is None or ob is None or len(by_plan.get(pid, [])) != 1:
                continue
            real = by_plan[pid][0]
            tb = tree_bounds(real)
            if tb is None:
                continue
            if e['kind'] == 'stair':
                d = worst_face(empty_box(ob), tb)
            else:
                c = box_centre(tb)
                d = math.dist(to_game(ob.matrix_world.translation), c)
            realised += 1
            model_worst = max(model_worst, d)
            if d > WHERE_TOLERANCE:
                probs.append(f"{name} is {d:.3f} m from {real.name}, which realises {pid}; allow.json excuses a "
                             f"marker from the blueprint, never from the model")
        model_text = f"{realised} on the objects that realise them (worst {model_worst:.3f} m)"
    else:
        model_text = 'no realising objects (no geometry stage ran)'
    if probs:
        report(3, 'where', False, '; '.join(probs[:12]) + (' ...' if len(probs) > 12 else ''))
    else:
        report(3, 'where', True, f"{within} markers within {WHERE_TOLERANCE:g} m of the blueprint (worst room "
               f"{worst['room']:.3f} m, box {worst['box']:.3f}, point {worst['point']:.3f}), {open_ok} open places "
               f"in their bands; {model_text}; {len(allowed)} allowed" + (': ' + ', '.join(allowed) if allowed else ''))
else:
    skipped(3, 'where', 'markers was not built')


# --------------------------------------------------------------- 4: images --
def image_nodes():
    """(owner label, node) for every Image and Environment Texture node in
    every material, world and node group, groups included once each."""
    trees = []
    for m in bpy.data.materials:
        if m.node_tree:
            trees.append((f"material {m.name}", m.node_tree))
    for w in bpy.data.worlds:
        if w.node_tree:
            trees.append((f"world {w.name}", w.node_tree))
    for g in bpy.data.node_groups:
        trees.append((f"node group {g.name}", g))
    for label, tree in trees:
        for node in tree.nodes:
            if node.type in ('TEX_IMAGE', 'TEX_ENVIRONMENT'):
                yield label, node


problems = []
nodes = 0
images = set()
for label, node in image_nodes():
    nodes += 1
    img = node.image
    if img is None:
        problems.append(f"{label} / {node.name} has no image")
        continue
    images.add(img.name)
    if img.packed_file is None:
        path = bpy.path.abspath(img.filepath, library=img.library)
        if not img.filepath or not os.path.isfile(path):
            problems.append(f"image {img.name} ({label} / {node.name}) points at {path or '(no path)'}, which is not a file")
            continue
    if img.size[0] == 0 or img.size[1] == 0:
        img.reload()
    if img.size[0] == 0 or img.size[1] == 0:
        problems.append(f"image {img.name} ({label} / {node.name}) loads as {img.size[0]} x {img.size[1]}")
if problems:
    report(4, 'images', False, '; '.join(problems))
else:
    report(4, 'images', True, f"{nodes} image texture nodes, {len(images)} images, each on disk or packed and non-empty")

# ----------------------------------------------------------- 5: level ground --
# The terrain's height, by a ray straight down onto common.TERRAIN alone, at
# the four corners and the centre of every level-0 blueprint room: a box
# room's bounds, a disc room's square about its centre. Each is 0 within
# GROUND_TOLERANCE, since the floors are where every gameplay distance is
# measured from. The message names the first room, in blueprint order, whose
# point is off, and the point.
GROUND_TOLERANCE = 0.02


def room_points(room):
    shape = room.get('shape')
    if shape and shape.get('kind') == 'disc':
        cx, cz, r = shape['cx'], shape['cz'], shape['radius']
        x0, x1, z0, z1 = cx - r, cx + r, cz - r, cz + r
    else:
        b = room['bounds']
        x0, x1, z0, z1 = b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z']
    return [('corner', x0, z0), ('corner', x1, z0), ('corner', x1, z1), ('corner', x0, z1),
            ('centre', (x0 + x1) / 2, (z0 + z1) / 2)]


if 'terrain' in stages:
    from mathutils import Vector
    ground = bpy.data.objects.get(common.TERRAIN)
    if ground is None or ground.type != 'MESH':
        report(5, 'level ground', False, f"terrain was built but there is no mesh {common.TERRAIN}")
    else:
        inv = ground.matrix_world.inverted()
        rooms0 = [r for r in bp['rooms'] if r['level'] == 0]
        bad, worst, count = None, 0.0, 0
        for room in rooms0:
            for what, x, z in room_points(room):
                bx, by, _ = common.to_blender((x, 0.0, z))
                o = inv @ Vector((bx, by, 1000.0))
                d = (inv.to_3x3() @ Vector((0.0, 0.0, -1.0))).normalized()
                hit, loc, _n, _i = ground.ray_cast(o, d)
                count += 1
                h = (ground.matrix_world @ loc).z if hit else None
                if h is None or abs(h) > GROUND_TOLERANCE:
                    if bad is None:
                        at = 'no ground under it' if h is None else f"height {h:+.3f} m"
                        bad = f"room {room['id']} {what} at game x {x:g}, z {z:g} has {at}, not 0 +- {GROUND_TOLERANCE}"
                else:
                    worst = max(worst, abs(h))
        if bad:
            report(5, 'level ground', False, bad)
        else:
            report(5, 'level ground', True, f"{len(rooms0)} level-0 rooms, {count} points, largest |height| {worst:.4f} m")
else:
    skipped(5, 'level ground', 'terrain was not built')

# --------------------------------------------------------------- 6: coverage --
# Each blueprint piece that STAGE_OF gives a stage that ran is named by at
# least one object's planId or planIds outside GUIDE and MARKERS, and no object
# names an id the blueprint lacks. The exceptions are allow.json entries keyed
# by piece id (or model:<file>), each with a reason; one with no reason fails.
# An entry under a marker prefix is line 3's, and this line skips it (#895).
# From 7b (#960) a piece-id entry something realises fails as stale, and a key
# that names nothing fails; the pass text gains the allowed ids when any applied.
ran =[s for s in common.GEOMETRY if s in stages]
if ran:
    table = common.STAGE_OF(bp)
    outside = set()
    for name in ('GUIDE', 'MARKERS'):
        c = bpy.data.collections.get(name)
        if c:
            outside |= set(c.all_objects)
    named = {}
    for ob in bpy.data.objects:
        if ob in outside:
            continue
        ids = []
        if 'planId' in ob.keys():
            ids.append(str(ob['planId']))
        if 'planIds' in ob.keys():
            ids += [str(i) for i in ob['planIds']]
        for i in ids:
            named.setdefault(i, ob.name)
    unreasoned = sorted(k for k, v in allow.items() if not is_marker_name(k) and not (isinstance(v, str) and v.strip()))
    want = [pid for pid, s in table.items() if s in ran]
    missing = [pid for pid in want if pid not in named and pid not in allow]
    unknown = sorted(f"{i} (on {o})" for i, o in named.items() if i not in table)
    # Two clauses from 7b (#960), so a reason that has gone stale cannot sit in
    # allow.json for ever: (a) a piece-id entry whose stage ran and which some
    # object names; (b) a key that is no piece id, under no marker prefix and
    # not model:<file>, which names nothing.
    stale = [pid for pid in want if pid in allow and pid in named]
    nothing = [k for k in allow if k not in table and not is_marker_name(k) and not k.startswith('model:')]
    allowed = [pid for pid in want if pid in allow and pid not in named]
    why = []
    if missing:
        why.append(f"{len(missing)} piece(s) nothing realises: {', '.join(missing[:12])}" + (' ...' if len(missing) > 12 else ''))
    if unknown:
        why.append(f"object(s) name ids the blueprint lacks: {', '.join(unknown[:12])}")
    if unreasoned:
        why.append(f"allow.json entries with no reason: {', '.join(unreasoned)}")
    for pid in stale:
        why.append(f"allow.json's {pid} is stale: {named[pid]} realises it; delete the entry")
    for k in nothing:
        why.append(f"allow.json's {k} names no blueprint piece, marker or model:<file>")
    if why:
        report(6, 'coverage', False, '; '.join(why))
    elif allowed:
        report(6, 'coverage', True, f"{len(want)} pieces of {', '.join(ran)}; {len(want) - len(allowed)} named by a "
               f"planId or planIds, {len(allowed)} allowed by allow.json ({', '.join(allowed)})")
    else:
        report(6, 'coverage', True, f"{len(want)} pieces of {', '.join(ran)} each named by a planId or planIds")
else:
    skipped(6, 'coverage', 'no geometry stage was built')

# ------------------------------------------------------------------ 7: light --
# (a) exactly one World, the scene's, with one Environment Texture on the HDRI
# row's file, its Vector unlinked (no rotation), Background strength 1, and a
# DARKEN Mix feeding the Background whose B is a grey c over 0; (b) one Sun
# light, SUN, whose world +Z is within SUN_TOLERANCE of the file's sun as this
# line measures it from the saved image, and whose strength times its colour's
# luminance is within ENERGY_TOLERANCE of what the clamp removes; (c) every
# other light a Point light carrying lightFor and kind, inside its source's
# box grown by SOURCE_GROW; (d) one BRAZIER_<n> per blueprint brazier, each
# root within 0.01 m of its position (#876). The measurement in (b) is this
# file's own; lighting.py's constants are what it is held against.
SUN_TOLERANCE = 0.5          # degrees
ENERGY_TOLERANCE = 0.02      # of the removed luminance
SOURCE_GROW = 0.1            # metres
PLACE_TOLERANCE = 0.01       # metres
LUMA = (0.2126, 0.7152, 0.0722)


def feeds(node, target, seen=None):
    """True when a link path runs from node's outputs to target."""
    seen = seen or set()
    for out in node.outputs:
        for link in out.links:
            n = link.to_node
            if n == target:
                return True
            if n.name not in seen:
                seen.add(n.name)
                if feeds(n, target, seen):
                    return True
    return False


def enabled(sockets, name, kind):
    for s in sockets:
        if s.name == name and s.type == kind and getattr(s, 'enabled', True):
            return s
    return None


def file_sun(img, c):
    """(unit Blender direction, removed luminance) of every pixel with a channel
    over c: weight = luminance of the part over c times the pixel's solid
    angle; azimuth 2 pi (0.5 - u), elevation pi (v - 0.5), v from the bottom
    row (#873's mapping, measured by render)."""
    import numpy as np
    from mathutils import Vector
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)[:, :, :3].astype(np.float64)
    j, i = np.nonzero((px > c).any(axis=2))
    over = np.maximum(px[j, i] - c, 0.0) @ np.array(LUMA)
    el = math.pi * ((j + 0.5) / h - 0.5)
    az = 2 * math.pi * (0.5 - (i + 0.5) / w)
    weight = over * np.cos(el) * (2 * math.pi / w) * (math.pi / h)
    d = Vector((float((weight * np.cos(el) * np.cos(az)).sum()), float((weight * np.cos(el) * np.sin(az)).sum()),
                float((weight * np.sin(el)).sum())))
    return d.normalized(), float(weight.sum()), len(j)


if 'lighting' in stages:
    import math
    import lighting
    from mathutils import Vector
    row = common.source(lighting.HDRI)
    fname = row['file'].split('/')[-1]
    probs = []
    worlds = list(bpy.data.worlds)
    world, clamp, img = scene.world, None, None
    if not worlds or world is None:
        probs.append(f"the scene has no World; lighting builds WORLD_hdri from {lighting.HDRI}")
    elif len(worlds) != 1:
        probs.append(f"{len(worlds)} worlds ({', '.join(sorted(w.name for w in worlds))}); lighting builds the only one")
    elif world.name != 'WORLD_hdri':
        # A zero-user World is not saved (measured, 5.2.2), so a second World
        # made before lighting's shows here only as the survivor's .NNN name.
        probs.append(f"the World is {world.name}, not WORLD_hdri: a World made before lighting's was dropped on save; "
                     f"lighting builds the only one")
    elif world.node_tree is None:
        probs.append(f"{world.name} has no node tree; lighting builds WORLD_hdri from {lighting.HDRI}")
    else:
        tree = world.node_tree
        envs = [n for n in tree.nodes if n.type == 'TEX_ENVIRONMENT']
        bgs = [n for n in tree.nodes if n.type == 'BACKGROUND']
        if len(envs) != 1:
            probs.append(f"{world.name} has {len(envs)} Environment Textures; it needs one, on {fname}")
        elif envs[0].inputs['Vector'].is_linked:
            probs.append(f"{world.name}'s Environment Texture has its Vector linked; the HDRI is not rotated (#873)")
        elif envs[0].image is None or os.path.basename(envs[0].image.filepath) != fname:
            probs.append(f"{world.name}'s Environment Texture reads "
                         f"{os.path.basename(envs[0].image.filepath) if envs[0].image else 'no image'}, not {fname}")
        else:
            img = envs[0].image
        if len(bgs) != 1:
            probs.append(f"{world.name} has {len(bgs)} Background nodes; it needs one")
        else:
            bg = bgs[0]
            strength = bg.inputs['Strength']
            if strength.is_linked or abs(strength.default_value - 1.0) > 1e-6:
                probs.append(f"{world.name}'s Background strength is "
                             f"{'linked' if strength.is_linked else f'{strength.default_value:g}'}, not 1.0")
            darks = [n for n in tree.nodes if n.type == 'MIX' and n.data_type == 'RGBA' and n.blend_type == 'DARKEN'
                     and feeds(n, bg)]
            if not darks:
                probs.append(f"{world.name} has no sun clamp (a DARKEN mix before its Background), so the sun is "
                             f"counted twice")
            else:
                b = enabled(darks[0].inputs, 'B', 'RGBA')
                grey = tuple(b.default_value)[:3] if b is not None and not b.is_linked else None
                if grey is None or max(grey) - min(grey) > 1e-6 or grey[0] <= 0:
                    probs.append(f"{world.name}'s sun clamp has B {grey}, not a grey over 0")
                else:
                    clamp = grey[0]
    # (b) the sun
    suns = [o for o in bpy.data.objects if o.type == 'LIGHT' and o.data.type == 'SUN']
    sun_text = ''
    if len(suns) != 1 or suns[0].name != 'SUN':
        probs.append(f"{len(suns)} Sun light(s) ({', '.join(o.name for o in suns) or 'none'}); lighting builds one, SUN")
    elif img is not None and clamp is not None:
        d, removed, n_px = file_sun(img, clamp)
        up = (suns[0].matrix_world.to_3x3() @ Vector((0.0, 0.0, 1.0))).normalized()
        off = math.degrees(math.acos(max(-1.0, min(1.0, up.dot(d)))))
        energy = suns[0].data.energy * sum(a * b for a, b in zip(LUMA, suns[0].data.color))
        if off > SUN_TOLERANCE:
            probs.append(f"SUN points {off:.2f} deg from the HDRI's sun (limit {SUN_TOLERANCE})")
        if abs(energy - removed) > ENERGY_TOLERANCE * removed:
            probs.append(f"SUN carries {energy:.3f} by luminance against {removed:.3f} the clamp removes "
                         f"(limit {ENERGY_TOLERANCE:.0%})")
        sun_text = f"SUN {off:.2f} deg from the HDRI's sun, {energy:.3f} against {removed:.3f} removed ({n_px} pixels over {clamp:g})"
    # (d) the braziers
    want = {b['id']: b for b in bp.get('braziers') or []}
    have = {}
    for o in bpy.data.objects:
        if o.parent is None and o.name.startswith('BRAZIER_'):
            have[f"brazier-{o.name[len('BRAZIER_'):]}"] = o
    missing = [k for k in want if k not in have]
    extra = sorted(k for k in have if k not in want)
    if missing or extra:
        probs.append(f"{len(have)} BRAZIER_ objects for the blueprint's {len(want)} braziers"
                     + (f"; missing {', '.join(missing)}" if missing else '')
                     + (f"; not in the blueprint {', '.join(have[k].name for k in extra)}" if extra else ''))
    for k, b in want.items():
        o = have.get(k)
        if o is not None:
            dist = (o.matrix_world.translation - Vector(common.to_blender(b['position']))).length
            if dist > PLACE_TOLERANCE:
                probs.append(f"{o.name} is {dist:.3f} m from {k}'s blueprint position {g(b['position'])}")
    # (c) the practicals
    boxes = {p['id']: p['box'] for p in bp['pieces']}
    kinds = {}
    for o in bpy.data.objects:
        if o.type != 'LIGHT' or o in suns:
            continue
        if o.data.type != 'POINT' or 'lightFor' not in o.keys() or 'kind' not in o.keys():
            probs.append(f"light {o.name} is a {o.data.type} light "
                         f"{'without lightFor and kind' if 'lightFor' not in o.keys() or 'kind' not in o.keys() else ''}; "
                         f"every light but SUN is a practical, a Point light carrying lightFor and kind")
            continue
        src, kind = str(o['lightFor']), str(o['kind'])
        kinds[kind] = kinds.get(kind, 0) + 1
        if kind not in lighting.PRACTICAL:
            probs.append(f"{o.name} has kind {kind}, not one of {', '.join(lighting.PRACTICAL)}")
        if src in want:
            if src not in have:
                continue  # (d) names it
            box = tree_bounds(have[src])
        else:
            box = boxes.get(src)
        if box is None:
            probs.append(f"{o.name} lights {src}, which is neither a blueprint piece nor a brazier")
            continue
        p = to_game(o.matrix_world.translation)
        if not all(box['min'][k] - SOURCE_GROW <= p[i] <= box['max'][k] + SOURCE_GROW for i, k in enumerate('xyz')):
            probs.append(f"{o.name} at game {g(round(c, 3) for c in p)} is outside {src}'s box grown by {SOURCE_GROW} m")
    if probs:
        report(7, 'light', False, '; '.join(probs))
    else:
        n = sum(kinds.values())
        report(7, 'light', True, f"{world.name} from {fname}, clamp {clamp:g}; {sun_text}; {n} practicals ("
               + ', '.join(f"{kinds[k]} {k}" for k in lighting.PRACTICAL if k in kinds)
               + f"); {len(want)} braziers at the blueprint's positions")
else:
    skipped(7, 'light', 'lighting was not built')

# ---------------------------------------------------------------- 8: cameras --
# One CAM_<name> per blueprint camera and no other CAM_*; each within 0.01 m of
# its eye and 0.1 degrees of its aim, its lens (or vertical angle) the file's;
# each camera's blueprint stand not null, reachable, and its eye 1.7 over it
# within 0.01 m; scene.camera CAM_spawn (#875, #876). Where a player can stand
# is export-blueprint.mjs's answer from the plan's own standAt and walkability;
# this line reads it and never re-derives it (#500).
AIM_TOLERANCE = 0.1          # degrees
if 'lighting' in stages:
    import math
    from mathutils import Vector
    probs = []
    rows = bp.get('cameras') or []
    names = {f"CAM_{c['name']}" for c in rows}
    for o in bpy.data.objects:
        if o.name.startswith('CAM_') and o.name not in names:
            probs.append(f"{o.name} is not a blueprint camera")
    on = {}
    for c in rows:
        o = bpy.data.objects.get(f"CAM_{c['name']}")
        s = c.get('stand')
        if s is None:
            probs.append(f"camera {c['name']} at game {g(c['eye'])} has no floor a player stands on within "
                         f"{c['stepUp']:g} m of feet {c['feet']:.1f}")
        elif not c.get('reachable'):
            probs.append(f"camera {c['name']} at game {g(c['eye'])} stands on {s['surface']} (level {s['level']}) at "
                         f"{s['h']:.2f}, which the spawn does not reach")
        elif abs(c['eye'][1] - s['h'] - c['eyeHeight']) > PLACE_TOLERANCE:
            probs.append(f"camera {c['name']}'s eye is {c['eye'][1] - s['h']:.3f} m over {s['surface']}, "
                         f"not {c['eyeHeight']:g}")
        else:
            on[s['surface']] = on.get(s['surface'], 0) + 1
        if o is None:
            probs.append(f"CAM_{c['name']} missing; the blueprint has camera {c['name']} at game {g(c['eye'])}")
            continue
        if o.type != 'CAMERA':
            probs.append(f"{o.name} is a {o.type}, not a camera")
            continue
        e, t = Vector(common.to_blender(c['eye'])), Vector(common.to_blender(c['target']))
        dist = (o.matrix_world.translation - e).length
        if dist > PLACE_TOLERANCE:
            probs.append(f"{o.name} is {dist:.3f} m from its blueprint eye {g(c['eye'])}")
        look = (o.matrix_world.to_3x3() @ Vector((0.0, 0.0, -1.0))).normalized()
        aim = math.degrees(math.acos(max(-1.0, min(1.0, look.dot((t - e).normalized())))))
        if aim > AIM_TOLERANCE:
            probs.append(f"{o.name} aims {aim:.2f} deg off its blueprint target {g(c['target'])}")
        if c.get('fovY') is not None:
            if o.data.sensor_fit != 'VERTICAL' or abs(math.degrees(o.data.angle_y) - c['fovY']) > 1e-3:
                probs.append(f"{o.name} is {o.data.sensor_fit} at {math.degrees(o.data.angle_y):.3f} deg vertical, "
                             f"not VERTICAL at {c['fovY']:g}")
        elif abs(o.data.lens - c['lens']) > 1e-3:
            probs.append(f"{o.name} has a {o.data.lens:g} mm lens, not {c['lens']:g}")
    if scene.camera is None or scene.camera.name != 'CAM_spawn':
        probs.append(f"the scene camera is {scene.camera.name if scene.camera else 'none'}, not CAM_spawn")
    if probs:
        report(8, 'cameras', False, '; '.join(probs))
    else:
        report(8, 'cameras', True, f"{len(rows)} cameras ({', '.join(c['name'] for c in rows)}), each at its blueprint "
               f"eye and aim, each on a floor the spawn reaches ("
               + ', '.join(f"{k} x{n}" for k, n in on.items()) + f"); scene camera {scene.camera.name}")
else:
    skipped(8, 'cameras', 'lighting was not built')

# ---------------------------------------------------------------- 9: markers --
# One COL_ per collider; a STAIR_ and both ends per ramp; SPAWN with the
# blueprint's lookAt and its -Z on it within TURN_TOLERANCE; an EVID_, READ_
# and BELL_ per carrying piece with its planId; COL_ and STAIR_ unrotated;
# every object in MARKERS a marker (a name the blueprint gives, carrying
# `marker`) and hidden from render; no marker-named object outside MARKERS
# (#843, #894, #895). Rooms, gates and hinges are lines 1 and 2's.
if 'markers' in stages:
    probs = []
    for name, e in expect.items():
        k = e['kind']
        if k not in ('collider', 'stair', 'stair-low', 'stair-high', 'spawn', 'evidence', 'read', 'bell'):
            continue
        ob = obj(name)
        if ob is None:
            what = {'collider': 'collider', 'stair': 'ramp', 'stair-low': 'ramp', 'stair-high': 'ramp',
                    'spawn': 'spawn', 'evidence': 'evidence', 'read': 'read', 'bell': 'bell on'}[k]
            probs.append(f"{name} missing; the blueprint has {what} {e['id']}")
            continue
        idk = {'collider': 'colliderId', 'stair': 'rampId', 'stair-low': 'rampId', 'stair-high': 'rampId',
               'evidence': 'evidenceId', 'read': 'readId'}.get(k)
        if idk and ob.get(idk) != e['id']:
            probs.append(f"{name}'s {idk} is {ob.get(idk)}, not {e['id']}")
        if 'planId' in e and ob.get('planId') != e['planId']:
            probs.append(f"{name}'s planId is {ob.get('planId')}, not {e['planId']}")
        if k in ('collider', 'stair') and ob.matrix_world.to_quaternion().angle > 1e-6:
            probs.append(f"{name} is turned; a COL_ or STAIR_ box is never rotated")
    sp = obj('SPAWN')
    look = tuple(bp['spawn']['lookAt'])
    if sp is not None:
        have = tuple(sp['lookAt']) if 'lookAt' in sp.keys() else None
        if have is None or any(abs(a - b) > 1e-9 for a, b in zip(have, look)):
            probs.append(f"SPAWN's lookAt is {have}, not the blueprint's {g(look)}")
        fwd = (sp.matrix_world.to_3x3() @ Vector((0.0, 0.0, -1.0))).normalized()
        to = (Vector(common.to_blender(look)) - sp.matrix_world.translation).normalized()
        off = math.degrees(math.acos(max(-1.0, min(1.0, fwd.dot(to)))))
        if off > TURN_TOLERANCE:
            probs.append(f"SPAWN aims {off:.2f} deg off {g(look)}")
    for ob in sorted(in_markers, key=lambda o: o.name):
        if ob.name not in expect or 'marker' not in ob.keys():
            probs.append(f"{ob.name} in MARKERS is no marker")
        elif not ob.hide_render:
            probs.append(f"{ob.name} renders; every marker is hidden from render (#843)")
    for ob in bpy.data.objects:
        if ob not in in_markers and is_marker_name(ob.name):
            probs.append(f"{ob.name} is named as a marker and is outside MARKERS")
    # #894's deferred clause (#898 call 8): when props ran, each PROP_<id>
    # carries noCollide equal to its blueprint piece's. A piece props does not
    # draw (the backdrops) has no PROP_, and line 6 names a missing one.
    nc_text = ''
    if 'props' in stages:
        nc_bad, nc_seen, nc_true = [], 0, 0
        for p in bp['pieces']:
            ob = obj(f"PROP_{p['id']}")
            if ob is None:
                continue
            nc_seen += 1
            want_nc = bool(p.get('noCollide'))
            nc_true += want_nc
            have_nc = bool(ob['noCollide']) if 'noCollide' in ob.keys() else None
            if have_nc is not want_nc:
                nc_bad.append((ob.name, have_nc, want_nc))
        if nc_bad:
            name0, have0, want0 = nc_bad[0]
            probs.append(f"{len(nc_bad)} of {nc_seen} PROP_ carry a noCollide other than their blueprint piece's; first "
                         f"{name0}, {'missing' if have0 is None else have0} against the blueprint's {want0}")
        nc_text = f"; {nc_seen} PROP_ carrying their blueprint noCollide ({nc_true} true)"
    if probs:
        report(9, 'markers', False, '; '.join(probs[:12]) + (' ...' if len(probs) > 12 else ''))
    else:
        n = {}
        for ob in in_markers:
            n[ob['marker']] = n.get(ob['marker'], 0) + 1
        report(9, 'markers', True, f"{len(in_markers)} in MARKERS ({n.get('room', 0)} ROOM_, {n.get('collider', 0)} COL_, "
               f"{n.get('stair', 0)} STAIR_ and {n.get('stair-low', 0) + n.get('stair-high', 0)} ends, "
               f"{n.get('gate', 0)} GATE_, {n.get('hinge', 0)} hinges, SPAWN, {n.get('evidence', 0)} EVID_, "
               f"{n.get('read', 0)} READ_, {n.get('bell', 0)} BELL_), none renders, SPAWN aimed at {g(look)}"
               + nc_text)
else:
    skipped(9, 'markers', 'markers was not built')

print(f"check: stages {', '.join(stages)}; " +(f"FAILED line(s) {', '.join(map(str, failed))}" if failed else 'every line that ran passed'))
sys.stdout.flush()
if failed:
    sys.exit(1)
