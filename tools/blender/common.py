# common.py - what every Blender pack script shares (#801 to #808, #879).
#
# A pack script is run by tools/blender/render.mjs, one Blender per row:
#
#   blender -b --factory-startup --python-exit-code 1 -P packs/<pack>.py
#           -- --row <json> --out tools/blender/.staging/<pack>/<name>.glb
#
# and once more per pack with `--sheet <json list of rows>` for the contact
# sheet. The script defines `build(row)`, which makes the row's asset out of
# nothing and returns its objects, and ends on `common.main(build)`.
#
# In order: the pin, the empty scene, the seed, the frame, the look helpers,
# the export and the contact sheet. Everything an asset is comes from the row
# and the script. Nothing here reads a file, and line 8 of test/assets.mjs
# check 8 greps this folder for the calls that would (#803).

import os
import sys
import json
import random

import bpy
import bmesh

sys.dont_write_bytecode = True

# ------------------------------------------------------------------- the pin --
# #805 as #879 amends it. Exits 3, not 1, so a wrong Blender reads differently
# from a Python exception under --python-exit-code 1.
if bpy.app.version[:2] != (5, 2):
    print(f"blender: Blender {bpy.app.version_string} is not 5.2; this pipeline is pinned to 5.2 (#879)")
    sys.stdout.flush()
    sys.exit(3)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))


def args_after_dashes():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(argv, name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


# ------------------------------------------------------------ an empty scene --
def empty_scene():
    """Delete everything the factory startup made, so an asset owes nothing to
    what was there, and make one Blender unit one metre."""
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.images,
                 bpy.data.cameras, bpy.data.lights, bpy.data.textures, bpy.data.node_groups):
        for item in list(coll):
            coll.remove(item)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    return scene


# ------------------------------------------------------------------ the seed --
def seed(row):
    """Every random draw in a pack goes through Python's `random` after this.
    The seed is the row's string, so a re-seed is a table edit and shows up in
    the source hash."""
    random.seed(row['seed'])


# ----------------------------------------------------------------- the frame --
def frame(objects):
    """Min Z at 0, centred in X and Y, transforms applied. Built Z-up with the
    front facing -Y, which the exporter turns into +Y up and the front at +Z."""
    for obj in objects:
        obj.data.transform(obj.matrix_world)
        obj.matrix_world.identity()
    lo = [min(v.co[i] for o in objects for v in o.data.vertices) for i in range(3)]
    hi = [max(v.co[i] for o in objects for v in o.data.vertices) for i in range(3)]
    shift = (-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2])
    for obj in objects:
        for v in obj.data.vertices:
            v.co.x += shift[0]
            v.co.y += shift[1]
            v.co.z += shift[2]
        obj.data.update()


# ---------------------------------------------------------- the look helpers --
# One atlas per pack: SWATCH px squares on a GRID x GRID board, at most 32
# colours and at most 128 px a side ("The look", #742, #803).
SWATCH = 4
GRID = 4
_SLOTS = {}


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def flat(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = False


def palette_material(pack, colours):
    """The pack's one material: Principled BSDF, metallic 0, roughness 1, and an
    atlas of `colours` on base colour, sampled Closest. Returns the material;
    `swatch_uv` reads which swatch each colour got. Unused swatches repeat the first colour, so
    no texel is a colour the pack did not name."""
    if len(colours) > GRID * GRID:
        raise ValueError(f'{pack}: {len(colours)} colours, and the atlas holds {GRID * GRID}')
    if len(set(colours)) != len(colours):
        raise ValueError(f'{pack}: a colour is listed twice')
    size = SWATCH * GRID
    img = bpy.data.images.new(f'{pack}-palette', size, size, alpha=False)
    img.colorspace_settings.name = 'sRGB'
    px = [0.0] * (size * size * 4)
    for slot in range(GRID * GRID):
        rgb = hex_rgb(colours[slot] if slot < len(colours) else colours[0])
        sx, sy = slot % GRID, slot // GRID
        for y in range(sy * SWATCH, (sy + 1) * SWATCH):
            for x in range(sx * SWATCH, (sx + 1) * SWATCH):
                i = (y * size + x) * 4
                px[i:i + 4] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1.0]
    img.pixels[:] = px
    img.update()

    mat = bpy.data.materials.new(f'{pack}')
    mat.use_nodes = True
    # one-sided, as the kit's pieces are: the glTF says doubleSided false
    mat.use_backface_culling = True
    nodes = mat.node_tree.nodes
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 1.0
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.interpolation = 'Closest'
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    _SLOTS.clear()
    _SLOTS.update({c: i for i, c in enumerate(colours)})
    return mat


def swatch_centre(index):
    """The UV of a swatch's centre. Blender's V runs up from the image's first
    row, which is the row `pixels` writes first, so slot 0 is bottom left here
    and top left in the PNG the exporter writes; either way every texel of a
    swatch is its colour."""
    sx, sy = index % GRID, index // GRID
    return ((sx + 0.5) / GRID, (sy + 0.5) / GRID)


def swatch_uv(bm, face, colour):
    """Point every loop of `face` (in bmesh `bm`) at `colour`'s swatch centre.
    A colour the palette does not hold is an error, not a nearest match."""
    if colour not in _SLOTS:
        raise ValueError(f'{colour} is not in this pack\'s palette ({", ".join(_SLOTS)})')
    uv = bm.loops.layers.uv.active or bm.loops.layers.uv.new('UVMap')
    u, v = swatch_centre(_SLOTS[colour])
    for loop in face.loops:
        loop[uv].uv = (u, v)


# -------------------------------------------------------------- boxes, simply --
def box(bm, centre, size):
    """An axis-aligned box into `bm`, returning its faces."""
    from mathutils import Matrix
    m = Matrix.Translation(centre) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0))
    out = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    # dict, not set: the order is the cube's own, whatever the hash seed
    return list(dict.fromkeys(f for v in out['verts'] for f in v.link_faces))


# ------------------------------------------------------------ a skinned pack --
# What folk.py made for the shared rig (#820 to #823) and animals.py needs too
# (#826): the model frame, a mesh built with joint weights, the two materials
# over one atlas, the armature, the clips and the frame on Root. They live here
# and not in folk.py because a row's source hash is common.py, its own script
# and finish.mjs (#806): a helper animals.py imported out of folk.py would be
# an input the hash cannot see.
def to_blender(p):
    """Model frame (+x left, +y up, +z facing) to Blender's (+x, -y facing, +z up)."""
    from mathutils import Vector
    return Vector((p[0], -p[2], p[1]))


class Part:
    """One mesh as it is built: vertices with their joint weights, faces with
    their swatch. `default(z, x)` is the weights of a vertex given none.
    `material` is the slot the next faces go in, for a mesh that carries both
    of a skinned pack's materials."""

    def __init__(self, joints, dx=0.0, default=None):
        self.bm = bmesh.new()
        self.dl = self.bm.verts.layers.deform.verify()
        self.joints = joints
        self.dx = dx
        self.default = default
        self.material = 0

    def v(self, x, y, z, w):
        vert = self.bm.verts.new((x + self.dx, y, z))
        if w is None:
            w = self.default(z, x)
        w = {k: val for k, val in w.items() if val > 0}
        total = sum(w.values())
        for name, val in w.items():
            if name not in self.joints:
                raise ValueError(f'a vertex is weighted to {name}, which is no joint of the row\'s rig')
            vert[self.dl][self.joints[name]] = val / total
        return vert

    def f(self, verts, colour):
        face = self.bm.faces.new(verts)
        face.material_index = self.material
        swatch_uv(self.bm, face, colour)
        return face

    def ring(self, centre, rx, ry, n, w):
        import math
        cx, cy, cz = centre
        out = []
        for k in range(n):
            a = 2 * math.pi * (k + 0.5) / n
            out.append(self.v(cx + rx * math.cos(a), cy + ry * math.sin(a), cz, w))
        return out

    def tube(self, rings, n, colour, bottom=False, top=False, cover=None, inside=False):
        """`rings` is [(centre, rx, ry, weights)], bottom up. `colour` is one
        swatch or one per band. `cover[i]` is the eighths of band i that are
        faces (all of them if None). `inside` winds the faces to be seen from
        within, which is the lining of a cloak."""
        made = [self.ring(c, rx, ry, n, w) for c, rx, ry, w in rings]
        for i, (a, b) in enumerate(zip(made, made[1:])):
            col = colour[i] if isinstance(colour, (list, tuple)) else colour
            for k in range(n):
                if cover is not None and k not in cover[i]:
                    continue
                quad = (a[k], a[(k + 1) % n], b[(k + 1) % n], b[k])
                self.f(tuple(reversed(quad)) if inside else quad, col)
        first = colour[0] if isinstance(colour, (list, tuple)) else colour
        last = colour[-1] if isinstance(colour, (list, tuple)) else colour
        if bottom:
            self.f(list(reversed(made[0])), first)
        if top:
            self.f(made[-1], last)
        return made

    def hull(self, corners, colour, w):
        """A box from its eight corners, `corners[i][j][k]` with i, j and k the
        low or high end in Blender's x, y and z, so a pack may turn or taper
        one before it gets here."""
        p = [[[self.v(*corners[i][j][k], w) for k in (0, 1)] for j in (0, 1)] for i in (0, 1)]
        for quad in ((p[0][0][0], p[0][0][1], p[0][1][1], p[0][1][0]),
                     (p[1][0][0], p[1][1][0], p[1][1][1], p[1][0][1]),
                     (p[0][0][0], p[1][0][0], p[1][0][1], p[0][0][1]),
                     (p[0][1][0], p[0][1][1], p[1][1][1], p[1][1][0]),
                     (p[0][0][0], p[0][1][0], p[1][1][0], p[1][0][0]),
                     (p[0][0][1], p[1][0][1], p[1][1][1], p[0][1][1])):
            self.f(quad, colour)

    def box(self, centre, size, colour, w):
        cx, cy, cz = centre
        hx, hy, hz = size[0] / 2, size[1] / 2, size[2] / 2
        self.hull([[[(cx + (2 * i - 1) * hx, cy + (2 * j - 1) * hy, cz + (2 * k - 1) * hz)
                     for k in (0, 1)] for j in (0, 1)] for i in (0, 1)], colour, w)


def pair_materials(pack, colours, tinted):
    """A skinned pack's two materials over the one palette image (#820):
    `tinted` (`Cloth`, or `Coat`), which src/npc.js's tint multiplies, and
    `Bare`, which it does not."""
    first = palette_material(pack, colours)
    first.name = tinted
    bare = first.copy()
    bare.name = 'Bare'
    return {tinted: first, 'Bare': bare}


def build_rig(rig):
    """An armature from `rig`, a list of { name, parent, head } in the model
    frame."""
    from mathutils import Vector
    arm = bpy.data.armatures.new('Armature')
    obj = bpy.data.objects.new('Armature', arm)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    for j in rig:
        bone = arm.edit_bones.new(j['name'])
        # Every bone points straight up, 8 cm: a joint is a place, and with
        # one orientation for all of them every joint's rest rotation in the
        # file is none, so a clip's quaternions are its moves and stay clear
        # of the half turn where a sampled quaternion's sign flips.
        bone.head = to_blender(j['head'])
        bone.tail = bone.head + Vector((0.0, 0.0, 0.08))
        bone.roll = 0.0
        bone.use_connect = False
        if j['parent'] is not None:
            bone.parent = arm.edit_bones[j['parent']]
    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


def _axes():
    from mathutils import Vector
    return {'x': Vector((1, 0, 0)), 'y': Vector((0, 0, 1)), 'z': Vector((0, -1, 0))}


def turn(clip, bone, k, keys):
    """What `clip`'s moves make of `bone` at key k: a rotation in the model
    frame, the row's moves applied in the order they are listed. A move is
    { bone, axis, rest, amp, phase, rate }, tools/bodies/clips.json's grammar:
    rest + amp * sin(2 pi (cycles * rate * k / keys + phase)) degrees, with
    `rate` a whole number, 1 if left out."""
    import math
    from mathutils import Quaternion
    axes = _axes()
    q = Quaternion()
    for m in clip['moves']:
        if m['bone'] != bone:
            continue
        angle = m['rest'] + m['amp'] * math.sin(2 * math.pi * (clip['cycles'] * m.get('rate', 1) * k / keys + m['phase']))
        q = Quaternion(axes[m['axis']], math.radians(angle)) @ q
    return q


def key_clips(row, arm):
    """One action per clip, a key on every joint at every frame, each pushed
    to an NLA track of the clip's name, which is what the exporter names the
    animation after. A clip runs `seconds` if it says so, which has to be a
    whole number of frames at the row's `fps`, and the row's `keys` frames if
    not. Every clip but Idle is composed on Idle's pose at the same key, so a
    clip that moves nothing is Idle, unless the row says `onIdle: false`, and
    then a clip is its own moves and nothing else."""
    from mathutils import Quaternion
    scene = bpy.context.scene
    scene.render.fps = row['fps']

    def keys_of(clip):
        if 'seconds' not in clip:
            return row['keys']
        n = clip['seconds'] * row['fps']
        if abs(n - round(n)) > 1e-9 or round(n) < 4:
            raise ValueError(f'{clip["name"]} runs {clip["seconds"]} s, which is not a whole number of frames at {row["fps"]} fps')
        return int(round(n))

    scene.frame_start = 0
    scene.frame_end = max(keys_of(c) for c in row['clips'])
    names = {j['name'] for j in row['rig']}
    axes = _axes()
    on_idle = row.get('onIdle', True)
    idle = next((c for c in row['clips'] if c['name'] == 'Idle'), None)
    if idle is None:
        raise ValueError('the clips table has no Idle to compose the others on')
    rest = {pb.name: pb.bone.matrix_local.to_quaternion() for pb in arm.pose.bones}
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    data = arm.animation_data_create()
    for clip in row['clips']:
        keys = keys_of(clip)
        for m in clip['moves']:
            if m['bone'] not in names:
                raise ValueError(f'{clip["name"]} moves {m["bone"]}, which is no joint of the row\'s rig')
            if m['axis'] not in axes:
                raise ValueError(f'{clip["name"]}: axis {m["axis"]} is not x, y or z')
        action = bpy.data.actions.new(clip['name'])
        data.action = action
        for k in range(keys + 1):
            for pb in arm.pose.bones:
                if clip is idle or not on_idle:
                    d = turn(clip, pb.name, k, keys)
                else:
                    d = turn(clip, pb.name, k, keys) @ turn(idle, pb.name, k, keys)
                q = rest[pb.name].inverted() @ d @ rest[pb.name]
                pb.rotation_quaternion = q
                pb.keyframe_insert('rotation_quaternion', frame=k)
        slot = data.action_slot
        data.action = None
        track = data.nla_tracks.new()
        track.name = clip['name']
        strip = track.strips.new(clip['name'], 0, action)
        if strip.action_slot is None and slot is not None:
            strip.action_slot = slot
    for pb in arm.pose.bones:
        pb.rotation_quaternion = Quaternion()


def check_frame(arm, objects):
    """#820: the Root joint at the origin and the soles on z 0, by
    construction. Nothing is moved here; a body built anywhere else is an
    error in the row, not something to shift."""
    root = arm.data.bones['Root'].head_local
    if root.length > 1e-6:
        raise ValueError(f'Root is at {tuple(root)}, not the origin')
    low = min(v.co.z for o in objects for v in o.data.vertices)
    if abs(low) > 1e-6:
        raise ValueError(f'the lowest vertex is at z {low}, not 0: the soles stand on the floor')


def export_skinned(path):
    """export() with a skin and animations: one glTF animation per NLA track,
    sampled at every frame, every joint keyed."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_yup=True,
        export_apply=False,
        export_extras=False,
        export_cameras=False,
        export_lights=False,
        export_skins=True,
        export_animations=True,
        export_animation_mode='NLA_TRACKS',
        export_force_sampling=True,
        export_frame_range=False,
        export_optimize_animation_size=False,
        export_anim_slide_to_zero=True,
        export_morph=False,
    )
    with open(path + '.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'blender': bpy.app.version_string}, f)
        f.write('\n')


# ---------------------------------------------------------------- the export --
def export(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_extras=False,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )
    # What finish.mjs records as the row's `blender` (#805).
    with open(path + '.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'blender': bpy.app.version_string}, f)
        f.write('\n')


# --------------------------------------------------------- the contact sheet --
def contact_sheet(pack, objects):
    """The pack's assets on a row, one orthographic camera at a three-quarter
    view, Workbench flat, 1600 x 900, into shots/blender/<pack>.png. A look for
    Devon, not a test."""
    from mathutils import Vector
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    lo = Vector([min((o.matrix_world @ Vector(c))[i] for o in objects for c in o.bound_box) for i in range(3)])
    hi = Vector([max((o.matrix_world @ Vector(c))[i] for o in objects for c in o.bound_box) for i in range(3)])
    centre = (lo + hi) / 2
    span = max((hi - lo).length, 0.1)
    cam_data = bpy.data.cameras.new('sheet')
    cam_data.type = 'ORTHO'
    # ortho_scale spans the wider side, 1600 px, so fit the 900 px one
    cam_data.ortho_scale = span * 1.1 * 1600 / 900
    cam = bpy.data.objects.new('sheet', cam_data)
    scene.collection.objects.link(cam)
    direction = Vector((1.0, -1.0, 0.8)).normalized()
    cam.location = centre + direction * span * 3
    cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'FLAT'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    out = os.path.join(ROOT, 'shots', 'blender', f'{pack}.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print(f'blender: contact sheet {out}')


# ------------------------------------------------------------------ the entry --
def main(build):
    argv = args_after_dashes()
    sheet = arg(argv, '--sheet')
    if sheet is not None:
        rows = json.loads(sheet)
        empty_scene()
        laid, x = [], 0.0
        for row in rows:
            seed(row)
            objects = build(row)
            frame(objects)
            width = max(v.co.x for o in objects for v in o.data.vertices) - min(v.co.x for o in objects for v in o.data.vertices)
            for o in objects:
                o.location.x = x + width / 2
            x += width + 0.25
            laid += objects
        contact_sheet(rows[0]['pack'], laid)
        return
    row = json.loads(arg(argv, '--row'))
    out = arg(argv, '--out')
    if not out:
        raise SystemExit('blender: --out is required')
    empty_scene()
    seed(row)
    objects = build(row)
    frame(objects)
    export(out)
    print(f'blender: exported {out}')
