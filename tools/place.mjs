// place.mjs — the text half of the placement editor (BACKLOG.md rank 13).
//
// The editor's job is to write a prop's tile coordinates into
// data/scene-config.json instead of a session hand-typing them, which is how
// every prop in the castle got there so far and why there are so few. The
// question that shapes this file is how to write into a 2546-line
// hand-maintained JSON file without destroying it.
//
// IT IS A TEXT SPLICE AND NOT A RE-SERIALISE, and that is measured rather than
// preferred. `JSON.stringify(JSON.parse(raw), null, 2)` over scene-config.json
// is not byte-identical to the file: the lighting block's `"intensity": 2.0`
// comes back as `2`, and 94212 bytes go out as 98330. A round-trip write would
// put four kilobytes of unrelated churn into every placement's diff, and the
// diff is the thing a person reviews before committing. So `insertRow` finds
// the array, finds its closing bracket, and inserts one element before it.
// Every other byte in the file is left exactly as it was, which
// `test/tools.mjs` asserts by diffing the whole file against the original with
// the new row cut back out.
//
// IT WRITES THE FILE'S OWN LINE ENDING and not the one this file was typed
// with. data/scene-config.json is checked out CRLF on Windows and LF on Linux —
// `core.autocrlf` is `true` on the dev machine and the file carries 2546 line
// endings either way — so every newline below comes from `eolOf(source)`. A
// hardcoded `\n` spliced into a CRLF file rewrites the one existing line ending
// the splice has to put back, which is byte-exactness failing by exactly one
// byte on the machine CLAUDE.md calls the dev machine (#618, #624).
//
// Nothing here writes to disk and nothing here knows about Vite: this is a
// string in and a string out, so the suite can drive it without a dev server.

/** Where the value of a top-level `"key":` begins, or -1. Strings are skipped so a key inside a comment string is not found. */
function topLevelKey(source, key) {
  const needle = `"${key}"`;
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      // A key at depth 1 is a top-level key of the root object.
      if (depth === 1 && source.startsWith(needle, i)) {
        const after = source.indexOf(':', i + needle.length);
        if (after !== -1 && !source.slice(i + needle.length, after).trim()) return after + 1;
      }
      inStr = true;
      continue;
    }
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
  }
  return -1;
}

/** The index of the `]` that closes the array starting at `open`. Throws if the source is not an array there. */
function closingBracket(source, open) {
  if (source[open] !== '[') throw new Error(`place: expected an array at ${open}, found ${JSON.stringify(source[open])}`);
  let depth = 0, inStr = false, esc = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('place: the array is never closed');
}

/**
 * The line ending `source` is written with, taken off its first line. Every
 * newline this module writes comes from here, so a splice into a CRLF file
 * leaves a CRLF file and a splice into an LF file leaves an LF one. The bytes
 * that make this load-bearing rather than tidy are the ones `insertRow` has to
 * restore: it strips the ending and indent before the closing bracket to hang a
 * comma off the last element, and putting back `\n` where the file had `\r\n`
 * is a one-byte change outside the new row (#624).
 */
export function eolOf(source) {
  const i = source.indexOf('\n');
  return i > 0 && source[i - 1] === '\r' ? '\r\n' : '\n';
}

/**
 * One row, rendered at `indent` spaces in the file's own style: two-space
 * nesting, numbers as they were given, and an array of numbers broken one per
 * line the way every `tile` and `size` in the file already is.
 *
 * `eol` defaults to `\n` rather than reading it off anything, because a row on
 * its own has no file to read it off. `insertRow` is the caller that has one
 * and it always passes it.
 */
export function formatRow(row, indent = 4, eol = '\n') {
  const pad = ' '.repeat(indent);
  const inner = ' '.repeat(indent + 2);
  const blocks = [];
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      const items = v.map((x) => `${inner}  ${JSON.stringify(x)}`).join(`,${eol}`);
      blocks.push(`${inner}${JSON.stringify(k)}: [${eol}${items}${eol}${inner}]`);
    } else {
      blocks.push(`${inner}${JSON.stringify(k)}: ${JSON.stringify(v)}`);
    }
  }
  return `${pad}{${eol}${blocks.join(`,${eol}`)}${eol}${pad}}`;
}

/**
 * `source` with one more element at the end of its top-level `key` array.
 * Returns the new text; throws rather than returning the input unchanged, so a
 * misspelled key is a 500 from the dev server and never a silent no-op (#13).
 */
export function insertRow(source, key, row) {
  const at = topLevelKey(source, key);
  if (at === -1) throw new Error(`place: scene-config.json has no top-level "${key}"`);
  const open = source.indexOf('[', at);
  if (open === -1 || source.slice(at, open).trim()) throw new Error(`place: "${key}" is not an array`);
  const close = closingBracket(source, open);
  const empty = !source.slice(open + 1, close).trim();
  /* The array's own indent, which an element sits two spaces inside of. It
   * comes off the line the CLOSING bracket is on, except when the array is
   * empty and both brackets are on the key's own line — `"braziers": []` —
   * where that slice is the whole key line and using it wrote the key a second
   * time inside its own array. */
  const anchor = empty ? open : close;
  const lineStart = source.lastIndexOf('\n', anchor) + 1;
  const pad = /^[ \t]*/.exec(source.slice(lineStart))[0];
  const eol = eolOf(source);
  const text = formatRow(row, pad.length + 2, eol);
  /* A non-empty array's last element needs the comma the file never gave it.
   * `\s*$` eats the line ending and the closing bracket's indent along with it,
   * and the `${eol}${text}${eol}${pad}` below is what puts them back — which is
   * the whole reason `eol` has to be the file's and not this file's. */
  const head = empty ? source.slice(0, open + 1) : source.slice(0, close).replace(/\s*$/, ',');
  return `${head}${eol}${text}${eol}${pad}${source.slice(close)}`;
}

/** The arrays a placement may be written into, and the keys each row may carry. */
export const PLACEABLE = {
  interiorProps: ['model', 'tile', 'rotationY', 'yOffset', 'noCollide', 'id', 'evidence', 'comment'],
  builtProps: ['id', 'evidence', 'read', 'material', 'tile', 'base', 'size', 'comment'],
  // A brazier carries a tile and nothing else: main.js hands `b.tile` to
  // `createBrazier` through `tileToWorld`, so the stand always stands on the
  // ground and a `base` written beside it would be read by nobody. It was in
  // this list for an hour and test/tools.mjs's own rail caught it (#34).
  braziers: ['tile', 'comment'],
};

/**
 * A row off the wire, checked. Unknown keys are refused rather than dropped:
 * a typo that silently vanished would be written into the file as a prop with
 * no model and found by a suite two rows later.
 */
export function checkRow(key, row) {
  const allowed = PLACEABLE[key];
  if (!allowed) throw new Error(`place: ${JSON.stringify(key)} is not a placeable array (${Object.keys(PLACEABLE).join(', ')})`);
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('place: the row must be an object');
  const extra = Object.keys(row).filter((k) => !allowed.includes(k));
  if (extra.length) throw new Error(`place: ${key} rows carry no ${extra.join(', ')} (allowed: ${allowed.join(', ')})`);
  const tile = row.tile;
  if (!Array.isArray(tile) || tile.length !== 2 || !tile.every((n) => Number.isFinite(n))) throw new Error('place: `tile` must be two finite numbers');
  if ('base' in row && !Number.isFinite(row.base)) throw new Error('place: `base` must be a number');
  if (key === 'interiorProps' && typeof row.model !== 'string') throw new Error('place: an interiorProps row needs a `model`');
  if (key === 'builtProps' && (typeof row.id !== 'string' || typeof row.material !== 'string')) throw new Error('place: a builtProps row needs an `id` and a `material`');
  return row;
}
