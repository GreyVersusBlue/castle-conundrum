// edit-layout.js — the floor plan you can see (SPECS.md "The floor plan you
// can see", increments 1 to 3). `?edit=1&view=plan` on the dev server, `V`
// from inside the castle, and nowhere else.
//
// WHY THIS EXISTS. The castle's forty-three rooms were placed one room and one
// guess at a time, in first person, by sessions that could only ever see the
// wall in front of them. data/scene-config.json is 3113 hand-typed lines and
// the whole plan has never been on a screen at once. This is the screen.
//
// IT WAS READ-ONLY FIRST (#748), and the review half still is: the camera, the
// storey filter and the sheet are increment 1's. Increments 2 and 3 are the
// "correct it" half. Drag a room's rectangle (inside it to move it, on an edge
// to move that edge) or a run's end; drag an opening along its run, type its
// width, or press Delete twice to cut it. Whole tiles, a quarter tile with Alt
// held. Every one of those is a new `walls` or `rooms` row, posted whole
// through the same /__place `move` the prop editor uses: no new verb, nothing
// added to vite.config.js, and a doorway is a field of its run, so editing one
// is a move of the run's row (#749). The arithmetic on the row is
// tools/layout-edit.mjs's, which is pure and has a rail in test/tools.mjs.
//
// NOTHING IS WRITTEN THAT DOES NOT BUILD (#749). Every drag step hands the
// edited config to `makePlan`, the same pure function the page and every Node
// suite already call, and the outline drawn under the cursor is the box that
// plan computed, not one worked out here (#500). If `makePlan` throws, the
// panel shows the throw and the drop writes nothing. On a drop that builds,
// `walkability` runs over the new plan and the panel prints the room count,
// the walkable-cell count and the cells the fill reaches outside the curtain,
// beside the same three for the plan as it was. Those are numbers and not
// checks: a second copy of test/layout.mjs's check 4 living in a panel is a
// rail nobody runs and nobody maintains (#13, #529). No assertion from any
// suite is copied here.
//
// IT IS A CAMERA OVER THE REAL SCENE, NOT A SECOND DRAWING (#746). A flat 2D
// schematic cannot compute anything here: `makePlan` takes `boundsOf`, and the
// only thing that can answer it is CastleBuilder.measure(), which loads every
// model. A DOM editor would have to re-derive every box the plan already
// computed, which is castle-plan.js's whole reason for existing (#500). So this
// is a THREE.OrthographicCamera over the castle the player is standing in, with
// `up` set to (0, 0, -1) so north is up, and main.js renders whichever camera
// this module hands back. The storey filter hides every piece wholly above the
// storey's ceiling and ghosts everything below it at opacity 0.25, so a floor
// reads as a floor with the one under it showing through.
//
// THE LABELS, THE ROOM OUTLINES AND THE OPENINGS COME FROM tools/plan-sheet.mjs,
// which is pure and has a rail in test/tools.mjs. Nothing in this file works out
// where a room is; it asks for the sheet and draws it.
//
// THE DEV-ONLY GUARANTEE IS THE SAME TWO HALVES edit-mode.js's is (#585, #586).
// This module is imported by edit-mode.js, which main.js imports from inside
// `if (import.meta.env.DEV && ...)`, so Vite drops both in a build. And it is
// not trusted: test/built.mjs greps every .js, .css, .html and .json file under
// dist/ for LAYOUT_SENTINEL below, and asserts the string is in this file so a
// rename cannot make the grep go quiet.
import { planSheet, storeyOf } from '../tools/plan-sheet.mjs';
import { makePlan, walkability } from './castle-plan.js';
import {
  dragRoom, dragRunEnd, clampOpening, moveOpening, widenOpening, cutOpening, withRow, snapTo,
  SNAP, FINE_SNAP, OPENING_SNAP_METRES, ALL_EDGES,
} from '../tools/layout-edit.mjs';

export const LAYOUT_SENTINEL = 'castle-layout-editor-v1';

const PANEL = `
  position:fixed; top:12px; right:12px; z-index:9999; width:260px;
  font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;
  background:rgba(18,16,14,.92); color:#e8e0d0; border:1px solid #6b5c44;
  border-radius:6px; padding:10px; pointer-events:auto;`;
const LABELS = `
  position:fixed; inset:0; z-index:9998; pointer-events:none;
  font:11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;`;
/* What the drags land on. The start panel the game puts up when the pointer is
 * let go sits over the whole canvas at z-index 50, so a listener on the canvas
 * itself would hear nothing while the plan is open. */
const CATCHER = 'position:fixed; inset:0; z-index:9997; cursor:crosshair; touch-action:none;';
const FIELD = 'width:70px; margin-left:6px; background:#241f19; color:#e8e0d0; border:1px solid #6b5c44; border-radius:3px; padding:2px; font:inherit;';

/** How much clear ground to leave round the castle in the frame, in metres. */
const MARGIN = 6;
/** How far above the castle the camera stands. Orthographic, so this is only a near/far question. */
const HIGH = 400;
/** What a storey below the one being read is dimmed to. */
const GHOST = 0.25;

const ROOM_LINE = 0x8fd0ff;
const MYSTERY_LINE = 0xffd27f;
const OPENING_LINE = 0x7fe08a;
const SELECT_LINE = 0xffffff;

/** How near, in metres, a press has to land to take an edge, an end or an opening rather than what is under it. */
const NEAR_EDGE = 0.8;
const NEAR_END = 1.2;
const NEAR_OPENING = 0.4;
/** How long a Delete press stays armed, in ms: the prop editor's number (edit-mode.js). */
const ARMED_FOR = 4000;

/**
 * @param scene    the THREE.Scene the castle is in
 * @param THREE    passed in rather than imported, the way edit-mode.js takes it
 * @param renderer for the canvas size the frustum is fitted to
 * @param plan     what `makePlan` returned: the single source (#500)
 * @param castle   the CastleBuilder, for `objects` — planId to the live object
 * @param config   data/scene-config.json, for the `doorways` the plan does not carry
 * @param mystery  data/mystery.json, for which rooms the mystery names
 * The castle as the file has it now is held here as `base`, and every write
 * replaces it with the plan the write was checked against, so the outlines on
 * the sheet follow the file while the stone under them is the page's until a
 * reload.
 * @returns { update, camera, isOpen } — `camera` is null unless the view is on,
 *          and main.js renders `editor?.camera ?? camera`
 */
export function mountLayoutView({ scene, THREE, renderer, plan, castle, config = null, mystery = null }) {
  const levels = plan.levels.slice();
  let level = levels[0];
  let open = false;

  /* ---- the edit state ---- */
  // `base` is the plan the file builds as of the last write; `cfg` is the
  // config it was built from, with `walls` and `rooms` replaced by each write's
  // answer from the dev server (the file as it now is, never a local guess).
  // `draft` is the row under the cursor and the plan it builds, or the throw
  // it builds instead.
  let base = plan;
  let cfg = config ? { ...config } : null;
  let draft = null;
  let sel = null;
  let drag = null;
  let busy = false;
  let armed = 0;
  let numbersBase = null;
  let boundsOf = null;
  let measuring = null;

  /* ---- the panel ---- */
  const panel = document.createElement('div');
  panel.setAttribute('data-editor', LAYOUT_SENTINEL);
  panel.style.cssText = PANEL;
  panel.hidden = true;
  panel.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">floor plan</div>
    <div data-storey style="margin-bottom:6px"></div>
    <div data-counts style="opacity:.85;white-space:pre-wrap"></div>
    <hr style="border:0;border-top:1px solid #6b5c44;margin:8px 0">
    <div data-picked style="white-space:pre-wrap"></div>
    <label data-width-row hidden>width, m<input data-width type="number" step="0.1" min="0.1" style="${FIELD}"></label>
    <div data-said style="min-height:1.2em;white-space:pre-wrap;margin-top:4px"></div>
    <hr style="border:0;border-top:1px solid #6b5c44;margin:8px 0">
    <div style="opacity:.6">V closes it. [ and ] change storey. Esc back to the castle.
    Blue is a room, amber is a room the mystery names, green is a doorway, white is picked.
    Drag inside a room to move it, on its edge to move the edge, a run's end to
    lengthen it, a doorway along its run. Whole tiles; Alt for a quarter.
    Enter in the width box sets it, Delete twice cuts the picked doorway.
    Each drop writes the file. Reload to see the stone.</div>`;
  document.body.appendChild(panel);
  const said = panel.querySelector('[data-said]');
  const say = (text, ok = true) => { said.textContent = text; said.style.color = ok ? '#9fd08a' : '#e08a8a'; };
  const widthRow = panel.querySelector('[data-width-row]');
  const widthIn = panel.querySelector('[data-width]');
  const catcher = document.createElement('div');
  catcher.style.cssText = CATCHER;
  catcher.hidden = true;
  document.body.appendChild(catcher);
  const labels = document.createElement('div');
  labels.style.cssText = LABELS;
  labels.hidden = true;
  document.body.appendChild(labels);

  /* ---- the camera ---- */
  // Framed on the union of every room's extent, and the SAME rectangle on every
  // storey (plan-sheet.mjs's `extent` is over all rooms, not this level's), so
  // `[` and `]` change what is drawn and never where the castle is on screen.
  const extent = planSheet(plan, level).extent;
  const mid = { x: (extent.min.x + extent.max.x) / 2, z: (extent.min.z + extent.max.z) / 2 };
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, HIGH * 2);
  camera.up.set(0, 0, -1); // north up: -z is the top of the screen
  camera.position.set(mid.x, HIGH, mid.z);
  camera.lookAt(mid.x, 0, mid.z);
  let fitted = '';
  const fit = () => {
    const w = renderer.domElement.clientWidth || 1, h = renderer.domElement.clientHeight || 1;
    const key = `${w}x${h}`;
    if (key === fitted) return;
    fitted = key;
    const halfX = (extent.max.x - extent.min.x) / 2 + MARGIN;
    const halfZ = (extent.max.z - extent.min.z) / 2 + MARGIN;
    // Fit the whole rectangle whichever way round the window is. The camera's
    // own y is world -z (that is what `up` bought), so the vertical half is the
    // z half and the horizontal is the x one, widened to the window's aspect.
    const aspect = w / h;
    const halfV = Math.max(halfZ, halfX / aspect);
    camera.left = -halfV * aspect; camera.right = halfV * aspect;
    camera.top = halfV; camera.bottom = -halfV;
    camera.updateProjectionMatrix();
  };

  /* ---- the overlay: room outlines and openings, from the sheet ---- */
  const overlay = new THREE.Group();
  overlay.renderOrder = 1000;
  overlay.visible = false;
  scene.add(overlay);
  // depthTest off, because the outline of a room is a note about the castle and
  // not a thing in it: a rectangle drawn at the storey's ceiling would be eaten
  // by the tower standing in it otherwise.
  const lineMat = (colour) => new THREE.LineBasicMaterial({ color: colour, depthTest: false, transparent: true, opacity: 0.9 });
  const mats = { room: lineMat(ROOM_LINE), mystery: lineMat(MYSTERY_LINE), opening: lineMat(OPENING_LINE), picked: lineMat(SELECT_LINE) };
  const clearOverlay = () => {
    for (const child of overlay.children.slice()) { overlay.remove(child); child.geometry.dispose(); }
  };
  const rect = (b, y, mat) => {
    const p = [[b.min.x, b.min.z], [b.max.x, b.min.z], [b.max.x, b.max.z], [b.min.x, b.max.z], [b.min.x, b.min.z]];
    const g = new THREE.BufferGeometry().setFromPoints(p.map(([x, z]) => new THREE.Vector3(x, y, z)));
    const line = new THREE.Line(g, mat);
    line.renderOrder = 1000;
    overlay.add(line);
  };
  const cross = (at, y, r, mat) => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(at.x - r, y, at.z), new THREE.Vector3(at.x + r, y, at.z),
      new THREE.Vector3(at.x, y, at.z - r), new THREE.Vector3(at.x, y, at.z + r),
    ]);
    const line = new THREE.LineSegments(g, mat);
    line.renderOrder = 1000;
    overlay.add(line);
  };

  /* ---- ghosting, by the plan's own boxes ---- */
  // One ghost material per real material rather than one per mesh: the castle is
  // 1539 meshes over about twenty materials, and a clone per mesh would put
  // fifteen hundred programs on the GPU to dim a floor.
  const ghostOf = new Map();
  const ghost = (m) => {
    if (!ghostOf.has(m)) {
      const g = m.clone();
      g.transparent = true; g.opacity = GHOST; g.depthWrite = false;
      ghostOf.set(m, g);
    }
    return ghostOf.get(m);
  };
  // `visible` is remembered rather than set back to true: a day set may already
  // have hidden a gate leaf or a body (castle-builder.js's setPieceVisible), and
  // a review view that handed the castle back with that leaf showing would have
  // changed the game by looking at it.
  const dress = (obj, how) => {
    if (obj.userData.__planVisible === undefined) obj.userData.__planVisible = obj.visible;
    obj.visible = how === 'hide' ? false : obj.userData.__planVisible;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      if (o.userData.__planMaterial === undefined) o.userData.__planMaterial = o.material;
      const real = o.userData.__planMaterial;
      o.material = how === 'ghost'
        ? (Array.isArray(real) ? real.map(ghost) : ghost(real))
        : real;
    });
  };
  /** Every piece put back the way the castle had it. Called on close, and once on open before the filter runs. */
  const undress = () => {
    for (const piece of base.pieces) {
      const obj = castle?.objects?.get(piece.id);
      if (obj) dress(obj, 'show');
    }
  };

  /* ---- what one storey looks like ---- */
  let sheet = null;
  /** The plan being drawn: the draft's while one builds, the file's otherwise. */
  const shown = () => (draft && draft.plan ? draft.plan : base);
  const shownConfig = () => (draft && draft.plan ? draft.cfg : cfg);
  const draw = () => {
    const P = shown();
    sheet = planSheet(P, level, { config: shownConfig(), mystery });
    clearOverlay();
    const y = sheet.ceiling;
    const pickedId = sel ? (sel.key === 'rooms' ? cfg.rooms[sel.index]?.id : cfg.walls[sel.index]?.id) : null;
    for (const room of sheet.rooms) {
      const mine = sel && sel.key === 'rooms' && room.id === pickedId;
      rect(room.bounds, y, mine ? mats.picked : room.inMystery ? mats.mystery : mats.room);
    }
    for (const o of sheet.openings) {
      const mine = sel && sel.key === 'walls' && sel.door != null && o.run === pickedId && doorIndexOf(shownConfig(), o) === sel.door;
      cross(o.point, y, Math.max(o.width, 1) / 2, mine ? mats.picked : mats.opening);
    }
    // A picked run is drawn as its plan box, with a tick at each end to grab.
    if (sel && sel.key === 'walls') {
      const piece = sheet.pieces.find((p) => p.id === pickedId);
      if (piece) {
        rect(piece.box, y, mats.picked);
        const axis = axisOf(cfg.walls[sel.index], piece.box);
        const c = axis === 'x' ? 'z' : 'x';
        const mid = (piece.box.min[c] + piece.box.max[c]) / 2;
        for (const end of [piece.box.min[axis], piece.box.max[axis]]) {
          cross(axis === 'x' ? { x: end, z: mid } : { x: mid, z: end }, y, NEAR_END, mats.picked);
        }
      }
    }

    // The storey filter, off the plan's own boxes and not off a live Box3: a
    // piece the builder has not finished loading still has a plan box.
    for (const piece of P.pieces) {
      const obj = castle?.objects?.get(piece.id);
      if (!obj) continue;
      const where = storeyOf(P, piece.box, level);
      dress(obj, where === 'above' ? 'hide' : where === 'below' ? 'ghost' : 'show');
    }

    labels.innerHTML = sheet.rooms.map((r, i) =>
      `<div data-room="${i}" style="position:absolute;transform:translate(-50%,-50%);padding:1px 3px;border-radius:2px;background:rgba(18,16,14,.7);color:${r.inMystery ? '#ffd27f' : '#8fd0ff'}">${r.name || r.id}</div>`).join('');
    tags = [...labels.children];

    panel.querySelector('[data-storey]').textContent =
      `storey ${level} of ${levels.join(', ')}  —  ${sheet.floor} to ${sheet.ceiling} m`;
    panel.querySelector('[data-counts]').textContent =
      `${sheet.rooms.length} rooms (${sheet.rooms.filter((r) => r.inMystery).length} the mystery names)\n`
      + `${sheet.pieces.length} pieces of ${P.pieces.length}\n${sheet.openings.length} openings`;
    describe();
  };

  /* ---- what is picked, in the panel ---- */
  const describe = () => {
    const out = panel.querySelector('[data-picked]');
    widthRow.hidden = !(sel && sel.door != null);
    if (!sel) { out.textContent = 'nothing picked'; return; }
    const row = (draft && draft.key === sel.key && draft.index === sel.index ? draft.row : cfg[sel.key][sel.index]);
    if (!row) { out.textContent = 'nothing picked'; return; }
    if (sel.key === 'rooms') {
      const by = row.tiles ? `tiles ${row.tiles.min.join(', ')} to ${row.tiles.max.join(', ')}`
        : row.bounds ? `bounds ${row.bounds.min.join(', ')} to ${row.bounds.max.join(', ')} m`
          : `drum ${row.drum}: its disc is the drum's, not dragged here`;
      out.textContent = `rooms[${sel.index}]  ${row.id}\nlevel ${row.level}, ${by}`;
    } else {
      const d = sel.door != null ? row.doorways?.[sel.door] : null;
      out.textContent = `walls[${sel.index}]  ${row.id}\nfrom ${row.from.join(', ')} to ${row.to.join(', ')}`
        + `, ${(row.doorways || []).length} doorway(s)`
        + (d ? `\ndoorway ${sel.door}: at ${d.at}, ${d.width} m wide, ${d.height} m high${d.base ? `, ${d.base} m up` : ''}` : '');
      if (d && document.activeElement !== widthIn) widthIn.value = String(d.width);
    }
  };

  /* ---- reading the rows behind what is on the sheet ---- */
  const wallIndex = (id) => (cfg && Array.isArray(cfg.walls) ? cfg.walls.findIndex((r) => r.id === id) : -1);
  const roomIndex = (id) => (cfg && Array.isArray(cfg.rooms) ? cfg.rooms.findIndex((r) => r.id === id) : -1);
  /** Which `doorways` entry of its run a sheet opening is, by the four numbers plan-sheet.mjs read off it. */
  const doorIndexOf = (c, o) => {
    const run = c.walls.find((r) => r.id === o.run);
    return run && Array.isArray(run.doorways)
      ? run.doorways.findIndex((d) => d.at === o.at && (d.base || 0) === o.base && d.width === o.width && d.height === o.height)
      : -1;
  };
  /** A run's axis: the one it declares, or the longer side of the plan's own box for it, which is how plan-sheet.mjs reads it. */
  const axisOf = (row, box) => row.axis
    || ((box.max.x - box.min.x) >= (box.max.z - box.min.z) ? 'x' : 'z');

  /** The world point under a pointer, on the ground plane the orthographic camera looks straight down at. */
  const hit3 = new THREE.Vector3();
  const worldAt = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    hit3.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1, 0).unproject(camera);
    return { x: hit3.x, z: hit3.z };
  };

  /**
   * What a press at `p` takes, nearest kind first: an opening, a run's end, a
   * room's edge or its inside (smallest room first, so a chamber inside a
   * ward is not lost under it), and last a run's body, which picks it without
   * dragging. Every box read here is the sheet's, which is the plan's (#500).
   */
  const hitTest = (p) => {
    if (!sheet || !cfg) return null;
    for (const o of sheet.openings) {
      const b = o.box;
      if (p.x < b.min.x - NEAR_OPENING || p.x > b.max.x + NEAR_OPENING || p.z < b.min.z - NEAR_OPENING || p.z > b.max.z + NEAR_OPENING) continue;
      const index = wallIndex(o.run), door = doorIndexOf(cfg, o);
      if (index >= 0 && door >= 0) return { what: 'opening', key: 'walls', index, door, axis: o.axis, box: sheet.pieces.find((q) => q.id === o.run)?.box };
    }
    const runs = sheet.pieces.map((piece) => ({ piece, index: wallIndex(piece.id) })).filter((r) => r.index >= 0);
    for (const { piece, index } of runs) {
      const row = cfg.walls[index], b = piece.box;
      const axis = axisOf(row, b), c = axis === 'x' ? 'z' : 'x', k = axis === 'x' ? 0 : 1;
      if (p[c] < b.min[c] - NEAR_EDGE || p[c] > b.max[c] + NEAR_EDGE) continue;
      const fromAtMin = row.from[k] <= row.to[k];
      if (Math.abs(p[axis] - b.min[axis]) <= NEAR_END) return { what: 'end', key: 'walls', index, end: fromAtMin ? 'from' : 'to', axis };
      if (Math.abs(p[axis] - b.max[axis]) <= NEAR_END) return { what: 'end', key: 'walls', index, end: fromAtMin ? 'to' : 'from', axis };
    }
    const area = (b) => (b.max.x - b.min.x) * (b.max.z - b.min.z);
    const rooms = sheet.rooms.map((r) => ({ r, index: roomIndex(r.id) })).filter((x) => x.index >= 0)
      .sort((a, b) => area(a.r.bounds) - area(b.r.bounds));
    for (const { r, index } of rooms) {
      const b = r.bounds;
      if (p.x < b.min.x - NEAR_EDGE || p.x > b.max.x + NEAR_EDGE || p.z < b.min.z - NEAR_EDGE || p.z > b.max.z + NEAR_EDGE) continue;
      if (cfg.rooms[index].drum) {
        if (p.x >= b.min.x && p.x <= b.max.x && p.z >= b.min.z && p.z <= b.max.z) return { what: 'drum-room', key: 'rooms', index };
        continue;
      }
      // One edge per axis, the nearer, so a room narrower than two grabs still
      // gives the press to one side of it.
      const pickX = Math.abs(p.x - b.min.x) <= Math.abs(p.x - b.max.x) ? 'minX' : 'maxX';
      const pickZ = Math.abs(p.z - b.min.z) <= Math.abs(p.z - b.max.z) ? 'minZ' : 'maxZ';
      const edges = {};
      if (Math.abs(p.x - (pickX === 'minX' ? b.min.x : b.max.x)) <= NEAR_EDGE) edges[pickX] = true;
      if (Math.abs(p.z - (pickZ === 'minZ' ? b.min.z : b.max.z)) <= NEAR_EDGE) edges[pickZ] = true;
      const inside = p.x >= b.min.x && p.x <= b.max.x && p.z >= b.min.z && p.z <= b.max.z;
      if (Object.keys(edges).length) return { what: 'room', key: 'rooms', index, edges };
      if (inside) return { what: 'room', key: 'rooms', index, edges: ALL_EDGES };
    }
    for (const { piece, index } of runs) {
      const b = piece.box;
      if (p.x >= b.min.x && p.x <= b.max.x && p.z >= b.min.z && p.z <= b.max.z) return { what: 'run', key: 'walls', index };
    }
    return null;
  };
  const CURSOR = { opening: 'grab', end: 'ew-resize', run: 'pointer', 'drum-room': 'not-allowed' };
  const cursorFor = (hit) => {
    if (!hit) return 'crosshair';
    if (hit.what === 'end') return hit.axis === 'x' ? 'ew-resize' : 'ns-resize';
    if (hit.what !== 'room') return CURSOR[hit.what];
    const e = hit.edges;
    if (e === ALL_EDGES) return 'move';
    const x = e.minX || e.maxX, z = e.minZ || e.maxZ;
    return x && z ? ((e.minX && e.minZ) || (e.maxX && e.maxZ) ? 'nwse-resize' : 'nesw-resize') : x ? 'ew-resize' : 'ns-resize';
  };

  /* ---- the draft: one edited row and the plan it builds ---- */
  // The models are measured once, the first time the view opens: `makePlan`
  // needs `boundsOf`, and CastleBuilder.measure() is the only thing in the page
  // that can answer it (#746). Its loads go through the cache the castle was
  // built from, so this is a re-clone and not a re-fetch.
  const measure = () => {
    if (boundsOf || measuring || !castle || typeof castle.measure !== 'function') return;
    measuring = castle.measure().then((fn) => { boundsOf = fn; measuring = null; }, (e) => { measuring = null; say(`could not measure the models: ${e.message}`, false); });
  };
  /** The draft for `row` at `key[index]`: the config with that row in it, and either the plan it builds or the throw it builds instead. */
  const setDraft = (key, index, row) => {
    const c = withRow(cfg, key, index, row);
    try {
      draft = { key, index, row, cfg: c, plan: makePlan(c, boundsOf), error: null };
    } catch (e) {
      draft = { key, index, row, cfg: c, plan: null, error: String(e && e.message ? e.message : e) };
    }
  };
  /** Rooms, walkable cells and cells outside the curtain: what the panel prints. Numbers, not checks (#749). */
  const numbersOf = (p) => {
    const w = walkability(p);
    return { rooms: p.rooms.length, reached: w.rooms().filter((r) => r.reachable).length, cells: w.cells.length, outside: w.leaked };
  };
  const numbersText = (was, now) =>
    `rooms ${was.rooms} -> ${now.rooms}, ${was.reached} -> ${now.reached} with a reachable cell\n`
    + `walkable cells ${was.cells} -> ${now.cells}\ncells outside the curtain ${was.outside} -> ${now.outside}`;

  /**
   * The draft, written, if it builds. A draft whose `makePlan` threw is shown
   * and dropped and nothing is posted. One that builds is posted whole as a
   * `move` of its row, and the dev server's answer is the array as it now is
   * on disk, which replaces this view's copy (edit-mode.js's rule: the panel
   * never keeps its own idea of the file).
   */
  const commit = async (what) => {
    const d = draft;
    if (!d) return;
    if (d.error) {
      draft = null; draw();
      return say(`not written: makePlan threw\n${d.error}`, false);
    }
    if (d.row === cfg[d.key][d.index]) { draft = null; draw(); return; }
    busy = true;
    try {
      numbersBase ??= numbersOf(base);
      const now = numbersOf(d.plan);
      const res = await fetch('/__place', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'move', key: d.key, index: d.index, row: d.row }),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) { draft = null; draw(); return say(out.error || `the dev server said ${res.status}`, false); }
      cfg = { ...cfg, [out.key]: out.rows };
      base = d.plan;
      say(`wrote ${d.key}[${d.index}] ${d.row.id}: ${what}\n${numbersText(numbersBase, now)}`);
      numbersBase = now;
      draft = null;
      draw();
    } catch (e) {
      draft = null; draw();
      say(String(e && e.message ? e.message : e), false);
    } finally {
      busy = false;
    }
  };

  /** One change to the picked row from the panel or a key, rather than a drag: drafted, then written. */
  const edit = (fn, what) => {
    if (busy || !sel) return;
    if (!boundsOf) return say('measuring the models; try again in a moment', false);
    let row;
    try { row = fn(cfg[sel.key][sel.index]); } catch (e) { return say(e.message, false); }
    setDraft(sel.key, sel.index, row);
    draw();
    return commit(what);
  };

  /* ---- the drags ---- */
  catcher.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !open) return;
    const p = worldAt(e);
    const hit = hitTest(p);
    armed = 0;
    sel = hit && hit.what !== 'drum-room' ? { key: hit.key, index: hit.index, door: hit.what === 'opening' ? hit.door : null } : null;
    if (hit && hit.what === 'drum-room') sel = { key: 'rooms', index: hit.index, door: null };
    draw();
    if (!hit || hit.what === 'run' || hit.what === 'drum-room') return;
    if (busy) return say('a write is still going; one moment', false);
    if (!boundsOf) return say('measuring the models; try again in a moment', false);
    drag = { start: p, hit, orig: cfg[hit.key][hit.index], sig: '' };
    catcher.setPointerCapture(e.pointerId);
  });
  catcher.addEventListener('pointermove', (e) => {
    if (!open) return;
    const p = worldAt(e);
    if (!drag) { catcher.style.cursor = cursorFor(hitTest(p)); return; }
    const { hit, orig } = drag;
    const tile = base.tile;
    const step = e.altKey ? FINE_SNAP : SNAP;
    const dxm = p.x - drag.start.x, dzm = p.z - drag.start.z;
    let row;
    try {
      if (hit.what === 'room') {
        row = dragRoom(orig, { dx: snapTo(dxm / tile, step), dz: snapTo(dzm / tile, step), edges: hit.edges, tile });
      } else if (hit.what === 'end') {
        const d = snapTo((hit.axis === 'x' ? dxm : dzm) / tile, step);
        row = dragRunEnd(orig, hit.end, hit.axis === 'x' ? { dx: d } : { dz: d });
      } else {
        const d = orig.doorways[hit.door];
        const along = hit.axis === 'x' ? dxm : dzm;
        const at = hit.box
          ? clampOpening(snapTo(d.at + along / tile, OPENING_SNAP_METRES / tile), d.width, hit.box.min[hit.axis], hit.box.max[hit.axis], tile)
          : snapTo(d.at + along / tile, OPENING_SNAP_METRES / tile);
        row = moveOpening(orig, hit.door, at);
      }
    } catch (err) {
      draft = null;
      say(err.message, false);
      draw();
      return;
    }
    const sig = JSON.stringify(row);
    if (sig === drag.sig) return;
    drag.sig = sig;
    if (sig === JSON.stringify(orig)) draft = null;
    else setDraft(hit.key, hit.index, row);
    if (draft && draft.error) say(`will not write: makePlan throws\n${draft.error}`, false);
    else say(draft ? 'drop to write it' : '');
    draw();
  });
  const endDrag = (e, cancel = false) => {
    if (!drag) return;
    const { hit } = drag;
    drag = null;
    if (catcher.hasPointerCapture?.(e.pointerId)) catcher.releasePointerCapture(e.pointerId);
    if (cancel || !draft) { draft = null; draw(); return; }
    commit(hit.what === 'room' ? 'room dragged' : hit.what === 'end' ? `${hit.end} end dragged` : `doorway ${hit.door} slid`);
  };
  catcher.addEventListener('pointerup', (e) => endDrag(e));
  catcher.addEventListener('pointercancel', (e) => endDrag(e, true));
  // A wheel over the sheet is not the game's to have.
  catcher.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

  /* ---- the width box ---- */
  widthIn.addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
    e.preventDefault();
    const width = Number(widthIn.value);
    const door = sel?.door;
    widthIn.blur();
    if (door == null) return;
    edit((row) => widenOpening(row, door, width), `doorway ${door} ${width} m wide`);
  });

  /* ---- Delete twice cuts the picked doorway ---- */
  const cut = () => {
    if (!sel || sel.door == null) return say('pick a doorway to cut; a room or a run is cut in the file by hand', false);
    const now = Date.now();
    if (now - armed > ARMED_FOR) {
      armed = now;
      return say(`press Delete again to cut doorway ${sel.door} of ${cfg.walls[sel.index].id}`, false);
    }
    armed = 0;
    const door = sel.door;
    sel = { ...sel, door: null };
    return edit((row) => cutOpening(row, door), `doorway ${door} cut`);
  };

  /* ---- the labels, projected through the camera the frame is drawn with ---- */
  let tags = [];
  const v = new THREE.Vector3();
  const placeLabels = () => {
    if (!sheet) return;
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    const box = renderer.domElement.getBoundingClientRect();
    sheet.rooms.forEach((r, i) => {
      const el = tags[i];
      if (!el) return;
      v.set((r.bounds.min.x + r.bounds.max.x) / 2, sheet.ceiling, (r.bounds.min.z + r.bounds.max.z) / 2);
      v.project(camera);
      el.style.left = `${box.left + (v.x * 0.5 + 0.5) * w}px`;
      el.style.top = `${box.top + (-v.y * 0.5 + 0.5) * h}px`;
    });
  };

  /* ---- the three verbs ---- */
  /* THE FOG COMES OFF WHILE THE VIEW IS OPEN, and putting it back is half of
   * `hide`. scene-setup.js hangs a THREE.Fog on the scene for the walk through
   * the castle, and fog is measured from the camera: this one stands 400 m up,
   * so with the fog left on the first frame of the floor plan was a flat sheet
   * of fog colour with the room labels floating over it and no castle under
   * them at all. The ghosting below is what a storey's depth reads as instead. */
  let fog = null;
  const show = () => {
    if (open) return;
    open = true;
    fog = scene.fog; scene.fog = null;
    panel.hidden = false; labels.hidden = false; overlay.visible = true; catcher.hidden = false;
    // A cursor is what drags, and a held pointer has none.
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    measure();
    fitted = ''; fit();
    draw();
  };
  const hide = () => {
    if (!open) return;
    open = false;
    scene.fog = fog; fog = null;
    panel.hidden = true; labels.hidden = true; overlay.visible = false; catcher.hidden = true;
    drag = null; draft = null; armed = 0;
    clearOverlay();
    undress();
  };
  const step = (by) => {
    if (!open) return;
    const i = levels.indexOf(level);
    const next = levels[Math.min(levels.length - 1, Math.max(0, i + by))];
    if (next === level) return;
    level = next;
    draw();
  };

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    if (e.code === 'KeyV') { e.stopPropagation(); if (open) hide(); else show(); return; }
    if (!open) return;
    if (e.code === 'BracketLeft') { e.stopPropagation(); step(-1); }
    else if (e.code === 'BracketRight') { e.stopPropagation(); step(1); }
    else if (e.code === 'Delete') { e.stopPropagation(); cut(); }
    else if (e.code === 'Escape') {
      e.stopPropagation();
      // Esc in the middle of a drag drops the drag and not the view.
      if (drag) { drag = null; draft = null; draw(); say('drag dropped, nothing written'); } else hide();
    }
  }, true);

  // `?edit=1&view=plan` opens straight into it, so the thing Devon wants to look
  // at is one URL and not a key press he has to know about.
  if (new URLSearchParams(window.location.search).get('view') === 'plan') show();

  return {
    get camera() { return open ? camera : null; },
    isOpen: () => open,
    update() {
      if (!open) return;
      fit();
      placeLabels();
    },
  };
}
