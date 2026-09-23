# Castle Conundrum — how this repo works

A first-person medieval murder mystery in three.js. A day of walking before
it, twelve suspects, four bells, one accusation, and a morning after it.
`index.html` at the repo root, source in `src/`, the mystery and the castle as
data in `data/`, 28 MB of glTF and textures in `assets/`, fifteen suites in
`test/`.

**`PLAN.md` is the most valuable file here.** It is 64 K of phase plans — what
the castle is, why the order is what it is, and the seven phases that built it,
all seven of which shipped. **`BACKLOG.md` is the entry point for open work,
and `SPECS.md` is the spec behind each of its rows** (scope by file, acceptance,
open calls with a recommendation, dependencies, the rules that bite). Read a
row's spec before its brief. **`ROADMAP.md` is the order those rows can happen
in**: which machine each needs, the four hard gates on the whole list, and the
five lanes that say which two rows may be claimed at once (#600 to #602).
**`HISTORY.md` is the record**, and it carries every locked decision this
project has, by number.

**`WISHLIST.md` is the arc after the backlog**: seven themes and ten questions
Devon answered on 2026-09-16 (#547 to #550), ranking nothing and claiming nothing.
A row moves out of it into `SPECS.md` and `BACKLOG.md` when it is taken up.
`PLAN.md` was itself called `WISHLIST.md` before the move (#491), so a citation
of that name dated before 2026-09-16 means `PLAN.md`.

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
- **`dist/` is what gets served, and the repo root is not servable** (#505).
  That is the price of the line above and it is easy to forget, because under
  `Projects/Castle Conundrum/` the import map made the source directly
  servable. It does not any more: `src/main.js` opens with a bare `import * as
  THREE from 'three'`, and a static host hands that to a browser which cannot
  resolve it — `Failed to resolve module specifier "three"`, and the page hangs
  on its loading screen. `.github/workflows/pages.yml` builds and publishes
  `dist/` to <https://greyversusblue.github.io/castle-conundrum/> on every push
  to `main`, and the repo's Pages source has to stay **GitHub Actions**, never
  "deploy from a branch". `base: './'` in `vite.config.js` is what lets the same
  `dist/` serve from a subpath and from a bare domain later; do not hardcode a
  prefix anywhere.
- **Everything the page fetches at runtime comes from its own origin** (#493).
  No CDN, no font host, no asset host, ever. This is the half of the old
  vendoring rule that did not change, and it is asserted rather than promised:
  `harness.mjs` refuses every offsite request and `test/built.mjs` fails on a
  non-empty `page.__blocked`.
- **Code dependencies come from npm; assets stay committed** (#493). three is
  `"three": "0.169.0"` in `package.json`. The 28 MB under `assets/` is in git
  and stays there. The ceiling is **200 MB** (#499), not the 44.4 MB this
  project carried when the whole site shared one deploy.
- **Every asset is compressed, by a script, before it is committed** (#506).
  `npm run assets:encode` runs `tools/encode-assets.mjs` over `assets/` in
  place: KTX2/Basis for textures, meshopt for the Poly Haven meshes and the NPC
  bodies, nothing for the Kenney kit (#508). It needs KTX-Software's `ktx` on
  PATH and is re-runnable, so adding one asset encodes that asset. **The
  originals are not kept** — git history is the originals — and `dist/` has no
  encode step in it, because a build-time pipeline would make `npm run dev`
  serve one format and `dist/` another, which is `test/built.mjs`'s file diff
  failing by construction. Disk barely moved; video memory went from 317.9 MB
  to 79.9. **The exemption is a size, not a kit**: a texture 128 px or under is
  a PNG and does not come through the encoder, which is the Kenney kit and, since
  #742, the fifteen textures this repo draws into `assets/pixel/`, and
  `test/assets.mjs`'s check 3b is what holds it to 128 px so it cannot grow into
  a 1k PNG.
- **`src/castle-plan.js` is the single source the builder and every suite
  read** (#500). Neither side computes a transform the other cannot see:
  `castle-builder.js` places what the plan says and tags it with a `planId`,
  and `test/plan-vs-scene.mjs` loads the page, takes every tagged object's live
  `Box3` and diffs it against the plan's box at 0.01 m. That suite is the net.
  **`test/layout.mjs` is every fact derivable from the plan in Node and
  `test/plan-vs-scene.mjs` is the seams only — nothing it asserts may be
  provable in Node, and `test/mystery.mjs` owns the stations** (#529).
  This was Phase 2's whole point and was never written down as a rule — it was
  visible only in the shape of the files, which is exactly how a rule gets lost.
  **`test/budget.mjs` is the one carve-out, and it is by cost rather than by
  method** (#611): layout.mjs holds whether the castle works and budget.mjs
  holds what it costs — draw calls, point lights and skinned bodies per ward,
  against ceilings that are guesses held as named constants in one block. The
  two share no assertion, and a content row that has to renegotiate a ceiling
  argues for it in `HISTORY.md`.
- **Never change a storage key** (#36, from the old repo, and it crosses).
  Changing a key silently abandons anyone mid-use. The key is
  `castleConundrumSave_v1` (#413) and the version inside it is **6** (#612;
  2 was the second day, #533, 3 `read`, 4 `quests`, 5 `visited`).
  Unversioned saves read as version 0 and come through `repair`.
- **`migrate` is for version drift; `repair` is for every load** (#37).
- **Assert against the DOM for anything that just happened, and against the
  save only for what a reload has to survive** (#39).
- **Windows is the dev machine.** An absolute `import()` path needs
  `pathToFileURL` — a bare `C:\...` is read by Node as URL scheme `c:` and
  refused outright. Do not lean on shell brace expansion either. `npm run play`
  is written to be run there, on a real GPU.
- **Every committed text file is CRLF here and LF in CI, so a suite never reads
  a line ending off the working tree** (#632). `core.autocrlf` is `true` on the
  dev machine: `data/scene-config.json` carries 2546 CRLFs here and 2546 LFs in
  CI. Anything that writes into a repo file takes its newline from the file
  (`eolOf` in `tools/place.mjs`), and anything that asserts over one builds both
  endings and asserts over both. A rail that skips this is two different rails
  on the two machines, and `test/tools.mjs` was exactly that for its whole life:
  green in CI, one byte short on Windows, for the three assertions it exists for
  (#631).
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
- **A dev-only tool is dev-only by construction, and the check is a grep of
  `dist/`** (#586). `?edit=1` mounts the placement editor (`src/edit-mode.js`)
  and a Vite middleware writes `data/scene-config.json`. The client sits behind
  `import.meta.env.DEV` so Vite deletes the branch, and the writer is a plugin
  with `apply: 'serve'` so a build cannot run it. Neither is trusted:
  `test/built.mjs` greps every shipped file for the module's sentinel. The
  served-set diff cannot see this one — a built page never asks for the editor
  — which is #501's lesson pointed at a second target.
- **A real-time movement or physics assertion failing under a Linux/software-
  rendered Chromium is inconclusive, not confirmed** (#53). Re-verify from a
  machine with real GPU compositing before trusting either a pass or a fail.
  That is the line between `npm test`, which CI runs, and `npm run play`, which
  it does not.

## Which model does what

The three subagents live in `.claude/agents/`: `scribe` (Sonnet), `builder`
(Opus) and `architect` (Opus). **The model is chosen by what a change
touches, not by which row it belongs to.** The Model column in `BACKLOG.md`
and `ROADMAP.md` is a row's ceiling, and the table below is the default, not
a rule: the lead may override it and says why in one line.

**The lead** is the session's own model. Before touching a file it reads the
row's `SPECS.md` section, classifies the next increment, states the class in
one line and dispatches. It does not write code or edit the doc files itself
for class S or B work, and it does not re-read a diff a green suite already
vouched for. A subagent's report is at most fifteen lines: files touched,
assertions added and which one failed when the guard-rail was broken on
purpose (#34), the `npm test` result, any HISTORY number claimed.

| Class | Who | The test |
| --- | --- | --- |
| **B** bookkeeping | `scribe` | The decision already exists; the job is writing it down. Renumbering a band, retiring a shipped row, fixing a count, resolving a doc merge, recording a CI flake with its control run. |
| **S** ship | `builder` | The `SPECS.md` section exists and every open call has a recommendation; one lane; no `save.js` version bump; no numbered decision overturned; no assertion moved between suites. Content that fills an existing shape. Runs `npm test` and says which suite went red first. |
| **O** decide | `architect` | Any one of: no section yet, or an open call without a recommendation; `save.js`'s version or `migrate` (#36, #37); overturning or amending a numbered decision; an assertion across the `layout` / `plan-vs-scene` / `mystery` / `budget` line (#529, #611); a budget ceiling; two lanes at once; a guard-rail that stays green when its bug is reintroduced. Ends on a `SPECS.md` section whose open calls all carry a recommendation. |
| **F** the lead | the session | Triage, asset sourcing and measuring, reordering `ROADMAP.md`, "what next", and anything Devon asks as a question. |

Three rules that break ties:

- **A row is usually two or three classes in sequence.** Dispatch each
  increment to its own class, not the whole row to the highest one.
- **When the lead cannot tell S from O, it is O.** Both are Opus; the
  difference is that `architect` writes the decision down before anything is
  built, and a decision nobody wrote down is how this project lost the
  plan-suite rule for a year.
- **Judgement about what to delete or restructure is not bookkeeping, even in
  the doc files** (#784). Opus decides and writes the cut list; `scribe`
  carries it out. Splitting a job this way, Opus planning and Sonnet
  executing, is allowed for any class where the reading is large and the
  deciding is small.

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
| `npm run build` | `dist/`: the hashed bundle in `dist/bundle/`, `assets/` and `data/` copied in whole, the Basis transcoder into `dist/decoders/basis/`. |
| `npm run preview` | Serves `dist/`. |
| `npm run assets:encode` | Re-encodes `assets/` in place, KTX2 and meshopt. Hand-run, needs `ktx` (#506). |
| `npm run pixel:render` | Draws `tools/pixel/textures.json`'s fifteen rows into `assets/pixel/*.png`. Hand-run, deterministic, a second run is a no-op (#742). |
| `npm run dialogue:extract` | `data/` out to `dialogue/castle.dlg`. Hand-run (#687). |
| `npm run dialogue:compile` | `dialogue/castle.dlg` back into `data/npcs.json` and `data/quests/`. Hand-run. |
| `npm run dialogue:check` | Neither, and exits non-zero if the two have drifted. `test/dialogue.mjs` runs the same check. |
| `npm test` | All fifteen suites, cheapest first, non-zero on any failure. `npm test layout built` runs a subset. |
| `npm run play` | **Opens a real visible window** and plays the whole day with pointer lock, WASD and real key presses. Hand-run, on a GPU (#53). Screenshots land in `shots/play/`. |

`npm test` is what CI runs. `npm run play` is not in CI and is not going to be.