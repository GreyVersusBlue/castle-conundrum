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
#606.** **The ranks below start at 2, and 1, 3 and 5 are retired numbers rather than
gaps**: each shipped and its number was retired rather than shifted up, because
renumbering eleven rows across three files while four wave A sessions were
running is a conflict in every table line (#619). The number 1 was used twice,
by the fourth body on 2026-09-17 and by the castle you cannot walk on
2026-09-18 (#659 to #661), which is that rule working as intended: a rank is a
priority and not an id. What asset
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

## The red suite: what the prompt is aimed at

**Unranked, the row `BACKLOG.md` calls "nobody's row yet". Size ¼. The first
increment shipped 2026-09-20** (#721 to #723). Two increments are left and both
are class S. `BACKLOG.md`'s and `ROADMAP.md`'s prose is a scribe's job, not
this section's.

`main` had no green CI run and every PR inherited a red `plan-vs-scene`. Two
beats were named, and they are two bugs, not one. The chapel-candles beat is
fixed. The populace beat has never been seen to fail on the dev machine and is
specified here rather than changed blind.

### Scope

| File | What changes | State |
| --- | --- | --- |
| `src/interaction.js` | `AIM_DOT = 0.95`, and two slots per list in `update()`: the nearest thing inside the aim cone, then the nearest thing at all | shipped (#722) |
| `test/plan-vs-scene.mjs`, the chapel-candles beat | the failure prints every cell it tried, nearest first, instead of a prompt read after the loop had already moved on | shipped (#723) |
| `test/plan-vs-scene.mjs`, the populace beat (`all N of them stand on the first stop of their Prime ring`) | park the rings before measuring; `TOL` stays 0.01 m | increment 2 |
| `src/mystery.js` (`validateMystery`'s nav rails), `test/mystery.mjs` | a station-to-prop clearance beside `STATION_CLEARANCE`, and the two stations that fail it | increment 3 |

Nothing here touches `src/save.js`, its version or `migrate`, and nothing moves
an assertion across the `layout` / `plan-vs-scene` / `mystery` / `budget` line.

### Acceptance

**Increment 1, shipped.** `npm test` is 15 of 15. `plan-vs-scene` ran six
times on the dev machine after the change and was green six times, against one
green in six before it. The beat that holds it is `test/plan-vs-scene.mjs`'s
`evidence prompts with mystery.json's own name`, and the break that proves it
is not vacuous is `AIM_DOT = 0.35`, which is `FACING_DOT` and therefore
nearest-wins verbatim: `FAIL none of the 12 cells between 0.9 and 2.8 m of the
chapel candles offers them, nearest cell first — 0.96 m: "Press E to talk to
the Sir Roger Lestrange"; 1.08 m: ... 1.58 m: "Press E to ring the bell"`,
exit 1 (#722, #723).

**Increment 2.** The populace beat passes with the ten bodies parked, and the
`TOL` in its message still reads 0.01. The break: skip the park and hold the
page at Prime for fifteen seconds before the beat, which puts every ring on its
second or third stop and fails the beat by metres.

**Increment 3.** `test/mystery.mjs` gains a rail saying no station stands
within `PROP_CLEARANCE` of anything the player presses E at, at the watch that
station is held. It is red on the data as it stands, so the increment carries
the data fix with it. `npm test mystery layout plan-vs-scene` is the subset.

### Open calls

1. **Does the populace beat loosen `TOL`, or settle the bodies?** *Settle
   them.* `window.__populace.setWatch(mystery.watches[0], { walk: false })`
   immediately before the `window.__folk` read, then assert at 0.01 m as now.
   `walk: false` routes nothing and calls `_arrive`, which is the same
   placement `init` does, so the beat still checks `Populace.setWatch` against
   Node's own `stopWorld`. There is no tolerance to pick: `DWELL` is 9 s and a
   body's first timer is `dwell * (0.5 + phase)`, so the earliest ring leaves
   its first stop 4.5 s after the page places it and the last at 11.2 s. The
   beat is racing a wall clock, not measuring a jitter, and the two CI numbers
   say so — 0.055 m and 0.408 m from one stop are two points on a leg that can
   be as long as the room. What the beat loses is that `init` called `setWatch`
   at all; say so in the comment, because that is #147's trap.
2. **Where does the station-to-prop rail live?** *`src/mystery.js`'s
   `validateMystery`, surfaced by `test/mystery.mjs`*, beside the
   `STATION_CLEARANCE` check it is a second half of. It is plan arithmetic and
   `nav.at`, provable in Node, so #529 forbids it in `plan-vs-scene.mjs`.
3. **What number?** *1.0 m, named `PROP_CLEARANCE` in `src/stations.js` beside
   `STATION_CLEARANCE`.* It catches the two that actually bit and nothing else:
   the Chaplain 0.20 m from the gravestone at all four watches, and the
   Constable 0.92 m from the chapel candles at Prime. Reusing
   `STATION_CLEARANCE`'s 1.5 m instead would also flag the Constable against
   the bell (1.15 m) and the body (1.41 m), the apprentice against the
   obituary roll (1.44 m) and the sentry against the gaol roll (1.44 m) —
   nine pairs instead of five, four of them a body standing a sensible arm's
   length from the thing it is meant to be attending to.
4. **Is a Node rail owed over the ranking rule itself?** *No.* The measurement
   behind #722 is 60 lines that re-implement `InteractionSystem.update`'s
   arithmetic, and a test that re-implements the thing it checks is not a check
   (#34). The numbers live in `src/interaction.js`'s own comment. If a later
   row wants one anyway it goes in `test/layout.mjs`, never in
   `plan-vs-scene.mjs` (#529).
5. **Is `AIM_DOT = 0.95` right, or should it be looser?** *0.95.* It is the
   middle of the three measured and the curve is flat: 0.90 offers what the
   player is aimed at 11411 times out of 12371, 0.95 does 11521 and 0.98 does
   11707. Only a GPU run can say whether 18.2 degrees feels tight under a real
   mouse, and 0.90 is the fallback if it does.

### Dependencies

Increments 2 and 3 are independent of each other and of everything else.
Neither is in a named lane: `test/plan-vs-scene.mjs`, `src/mystery.js` and
`src/stations.js` are in none of A to E. Increment 3 edits station coordinates
in `data/mystery.json`, which "A second day" reads, so do not run it beside
that row.

### Constraints

- **#529.** Nothing moves across the suite line. The chapel-candles beat stays
  in `plan-vs-scene.mjs` because it reads a DOM prompt string off a live
  `InteractionSystem` with a live raycast in it; the clearance rail is Node
  arithmetic and goes to `test/mystery.mjs`.
- **#34.** Both remaining increments name their break above, and a flake needs
  the stronger version: show the cause moved, not the load.
- **#13.** No skip list. Neither beat gets relaxed to pass.
- **#53.** The suite is headless. #722's numbers are geometry and are not
  timing, so they stand; whether the cone reads right to a hand on a mouse is
  rank 2's.
- **#147.** Both beats had a comment that was wrong before an assertion was.
- **CRLF here, LF in CI** (#632).

---

## The GPU run

**Rank 2. Size ¼. Its gate, rank 1, shipped 2026-09-19** (#716 to #720).
`npm run play` is 102 assertions and a numbered screenshot per beat into
`shots/play/`. It has now
been run on a machine with real compositing four times over two sittings
(#624 to #630 on 2026-09-17, #708 to #715 on 2026-09-19) and the day has never
reached the end.

**The judgement half of this row is done, and the walk half is not.** The
second sitting answered every render question the list below carried — the
twelve at Vespers, the Lauds sky, the covered hall, eleven bodies at interact
range — by putting the world at a bell with `applyWatch(watch, { walk: false
})` and photographing it, which is how rank 5 answered its two (#656 to #658).
What is left is `npm run play` itself getting there. Rank 1, the walker on
the stair, shipped on 2026-09-19 (#716 to #720): the Node check holds over
every pair of ground rooms, and what is owed now is the run itself, on a GPU
(#53).

**Rank 3, the preview and og card that used to sit under this same section,
shipped on 2026-09-17** (#634, #635) from a fallback frame rather than the run
this section still asks for — see `HISTORY.md`. Its own scope, acceptance,
open calls and dependencies are gone from here with it; what is left below is
rank 2's alone.

### Scope, the run

- **Nothing in `src/`.** The run is the deliverable. `test/play-castle.mjs` is
  the only file this row may change, and on 2026-09-19 it changed by 67 lines
  in two helpers: `present()` now runs the dialogue box out the way `converse`
  does (#708), and `hike` clicks the resume panel when the browser has refused
  a relock (#709). Both of those had been read as `src/` bugs before.
- ~~The `snap('twelve-at-vespers')` beat~~ is written, standing at the hall's
  west end rather than the north doorway the spec named, because the doorways
  are at x -20 and -12 and the six stand from x -27.2 to -12, so the doorway
  puts half the cast behind the camera. **Do twelve read as twelve? No: two of
  them do not** (#711). The Constable and the Steward are one white-haired man
  in a black tunic, told apart by a red collar and a green one, and past about
  three metres there is nothing to tell. The three women are the clearest
  bodies in the castle and the lesson is that silhouette works where tint does
  not.
- **`HISTORY.md`** records what the run said, beat by beat, and what was seen:
  the walk on the Kitchen Tower flights (Phase 5's 5.7, 9.7, 1.7 readings), the
  cross-wall crossing, the cook's walk from kitchen to hall, the reload at
  Sext, the epilogue. A beat that fails on a GPU is a bug; a beat that failed
  under software rendering and passes here was never one.
- ~~**`BACKLOG.md`**'s header line "Nothing here has been seen on a GPU since
  Phase 5" comes out.~~ **Done on 2026-09-17** by the first sitting (#624 to
  #630); the paragraph that replaced it says what has been looked at and what
  has not, and 2026-09-19 rewrote it again.
- **THE FIVE THINGS ONLY A RENDER COULD JUDGE. Four are answered and one is
  untouched**, one sentence each in `HISTORY.md` as this list asked:
  - ~~**A tower roof from 12 m**~~ (#523). Answered 2026-09-17 (#630) and
    unchanged in 2026-09-19's frames: the climb works and the view is mostly
    parapet, with the merlons' inward faces near-black.
  - ~~**Seven trusses over the Great Hall**~~ (#527). **Moot, not answered**
    (#713). Rank 5's covering sits under them and not one truss is visible
    from the hall floor. Seven pieces of geometry nobody in the game will see.
    And rank 5's "no gap to the sky" is not quite right: a sliver of the
    Vespers sky colour shows at the hall's south-east corner.
  - **A phone** (#530). **Still untouched.** The stick throw, the sprint
    threshold, the look rate, the E button's size and the two render numbers
    are all still guesses. One session with a real thumb settles six
    constants, and neither GPU sitting had a phone in the room.
  - ~~A luma read off the Great Hall's floor~~. Overtaken twice: rank 5 read
    the covered floor at 69.8 to 89.8 of 255 (#656 to #658), and 2026-09-19
    read it at 57.8 from the west end (#713). Both are well clear of the ~25
    line and the row it was for has shipped.
  - ~~**The gaol roll on the guardroom barrels**~~ (#571). Answered: it lies on
    the barrel-head rather than floating over it. It reads as an untextured
    olive slab rather than as parchment, which is a material question and not
    the support question this list asked.
  - **And one the list did not have**: the Lauds sky (#533, #712), measured
    at 151.2 of 255 against Prime's 203.4, with no dawn colour in it and the
    day's own four watches out of order. See `HISTORY.md` for the table.

### Acceptance, the run

- `npm run play` exits 0 on a machine with a GPU, or exits non-zero with the
  failing beat named and filed as a new backlog row. **Met on 2026-09-19 in
  the second form, four times**: exit 1, 22 failures, the failing beats named,
  and the one cause that is not this suite's own filed as rank 1. **The two
  suite bugs that were fixed changed no assertion's verdict** — run one and run
  four have byte-identical failure lists — they changed only how far the player
  got before each one, which is how the remaining cause was isolated.
- ~~`shots/play/` contains the numbered set, `twelve-at-vespers.png` among
  them~~, **and a human has looked at it and written one sentence per body:
  told apart or not.** The second half is done (#711) and the first is not:
  the numbered set stops where the walker stops, and the Vespers frame came
  from a hand-run look into `shots/look/` instead. That is the shape of the
  split this row keeps running into — the judgement does not need the walk,
  and the walk is still owed.
- No new guard-rail: the run is the check. The `snap` beat is a screenshot, not
  an assertion, and says so in its comment.

### Dependencies

- The run needs a machine with a GPU, which is Devon's; a session can add a
  beat and cannot run it. If a session is asked to take the run without one,
  the honest output is the beat and a note, not a claim.
- ~~The fourth body is still owed the run's photograph~~ (#606). **Taken**
  (#711): Marged, Nest and Lady Alys are in `shots/look2/`, and `Woman.glb`
  does the job the tint was being asked to do.
- **Rank 1, the walker on the stair, shipped** (#716 to #720). `hike` no
  longer drives the player up the Chapel Tower ramp; a same-storey route now
  searches that storey's floor alone, over every pair of ground rooms the
  fill reaches. That holds on Node terms; nobody has watched it hold on a GPU
  yet, which is what this row still owes.
- The journal beat's walk assertion (#659) has been run on a GPU now, three
  times, and read 0.69, 1.30 and 0.51 m against its `> 1.0` threshold. It is
  measuring the chapel's geometry more than it is measuring the pointer. What
  to do about that is a decision about what the beat is for, and it is left
  open rather than guessed at.

### Constraints

- #53 (the whole point of the row).
- #34 does not apply: no rail is added.

---

## A second day

**Rank 4. Size 2+. Increments 1 and 2 shipped on 2026-09-15 and 2026-09-16
(#533 to #540, PRs #16 and #18), increment 3's gaol roll on 2026-09-17
(#571 to #575), increment 3's fact that changes the same day (#646 to
#649) and the bells call and Thomas Wykes's yard on 2026-09-19 (#699 to #707).** The morning after exists, the castle knows about it, and
it now knows one thing about the player as well as about the verdict: one
watch (`lauds`), thirteen stations, sixty line sets keyed by what the player
said and three keyed by what he read, seven closing panes, a thirteenth cast
entry whose conversation ends the game, and three rows of stone that move
depending on which of the seven endings was reached. What follows is what
shipped, and nothing of increment 3 is left.

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

### Increment 3: the yard, shipped

Nothing is left of increment 3. The town half shipped and the bells call
shipped before it.

- **The yard shipped on 2026-09-19** (#703 to #707). Thomas Wykes's yard
  stands on the ground rank 5 laid west of the barbican: a stretch of
  Mereford's wall with the town gate in it, a shed on four posts, a low yard
  wall on two sides, and five blocks of dressed stone of which one carries
  Gruffudd's mark. **The player sees it and never stands in it** (#703), which
  is the row's open call settled: the castle is sealed, `test/layout.mjs`
  check 4 asserts it, and the barbican's west face has no archway. A lead
  found there is still a `day2.knew` row whenever somebody writes that thread,
  because the `knew` grammar never asks how the player came by a clue.

It has somewhere to put "the player found this out", which it did not have
before `day2.knew` (#575): a lead found in the yard is a clue, and a clue is
what a `knew` row is keyed on. **And the bells question behind it is answered**
(#699 to #702, below), so a yard that wants the morning to move has a morning
that can.

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

### What the bells call shipped (#699 to #702)

The design question increment 3 left open, settled on 2026-09-19, and the
smallest thing that fits the answer. It touched `src/save.js` for a helper and
two lines and left the version at 6.

- **`data/mystery.json`**: `day2.watch` is `day2.watches`, a list of the
  morning's own bell ids, none of them one of the four. It is one long
  (`lauds`), because `day2.schedule` is one station per person for the whole
  morning and `day2.lines` is keyed by the verdict and not by the bell, so a
  second morning bell with nothing written per-bell behind it is a sky change
  and a noise. The list is what makes a second one a data edit here rather than
  an engine change (#699).
- **`src/mystery.js`**: `dayWatchesOf(mystery, day)` exported, the one place
  that picks between the two lists, and `state.watch` is an index into whichever
  one the day names. `ring()` walks the day's own list and numbers its rings
  within it; `beginDay2` brings the index back to 0 on the way in and only on
  the way in, so a morning that has rung on is not rewound by being re-entered.
  Five validator rails on the list itself.
- **`src/stations.js`**, **`src/lore.js`**, **`src/save.js`**: all three read
  the list instead of a single id. The save's `watch` clamp is day-aware, and
  the demotion of an incoherent `day: 2` re-clamps against day one.
- **The chapel bell rings on the morning after** (#700), where it had been
  returning no effects at all since day two shipped: `ring()` opened on
  `ended()`, which is true from the verdict onward. The last bell of a day
  moves no watch, which day one's fourth already did, and the morning's has no
  Constable behind it, so what is left is the ring and its sound.
- **Suites**: `test/mystery.mjs` drives a two-bell morning end to end off a
  clone of the data and carries the five validator breaks; `test/save.mjs`
  holds the day-aware clamp; `test/quest.mjs` holds the bell ringing at Lauds
  and staying silent between the verdict and the epilogue; `test/layout.mjs`
  holds every bell of both days to a ring character in `data/sounds.json` and a
  sky in `data/scene-config.json`, reading both and writing neither. Eight
  breaks from a green baseline, in `HISTORY.md`, one of which stayed green the
  first time and is why the nav assertion exists.

### What is left after increment 3

1. **Somebody looks at a Lauds sky.** The five numbers in
   `lighting.watches.lauds` were written against the four already there and
   checked by nothing but the four (#53). It belongs to **The GPU run**.
2. Consequences on the third day, which nobody has asked for.

### Dependencies

- Increment 3's town half waited on Poly Haven access, then on the yard, and
  now on neither: rank 5 laid the ground (#546) and rank 4c built the yard on
  it (#703 to #707). What is left of this row is the bells question alone.
- **Do not run alongside anything else that touches `save.js`.** Neither of
  the two increments that have landed since had to: the journal day two reads
  is `state.clues`, which the save already carried, so the key and the version
  did not move (#571, #573, and #649 to #649 the same way). What is left of
  this row is the yard, which is lane B and not lane A at all.

### Constraints

- #36 and #413 (key unchanged; the version moved to 2 in increment 1).
- #37 (`repair` every load).
- #39, #481, #34 throughout.
- #533, as #699 left it: a second day is still a `day` field and `watches` is
  still exactly four. What is overturned is the clause that made the morning
  unable to move. The morning names its own bells in `day2.watches` and the
  engine reads whichever list the day names. A row that wants a second morning
  bell writes it in `data/mystery.json`.
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
- #699: `state.watch` indexes the day's own bell list, so no id may be in both
  lists and `day2.watches` is the one spelling: the singular `day2.watch` is
  refused outright rather than accepted as a second source.
- #700: the last bell of a day rings and moves nothing. The morning's carries
  no `demand`, because the morning has no Constable asking for a name.
- #701: a day numbers its rings within its own list, so the morning's bells
  borrow the four characters `data/sounds.json` already has. A morning bell
  with no ring character, or with no sky in `data/scene-config.json`, is a
  failure in `test/layout.mjs`. Both of those files are read there and written
  by nobody in this row.
- #702: the version is still 6. A row here bumps it when a field arrives, not
  when `repair` learns to ask a better question (#37).

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
  either ground somebody builds or a room id that should come out of the file.
  **Rank 4c's yard is now a real precedent rather than a nearer one** (#703 to
  #707): a room outside the walls, on the map, named, with things standing in
  it, that nobody ever walks into. The garden is behind a gate that never
  opens, which is the same shape. Not this row's call, but this row is where
  it was found.

### Dependencies

- **Two of the side quests row's errands were specced as wanting somebody
  from this file and in the end did not.** That row closed on 2026-09-18
  (#691 to #695) by keeping both ideas and dropping the body each wanted: the
  porter's boy is an errand on the porter with the boy never on screen, and
  the child's dog was let go rather than replaced, on the ground that a dog is
  the one of the two that is not a conversation and belongs to rank 10's
  hound. Nothing in this row is owed to that one any more.
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

**The second increment, a bed at a point and the four rings, shipped on
2026-09-18** (#680 to #683). A `PannerNode` per source, at the point of the
room's footprint nearest the player rather than its centre (#680, because the
south walk is 18 m long), the nearest three within 14 m sounding at once, open
ground in the head; a drum's storeys with the same bed are one source (#681);
`bell.rings` gives the four rings a stroke count and a gap each (#682). The
Node criterion held is that every source is heard from a point inside its own
footprint, from anywhere; the rest is ears (#53). `ambient.spatial` in
`data/sounds.json` is the whole of the tuning.

**The third increment, the two event sounds that need no clip, shipped on
2026-09-19** (#696 to #698). `data/sounds.json` has an `events` block:
`byCue` maps what the engine does to a sound, `sounds` is each sound as a
list of parts (a noise burst or a tone, at an offset, struck or held), and
`spatial` is the panner every one plays through, at the point the cue names.
`CUES` in `src/audio.js` is the code's half: `door-open` and `door-shut`,
fired by `openLock` and `shutLeaf` from the leaf's centre on a change of
state only, and `hound-near`, cued by the populace every frame the hound is
inside its follow radius and paced into barks by the sound's own `cadence`.
`test/layout.mjs` check 14 holds every cue to a sound and every sound to a
cue, and `test/plan-vs-scene.mjs` holds the two wires in `src/main.js`.
Nothing plays before the start button (#697). The rest of the event sounds,
the hammer and the sweep, still wait on rank 6's clips.

**What is left is the listening**, and the checklist for it is at the end of
this section.

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
  is rank 6's to add first. (The door and the bark turned out to need no
  clip, and shipped as the third increment, #696 to #698. The hammer still
  waits.)

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

### Listening checklist

Nobody has heard any of this (#53). `npm run play` on the dev machine, with
speakers or headphones, and `data/sounds.json` open beside it: every number
below is tuned there and nowhere else. Write what was wrong, not that it was
wrong, and put the answers in `HISTORY.md` against this row.

**The seven beds** (`ambient.beds`; stand in each, then walk out of it):

- [ ] `ward`: the head bed on open ground. Does it read as outdoors, and is it
      still there under the kitchen and the hall heard through their walls?
- [ ] `wallwalk`: up on the walk. Is the wind a wind, and does it stop at the
      top of the stair or bleed down it?
- [ ] `kitchen`: from the ward outside its door first, then across the
      threshold. Is the crackle a fire and not a click, and is the threshold
      a step and not a fade?
- [ ] `hall`: the same test at the Great Hall's door. The near wall is where
      it is heard from outside; is that what it sounds like?
- [ ] `chapel`: the two-note drone is tuned to the bell. Ring it there. Do the
      two agree?
- [ ] `chamber`: the lodge and the solars. Quiet enough to be a room and not
      silence?
- [ ] `tower`: climb the King's Tower. Nothing should fade on the stair
      (#681). Does anything?
- [ ] The two most likely wrong: 14 m of earshot through stone
      (`spatial.hearMetres`), and a tower roof heard from the hall under it.

**The four rings** (`bell.rings`; press E at the bell four times, once per
watch, from the chapel and then from the far ward):

- [ ] Terce, one stroke. Is it a bell and not a chime? The tierce at 396 Hz
      is what should make the difference.
- [ ] Sext, two strokes 1.3 s apart. Two, or one with an echo?
- [ ] Vespers, six at 0.9 s. A peal, or a machine? `gapSpread` is 0.08.
- [ ] The summons, three at 1.8 s and louder. Does it read as heavier, or
      only as slower?
- [ ] From the far ward: thin and placed, or gone?

**The two event sounds** (`events.sounds`):

- [ ] The muniment door, `latch-and-swing`: answer the word standing in front
      of it. A click, a second click, then a rush and a low hinge for the
      2.5 s the leaf takes. Is the hinge sawtooth a hinge, or a buzz? Is the
      whole thing at the door and not in the head?
- [ ] The same door on the second morning, `latch-and-slam`: the Clerk's word
      goes back over it as Lauds opens. A short swing, a thud, a latch. Is
      it audible from where the day starts, and should it be?
- [ ] The hound, `bark`: walk up to Gelert in the outer ward at Prime and
      stand. A double bark inside a second, then one every 7 s or so while
      you stay. Is 560 Hz falling to 380 Hz through an 1100 Hz formant a dog,
      or a duck? Walk away past 5 m and back: the first bark should be quick
      again.
- [ ] Does anything fire before Enter the Castle is pressed? It must not
      (#697); a save resumed with the door open is the case to try.

---

## A castle to get lost in

**Rank 9. Size 2+. The first increment as this section first specced it was
already built, and the row's premise was corrected on 2026-09-17** (#582).
**The map shipped the same day** (#588 to #591). `WISHLIST.md` theme 5.
**The town's first increment is specced below and decided before it is built
(#725 to #728)**: a street of six houses and a church inside Mereford's wall,
west of the town gate, seen from the walls and entered by nobody.

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

### What the map shipped (#588 to #591)

The journal's third tab, "The castle", is `src/stations.js`'s `nav.rooms()`
drawn by `src/ui.js`: one inline SVG per storey in world metres, a `<circle>`
for a tower room and a `<rect>` for everything else, off the plan's own bounds
and discs (#500). `src/mystery.js`'s `enter(room, level)` puts the room on
`visited` once and says so with a `visited` effect; `src/main.js`'s room line
is the one call that enters a room, for every room, and the cross-wall walk's
own clue rides it (#588). The save carries `visited` since version 5 (#590)
and `repair` holds the set to `data/scene-config.json`'s `rooms`.
`test/map.mjs` is the suite (#591): the map lists every room the plan builds,
marks the ones entered and survives a reload (#39), and a room the plan stops
building is dropped from a save's visited set by `repair` (`test/save.mjs`).
What the tab looks like on a screen is unseen (#53).

### Scope, the town's first increment: Mereford inside its wall

**Decided before it is built, #725 to #728.** The town is west of the
`town-wall` run, not in the strip between it and the barbican (#725). Its
rooms go on the map in a drawing of their own and out of the stood-in count
(#726). What it draws is held against both wards' ceiling (#727). And every
room outside the curtain is held to being seen from somewhere the player can
stand, which is #703's other half written as an assertion (#728). Everything
below was prototyped in Node against a clone of `data/scene-config.json` on
2026-09-21 and the numbers are that prototype's, not estimates.

Nothing in it is enterable. #703 stands: the castle is sealed, check 4 asserts
it, and the town is a thing seen from the walls. Every piece is a Kenney kit
model or a Poly Haven set already in `assets/`, so the increment needs no
network, no `ktx` and no GPU.

**`data/scene-config.json`** (lane B). World boxes first, then the tile values
that produce them, because `runBox` reads `from`/`to` as tile centres and
widens the run by half a tile at each end: an along-x run's box is
`min(from.x, to.x) * 4 - 2` to `max(from.x, to.x) * 4 + 2`, and its centreline
is `from.z * 4`.

- **Three runs close Mereford's wall into a circuit**, each 8 m high, 3 m
  thick, `medieval_blocks_02`, `repeatMetres: 3`, `interior: true` like
  `town-wall` itself (#705: a 3 m run cannot carry a kit merlon).
  - `town-wall-north`: x -129.5..-65.5, z -34..-31. `from [-31.875, -8.125]`,
    `to [-16.875, -8.125]`.
  - `town-wall-south`: x -129.5..-65.5, z 27..30. `from [-31.875, 7.125]`,
    `to [-16.875, 7.125]`.
  - `town-wall-west`: x -129.5..-126.5, z -31..27, with the west gate as a
    `doorways` entry `{ at: 0, width: 4, height: 5.5 }`, the east gate's own
    numbers, so `outside-road` runs out through it. `from [-32, -7.25]`,
    `to [-32, 6.25]`.
  - Each return **touches** `town-wall`'s west face at x -65.5 and the west
    wall **touches** both returns, with zero overlap. Two 8 m runs that
    overlapped would share a top over the overlap, which check 10 refuses
    (#513, and #705's yard walls hit the same rule). `town-wall`'s own
    comment loses "running off into the fog both ways" and says what closes
    it.
- **Six houses, three each side of the road**, each a solid run 8 m long,
  6 m deep and 5 m high in `plastered_wall_04`, `interior: true`. North row at
  z -9..-3 (`from.z` / `to.z` -1.5), south row at z 3..9 (1.5), and along x
  -76..-68 (`-18.5` to `-17.5`), -85..-77 (`-20.75` to `-19.75`) and -94..-86
  (`-23` to `-22`). Ids `mereford-house-n1` to `n3` and `s1` to `s3`. A 1 m
  gap between neighbours, so no two share a top plane.
- **Two `roof.glb` pitches on each house**, in `courtyard.placements`, the
  Wykes shed's arrangement one storey up: `rotationY: 90`, `scale [6, 2, 4]`,
  `base: 5`, `noCollide: true`, at the tile x of each end of the run and the
  row's tile z. Each covers 4 m of the ridge and the house's 6 m depth, 5 to
  7 m up. Ids `mereford-house-<row><n>-pitch-1` and `-2`.
- **The church, nave and west tower**, both `medieval_blocks_02`,
  `interior: true`:
  - `mereford-church-nave`: x -100..-84, z -22..-14, 7 m high, thickness 8.
    `from [-24.5, -4.5]`, `to [-21.5, -4.5]`. Four pitches at tile x -24.5,
    -23.5, -22.5 and -21.5, tile z -4.5, `scale [8, 3, 4]`, `base: 7`, top at
    10.
  - `mereford-church-tower`: x -104..-100, z -20..-16, 15 m high, thickness 4.
    `from` and `to` both `[-25.5, -4.5]`, **and it needs `axis: "x"`**:
    `runAxis` throws on a run that starts and ends on one tile without one,
    which is how the prototype found out. One pitch on it, `scale [4, 3, 4]`,
    `base: 15`, top at 18: a saddleback tower, which is a real parish form and
    the only one the kit's pieces make without a new model.
- **Four things on the ground, so check 11 ("something in every room") has
  something to find** in each of the two new rooms, since a run is a `wall`
  and the pitches stand 5 m up. In the street: `barrels.glb` at about
  `(-72, 2.4)` and `detail-crate.glb` at about `(-88, -2.4)`, on the road's
  verges, at the yard's own scale of 2.5 rather than the prototype's 1. In the
  churchyard: `tree-large.glb` at about `(-82, -24)` and `column-damaged.glb`
  at about `(-92, -12)` as its cross. Each clear of every run's box.
- **Two rooms, `ward: "outside"`, `level: 0`, `bounds` in world metres, no
  `floor`**:
  - `mereford-street`, name `"Mereford's street"`, bounds x -95..-66,
    z -9..9: the road inside the east gate and both rows of houses.
  - `mereford-church`, name `"Mereford church"`, bounds x -106..-80,
    z -26..-10: the church and its yard.
  - `town-tree-3` (-80, 12) and `town-tree-4` (-108, -8) stay where rank 5 put
    them and are now inside the wall. Neither is in either room.
- **Cost, measured**: the outside bucket goes from 44 meshes to 132. A solid
  house is one mesh and its two pitches eight; the church is 22; the three
  runs are 5, the west gate's cut making three boxes of one.

**`src/ui.js` and `src/ui.css`** (no lane): the map, per #726.
`_renderJournalMap` splits `rooms` on `ward === 'outside'`. The storey
drawings, their shared frame, the headings' "n of m" and `#journal-map-count`
all read the rooms that are not outside, so the frame goes back to the
castle's own 67.6 m and the count is out of 40. After the storeys, one more
`section.map-storey.map-outside` with `data-level="outside"`, a heading
"Outside the walls", and its own SVG framed on the outside rooms plus a
metre. Its shapes and names carry `map-room seen`, `data-outside="1"` and
`data-visited="0"`, and **every name is shown from the first**, because there
is no standing in them to earn it by. One CSS rule for `.map-room.seen`: a
dashed stroke, no fill.

**`test/layout.mjs`**, one new check after 4c, **4d: every room outside the
curtain is seen** (#728). For each `ward: "outside"` room, the candidate
targets are every plan piece that is not `ground` and whose box centre lies
in the room's bounds; a target's point is its box's top centre, 0.05 m down.
The eyes are every cell of `walk.cells` with `h >= 8` (the walks and the
roofs; nothing lower sees over a curtain), at `h + EYE_HEIGHT`. The
occluders are every other plan piece's `boxes || [box]`, ground excepted, as
axis-aligned boxes: square round a drum and all, which only ever makes the
check harder to pass. A room passes when one eye sees one target with a
segment that meets no occluder, and the pass line names both. In the
prototype, 1939 eyes, all three rooms, 0.2 s.

**`test/budget.mjs`**, per #727: one assertion per ward,
`calls[w] + calls.outside <= MAX_DRAW_CALLS_PER_WARD`, the fail naming the
outside bucket's three biggest pieces. No new constant. The summary's
`outside` line prints both sums in place of "no ceiling yet". The file's
header paragraph WHAT A WARD IS says why.

**`test/map.mjs`**: `total` becomes the rooms that are not outside. What it
adds is in Acceptance.

Not touched: `data/mystery.json`, `data/populace.json`, `data/sounds.json`,
`data/lore.json`, `src/save.js` (no field, no bump: a room nobody can enter
never reaches `visited`), `src/castle-plan.js`, `src/castle-builder.js`,
`src/stations.js`. If the builder finds one of those has to change, the
increment has left this spec and comes back here.

### Acceptance, the town's first increment

Every item is Node or headless. What the town looks like from the North-west
Tower's roof is **The GPU run**'s (#53): `tools/shot-yard.mjs` pointed at the
church is a one-line change a dev-machine session can make.

- **`test/layout.mjs` 4c** passes for three rooms instead of one: each clear
  of the curtain, on `outside-ground`, reached by nobody. Check 4 still says
  the castle is sealed; the prototype's `walk.sealed()` is `true`.
- **`test/layout.mjs` 4d** passes for all three. The prototype's result is the
  acceptance: the yard is seen from `floor-nw-tower-roof` at (-37.75, 13.70,
  -16.75) by `wykes-shed-pitch-1`, which is the exact vantage and piece #707
  photographed through a crenel, so that line is the check agreeing with a
  picture rather than with itself (#34). **If the yard ever fails 4d, the
  check is wrong and not the yard** (#147). In the prototype the street was seen by 14
  of its 20 candidates and the church by 8 of its 9. **Break**: `town-wall` to 20 m high.
  The prototype says the street and the church are then seen from nowhere and
  the yard, which stands east of that wall, is still seen: the check tells
  the rooms apart. Write the FAIL lines into `HISTORY.md` under #728.
- **The existing `layout.mjs` checks hold unchanged**: 3 (fourteen ground
  rooms), 3d (the mystery's rooms), "a name for every room" (43 names, all
  different, all drawable), 10 (no shared top plane), 11 (something in every
  room), 12 (every surface has a step sound: both materials already map), 13
  (ambient beds: outside rooms are exempt).
- **`test/budget.mjs`**: outer 993 + outside 132 = 1125 of 1200 and inner
  643 + 132 = 775. **Break**: `MAX_DRAW_CALLS_PER_WARD` to 1100. The outer
  ward alone (993) still passes the old assertion and only the new one fails,
  on 1125. Record the FAIL line under #727.
- **`test/map.mjs`**, headless, reading the DOM:
  - the count reads `0 of 40 rooms stood in` on a fresh page and
    `3 of 40` after the tour;
  - storeys read `0,1,2,3,outside`;
  - every storey SVG's `viewBox` width is the castle's extent plus 2 m, read
    off `window.__castle.plan.rooms` in the page, and no outside room's id is
    drawn in any storey;
  - the outside drawing holds exactly the plan's three outside rooms, by id,
    each named with its real name, none `data-visited="1"`;
  - "no unvisited room gives its name away" reads only `:not([data-outside])`.
  - **Breaks**, each against one of those: build the frame off every room
    again; count outside rooms in the denominator; show `· · ·` for an
    outside name.
- **`test/plan-vs-scene.mjs` gets no new assertion.** Every new piece carries
  a `planId` and the existing diff covers it at 0.01 m (#500). Nothing this
  increment claims needs a browser to prove except the map, and the map is
  `test/map.mjs`'s (#529).
- `npm test` fifteen of fifteen, `npm run build` clean, `test/built.mjs`'s
  served-set diff unchanged in kind (no new file is fetched: every model is
  one the yard or the castle already loads).

### Open calls

- **Each house a room?** Recommend **no, two rooms: the street with its six
  houses inside its bounds, and the church with its yard**, because a house
  nobody enters is a building rather than a place, and six more rectangles
  that can never be stood in would be six more blanks on a drawing that is
  already all blanks.
- **What the two are called.** Recommend `"Mereford's street"` and
  `"Mereford church"`, with no saint, because a dedication is canon and canon
  is `data/lore.json`'s to add (#559's discipline pointed at the town).
- **The quay and the river.** Recommend **not in this increment; the west
  gate is where the next one starts**, because water is a surface kind the
  plan does not have (the walkability fill would call it floor, check 12 would
  want a step sound for it, and "down through Mereford to the quay" wants
  ground lower than y 0). The kit has `water.glb`, `dock-side.glb` and
  `dock-corner.glb` for when it does.
- **Slate.** Recommend **`roof.glb` on every roof in the town and
  `castle_wall_slates` on none**, because lore's `the-quay` says the toll-house
  at the quay's head is the one building in Mereford with a slate roof, and
  that building belongs to the quay increment.
- **Doors and windows on the house fronts.** Recommend **none this
  increment**, because a doorway cut in a 6 m solid block is a 6 m tunnel, and
  the nearest eye is 30 m off at a grazing angle. If the GPU run says the rows
  read as blocks, the kit's `wall-pane-wood-door.glb` and
  `wall-pane-wood-window.glb` go on as facades and 4d still holds.
- **`roofs` on the town's pitches.** Recommend **no**, because `roofs` means
  "over a floor a body stands on", and the roof check (`a roof over its room`)
  would then want each house to be a room.
- **Bodies in the town.** Recommend **none, and rank 6's "the rest go in rank
  9's town" is answered no while #703 stands**, because `validatePopulace`
  refuses a stop the player cannot walk to, which is what #707 hit moving the
  spawn. A figure standing in a street nobody enters is a different system from
  a populace, and a later increment's call.
- **The nineteen empty rooms first?** This section recommended, on
  2026-09-17, that rank 6 and the lore fill them before the town. Recommend
  **building the town now anyway**, because it adds no room anyone can stand
  in, so it does not deepen the empty-room problem that recommendation was
  about.
- **Whether the map is this row's or the journal's.** This row's, and it
  shipped (#588 to #591).

### Dependencies

- **Lane B** (`data/scene-config.json`), which is free: R4c, R5 and R12b are
  done. `src/ui.js`, `src/ui.css` and the three test files are in no lane.
- **Rank 6**, if it runs alongside, may touch `test/budget.mjs`'s ceilings
  block for its skinned bodies. The two changes are different lines of one
  block; merge by hand, and the draw-call sum from #727 is this row's.
- **Ranks 2 and 6 may also claim decision numbers from #725.** This row's
  band is #725 to #728, contiguous, and is renumbered at merge if either
  landed first.

### Constraints

- #500: every new piece is a plan piece with a `planId`, and
  `test/plan-vs-scene.mjs` is the net that already covers it.
- #529: 4d is provable in Node and goes in `test/layout.mjs`, never in
  `test/plan-vs-scene.mjs`.
- #611, #727: `test/budget.mjs` holds cost and `test/layout.mjs` holds
  whether the castle works. The sight check is not a cost.
- #703: nothing in the town is enterable. 4c's "no foot reaches it" is not
  touched.
- #704: `ward: "outside"` is the only way a room lies past the curtain.
- #705: town runs carry no battlements; they are 3 m thick.
- #513: check 10. Runs meet by touching, never by overlapping.
- #584, #632: `data/scene-config.json` is spliced, never re-serialised
  (`JSON.stringify` over it is 4 KB longer than it), and every line written
  into it takes the file's own ending.
- #493, #506: no new asset. Every model named is already in `assets/`.
- #36, #37: the key does not move and the version stays 6.
- #34: every break above, from a green baseline, with the FAIL line quoted in
  `HISTORY.md`.
- #53: the look is the GPU run's.

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
- **The chicken is a sixth file** (#684), shipped 2026-09-18: Quaternius's
  Farm Animals bird off poly.pizza as `assets/NPCs/Hen.glb`, 55 KB meshopted,
  clips renamed to `Idle`, `Idle_Peck`, `Run`, `Attack`, `Death`, one
  material `Feathers` over its atlas, and the FBX export's 100x scale baked
  into the data so three renders it at all. Two hens wear it, near-white and
  tawny tints over the atlas, with `peck` as the one new activity.
- **The garrison's spear is a held prop** (#685), shipped 2026-09-18:
  Quaternius's off poly.pizza as `assets/NPCs/Spear.glb`, 46 KB. `heldProp`
  under `assets/` is repo-relative (`heldPropPath` in `src/populace.js`, the
  one copy of the rule), and `heldPropFit` `{length, grip, tipUp}` is the fit
  a mace's defaults get wrong. The serjeant and the man-at-arms carry it.
- **Not shipped**: the GPU look at any of it (#53), and the activity clips
  rank 6 wants (`sweep`, `hammer`, `spar`, `drill`), which no body has.

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
(#636 to #642) **and the dialogue format on 2026-09-18** (#687 to #690).
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

### What the dialogue format shipped, in one paragraph

`dialogue/castle.dlg` (#687 to #690, 2026-09-18). 13 speakers, 62 states, 182
lines, 34243 bytes, six sigils: `@ id | name | role | ward`, `: state`,
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
`test/built.mjs`'s served-set diff failing by construction (#688). The .dlg
sits outside `data/` so `vite.config.js` cannot publish it. The write is
`tools/place.mjs`'s splice generalised to a nested path — `membersOf` walks any
object or array, `locate` follows `['cast', 7, 'dialogue', 'chisel-forge']`,
and `setValue`, `addKey` and `deleteKey` are the three edits a span makes
possible (#689). **The authoring loop is a stub**: wire a press in
`mystery.json`, run extract, and the state appears with its `?` line and no
lines, and compile refuses it until somebody writes one (#690).
`test/dialogue.mjs` is the fifteenth suite, 112 assertions, 0.3 s, both line
endings.

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
  `npcs.json`/`quests/*.json` at build time)~~ **shipped 2026-09-18** (#687 to
  #690). Everything but "at build time", which was overruled and argued in
  `HISTORY.md` under #688.

### Acceptance, next increment

- ~~Anything the editor learns to write keeps `test/tools.mjs`'s byte-exactness
  rail: a move that rewrites a row in place still has to leave every other
  byte alone. On both line endings.~~ **Met** (#639): the rail asserts it per
  row rather than per array — every byte before a rewritten row's span and every
  byte after it, for all 31 placeable rows, on both endings. What a move does
  change inside the span is a `-2.0` becoming `-2`, which is #584's churn
  confined to the one row being edited and is the bargain the module is.
- ~~**What is left of this row is the dialogue format alone.**~~ **Met**
  (#687 to #690). Nothing is left of this row.
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
