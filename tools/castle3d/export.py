# export.py - increment 9 (#897, #898): castle.glb and markers.json from the master.
#
#   blender -b <out>/castle.blend --factory-startup --python-exit-code 1
#           --python tools/castle3d/export.py -- --out <out> --blueprint <file>
#
# A third Blender, after check.py passed the saved master, on a full build or
# `--export-only`. Not a stage: a stage runs before the save and before
# check.py, so a glb written there would come from a file no check had passed.
# It opens the master and never saves it; castle.blend is build.py's (#897).
#
#   castle.glb    Blender's glTF exporter, call 2's options: Draco off, images
#                 embedded (AUTO keeps a cached JPEG byte for byte), renderable
#                 objects only, which is the whole exclusion of GUIDE and
#                 MARKERS (both hide_render), modifiers applied, custom
#                 properties as extras (planId, planIds, noCollide), no camera,
#                 light or animation, Y-up, so the glb is in the game's frame.
#                 Written to castle.part.glb and moved onto castle.glb, so a
#                 failed export leaves no half file. Not castle.glb.part, which
#                 call 2 wrote: 5.2.2's exporter appends .glb to any path not
#                 ending .glb or .gltf (ensure_filepath_matches_export_format).
#   markers.json  MARKERS read back from matrix_world through common.to_game,
#                 never copied from the blueprint (#839, #898 call 6): the
#                 game's frame and the blueprint's shape, each list in
#                 blueprint order, every float to 4 decimals, indent 1, LF.
#
# Prints each file's bytes and sha256, which `--export-only` twice must repeat
# exactly (#897 call 3). check-export.mjs holds both files afterwards.

import os
import sys
import json
import math
import hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # no __pycache__ in the repo; .gitignore stays as it is
sys.path.insert(0, HERE)

import bpy

import common  # the pin

argv = common.args_after_dashes()
out = common.arg(argv, '--out')
bp_path = common.arg(argv, '--blueprint')
if not out or not bp_path:
    raise SystemExit('export.py: needs -- --out <dir> --blueprint <file>')

scene = bpy.context.scene
stages = (scene.get('castle3d_stages') or '').split(',')
if stages != common.STAGES:
    raise RuntimeError(f"export.py: {bpy.data.filepath} was built with stages {','.join(stages) or '(none)'}, not the "
                       f"full build; export runs over the master only (#897)")
if os.path.normcase(os.path.abspath(bpy.data.filepath)) != os.path.normcase(os.path.abspath(os.path.join(out, 'castle.blend'))):
    raise RuntimeError(f"export.py: opened {bpy.data.filepath}, not {os.path.join(out, 'castle.blend')}")

bp = common.load_blueprint(bp_path)
with open(bp_path, 'rb') as f:
    bp_sha = hashlib.sha256(f.read()).hexdigest()
with open(os.path.join(HERE, 'allow.json'), 'r', encoding='utf-8') as f:
    allow = json.load(f)


def sha_and_bytes(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 22), b''):
            h.update(block)
    return os.path.getsize(path), h.hexdigest()


# ------------------------------------------------------------------- the glb --
glb = os.path.join(out, 'castle.glb')
part = os.path.join(out, 'castle.part.glb')
if os.path.exists(part):
    os.remove(part)
bpy.ops.export_scene.gltf(
    filepath=part,
    export_format='GLB',
    export_draco_mesh_compression_enable=False,
    export_image_format='AUTO',
    use_renderable=True,
    export_apply=True,
    export_extras=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    export_yup=True,
)
if not os.path.isfile(part):
    raise RuntimeError(f"export.py: the glTF exporter returned and wrote no {part}")
os.replace(part, glb)


# -------------------------------------------------------------- markers.json --
def r4(v):
    """4 decimals, and never -0.0, so the file is byte-stable (#898 call 6)."""
    return round(float(v), 4) + 0.0


def at(v):
    return [r4(c) for c in common.to_game(v)]


def prop(ob, k):
    """A custom property as plain JSON, null when the object lacks it."""
    if k not in ob.keys():
        return None
    v = ob[k]
    if hasattr(v, 'to_dict'):
        return v.to_dict()
    if hasattr(v, 'to_list'):
        v = v.to_list()
    if isinstance(v, bool) or isinstance(v, (int, str)):
        return v
    if isinstance(v, float):
        return r4(v)
    return [r4(x) if isinstance(x, float) else x for x in v]


def game_box(points):
    gs = [common.to_game(p) for p in points]
    return {'min': {k: r4(min(p[i] for p in gs)) for i, k in enumerate('xyz')},
            'max': {k: r4(max(p[i] for p in gs)) for i, k in enumerate('xyz')}}


def empty_box(ob):
    """A CUBE empty's world box, location +- its scale (markers.py's COL_ and STAIR_)."""
    t = ob.matrix_world.translation
    s = ob.matrix_world.to_scale() * ob.empty_display_size
    return game_box([t - s, t + s])


def turn(ob):
    """World Z in degrees, modulo 360: a game rotationY (#843)."""
    m = ob.matrix_world.to_3x3()
    deg = r4(math.degrees(math.atan2(m[1][0], m[0][0])) % 360)
    return deg - 360 if deg >= 360 else deg


mcol = bpy.data.collections.get('MARKERS')
if mcol is None:
    raise RuntimeError(f"export.py: {bpy.data.filepath} has no MARKERS collection")
kind = {}
for ob in mcol.all_objects:
    kind.setdefault(ob.get('marker'), []).append(ob)


def ordered(k, key, order):
    """MARKERS' objects of kind k in the blueprint's order of `order`, by the
    id the object carries; one the blueprint lacks goes last, by name."""
    idx = {v: i for i, v in enumerate(order)}
    return sorted(kind.get(k, []), key=lambda o: (idx.get(key(o), len(idx)), o.name))


rooms = []
for ob in ordered('room', lambda o: o.get('roomId'),
                  [r['id'] for r in bp['rooms']] + [o['id'] for o in bp['openRooms']['rooms']]):
    box = game_box([ob.matrix_world @ v.co for v in ob.data.vertices])
    shape = None
    if prop(ob, 'shape') == 'disc':
        shape = {'kind': 'disc', 'cx': r4((box['min']['x'] + box['max']['x']) / 2),
                 'cz': r4((box['min']['z'] + box['max']['z']) / 2), 'radius': r4((box['max']['x'] - box['min']['x']) / 2)}
    rooms.append({'id': prop(ob, 'roomId'), 'level': prop(ob, 'level'), 'ward': prop(ob, 'ward'),
                  'drum': prop(ob, 'drum'), 'open': prop(ob, 'open'), 'top': box['min']['y'],
                  'bounds': {'min': {'x': box['min']['x'], 'z': box['min']['z']},
                             'max': {'x': box['max']['x'], 'z': box['max']['z']}},
                  'shape': shape})

colliders = [{'id': prop(ob, 'colliderId'), 'box': empty_box(ob)}
             for ob in ordered('collider', lambda o: o.get('colliderId'), [c['id'] for c in bp['colliders']])]

hinges = {o.get('gateId'): o for o in kind.get('hinge', [])}
gates = []
for ob in ordered('gate', lambda o: o.get('gateId'), [g['id'] for g in bp['gates']]):
    gid = prop(ob, 'gateId')
    h = hinges.get(gid)
    row = {'id': gid, 'at': prop(ob, 'at'), 'position': at(ob.matrix_world.translation)}
    for k in ('closed', 'shutAngle', 'openAngle', 'bar', 'blocks', 'quest', 'lock', 'evidence'):
        row[k] = prop(ob, k)
    row['pivot'] = None if h is None else {'position': at(h.matrix_world.translation), 'rotationY': turn(h)}
    gates.append(row)

ends = {}
for k in ('stair-low', 'stair-high'):
    for o in kind.get(k, []):
        ends[(o.get('rampId'), k)] = o
ramps = []
for ob in ordered('stair', lambda o: o.get('rampId'), [r['id'] for r in bp['ramps']]):
    rid = prop(ob, 'rampId')
    slope = {}
    for end, k in (('from', 'stair-low'), ('to', 'stair-high')):
        e = ends.get((rid, k))
        if e is None:
            slope[end] = None
        else:
            x, y, z = at(e.matrix_world.translation)
            slope[end] = [x, z, y]  # [x, z, y], as the plan writes it
    ramps.append({'id': rid, 'level': prop(ob, 'level'), 'drum': prop(ob, 'drum'), 'box': empty_box(ob), 'slope': slope})

sp = bpy.data.objects.get('SPAWN')
spawn = None if sp is None or sp not in kind.get('spawn', []) else {
    'position': at(sp.matrix_world.translation), 'lookAt': prop(sp, 'lookAt'), 'level': prop(sp, 'level')}


def carried(k, id_key, order):
    return [{'id': prop(ob, id_key), 'planId': prop(ob, 'planId'), 'level': prop(ob, 'level'),
             'position': at(ob.matrix_world.translation)}
            for ob in ordered(k, lambda o: o.get(id_key), order)]


evidence = carried('evidence', 'evidenceId', [p['evidence'] for p in bp['pieces'] if p.get('evidence') is not None])
read = carried('read', 'readId', [p['read'] for p in bp['pieces'] if p.get('read') is not None])
bells = carried('bell', 'planId', [p['id'] for p in bp['pieces'] if p.get('bell') is True])

doc = {
    'comment': "castle3d's markers, read back from castle.blend's MARKERS by export.py, never copied from the "
               "blueprint (#839, #898). Each list in blueprint order; floats to 4 decimals.",
    'frame': 'game: metres, Y-up (#843)',
    'built': stages,
    'blueprintSha256': bp_sha,
    'rooms': rooms,
    'colliders': colliders,
    'gates': gates,
    'ramps': ramps,
    'spawn': spawn,
    'evidence': evidence,
    'read': read,
    'bells': bells,
    'allowed': {k: v for k, v in allow.items() if k.startswith(common.MARKER_PREFIXES)},
}
mj = os.path.join(out, 'markers.json')
mj_part = mj + '.part'
with open(mj_part, 'w', encoding='utf-8', newline='\n') as f:
    f.write(json.dumps(doc, indent=1) + '\n')
os.replace(mj_part, mj)

for path in (glb, mj):
    n, sha = sha_and_bytes(path)
    print(f"export: {os.path.basename(path)} {n} bytes, sha256 {sha}")
sys.stdout.flush()
