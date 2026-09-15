// audio.js — the two sounds the castle makes, synthesised, out of data/sounds.json.
//
// NO THREE AND NO BYTES. Every sound here is built out of one noise buffer and
// a handful of oscillators at the moment it plays, so there is no audio file in
// this repo to fetch, to license or to host (#493 would refuse a host anyway),
// and no new directory for test/assets.mjs's reachability sweep to grow (#390).
// The numbers are all in `data/sounds.json`; this file holds no default of its
// own, so tuning a footstep is a data edit.
//
// It takes three's `AudioListener` rather than importing three, for the same
// reason src/castle-plan.js takes `boundsOf`: what it needs is the Web Audio
// context and a listener whose position and orientation somebody else keeps
// pointed at the camera. `THREE.AudioListener.updateMatrixWorld` does exactly
// that every frame the renderer draws, so a plain PannerNode at the bell's
// world point is spatialised against the player's own head with nothing else
// wired up. The consequence that matters: `stepClassOf` below is a pure
// function over a plan surface and a data file, and test/layout.mjs imports it
// in Node and calls it for all 71 surfaces without a browser.
//
// THE CONTEXT STARTS SUSPENDED. A browser refuses to make a noise before the
// user has done something; `resume()` is called from the Enter the Castle
// button's own handler, which is that something. Before it, every play() here
// is a few nodes created and torn down in silence, which is cheap and, more to
// the point, keeps the code that calls it free of a "can we make a noise yet"
// question.

/**
 * What a foot landing on `surface` sounds like: one of `sounds.steps.classes`'
 * keys, or null when neither map answers for it.
 *
 * The surface's own `material` first, its piece's `kind` second (#519). There
 * is deliberately no default: a surface nothing answers for is a check that
 * fails in Node (test/layout.mjs check 12), not a silent fallback to stone
 * (#13). `plan.surfaces` carries both fields since makePlan's material pass.
 */
export function stepClassOf(sounds, surface) {
  if (!surface) return null;
  const steps = sounds?.steps;
  if (!steps) return null;
  const byMaterial = steps.byMaterial || {}, byKind = steps.byKind || {};
  if (surface.material && byMaterial[surface.material]) return byMaterial[surface.material];
  if (surface.kind && byKind[surface.kind]) return byKind[surface.kind];
  return null;
}

/** Every surface id in the plan against its step class, for a per-frame lookup. */
export function stepClasses(plan, sounds) {
  return new Map(plan.surfaces.map((s) => [s.id, stepClassOf(sounds, s)]));
}

/** A silent stand-in with the same shape, for a caller that has no listener. */
export const SILENCE = {
  resume() {}, footstep() {}, bell() {}, bellAt() {},
  stride() { return Infinity; },
  classesFor() { return new Map(); },
};

/**
 * The game's audio, over three's `AudioListener` and `data/sounds.json`.
 *
 * @param listener  a THREE.AudioListener, for its `context` and `gain` only
 * @param sounds    parsed data/sounds.json
 */
export function createAudio(listener, sounds) {
  const ctx = listener?.context;
  if (!ctx) return SILENCE;
  const out = listener.getInput(); // the listener's own master gain

  // One second of white noise, made once and read from a random offset per
  // step, which is both cheaper than generating a burst per footfall and the
  // reason two steps on the same stone are not the same waveform.
  const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const vary = (v, spread) => v * (1 + (Math.random() * 2 - 1) * spread);

  /**
   * An exponential decay to silence from `peak` at `t0`, over `decay` seconds.
   * `exponentialRampToValueAtTime` cannot reach 0, so this ramps to a
   * thousandth of the peak and then cuts, which is inaudible and, unlike a
   * linear ramp, sounds like something being struck rather than faded.
   */
  const strike = (param, t0, peak, decay) => {
    param.cancelScheduledValues(t0);
    param.setValueAtTime(0.0001, t0);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.004);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002) * 0.001, t0 + 0.004 + decay);
    param.setValueAtTime(0, t0 + 0.004 + decay + 0.001);
  };

  /* --- the bell's own place in the world ---
   * A PannerNode, positioned once at the bell piece's centre by main.js. The
   * listener's position and orientation are three's to keep current, which it
   * does on every frame the renderer draws, so this is the whole of "loud in
   * the chapel, faint from the far ward".
   */
  const panner = ctx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = sounds.bell.refDistance;
  panner.maxDistance = sounds.bell.maxDistance;
  panner.rolloffFactor = sounds.bell.rolloff;
  panner.connect(out);

  const bellAt = (p) => {
    if (!p) return;
    // Chrome has the AudioParam form; the setter is the fallback and is
    // deprecated rather than gone.
    if (panner.positionX) {
      panner.positionX.value = p.x; panner.positionY.value = p.y; panner.positionZ.value = p.z;
    } else {
      panner.setPosition(p.x, p.y, p.z);
    }
  };

  const noiseBurst = (dest, { hz, q, type, decay, gain }, t0) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(filter); filter.connect(g); g.connect(dest);
    strike(g.gain, t0, gain, decay);
    src.start(t0, Math.random() * (noise.duration - decay - 0.02));
    src.stop(t0 + decay + 0.05);
  };

  const tone = (dest, { hz, gain, decay }, t0) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g); g.connect(dest);
    strike(g.gain, t0, gain, decay);
    osc.start(t0);
    osc.stop(t0 + decay + 0.1);
  };

  return {
    /** The start button's gesture, which is what a browser wants before audio. */
    resume() { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); },

    /** How far the feet travel between footfalls, walking or sprinting. */
    stride(sprint) { return sprint ? sounds.steps.sprintMetres : sounds.steps.walkMetres; },

    /** Every surface id in `plan` against its step class, built once. */
    classesFor(plan) { return stepClasses(plan, sounds); },

    bellAt,

    /**
     * One footfall of the given class. An unknown class is silent rather than
     * an error: what refuses an unknown class is test/layout.mjs check 12, in
     * Node, over every surface in the plan, before a foot ever lands on one.
     */
    footstep(cls) {
      const c = sounds.steps.classes[cls];
      if (!c) return;
      const t0 = ctx.currentTime + 0.001;
      noiseBurst(out, {
        hz: vary(c.hz, 0.12), q: c.q, type: c.type, decay: c.decay, gain: vary(c.gain, 0.15),
      }, t0);
      if (c.thumpGain > 0) tone(out, { hz: vary(c.thumpHz, 0.08), gain: c.thumpGain * c.gain, decay: c.thumpDecay }, t0);
    },

    /**
     * The chapel bell: a strike transient and six inharmonic partials, through
     * the panner, so it is loud in the chapel and thin from the outer ward.
     * The tierce is what keeps it a bell rather than a chime; the numbers and
     * the reasoning are in data/sounds.json.
     */
    bell() {
      const b = sounds.bell;
      const t0 = ctx.currentTime + 0.001;
      noiseBurst(panner, {
        hz: b.strikeHz, q: 0.7, type: 'bandpass', decay: b.strikeDecay, gain: b.strikeGain * b.gain,
      }, t0);
      for (const p of b.partials) {
        tone(panner, { hz: vary(p.hz, 0.004), gain: p.gain * b.gain, decay: p.decay }, t0);
      }
    },
  };
}
