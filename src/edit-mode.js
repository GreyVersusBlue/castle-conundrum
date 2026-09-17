// edit-mode.js — the placement editor (BACKLOG.md rank 13), `?edit=1` on the
// dev server and nowhere else.
//
// Every prop in this castle got its tile coordinates by a session hand-typing
// two numbers into data/scene-config.json, reloading, and looking. That is why
// there are so few: nineteen of the castle's forty rooms have nothing in them
// at all. This is the tool that makes placing one cost a key press.
//
// THE DEV-ONLY GUARANTEE IS TWO THINGS, AND ONLY ONE OF THEM IS THIS FILE.
// main.js imports this module from inside `if (import.meta.env.DEV && ...)`,
// which Vite replaces with `false` in a build and drops, so the module never
// enters the production graph at all. The other half is `tools/place.mjs`'s
// writer, which lives in a Vite plugin with `apply: 'serve'` and cannot run in
// a build even if something called it. Neither is a promise: `test/built.mjs`
// greps the built bundle for the sentinel below and fails if it is there
// (#501's lesson — check what got SERVED, not what got asked for).
export const EDITOR_SENTINEL = 'castle-placement-editor-v1';

// The panel is plain inline style rather than a class in ui.css, because
// ui.css ships and this does not.
const PANEL = `
  position:fixed; top:12px; left:12px; z-index:9999; width:280px;
  font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;
  background:rgba(18,16,14,.92); color:#e8e0d0; border:1px solid #6b5c44;
  border-radius:6px; padding:10px; pointer-events:auto;`;
const FIELD = 'width:100%; margin:2px 0 6px; background:#241f19; color:#e8e0d0; border:1px solid #6b5c44; border-radius:3px; padding:3px; font:inherit;';

/**
 * @param scene      the THREE.Scene, for the marker
 * @param THREE      passed in rather than imported, so this file pulls in nothing
 * @param camera     read every frame for the tile under the player
 * @param nav        castleNav, for the room name the HUD already computes
 * @param config     data/scene-config.json, for tileSize and the model lists
 * @param eyeHeight  EYE_HEIGHT, to turn the camera's y into the feet's
 * @returns { update } — called from main.js's loop
 */
export function mountEditor({ scene, THREE, camera, nav, config, eyeHeight }) {
  const tileSize = config.tileSize || 4;
  const models = [...new Set((config.interiorProps || []).map((p) => p.model))].sort();
  const materials = Object.keys(config.plainMaterials || {}).concat(Object.keys(config.materials || {}));

  const panel = document.createElement('div');
  panel.setAttribute('data-editor', EDITOR_SENTINEL);
  panel.style.cssText = PANEL;
  panel.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">placement editor</div>
    <div data-where style="margin-bottom:8px;opacity:.85"></div>
    <label>array<select data-array style="${FIELD}">
      <option value="interiorProps">interiorProps (a kit model)</option>
      <option value="builtProps">builtProps (a built slab)</option>
      <option value="braziers">braziers</option>
    </select></label>
    <label data-model-row>model<select data-model style="${FIELD}">${models.map((m) => `<option>${m}</option>`).join('')}</select></label>
    <label data-material-row hidden>material<select data-material style="${FIELD}">${materials.map((m) => `<option>${m}</option>`).join('')}</select></label>
    <label data-id-row hidden>id<input data-id style="${FIELD}" placeholder="a-new-prop"></label>
    <label>comment<input data-comment style="${FIELD}" placeholder="why it is here"></label>
    <button data-place style="${FIELD}cursor:pointer">Place here  (P)</button>
    <div data-said style="min-height:2.4em;white-space:pre-wrap"></div>
    <div style="opacity:.6;margin-top:4px">Esc for the cursor, P while walking.</div>`;
  document.body.appendChild(panel);

  const $ = (sel) => panel.querySelector(sel);
  const where = $('[data-where]'), said = $('[data-said]');
  const arraySel = $('[data-array]');
  const say = (text, ok = true) => { said.textContent = text; said.style.color = ok ? '#9fd08a' : '#e08a8a'; };

  // A built slab needs an id and a material; a kit model needs a model. The
  // panel shows whichever of the three the chosen array actually takes, so a
  // row that `checkRow` would refuse cannot be built by clicking.
  const syncFields = () => {
    const kind = arraySel.value;
    $('[data-model-row]').hidden = kind !== 'interiorProps';
    $('[data-material-row]').hidden = kind !== 'builtProps';
    $('[data-id-row]').hidden = kind !== 'builtProps';
  };
  arraySel.addEventListener('change', syncFields);
  syncFields();

  // The marker: a wire box on the last tile placed, so the thing that just went
  // into the file is visible without a reload. It is not what the prop will look
  // like and is not meant to be; the reload is what shows that.
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x6fd08a, wireframe: true }),
  );
  marker.visible = false;
  marker.renderOrder = 999;
  scene.add(marker);

  const round = (n, dp = 3) => Number(n.toFixed(dp));
  const here = () => {
    const feet = camera.position.y - eyeHeight;
    return {
      tile: [round(camera.position.x / tileSize), round(camera.position.z / tileSize)],
      base: round(feet, 2),
      feet,
      room: nav.roomAt(camera.position.x, camera.position.z, feet),
    };
  };

  async function place() {
    const at = here();
    const kind = arraySel.value;
    const comment = $('[data-comment]').value.trim();
    const row = { tile: at.tile };
    if (kind === 'interiorProps') row.model = $('[data-model]').value;
    if (kind === 'builtProps') {
      row.id = $('[data-id]').value.trim();
      row.material = $('[data-material]').value;
      row.base = at.base;
      row.size = [0.5, 0.5, 0.5];
      if (!row.id) return say('a builtProps row needs an id', false);
    }
    // No `base` on a brazier: `createBrazier` reads the tile and puts the stand
    // on the ground, so one placed on a tower's first floor lands under it. Say
    // so rather than writing a field nothing reads.
    if (kind === 'braziers' && at.base > 0.01) say(`note: a brazier stands on the ground, not at ${at.base.toFixed(2)} m`, false);
    // The room is written into the comment rather than into a field, because no
    // placeable array has a `room` key: the builder works out what room a tile
    // is in, and a second answer written beside it is a second answer to drift.
    row.comment = `${comment ? `${comment}. ` : ''}Placed with ?edit=1 in ${at.room.id} at ${at.base.toFixed(2)} m.`;
    try {
      const res = await fetch('/__place', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: kind, row }),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) return say(out.error || `the dev server said ${res.status}`, false);
      marker.position.set(at.tile[0] * tileSize, at.feet + 0.3, at.tile[1] * tileSize);
      marker.visible = true;
      say(`wrote ${kind}[${out.index}] at ${at.tile[0]}, ${at.tile[1]}\nreload to see it built`);
    } catch (e) {
      say(String(e && e.message ? e.message : e), false);
    }
  }

  $('[data-place]').addEventListener('click', place);
  // Capture, so the key lands whether or not the pointer is locked, and stop it
  // reaching the game: P does nothing there today and this keeps it that way.
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyP' || e.repeat) return;
    if (document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    e.stopPropagation();
    place();
  }, true);

  return {
    update() {
      const at = here();
      where.textContent = `tile ${at.tile[0]}, ${at.tile[1]}\n${at.room.name || at.room.id} — feet ${at.base.toFixed(2)} m`;
    },
  };
}
