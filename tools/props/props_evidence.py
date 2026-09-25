# props_evidence.py - wishlist 1 to 15, the mystery and evidence props.
import math
from registry import prop
from kit import sub

CAT = 'Mystery and evidence'


@prop('candlestick-brass-bent', 'Candlestick, heavy brass, slightly bent', CAT)
def candlestick(P):
    m = P.mesh()
    m.lathe([(0, 0), (.075, 0), (.075, .012), (.05, .022), (.022, .04), (.016, .07), (.025, .09), (.025, .1), (.016, .115), (0, .115)],
            cell='brass', seg=8,
            bands=['brass_dark', 'brass', 'brass', 'brass', 'brass', 'brass_dark', 'brass', 'brass_dark', 'brass'])
    up = [(0, 0), (.016, 0), (.014, .12), (.021, .13), (.021, .14), (.05, .15), (.05, .162), (.022, .166), (.022, .2), (.017, .2), (.017, .25), (0, .25)]
    m.lathe(up, loc=(0, 0, .11), rot=(10, 3, 0), seg=8,
            bands=['brass', 'brass', 'brass_dark', 'brass', 'brass_dark', 'brass', 'brass', 'brass', 'brass', 'candle', 'candle'])
    P.notes = 'The upper stem leans 10 degrees off true at the knop, where a blow would bend it.'


@prop('goblet-poisoned', 'Poisoned goblet, pewter with dark dregs', CAT)
def goblet(P):
    m = P.mesh()
    prof = [(0, 0), (.042, 0), (.042, .008), (.03, .013), (.011, .02), (.009, .06), (.016, .066), (.009, .074), (.02, .09),
            (.036, .105), (.044, .135), (.046, .16), (.041, .16), (.038, .132), (.03, .115), (.018, .108), (0, .106)]
    bands = ['pewter'] * 12 + ['dregs', 'dregs', 'dregs', 'dregs']
    m.lathe(prof, cell='pewter', seg=10, bands=bands)
    # one dark run down the outside from the rim, and a ring left on the table
    m.box((.006, .003, .03), (.012, -.0445, .142), 'dregs', rot=(0, 0, -15))
    m.lathe([(0, 0), (.02, 0), (.02, .0015), (0, .0015)], loc=(.07, -.02, 0), cell='wine', seg=8)


@prop('garden-shears', 'Garden shears, long-handled, rust-flecked', CAT)
def shears(P):
    m = P.mesh()
    for k, (ang, z) in enumerate(((9, .016), (-9, .022))):
        blade = [(0, -.014), (.19, -.006), (.25, 0), (.19, .011), (0, .02), (-.05, .012), (-.05, -.01)]
        if k:
            blade = [(x, -y) for x, y in blade]
        m.poly(blade, .005, loc=(0, 0, z), rot=(90, 0, ang), cell='iron_rust')
        a = math.radians(ang + 180)
        p1 = (-.05 * math.cos(math.radians(ang)), -.05 * math.sin(math.radians(ang)), .016)
        p2 = (p1[0] + .07 * math.cos(a), p1[1] + .07 * math.sin(a), .016)
        p3 = (p1[0] + .48 * math.cos(a), p1[1] + .48 * math.sin(a), .016)
        m.rod(p1, p2, .01, 'iron_dark', seg=6)
        m.rod(p2, p3, .015, 'wood', seg=6, r2=.013)
        m.cyl(.017, .012, (p3[0], p3[1], .004), 'iron_dark', rot=(0, 90, ang), seg=6)
    m.cyl(.012, .016, (0, 0, .01), 'iron_dark', seg=6)


@prop('dagger-crested', 'Dagger with the family crest on the pommel', CAT)
def dagger(P):
    m = P.mesh()
    blade = [(0, -.016), (.19, -.006), (.23, 0), (.19, .006), (0, .016)]
    m.poly(blade, .006, loc=(0, 0, .012), rot=(90, 0, 0), cell='steel')
    m.box((.03, .004, .002), (.08, 0, .0155), 'iron')  # fuller
    m.box((.022, .11, .018), (-.011, 0, .012), 'brass')
    m.cyl(.006, .004, (-.011, .057, .012), 'brass', rot=(-90, 0, 0), seg=6)
    m.cyl(.006, .004, (-.011, -.057, .012), 'brass', rot=(90, 0, 0), seg=6)
    m.rod((-.022, 0, .012), (-.115, 0, .012), .011, 'leather_dark', seg=6)
    for x in (-.045, -.07, -.095):
        m.rod((x, 0, .012), (x - .005, 0, .012), .0125, 'brass_dark', seg=6)
    m.cyl(.024, .026, (-.13, 0, -.001), 'brass', seg=10, cells={'+z': 'crest_a'})
    P.notes = 'The pommel face (up when the dagger lies flat) carries crest A, the red chevron house.'


@prop('body-scene-set', 'Body scene: sprawled figure, spilled cup, tipped stool, ink pot', CAT)
def body_scene(P):
    f = P.mesh('figure', pivot=(0, 0, 0))
    robe, hose = 'cloth_blue_dark', 'cloth_brown'
    f.box((.5, .36, .2), (.05, 0, .1), robe)
    f.box((.62, .5, .05), (.04, .03, .21), 'cloth_green_dark', rot=(0, 3, 6))   # cloak thrown over the back
    f.box((.18, .44, .03), (-.3, .05, .19), 'cloth_green_dark', rot=(0, -12, 4))
    f.box((.3, .38, .17), (-.3, 0, .085), robe)
    f.box((.52, .13, .12), (-.7, .1, .06), hose, rot=(0, 0, 8))
    f.box((.52, .13, .12), (-.68, -.14, .06), hose, rot=(0, 0, -14))
    f.box((.1, .11, .13), (-1.0, .15, .065), 'leather_dark', rot=(0, 0, 8))
    f.box((.1, .11, .13), (-.95, -.23, .065), 'leather_dark', rot=(0, 0, -14))
    f.box((.1, .12, .09), (.33, 0, .07), robe)
    f.sphere(.105, (.43, .02, .1), 'hair', seg=8, rings=5, scl=(1.05, .95, .95))
    f.box((.03, .04, .05), (.42, -.1, .09), 'skin')    # an ear
    f.box((.46, .1, .09), (.46, -.33, .05), robe, rot=(0, 0, 28))
    f.box((.1, .08, .04), (.7, -.46, .02), 'skin', rot=(0, 0, 28))
    f.box((.28, .1, .09), (.12, .28, .05), robe, rot=(0, 0, -55))
    f.box((.24, .09, .08), (.3, .36, .045), robe, rot=(0, 0, 20))
    f.box((.09, .08, .04), (.44, .4, .02), 'skin', rot=(0, 0, 20))
    f.box((.07, .36, .02), (-.16, 0, .21), 'leather', rot=(0, 0, 0))   # belt

    c = P.mesh('cup', pivot=(.85, -.35, .04))
    c.lathe([(0, 0), (.035, 0), (.04, .09), (.036, .09), (.031, .01), (0, .01)], loc=(.8, -.28, .04), rot=(90, 0, 150), cell='pewter', seg=8)
    spill = [(0, 0), (.08, -.03), (.2, -.02), (.28, -.07), (.3, .02), (.18, .07), (.06, .05)]
    c.slab(spill, .002, loc=(.86, -.42, 0), cell='wine', rot=(0, 0, -40))

    s = P.mesh('stool', pivot=(-.35, .6, .17))
    s.cyl(.17, .045, (0, 0, .4), 'wood_light', seg=8)
    for k in range(3):
        a = math.radians(90 + k * 120)
        s.rod((.09 * math.cos(a), .09 * math.sin(a), .41), (.17 * math.cos(a), .17 * math.sin(a), 0), .02, 'wood', seg=5)
    s.transform(rot=(0, 90, 0))
    s.transform(rot=(0, 0, 35))
    s.drop()
    s.transform(loc=(-.35, .62, 0))

    k = P.mesh('inkpot', pivot=(.72, .42, .03))
    k.lathe([(0, 0), (.03, 0), (.034, .025), (.028, .045), (.013, .05), (.013, .058), (0, .058)], loc=(.7, .38, .03), rot=(90, 0, -60), cell='clay_dark', seg=8)
    puddle = [(0, 0), (.06, -.02), (.12, 0), (.16, .05), (.1, .09), (.03, .07)]
    k.slab(puddle, .002, loc=(.74, .38, 0), cell='ink', rot=(0, 0, -20))
    quill = [(0, 0), (.02, .006), (.12, .012), (.2, 0), (.12, -.01), (.02, -.005)]
    k.slab(quill, .003, loc=(.52, .52, .001), cell='feather', rot=(0, 0, 160))
    P.notes = 'Four nodes (figure, cup, stool, inkpot) so the scene can be dressed apart. The figure lies face down, head toward +X, and is clothed and bloodless on purpose.'


@prop('torn-letter', 'Torn letter with a broken wax seal', CAT)
def torn_letter(P):
    m = P.mesh()
    f1 = [(0, 0), (.12, 0), (.135, .04), (.115, .08), (.13, .12), (.12, .16), (0, .16)]
    m.slab(f1, .0012, loc=(-.13, -.08, 0), cell='paper', top=sub('writing', 0, 0, .55, 1))
    f2 = [(0, 0), (.085, 0), (.085, .16), (.01, .16), (.02, .12), (0, .08), (.02, .04)]
    m.slab(f2, .0012, loc=(.03, -.07, .0015), rot=(0, 0, 11), cell='paper', top=sub('writing', .5, 0, 1, 1))
    f3 = [(0, 0), (.06, .01), (.055, .05), (.01, .045)]
    m.slab(f3, .0012, loc=(.02, .11, .003), rot=(0, 0, -25), cell='paper', top=sub('writing', .2, .1, .6, .4))
    half = [(math.cos(math.radians(a)) * .017, math.sin(math.radians(a)) * .017) for a in range(-90, 91, 30)]
    m.slab(half, .004, loc=(-.012, 0, .0012), cell='wax_red', rot=(0, 0, 0))
    m.slab(half, .004, loc=(.06, .012, .0027), cell='wax_red', rot=(0, 0, 200))
    m.slab([(0, 0), (.006, .002), (.004, .006)], .003, loc=(.02, -.03, .003), cell='wax_red')   # a crumb of wax


@prop('signet-ring', 'Signet ring', CAT)
def signet(P):
    m = P.mesh()
    m.torus(.011, .0028, (0, 0, .0138), 'gold', rot=(90, 0, 0), seg=12, seg2=4)
    m.cyl(.0075, .004, (0, 0, .0245), 'gold', seg=8, cells={'+z': 'crest_a'})
    P.notes = 'Real size (2.8 cm). Scale it up if it has to read on a table at 2 m.'


@prop('wax-seal-stamp', 'Wax seal stamp and a stick of sealing wax', CAT)
def seal_stamp(P):
    m = P.mesh()
    m.cyl(.017, .008, (0, 0, 0), 'brass', seg=8, cells={'-z': 'crest_a'})
    m.lathe([(0, 0), (.011, 0), (.011, .006), (.008, .012), (.006, .05), (.009, .07), (.012, .085), (.009, .097), (0, .1)],
            loc=(0, 0, .008), cell='wood_dark', seg=8, bands=['brass', 'brass', 'brass', 'wood_dark', 'wood_dark', 'wood_dark', 'wood_dark', 'wood_dark'])
    m.box((.09, .012, .012), (.07, .03, .006), 'wax_red', rot=(0, 0, 25))


@prop('ledger', 'Ledger, thick with a ribbon bookmark', CAT)
def ledger(P):
    m = P.mesh()
    L, W = .32, .24
    m.box((L, W, .009), (0, 0, .0045), 'leather_dark')
    m.box((L, W, .009), (0, 0, .0685), 'leather_dark')
    m.box((.014, W, .073), (-L / 2 + .002, 0, .0365), 'leather_dark')
    m.box((L - .016, W - .014, .055), (.006, 0, .0365), 'paper_dark', cells={'-y': 'paper', '+x': 'paper'})
    for y in (-.07, 0, .07):
        m.box((.018, .012, .076), (-L / 2 - .001, y, .0365), 'leather')
    for sx, sy in ((1, 1), (1, -1)):
        m.box((.035, .035, .011), (sx * (L / 2 - .016), sy * (W / 2 - .016), .069), 'brass')
    m.box((.022, .035, .05), (L / 2 + .004, 0, .037), 'brass')
    # the ribbon comes out of the fore-edge and lies on the table
    m.box((.014, .003, .06), (.05, -W / 2 + .002, .036), 'cloth_red')
    m.box((.014, .06, .0025), (.058, -W / 2 - .028, .0013), 'cloth_red', rot=(0, 0, 8))


@prop('muddy-boot', 'Muddy boot', CAT)
def boot(P):
    m = P.mesh()
    m.box((.1, .29, .025), (0, -.035, .0125), 'mud_wet')
    m.box((.095, .2, .07), (0, -.06, .06), 'leather', cells={'-z': 'mud'})
    m.box((.1, .23, .04), (0, -.05, .045), 'mud')
    m.sphere(.05, (0, -.16, .045), 'leather', seg=8, rings=4, scl=(1, 1.1, .8), bands=['mud', 'mud', 'leather', 'leather'])
    m.cyl(.056, .25, (0, .035, .05), 'leather', seg=8, r2=.062, cells={'+z': 'leather_dark'})
    m.cyl(.066, .045, (0, .035, .29), 'leather_dark', seg=8, r2=.07)
    m.box((.08, .07, .035), (0, .075, .0175), 'wood_dark')
    for (x, y, z, s) in ((.05, -.02, .09, .03), (-.048, .03, .12, .025), (.02, .088, .1, .03), (-.03, -.12, .08, .02), (.053, .06, .15, .018)):
        m.box((s, s, s * .8), (x, y, z), 'mud', rot=(20, 30, 10))
    for (x, y) in ((.05, -.12), (-.05, .02), (.04, .09)):
        m.box((.03, .04, .02), (x, y, .01), 'mud_wet', rot=(0, 0, 20))


@prop('key-ring', 'Key ring with four keys', CAT)
def key_ring(P):
    m = P.mesh()
    z = .004
    m.torus(.045, .0035, (0, 0, z), 'iron_dark', seg=12, seg2=4)
    keys = [(-20, .09, 'iron'), (15, .12, 'iron_rust'), (45, .075, 'iron'), (75, .1, 'brass')]
    for ang, L, cell in keys:
        a = math.radians(ang)
        d = (math.cos(a), math.sin(a))
        pp = (-d[1], d[0])
        bc = (d[0] * .055, d[1] * .055)
        m.torus(.012, .003, (bc[0], bc[1], z), cell, seg=8, seg2=3)
        s0 = (bc[0] + d[0] * .012, bc[1] + d[1] * .012, z)
        s1 = (bc[0] + d[0] * (.012 + L), bc[1] + d[1] * (.012 + L), z)
        m.rod(s0, s1, .0035, cell, seg=5)
        bx = (s1[0] - d[0] * .01 + pp[0] * .008, s1[1] - d[1] * .01 + pp[1] * .008, z)
        m.box((.016, .014, .005), bx, cell, rot=(0, 0, ang))
    P.notes = 'One of the four keys is brass and newer than the rest, which is the kind of wrong-place key the design brief asks for.'


@prop('coin-pouch', 'Coin pouch', CAT)
def coin_pouch(P):
    m = P.mesh()
    m.sphere(.06, (0, 0, .048), 'leather', seg=8, rings=5, scl=(1, .95, .8), bands=['leather_dark', 'leather', 'leather', 'leather', 'leather'])
    m.lathe([(.03, 0), (.02, .012), (.024, .022), (.034, .032), (.03, .038), (0, .036)], loc=(0, 0, .083), cell='leather', seg=8)
    m.torus(.022, .0035, (0, 0, .096), 'rope', seg=8, seg2=3)
    m.rod((.02, -.012, .096), (.05, -.05, .02), .003, 'rope', seg=4)
    for (x, y, rz, cell) in ((.08, -.03, 0, 'gold'), (.1, .01, 0, 'pewter'), (.065, -.075, 0, 'gold'), (-.07, -.05, 0, 'pewter')):
        m.cyl(.012, .003, (x, y, 0), cell, seg=8)
    m.cyl(.012, .003, (.078, -.028, .003), 'gold', seg=8, rot=(12, 0, 0))


@prop('vial-residue', 'Small vial with residue', CAT)
def vial(P):
    m = P.mesh()
    prof = [(0, 0), (.013, 0), (.015, .004), (.015, .05), (.011, .058), (.006, .062), (.006, .074), (.008, .076), (0, .076)]
    m.lathe(prof, cell='glass_green', seg=8, bands=['residue', 'residue', 'residue', 'glass_green', 'glass_green', 'glass_green', 'glass_green', 'glass_green'])
    m.cyl(.0055, .012, (0, 0, .073), 'cork', seg=6, r2=.0065)
    m.box((.004, .002, .03), (.004, -.0152, .035), 'residue')
    P.notes = 'Opaque greenish glass with a dark band around the base; the atlas has no transparency on purpose.'


def _bands_box(m, w, d, h, z0, xs, cell='iron'):
    for x in xs:
        m.box((.028, d + .01, h + .01), (x, 0, z0 + h / 2), cell)


@prop('strongbox', 'Strongbox, iron-banded with a lock', CAT)
def strongbox(P):
    b = P.mesh('strongbox')
    W, D, H = .42, .28, .2
    b.box((W, D, H), (0, 0, H / 2), 'wood_dark')
    _bands_box(b, W, D, H, 0, (-.15, .15))
    b.box((W + .01, D + .01, .025), (0, 0, .0125), 'iron')
    b.box((.09, .012, .08), (0, -D / 2 - .005, .15), 'iron_dark')
    b.box((.012, .004, .026), (0, -D / 2 - .012, .14), 'void')
    for x in (-W / 2 - .006, W / 2 + .006):
        b.torus(.03, .005, (x, 0, .13), 'iron_dark', rot=(0, 90, 0), seg=8, seg2=3)
    lid = P.mesh('lid', pivot=(0, D / 2, H), parent='strongbox')
    lid.box((W + .01, D + .01, .07), (0, 0, H + .035), 'wood_dark', cells={'+z': 'wood'})
    for x in (-.15, .15):
        lid.box((.03, D + .02, .075), (x, 0, H + .0375), 'iron')
    lid.box((.045, .014, .07), (0, -D / 2 - .009, H + .01), 'iron')
    P.notes = 'The lid is its own node, hinged along the back top edge.'


@prop('chest-iron-banded', 'Chest, iron-banded with a hasp lock', CAT)
def chest(P):
    b = P.mesh('chest')
    W, D, H = 1.0, .55, .48
    b.box((W, D, H), (0, 0, H / 2 + .04), 'wood', cells={'-y': 'planks', '+y': 'planks'})
    for x in (-.4, .4):
        b.box((.1, D + .02, .05), (x, 0, .025), 'wood_dark')
    _bands_box(b, W, D, H, .04, (-.3, .3))
    b.box((W + .012, D + .012, .04), (0, 0, .07), 'iron')
    b.box((.15, .014, .14), (0, -D / 2 - .006, .42), 'iron_dark')
    b.box((.016, .004, .035), (0, -D / 2 - .014, .4), 'void')
    for x in (-W / 2 - .008, W / 2 + .008):
        b.box((.014, .12, .06), (x, 0, .38), 'iron_dark')
        b.torus(.045, .007, (x - (.012 if x < 0 else -.012) * -1, 0, .33), 'iron_dark', rot=(0, 90, 0), seg=8, seg2=3)
    lid = P.mesh('lid', pivot=(0, D / 2, H + .04), parent='chest')
    top = H + .04
    lid.box((W + .02, D + .02, .12), (0, 0, top + .06), 'wood', cells={'+z': 'planks', '-y': 'planks'})
    for x in (-.3, .3):
        lid.box((.03, D + .03, .125), (x, 0, top + .0625), 'iron')
    lid.box((W + .03, .03, .03), (0, -D / 2 - .005, top + .015), 'iron')
    lid.box((.06, .016, .12), (0, -D / 2 - .012, top), 'iron')
    P.notes = 'The lid is its own node, hinged along the back top edge.'


@prop('writing-desk-locked', 'Writing desk with a locked drawer', CAT)
def writing_desk(P):
    d = P.mesh('desk')
    W, D, H = .9, .55, .76
    for sx in (-1, 1):
        for sy in (-1, 1):
            d.box((.05, .05, H - .04), (sx * (W / 2 - .04), sy * (D / 2 - .04), (H - .04) / 2), 'wood_dark')
    d.box((W + .02, D + .02, .04), (0, 0, H - .02), 'wood_red', cells={'-y': 'wood_dark', '+y': 'wood_dark'})
    d.box((W - .08, .02, .12), (0, D / 2 - .04, H - .1), 'wood_dark')
    for sx in (-1, 1):
        d.box((.02, D - .08, .12), (sx * (W / 2 - .04), 0, H - .1), 'wood_dark')
        d.box((.2, .02, .12), (sx * .31, -D / 2 + .04, H - .1), 'wood_dark')
    d.box((W - .06, .04, .03), (0, -D / 2 + .1, .1), 'wood_dark')     # footrail
    # a sloped writing box on the top
    d.poly([(-.19, 0), (.19, 0), (.19, .13), (-.19, .05)], .62, loc=(0, .05, H), rot=(0, 0, 90), cell='wood_dark', cells={'+z': 'wood_red'})
    d.box((.64, .03, .015), (0, -.155, H + .055), 'wood_dark')
    d.lathe([(0, 0), (.028, 0), (.03, .03), (.012, .04), (0, .04)], loc=(.25, .17, H + .13), cell='clay_dark', seg=8)
    dr = P.mesh('drawer', pivot=(0, -D / 2 + .03, H - .1), parent='desk')
    dr.box((.4, .025, .1), (0, -D / 2 + .035, H - .1), 'wood_red')
    dr.box((.38, .44, .08), (0, -D / 2 + .27, H - .1), 'wood')
    dr.box((.035, .006, .045), (0, -D / 2 + .02, H - .1), 'brass')
    dr.box((.008, .004, .02), (0, -D / 2 + .0155, H - .102), 'void')
    P.notes = 'The drawer is its own node and slides along -Z in glTF. It has a keyhole and no pull, which is the point.'


@prop('cell-door-barred', 'Barred cell door with stone frame', CAT)
def cell_door(P):
    fr = P.mesh('frame')
    fr.box((.25, .3, 2.25), (-.575, 0, 1.125), 'stone', cells={'-y': 'blocks', '+y': 'blocks'})
    fr.box((.25, .3, 2.25), (.575, 0, 1.125), 'stone', cells={'-y': 'blocks', '+y': 'blocks'})
    fr.box((1.4, .3, .25), (0, 0, 2.125), 'stone', cells={'-y': 'blocks', '+y': 'blocks'})
    fr.box((.9, .3, .03), (0, 0, .015), 'stone_dark')
    dr = P.mesh('door', pivot=(-.44, 0, 0), parent='frame')
    x0, x1, z0, z1 = -.44, .44, .04, 1.98
    dr.box((.05, .04, z1 - z0), (x0 + .025, 0, (z0 + z1) / 2), 'iron')
    dr.box((.05, .04, z1 - z0), (x1 - .025, 0, (z0 + z1) / 2), 'iron')
    for z in (z0 + .025, .7, 1.35, z1 - .025):
        dr.box((x1 - x0, .045, .05), (0, 0, z), 'iron')
    for i in range(6):
        x = -.33 + i * .132
        dr.box((.024, .024, z1 - z0), (x, 0, (z0 + z1) / 2), 'iron_dark')
    dr.box((.12, .07, .16), (x1 - .06, -.01, 1.02), 'iron_dark')
    dr.box((.014, .004, .03), (x1 - .06, -.047, 1.0), 'void')
    for z in (.3, 1.7):
        dr.box((.16, .05, .04), (x0 + .08, 0, z), 'iron_dark')
        dr.cyl(.018, .1, (x0 - .005, 0, z - .05), 'iron_dark', seg=6)
    P.notes = 'The door leaf is its own node, hinged on the left edge (-X). The opening is 0.9 x 2.0 m.'
