# SPECS

A spec per ranked row in `BACKLOG.md`. **`BACKLOG.md` ranks; this file says what
each row is, in the detail `PLAN.md` gave the seven phases and the backlog rows
never got.** `HISTORY.md` is still the only record: nothing in here is a locked
decision. Every "recommendation" below is exactly that, and the session that
ships the row is the one that records the call with a number.

Written 2026-09-15 against `main` at `bb61958`, from the code and data as they
are, not from the briefs. **Two rows shipped the same day and their sections are
gone: asset compression (#506 to #510), sound (#519 to #522), the tower tops
(#523 to #526), the hall's roof frame (#527, #528) and the two plan suites
(#529).** What asset
compression left behind for the rows that touch assets is named in their
Dependencies; what sound left behind is `data/sounds.json`, a `material` and a
`kind` on every `plan.surfaces` entry, and `layout.mjs` check 12. Where a brief and the code disagree, the code is
quoted and the disagreement is named. Measurements are `git ls-tree`, `du` and
`ls -la` on that commit.

## How to read a section

Each row has the same five parts.

1. **Scope**: the files that change or get added, and the systems involved.
2. **Acceptance**: what done looks like, and which suite says so. Where a new
   guard-rail is warranted, the assertion and the break that proves it is not
   vacuous (#34).
3. **Open calls**: what the row leaves unresolved, with a recommended answer and
   the reasoning. Recommendations, not decisions.
4. **Dependencies**: what has to have shipped first, and what should not run at
   the same time.
5. **Constraints**: the house rules that bite this row, by number, and only
   those.

The depth follows the `Size` column: a ¼ gets bullets, a 1 gets the file-level
plan, and the 2+ is mostly about the first increment.

**A section is named, not numbered.** Each one opens with the rank it holds in
`BACKLOG.md` today, and a shipped row shifts every number below it, so the rank
on that line is a pointer a shipping session updates and nothing else refers to.
Everywhere one section names another it names it by title. The version of this
file written on 2026-09-15 numbered them inline instead and was already a row
out of step with itself inside "The GPU run" before anything had shipped (#522).

## What every row shares

Four facts every row below leans on, stated once:

- **`src/castle-plan.js` computes every transform, box and surface; the builder
  places and tags; `test/plan-vs-scene.mjs` diffs the two at 0.01 m** (#500).
  Anything added to the castle is a plan piece with a `planId`, or it is invisible
  to the net.
- **Nothing the page fetches leaves its origin** (#493). `test/harness.mjs`
  aborts every offsite request and `test/built.mjs` fails on a non-empty
  `page.__blocked`. Decoder files, fonts, sound files and images all land under
  this repo.
- **The eight suites are `npm test`; `npm run play` is not** (#53). A row whose
  proof needs a real-time walk or a look at a render has a GPU criterion nobody
  in a session can meet. Every row below also names a Node or headless criterion
  so the row is not blocked on hardware.
- **The save key is `castleConundrumSave_v1` and stays** (#36, #413). Schema
  changes go through `migrate` with a version bump; `repair` runs on every load
  (#37).

---

## A fourth body

**Rank 1. Size ½.** Marged (cook), Nest (laundress) and Lady Alys are three of
twelve and wear `Farmer.glb`, `Farmer.glb` and `King.glb`. Twelve people off
three bodies by tint was Devon's bet (#417, #419) and PLAN.md's own risk list
calls it the one it would bet the project fails on. This repo's rule lets a
session answer the question.

### Scope

- **`assets/NPCs/<Woman>.glb`, new**, 1.4 to 2.0 MB by the three on disk. The
  three are the same rig: node names `Wrist.R`, `Head`, `Neck`; materials
  `Skin`, `Eye`, `Eyebrows`, `Hair`; 24 clips including `Idle`, `Walk`, `Wave`,
  `Interact`; zero textures. The `npc.js` comment calls it the Quaternius rig.
  A fourth body from the same pack keeps `pickClip`, `tintBody`'s
  `BARE_MATERIALS` and `_findHandBone` working with no code change. A body from
  anywhere else has to be checked against all three lists.
- **`data/npcs.json`.** `modelPath` on `cook`, `laundress` and `lady`; their
  three tints stay distinct. `hideMaterials`/`hideNodes` as the new body needs.
- **`test/mystery.mjs:79`** asserts `bodies.size === 3`. It becomes 4, and
  gains the assertion that says what the fourth is for.
- **`test/plan-vs-scene.mjs`** asserts `one skin colour across all of them`
  from the live materials. A fourth body whose `Skin` hex differs fails that
  line. Either the body's skin is set to the others' hex in the file, or the
  assertion becomes "skin colours come from the files, not from the tint", which
  is what it is actually guarding (#471).
- **`test/assets.mjs`** check 4 fails the file until `npcs.json` names it, which
  is the "same commit" rule (#390) doing its job.
- **`test/play-castle.mjs`** asserts `twelve rigged NPC bodies` and
  `every skeleton rebound`: unchanged if the rig is a rig.

### Acceptance

- Twelve bodies spawn, four models, twelve distinct cloth sets
  (`plan-vs-scene.mjs` already asserts the twelve), `npm run build` and eight
  suites green.
- `test/mystery.mjs`: `four bodies, and the three women share the one that is
  a woman's`, asserting `cook`, `laundress` and `lady` share a `modelPath` that
  no man in the cast uses. Break: put Lady Alys back on `King.glb`; the line
  names her.
- `test/assets.mjs`: model reference resolves, is not a preview ball, is
  referenced. Break: add the file without the `npcs.json` edit; check 4 says
  `nothing references assets/NPCs/<Woman>.glb`.
- The GPU criterion is **The GPU run**'s photograph, and the honest line in `HISTORY.md`
  is that the fourth body has not been looked at either until that run.

### Open calls

- **Source of the body.** Recommend, in order: **the pack the three came from**
  (same rig, same clip and material names, CC0); then any CC0 humanoid with a
  `Walk` and an `Idle` clip and a material named `Skin`, re-exported through
  `gltf-transform` the way the three were (generator `glTF-Transform v4.4.2`);
  **never a re-tinted Farmer**, which is what the row exists to replace. If
  nothing fits, the row closes as "no woman's body found, the bet stands" and
  says where was looked, which is a result.
- **Who wears it.** Recommend **all three women**. Farmer keeps the chaplain
  and the prisoner; King keeps the Constable and the Steward. Two women on the
  new body and one on King is half an answer.
- **A separate `modelHeight`?** `npc.js` normalises every body to 1.8 m.
  Recommend **1.65 m for the fourth body** via `modelHeight`, so height as
  well as tint tells the three apart at twenty metres.

### Dependencies

- The evidence for this row is **The GPU run**'s Vespers photograph, which no
  session can take. Devon ranked this above that row knowing so; ship it on the
  plan's stated risk and let the run look at thirteen bodies' worth of question
  instead
  of twelve.
- **The body goes through `tools/encode-assets.mjs`** (#506), which is shipped:
  `npm run assets:encode` meshopts it in place. It needs KTX-Software's `ktx` on
  PATH. A body committed uncompressed passes every suite and is the one asset
  nothing would catch.

### Constraints

- #390 (asset and reference in one commit; `assets.mjs` check 4).
- #499 (2 MB against 158 MB of headroom; not a constraint any more, and worth
  saying so in `HISTORY.md` because #419 priced this at "a new ceiling").
- #471 (tint clones the material; skin is bare; the live-skin assertion in
  `plan-vs-scene.mjs` is the thing a new body can trip).
- #34 (the two breaks).

---

## The GPU run

**Ranks 2 and 3. Size ¼ each.** `npm run play` is 102 assertions and a numbered
screenshot per beat into `shots/play/`, and no run of it since Phase 5 has
happened on a machine with real compositing (#53). Phases 5, 6 and 7 each list
a GPU exit criterion as outstanding. The second of the two makes a new preview
and og card from that run.

### Scope, the run

- **Nothing in `src/`.** The run is the deliverable. `test/play-castle.mjs`
  gains one beat: at Vespers, after `arrives('cook')`, stand in the Great
  Hall's north doorway, look along the hall, and `snap('twelve-at-vespers')`.
  Six of the twelve stand there at Vespers (constable, steward, clerk, cook,
  sentry, laundress); the other six are elsewhere and a second shot from the
  chapel at Prime (constable, chaplain, apprentice nearby) covers the rest of
  the visual question, which is: **do twelve read as twelve?**
- **`HISTORY.md`** records what the run said, beat by beat, and what was seen:
  the walk on the Kitchen Tower flights (Phase 5's 5.7, 9.7, 1.7 readings), the
  cross-wall crossing, the cook's walk from kitchen to hall, the reload at
  Sext, the epilogue. A beat that fails on a GPU is a bug; a beat that failed
  under software rendering and passes here was never one.
- **`BACKLOG.md`**'s header line "Nothing here has been seen on a GPU since
  Phase 5" comes out.

### Acceptance, the run

- `npm run play` exits 0 on a machine with a GPU, or exits non-zero with the
  failing beat named and filed as a new backlog row.
- `shots/play/` contains the numbered set, `twelve-at-vespers.png` among them,
  and a human has looked at it and written one sentence per body: told apart
  or not. That sentence is the answer to Q53's risk and is **A fourth body**'s
  evidence after the fact.
- No new guard-rail: the run is the check. The `snap` beat is a screenshot, not
  an assertion, and says so in its comment.

### Scope, the images

- Two images: the board preview and the 1200x630 og card
  (`index.html`'s `og:image:width`/`height`). Composed from the run's shots,
  the HUD included (#374, #379 were about the old images showing none of it).
- `index.html`'s `og:image` and `twitter:image` currently point at
  `https://greyversusblue.com/assets/og/castle-conundrum.jpg` on purpose (#504):
  the images live in `tools-and-games/assets/`. Where the new ones go decides
  whether that line changes.

### Acceptance, the images

- Two files exist and are linked from wherever they end up; the og card is
  1200x630; `index.html`'s meta matches the actual file if it moved here.
- If the images land in this repo: `test/built.mjs` gains a line that the
  `og:image` URL's path exists in `dist/` (the page does not fetch it, so the
  served-set diff cannot see it). Break: rename the file; the line names the
  meta tag.

### Open calls

- **Where the images live.** `BACKLOG.md` says this is Devon's and he relinks.
  Recommend **this repo, under `assets/og/`, with `og:image` pointing at
  `https://greyversusblue.github.io/castle-conundrum/assets/og/castle-conundrum.jpg`**,
  because the page's URL already moved here (#504) and an image that lives in
  a different repo from the page it depicts goes stale the way the current one
  did. Mark it as needing Devon's yes; do the board-side relink in
  `tools-and-games` only if asked. `assets/og/` is not under the reachability
  sweep (`poly-haven` and `NPCs` only) and does not need to be: it is not a
  runtime asset. Say so in the sweep's comment.
- **Which shot is the card.** Recommend the Vespers hall with six of the twelve
  and the HUD, not the barbican spawn: the card should show the game's claim
  (twelve suspects) rather than a wall.

### Dependencies

- **The images cannot start until the run has happened**, and `BACKLOG.md` says
  so.
- The run needs a machine with a GPU, which is Devon's; a session can add the
  `snap` beat and cannot run it. If a session is asked to take the run without
  one, the honest output is the beat and a note, not a claim.
- **A fourth body** wants the run's photograph as evidence; see above.

### Constraints

- #53 (the whole point of the row).
- #504 (if `og:image` moves, that is the line to change, and the crawler fetch
  is not a page fetch so #493 does not bind either way).
- #34 does not apply to the run (no rail added); applies to the images'
  `built.mjs` line if they move here.

---

## Touch

**Rank 4. Size 1.** `PlayerController` is `PointerLockControls` plus WASD off
`document` keydown; `InteractionSystem` listens for `KeyE` and `KeyJ` on the
document; `main.js` gates movement on `player.isLocked` and re-shows the start
overlay on `unlock`. A phone has none of that. This is a second input scheme.

### Scope

- **`src/touch-controls.js`, new.** Two thumb zones on the canvas: left half
  is a virtual stick that writes the same forward/strafe pair `update` derives
  from the key set today; right half is look, writing `camera.rotation` in
  `YXZ` order the way `PointerLockControls` does (which is also what
  `drive.mjs`'s `aimAt` relies on). Sprint on a second finger or a stick past
  80 percent. `touchstart`/`touchmove` with `preventDefault`, or the browser
  scrolls and fires a `click` that `InteractionSystem`'s document click handler
  reads as "advance dialogue".
- **`src/player-controller.js`.** `update` returns early unless
  `controls.isLocked && enabled`. It needs an input source it reads from
  (`{forward, strafe, sprint}`) with two providers, keys and touch, and a
  notion of "active" that is pointer lock on a mouse machine and "started" on
  a touch one. `lock()`/`unlock()` become no-ops on touch.
- **`src/interaction.js`.** `tryInteract` and `tryJournal` are already methods;
  the E button calls the first, the J button the second. `update` already
  writes the prompt text through `ui.setInteractPrompt`; the touch E button's
  label is that text, so one button means talk, examine and ring depending on
  what is in front of the player, which is the row's stated requirement.
- **`src/ui.js`, `src/ui.css`, `index.html`.** A touch HUD (`#touch-hud`): two
  stick pads, E, J. Shown when `matchMedia('(pointer: coarse)')` matches or a
  touch event arrives; the `controls-hint` line on the start panel says taps
  instead of keys. Every overlay already scrolls with `safe center` (#488), so
  the journal and accusation work on a short screen. The riddle's `<input>`
  opens the soft keyboard; its `keydown` already stops propagation.
- **`src/main.js`.** Chooses the provider, passes it in, and stops re-showing
  the start overlay on `unlock` when there is no pointer lock to lose.
- **`test/plan-vs-scene.mjs`** or a new `test/touch.mjs` (headless, static,
  #53-safe): open the page with touch emulated (puppeteer `emulate` with
  `hasTouch: true` and a coarse-pointer viewport), assert the touch HUD is
  shown and the key hint is not, place the camera at the word-lock the way the
  existing beat does, and `tap` the E button; the riddle overlay opens. Then
  tap J; the journal opens. Nothing moves, nothing is timed.

### Acceptance

- On a phone: look, move, sprint, E, J, dialogue advance by tap, the riddle
  answered with the soft keyboard, the journal and accusation usable. GPU-class
  (#53): a phone is real compositing and nobody in a session has one. Stated
  as outstanding in `HISTORY.md` exactly as the Phase 5 to 7 GPU criteria are.
- Node/headless: the static beat above. Breaks: unhook the E button's handler
  (`tap on E at the word-lock opened no riddle`); hide the touch HUD's media
  query (`touch HUD not shown under a coarse pointer`); leave the document
  `click` handler unguarded and dispatch a touch on the stick while a dialogue
  is open (`a stick touch advanced the dialogue`). The third is the one that
  matters: it is the bug that will otherwise ship.
- Desktop unchanged: every existing suite green with no touch emulation, and
  `play-castle.mjs`'s pointer-lock assertions still pass.

### Open calls

- **Auto-detect or a toggle?** Recommend **detect, with a toggle on the start
  panel** so a laptop with a touchscreen can pick. Detection alone gets the
  hybrid case wrong in both directions.
- **Look on the right half, or drag anywhere not on the stick?** Recommend
  **right half**. Simpler, and the E button lives there too.
- **Gyroscope look?** Recommend **no** for this row; it needs a permission
  prompt on iOS and a second code path.
- **Lower the render load on a phone?** `setPixelRatio(min(dpr, 2))` and
  2048 shadow maps are laptop numbers. Recommend **`dpr` capped at 1.5 and
  shadow map 1024 when touch is active**, recorded as a number to revisit.

### Dependencies

- None to start. Rewrites `player-controller.js`, which sound edited for the
  footstep accumulator (#519); that has shipped, so nothing is in its way.
- Verification on a real phone is **The GPU run**'s class of problem: Devon's
  device, not a session's.

### Constraints

- #53 (movement by stick is a real-time assertion; the CI beat is static).
- #488 (overlays already scroll; keep `safe center`).
- #34 (three breaks above; the stick-advances-dialogue one is the guard that
  earns its place).
- No new asset; #493 untouched.

---

## The texture sets

**Rank 5. Size ½.** The castle is dressed in ten sets and reads as one: 27 of
31 runs are `castle_wall_slates`, all eight drums `defense_wall`, every upper
floor `wood_planks`. #516 gave each drum a `tint` over the same maps, which is
free and is not a second stone. This row is the second stone. It was meant
to be part of the wayfinding PR (#7) and was not, because the container that
PR was built in answers 403 to Poly Haven and to KTX-Software's release page
(#518): it can reach npm and nothing else, and `ktx` is not on npm.

### Scope

- **Four CC0 sets at 1k, `diff`, `nor_gl`, and `arm` or `rough`, never
  both (#437):**
  - `medieval_blocks_02` for the inner ward's runs (the King's Hall, the
    steward's chamber, the cross-wall's inner face): dressed ashlar against
    the outer ward's rubble slates.
  - `castle_brick_02` for the four inner drums, so a tower tells you which
    ward you are in before its tint does.
  - `plastered_wall_04` or `plaster_wall_02` for the level-1 rooms' interior
    partitions and the royal apartments: lime plaster upstairs, stone below.
  - `wood_floor_deck` or `wooden_planks_02` for the tower first floors, so
    the walk's decking and a tower room's boards are not one plank.
  Exact names are whatever Poly Haven lists that day; the four roles are the
  row.
- **`tools/encode-assets.mjs`** encodes them in place and rewrites the paths
  `data/scene-config.json`'s `materials` needs (#506). The jpgs are not
  committed.
- **`data/scene-config.json`:** four `materials` entries, referenced from at
  least one run, drum or room each in the same commit (#390; `test/assets.mjs`
  check 4 fails an unreferenced Poly Haven byte). Runs, drums and rooms take
  `material` today and `tint` since #516; nothing new in the schema.
- **`src/`:** nothing. `loadPBRMaterial` reads whichever of `arm` and `rough`
  the set ships.

### Acceptance

- `test/assets.mjs`: the four sets referenced and complete, every file
  `.ktx2`, no jpg or png under `assets/poly-haven`. Break: reference a set
  without encoding it; `built.mjs` fails `neither asked for a jpg or a png`.
- `test/built.mjs`: `dist/` under 200 MB (#499); expect about 12 MB more.
- `plan-vs-scene.mjs`: no change; a material is not a box.
- GPU: the inner ward reads as a different build from the outer. Ranked row
  3's run.

### Open calls

- **Which four.** The roles above; recommend the first name listed for each
  and no agonising.
- **Tint on top of a new stone, or one or the other?** Recommend **both**:
  the inner drums keep their warm tints over the new brick.

### Dependencies

- A machine with `ktx` on PATH. Devon's Windows machine has it (#506). Not
  this container (#518).

### Constraints

- #506 (encode before commit; originals are git history), #437, #390, #503
  (no spaces in paths), #499.

---

## The town side

**Rank 6. Size 1.** The ground is the curtain's footprint plus a 2 m margin,
worked out from the placed stone (#436); beyond it is fog from 30 to 150 m.
`barbican-west` has no archway and PLAN.md's answered question 5 says both
barbican gates stay shut forever. The spawn is in the barbican facing east. So
today the outside is visible from the west walk and from the North-west and
South-west Towers' roofs (#523). The row: a textured ground outside the west barbican,
a road, and "a different ending".

### Scope

- **`assets/poly-haven/forest_ground_06_1k.gltf/textures/`, restored.** The set
  is in this repo's history: the subtree split carried it, and
  `git log --all --diff-filter=D --name-only` lists
  `assets/Poly Haven/forest_ground_06_1k.gltf/textures/forest_ground_06_{diff,nor_gl,arm}_1k.jpg`.
  Restore `textures/` only (#390: the `.gltf` and `.bin` beside it are a
  preview ball), move it under the renamed `assets/poly-haven/` (#503), and
  declare it in `materials` with `arm`, not `rough`, because that is what the
  pack ships (#437). Roughly 2 to 3 MB by the sibling sets.
- **`data/scene-config.json`.** `ground` grows an `outside` list (or `patches`
  learn to lie outside the base): a `forest_ground_06` rectangle from the
  curtain's west face out to the fog, and a `stone_pavers` or
  `grassy_cobblestone` road 4 m wide running west from the barbican's west
  face and fading into the fog. A few `tree-large.glb` from the kit as
  placements beside the road, since `courtyard.placements` already places kit
  pieces anywhere in tile coordinates.
- **`src/castle-plan.js`.** `grounds` is derived from the curtain; the outside
  pieces are further `ground` pieces with `patch: true` at `y` 0 and surfaces
  like the rest. `walkability`'s grid bounds expand to every surface, so the
  grid grows by the outside area (a 60 x 60 m patch is 14,400 more cells at
  0.5 m, tens of milliseconds).
- **`data/mystery.json`.** The "different ending": the verdict epilogues
  (`accusation.verdicts.*.epilogue`) can name the road the inspector rides in
  on; three or four sentences, content only. Optional.
- **`test/assets.mjs`** sees a new complete set and every file referenced,
  automatically. **`test/layout.mjs`** check 4 (`sealed()`) is the constraint
  below.

### Acceptance

- From the west walk, looking west over the parapet: ground, a road, trees,
  fog. GPU for the look; `plan-vs-scene.mjs` for the boxes (every outside
  piece within 0.01 m).
- `layout.mjs` check 4 still passes: **nothing reachable outside the curtain**.
  The outside ground is a surface the fill never reaches because no opening
  leads to it. Break: cut a doorway in `barbican-west`; `sealed()` fails with
  `the castle leaks: N reachable cells outside the curtain ... stepped through
  at (-46.25, ...)`. That break proves the outside ground is walkable floor
  that the wall, not the absence of floor, keeps the player off, which is the
  claim.
- `assets.mjs`: the three restored files referenced (`material
  forest_ground_06's diffuse` etc.), and the set complete. Break: restore the
  set without the material entry; check 4 lists the three files.
- New in `layout.mjs`: every outside ground piece lies wholly outside the
  curtain box and touches the base box (no gap between the castle's ground and
  the world). Break: move the forest patch 3 m west; the line names the gap.

### Open calls

- **Open the barbican's west face?** Recommend **no**. It reverses answered
  question 5, breaks `sealed()` by design, and the mystery's clue graph rests
  on the porter's gate being the one logged crossing at ground level with the
  world sealed around it. A road you can see and cannot take is the brief's
  "hard edge" made into a picture; a road you can walk is a new ward. If Devon
  wants the ending to walk out, that is its own row with a new curtain rule.
- **How far out?** Recommend **to the fog's far, 150 m, west only**, and 40 m
  north and south of the road's line. Anything the fog hides is bytes drawn
  for nobody.
- **Road material.** No road set is on the list. Recommend
  **`grassy_cobblestone`** (a cart track through grass) over pavers, which
  read as a courtyard.
- **Change the epilogues?** Recommend **one sentence in `nobody` and `full`**,
  the two endings that mention the inspector's arrival, and nothing else.

### Dependencies

- **The restored jpgs go through `tools/encode-assets.mjs`** (#506, shipped)
  before they
  are referenced.
- The four tower roofs (#523) make this visible from four more places.

### Constraints

- #390 (restore `textures/` only, reference in the same commit).
- #437 (`arm` and `rough` are different images; this pack is `arm`).
- #503 (no spaces: the restored path is renamed on the way in).
- #436 (the base is derived from the curtain; the outside pieces are added
  beside that derivation, not by widening the margin, which would move the
  base's `plan-vs-scene` box for every existing check).
- #500 and #34 as above.
- #499: about 3 MB against 158 MB of headroom.

---

## A second day

**Rank 7. Size 2+.** The save has `watch` and `accusations[]`. The engine's
`ring()` stops at the fourth bell and `accuse()` records a verdict; the epilogue
pane's one button is `restart`, which erases the save and reloads. The content
for a day two does not exist. This section is about the first increment, what
it must contain to be a day two at all, and what it leaves.

### What a day two is, minimally

The epilogue tells the true account. A second day is walking the castle the
morning after and seeing the consequences stand there: the man who hanged is
gone from his station; the Steward is in his chamber or taken; the inspector
has arrived; Nest is at the laundry or at the gallows foot. That is what
"the epilogue's consequences play" means at its smallest: **one watch, no
clues, no bell, no accusation, a cast whose stations and lines depend on the
verdict class and who hanged, and a thirteenth person who ends it.**

### Increment 1: the morning after

Scope:

- **`data/mystery.json`.** A `day2` block: one watch id (`lauds`); a
  `schedule` per npc for it (a station or `null`); an `absent` rule that the
  engine applies at runtime (whoever `accusations.at(-1).who` names is `null`
  on day two; in `full`, the Steward too); `lines` per npc for day two keyed
  by verdict class with a `default`, so twelve entries carry one set and the
  three or four whose morning differs (constable, laundress, apprentice,
  steward) carry more. A thirteenth cast entry, `inspector`, `King.glb` with a
  tint, whose conversation is the terminal.
- **`data/quest.json`.** The four terminal stages stop being terminal: each
  gains `on: "day:2"` to a new `morning` stage whose `enter` is `applyDay`
  (a new manager action) and whose one transition is `talked:inspector` to
  `end`, terminal, `showEpilogue` (the same pane, with the inspector's
  summary). `validateQuest` already allows several terminals and checks
  reachability.
- **`src/mystery.js`.** `state.day` (1 or 2), `beginDay2()` returning the
  stations and lines for the recorded verdict, `stationOf`/`available` reading
  the day. `validateMystery` grows: every day-two station passes the same five
  nav rails as day one (floor, room, clearance, reachable, walkable from the
  Vespers station), every npc has day-two `default` lines, every verdict class
  in `verdicts` has an inspector line, and the hanged man's day-two station is
  never asked for.
- **`src/save.js`.** `SAVE_VERSION` 2, `day` in the schema, `migrate` from 1
  adds `day: 1`, `repair` clamps `day` to 1 or 2 and resets a `day: 2` save
  with no verdict in `accusations` to day 1. Key unchanged (#36).
- **`src/quest-manager.js`.** `applyDay` action; the epilogue pane's button
  becomes "The next morning" when a day two exists and the verdict allows it,
  and `restart` moves to the end-of-day-two pane.
- **`src/ui.js`, `index.html`.** The second button; the watch label reads
  `Lauds`. The tracker's objective comes from the stage as now.
- **`src/main.js`.** `onWatch` already places the cast from `nav.at`; it needs
  the day-aware station lookup and to hide `null` stations, which it does.
- **`test/mystery.mjs`.** Drive every verdict class into day two and assert
  the hanged man is absent, the inspector is present, and a talk with the
  inspector ends the graph. Validator breaks: give the hanged Clerk a day-two
  station (`clerk: has a station at lauds and hangs in right, wrong-clerk,
  full`); drop the inspector's `fall` line (`inspector: no line for verdict
  fall`).
- **`test/save.mjs`.** A version-1 save loads through `migrate` with `day: 1`;
  a `day: 2` save with no verdict repairs to day 1. Break each rail as the file
  already does, section 10 style.
- **`test/quest.mjs`.** The intended path to `full`, then the button, then day
  two to `end`. Break: unhook `applyDay`; `the morning opens with nobody
  moved` fails.
- **`test/plan-vs-scene.mjs`** or `layout.mjs`: day-two stations stand on floor
  (the nav rails in the validator cover it in Node; no browser beat needed).
- **`test/play-castle.mjs`.** Two beats after the epilogue: the button, and the
  inspector.

Acceptance for increment 1: a player who reaches any of the seven verdicts can
press one button, wake at Lauds, walk the castle, find the cast where the
verdict put them with one conversation each, meet the inspector, and end. All
suites green; the row stays in the table with its text rewritten to say
increment 1 shipped and what is left.

### What increment 1 leaves, in order

1. A second mystery for day two (the inspector's audit; the missing 128 sheets
   as evidence the player can find in the town, which needs **The town side**'s road to
   be walkable, which it is not).
2. Bells on day two, and a schedule with more than one watch.
3. Consequences that change the castle, not only the cast: an empty cell, a
   shut muniment room, the cart gone.

### Open calls

- **A `day` field, or eight watches?** Recommend **a `day` field**. `watches`
  is asserted to be exactly four in `validateMystery`, `ring()`'s fourth is the
  demand, and every rail about "two to three watches" is written against one
  day. Eight watches would rewrite the mystery's own rails to say nothing.
- **Version bump to 2, or keep 1 and let `repair` default `day`?** Recommend
  **bump to 2 with `migrate`**. #37: `migrate` is for version drift and this is
  drift. #413 said the schema was complete so no phase adds a field; a second
  day is not a phase of the plan, it is the thing after it, and the honest
  record is a version number.
- **Who is the thirteenth?** Recommend **the King's inspector**, on `King.glb`
  with `hideMaterials: ["Gold"]` and a tint nobody has. He is named in the
  first line the Constable speaks and in five of the seven epilogues.
- **Does the hanged man have a body on day two?** Recommend **no station,
  hidden**, not a corpse at the Stockhouse Tower. A gallows is a new asset and
  a tone decision that is Devon's.
- **Content volume for increment 1.** Twelve default sets of 2 lines, four
  npcs with 3 to 5 variant sets, seven inspector lines: about 60 lines. That is
  the writing job before the code job, as the brief says, and it is bounded.

### Dependencies

- None, but **do not run alongside anything else that touches `save.js`** (no
  other row does today).
- **The texture sets** do not block: the road is scenery in increment 1.

### Constraints

- #36 and #413 (key unchanged; version and schema move through `migrate`).
- #37 (`repair` every load; `day` clamped and made consistent with
  `accusations`).
- #39 (assert against the DOM for what just happened, the save for what a
  reload survives: the day-two button is a DOM assertion, `day: 2` surviving a
  reload is a save assertion).
- #423 and the two-to-three watch rails are day-one rails and stay day-one.
- #481 (every line the HUD can say is data and required by the validator: the
  inspector's seven lines are `ui`-class content).
- #34 throughout.

---

## The hall covering

**Rank 8. Size ¼.** #527 put seven trusses across the Great Hall at 8 m and
#528 left the space between them open, because neither half of a covering can
be judged from this container. This row is both halves, for a session with a
GPU.

### Scope

- **`data/scene-config.json`.** Kit `roof*.glb` pieces over the trusses, as
  `courtyard.placements` with `roofs: "great-hall"`, `noCollide: true` and a
  per-axis `scale` — all three already exist (#527). The hall is 28 x 8 m, so
  a 4 m module is 7 x 2 pieces; which piece and which way it slopes is the
  question, and it is answered by rendering one and looking.
- **Two `doorway` entries on `great-hall-north` at `base` 5**, the way Lady
  Alys's window is written (#453). `runBoxes` cuts them already and each cut
  adds a sill surface, which `data/sounds.json` already answers for.
- **Nothing in `src/`.** `layout.mjs` check 14 holds a covering exactly as it
  holds a truss.

### Acceptance

- Check 14 green with the covering in place, and broken once more on it.
- A screenshot from inside the hall at Vespers, and a **luma read off the
  floor** the way #438 read the wall. Under about 25 of 255, a second brazier
  at the hall's east end is one config line, and the windows are the other
  lever.
- The south walk still walkable end to end (`layout.mjs` 6b).

### Open calls

- **Which roof piece.** `roof.glb`, `roof-side.glb`, `roof-high-side.glb` and
  `roof-edge.glb` all measure 1 x 1 x 1 (or 1 x 0.5 x 1) with every part
  filling the same box, so the kit's own screenshots or one render answer this
  and nothing in Node can.
- **Windows first, or the covering first?** Recommend **the covering first,
  then measure, then the windows if the number says so.** Two windows added
  against a hall that turns out to be bright enough are two holes in a wall
  for nothing.

### Dependencies

- **The GPU run** is what unblocks this; both criteria are a render.

### Constraints

- #427 (`noCollide` is all or nothing).
- #438 (measure the pixel).
- #411 (kit for shapes the maps lack).
- #53, #528 (what a covered hall looks like is not a CI question).
