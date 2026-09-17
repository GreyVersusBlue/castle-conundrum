# SPECS

A spec per ranked row in `BACKLOG.md`. **`BACKLOG.md` ranks; `ROADMAP.md`
orders; this file says what each row is, in the detail `PLAN.md` gave the seven
phases and the backlog rows never got.** Each section's Dependencies below is
where `ROADMAP.md`'s gates and lanes came from (#600 to #602); where this file
and that one differ, this one was written against the code and wins. `HISTORY.md` is still the only record: nothing in here is a locked
decision. Every "recommendation" below is exactly that, and the session that
ships the row is the one that records the call with a number.

Written 2026-09-15 against `main` at `bb61958`, from the code and data as they
are, not from the briefs. **Seven sections below, ranks 6 to 12, came in on
2026-09-17 as eight, from `WISHLIST.md` as it stood that day rather than from
code, because the systems they describe (`data/populace.json`, `data/quests/`,
the placement editor) did not exist yet.** Each names a first increment rather than
the whole theme, the way the depth rule below already treats a 2+ row, and
`WISHLIST.md` is the source for everything past that increment: this file does
not repeat what it already says. **Rows shipped since and their sections are gone:
asset compression (#506 to #510), sound (#519 to #522), the tower tops
(#523 to #526), the hall's roof frame (#527, #528), the two plan suites (#529),
touch (#530 to #532), the texture sets (#541 to #545), the town
side (#546), the lore row (#551 to #555), what was left of that row,
the sermon and the song, with #592 to #596, and the fourth body with #603 to
#606.** **The ranks below start at 2 and that is not a gap**: rank 1 shipped
on 2026-09-17 and its number was retired rather than shifted up, because
renumbering eleven rows across three files while four wave A sessions were
running is a conflict in every table line (#610). What asset
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
- **The ten suites are `npm test`; `npm run play` is not** (#53). A row whose
  proof needs a real-time walk or a look at a render has a GPU criterion nobody
  in a session can meet. Every row below also names a Node or headless criterion
  so the row is not blocked on hardware.
- **The save key is `castleConundrumSave_v1` and stays** (#36, #413). Schema
  changes go through `migrate` with a version bump; `repair` runs on every load
  (#37).

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
- **AND FIVE THINGS LATER SESSIONS ADDED THAT ONLY A RENDER CAN JUDGE**, each
  worth a shot and a sentence in `HISTORY.md`:
  - **A tower roof from 12 m** (#523). Four of them, reached up a third flight;
    the view over the whole plan is the thing the row was for and nothing in CI
    can see it. Stand on the North-west Tower's roof and look east.
  - **Seven trusses over the Great Hall** (#527). Whether
    `structure-cross.glb` stretched to 0.5 x 2.5 x 7.25 reads as a hammerbeam
    or as scaffolding is the open question, and the answer decides whether the
    covering row (rank 5) is worth taking at all.
  - **A phone** (#530). The stick throw, the sprint threshold, the look rate,
    the E button's size and the two render numbers are all guesses. One session
    with a real thumb settles six constants.
  - **A luma read off the Great Hall's floor** the way #438 read the wall, for
    the covering row's baseline: what the hall measures OPEN is the number the
    covered hall has to be compared against.
  - **The gaol roll on the guardroom barrels** (#571). A fifth, added on
    2026-09-17. `npm run play` does not enter the North-west Tower and no beat
    was written for it, so this one is a detour rather than a beat: walk into
    the guardroom, press E at the roll, and look at whether a 0.4 x 0.3 m
    parchment slab resting 3 mm over a pair of barrels reads as a roll on a
    barrel-head or as a box floating over one. It is the first built slab in
    the castle whose support is another prop rather than floor or stone, and
    `test/layout.mjs` check 1d can only say that something is under it, never
    what it looks like.

### Acceptance, the run

- `npm run play` exits 0 on a machine with a GPU, or exits non-zero with the
  failing beat named and filed as a new backlog row.
- `shots/play/` contains the numbered set, `twelve-at-vespers.png` among them,
  and a human has looked at it and written one sentence per body: told apart
  or not. That sentence is the answer to Q53's risk and is the fourth body's
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
- The fourth body (rank 1, shipped #603) is still owed the run's photograph:
  nobody has seen Marged, Nest or Lady Alys in the castle (#606). It is this
  row's to take.

### Constraints

- #53 (the whole point of the row).
- #504 (if `og:image` moves, that is the line to change, and the crawler fetch
  is not a page fetch so #493 does not bind either way).
- #34 does not apply to the run (no rail added); applies to the images'
  `built.mjs` line if they move here.

---

## A second day

**Rank 4. Size 2+. Increments 1 and 2 shipped on 2026-09-15 and 2026-09-16
(#533 to #540, PRs #16 and #18), and increment 3's gaol roll on 2026-09-17
(#571 to #575).** The morning after exists, the castle knows about it, and
it now knows one thing about the player as well as about the verdict: one
watch (`lauds`), thirteen stations, sixty line sets keyed by what the player
said and three keyed by what he read, seven closing panes, a thirteenth cast
entry whose conversation ends the game, and three rows of stone that move
depending on which of the seven endings was reached. What follows is what
shipped, then what is left of increment 3.

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

### What increment 3's gaol roll shipped (#571 to #575)

The third of increment 3's three threads, and the only one that waited on
nothing. **`data/mystery.json`**: a `gaol-roll` evidence row in `guardroom`
at all four watches and three clues behind it — `gaol-dates` (E, the roll),
`prisoner-inside` (D, on `gaol-dates` and `prisoner-story`) and
`prisoner-forge` (S, contradicting `merchant-stone`) — plus a ninth press,
`prisoner` `default` to `forge`, keyed on the deduction rather than on the
roll so that a press cannot cost the player Madoc's own default statement
(#572). Not one of the three convicts anybody and `convicts.prisoner` is
still `[]` (#571). **`data/npcs.json`**: Madoc's `forge` lines.
**`data/scene-config.json`**: a parchment `builtProps` slab on the guardroom
barrels, base 0.79 over their 0.787. **`src/mystery.js`**: `day2.knew`, the
first thing on the second day keyed by what the player found rather than by
what he said (#573), with nine validator rails; `changeApplies` is
`appliesTo` and the `when`/`unless` grammar is shared with `day2.castle`.
**Suites**: `test/layout.mjs` check 1d, no built slab hangs in mid-air
(#574); `test/mystery.mjs` section 7, the roll walked end to end and two
players with the same verdict and different journals.

### Increment 3: what is left

Two threads, and both want something this repo has not got.

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

- **And it inherited a fact that changes** (#596). The lore row closed with
  one piece unbuilt and this is where it went: a `since` field on a fact in
  `data/lore.json`, and a rumour about what the player did on day one, so that
  the canon can say something different on the morning after. It needs
  second-day state to be about, which is why it was never rank 8's to start;
  `day2.knew` (#575) and the seven endings are that state. The shape to beat:
  a fact carries `since: {ending?, knew?}` with the same `when`/`unless`
  grammar `day2.castle` and `day2.knew` already share, and `validateLore`
  refuses a `since` naming an ending or a clue the mystery has not got. What
  it costs is one more pool for the caption band (#592) or one more line set;
  it does not need a new UI.

Both of the threads above now have somewhere to put "the player found this
out", which neither had before `day2.knew` (#575): a lead found in the yard is
a clue, and a clue is what a `knew` row is keyed on.

### What is left after increment 3

1. **Somebody looks at a Lauds sky.** The five numbers in
   `lighting.watches.lauds` were written against the four already there and
   checked by nothing but the four (#53). It belongs to **The GPU run**.
2. Consequences on the third day, which nobody has asked for.

### Dependencies

- Increment 3's town half no longer waits on Poly Haven access (#546); it
  waits on someone placing Thomas Wykes's yard on the ground the town side
  built.
- **Do not run alongside anything else that touches `save.js`.** The gaol
  roll did not have to: the journal day two reads is `state.clues`, which the
  save already carried, so the key and the version did not move (#571, #573).

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
- #571: the gaol roll convicts nobody and does not refuse an accusation. A
  later thread that makes it block one has to overturn that rather than add
  to it, because three refusals end the day as a fall and reading the roll
  would then be punished.
- #573: a `day2.knew` row may replace a line set and may never be the only
  one. Every reachable ending still resolves through the key/class/default
  cascade with no journal at all, and `src/mystery.js` validates it that way.

---

## The hall covering

**Rank 5. Size ¼.** #527 put seven trusses across the Great Hall at 8 m and
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

---

## Life: a populace

**Rank 6. Size 2+.** `WISHLIST.md` theme 1. **The first increment shipped on
2026-09-17** (#607 to #609) and this section is what is left of the row.

### What shipped

- **`data/populace.json`, ten people, and `src/populace.js`.** A routine is a
  ring per bell — one LIST of `{room, tile, activity, facing?}` per watch,
  walked round until the next bell — rather than one station per bell, because
  the clock does not move between bells (#547, answer 3). `validatePopulace`
  asks the twelve's own five nav questions plus every leg of the ring and the
  wrap back to its first stop, and it checks the room with `roomAt` rather
  than `inNamedRoom`, which is the one place it is stronger than the
  schedule's: six of the ten stand in open ground, where `inNamedRoom` answers
  null. `test/mystery.mjs` owns it (#529) and rejects thirteen breaks.
- **Nine activities onto three clips**, all of them idle variants every body
  already ships, so no asset and no clip was added. `ACTIVITY_CLIPS` in
  `src/populace.js` is the table and `npc.js`'s `playActivity` reads it.
- **`label` on an interaction target** (#608): a populace body shows a name
  and a role on the HUD, E at one does nothing, and a label never takes the
  prompt off a suspect standing behind it.

### Scope, the next increment

- **The other forty.** `data/populace.json` takes them with no schema change;
  what it needs is places for them to stand, and `roomAt` plus the walk grid
  will refuse any tile that is not one. The two wards, the three upper floors
  and the two wall walks carry more than ten, and rank 9's town is where the
  rest go.
- **Ambient talk.** `data/npcs.json`'s 27-pair chatter pool, spent once two
  populace bodies are within 3 m at one bell. The `gossip` activity already
  marks the stops that are for it: the baker's lad and the well-wife stand
  2 m apart in the outer ward at Sext and say nothing.
- **Clips.** `sweep`, `stir`, `hammer` and `spar` are the four `SPECS.md`
  deferred and they are still deferred: the Quaternius kit has none of them.
  This is the half of the row that trades with **Bodies** (rank 10) in both
  directions, and neither strictly gates the other.
- **Cost.** Instanced meshes and animation LOD. Ten skinned bodies needed
  none of it; fifty will, and **The tooling**'s budget suite (rank 12a) is
  what will say when.

### Acceptance, the next increment

- Whatever the populace grows to, `validatePopulace` still finds nothing and
  `test/mystery.mjs` still rejects every break in its list. A new activity is
  a new row in `ACTIVITY_CLIPS` and the clip check against the `.glb` files
  is what says the clip is real.
- Ambient talk: a pair of populace bodies within 3 m at one bell says a line,
  and a headless assertion in `test/plan-vs-scene.mjs` reads it off the DOM
  the way the performance captions are read (#592).

### Open calls

- **Where the forty stand, before rank 9.** The castle as built has room for
  perhaps twenty more without crowding. Recommend **stopping at twenty until
  the town exists**, rather than packing bodies into the wards to hit a
  number; the row is about whether the castle reads as lived in, and a
  courtyard of people standing 1.5 m apart reads as a queue.
- **Whether `garden` should be made real** (#609). `mystery.json` lists it and
  nothing in the castle resolves to it: the 93 walkable cells east of the east
  gate are all inside the Chapel Tower's or the King's Tower's disc. It is
  either ground somebody builds — rank 4c's yard is the nearer precedent — or
  a room id that should come out of the file. Not this row's call, but this
  row is where it was found.

### Dependencies

- **Two of rank 8's seven errands wanted somebody from this file** and have
  one now.
- **Rank 10** is what unblocks the four deferred activities.
- **Lanes C and D still**: `data/npcs.json`'s `cast` is read to check ids and
  tints against, and `src/main.js` spawns the ten beside the twelve.

### Constraints

- #500 (a populace stop is not a plan piece and has no `planId`; `populace.js`
  says so in its own header).
- #13, #34 (the validator exits non-zero, and every rail it adds has been
  broken on purpose — including one that had to be rewritten because the
  first version passed with the bug back in, #607).
- #529 (the check belongs with `mystery.mjs`).

---

## Sound: a soundscape

**Rank 7. Size 1.** `WISHLIST.md` theme 2. **The first increment below
shipped on 2026-09-17** (#620 to #623): `data/sounds.json` carries the
footstep, the chapel bell (#519, #522) and an `ambient` block of seven
synthesised beds; `src/audio.js` has `bedOf` and the cross-fade;
`test/layout.mjs` check 13 and a section of `test/map.mjs` hold them. The
zone list below was written before anybody counted: the castle builds no forge
and has no rain, and the garden cannot be stood in (#469), so none of the
three has a bed (#621). Scope and Acceptance are kept as written, as the
record of what was asked for.

**The next increment is a bed at a point.** A `PannerNode` per sounding bed at
its room's centre off the plan, the way `bellAt` already places the bell, with
the nearest few beds sounding at once rather than one; open ground stays in
the head. The Node criterion is that every bed-bearing room yields a point
inside its own bounds; the rest is ears (#53). After it, the bells, which
Dependencies below already describes.

### Scope

- **`data/sounds.json` grows an `ambient` block**: one bed per zone (kitchen,
  forge, chapel, wall walk, outer ward, rain), each a set of oscillator/noise
  parameters in the same shape `steps.classes` already uses, or a named CC0
  file once #548's reversal has one to name. Either way the file is the only
  place the sound is tuned, per the existing pattern.
- **`src/audio.js`** gains the cross-fade: on the room change the HUD already
  computes (#515), fade the outgoing zone's bed down and the incoming one up
  over about a second, rather than cut.
- **Recorded audio, if used**, is named by `data/sounds.json`, swept by
  `test/assets.mjs` for reachability the way a glTF is (#390), and given a
  codec (Opus in Ogg, #506's recommendation) by `tools/encode-assets.mjs`
  before it is committed. No file lands uncompressed.

### Acceptance

- `test/layout.mjs` gains a check that every zone the plan knows has an
  `ambient` entry naming it, the way check 12 already holds every surface to
  a footstep material. Break: add a zone to the plan without an entry; the
  check should name the zone.
- `npm run build` and the existing ten suites stay green; a recorded file (if
  any landed) shows up in `test/assets.mjs`'s reachability sweep and in
  `tools/encode-assets.mjs`'s output the same commit it is added, per #390.
- The actual sound is a `npm run play` question (#53): this row's Node
  acceptance is that a bed is *assigned and cross-faded*, not that it sounds
  right, the same split rank 11 draws for a shadow.

### Open calls

- **Synthesised or recorded, per zone, right now.** Recommend **synthesis
  first for every zone in this increment**, matching `steps` and `bell`'s own
  precedent, and let a recording replace one only once #548's licence
  question is actually answered for a specific CC0 file — "a sound stays
  synthesised until a recording beats it" is `WISHLIST.md`'s own line.
- **Event sounds (door, bark, hammer strike)** are named in the theme but are
  the increment after this one: they want an activity clip to sync to, which
  is rank 6's to add first.

### Dependencies

- **`data/sounds.json`'s existing `byMaterial`/`byKind` map and #515's room
  tracking** are both shipped; this row is additive to them.
- Event sounds wait on rank 6's activities existing to sync to.
- The bell-as-soundscape half (Prime one bell, Vespers the whole peal) is a
  `partials`/`gain` change to the existing `bell` block, not a new system, and
  can ship inside this same increment if time allows.

### Constraints

- #493 (nothing fetched off-origin; a CC0 file is committed, not linked).
- #506 (encode before commit; no uncompressed audio).
- #390 (asset and reference land in the same commit; `assets.mjs` check 4's
  pattern).
- #519, #548 (synthesis-only reversed; a sound stays synthesised until a
  recording beats it, not the other way round).

---

## Side quests

**Rank 8. Size 2+. Three increments shipped on 2026-09-17** (#576 to #581,
the journal's tab at #595, and four more errands at #597 to #599).
`WISHLIST.md` theme 4. The format, the set validator and the cook's missing
knife are in: `data/quests/` is the directory, `data/quests/index.json` names
its files because a browser cannot read a directory, `validateQuestSet` in
`src/quest-graph.js` is the rail, and `src/quest-manager.js` runs every file
in the set off the same event stream the frame hears without a second class.
The save is version 4 for `quests`. The journal's fourth tab is in too, and
five errands. What is below is what is left.

### What shipped, in one paragraph

A quest file is the frame's own graph plus `id` (which has to be the file's
name), `npc` (whose lines it may change) and `ward` (`outer` or `inner`,
#599). It has no actions: `QuestManager.sideActions` is empty and a file
naming any action is refused by name. Three set rules hold it apart from the
mystery: no stage may put its person in a state `mystery.json`'s clue graph
owns (#577, and `_syncStates` puts a press above a side quest as the second
half of the same rule), only one quest per person may hold a non-default
`dialogueState` (#578, the conservative form of "two states at one bell"),
and every `on` has to be an event the game actually emits. A fourth holds
every file to a ward. The cook's knife turns on `clue:knife-missing`,
`clue:knife-found` and `talked:cook`, grants nothing, and `test/quest.mjs`
proves it by playing the same four presses of E with and without the quest
and diffing the journals; the four that followed are held to the same diff
in one walk through all five.

### The five errands (#576, #598)

| File | Person | Ward | Turns on | The favour |
| --- | --- | --- | --- | --- |
| `cooks-knife.json` | Marged | outer | `clue:knife-missing`, `clue:knife-found`, `talked:cook` | She points back at the lantern. |
| `ladys-hawk.json` | Lady Alys | inner | `talked:lady`, `clue:tally-on-walk` | What the south walk is, said sooner by somebody else. |
| `candle-count.json` | Father Anselm | inner | `talked:chaplain`, `clue:chapel-candle` | How long a man stood at the turn of his stair; and "put it to me". |
| `sentrys-dice.json` | Dafydd | outer | `talked:sentry`, `talked:porter`, `press:porter:door-unbarred` | One more man who knew about the bar, after the porter has said it. |
| `hywels-chisel.json` | Ieuan | outer | `talked:apprentice`, `talked:prisoner`, `press:prisoner:prisoner-inside` | Two endings: his own edge, or the forge at Prime. |

Every state a stage names is one the clue graph does not own, and once a
press moves the person the press is what is heard (#578). Each person's
`default` got a fourth line that opens the thread on the first conversation.

### The catch-up (#597)

`clue:<id>` fires once. A quest reaching a stage that waits on a clue the
player already holds is walked forward, at the end of the batch of effects
that moved it (`_surface` is the batch; `_settleSide` after its loop), through
every such transition until a stage waits on something not yet done, with one
toast for the stage it ends up in. `talked:` is never caught up. A save is
settled the same way once at construction. The knife shipped without this
and a barrel opened before Marged mentioned it stranded the thread in
`hunting` for the day.

### What the tab shipped as (#595)

"Asked of you", the journal's fourth tab, beside clues, documents read (#551)
and the map (#589). `QuestManager.questJournal()` is what `_openJournal`
hands the UI: every quest whose stage is no longer its `start`, with the
objective of the stage it is at now, and null rather than an empty list when
there are none, so the tab is not offered at all in a castle where nobody has
asked for anything. A terminal quest goes under a Done heading with its title
struck through rather than off the page. The Present picker inside a
conversation is still clues alone.

### Scope, next increment

- **Reputation by ward.** Two counters the save carries, `outer` and
  `inner`, one moved per errand finished in that ward (the file's `ward` is
  which, #599). A version bump on `save.js` to 6 through `migrate`, with a
  rail in `repair` that clamps each to the number of terminal quests in that
  ward (#36, #37). What reads them: a chatter line or two per ward keyed to a
  threshold, and one line in one closing pane. Not a system, a tint
  (`WISHLIST.md`). Five errands is enough for a moved counter to be seen,
  which is what the deferral waited on.
- **The seven left of the dozen.** `WISHLIST.md` named eight and five are
  written. Of the three it named, one wants nobody new: a letter for the town
  that needs a gate pass, and the Steward signs gate passes (Thomas Wykes is
  at the cart at Terce and in the town by Sext, so it is a Terce errand on
  him, or it is the porter's, whose one owned state is `admits`). Two want
  rank 6's populace, because their person is not one of the twelve: a child's
  dog in the east garden, and the porter's boy who wants his letters from the
  clerk, who is the player. The four it never named are the next session's
  to name, one voice each on the seven people no errand has yet (the
  Constable, the Steward, the Clerk, the porter, Nest, Madoc, the merchant),
  in any state the clue graph does not own.
- **A second quest on one person**, if one is ever wanted, is what replaces
  #578's conservative rule with a real co-activity check. Nothing needs it
  yet and nothing should invent it before something does.

### Acceptance, next increment

- Every new quest file passes `validateQuestSet` as it ships and each new
  rule, if any, is broken on purpose once (#34).
- A new quest shows up on the tab the moment it leaves its start stage, with
  no change to `src/ui.js`: the tab reads the graph, so a quest file is still
  the whole of a quest.
- The walk through every errand with and without the set leaves the identical
  journal (`test/quest.mjs`, the last block of "the next four").
- The journal assertion is a DOM one and the save assertion is not: what a
  reload has to survive is the stage, which version 4 already carries (#39),
  and the counters, when they come.

### Open calls

- **Does a side quest ever speak on the morning after?** It does not, and
  `_dispatchSide` returns early on day two (#576's code, `mystery.js`'s
  `_dayLines` would cover any state it set anyway). Recommend leaving it
  there: a second day with its own threads is rank 4's row and not this one's.
- **Where a quest's objective lives when the tab exists.** Recommended the tab
  and the toast both, not the tracker, and that is what shipped (#595): the
  tracker is one line and it is the frame's (#393, #579).
- **What a fourth `default` line costs.** Each errand opens on the fourth
  line of a `default` set that was three, so a first conversation is one line
  longer. Recommend leaving it: the line is last, so a player re-reading the
  first three is not made to; and the alternative, a stage that opens on a
  bell so the person starts on the errand's own lines, hides the mystery's
  statements behind an errand, which is the thing #550 question 6 forbids.

### Dependencies

- Rank 6's populace unlocks the four errands in `WISHLIST.md`'s dozen whose
  person is not one of the twelve; it does not block the three that need
  nobody new, nor reputation. What the lore row left for a quest to lean on
  is `data/lore.json`'s sixty-five facts, thirteen documents and four
  performed pieces.

### Constraints

- #550 question 6 (a side quest never gates or removes a mystery clue), held
  by `validateQuestSet` and by `_syncStates`' order.
- #500 (a quest prop that is not already a plan piece needs one, tagged and
  diffed like anything else). No increment yet has added a prop; the merlin
  is a line and not a bird.
- #36, #37 (the key does not move; a new field is a version bump through
  `migrate` and a rail in `repair`).
- #13, #34 (the set validator exits non-zero and every rule gets broken on
  purpose once).

---

## A castle to get lost in

**Rank 9. Size 2+. The first increment as this section first specced it was
already built, and the row's premise was corrected on 2026-09-17** (#582).
**The map shipped the same day** (#588 to #591). `WISHLIST.md` theme 5.

### What was measured, and what it changed

This section used to say "eight drums with three floors each is 24 rooms
against about 6 in use" and ask for a floor slab and a `planId` for each
unused one. That was written from `WISHLIST.md` rather than from the code, as
this file's own header says of all eight sections added that day. Against
`data/scene-config.json`: **every one of the eight drums carries a room at
levels 0, 1 and 2**, four carry one at level 3, and the castle has **40
rooms — 14, 11, 11 and 4 by level**, which is the count
`test/plan-vs-scene.mjs` prints on every run. The four drums with no top room
are the four with a 2.5 m turret, refused on arithmetic by #523: a 2.5 m
turret in a 2.8 m ring leaves a 0.3 m ledge. There is no unused drum floor
left to add.

**What the castle has instead is nineteen empty rooms**: seven of the eight
tower first floors, seven of the eight tower top rooms, all four roofs, and
the larder hold no evidence, no station, no document and no prop. `PLAN.md`'s
"an empty room is worse than no room" is the state of the castle rather than a
risk to it, and more volume makes it worse — which is why the latrine turret
and the well chamber this section also named were considered and refused
(#582): they would have made the count 22, not filled any of the 19.

### Scope, next increment

The order inside this row is unchanged — volume, then area, then a second
castle — and the volume step is done, so what is next is area.

- **The town.** Ground west of the barbican exists (#541 to #546) and Thomas
  Wykes's yard is rank 4's own thread to place on it; this row's town half is
  the rest of a walled town's street, church and quay, and it still starts
  only once that yard has proven the ground can carry a building. That
  dependency is unchanged and is the one thing genuinely gating this row.
- **The map: shipped** (#588 to #591). The journal's third tab, "The
  castle", is `src/stations.js`'s `nav.rooms()` drawn by `src/ui.js`: one
  inline SVG per storey in world metres, a `<circle>` for a tower room and a
  `<rect>` for everything else, off the plan's own bounds and discs (#500).
  `src/mystery.js`'s `enter(room, level)` puts the room on `visited` once and
  says so with a `visited` effect; `src/main.js`'s room line is the one call
  that enters a room, for every room, and the cross-wall walk's own clue
  rides it (#588). The save is version 5 (#590) and `repair` holds the set
  to `data/scene-config.json`'s `rooms`. `test/map.mjs` is the suite (#591).
  What the tab looks like on a screen is unseen (#53): the SVG has been read
  as a DOM and photographed by nothing.

### Acceptance, the map (met)

- The map lists every room the plan builds, marks the ones entered, and
  survives a reload (#39: the DOM for what just happened, the save for what a
  reload has to survive). `test/map.mjs`.
- A room the plan stops building is dropped from a save's visited set by
  `repair`, the same rail `read` and `quests` already go through.
  `test/save.mjs`, and seen once from the page in `test/map.mjs`.

### Scope, the town

The town half is what is left of this row, and it starts only once rank 4's
yard has proven the ground west of the barbican can carry a building. When
it does, the town's rooms go on the map the day they go in `config.rooms`,
because the map is the plan's list and not a second one.

### Open calls

- **Whether the map is this row's or the journal's.** Recommend this row's:
  it is the answer to "a castle to get lost in" and it is worth nothing to a
  castle with six rooms.
- **The nineteen empty rooms are not this row's to fill** — they are rank 6's
  routines and whatever documents a later lore row adds, and rank 12's
  placement editor (shipped,
  #583) is what makes filling them cost a key press rather than an afternoon.
  Recommend those three run before this row's town half, whatever the ranks
  say, because area on top of nineteen empty rooms is the bet `PLAN.md`
  already warned against.

### Dependencies

- **The town half waits on rank 4's yard.** The map waited on nothing and
  shipped.

### Constraints

- #500 (`castle-plan.js` computes; the builder places; `plan-vs-scene.mjs`
  is the net).
- #499 (200 MB ceiling).
- #529 (`layout.mjs` for everything derivable from the plan; the diff suite
  for the seams only).
- #36, #37 (the map's visited set is a new save field: a version bump through
  `migrate` and a rail in `repair`).

---

## Bodies

**Rank 10. Size 1.** `WISHLIST.md` theme 6. The plan bet the project on tints
(#419); this row is the second body-sourcing question after rank 1's, which
won its search on 2026-09-17 (#603), at the
scale of a child, a dog, a chicken and a garrison rather than one woman.

### Scope

- **Sourcing, the same search rank 1 ran and won**: a
  low-poly, one-rig, CC0 body per new kind, re-exported through
  `gltf-transform` if it is not already the right generator, so `npc.js`'s
  `pickClip`, `tintBody` and `_findHandBone` keep working with no code change.
  A child scaled down from the existing rig rather than a new one is the
  cheapest version of "child," and should be tried first.
- **`data/npcs.json`** (or `data/populace.json` once rank 6 exists) gets the
  new `modelPath`s and the variation fields `WISHLIST.md` names: `modelHeight`
  (already precedented at #128, rank 1), a tint, a hidden hood/hat node, a
  held prop, a beard-material toggle — all `npc.js` machinery that exists for
  hiding nodes and materials today.
- **The dog**: one body, one behaviour (follow a station or the player,
  bark within a radius), the cheapest "companion" the theme names.

### Acceptance

- `test/assets.mjs` check 4: every new body referenced the same commit it
  lands, per #390.
- A visual acceptance — does the child read as a child at running speed, does
  the dog read as a dog — is `npm run play`'s (#53), same split as rank 1's.
- Node acceptance: the six variation axes (tint, height, hood, prop, beard,
  body) combine to more distinct silhouettes than there are new bodies, which
  a script can just count off `data/npcs.json`/`populace.json`.

### Open calls

- **Which kind first.** Recommend **the child**, per `WISHLIST.md`'s own
  ordering ("Devon named them first," and running is the one thing the walk
  grid already does well), then the dog, then chickens, then the garrison's
  spear-bodies, in that order.
- **New rig or scaled existing rig for the child.** Recommend **scale the
  existing rig** first and only source a true child rig if the proportions
  read wrong on a GPU — this is the cheaper thing to try and to be wrong
  about.

### Dependencies

- **Every activity clip rank 6 defers** (`sweep`, `hammer`, `spar`, `drill`)
  is this row's to supply once a body needs one the shared rig does not
  already carry; the two rows trade work back and forth rather than one
  strictly gating the other.
- Goes through `tools/encode-assets.mjs` (#506) before commit, same as rank 1.

### Constraints

- #390 (asset and reference, one commit).
- #499 (budget: `WISHLIST.md`'s own number is 0.5-1.5 MB a body meshopted,
  ten bodies and thirty clips under 20 MB against headroom).
- #419, #471 (tint clones the material; a new body's own `Skin` hex is either
  matched to the existing three or the live-skin assertion changes to say what
  it actually guards, the same call rank 1 already has to make).

---

## Feel

**Rank 11. Size 2+.** `WISHLIST.md` theme 7. Every item in it is "a thing a
GPU decides," gated on `npm run play` the same way **The hall covering**
already is.

### Scope, first increment

- **A shadow on the pavers and a hand that reaches for the door.** Both are
  named in `WISHLIST.md` as the two cheapest presence cues there are.
  `src/main.js`'s player rig gets a simple blob shadow (a decal or a baked
  circle under the capsule, not a real-time cast shadow, to keep the budget
  #499 and #510 already watch) and a hand node that lerps toward a door's
  handle transform inside the existing `openLock` interaction radius.
- **Nothing else in this theme** (weather, fire, examine, wear, sitting)
  starts before this pair, because they are the cheapest and the ones most
  likely to reveal whether the point-light and shadow budget has room for
  the rest at all.

### Acceptance, first increment

- Node acceptance: the shadow decal and the hand node exist, are tagged with
  a `planId` if they are plan pieces, and do not regress `plan-vs-scene.mjs`.
- GPU acceptance (#53): a screenshot of the player approaching a door with the
  hand visibly reaching, and a screenshot of the shadow on stone versus on
  grass; one sentence each in `HISTORY.md`, the same bar rank 2's photograph
  sets.

### Open calls

- **Real-time shadow or a baked decal.** Recommend the decal: a real
  shadow-casting light on the player is a cost this castle has never paid,
  and the wishlist's own language ("cheapest presence cue") argues for the
  cheaper of the two.
- **Everything else in the theme** (weather, fire, examine, wear, sitting) is
  explicitly a later increment each, in no fixed order — `WISHLIST.md` ranks
  none of them against each other, and this spec does not invent an order it
  was not given.

### Dependencies

- **The GPU run** (ranks 2 and 3) is what tells this row whether the shadow
  and hand read at all; nothing here ships past the Node acceptance before it.
- Fire and its point-light budget depend on **The GPU run**'s texture read
  too, since a bright torch over a compressed texture is a second question
  the same render answers.

### Constraints

- #53 (the whole row; a real-time visual claim is inconclusive until a real
  GPU looks at it).
- #499, #510 (video memory is the number to watch, not disk; a shadow or a
  point light is exactly the kind of thing that moves it).
- #500 (anything built as a plan piece gets a `planId`).

---

## The tooling

**Rank 12. Size 2+. The first increment shipped on 2026-09-17** (#583 to
#587). `WISHLIST.md`'s own closing section: none of the seven themes above is
a code problem, they are content problems at a scale the current tooling
cannot carry, and this row is the three tools it names. The placement editor
is in; the dialogue format and the budget suite are not.

### What shipped, in one paragraph

`?edit=1` on the dev server mounts `src/edit-mode.js`: a panel that reads the
tile under the player's feet as they walk, offers `interiorProps`,
`builtProps` and `braziers` with the models and materials `scene-config.json`
already names, and on **P** posts the row to a Vite middleware that splices it
into `data/scene-config.json`. It does not commit. The write is a text splice
rather than a re-serialise because a round-trip through `JSON.stringify` is
not the file (#584), and `test/tools.mjs`, the eleventh suite, holds it to
that by cutting the new row back out and comparing the whole file byte for
byte. Dev-only is two independent halves — `import.meta.env.DEV` around the
import, `apply: 'serve'` on the plugin — and `test/built.mjs` greps `dist/`
for the module's sentinel rather than trusting either (#586).

### Scope, next increment

- **The budget suite, second**, as this row's own open call already
  recommended and for the reason it gave: ranks 6 and 10 are the two rows
  about to need a real answer to "how many skinned bodies can a ward carry".
  It counts skinned bodies, point lights and draw calls per ward off the plan
  and fails against a number a phone cannot carry. It is a `layout.mjs`-shaped
  check — everything it counts is derivable from the plan in Node (#529) — so
  it needs no browser.
- **The editor's own next want is a way to move and delete**, not only to
  add. Placing is one press; correcting a placement is still hand-editing the
  file. A row selected in the panel, dragged to the player's tile and written
  back over its own text is the same splice machinery reading rather than
  appending, and it is what turns the tool from a stopwatch into an editor.
- **The dialogue format is this row's third and is deliberately unspecified**
  (speaker, state, conditions, effects, one line each, compiled to
  `npcs.json`/`quests/*.json` at build time). `WISHLIST.md`'s paragraph is the
  brief for whoever takes it.

### Acceptance, next increment

- The budget suite exits non-zero over a plan that exceeds its own ceiling,
  names the ward and the count, and is broken on purpose once (#13, #34).
- Anything the editor learns to write keeps `test/tools.mjs`'s byte-exactness
  rail: a move that rewrites a row in place still has to leave every other
  byte alone.

### Open calls

- **What the budget's ceilings are.** Nobody has profiled this castle on a
  phone. Recommend writing the suite with the numbers as named constants in
  one place and a comment saying they are guesses, the way `touch-controls.js`
  already holds its six (#530), rather than waiting for a device to set them.

### Dependencies

- **Every content row above** (6, 8, 9, 10) got cheaper the day the editor
  landed, and none of them was blocked on it.
- The budget suite is more useful after rank 6's populace exists to count, but
  a ceiling on a castle with twelve bodies in it is still a ceiling.

### Constraints

- #501, #493, and now #586: a dev-only tool must not become something the page
  fetches or serves, and the check is a grep of what got built, because the
  served-set diff cannot see a module neither page ever asks for.
- #13, #34 (a check exits non-zero and gets broken on purpose once).
