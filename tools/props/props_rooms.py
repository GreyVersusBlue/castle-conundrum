# props_rooms.py - wishlist 16 to 54: scriptorium, chapel, kitchen, great hall,
# bedchamber, guardroom and armoury, garden.
import math
import random
from registry import prop
from kit import sub

R = random.Random(42)


def legs4(m, W, D, H, t=.05, cell='wood_dark', inset=.04):
    for sx in (-1, 1):
        for sy in (-1, 1):
            m.box((t, t, H), (sx * (W / 2 - inset), sy * (D / 2 - inset), H / 2), cell)


def book_row(m, x0, x1, y, z, depth, hmin=.2, hmax=.3):
    """A run of books standing on a shelf, front at y - depth/2."""
    x = x0
    while x < x1 - .03:
        w = min(R.uniform(.08, .2), x1 - x)
        h = R.uniform(hmin, hmax)
        f = R.uniform(0, .6)
        m.box((w, depth, h), (x + w / 2, y, z + h / 2), 'paper_dark', cells={'-y': sub('spines', f, 0, f + .35, 1)})
        x += w + R.uniform(0, .01)


# ------------------------------------------------------------ scriptorium --
CAT = 'Scriptorium'


@prop('lectern-slanted', 'Slanted lectern with an open book', CAT)
def lectern(P):
    m = P.mesh()
    m.box((.5, .09, .06), (0, 0, .03), 'wood_dark')
    m.box((.09, .45, .06), (0, 0, .03), 'wood_dark')
    m.lathe([(0, 0), (.05, 0), (.045, .06), (.035, .08), (.035, .95), (.05, .98), (.05, 1.0), (0, 1.0)], cell='wood', seg=8, loc=(0, 0, .06))
    m.box((.66, .5, .035), (0, 0, 1.17), 'wood', rot=(32, 0, 0), cells={'+z': 'wood_red'})
    m.box((.66, .04, .05), (0, -.23, 1.03), 'wood_dark', rot=(32, 0, 0))
    m.box((.3, .3, .12), (0, .02, 1.07), 'wood_dark', rot=(32, 0, 0))
    # an open book resting on the slope
    for s in (-1, 1):
        m.box((.2, .28, .02), (s * .105, .005, 1.205), 'paper', rot=(32, s * -6, 0), cells={'+z': sub('writing', 0, 0, 1, 1)})
    m.box((.43, .3, .008), (0, .0, 1.19), 'leather_dark', rot=(32, 0, 0))


@prop('inkwell-quill-cup', 'Inkwell and quill cup', CAT)
def inkwell(P):
    m = P.mesh()
    m.lathe([(0, 0), (.04, 0), (.042, .03), (.032, .045), (.015, .05), (.015, .055), (.012, .055), (.012, .05), (0, .049)], cell='clay_dark', seg=8,
            bands=['clay_dark'] * 6 + ['ink', 'ink'])
    m.lathe([(0, 0), (.032, 0), (.03, .1), (.034, .105), (.028, .105), (0, .1)], loc=(.1, .02, 0), cell='wood', seg=8, bands=['wood', 'wood', 'wood_dark', 'wood_dark', 'wood_dark'])
    for rz, tilt in ((0, 14), (130, 10), (250, 18)):
        q = [(0, 0), (.004, .02), (.01, .12), (.006, .2), (0, .22), (-.004, .12), (-.002, .02)]
        m.poly(q, .003, loc=(.1, .02, .04), rot=(0, tilt, rz), cell='feather')
    m.box((.012, .003, .03), (.035, -.02, .06), 'feather', rot=(0, 30, -30))


@prop('manuscript-stack', 'Manuscript stack, loose leaves and tied quires', CAT)
def manuscripts(P):
    m = P.mesh()
    z = 0
    for i in range(7):
        t = R.uniform(.012, .03)
        rot = R.uniform(-10, 10)
        cell = R.choice(['paper', 'paper_dark'])
        m.box((.3 + R.uniform(-.02, .02), .22 + R.uniform(-.02, .02), t), (R.uniform(-.015, .015), R.uniform(-.015, .015), z + t / 2), cell, rot=(0, 0, rot),
              cells={'+z': 'writing' if i == 6 else cell})
        if i in (1, 4):
            m.box((.008, .24, t + .004), (.05, 0, z + t / 2), 'rope', rot=(0, 0, rot))
        z += t
    m.box((.24, .18, .002), (.22, -.05, .001), 'paper', rot=(0, 0, 24), cells={'+z': 'writing'})


@prop('book-press', 'Book press', CAT)
def book_press(P):
    m = P.mesh()
    m.box((.55, .32, .05), (0, 0, .025), 'wood_dark')
    for x in (-.24, .24):
        m.box((.06, .08, .5), (x, 0, .3), 'wood_dark')
    m.box((.6, .1, .08), (0, 0, .57), 'wood')
    m.box((.46, .3, .04), (0, 0, .25), 'wood')                    # the pressing board
    m.box((.3, .22, .12), (0, 0, .11), 'leather_dark', cells={'-y': 'paper', '+y': 'paper', '+x': 'paper'})   # a book block in the press
    for x in (-.1, .1):
        m.cyl(.022, .38, (x, 0, .27), 'wood_light', seg=6)
        m.box((.03, .03, .01), (x, 0, .6), 'wood_light')
    m.rod((-.1, -.12, .66), (-.1, .12, .66), .012, 'wood_light', seg=5)
    m.rod((.02, -.12, .66), (.18, .12, .66), .012, 'wood_light', seg=5)
    for x in (-.1, .1):
        m.cyl(.03, .04, (x, 0, .62), 'wood', seg=6)


@prop('bookshelf-wall', 'Bookshelf, wall unit with mixed spines', CAT)
def bookshelf(P):
    m = P.mesh()
    W, D, H = 1.2, .35, 2.0
    for x in (-W / 2 + .02, W / 2 - .02):
        m.box((.04, D, H), (x, 0, H / 2), 'wood_dark')
    m.box((W, .02, H), (0, D / 2 - .01, H / 2), 'wood_dark')
    for z in (.06, .46, .86, 1.26, 1.66, 1.98):
        m.box((W - .06, D - .02, .03), (0, -.01, z), 'wood')
    m.box((W + .04, D + .04, .05), (0, 0, H + .025), 'wood_dark')
    for z in (.075, .475, .875, 1.275):
        book_row(m, -W / 2 + .05, W / 2 - .12 if z == .875 else W / 2 - .05, 0, z, .24, .22, .34)
    # a leaning book and a lying stack on the top shelf
    m.box((.05, .24, .3), (.5, 0, .9 + .13), 'paper_dark', rot=(0, -18, 0), cells={'-y': sub('spines', .1, 0, .3, 1)})
    for i, t in enumerate((.05, .04, .06)):
        m.box((.28, .22, t), (-.3 + i * .01, 0, 1.675 + sum((.05, .04, .06)[:i]) + t / 2), 'leather', cells={'-y': 'paper', '+z': 'cloth_red_dark' if i == 2 else 'leather'})
    book_row(m, 0, W / 2 - .05, 0, 1.675, .24, .2, .28)
    m.lathe([(0, 0), (.03, 0), (.035, .05), (.02, .09), (.012, .12), (0, .12)], loc=(-.05, -.03, 1.675), cell='clay', seg=6)


# ------------------------------------------------------------------ chapel --
CAT = 'Chapel'


def candlestick_small(m, x, y, z, h=.3):
    m.lathe([(0, 0), (.05, 0), (.03, .02), (.012, .04), (.012, h - .04), (.03, h - .03), (.03, h - .02), (.012, h - .02), (.012, h + .08), (0, h + .08)],
            loc=(x, y, z), cell='brass', seg=6, bands=['brass'] * 7 + ['candle', 'candle'])


@prop('altar', 'Altar with cloth and a small cross', CAT)
def altar(P):
    m = P.mesh()
    m.box((1.8, .9, .1), (0, 0, .05), 'stone_light')
    m.box((1.6, .8, .9), (0, 0, .55), 'stone', cells={'-y': 'blocks', '+y': 'blocks', '+x': 'blocks', '-x': 'blocks'})
    m.box((1.7, .9, .06), (0, 0, 1.03), 'stone_light')
    m.box((1.72, .92, .012), (0, 0, 1.066), 'cloth_cream')
    m.box((1.2, .012, .5), (0, -.462, .82), 'cloth_cream', cells={'-y': 'frontal'})
    for x in (-.86, .86):
        m.box((.012, .92, .3), (x, 0, .92), 'cloth_cream')
    m.box((.16, .1, .06), (0, .2, 1.1), 'brass_dark')
    m.box((.03, .03, .42), (0, .2, 1.34), 'gold')
    m.box((.22, .03, .03), (0, .2, 1.43), 'gold')
    for x in (-.55, .55):
        candlestick_small(m, x, .22, 1.072)


@prop('pulpit', 'Pulpit with steps', CAT)
def pulpit(P):
    m = P.mesh()
    m.lathe([(0, 0), (.42, 0), (.42, .12), (.3, .18), (.18, .3), (.18, .7), (.3, .78)], loc=(0, 0, 0), cell='stone', seg=8)
    prof = [(0, .78), (.3, .78), (.52, .84), (.52, 1.78), (.56, 1.8), (.56, 1.84), (.46, 1.84), (.46, 1.0), (0, 1.0)]
    m.lathe(prof, cell='wood', seg=8, bands=['wood_dark', 'wood_dark', 'wood', 'wood_dark', 'wood_dark', 'wood_dark', 'wood_dark', 'wood_dark'])
    for k in range(8):
        a = 2 * math.pi * (k + .5) / 8 + math.pi / 8
        if math.sin(a) > .6:
            continue   # the back is the doorway side
        r = .525
        m.box((.34, .02, .7), (r * math.cos(a), r * math.sin(a), 1.3), 'linenfold', rot=(0, 0, math.degrees(a) + 90))
    m.box((.5, .3, .03), (0, -.5, 1.82), 'wood_dark', rot=(28, 0, 0))
    for i in range(4):
        m.box((.6, .3, .2 * (i + 1)), (0, .56 + (3 - i) * .3, .1 * (i + 1)), 'wood_dark', cells={'+z': 'wood'})
    for x in (-.32, .32):
        m.beam((x, 1.66, .95), (x, .45, 1.8), .04, .04, 'wood_dark')


@prop('pew-section', 'Pew, modular 1.5 m section', CAT)
def pew(P):
    m = P.mesh()
    L = 1.5
    end = [(-.22, 0), (.22, 0), (.22, .45), (.2, .95), (.12, 1.0), (.06, .96), (-.06, .5), (-.22, .45)]
    for x in (-L / 2 + .03, L / 2 - .03):
        m.poly(end, .05, loc=(x, 0, 0), rot=(0, 0, 90), cell='wood_dark')
    m.box((L - .1, .4, .04), (0, -.02, .45), 'wood', cells={'+z': 'wood_light'})
    m.box((L - .1, .03, .42), (0, .18, .76), 'wood', rot=(-8, 0, 0))
    m.box((L - .1, .05, .04), (0, .205, .97), 'wood_dark')
    m.box((L - .1, .03, .12), (0, -.2, .37), 'wood_dark')
    m.box((L - .1, .06, .04), (0, .1, .08), 'wood_dark')
    P.notes = 'The end panels sit inside the 1.5 m, so sections line up end to end with a double panel at each joint. Sitting side faces -Y (front, +Z in glTF).'


@prop('censer-hanging', 'Hanging censer', CAT)
def censer(P):
    m = P.mesh('censer', pivot=(0, 0, 1.1))
    m.lathe([(0, 0), (.035, 0), (.03, .02), (.07, .04), (.085, .09), (.08, .1), (.065, .1), (0, .1)], loc=(0, 0, 0), cell='brass', seg=8,
            bands=['brass_dark', 'brass', 'brass', 'brass', 'brass', 'brass_dark', 'brass_dark'])
    m.lathe([(.082, 0), (.078, .04), (.06, .08), (.03, .11), (.012, .13), (0, .14)], loc=(0, 0, .1), cell='brass', seg=8,
            bands=['brass', 'iron_dark', 'brass', 'brass', 'brass'])
    for k in range(3):
        a = 2 * math.pi * k / 3
        p = (.08 * math.cos(a), .08 * math.sin(a), .09)
        m.rod(p, (0, 0, .5), .003, 'iron_dark', seg=4)
    m.torus(.02, .005, (0, 0, .5), 'brass', rot=(0, 0, 0), seg=8, seg2=3)
    m.rod((0, 0, .5), (0, 0, 1.08), .004, 'iron_dark', seg=4)
    m.torus(.025, .006, (0, 0, 1.1), 'iron_dark', rot=(90, 0, 0), seg=8, seg2=3)
    P.notes = 'Pivot at the top hook (1.1 m above the base), so it can swing.'


@prop('stone-font', 'Stone font with water', CAT)
def font(P):
    m = P.mesh()
    prof = [(0, 0), (.38, 0), (.38, .12), (.28, .16), (.18, .22), (.16, .55), (.22, .62), (.4, .75), (.44, .9), (.44, .96), (.36, .96), (.34, .86), (0, .86)]
    m.lathe(prof, cell='stone_light', seg=8, bands=['stone', 'stone', 'stone', 'stone_light', 'stone_light', 'stone', 'stone_light', 'stone_light', 'stone_light', 'stone_light', 'stone', 'water'])
    m.box((.1, .02, .12), (0, -.43, .82), 'stone', rot=(0, 0, 0))


@prop('rood-cross', 'Rood cross, large, for a wall', CAT)
def rood(P):
    m = P.mesh()
    m.box((.16, .12, 2.6), (0, 0, 1.3), 'wood_red', cells={'-y': 'wood_red'})
    m.box((1.5, .12, .16), (0, 0, 1.95), 'wood_red')
    for (w, h, x, z) in ((.2, .2, 0, 2.62), (.2, .2, -.77, 1.95), (.2, .2, .77, 1.95)):
        m.box((w, .1, h), (x, 0, z), 'gold', rot=(0, 45, 0))
    m.box((.3, .1, .3), (0, -.01, 1.95), 'gold', rot=(0, 45, 0))
    m.box((.22, .11, .22), (0, -.02, 1.95), 'wood_red', rot=(0, 45, 0))
    m.box((.4, .2, .12), (0, .03, .06), 'stone')
    P.notes = 'Plain cross with gilded terminals and no corpus. Back at -Z; hang it with its base on a beam or corbel.'


@prop('stained-glass-window', 'Stained-glass lancet window', CAT)
def window(P):
    m = P.mesh()
    W, H, d = .8, 1.9, .3
    arch =[(-W / 2, 0), (W / 2, 0), (W / 2, H - .45), (.34, H - .22), (.2, H - .08), (0, H), (-.2, H - .08), (-.34, H - .22), (-W / 2, H - .45)]
    m.poly(arch, .03, loc=(0, 0, .12), cell='iron_dark', front=None, cells={'-y': 'stained_glass', '+y': 'stained_glass', 'side': 'iron_dark'})
    # stone surround: jambs, sill, and an arched hood of blocks
    m.box((.14, d, H - .45 + .12), (-W / 2 - .07, 0, (H - .45 + .12) / 2), 'stone_light')
    m.box((.14, d, H - .45 + .12), (W / 2 + .07, 0, (H - .45 + .12) / 2), 'stone_light')
    m.box((W + .4, d + .06, .12), (0, -.03, .06), 'stone')
    ring = arch[2:]
    for i in range(len(ring) - 1):
        a, b = ring[i], ring[i + 1]
        dx, dz = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dz)
        nx, nz = dz / L, -dx / L          # outward from the opening
        mx, mz = (a[0] + b[0]) / 2 + nx * .07, (a[1] + b[1]) / 2 + .12 + nz * .07
        m.box((L + .1, d, .14), (mx, 0, mz), 'stone_light', rot=(0, math.degrees(math.atan2(-dz, dx)), 0))
    m.box((.03, .035, H - .1), (0, 0, .12 + (H - .1) / 2), 'iron_dark')
    for z in (.6, 1.2):
        m.box((W, .035, .025), (0, 0, .12 + z), 'iron_dark')
    P.notes = 'Opaque coloured panes; light it from behind with a coloured point light or an emissive tweak in three.js if it should glow.'


# ----------------------------------------------------------------- kitchen --
CAT = 'Kitchen'


def cauldron(m, loc, r=.28, contents='stew'):
    x, y, z = loc
    prof = [(0, 0), (r * .5, 0), (r * .85, r * .15), (r, r * .5), (r * .95, r * .9), (r * .85, r * 1.05), (r * .92, r * 1.12), (r * .82, r * 1.12), (0, r * .95)]
    m.lathe(prof, loc=loc, cell='iron_dark', seg=10, bands=['iron_dark'] * 7 + [contents])
    for k in range(3):
        a = 2 * math.pi * k / 3
        m.rod((x + r * .6 * math.cos(a), y + r * .6 * math.sin(a), z + r * .1), (x + r * .75 * math.cos(a), y + r * .75 * math.sin(a), z - r * .3), .02, 'iron_dark', seg=4)
    m.torus(r * .95, .008, (x, y, z + r * 1.12), 'iron', rot=(90, 0, 0), seg=10, seg2=3, arc=180)


@prop('hearth-crane-cauldron', 'Hearth crane with a cauldron', CAT)
def crane(P):
    c = P.mesh('crane', pivot=(-.5, .35, 0))
    c.box((.05, .05, 1.2), (-.5, .35, .6), 'iron_dark')
    c.box((.8, .04, .05), (-.1, .35, 1.12), 'iron_dark')
    c.beam((-.5, .35, .7), (0, .35, 1.12), .035, .035, 'iron_dark')
    for z in (.2, 1.0):
        c.box((.06, .1, .05), (-.5, .41, z), 'iron')
    c.rod((.2, .35, 1.1), (.2, .35, .92), .006, 'iron', seg=4)
    c.torus(.02, .005, (.2, .35, .9), 'iron', rot=(90, 0, 0), seg=6, seg2=3)
    k = P.mesh('cauldron', pivot=(.2, .35, .9), parent='crane')
    cauldron(k, (.2, .35, .47), .26)
    k.rod((.2 - .247, .35, .76), (.2, .35, .89), .006, 'iron', seg=4)
    k.rod((.2 + .247, .35, .76), (.2, .35, .89), .006, 'iron', seg=4)
    P.notes = 'The crane swings on its post (node pivot at the post); the cauldron hangs from the hook as a child node.'


@prop('spit-rotisserie', 'Spit with firedogs and a crank', CAT)
def spit(P):
    m = P.mesh('firedogs')
    for x in (-.6, .6):
        m.box((.05, .3, .04), (x, 0, .02), 'iron_dark')
        m.box((.04, .04, .6), (x, 0, .32), 'iron_dark')
        m.beam((x, 0, .3), (x, -.14, .02), .03, .03, 'iron_dark')
        m.beam((x, 0, .3), (x, .14, .02), .03, .03, 'iron_dark')
        m.box((.06, .08, .03), (x, 0, .56), 'iron')
    s = P.mesh('spit', pivot=(0, 0, .6), parent='firedogs')
    s.rod((-.75, 0, .6), (.72, 0, .6), .01, 'iron', seg=5)
    s.box((.02, .02, .18), (.75, 0, .52), 'iron')
    s.rod((.75, 0, .44), (.85, 0, .44), .014, 'wood', seg=5)
    s.sphere(.13, (0, 0, .6), 'meat_roast', seg=8, rings=5, scl=(1.8, 1, .9))
    s.sphere(.05, (.25, 0, .58), 'meat_roast', seg=6, rings=4)
    s.sphere(.05, (-.25, 0, .58), 'meat_roast', seg=6, rings=4)
    P.notes = 'The spit (rod, crank and roast) is its own node turning about the rod axis.'


@prop('butcher-block', 'Butcher block with a cleaver', CAT)
def butcher(P):
    m = P.mesh()
    m.box((.62, .62, .3), (0, 0, .7), 'wood_light', cells={'+z': 'log_end'})
    legs4(m, .6, .6, .55, .09, 'wood_dark', .06)
    m.box((.5, .5, .04), (0, 0, .15), 'wood_dark')
    for (x, y, s) in ((.1, -.12, .08), (-.14, .1, .05), (.02, .15, .06)):
        m.box((s, s * .7, .002), (x, y, .851), 'blood_old', rot=(0, 0, R.uniform(0, 90)))
    m.poly([(0, 0), (.22, 0), (.22, .1), (.03, .12), (0, .1)], .008, loc=(-.02, .02, .8), rot=(0, 0, 30), cell='steel', cells={'side': 'iron'})
    m.rod((-.02 + .0, .02, .93), (-.02 - .12 * math.cos(math.radians(30)), .02 - .12 * math.sin(math.radians(30)), .93), .014, 'wood_dark', seg=6)
    m.box((.1, .04, .002), (-.2, -.24, .851), 'steel', rot=(0, 0, 10))
    P.notes = 'The cleaver is sunk into the block top. The stains are old and dark, not fresh.'


@prop('herb-bundles', 'Hanging herb bundles on a rail', CAT)
def herbs(P):
    m = P.mesh()
    m.rod((-.6, 0, 1.0), (.6, 0, 1.0), .018, 'wood', seg=6)
    for x in (-.6, .6):
        m.box((.04, .06, .12), (x, 0, 1.04), 'iron_dark')
    bundles = [(-.42, 'herb_dried', .32), (-.16, 'lavender', .26), (.1, 'leaf_dark', .34), (.36, 'herb_dried', .28), (.52, 'leaf', .22)]
    for x, cell, L in bundles:
        top = .93
        m.rod((x, 0, 1.0), (x, 0, top + .02), .004, 'rope', seg=4)
        m.cyl(.018, .04, (x, 0, top - .03), 'rope', seg=6)
        m.lathe([(0, top - L), (.03, top - L + .06), (.06, top - L * .45), (.035, top - .04), (.012, top - .02), (0, top - .02)],
                cell=cell, seg=6, loc=(x, 0, 0), scl=(1, .9, 1))
        m.lathe([(0, top - .035), (.012, top - .035), (.012, top + .005), (0, top + .005)], loc=(x, 0, 0), cell='straw_dark', seg=5)
    P.notes = 'Hangs from a ceiling beam: the rail brackets are at the top. Base is the lowest bundle tip.'


@prop('bread-oven-door', 'Bread oven door in a stone face', CAT)
def oven(P):
    f = P.mesh('oven')
    W, H, D = 1.3, 1.1, .5
    ox, oz0, oz1 = .28, .45, .8
    f.box((W, D, oz0), (0, 0, oz0 / 2), 'stone_warm', cells={'-y': 'bricks_warm'})
    f.box(((W / 2 - ox), D, oz1 - oz0 + .01), (-(ox + (W / 2 - ox) / 2), 0, (oz0 + oz1) / 2), 'stone_warm', cells={'-y': 'bricks_warm'})
    f.box(((W / 2 - ox), D, oz1 - oz0 + .01), ((ox + (W / 2 - ox) / 2), 0, (oz0 + oz1) / 2), 'stone_warm', cells={'-y': 'bricks_warm'})
    f.box((W, D, H - oz1), (0, 0, (oz1 + H) / 2), 'stone_warm', cells={'-y': 'bricks_warm'})
    f.box((2 * ox, .02, oz1 - oz0), (0, .05, (oz0 + oz1) / 2), 'soot')
    f.box((W + .06, D + .1, .08), (0, -.03, oz0 - .04 + .0), 'stone', cells={'+z': 'stone'})
    f.box((W + .04, D + .04, .06), (0, 0, H + .03), 'stone')
    f.box((.8, .04, .1), (0, -D / 2 - .02, oz1 + .05), 'stone_light')
    d = P.mesh('door', pivot=(-ox, -D / 2 - .02, oz0), parent='oven')
    arch = [(-ox, 0), (ox, 0), (ox, .26), (.2, .32), (0, .35), (-.2, .32), (-ox, .26)]
    d.poly(arch, .025, loc=(0, -D / 2 - .03, oz0), cell='iron_dark', cells={'-y': 'iron'})
    d.box((.12, .02, .03), (.12, -D / 2 - .055, oz0 + .16), 'iron_dark')
    d.rod((.08, -D / 2 - .06, oz0 + .16), (.16, -D / 2 - .06, oz0 + .16), .012, 'wood_dark', seg=5)
    P.notes = 'A stone oven face with its iron door as a child node, hinged on the left. Put the face flush with a wall.'


def sack(m, loc, rot_z, cell, h=.55, r=.2):
    x, y, z = loc
    prof = [(0, 0), (r * .8, 0), (r, h * .12), (r * 1.02, h * .55), (r * .8, h * .82), (r * .3, h * .92), (r * .25, h), (r * .4, h * 1.08), (0, h * 1.1)]
    m.lathe(prof, loc=loc, cell=cell, seg=7, scl=(1.1, .85, 1), rot=(0, 0, rot_z), bands=[cell] * 5 + ['rope'] + [cell, cell])


@prop('sack-pile', 'Sack pile, grain and flour', CAT)
def sacks(P):
    m = P.mesh()
    sack(m, (0, 0, 0), 10, 'burlap')
    sack(m, (.38, .05, 0), -20, 'burlap_light')
    sack(m, (-.36, .08, 0), 35, 'burlap')
    sack(m, (.18, .35, 0), 5, 'burlap_light')
    m.lathe([(0, 0), (.2, 0), (.22, .1), (.2, .24), (.12, .3), (0, .31)], loc=(.2, -.05, .5), rot=(80, 0, 20), cell='burlap', seg=7, scl=(1.1, 1, 1))
    m.slab([(0, 0), (.16, -.04), (.28, .02), (.2, .1), (.06, .08)], .004, loc=(.3, -.3, 0), cell='flour')
    P.notes = 'The two cream sacks are flour; a little has spilled at the front.'


@prop('well-bucket', 'Well bucket', CAT)
def bucket(P):
    m = P.mesh()
    prof = [(0, 0), (.13, 0), (.15, .28), (.135, .28), (.12, .03), (0, .06)]
    m.lathe(prof, cell='wood', seg=10, bands=['wood_dark', 'wood', 'wood_dark', 'wood_dark', 'water'])
    for z in (.05, .22):
        m.lathe([(.13 + z * .07 + .004, z - .015), (.13 + z * .07 + .006, z + .015)], cell='iron_dark', seg=10)
    m.torus(.15, .007, (0, 0, .28), 'rope', rot=(90, 0, 0), seg=10, seg2=3, arc=180)
    m.rod((0, 0, .43), (0, 0, .6), .008, 'rope', seg=4)


# -------------------------------------------------------------- great hall --
CAT = 'Great Hall'


def plate(m, x, y, z, r=.11, cell='pewter'):
    m.lathe([(0, 0), (r * .7, 0), (r, .018), (r * .9, .02), (r * .6, .006), (0, .006)], loc=(x, y, z), cell=cell, seg=8)


def cup(m, x, y, z, cell='pewter'):
    m.lathe([(0, 0), (.035, 0), (.04, .1), (.035, .1), (.03, .01), (0, .01)], loc=(x, y, z), cell=cell, seg=8)


def loaf(m, x, y, z, rz=0):
    m.sphere(.09, (x, y, z + .035), 'bread', seg=8, rings=4, scl=(1.4, 1, .55), rot=(0, 0, rz), bands=['bread_dark', 'bread', 'bread', 'bread'])


@prop('trestle-table-set', 'Trestle table set with plates, cups and bread', CAT)
def trestle(P):
    t = P.mesh('table')
    L, W, H = 2.4, .8, .75
    t.box((L, W, .05), (0, 0, H - .025), 'wood', cells={'+z': 'wood_light'})
    for x in (-.9, .9):
        t.beam((x, 0, H - .05), (x, -.3, 0), .09, .05, 'wood_dark')
        t.beam((x, 0, H - .05), (x, .3, 0), .09, .05, 'wood_dark')
        t.box((.1, .7, .06), (x, 0, .03), 'wood_dark')
        t.box((.12, .7, .05), (x, 0, H - .075), 'wood_dark')
    t.box((1.9, .06, .08), (0, 0, .35), 'wood_dark')
    s = P.mesh('setting', parent='table')
    for i, x in enumerate((-.8, -.25, .3, .85)):
        for side in (-1, 1):
            if side == 1 and i % 2:
                continue
            plate(s, x, side * .25, H)
            cup(s, x + .17, side * .18, H, 'pewter' if (i + side) % 2 else 'clay')
    loaf(s, -.5, 0, H, 20); loaf(s, .6, .05, H, -15)
    s.box((.16, .02, .006), (.1, -.2, H + .003), 'steel', rot=(0, 0, 25))
    s.box((.08, .025, .014), (.02, -.235, H + .007), 'wood_dark', rot=(0, 0, 25))
    s.lathe([(0, 0), (.06, 0), (.07, .12), (.04, .2), (.045, .22), (0, .22)], loc=(.05, .05, H), cell='clay', seg=8)
    P.notes = 'The table and the table setting are separate nodes, so the table can be used bare.'


@prop('roasted-boar-platter', 'Roasted boar on a platter', CAT)
def boar(P):
    m = P.mesh()
    m.lathe([(0, 0), (.3, 0), (.4, .03), (.37, .035), (.28, .012), (0, .012)], cell='pewter', seg=12, scl=(1.45, 1, 1))
    m.sphere(.2, (-.03, 0, .15), 'meat_roast', seg=10, rings=5, scl=(1.55, .95, .75))
    m.sphere(.11, (.32, 0, .15), 'meat_roast', seg=8, rings=4, scl=(1.1, .9, .9))
    m.cyl(.05, .1, (.4, 0, .13), 'meat', rot=(0, 90, 0), seg=6, r2=.04)
    m.sphere(.045, (.52, 0, .13), 'apple_red', seg=6, rings=4)
    for s in (-1, 1):
        m.lathe([(0, 0), (.03, 0), (0, .06)], loc=(.3, s * .06, .22), rot=(s * 25, -20, 0), cell='meat_roast', seg=4)
        m.sphere(.06, (.14, s * .12, .06), 'meat', seg=6, rings=3, scl=(1.3, .8, .6))
        m.sphere(.07, (-.24, s * .12, .06), 'meat', seg=6, rings=3, scl=(1.4, .8, .6))
    for (x, y) in ((-.45, .2), (-.5, -.15), (.45, .22), (.1, -.3), (-.1, .3)):
        m.sphere(.035, (x, y, .03), 'apple_red' if x < 0 else 'apple_green', seg=6, rings=4)
    for (x, y) in ((.15, .28), (-.3, -.3), (.35, -.25)):
        m.box((.1, .05, .01), (x, y, .018), 'leaf', rot=(0, 0, R.uniform(0, 90)))


@prop('lords-high-chair', "Lord's high chair, carved", CAT)
def high_chair(P):
    m = P.mesh()
    W, D = .7, .6
    m.box((W, D, .08), (0, 0, .47), 'wood_red')
    m.box((W - .04, D - .04, .06), (0, -.01, .54), 'cloth_red', cells={'+z': 'cloth_red'})
    m.box((W, D, .4), (0, 0, .2), 'wood_dark', cells={'-y': 'linenfold', '+x': 'linenfold', '-x': 'linenfold'})
    m.box((W, .08, 1.3), (0, D / 2 - .04, 1.15), 'wood_red', cells={'-y': 'linenfold'})
    m.poly([(-W / 2, 0), (W / 2, 0), (W / 2, .2), (.12, .3), (0, .42), (-.12, .3), (-W / 2, .2)], .1, loc=(0, D / 2 - .04, 1.8), cell='wood_red')
    m.poly([(-.14, 0), (.14, 0), (.14, .18), (.1, .26), (0, .3), (-.1, .26), (-.14, .18)], .012, loc=(0, D / 2 - .09, 1.22), rot=(0, 0, 180), cell='iron',
           front=None, cells={'+y': 'crest_a', '-y': 'crest_a', 'side': 'brass'})
    for x in (-W / 2 - .02, W / 2 + .02):
        m.box((.06, D, .06), (x, -.02, .78), 'wood_red')
        m.box((.06, .06, .28), (x, -D / 2 + .04, .64), 'wood_dark')
        m.lathe([(0, 0), (.04, 0), (.05, .06), (.02, .12), (0, .16)], loc=(x, D / 2 - .04, 2.1), cell='wood_dark', seg=6)
        m.box((.08, .1, 2.12), (x, D / 2 - .04, 1.06), 'wood_dark')
    P.notes = 'The back carries a small shield with crest A (the red chevron house).'


def banner(P, crest, field):
    m = P.mesh()
    m.rod((-.55, 0, 1.9), (.55, 0, 1.9), .018, 'wood_dark', seg=6)
    for x in (-.57, .57):
        m.lathe([(0, 0), (.03, 0), (.035, .03), (0, .07)], loc=(x, 0, 1.9), rot=(0, 90 if x > 0 else -90, 0), cell='brass', seg=6)
    cloth = [(-.4, 0), (0, -.2), (.4, 0), (.4, 1.6), (-.4, 1.6)]
    m.poly(cloth, .012, loc=(0, 0, .25), cell=field)
    m.poly([(-.4, 0), (0, -.2), (.4, 0), (.4, .05), (0, -.15), (-.4, .05)], .014, loc=(0, 0, .25), cell='cloth_ochre')
    m.poly([(-.4, 0), (.4, 0), (.4, .06), (-.4, .06)], .014, loc=(0, 0, 1.79), cell='cloth_ochre')
    shield = [(-.24, .6), (.24, .6), (.24, .36), (.2, .2), (.12, .08), (0, 0), (-.12, .08), (-.2, .2), (-.24, .36)]
    m.poly(shield, .004, loc=(0, -.008, .78), cell=field, cells={'-y': crest, '+y': crest, 'side': field})
    for x in (-.35, 0, .35):
        m.torus(.03, .006, (x, 0, 1.87), 'brass', rot=(90, 0, 0), seg=6, seg2=3)
    m.lathe([(0, 0), (.02, .04), (.012, .1), (0, .1)], loc=(0, 0, .0), cell='cloth_ochre', seg=5)


for tag, crest, field, label in (('a', 'crest_a', 'cloth_red', 'red, gold chevron'),
                                  ('b', 'crest_b', 'cloth_blue', 'blue, white tower'),
                                  ('c', 'crest_c', 'cloth_green', 'green, gold key')):
    prop(f'heraldic-banner-{tag}', f'Heraldic banner {tag.upper()} ({label})', 'Great Hall')(
        lambda P, crest=crest, field=field: banner(P, crest, field))


@prop('chandelier-ring', 'Chandelier ring, iron wheel with candles', CAT)
def chandelier(P):
    m = P.mesh('chandelier', pivot=(0, 0, 1.3))
    R0 = .6
    m.torus(R0, .025, (0, 0, .1), 'iron_dark', seg=16, seg2=4)
    for k in range(4):
        a = math.pi * k / 2
        m.rod((0, 0, .1), (R0 * math.cos(a), R0 * math.sin(a), .1), .012, 'iron_dark', seg=4)
    m.cyl(.05, .1, (0, 0, .05), 'iron_dark', seg=6)
    for k in range(8):
        a = 2 * math.pi * (k + .5) / 8
        x, y = R0 * math.cos(a), R0 * math.sin(a)
        m.cyl(.035, .02, (x, y, .12), 'iron', seg=6)
        m.cyl(.018, .1 + (k % 3) * .02, (x, y, .14), 'candle', seg=6)
        h = .24 + (k % 3) * .02
        m.lathe([(0, 0), (.012, .015), (0, .05)], loc=(x, y, h), cell='flame', seg=4)
    for k in range(3):
        a = 2 * math.pi * k / 3
        m.rod((R0 * math.cos(a), R0 * math.sin(a), .12), (0, 0, 1.25), .005, 'iron_dark', seg=4)
    m.torus(.05, .01, (0, 0, 1.28), 'iron_dark', rot=(90, 0, 0), seg=8, seg2=3)
    P.notes = 'Pivot at the top ring, 1.3 m above the bottom of the hub. Add a point light at the ring height in three.js.'


@prop('stone-fireplace', 'Stone fireplace: carved mantel, chimney breast, log stack', CAT)
def fireplace(P):
    m = P.mesh()
    W, D = 2.2, .8
    m.box((W + .2, D + .5, .1), (0, -.2, .05), 'stone', cells={'+z': 'blocks'})
    for x in (-W / 2 + .2, W / 2 - .2):
        m.box((.4, D, 1.3), (x, 0, .75), 'stone_light', cells={'-y': 'blocks', '-x': 'blocks', '+x': 'blocks'})
        m.box((.46, D + .06, .12), (x, -.03, .16), 'stone')
    m.box((W - .8, .1, 1.2), (0, D / 2 - .05, .7), 'soot', cells={'-y': 'fireback'})
    m.box((W + .1, D + .1, .32), (0, -.05, 1.56), 'stone_light', cells={'-y': 'blocks'})
    m.box((W + .2, D + .2, .1), (0, -.1, 1.77), 'stone')
    for i in range(5):
        m.box((.16, .06, .16), (-.8 + i * .4, -D / 2 - .1, 1.56), 'stone', rot=(0, 45, 0))
    m.poly([(-W / 2 - .05, 0), (W / 2 + .05, 0), (.6, 1.0), (-.6, 1.0)], D * .8, loc=(0, .08, 1.82), cell='stone_light', cells={'-y': 'blocks', '+z': 'stone'})
    m.box((1.2, D * .7, 1.4), (0, .12, 3.5), 'stone_light', cells={'-y': 'blocks', '+x': 'blocks', '-x': 'blocks'})
    m.box((W - .82, D - .12, .02), (0, .0, .11), 'ash')
    for (y, z, x0, x1) in ((-.12, .18, -.45, .45), (.08, .18, -.5, .4), (-.02, .3, -.35, .35)):
        m.rod((x0, y, z), (x1, y, z), .075, 'wood_dark', seg=6)
        m.cyl(.074, .005, (x1, y, z), 'log_end', rot=(0, 90, 0), seg=6)
    m.box((.3, .2, .03), (0, -.05, .12), 'coals', cells={'+z': 'coals'})
    for x in (-.55, .55):
        m.box((.04, .3, .04), (x, 0, .14), 'iron_dark')
        m.box((.05, .05, .25), (x, -.15, .24), 'iron_dark')
    P.notes = 'Firebox opening is 1.4 m wide and 1.3 m tall; back it against a wall. Add the fire as a light and a flame sprite in three.js.'


# -------------------------------------------------------------- bedchamber --
CAT = 'Bedchamber'


@prop('four-poster-bed', 'Four-poster bed with curtains', CAT)
def bed(P):
    m = P.mesh()
    W, L, H = 1.6, 2.1, 2.3
    for sx in (-1, 1):
        for sy in (-1, 1):
            m.box((.1, .1, H), (sx * (W / 2 - .05), sy * (L / 2 - .05), H / 2), 'wood_dark')
    m.box((W, L, .3), (0, 0, .35), 'wood_dark', cells={'-y': 'linenfold'})
    m.box((W - .12, L - .12, .2), (0, 0, .6), 'cloth_cream')
    m.box((W - .06, L * .72, .06), (0, -L * .14 - .02, .7), 'cloth_blue', cells={'-y': 'cloth_blue_dark', '+x': 'cloth_blue_dark', '-x': 'cloth_blue_dark'})
    m.box((W - .06, .02, .38), (0, -L / 2 + .02, .52), 'cloth_blue_dark')
    for sx in (-1, 1):
        m.box((.02, L * .72, .36), (sx * (W / 2 - .02), -L * .14 - .02, .52), 'cloth_blue_dark')
    for x in (-.38, .38):
        m.box((.6, .3, .12), (x, L / 2 - .3, .76), 'cloth_cream', rot=(-15, 0, 0))
    m.box((W - .1, .06, 1.1), (0, L / 2 - .05, 1.1), 'wood_red', cells={'-y': 'linenfold'})
    m.box((W + .1, L + .1, .12), (0, 0, H + .06), 'wood_dark', cells={'-y': 'wood_red'})
    m.box((W + .12, L + .12, .02), (0, 0, H + .13), 'cloth_red_dark')
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (W / 2 - .05), sy * (L / 2 - .05)
            # a gathered curtain at each post, as three thin pleats
            for k in range(3):
                off = (k - 1) * .05
                m.box((.08, .06, H - .15), (x - sx * .08 + (off if sy < 0 else 0), y + (off if sy > 0 else -sy * .06), .075 + (H - .15) / 2),
                      'cloth_red' if k != 1 else 'cloth_red_dark', rot=(0, 0, 15 * sx))
    m.box((W - .2, .03, H - .9), (0, L / 2 - .02, 1.3 + (H - .9) / 2 - .4), 'cloth_red_dark')
    m.box((W + .1, .03, .3), (0, -L / 2 - .05, H - .12), 'cloth_red')
    for sx in (-1, 1):
        m.box((.03, L + .1, .3), (sx * (W / 2 + .05), 0, H - .12), 'cloth_red')
    P.notes = 'Foot of the bed faces +Z. The curtains are gathered at the posts, so a player can see and walk to the pillow.'


@prop('wash-basin-stand', 'Wash basin and stand', CAT)
def basin(P):
    m = P.mesh()
    for k in range(3):
        a = 2 * math.pi * k / 3 + math.pi / 2
        m.beam((.2 * math.cos(a), .2 * math.sin(a), 0), (.15 * math.cos(a), .15 * math.sin(a), .82), .035, .035, 'wood_dark')
    m.torus(.16, .015, (0, 0, .8), 'wood_dark', seg=10, seg2=3)
    m.torus(.17, .012, (0, 0, .3), 'wood_dark', seg=10, seg2=3)
    m.cyl(.17, .02, (0, 0, .29), 'wood', seg=10)
    m.lathe([(0, 0), (.08, 0), (.17, .08), (.2, .1), (.19, .11), (.15, .085), (0, .06)], loc=(0, 0, .74), cell='clay', seg=10,
            bands=['clay', 'clay', 'clay', 'clay', 'clay', 'water'])
    m.lathe([(0, 0), (.05, 0), (.07, .08), (.05, .16), (.035, .2), (.05, .24), (.04, .245), (0, .23)], loc=(0, 0, .31), cell='glaze_green', seg=8)
    m.torus(.04, .008, (.06, 0, .47), 'glaze_green', rot=(90, 0, 0), seg=6, seg2=3, arc=200)
    m.box((.02, .22, .45), (.2, 0, .6), 'cloth_cream', rot=(0, -10, 0))


@prop('garderobe-door', 'Garderobe door and privy alcove', CAT)
def garderobe(P):
    a = P.mesh('alcove')
    W, D, H = 1.2, 1.1, 2.3
    a.box((W, .3, H - 2.0), (0, -D / 2 + .15, 2.0 + (H - 2.0) / 2), 'stone', cells={'-y': 'blocks'})
    for x in (-W / 2 + .12, W / 2 - .12):
        a.box((.24, .3, 2.0), (x, -D / 2 + .15, 1.0), 'stone', cells={'-y': 'blocks'})
    for x in (-W / 2 + .1, W / 2 - .1):
        a.box((.2, D - .3, H), (x, .15, H / 2), 'stone_dark')
    a.box((W, .2, H), (0, D / 2 - .1, H / 2), 'stone_dark')
    a.box((W - .4, D - .3, .15), (0, .15, H - .075), 'stone_dark')
    a.box((W - .4, .5, .45), (0, D / 2 - .45, .225), 'wood', cells={'+z': 'wood_light'})
    a.cyl(.12, .01, (0, D / 2 - .45, .45), 'void', seg=8)
    a.box((W - .4, D - .3, .02), (0, .15, .01), 'stone')
    d = P.mesh('door', pivot=(-.36, -D / 2 + .02, 0), parent='alcove')
    d.box((.72, .05, 1.96), (0, -D / 2 + .02, .99), 'wood', cells={'-y': 'planks', '+y': 'planks'})
    for z in (.3, 1.65):
        d.box((.66, .06, .08), (0, -D / 2 - .0, z), 'iron_dark')
    d.box((.04, .06, .12), (.28, -D / 2 - .03, 1.0), 'iron_dark')
    d.torus(.04, .007, (.28, -D / 2 - .065, .95), 'iron', rot=(90, 0, 0), seg=8, seg2=3)
    P.notes = 'The alcove is 1.2 m wide and 1.1 m deep; the door leaf is its own node hinged on the left.'


@prop('travel-chest', 'Travel chest with a domed lid', CAT)
def travel_chest(P):
    b = P.mesh('chest')
    W, D, H = .85, .48, .4
    b.box((W, D, H), (0, 0, H / 2), 'leather', cells={'-z': 'wood_dark'})
    for x in (-.25, .25):
        b.box((.05, D + .012, H + .006), (x, 0, H / 2), 'leather_dark')
    b.box((.08, .015, .1), (0, -D / 2 - .004, H - .06), 'brass')
    for x in (-W / 2 - .005, W / 2 + .005):
        b.box((.012, .14, .04), (x, 0, H - .1), 'leather_dark')
    lid = P.mesh('lid', pivot=(0, D / 2, H), parent='chest')
    dome = [(-D / 2, 0), (D / 2, 0), (D / 2, .06), (D * .35, .13), (0, .16), (-D * .35, .13), (-D / 2, .06)]
    lid.poly(dome, W, loc=(0, 0, H), rot=(0, 0, 90), cell='leather', cells={'+x': 'leather_dark', '-x': 'leather_dark'})
    for x in (-.25, .25):
        lid.poly([(p[0] * 1.03, p[1] * 1.06) for p in dome], .05, loc=(x, 0, H - .001), rot=(0, 0, 90), cell='leather_dark')
    for x in (-.35, -.12, .12, .35):
        lid.box((.018, .018, .018), (x, -D / 2 - .005, H + .04), 'brass')


# ------------------------------------------------------- guardroom, armoury --
CAT = 'Guardroom and armoury'


def spear(m, x, y, z0, L=2.0, lean=0):
    m.rod((x, y, z0), (x + lean, y, z0 + L), .016, 'wood', seg=5)
    m.poly([(-.03, 0), (.03, 0), (.015, .14), (0, .2), (-.015, .14)], .01, loc=(x + lean, y, z0 + L), cell='steel', cells={'side': 'iron'})
    m.cyl(.02, .06, (x + lean, y, z0 + L - .04), 'iron', seg=5)


def sword(m, x, y, z0, L=.95):
    m.poly([(-.022, 0), (.022, 0), (.02, L - .72), (0, L - .66), (-.02, L - .72)], .008, loc=(x, y, z0 + .72), rot=(0, 180, 0), cell='steel', cells={'side': 'iron'})
    m.box((.2, .03, .025), (x, y, z0 + .72), 'iron')
    m.box((.03, .03, .17), (x, y, z0 + .8), 'leather_dark')
    m.sphere(.025, (x, y, z0 + .9), 'brass', seg=6, rings=3)


@prop('weapon-rack', 'Weapon rack with spears and swords', CAT)
def weapon_rack(P):
    m = P.mesh()
    W = 1.4
    for x in (-W / 2, W / 2):
        m.box((.08, .3, .08), (x, 0, .04), 'wood_dark')
        m.box((.07, .07, 1.8), (x, .08, .9), 'wood_dark')
    m.box((W, .12, .06), (0, 0, .12), 'wood', cells={'+z': 'wood_dark'})
    m.box((W, .07, .05), (0, .08, 1.35), 'wood')
    m.box((W, .07, .05), (0, .08, .75), 'wood')
    for i, x in enumerate((-.55, -.35, -.15)):
        spear(m, x, .0, .12, 1.9 + (i % 2) * .15)
    for x in (.15, .35, .55):
        sword(m, x, .0, .15)


@prop('armour-stand', 'Armour stand with a mail shirt and helm', CAT)
def armour_stand(P):
    m = P.mesh()
    m.box((.5, .08, .06), (0, 0, .03), 'wood_dark')
    m.box((.08, .5, .06), (0, 0, .03), 'wood_dark')
    m.box((.06, .06, 1.55), (0, 0, .78), 'wood_dark')
    m.box((.5, .06, .06), (0, 0, 1.4), 'wood_dark')
    prof = [(0, .78), (.2, .78), (.22, .8), (.2, 1.0), (.21, 1.2), (.24, 1.38), (.16, 1.45), (.07, 1.47), (0, 1.47)]
    m.lathe(prof, cell='mail', seg=8, scl=(1, .65, 1), bands=['mail', 'iron_dark', 'mail', 'mail', 'mail', 'mail', 'mail', 'mail'])
    for s in (-1, 1):
        m.rod((s * .22, 0, 1.36), (s * .33, 0, 1.1), .065, 'mail', seg=6, r2=.055)
    m.box((.46, .15, .05), (0, 0, 1.0), 'leather')
    m.box((.05, .02, .05), (0, -.08, 1.0), 'brass')
    m.cyl(.05, .1, (0, 0, 1.45), 'wood_dark', seg=6)
    m.lathe([(0, 0), (.12, 0), (.13, .03), (.12, .1), (.09, .17), (.04, .21), (0, .22)], loc=(0, 0, 1.55), cell='steel', seg=8,
            bands=['iron', 'steel', 'steel', 'steel', 'steel', 'steel'])
    m.box((.025, .02, .12), (0, -.125, 1.56), 'steel')
    m.box((.26, .21, .03), (0, 0, 1.56), 'iron')


@prop('gaming-table', 'Gaming table with dice, tankards and a stool', CAT)
def gaming(P):
    m = P.mesh('table')
    W, D, H = .8, .6, .72
    legs4(m, W, D, H - .04, .06, 'wood_dark')
    m.box((W + .04, D + .04, .04), (0, 0, H - .02), 'wood', cells={'+z': 'wood_light'})
    m.box((.3, .3, .01), (-.12, .02, H + .005), 'wood_light', cells={'+z': 'morris'})
    for (x, y, rz) in ((.15, -.1, 20), (.2, -.05, 50), (.12, -.02, 5)):
        m.box((.016, .016, .016), (x, y, H + .008), 'bone', rot=(0, 0, rz), cells={'+z': 'bone'})
    for (x, y) in ((.28, .15), (-.3, -.2)):
        m.lathe([(0, 0), (.045, 0), (.042, .13), (.047, .14), (.04, .14), (0, .12)], loc=(x, y, H), cell='wood', seg=8,
                bands=['wood', 'wood', 'wood', 'iron', 'stew'])
        m.torus(.035, .008, (x + .05, y, H + .07), 'wood_dark', rot=(90, 0, 0), seg=6, seg2=3, arc=200)
    for (x, y) in ((.3, -.2), (.25, .05), (-.1, -.22)):
        m.cyl(.011, .003, (x, y, H), 'pewter', seg=6)
    s = P.mesh('stool', pivot=(.1, -.6, 0), parent='table')
    s.cyl(.17, .04, (.1, -.6, .42), 'wood', seg=8)
    for k in range(3):
        a = 2 * math.pi * k / 3 + .4
        s.rod((.1 + .1 * math.cos(a), -.6 + .1 * math.sin(a), .42), (.1 + .18 * math.cos(a), -.6 + .18 * math.sin(a), 0), .022, 'wood_dark', seg=5)


@prop('brazier', 'Brazier, iron with coals', CAT)
def brazier(P):
    m = P.mesh()
    m.lathe([(0, 0), (.1, 0), (.3, .12), (.36, .2), (.33, .22), (.27, .14), (0, .08)], loc=(0, 0, .6), cell='iron_dark', seg=8,
            bands=['iron_dark', 'iron_dark', 'iron', 'iron', 'iron_dark', 'coals'])
    m.lathe([(0, 0), (.27, 0), (.2, .06), (0, .1)], loc=(0, 0, .74), cell='coals', seg=8)
    for k in range(3):
        a = 2 * math.pi * k / 3
        m.beam((.12 * math.cos(a), .12 * math.sin(a), .62), (.3 * math.cos(a), .3 * math.sin(a), 0), .03, .03, 'iron_dark')
        m.box((.08, .08, .02), (.3 * math.cos(a), .3 * math.sin(a), .01), 'iron_dark')
    m.torus(.2, .012, (0, 0, .3), 'iron_dark', seg=8, seg2=3)
    for k in range(4):
        a = 2 * math.pi * k / 4 + .3
        m.box((.05, .04, .04), (.12 * math.cos(a), .12 * math.sin(a), .82), 'ember', rot=(0, 0, k * 30))


@prop('watch-bill-board', 'Watch-bill board with pinned sheets', CAT)
def watch_bill(P):
    m = P.mesh()
    W, H = 1.0, .7
    m.box((W, .03, H), (0, 0, H / 2), 'wood', cells={'-y': 'wood_grey'})
    for z in (0, H):
        m.box((W + .06, .05, .05), (0, -.01, z), 'wood_dark')
    for x in (-W / 2, W / 2):
        m.box((.05, .05, H + .05), (x, -.01, H / 2), 'wood_dark')
    for (x, z, w, h, cell, rot) in ((-.28, .38, .3, .42, 'bill', -3), (.1, .4, .26, .36, 'roster', 2), (.36, .26, .2, .26, 'writing', 5), (.08, .12, .18, .1, 'paper_dark', -6)):
        m.box((w, .004, h), (x, -.018, z), 'paper', rot=(0, rot, 0), cells={'-y': cell})
        m.cyl(.008, .012, (x, -.02, z + h / 2 - .03), 'iron_dark', rot=(90, 0, 0), seg=5)
    m.box((.14, .06, .04), (.35, -.04, .06), 'wood_dark')
    m.rod((.3, -.07, .085), (.4, -.06, .09), .004, 'iron', seg=4)
    P.notes = 'Wall-mounted; back at -Z. The sheets are the watch bill, a duty roster and two notes.'


# ------------------------------------------------------------------ garden --
CAT = 'Garden'


@prop('sundial', 'Sundial on a stone pedestal', CAT)
def sundial(P):
    m = P.mesh()
    m.lathe([(0, 0), (.3, 0), (.3, .1), (.2, .14), (.12, .2), (.1, .8), (.16, .86), (.2, .92), (.2, .96), (0, .96)], cell='stone_light', seg=8,
            bands=['stone', 'stone', 'stone', 'stone_light', 'stone_light', 'stone_light', 'stone', 'stone', 'dial'])
    m.cyl(.17, .012, (0, 0, .96), 'brass', seg=10, cells={'+z': 'dial'})
    m.poly([(0, 0), (.14, 0), (0, .1)], .008, loc=(-.07, 0, .972), rot=(0, 0, 90), cell='brass_dark')


@prop('covered-well', 'Covered well with a winch and bucket', CAT)
def well(P):
    m = P.mesh('well')
    R0 = .75
    prof = [(0, .1), (R0, 0), (R0 + .02, .7), (R0 + .06, .75), (R0 + .06, .82), (R0 - .18, .82), (R0 - .18, .1), (0, .1)]
    m.lathe(prof, cell='stone', seg=10, bands=['stone', 'stone', 'stone_light', 'stone_light', 'stone_light', 'void', 'void'],
            cells=None)
    m.lathe([(0, .45), (R0 - .18, .45), (R0 - .18, .46), (0, .46)], cell='water', seg=10)
    for x in (-R0 + .05, R0 - .05):
        m.box((.12, .12, 1.9), (x, 0, 1.2), 'wood_dark')
    m.rod((-R0 + .12, 0, 1.45), (R0 - .12, 0, 1.45), .09, 'wood', seg=8)
    m.torus(.08, .012, (0, 0, 1.45), 'rope', rot=(0, 90, 0), seg=8, seg2=3)
    m.box((.04, .04, .3), (R0 + .03, 0, 1.3), 'iron_dark')
    m.rod((R0 + .03, 0, 1.15), (R0 + .03, -.18, 1.15), .02, 'wood_dark', seg=5)
    m.rod((0, -.09, 1.43), (0, -.09, 1.0), .01, 'rope', seg=4)
    for s in (-1, 1):
        m.box((2.0, 1.05, .05), (0, s * .45, 2.18), 'wood_grey', rot=(s * -28, 0, 0), cells={'+z': 'planks'})
    m.box((2.05, .1, .08), (0, 0, 2.43), 'wood_dark')
    for x in (-R0 + .05, R0 - .05):
        m.beam((x, 0, 2.3), (x, -.35, 2.1), .06, .06, 'wood_dark')
        m.beam((x, 0, 2.3), (x, .35, 2.1), .06, .06, 'wood_dark')
    b = P.mesh('bucket', pivot=(0, -.09, 1.0), parent='well')
    b.lathe([(0, 0), (.1, 0), (.12, .2), (.105, .2), (.09, .03), (0, .04)], loc=(0, -.09, .72), cell='wood', seg=8, bands=['wood_dark', 'wood', 'wood_dark', 'wood_dark', 'water'])
    b.torus(.12, .006, (0, -.09, .92), 'iron_dark', rot=(90, 0, 0), seg=8, seg2=3, arc=180)
    P.notes = 'The bucket is a child node hanging on the rope, so it can be raised or lowered.'


@prop('beehive-skep', 'Beehive skep on a bench', CAT)
def skep(P):
    m = P.mesh()
    m.box((.8, .4, .05), (0, 0, .5), 'wood_grey', cells={'+z': 'wood'})
    for x in (-.32, .32):
        m.box((.06, .3, .48), (x, 0, .24), 'wood_dark')
    for x in (-.18, .2):
        m.lathe([(0, 0), (.17, 0), (.18, .1), (.16, .2), (.11, .29), (.05, .33), (0, .34)], loc=(x, 0, .525), cell='skep', seg=10, scl=(1, 1, 1 if x < 0 else .9))
        m.box((.06, .03, .03), (x, -.17, .54), 'void')
    m.box((.1, .3, .06), (.32, .08, .56), 'wood', rot=(0, 0, 30))


@prop('raised-bed', 'Raised bed with herbs and vegetables', CAT)
def raised_bed(P):
    m = P.mesh()
    L, W, H = 1.8, .9, .35
    for s in (-1, 1):
        m.box((L, .06, H), (0, s * (W / 2 - .03), H / 2), 'wood', cells={'-y': 'planks', '+y': 'planks'})
        m.box((.06, W - .12, H), (s * (L / 2 - .03), 0, H / 2), 'wood')
        m.box((.08, .08, H + .06), (s * (L / 2 - .04), W / 2 - .04, (H + .06) / 2), 'wood_dark')
        m.box((.08, .08, H + .06), (s * (L / 2 - .04), -W / 2 + .04, (H + .06) / 2), 'wood_dark')
    m.box((L - .12, W - .12, .02), (0, 0, H - .04), 'soil')
    for i, x in enumerate((-.6, -.25, .1)):
        m.sphere(.1, (x, -.18, H - .02), 'cabbage', seg=7, rings=4, scl=(1, 1, .75), bands=['leaf_dark', 'cabbage', 'cabbage', 'leaf'])
    for x in (-.65, -.45, -.25, -.05, .15):
        m.lathe([(0, 0), (.03, 0), (0, .12)], loc=(x, .18, H - .03), cell='leaf', seg=4)
        m.box((.02, .02, .03), (x, .18, H - .03), 'carrot')
    for (x, y) in ((.45, -.2), (.6, .15), (.45, .15), (.7, -.15), (.35, 0)):
        m.lathe([(0, 0), (.07, .05), (.05, .14), (0, .18)], loc=(x, y, H - .03), cell='leaf_dark' if y > 0 else 'lavender', seg=5)
    m.lathe([(0, 0), (.07, .05), (.05, .14), (0, .18)], loc=(.3, .2, H - .03), cell='leaf', seg=5)


@prop('scarecrow', 'Scarecrow', CAT)
def scarecrow(P):
    m = P.mesh()
    m.box((.07, .07, 1.9), (0, 0, .95), 'wood_grey')
    m.box((1.2, .06, .06), (0, 0, 1.4), 'wood_grey')
    m.lathe([(0, 0), (.22, 0), (.2, .25), (.16, .5), (.12, .56), (0, .56)], loc=(0, 0, .88), cell='cloth_brown', seg=6, scl=(1, .7, 1),
            bands=['cloth_brown', 'cloth_brown', 'cloth_brown', 'rope', 'cloth_brown'])
    for s in (-1, 1):
        m.rod((s * .1, 0, 1.4), (s * .5, 0, 1.4), .06, 'cloth_brown', seg=5, r2=.075)
        m.lathe([(0, 0), (.05, 0), (0, .14)], loc=(s * .5, 0, 1.4), rot=(0, s * 90 + (s * 20), 0), cell='straw', seg=5)
    for k in range(4):
        m.lathe([(0, 0), (.035, 0), (0, .12)], loc=(-.12 + k * .08, 0, .9), rot=(180, 0, 0), cell='straw', seg=4)
    m.sphere(.14, (0, 0, 1.62), 'burlap', seg=7, rings=5, scl=(1, .95, 1.1))
    m.box((.03, .01, .03), (-.05, -.13, 1.66), 'void'); m.box((.03, .01, .03), (.05, -.13, 1.66), 'void')
    m.box((.1, .01, .015), (0, -.135, 1.57), 'rope')
    m.cyl(.26, .025, (0, 0, 1.73), 'straw_dark', seg=8)
    m.cyl(.14, .16, (0, 0, 1.75), 'straw_dark', seg=8, r2=.05)
