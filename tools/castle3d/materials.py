# materials.py - the material library: node materials from the cached maps (#840).
#
# Every map comes out of <out>/cache/ through common.cached(row), which is
# fetch.mjs's cachePath in one line. A map that is not a file raises, naming
# the row and the path: this library never falls back to a flat colour, since
# a flat colour in a still is a pink material nobody was told about.
#
# Built stone and ground are box-projected on world coordinates with a 0.2
# blend (SPECS.md, "UVs or projection on built stone"), so a wall or a field of
# any size tiles at one texel density with no UV work. The normal map is
# tangent-space, and its tangents come from the mesh's UV map named `UVMap`,
# which a mesh this library shades carries as its world x, y in metres: on a
# near-level face that is the box's top projection, so the two agree.
#
# Increment 1: mud, grass and cobble, and world_from_hdri. Later increments add
# rock, ashlar, iron, timber and the rest here, not in their stage modules.

import os

import bpy

import common

# name -> (Poly Haven asset, the texture's real-world size in metres, from the
# API's `dimensions`). Each set is fetched as five 2k jpg maps (#845, #846).
GROUND = {
    'grass': ('sparse_grass', 2.0),
    'mud': ('brown_mud_02', 1.3),
    'cobble': ('cobblestone_large_01', 4.0),
}
MAPS = ('diff', 'nor_gl', 'rough', 'disp', 'ao')
BOX_BLEND = 0.2
BUMP_SCALE = 0.05  # metres of displacement at full white, as bump only


def load_image(row, colour):
    """The row's cached file as a bpy image; raises naming the row if it is not a file."""
    path = common.cached(row)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"materials: {row['id']} is not a file at {path}")
    img = bpy.data.images.load(path, check_existing=True)
    if colour is not None:  # None keeps Blender's own choice, linear for an .hdr
        img.colorspace_settings.name = 'sRGB' if colour else 'Non-Color'
    return img


def _node(tree, kind, x, y, **props):
    n = tree.nodes.new(kind)
    n.location = (x, y)
    for k, v in props.items():
        setattr(n, k, v)
    return n


def box_material(name, asset, size):
    """A Principled material from `asset`'s five maps, box-projected on world
    coordinates at `size` metres per repeat, blend 0.2."""
    rows = {m: common.source(f"{asset}:{m}") for m in MAPS}
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    links = tree.links

    out = _node(tree, 'ShaderNodeOutputMaterial', 900, 0)
    bsdf = _node(tree, 'ShaderNodeBsdfPrincipled', 600, 0)
    links.new(bsdf.outputs[0], out.inputs['Surface'])

    geo = _node(tree, 'ShaderNodeNewGeometry', -900, 0)
    mapping = _node(tree, 'ShaderNodeMapping', -700, 0)
    mapping.inputs['Scale'].default_value = (1.0 / size, 1.0 / size, 1.0 / size)
    links.new(geo.outputs['Position'], mapping.inputs['Vector'])

    tex = {}
    for i, m in enumerate(MAPS):
        t = _node(tree, 'ShaderNodeTexImage', -400, 300 - 280 * i)
        t.image = load_image(rows[m], colour=(m == 'diff'))
        t.projection = 'BOX'
        t.projection_blend = BOX_BLEND
        t.label = f"{asset} {m}"
        links.new(mapping.outputs['Vector'], t.inputs['Vector'])
        tex[m] = t

    ao = _node(tree, 'ShaderNodeMix', 200, 300, data_type='RGBA', blend_type='MULTIPLY')
    ao.inputs['Factor'].default_value = 1.0
    links.new(tex['diff'].outputs['Color'], ao.inputs['A'])
    links.new(tex['ao'].outputs['Color'], ao.inputs['B'])
    links.new(ao.outputs['Result'], bsdf.inputs['Base Color'])

    links.new(tex['rough'].outputs['Color'], bsdf.inputs['Roughness'])

    nmap = _node(tree, 'ShaderNodeNormalMap', 200, -300, space='TANGENT', uv_map='UVMap')
    links.new(tex['nor_gl'].outputs['Color'], nmap.inputs['Color'])
    links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])

    disp = _node(tree, 'ShaderNodeDisplacement', 600, -400)
    disp.inputs['Midlevel'].default_value = 0.5
    disp.inputs['Scale'].default_value = BUMP_SCALE
    links.new(tex['disp'].outputs['Color'], disp.inputs['Height'])
    links.new(disp.outputs['Displacement'], out.inputs['Displacement'])
    # Bump only: the geometry the checks measure is the geometry the build made.
    methods = [i.identifier for i in mat.bl_rna.properties['displacement_method'].enum_items]
    mat.displacement_method = 'BUMP' if 'BUMP' in methods else methods[0]
    return mat


def ground(name):
    """One of GROUND's materials, built once per file."""
    if name not in GROUND:
        raise KeyError(f"materials: no ground material {name}; there are {', '.join(GROUND)}")
    have = bpy.data.materials.get(f"MAT_{name}")
    if have is not None:
        return have
    asset, size = GROUND[name]
    return box_material(f"MAT_{name}", asset, size)


# A leaf material's per-object tint: Object Info's Random, one number per
# object and stable for a given object name, so a rebuild tints the same.
LEAF_VALUE = 0.12     # value shifts by up to +- this
LEAF_YELLOW = 0.02    # hue moves towards yellow by up to this (of the wheel)


def tint_leaves(mat):
    """Insert a Hue/Saturation/Value node after the leaves' diffuse map, driven
    by Object Info's Random, without replacing any map. Raises if the material
    has no Image Texture whose image is a `*_leaves_diff` map."""
    if mat.get('castle3d_tint'):
        return
    tree = mat.node_tree
    diff = next((n for n in tree.nodes if n.type == 'TEX_IMAGE' and n.image and '_leaves_diff' in n.image.name), None)
    if diff is None or not diff.outputs['Color'].is_linked:
        raise ValueError(f"materials: {mat.name} has no linked *_leaves_diff Image Texture to tint")
    x, y = diff.location
    info = _node(tree, 'ShaderNodeObjectInfo', x + 150, y + 300)
    # A second, independent number from the same Random: fract(Random * 17).
    mul = _node(tree, 'ShaderNodeMath', x + 350, y + 350, operation='MULTIPLY')
    mul.inputs[1].default_value = 17.0
    frac = _node(tree, 'ShaderNodeMath', x + 500, y + 350, operation='FRACT')
    # value = 1 + LEAF_VALUE * (2 * r2 - 1): MULTIPLY_ADD (r2 * 2V) + (1 - V)
    val = _node(tree, 'ShaderNodeMath', x + 650, y + 350, operation='MULTIPLY_ADD')
    val.inputs[1].default_value = 2 * LEAF_VALUE
    val.inputs[2].default_value = 1.0 - LEAF_VALUE
    # hue = 0.5 - LEAF_YELLOW * r1: green towards yellow is down the wheel
    hue = _node(tree, 'ShaderNodeMath', x + 350, y + 200, operation='MULTIPLY_ADD')
    hue.inputs[1].default_value = -LEAF_YELLOW
    hue.inputs[2].default_value = 0.5
    hsv = _node(tree, 'ShaderNodeHueSaturation', x + 800, y)
    hsv.label = 'leaf tint per object'
    L = tree.links
    L.new(info.outputs['Random'], mul.inputs[0])
    L.new(mul.outputs[0], frac.inputs[0])
    L.new(frac.outputs[0], val.inputs[0])
    L.new(info.outputs['Random'], hue.inputs[0])
    L.new(hue.outputs[0], hsv.inputs['Hue'])
    L.new(val.outputs[0], hsv.inputs['Value'])
    targets = [lk.to_socket for lk in diff.outputs['Color'].links]
    L.new(diff.outputs['Color'], hsv.inputs['Color'])
    for sock in targets:
        L.new(hsv.outputs['Color'], sock)
    mat['castle3d_tint'] = True


def world_from_hdri(row):
    """The scene's World lit by the HDRI row: an Environment Texture, strength 1,
    no sun (#846). Increment 7 moves this call to lighting.py and adds the sun."""
    img = load_image(row, colour=None)
    world = bpy.data.worlds.new('WORLD_hdri')
    world.use_nodes = True
    tree = world.node_tree
    tree.nodes.clear()
    env = _node(tree, 'ShaderNodeTexEnvironment', -400, 0)
    env.image = img
    env.label = row['id']
    bg = _node(tree, 'ShaderNodeBackground', -100, 0)
    bg.inputs['Strength'].default_value = 1.0
    out = _node(tree, 'ShaderNodeOutputWorld', 200, 0)
    tree.links.new(env.outputs['Color'], bg.inputs['Color'])
    tree.links.new(bg.outputs['Background'], out.inputs['Surface'])
    bpy.context.scene.world = world
    return world
