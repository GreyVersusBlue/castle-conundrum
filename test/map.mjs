// map.mjs — the journal's map, in the browser: rooms fill in as they are
// stood in, and a reload does not lose them.
//
//   node test/map.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. BACKLOG.md rank 10's map (#588, #589) is three files
// meeting: main.js's room line decides the player is in a room, the engine
// puts it on `visited`, and ui.js draws it. test/quest.mjs proves the manager
// and test/save.mjs the rails; neither loads a page, and the only thing that
// can say a step through a real doorway reaches the DOM is a real page. #39
// draws the line this file asserts on: the DOM for what just happened, the
// save for what a reload has to survive.
//
// WHY IT IS ALLOWED IN CI when `play-castle.mjs` is not (#53): nothing here
// walks and nothing is timed. The camera is PLACED in a room, the render loop
// runs two frames, and what is read back is a data attribute. A software
// rasteriser answers "which room is this point in" the same way a GPU does,
// because the answer is `castle-plan.js` arithmetic and not a pixel.
//
// WHAT IT MAY NOT ASSERT (#529): anything provable in Node. That every room
// has a name, that the list is the plan's, that the shapes are boxes and
// discs — those are `layout.mjs`'s. This file asserts the seams only.

import { serveDev, launch, prepPage, threeUrl } from './harness.mjs';
import { attachSceneProbe, waitForProbe } from './drive.mjs';

const PORT = 8128; // not 8124 (play), 8125 (plan-vs-scene), 8126 (built) or 8127 (touch)
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));

console.log('the map: rooms fill in as they are stood in, and survive a reload\n');

const server = await serveDev(PORT);
const THREE_URL = await threeUrl(BASE);
const browser = await launch();
const page = await prepPage(browser);

/** Two animation frames, so the render loop's own room line has run. */
const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/**
 * Put the eye in a plan room, on that room's own floor: at its centre, or
 * failing that at one of eight points 2 m round it, because a hall's centre
 * can be a hearth and a room is entered only where there is floor to stand
 * on. Settled on the HUD's room line, which is the thing under test, so the
 * probe stops at the first point the page itself calls the room. Returns the
 * point used, or null.
 */
const standIn = async (id) => {
  const name = await page.evaluate((roomId) => window.__quest.rooms.find((r) => r.id === roomId)?.name ?? null, id);
  if (!name) return null;
  const spots = await page.evaluate((roomId) => {
    const r = window.__castle.plan.rooms.find((x) => x.id === roomId);
    if (!r) return [];
    const cx = r.shape?.kind === 'disc' ? r.shape.cx : (r.bounds.min.x + r.bounds.max.x) / 2;
    const cz = r.shape?.kind === 'disc' ? r.shape.cz : (r.bounds.min.z + r.bounds.max.z) / 2;
    const out = [[cx, cz]];
    for (let k = 0; k < 8; k++) out.push([cx + 2 * Math.cos(k * Math.PI / 4), cz + 2 * Math.sin(k * Math.PI / 4)]);
    return out.map(([x, z]) => ({ x, y: r.top + 1.7, z }));
  }, id);
  for (const at of spots) {
    await page.evaluate((p) => { window.__cam.position.set(p.x, p.y, p.z); }, at);
    await frames();
    const line = await page.evaluate(() => document.getElementById('hud-room').textContent.trim());
    if (line === name) return at;
  }
  return null;
};

/** The room line, the engine's set, and the save's. */
const where = () => page.evaluate(() => ({
  line: document.getElementById('hud-room')?.textContent.trim() ?? '',
  visited: [...(window.__mystery.state.visited ?? [])],
  saved: [...(window.__save.state.visited ?? [])],
}));

/** Open the journal cold on J, click the map tab, and read the map back. */
const readMap = async () => {
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' })));
  await page.click('#journal-tab-map');
  const out = await page.evaluate(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    return {
      open: !document.getElementById('journal-overlay').classList.contains('hidden'),
      tabShown: !document.getElementById('journal-tab-map').classList.contains('hidden'),
      title: document.getElementById('journal-title').textContent.trim(),
      count: document.getElementById('journal-map-count')?.textContent.trim() ?? '',
      storeys: q('.map-storey').map((s) => s.dataset.level),
      // The castle's rooms, and the ones outside the walls apart (#726).
      shapes: q('.map-plan .map-room:not([data-outside])').length,
      names: q('.map-names .map-room:not([data-outside])').length,
      frames: q('.map-storey:not(.map-outside) .map-plan').map((e) => Number(e.getAttribute('viewBox').trim().split(/\s+/)[2])), // the attribute, not baseVal's float32
      inStoreys: q('.map-storey:not(.map-outside) .map-room').map((e) => e.dataset.id),
      outsideShapes: q('.map-outside .map-plan .map-room').map((e) => ({ id: e.dataset.id, outside: e.dataset.outside, visited: e.dataset.visited })),
      outsideNames: q('.map-outside .map-names .map-room').map((e) => ({ id: e.dataset.id, text: e.textContent.trim(), visited: e.dataset.visited })),
      visited: q('.map-plan .map-room[data-visited="1"]').map((e) => e.dataset.id),
      visitedNames: q('.map-names .map-room[data-visited="1"]').map((e) => e.textContent.trim()),
      hiddenNames: q('.map-names .map-room[data-visited="0"]:not([data-outside])').map((e) => e.textContent.trim()),
      here: q('.map-plan .map-room.here').map((e) => e.dataset.id),
      tagOf: Object.fromEntries(q('.map-plan .map-room').map((e) => [e.dataset.id, e.tagName.toLowerCase()])),
    };
  });
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' })));
  return out;
};

try {
  await page.goto(`${BASE}/test/blank.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('castleConundrumSave_v1'));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 120000 });
  pass('the castle finished building');
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);
  // The count and the storeys are the castle's rooms; the ones outside the
  // walls are drawn apart and never counted (#726). All of it is read off the
  // page's own plan, so none of it is a number typed here.
  const plan = await page.evaluate(() => {
    const rooms = window.__castle.plan.rooms;
    const castle = rooms.filter((r) => r.ward !== 'outside');
    return {
      total: castle.length,
      width: Math.max(...castle.map((r) => r.bounds.max.x)) - Math.min(...castle.map((r) => r.bounds.min.x)) + 2,
      outside: rooms.filter((r) => r.ward === 'outside').map((r) => ({ id: r.id, name: window.__quest.rooms.find((x) => x.id === r.id)?.name ?? null })),
    };
  });
  const total = plan.total;

  /* ------------------------------------------------ 1: a fresh map is empty --- */
  const fresh = await readMap();
  check(fresh.open && fresh.tabShown && /castle/i.test(fresh.title), 'J then the third tab opens the map', `open ${fresh.open}, tab ${fresh.tabShown}, title "${fresh.title}"`);
  check(fresh.shapes === total && fresh.names === total, `every one of the plan's ${total} rooms is drawn, and named once under it`, `${fresh.shapes} shapes, ${fresh.names} names`);
  check(fresh.storeys.join(',') === '0,1,2,3,outside', 'four storeys, ground first, then outside the walls', fresh.storeys.join(','));
  check(fresh.frames.length === 4 && fresh.frames.every((wd) => Math.abs(wd - plan.width) < 1e-6),
    `every storey is framed on the castle's own ${plan.width.toFixed(1)} m, not on the town's`, fresh.frames.join(', '));
  const strays = fresh.inStoreys.filter((id) => plan.outside.some((o) => o.id === id));
  check(!strays.length, 'no room outside the walls is drawn on a storey', strays.join(', '));
  const outIds = plan.outside.map((o) => o.id).sort().join(',');
  check(plan.outside.length > 0 && fresh.outsideShapes.map((o) => o.id).sort().join(',') === outIds && fresh.outsideNames.map((o) => o.id).sort().join(',') === outIds,
    `the drawing outside the walls holds exactly the plan's ${plan.outside.length} outside rooms`, `${fresh.outsideShapes.map((o) => o.id).join(',')} / ${outIds}`);
  const misnamed = plan.outside.filter((o) => !o.name || fresh.outsideNames.find((n) => n.id === o.id)?.text !== o.name);
  check(!misnamed.length, 'each named with its real name from the first, since nobody can stand in one to earn it', misnamed.map((o) => `${o.id}: "${fresh.outsideNames.find((n) => n.id === o.id)?.text}"`).join(', '));
  check([...fresh.outsideShapes, ...fresh.outsideNames].every((o) => o.visited === '0') && fresh.outsideShapes.every((o) => o.outside === '1'),
    'and none of them is filled in', JSON.stringify(fresh.outsideShapes));
  // The spawn is the outer ward, which is ground and not a room, so a fresh
  // page has stood in nothing. If the spawn ever moves indoors this reads 1.
  check(fresh.visited.length === 0 && fresh.count === `0 of ${total} rooms stood in`, `nothing is filled in on a fresh page: the spawn is open ground, and the count is out of the castle's ${total}`, `${fresh.visited.join(',')} / "${fresh.count}"`);
  check(fresh.hiddenNames.every((t) => !/[A-Za-z]/.test(t)), 'and no unvisited room gives its name away', fresh.hiddenNames.find((t) => /[A-Za-z]/.test(t)) ?? '');

  /* ------------------------------------ 2: standing in a room fills it in --- */
  // A box on the ground, a disc on the ground, and a disc two storeys up: the
  // three shapes the plan has and the two axes `inRoom` reads (bounds and feet).
  const tour = ['great-hall', 'chapel', 'kings-tower-2'];
  const stood = {}; // where each was stood in, for section 2b to go back to
  for (const id of tour) {
    const at = await standIn(id);
    stood[id] = at;
    check(!!at, `placed in ${id}, and the HUD's room line says so`, at ? '' : 'no point in or round its centre the HUD calls that room');
    const w = await where();
    check(w.visited.includes(id), `standing in ${id} puts it on the engine's visited set`, w.visited.join(', '));
  }
  const w = await where();
  check(w.visited.length === tour.length, `three rooms stood in, three on the set`, w.visited.join(', '));
  const walked = await readMap();
  check(walked.visited.length === tour.length && tour.every((id) => walked.visited.includes(id)), 'the map fills in exactly those three', walked.visited.join(', '));
  check(walked.count === `${tour.length} of ${total} rooms stood in`, 'and says so in words', walked.count);
  check(walked.tagOf['great-hall'] === 'rect' && walked.tagOf['chapel'] === 'circle' && walked.tagOf['kings-tower-2'] === 'circle', 'a box is a rect and a tower room a circle', `${walked.tagOf['great-hall']}, ${walked.tagOf['chapel']}, ${walked.tagOf['kings-tower-2']}`);
  check(walked.here.length === 1 && walked.here[0] === 'kings-tower-2', 'the room the HUD names is the one ringed', walked.here.join(', '));
  check(walked.visitedNames.length === tour.length && walked.visitedNames.every((t) => /[A-Z]/.test(t)), 'the three give their names now', walked.visitedNames.join(' | '));
  // Stepping out onto open ground rings nothing and adds nothing.
  await page.evaluate(() => { window.__cam.position.set(-10, 1.7, 0); });
  await frames();
  const out = await readMap();
  check(out.here.length === 0 && out.visited.length === tour.length, 'out in the ward: no ring, and the ward is not a room on the map', `${out.here.join(',')} / ${out.visited.length}`);

  /* ------------------------------- 2b: the same change cross-fades the bed --- */
  // The Sound row's seams. test/layout.mjs check 13 proves in Node that every
  // zone has a bed and every source a point inside its own room; what it
  // cannot see is that main.js hands the room change and the head's position
  // to the audio at all, which is two lines in the render loop and one after
  // the build (#680). No speaker is asked anything (#53): `ambience()` says
  // which beds exist and where each is heard from, not what they sound like.
  //
  // THE READ IS IN THE FRAME THE BED CHANGES, NOT AFTER IT. The first version
  // stood in the hall with `standIn`, then read, and passed on a GPU and
  // failed in CI: a software rasteriser took longer than the 1.2 s fade to get
  // from the change to the read, so the ward was already torn down. `hop`
  // polls from its own requestAnimationFrame, which runs in the same frame as
  // the render loop's and before any timer can, so what it returns is the
  // state the change left, however slow the frame was (#53). That cuts both
  // ways and the second version missed it: a teardown on a 0 ms timer has not
  // run by then either, so "still sounding" alone passed a cut. `fading`
  // carries how long each outgoing bed has left, and that is what is held. The waits are
  // the fade's own length on a timer. Only rooms already on the tour are
  // stood in, and at the points the tour found, so section 3's counts do not
  // move.
  {
    const { fade, spatial } = await page.evaluate(async () => { const a = (await (await fetch('data/sounds.json')).json()).ambient; return { fade: a.fadeSeconds, spatial: a.spatial }; });
    const hop = (p) => page.evaluate((at) => new Promise((resolve) => {
      const before = window.__audio.ambience().bed;
      window.__cam.position.set(at.x, at.y, at.z);
      let n = 0;
      const look = () => {
        const now = window.__audio.ambience();
        if (now.bed !== before || ++n > 120) resolve(now); else requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    }), p);
    const settle = () => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), fade * 1000 + 300);
    await settle();
    const ward = await page.evaluate(() => window.__audio.ambience());
    check(ward.bed === 'ward' && ward.head === 'ward' && ward.fading.length === 0, 'out in the ward, the ward\'s bed is in the head and nothing is fading', JSON.stringify(ward));
    // The kitchen heard from the ward outside its door (#680): rooms within
    // earshot sound from their near wall, at a distance, and not from the head.
    check(ward.placed.length >= 1 && ward.placed.length <= spatial.atOnce && ward.placed.every((p) => p.metres > 0 && p.metres <= spatial.hearMetres),
      `and ${ward.placed.length} rooms are heard from outside, each from its near wall within ${spatial.hearMetres} m`, JSON.stringify(ward.placed));
    check(ward.sounding.length === 1 + ward.placed.length, 'and those are all that is sounding', ward.sounding.join(', '));
    const hall = await hop(stood['great-hall']);
    check(hall.bed === 'hall' && hall.head === null, 'into the Great Hall and the bed is the hall\'s, with nothing in the head', JSON.stringify(hall));
    check(hall.sounding.includes('ward') && hall.sounding.includes('hall'), 'and the ward is still sounding under it', hall.sounding.join(', '));
    // Still there in the frame of the change is true of a cut as well: the
    // teardown is a timer and no timer has run yet. What makes it a fade is
    // that the ward has most of `fadeSeconds` left to live.
    const left = hall.fading.find((f) => f.name === 'ward')?.msLeft ?? 0;
    check(left > fade * 500, `and it is a cross-fade, not a cut: the ward has ${Math.round(left)} ms left of a ${fade * 1000} ms fade`, JSON.stringify(hall.fading));
    // Inside a room its source is at the player's own head, not across the room.
    const own = hall.placed.find((p) => p.bed === 'hall');
    check(!!own && own.metres < 0.5, 'and the hall\'s own bed is at the player\'s head, in the same frame', JSON.stringify(hall.placed));
    await settle();
    const faded = await page.evaluate(() => window.__audio.ambience());
    check(!faded.sounding.includes('ward') && faded.sounding.includes('hall') && faded.fading.length === 0, 'a fade later the ward is torn down and the hall stays', faded.sounding.join(', '));
    // A drum's storeys are one source (#681), so a stair climbed inside the
    // King's Tower fades nothing. That the two rooms share a source is
    // test/layout.mjs's to say (#529); what only the page can say is that the
    // source the loop placed for the top room is the drum's and not the
    // room's. Standing in the first floor as well would be a fourth room on
    // the visited set, and section 3 counts three.
    await hop(stood['kings-tower-2']);
    await settle();
    const up = await page.evaluate(() => window.__audio.ambience());
    const tower = up.placed.filter((p) => p.bed === 'tower');
    check(up.bed === 'tower' && tower.length === 1 && tower[0].key === 'kings-tower:tower' && tower[0].metres < 0.5, 'in the King\'s Tower top room: one tower source, the drum\'s, at the head', JSON.stringify(up.placed));
    await page.evaluate(() => { window.__cam.position.set(-10, 1.7, 0); });
    await frames();
  }

  /* ----------------------------------------------- 3: a reload keeps them --- */
  // Where the camera comes back is the autosave's business and not the map's:
  // a placed camera is not a walking one and marks nothing dirty, so nothing
  // here reads the position after the reload. What the reload has to carry is
  // the set.
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 120000 });
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);
  await frames();
  const back = await where();
  check(tour.every((id) => back.saved.includes(id)), 'the save came back with all three rooms (#39: the save for what a reload has to survive)', back.saved.join(', '));
  const again = await readMap();
  check(again.visited.length === tour.length && tour.every((id) => again.visited.includes(id)), 'and the map is filled in the same three after the reload', again.visited.join(', '));
  // Back into a room already on the set: ringed, and not counted twice.
  check(!!(await standIn('kings-tower-2')), 'placed in the King\'s Tower top room again, after the reload');
  const twice = await readMap();
  check(twice.here.length === 1 && twice.here[0] === 'kings-tower-2' && twice.visited.length === tour.length, 'ringed there, and a room re-entered after a reload is not a fourth room', `${twice.here.join(',')} / ${twice.count}`);

  /* -------------------------------- 4: the rail, seen from the page's side --- */
  // A save carrying a room the plan does not build comes through `repair` on
  // load and loses it. test/save.mjs holds this in Node; this is the one
  // sighting of it from a page, so the map can never draw a count the plan's
  // rooms cannot reach.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('castleConundrumSave_v1'));
    raw.visited = [...(raw.visited ?? []), 'the-oubliette', 'outer-ward'];
    localStorage.setItem('castleConundrumSave_v1', JSON.stringify(raw));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 120000 });
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);
  const cleaned = await where();
  check(!cleaned.saved.includes('the-oubliette') && !cleaned.saved.includes('outer-ward') && tour.every((id) => cleaned.saved.includes(id)),
    'a room the plan does not build, and a ward, are dropped from the set on load; the three real rooms stay', cleaned.saved.join(', '));
} catch (err) {
  fail(`threw: ${err?.stack ?? err}`);
} finally {
  await browser.close();
  server.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
