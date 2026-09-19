// mystery.mjs — the mystery in data/mystery.json, validated and played in Node.
//
//   node test/mystery.mjs        (from the repo root)
//
// Exits non-zero on any failure. In the CI matrix (site-ci.yml).
//
// WHY THIS EXISTS. Phase 1 of the v2 plan ships the mystery as data before any
// room it happens in exists (PLAN.md). Nothing on screen can say whether
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
//   2. the validator rejects each of the four breaks PLAN.md names, with
//      the message it names, plus the rails around them
//   3. discoverability: every clue is held somewhere on the day, and the
//      shortest full-ending path is printed in watches and interactions
//   4. the engine, end to end: the intended path to the full ending; the
//      prisoner on nothing; the Steward on two; the porter on one, refused;
//      three refusals ending as a fall; and what a reload has to survive
//   5. the frame in quest.json validates with the manager's actions, and the
//      engine's events drive it to the right terminal
//   6. the household in data/populace.json, on the same grid and by the same
//      rails as the twelve's own stations (#529: this file owns the stations,
//      and a routine's tile is a station question)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMystery, createMystery, earliest, shortestPath, freshState, dayTwoOutcomes, dayTwoLines, dayTwoKnew } from '../src/mystery.js';
import { QuestGraph, validateQuest, validateAgainstNpcs } from '../src/quest-graph.js';
import { QuestManager, MANAGER_PAIRS } from '../src/quest-manager.js';
import { makePlan, EYE_HEIGHT } from '../src/castle-plan.js';
import { castleNav } from '../src/stations.js';
import { validatePopulace, ACTIVITY_CLIPS, populaceDefs, Populace } from '../src/populace.js';
import { partsOf, readGLTF } from './gltf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const mystery = read('data/mystery.json');
const { cast } = read('data/npcs.json');
// Phase 7 promoted the frame: `quest` is the graph the page plays, and `frame`
// is the same object. The name stays because the rails below and PLAN.md
// both call it the frame, and because it says what this file drives.
const quest = read('data/quest.json');
const frame = quest;
// The side quests (rank 9). validateMystery's dialogue-reachability rail is the
// one thing in this file they touch: a knife state on the cook is reached by a
// file in data/quests/ rather than by a press or a stage.
const sideQuests = (read('data/quests/index.json').quests ?? []).map((f) => read(`data/quests/${f}`));
const populace = read('data/populace.json');

/* The castle itself, for the station rails (Phase 6). One read per glTF file;
 * `makePlan` asks for the same wall model seven times over a run, and a broken
 * copy of scene-config.json below builds a second plan from the same cache. */
const measured = new Map();
const boundsOf = (rel) => {
  if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel)));
  return measured.get(rel);
};
const config = read('data/scene-config.json');
const plan = makePlan(config, boundsOf);
const nav = castleNav(plan, mystery);

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ------------------------------------------------- 1: the data validates --- */
console.log('mystery.json validates');
{
  const problems = validateMystery(mystery, cast, frame, nav, sideQuests);
  check(problems.length === 0, 'validateMystery finds nothing wrong, the castle included', problems.join('; '));
  const herrings = mystery.clues.filter((c) => c.herring).length;
  // 39 when Phase 1 shipped; the gaol roll's three are increment 3's (#571).
  check(mystery.clues.length === 42 && herrings === 3, `${mystery.clues.length} clues, ${herrings} herrings (the plan's table lists 39 rows, 36 on a path and 3 herrings; the gaol roll adds three more on a path)`);
  const dayOne = cast.filter((n) => (n.arrives ?? 1) === 1);
  const dayTwo = cast.filter((n) => (n.arrives ?? 1) > 1);
  check(cast.length === 13 && dayOne.length === 12 && dayTwo.length === 1,
    `${cast.length} in the cast: the twelve of the day, and ${dayTwo.map((n) => n.name).join(', ')} who rides in the morning after`);
  check(Object.keys(mystery.schedule).length === 12 && mystery.watches.length === 4, 'twelve schedules across four watches');
  check(mystery.presses.length === 9, `${mystery.presses.length} presses`);
  const bodies = new Set(cast.map((n) => n.modelPath));
  check(bodies.size === 4 && cast.every((n) => /^#[0-9a-f]{6}$/i.test(n.tint)), 'four bodies, thirteen tints (#419, #603)', [...bodies].join(', '));
  // What the fourth is for (#603). Read off the data, so a woman put back on a
  // man's body is named, and so is a man put on hers.
  const WOMEN = ['cook', 'laundress', 'lady'];
  const hers = new Set(cast.filter((n) => WOMEN.includes(n.id)).map((n) => n.modelPath));
  const strays = [
    ...(hers.size === 1 ? [] : cast.filter((n) => WOMEN.includes(n.id)).map((n) => `${n.id} wears ${n.modelPath}`)),
    ...cast.filter((n) => !WOMEN.includes(n.id) && hers.has(n.modelPath)).map((n) => `${n.id} wears ${n.modelPath} too`),
  ];
  check(strays.length === 0, "four bodies, and the three women share the one that is a woman's", strays.join('; '));
  check(new Set(cast.map((n) => n.tint)).size === 13, 'no two of the thirteen share a tint');
  // Every evidence row names a prop that is already on disk (Phase 1 ships no
  // asset): a kit .glb, or a Poly Haven .gltf under the project's own folder.
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
  // A broken copy gets its own nav, because the schedule it is built from is
  // the thing being broken; a break in scene-config.json gets its own plan too.
  const broken = (mutate) => {
    const m = clone(mystery); const n = clone(cast); const f = clone(frame); const c = clone(config);
    mutate(m, n, f, c);
    const p = JSON.stringify(c) === JSON.stringify(config) ? plan : makePlan(c, boundsOf);
    return validateMystery(m, n, f, castleNav(p, m), sideQuests);
  };
  const expect = (label, mutate, re) => {
    const p = broken(mutate);
    const hit = p.find((x) => re.test(x));
    check(!!hit, `rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
    if (hit) console.log(`          said: ${hit}`);
  };
  // The four breaks PLAN.md's Phase 1 entry names, each with its message.
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
  expect('an npc state no press, no stage and no side quest reaches', (m, n) => { n.find((x) => x.id === 'cook').dialogue.furious = ['Out!']; }, /^cook: state furious is reached by no press, no stage and no side quest$/);
  // And the side quests are only an excuse for the person they name. `broken`
  // below hands validateMystery the real side quests; this asserts that dropping
  // them puts the cook's three knife states straight back on the list, which is
  // the break that proves the new clause is load-bearing rather than always-true
  // (#34). Its twin, a knife state moved onto somebody else, is the second case.
  {
    const p = validateMystery(mystery, cast, frame, nav, []);
    check(p.filter((x) => /^cook: state knife-.* is reached by no press, no stage and no side quest$/.test(x)).length === 3,
      'and without data/quests/ the cook’s three knife states are unreached again', p.join('; ') || 'said nothing');
    const moved = clone(cast);
    moved.find((x) => x.id === 'steward').dialogue['knife-hunting'] = ['Not mine.'];
    const q = validateMystery(mystery, moved, frame, nav, sideQuests);
    check(q.some((x) => /^steward: state knife-hunting is reached by no press, no stage and no side quest$/.test(x)),
      'and a side quest excuses a state only on the person it names', q.join('; ') || 'said nothing');
  }
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

  // The station rails (Phase 6), and the two breaks PLAN.md's Phase 6 entry
  // names first. Each one is a change to the castle or to the schedule, not to
  // the assertion: the message has to come out of the geometry.
  /* THE KITCHEN HAS TWO DOORS, AND PLAN.md'S NAMED BREAK ONLY SHUTS ONE.
   * Walling `kitchen-south` was meant to strand the cook, and it does not: the
   * Kitchen Tower's own ground door opens south into the kitchen and its stair
   * runs up to the wall walk, so she goes out through the larder, along the
   * north walk, down another tower and into the hall — 196 cells instead of
   * 45. That is Phase 5's lesson arriving a second time ("the walk joins the
   * towers", #455), and it is asserted here rather than excused: the check
   * below is that walling one door does NOT strand her, so that deleting the
   * tower's door or its flight one day fails here and says why. The break the
   * plan wanted is both doors, and that is the one that fires. */
  const bothKitchenDoors = (c) => {
    delete c.walls.find((w) => w.id === 'kitchen-south').doorways;
    const larder = c.drums.find((d) => d.id === 'kitchen-tower');
    larder.interior.doors = larder.interior.doors.filter((d) => d.base);
  };
  {
    const c = clone(config);
    delete c.walls.find((w) => w.id === 'kitchen-south').doorways;
    const nav2 = castleNav(makePlan(c, boundsOf), mystery);
    const route = nav2.route(nav2.at('cook', 'sext'), nav2.at('cook', 'vespers'));
    check(route && route.length > 100, `walling the kitchen's south door alone leaves the cook the larder and the wall walk: ${route ? route.length - 1 : 0} cells to the Great Hall, against ${nav.route(nav.at('cook', 'sext'), nav.at('cook', 'vespers')).length - 1} with the door open`, route ? '' : 'she was stranded, so the tower door or its flight is gone');
  }
  expect("the kitchen walled up in scene-config.json, its south door and the larder's (`cook: no path from KI at sext to GH at vespers`)",
    (m, n, f, c) => bothKitchenDoors(c),
    /^cook: no path from KI at sext to GH at vespers$/);
  expect('two of the twelve on one tile at one watch',
    (m) => { m.schedule.cook.vespers.tile = [...m.schedule.constable.vespers.tile]; },
    /^constable and cook stand 0.00 m apart at vespers, inside the 1.5 m two bodies need$/);
  expect('a station inside a wall', (m) => { m.schedule.cook.prime.tile = [-3.5, -2.5]; }, /^cook: station at prime is at tile \(-3.5, -2.5\) on level 0, where there is no floor to stand on$/);
  expect('a station outside the room it names', (m) => { m.schedule.cook.prime.tile = [-5, -0.5]; }, /^cook: station at prime is at tile \(-5, -0.5\), which is not inside kitchen$/);
  // Lady Alys stood in the east barbican garden at Sext until this phase. The
  // east gate is shut and never opens (scene-config.json, and PLAN.md's
  // answered question 5), so the garden is scenery: nobody could ever have
  // walked to her there, and no rail before this one could say so.
  expect('a station the player cannot walk to', (m) => { m.schedule.lady.sext = { room: 'garden', tile: [7, -1.5] }; }, /^lady: station at sext is at tile \(7, -1.5\) in GD, which the player cannot walk to$/);
  expect('a station with no tile', (m) => { delete m.schedule.porter.prime.tile; }, /^porter: station at prime has no tile$/);

  /* THE SECOND DAY'S OWN BREAKS (#533 to #537). The morning after has seven
   * shapes and none of them is on the screen in Node, so what stands between a
   * day two and a castle that opens with a hanged man at his desk is these two
   * rails and nothing else. */
  expect('the `absent` rule switched off, so the man who hanged is at his station in the morning',
    (m) => { m.day2.absent.accused = false; },
    /^clerk: has a station at lauds and hangs in full, clerk$/);
  expect("the inspector's lines for a fall deleted",
    (m) => { delete m.day2.lines.inspector.nobody; },
    /^inspector: no day-two lines after the verdict nobody \(a fall\)$/);
  expect('a day-two line set no ending can reach',
    (m) => { m.day2.lines.cook.merchant = ['A merchant hanged and I am short a cart.']; m.day2.absent.also.merchant = ['cook']; },
    /^cook: day-two lines for merchant that no ending ever reaches$/);
  expect('a day-two station inside a wall',
    (m) => { m.day2.schedule.cook.tile = [-3.5, -2.5]; },
    /^cook: station at lauds is at tile \(-3.5, -2.5\) on level 0, where there is no floor to stand on$/);
  expect('two of the thirteen on one tile on the morning after',
    (m) => { m.day2.schedule.inspector.tile = [...m.day2.schedule.constable.tile]; },
    /^constable and inspector stand 0.00 m apart at lauds, inside the 1.5 m two bodies need$/);
  expect('the one whose conversation ends the day left out of the morning',
    (m) => { m.day2.schedule.inspector = null; },
    /^day2.ends: inspector has no station at lauds/);
  expect('a second day with no closing pane for one of the endings',
    (m) => { delete m.day2.endings.prisoner; },
    /^day2.endings: prisoner has no signed\/after text/);
  expect('the King\'s inspector given a day-one schedule as well',
    (m) => { m.schedule.inspector = { prime: null, terce: null, sext: null, vespers: null }; },
    /^inspector: arrives on day 2 and still has a day-one schedule$/);

  /* AND THE CASTLE'S HALF OF THE MORNING (#539). Six rails, each one a way for
   * `day2.castle` to name something the castle cannot do, and every one of them
   * silent until the one ending it was written for. */
  expect('a day-two change to a piece the castle does not build',
    (m) => { m.day2.castle[0].piece = 'gallows'; },
    /^day2\.castle\[0\]: the castle builds no piece called "gallows"$/);
  expect('a day-two change with a verb the builder does not have',
    (m) => { m.day2.castle[0].set = 'burn'; },
    /^day2\.castle\[0\]: `set` "burn" is not one of open, shut, gone, shown$/);
  expect('opening something that is not a gate leaf',
    (m) => { m.day2.castle[0].set = 'open'; },
    /^day2\.castle\[0\]: cell-bars is a fixture, and only a gate leaf can be open$/);
  expect('hiding a gate leaf instead of shutting it',
    (m) => { m.day2.castle[1].set = 'gone'; },
    /^day2\.castle\[1\]: muniment is a gate leaf, so say open or shut rather than gone$/);
  expect('a day-two change with no reason written down',
    (m) => { delete m.day2.castle[0].why; },
    /^day2\.castle\[0\]: no `why`, so nothing says what the verdict did to cell-bars$/);
  expect('a day-two change keyed on an ending that does not exist',
    (m) => { m.day2.castle[0].unless = ['acquitted']; },
    /^day2\.castle\[0\]: `unless` names "acquitted", which is neither an ending nor a verdict class$/);
  expect('a day-two change no ending ever reaches',
    (m) => { m.day2.castle[0].when = ['full']; m.day2.castle[0].unless = ['full']; },
    /^day2\.castle\[0\]: applies to no ending, so cell-bars never changes$/);
  expect('one piece set twice on one morning',
    (m) => { m.day2.castle.push({ piece: 'cell-bars', set: 'shown', why: 'x' }); },
    /^day2\.castle: cell-bars is set twice after the verdict full \(rows 0 and 3\), and only the last would show$/);
  expect('the floor of a room made to vanish',
    (m) => { m.day2.castle[0].piece = 'floor-muniment'; },
    /^day2\.castle\[0\]: floor-muniment is floor the player stands on, and hiding it leaves a hole nothing else can see$/);

  /* AND WHAT THE PLAYER READ (#573). `day2.knew` rows are the only thing on
   * the second day keyed by the journal rather than by the verdict, and every
   * way one can be dead is silent on the screen: the cascade behind it answers
   * in its place and the morning reads exactly as it did before the row was
   * written. Seven rails, one per way. */
  expect('a knew row for somebody not in the cast',
    (m) => { m.day2.knew[0].npc = 'gaoler'; },
    /^day2\.knew\[0\]: "gaoler" is not in the cast$/);
  expect('a knew row for somebody with no station on the morning after',
    (m) => { delete m.day2.schedule.inspector; },
    /^day2\.knew\[0\]: inspector has no station at lauds, so the lines are never spoken$/);
  expect('a knew row keyed on a clue the mystery does not have',
    (m) => { m.day2.knew[0].clue = 'gaol-hours'; },
    /^day2\.knew\[0\]: "gaol-hours" is not a clue, so nothing can be holding it$/);
  expect('a knew row keyed on a clue nothing in the castle yields',
    (m) => { m.evidence = m.evidence.filter((e) => e.id !== 'gaol-roll'); m.clues = m.clues.filter((c) => c.id !== 'gaol-dates' && c.id !== 'prisoner-inside' && c.id !== 'prisoner-forge'); m.presses = m.presses.filter((x) => x.to !== 'forge'); m.day2.knew = m.day2.knew.filter((r) => r.clue === 'gaol-dates'); m.day2.knew[0].clue = 'nest-is-wife'; m.clues.find((c) => c.id === 'nest-is-wife').source.state = 'nowhere'; },
    /^day2\.knew\[0\]: nest-is-wife is not discoverable, so nobody can ever be holding it at lauds$/);
  expect('a knew row with no lines in it',
    (m) => { m.day2.knew[0].lines = []; },
    /^day2\.knew\[0\]: no lines, so a player who knew would be told nothing$/);
  expect('a knew row with no reason written down',
    (m) => { delete m.day2.knew[0].why; },
    /^day2\.knew\[0\]: no `why`, so nothing says what the player knowing changes$/);
  expect('a knew row keyed on an ending that does not exist',
    (m) => { m.day2.knew[0].when = ['pardoned']; },
    /^day2\.knew\[0\]: `when` names "pardoned", which is neither an ending nor a verdict class$/);
  expect('a knew row on a morning its speaker is hanged on',
    (m) => { m.day2.knew[0].npc = 'porter'; m.day2.knew[0].when = ['porter']; },
    /^day2\.knew\[0\]: applies to no ending porter is alive and in the castle for, so the lines are never read$/);
  expect('two knew rows on one person and one clue that both fire on one morning',
    (m) => { m.day2.knew.push({ ...clone(m.day2.knew[0]), why: 'a second row nobody would ever read' }); },
    /^day2\.knew: inspector has two rows on gaol-dates that both fire after the verdict prisoner \(rows 0 and 3\), and only the first would be read$/);
}

/* -------------------------------------- 2b: the twelve on the castle floor ---
 * The positive half of the rails above, and Phase 6's exit line: twelve at
 * their Prime stations, and the bell rung four times moving every one of them
 * along a walk that exists. The count printed is the walk itself — cell
 * centres 0.5 m apart, so a route of 80 is a 40 m walk — and it is printed
 * rather than asserted because what makes it right is the castle, not a number
 * typed here.
 */
console.log('\nthe twelve, at their stations');
{
  const barred = new Set(mystery.rooms.filter((r) => r.barred).map((r) => r.id));
  const absent = cast.filter((n) => !nav.at(n.id, 'prime')).map((n) => n.id);
  check(absent.join() === 'merchant,inspector', `eleven of the twelve are in the castle at Prime; Thomas Wykes rides in at Terce and the King's inspector not until the next morning`, `absent: ${absent.join(', ') || 'nobody'}`);
  const offTheFloor = cast.filter((n) => { const p = nav.at(n.id, 'prime'); return p && !nav.standable(p); });
  check(offTheFloor.length === 0, 'every Prime station is floor a body stands on', offTheFloor.map((n) => n.id).join(', '));
  // THE COVERAGE GUARD FOR A CHECK IN ANOTHER FILE (#529). plan-vs-scene.mjs
  // reads the twelve bodies at Prime and asserts that whoever is upstairs is
  // standing on their own floor and not on the ground under it (#147). That
  // assertion says nothing at all on a day when nobody is upstairs at Prime,
  // and the browser suite used to carry the guard itself — which is a fact
  // about `mystery.json`'s schedule and belongs beside the schedule.
  const upstairsAtPrime = cast.filter((n) => (nav.at(n.id, 'prime')?.level ?? 0) > 0);
  check(upstairsAtPrime.length > 0,
    `${upstairsAtPrime.length} of the cast is upstairs at Prime, so plan-vs-scene.mjs's height check has something to check`,
    upstairsAtPrime.map((n) => n.id).join(', ') || 'nobody');
  const unreachable = cast.filter((n) => {
    const p = nav.at(n.id, 'prime');
    return p && !(barred.has(p.room) ? nav.talkable(p) : nav.walkable(p));
  });
  check(unreachable.length === 0, 'the player can walk to eleven of them and to the bars of the twelfth', unreachable.map((n) => n.id).join(', '));

  let moves = 0, steps = 0, missing = [];
  for (const n of cast) {
    let previous = null;
    for (const w of mystery.watches) {
      const point = nav.at(n.id, w);
      if (point && previous) {
        const route = nav.route(previous, point);
        if (!route) missing.push(`${n.id} to ${w}`);
        else { steps += route.length - 1; if (route.length > 1) moves += 1; }
      }
      if (point) previous = point;
    }
  }
  check(missing.length === 0, `the day's ${moves} moves are all walks that exist, ${steps} cells of walking in all`, missing.join('; '));
  const cook = nav.route(nav.at('cook', 'sext'), nav.at('cook', 'vespers'));
  check(cook && cook.length > 1, `the cook walks ${cook ? cook.length - 1 : 0} cells from the kitchen to the Great Hall at Vespers`);
  const porter = nav.route(nav.at('porter', 'sext'), nav.at('porter', 'vespers'));
  check(porter && porter.some((p) => p.level === 2), `the porter climbs to the cross-wall walk: ${porter ? porter.length - 1 : 0} cells, top level ${porter ? Math.max(...porter.map((p) => p.level)) : '-'}`);
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
  // The intended path (PLAN.md, The intended path), watch by watch.
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
  // THE MAP'S SET (#588). The first step into a room is a `visited` effect and
  // a room on the list; the second is neither, so the manager marks the
  // autosave once per room and not once per doorway.
  check(fx.some((e) => e.type === 'visited' && e.room === 'cross-walk') && state.visited.includes('cross-walk'), 'and the walk is on `visited`, with a `visited` effect saying so');
  fx = m.enter('cross-walk', 2);
  check(!fx.some((e) => e.type === 'visited') && state.visited.filter((r) => r === 'cross-walk').length === 1, 'a second step onto it is no effect and no second entry');
  check(clueIds(fx).length === 0, 'and grants nothing twice');
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
  // `full` is not terminal since #537: the epilogue's button goes to `morning`.
  check(g.stage === 'full' && !g.done, 'the frame reaches `full`, and it is a pane with a button on it rather than the end');
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
  check(p.length === 0, 'quest.json validates with the manager\'s actions', p.join('; '));
  const q = validateAgainstNpcs(frame, cast, { pairs: MANAGER_PAIRS });
  check(q.length === 0, 'every stage has lines on every one of the twelve, and both token pairs match', q.join('; '));
  const terminals = Object.entries(frame.stages).filter(([, s]) => s.terminal).map(([id]) => id).sort();
  check(JSON.stringify(terminals) === JSON.stringify(['end']), 'one terminal, and it is the end of the second day (#537)', terminals.join(', '));
  const verdictStages = ['full', 'right', 'wrong', 'fall'];
  check(verdictStages.every((id) => frame.stages[id] && !frame.stages[id].terminal), 'one stage per verdict class, none of them terminal any more', verdictStages.join(', '));
  check(verdictStages.every((id) => (frame.stages[id].transitions ?? []).some((t) => t.on === 'day:2' && t.to === 'morning')), 'and every one of them has a morning after to go to');
  check(['ringBell', 'openJournal', 'openAccusation', 'showEpilogue', 'applyDay'].every((a) => QuestManager.actions.includes(a)), 'the manager lists the five actions the graph names');
  check(frame.start === 'arrive' && frame.stages.investigate.transitions.some((t) => t.on === 'bell:4' && t.to === 'accusing'), 'arrive first; the fourth bell moves investigate to accusing');
  // Phase 7 deleted the riddle quest. Nothing in this file should be able to
  // find a second graph in quest.json, and the three stages it had are gone.
  check(!quest.frame, 'there is no `frame` key left: the frame is the graph');
  for (const dead of ['seek-keystone', 'present-keystone', 'gate-open']) {
    check(!quest.stages[dead], `the riddle quest's ${dead} is gone`);
  }
  for (const dead of ['openGate', 'showVictory']) {
    check(!QuestManager.actions.includes(dead), `the manager no longer lists ${dead}, which only the riddle quest used`);
  }
}

/* --------------------------------------------- 6: the morning after (#533) ---
 * Seven endings, seven mornings, and none of them is on a screen anywhere in
 * Node. What is driven here is the whole of a day two: end the first day in
 * each of the seven ways the accusation table can end it, press the button the
 * epilogue pane now carries, and walk into the castle it makes. The three
 * things that have to be true of every one of them are that the man who hanged
 * is not standing at a station, that the King's inspector is, and that talking
 * to him is the end of the game.
 */
console.log('\nthe morning after, seven times');
{
  const acc = mystery.accusation;
  const day2 = mystery.day2;
  /** End day one as `key` — an ending the accusation table can reach — and hand back the engine and the graph. */
  const endDayAs = (key) => {
    const { m, g, feed, state } = play();
    feed(m.talk('constable'));
    feed(m.ring());
    if (key === 'nobody') { feed(m.accuse('nobody', [])); return { m, g, feed, state }; }
    const who = key === 'full' ? acc.truth.who : key;
    const clues = (acc.convicts[who] ?? []).slice(0, acc.needs);
    if (key === 'full' && !clues.includes(acc.truth.motive)) clues.push(acc.truth.motive);
    for (const id of clues) m.discover(id);
    feed(m.accuse(who, clues));
    return { m, g, feed, state };
  };

  const outcomes = dayTwoOutcomes(mystery);
  check(outcomes.length === 7 && outcomes.map((o) => o.key).join() === Object.keys(acc.verdicts).join(),
    `${outcomes.length} endings, read off the accusation table rather than listed here`, outcomes.map((o) => `${o.key}/${o.class}`).join(', '));

  for (const o of outcomes) {
    const { m, g, feed, state } = endDayAs(o.key);
    if (!state.accusations.some((a) => a.verdict === o.class)) { fail(`${o.key}: the day did not end as a ${o.class}`); continue; }
    check(m.day === 1 && m.watch === 'vespers' || m.day === 1, `${o.key}: the day ends judged and still day one`, `day ${m.day}`);

    // The button. `day:2` is the event the epilogue pane dispatches.
    const before = g.stage;
    g.dispatch('day:2');
    check(g.stage === 'morning', `${o.key}: the button on the ${before} pane opens the morning`, g.stage);

    const day = m.beginDay2();
    check(day && day.watch === day2.watch && m.day === 2 && state.day === 2,
      `${o.key}: the engine is on day two at ${day2.watch}, and the save says so`, `${day?.watch} / day ${state.day}`);
    check(day.outcome.key === o.key && day.outcome.class === o.class && day.outcome.who === o.who,
      `${o.key}: and it read the ending off the accusation, not off a flag`, JSON.stringify(day.outcome));

    // The hanged man is not at a station, and neither is anyone the ending took.
    if (o.who !== 'nobody') {
      check(day.stations[o.who] === null && day.absent.includes(o.who),
        `${o.key}: ${o.who} hanged at first light and is not in the castle`, JSON.stringify(day.stations[o.who]));
      check(m.available(o.who) === null, `${o.key}: and cannot be spoken to`);
    } else {
      check(day.absent.length === 0, `a fall hangs nobody, so all thirteen are there`, day.absent.join(', '));
    }

    // The inspector, and the end.
    check(!!day.stations.inspector && day.ends === 'inspector', `${o.key}: the King's inspector is in ${day.stations.inspector?.room}`, JSON.stringify(day.ends));
    const said = m.available('inspector');
    check(!!said && day.lines.inspector?.length >= 2, `${o.key}: with ${day.lines.inspector?.length} lines of his own for this ending`, day.lines.inspector?.[0]?.slice(0, 48));
    // Everybody still standing has something to say, and nobody who is gone does.
    const silent = Object.keys(day.stations).filter((id) => day.stations[id] && !day.lines[id]);
    check(silent.length === 0, `${o.key}: all ${Object.values(day.stations).filter(Boolean).length} of them who are there have lines`, silent.join(', '));
    const ghosts = Object.keys(day.lines).filter((id) => !day.stations[id]);
    check(ghosts.length === 0, `${o.key}: and nobody who is gone was handed any`, ghosts.join(', '));

    feed(m.talk('inspector'));
    check(g.stage === 'end' && g.done, `${o.key}: the conversation with him is the end of the game`, g.stage);

    const ending = m.dayTwoEnding();
    check(ending && ending.signed.trim() && ending.after.trim(), `${o.key}: and the pane it ends on has a sheet and an after`, ending?.signed?.slice(0, 48));
  }
}

{
  // NOTHING FROM DAY ONE STILL WORKS ON DAY TWO. The bell is rung out, the
  // Constable has written his sheet, and the journal in the player's hand is
  // full of clues that moved people yesterday. A press that fired at Sext and
  // fires again at Lauds would be granting evidence against a verdict that is
  // already in the ground.
  const { m, g, feed, state } = play();
  feed(m.talk('constable'));
  feed(m.ring());
  m.discover('summons-is-stewards');
  feed(m.accuse('nobody', []));
  g.dispatch('day:2');
  m.beginDay2();
  check(m.press('steward', 'summons-is-stewards')[0].type === 'shrug' && m.npcState('steward') === 'default',
    'a press that would have moved the Steward at Sext moves nobody at Lauds');
  check(m.ring().length === 0 && m.watch === 'lauds', 'the bell rings nothing and the watch stays at Lauds', m.watch);
  check(m.accuse('clerk', []).length === 0, 'and there is no second accusation to make');
  check(m.examine('body')[0].type === 'absent', 'the body is not at the foot of the stair on the second morning');
  check(state.clues.length > 0 && m.journal().length === state.clues.length, 'the journal is still in his hand, though', `${m.journal().length} clues`);
}

{
  // A RELOAD ON THE MORNING AFTER. `day` is the one field version 2 added and
  // this is what it buys: a second engine on the same state comes back on day
  // two, at Lauds, with the same people missing.
  const { m, g, feed, state } = endDayTwoFall();
  const copy = clone(state);
  const m2 = createMystery({ mystery, npcs: cast, state: copy });
  check(m2.day === 2 && m2.watch === 'lauds', 'a second engine on a copied state resumes on the second day', `day ${m2.day} at ${m2.watch}`);
  check(!!m2.stationOf('inspector') && m2.beginDay2().outcome.class === 'fall', 'with the inspector where he was and the same verdict behind it');
  function endDayTwoFall() {
    const r = play();
    r.feed(r.m.talk('constable'));
    r.feed(r.m.ring());
    r.feed(r.m.accuse('nobody', []));
    r.g.dispatch('day:2');
    r.m.beginDay2();
    return r;
  }
}

/* --------------- 7: the gaol roll (#571), and the morning that knows it (#573) ---
 * The one piece of evidence in this castle that convicts nobody, and the one
 * thing on the second day keyed by what the player FOUND rather than by what
 * he SAID. Driven end to end: examine the roll in the guardroom, hold its
 * dates beside Madoc's own story, watch the deduction land, press him with it,
 * and then hang him anyway and read what the King's man says about it.
 */
console.log('\nthe gaol roll');
{
  const { m, feed } = play();
  check(m.examine('gaol-roll').some((e) => e.type === 'examined'), 'the roll is on the barrel-head in the guardroom at Prime');
  check(m.holds('gaol-dates') && !m.holds('prisoner-inside'), 'its dates are in the journal, and the deduction has not landed on them alone');
  const fx = feed(m.talk('prisoner'));
  check(clueIds(fx).includes('prisoner-story') && clueIds(fx).includes('prisoner-inside'),
    'Madoc talks, and the deduction lands the instant his story is beside the roll', clueIds(fx).join(', '));
  check(m.npcState('prisoner') === 'default', 'he is still in `default`, because a deduction is not a press');
  const pressed = m.press('prisoner', 'prisoner-inside');
  check(m.npcState('prisoner') === 'forge' && clueIds(pressed).includes('prisoner-forge'),
    'the roll read back to him moves him to `forge`, where he says what the cart weighed', clueIds(pressed).join(', '));
  // THE ROLL CONVICTS NOBODY, WHICH IS THE POINT OF IT (SPECS.md, A second
  // day). None of its three clues is in anybody's convicts list, and the
  // Constable still takes Madoc's name on nothing at all, because the castle
  // having the evidence and using the man anyway is what the second morning is
  // about. If a session ever wires one of these into `convicts`, this fails.
  const convicting = new Set(Object.values(mystery.accusation.convicts).flat());
  const ours = ['gaol-dates', 'prisoner-inside', 'prisoner-forge'];
  check(ours.every((id) => !convicting.has(id)), 'and not one of its three clues convicts anybody', ours.filter((id) => convicting.has(id)).join(', '));
}

{
  /* AND THE MORNING AFTER KNOWS. Two players, the same verdict: one who read
   * the roll and one who did not. The inspector's shipped `prisoner` lines say
   * nobody in this castle ever looked at it, which is true of the second man
   * and a lie to the first. The rail is that the two mornings differ, and that
   * the one that differs is the one holding the clue.
   */
  const hangMadoc = (read) => {
    const { m, g, feed } = play();
    feed(m.talk('constable'));
    feed(m.ring());
    if (read) { m.examine('gaol-roll'); feed(m.talk('prisoner')); }
    feed(m.accuse('prisoner', []));
    g.dispatch('day:2');
    return m.beginDay2();
  };
  const blind = hangMadoc(false), knowing = hangMadoc(true);
  check(blind.outcome.key === 'prisoner' && knowing.outcome.key === 'prisoner', 'both players hanged the smith', `${blind.outcome.key} / ${knowing.outcome.key}`);
  check(blind.lines.inspector.join('|') === dayTwoLines(mystery, 'inspector', blind.outcome).join('|'),
    'the player who never opened the roll gets the lines the verdict alone resolves');
  check(knowing.lines.inspector.join('|') !== blind.lines.inspector.join('|'),
    'and the player who did gets a different four');
  check(knowing.lines.inspector.some((l) => /you read what I read/i.test(l)),
    'the King\'s man says so to his face', knowing.lines.inspector.join(' / '));
  check(knowing.lines.constable.join('|') !== blind.lines.constable.join('|'), 'so does the Constable who hanged on the name');
  check(knowing.lines.laundress.join('|') === blind.lines.laundress.join('|'),
    'and Nest does not, because that row is keyed on a clue neither player holds');
  // The third row, on the one clue this pair of players did not go and get.
  const asked = dayTwoKnew(mystery, 'laundress', blind.outcome, ['nest-is-wife']);
  check(!!asked && asked.join('|') !== blind.lines.laundress.join('|'),
    'a player who had pressed her with Madoc\'s story gets a third set again', asked ? asked[1] : 'nothing');
  // AND A ROW IS ONLY EVER AN EXTRA READING. Every ending still resolves with
  // no journal at all, which is what the validator asks and what stops a `knew`
  // row from becoming the only answer for some morning.
  const bare = dayTwoOutcomes(mystery).every((o) => !!dayTwoLines(mystery, 'inspector', o));
  check(bare, 'and with no journal at all the inspector still has lines for all seven endings');
}

/* ------------------------------------------- 8: the household (#616) ---
 * data/populace.json is ten people with no clue, no lie and no line, and the
 * only thing that can say whether they fit the castle is the same walk grid
 * the twelve's schedule is checked against. Hence here rather than in
 * layout.mjs (#529): a routine's tile is a station, and a station's room is
 * not derivable from the plan alone.
 *
 * WHAT IS NEW AGAINST THE TWELVE, and why it needed its own validator rather
 * than a widened `validateMystery`: a routine is a RING per watch instead of
 * one station, so every leg of it and the wrap back to the first stop are
 * walks that have to exist; and the body carries an `activity`, which is a
 * clip name one indirection away from a .glb on disk.
 */
console.log('\nthe household in data/populace.json');
{
  const problems = validatePopulace(populace, { nav, mystery, cast });
  check(problems.length === 0, 'validatePopulace finds nothing wrong, the castle included', problems.join('; '));

  const people = populace.people;
  check(people.length === 14, `${people.length} of them: the first increment's ten (SPECS.md, "Life: a populace"), the child and the hound (#643, #644), and two hens (#684)`);
  /* THE FIRST INCREMENT'S PROMISE WAS NO NEW ASSET, and rank 10 is the row
   * that ends it (#644): the hound is a body nobody in the cast wears. What
   * holds now is narrower and is stated by kind — every body a populace
   * person wears is either the cast's or is under assets/NPCs, where
   * test/assets.mjs's checks 4 and 5 hold it to being referenced and being
   * meshopt-encoded. */
  const castBodies = new Set(cast.map((n) => n.modelPath));
  const theirs = new Set(people.map((p) => p.modelPath));
  const foreign = [...theirs].filter((m) => !castBodies.has(m));
  check(foreign.every((m) => m.startsWith('assets/NPCs/')),
    `${theirs.size} bodies, ${theirs.size - foreign.length} of them the cast's and ${foreign.length} the household's own (${foreign.join(', ') || 'none'})`,
    foreign.filter((m) => !m.startsWith('assets/NPCs/')).join(', '));
  check(new Set(people.map((p) => p.tint)).size === people.length, `no two of the ${people.length} share a tint`);

  /* A CLIP NAME IS A STRING UNTIL SOMETHING READS THE FILE. ACTIVITY_CLIPS
   * maps each job onto a Quaternius clip, and `pickClip` in npc.js matches
   * by name against whatever the loaded .glb happens to ship: a typo there
   * returns null, `playActivity` gives up, and the body stands in whatever
   * idle it was already in. That failure looks exactly like success on
   * screen, so the names are checked against the animation list inside the
   * body each person actually wears.
   *
   * PER PERSON, NOT EVERY CLIP AGAINST EVERY BODY (#645). Until the hound
   * this asked all four human bodies for all nine clips and they all had
   * them, because they are one rig. The hound's rig has `Eating` and no
   * `Idle_Sword`, and the guard has the reverse, and neither is a problem
   * unless somebody writes the serjeant's `muster` onto the dog. So the
   * question is the one the page will ask: does THIS body have the clip
   * for every stop THIS person has been given. */
  {
    let missing = 0, pairs = 0;
    const clipsOf = new Map();
    for (const p of people) {
      if (!clipsOf.has(p.modelPath)) clipsOf.set(p.modelPath, new Set((readGLTF(path.join(ROOT, p.modelPath)).json.animations ?? []).map((a) => a.name)));
      const names = clipsOf.get(p.modelPath);
      const jobs = new Set();
      for (const w of mystery.watches) for (const s of p.routine?.[w] ?? []) jobs.add(s.activity);
      for (const job of jobs) {
        pairs++;
        const clip = ACTIVITY_CLIPS[job];
        if (!names.has(clip)) { fail(`${p.id} does ${JSON.stringify(job)} in ${p.modelPath}, which ships no clip called ${clip}`); missing++; }
      }
    }
    if (!missing) pass(`${pairs} person-and-job pairs, every one a clip the person's own body ships`);
    /* And the table itself: every clip it names is in SOME body on disk, so a
     * job nobody has been given yet cannot hide a typo until somebody is. */
    const anywhere = new Set([...clipsOf.values()].flatMap((s) => [...s]));
    const orphans = Object.entries(ACTIVITY_CLIPS).filter(([, clip]) => !anywhere.has(clip));
    check(orphans.length === 0, `${Object.keys(ACTIVITY_CLIPS).length} activities, every clip in at least one body the household wears`, orphans.map(([j, c]) => `${j} -> ${c}`).join(', '));
  }

  /* THE ROW'S NODE ACCEPTANCE (SPECS.md, "Bodies"): the variation axes that
   * cost no file — height, a scaled bone, hidden nodes and materials, a held
   * prop — make more distinct SHAPES than there are body files. Tint is left
   * out on purpose, because every tint is unique by the check above and
   * counting it would make this true of one body and thirteen colours. A
   * silhouette is what tells two people apart across a ward, before colour
   * does; five files making fewer than six shapes would be five files making
   * clones. */
  {
    const everyone = [...cast, ...people];
    const shape = (n) => JSON.stringify([n.modelPath, n.modelHeight ?? null, [...(n.hideNodes ?? [])].sort(), [...(n.hideMaterials ?? [])].sort(), n.heldProp ?? null, n.boneScale ?? null]);
    const shapes = new Set(everyone.map(shape));
    const files = new Set(everyone.map((n) => n.modelPath));
    check(shapes.size > files.size, `${shapes.size} silhouettes off ${files.size} body files, across the cast and the household`);
    /* THE SPEAR IS A SILHOUETTE, NOT A FILE (#685): the two who carry it
     * wear bodies the cast already wears, so the garrison reads as a
     * garrison by what is in its hands. The fit is asserted because the
     * defaults are a mace's and a spear at 0.6 m gripped by the butt is a
     * dart: it is at least the man's own height and its tip stands up. */
    const spears = people.filter((p) => /Spear\.glb$/.test(p.heldProp ?? ''));
    check(spears.length >= 2 && spears.every((p) => p.heldPropFit?.tipUp === true && (p.heldPropFit.length ?? 0) >= (p.modelHeight ?? 1.8)),
      `${spears.length} of the household carry the spear (${spears.map((p) => p.id).join(', ')}), tip up and at least their own height`);
  }

  /* The defs the page builds NPCs from: a label rather than an offer, and no
   * dialogue at all. `populace: true` is what main.js and interaction.js both
   * key off, and neither of them knows one of the ten by id. */
  const defs = populaceDefs(populace);
  check(defs.length === people.length && defs.every((d) => d.populace === true && d.prompt && !/Press E/.test(d.prompt) && !Object.keys(d.dialogue).length),
    'every def carries a label prompt and no dialogue, so E at one of them does nothing');

  /* Where they are, as a sentence, because the row is about whether the
   * castle reads as lived in and a count of rooms is the closest this file
   * gets to saying so. */
  {
    const rooms = new Set();
    for (const p of people) for (const w of mystery.watches) for (const s of p.routine?.[w] ?? []) rooms.add(s.room);
    const busiest = mystery.watches.map((w) => `${w}: ${people.filter((p) => (p.routine?.[w] ?? []).length).length}`).join(', ');
    pass(`the ten stand in ${rooms.size} rooms across the day (${busiest})`);
  }
}

/* --------------------------------------- 8b: validatePopulace rejects --- */
console.log('\nthe household validator rejects');
{
  const broken = (mutate) => {
    const f = clone(populace);
    mutate(f, f.people);
    return validatePopulace(f, { nav, mystery, cast });
  };
  const expect = (label, mutate, re) => {
    const p = broken(mutate);
    const hit = p.find((x) => re.test(x));
    check(!!hit, `rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
    if (hit) console.log(`          said: ${hit}`);
  };
  const of = (people, id) => people.find((p) => p.id === id);

  /* THE BREAK SPECS.md NAMES: a routine tile one column outside its room's
   * box. The scullion stands at x = -6.188 tiles in a kitchen that runs
   * -6.5 to -3.5, so -6.563 is one 0.5 m grid column past the west wall and
   * inside the Clerk of Works' office. Nothing about the tile looks wrong —
   * it is floor, it is reachable, it is 0.5 m from a tile that is fine — and
   * only the room resolver can say so. */
  expect('a stop one column outside its room box (the break SPECS.md names)',
    (f, people) => { of(people, 'well-wife').routine.prime[0].tile = [-8.313, 3.688]; },
    /^well-wife at prime, stop 1: tile \(-8\.313, 3\.688\) is in outer-ward on level 0, not in laundry on level 0$/);

  expect('an activity no clip in npc.js answers to',
    (f, people) => { of(people, 'baker').routine.terce[0].activity = 'hammer'; },
    /^baker at terce, stop 1: activity "hammer" is one src\/npc\.js has no clip for/);
  expect('a stop with no floor under it',
    (f, people) => { of(people, 'baker').routine.terce[0].tile = [0.313, 6.5]; },
    /^baker at terce, stop 1: .*no floor to stand on$/);
  expect('two of the ten standing inside each other at one bell',
    (f, people) => { of(people, 'well-wife').routine.sext[0].tile = [-3.813, 0.438]; },
    /at sext are \d+\.\d\d m apart, inside the 1\.5 m two bodies need$/);
  /* AND ONE OF THE TEN STANDING ON ONE OF THE TWELVE, which is the case the
   * castle cannot survive: a populace body 1.2 m from where the cook is due
   * is a body between the player and the only person who can tell him about
   * the lantern. */
  expect('one of the ten standing on one of the twelve',
    (f, people) => { of(people, 'scullion').routine.prime[0].tile = [-5.188, -2.563]; },
    /^scullion's stop 1 at prime is \d+\.\d\d m from the cook's station, inside the 1\.5 m two bodies need$/);
  expect('a ring whose wrap back to the first stop is not a walk',
    (f, people) => { of(people, 'archer').routine.prime[1] = { room: 'cell', tile: [-4.688, 4.313], activity: 'guard' }; },
    /^archer at prime: no walk from stop [12] /);
  expect('a bell that leaves a body somewhere it cannot walk out of',
    (f, people) => { of(people, 'maid').routine.sext[0] = { room: 'cell', tile: [-5.063, 3.563], activity: 'wait' }; },
    /^maid: no walk from where /);
  expect('an id already worn by one of the twelve',
    (f, people) => { of(people, 'baker').id = 'cook'; },
    /^cook: shares an id with one of the twelve in npcs\.json/);
  expect('a tint already worn by one of the twelve',
    (f, people) => { of(people, 'baker').tint = cast.find((n) => n.id === 'cook').tint; },
    /wears the same tint as the cook, one of the twelve$/);
  expect('a watch written as an empty list rather than left out',
    (f, people) => { of(people, 'carter').routine.prime = []; },
    /^carter: routine\.prime is an empty list/);
  expect('a routine naming a bell that is not one of the four',
    (f, people) => { of(people, 'carter').routine.matins = [{ room: 'outer-ward', tile: [-8.438, -1.188], activity: 'wait' }]; },
    /^carter: routine names "matins", which is not one of the four bells$/);
  /* RANK 10's THREE FIELDS AND THE FOLLOW (#643, #644), each in the shape
   * that fails silently on screen rather than the shape that throws. */
  expect('a bone scaled to nothing',
    (f, people) => { of(people, 'well-girl').boneScale = { Head: 0 }; },
    /^well-girl: boneScale\.Head is 0, not a positive number$/);
  expect('a speed of zero, which is a body that never arrives',
    (f, people) => { of(people, 'well-girl').speed = 0; },
    /^well-girl: speed 0 is not a positive number of m\/s$/);
  expect('a clip override that is not a name',
    (f, people) => { of(people, 'hound').clips = { walk: 3 }; },
    /^hound: clips is not an object of npc\.js clip key to clip name$/);
  expect('a follow with no radius',
    (f, people) => { of(people, 'hound').follow = { keep: 2 }; },
    /^hound: follow needs a positive radius and keep, in metres$/);
  expect('a follow that keeps further off than it notices from',
    (f, people) => { of(people, 'hound').follow = { radius: 2, keep: 3 }; },
    /^hound: follow\.keep 3 is not inside follow\.radius 2, so it would never set off$/);
  expect('a room that is not a room',
    (f, people) => { of(people, 'carter').routine.terce[0].room = 'brewhouse'; },
    /^carter at terce, stop 1: room "brewhouse" is not a room in mystery\.json$/);
  /* THE SPEAR'S FIT (#685), in the shapes that fail silently in a hand. */
  expect('a held prop fitted to no length',
    (f, people) => { of(people, 'serjeant').heldPropFit.length = 0; },
    /^serjeant: heldPropFit\.length 0 is not a positive number of metres$/);
  expect('a grip past the end of the shaft',
    (f, people) => { of(people, 'serjeant').heldPropFit.grip = 1.4; },
    /^serjeant: heldPropFit\.grip 1\.4 is not a fraction from 0 \(the butt\) to 1 \(the tip\)$/);
  expect('a fit with nothing to fit',
    (f, people) => { delete of(people, 'serjeant').heldProp; },
    /^serjeant: heldPropFit with no heldProp to fit$/);

  /* AND THE CONTROL. Every break above is one field changed on a file that
   * validates; if the unbroken copy did not, each `expect` would be finding
   * its message in a list that was never empty (#34). */
  check(validatePopulace(clone(populace), { nav, mystery, cast }).length === 0,
    'and a clone of the real file with nothing changed still validates, so each break above is the only thing wrong with its copy');
}

/* ------------------------------------------ 8c: the hound follows (#644) ---
 * `Populace` has no three.js in it on purpose (#616), and this is the first
 * thing that cashes that in: the driver is run here against the real grid
 * with a body that is a plain object, and what is asserted is where the
 * driver told it to walk. The GPU question — does a dog trotting to heel read
 * as a dog — is `npm run play`'s (#53). This is the grid question: does it
 * take the grid to get there, stop short, and go home.
 */
console.log('\nthe hound follows the player, on the grid, and goes back');
{
  const fake = (id) => {
    const npc = {
      id, walking: false, walks: [], placed: [], faced: 0, played: [],
      group: { visible: true, position: { x: 0, y: 0, z: 0 } },
      walkTo(points) { this.walks.push(points); this.walking = points.length > 1; if (points.length) { const last = points[points.length - 1]; this.group.position.x = last.x; this.group.position.z = last.z; this.group.position.y = last.h ?? 0; } },
      placeAt({ x, y = 0, z }) { this.group.position.x = x; this.group.position.y = y; this.group.position.z = z; this.placed.push([x, z]); this.walking = false; },
      playActivity(a) { this.played.push(a); },
      facePlayer() { this.faced++; },
    };
    return npc;
  };
  const dog = populace.people.find((p) => p.follow);
  check(!!dog, 'somebody in the household has a `follow`', 'nobody does');
  if (dog) {
    const npc = fake(dog.id);
    const folk = new Populace({ people: [dog], npcs: [npc], nav });
    folk.setWatch('prime', { walk: false });
    const home = { x: npc.group.position.x, z: npc.group.position.z };
    const stop = folk.bodies[0].stops[0];
    check(Math.abs(home.x - stop.x) < 1e-9 && Math.abs(home.z - stop.z) < 1e-9, 'placed at its first Prime stop with no walk (a load)');

    // The player four metres away on the same floor, along the ward: inside
    // radius, outside keep.
    const player = { x: stop.x + 4, y: stop.h + EYE_HEIGHT, z: stop.z };
    const reach = nav.walkable({ x: player.x, z: player.z, level: 0 });
    check(reach, 'the spot four metres east of that stop is floor the grid can route to', `${player.x}, ${player.z}`);
    folk.update(0.016, player);
    const walk = npc.walks[0];
    check(!!walk && walk.length > 1, 'one frame later it has been sent along a route', `walks: ${npc.walks.length}`);
    if (walk) {
      const last = walk[walk.length - 1];
      const short = Math.hypot(player.x - last.x, player.z - last.z);
      check(short > dog.follow.keep - 1e-9 && short < dog.follow.keep + 0.75,
        `the route stops ${short.toFixed(2)} m short of the player, just outside keep ${dog.follow.keep}`);
      // Every cell of the route is a cell of the grid: a dog that took the
      // doorway, not the wall.
      check(walk.every((c) => !!nav.walk.cellAt(c.x, c.z, c.level ?? 0)), 'and every point on it is a walk-grid cell');
    }
    // Having arrived (the fake walks the whole route in one call), the next
    // frame turns it to face them and holds it there.
    npc.walking = false;
    folk.update(0.016, player);
    check(npc.faced > 0 && npc.played.at(-1) === 'wait', 'arrived, it faces the player and waits');

    // The player walks off across the castle: back to the stop it left.
    folk.update(0.016, { x: stop.x + 40, y: player.y, z: stop.z });
    const back = npc.walks.at(-1);
    const end = back?.at(-1);
    // A route ends on a cell centre and a stop is a tile point, and the two
    // are 0.002 m apart here; `_arrive` snaps the last step.
    check(!!end && Math.abs(end.x - home.x) < 0.05 && Math.abs(end.z - home.z) < 0.05 && npc.walks.length >= 2,
      'and when they are gone it is routed back to the stop it left', end ? `${end.x}, ${end.z}` : 'no walk');
  }
}

/* ---------------- the HUD's room line agrees with the schedule (#515) ---
 * `nav.roomAt` answers "which room is this point in" for the HUD, over every
 * room, with the overlaps settled by level and then disc over box. The
 * schedule is 45 stations whose room each was written by hand, open ground
 * included, so it is the one list that can say whether the resolver's answer
 * is the castle's. Where a station lies in two rooms at once, which is the
 * overlap `inRoom`'s own comment warns of, the resolver may name either, and
 * the sentry "by the Kitchen Tower" on the north walk stands 2.24 m from the
 * tower's centre, inside its top room: the answer is the tower. The other
 * way round is not allowed: a station the schedule puts in a tower is in the
 * tower, and the cell is never the Great Hall. A room on the wrong floor is
 * wrong too, because `inRoom` reads the feet.
 */
console.log('\nthe HUD room line, at every station');
{
  let agreed = 0, either = 0;
  // The morning after is a fifth watch in the nav (#533), so its thirteen
  // stations go through the same resolver as the forty-five.
  const everyStation = { ...mystery.schedule };
  for (const [npcId, station] of Object.entries(mystery.day2.schedule)) {
    everyStation[npcId] = { ...(everyStation[npcId] ?? {}), [mystery.day2.watch]: station };
  }
  const everyWatch = [...mystery.watches, mystery.day2.watch];
  for (const [npcId, byWatch] of Object.entries(everyStation)) {
    for (const watch of everyWatch) {
      const point = nav.at(npcId, watch);
      if (!point || point.h == null) continue;
      const here = nav.roomAt(point.x, point.z, point.h);
      if (here.id === point.room) agreed++;
      else if (!here.open && !nav.plan.rooms.some((r) => r.id === point.room && r.shape?.kind === 'disc') &&
        nav.inRoom(point.room, point.level, point.x, point.z, point.h) && nav.inRoom(here.id, here.level, point.x, point.z, point.h)) either++;
      else fail(`at ${watch}, ${npcId} stands in ${point.room} and roomAt says ${here.id}`);
    }
  }
  if (agreed) pass(`${agreed + either} stations: roomAt names the schedule's room at ${agreed}, and at ${either} a room the station is also inside`);
  else fail('no station had a floor to ask about');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
