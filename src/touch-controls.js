// touch-controls.js — the second input scheme: a thumb on each half of the screen.
//
// NO THREE AND NO GAME LOGIC. It reads touches off the canvas and writes two
// things: an axis triple `{forward, strafe, sprint}` shaped exactly like the one
// `PlayerController.update` derives from the key set, and yaw/pitch onto an
// object the caller hands it, in `YXZ` order — which is the order
// `PointerLockControls` writes and the order `test/drive.mjs`'s `aimAt` reads
// (#530). So the controller does not know which scheme is driving it, and
// nothing downstream of the controller knows there is a second one.
//
// THE LEFT HALF IS A STICK AND THE RIGHT HALF IS LOOK. The stick's origin is
// wherever the thumb lands, not a fixed circle, because a fixed circle on a
// phone is a thing you have to find; the ring in the HUD follows the thumb.
// Past 80 percent of the stick's throw is a sprint, which is the second finger
// a mouse has in Shift.
//
// A TAP ON A STICK MUST NOT ADVANCE THE DIALOGUE IT IS STANDING IN FRONT OF.
// A tap fires a synthetic `click`, and `src/interaction.js` listens for clicks
// on the document because a click is how a dialogue is advanced with a mouse.
// So `touchend` is preventDefault()ed for every touch these zones handled,
// which is exactly what tells the browser not to synthesise that click — and
// nothing else is suppressed: the E and Journal buttons are DOM buttons over
// the canvas and get their own clicks, and the dialogue box is a DOM element
// over the canvas too, so tapping the words still steps through them. That is
// the guard `test/touch.mjs` breaks on purpose (#530). `touchmove` is
// prevented as well, for the ordinary reason: otherwise the page scrolls under
// the thumb. `touchstart` is left alone, because preventing it in Chrome
// cancels the whole gesture including the move events this needs.

/** The radius, in CSS pixels, at which the stick is fully over. */
const STICK_THROW = 56;
/** Past this fraction of the throw, the thumb is sprinting. */
const SPRINT_AT = 0.8;
/** Radians of look per CSS pixel dragged. Tuned against nothing; see #53. */
const LOOK_RATE = 0.0042;
const PITCH_LIMIT = Math.PI / 2 - 0.02;

/**
 * Is this most likely a device with a thumb on it?
 *
 * Two questions, because neither alone is right: `(pointer: coarse)` is the
 * honest one and a headless Chromium with touch emulation does not always
 * answer it, and `maxTouchPoints` is true of a laptop with a touchscreen whose
 * owner is using the mouse. Detection picks the default and the start panel's
 * toggle overrides it, which is the hybrid case both of these get wrong (#530).
 */
export function isTouchLikely() {
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const points = typeof navigator === 'object' ? (navigator.maxTouchPoints || 0) : 0;
  return !!coarse || points > 0;
}

/**
 * @param dom      the element touches are read from — the renderer's canvas
 * @param aim      an Object3D-shaped thing with `.rotation` in YXZ: the camera
 * @param onStick  (state) => void, for the HUD's ring; state is null on release
 */
export function createTouchControls({ dom, aim, onStick = null } = {}) {
  // id -> {kind, x0, z0 (page coords at touchdown), x, y}
  const live = new Map();
  let axes = { forward: 0, strafe: 0, sprint: false };

  const clear = () => { axes = { forward: 0, strafe: 0, sprint: false }; onStick?.(null); };

  const isLook = (t) => t.clientX >= (dom.clientWidth || window.innerWidth) / 2;

  const recompute = () => {
    let stick = null;
    for (const t of live.values()) if (t.kind === 'move') { stick = t; break; }
    if (!stick) return clear();
    const dx = stick.x - stick.x0, dy = stick.y - stick.y0;
    const len = Math.hypot(dx, dy);
    const over = Math.min(1, len / STICK_THROW);
    if (len < 1e-6) return clear();
    // Screen down is forward's negative: dragging the thumb up walks forward.
    axes = {
      forward: (-dy / len) * over,
      strafe: (dx / len) * over,
      sprint: over >= SPRINT_AT,
    };
    onStick?.({ x0: stick.x0, y0: stick.y0, x: stick.x0 + (dx / len) * STICK_THROW * over, y: stick.y0 + (dy / len) * STICK_THROW * over });
  };

  const onStart = (e) => {
    for (const t of e.changedTouches) {
      live.set(t.identifier, { kind: isLook(t) ? 'look' : 'move', x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY });
    }
    recompute();
    // No preventDefault here; see the header.
  };

  const onMove = (e) => {
    for (const t of e.changedTouches) {
      const held = live.get(t.identifier);
      if (!held) continue;
      if (held.kind === 'look') {
        aim.rotation.order = 'YXZ';
        aim.rotation.y -= (t.clientX - held.x) * LOOK_RATE;
        aim.rotation.x -= (t.clientY - held.y) * LOOK_RATE;
        aim.rotation.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, aim.rotation.x));
      }
      held.x = t.clientX; held.y = t.clientY;
    }
    recompute();
    // THIS one is prevented: without it the page scrolls under the thumb.
    if (e.cancelable) e.preventDefault();
  };

  const onEnd = (e) => {
    let ours = false;
    for (const t of e.changedTouches) ours = live.delete(t.identifier) || ours;
    recompute();
    // THE GUARD. No synthetic click for a finger that was driving the castle.
    if (ours && e.cancelable) e.preventDefault();
  };

  dom.addEventListener('touchstart', onStart, { passive: true });
  dom.addEventListener('touchmove', onMove, { passive: false });
  dom.addEventListener('touchend', onEnd, { passive: false });
  dom.addEventListener('touchcancel', onEnd, { passive: false });
  window.addEventListener('blur', () => { live.clear(); clear(); });

  return {
    /** The axis triple, shaped like the one the key set produces. */
    read() { return axes; },
    /** Drop every finger: called when an overlay takes the screen. */
    release() { live.clear(); clear(); },
  };
}
