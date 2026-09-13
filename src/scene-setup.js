// scene-setup.js — renderer, camera, lighting, fog, ground plane, audio stub.

import * as THREE from 'three';
import { loadPBRMaterial, setTextureQuality } from './assets.js';

export function createScene(config) {
  const scene = new THREE.Scene();

  // Fog / sky tint
  const fogCfg = config.lighting.fog;
  scene.fog = new THREE.Fog(fogCfg.color, fogCfg.near, fogCfg.far);
  scene.background = new THREE.Color(fogCfg.color);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  // Before the ground plane below and before castle-builder loads a single model:
  // assets.js tunes each texture as it arrives, so anything that loads earlier
  // than this keeps the anisotropy 1 / LinearFilter defaults that made the walls
  // blurry in the first place.
  setTextureQuality(renderer);

  // Camera
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(...config.spawn.position);
  camera.lookAt(new THREE.Vector3(...config.spawn.lookAt));

  // Ambient audio hook point (silent for now — ready for footsteps/ambience later)
  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);

  // Lights
  const sunCfg = config.lighting.sun;
  const sun = new THREE.DirectionalLight(sunCfg.color, sunCfg.intensity);
  sun.position.set(...sunCfg.position);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.far = 150;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  const hemiCfg = config.lighting.hemisphere;
  const hemi = new THREE.HemisphereLight(hemiCfg.skyColor, hemiCfg.groundColor, hemiCfg.intensity);
  scene.add(hemi);

  // Ground plane
  const groundMat = loadPBRMaterial(
    config.ground.textures,
    config.ground.textureRepeat,
    config.ground.fallbackColor
  );
  const groundGeo = new THREE.PlaneGeometry(config.ground.size, config.ground.size);
  groundGeo.setAttribute('uv2', groundGeo.attributes.uv); // for aoMap
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Resize handling
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, renderer, camera, audioListener };
}

// Brazier proportions. BOWL_Y is the rim height, which is also where the light
// and the coals sit, so moving the stand moves all three together.
const BOWL_Y = 1.06;
const BOWL_R = 0.29;

/**
 * A flickering brazier: iron tripod, bowl, coals in the bowl, point light at the
 * rim. Returns the per-frame update fn.
 *
 * This used to be a bare 0.12 m emissive sphere hanging at y = 1.3 with nothing
 * underneath it, which is the "braziers read as floating / unsupported" item open
 * since v6 §10. The light itself was never the problem — it is 4 cm from where it
 * was, so the lighting of the courtyard is unchanged — the problem was that
 * nothing held it up.
 *
 * Built from primitives rather than a model: the Kenney kit has no brazier, and
 * the Poly Haven vessels would turn a synchronous call into an async one for
 * three objects the player never gets closer than about 2 m to.
 *
 * Takes the CastleBuilder rather than a bare scene so the stand can register
 * itself in castle.colliders the same way every other piece of scenery does.
 * The bare coal sphere this replaced had no collider either, so this closes a
 * pre-existing hole rather than opening one: a player could always walk
 * through where a brazier visually stood.
 */
export function createBrazier(castle, position) {
  const scene = castle.scene;
  const stand = new THREE.Group();
  stand.position.copy(position);

  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2521, roughness: 0.72, metalness: 0.55 });
  const add = (mesh, x, y, z) => {
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    stand.add(mesh);
    return mesh;
  };

  // Three splayed legs. Feet sit wider than the bowl so the thing reads as
  // standing on the ground rather than balancing on a point.
  const legH = BOWL_Y - 0.08;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const leg = add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.042, legH, 6), iron),
      Math.cos(a) * 0.105, legH / 2, Math.sin(a) * 0.105
    );
    // lean each leg outward so the feet land at ~0.21 m and the tops meet the bowl
    leg.rotation.z = -Math.cos(a) * 0.19;
    leg.rotation.x = Math.sin(a) * 0.19;
  }

  // Brace ring low down, and the bowl itself: an open flared cylinder with a base.
  add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.016, 6, 14), iron), 0, legH * 0.42, 0)
    .rotation.x = Math.PI / 2;
  add(new THREE.Mesh(new THREE.CylinderGeometry(BOWL_R, 0.15, 0.24, 14, 1, true), iron), 0, BOWL_Y - 0.12, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), iron), 0, BOWL_Y - 0.235, 0);

  // Coals, sunk into the bowl so the glow comes from inside it.
  const coalMat = new THREE.MeshStandardMaterial({
    color: 0x2b1105, emissive: 0xff5511, emissiveIntensity: 2.2, roughness: 1,
  });
  const coals = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), coalMat);
  coals.scale.y = 0.45;
  coals.position.set(0, BOWL_Y - 0.07, 0);
  stand.add(coals);

  scene.add(stand);
  castle.addCollider(stand, 'brazier');

  const light = new THREE.PointLight(0xff9033, 8, 12, 2);
  light.position.copy(position).add(new THREE.Vector3(0, BOWL_Y + 0.2, 0));
  scene.add(light);

  const baseIntensity = light.intensity;
  const phase = Math.random() * Math.PI * 2;
  return (t) => {
    const flicker = 0.85 + 0.15 * Math.sin(t * 9 + phase) * Math.sin(t * 23 + phase * 2);
    light.intensity = baseIntensity * flicker;
    coalMat.emissiveIntensity = 2.2 * flicker;
  };
}
