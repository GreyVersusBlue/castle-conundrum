#!/usr/bin/env node
// tools/pixel/index.mjs — the castle's stone, drawn by this repo (#742, #743).
//
//   node tools/pixel/index.mjs        (from the repo root)
//   npm run pixel:render
//
// WHAT THIS IS FOR. Until 2026-09-21 every built surface in the castle wore a
// Poly Haven photograph: fifteen 1k material sets, 44.2 MB of video memory, and
// 22 of the 46 wall runs wearing the same slate. Devon asked for pixel art and
// for variety room to room, which is #742. This draws it.
//
// PROVENANCE IS REPRODUCTION, NOT A DOWNLOAD (#743). Every byte under
// assets/pixel/ comes out of this program, and test/assets.mjs decodes each
// committed PNG and holds it pixel-identical to the row below that names it. A
// texture from an image-generation model fails that rail by construction, which
// is the point: there is no third party to credit and no licence story nobody
// can write down.
//
// IT TILES BY CONSTRUCTION, NOT BY INSPECTION. Every write goes through
// `Torus.set`, which takes both coordinates modulo 128, and every noise field
// is a lattice read with wrapping indices. Nothing here draws a feature and
// then blends a seam: a block that runs off the right edge is already drawn
// down the left one. test/assets.mjs asserts the result at both edges anyway,
// because "by construction" is what the two dead line-of-sight checks said too
// (#34).
//
// IT IS HAND-RUN AND COMMITTED, like tools/encode-assets.mjs (#506). `dist/` has
// no render step in it and the page never sees textures.json: a parameter table
// under data/ would be copied into the build whole for nothing (#688), so this
// lives under tools/.
//
// RE-RUNNING IS A NO-OP. A row whose PNG already decodes to the same pixels is
// not rewritten, so `npm run pixel:render` after an unrelated commit touches
// nothing and `git status` stays clean.
//
// WHAT IT NEEDS: sharp, which is already a devDependency (encode-assets.mjs
// uses it). No `ktx`, no network, no GPU.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');

/** The one size, and the reason it is this one: `tuneTexture` magnifies NEAREST
 *  at 128 px and under, which is how the Kenney kit already reads as pixel art,
 *  and 128 over the 3 m repeat (#434) is 43 texels a metre. test/assets.mjs
 *  holds every committed PNG to it so the exemption from the encoder (#508)
 *  cannot grow into a 1k PNG. */
export const SIZE = 128;

/** Where the output goes, repo-relative, and what data/scene-config.json's
 *  `pixelMaterials` rows have to name. */
export const OUT_DIR = 'assets/pixel';

export const TABLE = path.join(HERE, 'textures.json');

/* ------------------------------------------------------------- the dice ---
 * One stream per row, seeded off the row's `seed` string, so editing one row's
 * parameters cannot move another row's pixels. FNV-1a to a 32-bit seed and
 * mulberry32 out of it: eleven lines, no dependency, and the same numbers on
 * every Node on every platform, which is what "deterministic" has to mean for
 * a rail that compares against a committed file.
 */
function seedOf(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function dice(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (s) => {
  const m = /^#([0-9a-fA-F]{6})$/.exec(s);
  if (!m) throw new Error(`pixel: "${s}" is not a six-digit hex colour`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/* ------------------------------------------------------------ the canvas ---
 * An INDEX buffer, not an RGBA one. Every pixel is an index into the row's
 * palette, so the finished image cannot hold more colours than the row lists
 * however the drawing goes — the 32-colour rail in test/assets.mjs is then a
 * check on the table rather than on the arithmetic. Alpha is 255 everywhere: a
 * wall is not see-through and a hole in one should be a hole in the plan.
 */
class Torus {
  constructor(palette) {
    this.palette = palette.map(hex);
    this.idx = new Uint8Array(SIZE * SIZE);
  }

  /** The whole of "it tiles": both coordinates modulo 128, every write. */
  set(x, y, i) {
    const px = ((x % SIZE) + SIZE) % SIZE;
    const py = ((y % SIZE) + SIZE) % SIZE;
    const n = this.palette.length - 1;
    this.idx[py * SIZE + px] = i < 0 ? 0 : i > n ? n : Math.round(i);
  }

  get(x, y) {
    const px = ((x % SIZE) + SIZE) % SIZE;
    const py = ((y % SIZE) + SIZE) % SIZE;
    return this.idx[py * SIZE + px];
  }

  fill(i) { this.idx.fill(Math.max(0, Math.min(this.palette.length - 1, Math.round(i)))); }

  rgba() {
    const out = new Uint8Array(SIZE * SIZE * 4);
    for (let p = 0; p < this.idx.length; p++) {
      const [r, g, b] = this.palette[this.idx[p]];
      out[p * 4] = r; out[p * 4 + 1] = g; out[p * 4 + 2] = b; out[p * 4 + 3] = 255;
    }
    return out;
  }
}

/* --------------------------------------------------------------- noise ---
 * Value noise on the same torus: a lattice of `cellsX` by `cellsY` random
 * values, read with wrapping indices and smoothstepped between. Both counts
 * are free of each other, which is what draws grain: a plank wants 4 cells
 * across the board and 32 along it, and a stone wants the same in both.
 */
function valueNoise(rand, cellsX, cellsY) {
  const grid = new Float64Array(cellsX * cellsY);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const sx = SIZE / cellsX, sy = SIZE / cellsY;
  return (x, y) => {
    const fx = ((((x % SIZE) + SIZE) % SIZE)) / sx;
    const fy = ((((y % SIZE) + SIZE) % SIZE)) / sy;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const i0 = ((x0 % cellsX) + cellsX) % cellsX, i1 = (i0 + 1) % cellsX;
    const j0 = ((y0 % cellsY) + cellsY) % cellsY, j1 = (j0 + 1) % cellsY;
    const u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
    const top = grid[j0 * cellsX + i0] * (1 - u) + grid[j0 * cellsX + i1] * u;
    const bot = grid[j1 * cellsX + i0] * (1 - u) + grid[j1 * cellsX + i1] * u;
    return top * (1 - v) + bot * v;
  };
}

/** A run of lengths in [lo, hi] summing to exactly 128, so a course, a board
 *  or a run of setts closes on itself rather than being cut by the edge. */
function spans(rand, lo, hi) {
  const out = [];
  let sum = 0;
  while (sum < SIZE) {
    const w = lo + Math.floor(rand() * (hi - lo + 1));
    out.push(w);
    sum += w;
  }
  // The overshoot comes off the last span, and if that takes it under `lo` the
  // last two are merged. Either way the total is 128 and no span is stunted.
  out[out.length - 1] -= sum - SIZE;
  while (out.length > 1 && out[out.length - 1] < lo) {
    const short = out.pop();
    out[out.length - 1] += short;
  }
  return out;
}

/* ------------------------------------------------------ off the seam ---
 * THE TILE WRAPS WHEREVER ITS FEATURES ARE; THE RAIL THAT SAYS SO CANNOT SEE
 * THAT. test/assets.mjs compares the difference between column 127 and column 0
 * against 1.5 times the MEDIAN difference between adjacent interior columns, and
 * a mortar course drawn at y 0 makes that seam one of the loudest adjacencies in
 * the image while tiling perfectly: the copy below joins block bottom to mortar
 * exactly as rows 15 and 16 do inside the tile. Measured on the first render:
 * thirteen of the fifteen rows failed that way, `wood_floor_deck`'s rows at
 * 68.93 against a median of 1.41.
 *
 * So every family puts its hard edges somewhere other than the tile's own edge.
 * A course boundary is phased half a course down, a board gap half a board
 * across, a weave cell half a cell both ways, and a block or segment joint is
 * moved off the seam by `clearOffset` below. None of that changes what the
 * texture is — the drawing is on a torus either way — and it makes the seam a
 * place where the image is ordinary, which is what the rail can actually check.
 */

/** A start offset for a run of `widths` that puts no joint within `band` pixels
 *  of the tile's own edge. Deterministic: it takes one number off the row's own
 *  stream and then steps forward until the run is clear. */
function clearOffset(rand, widths, band) {
  const cuts = [];
  let at = 0;
  for (const w of widths) { cuts.push(at); at += w; }
  let off = Math.floor(rand() * SIZE);
  for (let tries = 0; tries < SIZE; tries++) {
    const clash = cuts.some((c) => {
      const p = (c + off) % SIZE;
      return p <= band || p >= SIZE - band;
    });
    if (!clash) return off;
    off = (off + 1) % SIZE;
  }
  return off; // no clear offset exists: the spans are shorter than the band
}

/* ================================================== the drawing families ===
 *
 * Five, and every one of them is a pure function of (row, rand, canvas). The
 * fifteen names in data/scene-config.json fall into them as: courses seven
 * (slate, the defense wall, brick, blocks, pavers, rock tile, floor tiles),
 * planks four (old planks, planks, the deck, the gate), ground two (the grassy
 * cobbles, the forest floor), plaster one, weave one.
 */

/** Coursed masonry: mortar everywhere, then a staggered run of blocks per
 *  course. The stagger is the course's own random start offset, so no two
 *  courses line their joints up and nothing has to be told not to. */
function courses(row, rand, img) {
  const noise = valueNoise(rand, row.cells[0], row.cells[1]);
  img.fill(row.mortarIndex ?? 0);
  const mortar = row.mortarPx ?? 1;
  // Half a course down, so rows 127 and 0 are the same block and not a joint.
  const phase = row.courseH / 2;
  for (let c = 0; c < SIZE / row.courseH; c++) {
    const y0 = c * row.courseH + phase;
    const widths = spans(rand, row.blockMin, row.blockMax);
    let x = clearOffset(rand, widths, mortar + 1);
    for (const w of widths) {
      const shade = row.shadeMin + rand() * (row.shadeMax - row.shadeMin);
      for (let dx = mortar; dx < w; dx++) {
        for (let dy = mortar; dy < row.courseH; dy++) {
          const n = noise(x + dx, y0 + dy) - 0.5;
          img.set(x + dx, y0 + dy, shade + n * 2 * row.grain);
        }
      }
      x += w;
    }
  }
}

/** Boards, with a gap between them and butt joints along their length. `dir`
 *  is the direction the boards run: 'x' for a floor read across the room, 'y'
 *  for a gate's vertical leaves. */
function planks(row, rand, img) {
  const along = row.dir === 'x';
  // Grain runs ALONG the board: few noise cells that way, many across it.
  const noise = along
    ? valueNoise(rand, row.cells[0], row.cells[1])
    : valueNoise(rand, row.cells[1], row.cells[0]);
  img.fill(row.gapIndex ?? 0);
  const gap = row.gapPx ?? 1;
  const put = (a, b, i) => (along ? img.set(a, b, i) : img.set(b, a, i));
  const phase = row.plankW / 2; // the gap between boards, off the tile's edge
  for (let p = 0; p < SIZE / row.plankW; p++) {
    const b0 = p * row.plankW + phase;
    const lengths = spans(rand, row.segMin, row.segMax);
    let a = clearOffset(rand, lengths, gap + 1);
    for (const len of lengths) {
      const shade = row.shadeMin + rand() * (row.shadeMax - row.shadeMin);
      for (let da = gap; da < len; da++) {
        for (let db = gap; db < row.plankW; db++) {
          const n = (along ? noise(a + da, b0 + db) : noise(b0 + db, a + da)) - 0.5;
          put(a + da, b0 + db, shade + n * 2 * row.grain);
        }
      }
      a += len;
    }
  }
}

/** Loose ground: two octaves of soil, then scattered stones. A stone is a disc
 *  drawn with a wrapping centre and a darker rim, which is the cheapest thing
 *  that reads as a sett from a metre up and as gravel from ten. */
function ground(row, rand, img) {
  const coarse = valueNoise(rand, row.cells[0], row.cells[0]);
  const fine = valueNoise(rand, row.cells[1], row.cells[1]);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = coarse(x, y) * 0.65 + fine(x, y) * 0.35;
      img.set(x, y, row.baseMin + n * (row.baseMax - row.baseMin));
    }
  }
  const stoneNoise = valueNoise(rand, row.cells[1], row.cells[1]);
  for (let s = 0; s < row.stones; s++) {
    const cx = Math.floor(rand() * SIZE), cy = Math.floor(rand() * SIZE);
    const r = row.rMin + rand() * (row.rMax - row.rMin);
    const shade = row.stoneMin + rand() * (row.stoneMax - row.stoneMin);
    const lim = Math.ceil(r) + 1;
    for (let dy = -lim; dy <= lim; dy++) {
      for (let dx = -lim; dx <= lim; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > r + 1) continue;
        const n = stoneNoise(cx + dx, cy + dy) - 0.5;
        // The rim is one index darker than the face, which is what stops a
        // field of discs reading as one grey blur at 43 texels a metre.
        img.set(cx + dx, cy + dy, d > r ? shade - 1 : shade + n * 2 * row.grain);
      }
    }
  }
}

/** Lime plaster: two octaves and nothing else, plus a few damp patches. The
 *  whole point of this one is that it has no feature to line up, so the palette
 *  is what tells it from the stone beside it. */
function plaster(row, rand, img) {
  const coarse = valueNoise(rand, row.cells[0], row.cells[0]);
  const fine = valueNoise(rand, row.cells[1], row.cells[1]);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = coarse(x, y) * 0.6 + fine(x, y) * 0.4;
      img.set(x, y, row.shadeMin + n * (row.shadeMax - row.shadeMin));
    }
  }
  const blot = valueNoise(rand, row.cells[0], row.cells[0]);
  for (let s = 0; s < row.stains; s++) {
    const cx = Math.floor(rand() * SIZE), cy = Math.floor(rand() * SIZE);
    const r = row.stainR;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        // A ragged edge rather than a circle: the disc's radius is modulated by
        // the same wrapping noise, so a stain that crosses the tile edge still
        // does. And it DARKENS what is under it by an amount that falls to zero
        // at that edge rather than replacing it: a hard-edged damp patch was
        // worth 49 of 255 across one pair of pixels, which is the whole of why
        // this row failed the seam rail at 2.50 against 2.31 on the first
        // render while tiling perfectly. A stain now steps like the noise does.
        const t = Math.hypot(dx, dy) / (r * (0.55 + blot(cx + dx, cy + dy) * 0.45));
        if (t >= 1) continue;
        img.set(cx + dx, cy + dy, img.get(cx + dx, cy + dy) - (1 - t) * row.stainDepth);
      }
    }
  }
}

/** Basket weave: a checker of strands, horizontal where (i + j) is even and
 *  vertical where it is odd, each shaded light down its middle and dark at its
 *  edges. 128 over an even cell count closes on itself in both directions. */
function weave(row, rand, img) {
  const dirt = valueNoise(rand, row.cells[0], row.cells[1]);
  const cells = SIZE / row.cell;
  const half = (row.cell - 1) / 2;
  const phase = row.cell / 2; // both ways: the seam runs down a strand, not between two
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      const horiz = (i + j) % 2 === 0;
      for (let dy = 0; dy < row.cell; dy++) {
        for (let dx = 0; dx < row.cell; dx++) {
          const x = i * row.cell + dx + phase, y = j * row.cell + dy + phase;
          const across = horiz ? dy : dx;
          const t = Math.abs(across - half) / half; // 0 down the middle, 1 at the edge
          const n = dirt(x, y) - 0.5;
          img.set(x, y, row.shadeMax - t * (row.shadeMax - row.shadeMin) + n * 2 * row.grain);
        }
      }
    }
  }
}

const FAMILIES = { courses, planks, ground, plaster, weave };

/** One row to 128 x 128 RGBA. Pure: same row in, same bytes out, on any Node. */
export function render(row) {
  const draw = FAMILIES[row.family];
  if (!draw) throw new Error(`pixel: row "${row.name}" names family "${row.family}", which is none of ${Object.keys(FAMILIES).join(', ')}`);
  if (!Array.isArray(row.palette) || row.palette.length < 2)
    throw new Error(`pixel: row "${row.name}" has no palette`);
  const img = new Torus(row.palette);
  draw(row, dice(seedOf(row.seed)), img);
  return img.rgba();
}

/** The table, parsed. Exported because test/assets.mjs reads the same rows. */
export function rows() {
  return JSON.parse(fs.readFileSync(TABLE, 'utf8')).rows;
}

/** Where a row's PNG lives, repo-relative and POSIX, which is what the config
 *  names and what test/assets.mjs compares against. */
export const fileOf = (row) => `${OUT_DIR}/${row.name}.png`;

/* ------------------------------------------------------------ the writer --- */

async function main() {
  const sharp = (await import('sharp')).default;
  const dir = path.join(ROOT, OUT_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const table = rows();
  let wrote = 0, same = 0;
  for (const row of table) {
    const data = render(row);
    const out = path.join(ROOT, fileOf(row));
    let unchanged = false;
    if (fs.existsSync(out)) {
      const old = await sharp(out).ensureAlpha().raw().toBuffer();
      unchanged = old.length === data.length && old.every((v, i) => v === data[i]);
    }
    if (unchanged) { same++; console.log(`  same  ${fileOf(row)}`); continue; }
    await sharp(Buffer.from(data), { raw: { width: SIZE, height: SIZE, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    wrote++;
    const colours = new Set();
    for (let p = 0; p < data.length; p += 4) colours.add(data.subarray(p, p + 3).join(','));
    console.log(`  wrote ${fileOf(row)}  ${row.family}  ${colours.size} colours  ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
  }
  console.log(`\n${table.length} rows: ${wrote} written, ${same} already identical.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
