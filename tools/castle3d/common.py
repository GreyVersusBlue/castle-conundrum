# common.py - what every castle3d stage shares (#840, #843).
#
# The pin, the empty scene, the frame conversion, the collections, the seed and
# STAGE_OF, the table that gives every blueprint piece to exactly one stage.
# Imported first by build.py and check.py, so the pin runs before anything else.

import os
import sys
import re
import json
import random

import bpy

# ------------------------------------------------------------------- the pin --
# Moving it is a HISTORY entry (#840). Exits 3, not 1, so a wrong Blender reads
# differently from a Python exception under --python-exit-code 1.
if bpy.app.version[:2] != (5, 2):
    print(f"castle3d: Blender {bpy.app.version_string} is not 5.2; this family is pinned to 5.2 (#840)")
    sys.stdout.flush()
    sys.exit(3)

# ------------------------------------------------------------------ the order --
# Fixed. A stage may read what an earlier one built. `guide` always runs first.
STAGES = ['guide', 'terrain', 'walls', 'towers', 'gates', 'buildings', 'town', 'props', 'lighting', 'markers']
# The stages whose objects realise blueprint pieces, which check.py line 6 covers.
GEOMETRY = ['terrain', 'walls', 'towers', 'gates', 'buildings', 'town', 'props']
# The terrain stage's height field, which check.py line 5 measures (#844).
TERRAIN = 'TERRAIN_ground'
# The module each stage is built by (increment 0 ships only blueprint.py).
MODULE = {'guide': 'blueprint', 'terrain': 'terrain', 'walls': 'walls', 'towers': 'towers', 'gates': 'gates',
          'buildings': 'buildings', 'town': 'town', 'props': 'props', 'lighting': 'lighting', 'markers': 'markers'}


def args_after_dashes():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(argv, name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


def load_blueprint(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ------------------------------------------------------------------ the cache --
# The output folder, set by build.py before the first stage runs, so a stage
# finds <OUT>/cache/. None until then, and cached() refuses to guess.
OUT = None
HERE = os.path.dirname(os.path.abspath(__file__))
_SOURCES = None


def sources():
    """sources.json's rows by id. json.load takes either line ending (#632)."""
    global _SOURCES
    if _SOURCES is None:
        with open(os.path.join(HERE, 'sources.json'), 'r', encoding='utf-8') as f:
            _SOURCES = {row['id']: row for row in json.load(f)}
    return _SOURCES


def source(row_id):
    rows = sources()
    if row_id not in rows:
        raise KeyError(f"sources.json has no row {row_id}")
    return rows[row_id]


def cached(row):
    """<OUT>/cache/<asset>/<file>: fetch.mjs's cachePath in one line. If the two
    drift, the path is not a file and whoever opens it raises naming it."""
    if OUT is None:
        raise RuntimeError('common.cached: common.OUT is not set; build.py sets it before the first stage')
    return os.path.join(OUT, 'cache', row['asset'], *row['file'].split('/'))


def source_path(row):
    """A `path` row (the props .blend) where it stands, resolved against the
    output folder: fetch.mjs's path.resolve(outDir, ...row.path.split('/')) in
    one line (#867). The hash is the fetch's; this only finds the file."""
    if OUT is None:
        raise RuntimeError('common.source_path: common.OUT is not set; build.py sets it before the first stage')
    return os.path.normpath(os.path.join(OUT, *row['path'].split('/')))


# ------------------------------------------------------------------ the scene --
def empty_scene():
    """Factory settings with nothing in them, metric at scale 1."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    us = scene.unit_settings
    us.system = 'METRIC'
    us.scale_length = 1.0
    us.length_unit = 'METERS'
    return scene


def collection(name, hide_render=False):
    """The one collection a stage (or GUIDE, or MARKERS) writes into."""
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    col.hide_render = hide_render
    return col


def stage_collection(stage):
    if stage == 'guide':
        return collection('GUIDE', hide_render=True)
    if stage == 'markers':
        return collection('MARKERS', hide_render=True)
    return collection(stage.upper())


def seed(stage):
    """Seeded per stage, so a stage lays out the same whichever others ran (#840).
    random.seed on a str hashes it with sha512, independent of PYTHONHASHSEED."""
    random.seed(stage)


# ------------------------------------------------------------------ the frame --
# Game (x, y, z), Y-up, is Blender (x, -z, y), Z-up. A game rotationY is the
# same angle about Blender Z, same sign (#843).
def to_blender(p):
    x, y, z = p
    return (x, -z, y)


def rotation_z(rotation_y_degrees):
    import math
    return math.radians(rotation_y_degrees)


def box_to_blender(box):
    """A game box {min{x,y,z}, max{x,y,z}} as Blender (min, max) corners."""
    mn, mx = box['min'], box['max']
    return ((mn['x'], -mx['z'], mn['y']), (mx['x'], -mn['z'], mx['y']))


# -------------------------------------------------------------- the stage table --
# Every blueprint piece belongs to exactly one geometry stage, by kind and id
# prefix, first rule that matches. A piece no rule takes is an error, named, so
# a new kind in the plan cannot fall through silently. `--only guide` prints it.
#
#   gates      the leaves, the arches, the cell bars and the Stockhouse walk bar
#   props      every interior prop and built prop (Poly Haven, Devon's, slabs)
#   town       Mereford, the town wall and trees, Wykes's yard
#   terrain    the ground patches that are not a room's floor
#   buildings  the ground rooms' floors
#   towers     the eight drums, their eighteen flights and their floors
#   walls      the curtain, the cross-wall, the gate-over runs, their walks, merlons
#   buildings  every other run and floor, the hall's trusses and roof
#   props      the rest of the kit decor
STAGE_RULES = [
    ('gates', {'gate-leaf', 'gate-arch', 'fixture'}, None),
    ('gates', {'prop'}, r'^walk-bar$'),
    ('props', {'prop'}, None),
    ('town', None, r'^(mereford-|town-|wykes-|floor-wykes-yard$)'),
    ('terrain', {'ground'}, r'^(?!floor-)'),
    ('buildings', {'ground'}, None),
    ('towers', {'tower', 'stair'}, None),
    ('towers', {'floor'}, r'^floor-(.*-tower-(\d+|roof)|chaplain-chamber|stockhouse-walk)$'),
    ('walls', {'wall', 'floor'}, r'^(north-curtain|south-curtain|west-curtain|east-curtain|cross-wall|barbican-|garden-|west-gate-over|east-gate-over|porter-gate-over)'),
    ('walls', {'decor'}, r'^merlon-\d+$'),
    ('buildings', {'wall', 'floor'}, None),
    ('buildings', {'decor'}, r'^hall-(truss|roof)-\d+$'),
    ('props', {'decor'}, None),
]


def stage_of(piece):
    for stage, kinds, pattern in STAGE_RULES:
        if kinds is not None and piece['kind'] not in kinds:
            continue
        if pattern is not None and not re.search(pattern, piece['id']):
            continue
        return stage
    raise ValueError(f"STAGE_OF: no stage takes piece {piece['id']} of kind {piece['kind']}")


def STAGE_OF(blueprint):
    """{piece id: stage} for every blueprint piece; raises on a piece no rule takes."""
    return {p['id']: stage_of(p) for p in blueprint['pieces']}


def print_stage_table(blueprint):
    table = STAGE_OF(blueprint)
    by = {}
    for p in blueprint['pieces']:
        by.setdefault(table[p['id']], {}).setdefault(p['kind'], 0)
        by[table[p['id']]][p['kind']] += 1
    print('STAGE_OF:')
    for stage in GEOMETRY:
        kinds = by.get(stage, {})
        total = sum(kinds.values())
        detail = ', '.join(f"{n} {k}" for k, n in sorted(kinds.items()))
        print(f"  {stage:10s} {total:4d}  {detail}")
    print(f"  {'total':10s} {len(table):4d}")
