// audio.js — the sounds the castle makes, synthesised, out of data/sounds.json:
// the footstep, the chapel bell, and a room tone per place, at the place.
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

/**
 * Where the beds sound from: every plan room that has a bed, as a source with
 * a footprint (the room's bounds, and its disc for a tower room) and the
 * floors it stands on. Open ground has no source: the ward is in the head.
 *
 * A DRUM'S STOREYS WITH THE SAME BED ARE ONE SOURCE (#681). The King's Tower
 * is one stone drum, and its first floor and top room are the same whistle at
 * two heights; two sources there would be the lower one still sounding under
 * the upper one's fade every time a stair is climbed, which is the storey
 * fade #623 refused. The muniment room under them is a chamber and is its
 * own source: the key is the drum and the bed, not the drum alone. A room
 * that is not in a drum is its own source under its own id and level.
 *
 * Pure over the plan and the data file, so test/layout.mjs holds every
 * source's point to its footprint in Node.
 */
export function bedSources(plan, sounds) {
  const out = new Map();
  for (const r of plan.rooms) {
    const bed = bedOf(sounds, r);
    if (!bed) continue;
    const key = r.drum ? `${r.drum}:${bed}` : `${r.id}/${r.level}`;
    let s = out.get(key);
    if (!s) {
      s = {
        key, bed, rooms: [], floors: [],
        bounds: { min: { x: r.bounds.min.x, z: r.bounds.min.z }, max: { x: r.bounds.max.x, z: r.bounds.max.z } },
        shape: r.shape?.kind === 'disc' ? { cx: r.shape.cx, cz: r.shape.cz, radius: r.shape.radius } : null,
      };
      out.set(key, s);
    }
    s.rooms.push(r.id);
    s.floors.push(r.top);
  }
  for (const s of out.values()) s.floors.sort((a, b) => a - b);
  return [...out.values()];
}

/**
 * The point a source is heard from, from `from`: the point of its footprint
 * nearest the listener, `ear` metres over the nearest of its floors. Inside
 * the room that is the listener's own head, which is what a room tone is
 * inside its room; from outside it is the near wall, which is where the
 * kitchen is heard from the ward. With no `from`, the centre over the lowest
 * floor. NOT THE CENTRE (#680): the south walk is 18 m long, and a source at
 * its middle is one heard from the far end of the walk and not from the
 * merlon beside you.
 */
export function sourcePoint(source, from, ear) {
  const { bounds, shape, floors } = source;
  const cx = shape ? shape.cx : (bounds.min.x + bounds.max.x) / 2;
  const cz = shape ? shape.cz : (bounds.min.z + bounds.max.z) / 2;
  if (!from) return { x: cx, y: floors[0] + ear, z: cz };
  let x, z;
  if (shape) {
    const dx = from.x - cx, dz = from.z - cz, d = Math.hypot(dx, dz);
    if (d <= shape.radius) { x = from.x; z = from.z; } else { x = cx + dx / d * shape.radius; z = cz + dz / d * shape.radius; }
  } else {
    x = Math.min(Math.max(from.x, bounds.min.x), bounds.max.x);
    z = Math.min(Math.max(from.z, bounds.min.z), bounds.max.z);
  }
  const y = Math.min(Math.max(from.y, floors[0] + ear), floors[floors.length - 1] + ear);
  return { x, y, z };
}

/**
 * Which sources sound from `at`: the ones within `spatial.hearMetres` of the
 * point they would be heard from, nearest first, and no more than
 * `spatial.atOnce` of them. The nearest few and not one (#680): standing in
 * the ward between the kitchen and the hall is hearing both.
 */
export function audibleFrom(sources, at, spatial) {
  const near = [];
  for (const source of sources) {
    const p = sourcePoint(source, at, spatial.earMetres);
    const metres = Math.hypot(p.x - at.x, p.y - at.y, p.z - at.z);
    if (metres <= spatial.hearMetres) near.push({ source, at: p, metres });
  }
  near.sort((a, b) => a.metres - b.metres);
  return near.slice(0, spatial.atOnce);
}

/**
 * How ring `n` of the bell goes: `sounds.bell.rings[n]`, or one stroke when
 * the file has nothing for it. The engine's `bell:<n>` is `n`; test/layout.mjs
 * check 13 holds the file to every `n` the engine can emit, so the fallback is
 * for a caller outside the day and not for a ring the data forgot.
 */
export function ringOf(sounds, n) {
  const r = sounds?.bell?.rings?.[String(n)];
  return r ? { strokes: r.strokes, gapSeconds: r.gapSeconds, gain: r.gain } : { strokes: 1, gapSeconds: 0, gain: 1 };
}

/** A silent stand-in with the same shape, for a caller that has no listener. */
export const SILENCE = {
  resume() {}, footstep() {}, bell() {}, bellAt() {}, enter() {}, placeBeds() {}, at() {},
  ambience() { return { bed: null, head: null, sounding: [], fading: [], placed: [] }; },
  lastRing() { return null; },
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
  const pannerFor = ({ panning, refDistance, maxDistance, rolloff }) => {
    const pn = ctx.createPanner();
    pn.panningModel = panning;
    pn.distanceModel = 'inverse';
    pn.refDistance = refDistance;
    pn.maxDistance = maxDistance;
    pn.rolloffFactor = rolloff;
    pn.connect(out);
    return pn;
  };
  const moveTo = (pn, p) => {
    if (!p) return;
    // Chrome has the AudioParam form; the setter is the fallback and is
    // deprecated rather than gone.
    if (pn.positionX) {
      pn.positionX.value = p.x; pn.positionY.value = p.y; pn.positionZ.value = p.z;
    } else {
      pn.setPosition(p.x, p.y, p.z);
    }
  };
  const panner = pannerFor({ panning: 'HRTF', ...sounds.bell });
  const bellAt = (p) => moveTo(panner, p);

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
   * A room tone per place, at the place. Every plan room with a bed is a
   * source (`bedSources`), heard through a panner of its own at the point of
   * its footprint nearest the player (`sourcePoint`), and the nearest few
   * within earshot sound at once (`audibleFrom`, #680): the kitchen is heard
   * from the ward outside its door and fills the head across the threshold,
   * with no fade at the door at all. Open ground is the one bed still in the
   * head, faded up and down on the room change the HUD's room line already
   * computes (#515), because the ward has no near wall to be heard from.
   *
   * A BED IS BUILT WHEN IT COMES INTO EARSHOT AND TORN DOWN WHEN IT HAS FADED
   * (#622): eight beds left running at gain 0 is twenty filters and as many
   * oscillators computing silence on a phone, and a bed is a dozen nodes,
   * which is nothing to make. Which beds are within earshot is asked again
   * every `spatial.restepMetres` of ground and on every room change, not
   * every frame; the points move every frame, which is three numbers each.
   * Walking back into a bed that is still fading out builds a second one over
   * it rather than reviving the first; for `fadeSeconds` there are two fires,
   * and nobody can tell.
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

  const buildBed = (name, dest) => {
    const def = amb.beds[name];
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(dest);
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

  const spatial = amb.spatial;
  let sources = [];           // `bedSources` of the plan, once main.js hands it over
  let head = null;            // the open-ground bed, in the head, or null indoors
  const placed = new Map();   // source key -> the bed sounding at that source
  const sounding = new Set(); // every bed making a noise, the fading ones included
  let zoneBed = null;         // the bed of the place the player is in, for ambience()
  let lastAt = null;          // where earshot was last asked; null asks again
  let lastRing = null;

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
      bed.panner?.disconnect();
      sounding.delete(bed);
    }, ms);
  };

  const fadeUp = (bed) => {
    sounding.add(bed);
    ramp(bed.master.gain, amb.beds[bed.name].gain, amb.fadeSeconds);
    return bed;
  };

  /**
   * The player is somewhere else: the head bed follows open ground and the
   * placed beds are asked again on the next `at`. A room's own bed is not
   * built here; it is the nearest source of all, at no distance, and `at`
   * finds it the same way it finds the kitchen through the ward wall.
   */
  const enter = (zone) => {
    zoneBed = bedOf(sounds, zone);
    lastAt = null;
    const name = zone?.open ? zoneBed : null;
    if (name === (head?.name ?? null)) return;
    if (head) release(head);
    head = null;
    if (!name || !amb.beds[name]) return;
    head = fadeUp(buildBed(name, out));
  };

  /** The player's head is at `pos` this frame. */
  const at = (pos) => {
    if (!sources.length) return;
    const moved = lastAt ? Math.hypot(pos.x - lastAt.x, pos.y - lastAt.y, pos.z - lastAt.z) : Infinity;
    if (moved >= spatial.restepMetres) {
      lastAt = { x: pos.x, y: pos.y, z: pos.z };
      const near = audibleFrom(sources, lastAt, spatial);
      const keep = new Set(near.map((n) => n.source.key));
      for (const [key, bed] of placed) if (!keep.has(key)) { release(bed); placed.delete(key); }
      for (const n of near) {
        if (placed.has(n.source.key)) continue;
        const pn = pannerFor({ panning: spatial.panning, refDistance: spatial.refMetres, maxDistance: spatial.maxMetres, rolloff: spatial.rolloff });
        const bed = buildBed(n.source.bed, pn);
        bed.key = n.source.key; bed.source = n.source; bed.panner = pn;
        placed.set(bed.key, fadeUp(bed));
      }
    }
    for (const bed of placed.values()) {
      bed.at = sourcePoint(bed.source, pos, spatial.earMetres);
      bed.metres = Math.hypot(bed.at.x - pos.x, bed.at.y - pos.y, bed.at.z - pos.z);
      moveTo(bed.panner, bed.at);
    }
  };

  return {
    /** The start button's gesture, which is what a browser wants before audio. */
    resume() { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); },

    /** How far the feet travel between footfalls, walking or sprinting. */
    stride(sprint) { return sprint ? sounds.steps.sprintMetres : sounds.steps.walkMetres; },

    /** Every surface id in `plan` against its step class, built once. */
    classesFor(plan) { return stepClasses(plan, sounds); },

    bellAt,

    /** The plan's rooms become the sources the beds sound from, once. */
    placeBeds(plan) { sources = bedSources(plan, sounds); lastAt = null; },

    /**
     * The player is somewhere else now: `zone` is what `roomAt` handed the HUD.
     * Open ground is the head bed, the same one across the three wards; a room
     * is a source `at` will find, at no distance, on the next frame.
     */
    enter,

    /**
     * Where the player's head is, every frame: which sources are within
     * earshot, asked every `spatial.restepMetres`, and where each is heard
     * from, moved every frame.
     */
    at,

    /**
     * The bed of the place the player is in, the head bed if any, every bed
     * making a noise, for the ones on their way out how many ms they have
     * left, and for the placed ones the point each is heard from and how far
     * that is, for test/map.mjs.
     */
    ambience() {
      const now = performance.now();
      return {
        bed: zoneBed,
        head: head?.name ?? null,
        sounding: [...sounding].map((b) => b.name),
        fading: [...sounding].filter((b) => !b.live).map((b) => ({ name: b.name, msLeft: b.until - now })),
        placed: [...placed.values()].map((b) => ({ key: b.key, bed: b.name, at: b.at ?? null, metres: b.metres ?? null })),
      };
    },

    /** The last ring: which `n` and how many strokes it was given. */
    lastRing() { return lastRing; },

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
     * The chapel bell, rung for the `n`th time: a strike transient and six
     * inharmonic partials per stroke, through the panner, so it is loud in the
     * chapel and thin from the outer ward. How many strokes and how far apart
     * is `bell.rings[n]` (#682): one for Terce, the peal for Vespers, and the
     * fourth ring, which moves no watch, is the slow one. The tierce is what
     * keeps it a bell rather than a chime; the numbers and the reasoning are
     * in data/sounds.json.
     */
    bell(n = 1) {
      const b = sounds.bell;
      const ring = ringOf(sounds, n);
      let t0 = ctx.currentTime + 0.001;
      for (let k = 0; k < ring.strokes; k++) {
        const gain = b.gain * ring.gain;
        noiseBurst(panner, {
          hz: b.strikeHz, q: 0.7, type: 'bandpass', decay: b.strikeDecay, gain: b.strikeGain * gain,
        }, t0);
        for (const p of b.partials) {
          tone(panner, { hz: vary(p.hz, 0.004), gain: p.gain * gain, decay: p.decay }, t0);
        }
        // A man on a rope, not a clock: each gap is the file's, give or take.
        t0 += vary(ring.gapSeconds, b.gapSpread ?? 0);
      }
      lastRing = { n, strokes: ring.strokes };
    },
  };
}
