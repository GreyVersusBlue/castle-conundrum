// player-rig.js — the player's own body, such as it is: a shadow on the ground
// under the feet, and a hand that comes up and reaches for a door's lock when
// the player is standing close enough to open it.
//
// BACKLOG.md rank 11's first increment. WISHLIST.md calls these the two
// cheapest presence cues there are, and they are here together because they are
// the pair most likely to say whether the budget has room for the rest of that
// theme (weather, fire, examine, wear, sitting) at all.
//
// A DECAL, NOT A SHADOW-CASTING LIGHT. The open call in SPECS.md recommended
// the decal and this takes it: the castle has one shadow-casting light, the
// sun, and putting the player under a second one is a per-frame cost nothing
// here has ever paid for a thing the player sees for two seconds at a time.
// What is on the ground is one 0.46 m disc with a 64 x 64 gradient painted into
// a canvas at load — 16 KB of texture, one draw call, no file (#499, #510).
//
// NOTHING HERE IS A PLAN PIECE, SO NOTHING HERE CARRIES A planId (#500). The
// rig follows the player, so its box is a box the plan cannot predict; tagging
// it would put a moving object into test/plan-vs-scene.mjs's box diff, which
// compares live boxes against the plan's and would fail on wherever the player
// happened to be standing.
//
// AND EVERY MESH IN IT REFUSES RAYS. This is the thing that would otherwise
// break the castle quietly. The rig is a top-level child of the scene, and two
// raycasts in this repo sweep scene.children: src/interaction.js's
// line-of-sight test, which subtracts the targets and calls everything else an
// occluder, and play-castle.mjs's check that the Constable is visible from
// interact range. A shadow disc under the player's own feet and a hand 0.5 m in
// front of the player's own eye are in the way of both. `raycast = NO_RAY` on
// every mesh is the whole fix, and it is one line rather than a special case in
// two other files.
//
// THE SMOOTHING IS RATE-INDEPENDENT AND `settle()` COLLAPSES IT, for the reason
// PlayerController.settle() exists: a suite can then assert where the hand is
// without asserting how long it took to get there, which is the assertion #53
// says a software-rendered Chromium cannot answer either way.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SHADOW_R = 0.46;        // metres — a standing body's footprint plus a little
const SHADOW_LIFT = 0.02;     // off the floor, or it z-fights with the paver it sits on
const SHADOW_OPACITY = 0.42;

// Where the hand waits: camera space, below the bottom of the frame. At 0.42 m
// out a 72-degree vertical FOV is 0.305 m tall from the middle, so 0.54 m down
// is off the screen and the hand is not there until it is reaching.
const REST = new THREE.Vector3(0.30, -0.54, -0.42);
const REACH_MAX = 0.78;       // an arm, from the eye
const REACH_MIN = 0.30;       // and it does not fold back into the face at a door
const HANDLE_BACK = 0.12;     // stop short of the leaf rather than through it
const AIM_RIGHT = 0.22;       // aim off the handle's own centre so the hand does not
const AIM_DOWN = 0.10;        // sit over the middle of the view while it reaches
const REACH_RATE = 9;         // 1/s; ~0.3 s from below the frame to the lock
const HAND_SHOW = 0.02;       // below this the hand is off rather than off-screen

// Three.js calls `raycast` on every object a Raycaster walks. A no-op is how an
// object stays in the scene and out of every pick and every sight line.
const NO_RAY = () => {};

const _rest = new THREE.Vector3();
const _reach = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

/**
 * The blob's texture, painted rather than loaded: 64 x 64, one radial gradient,
 * transparent at the rim. No file, so no entry in assets/ and nothing for
 * tools/encode-assets.mjs to compress (#506), and nothing fetched at runtime
 * from anywhere (#493).
 */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.72)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * A hand, in the hand's own space: fingers along -z, which is the way the eye
 * looks. Palm, four fingers, a thumb across them and enough forearm that it
 * reads as a hand on an arm rather than a hand in the air.
 *
 * MERGED INTO ONE GEOMETRY, which is the difference between the rig costing two
 * draw calls and costing seven. test/budget.mjs counts what the builder returns
 * per ward and would never see these — the player is not a plan piece — so the
 * number is kept honest here instead.
 */
function handGeometry() {
  const parts = [];
  const put = (g, x, y, z, rx = 0, ry = 0) => {
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    parts.push(g);
  };
  const along = Math.PI / 2; // a capsule's axis is +y; this lays it along z
  put(new THREE.BoxGeometry(0.088, 0.030, 0.100), 0, 0, -0.030);
  for (let i = 0; i < 4; i++)
    put(new THREE.CapsuleGeometry(0.0105, 0.046, 2, 6), -0.030 + i * 0.020, 0, -0.105, along);
  put(new THREE.CapsuleGeometry(0.0125, 0.038, 2, 6), -0.046, 0, -0.040, along, 0.85);
  put(new THREE.CylinderGeometry(0.036, 0.042, 0.20, 8), 0, 0, 0.120, along);
  return mergeGeometries(parts);
}

/**
 * The hex of the cast's skin, off a body the page has already built. Not a
 * constant in this file, because a constant here would be a second copy of a
 * number that lives in a glTF: the tint leaves `Skin` alone (#419, and
 * BARE_MATERIALS in npc.js), so every body in the castle carries the same one
 * and test/plan-vs-scene.mjs already asserts there is exactly one of it. The
 * fallback is only for a page with no bodies on it at all.
 */
export function skinColour(bodies, fallback = 0xc79a7a) {
  for (const body of bodies) {
    let found = null;
    body.group.traverse((o) => {
      if (found !== null || !o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (m && m.color && /^skin$/i.test(m.name || '')) { found = m.color.getHex(); break; }
    });
    if (found !== null) return found;
  }
  return fallback;
}

export class PlayerRig {
  /**
   * @param scene  the scene; the rig adds one group to it and never another.
   * @param camera the player's eye. Everything here is placed off its position
   *   and quaternion, which is why the rig needs no state of its own about
   *   where the player is looking.
   * @param player the PlayerController, for `feet` — the height the plan says
   *   the player is standing at. The shadow is on THAT, not on a ray cast down
   *   from the camera: the plan is what the player stands on (castle-plan.js's
   *   standAt), so the shadow and the feet cannot disagree about a slab edge or
   *   a flight of stairs even in principle.
   * @param skin   the hand's colour, from `skinColour` above.
   */
  constructor({ scene, camera, player, skin = 0xc79a7a }) {
    this.camera = camera;
    this.player = player;
    this.reach = 0;      // 0 at rest, 1 at a lock, smoothed
    this.want = 0;       // what it is heading for this frame
    this.handle = new THREE.Vector3();

    this.group = new THREE.Group();
    this.group.name = 'player-rig';
    /* AND IT IS NOT SCENERY, WHICH IS A SECOND THING A TOP-LEVEL SCENE CHILD
     * has to say about itself here. `test/play-castle.mjs` sweeps
     * `scene.children` twice looking for furniture: once for anything whose
     * footprint sits over the hall table, and once for anything over 1.5 m tall
     * that is not a skinned body, which it then calls structure and checks the
     * furniture against. The rig is neither, and it is both shaped and placed to
     * be mistaken for them — a disc on the floor with a hand up to 1.6 m over
     * it, standing wherever the player is standing, which during that suite is
     * in the hall next to the furniture. That suite skips this flag the way it
     * already skips a skinned mesh. test/plan-vs-scene.mjs asserts the flag is
     * here, because the suite that needs it is the one CI cannot run (#53). */
    this.group.userData.playerRig = true;

    const shadowMat = new THREE.MeshBasicMaterial({
      map: blobTexture(),
      transparent: true,
      opacity: SHADOW_OPACITY,
      depthWrite: false,   // it is a mark on the floor, not a thing standing on it
      fog: false,
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(SHADOW_R * 2, SHADOW_R * 2), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 1;
    this.shadow.raycast = NO_RAY;
    this.group.add(this.shadow);

    this.hand = new THREE.Mesh(
      handGeometry(),
      new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85, metalness: 0 }),
    );
    this.hand.visible = false;
    this.hand.raycast = NO_RAY;
    this.group.add(this.hand);

    scene.add(this.group);
  }

  /**
   * One frame. `target` is whatever InteractionSystem is offering right now —
   * main.js hands over its `currentTarget` rather than this file running a
   * second search, so the hand reaches for exactly the door the prompt is
   * offering and comes down again the moment the prompt does. A door that has
   * been answered stops being active and stops being reached for, the same
   * getter `locks()` already hands the interaction system.
   */
  update(dt, target = null) {
    const lock = target && target.isLock && target.active !== false ? target : null;
    this.want = lock ? 1 : 0;
    if (lock) this.handle.copy(lock.focus || lock.group.position);
    this.apply(1 - Math.exp(-dt * REACH_RATE));
  }

  /**
   * Put the rig where this frame says it goes, with no smoothing left. Called
   * after a teleport — and by test/plan-vs-scene.mjs, so that suite asserts a
   * position and never a duration (#53).
   *
   * The world matrix is brought with it, which `update` leaves to the renderer.
   * Writing `position` does not move an object as far as a Raycaster is
   * concerned — Mesh.raycast reads `matrixWorld`, and nothing updates that
   * until the next render. A settle that left the matrix a frame behind would
   * be a settle that moved the rig for anything reading `.position` and left it
   * where it was for anything casting a ray at it.
   */
  settle() { this.apply(1); this.group.updateMatrixWorld(true); }

  apply(a) {
    const cam = this.camera.position;

    // The shadow is not smoothed. It is where the feet are, and the feet are
    // where the plan put them.
    this.shadow.position.set(cam.x, this.player.feet + SHADOW_LIFT, cam.z);

    this.reach += (this.want - this.reach) * a;
    if (this.reach < 0.0005) this.reach = 0;
    this.hand.visible = this.reach > HAND_SHOW;

    _rest.copy(REST).applyQuaternion(this.camera.quaternion).add(cam);

    // Where the hand is going: at the handle, short of the leaf, no further out
    // than an arm, and off the handle's own centre so it does not come up over
    // the middle of the view. The offset is on the AIM POINT and not on the
    // hand, so the arm's length stays the arm's length.
    _right.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    _up.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
    _aim.copy(this.handle).addScaledVector(_right, AIM_RIGHT).addScaledVector(_up, -AIM_DOWN);
    _reach.subVectors(_aim, cam);
    const d = _reach.length() || 1;
    _reach.divideScalar(d).multiplyScalar(Math.min(REACH_MAX, Math.max(REACH_MIN, d - HANDLE_BACK))).add(cam);

    // smoothstep, so the hand eases out of the frame rather than snapping to it
    const e = this.reach * this.reach * (3 - 2 * this.reach);
    this.hand.position.copy(_rest).lerp(_reach, e);
    this.hand.quaternion.copy(this.camera.quaternion);
  }
}
