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
#606.** **The ranks below start at 1 again, 5 is a retired number rather than a
gap, and 3 came back on 2026-09-21 for the retro castle (#744), the way 1 came
back three times, because a rank is a priority and not an id**: each shipped
row's number was retired rather than shifted up, because
renumbering eleven rows across three files while four wave A sessions were
running is a conflict in every table line (#619). The number 1 was used twice,
by the fourth body on 2026-09-17 and by the castle you cannot walk on
2026-09-18 (#659 to #661), which is that rule working as intended: a rank is a
priority and not an id. **It was in use a fourth time on 2026-09-21**, by "Sight at the body's own
height," for the same reason: a GPU run found it and it sits in front of
`npm run play` reaching its end. **It changed hands again later the same day**,
to "Explore: the day before," because Devon's answers to `WISHLIST.md` theme 8
(#750 to #753) made the walking day the first door into the game and a first
door outranks what is behind it; the sight bug is rank 2 and 5 is still
retired. **Rank 13 is new the same day**: the floor
plan you can see (#745 to #749), a number the table has never held before,
because Devon asked for it by name and it did not displace anything already
in front of the castle's shape. What asset
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

## Explore: the day before

**Rank 1. Size 2+. Increments 1, 2 and 3 shipped 2026-09-21** (#767 to #770,
#771 to #774, #775 to #777, against #754 to #756). Devon answered
`WISHLIST.md` theme 8's four questions on 2026-09-21 and overturned the theme
on two of them: the walking day is the main mode with the mystery behind it
(#751), and it is the day BEFORE the death, Hywel alive and speakable (#752).
That price is given and is not renegotiated here. What this section does is
settle ten calls against the code rather than against the theme, so each of
the four increments below is class S. **Increment 4 is open.**

Theme 8's engine half still holds in shape: one stage, one branch per method in
the engine, a bell, four rails. What does not hold is anything it wrote for a
second door or a dead Hywel, and three of its eight open calls are answered
against its own recommendation, with the reason each time (open calls 5, 6
and 9).

### What was measured, and what it changes

Seven readings, because five of them make the theme's plan wrong.

1. **There is no `mode`.** Which day the save is on is already a field, and the
   day before the death is a day. `repair` is `out.day = s.day === 2 ? 2 : 1`
   (`src/save.js:188`) and a third value is a clamp change, not a field
   arriving, so the version stays 6 (#754 amends #751's "a `mode` field,
   version 7"). Open call 2.
2. **Two of the six browser suites have no door to press.**
   `test/plan-vs-scene.mjs:90` and `test/map.mjs:117, 259, 283` wait for
   `#start-overlay:not(.hidden)`, which is "the castle finished building", and
   then drive `window.__quest` and `window.__castle` without ever clicking.
   With `start` at `explore` the castle at load IS the walking day, so
   `plan-vs-scene`'s `bodies.length === 13` and
   `absent.join() === 'inspector,merchant'` (lines 514 and 537) measure a day
   that is not the one they are about. The door is a method as well as a button
   (#755). Open call 4.
3. **All eleven evidence props hide themselves at a bell of the walking day,
   and six of them must not.** `_showEvidence` asks whether the row lists the
   current watch (`src/quest-manager.js:326`), and all eleven rows list only the
   four. So a day-0 bell id hides the lantern at the stair, which is right, and
   with it the chapel candleholders, the muniment table, the bakehouse barrel,
   the guardroom barrel-head, the bar beside the Stockhouse door and, worst, the
   muniment LEAF, which carries `evidence: "lock"` in
   `data/scene-config.json:1364` and whose collider goes with it: a hole in the
   King's Tower wall. So the walking day names what IS on the ground rather than
   what is off it, six ids against five. Open call 1.
4. **`day0.castle` starts empty.** Every one of #752's five things (the body,
   the lantern, the pouch, the cloak, the tally stick) is an `evidence` row,
   and the lantern IS the body row's prop
   (`data/scene-config.json:2705`), so open call 1 hides all five and no
   `DAY_SETS` verb is needed for any of them. The block exists for the stone
   and is empty until something wants it.
5. **Hywel's lines need no new file and no new compiler target.** A stage's
   `dialogueState` already switches every speaker's line set, `_syncStates`
   already layers press over errand over stage (`src/quest-manager.js:1017`),
   and `dialogue/castle.dlg` already writes `|` lines into
   `data/npcs.json`. So the walking day's lines are a `day0` dialogue state per
   speaker, not a fifth pool in `data/mystery.json`, and `_linesFor` needs no
   day-0 branch at all. Open call 6.
6. **The fourteenth body breaks `test/budget.mjs`.** `MAX_SKINNED_TOTAL` is 32
   and thirteen cast plus nineteen household is exactly 32. The ceiling goes to
   33 with the argument in `HISTORY.md` (#756, #611).
7. **`arrives: 0` reads as present on day one.** `arrivesLate` is
   `(npc?.arrives ?? 1) > 1` (`src/mystery.js:215`) and `src/lore.js:86, 189`
   each ask `> 1` on their own. Four call sites, one new predicate, and the
   existing messages are left alone so `test/lore.mjs:208, 270` keep asserting
   what they assert. Open call 8.

### Scope, increment 1: the engine, the save, and a placeholder day — shipped 2026-09-21 (#767 to #770)

The whole mechanism, with a day-0 schedule that is day one's copied under
day-0 bell ids and Hywel standing in the lodge with one line. Everything the
row is uncertain about is provable here, before a word of content is written.

| File | What changes |
| --- | --- |
| `data/mystery.json` | A `day0` block, `day2`'s sibling: `watches` (four ids of its own, `prime-eve`, `terce-eve`, `sext-eve`, `vespers-eve`, none of them one of the four and none of them `lauds`), `schedule` (per-bell rows in day one's own shape, thirteen people, the twelve copied station for station off `schedule` plus `hywel`), `evidence` (the six rows that are on the ground: `candle`, `lock`, `ledger`, `knife`, `gaol-roll`, `walk-door`), `castle` (an empty list, with its `castleComment`), and `night` (`{title, text, button}`, the pane at the last bell). Top level beside `ui`: `watchLabels`, the HUD's name for a bell that is not its own id, and `watchLike`, the bell whose sky a bell of another day borrows, four entries each. `ui.quiet`, the line every examinable gives on the walking day. |
| `data/npcs.json` | A fourteenth `cast` entry, `hywel`: `Farmer.glb`, tint `#7a6a52`, `role` "Master mason", `ward` "outer", `arrives: 0` with a comment saying what 0 means, a `default` set of one line (unreachable, the inspector's own `default` is the precedent) and a `day0` set. Every other cast entry gains a `day0` set, one line each, the inspector included: `validateAgainstNpcs` demands a stage's `dialogueState` on every speaker (`src/quest-graph.js:107`). Fourteen stub sets, written in the .dlg and compiled in. |
| `dialogue/castle.dlg` | The same fourteen sets, written here and compiled with `npm run dialogue:compile`, plus the `@ hywel` speaker block. No grammar change in this increment: a state with no `?` line above it is already legal, and exactly one block in the file is one today. |
| `data/quest.json` | `start` becomes `explore`. Three stages: `explore` (objective "Nobody is waiting for a name. Walk where you like; the bell is yours.", `dialogueState: "day0"`, `enter: ["applyDay0"]`, transitions `ask:journal` to `openJournal`, `bell:1` to `bell:3` to `ringBell`, `bell:4` to `ringBell` and to `night`, `day:1` to `arrive`), `night` (`dialogueState: "day0"`, `enter: ["showNight"]`, one transition, `day:1` to `arrive`), and `arrive`, which gains `enter: ["applyDay1"]` and nothing else. No `lock:muniment` and no `riddle:solved` on either new stage (open call 7). |
| `src/mystery.js` | `dayWatchesOf(mystery, day)` picks by a literal 0 or 2 and falls back to the four for everything else. `onDayZero()` beside `onDayTwo()`, a third branch and not a generalisation of the second (open call 1). Day-0 clauses in `dayWatches`, `get day()`, `stationOf`, `available` (no statements, `asleep` still honoured), `press` (the day-2 clause's own shape), `examine` (one `quiet` effect, nothing granted), `enter` (`visited` still, no `L` clue), `ring` (a `night` effect beside `bell:<n>` at the last index, no wrap), `accuse` (refused). `beginDay0()` and `beginDay1()`, both `beginDay2`'s shape including its "only on the way in" guard (#699). `undoDay(rows)`, the `DAY_SETS` inverse, which is what `beginDay1` hands back so entering the mystery drops the walking day's overlay. `beforeDayOne(npc)` beside `arrivesLate`, and the `day0` validator rails below. |
| `src/save.js` | `buildCatalog` gains the walking day's bell list; `clampWatch` takes a third list; `repair` is `s.day === 0 ? 0 : s.day === 2 ? 2 : 1`; one incoherence rail beside line 218's, in the same slot, re-clamping the watch. The version stays 6 and `migrate` is untouched (#754). The header gains the paragraph saying why, the way #702's already does. |
| `src/stations.js` | The day-0 bells are indexed the way `day2.watches` is (lines 70 to 74), per bell, because `day0.schedule` is a station per bell and not one row for the day. |
| `src/quest-manager.js` | `applyDay0`, `applyDay1` and `showNight` on `static actions` and `_actions`; `_applyDay0`, `_applyDay1`, `_showNight`; `enterMystery()`, which is `_event('day:1')` and is what the second button and the two non-clicking suites call. `_showEvidence` reads `day0.evidence` when the day is 0. `label()` reads `mystery.watchLabels`, and `applyWatch` hands `_onWatch` the bell's own sky id off `mystery.watchLike` beside the `walk` flag. `onPresent` is withheld on day 0 the way it already is on day 2. `get day()` returns 0, 1 or 2. |
| `src/interaction.js` | One line, #715's: `Press E to talk to ${shown.name}` (line 169). |
| `src/main.js` | One line: `onWatch` calls `setWatch` with the sky id the manager resolved rather than with the bell (open call 10). The engine reads the day off the state it already has, the graph's `enter` action does the rostering, and the panel is increment 2. |
| `test/mystery.mjs`, `test/save.mjs`, `test/quest.mjs`, `test/layout.mjs`, `test/budget.mjs` | The rails below. `budget.mjs`'s `MAX_SKINNED_TOTAL` goes to 33 with its comment (#756). |

Not touched: `data/scene-config.json` (open call 10 is what keeps this row out
of lane B), `src/castle-plan.js`, `src/castle-builder.js` (`applyDay` already
takes any row list), `data/sounds.json` (a day numbers its rings within its own
list, so four day-0 bells ring `bell:1` to `bell:4` and the four characters
already exist, #701), `data/populace.json`, `data/documents.json`,
`data/lore.json`, `data/quests/`.

### Acceptance, increment 1 — green, 15 of 15

Every item is Node or headless. Each break is run from a green baseline and its
FAIL line is quoted in `HISTORY.md` (#34, #13).

- **`test/mystery.mjs`, the walking day end to end.** `dayWatchesOf(m, 0)` is
  the four day-0 ids, `dayWatchesOf(m, 1)` is the four, `dayWatchesOf(m, 7)` is
  the four. An engine on a day-0 state: `available` gives a station and no
  statements, `talk` grants no clue, `press` shrugs, `examine` on each of the
  six returns one `quiet` and nothing else, `enter` puts the room on `visited`
  and grants no `L` clue, three rings walk the four bells, the fourth returns a
  `night` effect and `bell:4` and moves no watch. `beginDay1()` from a day-0
  state sets day 1 and the watch to 0; called again on a day-one state at Sext
  it leaves the watch at Sext.
  **Breaks**: make `dayWatchesOf` fall through to `day0.watches` for day 1 and
  the day-one rails fail by name; let `enter` grant on day 0 and
  `walk-crosses` is in a walking day's journal; drop `ring`'s day-0 clause and
  the fourth ring returns a `demand` on a day with no Constable asking.
- **`test/mystery.mjs`, the `day0` validator rails.** Nine, against clones of
  the data, each naming the id it is about: a day-0 bell that is one of the four
  or one of the morning's; an id listed twice; a cast member with no row in
  `day0.schedule`; a `day0.schedule` id not in the cast; a station with no
  floor, outside the room it names, unreachable, or inside another body's 1.5 m;
  a `day0.evidence` id that is not an evidence row; and **the walk into the
  night**: every body with a station at the last day-0 bell AND a day-one Prime
  station has a route between them, in #475's message shape. That last is the
  day-2 rail's "overnight is still a walk" pointed forward instead of back, and
  it skips Hywel and the merchant for the reason the day-2 one skips a man with
  no Vespers station: there is nothing to walk from or to.
  **Break**: on a clone, move the cook's `vespers-eve` station into the cell and
  the rail says `cook: no path from PT at vespers-eve to KI at prime` (the
  cook's real `day0` station is `PT`, not `CE` as an earlier draft of this
  example had it; corrected once the increment shipped, #767).
- **`test/mystery.mjs`, Hywel.** `beforeDayOne` is true for him and false for
  the twelve and the inspector; he has a `day0` station, no `schedule` row and
  no `day2.schedule` row, and each of those three is a rail with its own
  message. **Break**: give him a day-one station and the rail says `hywel: is
  in the castle on the walking day only (arrives: 0) and still has a day-one
  schedule`. **Second break**, in `test/lore.mjs`: name him in a chatter pair
  and the message is the walking-day one and not the inspector's, which is
  still asserted verbatim at `test/lore.mjs:208`.
- **`test/save.mjs`.** A `day: 0` save comes back as day 0 with its watch
  clamped to the day-0 list; a `day: 0` save carrying a clue or a recorded
  verdict comes back as day 1 with the watch re-clamped to the four; a
  version-6 save carrying day 1 or day 2 is untouched; `SAVE_VERSION` is 6 and
  the fifteen fields are still in order, `fresh.day === 1` included (line 56 is
  unchanged on purpose: the walking day is written by `beginDay0` and not by
  `defaults`). **Break**: clamp with the four on day 0 and a save at
  `vespers-eve` comes back at the wrong bell; drop the incoherence rail and a
  hand-edited `day: 0` with a verdict opens the day before the death with the
  mason already buried.
- **`test/quest.mjs`.** `validateQuest` accepts the graph; `explore` is
  reachable and reaches a terminal; a manager begun at `explore` is on day 0
  with the six evidence props shown and the other five hidden, the errands and
  the reputation asides running, the journal empty, no Present button offered,
  no accusation panel; `bell:4` moves it to `night` and the pane's button moves
  it to `arrive`, which puts the day at 1, the body back at the stair and the
  cast at day-one Prime. And section 5's existing objective rail now holds
  `explore`'s text, plus a sibling for `#quest-watch`'s initial label.
  **Breaks**: leave `index.html`'s `#quest-objective` alone and section 5 fails
  with the stale text quoted; drop `arrive`'s `applyDay1` and the body never
  comes back; put `talked:constable` on `explore` and the no-overlay assertion
  fails.
- **`test/layout.mjs`.** The sky rail's `everyBell` grows to the walking day's
  four and each is resolved through `watchLike` first, so a day-0 bell that
  borrows no sky and has none of its own fails there and nowhere else; a
  `watchLike` entry naming a bell that is not a bell, or one with no sky, fails
  the same rail. And `undoDay` round-trips: `collidersWith(plan, undoDay(rows))`
  is `plan.colliders` for a clone carrying one `gone` row, and
  `undoDay(undoDay(rows))` is `rows`. **Breaks**: delete one `watchLike` entry
  and the rail names the bell that would change the HUD and not the light; make
  `undoDay` a no-op and the collider comparison fails.
- **`test/budget.mjs`.** 33 bodies built, 0 under the ceiling of 33.
  **Break**: leave the ceiling at 32 and the suite fails with `33 bodies
  built, over the ceiling of 32`, which is the failure the fourteenth body
  causes and the reason #756 exists.
- `npm test` 15 of 15, `npm run dialogue:check` green, `npm run build` clean.

### Scope, increment 2: the doors, and everything that says what the game is — shipped 2026-09-21 (#771 to #774)

| File | What changes |
| --- | --- |
| `index.html` | `#start-button` reads "Walk the castle" and keeps its id: it is the panel's primary button and the resume path's, and has been since Phase 1. `#start-mystery`, a `link-button` under it, reads "Straight to the day of the death". The panel's paragraph is the walking day's; `#quest-objective` and `#quest-watch` carry `explore`'s objective and the first day-0 bell's label; the `<meta>` and og descriptions say what the first door is. Nothing about the og IMAGE changes: #634 and #635 are about the card, not the words, and `og:image:alt` ("Castle Conundrum, mid-play.") stays true. |
| `src/ui.js` | `showStart(onStart, onMystery = null)`; a null second callback hides `#start-mystery`, which is what a resumed save gets. `showStartAgain` never shows it. |
| `src/ui.css` | Outside this increment's original scope table, added anyway (#773): `#start-overlay .panel button { display: block; margin: auto }`, because three inline buttons in a 460 px panel put the second door beside the first rather than under it. |
| `src/main.js` | The UI-flow region only. The second callback is the first one plus `quest.enterMystery()`, and it is passed only when `saved` is null. |
| `README.md` | The opening says a castle you walk with a mystery in it. |
| `test/overlays.mjs`, `test/touch.mjs` | Each already calls `window.__quest.enterMystery()`, added in increment 1 because `start: explore` broke both suites the moment it shipped (#767). This increment replaces that call with a real click of `#start-mystery`, now that the button exists to click. |
| `test/built.mjs`, `test/play-castle.mjs` | Neither was touched by increment 1. Each clicks `#start-mystery` where it wants the day of the death; `test/play-castle.mjs` is what un-breaks `npm run play`, blocked on the walking day since increment 1 shipped (#767). It also gains the two day-one facts increment 1 left stale (#772): `rigs.count` is 14 for Hywel, and the Play Again beat expects a fresh walking day rather than `arrive`, then presses the second door to reach it. |
| `test/plan-vs-scene.mjs` | Already calls `window.__quest.enterMystery()` after the build and before it measures, added in increment 1 for the same reason as `overlays`/`touch` (#755, #767); its counts are already 14 bodies and `hywel,inspector,merchant` hidden at Prime. This increment adds #715's live prompt string and the panel a resumed save gets, the latter planted from `test/blank.html` because the autosave flushes on `pagehide` and overwrote the first version of that plant (#774). |
| `test/map.mjs` | Needed nothing in increment 1 — it asserts no fact the walking day changes (#767). Still needs `window.__quest.enterMystery()` after the build, because it never clicks either (#755). |

### Acceptance, increment 2 — green, 15 of 15

- **`test/overlays.mjs`**: the second button releases and takes the pointer the
  way the first does, which is the one property that suite asserts (#659 to
  #661), and it is not on the panel when a save is resumed. **Breaks**: the new
  button without `player.lock()`; pass `onMystery` unconditionally and the
  resume panel offers to restart the day the player is standing in.
- **`test/quest.mjs`** section 5, unchanged in shape, now green against
  `explore`'s objective, and the `#quest-watch` sibling with it.
- **`test/plan-vs-scene.mjs`**: pressing E at a body reads `Press E to talk to
  Sir Roger Lestrange` exactly, which is #715 and is a live DOM string no Node
  suite can see (#529, #39). **Break**: put the article back and the assertion
  quotes `Press E to talk to the Sir Roger Lestrange`.
- **`test/plan-vs-scene.mjs`**: plant a day-one save at Sext with three clues,
  load, and the panel offers one button and resumes at Sext. **Break**: hide
  `#start-mystery` on the wrong condition and a resumed mystery is offered its
  own start again.
- **`test/touch.mjs`**, **`test/built.mjs`**: a tap and a click on
  `#start-mystery` each land the day of the death, `window.__quest.day === 1`.
  **Breaks**: drop `quest.enterMystery()` from the touch callback and the tap
  lands on the walking day instead; leave `onMystery` null in the built
  page's wiring and the bundle's second button does nothing.
- `npm test` 15 of 15, `npm run dialogue:check` green, `npm run build` clean.
  **Unverified: whether the day plays through this door on a GPU.**
  `npm run play` is not in `npm test` and needs a real GPU (#53); this
  container is software-rendered, so the door is wired and the static checks
  above pass, but nobody has run it. That is rank 3's first act, not this
  row's.

### Scope, increment 3: the lines — shipped 2026-09-21 (#775 to #777)

Fourteen real `day0` sets in place of increment 1's stubs, and #752's rule held
by construction: not one of them is a word of day-one testimony. Hywel's is the
one that has to carry the day, because he is the reason to walk it.

| File | What changes |
| --- | --- |
| `dialogue/castle.dlg`, `data/npcs.json` | The fourteen sets, written in the .dlg and compiled. Fifty-seven lines against the file's 182: Hywel's own five, four or five each for the twelve, and one for the inspector — his `day0` set is unreachable, the way his own `default` already is, so it does not carry the same three-to-five floor as the thirteen who can be walked up to (#775). |
| `tools/dialogue.mjs` | One check-only `?` kind, `? frame <stage>`, rebuilt from `data/quest.json`'s stages whose `dialogueState` is not `default`, refused on drift and written back by nothing. That is #690's bargain unchanged (`\|` and `%` write; `@`, `:`, `?` and `!` are rebuilt and compared). It adds two lines to every block it reaches, not one: `explore` and `night` both name `day0`, so a `day0` block carries `? frame explore` and `? frame night` both (#776). |
| `test/dialogue.mjs` | The new kind, and its break. |
| `test/quest.mjs` | Section 4f: the leak rail, its own control, the token rail, station coverage and the no-line-repeats rail, all against `day0` (#775). |

### Acceptance, increment 3 — green, 15 of 15

- **`test/dialogue.mjs`**: extract then compile is a fixed point; every `day0`
  block carries both `? frame explore` and `? frame night` (#776, corrected
  from this section's earlier text, which named only the first); drift is
  refused. **Break**: delete the `? frame explore` line from one block and
  `npm run dialogue:check` exits non-zero naming the speaker.
- **`test/quest.mjs`**: no `day0` set contains a token (`{ACCUSE}` in
  particular); no `day0` line uses a word of the five things the walking day
  takes off the ground or of a death (#752), with the same word list run over
  the day-one `default` sets as a control so the list is proven to trip real
  testimony; every speaker with a day-0 station has three lines or more of
  their own, and the inspector, who has none, still carries the one line
  `validateAgainstNpcs` demands of every speaker (#775, corrected from this
  section's earlier "non-empty," which did not say how many); and no `day0`
  line is a line any other state already says. **Break**: put `{ACCUSE}` in
  the Constable's `day0` set and `validateAgainstNpcs` demands a stage in that
  `dialogueState` that runs `openAccusation`.
- A reading criterion no suite can hold, named here so it is not mistaken for
  one: none of the fourteen may say anything that only makes sense after the
  death, beyond the words the leak rail knows. The check is a person reading
  the .dlg's `day0` blocks top to bottom.

### Scope, increment 4: the day itself

The content, and the only increment that is large.

| File | What changes |
| --- | --- |
| `data/mystery.json` | `day0.schedule` stops being a copy: the twelve moving through four bells on the castle's own business, and Hywel's own four, ending at the Chapel Tower stair at the last bell so the night pane lands where the morning's body will be. |
| `data/populace.json` | Day-0 rings for the nineteen. The four watches' rings copied under the day-0 ids is the floor, because a walking day with no household in it is the emptiest the castle has ever been; the day-2 comment's own boundary ("nobody here has a Lauds stop") is the precedent for shipping without them and increment 1 takes it. |
| `data/npcs.json`, `src/lore.js` | If a sermon, a song or a chatter pair is wanted on the walking day, `indexPerformances`'s watch rail grows the day-0 list the way it grew `d2Watches`, and its condition rail is unchanged: `when`/`unless`/`knew` stay day-2-only, because a verdict is still a thing only the morning after has (#648). |
| `test/budget.mjs` | Section 3's loop covers the walking day's bells as well as the four, holding the per-ward peak to the same 20. Measured before the fact: the cast's own peak is outer 7 and inner 5, the household takes the outer ward to 18, and Hywel's lodge is outer, so the walking day peaks at 19 of 20 with the inspector not yet arrived. |
| `test/mystery.mjs` | The nine rails of increment 1 now run against a schedule that is not a copy, which is where they earn their keep. |

### Acceptance, increment 4

- `validateMystery` green over the real day-0 schedule, `validatePopulace` green
  over the day-0 rings, `test/budget.mjs` naming the walking day's own peak per
  ward. **Break**: put two bodies 1.4 m apart at `sext-eve` and the clearance
  rail names both. **Break**: give one of the nineteen a day-0 stop with no
  floor under it and `validatePopulace` refuses the page.
- What the walking day FEELS like is nobody in a container's to say (#53), and
  rank 2's sight bug bites hardest here (`BACKLOG.md`'s soft order).

### Open calls

Ten, each with a recommendation. Nothing below is a locked decision except
where it cites a number; #754, #755 and #756 are locked and are in
`HISTORY.md`.

1. **What the walking day is in data, and is day 0 a third branch or a
   generalisation?** *A `day0` block in `day2`'s shape, and a third branch.*
   `dayWatchesOf` is generalised because it is a list lookup keyed by a day
   number and there is exactly one of it; every other day-2 site keeps
   `onDayTwo()` untouched and gains an `onDayZero()` beside it. What stops the
   generalisation reaching day one is four things said out loud: `watches` is
   still asserted to be exactly four in `validateMystery`; `dayWatchesOf`'s
   non-four branches are keyed on the literals 0 and 2 and everything else
   falls back to the four; `repair` can only ever produce 0, 1 or 2; and
   `test/mystery.mjs` asserts `dayWatchesOf(m, 1)` and `dayWatchesOf(m, 7)` are
   both the four. A general `dayOf()` would have turned every existing
   `if (onDayTwo())` into a silent three-way, which is how a branch gets a
   meaning nobody wrote down.
   **The bell ids are the walking day's own**, four of them, `prime-eve` to
   `vespers-eve`, because `castleNav` keys its points `npc/watch` and
   `stationOf` dispatches on the id: reusing `prime` would make one key mean
   two stations and force a day argument through `nav.at` and every caller of
   it. The HUD's name for them comes from `mystery.watchLabels` ("Prime, the
   eve"), because "Prime-eve" on the tracker is a lie about a liturgical hour.
   **And what is on the ground is a list of what IS there** (`day0.evidence`,
   six ids), not a list of what is gone: reading 3 above is why.
2. **How the mode is saved.** *The existing `day` field, a third value, no
   version bump* (#754). #702's line points this way and no version-6 save can
   carry `day: 0`, so `migrate` has no drift to be honest about. The row still
   holds lane A, because the lane is the file and this writes it (#602). The
   consequence is taken deliberately: with the walking day as the day BEFORE,
   the day is what tells the two apart and a `mode` field would be a second
   name for one fact. `BACKLOG.md`'s and `ROADMAP.md`'s "version 7" are
   corrected with this.
3. **What carries across the night, and what refuses to.** *Everything except
   the mystery's own state, and there is none of it to carry.* One slot, one
   key, one `state` object: `visited` (the map is filled in by walking),
   `read`, `quests`, `reputation`, `riddleWrong` and `player` all survive,
   because every one of them is a fact about the player rather than about the
   case. `clues`, `pressed`, `taken`, `accusations` and `locks` are
   empty on the walking day by construction, which is what makes the
   incoherence rail in `repair` simple: a `day: 0` carrying a clue or a verdict
   is a save that says the mystery happened before the day before it, and it
   reads as day one.
4. **How the player gets into the mystery, and is it offered from the start
   panel?** *The last bell offers the night; the panel offers the day of the
   death as a second button; and both are one dispatch, `day:1`* (#755). What
   offers the night is the fourth ring, which is the mystery's own shape
   (its fourth ring returns a `demand` and the frame moves): `ring()` returns a
   `night` effect, `explore`'s `bell:4` moves to `night`, `showNight` puts up
   the pane through `ui.showEpilogue` (which already frees the pointer and
   already carries the errand line), and its button dispatches `day:1`.
   **Yes to the second button, and it is not left out by accident.** The reason
   is not taste: four browser suites click the panel and two drive the page
   directly, and every one of them is about day one. If the only way in is four
   rings and a pane, the mystery's own rails wait on the walking day's content
   for the rest of the project. The button is the seam that keeps them
   independent, and `enterMystery()` is that seam for the two that never click.
   **The player is not moved by the night.** `state.player` is where he stood
   at the last bell and he wakes there; the pane says so. Teleporting him would
   be a new effect and a new spawn rule for one sentence of fiction.
5. **Loop the day, or run it once into the night?** *Once.* The theme
   recommended a loop so that the twelve could all be met; the lead's call is
   once and it stands, because a day before a death is a day that ends and
   because the loop's own reason is gone: on the walking day nobody is in the
   castle at one bell only, since `day0.schedule` is written for it rather than
   inherited. The last ring moves no watch, rings `bell:4`, and returns a
   `night` effect, which is exactly what the last ring of the other two days
   already does with `demand` and with nothing.
6. **Where the twelve's day-0 lines live, and how the .dlg carries them.** *In
   `data/npcs.json` as a `day0` dialogue state, reached by the `explore`
   stage's `dialogueState`, with the .dlg carrying them as `|` lines it already
   knows how to write.* The theme's `day0.lines` in `data/mystery.json` would
   have made the compiler learn a second write target and made `_linesFor`
   learn a second day; this makes both changes zero. It also gets the errands
   for free, because `_syncStates` already layers a quest's state over the
   stage's, so an errand in progress speaks on the walking day, which is right:
   the errands are the castle's and not the mystery's (#550, question 6).
   The .dlg grows one check-only kind, `? frame <stage>`, which sharpens #690
   rather than amending it: the rebuild set grows, the write set does not.
   **The talk-again pool comes later and is free**: a `day0-<bell>` state per
   person, picked by `_linesFor` when the day is 0 and the bell has one, and
   the .dlg carries those the same way.
7. **The word-lock on the walking day.** *Not offered; the leaf answers with
   `ui.quiet`.* The word over the muniment door guards the ledger that is the
   motive for the full ending, and a day before the death that can open it
   lets the mystery start with the room already unlocked and `word-lock`
   permanently unholdable, because `locks()` stops offering an opened leaf. The
   press is not dead, which is what `data/quest.json`'s `arrive` comment cares
   about (a door that does nothing reads as a broken door, found by
   `plan-vs-scene` pressing E at it before meeting anybody): it toasts a line.
8. **Hywel's entry, and which rails have to learn him.** *A fourteenth `cast`
   entry with `arrives: 0`, meaning the walking day and no other day, plus one
   new predicate.* `beforeDayOne(npc)` is `(npc?.arrives ?? 1) < 1`, exported
   from `src/mystery.js` beside `arrivesLate`, and the rails that have to learn
   it are exactly four: `validateMystery`'s day-one schedule loop
   (`src/mystery.js:490`), which refuses a day-one schedule for him and a
   missing day-0 one; and three in `src/lore.js`, the chatter speaker rail
   (line 86), the performance speaker rail (line 189) and the line-attribution
   index, each of which asks "is this one of the existing twelve" and today
   asks it as `> 1`. Each keeps its existing message for the inspector's case
   and gains a second for his, so `test/lore.mjs:208` and `:270` are untouched.
   Two rails that already do the right thing and need no change, said out loud
   so nobody changes them: the accusation panel filters `arrives === 1`
   (`src/quest-manager.js:708`), so a dead man is not accusable of his own
   murder; and `npc.js`'s `get active()` hides a body with no station, so he is
   not a prompt over an empty patch of chapel on day one (#538).
   **Body and tint**: `Farmer.glb`, which two of the cast wear, tinted
   `#7a6a52`. No asset is fetched and `npm run assets:encode` does not run.
9. **What the HUD says on a day with no case.** *The objective is the theme's
   own line and the four `ui` lines the walking day can reach are unchanged,
   plus one new one.* `ui.quiet` is the answer to E at any of the six
   examinables ("You are a clerk with nothing to look for. Not today."), and it
   goes in `UI_LINES` so `validateMystery` refuses a walking day without it.
   The theme recommended leaving the Constable's `{ACCUSE}` line alone; that is
   overruled and costs nothing, because his `day0` set replaces the whole of
   `default` and the token is in `default`.

10. **What the walking day's light is.** *The same light, said once, as an
   alias rather than as four copies.* `mystery.watchLike` maps each day-0 bell
   to the hour it borrows a sky from, `applyWatch` hands the resolved id to
   `onWatch`, and `src/main.js` calls `setWatch` with that. The alternative was
   four `lighting.watches` blocks copied into `data/scene-config.json`, and it
   is refused for two reasons: it duplicates five numbers per bell that nothing
   would ever keep in step, and it would put this row in **lane B** beside
   rank 4's retro castle, which #753 promised it would not collide with. A day
   before that wants its own weather un-aliases one bell and writes one block,
   which is the same edit in reverse. `src/scene-setup.js` is untouched: it
   still returns false for a watch it has never heard of, and
   `test/layout.mjs`'s rail is still the thing that catches a bell whose ring
   would change the HUD and not the light.

### Dependencies

- **Lane A** for `src/save.js` (the clamp and the catalog, not the version) and
  **lane D** for `src/main.js`: one line in increment 1, the UI-flow region in
  increment 2. One row per lane at a time (#602), so nothing else in A or D
  runs beside it. **Not lane B**, and that is a decision rather than a
  coincidence: open call 10 keeps the walking day's light out of
  `data/scene-config.json`, so this row and rank 4's retro castle can run at
  once, which is what #753 already claimed and what would have stopped being
  true if four `lighting.watches` blocks had been copied in.
- Nothing is gated on this row and this row is gated on nothing. **Rank 2's
  sight bug is a soft order, not a gate** (#753): it bites hardest in a day
  that is nothing but walking up to people, so this row's GPU look wants it
  fixed first, and no Node or headless criterion above waits on it.
- **The texture-variety row is not a gate** (#750, question 14). If it lands it
  goes before increment 3's lines and not before increment 1's engine.
- `npm run dialogue:compile` runs in increments 1 and 3, and `npm run
  dialogue:check` is what says the two halves agree (#687 to #690).
- Not beside anything else that writes `data/mystery.json`, which today is
  nobody, or `data/npcs.json`'s `cast` block, which is **lane C**: increment 1
  adds the fourteenth entry, so rank 6 and rank 10 are out for that commit.

### Constraints

- **#36, #413.** The key is `castleConundrumSave_v1` and does not move.
- **#37, #702, #754.** `migrate` is for drift and there is none; the version
  stays 6 and `repair` learns a better question, which is the side of the line
  #702 drew for exactly this.
- **#39.** The day-0 save is asserted in `test/save.mjs` because a reload has
  to survive it; the prompt string, the panel's two buttons and the night pane
  are asserted against the DOM because they just happened.
- **#529.** Nothing crosses the line. `test/mystery.mjs` owns the day-0
  stations, the walk into the night and the engine's own answers;
  `test/layout.mjs` owns the sky per bell and the `undoDay` round trip, both
  derivable from the data and the plan in Node; `test/plan-vs-scene.mjs` owns
  the live prompt string and the panel, neither provable in Node;
  `test/quest.mjs` owns the graph and `index.html`; `test/save.mjs` owns the
  clamp.
- **#611, #756.** The body ceiling is renegotiated once, from 32 to 33, argued
  in `HISTORY.md` with both numbers, and `budget.mjs` and `layout.mjs` share
  no assertion.
- **#533, #699, #701.** `watches` is still exactly four; a day reads whichever
  list it names; a day numbers its rings within its own list, so the walking
  day borrows the four ring characters and writes nothing into
  `data/sounds.json`.
- **#539, #540.** The overlay lives in `data/mystery.json` because what decides
  it is which day it is, and it may only ever give the player castle. The
  walking day's block is empty, so the property holds trivially and
  `undoDay`'s round-trip rail is what keeps it honest when it stops being
  empty.
- **#534, #538.** The thirteenth's shape is the fourteenth's: `arrives`, a
  station list that does not cover every day, and a hidden body that offers no
  prompt.
- **#550 question 6, #576.** The errands never touch the mystery, which is why
  they run unchanged on a day that has none.
- **#594.** A performance is heard once per page, and the walking day does not
  change that.
- **#660, #661.** The night pane goes through `ui.showEpilogue`, which frees
  the pointer, and the second start button takes it the way the first does.
- **#690.** The .dlg's bargain is unchanged: the write set is still `|` and
  `%`, and `? frame <stage>` is rebuilt and compared like every other
  annotation.
- **#715.** The prompt fix ships in increment 1 and is asserted in increment 2.
  The `read` verb has the same bug (`Press E to read the A gravestone in the
  chapel floor`); the same one-word fix applies and the document titles are
  what read badly after it, so that half is named here and left to whoever
  gives the thirteen documents a prompt name.
- **#34, #13.** Every rail above names its break, each run from green, each
  FAIL line quoted in `HISTORY.md`. No skip list.
- **#53.** Nothing above claims a look. Whether "Prime, the eve" fits the
  tracker, whether the panel's two buttons read as a choice, and whether a day
  with no case is worth walking are all the GPU run's and Devon's.
- **#632.** CRLF here, LF in CI. `data/scene-config.json` and
  `dialogue/castle.dlg` are both written by tools that take the newline from
  the file.

---

## Sight at the body's own height

**Rank 2 since 2026-09-21, when the walking day took 1 (#753). Size ¼. Opus 5. Container. No gate, no lane. Filed 2026-09-21 from
the third GPU sitting's second run** (log: `npm run play`, run 2, on the RTX
3070 Ti). Nothing is decided in this section; the session that ships it
claims the numbers.

**The line-of-sight test aims at fixed world heights, so nobody above the
ground floor can be talked to from beside them, and one of them can be talked
to from 8 m below.** In `src/interaction.js` as it stands:

- line 34, `const SIGHT_HEIGHTS = [1.55, 1.15];`, under a comment (lines 29
  to 32) that calls them "two sample heights on the NPC's body". They are not
  on the body. They are world y.
- line 210, `_target.set(at.x, target.focus ? at.y : h, at.z);`. A target with
  a `focus` is aimed at its own height; a target without one is aimed at
  y 1.55 and 1.15 wherever its feet are.
- line 47, `aimAt` returns `target.group.position` when there is no `focus`,
  which for an NPC is his feet.
- line 151, `to.y = 0;`. The range test is horizontal only, so a body 8 m
  overhead is "0.3 m away".

**What run 2 measured.** The sentry at Terce is due at (-18.0, -15.0) on
level 2, the north walk, feet at y 8.0. The player stood 0.2 m from him on the
walk at (-18.1, -14.8), pointer locked, and the prompt was null: both rays go
from an eye at 9.7 down to y 1.55 and 1.15, through the walk's own floor.
Headless, 0.3 m from him, both rays hit the walk. The porter at Vespers, body
at (-0.8, 8.0, 0.3) on the cross-wall walk, player at (-1.2, 0.6) on level 2,
0.6 m: prompt null. **And the other way round**: run 1, when the suite still
walked the porter on the ground, passed his Vespers beat from under the walk,
because from an eye at 1.7 the rays to y 1.55 run level and nothing is in the
way. The porter's admission is a premise of the full ending, so run 2's
accusation selected 2 of 3, the ending was wrong, and the run aborted at the
second-day button. **Apart from #714's five checks and #659's journal number,
this is what stands between `npm run play` and exit 0.**

**Who it bites.** Seven station-watches: the Lady in the royal apartments
(level 1, feet 4.0) at Prime, Terce and Vespers and at Lauds on day two; the
sentry on the north walk (level 2) at Terce and Sext; the porter on the
cross-wall walk (level 2) at Vespers. The populace's upper-storey stops ride
the same line 210: the archers on both walks, the serjeant and the man-at-arms
in the dormitory, the maid in the royal apartments. Their label never shows.

**Why the Stockhouse bar and the tally stick passed on the walk** (1.75 m and
2.81 m in run 2). Every prop target carries a `focus`: `locks()`, `bells()`,
`evidence()` and `readables()` in `src/castle-builder.js` (lines 799, 820,
858, 889) each set it to the plan box's centre in world coordinates, so line
210 takes `at.y`. The bug is NPC-only for the rays. Line 151's y-blind range
applies to props as well, and nothing has yet been seen offered from below.

**The Node half has the same blindness.** `nav.talkable` in `src/stations.js`
(lines 106 to 121) counts a station as reachable from a cell on any of
`plan.levels`, so the validator's rail (`src/mystery.js` lines 539 and 623)
would pass an upstairs station with only ground cells under it. Measured
today over 115 station-watches: every one also has a cell on its own storey
(the sentry 0.35 m on level 2, with a ground cell 0.79 m away; the Lady 0.25 m
on level 1, a ground cell 0.25 m away), so tightening it turns nothing red on
the data as it stands.

### Scope

| File | What changes |
| --- | --- |
| `src/interaction.js` | Line 210 aims a target with no `focus` at `at.y + h`, feet plus 1.55 and 1.15. `update()` gains a storey gate beside the range test at line 151, for targets with no `focus` only: skip when `Math.abs(at.y - (camPos.y - EYE_HEIGHT)) > STOREY_REACH`, with `STOREY_REACH = 2.0` named beside `INTERACT_RANGE` and `EYE_HEIGHT` imported from `src/castle-plan.js`. The comment over `SIGHT_HEIGHTS` is rewritten to say they are offsets from the feet and what they used to be. |
| `src/stations.js` | `talkable(point)` asks `walk.fromSpawn(x, z, point.level ?? 0)` and stops looping `plan.levels`. The #523 comment there says why every storey was looped; it gets a line saying the loop was the same y-blindness as `interaction.js`'s. |
| `test/mystery.mjs` | One rail on `nav.talkable` itself, and the counts the page beat leans on (acceptance below). |
| `test/plan-vs-scene.mjs` | One beat: every upstairs station is talked to from its own storey and not from the storey below. |

Not in scope: `test/play-castle.mjs` (rank 2's own file; its porter beat
already walks him on level 2), `data/` (no station moves), `src/save.js`, the
populace, and the props.

### Acceptance

**Which suite, per #529.** Whether the prompt appears is
`InteractionSystem.update` casting rays against the built mesh tree, and
whether a ray clears the walk's deck depends on geometry that only the page
builds. None of that exists in Node, so the beat goes in `plan-vs-scene.mjs`
and is not a violation of "nothing it asserts may be provable in Node". What
Node can prove is the plan arithmetic the beat stands on, and `mystery.mjs`
owns the stations, so that half goes there. The formula "feet plus 1.55" is
asserted nowhere on its own: a Node test of it re-implements line 210, and a
test that re-implements the thing it checks is not a check (#34), the same
answer "The red suite" gave for `AIM_DOT`.

**`test/plan-vs-scene.mjs`, the beat.** For each of day one's four watches,
`window.__quest.applyWatch(watch, { walk: false })`, then park the rings with
`window.__populace.setWatch(watch, { walk: false })` (#724). For every
station in `mystery.schedule` at that watch with `level > 0` and not
`asleep` (six today):

1. **Its own storey.** Up to 12 cells from `grid.rooms()` on the station's
   level, 0.9 to 2.8 m from it horizontally, nearest first; camera at
   `cell.h + EYE_HEIGHT`, yawed at the body. Passes when any cell's prompt
   names that NPC. The failure prints every cell and what it offered (#723's
   shape).
2. **The storey below.** Every cell on a lower level within 2.8 m
   horizontally, aimed the same way. Passes when none names that NPC.

**`test/mystery.mjs`, two rails.**

- `nav.talkable({ ...the Lady's Prime station, level: 2 })` is false. The
  royal apartments' tile has cells on levels 0 and 1 within 3.2 m and none on
  2, so this is a station with ground under it and no floor of its own.
- The upstairs list the page beat walks is non-empty at every watch that has
  one, and each entry has at least one own-storey cell in 0.9 to 2.8 m and at
  least one lower-storey cell within 2.8 m. Without the second half, half 2
  of the page beat asserts nothing (#147). Today: the Lady's lowest cell is
  on level 0 at 0.25 m, the sentry's at 0.79 m, the porter's at 0.35 m.

**The breaks (#34), each from a green baseline, each with its message
quoted in the report.**

- Put back `target.focus ? at.y : h` at line 210. Half 1 goes red for all six.
- Put back line 210 and remove the gate: that is `main` today. Half 2 goes
  red for the porter at Vespers, which is run 1's pass from the ground.
  Expected for the Lady from the King's Hall below as well; not measured.
- Remove the gate alone, keeping the new rays. Report what half 2 does. If it
  stays green, the walk's deck is what blocks at all six today and the gate is
  kept anyway (open call 4); say so in the gate's comment rather than claim a
  red it never showed.
- Put back the `plan.levels` loop in `talkable`. The first Node rail goes red.

`npm test mystery plan-vs-scene` first, then all fifteen. **Past that, the
proof is rank 2's**: the sentry at Terce and the porter at Vespers passing on
the GPU, and the accusation selecting 3 of 3.

### Open calls

1. **Where do the rays go: feet plus a constant, or the body's bounding
   box?** *Feet plus 1.55 and 1.15.* `group.position.y` is the feet and
   `plan-vs-scene.mjs` already holds it to the station's floor at 0.01 m,
   while `Box3.setFromObject` over a skinned body is a tree walk per
   candidate per frame and moves with the clip.
2. **Does the player's end of the ray need changing?** *No.* It is
   `camera.position`, which is world y already; `src/main.js` line 387 finds
   the player's storey from the same `camera.position.y - EYE_HEIGHT`.
3. **Do the props share the bug?** *Not the ray half, and leave the range
   half alone in this row.* All four prop kinds aim at their plan-box centre,
   which is why the bar and the tally passed on the walk; a prop lies 1.5 to
   1.7 m under the eye, so gating them would need a second number, and
   nothing has been seen offered from below.
4. **Is a storey gate owed, or do the rays suffice?** *A gate, 2.0 m on the
   feet, NPC targets only.* From an eye at 1.7 to a chest at 9.55 the ray
   crosses the walk's floor 80 % of the way along, so a player within about
   0.6 m horizontally of the deck's edge, at the 3.2 m range, can see past it;
   2.0 m is half the 4.0 m storey, so any other storey is out by 2 m and a
   body half a flight away stays in.
5. **Should `nav.talkable` go storey-strict too?** *Yes.* It is the same
   y-blindness in the validator, and 0 of 115 station-watches lose their
   verdict today.
6. **Should the page beat sweep the populace's upstairs stops?** *No.* They
   go through line 210 and are fixed by construction, labels are not
   something the player presses E at, and a walking ring is the timing trap
   #724 had to park.
7. **Should it sweep day two's Lady at Lauds?** *No.* It is the same station
   as her day-one three, and putting the page at day two costs a verdict;
   say so in the beat's comment.
8. **Model and size.** *Opus 5, ¼, class S.* About fifteen lines of `src/`
   and two beats, but the breaks above need judging, not only running.

### Dependencies

- **Rank 2, the GPU run, is gated on this row.** Its next sitting should
  start from a `main` that has it.
- No lane: `src/interaction.js`, `src/stations.js`, `test/mystery.mjs` and
  `test/plan-vs-scene.mjs` are in none of A to E.
- **Not beside "The red suite"'s increment 3**, which writes `validateMystery`
  and `test/mystery.mjs` too. Not beside a rank 6 increment that edits
  `src/interaction.js` for the populace's labels; check its branch first.
- Its own `git worktree` (ROADMAP §3).

### Constraints

- **#529.** The prompt beat is page-only; the storey arithmetic is
  `mystery.mjs`'s. Nothing moves across the line.
- **#34.** Four breaks named above.
- **#147.** The comment over `SIGHT_HEIGHTS` said "on the NPC's body" and
  was wrong before any assertion was.
- **#53.** The headless beat places a camera and reads a string; it is
  geometry, not timing. What a hand on a mouse gets is rank 2's.
- **#13.** No skip for the Lauds station or the populace: they are out of the
  sweep by reason, written in the comment.
- **CRLF here, LF in CI** (#632).

---

## The GPU run

**Rank 2. Size ¼. Its gate is the new rank 1, "Sight at the body's own
height," filed 2026-09-21** (see SPECS.md above). `npm run play` is 102
assertions and a numbered screenshot per beat into `shots/play/`. It has now
been run on a machine with real compositing six times over three sittings
(#624 to #630 on 2026-09-17, #708 to #715 on 2026-09-19, #734 to #741 on
2026-09-21), and the sixth run reached the accusation for the first time. The
ending it reached was wrong.

**The judgement half of this row is done. The walk half is most of the way
there.** The second sitting answered every render question the list below
carried, the twelve at Vespers, the Lauds sky, the covered hall, eleven
bodies at interact range, by putting the world at a bell with
`applyWatch(watch, { walk: false })` and photographing it, which is how rank
5 answered its two (#656 to #658). The third sitting's first run confirmed
rank 1's walker on a GPU for the first time: the day passed the second bell,
the reload at Sext, the riddle, the third ring and the cook's walk (#734).
Six fixes to `test/play-castle.mjs` then carried the second run to the
accusation (#735 to #740), where the sentry and the porter went unread and
the ending came out wrong (#741). What is left is `src/interaction.js`'s
sight rays, which the new rank 1 above owns, and the run that confirms the
fix once it ships (#53).

**Rank 3, the preview and og card that used to sit under this same section,
shipped on 2026-09-17** (#634, #635) from a fallback frame rather than the run
this section still asks for — see `HISTORY.md`. Its own scope, acceptance,
open calls and dependencies are gone from here with it; what is left below is
rank 2's alone.

### Scope, the run

- **Nothing in `src/`.** The run is the deliverable. `test/play-castle.mjs` is
  the only file this row may change. It changed by 67 lines in two helpers on
  2026-09-19 (#708, #709: `present()` runs the dialogue box out the way
  `converse` does, and `hike` clicks the resume panel when the browser has
  refused a relock) and by 163 lines added, 42 removed, in six places on
  2026-09-21 (#735 to #740): `shutPresent()` closes the Present list and the
  dialogue on every path out of `present()`, not only the success path; a
  walk to another storey uses Phase 5's own stair legs instead of counting a
  waypoint reached by x and z alone; `examine()` passes the target's own
  level instead of always 0; `walkTo` turns to face a target before reading
  its prompt; the Constable-visible check walks to range before it casts its
  ray; and `snap('twelve-at-vespers')` routes to the hall before it shoots.
  All eight of those had been read as `src/` bugs before.
- ~~The `snap('twelve-at-vespers')` beat~~ was routing straight across the
  inner ward into a wall; **fixed 2026-09-21** (#740), it now walks to the
  hall first and reads 72.7 of 255 from the floor there. **Do twelve read as
  twelve? No: two of them do not** (#711). The Constable and the Steward are
  one white-haired man in a black tunic, told apart by a red collar and a
  green one, and past about three metres there is nothing to tell. The three
  women are the clearest bodies in the castle and the lesson is that
  silhouette works where tint does not.
- **`HISTORY.md`** records what the run said, beat by beat, and what was seen:
  the walk on the Kitchen Tower flights (Phase 5's 5.7, 9.7, 1.7 readings), the
  cross-wall crossing, the cook's walk from kitchen to hall, the reload at
  Sext, and now the accusation itself and the ending it produced. A beat that
  fails on a GPU is a bug; a beat that failed under software rendering and
  passes here was never one.
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
  failing beat named and filed as a new backlog row. **Met on 2026-09-19,
  four times, and again on 2026-09-21, twice.** The third sitting's run one:
  exit 1, 164 ok, 19 failures, aborted at the Constable at Vespers. Run two,
  after the six suite fixes: exit 1, 179 ok, 17 failures, reached the
  accusation and aborted on the wrong ending's `#restart-button`. The cause
  left in front of exit 0 is filed as the new rank 1. **The six suite fixes
  changed no `src/` behaviour and are not what stops exit 0**: what stops run
  two is `src/interaction.js`'s fixed sight heights, which nothing in
  `test/play-castle.mjs` can fix.
- ~~`shots/play/` contains the numbered set, `twelve-at-vespers.png` among
  them~~, **and a human has looked at it and written one sentence per body:
  told apart or not.** Both halves are done now: #711 wrote up the twelve
  from a hand-run look before the walk ever reached that beat, and the
  routing fix (#740) got the walked, numbered set past it on 2026-09-21.
- No new guard-rail: the run is the check. The `snap` beat is a screenshot, not
  an assertion, and says so in its comment.

### Dependencies

- **Gated on the new rank 1, "Sight at the body's own height"** (filed
  2026-09-21). The third sitting's run 2 could not talk to the sentry at
  Terce or the porter at Vespers from beside them on the walks, the ending
  came out wrong, and the run aborted at the second-day button. Run again
  once that row is on `main`.
- The run needs a machine with a GPU, which is Devon's; a session can add a
  beat and cannot run it. If a session is asked to take the run without one,
  the honest output is the beat and a note, not a claim.
- ~~The fourth body is still owed the run's photograph~~ (#606). **Taken**
  (#711): Marged, Nest and Lady Alys are in `shots/look2/`, and `Woman.glb`
  does the job the tint was being asked to do.
- **Rank 1, the walker on the stair, shipped 2026-09-19 and is now confirmed
  on a GPU** (#716 to #720, #734, #736). `hike` no longer drives the player up
  the Chapel Tower ramp, and the third sitting's first run carried the day
  through Sext on that fix without incident. A second, similar waypoint bug
  in the suite's own storey-change check, not `hike`, was found and fixed the
  same sitting (#736).
- The journal beat's walk assertion (#659) has now run on a GPU five times:
  0.69, 1.30, 0.51, 0.69 and 0.83 m against its `> 1.0` threshold. It is
  measuring the chapel's geometry more than it is measuring the pointer. What
  to do about that is a decision about what the beat is for, and it is left
  open rather than guessed at.

### Constraints

- #53 (the whole point of the row).
- #34 does not apply: no rail is added.

---

## The retro castle: the stone in the castle's own pixel art

**Rank 4. Size 2+. The first increment shipped on 2026-09-21** (#757 to
#766). Devon's brief of the same day: the castle reads as the same
everywhere, and he wants pixel-art textures produced by a model session
rather than photographs, for variety room to room and for a retro look, a
style call before a cost one. That reverses #411, which put photographic
stone on the walls, and the reversal is locked as #742; the provenance rule
for a texture this repo draws is #743; the row's rank, lane and the shape of
its cost rail are #744. What shipped, and the ten open calls it answered,
are below; the second and third increments wait on the look (#53).

**What was there before the swap, measured on 2026-09-21.** Fifteen material
sets under `assets/poly-haven/`, 1024 px, three maps each, KTX2 since #506,
about 25 MB on disk. By their own KTX2 headers (pixels per mip level times
0.5 bytes for
ETC1S and 1 byte for UASTC) they hold **44.2 MB of the 79.3 MB** of texture
memory the castle carries, and that estimate is exact: the same arithmetic
over every `.ktx2` on disk gives 79.3 MB, which is the number #506 measured
off `renderer.info` on the live page. The ten prop packs are the other
35.1 MB. The fifteen dress 46 wall runs (five names: `castle_wall_slates` 22,
`medieval_blocks_02` 13, `plastered_wall_04` 8, `old_planks_02` 2,
`defense_wall` 1), the eight drums (two names and eight tints, #516), 32 room
floors (seven names: `wood_planks` 10, `wood_floor_deck` 8, `old_planks_02`
5, `stone_pavers` 5, `rock_tile_floor` 2, `floor_tiles_02` 1, `dirty_carpet`
1), four grounds, the walk's decking and the gate leaves. That is the "same
everywhere" in numbers: 22 of 46 runs are one slate and 18 of 32 floors are
two planks, and a set costs about 3 MB of video memory, which is why there
are fifteen and not forty.

The Kenney kit beside them is the other look already: ten 64 px PNGs, drawn
as pixel art, declared `KHR_materials_unlit` in every GLB so GLTFLoader gives
them `MeshBasicMaterial`, magnified NEAREST by `tuneTexture` (128 px and
under), and left out of the encoder by size (#508). #630 saw the two as two
games from a tower top. This row makes the built stone the kit's kind of
surface, at a little more than twice the kit's texel density: 128 px over
the 3 m repeat #434 set is 43 texels a metre against the kit's 16 and Poly
Haven's 341.

**The shape of the row: three increments, and a look between the first two.**

1. **Shipped** (#757 to #766): the pipeline, its rails, and fifteen
   textures, one per existing material name, so the castle is whole in the
   new look on one GPU sitting and not one wall at a time. A container
   closed it: no `ktx`, no network, no GPU. **Then somebody looks** (#53),
   with the checklist at the end of this section — nobody has yet.
2. **Variety**: a wall and a floor per named room, about forty textures,
   against the texture ceiling below. Gated on the look, the way rank 11's
   second increment is.
3. **The props**, if the look says a photographed cabinet in a pixel room is
   the next wrong thing. Waits on the look saying so; "What shipped" below
   carries the recorded answer to each open call increment 1 raised.

### What shipped, increment 1

| File | What changed |
| --- | --- |
| `tools/pixel/index.mjs`, `tools/pixel/textures.json` (new) | The generator. Four or five families, each a pure function of its row's parameters and a seed to a 128 x 128 RGBA buffer, drawn on a torus (every coordinate modulo 128) so it tiles by construction: `courses` (slate, defense wall, brick, blocks, pavers, rock tile, floor tiles), `planks` (old planks, planks, deck, the gate), `ground` (grassy cobbles, forest ground), `plaster`, `weave` (the carpet). The table is fifteen rows, one per name in `data/scene-config.json` today. `npm run pixel:render` writes every row to `assets/pixel/<name>.png` through `sharp`; deterministic, hand-run, re-runnable, and a second run is a no-op at the pixel level. It lives under `tools/` and not `data/` for #688's reason: `vite.config.js` copies `data/` into `dist/` whole and the page never fetches a parameter table. |
| `tools/pixel/sheet.mjs` (new) | The human half of the review. Tiles every texture 3 x 3 at 4x into `shots/pixel/sheet.png` (gitignored, like every shot), so a seam and a read are one glance before the GPU look. Asserts nothing (#13 does not apply to a picture). |
| `assets/pixel/*.png` (new, fifteen files) | The output, committed (#493). A 128 px PNG at 32 colours is 2 to 8 KB on disk and 85 KB in video memory with its mip chain. |
| `assets/poly-haven/` | Fifteen folders deleted, the commit their names stop pointing at them (#390; git history is the originals, #506): `castle_wall_slates_1k.gltf`, `defense_wall_1k.gltf`, `grassy_cobblestone_1k.gltf`, `stone_pavers_1k.gltf`, `wooden_gate_1k.gltf`, `rock_tile_floor_1k.gltf`, `floor_tiles_02_1k.gltf`, `old_planks_02_1k.gltf`, `wood_planks_1k.gltf`, `dirty_carpet_1k.gltf`, `medieval_blocks_02_1k.gltf`, `castle_brick_02_red_1k.gltf`, `plastered_wall_04_1k.gltf`, `wood_floor_deck_1k.gltf`, `forest_ground_06_1k.gltf`. `test/assets.mjs` check 4 refuses a folder that stays. The ten prop packs stay. |
| `data/scene-config.json` (lane B) | `materials` (fifteen entries, three maps each) becomes `pixelMaterials` (the same fifteen names, one `map` each, an optional `roughness`), and nothing else in the file moves: not a run, not a room, not a tint. Spliced, never re-serialised (#584), with the file's own line ending (#632). |
| `src/assets.js` | `loadPBRMaterial` becomes `loadPixelMaterial({ map, roughness }, tint)`: a `MeshStandardMaterial` with `map` only, `roughness` from the row or 1, `metalness` 0, colour the tint or white (#516), through `loadTexture` and `tuneTexture` as now, so the map is NEAREST-magnified and trilinear-minified at 128 px with no new branch. `PIXEL_ART_MAX_PX` stays 128. `tuneMaterials` gains the kit override in open call 3. |
| `src/castle-builder.js` | `material()` reads `pixelMaterials` and `plainMaterials`. The `materials` branch goes with the section. |
| `tools/encode-assets.mjs` | `encodeMaterialMaps` is deleted: there is nothing left for it to encode, and a step that loops over zero entries is #13's shape for a script. The header says the pixel textures are exempt by the rule the kit already is (#508), and names the rail in `test/assets.mjs` that holds the exemption to a size. |
| `test/assets.mjs` | Check 3b, "every material is a complete set", retires with the section it asserted over. A new 3b over `pixelMaterials`: exactly one `map`, a `.png` under `assets/pixel/`, 128 x 128 by its IHDR, at most 32 distinct colours, wrapping at both edges, and pixel-identical to the generator's own output for that row. Check 4's sweep grows `assets/pixel/`. Check 3d's `known` set reads `pixelMaterials` where it read `materials`, one line, and still holds every built thing to a name that exists in either section. |
| `test/budget.mjs` | A fourth count, texture memory, from headers: for a KTX2, the sum over its `levelCount` of width times height at 0.5 bytes when `supercompressionScheme` is 1 (ETC1S) and 1 byte when it is 2 (UASTC); for a PNG, width times height times 4 times 4/3 for the mip chain. Over every image any loaded file names, the kit's ten included. One ceiling, `MAX_TEXTURE_MB`, in the ceilings block with the others (#609). |
| `CLAUDE.md`, `README.md` | The compression bullet gains one sentence (the exemption by size, and the rail that holds it); the credits gain one line for `assets/pixel/` (#743). |

Untouched: `src/castle-plan.js` (no transform moves, so `test/plan-vs-scene.mjs`
sees nothing, #500), `src/save.js`, `test/layout.mjs`, `data/sounds.json` (the
fifteen names do not change, so check 12's `byMaterial` holds as it is),
`test/built.mjs` (the served-set diff already covers a PNG under `assets/`, and
its `.ktx2` count stays above zero on the props), `test/play-castle.mjs`.

### Verified, increment 1

What the castle looks like is the GPU's (#53) and the checklist at the
bottom is still what to look for; nobody has yet. Everything below ran.

- `npm test` fifteen of fifteen, `npm run build` clean in 735 ms, `dist/`
  52.8 to 28.9 MB, the 23.9 MB of deleted sets and nothing else.
- **`test/budget.mjs`**: the texture count under `MAX_TEXTURE_MB`, recorded
  in `HISTORY.md` as **80.8 MB before, 37.9 MB after, over 70 images**. 79.3
  of the 80.8 is the `.ktx2` alone, matching #506's live measurement to the
  decimal — the calibration that says the estimator counts something real
  (#34) — and this row's own estimate of 79.3 before and about 36.4 after
  was 1.5 MB under both times, because the spec's arithmetic was over the
  `.ktx2` alone and the count as specified also takes the kit's ten PNGs
  (0.2 MB) and the hen's atlas (1.33 MB). **Broken on purpose**: the ceiling
  to 30 failed naming the three biggest images — the hen's atlas and the
  table's two maps, not a wall's, which the spec had guessed wrong; and the
  count run with the fifteen PNGs added and the fifteen sets still on disk
  and still named came to **82.1 MB against the 64 MB ceiling**, the rail
  that refuses "supplement" (open call 1). Keeping only the normal and the
  arm map, the cheaper version of the same mistake, is 72.6 MB and fails too.
- **`test/assets.mjs`** new 3b, six breaks from green, each named by the
  file: a PNG rendered at 256 px (the size); a stripe painted down a
  texture's last column, `castle_wall_slates.png` at 34.50 against a median
  interior column step of 6.51 (the wrap rule: the mean absolute difference
  between the last column and the first, and the last row and the first, may
  not exceed 1.5 times the median difference between adjacent interior
  columns and rows); `wood_floor_deck`'s seed changed in `textures.json`
  without a re-render (pixel identity, naming the row); a jpg copied out of
  git history into `assets/pixel/` and named (size and colour count both —
  32559 colours, over 32); a `map` pointed back at
  `assets/poly-haven/wood_planks_1k.gltf/...` (location); and a
  `pixelMaterials` entry with a `normal` beside its `map` (one map). Two
  breaks changed the code rather than just proving it (#147): the jpg's
  magic bytes were rendered as latin1 in the failure message and now print
  as hex, and a KTX2 fed to sharp threw a stack trace instead of naming the
  file, so the decode is guarded now.
- **`test/assets.mjs` check 4**: one of the fifteen folders left on disk with
  nothing naming it, `plastered_wall_04_1k.gltf` restored with nothing
  referencing it, which is the existing rail firing on this row's deletion
  (#390).
- **`test/plan-vs-scene.mjs`'s drum beat still holds**: one map per material,
  each drum's map its own plan piece's. No new browser assertion, because
  nothing here is a seam Node cannot see except the look.

**The seam rule has a blind spot, and the generator worked around it rather
than the rule changing.** Check 3b compares the last column against the
first at 1.5 times the *median* interior column step, which is the rule
this section specified. A texture drawn on a torus can fail that while
tiling perfectly: a mortar course landing on row 0 makes the wrap pair one
of the loudest adjacencies in the image, exactly as any two adjacent rows
inside the tile are. Thirteen of the fifteen rows failed that way on the
first render — `wood_floor_deck`'s rows at 68.93 against a median of 1.41 —
so every family now phases its hard edges off the tile's own edge: a course
half a course down, a board gap half a board across, a weave cell half a
cell both ways, block and butt joints moved by `clearOffset`, and
`plaster`'s damp patches fall to zero at their own edge instead of replacing
what is under them. All fifteen are at or under 4.47 now. **The rule's
remaining sharp edge, for whoever writes increment 2**: a texture more than
half of whose adjacent column pairs are identical has a median of 0.00, and
then only a seam of exactly 0.00 passes — `old_planks_02` is at 0.20 and
passes with a seam of 0.00 today. A new row that trips this is an argument
for the architect, not a number to loosen here.

### The ten open calls, answered

Each was scoped here and taken as written by the builder; the number is
where it is locked.

1. **Replace the sets, supplement them, or replace Poly Haven's models
   outright? Shipped: replace the fifteen sets and keep the ten prop
   packs** (#757). Built geometry carries planar world-space UVs at a 3 m
   repeat (#434), so a tiling texture drops onto every run, drum, floor and
   ground with no UV work at all, which is the whole reason the swap was one
   sitting; a prop is a photoscanned model with authored UVs and its own
   three maps, and retexturing one is a modelling job this repo has no tool
   for. Supplementing was measured rather than assumed: keeping all three of
   the old maps beside the new one fails at **82.1 MB against the 64 MB
   ceiling**, and keeping only the normal and the arm map, the cheaper
   version of the same mistake, is 72.6 MB and fails too. **How many**:
   fifteen in this increment, because the names stayed; about forty are
   still expected in increment 2, one wall and one floor per named room, at
   85 KB each, against a ceiling with headroom to spare. The count was never
   going to hit the ceiling; the props are the 35.1 MB that could.
2. **Flat and unlit, or lit? Shipped: lit, diffuse only** (#758).
   `loadPixelMaterial({ map, roughness }, tint)` builds a
   `MeshStandardMaterial` with a `map`, `roughness` from the row or 1,
   `metalness` 0 and the tint or white as its colour (#516), not a
   `MeshBasicMaterial`. Unlit would have lost the sun per watch (#474), the
   shadows, the hemisphere fill #438 measured, the braziers (#610) and the
   Lauds question (#712) in one move, and this is a game whose clock is
   told partly by light. Six of the fifteen rows carry a `roughness`; the
   nine stone rows get the default of 1.
3. **The kit is unlit today; leave it, or relight it? Shipped: relight it,
   and the assumption behind that was checked first rather than assumed**
   (#759). Every Kenney GLB read — `battlement.glb`,
   `wall-fortified-gate.glb`, `column.glb`, `column-damaged.glb`,
   `detail-crate.glb` — does declare `KHR_materials_unlit` on every
   material, so GLTFLoader does hand back a `MeshBasicMaterial` and the
   relight held. `tuneMaterials` in `src/assets.js` swaps it for a
   `MeshStandardMaterial` over the same map (the texture object is reused,
   so `KHR_texture_transform`'s offset and repeat come with it), behind
   `RELIGHT_KIT` in `src/assets.js`, so every surface in the castle is one
   material model under one sun. Nobody has seen a lit merlon (#53);
   `RELIGHT_KIT = false` is the one-line reversal if one goes black the way
   the slate did (#438).
4. **Who generates, how, and what is reviewed before a texture is
   committed? Shipped: a program in the repo, not an image model** (#760).
   The session that authors a row writes its parameters into
   `textures.json` (and a family into `index.mjs` if none fits), runs
   `npm run pixel:render`, looks at `shots/pixel/sheet.png`, and commits the
   PNG with the row. `test/assets.mjs` re-renders every row in Node and
   holds the committed PNG pixel-identical to it, which is #743 as a check
   rather than a rule: an image-generation model's output fails that rail
   by construction.
5. **Size and palette. Shipped: 128 x 128 and at most 32 colours, both held
   as named constants in `test/assets.mjs`** (#761), declared in the suite
   and not read off the generator, so the suite fails if
   `tools/pixel/index.mjs`'s own `SIZE` disagrees with it — a rail that
   reads its subject's own constant is the check that re-implements the
   thing it checks (#34). The fifteen use six to nine colours of the 32.
6. **KTX2 or PNG? Shipped: PNG, and the exemption is a size** (#762).
   Pixel art at 128 px is 85 KB in video memory with its mip chain, and
   ETC1S carries two base colours per 4 x 4 block and would mangle a hard
   pixel edge. `tools/encode-assets.mjs`'s header states the rule as a
   size — 128 px or under is a PNG — and names check 3b as what holds it,
   so it cannot grow into a 1k PNG.
7. **Names. Shipped: keep the fifteen names in this increment** (#763).
   `data/sounds.json`'s `byMaterial`, the drum beat and the config's sixty
   references did not move, and `data/sounds.json` was not touched.
   Increment 2's new names will each need a `byMaterial` row, and
   `test/layout.mjs` check 12 is what will say so.
8. **Does this renegotiate a budget ceiling (#611)? Shipped: no, and there
   is a fourth count** (#764). None of the three existing counts moved: the
   outer ward still draws 993 meshes, the inner 643, the outside bucket
   131, three point lights, 32 bodies. `MAX_TEXTURE_MB = 64` joined them in
   the ceilings block, and the castle reads **37.9**.
9. **The props. Shipped: untouched** (#765). The ten packs are 35.1 MB of
   the 37.9 and the look is what says whether a photographed cabinet in a
   pixel room is the next wrong thing — increment 3, if it is.
10. **Tone mapping and the fill. Shipped: left for the GPU** (#766).
    `toneMappingExposure` and the hemisphere's 2.0 were not touched. They
    are two numbers on the looking checklist below and moving either from a
    container would be guessing at a look nobody has had.

### Dependencies

- **Lane B.** Increment 1 held it and released it. Rank 9's next increment,
  the quay, has no section yet and is not startable, so nothing else is in
  the lane today; when it is, the two do not run together.
- **Increment 1 needed no `ktx`, no network and no GPU**, the opposite of
  #518 and #541: a container closed it.
- **Increment 2 waits on the look**, the way rank 11 waits past its Node
  line. Increment 3 waits on the look saying so.
- Ranks 6 and 10 are untouched: the bodies carry no images but the hen's
  atlas, which the count counts and the row leaves.

### Constraints

- #34, #13, #147: every rail above has a named break, and a rail that
  cannot be broken is not shipped.
- #390 and #506: the fifteen folders leave in the commit their names do; git
  history is the originals.
- #493: committed, and nothing fetched off-origin. The generator runs in
  Node and never in the page.
- #508, as #742 restates it: a texture at 128 px or under is left out of
  the encoder, and the rail that says which is `test/assets.mjs`'s.
- #434: the repeat stays world-space at 3 m; a tiling texture is the case
  that rule was written for.
- #500: no transform changes. #516: a tint still multiplies the map.
- #529 and #611: the memory count is cost and goes to `budget.mjs`; the
  texture rails are `assets.mjs`'s; nothing crosses the four-suite line.
- #584, #632: `data/scene-config.json` is spliced, in its own line ending.
- #53: the look.
- #742, #743, #744, #757 to #766.

### Looking checklist

Nobody has seen any of this (#53). `npm run play`, or the `applyWatch` look
#711 used, on the dev machine, and write what was wrong rather than that it
was wrong, in `HISTORY.md` against this row.

- [ ] **One castle or two.** From the North-west Tower's roof, #630's own
      vantage: the crown's merlons (the kit) against the drum's stone and
      the curtain (this row). Does the seam between kit and stone still show?
- [ ] **The shadowed faces.** The cross-wall's west face and the Great
      Hall's north wall, which #438 and #713 measured near-black under
      photographic slate. A darker palette, or a hole?
- [ ] **A metre from a wall at a grazing angle.** 43 texels a metre, NEAREST:
      blocks, or a smear? Anisotropy is on; is the minified far wall a moire?
- [ ] **The four skies and Lauds.** The same wall at Prime, Terce, Sext,
      Vespers (#474) and on the morning after (#712): four bells, or one?
- [ ] **The eight tints** (#516) over pixel stone: still eight towers?
- [ ] **Under foot.** The ward's cobbles, the hall's tiles, the walk's
      decking, a tower's boards: does a floor read as its room's?
- [ ] **The props.** A photographed cabinet in a pixel room: the next
      increment, or fine?
- [ ] **The number.** `renderer.info.memory.textures` off the live page
      against `test/budget.mjs`'s estimate, written down beside it.
- [ ] **The two knobs.** `toneMappingExposure` and the hemisphere's 2.0: what
      the palette needs, if anything.

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
2026-09-17** (#616 to #618), rank 10 added a child, a hound and two hens to
the same file (#643, #684). **The second increment was specified on
2026-09-20** (#729 to #732) **and shipped the same day** (#733): five more
people, a `talk` list of three pairs, the talk rail wired to
`QuestManager`, and a budget that counts the household. What is left of
this row is below.

### What shipped

- **`data/populace.json`, fourteen bodies, and `src/populace.js`.** Ten people
  from #616, then the well-wife's girl, the Constable's hound (with `follow`)
  and two hens from rank 10. A routine is a ring per bell, one LIST of
  `{room, tile, activity, facing?}` per watch, walked round until the next
  bell, because the clock does not move between bells (#547, answer 3).
  `validatePopulace` asks the twelve's own five nav questions plus every leg
  of the ring and the wrap back to its first stop, and it checks the room
  with `roomAt` rather than `inNamedRoom`. `test/mystery.mjs` owns it (#529).
- **Twelve activities onto six clips**: the nine human jobs on three idle
  variants every human body ships, `sniff` and `eat` on the hound's rig and
  `peck` on the hen's. `ACTIVITY_CLIPS` in `src/populace.js` is the table,
  and `test/mystery.mjs` checks each person's jobs against the clips in that
  person's own `.glb`.
- **`label` on an interaction target** (#617): a populace body shows a name
  and a role on the HUD, E at one does nothing, and a label never takes the
  prompt off a suspect standing behind it.
- **Five more people, to 19 in `data/populace.json`, 32 bodies built,
  exactly `MAX_SKINNED_TOTAL`** (#729, #733): `page`, `sacristan`,
  `tiring-woman`, `watchman` and `writer`, placed per the table #729 set.
  Outer ward holds 17, 18, 17, 17 across Prime, Terce, Sext, Vespers; inner
  ward holds 14, 15, 14, 13. The maid's Sext stop in `inner-ward` is now a
  `gossip` stop, paired with the tiring-woman's. **The writer's Prime, Terce
  and Vespers stops fell back to `inner-ward`, `tend`** — the fallback
  #729 allowed — because all 8 floor cells inside the muniment's disc read
  as `kings-hall` under `roomAt`: that room has no walkable floor that
  counts as itself.
- **A `talk` list of three pairs, and the wire that plays them** (#731,
  #732, #733): `talk-prime-inner-ward` (`page`, `sacristan`),
  `talk-sext-outer-ward` (`baker-lad`, `well-wife`), `talk-sext-inner-ward`
  (`tiring-woman`, `maid`). `Populace.talkDue`, and `overhear`/`stopTalk` in
  `src/quest-manager.js`, share the `#caption` band, `_heard` and
  `_playing` with a performance, so there is one band and one clock; a
  performance always outranks talk. `src/main.js` constructs `Populace`
  with `talk` and `hush` callbacks and also passes `pairs:
  populaceData.talk`, an argument #729 to #732 did not name; `Populace`
  reads its talk pairs from it.
- **`test/budget.mjs` section 3** (#730, #733): counts a populace body in
  every ward any stop of its ring gives it, per watch, beside the cast's,
  and the total as every body `main.js` builds. It prints 32, not 12.
- **`data/npcs.json`'s `chatterComment`** no longer says the pool is for "a
  later populace row to spend", and `WISHLIST.md`'s matching line is
  corrected the same way, both pointing at #731. The pool itself is
  untouched and still unspent by the twelve.

### What the numbers are, now

- **Bodies built: 32.** 13 cast plus 19 populace, exactly
  `MAX_SKINNED_TOTAL`. `test/budget.mjs` prints this.
- **Bodies per ward, cast plus populace, a ring counted in every ward any of
  its stops is in and the hound in both:** outer 17, 18, 17, 17 and inner
  14, 15, 14, 13 at Prime, Terce, Sext and Vespers. The outer ward's peak is
  unchanged at 18 of 20; the inner ward's peak moved from 10 to 15 of 20.
- **The twelve's chatter pool still cannot be spent by proximity** (#731,
  unresolved): of `data/npcs.json`'s 27 `chatter` pairs, 0 have their two
  speakers within 3 m at the pair's own watch. The populace's own `talk`
  list is the three pairs above, a separate mechanism.

### Scope, what is left

- **The rest of the fifty waits on the town** (rank 9): more bodies, and
  whether `garden` becomes ground, is that row's call (#618, #703 to #707).
- **The ceiling stays 32 until a row renegotiates it, and the evidence it
  brings should be rank 2's `renderer.info`, not a second guess** (#609,
  #729). Instancing and animation LOD are the tools for that argument, not
  needed yet.
- **Four clips**, `sweep`, `stir`, `hammer` and `spar`, wait on rank 10
  shipping a clip for them.
- **The twelve's 27-pair chatter pool stays unspent.** Recommend a later
  lore or dialogue increment hold each pair to the schedule the way #592
  holds a performance, which is the pass #554 named and skipped: 5 of the
  27 survive a same-room rule as written, and the other 22 need a room and
  a bell somebody authors (#731).

### Dependencies

- **Nothing gates it.** Rank 10 unblocks the four deferred activities and
  this increment waits on none of them.
- **Lanes C and D**: `data/populace.json`, `data/npcs.json`'s comment and
  `src/main.js`'s one constructor. `src/quest-manager.js` is in no other
  open row's scope today.
- **Not `data/scene-config.json`**, which rank 9 holds in lane B.
- **Rank 2's GPU run** is what a later ceiling argument cites; this
  increment does not wait on it.

### Constraints

- #500: a populace stop is not a plan piece and has no `planId`.
- #529 and #611: the validator and `talkDue` in `mystery.mjs`, the band in
  `quest.mjs`, the cost in `budget.mjs`, and `plan-vs-scene.mjs` for the
  wire and nothing Node can prove.
- #13, #34: every rail above is broken from green and the failure quoted.
- #36, #39: talk is not saved and `SAVE_VERSION` stays 6.
- #724: the beat parks rather than waits, and `TOL` is not touched.
- #632: any new assertion over a data file's text reads both line endings.

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
**The town's first increment shipped on 2026-09-21** (#725 to #728): a street
of six houses and a church inside Mereford's wall, west of the town gate, seen
from the walls and entered by nobody. **What is next is the quay and the
river**, outside the west gate: see Open calls below.

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

**Shipped, #725 to #728.** The town is west of the `town-wall` run, not in
the strip between it and the barbican (#725). Its rooms go on the map in a
drawing of their own and out of the stood-in count (#726). What it draws is
held against both wards' ceiling (#727). And every room outside the curtain
is held to being seen from somewhere the player can stand, which is #703's
other half written as an assertion (#728). Everything below was prototyped in
Node against a clone of `data/scene-config.json` on 2026-09-21 before the
build; where the built numbers differ from the prototype's, the built number
is given and the difference is noted.

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
  at about `(-92, -12)` as its cross. Each clear of every run's box. The
  street's barrels ship at `rotationY: 0`, not the yard's arrangement's 30°:
  at 30° their box went 0.09 m into `mereford-house-s1`.
- **Two rooms, `ward: "outside"`, `level: 0`, `bounds` in world metres, no
  `floor`**:
  - `mereford-street`, name `"Mereford's street"`, bounds x -95..-66,
    z -9..9: the road inside the east gate and both rows of houses.
  - `mereford-church`, name `"Mereford church"`, bounds x -106..-80,
    z -26..-10: the church and its yard.
  - `town-tree-3` (-80, 12) and `town-tree-4` (-108, -8) stay where rank 5 put
    them and are now inside the wall. Neither is in either room.
- **Cost, measured**: the outside bucket goes from 44 meshes to 131 (the
  prototype's count was 132; its four ground props measured 7, the shipped
  ones 6). A solid house is one mesh and its two pitches eight; the church is
  22; the three runs are 5, the west gate's cut making three boxes of one.

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
  check is wrong and not the yard** (#147). The built street is seen by 14
  of its 20 pieces and the church by 8 of its 9, the same split the prototype
  found. **Break**: `town-wall` to 20 m high. The street and the church are
  then seen from nowhere and the yard, which stands east of that wall, is
  still seen: the check tells the rooms apart. FAIL lines recorded under
  #728 in `HISTORY.md`.
- **The existing `layout.mjs` checks hold unchanged**: 3 (fourteen ground
  rooms), 3d (the mystery's rooms), "a name for every room" (43 names, all
  different, all drawable), 10 (no shared top plane), 11 (something in every
  room), 12 (every surface has a step sound: both materials already map), 13
  (ambient beds: outside rooms are exempt).
- **`test/budget.mjs`**: outer 993 + outside 131 = 1124 of 1200 and inner
  643 + 131 = 774. **Break**: `MAX_DRAW_CALLS_PER_WARD` to 1100. The outer
  ward alone (993) still passes the old assertion and only the new one fails,
  on 1124. FAIL line recorded under #727 in `HISTORY.md`.
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

## The floor plan you can see

**Rank 13. Size 2+. Nothing is built; decisions #745 to #749, 2026-09-21.**
Devon's ask, in his words: the room layout was placed by an AI one room and
one guess at a time with no way to see the whole floor plan, he is not happy
with how it reads, and he wants a GUI to lay it out himself, **or at least to
review and correct it visually**. That last clause is why increment 1 below
writes nothing.

### What the layout is today, measured

**`src/castle-plan.js` holds no coordinate.** It is a pure compiler:
`makePlan(config, boundsOf)` reads `data/scene-config.json` and returns
`{tile, pieces, colliders, surfaces, rooms, curtain, spawn}`, and it throws
rather than warns on a config that does not hang together: `[castle-plan]
drum "x" has an interior and no room in config.rooms names it`
(castle-plan.js:999). So the floor plan is **data**: four arrays of
`data/scene-config.json`, and a fifth that holds what stands on it.

| Array | Rows | What one row is |
| --- | --- | --- |
| `walls` | 46: 18 curtain at level 0, 3 at level 1, 25 interior partitions with no `level` at all | a run between two tile centres, carrying `from`, `to`, `material`, `height`, `thickness`, and optionally `axis`, `base`, `walk`, `repeatMetres`, `interior`, `doorways` |
| `drums` | 8 | a tower, carrying `tile`, `radius`, `height`, `segments`, `turret`, `stairs`, and an `interior` carrying its own `doors` |
| `gates` | 3 | an arch on a tile with a `leaf` |
| `rooms` | 43: 23 outer, 17 inner, 3 outside; 9 by `tiles`, 28 by `drum`, 6 by `bounds` | **a name over an extent, with no geometry of its own** |
| `courtyard.placements` | 123 | a kit model at a tile, which is where the roofs, sheds and trees are |

**Eleven runs carry `doorways`**, each `{ at, width, height, base? }`: an
opening at a point along a run, which is how two spaces connect. Nothing is
derived from anything else. A wall is not a room's edge, a room is an
annotation over ground that runs happen to enclose, a door is a hole in a run,
a stair is two flags on a drum. An editor here edits four independent lists,
not one building.

The file is **3113 lines** and every one was hand-typed. `?edit=1`
(`src/edit-mode.js`, 327 lines; #583 to #587, move-and-delete #636 to #642)
writes three *other* arrays of the same file (`interiorProps` (12),
`builtProps` (21), `braziers` (3)) through `tools/place.mjs`'s splice and a
Vite middleware, and touches none of the four above. It is walked in first
person, so **the whole plan has never been on a screen at once.**

### Scope, increment 1: the review view, no writing

Class S. No lane: it writes no file the repo carries.

- **`src/edit-layout.js`, new.** Mounted by `src/edit-mode.js`, which is
  already inside `main.js`'s `import.meta.env.DEV` branch, so the whole thing
  leaves a build with its host (#585). It carries
  `export const LAYOUT_SENTINEL = 'castle-layout-editor-v1'` on its panel's
  `data-editor` attribute, the way `edit-mode.js` carries its own.
  `V` toggles the view; `?edit=1&view=plan` opens into it; `[` and `]` change
  storey; Escape returns to the castle.
- **The view is an orthographic camera over the real scene** (#746), not a
  second drawing: a `THREE.OrthographicCamera` with `up` set to `(0, 0, -1)`,
  framed on `plan.rooms`' union, the player's own scene underneath it. The
  storey filter hides every piece whose box is wholly above the storey's
  ceiling and ghosts (opacity 0.25) everything below it.
- **`tools/plan-sheet.mjs`, new, pure.** No three, no DOM, no `node:` import,
  which is `tools/place.mjs`'s own rule and the reason a browser can import it.
  `planSheet(plan, level)` returns the overlay to draw: one entry per plan
  piece on that storey with the plan's own box (never recomputed, #500), one
  per room with its extent, id, name, ward and whether the mystery names it,
  and one per `doorways` opening as a point on its run. The camera draws the
  castle; this module draws the labels, the room outlines and the openings.
- **Nothing else changes.** Not `src/castle-plan.js`, not
  `src/castle-builder.js`, not `data/scene-config.json`, not
  `tools/place.mjs`, not `vite.config.js`.

### Scope, increment 2: rooms and runs become editable

Class S. **Lane B** (`data/scene-config.json` and `test/tools.mjs`'s
byte-exactness rail).

- **`tools/place.mjs`.** `PLACEABLE` gains `walls` and `rooms` with their key
  lists. `checkRow` becomes per-key shape rules rather than one shape:
  today every branch of it demands a `tile`, and a wall row has `from` and
  `to`. `formatRow` learns two shapes the four arrays have and the three
  placeable ones do not: an object value (`tiles: { min, max }`) and an array
  of objects (`doorways`). It writes both on one line today.
- **`src/edit-layout.js`.** Drag a room's rectangle or a run's end on the
  sheet; the sheet snaps to whole tiles, `Alt` to a quarter tile. The selected
  row's whole record is posted through the existing `/__place` `move` verb.
  No new verb and no change to `vite.config.js`.
- **`test/tools.mjs`.** Parts 1 and 2 run the two new arrays: insert, then cut
  the row back out, and the file is the file byte for byte, on an LF copy and
  a CRLF copy (#632). Part 3's `'an array that is not placeable'` case moves
  off `rooms`, which is placeable now, onto `materials`, which is an object
  and never will be. Part 4 covers the nested formatting.

### Scope, increment 3: the openings, which is how rooms connect

Class S, lane B. A `doorways` entry is a field of the run that owns it, so
editing one is a `move` of that run's row and needs no nested-path splice
anywhere (#749). Drag an opening along its run, type a width, `Delete` twice
to cut it, the way the prop editor already arms a delete.

### Acceptance

- **Increment 1.** `test/built.mjs`'s dev-only block greps `dist/` for
  **both** sentinels: its one `sentinel` regex becomes a list of
  `{ file, re }` pairs, `src/edit-mode.js` with
  `/castle-placement-editor-v1/` and `src/edit-layout.js` with
  `/castle-layout-editor-v1/`, each asserted present in its own source so a
  rename cannot make the check go quiet, and each asserted absent from every
  `.js`, `.css`, `.html` and `.json` under `dist/`. **Break**: delete
  `import.meta.env.DEV &&` from `main.js`'s branch, build, and the grep names
  the bundle file both sentinels leaked into while the served-set diff stays
  green. That is #586's own evidence, re-run with a second target.
- **Increment 1, in Node.** `test/tools.mjs` gains a part over
  `tools/plan-sheet.mjs`: every plan piece whose box meets the storey appears
  in `planSheet(plan, level)` exactly once, every room the plan lists appears
  with the plan's own bounds, and no entry's box is a number `makePlan` did
  not compute. **Break**: have `planSheet` recompute one room's box from its
  `tiles` instead of reading `plan.rooms`, which is #500's failure in
  miniature, and the assertion that fails says which room and by how much.
- **Increments 2 and 3.** `test/tools.mjs`'s headline rail, extended: an
  insert and a delete of the same `walls` row, and of the same `rooms` row,
  give back the file byte for byte on both endings, and every byte outside a
  rewritten row's span is the byte it was. **Break**: hardcode `\n` in
  `formatRow`'s nested-object branch; the CRLF copy fails by one byte per
  nested line, which is exactly #631's failure with a new surface under it.
- **Every increment.** `npm test` is 15 of 15 and `npm run build` is clean.
  No suite gains or loses an assertion in `layout.mjs`, `plan-vs-scene.mjs`,
  `mystery.mjs` or `budget.mjs` (#529, #611): a dev tool's rails are
  `test/tools.mjs`'s and `test/built.mjs`'s.
- **What no suite can say** is whether the plan reads better afterwards. That
  is Devon's, on the dev server, with `?edit=1&view=plan`. It is not a GPU
  question (#53), because an orthographic top-down of a static scene is not a
  real-time movement assertion, so a container can build and drive it, and
  only a person can judge the result.

### Open calls

1. **Does the GUI edit `castle-plan.js`, or an intermediate JSON?**
   **Neither: it edits `data/scene-config.json` directly, through
   `tools/place.mjs`'s splice** (#745). `castle-plan.js` is a compiler with no
   coordinate in it, so there is nothing there to round-trip; and the four
   layout arrays sit in the same file, under the same 3113-line splice rail,
   as the three the editor already writes. An intermediate format would be a
   second source of truth for the castle, which is exactly the thing #500
   exists to forbid. `eolOf` already gives it #632 for free.
2. **A re-serialise, now that whole rows are being rewritten?** **No** (#584,
   measured again today): `JSON.stringify(JSON.parse(raw), null, 2)` over the
   current file is 124924 bytes against 117131, so a round-trip writer puts
   7.8 KB of churn into every edit's diff, and the diff is the product. The
   churn a `move` makes inside the one row it rewrites stays the accepted
   bargain (#639).
3. **Top-down camera in the engine, or a flat 2D editor that never loads
   three?** **The camera** (#746). A flat schematic cannot compute anything
   here: `makePlan` takes `boundsOf(modelPath)`, and the only place that
   exists is `CastleBuilder.measure()`, which loads every model and measures
   its parts (castle-builder.js:630). A DOM editor would have to re-derive
   every box the plan computes, which is `test/layout.mjs`'s old sin written
   into a tool (castle-plan.js's header, #500). The camera also shows the 123
   `courtyard.placements`, the ground patches and the drums' own shells, which
   are the things a schematic would have drawn as nothing. Devon's own school
   editor landed here after 42 phases: `js/render.js:1522` is an
   `OrthographicCamera` 200 ft over the real scene with storeys ghosted, not a
   second canvas.
4. **Same tool or a new one?** **Same entry point, second module** (#747).
   `?edit=1` stays the one flag and the one DEV branch to audit;
   `src/edit-layout.js` is its own file because the data has nothing in
   common (a prop is a tile, a run is two tiles and eight fields) and
   because folding it into `edit-mode.js` would double a file whose whole
   value is that a person can read it in one sitting.
5. **Live validation, or write and let `npm test` catch it?** **Both, and the
   live half copies no assertion** (#749). Before it posts, the panel calls
   `makePlan(edited, boundsOf)` and `walkability`, the same two pure
   functions the page and every Node suite already call, and refuses to write
   when `makePlan` throws, showing the throw. It prints the room count, the
   walkable-cell count and whether the fill still seals, and **those are
   numbers, not checks**: #13's rule is why they are not allowed to be
   checks, because a second copy of check 4 living in a panel is a rail nobody
   runs and nobody maintains. No check from `layout.mjs`, `plan-vs-scene.mjs`
   or `budget.mjs` is copied, moved or re-implemented (#529, #611).
6. **A new row or an amendment to the placement editor's?** **New row.** Rank
   12 retired whole on 2026-09-18 (#687 to #690) and a retired row does not
   reopen; the scope is different besides: that row was props on a castle
   that already exists, this one is the castle.
7. **Which arrays does the write path take, and in what order?** **`rooms`
   and `walls` first, `doorways` second, `drums` and `gates` not in this row.**
   A drum is 970 of the castle's 1539 meshes (#609) and eight fields that the
   crown, the stairs and the turret all read; a gate carries a `leaf` spec
   with a springline in it. Both are a later increment's, and both stay
   readable in the review view from increment 1.
8. **Undo?** **No.** `git diff` is the undo, the write does not commit, and
   the one module in Devon's school editor most worth lifting (`js/history.js`,
   a JSON structural diff behind a 100-deep stack) is the one this repo does
   not need, because that tool's design lives in memory and this one's lives
   in a file git is already watching.
9. **Does the room's own record grow anything?** **No.** A room is a name over
   an extent and the builder works out what is in it; a second answer written
   beside the builder's is a second answer to drift, which is #583's rule for
   the prop editor's comment and holds here unchanged.
10. **Read-only first, as its own increment?** **Yes** (#748), and it is the
    answer to the half of Devon's sentence that says "or at least to review".
    It ships without touching `tools/place.mjs`, `PLACEABLE`, `/__place` or
    the byte-exactness rail, so the first thing anybody looks at costs nothing
    that could break a file ten suites read.

### Dependencies

- **Increment 1 is in no lane** and may be claimed beside anything, including
  rank 9. **Increments 2 and 3 are lane B**, which rank 9's town also holds:
  one row per lane at a time (#602), so they do not run beside it.
- Nothing gates this row and it gates nothing. It makes rank 9's remaining
  work and the nineteen empty rooms cheaper, the way the prop editor did for
  the content rows (#583).
- `src/edit-mode.js` is the host; a session in this row and a session
  extending the prop editor would collide on that file.

### Constraints

- **#500.** The sheet reads `plan.pieces` and `plan.rooms` and recomputes no
  box. A tool that re-derives the castle is the failure `castle-plan.js` was
  written to end.
- **#529, #611.** No assertion moves. A dev tool's rails live in
  `test/tools.mjs` and `test/built.mjs`.
- **#585, #586.** Two independent halves, neither trusted: the module is
  reached only from inside `import.meta.env.DEV`, the writer is still a plugin
  with `apply: 'serve'`, and the check is the grep of `dist/`, now for two
  sentinels.
- **#584, #632, #639.** Splice, never re-serialise; every newline from
  `eolOf(source)`; every byte outside the edited row's span unchanged, on both
  endings.
- **#13, #34.** The panel's numbers are not checks. Every rail named above is
  broken on purpose once, from green, with the FAIL line quoted in
  `HISTORY.md`.
- **#493, #494, #506.** No asset, no vendored library. Anything carried over
  from the school editor arrives as source under `src/` or `tools/`, never as
  a `libs/` copy.
- **#53.** An orthographic still of a static scene is not a real-time
  assertion, so the suite half of this row is a container's. Whether the plan
  reads better is Devon's.

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
