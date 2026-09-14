// quest.mjs — the quest graph in data/quest.json, run without a browser.
// Node only: src/quest-graph.js and src/quest-manager.js import nothing that
// needs a DOM or three, so the manager runs here against stand-in UI, NPCs and
// castle, and the whole quest is walked in a few milliseconds.
//
//   node test/quest.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. The quest used to be two booleans and an if/else in
// quest-manager.js that knew "scholar" and "guard" by name. The only thing that
// exercised it was play-castle.mjs, which needs real GPU compositing and is
// outside CI on purpose (#353). A dialogue state renamed in npcs.json, an
// objective the tracker never showed, a transition to a stage that did not
// exist: every one of those failed silently, on the walk to the Guard, on
// somebody's machine. Now the quest is data, and this is the check on the data.
//
// Five parts:
//   1. quest.json validates: every `to` is a stage, every action is one the
//      manager implements, every stage is reachable and can reach the end
//   2. quest.json against npcs.json: every stage's dialogueState exists on every
//      npc, every {TOKEN} is known, and the riddle opens after exactly the
//      conversations that pose it
//   3. the graph itself: dispatch from every stage on every event lands on a
//      stage, the terminal stage ignores everything, the riddle judge escalates
//   4. the manager, end to end, against stand-ins: objective, dialogue states,
//      the riddle overlay, the gate, the delayed victory screen, and the
//      restart wired to the button — and the two shortcuts a player might try
//   5. the page: index.html's initial objective is the start stage's, and the
//      two objectives play-castle.mjs matches by regex still match

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QuestGraph, validateQuest, validateAgainstNpcs, judgeAnswer, renderLines } from '../src/quest-graph.js';
import { QuestManager } from '../src/quest-manager.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const quest = read('data/quest.json');
const { npcs: npcDefs } = read('data/npcs.json');
const riddle = read('data/riddle.json');

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
  expect('a `to` naming no stage', (d) => { d.stages[d.start].transitions[1].to = 'nowhere'; }, /names no stage/);
  expect('an action the manager lacks', (d) => { d.stages[d.start].transitions[0].do = ['openTrapdoor']; }, /unknown action "openTrapdoor"/);
  expect('an unreachable stage', (d) => { d.stages.attic = { objective: 'Up there.', dialogueState: 'default', transitions: [{ on: 'x', to: d.start }] }; }, /attic: no path from `start`/);
  expect('a stage that cannot reach the end', (d) => { d.stages.oubliette = { objective: 'Down here.', dialogueState: 'default' }; d.stages[d.start].transitions.push({ on: 'fall', to: 'oubliette' }); }, /oubliette: no path from it reaches a terminal/);
  expect('no terminal stage', (d) => { for (const s of Object.values(d.stages)) delete s.terminal; }, /no stage is `terminal`/);
  expect('two stages with one objective', (d) => { const [a, b] = Object.values(d.stages); b.objective = a.objective; }, /same text as/);
  expect('a second transition on the same event', (d) => { const t = d.stages[d.start].transitions; t.push({ ...t[0] }); }, /second transition on/);
  expect('a bad `start`', (d) => { d.start = 'prologue'; }, /`start`.*is not a stage/);
}

/* ------------------------------------------- 2: the graph against the cast --- */
console.log('quest.json against npcs.json');
{
  const problems = validateAgainstNpcs(quest, npcDefs);
  check(problems.length === 0, 'every stage has lines on every npc, every token is known, the riddle opens where it is posed', problems.join('; '));
  const states = new Set(Object.values(quest.stages).map((s) => s.dialogueState));
  for (const npc of npcDefs) {
    const extra = Object.keys(npc.dialogue).filter((k) => !states.has(k));
    check(extra.length === 0, `${npc.id} has no dialogue no stage can reach`, extra.join(', '));
  }
  const brokenNpcs = (mutate) => { const d = JSON.parse(JSON.stringify(npcDefs)); mutate(d); return validateAgainstNpcs(quest, d); };
  let p = brokenNpcs((d) => { delete d.find((n) => n.id === 'wizard').dialogue.hasKeystone; });
  check(p.some((x) => /wizard has no `dialogue.hasKeystone`/.test(x)), 'a dropped dialogue state on one npc is caught', p.join('; ') || 'said nothing');
  p = brokenNpcs((d) => { d.find((n) => n.id === 'scholar').dialogue.default.pop(); });
  check(p.some((x) => /riddle opens after scholar\/default but those lines never pose it/.test(x)), 'the Scholar losing his {RIDDLE} line is caught', p.join('; ') || 'said nothing');
  p = brokenNpcs((d) => { d.find((n) => n.id === 'guard').dialogue.default.push('{RIDDLE}'); });
  check(p.some((x) => /guard\/default poses \{RIDDLE\} but no stage/.test(x)), 'a second npc posing the riddle with nothing opening it is caught', p.join('; ') || 'said nothing');
  p = brokenNpcs((d) => { d[0].dialogue.default.push('{PROPHECY}'); });
  check(p.some((x) => /token \{PROPHECY\} is not in quest.tokens/.test(x)), 'an unknown token is caught', p.join('; ') || 'said nothing');
}

/* ------------------------------------------------------ 3: the graph runs --- */
if (validateQuest(quest, QuestManager.actions).length) {
  // Parts 3 to 5 construct the graph, which throws on an invalid one; the
  // problems are already printed above, so stop here with a summary rather
  // than a stack trace.
  console.log(`\n${failures} failure(s) — quest.json is invalid, parts 3 to 5 not run`);
  process.exit(1);
}
console.log('the graph');
{
  const g = new QuestGraph(quest, QuestManager.actions);
  const begin = g.begin();
  check(g.stage === quest.start && begin.some((e) => e.type === 'objective' && e.text === quest.stages[quest.start].objective), 'begin() lands on the start stage with its objective');

  // From every stage, every event the graph knows plus one it does not: the
  // result is always a stage, and effects only ever name known actions.
  const events = [...g.events(), 'talked:wizard', 'riddle:wrong', 'nonsense'];
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

  const terminal = Object.keys(quest.stages).find((id) => quest.stages[id].terminal);
  g.stage = terminal;
  const after = events.map((ev) => g.dispatch(ev));
  check(g.stage === terminal && after.every((e) => e.length === 0), 'the terminal stage ignores every event');

  // Happy path, event by event, and what each step hands back.
  g.begin();
  const e1 = g.dispatch('talked:scholar');
  check(g.stage === quest.start && same(e1, [{ type: 'action', name: 'openRiddle' }]), 'talked:scholar opens the riddle and stays put', JSON.stringify(e1));
  const e2 = g.dispatch('riddle:solved');
  check(g.stage !== quest.start && e2.some((e) => e.type === 'dialogueState') && !g.done, 'riddle:solved moves on and switches dialogue state');
  const e3 = g.dispatch('talked:guard');
  check(g.done && e3.some((e) => e.type === 'action' && e.name === 'openGate') && e3.some((e) => e.name === 'showVictory' && e.after >= 1000), 'talked:guard ends it: the gate opens and the victory screen is delayed', JSON.stringify(e3));
  const openIdx = e3.findIndex((e) => e.name === 'openGate'), winIdx = e3.findIndex((e) => e.name === 'showVictory');
  check(openIdx < winIdx, 'openGate is ordered before showVictory');

  // The riddle judge.
  const wrong1 = judgeAnswer(riddle, 'a door', 0);
  const wrong2 = judgeAnswer(riddle, 'the sky', wrong1.wrongCount);
  const wrong9 = judgeAnswer(riddle, 'a chicken', 8);
  check(!wrong1.ok && !wrong2.ok && wrong1.feedback !== wrong2.feedback, 'wrong answers escalate');
  check(!/Hint:/.test(wrong1.feedback) && /Hint:/.test(wrong2.feedback), 'the hint joins from the second wrong answer on');
  check(wrong9.feedback === `${riddle.wrongAnswerResponses.at(-1)} Hint: ${riddle.hint}`, 'past the last response it holds at the last');
  for (const a of ['Keyboard', '  the KEYBOARD ', 'a\tkeyboard']) check(judgeAnswer(riddle, a, 2).ok, `${JSON.stringify(a)} is accepted`);
  check(!judgeAnswer(riddle, 'keyboards', 0).ok && !judgeAnswer(riddle, '', 0).ok, 'near-misses and blanks are not');
  check(same(renderLines(['a', '{RIDDLE}', '{NOPE}'], quest.tokens), ['a', quest.tokens['{RIDDLE}'], '{NOPE}']), 'renderLines substitutes known tokens and leaves the rest');
}

/* ---------------------------------------------- 4: the manager, end to end --- */
console.log('the manager against stand-ins');
function rig() {
  const log = [];
  const ui = {
    objective: null, dialogue: null, riddleOpen: false, feedback: [], victory: null,
    setObjective(t) { this.objective = t; log.push(`objective:${t}`); },
    openDialogue(name, lines, onEnd) { this.dialogue = { name, lines, onEnd }; log.push(`dialogue:${name}`); },
    openRiddle(text, onSubmit, onClose) { this.riddleOpen = true; this.riddleText = text; this._submit = onSubmit; this._close = onClose; log.push('riddle:open'); },
    setRiddleFeedback(t) { this.feedback.push(t); },
    closeRiddle() { this.riddleOpen = false; log.push('riddle:close'); this._close?.(); },
    showVictory(onRestart) { this.victory = { onRestart }; log.push('victory'); },
    // the player finishes the open conversation
    endDialogue() { const d = this.dialogue; this.dialogue = null; d.onEnd(); },
    answer(a) { this._submit(a); },
  };
  const npcs = npcDefs.map((def) => ({
    id: def.id, name: def.name, def, talking: false, dialogueState: 'default',
    getDialogueLines() { return this.def.dialogue[this.dialogueState]; },
  }));
  const castle = { gateOpened: 0, openGate() { this.gateOpened++; log.push('gate'); } };
  const controls = { locks: 0, lock() { this.locks++; log.push('lock'); } };
  const timers = [];
  const restarts = { n: 0 };
  const qm = new QuestManager({
    quest, riddle, npcs, ui, castle, controlsRef: controls,
    schedule: (fn, ms) => timers.push({ fn, ms }),
    restart: () => { restarts.n++; },
  });
  const talk = (id) => { qm.handleInteract(npcs.find((n) => n.id === id)); return ui.dialogue; };
  return { qm, ui, npcs, castle, controls, timers, restarts, log, talk };
}
{
  const { qm, ui, npcs, castle, controls, timers, restarts, log, talk } = rig();
  check(ui.objective === quest.stages[quest.start].objective, 'construction sets the start objective on the tracker');
  check(npcs.every((n) => n.dialogueState === quest.stages[quest.start].dialogueState), 'and every npc is in the start dialogue state');
  check(!qm.victory && qm.stage === quest.start, 'victory is false at the start');

  // Talk to the Guard first: he refuses, nothing moves.
  const d0 = talk('guard');
  check(d0.name === 'Guard' && same(d0.lines, npcDefs.find((n) => n.id === 'guard').dialogue.default), 'the Guard opens with his default lines');
  check(npcs.find((n) => n.id === 'guard').talking, 'the npc is flagged talking while the box is open');
  ui.endDialogue();
  check(!npcs.find((n) => n.id === 'guard').talking && qm.stage === quest.start && castle.gateOpened === 0, 'ending it early changes nothing: no keystone, no gate');

  // The Scholar poses the riddle through his token line.
  const d1 = talk('scholar');
  const scholarLines = npcDefs.find((n) => n.id === 'scholar').dialogue.default;
  check(d1.lines.length === scholarLines.length && d1.lines.at(-1) === quest.tokens['{RIDDLE}'] && !d1.lines.includes('{RIDDLE}'), 'the {RIDDLE} token is rendered as its stage direction', JSON.stringify(d1.lines.at(-1)));
  check(!ui.riddleOpen, 'the riddle does not open until the conversation ends');
  ui.endDialogue();
  check(ui.riddleOpen && ui.riddleText === riddle.riddle, 'the riddle overlay opens with the riddle after the Scholar finishes');

  ui.answer('a door');
  ui.answer('the sky');
  check(ui.riddleOpen && ui.feedback.length === 2 && /Hint:/.test(ui.feedback[1]) && qm.stage === quest.start, 'two wrong answers: two feedbacks, a hint, still the first stage');
  ui.answer('Keyboard');
  check(!ui.riddleOpen && controls.locks === 1, 'the right answer closes the overlay and re-locks the pointer');
  check(qm.stage === 'present-keystone' && /Keystone/.test(ui.objective), 'and the objective moves to the Keystone', ui.objective);
  check(npcs.every((n) => n.dialogueState === 'hasKeystone'), 'every npc switched to hasKeystone');

  // Back to the Scholar: his hasKeystone lines, and no second riddle.
  const d2 = talk('scholar');
  check(same(d2.lines, npcDefs.find((n) => n.id === 'scholar').dialogue.hasKeystone), 'the Scholar now gives his hasKeystone lines');
  ui.endDialogue();
  check(!ui.riddleOpen && qm.stage === 'present-keystone', 'talking to him again does not reopen the riddle');

  // The Guard opens the gate; the victory screen waits on the timer.
  const d3 = talk('guard');
  check(same(d3.lines, npcDefs.find((n) => n.id === 'guard').dialogue.hasKeystone), 'the Guard gives his hasKeystone lines');
  ui.endDialogue();
  check(castle.gateOpened === 1 && qm.victory && /gate is open/i.test(ui.objective), 'finishing with the Guard opens the gate and sets victory', ui.objective);
  check(npcs.every((n) => n.dialogueState === 'afterVictory'), 'every npc switched to afterVictory');
  check(ui.victory === null && timers.length === 1 && timers[0].ms === 2600, 'the victory screen is scheduled 2600 ms out, not shown yet', JSON.stringify(timers.map((t) => t.ms)));
  timers[0].fn();
  check(ui.victory !== null, 'and appears when the timer fires');
  ui.victory.onRestart();
  check(restarts.n === 1, 'its button calls the injected restart');

  // After the end: chatting is free, nothing repeats.
  talk('guard'); ui.endDialogue();
  talk('scholar'); ui.endDialogue();
  check(castle.gateOpened === 1 && timers.length === 1 && !ui.riddleOpen && qm.stage === 'gate-open', 'after victory the gate opens once, the timer is set once, the riddle stays shut');

  const order = log.filter((l) => ['riddle:open', 'riddle:close', 'gate', 'victory'].includes(l));
  check(same(order, ['riddle:open', 'riddle:close', 'gate', 'victory']), 'the whole run, in order: riddle opens, closes, gate, victory', order.join(' > '));
}
{
  // The other shortcut: the riddle answered right straight away, then the Guard.
  const { qm, ui, castle, talk } = rig();
  talk('scholar'); ui.endDialogue(); ui.answer('the keyboard');
  talk('guard'); ui.endDialogue();
  check(qm.victory && castle.gateOpened === 1, 'a first-try answer reaches the gate too');
}
{
  // A quest.json the manager cannot run fails at construction, not on the walk.
  const bad = JSON.parse(JSON.stringify(quest));
  bad.stages['gate-open'].enter = ['openPortcullis'];
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
  // play-castle.mjs reads these two by regex and is not in CI; hold the data to what it expects.
  check(/Keystone/.test(quest.stages['present-keystone']?.objective ?? ''), 'the keystone objective still says Keystone (play-castle.mjs matches /Keystone/)');
  const terminal = Object.values(quest.stages).find((s) => s.terminal);
  check(/gate is open/i.test(terminal?.objective ?? ''), 'the terminal objective still says the gate is open (play-castle.mjs matches /gate is open/i)');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
