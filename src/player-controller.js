// player-controller.js — WASD + pointer-lock movement with capsule-vs-AABB collision,
// standing on whatever src/castle-plan.js says is under the feet.

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { EYE_HEIGHT, STEP_UP, standAt, moveBody } from './castle-plan.js';
import { SILENCE } from './audio.js';

const WALK_SPEED = 5.2;
const SPRINT_MULT = 1.75;

/* POINTER LOCK IS RATIONED, AND THE RATION IS THE BROWSER'S (#661).
 *
 * Measured in Chrome on 2026-09-18, from `test/blank.html` with nothing else
 * on the page: FOUR `requestPointerLock()` calls are granted and the fifth is
 * refused with `NotAllowedError: Too many pointer lock requests in a short
 * window of time`; the budget comes back 2049 ms after it ran out. Nothing in
 * the game asked that often until ui.js started taking the pointer back on
 * every overlay close (#660) — five overlays opened and shut inside two
 * seconds is a player mashing J, and it is not hypothetical.
 *
 * A refused request is not free: it fires `pointerlockerror`, which three's own
 * PointerLockControls answers with a console.error, and `lock()` there drops
 * the promise on the floor so the rejection surfaces as an unhandled one. So
 * this counts its own asks and stops ONE SHORT of the browser's budget rather
 * than finding out. Three in 2.2 s is under the measured limit on Chrome and
 * over nothing a player does deliberately; a browser with no limit at all
 * (Firefox has none) loses nothing but the fourth ask in a two-second burst,
 * which the resume panel catches anyway.
 */
const LOCK_BURST = 3;
const LOCK_WINDOW_MS = 2200;

export class PlayerController {
  /**
   * `getColliders` answers with `src/castle-plan.js`'s own collider list — the
   * boxes the plan computed, not boxes measured off the live scene. The only
   * entries that do not come from the plan are the three brazier stands, which
   * `scene-setup.js` builds at runtime and registers through
   * `castle.addCollider`. A THREE.Box3 and a plan box are read the same way
   * here: `.min.x`, `.max.y`.
   *
   * `getPlan` answers with the plan itself, for `standAt`: THE PLAYER HAS A Y
   * SINCE PHASE 5. The feet stand on the highest surface within a step of where
   * they were — a floor, a slab, a deck, a flight interpolated as a ramp — and
   * the eye is EYE_HEIGHT above that. There is no jumping and no falling: a move
   * that would put the feet where no surface is within STEP_UP of them is
   * refused, exactly as a move into a wall is, so the edge of a slab and the
   * top of a stair-well are walls too. `standAt` is the same function the
   * walkability grid stands on, which is the point: a floor the suite can stand
   * on and a floor the player can stand on are one floor.
   *
   * Colliders are tested in a band relative to the feet, HEAD_LOW to HEAD_HIGH
   * above them, which is the grid's band too (`moveBody`, castle-plan.js). A
   * wall on the first floor does not stop a body on the wall walk over it, and
   * the walk's parapet does.
   */
  constructor(camera, domElement, getColliders, getPlan, audio = SILENCE) {
    this.camera = camera;
    this.getColliders = getColliders; // () => [{ box }]
    this.getPlan = getPlan; // () => plan, or null before the castle is built
    this.audio = audio; // src/audio.js, or SILENCE; injected the way `ui` is
    // Metres walked since the last footfall, and every surface's step class,
    // built once off the plan the first time a foot lands (#519).
    this.walked = 0;
    this.stepClass = null;
    this.touch = null;
    // When the last few `lock()` calls went out, for the ration above.
    this._asks = [];
    this.controls = new PointerLockControls(camera, domElement);
    this.keys = new Set();
    this.enabled = false;
    this.velocity = new THREE.Vector3();
    this.feet = camera.position.y - EYE_HEIGHT;

    document.addEventListener('keydown', (e) => this.keys.add(e.code));
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  /**
   * The second input scheme (#530). `touch` is `src/touch-controls.js` or null.
   * With one attached, pointer lock stops being the thing that says the player
   * is playing — a phone has none — and `enabled` alone does, so `lock()` and
   * `unlock()` become no-ops and `isLocked` answers the same question the rest
   * of the game was really asking: is this body under the player's hand?
   */
  useTouch(touch) { this.touch = touch; }
  get onTouch() { return !!this.touch; }

  /**
   * Ask for pointer lock, and ANSWER WHETHER IT WAS GIVEN (#661). Every caller
   * of this has somewhere else to go when it was not — main.js puts the resume
   * panel up — and none of them could tell before, because three's own
   * `controls.lock()` returns undefined and swallows the promise.
   *
   * Resolves true without asking when the pointer is already held: `_takePointer`
   * in ui.js calls this on every overlay close, and most of those closes happen
   * with the lock still in hand.
   */
  lock() {
    if (this.touch) return Promise.resolve(true);
    if (document.pointerLockElement) return Promise.resolve(true);
    const now = performance.now();
    this._asks = this._asks.filter((t) => now - t < LOCK_WINDOW_MS);
    if (this._asks.length >= LOCK_BURST) return Promise.resolve(false);
    this._asks.push(now);
    let asked;
    try { asked = this.controls.domElement.requestPointerLock(); } catch { return Promise.resolve(false); }
    // A browser old enough to return undefined here reports success it has not
    // had yet. It also fires `pointerlockerror` if it fails, which is three's
    // console.error, and there is nothing to be done about that from here.
    return Promise.resolve(asked).then(() => true, () => false);
  }

  unlock() { if (!this.touch) this.controls.unlock(); }
  get isLocked() { return this.touch ? this.enabled : this.controls.isLocked; }

  /**
   * Put the feet on the floor under the camera and the eye above it. Called
   * once the plan exists, after a save has placed the camera, and by
   * test/plan-vs-scene.mjs after it teleports the camera to a room. Reads the
   * feet off the camera's own y so a saved position on a slab resumes on the
   * slab; a camera over nothing keeps its height, because the alternative is a
   * camera at NaN.
   */
  settle() {
    const plan = this.getPlan && this.getPlan();
    if (!plan) return null;
    const pos = this.camera.position;
    const feet = pos.y - EYE_HEIGHT;
    const on = standAt(plan, pos.x, pos.z, feet, STEP_UP);
    if (!on) return null;
    this.feet = on.h;
    pos.y = this.feet + EYE_HEIGHT;
    return on;
  }

  /**
   * What the player is asking for this frame, from both schemes at once: the
   * keys, and the thumb if there is one. Whichever is pushing harder on an axis
   * wins, so a laptop with a touchscreen answers to either without a mode
   * switch mid-frame. The triple is the same shape either way, which is the
   * whole point of #530: nothing below here knows which hand it came from.
   */
  axes() {
    const keyF =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const keyS =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const keySprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    if (!this.touch) return { forward: keyF, strafe: keyS, sprint: keySprint };
    const t = this.touch.read();
    const bigger = (a, b) => (Math.abs(a) >= Math.abs(b) ? a : b);
    return { forward: bigger(keyF, t.forward), strafe: bigger(keyS, t.strafe), sprint: keySprint || t.sprint };
  }

  /** Is the player asking to move right now, by key or by thumb? */
  get moving() { const a = this.axes(); return a.forward !== 0 || a.strafe !== 0; }

  update(dt) {
    if (!this.isLocked || !this.enabled) return;

    const { forward, strafe, sprint } = this.axes();
    if (forward === 0 && strafe === 0) return;

    const speed = WALK_SPEED * (sprint ? SPRINT_MULT : 1);

    // Movement in camera-yaw space, flattened to the ground plane
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

    // A key is 0 or 1 and a thumb is anything between, so the stick's own
    // magnitude has to survive the normalise: half over is half speed.
    const over = Math.min(1, Math.hypot(forward, strafe));
    const move = new THREE.Vector3()
      .addScaledVector(dir, forward)
      .addScaledVector(right, strafe)
      .normalize()
      .multiplyScalar(speed * over * dt);

    const pos = this.camera.position;
    // resolve each axis separately so we slide along walls, and stand each axis
    // separately so a step off a slab's edge in x still lets the z half of the
    // move slide along the edge
    const x0 = pos.x, z0 = pos.z;
    this.step(pos, move.x, 0);
    this.step(pos, 0, move.z);
    pos.y = this.feet + EYE_HEIGHT;
    this.footfall(Math.hypot(pos.x - x0, pos.z - z0), sprint);
  }

  /**
   * A footstep every stride's worth of ground ACTUALLY COVERED, not every
   * stride's worth asked for: a body pressed against a wall covers nothing and
   * goes quiet, which is the behaviour a timer would have got wrong. What the
   * foot lands on is the plan's own answer, `standAt`, asked once per footfall
   * rather than once per frame — about three times a second against sixty.
   */
  footfall(moved, sprint) {
    this.walked += moved;
    const stride = this.audio.stride(sprint);
    if (!(this.walked >= stride)) return; // also false for a stride of Infinity
    this.walked = 0;
    const plan = this.getPlan && this.getPlan();
    if (!plan) return;
    if (!this.stepClass) this.stepClass = this.audio.classesFor(plan);
    const pos = this.camera.position;
    const on = standAt(plan, pos.x, pos.z, this.feet, STEP_UP);
    if (on) this.audio.footstep(this.stepClass.get(on.surface));
  }

  /**
   * One axis of a move: take it, push out of any box, then stand, or, standing
   * nowhere, undo it. The rule is `moveBody` in castle-plan.js, so
   * test/layout.mjs walks the same body up every flight this does (#511).
   */
  step(pos, dx, dz) {
    const plan = this.getPlan && this.getPlan();
    if (!plan) return;
    const r = moveBody(plan, this.getColliders(), { x: pos.x, z: pos.z, feet: this.feet }, dx, dz);
    if (r.refused) return;
    pos.x = r.x;
    pos.z = r.z;
    this.feet = r.feet;
  }
}
