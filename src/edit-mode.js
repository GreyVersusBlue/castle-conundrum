// edit-mode.js — the placement editor (BACKLOG.md rank 13), `?edit=1` on the
// dev server and nowhere else.
//
// Every prop in this castle got its tile coordinates by a session hand-typing
// two numbers into data/scene-config.json, reloading, and looking. That is why
// there are so few: nineteen of the castle's forty rooms have nothing in them
// at all. This is the tool that makes placing one cost a key press.
//
// AND CORRECTING ONE, WHICH IS THE HALF THAT MAKES IT AN EDITOR. Placing was a
// key press from the day this shipped and moving a prop two tiles left was
// still opening the file, counting rows and typing two numbers — so the tool
// was a stopwatch that could start and not stop. The list below is every row
// within six tiles of the player, nearest first, rebuilt as they walk; M
// writes the selected one to the tile they are standing on and Delete cuts it
// out. Both go through the same splice `insertRow` does, reading the file
// rather than appending to it (tools/place.mjs).
//
// THE PANEL NEVER KEEPS ITS OWN COPY OF THE ARRAY. Every write answers with the
// whole array as it now stands on disk, because a delete shifts every index
// after it and a list that remembered the old order would name the wrong row on
// the next click — which is the one mistake here that is silent, since the file
// still parses and the prop that moved is one nobody asked about.
//
// THE DEV-ONLY GUARANTEE IS TWO THINGS, AND ONLY ONE OF THEM IS THIS FILE.
// main.js imports this module from inside `if (import.meta.env.DEV && ...)`,
// which Vite replaces with `false` in a build and drops, so the module never
// enters the production graph at all. The other half is `tools/place.mjs`'s
// writer, which lives in a Vite plugin with `apply: 'serve'` and cannot run in
// a build even if something called it. Neither is a promise: `test/built.mjs`
// greps the built bundle for the sentinel below and fails if it is there
// (#501's lesson — check what got SERVED, not what got asked for).
//
// From the writer rather than restated here: the key list the panel offers and
// the array it posts to have to be the same list, and the comment rule a move
// applies is a pure string function with a rail under it in test/tools.mjs.
// tools/place.mjs is a string in and a string out with no Node import in it,
// so a browser reads it as happily as the suite does, and it only ever reaches
// one because THIS file did — a build drops both.
import { PLACEABLE, noteComment } from '../tools/place.mjs';

export const EDITOR_SENTINEL = 'castle-placement-editor-v1';

// The panel is plain inline style rather than a class in ui.css, because
// ui.css ships and this does not.
const PANEL = `
  position:fixed; top:12px; left:12px; z-index:9999; width:280px;
  font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;
  background:rgba(18,16,14,.92); color:#e8e0d0; border:1px solid #6b5c44;
  border-radius:6px; padding:10px; pointer-events:auto;`;
const FIELD = 'width:100%; margin:2px 0 6px; background:#241f19; color:#e8e0d0; border:1px solid #6b5c44; border-radius:3px; padding:3px; font:inherit;';
const RULE = 'border:0; border-top:1px solid #6b5c44; margin:10px 0 8px;';

/** How far a row may be from the player and still be offered for editing, in tiles. */
const NEAR = 6;
/** How long a Delete press stays armed, in ms. Two presses rather than one, because the other two verbs are additive and this one is not. */
const ARMED_FOR = 4000;

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
    <hr style="${RULE}">
    <div style="font-weight:700;margin-bottom:4px">a row near here</div>
    <label>within ${NEAR} tiles<select data-row style="${FIELD}"></select></label>
    <div style="display:flex;gap:6px">
      <button data-move style="${FIELD}cursor:pointer">Move here  (M)</button>
      <button data-delete style="${FIELD}cursor:pointer">Delete  (Del)</button>
    </div>
    <div data-said style="min-height:2.4em;white-space:pre-wrap"></div>
    <div style="opacity:.6;margin-top:4px">Esc for the cursor. P places, N picks the next row, M moves it here, Del twice removes it.</div>`;
  document.body.appendChild(panel);

  const $ = (sel) => panel.querySelector(sel);
  const where = $('[data-where]'), said = $('[data-said]');
  const arraySel = $('[data-array]'), rowSel = $('[data-row]');
  const say = (text, ok = true) => { said.textContent = text; said.style.color = ok ? '#9fd08a' : '#e08a8a'; };

  /* The rows as they are on disk. Seeded from the config main.js already
   * parsed and replaced wholesale by every write's answer, so an index the
   * panel sends is an index the file has. */
  const rows = Object.fromEntries(Object.keys(PLACEABLE).map((k) => [k, (config[k] || []).slice()]));
  let armed = 0;

  /** What a row is called in the list: enough to tell two stools in one room apart, which is the tile. */
  const label = (key, i, row) => {
    const what = row.model ? row.model.split('/').pop().replace(/\.gltf$/, '') : row.id || key.replace(/s$/, '');
    return `${key}[${i}]  ${what}  @ ${row.tile[0]}, ${row.tile[1]}`;
  };

  /** Every row within NEAR tiles of `at`, nearest first. */
  const nearby = (at) => Object.entries(rows)
    .flatMap(([key, list]) => list.map((row, i) => ({
      key, i, row, d: Math.hypot(row.tile[0] - at.tile[0], row.tile[1] - at.tile[1]),
    })))
    .filter((c) => c.d <= NEAR)
    .sort((a, b) => a.d - b.d);

  /** The `key` and `index` the list is pointing at, or null. Read off the option rather than held beside it, so the two cannot drift. */
  const picked = () => {
    const [key, i] = (rowSel.value || '').split(':');
    return rows[key] && rows[key][Number(i)] ? { key, index: Number(i), row: rows[key][Number(i)] } : null;
  };

  /* The list is rebuilt as the player walks, which means it is rebuilt out
   * from under whatever is selected. The selection is restored by key and
   * index rather than by position, and a rebuild that would change nothing is
   * skipped outright — otherwise the `<select>` closes itself every frame the
   * player is moving and cannot be used at all. */
  let listKey = '';
  const syncList = (at, force = false) => {
    const near = nearby(at);
    const signature = near.map((c) => `${c.key}:${c.i}`).join('|');
    if (!force && signature === listKey) return;
    listKey = signature;
    const keep = rowSel.value;
    rowSel.innerHTML = near.length
      ? near.map((c) => `<option value="${c.key}:${c.i}">${label(c.key, c.i, c.row)}</option>`).join('')
      : '<option value="">nothing within ' + NEAR + ' tiles</option>';
    if (near.some((c) => `${c.key}:${c.i}` === keep)) rowSel.value = keep;
  };

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

  // The second marker: an amber box on the row the list is pointing at, so
  // which prop M is about to move is a thing you can see rather than a row
  // number you have to trust.
  const pick = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xd8a24a, wireframe: true }),
  );
  pick.visible = false;
  pick.renderOrder = 999;
  scene.add(pick);

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
    row.comment = noteComment(comment, `Placed with ?edit=1 in ${at.room.id} at ${at.base.toFixed(2)} m.`);
    const out = await post({ op: 'add', key: kind, row });
    if (!out) return;
    marker.position.set(at.tile[0] * tileSize, at.feet + 0.3, at.tile[1] * tileSize);
    marker.visible = true;
    say(`wrote ${kind}[${out.index}] at ${at.tile[0]}, ${at.tile[1]}\nreload to see it built`);
  }

  /**
   * One request, and the array it answers with taken as the truth. Returns the
   * body on success and null after saying why not, so every caller is a
   * two-liner and none of them has its own idea of what an error looks like.
   */
  async function post(body) {
    try {
      const res = await fetch('/__place', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) { say(out.error || `the dev server said ${res.status}`, false); return null; }
      rows[out.key] = out.rows;
      return out;
    } catch (e) {
      say(String(e && e.message ? e.message : e), false);
      return null;
    }
  }

  /**
   * The selected row, rewritten at the player's feet. Everything but the tile
   * is the row that was there — its model, its id, its size — because a move
   * is a move and not a re-placement: the panel's own dropdowns describe the
   * NEXT thing to place and have nothing to do with a prop that is already in
   * the file.
   */
  async function move() {
    const sel = picked();
    if (!sel) return say('nothing selected to move', false);
    const at = here();
    const row = { ...sel.row, tile: at.tile };
    if ('base' in row) row.base = at.base;
    row.comment = noteComment(sel.row.comment, `Moved with ?edit=1 to ${at.room.id} at ${at.base.toFixed(2)} m.`);
    const out = await post({ op: 'move', key: sel.key, index: sel.index, row });
    if (!out) return;
    armed = 0;
    syncList(at, true);
    rowSel.value = `${sel.key}:${sel.index}`;
    say(`moved ${sel.key}[${sel.index}] to ${at.tile[0]}, ${at.tile[1]}\nreload to see it built`);
  }

  /**
   * The selected row, cut out — on the second press inside ARMED_FOR. The
   * other two verbs add something a person can see and undo by deleting it;
   * this one takes away a row that took somebody a walk to place, and a
   * mis-pressed key while running past a doorway should not be what does it.
   */
  async function remove() {
    const sel = picked();
    if (!sel) return say('nothing selected to delete', false);
    const now = Date.now();
    if (now - armed > ARMED_FOR) {
      armed = now;
      return say(`press Delete again to remove ${sel.key}[${sel.index}]`, false);
    }
    armed = 0;
    const out = await post({ op: 'delete', key: sel.key, index: sel.index });
    if (!out) return;
    pick.visible = false;
    syncList(here(), true);
    say(`removed ${sel.key}[${sel.index}]\n${out.rows.length} left in ${sel.key} — reload to see it gone`);
  }

  /** Down the list without reaching for the mouse, which is the whole point of a tool used with the pointer locked. */
  const nextRow = () => {
    if (!rowSel.options.length) return;
    rowSel.selectedIndex = (rowSel.selectedIndex + 1) % rowSel.options.length;
    armed = 0;
    const sel = picked();
    if (sel) say(`picked ${sel.key}[${sel.index}]`);
  };

  $('[data-place]').addEventListener('click', place);
  $('[data-move]').addEventListener('click', move);
  $('[data-delete]').addEventListener('click', remove);
  rowSel.addEventListener('change', () => { armed = 0; });
  // Capture, so the key lands whether or not the pointer is locked, and stop it
  // reaching the game: none of these four does anything there today and this
  // keeps it that way. Delete is not bound to Backspace on purpose — Backspace
  // is a browser's back button in enough setups that a mis-press would leave
  // the castle rather than a prop.
  const KEYS = { KeyP: place, KeyM: move, KeyN: nextRow, Delete: remove };
  document.addEventListener('keydown', (e) => {
    const fn = KEYS[e.code];
    if (!fn || e.repeat) return;
    if (document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    e.stopPropagation();
    fn();
  }, true);

  syncList(here(), true);

  return {
    update() {
      const at = here();
      where.textContent = `tile ${at.tile[0]}, ${at.tile[1]}\n${at.room.name || at.room.id} — feet ${at.base.toFixed(2)} m`;
      // Not while the list has the keyboard: rebuilding a `<select>` somebody
      // is scrolling through closes it under their hand.
      if (document.activeElement !== rowSel) syncList(at);
      const sel = picked();
      pick.visible = !!sel;
      if (sel) pick.position.set(sel.row.tile[0] * tileSize, (sel.row.base ?? at.feet) + 0.4, sel.row.tile[1] * tileSize);
    },
  };
}
