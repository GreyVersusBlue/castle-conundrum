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
running is a conflict in every table line (#619). What asset
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

## The castle you cannot walk

**Rank 1. Size ¼.** Found by the GPU run (#626, #627), and it is the one row on
this list that stops a player rather than disappointing one.

### The two bugs

- **Four overlays take pointer lock and one gives it back.** `src/ui.js` calls
  `document.exitPointerLock()` in `openRiddle`, `openJournal`,
  `openAccusation` and the verdict pane. `src/quest-manager.js` passes
  `() => this.controlsRef.lock()` as `openRiddle`'s `onClose` and nothing
  passes anything for the other three. `main.js`'s `unlock` listener would
  offer the resume panel, but it checks `!ui.isOverlayOpen()`, which is false
  at the moment `unlock` fires, so it never fires again afterwards either.
- **A dialogue does not release pointer lock**, so `#dialogue-present` cannot
  be clicked with a real mouse: the cursor is captured and the canvas takes
  every pointer event.

### Scope

- **`src/`, and it is lane D.** The shape the evidence points at: release in
  one place and take back in one place, so a fifth overlay cannot be added
  without inheriting both halves. The riddle already has the second half and is
  the model.
- **A guard-rail, and #34 makes it the first thing written.** Press J, press J
  again, hold W, assert the player moved. It fails today; it must be seen to
  fail before the fix lands.
- **Nothing in `data/`.**

### Acceptance

- J and J again, then W moves the player. Measured today: 3.7 m before the
  journal, 0.00 m after.
- A dialogue's Present button is reachable by `page.click`, not only by a
  synthetic `.click()`.
- The two assertions already in `test/play-castle.mjs` go green and the
  `regrip()` calls around them become dead and come out.

### Open calls

- **Release-and-restore, or never release at all?** Recommend **release and
  restore**: the journal, the picker and the accusation panel are all things
  you point at, and the cursor has to exist for them. Never-release would mean
  making all four keyboard-only, which is a bigger change and worse for a phone.
- **What about Esc?** Out of scope here. `main.js` already handles the Esc path
  and it works; this row is about the overlays that take the lock themselves.

### Dependencies

- **It gates rank 2.** The day cannot be played to the end around it — the
  suite only gets through by taking pointer lock back in a way no player can.
- Lane D, so not beside rank 11 or anything else in `main.js`'s player rig.

### Constraints

- #53 (nothing but a real window and a real keyboard was ever going to see it).
- #34 (break it first; it is already broken, so watch the guard-rail fail).

---

## The GPU run

**Rank 2. Size ¼.** `npm run play` is 102 assertions and a numbered screenshot
per beat into `shots/play/`, and no run of it since Phase 5 has happened on a
machine with real compositing (#53). Phases 5, 6 and 7 each list a GPU exit
criterion as outstanding.

**Rank 3, the preview and og card that used to sit under this same section,
shipped on 2026-09-17** (#634, #635) from a fallback frame rather than the run
this section still asks for — see `HISTORY.md`. Its own scope, acceptance,
open calls and dependencies are gone from here with it; what is left below is
rank 2's alone.

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
    or as scaffolding is the open question. Answered from inside the hall once
    the covering (rank 5) went on top of them rather than from this run,
    which never reached Vespers (#656 to #658): a continuous slate ceiling,
    no gap to the sky.
  - **A phone** (#530). The stick throw, the sprint threshold, the look rate,
    the E button's size and the two render numbers are all guesses. One session
    with a real thumb settles six constants.
  - ~~A luma read off the Great Hall's floor~~, for the covering row's OPEN
    baseline. Overtaken: rank 5 shipped without this run reaching Vespers,
    reading the COVERED floor directly instead (69.8 to 89.8 of 255, #656 to
    #658) rather than comparing it against an open-sky number this run never
    produced.
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

### Dependencies

- The run needs a machine with a GPU, which is Devon's; a session can add the
  `snap` beat and cannot run it. If a session is asked to take the run without
  one, the honest output is the beat and a note, not a claim.
- The fourth body (rank 1, shipped #603) is still owed the run's photograph:
  nobody has seen Marged, Nest or Lady Alys in the castle (#606). It is this
  row's to take.

### Constraints

- #53 (the whole point of the row).
- #34 does not apply: no rail is added.

---

## A second day

**Rank 4. Size 2+. Increments 1 and 2 shipped on 2026-09-15 and 2026-09-16
(#533 to #540, PRs #16 and #18), increment 3's gaol roll on 2026-09-17
(#571 to #575) and increment 3's fact that changes the same day (#646 to
#649).** The morning after exists, the castle knows about it, and
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

One thread, and it wants something this repo has not got.

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

Both of the threads above now have somewhere to put "the player found this
out", which neither had before `day2.knew` (#575): a lead found in the yard is
a clue, and a clue is what a `knew` row is keyed on.

### What increment 3's fact that changes shipped (#649 to #649)

The third thread the lore row left behind when it closed (#596), and the one
that needed second-day state to be about. It touched no lane-A file: the key
did not move and the version is still 6.

- **`data/lore.json`**: a fact may carry `since`, a list of
  `{when?, unless?, knew?, tells, text, why}` rows on the shared grammar, the
  first that applies replacing the fact's `text`, and never the only text a
  fact has (#646, and #573's rule pointed at the canon). One fact uses it,
  `the-clerk-who-asked`, a `rumour` about the player: what the castle decided
  a man from Caernarfon who spent a day asking had been doing.
- **`src/mystery.js`**: `dayTwoApplies(row, outcome, held)` exported, the
  private `appliesTo` plus `knew` (#647). `day2.castle` and `day2.knew` keep
  the private one; the canon and the pool below read the export, so there is
  one grammar rather than three copies of one.
- **`data/npcs.json`**: a third `performances` pool, `rumours`, three pieces
  in the guardroom at Lauds, all Dafydd ap Rhys, keyed by the verdict and by
  the journal (#648). **A place now holds a list and the first applicable piece
  wins**, so #592's "one room at one bell holds one piece" became "every piece
  in a place is reachable", and its "a piece by anybody a verdict may take"
  became "absent in an ending this piece applies to". Both are enumerated
  exactly: seven endings times the subsets of the clue ids the pieces name.
- **`src/quest-manager.js`**: `performanceHere` picks the first applicable,
  `_dayOutcome` is recorded in `_applyDay` before `applyWatch` performs, and
  the journal is read live off the engine.
- **`src/lore.js`**: `factText`, and the `since` rails. A row may not name an
  ending or a clue the mystery has not got, may not apply to nothing, may not
  restate the fact, and **has to be told and told only where it is true**:
  `tells` names the piece, the piece cites the fact back, and the validator
  walks every ending and journal to refuse a piece heard where its row does not
  apply (#649).
- **Suites**: `test/lore.mjs` section 10, 27 assertions; `test/quest.mjs`'s
  guardroom-at-Lauds section, 15. Nine breaks from a green baseline, in
  `HISTORY.md`.

### What is left after increment 3

1. **Somebody looks at a Lauds sky.** The five numbers in
   `lighting.watches.lauds` were written against the four already there and
   checked by nothing but the four (#53). It belongs to **The GPU run**.
2. Consequences on the third day, which nobody has asked for.

### Dependencies

- Increment 3's town half no longer waits on Poly Haven access (#546); it
  waits on someone placing Thomas Wykes's yard on the ground the town side
  built.
- **Do not run alongside anything else that touches `save.js`.** Neither of
  the two increments that have landed since had to: the journal day two reads
  is `state.clues`, which the save already carried, so the key and the version
  did not move (#571, #573, and #649 to #649 the same way). What is left of
  this row is the yard, which is lane B and not lane A at all.

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
- #646: the same rule for the canon. A `since` row replaces a fact's text and
  may never be the only text it has.
- #647: there is one `when`/`unless`/`knew` grammar and it is exported from
  `src/mystery.js`. A fifth reader writes no fourth copy of it.
- #648: a conditioned performance is a `day2.watch` performance. A verdict is
  a thing only the morning after has, so `when` at one of the four bells is
  refused rather than silently never played.
- #649: a `since` row has to be told, and told only where it is true. A row
  with no `tells`, or a piece heard in an ending its row does not cover, is a
  failure and not a warning.

---

## Life: a populace

**Rank 6. Size 2+.** `WISHLIST.md` theme 1. **The first increment shipped on
2026-09-17** (#616 to #618) and this section is what is left of the row.

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
- **`label` on an interaction target** (#617): a populace body shows a name
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
- **Whether `garden` should be made real** (#618). `mystery.json` lists it and
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
  first version passed with the bug back in, #616).
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

**Rank 8. Size 2+. Four increments shipped on 2026-09-17** (#576 to #581,
the journal's tab at #595, four more errands at #597 to #599, and reputation
by ward at #612 to #615).
`WISHLIST.md` theme 4. The format, the set validator and the cook's missing
knife are in: `data/quests/` is the directory, `data/quests/index.json` names
its files because a browser cannot read a directory, `validateQuestSet` in
`src/quest-graph.js` is the rail, and `src/quest-manager.js` runs every file
in the set off the same event stream the frame hears without a second class.
The save is version 6: 4 for `quests`, 6 for the two ward counters. The
journal's fourth tab is in too, five errands, and reputation. **What is left
is the seven errands**, and what is below says which.

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

### What reputation shipped as (#612 to #615)

Two counters the save carries, `outer` and `inner`, one moved per errand
finished in that ward (the file's `ward` is which, #599). `SAVE_VERSION` is
6 and the key did not move (#36). It is `day`'s case rather than `read`'s:
`migrate` counts the terminal quests a version-5 save is already carrying,
per ward, because zeroes would say a player who finished three errands
yesterday had done none of them, and that is the one thing about the field
only `migrate` can say (#37, #147). `repair`'s rail is a ceiling — each
counter clamps to the number of quest files in that ward — and not a
recount: a favour done is a thing that happened.

`_settleSide` is where a counter moves and the only place it moves, on the
same line the toast is written from. It cannot double-count because
`validateQuest` has refused a terminal stage with a way out of it since
#393, so a quest at an ending cannot move again.

Two things read the counters. `data/npcs.json`'s `reputation` block holds
`outer` and `inner` — each a list of `{at, line}`, the highest threshold
reached winning — and `closing`, keyed to both counters added together. A
ward's line goes on the **end** of whatever the person you walked up to was
going to say, and who says it is the ward, off the cast's own `ward`, in
whatever state they are standing in: it is the castle talking and not one
more person with an errand. `closing` is one line under the verdict in the
epilogue pane, and null for a player who ran no errand, who is shown nothing
rather than a line saying they did nothing. It is not a dialogue state, it is
not said on a press, and it is not said on the morning after. Thresholds ship
at outer 2 and 3, inner 1 and 2, closing 1, 3 and 5, and `validateQuestSet`
holds every one of them to an errand that exists to be finished.

### What the dialogue format shipped, in one paragraph

`dialogue/castle.dlg` (#659 to #662, 2026-09-18). 13 speakers, 40 states, 118
lines, 20398 bytes, six sigils: `@ id | name | role | ward`, `: state`,
`? press default on wax-matches` or `? quest cooks-knife at hunting`, `% ` that
stage's objective, `! says clerk-cloak`, `| ` one line of dialogue. **`|` and
`%` compile back into `data/npcs.json` and `data/quests/`, and the other four
are rebuilt from the clue graph on every compile and refused if the file has
drifted from them.** That asymmetry is the row's one design call: the graph
lives in `mystery.json`'s `presses` and `clues` and the quests' `stages`, where
`src/mystery.js`'s validator can see it, and a compiler able to invent a press
out of a line of prose could rewire the mystery behind that validator's back.
It is hand-run — `npm run dialogue:extract`, `:compile`, `:check` — and not a
build step, which is where the scope line below was overruled: `dist/` has no
transform in it on purpose, because a build-time pipeline makes `npm run dev`
serve one thing and `dist/` another, which is #506's argument and
`test/built.mjs`'s served-set diff failing by construction (#660). The .dlg
sits outside `data/` so `vite.config.js` cannot publish it. The write is
`tools/place.mjs`'s splice generalised to a nested path — `membersOf` walks any
object or array, `locate` follows `['cast', 7, 'dialogue', 'chisel-forge']`,
and `setValue`, `addKey` and `deleteKey` are the three edits a span makes
possible (#661). **The authoring loop is a stub**: wire a press in
`mystery.json`, run extract, and the state appears with its `?` line and no
lines, and compile refuses it until somebody writes one (#662).
`test/dialogue.mjs` is the fourteenth suite, 112 assertions, 0.3 s, both line
endings.

### Scope, next increment

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
- **A threshold per new errand, or not.** Every errand added raises its
  ward's ceiling, so `data/npcs.json`'s `reputation` block may gain a band;
  it does not have to, and a session that adds errands and leaves the
  thresholds alone is still green. What is not optional is that the block
  stays inside the ceilings, which `validateQuestSet` says.

### Acceptance, next increment

- Every new quest file passes `validateQuestSet` as it ships and each new
  rule, if any, is broken on purpose once (#34).
- A new quest shows up on the tab the moment it leaves its start stage, with
  no change to `src/ui.js`: the tab reads the graph, so a quest file is still
  the whole of a quest.
- The walk through every errand with and without the set leaves the identical
  journal (`test/quest.mjs`, the last block of "the next four").
- The journal assertion is a DOM one and the save assertion is not: what a
  reload has to survive is the stage, which version 4 carries, and the two
  counters, which version 6 does (#39).

### Open calls

- **Where reputation is read out.** Recommended a line per ward threshold
  and one in a closing pane, and that is what shipped (#614), with the ward
  lines appended to what a person was going to say rather than replacing it.
  The `chatter` pool was the obvious-looking home and is not one: nothing
  plays it yet, and a pair is two bodies talking, which needs rank 6.
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
  `migrate` and a rail in `repair`). Met at version 6 (#612).
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
**The child and the hound shipped on 2026-09-17** (#643 to #645), and the
section below is kept as written with what shipped noted against each part.

### What shipped

- **The child is the existing rig** (#643), which is the open call below
  answered the cheap way and seen to hold: `Woman.glb` at 1.15 m with
  `boneScale: {Head: 1.35}`, `clips: {walk: "Run"}` and `speed: 2.2`, three
  fields `npc.js` reads off any def and `populaceDefs` passes through. A
  shrunk `Adventurer.glb` was tried first and is a small bearded man.
- **The dog is a fifth file** (#644): Quaternius's Ultimate Animated Animal
  Pack, CC0, `Husky.gltf` re-exported as `assets/NPCs/Hound.glb` with its
  five materials named (`Coat`, `Coat_Light`, `Nose`, `Eye`, `Eye_White`)
  and the coat lifted so the tint is the colour, meshopted to 0.63 MB. It
  has `follow: {radius: 6, keep: 1.8}` and `sniff` and `eat` in
  `ACTIVITY_CLIPS`; the bark is not in, because a sound is lane E's.
- **The rails** (#645): `tools/encode-assets.mjs` and `test/assets.mjs`
  check 5 find bodies through `populace.json` as well as `cast`; the clip
  check in `test/mystery.mjs` is per person against the body that person
  wears; the silhouette count below is asserted at 10 shapes off 5 files;
  and the follow is driven in Node against the real grid with a fake body.
- **Not shipped**: the chicken, because the Farm Animals pack has no glTF
  export and the animal pack has no bird; the garrison's spear, because no
  pack on disk has one; and the GPU look at either (#53).

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

**Rank 11. Size 2+. The first increment's Node half shipped on 2026-09-17**
(#650 to #654). `WISHLIST.md` theme 7. Every item in it is "a thing a
GPU decides," gated on `npm run play` the same way rank 5's hall covering was
— until it shipped by rendering the hall directly rather than waiting on
`npm run play` to reach it (#656 to #658).

### What shipped, in one paragraph

`src/player-rig.js` adds one group to the scene: a 0.46 m disc with a radial
gradient painted into a 64 x 64 canvas at load, sitting 0.02 m over
`PlayerController.feet` — the plan's own floor height, so the shadow and the
feet cannot disagree about a slab edge — and a hand of six primitives merged
into one geometry, which rests below the frame and lerps out to the leaf's own
`focus`, clamped to 0.78 m from the eye. Two draw calls, 16 KB of texture, no
file, no second shadow-casting light (#650). It reaches for
`interaction.currentTarget` rather than searching, so the hand and the prompt
cannot disagree about which door the player is at (#652), and **every mesh in it
has `raycast` set to a no-op**, because the rig is a top-level scene child and
`interaction.js` calls every one of those an occluder (#651). `settle()`
collapses the smoothing and the world matrix with it, which is what lets the
suite assert a position and never a duration (#653). Nine assertions in
`test/plan-vs-scene.mjs`, each broken on purpose; the ray ones cast twice, once
with `THREE.Mesh`'s own `raycast` put back, so "it did not hit" cannot pass on a
ray that was never going to hit anything.

### Scope, first increment — the GPU half, which is what is left

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

- ~~Node acceptance: the shadow decal and the hand node exist, are tagged with
  a `planId` if they are plan pieces, and do not regress `plan-vs-scene.mjs`.~~
  **Met** (#650 to #654). Neither is a plan piece, so neither carries a
  `planId`, and that is asserted rather than assumed: the rig moves with the
  player and a tagged moving object is a box the plan's diff cannot predict.
- GPU acceptance (#53): a screenshot of the player approaching a door with the
  hand visibly reaching, and a screenshot of the shadow on stone versus on
  grass; one sentence each in `HISTORY.md`, the same bar rank 2's photograph
  sets. **Still open**, and a third shot was added to it by the work: the disc
  is flat and a flight of stairs is a ramp, so what it does on a stair is
  unlooked-at.

### Open calls

- ~~**Real-time shadow or a baked decal.**~~ **Taken: the decal** (#650). A
  shadow-casting light on the player is a cost this castle has never paid, and
  the wishlist's own language ("cheapest presence cue") argued for the cheaper
  of the two. What shipped is cheaper again than a baked file — the gradient is
  painted into a canvas at load, so there is no asset to encode (#506) and
  nothing new is fetched (#493).
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

**Rank 12. Size 2+. Shipped whole: the placement editor and the budget suite
on 2026-09-17** (#583 to #587, #607 to #611), **move-and-delete the same day**
(#636 to #642) **and the dialogue format on 2026-09-18** (#659 to #662).
`WISHLIST.md`'s own closing section: none of the seven themes above is a code
problem, they are content problems at a scale the current tooling cannot carry,
and this row is the three tools it names. **Nothing in it is open.**

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

### What the budget suite shipped, in one paragraph

`test/budget.mjs`, the thirteenth suite, 0.4 s, Node only, three counts per
ward against three ceilings held as named constants in one block with what each
is anchored on written beside it — the open call's own recommendation, taken
(#609). **965 draw calls in the outer ward, 643 in the inner, against 1200.
Three point lights, all outer, against 6 per ward and 8 in the scene. A peak of
7 skinned bodies in the outer ward at Terce and 5 in the inner at Prime,
against 20 per ward and 32 in the cast.** The draw-call count is not derived:
`castle-builder.js`'s `built` ladder came out into an exported `buildPiece`,
the suite calls it and counts the meshes it really returns, because a suite
that re-derives a drum as "24 sectors, so 48 shells" is a suite agreeing with
itself (#34, #500). **The finding: 970 of the castle's 1539 meshes, 63 % of
everything it draws, is the eight tower drums.** Rank 10's fifty bodies fit
neither skinned ceiling and are not meant to, which is the answer this row was
taken to produce.

### Scope, next increment

- ~~**The editor's own next want is a way to move and delete**~~ **shipped
  2026-09-17** (#636 to #642). The panel lists every row within six tiles of the
  player, nearest first, rebuilt as they walk; `M` writes the selected one to
  the tile they are standing on and `Delete`, twice inside four seconds, cuts it
  out. `rowSpans` walks the text for a row's span rather than searching for it,
  because three of the file's 31 rows are not what `formatRow` would write and
  an exact twin would resolve to the first of the pair. `test/tools.mjs` went
  from 47 assertions to 179 and the headline is that an insert and a delete of
  the same row give back the file byte for byte, on both endings, for all three
  arrays. `/__place` takes `add`, `move` and `delete`, and each verb's row count
  is checked before anything is written.
- ~~**The dialogue format is this row's third and is deliberately unspecified**
  (speaker, state, conditions, effects, one line each, compiled to
  `npcs.json`/`quests/*.json` at build time)~~ **shipped 2026-09-18** (#659 to
  #662). Everything but "at build time", which was overruled and argued in
  `HISTORY.md` under #660.

### Acceptance, next increment

- ~~Anything the editor learns to write keeps `test/tools.mjs`'s byte-exactness
  rail: a move that rewrites a row in place still has to leave every other
  byte alone. On both line endings.~~ **Met** (#639): the rail asserts it per
  row rather than per array — every byte before a rewritten row's span and every
  byte after it, for all 31 placeable rows, on both endings. What a move does
  change inside the span is a `-2.0` becoming `-2`, which is #584's churn
  confined to the one row being edited and is the bargain the module is.
- ~~**What is left of this row is the dialogue format alone.**~~ **Met**
  (#659 to #662). Nothing is left of this row.
- **What the dialogue format does not cover** is the rest of the spoken text:
  `npcs.json`'s `chatter` and `performances` pools, its `reputation` lines and
  `mystery.json`'s `day2.lines`. None is keyed by speaker-and-state, which is
  the only shape the format knows. A second increment for whoever opens one;
  it is not a row today.

### Open calls

- **The budget's ceilings are still guesses**, and deliberately so: nobody has
  profiled this castle on a phone. A session that measures on real hardware
  replaces the four numbers in `test/budget.mjs`'s ceiling block and records
  the measurement; a session that merely wants more room argues for it in
  `HISTORY.md`. Rank 2's GPU run is the first chance to take `renderer.info`
  off a real frame and find out how far off 965 the truth is.

### Dependencies

- **Every content row above** (6, 8, 9, 10) got cheaper the day the editor
  landed, and none of them was blocked on it.
- **Ranks 6 and 10 now have a number to answer to.** The budget suite's
  per-ward ceiling of 20 skinned bodies is what rank 6's first ten spend
  against a peak of 7, and rank 10's fifty do not fit it. Neither row is
  blocked; both now fail a suite if they overspend, which is the whole point.

### Constraints

- #501, #493, and now #586: a dev-only tool must not become something the page
  fetches or serves, and the check is a grep of what got built, because the
  served-set diff cannot see a module neither page ever asks for.
- #13, #34 (a check exits non-zero and gets broken on purpose once).
