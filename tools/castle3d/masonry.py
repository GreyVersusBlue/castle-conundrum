# masonry.py - closed solids for the built stages (walls, towers, gates and
# buildings): prisms whose plan polygon may change with height, so a
# battered face is one ring per height rather than a modifier, and an opening
# is a gap between prisms rather than a boolean (#843: the geometry the checks
# measure is the geometry the build made).
#
# Every number is in the game's frame (x, z in metres, y up) until a vertex is
# written, where common.to_blender turns it into Blender's (x, -z, y).

import math

import bmesh
import bpy

import common


def splay(y, foot, height):
    """How far a battered face stands out at game height y: `foot` metres at
    y 0, easing linearly to nothing at `height`, and nothing above it."""
    if height <= 0 or y >= height:
        return 0.0
    return foot * (1.0 - max(y, 0.0) / height)


def levels(y0, y1, *breaks):
    """y0, every break strictly inside (y0, y1), y1: the rings a prism needs."""
    return [y0] + sorted(b for b in set(breaks) if y0 + 1e-9 < b < y1 - 1e-9) + [y1]


def ring_point(cx, cz, r, theta_deg):
    """The plan's own ring convention (castle-plan.js ringPoint): theta 0 is +z,
    90 is +x."""
    t = math.radians(theta_deg)
    return (cx + r * math.sin(t), cz + r * math.cos(t))


def arc(cx, cz, r, a0, a1, max_step=3.75):
    """Points on the circle from bearing a0 to a1 inclusive, no facet wider
    than max_step degrees."""
    n = max(1, int(math.ceil(abs(a1 - a0) / max_step - 1e-9)))
    return [ring_point(cx, cz, r, a0 + (a1 - a0) * k / n) for k in range(n + 1)]


def clip_rect(poly, x0, x1, z0, z1):
    """A convex plan polygon clipped to an axis-aligned rectangle (Sutherland-
    Hodgman); [] when nothing is left."""
    def cut(pts, inside, meet):
        out = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if inside(p):
                if not inside(q):
                    out.append(meet(q, p))
                out.append(p)
            elif inside(q):
                out.append(meet(q, p))
        return out

    def at_x(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def at_z(z):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]), z)

    pts = list(poly)
    for inside, meet in ((lambda p: p[0] >= x0, at_x(x0)), (lambda p: p[0] <= x1, at_x(x1)),
                         (lambda p: p[1] >= z0, at_z(z0)), (lambda p: p[1] <= z1, at_z(z1))):
        pts = cut(pts, inside, meet) if pts else []
    # drop the near-duplicates a clip leaves where the circle touches an edge
    out = []
    for p in pts:
        if not out or abs(p[0] - out[-1][0]) > 1e-6 or abs(p[1] - out[-1][1]) > 1e-6:
            out.append(p)
    if len(out) > 1 and abs(out[0][0] - out[-1][0]) <= 1e-6 and abs(out[0][1] - out[-1][1]) <= 1e-6:
        out.pop()
    return out if len(out) >= 3 else []


class Solid:
    """Closed prisms gathered into one mesh. `slot` picks the material slot a
    prism's faces take, for an object that carries more than one material."""

    def __init__(self):
        self.bm = bmesh.new()
        self.count = 0

    def _verts(self, pts, y):
        return [self.bm.verts.new(common.to_blender((x, y, z))) for x, z in pts]

    def prism(self, ring, ys, slot=0):
        """ring(y) -> the plan polygon [(x, z), ...] at game height y, the same
        number of points at every y; ys ascending. Closed: sides, foot and top."""
        rings = [self._verts(ring(y), y) for y in ys]
        n = len(rings[0])
        faces = []
        for a, b in zip(rings, rings[1:]):
            for i in range(n):
                j = (i + 1) % n
                faces.append(self.bm.faces.new((a[i], a[j], b[j], b[i])))
        faces.append(self.bm.faces.new(list(reversed(rings[0]))))
        faces.append(self.bm.faces.new(rings[-1]))
        for f in faces:
            f.material_index = slot
        self.count += 1

    def box(self, x0, x1, y0, y1, z0, z1, slot=0):
        if x1 - x0 < 1e-6 or y1 - y0 < 1e-6 or z1 - z0 < 1e-6:
            return
        self.prism(lambda y: [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], [y0, y1], slot)

    def plate(self, poly, z0, z1, slot=0, axis='z'):
        """A closed polygon in a vertical plane, extruded across it. With
        axis 'z' the polygon is [(x, y), ...] in a plane of constant game z,
        extruded from z0 to z1: a gate leaf's plank, drawn in the leaf's own
        frame (gates.py). With axis 'x' it is [(z, y), ...] in a plane of
        constant game x, and z0, z1 are the x it runs between: a truss member
        (buildings.py). Closed: sides and both faces."""
        if z1 - z0 < 1e-6 or len(poly) < 3:
            return
        if axis == 'z':
            def at(u, y, w):
                return common.to_blender((u, y, w))
        elif axis == 'x':
            def at(u, y, w):
                return common.to_blender((w, y, u))
        else:
            raise ValueError(f"masonry.plate: axis {axis!r} is not 'z' or 'x'")
        a = [self.bm.verts.new(at(u, y, z0)) for u, y in poly]
        b = [self.bm.verts.new(at(u, y, z1)) for u, y in poly]
        n = len(poly)
        faces = [self.bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i])) for i in range(n)]
        faces.append(self.bm.faces.new(list(reversed(a))))
        faces.append(self.bm.faces.new(b))
        for f in faces:
            f.material_index = slot
        self.count += 1

    def slab(self, poly, under, thickness, slot=0):
        """A plan polygon [(x, z), ...] lifted onto a surface: its underside
        at under(x, z) and its top `thickness` above that, measured vertically.
        With a plane for `under`, a roof slope. Closed: sides, underside, top."""
        if thickness < 1e-6 or len(poly) < 3:
            return
        a = [self.bm.verts.new(common.to_blender((x, under(x, z), z))) for x, z in poly]
        b = [self.bm.verts.new(common.to_blender((x, under(x, z) + thickness, z))) for x, z in poly]
        n = len(poly)
        faces = [self.bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i])) for i in range(n)]
        faces.append(self.bm.faces.new(list(reversed(a))))
        faces.append(self.bm.faces.new(b))
        for f in faces:
            f.material_index = slot
        self.count += 1

    def cone(self, cx, cz, r, y0, apex, segments, slot=0):
        """A closed cone: a disc foot at y0 and a point at `apex`."""
        base = self._verts([ring_point(cx, cz, r, 360.0 * k / segments) for k in range(segments)], y0)
        top = self.bm.verts.new(common.to_blender((cx, apex, cz)))
        faces = [self.bm.faces.new((base[i], base[(i + 1) % segments], top)) for i in range(segments)]
        faces.append(self.bm.faces.new(list(reversed(base))))
        for f in faces:
            f.material_index = slot
        self.count += 1

    def finish(self, name, col, mats, plan_id=None, plan_ids=None, smooth_angle=35.0):
        """The mesh object `name` in `col`, normals out, a `UVMap` per face by
        its dominant axis (the box projection's own choice, so the normal
        map's tangents agree with it), sharp past `smooth_angle` degrees."""
        bm = self.bm
        if not bm.faces:
            raise ValueError(f"masonry: {name} has no faces")
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        uv = me.uv_layers.new(name='UVMap')
        co = [v.co for v in me.vertices]
        data = []
        for poly in me.polygons:
            nx, ny, nz = (abs(c) for c in poly.normal)
            for li in poly.loop_indices:
                p = co[me.loops[li].vertex_index]
                if nx >= ny and nx >= nz:
                    data += (p.y, p.z)
                elif ny >= nz:
                    data += (p.x, p.z)
                else:
                    data += (p.x, p.y)
        uv.data.foreach_set('uv', data)
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(smooth_angle))
        for m in mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(name, me)
        col.objects.link(ob)
        if plan_id is not None:
            ob['planId'] = plan_id
        if plan_ids is not None:
            ob['planIds'] = list(plan_ids)
        return ob


def colliders_of(bp, piece_id):
    """The plan's colliders for a built piece: its own id, or `<id>-<n>` when
    the plan cut it into boxes round an opening or a stair well."""
    out = [c for c in bp['colliders'] if c['id'] == piece_id or
           (c['id'].startswith(piece_id + '-') and c['id'][len(piece_id) + 1:].isdigit())]
    if not out:
        raise ValueError(f"masonry: the blueprint has no collider for {piece_id}")
    return out


def minus_discs(rect, discs, max_step=3.75, eps=1e-6):
    """The plan rectangle (x0, x1, z0, z1) less each disc (cx, cz, r) that
    cuts one of its edges or one of its corners, as one polygon [(x, z), ...]
    for Solid.prism or Solid.slab: the outline walked round, and each cut
    replaced by the disc's arc through the rectangle at `max_step` degrees
    (arc's own step). A disc that does not reach the rectangle is ignored. One
    that lies wholly inside it, holds it whole, crosses its outline other than
    twice, takes more than one corner or overlaps another disc's cut raises,
    naming it: the result would not be one simple polygon."""
    x0, x1, z0, z1 = rect
    corners = [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]
    lengths = [x1 - x0, z1 - z0, x1 - x0, z1 - z0]
    starts = [sum(lengths[:i]) for i in range(4)]
    perimeter = sum(lengths)

    def point(s):
        s %= perimeter
        for i in range(4):
            if s <= starts[i] + lengths[i] + eps or i == 3:
                t = min(max((s - starts[i]) / lengths[i], 0.0), 1.0)
                (ax, az), (bx, bz) = corners[i], corners[(i + 1) % 4]
                return (ax + (bx - ax) * t, az + (bz - az) * t)

    def inside_rect(p):
        return x0 + eps < p[0] < x1 - eps and z0 + eps < p[1] < z1 - eps

    cuts = []
    for cx, cz, r in discs:
        nx, nz = min(max(cx, x0), x1), min(max(cz, z0), z1)
        if math.hypot(nx - cx, nz - cz) >= r - eps:
            continue
        name = f"disc ({cx:g}, {cz:g}) r {r:g}"
        if all(math.hypot(px - cx, pz - cz) <= r + eps for px, pz in corners):
            raise ValueError(f"masonry.minus_discs: {name} holds the whole rectangle x {x0:g} to {x1:g}, z {z0:g} to {z1:g}")
        cross = []
        for i in range(4):
            (ax, az), (bx, bz) = corners[i], corners[(i + 1) % 4]
            dx, dz = bx - ax, bz - az
            fx, fz = ax - cx, az - cz
            qa = dx * dx + dz * dz
            qb = 2 * (fx * dx + fz * dz)
            qc = fx * fx + fz * fz - r * r
            disc = qb * qb - 4 * qa * qc
            if disc <= eps:
                continue
            root = math.sqrt(disc)
            for t in ((-qb - root) / (2 * qa), (-qb + root) / (2 * qa)):
                if -eps <= t < 1 - eps:
                    s = starts[i] + max(t, 0.0) * lengths[i]
                    if not any(abs(s - c) < 1e-5 for c in cross):
                        cross.append(s)
        if not cross:
            raise ValueError(f"masonry.minus_discs: {name} lies wholly inside the rectangle x {x0:g} to {x1:g}, "
                             f"z {z0:g} to {z1:g}")
        if len(cross) != 2:
            raise ValueError(f"masonry.minus_discs: {name} crosses the rectangle's outline {len(cross)} times; "
                             f"it splits the rectangle")
        sa, sb = sorted(cross)
        mx, mz = point((sa + sb) / 2)
        if math.hypot(mx - cx, mz - cz) < r:
            a, b = sa, sb
        else:
            a, b = sb, sa + perimeter
        taken = sum(1 for c in starts if a < c < b or a < c + perimeter < b)
        if taken > 1:
            raise ValueError(f"masonry.minus_discs: {name} takes {taken} corners of the rectangle; it splits it")
        cuts.append((a, b, (cx, cz, r)))
    if not cuts:
        return list(corners)
    cuts.sort(key=lambda c: c[0])
    for (a, b, d), (a2, _b2, d2) in zip(cuts, cuts[1:] + [(cuts[0][0] + perimeter, 0, cuts[0][2])]):
        if b > a2 + eps:
            raise ValueError(f"masonry.minus_discs: the cuts of discs {d} and {d2} overlap on the rectangle's outline")

    def bearing(cx, cz, p):
        return math.degrees(math.atan2(p[0] - cx, p[1] - cz))

    out = []
    for k, (a, b, (cx, cz, r)) in enumerate(cuts):
        pa, pb = point(a), point(b)
        ta, tb = bearing(cx, cz, pa), bearing(cx, cz, pb)
        up = tb if tb > ta else tb + 360.0
        down = tb if tb < ta else tb - 360.0
        mid = ring_point(cx, cz, r, (ta + up) / 2)
        pts = arc(cx, cz, r, ta, up if inside_rect(mid) else down, max_step)
        out += [pa] + pts[1:-1] + [pb]
        nxt = cuts[(k + 1) % len(cuts)][0]
        if nxt <= b:
            nxt += perimeter
        out += [point(cc) for cc in sorted(c + k * perimeter for c in starts for k in range(3))
                if b + eps < cc < nxt - eps]
    return out
