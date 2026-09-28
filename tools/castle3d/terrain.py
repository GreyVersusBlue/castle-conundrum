# terrain.py - the terrain stage: the ground the castle stands on (increment 1).
#
# A height field 400 m square, centred on the pieces' span (game x -81, z 0, so
# x -281 to 119 and z -200 to 200), exactly PAD_HEIGHT (0) over the pieces'
# footprint plus 10 m, since every gameplay distance is measured from the
# floors (#844 line 5), and displaced outside it by seeded value noise that
# rises from the pad's edge over RAMP metres. The road runs from the terrain's
# west edge to the west gate, flat in its own corridor. Trees and rocks are Poly
# Haven models placed from a seeded layout; grass is a Poly Haven model
# scattered by a seeded Geometry Nodes tree. Trees, rocks and grass stay off the
# road and off the pad. The World is lit from the HDRI (#846). No river and no
# moat until rank 9's 3b ships (SPECS.md, open calls).
#
# Every number is in the game's frame (x, z in metres, y up) until a vertex is
# written, where common.to_blender turns it into Blender's (x, -z, y) (#843).
# Everything random draws from `random`, which build.py seeds with
# common.seed("terrain") before this runs, so the layout is the same each build.

import math
import os
import random
import re

import bpy
from mathutils import Matrix, Vector

import common
import materials

SIZE = 400.0
CENTRE = (-81.0, 0.0)      # game x, z: the pieces' span, x -198 to 36
STEP = 2.0                 # grid spacing, metres
PAD_MARGIN = 10.0          # flat past the pieces' footprint
PAD_HEIGHT = 0.0           # the pad's height; check.py line 5 holds it to 0 +- 0.02
RAMP = 40.0                # metres over which the hills rise from the pad's edge
OCTAVES = ((90.0, 7.0), (35.0, 2.5), (12.0, 0.6))  # (wavelength, amplitude) in metres
ROAD_PIECE = 'outside-road'  # the blueprint piece the road realises; its z span is the road's width
ROAD_GATE = 'west-gate'
ROAD_LIFT = 0.03           # the road ribbon sits this far over the ground
ROAD_FLAT = (2.0, 16.0)    # past the road's edge: flat for the first, hills by the second
VERGE = 4.0                # mud either side of the road
KEEP_OFF = 6.0             # trees, rocks and grass stay this far off the pad and the road

# The meshes placed from each model's .blend; every other appended object is
# deleted. A pattern that matches nothing raises.
MODELS = {
    'island_tree_01': r'^island_tree_01_LOD1$',
    'tree_small_02': r'^tree_small_02_LOD1$',
    'boulder_01': r'^boulder_01_LOD0$',
    'rock_moss_set_02': r'^rock_moss_set_02_rock\d+$',
    'grass_medium_02': r'^grass_medium_02_[a-e]$',
}
GROVES = 16                       # tree clusters
TREES = {'island_tree_01': 45, 'tree_small_02': 75}
TREE_SPREAD = 16.0                # a grove's standard deviation, metres
TREE_SPACING = 7.0
# Per tree, all drawn from the stage's seeded random (#840, #841): a yaw of 0 to
# 360 degrees, a uniform scale, a separate height factor on top of it, and a
# lean in a random direction. The models are 4.6 and 5.0 m tall as modelled.
TREE_SCALE = (0.8, 1.25)
TREE_HEIGHT = (0.9, 1.1)
TREE_LEAN = 4.0                   # degrees, at most
ROCKS = {'boulder_01': 24, 'rock_moss_set_02': 36}
ROCK_SPACING = 3.0
ROCK_SCALE = (0.8, 1.25)          # and a yaw; no lean, no height factor
GRASS_DENSITY = 6.0               # clumps per square metre
GRASS_SCALE = (1.0, 2.0)          # the clumps are 0.16 to 0.4 m as modelled
HDRI = 'kloofendal_48d_partly_cloudy_puresky:hdri'


def smoothstep(a, b, v):
    t = min(1.0, max(0.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


class Ground:
    """The height field as a function of game (x, z), and the regions on it."""

    def __init__(self, bp):
        xs = [c for p in bp['pieces'] for c in (p['box']['min']['x'], p['box']['max']['x'])]
        zs = [c for p in bp['pieces'] for c in (p['box']['min']['z'], p['box']['max']['z'])]
        self.pad = (min(xs) - PAD_MARGIN, max(xs) + PAD_MARGIN, min(zs) - PAD_MARGIN, max(zs) + PAD_MARGIN)
        self.x0, self.x1 = CENTRE[0] - SIZE / 2, CENTRE[0] + SIZE / 2
        self.z0, self.z1 = CENTRE[1] - SIZE / 2, CENTRE[1] + SIZE / 2
        if not (self.x0 < self.pad[0] and self.pad[1] < self.x1 and self.z0 < self.pad[2] and self.pad[3] < self.z1):
            raise ValueError(f"terrain: the pad {self.pad} does not fit inside the {SIZE} m square on {CENTRE}")

        gate = next((g for g in bp['gates'] if g['id'] == ROAD_GATE), None)
        if gate is None or gate.get('x') is None:
            raise ValueError(f"terrain: the blueprint has no {ROAD_GATE} with an x")
        road = next((p for p in bp['pieces'] if p['id'] == ROAD_PIECE), None)
        if road is None:
            raise ValueError(f"terrain: the blueprint has no {ROAD_PIECE} piece")
        self.gate_x, self.road_z = gate['x'], gate['z']
        self.road_half = (road['box']['max']['z'] - road['box']['min']['z']) / 2
        self.castle = next(g['box'] for g in bp['grounds'] if g['id'] == 'ground')

        # Value-noise lattices, one per octave, drawn once in a fixed order.
        self.lattices = []
        for wave, amp in OCTAVES:
            nx = int(math.ceil(SIZE / wave)) + 2
            self.lattices.append((wave, amp, [[random.uniform(-1, 1) for _ in range(nx)] for _ in range(nx)]))

    def in_pad(self, x, z, grow=0.0):
        a, b, c, d = self.pad
        return a - grow <= x <= b + grow and c - grow <= z <= d + grow

    def pad_distance(self, x, z):
        a, b, c, d = self.pad
        dx = max(a - x, 0.0, x - b)
        dz = max(c - z, 0.0, z - d)
        return math.hypot(dx, dz)

    def road_distance(self, x, z):
        """Distance to the road's centre line, from the west edge to the gate."""
        if x <= self.gate_x:
            return abs(z - self.road_z)
        return math.hypot(x - self.gate_x, z - self.road_z)

    def noise(self, x, z):
        h = 0.0
        for wave, amp, lat in self.lattices:
            u, v = (x - self.x0) / wave, (z - self.z0) / wave
            i, j = int(u), int(v)
            fu, fv = smoothstep(0, 1, u - i), smoothstep(0, 1, v - j)
            a = lat[i][j] + (lat[i + 1][j] - lat[i][j]) * fu
            b = lat[i][j + 1] + (lat[i + 1][j + 1] - lat[i][j + 1]) * fu
            h += amp * (a + (b - a) * fv)
        return h

    def height(self, x, z):
        if self.in_pad(x, z):
            return PAD_HEIGHT
        rise = smoothstep(0.0, RAMP, self.pad_distance(x, z))
        road = smoothstep(self.road_half + ROAD_FLAT[0], self.road_half + ROAD_FLAT[1], self.road_distance(x, z))
        return PAD_HEIGHT + self.noise(x, z) * rise * road

    def on_road(self, x, z, grow=0.0):
        return x <= self.gate_x + grow and self.road_distance(x, z) <= self.road_half + grow

    def kept_off(self, x, z):
        """True where no tree, rock or grass may stand."""
        return self.in_pad(x, z, KEEP_OFF) or self.on_road(x, z, KEEP_OFF)

    def in_castle(self, x, z):
        b = self.castle
        return b['min']['x'] <= x <= b['max']['x'] and b['min']['z'] <= z <= b['max']['z']


def _mesh(name, verts, faces, uvs, col):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    uv = me.uv_layers.new(name='UVMap')
    uv.data.foreach_set('uv', [c for loop in me.loops for c in uvs[loop.vertex_index]])
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    return ob


def _grid(nx, nz):
    return [(i * (nz + 1) + j, (i + 1) * (nz + 1) + j, (i + 1) * (nz + 1) + j + 1, i * (nz + 1) + j + 1)
            for i in range(nx) for j in range(nz)]


def build_ground(g, col, plan_ids):
    n = int(round(SIZE / STEP))
    verts, uvs, pts = [], [], []
    for i in range(n + 1):
        x = g.x0 + i * STEP
        for j in range(n + 1):
            z = g.z0 + j * STEP
            b = common.to_blender((x, g.height(x, z), z))
            verts.append(b)
            uvs.append((b[0], b[1]))
    faces = _grid(n, n)
    # The winding above faces down in Blender's frame (z flips to -y); turn it up.
    faces = [tuple(reversed(f)) for f in faces]
    ob = _mesh(common.TERRAIN, verts, faces, uvs, col)
    me = ob.data
    me.materials.append(materials.ground('grass'))
    me.materials.append(materials.ground('mud'))
    index, grass = [], []
    for poly in me.polygons:
        cx, cy = poly.center.x, poly.center.y
        x, z = cx, -cy
        mud = g.in_castle(x, z) or g.on_road(x, z, VERGE)
        index.append(1 if mud else 0)
        grass.append(not mud and not g.kept_off(x, z))
    me.polygons.foreach_set('material_index', index)
    attr = me.attributes.new('grass', 'BOOLEAN', 'FACE')
    attr.data.foreach_set('value', grass)
    ob['planIds'] = plan_ids
    print(f"terrain: {len(verts)} vertices, pad x {g.pad[0]} to {g.pad[1]}, z {g.pad[2]} to {g.pad[3]} at {PAD_HEIGHT} m, "
          f"{sum(index)} mud faces, {sum(grass)} grass faces")
    return ob


def build_road(g, col):
    x0, x1 = g.x0, g.gate_x
    n = int(math.ceil((x1 - x0) / STEP))
    across = (g.road_z - g.road_half, g.road_z, g.road_z + g.road_half)
    verts, uvs = [], []
    for i in range(n + 1):
        x = min(x0 + i * STEP, x1)
        for z in across:
            b = common.to_blender((x, g.height(x, z) + ROAD_LIFT, z))
            verts.append(b)
            uvs.append((b[0], b[1]))
    faces = [tuple(reversed(f)) for f in _grid(n, len(across) - 1)]
    ob = _mesh('TERRAIN_road', verts, faces, uvs, col)
    ob.data.materials.append(materials.ground('cobble'))
    ob['planId'] = ROAD_PIECE
    return ob


def append_model(asset, library):
    """Every object of the asset's cached .blend, appended whole; what is not a
    mesh or not in MODELS is deleted, and the rest go into `library`."""
    row = common.source(f"{asset}:blend")
    path = common.cached(row)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"terrain: {row['id']} is not a file at {path}")
    before = set(bpy.data.images)
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = list(src.objects)
    # Blender resolves an appended // path against the main file, which is
    # unsaved until the end: make each one absolute against the model's folder.
    folder = os.path.dirname(path)
    new_images = [im for im in bpy.data.images if im not in before]
    for im in new_images:
        if im.filepath.startswith('//'):
            im.filepath = os.path.normpath(os.path.join(folder, im.filepath[2:]))
    if new_images:
        print(f"terrain: {asset} image {new_images[0].name} -> {new_images[0].filepath}")
    pattern = re.compile(MODELS[asset])
    keep = []
    for ob in [o for o in dst.objects if o is not None]:
        if ob.type == 'MESH' and pattern.search(ob.name):
            keep.append(ob)
        else:
            bpy.data.objects.remove(ob)
    if not keep:
        raise ValueError(f"terrain: {path} holds no mesh matching {MODELS[asset]}")
    for ob in keep:
        ob.location = (0.0, 0.0, 0.0)
        library.objects.link(ob)
    return sorted(keep, key=lambda o: o.name)


def scatter(g, n, spacing, placed, centres=None):
    """n seeded points off the pad and the road, `spacing` apart from each
    other and from `placed`; around `centres` when given, else uniform."""
    out, tries = [], 0
    margin = 5.0
    while len(out) < n:
        tries += 1
        if tries > n * 400:
            raise RuntimeError(f"terrain: placed {len(out)} of {n} after {tries} tries")
        if centres:
            cx, cz = random.choice(centres)
            x, z = random.gauss(cx, TREE_SPREAD), random.gauss(cz, TREE_SPREAD)
        else:
            x, z = random.uniform(g.x0, g.x1), random.uniform(g.z0, g.z1)
        if not (g.x0 + margin < x < g.x1 - margin and g.z0 + margin < z < g.z1 - margin):
            continue
        if g.kept_off(x, z):
            continue
        if any((x - px) ** 2 + (z - pz) ** 2 < spacing ** 2 for px, pz in placed + out):
            continue
        out.append((x, z))
    return out


def place(g, col, prefix, templates, points, sink, scale, height=(1.0, 1.0), lean=0.0):
    """One object per point, sharing its template's mesh (no new meshes). The
    draws are in a fixed order per object, so a rebuild repeats every one."""
    for k, (x, z) in enumerate(points):
        t = random.choice(templates)
        yaw = random.uniform(0.0, 2 * math.pi)
        s = random.uniform(*scale)
        hz = random.uniform(*height)
        tilt = math.radians(random.uniform(0.0, lean))
        towards = random.uniform(0.0, 2 * math.pi)
        axis = Vector((-math.sin(towards), math.cos(towards), 0.0))  # the top leans along `towards`
        rot = Matrix.Rotation(tilt, 3, axis) @ Matrix.Rotation(yaw, 3, 'Z')
        at = Vector(common.to_blender((x, g.height(x, z) - sink, z)))
        ob = bpy.data.objects.new(f"{prefix}_{k:03d}", t.data)
        ob.matrix_basis = Matrix.Translation(at) @ (rot @ Matrix.Diagonal((s, s, s * hz))).to_4x4()
        ob['model'] = t.name
        col.objects.link(ob)


def _socket(sockets, name):
    """The enabled socket called `name`: multi-type nodes carry one per type."""
    for s in sockets:
        if s.name == name and getattr(s, 'enabled', True):
            return s
    raise KeyError(f"terrain: no enabled socket {name} in {[s.name for s in sockets]}")


def build_grass(g, col, terrain, grass_col):
    """A Geometry Nodes scatter of the grass clumps over the terrain's `grass`
    faces, seeded from the stage's random."""
    seed = random.randint(0, 2 ** 31 - 1)
    ng = bpy.data.node_groups.new('GN_grass_scatter', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes
    L = ng.links
    gin = N.new('NodeGroupInput')
    gout = N.new('NodeGroupOutput')
    gout.location = (1000, 0)
    info = N.new('GeometryNodeObjectInfo')
    info.transform_space = 'ORIGINAL'
    _socket(info.inputs, 'Object').default_value = terrain
    attr = N.new('GeometryNodeInputNamedAttribute')
    attr.data_type = 'BOOLEAN'
    _socket(attr.inputs, 'Name').default_value = 'grass'
    dist = N.new('GeometryNodeDistributePointsOnFaces')
    dist.distribute_method = 'RANDOM'
    _socket(dist.inputs, 'Density').default_value = GRASS_DENSITY
    _socket(dist.inputs, 'Seed').default_value = seed
    L.new(_socket(info.outputs, 'Geometry'), _socket(dist.inputs, 'Mesh'))
    L.new(_socket(attr.outputs, 'Attribute'), _socket(dist.inputs, 'Selection'))

    coll = N.new('GeometryNodeCollectionInfo')
    coll.transform_space = 'ORIGINAL'
    _socket(coll.inputs, 'Collection').default_value = grass_col
    _socket(coll.inputs, 'Separate Children').default_value = True
    _socket(coll.inputs, 'Reset Children').default_value = True
    inst = N.new('GeometryNodeInstanceOnPoints')
    _socket(inst.inputs, 'Pick Instance').default_value = True
    L.new(_socket(dist.outputs, 'Points'), _socket(inst.inputs, 'Points'))
    L.new(coll.outputs[0], _socket(inst.inputs, 'Instance'))

    def rnd(kind, lo, hi, s):
        r = N.new('FunctionNodeRandomValue')
        r.data_type = kind
        _socket(r.inputs, 'Min').default_value = lo
        _socket(r.inputs, 'Max').default_value = hi
        _socket(r.inputs, 'Seed').default_value = s
        return next(o for o in r.outputs if getattr(o, 'enabled', True))

    L.new(rnd('INT', 0, len(grass_col.objects) - 1, seed + 1), _socket(inst.inputs, 'Instance Index'))
    L.new(rnd('FLOAT_VECTOR', (0.0, 0.0, 0.0), (0.0, 0.0, 2 * math.pi), seed + 2), _socket(inst.inputs, 'Rotation'))
    L.new(rnd('FLOAT', GRASS_SCALE[0], GRASS_SCALE[1], seed + 3), _socket(inst.inputs, 'Scale'))
    L.new(_socket(inst.outputs, 'Instances'), _socket(gout.inputs, 'Geometry'))

    me = bpy.data.meshes.new('TERRAIN_grass')
    ob = bpy.data.objects.new('TERRAIN_grass', me)
    col.objects.link(ob)
    mod = ob.modifiers.new('grass', 'NODES')
    mod.node_group = ng
    print(f"terrain: grass scatter seed {seed}, {GRASS_DENSITY} clumps per m2 over the grass faces")
    return ob


def build(bp):
    col = common.stage_collection('terrain')
    g = Ground(bp)

    # The terrain stage's blueprint pieces: the road carries ROAD_PIECE, the
    # height field every other one (the castle's ground and its patches, and
    # the country outside), for check.py line 6.
    mine = sorted(pid for pid, stage in common.STAGE_OF(bp).items() if stage == 'terrain')
    if ROAD_PIECE not in mine:
        raise ValueError(f"terrain: {ROAD_PIECE} is not a terrain piece in STAGE_OF")
    terrain = build_ground(g, col, [p for p in mine if p != ROAD_PIECE])
    build_road(g, col)

    # The models, appended into a library collection that is not in the scene
    # (a fake user keeps it); the placed objects share its meshes.
    library = bpy.data.collections.new('TERRAIN_library')
    library.use_fake_user = True
    grass_col = bpy.data.collections.new('TERRAIN_library_grass')
    grass_col.use_fake_user = True
    models = {}
    for asset in MODELS:
        models[asset] = append_model(asset, grass_col if asset == 'grass_medium_02' else library)

    # Leaf tint per tree, on the leaf materials only; bark and twigs untouched.
    for asset in TREES:
        for mat in {s.material for ob in models[asset] for s in ob.material_slots if s.material}:
            if mat.name.endswith('_leaves'):
                materials.tint_leaves(mat)

    centres = scatter(g, GROVES, 30.0, [])
    placed = []
    for asset, n in TREES.items():
        pts = scatter(g, n, TREE_SPACING, placed, centres)
        placed += pts
        place(g, col, f"TREE_{asset}", models[asset], pts, 0.05, TREE_SCALE, TREE_HEIGHT, TREE_LEAN)
    for asset, n in ROCKS.items():
        pts = scatter(g, n, ROCK_SPACING, placed)
        placed += pts
        place(g, col, f"ROCK_{asset}", models[asset], pts, 0.15, ROCK_SCALE)

    build_grass(g, col, terrain, grass_col)
    materials.world_from_hdri(common.source(HDRI))
    print(f"terrain: {sum(TREES.values())} trees in {GROVES} groves, {sum(ROCKS.values())} rocks, planIds {mine}")
