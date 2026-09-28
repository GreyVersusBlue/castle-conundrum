# check.py - the net over a saved castle3d file (#844).
#
#   blender -b <saved .blend> --factory-startup --python-exit-code 1
#           --python tools/castle3d/check.py -- --blueprint <file>
#
# Runs in a second Blender that opened the saved file, not in the one that
# built it: the builder can see an image it loaded but never saved with a path
# that resolves, and the saved file is what export and Devon open.
#
# Six lines. Each prints its own line, `ok`, `FAIL` or `--` (did not run), and
# why. A line runs when the stage it checks is in scene["castle3d_stages"];
# a line that did not run says so and passes nothing. A line whose stage ran
# but whose body is not written yet FAILS, so a stage cannot ship ahead of its
# net. Exits 1 when any line failed (#13).
#
#   1 rooms     (markers)   every mystery and blueprint room has one ROOM_
#   2 gates     (markers)   every gate a GATE_, a _HINGE where it has a pivot
#   3 where     (markers)   each ROOM_ within 0.5 m of its box, allow.json aside
#   4 images    (always)    every Image Texture node resolves and loads   LIVE
#   5 ground    (terrain)   level-0 room corners and centres at 0 +- 0.02 m  LIVE
#   6 coverage  (geometry)  each piece of a stage that ran is named by a      LIVE
#                           planId or planIds outside GUIDE and MARKERS
# Lines 1, 2 and 3 are frames until increment 8 builds the markers. Lines 5
# and 6 are live from increment 1, whose terrain is the first geometry stage.

import os
import sys
import json

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


# ------------------------------------------------------------ 1, 2, 3: markers --
for n, name in ((1, 'rooms'), (2, 'gates'), (3, 'where the rooms are')):
    if 'markers' in stages:
        not_written(n, name, 'markers')
    else:
        skipped(n, name, 'markers was not built')


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
ran = [s for s in common.GEOMETRY if s in stages]
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
    unreasoned = sorted(k for k, v in allow.items() if not k.startswith('ROOM_') and not (isinstance(v, str) and v.strip()))
    want = [pid for pid, s in table.items() if s in ran]
    missing = [pid for pid in want if pid not in named and pid not in allow]
    unknown = sorted(f"{i} (on {o})" for i, o in named.items() if i not in table)
    why = []
    if missing:
        why.append(f"{len(missing)} piece(s) nothing realises: {', '.join(missing[:12])}" + (' ...' if len(missing) > 12 else ''))
    if unknown:
        why.append(f"object(s) name ids the blueprint lacks: {', '.join(unknown[:12])}")
    if unreasoned:
        why.append(f"allow.json entries with no reason: {', '.join(unreasoned)}")
    if why:
        report(6, 'coverage', False, '; '.join(why))
    else:
        report(6, 'coverage', True, f"{len(want)} pieces of {', '.join(ran)} each named by a planId or planIds")
else:
    skipped(6, 'coverage', 'no geometry stage was built')

print(f"check: stages {', '.join(stages)}; " + (f"FAILED line(s) {', '.join(map(str, failed))}" if failed else 'every line that ran passed'))
sys.stdout.flush()
if failed:
    sys.exit(1)
