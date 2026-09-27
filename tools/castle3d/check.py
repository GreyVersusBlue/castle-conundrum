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
#   5 ground    (terrain)   level-0 room corners and centres at 0 +- 0.02 m
#   6 coverage  (geometry)  each piece of a stage that ran is named by a
#                           planId or planIds outside GUIDE and MARKERS
# Lines 1, 2, 3, 5 and 6 are frames in increment 0; their bodies land with
# the increments that build their stages.

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
if 'terrain' in stages:
    not_written(5, 'level ground', 'terrain')
else:
    skipped(5, 'level ground', 'terrain was not built')

# --------------------------------------------------------------- 6: coverage --
ran = [s for s in common.GEOMETRY if s in stages]
if ran:
    not_written(6, 'coverage', ', '.join(ran))
else:
    skipped(6, 'coverage', 'no geometry stage was built')

print(f"check: stages {', '.join(stages)}; " + (f"FAILED line(s) {', '.join(map(str, failed))}" if failed else 'every line that ran passed'))
sys.stdout.flush()
if failed:
    sys.exit(1)
