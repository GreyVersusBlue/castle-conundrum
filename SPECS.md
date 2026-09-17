# SPECS

A spec per ranked row in `BACKLOG.md`. **`BACKLOG.md` ranks; this file says what
each row is, in the detail `PLAN.md` gave the seven phases and the backlog rows
never got.** `HISTORY.md` is still the only record: nothing in here is a locked
decision. Every "recommendation" below is exactly that, and the session that
ships the row is the one that records the call with a number.

Written 2026-09-15 against `main` at `bb61958`, from the code and data as they
are, not from the briefs. **Rows shipped since and their sections are gone:
asset compression (#506 to #510), sound (#519 to #522), the tower tops
(#523 to #526), the hall's roof frame (#527, #528), the two plan suites (#529),
touch (#530 to #532), the texture sets (#541 to #545), the town
side (#546), and the lore row (#551 to #555).** What asset
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
- **The nine suites are `npm test`; `npm run play` is not** (#53). A row whose
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
- **AND FOUR THINGS THIS SESSION ADDED THAT ONLY A RENDER CAN JUDGE**, each
  worth a shot and a sentence in `HISTORY.md`:
  - **A tower roof from 12 m** (#523). Four of them, reached up a third flight;
    the view over the whole plan is the thing the row was for and nothing in CI
    can see it. Stand on the North-west Tower's roof and look east.
  - **Seven trusses over the Great Hall** (#527). Whether
    `structure-cross.glb` stretched to 0.5 x 2.5 x 7.25 reads as a hammerbeam
    or as scaffolding is the open question, and the answer decides whether the
    covering row (rank 7) is worth taking at all.
  - **A phone** (#530). The stick throw, the sprint threshold, the look rate,
    the E button's size and the two render numbers are all guesses. One session
    with a real thumb settles six constants.
  - **A luma read off the Great Hall's floor** the way #438 read the wall, for
    the covering row's baseline: what the hall measures OPEN is the number the
    covered hall has to be compared against.

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

## A second day

**Rank 6. Size 2+. Increments 1 and 2 shipped on 2026-09-15 and 2026-09-16
(#533 to #540, PRs #16 and #18).** The morning after exists and the castle
knows about it: one watch (`lauds`), thirteen stations, sixty line sets keyed
by what the player said, seven closing panes, a thirteenth cast entry whose
conversation ends the game, and three rows of stone that move depending on
which of the seven endings was reached. What follows is what shipped, then
increment 3, which is the next one to take.

### What increment 1 shipped (PR #16, #533 to #538)

- **`data/mystery.json`** grew a `day2` block: `watch` (`lauds`, deliberately
  not in `watches`), `ends`, `absent`, `schedule`, `lines` (keyed exact ending
  then verdict class then `default`) and `endings`.
- **`data/npcs.json`** grew a thirteenth `cast` entry, `inspector`, with
  `arrives: 2`. **`data/quest.json`**: the four verdict stages stopped being
  terminal and gained `day:2` to `morning`, whose one way out is
  `talked:inspector` to `end`.
- **`src/mystery.js`**, **`src/stations.js`**, **`src/save.js`** (version 2 and
  a `day` field), **`src/quest-manager.js`**, **`src/ui.js`**, **`src/npc.js`**
  (`get active()`, #538) and **`data/scene-config.json`** (a `lauds` sky).

### What increment 2 shipped (PR #18, #539 and #540)

- **`data/mystery.json`** grew `day2.castle`: rows of `{piece, set, when?,
  unless?, why}` naming a `planId` and one of `DAY_SETS`' verbs. It is here and
  not in `scene-config.json`, which overrules this file's own earlier
  recommendation; #540 says why.
- **`src/castle-plan.js`** exports `DAY_SETS` and `collidersWith(plan,
  changes)`, and `walkability` takes a `colliders` list.
- **`src/castle-builder.js`** grew `applyDay(changes)`, `setPieceVisible` (the
  general form of `setEvidenceVisible`) and `shutLeaf` (the inverse of
  `openLock`, which the second day is the first thing ever to need).
- **`src/quest-manager.js`**'s `_applyDay` hands the builder rows already
  resolved for the ending; `handleLock` stops examining a re-locked door on day
  two. **`src/main.js`** exposes `window.__castle`.
- **Suites**: `test/layout.mjs` holds the whole overlay to "the morning after
  is never a smaller castle" and counts each row's stone against the plan;
  `test/mystery.mjs` carries nine `day2.castle` validator breaks;
  `test/quest.mjs` asserts two endings hand the builder two different rosters;
  `test/plan-vs-scene.mjs` watches a piece and its collider go and come back,
  and a leaf shut, opened and shut again; `test/play-castle.mjs` walks into the
  cell.

### Increment 3: a second mystery for the morning

The next one, and it is the biggest of the three. The inspector asks questions
the player cannot answer, and increment 3 is where some of them become
answerable: the missing 128 sheets as evidence that can be found, the gaol
roll's dates, the passes in the Steward's hand. Two of the three want something
this repo has not got.

- **It needs a town to walk to.** The lead is in Thomas Wykes's yard and the
  yard is outside the west barbican. The town side shipped (#546): there is
  ground, a road and fog past the barbican now, but nothing built on it —
  Thomas Wykes's yard itself, and whatever stands in it, is still increment
  3's to place.
- **It needs bells on day two**, or a single-watch mystery, which is the one
  design question worth settling first. A second day with more than one watch
  has to argue with #533 rather than work around it: `watches` is four because
  `ring()`'s fourth is the Constable's demand and both length rails are written
  against one day. The cheapest shape that does not is `day2.watches`, its own
  list, with the engine reading whichever list the day says.
- **What does not need either**: the gaol roll. It is a piece of evidence in a
  room the castle already builds, it convicts nobody, and its whole content is
  the dates that were in front of everybody and that nobody read. It is the one
  thread of increment 3 a container can finish.

### What is left after increment 3

1. **Somebody looks at a Lauds sky.** The five numbers in
   `lighting.watches.lauds` were written against the four already there and
   checked by nothing but the four (#53). It belongs to **The GPU run**.
2. Consequences on the third day, which nobody has asked for.

### Dependencies

- Increment 3's town half no longer waits on Poly Haven access (#546); it
  waits on someone placing Thomas Wykes's yard on the ground the town side
  built.
- **Do not run alongside anything else that touches `save.js`.**

### Constraints

- #36 and #413 (key unchanged; the version moved to 2 in increment 1).
- #37 (`repair` every load).
- #39, #481, #34 throughout.
- #533: a second day is a `day` field and `watches` is four. A fifth bell has to
  overturn that decision rather than work around it.
- #535: there is no body at the gallows, and a gallows is Devon's call.
- #539: an overlay may only ever give the player castle, never take it away.
  Every verb that could is refused against the plan, and `test/layout.mjs`
  holds the property.
- #540: the overlay lives in `mystery.json`, because what decides it is the
  verdict.

---

## The hall covering

**Rank 7. Size ¼.** #527 put seven trusses across the Great Hall at 8 m and
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
