// castle-builder.js — loads what src/castle-plan.js says to load, and puts it
// where the plan says to put it.
//
// It computes no transform of its own. Every position, rotation, scale and
// collider box in this file comes out of `makePlan`, which `test/layout.mjs`
// reads too, so the suite and the running game cannot disagree about where a
// wall is. Until 2026-09-14 `layout.mjs` re-implemented this file's placement
// math in Node and said in its own header that it therefore could not catch a
// change to it; that whole class of blind spot is what the plan removes.
//
// What is still this file's: loading models, building the gate leaf, the
// hinge's scene graph, and the gate's animation.

import * as THREE from 'three';
import { loadModel, loadPBRMaterial } from './assets.js';
import { makePlan, tileToWorld } from './castle-plan.js';

/**
 * The gate leaf: a plank door shaped to the archway it hangs in — a rectangle up
 * to `springline`, capped by a semicircle of `archRadius`. Centred on local x=0
 * and grounded at y=0, which is what the hinge math expects.
 *
 * BUILT RATHER THAN LOADED, and that is the fix rather than an economy. The
 * config used to name `wooden_gate_1k.gltf` as the door's model. Poly Haven ship
 * a material-preview ball with every TEXTURE pack — one node called
 * `sphere_gltf`, one mesh called `Sphere.001` — and wooden_gate is a texture
 * pack, so the archway held a 1.93-unit sphere, auto-scaled to 3.6 m across
 * (`tile * 0.9`) because it read as "tiny relative to the archway", grounded,
 * hinged and swung 105 degrees on quest completion. Twenty of the forty-eight
 * Poly Haven folders this project vendored were texture packs carrying that same
 * ball; this was the only one the scene config loaded as a model. Thirty-six of
 * the forty-eight were referenced by nothing at all, and both groups are gone
 * (2026-09-14, the asset diet): twelve folders remain, ten of them models, and
 * the two texture-only ones — stone_pavers and wooden_gate — keep their
 * `textures/` and not the ball. test/assets.mjs fails if a preview ball is ever
 * loaded as a model again, and now also if an unreferenced byte reappears.
 *
 * The auto-scale branch went with it. It existed to rescue a model of unknown
 * size; these dimensions come from the archway's own measured opening, so
 * scaling them to 90% of a tile would only undo the fit.
 *
 * UVs are a planar projection of the shape, not ExtrudeGeometry's default. The
 * default hands back the shape's own coordinates, which run -0.95..0.95 across
 * and 0..2.95 up: with RepeatWrapping that tiles a single 1k gate two across and
 * three up. One gate, once, is the point of the map.
 *
 * `castle-plan.js`'s `gateLeafParts` describes this same shape as one box from
 * the same four numbers. If the outline here stops being "width by
 * springline + archRadius by thickness", that function changes with it.
 */
function buildGateLeaf({ width, springline, archRadius, thickness }, material) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(half, springline);
  shape.absarc(0, springline, archRadius, 0, Math.PI, false);
  shape.lineTo(-half, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: false, curveSegments: 24,
  });
  geo.translate(0, 0, -thickness / 2); // hang the leaf on the archway's centre plane

  const apex = springline + archRadius;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + half) / width, pos.getY(i) / apex);
  }
  uv.needsUpdate = true;

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

/**
 * `boundsOf` for the browser: every mesh under a freshly loaded model, as its
 * own `geometry.boundingBox` plus the matrix its node chain gives it, both in
 * the model's own root space.
 *
 * This is the shape `Box3.setFromObject` consumes internally, handed to the
 * plan so the plan can produce the same answer without a live object. Not a
 * single box: three unions per-mesh corner-transformed boxes rather than
 * measuring vertices, so one box cannot reproduce a rotated model's runtime
 * bounds. `test/gltf.mjs`'s `partsOf` is the Node half and carries the
 * measurements.
 */
function partsOfObject(root) {
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const parts = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    local.multiplyMatrices(toRoot, o.matrixWorld);
    parts.push({
      min: { x: bb.min.x, y: bb.min.y, z: bb.min.z },
      max: { x: bb.max.x, y: bb.max.y, z: bb.max.z },
      matrix: local.elements.slice(),
    });
  });
  return { parts };
}

/** Every model path `makePlan` will ask about, once each. */
function modelPaths(config) {
  const out = new Set();
  for (const run of config.courtyard.wallRuns) out.add(config.kenneyBase + run.model);
  for (const p of config.courtyard.placements) out.add(config.kenneyBase + p.model);
  for (const p of config.interiorProps) out.add(config.polyhavenBase + p.model);
  return [...out];
}

export class CastleBuilder {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.tile = config.tileSize;
    this.plan = null;
    this.colliders = []; // { box: {min,max} | THREE.Box3, id?: string }
    this.gateDoor = null; // { pivot, openAngle, state }
  }

  tileToWorld(tx, tz) {
    const [x, y, z] = tileToWorld(this.tile, tx, tz);
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Load every model the config names and measure it, then hand the plan a
   * `boundsOf` that answers from those measurements. Loads go through
   * `loadGLTF`'s cache, so the second pass below re-clones rather than re-fetches.
   */
  async measure() {
    const measured = new Map();
    for (const path of modelPaths(this.config)) {
      measured.set(path, partsOfObject(await loadModel(path)));
    }
    return (path) => {
      const parts = measured.get(path);
      if (!parts) throw new Error(`[Castle Conundrum] the plan asked for "${path}", which the config never named`);
      return parts;
    };
  }

  /** Register something built at runtime rather than placed by the plan. */
  addCollider(obj, id = undefined) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    // don't let paper-thin or ground-hugging decor block movement
    if (box.max.y - box.min.y < 0.3) return null;
    const entry = { box, id };
    this.colliders.push(entry);
    return entry;
  }

  async build() {
    this.plan = makePlan(this.config, await this.measure());
    // The player walks into the plan's boxes. Nothing here re-measures them.
    this.colliders = this.plan.colliders.map((c) => ({ id: c.id, box: c.box }));

    for (const piece of this.plan.pieces) {
      const obj = piece.built === 'gate-leaf'
        ? buildGateLeaf(this.config.gateDoor.leaf, loadPBRMaterial(this.config.gateDoor.textures))
        : await loadModel(piece.model);
      const t = piece.transform;
      obj.scale.setScalar(t.scale);
      obj.rotation.y = THREE.MathUtils.degToRad(t.rotationY);
      obj.userData.planId = piece.id;

      if (piece.kind === 'gate-leaf') {
        // The leaf hangs off a hinge at its own left edge so it swings like a
        // real gate. The pivot carries the rotation; the leaf sits half a width
        // along the pivot's local +X. See the plan's gate-leaf block for why the
        // hinge position needs the cos/sin terms at any rotationY but 0.
        const pivot = new THREE.Group();
        pivot.position.set(...piece.pivot.position);
        pivot.rotation.y = THREE.MathUtils.degToRad(piece.pivot.rotationY);
        obj.rotation.y = 0; // the pivot owns the rotation now
        obj.position.set(...piece.pivot.offset);
        pivot.add(obj);
        this.scene.add(pivot);
        this.gateDoor = {
          pivot,
          collider: this.colliders.find((c) => c.id === 'gate-door') || null,
          closedAngle: pivot.rotation.y,
          // 90 degrees, not the 105 this swung when the leaf was a sphere. A ball
          // does not care how far past flush it goes; a 1.9 m leaf hinged 0.95 m off
          // centre in a 2.0 m opening does — at 105 its outer corner ends up 0.44 m
          // inside the west jamb and all you see of an opened gate is a dark edge.
          // At 90 it stands flat against the jamb with 0.03 m of its thickness in
          // the stone, which is inside the jamb's own relief. test/assets.mjs holds
          // the angle to what the opening can actually take.
          openAngle: pivot.rotation.y + THREE.MathUtils.degToRad(this.config.gateDoor.openDegrees),
          progress: 0,
          opening: false,
        };
        continue;
      }

      obj.position.set(t.position[0], t.position[1], t.position[2]);
      this.scene.add(obj);
    }

    return this;
  }

  /** Call from the render loop. Animates the gate when opening. */
  update(dt) {
    const gd = this.gateDoor;
    if (gd && gd.opening && gd.progress < 1) {
      gd.progress = Math.min(1, gd.progress + dt * 0.4);
      const eased = 1 - Math.pow(1 - gd.progress, 3);
      gd.pivot.rotation.y = THREE.MathUtils.lerp(gd.closedAngle, gd.openAngle, eased);
      if (gd.progress >= 0.25 && gd.collider) {
        // stop blocking the player once it's meaningfully open
        const i = this.colliders.indexOf(gd.collider);
        if (i !== -1) this.colliders.splice(i, 1);
        gd.collider = null;
      }
    }
  }

  openGate() {
    if (this.gateDoor) this.gateDoor.opening = true;
  }
}
