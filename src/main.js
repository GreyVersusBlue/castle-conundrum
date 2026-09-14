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
  const { scene, renderer, camera } = createScene(config);

  // --- World geometry ---
  const castle = new CastleBuilder(scene, config);
  await castle.build();

  // --- Braziers (flicker lights) ---
  const brazierUpdates = config.braziers.map((b) =>
    createBrazier(castle, castle.tileToWorld(b.tile[0], b.tile[1]))
  );

  // --- NPCs ---
  const npcs = npcData.npcs.map((def) => new NPC(def, scene, config.polyhavenBase));
  await Promise.all(npcs.map((n) => n.build()));

  // --- Player ---
  const player = new PlayerController(camera, renderer.domElement, () => castle.colliders);
  if (state.player) {
    camera.position.set(state.player.x, state.player.y, state.player.z);
    camera.rotation.set(0, state.player.yaw, 0, 'YXZ');
  }

  // --- Interaction + quest ---
  const interaction = new InteractionSystem(camera, npcs, ui, scene);
  const auto = slot.autosave(() => {
    state.player = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: camera.rotation.y };
    return state;
  });
  const quest = new QuestManager({
    quest: questData, riddle: riddleData, npcs, ui, castle,
    controlsRef: { lock: () => player.lock() },
    saved,
    onChange: ({ stage, riddleWrong }) => { state.stage = stage; state.riddleWrong = riddleWrong; auto.mark(); },
    // The victory screen's button: erase the save, then reload into a fresh quest.
    restart: () => { auto.stop(); slot.reset(); window.location.reload(); },
  });
  window.__save = { slot, state }; // read by play-castle.mjs's reload beat
  window.__quest = quest; // the one game-side hook play-castle.mjs reads; __cam and __scene come from its scene probe
  interaction.onInteract = (npc) => {
    npc.facePlayer(camera.position);
    quest.handleInteract(npc);
  };

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
