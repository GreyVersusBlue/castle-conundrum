# props_large.py - wishlist 55 to 70: large set pieces and the dressing kit.
import math
import random
from registry import prop
from kit import sub
from props_rooms import book_row, spear

R = random.Random(7)

# ------------------------------------------------------- large set pieces --
CAT = 'Large set pieces'


@prop('bell-and-rope', 'Tower bell in its frame, with rope and swinging clapper', CAT)
def bell(P):
    f = P.mesh('frame')
    for x in (-.8, .8):
        f.box((.14, .14, 2.3), (x, 0, 1.15), 'wood_dark')
        f.box((.16, 1.2, .14), (x, 0, .07), 'wood_dark')
        f.beam((x, -.5, .12), (x, 0, 1.2), .1, .1, 'wood_dark')
        f.beam((x, .5, .12), (x, 0, 1.2), .1, .1, 'wood_dark')
        f.box((.2, .2, .1), (x, 0, 2.2), 'iron_dark')
    f.box((1.8, .14, .14), (0, 0, 2.37), 'wood_dark')
    b = P.mesh('bell', pivot=(0, 0, 2.15), parent='frame')
    b.box((1.5, .2, .2), (0, 0, 2.15), 'wood', cells={'+z': 'wood_dark'})
    b.rod((-.8, 0, 2.15), (.8, 0, 2.15), .03, 'iron', seg=6)
    prof = [(0, .09), (.44, 0), (.47, .04), (.4, .12), (.31, .3), (.27, .5), (.2, .6), (.08, .63), (0, .63)]
    b.lathe(prof, loc=(0, 0, 1.42), cell='bronze', seg=12, bands=['void', 'bronze', 'brass_dark', 'bronze', 'bronze', 'bronze', 'bronze', 'bronze'])
    b.box((.2, .12, .1), (0, 0, 2.03), 'iron_dark')
    b.beam((0, 0, 2.2), (0, -.7, 2.45), .06, .06, 'wood')
    b.rod((0, -.72, 2.43), (0, -.72, .9), .014, 'rope', seg=5)
    for i, z in enumerate((.9, 1.05, 1.2)):
        b.cyl(.03, .15, (0, -.72, z), 'cloth_red' if i % 2 == 0 else 'cloth_cream', seg=6)
    b.rod((0, -.72, .9), (0, -.72, .6), .014, 'rope', seg=5)
    c = P.mesh('clapper', pivot=(0, 0, 1.98), parent='bell')
    c.rod((0, 0, 1.98), (0, 0, 1.52), .018, 'iron_dark', seg=5)
    c.sphere(.06, (0, 0, 1.5), 'iron_dark', seg=6, rings=4)
    P.notes = 'Three nodes: frame, bell (headstock, bell, stay and rope; swings about the axle, along X) and clapper (child of the bell, swings about its own pivot inside the crown).'


@prop('ballista', 'Ballista for the wall walk', CAT)
def ballista(P):
    base = P.mesh('base')
    base.lathe([(0, 0), (.55, 0), (.55, .12), (.4, .2), (.4, .28), (0, .28)], cell='wood_dark', seg=8, cells={'+z': 'planks'})
    b = P.mesh('ballista', pivot=(0, 0, .28), parent='base')
    b.lathe([(0, 0), (.12, 0), (.1, .45), (0, .45)], loc=(0, 0, .28), cell='wood_dark', seg=6)
    b.box((.18, 2.0, .14), (0, .1, .8), 'wood', cells={'+z': 'wood_light'})
    b.box((.1, 1.2, .04), (0, .3, .89), 'wood_dark')
    b.box((.9, .16, .08), (0, -.75, .6), 'wood_dark')
    b.box((.9, .16, .08), (0, -.75, 1.02), 'wood_dark')
    for x in (-.4, -.14, .14, .4):
        b.box((.08, .16, .46), (x, -.75, .81), 'wood_dark')
    for s in (-1, 1):
        b.cyl(.075, .42, (s * .27, -.75, .6), 'rope', seg=6)
        b.cyl(.09, .04, (s * .27, -.75, 1.06), 'iron', seg=6)
        b.beam((s * .27, -.72, .85), (s * .95, -.38, .88), .07, .09, 'wood_red')
        b.rod((s * .95, -.36, .88), (0, .42, .87), .008, 'rope', seg=4)
    b.box((.16, .12, .1), (0, .45, .9), 'iron_dark')
    b.rod((0, .4, .92), (0, -1.25, .92), .018, 'wood_light', seg=5)
    b.lathe([(0, 0), (.028, 0), (0, .12)], loc=(0, -1.25, .92), rot=(90, 0, 0), cell='iron', seg=4)
    b.poly([(0, 0), (.08, 0), (0, .06)], .004, loc=(0, .32, .94), rot=(0, 0, 90), cell='feather')
    b.rod((-.3, 1.0, .75), (.3, 1.0, .75), .06, 'wood', seg=6)
    for s in (-1, 1):
        b.box((.04, .3, .04), (s * .32, 1.0, .75), 'wood_dark', rot=(30, 0, 0))
        b.box((.06, .14, .3), (s * .12, 1.0, .72), 'wood_dark')
    P.notes = 'Shoots toward +Z in glTF. The upper part is its own node and turns on the base; the pivot is at the top of the turntable.'


@prop('rowboat', 'Rowboat with oars', CAT)
def rowboat(P):
    m = P.mesh()
    def sec(y, w, d, top):
        out = [(w * math.cos(math.radians(a)), y, top + d * math.sin(math.radians(a))) for a in (180, 225, 270, 315, 360)]
        wi, di = max(w - .045, .01), d - .045
        inn = [(wi * math.cos(math.radians(a)), y, top + di * math.sin(math.radians(a))) for a in (360, 315, 270, 225, 180)]
        return out + inn
    secs = [(1.6, .5, .42, .62), (1.05, .66, .5, .58), (.2, .72, .54, .56), (-.6, .62, .52, .6), (-1.2, .38, .46, .68), (-1.62, .05, .34, .8)]
    bands = ['wood'] * 4 + ['wood_dark'] + ['wood_light'] * 4 + ['wood_dark']
    m.loft([sec(*s) for s in secs], cell='wood_dark', bands=bands)
    m.box((.06, 2.0, .06), (0, .1, .03), 'wood_dark')
    m.box((.06, .08, .5), (0, -1.62, .55), 'wood_dark', rot=(-15, 0, 0))
    for y, w in ((.9, 1.14), (.05, 1.34), (-.8, 1.1)):
        m.box((w, .22, .04), (0, y, .42), 'wood_grey', cells={'+z': 'wood_light'})
    m.box((.6, 1.5, .02), (0, .1, .06), 'wood_grey', cells={'+z': 'planks'})
    for s in (-1, 1):
        m.box((.04, .04, .1), (s * .7, .05, .6), 'iron_dark')
    for s in (-1, 1):
        m.rod((s * .34, 1.1, .47), (s * .2, -.75, .47), .025, 'wood_light', seg=5)
        m.box((.1, .4, .015), (s * .19, -.9, .47), 'wood_light', rot=(0, 0, s * -4))
    m.torus(.1, .02, (0, .5, .1), 'rope', seg=8, seg2=3)
    P.notes = 'About 3.3 m long, bow toward +Z in glTF, sitting on its keel. Float it by lowering it about 0.25 m into the water plane.'


@prop('quay-crane', 'Quay crane, timber jib with windlass', CAT)
def quay_crane(P):
    base = P.mesh('base')
    for s in (-1, 1):
        base.box((2.4, .25, .25), (0, s * .5, .125), 'wood_dark')
        base.box((.25, 2.4, .25), (s * .5, 0, .375), 'wood_dark')
    for sx in (-1, 1):
        for sy in (-1, 1):
            base.beam((sx * 1.0, sy * .5, .25), (sx * .12, sy * .12, 1.6), .12, .12, 'wood_dark')
    j = P.mesh('jib', pivot=(0, 0, 0), parent='base')
    j.cyl(.16, 4.6, (0, 0, .25), 'wood', seg=8)
    j.beam((0, 0, 3.9), (0, -3.3, 4.5), .18, .2, 'wood')
    j.beam((0, 0, 2.3), (0, -2.0, 4.2), .14, .14, 'wood_dark')
    j.rod((0, 0, 4.8), (0, -3.25, 4.55), .015, 'rope', seg=4)
    j.cyl(.16, .1, (-.05, -3.3, 4.36), 'wood_dark', rot=(0, 90, 0), seg=8)
    j.rod((0, -3.3, 4.36), (0, -3.3, 1.5), .014, 'rope', seg=4)
    j.torus(.07, .014, (0, -3.3, 1.42), 'iron_dark', rot=(90, 0, 0), seg=8, seg2=3, arc=240)
    j.rod((0, -3.3, 4.4), (0, -.3, 3.95), .014, 'rope', seg=4)
    j.rod((0, -.3, 3.95), (0, -.3, 1.1), .014, 'rope', seg=4)
    j.rod((-.5, -.3, 1.1), (.5, -.3, 1.1), .14, 'wood_light', seg=8)
    for s in (-1, 1):
        j.box((.1, .2, 1.0), (s * .6, -.3, .75), 'wood_dark')
        for k in range(4):
            a = k * math.pi / 2
            j.rod((s * .7, -.3, 1.1), (s * .7, -.3 + .35 * math.cos(a), 1.1 + .35 * math.sin(a)), .025, 'wood', seg=4)
    P.notes = 'The jib (mast, boom, ropes, windlass) is its own node and slews about the mast; the hook hangs 1.4 m up, 3.3 m out toward +Z.'


@prop('net-rack', 'Net drying rack with floats', CAT, cutout=True)
def net_rack(P):
    m = P.mesh()
    for x in (-1.2, 1.2):
        m.beam((x, -.5, 0), (x, 0, 1.9), .08, .08, 'wood_grey')
        m.beam((x, .5, 0), (x, 0, 1.9), .08, .08, 'wood_grey')
    m.rod((-1.35, 0, 1.85), (1.35, 0, 1.85), .045, 'wood_grey', seg=6)
    for (x, w, rz, rx) in ((-.6, 1.0, 3, 8), (.35, 1.1, -4, -10), (.75, .7, 10, 14)):
        m.quad(w, 1.4, (x, 0, 1.15), 'net', rot=(rx, 0, rz))
        for k in range(3):
            m.sphere(.045, (x - w / 2 + .15 + k * (w - .3) / 2, 0, 1.8), 'cork', seg=6, rings=3)
    m.box((1.4, .05, .04), (0, .02, .45), 'rope', rot=(0, 0, 0))
    P.notes = 'Alpha-masked and double-sided so the nets read as mesh from both sides.'


@prop('fish-crates', 'Fish crates, one stacked', CAT)
def fish_crates(P):
    m = P.mesh()
    def crate(x, y, z, rz, full=True):
        c = math.cos(math.radians(rz)); s = math.sin(math.radians(rz))
        def at(dx, dy):
            return (x + dx * c - dy * s, y + dx * s + dy * c)
        m.box((.62, .42, .2), (x, y, z + .1), 'wood_grey', rot=(0, 0, rz), cells={'+z': 'fish' if full else 'wood_dark', '-y': 'planks', '+y': 'planks'})
        for dx, dy, w, d in ((0, .2, .62, .03), (0, -.2, .62, .03), (.3, 0, .03, .42), (-.3, 0, .03, .42)):
            px, py = at(dx, dy)
            m.box((w, d, .06), (px, py, z + .2), 'wood', rot=(0, 0, rz))
    crate(0, 0, 0, 0)
    crate(.68, .1, 0, 8)
    crate(.25, .05, .23, -6)
    m.box((.18, .06, .03), (-.2, -.34, .015), 'fish', rot=(0, 0, 30))


@prop('mooring-post', 'Mooring post, timber with rope', CAT)
def mooring(P):
    m = P.mesh()
    m.cyl(.15, 1.0, (0, 0, 0), 'wood_dark', seg=8, r2=.14, cells={'+z': 'log_end'})
    m.cyl(.155, .05, (0, 0, .8), 'iron_dark', seg=8)
    for z in (.55, .62):
        m.torus(.165, .025, (0, 0, z), 'rope', seg=8, seg2=3)
    m.rod((.16, -.05, .58), (.8, -.4, .02), .022, 'rope', seg=4)
    m.torus(.2, .025, (.95, -.5, .025), 'rope', seg=8, seg2=3)


@prop('mooring-bollard', 'Mooring bollard, iron on a stone block', CAT)
def bollard(P):
    m = P.mesh()
    m.box((.5, .5, .2), (0, 0, .1), 'stone', cells={'+z': 'stone_light'})
    m.lathe([(0, 0), (.13, 0), (.11, .3), (.12, .4), (.18, .44), (.18, .48), (.12, .5), (0, .5)], loc=(0, 0, .2), cell='iron_dark', seg=8)
    m.torus(.13, .022, (0, 0, .4), 'rope', seg=8, seg2=3)


@prop('toll-house-sign', 'Toll-house sign on a post', CAT)
def toll_sign(P):
    p = P.mesh('post')
    p.box((.14, .14, 2.7), (0, 0, 1.35), 'wood_dark')
    p.box((.4, .4, .1), (0, 0, .05), 'stone')
    p.box((1.05, .08, .08), (.45, 0, 2.5), 'wood_dark')
    p.beam((0, 0, 2.0), (.5, 0, 2.46), .06, .06, 'wood_dark')
    p.box((.04, .04, .1), (.85, 0, 2.43), 'iron_dark')
    s = P.mesh('sign', pivot=(.7, 0, 2.43), parent='post')
    for x in (.5, .9):
        s.rod((x, 0, 2.43), (x, 0, 2.2), .006, 'iron_dark', seg=4)
    s.box((.6, .04, .45), (.7, 0, 1.98), 'wood', cells={'-y': 'toll', '+y': 'toll'})
    P.notes = 'The board shows a coin over a river, no words, so it reads without a language. It hangs from its own node and can sway.'


def shelf_unit(m, W, D, H, x0=0):
    for x in (x0 - W / 2 + .02, x0 + W / 2 - .02):
        m.box((.04, D, H), (x, 0, H / 2), 'wood_dark')
    m.box((W, .02, H), (x0, D / 2 - .01, H / 2), 'wood_dark')
    for z in (.06, .46, .86, 1.26, 1.66, H - .02):
        m.box((W - .06, D - .02, .03), (x0, -.01, z), 'wood')
    for z in (.075, .475, .875, 1.275, 1.675):
        book_row(m, x0 - W / 2 + .05, x0 + W / 2 - .05, 0, z, D - .1, .22, .34)


@prop('secret-bookcase', 'Secret mechanism: swinging bookcase over a passage', CAT)
def secret_bookcase(P):
    f = P.mesh('frame')
    f.box((1.3, .6, .02), (0, .35, .01), 'stone_dark')
    f.box((1.3, .05, 2.2), (0, .65, 1.1), 'void')
    for x in (-.62, .62):
        f.box((.06, .6, 2.2), (x, .35, 1.1), 'stone_dark')
    f.box((1.3, .6, .06), (0, .35, 2.17), 'stone_dark')
    b = P.mesh('bookcase', pivot=(-.55, -.175, 0), parent='frame')
    shelf_unit(b, 1.1, .35, 2.1)
    b.box((.04, .05, .04), (.36, -.14, .9 + .07), 'brass')
    P.notes = 'The bookcase is its own node hinged at its front-left corner; swing it about Y to open. The frame behind is a dark passage mouth. One brass-tipped book on the middle shelf is the trigger.'


@prop('secret-turning-sconce', 'Secret mechanism: turning wall sconce', CAT)
def secret_sconce(P):
    m = P.mesh('plate')
    m.box((.14, .03, .28), (0, 0, .14), 'iron_dark')
    m.cyl(.04, .03, (0, -.015, .14), 'iron', rot=(90, 0, 0), seg=8)
    s = P.mesh('sconce', pivot=(0, -.03, .14), parent='plate')
    s.beam((0, -.03, .14), (0, -.18, .2), .025, .025, 'iron_dark')
    s.cyl(.045, .03, (0, -.2, .19), 'iron_dark', seg=8, r2=.055)
    s.cyl(.02, .1, (0, -.2, .22), 'candle', seg=6)
    P.notes = 'The sconce turns on its node (axis along Z in glTF, out of the wall); a quarter turn is the tell.'


# ----------------------------------------------------------- dressing kit --
CAT = 'Dressing kit'


@prop('wall-torch-sconce', 'Wall torch sconce with torch', CAT)
def torch(P):
    m = P.mesh('sconce')
    m.box((.1, .03, .3), (0, 0, .15), 'iron_dark')
    m.beam((0, -.015, .1), (0, -.14, .2), .025, .025, 'iron_dark')
    m.torus(.035, .008, (0, -.14, .22), 'iron_dark', seg=8, seg2=3)
    t = P.mesh('torch', parent='sconce')
    t.rod((0, -.12, .05), (0, -.155, .42), .018, 'wood', seg=5, r2=.022)
    t.cyl(.035, .1, (0, -.155, .4), 'tar', rot=(-5, 0, 0), seg=6, r2=.04)
    t.lathe([(0, 0), (.04, .03), (.03, .1), (0, .2)], loc=(0, -.16, .5), cell='flame', seg=5)
    t.lathe([(0, 0), (.022, .02), (0, .1)], loc=(0, -.17, .51), cell='flame_core', seg=4)
    P.notes = 'Torch is a separate node so it can be taken; put a point light at the flame.'


def tapestry(P, tile):
    m = P.mesh()
    W, H = 1.6, 1.9
    m.rod((-W / 2 - .12, 0, H + .1), (W / 2 + .12, 0, H + .1), .02, 'wood_dark', seg=6)
    for x in (-W / 2 - .14, W / 2 + .14):
        m.sphere(.035, (x, 0, H + .1), 'brass', seg=6, rings=3)
    m.box((W, .02, H), (0, 0, H / 2 + .08), 'cloth_brown', cells={'-y': tile})
    for k in range(6):
        m.torus(.04, .008, (-W / 2 + .1 + k * (W - .2) / 5, 0, H + .08), 'cloth_ochre', rot=(90, 0, 0), seg=6, seg2=3)
    m.box((W, .025, .08), (0, 0, .04), 'cloth_ochre')


for tag, tile, label in (('a', 'tapestry_tree', 'tree of life'), ('b', 'tapestry_lattice', 'gold lattice'), ('c', 'tapestry_stag', 'white stag')):
    prop(f'tapestry-{tag}', f'Tapestry {tag.upper()} ({label})', CAT)(lambda P, tile=tile: tapestry(P, tile))


def rug(P, W, D, tile, border):
    m = P.mesh()
    m.box((W, D, .012), (0, 0, .006), 'cloth_brown')
    m.nine_slice(W, D, .0125, tile, border)


for tag, (W, D, tile, b) in (('small', (.9, .6, 'rug_a', .07)), ('medium', (1.6, 1.0, 'rug_b', .1)), ('large', (2.8, 1.8, 'rug_c', .16))):
    prop(f'rug-{tag}', f'Rug, {tag} ({W} x {D} m)', CAT)(lambda P, W=W, D=D, tile=tile, b=b: rug(P, W, D, tile, b))


@prop('apple-barrel', 'Apple barrel', CAT)
def apple_barrel(P):
    m = P.mesh()
    prof = [(0, 0), (.25, 0), (.29, .2), (.3, .35), (.29, .5), (.26, .7), (.23, .7), (0, .64)]
    m.lathe(prof, cell='wood', seg=10, bands=['wood_dark', 'wood', 'wood', 'wood', 'wood', 'wood_dark', 'apple_red'])
    for z, r in ((.08, .268), (.62, .27)):
        m.lathe([(r, z - .03), (r + .004, z + .03)], cell='iron_dark', seg=10)
    for k in range(9):
        a = 2 * math.pi * k / 7
        rr = .13 if k < 7 else 0
        m.sphere(.045, (rr * math.cos(a) + (k - 7) * .05 * (k >= 7), rr * math.sin(a), .68 + (.03 if k >= 7 else 0)), 'apple_red' if k % 4 else 'apple_green', seg=6, rings=4)
    m.sphere(.045, (.34, -.2, .045), 'apple_red', seg=6, rings=4)


@prop('firewood-stack', 'Firewood stack', CAT)
def firewood(P):
    m = P.mesh()
    for row, n in enumerate((5, 4, 3, 2)):
        for i in range(n):
            y = (i - (n - 1) / 2) * .14
            z = .065 + row * .12
            L = .8 + R.uniform(-.06, .06)
            x0 = -L / 2 + R.uniform(-.04, .04)
            m.rod((x0, y, z), (x0 + L, y, z), .065, 'wood_grey', seg=6, cells={'+x': 'log_end', '-x': 'log_end'})
    m.box((.3, .1, .06), (.55, -.3, .03), 'wood_light', rot=(0, 0, 30))


def cobweb(P, tile, size, drop):
    m = P.mesh()
    a, b = size, size * .85
    C = (0, 0, 0)
    m.tri_card([C, (a, 0, -.02), (a * .7, -b * .7, -drop), (0, -b, -.02)], tile, [(0, 0), (1, 0), (1, 1), (0, 1)])
    m.tri_card([C, (a * .55, -b * .55, -drop * 1.2), (0, 0, -size)], tile, [(0, 0), (1, 1), (0, 1)])


prop('cobweb-corner-a', 'Cobweb for an upper corner, large', CAT, cutout=True)(lambda P: cobweb(P, 'cobweb', .6, .2))
prop('cobweb-corner-b', 'Cobweb for an upper corner, small', CAT, cutout=True)(lambda P: cobweb(P, 'cobweb_b', .35, .12))


@prop('hanging-lantern', 'Hanging lantern with horn panes', CAT)
def hanging_lantern(P):
    m = P.mesh('lantern', pivot=(0, 0, .95))
    prof = [(0, 0), (.1, 0), (.1, .03), (.085, .04), (.085, .24), (.11, .25), (.03, .36), (0, .37)]
    m.lathe(prof, cell='iron_dark', seg=4, bands=['iron_dark', 'iron_dark', 'iron_dark', 'horn', 'iron_dark', 'iron_dark', 'iron_dark'])
    for k in range(4):
        a = 2 * math.pi * k / 4 + math.pi / 4
        m.box((.02, .02, .22), (.085 * math.cos(a), .085 * math.sin(a), .14), 'iron_dark')
    m.torus(.03, .007, (0, 0, .39), 'iron_dark', rot=(90, 0, 0), seg=6, seg2=3)
    m.rod((0, 0, .42), (0, 0, .92), .005, 'iron_dark', seg=4)
    m.torus(.03, .007, (0, 0, .95), 'iron_dark', rot=(90, 0, 0), seg=6, seg2=3)
    P.notes = 'Pivot at the top ring so it can sway. The horn panes are warm and opaque; put a point light inside.'


def crest_shield(P, crest):
    m = P.mesh()
    shield = [(-.25, .6), (.25, .6), (.25, .36), (.21, .21), (.13, .09), (0, 0), (-.13, .09), (-.21, .21), (-.25, .36)]
    m.poly(shield, .03, loc=(0, -.015, 0), cell='wood_dark', cells={'-y': crest, 'side': 'wood_dark'})
    m.poly([(x * 1.08, y * 1.06 - .02) for x, y in shield], .02, loc=(0, .01, 0), cell='iron_dark')
    m.box((.06, .02, .06), (0, .03, .45), 'iron_dark')


for tag, crest, label in (('a', 'crest_a', 'red, gold chevron'), ('b', 'crest_b', 'blue, white tower'), ('c', 'crest_c', 'green, gold key'), ('d', 'crest_d', 'quarterly black and gold')):
    prop(f'crest-shield-{tag}', f'Crest shield {tag.upper()} ({label})', CAT)(lambda P, crest=crest: crest_shield(P, crest))
