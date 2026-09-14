// assets.mjs — what data/scene-config.json and data/npcs.json point at, checked
// against the files on disk, and what is on disk checked back against them.
// Node only, no browser: everything here is glTF parsing and geometry.
//
//   node test/assets.mjs        (from Projects/Castle Conundrum)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. The config used to name `wooden_gate_1k.gltf` as the gate
// door's model. It is not a gate. Poly Haven ship a material-preview ball with
// every TEXTURE pack — one node named `sphere_gltf`, one mesh named
// `Sphere.001` — and wooden_gate is a texture pack, so the archway held a
// 1.93-unit sphere, auto-scaled to 3.6 m across, grounded, hinged, and swung
// 105 degrees when the quest completed. Nothing caught it because a preview
// sphere loads perfectly: no 404, no console error, no placeholder box. The
// only signal is the shape of what it hands back.
//
// Twenty of the forty-eight Poly Haven folders this project vendored carried
// that ball, at 2.3 MB of .bin each, and thirty-six of the forty-eight were
// referenced by nothing at all. They are gone (2026-09-14): 165 MB of assets
// against 1,525 lines of code is now 29 MB, and check 4 below is what stops it
// growing back.
//
// Four checks:
//   1. every `model` in either data file resolves to a file that exists
//   2. no `model` resolves to a Poly Haven preview ball
//   3. every gate leaf's built dimensions match the archway's own opening,
//      measured out of wall-fortified-gate.glb rather than restated from the
//      config — the point is to catch the two drifting apart — and every
//      material names a complete texture set
//   4. every byte under assets/Poly Haven and assets/NPCs is reachable from one
//      of those references, and everything a reference needs is there

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGLTF, triangles } from './gltf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scene-config.json'), 'utf8'));
const npcData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/npcs.json'), 'utf8'));

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* -------------------------------------------------- 1 & 2: model references ---
 * A Poly Haven preview ball is recognised by its node name, which is
 * `sphere_gltf` in every one of them, and confirmed by its bounds: a ball is
 * within a percent of the same size on all three axes and centred on its own
 * origin. Both, so that a real model that happens to be round-ish and a real
 * model that happens to be named oddly are each safe.
 */
function isPreviewBall(file) {
  const { json, verts } = triangles(file);
  const names = (json.nodes || []).map(n => n.name);
  if (!(names.length === 1 && names[0] === 'sphere_gltf')) return false;
  const lo = [0, 1, 2].map(i => Math.min(...verts.map(v => v[i])));
  const hi = [0, 1, 2].map(i => Math.max(...verts.map(v => v[i])));
  const size = [0, 1, 2].map(i => hi[i] - lo[i]);
  const cubic = Math.max(...size) / Math.min(...size) < 1.02;
  const centred = [0, 1, 2].every(i => Math.abs(lo[i] + hi[i]) < 0.02 * size[i]);
  return cubic && centred;
}

console.log('model references in data/');
// npcs.json is in here because it is the other file that names a Poly Haven
// model, and until 2026-09-14 nothing checked it: the King's `heldProp` is
// ornate_medieval_mace_1k, and a preview ball in that slot is the same #374 bug
// in a hand rather than an archway.
const refs = [
  [config.kenneyBase + config.battlements.model, 'the battlements'],
  ...config.gates.map(g => [config.kenneyBase + g.archModel, `${g.id}'s archway`]),
  ...config.courtyard.placements.map(p => [config.kenneyBase + p.model, p.id || p.model]),
  ...config.interiorProps.map(p => [config.polyhavenBase + p.model, p.model]),
  ...npcData.npcs.map(n => [n.modelPath, `${n.id || n.name}'s body`]),
  ...npcData.npcs.filter(n => n.heldProp).map(n => [config.polyhavenBase + n.heldProp, `${n.id || n.name}'s heldProp`]),
];
const seen = new Set();
for (const [rel, label] of refs) {
  if (seen.has(rel)) continue;
  seen.add(rel);
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { fail(`${label}: no such file — ${rel}`); continue; }
  if (isPreviewBall(file)) fail(`${label}: ${rel} is a Poly Haven material-preview ball, not a model`);
}
if (!failures) pass(`${seen.size} model references, all present, none a preview ball`);

/* ------------------------------------------------- 3: the gate leaf's fit ---
 * The archway is wall-fortified-gate.glb, which src/castle-plan.js scales by
 * tileSize / its own depth like every other kit piece (`scaleFor`, rule
 * 'depth'; it was `castle-builder.js`'s `normalizeToTile` until 2026-09-14).
 * That factor is worked out again below rather than read off the plan, and it
 * is the one duplication in this project that does not matter: both sides of
 * every comparison here are the same model scaled by the same number, so a
 * wrong factor cancels out. Where the piece ENDS UP is layout.mjs's and
 * plan-vs-scene.mjs's question, and both read the plan. The opening is measured
 * by projecting the piece's front and back faces onto XY and finding the hole:
 * the tunnel's own walls run parallel to that projection and contribute no area
 * to it, so what is left uncovered is the doorway and nothing else.
 */
function openingOf(file, scale) {
  const { verts, tris } = triangles(file);
  const facing = tris.filter(t => {
    const [a, b, c] = t.map(i => verts[i]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1;
    return Math.abs(n[2] / len) > 0.7;
  });
  const covered = (px, py) => facing.some(t => {
    const [a, b, c] = t.map(i => verts[i]);
    const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
    const d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]);
    const d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);
    return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0)));
  });
  const lo = [0, 1].map(i => Math.min(...verts.map(v => v[i])));
  const hi = [0, 1].map(i => Math.max(...verts.map(v => v[i])));
  const N = 200;
  const rows = [];
  for (let j = 0; j < N; j++) {
    const y = lo[1] + (j + 0.5) * (hi[1] - lo[1]) / N;
    let left = null, right = null;
    for (let i = 0; i < N; i++) {
      const x = lo[0] + (i + 0.5) * (hi[0] - lo[0]) / N;
      if (covered(x, y)) continue;
      if (left === null) left = x;
      right = x;
    }
    if (left !== null) rows.push({ y, left, right });
  }
  if (!rows.length) return null;
  const step = (hi[0] - lo[0]) / N / 2; // the sample sits mid-cell
  return {
    width: (Math.max(...rows.map(r => r.right)) - Math.min(...rows.map(r => r.left)) + 2 * step) * scale,
    apex: (rows[rows.length - 1].y + (hi[1] - lo[1]) / N / 2) * scale,
    // the highest row still at full width — where the semicircular head springs
    springline: rows.filter(r => r.right - r.left >= (Math.max(...rows.map(x => x.right - x.left)) - 2 * step))
      .map(r => r.y).pop() * scale,
  };
}

console.log('\nevery gate leaf against the archway it hangs in');
// PER GATE NOW, not once. Phase 3 put three of these in the castle — the west
// gate the clerk came in through, the east gate onto the garden, and the
// porter's gate through the cross-wall — and they are the same archway model at
// the same scale with the same leaf numbers. Checking one of three and calling
// it the gate is how a config grows a second copy that nobody measured.
for (const gate of config.gates) {
  const file = path.join(ROOT, config.kenneyBase + gate.archModel);
  if (!fs.existsSync(file)) { fail(`${gate.id}: no archway model at ${gate.archModel}`); continue; }
  const { verts } = triangles(file);
  const depth = Math.max(...verts.map(v => v[2])) - Math.min(...verts.map(v => v[2]));
  const scale = config.tileSize / depth; // castle-plan.js's scaleFor, rule 'depth'
  const open = openingOf(file, scale);
  const leaf = gate.leaf;
  // A solid piece has no hole to measure, and everything below would read as a
  // TypeError rather than as the answer, which is that there is no doorway.
  if (!open) { fail(`${gate.id}: ${gate.archModel} has no opening in it — nothing for a gate to fill`); continue; }

  // 0.11 m of tolerance: the head is a faceted circle, so a row's measured
  // width lands just inside the true one, and the sample grid is 0.02 m.
  const TOL = 0.11;
  const apex = leaf.springline + leaf.archRadius;
  for (const [what, built, measured, why] of [
    ['width', leaf.width, open.width, 'clears the jamb'],
    ['springline', leaf.springline, open.springline, 'meets the arch where it springs'],
    ['apex', apex, open.apex, 'reaches the crown'],
  ]) {
    if (built > measured) fail(`${gate.id}: leaf ${what} ${built} m is wider than the opening's ${measured.toFixed(3)} m — it would clip the stone`);
    else if (!near(built, measured, TOL)) fail(`${gate.id}: leaf ${what} ${built} m leaves a ${(measured - built).toFixed(3)} m gap in a ${measured.toFixed(3)} m opening — it no longer ${why}`);
    else pass(`${gate.id}: leaf ${what} ${built} m in a ${measured.toFixed(3)} m opening`);
  }

  // The head is drawn as an arc of archRadius springing at springline, so a leaf
  // whose half-width and radius disagree gets a straight step in its outline.
  if (!near(leaf.width / 2, leaf.archRadius, 1e-9))
    fail(`${gate.id}: leaf half-width ${leaf.width / 2} and archRadius ${leaf.archRadius} disagree — the head would step in or out at the springline`);

  // How far the leaf can swing before it stops being an opened gate and starts
  // being a plank in a wall. Hinged at half its own width off centre, at angle θ
  // its furthest point sits `width·cos θ + (thickness/2)·sin θ` in x from the
  // hinge, and the jamb is at half the opening's width from the centre. This one
  // binds on every gate, open or shut: the west gate and the porter's gate are
  // PLACED at `openDegrees`, so an angle the opening cannot take is not a future
  // animation there, it is where the leaf is standing right now.
  const swing = (gate.openDegrees || 0) * Math.PI / 180;
  const reach = leaf.width / 2
    + leaf.width * Math.abs(Math.cos(swing))
    + (leaf.thickness / 2) * Math.abs(Math.sin(swing));
  const jamb = open.width / 2;
  if (gate.openDegrees < 80)
    fail(`${gate.id} opens to ${gate.openDegrees} degrees — still across the doorway`);
  else if (reach > jamb + leaf.thickness)
    fail(`${gate.id}: opened to ${gate.openDegrees} degrees the leaf reaches ${reach.toFixed(2)} m from centre, ${(reach - jamb).toFixed(2)} m into a jamb at ${jamb.toFixed(2)} m`);
  else pass(`${gate.id}: opened to ${gate.openDegrees} degrees the leaf stands at ${reach.toFixed(2)} m against a jamb at ${jamb.toFixed(2)} m`);

  if (gate.model) fail(`${gate.id} still carries a \`model\` — the leaf is built from \`leaf\` and \`material\` now`);
  if (!config.materials[gate.material]) fail(`${gate.id} names material "${gate.material}", which config.materials does not define`);
}

/* ------------------------------------------- 3b: every material is a set ---
 * The three sets Phase 3 restored ship `diff`, `nor_gl` and `rough`; the two
 * already here ship `diff`, `nor_gl` and `arm`. src/assets.js reads whichever of
 * `arm` and `rough` is present, and they are not the same image: `arm` carries
 * AO, roughness and metalness in three channels and drives `metalness` off the
 * blue one, `rough` is roughness alone. A set that declared both would render
 * with whichever call happened to resolve last; one that declared neither is a
 * matte plastic wall and nothing says so.
 */
console.log('\nevery material is a complete set');
for (const [name, spec] of Object.entries(config.materials)) {
  const has = ['diffuse', 'normal'].filter(k => spec[k]);
  if (has.length !== 2) fail(`material "${name}" is missing ${['diffuse', 'normal'].filter(k => !spec[k]).join(' and ')}`);
  const third = ['arm', 'rough'].filter(k => spec[k]);
  if (third.length !== 1) fail(`material "${name}" declares ${third.length ? 'both `arm` and `rough`' : 'neither `arm` nor `rough`'} — src/assets.js reads exactly one`);
  else pass(`material "${name}": diffuse, normal and ${third[0]}`);
}

/* --------------------------------- 3c: every plain material is a colour ---
 * The opposite shape, and the reason `plainMaterials` is a second section rather
 * than two loose entries in the first. Phase 4 needed two surfaces the stone list
 * has no map for — the cell's iron bars and the wool cloak over the laundry crate
 * — and putting a colour-only entry in `materials` would have meant weakening the
 * rail above to "a complete set, unless it is not". So these live apart and carry
 * the opposite assertion: a colour, and no path to anything.
 */
console.log('\nevery plain material is a colour and nothing else');
for (const [name, spec] of Object.entries(config.plainMaterials || {})) {
  if (!/^#[0-9a-fA-F]{6}$/.test(spec.color || '')) fail(`plain material "${name}" has no six-digit hex \`color\``);
  const maps = Object.entries(spec).filter(([, v]) => typeof v === 'string' && v.includes('/'));
  if (maps.length) fail(`plain material "${name}" names ${maps.map(([k]) => k).join(' and ')} — anything with a map belongs in \`materials\`, where the complete-set rail can see it`);
  else pass(`plain material "${name}": ${spec.color}`);
}

/* ------------------------------ 3d: everything built names a real material ---
 * Every wall run, drum, ground, room floor and door leaf names a material by
 * string. A typo in one of them throws in the browser at build time, inside a
 * promise, after the loading bar has already run — and nowhere in Node. There
 * are 28 runs, 8 drums and 14 rooms now, which is 50 strings nobody reads.
 */
console.log('\nevery built thing names a material that exists');
{
  const known = new Set([...Object.keys(config.materials), ...Object.keys(config.plainMaterials || {})]);
  const named = [];
  for (const w of config.walls) named.push([w.material, `wall run ${w.id}`]);
  for (const d of config.drums) {
    named.push([d.material, `drum ${d.id}`]);
    const door = d.interior?.door;
    if (door?.leaf) named.push([door.leaf.material, `${d.id}'s door leaf`]);
    if (door?.bars) named.push([door.bars.material, `${d.id}'s bars`]);
  }
  named.push([config.ground.base.material, 'the base ground']);
  for (const patch of config.ground.patches || []) named.push([patch.material, `ground patch ${patch.id}`]);
  for (const r of config.rooms || []) if (r.floor) named.push([r.floor, `${r.id}'s floor`]);
  for (const b of config.builtProps || []) named.push([b.material, `built prop ${b.id}`]);
  const bad = named.filter(([m]) => !known.has(m));
  for (const [m, where] of bad) fail(`${where} names material "${m}", which scene-config.json does not define`);
  if (!bad.length) pass(`${named.length} material names across the walls, drums, doors, grounds, floors and built props, every one of them defined`);
}

/* ------------------------------------------------- 4: nothing dead on disk ---
 * The reverse of checks 1 and 2. Those ask "does every reference resolve?"; this
 * asks "is every file referenced?", which is the question nobody was asking when
 * this project carried 165 MB of assets for 1,525 lines of code. Thirty-six of
 * the forty-eight Poly Haven folders were named by nothing, and twenty of the
 * forty-eight carried a 2.3 MB material-preview ball as their .gltf + .bin —
 * including the two that ARE used, where only the `textures/` beside the ball
 * were ever loaded.
 *
 * The rule, for `assets/Poly Haven` and `assets/NPCs`: a file may be there if
 * some entry in data/ names it, or if a .gltf that some entry in data/ names
 * declares it as a buffer or an image. Nothing else.
 *
 * `assets/kenney_retro-fantasy-kit` is deliberately NOT swept that way. It is a
 * kit, vendored whole: 106 GLBs of which the config places 14, and adding a
 * fifteenth should be a one-line config edit, not a re-download. What is checked
 * there is narrower and is the thing that actually cost bytes — the kit shipped
 * the same models three times over, in FBX, OBJ and GLB, and loadModel reads
 * exactly one of those.
 */
console.log('\nnothing on disk that nothing asks for');
{
  const needed = new Map(); // repo-relative path -> what asks for it
  const need = (rel, why) => { if (!needed.has(rel)) needed.set(rel, why); };

  const gltfRefs = [
    ...config.interiorProps.map(p => [config.polyhavenBase + p.model, p.model.split('/')[0]]),
    ...npcData.npcs.filter(n => n.heldProp)
      .map(n => [config.polyhavenBase + n.heldProp, `${n.id || n.name}'s heldProp`]),
  ];
  for (const [rel, why] of gltfRefs) {
    need(rel, why);
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue; // check 1 already said so
    const { json } = readGLTF(file);
    const dir = path.posix.dirname(rel);
    for (const uri of [...(json.buffers || []), ...(json.images || [])].map(x => x.uri).filter(Boolean))
      need(path.posix.join(dir, decodeURIComponent(uri)), `${why}'s glTF declares it`);
  }
  // Every map under config.materials, whether a wall, a drum, a ground or a gate
  // leaf is the thing naming it. This is the list that made restoring a set
  // without referencing it produce three unreferenced-file failures (#390).
  for (const [name, spec] of Object.entries(config.materials))
    for (const [slot, rel] of Object.entries(spec)) need(rel, `material ${name}'s ${slot}`);
  for (const n of npcData.npcs) need(n.modelPath, `${n.id || n.name}'s body`);

  const walk = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.posix.join(rel, e.name)) : [path.posix.join(rel, e.name)]);
  };

  let dead = 0, deadBytes = 0;
  for (const rel of [...walk('assets/Poly Haven'), ...walk('assets/NPCs')]) {
    if (needed.has(rel)) continue;
    dead++;
    deadBytes += fs.statSync(path.join(ROOT, rel)).size;
    if (dead <= 8) fail(`nothing references ${rel}`);
  }
  if (dead > 8) fail(`...and ${dead - 8} more unreferenced files`);
  if (dead) fail(`${dead} unreferenced file(s) under assets/, ${(deadBytes / 1048576).toFixed(1)} MB`);
  else pass(`${needed.size} files under assets/Poly Haven and assets/NPCs, every one of them asked for`);

  for (const [rel, why] of needed) {
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`${why} needs ${rel}, which is not there`);
  }

  const formats = 'assets/kenney_retro-fantasy-kit/Models';
  const kept = fs.readdirSync(path.join(ROOT, formats)).sort();
  if (kept.join('|') !== 'GLB format')
    fail(`${formats} holds ${kept.join(', ')} — loadModel reads GLB and nothing else, so the rest is dead weight`);
  else pass('the Kenney kit ships only the format loadModel reads');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
