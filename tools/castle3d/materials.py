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
# cobble-mud blend, and world_from_hdri. Increment 2: LIBRARY, the nine sets
# the blueprint's `material` field names for the curtain, the drums, their
# floors, walks and roofs (#849), through library(slug). Increment 3: the gate
# timber and iron (#852), ALIAS for the slugs `iron` and `oak`, and PLAIN for
# the sets that take no tiling break-up. Increment 4: the buildings' five sets
# (#853), the two tile floors in PLAIN and the carpet and the timber in
# SWAP_RISE. Increment 4b (#854): DRESSED and dressing(), the plan's dressed
# stone darkened for the openings in rubble, and LOOK, plastered_wall_04's
# tint, warmth, grime and undulation, all from maps already fetched.
# Increment 5 (#857, #858): THATCH_SET and thatch(), the thatch, first a
# labelled stand-in from rough_wood, now reed_roof_04; DRESSING moved to
# stone_pavers; and LOOK's `object_tint`, the plaster multiplied by the
# object's colour, white on every object but the six houses. The swap after it fetched reed_roof_04's 5 rows.
# Later increments add the rest here, not in their stage modules.

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
# slug -> the texture's real-world size in metres, from the API's `dimensions`
# (api.polyhaven.com/info/<slug>, millimetres). Each is the exact slug a
# blueprint piece's `material` names, fetched as the same five 2k jpg maps (#849).
LIBRARY = {
    'castle_wall_slates': 2.5,
    'defense_wall': 20.0,
    'castle_brick_02_red': 1.5,
    # Not its real 1.5 m: #860's named fallback, the library's one labelled
    # exception to #849, with Devon's yes of 2026-09-28 ("yes for stone at 2.5").
    'medieval_blocks_02': 2.5,
    'plastered_wall_04': 3.2,
    'stone_pavers': 2.0,
    'wood_planks': 1.5,
    'wood_floor_deck': 1.8,
    'roof_slates_02': 3.0,
    'wooden_gate': 1.9,     # increment 3 (#852): the gate leaves and the portcullis timber
    'rusty_metal': 1.5,     # increment 3 (#852): straps, portcullis points, cell-bars
    'old_planks_02': 2.0,   # increment 4 (#853): masons-lodge-roof, 5 ground floors (not the roof boards, #856)
    'rock_tile_floor': 1.96,  # increment 4: the great hall and the King's hall floors
    'floor_tiles_02': 4.0,  # increment 4: the chapel drum and the nave floors
    'dirty_carpet': 0.6,    # increment 4: floor-royal-apartments, the one carpet in the castle
    'rough_wood': 0.5,      # increment 4: the hall trusses and every #853 beam (buildings.TIMBER)
}
# A blueprint slug with no set of its own -> the LIBRARY set that dresses it
# (#852, SPECS "The alias"). library() names the material after the set,
# MAT_<asset>, so `oak` and `wooden_gate` share one material and one set of
# image loads, and the name says which Poly Haven set is on the object.
ALIAS = {'iron': 'rusty_metal', 'oak': 'wooden_gate'}
# Sets built with no tiling break-up (SPECS "The tiling break-up on timber and
# iron"): a leaf is 1.9 m, one tile of wooden_gate, and the offset sample would
# shift boards sideways at a patch seam across it. The two tile floors (increment
# 4) likewise: the offset sample would step their grout grid at every seam.
PLAIN = {'wooden_gate', 'rusty_metal', 'rock_tile_floor', 'floor_tiles_02'}
for _k, _v in ALIAS.items():
    if _k in LIBRARY or _v not in LIBRARY:
        raise ValueError(f"materials: ALIAS {_k!r} -> {_v!r} must map a slug not in LIBRARY onto one that is")
for _k in PLAIN:
    if _k not in LIBRARY:
        raise ValueError(f"materials: PLAIN names {_k!r}, which is not in LIBRARY")
# The plan's dressed stone (#541). gates.py and buildings.py both read it, so it
# lives here as a material fact: a run or an arch already in it is not dressed.
DRESSED = 'medieval_blocks_02'
# The dressing round an opening in rubble (#854, amended by #858): a coursed
# set and its Value times this. #854 took DRESSED's own set at 0.6, and its 2k
# diffuse is random round-edged rubble, reddened by the darkening; stone_pavers
# is squared blocks in straight courses (0.49 m courses, 0.55 to 0.65 m
# blocks), diffuse times AO 0.090 in linear luminance, so 1.2 brings it to
# 0.108 against castle_wall_slates' 0.107 and the step at the arris stays
# light. DRESSED itself stays the plan's slug (#541).
DRESSING = ('stone_pavers', 1.2)
if DRESSING[0] not in LIBRARY:
    raise ValueError(f"materials: DRESSING names {DRESSING[0]!r}, which is not in LIBRARY")
# The thatch (#857): (set, metres per repeat, rise, look) in one tuple, built by
# thatch(). Not a LIBRARY entry, since no blueprint `material` names thatch, so
# SWAP_RISE gains nothing and the rise lives here. reed_roof_04, Devon's pick
# of 2026-09-28 ("Thatch: reed_roof_04"), at its real 2.5 m and rise 0, since
# the reeds' butt ends are courses. It retires the stand-in #857 built on,
# ('rough_wood', 2.0, 0.5, {'warm': (1.0, 0.88, 0.66, 1.0)}).
THATCH_SET = ('reed_roof_04', 2.5, 0.0, {})
# Per-set look (#854), applied inside library(), so MAT_<asset> is the one
# material everywhere the set is used. plastered_wall_04's maps are a neutral
# grey at linear 0.257 with AO 1.000 and displacement std 0.003: a lit card.
# `tint` and `warm` bring it to about 0.156 and a limewash cream; `grime` is a
# world noise (metres, detail, the Fac range mapped, onto this Value range)
# multiplying the colour's Value after the drift; `undulate` is a Bump
# (strength, distance in metres) on a world noise (metres, detail) between
# the normal map and the BSDF, so the render follows uneven stone under it.
# `object_tint` (#857) multiplies the colour by Object Info's Color after
# `warm`: Blender's default object colour is white, so every object but the
# six houses (town.PLASTER_TINTS) renders exactly as before.
# Increment 5's look fixes: medieval_blocks_02's salmon (hue 26, saturation
# 0.36, luminance 0.180 on the 2k maps) taken to a grey-buff stone, hue 31,
# saturation 0.20, luminance 0.144 (#860), on the castle's faces in the set as
# on the town's; rough_wood darker, warmer and matte (#861), luminance 0.105 to
# 0.043, its roughness held at 0.75 or more for the reason MUD_ROUGH is: at the
# map's 0.51 the posts mirrored the sky and read silver-grey.
LOOK = {
    'medieval_blocks_02': {
        'tint': {'Hue': 0.52, 'Saturation': 0.6, 'Value': 0.65},
    },
    'rough_wood': {
        'tint': {'Hue': 0.5, 'Saturation': 1.0, 'Value': 0.5},
        'warm': (1.0, 0.78, 0.55, 1.0),
        'rough_min': 0.75,
    },
    'plastered_wall_04': {
        'tint': {'Hue': 0.5, 'Saturation': 1.0, 'Value': 0.65},
        'warm': (1.0, 0.93, 0.80, 1.0),
        'grime': (1.5, 4.0, (0.4, 0.6), (0.75, 1.2)),
        'undulate': (0.3, 0.02, 0.6, 3.0),
        'object_tint': True,
    },
}
for _k in LOOK:
    if _k not in LIBRARY:
        raise ValueError(f"materials: LOOK names {_k!r}, which is not in LIBRARY")
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
# Still pinkish-grey after MUD_TINT in the increment 1 still, so the mud's
# diffuse is multiplied by a warm brown after it: red kept, blue cut most.
MUD_WARM = (1.0, 0.86, 0.66, 1.0)
RUT_FEATHER = 0.3  # the road's mud blend, either side of its midpoint


# A library set box-projected at one scale repeats on a grid you can count:
# castle_wall_slates' few pale stones came back every 2.5 m along a 40 m run in
# the increment 2 still. So each LIBRARY set is sampled twice, A at the plain
# mapping and B at the same scale moved by SWAP_OFFSET of a tile along the two
# horizontal axes. A coursed set (brick, planks, roof slates) moves no
# further, so B's courses stay level with A's. An uncoursed one moves SWAP_RISE
# of a tile up as well: with the sideways shift alone the slates' pale stones
# in B sat on A's rows and the rows still read as a 2.5 m grid, and rubble has
# no course for a vertical shift to break at the seam.
# A world-space noise of SWAP_SCALE tiles picks A or B per patch, through a
# smoothstep SWAP_EDGE either side of its midpoint so most of a wall is purely
# one or the other and the seam is about half a metre, never a half-and-half
# blur. All five maps take the same factor, so the relief follows the colour.
# Then VALUE_SPREAD of brightness, either way, from a VALUE_SCALE metre noise,
# on the colour only, so a long run is not one flat tone. Every map stays an
# Image Texture, BOX at BOX_BLEND, so check.py line 4 still sees each image.
# The ground sets are not doubled: terrain.py already varies them by attribute.
SWAP_OFFSET = (0.37, 0.61)       # of a tile, Blender x and y (z is up)
# rough_wood and dirty_carpet (increment 4) are uncoursed too: a 0.5 m grain and a
# 0.6 m carpet repeat 14 and 33 times along a truss and a 20 m floor. So is
# medieval_blocks_02 (#860): random rubble with no course (#858), filed with brick
# above on its name until its 1.5 m mortar bands ran unbroken along the town
# wall's 64 m and its large stones read as diagonals.
SWAP_RISE = {'castle_wall_slates': 0.5, 'defense_wall': 0.5, 'plastered_wall_04': 0.5,
             'rough_wood': 0.5, 'dirty_carpet': 0.5, 'medieval_blocks_02': 0.5}
SWAP_SCALE = 1.5                 # the A/B noise's feature size, in tiles
SWAP_EDGE = 0.04                 # the smoothstep's half width, in noise units
VALUE_SPREAD = 0.08              # brightness moves by up to this, either way
VALUE_SCALE = 12.0               # metres, the brightness noise's feature size


def _sample(tree, asset, rows, vector, x, y, tag=''):
    """The five maps box-projected at `vector`, as {map: Image Texture node}."""
    tex = {}
    for i, m in enumerate(MAPS):
        t = _node(tree, 'ShaderNodeTexImage', x, y + 300 - 280 * i)
        t.image = load_image(rows[m], colour=(m == 'diff'))
        t.projection = 'BOX'
        t.projection_blend = BOX_BLEND
        t.label = f"{asset} {m}{tag}"
        tree.links.new(vector, t.inputs['Vector'])
        tex[m] = t
    return tex


def _world_noise(tree, x, y, scale, detail):
    """A world-space Noise Texture of about `scale` metres; returns its Fac."""
    geo = _node(tree, 'ShaderNodeNewGeometry', x - 200, y)
    noise = _node(tree, 'ShaderNodeTexNoise', x, y)
    noise.inputs['Scale'].default_value = 1.0 / scale
    noise.inputs['Detail'].default_value = detail
    tree.links.new(geo.outputs['Position'], noise.inputs['Vector'])
    return noise.outputs['Fac']


def _maps(tree, asset, size, x, y, tint=None, rough_min=None, warm=None, rise=None, grime=None, object_tint=False):
    """`asset`'s five maps box-projected on world coordinates at `size` metres
    per repeat, blend 0.2. Returns the sockets a shader reads: the diffuse
    times AO (after `grime`, a LOOK noise on its Value, then `tint`, a
    Hue/Saturation/Value dict, then `warm`, an RGBA multiply, and then, with
    `object_tint`, a multiply by Object Info's Color, each when given), the
    roughness (no lower than `rough_min`, when given), the tangent
    normal colour and the height. With `rise` (a tile fraction, 0 for a
    coursed set), each map is two offset samples swapped by patch and the
    colour's brightness drifts (SWAP_OFFSET and the constants beside it)."""
    rows = {m: common.source(f"{asset}:{m}") for m in MAPS}
    links = tree.links
    geo = _node(tree, 'ShaderNodeNewGeometry', x - 500, y)
    mapping = _node(tree, 'ShaderNodeMapping', x - 300, y)
    mapping.inputs['Scale'].default_value = (1.0 / size, 1.0 / size, 1.0 / size)
    links.new(geo.outputs['Position'], mapping.inputs['Vector'])
    a = _sample(tree, asset, rows, mapping.outputs['Vector'], x, y)
    tex = {m: a[m].outputs['Color'] for m in MAPS}

    if rise is not None:
        shift = _node(tree, 'ShaderNodeMapping', x - 300, y - 1600)
        shift.inputs['Scale'].default_value = (1.0 / size, 1.0 / size, 1.0 / size)
        shift.inputs['Location'].default_value = (*SWAP_OFFSET, rise)  # added after the scale, so in tiles
        links.new(geo.outputs['Position'], shift.inputs['Vector'])
        b = _sample(tree, asset, rows, shift.outputs['Vector'], x, y - 1600, ' B')
        fac = _world_noise(tree, x - 300, y - 3100, SWAP_SCALE * size, 2.0)
        edge = _node(tree, 'ShaderNodeMapRange', x - 100, y - 3100, interpolation_type='SMOOTHSTEP', clamp=True)
        edge.inputs['From Min'].default_value = 0.5 - SWAP_EDGE
        edge.inputs['From Max'].default_value = 0.5 + SWAP_EDGE
        links.new(fac, edge.inputs['Value'])
        f = edge.outputs['Result']
        tex = {m: _mix(tree, 'RGBA', x + 150, y + 300 - 280 * i, f, tex[m], b[m].outputs['Color'])
               for i, m in enumerate(MAPS)}
        # The noise's Fac sits mostly in 0.3..0.7, mapped onto 1 -+ VALUE_SPREAD.
        drift = _world_noise(tree, x - 300, y - 3400, VALUE_SCALE, 2.0)
        val = _node(tree, 'ShaderNodeMapRange', x - 100, y - 3400, clamp=True)
        val.inputs['From Min'].default_value = 0.3
        val.inputs['From Max'].default_value = 0.7
        val.inputs['To Min'].default_value = 1.0 - VALUE_SPREAD
        val.inputs['To Max'].default_value = 1.0 + VALUE_SPREAD
        links.new(drift, val.inputs['Value'])
        hsv = _node(tree, 'ShaderNodeHueSaturation', x + 300, y + 450)
        hsv.label = f"{asset} value drift"
        links.new(tex['diff'], hsv.inputs['Color'])
        links.new(val.outputs['Result'], hsv.inputs['Value'])
        tex['diff'] = hsv.outputs['Color']

    diff = tex['diff']
    if grime:
        scale, detail, (f0, f1), (v0, v1) = grime
        dirt = _world_noise(tree, x - 300, y - 3700, scale, detail)
        rng = _node(tree, 'ShaderNodeMapRange', x - 100, y - 3700, clamp=True)
        rng.inputs['From Min'].default_value = f0
        rng.inputs['From Max'].default_value = f1
        rng.inputs['To Min'].default_value = v0
        rng.inputs['To Max'].default_value = v1
        links.new(dirt, rng.inputs['Value'])
        hsv = _node(tree, 'ShaderNodeHueSaturation', x + 250, y + 250)
        hsv.label = f"{asset} grime"
        links.new(diff, hsv.inputs['Color'])
        links.new(rng.outputs['Result'], hsv.inputs['Value'])
        diff = hsv.outputs['Color']
    if tint:
        hsv = _node(tree, 'ShaderNodeHueSaturation', x + 250, y + 450)
        hsv.label = f"{asset} tint"
        for k, v in tint.items():
            hsv.inputs[k].default_value = v
        links.new(diff, hsv.inputs['Color'])
        diff = hsv.outputs['Color']
    if warm:
        mul = _node(tree, 'ShaderNodeMix', x + 250, y + 650, data_type='RGBA', blend_type='MULTIPLY')
        mul.label = f"{asset} warm"
        _sock(mul.inputs, 'Factor').default_value = 1.0
        links.new(diff, _sock(mul.inputs, 'A'))
        _sock(mul.inputs, 'B').default_value = warm
        diff = _sock(mul.outputs, 'Result')
    if object_tint:
        info = _node(tree, 'ShaderNodeObjectInfo', x + 50, y + 850)
        mul = _node(tree, 'ShaderNodeMix', x + 250, y + 850, data_type='RGBA', blend_type='MULTIPLY')
        mul.label = f"{asset} object tint"
        _sock(mul.inputs, 'Factor').default_value = 1.0
        links.new(diff, _sock(mul.inputs, 'A'))
        links.new(info.outputs['Color'], _sock(mul.inputs, 'B'))
        diff = _sock(mul.outputs, 'Result')
    ao =_node(tree, 'ShaderNodeMix', x + 450, y + 300, data_type='RGBA', blend_type='MULTIPLY')
    _sock(ao.inputs, 'Factor').default_value = 1.0
    links.new(diff, _sock(ao.inputs, 'A'))
    links.new(tex['ao'], _sock(ao.inputs, 'B'))
    rough = tex['rough']
    if rough_min is not None:
        floor = _node(tree, 'ShaderNodeMath', x + 250, y - 250, operation='MAXIMUM')
        floor.inputs[1].default_value = rough_min
        links.new(rough, floor.inputs[0])
        rough = floor.outputs[0]
    return {'base': _sock(ao.outputs, 'Result'), 'rough': rough,
            'nor': tex['nor_gl'], 'disp': tex['disp']}


def _new_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    return mat


def _finish(mat, bsdf_x, maps, surface=None, undulate=None):
    """A Principled BSDF from `maps`, a tangent normal map, bump-only
    displacement, and the output. `surface(bsdf_socket)` may wrap the BSDF.
    `undulate`, a LOOK tuple, puts a Bump on a world noise between the normal
    map and the BSDF."""
    tree = mat.node_tree
    links = tree.links
    out = _node(tree, 'ShaderNodeOutputMaterial', bsdf_x + 600, 0)
    bsdf = _node(tree, 'ShaderNodeBsdfPrincipled', bsdf_x, 0)
    links.new(maps['base'], bsdf.inputs['Base Color'])
    links.new(maps['rough'], bsdf.inputs['Roughness'])
    nmap = _node(tree, 'ShaderNodeNormalMap', bsdf_x - 300, -300, space='TANGENT', uv_map='UVMap')
    links.new(maps['nor'], nmap.inputs['Color'])
    normal = nmap.outputs['Normal']
    if undulate:
        strength, distance, scale, detail = undulate
        height = _world_noise(tree, bsdf_x - 500, -700, scale, detail)
        bump = _node(tree, 'ShaderNodeBump', bsdf_x - 150, -550)
        bump.label = 'undulate'
        bump.inputs['Strength'].default_value = strength
        bump.inputs['Distance'].default_value = distance
        links.new(height, bump.inputs['Height'])
        links.new(normal, bump.inputs['Normal'])
        normal = bump.outputs['Normal']
    links.new(normal, bsdf.inputs['Normal'])
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


def box_material(name, asset, size, tint=None, rise=None, warm=None, grime=None, undulate=None, object_tint=False,
                 rough_min=None):
    """A Principled material from `asset`'s five maps, box-projected on world
    coordinates at `size` metres per repeat, blend 0.2, doubled when `rise`
    is given (see _maps), with a LOOK's `warm`, `grime`, `undulate`,
    `object_tint` and `rough_min` (#861) when given."""
    mat = _new_material(name)
    maps = _maps(mat.node_tree, asset, size, -400, 0, tint, rough_min=rough_min, warm=warm, rise=rise, grime=grime,
                 object_tint=object_tint)
    return _finish(mat, 600, maps, undulate=undulate)


def ground(name):
    """One of GROUND's materials, built once per file."""
    if name not in GROUND:
        raise KeyError(f"materials: no ground material {name}; there are {', '.join(GROUND)}")
    have = bpy.data.materials.get(f"MAT_{name}")
    if have is not None:
        return have
    asset, size = GROUND[name]
    return box_material(f"MAT_{name}", asset, size, GRASS_TINT if name == 'grass' else None)


def library(slug):
    """MAT_<asset>, one of LIBRARY's sets box-projected on world coordinates at
    its real-world size, blend 0.2, its repeat broken up by a second offset
    sample (SWAP_OFFSET) unless the set is PLAIN, built once per file. `slug`
    is a LIBRARY key or an ALIAS key, which resolves to its set. Anything else
    raises, naming it: a piece whose `material` this library cannot dress is
    a question for the lead, not a flat colour."""
    asset = ALIAS.get(slug, slug)
    if asset not in LIBRARY:
        raise KeyError(f"materials: no library material {slug!r}; there are {', '.join(LIBRARY)} "
                       f"and the aliases {', '.join(ALIAS)}")
    have = bpy.data.materials.get(f"MAT_{asset}")
    if have is not None:
        return have
    rise = None if asset in PLAIN else SWAP_RISE.get(asset, 0.0)
    return box_material(f"MAT_{asset}", asset, LIBRARY[asset], rise=rise, **LOOK.get(asset, {}))


def dressing():
    """MAT_<DRESSING's set>_dressing: squared, coursed stone (rise 0), its
    Value times DRESSING[1], for the reveals and bands round the openings in
    rubble (#854, #858) and the church's recesses and cross (#857). Built once
    per file; the set's name stays in the material's, for check.py line 4 and
    CREDITS.md."""
    asset, value = DRESSING
    name = f"MAT_{asset}_dressing"
    have = bpy.data.materials.get(name)
    if have is not None:
        return have
    return box_material(name, asset, LIBRARY[asset], {'Hue': 0.5, 'Saturation': 1.0, 'Value': value}, rise=0.0)


def thatch():
    """MAT_<THATCH_SET's set>_thatch, every thatch face in town.py (#857):
    the set at THATCH_SET's size, rise and look, built once per file. Its own
    material, so MAT_<set> (rough_wood's is buildings.TIMBER) does not change;
    the images load once (check_existing). A set with no sources.json rows
    raises in _maps, naming the first row, which is why the swap cannot land
    without its fetch."""
    asset, size, rise, look = THATCH_SET
    name = f"MAT_{asset}_thatch"
    have = bpy.data.materials.get(name)
    if have is not None:
        return have
    return box_material(name, asset, size, rise=rise, **look)


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
    m = _maps(tree, *GROUND['mud'], -700, -200, MUD_TINT, MUD_ROUGH, MUD_WARM)
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
    m = _maps(tree, *GROUND['mud'], -700, -200, MUD_TINT, MUD_ROUGH, MUD_WARM)
    # Feathered: a 0.3 ramp either side of the midpoint and a coarser, stronger
    # noise, so a rut or a puddle fades into the cobbles instead of ending on
    # the 0.12 edge increment 1's still showed as a hard-edged patch.
    f = _blend_factor(tree, 'rut', -700, -1200, 1.6, 0.8, RUT_FEATHER)
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
