# walls.py - the walls stage: the curtain, the cross-wall, the gate-over runs,
# their walks and their crenellation (increment 2).
#
# Snapped to the blueprint (#500): every run is the plan's own collider boxes
# for it (`<id>`, or `<id>-<n>` round a doorway), clipped to the piece's box,
# so a doorway the plan cuts through a run's end for a drum's door is a real
# opening here and nothing is re-derived. Each run is solid masonry in the
# blueprint's `material` (#849), box-projected on world coordinates.
#
# THE BATTER (the lead's call, 2026-09-27). A curtain run standing on the
# ground splays its OUTER face BATTER[0] m outward over the bottom BATTER[1] m;
# the inner face stays plumb, so nothing inside the ward moves. The outer face
# is the one away from the ward centre, the middle of the blueprint's
# `curtain` box. The cross-wall (not curtain) and the gate-over runs (standing
# on their arches at 4 m) have none.
#
# THE RETURN. Where a battered run's end is an outside corner, its end face is
# on the plane of a perpendicular battered run's outer face (the barbican's
# two west corners, the garden's two east corners), and that end face splays
# with it, so the batter turns the corner. Without it the end stood plumb
# beside its neighbour's splayed foot: a 0.5 m step, and a 2.5 m sliver of the
# neighbour's end face showing past it (#34's break: drop `returns`).
#
# THE WALK. Each `-walk` floor piece at its blueprint box, in its own material,
# its top WALK_LIFT over the wall top it lies on so the two faces do not fight.
#
# THE CRENELLATION. One object per run, carrying in `planIds` every kit merlon
# that run realises (#843): a merlon belongs to the run whose collider box
# holds its anchor and whose outer face it looks out of (the side its box lies
# on from its anchor), and each of the 61 must find exactly one run or the
# stage raises. The parapet takes the merlons' own band: their cross extent
# (1.2 m, 0.4 m of it corbelled past the face), their along extent end to end,
# and their height (8 to 9.6). Along it, merlons and crenels alternate at the
# drums' `crown` rhythm read as widths (merlon 1.5 m, crenel 0.6 m, stretched
# to fit whole), the crenels' sill SILL m over the wall top, and every other
# merlon has an arrow slit, SLIT wide and SLIT_TALL tall, through the parapet.

import masonry
import materials
import common

BATTER = (0.5, 2.5)     # metres of outward splay at the foot, over this height
WALK_LIFT = 0.005       # the walk's top over the wall's, against z-fighting
SILL = 0.9              # a crenel's sill over the wall top (breast height on the walk)
SLIT = 0.1              # an arrow slit's width
SLIT_TALL = 1.2         # and its height, centred in the parapet
EPS = 1e-6

# #851: THE OUTER GATE, a model-only amendment of #435 (the game's barbican-west
# stays solid and #435 stands for the game). `run`'s wall is built as its
# collider less a block the size of `like`'s arch: the run's x, the like-arch
# box's z and y (x -46 to -42, z -2 to 2, y 0 to 4 today). WALL_barbican-west
# keeps its planId, so check.py line 6 still names the run if it goes, and
# gates.py builds the block as ARCH_barbican-outer from this same constant, so
# the hole and the arch cannot drift apart. There is no allow.json entry: the
# departure fails neither line 3 nor line 6, and an entry would hide a deleted
# wall (#851). The block must span outside-road's z exactly, or the stage
# raises naming both: a plan that moves the road leaves a failed build, not a
# gate beside it.
OUTER_GATE = {'run': 'barbican-west', 'like': 'west-gate-arch', 'road': 'outside-road'}


def outer_gate_block(bp):
    """#851's block as a game box {min, max}: OUTER_GATE's run's x, its like-
    arch's z and y. Raises unless its z span is the road's within EPS."""
    pieces = {p['id']: p for p in bp['pieces']}
    for k in ('run', 'like', 'road'):
        if OUTER_GATE[k] not in pieces:
            raise ValueError(f"walls: OUTER_GATE's {k} {OUTER_GATE[k]} is not a blueprint piece (#851)")
    run, like, road = (pieces[OUTER_GATE[k]]['box'] for k in ('run', 'like', 'road'))
    block = {'min': {'x': run['min']['x'], 'y': like['min']['y'], 'z': like['min']['z']},
             'max': {'x': run['max']['x'], 'y': like['max']['y'], 'z': like['max']['z']}}
    if abs(block['min']['z'] - road['min']['z']) > EPS or abs(block['max']['z'] - road['max']['z']) > EPS:
        raise ValueError(f"walls: #851's outer gate block in {OUTER_GATE['run']} spans z {block['min']['z']:g} to "
                         f"{block['max']['z']:g}, but {OUTER_GATE['road']} spans z {road['min']['z']:g} to "
                         f"{road['max']['z']:g}; the gate must stand on the road")
    return block


def minus_block(cols, block):
    """Each collider box less `block`, as up to six boxes per collider: either
    side of it in z, then either side in x within its z span, then above and
    below it within both. The ids are kept, since build_run reads only boxes."""
    out = []
    for c in cols:
        b = c['box']
        lo, hi = b['min'], b['max']
        blo, bhi = block['min'], block['max']
        if any(hi[k] <= blo[k] + EPS or lo[k] >= bhi[k] - EPS for k in 'xyz'):
            out.append(c)
            continue

        def part(**r):
            box = {'min': dict(lo), 'max': dict(hi)}
            for k, (a, z) in r.items():
                box['min'][k], box['max'][k] = a, z
            if all(box['max'][k] - box['min'][k] > EPS for k in 'xyz'):
                out.append({'id': c['id'], 'box': box})
        zin = (max(lo['z'], blo['z']), min(hi['z'], bhi['z']))
        xin = (max(lo['x'], blo['x']), min(hi['x'], bhi['x']))
        part(z=(lo['z'], blo['z']))
        part(z=(bhi['z'], hi['z']))
        part(z=zin, x=(lo['x'], blo['x']))
        part(z=zin, x=(bhi['x'], hi['x']))
        part(z=zin, x=xin, y=(lo['y'], blo['y']))
        part(z=zin, x=xin, y=(bhi['y'], hi['y']))
    return out


def ward_centre(bp):
    cb = bp['curtain']
    return ((cb['min']['x'] + cb['max']['x']) / 2, (cb['min']['z'] + cb['max']['z']) / 2)


def battered(piece):
    """A curtain run standing on the ground splays its outer face (BATTER)."""
    return bool(piece['curtain']) and piece['box']['min']['y'] < EPS


def facing_of(bp, piece):
    """The run's (axis, outward sign), exactly as build() decides it, for
    gates.py's jambs, which splay the way the runs beside them do."""
    cols = masonry.colliders_of(bp, piece['id'])
    walk = next((p for p in bp['pieces'] if p['id'] == piece['id'] + '-walk'), None)
    return _facing(piece, _union([c['box'] for c in cols]), walk, ward_centre(bp))


def _rect(box):
    return box['min']['x'], box['max']['x'], box['min']['z'], box['max']['z']


def _union(boxes):
    return {'min': {k: min(b['min'][k] for b in boxes) for k in 'xyz'},
            'max': {k: max(b['max'][k] for b in boxes) for k in 'xyz'}}


def _facing(piece, whole, walk, ward):
    """(axis the run travels, outward sign across it): 'x' runs face +-z and
    'z' runs face +-x. The axis is the walk's long side where the run has a
    walk (a gate-over's box is square), else its collider box's long side;
    the sign is away from the ward centre."""
    src = walk['box'] if walk else whole
    dx = src['max']['x'] - src['min']['x']
    dz = src['max']['z'] - src['min']['z']
    if abs(dx - dz) < EPS:
        raise ValueError(f"walls: {piece['id']} is square and has no walk to say which way it runs")
    axis = 'x' if dx > dz else 'z'
    b = piece['box']
    if axis == 'x':
        c = (b['min']['z'] + b['max']['z']) / 2
        return axis, (1 if c > ward[1] else -1)
    c = (b['min']['x'] + b['max']['x']) / 2
    return axis, (1 if c > ward[0] else -1)


def _merlon_facing(m):
    """(axis across the merlon, sign): the kit merlon's box is thin across the
    run and lies outward of its anchor, so both come off the blueprint."""
    b, (px, _py, pz) = m['box'], m['transform']['position']
    dx = b['max']['x'] - b['min']['x']
    dz = b['max']['z'] - b['min']['z']
    if dz < dx:  # thin in z: a run along x, facing +-z
        return 'x', (1 if (b['min']['z'] + b['max']['z']) / 2 > pz else -1)
    return 'z', (1 if (b['min']['x'] + b['max']['x']) / 2 > px else -1)


def returns_of(piece, facing, battered):
    """{-1: lo end, 1: hi end} for each end of a battered run that is an
    outside corner: some other battered run's outer face lies on the end's
    plane, looks the same way along this run, and touches this run's box."""
    axis, _sign = facing
    cross = 'z' if axis == 'x' else 'x'
    b = piece['box']
    out = {}
    for d, end in ((-1, b['min'][axis]), (1, b['max'][axis])):
        for q, (q_axis, q_sign) in battered:
            if q is piece or q_axis == axis or q_sign != d:
                continue
            qb = q['box']
            plane = (qb['max'] if q_sign > 0 else qb['min'])[axis]
            if abs(plane - end) < EPS and qb['min'][cross] <= b['max'][cross] + EPS \
                    and qb['max'][cross] >= b['min'][cross] - EPS:
                out[d] = end
    return out


def build_run(solid, piece, cols, facing, batter, returns=None):
    """The run's collider boxes clipped to its piece box; with `batter`, each
    box's face on the run's outer plane splays outward at its foot, and so does
    a box's end face at one of `returns`' ends (an outside corner). Without
    `batter` the facing is not read and may be None (buildings.py's runs)."""
    b = piece['box']
    if batter:
        axis, sign = facing
        cross = 'z' if axis == 'x' else 'x'
        outer = b['max' if sign > 0 else 'min'][cross]
    returns = returns or {}
    for c in cols:
        x0 = max(c['box']['min']['x'], b['min']['x']); x1 = min(c['box']['max']['x'], b['max']['x'])
        z0 = max(c['box']['min']['z'], b['min']['z']); z1 = min(c['box']['max']['z'], b['max']['z'])
        y0 = max(c['box']['min']['y'], b['min']['y']); y1 = min(c['box']['max']['y'], b['max']['y'])
        if x1 - x0 < EPS or z1 - z0 < EPS or y1 - y0 < EPS:
            continue
        if not batter:
            solid.box(x0, x1, y0, y1, z0, z1)
            continue

        a0, a1, c0, c1 = (x0, x1, z0, z1) if axis == 'x' else (z0, z1, x0, x1)
        on_outer = abs((c1 if sign > 0 else c0) - outer) < EPS
        ret_lo = on_outer and -1 in returns and abs(a0 - returns[-1]) < EPS
        ret_hi = on_outer and 1 in returns and abs(a1 - returns[1]) < EPS

        def ring(y, a0=a0, a1=a1, c0=c0, c1=c1, ret_lo=ret_lo, ret_hi=ret_hi, on_outer=on_outer):
            s = masonry.splay(y, *BATTER)
            ca = c0 - s if on_outer and sign < 0 else c0
            cb = c1 + s if on_outer and sign > 0 else c1
            aa = a0 - s if ret_lo else a0
            ab = a1 + s if ret_hi else a1
            if axis == 'x':
                return [(aa, ca), (ab, ca), (ab, cb), (aa, cb)]
            return [(ca, aa), (cb, aa), (cb, ab), (ca, ab)]
        solid.prism(ring, masonry.levels(y0, y1, BATTER[1]))


def rhythm(lo, hi, merlon, crenel):
    """[(a, b, is_merlon)] from lo to hi, merlon first and last, the widths
    stretched by one factor so the pattern fits whole."""
    length = hi - lo
    n = max(1, round((length + crenel) / (merlon + crenel)))
    k = length / (n * merlon + (n - 1) * crenel)
    out, at = [], lo
    for i in range(n):
        out.append((at, at + merlon * k, True))
        at += merlon * k
        if i < n - 1:
            out.append((at, at + crenel * k, False))
            at += crenel * k
    return out


def build_crenellation(solid, run_id, facing, mine, crown):
    """The parapet over the merlons' band, returning how many slits it has."""
    axis, _sign = facing
    boxes = [m['box'] for m in mine]
    u = _union(boxes)
    y0, y1 = u['min']['y'], u['max']['y']
    sill = y0 + SILL
    s0 = (y0 + y1) / 2 - SLIT_TALL / 2
    s1 = s0 + SLIT_TALL
    if not (y0 < s0 and s1 < y1):
        raise ValueError(f"walls: {run_id}'s parapet {y0} to {y1} is too low for a {SLIT_TALL} m slit")
    along = ('x', 'z') if axis == 'x' else ('z', 'x')
    lo, hi = u['min'][along[0]], u['max'][along[0]]
    c0, c1 = u['min'][along[1]], u['max'][along[1]]

    def put(a, b, ya, yb):
        if axis == 'x':
            solid.box(a, b, ya, yb, c0, c1)
        else:
            solid.box(c0, c1, ya, yb, a, b)

    slits, merlon_no = 0, 0
    for a, b, is_merlon in rhythm(lo, hi, crown['merlon'], crown['crenel']):
        if not is_merlon:
            put(a, b, y0, sill)
            continue
        if merlon_no % 2 == 0 and b - a > 3 * SLIT:
            m = (a + b) / 2
            put(a, m - SLIT / 2, y0, y1)
            put(m - SLIT / 2, m + SLIT / 2, y0, s0)
            put(m - SLIT / 2, m + SLIT / 2, s1, y1)
            put(m + SLIT / 2, b, y0, y1)
            slits += 1
        else:
            put(a, b, y0, y1)
        merlon_no += 1
    return slits


def build(bp):
    col = common.stage_collection('walls')
    table = common.STAGE_OF(bp)
    mine = [p for p in bp['pieces'] if table[p['id']] == 'walls']
    runs = [p for p in mine if p['kind'] == 'wall']
    walks = {p['id']: p for p in mine if p['kind'] == 'floor'}
    merlons = [p for p in mine if p['kind'] == 'decor']
    other = [p['id'] for p in mine if p not in runs and p not in merlons and p['id'] not in walks]
    if other:
        raise ValueError(f"walls: STAGE_OF gives this stage pieces it does not build: {other}")
    crowns = {str(d['crown']) for d in bp['drums'] if d.get('crown')}
    if len(crowns) != 1:
        raise ValueError(f"walls: the drums carry {len(crowns)} different crowns; the crenellation needs one rhythm")
    crown = next(d['crown'] for d in bp['drums'] if d.get('crown'))
    ward = ward_centre(bp)
    block = outer_gate_block(bp)

    info = {}
    for p in runs:
        cols = masonry.colliders_of(bp, p['id'])
        walk = walks.get(p['id'] + '-walk')
        info[p['id']] = (cols, _union([c['box'] for c in cols]), _facing(p, _union([c['box'] for c in cols]), walk, ward))
    unclaimed = set(walks) - {p['id'] + '-walk' for p in runs}
    if unclaimed:
        raise ValueError(f"walls: walk(s) with no run: {sorted(unclaimed)}")

    # Each merlon to exactly one run: anchor inside the run's collider box, and
    # looking out of the run's outer face.
    claimed = {p['id']: [] for p in runs}
    for m in merlons:
        px, _py, pz = m['transform']['position']
        mf = _merlon_facing(m)
        hits = []
        for p in runs:
            _cols, whole, facing = info[p['id']]
            x0, x1, z0, z1 = _rect(whole)
            if facing == mf and x0 - EPS <= px <= x1 + EPS and z0 - EPS <= pz <= z1 + EPS:
                hits.append(p['id'])
        if len(hits) != 1:
            raise ValueError(f"walls: {m['id']} at x {px:g}, z {pz:g} facing {mf} is claimed by {len(hits)} runs "
                             f"({', '.join(hits) or 'none'}); every merlon needs exactly one")
        claimed[hits[0]].append(m)

    slits, corners = 0, 0
    battered_runs = [(p, info[p['id']][2]) for p in runs if battered(p)]
    cut = None
    for p in runs:
        cols, whole, facing = info[p['id']]
        mat = materials.library(p['material'])
        batter = battered(p)
        returns = returns_of(p, facing, battered_runs) if batter else {}
        corners += len(returns)
        if p['id'] == OUTER_GATE['run']:  # #851: the run less the outer gate's block
            cols = minus_block(cols, block)
            cut = len(cols)
        s = masonry.Solid()
        build_run(s, p, cols, facing, batter, returns)
        s.finish(f"WALL_{p['id']}", col, [mat], plan_id=p['id'])
        if claimed[p['id']]:
            s = masonry.Solid()
            slits += build_crenellation(s, p['id'], facing, claimed[p['id']], crown)
            s.finish(f"CREN_{p['id']}", col, [mat], plan_ids=sorted(m['id'] for m in claimed[p['id']]))
    for wid, w in walks.items():
        b = w['box']
        s = masonry.Solid()
        s.box(b['min']['x'], b['max']['x'], b['min']['y'], b['max']['y'] + WALK_LIFT, b['min']['z'], b['max']['z'])
        s.finish(f"WALK_{wid}", col, [materials.library(w['material'])], plan_id=wid)

    if cut is None:
        raise ValueError(f"walls: OUTER_GATE's run {OUTER_GATE['run']} is not a run of this stage (#851)")
    print(f"walls: {len(runs)} runs ({len(battered_runs)} battered {BATTER[0]} m over {BATTER[1]} m, "
          f"{corners} ends returned round an outside corner), {len(walks)} walks, "
          f"{sum(1 for v in claimed.values() if v)} crenellations realising {len(merlons)} merlons at "
          f"{crown['merlon']} / {crown['crenel']} m, {slits} merlon slits; {OUTER_GATE['run']} built as "
          f"{cut} boxes round #851's gate block, x {block['min']['x']:g} to {block['max']['x']:g}, "
          f"z {block['min']['z']:g} to {block['max']['z']:g}, y {block['min']['y']:g} to {block['max']['y']:g}")
