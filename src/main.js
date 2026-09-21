// main.js — entry point. Loads data files, builds the world, wires systems, runs the loop.

import * as THREE from 'three';
import { loadJSON, loadingManager } from './assets.js';
import { createScene, createBrazier } from './scene-setup.js';
import { CastleBuilder } from './castle-builder.js';
import { PlayerController } from './player-controller.js';
import { NPC } from './npc.js';
import { InteractionSystem } from './interaction.js';
import { QuestManager } from './quest-manager.js';
import { validateQuestSet } from './quest-graph.js';
import { createCastleSlot } from './save.js';
import { createMystery } from './mystery.js';
import { castleNav } from './stations.js';
import { Populace, populaceDefs, validatePopulace } from './populace.js';
import { EYE_HEIGHT } from './castle-plan.js';
import { UI } from './ui.js';
import { createAudio } from './audio.js';
import { createTouchControls, isTouchLikely } from './touch-controls.js';
import { PlayerRig, skinColour } from './player-rig.js';

const ui = new UI();

loadingManager.onProgress = (_url, loaded, total) => ui.setLoadingProgress(loaded, total);

async function init() {
  // --- Data ---
  const [config, npcData, riddleData, questData, mysteryData, soundData, documentsData, questIndex, populaceData] = await Promise.all([
    loadJSON('data/scene-config.json'),
    loadJSON('data/npcs.json'),
    loadJSON('data/riddle.json'),
    loadJSON('data/quest.json'),
    loadJSON('data/mystery.json'),
    loadJSON('data/sounds.json'),
    loadJSON('data/documents.json'),
    loadJSON('data/quests/index.json'),
    loadJSON('data/populace.json'),
  ]);

  // --- The side quests (BACKLOG.md rank 9). One file per quest under
  // data/quests/, named in that directory's index.json because a browser cannot
  // read a directory; test/quest.mjs holds the index to what is actually on
  // disk. `validateQuestSet` runs here and throws rather than warns, for the
  // reason QuestGraph's own constructor does (#393): a broken quest that loads
  // is a quest that fails on the walk to the cook, and a loading screen that
  // says why beats a castle that is subtly wrong.
  const sideQuestFiles = questIndex.quests ?? [];
  const sideQuests = await Promise.all(sideQuestFiles.map((f) => loadJSON(`data/quests/${f}`)));
  const sideProblems = validateQuestSet(
    sideQuestFiles.map((file, i) => ({ file, def: sideQuests[i] })),
    // `tokens` is rule 6's and nothing else's (#693): the frame's own token
    // keys, so the set validator can see that Sir Roger's `default` lines are
    // what pose `{ACCUSE}` and refuse an errand that would end on top of them.
    { npcs: npcData.cast, mystery: mysteryData, actions: QuestManager.sideActions, tokens: Object.keys(questData.tokens ?? {}), reputation: npcData.reputation },
  );
  if (sideProblems.length) throw new Error(`data/quests/ is not a valid quest set:\n  - ${sideProblems.join('\n  - ')}`);

  // --- The save (src/save.js, key castleConundrumSave_v1). One slot; a reload
  // resumes the quest at its saved stage, with the riddle's wrong-answer count,
  // the documents already read (#551, version 3), where each side quest stands
  // (version 4), the rooms stood in (version 5, the map) and the player's
  // position. `repair` has already dropped anything the data does not know,
  // so what comes back here is safe to hand to the graph. `rooms` is the
  // config's list because it is the list `makePlan` builds the rooms from: a
  // room cut from the config is cut from the castle and from the save together.
  // `reputation` (version 6, BACKLOG.md rank 8) rides on `sideQuests` too: the
  // ward and the terminal stages the two counters are clamped against come off
  // the same files, so a quest added to the directory raises its ward's ceiling
  // on the next load and nothing is written down twice.
  const slot = createCastleSlot({ mystery: mysteryData, quest: questData, documents: documentsData.documents, sideQuests, rooms: config.rooms });
  const saved = slot.load();
  const state = saved ?? slot.fresh();

  // --- Scene ---
  // Whether this is a thumb or a mouse is decided once, before the renderer is
  // made, because two render numbers come down with the answer (#530). The
  // start panel's toggle can change the input scheme afterwards; it does not
  // change those two, and the comment in scene-setup.js says so.
  let touchMode = isTouchLikely();
  const { scene, renderer, camera, setWatch, audioListener } = createScene(config, { touch: touchMode });

  // --- Sound ---
  // All synthesised out of data/sounds.json: a footstep per surface class, the
  // chapel bell (#519), and a room tone per place, cross-faded in the loop
  // below. The context is suspended until the start button resumes it, which
  // is the gesture a browser wants.
  const audio = createAudio(audioListener, soundData);
  window.__audio = audio; // test/map.mjs reads which bed is up

  // --- World geometry ---
  const castle = new CastleBuilder(scene, config);
  await castle.build();
  // Every room with a bed becomes a source the bed sounds from, off the plan's
  // own bounds (#680); test/map.mjs section 2b is what says this line is here.
  audio.placeBeds(castle.plan);
  // A door's latch and swing (#696): the builder says when a leaf changes
  // state, from where, and the audio plays it there. Wired before the save is
  // resumed below, so an `instant` open on load is logged as one the
  // suspended context did not play, rather than never reported.
  castle.onLeaf = (ev) => audio.cue(ev.cue, ev);

  // --- Braziers (flicker lights) ---
  const brazierUpdates = config.braziers.map((b) =>
    createBrazier(castle, castle.tileToWorld(b.tile[0], b.tile[1]))
  );

  // --- The mystery, and the day it happens on ---
  // The engine owns the watch; the nav owns where everyone stands at each of
  // them. Both read the same `state` the save carries, so a reload comes back
  // to the right bell with the cast already at that bell's stations.
  const engine = createMystery({ mystery: mysteryData, npcs: npcData.cast, state });
  const nav = castleNav(castle.plan, mysteryData);

  // --- NPCs ---
  // The twelve of v2, from `cast` (#419: three bodies and a tint each). Nothing
  // here knows any of the twelve by name, which is what lets the schedule be
  // data.
  const npcs = npcData.cast.map((def) => new NPC(def, scene, config.polyhavenBase));
  await Promise.all(npcs.map((n) => n.build()));
  /* WHERE SOMEBODY STANDS IS THE ENGINE'S ANSWER AND WHERE THAT IS IS THE NAV'S
   * (#533). The nav knows the world point of every station at every watch, the
   * morning after's included, and it knows nothing about verdicts. The engine
   * knows that the man who hangs has no station on the second day whatever the
   * schedule says. So the engine is asked first and the nav second, and a null
   * from either is a body that is not in the castle. */
  const placeOf = (npcId, watch) => (engine.stationOf(npcId, watch) ? nav.at(npcId, watch) : null);
  const stand = (npc, watch) => {
    const at = placeOf(npc.id, watch);
    if (!at) { npc.group.visible = false; return; }
    npc.group.visible = true;
    npc.placeAt({ x: at.x, y: at.h ?? 0, z: at.z });
  };
  for (const npc of npcs) stand(npc, engine.watch);

  /* --- the household (BACKLOG.md rank 6) ---
   * Ten more bodies off the same three models, with no dialogue, no clue and
   * no press. `validatePopulace` throws rather than warns, for the reason the
   * side-quest set above throws (#393): a routine with a stop nobody can
   * stand on is a body standing inside a wall or a body that teleports, and
   * a loading screen that says which stop beats a castle that is subtly
   * wrong. It runs against the same `nav` the twelve's schedule is checked
   * with in Node, so the page and test/mystery.mjs ask the same question.
   *
   * THE POPULACE IS NOT THE CAST AND `window.__cast` STAYS THE THIRTEEN.
   * test/plan-vs-scene.mjs counts that list and names the two who are hidden
   * at Prime by id; folding ten more into it would have made that assertion
   * about a different thing without changing a line of it (#147). */
  const populaceProblems = validatePopulace(populaceData, { nav, mystery: mysteryData, cast: npcData.cast });
  if (populaceProblems.length) throw new Error(`data/populace.json does not fit the castle:\n  - ${populaceProblems.join('\n  - ')}`);
  const folk = populaceDefs(populaceData).map((def) => new NPC(def, scene, config.polyhavenBase));
  await Promise.all(folk.map((n) => n.build()));
  // The hound's bark (#696): the populace says when a follow body is near,
  // and data/sounds.json's cadence says when that is a bark.
  // And two of them talking where the player can hear (#732): the pair goes
  // to the manager's caption band, which is declared below and is only
  // called once the loop is running.
  const populace = new Populace({
    people: populaceData.people, npcs: folk, nav, cue: (name, ev) => audio.cue(name, ev),
    pairs: populaceData.talk, talk: (pair, names) => quest.overhear(pair, names), hush: (id) => quest.stopTalk(id),
  });
  populace.setWatch(engine.watch, { walk: false });

  // --- Player ---
  // castle.colliders is seeded from castle.plan.colliders and grows only by
  // scene-setup.js's brazier stands. Nothing here measures a box. The plan is
  // what the player stands on: a floor, a slab, the wall walk, a flight of
  // stairs, all through castle-plan.js's standAt.
  const player = new PlayerController(camera, renderer.domElement, () => castle.colliders, () => castle.plan, audio);
  // The thumb (#530). Built whichever scheme is showing, because the toggle can
  // turn it on after the page has loaded and a listener that was never attached
  // cannot be turned on; what the toggle changes is whether the controller
  // reads it and whether the HUD is on the screen.
  const touch = createTouchControls({
    dom: renderer.domElement,
    aim: camera,
    onStick: (at) => ui.setStick(at),
  });
  if (state.player) {
    camera.position.set(state.player.x, state.player.y, state.player.z);
    camera.rotation.set(0, state.player.yaw, 0, 'YXZ');
  }
  // A saved y is where the eye was; the floor under it is what the feet resume
  // on. A save from before the player had a y is at 1.7 on the ground and
  // settles there.
  player.settle();
  window.__player = player; // read by test/plan-vs-scene.mjs's standing beat
  // WHO TAKES THE POINTER BACK (#660). ui.js lets pointer lock go for every
  // screen that covers the castle and asks for it back through this when the
  // last one goes away. It is a no-op on a phone, because `player.lock()` is
  // (#530), which is the whole reason it goes through the player rather than
  // calling `requestPointerLock` from the UI.
  // A REFUSED RELOCK IS NOT A DEAD END (#661). The browser rations pointer
  // lock and hands out four requests before it starts refusing, so the answer
  // has to be looked at: the panel the Esc path already uses is the way back,
  // and it is one click.
  ui.usePointer(async () => { if (!(await player.lock())) ui.showStartAgain(); });
  window.__ui = ui; // read by test/overlays.mjs, for the two panes no key opens

  /* --- the player's own body (BACKLOG.md rank 11) ---
   * A shadow on the ground under the feet and a hand that reaches for a door's
   * lock. Nothing else in that theme starts before this pair. The hand takes
   * its colour off a body the page has already built rather than a hex written
   * here, because the cast's skin is in a glTF and every body carries the same
   * one (#419). It reaches for whatever InteractionSystem is offering, which is
   * handed to it in the loop below.
   */
  const rig = new PlayerRig({ scene, camera, player, skin: skinColour(npcs) });
  rig.settle();
  window.__rig = rig; // read by test/plan-vs-scene.mjs's shadow-and-hand beat

  // --- Interaction + quest ---
  // The word-locked doors are targets too: the riddle is carved over the
  // muniment room's lock and pressing E at it is what opens the overlay.
  const locks = castle.locks();
  const bells = castle.bells();
  // The bell is a place, not a sound effect: the panner sits at the piece's own
  // centre so it is loud in the chapel and thin from the far ward. One bell in
  // the castle today; the first of them if there is ever a second.
  audio.bellAt(bells[0]?.focus);
  // The ten pieces of evidence, each with mystery.json's own `name` on its
  // prompt. The muniment room's leaf is not in this list: it is already a lock
  // target and carries the same evidence id, so one press of E reads the word
  // and asks it (Phase 7).
  const evidence = castle.evidence(Object.fromEntries(mysteryData.evidence.map((e) => [e.id, e.name])));
  // The six readable documents (#551): a `read` verb beside `examine`, on
  // props that never hide and are never taken.
  const readables = castle.readables(Object.fromEntries(documentsData.documents.map((d) => [d.id, d.title])));
  const interaction = new InteractionSystem(camera, [...npcs, ...folk, ...locks, ...bells, ...evidence, ...readables], ui, scene);
  const auto = slot.autosave(() => {
    state.player = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: camera.rotation.y };
    return state;
  });
  const quest = new QuestManager({
    quest: questData, sideQuests, mystery: mysteryData, riddle: riddleData, documents: documentsData.documents, npcs, ui, castle,
    engine,
    audio,
    // The world half of a bell: the sky and twelve people walking to where they
    // are due next. The engine has already moved the watch on; this puts the
    // castle where the watch says it is. `applyDay` calls it once more for
    // Lauds, with `walk: false`, which is how the morning after opens.
    onWatch: (watch, { walk = true } = {}) => {
      setWatch(watch);
      // What is on the ground at this bell is the manager's: it owns `taken`,
      // and a thing taken does not come back at the next one. What is left here
      // is the sky and twelve people walking.
      for (const npc of npcs) {
        const to = placeOf(npc.id, watch);
        if (!to) { npc.group.visible = false; continue; }
        const from = npc.group.visible ? { x: npc.group.position.x, z: npc.group.position.z, level: to.level } : null;
        npc.group.visible = true;
        const route = walk && from ? nav.route(from, to) : null;
        if (route) npc.walkTo(route);
        else npc.placeAt({ x: to.x, y: to.h ?? 0, z: to.z });
      }
      populace.setWatch(watch, { walk });
      state.watch = engine.state.watch;
      state.day = engine.day;
      auto.mark();
    },
    saved,
    // The forty rooms, for the journal's map. The nav's list rather than the
    // plan's, so the name on the map is the name the HUD's room line shows.
    rooms: nav.rooms(),
    // The two set pieces (#592): the chaplain's sermon and a song, played as a
    // caption band to whoever is standing in the room at the bell. The manager
    // hears about the room from `handleEnter` below, which the loop already
    // calls off the same answer the HUD's room line is written from (#588).
    performances: npcData.performances,
    // The two ward counters' lines, and the one the epilogue pane carries.
    reputation: npcData.reputation,
    onChange: ({ stage, riddleWrong, day, quests, reputation }) => { state.stage = stage; state.riddleWrong = riddleWrong; state.day = day; state.quests = quests; state.reputation = reputation; auto.mark(); },
    // What the epilogue's button does when it reads "Play Again" — at the end
    // of the second day, or at the end of a verdict with no morning after it
    // (#537). Erase the save, then reload into a fresh day.
    restart: () => { auto.stop(); slot.reset(); window.location.reload(); },
  });
  window.__save = { slot, state }; // read by play-castle.mjs's reload beat
  window.__quest = quest; // the one game-side hook play-castle.mjs reads; __cam and __scene come from its scene probe
  // The builder, for the one thing only a live castle can answer: whether a
  // day-two change to a piece really takes its collider with it (#539).
  // test/plan-vs-scene.mjs calls `applyDay` on it and puts it back.
  window.__castle = castle;
  // The cast and the day, for the two suites that drive the real page:
  // play-castle.mjs looks up where somebody is due rather than carrying a
  // coordinate of its own, and test/plan-vs-scene.mjs reads the twelve bodies.
  window.__cast = npcs;
  // The ten, separately, so the thirteen stay thirteen wherever they are counted.
  window.__folk = folk;
  // And the thing that turns their rings, for the one beat that steps a walk
  // with a dt it supplies rather than one it measures (#616).
  window.__populace = populace;
  window.__mystery = engine;
  // The ten examinables, with the world point each prompt is aimed at.
  // play-castle.mjs walks to them rather than carrying ten coordinates of its
  // own, the same way it stopped carrying SCHOLAR and GUARD in Phase 6.
  window.__evidence = evidence;
  window.__readables = readables;
  interaction.onInteract = (target) => {
    if (target.isLock) { quest.handleLock(target.id, target.evidence); return; }
    if (target.isBell) { quest.handleBell(); return; }
    if (target.isEvidence) { quest.handleExamine(target.id); return; }
    if (target.isReadable) { quest.handleRead(target.id); return; }
    // The household has nothing to say and no clue to give: their prompt is a
    // label, and E at a label does nothing at all rather than opening an empty
    // dialogue box (BACKLOG.md rank 6).
    if (target.label) return;
    target.facePlayer(camera.position);
    quest.handleInteract(target);
  };
  interaction.onJournal = () => quest.handleJournal();
  // One button that means talk, examine or ring, and one that is J. Both go
  // through InteractionSystem's own methods, so the touch scheme adds no second
  // path into the quest (#530).
  ui.onTouchButtons({
    interact: () => interaction.tryInteract(),
    journal: () => interaction.tryJournal(),
  });
  const applyTouch = (on) => {
    touchMode = on;
    player.useTouch(on ? touch : null);
    if (!on) touch.release();
    ui.setTouch(on);
  };
  ui.onTouchToggle(applyTouch);
  applyTouch(touchMode);
  // The castle opens on the watch the save is at, without anybody walking there.
  quest.applyWatch(engine.watch, { walk: false });
  // A save with the word already answered comes back to an open muniment room.
  // `openLock` is on a transition in the frame, not on a stage's `enter`, so a
  // resume has to say so here or the ledger sits behind a shut leaf the riddle
  // will never be offered for again.
  for (const id of state.locks) castle.openLock(id, { instant: true });

  // --- UI flow ---
  ui.hideLoading();
  ui.showStart(async () => {
    // The click is the gesture the AudioContext has been waiting for.
    audio.resume();
    player.enabled = true;
    // And the panel comes straight back if the pointer did not (#661). The
    // button hides the panel before this runs, so a refused lock without this
    // line is a castle with nothing on screen and no way into it.
    if (!(await player.lock())) ui.showStartAgain();
  });
  // if the player Escs out of pointer lock (outside overlays), offer re-entry.
  // There is no pointer lock to lose on a phone, so there is nothing to offer:
  // an unlock event on a touch device would put the start panel back over a
  // castle the player is standing in (#530).
  player.controls.addEventListener('unlock', () => {
    if (touchMode) return;
    // `judged` and not `victory` (#537): between the epilogue's button and the
    // inspector the graph is not in a terminal stage and the player is walking
    // the castle at Lauds, which is a moment that wants the panel back.
    if (!ui.isOverlayOpen() && !ui.isDialogueOpen() && !(quest.victory || (quest.judged && quest.day === 1))) {
      ui.showStartAgain();
    }
  });

  /* --- the placement editor, dev only (BACKLOG.md rank 13) ---
   * `import.meta.env.DEV` is a literal `false` in a build, so Vite drops this
   * whole branch and src/edit-mode.js never enters the production module graph
   * — not lazily, not at all. The `?edit=1` check is inside the branch rather
   * than beside it so that the query string alone can never pull it in from a
   * built page. test/built.mjs greps the bundle for the module's sentinel,
   * because the question is what got SERVED and not what got asked for (#501).
   */
  let editor = null;
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('edit') === '1') {
    const { mountEditor } = await import('./edit-mode.js');
    editor = mountEditor({ scene, THREE, camera, nav, config, eyeHeight: EYE_HEIGHT });
  }

  // --- Loop ---
  const clock = new THREE.Clock();
  let roomShown = null;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    player.update(dt);
    castle.update(dt);
    // The HUD's room line: asked every frame, written only when the answer
    // changes (#515). Forty rooms is nothing; a DOM write a frame is not.
    // THE SAME CHANGE IS WHAT ENTERS A ROOM (#588). Until rank 10's map this
    // loop asked a second question of the one room that is itself a clue —
    // mystery.json's kind `L`, the cross-wall walk — through `inRoom`, which
    // is the same test `roomAt` settles for every room. One answer, two
    // consumers: the HUD line, and the engine, which grants `walk-crosses` on
    // the walk and puts every room on the map's visited set. Open ground is
    // not a room and is not handed over: `repair` would drop it from the save
    // on the next load, and a set the game writes knowing that is not a set.
    {
      const here = nav.roomAt(camera.position.x, camera.position.z, camera.position.y - EYE_HEIGHT);
      if (here.id !== roomShown) {
        roomShown = here.id;
        ui.setRoom(here.name, here.open ? null : here.id);
        // And the third consumer: the room tone cross-fades on the same change.
        audio.enter(here);
        if (!here.open) quest.handleEnter(here.id, here.level);
      }
    }
    // And where the head is, every frame: which beds are within earshot and
    // the point each is heard from (#680). After `enter`, so a room change
    // and the room's own bed land in the same frame.
    audio.at(camera.position);
    if (player.isLocked && player.moving) auto.mark(); // walking: the position is dirty
    for (const npc of npcs) npc.update(dt, camera.position);
    for (const one of folk) one.update(dt, camera.position);
    populace.update(dt, camera.position);
    interaction.update();
    // AFTER interaction.update(), never before: the hand reaches for the target
    // the prompt is offering, and that target is decided one line up.
    rig.update(dt, interaction.currentTarget);
    editor?.update();
    for (const fn of brazierUpdates) fn(t);

    renderer.render(scene, camera);
  });
}

init().catch((err) => {
  console.error('[Castle Conundrum] FATAL INIT ERROR:', err);
  const status = document.getElementById('loading-status');
  if (status) status.textContent = 'Something broke while loading — check the console.';
});
