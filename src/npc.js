// npc.js — NPCs: model or placeholder body, patrol/idle movement, facing, dialogue state.
//
// If an npc in data/npcs.json has a `modelPath`, that model is loaded, height-normalised,
// and driven by an AnimationMixer (idle / walk / a one-shot greeting when talked to).
// If `modelPath` is null, build() falls back to a coloured capsule-and-head placeholder
// tinted by placeholder.color. Nothing here keys off an npc's id — swapping a model in or
// out, or changing which clips or held prop it uses, is a data change, not a code change.
//
// TWELVE PEOPLE, FOUR BODIES (#419, and #603 for the fourth). `tint` is a hex every
// cloth material on the body is multiplied by, which is what makes Marged and Nest two
// women rather than two copies of Woman.glb. Skin, eyes, brows and hair are left alone: a green face
// is a different species, not a different person. The materials are cloned first,
// because SkeletonUtils.clone() shares them by reference and tinting one Farmer
// otherwise tints all four.
//
// AND A FIFTH BODY THAT IS NOT A PERSON (#644). The hound under assets/NPCs is
// the same shape of thing as the four: a rigged glTF with named clips, height-
// normalised, tinted, walked along the same grid. Nothing below knows it is a
// dog. What it lacks — a right hand, a Wave — it lacks by data: `def.clips`
// names the clip a body greets with, and a body with none keeps idling.
// `boneScale` and `speed` are the other two fields this row added, and both
// exist for the child: a scaled-down adult with a bigger head, running.
//
// WALKING BETWEEN STATIONS. `def.patrol` is a loop, which is what the three of v1
// had. `walkTo(points)` is the Phase 6 form: a one-shot route from src/stations.js,
// cell centres 0.5 m apart with the floor height at each, so an NPC crossing the
// castle climbs the same stairs the player does and stops when it arrives.

import * as THREE from 'three';
import { loadGLTF, loadModel } from './assets.js';
import { ACTIVITY_CLIPS, heldPropPath } from './populace.js';

const PATROL_SPEED = 1.1; // m/s
const WAYPOINT_EPS = 0.05;
const TURN_SPEED = 4.0; // rad/s — how fast an npc swings round to a new heading
const CLIMB_SPEED = 1.6; // m/s the feet rise or fall towards the next waypoint's floor
const DEFAULT_HEIGHT = 1.8; // metres; player eye height is 1.7, so npcs read as adults
// What the tint does not touch. A nose is the hound's (#644): black on every
// dog there is, and a tawny nose is the same wrong species a green face is.
const BARE_MATERIALS = [/^skin$/i, /^eye/i, /^eyebrow/i, /^hair/i, /^nose$/i];

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
    this.group.position.set(...(def.position || [0, 0, 0]));
    this.group.rotation.y = THREE.MathUtils.degToRad(def.facing || 0);

    this._waypoints = (def.patrol || []).map((p) => new THREE.Vector3(...p));
    this._loop = this._waypoints.length > 0;
    this._waypointIndex = 0;
    this._targetYaw = this.group.rotation.y;
    /* HOW FAST THE FEET MOVE, in m/s (#643). Every adult walks at the one
     * speed; a child runs between her stops at twice it, and the clip she
     * runs with comes off `def.clips` below, because a Run clip played at a
     * walking pace is a body running on the spot. */
    this.speed = def.speed ?? PATROL_SPEED;

    this._mixer = null;
    this._actions = {};
    this._clips = [];
    this._current = null;
    this._wasTalking = false;
    /* WHAT A BODY GOES BACK TO WHEN IT IS NOT WALKING AND NOT TALKING. It was
     * the literal 'idle' in three places until the populace arrived (#616),
     * and a populace body that reached its stop, played its activity and then
     * finished a step would drop straight back to Idle and stay there — the
     * baker baked for one frame per bell. This is the one thing the activity
     * has to survive, so it is a field rather than three call sites. */
    this._restKey = 'idle';

    /* A POPULACE BODY IS A BODY AND NOTHING ELSE (BACKLOG.md rank 6). Both of
     * these come off the def, so nothing here knows one list from the other:
     * `prompt` replaces InteractionSystem's "Press E to talk to the ..." with
     * a label, because pressing E at somebody with no dialogue does nothing,
     * and `label` is what stops that label out-ranking a suspect standing
     * behind them. src/populace.js's `populaceDefs` is what sets them. */
    this.prompt = def.prompt ?? undefined;
    this.label = !!def.populace;
  }

  /**
   * A HIDDEN BODY IS NOT SOMETHING TO PRESS E AT (#538). `InteractionSystem`
   * skips a target whose `active` is false, and `castle-builder.js` has said
   * `get active() { return obj.visible; }` for every piece of evidence since
   * Phase 7. NPCs never did, and the bug that hid behind that was day one's:
   * the merchant is not in the castle until Terce, and his group sits at the
   * origin with `visible` false, which no player ever walks up to. The second
   * day put a hidden body where the player is certain to go — the man who
   * hanged stays standing, invisible, at the Vespers station the accusation
   * was made at — and the HUD offered "Press E to talk to Master Robert
   * Ferrour" over an empty patch of the Great Hall. Measured in the browser
   * before this line existed, with the merchant moved into the hall on
   * purpose: the prompt was identical with `visible` true and false.
   */
  get active() { return this.group.visible; }

  async build() {
    const body = this.def.modelPath
      ? await this._buildModelBody()
      : this._buildPlaceholderBody();
    this.group.add(body);

    if (this.def.heldProp) {
      await this._attachHeldProp(heldPropPath(this.polyhavenBase, this.def.heldProp), this.def.heldPropFit || {});
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

    if (this.def.tint) tintBody(model, this.def.tint);

    /* A CHILD IS AN ADULT WITH A BIGGER HEAD (#643). Scaling the whole rig
     * down to 1.15 m gives a small bearded man, which is what the first
     * line-up showed; what makes it a child is the head at a third larger
     * on the shorter body, one part in five and a half against an adult's
     * one in seven and a half. `boneScale` is that: a bone name to a scalar,
     * applied after the height, and the animation leaves it alone because
     * the clips key position and rotation and never scale. It is a variation
     * axis like `tint` and `hideNodes`, not a child rig, and the day the
     * proportions read wrong on a GPU is the day a real one is sourced. */
    for (const [bone, scale] of Object.entries(this.def.boneScale || {})) {
      model.traverse((obj) => { if (obj.isBone && obj.name === bone) obj.scale.setScalar(scale); });
    }

    if (animations.length) {
      this._clips = animations;
      this._mixer = new THREE.AnimationMixer(model);
      for (const [key, names] of Object.entries(CLIPS)) {
        // `def.clips` puts one name ahead of the list for this body: the
        // child's walk is `Run`, and the hound has no `Wave` to greet with.
        const wanted = this.def.clips?.[key] ? [this.def.clips[key], ...names] : names;
        const clip = pickClip(animations, wanted);
        if (clip) this._actions[key] = this._mixer.clipAction(clip);
      }
      // The greeting is a one-shot; drop back to idle rather than holding its last pose
      // for the rest of the conversation.
      this._mixer.addEventListener('finished', (e) => {
        if (e.action === this._actions.greet) this._play(this._restKey);
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
   *
   * THE FIT IS DATA WHEN THE DEFAULTS ARE WRONG (#685). The defaults are a
   * mace's: 0.6 m long, gripped 14 % up from the butt, heavy end hanging
   * down past the fist. A spear is none of those. `fit.length` is the
   * real-world length in metres, `fit.grip` the fraction along the long axis
   * where the hand closes (0 the butt, 1 the tip), and `fit.tipUp` sends the
   * far end UP past the shoulder instead of down: the butt hangs by the knee
   * and the head stands over the helmet, which is how a spear is carried at
   * rest and how it reads as a spear from across a ward.
   */
  async _attachHeldProp(path, fit = {}) {
    const prop = await loadModel(path);
    prop.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.group.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(prop);
    const size = box.getSize(new THREE.Vector3());
    const axis = size.x > size.y && size.x > size.z ? 'x' : size.y > size.z ? 'y' : 'z';
    const length = size[axis];
    const propLength = fit.length ?? PROP_LENGTH;
    const grip = fit.grip ?? GRIP_FRACTION;

    // Re-origin the prop onto its grip point: centred across the two short axes, and
    // `grip` of the way up the long one.
    const centre = box.getCenter(new THREE.Vector3());
    prop.position.set(-centre.x, -centre.y, -centre.z);
    prop.position[axis] = -(box.min[axis] + length * grip);

    // A holder carries the orientation and scale so the grip offset above stays untouched.
    const holder = new THREE.Group();
    holder.add(prop);

    const hand = this._findHandBone();
    const parent = hand || this.group;
    // The holder's scale multiplies whatever its parent already scales by, so divide
    // that out to land at a real-world PROP_LENGTH wherever it ends up attached.
    const parentScale = parent.getWorldScale(new THREE.Vector3()).x || 1;
    if (length > 0.0001) holder.scale.setScalar(propLength / length / parentScale);

    if (hand) {
      // Child bone offsets are already expressed in the hand bone's own space, so their
      // mean direction is "out towards the fingertips", which with an arm at rest means
      // roughly straight down. Send the prop's heavy end that way so it hangs from the
      // fist like a carried weapon; pointing it the other way buries it inside the arm.
      const fingers = new THREE.Vector3();
      for (const b of hand.children) if (b.isBone) fingers.add(b.position);
      if (fingers.lengthSq() < 1e-8) fingers.set(0, -1, 0);
      fingers.normalize();

      // `tipUp` sends the prop's far end the other way: the tip stands up
      // past the shoulder and the butt hangs by the knee.
      const propAxis = new THREE.Vector3();
      propAxis.setComponent({ x: 0, y: 1, z: 2 }[axis], fit.tipUp ? -1 : 1);
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

  /** Is this body part-way along a route? False for a patrol, which never ends. */
  get walking() { return this._waypoints.length > 0 && !this._loop; }

  /**
   * STAND STILL AND DO A JOB (#616). `activity` is one of the strings
   * src/populace.js's ACTIVITY_CLIPS names, and the clip it resolves to is
   * whatever the loaded body ships under that name. A body whose file has no
   * such clip keeps whatever it was playing rather than freezing: `_play`
   * no-ops on a missing action, and `_restKey` is only moved once an action
   * actually exists, so the fallback is the idle it was already in.
   *
   * The action is built on first use rather than up front, because the twelve
   * never call this and building nine more AnimationActions apiece for them
   * would be nine mixers' worth of nothing.
   */
  playActivity(activity) {
    const wanted = ACTIVITY_CLIPS[activity];
    if (!wanted || !this._mixer) return;
    const key = `do:${activity}`;
    if (!this._actions[key]) {
      const clip = pickClip(this._clips, [wanted]);
      if (!clip) return;
      this._actions[key] = this._mixer.clipAction(clip);
    }
    this._restKey = key;
    this._play(key);
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
      this._play(this.talking ? 'greet' : this._restKey, { once: this.talking });
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
      // A patrol wraps; a route ends. An NPC that has arrived stands where the
      // last waypoint put it, at that waypoint's own height, and idles.
      if (this._waypointIndex + 1 < this._waypoints.length) this._waypointIndex += 1;
      else if (this._loop) this._waypointIndex = 0;
      else { this.group.position.copy(target); this._waypoints = []; this._play(this._restKey); }
      return;
    }

    to.normalize();
    this.group.position.addScaledVector(to, Math.min(this.speed * dt, dist));
    // The feet follow the floor the route was read off, rather than sliding up
    // a flight at a constant y: every waypoint carries the height of the cell
    // it is the centre of.
    this.group.position.y += Math.min(Math.abs(target.y - this.group.position.y), CLIMB_SPEED * dt) * Math.sign(target.y - this.group.position.y);
    this._targetYaw = Math.atan2(to.x, to.z);
    this._play('walk');
  }

  /** Stand here now, feet on `y`. Used to put the cast at its opening stations. */
  placeAt({ x, y = 0, z, facing = null }) {
    this.group.position.set(x, y, z);
    this._waypoints = [];
    this._loop = false;
    if (facing != null) { this.group.rotation.y = facing; this._targetYaw = facing; }
  }

  /**
   * Walk this route and stop at the end of it: `[{x, z, h}]` from
   * src/stations.js. An empty or one-point route means "you are already there",
   * and is a place rather than a walk.
   */
  walkTo(points) {
    const route = (points || []).map((p) => new THREE.Vector3(p.x, p.h ?? 0, p.z));
    if (route.length < 2) {
      if (route.length === 1) this.group.position.copy(route[0]);
      this._waypoints = [];
      return;
    }
    this._waypoints = route;
    this._loop = false;
    this._waypointIndex = 1; // [0] is the cell it is standing in
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

/**
 * Multiply every cloth material under `root` by `hex`. The materials are cloned
 * first: three.js shares them across every clone of a cached glTF, so tinting
 * in place would repaint everyone wearing the same body.
 */
function tintBody(root, hex) {
  const tint = new THREE.Color(hex);
  const swapped = new Map();
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = mats.map((mat) => {
      if (!mat) return mat;
      if (BARE_MATERIALS.some((re) => re.test(mat.name || ''))) return mat;
      if (!swapped.has(mat)) {
        const copy = mat.clone();
        copy.color.multiply(tint);
        swapped.set(mat, copy);
      }
      return swapped.get(mat);
    });
    obj.material = Array.isArray(obj.material) ? next : next[0];
  });
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
