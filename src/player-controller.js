// player-controller.js — WASD + pointer-lock movement with capsule-vs-AABB collision.

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const EYE_HEIGHT = 1.7;
const RADIUS = 0.45;
const WALK_SPEED = 5.2;
const SPRINT_MULT = 1.75;

export class PlayerController {
  constructor(camera, domElement, getColliders) {
    this.camera = camera;
    this.getColliders = getColliders; // () => [{ box }]
    this.controls = new PointerLockControls(camera, domElement);
    this.keys = new Set();
    this.enabled = false;
    this.velocity = new THREE.Vector3();

    document.addEventListener('keydown', (e) => this.keys.add(e.code));
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  lock() { this.controls.lock(); }
  unlock() { this.controls.unlock(); }
  get isLocked() { return this.controls.isLocked; }

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
    // resolve each axis separately so we slide along walls
    pos.x += move.x;
    this.resolveCollisions(pos);
    pos.z += move.z;
    this.resolveCollisions(pos);
    pos.y = EYE_HEIGHT;
  }

  resolveCollisions(pos) {
    const colliders = this.getColliders();
    for (const { box } of colliders) {
      // ignore things entirely above head or that are effectively floor decals
      if (box.min.y > EYE_HEIGHT || box.max.y < 0.25) continue;

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
