// castle-builder.js — turns data/scene-config.json into placed geometry.
// All placement data lives in JSON; this file only interprets it.
// Also builds the static collision list (world-space AABBs) and the animated gate door.

import * as THREE from 'three';
import { loadModel } from './assets.js';

const _box = new THREE.Box3();

// How much of an interior prop's footprint a surface has to cover before that
// surface counts as holding it up. See surfaceHeightUnder().
const SURFACE_COVERAGE = 0.5;

export class CastleBuilder {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.tile = config.tileSize;
    this.colliders = []; // { box: THREE.Box3, id?: string }
    this.gateDoor = null; // { pivot, openAngle, state }
  }

  tileToWorld(tx, tz) {
    return new THREE.Vector3(tx * this.tile, 0, tz * this.tile);
  }

  /**
   * Scale a loaded modular wall/tower piece so its depth (Z) equals tileSize.
   * Every piece in the kit — wall, wall-half, wall-low, tower, the fortified
   * gate — is authored 1 unit deep; a "half" piece is half-WIDTH (X) or
   * half-HEIGHT (Y), never half-depth. Scaling off Z therefore gives every
   * piece the same 4x factor and every "half" dimension comes out to exactly
   * half a tile, matching how the wallRuns below space them.
   *
   * This used to scale off size.x, which is correct for every piece except
   * wall-half.glb (0.5 wide, 1 deep): its X is the odd one out, so scaling
   * from it gave wall-half.glb an 8x factor instead of 4x — 4m wide (right),
   * but 8m tall and 8m deep, half the texel density of every other wall and
   * an 8m-thick partition where every other wall in the castle is 4m.
   */
  normalizeToTile(obj) {
    _box.setFromObject(obj);
    const size = new THREE.Vector3();
    _box.getSize(size);
    if (size.z > 0.0001) {
      const s = this.tile / size.z;
      obj.scale.setScalar(s);
    }
    // sit on the ground
    _box.setFromObject(obj);
    obj.position.y -= _box.min.y;
  }

  groundAndCenter(obj) {
    _box.setFromObject(obj);
    obj.position.y -= _box.min.y;
  }

  /**
   * Scale a loaded model so its height equals tileSize (for the hall columns).
   * column.glb is 0.2 x 1 x 0.2 in model units -- neither normalizeToTile's
   * width-driven scale (20x, an absurd 4m-thick stub) nor leaving it at native
   * scale (a 1m, 20cm-thick stub, out of frame in every screenshot) is right.
   * Scaling to the same height as a wall tile makes it read as a floor-to-
   * ceiling support post, which is what a "hall column" is supposed to be.
   */
  normalizeHeight(obj) {
    _box.setFromObject(obj);
    const size = new THREE.Vector3();
    _box.getSize(size);
    if (size.y > 0.0001) obj.scale.setScalar(this.tile / size.y);
    _box.setFromObject(obj);
    obj.position.y -= _box.min.y;
  }

  /**
   * Height of the highest already-placed surface this object is standing on, or 0
   * for "nothing under it, stand it on the ground".
   *
   * Overlap is a real 2D rectangle test, not a centre-point test: the brass
   * candleholders are a 1.08 m spread of three separate candlesticks, so a centre
   * hit says nothing about whether the outer two have anything beneath them.
   *
   * But bare overlap is not enough either, and getting that wrong is visible from
   * the first frame. The gothic statue stands on the floor 1.4 m behind the hall
   * table and its 1.56 m footprint clips the table's by 0.12 m, so an any-overlap
   * rule stands the statue on the table; the statue then becomes a 2.29 m surface
   * that the candleholders clip by 4 cm, and they go on top of *that*. A surface
   * has to be under most of the object to be holding it up, hence SURFACE_COVERAGE.
   */
  surfaceHeightUnder(surfaces, obj) {
    if (!surfaces.length) return 0;
    obj.updateMatrixWorld(true);
    const own = new THREE.Box3().setFromObject(obj);
    const area = Math.max(1e-6, (own.max.x - own.min.x) * (own.max.z - own.min.z));
    let best = 0;
    for (const s of surfaces) {
      const ox = Math.min(s.max.x, own.max.x) - Math.max(s.min.x, own.min.x);
      const oz = Math.min(s.max.z, own.max.z) - Math.max(s.min.z, own.min.z);
      if (ox <= 0 || oz <= 0) continue;
      if ((ox * oz) / area < SURFACE_COVERAGE) continue;
      if (s.max.y > best) best = s.max.y;
    }
    return best;
  }

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
    const c = this.config.courtyard;
    const kBase = this.config.kenneyBase;
    const pBase = this.config.polyhavenBase;

    // --- Wall runs (Kenney modular pieces, tiled) ---
    for (const run of c.wallRuns) {
      for (let i = 0; i < run.count; i++) {
        const tx = run.start[0] + run.step[0] * i;
        const tz = run.start[1] + run.step[1] * i;
        const piece = await loadModel(kBase + run.model);
        this.normalizeToTile(piece);
        piece.rotation.y = THREE.MathUtils.degToRad(run.rotationY || 0);
        const pos = this.tileToWorld(tx, tz);
        piece.position.x = pos.x;
        piece.position.z = pos.z;
        this.scene.add(piece);
        this.addCollider(piece);
      }
    }

    // --- Individual placements (towers, gate arch, props, trees) ---
    for (const p of c.placements) {
      const obj = await loadModel(kBase + p.model);
      if (p.model.startsWith('tower') || p.model.startsWith('wall')) {
        this.normalizeToTile(obj);
      } else if (p.model.startsWith('column')) {
        this.normalizeHeight(obj);
      } else {
        this.groundAndCenter(obj);
      }
      obj.rotation.y = THREE.MathUtils.degToRad(p.rotationY || 0);
      const pos = this.tileToWorld(p.tile[0], p.tile[1]);
      obj.position.x = pos.x;
      obj.position.z = pos.z;
      this.scene.add(obj);
      if (!p.noCollide) this.addCollider(obj, p.id);
    }

    // --- Gate door (Poly Haven mesh inside the archway, hinged to swing open) ---
    const g = this.config.gateDoor;
    const doorModel = await loadModel(pBase + g.model);
    this.groundAndCenter(doorModel);

    // Hinge pivot at the door's left edge so it swings like a real gate
    _box.setFromObject(doorModel);
    const size = new THREE.Vector3();
    _box.getSize(size);
    // If the gate model is tiny or huge relative to the archway, scale to ~tile width
    if (size.x > 0.0001 && (size.x < this.tile * 0.5 || size.x > this.tile * 1.3)) {
      doorModel.scale.multiplyScalar((this.tile * 0.9) / size.x);
      this.groundAndCenter(doorModel);
      _box.setFromObject(doorModel);
      _box.getSize(size);
    }

    const pivot = new THREE.Group();
    const gatePos = this.tileToWorld(g.tile[0], g.tile[1]);
    const rotY = THREE.MathUtils.degToRad(g.rotationY || 0);
    // The door leaf hangs off the hinge along the pivot's local +X (set below), so
    // closing it sweeps world offset [0, size.x] through R(rotY) — that range's
    // world-space midpoint is `size.x/2` rotated by rotY, not size.x/2 along world
    // X unconditionally. `gatePos.x - size.x / 2` (no rotation term) is only that
    // midpoint for rotY = 0. This config's gate uses rotY = 180 (matching every
    // wallRun flanking it, which all rotate 180 too, to face their faces into the
    // archway) and the un-rotated formula put the whole leaf on the wrong side of
    // 0 in world X entirely: world x [-5.4, -1.8] against a centered [-2, 2]
    // archway, never crossing it at any point in the swing. Solving for the pivot
    // that keeps the leaf's world-space midpoint AT the archway center for any
    // rotY gives cos/sin of it instead.
    pivot.position.set(
      gatePos.x - (size.x / 2) * Math.cos(rotY),
      0,
      gatePos.z + (size.x / 2) * Math.sin(rotY)
    );
    pivot.rotation.y = rotY;
    doorModel.position.x = size.x / 2; // door hangs off the hinge
    pivot.add(doorModel);
    this.scene.add(pivot);

    const doorCollider = this.addCollider(pivot, 'gate-door');
    this.gateDoor = {
      pivot,
      collider: doorCollider,
      closedAngle: pivot.rotation.y,
      openAngle: pivot.rotation.y + THREE.MathUtils.degToRad(105),
      progress: 0,
      opening: false,
    };

    // --- Interior Poly Haven props ---
    // Placed in config order, and each one can stand on anything placed before it.
    // `yOffset` is a lift ABOVE whatever surface is found underneath, not an
    // absolute height: the lantern and the candleholders used to carry
    // `yOffset: 0.95` with a comment calling it "a table-height guess, tune after
    // first load", and nobody ever tuned it. The table is 0.55 m tall, so they
    // hung 0.40 m in the air. Measuring the surface removes the guess.
    const surfaces = [];
    for (const p of this.config.interiorProps) {
      const obj = await loadModel(pBase + p.model);
      this.groundAndCenter(obj);
      obj.rotation.y = THREE.MathUtils.degToRad(p.rotationY || 0);
      const pos = this.tileToWorld(p.tile[0], p.tile[1]);
      obj.position.x = pos.x;
      obj.position.z = pos.z;
      obj.position.y += this.surfaceHeightUnder(surfaces, obj) + (p.yOffset || 0);
      this.scene.add(obj);
      if (!p.noCollide) {
        this.addCollider(obj);
        obj.updateMatrixWorld(true);
        surfaces.push(new THREE.Box3().setFromObject(obj));
      }
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
