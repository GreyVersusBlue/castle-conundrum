# ROADMAP

**`BACKLOG.md` says what is worth doing and in what priority. This file says
what can be done *when*, on *what machine*, and *next to what else*.**
`SPECS.md` is still the spec behind every row and `HISTORY.md` is still the
only record. Nothing here is a locked decision except #600 to #602, which are
in `HISTORY.md` like everything else.

Written 2026-09-17 against `main` at `f7ea3ff`, from `BACKLOG.md`'s twelve rows
and `SPECS.md`'s twelve Dependencies sections. Rank numbers shift every time a
row closes; **this file names rows by title as well as rank**, the way
`SPECS.md` already does (#522), so a closed row does not silently renumber the
order below.

Devon's framing for what he wanted out of this: *"Do #1 first, then you can do
2, 3 and 4 in any order alongside each other, then #5 before you can
continue."* The honest answer is that this list is looser than that. **There
are four hard gates on twelve rows**, and everything else is preference,
lane-avoidance, or which machine is free.

---

## The short version

```
NOW, in parallel, no gates:

  Devon's machine                    A container
  ---------------                    -----------
  R2  GPU run        --+             R8   quests: the seven errands      lane A
                       |             R6   populace: the next forty       lanes C D
                       |             R4a  the bells call   (lane A: not beside R8)

  Wave A shipped four of its six on 2026-09-17, in parallel, as written:
    R1  fourth body    #603-606      R7  ambient beds   #620-623
    R12a budget suite  #607-611      R6  the first ten  #616-619
  R4b the since field shipped the same day, #646-649, in a worktree.
                       |
R2 lands --------------+--> unlocks R11
  (R3 and R5 both shipped 2026-09-17 ahead of R2 landing: R3 from a
  fallback frame, R5 by rendering the hall directly, #656-658)

  R11 feel: shadow + hand    lane D

R4c Thomas Wykes's yard  --> unlocked R9's town, 2026-09-19 (#696 to #700)
  shipped                        container, lane B, startable now

Never gated, take whenever the lane is free:
  R10 bodies (local: net, lane C)

  R12b move-and-delete shipped 2026-09-17 (#636 to #642) and lane B is free.
  R12c the dialogue format shipped 2026-09-18 (#687 to #690) and rank 12 is
  retired whole.
```

---

## 1. What needs a machine this container is not

Three different reasons, and they are not interchangeable. Calling all three
"needs a GPU" is what the old header did, and it is why the fourth body sat
unstarted behind the wrong excuse. **The castle you cannot walk was the same
mistake made twice**: `test/harness.mjs` said the Pointer Lock API needed a
browser compositing to a real screen, which is why that row read as a GPU row,
and it is measurably false — headless Chromium takes pointer lock, drops it and
takes it back exactly as a headed one does (#659). The row shipped from a
container with a headless suite in front of it.

### Local: a GPU (#53)

`npm run play` opens a real visible window and plays the whole day with pointer
lock and real key presses, 102 assertions, screenshots into `shots/play/`. It
is not in CI and is not going to be. **A real-time movement or physics
assertion that fails under software-rendered Chromium is inconclusive, not
confirmed** — which means a container cannot trust a pass either.

| Row | Model | Why the GPU |
| --- | --- | --- |
| **R2 The GPU run** | Opus 5 | The run itself. Six things nobody has looked at: a compressed texture (#507), the five that shipped after it (#541 to #546), a tower roof from 12 m (#523), seven trusses over the hall (#527), a Lauds sky (#533), the gaol roll on the guardroom barrels (#571). Plus the standing question: do twelve NPCs off three bodies read as twelve. |
| **R3 The images** | Opus 5 | The preview and og card come out of R2's screenshots. There is no other source. They land in `tools-and-games/assets/`, not here, and Devon relinks. |
| ~~**R5 The hall covering**~~ | Sonnet 5 | **Shipped** (#656 to #658). Both criteria were a render, and both were answered by rendering the hall directly rather than by waiting for this row's own run to reach Vespers: `roof.glb`'s vertices (not its bounding box) showed which way it slopes, and the floor read 69.8 to 89.8 of 255. |
| **R11 Feel**, past its Node line | Sonnet 5 | ~~The Node half — a shadow decal and a hand node exist and do not regress `plan-vs-scene.mjs` — is a container's.~~ Shipped (#650 to #654). What is left is what a GPU decides: whether a blob shadow reads on stone versus on grass, what it does on a flight of stairs, and whether the hand reads as a hand. |
| ~~**R4c The yard**~~ | Opus 5 | **Shipped** (#696 to #700). The look was the half that needed the machine and it is answered: a stone yard from inside it, a roof and a town wall from the North-west Tower's crown, and nothing at all from the west curtain's walk, because that tower's own drum stands in the line. `tools/shot-yard.mjs` is the camera, and it pins the camera rather than moving the spawn, which `validatePopulace` refuses. |

**R2 is the single highest-value hour on this list.** It is a ¼ and it unblocks
three rows outright.

### Local: a network that reaches the asset hosts

Not a GPU question and not the same block. #518's container could not reach
Poly Haven; #541's could, and both blocked rows came due the same day. #568's
could not reach quaternius.com, itch, poly.pizza, OpenGameArt or Patreon.

| Row | Model | What to fetch |
| --- | --- | --- |
| **R1 A fourth body** | Fable 5.1 | Quaternius's Ultimate Modular Women Pack first, checked against `SPECS.md`'s three name lists. The npm registry's two rigged CC0 alternatives were measured and rejected: KayKit is the wrong shape (head joint 57 % up the body against the Quaternius rig's top fifth, #569) and deskrpg is the wrong licence (#570). |
| **R10 Bodies** | Fable 5.1 | A low-poly one-rig CC0 body per new kind — the child first, per the row's own recommendation. A child scaled down from the existing rig is the cheapest version of "child" and should be tried before anything is fetched at all. **Tried on 2026-09-17 and it held** (#643): the child is the existing rig with a bigger head, and the only fetch was the hound (#644). **The hen and the spear came off poly.pizza on 2026-09-18** (#684, #685), which re-hosts Quaternius's packs as glTF where quaternius.com has only FBX. |

Both go through `tools/encode-assets.mjs` before commit (#506), which needs
KTX-Software's `ktx` on PATH. **An uncompressed body passes every suite and is
the one asset nothing else on this list would catch.**

### Local: speakers and a person

| Row | Model | Which half |
| --- | --- | --- |
| **R7 Sound** | Fable 5.1 | The first increment — an `ambient` block per zone in `data/sounds.json`, the cross-fade in `src/audio.js`, a `layout.mjs` check that every zone the plan knows has an entry — is a container's, with synthesis standing in. Whether a kitchen sounds like a kitchen is not. Recorded CC0 audio, if it is wanted, folds the network block in too. |

### Container, start to finish

**R6** populace, **R8** side quests, **R9** the town, whose gate R4c opened,
**R12a/b/c** the tooling, **R4a** the bells call, and **R4b** the `since`
field, which shipped from one on 2026-09-17. Six and a half rows of twelve. Every one is data, a validator, a Node suite or
a headless DOM assertion, and every one has an acceptance criterion a container
can actually meet.

---

## 2. What can run at the same time

Two sessions collide on one thing: a file they both write. **One row per lane
at a time** (#602). The lanes are named by the file, not by the theme, because
the theme is not what conflicts.

| Lane | The file that decides it | Rows in it |
| --- | --- | --- |
| **A** | `src/save.js` — the version number and `migrate` | R4a, R8 (R4b shipped without touching it) |
| **B** | `data/scene-config.json`, and `test/tools.mjs`'s byte-exactness rail | R9 (R4c, R5 and R12b are done) |
| **C** | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | R1, R6, R10 (R12c is done) |
| **D** | `src/main.js`'s player rig and spawn | R6, R11 |
| **E** | `src/audio.js` and `data/sounds.json` | R7 |
| **none** | | R2, R3, R12a |

Lane A is the one the specs already warned about in words: *"do not run
alongside anything else that touches `save.js`"* is written into R4's
dependencies, and R8's next increment was a version bump to 6 with a clamp in
`repair`. Two sessions bumping the same version number produce a merge that
compiles and a save that does not migrate. **Version 6 landed on 2026-09-17**
(#612), so the next session in this lane bumps to 7 and the same rule holds.

Lane B is sharp for a different reason. `test/tools.mjs` holds
`data/scene-config.json` to byte-exactness by cutting an added row back out and
comparing the whole file, because `JSON.stringify(JSON.parse(raw), null, 2)`
over that file is not that file: 94212 bytes go out as 98330 (#584). Two
sessions splicing into it is two splices neither one tested against.

**That rail was itself red on the dev machine until 2026-09-17** (#631 to
#633): the file is checked out CRLF on Windows and LF on Linux, and the splice
and the cut were both written in LF, so `npm test` was green in CI and one byte
short here. It runs over both endings on either machine now, so `tools` is no
longer the suite a session in this lane starts from red. What a row in this
lane has to keep is the rail itself: 179 assertions across four parts since
R12b (#636 to #642), both endings, a stray-ending count per splice because the
byte diff alone cannot see a newline **inside** the row it inserted, and — new
with the move — a per-row byte compare of everything outside the row that
changed.

Lane C is the `cast` block **specifically**, not all of `data/npcs.json`. R8
and R12c wrote per-person `states` and `default` line arrays, which is a
different region of the same file and merges cleanly. R8 also owned the
file's `reputation` block outright (#614), which is a third region again and
was nobody else's. **Both rows are closed** — R12c at #687 to #690, R8 at
#691 to #695 — so nothing is claiming that region now. **What R12c left is an
obligation on whoever writes there next**: every `dialogue` block in that file
is now also `dialogue/castle.dlg`, and `test/dialogue.mjs` fails if the two
disagree. A row that adds a state or rewords a line runs
`npm run dialogue:extract` before it commits, or writes the line in the .dlg
and runs `npm run dialogue:compile` instead (#687 to #690).

### Three that are genuinely safe together right now

**R8 (lane A), R6 (lanes C and D), R12a (no lane).** Different files, different
suites, no gate on any of them, and the backlog's existing advice already
points here: *"a session running beside one of those is better off on 8 or
12."* R8 and R12a have both closed since; the claim is left standing because
what it was claiming is what the afternoon below tested.

**The claim was tested the same afternoon and it held.** Five sessions ran at
once — R1, R6, R7, R8 and R12a — and four of them shipped (#603 to #606, #607
to #611, #616 to #619, #620 to #623) without one collision in a source file. R12a ran beside
R8 in the same working tree and touched `src/castle-builder.js`, `test/run.mjs`
and a new `test/budget.mjs`, none of which is in any lane.

**What the lanes did not cover was `HISTORY.md`.** Three branches wrote #603
the same afternoon; rank 1's merged and holds it, and the other two
renumbered — and then collided *again* on #607, because both picked the next
free band from the same stale view. R12a merged first and kept #607 to #611;
R8 moved a second time, to #612 to #615, and R6 twice as well, to #616 to
#619. Two renumbers for one row is the cost of picking a number before
merging.
A lane is a file (#602) and `HISTORY.md` is a file every row writes to, so by
the letter of the rule only one row could ever be in flight — which is not the
rule anybody wants. **The working answer, which costs nothing: read
`HISTORY.md` on `origin/main` when you write the entry, not when you branched.**
A decision number is picked at the end of a row, not the start.

With R1, R7, R12a and R8's reputation increment landed, lane A is free:
version 6 is in and R8's remaining work is quest files and dialogue, not
`save.js`. R4b took that free lane on 2026-09-17 and never wrote the lane's
file at all (#646 to #649), so the rows safe together now are **R8, R6 and
R4a**, three of them, plus **R2** on Devon's machine.

### What not to pair

- R6 beside R1 or R10. All three are lane C, and R6 reads the `cast` that R1
  and R10 both exist to change. **This is the one pairing that cost
  something.** R1 and R6 ran together anyway and merged clean in every file;
  what the merge could not see is that five of R6's ten are women who were
  wearing `Farmer.glb`, which is exactly what R1 exists to stop. They were
  put on `Woman.glb` by hand afterwards. A clean merge of two lane-C rows is
  not the same as a correct one, and nothing in `npm test` would have said
  so.
- R8 beside R4a. Lane A, and both want the version number — though see the
  note under the lane table: version 6 landed on 2026-09-17 and R8's remaining
  work does not touch `save.js` at all. R4b was the other row in this lane and
  is gone from it: it shipped without opening `save.js`, which is two rows in a
  row that sat in lane A for a file neither of them wrote.
- R9 is the only row left in lane B. R4c, R5 and R12b were the other three
  and all three shipped (#696 to #700, #656 to #658, #636 to #642), so there
  is nothing to pair it badly with. R12c has left lane C as well (#687 to
  #690).
- R6 beside R11. Lane D, both inside `src/main.js`'s rig.

---

## 3. The order

### R2 ran on 2026-09-17, and it needs a worktree, not a lane

**The run happened** (#624 to #630) and did not reach the end of the day, so
gate 1 is half open: the compressed textures, the tower roof at 12 m and the
gaol roll are answered, and `twelve-at-vespers` and the trusses under a real
run's own lighting are not. **R3 shipped anyway, from a fallback frame,
2026-09-17** (#634, #635), and **R5 shipped without waiting for a second run
either**, by rendering the hall directly rather than by playing to Vespers
(#656 to #658) — the gate named the wrong half of rank 2 as the blocker; both
rows needed a render, not specifically *this* render.

**R2 was gated for a day behind a new rank 1** — a castle the player could not
walk in after opening the journal, which the run found and which nothing else
could have — **and that shipped on 2026-09-18** (#659 to #661). `src/ui.js`
owns the pointer now, `test/overlays.mjs` is the fourteenth suite and holds it
headlessly, and `npm run play`'s journal beat asserts the walk as well as the
pointer. **R2 has no gate in front of it.**

**And the lane table below is wrong about R2 in the one way that matters.** It
gives R2 no lane because it writes no file anything else writes. It does not
write the tree; it *reads* it for ten minutes at a stretch, with a browser
holding the page open. Another session's `git checkout` in the same working
tree wiped this row's uncommitted edits mid-run, and Vite full-reloaded the page
whenever anything under `src/` changed. **A GPU run belongs in its own
`git worktree`**, and then it genuinely has no lane.

**R4b found the same thing without a GPU anywhere near it** (#646 to #649), so
it is not a GPU rule. Running beside R3 in one tree, in different lanes and
with no source file in common, it still got: three suites red on the other
session's mid-edit `data/scene-config.json` and on `Port 8127 is already in
use`, and `HEAD` moving under it twice. **A working tree is a resource two
sessions cannot share**, whatever their lanes say, because `npm test`,
`dist/`, the harness ports and `HEAD` are one copy each. A `git worktree add`
plus a junction for `node_modules` is the whole cost. Take one.

### Gate 1 — R2, the GPU run. Do this one first.

**Local, GPU, Opus 5, size ¼.** Not because it is the hardest but because it is
the cheapest thing that unblocks the most: three rows wait on it and one of
them (R3) has no other possible source. It also carries six unlooked-at
questions that have been stacking up since Phase 5, and one of those — whether
the ETC1S/UASTC split #507 chose on a reading of what each codec does to which
channels actually holds up — gets more expensive to answer the more assets ship
on top of it.

Nothing is gated on R2 *starting*, so everything in wave A runs alongside it.

### Wave A — right now, no gate, in parallel

One row per lane. All of these are startable today.

**Four of the six below shipped on 2026-09-17, the same afternoon this file
was written, running at once and not colliding**: R1's `Woman.glb` and the
three women who wear it (#603 to #606), R7's seven ambient beds (#620 to
#623), R12a's budget suite (#607 to #611), and R6's first ten (#616 to #619).
Their rows are struck through rather than deleted, because what this table was
claiming is that they could run together, and they did. R6 is a 2+ and keeps
its row open with its text rewritten to say what is done.

| Row | Model | Where | Lane | Next increment |
| --- | --- | --- | --- | --- |
| **R2** The GPU run | Opus 5 | **Local: GPU** | none | Gate 1, above. And now four more things nobody has looked at: a fourth body, seven ambient beds nobody has heard, and what the eight tower drums actually cost. |
| ~~**R8** Side quests~~ | Opus 5 | Container | A | **Shipped, and the row is closed** (#691 to #695). The seven errands left of the dozen went in on 2026-09-18, one voice each on the seven people who had none, so `data/quests/` is twelve files and every person the day one schedule puts in the castle has an errand. A sixth set rule came with them: a terminal stage may not park a person whose `default` lines pose one of the frame's tokens. No `save.js` change and no version bump. |
| **R6** Life: a populace | Opus 5 | Container | C, D | ~~The file, the validator and the first ten~~ shipped 2026-09-17 (#616 to #618): a routine is a ring per bell, nine activities on three clips the kit already had, no asset added. What is left is the other forty, the ambient talk once two bodies are within 3 m, and the four activities that want a clip — which is the half that trades with R10. **It has a number to answer to**: 20 skinned bodies per ward against a peak of 7 before the ten, 17 after (#609). |
| ~~**R1** A fourth body~~ | Fable 5.1 | Local: net | C | **Shipped** (#603 to #606). Quaternius's Ultimate Modular Women Pack, meshopt to 1.02 MB, worn by the cook, the laundress and the lady. |
| ~~**R7** Sound~~ | Fable 5.1 | Container | E | **First increment shipped** (#620 to #623). Seven synthesised room tones and the cross-fade. **Second shipped 2026-09-18** (#680 to #683): a bed at a point, the nearest three at once, and the four rings. What is left needs speakers (#53), then rank 6's clips for event sounds. |
| ~~**R12a** The budget suite~~ | Opus 5 | Container | none | **Shipped** (#607 to #611). 965 draw calls in the outer ward against 1200, 3 point lights, a peak of 7 bodies. 63 % of the castle's meshes is eight tower drums. |

R4a (the bells call) is startable today too, and R4b (the `since` field)
shipped on 2026-09-17 (#646 to #649) without touching `save.js` at all: the
journal it reads is `state.clues`, which the save has carried since #571. That
is the second row in a row to sit in lane A and never write the lane's file, so
**lane A's real membership today is R4a and whatever next wants the version
number**. R8 made it three in a row: closing the dozen was quest files and
dialogue, and the two ward counters were already clamped against whatever
`data/quests/` holds, so seven new files raised both ceilings on the next
load with nothing written down twice (#691).

**R4a is what is left of lane A**, and it is an open design question that has
to overturn #533 rather than work around it, which is a different kind of
session from the two that just shipped out of that lane.

### Wave B — the moment R2 lands

| Row | Model | Where | Lane | Note |
| --- | --- | --- | --- | --- |
| ~~**R3** The images~~ | Opus 5 | Local: GPU | none | **Shipped** (#634, #635), from a fallback frame rather than R2's screenshots — the run never reached the shot this row wanted. |
| ~~**R5** The hall covering~~ | Sonnet 5 | Local: GPU | B | **Shipped** (#656 to #658). Seven `roof.glb` pieces, not fourteen — the piece is a whole ridge-and-both-slopes cross-section, found by reading its vertices rather than guessing from its bounding box. The Vespers floor read 69.8 to 89.8 of 255 across the hall's length, well clear of SPECS.md's ~25 line; no second brazier or window needed. |
| **R11** Feel | Sonnet 5 | Local: GPU past its Node line | D | ~~The shadow decal and the reaching hand~~ — **the Node half shipped 2026-09-17** (#650 to #654), ahead of the gate, because it never needed one: two draw calls, a canvas-painted decal, a hand that reaches for whatever the prompt is offering, and nine assertions in `plan-vs-scene.mjs`. What is left is the three shots, and nothing else in the theme starts before somebody has looked at them. |

R11 is the one row left in this wave; it does not gate on anything else here.

**R11 did not wait, and the gate was never what it looked like.** Every row
marked `Local: GPU` has a Node acceptance criterion on purpose — the closing
section of this file says so — and R11's turned out to be the whole of its
first increment's code: two objects in the scene, followed by the player, out
of every ray, asserted nine ways in a suite CI runs. It shipped on 2026-09-17
(#650 to #654) with R2 still half open. **What the gate was really protecting
was the judgement, not the work**: whether a blob reads on stone and on grass,
and whether a hand reads as a hand, are still unanswered and still R2's
sitting to answer.

The reading that generalises: for these three rows the gate is on *finishing*,
not on *starting*, and a session that meets the Node half and calls the row
closed has misread the split — which is the same sentence at the bottom of this
file, now with one row's worth of evidence under it.

### Gate 2 — R4c, Thomas Wykes's yard. Open since 2026-09-19.

**Shipped, #696 to #700.** The yard stands on the ground #546 laid: a stretch
of Mereford's wall with the town gate cut in it, a shed on four posts, a low
yard wall on two sides, five blocks of dressed stone and Gruffudd's mark on
one of them. 34 meshes, all of them outside both wards, in a bucket
`test/budget.mjs` still has no ceiling for on purpose.

**What R9 inherits, and it is more than an open gate.** The `town-wall` run at
x -64 is 64 m of wall with the gate already in it, to be extended rather than
replaced. `ward: "outside"` is a room's third answer, with `test/layout.mjs`
check 4c holding what that word costs: clear of the curtain, standing on a
piece of `config.ground.outside`, reached by nobody. And the journal's map
frame grew from 67.6 m wide to 90.8 (#699), with 28 m of empty ground between
the castle and the yard that R9's street is what fills.

**The open call it settled: the player sees the yard and never stands in it**
(#696). R9 inherits that too. A town the player can walk into is a way out of
a castle `test/layout.mjs` check 4 asserts is sealed, and that is a decision
to overturn rather than a street to place.

### Wave C — startable now

| Row | Model | Where | Lane |
| --- | --- | --- | --- |
| **R9** A castle to get lost in: the town | Opus 5 | Container | B |

A walled town's street, church and quay on the ground the yard proved. The
rooms go on the map the day they go in `config.rooms`, because the map is the
plan's list and not a second one (#588 to #591).

### Anytime — never gated, take it when the lane is free

| Row | Model | Where | Lane | Note |
| --- | --- | --- | --- | --- |
| **R10** Bodies | Fable 5.1 | Local: net | C | ~~The child and the hound~~ shipped 2026-09-17 (#643 to #645). ~~Two hens and the spear~~ shipped 2026-09-18 (#684 to #686), off poly.pizza. What is left is the GPU look, and the four activity clips R6 wants, which no body on disk has. Still trades activity clips with R6 in both directions. |
| ~~**R12b** Move-and-delete~~ | Opus 5 | Container | B | **Shipped 2026-09-17** (#636 to #642). The panel lists the rows within six tiles, `M` moves the selected one to the player's feet, `Delete` twice removes it, and `test/tools.mjs` went from 47 assertions to 179 with insert-then-delete byte-exact on both endings. **Lane B is free again.** |
| ~~**R12c** The dialogue format~~ | Opus 5 | Container | C | **Shipped 2026-09-18** (#687 to #690). `dialogue/castle.dlg`: six sigils, 13 speakers, 62 states, 182 lines, and what reaches each state written above it. `|` and `%` compile back into `data/npcs.json` and `data/quests/`; `@`, `:`, `?` and `!` are rebuilt from the clue graph and checked, never authored. `test/dialogue.mjs` is the fifteenth suite, 112 assertions. **Rank 12 is retired whole.** |
| **R4a** The bells call | Opus 5 | Container | A | Has to overturn #533 rather than work around it. The cheapest shape that does not fight it: `day2.watches`, its own list, with the engine reading whichever list the day names. |
| ~~**R4b** The `since` field~~ | Opus 5 | Container | A | **Shipped** (#646 to #649). `since` rows on a fact, a third `performances` pool that says the changed fact in the guardroom at Lauds, and the grammar exported from `src/mystery.js` so there is one copy of it. It never touched `save.js`, which is the thing lane A was for. |

---

## What this file does not say

**It does not re-rank.** `BACKLOG.md`'s order is Devon's, and the order above
respects it everywhere a gate does not force otherwise. The one real inversion
is that wave A puts R8, R6 and R12a ahead of R4 and R5, and that is because R4's
remaining threads are a design call plus a local job while R5 sits behind gate
1. When R2 lands, the ranks and the order agree again.

**It does not claim a size it cannot see.** Five of the twelve are 2+ rows,
which by this repo's own rule means they will not finish in one sitting and
stay in the table afterwards with their text rewritten to say what is done. The
order above is an order for *starting*, not a schedule.

**It does not soften #53.** Every row marked `Local: GPU` also has a Node
acceptance criterion, deliberately, so the row is not blocked on hardware — but
a Node criterion met is not the row done. A session that meets the Node half
and calls the row closed has misread a split every one of those specs draws on
purpose.
