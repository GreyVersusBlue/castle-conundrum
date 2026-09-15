// save.mjs — the save slot in src/save.js, run without a browser.
//
//   node test/save.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure. In the CI matrix (site-ci.yml).
//
// WHY THIS EXISTS. The key is `castleConundrumSave_v1` and it never changes
// (#36), so what `repair` does to a save on every load (#37) is the only thing
// standing between a hand-edited, truncated or stale localStorage entry and a
// quest graph that throws on a stage it does not have, a journal that renders
// `undefined`, or a camera at NaN. Every rail is asserted twice, section 10
// style: the repaired value, and what goes wrong without it, so a rail that
// stops firing is caught by the second assertion and not only the first.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCastleSlot, buildCatalog, repairState, SAVE_KEY, SAVE_GAME, SAVE_VERSION } from '../src/save.js';
import { createMystery } from '../src/mystery.js';
import { QuestGraph } from '../src/quest-graph.js';
import { QuestManager } from '../src/quest-manager.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const mystery = read('data/mystery.json');
const quest = read('data/quest.json');
const { cast } = read('data/npcs.json');

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** A Map-backed localStorage stand-in. */
const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), keys: () => [...m.keys()] };
};
const slotWith = (storage = memory()) => ({ slot: createCastleSlot({ mystery, quest, storage }), storage });
const catalog = buildCatalog(mystery, quest);

/* ----------------------------------------------------- 1: the slot itself --- */
console.log('the slot');
{
  const { slot, storage } = slotWith();
  check(slot.key === 'castleConundrumSave_v1' && SAVE_KEY === slot.key, 'the key is castleConundrumSave_v1 (#36, #413)');
  check(slot.game === 'castle-conundrum' && SAVE_GAME === slot.game && slot.version === 1 && SAVE_VERSION === 1, 'game castle-conundrum, version 1');
  const fresh = slot.fresh();
  const shape = ['stage', 'watch', 'clues', 'pressed', 'taken', 'locks', 'accusations', 'refusals', 'riddleWrong', 'player'];
  check(same(Object.keys(fresh), shape), 'a fresh state has the ten fields of the schema, in order', Object.keys(fresh).join(', '));
  check(fresh.stage === quest.start && fresh.watch === 0 && fresh.player === null && fresh.refusals === 0, 'fresh: the start stage, Prime, no player, no refusals');
  check(slot.load() === null, 'nothing stored loads as null');
  fresh.clues.push('body-stair');
  fresh.player = { x: 1, y: 1.7, z: 2, yaw: 0.5 };
  check(slot.save(fresh) && storage.keys().length === 1 && storage.keys()[0] === SAVE_KEY, 'save writes exactly one key, and it is the key');
  const back = slot.load();
  check(same(back, fresh), 'a save round-trips through repair unchanged', JSON.stringify(back));
  check(same(slot.normalize(JSON.parse(slot.serialize(fresh))), fresh), 'the export envelope round-trips too');
  check(slot.normalize({ format: 'gvb-save', game: 'torchbearer', version: 1, state: fresh }) === null, "another game's envelope is refused");
  check(same(slot.reset(), slot.fresh()) && slot.load() === null, 'reset erases the key and hands back a fresh state');
}

/* -------------------------------------------------------- 2: validate --- */
console.log('validate');
{
  const { slot } = slotWith();
  check(slot.normalize(null) === null && slot.normalize('x') === null && slot.normalize(42) === null, 'a non-object is refused');
  check(slot.normalize({ watch: 1, clues: [] }) === null, 'a missing stage is refused');
  check(slot.normalize({ stage: 7 }) === null, 'a non-string stage is refused');
  check(slot.normalize({ stage: 'anything' }) !== null, 'a string stage, however wrong, gets through to repair');
}

/* ---------------------------------------------------------- 3: repair --- */
console.log('repair, each rail twice');
const repaired = (s) => repairState(s, catalog);
{
  // The catalog is the data, not a list beside it.
  check(catalog.stages.has('arrive') && catalog.stages.has('investigate') && catalog.stages.has('full'), 'the catalog knows every stage of the graph');
  // Phase 7 deleted the riddle quest, so its stages are not in the catalog any
  // more and a save carrying one is repaired to `start` rather than migrated.
  // There is no honest resume: the quest that save was halfway through is gone.
  check(!catalog.stages.has('seek-keystone') && !catalog.stages.has('present-keystone') && !catalog.stages.has('gate-open'), 'and knows none of the riddle quest, which Phase 7 deleted');
  check(catalog.clues.size === mystery.clues.length && catalog.evidence.size === mystery.evidence.length && catalog.locks.has('muniment'), 'the catalog is built from mystery.json');
  check(catalog.npcs.get('clerk').has('cornered') && !catalog.npcs.get('cook').has('cornered') && catalog.accusables.has('nobody'), "npc states come from the presses; 'nobody' is accusable");
  const noSlot = buildCatalog({ ...mystery, clues: mystery.clues.slice(1) }, quest);
  check(!noSlot.clues.has(mystery.clues[0].id), 'drop a clue from the data and the catalog no longer knows it (nothing is written beside the data)');
}
{
  // Unknown stage -> start. Without it: QuestGraph has no such stage and the
  // manager reads objective off undefined.
  const r = repaired({ stage: 'the-attic' });
  check(r.stage === quest.start, 'a stage the graph lacks resets to start', r.stage);
  const g = new QuestGraph(quest, QuestManager.actions);
  g.stage = 'the-attic';
  let threw = false;
  try { void g.objective; } catch (e) { threw = true; }
  check(threw, 'without it: the graph throws reading the objective of a stage it lacks');
  check(repaired({ stage: 'investigate' }).stage === 'investigate' && repaired({ stage: 'accusing' }).stage === 'accusing', 'a stage the graph has is kept');
  check(repaired({ stage: 'present-keystone' }).stage === quest.start, 'a riddle-quest stage resets to `start`, because that graph no longer exists');
}
{
  // Watch clamps to the four. Without it: the engine indexes past the last watch.
  check(repaired({ stage: 'x', watch: 9 }).watch === 3 && repaired({ stage: 'x', watch: -2 }).watch === 0 && repaired({ stage: 'x', watch: 1.5 }).watch === 0, 'watch clamps to 0..3, and a non-integer resets to 0');
  const m = createMystery({ mystery, npcs: cast, state: { ...repaired({ stage: 'x' }), watch: 9 } });
  check(m.watch === 'vespers', 'without it: an engine handed watch 9 reads it as Vespers only because it clamps too, so the save is what has to be right for the stations to be right');
  check(createMystery({ mystery, npcs: cast, state: repaired({ stage: 'x', watch: 9 }) }).watch === 'vespers', 'repaired, it is Vespers');
}
{
  // Unknown ids are dropped from every list. Without them: the journal shows a
  // clue with no title, and the engine's `holds` says yes to nothing it knows.
  const dirty = {
    stage: 'x', clues: ['body-stair', 'the-butler', 'body-stair', 42], taken: ['pouch', 'crown'], locks: ['muniment', 'gate'],
    pressed: { steward: ['admits', 'furious', 'default'], clerk: ['admits'], butler: ['pressed'], cook: 'admits' },
    accusations: [{ who: 'clerk', clues: ['tally-on-walk', 'nothing'], verdict: 'full', watch: 'sext' }, { who: 'butler', clues: [], verdict: 'wrong', watch: 'prime' }, { who: 'nobody', clues: [], verdict: 'nonsense', watch: 'noon' }, 'garbage', null],
  };
  const r = repaired(dirty);
  check(same(r.clues, ['body-stair']), 'unknown and duplicate clues are dropped', r.clues.join(', '));
  check(same(r.taken, ['pouch']) && same(r.locks, ['muniment']), 'unknown evidence and locks are dropped');
  check(same(r.pressed, { steward: ['admits'] }), "pressed keeps only states that npc's presses reach; `default` and empty lists go", JSON.stringify(r.pressed));
  check(r.accusations.length === 2 && same(r.accusations[0], { who: 'clerk', clues: ['tally-on-walk'], verdict: 'full', watch: 'sext' }) && same(r.accusations[1], { who: 'nobody', clues: [], verdict: null, watch: null }), 'accusations keep known accusables, drop unknown clues, null an unknown verdict or watch, and skip non-objects', JSON.stringify(r.accusations));
  const raw = createMystery({ mystery, npcs: cast, state: { ...repaired({ stage: 'x' }), clues: ['the-butler'] } });
  check(raw.journal().length === 0, 'without it: the journal silently skips an id it cannot title, and the count the HUD shows is a lie');
  const ok = createMystery({ mystery, npcs: cast, state: r });
  check(ok.journal().length === 1 && ok.journal()[0].title, 'repaired: one clue, with a title');
}
{
  // Counters are non-negative integers. Without: refusals -1 gives the player a
  // fourth refusal; riddleWrong "many" makes judgeAnswer count from NaN.
  check(repaired({ stage: 'x', refusals: -1 }).refusals === 0 && repaired({ stage: 'x', refusals: 2.5 }).refusals === 0 && repaired({ stage: 'x', refusals: 2 }).refusals === 2, 'refusals: a non-negative integer or 0');
  check(repaired({ stage: 'x', riddleWrong: 'many' }).riddleWrong === 0 && repaired({ stage: 'x', riddleWrong: 3 }).riddleWrong === 3, 'riddleWrong: a non-negative integer or 0');
  const st = { ...repaired({ stage: 'x' }), refusals: -1, watch: 1 };
  const m = createMystery({ mystery, npcs: cast, state: st });
  m.accuse('cook', []); m.accuse('cook', []); m.accuse('cook', []);
  check(!st.accusations.some((a) => a.verdict === 'fall'), 'without it: refusals -1 survives three refusals without a fall');
  const st2 = { ...repaired({ stage: 'x', refusals: -1 }), watch: 1 };
  const m2 = createMystery({ mystery, npcs: cast, state: st2 });
  m2.accuse('cook', []); m2.accuse('cook', []); m2.accuse('cook', []);
  check(st2.accusations.some((a) => a.verdict === 'fall'), 'repaired: the third refusal is the fall');
}
{
  // A player with a non-finite coordinate is nulled. Without it: the camera is
  // set to NaN and the player sees nothing, forever.
  for (const bad of [{ x: NaN, y: 1.7, z: 0, yaw: 0 }, { x: 0, y: 1.7, z: Infinity, yaw: 0 }, { x: 0, y: 1.7, z: 0, yaw: '0' }, { x: 0, y: 1.7, z: 0 }, 'here', 12]) {
    check(repaired({ stage: 'x', player: bad }).player === null, `player ${JSON.stringify(bad)} is nulled`);
  }
  const p = { x: 1.5, y: 1.7, z: -8, yaw: 0.25, extra: 'dropped' };
  check(same(repaired({ stage: 'x', player: p }).player, { x: 1.5, y: 1.7, z: -8, yaw: 0.25 }), 'a finite player is kept, extras dropped');
  const nan = JSON.parse(JSON.stringify({ x: NaN })); // JSON turns NaN into null on the way to disk
  check(nan.x === null && repaired({ stage: 'x', player: { x: null, y: 1.7, z: 0, yaw: 0 } }).player === null, 'without it: NaN reaches disk as null, and null would be set on the camera');
}
{
  // A save with no version comes through as version 0, migrates (no-op), and is
  // repaired. There is no version 0 save on any machine, because there was no
  // key before Phase 1; this is #36's binding from now on.
  const { slot, storage } = slotWith();
  storage.setItem(SAVE_KEY, JSON.stringify({ stage: 'investigate', riddleWrong: 2, clues: ['ghost'] }));
  const r = slot.load();
  check(r && r.stage === 'investigate' && r.riddleWrong === 2 && same(r.clues, []) && r.watch === 0, 'an unversioned save loads through repair', JSON.stringify(r));
  storage.setItem(SAVE_KEY, '{not json');
  check(slot.load() === null, 'unparseable storage loads as null, not a crash');
}

/* --------------------------------------------- 4: the manager resumes --- */
console.log('the manager resumes from a save');
const riddle = read('data/riddle.json');
/** A UI stand-in that records rather than renders. */
const stubUI = () => ({
  toasts: [], objective: null, epilogue: null,
  setObjective(t) { this.objective = t; }, setWatch() {},
  toast(t) { this.toasts.push(t); },
  openDialogue(name, lines, onEnd) { this.dialogue = { name, lines }; this.dialogueEnd = onEnd; },
  openRiddle() { this.riddleOpen = true; }, closeRiddle() { this.riddleOpen = false; }, setRiddleFeedback(t) { this.feedback = t; },
  openJournal(entries) { this.journal = entries; }, closeJournal() { this.journal = null; },
  openAccusation(o) { this.accusation = o; }, setAccusationNote(t) { this.note = t; },
  showEpilogue(v, onRestart) { this.epilogue = v; this.restart = onRestart; },
});
const stubCastle = () => ({ opened: [], hidden: [], openLock(id) { this.opened.push(id); }, setEvidenceVisible(id, v) { if (!v) this.hidden.push(id); } });
{
  const ui = stubUI();
  const npcs = read('data/npcs.json').cast.map((def) => ({ id: def.id, name: def.name, def, dialogueState: 'default', getDialogueLines() { return this.def.dialogue[this.dialogueState]; } }));
  const changes = [];
  const state = repaired({ stage: 'investigate', riddleWrong: 2, watch: 2, clues: ['summons-note'], pressed: { steward: ['admits'] } });
  const engine = createMystery({ mystery, npcs: cast, state });
  const qm = new QuestManager({
    quest, mystery, riddle, npcs, ui, castle: stubCastle(), controlsRef: { lock() {} }, engine,
    saved: state, onChange: (s) => changes.push({ ...s }),
  });
  check(qm.stage === 'investigate' && ui.objective === quest.stages.investigate.objective, 'a saved stage resumes there with its objective', ui.objective);
  check(qm.wrongCount === 2, 'riddleWrong is restored');
  check(changes.length === 1 && changes[0].stage === 'investigate' && changes[0].riddleWrong === 2, 'onChange fires once on resume with the stage and count', JSON.stringify(changes));
  // The engine, not the stage, says whose lines somebody gives. The Steward was
  // pressed before the reload and comes back in `admits`; everybody else is in
  // the stage's own state. Without _syncStates reading the engine, the graph's
  // dialogueState effect would put him back in `default` and lose the admission.
  check(npcs.find((n) => n.id === 'steward').dialogueState === 'admits', 'the pressed Steward comes back in `admits`');
  check(npcs.filter((n) => n.id !== 'steward').every((n) => n.dialogueState === 'default'), 'and nobody else moved');
  check(qm.journal().some((c) => c.id === 'summons-note'), 'the journal came back with the clue in it');
}
{
  // Resumed in a terminal stage: `showEpilogue` has no verdict in hand and
  // rebuilds it from the save's own `accusations`. Without that a reload after
  // the ending comes back to a blank panel with no way out of it.
  const ui = stubUI();
  const state = repaired({ stage: 'fall', watch: 3, accusations: [{ who: 'nobody', clues: [], verdict: 'fall', watch: 'vespers' }] });
  const engine = createMystery({ mystery, npcs: cast, state });
  const restarts = { n: 0 };
  const qm = new QuestManager({ quest, mystery, riddle, npcs: [], ui, castle: stubCastle(), controlsRef: { lock() {} }, engine, saved: state, restart: () => { restarts.n++; } });
  check(qm.victory && !!ui.epilogue, 'resumed at `fall`: the epilogue is on the screen again');
  check(ui.epilogue.epilogue === mystery.accusation.verdicts.nobody.epilogue, 'and it is the fall\'s own epilogue, rebuilt from the save', ui.epilogue.epilogue?.slice(0, 40));
  ui.restart();
  check(restarts.n === 1, 'its button calls the injected restart, which erases the save');
}
{
  // A fresh save, or a save at start, begins at start with no onChange surprises.
  const ui = stubUI();
  const changes = [];
  const qm = new QuestManager({ quest, mystery, riddle, npcs: [], ui, castle: stubCastle(), controlsRef: {}, saved: null, onChange: (s) => changes.push(s) });
  check(qm.stage === quest.start && changes.length === 1 && changes[0].stage === quest.start, 'no save: begins at start and reports it');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
