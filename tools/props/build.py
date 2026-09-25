# build.py - builds every Castle Conundrum prop and exports each as a .glb.
#
#   blender -b --factory-startup --python build.py -- [--only id,id] [--no-render]
#
# Writes the .glb files to Blender Projects/Castle and to the game repo's
# assets/props, and previews plus a manifest to Castle/_source.

import os
import sys
import json
import math

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy
import numpy as np
from mathutils import Vector, Matrix

import atlas
import kit
import registry
import props_evidence, props_rooms, props_large  # noqa: F401  (they register)

CASTLE = os.path.dirname(HERE)
REPO = r"C:\Users\devon\OneDrive\Documents\GitHub\castle-conundrum\assets\props"
OUTS = [CASTLE, REPO]
PREV = os.path.join(HERE, 'previews')

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
only = None
if '--only' in argv:
    only = set(argv[argv.index('--only') + 1].split(','))
render = '--no-render' not in argv
export = '--no-export' not in argv

# ------------------------------------------------------------------ scene --
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
os.makedirs(PREV, exist_ok=True)
img = atlas.save(os.path.join(HERE, 'castle_props_atlas.png'))
img.pack()
MAT = kit.make_material('castle_props', img)
MAT_CUT = kit.make_material('castle_props_cutout', img, cutout=True)

built = []
for spec in registry.PROPS:
    if only and spec['id'] not in only:
        continue
    P = kit.Prop(spec['id'], spec['title'], spec.get('cutout', False), spec['category'])
    spec['fn'](P)
    col = bpy.data.collections.new(P.id)
    scene.collection.children.link(col)
    P.build(MAT_CUT if P.cutout else MAT, col)
    P.collection = col
    built.append(P)
    print(f"built {P.id:34s} {P.tris:5d} tris  {P.dims.x:.2f} x {P.dims.y:.2f} x {P.dims.z:.2f} m")

# ----------------------------------------------------------------- export --
if export:
    for P in built:
        for d in OUTS:
            os.makedirs(d, exist_ok=True)
            kit.export_glb(P.root, os.path.join(d, P.id + '.glb'))

# ---------------------------------------------------------------- previews --
def look_at(cam, target, direction, dist):
    cam.location = target + direction.normalized() * dist
    q = (target - cam.location).to_track_quat('-Z', 'Y')
    cam.rotation_euler = q.to_euler()

if render:
    try:
        scene.render.engine = 'BLENDER_WORKBENCH'
    except TypeError as e:
        print('engine', e)
    sh = scene.display.shading
    sh.light = 'STUDIO'
    sh.color_type = 'TEXTURE'
    sh.show_cavity = False
    sh.show_shadows = False
    scene.display.render_aa = 'OFF' if 'OFF' in [e.identifier for e in scene.display.bl_rna.properties['render_aa'].enum_items] else scene.display.render_aa
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 256
    scene.render.image_settings.file_format = 'PNG'
    camd = bpy.data.cameras.new('cam')
    camd.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', camd)
    scene.collection.objects.link(cam)
    scene.camera = cam
    for P in built:
        for Q in built:
            Q.collection.hide_render = (Q is not P)
        bpy.context.view_layer.update()
        pts = []
        for o in P.collection.objects:
            if o.type == 'MESH':
                pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
        lo = Vector([min(p[i] for p in pts) for i in range(3)])
        hi = Vector([max(p[i] for p in pts) for i in range(3)])
        centre = (lo + hi) / 2
        look_at(cam, centre, Vector((0.62, -1.0, 0.55)), 20)
        bpy.context.view_layer.update()
        inv = cam.matrix_world.inverted()
        vs = [inv @ Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
        w = max(v.x for v in vs) - min(v.x for v in vs)
        h = max(v.y for v in vs) - min(v.y for v in vs)
        camd.ortho_scale = max(w, h) * 1.12
        scene.render.filepath = os.path.join(PREV, P.id + '.png')
        bpy.ops.render.render(write_still=True)

    # contact sheets of 20, 5 across, for a quick look
    order = [P.id for P in built]
    per, cols, px = 20, 5, 256
    for s in range(0, len(order), per):
        chunk = order[s:s + per]
        rows = math.ceil(len(chunk) / cols)
        sheet = np.zeros((rows * px, cols * px, 4), np.float32)
        sheet[..., :3] = (0.36, 0.36, 0.39); sheet[..., 3] = 1
        for k, pid in enumerate(chunk):
            im = bpy.data.images.load(os.path.join(PREV, pid + '.png'))
            a = np.array(im.pixels[:], np.float32).reshape(px, px, 4)
            r, c = k // cols, k % cols
            y0 = (rows - 1 - r) * px
            region = sheet[y0:y0 + px, c * px:(c + 1) * px]
            al = a[..., 3:4]
            region[..., :3] = a[..., :3] * al + region[..., :3] * (1 - al)
            # a dark frame so cells separate
            region[0, :, :3] = region[-1, :, :3] = 0.2
            region[:, 0, :3] = region[:, -1, :3] = 0.2
            bpy.data.images.remove(im)
        out = bpy.data.images.new('sheet', cols * px, rows * px, alpha=True)
        out.pixels.foreach_set(sheet.ravel())
        out.filepath_raw = os.path.join(PREV, f'_sheet_{s // per + 1}.png')
        out.file_format = 'PNG'
        out.save()
        bpy.data.images.remove(out)
        print('sheet', s // per + 1, ':', ', '.join(chunk))

# --------------------------------------------------------------- manifest --
if not only:
    man = []
    for P in built:
        man.append({
            'file': P.id + '.glb', 'title': P.title, 'category': P.category,
            'triangles': P.tris, 'size_m': [round(P.dims.x, 3), round(P.dims.z, 3), round(P.dims.y, 3)],
            'cutout': P.cutout,
            'nodes': [{'name': n, 'pivot_blender_xyz': list(p), 'parent': par} for (n, p, par) in P.nodes],
            'notes': P.notes,
        })
    with open(os.path.join(HERE, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=1)
    # the game-side readme
    lines = ['# Props', '',
             'Low-poly props for Castle Conundrum, built by a script in Blender (`Claude Files/Blender Projects/Castle/_source/build.py`).',
             'Every file shares one 128 px pixel-art atlas embedded in the glb, one material per prop, NEAREST filtering.',
             '1 unit = 1 m, glTF Y-up, origin at the base centre of the bounding box, front faces +Z.',
             'Wall-hung pieces (banners, tapestries, shields, sconces, the rood, the window, cobwebs, the watch bill) have their back at -Z, so place them half their depth off the wall.',
             'Cobwebs and the net rack use an alpha-masked, double-sided material.',
             'Nothing here is meshopt-encoded yet: run `npm run assets:encode` once a prop is placed, as #506 asks of every placed prop.',
             '', '| File | Prop | Tris | W x H x D (m) | Moving nodes |', '| --- | --- | ---: | --- | --- |']
    for m in man:
        moving = [n['name'] for n in m['nodes'] if n['name'] != m['file'][:-4]]
        s = m['size_m']
        lines.append(f"| `{m['file']}` | {m['title']} | {m['triangles']} | {s[0]:.2f} x {s[1]:.2f} x {s[2]:.2f} | {', '.join(moving) or ''} |")
    notes = [m for m in man if m['notes']]
    if notes:
        lines += ['', '## Notes', '']
        for m in notes:
            lines.append(f"- `{m['file']}`: {m['notes']}")
    txt = '\n'.join(lines) + '\n'
    for d in OUTS:
        with open(os.path.join(d, 'README.md'), 'w', encoding='utf-8', newline='\r\n' if d == REPO else '\n') as f:
            f.write(txt)

# lay the props out in rows by category so the .blend is browsable
x = 0.0; y = 0.0; cat = None
for P in built:
    if P.category != cat:
        cat = P.category; x = 0.0; y += 5.0
    P.root.location = (x + P.dims.x / 2, y, 0)
    x += P.dims.x + 0.6
for Q in built:
    Q.collection.hide_render = False
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'castle_props.blend'))
print('DONE', len(built), 'props')
