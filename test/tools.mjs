// tools.mjs — tools/place.mjs, the text half of the placement editor
// (BACKLOG.md rank 13).
//
//   node test/tools.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHY THIS IS A SUITE AND NOT ONLY A HAND-TEST. `SPECS.md` asked for the editor
// to be proved by walking the dev server and looking, and that proof is in the
// PR. It is not enough on its own: the part of this tool that can quietly
// destroy something is the write, and the write is a pure string-to-string
// function over a 2546-line file that ten other suites read. So the splice is
// checked here, against the real data/scene-config.json, on the one property
// that matters — every byte that was not the new row is the byte it was.
//
// AND IT RUNS OVER BOTH LINE ENDINGS, on every machine, rather than over
// whatever this checkout happens to hold. `data/scene-config.json` comes out of
// git CRLF on Windows and LF on Linux — `core.autocrlf` is `true` on the dev
// machine and the file carries 2546 line endings either way — so a rail that
// reads only what is on disk is two different rails on the two machines. It was
// one: the writer spliced `\n` into a CRLF file and the cut below looked for
// `,\n`, so every row of part 1 failed on Windows and passed in CI for as long
// as the rail had existed (#618, fixed in #624). Both endings are built here out
// of what is on disk and both are asserted, so neither machine can be the only
// one that runs the half that breaks.
//
// Three parts:
//   1. the splice: it parses, it adds exactly one element, and cutting the new
//      row back out gives back the original file byte for byte
//   2. the shape rules: every rule in `checkRow` is broken on purpose once
//   3. the formatting: a written row reads like the rows already in the file

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { insertRow, formatRow, checkRow, eolOf, PLACEABLE } from '../tools/place.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const raw = fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8');
// The same file with each ending, whichever one git handed this machine. `raw`
// is one of these two and the suite never has to know which.
const LF = raw.replace(/\r\n/g, '\n');
const ENDINGS = [['LF', LF], ['CRLF', LF.replace(/\n/g, '\r\n')]];

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
/** How many line endings in `text` are not `eol`. Zero is the only acceptable answer for a spliced file. */
const strayEndings = (text, eol) =>
  (text.match(eol === '\r\n' ? /(?<!\r)\n/g : /\r/g) || []).length;

/* ------------------------------------------------------- 1: the splice --- */
console.log('the splice, against the real scene-config.json');
{
  const rows = {
    interiorProps: { model: 'wooden_stool_02_1k.gltf/wooden_stool_02_1k.gltf', tile: [-5.1, -4.1], rotationY: 45, comment: 'a test row' },
    builtProps: { id: 'a-test-slab', material: 'oak', tile: [1.5, -2.25], base: 0.6, size: [0.4, 0.3, 0.4], comment: 'a test row' },
    braziers: { tile: [0.25, 0.5], base: 0, comment: 'a test row' },
  };
  const before = JSON.parse(raw);
  for (const [ending, source] of ENDINGS) {
    // What the writer is told the file's ending is has to be what the file's
    // ending is, or every assertion under this line is measuring the wrong
    // thing while agreeing with itself.
    check(eolOf(source) === (ending === 'CRLF' ? '\r\n' : '\n'), `${ending}: eolOf reads this copy as ${ending}`, JSON.stringify(eolOf(source)));
    const eol = eolOf(source);

    for (const [key, row] of Object.entries(rows)) {
      const out = insertRow(source, key, row);
      let after = null;
      try { after = JSON.parse(out); } catch (e) { fail(`${ending} ${key}: the spliced file does not parse — ${e.message}`); continue; }
      check(after[key].length === before[key].length + 1, `${ending} ${key}: exactly one more element (${before[key].length} -> ${after[key].length})`);
      check(JSON.stringify(after[key].at(-1)) === JSON.stringify(row), `${ending} ${key}: and it is the row that was asked for`, JSON.stringify(after[key].at(-1)));
      for (const other of Object.keys(before)) {
        if (other === key) continue;
        if (JSON.stringify(before[other]) !== JSON.stringify(after[other])) fail(`${ending} ${key}: writing it changed \`${other}\``);
      }
      // Not one stray ending of the other kind anywhere in the file, which is
      // the failure a writer that splices `\n` into a CRLF file actually
      // commits. The byte diff below catches it too, and this says what it is.
      check(strayEndings(out, eol) === 0, `${ending} ${key}: and the file is still ${ending} throughout`,
        `${strayEndings(out, eol)} line ending(s) of the other kind`);

      /* THE ASSERTION THIS FILE EXISTS FOR. Cut the inserted text back out and
       * what is left has to be the original file, byte for byte. A re-serialising
       * writer fails this line by four kilobytes: scene-config.json's
       * `"intensity": 2.0` comes back from JSON.stringify as `2`, and the file
       * goes from 94212 bytes to 98330. That churn would land in the diff a
       * person reads before committing a placement, which is the whole product.
       *
       * The cut is the splice run backwards and so it is written in the file's
       * own ending at every step: the row's own newlines are `eol`, the comma
       * the writer hung off the previous element is followed by `eol`, and the
       * `eol` between the row and the closing bracket's indent is `eol.length`
       * bytes and not one. All three were `\n` and the middle one was `1`, and
       * on a CRLF checkout that is a file one byte short (#624). */
      const text = formatRow(row, 4, eol);
      const at = out.indexOf(text);
      check(at !== -1, `${ending} ${key}: the row is in the file as formatRow wrote it`);
      if (at !== -1) {
        const head = out.slice(0, at);
        check(head.endsWith(`,${eol}`), `${ending} ${key}: the previous element got the comma it needed`, JSON.stringify(head.slice(-4)));
        const cut = `${head.slice(0, -(eol.length + 1))}${eol}${out.slice(at + text.length + eol.length)}`;
        check(cut === source, `${ending} ${key}: and every other byte is the byte it was`,
          cut === source ? '' : `${source.length} bytes in, ${cut.length} back out`);
      }
    }

    // Twice in a row, because the second splice has to find the bracket past the
    // first one's text rather than the one it remembered.
    const twice = insertRow(insertRow(source, 'braziers', rows.braziers), 'braziers', rows.braziers);
    check(JSON.parse(twice).braziers.length === before.braziers.length + 2, `${ending}: two placements in a row both land`);

    // An empty array has no trailing comma to write after. `JSON.stringify`
    // only ever writes `\n`, so this copy is put into the ending under test the
    // same way the real file's is.
    const emptied = JSON.stringify({ ...before, braziers: [] }, null, 2).replace(/\n/g, eol);
    const filled = insertRow(emptied, 'braziers', rows.braziers);
    check(JSON.parse(filled).braziers.length === 1, `${ending}: an empty array takes its first element without a stray comma`);
    check(strayEndings(filled, eol) === 0, `${ending}: and the empty array's first element is written in the file's ending too`,
      `${strayEndings(filled, eol)} line ending(s) of the other kind`);
  }

  // A key that is not there, and a key that is not an array, are errors and not
  // silent no-ops: a misspelled array would otherwise write nothing and report
  // success, which is a check that only prints (#13).
  check(/no top-level "nope"/.test(threw(() => insertRow(raw, 'nope', rows.braziers)) || ''), 'a key the file does not have throws');
  check(/not an array/.test(threw(() => insertRow(raw, 'storey', rows.braziers)) || ''), 'a key that is not an array throws');
  // `comment` is a key inside dozens of nested objects and a word inside dozens
  // of strings; only the top-level one counts, and there is none.
  check(/no top-level "comment"|not an array/.test(threw(() => insertRow(raw, 'comment', rows.braziers)) || ''),
    'a key that only ever appears nested is not matched inside a nested object');
}

/* --------------------------------------------------- 2: the shape rules --- */
console.log('the shape rules');
{
  const ok = { model: 'x.gltf', tile: [0, 0] };
  check(checkRow('interiorProps', ok) === ok, 'a good interiorProps row passes');
  check(!!checkRow('builtProps', { id: 'a', material: 'oak', tile: [0, 0] }), 'a good builtProps row passes');
  const rejects = [
    ['an array that is not placeable', () => checkRow('rooms', ok), /is not a placeable array/],
    ['a row that is not an object', () => checkRow('interiorProps', [1, 2]), /must be an object/],
    ['a key the array does not carry', () => checkRow('interiorProps', { ...ok, colour: 'red' }), /carry no colour/],
    ['no tile at all', () => checkRow('interiorProps', { model: 'x.gltf' }), /`tile` must be two finite numbers/],
    ['a tile of one number', () => checkRow('interiorProps', { ...ok, tile: [1] }), /two finite numbers/],
    ['a tile of NaN', () => checkRow('interiorProps', { ...ok, tile: [1, NaN] }), /two finite numbers/],
    ['a base that is not a number', () => checkRow('builtProps', { id: 'a', material: 'oak', tile: [0, 0], base: 'low' }), /`base` must be a number/],
    ['a base on a brazier, which reads none', () => checkRow('braziers', { tile: [0, 0], base: 0 }), /braziers rows carry no base/],
    ['an interiorProps row with no model', () => checkRow('interiorProps', { tile: [0, 0] }), /needs a `model`/],
    ['a builtProps row with no id', () => checkRow('builtProps', { material: 'oak', tile: [0, 0] }), /needs an `id` and a `material`/],
    ['a builtProps row with no material', () => checkRow('builtProps', { id: 'a', tile: [0, 0] }), /needs an `id` and a `material`/],
  ];
  for (const [label, fn, re] of rejects) {
    const msg = threw(fn);
    check(msg !== null && re.test(msg), `checkRow rejects ${label}`, msg === null ? 'it passed' : `said: ${msg}`);
  }
  // Every placeable array is one the file actually has, or the panel offers a
  // destination the writer would throw on.
  const config = JSON.parse(raw);
  for (const key of Object.keys(PLACEABLE)) check(Array.isArray(config[key]), `${key} is an array in scene-config.json`);
  // And every key a placeable row may carry is one the existing rows use, so
  // the allow-list cannot drift into inventing a field the builder ignores.
  for (const [key, allowed] of Object.entries(PLACEABLE)) {
    const used = new Set(config[key].flatMap((r) => Object.keys(r)));
    const invented = allowed.filter((k) => !used.has(k));
    check(invented.length === 0, `every key ${key} rows may carry is one the builder already reads`, invented.join(', '));
  }
}

/* ---------------------------------------------------- 3: the formatting --- */
console.log('the formatting');
{
  const lines = [
    '    {',
    '      "model": "x.gltf",',
    '      "tile": [',
    '        -5.1,',
    '        -4.1',
    '      ],',
    '      "rotationY": 45',
    '    }',
  ];
  const row = { model: 'x.gltf', tile: [-5.1, -4.1], rotationY: 45 };
  const text = formatRow(row, 4);
  check(text === lines.join('\n'), 'a row is written in the file’s own style: two-space nesting, one number per line', JSON.stringify(text));
  // Same eight lines, joined with the ending it was asked for. Every newline in
  // a row is one `formatRow` wrote, including the ones inside a `tile`, so the
  // `\n` default cannot be the only one that is checked (#624).
  const crlf = formatRow(row, 4, '\r\n');
  check(crlf === lines.join('\r\n'), 'and in CRLF when the file it is going into is CRLF', JSON.stringify(crlf));
  check(strayEndings(crlf, '\r\n') === 0, 'with no bare LF left inside the tile it broke over three lines',
    `${strayEndings(crlf, '\r\n')} bare LF`);
  check(!/undefined/.test(formatRow({ tile: [0, 0], base: undefined })), 'a key with no value is left out rather than written as undefined');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
