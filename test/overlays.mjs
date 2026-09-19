// overlays.mjs — every overlay gives the castle back.
//
//   node test/overlays.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. `npm run play` walked the castle on a real GPU on
// 2026-09-17 and found a player who could not move (#626, #627): `src/ui.js`
// released pointer lock for four overlays and `src/quest-manager.js` took it
// back for one, so opening the journal once cost the castle for good. The
// other half of the same bug ran the other way — a dialogue never released
// pointer lock, so the canvas swallowed every pointer event and the Present
// button could not be clicked by a real mouse. Neither half is visible to any
// suite that drives the game through `window.__quest`, because a synthetic
// `.click()` does not care who holds the pointer and a camera that is PLACED
// does not care whether W works.
//
// WHY IT IS ALLOWED IN CI when `play-castle.mjs` is not (#53). **Nothing here
// walks and nothing is timed.** #53 is about real-time movement and physics
// under a software rasteriser being inconclusive either way; pointer lock is
// neither. Measured on 2026-09-18: headless Chromium takes pointer lock on the
// start button, reports `document.pointerLockElement`, drops it on
// `exitPointerLock()` and takes it back on the next `requestPointerLock()`,
// exactly as a headed one does (#659). So this file asserts WHO HOLDS THE
// POINTER, which is the cause, and leaves "and therefore W moves the player
// 3.7 m" to `play-castle.mjs`, which is the effect and wants a GPU.
//
// WHAT IT MAY NOT ASSERT. Anything about what an overlay SAYS — the journal's
// rows are test/map.mjs's and test/quest.mjs's, the riddle's text is
// test/touch.mjs's. This file asserts one property, over every overlay there
// is: it releases the pointer while it is up and gives it back when it goes
// away. A fifth overlay that inherits only one half fails here.

import { serveDev, launch, prepPage, threeUrl } from './harness.mjs';
import { attachSceneProbe, waitForProbe, wait } from './drive.mjs';

const PORT = 8129; // not 8124 (play), 8125 (plan-vs-scene), 8126 (built), 8127 (touch) or 8128 (map)
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));

console.log('the overlays: who holds the pointer, and who gives it back\n');

const server = await serveDev(PORT);
const THREE_URL = await threeUrl(BASE);
const browser = await launch();
const page = await prepPage(browser);

/**
 * Who holds the pointer, after giving the browser up to `ms` to agree.
 *
 * `requestPointerLock` and `exitPointerLock` both resolve on a `pointerlock-
 * change` event a frame or two later, so reading `document.pointerLockElement`
 * on the next line answers the question before the browser has. This polls for
 * the state the beat is asking about and returns what it actually got, so a
 * wrong answer is a failure after 2 s rather than a flake at 0 ms.
 */
const holder = async (want, ms = 2000) => {
  const until = Date.now() + ms;
  let got;
  do {
    got = await page.evaluate(() => !!document.pointerLockElement);
    if (got === want) return got;
    await wait(60);
  } while (Date.now() < until);
  return got;
};

const hidden = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  return !el || el.classList.contains('hidden');
}, sel);

/** Two animation frames, so the render loop's own update() has run. */
const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/**
 * Wait out the browser's pointer-lock ration before the next overlay.
 *
 * Chrome grants four `requestPointerLock()` calls and then refuses for about
 * two seconds (#661, measured). Six overlays opened and shut back to back is
 * six requests, which is a thing this file does and a thing a player does not,
 * so every beat below the first pauses long enough that the ration is never
 * what is under test. Section 8 is where the ration IS under test, on purpose.
 */
const breathe = () => wait(2400);

/**
 * A click by a real mouse, at the element's own place on the screen, with
 * whatever is on top of it getting the event.
 *
 * NOT `el.click()`. The difference is the whole of the second bug: a synthetic
 * click is dispatched straight at the node and reaches a button no cursor
 * could, while a real one is a pointer event at a coordinate and goes to
 * whoever the browser says is there — which, while pointer lock is held, is
 * the locked element and nothing else. Playwright refuses the click outright
 * ("canvas intercepts pointer events"); Puppeteer sends it and the canvas eats
 * it. Both come back false here.
 */
const clickReal = async (sel, ms = 4000) => {
  try {
    if (page.__engine === 'playwright') await page.click(sel, { timeout: ms });
    else await page.click(sel);
    return true;
  } catch { return false; }
};

try {
  await page.goto(`${BASE}/test/blank.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('castleConundrumSave_v1'));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 120000 });
  pass('the castle finished building');
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);

  /* ------------------------------------------------- 0: the start button --- */
  await page.click('#start-button');
  check(await holder(true), 'Enter the Castle takes pointer lock');

  /* ------------------------------------------------------- 1: the journal ---
   * The beat the row is named for, pressed with a real key rather than called.
   * J, J again, and the pointer has to be back where it started. */
  await page.keyboard.press('KeyJ');
  await frames();
  check(!(await hidden('#journal-overlay')), 'J opens the journal');
  check(!(await holder(false)), 'and lets the pointer go, because the journal is a thing you point at');
  await page.keyboard.press('KeyJ');
  await frames();
  check(await hidden('#journal-overlay'), 'J again shuts it');
  check(await holder(true), 'AND GIVES THE CASTLE BACK',
    'pointer lock is gone, no resume panel is offered, and W does nothing — the player can only reload');

  /* -------------------------------------------------------- 2: the riddle ---
   * The one overlay that already had both halves, in the one place that can
   * still tell whether it kept them. The muniment room's word-lock, from the
   * King's Hall, where test/touch.mjs stands to press E at it. */
  await breathe();
  await page.evaluate(() => {
    window.__cam.position.set(21, 1.7, -12);
    window.__cam.rotation.set(0, -0.026, 0, 'YXZ');
  });
  await frames();
  await page.keyboard.press('KeyE');
  await frames();
  check(!(await hidden('#riddle-overlay')), 'E at the word-lock opens the riddle');
  check(!(await holder(false)), 'and the riddle lets the pointer go, so the box can be typed in');
  // Its own Step away button, clicked by a real mouse: with the pointer free
  // the canvas is not in the way and this is how a player closes it.
  check(await clickReal('#riddle-cancel'), 'Step away is reachable by a real mouse');
  await frames();
  check(await hidden('#riddle-overlay'), 'and it closes the riddle');
  check(await holder(true), 'and the riddle gives the castle back');

  /* ------------------------------------------------------ 3: a dialogue ---
   * A conversation is not modal — E steps it and the box sits over the bottom
   * of the screen — but it carries a BUTTON, and a button is a thing you point
   * at. The Constable, opened the way `InteractionSystem.tryInteract` opens
   * him rather than by standing in front of him: at every station in the
   * schedule he is within arm's reach of a piece of evidence, so the nearest
   * target from two metres away is the body and not the man (test/touch.mjs
   * found that one). */
  await breathe();
  const opened = await page.evaluate(() => {
    const npc = window.__cast.find((n) => n.id === 'constable');
    if (!npc) return null;
    window.__quest.handleInteract(npc);
    return {
      open: !document.getElementById('dialogue-box').classList.contains('hidden'),
      present: !document.getElementById('dialogue-present').classList.contains('hidden'),
    };
  });
  check(!!opened?.open, "the Constable's dialogue is open");
  check(!!opened?.present, 'and it offers Present');
  check(!(await holder(false)), 'a dialogue lets the pointer go, because its Present button is a thing you click');

  /* ------------------------ 4: AND THE BUTTON CAN ACTUALLY BE CLICKED ---
   * The second half of the bug, and the only assertion in this file that is
   * about a coordinate rather than about a flag. See `clickReal`. */
  const reached = await clickReal('#dialogue-present');
  check(reached, "the Present button is reachable by a real mouse, not only by a synthetic .click()",
    'pointer lock is held, the canvas takes every pointer event, and no real mouse can reach Present');
  await frames();
  check(!(await hidden('#journal-overlay')), 'and clicking it opens the picker');
  check(!(await holder(false)), 'which is an overlay over a dialogue, so the pointer stays free');

  /* ---------------------------------- 5: out of the picker, back to the box ---
   * `quest-manager.js` shuts the journal and opens the next lines in the same
   * call. The pointer must not flicker back for that: the dialogue underneath
   * still wants it. Closing the picker with its own Close button is the path
   * a player who changes their mind takes. */
  check(await clickReal('#journal-close'), 'the picker\'s Close button is reachable too');
  await frames();
  check(await hidden('#journal-overlay'), 'and it shuts the picker');
  check(!(await holder(false)), 'and the pointer stays free, because the dialogue under it is still open');

  // Step the conversation out with E. The last line closes the box, and THAT
  // is where the castle comes back.
  await breathe();
  for (let i = 0; i < 12; i++) {
    if (await hidden('#dialogue-box')) break;
    await page.keyboard.press('KeyE');
    await frames();
  }
  check(await hidden('#dialogue-box'), 'E steps the conversation to its end');
  check(await holder(true), 'and the last line gives the castle back');

  /* ------------------------------------------- 6: the accusation panel --- */
  await breathe();
  await page.evaluate(() => window.__quest._openAccusation());
  await frames();
  check(!(await hidden('#accusation-overlay')), 'the accusation panel opens');
  check(!(await holder(false)), 'and lets the pointer go: twelve names and three clues are all things you click');
  check(await clickReal('#accusation-cancel'), 'its Step back button is reachable by a real mouse');
  await frames();
  check(await hidden('#accusation-overlay'), 'and closes the panel');
  check(await holder(true), 'and the accusation panel gives the castle back');

  /* ----------------------------------------------- 7: the verdict pane ---
   * The fourth overlay, and the one with no player-facing close at all: its
   * button either reloads the page or goes to the second day, and the second
   * day's path is `quest-manager.js` calling `closeAccusation` on its way to
   * Lauds. That path is what is driven here, because it is the one that ends
   * with a player walking. */
  await breathe();
  await page.evaluate(() => window.__ui.showEpilogue(
    { convicted: 'a test verdict', epilogue: 'a test epilogue' }, () => {}, { label: 'The next morning' }));
  await frames();
  check(!(await hidden('#verdict-pane')), 'the verdict pane opens');
  check(!(await holder(false)), 'and lets the pointer go, so its button can be clicked');
  await page.evaluate(() => window.__ui.closeAccusation());
  await frames();
  check(await hidden('#accusation-overlay'), 'the morning after closes it');
  check(await holder(true), 'and the verdict pane gives the castle back');

  /* ------------------------------ 8: AND THE RATION IS NOT A DEAD END ---
   * The one beat here that does what a player does when they are annoyed:
   * mash J. Chrome grants four pointer-lock requests and refuses the rest for
   * about two seconds (#661), so somewhere in this loop the relock is turned
   * down — and a turned-down relock with nothing behind it is the same castle
   * you cannot walk, arrived at from the other side. What has to be true at
   * the end of it is not "the pointer came back"; it is "the player has a way
   * back", which is the pointer, or the journal still up, or the resume panel
   * the Esc path already uses.
   */
  await breathe();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('KeyJ');
    await wait(40);
  }
  await frames();
  const stuck = await page.evaluate(() => ({
    locked: !!document.pointerLockElement,
    panel: !document.getElementById('start-overlay').classList.contains('hidden'),
    journal: !document.getElementById('journal-overlay').classList.contains('hidden'),
  }));
  check(stuck.locked || stuck.panel || stuck.journal,
    "mashing J past the browser's pointer-lock ration leaves a way back, not a dead castle",
    `locked ${stuck.locked}, resume panel ${stuck.panel}, journal ${stuck.journal}`);
  // And the way back works. The ration refills in ~2 s; the panel's button is
  // the same button `showStart` wired, so one click is the whole of it.
  if (stuck.journal) { await page.keyboard.press('KeyJ'); await frames(); }
  await breathe();
  const panelUp = !(await hidden('#start-overlay'));
  if (panelUp) check(await clickReal('#start-button'), 'the resume panel it puts up is clickable');
  else check(await page.evaluate(() => !!document.pointerLockElement),
    'or the pointer came straight back and no panel was needed', 'neither one: no pointer, and no panel to get it');
  check(await holder(true), 'and the player is back in the castle');

  /* ------------------------------------------------- 9: nothing broke --- */
  check(page.__errs.length === 0, 'no console errors, page errors or failed requests', page.__errs.slice(0, 3).join(' | '));
  check(page.__blocked.length === 0, 'and the page made no offsite request', page.__blocked.slice(0, 3).join(' | '));

  await page.close();
} finally {
  await browser.close();
  await server.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
