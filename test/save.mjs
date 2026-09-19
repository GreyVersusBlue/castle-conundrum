// save.mjs — the save slot in src/save.js, run without a browser.
//
//   node test/save.mjs        (from the repo root)
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
import { createCastleSlot, buildCatalog, repairState, reputationIn, SAVE_KEY, SAVE_GAME, SAVE_VERSION } from '../src/save.js';
import { createMystery } from '../src/mystery.js';
import { QuestGraph } from '../src/quest-graph.js';
import { QuestManager } from '../src/quest-manager.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const mystery = read('data/mystery.json');
const quest = read('data/quest.json');
const { cast } = read('data/npcs.json');
const { documents } = read('data/documents.json');
const sideQuests = (read('data/quests/index.json').quests ?? []).map((f) => read(`data/quests/${f}`));

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
const { rooms } = read('data/scene-config.json');
const slotWith = (storage = memory()) => ({ slot: createCastleSlot({ mystery, quest, documents, sideQuests, rooms, storage }), storage });
const catalog = buildCatalog(mystery, quest, documents, sideQuests, rooms);

/* ----------------------------------------------------- 1: the slot itself --- */
console.log('the slot');
{
  const { slot, storage } = slotWith();
  check(slot.key === 'castleConundrumSave_v1' && SAVE_KEY === slot.key, 'the key is castleConundrumSave_v1 (#36, #413)');
  check(slot.game === 'castle-conundrum' && SAVE_GAME === slot.game && slot.version === 6 && SAVE_VERSION === 6, 'game castle-conundrum, version 6 (rank 8, reputation by ward)');
  const fresh = slot.fresh();
  const shape = ['stage', 'quests', 'reputation', 'day', 'watch', 'clues', 'pressed', 'taken', 'read', 'visited', 'locks', 'accusations', 'refusals', 'riddleWrong', 'player'];
  check(same(Object.keys(fresh), shape), 'a fresh state has the fifteen fields of the schema, in order', Object.keys(fresh).join(', '));
  check(fresh.stage === quest.start && fresh.day === 1 && fresh.watch === 0 && fresh.player === null && fresh.refusals === 0, 'fresh: the start stage, day one, Prime, no player, no refusals');
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
    stage: 'x', clues: ['body-stair', 'the-butler', 'body-stair', 42], taken: ['pouch', 'crown'], read: ['works-ledger', 'the-lost-codex'], visited: ['great-hall', 'outer-ward', 'great-hall', 'oubliette', 7], locks: ['muniment', 'gate'],
    pressed: { steward: ['admits', 'furious', 'default'], clerk: ['admits'], butler: ['pressed'], cook: 'admits' },
    accusations: [{ who: 'clerk', clues: ['tally-on-walk', 'nothing'], verdict: 'full', watch: 'sext' }, { who: 'butler', clues: [], verdict: 'wrong', watch: 'prime' }, { who: 'nobody', clues: [], verdict: 'nonsense', watch: 'noon' }, 'garbage', null],
  };
  const r = repaired(dirty);
  check(same(r.clues, ['body-stair']), 'unknown and duplicate clues are dropped', r.clues.join(', '));
  check(same(r.taken, ['pouch']) && same(r.locks, ['muniment']), 'unknown evidence and locks are dropped');
  check(same(r.read, ['works-ledger']), 'an unknown document id is dropped from `read` (#551) the same way taken evidence is', r.read.join(', '));
  check(same(r.visited, ['great-hall']), 'a room the plan does not build is dropped from `visited` (#588), the wards with it: they are ground, not rooms', r.visited.join(', '));
  // Without it: the map counts a room that is not on it. The count the tab
  // shows is over the plan's rooms, so a stray id never reaches the DOM — but
  // the SAVE would carry it forever, and the next room cut from the config
  // would be a room the player had "stood in" on every load after.
  check(dirty.visited.filter((id) => typeof id === 'string').some((id) => !rooms.some((room) => room.id === id)),
    'without it: the dirty set names rooms that are not in scene-config.json, so this rail is doing something');
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
  setObjective(t) { this.objective = t; }, setWatch(t) { this.watch = t; },
  toast(t) { this.toasts.push(t); },
  openDialogue(name, lines, onEnd) { this.dialogue = { name, lines }; this.dialogueEnd = onEnd; },
  openRiddle() { this.riddleOpen = true; }, closeRiddle() { this.riddleOpen = false; }, setRiddleFeedback(t) { this.feedback = t; },
  openJournal(entries) { this.journal = entries; }, closeJournal() { this.journal = null; },
  openAccusation(o) { this.accusation = o; }, setAccusationNote(t) { this.note = t; },
  showEpilogue(v, onButton, { label = 'Play Again' } = {}) { this.epilogue = v; this.restart = onButton; this.epilogueLabel = label; },
  closeAccusation() { this.accusation = null; },
});
const stubCastle = () => ({ opened: [], hidden: [], openLock(id) { this.opened.push(id); }, setEvidenceVisible(id, v) { if (!v) this.hidden.push(id); } });
{
  const ui = stubUI();
  const npcs = read('data/npcs.json').cast.map((def) => ({ id: def.id, name: def.name, def, dialogueState: 'default', getDialogueLines() { return this.def.dialogue[this.dialogueState]; } }));
  const changes = [];
  const state = repaired({ stage: 'investigate', riddleWrong: 2, watch: 2, clues: ['summons-note'], pressed: { steward: ['admits'] } });
  const engine = createMystery({ mystery, npcs: cast, state });
  const qm = new QuestManager({
    quest, mystery, riddle, npcs, ui, castle: stubCastle(), engine,
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
  // Resumed in a verdict stage: `showEpilogue` has no verdict in hand and
  // rebuilds it from the save's own `accusations`. Without that a reload after
  // the ending comes back to a blank panel with no way out of it.
  const ui = stubUI();
  const state = repaired({ stage: 'fall', watch: 3, accusations: [{ who: 'nobody', clues: [], verdict: 'fall', watch: 'vespers' }] });
  const engine = createMystery({ mystery, npcs: cast, state });
  const restarts = { n: 0 };
  const qm = new QuestManager({ quest, mystery, riddle, npcs: [], ui, castle: stubCastle(), engine, saved: state, restart: () => { restarts.n++; } });
  check(qm.judged && !qm.victory && !!ui.epilogue, 'resumed at `fall`: the epilogue is on the screen again, and the day is judged without the game being over (#537)');
  check(ui.epilogue.epilogue === mystery.accusation.verdicts.nobody.epilogue, 'and it is the fall\'s own epilogue, rebuilt from the save', ui.epilogue.epilogue?.slice(0, 40));
  check(ui.epilogueLabel === 'The next morning', 'its button offers the second day rather than a fresh one', JSON.stringify(ui.epilogueLabel));
  ui.restart();
  check(restarts.n === 0 && qm.stage === 'morning' && engine.day === 2 && state.day === 2,
    'and pressing it opens the morning instead of erasing the save', `${qm.stage}, day ${engine.day}`);
  check(ui.epilogue.epilogue === mystery.accusation.verdicts.nobody.epilogue, 'the pane it left behind is the one it was, until the inspector re-draws it');
}

{
  // A fresh save, or a save at start, begins at start with no onChange surprises.
  const ui = stubUI();
  const changes = [];
  const qm = new QuestManager({ quest, mystery, riddle, npcs: [], ui, castle: stubCastle(), saved: null, onChange: (s) => changes.push(s) });
  check(qm.stage === quest.start && changes.length === 1 && changes[0].stage === quest.start, 'no save: begins at start and reports it');
}

/* ---------------------------------------------------- 5: the second day --- */
console.log('the second day, through the save');
{
  // WHAT A VERSION-1 SAVE IS. It was written before there was a second day, so
  // it is a save of the first one. `migrate` says that and `repair` never
  // touches it, which is the whole of #37's distinction in four lines.
  const { slot, storage } = slotWith();
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 1, stage: 'investigate', watch: 2, clues: ['summons-note'] }));
  const back = slot.load();
  check(back && back.day === 1, 'a version-1 save comes back as day one', JSON.stringify(back?.day));
  check(back.stage === 'investigate' && back.watch === 2 && same(back.clues, ['summons-note']), 'and nothing else about it moved');
  // The unversioned case, which reads as version 0 and takes the same branch.
  storage.setItem(SAVE_KEY, JSON.stringify({ stage: 'arrive' }));
  check(slot.load()?.day === 1, 'an unversioned save reads as version 0 and lands on day one too');
  /* AND THIS IS THE ONE THAT CAN TELL MIGRATE FROM REPAIR (#147). The two
   * lines above cannot: a version-1 save carries no `day` at all, and repair's
   * clamp answers a missing `day` with 1 whether migrate ran or not, so
   * deleting migrate leaves both of them green and the word "migrate" in an
   * assertion name would have been a lie. What only migrate can say is that a
   * version-1 save is a save of the FIRST day whatever is written in it: day
   * two did not exist when it was written, so a stray `day: 2` in one — hand
   * edited, or forged — is not a second day the player was on. Repair would
   * take it, because the verdict beside it makes it coherent. */
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 1, stage: 'fall', day: 2, accusations: [{ who: 'nobody', clues: [], verdict: 'fall', watch: 'vespers' }] }));
  check(slot.load()?.day === 1, 'a version-1 save claiming day 2 is still day one: version 1 had no second day to be on', JSON.stringify(slot.load()?.day));
  // And a version-2 save keeps its day; `day` is not what version 3 touches.
  const two = { __v: 2, stage: 'morning', day: 2, accusations: [{ who: 'nobody', clues: [], verdict: 'fall', watch: 'vespers' }] };
  storage.setItem(SAVE_KEY, JSON.stringify(two));
  check(slot.load()?.day === 2, 'a version-2 save keeps its day');
}
{
  // WHAT `read` IS (#551). A version-1 or version-2 save was written before
  // there were documents to read, and comes back with an empty list — through
  // repair alone, the same as a `taken` that was never there, since there is
  // no coherence question a missing `read` could get wrong.
  const { slot, storage } = slotWith();
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 1, stage: 'investigate', clues: ['summons-note'] }));
  check(same(slot.load()?.read, []), 'a version-1 save reads with no documents read', JSON.stringify(slot.load()?.read));
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 2, stage: 'investigate', day: 1, read: ['no-such-document'] }));
  check(same(slot.load()?.read, []), 'a version-2 save carrying a stray `read` of an id from before this row is still filtered, not merely defaulted');
  // A version-3 save round-trips a real one.
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 3, stage: 'investigate', day: 1, read: ['works-ledger', 'gravestone'] }));
  check(same(slot.load()?.read, ['works-ledger', 'gravestone']), 'a version-3 save keeps the documents it read', JSON.stringify(slot.load()?.read));
}
{
  /* WHAT `quests` IS (rank 9, version 4). One stage id per file in
   * data/quests/, written from the catalog and never from what came in, so the
   * three ways a save can be wrong about a side quest all land somewhere safe:
   * a quest the save has never heard of gets its own start, a stage that quest
   * no longer has resets to its start, and a quest id that is not in the
   * directory any more is dropped by never being copied across. Without the
   * middle one the manager resumes on a stage `QuestGraph` has no lines for and
   * the dialogue box opens on undefined the first time the player presses E on
   * whoever the quest names. */
  const { slot, storage } = slotWith();
  check(sideQuests.length > 0, `${sideQuests.length} side quest(s) to carry`);
  const starts = Object.fromEntries(sideQuests.map((q) => [q.id, q.start]));
  check(same(slot.fresh().quests, starts), 'a fresh state has every quest at its own start', JSON.stringify(slot.fresh().quests));
  check(same(repaired({}).quests, starts), 'and so does a save that has never heard of any of them');

  const real = sideQuests[0];
  const other = Object.keys(real.stages).find((id) => id !== real.start);
  check(same(repaired({ quests: { [real.id]: other } }).quests, { ...starts, [real.id]: other }),
    `a real stage of ${real.id} survives repair (${other})`, JSON.stringify(repaired({ quests: { [real.id]: other } }).quests));
  check(repaired({ quests: { [real.id]: 'gone-fishing' } }).quests[real.id] === real.start,
    'a stage that quest does not have resets to its own start, not to the frame’s');
  check(!('a-quest-that-was-deleted' in repaired({ quests: { 'a-quest-that-was-deleted': 'x' } }).quests),
    'a quest id that is no longer a file is dropped');
  for (const bad of [null, 'settled', [], 7]) {
    check(same(repaired({ quests: bad }).quests, starts), `a \`quests\` of ${JSON.stringify(bad)} repairs to the starts`);
  }
  // A catalog built with no side quests at all carries none, which is what a
  // Node caller that never loaded the directory gets.
  check(same(repairState({ quests: { [real.id]: other } }, buildCatalog(mystery, quest, documents)).quests, {}),
    'and a catalog built without the directory carries no quests rather than trusting the save');

  // The version drift. A version-3 save was written before there were side
  // quests and comes back with every one of them at its start.
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 3, stage: 'investigate', day: 1, read: [] }));
  check(same(slot.load()?.quests, starts), 'a version-3 save reads with every quest unstarted', JSON.stringify(slot.load()?.quests));
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 4, stage: 'investigate', day: 1, quests: { [real.id]: other } }));
  check(slot.load()?.quests?.[real.id] === other, 'a version-4 save keeps where its quests stand');
}
{
  /* WHAT `visited` IS (rank 10, version 5). One room id per room the player
   * has stood in, in the order they were first entered, held to the rooms
   * data/scene-config.json builds. It is `read`'s case: nothing a missing
   * list could contradict, so repair's own default is right and the version
   * only keeps the field's arrival honest (#37). */
  const { slot, storage } = slotWith();
  check(same(slot.fresh().visited, []), 'a fresh state has stood in no room');
  for (const bad of [null, 'great-hall', { 'great-hall': true }, 7]) {
    check(same(repaired({ visited: bad }).visited, []), `a \`visited\` of ${JSON.stringify(bad)} repairs to none`);
  }
  check(same(repaired({ visited: ['cell', 'kings-tower-2', 'cell'] }).visited, ['cell', 'kings-tower-2']), 'known rooms survive, once each, in the order they were entered');
  check(same(repairState({ visited: ['cell'] }, buildCatalog(mystery, quest, documents, sideQuests)).visited, []),
    'and a catalog built without the config carries no rooms rather than trusting the save');
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 4, stage: 'investigate', day: 1, quests: {} }));
  check(same(slot.load()?.visited, []), 'a version-4 save reads with no room stood in', JSON.stringify(slot.load()?.visited));
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 3, stage: 'investigate', day: 1, visited: ['great-hall'] }));
  check(same(slot.load()?.visited, ['great-hall']), 'a version-3 save carrying a `visited` from before the field existed keeps what is real in it, the way a stray `read` did');
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 5, stage: 'investigate', day: 1, visited: ['great-hall', 'nw-tower-roof'] }));
  check(same(slot.load()?.visited, ['great-hall', 'nw-tower-roof']), 'a version-5 save keeps the rooms it stood in', JSON.stringify(slot.load()?.visited));
}

{
  /* WHAT `reputation` IS (rank 8, version 6). Two counters, `outer` and
   * `inner`, one moved per side quest finished in that ward. Unlike `read`,
   * `quests` and `visited`, this one has something for `migrate` to do: a
   * version-5 save already says where every quest stands, so the errands it
   * finished are reputation it earned, and zeroes would be the save saying the
   * player had done none of them. `repair`'s rail is the ceiling — a ward's
   * counter cannot read higher than the number of quest files in that ward,
   * because the game moves it one per errand and an errand finishes once. */
  const { slot, storage } = slotWith();
  const wardOf = Object.fromEntries(sideQuests.map((q) => [q.id, q.ward]));
  const terminalsOf = Object.fromEntries(sideQuests.map((q) => [q.id, Object.entries(q.stages).filter(([, st]) => st.terminal).map(([id]) => id)]));
  const perWard = { outer: sideQuests.filter((q) => q.ward === 'outer').length, inner: sideQuests.filter((q) => q.ward === 'inner').length };
  check(catalog.wards && same(catalog.wards, perWard), `the catalog counts the errands per ward off the files (${JSON.stringify(perWard)})`, JSON.stringify(catalog.wards));
  check([...catalog.quests.values()].every((q) => q.terminals.size >= 1), 'and knows which stages of each are an ending, which is what finishing one means');
  check(same(slot.fresh().reputation, { outer: 0, inner: 0 }), 'a fresh state has done nobody a favour', JSON.stringify(slot.fresh().reputation));

  // The ceiling, and what carries a number over it. A ward's counter clamps to
  // the errands that ward has; a catalog with no quest files at all clamps both
  // to nothing, the same way `visited` clamps to the rooms the config builds.
  check(same(repaired({ reputation: { outer: 99, inner: 99 } }).reputation, perWard), 'a counter past the errands that exist comes down to them', JSON.stringify(repaired({ reputation: { outer: 99, inner: 99 } }).reputation));
  check(same(repairState({ reputation: { outer: 3, inner: 2 } }, buildCatalog(mystery, quest, documents)).reputation, { outer: 0, inner: 0 }),
    'and a catalog built without the directory carries no reputation rather than trusting the save');
  for (const bad of [{ outer: -4 }, { outer: 2.5 }, { outer: '3' }, { outer: null }, null, 'outer', 7, []]) {
    check(repaired({ reputation: bad }).reputation.outer === 0, `a \`reputation\` of ${JSON.stringify(bad)} repairs that counter to 0`);
  }
  check(!('town' in repaired({ reputation: { town: 4, outer: 1 } }).reputation) && repaired({ reputation: { town: 4, outer: 1 } }).reputation.outer === 1,
    'a ward the castle does not have is dropped by never being copied, and the real one beside it survives', JSON.stringify(repaired({ reputation: { town: 4, outer: 1 } }).reputation));

  /* WITHOUT THE CLAMP. Nothing downstream lowers a counter: the manager reads
   * the save's number straight into its own and only ever adds to it, so a 99
   * that gets past repair is a 99 the game will read out a line for and go on
   * reading out for the rest of the day. Here is that, both ways. */
  const seen = (state) => {
    const npcs = read('data/npcs.json').cast.map((def) => ({ id: def.id, name: def.name, def, dialogueState: 'default', getDialogueLines() { return this.def.dialogue[this.dialogueState]; } }));
    const engine = createMystery({ mystery, npcs: cast, state });
    const qm = new QuestManager({ quest, sideQuests, mystery, riddle, npcs, ui: stubUI(), castle: stubCastle(), engine, saved: state });
    return qm.reputation();
  };
  check(seen({ ...repaired({}), reputation: { outer: 99, inner: 0 } }).outer === 99, 'without it: a manager handed an unrepaired 99 carries the 99');
  check(seen(repaired({ reputation: { outer: 99, inner: 0 } })).outer === perWard.outer, 'repaired, it is the errands the outer ward has', String(seen(repaired({ reputation: { outer: 99, inner: 0 } })).outer));

  /* THE VERSION DRIFT, AND THE ONE LINE ONLY MIGRATE CAN SAY (#37, #147). A
   * version-5 save with errands already finished in it comes back with the
   * reputation those errands are worth. Repair cannot produce this: its own
   * answer to a missing `reputation` is zeroes, and it never re-derives the
   * field from `quests`, so deleting the migrate line turns this assertion red
   * and nothing else in either suite. */
  const finished = Object.fromEntries(sideQuests.map((q) => [q.id, terminalsOf[q.id][0]]));
  const worth = reputationIn(finished, catalog);
  check(same(worth, perWard), 'every errand finished is worth every errand there is, by ward', JSON.stringify(worth));
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 5, stage: 'investigate', day: 1, quests: finished }));
  check(same(slot.load()?.reputation, perWard), 'a version-5 save with every errand done comes back with the reputation it earned, not with zeroes', JSON.stringify(slot.load()?.reputation));
  const one = Object.keys(finished)[0];
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 5, stage: 'investigate', day: 1, quests: { [one]: finished[one] } }));
  check(slot.load()?.reputation?.[wardOf[one]] === 1, `and one errand done (${one}, ${wardOf[one]}) is worth exactly one`, JSON.stringify(slot.load()?.reputation));
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 5, stage: 'investigate', day: 1, quests: { [one]: sideQuests.find((q) => q.id === one).start } }));
  check(same(slot.load()?.reputation, { outer: 0, inner: 0 }), 'an errand opened and not finished is worth nothing');
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 3, stage: 'investigate', day: 1, read: [] }));
  check(same(slot.load()?.reputation, { outer: 0, inner: 0 }), 'and a version-3 save, written before there was an errand to run, owes nobody anything');
  storage.setItem(SAVE_KEY, JSON.stringify({ __v: 6, stage: 'investigate', day: 1, reputation: { outer: 1, inner: 2 } }));
  check(same(slot.load()?.reputation, { outer: 1, inner: 2 }), 'a version-6 save keeps the favours it carries, whatever its quests say', JSON.stringify(slot.load()?.reputation));
}
{
  // THE INCOHERENT SAVE, BOTH WAYS. A `day: 2` with no verdict behind it is a
  // morning after a day that never ended: the engine would look up an outcome
  // that is not there, place nobody at all and hand the manager no lines, and
  // the castle would open at Lauds with thirteen invisible people in it.
  const verdict = [{ who: 'nobody', clues: [], verdict: 'fall', watch: 'vespers' }];
  check(repaired({ day: 2, accusations: verdict }).day === 2, 'day 2 with a verdict behind it stays day 2');
  check(repaired({ day: 2 }).day === 1, 'day 2 with no accusation at all falls back to day 1');
  check(repaired({ day: 2, accusations: [{ who: 'porter', clues: [], verdict: null, watch: 'terce' }] }).day === 1,
    'and so does day 2 behind a refusal, which is an accusation with no verdict in it');
  // The accusation is repaired first, so a verdict the catalog refuses does not
  // hold the day open either.
  check(repaired({ day: 2, accusations: [{ who: 'nobody', clues: [], verdict: 'acquitted', watch: 'vespers' }] }).day === 1,
    'a verdict the catalog has never heard of is stripped, and the day goes with it');
  check(repaired({ day: 7, accusations: verdict }).day === 1 && repaired({ day: '2', accusations: verdict }).day === 1 && repaired({ day: null, accusations: verdict }).day === 1,
    'a 7, a "2" and a null are all day one');
  // And the engine agrees with the save about which day it is on.
  const state = repaired({ stage: 'morning', day: 2, accusations: verdict });
  const engine = createMystery({ mystery, npcs: cast, state });
  check(engine.day === 2 && engine.watch === mystery.day2.watches[0], `the engine on that save is on day two at ${mystery.day2.watches[0]}`, `day ${engine.day} at ${engine.watch}`);
  const undone = createMystery({ mystery, npcs: cast, state: repaired({ stage: 'morning', day: 2 }) });
  check(undone.day === 1 && undone.watch === 'prime', 'and on the repaired incoherent one it is back on day one at Prime', `day ${undone.day} at ${undone.watch}`);

  /* AND THE WATCH IS AN INDEX INTO THE DAY'S OWN LIST (#699). It used to clamp
   * to 0..3 whatever the day said, because the morning had one bell and the
   * engine ignored the number entirely. It does not ignore it now: a day-two
   * save carrying 3 would read as the fourth bell of a morning that has one,
   * and with the clamp gone the engine falls back on its own `Math.min`, which
   * is the same shape as the rail #413 wrote for day one and the same reason
   * it is the save that has to be right (see the watch clamp above).
   *
   * The demotion re-clamps, which is the case the ordering makes: `day` is
   * repaired before `watch` so that the clamp knows the day, and an incoherent
   * `day: 2` is not found to be incoherent until the accusations below it have
   * been repaired. A save demoted to day one keeps the watch it came in with. */
  const morning = mystery.day2.watches.length;
  check(repaired({ day: 2, watch: 3, accusations: verdict }).watch === morning - 1
    && repaired({ day: 2, watch: 0, accusations: verdict }).watch === 0,
    `a day-two watch clamps to the ${morning} bell${morning === 1 ? '' : 's'} of the morning, not to the four`,
    String(repaired({ day: 2, watch: 3, accusations: verdict }).watch));
  check(repaired({ day: 1, watch: 3, accusations: verdict }).watch === 3,
    'and a day-one watch still clamps to the four, on the same save with the same verdict behind it');
  check(repaired({ day: 2, watch: 3 }).watch === 3 && repaired({ day: 2, watch: 3 }).day === 1,
    'a day 2 demoted for having no verdict is re-clamped against day one and keeps its watch', JSON.stringify(repaired({ day: 2, watch: 3 })));
  const two = JSON.parse(JSON.stringify(mystery));
  two.day2.watches = ['lauds', 'lauds-two'];
  const wide = buildCatalog(two, quest, documents, sideQuests, rooms);
  const onTwo = repairState({ stage: quest.start, day: 2, watch: 3, accusations: verdict }, wide);
  check(wide.morningWatches.length === 2 && onTwo.watch === 1,
    'a morning with two bells in it clamps to 1, so the ceiling is the data and not a number written beside it', String(onTwo.watch));
}
{
  // A reload in `morning`: `applyDay` is on that stage's `enter`, so the cast
  // is placed and everybody's day-two lines are in hand before the player has
  // moved. Without it the morning opens with nobody moved.
  const ui = stubUI();
  const npcs = read('data/npcs.json').cast.map((def) => ({ id: def.id, name: def.name, def, dialogueState: 'default', getDialogueLines() { return this.def.dialogue[this.dialogueState]; } }));
  const state = repaired({ stage: 'morning', day: 2, accusations: [{ who: 'prisoner', clues: [], verdict: 'wrong', watch: 'terce' }] });
  const engine = createMystery({ mystery, npcs: cast, state });
  const watches = [];
  const qm = new QuestManager({ quest, mystery, riddle, npcs, ui, castle: stubCastle(), engine, saved: state, onWatch: (w) => watches.push(w) });
  check(qm.stage === 'morning' && watches.at(-1) === mystery.day2.watches[0], 'a save in `morning` resumes there and puts the world at Lauds', `${qm.stage} / ${watches.at(-1)}`);
  check(ui.watch === 'Lauds', 'and the HUD says which bell it is', JSON.stringify(ui.watch));
  check(engine.stationOf('prisoner') === null, 'Madoc hanged and his cell is empty');
  qm.handleInteract(npcs.find((n) => n.id === 'laundress'));
  check(ui.dialogue && /hanged my husband/.test(ui.dialogue.lines.join(' ')), 'and Nest, at the laundry, says what that morning made of her', ui.dialogue?.lines?.[0]?.slice(0, 48));
}
console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
