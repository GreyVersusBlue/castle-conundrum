// gvb-save.js — one save system for every sim on greyversusblue.com.
//
// VENDORED COPY (#502). The original is `assets/js/gvb-save.js` in
// GreyVersusBlue/tools-and-games, where eleven other projects share it. This is
// a copy taken on 2026-09-15 when Castle Conundrum moved to its own repository
// and `src/save.js`'s `../../../assets/js/gvb-save.js` stopped resolving. It is
// a fork: a fix to the shared copy will not reach this one, and a fix made here
// is worth carrying back by hand. Everything below this block is that file
// unedited, including the adopter list, which is the other repo's.
//
// Generalized from the Fourth Quarter's campaign save: a namespaced key, a
// schema version, a migration hook, and a validator that refuses to load
// garbage instead of crashing the game on boot. Adds the piece nothing had —
// export to a file and import it back, so a save survives a cleared browser.
//
// ES module, no dependencies. The pure parts (serialize / deserialize /
// normalize) run in plain Node, which is how the smoke test exercises them.
//
//   import { createSaveSlot } from "/assets/js/gvb-save.js";
//
//   const slot = createSaveSlot({
//     game: "fourth-quarter",
//     key: "fq3d-save",
//     version: 2,
//     validate: c => c && typeof c.day === "number" && Array.isArray(c.staff),
//     migrate: (c, from) => { if (from < 2) c.upgrades ??= []; return c; },
//     defaults: { day: 1, staff: [] }
//   });
//
//   let state = slot.load() ?? slot.fresh();
//   slot.save(state);
//
// A module that also runs under Node — a game's own pure logic file with a
// smoke test, which is the case in the first real adopter — should import this
// by RELATIVE path rather than the site-absolute one above. Node can't resolve
// a leading slash, and the relative form works identically in the browser. Here
// that is `./gvb-save.js` from `src/save.js`, which is the whole reason this
// copy exists.
//
// Adopted by: The Fourth Quarter, Aphelion, Closing Time, Torchbearer,
// The Absalom Inheritance, Corner & Kettle, Daredevil, Integer Foundry,
// The Fracture Cycle, Name Picker, Seating Chart Generator, Faire Weekend,
// Golden Hour, and Castle Conundrum.
// See assets/js/README.md's "Who uses it" for what each one added.

const ENVELOPE = "gvb-save";

/** Best-effort localStorage. Returns a memory-backed stub in private mode. */
export function defaultStorage() {
  try {
    const t = "__gvb_probe__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
    return localStorage;
  } catch (e) {
    const mem = new Map();
    return {
      getItem: k => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: k => mem.delete(k),
      __memoryOnly: true
    };
  }
}

export function createSaveSlot(options) {
  const {
    game,                       // slug, e.g. "closing-time" — goes in the file
    key = `gvb:${game}`,        // storage key
    version = 1,                // bump when the shape changes
    validate = () => true,      // (state) => boolean
    migrate = state => state,   // (state, fromVersion) => state — version drift only
    repair = state => state,    // (state) => state — every accepted load
    defaults = null,            // used by fresh(): a literal, or a factory
    storage = null              // inject a stub in tests
  } = options;

  if (!game) throw new Error("createSaveSlot: `game` is required");
  // `typeof localStorage` is not a safe undeclared-identifier check here — it's a
  // declared accessor on `window`, so the read itself throws in a browser that
  // blocks storage, before defaultStorage()'s own try/catch ever runs. That is
  // the exact case the memory fallback exists for, so guard the check too.
  let store = storage;
  if (!store) {
    try { store = typeof localStorage !== "undefined" ? defaultStorage() : null; }
    catch (e) { store = defaultStorage(); }
  }

  /**
   * Take an untrusted parsed object and return usable state, or null.
   *
   * `migrate` only runs when the stored version differs from the current one.
   * `repair` runs on every state this returns, whatever its version and whichever
   * entry point it came through — localStorage, an imported file, a pasted blob.
   * That distinction matters: a save written by the current build can still be
   * missing a field (a hand-edited localStorage, a write truncated by a quota
   * error), and the fill-in-the-gaps pass that used to live in a project's own
   * `load()` has nowhere else to go. Keep `repair` idempotent and cheap; it is
   * not the place for version-specific reshaping.
   */
  function normalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    // Accept both a bare state blob and a full export envelope.
    const isEnvelope = raw.format === ENVELOPE;
    const from = Number(isEnvelope ? raw.version : raw.__v) || 0;
    let state = isEnvelope ? raw.state : raw;
    if (!state || typeof state !== "object") return null;
    if (isEnvelope && raw.game && game && raw.game !== game) return null;
    try {
      if (from !== version) state = migrate(state, from);
    } catch (e) {
      return null;
    }
    if (!state || !validate(state)) return null;
    delete state.__v;
    try {
      state = repair(state);
    } catch (e) {
      return null;
    }
    return state && typeof state === "object" ? state : null;
  }

  /** Wrap state in the portable envelope written to disk. */
  function serialize(state, pretty = true) {
    const env = {
      format: ENVELOPE,
      game,
      version,
      savedAt: new Date().toISOString(),
      state
    };
    return JSON.stringify(env, null, pretty ? 2 : 0);
  }

  /** Parse an exported file (or a pasted blob) back into state, or null. */
  function deserialize(text) {
    let raw;
    try { raw = JSON.parse(text); } catch (e) { return null; }
    return normalize(raw);
  }

  /**
   * A brand-new state. `defaults` may be a plain object — deep-copied, so a
   * caller can't mutate the template — or a factory function, for a game whose
   * starting state isn't a constant. The Fourth Quarter's `newCampaign()` rolls
   * three random job applicants, so a literal could not describe day one; it
   * passes `defaults: newCampaign`. That's what makes `reset()` usable there
   * instead of every caller having to remember to build a fresh state itself.
   */
  function fresh(...args) {
    if (typeof defaults === "function") return defaults(...args);
    return defaults ? JSON.parse(JSON.stringify(defaults)) : null;
  }

  function load() {
    if (!store) return null;
    let raw;
    try { raw = store.getItem(key); } catch (e) { return null; }
    if (!raw) return null;
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return null; }
    return normalize(parsed);
  }

  /** Returns true if it stuck. Quota and private-mode failures return false. */
  function save(state) {
    if (!store) return false;
    try {
      store.setItem(key, JSON.stringify({ ...state, __v: version }));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Erase the stored save. Returns true if a key was there to remove. */
  function clear() {
    if (!store) return false;
    let had = false;
    try { had = store.getItem(key) !== null; } catch (e) { return false; }
    try { store.removeItem(key); } catch (e) { return false; }
    return had;
  }

  function reset(...args) {
    clear();
    return fresh(...args);
  }

  /** Save no more than once every `ms`, with a flush on page hide. */
  function autosave(getState, ms = 4000) {
    let timer = null, dirty = false;
    const flush = () => {
      if (!dirty) return;
      dirty = false;
      save(getState());
    };
    const mark = () => {
      dirty = true;
      if (timer) return;
      timer = setTimeout(() => { timer = null; flush(); }, ms);
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
      });
      window.addEventListener("pagehide", flush);
    }
    return { mark, flush, stop() { if (timer) clearTimeout(timer); timer = null; } };
  }

  function filename() {
    const d = new Date();
    const stamp = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
    return `${game}-save-${stamp}.json`;
  }

  /** Download the current state as a .json file. */
  function exportToFile(state, name = filename()) {
    const blob = new Blob([serialize(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  }

  /** Read a File (from an <input type="file">) and resolve with state. */
  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file chosen."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("That file could not be read."));
      reader.onload = () => {
        const state = deserialize(String(reader.result));
        if (!state) return reject(new Error("That is not a valid " + game + " save."));
        resolve(state);
      };
      reader.readAsText(file);
    });
  }

  /** Open a file picker and resolve with the imported state. */
  function promptImport() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.style.display = "none";
      input.addEventListener("change", () => {
        importFromFile(input.files && input.files[0]).then(resolve, reject);
        input.remove();
      });
      document.body.appendChild(input);
      input.click();
    });
  }

  return {
    game, key, version,
    fresh, load, save, reset, clear, autosave,
    serialize, deserialize, normalize,
    exportToFile, importFromFile, promptImport, filename,
    get memoryOnly() { return !!(store && store.__memoryOnly); }
  };
}

/* ---------------------------------------------------------------------------
   Optional drop-in UI: buttons that call the slot for you.

     mountSaveBar(document.getElementById("save-bar"), slot, {
       getState: () => campaign,
       setState: c => { campaign = c; redraw(); },
       onMessage: text => toast(text)
     });

   `buttons` picks which of "export" / "import" / "reset" get mounted, in that
   order by default. A host page that already has its own new-game button wants
   `buttons: ["export", "import"]` rather than two controls that wipe the save
   sitting next to each other — which is exactly what the Fourth Quarter needed,
   since its start screen has shipped a "New Game (wipe save)" button since long
   before this module existed.

   Each button carries `data-gvb="export|import|reset"`. Nothing in the module
   reads it; it's there so a driver script can click a specific one without
   depending on button order or label text.

   Styling is deliberately thin. Override with CSS custom properties on any
   ancestor: --gvb-btn-bg, --gvb-btn-fg, --gvb-btn-border, --gvb-btn-radius.
--------------------------------------------------------------------------- */

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const css = `
.gvb-save-bar{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;font:inherit}
.gvb-save-bar button{
  font:inherit;font-size:.8em;letter-spacing:.06em;cursor:pointer;
  padding:.35em .9em;
  color:var(--gvb-btn-fg,#eee);
  background:var(--gvb-btn-bg,rgba(255,255,255,.08));
  border:1px solid var(--gvb-btn-border,rgba(255,255,255,.22));
  border-radius:var(--gvb-btn-radius,3px);
}
.gvb-save-bar button:hover{filter:brightness(1.18)}
.gvb-save-bar button:focus-visible{outline:2px solid var(--gvb-btn-border,#B08D3E);outline-offset:2px}
.gvb-save-msg{font-size:.78em;opacity:.75;min-height:1em}`;
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
}

export function mountSaveBar(container, slot, handlers = {}) {
  if (!container) return null;
  const {
    getState, setState, onMessage, confirmReset = true,
    buttons = ["export", "import", "reset"],
    filename = null,   // () => string, or a string — export's download name
    labels = {},       // { kind: [label, title] } — override the default wording
  } = handlers;
  injectStyles();

  container.classList.add("gvb-save-bar");
  const msg = document.createElement("span");
  msg.className = "gvb-save-msg";
  msg.setAttribute("aria-live", "polite");

  const say = text => {
    if (onMessage) onMessage(text);
    else { msg.textContent = text; setTimeout(() => { msg.textContent = ""; }, 4000); }
  };

  const button = (kind, label, title, fn) => {
    const override = labels[kind];
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.gvb = kind;
    b.textContent = (override && override[0]) || label;
    b.title = (override && override[1]) || title;
    b.addEventListener("click", fn);
    container.appendChild(b);
    return b;
  };

  const KINDS = {
    export: () => button("export", "Export save", "Download this save as a file", () => {
      const want = typeof filename === "function" ? filename() : filename;
      const name = slot.exportToFile(getState(), want || undefined);
      say("Saved to " + name);
    }),

    // setState runs before the write reaches storage, and can veto it by
    // returning false — a host that rejects an imported state (an id from a
    // pack this browser hasn't loaded, say) should not have already
    // overwritten what was on disk by the time it finds out.
    import: () => button("import", "Import save", "Load a save file from your computer", () => {
      slot.promptImport().then(
        state => {
          const accepted = setState ? setState(state) : true;
          if (accepted !== false) {
            slot.save(state);
            say("Save loaded.");
          }
        },
        err => say(err.message)
      );
    }),

    reset: () => button("reset", "Start over", "Erase this save and begin again", () => {
      if (confirmReset && !confirm("Erase this save and start over? This cannot be undone.")) return;
      const state = slot.reset();
      if (setState) setState(state);
      say("Save erased.");
    }),
  };

  for (const kind of buttons) {
    // Loud on a typo: a silently missing button reads as a broken save bar.
    if (!KINDS[kind]) throw new Error(`mountSaveBar: no such button "${kind}"`);
    KINDS[kind]();
  }

  container.appendChild(msg);
  if (slot.memoryOnly) say("This browser blocks storage — export before you close the tab.");
  return { say };
}

export default { createSaveSlot, mountSaveBar, defaultStorage };
