// touch.mjs — the second input scheme, driven by a real touchscreen.
//
//   node test/touch.mjs        (from the repo root)
//
// Exits non-zero on any failure.
//
// WHY THIS EXISTS. Phase 7 shipped a game whose only input is pointer lock,
// WASD and two keys, and a phone has none of them (#530). `src/touch-controls.js`
// is the second scheme and this is the only thing in CI that ever touches it.
//
// WHY IT IS ALLOWED IN CI when `play-castle.mjs` is not, and what it may not
// assert. #53 is about real-time movement and physics under a software
// rasteriser being inconclusive either way. **Nothing here moves and nothing is
// timed.** The camera is placed, taps are dispatched, and what is read back is
// a class on a div and a string in the DOM. Whether a stick FEELS right, what
// the look rate should be, whether a 92 px button is reachable by a thumb — all
// of that is a phone, and Devon's, and it is outstanding in HISTORY.md exactly
// as the Phase 5 to 7 GPU criteria are.
//
// WHAT IT DOES ASSERT is the wiring, and one guard in particular. A tap fires a
// synthetic `click`; `src/interaction.js` listens for clicks because a click is
// how a dialogue is advanced with a mouse; so without `touchend` being
// prevented, a thumb landing on the movement stick steps the conversation it is
// standing in front of. That is the bug this row would otherwise ship, and the
// break for it is in HISTORY.md under #530.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDev, launch, prepPage, threeUrl } from './harness.mjs';
import { attachSceneProbe, waitForProbe } from './drive.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const PORT = 8127; // not 8124 (play), 8125 (plan-vs-scene) or 8126 (built)
const BASE = `http://127.0.0.1:${PORT}`;

const riddleText = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/riddle.json'), 'utf8')).riddle;

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };
const pass = (msg) => console.log(`  ok    ${msg}`);
const check = (cond, msg, detail = '') => (cond ? pass(msg) : fail(`${msg}${detail ? ` — ${detail}` : ''}`));

console.log('the thumb: a phone-shaped page, and every tap it has\n');

const server = await serveDev(PORT);
const THREE_URL = await threeUrl(BASE);
const browser = await launch();
// A phone-shaped viewport, because the HUD is laid out in vw and vh and a
// 1280-wide window would put the buttons somewhere no thumb goes.
const page = await prepPage(browser, { width: 412, height: 915, dsf: 1, touch: true });

/** The centre of an element, in CSS pixels, or null when it is not on screen. */
const centreOf = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, sel);

/** Two animation frames, so the render loop's own update() has run. */
const frames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const tapAt = async (x, y) => { await page.touchscreen.tap(x, y); await frames(); };
const tap = async (sel) => {
  const at = await centreOf(sel);
  if (!at) { fail(`nothing to tap: ${sel} is not on the screen`); return false; }
  await tapAt(at.x, at.y);
  return true;
};
const hidden = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  return !el || el.classList.contains('hidden');
}, sel);

try {
  await page.goto(`${BASE}/test/blank.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('castleConundrumSave_v1'));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForSelector('#start-overlay:not(.hidden)', { timeout: 120000 });
  pass('the castle finished building on a 412 x 915 page with a touchscreen');
  // `window.__cam` comes from the same scene probe plan-vs-scene.mjs uses; the
  // page itself exposes the player, the cast and the quest and not the camera.
  await attachSceneProbe(page, THREE_URL);
  await waitForProbe(page);

  /* ------------------------------------------- 1: the page knows it is a phone --- */
  const detected = await page.evaluate(() => ({
    coarse: matchMedia('(pointer: coarse)').matches,
    points: navigator.maxTouchPoints || 0,
    hudHidden: document.getElementById('touch-hud').classList.contains('hidden'),
    body: document.body.classList.contains('touch'),
    hint: document.getElementById('controls-hint').textContent,
    toggle: document.getElementById('touch-toggle').textContent,
  }));
  check(detected.coarse || detected.points > 0,
    `the page is driven by a thumb: pointer coarse ${detected.coarse}, maxTouchPoints ${detected.points}`);
  check(!detected.hudHidden && detected.body, 'the touch HUD is shown under a coarse pointer',
    `hidden ${detected.hudHidden}, body.touch ${detected.body}`);
  check(!/WASD/.test(detected.hint) && /thumb/.test(detected.hint),
    'and the start panel says thumbs, not keys', JSON.stringify(detected.hint.slice(0, 60)));
  check(/on$/.test(detected.toggle.trim()), 'the toggle reads on', detected.toggle);

  /* ---------------------------------------------- 2: a tap starts the game --- */
  /* AND THE TAP IS ON THE SECOND DOOR (#755). The page opens on the walking day
   * since #751, where the muniment leaf answers with a line instead of a riddle
   * (open call 7) and there is nothing in the journal to present. Every beat
   * below is about the day of the death, so this file taps the panel's second
   * button — which increment 1 had to take as `window.__quest.enterMystery()`
   * because the button did not exist yet (#767). A thumb has to be able to
   * reach it: `tap` is a real touch at the element's own place on the screen,
   * so a second door laid out off the panel or under the first one fails here
   * and not in a mouse suite. */
  check(!(await hidden('#start-mystery')), 'a fresh save is offered the second door');
  await tap('#start-mystery');
  check(await hidden('#start-overlay'), 'a tap on Straight to the day of the death takes the start panel away');
  check(!(await hidden('#crosshair')), 'and puts the crosshair up');
  check(await page.evaluate(() => window.__quest.day) === 1, 'and it is the day of the death');
  const playing = await page.evaluate(() => !!window.__player?.enabled && window.__player.isLocked && window.__player.onTouch);
  check(playing, 'the player is enabled and on the touch scheme, with no pointer lock to take');

  /* ------------------------------------ 3: one button, and it is the prompt --- */
  // The muniment room's word-lock, from the King's Hall, exactly where
  // plan-vs-scene.mjs stands to press E at it. Placed, not walked (#53).
  await page.evaluate(() => {
    window.__cam.position.set(21, 1.7, -12);
    window.__cam.rotation.set(0, -0.026, 0, 'YXZ');
  });
  await frames();
  const atLock = await page.evaluate(() => ({
    prompt: document.getElementById('interact-prompt').textContent.trim(),
    button: document.getElementById('touch-e').textContent.trim(),
  }));
  check(/word-lock/i.test(atLock.prompt), 'the prompt at the muniment door reads the word-lock', atLock.prompt);
  check(atLock.button.length > 1 && !/^E$/.test(atLock.button) && !/^Press E/i.test(atLock.button),
    'and the E button wears the prompt without the key that is not there', JSON.stringify(atLock.button));

  await tap('#touch-e');
  const riddle = await page.evaluate(() => ({
    open: !document.getElementById('riddle-overlay').classList.contains('hidden'),
    text: document.getElementById('riddle-text').textContent.trim(),
  }));
  check(riddle.open, 'a tap on E at the word-lock opened the riddle');
  check(riddle.text === riddleText, 'with riddle.json\'s own riddle in it', riddle.text.slice(0, 40));
  await tap('#riddle-cancel');
  check(await hidden('#riddle-overlay'), 'and Step away closes it');

  /* ------------------------------------------------ 4: the Journal button --- */
  await tap('#touch-j');
  check(!(await hidden('#journal-overlay')), 'a tap on Journal opens the journal');
  // And the overlay owns the screen while it is up: it is drawn over the HUD,
  // so the way out is its own Close button and not the Journal button again.
  // That is `tryInteract`'s existing rule (`isOverlayOpen` returns early) with
  // a z-index behind it, not a new one.
  await tap('#journal-close');
  check(await hidden('#journal-overlay'), 'and its own Close button closes it');

  /* ------------------------ 5: A THUMB ON THE STICK IS NOT A CLICK (#530) ---
   * The guard this whole suite exists for. A dialogue is opened, and then a
   * finger is put down and lifted in the left half of the screen, which is the
   * movement stick. The dialogue must not move. Without `touchend` being
   * prevented in src/touch-controls.js the browser synthesises a click, the
   * document handler in src/interaction.js reads it, and the player loses a
   * line of a conversation every time they take a step.
   */
  const opened = await page.evaluate(() => {
    // The Constable's own conversation, opened the way E opens it — through the
    // quest manager, which is what `InteractionSystem.tryInteract` calls. Not
    // by standing in front of him: at every station in the schedule he is
    // within arm's reach of a piece of evidence, so the nearest target from two
    // metres away is the body and not the man, and this beat is about the
    // dialogue and not about who is nearest.
    const npc = window.__cast.find((n) => n.id === 'constable');
    if (!npc) return null;
    window.__quest.handleInteract(npc);
    return { open: !document.getElementById('dialogue-box').classList.contains('hidden') };
  });
  check(!!opened?.open, 'the Constable\'s dialogue is open');
  await frames();
  const inDialogue = await page.evaluate(() => ({
    open: !document.getElementById('dialogue-box').classList.contains('hidden'),
    line: document.getElementById('dialogue-text').textContent.trim(),
  }));
  check(inDialogue.open && inDialogue.line.length > 0, 'with a line in it', JSON.stringify(inDialogue.line.slice(0, 40)));

  // A finger down and up on the movement stick: the left half, well clear of
  // the two buttons on the right and of the dialogue box at the bottom.
  await tapAt(90, 380);
  const after = await page.evaluate(() => ({
    open: !document.getElementById('dialogue-box').classList.contains('hidden'),
    line: document.getElementById('dialogue-text').textContent.trim(),
  }));
  check(after.open && after.line === inDialogue.line,
    'a stick touch did not advance the dialogue',
    after.open ? `moved on to ${JSON.stringify(after.line.slice(0, 40))}` : 'the dialogue closed');

  // And the button still does: one tap, one line, not two.
  await tap('#touch-e');
  const stepped = await page.evaluate(() => document.getElementById('dialogue-text').textContent.trim());
  check(stepped !== inDialogue.line, 'and a tap on E does advance it, exactly once',
    `still ${JSON.stringify(stepped.slice(0, 40))}`);

  /* ------------------------------------------------------ 6: the toggle --- */
  // Back out of the dialogue, then turn the scheme off from the start panel the
  // way a laptop with a touchscreen would.
  const off = await page.evaluate(() => {
    document.getElementById('touch-toggle').click();
    return {
      hudHidden: document.getElementById('touch-hud').classList.contains('hidden'),
      hint: document.getElementById('controls-hint').textContent,
      onTouch: !!window.__player?.onTouch,
      toggle: document.getElementById('touch-toggle').textContent,
    };
  });
  check(off.hudHidden && !off.onTouch, 'the toggle turns the scheme off: HUD gone, controller back on the keys',
    `hidden ${off.hudHidden}, onTouch ${off.onTouch}`);
  check(/WASD/.test(off.hint) && /off$/.test(off.toggle.trim()), 'and the hint goes back to keys', off.toggle);

  /* --------------------------------------------------- 7: nothing broke --- */
  check(page.__errs.length === 0, 'no console errors, page errors or failed requests', page.__errs.slice(0, 3).join(' | '));
  check(page.__blocked.length === 0, 'and the page made no offsite request', page.__blocked.slice(0, 3).join(' | '));

  await page.close();
} finally {
  await browser.close();
  await server.close();
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
