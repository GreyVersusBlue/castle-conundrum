// audio.js — the sounds the castle makes, synthesised, out of data/sounds.json:
// the footstep, the chapel bell, and a room tone per place.
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

/**
 * What a place sounds like with nobody in it: one of `sounds.ambient.beds`'
 * keys, or null when neither map answers for the zone.
 *
 * A ZONE IS WHAT `roomAt` IN src/stations.js HANDS BACK: a plan room, which has
 * an `id`, a `level` and for a tower room a `drum`, or one of the four
 * stretches of open ground, which has an `id` and nothing else. The zone's own
 * id first, and a drum room's storey second, which is `stepClassOf`'s two steps
 * again. No default here either: a zone nothing answers for fails in Node
 * (test/layout.mjs check 13), and at runtime it is silence, which is what the
 * castle sounded like everywhere before this.
 */
export function bedOf(sounds, zone) {
  if (!zone) return null;
  const ambient = sounds?.ambient;
  if (!ambient) return null;
  const byRoom = ambient.byRoom || {}, byDrumLevel = ambient.byDrumLevel || {};
  if (byRoom[zone.id]) return byRoom[zone.id];
  if (zone.drum && byDrumLevel[zone.level]) return byDrumLevel[zone.level];
  return null;
}

/** A silent stand-in with the same shape, for a caller that has no listener. */
export const SILENCE = {
  resume() {}, footstep() {}, bell() {}, bellAt() {}, enter() {},
  ambience() { return { bed: null, sounding: [], fading: [] }; },
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

  /* --- the beds ---
   * A room tone per place, one at a time, cross-faded on the room change the
   * HUD's room line already computes (#515). A BED IS BUILT WHEN IT IS ENTERED
   * AND TORN DOWN WHEN IT HAS FADED: eight beds left running at gain 0 is
   * twenty filters and as many oscillators computing silence on a phone, and a
   * bed is a dozen nodes, which is nothing to make. Walking back into a bed
   * that is still fading out builds a second one over it rather than reviving
   * the first; for `fadeSeconds` there are two fires, and nobody can tell.
   *
   * Not through the panner. A bed is in the head and not at a point in the
   * room, and data/sounds.json says so and says what comes after.
   */
  const amb = sounds.ambient;
  let bedNoise = null;
  const bedBuffer = () => {
    if (bedNoise) return bedNoise;
    bedNoise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * amb.loopSeconds), ctx.sampleRate);
    const d = bedNoise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return bedNoise;
  };

  /**
   * `gain` moving between (1 - depth) and 1 of `peak` on a sine at `hz`: the
   * node rests at the middle of that range and an oscillator scaled to half of
   * it is summed onto the same AudioParam. Returns the oscillator to stop.
   */
  const swell = (gain, peak, hz, depth, t0) => {
    gain.value = peak * (1 - depth / 2);
    if (!(hz > 0) || !(depth > 0)) return null;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = hz;
    const span = ctx.createGain();
    span.gain.value = peak * depth / 2;
    lfo.connect(span); span.connect(gain);
    lfo.start(t0);
    return lfo;
  };

  const buildBed = (name) => {
    const def = amb.beds[name];
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(out);
    const running = [];
    const t0 = ctx.currentTime;
    for (const l of def.layers || []) {
      const src = ctx.createBufferSource();
      src.buffer = bedBuffer();
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = l.type;
      filter.frequency.value = l.hz;
      filter.Q.value = l.q;
      const g = ctx.createGain();
      src.connect(filter); filter.connect(g); g.connect(master);
      const lfo = swell(g.gain, l.gain, l.swellHz, l.swellDepth, t0);
      src.start(t0, Math.random() * amb.loopSeconds);
      running.push(src);
      if (lfo) running.push(lfo);
    }
    for (const tn of def.tones || []) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = tn.hz;
      const g = ctx.createGain();
      osc.connect(g); g.connect(master);
      const lfo = swell(g.gain, tn.gain, tn.swellHz, tn.swellDepth, t0);
      osc.start(t0);
      running.push(osc);
      if (lfo) running.push(lfo);
    }
    const bed = { name, master, running, live: true };
    // The crackle: clicks at random intervals averaging `perSecond`, which is
    // an exponential wait. A suspended context's clock does not move, so every
    // click made before the start button would land on the same instant the
    // moment it is pressed; those are skipped, not queued.
    if (def.pops) {
      const pop = () => {
        if (!bed.live) return;
        if (ctx.state === 'running') {
          const p = def.pops;
          noiseBurst(master, { hz: vary(p.hz, 0.35), q: p.q, type: p.type, decay: p.decay, gain: vary(p.gain, 0.5) }, ctx.currentTime + 0.001);
        }
        bed.timer = setTimeout(pop, -Math.log(1 - Math.random()) / def.pops.perSecond * 1000);
      };
      pop();
    }
    return bed;
  };

  const ramp = (param, to, seconds) => {
    const t = ctx.currentTime;
    const from = param.value;
    param.cancelScheduledValues(t);
    param.setValueAtTime(from, t);
    param.linearRampToValueAtTime(to, t + seconds);
  };

  let bedNow = null;          // the bed faded up, or fading up
  const sounding = new Set(); // that one, and any still fading out

  const release = (bed) => {
    bed.live = false;
    clearTimeout(bed.timer);
    ramp(bed.master.gain, 0, amb.fadeSeconds);
    // A timer and not `onended`: a suspended context never ends anything, and
    // a page that was never started would keep every bed it was ever walked
    // through. `until` is when that timer fires, for `ambience()`.
    const ms = amb.fadeSeconds * 1000 + 50;
    bed.until = performance.now() + ms;
    setTimeout(() => {
      for (const n of bed.running) { try { n.stop(); } catch { /* never started */ } }
      bed.master.disconnect();
      sounding.delete(bed);
    }, ms);
  };

  const enter = (zone) => {
    const name = bedOf(sounds, zone);
    if (name === (bedNow?.name ?? null)) return;
    if (bedNow) release(bedNow);
    bedNow = null;
    if (!name || !amb.beds[name]) return;
    bedNow = buildBed(name);
    sounding.add(bedNow);
    ramp(bedNow.master.gain, amb.beds[name].gain, amb.fadeSeconds);
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
     * The player is somewhere else now: `zone` is what `roomAt` handed the HUD.
     * The same bed is a no-op, so eight tower rooms climbed in a row are one
     * bed and not eight fades; a different one is the old fading down and the
     * new fading up over `ambient.fadeSeconds`.
     */
    enter,

    /**
     * Which bed is up, every bed making a noise, and for the ones on their way
     * out how many ms they have left, for test/map.mjs.
     */
    ambience() {
      const now = performance.now();
      return {
        bed: bedNow?.name ?? null,
        sounding: [...sounding].map((b) => b.name),
        fading: [...sounding].filter((b) => !b.live).map((b) => ({ name: b.name, msLeft: b.until - now })),
      };
    },

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
