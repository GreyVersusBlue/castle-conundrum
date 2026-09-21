// assets.js — centralized asset loading.
// Every model load goes through loadGLTF(): on failure it logs loudly and
// returns a clearly-labeled placeholder box so a bad path never fails silently.
// loadModel() is the scenery-facing shorthand for "just give me the geometry".

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

export const loadingManager = new THREE.LoadingManager();

/* --------------------------------------------------- compressed assets ---
 * Every texture under assets/ is KTX2/Basis and every Poly Haven mesh and NPC
 * body is EXT_meshopt_compression (#506 to #508). Both are read by loaders
 * three r169 already ships; neither is optional, because tools/encode-assets.mjs
 * wrote over the originals and there is no jpg left to fall back to.
 *
 * THE TRANSCODER IS A FILE, NOT A MODULE. KTX2Loader fetches
 * basis_transcoder.js and basis_transcoder.wasm by URL at first use, so Vite's
 * module graph never sees them and they have to be put under this origin by
 * hand — vite.config.js copies them out of the pinned `three` package, into
 * dist/decoders/basis/ for the build and onto the dev server's own middleware.
 * Nothing here leaves the origin (#493) and the path is relative, so the same
 * build serves from a subpath and from a bare domain (#505).
 *
 * MeshoptDecoder is the opposite shape: an ES module with its wasm inline, so
 * it bundles and there is nothing to copy.
 */
const TRANSCODER_PATH = 'decoders/basis/';
const ktx2Loader = new KTX2Loader(loadingManager).setTranscoderPath(TRANSCODER_PATH);

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setKTX2Loader(ktx2Loader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

const textureLoader = new THREE.TextureLoader(loadingManager);

/** KTX2 is one transcode target per GPU, so the right loader is the path's. */
const loaderFor = (url) => (url.endsWith('.ktx2') ? ktx2Loader : textureLoader);

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
  // Same ordering constraint, one line down: KTX2Loader picks its transcode
  // target (ASTC, BC7, ETC2, ...) from what this renderer reports, and a load
  // that starts before it has asked throws rather than guessing.
  ktx2Loader.detectSupport(renderer);
  return maxAnisotropy;
}

export function tuneTexture(tex) {
  if (!tex || tex.userData.__tuned) return tex;
  tex.userData.__tuned = true;
  const px = Math.max(tex.image?.width || 0, tex.image?.height || 0);
  // NOT on a compressed texture. `image` on a CompressedTexture is the
  // {width, height} KTX2Loader put there, so the size test still reads, but
  // magnification filtering on a block format is the format's business and
  // the mip chain is baked at encode time. Nothing compressed is pixel art
  // here anyway — the retro kit is the only thing under 128 px and the kit is
  // deliberately the one thing tools/encode-assets.mjs leaves alone (#508).
  if (px > 0 && px <= PIXEL_ART_MAX_PX && !tex.isCompressedTexture)
    tex.magFilter = THREE.NearestFilter;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------- relighting the kit ---
 * THE KENNEY KIT IS DECLARED UNLIT AND THE CASTLE IS NOT (#742, open call 3).
 * Every GLB in the kit declares KHR_materials_unlit on every material, so
 * GLTFLoader hands back a MeshBasicMaterial: the merlons, the columns, the
 * crates and the gate archways are drawn at their texture's own brightness
 * whatever the sun is doing. That was two games in one frame from the
 * North-west Tower's roof (#630) while the walls beside them were photographic
 * stone, and it stays two games now the walls are the kit's own kind of pixel
 * art unless the kit is put under the same sun.
 *
 * So the basic material is swapped for a MeshStandardMaterial over the same
 * map, which is exactly what loadPixelMaterial builds for a wall: one material
 * model, one sun, one castle. Nothing else about the kit moves — the texture
 * object is reused, so KHR_texture_transform's offset and repeat come with it,
 * and tuneTexture still magnifies it NEAREST at 64 px.
 *
 * RELIGHT_KIT IS THE REVERSAL. The fill at 2.0 and the sun were tuned against
 * photographic slate (#438) and nobody has seen a lit merlon yet (#53). If one
 * goes black the way the slate did, this constant is the one line that puts
 * the kit back the way it was, without touching a GLB or an encoder.
 */
const RELIGHT_KIT = true;
/** What a relit kit material gets. Matches loadPixelMaterial's: diffuse only. */
const KIT_ROUGHNESS = 1;

/* One replacement per original, because a kit GLB shares one material across
 * several meshes: `column.glb` is two materials over more meshes than two. A
 * per-mesh swap would hand each of them its own copy, which is a second
 * shader program for the same surface and a `dispose()` on a material the next
 * mesh in the traverse still points at. */
const relit = new WeakMap();

function relight(mat) {
  if (!RELIGHT_KIT || !mat?.isMeshBasicMaterial) return mat;
  if (relit.has(mat)) return relit.get(mat);
  const lit = new THREE.MeshStandardMaterial({
    map: mat.map || null,
    color: mat.color,
    roughness: KIT_ROUGHNESS,
    metalness: 0,
    transparent: mat.transparent,
    opacity: mat.opacity,
    alphaTest: mat.alphaTest,
    side: mat.side,
  });
  lit.name = mat.name;
  relit.set(mat, lit);
  mat.dispose();
  return lit;
}

/** Tune every texture on every material under `root`, and relight the kit's.
 *  Idempotent per texture, and per material: a MeshStandardMaterial is not a
 *  MeshBasicMaterial, so a second pass over the same scene changes nothing. */
function tuneMaterials(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) obj.material = obj.material.map(relight);
    else obj.material = relight(obj.material);
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
 * ONE MATERIAL, ONE MAP (#742). The fifteen material sets this function used to
 * read — a 1k diffuse, a normal and an arm or rough each, 44.2 MB of video
 * memory — are gone, and what a built surface wears now is one 128 px PNG out
 * of tools/pixel/ (`loadPixelMaterial` below). What is left here is the loader
 * that deduplicates by URL, which matters more than it did: eight tinted drums
 * over one defense_wall map is one 85 KB texture on the GPU, not eight.
 */
/**
 * ONE TEXTURE PER URL, however many materials read it (#516). A tinted variant
 * of a stone is a second MeshStandardMaterial over the same maps, and the
 * maps are the whole cost: eight towers in eight tints off one defense_wall
 * set is one set on the GPU, not eight. Loading is deduplicated by URL and the
 * callbacks queue behind the first load.
 */
const textures = new Map(); // url -> { tex: Texture | null, waiting: [(tex) => void] }
function loadTexture(url, repeat, onOk) {
  let entry = textures.get(url);
  if (entry) {
    if (entry.tex) onOk(entry.tex); else entry.waiting.push(onOk);
    return;
  }
  entry = { tex: null, waiting: [onOk] };
  textures.set(url, entry);
  loaderFor(url).load(
    url,
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tuneTexture(tex);
      entry.tex = tex;
      for (const fn of entry.waiting) fn(tex);
      entry.waiting = [];
    },
    undefined,
    () => { textures.delete(url); console.error(`[Castle Conundrum] MISSING TEXTURE: "${url}" — using fallback color`); }
  );
}

/**
 * A pixel-art material: `map` and nothing else.
 *
 * LIT, NOT UNLIT (#742, open call 2). This is a MeshStandardMaterial and not a
 * MeshBasicMaterial, because the sun moves per watch (#474), the walls cast
 * shadows, the hemisphere fill was measured against them (#438), the braziers
 * are point lights (#610) and the morning after is told partly by its light
 * (#712). An unlit castle loses all five in one move. What a pixel texture has
 * no use for is the rest of the PBR set: there is no normal pass worth having
 * in a 128 px drawing and no roughness pass at all, so roughness is the row's
 * one number and metalness is 0.
 *
 * NO FALLBACK COLOUR. loadPBRMaterial took one because a 404 on one of three
 * maps left a surface with nothing on it; the row here names one file, and if
 * that file is missing the console says so by name and the wall is the tint or
 * white. A grey-brown default would have been a wall that looks nearly right.
 *
 * `repeat` is 1: the repeat is in the geometry's own world-space UVs at 3 m
 * (#434), which is why a tiling texture drops onto every run, drum, floor and
 * ground here with no UV work at all.
 */
export function loadPixelMaterial({ map, roughness }, tint = null) {
  const mat = new THREE.MeshStandardMaterial({
    // The tint multiplies the map: white is the stone as drawn, and a tower's
    // own hue is what tells it from the seven others (#516).
    color: tint || '#ffffff',
    roughness: roughness ?? 1,
    metalness: 0,
  });
  if (!map) return mat;
  loadTexture(map, 1, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    mat.map = tex;
    mat.needsUpdate = true;
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
