// dialogue.mjs — the dialogue format (BACKLOG.md rank 12, the row's third and
// last increment; SPECS.md left it deliberately unspecified).
//
//   node tools/dialogue.mjs extract     data/  ->  dialogue/castle.dlg
//   node tools/dialogue.mjs compile     dialogue/castle.dlg  ->  data/
//   node tools/dialogue.mjs check       neither, and exits non-zero on drift
//
// WHAT THE ROW WAS FOR. A speaker's lines live in data/npcs.json under
// `cast[].dialogue[state]`. What moves a speaker into a state does not: a press
// lives in data/mystery.json's `presses`, a quest stage lives in
// data/quests/<id>.json's `stages`, and what a state is worth — the clue it
// grants — lives in mystery.json's `clues` under `source: {npc, state}`. Adding
// one state to one person is four edits in three files, and nothing in any of
// them shows you the fourth. There were 13 speakers, 62 states and 182 lines in
// there when this was written and there are 14, 77 and 240 now, because the
// walking day gave every speaker a `day0` set and the cast a fourteenth member
// (#752), and then gave the fourteen sets their real words; the next content row
// triples that.
//
// So: one text file, `dialogue/castle.dlg`, where a speaker's whole
// conversation reads top to bottom — the state, what reaches it, what it is
// worth, and the lines, one per line. Five sigils and nothing else:
//
//   @ id | name | role | ward     a speaker
//   : state                       a state of that speaker
//   ? press default on wax-matches | quest cooks-knife at hunting | frame explore
//   % the quest stage's objective  (only under a `? quest` line)
//   ! says clerk-cloak            a clue this state grants
//   | a line, verbatim            one line of dialogue
//   # a comment, ignored
//
// THE THIRD `?` KIND IS THE DAY'S OWN FRAME. A stage of data/quest.json carries
// a `dialogueState` and it switches every speaker at once: `explore` and `night`
// both name `day0`, which is how the walking day gets its lines without a fifth
// pool anywhere (#752, SPECS.md's open call 6). So a state the main graph reaches
// that way gets one `? frame <stage>` per stage that reaches it, on every
// speaker. It is rebuilt and compared like the other three and written back by
// nothing, which is #690's bargain sharpened and not amended: the rebuild set
// grew, the write set did not. `default` is excluded because every other stage
// names it and 77 identical annotations say nothing.
//
// TWO OF THOSE ARE WRITTEN BACK AND THREE ARE ONLY CHECKED. `|` writes into
// npcs.json and `%` writes into the quest file. `@`, `:` and `?` and `!` are
// the clue graph, and the clue graph stays hand-edited in mystery.json, because
// a compiler that could invent a press out of a line of text is a compiler that
// can silently rewire the mystery — and src/mystery.js's validator, which is
// the thing that has caught every wiring mistake this project has made, reads
// mystery.json and not this file. What they get instead is an equality: `check`
// rebuilds every `@`, `:`, `?` and `!` from the three JSON files and refuses if
// one byte of the rebuild is not what the .dlg says. The annotations cannot
// drift, and they cannot be authored either. That is the bargain (#687).
//
// THE WRITE IS A TEXT SPLICE AND NOT A RE-SERIALISE, for tools/place.mjs's
// reason and measured the same way: `JSON.stringify(JSON.parse(raw), null, 2)`
// over data/npcs.json is not data/npcs.json. What is new here is that the thing
// being replaced is nested — `cast[7].dialogue["chisel-forge"]` — where
// place.mjs only ever had to find an element of a top-level array. `locate`
// walks a path of keys and indices and hands back the byte span of the value at
// the end of it, and every edit below is that span and nothing else.
//
// IT WRITES THE FILE'S OWN LINE ENDING. data/npcs.json is checked out CRLF on
// Windows and LF in CI, and so will dialogue/castle.dlg be (#632). Every
// newline this module writes comes from `eolOf` of the file it is writing into.
// A hardcoded `\n` is one byte of diff per splice on the dev machine and none
// in CI, which is the shape of bug that lived in test/tools.mjs's rail for its
// whole life (#631 to #633).
//
// THE .dlg IS NOT UNDER data/. vite.config.js copies data/ into dist/ whole, so
// a source file kept there would be published — 24 KB of the same lines the
// page already has, served to nobody. `dialogue/` is a sibling of it and the
// build has never heard of it. test/dialogue.mjs asserts that path rather than
// trusting this paragraph (#586's habit, pointed at a third target).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

/** Where the .dlg lives, repo-relative. Outside data/ on purpose; see the header. */
export const DLG = 'dialogue/castle.dlg';

/* ====================================================== the JSON text walk == */

const isWs = (ch) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
const skipWs = (s, i) => { while (i < s.length && isWs(s[i])) i++; return i; };

/** One past the closing quote of the string starting at `i`. Escapes are honoured, so a `\"` does not end it. */
function endOfString(s, i) {
  for (let j = i + 1, esc = false; j < s.length; j++) {
    const ch = s[j];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') return j + 1;
  }
  throw new Error(`dialogue: the string at ${i} is never closed`);
}

/** One past the last character of the value starting at `i`, whatever kind of value it is. */
function endOfValue(s, i) {
  const ch = s[i];
  if (ch === '"') return endOfString(s, i);
  if (ch === '{' || ch === '[') {
    let depth = 0;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (c === '"') { j = endOfString(s, j) - 1; continue; }
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') { depth--; if (depth === 0) return j + 1; }
    }
    throw new Error(`dialogue: the bracket at ${i} is never closed`);
  }
  // true, false, null, a number: it runs to the first thing that can follow a value.
  let j = i;
  while (j < s.length && !isWs(s[j]) && s[j] !== ',' && s[j] !== ']' && s[j] !== '}') j++;
  if (j === i) throw new Error(`dialogue: no value at ${i}, found ${JSON.stringify(s[i])}`);
  return j;
}

/**
 * The members of the object or array whose opening bracket is at `at`, in
 * order: `key` (a string for an object, an index for an array), `keyStart` (the
 * key's opening quote, or the element's first character), `valueStart` and
 * `valueEnd`.
 *
 * It is one walk of the text and it never parses: the spans it hands back are
 * spans into the file as typed, which is the whole point — a span is what lets
 * an edit leave every byte outside it alone. test/dialogue.mjs holds it to
 * `JSON.parse` for every member of every dialogue block in the real file,
 * because a span finder checked against a second span finder agrees with itself
 * (#34, #500).
 */
export function membersOf(source, at) {
  const isObject = source[at] === '{';
  if (!isObject && source[at] !== '[')
    throw new Error(`dialogue: expected an object or array at ${at}, found ${JSON.stringify(source[at])}`);
  const closer = isObject ? '}' : ']';
  const members = [];
  let i = skipWs(source, at + 1);
  while (i < source.length && source[i] !== closer) {
    const keyStart = i;
    let key, valueStart;
    if (isObject) {
      if (source[i] !== '"') throw new Error(`dialogue: expected a key at ${i}, found ${JSON.stringify(source[i])}`);
      const keyEnd = endOfString(source, i);
      key = JSON.parse(source.slice(i, keyEnd));
      const colon = skipWs(source, keyEnd);
      if (source[colon] !== ':') throw new Error(`dialogue: no ':' after the key at ${i}`);
      valueStart = skipWs(source, colon + 1);
    } else {
      key = members.length;
      valueStart = i;
    }
    const valueEnd = endOfValue(source, valueStart);
    members.push({ key, keyStart, valueStart, valueEnd });
    i = skipWs(source, valueEnd);
    if (source[i] === ',') i = skipWs(source, i + 1);
  }
  if (source[i] !== closer) throw new Error(`dialogue: the container at ${at} is never closed`);
  return { open: at, close: i, members };
}

/**
 * The member at `path` — `['cast', 7, 'dialogue', 'chisel-forge']` — or a throw
 * naming the step that was not there. Throwing rather than returning nothing is
 * #13: a misspelled state must not compile to an edit of nothing.
 */
export function locate(source, path) {
  let at = { keyStart: skipWs(source, 0), valueStart: skipWs(source, 0), valueEnd: -1 };
  at.valueEnd = endOfValue(source, at.valueStart);
  for (let step = 0; step < path.length; step++) {
    const { members } = membersOf(source, at.valueStart);
    const found = members.find((m) => m.key === path[step]);
    if (!found) throw new Error(`dialogue: nothing at ${path.slice(0, step + 1).join('.')}`);
    at = found;
  }
  return at;
}

/** The column `i` sits at, which is the indent a replacement has to be written at. */
const columnOf = (source, i) => i - (source.lastIndexOf('\n', i) + 1);

/**
 * The line ending `source` is written with, taken off its first line. Same
 * function and same reason as tools/place.mjs's: a splice into a CRLF file
 * leaves a CRLF file (#631 to #633).
 */
export function eolOf(source) {
  const i = source.indexOf('\n');
  return i > 0 && source[i - 1] === '\r' ? '\r\n' : '\n';
}

/** An array of strings, spelled the way every line array in npcs.json is spelled: one per line, two spaces in from the key. */
export function formatLines(lines, indent, eol) {
  if (!lines.length) return '[]';
  const inner = ' '.repeat(indent + 2);
  return `[${eol}${lines.map((l) => inner + JSON.stringify(l)).join(`,${eol}`)}${eol}${' '.repeat(indent)}]`;
}

/**
 * `source` with the value at `path` replaced by what `make(indent, eol)`
 * returns, and every other byte the byte it was. `indent` is the column the
 * member's key starts at, so a value two levels in stays two levels in.
 */
export function setValue(source, path, make) {
  const at = locate(source, path);
  const text = make(columnOf(source, at.keyStart), eolOf(source));
  return `${source.slice(0, at.valueStart)}${text}${source.slice(at.valueEnd)}`;
}

/**
 * `source` with one more key at the end of the object at `path`.
 *
 * This is tools/place.mjs's `insertRow` over an object instead of an array, and
 * the awkward parts are the same two: the last member needs the comma the file
 * never gave it, and an empty object has both braces on the key's own line so
 * the indent has to come off the OPENING brace instead of the closing one.
 */
export function addKey(source, path, key, make) {
  const at = locate(source, path);
  const { open, close, members } = membersOf(source, at.valueStart);
  const eol = eolOf(source);
  const empty = members.length === 0;
  const lineStart = source.lastIndexOf('\n', empty ? open : close) + 1;
  const pad = /^[ \t]*/.exec(source.slice(lineStart))[0];
  const indent = pad.length + 2;
  const text = `${' '.repeat(indent)}${JSON.stringify(key)}: ${make(indent, eol)}`;
  const head = empty ? source.slice(0, open + 1) : source.slice(0, close).replace(/\s*$/, ',');
  return `${head}${eol}${text}${eol}${pad}${source.slice(close)}`;
}

/**
 * `source` with `key` gone from the object at `path`, along with the one comma
 * and one line ending that held it there.
 *
 * Three cases and not one, for `deleteRow`'s reason: a member with something
 * before it takes the separator on its left, which makes it exactly `addKey`
 * run backwards and is why the suite can add a state and delete it again and
 * get the file back byte for byte. The first of several takes the separator on
 * its right. The last one standing leaves `{}`, which `addKey` can fill.
 */
export function deleteKey(source, path, key) {
  const at = locate(source, path);
  const { open, close, members } = membersOf(source, at.valueStart);
  const i = members.findIndex((m) => m.key === key);
  if (i === -1) throw new Error(`dialogue: ${path.join('.')} has no ${JSON.stringify(key)}`);
  if (members.length === 1) return `${source.slice(0, open + 1)}${source.slice(close)}`;
  if (i > 0) return `${source.slice(0, members[i - 1].valueEnd)}${source.slice(members[i].valueEnd)}`;
  return `${source.slice(0, members[i].keyStart)}${source.slice(members[1].keyStart)}`;
}

/* ========================================================== the .dlg model == */

/**
 * The whole conversation web, as the .dlg spells it: every speaker in
 * npcs.json's cast order, every state in npcs.json's order followed by any
 * state the clue graph reaches that npcs.json has not got yet, and for each
 * state what reaches it, what it grants, and its lines.
 *
 * A state the graph names and npcs.json has not got comes out with no `|` lines
 * at all. That is the authoring loop: wire the press in mystery.json, run
 * `extract`, and the stub is sitting in the .dlg waiting to be written. Compile
 * refuses a state with no lines, so the stub cannot be committed half-done.
 */
export function buildModel({ npcs, mystery, quests, graph = null }) {
  // Keyed `npc|state`. A `|` cannot collide: every id and state name in
  // npcs.json, mystery.json and the quests is lower-case letters, digits and
  // hyphens, and `problems` would refuse one that was not.
  const reach = new Map();
  const push = (npc, state, cond) => {
    const key = `${npc}|${state}`;
    if (!reach.has(key)) reach.set(key, []);
    reach.get(key).push(cond);
  };
  // The frame first, because it is the floor `_syncStates` layers the other two
  // over: a press beats an errand beats the day's own state.
  for (const [stageId, stage] of Object.entries(graph?.stages || {}))
    if (stage.dialogueState && stage.dialogueState !== 'default')
      for (const person of npcs.cast)
        push(person.id, stage.dialogueState, { kind: 'frame', text: `frame ${stageId}`, stage: stageId });
  for (const p of mystery.presses || [])
    push(p.npc, p.to, { kind: 'press', text: `press ${p.from.join(' ')} on ${p.on}` });
  for (const q of quests)
    for (const [stageId, stage] of Object.entries(q.stages || {}))
      if (stage.dialogueState)
        push(q.npc, stage.dialogueState, {
          kind: 'quest', text: `quest ${q.id} at ${stageId}`,
          quest: q.id, stage: stageId, objective: stage.objective ?? '',
        });

  const grants = new Map();
  for (const c of mystery.clues || []) {
    const s = c.source || {};
    if (!s.npc || !s.state) continue;
    const key = `${s.npc}|${s.state}`;
    if (!grants.has(key)) grants.set(key, []);
    grants.get(key).push(`says ${c.id}${c.watches ? ` at ${c.watches.join(' ')}` : ''}`);
  }

  return npcs.cast.map((person) => {
    const written = Object.keys(person.dialogue || {});
    const named = [...reach.keys()]
      .filter((k) => k.startsWith(`${person.id}|`))
      .map((k) => k.slice(person.id.length + 1))
      .filter((s) => !written.includes(s));
    return {
      id: person.id, name: person.name, role: person.role, ward: person.ward,
      states: [...written, ...named].map((state) => ({
        state,
        conditions: reach.get(`${person.id}|${state}`) || [],
        effects: grants.get(`${person.id}|${state}`) || [],
        lines: (person.dialogue || {})[state] || [],
      })),
    };
  });
}

/** The comment block the .dlg opens with. It is the format's only documentation a writer will actually read. */
const PREAMBLE = [
  'castle.dlg — every word the cast says, and what moves them to say it.',
  '',
  'Generated by `npm run dialogue:extract` and read back by',
  '`npm run dialogue:compile`. `npm run dialogue:check` exits non-zero if this',
  'file and data/ have drifted apart, and test/dialogue.mjs runs the same check.',
  '',
  '  @ id | name | role | ward     a speaker, in data/npcs.json cast order',
  '  : state                       one of that speaker\'s dialogue states',
  '  ? what moves them into it     a press, a quest stage, or the day\'s own frame',
  '  % the quest stage objective   only under a `? quest` line',
  '  ! what the state grants       a clue sourced on it',
  '  | one line of dialogue        verbatim, in order',
  '  # a comment                   ignored',
  '',
  'ONLY `|` AND `%` ARE WRITTEN BACK. The `@`, `:`, `?` and `!` lines are the',
  'clue graph, which lives in data/mystery.json and data/quests/ and is edited',
  'there; compile rebuilds them from those files and refuses if what is below',
  'has drifted from what they say. So: to add a state, wire its press or its',
  'quest stage first, re-run extract, and write the lines into the stub that',
  'appears here. To change a line or an objective, change it here and compile.',
].map((l) => (l ? `# ${l}` : '#'));

/** The model as .dlg text, with `eol` between every line and one at the end. */
export function render(model, eol = '\n') {
  const out = [...PREAMBLE];
  for (const person of model) {
    out.push('');
    out.push(`@ ${person.id} | ${person.name} | ${person.role} | ${person.ward}`);
    for (const st of person.states) {
      out.push(`: ${st.state}`);
      for (const c of st.conditions) {
        out.push(`? ${c.text}`);
        if (c.kind === 'quest') out.push(`% ${c.objective}`);
      }
      for (const e of st.effects) out.push(`! ${e}`);
      for (const l of st.lines) out.push(`| ${l}`);
    }
  }
  out.push('');
  return out.join(eol) + eol;
}

/**
 * .dlg text back into the model `render` would have produced it from.
 *
 * Every refusal here names the line number, because the one thing a format like
 * this must not do is fail somewhere else. A `|` before any `:` is the mistake
 * a writer makes first and it is caught on the line they typed.
 */
export function parse(text) {
  const model = [];
  let person = null, state = null, lastCondition = null;
  const lines = text.split(/\r\n|\n|\r/);
  const where = (i, msg) => { throw new Error(`${DLG}:${i + 1}: ${msg}`); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('#')) continue;
    const sigil = line[0];
    const rest = line.slice(1).replace(/^ /, '');
    if (line.length > 1 && line[1] !== ' ') where(i, `a ${JSON.stringify(sigil)} line wants a space after the sigil`);
    switch (sigil) {
      case '@': {
        const parts = rest.split('|').map((s) => s.trim());
        if (parts.length !== 4) where(i, `a speaker is "@ id | name | role | ward", four fields, not ${parts.length}`);
        if (model.some((p) => p.id === parts[0])) where(i, `${parts[0]} has already had a "@" line`);
        person = { id: parts[0], name: parts[1], role: parts[2], ward: parts[3], states: [] };
        model.push(person);
        state = null; lastCondition = null;
        break;
      }
      case ':':
        if (!person) where(i, 'a state before any speaker — every ":" needs an "@" above it');
        // `npc|state` is the key `buildModel` reaches a state by, so a name with
        // a pipe in it would collide with another speaker's state and would
        // silently take its conditions. No id or state name in data/ has one.
        if (rest.includes('|')) where(i, 'a state name with a "|" in it');
        if (person.states.some((s) => s.state === rest)) where(i, `${person.id} has already had a ":" for ${JSON.stringify(rest)}`);
        state = { state: rest, conditions: [], effects: [], lines: [] };
        person.states.push(state);
        lastCondition = null;
        break;
      case '?': {
        if (!state) where(i, 'a condition before any state');
        if (state.lines.length) where(i, 'a "?" after the lines it is about — conditions come first');
        const quest = /^quest (\S+) at (\S+)$/.exec(rest);
        const frame = /^frame (\S+)$/.exec(rest);
        lastCondition = quest
          ? { kind: 'quest', text: rest, quest: quest[1], stage: quest[2], objective: null }
          : frame
            ? { kind: 'frame', text: rest, stage: frame[1] }
            : { kind: 'press', text: rest };
        state.conditions.push(lastCondition);
        break;
      }
      case '%':
        if (!lastCondition) where(i, 'a "%" objective with no "? quest" line above it');
        if (lastCondition.kind !== 'quest') where(i, `a "%" objective under a ${lastCondition.kind} — only a quest stage has one`);
        if (lastCondition.objective !== null) where(i, `${lastCondition.quest}/${lastCondition.stage} has already had a "%"`);
        lastCondition.objective = rest;
        break;
      case '!':
        if (!state) where(i, 'an effect before any state');
        if (state.lines.length) where(i, 'a "!" after the lines it is about — effects come first');
        state.effects.push(rest);
        break;
      case '|':
        if (!state) where(i, 'a line before any state — every "|" needs a ":" above it');
        if (!rest) where(i, 'an empty line of dialogue');
        state.lines.push(rest);
        break;
      default:
        where(i, `${JSON.stringify(line.slice(0, 24))} starts with no sigil (@ : ? % ! | #)`);
    }
  }
  for (const p of model)
    for (const s of p.states)
      for (const c of s.conditions)
        if (c.kind === 'quest' && c.objective === null)
          throw new Error(`${DLG}: ${p.id}/${s.state} names ${c.quest} at ${c.stage} with no "%" objective under it`);
  return model;
}

/* ============================================================ the checking == */

/**
 * Every way `parsed` disagrees with the model the JSON files say it should be,
 * as one message each. An empty list is the only thing that compiles.
 *
 * It compares the graph — speakers, their order, their headers, their states,
 * their order, the conditions and the effects — and deliberately does not
 * compare lines or objectives, which are the two things the .dlg is allowed to
 * be the newer copy of.
 */
export function problems(model, parsed) {
  const out = [];
  const ids = (m) => m.map((p) => p.id).join(' ');
  if (ids(model) !== ids(parsed)) {
    const missing = model.filter((p) => !parsed.some((q) => q.id === p.id)).map((p) => p.id);
    const extra = parsed.filter((p) => !model.some((q) => q.id === p.id)).map((p) => p.id);
    if (missing.length) out.push(`no "@" line for ${missing.join(', ')} — run extract`);
    if (extra.length) out.push(`"@" line for ${extra.join(', ')}, who is not in npcs.json's cast`);
    if (!missing.length && !extra.length) out.push(`the speakers are in the wrong order — npcs.json says ${ids(model)}`);
    return out;
  }
  for (let i = 0; i < model.length; i++) {
    const want = model[i], got = parsed[i];
    for (const field of ['name', 'role', 'ward'])
      if (want[field] !== got[field])
        out.push(`${want.id}: the ${field} is ${JSON.stringify(got[field])} here and ${JSON.stringify(want[field])} in npcs.json`);
    const names = (p) => p.states.map((s) => s.state).join(' ');
    if (names(want) !== names(got)) {
      const missing = want.states.filter((s) => !got.states.some((t) => t.state === s.state)).map((s) => s.state);
      const extra = got.states.filter((s) => !want.states.some((t) => t.state === s.state)).map((s) => s.state);
      if (missing.length) out.push(`${want.id}: no ":" for ${missing.join(', ')} — run extract`);
      if (extra.length) out.push(`${want.id}: a ":" for ${extra.join(', ')}, which nothing in npcs.json, mystery.json or quests/ names`);
      if (!missing.length && !extra.length) out.push(`${want.id}: the states are in the wrong order — npcs.json says ${names(want)}`);
      continue;
    }
    for (let j = 0; j < want.states.length; j++) {
      const w = want.states[j], g = got.states[j];
      const conds = (s) => s.conditions.map((c) => c.text).join(' / ');
      if (conds(w) !== conds(g))
        out.push(`${want.id}/${w.state}: the "?" lines say ${JSON.stringify(conds(g))} and the clue graph says ${JSON.stringify(conds(w))}`);
      if (w.effects.join(' / ') !== g.effects.join(' / '))
        out.push(`${want.id}/${w.state}: the "!" lines say ${JSON.stringify(g.effects.join(' / '))} and mystery.json's clues say ${JSON.stringify(w.effects.join(' / '))}`);
      if (!g.lines.length)
        out.push(`${want.id}/${w.state}: no "|" lines — a state nobody says anything in is a state the player walks away from in silence`);
    }
  }
  return out;
}

/* ============================================================= the writing == */

/**
 * data/npcs.json with every speaker's `dialogue` block saying what `parsed`
 * says, and every byte outside those blocks the byte it was.
 *
 * Three edits and not one: a state both sides have whose lines differ is a
 * `setValue` of that one array, a state only the .dlg has is an `addKey`, and a
 * state only the file has is a `deleteKey`. A state whose lines are identical
 * is not touched at all, which is what makes a compile with nothing to do a
 * zero-byte diff rather than a reformat of all 240 lines.
 */
export function applyToNpcs(source, parsed) {
  const cast = JSON.parse(source).cast;
  let out = source;
  for (const person of parsed) {
    const index = cast.findIndex((p) => p.id === person.id);
    if (index === -1) throw new Error(`dialogue: npcs.json has no "${person.id}" to write into`);
    const at = ['cast', index, 'dialogue'];
    const was = cast[index].dialogue || {};
    for (const st of person.states) {
      const same = Array.isArray(was[st.state])
        && was[st.state].length === st.lines.length
        && was[st.state].every((l, i) => l === st.lines[i]);
      if (same) continue;
      out = st.state in was
        ? setValue(out, [...at, st.state], (indent, eol) => formatLines(st.lines, indent, eol))
        : addKey(out, at, st.state, (indent, eol) => formatLines(st.lines, indent, eol));
    }
    for (const state of Object.keys(was))
      if (!person.states.some((s) => s.state === state)) out = deleteKey(out, at, state);
  }
  return out;
}

/**
 * One quest file with its stage objectives saying what the .dlg's `%` lines
 * say. Same promise: a stage whose objective did not change is not touched.
 */
export function applyToQuest(source, questId, parsed) {
  let out = source;
  for (const person of parsed)
    for (const st of person.states)
      for (const c of st.conditions) {
        if (c.kind !== 'quest' || c.quest !== questId) continue;
        const stage = JSON.parse(out).stages[c.stage];
        if (!stage) throw new Error(`dialogue: ${questId} has no stage "${c.stage}"`);
        if (stage.objective === c.objective) continue;
        out = setValue(out, ['stages', c.stage, 'objective'], () => JSON.stringify(c.objective));
      }
  return out;
}

/* ================================================================ the disk == */

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** The three sources the model is built from, as text and as JSON, plus the quest ids in index order. */
export function load() {
  const npcsText = read('data/npcs.json');
  const mystery = JSON.parse(read('data/mystery.json'));
  // The main graph, for the `? frame` lines only: a stage whose `dialogueState`
  // is not `default` switches every speaker at once.
  const graph = JSON.parse(read('data/quest.json'));
  // The index names files and not ids, because a browser cannot read a
  // directory; the id inside each file is what the .dlg's `? quest` lines use.
  const files = JSON.parse(read('data/quests/index.json')).quests;
  const quests = files.map((file) => JSON.parse(read(`data/quests/${file}`)));
  const questTexts = new Map(quests.map((q, i) => [q.id, read(`data/quests/${files[i]}`)]));
  const questFiles = new Map(quests.map((q, i) => [q.id, `data/quests/${files[i]}`]));
  return { npcsText, mystery, graph, questTexts, questFiles, npcs: JSON.parse(npcsText), quests };
}

function main(argv) {
  const verb = argv[0] || 'check';
  if (!['extract', 'compile', 'check'].includes(verb)) {
    console.error(`dialogue: no such verb ${JSON.stringify(verb)} (extract, compile, check)`);
    return 2;
  }
  const disk = load();
  const model = buildModel(disk);
  const dlgPath = path.join(ROOT, DLG);
  const exists = fs.existsSync(dlgPath);

  if (verb === 'extract') {
    const eol = exists ? eolOf(read(DLG)) : eolOf(disk.npcsText);
    const text = render(model, eol);
    if (exists && read(DLG) === text) { console.log(`${DLG} is already what data/ says.`); return 0; }
    fs.mkdirSync(path.dirname(dlgPath), { recursive: true });
    fs.writeFileSync(dlgPath, text);
    const stubs = model.flatMap((p) => p.states.filter((s) => !s.lines.length).map((s) => `${p.id}/${s.state}`));
    console.log(`wrote ${DLG}: ${model.length} speakers, ${model.reduce((n, p) => n + p.states.length, 0)} states.`);
    if (stubs.length) console.log(`  ${stubs.length} state(s) with no lines yet: ${stubs.join(', ')}`);
    return 0;
  }

  if (!exists) { console.error(`dialogue: there is no ${DLG} — run \`npm run dialogue:extract\` first`); return 1; }
  let parsed;
  try { parsed = parse(read(DLG)); } catch (e) { console.error(e.message); return 1; }
  const bad = problems(model, parsed);
  if (bad.length) {
    console.error(`${DLG} and data/ disagree, ${bad.length} way(s):`);
    for (const p of bad) console.error(`  ${p}`);
    return 1;
  }

  const writes = [];
  const npcsOut = applyToNpcs(disk.npcsText, parsed);
  if (npcsOut !== disk.npcsText) writes.push(['data/npcs.json', npcsOut]);
  for (const [id, text] of disk.questTexts) {
    const out = applyToQuest(text, id, parsed);
    if (out !== text) writes.push([disk.questFiles.get(id), out]);
  }

  if (verb === 'check') {
    const stale = render(model, eolOf(read(DLG))) !== read(DLG);
    if (!writes.length && !stale) { console.log(`${DLG} and data/ agree.`); return 0; }
    if (stale) console.error(`${DLG} is not what extract would write — run \`npm run dialogue:extract\``);
    for (const [rel] of writes) console.error(`${rel} would change — run \`npm run dialogue:compile\``);
    return 1;
  }

  if (!writes.length) { console.log('nothing to write: data/ already says what the .dlg says.'); return 0; }
  for (const [rel, text] of writes) {
    // Parse what is about to be written and never what was handed in: a splice
    // that produced text JSON.parse refuses would otherwise leave the file
    // broken and nine suites red (vite.config.js's own habit, #642).
    JSON.parse(text);
    fs.writeFileSync(path.join(ROOT, rel), text);
    console.log(`wrote ${rel}`);
  }
  return 0;
}

// Run as a script, not when a suite imports it. `path.resolve` on both sides
// because argv[1] arrives with backslashes on the dev machine and comparing it
// with import.meta.url as a string is false there (CLAUDE.md, Windows).
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(HERE, 'dialogue.mjs'))
  process.exit(main(process.argv.slice(2)));
