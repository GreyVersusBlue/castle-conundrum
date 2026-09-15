// main.js — entry point. Loads data files, builds the world, wires systems, runs the loop.

import * as THREE from 'three';
import { loadJSON, loadingManager } from './assets.js';
import { createScene, createBrazier } from './scene-setup.js';
import { CastleBuilder } from './castle-builder.js';
import { PlayerController } from './player-controller.js';
import { NPC } from './npc.js';
import { InteractionSystem } from './interaction.js';
import { QuestManager } from './quest-manager.js';
import { createCastleSlot } from './save.js';
import { createMystery } from './mystery.js';
import { castleNav } from './stations.js';
import { UI } from './ui.js';

const ui = new UI();

loadingManager.onProgress = (_url, loaded, total) => ui.setLoadingProgress(loaded, total);

async function init() {
  // --- Data ---
  const [config, npcData, riddleData, questData, mysteryData] = await Promise.all([
    loadJSON('data/scene-config.json'),
    loadJSON('data/npcs.json'),
    loadJSON('data/riddle.json'),
    loadJSON('data/quest.json'),
    loadJSON('data/mystery.json'),
  ]);

  // --- The save (src/save.js, key castleConundrumSave_v1). One slot; a reload
  // resumes the quest at its saved stage, with the riddle's wrong-answer count
  // and the player's position. `repair` has already dropped anything the data
  // does not know, so what comes back here is safe to hand to the graph.
  const slot = createCastleSlot({ mystery: mysteryData, quest: questData });
  const saved = slot.load();
  const state = saved ?? slot.fresh();

  // --- Scene ---
  const { scene, renderer, camera, setWatch } = createScene(config);

  // --- World geometry ---
  const castle = new CastleBuilder(scene, config);
  await castle.build();

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
  // The twelve of v2, from `cast` (#419: three bodies and a tint each). The
  // Guard, the Scholar and the Wizard are gone with this phase; nothing here
  // knows any of the twelve by name either, which is what lets the schedule be
  // data.
  const npcs = npcData.cast.map((def) => new NPC(def, scene, config.polyhavenBase));
  await Promise.all(npcs.map((n) => n.build()));
  const stand = (npc, watch) => {
    const at = nav.at(npc.id, watch);
    if (!at) { npc.group.visible = false; return; }
    npc.group.visible = true;
    npc.placeAt({ x: at.x, y: at.h ?? 0, z: at.z });
  };
  for (const npc of npcs) stand(npc, engine.watch);

  // --- Player ---
  // castle.colliders is seeded from castle.plan.colliders and grows only by
  // scene-setup.js's brazier stands. Nothing here measures a box. The plan is
  // what the player stands on: a floor, a slab, the wall walk, a flight of
  // stairs, all through castle-plan.js's standAt.
  const player = new PlayerController(camera, renderer.domElement, () => castle.colliders, () => castle.plan);
  if (state.player) {
    camera.position.set(state.player.x, state.player.y, state.player.z);
    camera.rotation.set(0, state.player.yaw, 0, 'YXZ');
  }
  // A saved y is where the eye was; the floor under it is what the feet resume
  // on. A save from before the player had a y is at 1.7 on the ground and
  // settles there.
  player.settle();
  window.__player = player; // read by test/plan-vs-scene.mjs's standing beat

  // --- Interaction + quest ---
  // The word-locked doors are targets too: the riddle is carved over the
  // muniment room's lock and pressing E at it is what opens the overlay.
  const locks = castle.locks();
  const bells = castle.bells();
  const interaction = new InteractionSystem(camera, [...npcs, ...locks, ...bells], ui, scene);
  const auto = slot.autosave(() => {
    state.player = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: camera.rotation.y };
    return state;
  });
  const quest = new QuestManager({
    quest: questData, riddle: riddleData, npcs, ui, castle,
    controlsRef: { lock: () => player.lock() },
    engine,
    // The world half of a bell: the sky, the evidence that comes and goes, and
    // twelve people walking to where they are due next. The engine has already
    // moved the watch on; this puts the castle where the watch says it is.
    onWatch: (watch, { walk = true } = {}) => {
      setWatch(watch);
      for (const e of mysteryData.evidence) castle.setEvidenceVisible(e.id, (e.watches || []).includes(watch));
      for (const npc of npcs) {
        const to = nav.at(npc.id, watch);
        if (!to) { npc.group.visible = false; continue; }
        const from = npc.group.visible ? { x: npc.group.position.x, z: npc.group.position.z, level: to.level } : null;
        npc.group.visible = true;
        const route = walk && from ? nav.route(from, to) : null;
        if (route) npc.walkTo(route);
        else npc.placeAt({ x: to.x, y: to.h ?? 0, z: to.z });
      }
      state.watch = engine.state.watch;
      auto.mark();
    },
    saved,
    onChange: ({ stage, riddleWrong }) => { state.stage = stage; state.riddleWrong = riddleWrong; auto.mark(); },
    // The victory screen's button: erase the save, then reload into a fresh quest.
    restart: () => { auto.stop(); slot.reset(); window.location.reload(); },
  });
  window.__save = { slot, state }; // read by play-castle.mjs's reload beat
  window.__quest = quest; // the one game-side hook play-castle.mjs reads; __cam and __scene come from its scene probe
  // The cast and the day, for the two suites that drive the real page:
  // play-castle.mjs looks up where somebody is due rather than carrying a
  // coordinate of its own, and test/plan-vs-scene.mjs reads the twelve bodies.
  window.__cast = npcs;
  window.__mystery = engine;
  interaction.onInteract = (target) => {
    if (target.isLock) { quest.handleLock(target.id); return; }
    if (target.isBell) { quest.handleBell(); return; }
    target.facePlayer(camera.position);
    quest.handleInteract(target);
  };
  // The castle opens on the watch the save is at, without anybody walking there.
  quest.applyWatch(engine.watch, { walk: false });

  // --- UI flow ---
  ui.hideLoading();
  ui.showStart(() => {
    player.enabled = true;
    player.lock();
  });
  // if the player Escs out of pointer lock (outside overlays), offer re-entry
  player.controls.addEventListener('unlock', () => {
    if (!ui.isRiddleOpen() && !ui.isDialogueOpen() && !quest.victory) {
      ui.showStartAgain();
    }
  });

  // --- Loop ---
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    player.update(dt);
    castle.update(dt);
    if (player.isLocked && (player.keys.size > 0)) auto.mark(); // walking: the position is dirty
    for (const npc of npcs) npc.update(dt, camera.position);
    interaction.update();
    for (const fn of brazierUpdates) fn(t);

    renderer.render(scene, camera);
  });
}

init().catch((err) => {
  console.error('[Castle Conundrum] FATAL INIT ERROR:', err);
  const status = document.getElementById('loading-status');
  if (status) status.textContent = 'Something broke while loading — check the console.';
});
