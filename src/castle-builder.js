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

/* ------------------------------------------------- built stone and its UVs ---
 *
 * Phase 3's curtain, cross-wall, barbicans and drums are BoxGeometry and
 * CylinderGeometry carrying a Poly Haven map, not kit pieces. What makes that
 * read as coursed stone rather than as one smeared photograph is the repeat, and
 * the repeat has to be WORLD-SPACE: every geometry here gets its UVs multiplied
 * by its own metres divided by `repeatMetres`, so a 4 m tile shows 1.33 repeats
 * of the 1k map and a 20 m run shows 6.67, instead of both showing one. Setting
 * `texture.repeat` cannot do this — the material is shared by every piece that
 * names the same stone, and a shared texture has one repeat for all of them.
 */

/** BoxGeometry's 24 vertices are four per face, in the order +x -x +y -y +z -z. */
function worldUVsOnBox(geo, w, h, d, metres) {
  const uv = geo.attributes.uv;
  const spans = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    const [su, sv] = spans[face];
    for (let i = face * 4; i < face * 4 + 4; i++) {
      uv.setXY(i, uv.getX(i) * (su / metres), uv.getY(i) * (sv / metres));
    }
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * CylinderGeometry's side runs u 0..1 once round and v 0..1 up; its caps carry
 * their own disc UVs. With heightSegments 1 the side owns the first
 * `(radialSegments + 1) * 2` vertices and the caps everything after, so the two
 * can be scaled by the things they actually measure — circumference and height
 * for the wall, diameter for the roof.
 */
function worldUVsOnCylinder(geo, radius, height, radialSegments, metres) {
  const uv = geo.attributes.uv;
  const side = (radialSegments + 1) * 2;
  const around = (2 * Math.PI * radius) / metres, up = height / metres, across = (2 * radius) / metres;
  for (let i = 0; i < uv.count; i++) {
    if (i < side) uv.setXY(i, uv.getX(i) * around, uv.getY(i) * up);
    else uv.setXY(i, (uv.getX(i) - 0.5) * across + 0.5, (uv.getY(i) - 0.5) * across + 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

/** aoMap reads the second UV set, which three calls `uv1` at r169 and `uv2` before it. */
function secondUV(geo) {
  geo.setAttribute('uv1', geo.attributes.uv);
  geo.setAttribute('uv2', geo.attributes.uv);
  return geo;
}

function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** One wall run: the plan's box, as the box it says it is. */
function buildRun(box, material, metres) {
  const w = box.max.x - box.min.x, h = box.max.y - box.min.y, d = box.max.z - box.min.z;
  const geo = secondUV(worldUVsOnBox(new THREE.BoxGeometry(w, h, d), w, h, d, metres));
  const m = mesh(geo, material);
  m.position.set((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  return m;
}

/**
 * One drum: a solid cylinder on the tile the plan names, and a turret on the four
 * inner-ward ones. `radialSegments` comes from the plan, because the plan's
 * collider sectors are the boxes between these very vertices — the same polygon,
 * not two roundings of the same circle.
 */
function buildDrum(d, material, metres) {
  const group = new THREE.Group();
  const geo = secondUV(worldUVsOnCylinder(
    new THREE.CylinderGeometry(d.radius, d.radius, d.height, d.segments),
    d.radius, d.height, d.segments, metres));
  const tower = mesh(geo, material);
  tower.position.set(d.cx, d.height / 2, d.cz);
  group.add(tower);

  if (d.turret) {
    const t = d.turret;
    const tg = secondUV(worldUVsOnCylinder(
      new THREE.CylinderGeometry(t.radius, t.radius, t.height, d.segments),
      t.radius, t.height, d.segments, metres));
    const cap = mesh(tg, material);
    cap.position.set(d.cx, t.base + t.height / 2, d.cz);
    group.add(cap);
  }
  return group;
}

/**
 * A ground plane, flat at y 0, sized by the plan.
 *
 * A PATCH IS COPLANAR WITH THE BASE, AND THE OFFSET IS INSURANCE, NOT A FIX. The
 * outer ward's grassy cobbles lie on the pavers at exactly the same y. Under the
 * software rasterizer test/plan-vs-scene.mjs runs on, the patch wins the depth
 * test on its own and the two wards render as the two surfaces they are; this
 * offset is here because "wins on the machine I measured" is not a property of
 * coplanar geometry, and #53 says a render read off this rasterizer is not
 * evidence about a GPU. Raising the patch a centimetre instead would fix the
 * draw on every machine and break the walkability grid, which dedupes floors
 * within 1e-6 m and would read 0.01 m as a second storey over the whole outer
 * ward. Offsetting the depth value moves nothing: the plan box, the surface and
 * the collider grid all still see one floor at y 0.
 */
function buildGround(box, material, metres, patch = false) {
  const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
  const geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / metres), uv.getY(i) * (d / metres));
  uv.needsUpdate = true;
  secondUV(geo);
  const m = new THREE.Mesh(geo, material);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  m.position.set((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2);
  if (patch) {
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -1;
    m.renderOrder = 1;
  }
  return m;
}

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
  out.add(config.kenneyBase + config.battlements.model);
  for (const g of config.gates) out.add(config.kenneyBase + g.archModel);
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
    this.gates = new Map(); // id -> { pivot, closedAngle, openAngle, progress, opening }
    this.materials = new Map(); // material name -> MeshStandardMaterial
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

  /** One MeshStandardMaterial per named stone, shared by every piece using it. */
  material(name) {
    if (!this.materials.has(name)) {
      const spec = this.config.materials[name];
      if (!spec) throw new Error(`[Castle Conundrum] no material named "${name}" in scene-config.json`);
      this.materials.set(name, loadPBRMaterial(spec, 1, spec.fallbackColor || '#8a8175'));
    }
    return this.materials.get(name);
  }

  async build() {
    this.plan = makePlan(this.config, await this.measure());
    // The player walks into the plan's boxes. Nothing here re-measures them.
    this.colliders = this.plan.colliders.map((c) => ({ id: c.id, box: c.box }));
    const metres = this.config.repeatMetres;

    for (const piece of this.plan.pieces) {
      let obj;
      if (piece.built === 'run') obj = buildRun(piece.box, this.material(piece.material), metres);
      else if (piece.built === 'drum') obj = buildDrum(piece.drum, this.material(piece.material), metres);
      else if (piece.built === 'ground') obj = buildGround(piece.box, this.material(piece.material), metres, !!piece.patch);
      else if (piece.built === 'gate-leaf') obj = buildGateLeaf(this.gateLeafOf(piece.id), this.material(piece.material));
      else obj = await loadModel(piece.model);

      obj.userData.planId = piece.id;

      if (piece.built === 'run' || piece.built === 'drum' || piece.built === 'ground') {
        // These carry their world position inside their own geometry, so the
        // plan's transform is the identity and there is nothing to apply.
        this.scene.add(obj);
        continue;
      }

      const t = piece.transform;
      obj.scale.setScalar(t.scale);
      obj.rotation.y = THREE.MathUtils.degToRad(t.rotationY);

      if (piece.kind === 'gate-leaf') {
        // The leaf hangs off a hinge at its own left edge so it swings like a
        // real gate. The pivot carries the rotation; the leaf sits half a width
        // along the pivot's local +X. See the plan's gate block for why the
        // hinge position needs the cos/sin terms at any rotationY but 0.
        const pivot = new THREE.Group();
        pivot.position.set(...piece.pivot.position);
        pivot.rotation.y = THREE.MathUtils.degToRad(piece.pivot.rotationY);
        obj.rotation.y = 0; // the pivot owns the rotation now
        obj.position.set(...piece.pivot.offset);
        pivot.add(obj);
        this.scene.add(pivot);

        const spec = this.plan.gates.find((g) => g.id === piece.id);
        this.gates.set(piece.id, {
          id: piece.id, quest: spec.quest, pivot,
          collider: this.colliders.find((c) => c.id === piece.id) || null,
          // 90 degrees, not the 105 this swung when the leaf was a sphere. A ball
          // does not care how far past flush it goes; a 1.9 m leaf hinged 0.95 m off
          // centre in a 2.0 m opening does — at 105 its outer corner ends up 0.44 m
          // inside the west jamb and all you see of an opened gate is a dark edge.
          // At 90 it stands flat against the jamb with 0.03 m of its thickness in
          // the stone, which is inside the jamb's own relief. test/assets.mjs holds
          // the angle to what the opening can actually take.
          closedAngle: THREE.MathUtils.degToRad(spec.shutAngle),
          openAngle: THREE.MathUtils.degToRad(spec.openAngle),
          // A gate the plan placed open is already there; only a shut one animates.
          progress: spec.closed ? 0 : 1,
          opening: false,
        });
        continue;
      }

      obj.position.set(t.position[0], t.position[1], t.position[2]);
      this.scene.add(obj);
    }

    return this;
  }

  /** The `leaf` block of the gate a plan piece came from. */
  gateLeafOf(id) {
    const g = this.config.gates.find((x) => x.id === id);
    if (!g) throw new Error(`[Castle Conundrum] the plan placed a leaf for "${id}", which config.gates does not name`);
    return g.leaf;
  }

  /** Call from the render loop. Animates any gate that is opening. */
  update(dt) {
    for (const gd of this.gates.values()) {
      if (!gd.opening || gd.progress >= 1) continue;
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

  /**
   * Open the gate a quest hook names. `openGate()` with no argument is the
   * riddle quest's `openGate` action, and it means the leaf whose `quest` is
   * "gate" — the east gate onto the walled garden. The west gate carries no
   * quest at all: the clerk came in through it and the way out of the castle
   * does not open again (WISHLIST.md's answered question 5).
   */
  openGate(quest = 'gate') {
    for (const gd of this.gates.values()) {
      if (gd.quest === quest) gd.opening = true;
    }
  }
}
