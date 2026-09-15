// player-controller.js — WASD + pointer-lock movement with capsule-vs-AABB collision,
// standing on whatever src/castle-plan.js says is under the feet.

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { EYE_HEIGHT, HEAD_LOW, HEAD_HIGH, STEP_UP, standAt } from './castle-plan.js';

const RADIUS = 0.45;
const WALK_SPEED = 5.2;
const SPRINT_MULT = 1.75;

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
   * above them, which is the grid's band too. A wall on the first floor does not
   * stop a body on the wall walk over it, and the walk's parapet does.
   */
  constructor(camera, domElement, getColliders, getPlan) {
    this.camera = camera;
    this.getColliders = getColliders; // () => [{ box }]
    this.getPlan = getPlan; // () => plan, or null before the castle is built
    this.controls = new PointerLockControls(camera, domElement);
    this.keys = new Set();
    this.enabled = false;
    this.velocity = new THREE.Vector3();
    this.feet = camera.position.y - EYE_HEIGHT;

    document.addEventListener('keydown', (e) => this.keys.add(e.code));
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  lock() { this.controls.lock(); }
  unlock() { this.controls.unlock(); }
  get isLocked() { return this.controls.isLocked; }

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

  update(dt) {
    if (!this.controls.isLocked || !this.enabled) return;

    const forward =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const strafe =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);

    if (forward === 0 && strafe === 0) return;

    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = WALK_SPEED * (sprint ? SPRINT_MULT : 1);

    // Movement in camera-yaw space, flattened to the ground plane
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

    const move = new THREE.Vector3()
      .addScaledVector(dir, forward)
      .addScaledVector(right, strafe)
      .normalize()
      .multiplyScalar(speed * dt);

    const pos = this.camera.position;
    // resolve each axis separately so we slide along walls, and stand each axis
    // separately so a step off a slab's edge in x still lets the z half of the
    // move slide along the edge
    this.step(pos, move.x, 0);
    this.step(pos, 0, move.z);
    pos.y = this.feet + EYE_HEIGHT;
  }

  /** One axis of a move: take it, push out of any box, then stand — or, standing nowhere, undo it. */
  step(pos, dx, dz) {
    if (dx === 0 && dz === 0) return;
    const x0 = pos.x, z0 = pos.z, feet0 = this.feet;
    pos.x += dx;
    pos.z += dz;
    this.resolveCollisions(pos);
    const plan = this.getPlan && this.getPlan();
    if (!plan) return;
    const on = standAt(plan, pos.x, pos.z, this.feet, STEP_UP);
    if (on) { this.feet = on.h; return; }
    pos.x = x0;
    pos.z = z0;
    this.feet = feet0;
  }

  resolveCollisions(pos) {
    const colliders = this.getColliders();
    const low = this.feet + HEAD_LOW, high = this.feet + HEAD_HIGH;
    for (const { box } of colliders) {
      // only what crosses the standing body's column: not a floor underfoot, not
      // a lintel or a slab over the head, not a ground-floor wall under the walk
      if (box.min.y >= high || box.max.y <= low) continue;

      const cx = THREE.MathUtils.clamp(pos.x, box.min.x, box.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, box.min.z, box.max.z);
      const dx = pos.x - cx;
      const dz = pos.z - cz;
      const distSq = dx * dx + dz * dz;
      if (distSq < RADIUS * RADIUS) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = (RADIUS - dist) / dist;
          pos.x += dx * push;
          pos.z += dz * push;
        } else {
          // dead center inside a box — push out toward the nearest face on x/z
          const left = pos.x - box.min.x, rightD = box.max.x - pos.x;
          const front = pos.z - box.min.z, back = box.max.z - pos.z;
          const m = Math.min(left, rightD, front, back);
          if (m === left) pos.x = box.min.x - RADIUS;
          else if (m === rightD) pos.x = box.max.x + RADIUS;
          else if (m === front) pos.z = box.min.z - RADIUS;
          else pos.z = box.max.z + RADIUS;
        }
      }
    }
  }
}
