// dialogue.mjs — tools/dialogue.mjs and dialogue/castle.dlg, the dialogue
// format (BACKLOG.md rank 12, the row's third increment).
//
//   node test/dialogue.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHAT THIS SUITE IS FOR. The .dlg is a second copy of 182 lines of dialogue
// that also live in data/npcs.json, and a second copy of anything is a copy
// that drifts. The only reason it is allowed to exist is that this file forbids
// the drift: part 5 rebuilds the whole .dlg out of data/ and compares it with
// what is committed, and part 6 compiles what is committed back into data/ and
// compares that. Neither side can move without the other. Delete this suite and
// the format becomes a lie two commits later.
//
// AND FOR THE SPLICE, which is the half that can quietly destroy something.
// `setValue`, `addKey` and `deleteKey` rewrite a nested span of a 54 KB file
// that seven suites read. The property asserted is tools/place.mjs's: every
// byte that was not the thing being edited is the byte it was.
//
// IT RUNS OVER BOTH LINE ENDINGS. data/npcs.json comes out of git CRLF on
// Windows and LF in CI (#632), so a rail that reads only what is on disk is two
// different rails on the two machines — which is exactly what test/tools.mjs
// was for its whole life (#631 to #633). Both endings are built here out of
// what is on disk and both are asserted.
//
// Seven parts:
//   1. the walk: every span `membersOf` hands back is the value `JSON.parse`
//      gives for the same member, over the real file
//   2. the splice: rewriting a state with its own lines is the file it was, and
//      rewriting it with one line changed moves no byte outside its span
//   3. add and delete: a state added and deleted again is the file byte for
//      byte, and so is one deleted and added back
//   4. the format: what render writes, parse reads back, for the real cast
//   5. the .dlg on disk is what extract would write
//   6. compiling the .dlg on disk writes nothing — npcs.json and all five
//      quest files come back byte for byte
//   7. the refusals: every rule in `parse` and `problems` broken on purpose

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DLG, load, buildModel, render, parse, problems,
  applyToNpcs, applyToQuest, setValue, addKey, deleteKey,
  membersOf, locate, formatLines, eolOf,
} from '../tools/dialogue.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** The same text with each ending, whichever one git handed this machine. */
const bothEndings = (raw) => {
  const lf = raw.replace(/\r\n/g, '\n');
  return [['LF', lf], ['CRLF', lf.replace(/\n/g, '\r\n')]];
};

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const threw = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
/** How many line endings in `text` are not `eol`. Zero is the only acceptable answer for a spliced file. */
const strayEndings = (text, eol) =>
  (text.match(eol === '\r\n' ? /(?<!\r)\n/g : /\r/g) || []).length;

const disk = load();
const model = buildModel(disk);
const dlgRaw = read(DLG);

/* ------------------------------------------------------- 1: the walk ----- */
console.log('the walk, against the real data/npcs.json');
{
  for (const [ending, source] of bothEndings(disk.npcsText)) {
    const parsed = JSON.parse(source);
    let members = 0, wrong = 0;
    const cast = locate(source, ['cast']);
    const castMembers = membersOf(source, cast.valueStart).members;
    if (castMembers.length !== parsed.cast.length)
      fail(`${ending}: the walk found ${castMembers.length} people in the cast and JSON.parse found ${parsed.cast.length}`);
    for (let i = 0; i < parsed.cast.length; i++) {
      const dialogue = locate(source, ['cast', i, 'dialogue']);
      const states = membersOf(source, dialogue.valueStart).members;
      const want = Object.keys(parsed.cast[i].dialogue || {});
      if (states.map((m) => m.key).join(' ') !== want.join(' ')) {
        fail(`${ending}: ${parsed.cast[i].id}'s states walked as ${states.map((m) => m.key).join(' ')}`);
        continue;
      }
      for (const m of states) {
        members++;
        const text = source.slice(m.valueStart, m.valueEnd);
        const got = JSON.parse(text);
        const expect = parsed.cast[i].dialogue[m.key];
        if (JSON.stringify(got) !== JSON.stringify(expect)) wrong++;
      }
    }
    check(members === 62 && !wrong,
      `${ending}: all ${members} dialogue spans parse to what JSON.parse gives for the same member`,
      `${wrong} wrong`);
  }
  // The span is the value and not one byte more: no comma, no trailing space.
  const at = locate(disk.npcsText, ['cast', 1, 'dialogue', 'admits']);
  const text = disk.npcsText.slice(at.valueStart, at.valueEnd);
  check(text.startsWith('[') && text.endsWith(']'), "a span starts at '[' and ends at ']'", JSON.stringify(text.slice(0, 4) + '…' + text.slice(-4)));
}

/* ----------------------------------------------------- 2: the splice ----- */
console.log('\nthe splice: a state rewritten, and nothing else');
{
  for (const [ending, source] of bothEndings(disk.npcsText)) {
    const eol = eolOf(source);
    check(eol === (ending === 'CRLF' ? '\r\n' : '\n'), `${ending}: eolOf reads this copy as ${ending}`, JSON.stringify(eol));
    const cast = JSON.parse(source).cast;

    // Every state rewritten with its own lines has to give back the file
    // exactly. This is the assertion that says `formatLines` spells an array
    // the way npcs.json already spells one — indent, one line per element,
    // the closing bracket's column. Nothing else in this suite would notice a
    // two-space drift, because every other part compares a splice with a
    // splice.
    let same = 0, differ = [];
    for (let i = 0; i < cast.length; i++)
      for (const [state, lines] of Object.entries(cast[i].dialogue || {})) {
        const out = setValue(source, ['cast', i, 'dialogue', state], (indent, e) => formatLines(lines, indent, e));
        if (out === source) same++;
        else differ.push(`${cast[i].id}/${state}`);
      }
    check(same === 62 && !differ.length,
      `${ending}: all ${same} states rewritten with their own lines are the file byte for byte`,
      differ.slice(0, 3).join(', '));

    // One line changed moves the bytes inside that one span and no others.
    for (const [i, state] of [[2, 'cornered'], [7, 'chisel-forge'], [12, 'default']]) {
      const who = cast[i].id;
      const lines = cast[i].dialogue[state].slice();
      lines[0] = 'A line this suite wrote, and nothing said it.';
      const at = locate(source, ['cast', i, 'dialogue', state]);
      const out = setValue(source, ['cast', i, 'dialogue', state], (indent, e) => formatLines(lines, indent, e));
      const head = out.slice(0, at.valueStart) === source.slice(0, at.valueStart);
      const tail = out.slice(out.length - (source.length - at.valueEnd)) === source.slice(at.valueEnd);
      check(head && tail, `${ending}: ${who}/${state} rewritten leaves every byte outside its span alone`,
        `${head ? '' : 'before '}${tail ? '' : 'after '}moved`);
      let after = null;
      try { after = JSON.parse(out); } catch (e) { fail(`${ending}: ${who}/${state} rewritten does not parse — ${e.message}`); }
      if (after) {
        check(JSON.stringify(after.cast[i].dialogue[state]) === JSON.stringify(lines),
          `${ending}: ${who}/${state} reads back as the lines it was given`);
        // Every OTHER state of every other person is untouched, which is the
        // thing the byte comparison above already proves and this says in the
        // terms a reader of npcs.json cares about.
        const before = JSON.parse(source);
        before.cast[i].dialogue[state] = lines;
        check(JSON.stringify(after) === JSON.stringify(before),
          `${ending}: ${who}/${state} rewritten changes that state and nothing else in the file`);
      }
      check(strayEndings(out, eol) === 0, `${ending}: ${who}/${state} rewritten leaves no stray line ending`,
        `${strayEndings(out, eol)} of them`);
    }
  }
}

/* ------------------------------------------------ 3: add and delete ------ */
console.log('\nadd and delete: the two run backwards give the file back');
{
  const LINES = ['A state this suite invented.', 'And a second line of it.'];
  for (const [ending, source] of bothEndings(disk.npcsText)) {
    const eol = eolOf(source);
    const cast = JSON.parse(source).cast;
    let round = 0, broke = [];
    for (let i = 0; i < cast.length; i++) {
      const added = addKey(source, ['cast', i, 'dialogue'], 'a-suite-state', (indent, e) => formatLines(LINES, indent, e));
      let parsed = null;
      try { parsed = JSON.parse(added); } catch (e) { broke.push(`${cast[i].id} add: ${e.message}`); continue; }
      if (JSON.stringify(parsed.cast[i].dialogue['a-suite-state']) !== JSON.stringify(LINES))
        broke.push(`${cast[i].id}: the added state does not read back`);
      if (strayEndings(added, eol)) broke.push(`${cast[i].id}: ${strayEndings(added, eol)} stray endings`);
      if (deleteKey(added, ['cast', i, 'dialogue'], 'a-suite-state') === source) round++;
      else broke.push(`${cast[i].id}: add then delete is not the file it was`);
    }
    check(round === cast.length && !broke.length,
      `${ending}: a state added and deleted again gives back the file byte for byte, for all ${cast.length} speakers`,
      broke.slice(0, 3).join('; '));

    // And the other way round, which is the case a person actually hits:
    // cutting a state that is really there and putting it back.
    let back = 0, lost = [];
    for (let i = 0; i < cast.length; i++) {
      const states = Object.keys(cast[i].dialogue || {});
      const last = states[states.length - 1];
      const gone = deleteKey(source, ['cast', i, 'dialogue'], last);
      if (last in JSON.parse(gone).cast[i].dialogue) { lost.push(`${cast[i].id}: ${last} survived the delete`); continue; }
      const again = addKey(gone, ['cast', i, 'dialogue'], last, (indent, e) => formatLines(cast[i].dialogue[last], indent, e));
      if (again === source) back++;
      else lost.push(`${cast[i].id}/${last}`);
    }
    check(back === cast.length && !lost.length,
      `${ending}: the last state deleted and added back is the file byte for byte, for all ${cast.length} speakers`,
      lost.slice(0, 3).join('; '));

    // The one standing alone: the inspector has a single state, so deleting it
    // is the `{}` case, which is the branch `addKey` has to be able to fill.
    const only = cast.findIndex((p) => Object.keys(p.dialogue || {}).length === 1);
    if (only === -1) fail('nobody in the cast has exactly one state any more — part 3 has stopped testing the empty-object branch');
    else {
      const emptied = deleteKey(source, ['cast', only, 'dialogue'], Object.keys(cast[only].dialogue)[0]);
      let ok = false;
      try { ok = Object.keys(JSON.parse(emptied).cast[only].dialogue).length === 0; } catch { /* ok stays false */ }
      check(ok, `${ending}: ${cast[only].id}'s only state deleted leaves an empty dialogue object that parses`);
      const refilled = addKey(emptied, ['cast', only, 'dialogue'], Object.keys(cast[only].dialogue)[0],
        (indent, e) => formatLines(Object.values(cast[only].dialogue)[0], indent, e));
      check(refilled === source, `${ending}: and filling it again is the file byte for byte`);
    }
  }
}

/* --------------------------------------------------- 4: the format ------- */
console.log('\nthe format: render out, parse back');
{
  for (const eol of ['\n', '\r\n']) {
    const name = eol === '\n' ? 'LF' : 'CRLF';
    const text = render(model, eol);
    check(strayEndings(text, eol) === 0, `${name}: render writes only ${name}`, `${strayEndings(text, eol)} stray`);
    const back = parse(text);
    check(problems(model, back).length === 0, `${name}: what render writes, problems() accepts`,
      problems(model, back).slice(0, 2).join('; '));
    const lines = (m) => m.flatMap((p) => p.states.flatMap((s) => s.lines));
    check(JSON.stringify(lines(back)) === JSON.stringify(lines(model)),
      `${name}: all ${lines(model).length} lines come back verbatim`);
    const objectives = (m) => m.flatMap((p) => p.states.flatMap((s) => s.conditions.filter((c) => c.kind === 'quest').map((c) => `${c.quest}/${c.stage}=${c.objective}`)));
    check(JSON.stringify(objectives(back)) === JSON.stringify(objectives(model)),
      `${name}: all ${objectives(model).length} quest objectives come back verbatim`);
    check(render(back, eol) === text, `${name}: rendering what was parsed is the same text`);
  }
  // A line with the characters that would break a naive format: a double quote,
  // a backslash, a brace token. None of the 118 real lines carries the first
  // two — measured, not assumed — so the round trip above cannot be the only
  // thing standing between a `"` in somebody's dialogue and a broken npcs.json.
  const awkward = model.flatMap((p) => p.states.flatMap((s) => s.lines)).filter((l) => l.includes('"') || l.includes('\\'));
  check(awkward.length === 0, 'no real line carries a quote or a backslash, so the synthetic one below is the cover',
    awkward.slice(0, 1).join(''));
  const round = parse(render([{
    id: 'constable', name: 'x', role: 'y', ward: 'inner',
    states: [{ state: 'default', conditions: [], effects: [], lines: ['He said "no", then \\ then {ACCUSE}'] }],
  }], '\n'));
  check(round[0].states[0].lines[0] === 'He said "no", then \\ then {ACCUSE}',
    'a line with a quote, a backslash and a token comes back verbatim', JSON.stringify(round[0].states[0].lines[0]));
}

/* ------------------------------------- 5: the .dlg on disk is the extract - */
console.log(`\n${DLG} is what extract would write`);
{
  check(!DLG.startsWith('data/'),
    'the .dlg is not under data/, which vite.config.js copies into dist/ whole', DLG);
  check(fs.existsSync(path.join(ROOT, DLG)), `${DLG} is committed`);
  const eol = eolOf(dlgRaw);
  check(render(model, eol) === dlgRaw,
    `${DLG} is byte for byte what render(buildModel(data/)) produces`,
    'run `npm run dialogue:extract`');
  check(strayEndings(dlgRaw, eol) === 0, `${DLG} is all ${eol === '\r\n' ? 'CRLF' : 'LF'}`, `${strayEndings(dlgRaw, eol)} stray`);
  const parsed = parse(dlgRaw);
  check(problems(model, parsed).length === 0, `${DLG} agrees with npcs.json, mystery.json and quests/`,
    problems(model, parsed).slice(0, 3).join('; '));
  // The annotations are load-bearing rather than decoration: every `?` in the
  // file is a press or a quest stage that really exists, and every `!` is a
  // clue mystery.json really sources on that state.
  const conds = parsed.flatMap((p) => p.states.flatMap((s) => s.conditions.map((c) => c.text)));
  const presses = disk.mystery.presses.map((p) => `press ${p.from.join(' ')} on ${p.on}`);
  const stages = disk.quests.flatMap((q) => Object.entries(q.stages).filter(([, s]) => s.dialogueState).map(([id]) => `quest ${q.id} at ${id}`));
  check(conds.length === presses.length + stages.length,
    `${conds.length} "?" lines, one for each of ${presses.length} presses and ${stages.length} quest stages`);
  const effects = parsed.flatMap((p) => p.states.flatMap((s) => s.effects));
  const sourced = disk.mystery.clues.filter((c) => c.source && c.source.npc);
  check(effects.length === sourced.length,
    `${effects.length} "!" lines, one for each of the ${sourced.length} clues mystery.json sources on a speaker`);
}

/* ------------------------------------------ 6: compiling writes nothing --- */
console.log('\ncompiling the committed .dlg writes nothing');
{
  const parsed = parse(dlgRaw);
  for (const [ending, source] of bothEndings(disk.npcsText)) {
    const out = applyToNpcs(source, parsed);
    check(out === source, `${ending}: data/npcs.json comes back byte for byte`,
      `${out.length - source.length} bytes of difference`);
  }
  for (const [id, text] of disk.questTexts)
    for (const [ending, source] of bothEndings(text)) {
      const out = applyToQuest(source, id, parsed);
      check(out === source, `${ending}: data/quests, ${id}, comes back byte for byte`);
    }

  // And a real edit of each kind lands where it should. This is the half that
  // says the compile does something, because part 6's headline is that it does
  // nothing.
  const edited = JSON.parse(JSON.stringify(parsed));
  edited[1].states[1].lines[0] = 'A line the suite put in the Steward\'s mouth.';
  for (const [ending, source] of bothEndings(disk.npcsText)) {
    const out = applyToNpcs(source, edited);
    const after = JSON.parse(out);
    check(after.cast[1].dialogue.admits[0] === 'A line the suite put in the Steward\'s mouth.',
      `${ending}: an edited "|" line lands in npcs.json`);
    const before = JSON.parse(source);
    before.cast[1].dialogue.admits[0] = 'A line the suite put in the Steward\'s mouth.';
    check(JSON.stringify(after) === JSON.stringify(before), `${ending}: and changes nothing else`);
    check(strayEndings(out, eolOf(source)) === 0, `${ending}: and leaves no stray line ending`);
  }
  const reworded = JSON.parse(JSON.stringify(parsed));
  const target = reworded.flatMap((p) => p.states.flatMap((s) => s.conditions)).find((c) => c.kind === 'quest' && c.quest === 'cooks-knife');
  target.objective = 'An objective the suite wrote.';
  for (const [ending, source] of bothEndings(disk.questTexts.get('cooks-knife'))) {
    const out = applyToQuest(source, 'cooks-knife', reworded);
    const after = JSON.parse(out);
    check(after.stages[target.stage].objective === 'An objective the suite wrote.',
      `${ending}: an edited "%" objective lands in the quest file`);
    const before = JSON.parse(source);
    before.stages[target.stage].objective = 'An objective the suite wrote.';
    check(JSON.stringify(after) === JSON.stringify(before), `${ending}: and changes nothing else in it`);
    check(strayEndings(out, eolOf(source)) === 0, `${ending}: and leaves no stray line ending`);
  }
}

/* ------------------------------------------------- 7: the refusals ------- */
console.log('\nthe refusals: every rule broken on purpose once');
{
  const head = '@ constable | Sir Roger Lestrange | Constable | inner\n: default\n';
  const refuses = (text, why, want) => {
    const msg = threw(() => parse(text));
    check(msg !== null && (!want || msg.includes(want)), `parse refuses ${why}`, msg === null ? 'it did not' : msg);
  };
  refuses('| a line\n', 'a line before any speaker', 'before any state');
  refuses(': default\n| a line\n', 'a state before any speaker', 'before any speaker');
  refuses('@ constable | a | b | inner\n| a line\n', 'a line before any state', 'before any state');
  refuses('@ a | b | c\n', 'a speaker with three fields', 'four fields');
  refuses('@ a | b | c | d\n@ a | b | c | d\n', 'the same speaker twice', 'already had');
  refuses(`${head}: default\n`, 'the same state twice', 'already had');
  refuses(`${head}| a line\n? press default on x\n`, 'a condition after the lines', 'conditions come first');
  refuses(`${head}| a line\n! says x\n`, 'an effect after the lines', 'effects come first');
  refuses(`${head}% an objective\n`, 'an objective with no quest above it', 'no "? quest"');
  refuses(`${head}? press default on x\n% an objective\n`, 'an objective under a press', 'only a quest stage');
  refuses(`${head}? quest q at s\n% one\n% two\n`, 'two objectives for one stage', 'already had');
  refuses(`${head}? quest q at s\n| a line\n`, 'a quest stage with no objective', 'no "%" objective');
  refuses(`${head}|\n`, 'an empty line of dialogue', 'empty line');
  refuses(`${head}+ what is this\n`, 'a line with no sigil', 'no sigil');
  refuses('@ constable | a | b | inner\n: a|b\n| a line\n', 'a state name with a pipe in it', '"|" in it');
  refuses('@constable | a | b | c\n', 'a sigil with no space after it', 'space after the sigil');

  const says = (mutate, why, want) => {
    const bad = JSON.parse(JSON.stringify(parse(dlgRaw)));
    mutate(bad);
    const found = problems(model, bad);
    check(found.some((p) => p.includes(want)), `check refuses ${why}`, found.length ? found.join('; ') : 'it found nothing');
  };
  says((m) => m.splice(3, 1), 'a speaker dropped out of the file', 'run extract');
  says((m) => m.push({ id: 'ghost', name: 'n', role: 'r', ward: 'outer', states: [] }), 'a speaker who is not in the cast', "not in npcs.json's cast");
  says((m) => { const [a, b] = [m[0], m[1]]; m[0] = b; m[1] = a; }, 'the speakers reordered', 'wrong order');
  says((m) => { m[0].name = 'Sir Roger Le Strange'; }, 'a name that has drifted from npcs.json', 'the name is');
  says((m) => { m[0].ward = 'outer'; }, 'a ward that has drifted', 'the ward is');
  says((m) => m[1].states.splice(1, 1), 'a state dropped out of the file', 'run extract');
  says((m) => m[1].states.push({ state: 'invented', conditions: [], effects: [], lines: ['x'] }), 'a state nothing reaches', 'which nothing in npcs.json');
  says((m) => { const s = m[1].states; [s[0], s[1]] = [s[1], s[0]]; }, 'the states reordered', 'wrong order');
  says((m) => { m[1].states[1].conditions[0].text = 'press default on something-else'; }, 'a press that is not in mystery.json', 'the clue graph says');
  says((m) => { m[1].states[1].effects[0] = 'says something-else'; }, 'a clue that is not sourced there', "mystery.json's clues say");
  says((m) => { m[0].states[0].lines = []; }, 'a state with no lines', 'no "|" lines');

  // And the two writes refuse rather than guessing.
  check(threw(() => applyToNpcs(disk.npcsText, [{ id: 'ghost', states: [] }])) !== null,
    'applyToNpcs refuses a speaker npcs.json has not got');
  check(threw(() => applyToQuest(disk.questTexts.get('cooks-knife'), 'cooks-knife',
    [{ id: 'cook', states: [{ state: 'x', conditions: [{ kind: 'quest', quest: 'cooks-knife', stage: 'nowhere', objective: 'z' }], effects: [], lines: [] }] }])) !== null,
    'applyToQuest refuses a stage the quest has not got');
  check(threw(() => locate(disk.npcsText, ['cast', 0, 'dialogue', 'no-such-state'])) !== null,
    'locate refuses a path that is not there rather than editing nothing (#13)');
}

console.log(`\n${failures ? `${failures} failure(s)` : 'all good'}`);
process.exit(failures ? 1 : 0);
