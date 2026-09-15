// quest.mjs — the quest graph in data/quest.json and the manager that runs it,
// without a browser. Node only: src/quest-graph.js, src/quest-manager.js and
// src/mystery.js import nothing that needs a DOM or three, so the real manager
// runs here against stand-in UI, NPCs and castle, driving the real engine, and
// the whole day is played in a few milliseconds.
//
//   node test/quest.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. The quest used to be two booleans and an if/else in
// quest-manager.js that knew "scholar" and "guard" by name. The only thing that
// exercised it was play-castle.mjs, which needs real GPU compositing and is
// outside CI on purpose (#353). Now the quest is data and this is the check on
// the data — and from Phase 7 on the code as well, because the manager is what
// stands between an engine that has always worked in Node and a player who has
// never been able to reach any of it.
//
// WHAT PHASE 7 CHANGED HERE. Parts 1 to 3 and 5 to 6 are the same shape and
// point at the promoted frame. Part 4 is new: it was the riddle quest walked
// through four stand-ins, and it is the intended path (WISHLIST.md) walked
// through the real manager to the full ending, plus the three endings that are
// not it. `test/mystery.mjs` drives the same path one layer down, through the
// engine's own API; this drives it the way a player reaches it, through E, the
// Present button, the J key and the accusation panel. The two disagreeing is
// the bug this file exists to find.
//
// Six parts:
//   1. quest.json validates: every `to` is a stage, every action is one the
//      manager implements, every stage is reachable and can reach the end
//   2. quest.json against npcs.json: every stage's dialogueState exists on every
//      npc, every {TOKEN} is known, and each of the manager's token/action pairs
//      matches in both directions
//   3. the graph itself: dispatch from every stage on every event lands on a
//      stage, a terminal stage ignores everything, the riddle judge escalates
//   4. the manager, end to end, against stand-ins: the intended path to the full
//      ending, the prisoner accepted on nothing, three refusals to a fall, and a
//      reload at Sext that comes back with the journal intact
//   5. the page: index.html's initial objective is the start stage's, and every
//      element id src/ui.js reads is in it
//   6. the locks and the places: every `lock:<id>` a stage listens for is a door
//      scene-config really builds and really ships shut, and every location clue
//      names a room the plan has and the player can stand in

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QuestGraph, validateQuest, validateAgainstNpcs, judgeAnswer, renderLines } from '../src/quest-graph.js';
import { QuestManager, MANAGER_PAIRS } from '../src/quest-manager.js';
import { createMystery, freshState } from '../src/mystery.js';
import { makePlan } from '../src/castle-plan.js';
import { castleNav } from '../src/stations.js';
import { partsOf } from './gltf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const quest = read('data/quest.json');
const { cast: npcDefs } = read('data/npcs.json');
const riddle = read('data/riddle.json');
const scene = read('data/scene-config.json');
const mystery = read('data/mystery.json');

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------------------------------------------------- 1: the graph is valid --- */
console.log('quest.json validates');
{
  const problems = validateQuest(quest, QuestManager.actions);
  check(problems.length === 0, 'validateQuest finds nothing wrong', problems.join('; '));
  const ids = Object.keys(quest.stages);
  check(ids.length >= 3, `${ids.length} stages`, 'a quest with fewer than three stages is the two booleans again');

  // The validator has to actually reject things, or a green run above proves
  // nothing. Each broken copy should produce a problem that names the break.
  const broken = (mutate) => { const d = JSON.parse(JSON.stringify(quest)); mutate(d); return validateQuest(d, QuestManager.actions); };
  const expect = (label, mutate, re) => {
    const p = broken(mutate);
    check(p.some((x) => re.test(x)), `validator rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
  };
  expect('a `to` naming no stage', (d) => { d.stages.investigate.transitions.find((t) => t.to).to = 'nowhere'; }, /names no stage/);
  expect('an action the manager lacks', (d) => { d.stages.investigate.transitions[0].do = ['openTrapdoor']; }, /unknown action "openTrapdoor"/);
  expect('an unreachable stage', (d) => { d.stages.attic = { objective: 'Up there.', dialogueState: 'default', transitions: [{ on: 'x', to: d.start }] }; }, /attic: no path from `start`/);
  expect('a stage that cannot reach the end', (d) => { d.stages.oubliette = { objective: 'Down here.', dialogueState: 'default' }; d.stages[d.start].transitions.push({ on: 'fall', to: 'oubliette' }); }, /oubliette: no path from it reaches a terminal/);
  expect('no terminal stage', (d) => { for (const s of Object.values(d.stages)) delete s.terminal; }, /no stage is `terminal`/);
  expect('two stages with one objective', (d) => { const [a, b] = Object.values(d.stages); b.objective = a.objective; }, /same text as/);
  expect('a second transition on the same event', (d) => { const t = d.stages.investigate.transitions; t.push({ ...t[0] }); }, /second transition on/);
  expect('a bad `start`', (d) => { d.start = 'prologue'; }, /`start`.*is not a stage/);
  expect('a terminal stage with a way out', (d) => { d.stages.full.transitions = [{ on: 'x', to: 'right' }]; }, /terminal stage has a transition that leaves it/);
}

/* ------------------------------------------- 2: the graph against the cast --- */
console.log('quest.json against npcs.json');
{
  const problems = validateAgainstNpcs(quest, npcDefs, { pairs: MANAGER_PAIRS });
  check(problems.length === 0, 'every stage has lines on every one of the twelve, every token is known, and both pairs match', problems.join('; '));
  const states = new Set(Object.values(quest.stages).map((s) => s.dialogueState));
  // A press in mystery.json is the other thing that moves an NPC's state, and
  // the states it moves them to are that file's to check (src/mystery.js does).
  for (const p of mystery.presses) states.add(p.to);
  for (const npc of npcDefs) {
    const extra = Object.keys(npc.dialogue).filter((k) => !states.has(k));
    check(extra.length === 0, `${npc.id} has no dialogue no stage and no press can reach`, extra.join(', '));
  }
  const talkedTo = [...new Set(Object.values(quest.stages).flatMap((s) => (s.transitions ?? []).map((t) => /^talked:(.+)$/.exec(t.on)?.[1])).filter(Boolean))];
  const strangers = talkedTo.filter((id) => !npcDefs.some((n) => n.id === id));
  check(strangers.length === 0, `every conversation the quest turns on is with somebody the castle spawns (${talkedTo.join(', ')})`, strangers.join(', '));

  const brokenNpcs = (mutate, opts = { pairs: MANAGER_PAIRS }) => { const d = JSON.parse(JSON.stringify(npcDefs)); mutate(d); return validateAgainstNpcs(quest, d, opts); };
  const brokenQuest = (mutate, opts = { pairs: MANAGER_PAIRS }) => { const q = JSON.parse(JSON.stringify(quest)); mutate(q); return validateAgainstNpcs(q, npcDefs, opts); };
  let p = brokenNpcs((d) => { delete d.find((n) => n.id === 'cook').dialogue.default; });
  check(p.some((x) => /cook has no `dialogue.default`/.test(x)), 'a dropped dialogue state on one npc is caught', p.join('; ') || 'said nothing');
  p = brokenNpcs((d) => { d[0].dialogue.default.push('{PROPHECY}'); });
  check(p.some((x) => /token \{PROPHECY\} is not in quest.tokens/.test(x)), 'an unknown token is caught', p.join('; ') || 'said nothing');

  // The riddle half of the pair. Nobody poses {RIDDLE}: Phase 4 moved it onto
  // the muniment room's word-lock, so openRiddle runs on a `lock:` event and
  // the legal shapes are the two this checks.
  p = brokenQuest((q) => { q.stages.investigate.transitions.find((t) => t.on === 'lock:muniment').on = 'bell:3'; });
  check(p.some((x) => /openRiddle runs on bell:3, which is neither the end of a conversation .* nor a word-lock/.test(x)), 'openRiddle hung on an event that is neither a conversation nor a lock is caught', p.join('; ') || 'said nothing');
  p = brokenQuest((q) => { q.stages.investigate.transitions.find((t) => t.on === 'lock:muniment').on = 'talked:chaplain'; });
  check(p.some((x) => /openRiddle runs after chaplain\/default but those lines never pose it/.test(x)), 'pointing the riddle at somebody who does not pose it is caught', p.join('; ') || 'said nothing');
  p = brokenNpcs((d) => { d.find((n) => n.id === 'chaplain').dialogue.default.push('{RIDDLE}'); });
  check(p.some((x) => /chaplain\/default poses \{RIDDLE\} but no stage/.test(x)), 'an npc posing the riddle with nothing opening it is caught', p.join('; ') || 'said nothing');

  // The accusation half, which is the pair Phase 7 added. Both directions, and
  // both have to be caught by the SAME generalised code, not by a second copy
  // of it: `pairs` is what the manager exports and this is what reads it.
  p = brokenNpcs((d) => { const c = d.find((n) => n.id === 'constable'); c.dialogue.default = c.dialogue.default.filter((l) => l !== '{ACCUSE}'); });
  check(p.some((x) => /openAccusation runs after constable\/default but those lines never pose it \(\{ACCUSE\}\)/.test(x)), 'taking {ACCUSE} off the Constable, with two stages still opening the panel after him, is caught', p.join('; ') || 'said nothing');
  p = brokenQuest((q) => { for (const s of Object.values(q.stages)) s.transitions = (s.transitions ?? []).filter((t) => !(t.do ?? []).includes('openAccusation')); });
  check(p.some((x) => /constable\/default poses \{ACCUSE\} but no stage in that dialogueState runs openAccusation/.test(x)), 'a Constable who asks for a name with no stage that opens the panel is caught', p.join('; ') || 'said nothing');
  check(brokenNpcs((d) => { const c = d.find((n) => n.id === 'constable'); c.dialogue.default = c.dialogue.default.filter((l) => l !== '{ACCUSE}'); }, { pairs: [MANAGER_PAIRS[0]] }).length === 0,
    'and neither break fires when only the riddle pair is passed: the rail is the pair list, not a second hard-coded token');
}

/* ------------------------------------------------------ 3: the graph runs --- */
if (validateQuest(quest, QuestManager.actions).length) {
  console.log(`\n${failures} failure(s) — quest.json is invalid, parts 3 to 6 not run`);
  process.exit(1);
}
console.log('the graph');
{
  const g = new QuestGraph(quest, QuestManager.actions);
  const begin = g.begin();
  check(g.stage === quest.start && begin.some((e) => e.type === 'objective' && e.text === quest.stages[quest.start].objective), 'begin() lands on the start stage with its objective');

  // From every stage, every event the graph knows plus one it does not: the
  // result is always a stage, and effects only ever name known actions.
  const events = [...g.events(), 'talked:cook', 'riddle:wrong', 'nonsense'];
  let landed = 0, strays = 0;
  for (const id of Object.keys(quest.stages)) {
    for (const ev of events) {
      g.stage = id;
      const effects = g.dispatch(ev);
      if (!quest.stages[g.stage]) strays++;
      if (effects.some((e) => e.type === 'action' && !QuestManager.actions.includes(e.name))) strays++;
      landed++;
    }
  }
  check(strays === 0, `${landed} dispatches from every stage on every event all land on a stage naming only known actions`, `${strays} strayed`);

  for (const terminal of Object.keys(quest.stages).filter((id) => quest.stages[id].terminal)) {
    g.stage = terminal;
    const after = events.map((ev) => g.dispatch(ev));
    check(g.stage === terminal && after.every((e) => e.length === 0), `the terminal stage ${terminal} ignores every event`);
  }

  // The four verdict classes, each to its own ending, and no two the same.
  g.begin();
  g.dispatch('talked:constable');
  check(g.stage === 'investigate', 'one conversation with the Constable and the day begins');
  const endings = {};
  for (const cls of ['full', 'right', 'wrong', 'fall']) {
    g.stage = 'accusing';
    g.dispatch(`verdict:${cls}`);
    endings[cls] = g.stage;
    check(g.done, `verdict:${cls} ends the day in ${g.stage}`);
  }
  check(new Set(Object.values(endings)).size === 4, 'the four classes reach four different endings', JSON.stringify(endings));

  // The riddle judge.
  const wrong1 = judgeAnswer(riddle, 'a door', 0);
  const wrong2 = judgeAnswer(riddle, 'the sky', wrong1.wrongCount);
  const wrong9 = judgeAnswer(riddle, 'a chicken', 8);
  check(!wrong1.ok && !wrong2.ok && wrong1.feedback !== wrong2.feedback, 'wrong answers escalate');
  check(!/Hint:/.test(wrong1.feedback) && /Hint:/.test(wrong2.feedback), 'the hint joins from the second wrong answer on');
  check(wrong9.feedback === `${riddle.wrongAnswerResponses.at(-1)} Hint: ${riddle.hint}`, 'past the last response it holds at the last');
  for (const a of ['River', '  the RIVER ', 'a\triver']) check(judgeAnswer(riddle, a, 2).ok, `${JSON.stringify(a)} is accepted`);
  check(!judgeAnswer(riddle, 'rivers', 0).ok && !judgeAnswer(riddle, '', 0).ok, 'near-misses and blanks are not');
  check(same(renderLines(['a', '{NOPE}'], quest.tokens), ['a', '{NOPE}']), 'renderLines leaves an unknown token alone');
  check(renderLines(['{ACCUSE}'], quest.tokens)[0] === quest.tokens['{ACCUSE}'], 'and substitutes the one it knows');
}

/* ---------------------------------------------- 4: the manager, end to end ---
 * The real QuestManager, the real QuestGraph and the real engine, against a UI
 * that records instead of rendering and NPCs that are an id, a name and their
 * lines. Every call below is one a player makes: E on somebody, E on a thing, E
 * on the bell, E on the word-lock, the Present button, the J key, a name and up
 * to three clues in the accusation panel. */
console.log('the manager against stand-ins');

/** A UI stand-in. The `_` helpers are the player's hand, not part of the API. */
function stubUI() {
  return {
    log: [], toasts: [], objective: null, watch: null,
    dialogue: null, journal: null, accusation: null, note: null, epilogue: null, riddleOpen: false, feedback: [],
    setObjective(t) { this.objective = t; this.log.push(`objective:${t}`); },
    setWatch(t) { this.watch = t; },
    toast(t) { this.toasts.push(t); this.log.push(`toast:${t}`); },
    openDialogue(name, lines, onEnd, { onPresent = null } = {}) { this.dialogue = { name, lines, onEnd, onPresent }; this.log.push(`dialogue:${name}`); },
    openRiddle(text, onSubmit, onClose) { this.riddleOpen = true; this.riddleText = text; this._submit = onSubmit; this._close = onClose; this.log.push('riddle:open'); },
    setRiddleFeedback(t) { this.feedback.push(t); },
    closeRiddle() { this.riddleOpen = false; this.log.push('riddle:close'); this._close?.(); },
    openJournal(entries, { empty = '', present = null } = {}) { this.journal = { entries, empty, present }; this.log.push(`journal:${present ? 'present' : 'read'}:${entries.length}`); },
    closeJournal() { this.journal = null; },
    openAccusation(o) { this.accusation = o; this.note = null; this.log.push('accusation:open'); },
    setAccusationNote(t) { this.note = t; },
    closeAccusation() { this.accusation = null; },
    showEpilogue(v, onRestart) { this.epilogue = v; this._restart = onRestart; this.log.push(`epilogue:${v.class}`); },
    // --- the player's hand ---
    endDialogue() { const d = this.dialogue; this.dialogue = null; d?.onEnd?.(); },
    pressPresent() { this.dialogue?.onPresent?.(); },
    pickClue(id) { this.journal?.present?.(id); },
    answer(a) { this._submit(a); },
    say(who, clues) { this.accusation.onAccuse(who, clues); },
    restart() { this._restart(); },
  };
}

function rig({ saved = null } = {}) {
  const ui = stubUI();
  const npcs = npcDefs.map((def) => ({
    id: def.id, name: def.name, def, talking: false, dialogueState: 'default',
    getDialogueLines() { return this.def.dialogue[this.dialogueState]; },
  }));
  // `shown` is the last visibility the manager asked for, per evidence id, so a
  // beat can ask what is on the ground at this bell rather than only what was
  // ever hidden.
  const castle = {
    opened: [], hidden: [], shown: {},
    openLock(id) { this.opened.push(id); },
    setEvidenceVisible(id, v) { this.shown[id] = v; if (!v) this.hidden.push(id); },
  };
  const controls = { locks: 0, lock() { this.locks++; } };
  const state = saved ?? freshState(quest);
  const engine = createMystery({ mystery, npcs: npcDefs, state });
  const restarts = { n: 0 };
  const watches = [];
  const qm = new QuestManager({
    quest, mystery, riddle, npcs, ui, castle, controlsRef: controls, engine,
    saved, restart: () => { restarts.n++; },
    onWatch: (w) => watches.push(w),
    // What main.js does with onChange, because the stage and the wrong-answer
    // count are the only two things in the save the engine does not own. Leave
    // it out and the reload below comes back in `arrive` with a Sext watch,
    // which is exactly the bug it is here to catch.
    onChange: ({ stage, riddleWrong }) => { state.stage = stage; state.riddleWrong = riddleWrong; },
  });
  const npc = (id) => npcs.find((n) => n.id === id);
  return {
    qm, ui, npcs, castle, controls, engine, state, restarts, watches, npc,
    /** E on somebody, then step through to the end of what they say. */
    talk(id) { qm.handleInteract(npc(id)); ui.endDialogue(); return ui.toasts; },
    /** E on somebody, the Present button, then a clue in the list that opens. */
    present(id, clueId) { qm.handleInteract(npc(id)); ui.pressPresent(); ui.pickClue(clueId); },
    examine(id) { return qm.handleExamine(id); },
    ring() { return qm.handleBell(); },
    holds: (id) => engine.holds(id),
  };
}

{
  // THE INTENDED PATH (WISHLIST.md), through the manager, to the full ending.
  const r = rig();
  const { qm, ui, engine, state } = r;
  check(qm.stage === 'arrive' && ui.objective === quest.stages.arrive.objective, 'a fresh day starts in `arrive` with the mason dead on the tracker', ui.objective);
  check(engine.watch === 'prime', 'and at Prime');

  // Prime.
  r.talk('constable');
  check(r.holds('constable-accident') && qm.stage === 'investigate', 'the Constable says he fell, and the day begins');
  check(ui.toasts.some((t) => /New clue/.test(t)), 'a clue landing says so', ui.toasts.at(-1));
  check(ui.accusation === null, 'his first conversation opens no accusation panel: `arrive` moves on instead of asking');

  r.examine('body');
  check(r.holds('body-stair'), 'E on the body: he is at the foot of the stair');
  r.examine('pouch');
  check(r.holds('summons-note') && r.holds('pouch-empty'), 'E on the pouch: the note and no tallies');
  check(state.taken.includes('pouch') && r.castle.hidden.includes('pouch'), 'and it leaves the world, in the save and in the castle', r.castle.hidden.join(','));
  ui.toasts.length = 0;
  r.examine('pouch');
  check(ui.toasts.length === 1 && ui.toasts[0] === mystery.ui.gone, 'E on it again says so rather than nothing', JSON.stringify(ui.toasts));
  ui.toasts.length = 0;
  r.examine('cart');
  check(ui.toasts[0] === mystery.ui.absent, 'the merchant\'s cart is not here at Prime, and says so', JSON.stringify(ui.toasts));

  r.talk('cook');
  check(r.holds('cook-lantern') && r.holds('lantern-set-down'), 'the cook, and the deduction lands with her');
  r.talk('porter');
  check(r.holds('porter-log') && r.holds('porter-barred'), 'the porter: the log and "barred as always"');
  r.examine('cloak');
  check(r.holds('cloak-wax'), 'the cloak in the laundry');
  r.talk('apprentice');
  check(r.holds('apprentice-tallies') && r.holds('tallies-taken'), 'the apprentice, and tallies-taken deduced');
  r.talk('chaplain');
  check(!r.holds('chaplain-feet'), 'the chaplain says nothing yet');

  // Somebody asleep is not silence either.
  ui.toasts.length = 0;
  r.qm.handleInteract(r.npc('sentry'));
  check(same(ui.dialogue.lines, [mystery.ui.asleep]), 'the sentry is asleep at Prime and the box says so rather than opening on his lines', JSON.stringify(ui.dialogue?.lines));
  ui.dialogue = null;

  // The J key: the graph decides, and `investigate` says yes.
  qm.handleJournal();
  check(ui.journal && ui.journal.entries.length === state.clues.length && !ui.journal.present, `J opens the journal read-only with all ${state.clues.length} clues`);
  ui.closeJournal();

  // Ring.
  r.ring();
  check(engine.watch === 'terce' && ui.watch === 'Terce' && r.watches.at(-1) === 'terce', 'the bell: Terce, and the tracker and the world follow it', `${ui.watch} / ${r.watches.at(-1)}`);
  // WHAT IS ON THE GROUND AT THIS BELL. The body is a Prime-only thing and goes
  // with the bell; the cart arrives with it. The pouch is listed at all four
  // watches and must NOT come back, because it is in the player's hands — which
  // is what reading `watches` alone got wrong, with `taken` in the save saying
  // otherwise the whole time.
  check(mystery.evidence.find((e) => e.id === 'pouch').watches.includes('terce'), 'the pouch is listed at Terce, so this is a real question', '');
  check(r.castle.shown.pouch === false, 'and the pouch stays gone at Terce, because the player took it at Prime', String(r.castle.shown.pouch));
  check(r.castle.shown.body === false, 'the body is a Prime-only thing and goes with the bell');
  check(r.castle.shown.cart === true, 'the merchant\'s cart arrives with it');

  // Terce.
  r.examine('cart');
  check(r.holds('merchant-cart'), 'under the sacking: the King\'s lead');
  r.talk('merchant');
  check(r.holds('merchant-stone'), '"I buy stone"');
  r.present('merchant', 'merchant-cart');
  check(r.holds('merchant-admits') && engine.npcState('merchant') === 'admits', 'presented with the cart, the merchant admits');
  check(r.npc('merchant').dialogueState === 'admits' && same(ui.dialogue.lines, r.npc('merchant').def.dialogue.admits), 'and the box is open on his new lines, not his old ones');
  r.talk('sentry');
  check(r.holds('sentry-sighting'), 'the sentry, awake at Terce, saw fur on the walk');
  qm.handleEnter('cross-walk', 2);
  check(r.holds('walk-crosses'), 'walking onto the cross-wall walk is itself a clue');
  r.examine('walk-door');
  check(r.holds('door-unbarred'), 'the Stockhouse door, unbarred');
  r.examine('tally');
  check(r.holds('tally-on-walk') && state.taken.includes('tally'), 'the tally stick in the gutter, taken');
  r.examine('candle');
  check(r.holds('chapel-candle') && r.holds('wax-matches'), 'the candle, and wax-matches deduced against the cloak');

  r.ring();
  check(engine.watch === 'sext', 'the second bell: Sext');

  // Sext.
  r.talk('lady');
  check(r.holds('lady-hand') && r.holds('summons-is-stewards'), "the lady's sevens: the note is the Steward's");
  r.present('lady', 'walk-crosses');
  check(r.holds('lady-window'), 'presented with the walk, she says what she saw from her window');

  // THE PRESS RAIL. This is the assertion the WISHLIST names for this phase's
  // first break: unhook the Present button from the manager and this is what
  // fires. The press moves him, and the box that opens is his new state's.
  ui.toasts.length = 0;
  r.present('steward', 'summons-is-stewards');
  check(engine.npcState('steward') === 'admits' && r.holds('steward-admits'),
    'presenting summons-is-stewards to the Steward moves him to pressed',
    `state ${engine.npcState('steward')}, holds ${r.holds('steward-admits')}`);
  check(r.npc('steward').dialogueState === 'admits', 'and the body in front of you is in that state too');

  // A press that moves nobody is answered, not met with silence.
  const before = engine.npcState('steward');
  r.present('steward', 'summons-is-stewards');
  check(engine.npcState('steward') === before, 'presenting the same thing again moves nobody');
  check(ui.dialogue && same(ui.dialogue.lines, renderLines(r.npc('steward').def.dialogue.default, quest.tokens)), 'and he answers with his default lines rather than saying nothing', JSON.stringify(ui.dialogue?.lines?.[0]?.slice(0, 40)));

  // A shrug is not a conversation. Present the wrong thing to the Constable and
  // the accusation panel must NOT open: `talked:constable` is what opens it,
  // and a press dispatches no such event.
  ui.accusation = null;
  r.present('constable', 'summons-is-stewards');
  check(ui.accusation === null, 'shrugging at the Constable does not open the accusation panel: a press is not a conversation');

  r.present('chaplain', 'steward-admits');
  check(r.holds('chaplain-feet'), 'the chaplain heard two men on the stair');

  // The word-lock: reading it and being asked it are one press of E.
  ui.toasts.length = 0;
  check(r.examine('ledger')[0].type === 'locked', 'the ledger is behind the lock');
  check(ui.toasts[0] === mystery.ui.locked, 'and says so');
  qm.handleLock('muniment', 'lock');
  check(r.holds('word-lock'), 'E at the door reads the word-lock into the journal');
  check(ui.riddleOpen && ui.riddleText === riddle.riddle, 'and opens the riddle in the same press');
  ui.answer('a door');
  ui.answer('the sky');
  check(ui.riddleOpen && ui.feedback.length === 2 && /Hint:/.test(ui.feedback[1]), 'two wrong answers: two feedbacks and a hint');
  ui.answer('River');
  check(!ui.riddleOpen && r.controls.locks === 1, 'the right answer closes the overlay and re-locks the pointer');
  check(state.locks.includes('muniment') && r.castle.opened.includes('muniment'), 'and opens the muniment room in the engine and in the castle', r.castle.opened.join(','));
  r.examine('ledger');
  check(r.holds('ledger') && r.holds('lead-sold'), 'the ledger, and lead-sold deduced against the apprentice\'s count');

  r.present('clerk', 'wax-matches');
  check(r.holds('clerk-cloak'), '"since Sunday"');
  r.present('clerk', 'lead-sold');
  check(r.holds('clerk-cornered') && engine.npcState('clerk') === 'cornered', 'the Clerk, cornered');

  r.ring();
  check(engine.watch === 'vespers' && qm.stage === 'investigate', 'the third bell: Vespers, and the day is not over yet');
  r.present('porter', 'door-unbarred');
  check(r.holds('porter-admits'), 'the porter admits the door');

  check(state.clues.length === 33, `${state.clues.length} clues held, the same 33 test/mystery.mjs counts down at the engine`, state.clues.join(', '));

  // The accusation. Talking to him is what asks for it; his last line is the
  // {ACCUSE} token and the stage answers it.
  r.talk('constable');
  check(ui.accusation !== null, 'talking to the Constable now opens the accusation panel');
  check(ui.accusation.people.length === 12 && ui.accusation.fall.id === 'nobody', 'twelve names and a fall', `${ui.accusation.people.length} people`);
  check(ui.accusation.clues.length === 33 && ui.accusation.present === mystery.accusation.present, 'the journal is in it, and up to three may be shown');

  ui.say('clerk', ['sentry-sighting', 'wax-matches', 'lead-sold']);
  check(qm.stage === 'full' && qm.victory, 'the Clerk on the sighting, the wax and the lead: the full ending', qm.stage);
  check(ui.epilogue && ui.epilogue.class === 'full' && /Ferrour hangs/.test(ui.epilogue.convicted) && /Wykes/.test(ui.epilogue.epilogue), 'the verdict and the epilogue are on the screen', ui.epilogue?.class);
  check(state.accusations.length === 1 && state.accusations[0].verdict === 'full' && state.accusations[0].watch === 'vespers', 'and the accusation is in the save');
  ui.restart();
  check(r.restarts.n === 1, 'the button calls the injected restart, which erases the save');

  // After the ending, nothing repeats.
  const rings = r.ring().length;
  check(rings === 0 && qm.stage === 'full', 'after the verdict the bell does nothing');
}

{
  // THE PRISONER, ACCEPTED ON NOTHING. Madoc's convicts list is empty, which is
  // not an oversight: it is the ending the Constable wanted, and he takes it
  // without reading a clue.
  const r = rig();
  const { qm, ui, state } = r;
  r.talk('constable');
  r.ring();
  r.talk('constable');
  check(ui.accusation !== null, 'the panel opens at Terce, which is the earliest the Constable will hear it');
  ui.say('prisoner', []);
  check(qm.victory && ui.epilogue && ui.epilogue.class === 'wrong', 'the prisoner is accepted on no clues at all, and it is a wrong hanging', ui.epilogue?.class);
  check(/Madoc the smith hangs/.test(ui.epilogue.convicted), 'Madoc hangs', ui.epilogue.convicted.slice(0, 40));
  check(state.refusals === 0, 'and it is not a refusal: he does not need to be argued into it');
}

{
  // TOO EARLY. At Prime he will not hear it at all, and it costs nothing.
  const r = rig();
  const { ui, state } = r;
  r.talk('constable');
  r.talk('constable');
  check(ui.accusation !== null, 'the panel opens at Prime');
  ui.say('clerk', ['constable-accident']);
  check(state.accusations.length === 0 && state.refusals === 0, 'an accusation at Prime is not heard and is not a refusal');
  check(ui.note === mystery.accusation.early, 'the panel says why, in the Constable\'s own words', JSON.stringify(ui.note));
  check(!r.qm.victory, 'and the day goes on');
}

{
  // THREE REFUSALS TO A FALL. He refuses anything under two convicting clues,
  // and the third refusal ends the day as the fall he wanted all along.
  const r = rig();
  const { qm, ui, state } = r;
  r.talk('constable');
  r.talk('porter');
  r.examine('walk-door');
  r.ring();
  r.talk('constable');

  ui.say('porter', ['porter-barred']);
  check(state.refusals === 1 && qm.stage === 'accusing' && !qm.victory,
    'one clue is refused',
    `refusals ${state.refusals}, stage ${qm.stage}`);
  check(ui.note === mystery.accusation.refused, 'and the refusal is written into the panel that is still open', JSON.stringify(ui.note)?.slice(0, 40));
  ui.say('porter', ['door-unbarred']);
  check(state.refusals === 2 && !qm.victory, 'a second single clue: refused again');
  ui.say('cook', ['porter-barred', 'door-unbarred']);
  check(state.refusals === 3, 'naming somebody with no convicts list at all is the third refusal');
  check(qm.victory && ui.epilogue && ui.epilogue.class === 'fall', 'and the third ends the day: he writes it down as a fall', ui.epilogue?.class);
  check(state.accusations.at(-1).who === 'nobody' && state.accusations.at(-1).verdict === 'fall', 'the save records the fall, not the cook');
}

{
  // THE FOURTH BELL. Nobody has to ask: at Vespers he demands it, and the panel
  // is open whether the player wanted it or not.
  const r = rig();
  r.talk('constable');
  r.ring(); r.ring(); r.ring();
  check(r.engine.watch === 'vespers' && r.qm.stage === 'investigate', 'three rings and the day is at Vespers');
  const fx = r.ring();
  check(fx.some((e) => e.type === 'demand'), 'the fourth ring is a demand, not a watch');
  check(r.engine.watch === 'vespers', 'and the watch stays at Vespers');
  check(r.qm.stage === 'accusing' && r.ui.accusation !== null, 'the frame is in `accusing` and the panel is open', r.qm.stage);
  // A fall named here is the ending, and it is not the same one as three refusals.
  r.ui.say('nobody', []);
  check(r.qm.stage === 'fall' && r.ui.epilogue.class === 'fall', 'calling it a fall ends the day');
}

{
  // A RELOAD AT SEXT. Everything the player holds is in the save; a second
  // manager on the repaired state comes back to the same journal, the same
  // pressed Steward and the same watch, with nothing re-toasted at them.
  const first = rig();
  first.talk('constable');
  first.examine('body');
  first.examine('pouch');
  first.talk('cook');
  first.ring();
  first.talk('sentry');
  first.ring();
  first.talk('lady');
  first.present('steward', 'summons-is-stewards');
  const held = first.state.clues.length;
  check(first.engine.npcState('steward') === 'admits', 'before the reload: the Steward is pressed');
  const saved = JSON.parse(JSON.stringify(first.state));

  const second = rig({ saved });
  check(second.engine.watch === 'sext' && second.qm.stage === 'investigate', 'the reload comes back at Sext, mid-investigation', `${second.engine.watch}/${second.qm.stage}`);
  second.qm.handleJournal();
  check(second.ui.journal && second.ui.journal.entries.length === held, `the journal comes back with all ${held} clues`, `${second.ui.journal?.entries.length}`);
  check(same(second.ui.journal.entries.map((c) => c.id), first.engine.journal().map((c) => c.id)), 'in the same order they were found');
  check(second.npc('steward').dialogueState === 'admits', 'the Steward is still in `admits`');
  check(second.ui.toasts.length === 0, 'and nothing was toasted at the player on the way in', second.ui.toasts.join(' | '));
  check(!second.state.taken.includes('body') && second.state.taken.includes('pouch'), 'the pouch is still taken and the body is not takeable');
  // The one thing a reload must not do is let a press fire twice.
  second.present('steward', 'summons-is-stewards');
  check(second.engine.npcState('steward') === 'admits', 'and presenting the same clue again still moves nobody');
}

{
  // A quest.json the manager cannot run fails at construction, not on the walk.
  const bad = JSON.parse(JSON.stringify(quest));
  bad.stages.full.enter = ['openPortcullis'];
  let err = null;
  try { new QuestManager({ quest: bad, riddle, npcs: [], ui: {}, castle: {}, controlsRef: {} }); } catch (e) { err = e; }
  check(err && /openPortcullis/.test(err.message), 'the manager refuses a graph naming an action it lacks, and says which', err?.message.split('\n')[0]);
}

/* -------------------------------------------------------------- 5: the page --- */
console.log('the page');
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = /<div id="quest-objective">([^<]*)<\/div>/.exec(html);
  check(m && m[1].trim() === quest.stages[quest.start].objective, "index.html's initial objective is the start stage's, so the tracker never flashes stale text", m ? JSON.stringify(m[1]) : 'no #quest-objective in index.html');

  // EVERY ID ui.js READS HAS TO BE IN THE PAGE. src/ui.js caches them all in its
  // constructor, and a missing one is `null` there and a TypeError on the first
  // call that touches it — which for the journal and the accusation is halfway
  // through a play, long after the page looked fine. Phase 7 added eighteen.
  const uiSrc = fs.readFileSync(path.join(ROOT, 'src/ui.js'), 'utf8');
  const wanted = [...uiSrc.matchAll(/getElementById\('([^']+)'\)/g)].map((x) => x[1]);
  const missing = wanted.filter((id) => !new RegExp(`id="${id}"`).test(html));
  check(wanted.length >= 30 && missing.length === 0, `all ${wanted.length} element ids src/ui.js reads are in index.html`, missing.join(', '));

  // And the riddle quest's own screen is gone with its stages.
  check(!/id="victory-screen"/.test(html), 'the victory screen is gone: the epilogue is the accusation panel now');
  check(/id="accusation-overlay"/.test(html) && /id="journal-overlay"/.test(html), 'the journal and the accusation overlays are in the page');
  check(/J — journal/.test(html), 'and the start panel tells the player J opens the journal');
}

/* ------------------------------------ 6: every lock the quest names is real ---
 * `validateAgainstNpcs` will take `lock:<anything>`, because quest-graph.js knows
 * the graph and the cast and not the castle. This is the half that knows the
 * castle: a lock the quest listens for has to be a door that scene-config.json
 * really builds, that really starts shut, and that mystery.json really calls a
 * lock. Without this, renaming the muniment room's door to anything at all
 * leaves a quest whose ledger can never be read, and every file involved still
 * validates on its own.
 */
console.log('the locks the quest listens for');
{
  const listened = new Set(Object.values(quest.stages)
    .flatMap((s) => (s.transitions ?? []).map((t) => t.on))
    .filter((on) => on.startsWith('lock:'))
    .map((on) => on.slice(5)));
  check(listened.size > 0, 'the quest listens for at least one lock', [...listened].join(', '));
  const doors = new Map();
  for (const d of scene.drums) {
    for (const door of d.interior?.doors || []) {
      if (!door.leaf) continue;
      const level = Math.round((door.base || 0) / (scene.storey || 4));
      const room = scene.rooms.find((r) => r.drum === d.id && (r.level || 0) === level);
      if (room) doors.set(room.id, { leaf: door.leaf, drum: d.id });
    }
  }
  for (const id of listened) {
    const door = doors.get(id);
    if (!door) { fail(`the quest listens for lock:${id} and no room in scene-config.json has a door leaf`); continue; }
    if (!door.leaf.closed) { fail(`lock:${id} names a door that scene-config.json ships open — the riddle would unlock nothing`); continue; }
    if (!door.leaf.lock) { fail(`lock:${id} names a door with no \`lock\` prompt, so nothing in the game offers to open it`); continue; }
    const m = (mystery.locks ?? []).find((l) => l.id === id);
    if (!m) fail(`lock:${id} is not one of mystery.json's locks`);
    else if (!m.riddle) fail(`mystery.json's lock ${id} is not a riddle lock, and the quest opens it with the riddle`);
    else pass(`lock:${id}: ${door.drum}'s leaf, shut, prompted, and mystery.json's lock in room ${m.room}`);
  }
  // THE DOOR IS ALSO A THING TO READ, and one press of E has to do both. If the
  // leaf stops carrying an evidence id, `word-lock` becomes ungrantable in the
  // browser while every other file goes on validating.
  for (const id of listened) {
    const leaf = doors.get(id)?.leaf;
    const ev = (mystery.evidence ?? []).find((e) => e.id === leaf?.evidence);
    check(!!ev && ev.room === (mystery.locks ?? []).find((l) => l.id === id)?.room,
      `lock:${id}'s leaf carries the evidence the same door is (${leaf?.evidence}), in the same room`,
      JSON.stringify(leaf?.evidence));
  }
}

/* --- and every place that is a clue is a place the player can stand in ------ */
console.log('the places that are clues');
{
  const measured = new Map();
  const boundsOf = (rel) => { if (!measured.has(rel)) measured.set(rel, partsOf(path.join(ROOT, rel))); return measured.get(rel); };
  const nav = castleNav(makePlan(scene, boundsOf), mystery);
  const places = mystery.clues.filter((c) => c.kind === 'L');
  check(places.length > 0, `${places.length} clue is a place`, places.map((c) => c.id).join(', '));
  for (const c of places) {
    const room = c.source.room, level = c.source.level ?? 0;
    const r = nav.plan.rooms.find((x) => x.id === room && (x.level ?? 0) === level);
    if (!r) { fail(`${c.id}: names room ${room} on level ${level}, which the plan does not build`); continue; }
    // The centre of its bounds, on its own floor: somewhere the player both
    // stands and is recognised as being inside. main.js asks `inRoom` on every
    // frame the player is walking, and if the answer is never true the clue is
    // unreachable in the browser while `engine.enter` goes on working in Node.
    const cx = (r.bounds.min.x + r.bounds.max.x) / 2, cz = (r.bounds.min.z + r.bounds.max.z) / 2;
    const cell = nav.walk.cellAt(cx, cz, level);
    check(!!cell && nav.inRoom(room, level, cx, cz, cell.h), `${c.id}: ${room} on level ${level} is floor the player is recognised as standing on`, cell ? `h ${cell.h}` : 'no cell');
    check(!!cell && nav.walkable({ x: cx, z: cz, level }), `${c.id}: and the player can walk there from the spawn`);
  }
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
