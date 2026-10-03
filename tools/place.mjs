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
// IT READS THE FILE AS WELL AS APPENDING TO IT NOW. `insertRow` was the whole
// module for as long as the editor could only add, and correcting a placement
// meant hand-editing the file the tool exists to stop anyone hand-editing.
// `rowSpans` finds the [start, end) of every element of a top-level array by
// walking the text, and `replaceRow` and `deleteRow` are the two edits that
// span makes possible. Both are the same promise as `insertRow`: every byte
// outside the row they touch is the byte it was.
//
// THE SPAN IS WALKED AND NOT SEARCHED FOR. `source.indexOf(formatRow(row))`
// would look right and would be wrong twice over: two identical rows (the file
// has three braziers and nothing distinguishes two of them but a tile) resolve
// to the first, and a row whose text in the file is not what `formatRow` would
// write resolves to nothing at all. `test/tools.mjs` inserts the same brazier
// twice and edits the first of the pair for exactly that reason.
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

/** The `[` and `]` of the top-level `key` array. Throws rather than returning nothing, so a misspelled key is a 500 and never a silent no-op (#13). */
function arrayOf(source, key) {
  const at = topLevelKey(source, key);
  if (at === -1) throw new Error(`place: scene-config.json has no top-level "${key}"`);
  const open = source.indexOf('[', at);
  if (open === -1 || source.slice(at, open).trim()) throw new Error(`place: "${key}" is not an array`);
  return { open, close: closingBracket(source, open) };
}

/**
 * The `{ start, end }` byte span of every element of the top-level `key`
 * array, in order — `start` at the element's first character and `end` one
 * past its last, so `source.slice(start, end)` is that element's text and
 * nothing else: not the comma after it, not the indent before it.
 *
 * It is the same string walk `closingBracket` does, one level in, so the index
 * it hands back is the index `JSON.parse` would give the same element. The
 * suite holds it to that: for all 31 placeable rows in the real file it parses
 * each span's text and compares it with `JSON.parse(file)[key][i]`, because a
 * span finder checked against a second span finder is a check agreeing with
 * itself (#34, #500).
 */
export function rowSpans(source, key) {
  const { open, close } = arrayOf(source, key);
  const spans = [];
  let depth = 0, inStr = false, esc = false, start = -1, last = -1;
  const endScalar = (i) => { if (start !== -1 && depth === 0) { spans.push({ start, end: last + 1 }); start = -1; } };
  for (let i = open + 1; i < close; i++) {
    const ch = source[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      last = i;
      continue;
    }
    if (depth === 0 && ch === ',') { endScalar(i); continue; }
    if (/\s/.test(ch)) continue;
    if (start === -1) start = i;
    last = i;
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      // Only a bracket that closes the element itself ends it. A `}` inside a
      // nested object is depth 1 going to 0 only for the outermost one.
      if (depth === 0) { spans.push({ start, end: i + 1 }); start = -1; }
    }
  }
  endScalar(close);
  return spans;
}

/** `spans[index]`, or a throw naming both numbers. An index off the end is the failure a stale panel commits, and it must not write anything. */
function spanAt(spans, key, index) {
  if (!Number.isInteger(index) || index < 0 || index >= spans.length)
    throw new Error(`place: "${key}" has ${spans.length} row(s), so there is no row ${index}`);
  return spans[index];
}

/** The column `start` sits at, which is the indent `formatRow` has to write the replacement at. */
function columnOf(source, start) {
  return start - (source.lastIndexOf('\n', start) + 1);
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
 * NESTED VALUES ARE WRITTEN THE WAY THE FILE ALREADY WRITES THEM, which is
 * every level broken over its own lines at two more spaces. Three arrays were
 * placeable for as long as this was flat, and none of their rows carries more
 * than an array of numbers. `walls` and `rooms` carry two shapes they do not:
 * a room's `tiles: { min, max }`, an object of two arrays, and a run's
 * `doorways`, an array of objects. Written on one line, every move of a run
 * would rewrite its `doorways` block into a shape no other row in the file
 * has, which is #584's churn spreading past the field that was edited. Written
 * this way, rewriting any `walls` or `rooms` row in the file with its own
 * value is a no-op, and test/tools.mjs holds every one of them to that.
 *
 * Every newline at every depth is `eol`. A nested level is a new place for a
 * hardcoded `\n` to hide, and on a CRLF file that is a byte short per nested
 * line (#631, #632).
 *
 * `eol` defaults to `\n` rather than reading it off anything, because a row on
 * its own has no file to read it off. `insertRow` is the caller that has one
 * and it always passes it.
 */
export function formatRow(row, indent = 4, eol = '\n') {
  return `${' '.repeat(indent)}${formatValue(row, indent, eol)}`;
}

/** One value whose first character sits at column `indent`, in the style `formatRow` describes. Keys holding `undefined` are left out, as `JSON.stringify` leaves them out. */
function formatValue(v, indent, eol) {
  const pad = ' '.repeat(indent);
  const inner = ' '.repeat(indent + 2);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const items = v.map((x) => `${inner}${formatValue(x, indent + 2, eol)}`);
    return `[${eol}${items.join(`,${eol}`)}${eol}${pad}]`;
  }
  if (v && typeof v === 'object') {
    const blocks = Object.entries(v)
      .filter(([, x]) => x !== undefined)
      .map(([k, x]) => `${inner}${JSON.stringify(k)}: ${formatValue(x, indent + 2, eol)}`);
    if (!blocks.length) return '{}';
    return `{${eol}${blocks.join(`,${eol}`)}${eol}${pad}}`;
  }
  return JSON.stringify(v);
}

/**
 * `source` with one more element at the end of its top-level `key` array.
 * Returns the new text; throws rather than returning the input unchanged, so a
 * misspelled key is a 500 from the dev server and never a silent no-op (#13).
 */
export function insertRow(source, key, row) {
  const { open, close } = arrayOf(source, key);
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

/**
 * `source` with element `index` of its top-level `key` array rewritten as
 * `row`, and nothing else touched at all. This is the move: the panel hands
 * back the row it read with a new `tile`, and the span it goes into is the one
 * `rowSpans` walked to rather than one a text search guessed at.
 *
 * The replacement is written at the column the old row started at, so a row
 * two spaces inside its array stays two spaces inside it. `formatRow` writes
 * its own leading indent and the span does not include one, which is why the
 * first `indent` characters come back off.
 *
 * What it does NOT promise is that rewriting a row with its own parsed value
 * is a no-op: a row the file spells `2.0` comes back from `JSON.stringify` as
 * `2`, which is #584's churn confined to the one row being edited. Every byte
 * outside the span is still the byte it was, and that is the rail.
 */
export function replaceRow(source, key, index, row) {
  const span = spanAt(rowSpans(source, key), key, index);
  const indent = columnOf(source, span.start);
  const text = formatRow(row, indent, eolOf(source)).slice(indent);
  return `${source.slice(0, span.start)}${text}${source.slice(span.end)}`;
}

/**
 * `source` with element `index` of its top-level `key` array gone, along with
 * the one comma and one line ending that held it in place.
 *
 * WHICH SIDE THE COMMA COMES OFF IS THE WHOLE PROBLEM, and there are three
 * cases rather than one. A row with something before it takes the separator on
 * its left — cut from the end of the previous element — which is exactly
 * `insertRow` run backwards, and is why the suite can assert that inserting a
 * row and deleting it again gives back the file byte for byte. The first of
 * several takes the separator on its right, and the last one standing leaves
 * `[]`, which is the empty form `insertRow` already knows how to fill.
 */
export function deleteRow(source, key, index) {
  const { open, close } = arrayOf(source, key);
  const spans = rowSpans(source, key);
  const span = spanAt(spans, key, index);
  if (spans.length === 1) return `${source.slice(0, open + 1)}${source.slice(close)}`;
  if (index > 0) return `${source.slice(0, spans[index - 1].end)}${source.slice(span.end)}`;
  return `${source.slice(0, span.start)}${source.slice(spans[1].start)}`;
}

/**
 * A row's `comment` with the editor's own last sentence replaced by `note`
 * rather than another one stacked on top of it.
 *
 * The editor writes where it put a thing into the comment, because no
 * placeable array has a `room` key and a second answer beside the builder's
 * would be a second answer to drift (#583). A move makes that sentence a lie,
 * and appending the correction after it leaves both. Whatever a person wrote
 * is kept; only the editor's own trailing sentence is overwritten.
 */
export function noteComment(comment, note) {
  // To the end of the line and not to the first `.`: the sentence it is
  // cutting ends `at 0.60 m.` and a `[^.]*` stops dead at the decimal point,
  // which leaves half the old note in front of the new one.
  const kept = String(comment ?? '').replace(/\s*(?:Placed|Moved) with \?edit=1 [^\n]*$/, '').trim();
  return kept ? `${kept.replace(/\.?$/, '.')} ${note}` : note;
}

/**
 * The arrays a placement may be written into, and the keys each row may carry.
 *
 * `walls` and `rooms` are the floor plan (SPECS.md "The floor plan you can
 * see", increment 2): the plan sheet in src/edit-layout.js drags a room's
 * rectangle or a run's end and posts the row's whole record back through the
 * same `move` the prop editor uses. Their lists are every key the rows in the
 * file already carry and nothing else, which test/tools.mjs holds both ways.
 * `drums` and `gates` are not here and are not meant to be yet (SPECS.md, open
 * call 7).
 */
export const PLACEABLE = {
  interiorProps: ['model', 'tile', 'rotationY', 'yOffset', 'base', 'noCollide', 'id', 'evidence', 'comment'],
  builtProps: ['id', 'evidence', 'read', 'material', 'tile', 'base', 'size', 'comment'],
  // A brazier carries a tile and nothing else: main.js hands `b.tile` to
  // `createBrazier` through `tileToWorld`, so the stand always stands on the
  // ground and a `base` written beside it would be read by nobody. It was in
  // this list for an hour and test/tools.mjs's own rail caught it (#34).
  braziers: ['tile', 'comment'],
  walls: ['id', 'from', 'to', 'material', 'height', 'thickness', 'level', 'curtain', 'axis', 'base', 'walk',
    'repeatMetres', 'interior', 'doorways', 'comment', 'doorwaysComment', 'heightComment', 'materialComment'],
  rooms: ['id', 'level', 'ward', 'name', 'tiles', 'drum', 'bounds', 'floor', 'tint', 'comment'],
};

/** The keys one `doorways` entry may carry: where along the run, how wide, how tall, and how far up the run it starts. */
export const DOORWAY_KEYS = ['at', 'width', 'height', 'base'];

const pair = (v) => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n));
const positive = (v) => Number.isFinite(v) && v > 0;
/** `{ min: [x, z], max: [x, z] }` with min no greater than max on either axis: a room's `tiles` or its `bounds`. */
const rectangle = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).every((k) => k === 'min' || k === 'max')
  && pair(v.min) && pair(v.max) && v.min[0] <= v.max[0] && v.min[1] <= v.max[1];

/**
 * The shape one row of each array must have, beyond its key list. A prop is a
 * tile; a run is two tiles and a stone; a room is a name over exactly one
 * extent. Every rule names the field it is about, so the dev server's 400 says
 * what to fix rather than that something is wrong.
 */
const SHAPES = {
  interiorProps(row) {
    needTile(row);
    if (typeof row.model !== 'string') throw new Error('place: an interiorProps row needs a `model`');
  },
  builtProps(row) {
    needTile(row);
    if (typeof row.id !== 'string' || typeof row.material !== 'string') throw new Error('place: a builtProps row needs an `id` and a `material`');
  },
  braziers(row) { needTile(row); },
  walls(row) {
    if (typeof row.id !== 'string' || !row.id) throw new Error('place: a walls row needs an `id`');
    if (!pair(row.from) || !pair(row.to)) throw new Error('place: a walls row needs `from` and `to`, each two finite numbers');
    if (typeof row.material !== 'string') throw new Error('place: a walls row needs a `material`');
    if (!positive(row.height) || !positive(row.thickness)) throw new Error('place: a walls row needs a positive `height` and `thickness`');
    if ('axis' in row && row.axis !== 'x' && row.axis !== 'z') throw new Error('place: a run\'s `axis` is "x" or "z"');
    if ('doorways' in row) {
      if (!Array.isArray(row.doorways)) throw new Error('place: `doorways` must be an array');
      row.doorways.forEach((d, i) => {
        if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error(`place: doorways[${i}] must be an object`);
        const extra = Object.keys(d).filter((k) => !DOORWAY_KEYS.includes(k));
        if (extra.length) throw new Error(`place: doorways[${i}] carries no ${extra.join(', ')} (allowed: ${DOORWAY_KEYS.join(', ')})`);
        if (!Number.isFinite(d.at)) throw new Error(`place: doorways[${i}].at must be a number`);
        if (!positive(d.width) || !positive(d.height)) throw new Error(`place: doorways[${i}] needs a positive \`width\` and \`height\``);
        if ('base' in d && !Number.isFinite(d.base)) throw new Error(`place: doorways[${i}].base must be a number`);
      });
    }
  },
  rooms(row) {
    if (typeof row.id !== 'string' || !row.id) throw new Error('place: a rooms row needs an `id`');
    if (!Number.isInteger(row.level)) throw new Error('place: a rooms row needs a whole-number `level`');
    if (typeof row.ward !== 'string') throw new Error('place: a rooms row needs a `ward`');
    // A room is a name over ONE extent (castle-plan.js's `rooms` pass): a
    // rectangle of tiles, a drum's interior, or a rectangle in metres.
    const by = ['tiles', 'drum', 'bounds'].filter((k) => k in row);
    if (by.length !== 1) throw new Error(`place: a rooms row is by exactly one of tiles, drum, bounds, and this one has ${by.length ? by.join(' and ') : 'none'}`);
    if ('tiles' in row && !rectangle(row.tiles)) throw new Error('place: `tiles` must be { min: [x, z], max: [x, z] } with min no greater than max');
    if ('bounds' in row && !rectangle(row.bounds)) throw new Error('place: `bounds` must be { min: [x, z], max: [x, z] } with min no greater than max');
    if ('drum' in row && typeof row.drum !== 'string') throw new Error('place: `drum` names a drum by its id');
  },
};

function needTile(row) {
  if (!pair(row.tile)) throw new Error('place: `tile` must be two finite numbers');
}

/**
 * A row off the wire, checked. Unknown keys are refused rather than dropped:
 * a typo that silently vanished would be written into the file as a prop with
 * no model and found by a suite two rows later.
 *
 * The rules are per array (`SHAPES` above). They were one shape for as long as
 * every placeable row was a tile, and a run is not: it has a `from` and a `to`.
 * These are the shape of a row and nothing more. Whether the castle still
 * builds is `makePlan`'s question, which the floor plan asks in the page before
 * it posts (#749), and whether it still works is test/layout.mjs's.
 */
export function checkRow(key, row) {
  const allowed = PLACEABLE[key];
  if (!allowed) throw new Error(`place: ${JSON.stringify(key)} is not a placeable array (${Object.keys(PLACEABLE).join(', ')})`);
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('place: the row must be an object');
  const extra = Object.keys(row).filter((k) => !allowed.includes(k));
  if (extra.length) throw new Error(`place: ${key} rows carry no ${extra.join(', ')} (allowed: ${allowed.join(', ')})`);
  if ('base' in row && !Number.isFinite(row.base)) throw new Error('place: `base` must be a number');
  SHAPES[key](row);
  return row;
}
