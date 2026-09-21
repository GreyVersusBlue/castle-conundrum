// interaction.js — finds the thing the player can press E at (proximity +
// facing + line of sight), shows the prompt, and routes E/click into the quest.
//
// A TARGET IS NOT ALWAYS AN NPC. Phase 4 put the riddle on the muniment room's
// word-lock, so a door is a target too; Phase 6 added the chapel bell and Phase 7
// the ten pieces of evidence. A target is anything with a `group` (the
// Object3D it is, which is left out of the occluder list so the ray can reach
// it), a `name`, optionally a `prompt` to show instead of "talk to", optionally
// a `focus` world point to aim at when the group's own origin is somewhere else
// — a gate leaf hangs off a hinge at its edge — and optionally an `active`
// getter, which is how an answered lock stops offering itself — and optionally
// `label`, which marks a target that is a name on the HUD and not something to
// press E at. The ten of the populace are the only ones (#617).

import * as THREE from 'three';

const INTERACT_RANGE = 3.2;
const FACING_DOT = 0.35; // must be at least vaguely looking at them
/* AND `AIM_DOT` IS WHAT "LOOKING AT IT" MEANS, as opposed to "it is in front of
 * me somewhere" (#722). 0.95 is 18.2 degrees off the crosshair. `FACING_DOT` is
 * 69.5 degrees, which is a whole quarter of the view to either side, and until
 * #722 it was a gate and nothing else: past it, the nearest thing won. Measured
 * over the four watches, the twelve's stations and every walkable cell 0.9 to
 * 2.8 m from a target, that rule offered what the player was aimed at 6667
 * times out of 12371, and 1282 of its misses were something more than 45
 * degrees off the aim. The number is flat either side of 0.95: 0.90 scores
 * 11411 and 0.98 scores 11707, against 11521 here. */
const AIM_DOT = 0.95;

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

/** Where a target is: its own `focus` point, or the origin of its group. */
const aimAt = (target) => target.focus || target.group.position;

export class InteractionSystem {
  /**
   * @param targets anything pressable: NPC instances and the doors from
   *   CastleBuilder.locks().
   * @param scene THREE.Scene — occluder geometry for the line-of-sight test.
   *   Omit it and sight is trivially always clear, i.e. proximity + facing only,
   *   exactly as this behaved before the check existed.
   */
  constructor(camera, targets, ui, scene = null) {
    this.camera = camera;
    this.targets = targets;
    this.ui = ui;
    this.scene = scene;
    this.currentTarget = null;
    this.onInteract = null; // set by main.js: (target) => void
    this.onJournal = null;  // set by main.js: () => void, the J key

    // Everything in the scene except the targets themselves. Rebuilt only when
    // the child count changes, which is once at build time and again when the
    // gate door detaches.
    this._sightRay = new THREE.Raycaster();
    this._occluders = null;
    this._occluderCount = -1;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') this.tryInteract();
      if (e.code === 'KeyJ') this.tryJournal();
    });
    document.addEventListener('click', (e) => {
      // A CLICK INSIDE THE TOUCH HUD IS THE HUD'S, NEVER THE GAME'S (#530).
      // The E button's own tap already calls `tryInteract`; without this line
      // the same tap would call it again from here, which with a dialogue open
      // steps two lines at once. What keeps a thumb on a STICK out of here is
      // a different guard, in src/touch-controls.js, which stops the browser
      // synthesising the click at all.
      if (e.target && e.target.closest && e.target.closest('#touch-hud')) return;
      // click advances dialogue only when a dialogue is open (pointer lock swallows other clicks)
      if (this.ui.isDialogueOpen()) this.tryInteract();
    });
  }

  tryInteract() {
    if (this.ui.isOverlayOpen()) return; // the riddle, the journal and the accusation own input
    if (this.ui.isDialogueOpen()) {
      this.ui.advanceDialogue();
      return;
    }
    if (this.currentTarget && this.onInteract) {
      this.onInteract(this.currentTarget);
    }
  }

  /**
   * J. A toggle, so the key that opened the journal closes it; the riddle and
   * the accusation own the screen while they are up, and the journal opened
   * from inside a conversation is closed by picking something or by its own
   * button, not by walking away from it.
   */
  tryJournal() {
    if (this.ui.isRiddleOpen() || this.ui.isAccusationOpen()) return;
    if (this.ui.isJournalOpen()) { this.ui.closeJournal(); return; }
    if (this.onJournal) this.onJournal();
  }

  update() {
    if (this.ui.isDialogueOpen() || this.ui.isOverlayOpen()) {
      this.ui.setInteractPrompt(false);
      return;
    }

    const camPos = this.camera.position;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    /* A LABEL NEVER OUT-RANKS SOMETHING TO PRESS E AT (#617). Nearest-wins was
     * the whole rule until the populace arrived: ten bodies with nothing to
     * say now walk the same castle as the twelve, and `STATION_CLEARANCE` only
     * keeps them 1.5 m apart while INTERACT_RANGE reaches 3.2 m. A baker's lad
     * crossing between the player and the cook is therefore nearer than the
     * cook, and under one list he took the prompt and the player could not
     * ask her anything until he had walked on. Two lists, and the label list
     * is only read when the other is empty.
     *
     * AND WHAT THE PLAYER IS AIMED AT OUT-RANKS WHAT IS MERELY NEAR (#722).
     * #617 fixed the populace against the cast and left the same bug standing
     * between a body and a prop, because nothing keeps a station away from
     * something to press E at the way `STATION_CLEARANCE` keeps two bodies
     * apart: the Constable's Prime station is 0.92 m from the chapel candles
     * and the Chaplain stands 0.20 m from the gravestone at every watch. Stand
     * a metre from the candles, put them dead in the middle of the screen, and
     * nearest-wins offered Sir Roger — 0.52 m away and 62 degrees off the aim.
     * So each of the two lists has two slots: the nearest thing inside AIM_DOT,
     * and the nearest thing at all. The aimed slot is read first, which is why
     * a door 1 m ahead still beats the NPC 3 m past it — both are inside
     * AIM_DOT, and inside that cone it is still nearest-wins. */
    const press = { aim: null, aimD: INTERACT_RANGE, near: null, nearD: INTERACT_RANGE };
    const named = { aim: null, aimD: INTERACT_RANGE, near: null, nearD: INTERACT_RANGE };
    for (const target of this.targets) {
      if (target.active === false) continue;
      const to = new THREE.Vector3().subVectors(aimAt(target), camPos);
      to.y = 0;
      const dist = to.length();
      if (dist > INTERACT_RANGE) continue;
      to.normalize();
      const dot = to.dot(camDir);
      if (dot < FACING_DOT) continue;
      const slot = target.label ? named : press;
      const aimed = dot >= AIM_DOT;
      // The range test against the slot this target is actually competing for,
      // and the raycast last, so most frames still cast nothing.
      if (dist > (aimed ? slot.aimD : slot.nearD)) continue;
      if (!this.hasLineOfSight(camPos, target)) continue;
      if (aimed) { slot.aim = target; slot.aimD = dist; }
      else { slot.near = target; slot.nearD = dist; }
    }

    const shown = press.aim || press.near || named.aim || named.near;
    this.currentTarget = shown;
    this.ui.setInteractPrompt(!!shown, shown ? (shown.prompt || `Press E to talk to the ${shown.name}`) : '');
  }

  /** Scene contents minus the targets, cached until the child count changes. */
  occluders() {
    const kids = this.scene.children;
    if (this._occluderCount === kids.length) return this._occluders;
    const bodies = new Set(this.targets.map((t) => t.group));
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
  hasLineOfSight(camPos, target) {
    if (!this.scene) return true;
    const occluders = this.occluders();
    const at = aimAt(target);

    for (const h of SIGHT_HEIGHTS) {
      _target.set(at.x, target.focus ? at.y : h, at.z);
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
