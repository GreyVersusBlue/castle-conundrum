# atlas.py - paints the one 128 px pixel-art atlas every Castle Conundrum prop shares.
#
# Layout (pixel coords, origin top-left):
#   y   0..16   4x4 px flat swatches, 32 per row, 4 rows (128 slots)
#   y  16..64   16x16 px pattern tiles, 8 per row, 3 rows (24 slots)
#   y  64..128  32x32 px pattern tiles, 4 per row, 2 rows (8 slots)
#
# Colours are pulled toward the Kenney Retro Fantasy Kit: weathered grey-brown
# wood, lavender-grey stone, muted cloth. Deterministic: same seed, same pixels.

import random
import numpy as np

SIZE = 128
rng = random.Random(1337)
IMG = np.zeros((SIZE, SIZE, 4), np.float32)

# ---------------------------------------------------------------- swatches --
SWATCHES = [
    # name, rgb, style
    ('wood_light', (152, 122, 88), 'grain'),
    ('wood', (118, 90, 64), 'grain'),
    ('wood_dark', (80, 60, 44), 'grain'),
    ('wood_grey', (124, 112, 98), 'grain'),
    ('wood_red', (112, 66, 48), 'grain'),
    ('wood_black', (52, 42, 36), 'grain'),
    ('stone_light', (168, 164, 172), 'stone'),
    ('stone', (130, 126, 140), 'stone'),
    ('stone_dark', (90, 86, 100), 'stone'),
    ('stone_warm', (164, 148, 126), 'stone'),
    ('soot', (52, 48, 50), 'stone'),
    ('iron', (78, 78, 84), 'metal'),
    ('iron_dark', (46, 46, 52), 'metal'),
    ('iron_rust', (84, 74, 70), 'rust'),
    ('rust', (134, 74, 46), 'stone'),
    ('brass', (178, 140, 64), 'metal'),
    ('brass_dark', (124, 94, 44), 'metal'),
    ('gold', (204, 166, 72), 'metal'),
    ('pewter', (146, 148, 150), 'metal'),
    ('steel', (176, 180, 186), 'metal'),
    ('bronze', (140, 100, 58), 'metal'),
    ('cloth_red', (140, 52, 46), 'cloth'),
    ('cloth_red_dark', (96, 36, 36), 'cloth'),
    ('cloth_blue', (60, 76, 122), 'cloth'),
    ('cloth_blue_dark', (40, 50, 84), 'cloth'),
    ('cloth_green', (72, 98, 64), 'cloth'),
    ('cloth_green_dark', (48, 66, 46), 'cloth'),
    ('cloth_cream', (206, 194, 162), 'cloth'),
    ('cloth_brown', (112, 86, 62), 'cloth'),
    ('cloth_purple', (92, 64, 104), 'cloth'),
    ('cloth_ochre', (180, 142, 62), 'cloth'),
    ('cloth_black', (34, 32, 36), 'cloth'),
    ('wool_grey', (132, 126, 116), 'cloth'),
    ('burlap', (160, 132, 92), 'cloth'),
    ('burlap_light', (196, 180, 146), 'cloth'),
    ('paper', (222, 210, 176), 'flat'),
    ('paper_dark', (188, 168, 124), 'flat'),
    ('ink', (28, 26, 36), 'flat'),
    ('wax_red', (158, 38, 36), 'flat'),
    ('candle', (226, 214, 180), 'flat'),
    ('flame', (250, 190, 84), 'glow'),
    ('flame_core', (255, 238, 176), 'glow'),
    ('ember', (214, 92, 40), 'glow'),
    ('coal', (40, 34, 32), 'stone'),
    ('ash', (112, 106, 100), 'stone'),
    ('straw', (196, 166, 92), 'straw'),
    ('straw_dark', (150, 120, 64), 'straw'),
    ('bread', (186, 130, 66), 'stone'),
    ('bread_dark', (140, 88, 44), 'stone'),
    ('meat', (150, 82, 52), 'stone'),
    ('meat_roast', (122, 66, 38), 'stone'),
    ('apple_red', (166, 52, 40), 'flat'),
    ('apple_green', (132, 150, 62), 'flat'),
    ('leaf', (86, 112, 58), 'stone'),
    ('leaf_dark', (56, 80, 44), 'stone'),
    ('herb_dried', (122, 118, 72), 'straw'),
    ('lavender', (120, 104, 150), 'stone'),
    ('soil', (88, 68, 50), 'stone'),
    ('mud', (100, 82, 56), 'stone'),
    ('mud_wet', (66, 54, 38), 'stone'),
    ('leather', (118, 76, 48), 'cloth'),
    ('leather_dark', (78, 50, 34), 'cloth'),
    ('rope', (170, 142, 98), 'straw'),
    ('water', (70, 104, 116), 'flat'),
    ('glass_green', (104, 132, 108), 'metal'),
    ('residue', (72, 70, 42), 'stone'),
    ('dregs', (60, 24, 34), 'flat'),
    ('wine', (96, 30, 42), 'flat'),
    ('skin', (190, 148, 118), 'flat'),
    ('hair', (72, 52, 38), 'flat'),
    ('bone', (214, 204, 180), 'flat'),
    ('clay', (160, 96, 64), 'stone'),
    ('clay_dark', (96, 66, 52), 'stone'),
    ('glaze_green', (88, 110, 84), 'metal'),
    ('horn', (212, 176, 110), 'glow'),
    ('feather', (232, 228, 214), 'flat'),
    ('void', (18, 16, 20), 'flat'),
    ('stew', (112, 84, 48), 'stone'),
    ('fish', (150, 158, 160), 'metal'),
    ('cork', (170, 130, 86), 'stone'),
    ('tar', (40, 36, 34), 'flat'),
    ('mortar', (150, 142, 132), 'stone'),
    ('cabbage', (120, 150, 90), 'stone'),
    ('carrot', (206, 118, 44), 'flat'),
    ('flour', (232, 226, 210), 'flat'),
    ('blood_old', (74, 34, 30), 'flat'),   # used sparingly: butcher block stain only
    ('wax_black', (40, 30, 30), 'flat'),
    ('glass_amber', (190, 140, 60), 'metal'),
    ('stone_green', (112, 124, 110), 'stone'),  # mossy stone for the well and font
]
SW = {}  # name -> (x, y, w, h)

def _clamp(c):
    return np.clip(np.array(c, np.float32) / 255.0, 0.0, 1.0)

def _swatch(i, rgb, style):
    x0, y0 = (i % 32) * 4, (i // 32) * 4
    base = np.array(rgb, np.float32)
    for y in range(4):
        row = rng.uniform(-1, 1)
        for x in range(4):
            if style == 'grain':
                k = 1 + 0.07 * row + rng.uniform(-0.03, 0.03)
            elif style == 'stone':
                k = 1 + rng.uniform(-0.08, 0.08)
            elif style == 'metal':
                k = 1 + 0.10 * (1 - (x + y) / 6.0) - 0.04 + rng.uniform(-0.02, 0.02)
            elif style == 'cloth':
                k = 1 + (0.045 if (x + y) % 2 else -0.045)
            elif style == 'straw':
                k = 1 + 0.08 * ((x * 3 + y) % 3 - 1) + rng.uniform(-0.03, 0.03)
            elif style == 'glow':
                k = 1 + rng.uniform(-0.04, 0.04)
            elif style == 'rust':
                k = 1 + rng.uniform(-0.05, 0.05)
            else:
                k = 1 + rng.uniform(-0.03, 0.03)
            c = base * k
            if style == 'rust' and rng.random() < 0.35:
                c = np.array((134, 74, 46), np.float32) * (1 + rng.uniform(-0.1, 0.1))
            IMG[y0 + y, x0 + x, :3] = _clamp(c)
            IMG[y0 + y, x0 + x, 3] = 1.0
    return (x0, y0, 4, 4)

for i, (name, rgb, style) in enumerate(SWATCHES):
    SW[name] = _swatch(i, rgb, style)

# ------------------------------------------------------------ tile helpers --
def put(x, y, rgb, a=1.0):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        IMG[y, x, :3] = _clamp(rgb)
        IMG[y, x, 3] = a

def fill(x0, y0, w, h, rgb, jitter=0.0, a=1.0):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            k = 1 + (rng.uniform(-jitter, jitter) if jitter else 0)
            put(x, y, tuple(c * k for c in rgb), a)

def shade(rgb, k):
    return tuple(c * k for c in rgb)

class Tile:
    """A drawing context local to one tile. Coordinates are tile-local."""
    def __init__(self, x0, y0, n):
        self.x0, self.y0, self.n = x0, y0, n
    def p(self, x, y, rgb, a=1.0):
        if 0 <= x < self.n and 0 <= y < self.n:
            put(self.x0 + x, self.y0 + y, rgb, a)
    def rect(self, x, y, w, h, rgb, jitter=0.0):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                k = 1 + (rng.uniform(-jitter, jitter) if jitter else 0)
                self.p(xx, yy, shade(rgb, k))
    def line(self, x0, y0, x1, y1, rgb, a=1.0):
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        for s in range(steps + 1):
            t = s / steps
            self.p(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), rgb, a)
    def disc(self, cx, cy, r, rgb):
        for y in range(self.n):
            for x in range(self.n):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.p(x, y, rgb)
    def ring(self, cx, cy, r0, r1, rgb):
        for y in range(self.n):
            for x in range(self.n):
                d = (x - cx) ** 2 + (y - cy) ** 2
                if r0 * r0 <= d <= r1 * r1:
                    self.p(x, y, rgb)
    def rect_uv(self):
        return (self.x0, self.y0, self.n, self.n)

T16 = {}
T32 = {}

def t16(name, slot):
    t = Tile((slot % 8) * 16, 16 + (slot // 8) * 16, 16)
    T16[name] = t.rect_uv()
    return t

def t32(name, slot):
    t = Tile((slot % 4) * 32, 64 + (slot // 4) * 32, 32)
    T32[name] = t.rect_uv()
    return t

# ------------------------------------------------------------ 16 px tiles --
INK = (28, 26, 36)
PAPER = (222, 210, 176)
GOLD = (204, 166, 72)
CREAM = (206, 194, 162)
LEAD = (40, 40, 46)

# 0 book spines
t = t16('spines', 0)
cols = [(128, 48, 42), (58, 74, 118), (74, 98, 62), (112, 80, 54), (170, 132, 62), (70, 44, 40), (96, 64, 100), (140, 120, 96)]
x = 0
while x < 16:
    w = rng.choice((2, 2, 3))
    c = rng.choice(cols)
    top = rng.choice((0, 1, 2, 3))
    t.rect(x, top, w, 16 - top, c, 0.04)
    for yy in (top + 2, 13):
        t.rect(x, yy, w, 1, shade(GOLD, 0.9))
    t.rect(x, top, 1, 16 - top, shade(c, 0.75))
    for yy in range(0, top):
        t.rect(x, yy, w, 1, (30, 26, 26))
    x += w

# 1 writing on paper
t = t16('writing', 1)
t.rect(0, 0, 16, 16, PAPER, 0.03)
for yy in range(2, 15, 2):
    xx = 1
    while xx < 15:
        w = rng.randint(1, 4)
        if xx + w > 15:
            w = 15 - xx
        t.rect(xx, yy, w, 1, shade(INK, 1.4) if rng.random() < 0.8 else shade(INK, 2.2))
        xx += w + 1
t.rect(1, 2, 2, 2, (150, 40, 36))   # a red initial

# 2-4 rugs, drawn for nine-slice: 3 px border
def rug(t, field, border, edge, motif):
    t.rect(0, 0, 16, 16, edge, 0.03)
    t.rect(1, 1, 14, 14, border, 0.03)
    t.rect(3, 3, 10, 10, field, 0.04)
    for i in range(1, 15, 2):
        t.p(i, 2, shade(edge, 1.1)); t.p(2, i, shade(edge, 1.1))
        t.p(i, 13, shade(edge, 1.1)); t.p(13, i, shade(edge, 1.1))
    for d in range(0, 4):
        for s in (-1, 1):
            t.p(8 + s * d - (1 if s < 0 else 0), 4 + d, motif)
            t.p(8 + s * d - (1 if s < 0 else 0), 11 - d, motif)
    t.rect(7, 7, 2, 2, border)
t = t16('rug_a', 2); rug(t, (128, 50, 44), (182, 144, 70), (64, 34, 32), (206, 190, 150))
t = t16('rug_b', 3); rug(t, (54, 66, 104), (170, 134, 64), (34, 36, 54), (200, 176, 120))
t = t16('rug_c', 4); rug(t, (80, 96, 64), (132, 84, 56), (46, 40, 34), (196, 170, 110))

# 5 cobweb, alpha. Strands fan from the top-left corner.
def cobweb(t, spokes, rings, seed):
    r2 = random.Random(seed)
    for y in range(16):
        for x in range(16):
            t.p(x, y, (220, 220, 214), 0.0)
    import math
    for s in range(spokes):
        a = (s + 0.3) / (spokes - 0.4) * (math.pi / 2)
        for d in range(0, 23):
            t.p(round(math.cos(a) * d), round(math.sin(a) * d), (224, 224, 218), 0.9)
    for rr in rings:
        for k in range(60):
            a = k / 59 * (math.pi / 2)
            sag = 0.8 * math.sin(a * 2)
            t.p(round(math.cos(a) * (rr - sag)), round(math.sin(a) * (rr - sag)), (210, 210, 204), 0.85 if r2.random() < 0.85 else 0.0)
t = t16('cobweb', 5); cobweb(t, 6, (4, 8, 12, 15), 5)
t = t16('cobweb_b', 23); cobweb(t, 5, (3, 6, 10, 14), 9)

# 6 planks (vertical boards)
t = t16('planks', 6)
for i in range(4):
    c = shade((118, 90, 64), rng.uniform(0.9, 1.1))
    t.rect(i * 4, 0, 4, 16, c, 0.06)
    t.rect(i * 4, 0, 1, 16, shade(c, 0.6))
    t.p(i * 4 + 2, 2, (60, 56, 56)); t.p(i * 4 + 2, 13, (60, 56, 56))

# 7 coursed stone blocks
def blocks(t, base, mortar, h=4, w=8):
    t.rect(0, 0, 16, 16, mortar)
    for row in range(16 // h):
        off = (w // 2) if row % 2 else 0
        for bx in range(-1, 16 // w + 1):
            c = shade(base, rng.uniform(0.88, 1.1))
            x0 = bx * w + off
            for yy in range(row * h, row * h + h - 1):
                for xx in range(x0, x0 + w - 1):
                    t.p(xx, yy, shade(c, 1 + rng.uniform(-0.05, 0.05)))
t = t16('blocks', 7); blocks(t, (140, 136, 150), (96, 92, 100))
t = t16('bricks_warm', 12); blocks(t, (164, 116, 84), (120, 108, 96), 4, 6)
t = t16('fireback', 13); blocks(t, (70, 60, 58), (40, 36, 36), 4, 6)
for y in range(8):
    for x in range(16):
        if rng.random() < 0.5 - y * 0.05:
            t.p(x, y, (34, 30, 30))

# 8 nine men's morris board
t = t16('morris', 8)
t.rect(0, 0, 16, 16, (164, 132, 94), 0.04)
for ins in (1, 4, 6):
    a, b = ins, 15 - ins
    if ins == 6:
        a, b = 6, 9
    t.line(a, a, b, a, INK); t.line(a, b, b, b, INK); t.line(a, a, a, b, INK); t.line(b, a, b, b, INK)
t.line(7, 1, 7, 6, INK); t.line(7, 9, 7, 14, INK); t.line(1, 7, 6, 7, INK); t.line(9, 7, 14, 7, INK)
t.p(4, 4, (220, 210, 190)); t.p(11, 1, (220, 210, 190)); t.p(1, 7, (40, 34, 30)); t.p(9, 9, (40, 34, 30))

# 9 mail rings
t = t16('mail', 9)
for y in range(16):
    for x in range(16):
        on = ((x + (y // 2) % 2) % 2 == 0)
        t.p(x, y, (150, 152, 158) if on else (74, 74, 82))
    if y % 2 == 1:
        for x in range(16):
            if rng.random() < 0.3:
                t.p(x, y, (108, 108, 116))

# 10 watch bill: header, names, ticks
t = t16('bill', 10)
t.rect(0, 0, 16, 16, PAPER, 0.03)
t.rect(2, 1, 12, 2, (120, 40, 36))
for yy in range(5, 15, 2):
    t.rect(1, yy, rng.randint(4, 8), 1, shade(INK, 1.5))
    for k in range(rng.randint(1, 3)):
        t.p(11 + k * 2, yy, shade(INK, 1.5))
t.disc(13, 14, 1, (150, 38, 36))

# 11 roster grid
t = t16('roster', 11)
t.rect(0, 0, 16, 16, (214, 198, 158), 0.04)
for yy in range(2, 16, 3):
    t.line(1, yy, 14, yy, shade(INK, 2.0))
for xx in (5, 10):
    t.line(xx, 2, xx, 14, shade(INK, 2.0))
for yy in range(3, 14, 3):
    t.rect(2, yy + 1, 2, 1, INK)
    if rng.random() < 0.6:
        t.p(7, yy + 1, INK)
t.rect(1, 0, 14, 1, shade(INK, 1.6))

# 14 skep coils
t = t16('skep', 14)
for y in range(16):
    for x in range(16):
        c = (196, 166, 92) if y % 3 else (138, 108, 58)
        t.p(x, y, shade(c, 1 + rng.uniform(-0.07, 0.07)))
    if y % 3 == 0:
        for x in range((y // 3) % 4, 16, 4):
            t.p(x, y + 1 if y + 1 < 16 else y, (120, 94, 52))

# 15 log end
t = t16('log_end', 15)
t.rect(0, 0, 16, 16, (70, 54, 40))
for r, c in ((7.6, (74, 56, 40)), (6.5, (176, 142, 100)), (5, (156, 124, 86)), (3.5, (176, 142, 100)), (2, (150, 116, 80)), (0.8, (120, 90, 60))):
    t.disc(7.5, 7.5, r, c)
t.line(8, 8, 13, 3, (100, 76, 52))

# 16 sundial face
t = t16('dial', 16)
t.rect(0, 0, 16, 16, (170, 164, 170), 0.05)
t.disc(7.5, 7.5, 7, (178, 140, 64))
t.disc(7.5, 7.5, 5.5, (196, 160, 80))
import math as _m
for k in range(12):
    a = k / 12 * 2 * _m.pi
    t.p(round(7.5 + _m.cos(a) * 6.2), round(7.5 + _m.sin(a) * 6.2), (70, 52, 30))
t.disc(7.5, 7.5, 0.8, (90, 66, 36))

# 17 net, alpha
t = t16('net', 17)
for y in range(16):
    for x in range(16):
        on = ((x + y) % 4 == 0) or ((x - y) % 4 == 0)
        t.p(x, y, (150, 128, 92) if on else (0, 0, 0), 1.0 if on else 0.0)

# 18 fish in a crate
t = t16('fish', 18)
t.rect(0, 0, 16, 16, (84, 70, 58))
for row in range(4):
    y = row * 4 + 1
    off = 1 if row % 2 else 3
    for f in range(2):
        x = off + f * 7
        body = (160, 166, 168) if rng.random() < 0.6 else (130, 138, 132)
        t.rect(x, y, 5, 2, body)
        t.rect(x, y, 5, 1, shade(body, 1.15))
        t.p(x + 5, y, shade(body, 0.7)); t.p(x + 5, y + 1, shade(body, 0.7)); t.p(x + 6, y - 1, shade(body, 0.7)); t.p(x + 6, y + 2, shade(body, 0.7))
        t.p(x + 1, y, (30, 30, 34))

# 19 toll sign: coin over a river line
t = t16('toll', 19)
t.rect(0, 0, 16, 16, (70, 52, 40), 0.05)
t.rect(0, 0, 16, 1, CREAM); t.rect(0, 15, 16, 1, CREAM); t.rect(0, 0, 1, 16, CREAM); t.rect(15, 0, 1, 16, CREAM)
t.disc(7.5, 6.5, 4, (204, 166, 72))
t.disc(7.5, 6.5, 2.5, (224, 188, 96))
t.rect(7, 5, 1, 3, (140, 104, 44))
for x in range(2, 14):
    t.p(x, 12 + (1 if (x // 2) % 2 else 0), (96, 132, 160))

# 20 altar frontal
t = t16('frontal', 20)
t.rect(0, 0, 16, 16, CREAM, 0.03)
t.rect(0, 12, 16, 4, (128, 42, 40))
t.rect(0, 12, 16, 1, GOLD)
t.rect(7, 2, 2, 8, GOLD); t.rect(4, 4, 8, 2, GOLD)

# 21 linenfold carved panel
t = t16('linenfold', 21)
t.rect(0, 0, 16, 16, (92, 68, 48))
for x in range(2, 14):
    c = (130, 98, 68) if x % 3 == 0 else ((70, 52, 38) if x % 3 == 2 else (108, 80, 56))
    t.rect(x, 3, 1, 10, c)
t.rect(1, 1, 14, 1, (124, 94, 64)); t.rect(1, 14, 14, 1, (60, 44, 32))

# 22 coal bed
t = t16('coals', 22)
for y in range(16):
    for x in range(16):
        r = rng.random()
        c = (38, 32, 30) if r < 0.6 else ((62, 54, 50) if r < 0.82 else ((220, 96, 40) if r < 0.95 else (250, 190, 90)))
        t.p(x, y, c)

# ------------------------------------------------------------ 32 px tiles --
def heater_field(t, rgb):
    t.rect(0, 0, 32, 32, rgb, 0.035)
    # a darker edge so the shape reads at 5 m
    for i in range(32):
        t.p(i, 0, shade(rgb, 0.7)); t.p(0, i, shade(rgb, 0.7)); t.p(31, i, shade(rgb, 0.7))

# crest A: red, gold chevron, three roundels
t = t32('crest_a', 0)
heater_field(t, (146, 46, 42))
for d in range(-2, 2):
    t.line(0, 24 + d, 16, 10 + d, GOLD); t.line(31, 24 + d, 15, 10 + d, GOLD)
for cx, cy in ((7.5, 6.5), (24, 6.5), (15.5, 24)):
    t.disc(cx, cy, 2.6, GOLD)

# crest B: blue, cream tower
t = t32('crest_b', 1)
heater_field(t, (56, 72, 122))
t.rect(11, 11, 10, 15, CREAM, 0.03)
for mx in (10, 14, 18):
    t.rect(mx, 7, 3 if mx != 18 else 4, 4, CREAM, 0.03)
t.rect(14, 20, 4, 6, (40, 40, 50)); t.rect(15, 19, 2, 1, (40, 40, 50))
t.rect(15, 13, 2, 3, (40, 40, 50))
t.rect(11, 25, 10, 1, shade(CREAM, 0.8))

# crest C: green, gold key
t = t32('crest_c', 2)
heater_field(t, (62, 94, 58))
t.ring(15.5, 8.5, 2.6, 4.6, GOLD)
t.rect(15, 13, 2, 15, GOLD)
t.rect(17, 22, 4, 2, GOLD); t.rect(17, 25, 3, 2, GOLD)

# crest D: quarterly black and ochre, red rose at the centre
t = t32('crest_d', 3)
for y in range(32):
    for x in range(32):
        q = (x < 16) ^ (y < 16)
        c = (182, 142, 62) if q else (40, 36, 40)
        t.p(x, y, shade(c, 1 + rng.uniform(-0.03, 0.03)))
t.disc(15.5, 15.5, 3.4, (160, 44, 40)); t.disc(15.5, 15.5, 1.2, GOLD)

def border(t, outer, inner, w=2):
    t.rect(0, 0, 32, w, outer); t.rect(0, 32 - w, 32, w, outer)
    t.rect(0, 0, w, 32, outer); t.rect(32 - w, 0, w, 32, outer)
    for i in range(1, 31, 3):
        t.p(i, 1, inner); t.p(i, 30, inner); t.p(1, i, inner); t.p(30, i, inner)

def millefleur(t, cols, n):
    for _ in range(n):
        x, y = rng.randint(3, 28), rng.randint(3, 28)
        t.p(x, y, rng.choice(cols))

# tapestry 1: tree of life
t = t32('tapestry_tree', 4)
t.rect(0, 0, 32, 32, (46, 64, 48), 0.05)
millefleur(t, [(180, 150, 80), (150, 60, 50), (190, 180, 150)], 40)
t.rect(15, 15, 2, 13, (98, 70, 46))
t.line(16, 20, 11, 16, (98, 70, 46)); t.line(16, 18, 21, 14, (98, 70, 46))
t.disc(15.5, 11, 8, (70, 100, 58))
for _ in range(30):
    t.p(rng.randint(9, 23), rng.randint(4, 18), (54, 80, 46))
for _ in range(9):
    t.p(rng.randint(10, 21), rng.randint(6, 16), (170, 56, 44))
t.rect(3, 27, 26, 2, (64, 86, 52))
border(t, (126, 48, 42), GOLD)

# tapestry 2: gold lattice on blue
t = t32('tapestry_lattice', 5)
t.rect(0, 0, 32, 32, (40, 52, 94), 0.05)
for k in range(-32, 64, 7):
    t.line(k, 0, k + 32, 32, (176, 140, 66)); t.line(k, 32, k + 32, 0, (176, 140, 66))
for y in range(3, 30, 7):
    for x in range(3, 30, 7):
        t.p(x + 1, y + 2, (160, 50, 46))
border(t, (98, 36, 36), CREAM)

# tapestry 3: white stag on red
t = t32('tapestry_stag', 6)
t.rect(0, 0, 32, 32, (112, 40, 38), 0.05)
millefleur(t, [(80, 110, 60), (196, 180, 140), (182, 142, 62)], 45)
S = (214, 204, 180)
t.rect(9, 15, 12, 5, S)            # body
t.rect(18, 11, 3, 5, S)            # neck
t.rect(19, 9, 5, 3, S)             # head
t.rect(23, 10, 2, 1, S)            # muzzle
for lx in (10, 12, 17, 19):
    t.rect(lx, 20, 1, 6, S)
t.line(20, 9, 18, 4, S); t.line(19, 6, 16, 5, S); t.line(22, 9, 24, 4, S); t.line(23, 6, 26, 5, S)
t.p(8, 15, S)
t.rect(3, 26, 26, 2, (76, 96, 56))
border(t, (180, 142, 62), (112, 40, 38))

# stained glass
t = t32('stained_glass', 7)
panes = [(70, 100, 168), (160, 52, 52), (200, 150, 62), (72, 130, 82), (184, 192, 172)]
for y in range(32):
    for x in range(32):
        u, v = (x + y) // 5, (x - y + 40) // 5
        t.p(x, y, shade(panes[(u * 3 + v) % 5], 1 + rng.uniform(-0.05, 0.05)))
for y in range(32):
    for x in range(32):
        if (x + y) % 5 == 0 or (x - y + 40) % 5 == 0:
            t.p(x, y, LEAD)
t.disc(15.5, 12.5, 7.5, LEAD)
t.disc(15.5, 12.5, 6.4, (204, 156, 64))
t.disc(15.5, 12.5, 3.4, LEAD)
t.disc(15.5, 12.5, 2.4, (164, 50, 50))
for i in range(32):
    t.p(i, 0, LEAD); t.p(i, 31, LEAD); t.p(0, i, LEAD); t.p(31, i, LEAD)


def save(path):
    import bpy
    img = bpy.data.images.get('castle_props_atlas')
    if img is None:
        img = bpy.data.images.new('castle_props_atlas', SIZE, SIZE, alpha=True)
    flipped = IMG[::-1].copy()
    img.pixels.foreach_set(flipped.ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    return img


def uv_rect(r, inset=0.5):
    """Pixel rect (x, y, w, h, top-left origin) to UV bounds (u0, v0, u1, v1)."""
    x, y, w, h = r
    return ((x + inset) / SIZE, 1 - (y + h - inset) / SIZE, (x + w - inset) / SIZE, 1 - (y + inset) / SIZE)


def cell(name):
    if name in SW:
        return SW[name]
    if name in T16:
        return T16[name]
    if name in T32:
        return T32[name]
    raise KeyError(name)
