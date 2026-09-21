// quest.mjs — the quest graph in data/quest.json and the manager that runs it,
// without a browser. Node only: src/quest-graph.js, src/quest-manager.js and
// src/mystery.js import nothing that needs a DOM or three, so the real manager
// runs here against stand-in UI, NPCs and castle, driving the real engine, and
// the whole day is played in a few milliseconds.
//
//   node test/quest.mjs        (from the repo root)
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
// through four stand-ins, and it is the intended path (PLAN.md) walked
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
//      ending, the prisoner accepted on nothing, three refusals to a fall, a
//      reload at Sext that comes back with the journal intact, the map, the
//      open-quests tab (#595), and the two set pieces (#592): who performs
//      where, and what stops them
//   5. the page: index.html's initial objective is the start stage's, and every
//      element id src/ui.js reads is in it
//   6. the locks and the places: every `lock:<id>` a stage listens for is a door
//      scene-config really builds and really ships shut, and every location clue
//      names a room the plan has and the player can stand in

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QuestGraph, validateQuest, validateAgainstNpcs, validateQuestSet, judgeAnswer, renderLines } from '../src/quest-graph.js';
import { QuestManager, MANAGER_PAIRS } from '../src/quest-manager.js';
import { createMystery, freshState } from '../src/mystery.js';
import { makePlan } from '../src/castle-plan.js';
import { castleNav } from '../src/stations.js';
import { partsOf } from './gltf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const quest = read('data/quest.json');
const { cast: npcDefs, performances, reputation } = read('data/npcs.json');
const riddle = read('data/riddle.json');
const scene = read('data/scene-config.json');
const mystery = read('data/mystery.json');
// The side quests (BACKLOG.md rank 9). `onDisk` is the directory itself, which
// part 2c holds the index to in both directions.
const questIndex = read('data/quests/index.json');
const questFiles = questIndex.quests ?? [];
const sideQuests = questFiles.map((f) => read(`data/quests/${f}`));
const sideSet = questFiles.map((file, i) => ({ file, def: sideQuests[i] }));
const questsOnDisk = fs.readdirSync(path.join(ROOT, 'data/quests')).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();

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
  /* THE WALKING DAY IS THE START, AND IT IS NOT A DEAD END (#751, #755).
   * `validateQuest` above walks both directions over every stage, so this names
   * the two the walking day adds rather than repeating the walk: `explore` is
   * where the page opens and `night` is where its last ring goes, and each of
   * them has to reach the terminal the mystery ends on. */
  check(quest.start === 'explore' && !!quest.stages.explore && !!quest.stages.night,
    'the graph starts on the walking day, with a night at the end of it', `${quest.start}: ${ids.join(', ')}`);
  const reaches = (from, to) => {
    const seen = new Set([from]);
    for (const q = [from]; q.length;) {
      for (const tr of quest.stages[q.shift()].transitions ?? []) {
        if (tr.to && !seen.has(tr.to)) { seen.add(tr.to); q.push(tr.to); }
      }
    }
    return seen.has(to);
  };
  check(reaches('explore', 'end') && reaches('night', 'end') && reaches('explore', 'arrive'),
    'and both of them reach `arrive` and, through it, the one terminal stage there is');

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
  expect('a terminal stage with a way out', (d) => { d.stages.end.transitions = [{ on: 'x', to: 'right' }]; }, /terminal stage has a transition that leaves it/);
}

/* ------------------------------------------- 2: the graph against the cast --- */
console.log('quest.json against npcs.json');
{
  const problems = validateAgainstNpcs(quest, npcDefs, { pairs: MANAGER_PAIRS });
  check(problems.length === 0, 'every stage has lines on every one of the thirteen, every token is known, and both pairs match', problems.join('; '));
  const states = new Set(Object.values(quest.stages).map((s) => s.dialogueState));
  // A press in mystery.json is the other thing that moves an NPC's state, and
  // the states it moves them to are that file's to check (src/mystery.js does).
  for (const p of mystery.presses) states.add(p.to);
  // And a side quest is the third (rank 9), for the one person it names. Kept
  // per-npc rather than poured into the set above, so a knife state on the cook
  // does not quietly excuse the same key appearing on the Steward.
  const sideStates = new Map();
  for (const q of sideQuests) {
    for (const st of Object.values(q.stages ?? {})) {
      if (!sideStates.has(q.npc)) sideStates.set(q.npc, new Set());
      sideStates.get(q.npc).add(st.dialogueState);
    }
  }
  for (const npc of npcDefs) {
    const extra = Object.keys(npc.dialogue).filter((k) => !states.has(k) && !sideStates.get(npc.id)?.has(k));
    check(extra.length === 0, `${npc.id} has no dialogue no stage, no press and no side quest can reach`, extra.join(', '));
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

/* ------------------------- 2b: the second day, across the two files (#533) ---
 * `validateAgainstNpcs` knows the graph and the cast; `validateMystery` knows
 * the mystery. Neither of them can see that the stage which ends the game
 * listens for a conversation with the person mystery.json says ends it. Get
 * those two out of step and the second day has no exit: the player walks a
 * castle at Lauds with nothing to do in it and no way back to a menu.
 */
console.log('the second day, against mystery.json');
{
  const ends = mystery.day2?.ends;
  check(!!ends, 'mystery.json names who ends the second day', JSON.stringify(ends));
  const morning = Object.entries(quest.stages).find(([, st]) => (st.enter ?? []).includes('applyDay') && !st.terminal);
  check(!!morning, 'a non-terminal stage runs applyDay: that is the morning', morning?.[0]);
  if (morning && ends) {
    const [id, st] = morning;
    const out = (st.transitions ?? []).filter((t) => t.to);
    check(out.length === 1 && out[0].on === `talked:${ends}`,
      `${id} has one way out and it is a conversation with ${ends}`, out.map((t) => t.on).join(', '));
    check(quest.stages[out[0].to]?.terminal, `and it leads to ${out[0].to}, which is terminal`);
    check((quest.stages[out[0].to].enter ?? []).includes('showEpilogue'), 'which shows the closing pane');
    check(npcDefs.some((n) => n.id === ends), `${ends} is in npcs.json's cast`);
    check((npcDefs.find((n) => n.id === ends)?.arrives ?? 1) === 2, `and arrives on day two`);
  }
  // Every stage that can be reached after a verdict has to be able to reach the
  // end of the second day, which validateQuest's reachability already says; what
  // it cannot say is that the button exists to get there.
  for (const cls of ['full', 'right', 'wrong', 'fall']) {
    const st = quest.stages[cls];
    check((st.transitions ?? []).some((t) => t.on === 'day:2'), `the ${cls} pane carries the button that opens the morning`);
  }
}

/* ------------------------------ 2c: the side quests, as a set (rank 9) -------
 * data/quests/ is a directory a browser cannot read, so index.json is the list
 * and this is the check that the list is the directory. Past that,
 * `validateQuestSet` is the rail: the per-file checks part 1 runs on the frame,
 * plus the three rules that make a file in here a side quest rather than a
 * second mystery. Every one of the three is broken on purpose below (#34).
 */
console.log('the side quests');
{
  check(same(questFiles.slice().sort(), questsOnDisk),
    `index.json names exactly the ${questsOnDisk.length} quest file(s) on disk`,
    `index: ${questFiles.join(', ') || '(none)'} / disk: ${questsOnDisk.join(', ') || '(none)'}`);
  check(sideQuests.length > 0, `${sideQuests.length} side quest(s) load`);

  const opts = { npcs: npcDefs, mystery, actions: QuestManager.sideActions };
  const problems = validateQuestSet(sideSet, opts);
  check(problems.length === 0, 'validateQuestSet finds nothing wrong with the set as it ships', problems.join('; '));

  // Every side quest also has to satisfy the frame's own validator, which
  // validateQuestSet folds in: reachable, terminal, one objective per stage.
  for (const { file, def } of sideSet) {
    check(validateQuest(def, QuestManager.sideActions).length === 0, `${file} is a valid graph on its own`);
    check(Object.values(def.stages).some((st) => st.terminal), `${file} has an end`);
  }

  // THE BREAKS. Each writes a second quest file into the set in memory and
  // asserts the rule names it. A rule that cannot be made to fire is not a rule
  // (#34), and rank 9's own acceptance names the first of these three.
  const withExtra = (extra) => validateQuestSet([...sideSet, { file: 'invented.json', def: extra }], opts);
  const expect = (label, extra, re) => {
    const p = withExtra(extra);
    check(p.some((x) => re.test(x)), `validateQuestSet rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
  };
  const skeleton = (over = {}) => ({
    id: 'invented', title: 'An invented quest', npc: 'clerk', start: 'a',
    stages: {
      a: { objective: 'One.', dialogueState: 'default', transitions: [{ on: 'talked:clerk', to: 'b' }] },
      b: { objective: 'Two.', dialogueState: 'default', terminal: true },
    },
    ...over,
  });

  // Rule 1: a quest whose effect is a key the clue graph owns. `cornered` is
  // where mystery.json's press on the lead puts the Clerk, and the clue
  // `clerk-cornered` is sourced from it: a side quest that set it would put his
  // confession on screen for a player who never pressed him.
  expect('a stage that puts its npc in a state mystery.json owns', (() => {
    const d = skeleton();
    d.stages.b.dialogueState = 'cornered';
    return d;
  })(), /invented\.json: a stage puts clerk in `cornered`, which is a state mystery\.json's clue graph owns \(clue clerk-cornered\)/);

  // Rule 2: two quests both changing what one person says.
  expect('a second quest changing what the cook says', (() => {
    const d = skeleton({ npc: 'cook' });
    d.stages.b.dialogueState = 'knife-settled';
    d.stages.a.transitions[0].on = 'talked:cook';
    return d;
  })(), /both change what cook says/);

  // Rule 3: an event nothing in the game emits. A quest that listens for it is
  // dead data and validates perfectly as a graph.
  expect('a transition on an event the game never emits', (() => {
    const d = skeleton();
    d.stages.a.transitions[0].on = 'clue:bananas';
    return d;
  })(), /`on` is "clue:bananas" and no clue bananas in mystery\.json/);

  // And the four housekeeping rails.
  expect('an id that is not the file name', skeleton({ id: 'something-else' }), /`id` is "something-else" but the file is "invented"/);
  expect('a quest on nobody in the cast', skeleton({ npc: 'gravedigger' }), /`npc` \("gravedigger"\) is not an id in npcs\.json's cast/);
  expect('a dialogueState the npc has no lines for', (() => {
    const d = skeleton();
    d.stages.b.dialogueState = 'whistling';
    return d;
  })(), /clerk has no `dialogue\.whistling` lines/);
  expect('an action no side quest may name', (() => {
    const d = skeleton();
    d.stages.a.transitions[0].do = ['openAccusation'];
    return d;
  })(), /unknown action "openAccusation"/);
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
  // `begin()` lands on the walking day now (#751), so the walk starts with the
  // door into the mystery: `day:1`, the event the night pane's button and
  // `QuestManager.enterMystery()` both dispatch (#755).
  g.begin();
  g.dispatch('day:1');
  check(g.stage === 'arrive', 'the walking day\'s door opens on `arrive`, the morning of the death', g.stage);
  g.dispatch('talked:constable');
  check(g.stage === 'investigate', 'one conversation with the Constable and the day begins');
  const endings = {};
  for (const cls of ['full', 'right', 'wrong', 'fall']) {
    g.stage = 'accusing';
    g.dispatch(`verdict:${cls}`);
    endings[cls] = g.stage;
    // NOT `done` SINCE #537. A verdict stage is the epilogue pane and a button,
    // and the button is `day:2`. What ends the game is the inspector.
    check(!g.done && g.stage === cls.replace('full', 'full'), `verdict:${cls} reaches the ${g.stage} pane, which is not the end any more`);
    g.dispatch('day:2');
    check(g.stage === 'morning', `and its button opens the morning after`, g.stage);
    g.dispatch('talked:inspector');
    check(g.stage === 'end' && g.done, `and the inspector is what ends it`, g.stage);
  }
  check(new Set(Object.values(endings)).size === 4, 'the four classes reach four different panes', JSON.stringify(endings));

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
    log: [], toasts: [], objective: null, watch: null, captions: [], captionName: null, captionLine: null,
    dialogue: null, journal: null, accusation: null, note: null, epilogue: null, riddleOpen: false, feedback: [],
    setObjective(t) { this.objective = t; this.log.push(`objective:${t}`); },
    setWatch(t) { this.watch = t; },
    toast(t) { this.toasts.push(t); this.log.push(`toast:${t}`); },
    // The caption band (#592). `captions` is every line the band has shown, in
    // order; `captionLine` is what is on it now, or null when it is dark.
    caption(name, line) { this.captionName = name; this.captionLine = line; this.captions.push(`${name}: ${line}`); this.log.push('caption'); },
    clearCaption() { this.captionName = null; this.captionLine = null; this.log.push('caption:clear'); },
    openDialogue(name, lines, onEnd, { onPresent = null } = {}) { this.dialogue = { name, lines, onEnd, onPresent }; this.log.push(`dialogue:${name}`); },
    openRiddle(text, onSubmit) { this.riddleOpen = true; this.riddleText = text; this._submit = onSubmit; this.log.push('riddle:open'); },
    setRiddleFeedback(t) { this.feedback.push(t); },
    closeRiddle() { this.riddleOpen = false; this.log.push('riddle:close'); },
    openJournal(entries, { empty = '', present = null, map = null, quests = null } = {}) { this.journal = { entries, empty, present, map, quests }; this.log.push(`journal:${present ? 'present' : 'read'}:${entries.length}`); },
    closeJournal() { this.journal = null; },
    openAccusation(o) { this.accusation = o; this.note = null; this.log.push('accusation:open'); },
    setAccusationNote(t) { this.note = t; },
    closeAccusation() { this.accusation = null; },
    showEpilogue(v, onButton, { label = 'Play Again' } = {}) { this.epilogue = v; this._restart = onButton; this.epilogueLabel = label; this.log.push(`epilogue:${v.class ?? 'day2'}`); },
    // --- the player's hand ---
    endDialogue() { const d = this.dialogue; this.dialogue = null; d?.onEnd?.(); },
    pressPresent() { this.dialogue?.onPresent?.(); },
    pickClue(id) { this.journal?.present?.(id); },
    answer(a) { this._submit(a); },
    say(who, clues) { this.accusation.onAccuse(who, clues); },
    restart() { this._restart(); },
  };
}

/**
 * @param day0 stop on the walking day instead of taking the mystery's door. The
 *   page opens on `explore` since #751, so every beat in this file that is about
 *   the day of the death has to go through it, and it goes through the same seam
 *   the start panel's second button and the two non-clicking browser suites use:
 *   `enterMystery()`, one dispatch of `day:1` (#755). A resumed save inside the
 *   mystery dispatches it too and nothing happens, because `day:1` is a
 *   transition on `explore` and on `night` and on no other stage.
 */
function rig({ saved = null, withSideQuests = true, quests = null, cast = npcDefs, rooms = [], perform = null, schedule = null, reputes = reputation, day0 = false } = {}) {
  const ui = stubUI();
  const npcs = cast.map((def) => ({
    id: def.id, name: def.name, def, talking: false, dialogueState: 'default',
    getDialogueLines() { return this.def.dialogue[this.dialogueState]; },
  }));
  // `shown` is the last visibility the manager asked for, per evidence id, so a
  // beat can ask what is on the ground at this bell rather than only what was
  // ever hidden.
  const castle = {
    opened: [], hidden: [], shown: {}, days: [],
    openLock(id) { this.opened.push(id); },
    setEvidenceVisible(id, v) { this.shown[id] = v; if (!v) this.hidden.push(id); },
    // The second day's half (#539). The manager hands over rows already
    // resolved for the ending the player reached; what the builder does with a
    // row is castle-builder.js's and is asserted in the browser.
    applyDay(changes) { this.days.push(changes); },
  };
  // The recorder standing in for src/audio.js. It has the one method the
  // manager calls; a suite that hears nothing is the whole point (#53), so what
  // is asserted is the call and never a sound.
  const audio = { bells: 0, rung: [], bell(n) { this.bells++; this.rung.push(n); } };
  const state = saved ?? freshState(quest);
  const engine = createMystery({ mystery, npcs: cast, state });
  const restarts = { n: 0 };
  const watches = [];
  // The sky each bell was applied with (open call 10): `applyWatch` resolves the
  // bell through `mystery.watchLike` and hands it over beside the `walk` flag, so
  // src/main.js calls `setWatch` with a watch data/scene-config.json has.
  const skies = [];
  const changes = { n: 0 }; // how often the manager asked main.js to mark the autosave
  const qm = new QuestManager({
    // `withSideQuests: false` is the control arm. The knife walk below runs the
    // same calls through both and compares the journal: a side quest that
    // granted, hid or gated one clue shows up as a difference of one id (#550,
    // question 6).
    quest, sideQuests: quests ?? (withSideQuests ? sideQuests : []),
    mystery, riddle, npcs, ui, castle, engine, audio,
    saved, restart: () => { restarts.n++; }, rooms,
    // The set pieces (#592), and the clock they step on. Both default to
    // nothing, so every beat above this line runs in a castle where nobody
    // performs and no line of the manager's new code is reachable.
    performances: perform, ...(schedule ? { schedule } : {}),
    /* THE REAL REPUTATION BLOCK, IN EVERY BEAT IN THIS FILE, ON PURPOSE. It is
     * the opposite of `performances` above, which defaults to nothing so that
     * no beat that does not care about it can reach its code: reputation adds
     * a line to the END of what somebody says, so every `same(lines, ...)`
     * assertion in this file is a guard that it does not say it early, and
     * they are only guards if it is switched on while they run. */
    reputation: reputes,
    onWatch: (w, opts = {}) => { watches.push(w); skies.push(opts.sky ?? null); },
    // What main.js does with onChange, because the stage and the wrong-answer
    // count are the only two things in the save the engine does not own. Leave
    // it out and the reload below comes back in `arrive` with a Sext watch,
    // which is exactly the bug it is here to catch.
    onChange: ({ stage, riddleWrong, quests, reputation: rep }) => { changes.n++; state.stage = stage; state.riddleWrong = riddleWrong; state.quests = quests; state.reputation = rep; },
  });
  if (!day0) qm.enterMystery();
  const npc = (id) => npcs.find((n) => n.id === id);
  return {
    qm, ui, npcs, castle, engine, state, restarts, watches, skies, changes, npc, audio,
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
  // THE INTENDED PATH (PLAN.md), through the manager, to the full ending.
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

  // THE PRESS RAIL. This is the assertion PLAN.md names for this phase's
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
  // WHO TAKES THE POINTER BACK IS NOT THIS FILE'S ANY MORE (#660). This used
  // to read a `controlsRef.lock()` counter too, and the riddle was the only
  // overlay of the four that ever called one. src/ui.js owns both halves now,
  // and test/overlays.mjs asserts them in a browser with a real pointer in it.
  check(!ui.riddleOpen, 'the right answer closes the overlay');
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
  check(ui.accusation.people.length === 12 && !ui.accusation.people.some((p) => p.id === 'inspector') && ui.accusation.fall.id === 'nobody',
    'twelve names and a fall, and the King\'s inspector is not one of them: he has not dismounted (#534)', `${ui.accusation.people.length} people`);
  check(ui.accusation.clues.length === 33 && ui.accusation.present === mystery.accusation.present, 'the journal is in it, and up to three may be shown');

  ui.say('clerk', ['sentry-sighting', 'wax-matches', 'lead-sold']);
  check(qm.stage === 'full' && qm.judged && !qm.victory, 'the Clerk on the sighting, the wax and the lead: the full ending', qm.stage);
  check(ui.epilogue && ui.epilogue.class === 'full' && /Ferrour hangs/.test(ui.epilogue.convicted) && /Wykes/.test(ui.epilogue.epilogue), 'the verdict and the epilogue are on the screen', ui.epilogue?.class);
  check(state.accusations.length === 1 && state.accusations[0].verdict === 'full' && state.accusations[0].watch === 'vespers', 'and the accusation is in the save');

  // After the verdict, nothing of the first day repeats.
  const bellsAtVerdict = r.audio.bells;
  const rings = r.ring().length;
  check(rings === 0 && qm.stage === 'full' && r.audio.bells === bellsAtVerdict,
    'after the verdict the bell does nothing, and it is not heard either (#520)', `${rings} effects, ${r.audio.bells - bellsAtVerdict} rings`);

  /* --- THE MORNING AFTER (#533 to #537). The pane's one button is the second
   * day now, and the difference between the two is one word on it. */
  check(ui.epilogueLabel === 'The next morning', 'the button offers the morning after rather than a fresh day', JSON.stringify(ui.epilogueLabel));
  ui.restart();
  check(r.restarts.n === 0, 'and pressing it does not erase the save');
  check(qm.stage === 'morning' && qm.day === 2 && state.day === 2, 'the frame is in `morning` and the save is on day two', `${qm.stage}, day ${state.day}`);
  check(ui.accusation === null && r.watches.at(-1) === mystery.day2.watches[0] && ui.watch === 'Lauds',
    'the panel is closed, the world is at Lauds and the HUD says so', `${r.watches.at(-1)} / ${ui.watch}`);
  check(Object.values(r.castle.shown).every((v) => v === false), 'nothing examinable is on the ground: no evidence is listed at Lauds');

  /* THE ROPE IN THE CHAPEL IS A BELL AGAIN ON THE MORNING AFTER (#700). Between
   * the verdict and the epilogue it does nothing and is not heard, which is the
   * assertion above; from the morning it rings. This is the whole observable
   * difference the row makes today, because `day2.watches` is one long: the
   * last bell of a day moves no watch, and on the morning there is no Constable
   * behind it either, so what is left is the ring itself. The sound is the
   * manager reading the engine's own `bell:<n>`, numbered within the morning's
   * list, so it is `bell:1` and it borrows the one-stroke character #682 wrote
   * for a morning. */
  const beforeMorningBell = r.audio.bells;
  const morningRing = r.ring();
  check(r.audio.bells === beforeMorningBell + 1 && r.audio.rung.at(-1) === 1,
    'the bell rings on the morning after, one stroke, where it used to return nothing at all',
    `${r.audio.bells - beforeMorningBell} rings, the last of them bell:${r.audio.rung.at(-1)}`);
  check(morningRing.length === 1 && !morningRing.some((e) => e.type === 'demand')
    && r.watches.at(-1) === mystery.day2.watches[0] && ui.watch === 'Lauds' && qm.stage === 'morning',
    'and it moves no watch, demands no name and leaves the frame in `morning`',
    `${morningRing.length} effects / ${ui.watch} / ${qm.stage}`);
  // And the stone moved too (#539). The full ending lets Madoc out and leaves
  // the inspector's own door standing open behind him.
  check(r.castle.days.length >= 1 && same(r.castle.days.at(-1), [{ piece: 'cell-bars', set: 'gone' }, { piece: 'muniment', set: 'open' }]),
    'the castle is handed the full ending\'s own changes: the cell opens and the muniment door stands open',
    JSON.stringify(r.castle.days.at(-1)));

  // The full ending takes three men out of the castle.
  check(r.engine.stationOf('clerk') === null && r.engine.stationOf('steward') === null && r.engine.stationOf('merchant') === null,
    'the Clerk hanged, the Steward is in irons and the merchant is taken in the town: none of the three is at a station');
  check(!!r.engine.stationOf('inspector') && !!r.engine.stationOf('apprentice'), 'the inspector is in the castle and the apprentice is still at the lodge');
  r.qm.handleInteract(r.npc('clerk'));
  check(same(ui.dialogue.lines, [mystery.ui.asleep]), 'and E where the Clerk stood says nothing rather than opening his lines', JSON.stringify(ui.dialogue?.lines));
  ui.dialogue = null;

  // Everybody else has something new to say, and it is about what happened.
  ui.toasts.length = 0;
  qm.handleInteract(r.npc('apprentice'));
  check(/hundred and twenty-eight/.test(ui.dialogue.lines.join(' ')), 'Ieuan has his master\'s count back, to the sheet', ui.dialogue.lines[0].slice(0, 48));
  check(!same(ui.dialogue.lines, r.npc('apprentice').def.dialogue.default), 'and it is not what he said yesterday');
  check(ui.dialogue.onPresent === null, 'there is no Present button on the morning after: the journal moves nobody now');
  ui.endDialogue();
  check(ui.toasts.length === 0, 'and no clue landed, because a day two has none', ui.toasts.join(' | '));
  // Two different endings are two different mornings for the same man.
  check(mystery.day2.lines.apprentice.full[0] !== mystery.day2.lines.apprentice.default[0], 'the apprentice does not say the same thing on every morning');

  // The inspector, and the end of the game.
  r.talk('inspector');
  check(qm.stage === 'end' && qm.victory, 'the King\'s inspector is the end of it', qm.stage);
  check(ui.epilogue && ui.epilogue.convicted === mystery.day2.endings.full.signed && ui.epilogue.epilogue === mystery.day2.endings.full.after,
    'and the pane comes back with the sheet signed', ui.epilogue?.convicted?.slice(0, 48));
  check(ui.epilogueLabel === 'Play Again', 'with the button that erases the save this time', JSON.stringify(ui.epilogueLabel));
  ui.restart();
  check(r.restarts.n === 1, 'and pressing it calls the injected restart');
}

{
  // THE BREAK #34 WANTS FOR `applyDay`. Unhooking the manager's action from the
  // graph is one line in quest.json, and everything else about the second day
  // goes on working: the stage moves, the pane closes, the objective changes.
  // What does not happen is the morning.
  const r = rig();
  r.talk('constable');
  r.ring();
  r.talk('constable');
  r.ui.say('nobody', []);
  check(r.qm.stage === 'fall', 'a fall, and the pane is up');
  r.ui.restart();
  check(r.qm.stage === 'morning' && r.qm.day === 2, 'the button opens the morning');
  check(r.engine.stationOf('inspector')?.room === 'kings-hall' && r.watches.at(-1) === mystery.day2.watches[0],
    'the morning opens with the cast moved: the inspector is in the King\'s Hall at Lauds',
    `${r.engine.stationOf('inspector')?.room} / ${r.watches.at(-1)}`);
  // A DIFFERENT ENDING IS A DIFFERENT CASTLE (#539). Madoc hangs in nobody's
  // fall — he is still in the cell for the knife — so the bars stay on, which
  // is the one row that does not fire here and does fire in the full ending
  // above. Two endings, two rosters of stone.
  check(same(r.castle.days.at(-1), [{ piece: 'muniment', set: 'shut' }]),
    'a fall shuts the muniment door and leaves the cell barred: Madoc is still in it',
    JSON.stringify(r.castle.days.at(-1)));
  r.talk('inspector');
  check(r.qm.stage === 'end' && /straight face/.test(r.ui.epilogue.epilogue + r.ui.epilogue.convicted) === false, 'and talking to him ends it', r.qm.stage);
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
  check(qm.judged && ui.epilogue && ui.epilogue.class === 'wrong', 'the prisoner is accepted on no clues at all, and it is a wrong hanging', ui.epilogue?.class);
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
  check(qm.judged && ui.epilogue && ui.epilogue.class === 'fall', 'and the third ends the day: he writes it down as a fall', ui.epilogue?.class);
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
  // AND ALL FOUR RANG (#519). The fourth moves no watch and reaches no
  // `ringBell` action on any stage, and it is still a man pulling a bell rope:
  // the sound is on the engine's own bell:<n>, which is the only thing all
  // four rings have in common.
  check(r.audio.bells === 4, 'four rings, four bells', `${r.audio.bells}`);
  // And each says which it is: the file gives the four a character apiece
  // (#682), and a `bell()` with no number is one stroke every time.
  check(r.audio.rung.join() === '1,2,3,4', 'and each ring carries its number, first to fourth', r.audio.rung.join());
  // A fall named here is the ending, and it is not the same one as three refusals.
  r.ui.say('nobody', []);
  check(r.qm.stage === 'fall' && r.ui.epilogue.class === 'fall' && r.qm.judged, 'calling it a fall ends the day');
  // The day is over and the rope is dead: `ring()` after the verdict emits no
  // event, so it makes no noise either.
  r.ring();
  check(r.audio.bells === 4, 'and a press at the rope after the verdict rings nothing', `${r.audio.bells}`);
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
  try { new QuestManager({ quest: bad, riddle, npcs: [], ui: {}, castle: {} }); } catch (e) { err = e; }
  check(err && /openPortcullis/.test(err.message), 'the manager refuses a graph naming an action it lacks, and says which', err?.message.split('\n')[0]);
}

/* ----------------------------- 4b: the cook's knife, end to end (rank 9) -----
 * The first side quest, through the real manager, driven by the same three
 * player actions a mystery clue is: E on Marged, E on the bakehouse barrel, E
 * on Marged again. Nothing here calls a side-quest API: every move is a
 * consequence of an event the mystery engine emitted about a clue the mystery
 * owns, which is what "independent of, connected to" has to mean to be worth
 * asserting (#550, question 6).
 */
console.log("the cook's knife");
{
  const knife = sideQuests.find((q) => q.id === 'cooks-knife');
  check(!!knife, 'cooks-knife.json is in the set');

  const r = rig();
  const { qm, ui, engine, state, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'cooks-knife');
  const linesNow = () => { qm.handleInteract(npc('cook')); const l = ui.dialogue.lines; ui.endDialogue(); return l; };

  check(at().id === 'cooks-knife' && qm._sideState('cook') === null, 'a fresh day has the quest at its start and Marged on the frame’s floor', npc('cook').dialogueState);
  check(npc('cook').dialogueState === 'default', 'which is `default`');
  check(ui.objective === quest.stages.arrive.objective, 'and the tracker is still the frame’s, not the quest’s', ui.objective);

  // One conversation with Marged at Prime. The engine grants both her
  // statements at once (talk() grants every statement of the state), and the
  // herring is what opens the thread.
  const before = ui.toasts.length;
  const tracker = ui.objective;
  r.talk('cook');
  check(engine.holds('cook-lantern') && engine.holds('knife-missing'), 'her first conversation lands both of her statements');
  check(qm.openQuests()[0].done === false && npc('cook').dialogueState === 'knife-hunting', 'and `clue:knife-missing` opens the knife thread', npc('cook').dialogueState);
  const opened = ui.toasts.slice(before);
  check(opened.some((t) => t.startsWith(`${knife.title}: `)), 'which toasts its own line under its own title', opened.join(' | '));
  check(ui.objective === tracker, 'and does not touch the frame’s tracker, which is still the mason at the foot of the stair', ui.objective);
  check(same(linesNow(), npcDefs.find((n) => n.id === 'cook').dialogue['knife-hunting']), 'she says where to look');

  // The state the engine thinks she is in is untouched by any of that: the
  // quest changed the line set on screen and nothing else (src/mystery.js:879).
  check(engine.npcState('cook') === 'default', 'the engine still has her in `default`, so her statements are still hers to grant');

  // The bakehouse barrel. A clue the mystery has owned since Phase 3, granted
  // the way it always was.
  r.examine('knife');
  check(engine.holds('knife-found'), 'the barrel in the bakehouse lands `knife-found`');
  check(npc('cook').dialogueState === 'knife-found', 'and the quest moves to the telling', npc('cook').dialogueState);
  const told = linesNow();
  check(same(told, npcDefs.find((n) => n.id === 'cook').dialogue['knife-found']), 'she says where it went');
  check(told.some((l) => /lantern/.test(l)), 'and her last word on it points back at the lantern, which is the mystery’s');
  check(at().done === true && npc('cook').dialogueState === 'knife-settled', 'that conversation ends the quest', `${at().objective} / ${npc('cook').dialogueState}`);

  // A terminal side quest is inert: nothing moves it again and it does not
  // start speaking over a press.
  const settled = npc('cook').dialogueState;
  r.talk('cook'); r.examine('knife');
  check(npc('cook').dialogueState === settled && at().done, 'and stays ended through another conversation and another press of E');

  // THE PROOF THAT IT TOUCHED NOTHING. The same four calls through a manager
  // with no side quests at all, and the two journals compared by id and order.
  const control = rig({ withSideQuests: false });
  control.talk('cook'); control.examine('knife'); control.talk('cook'); control.examine('knife');
  const ids = (x) => x.engine.journal().map((c) => c.id);
  check(same(ids(r), ids(control)), 'the same walk with and without the quest leaves the identical journal', `${ids(r).join(',')} vs ${ids(control).join(',')}`);
  check(control.npc('cook').dialogueState === 'default', 'and without it Marged never leaves `default`');

  // A wrong clue presented to her mid-thread gets the thread's lines back, not
  // `default`: a shrug is an answer, and the answer is whoever she is now.
  const r2 = rig();
  r2.talk('cook');
  r2.present('cook', 'cook-lantern');
  check(r2.ui.dialogue.lines[0] === npcDefs.find((n) => n.id === 'cook').dialogue['knife-hunting'][0],
    'a shrug mid-thread answers in the thread’s own lines', r2.ui.dialogue.lines[0]);

  // The save carries it. `_snapshot` writes one stage id per quest, `main.js`
  // copies it onto the state, and a manager built on that state resumes there.
  check(state.quests?.['cooks-knife'] === 'settled', 'the snapshot writes the quest’s stage into the save', JSON.stringify(state.quests));
  const resumed = rig({ saved: JSON.parse(JSON.stringify(state)) });
  check(resumed.qm.openQuests()[0].done === true, 'and a reload comes back with the quest ended');
  check(resumed.npc('cook').dialogueState === 'knife-settled', 'with Marged still saying so', resumed.npc('cook').dialogueState);
  const quiet = resumed.ui.toasts.length;
  check(quiet === 0 || !resumed.ui.toasts.some((t) => t.startsWith(`${knife.title}: `)), 'and without re-toasting a quest the player finished before the reload', resumed.ui.toasts.join(' | '));

  /* A PRESS BEATS A SIDE QUEST, AND THIS IS THE ONLY PLACE THAT SAYS SO.
   * `_syncStates` puts the engine first, a side quest second and the frame's
   * floor last, and reordering the first two left every assertion above this
   * one green: nobody presses the cook, so the quest that ships can never be
   * in the room when the rule matters (#147). What it takes is a side quest on
   * somebody a press does move, which is a quest on the Steward, and
   * `validateQuestSet` refuses `admits` outright — so the quest below holds a
   * state invented here, on a cast cloned here, and never reaches disk.
   *
   * Without the ordering, pressing the Steward on the summons hands the player
   * a clue whose text he then does not speak: `steward-admits` lands in the
   * journal and the man says he is taking stock. */
  {
    const cast = JSON.parse(JSON.stringify(npcDefs));
    cast.find((n) => n.id === 'steward').dialogue['stocktaking'] = ['Not now. I am counting candles.'];
    const stock = {
      id: 'stocktaking', title: 'The Steward’s count', npc: 'steward', ward: 'inner', start: 'counting',
      stages: {
        counting: { objective: 'The Steward is counting something.', dialogueState: 'stocktaking', transitions: [{ on: 'bell:3', to: 'done' }] },
        done: { objective: 'He has finished counting.', dialogueState: 'default', terminal: true },
      },
    };
    check(validateQuestSet([{ file: 'stocktaking.json', def: stock }], { npcs: cast, mystery, actions: QuestManager.sideActions }).length === 0,
      'a side quest on the Steward in a state the clue graph does not own is legal');

    const r4 = rig({ quests: [stock], cast });
    check(r4.npc('steward').dialogueState === 'stocktaking', 'and it holds his lines while nothing has moved him', r4.npc('steward').dialogueState);
    // Reach the press the short way. What this block is about is the order of
    // the three layers, not the walk to the Steward, which the intended path
    // above already drives at length.
    r4.engine.discover('summons-note');
    r4.engine.discover('lady-hand');
    while (r4.engine.watch !== 'sext') r4.ring();
    check(r4.engine.holds('summons-is-stewards'), 'the summons is deduced to be the Steward’s', r4.engine.journal().map((c) => c.id).join(','));
    r4.present('steward', 'summons-is-stewards');
    check(r4.engine.npcState('steward') === 'admits', 'the press moves him in the engine', r4.engine.npcState('steward'));
    check(r4.npc('steward').dialogueState === 'admits',
      'and the press is what comes out of his mouth, not the side quest that was holding him',
      r4.npc('steward').dialogueState);
    check(same(r4.ui.dialogue.lines, cast.find((n) => n.id === 'steward').dialogue['admits']),
      'which is the admission the player earned');
    // And the quest is not lost underneath: it is still where it was, and the
    // moment the press is no longer the answer it speaks again.
    check(r4.qm.openQuests()[0].objective === stock.stages.counting.objective, 'the side quest is still standing where it was');
  }

  // A save naming a stage the quest no longer has is repair's problem, not
  // this manager's, and the manager does not trust it either way. It starts
  // the quest over, and then (#597) walks it forward through the clues the
  // save already holds: this save has the knife missing and the knife found,
  // so the thread it comes back in is `found`, one conversation from its end,
  // and not `unheard` with an event it can never hear again.
  const bogus = JSON.parse(JSON.stringify(state));
  bogus.quests = { 'cooks-knife': 'gone-fishing', 'a-quest-that-was-deleted': 'x' };
  const r3 = rig({ saved: bogus });
  check(r3.qm.openQuests()[0].objective === knife.stages.found.objective, 'a saved stage the quest lacks starts the quest over rather than throwing, and the clues the save holds carry it forward', r3.qm.openQuests()[0].objective);
  check(r3.ui.toasts.some((t) => t === `${knife.title}: ${knife.stages.found.objective}`), 'with one toast, for the stage it arrives at', r3.ui.toasts.join(' | '));
}

/* ---------------------------------- 4b: the next four, and the catch-up (#597) ---
 * Four more files in data/quests/ (#598): a bird, a candle, four pence and a
 * chisel. Two in each ward, four people none of whom the cook's knife touched,
 * and every one of them turning on events the mystery already emits about
 * clues the mystery already owns. What this section holds them to is the same
 * thing the knife was held to: the walk with and without them leaves the
 * identical journal, and nobody says a pressed state's lines before the press.
 *
 * AND THE RULE THE HAWK FORCED. `clue:<id>` fires once. A quest reaching a
 * stage that waits on a clue the player already holds used to wait forever
 * (#576 shipped that hole in the knife: barrel first, then Marged, and the
 * thread never left `hunting`). `_catchUp` is the fix and the break below is
 * its proof: the hawk sends the player to the one place on the walk the
 * mystery already sends them, so "walked it first" is the common order and
 * not the odd one.
 */
console.log('\nthe next four, and the catch-up');
const byId = (id) => sideQuests.find((q) => q.id === id);
const linesOf = (id, state) => npcDefs.find((n) => n.id === id).dialogue[state];
{
  check(sideQuests.length === 12, `twelve side quests ship (${sideQuests.map((q) => q.id).join(', ')})`);
  const wards = Object.fromEntries(sideQuests.map((q) => [q.id, q.ward]));
  check(sideQuests.filter((q) => q.ward === 'outer').length === 7 && sideQuests.filter((q) => q.ward === 'inner').length === 5,
    'seven in the outer ward and five in the inner', JSON.stringify(wards));
  const people = sideQuests.map((q) => q.npc);
  check(new Set(people).size === people.length, 'and twelve different people, which is the one-voice rule with nothing to refuse', people.join(', '));
  // AND THAT IS EVERY SPEAKING PERSON IN THE CASTLE (#691 to #695). The dozen
  // closed by giving an errand to each of the seven who had none, so the set
  // is now the cast minus the one man who is not in it on day one: the King's
  // inspector, who has not dismounted. A thirteenth file has nobody left to be
  // about, which is the one-voice rule arriving at its own end rather than
  // being enforced.
  const speaking = npcDefs.filter((n) => n.id in mystery.schedule).map((n) => n.id);
  check(same([...people].sort(), [...speaking].sort()), 'one errand each on every person the day one schedule puts in the castle, and none on the inspector',
    `${speaking.filter((id) => !people.includes(id)).join(', ') || 'none'} left over`);

  // Rule 4: a file with no ward, or a ward the castle does not have.
  const opts = { npcs: npcDefs, mystery, actions: QuestManager.sideActions };
  const noWard = JSON.parse(JSON.stringify(byId('ladys-hawk'))); delete noWard.ward;
  let p = validateQuestSet([...sideSet.filter((q) => q.def.id !== 'ladys-hawk'), { file: 'ladys-hawk.json', def: noWard }], opts);
  check(p.some((x) => /ladys-hawk\.json: `ward` is undefined and has to be one of outer, inner/.test(x)), 'validateQuestSet rejects a quest with no ward', p.join('; ') || 'said nothing');
  const townWard = { ...JSON.parse(JSON.stringify(byId('sentrys-dice'))), ward: 'town' };
  p = validateQuestSet([...sideSet.filter((q) => q.def.id !== 'sentrys-dice'), { file: 'sentrys-dice.json', def: townWard }], opts);
  check(p.some((x) => /`ward` is "town"/.test(x)), 'and one in a ward the castle does not have', p.join('; ') || 'said nothing');
}
{
  // THE HAWK, IN THE ORDER THE LADY MEANS: her first, then the walk, then her.
  const hawk = byId('ladys-hawk');
  const r = rig();
  const { qm, ui, engine, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'ladys-hawk');
  const said = (id) => { qm.handleInteract(npc(id)); const l = ui.dialogue.lines; ui.endDialogue(); return l; };
  check(npc('lady').dialogueState === 'default' && at().started === false, 'a fresh day has Lady Alys on the floor and no bird mentioned');
  r.talk('lady');
  check(engine.holds('lady-hand'), 'her first conversation lands the gallows sevens, which are the mystery’s');
  check(npc('lady').dialogueState === 'hawk-loose' && at().objective === hawk.stages.loose.objective, 'and ends with the merlin loose on the south walk', npc('lady').dialogueState);
  check(ui.toasts.some((t) => t === `${hawk.title}: ${hawk.stages.loose.objective}`), 'toasted under its own title');
  check(engine.npcState('lady') === 'default', 'the engine still has her in `default`');
  r.examine('tally');
  check(engine.holds('tally-on-walk'), 'the tally stick in the south walk gutter lands, the way it always did');
  check(npc('lady').dialogueState === 'hawk-seen', 'and that is the bird seen: the quest turned on the mystery’s own clue', npc('lady').dialogueState);
  const seen = said('lady');
  check(same(seen, linesOf('lady', 'hawk-seen')), 'she says the bird came back on her own');
  check(seen.some((l) => /south walk/.test(l)), 'and what the south walk is, which is walk-crosses said sooner by somebody else');
  check(at().done === true && npc('lady').dialogueState === 'hawk-home', 'and that conversation ends the errand', npc('lady').dialogueState);

  // The press still wins. Stand on the cross-walk, present it, and the
  // window is what she says, not the hawk.
  engine.discover('walk-crosses');
  r.present('lady', 'walk-crosses');
  check(engine.npcState('lady') === 'window' && npc('lady').dialogueState === 'window', 'presenting walk-crosses puts her in `window` over the finished errand', npc('lady').dialogueState);
  check(same(ui.dialogue.lines, linesOf('lady', 'window')), 'and the lantern and the shadow are what she says');
}
{
  // THE HAWK IN THE OTHER ORDER, which is the order a player following the
  // mystery takes: the walk at Terce for the tally, the lady whenever. The
  // stage that waits on the tally is walked through on the spot.
  const hawk = byId('ladys-hawk');
  const r = rig();
  const { qm, ui, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'ladys-hawk');
  r.examine('tally');
  check(at().started === false && npc('lady').dialogueState === 'default', 'the tally stick first: nothing has been asked of the player yet');
  const before = ui.toasts.length;
  r.talk('lady');
  check(at().objective === hawk.stages.seen.objective && npc('lady').dialogueState === 'hawk-seen',
    'then the lady: the errand opens already past the walk, because the walk already happened', `${at().objective} / ${npc('lady').dialogueState}`);
  const toasts = ui.toasts.slice(before).filter((t) => t.startsWith(`${hawk.title}: `));
  check(toasts.length === 1 && toasts[0] === `${hawk.title}: ${hawk.stages.seen.objective}`, 'with one toast, for the stage the player is actually in', toasts.join(' | '));
  r.talk('lady');
  check(at().done === true, 'and one more conversation ends it');

  // The same order through the knife, which is the hole #576 shipped.
  const knife = byId('cooks-knife');
  const r2 = rig();
  r2.examine('knife');
  r2.talk('cook');
  check(r2.npc('cook').dialogueState === 'knife-found' && r2.qm.openQuests().find((q) => q.id === 'cooks-knife').objective === knife.stages.found.objective,
    'the barrel before Marged: the knife thread opens at `found`, not stuck in `hunting` waiting for a barrel that says gone', r2.npc('cook').dialogueState);
  r2.talk('cook');
  check(r2.qm.openQuests().find((q) => q.id === 'cooks-knife').done === true, 'and ends on the next word with her');

  // A CONVERSATION IS NOT CAUGHT UP. Talking to the porter before the sentry
  // ever mentions dice is not the message delivered.
  const dice = byId('sentrys-dice');
  const r3 = rig();
  while (r3.engine.watch !== 'terce') r3.ring();
  r3.talk('porter');
  r3.talk('sentry');
  check(r3.qm.openQuests().find((q) => q.id === 'sentrys-dice').objective === dice.stages.owed.objective,
    'the porter spoken to before the sentry asked: the errand still opens at `owed`, because a conversation is a thing that happens and not a thing the player holds',
    r3.qm.openQuests().find((q) => q.id === 'sentrys-dice').objective);
}
{
  // THE CANDLE. Father Anselm's column, and the mystery's candle on his stair.
  const candle = byId('candle-count');
  const r = rig();
  const { qm, ui, engine, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'candle-count');
  r.talk('chaplain');
  check(npc('chaplain').dialogueState === 'candle-short' && at().objective === candle.stages.short.objective, 'the chaplain mentions his count and the errand opens', npc('chaplain').dialogueState);
  check(engine.npcState('chaplain') === 'default', 'the engine still has him in `default`');
  r.examine('candle');
  check(engine.holds('chapel-candle') && npc('chaplain').dialogueState === 'candle-found', 'the candle in the pricket lands as the mystery’s clue and moves the errand', npc('chaplain').dialogueState);
  qm.handleInteract(npc('chaplain'));
  const found = ui.dialogue.lines; ui.endDialogue();
  check(same(found, linesOf('chaplain', 'candle-found')), 'he says what a pooled candle means');
  check(!found.some((l) => /two men|going up/i.test(l)), 'and not what he heard, which is the press’s to give', found.join(' | '));
  check(at().done === true && npc('chaplain').dialogueState === 'candle-entered', 'and the column adds');
  // The press over the finished errand.
  engine.discover('steward-admits');
  r.present('chaplain', 'steward-admits');
  check(npc('chaplain').dialogueState === 'heard' && same(ui.dialogue.lines, linesOf('chaplain', 'heard')), 'presenting the Steward’s admission is still what makes him say what he heard', npc('chaplain').dialogueState);
}
{
  // THE DICE. Asleep at Prime; the errand through the gate; and the bar only
  // after the porter has said it himself.
  const dice = byId('sentrys-dice');
  const r = rig();
  const { qm, ui, engine, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'sentrys-dice');
  qm.handleInteract(npc('sentry'));
  check(ui.dialogue.lines[0] === mystery.ui.asleep, 'at Prime the sentry is asleep in the guardroom');
  ui.endDialogue();
  check(at().started === false, 'and asleep is not a conversation: nothing opens');
  while (engine.watch !== 'terce') r.ring();
  r.talk('sentry');
  check(engine.holds('sentry-sighting') && npc('sentry').dialogueState === 'dice-owed', 'at Terce he gives the sighting, which is the mystery’s, and asks for four pence carried', npc('sentry').dialogueState);
  const porterBefore = engine.npcState('porter');
  r.talk('porter');
  check(npc('sentry').dialogueState === 'dice-told' && at().objective === dice.stages.told.objective, 'the porter spoken to is the message delivered', npc('sentry').dialogueState);
  // The dice quest names the sentry and nothing else. Since the dozen closed
  // the porter has an errand of his own (`gwilyms-pass`), so what this asserts
  // is the two halves that matter: the engine's idea of him has not moved, and
  // the state he IS in belongs to his own file and not to this one.
  check(engine.npcState('porter') === porterBefore, 'and the engine has not moved the porter: nothing here touches his lines');
  check(!Object.keys(byId('sentrys-dice').stages).some((s) => byId('sentrys-dice').stages[s].dialogueState === npc('porter').dialogueState),
    'the state he is standing in is his own errand’s and is in no stage of this one', npc('porter').dialogueState);
  qm.handleInteract(npc('sentry'));
  const told = ui.dialogue.lines; ui.endDialogue();
  check(same(told, linesOf('sentry', 'dice-told')), 'he knows Gwilym said nothing');
  check(!told.some((l) => /Lammas|leaned|not been barred/i.test(l)), 'and does not say the door was open, which is the porter’s to admit', told.join(' | '));
  check(at().done === true && npc('sentry').dialogueState === 'dice-paid', 'that conversation ends the errand');

  // The other road: the porter admits it first. The sentry has something to
  // say about that, and only then.
  const r2 = rig();
  while (r2.engine.watch !== 'terce') r2.ring();
  r2.talk('sentry');
  r2.examine('walk-door');
  check(r2.engine.holds('door-unbarred') && r2.npc('sentry').dialogueState === 'dice-owed', 'the bar on the wall is a clue and not yet an admission: the sentry says nothing about it');
  r2.present('porter', 'door-unbarred');
  check(r2.engine.npcState('porter') === 'admits', 'the porter pressed on it admits it');
  check(r2.npc('sentry').dialogueState === 'dice-bar' && r2.qm.openQuests().find((q) => q.id === 'sentrys-dice').objective === dice.stages.bar.objective,
    'and the press is what moves the sentry to say he knew', r2.npc('sentry').dialogueState);
  r2.qm.handleInteract(r2.npc('sentry'));
  const bar = r2.ui.dialogue.lines; r2.ui.endDialogue();
  check(same(bar, linesOf('sentry', 'dice-bar')) && bar.some((l) => /Lammas/.test(l)), 'since Lammas, and every man on the walk');
  check(r2.qm.openQuests().find((q) => q.id === 'sentrys-dice').done === true, 'and that ends it from this road too');
  // And from the start stage: a player who never spoke to him before the press.
  const r3 = rig();
  while (r3.engine.watch !== 'terce') r3.ring();
  r3.examine('walk-door');
  r3.present('porter', 'door-unbarred');
  check(r3.npc('sentry').dialogueState === 'dice-bar', 'a player who has the admission before ever speaking to the sentry finds him already at the bar', r3.npc('sentry').dialogueState);
}
{
  // THE CHISEL. Two endings: the bars say nothing, or the roll says the forge.
  const chisel = byId('hywels-chisel');
  const r = rig();
  const { qm, ui, engine, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'hywels-chisel');
  r.talk('apprentice');
  check(engine.holds('hywel-sober') && engine.holds('apprentice-tallies'), 'Ieuan’s first conversation lands both of his statements');
  check(npc('apprentice').dialogueState === 'chisel-asking' && at().objective === chisel.stages.asking.objective, 'and asks for a question carried to the bars', npc('apprentice').dialogueState);
  r.talk('prisoner');
  // The same split as the porter above: the chisel names Ieuan and nobody
  // else, and the state Madoc is standing in after that conversation is his
  // own errand's (`madocs-fire`, #691 to #695) and not this file's.
  check(engine.holds('prisoner-story') && engine.npcState('prisoner') === 'default', 'Madoc says the lead, the cart and the seal, and the engine has not moved him');
  check(!Object.values(chisel.stages).some((s) => s.dialogueState === npc('prisoner').dialogueState), 'and no stage of the chisel names the state he is in', npc('prisoner').dialogueState);
  check(npc('apprentice').dialogueState === 'chisel-heard', 'which Ieuan already knows he said', npc('apprentice').dialogueState);
  r.talk('apprentice');
  check(at().done === true && npc('apprentice').dialogueState === 'chisel-own-edge' && at().objective === chisel.stages['own-edge'].objective, 'so he puts his own edge on the second chisel', at().objective);

  const r2 = rig();
  r2.talk('apprentice');
  r2.talk('prisoner');
  r2.examine('gaol-roll');
  check(r2.engine.holds('prisoner-inside'), 'the roll and the story together are the deduction that Madoc was inside');
  r2.present('prisoner', 'prisoner-inside');
  check(r2.engine.npcState('prisoner') === 'forge' && same(r2.ui.dialogue.lines, linesOf('prisoner', 'forge')), 'presented to him, he says eight days at the forge: the mystery’s press, untouched');
  check(r2.npc('apprentice').dialogueState === 'chisel-forge', 'and the same press turns the errand: the chisel is where he works', r2.npc('apprentice').dialogueState);
  r2.talk('apprentice');
  check(r2.qm.openQuests().find((q) => q.id === 'hywels-chisel').objective === chisel.stages.fetched.objective, 'so Ieuan will fetch it at the forge at Prime tomorrow');
}
{
  // THE PROOF THAT NONE OF THEM TOUCHED ANYTHING. One walk through every
  // errand, the same walk through a manager with no side quests, and the
  // journals compared by id and order. Then the tab, with the dozen on it.
  //
  // THE WALK IS THE ACCEPTANCE CRITERION FOR THE WHOLE ROW AND IT GREW WITH
  // IT (#691 to #695). The five it was written for are the first five lines;
  // the seven that closed the dozen are under them, and the order is not free:
  // Thomas Wykes is at the cart at Terce and nowhere at any other bell, so his
  // errand is the last two calls, and the sentry is asleep at Prime, so the
  // dice are still after the ring. Everything else is one watch's worth of
  // walking in whatever order a player finds people in.
  const walk = (x) => {
    x.talk('constable');
    x.talk('lady'); x.examine('tally'); x.talk('lady');
    x.talk('chaplain'); x.examine('candle'); x.talk('chaplain');
    x.talk('apprentice'); x.talk('prisoner'); x.examine('gaol-roll'); x.present('prisoner', 'prisoner-inside'); x.talk('apprentice');
    x.talk('prisoner');
    x.talk('cook'); x.examine('knife'); x.talk('cook');
    x.talk('steward'); x.talk('cook'); x.talk('steward');
    x.talk('porter'); x.talk('steward'); x.talk('porter');
    x.talk('clerk'); x.talk('lady'); x.talk('clerk');
    x.talk('laundress'); x.talk('chaplain'); x.talk('laundress');
    x.talk('constable');
    while (x.engine.watch !== 'terce') x.ring();
    x.talk('sentry'); x.talk('porter'); x.examine('walk-door'); x.present('porter', 'door-unbarred'); x.talk('sentry');
    x.talk('merchant'); x.talk('apprentice');
  };
  const r = rig(); walk(r);
  const control = rig({ withSideQuests: false }); walk(control);
  const ids = (x) => x.engine.journal().map((c) => c.id);
  check(same(ids(r), ids(control)), 'the same walk through all twelve errands with and without them leaves the identical journal', `${ids(r).join(',')} vs ${ids(control).join(',')}`);
  check(r.qm.openQuests().every((q) => q.done), 'and every errand is done at the end of it', r.qm.openQuests().filter((q) => !q.done).map((q) => q.id).join(', '));
  for (const id of sideQuests.map((q) => q.npc)) {
    check(control.npc(id).dialogueState === (control.engine.npcState(id) === 'default' ? 'default' : control.engine.npcState(id)), `and without them ${id} is only ever where the engine puts them`, control.npc(id).dialogueState);
  }
  r.qm.handleJournal();
  const tab = r.ui.journal?.quests;
  r.ui.closeJournal();
  check(Array.isArray(tab) && tab.length === 12 && tab.every((q) => q.done), 'the journal’s tab carries all twelve, done', JSON.stringify(tab?.map((q) => [q.id, q.done])));
  check(r.state.quests && Object.keys(r.state.quests).length === 12 && r.state.quests['sentrys-dice'] === 'paid' && r.state.quests['hywels-chisel'] === 'fetched' && r.state.quests['wykes-mark'] === 'read',
    'and the save carries a stage for each of the twelve', JSON.stringify(r.state.quests));
  check(same(r.qm.reputation(), { outer: 7, inner: 5 }), 'and both ward counters are at their ceilings, which is what a dozen errands run is worth', JSON.stringify(r.qm.reputation()));
}

/* ------------------------ 4d: the seven that closed the dozen (rank 8) -------
 * One voice each on the seven people who had none: the Steward's slate, the
 * Constable's song, the Clerk's inherited six years, the porter's pass, Nest's
 * windlass, Madoc's forge and the mark on a stone in a town yard. The walk
 * above already holds all twelve to the one thing the row is for, which is that
 * the journal is identical with and without them; what is here is the beats
 * each of the seven has that the other eleven do not.
 *
 * AND ONE NEW RULE, WHICH THE CONSTABLE FORCED (#693). `{ACCUSE}` is a line in
 * Sir Roger's `default` set and it is how the player is asked for a name. An
 * errand that ended on a state of its own would take that line off the screen
 * from the moment it finished until Vespers and every suite in this repo would
 * have stayed green, because the accusation overlay opens on `talked:constable`
 * and not on the line. `validateQuestSet`'s rule 6 is the answer and the break
 * below is its proof.
 */
console.log('\nthe seven that closed the dozen');
{
  const opts = { npcs: npcDefs, mystery, actions: QuestManager.sideActions, tokens: Object.keys(quest.tokens ?? {}) };
  check(validateQuestSet(sideSet, opts).length === 0, 'validateQuestSet finds nothing wrong with the twelve as they ship', validateQuestSet(sideSet, opts).join('; '));
  // Rule 6, broken on purpose. `written` is one of the two endings of the
  // Constable's errand and both of them are `default`; give one of them a state
  // of its own and the day's own question goes quiet.
  const parked = JSON.parse(JSON.stringify(byId('rogers-verse')));
  parked.stages.written.dialogueState = 'verse-englished';
  let p = validateQuestSet([...sideSet.filter((q) => q.def.id !== 'rogers-verse'), { file: 'rogers-verse.json', def: parked }], opts);
  check(p.some((x) => /rogers-verse\.json: written is terminal and leaves constable in `verse-englished` for the rest of the day, but \{ACCUSE\} is a line in their `default` set/.test(x)),
    'validateQuestSet rejects an ending that parks the Constable out of the lines that pose {ACCUSE}', p.join('; ') || 'said nothing');
  // And it is about the token and not about the Constable: the same shape on
  // somebody whose `default` poses nothing is what the other eleven already
  // are, and passing no tokens at all switches the rule off entirely.
  p = validateQuestSet([...sideSet.filter((q) => q.def.id !== 'rogers-verse'), { file: 'rogers-verse.json', def: parked }], { ...opts, tokens: [] });
  check(p.length === 0, 'and with no tokens passed it says nothing: the rule is the token, not the man', p.join('; '));
  check(sideQuests.filter((q) => Object.values(q.stages).some((s) => s.terminal && s.dialogueState !== 'default')).length === 11,
    'eleven of the twelve end in a state of their own, which is what makes the Constable’s the exception the rule is for');
}
{
  // THE SLATE, THE SONG AND THE SIX YEARS, in one walk. Each of the three opens
  // on its person's first conversation and lands the mystery's own statements
  // in the same breath, which is the shape every errand in this directory has.
  const r = rig();
  const { qm, engine, npc } = r;
  const at = (id) => qm.openQuests().find((q) => q.id === id);
  r.talk('steward');
  check(engine.holds('steward-denies') && npc('steward').dialogueState === 'slate-asking',
    'Piers Marrable denies the summons, which is the mystery’s, and asks for the kitchen’s slate, which is not', npc('steward').dialogueState);
  check(engine.npcState('steward') === 'default', 'and the engine still has him in `default`');
  r.talk('cook');
  check(at('stewards-slate').objective === byId('stewards-slate').stages.copied.objective, 'Marged read her own chalk to you', at('stewards-slate').objective);
  r.talk('steward');
  check(at('stewards-slate').done === true && npc('steward').dialogueState === 'slate-ruled', 'and the kitchen’s year goes in the roll under her name', npc('steward').dialogueState);

  // The press over the finished errand, the same way the hawk and the candle
  // are covered: a side quest never keeps a pressed man's admission off screen.
  engine.discover('summons-is-stewards');
  r.present('steward', 'summons-is-stewards');
  check(engine.npcState('steward') === 'admits' && same(r.ui.dialogue.lines, linesOf('steward', 'admits')),
    'and the gallows sevens presented to him are still what makes him admit the summons', npc('steward').dialogueState);

  r.talk('clerk');
  check(engine.holds('clerk-abed') && npc('clerk').dialogueState === 'bassett-asking', 'Master Robert is abed from Compline and wants six years of a dead drunk’s ledger checked', npc('clerk').dialogueState);
  r.talk('lady');
  r.talk('clerk');
  check(at('bassetts-years').done === true, 'Lady Alys knows what Caernarfon keeps, which closes it');
}
{
  // THE SONG. Two roads, and both endings hand Sir Roger back to `default`,
  // which is rule 6 in the game rather than in the validator. And the
  // accusation opens in every stage of the errand, which is the thing the rule
  // exists to keep true-looking from being true by accident.
  const verse = byId('rogers-verse');
  const r = rig();
  const { qm, ui, npc } = r;
  const at = () => qm.openQuests().find((q) => q.id === 'rogers-verse');
  r.talk('constable');
  check(npc('constable').dialogueState === 'verse-asking' && at().objective === verse.stages.asking.objective, 'the song opens on the conversation the day itself opens on', npc('constable').dialogueState);
  check(linesOf('constable', 'verse-asking').at(-1).includes('mason'), 'and his errand lines still end by asking for a name, because {ACCUSE} is `default`’s', linesOf('constable', 'verse-asking').at(-1));
  r.talk('porter');
  check(npc('constable').dialogueState === 'verse-englished', 'Gwilym has both tongues, so the verses come back in the King’s', npc('constable').dialogueState);
  ui.closeAccusation();
  r.talk('constable');
  check(at().done === true && npc('constable').dialogueState === 'default', 'and telling Sir Roger ends it and gives him back', npc('constable').dialogueState);
  check(ui.accusation !== null, 'with the accusation still opening on that same conversation, the way it does on every one of them');
  ui.closeAccusation();
  const back = (() => { qm.handleInteract(npc('constable')); const l = ui.dialogue.lines; ui.endDialogue(); return l; })();
  check(back.includes(quest.tokens['{ACCUSE}']), 'and {ACCUSE} is on the screen again, which is the whole of what rule 6 is for', back.at(-1)?.slice(0, 40));

  // The other road: Dafydd will not give a Constable the words.
  const r2 = rig();
  r2.talk('constable');
  while (r2.engine.watch !== 'terce') r2.ring();
  r2.talk('sentry');
  check(r2.npc('constable').dialogueState === 'verse-refused', 'the sentry gives the tune and not the words', r2.npc('constable').dialogueState);
  r2.talk('porter');
  check(r2.npc('constable').dialogueState === 'verse-englished', 'and a refusal is not an ending: the porter is still a road out of it', r2.npc('constable').dialogueState);
  const r3 = rig();
  r3.talk('constable');
  while (r3.engine.watch !== 'terce') r3.ring();
  r3.talk('sentry'); r3.talk('constable');
  check(r3.qm.openQuests().find((q) => q.id === 'rogers-verse').done === true && r3.npc('constable').dialogueState === 'default',
    'or the refusal is carried back, which ends it the other way and gives him back just the same', r3.npc('constable').dialogueState);
}
{
  // THE WINDLASS AND THE FORGE. Two files with two roads each and one ending
  // apiece, and the ending is the same stage whichever road reached it.
  const r = rig();
  const at = (id) => r.qm.openQuests().find((q) => q.id === id);
  r.talk('laundress');
  check(r.engine.holds('laundress-cloak') && r.npc('laundress').dialogueState === 'well-asking', 'Nest says whose cloak it is and asks for the windlass turned', r.npc('laundress').dialogueState);
  r.talk('chaplain');
  check(r.npc('laundress').dialogueState === 'well-blessed', 'the chaplain will say in the hall that a well is a well', r.npc('laundress').dialogueState);
  r.talk('laundress');
  check(at('nests-windlass').done === true, 'and the copper stands full against the morning');

  const r2 = rig();
  while (r2.engine.watch !== 'terce') r2.ring();
  r2.talk('laundress'); r2.talk('sentry'); r2.talk('laundress');
  check(r2.qm.openQuests().find((q) => q.id === 'nests-windlass').done === true && r2.npc('laundress').dialogueState === 'well-drawn',
    'and Dafydd at the windlass is the other road to the same copper', r2.npc('laundress').dialogueState);

  // Madoc's forge, and the press that beats it.
  const r3 = rig();
  r3.talk('prisoner');
  check(r3.engine.holds('prisoner-story') && r3.npc('prisoner').dialogueState === 'fire-asking', 'Madoc says the lead, the cart and the seal, and then asks about his fire', r3.npc('prisoner').dialogueState);
  r3.examine('gaol-roll');
  r3.present('prisoner', 'prisoner-inside');
  check(r3.engine.npcState('prisoner') === 'forge' && same(r3.ui.dialogue.lines, linesOf('prisoner', 'forge')),
    'the roll presented to him is still eight days at the forge and not one word about a hearth', r3.ui.dialogue.lines.at(-1)?.slice(0, 40));
  r3.talk('cook'); r3.talk('prisoner');
  check(r3.qm.openQuests().find((q) => q.id === 'madocs-fire').done === true, 'and the kitchen’s boy banks it, under a press that never stopped being what he says');
}
{
  // THE PASS, AND ITS SECOND ROAD, WHICH IS A PRESS. `press:steward:
  // summons-is-stewards` is the only press any file in this directory listens
  // for that is not on the person the file is about: a man who has just been
  // shown his own hand on a dead mason's summons signs the next thing put in
  // front of him without reading it.
  const r = rig();
  r.talk('porter');
  check(r.engine.holds('porter-log') && r.npc('porter').dialogueState === 'pass-asking', 'Gwilym gives the gate book and asks for a pass for his boy', r.npc('porter').dialogueState);
  r.talk('steward'); r.talk('porter');
  check(r.qm.openQuests().find((q) => q.id === 'gwilyms-pass').done === true, 'asked for in a corridor, it is signed, and it goes in the book');

  const r2 = rig();
  r2.talk('porter');
  r2.engine.discover('summons-is-stewards');
  r2.present('steward', 'summons-is-stewards');
  check(r2.qm.openQuests().find((q) => q.id === 'gwilyms-pass').objective === byId('gwilyms-pass').stages.signed.objective,
    'and a Steward who has just admitted the summons signs it without looking up', r2.qm.openQuests().find((q) => q.id === 'gwilyms-pass').objective);
  check(r2.engine.npcState('steward') === 'admits' && r2.npc('porter').dialogueState === 'pass-signed', 'with the press itself untouched: it is still the mystery’s beat', r2.npc('porter').dialogueState);
}
{
  // THE MARK, AND THE ONE PERSON WHO IS NOT HERE ALL DAY. Thomas Wykes is at
  // the cart at Terce and nowhere at Prime, Sext or Vespers, so his errand
  // cannot open before the first bell and it does not.
  const r = rig();
  r.qm.handleInteract(r.npc('merchant'));
  check(r.ui.dialogue.lines[0] === mystery.ui.absent || r.ui.dialogue.lines[0] === mystery.ui.asleep, 'at Prime the merchant is not in the castle', r.ui.dialogue.lines[0]?.slice(0, 40));
  r.ui.endDialogue();
  check(r.qm.openQuests().find((q) => q.id === 'wykes-mark').started === false, 'so nothing has been asked of you at the cart');
  while (r.engine.watch !== 'terce') r.ring();
  r.talk('merchant');
  check(r.engine.holds('merchant-stone') && r.npc('merchant').dialogueState === 'mark-asking', 'at Terce he buys stone, and wants the mark on one block read', r.npc('merchant').dialogueState);
  r.talk('apprentice');
  check(r.qm.openQuests().find((q) => q.id === 'wykes-mark').done === true && r.npc('merchant').dialogueState === 'mark-read',
    'Ieuan reads it as Gruffudd’s, and the block goes back up the hill on Wykes’s own cart', r.npc('merchant').dialogueState);
  check(!r.engine.journal().some((c) => c.id === 'body-stair'), 'and not one clue of the mystery came out of any of it: the body is still only found by looking at it');
}

/* ------------------------------- 4c: reputation by ward (rank 8) -------------
 * Two counters the save carries, `outer` and `inner`, one moved per errand
 * finished in that ward (`ward` is the quest file's, #599). Two things read
 * them: a line on the END of whatever anybody in that ward says, and one line
 * under the verdict in the closing pane. Nothing else. It grants nothing,
 * gates nothing and is not a dialogue state, which is why `validateQuestSet`'s
 * one-voice rule has nothing to arbitrate about it.
 *
 * WHAT THE REST OF THIS FILE IS DOING FOR THIS SECTION. `rig` hands the real
 * block to every manager it builds, so every `same(lines, ...)` assertion
 * above is an assertion that the aside is NOT said below its threshold. That
 * is the half this section cannot check on its own: it can prove the line
 * arrives, and it takes the whole rest of the file to prove it does not
 * arrive early.
 */
console.log('\nreputation by ward');
const wardCount = (w) => sideQuests.filter((q) => q.ward === w).length;
const repLine = (key, at) => reputation[key].find((e) => e.at === at).line;
{
  const opts = { npcs: npcDefs, mystery, actions: QuestManager.sideActions, reputation };
  check(validateQuestSet(sideSet, opts).length === 0, 'validateQuestSet finds nothing wrong with the block as it ships', validateQuestSet(sideSet, opts).join('; '));
  check(validateQuestSet(sideSet, { ...opts, reputation: null }).length === 0, 'and a castle with no block at all is not a problem: the counters still move, nobody says so');

  // Rule 5, each half broken on purpose (#34). The one that matters is the
  // unreachable threshold: it fails silently in the game, it looks exactly
  // like a line that has not been earned yet, and nothing else here would say.
  const bad = (mutate) => { const r = JSON.parse(JSON.stringify(reputation)); mutate(r); return validateQuestSet(sideSet, { ...opts, reputation: r }); };
  const expect = (label, mutate, re) => {
    const p = bad(mutate);
    check(p.some((x) => re.test(x)), `validateQuestSet rejects ${label}`, p.length ? `said: ${p.join('; ')}` : 'said nothing');
  };
  // The three ceilings come off the files rather than out of this file, because
  // they moved once already: they were 3, 2 and 5 until the dozen closed and
  // are 7, 5 and 12 now (#691 to #695), and a literal here is a suite that has
  // to be edited every time an errand is written.
  expect(`an outer threshold past the ${wardCount('outer')} errands the outer ward has`, (r) => { r.outer.at(-1).at = wardCount('outer') + 1; },
    new RegExp(`reputation\\.outer: at ${wardCount('outer') + 1} is past the ${wardCount('outer')} errand\\(s\\) there are to finish`));
  expect(`an inner one past its ${wardCount('inner')}`, (r) => { r.inner.at(-1).at = wardCount('inner') + 4; },
    new RegExp(`reputation\\.inner: at ${wardCount('inner') + 4} is past the ${wardCount('inner')} errand\\(s\\)`));
  expect('a closing threshold past the whole set', (r) => { r.closing.at(-1).at = sideQuests.length + 1; },
    new RegExp(`reputation\\.closing: at ${sideQuests.length + 1} is past the ${sideQuests.length} errand\\(s\\)`));
  expect('a threshold of zero, which is a line said before anything is done', (r) => { r.outer[0].at = 0; }, /at 0 is not a whole number of errands, one or more/);
  expect('a list out of order, which the highest-wins read would silently invert', (r) => { r.outer = [r.outer[1], r.outer[0]]; }, /at 2 does not come after 3/);
  expect('two lines at one threshold', (r) => { r.inner[1].at = r.inner[0].at; }, /at 1 does not come after 1/);
  expect('a line that is not a string', (r) => { r.closing[0].line = 42; }, /at 1 has no `line`/);
  expect('a ward the castle does not have', (r) => { r.town = [{ at: 1, line: 'x' }]; }, /reputation\.town: is not one of outer, inner, closing/);
  expect('a ward list that is not a list', (r) => { r.inner = { at: 1, line: 'x' }; }, /reputation\.inner: is not a list/);
  const flat = validateQuestSet(sideSet, { ...opts, reputation: [] });
  check(flat.some((x) => /`reputation` is not an object of ward lists/.test(x)), 'and a block that is not an object at all', flat.join('; ') || 'said nothing');
}
{
  // THE INNER WARD. One errand, and the inner ward has a word for you; the
  // outer ward, which you have done nothing for, says exactly what it said.
  const r = rig();
  const { qm, npc } = r;
  const said = (id) => { qm.handleInteract(npc(id)); const l = r.ui.dialogue.lines; r.ui.endDialogue(); return l; };
  check(same(qm.reputation(), { outer: 0, inner: 0 }), 'a fresh day owes nobody anything', JSON.stringify(qm.reputation()));
  check(same(said('constable'), renderLines(linesOf('constable', 'default'), quest.tokens)), 'and the Constable says his four lines and the accusation token, with nothing after them');

  r.talk('lady'); r.examine('tally'); r.talk('lady');
  check(qm.openQuests().find((q) => q.id === 'ladys-hawk').done === true, 'the merlin is off the south walk');
  check(same(qm.reputation(), { outer: 0, inner: 1 }), 'which moves the inner counter and not the outer one', JSON.stringify(qm.reputation()));
  const heard = said('constable');
  check(heard.at(-1) === repLine('inner', 1), 'and Sir Roger, who asked for none of it, has heard about it', heard.at(-1)?.slice(0, 40));
  // WHATEVER HE WAS GOING TO SAY, which since the dozen closed is his own
  // errand's lines and not `default`: the first `said('constable')` above is
  // the conversation that opened `rogers-verse`. The aside is still exactly
  // one line on the end of a line set this file did not choose, which is the
  // thing being asserted; naming the state here would make it an assertion
  // about which errand he is standing in.
  const state = npc('constable').dialogueState;
  check(state !== 'default', 'who is standing in his own errand by now, because talking to him is how it opens', state);
  check(same(heard.slice(0, -1), renderLines(linesOf('constable', state), quest.tokens)), 'on the end of what he was going to say anyway, which is untouched');
  check(same(said('cook'), linesOf('cook', 'default')), 'and Marged, in the other ward, says what she always said');

  // The second inner errand moves it to the second band, and the first line is
  // not said again: the highest threshold reached is the one that is said.
  r.talk('chaplain'); r.examine('candle'); r.talk('chaplain');
  check(same(qm.reputation(), { outer: 0, inner: 2 }), 'the candle account closes and the inner counter is at two', JSON.stringify(qm.reputation()));
  check(said('lady').at(-1) === repLine('inner', 2), 'Lady Alys is on the second line now', said('lady').at(-1)?.slice(0, 40));
  check(!said('porter').includes(repLine('inner', 1)), 'and nobody is still saying the first');
}
{
  // THE OUTER WARD, AND THE TWO PLACES THE ASIDE IS DELIBERATELY NOT.
  const r = rig();
  const { qm, npc } = r;
  const said = (id) => { qm.handleInteract(npc(id)); const l = r.ui.dialogue.lines; r.ui.endDialogue(); return l; };
  r.talk('cook'); r.examine('knife'); r.talk('cook');
  check(same(qm.reputation(), { outer: 1, inner: 0 }), 'the knife found is one for the outer ward', JSON.stringify(qm.reputation()));
  check(same(said('clerk'), linesOf('clerk', 'default')), 'and one is below the outer ward first threshold, so nobody says anything yet');
  while (r.engine.watch !== 'terce') r.ring();
  r.talk('sentry'); r.talk('porter'); r.talk('sentry');
  check(same(qm.reputation(), { outer: 2, inner: 0 }), 'four pence carried through the gate is two', JSON.stringify(qm.reputation()));
  check(said('clerk').at(-1) === repLine('outer', 2), 'and now Master Robert has heard it in the yard', said('clerk').at(-1)?.slice(0, 40));
  check(said('prisoner').at(-1) === repLine('outer', 2), 'and so has a man in a cell, because it is the ward that says it and not the person');
  check(!said('lady').includes(repLine('outer', 2)), 'the inner ward has not: it is two counters and not one');

  // NOT ON A PRESS. The answer to a clue pushed at somebody is the mystery's.
  r.engine.discover('wax-matches');
  r.present('clerk', 'wax-matches');
  check(r.engine.npcState('clerk') === 'cloak' && same(r.ui.dialogue.lines, linesOf('clerk', 'cloak')),
    'the wax presented to Master Robert gets the cloak and only the cloak, with no word about errands after it', r.ui.dialogue.lines.at(-1)?.slice(0, 40));

  // NOT ON THE MORNING AFTER. `_dayLines` replaces every line set in
  // npcs.json, and a castle burying a man is the wrong room for the gossip.
  r.talk('constable');
  while (!r.ui.accusation) { r.ring(); r.talk('constable'); }
  r.ui.say('nobody', []);
  check(r.ui.epilogue?.class === 'fall' && r.ui.epilogueLabel === 'The next morning', 'the day is called a fall and there is a morning after it');
  r.ui.restart();
  check(r.engine.day === 2, 'which is walked into');
  const after = said('cook');
  check(same(after, mystery.day2.lines.cook.nobody), 'Marged says what the morning made of her and not one word about a knife', after.at(-1)?.slice(0, 40));
}
{
  // THE CLOSING PANE. One line under the verdict, keyed to both counters
  // added together, and nothing at all for a player who ran no errand.
  const bare = rig();
  bare.talk('constable');
  while (!bare.ui.accusation) { bare.ring(); bare.talk('constable'); }
  bare.ui.say('nobody', []);
  check(bare.ui.epilogue?.reputation == null, 'a player who ran no errand is not told they ran none: the line is not there', JSON.stringify(bare.ui.epilogue?.reputation));

  const r = rig();
  r.talk('lady'); r.examine('tally'); r.talk('lady');
  r.talk('chaplain'); r.examine('candle'); r.talk('chaplain');
  r.talk('cook'); r.examine('knife'); r.talk('cook');
  check(same(r.qm.reputation(), { outer: 1, inner: 2 }), 'three errands, one outer and two inner', JSON.stringify(r.qm.reputation()));
  r.talk('constable');
  while (!r.ui.accusation) { r.ring(); r.talk('constable'); }
  r.ui.say('nobody', []);
  check(r.ui.epilogue.reputation === repLine('closing', 3), 'and the pane carries the line the three of them are worth', r.ui.epilogue.reputation?.slice(0, 40));
  // And again on the morning after, because the errands were run on the day
  // before, which is the only day they could have been run on.
  r.ui.restart();
  r.talk('inspector');
  check(r.ui.epilogue.reputation === repLine('closing', 3), 'the morning after pane carries the same one', `${r.qm.stage}: ${r.ui.epilogue.reputation?.slice(0, 40)}`);
}
{
  // THE SAVE, AND THE ONE WAY A COUNTER COULD LIE. `_snapshot` writes both
  // counters, main.js copies them onto the state, and a manager built on that
  // state resumes with them — without counting the finished errands a second
  // time, which is the failure this shape makes impossible rather than
  // guarded: a terminal stage has no transition out of it (#393), so a quest
  // that has arrived at an ending cannot move again, and `_settleSide`, the
  // only line that adds, runs only on a quest that moved.
  const r = rig();
  r.talk('lady'); r.examine('tally'); r.talk('lady');
  r.talk('cook'); r.examine('knife'); r.talk('cook');
  check(same(r.state.reputation, { outer: 1, inner: 1 }), 'the snapshot writes both counters into the save', JSON.stringify(r.state.reputation));
  const again = rig({ saved: JSON.parse(JSON.stringify(r.state)) });
  check(same(again.qm.reputation(), { outer: 1, inner: 1 }), 'a reload comes back owed the same two favours and not four', JSON.stringify(again.qm.reputation()));
  again.qm.handleInteract(again.npc('constable'));
  check(again.ui.dialogue.lines.at(-1) === repLine('inner', 1), 'with the inner ward still saying so after the reload', again.ui.dialogue.lines.at(-1)?.slice(0, 40));
  again.ui.endDialogue();
  // A quest walked into its ending after the reload is an errand finished now.
  const held = rig({ saved: { ...JSON.parse(JSON.stringify(r.state)), quests: { ...r.state.quests, 'cooks-knife': 'found' }, reputation: { outer: 0, inner: 1 } } });
  check(held.qm.openQuests().find((q) => q.id === 'cooks-knife').done === false && held.qm.reputation().outer === 0,
    'a save sitting one conversation short of the end owes nothing for it yet', JSON.stringify(held.qm.reputation()));
  held.talk('cook');
  check(held.qm.reputation().outer === 1, 'and that conversation is what pays it', JSON.stringify(held.qm.reputation()));
}

/* ------------------------- 4e: the walking day, through the manager (#750) ----
 * THE FIRST DOOR INTO THE GAME IS THE DAY BEFORE THE DEATH (#751, #752). The
 * page opens on `explore` now, so this is the castle a player meets first, driven
 * through the real manager the way part 4 drives day one: E on somebody, E on a
 * thing, E on the word-lock, the J key, and the bell four times. What this file
 * owns of it is the graph, the manager and index.html (#529); the engine's own
 * answers and the day-0 stations are test/mystery.mjs's.
 */
console.log('\nthe walking day, through the manager');
{
  const W0 = mystery.day0.watches;
  const r = rig({ day0: true });
  const { qm, ui, engine, state, castle } = r;
  check(qm.stage === 'explore' && qm.day === 0 && state.day === 0,
    'a fresh page opens on the walking day, in `explore`, and the save says day 0', `${qm.stage} / day ${state.day}`);
  check(ui.objective === quest.stages.explore.objective, 'with its own objective on the tracker', ui.objective);
  check(ui.watch === mystery.watchLabels[W0[0]] && ui.watch !== W0[0],
    `and the bell read out as ${JSON.stringify(mystery.watchLabels[W0[0]])} rather than as its id, which is a nav key and not an hour (open call 1)`, JSON.stringify(ui.watch));
  check(r.watches.at(-1) === W0[0] && r.skies.at(-1) === mystery.watchLike[W0[0]],
    `the world is put at ${W0[0]} with ${mystery.watchLike[W0[0]]}'s sky, which is the one data/scene-config.json has (open call 10)`,
    `${r.watches.at(-1)} / sky ${r.skies.at(-1)}`);

  // What is on the ground: the six that are furniture, and not the five that are
  // the mystery's. The muniment leaf is the one that matters most — its collider
  // is a wall of the King's Tower and hiding it is a hole in the castle.
  const shown = Object.keys(castle.shown).filter((id) => castle.shown[id]).sort();
  const gone = Object.keys(castle.shown).filter((id) => !castle.shown[id]).sort();
  check(same(shown, [...mystery.day0.evidence].sort()),
    `${shown.length} things are on the ground on the walking day: ${shown.join(', ')}`, `and ${gone.length} are not: ${gone.join(', ')}`);
  check(gone.includes('body') && !shown.includes('body') && shown.includes('lock'),
    'the body is not at the stair and the muniment leaf is still in the wall (open call 1)');

  // E on any of them says so rather than nothing, and grants nothing.
  ui.toasts.length = 0;
  r.examine('candle');
  check(same(ui.toasts, [mystery.ui.quiet]) && qm.journal().length === 0,
    'E on the chapel candles says the walking day\'s one line and puts nothing in the journal', JSON.stringify(ui.toasts));
  // And so does the word-lock, which is the press open call 7 would not kill.
  ui.toasts.length = 0;
  qm.handleLock('muniment', 'lock');
  check(ui.riddleOpen === false && same(ui.toasts, [mystery.ui.quiet]) && !state.locks.includes('muniment'),
    'E at the muniment door toasts and does not open the riddle: a word answered the day before would unlock the room for the mystery (open call 7)',
    `riddle ${ui.riddleOpen} / ${JSON.stringify(ui.toasts)}`);

  // The journal is empty and the map is not: walking is what the day is for.
  qm.handleJournal();
  check(ui.journal && ui.journal.entries.length === 0 && ui.journal.empty === mystery.ui.empty,
    'the J key opens an empty journal', `${ui.journal?.entries.length} entries`);
  qm.handleEnter('great-hall', 0);
  check(state.visited.includes('great-hall'), 'and a room walked into is on the map, which is what carries across the night (open call 3)');

  // A conversation: his own `day0` lines, no Present button, and no panel. Opened
  // and read before it is stepped out, because `r.talk` closes the box behind it.
  qm.handleInteract(r.npc('constable'));
  check(same(ui.dialogue.lines, npcDefs.find((n) => n.id === 'constable').dialogue.day0),
    'the Constable says his walking-day lines, off the stage\'s own dialogueState (open call 6)', JSON.stringify(ui.dialogue.lines[0]?.slice(0, 40)));
  check(ui.dialogue.onPresent === null, 'with no Present button, because there is nothing to present');
  check(!/\{[A-Z_]+\}/.test(ui.dialogue.lines.join(' ')), 'and no token in the lines at all');
  // Stepped out before the two below are asked, because `talked:constable` is
  // dispatched on the last line and not on the first: the stage move and the
  // panel are what that event would do, and this is where it has happened.
  ui.endDialogue();
  check(ui.accusation === null && qm.stage === 'explore',
    'and stepping it out opens no accusation panel and moves no stage: `explore` has no `talked:constable` transition and his `day0` set has no {ACCUSE} in it',
    `${qm.stage} / ${ui.accusation ? 'panel up' : 'no panel'}`);
  qm.handleInteract(r.npc('hywel'));
  check(same(ui.dialogue.lines, npcDefs.find((n) => n.id === 'hywel').dialogue.day0) && qm.journal().length === 0,
    'and the master mason is alive and speakable, which is the whole reason to walk the day (#752)', JSON.stringify(ui.dialogue.lines[0]?.slice(0, 40)));
  ui.endDialogue();

  // The bell, four times. Three move the watch; the fourth is the night.
  for (let i = 1; i <= 3; i++) r.ring();
  check(engine.watch === W0[3] && ui.watch === mystery.watchLabels[W0[3]] && r.skies.at(-1) === mystery.watchLike[W0[3]],
    `three rings walk the walking day to ${W0[3]}, with ${mystery.watchLike[W0[3]]}'s sky`, `${engine.watch} / ${ui.watch} / ${r.skies.at(-1)}`);
  check(same(r.audio.rung, [1, 2, 3]), 'and each ring has its own character out of data/sounds.json (#701)', JSON.stringify(r.audio.rung));
  r.ring();
  check(qm.stage === 'night' && ui.epilogue && ui.epilogue.convicted === mystery.day0.night.title && ui.epilogue.epilogue === mystery.day0.night.text,
    'the fourth ring puts up the night pane, which is the epilogue\'s own pane and frees the pointer (#660)', JSON.stringify(ui.epilogue?.convicted?.slice(0, 40)));
  check(ui.epilogueLabel === mystery.day0.night.button && same(r.audio.rung, [1, 2, 3, 4]),
    `and its button reads ${JSON.stringify(mystery.day0.night.button)}, with the fourth ring rung`, JSON.stringify(ui.epilogueLabel));
  check(engine.watch === W0[3] && state.watch === 3 && state.day === 0, 'and it moved no watch and no day: the walking day ends where it stood (open call 5)', `${engine.watch} / day ${state.day}`);

  // The button. One dispatch of `day:1`, and the mystery is the castle.
  ui.restart();
  check(qm.stage === 'arrive' && qm.day === 1 && state.day === 1 && engine.watch === mystery.watches[0],
    'the pane\'s button opens the day of the death, in `arrive` at Prime', `${qm.stage} / day ${state.day} at ${engine.watch}`);
  check(castle.shown.body === true && castle.shown.pouch === true && castle.shown.cart === false,
    'the body is back at the foot of the stair and the eleven rows are read at the four bells again', JSON.stringify(castle.shown));
  check(engine.stationOf('constable')?.room === 'chapel' && engine.stationOf('hywel') === null,
    'the Constable is standing over him and Hywel is not in the castle at all', JSON.stringify(engine.stationOf('hywel')));
  check(ui.objective === quest.stages.arrive.objective && ui.watch === 'Prime',
    'and the tracker is the mystery\'s: its objective, and a bell that is its own name', `${JSON.stringify(ui.objective?.slice(0, 32))} / ${ui.watch}`);
  check(r.restarts.n === 0, 'and nothing reloaded the page or erased the save on the way through');
}
{
  /* THE ERRANDS RUN ON A DAY WITH NO MYSTERY (#550 question 6, open call 6). They
   * were never the mystery's: `_syncStates` layers a press over an errand over
   * the stage, so an errand already in progress speaks on the walking day, and
   * `_dispatchSide` freezes the side quests on day two and not on day zero. The
   * ward's own aside runs with it, because it is a line about the player rather
   * than about the case. */
  const saved = { ...freshState(quest), reputation: { outer: 2, inner: 0 }, quests: { 'cooks-knife': 'hunting' } };
  const r = rig({ saved, day0: true });
  check(r.qm.day === 0 && r.npc('cook').dialogueState === 'knife-hunting',
    'an errand in progress speaks on the walking day: the cook is on her knife lines and not on the stage\'s `day0` floor', r.npc('cook').dialogueState);
  r.qm.handleInteract(r.npc('cook'));
  check(r.ui.dialogue.lines.at(-1) === repLine('outer', 2),
    'and the outer ward\'s aside is on the end of what she says, at two errands done', JSON.stringify(r.ui.dialogue.lines.at(-1)?.slice(0, 40)));
  check(r.ui.dialogue.onPresent === null, 'still with no Present button: the walking day has nothing to present');
}

/* -------------------------------------------------------------- 5: the page --- */
console.log('the page');
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = /<div id="quest-objective">([^<]*)<\/div>/.exec(html);
  check(m && m[1].trim() === quest.stages[quest.start].objective, "index.html's initial objective is the start stage's, so the tracker never flashes stale text", m ? JSON.stringify(m[1]) : 'no #quest-objective in index.html');
  /* AND THE BELL BESIDE IT, for the same reason and one more (#750 to #756). The
   * page ships with a bell written into the tracker, and the start stage is the
   * walking day now, whose first bell is not one of the four and is not called by
   * its own id: the manager reads `mystery.watchLabels` and so does this, so the
   * markup cannot say "Prime" while the first thing the player hears is
   * "Prime, the eve". */
  const firstBell = mystery.day0.watches[0];
  const wantWatch = mystery.watchLabels?.[firstBell] ?? firstBell;
  const w = /<div id="quest-watch"[^>]*>([^<]*)<\/div>/.exec(html);
  check(w && w[1].trim() === wantWatch, `index.html's initial bell is the start stage's own, read out as ${JSON.stringify(wantWatch)}`, w ? JSON.stringify(w[1]) : 'no #quest-watch in index.html');

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

/* ---------------------------------- the open-quests tab, through the manager ---
 * BACKLOG.md rank 9's next increment (#595). `openQuests()` has had the data
 * since #576 and nothing read it: all a player got for a thread was one toast
 * on the move, and two toasts missed are two threads they cannot find again.
 * The tab is the journal's fourth, handed over by `_openJournal` the way the
 * map and the documents already are, and the rule it carries is that a quest
 * nobody has met is not on it.
 */
console.log('\nthe open-quests tab');
{
  const r = rig();
  const { qm, ui, npc } = r;
  const knife = sideQuests.find((q) => q.id === 'cooks-knife');
  const tab = () => { qm.handleJournal(); const t = ui.journal?.quests; ui.closeJournal(); return t; };

  check(qm.openQuests().every((q) => q.started === false), 'a fresh day has met no quest');
  check(tab() === null, 'so the journal is handed no quest list at all, and the tab is not offered', JSON.stringify(tab()));

  r.talk('cook');
  const met = tab();
  check(Array.isArray(met) && met.length === 1 && met[0].id === 'cooks-knife', 'one conversation with Marged puts the knife on the page', JSON.stringify(met?.map((q) => q.id)));
  check(met[0].title === knife.title && met[0].objective === knife.stages.hunting.objective && met[0].done === false,
    'with its title and the stage it is actually at, which is the line the toast said once', JSON.stringify(met[0]));

  r.examine('knife');
  check(tab()[0].objective === knife.stages.found.objective, 'the barrel moves what the tab says without a word from the player', tab()[0].objective);

  r.talk('cook');
  const ended = tab();
  check(ended.length === 1 && ended[0].done === true && ended[0].objective === knife.stages.settled.objective,
    'and a finished errand stays on the page, marked done, rather than disappearing off it', JSON.stringify(ended[0]));

  // The tab is the journal's and not the Present picker's, the same rule the
  // documents tab has carried since #551.
  qm.handleInteract(npc('cook'));
  ui.pressPresent();
  check(ui.journal?.quests === null && ui.journal?.present !== null, 'and Present from inside a conversation offers clues alone: no map, no documents, no errands', JSON.stringify(Object.keys(ui.journal ?? {})));
  ui.closeJournal();
  ui.dialogue = null;
}
{
  // A RESUMED QUEST IS A MET QUEST. The stage comes back out of the save, and
  // the tab has to read the graph rather than a flag nothing sets on a reload.
  const first = rig();
  first.talk('cook');
  const resumed = rig({ saved: { ...first.state, stage: first.qm.stage, quests: { 'cooks-knife': 'found' } } });
  resumed.qm.handleJournal();
  const row = resumed.ui.journal?.quests?.[0];
  check(row?.id === 'cooks-knife' && row.objective === sideQuests.find((q) => q.id === 'cooks-knife').stages.found.objective,
    'a reload mid-errand comes back with the errand on the page, at the stage the save had', JSON.stringify(row));
  resumed.ui.closeJournal();
}
{
  // And a castle with no side quests at all has no tab, the way a manager with
  // no rooms has no map.
  const r = rig({ withSideQuests: false });
  r.qm.handleJournal();
  check(r.ui.journal?.quests === null, 'no quests in the set, no tab', JSON.stringify(r.ui.journal?.quests));
}

/* ------------------------------------------------- the map, through the manager ---
 * The journal's third tab (#589) is `mapJournal()`: every room the nav lists,
 * marked with whether the engine's `visited` has it. Rooms come in through the
 * constructor, so a rig with three rooms is a castle with three rooms. Two
 * things are the manager's here and nowhere else: that a first visit marks the
 * autosave the way a clue does and a second does not, and that the map is
 * what `openJournal` is handed on J.
 */
console.log('\nthe map, through the manager');
{
  const rooms = [
    { id: 'great-hall', name: 'Great Hall', level: 0, bounds: { min: { x: 0, z: 0 }, max: { x: 4, z: 4 } }, shape: null },
    { id: 'cross-walk', name: 'The walk over the cross-wall', level: 2, bounds: { min: { x: 0, z: 0 }, max: { x: 1, z: 4 } }, shape: null },
    { id: 'cell', name: 'The cell', level: 0, bounds: { min: { x: 5, z: 5 }, max: { x: 8, z: 8 } }, shape: { kind: 'disc', cx: 6.5, cz: 6.5, radius: 1.5 } },
  ];
  const r = rig({ rooms });
  check(r.qm.mapJournal().every((m) => !m.visited) && r.qm.mapJournal().length === 3, 'fresh: three rooms, none stood in');
  const before = r.changes.n;
  r.qm.handleEnter('great-hall', 0);
  check(r.changes.n === before + 1, 'the first step into a room marks the autosave, the way a clue does', `${r.changes.n - before} marks`);
  r.qm.handleEnter('great-hall', 0);
  check(r.changes.n === before + 1, 'and the second step into the same room does not', `${r.changes.n - before} marks`);
  check(same(r.qm.mapJournal().map((m) => [m.id, m.visited]), [['great-hall', true], ['cross-walk', false], ['cell', false]]), 'the map marks the hall and nothing else', JSON.stringify(r.qm.mapJournal().map((m) => [m.id, m.visited])));
  r.qm.handleJournal();
  check(r.ui.journal?.map?.length === 3 && r.ui.journal.map.find((m) => m.id === 'great-hall')?.visited === true && r.ui.journal.map.find((m) => m.id === 'great-hall')?.name === 'Great Hall',
    'J hands the UI the map, with the hall marked and named', JSON.stringify(r.ui.journal?.map));
  // The walk is a room AND a clue: one step onto it lands walk-crosses and
  // marks the walk, through the one call main.js makes on a room change (#588).
  r.qm.handleEnter('cross-walk', 2);
  check(r.holds('walk-crosses') && r.state.visited.includes('cross-walk'), 'one step onto the cross-wall walk is both the clue and the visit');
  // A castle with no rooms has no map: the tab is not offered.
  const bare = rig();
  bare.qm.handleJournal();
  check(bare.ui.journal?.map === null, 'a manager given no rooms hands the UI no map, so the tab is not offered');
}

/* ------------------------------ the sermon and the song, through the manager ---
 * The two set pieces (#592, BACKLOG.md rank 8). data/npcs.json's `performances`
 * is four pieces; what the manager does with them is one question asked
 * twice, the player is standing in this room at this bell and is anybody
 * performing, once when the room changes and once when the bell does. Everything below
 * drives the real pool, not a stand-in, so a piece moved in the data is a
 * different answer here.
 *
 * THE CLOCK IS INJECTED. The band steps its lines on the manager's `_schedule`,
 * the same hook the graph's delayed effects use, so `tick` below is a whole
 * sermon in no time at all and the suite never waits on a timer.
 */
console.log('\nthe sermon and the song');

/** A rig whose captions step on a queue this returns, with the real pool in it. */
function performRig(opts = {}) {
  const queue = [];
  const r = rig({ ...opts, perform: performances, schedule: (fn) => queue.push(fn) });
  // Step the band at most `n` times. Each step schedules the next, so a cap is
  // what stops a bug here becoming a hung suite rather than a failed one.
  r.tick = (n = 40) => { let i = 0; while (queue.length && i < n) { queue.shift()(); i++; } return i; };
  r.pending = () => queue.length;
  return r;
}

const pieceOf = (id) => Object.values(performances).flat().find((e) => e.id === id);

{
  // NOBODY PERFORMS UNTIL THE ROOM AND THE BELL BOTH SAY SO.
  const r = performRig();
  r.qm.handleEnter('chapel', 0);
  check(r.ui.captionLine === null && r.qm.performing === null, 'the chapel at Prime is a quiet chapel: the sermon is a Vespers piece', JSON.stringify(r.ui.captionLine));
  r.qm.handleEnter('kitchen', 0);
  check(r.ui.captionLine === null, 'and so is the kitchen at Prime');
  r.ring();
  check(r.ui.captionLine === null, 'and at Terce');
  r.ring();
  const song = pieceOf('song-sext-kitchen');
  check(r.engine.watch === 'sext' && r.ui.captionLine === song.lines[0], 'the Sext bell finds the player already in the kitchen, and Marged starts', JSON.stringify(r.ui.captionLine));
  check(r.ui.captionName === 'Marged' && r.qm.performing?.id === 'song-sext-kitchen', 'the band carries her name, and the manager says which piece is running', `${r.ui.captionName} / ${r.qm.performing?.id}`);
}
{
  // THE WHOLE PIECE, LINE BY LINE, AND THEN THE BAND GOES DARK.
  const r = performRig();
  r.ring(); r.ring();
  r.qm.handleEnter('kitchen', 0);
  const song = pieceOf('song-sext-kitchen');
  check(r.qm.performing?.id === 'song-sext-kitchen', 'walking into the kitchen at Sext starts it the same way the bell did');
  const before = r.changes.n;
  r.tick();
  check(same(r.ui.captions.map((c) => c.replace(/^[^:]*: /, '')), song.lines), `all ${song.lines.length} lines, in the order the file has them`, JSON.stringify(r.ui.captions.slice(-1)));
  check(r.ui.captionLine === null && r.qm.performing === null, 'and then the band goes dark on its own');
  check(r.ui.toasts.length === 0 && r.changes.n === before, 'a song grants nothing and writes nothing: no toast, no clue, no autosave', `${r.ui.toasts.length} toasts, ${r.changes.n - before} marks`);
  check(r.pending() === 0, 'and it leaves no step behind it on the clock');
}
{
  // ONCE. Walking out and back in at the same bell does not start it again.
  const r = performRig();
  r.ring(); r.ring();
  r.qm.handleEnter('kitchen', 0);
  r.tick();
  const said = r.ui.captions.length;
  r.qm.handleEnter('outer-ward', 0);
  r.qm.handleEnter('kitchen', 0);
  r.tick();
  check(r.ui.captions.length === said, 'a piece is said once: back into the kitchen at the same bell and Marged has finished', `${r.ui.captions.length} vs ${said}`);
}
{
  // WALKING OUT CUTS IT OFF, mid-verse, and nothing goes on being captioned.
  const r = performRig();
  r.ring(); r.ring();
  r.qm.handleEnter('kitchen', 0);
  r.tick(2);
  check(r.ui.captions.length === 3 && r.qm.performing !== null, 'three lines in, still singing', `${r.ui.captions.length} lines`);
  r.qm.handleEnter('bakehouse', 0);
  check(r.ui.captionLine === null && r.qm.performing === null, 'through the door to the bakehouse and the band is dark: you cannot hear the kitchen from here');
  const said = r.ui.captions.length;
  r.tick();
  check(r.ui.captions.length === said, 'and the steps still on the clock say nothing when they wake up', `${r.ui.captions.length} vs ${said}`);
}
{
  // AND SO DOES THE BELL, which is the other half of the same rule.
  const r = performRig();
  r.ring(); r.ring();
  r.qm.handleEnter('kitchen', 0);
  r.tick(1);
  r.ring();
  check(r.engine.watch === 'vespers' && r.ui.captionLine === null && r.qm.performing === null, 'the Vespers bell over a Sext song ends the song', `${r.engine.watch} / ${JSON.stringify(r.ui.captionLine)}`);
  const said = r.ui.captions.length;
  r.tick();
  check(r.ui.captions.length === said, 'and the rest of the verses are not sung over the new bell', `${r.ui.captions.length} vs ${said}`);
}
{
  // THE HALL AT VESPERS AND THE CHAPEL AT VESPERS: two pieces at one bell, and
  // which one the player gets is which room they are standing in.
  const hall = performRig();
  hall.ring(); hall.ring(); hall.ring();
  hall.qm.handleEnter('great-hall', 0);
  check(hall.ui.captionName === 'Dafydd ap Rhys' && hall.qm.performing?.id === 'song-vespers-hall', 'the hall at Vespers is the sentry on the bench end', `${hall.ui.captionName} / ${hall.qm.performing?.id}`);
  const chapel = performRig();
  chapel.ring(); chapel.ring(); chapel.ring();
  chapel.qm.handleEnter('chapel', 0);
  check(chapel.ui.captionName === 'Father Anselm' && chapel.qm.performing?.id === 'sermon-vespers-osyth', 'and the chapel at Vespers is the office, said to whoever came', `${chapel.ui.captionName} / ${chapel.qm.performing?.id}`);
  chapel.tick();
  check(chapel.ui.captions.join(' ').includes('Sir Walter Esturmy'), 'the sermon says from the step what the canon says he says from it', chapel.ui.captions.at(-1));
}
{
  // THE MORNING AFTER IS A DIFFERENT SERMON IN THE SAME CHAPEL (#592). The
  // shortest road to it: the Constable takes the prisoner at Terce, and the
  // pane's button is Lauds.
  const r = performRig();
  r.talk('constable');
  r.ring();
  r.talk('constable');
  r.ui.say('prisoner', []);
  r.qm.handleEnter('chapel', 0);
  check(r.qm.performing === null, 'the chapel at Terce, with the day judged, is still quiet');
  r.ui.restart();
  check(r.qm.day === 2 && r.engine.watch === mystery.day2.watches[0], 'the button opens the morning after, at Lauds', `day ${r.qm.day} / ${r.engine.watch}`);
  check(r.qm.performing?.id === 'sermon-lauds-cadeyrn', 'and the player standing in the chapel gets the second sermon where they stand', r.qm.performing?.id);
  r.tick();
  check(r.ui.captions.join(' ').includes('Cadeyrn'), 'which is the works\' own saint over a grave that is filled, and not yesterday\'s', r.ui.captions.at(-1));
  check(r.ui.captions.every((c) => c.startsWith('Father Anselm:')), 'every line of it in the chaplain\'s mouth');
}
/* ------------------------------------ what the castle says about the player ---
 * The `rumours` pool (#648). Three pieces, one room, one bell: the guardroom
 * at Lauds. Which of the three Dafydd says is the verdict the player reached
 * and the journal he carried into the morning, which makes it the first thing
 * in this game whose CONTENT, and not only whose line set, is keyed on what
 * the player found rather than on what he said.
 *
 * The order in data/npcs.json is load-bearing and src/lore.js is what holds it
 * (a piece an earlier one answers for everywhere is refused there). What is
 * asserted here is the other half: that the manager reads that order, and that
 * the same castle, walked two ways, says two different things in one room.
 */
console.log('\nthe guardroom at Lauds: what is being said about you');

/** The shortest road to a verdict and the morning after it, per the beat above. */
function morningAfter(r, who, clues = []) {
  r.talk('constable');
  r.ring();
  r.talk('constable');
  r.ui.say(who, clues);
  r.ui.restart();
  return r;
}

{
  // DAY ONE IS QUIET IN THERE, at every one of the four bells. A rumour is
  // about a verdict and there is no verdict yet.
  const r = performRig();
  for (let i = 0; i < 4; i++) {
    r.qm.handleEnter('guardroom', 0);
    check(r.qm.performing === null, `the guardroom at ${r.engine.watch} is a guardroom and not a chorus`, r.qm.performing?.id);
    if (i < 3) r.ring();
  }
}
{
  // THE SMITH HANGED AND THE ROLL WAS READ. The sharpest of the three, and the
  // only one a player can miss by not doing the work.
  const r = performRig();
  r.examine('gaol-roll');
  check(r.engine.state.clues.includes('gaol-dates'), 'the roll is off the barrel-head and the dates are in the journal', r.engine.state.clues.join(', '));
  morningAfter(r, 'prisoner', []);
  r.qm.handleEnter('guardroom', 0);
  check(r.qm.performing?.id === 'rumour-lauds-roll', 'the guardroom at Lauds is the piece keyed on the roll', r.qm.performing?.id);
  r.tick();
  check(r.ui.captions.every((c) => c.startsWith('Dafydd ap Rhys:')), 'every line of it in the sentry\'s mouth');
  check(r.ui.captions.join(' ').includes('And then you went up to the Constable and you said the smith'), 'and it says back to the player what the player did', r.ui.captions.at(-1));
}
{
  // THE SAME VERDICT, THE ROLL NEVER TOUCHED. Same room, same bell, same
  // sentry, different piece: the narrow one does not apply and the general one
  // underneath it does.
  const r = performRig();
  check(!r.engine.state.clues.includes('gaol-dates'), 'nothing read, nothing in the journal');
  morningAfter(r, 'prisoner', []);
  r.qm.handleEnter('guardroom', 0);
  check(r.qm.performing?.id === 'rumour-lauds-hanged', 'the guardroom falls past the roll piece to the one about a hanging', r.qm.performing?.id);
  r.tick();
  check(!r.ui.captions.join(' ').includes('I watched you read them'), 'and says nothing about a roll this player never lifted');
}
{
  // NOBODY HANGED. The third piece, and the one ending the other two exclude.
  const r = performRig();
  morningAfter(r, 'nobody', []);
  r.qm.handleEnter('guardroom', 0);
  check(r.qm.performing?.id === 'rumour-lauds-nobody', 'a fall gets the piece about a morning with no rope in it', r.qm.performing?.id);
  r.tick();
  check(r.ui.captions.join(' ').includes('No rope, no hole in the ground, no name read out'), 'which says so in the first breath', r.ui.captions.at(-1));
}
{
  // ONCE, LIKE EVERY OTHER PIECE (#594), and the place goes quiet after it
  // rather than falling through to the next piece written under it.
  const r = performRig();
  morningAfter(r, 'prisoner', []);
  r.qm.handleEnter('guardroom', 0);
  r.tick();
  const said = r.ui.captions.length;
  r.qm.handleEnter('outer-ward', 0);
  r.qm.handleEnter('guardroom', 0);
  check(r.qm.performing === null && r.ui.captions.length === said, 'back into the guardroom and Dafydd has finished, and the other two rumours do not take their turn', `${r.qm.performing?.id} / ${r.ui.captions.length} vs ${said}`);
}
{
  // THE CHAPEL STILL GETS ITS SERMON on the same morning, which is the check
  // that a place holding three pieces did not change what a place holding one
  // does.
  const r = performRig();
  morningAfter(r, 'prisoner', []);
  r.qm.handleEnter('chapel', 0);
  check(r.qm.performing?.id === 'sermon-lauds-cadeyrn', 'the chapel at Lauds is the sermon it always was', r.qm.performing?.id);
}
{
  // A MANAGER GIVEN NO POOL IS A CASTLE WHERE NOBODY PERFORMS, which is what
  // every other beat in this file has been running in.
  const r = rig();
  r.ring(); r.ring();
  r.qm.handleEnter('kitchen', 0);
  check(r.qm.performing === null && r.ui.captions.length === 0, 'no pool, no band', JSON.stringify(r.ui.captions));
}

/* --------------------------------------------- two of the household, overheard ---
 * data/populace.json's `talk` pairs (#731, #732). src/populace.js decides a
 * pair is due and hands it over with `room` set to where its two speakers
 * stand; that half, and which pairs stand close enough to talk, is
 * test/mystery.mjs's. What is here is the band's half: the order, the names,
 * once per page, and that a sermon or a song out-ranks it. Same rig, same
 * queued clock, same real pool of performances, so the precedence is against
 * the song that is really in the kitchen at Sext.
 */
console.log('\ntwo of the household, overheard');
const household = read('data/populace.json');
/** A pair the way Populace hands it over: `room` set, and the two names. */
const handOver = (id) => {
  const pair = household.talk.find((t) => t.id === id);
  const [a, b] = pair.npcs.map((who) => household.people.find((p) => p.id === who));
  return { pair: { ...pair, room: a.routine[pair.watch][0].room }, names: [a.name, b.name] };
};
{
  // EVERY LINE, IN ORDER, THE NAMES ALTERNATING, AND THEN DARK.
  const r = performRig();
  r.ring(); r.ring();
  const { pair, names } = handOver('talk-sext-inner-ward');
  r.qm.handleEnter(pair.room, 0);
  r.qm.overhear(pair, names);
  check(r.qm.performing?.id === pair.id && r.ui.captionName === names[0] && r.ui.captionLine === pair.lines[0],
    `${names[0]} opens ${pair.id} on the band`, `${r.ui.captionName}: ${r.ui.captionLine}`);
  r.tick();
  const want = pair.lines.map((l, i) => `${names[i % 2]}: ${l}`);
  check(same(r.ui.captions, want), `all ${pair.lines.length} lines in order, ${names[0]}, ${names[1]}, ${names[0]}`, JSON.stringify(r.ui.captions));
  check(r.ui.captionLine === null && r.qm.performing === null && r.pending() === 0, 'and the band goes dark after the last, with nothing left on the clock');
  const said = r.ui.captions.length;
  r.qm.overhear(pair, names);
  r.tick();
  check(r.ui.captions.length === said && r.qm.performing === null, 'a second overhear of the same pair on the same page says nothing', `${r.ui.captions.length} vs ${said}`);
}
{
  // A SONG OUT-RANKS TALK. Marged's Sext song is playing, and a pair handed
  // over now says nothing: it does not cut her off and it does not queue.
  const r = performRig();
  r.ring(); r.ring();
  r.qm.handleEnter('kitchen', 0);
  const song = pieceOf('song-sext-kitchen');
  const { pair, names } = handOver('talk-sext-inner-ward');
  const got = r.qm.overhear(pair, names);
  check(got === null && r.qm.performing?.id === song.id && r.ui.captionLine === song.lines[0] && !r.ui.captions.some((c) => c.startsWith(`${names[0]}:`)),
    'with Marged\'s Sext song playing, overhear says nothing and the song goes on', `${r.qm.performing?.id}: ${r.ui.captionLine}`);
}
{
  // AND TALK NEVER CUTS A PERFORMANCE: the other way round, a talk run is on
  // the band and the player walks into the kitchen at Sext. The talk stops
  // and the song starts.
  const r = performRig();
  r.ring(); r.ring();
  const { pair, names } = handOver('talk-sext-inner-ward');
  r.qm.handleEnter(pair.room, 0);
  r.qm.overhear(pair, names);
  r.qm.handleEnter('kitchen', 0);
  const song = pieceOf('song-sext-kitchen');
  check(r.qm.performing?.id === song.id && r.ui.captionName === 'Marged' && r.ui.captionLine === song.lines[0],
    'a talk run playing and the player walks into the kitchen at Sext: the talk is cut and the song starts', `${r.qm.performing?.id}: ${r.ui.captionName}`);
  const before = r.ui.captions.length;
  r.tick();
  check(!r.ui.captions.slice(before).some((c) => c.startsWith(`${names[0]}:`) || c.startsWith(`${names[1]}:`)), 'and no line of the talk wakes up on the clock over her');
}
{
  // THE BELL STOPS TALK the way it stops a sermon.
  const r = performRig();
  r.ring(); r.ring();
  const { pair, names } = handOver('talk-sext-inner-ward');
  r.qm.handleEnter(pair.room, 0);
  r.qm.overhear(pair, names);
  r.ring();
  check(r.qm.performing === null && r.ui.captionLine === null, 'the Vespers bell over Sext talk ends it', `${r.qm.performing?.id}`);
}
{
  // stopTalk IS BY ID. Another pair's hush leaves the band as it was; this
  // pair's clears it; and a hush never touches a song.
  const r = performRig();
  r.ring(); r.ring();
  const { pair, names } = handOver('talk-sext-inner-ward');
  r.qm.handleEnter(pair.room, 0);
  r.qm.overhear(pair, names);
  r.qm.stopTalk('talk-sext-outer-ward');
  check(r.qm.performing?.id === pair.id && r.ui.captionLine === pair.lines[0], 'stopTalk with another pair\'s id leaves the band as it was', `${r.qm.performing?.id}: ${r.ui.captionLine}`);
  r.qm.stopTalk(pair.id);
  check(r.qm.performing === null && r.ui.captionLine === null, 'and with this pair\'s id the band goes dark');
  const s = performRig();
  s.ring(); s.ring();
  s.qm.handleEnter('kitchen', 0);
  s.qm.stopTalk('song-sext-kitchen');
  check(s.qm.performing?.id === 'song-sext-kitchen', 'and stopTalk with a song\'s id does not stop the song, because a song is not talk', s.qm.performing?.id);
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
