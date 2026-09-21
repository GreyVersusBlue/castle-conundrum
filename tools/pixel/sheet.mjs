#!/usr/bin/env node
// tools/pixel/sheet.mjs — the human half of the review (#742, open call 4).
//
//   node tools/pixel/sheet.mjs        (from the repo root)
//
// Every texture in tools/pixel/textures.json, tiled 3 x 3 and magnified 4x with
// NEAREST — which is what src/assets.js's `tuneTexture` does on the GPU — laid
// out in a grid and written to shots/pixel/sheet.png. `shots/` is gitignored
// like every other screenshot in this project, so this file is a look and not
// an artefact.
//
// 3 x 3 rather than 1 x 1 because the question a sheet answers is "does it
// tile", and one copy of a texture cannot show a seam. 4x and NEAREST because
// the question after that is "does it read as pixel art", and a browser's
// smooth scaling would answer it wrongly.
//
// IT ASSERTS NOTHING AND EXITS 0 ALWAYS. #13 says a check that only prints gets
// ignored; this is not a check. What is checked about these textures is in
// test/assets.mjs — size, palette, the seam, and pixel identity with the
// generator — and what is judged is the castle on a GPU (#53). This is the step
// between: somebody looks at fifteen textures at once before anybody spends a
// GPU sitting on them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { rows, render, SIZE } from './index.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');

const TILES = 3;   // copies per side, so eight seams are visible per texture
const ZOOM = 4;    // NEAREST, as tuneTexture magnifies
const PAD = 8;     // gutter between textures, in output pixels
const COLS = 5;

const cell = SIZE * TILES * ZOOM;
const table = rows();
const gridRows = Math.ceil(table.length / COLS);
const width = COLS * cell + (COLS + 1) * PAD;
const height = gridRows * cell + (gridRows + 1) * PAD;

const sheet = Buffer.alloc(width * height * 3, 0x20);

for (const [n, row] of table.entries()) {
  const data = render(row);
  const gx = (n % COLS) * cell + (n % COLS + 1) * PAD;
  const gy = Math.floor(n / COLS) * cell + (Math.floor(n / COLS) + 1) * PAD;
  for (let y = 0; y < cell; y++) {
    for (let x = 0; x < cell; x++) {
      const sx = Math.floor(x / ZOOM) % SIZE, sy = Math.floor(y / ZOOM) % SIZE;
      const from = (sy * SIZE + sx) * 4;
      const to = ((gy + y) * width + gx + x) * 3;
      sheet[to] = data[from];
      sheet[to + 1] = data[from + 1];
      sheet[to + 2] = data[from + 2];
    }
  }
}

const out = path.join(ROOT, 'shots/pixel/sheet.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp(sheet, { raw: { width, height, channels: 3 } }).png().toFile(out);
console.log(`shots/pixel/sheet.png  ${width} x ${height}, ${table.length} textures, ${TILES} x ${TILES} at ${ZOOM}x`);
console.log(table.map((r, i) => `  ${String(i + 1).padStart(2)} ${r.name} (${r.family})`).join('\n'));
