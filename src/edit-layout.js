// edit-layout.js — the floor plan you can see (BACKLOG.md rank 13, SPECS.md
// "The floor plan you can see", increment 1). `?edit=1&view=plan` on the dev
// server, `V` from inside the castle, and nowhere else.
//
// WHY THIS EXISTS. The castle's forty-three rooms were placed one room and one
// guess at a time, in first person, by sessions that could only ever see the
// wall in front of them. data/scene-config.json is 3113 hand-typed lines and
// the whole plan has never been on a screen at once. This is the screen.
//
// IT WRITES NOTHING. Increment 1 is the review half of Devon's ask — "or at
// least to review and correct it visually" — and it ships without touching
// tools/place.mjs, PLACEABLE, /__place or the byte-exactness rail under them
// (#748). Every key below reads.
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

export const LAYOUT_SENTINEL = 'castle-layout-editor-v1';

const PANEL = `
  position:fixed; top:12px; right:12px; z-index:9999; width:260px;
  font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;
  background:rgba(18,16,14,.92); color:#e8e0d0; border:1px solid #6b5c44;
  border-radius:6px; padding:10px; pointer-events:auto;`;
const LABELS = `
  position:fixed; inset:0; z-index:9998; pointer-events:none;
  font:11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;`;

/** How much clear ground to leave round the castle in the frame, in metres. */
const MARGIN = 6;
/** How far above the castle the camera stands. Orthographic, so this is only a near/far question. */
const HIGH = 400;
/** What a storey below the one being read is dimmed to. */
const GHOST = 0.25;

const ROOM_LINE = 0x8fd0ff;
const MYSTERY_LINE = 0xffd27f;
const OPENING_LINE = 0x7fe08a;

/**
 * @param scene    the THREE.Scene the castle is in
 * @param THREE    passed in rather than imported, the way edit-mode.js takes it
 * @param renderer for the canvas size the frustum is fitted to
 * @param plan     what `makePlan` returned: the single source (#500)
 * @param castle   the CastleBuilder, for `objects` — planId to the live object
 * @param config   data/scene-config.json, for the `doorways` the plan does not carry
 * @param mystery  data/mystery.json, for which rooms the mystery names
 * @returns { update, camera, isOpen } — `camera` is null unless the view is on,
 *          and main.js renders `editor?.camera ?? camera`
 */
export function mountLayoutView({ scene, THREE, renderer, plan, castle, config = null, mystery = null }) {
  const levels = plan.levels.slice();
  let level = levels[0];
  let open = false;

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
    <div style="opacity:.6">V closes it. [ and ] change storey. Esc back to the castle.
    Blue is a room, amber is a room the mystery names, green is a doorway. Read only.</div>`;
  document.body.appendChild(panel);
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
  const mats = { room: lineMat(ROOM_LINE), mystery: lineMat(MYSTERY_LINE), opening: lineMat(OPENING_LINE) };
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
    for (const piece of plan.pieces) {
      const obj = castle?.objects?.get(piece.id);
      if (obj) dress(obj, 'show');
    }
  };

  /* ---- what one storey looks like ---- */
  let sheet = null;
  const draw = () => {
    sheet = planSheet(plan, level, { config, mystery });
    clearOverlay();
    const y = sheet.ceiling;
    for (const room of sheet.rooms) rect(room.bounds, y, room.inMystery ? mats.mystery : mats.room);
    for (const o of sheet.openings) cross(o.point, y, Math.max(o.width, 1) / 2, mats.opening);

    // The storey filter, off the plan's own boxes and not off a live Box3: a
    // piece the builder has not finished loading still has a plan box.
    for (const piece of plan.pieces) {
      const obj = castle?.objects?.get(piece.id);
      if (!obj) continue;
      const where = storeyOf(plan, piece.box, level);
      dress(obj, where === 'above' ? 'hide' : where === 'below' ? 'ghost' : 'show');
    }

    labels.innerHTML = sheet.rooms.map((r, i) =>
      `<div data-room="${i}" style="position:absolute;transform:translate(-50%,-50%);padding:1px 3px;border-radius:2px;background:rgba(18,16,14,.7);color:${r.inMystery ? '#ffd27f' : '#8fd0ff'}">${r.name || r.id}</div>`).join('');
    tags = [...labels.children];

    panel.querySelector('[data-storey]').textContent =
      `storey ${level} of ${levels.join(', ')}  —  ${sheet.floor} to ${sheet.ceiling} m`;
    panel.querySelector('[data-counts]').textContent =
      `${sheet.rooms.length} rooms (${sheet.rooms.filter((r) => r.inMystery).length} the mystery names)\n`
      + `${sheet.pieces.length} pieces of ${plan.pieces.length}\n${sheet.openings.length} openings`;
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
    panel.hidden = false; labels.hidden = false; overlay.visible = true;
    fitted = ''; fit();
    draw();
  };
  const hide = () => {
    if (!open) return;
    open = false;
    scene.fog = fog; fog = null;
    panel.hidden = true; labels.hidden = true; overlay.visible = false;
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
    else if (e.code === 'Escape') { e.stopPropagation(); hide(); }
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
