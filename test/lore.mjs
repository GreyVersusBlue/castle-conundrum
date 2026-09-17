// lore.mjs — the canon in src/lore.js, run without a browser.
//
//   node test/lore.mjs        (from the repo root)
//
// Exits non-zero on any failure. In the CI matrix, Node only, cheap: no
// browser, no build.
//
// WHY THIS EXISTS. data/lore.json is sixty-odd invented facts, thirteen
// documents and a chatter pool of twenty-seven pairs, and every cross-reference
// among them is exactly the kind of mistake that is silent on the screen: a
// source citing a document that does not cite it back opens a reading pane
// with no journal entry to show for it, a contradiction between two `history`
// facts is the canon disagreeing with itself in the one kind it promised not
// to, and a document whose slab in documents.json is not the slab
// scene-config.json builds is a prompt on one spot and a room check on
// another (#557). src/lore.js is the net; this suite proves it actually
// catches what it claims to (#34), the same discipline test/save.mjs and
// test/mystery.mjs use.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLore, untoldFacts } from '../src/lore.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const clone = (v) => JSON.parse(JSON.stringify(v));

const lore = read('data/lore.json');
const { documents } = read('data/documents.json');
const npcsFile = read('data/npcs.json');
const npcs = npcsFile.cast;
const chatter = npcsFile.chatter;
const mystery = read('data/mystery.json');
const { builtProps } = read('data/scene-config.json');

const args = { documents, npcs, chatter, mystery, builtProps };

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** Does any problem in the list mention this substring? */
const names = (problems, needle) => problems.some((p) => p.includes(needle));

/* --------------------------------------------------- 1: the green baseline --- */
console.log('the canon, as shipped');
{
  const problems = validateLore(lore, args);
  check(problems.length === 0, 'validates clean', JSON.stringify(problems));
  check(lore.facts.length >= 60, `at least sixty facts (${lore.facts.length})`);
  check(documents.length === 13, `thirteen documents (${documents.length})`, documents.map((d) => d.id).join(', '));
  const pairs = Object.values(chatter).flatMap((w) => Object.values(w)).flat();
  check(pairs.length === 27, `twenty-seven chatter pairs (${pairs.length})`);
  const told = new Set(lore.facts.flatMap((f) => f.sources.map((s) => s.kind)));
  check(['document', 'npc', 'chatter', 'epilogue'].every((k) => told.has(k)), 'all four source kinds are used, the epilogue included', [...told].join(', '));
  const kinds = new Set(lore.facts.map((f) => f.kind));
  check(['history', 'person', 'place', 'belief', 'rumour'].every((k) => kinds.has(k)), 'all five kinds are used', [...kinds].join(', '));
}

/* -------------------------------------------------------------- 2: untold --- */
console.log('untold facts: reported, not a failure');
{
  const untold = untoldFacts(lore);
  check(same(untold.sort(), ['prison-tower-origin', 'the-well'].sort()), 'exactly the two facts nobody tells, on purpose', untold.join(', '));
  check(validateLore(lore, args).length === 0, 'and validateLore does not fail on them — a check that only prints is not a check (#13), so this one does not print by failing');
}

/* ------------------------------------------------ 3: unknown source --- */
console.log('unknown source');
{
  const bad = clone(lore);
  bad.facts[0].sources = [...bad.facts[0].sources, { kind: 'document', id: 'the-lost-codex' }];
  const problems = validateLore(bad, args);
  check(names(problems, 'unknown source, no document "the-lost-codex"'), 'a source naming a document that does not exist', problems.join(' | '));
}
{
  const bad = clone(lore);
  bad.facts[0].sources = [{ kind: 'npc', npc: 'clerk', state: 'nowhere' }];
  check(names(validateLore(bad, args), 'clerk has no dialogue.nowhere'), 'a source naming an npc state that does not exist');
}
{
  const bad = clone(lore);
  bad.facts[0].sources = [{ kind: 'chatter', id: 'no-such-pair' }];
  check(names(validateLore(bad, args), 'no chatter pair "no-such-pair"'), 'a source naming a chatter pair that does not exist');
}
{
  const bad = clone(lore);
  bad.facts[0].sources = [{ kind: 'epilogue', id: 'acquitted' }];
  check(names(validateLore(bad, args), 'is not an epilogue or day-two ending'), 'a source naming an epilogue key that does not exist');
}
{
  const bad = clone(lore);
  bad.facts[0].sources = [{ kind: 'oracle', id: 'x' }];
  check(names(validateLore(bad, args), 'unknown source'), 'a source of a kind that does not exist');
}
{
  // The document exists, but its own `cites` does not name the fact back:
  // reachable, but not actually telling it.
  const badDocs = clone(documents);
  badDocs.find((d) => d.id === 'kings-writ').cites = badDocs.find((d) => d.id === 'kings-writ').cites.filter((id) => id !== 'kingdom-vantry');
  const problems = validateLore(lore, { ...args, documents: badDocs });
  check(names(problems, 'names document kings-writ as a source, but that document\'s own `cites` does not name kingdom-vantry back'), 'a document that stops citing what a fact says it tells', problems.join(' | '));
}

/* ----------------------------------------------------- 4: dangling id --- */
console.log('dangling id');
{
  const bad = clone(lore);
  bad.facts.find((f) => f.id === 'bell-recast-rumour').contradicts = ['no-such-fact'];
  check(names(validateLore(bad, args), 'contradicts no-such-fact, which is not a fact (dangling id)'), 'contradicts naming a fact that does not exist');
}
{
  const badDocs = clone(documents);
  badDocs.find((d) => d.id === 'works-ledger').cites.push('no-such-fact');
  check(names(validateLore(lore, { ...args, documents: badDocs }), 'cites no-such-fact, which is not a fact in data/lore.json'), 'a document citing a fact that does not exist');
}
{
  const badChatter = clone(chatter);
  badChatter.outer.prime[0].cites = ['no-such-fact'];
  check(names(validateLore(lore, { ...args, chatter: badChatter }), 'cites no-such-fact, which is not a fact (dangling id)'), 'a chatter pair citing a fact that does not exist');
}

/* ------------------------------------------------------ 5: contradiction --- */
console.log('a contradiction between two facts that are not belief or rumour');
{
  // The real pair: a `history` fact and the `rumour` that contradicts it. Legal.
  check(validateLore(lore, args).length === 0, 'bell-cast-history vs. bell-recast-rumour is legal as shipped: one side is a rumour');
  const bad = clone(lore);
  const rumour = bad.facts.find((f) => f.id === 'bell-recast-rumour');
  rumour.kind = 'history'; // both sides history now, and they still disagree
  const problems = validateLore(bad, args);
  check(names(problems, 'and neither is a belief nor a rumour'), 'turn the rumour into a second history fact and the same contradiction fails', problems.join(' | '));
  check(names(problems, 'bell-cast-history'), 'and it names the fact on the other side of the disagreement');
}
{
  const bad = clone(lore);
  bad.facts.find((f) => f.id === 'town-of-mereford').contradicts = ['sir-walter-esturmy'];
  check(names(validateLore(bad, args), 'and neither is a belief nor a rumour'), 'two facts that simply do not belong together — place and person, neither a belief or rumour — still fail if made to contradict');
}

/* ------------------------------------------------ 6: an unreachable document --- */
console.log('a document nobody can reach');
{
  check(validateLore(lore, args).length === 0, 'as shipped, all thirteen documents sit somewhere the player can reach');
  const badDocs = clone(documents);
  badDocs.find((d) => d.id === 'kings-writ').room = 'cell';
  const problems = validateLore(lore, { ...args, documents: badDocs });
  check(names(problems, 'kings-writ: placed in cell, which is barred and behind no lock that ever opens'), 'moved into the barred, never-opened cell, the writ becomes unreachable', problems.join(' | '));
  // The muniment room is not this failure: it is barred in effect by the
  // word-lock, but `mystery.json`'s own `locks` names it, so it opens.
  check(!names(validateLore(lore, args), 'muniment'), 'the muniment room itself is not flagged: the word-lock is a lock the mystery names, not a room barred forever');
  const badRoom = clone(documents);
  badRoom.find((d) => d.id === 'gate-book').room = 'nowhere-at-all';
  check(names(validateLore(lore, { ...args, documents: badRoom }), 'gate-book: in no room'), 'a room id that does not exist at all is caught the same way');
}

/* ------------------------------------------- 8: one slab, written twice --- */
console.log('a document and its slab');
{
  check(validateLore(lore, args).length === 0, 'as shipped, every document is the slab scene-config.json builds for it');
  const moved = clone(builtProps);
  moved.find((b) => b.read === 'gate-book').tile[0] += 0.25;
  const problems = validateLore(lore, { ...args, builtProps: moved });
  check(names(problems, 'gate-book: data/documents.json and the builtProps entry gate-book describe different slabs (tile'), 'a slab nudged a quarter of a metre in scene-config.json alone', problems.join(' | '));
  const thinner = clone(builtProps);
  thinner.find((b) => b.read === 'gravestone').size[1] = 0.1;
  check(names(validateLore(lore, { ...args, builtProps: thinner }), 'gravestone: data/documents.json and the builtProps entry gravestone describe different slabs (size'), 'a slab given a different height in scene-config.json alone');
  const recoloured = clone(builtProps);
  recoloured.find((b) => b.read === 'kings-writ').material = 'oak';
  check(names(validateLore(lore, { ...args, builtProps: recoloured }), 'describe different slabs (material "parchment" vs "oak")'), 'a slab given a different material in scene-config.json alone');
  const unbuilt = builtProps.filter((b) => b.read !== 'watch-bill');
  check(names(validateLore(lore, { ...args, builtProps: unbuilt }), 'watch-bill: no builtProps entry in data/scene-config.json carries read: "watch-bill"'), 'a document with no slab at all');
  const orphan = [...clone(builtProps), { id: 'ghost', read: 'ghost', material: 'oak', tile: [0, 0], base: 0, size: [0.1, 0.1, 0.1] }];
  check(names(validateLore(lore, { ...args, builtProps: orphan }), 'ghost: builtProps entry carries read: "ghost", which is not a document'), 'a slab whose read id is not a document');
  check(validateLore(lore, { ...args, builtProps: undefined }).length === 0, 'and without builtProps the check is skipped rather than failed, so a caller with no scene config still validates the rest');
}

/* --------------------------------------------------------- 7: chatter --- */
console.log('chatter: the existing twelve only, and their own ward');
{
  const badChatter = clone(chatter);
  badChatter.outer.prime[0].npcs = ['inspector', 'cook'];
  check(names(validateLore(lore, { ...args, chatter: badChatter }), 'arrives on day 2 and is not one of the existing twelve'), 'the thirteenth, the inspector, cannot chatter — he has not dismounted yet');
}
{
  const badChatter = clone(chatter);
  badChatter.outer.prime[0].npcs = ['constable', 'cook']; // constable's own ward is inner
  check(names(validateLore(lore, { ...args, chatter: badChatter }), "own ward is \"inner\", not outer"), 'an npc placed in a ward that is not their own');
}
{
  const badChatter = clone(chatter);
  badChatter.outer.prime[0].npcs = ['nobody-at-all', 'cook'];
  check(names(validateLore(lore, { ...args, chatter: badChatter }), 'is not in the cast'), 'a chatter pair naming somebody who does not exist');
}
{
  const badChatter = clone(chatter);
  badChatter.outer.prime[0].lines = ['only one line'];
  check(names(validateLore(lore, { ...args, chatter: badChatter }), 'fewer than two non-empty lines'), 'a pair with fewer than two lines');
}
{
  const badChatter = clone(chatter);
  badChatter.outer.prime.push({ ...clone(badChatter.outer.prime[0]), id: badChatter.outer.prime[0].id });
  check(names(validateLore(lore, { ...args, chatter: badChatter }), 'id used twice'), 'two chatter pairs sharing one id');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
