# check.py - the net over a saved castle3d file (#844).
#
#   blender -b <saved .blend> --factory-startup --python-exit-code 1
#           --python tools/castle3d/check.py -- --blueprint <file>
#
# Runs in a second Blender that opened the saved file, not in the one that
# built it: the builder can see an image it loaded but never saved with a path
# that resolves, and the saved file is what export and Devon open.
#
# Eight lines (#844, amended to eight by #876). Each prints its own line, `ok`, `FAIL` or `--` (did not run), and
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
#   7 light     (lighting)  one clamped HDRI World, SUN on the file's sun,    LIVE
#                           each practical in its source, each BRAZIER_ placed
#   8 cameras   (lighting)  one CAM_ per blueprint camera at its eye and aim, LIVE
#                           each on a floor the spawn reaches; CAM_spawn is the scene's
# Lines 1, 2 and 3 are frames until increment 8 builds the markers. Lines 5
# and 6 are live from increment 1, whose terrain is the first geometry stage;
# 7 and 8 from increment 7 (#876).

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


def g(v):
    """A game point, printed as the spec writes it."""
    return '(' + ', '.join(f"{float(c):g}" for c in v) + ')'


def to_game(v):
    return (v[0], v[2], -v[1])


def tree_bounds(root):
    """A root and its descendants' meshes' world bounds, as a game box."""
    from mathutils import Vector
    pts = []
    for o in [root] + list(root.children_recursive):
        if o.type == 'MESH':
            pts += [to_game(o.matrix_world @ Vector(c)) for c in o.bound_box]
    if not pts:
        return None
    return {'min': {k: min(p[i] for p in pts) for i, k in enumerate('xyz')},
            'max': {k: max(p[i] for p in pts) for i, k in enumerate('xyz')}}


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

print(f"check: stages {', '.join(stages)}; " + (f"FAILED line(s) {', '.join(map(str, failed))}" if failed else 'every line that ran passed'))
sys.stdout.flush()
if failed:
    sys.exit(1)
