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
