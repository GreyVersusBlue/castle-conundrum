# kit.py - low-poly primitives that UV themselves into atlas cells, a prop
# container with named pivot nodes, and the glb export.
#
# Blender is Z-up and the front of every prop faces -Y, which the glTF
# exporter turns into Y-up with the front facing +Z.

import math
import bpy
import bmesh
from mathutils import Vector, Matrix, Euler, Quaternion

import atlas

def _mat(loc, rot, scl):
    R = Euler(tuple(math.radians(a) for a in rot), 'XYZ').to_matrix().to_4x4()
    S = Matrix.Diagonal((scl[0], scl[1], scl[2], 1.0))
    return Matrix.Translation(loc) @ R @ S


def _dir_key(n):
    ax = max(range(3), key=lambda i: abs(n[i]))
    return ('+' if n[ax] >= 0 else '-') + 'xyz'[ax]


def _face_uv(f, uvl, rect, inset=0.5, rotate=0):
    n = f.normal
    ax = max(range(3), key=lambda i: abs(n[i]))
    pts = []
    for l in f.loops:
        c = l.vert.co
        if ax == 0:
            u, v = (c.y if n.x >= 0 else -c.y), c.z
        elif ax == 1:
            u, v = (-c.x if n.y >= 0 else c.x), c.z
        else:
            u, v = c.x, (c.y if n.z >= 0 else -c.y)
        pts.append((u, v))
    us = [p[0] for p in pts]; vs = [p[1] for p in pts]
    u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
    du = (u1 - u0) or 1.0; dv = (v1 - v0) or 1.0
    a0, b0, a1, b1 = atlas.uv_rect(rect, inset)
    for l, (u, v) in zip(f.loops, pts):
        s, t = (u - u0) / du, (v - v0) / dv
        for _ in range(rotate % 4):
            s, t = t, 1 - s
        l[uvl].uv = (a0 + s * (a1 - a0), b0 + t * (b1 - b0))


def _rect(c):
    if isinstance(c, str):
        return atlas.cell(c)
    return c


def sub(c, fx0, fy0, fx1, fy1):
    """Part of a tile, as fractions of it (top-left origin)."""
    x, y, w, h = _rect(c)
    return (x + fx0 * w, y + fy0 * h, (fx1 - fx0) * w, (fy1 - fy0) * h)


class Mesh:
    def __init__(self, prop, name, pivot=(0, 0, 0), parent=None):
        self.prop, self.name, self.pivot, self.parent = prop, name, Vector(pivot), parent
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('UVMap')

    # -- internal: transform new geometry and texture it
    def _finish(self, verts, faces, loc, rot, scl, cell, cells, recalc=True, inset=0.5, rotate=0):
        M = _mat(Vector(loc), rot, scl)
        for v in verts:
            v.co = M @ v.co
        if recalc:
            bmesh.ops.recalc_face_normals(self.bm, faces=faces)
        for f in faces:
            f.normal_update()
            c = cell
            if cells:
                c = cells.get(_dir_key(f.normal), cells.get('side', cell))
            _face_uv(f, self.uv, _rect(c), inset, rotate)
            f.smooth = False
        return faces

    def box(self, size, loc=(0, 0, 0), cell='wood', rot=(0, 0, 0), cells=None, base=False, rotate=0):
        r = bmesh.ops.create_cube(self.bm, size=1.0)
        verts = r['verts']
        faces = list({f for v in verts for f in v.link_faces})
        loc = Vector(loc)
        if base:
            # loc is the bottom centre of the box, in its own frame
            off = Matrix.Translation((0, 0, 0.5))
            for v in verts:
                v.co = off @ v.co
        return self._finish(verts, faces, loc, rot, size, cell, cells, rotate=rotate)

    def cyl(self, r, h, loc=(0, 0, 0), cell='wood', rot=(0, 0, 0), seg=8, r2=None, cells=None, scl=(1, 1, 1), phase=0.0):
        """Base centre at loc, axis along local +Z."""
        r2 = r if r2 is None else r2
        prof = [(0, 0), (r, 0), (r2, h), (0, h)]
        return self.lathe(prof, loc, cell, rot, seg, cells=cells, scl=scl, phase=phase)

    def lathe(self, prof, loc=(0, 0, 0), cell='wood', rot=(0, 0, 0), seg=8, bands=None, cells=None, scl=(1, 1, 1), phase=0.0):
        """prof: [(radius, z), ...] bottom to top. radius 0 makes a pole.
        bands: optional cell per profile segment (len(prof)-1), overriding cell."""
        bm = self.bm
        rings = []
        ph = math.radians(phase) + (math.pi / seg)
        for (rr, z) in prof:
            if rr <= 1e-6:
                rings.append([bm.verts.new((0, 0, z))])
            else:
                rings.append([bm.verts.new((rr * math.cos(ph + 2 * math.pi * j / seg), rr * math.sin(ph + 2 * math.pi * j / seg), z)) for j in range(seg)])
        faces, fband = [], []
        for i in range(len(rings) - 1):
            A, B = rings[i], rings[i + 1]
            for j in range(seg):
                j2 = (j + 1) % seg
                if len(A) == 1 and len(B) == 1:
                    continue
                if len(A) == 1:
                    f = bm.faces.new((A[0], B[j], B[j2]))
                elif len(B) == 1:
                    f = bm.faces.new((A[j], A[j2], B[0]))
                else:
                    f = bm.faces.new((A[j], A[j2], B[j2], B[j]))
                faces.append(f); fband.append(i)
        if len(rings[0]) > 1:
            faces.append(bm.faces.new(list(reversed(rings[0])))); fband.append(0)
        if len(rings[-1]) > 1:
            faces.append(bm.faces.new(rings[-1])); fband.append(len(prof) - 2)
        verts = [v for r in rings for v in r]
        M = _mat(Vector(loc), rot, scl)
        for v in verts:
            v.co = M @ v.co
        bmesh.ops.recalc_face_normals(bm, faces=faces)
        for f, b in zip(faces, fband):
            f.normal_update()
            c = bands[b] if bands else cell
            if cells:
                c = cells.get(_dir_key(f.normal), c)
            _face_uv(f, self.uv, _rect(c))
            f.smooth = False
        return faces

    def sphere(self, r, loc=(0, 0, 0), cell='stone', seg=8, rings=5, scl=(1, 1, 1), rot=(0, 0, 0), bands=None):
        prof = []
        for i in range(rings + 1):
            a = -math.pi / 2 + math.pi * i / rings
            prof.append((r * math.cos(a) if 0 < i < rings else 0.0, r * math.sin(a)))
        return self.lathe(prof, loc, cell, rot, seg, bands=bands, scl=scl)

    def poly(self, pts, thick, loc=(0, 0, 0), cell='wood', rot=(0, 0, 0), cells=None, front=None, scl=(1, 1, 1)):
        """Extrude a 2D outline drawn in XZ along Y (centred). front: cell for the -Y face."""
        bm = self.bm
        F = [bm.verts.new((x, -thick / 2, z)) for x, z in pts]
        B = [bm.verts.new((x, thick / 2, z)) for x, z in pts]
        faces = [bm.faces.new(F), bm.faces.new(list(reversed(B)))]
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            faces.append(bm.faces.new((F[i], F[j], B[j], B[i])))
        if front:
            cells = dict(cells or {})
            cells['-y'] = front
            cells.setdefault('side', cell)
        # the -Y cap must keep -Y before rotation for `front` to find it
        if front:
            bmesh.ops.recalc_face_normals(bm, faces=faces)
            for f in faces:
                f.normal_update()
                c = cells.get(_dir_key(f.normal), cells.get('side', cell))
                _face_uv(f, self.uv, _rect(c))
                f.smooth = False
            M = _mat(Vector(loc), rot, scl)
            for v in F + B:
                v.co = M @ v.co
            for f in faces:
                f.normal_update()
            return faces
        return self._finish(F + B, faces, loc, rot, scl, cell, cells)

    def slab(self, pts, thick, loc=(0, 0, 0), cell='wood', top=None, rot=(0, 0, 0), cells=None):
        """Extrude a 2D outline drawn in XY upward by thick. top: cell for the +Z face."""
        bm = self.bm
        B = [bm.verts.new((x, y, 0)) for x, y in pts]
        T = [bm.verts.new((x, y, thick)) for x, y in pts]
        faces = [bm.faces.new(T), bm.faces.new(list(reversed(B)))]
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            faces.append(bm.faces.new((B[i], B[j], T[j], T[i])))
        cells = dict(cells or {})
        if top:
            cells['+z'] = top
        cells.setdefault('side', cell)
        return self._finish(B + T, faces, loc, rot, (1, 1, 1), cell, cells)

    def transform(self, loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
        """Move everything this node holds so far."""
        M = _mat(Vector(loc), rot, scl)
        bmesh.ops.transform(self.bm, matrix=M, verts=self.bm.verts[:])
        self.bm.normal_update()

    def drop(self, z=0.0):
        """Shift this node so its lowest point sits at z."""
        lo = min(v.co.z for v in self.bm.verts)
        bmesh.ops.translate(self.bm, vec=(0, 0, z - lo), verts=self.bm.verts[:])

    def quad(self, w, h, loc=(0, 0, 0), cell='wood', rot=(0, 0, 0), two_sided=False):
        """A single plane in XZ facing -Y, centred on loc. For cutout cards."""
        bm = self.bm
        vs = [bm.verts.new(p) for p in ((-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2))]
        f = bm.faces.new(vs)
        f.normal_update()
        if f.normal.y > 0:
            f.normal_flip()
        _face_uv(f, self.uv, _rect(cell))
        faces = [f]
        M = _mat(Vector(loc), rot, (1, 1, 1))
        for v in vs:
            v.co = M @ v.co
        f.normal_update()
        return faces

    def loft(self, sections, cell='wood', bands=None, cap=True):
        """sections: list of closed loops, each the same number of 3D points.
        Quads join loop i to loop i+1; the two end loops are capped."""
        bm = self.bm
        rings = [[bm.verts.new(p) for p in s] for s in sections]
        n = len(sections[0])
        faces, fb = [], []
        for i in range(len(rings) - 1):
            A, B = rings[i], rings[i + 1]
            for j in range(n):
                j2 = (j + 1) % n
                faces.append(bm.faces.new((A[j], A[j2], B[j2], B[j])))
                fb.append(bands[j] if bands else cell)
        if cap:
            faces.append(bm.faces.new(list(reversed(rings[0])))); fb.append(cell)
            faces.append(bm.faces.new(rings[-1])); fb.append(cell)
        bmesh.ops.recalc_face_normals(bm, faces=faces)
        for f, c in zip(faces, fb):
            f.normal_update()
            _face_uv(f, self.uv, _rect(c))
            f.smooth = False
        return faces

    def tri_card(self, pts3, cell, uvs):
        """A raw polygon card with explicit UVs in tile fractions (top-left origin)."""
        bm = self.bm
        vs = [bm.verts.new(p) for p in pts3]
        f = bm.faces.new(vs)
        f.normal_update()
        x, y, w, h = _rect(cell)
        for l, (s, t) in zip(f.loops, uvs):
            px, py = x + 0.5 + s * (w - 1), y + 0.5 + t * (h - 1)
            l[self.uv].uv = (px / atlas.SIZE, 1 - py / atlas.SIZE)
        f.smooth = False
        f.normal_update()
        return [f]

    def rod(self, p1, p2, r, cell='wood', seg=6, r2=None, cells=None):
        p1, p2 = Vector(p1), Vector(p2)
        d = p2 - p1
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        e = q.to_euler('XYZ')
        return self.cyl(r, d.length, p1, cell, rot=tuple(math.degrees(a) for a in e), seg=seg, r2=r2, cells=cells)

    def beam(self, p1, p2, w, h, cell='wood', roll=0.0):
        """A box from p1 to p2 with a w x h section."""
        p1, p2 = Vector(p1), Vector(p2)
        d = p2 - p1
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        q = q @ Quaternion((0, 0, 1), math.radians(roll))
        e = q.to_euler('XYZ')
        mid = (p1 + p2) / 2
        return self.box((w, h, d.length), mid, cell, rot=tuple(math.degrees(a) for a in e))

    def torus(self, R, r, loc=(0, 0, 0), cell='iron', rot=(0, 0, 0), seg=10, seg2=4, arc=360.0):
        bm = self.bm
        full = abs(arc - 360.0) < 1e-6
        n_major = seg if full else seg + 1
        rings = []
        for i in range(n_major):
            a = math.radians(arc) * i / seg
            ring = []
            for j in range(seg2):
                b = 2 * math.pi * j / seg2 + math.pi / seg2
                rr = R + r * math.cos(b)
                ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), r * math.sin(b))))
            rings.append(ring)
        faces = []
        for i in range(seg if full else seg):
            A, B = rings[i], rings[(i + 1) % n_major]
            for j in range(seg2):
                j2 = (j + 1) % seg2
                faces.append(bm.faces.new((A[j], B[j], B[j2], A[j2])))
        if not full:
            faces.append(bm.faces.new(list(reversed(rings[0]))))
            faces.append(bm.faces.new(rings[-1]))
        verts = [v for r_ in rings for v in r_]
        return self._finish(verts, faces, Vector(loc), rot, (1, 1, 1), cell, None)

    def nine_slice(self, w, d, z, cell, border_m, border_frac=3 / 16):
        """A flat top face (+Z) of w x d at height z, split 3x3 so a tile's
        border stays border_m wide whatever the size."""
        bm = self.bm
        xs = [-w / 2, -w / 2 + border_m, w / 2 - border_m, w / 2]
        ys = [-d / 2, -d / 2 + border_m, d / 2 - border_m, d / 2]
        fs = [0, border_frac, 1 - border_frac, 1]
        x0, y0, tw, th = _rect(cell)
        V = [[bm.verts.new((xs[i], ys[j], z)) for i in range(4)] for j in range(4)]
        faces = []
        for j in range(3):
            for i in range(3):
                f = bm.faces.new((V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]))
                for l in f.loops:
                    ii = min(range(4), key=lambda k: abs(xs[k] - l.vert.co.x))
                    jj = min(range(4), key=lambda k: abs(ys[k] - l.vert.co.y))
                    px = x0 + 0.5 + fs[ii] * (tw - 1)
                    py = y0 + 0.5 + (1 - fs[jj]) * (th - 1)
                    l[self.uv].uv = (px / atlas.SIZE, 1 - py / atlas.SIZE)
                f.smooth = False
                faces.append(f)
        return faces


class Prop:
    def __init__(self, pid, title, cutout=False, category=''):
        self.id, self.title, self.cutout, self.category = pid, title, cutout, category
        self.meshes = []
        self.notes = ''

    def mesh(self, name=None, pivot=(0, 0, 0), parent=None):
        m = Mesh(self, name or self.id, pivot, parent)
        self.meshes.append(m)
        return m

    def build(self, material, collection, recentre=True):
        # recentre: bbox centre in XY, min Z to 0
        lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
        for m in self.meshes:
            for v in m.bm.verts:
                for i in range(3):
                    lo[i] = min(lo[i], v.co[i]); hi[i] = max(hi[i], v.co[i])
        shift = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)) if recentre else Vector()
        self.dims = hi - lo
        root = bpy.data.objects.new(self.id, None)
        collection.objects.link(root)
        objs = {}
        tris = 0
        for m in self.meshes:
            piv = m.pivot + shift
            for v in m.bm.verts:
                v.co = v.co + shift - piv
            me = bpy.data.meshes.new(m.name)
            m.bm.to_mesh(me)
            m.bm.free()
            me.materials.append(material)
            me.calc_loop_triangles()
            tris += len(me.loop_triangles)
            ob = bpy.data.objects.new(m.name, me)
            collection.objects.link(ob)
            objs[m.name] = (ob, piv)
        for m in self.meshes:
            ob, piv = objs[m.name]
            if m.parent:
                pob, ppiv = objs[m.parent]
                ob.parent = pob
                ob.location = piv - ppiv
            else:
                ob.parent = root
                ob.location = piv
        self.root = root
        self.tris = tris
        self.nodes = [(m.name, tuple(round(c, 3) for c in objs[m.name][1]), m.parent) for m in self.meshes]
        return root


def make_material(name, image, cutout=False):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = image
    tex.interpolation = 'Closest'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 1.0
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.0
    if cutout:
        # Greater Than before Alpha is what the glTF exporter reads as MASK
        clip = nt.nodes.new('ShaderNodeMath')
        clip.operation = 'GREATER_THAN'
        clip.inputs[1].default_value = 0.5
        nt.links.new(tex.outputs['Alpha'], clip.inputs[0])
        nt.links.new(clip.outputs[0], bsdf.inputs['Alpha'])
        mat.use_backface_culling = False
        try:
            mat.surface_render_method = 'DITHERED'
        except Exception:
            pass
    else:
        mat.use_backface_culling = True
    return mat


def select_tree(root):
    bpy.ops.object.select_all(action='DESELECT')
    stack = [root]
    while stack:
        o = stack.pop()
        o.select_set(True)
        stack.extend(o.children)


def export_glb(root, path):
    select_tree(root)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_materials='EXPORT',
        export_image_format='AUTO',
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_vertex_color='NONE',
    )
