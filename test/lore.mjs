// lore.mjs — the canon in src/lore.js, run without a browser.
//
//   node test/lore.mjs        (from the repo root)
//
// Exits non-zero on any failure. In the CI matrix, Node only, cheap: no
// browser, no build.
//
// WHY THIS EXISTS. data/lore.json is sixty-odd invented facts, thirteen
// documents, a chatter pool of twenty-seven pairs and seven performed pieces
// (two sermons, two songs and three rumours, #592 and #648), and every
// cross-reference among them is
// exactly the kind of mistake that is silent on the screen: a source citing a
// document that does not cite it back opens a reading pane
// with no journal entry to show for it, a contradiction between two `history`
// facts is the canon disagreeing with itself in the one kind it promised not
// to, and a document whose slab in documents.json is not the slab
// scene-config.json builds is a prompt on one spot and a room check on
// another (#557), and a sermon said in a room its speaker is never in at that
// bell is a caption in an empty chapel. src/lore.js is the net; this suite
// proves it actually catches what it claims to (#34), the same discipline
// test/save.mjs and test/mystery.mjs use.
//
// AND SINCE #646, A FACT THAT CHANGES. `since` rows replace a fact's text
// once the verdict is in, and the `rumours` pool is what says the changed
// text out loud. That pair is the one thing in this file that can be wrong in
// two directions at once: a row nothing tells is canon in a drawer, and a
// piece heard where its row does not apply is the castle and the canon saying
// different things in the same play. Section 10 breaks both.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLore, untoldFacts, factText } from '../src/lore.js';

/** The one fact in the canon that changes with what the player did (#646). */
const THE_FACT = 'the-clerk-who-asked';
const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const clone = (v) => JSON.parse(JSON.stringify(v));

const lore = read('data/lore.json');
const { documents } = read('data/documents.json');
const npcsFile = read('data/npcs.json');
const npcs = npcsFile.cast;
const chatter = npcsFile.chatter;
const performances = npcsFile.performances;
const mystery = read('data/mystery.json');
const { builtProps } = read('data/scene-config.json');

const args = { documents, npcs, chatter, performances, mystery, builtProps };

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
  const pieces = Object.values(performances).flat();
  check(pieces.length === 7, `seven performed pieces (${pieces.length})`, pieces.map((e) => e.id).join(', '));
  const told = new Set(lore.facts.flatMap((f) => f.sources.map((s) => s.kind)));
  check(['document', 'npc', 'chatter', 'epilogue', 'performance'].every((k) => told.has(k)), 'all five source kinds are used, the epilogue and the performances included', [...told].join(', '));
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
  bad.facts[0].sources = [{ kind: 'performance', id: 'no-such-sermon' }];
  check(names(validateLore(bad, args), 'no performance "no-such-sermon"'), 'a source naming a performance that does not exist');
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

/* --------------------------------------------- 9: the sermons and the songs ---
 * The two set pieces (#592). What makes a performance harder to get wrong than
 * a chatter pair is that it names a room and a bell, and data/mystery.json
 * already says who is standing where at every one of them, so every break below
 * is a fact about the castle and not a spelling. */
console.log('the sermons and the songs: said where the speaker actually stands');
{
  check(validateLore(lore, args).length === 0, 'as shipped, all seven pieces are said by somebody who is really in that room at that bell');
  const pools = Object.keys(performances);
  check(same(pools.sort(), ['rumours', 'sermons', 'songs']), 'three pools, sermons, songs and rumours', pools.join(', '));
  const day2 = Object.values(performances).flat().filter((e) => e.watch === mystery.day2.watch);
  check(day2.length === 4, `four pieces are said on the morning after (${day2.map((e) => e.id).join(', ')})`);
  check(performances.rumours.every((e) => e.watch === mystery.day2.watch), 'and every rumour is one of them: a rumour is about a verdict, and only the morning after has one');
}
{
  const bad = clone(performances);
  bad.songs.find((e) => e.id === 'song-vespers-hall').room = 'kitchen';
  check(names(validateLore(lore, { ...args, performances: bad }), 'sentry stands in great-hall at vespers, not in kitchen'), 'a song moved to a room its singer is not in');
}
{
  // The check is about the station and not about the bell: the chaplain is in
  // his chapel at all four, so the sermon may move to any of them, and the cook
  // may not say it at any of them.
  const moved = clone(performances);
  moved.sermons.find((e) => e.id === 'sermon-vespers-osyth').watch = 'prime';
  check(validateLore(lore, { ...args, performances: moved }).length === 0, 'the sermon moved to Prime still validates: the chaplain is in the chapel at every bell', JSON.stringify(validateLore(lore, { ...args, performances: moved })));
  const wrongMouth = clone(moved);
  wrongMouth.sermons.find((e) => e.id === 'sermon-vespers-osyth').npc = 'cook';
  check(names(validateLore(lore, { ...args, performances: wrongMouth }), 'cook stands in kitchen at prime, not in chapel'), 'and put in the mouth of somebody who is somewhere else at that bell, it fails');
}
{
  const bad = clone(performances);
  bad.sermons.find((e) => e.id === 'sermon-lauds-cadeyrn').npc = 'prisoner';
  bad.sermons.find((e) => e.id === 'sermon-lauds-cadeyrn').room = 'cell';
  check(names(validateLore(lore, { ...args, performances: bad }), 'prisoner is gone from the castle at lauds in at least one ending'), 'a morning-after piece given to a man the player may have hanged');
}
{
  const bad = clone(performances);
  bad.sermons.find((e) => e.id === 'sermon-vespers-osyth').npc = 'inspector';
  check(names(validateLore(lore, { ...args, performances: bad }), 'arrives on day 2 and is not one of the existing twelve'), 'the thirteenth cannot perform at one of the four bells either: he has not dismounted yet');
}
{
  const bad = clone(performances);
  bad.songs.push({ ...clone(bad.sermons[0]), id: 'a-second-sermon', cites: [] });
  check(names(validateLore(lore, { ...args, performances: bad }), 'performance a-second-sermon: sermon-vespers-osyth answers for chapel at vespers in every ending and journal this piece claims'), 'two pieces wanting the same room at the same bell: the second is the one nobody would ever hear');
}
{
  const bad = clone(performances);
  bad.songs.find((e) => e.id === 'song-sext-kitchen').room = 'nowhere-at-all';
  check(names(validateLore(lore, { ...args, performances: bad }), 'in no room ("nowhere-at-all")'), 'a room id that does not exist');
  const late = clone(performances);
  late.songs.find((e) => e.id === 'song-sext-kitchen').watch = 'compline';
  check(names(validateLore(lore, { ...args, performances: late }), 'is not one of the four bells nor "lauds"'), 'a bell this castle does not ring');
}
{
  const bad = clone(performances);
  bad.songs.find((e) => e.id === 'song-sext-kitchen').lines = ['one line only'];
  check(names(validateLore(lore, { ...args, performances: bad }), 'fewer than two non-empty lines'), 'a piece with one line');
  const empty = clone(performances);
  empty.sermons.find((e) => e.id === 'sermon-vespers-osyth').lines[2] = '   ';
  check(names(validateLore(lore, { ...args, performances: empty }), 'fewer than two non-empty lines'), 'and a piece with a blank line in the middle of it');
}
{
  // Both directions, the way a document and a chatter pair are already held.
  const bad = clone(performances);
  bad.songs.find((e) => e.id === 'song-vespers-hall').cites = bad.songs.find((e) => e.id === 'song-vespers-hall').cites.filter((id) => id !== 'march-song');
  check(names(validateLore(lore, { ...args, performances: bad }), "names performance song-vespers-hall as a source, but that piece's own `cites` does not name march-song back"), 'a piece that stops citing what a fact says it tells');
  const dangling = clone(performances);
  dangling.sermons.find((e) => e.id === 'sermon-lauds-cadeyrn').cites.push('no-such-fact');
  check(names(validateLore(lore, { ...args, performances: dangling }), 'performance sermon-lauds-cadeyrn: cites no-such-fact, which is not a fact (dangling id)'), 'a piece citing a fact that does not exist');
  const oneWay = clone(performances);
  oneWay.songs.find((e) => e.id === 'song-sext-kitchen').cites.push('the-well');
  check(names(validateLore(lore, { ...args, performances: oneWay }), "performance song-sext-kitchen: cites the-well, but that fact's own sources do not name song-sext-kitchen back"), 'and a piece citing a fact that does not name it back');
}
{
  const bad = clone(performances);
  bad.ballads = [clone(bad.songs[0])];
  check(names(validateLore(lore, { ...args, performances: bad }), 'pool "ballads" is not sermons, songs or rumours'), 'a fourth pool nothing plays');
}

/* ------------------------------ 10: a fact that changes, and what says it ---
 * `since` and the `rumours` pool (#646 to #649). What makes this harder to get wrong
 * than a `cites` is that there are two files and seven endings: the canon says
 * one thing per ending and journal, the castle says one thing per ending and
 * journal, and nothing on the screen would ever tell you they had come apart,
 * because data/lore.json is not read by the page at all. Every break below is
 * one of those two halves moving without the other. */
console.log('\na fact that changes with what the player did');

const clerk = lore.facts.find((f) => f.id === THE_FACT);
const outcome = (key, cls) => ({ key, class: cls, who: key });
const breakSince = (fn) => { const bad = clone(lore); fn(bad.facts.find((f) => f.id === THE_FACT)); return validateLore(bad, args); };
const breakPool = (fn) => { const bad = clone(performances); fn(bad); return validateLore(lore, { ...args, performances: bad }); };

{
  check(!!clerk && clerk.kind === 'rumour', `${THE_FACT} is in the canon, and it is a rumour`, clerk?.kind);
  check(clerk.since.length === 3, `three since rows (${clerk.since?.length})`);
  check(clerk.since.every((r) => performances.rumours.some((e) => e.id === r.tells)), 'each one names the rumour piece that says it', clerk.since.map((r) => r.tells).join(', '));
  check(performances.rumours.every((e) => asList(e.cites).includes(THE_FACT)), 'and all three pieces cite it back');
}
{
  // THE RESOLVER, ACROSS THE FIVE ANSWERS THE DATA ACTUALLY HAS. `factText` is
  // the whole of what a reader of the canon has to call, and the base text is
  // what every play that matches no row still gets (#573's rule, in the canon).
  check(factText(clerk) === clerk.text, 'day one, with no verdict at all, is the fact as written');
  check(factText(clerk, outcome('prisoner', 'wrong'), ['gaol-dates']) === clerk.since[0].text, 'the smith hanged and the roll in the journal is the sharpest row, which is written first');
  check(factText(clerk, outcome('prisoner', 'wrong'), []) === clerk.since[2].text, 'the smith hanged and the roll never read falls past it to the general one');
  check(factText(clerk, { key: 'nobody', class: 'fall', who: 'nobody' }) === clerk.since[1].text, 'nobody hanged is its own row');
  check(factText(clerk, { key: 'full', class: 'full', who: 'steward' }, ['gaol-dates']) === clerk.since[2].text, 'and the full ending, holding the roll, is the general one: the roll only sharpens the ending it is about');
  const noRows = clone(clerk); delete noRows.since;
  check(factText(noRows, outcome('prisoner', 'wrong'), ['gaol-dates']) === clerk.text, 'a fact with no since at all answers the same thing on both days');
}
{
  // THE VOCABULARY. SPECS.md asked for exactly these two by name: a `since`
  // naming an ending or a clue the mystery has not got.
  check(names(breakSince((f) => { f.since[0].when = ['nobody-at-all']; }), 'when names "nobody-at-all", which is not an ending this mystery can reach'), 'a since row keyed on an ending that does not exist');
  check(names(breakSince((f) => { f.since[0].knew = ['no-such-clue']; }), 'knew names "no-such-clue", which is not a clue in data/mystery.json'), 'and one keyed on a clue that does not exist');
  check(names(breakSince((f) => { f.since[0].knew = ['gaol-roll']; }), 'knew names "gaol-roll", which is not a clue'), 'including the evidence id where the clue id was meant, which is the spelling most likely to be made');
}
{
  // A ROW THAT CHANGES NOTHING, THREE WAYS.
  check(names(breakSince((f) => { f.since[1].unless = ['nobody']; }), 'since[1]: applies to no ending, so the canon never says it'), 'a row whose when and unless cancel');
  check(names(breakSince((f) => { f.since[0].text = clerk.text; }), 'the same text the fact already has, so nothing changes'), 'a row that restates the fact word for word');
  check(names(breakSince((f) => { f.since[0].text = '   '; }), 'no text, so the fact would change into nothing'), 'and a row with nothing in it');
  const twice = breakSince((f) => { f.since[1] = { ...clone(f.since[0]), text: 'Different words, and the same key as the row above it.' }; });
  check(names(twice, 'keyed exactly as since[0], and only the first would be read'), 'two rows keyed alike, which order cannot resolve');
}
{
  // TOLD, AND TOLD ONLY WHERE IT IS TRUE. This is the pair the whole section
  // is for: the canon and the castle are two files and nothing on the screen
  // would show them disagreeing.
  check(names(breakSince((f) => { delete f.since[0].tells; }), 'no `tells`, so nothing in the castle says the changed fact'), 'a row nothing in the castle says');
  check(names(breakSince((f) => { f.since[0].tells = 'no-such-piece'; }), 'tells "no-such-piece", which is not a performance'), 'a row naming a piece that does not exist');
  check(names(breakSince((f) => { f.since[0].tells = 'sermon-lauds-cadeyrn'; }), "tells sermon-lauds-cadeyrn, but that piece's own `cites` does not name the-clerk-who-asked back"), 'a row naming a real piece that does not cite it');
  // The row narrows and the piece does not: the guardroom still says the
  // roll version to a player who never read the roll.
  const drift = breakSince((f) => { f.since[0].when = ['full']; });
  check(names(drift, 'rumour-lauds-roll is heard after the verdict prisoner holding gaol-dates, which this row does not apply to'), 'a row narrowed without the piece that says it, so the castle would say what the canon does not');
}
{
  // THE POOL'S OWN RAILS, which are the two #592 rails made conditional.
  const gone = breakPool((p) => { p.rumours[0].npc = 'prisoner'; p.rumours[0].room = 'cell'; });
  check(names(gone, 'prisoner is gone from the castle at lauds in at least one ending this piece applies to (prisoner)'), 'a rumour put in the mouth of the man that very ending hanged');
  const alive = breakPool((p) => { p.rumours[0].npc = 'prisoner'; p.rumours[0].room = 'cell'; p.rumours[0].when = ['nobody']; p.rumours[0].knew = undefined; });
  check(!names(alive, 'is gone from the castle'), 'and the same piece under when: ["nobody"] is allowed, because that is the one ending he is alive for, which the old rail could not say', JSON.stringify(alive));
  check(names(breakPool((p) => { p.songs[0].when = ['nobody']; }), 'carries when/unless/knew at sext, and a verdict is a thing only lauds has'), 'a condition on a piece said at one of the four bells, where no verdict exists yet');
  check(names(breakPool((p) => { p.rumours[1].unless = ['nobody']; }), 'performance rumour-lauds-nobody: applies to no ending'), 'a rumour whose when and unless cancel');
  const shadowed = breakPool((p) => { p.rumours.push({ ...clone(p.rumours[2]), id: 'rumour-lauds-fourth' }); });
  check(names(shadowed, 'rumour-lauds-fourth: rumour-lauds-roll and rumour-lauds-nobody and rumour-lauds-hanged answer for guardroom at lauds in every ending and journal this piece claims'), 'a fourth rumour in the guardroom that the three above it answer for everywhere');
  // AND THE ORDER IS LOAD-BEARING: the sharp one below the general one is the
  // sharp one nobody ever hears.
  const flipped = breakPool((p) => { p.rumours = [p.rumours[2], p.rumours[1], p.rumours[0]]; });
  check(names(flipped, 'rumour-lauds-roll'), 'the three written in the other order: the narrow piece under the wide one is never heard', JSON.stringify(flipped));
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
