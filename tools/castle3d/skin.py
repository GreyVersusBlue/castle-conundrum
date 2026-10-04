# skin.py - rank 2i (#963 to #968): <out>/skin/skin-full.glb from the master.
#
#   blender -b <out>/castle.blend --factory-startup --python-exit-code 1
#           --python tools/castle3d/skin.py -- --out <out>
#
# A fourth Blender over the master, launched by skin.mjs (`npm run
# castle3d:skin`). It opens castle.blend and NEVER SAVES IT: there is no save
# call anywhere in this file, and the master's sha256 before and after a run is
# the proof (#963). Everything below happens to the open file in memory, then
# one glTF export writes the skin, every stage in one file; skin.mjs cuts it.
#
# In order (SPECS.md, "Castle in Blender: the integration row", scope):
#  1. delete what never ships (#964): the `props` stage's objects (the PROPS
#     collection), every BRAZIER_ and its children, every #853 and #855 object
#     (by `modelOnly`), GUIDE and MARKERS. A kept object whose parent goes (each
#     LEAF_ under its GATE_<id>_HINGE) is unparented with its world transform
#     kept, which is what export.py's exporter does when it drops a hinge.
#  2. LOD by decimation (#968): each tree mesh to TREE_CAP triangles (the trunk
#     and branches by Decimate, the leaves by seeded card thinning with the kept
#     cards scaled to hold cover), each rock mesh to ROCK_CAP, TERRAIN_ground to
#     GROUND_CAP. The meshes are shared, so a cap is per tree, per rock. Then
#     the land's trees join to one object per species and its rocks to one per
#     mesh (#968, joining not instancing), each joined object carrying
#     `joined`, the count it holds, written as extras.joined (#1004).
#     Mereford's five trees are plan pieces and keep a node each, on the one
#     decimated mesh.
#  3. the bake, arithmetic only (#968): materials.LOOK's constant `tint` and
#     `warm` into a copy of the set's base colour pixels with numpy, the grime,
#     undulation and drift dropped; #857's per-house `object_tint` (the
#     object's colour) into a colour attribute the exporter writes as COLOR_0,
#     white on every face whose material is not object-tinted.
#  4. caps (#968): every image a remaining material reads into Base Color,
#     Alpha or Emission at most BASE_CAP, into Normal, Roughness or Metallic at
#     most DATA_CAP, scaled in memory and marked dirty so the exporter encodes
#     the scaled pixels rather than re-reading the cached file.
#  5. `stage` on every exported object, from common.STAGE_OF through SKIN_OF
#     and #964's admit table; an object neither names is an error, named.
#  6. export with export.py's options (#897), Draco off, to
#     <out>/skin/skin-full.part.glb, moved onto skin-full.glb.
#
# Refuses CI (#842) and, through common.py's pin, any Blender but 5.2 (#840).
# Renders nothing. Deterministic (#968): every order below is sorted or seeded
# by a string, so two runs over one master write the same bytes.

import os
import sys
import math
import random
import hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # no __pycache__ in the repo
sys.path.insert(0, HERE)

# Before anything else: never under CI (#842). Exit 2, so it reads differently
# from a Python exception (1) and from the pin (3).
if os.environ.get('CI', '') != '':
    print(f"skin.py: CI is set ({os.environ['CI']!r}); the skin is cut on Devon's machine only, never in CI (#842)")
    sys.stdout.flush()
    sys.exit(2)

import bpy
import bmesh
import numpy as np

import common  # the pin: exits 3 on anything but 5.2 (#840)
import materials  # LOOK, read here, never applied twice

argv = common.args_after_dashes()
out = common.arg(argv, '--out')
if not out:
    raise SystemExit('skin.py: needs -- --out <dir>')

# ----------------------------------------------------------------- the table --
TREE_CAP = 2000      # triangles per tree (#968)
LEAF_SHARE = 1200    # of TREE_CAP, the leaf cards'; the rest is the wood's
WOOD_PARTS = 48      # loose parts of trunk and branch kept before Decimate, largest first
ROCK_CAP = 1000      # triangles per rock (#968)
GROUND_CAP = 40000   # TERRAIN_ground (#968)
BASE_CAP = 1024      # px, base colour (#968)
DATA_CAP = 512       # px, normal and metal-roughness (#968)

# common.STAGE_OF's build stage -> the skin's stage (#964). `props` is absent:
# the game owns its props, and a planId whose stage is props is an error here.
SKIN_OF = {'walls': 'curtain', 'towers': 'curtain', 'gates': 'curtain',
           'buildings': 'buildings', 'town': 'town', 'terrain': 'land'}
SKIN_STAGES = ['curtain', 'buildings', 'town', 'land']
# What a stage admits that has no plan id (#964).
ADMIT_MODEL_ONLY = {'#851': 'curtain', '#854': 'buildings', '#857': 'town', '#956': 'town', '#957': 'town'}
ADMIT_NAMED = {'PORT_west-gate': 'curtain'}
NEVER_MODEL_ONLY = {'#853', '#855'}
LAND_PREFIXES = ('TREES_', 'ROCKS_', 'TERRAIN_')
DELETE_COLLECTIONS = ['PROPS', 'GUIDE', 'MARKERS']

# ------------------------------------------------------------- the master only --
scene = bpy.context.scene
master = os.path.join(out, 'castle.blend')
stages = (scene.get('castle3d_stages') or '').split(',')
if stages != common.STAGES:
    raise RuntimeError(f"skin.py: {bpy.data.filepath} was built with stages {','.join(stages) or '(none)'}, "
                       f"not the full build; the skin is cut from the master only (#963)")
if os.path.normcase(os.path.abspath(bpy.data.filepath)) != os.path.normcase(os.path.abspath(master)):
    raise RuntimeError(f"skin.py: opened {bpy.data.filepath}, not {master}")
bp = common.load_blueprint(os.path.join(out, 'blueprint.json'))
STAGE = common.STAGE_OF(bp)


def tris_of(me):
    n = len(me.polygons)
    if n == 0:
        return 0
    lt = np.empty(n, dtype=np.int64)
    me.polygons.foreach_get('loop_total', lt)
    return int((lt - 2).sum())


def mats_of(ob):
    return [s.material for s in ob.material_slots]


# ------------------------------------------------------------ 1. what never ships --
doomed = set()
for cname in DELETE_COLLECTIONS:
    col = bpy.data.collections.get(cname)
    if col is None:
        raise RuntimeError(f"skin.py: the master has no {cname} collection")
    doomed.update(col.all_objects)
for ob in bpy.data.objects:
    if ob.name.startswith('BRAZIER_') or ob.get('modelOnly') in NEVER_MODEL_ONLY:
        doomed.add(ob)
        doomed.update(ob.children_recursive)
for ob in sorted(bpy.data.objects, key=lambda o: o.name):
    if ob not in doomed and ob.parent is not None and ob.parent in doomed:
        mw = ob.matrix_world.copy()
        ob.parent = None
        ob.matrix_world = mw
removed = len(doomed)
bpy.data.batch_remove(list(doomed))
print(f"skin: deleted {removed} objects (PROPS, GUIDE, MARKERS, BRAZIER_, #853, #855)")


# ---------------------------------------------------------------- 2. decimation --
def decimate(me, target, label):
    """A new mesh from `me` through a Collapse Decimate (triangulating), its
    ratio stepped down until the result is at most `target` triangles."""
    have = tris_of(me)
    if have <= target:
        return me
    tmp = bpy.data.objects.new('__skin_decimate', me)
    scene.collection.objects.link(tmp)
    md = tmp.modifiers.new('decimate', 'DECIMATE')
    md.decimate_type = 'COLLAPSE'
    md.use_collapse_triangulate = True
    ratio = target / have
    new = None
    for _ in range(12):
        md.ratio = ratio
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()
        new = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        got = tris_of(new)
        if got <= target:
            break
        bpy.data.meshes.remove(new)
        new = None
        ratio *= 0.98 * target / got
    bpy.data.objects.remove(tmp)
    if new is None:
        raise RuntimeError(f"skin.py: {label}: Decimate could not bring {me.name} ({have} triangles) to {target}")
    new.name = f"{me.name}_skin"
    return new


def loose_parts(faces):
    """`faces` grouped by shared vertices, each group in face order, the groups
    in order of their first face. Union-find over vertex indices."""
    parent = {}

    def find(a):
        while parent.get(a, a) != a:
            parent[a] = parent.get(parent[a], parent[a])
            a = parent[a]
        return a
    for f in faces:
        vs = [v.index for v in f.verts]
        r0 = find(vs[0])
        for v in vs[1:]:
            r = find(v)
            if r != r0:
                parent[r] = r0
    groups = {}
    for f in faces:
        groups.setdefault(find(f.verts[0].index), []).append(f)
    return sorted(groups.values(), key=lambda g: g[0].index)


def ftris(f):
    return len(f.verts) - 2


def part_of(me, keep_leaves):
    """A copy of `me` holding only its leaf faces (keep_leaves) or only the rest."""
    leaf = {i for i, m in enumerate(me.materials) if m is not None and 'leaves' in m.name}
    bm = bmesh.new()
    bm.from_mesh(me)
    drop = [f for f in bm.faces if (f.material_index in leaf) != keep_leaves]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    return bm


def reduce_tree(me, species):
    """At most TREE_CAP triangles: the leaf cards thinned by a seeded draw to
    LEAF_SHARE, each kept card scaled about its centre by sqrt(all area / kept
    area) so the crown holds its cover (#968); the trunk and branches cut to
    their WOOD_PARTS largest loose parts and Decimated to the rest."""
    # the leaves
    bm = part_of(me, True)
    bm.faces.ensure_lookup_table()
    parts = loose_parts(list(bm.faces))
    area = [sum(f.calc_area() for f in p) for p in parts]
    order = list(range(len(parts)))
    random.Random(f"skin.py leaves {species}").shuffle(order)
    kept, used = [], 0
    for i in order:
        t = sum(ftris(f) for f in parts[i])
        if used + t <= LEAF_SHARE:
            kept.append(i)
            used += t
    kept_set = set(kept)
    scale = math.sqrt(sum(area) / sum(area[i] for i in kept)) if kept else 1.0
    for i in sorted(kept):
        verts = sorted({v for f in parts[i] for v in f.verts}, key=lambda v: v.index)
        c = sum((v.co for v in verts), verts[0].co * 0) / len(verts)
        for v in verts:
            v.co = c + (v.co - c) * scale
    drop = [f for i, p in enumerate(parts) if i not in kept_set for f in p]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    leaves = bpy.data.meshes.new(f"{me.name}_leaves")
    bm.to_mesh(leaves)
    bm.free()
    for m in me.materials:
        leaves.materials.append(m)

    # the wood
    budget = TREE_CAP - used
    nparts = WOOD_PARTS
    while True:
        bm = part_of(me, False)
        bm.faces.ensure_lookup_table()
        wparts = loose_parts(list(bm.faces))
        ranked = sorted(range(len(wparts)), key=lambda i: (-sum(f.calc_area() for f in wparts[i]), i))
        keep = set(ranked[:nparts])
        bmesh.ops.delete(bm, geom=[f for i, p in enumerate(wparts) if i not in keep for f in p], context='FACES')
        wood = bpy.data.meshes.new(f"{me.name}_wood")
        bm.to_mesh(wood)
        bm.free()
        for m in me.materials:
            wood.materials.append(m)
        try:
            cut = decimate(wood, budget, f"{species} wood, {nparts} parts")
            break
        except RuntimeError:
            bpy.data.meshes.remove(wood)
            if nparts == 1:
                raise
            nparts = max(1, nparts // 2)
    if cut is not wood:
        bpy.data.meshes.remove(wood)

    bm = bmesh.new()
    bm.from_mesh(cut)
    bm.from_mesh(leaves)
    new = bpy.data.meshes.new(f"{me.name}_skin")
    bm.to_mesh(new)
    bm.free()
    for m in me.materials:
        new.materials.append(m)
    bpy.data.meshes.remove(cut)
    bpy.data.meshes.remove(leaves)
    print(f"skin: tree {species}: {tris_of(me)} -> {tris_of(new)} triangles; {len(kept)} of {len(parts)} leaf cards "
          f"({used} triangles) scaled {scale:.2f}, wood {tris_of(new) - used} in its {nparts} largest parts")
    return new


def tree_species(ob):
    if ob.get('planId') is not None or ob.get('planIds') is not None:
        return None
    name = ob.name[len('TREE_'):]
    return name.rsplit('_', 1)[0] if name.rsplit('_', 1)[-1].isdigit() else name


trees = sorted([o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('TREE_')], key=lambda o: o.name)
rocks = sorted([o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('ROCK_')], key=lambda o: o.name)
caps = []
for group, cap, kind in ((trees, TREE_CAP, 'tree'), (rocks, ROCK_CAP, 'rock')):
    by_mesh = {}
    for o in group:
        by_mesh.setdefault(o.data.name, []).append(o)
    for mname in sorted(by_mesh):
        me = bpy.data.meshes[mname]
        users = by_mesh[mname]
        if kind == 'tree':
            new = reduce_tree(me, mname)
        else:
            new = decimate(me, cap, f"rock {mname}")
            print(f"skin: rock {mname}: {tris_of(me)} -> {tris_of(new)} triangles, {len(users)} uses")
        for o in users:
            o.data = new
        caps.append((kind, mname, tris_of(new), cap))
ground = bpy.data.objects.get(common.TERRAIN)
if ground is None:
    raise RuntimeError(f"skin.py: the master has no {common.TERRAIN}")
before = tris_of(ground.data)
ground.data = decimate(ground.data, GROUND_CAP, common.TERRAIN)
print(f"skin: {common.TERRAIN}: {before} -> {tris_of(ground.data)} triangles")
caps.append(('ground', common.TERRAIN, tris_of(ground.data), GROUND_CAP))
over = [c for c in caps if c[2] > c[3]]
if over:
    raise RuntimeError('skin.py: over its cap (#968): ' + '; '.join(f"{k} {n} {t} > {c}" for k, n, t, c in over))


def join(obs, name, collection):
    """One object at the identity, holding every one of `obs` in world space;
    `obs` share one mesh, so one material list."""
    mats = mats_of(obs[0])
    bm = bmesh.new()
    for o in obs:
        n0 = len(bm.verts)
        f0 = len(bm.faces)
        bm.from_mesh(o.data)
        bm.verts.ensure_lookup_table()
        bm.faces.ensure_lookup_table()
        bmesh.ops.transform(bm, matrix=o.matrix_world, verts=bm.verts[n0:])
        if o.matrix_world.determinant() < 0:
            bmesh.ops.reverse_faces(bm, faces=bm.faces[f0:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    # How many trees or rocks the join holds, which the exporter writes as
    # extras.joined: test/assets.mjs check 10 holds a TREES_ or ROCKS_ mesh to
    # TREE_CAP or ROCK_CAP times it (#1004).
    ob['joined'] = len(obs)
    bpy.data.batch_remove(obs)
    return ob


terrain_col = bpy.data.collections['TERRAIN']
land_trees = {}
for o in trees:
    sp = tree_species(o)
    if sp is not None:
        land_trees.setdefault(sp, []).append(o)
for sp in sorted(land_trees):
    n = len(land_trees[sp])
    ob = join(land_trees[sp], f"TREES_{sp}", terrain_col)
    print(f"skin: joined {n} land trees into {ob.name}, {tris_of(ob.data)} triangles")
rock_groups = {}
for o in rocks:
    rock_groups.setdefault(o.data.name, []).append(o)
counter = {}
for mname in sorted(rock_groups, key=lambda m: rock_groups[m][0].name):
    obs = rock_groups[mname]
    sp = obs[0].name[len('ROCK_'):].rsplit('_', 1)[0]
    counter[sp] = counter.get(sp, 0) + 1
    n = len(obs)
    ob = join(obs, f"ROCKS_{sp}_{counter[sp]}", terrain_col)
    print(f"skin: joined {n} rocks on {mname} into {ob.name}, {tris_of(ob.data)} triangles")


# ------------------------------------------------------------------ 3. the bake --
def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1.0 / 2.4) - 0.055)


def hsv_node(rgb, hue, sat, val):
    """Blender's Hue/Saturation/Value node at Fac 1 (svm_node_hsv), on linear rgb."""
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    d = mx - mn
    v = mx
    s = np.where(mx != 0, d / np.where(mx != 0, mx, 1), 0)
    safe = np.where(d != 0, d, 1)
    cr, cg, cb = (mx - r) / safe, (mx - g) / safe, (mx - b) / safe
    h = np.where(r == mx, cb - cg, np.where(g == mx, 2.0 + cr - cb, 4.0 + cg - cr)) / 6.0
    h = np.where(h < 0, h + 1.0, h)
    h = np.where(s != 0, h, 0.0)
    h = np.mod(h + hue + 0.5, 1.0)
    s = np.clip(s * sat, 0.0, 1.0)
    v = v * val
    # hsv_to_rgb, as Blender writes it
    hh = np.where(h == 1.0, 0.0, h) * 6.0
    i = np.floor(hh)
    f = hh - i
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    i = i.astype(np.int64)
    out_rgb = np.empty_like(rgb[:, :3])
    for k, (a, b2, c) in enumerate(((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))):
        m = i == k
        out_rgb[m, 0], out_rgb[m, 1], out_rgb[m, 2] = a[m], b2[m], c[m]
    grey = s == 0
    out_rgb[grey, 0] = out_rgb[grey, 1] = out_rgb[grey, 2] = v[grey]
    return np.maximum(out_rgb, 0.0)


def pixels(img):
    buf = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    return buf


# The scene's objects only: the master keeps terrain.py's appended templates
# (boulder_01_LOD0 and the rest) in TERRAIN_library, linked to no scene, which
# the exporter never sees.
live = sorted([o for o in scene.objects if o.type == 'MESH'], key=lambda o: o.name)
live_mats = sorted({m for o in live for m in mats_of(o) if m is not None}, key=lambda m: m.name)
baked = []
for asset in sorted(materials.LOOK):
    look = materials.LOOK[asset]
    mat = bpy.data.materials.get(f"MAT_{asset}")
    if mat is None or mat not in live_mats:
        continue
    diffs = [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.label in (f"{asset} diff", f"{asset} diff B")]
    srcs = {n.image for n in diffs}
    if len(srcs) != 1:
        raise RuntimeError(f"skin.py: MAT_{asset} has {len(srcs)} base colour images under its diff labels, not one")
    src = srcs.pop()
    img = src.copy()
    img.name = f"{asset}_diff_look"
    buf = pixels(img).reshape(-1, 4)
    rgb = srgb_to_linear(buf[:, :3].astype(np.float64))
    tint = look.get('tint')
    if tint:
        rgb = hsv_node(rgb, tint['Hue'], tint['Saturation'], tint['Value'])
    warm = look.get('warm')
    if warm:
        rgb = rgb * np.array(warm[:3])
    buf[:, :3] = linear_to_srgb(rgb).astype(np.float32)
    img.pixels.foreach_set(buf.ravel())
    for n in diffs:
        n.image = img
    baked.append(f"MAT_{asset} ({', '.join(k for k in ('tint', 'warm') if look.get(k))})")
print(f"skin: baked LOOK into {len(baked)} base colours: {'; '.join(baked) or 'none'}; grime, undulation and drift dropped")


TINT_ATTR = 'object_tint'


def object_tinted(mat):
    return mat is not None and mat.node_tree is not None and any(
        n.type == 'OBJECT_INFO' and n.outputs['Color'].is_linked for n in mat.node_tree.nodes)


# The exporter writes a colour attribute as COLOR_0 only when the material
# multiplies Base Color by it at the socket (search_node_tree's
# detect_multiply_by_color_attrib); behind the AO multiply it is not seen, and
# a mesh's unreferenced attribute goes out as COLOR_1 behind a white COLOR_0,
# which three ignores. So each object-tinted material gets that multiply at its
# BSDF, and every object wearing one carries the attribute: its colour on the
# tinted material's faces, white on the rest, and white throughout on an object
# whose colour is white (Blender's default), which renders as before.
tinted_mats = [m for m in live_mats if object_tinted(m)]
for m in tinted_mats:
    tree = m.node_tree
    for bsdf in sorted((n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED'), key=lambda n: n.name):
        sock = bsdf.inputs['Base Color']
        if not sock.is_linked:
            raise RuntimeError(f"skin.py: {m.name}'s Base Color is not linked; object_tint has nothing to multiply")
        prev = sock.links[0].from_socket
        attr = tree.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = TINT_ATTR
        mul = tree.nodes.new('ShaderNodeMix')
        mul.data_type = 'RGBA'
        mul.blend_type = 'MULTIPLY'
        materials._sock(mul.inputs, 'Factor').default_value = 1.0
        tree.links.new(attr.outputs['Color'], materials._sock(mul.inputs, 'A'))
        tree.links.new(prev, materials._sock(mul.inputs, 'B'))
        tree.links.new(materials._sock(mul.outputs, 'Result'), sock)
tinted, white = [], 0
for o in live:
    mats = mats_of(o)
    if not any(m in tinted_mats for m in mats):
        continue
    if o.data.users > 1:
        o.data = o.data.copy()
    me = o.data
    lt = np.empty(len(me.polygons), dtype=np.int64)
    me.polygons.foreach_get('loop_total', lt)
    mi = np.empty(len(me.polygons), dtype=np.int64)
    me.polygons.foreach_get('material_index', mi)
    on = np.array([m in tinted_mats for m in mats] or [False])
    per_loop = np.repeat(on[np.clip(mi, 0, len(on) - 1)], lt)
    col = np.ones((len(me.loops), 4), dtype=np.float32)
    colour = tuple(o.color)
    col[per_loop] = np.array(colour, dtype=np.float32)
    attr = me.color_attributes.new(TINT_ATTR, 'FLOAT_COLOR', 'CORNER')
    attr.data.foreach_set('color', col.ravel())
    if colour == (1.0, 1.0, 1.0, 1.0):
        white += 1
    else:
        tinted.append(f"{o.name} {tuple(round(c, 2) for c in colour[:3])}")
print(f"skin: object_tint into COLOR_0 through {', '.join(m.name for m in tinted_mats) or 'no material'}: "
      f"{len(tinted)} tinted ({'; '.join(tinted)}), {white} white")


# ------------------------------------------------------------------- 4. caps --
BASE_INPUTS = ('Base Color', 'Alpha', 'Emission Color')
DATA_INPUTS = ('Normal', 'Roughness', 'Metallic')


def images_upstream(sock, path, seen):
    """Every image upstream of input `sock`, in the tree `path` leads to (a
    tuple of group nodes from the material's tree down). A group is entered at
    its Group Output and left at its Group Input, as the exporter walks it:
    Poly Haven's leaves keep their Principled BSDF inside a group."""
    found = set()
    for link in sock.links:
        if link.is_muted:
            continue
        n = link.from_node
        key = (tuple(g.as_pointer() for g in path), n.as_pointer(), link.from_socket.identifier)
        if key in seen:
            continue
        seen.add(key)
        if n.type == 'TEX_IMAGE' and n.image is not None:
            found.add(n.image)
        if n.type == 'GROUP' and n.node_tree is not None:
            for out in n.node_tree.nodes:
                if out.type == 'GROUP_OUTPUT':
                    for s in out.inputs:
                        if s.identifier == link.from_socket.identifier:
                            found |= images_upstream(s, path + (n,), seen)
        elif n.type == 'GROUP_INPUT':
            if path:
                for s in path[-1].inputs:
                    if s.identifier == link.from_socket.identifier:
                        found |= images_upstream(s, path[:-1], seen)
        else:
            for s in n.inputs:
                found |= images_upstream(s, path, seen)
    return found


def bsdfs(tree, path=()):
    """(node, path) for every Principled BSDF in `tree` and the groups it uses."""
    got = []
    for n in sorted(tree.nodes, key=lambda n: n.name):
        if n.type == 'BSDF_PRINCIPLED':
            got.append((n, path))
        elif n.type == 'GROUP' and n.node_tree is not None:
            got.extend(bsdfs(n.node_tree, path + (n,)))
    return got


cap_of = {}
for m in live_mats:
    if m.node_tree is None:
        continue
    for bsdf, path in bsdfs(m.node_tree):
        for names, cap in ((BASE_INPUTS, BASE_CAP), (DATA_INPUTS, DATA_CAP)):
            for nm in names:
                if nm in bsdf.inputs:
                    for img in images_upstream(bsdf.inputs[nm], path, set()):
                        cap_of[img] = min(cap, cap_of.get(img, cap))
scaled = 0
for img in sorted(cap_of, key=lambda i: i.name):
    w, h = img.size
    if w == 0 or h == 0:
        raise RuntimeError(f"skin.py: image {img.name} has no pixels ({img.filepath}); is <out>/cache/ beside the master?")
    cap = cap_of[img]
    if max(w, h) > cap:
        k = cap / max(w, h)
        img.scale(max(1, round(w * k)), max(1, round(h * k)))
        scaled += 1
    if img.size[0] != w or img.name.endswith('_diff_look'):
        # dirty, so the exporter encodes these pixels and does not re-read the
        # cached file (a scale alone does not mark an image dirty, T95616)
        img.pixels.foreach_set(pixels(img))
print(f"skin: {len(cap_of)} images read by the skin's materials, {scaled} scaled to their caps "
      f"(base colour {BASE_CAP}, normal and metal-roughness {DATA_CAP})")


# ------------------------------------------------------------------- 5. stages --
def collections_hide(ob):
    return any(c.hide_render for c in ob.users_collection)


def stage_for(ob):
    ids = []
    if ob.get('planId') is not None:
        ids.append(str(ob['planId']))
    if ob.get('planIds') is not None:
        ids.extend(str(i) for i in ob['planIds'])
    if ids:
        got = set()
        for i in ids:
            if i not in STAGE:
                raise RuntimeError(f"skin.py: {ob.name} names {i}, which is no blueprint piece")
            if STAGE[i] not in SKIN_OF:
                raise RuntimeError(f"skin.py: {ob.name} names {i}, of STAGE_OF's {STAGE[i]}, which the skin never admits (#964)")
            got.add(SKIN_OF[STAGE[i]])
        if len(got) != 1:
            raise RuntimeError(f"skin.py: {ob.name}'s ids span the skin stages {sorted(got)}")
        return got.pop()
    mo = ob.get('modelOnly')
    if mo in ADMIT_MODEL_ONLY:
        return ADMIT_MODEL_ONLY[mo]
    if ob.name in ADMIT_NAMED:
        return ADMIT_NAMED[ob.name]
    if ob.name.startswith(LAND_PREFIXES) and terrain_col in ob.users_collection:
        return 'land'
    raise RuntimeError(f"skin.py: {ob.name} has no plan id and #964's admit table does not take it "
                       f"(modelOnly {mo!r}); every exported object carries a stage")


count = {s: 0 for s in SKIN_STAGES}
for ob in sorted(scene.objects, key=lambda o: o.name):
    if ob.type not in ('MESH', 'EMPTY') or ob.hide_render or collections_hide(ob):
        continue
    s = stage_for(ob)
    ob['stage'] = s
    count[s] += 1
print('skin: stages ' + ', '.join(f"{s} {count[s]} objects" for s in SKIN_STAGES))


# ------------------------------------------------------------------- 6. export --
def sha_and_bytes(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 22), b''):
            h.update(block)
    return os.path.getsize(path), h.hexdigest()


skin_dir = os.path.join(out, 'skin')
os.makedirs(skin_dir, exist_ok=True)
glb = os.path.join(skin_dir, 'skin-full.glb')
part = os.path.join(skin_dir, 'skin-full.part.glb')
if os.path.exists(part):
    os.remove(part)
bpy.ops.export_scene.gltf(  # export.py's options (#897)
    filepath=part,
    export_format='GLB',
    export_draco_mesh_compression_enable=False,
    export_image_format='AUTO',
    use_renderable=True,
    export_apply=True,
    export_extras=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    export_yup=True,
)
if not os.path.isfile(part):
    raise RuntimeError(f"skin.py: the glTF exporter returned and wrote no {part}")
os.replace(part, glb)
n, sha = sha_and_bytes(glb)
print(f"skin: skin-full.glb {n} bytes, sha256 {sha}")
sys.stdout.flush()
