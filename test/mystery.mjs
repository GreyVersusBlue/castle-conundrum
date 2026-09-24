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
//   5b. the walking day (#750 to #756): the day BEFORE the death, end to end,
//      its own validator rails against clones of the data, and Hywel, the
//      fourteenth cast entry, who is in the castle on that day and no other
//   6. the household in data/populace.json, on the same grid and by the same
//      rails as the twelve's own stations (#529: this file owns the stations,
//      and a routine's tile is a station question)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMystery, createMystery, earliest, shortestPath, freshState, dayTwoOutcomes, dayTwoLines, dayTwoKnew, dayWatchesOf, beforeDayOne } from '../src/mystery.js';
import { QuestGraph, validateQuest, validateAgainstNpcs } from '../src/quest-graph.js';
import { QuestManager, MANAGER_PAIRS } from '../src/quest-manager.js';
import { makePlan, walkability, EYE_HEIGHT } from '../src/castle-plan.js';
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
  const dayZero = cast.filter((n) => (n.arrives ?? 1) < 1);
  check(cast.length === 14 && dayOne.length === 12 && dayTwo.length === 1 && dayZero.length === 1,
    `${cast.length} in the cast: the twelve of the day, ${dayTwo.map((n) => n.name).join(', ')} who rides in the morning after, and ${dayZero.map((n) => n.name).join(', ')} who is alive on the walking day and no other (#752)`);
  check(Object.keys(mystery.schedule).length === 12 && mystery.watches.length === 4, 'twelve schedules across four watches');
  check(mystery.presses.length === 9, `${mystery.presses.length} presses`);
  const bodies = new Set(cast.map((n) => n.modelPath));
  check(bodies.size === 4 && cast.every((n) => /^#[0-9a-f]{6}$/i.test(n.tint)), `four bodies, ${cast.length} tints (#419, #603)`, [...bodies].join(', '));
  // What the fourth is for (#603). Read off the data, so a woman put back on a
  // man's body is named, and so is a man put on hers.
  const WOMEN = ['cook', 'laundress', 'lady'];
  const hers = new Set(cast.filter((n) => WOMEN.includes(n.id)).map((n) => n.modelPath));
  const strays = [
    ...(hers.size === 1 ? [] : cast.filter((n) => WOMEN.includes(n.id)).map((n) => `${n.id} wears ${n.modelPath}`)),
    ...cast.filter((n) => !WOMEN.includes(n.id) && hers.has(n.modelPath)).map((n) => `${n.id} wears ${n.modelPath} too`),
  ];
  check(strays.length === 0, "four bodies, and the three women share the one that is a woman's", strays.join('; '));
  check(new Set(cast.map((n) => n.tint)).size === cast.length, `no two of the ${cast.length} share a tint`);
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
  /* A BODY STOOD ON A PROP (#785). The two stations PROP_CLEARANCE was written
   * for, put back where they were: the Chaplain on the gravestone, the
   * Constable at the candles. And the half that says the rail reads the
   * watch: the body is evidence at Prime only, so a station on its lantern at
   * Terce is nobody standing on anything and must not fire. */
  expect('the Chaplain back on the gravestone (`chaplain stands 0.20 m from gravestone at terce`)',
    (m) => { m.schedule.chaplain.terce.tile = [5.4, 3.8]; },
    /^chaplain stands 0\.20 m from gravestone at terce, inside the 1\.0 m a body keeps from something to press E at$/);
  expect('the Constable back at the candles at Prime (`constable stands 0.92 m from candles-chapel at prime`)',
    (m) => { m.schedule.constable.prime.tile = [5.9, 4.2]; },
    /^constable stands 0\.92 m from candles-chapel at prime, inside the 1\.0 m a body keeps from something to press E at$/);
  {
    const lantern = plan.pieces.find((pc) => pc.evidence === 'body');
    const tile = [(lantern.box.min.x + lantern.box.max.x) / 2 / plan.tile, (lantern.box.min.z + lantern.box.max.z) / 2 / plan.tile];
    const atPrime = broken((m) => { m.schedule.chaplain.prime.tile = tile; });
    const atTerce = broken((m) => { m.schedule.chaplain.terce.tile = tile; });
    const said = (p, w) => p.filter((x) => new RegExp(`^chaplain stands 0\\.\\d\\d m from ${lantern.id} at ${w},`).test(x));
    check(said(atPrime, 'prime').length === 1 && said(atTerce, 'terce').length === 0,
      `a station on the body's lantern fires at Prime and not at Terce, when the body is no longer evidence there`,
      `prime: ${atPrime.join('; ') || 'nothing'} | terce: ${atTerce.join('; ') || 'nothing'}`);
  }
  /* THE SAME RAIL ON THE OTHER TWO DAYS (#792). Each of the three stations it
   * moved, put back: the Chaplain on the gravestone on the morning after,
   * Hywel on the candles and under the bell at the last bell of the walking
   * day, the cook on the knife at its Sext. The fourth is the half that says
   * the walking day reads `day0.evidence`: Hywel stands within a metre of
   * where his own lantern lies at Prime, and it is not on the ground the day
   * before, so nothing is said. */
  expect('the Chaplain back on the gravestone on the morning after (`chaplain stands 0.20 m from gravestone at lauds`)',
    (m) => { m.day2.schedule.chaplain.tile = [5.4, 3.8]; },
    /^chaplain stands 0\.20 m from gravestone at lauds, inside the 1\.0 m a body keeps from something to press E at$/);
  {
    const p = broken((m) => { m.day0.schedule.hywel['vespers-eve'].tile = [5.75, 4.375]; });
    const candles = p.find((x) => /^hywel stands 0\.34 m from candles-chapel at vespers-eve, inside the 1\.0 m a body keeps from something to press E at$/.test(x));
    const bell = p.find((x) => /^hywel stands 0\.81 m from chapel-bell at vespers-eve, inside the 1\.0 m a body keeps from something to press E at$/.test(x));
    check(!!candles && !!bell, 'rejects Hywel back at (5.75, 4.375) at vespers-eve, on the candles and under the bell',
      p.length ? `said: ${p.join('; ')}` : 'said nothing');
    if (candles && bell) console.log(`          said: ${candles}\n          said: ${bell}`);
  }
  expect('the cook back on the knife at sext-eve (`cook stands 0.93 m from knife at sext-eve`)',
    (m) => { m.day0.schedule.cook['sext-eve'].tile = [-0.063, 3.688]; },
    /^cook stands 0\.93 m from knife at sext-eve, inside the 1\.0 m a body keeps from something to press E at$/);
  {
    const lantern = plan.pieces.find((pc) => pc.evidence === 'body');
    const at = nav.at('hywel', 'vespers-eve');
    const gap = Math.hypot(at.x - (lantern.box.min.x + lantern.box.max.x) / 2, at.z - (lantern.box.min.z + lantern.box.max.z) / 2);
    const p = broken(() => {});
    const said = p.filter((x) => new RegExp(`^hywel stands 0\\.\\d\\d m from ${lantern.id} at vespers-eve,`).test(x));
    check(at.level === (lantern.level ?? 0) && gap < 1.0 && said.length === 0,
      `Hywel stands ${gap.toFixed(2)} m from ${lantern.id} at vespers-eve and nothing is said, because the body is not on the ground the day before`,
      `level ${at.level} against ${lantern.level ?? 0}; said: ${said.join('; ') || 'nothing'}`);
  }
  expect('a station inside a wall',(m) => { m.schedule.cook.prime.tile = [-3.5, -2.5]; }, /^cook: station at prime is at tile \(-3.5, -2.5\) on level 0, where there is no floor to stand on$/);
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

  /* THE MORNING'S OWN BELLS (#699). `state.watch` is an index into whichever
   * list the day names, so every one of these is a save index that would read
   * as a bell nobody meant: an empty list leaves the morning standing at no
   * bell, a repeat makes two bells of the morning one bell, an id shared with
   * day one makes one index mean two different bells, and the singular spelling
   * left in the file is the second source this row exists to not have. */
  expect('a morning with no bells of its own', (m) => { m.day2.watches = []; },
    /^day2\.watches: \[\] is not a non-empty list of bell ids$/);
  expect('a morning bell that is not a bell id', (m) => { m.day2.watches = [' ']; },
    /^day2\.watches: " " is not a watch id$/);
  expect('a morning bell that is one of the four', (m) => { m.day2.watches = ['terce']; },
    /^day2\.watches: terce is one of the four bells, and a morning bell is the morning's own$/);
  expect('one bell of the morning written twice', (m) => { m.day2.watches = ['lauds', 'lauds']; },
    /^day2\.watches: lauds is listed twice, so two bells of the morning are one bell$/);
  expect('the old singular spelling left beside the list', (m) => { m.day2.watch = 'lauds'; },
    /^day2\.watch: the morning names its bells in `watches`, a list, and there is one spelling of it \(#699\)$/);

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
  check(absent.join() === 'merchant,inspector,hywel', `eleven of the twelve are in the castle at Prime; Thomas Wykes rides in at Terce, the King's inspector not until the next morning, and Hywel ap Gruffudd is dead at the stair (#752)`, `absent: ${absent.join(', ') || 'nobody'}`);
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

  /* A STATION IS TALKED TO FROM ITS OWN STOREY (rank 2, sight at the body's
   * own height). `nav.talkable` used to ask every level in `plan.levels`, so a
   * station with ground under it and no floor of its own read as talkable: the
   * same y-blindness as the rays in src/interaction.js, in the validator. The
   * royal apartments' tile has cells on levels 0 and 1 within 3.2 m and none
   * on 2, which is exactly that case. */
  const ladyAtPrime = nav.at('lady', 'prime');
  check(!!ladyAtPrime && nav.talkable(ladyAtPrime) && !nav.talkable({ ...ladyAtPrime, level: 2 }),
    "the Lady's Prime station is talkable on its own storey and not when it is moved to level 2, where there is no floor under it",
    ladyAtPrime ? `level 1 ${nav.talkable(ladyAtPrime)}, level 2 ${nav.talkable({ ...ladyAtPrime, level: 2 })}` : 'she has no Prime station');

  /* AND THE COUNTS plan-vs-scene.mjs's UPSTAIRS BEAT STANDS ON (#529, #147).
   * That beat walks every station above the ground at each of day one's four
   * bells, not asleep, and asks for the prompt from up to 12 cells on the
   * station's own storey 0.9 to 2.8 m away and from every cell on a lower
   * storey within 2.8 m. On a day with nobody upstairs, or a station with no
   * cell under it, one half or the other asserts nothing. Cells are the
   * spawn's own fill, the grid the page's player stands on: own storey out of
   * `rooms()`, as the beat reads it, and the storey below out of every cell,
   * because the porter's walk crosses open ground and no room. */
  const spawnGrid = walkability(plan);
  const cellX = (c) => c.i * spawnGrid.grid + spawnGrid.grid / 2;
  const cellZ = (c) => c.j * spawnGrid.grid + spawnGrid.grid / 2;
  const roomCells = spawnGrid.rooms();
  const perWatch = [], thin = [];
  for (const w of mystery.watches) {
    const up = cast.map((n) => ({ id: n.id, at: nav.at(n.id, w) })).filter((n) => n.at && n.at.level > 0 && !n.at.asleep);
    perWatch.push(`${w} ${up.map((n) => n.id).join('+') || 'nobody'}`);
    if (!up.length) thin.push(`nobody is upstairs and awake at ${w}`);
    for (const { id, at } of up) {
      const own = roomCells.filter((r) => r.level === at.level).flatMap((r) => r.at)
        .filter((c) => { const d = Math.hypot(c.x - at.x, c.z - at.z); return d >= 0.9 && d <= 2.8; });
      const below = spawnGrid.cells.filter((c) => c.level < at.level && Math.hypot(cellX(c) - at.x, cellZ(c) - at.z) <= 2.8);
      if (!own.length) thin.push(`${id} at ${w} has no level-${at.level} cell 0.9 to 2.8 m away`);
      if (!below.length) thin.push(`${id} at ${w} has no lower-storey cell within 2.8 m`);
    }
  }
  check(thin.length === 0,
    `somebody is upstairs and awake at every bell (${perWatch.join(', ')}), and each has cells on their own storey and under it for plan-vs-scene.mjs to stand on`,
    thin.join('; '));

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
/**
 * THE DAY OF THE DEATH IS BEHIND THE WALKING DAY NOW (#751, #755). A fresh state
 * is the day before it: `frame.start` is `explore` and that stage's own `enter`
 * action is `applyDay0`. There is no manager in this file to run an action, so
 * `play` does by hand exactly what `_applyDay0` and `_applyDay1` do — begin the
 * walking day, then take the mystery's door, which is one dispatch of `day:1` —
 * and every beat below it is day one's, reached the way a player reaches it.
 * `play(state, { day: 0 })` stops on the walking day, which is what the walking
 * day's own beats use.
 */
function play(state = freshState(frame), { day = 1 } = {}) {
  const m = createMystery({ mystery, npcs: cast, state });
  const g = new QuestGraph(frame, QuestManager.actions);
  g.begin();
  m.beginDay0();
  if (day !== 0) { g.dispatch('day:1'); m.beginDay1(); }
  const fed = [];
  const feed = (fx) => { for (const ev of events(fx)) { const out = g.dispatch(ev); if (out.length) fed.push(ev); } return fx; };
  return { m, g, fed, feed, state };
}
{
  // The intended path (PLAN.md, The intended path), watch by watch.
  const { m, g, feed, state } = play();
  check(m.watch === 'prime' && g.stage === 'arrive' && m.day === 1 && state.day === 1, 'the mystery entered from the walking day starts at Prime, in `arrive`, on day one', `${m.watch} / ${g.stage} / day ${state.day}`);

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
  check(frame.start === 'explore' && frame.stages.explore.transitions.some((t) => t.on === 'day:1' && t.to === 'arrive'), 'the walking day is the first stage, and `day:1` is the door into the mystery (#751, #755)');
  check(frame.stages.investigate.transitions.some((t) => t.on === 'bell:4' && t.to === 'accusing'), 'and the fourth bell of day one moves investigate to accusing');
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

/* ---------------------------------------- 5b: the walking day (#750 to #756) ---
 * THE DAY BEFORE THE DEATH, END TO END. Devon took the walking day as the main
 * mode (#751) and as the day before rather than the day of (#752), so the castle
 * a fresh page opens on is this one: Hywel ap Gruffudd alive in his lodge, no
 * body at the stair, nothing to find and nobody to name. Nothing on a screen can
 * say whether a day with no case still holds together, and every way it can fail
 * is silent — a bell with no station under it, a clue granted on a day before the
 * crime, a body that teleports into the morning — so it is driven here the way
 * day one and the morning after are.
 *
 * WHAT THIS FILE OWNS OF IT (#529): the day-0 stations, the walk into the night,
 * and the engine's own answers. The sky per bell and `undoDay`'s round trip are
 * test/layout.mjs's, the clamp is test/save.mjs's, and the graph, the manager and
 * index.html are test/quest.mjs's.
 */
console.log('\nthe walking day');
{
  const W0 = mystery.day0.watches;
  const four = mystery.watches;
  check(JSON.stringify(dayWatchesOf(mystery, 0)) === JSON.stringify(W0),
    `dayWatchesOf(m, 0) is the walking day's own four bells: ${W0.join(', ')}`, JSON.stringify(dayWatchesOf(mystery, 0)));
  check(JSON.stringify(dayWatchesOf(mystery, 1)) === JSON.stringify(four)
    && JSON.stringify(dayWatchesOf(mystery, 7)) === JSON.stringify(four)
    && JSON.stringify(dayWatchesOf(mystery)) === JSON.stringify(four),
    'and day 1, day 7 and no day at all are all the four: the non-four branches are keyed on the literals 0 and 2 (open call 1)',
    JSON.stringify(dayWatchesOf(mystery, 7)));
  check(!W0.some((w) => four.includes(w) || (mystery.day2?.watches ?? []).includes(w)),
    "none of the walking day's bells is one of the four or one of the morning's, so a save's `watch` index means one bell");

  // An engine on a day-0 state, which is what `explore`'s `applyDay0` makes.
  const { m, g, feed, state } = play(freshState(frame), { day: 0 });
  check(m.day === 0 && state.day === 0 && m.watch === W0[0] && g.stage === 'explore',
    `the walking day begins at ${W0[0]}, in \`explore\`, and the save says day 0`, `${m.watch} / ${g.stage} / day ${state.day}`);
  check(JSON.stringify(m.watches) === JSON.stringify(W0), 'and the engine reads whichever list the day names (#699)', m.watches.join(', '));

  // `available`: a station and no statements. There are no clues on this day, so
  // there is nothing for a conversation to grant.
  const cook = m.available('cook');
  check(!!cook?.station && cook.statements.length === 0, `the cook is available at ${W0[0]} with no statements to give`, JSON.stringify(cook?.station));
  check(m.available('sentry') === null, 'the sentry is asleep the evening before as well, and cannot be spoken to');
  check(m.available('hywel')?.station?.room === 'lodge', 'and Hywel is in the mason\'s lodge, which is the whole reason to walk the day', JSON.stringify(m.available('hywel')?.station));
  check(m.available('inspector') === null, 'the inspector is two days off and is not in the castle');
  /* WHERE THE DAY IS GOING, which is the one fact the schedule exists to arrange
   * (SPECS.md's increment 4): the last bell of the walking day leaves the mason
   * at the foot of the Chapel Tower stair, so the night pane comes up where the
   * body is lying at Prime. The morning's own tile is the Constable's day-one
   * Prime station, `note: "at the body"`, and this asks the two against each
   * other rather than against a number written here twice. */
  {
    const last = nav.at('hywel', W0[W0.length - 1]);
    const body = nav.at('constable', four[0]);
    const gap = last && body && last.level === body.level ? Math.hypot(last.x - body.x, last.z - body.z) : Infinity;
    check(last?.room === 'chapel' && body?.room === 'chapel' && gap <= 1.5,
      `the walking day ends with Hywel ${gap.toFixed(2)} m from where the body lies at ${four[0]}, so the night pane comes up at the foot of the Chapel Tower stair (open call 4: the player is not moved)`,
      `${last?.room} at ${W0[W0.length - 1]} / ${body?.room} at ${four[0]} / ${gap.toFixed(2)} m`);
  }
  /* AND THAT THE DAY IS A DAY RATHER THAN A COPY OF ONE. Increment 1 shipped
   * `day0.schedule` as day one's own stations under the new ids so these rails
   * could run against real geometry, and increment 4 replaced it. The honest
   * version of "not a copy" is not a diff count: it is that the only two of the
   * thirteen who stand in one room from the first bell to the last are the two
   * whose own lines say they do, the porter at his gate and the smith behind his
   * bars, and that each of them says so in a `note`. Copy day one back in and
   * the chaplain joins that list, because his day-one self never leaves the
   * chapel, and this names him. */
  {
    const rows = Object.entries(mystery.day0.schedule);
    /* Two bells or more before anybody is called still: the merchant is in the
     * castle at Terce and gone by Vespers on both days, and a man with one
     * station has not stood anywhere long enough to be standing still. */
    const still = rows.filter(([, row]) => {
      const at = W0.filter((w) => row[w]);
      return at.length > 1 && new Set(at.map((w) => row[w].room)).size === 1;
    }).map(([id]) => id);
    const why = still.filter((id) => W0.some((w) => mystery.day0.schedule[id][w]?.note));
    check(still.join() === 'porter,prisoner' && why.length === still.length,
      `${rows.length - still.length} of the ${rows.length} change room across the walking day; the ${still.length} who do not are the porter at his gate and the smith behind his bars, each with a \`note\` saying why`,
      `still: ${still.join(', ') || 'nobody'} / with a note: ${why.join(', ') || 'none'}`);
  }

  // A conversation grants nothing, a press shrugs, and the journal stays empty.
  const talked = m.talk('cook');
  check(talked.some((e) => e.type === 'talked') && clueIds(talked).length === 0 && state.clues.length === 0,
    'talking to her is a conversation and not a clue', `${clueIds(talked).join(', ') || 'no clues'} / journal ${state.clues.length}`);
  check(m.press('cook', 'cook-lantern')[0].type === 'shrug' && state.clues.length === 0,
    'a press with a clue nobody is holding on a day with no clues is a shrug');

  // E on each of the six things still on the ground: one `quiet` effect, nothing
  // granted, nothing taken.
  const quiet = mystery.day0.evidence.filter((id) => {
    const fx = m.examine(id);
    return fx.length === 1 && fx[0].type === 'quiet' && fx[0].evidence === id;
  });
  check(quiet.length === mystery.day0.evidence.length && state.clues.length === 0 && state.taken.length === 0,
    `all ${mystery.day0.evidence.length} things on the ground answer with one \`quiet\` and nothing else: ${mystery.day0.evidence.join(', ')}`,
    `quiet for ${quiet.join(', ')}`);
  check(m.examine('body')[0]?.type === 'quiet', 'and so does the body row, whose prop the walking day never shows');

  // Walking into a room fills the map in and grants no `L` clue.
  const walked = m.enter('cross-walk', 2);
  check(state.visited.includes('cross-walk') && walked.some((e) => e.type === 'visited'),
    'walking the cross-wall walk puts the room on `visited`, because the map is a fact about the player (open call 3)');
  check(!m.holds('walk-crosses') && clueIds(walked).length === 0,
    'and grants no `L` clue: `walk-crosses` in a walking day\'s journal would be the mystery starting the day before it');

  // Three rings walk the four bells; the fourth is the night and moves nothing.
  for (let i = 1; i <= 3; i++) {
    const fx = feed(m.ring());
    check(m.watch === W0[i] && events(fx).includes(`bell:${i}`) && fx.some((e) => e.type === 'stations'),
      `ring ${i}: ${W0[i]}, and the stations move`, `${m.watch} / ${events(fx).join(', ')}`);
  }
  const last = feed(m.ring());
  check(m.watch === W0[3] && state.watch === 3, 'the fourth ring moves no watch: a day before a death is a day that ends (open call 5)', `${m.watch} / ${state.watch}`);
  check(last.some((e) => e.type === 'night') && !last.some((e) => e.type === 'demand') && events(last).includes('bell:4'),
    'it returns a `night` effect and `bell:4`, and demands nothing: there is no Constable asking on a day with no body',
    JSON.stringify(last.map((e) => e.type)));
  check(g.stage === 'night', 'and the frame is in `night`, with the pane up', g.stage);
  check(m.accuse('clerk', [])?.length === 0 && state.accusations.length === 0, 'and naming somebody is refused outright: nobody is dead yet');

  // And the door into the mystery, which is what `arrive`'s `applyDay1` runs.
  const day1 = m.beginDay1();
  check(day1 && m.day === 1 && state.day === 1 && m.watch === four[0] && state.watch === 0,
    `beginDay1 from a walking-day state is day one at ${four[0]}`, `day ${state.day} at ${m.watch}`);
  check(day1.stations.hywel === null && !!day1.stations.constable,
    'with Hywel gone from the castle and the twelve at their Prime stations', JSON.stringify(day1.stations.hywel));

  // The guard (#699): it must not rewind a day one that has rung on.
  const { m: m2, state: st2 } = play();
  m2.ring(); m2.ring();
  const again = m2.beginDay1();
  check(again && st2.day === 1 && m2.watch === 'sext' && st2.watch === 2,
    'and called again on a day-one state at Sext it leaves the watch at Sext, the way beginDay2 does', `day ${st2.day} at ${m2.watch}`);
}

/* --------------------------- 5c: the walking day's validator rails (#750) --- */
console.log('\nthe validator rejects, on the walking day');
{
  const broken = (mutate) => {
    const m = clone(mystery); const n = clone(cast); const f = clone(frame);
    mutate(m, n, f);
    return validateMystery(m, n, f, castleNav(plan, m), sideQuests);
  };
  const expect = (label, mutate, re) => {
    const p = broken(mutate);
    const hit = p.find((x) => re.test(x));
    check(!!hit, `rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
    if (hit) console.log(`          said: ${hit}`);
  };
  expect('a bell of the walking day that is one of the four',
    (m) => { m.day0.watches[0] = 'prime'; },
    /^day0\.watches: prime is one of the four bells/);
  expect("a bell of the walking day that is one of the morning's",
    (m) => { m.day0.watches[0] = mystery.day2.watches[0]; },
    /^day0\.watches: lauds is one of the morning's bells/);
  expect('a bell of the walking day listed twice',
    (m) => { m.day0.watches[1] = m.day0.watches[0]; },
    /^day0\.watches: prime-eve is listed twice/);
  expect('a cast member with no row in day0.schedule',
    (m) => { delete m.day0.schedule.cook; },
    /^cook: no row in day0\.schedule/);
  expect('a day0.schedule id who is not in the cast',
    (m) => { m.day0.schedule.scullion = clone(m.day0.schedule.cook); },
    /^day0\.schedule: scullion is not in the cast/);
  expect('a day-0 station with no floor under it',
    (m) => { m.day0.schedule.cook['prime-eve'].tile = [-40, -40]; },
    /^cook: station at prime-eve is at tile \(-40, -40\) on level 0, where there is no floor to stand on/);
  expect('a day-0 station outside the room it names',
    (m) => { m.day0.schedule.cook['prime-eve'] = { room: 'cell', tile: [-5, 3] }; },
    /^cook: station at prime-eve is at tile \(-5, 3\), which is not inside cell/);
  /* The garden is scenery: the east gate is shut and never opens, so a station in
   * it is somewhere nobody can walk to, which is the break day one's own rail was
   * written against (PLAN.md's answered question 5). */
  expect('a day-0 station the player cannot walk to',
    (m) => { m.day0.schedule.lady['sext-eve'] = { room: 'garden', tile: [7, -1.5] }; },
    /^lady: station at sext-eve is at tile \(7, -1.5\) in GD, which the player cannot walk to$/);
  /* 1.4 m AND NOT 0, which is the break SPECS.md's increment 4 names. Two bodies
   * on one tile is the case any comparison catches; two bodies a tenth of a metre
   * inside the limit is the case a comparison written with the wrong constant or
   * the wrong axis passes. The tile is the grid's 0.5 m: 0.35 of a 4 m tile is
   * 1.40 m exactly, so the message's own number is the evidence. */
  expect('two bodies 1.4 m apart at a bell of the walking day, a tenth of a metre inside the 1.5 m two bodies need',
    (m) => {
      const near = clone(m.day0.schedule.apprentice['sext-eve']);
      near.tile = [near.tile[0] + 0.35, near.tile[1]];
      m.day0.schedule.cook['sext-eve'] = near;
    },
    /^(cook and apprentice|apprentice and cook) stand 1\.40 m apart at sext-eve, inside the 1\.5 m two bodies need$/);
  expect('a day0.evidence id that is not an evidence row',
    (m) => { m.day0.evidence.push('crown'); },
    /^day0\.evidence: crown is not an evidence row/);
  expect('a walking day with no pane to end on',
    (m) => { delete m.day0.night.button; },
    /^day0\.night\.button: no text, so the walking day would end on a blank pane$/);
  /* AND THE WALK INTO THE NIGHT, which is the day-two rail's "overnight is still
   * a walk" pointed forward: the cell is standable floor that no walk from the
   * kitchen reaches, so a cook who ends the walking day in it wakes up at her
   * own Prime station having been carried there. */
  expect('a body that cannot walk from its last walking-day station to its day-one Prime one',
    (m) => { m.day0.schedule.cook['vespers-eve'] = clone(m.schedule.prisoner.prime); },
    /^cook: no path from PT at vespers-eve to KI at prime$/);
}

/* ------------------------------------------- 5d: Hywel, the fourteenth (#752) --- */
console.log('\nHywel ap Gruffudd, in the castle on one day of the three');
{
  const hywel = cast.find((n) => n.id === 'hywel');
  check(!!hywel && hywel.arrives === 0 && hywel.modelPath === 'assets/NPCs/Farmer.glb',
    'the fourteenth cast entry is the master mason, on a body two of the cast already wear', JSON.stringify(hywel?.arrives));
  check(beforeDayOne(hywel) && !cast.filter((n) => n.id !== 'hywel').some(beforeDayOne),
    '`beforeDayOne` is true for him and false for the twelve and for the inspector, whose own `arrives` is 2 (open call 8)',
    cast.filter(beforeDayOne).map((n) => n.id).join(', '));
  check(!!mystery.day0.schedule.hywel && !mystery.schedule.hywel && !mystery.day2.schedule.hywel,
    'he has a station on the walking day, no day-one schedule and no station on the morning after');
  const broken = (mutate) => { const m = clone(mystery); mutate(m); return validateMystery(m, cast, frame, castleNav(plan, m), sideQuests); };
  const expect = (label, mutate, re) => {
    const p = broken(mutate);
    const hit = p.find((x) => re.test(x));
    check(!!hit, `rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
    if (hit) console.log(`          said: ${hit}`);
  };
  expect('a day-one schedule for the man who is dead by Prime',
    (m) => { m.schedule.hywel = clone(m.schedule.apprentice); },
    /^hywel: is in the castle on the walking day only \(arrives: 0\) and still has a day-one schedule$/);
  expect('no station for him on the one day he is alive',
    (m) => { delete m.day0.schedule.hywel; },
    /^hywel: is in the castle on the walking day only \(arrives: 0\) and has no station in day0\.schedule/);
  expect('a station for him on the morning after his own funeral',
    (m) => { m.day2.schedule.hywel = clone(m.day2.schedule.apprentice); },
    /^hywel: is in the castle on the walking day only \(arrives: 0\) and still has a station at lauds$/);
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
    check(day && day.watch === day2.watches[0] && m.day === 2 && state.day === 2,
      `${o.key}: the engine is on day two at ${day2.watches[0]}, and the save says so`, `${day?.watch} / day ${state.day}`);
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
  /* THE MORNING'S BELL IS A BELL AGAIN (#700). This used to read
   * `m.ring().length === 0`: `ring()` opened on `ended()`, which is true from
   * the verdict onward, so the rope at Lauds returned no effects at all: no
   * sound, no event, nothing on the screen. `day2.watches` has one bell in it,
   * so the morning's ring is the last ring of its day: it rings, it is numbered
   * within the morning's own list (#701), and it moves no watch, the way day
   * one's fourth moves none. What it does NOT carry is a `demand`: the morning
   * has no Constable asking for a name. */
  const morningRing = m.ring();
  check(morningRing.length === 1 && morningRing[0].type === 'event' && morningRing[0].name === 'bell:1'
    && m.watch === 'lauds' && state.watch === 0,
    'the morning bell rings bell:1, demands nothing and moves no watch', JSON.stringify(morningRing));
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

{
  /* A MORNING WITH TWO BELLS IN IT (#699). The shipped list is one long, so
   * everything above exercises the one-bell case and none of it can tell a
   * `day2.watches` the engine actually reads from a `day2.watches[0]` it does
   * not. This is the fixture that can: the same data with one id added to the
   * morning's list and nothing else changed.
   *
   * IT STARTS WITH THE VALIDATOR, because the claim the row is making is that a
   * second morning bell is a data edit. If the file that refuses bad data
   * refuses this, it is not one. `day2.schedule` is one station per person for
   * the whole morning and `day2.lines` is keyed by the verdict, so a second
   * bell adds nothing for either of them to answer for. */
  const two = clone(mystery);
  two.day2.watches = ['lauds', 'lauds-two'];
  const problems = validateMystery(two, cast, frame, castleNav(plan, two), sideQuests);
  check(problems.length === 0, 'a second bell written into day2.watches is data the validator takes as it stands', problems.join(' | '));

  const state = freshState(frame);
  const m = createMystery({ mystery: two, npcs: cast, state });
  const g = new QuestGraph(frame, QuestManager.actions);
  g.begin();
  for (const ev of events(m.talk('constable'))) g.dispatch(ev);
  for (const ev of events(m.ring())) g.dispatch(ev);
  for (const ev of events(m.accuse('nobody', []))) g.dispatch(ev);
  g.dispatch('day:2');

  // Day one left the watch at 1 (one ring). The morning is an index into its
  // own list, so it has to come back to its own first bell.
  check(state.watch === 1, 'the day ended one ring in, so the save says watch 1', String(state.watch));
  const day = m.beginDay2();
  check(m.watch === 'lauds' && state.watch === 0 && day.watch === 'lauds',
    'the morning opens at its first bell and the save index came back to 0', `${m.watch} / ${state.watch}`);
  check(day.watches.join(', ') === 'lauds, lauds-two' && m.watches.join(', ') === 'lauds, lauds-two',
    'and the engine reports the list the morning names, not the four', m.watches.join(', '));

  // The ring walks the morning's own list, and the bell numbers are the
  // morning's own too, so they stay inside the four characters sounds.json has.
  const first = m.ring();
  check(first.some((e) => e.type === 'watch' && e.watch === 'lauds-two' && e.index === 1)
    && first.some((e) => e.type === 'event' && e.name === 'bell:1')
    && !first.some((e) => e.type === 'demand'),
    'the first morning bell moves the morning on to its second watch and demands nothing', JSON.stringify(events(first)));
  check(m.watch === 'lauds-two' && state.watch === 1, 'the engine and the save are both at the second bell', `${m.watch} / ${state.watch}`);

  // Every bell of the morning reads the same station row: `day2.schedule` is
  // one station per person for the whole of it.
  check(m.stationOf('inspector')?.room === two.day2.schedule.inspector.room
    && m.stationOf('inspector', 'lauds')?.room === two.day2.schedule.inspector.room,
    'the schedule answers at both bells of the morning', JSON.stringify(m.stationOf('inspector')));
  check(m.available('inspector')?.station?.room === two.day2.schedule.inspector.room,
    'and he can still be spoken to at the second bell');

  /* AND SO DOES THE NAV, WHICH IS A SEPARATE ANSWER AND A SILENT ONE. main.js
   * places a body with `engine.stationOf(id, watch) ? nav.at(id, watch) : null`
   * (src/main.js), so a nav that indexes only the morning's first bell puts
   * NOBODY in the castle at the second: the engine says there is a station
   * there and the lookup that turns it into a point says there is not. Nothing
   * else in this suite can see that, because every other reader goes at
   * `day2.schedule` directly. */
  const twoNav = castleNav(plan, two);
  const atFirst = twoNav.at('inspector', 'lauds');
  const atSecond = twoNav.at('inspector', 'lauds-two');
  check(!!atSecond && atFirst.x === atSecond.x && atFirst.z === atSecond.z && atFirst.room === atSecond.room,
    'and the nav has a point for him at both bells, so main.js can put him somewhere at either',
    `${JSON.stringify(atFirst)} / ${JSON.stringify(atSecond)}`);

  const last = m.ring();
  check(last.length === 1 && last[0].name === 'bell:2' && m.watch === 'lauds-two' && state.watch === 1,
    'the last bell of the morning rings and moves nothing, the way the fourth of day one does', JSON.stringify(last));

  /* AND IT IS NOT REWOUND BY BEING RE-ENTERED. `_applyDay` runs beginDay2 again
   * on entering `end` and on every reload in either day-two stage (#699), and a
   * `st.watch = 0` outside the day-one guard would put a player who had rung on
   * back at the first bell every time the manager re-applied the day. */
  m.beginDay2();
  check(m.watch === 'lauds-two' && state.watch === 1, 'beginDay2 called again does not rewind a morning that has rung on', `${m.watch} / ${state.watch}`);
  const resumed = createMystery({ mystery: two, npcs: cast, state: clone(state) });
  check(resumed.day === 2 && resumed.watch === 'lauds-two', 'and a reload comes back at the bell the save was on', resumed.watch);
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
  /* AND THE WALKING DAY IS NOT AN EMPTY CASTLE (SPECS.md's increment 4). The
   * validator above now walks `day0.watches` as well as the four, so the line
   * before this one covers every day-0 ring against the grid and against the
   * fourteen. What it cannot say is that there are any: a file with no day-0
   * ring in it validates perfectly and leaves the day a player opens the game
   * on with thirteen bodies in it and nobody else. Every one of the nineteen is
   * in the castle at some bell of the evening before, which is the floor
   * SPECS.md set, and the count of bells each covers is printed rather than
   * asserted, because a row that gives the household an evening of its own
   * should not have to edit a number here. */
  {
    const W0 = mystery.day0?.watches ?? [];
    const empty = people.filter((p) => !W0.some((w) => (p.routine?.[w] ?? []).length)).map((p) => p.id);
    const stops = people.reduce((n, p) => n + W0.reduce((k, w) => k + (p.routine?.[w] ?? []).length, 0), 0);
    check(W0.length === 4 && empty.length === 0,
      `all ${people.length} of the household are in the castle on the walking day too, over ${stops} stops at its four bells`,
      `nobody at any of ${W0.join(', ')}: ${empty.join(', ')}`);
  }
  check(people.length === 20, `${people.length} of them: the first increment's ten (SPECS.md, "Life: a populace"), the child and the hound (#643, #644), two hens (#684), the inner ward's five (#729) and the generated cow (#789)`);
  /* THE TALK LIST (#731), counted beside the people because a validator that
   * found nothing in an empty list would pass the same as one that found
   * nothing in three. */
  const talk = populace.talk ?? [];
  check(talk.length === 3 && talk.every((t) => t.lines.every((l) => !/^[A-Z][\w' -]*: /.test(l))),
    `${talk.length} talk pairs (${talk.map((t) => t.id).join(', ')}), and no line opens with a speaker's name, because the band carries it`);
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
   * unless somebody writes the serjeant's `spar` onto the dog. So the
   * question is the one the page will ask: does THIS body have the clip
   * for every stop THIS person has been given. */
  {
    let missing = 0, pairs = 0;
    const clipsOf = new Map();
    for (const p of people) {
      if (!clipsOf.has(p.modelPath)) clipsOf.set(p.modelPath, new Set((readGLTF(path.join(ROOT, p.modelPath)).json.animations ?? []).map((a) => a.name)));
      const names = clipsOf.get(p.modelPath);
      const jobs = new Set();
      /* BOTH DAYS' BELLS (#800). Until the four generated jobs were placed
       * this read `mystery.watches` only, so a clip missing from a body at
       * one of the walking day's four bells froze that body with nothing
       * here to say so. */
      for (const w of [...mystery.watches, ...(mystery.day0?.watches ?? [])]) for (const s of p.routine?.[w] ?? []) jobs.add(s.activity);
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
    /* THE FOUR THE FIRST INCREMENT DEFERRED ARE PLACED (#800). `sweep`,
     * `stir`, `hammer` and `spar` waited on rank 10 for a clip (#618), and
     * rank 10 shipped one for each (#788). Each is now somebody's job, at
     * both days' bells, so the deferral cannot come back by a routine
     * quietly reverting to `wait`; the per-person check above is what holds
     * the body to the clip. */
    const doing = (job) => people.filter((p) => [...mystery.watches, ...(mystery.day0?.watches ?? [])].some((w) => (p.routine?.[w] ?? []).some((s) => s.activity === job))).map((p) => p.id);
    const placed = ['sweep', 'stir', 'hammer', 'spar'].map((job) => [job, doing(job)]);
    check(placed.every(([, ids]) => ids.length),
      `the four generated jobs are all somebody's: ${placed.map(([j, ids]) => `${j} (${ids.join(', ')})`).join(', ')}`,
      `nobody does ${placed.filter(([, ids]) => !ids.length).map(([j]) => j).join(', ')}`);
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
    (f, people) => { of(people, 'baker').routine.terce[0].activity = 'juggle'; },
    /^baker at terce, stop 1: activity "juggle" is one src\/npc\.js has no clip for/);
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
  expect('a routine naming a bell of neither day',
    (f, people) => { of(people, 'carter').routine.matins = [{ room: 'outer-ward', tile: [-8.438, -1.188], activity: 'wait' }]; },
    /^carter: routine names "matins", which is not a bell of either day$/);
  /* THE WALKING DAY'S OWN FOUR, THREE WAYS (SPECS.md's increment 4). Every rail
   * above runs over `day0.watches` as well now, and each of these is the same
   * break moved on to one of them: a stop off the floor, a ring that cannot get
   * back to where the bell before it left the body, and one of the nineteen
   * standing on the fourteenth. The last is the one only this day can fail,
   * because Hywel is in the castle on no other. */
  expect('a day-0 stop with no floor under it',
    (f, people) => { of(people, 'baker').routine['terce-eve'][0].tile = [0.313, 6.5]; },
    /^baker at terce-eve, stop 1: .*no floor to stand on$/);
  expect('a day-0 bell that leaves a body somewhere it cannot walk out of',
    (f, people) => { of(people, 'maid').routine['sext-eve'][0] = { room: 'cell', tile: [-5.063, 3.563], activity: 'wait' }; },
    /^maid: no walk from where terce-eve left them /);
  expect('one of the nineteen standing on the mason at the last bell of the walking day',
    (f, people) => { of(people, 'sacristan').routine['vespers-eve'][0].tile = [5.9, 4.475]; },
    /^sacristan's stop 1 at vespers-eve is 0\.00 m from the hywel's station, inside the 1\.5 m two bodies need$/);
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

  /* THE TALK PAIRS (#732), each break in the shape SPECS.md names for it. A
   * pair is only a pair if both speakers stand still on one gossip stop,
   * in one room, 1.5 to TALK_RADIUS m apart, for the whole of its watch. */
  const pairOf = (f, id) => f.talk.find((t) => t.id === id);
  expect('a talk pair moved to a watch neither speaker gossips at',
    (f) => { pairOf(f, 'talk-sext-inner-ward').watch = 'terce'; },
    /^talk-sext-inner-ward: tiring-woman has one "wait" stop at terce, not one gossip stop, so the pair is not standing still to talk$/);
  expect('a speaker 3.5 m from the other',
    (f, people) => { const m = of(people, 'maid').routine.sext[0].tile; of(people, 'tiring-woman').routine.sext[0].tile = [m[0] + 0.875, m[1]]; },
    /^talk-sext-inner-ward: tiring-woman and maid stand 3\.50 m apart at sext, outside the 1\.5 to 3 m a pair talks across$/);
  expect('a pair naming a hen, who has a ring and no gossip stop',
    (f) => { pairOf(f, 'talk-sext-inner-ward').npcs[0] = 'hen-white'; },
    /^talk-sext-inner-ward: hen-white has 2 stops at sext, not one gossip stop/);
  expect('a pair with one line',
    (f) => { pairOf(f, 'talk-prime-inner-ward').lines.length = 1; },
    /^talk-prime-inner-ward: 1 line\(s\), and a pair needs at least two$/);
  expect('two pairs sharing an id',
    (f) => { f.talk[2].id = f.talk[1].id; },
    /^talk-sext-outer-ward: two talk pairs share that id$/);
  expect('a speaker who is not in the household',
    (f) => { pairOf(f, 'talk-prime-inner-ward').npcs[1] = 'cook'; },
    /^talk-prime-inner-ward: speaker "cook" is not one of the household in people$/);
  expect('a pair whose id does not say what it is',
    (f) => { pairOf(f, 'talk-prime-inner-ward').id = 'prime-inner-ward'; },
    /^prime-inner-ward: a talk pair's id has to start "talk-"$/);

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

/* ------------------------------------ 8d: who the player overhears (#732) ---
 * `Populace.talkDue` is the selector: at this watch, which pair stands still
 * on its two gossip stops with the player in the room and within EARSHOT of
 * the pair's midpoint. Driven the way 8c drives the hound, over plain-object
 * bodies on the real grid, with `setWatch(..., {walk: false})` parking every
 * body on its stop so nothing here waits on a clock (#724). Whether the band
 * then says the lines is test/quest.mjs's; whether main.js wired the two
 * together is test/plan-vs-scene.mjs's (#529).
 */
console.log('\nwho the player overhears, and from where');
{
  const fake = (id) => ({
    id, walking: false,
    group: { visible: true, position: { x: 0, y: 0, z: 0 } },
    walkTo(points) { this.walking = points.length > 1; },
    placeAt({ x, y = 0, z }) { Object.assign(this.group.position, { x, y, z }); this.walking = false; },
    playActivity() {}, facePlayer() {},
  });
  const handed = [], hushed = [];
  const folk = new Populace({
    people: populace.people, npcs: populace.people.map((p) => fake(p.id)), nav, pairs: populace.talk,
    talk: (pair, names) => handed.push({ pair, names }), hush: (id) => hushed.push(id),
  });
  const body = (id) => folk.bodies.find((b) => b.person.id === id);
  /** The pair's two stops, their midpoint, and a player standing `metres` from it along `dir`. */
  const standBy = (pairId, metres, dir = [0, 1]) => {
    const pair = populace.talk.find((t) => t.id === pairId);
    const [a, b] = pair.npcs.map((id) => body(id).stops[0]);
    const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    const at = { x: mid.x + dir[0] * metres, z: mid.z + dir[1] * metres };
    const cell = nav.walk.cellAt(at.x, at.z, a.level);
    return { x: at.x, y: (cell ? cell.h : a.h) + EYE_HEIGHT, z: at.z, room: nav.roomAt(at.x, at.z, cell ? cell.h : a.h).id, want: a.room };
  };

  folk.setWatch('sext', { walk: false });
  const near = standBy('talk-sext-inner-ward', 2);
  check(near.room === near.want, `a player 2 m from the Sext inner-ward pair is standing in ${near.want}`, `stands in ${near.room}`);
  check(folk.talkDue(near)?.id === 'talk-sext-inner-ward', 'the Sext bodies parked and the player 2 m from the inner-ward pair: that pair is due', folk.talkDue(near)?.id ?? 'null');
  const far = standBy('talk-sext-inner-ward', 7);
  check(far.room === far.want && folk.talkDue(far) === null, `7 m off, still in ${far.want}, and nothing is due: out of the ${6} m earshot`, `${far.room}, ${folk.talkDue(far)?.id ?? 'null'}`);

  // One speaker walking off: `walking` true and `settled` false, as `update`
  // leaves a body that has been handed a route.
  const maid = body('maid');
  maid.npc.walking = true; maid.settled = false;
  check(folk.talkDue(near) === null, 'one speaker walking and not settled, and the pair is not due', folk.talkDue(near)?.id ?? 'null');
  maid.npc.walking = false; maid.settled = true;

  // The wire inside Populace: `update` hands a due pair over with its room and
  // the two names in speaking order, and hushes it when the player walks off.
  folk.update(0.05, near);
  const got = handed.at(-1);
  check(got?.pair.id === 'talk-sext-inner-ward' && got.pair.room === 'inner-ward' && got.names.join() === [body('tiring-woman').person.name, maid.person.name].join(),
    'update hands that pair to `talk`, with room inner-ward and the two names in speaking order', got ? `${got.pair.id} in ${got.pair.room}, ${got.names.join(' / ')}` : 'nothing handed');
  folk.update(0.05, standBy('talk-sext-inner-ward', 7));
  check(hushed.length === 0, 'at 7 m, inside the 2 m of hysteresis past earshot, it is not hushed', hushed.join());
  folk.update(0.05, standBy('talk-sext-inner-ward', 9));
  check(hushed.join() === 'talk-sext-inner-ward', 'at 9 m it is hushed, once, by id', hushed.join() || 'not hushed');

  folk.setWatch('prime', { walk: false });
  const prime = standBy('talk-prime-inner-ward', 1);
  check(folk.talkDue(prime)?.id === 'talk-prime-inner-ward', 'Prime, with the player at the Prime pair: the Prime pair is due', folk.talkDue(prime)?.id ?? 'null');
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
    everyStation[npcId] = { ...(everyStation[npcId] ?? {}), [mystery.day2.watches[0]]: station };
  }
  const everyWatch = [...mystery.watches, mystery.day2.watches[0]];
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
