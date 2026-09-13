// main.js — entry point. Loads data files, builds the world, wires systems, runs the loop.

import * as THREE from 'three';
import { loadJSON, loadingManager } from './assets.js';
import { createScene, createBrazier } from './scene-setup.js';
import { CastleBuilder } from './castle-builder.js';
import { PlayerController } from './player-controller.js';
import { NPC } from './npc.js';
import { InteractionSystem } from './interaction.js';
import { QuestManager } from './quest-manager.js';
import { UI } from './ui.js';

const ui = new UI();

loadingManager.onProgress = (_url, loaded, total) => ui.setLoadingProgress(loaded, total);

async function init() {
  // --- Data ---
  const [config, npcData, riddleData] = await Promise.all([
    loadJSON('data/scene-config.json'),
    loadJSON('data/npcs.json'),
    loadJSON('data/riddle.json'),
  ]);

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

  // --- Interaction + quest ---
  const interaction = new InteractionSystem(camera, npcs, ui, scene);
  const quest = new QuestManager(riddleData, npcs, ui, castle, { lock: () => player.lock() });
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
