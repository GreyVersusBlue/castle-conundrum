# Castle Conundrum — how this repo works

A first-person medieval murder mystery in three.js. Twelve suspects, four
bells, one accusation. `index.html` at the repo root, source in `src/`, the
mystery and the castle as data in `data/`, 43 MB of glTF and textures in
`assets/`, eight suites in `test/`.

**`PLAN.md` is the most valuable file here.** It is 64 K of phase plans — what
the castle is, why the order is what it is, and the seven phases that built it,
all seven of which shipped. **`BACKLOG.md` is the entry point for open work.
`HISTORY.md` is the record**, and it carries every locked decision this project
has, by number.

The project lived in `GreyVersusBlue/tools-and-games` under
`Projects/Castle Conundrum/` until 2026-09-15 and moved here with its history
(#491). `PLAN.md` was moved intact and still spells the old paths; read them as
`Projects/Castle Conundrum/x` meaning `x`.

## House rules

- **A build step, and it is Vite** (#494). This repo does not follow its old
  home's no-build rule, because the rule it bought — vendor everything by hand
  and serve the files as they are — cost a hand-copied 1.2 MB
  `libs/three.module.js` that nothing could tell you the provenance of.
  `npm run build` produces `dist/`, and `test/built.mjs` is the check that the
  built page loads the same castle the source does.
- **Everything the page fetches at runtime comes from its own origin** (#493).
  No CDN, no font host, no asset host, ever. This is the half of the old
  vendoring rule that did not change, and it is asserted rather than promised:
  `harness.mjs` refuses every offsite request and `test/built.mjs` fails on a
  non-empty `page.__blocked`.
- **Code dependencies come from npm; assets stay committed** (#493). three is
  `"three": "0.169.0"` in `package.json`. The 43 MB under `assets/` is in git
  and stays there. The ceiling is **200 MB** (#499), not the 44.4 MB this
  project carried when the whole site shared one deploy.
- **`src/castle-plan.js` is the single source the builder and every suite
  read** (#500). Neither side computes a transform the other cannot see:
  `castle-builder.js` places what the plan says and tags it with a `planId`,
  and `test/plan-vs-scene.mjs` loads the page, takes every tagged object's live
  `Box3` and diffs it against the plan's box at 0.01 m. That suite is the net.
  This was Phase 2's whole point and was never written down as a rule — it was
  visible only in the shape of the files, which is exactly how a rule gets lost.
- **Never change a storage key** (#36, from the old repo, and it crosses).
  Changing a key silently abandons anyone mid-use. The key is
  `castleConundrumSave_v1` (#413). Unversioned saves read as version 0 and come
  through `repair`.
- **`migrate` is for version drift; `repair` is for every load** (#37).
- **Assert against the DOM for anything that just happened, and against the
  save only for what a reload has to survive** (#39).
- **Windows is the dev machine.** An absolute `import()` path needs
  `pathToFileURL` — a bare `C:\...` is read by Node as URL scheme `c:` and
  refused outright. Do not lean on shell brace expansion either. `npm run play`
  is written to be run there, on a real GPU.
- **A check that only prints is a check that gets ignored** (#13). Anything you
  add that verifies something exits non-zero on failure. `test/run.mjs` has no
  skip list and CI has no known-failures file.
- **Verify a guard-rail by reintroducing the bug it guards** (#34). If you add
  a test, break the thing on purpose and watch the test fail first, from a
  green baseline, and say which assertion failed and what it said. A test that
  re-implements the thing it checks is not a check. Two versions of this
  project's line-of-sight check once passed the entire suite while doing
  literally nothing. And when a break leaves the suite green, ask whether the
  assertion's *comment* is the thing that is wrong (#147): `test/built.mjs`
  claimed to catch a build that dropped a file, stayed green when one was
  deleted out of `dist/` on purpose, and had to start comparing what the server
  *served* rather than what the page *asked for* (#501).
- **A real-time movement or physics assertion failing under a Linux/software-
  rendered Chromium is inconclusive, not confirmed** (#53). Re-verify from a
  machine with real GPU compositing before trusting either a pass or a fail.
  That is the line between `npm test`, which CI runs, and `npm run play`, which
  it does not.

## Writing style

Direct, specific, no em dashes, no rule-of-three padding, no corporate
throat-clearing. Numbers over adjectives. When something was wrong, say what
was wrong and what the evidence was. Do not write "comprehensive" or "robust"
anywhere.

## Decision numbers

`HISTORY.md` carries them, starting at #389 — the number this project's first
locked decision was given in `tools-and-games`. The numbers were kept rather
than renumbered because `src/` and `test/` cite them by number in about ninety
places; renumbering would have made every one of those citations a lie.

**A decision number resolves in its own repo's `HISTORY.md`** (#492). From
#491 the two repos number independently, so a `#495` in this repo and a `#495`
in `tools-and-games` are different decisions. Numbers below #491 that are not
here (#395 to #410, and everything under #389) are `tools-and-games`', and that
file keeps a pointer saying which band left.

## The npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server. What the two browser suites drive. |
| `npm run build` | `dist/`: the hashed bundle in `dist/bundle/`, `assets/` and `data/` copied in whole. |
| `npm run preview` | Serves `dist/`. |
| `npm test` | All eight suites, cheapest first, non-zero on any failure. `npm test layout built` runs a subset. |
| `npm run play` | **Opens a real visible window** and plays the whole day with pointer lock, WASD and real key presses. Hand-run, on a GPU (#53). Screenshots land in `shots/play/`. |

`npm test` is what CI runs. `npm run play` is not in CI and is not going to be.
