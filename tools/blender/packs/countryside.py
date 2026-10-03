# countryside.py - the land beyond the wall (SPECS.md "Blender: the
# countryside beyond the wall", #816 to #819).
#
# One seeded height field over world x -140..180, z -170..170, cut into five
# backdrop pieces that, with `ground` and `outside-ground`, tile that
# rectangle edge to edge. Every row carries the same seed and only its `cut`;
# everything else is a constant here, and everything random is drawn over the
# whole field before the cut is looked at, so every row draws the same
# countryside and two pieces sharing an edge share its heights by
# construction. Each piece is one mesh: one draw.
#
# World x is Blender x and world z is Blender -y, so the exporter's +Y up and
# front at +Z put a piece back where the plan says, at rotationY 0.

import os
import sys
import math
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402  (the pin runs on import)

import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

# ------------------------------------------------------------- the field ---
# #500: the two ground rectangles are typed here, and test/layout.mjs check 4g
# is what holds them to the plan. A rank 9 increment that moves
# `outside-ground` breaks 4g by name and re-cuts the field in the same commit.
FIELD = ((-140.0, -170.0), (180.0, 170.0))
GROUNDS = (
    ((-48.0, -22.0), (36.0, 22.0)),     # ground: the curtain plus 2 m
    ((-140.0, -40.0), (-48.0, 40.0)),   # outside-ground, its west edge the river bank
)
CURTAIN = ((-46.0, -20.0), (34.0, 20.0))
# The lines the five pieces meet on. Every piece takes every grid line inside
# its cut, so two pieces along a shared edge have the same vertices on it.
CUT_X = (-140.0, -48.0, 36.0, 180.0)
CUT_Z = (-170.0, -40.0, -22.0, 22.0, 40.0, 170.0)
STEP = 8.0           # the grid, metres
FLAT = 10.0          # height 0 within this of either ground rectangle
RIM = 24.0           # the crest on every edge that touches nothing (#818)
RIM_WIDTH = 32.0
NOISE_CELL = 40.0
PARCEL = (32.0, 24.0)

# The farmsteads (x, z, turn in degrees), each 60 to 130 m from the curtain
# box and all of it inside one piece. A farm's buildings reach 18 m from its
# centre and the ground under it is levelled to PAD_IN.
FARMS = (
    (10.0, -95.0, 8.0),
    (110.0, -70.0, -24.0),
    (95.0, 75.0, 31.0),
    (-10.0, 90.0, -6.0),
    (-95.0, 100.0, 17.0),
)
FARM_REACH = 18.0
PAD_IN, PAD_OUT = 20.0, 34.0

# ----------------------------------------------------------- the palette ---
# Greens and browns from tools/pixel/textures.json's `forest_ground_06` and
# `grassy_cobblestone`, plaster from `plastered_wall_04`, timber and fence
# from `wooden_gate` and `old_planks_02`. WHEAT, MEADOW and THATCH are the
# pack's three extraColours (packs.json says why).
WHEAT = '#b89d55'
MEADOW = '#6b7a3a'
THATCH = '#7e6a3e'
PASTURE = '#5b6a36'
GRASS = '#4d5a2e'
GRASS_LIGHT = '#57643e'
SLOPE = '#4b5735'
HILL = '#3f4a2c'
PLOUGH = '#4f402a'
PLOUGH_LIGHT = '#5a4930'
LEAF = '#414d27'
LEAF_DARK = '#36401f'
WOOD_DEEP = '#2b3320'
PLASTER = '#b1a58d'
TIMBER = '#503a28'
FENCE = '#6e5f4f'
PALETTE = [WHEAT, MEADOW, THATCH, PASTURE, GRASS, GRASS_LIGHT, SLOPE, HILL,
           PLOUGH, PLOUGH_LIGHT, LEAF, LEAF_DARK, WOOD_DEEP, PLASTER, TIMBER, FENCE]
FIELD_COLOURS = [WHEAT, WHEAT, WHEAT, MEADOW, MEADOW, PASTURE, PASTURE, PLOUGH, PLOUGH_LIGHT, GRASS]


def smooth(a, b, t):
    if t <= a:
        return 0.0
    if t >= b:
        return 1.0
    u = (t - a) / (b - a)
    return u * u * (3 - 2 * u)


def rect_distance(x, z, rect):
    (x0, z0), (x1, z1) = rect
    dx = max(x0 - x, 0.0, x - x1)
    dz = max(z0 - z, 0.0, z - z1)
    return math.hypot(dx, dz)


def ground_distance(x, z):
    return min(rect_distance(x, z, g) for g in GROUNDS)


def edge_distance(x, z):
    """How far from the field's edges that touch nothing: east, north, south,
    and the west edge where it is not outside-ground's (the river's, #796)."""
    (fx0, fz0), (fx1, fz1) = FIELD
    west = math.hypot(x - fx0, max(40.0 - abs(z), 0.0))
    return min(fx1 - x, z - fz0, fz1 - z, west)


class Field:
    """Everything random about the countryside, drawn once over the whole field
    in a fixed order, so it is the same in every row."""

    def __init__(self):
        (fx0, fz0), (fx1, fz1) = FIELD
        self.nx = int(math.ceil((fx1 - fx0) / NOISE_CELL)) + 1
        self.nz = int(math.ceil((fz1 - fz0) / NOISE_CELL)) + 1
        self.noise = [[[random.random() for _ in range(self.nz)] for _ in range(self.nx)] for _ in range(3)]
        self.px = int(math.ceil((fx1 - fx0) / PARCEL[0]))
        self.pz = int(math.ceil((fz1 - fz0) / PARCEL[1]))
        self.parcels = [[random.choice(FIELD_COLOURS) for _ in range(self.pz)] for _ in range(self.px)]
        self.pads = [(fx, fz, self.raw(fx, fz)) for fx, fz, _ in FARMS]
        self.trees = []
        self.hedges()
        self.woods()

    def n(self, layer, x, z):
        (fx0, fz0), _ = FIELD
        u, v = (x - fx0) / NOISE_CELL, (z - fz0) / NOISE_CELL
        i, j = min(int(u), self.nx - 2), min(int(v), self.nz - 2)
        fu, fv = smooth(0, 1, u - i), smooth(0, 1, v - j)
        g = self.noise[layer]
        a = g[i][j] * (1 - fu) + g[i + 1][j] * fu
        b = g[i][j + 1] * (1 - fu) + g[i + 1][j + 1] * fu
        return a * (1 - fv) + b * fv

    def raw(self, x, z):
        d = ground_distance(x, z)
        if d <= FLAT:
            return 0.0
        roll = 2.5 * self.n(0, x, z)
        slope = 11.0 * smooth(45.0, 150.0, d) * (0.5 + 0.5 * self.n(1, x, z))
        rim = RIM * (1.0 - smooth(0.0, RIM_WIDTH, edge_distance(x, z)))
        return smooth(FLAT, FLAT + 20.0, d) * (roll + slope + rim)

    def height(self, x, z):
        h = self.raw(x, z)
        for fx, fz, hp in self.pads:
            w = 1.0 - smooth(PAD_IN, PAD_OUT, math.hypot(x - fx, z - fz))
            h = h * (1 - w) + hp * w
        return h

    def parcel(self, x, z):
        (fx0, fz0), _ = FIELD
        i = min(max(int((x - fx0) // PARCEL[0]), 0), self.px - 1)
        j = min(max(int((z - fz0) // PARCEL[1]), 0), self.pz - 1)
        return self.parcels[i][j]

    def low(self, x, z):
        return ground_distance(x, z) < 95.0 and edge_distance(x, z) > RIM_WIDTH

    def clear_of_farms(self, x, z, by):
        return all(math.hypot(x - fx, z - fz) > by for fx, fz, _ in FARMS)

    def hedges(self):
        """Tree lines along some field edges in the low ground."""
        (fx0, fz0), (fx1, fz1) = FIELD
        segments = []
        for i in range(1, self.px):
            for j in range(self.pz):
                x = fx0 + i * PARCEL[0]
                segments.append(((x, fz0 + j * PARCEL[1]), (x, fz0 + (j + 1) * PARCEL[1])))
        for j in range(1, self.pz):
            for i in range(self.px):
                z = fz0 + j * PARCEL[1]
                segments.append(((fx0 + i * PARCEL[0], z), (fx0 + (i + 1) * PARCEL[0], z)))
        for (ax, az), (bx, bz) in segments:
            pick = random.random()
            mx, mz = (ax + bx) / 2, (az + bz) / 2
            if pick > 0.25 or not self.low(mx, mz) or ground_distance(mx, mz) < FLAT + 6:
                continue
            length = math.hypot(bx - ax, bz - az)
            for k in range(int(length // 6.0)):
                t = (k + 0.5) / int(length // 6.0)
                x = ax + (bx - ax) * t + random.uniform(-0.8, 0.8)
                z = az + (bz - az) * t + random.uniform(-0.8, 0.8)
                tall, r = random.uniform(4.5, 7.0), random.uniform(1.6, 2.4)
                colour = random.choice([LEAF, LEAF_DARK])
                if ground_distance(x, z) > FLAT + 4 and self.clear_of_farms(x, z, FARM_REACH + 4):
                    self.trees.append((x, z, tall, r, colour))

    def woods(self):
        """Clumps on the slopes, where the third noise says wood."""
        (fx0, fz0), (fx1, fz1) = FIELD
        for _ in range(1600):
            x, z = random.uniform(fx0, fx1), random.uniform(fz0, fz1)
            tall, r = random.uniform(7.0, 11.0), random.uniform(2.4, 3.6)
            colour = random.choice([LEAF_DARK, WOOD_DEEP, LEAF])
            d = ground_distance(x, z)
            if d < 45.0 or self.n(2, x, z) < 0.6 or edge_distance(x, z) < RIM_WIDTH * 0.6:
                continue
            if not self.clear_of_farms(x, z, FARM_REACH + 8):
                continue
            self.trees.append((x, z, tall, r, colour))


# ------------------------------------------------------- the mesh helpers ---
def B(x, z, y):
    """World (x, z) at height y, in Blender's frame."""
    return (x, -z, y)


def outward(faces, centre):
    for f in faces:
        f.normal_update()
        if (f.calc_center_median() - Vector(centre)).dot(f.normal) < 0:
            f.normal_flip()
    return faces


def rbox(bm, x, z, y0, size, turn):
    """A box `size` (along, across, up) standing on y0 at world (x, z), turned
    `turn` radians about the vertical."""
    sx, sz, sy = size
    m = (Matrix.Translation(B(x, z, y0 + sy / 2)) @ Matrix.Rotation(turn, 4, 'Z')
         @ Matrix.Diagonal((sx, sz, sy, 1.0)))
    out = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    return list(dict.fromkeys(f for v in out['verts'] for f in v.link_faces))


def gable(bm, x, z, y0, length, width, rise, turn):
    """A roof: two slopes and two gable ends, its ridge along `length`."""
    c, s = math.cos(turn), math.sin(turn)
    def at(u, v, h):
        return bm.verts.new((x + u * c - v * s, -z + u * s + v * c, y0 + h))
    hl, hw = length / 2, width / 2
    e = [at(-hl, -hw, 0), at(hl, -hw, 0), at(hl, hw, 0), at(-hl, hw, 0)]
    r = [at(-hl, 0, rise), at(hl, 0, rise)]
    faces = [bm.faces.new((e[0], e[1], r[1], r[0])), bm.faces.new((e[2], e[3], r[0], r[1])),
             bm.faces.new((e[1], e[2], r[1])), bm.faces.new((e[3], e[0], r[0]))]
    return outward(faces, (x, -z, y0 + rise / 3))


def cone(bm, x, z, rings, sides, apex, turn=0.0):
    """Rings of (radius, height) from the bottom up, then an apex height; a
    radius of 0 is a point. Uncapped at the bottom: it stands in the ground."""
    loops = []
    for r, h in rings:
        if r <= 0:
            loops.append([bm.verts.new(B(x, z, h))])
        else:
            loops.append([bm.verts.new((x + r * math.cos(turn + 2 * math.pi * k / sides),
                                        -z + r * math.sin(turn + 2 * math.pi * k / sides), h))
                          for k in range(sides)])
    top = bm.verts.new(B(x, z, apex))
    faces = []
    for a, b in zip(loops, loops[1:]):
        for k in range(sides):
            if len(a) == 1:
                faces.append(bm.faces.new((a[0], b[(k + 1) % sides], b[k])))
            else:
                faces.append(bm.faces.new((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k])))
    last = loops[-1]
    for k in range(sides):
        faces.append(bm.faces.new((last[k], last[(k + 1) % sides], top)))
    mid = sum(h for _, h in rings) / len(rings)
    return outward(faces, (x, -z, mid))


# ------------------------------------------------------------ the pieces ---
def lines(lo, hi, origin, cuts):
    out = {lo, hi}
    k = 0
    while origin + k * STEP <= hi + 1e-9:
        v = origin + k * STEP
        if v >= lo - 1e-9:
            out.add(round(v, 6))
        k += 1
    out.update(c for c in cuts if lo <= c <= hi)
    return sorted(out)


def terrain(bm, field, cut, coloured):
    (x0, z0), (x1, z1) = cut
    xs = lines(x0, x1, FIELD[0][0], CUT_X)
    zs = lines(z0, z1, FIELD[0][1], CUT_Z)
    grid = [[bm.verts.new(B(x, z, field.height(x, z))) for z in zs] for x in xs]
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            a, b, c, d = grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]
            tris = [(a, b, c), (a, c, d)] if (i + j) % 2 == 0 else [(a, b, d), (b, c, d)]
            cx, cz = (xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2
            colour = ground_colour(field, cx, cz)
            faces = []
            for t in tris:
                f = bm.faces.new(t)
                f.normal_update()
                if f.normal.z < 0:
                    f.normal_flip()
                faces.append(f)
            coloured.append((faces, colour))


def ground_colour(field, x, z):
    d, e = ground_distance(x, z), edge_distance(x, z)
    if not field.clear_of_farms(x, z, PAD_IN):
        return GRASS_LIGHT
    if e < RIM_WIDTH * 0.6:
        return HILL
    if d < FLAT + 4:
        return PASTURE
    if field.low(x, z) and field.height(x, z) < 8.0:
        return field.parcel(x, z)
    return SLOPE if field.n(2, x, z) > 0.5 else GRASS


def tree(bm, field, x, z, tall, r, colour, coloured):
    """A clump: a point in the ground, a ring of five a fifth of the way up,
    and an apex. Its base is the lowest ground under its ring, less 0.3 m, so
    on a slope its downhill side does not hang in the air."""
    turn = x * 0.37 + z * 0.11
    under = [field.height(x, z)] + [field.height(x + r * math.cos(turn + 2 * math.pi * k / 5),
                                                 z - r * math.sin(turn + 2 * math.pi * k / 5)) for k in range(5)]
    base = max(min(under) - 0.3, 0.0)
    faces = cone(bm, x, z, [(0.0, base), (r, base + tall * 0.2)], 5, base + tall, turn=turn)
    coloured.append((faces, colour))


def farmstead(bm, field, fx, fz, turn_deg, coloured):
    """A longhouse, a barn, a fenced yard and a rick, on a levelled pad."""
    t = math.radians(turn_deg)
    c, s = math.cos(t), math.sin(t)
    hp = field.height(fx, fz)
    floor = max(hp - 0.5, 0.0)

    def at(u, v):
        # local (u along, v across, +v north in Blender) to world (x, z)
        bx, by = fx + u * c - v * s, -fz + u * s + v * c
        return bx, -by

    # the longhouse: plaster walls, a thatched roof
    x, z = at(0.0, 4.0)
    coloured.append((rbox(bm, x, z, floor, (14.0, 6.0, hp - floor + 2.6), t), PLASTER))
    coloured.append((gable(bm, x, z, hp + 2.6, 15.0, 7.0, 3.2, t), THATCH))
    # the barn, across the yard's west end
    x, z = at(-3.0, -7.0)
    coloured.append((rbox(bm, x, z, floor, (7.0, 10.0, hp - floor + 3.2), t), TIMBER))
    coloured.append((gable(bm, x, z, hp + 3.2, 11.0, 8.0, 3.5, t + math.pi / 2), THATCH))
    # the rick
    x, z = at(6.0, -7.0)
    coloured.append((cone(bm, x, z, [(1.8, floor), (1.8, hp + 2.0)], 8, hp + 4.2), WHEAT))
    # the yard's fence, open on the house side
    for (u0, v0), (u1, v1) in (((-9.0, -14.0), (-9.0, -1.0)), ((-9.0, -14.0), (10.0, -14.0)),
                               ((10.0, -14.0), (10.0, -1.0))):
        x, z = at((u0 + u1) / 2, (v0 + v1) / 2)
        along = math.hypot(u1 - u0, v1 - v0)
        spin = t + math.atan2(v1 - v0, u1 - u0)
        coloured.append((rbox(bm, x, z, floor, (along, 0.15, hp - floor + 1.1), spin), FENCE))


def fit_quantiser(bm, name):
    """finish.mjs's meshopt() stores a position in 14 signed bits of the
    mesh's largest half-extent, about its box centre, read back as a
    normalised int16 (gltf-transform's quantize: q of 8191, stored as
    q << 2 | q >> 11, over 32767). For a crate that step is a hundredth of a
    millimetre; for a 228 m piece it is 1.4 cm, and the base can come back up
    to 7 mm off y 0, where check 8 line 6 holds it to 1 mm. So the piece's
    top is set, by under 2 cm, to a height whose half the quantiser
    stores exactly, and the base comes back at 0. The top is a crest vertex
    or a tree's apex; nothing else moves."""
    lo = [min(v.co[i] for v in bm.verts) for i in range(3)]
    hi = [max(v.co[i] for v in bm.verts) for i in range(3)]
    if abs(lo[2]) > 1e-6:
        raise ValueError(f'{name}: the lowest point is at {lo[2]:.4f}, not 0; the land meets the apron at y 0')
    height = hi[2] - lo[2]
    half = max(hi[0] - lo[0], hi[1] - lo[1], height) / 2
    q = round(height / (2 * half) * 8191)
    fitted = 2 * half * ((q << 2) | (q >> 11)) / 32767
    if round(fitted / (2 * half) * 8191) != q or abs(fitted - height) > 0.02:
        raise ValueError(f'{name}: fitting the top moved it {abs(fitted - height):.4f} m, and the quantiser would not store it as step {q}')
    for v in bm.verts:
        if v.co.z == hi[2]:
            v.co.z = lo[2] + fitted
    print(f'blender: {name} top {height:.4f} m fitted to {fitted:.4f} m for the quantiser')


def inside(cut, x, z, margin):
    (x0, z0), (x1, z1) = cut
    return x0 + margin <= x <= x1 - margin and z0 + margin <= z <= z1 - margin


def build(row):
    cut = ((float(row['cut']['min'][0]), float(row['cut']['min'][1])),
           (float(row['cut']['max'][0]), float(row['cut']['max'][1])))
    (x0, z0), (x1, z1) = cut
    (fx0, fz0), (fx1, fz1) = FIELD
    if not (fx0 <= x0 < x1 <= fx1 and fz0 <= z0 < z1 <= fz1):
        raise ValueError(f"{row['name']}: cut {cut} is not inside the field {FIELD}")
    if x0 < -140.0:
        raise ValueError(f"{row['name']}: cut {cut} crosses the river's line at x -140 (#796)")
    for fx, fz, _ in FARMS:
        near = rect_distance(fx, fz, CURTAIN)
        if not (60.0 <= near <= 130.0) or near - FARM_REACH < 40.0:
            raise ValueError(f'farm at ({fx}, {fz}) is {near:.1f} m from the curtain, outside 60..130')

    field = Field()
    mat = common.palette_material(row['pack'], PALETTE)
    bm = bmesh.new()
    coloured = []
    terrain(bm, field, cut, coloured)
    for fx, fz, turn in FARMS:
        if inside(cut, fx, fz, FARM_REACH):
            farmstead(bm, field, fx, fz, turn, coloured)
    for x, z, tall, r, colour in field.trees:
        if inside(cut, x, z, r + 0.05):
            tree(bm, field, x, z, tall, r, colour, coloured)

    for faces, colour in coloured:
        for f in faces:
            common.swatch_uv(bm, f, colour)
    fit_quantiser(bm, row['name'])
    mesh = bpy.data.meshes.new(row['name'])
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(row['name'], mesh)
    bpy.context.scene.collection.objects.link(obj)
    common.flat(obj)
    return [obj]


common.main(build)
