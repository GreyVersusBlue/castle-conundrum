# terrain.py - the terrain stage: the ground the castle stands on (increment 1).
#
# A height field 400 m square, centred on the pieces' span (game x -81, z 0, so
# x -281 to 119 and z -200 to 200), exactly PAD_HEIGHT (0) over the pieces'
# footprint plus 10 m, since every gameplay distance is measured from the
# floors (#844 line 5), and displaced outside it by seeded value noise that
# eases in over a PAD_BAND smoothstep, which starts a noisy 0 to PAD_WOBBLE
# metres past the pad so its edge is no straight line. The ground is one
# material, grass and mud mixed by a per-vertex `mud` attribute: seeded
# patches, the steeper slopes and the road's verge, about MUD_SHARE of it mud.
# The road runs from the terrain's west edge to the west gate, flat in its own
# corridor, on the outside-road box's centre line while inside the box and
# wandering west of it, its width varying along its length and its cobbles
# fraying into the mud verge. Trees and rocks are Poly Haven models placed
# from a seeded layout; grass is a Poly Haven model scattered by a seeded
# Geometry Nodes tree over the whole square, pad included, except the road
# and every blueprint piece's and room's footprint, where buildings go. The
# World is lighting.py's from increment 7 (#873); terrain set it from #846 until
# then, and a build without `lighting` has none. No moat.
#
# THE RIVER (7b, #956). Read from two blueprint pieces, none computed (#500):
# RIVER's box gives the water's SURFACE and BOTTOM, BANK's its FOOT, LIP and
# BED. West of FOOT the ground is BED; from FOOT to LIP a straight slope up to
# PAD_HEIGHT; east of LIP the hills' rise is eased by a smoothstep over
# PAD_BAND from the shore, so they come down to the water. West of LIP every
# vertex is mud and no grass grows; WATER_estuary (modelOnly "#956") fills the
# rest of the square west of the shore from BOTTOM to SURFACE, its east edge
# halfway down the slope, under the land. The road starts at the outside-road
# box's west end. A tree or rock west of LIP + KEEP_OFF is not placed, filtered
# in place() after its draws, so every other stands where it stood. The
# backdrops (#960) are left out of the pad and the footprints: the model's
# countryside is this stage's, and allow.json says so.
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
import masonry
import materials

SIZE = 400.0
CENTRE = (-81.0, 0.0)      # game x, z: the pieces' span, x -198 to 36
STEP = 1.0                 # grid spacing, metres
PAD_MARGIN = 10.0          # flat past the pieces' footprint
PAD_HEIGHT = 0.0           # the pad's height; check.py line 5 holds it to 0 +- 0.02
PAD_BAND = 25.0            # metres of smoothstep from the pad's height into the hills
PAD_WOBBLE = (8.0, 30.0)   # the band starts 0 to 8 m further out, by a 30 m noise
OCTAVES = ((90.0, 7.0), (35.0, 2.5), (12.0, 0.6))  # (wavelength, amplitude) in metres
ROAD_PIECE = 'outside-road'  # the blueprint piece the road realises; the road keeps to its centre line
ROAD_GATE = 'west-gate'
ROAD_LIFT = 0.04           # the road ribbon sits this far over the ground
ROAD_ROW = 1.0             # metres between the ribbon's rows
ROAD_ACROSS = 10           # ribbon columns either side of the centre line
ROAD_WIDTH = (3.5, 5.0, 24.0)   # cobbled width from, to, and the noise's wavelength
ROAD_DRIFT = (5.0, 50.0, 30.0)  # west of the box: drift up to 5 m, 50 m wavelength, eased in over 30 m
ROAD_FLAT = (2.5, 16.0)    # past the road's edge: flat for the first, hills by the second
ROAD_FRAY = 1.2            # the ribbon runs this far past the cobbles' edge, fading out
RUT = (0.75, 0.35)         # wheel ruts this far either side of the centre, this wide
VERGE = (1.0, 2.0, 0.6)    # mud from the cobbles' edge out 1 to 2 m by noise, then grass over 0.6 m
KEEP_OFF = 6.0             # trees and rocks stay this far off the pad and the road
GRASS_OFF_ROAD = 1.0       # grass stays this far off the road's edge
GRASS_ROAD_RAMP = (0.5, 3.0)  # then thickens to full over this many metres, by a 3.5 m noise
MUD_SHARE = 0.30           # of the ground's vertices, mud
SLOPE_MUD = (0.30, 0.50)   # rise over run: grass below the first, mud above the second
RIVER = 'quay-water'       # its box: max y the SURFACE, min y the BOTTOM (#956)
BANK = 'quay-bank-north'   # its box: min x the FOOT, max x the LIP, min y the BED (#956)
BANK_TWIN = 'quay-bank-south'  # must span the north bank's x and y
ESTUARY_ONLY = '#956'

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
# 360 degrees, a height in metres (turned into a scale by the model's own
# height, measured from its mesh), a separate height factor on top of it, and
# a lean in a random direction. 7.8 to 10.9 m times 0.9 to 1.1 is 7.0 to 12.0 m.
TREE_METRES = (7.8, 10.9)
TREE_HEIGHT = (0.9, 1.1)
TREE_LEAN = 4.0                   # degrees, at most
ROCKS = {'boulder_01': 24, 'rock_moss_set_02': 36}
ROCK_SPACING = 3.0
ROCK_SCALE = (0.8, 1.25)          # and a yaw; no lean, no height factor
GRASS_DENSITY = 20.0              # clumps per square metre on full grass, in a render
GRASS_VIEW = 0.6                  # clumps per square metre in the viewport (Is Viewport)
GRASS_UNDER_MUD = 0.3             # the density factor left on full mud
GRASS_SCALE = (1.3, 2.6)          # the clumps are 0.16 to 0.4 m as modelled


def smoothstep(a, b, v):
    t = min(1.0, max(0.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


class Lattice:
    """Seeded value noise over the square, -1 to 1: one value per `wave`
    metres, smoothstep-interpolated. `dims` 1 varies along x only."""

    def __init__(self, g, wave, dims=2):
        self.x0, self.z0, self.wave = g.x0, g.z0, wave
        nx = int(math.ceil(SIZE / wave)) + 2
        if dims == 2:
            self.v = [[random.uniform(-1, 1) for _ in range(nx)] for _ in range(nx)]
        else:
            self.v = [random.uniform(-1, 1) for _ in range(nx)]

    def at(self, x, z=None):
        u = (x - self.x0) / self.wave
        i = int(u)
        fu = smoothstep(0, 1, u - i)
        if z is None:
            return self.v[i] + (self.v[i + 1] - self.v[i]) * fu
        v = (z - self.z0) / self.wave
        j = int(v)
        fv = smoothstep(0, 1, v - j)
        lat = self.v
        a = lat[i][j] + (lat[i + 1][j] - lat[i][j]) * fu
        b = lat[i][j + 1] + (lat[i + 1][j + 1] - lat[i][j + 1]) * fu
        return a + (b - a) * fv


class Ground:
    """The height field as a function of game (x, z), and the regions on it."""

    def __init__(self, bp):
        # The backdrops are the game's countryside, not a footprint (#960).
        kept = [p for p in bp['pieces'] if not p.get('backdrop')]
        xs = [c for p in kept for c in (p['box']['min']['x'], p['box']['max']['x'])]
        zs = [c for p in kept for c in (p['box']['min']['z'], p['box']['max']['z'])]
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
        self.gate_x = gate['x']
        # The road keeps to the box's centre line over the box's x span, and
        # wanders only west of the box's west end.
        rb = road['box']
        self.road_x0 = rb['min']['x']
        self.road_z = (rb['min']['z'] + rb['max']['z']) / 2

        # The river (#956), from two pieces' boxes and nothing else.
        by = {p['id']: p for p in bp['pieces']}
        for pid in (RIVER, BANK, BANK_TWIN):
            if pid not in by:
                raise ValueError(f"terrain: the blueprint has no {pid} piece; the river reads its box (#956)")
        nb, sb = by[BANK]['box'], by[BANK_TWIN]['box']
        if any(abs(nb[e][k] - sb[e][k]) > 1e-9 for e in ('min', 'max') for k in 'xy'):
            raise ValueError(f"terrain: {BANK_TWIN}'s x and y span (x {sb['min']['x']} to {sb['max']['x']}, y "
                             f"{sb['min']['y']} to {sb['max']['y']}) differs from {BANK}'s (x {nb['min']['x']} to "
                             f"{nb['max']['x']}, y {nb['min']['y']} to {nb['max']['y']})")
        self.river = by[RIVER]['box']
        self.surface, self.bottom = self.river['max']['y'], self.river['min']['y']
        self.foot, self.lip, self.bed = nb['min']['x'], nb['max']['x'], nb['min']['y']

        # Value-noise lattices, drawn once in a fixed order: the hills first.
        self.hills = [(amp, Lattice(self, wave)) for wave, amp in OCTAVES]
        self.wobble = Lattice(self, PAD_WOBBLE[1])
        self.width = Lattice(self, ROAD_WIDTH[2], 1)
        self.drift = Lattice(self, ROAD_DRIFT[1], 1)
        self.verge = Lattice(self, 4.0)
        self.patches = (Lattice(self, 26.0), Lattice(self, 9.0))
        self.ruts = Lattice(self, 17.0, 1)
        self.puddles = Lattice(self, 5.0)
        self.fray = Lattice(self, 3.5)
        self.rutbreak = Lattice(self, 2.5)

    def in_pad(self, x, z, grow=0.0):
        a, b, c, d = self.pad
        return a - grow <= x <= b + grow and c - grow <= z <= d + grow

    def pad_distance(self, x, z):
        a, b, c, d = self.pad
        dx = max(a - x, 0.0, x - b)
        dz = max(c - z, 0.0, z - d)
        return math.hypot(dx, dz)

    def road_centre(self, x):
        """The road's centre line z at x: the box's centre line, then a drift
        eased in west of the box's west end."""
        if x >= self.road_x0:
            return self.road_z
        ease = smoothstep(self.road_x0, self.road_x0 - ROAD_DRIFT[2], x)
        return self.road_z + ROAD_DRIFT[0] * self.drift.at(x) * ease

    def road_half(self, x):
        """Half the cobbled width at x: 3.5 to 5 m wide by a 1-D noise."""
        lo, hi, _ = ROAD_WIDTH
        t = min(1.0, max(0.0, 0.5 + 0.8 * self.width.at(max(x, self.x0))))
        return (lo + (hi - lo) * t) / 2

    def road_distance(self, x, z):
        """Distance to the road's centre line, from the west edge to the gate."""
        if x <= self.gate_x:
            return abs(z - self.road_centre(x))
        return math.hypot(x - self.gate_x, z - self.road_centre(self.gate_x))

    def hills_at(self, x, z):
        return sum(amp * lat.at(x, z) for amp, lat in self.hills)

    def height(self, x, z):
        # The channel (#956): the bed west of the foot, a straight slope to the lip.
        if x <= self.foot:
            return self.bed
        if x < self.lip:
            return self.bed + (PAD_HEIGHT - self.bed) * (x - self.foot) / (self.lip - self.foot)
        if self.in_pad(x, z):
            return PAD_HEIGHT
        start = PAD_WOBBLE[0] * (self.wobble.at(x, z) + 1) / 2
        rise = smoothstep(0.0, PAD_BAND, self.pad_distance(x, z) - start)
        rise *= smoothstep(self.lip, self.lip + PAD_BAND, x)  # the hills ease down to the shore
        if rise == 0.0:
            return PAD_HEIGHT
        half = self.road_half(min(x, self.gate_x))
        road = smoothstep(half + ROAD_FLAT[0], half + ROAD_FLAT[1], self.road_distance(x, z))
        return PAD_HEIGHT + self.hills_at(x, z) * rise * road

    def on_road(self, x, z, grow=0.0):
        return x <= self.gate_x + grow and self.road_distance(x, z) <= self.road_half(min(x, self.gate_x)) + grow

    def kept_off(self, x, z):
        """True where no tree or rock may stand."""
        return self.in_pad(x, z, KEEP_OFF) or self.on_road(x, z, KEEP_OFF)


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


def footprints(bp):
    """Every blueprint piece's box that is not ground, and every room: the
    places a building or a prop stands, where no grass grows. Boxes as
    (x0, x1, z0, z1); disc rooms as ('disc', cx, cz, r)."""
    out = []
    for p in bp['pieces']:
        if p['kind'] == 'ground' or p.get('backdrop'):  # no grass under a backdrop the model does not draw (#960)
            continue
        b = p['box']
        out.append((b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z']))
    for r in bp['rooms']:
        s = r.get('shape')
        if s and s.get('kind') == 'disc':
            out.append(('disc', s['cx'], s['cz'], s['radius']))
        else:
            b = r['bounds']
            out.append((b['min']['x'], b['max']['x'], b['min']['z'], b['max']['z']))
    return out


def build_ground(g, bp, col, plan_ids):
    n = int(round(SIZE / STEP))
    N = n + 1
    xs = [g.x0 + i * STEP for i in range(N)]
    zs = [g.z0 + j * STEP for j in range(N)]
    H = [[g.height(x, z) for z in zs] for x in xs]
    verts, uvs = [], []
    for i, x in enumerate(xs):
        for j, z in enumerate(zs):
            b = common.to_blender((x, H[i][j], z))
            verts.append(b)
            uvs.append((b[0], b[1]))

    # Mud, per vertex, 0 to 1: the road's verge, the steeper slopes, and
    # seeded patches whose threshold is chosen so MUD_SHARE of the vertices
    # are past 0.5 in all.
    base, patch = [], []
    for i, x in enumerate(xs):
        half = g.road_half(min(x, g.gate_x))
        for j, z in enumerate(zs):
            i0, i1, j0, j1 = max(i - 1, 0), min(i + 1, n), max(j - 1, 0), min(j + 1, n)
            slope = math.hypot((H[i1][j] - H[i0][j]) / ((i1 - i0) * STEP), (H[i][j1] - H[i][j0]) / ((j1 - j0) * STEP))
            edge = half + VERGE[0] + (VERGE[1] - VERGE[0]) * (g.verge.at(x, z) + 1) / 2
            road = 1.0 - smoothstep(edge - VERGE[2], edge, g.road_distance(x, z))
            base.append(max(road, smoothstep(SLOPE_MUD[0], SLOPE_MUD[1], slope)))
            patch.append(g.patches[0].at(x, z) + 0.5 * g.patches[1].at(x, z))
    already = sum(1 for b in base if b > 0.5)
    rest = sorted(p for b, p in zip(base, patch) if b <= 0.5)
    want = max(0, int(MUD_SHARE * len(base)) - already)
    q = rest[len(rest) - want] if 0 < want < len(rest) else (rest[-1] + 1 if want == 0 else rest[0] - 1)
    mud = [max(b, smoothstep(q - 0.12, q + 0.12, p)) for b, p in zip(base, patch)]
    for i, x in enumerate(xs):  # the channel's bed and slope are mud (#956)
        if x < g.lip:
            mud[i * N:(i + 1) * N] = [1.0] * N
    share = sum(1 for m in mud if m > 0.5) / len(mud)

    # Grass, per face, 0 to 1: none on the road plus GRASS_OFF_ROAD or on any
    # footprint, and thinned towards GRASS_UNDER_MUD on mud.
    blocked = bytearray(n * n)

    def block(ia, ib, ja, jb):
        ja, jb = max(ja, 0), min(jb, n - 1)
        if jb < ja:
            return
        for i in range(max(ia, 0), min(ib, n - 1) + 1):
            blocked[i * n + ja: i * n + jb + 1] = b'\x01' * (jb - ja + 1)

    def face_range(a, b, origin):
        # faces whose centre (origin + (k + 0.5) STEP) lies in [a, b]
        return int(math.ceil((a - origin) / STEP - 0.5)), int(math.floor((b - origin) / STEP - 0.5))

    for fp in footprints(bp):
        if fp[0] == 'disc':
            _, cx, cz, r = fp
            ia, ib = face_range(cx - r, cx + r, g.x0)
            for i in range(max(ia, 0), min(ib, n - 1) + 1):
                fx = g.x0 + (i + 0.5) * STEP
                w = math.sqrt(max(0.0, r * r - (fx - cx) ** 2))
                block(i, i, *face_range(cz - w, cz + w, g.z0))
        else:
            ia, ib = face_range(fp[0], fp[1], g.x0)
            block(ia, ib, *face_range(fp[2], fp[3], g.z0))
    for i in range(n):
        fx = g.x0 + (i + 0.5) * STEP
        if fx > g.gate_x:
            break
        c, w = g.road_centre(fx), g.road_half(fx) + GRASS_OFF_ROAD
        block(i, i, *face_range(c - w, c + w, g.z0))

    # Past the bare strip the grass thickens over a ragged GRASS_ROAD_RAMP, so
    # the clumps do not stop on a line parallel to the road.
    grass = []
    for i in range(n):
        fx = g.x0 + (i + 0.5) * STEP
        start = g.road_half(min(fx, g.gate_x)) + GRASS_OFF_ROAD
        for j in range(n):
            if blocked[i * n + j] or fx < g.lip:  # no clump grows under water (#956)
                grass.append(0.0)
                continue
            fz = g.z0 + (j + 0.5) * STEP
            m = (mud[i * N + j] + mud[(i + 1) * N + j] + mud[i * N + j + 1] + mud[(i + 1) * N + j + 1]) / 4
            f = GRASS_UNDER_MUD + (1 - GRASS_UNDER_MUD) * (1 - m) ** 2
            d = g.road_distance(fx, fz)
            if d < start + GRASS_ROAD_RAMP[1]:
                ramp = GRASS_ROAD_RAMP[0] + (GRASS_ROAD_RAMP[1] - GRASS_ROAD_RAMP[0]) * (g.fray.at(fx, fz) + 1) / 2
                f *= smoothstep(start, start + ramp, d)
            grass.append(f)

    faces = [tuple(reversed(f)) for f in _grid(n, n)]  # the winding above faces down in Blender; turn it up
    ob = _mesh(common.TERRAIN, verts, faces, uvs, col)
    me = ob.data
    me.materials.append(materials.ground_blend())
    me.attributes.new('mud', 'FLOAT', 'POINT').data.foreach_set('value', mud)
    me.attributes.new('grass', 'FLOAT', 'FACE').data.foreach_set('value', grass)
    ob['planIds'] = plan_ids
    expected = sum(grass) * STEP * STEP * GRASS_DENSITY
    print(f"terrain: {len(verts)} vertices at {STEP} m, pad x {g.pad[0]} to {g.pad[1]}, z {g.pad[2]} to {g.pad[3]} "
          f"at {PAD_HEIGHT} m, easing over {PAD_BAND} m from 0 to {PAD_WOBBLE[0]} m past it; "
          f"mud {share:.1%} of vertices (patch threshold {q:.3f}), {sum(blocked)} faces kept bare, "
          f"about {expected:,.0f} grass clumps in a render")
    return ob


def build_road(g, col):
    x0, x1 = g.road_x0, g.gate_x  # from the outside-road box's west end, so it ends at the quay (#956)
    n = int(math.ceil((x1 - x0) / ROAD_ROW))
    K = ROAD_ACROSS
    verts, uvs, cover, rut = [], [], [], []
    widths, drift = [], 0.0
    for i in range(n + 1):
        x = min(x0 + i * ROAD_ROW, x1)
        c, half = g.road_centre(x), g.road_half(x)
        widths.append(2 * half)
        drift = max(drift, abs(c - g.road_z))
        ruts = smoothstep(-0.3, 0.3, g.ruts.at(x))  # the ruts come and go along the road
        for k in range(-K, K + 1):
            off = (half + ROAD_FRAY) * k / K
            z = c + off
            b = common.to_blender((x, g.height(x, z) + ROAD_LIFT, z))
            verts.append(b)
            uvs.append((b[0], b[1]))
            a = abs(off)
            fray = 0.8 * g.fray.at(x, z)  # the cobbles' edge wanders by up to 0.8 m
            cover.append(1.0 - smoothstep(half - 0.5 + fray, half + ROAD_FRAY - 0.1, a))
            broken = smoothstep(-0.4, 0.4, g.rutbreak.at(x, z))  # a rut is patches, not a stripe
            wheel = 0.8 * ruts * broken * (1.0 - smoothstep(0.05, RUT[1], abs(a - RUT[0])))
            puddle = smoothstep(0.4, 0.7, g.puddles.at(x, z))
            shoulder = 0.8 * smoothstep(half - 1.0 + fray, half + 0.2 + fray, a)
            rut.append(max(wheel, puddle, shoulder))
    faces = [tuple(reversed(f)) for f in _grid(n, 2 * K)]
    ob = _mesh('TERRAIN_road', verts, faces, uvs, col)
    me = ob.data
    me.materials.append(materials.road())
    me.attributes.new('cover', 'FLOAT', 'POINT').data.foreach_set('value', cover)
    me.attributes.new('rut', 'FLOAT', 'POINT').data.foreach_set('value', rut)
    ob['planId'] = ROAD_PIECE
    ob.visible_shadow = False  # ROAD_LIFT over the ground; its shadow would draw the edge back in
    print(f"terrain: road x {x0} to {x1}, cobbles {min(widths):.2f} to {max(widths):.2f} m wide, on z {g.road_z} "
          f"east of x {g.road_x0}, drifting up to {drift:.2f} m west of it")
    return ob


def build_estuary(g, col):
    """WATER_estuary (modelOnly "#956", no planId): the water west of the shore
    that the plan's slab does not cover, three boxes from BOTTOM to SURFACE.
    Its east edge is halfway down the channel's slope, under the land."""
    r = g.river
    edge = (g.foot + g.lip) / 2
    slabs = [(g.x0, r['min']['x'], g.z0, g.z1),
             (r['min']['x'], edge, g.z0, r['min']['z']),
             (r['min']['x'], edge, r['max']['z'], g.z1)]
    s = masonry.Solid()
    for x0, x1, z0, z1 in slabs:
        s.box(x0, x1, g.bottom, g.surface, z0, z1)
    ob = s.finish('WATER_estuary', col, [materials.water()])
    ob['modelOnly'] = ESTUARY_ONLY
    return slabs


# append_model's memo, {asset: its templates} (#857): a second append of the
# same .blend would rename the mesh (tree_small_02_LOD1.001), MODELS' pattern
# would delete it and the call would raise. So town.py's trees reuse the
# terrain's template when terrain ran, and append it themselves when it did
# not (`--only town`). One Blender builds one file, so the memo is per build.
_APPENDED = {}


def absolute_images(before, folder):
    """Blender resolves an appended // path against the main file, which is
    unsaved until the end: make each image not in `before` absolute against
    the model's `folder`. Returns the new images. props.py calls it too (#864)."""
    new_images = [im for im in bpy.data.images if im not in before]
    for im in new_images:
        if im.filepath.startswith('//'):
            im.filepath = os.path.normpath(os.path.join(folder, im.filepath[2:]))
    return new_images


def append_model(asset, library):
    """Every object of the asset's cached .blend, appended whole; what is not a
    mesh or not in MODELS is deleted, and the rest go into `library`. A second
    call for the same asset returns the first call's templates (_APPENDED),
    and its `library` is not used."""
    if asset in _APPENDED:
        return _APPENDED[asset]
    row = common.source(f"{asset}:blend")
    path = common.cached(row)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"terrain: {row['id']} is not a file at {path}")
    before = set(bpy.data.images)
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = list(src.objects)
    new_images = absolute_images(before, os.path.dirname(path))
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
    _APPENDED[asset] = sorted(keep, key=lambda o: o.name)
    return _APPENDED[asset]


def native_height(ob):
    zs = [v.co.z for v in ob.data.vertices]
    return max(zs) - min(zs)


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


def place(g, col, prefix, templates, points, sink, scale, height=(1.0, 1.0), lean=0.0, native=None, dropped=None):
    """One object per point, sharing its template's mesh (no new meshes). The
    draws are in a fixed order per object, so a rebuild repeats every one.
    With `native` ({template name: its height}), `scale` is in metres of
    height and becomes a scale by the template's own height. Returns each
    object's height before its lean. A point west of LIP + KEEP_OFF (#956)
    makes its draws and is then not placed, counted into `dropped[prefix]`,
    so every later object draws what it drew before and keeps its name."""
    heights = []
    for k, (x, z) in enumerate(points):
        t = random.choice(templates)
        yaw = random.uniform(0.0, 2 * math.pi)
        s = random.uniform(*scale)
        if native is not None:
            s /= native[t.name]
        hz = random.uniform(*height)
        tilt = math.radians(random.uniform(0.0, lean))
        towards = random.uniform(0.0, 2 * math.pi)
        if x < g.lip + KEEP_OFF:
            if dropped is not None:
                dropped[prefix] = dropped.get(prefix, 0) + 1
            continue
        axis = Vector((-math.sin(towards), math.cos(towards), 0.0))  # the top leans along `towards`
        rot = Matrix.Rotation(tilt, 3, axis) @ Matrix.Rotation(yaw, 3, 'Z')
        at = Vector(common.to_blender((x, g.height(x, z) - sink, z)))
        ob = bpy.data.objects.new(f"{prefix}_{k:03d}", t.data)
        ob.matrix_basis = Matrix.Translation(at) @ (rot @ Matrix.Diagonal((s, s, s * hz))).to_4x4()
        ob['model'] = t.name
        col.objects.link(ob)
        if native is not None:
            heights.append(native[t.name] * s * hz)
    return heights


def _socket(sockets, name):
    """The enabled socket called `name`: multi-type nodes carry one per type."""
    for s in sockets:
        if s.name == name and getattr(s, 'enabled', True):
            return s
    raise KeyError(f"terrain: no enabled socket {name} in {[s.name for s in sockets]}")


def build_grass(g, col, terrain, grass_col):
    """A Geometry Nodes scatter of the grass clumps over the terrain, at the
    terrain's per-face `grass` factor times GRASS_DENSITY in a render and
    GRASS_VIEW in the viewport (Is Viewport), seeded from the stage's random."""
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
    attr.data_type = 'FLOAT'
    _socket(attr.inputs, 'Name').default_value = 'grass'
    view = N.new('GeometryNodeIsViewport')
    per = N.new('GeometryNodeSwitch')
    per.input_type = 'FLOAT'
    _socket(per.inputs, 'False').default_value = GRASS_DENSITY
    _socket(per.inputs, 'True').default_value = GRASS_VIEW
    L.new(view.outputs[0], _socket(per.inputs, 'Switch'))
    density = N.new('ShaderNodeMath')
    density.operation = 'MULTIPLY'
    L.new(_socket(attr.outputs, 'Attribute'), density.inputs[0])
    L.new(per.outputs[0], density.inputs[1])
    dist = N.new('GeometryNodeDistributePointsOnFaces')
    dist.distribute_method = 'RANDOM'
    L.new(density.outputs[0], _socket(dist.inputs, 'Density'))
    _socket(dist.inputs, 'Seed').default_value = seed
    L.new(_socket(info.outputs, 'Geometry'), _socket(dist.inputs, 'Mesh'))

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
    mod.show_viewport = True
    mod.show_render = True
    print(f"terrain: grass scatter seed {seed}, {GRASS_DENSITY} clumps per m2 in a render and {GRASS_VIEW} "
          f"in the viewport, times the ground's grass factor")
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
    terrain = build_ground(g, bp, col, [p for p in mine if p != ROAD_PIECE])
    build_road(g, col)
    estuary = build_estuary(g, col)

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
    for mat in {s.material for ob in models['grass_medium_02'] for s in ob.material_slots if s.material}:
        materials.tint_grass(mat)

    native = {t.name: native_height(t) for asset in TREES for t in models[asset]}
    print('terrain: tree models as modelled, ' + ', '.join(f"{k} {v:.2f} m" for k, v in sorted(native.items())))
    centres = scatter(g, GROVES, 30.0, [])
    placed, heights, dropped = [], [], {}
    for asset, n in TREES.items():
        pts = scatter(g, n, TREE_SPACING, placed, centres)
        placed += pts
        heights += place(g, col, f"TREE_{asset}", models[asset], pts, 0.05, TREE_METRES, TREE_HEIGHT, TREE_LEAN, native,
                         dropped)
    for asset, n in ROCKS.items():
        pts = scatter(g, n, ROCK_SPACING, placed)
        placed += pts
        place(g, col, f"ROCK_{asset}", models[asset], pts, 0.15, ROCK_SCALE, dropped=dropped)

    build_grass(g, col, terrain, grass_col)
    gone = sum(dropped.values())
    print(f"terrain: {sum(TREES.values()) - sum(dropped.get(f'TREE_{a}', 0) for a in TREES)} trees in {GROVES} groves, "
          f"{min(heights):.2f} to {max(heights):.2f} m tall, "
          f"{sum(ROCKS.values()) - sum(dropped.get(f'ROCK_{a}', 0) for a in ROCKS)} rocks, planIds {mine}")
    print(f"terrain: river channel foot x {g.foot:g}, lip x {g.lip:g}, bed y {g.bed:g} ({BANK}); water y {g.bottom:g} "
          f"to {g.surface:.2f} ({RIVER}); estuary slabs "
          + '; '.join(f"x {a:g} to {b:g}, z {c:g} to {d:g}" for a, b, c, d in estuary)
          + f"; road x {g.road_x0:g} to {g.gate_x:g}; {gone} dropped west of x {g.lip + KEEP_OFF:g}"
          + (' (' + ', '.join(f"{k[len('TREE_') if k.startswith('TREE_') else len('ROCK_'):]} {v}"
                             for k, v in sorted(dropped.items())) + ')' if dropped else ''))
