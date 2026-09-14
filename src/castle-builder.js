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

/** One box of built stone: the plan's box, as the box it says it is. */
function buildBox(box, material, metres) {
  const w = box.max.x - box.min.x, h = box.max.y - box.min.y, d = box.max.z - box.min.z;
  const geo = secondUV(worldUVsOnBox(new THREE.BoxGeometry(w, h, d), w, h, d, metres));
  const m = mesh(geo, material);
  m.position.set((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  return m;
}

/**
 * One wall run: every box the plan cut it into. A solid run is one box and is
 * still one mesh; a run with a doorway is the stone either side of it and the
 * lintel over it, and those three boxes are the plan's, not this file's. The
 * group's bounds are the run's whole box because the lintel spans the opening,
 * which is what test/plan-vs-scene.mjs compares against.
 */
function buildRun(boxes, material, metres) {
  if (boxes.length === 1) return buildBox(boxes[0], material, metres);
  const group = new THREE.Group();
  for (const b of boxes) group.add(buildBox(b, material, metres));
  return group;
}

/**
 * A section of an annulus: the outer face, the inner face, and a flat ring at
 * each end of the y range that is not buried in the floor or in the section
 * above it. Four pieces at most, and every vertex sits at exactly the angles
 * three's CylinderGeometry puts them at, which is why a doorway's arc has to
 * start and end on a vertex (src/castle-plan.js's doorArc).
 */
function ringSection(inner, outer, y0, y1, thetaStart, thetaLength, segs, material, metres, caps) {
  const group = new THREE.Group();
  const h = y1 - y0, mid = (y0 + y1) / 2;
  for (const r of [outer, inner]) {
    const geo = secondUV(worldUVsOnCylinder(
      new THREE.CylinderGeometry(r, r, h, segs, 1, true, thetaStart, thetaLength),
      r, h, segs, metres));
    // The inner face is the same shell turned outside in, by reversing its
    // winding and negating its normals rather than by cloning the material with
    // `side: BackSide`. loadPBRMaterial hands back a material and fills its maps
    // in later, from three callbacks; a clone taken here would be a copy of the
    // untextured placeholder and would stay grey for the life of the page.
    if (r === inner) flipInward(geo);
    const m = mesh(geo, material);
    m.position.y = mid;
    group.add(m);
  }
  for (const y of caps) {
    const m = new THREE.Mesh(ringCap(inner, outer, y, thetaStart, thetaLength, segs, metres, y === y1), material);
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

/**
 * The flat annulus at the top of a ring section, and the soffit under a lintel.
 *
 * NOT `RingGeometry`, AND THAT IS NOT A PREFERENCE. RingGeometry lays its
 * vertices out as `(r cos t, r sin t)` in its own xy plane and has to be laid
 * flat by a rotation; CylinderGeometry lays its out as `(r sin t, r cos t)` in
 * xz and needs none. The two conventions differ by a quarter turn and a
 * reflection, so a ring given the shell's own `thetaStart` covers a different
 * quarter of the tower than the wall it is meant to cap — and it covers the
 * doorway, which is how this was found: deleting the lintel over a doorway on
 * purpose left test/plan-vs-scene.mjs green, because the misplaced cap was
 * holding the drum's bounds up from the wrong side (#34). Built from the same
 * `sin, cos` the shells and the plan's collider sectors use, the cap spans its
 * own arc and nothing else.
 */
function ringCap(inner, outer, y, thetaStart, thetaLength, segs, metres, up) {
  const pos = [], uvs = [], norm = [], idx = [];
  const step = thetaLength / segs;
  for (let i = 0; i <= segs; i++) {
    const t = thetaStart + i * step, sn = Math.sin(t), cs = Math.cos(t);
    for (const r of [inner, outer]) {
      pos.push(r * sn, y, r * cs);
      uvs.push((r * sn) / metres, (r * cs) / metres);
      norm.push(0, up ? 1 : -1, 0);
    }
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    if (up) idx.push(a, b, d, a, d, c);
    else idx.push(a, d, b, a, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setIndex(idx);
  return secondUV(geo);
}

/**
 * The face of stone at each side of a doorway cut through a ring. A 0.02 m box
 * rather than a plane, because the two jambs face opposite ways and a plane is
 * only visible from one of them.
 */
function ringJamb(inner, outer, height, theta, material) {
  const m = mesh(new THREE.BoxGeometry(outer - inner, height, 0.02), material);
  const t = theta * Math.PI / 180, r = (inner + outer) / 2;
  m.position.set(r * Math.sin(t), height / 2, r * Math.cos(t));
  m.rotation.y = t + Math.PI / 2;
  return m;
}

/** Turn a shell outside in: reverse every triangle and negate every normal. */
function flipInward(geo) {
  const idx = geo.index;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    idx.setX(i, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  idx.needsUpdate = true;
  const n = geo.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  n.needsUpdate = true;
  return geo;
}

/**
 * One drum: a solid cylinder on the tile the plan names, and a turret on the four
 * inner-ward ones. `radialSegments` comes from the plan, because the plan's
 * collider sectors are the boxes between these very vertices — the same polygon,
 * not two roundings of the same circle.
 */
function buildDrum(d, material, metres) {
  const group = new THREE.Group();
  if (d.inner) {
    // A ring, and a doorway in it. Everything but the doorway's arc runs the
    // tower's full height; over the doorway the same ring runs from the opening's
    // head to the top, which is the lintel and is what keeps the drum's bounds
    // exactly what the plan says they are.
    const step = 360 / d.segments;
    const arc = d.door ? d.door.arc : 0;
    const from = d.door ? d.door.from : 0;
    const wallSegs = d.segments - (d.door ? d.door.count : 0);
    const shell = new THREE.Group();
    if (wallSegs > 0) {
      shell.add(ringSection(d.inner, d.radius, 0, d.height,
        THREE.MathUtils.degToRad(from + arc), THREE.MathUtils.degToRad(360 - arc),
        wallSegs, material, metres, [d.height]));
    }
    if (d.door) {
      shell.add(ringSection(d.inner, d.radius, d.door.height, d.height,
        THREE.MathUtils.degToRad(from), THREE.MathUtils.degToRad(arc),
        d.door.count, material, metres, [d.door.height, d.height]));
      shell.add(ringJamb(d.inner, d.radius, d.door.height, from, material));
      shell.add(ringJamb(d.inner, d.radius, d.door.height, from + arc, material));
    }
    shell.position.set(d.cx, 0, d.cz);
    group.add(shell);
  } else {
    const geo = secondUV(worldUVsOnCylinder(
      new THREE.CylinderGeometry(d.radius, d.radius, d.height, d.segments),
      d.radius, d.height, d.segments, metres));
    const tower = mesh(geo, material);
    tower.position.set(d.cx, d.height / 2, d.cz);
    group.add(tower);
  }

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
function buildGround(box, material, metres, patch = false, disc = null) {
  const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
  // A tower's floor is round. 48 segments because a multiple of four puts a
  // vertex on each axis, which is what makes the disc's bounds exactly the square
  // the plan hands over.
  const geo = disc ? new THREE.CircleGeometry(disc.radius, 48) : new THREE.PlaneGeometry(w, d);
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
 * The cell's bars: uprights across the opening and a rail top and bottom, inside
 * the plate the plan measured. The two outer uprights are flush with its ends and
 * the rails span it, so the group's bounds are that plate exactly.
 */
function buildBars({ width, height, thickness, count }, material) {
  const group = new THREE.Group();
  const bar = thickness;
  const span = width - bar;
  for (let i = 0; i < count; i++) {
    const g = new THREE.BoxGeometry(bar, height, bar);
    const m = mesh(g, material);
    m.position.set(-span / 2 + (span * i) / (count - 1), height / 2, 0);
    group.add(m);
  }
  for (const y of [height - bar / 2, bar / 2]) {
    const m = mesh(new THREE.BoxGeometry(width, bar, thickness), material);
    m.position.set(0, y, 0);
    group.add(m);
  }
  return group;
}

/** A built prop with no model: a box of a named size. */
function buildSlab(box, material) {
  const w = box.max.x - box.min.x, h = box.max.y - box.min.y, d = box.max.z - box.min.z;
  const m = mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  return m;
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

  /**
   * One MeshStandardMaterial per named stone, shared by every piece using it.
   * `plainMaterials` are the colour-only ones — the cell's bars and the cloak —
   * which have no texture set on disk and are kept out of `materials` so that
   * section can go on meaning "a complete diffuse, normal and arm/rough set".
   */
  material(name) {
    if (!this.materials.has(name)) {
      const spec = this.config.materials[name];
      const plain = this.config.plainMaterials && this.config.plainMaterials[name];
      if (!spec && !plain) throw new Error(`[Castle Conundrum] no material named "${name}" in scene-config.json`);
      this.materials.set(name, spec
        ? loadPBRMaterial(spec, 1, spec.fallbackColor || '#8a8175')
        : new THREE.MeshStandardMaterial({
            color: plain.color,
            roughness: plain.roughness ?? 1,
            metalness: plain.metalness ?? 0,
          }));
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
      // A run may carry its own texture repeat: the interior partitions are 1 m
      // of wall between two rooms and want a smaller course than a 4 m curtain.
      const repeat = piece.repeatMetres || metres;
      if (piece.built === 'run') obj = buildRun(piece.boxes, this.material(piece.material), repeat);
      else if (piece.built === 'drum') obj = buildDrum(piece.drum, this.material(piece.material), metres);
      else if (piece.built === 'ground') obj = buildGround(piece.box, this.material(piece.material), repeat, !!piece.patch, piece.disc);
      else if (piece.built === 'gate-leaf') obj = buildGateLeaf(piece.leaf, this.material(piece.material));
      else if (piece.built === 'bars') obj = buildBars(piece.bars, this.material(piece.material));
      else if (piece.built === 'slab') obj = buildSlab(piece.box, this.material(piece.material));
      else obj = await loadModel(piece.model);

      obj.userData.planId = piece.id;

      if (piece.built === 'run' || piece.built === 'drum' || piece.built === 'ground' || piece.built === 'slab') {
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
          // Every collider the shut leaf is standing in for. A gate in a wall is
          // its own box; a door in a tower ring is the ring sectors the doorway
          // was cut from, put back while it is shut.
          blocks: (spec.blocks || []).map((id) => this.colliders.find((c) => c.id === id)).filter(Boolean),
          // 90 degrees, not the 105 this swung when the leaf was a sphere. A ball
          // does not care how far past flush it goes; a 1.9 m leaf hinged 0.95 m off
          // centre in a 2.0 m opening does — at 105 its outer corner ends up 0.44 m
          // inside the west jamb and all you see of an opened gate is a dark edge.
          // At 90 it stands flat against the jamb with 0.03 m of its thickness in
          // the stone, which is inside the jamb's own relief. test/assets.mjs holds
          // the angle to what the opening can actually take.
          lock: spec.lock || null,
          centre: spec.centre ? new THREE.Vector3(...spec.centre) : null,
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

  /** Call from the render loop. Animates any gate that is opening. */
  update(dt) {
    for (const gd of this.gates.values()) {
      if (!gd.opening || gd.progress >= 1) continue;
      gd.progress = Math.min(1, gd.progress + dt * 0.4);
      const eased = 1 - Math.pow(1 - gd.progress, 3);
      gd.pivot.rotation.y = THREE.MathUtils.lerp(gd.closedAngle, gd.openAngle, eased);
      if (gd.progress >= 0.25 && gd.blocks.length) {
        // stop blocking the player once it's meaningfully open
        for (const c of gd.blocks) {
          const i = this.colliders.indexOf(c);
          if (i !== -1) this.colliders.splice(i, 1);
        }
        gd.blocks = [];
      }
    }
  }

  /**
   * Every word-locked door, as something InteractionSystem can put a prompt on.
   * The muniment room's is the only one: the riddle is carved over its lock, and
   * pressing E at it is what `lock:muniment` in data/quest.json listens for.
   * A door that has been answered stops offering itself.
   */
  locks() {
    const out = [];
    for (const gd of this.gates.values()) {
      if (!gd.lock) continue;
      out.push({
        id: gd.id,
        isLock: true,
        name: gd.id,
        prompt: gd.lock,
        group: gd.pivot,
        focus: gd.centre,
        get active() { return !gd.opening && gd.progress < 1; },
      });
    }
    return out;
  }

  /**
   * Open the leaf a quest hook names. `openGate()` with no argument is the
   * quest's `openGate` action, and it means the leaf whose `quest` is "gate".
   * From Phase 4 that is the muniment room's word-locked door in the King's
   * Tower, not the east gate: the riddle is the word-lock now, and both barbican
   * gates are gates that never open again (WISHLIST.md's answered question 5).
   */
  openGate(quest = 'gate') {
    for (const gd of this.gates.values()) {
      if (gd.quest === quest) gd.opening = true;
    }
  }
}
