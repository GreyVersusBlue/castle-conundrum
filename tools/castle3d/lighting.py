# lighting.py - the lighting stage: the World, the sun, the practicals, the
# game's three braziers and the five cameras (increment 7, #870 to #874).
#
# Realises no plan piece, so check.py line 6 never covers it and nothing here
# carries a planId; check.py lines 7 (light) and 8 (cameras) do (#873). It
# reads the blueprint (its `braziers` and `cameras`, which export-blueprint.mjs
# writes), the HDRI row, the pinned props .blend for the braziers and, when
# props ran in the same build, the PROP_ trees' flame faces. It moves no object
# another stage made, so `--only lighting` builds alone: the World, the sun, the
# three braziers and their three lights, the five cameras.
#
# THE WORLD (#870). The only World, WORLD_hdri, is made here and nowhere else:
# the HDRI unrotated at strength 1, every channel clamped at SUN_CLAMP for every
# ray but the camera's. The file's sun is unclipped and is 69% of the map's
# horizontal irradiance, so without the clamp SUN would light it all twice.
#
# THE SUN (#870). One Sun lamp carrying exactly what the clamp removes: the
# energy-weighted centroid of the file's disc for its direction, the removed
# (4.4212, 4.4553, 4.0524) for its strength and colour. check.py line 7
# measures both again from the saved image, so a drift here is named there.
#
# THE PRACTICALS (#871). A Point light wherever the model draws a flame, found
# by a rule over faces and never by a table of piece ids: a Devon face on
# MAT_flame (props.EMIT's regions) or a face on Poly Haven's
# brass_candleholders_flame. Per source (a PROP_ or BRAZIER_ tree): with coals,
# one light at the area-weighted centroid of its coals and ember raised
# COAL_RAISE, `brazier` with ember and `hearth` without; otherwise one per
# vertex-connected flame cluster, clusters of one source merged within MERGE,
# `torch` at TORCH_AREA or more and `candle` under.
#
# THE BRAZIERS (#871). scene-config.json's, through the blueprint, each Devon's
# `brazier` by props.devon_trees at its position, rotation 0, scale 1. A
# brazier whose box meets a piece's raises unless BRAZIER_CLASH names it, and a
# BRAZIER_CLASH entry that meets nothing raises too.
#
# THE CAMERAS (#872). The blueprint's five, each CAM_<name> at its eye aimed at
# its target, with its lens or vertical field of view, `exposure` and `samples`
# as custom properties. scene.camera is CAM_spawn.

import math

import bpy
from mathutils import Matrix, Vector

import common
import materials

HDRI = 'kloofendal_48d_partly_cloudy_puresky:hdri'
SUN_CLAMP = 16.0                          # #870: takes the disc and nothing else (15.25 is the brightest pixel 5 degrees out)
SUN_STRENGTH = 4.4553                     # #870: the clamp's removal, green channel
SUN_COLOUR = (0.9924, 1.0, 0.9096)        # #870: the removal per channel over green; luminance x strength 4.4190
SUN_ANGLE = 0.53                          # #870: degrees, the real sun's; 96.7% of the removal lies within 0.5 degrees
SUN_ROTATION = (42.129, 0.0, 55.740)      # #870: Blender degrees; +Z at Blender (0.55441, -0.37763, 0.74164)
LUX_PER_UNIT = 20000.0                    # #871: the file's 4.42 units of sun against about 88,000 lux
PRACTICAL_GAIN = 32.0                     # #871: firelight equal to daylight in the two rooms with both
PRACTICAL = {                             # #871: kind -> (lumens, shadow_soft_size m, temperature K)
    'candle': (12.0, 0.01, 1850.0),
    'torch': (200.0, 0.04, 1900.0),
    'brazier': (2500.0, 0.15, 1900.0),
    'hearth': (150.0, 0.25, 1700.0),
}
TORCH_AREA = 0.01                         # #871: m2; a cluster this large or larger is a torch
MERGE = 0.06                              # #871: m; two clusters of one source this close are one flame
COAL_RAISE = 0.05                         # #871: m over the coals' centroid
PH_FLAME = 'brass_candleholders_flame'    # #871: Poly Haven's flame material, emissive as shipped (#864)
BRAZIER_STEM = 'brazier'                  # #871: Devon's collection in the pinned props .blend
BRAZIER_CLASH = {'brazier-3': "#871: the game's own placement"}
CLIP = (0.05, 2000.0)                     # #872


def game(v):
    """Blender (x, y, z) as game (x, y, z)."""
    return (v[0], v[2], -v[1])


# ------------------------------------------------------------ line 4 share --
class Snapshot:
    """What this stage adds to check.py line 4: Image and Environment Texture
    nodes in materials, worlds and node groups new since the stage began, and
    the new images they read (#868's split, measured, not predicted)."""

    def __init__(self):
        self.ids = set(bpy.data.materials) | set(bpy.data.worlds) | set(bpy.data.node_groups)
        self.images = set(bpy.data.images)

    def split(self):
        kinds = {v[5] for v in materials.PROP_KINDS.values()}

        def label(owner):
            if isinstance(owner, bpy.types.World):
                return owner.name
            if isinstance(owner, bpy.types.NodeTree):
                return 'node groups'
            if owner.name == 'MAT_flame':
                return 'MAT_flame'
            if owner.name in kinds:
                return 'MAT_*_prop and _brass'
            return 'brazier atlas'
        owners = [o for o in list(bpy.data.worlds) + list(bpy.data.materials) + list(bpy.data.node_groups)
                  if o not in self.ids and o.users > 0]
        order, nodes, images, seen = [], {}, {}, set()
        for o in owners:
            tree = o if isinstance(o, bpy.types.NodeTree) else o.node_tree
            if tree is None:
                continue
            k = label(o)
            if k not in nodes:
                order.append(k)
                nodes[k], images[k] = 0, 0
            for n in tree.nodes:
                if n.type not in ('TEX_IMAGE', 'TEX_ENVIRONMENT'):
                    continue
                nodes[k] += 1
                if n.image is not None and n.image not in self.images and n.image not in seen:
                    seen.add(n.image)
                    images[k] += 1
        return order, nodes, images


# ------------------------------------------------------------ the sun --
def build_sun(col):
    data = bpy.data.lights.new('SUN', 'SUN')
    data.energy = SUN_STRENGTH
    data.color = SUN_COLOUR
    data.angle = math.radians(SUN_ANGLE)
    ob = bpy.data.objects.new('SUN', data)
    ob.rotation_euler = tuple(math.radians(a) for a in SUN_ROTATION)
    col.objects.link(ob)
    return ob


# ------------------------------------------------------------ the braziers --
def build_braziers(bp, col):
    """BRAZIER_<n> per blueprint brazier; returns ([(root, brazier, overlaps)],
    the atlas check's difference or None)."""
    import props
    rows = bp.get('braziers') or []
    stale = sorted(set(BRAZIER_CLASH) - {b['id'] for b in rows})
    if stale:
        raise ValueError(f"lighting: BRAZIER_CLASH names {stale}, which the blueprint has no brazier for")
    if not rows:
        return [], None
    dv = props.devon_trees([BRAZIER_STEM], col)
    first = dv['roots'][BRAZIER_STEM]
    out = []
    for i, b in enumerate(rows):
        root = first if i == 0 else props.copy_tree(first, col)
        root.name = f"BRAZIER_{b['id'].split('-')[-1]}"
        root.matrix_world = Matrix.Translation(Vector(common.to_blender(b['position'])))
        root.scale = (1.0, 1.0, 1.0)
        root['configId'] = f"braziers[{i}]"
        out.append((root, b))
    bpy.context.view_layer.update()
    result = []
    for root, b in out:
        box = props.tree_box(root)
        meets = [p['id'] for p in bp['pieces'] if props._overlap(box, p['box'])]
        if meets and b['id'] not in BRAZIER_CLASH:
            raise ValueError(f"lighting: {b['id']} ({root.name}) at game {tuple(b['position'])} meets {meets[0]}"
                             + (f" and {len(meets) - 1} more ({', '.join(meets[1:])})" if len(meets) > 1 else '')
                             + "; a brazier stands clear of every piece unless BRAZIER_CLASH names it (#871)")
        if not meets and b['id'] in BRAZIER_CLASH:
            raise ValueError(f"lighting: BRAZIER_CLASH names {b['id']}, which meets nothing; the game's fix has "
                             f"landed, so the entry goes (#871)")
        result.append((root, b, meets))
    return result, dv['atlas_diff']


# ------------------------------------------------------------ the practicals --
def _faces(ob, flame_mat):
    """(region, area m2, game centroid, vertex indices) for each flame face of
    one mesh object, in world metres."""
    import props
    me = ob.data
    slots = [s.material for s in ob.material_slots]
    atlas = me.uv_layers.get('atlas')
    mw = ob.matrix_world
    co = [mw @ v.co for v in me.vertices]
    out = []
    for poly in me.polygons:
        m = slots[poly.material_index] if poly.material_index < len(slots) else None
        if m is None:
            continue
        if m.name == PH_FLAME:
            region = 'flame'
        elif m == flame_mat and atlas is not None:
            u = sum(atlas.data[i].uv[0] for i in poly.loop_indices) / poly.loop_total
            v = sum(atlas.data[i].uv[1] for i in poly.loop_indices) / poly.loop_total
            region = props.region_at(u, v)
            if region not in props.EMIT:
                raise ValueError(f"lighting: a MAT_flame face of {ob.name} samples region {region!r}, not one of "
                                 f"props.EMIT {sorted(props.EMIT)}")
        else:
            continue
        vs = list(poly.vertices)
        p0 = co[vs[0]]
        area, c = 0.0, Vector((0.0, 0.0, 0.0))
        for a, b in zip(vs[1:-1], vs[2:]):
            t = (co[a] - p0).cross(co[b] - p0).length / 2.0
            area += t
            c += t * (p0 + co[a] + co[b]) / 3.0
        centre = c / area if area > 0 else sum((co[i] for i in vs), Vector()) / len(vs)
        out.append((region, area, centre, vs))
    return out


def _centroid(faces):
    area = sum(f[1] for f in faces)
    return sum((f[1] * f[2] for f in faces), Vector()) / area, area


def practicals(sources, flame_mat):
    """[(source id, kind, blender location)] for every flame the model draws,
    per source in the order given, n in game (x, y, z) order within a source."""
    lights = []
    for sid, root in sources:
        per_object = []
        for o in [root] + list(root.children_recursive):
            if o.type == 'MESH':
                fs = _faces(o, flame_mat)
                if fs:
                    per_object.append(fs)
        if not per_object:
            continue
        every = [f for fs in per_object for f in fs]
        coals = [f for f in every if f[0] in ('coals', 'ember')]
        found = []
        if any(f[0] == 'coals' for f in every):
            at, _a = _centroid(coals)
            at = at + Vector((0.0, 0.0, COAL_RAISE))
            found.append(('brazier' if any(f[0] == 'ember' for f in every) else 'hearth', at))
        else:
            clusters = []
            for fs in per_object:
                parent = {}

                def find(x):
                    while parent.setdefault(x, x) != x:
                        parent[x] = parent[parent[x]]
                        x = parent[x]
                    return x
                for f in fs:
                    for v in f[3][1:]:
                        parent[find(v)] = find(f[3][0])
                groups = {}
                for f in fs:
                    groups.setdefault(find(f[3][0]), []).append(f)
                clusters += list(groups.values())
            # merge clusters of one source whose centroids lie within MERGE
            cents = [_centroid(c)[0] for c in clusters]
            owner = list(range(len(clusters)))

            def top(i):
                while owner[i] != i:
                    i = owner[i]
                return i
            for i in range(len(clusters)):
                for j in range(i + 1, len(clusters)):
                    if (cents[i] - cents[j]).length <= MERGE:
                        owner[top(j)] = top(i)
            merged = {}
            for i, c in enumerate(clusters):
                merged.setdefault(top(i), []).extend(c)
            for c in merged.values():
                at, area = _centroid(c)
                found.append(('torch' if area >= TORCH_AREA else 'candle', at))
        found.sort(key=lambda t: game(t[1]))
        lights += [(sid, n + 1, kind, at) for n, (kind, at) in enumerate(found)]
    return lights


def build_light(col, sid, n, kind, at):
    lumens, soft, kelvin = PRACTICAL[kind]
    name = f"LIGHT_{sid}-{n}"
    data = bpy.data.lights.new(name, 'POINT')
    data.energy = lumens * PRACTICAL_GAIN / LUX_PER_UNIT
    data.shadow_soft_size = soft
    data.color = (1.0, 1.0, 1.0)
    data.use_temperature = True
    data.temperature = kelvin
    ob = bpy.data.objects.new(name, data)
    ob.location = at
    ob['lightFor'] = sid
    ob['kind'] = kind
    col.objects.link(ob)
    return ob


# ------------------------------------------------------------ the cameras --
def build_cameras(bp, col):
    made = []
    for c in bp.get('cameras') or []:
        data = bpy.data.cameras.new(f"CAM_{c['name']}")
        if c.get('fovY') is not None:
            data.sensor_fit = 'VERTICAL'
            data.angle_y = math.radians(c['fovY'])
        else:
            data.lens = c['lens']
        data.clip_start, data.clip_end = CLIP
        ob = bpy.data.objects.new(f"CAM_{c['name']}", data)
        e, t = Vector(common.to_blender(c['eye'])), Vector(common.to_blender(c['target']))
        ob.location = e
        ob.rotation_euler = (t - e).to_track_quat('-Z', 'Y').to_euler()
        ob['exposure'] = float(c['exposure'])
        ob['samples'] = int(c['samples'])
        col.objects.link(ob)
        made.append((ob, c))
    spawn = bpy.data.objects.get('CAM_spawn')
    if spawn is not None:
        bpy.context.scene.camera = spawn
    return made


# ------------------------------------------------------------------- build --
def build(bp):
    import props
    col = common.stage_collection('lighting')
    if bpy.data.worlds:
        raise RuntimeError(f"lighting: the file already has {len(bpy.data.worlds)} World(s) "
                           f"({', '.join(w.name for w in bpy.data.worlds)}) before this stage; lighting builds the "
                           f"only one (#870), so whatever made that one has kept terrain's old call")
    snap = Snapshot()
    materials.world_from_hdri(common.source(HDRI), clamp=SUN_CLAMP)
    sun = build_sun(col)
    braziers, atlas_diff = build_braziers(bp, col)

    sources = [(o['planId'], o) for o in bpy.data.objects
               if o.parent is None and o.name.startswith('PROP_') and 'planId' in o.keys()]
    sources.sort(key=lambda t: t[0])
    sources += [(b['id'], root) for root, b, _m in braziers]
    flame_mat = bpy.data.materials.get('MAT_flame')
    lights = practicals(sources, flame_mat)
    for sid, n, kind, at in lights:
        build_light(col, sid, n, kind, at)
    cams = build_cameras(bp, col)

    by_kind = {k: sum(1 for l in lights if l[2] == k) for k in PRACTICAL}
    by_source = {}
    for sid, _n, kind, at in lights:
        by_source.setdefault(sid, []).append((kind, game(at)))
    print(f"lighting: WORLD_hdri from {HDRI}, clamp {SUN_CLAMP:g}; SUN strength {SUN_STRENGTH}, colour {SUN_COLOUR}, "
          f"angle {SUN_ANGLE} deg, rotation {SUN_ROTATION} deg")
    print(f"lighting: {len(lights)} practicals (" + ', '.join(f"{n} {k}" for k, n in by_kind.items() if n)
          + f"), gain {PRACTICAL_GAIN:g}, {LUX_PER_UNIT:g} lux per unit")
    for sid, ls in by_source.items():
        kinds = sorted({k for k, _a in ls})
        ys = [a[1] for _k, a in ls]
        xs = [a[0] for _k, a in ls]
        where = (f"at ({xs[0]:.3f}, {ys[0]:.3f}, {ls[0][1][2]:.3f})" if len(ls) == 1 else
                 f"x {min(xs):.2f} to {max(xs):.2f}, y {min(ys):.2f} to {max(ys):.2f}")
        print(f"lighting:   {sid}: {len(ls)} {'/'.join(kinds)} {where}")
    for root, b, meets in braziers:
        print(f"lighting: {b['id']} as {root.name} at game {tuple(b['position'])}: overlaps "
              + (', '.join(meets) + (f" (BRAZIER_CLASH: {BRAZIER_CLASH[b['id']]})" if b['id'] in BRAZIER_CLASH else '')
                 if meets else 'none'))
    if atlas_diff is not None:
        print(f"lighting: brazier atlas check {atlas_diff:.5f} (props.ATLAS_TOL {props.ATLAS_TOL})")
    for ob, c in cams:
        s = c.get('stand')
        on = f"{s['surface']} (level {s['level']}) at {s['h']:.2f}" if s else 'no floor'
        view = f"{c['fovY']} deg vertical" if c.get('fovY') is not None else f"{c['lens']} mm"
        print(f"lighting: {ob.name} eye game {tuple(c['eye'])} at {tuple(c['target'])}, {view}, stands on {on}, "
              f"{'reachable' if c.get('reachable') else 'NOT reachable'}; exposure {c['exposure']:+.2f}, "
              f"{c['samples']} samples")
    order, nodes, images = snap.split()
    print(f"lighting: line 4 share: {sum(nodes.values())} image texture nodes, {sum(images.values())} images new in "
          f"this stage (" + ', '.join(f"{k} {nodes[k]}/{images[k]}" for k in order) + ')')
    return sun
