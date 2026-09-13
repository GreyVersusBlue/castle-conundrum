// npc.js — NPCs: model or placeholder body, patrol/idle movement, facing, dialogue state.
//
// If an npc in data/npcs.json has a `modelPath`, that model is loaded, height-normalised,
// and driven by an AnimationMixer (idle / walk / a one-shot greeting when talked to).
// If `modelPath` is null, build() falls back to a coloured capsule-and-head placeholder
// tinted by placeholder.color. Nothing here keys off an npc's id — swapping a model in or
// out, or changing which clips or held prop it uses, is a data change, not a code change.

import * as THREE from 'three';
import { loadGLTF, loadModel } from './assets.js';

const PATROL_SPEED = 1.1; // m/s
const WAYPOINT_EPS = 0.05;
const TURN_SPEED = 4.0; // rad/s — how fast an npc swings round to a new heading
const DEFAULT_HEIGHT = 1.8; // metres; player eye height is 1.7, so npcs read as adults

// Clip-name preferences, most-wanted first. Matched case-insensitively against whatever
// the loaded file happens to ship, so a model with a different animation set still finds
// something rather than standing frozen.
const CLIPS = {
  idle: ['Idle', 'Idle_Neutral', 'Idle_Sword', 'Breathing', 'Stand'],
  walk: ['Walk', 'Walking', 'Run'],
  greet: ['Wave', 'Interact', 'Talk', 'Idle_Gun_Pointing'],
};

// Held props hang off the right hand when the rig has one. Names cover the Quaternius
// rig used by assets/NPCs/*.gltf plus the two other common humanoid naming conventions.
const HAND_BONES = [/^wrist\.?r$/i, /^hand\.?r$/i, /right_?hand$/i, /mixamorig:?RightHand$/i];
const PROP_LENGTH = 0.6; // metres along its longest axis, before the rig's own scale
const GRIP_FRACTION = 0.14; // how far up the prop the hand grips it, 0 = butt, 1 = tip

export class NPC {
  constructor(def, scene, polyhavenBase) {
    this.def = def;
    this.scene = scene;
    this.polyhavenBase = polyhavenBase;

    this.id = def.id;
    this.name = def.name;
    this.talking = false;
    this.dialogueState = 'default';

    this.group = new THREE.Group();
    this.group.position.set(...def.position);
    this.group.rotation.y = THREE.MathUtils.degToRad(def.facing || 0);

    this._waypoints = (def.patrol || []).map((p) => new THREE.Vector3(...p));
    this._waypointIndex = 0;
    this._targetYaw = this.group.rotation.y;

    this._mixer = null;
    this._actions = {};
    this._current = null;
    this._wasTalking = false;
  }

  async build() {
    const body = this.def.modelPath
      ? await this._buildModelBody()
      : this._buildPlaceholderBody();
    this.group.add(body);

    if (this.def.heldProp) {
      await this._attachHeldProp(this.polyhavenBase + this.def.heldProp);
    }

    this.scene.add(this.group);
    return this;
  }

  /** Load the rigged model, scale it to human height, hide any suppressed parts, wire clips. */
  async _buildModelBody() {
    const { scene: model, animations } = await loadGLTF(this.def.modelPath);

    // Normalise height so any model dropped into modelPath lands at the same scale,
    // whatever unit its author worked in.
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    const target = this.def.modelHeight || DEFAULT_HEIGHT;
    if (size.y > 0.0001) model.scale.setScalar(target / size.y);

    // Optional: drop bits of the model that don't suit the character it's been cast as.
    // hideMaterials targets a single glTF primitive (three splits a multi-material mesh
    // into one Mesh per material); hideNodes targets a whole named node. Both purely
    // cosmetic, both data-driven — no npc id is ever consulted.
    const hideMaterials = this.def.hideMaterials || [];
    const hideNodes = this.def.hideNodes || [];
    if (hideMaterials.length || hideNodes.length) {
      model.traverse((obj) => {
        if (hideNodes.includes(obj.name)) obj.visible = false;
        if (obj.isMesh && obj.material?.name && hideMaterials.includes(obj.material.name)) {
          obj.visible = false;
        }
      });
    }

    if (animations.length) {
      this._mixer = new THREE.AnimationMixer(model);
      for (const [key, names] of Object.entries(CLIPS)) {
        const clip = pickClip(animations, names);
        if (clip) this._actions[key] = this._mixer.clipAction(clip);
      }
      // The greeting is a one-shot; drop back to idle rather than holding its last pose
      // for the rest of the conversation.
      this._mixer.addEventListener('finished', (e) => {
        if (e.action === this._actions.greet) this._play('idle');
      });
      this._play('idle');
    }

    return model;
  }

  _buildPlaceholderBody() {
    const color = this.def.placeholder?.color || '#888888';
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    const body = new THREE.Group();

    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.1, 12), mat);
    robe.position.y = 0.55;
    robe.castShadow = true;
    body.add(robe);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat);
    head.position.y = 1.28;
    head.castShadow = true;
    body.add(head);

    body.userData.isPlaceholder = true;
    return body;
  }

  /**
   * Put a prop in the right hand: scaled to weapon size, gripped near its butt, shaft
   * running back along the forearm so the heavy end rides above the fist instead of
   * dragging through the floor. Parenting to the bone means it follows the animation.
   *
   * All of this is derived from the prop's and the rig's own geometry rather than
   * hardcoded per asset, so a different prop or a differently-named rig still lands
   * somewhere sane. Falls back to hanging the prop off the body's right side, which is
   * all a placeholder capsule (no bones) can do.
   */
  async _attachHeldProp(path) {
    const prop = await loadModel(path);
    prop.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.group.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(prop);
    const size = box.getSize(new THREE.Vector3());
    const axis = size.x > size.y && size.x > size.z ? 'x' : size.y > size.z ? 'y' : 'z';
    const length = size[axis];

    // Re-origin the prop onto its grip point: centred across the two short axes, and
    // GRIP_FRACTION of the way up the long one.
    const centre = box.getCenter(new THREE.Vector3());
    prop.position.set(-centre.x, -centre.y, -centre.z);
    prop.position[axis] = -(box.min[axis] + length * GRIP_FRACTION);

    // A holder carries the orientation and scale so the grip offset above stays untouched.
    const holder = new THREE.Group();
    holder.add(prop);

    const hand = this._findHandBone();
    const parent = hand || this.group;
    // The holder's scale multiplies whatever its parent already scales by, so divide
    // that out to land at a real-world PROP_LENGTH wherever it ends up attached.
    const parentScale = parent.getWorldScale(new THREE.Vector3()).x || 1;
    if (length > 0.0001) holder.scale.setScalar(PROP_LENGTH / length / parentScale);

    if (hand) {
      // Child bone offsets are already expressed in the hand bone's own space, so their
      // mean direction is "out towards the fingertips", which with an arm at rest means
      // roughly straight down. Send the prop's heavy end that way so it hangs from the
      // fist like a carried weapon; pointing it the other way buries it inside the arm.
      const fingers = new THREE.Vector3();
      for (const b of hand.children) if (b.isBone) fingers.add(b.position);
      if (fingers.lengthSq() < 1e-8) fingers.set(0, -1, 0);
      fingers.normalize();

      const propAxis = new THREE.Vector3();
      propAxis.setComponent({ x: 0, y: 1, z: 2 }[axis], 1);
      holder.quaternion.setFromUnitVectors(propAxis, fingers);
      holder.position.copy(fingers).multiplyScalar(0.05 / parentScale);
    } else {
      holder.position.set(0.3, 0.9, 0.05);
      holder.rotation.z = -0.35;
    }
    parent.add(holder);
  }

  _findHandBone() {
    let found = null;
    this.group.traverse((obj) => {
      if (found || !obj.isBone) return;
      if (HAND_BONES.some((re) => re.test(obj.name))) found = obj;
    });
    return found;
  }

  /** Cross-fade to one of the CLIPS keys. No-op if the model didn't ship that clip. */
  _play(key, { once = false } = {}) {
    const next = this._actions[key];
    if (!next || next === this._current) return;

    next.reset();
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    if (once) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }

    if (this._current) next.crossFadeFrom(this._current, 0.25, true);
    else next.setEffectiveWeight(1);
    next.play();
    this._current = next;
  }

  /** Called every frame from main.js's render loop. */
  update(dt, camPos) {
    // Animation keeps running while talking — a frozen NPC mid-conversation looks dead.
    if (this._mixer) this._mixer.update(dt);

    if (this.talking !== this._wasTalking) {
      this._wasTalking = this.talking;
      this._play(this.talking ? 'greet' : 'idle', { once: this.talking });
    }

    // Turning always runs, including the facePlayer() turn that starts a conversation.
    this._turnToward(dt);

    // Walking, however, stops, so an NPC can't wander off mid-conversation.
    if (this.talking || this._waypoints.length === 0) return;

    const target = this._waypoints[this._waypointIndex];
    const to = new THREE.Vector3().subVectors(target, this.group.position);
    to.y = 0;
    const dist = to.length();

    if (dist < WAYPOINT_EPS) {
      this._waypointIndex = (this._waypointIndex + 1) % this._waypoints.length;
      return;
    }

    to.normalize();
    this.group.position.addScaledVector(to, Math.min(PATROL_SPEED * dt, dist));
    this._targetYaw = Math.atan2(to.x, to.z);
    this._play('walk');
  }

  /** Ease the body round to _targetYaw instead of snapping, which reads as a glitch. */
  _turnToward(dt) {
    const delta = shortestAngle(this.group.rotation.y, this._targetYaw);
    if (Math.abs(delta) < 0.001) return;
    const step = Math.min(Math.abs(delta), TURN_SPEED * dt) * Math.sign(delta);
    this.group.rotation.y += step;
  }

  /** Turn to face the player. Called once by main.js when interaction starts. */
  facePlayer(camPos) {
    const dir = new THREE.Vector3().subVectors(camPos, this.group.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) return;
    this._targetYaw = Math.atan2(dir.x, dir.z);
  }

  getDialogueLines() {
    return this.def.dialogue[this.dialogueState];
  }
}

function pickClip(animations, names) {
  for (const wanted of names) {
    const hit = animations.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

function shortestAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
