// assets.js — centralized asset loading.
// Every model load goes through loadGLTF(): on failure it logs loudly and
// returns a clearly-labeled placeholder box so a bad path never fails silently.
// loadModel() is the scenery-facing shorthand for "just give me the geometry".

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

export const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);

const modelCache = new Map();

/* ------------------------------------------------------- texture sampling ---
 * Every texture in this game arrived with anisotropy 1 and LinearFilter
 * magnification, and that combination is the whole of the "blurry walls" report
 * that has been open since v6 §8.
 *
 * The walls are the Kenney retro-fantasy kit, whose textures are 64x64 pixel art
 * — not, as v6 guessed, Poly Haven 1k maps. Its glTF samplers declare
 * `minFilter` and nothing else, and GLTFLoader reads that as
 * `magFilter = WEBGL_FILTERS[undefined] || LinearFilter`. So a 64 px cobblestone
 * gets bilinearly smeared across a 4 m wall at roughly 32-64 texels per metre.
 * No amount of extra source resolution fixes that, because there is no extra
 * detail in the source to find: the fix is to stop interpolating. NEAREST
 * magnification renders those texels as the crisp blocks the kit was drawn as.
 *
 * Minification stays trilinear. NEAREST-mag plus LINEAR_MIPMAP_LINEAR-min is the
 * standard pixel-art-in-3D pairing; going nearest on both makes a wall 40 m away
 * shimmer as the camera moves.
 *
 * Size is the only discriminator, so nothing here consults a file path, a
 * material name or an asset kit. The Poly Haven maps are all 1024 px and the
 * Quaternius NPCs carry no images at all, so the pixel-art branch can only ever
 * reach the retro kit. Anisotropy applies to everything — it is what the ground
 * plane, seen almost edge-on for most of the game, was missing.
 */
const PIXEL_ART_MAX_PX = 128;
const TEXTURE_SLOTS = [
  'map', 'normalMap', 'aoMap', 'roughnessMap', 'metalnessMap',
  'emissiveMap', 'specularMap', 'alphaMap',
];
let maxAnisotropy = 1;

/**
 * Read the GPU's anisotropy ceiling once. Call this immediately after the
 * renderer exists and BEFORE anything loads — textures are tuned as they arrive,
 * so a texture that lands before this runs keeps anisotropy 1.
 */
export function setTextureQuality(renderer) {
  maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  return maxAnisotropy;
}

export function tuneTexture(tex) {
  if (!tex || tex.userData.__tuned) return tex;
  tex.userData.__tuned = true;
  const px = Math.max(tex.image?.width || 0, tex.image?.height || 0);
  if (px > 0 && px <= PIXEL_ART_MAX_PX) tex.magFilter = THREE.NearestFilter;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/** Tune every texture on every material under `root`. Idempotent per texture. */
function tuneMaterials(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) {
      if (!mat) continue;
      for (const slot of TEXTURE_SLOTS) tuneTexture(mat[slot]);
    }
  });
}

/**
 * Load a GLTF/GLB. Returns { scene, animations } — scene is always a fresh clone,
 * animations is the (shared, immutable) AnimationClip array from the file.
 * Cloning goes through SkeletonUtils rather than Object3D.clone() so that rigged
 * models come back bound to their *own* cloned skeleton; a plain clone() leaves
 * the copy's SkinnedMeshes pointing at the original's bones, which means any
 * AnimationMixer driving the clone visibly does nothing.
 * On failure: console.error + red placeholder box labeled with the path.
 */
export async function loadGLTF(path) {
  if (!modelCache.has(path)) {
    modelCache.set(path, new Promise((resolve) => {
      gltfLoader.load(
        path,
        (gltf) => {
          gltf.scene.traverse((obj) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });
          // Once per file, on the cached original. SkeletonUtils.clone() shares
          // materials by reference, so every clone handed out below is tuned too.
          tuneMaterials(gltf.scene);
          resolve({ scene: gltf.scene, animations: gltf.animations || [] });
        },
        undefined,
        (err) => {
          console.error(`[Castle Conundrum] MISSING/BROKEN ASSET: "${path}"`, err);
          resolve({ scene: makePlaceholder(path), animations: [] });
        }
      );
    }));
  }
  const cached = await modelCache.get(path);
  return { scene: cloneSkinned(cached.scene), animations: cached.animations };
}

/** Load a GLTF/GLB and return just its scene graph. */
export async function loadModel(path) {
  return (await loadGLTF(path)).scene;
}

function makePlaceholder(path) {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff00ff, wireframe: false, roughness: 1 })
  );
  box.position.y = 0.5;
  box.castShadow = true;
  group.add(box);
  group.userData.isPlaceholder = true;
  group.userData.missingPath = path;
  return group;
}

/**
 * Load a diffuse/normal/arm texture set into a MeshStandardMaterial.
 * Any texture that 404s logs an error; the material falls back to fallbackColor.
 */
export function loadPBRMaterial({ diffuse, normal, arm }, repeat = 1, fallbackColor = '#888888') {
  const mat = new THREE.MeshStandardMaterial({ color: fallbackColor, roughness: 1 });

  const tryTex = (url, onOk) => {
    if (!url) return;
    textureLoader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat, repeat);
        tuneTexture(tex);
        onOk(tex);
        mat.needsUpdate = true;
      },
      undefined,
      () => console.error(`[Castle Conundrum] MISSING TEXTURE: "${url}" — using fallback color`)
    );
  };

  tryTex(diffuse, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    mat.map = t;
    mat.color.set('#ffffff');
  });
  tryTex(normal, (t) => { mat.normalMap = t; });
  tryTex(arm, (t) => {
    // Poly Haven ARM = AO (r), Roughness (g), Metalness (b)
    mat.aoMap = t;
    mat.roughnessMap = t;
    mat.metalnessMap = t;
    mat.metalness = 1; // let the map drive it
  });

  return mat;
}

/** Fetch a JSON data file, failing loudly. */
export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    console.error(`[Castle Conundrum] FAILED TO LOAD DATA FILE: "${path}" (${res.status})`);
    throw new Error(`Missing data file: ${path}`);
  }
  return res.json();
}
