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
# Increment 1: mud, grass and cobble, the ground's grass-mud blend, the road's
# cobble-mud blend, and world_from_hdri. Later increments add
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


def _sock(sockets, name):
    """The enabled socket called `name`: a Mix node carries one per data type,
    and a lookup by name alone returns the first, which may be disabled."""
    for s in sockets:
        if s.name == name and getattr(s, 'enabled', True):
            return s
    raise KeyError(f"materials: no enabled socket {name} in {[s.name for s in sockets]}")


def _mix(tree, kind, x, y, fac, a, b):
    """A Mix node of data type `kind` ('FLOAT' or 'RGBA'): fac 0 is a, 1 is b."""
    m = _node(tree, 'ShaderNodeMix', x, y, data_type=kind)
    L = tree.links
    L.new(fac, _sock(m.inputs, 'Factor'))
    L.new(a, _sock(m.inputs, 'A'))
    L.new(b, _sock(m.inputs, 'B'))
    return _sock(m.outputs, 'Result')


# The grass set's diffuse is straw under the HDRI (its 2k map averages sRGB
# 0.31, 0.24, 0.08, a hue of about 42 degrees), so a meadow needs it moved
# towards green. The map stays in the tree, so check.py line 4 still sees it.
GRASS_TINT = {'Hue': 0.62, 'Saturation': 1.0, 'Value': 0.65}
# The mud set reads grey-lilac under the same sky; warmed and darkened a little
# so a patch reads as earth rather than gravel, and its roughness held at
# MUD_ROUGH or more, since a shinier mud mirrors the sky's blue at a grazing
# angle and reads lilac from any height. The maps stay in the tree.
MUD_TINT = {'Hue': 0.5, 'Saturation': 1.5, 'Value': 0.7}
MUD_ROUGH = 0.85


def _maps(tree, asset, size, x, y, tint=None, rough_min=None):
    """`asset`'s five maps box-projected on world coordinates at `size` metres
    per repeat, blend 0.2. Returns the sockets a shader reads: the diffuse
    times AO (after `tint`, a Hue/Saturation/Value dict, when given), the
    roughness (no lower than `rough_min`, when given), the tangent normal
    colour and the height."""
    rows = {m: common.source(f"{asset}:{m}") for m in MAPS}
    links = tree.links
    geo = _node(tree, 'ShaderNodeNewGeometry', x - 500, y)
    mapping = _node(tree, 'ShaderNodeMapping', x - 300, y)
    mapping.inputs['Scale'].default_value = (1.0 / size, 1.0 / size, 1.0 / size)
    links.new(geo.outputs['Position'], mapping.inputs['Vector'])

    tex = {}
    for i, m in enumerate(MAPS):
        t = _node(tree, 'ShaderNodeTexImage', x, y + 300 - 280 * i)
        t.image = load_image(rows[m], colour=(m == 'diff'))
        t.projection = 'BOX'
        t.projection_blend = BOX_BLEND
        t.label = f"{asset} {m}"
        links.new(mapping.outputs['Vector'], t.inputs['Vector'])
        tex[m] = t

    diff = tex['diff'].outputs['Color']
    if tint:
        hsv = _node(tree, 'ShaderNodeHueSaturation', x + 250, y + 450)
        hsv.label = f"{asset} tint"
        for k, v in tint.items():
            hsv.inputs[k].default_value = v
        links.new(diff, hsv.inputs['Color'])
        diff = hsv.outputs['Color']
    ao = _node(tree, 'ShaderNodeMix', x + 450, y + 300, data_type='RGBA', blend_type='MULTIPLY')
    _sock(ao.inputs, 'Factor').default_value = 1.0
    links.new(diff, _sock(ao.inputs, 'A'))
    links.new(tex['ao'].outputs['Color'], _sock(ao.inputs, 'B'))
    rough = tex['rough'].outputs['Color']
    if rough_min is not None:
        floor = _node(tree, 'ShaderNodeMath', x + 250, y - 250, operation='MAXIMUM')
        floor.inputs[1].default_value = rough_min
        links.new(rough, floor.inputs[0])
        rough = floor.outputs[0]
    return {'base': _sock(ao.outputs, 'Result'), 'rough': rough,
            'nor': tex['nor_gl'].outputs['Color'], 'disp': tex['disp'].outputs['Color']}


def _new_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    return mat


def _finish(mat, bsdf_x, maps, surface=None):
    """A Principled BSDF from `maps`, a tangent normal map, bump-only
    displacement, and the output. `surface(bsdf_socket)` may wrap the BSDF."""
    tree = mat.node_tree
    links = tree.links
    out = _node(tree, 'ShaderNodeOutputMaterial', bsdf_x + 600, 0)
    bsdf = _node(tree, 'ShaderNodeBsdfPrincipled', bsdf_x, 0)
    links.new(maps['base'], bsdf.inputs['Base Color'])
    links.new(maps['rough'], bsdf.inputs['Roughness'])
    nmap = _node(tree, 'ShaderNodeNormalMap', bsdf_x - 300, -300, space='TANGENT', uv_map='UVMap')
    links.new(maps['nor'], nmap.inputs['Color'])
    links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    shader = bsdf.outputs[0] if surface is None else surface(bsdf.outputs[0])
    links.new(shader, out.inputs['Surface'])
    disp = _node(tree, 'ShaderNodeDisplacement', bsdf_x + 300, -400)
    disp.inputs['Midlevel'].default_value = 0.5
    disp.inputs['Scale'].default_value = BUMP_SCALE
    links.new(maps['disp'], disp.inputs['Height'])
    links.new(disp.outputs['Displacement'], out.inputs['Displacement'])
    # Bump only: the geometry the checks measure is the geometry the build made.
    methods = [i.identifier for i in mat.bl_rna.properties['displacement_method'].enum_items]
    mat.displacement_method = 'BUMP' if 'BUMP' in methods else methods[0]
    return mat


def box_material(name, asset, size, tint=None):
    """A Principled material from `asset`'s five maps, box-projected on world
    coordinates at `size` metres per repeat, blend 0.2."""
    mat = _new_material(name)
    return _finish(mat, 600, _maps(mat.node_tree, asset, size, -400, 0, tint))


def ground(name):
    """One of GROUND's materials, built once per file."""
    if name not in GROUND:
        raise KeyError(f"materials: no ground material {name}; there are {', '.join(GROUND)}")
    have = bpy.data.materials.get(f"MAT_{name}")
    if have is not None:
        return have
    asset, size = GROUND[name]
    return box_material(f"MAT_{name}", asset, size, GRASS_TINT if name == 'grass' else None)


def _blend_factor(tree, attribute, x, y, scale, spread, width=0.12):
    """A 0..1 factor from the mesh's float attribute `attribute`, frayed by a
    world-space Noise Texture of about `scale` metres: a smoothstep of
    attribute + spread * noise across its midpoint, `width` either side. The
    attribute carries the seeded layout; the noise only breaks up its edge."""
    links = tree.links
    attr = _node(tree, 'ShaderNodeAttribute', x, y, attribute_type='GEOMETRY', attribute_name=attribute)
    geo = _node(tree, 'ShaderNodeNewGeometry', x, y - 200)
    noise = _node(tree, 'ShaderNodeTexNoise', x + 200, y - 200)
    noise.inputs['Scale'].default_value = 1.0 / scale
    noise.inputs['Detail'].default_value = 4.0
    links.new(geo.outputs['Position'], noise.inputs['Vector'])
    add = _node(tree, 'ShaderNodeMath', x + 400, y, operation='MULTIPLY_ADD')
    links.new(noise.outputs['Fac'], add.inputs[0])
    add.inputs[1].default_value = spread
    links.new(attr.outputs['Fac'], add.inputs[2])
    rng = _node(tree, 'ShaderNodeMapRange', x + 600, y, interpolation_type='SMOOTHSTEP', clamp=True)
    centre = 0.5 + spread / 2  # the noise's mean is 0.5, so it adds spread / 2
    rng.inputs['From Min'].default_value = centre - width
    rng.inputs['From Max'].default_value = centre + width
    links.new(add.outputs[0], rng.inputs['Value'])
    return rng.outputs['Result']


def _mixed(tree, a, b, f):
    return {k: _mix(tree, 'RGBA' if k in ('base', 'nor') else 'FLOAT', 0, 600 - 300 * i, f, a[k], b[k])
            for i, k in enumerate(('base', 'rough', 'nor', 'disp'))}


def ground_blend():
    """MAT_ground: the grass set (tinted) and the mud set mixed by the mesh's
    `mud` attribute (0 grass, 1 mud), which terrain.py writes per vertex from
    its seeded noise, the slope and the road, frayed by a 1 m noise."""
    have = bpy.data.materials.get('MAT_ground')
    if have is not None:
        return have
    mat = _new_material('MAT_ground')
    tree = mat.node_tree
    g = _maps(tree, *GROUND['grass'], -700, 1400, GRASS_TINT)
    m = _maps(tree, *GROUND['mud'], -700, -200, MUD_TINT, MUD_ROUGH)
    f = _blend_factor(tree, 'mud', -700, -1200, 1.0, 0.9, 0.15)
    return _finish(mat, 600, _mixed(tree, g, m, f))


def road():
    """MAT_road: cobble with mud in it by the mesh's `rut` attribute, and
    transparent past its `cover` attribute (1 on the cobbles, 0 at the
    ribbon's edge), both frayed by noise, so the cobbles break up into the
    ground's own mud verge with no straight shoulder."""
    have = bpy.data.materials.get('MAT_road')
    if have is not None:
        return have
    mat = _new_material('MAT_road')
    tree = mat.node_tree
    c = _maps(tree, *GROUND['cobble'], -700, 1400)
    m = _maps(tree, *GROUND['mud'], -700, -200, MUD_TINT, MUD_ROUGH)
    f = _blend_factor(tree, 'rut', -700, -1200, 0.8, 0.5)
    cover = _blend_factor(tree, 'cover', -700, -1800, 0.35, 0.9, 0.08)

    def surface(bsdf):
        clear = _node(tree, 'ShaderNodeBsdfTransparent', 700, 300)
        mix = _node(tree, 'ShaderNodeMixShader', 950, 150)
        tree.links.new(cover, mix.inputs['Fac'])
        tree.links.new(clear.outputs[0], mix.inputs[1])
        tree.links.new(bsdf, mix.inputs[2])
        return mix.outputs[0]
    return _finish(mat, 600, _mixed(tree, c, m, f), surface)


# A leaf material's per-object tint: Object Info's Random, one number per
# object and stable for a given object name, so a rebuild tints the same.
LEAF_VALUE = 0.12     # value shifts by up to +- this
LEAF_YELLOW = 0.02    # hue moves towards yellow by up to this (of the wheel)


# The grass clumps' own diffuse is olive; moved a little towards green, the
# same way, so a meadow seen from height reads green. The map stays in the tree.
CLUMP_TINT = {'Hue': 0.54, 'Saturation': 1.15, 'Value': 1.0}


def tint_grass(mat):
    """Insert CLUMP_TINT's Hue/Saturation/Value after a grass model's diffuse
    map. Raises if the material has no linked `*_diff` Image Texture."""
    if mat.get('castle3d_tint'):
        return
    tree = mat.node_tree
    diff = next((n for n in tree.nodes if n.type == 'TEX_IMAGE' and n.image and '_diff' in n.image.name), None)
    if diff is None or not diff.outputs['Color'].is_linked:
        raise ValueError(f"materials: {mat.name} has no linked *_diff Image Texture to tint")
    x, y = diff.location
    hsv = _node(tree, 'ShaderNodeHueSaturation', x + 300, y)
    hsv.label = 'grass tint'
    for k, v in CLUMP_TINT.items():
        hsv.inputs[k].default_value = v
    targets = [lk.to_socket for lk in diff.outputs['Color'].links]
    tree.links.new(diff.outputs['Color'], hsv.inputs['Color'])
    for sock in targets:
        tree.links.new(hsv.outputs['Color'], sock)
    mat['castle3d_tint'] = True


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
