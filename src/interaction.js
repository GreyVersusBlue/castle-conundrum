// interaction.js — finds the NPC the player can talk to (proximity + facing +
// line of sight), shows the "Press E" prompt, and routes E/click into the
// dialogue system.

import * as THREE from 'three';

const INTERACT_RANGE = 3.2;
const FACING_DOT = 0.35; // must be at least vaguely looking at them

// Two sample heights on the NPC's body; occlusion has to block BOTH. One ray is
// not enough — an NPC standing behind a hall table loses its low ray while being
// perfectly visible from the chest up. A wall blocks both, which is the case that
// matters.
const SIGHT_HEIGHTS = [1.55, 1.15];
// Stop the ray just short of the body. This has to stay SMALL. The NPC's own mesh
// is already excluded from the occluder list, so the margin's only job is to keep
// a surface flush against them from counting — and the bug being guarded against
// is a body 0.16 m inside a wall, so anything above about 0.1 m here reaches its
// `far` before it reaches the wall and reports a clear view through solid stone.
// A first attempt at 0.35 did exactly that and looked like it worked.
const SIGHT_MARGIN = 0.05;

const _target = new THREE.Vector3();
const _dir = new THREE.Vector3();

export class InteractionSystem {
  /**
   * @param scene THREE.Scene — occluder geometry for the line-of-sight test.
   *   Omit it and sight is trivially always clear, i.e. proximity + facing only,
   *   exactly as this behaved before the check existed.
   */
  constructor(camera, npcs, ui, scene = null) {
    this.camera = camera;
    this.npcs = npcs;
    this.ui = ui;
    this.scene = scene;
    this.currentTarget = null;
    this.onInteract = null; // set by quest-manager: (npc) => void

    // Everything in the scene except the NPCs themselves. Rebuilt only when the
    // child count changes, which is once at build time and again when the gate
    // door detaches.
    this._sightRay = new THREE.Raycaster();
    this._occluders = null;
    this._occluderCount = -1;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') this.tryInteract();
    });
    document.addEventListener('click', () => {
      // click advances dialogue only when a dialogue is open (pointer lock swallows other clicks)
      if (this.ui.isDialogueOpen()) this.tryInteract();
    });
  }

  tryInteract() {
    if (this.ui.isRiddleOpen()) return; // riddle overlay owns input
    if (this.ui.isDialogueOpen()) {
      this.ui.advanceDialogue();
      return;
    }
    if (this.currentTarget && this.onInteract) {
      this.onInteract(this.currentTarget);
    }
  }

  update() {
    if (this.ui.isDialogueOpen() || this.ui.isRiddleOpen()) {
      this.ui.setInteractPrompt(false);
      return;
    }

    const camPos = this.camera.position;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    let best = null;
    let bestDist = INTERACT_RANGE;
    for (const npc of this.npcs) {
      const to = new THREE.Vector3().subVectors(npc.group.position, camPos);
      to.y = 0;
      const dist = to.length();
      if (dist > bestDist) continue;
      to.normalize();
      if (to.dot(camDir) < FACING_DOT) continue;
      if (!this.hasLineOfSight(camPos, npc)) continue;
      best = npc;
      bestDist = dist;
    }

    this.currentTarget = best;
    this.ui.setInteractPrompt(!!best, best ? `Press E to talk to the ${best.name}` : '');
  }

  /** Scene contents minus the NPC bodies, cached until the child count changes. */
  occluders() {
    const kids = this.scene.children;
    if (this._occluderCount === kids.length) return this._occluders;
    const bodies = new Set(this.npcs.map((n) => n.group));
    this._occluders = kids.filter((c) => !bodies.has(c) && c.visible && !c.isLight);
    this._occluderCount = kids.length;
    return this._occluders;
  }

  /**
   * Is there actually a body to talk to, or is it sealed inside the scenery?
   *
   * Proximity and facing alone are not enough. Session 5 shipped the Guard at
   * z = 10.2 with the gatehouse's inner face at z ≈ 10.04, so he stood 16 cm
   * *inside* a wall — and because nothing tested sight, "Press E to talk to the
   * Guard" appeared on blank stone and the whole quest completed normally. Three
   * sessions of capsule placeholders never showed it. The position is fixed, but
   * the class of bug belongs here, not in a test that guards one coordinate.
   *
   * RAYS GO AGAINST THE MESH TREE, NOT `castle.colliders`. Testing colliders looks
   * much cheaper and is the obvious first attempt, but it cannot work here: the
   * gatehouse the Guard was buried in is placed with `"noCollide": true` (so the
   * player can walk through the archway), so it is not in the collider list at
   * all, and a collider-based test reports a clear view straight through solid
   * stone. Verified the hard way — reinstating the old position with that version
   * in place still produced the prompt.
   *
   * Cost is fine because this runs LAST, after the range and facing tests have
   * already rejected everyone. Most frames raycast nothing; standing next to
   * someone costs two rays against ~150 top-level objects.
   */
  hasLineOfSight(camPos, npc) {
    if (!this.scene) return true;
    const occluders = this.occluders();

    for (const h of SIGHT_HEIGHTS) {
      _target.set(npc.group.position.x, h, npc.group.position.z);
      const dist = _dir.subVectors(_target, camPos).length();
      if (dist <= SIGHT_MARGIN) return true;

      this._sightRay.set(camPos, _dir.normalize());
      this._sightRay.near = 0.05;
      this._sightRay.far = dist - SIGHT_MARGIN;
      if (this._sightRay.intersectObjects(occluders, true).length === 0) return true;
    }
    return false;
  }
}
