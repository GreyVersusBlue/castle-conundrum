// mystery.mjs — the mystery in data/mystery.json, validated and played in Node.
//
//   node test/mystery.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure. In the CI matrix (site-ci.yml).
//
// WHY THIS EXISTS. Phase 1 of the v2 plan ships the mystery as data before any
// room it happens in exists (WISHLIST.md). Nothing on screen can say whether
// thirty-nine clues, eight presses, a twelve-by-four schedule and an
// accusation table are coherent, and every mistake in them is silent: a
// deduction whose premise nothing grants, a press keyed on a clue that is only
// held after it fires, a statement the schedule makes unspeakable, a clue that
// leads nowhere and does not say so. This file is the check on the data, and
// the engine the page will call in Phase 7 is driven here through the intended
// path and the wrong endings.
//
// Five parts:
//   1. validateMystery finds nothing, and the counts are what the plan says
//   2. the validator rejects each of the four breaks WISHLIST.md names, with
//      the message it names, plus the rails around them
//   3. discoverability: every clue is held somewhere on the day, and the
//      shortest full-ending path is printed in watches and interactions
//   4. the engine, end to end: the intended path to the full ending; the
//      prisoner on nothing; the Steward on two; the porter on one, refused;
//      three refusals ending as a fall; and what a reload has to survive
//   5. the frame in quest.json validates with the manager's actions, and the
//      engine's events drive it to the right terminal

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMystery, createMystery, earliest, shortestPath, freshState } from '../src/mystery.js';
import { QuestGraph, validateQuest, validateAgainstNpcs } from '../src/quest-graph.js';
import { QuestManager } from '../src/quest-manager.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const mystery = read('data/mystery.json');
const { cast } = read('data/npcs.json');
const quest = read('data/quest.json');
const frame = quest.frame;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ------------------------------------------------- 1: the data validates --- */
console.log('mystery.json validates');
{
  const problems = validateMystery(mystery, cast, frame);
  check(problems.length === 0, 'validateMystery finds nothing wrong', problems.join('; '));
  const herrings = mystery.clues.filter((c) => c.herring).length;
  check(mystery.clues.length === 39 && herrings === 3, `${mystery.clues.length} clues, ${herrings} herrings (the plan's table lists 39 rows: 36 on a path, 3 herrings)`);
  check(cast.length === 12, `${cast.length} in the cast`);
  check(Object.keys(mystery.schedule).length === 12 && mystery.watches.length === 4, 'twelve schedules across four watches');
  check(mystery.presses.length === 8, `${mystery.presses.length} presses`);
  const bodies = new Set(cast.map((n) => n.modelPath));
  check(bodies.size === 3 && cast.every((n) => /^#[0-9a-f]{6}$/i.test(n.tint)), 'three bodies, twelve tints (#419)', [...bodies].join(', '));
  check(new Set(cast.map((n) => n.tint)).size === 12, 'no two of the twelve share a tint');
  // Every evidence row names a prop that is already on disk (Phase 1 ships no
  // asset): a kit .glb, or a Poly Haven .gltf under the project's own folder.
  const config = read('data/scene-config.json');
  const missing = mystery.evidence.filter((e) => {
    const rel = e.prop.endsWith('.glb') ? path.join(config.kenneyBase, e.prop) : path.join(config.polyhavenBase, e.prop);
    return !fs.existsSync(path.join(ROOT, rel));
  }).map((e) => `${e.id}: ${e.prop}`);
  check(missing.length === 0, 'every evidence prop is a model already on disk', missing.join('; '));
  const lies = ['steward', 'clerk', 'porter', 'chaplain', 'merchant'];
  check(lies.every((id) => mystery.presses.some((p) => p.npc === id)), 'every NPC who lies can be pressed', lies.join(', '));
}

/* ----------------------------------------------- 2: the validator rejects --- */
console.log('the validator rejects');
{
  const broken = (mutate) => { const m = clone(mystery); const n = clone(cast); const f = clone(frame); mutate(m, n, f); return validateMystery(m, n, f); };
  const expect = (label, mutate, re) => {
    const p = broken(mutate);
    const hit = p.find((x) => re.test(x));
    check(!!hit, `rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
    if (hit) console.log(`          said: ${hit}`);
  };
  // The four breaks WISHLIST.md's Phase 1 entry names, each with its message.
  expect("lady-hand with no source (`summons-is-stewards: premise lady-hand is discoverable from nothing`)",
    (m) => { delete m.clues.find((c) => c.id === 'lady-hand').source; },
    /^summons-is-stewards: premise lady-hand is discoverable from nothing/);
  expect("the steward-admits press deleted (`chaplain-feet: its press is on a clue that cannot be held`)",
    (m) => { m.presses = m.presses.filter((p) => !(p.npc === 'steward' && p.to === 'admits')); },
    /^chaplain-feet: its press is on a clue that cannot be held/);
  expect("sentry-sighting at Prime only, while the sentry sleeps (`available at prime, when the sentry cannot be spoken to about it`)",
    (m) => { m.clues.find((c) => c.id === 'sentry-sighting').source.watches = ['prime']; },
    /^sentry-sighting: available at prime, when the sentry cannot be spoken to about it/);
  expect("knife-found without its herring flag (`knife-found: on no path to any accusation`)",
    (m) => { delete m.clues.find((c) => c.id === 'knife-found').herring; },
    /^knife-found: on no path to any accusation$/);
  // The rails around them.
  expect('a clue with no source', (m) => { delete m.clues.find((c) => c.id === 'cook-lantern').source; }, /^cook-lantern: no source$/);
  expect('a source naming an npc not in the cast', (m) => { m.clues.find((c) => c.id === 'cook-lantern').source.npc = 'scullion'; }, /^cook-lantern: source npc scullion is not in the cast/);
  expect('a source naming a state the npc lacks', (m) => { m.clues.find((c) => c.id === 'cook-lantern').source.state = 'confesses'; }, /^cook-lantern: source state cook\/confesses/);
  expect('an npc state no press and no stage reaches', (m, n) => { n.find((x) => x.id === 'cook').dialogue.furious = ['Out!']; }, /^cook: state furious is reached by no press and no stage$/);
  expect('evidence in no room', (m) => { m.evidence.find((e) => e.id === 'cloak').room = 'attic'; }, /^cloak: in no room/);
  expect('evidence in no watch', (m) => { m.evidence.find((e) => e.id === 'cloak').watches = []; }, /^cloak: in no watch$/);
  expect('a statement only available when the npc is not in the castle', (m) => { m.clues.find((c) => c.id === 'merchant-stone').source.watches = ['sext']; }, /^merchant-stone: available at sext, when the merchant cannot be spoken to about it/);
  expect('a press on a clue that cannot be held before the state it leaves from (a cycle)',
    (m) => { m.presses.find((p) => p.npc === 'steward').on = 'steward-admits'; },
    /^steward-admits: its press is on a clue that cannot be held \(steward-admits\)/);
  expect('a deduction whose premises are not both discoverable', (m) => { m.evidence.find((e) => e.id === 'candle').watches = []; }, /^wax-matches: premise chapel-candle is discoverable from nothing/);
  expect('a convicts entry naming no clue', (m) => { m.accusation.convicts.porter.push('nowhere'); }, /^convicts porter: nowhere is not a clue/);
  expect('a convicts entry naming an undiscoverable clue', (m) => { m.evidence.find((e) => e.id === 'tally').watches = []; }, /^convicts clerk: tally-on-walk is not discoverable/);
  expect('an accusable with no verdict text', (m) => { delete m.accusation.verdicts.porter; }, /^verdicts: porter can be accused and has no verdict text/);
  expect('a truth.who with a convicts list shorter than needs', (m) => { m.accusation.convicts.clerk = ['tally-on-walk']; }, /^accusation: truth.who clerk has a convicts list shorter than needs/);
  expect('the shortest convicting path under two watches (the Constable hearing an accusation at Prime)', (m) => { m.accusation.from = 'prime'; }, /shortest convicting path is 1 watch/);
  expect('the shortest convicting path over three watches', (m) => {
    // Every convicting clue of the Clerk's pushed to Vespers: the sentry speaks
    // only then, the cloak and the tally are found only then, the lady and the
    // chaplain are elsewhere until then.
    m.clues.find((c) => c.id === 'sentry-sighting').source.watches = ['vespers'];
    m.evidence.find((e) => e.id === 'cloak').watches = ['vespers'];
    m.evidence.find((e) => e.id === 'tally').watches = ['vespers'];
    for (const w of ['prime', 'terce', 'sext']) { m.schedule.lady[w] = null; m.schedule.chaplain[w] = null; }
  }, /shortest convicting path is 4 watches/);
  expect('a herring that convicts someone', (m) => { m.accusation.convicts.porter.push('knife-found'); }, /^knife-found: marked herring but convicts someone/);
  expect('a tint that is not a hex', (m, n) => { n.find((x) => x.id === 'cook').tint = 'flour'; }, /^cook: tint "flour" is not a #rrggbb hex/);
  expect('a stage dialogueState the cast lacks', (m, n, f) => { f.stages.arrive.dialogueState = 'hushed'; }, /^constable: no dialogue.hushed lines for a stage/);
}

/* ----------------------------------------------- 3: discoverability --- */
console.log('discoverability');
{
  const { clueAt } = earliest(mystery, cast);
  const never = [...clueAt].filter(([, at]) => !Number.isFinite(at)).map(([id]) => id);
  check(never.length === 0, 'every clue can be held at some watch', never.join(', '));
  const byWatch = mystery.watches.map((w, i) => `${w} ${[...clueAt.values()].filter((at) => at === i).length}`);
  console.log(`          first held at: ${byWatch.join(', ')}`);
  check(clueAt.get('sentry-sighting') === 1 && clueAt.get('merchant-cart') === 1, 'the sentry and the cart wait for Terce');
  const full = shortestPath(mystery, cast, { full: true });
  const right = shortestPath(mystery, cast, { full: false });
  check(full && full.watches >= 2 && full.watches <= 3, `the shortest full-ending path takes ${full?.watches} watches and ${full?.interactions} interactions`, JSON.stringify(full));
  console.log(`          clues: ${full.clues.join(', ')}`);
  console.log(`          actions: ${full.actions.join(', ')}, ${full.watches - 1} ring(s), 1 accusation`);
  check(right && right.watches >= 2 && right.interactions <= full.interactions, `the shortest right-hanging path takes ${right?.watches} watches and ${right?.interactions} interactions`);
  check(full.clues.includes(mystery.accusation.truth.motive), 'the full ending carries the motive');
}

/* -------------------------------------------- 4: the engine, end to end --- */
console.log('the engine');
const events = (fx) => fx.filter((e) => e.type === 'event').map((e) => e.name);
const clueIds = (fx) => fx.filter((e) => e.type === 'clue').map((e) => e.id);
function play(state = freshState(frame)) {
  const m = createMystery({ mystery, npcs: cast, state });
  const g = new QuestGraph(frame, QuestManager.actions);
  g.begin();
  const fed = [];
  const feed = (fx) => { for (const ev of events(fx)) { const out = g.dispatch(ev); if (out.length) fed.push(ev); } return fx; };
  return { m, g, fed, feed, state };
}
{
  // The intended path (WISHLIST.md, The intended path), watch by watch.
  const { m, g, feed, state } = play();
  check(m.watch === 'prime' && g.stage === 'arrive', 'a fresh day starts at Prime, in `arrive`');

  // Prime.
  let fx = feed(m.talk('constable'));
  check(clueIds(fx).includes('constable-accident') && g.stage === 'investigate', 'the Constable: "He fell", and the frame moves to investigate');
  fx = m.examine('body');
  check(clueIds(fx).includes('body-stair'), 'the body at the stair foot');
  fx = m.examine('pouch');
  check(clueIds(fx).includes('summons-note') && clueIds(fx).includes('pouch-empty') && state.taken.includes('pouch'), 'the pouch: the note and no tallies, and it is taken');
  check(m.examine('pouch')[0].type === 'gone', 'taken evidence is gone');
  fx = m.talk('cook');
  check(clueIds(fx).includes('cook-lantern') && clueIds(fx).includes('lantern-set-down'), 'the cook, and the deduction lands the instant its second premise does', clueIds(fx).join(', '));
  check(clueIds(fx).includes('knife-missing'), 'the herring comes with her');
  fx = m.talk('porter');
  check(clueIds(fx).includes('porter-log') && clueIds(fx).includes('porter-barred'), 'the porter: the log, and "barred as always"');
  fx = m.examine('cloak');
  check(clueIds(fx).includes('cloak-wax'), 'the cloak in the laundry');
  fx = m.talk('apprentice');
  check(clueIds(fx).includes('apprentice-tallies') && clueIds(fx).includes('tallies-taken') && clueIds(fx).includes('hywel-sober'), 'the apprentice: the tallies, and tallies-taken deduced');
  fx = m.talk('chaplain');
  check(!clueIds(fx).length, 'the chaplain says nothing yet');
  check(m.press('chaplain', 'steward-admits')[0].type === 'shrug', 'pressing with a clue not held is a shrug');
  check(m.talk('sentry').length === 0 && m.available('sentry') === null, 'the sentry is asleep at Prime and cannot be spoken to');
  check(m.available('merchant') === null, 'the merchant is not in the castle at Prime');
  check(m.examine('cart')[0].type === 'absent', 'the cart is not there at Prime');
  fx = m.accuse('clerk', ['lantern-set-down', 'tallies-taken']);
  check(fx[0].type === 'early' && state.refusals === 0 && state.accusations.length === 0, 'the Constable hears no accusation at Prime, and it is not a refusal', fx[0].type);

  // Ring.
  fx = feed(m.ring());
  check(m.watch === 'terce' && events(fx).includes('bell:1') && fx.some((e) => e.type === 'stations'), 'the first bell: Terce, stations move');
  check(m.stationOf('sentry').room === 'north-walk' && m.stationOf('merchant').room === 'outer-ward', 'the sentry is on the north walk and the merchant at the cart');

  // Terce.
  fx = m.examine('cart');
  check(clueIds(fx).includes('merchant-cart'), 'under the sacking: the lead');
  fx = m.talk('merchant');
  check(clueIds(fx).includes('merchant-stone'), '"I buy stone"');
  fx = m.press('merchant', 'merchant-cart');
  check(fx[0].type === 'state' && fx[0].state === 'admits' && clueIds(fx).includes('merchant-admits'), 'pressed with the cart, the merchant admits');
  fx = m.talk('sentry');
  check(clueIds(fx).includes('sentry-sighting'), 'the sentry, awake, saw fur on the walk');
  fx = m.enter('cross-walk', 2);
  check(clueIds(fx).includes('walk-crosses'), 'walking the cross-wall walk grants walk-crosses');
  fx = m.examine('walk-door');
  check(clueIds(fx).includes('door-unbarred'), 'the Stockhouse door, unbarred');
  fx = m.examine('tally');
  check(clueIds(fx).includes('tally-on-walk') && state.taken.includes('tally'), 'the tally stick in the gutter, taken');
  fx = m.examine('candle');
  check(clueIds(fx).includes('chapel-candle') && clueIds(fx).includes('wax-matches'), 'the candle, and wax-matches deduced against the cloak');

  // Ring.
  feed(m.ring());
  check(m.watch === 'sext' && m.examine('cloak')[0].type === 'absent', 'Sext: the cloak has been washed');

  // Sext.
  fx = m.talk('lady');
  check(clueIds(fx).includes('lady-hand') && clueIds(fx).includes('summons-is-stewards'), "the lady's sevens, and the note is the Steward's");
  fx = m.press('lady', 'walk-crosses');
  check(clueIds(fx).includes('lady-window'), 'presented with the walk, she says what she saw');
  fx = m.press('steward', 'summons-is-stewards');
  check(clueIds(fx).includes('steward-admits') && m.npcState('steward') === 'admits', 'the Steward admits the summons');
  check(m.press('steward', 'summons-is-stewards')[0].type === 'shrug', 'pressing him again from `admits` moves nobody');
  fx = m.press('chaplain', 'steward-admits');
  check(clueIds(fx).includes('chaplain-feet'), 'the chaplain heard two men');
  check(m.examine('ledger')[0].type === 'locked', 'the ledger is behind the lock');
  fx = m.examine('lock');
  check(clueIds(fx).includes('word-lock'), 'the word-lock is a clue');
  check(m.examine('ledger')[0].type === 'locked' && m.examine('ledger')[0].lock === 'muniment', 'and still locked until the riddle opens it');
  fx = m.unlock('muniment');
  check(fx[0].type === 'unlocked' && state.locks.includes('muniment'), 'riddle:solved opens the muniment room');
  fx = m.examine('ledger');
  check(clueIds(fx).includes('ledger') && clueIds(fx).includes('lead-sold'), 'the ledger, and lead-sold deduced against the apprentice');
  fx = m.press('clerk', 'wax-matches');
  check(clueIds(fx).includes('clerk-cloak'), '"since Sunday"');
  fx = m.press('clerk', 'lead-sold');
  check(clueIds(fx).includes('clerk-cornered') && m.npcState('clerk') === 'cornered', 'the Clerk, cornered, from the cloak state');

  // Ring.
  feed(m.ring());
  check(m.watch === 'vespers' && m.stationOf('porter').room === 'cross-walk', 'Vespers: the porter is on the cross-wall walk');
  fx = m.press('porter', 'door-unbarred');
  check(clueIds(fx).includes('porter-admits'), 'the porter admits the door');

  const held = state.clues.length;
  const skipped = ['steward-denies', 'clerk-abed', 'prisoner-story', 'laundress-cloak', 'knife-found', 'nest-is-wife'];
  check(held === 33 && skipped.every((id) => !state.clues.includes(id)), `${held} clues held: all but the four default lies the path never asks for and the two herrings it never finds`, state.clues.join(', '));
  check(m.journal().length === held && m.journal().every((j) => j.title && j.text), 'the journal lists them with title and text');

  // The accusation.
  fx = feed(m.accuse('clerk', ['sentry-sighting', 'wax-matches', 'lead-sold']));
  const v = fx.find((e) => e.type === 'verdict');
  check(v && v.class === 'full' && /Ferrour hangs/.test(v.convicted) && /Wykes/.test(v.epilogue), 'the Clerk on the sighting, the wax and the lead: the full ending', JSON.stringify(v?.class));
  check(g.stage === 'full' && g.done, 'the frame ends in `full`');
  check(state.accusations.length === 1 && state.accusations[0].verdict === 'full' && state.accusations[0].watch === 'vespers', 'the accusation is recorded');
  check(m.ring().length === 0 && m.accuse('steward', []).length === 0, 'after the verdict the bell and the Constable are done');
}
{
  // The fourth bell forces it.
  const { m, g, feed } = play();
  feed(m.talk('constable'));
  for (let i = 0; i < 3; i++) feed(m.ring());
  const fx = feed(m.ring());
  check(fx.some((e) => e.type === 'demand') && events(fx).includes('bell:4') && g.stage === 'accusing' && m.watch === 'vespers', 'the fourth ring: the Constable demands, the frame is in `accusing`, the watch stays at Vespers');
}
{
  // The prisoner, on nothing, at Terce: the ending the Constable wanted.
  const { m, g, feed } = play();
  feed(m.talk('constable'));
  feed(m.ring());
  const fx = feed(m.accuse('prisoner', []));
  const v = fx.find((e) => e.type === 'verdict');
  check(v && v.class === 'wrong' && /Madoc/.test(v.convicted) && g.stage === 'wrong', 'the prisoner hangs on no clues at all', v?.class);
}
{
  // The Steward on two of his four: a wrong hanging of a guilty man.
  const { m, g, feed } = play();
  feed(m.talk('constable')); m.examine('pouch'); m.talk('lady'); m.press('steward', 'summons-is-stewards');
  feed(m.ring());
  const fx = feed(m.accuse('steward', ['summons-is-stewards', 'steward-admits']));
  const v = fx.find((e) => e.type === 'verdict');
  check(v && v.class === 'wrong' && /Marrable hangs/.test(v.convicted) && /Ferrour, who did/.test(v.epilogue) && g.stage === 'wrong', 'the Steward on two: hanged for the wrong crime, and the epilogue says who did it');
}
{
  // The Clerk without the motive: the right hanging, the Steward keeps his post.
  const { m, g, feed } = play();
  feed(m.talk('constable')); m.examine('cloak'); m.examine('candle'); m.examine('tally');
  feed(m.ring());
  const fx = feed(m.accuse('clerk', ['wax-matches', 'tally-on-walk']));
  const v = fx.find((e) => e.type === 'verdict');
  check(v && v.class === 'right' && g.stage === 'right', 'the Clerk on two without lead-sold: right, not full');
}
{
  // The porter on one: refused; three refusals: a fall.
  const { m, g, feed, state } = play();
  feed(m.talk('constable')); m.talk('porter'); m.examine('walk-door');
  feed(m.ring());
  const kind = (fx) => fx.filter((e) => e.type !== 'event').map((e) => e.type);
  let fx = feed(m.accuse('porter', ['porter-barred']));
  check(kind(fx)[0] === 'refused' && state.refusals === 1 && g.stage === 'accusing', 'the porter on one clue is refused, and the frame is in `accusing`', `${kind(fx)} / ${g.stage}`);
  fx = feed(m.accuse('porter', ['door-unbarred']));
  check(kind(fx)[0] === 'refused' && state.refusals === 2, 'a clue that is not on his list does not count');
  fx = feed(m.accuse('cook', ['porter-barred', 'door-unbarred']));
  const v = fx.find((e) => e.type === 'verdict');
  check(kind(fx)[0] === 'refused' && v && v.class === 'fall' && v.exhausted && g.stage === 'fall', 'the third refusal ends the day as a fall', JSON.stringify(kind(fx)));
  check(state.accusations.length === 4 && state.accusations.at(-1).who === 'nobody', 'three refusals and the fall are all recorded');
}
{
  // Nobody: a fall by choice.
  const { m, g, feed } = play();
  feed(m.talk('constable')); feed(m.ring());
  const fx = feed(m.accuse('nobody', []));
  check(fx.find((e) => e.type === 'verdict')?.class === 'fall' && g.stage === 'fall', 'calling it a fall is a fall');
}
{
  // A reload mid-day: the state object is the save, and a second engine on it
  // continues from where the first stopped.
  const { m, state } = play();
  m.talk('constable'); m.examine('pouch'); m.talk('lady'); m.press('steward', 'summons-is-stewards'); m.ring();
  const copy = clone(state);
  const m2 = createMystery({ mystery, npcs: cast, state: copy });
  check(m2.watch === 'terce' && m2.holds('summons-is-stewards') && m2.npcState('steward') === 'admits' && m2.examine('pouch')[0].type === 'gone', 'a second engine on a copied state resumes at Terce with the Steward pressed and the pouch gone');
  check(m2.press('steward', 'summons-is-stewards')[0].type === 'shrug', 'and does not let the press fire twice');
}

/* ------------------------------------------------------------ 5: the frame --- */
console.log('the frame');
{
  const p = validateQuest(frame, QuestManager.actions);
  check(p.length === 0, 'quest.frame validates with the manager\'s actions', p.join('; '));
  const q = validateAgainstNpcs(frame, cast);
  check(q.length === 0, 'every frame stage has lines on every one of the twelve', q.join('; '));
  const terminals = Object.entries(frame.stages).filter(([, s]) => s.terminal).map(([id]) => id).sort();
  check(JSON.stringify(terminals) === JSON.stringify(['fall', 'full', 'right', 'wrong']), 'one terminal per verdict class', terminals.join(', '));
  check(['ringBell', 'openJournal', 'openAccusation', 'showEpilogue'].every((a) => QuestManager.actions.includes(a)), 'the manager lists the four new actions');
  check(frame.start === 'arrive' && frame.stages.investigate.transitions.some((t) => t.on === 'bell:4' && t.to === 'accusing'), 'arrive first; the fourth bell moves investigate to accusing');
  // The page still plays the riddle quest: the top-level graph is untouched by the frame.
  check(quest.start === 'seek-keystone' && validateQuest(quest, QuestManager.actions).length === 0, 'the riddle quest at the top level still validates (the page plays it until Phase 7)');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
