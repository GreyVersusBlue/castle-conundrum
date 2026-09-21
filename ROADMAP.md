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
                                     R1   explore: the day before, new 2026-09-21   lanes A D
                                     R2   sight at the body's height    no lane
  R3  GPU run, after R2 (2026-09-21)
                     --+             R8   quests: the seven errands      lane A
                       |             R6   populace: the next forty       lanes C D
                       |             R4a  the bells call   (lane A: not beside R8)

  Wave A shipped four of its six on 2026-09-17, in parallel, as written:
    R1  fourth body    #603-606      R7  ambient beds   #620-623
    R12a budget suite  #607-611      R6  the first ten  #616-619
  R4b the since field shipped the same day, #646-649, in a worktree.
  R6 five more, to 32 of 32, and a talk rail, shipped 2026-09-20 (#729-733).
                       |
R3 lands --------------+--> unlocks R11
  (the images row and R5 both shipped 2026-09-17 ahead of this row landing,
  when it was still R2: the images row from a fallback frame, R5 by
  rendering the hall directly, #656-658)

  R11 feel: shadow + hand    lane D

R4c Thomas Wykes's yard  --> unlocked R9's town, 2026-09-19 (#703 to #707)
  shipped                        container, lane B, startable now

Never gated, take whenever the lane is free:
  R10 bodies (local: net, lane C)
  R13 the floor plan you can see, new 2026-09-21 (#745 to #749)
      increment 1 writes nothing and is in no lane; 2 and 3 are lane B
  R4  the retro castle: increment 1 shipped, in a container (#757-766)
      lane B free again; increment 2 waits on a GPU look (#53)

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
| **R3 The GPU run** | Opus 5 | ~~Six things nobody has looked at~~ — five are looked at now (#630, #711 to #715), and the answer to the standing question is **no, two of the twelve do not read as two**: the Constable and the Steward are one white-haired man in a red collar and a green one. What is left needs the machine for a different reason: `npm run play` has to reach the end. The walker on the stair shipped on Node terms (#716 to #720); nobody has watched it hold on a GPU yet. |
| **R3 The images** | Opus 5 | The preview and og card come out of the GPU run's screenshots. There is no other source. They land in `tools-and-games/assets/`, not here, and Devon relinks. |
| ~~**R5 The hall covering**~~ | Sonnet 5 | **Shipped** (#656 to #658). Both criteria were a render, and both were answered by rendering the hall directly rather than by waiting for this row's own run to reach Vespers: `roof.glb`'s vertices (not its bounding box) showed which way it slopes, and the floor read 69.8 to 89.8 of 255. |
| **R11 Feel**, past its Node line | Sonnet 5 | ~~The Node half — a shadow decal and a hand node exist and do not regress `plan-vs-scene.mjs` — is a container's.~~ Shipped (#650 to #654). What is left is what a GPU decides: whether a blob shadow reads on stone versus on grass, what it does on a flight of stairs, and whether the hand reads as a hand. |
| **R4 The retro castle**, past its first increment | Opus 5 | Increment 1 shipped on 2026-09-21 (#757 to #766): the generator, the rails, fifteen textures in place of fifteen sets, and the memory count (80.8 MB to 37.9) needed no `ktx`, no network and no GPU. What is left before increment 2 is the look: one castle or two from the North-west Tower's roof (#630's vantage), the shadowed faces (#438, #713), the same wall at four bells (#474, #712), and `renderer.info.memory.textures` against the header estimate. The checklist is in `SPECS.md`. |
| ~~**R4c The yard**~~ | Opus 5 | **Shipped** (#703 to #707). The look was the half that needed the machine and it is answered: a stone yard from inside it, a roof and a town wall from the North-west Tower's crown, and nothing at all from the west curtain's walk, because that tower's own drum stands in the line. `tools/shot-yard.mjs` is the camera, and it pins the camera rather than moving the spawn, which `validatePopulace` refuses. |

**R3, the GPU run, is the single highest-value hour on this list.** It is a
¼ and it unblocks three rows outright.

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

**R1** explore: the day before, new 2026-09-21 (#750 to #756) and taking rank
1 the same day: a `day0` block, a third branch per method in the engine, two
doors and a night, all of it Node or headless, four increments, and only the
last of them large. **R2** sight at the
body's own height, filed 2026-09-21 and gating R3: a GPU found it, and a
headless beat can hold it, because it is a camera placed and a prompt string
read, not a walk. **R6** populace, **R8** side quests, **R9** the town, whose
gate R4c opened, **R12a/b/c** the tooling, **R13** the floor plan you can see
(#745 to #749), **R4a** the bells call (#699 to #702), and **R4b** the
`since` field, which shipped from one on 2026-09-17. Eight and a half rows
of fourteen. Every one is data, a validator, a Node suite or a headless DOM
assertion, and every one has an acceptance criterion a container can
actually meet.

---

## 2. What can run at the same time

Two sessions collide on one thing: a file they both write. **One row per lane
at a time** (#602). The lanes are named by the file, not by the theme, because
the theme is not what conflicts.

| Lane | The file that decides it | Rows in it |
| --- | --- | --- |
| **A** | `src/save.js` — the version number and `migrate` | R1 (which does not bump it either, #754; R4a, R4b and R8 all shipped without bumping it) |
| **B** | `data/scene-config.json`, and `test/tools.mjs`'s byte-exactness rail | R4, R13 (increments 2 and 3 only), R9 (R4c, R5 and R12b are done) |
| **C** | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | R6, R10 (R12c is done) |
| **D** | `src/main.js`'s player rig and spawn | R1, R6, R11 |
| **E** | `src/audio.js` and `data/sounds.json` | R7 |
| **none** | | R3, R12a |

Lane A is the one the specs already warned about in words: *"do not run
alongside anything else that touches `save.js`"* is written into R4's
dependencies, and R8's next increment was a version bump to 6 with a clamp in
`repair`. Two sessions bumping the same version number produce a merge that
compiles and a save that does not migrate. **Version 6 landed on 2026-09-17**
(#612), so the next session in this lane bumps to 7 and the same rule holds.
**R1 is in this lane and does not bump it** (#754). #751 priced a saved
explore as a `mode` field at version 7; the spec settled it as a third value
on the `day` field that already says which day a save is on, so `migrate` has
no drift to be honest about and `SAVE_VERSION` stays 6. R1 still holds the
lane, because a lane is a file and it writes one: `buildCatalog`'s third bell
list, `clampWatch` and one incoherence rail in `repair`. **The next session
that does bump it bumps to 7**, and R4a is the reminder that sitting in this
lane and bumping nothing is the normal case (#702).

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
R4a**, three of them, plus **R3, the GPU run,** on Devon's machine. **Lane A
holds one row again as of 2026-09-21**: R1, the walking day, for a clamp in
`repair` rather than for a bump (#754).

### What not to pair

- R6 beside R1 or R10. All three are lane C, and R6 reads the `cast` that R1
  and R10 both exist to change. **This is the one pairing that cost
  something.** R1 and R6 ran together anyway and merged clean in every file;
  what the merge could not see is that five of R6's ten are women who were
  wearing `Farmer.glb`, which is exactly what R1 exists to stop. They were
  put on `Woman.glb` by hand afterwards. A clean merge of two lane-C rows is
  not the same as a correct one, and nothing in `npm test` would have said
  so.
- R8 beside R4a. Both closed, and neither one ever wrote the lane's file.
  Version 6 landed on 2026-09-17; R8's remaining work never touched `save.js`,
  R4b shipped without opening it, and R4a opened it for a helper and two lines
  in `repair` and left the version at 6 (#702). **Three rows in a row sat in
  lane A for a file none of them bumped**, which is worth reading the next time
  a row is held out of this lane.
- R4 beside R9. Both are lane B and both write `data/scene-config.json`: R4
  rewrites its `materials` block and R9 splices rooms and runs into it, and
  two splices neither session tested against each other is what #602 drew
  the lane for. R9's next increment, the quay, has no `SPECS.md` section and
  is not startable, so R4 takes the lane today. R4c, R5 and R12b were the
  lane's other three and all shipped (#703 to #707, #656 to #658, #636 to
  #642). R12c has left lane C as well (#687 to #690).
- R6 beside R11. Lane D, both inside `src/main.js`'s rig.
- R1 beside R6 or R11. Lane D again: R1's second start callback lives in
  `src/main.js`'s UI-flow region, not the rig either of those two writes, but
  one row per lane at a time is the rule regardless of region (#602). R1 is
  also in lane A, for `repair`'s day clamp and not for a version bump (#754),
  so nothing else runs in lane A beside it either.

---

## 3. The order

### R3, the GPU run, ran on 2026-09-17, and it needs a worktree, not a lane

**The run happened** (#624 to #630) and did not reach the end of the day, so
gate 1 is half open: the compressed textures, the tower roof at 12 m and the
gaol roll are answered, and `twelve-at-vespers` and the trusses under a real
run's own lighting are not. **The images row shipped anyway, from a fallback
frame, 2026-09-17** (#634, #635), and **R5 shipped without waiting for a
second run either**, by rendering the hall directly rather than by playing
to Vespers (#656 to #658) — the gate named the wrong half of the GPU run as
the blocker; both rows needed a render, not specifically *this* render.

**R3 was gated for a day behind a new rank 1** — a castle the player could
not walk in after opening the journal, which the run found and which nothing
else could have — **and that shipped on 2026-09-18** (#659 to #661).
`src/ui.js` owns the pointer now, `test/overlays.mjs` is the fourteenth
suite and holds it headlessly, and `npm run play`'s journal beat asserts the
walk as well as the pointer. **R3 has no gate in front of it.**

**And the lane table below is wrong about R3 in the one way that matters.**
It gives R3 no lane because it writes no file anything else writes. It does
not write the tree; it *reads* it for ten minutes at a stretch, with a
browser holding the page open. Another session's `git checkout` in the same
working tree wiped this row's uncommitted edits mid-run, and Vite
full-reloaded the page whenever anything under `src/` changed. **A GPU run
belongs in its own `git worktree`**, and then it genuinely has no lane.

**R4b found the same thing without a GPU anywhere near it** (#646 to #649), so
it is not a GPU rule. Running beside the images row in one tree, in different
lanes and with no source file in common, it still got: three suites red on
the other session's mid-edit `data/scene-config.json` and on `Port 8127 is
already in use`, and `HEAD` moving under it twice. **A working tree is a
resource two sessions cannot share**, whatever their lanes say, because
`npm test`, `dist/`, the harness ports and `HEAD` are one copy each. A
`git worktree add` plus a junction for `node_modules` is the whole cost.
Take one.

### Gate 1 — R3, the GPU run, once more.

**This gate has now moved three times, and all three for the same reason: the
thing in front of R3 was never the looking, it was the walking.** First it was
the castle you cannot walk, which shipped on 2026-09-18 (#659 to #661). Then
it was the walker on the stair (#710), which shipped on 2026-09-19 (#716 to
#720): a walk between two points on one storey now searches that storey's own
floor alone, so it can no longer take a flight for a stair or the wall walk
for a corridor, and a cell a 0.45 m body does not fit in costs five cells
rather than one, so it stops hugging the walls a prop stands against.
`test/layout.mjs`'s new check 8b holds it over all 66 pairs of the 12 ground
rooms the fill reaches: 153 ok, 0 fail.

**What that buys is a Node proof, not a GPU one** (#53). The walker on the
stair is done and its row is gone from this table and from `BACKLOG.md` and
`SPECS.md`; what is left in front of R3 is the run itself, which nobody has
watched carry a real `npm run play` to the second bell yet, and that needs
Devon's machine.

**And it moved a fourth time on 2026-09-21, for the same reason.** The third
sitting's run 2 walked the sentry and the porter on the walks and could not
talk to either from beside them: `src/interaction.js` aims its sight rays at
world y 1.55 and 1.15, so a body 8 m up is aimed at through his own floor,
and the porter, who is a premise of the full ending, was talkable from the
ground under him instead. **This is "Sight at the body's own height," rank 2
as of the same day's later answers: container, Opus 5, size ¼, no gate, no
lane.** Its proof is headless (a `plan-vs-scene.mjs` beat over the six
upstairs station-watches and two `mystery.mjs` rails); R3 is gated on it
being on `main`, and R3's next sitting is what confirms it on a GPU. Apart
from #714's five checks and #659's journal number, it is the last thing
between `npm run play` and exit 0.

**R3 the GPU run: local, GPU, Opus 5, size ¼, no lane, after R2.** Its
judgement half was finished on 2026-09-19 (#711 to #715) — the twelve, the
Lauds sky, the covered hall and eleven bodies at interact range, the
unlooked-at list down to one item, a phone (#530). Its walking half is the
run reaching the end, and that is now entirely this row's own to close.

**The general lesson, now with three instances under it, one of them twice
over.** Every row marked `Local: GPU` splits into a judgement that needs eyes
and a proof that needs the machine to behave, and the two have failed
independently every single time. R5 got its judgement without its run. R11
shipped its Node half without its judgement. R3 has now got its judgement
twice over, and a walking fix proven on Node terms twice over, without the
run that would confirm either. **Do not gate a looking on a walking**, and do
not let a row claim the walking is done because the looking is, or because a
Node check went green.

Nothing is gated on R3 *starting*, so everything in wave A runs alongside it.

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
| **R1** Explore: the day before | Opus 5 | Container | A, D | **Claimed and specced 2026-09-21** (#750 to #756). `WISHLIST.md` theme 8's four questions answered, both against the theme's own recommendation: the walking day is the main mode, not a second door, and it is the day before the death, Hywel alive, not the day of it. `SPECS.md`'s section is four increments deep with ten open calls answered. **Increment 1 shipped the same day** (#767 to #770): the engine, the save and a placeholder walking day, all Node, 15 of 15. **Increment 2 shipped the same day** (#771 to #774): the panel's two doors, `#start-mystery` offered on a fresh save only, and the door reaches the six suites that needed it, `test/play-castle.mjs` included. `npm test` 15 of 15, `npm run build` clean. **The door is wired and every static check passes; whether `npm run play` actually carries the day through it is unverified** — this container is software-rendered and the run needs a real GPU (#53); that is R3's first act, not this row's. **Next: increment 3**, the fourteen real `day0` line sets. |
| ~~**R1** The walker on the stair~~ | Opus 5 | Container | none | **Shipped** (#716 to #720). A same-storey walk now searches that storey's own floor, so `hike` can no longer take a flight for a stair or the wall walk for a corridor, and a tight cell costs five instead of one, so it stops hugging the walls a prop stands against. `test/layout.mjs` check 8b holds it over 66 room pairs, 153 ok. The row is closed; the run itself is Gate 1, above, and it is R3's. |
| **R3** The GPU run | Opus 5 | **Local: GPU** | after R2 | **Gate 1, above.** Its looking is done (#711 to #715); the old R1 walker holds on a GPU now (#734, #736), and a third sitting reached the accusation for the first time before a new bug, fixed sight heights in `src/interaction.js`, produced the wrong ending (#735 to #741). Gated on the new R2, "Sight at the body's own height." **R1's own known break on this row is lifted on paper, not confirmed**: increment 2 gave `test/play-castle.mjs` the same `#start-mystery` door the other suites got (#771 to #774), and the file parses and the button and its wiring are in `dist/`, but nobody in a container can run `npm run play` to say the day actually carries through it (#53). Read R1's row, and treat that as this row's first act, not a settled fact. |
| ~~**R8** Side quests~~ | Opus 5 | Container | A | **Shipped, and the row is closed** (#691 to #695). The seven errands left of the dozen went in on 2026-09-18, one voice each on the seven people who had none, so `data/quests/` is twelve files and every person the day one schedule puts in the castle has an errand. A sixth set rule came with them: a terminal stage may not park a person whose `default` lines pose one of the frame's tokens. No `save.js` change and no version bump. |
| **R6** Life: a populace | Opus 5 | Container | C, D | ~~The file, the validator and the first ten~~ shipped 2026-09-17 (#616 to #618): a routine is a ring per bell, nine activities on three clips the kit already had, no asset added. ~~Five more people, a `talk` rail~~ shipped 2026-09-20 (#729 to #733): the page now builds 32 of 32 bodies, exactly `MAX_SKINNED_TOTAL` (#609), outer ward peaking at 18 of 20 and inner at 15 of 20, plus a flat `talk` list of three pairs played through the `#caption` band. What is left is the rest of the fifty (R9's town), the four activities still without a clip (R10), and the twelve's 27-pair chatter pool, still unspent by proximity. |
| ~~**R1** A fourth body~~ | Fable 5.1 | Local: net | C | **Shipped** (#603 to #606). Quaternius's Ultimate Modular Women Pack, meshopt to 1.02 MB, worn by the cook, the laundress and the lady. |
| ~~**R7** Sound~~ | Fable 5.1 | Container | E | **First increment shipped** (#620 to #623). Seven synthesised room tones and the cross-fade. **Second shipped 2026-09-18** (#680 to #683): a bed at a point, the nearest three at once, and the four rings. **Third shipped 2026-09-19** (#696 to #698): the door and the hound's bark, the two event sounds that need no clip. What is left needs speakers (#53), then rank 6's clips for the rest of the event sounds. |
| ~~**R12a** The budget suite~~ | Opus 5 | Container | none | **Shipped** (#607 to #611). 965 draw calls in the outer ward against 1200, 3 point lights, a peak of 7 bodies. 63 % of the castle's meshes is eight tower drums. |

R4a (the bells call) shipped on 2026-09-19 (#699 to #702), and R4b (the `since` field)
shipped on 2026-09-17 (#646 to #649) without touching `save.js` at all: the
journal it reads is `state.clues`, which the save has carried since #571. That
is the second row in a row to sit in lane A and never write the lane's file, so
**lane A's real membership today is R4a and whatever next wants the version
number**. R8 made it three in a row: closing the dozen was quest files and
dialogue, and the two ward counters were already clamped against whatever
`data/quests/` holds, so seven new files raised both ceilings on the next
load with nothing written down twice (#691).

**Lane A is empty.** R4a was the last row in it and it made four rows in a row
that sat in lane A without moving the version number: it overturned #533's
second clause, put `day2.watches` in the data, and changed `repair`'s watch
clamp to read the day's own list. That is a repair change, which runs on every
load, rather than a field arriving, which is what a version number is for (#37,
#702). The next row that wants version 7 takes the lane. **R1 holds the lane
as of 2026-09-21 and makes it five in a row** (#754): #751 priced a saved
explore at version 7, and the spec settled it as a third value on the `day`
field, so `migrate` is untouched and `SAVE_VERSION` stays 6. What R1 writes in
that file is `buildCatalog`'s third bell list, `clampWatch` and one
incoherence rail in `repair`, which is #702's side of the same line.

### Wave B — the moment R3 lands

| Row | Model | Where | Lane | Note |
| --- | --- | --- | --- | --- |
| ~~**R3** The images~~ | Opus 5 | Local: GPU | none | **Shipped** (#634, #635), from a fallback frame rather than the GPU run's screenshots — the run never reached the shot this row wanted. |
| ~~**R5** The hall covering~~ | Sonnet 5 | Local: GPU | B | **Shipped** (#656 to #658). Seven `roof.glb` pieces, not fourteen — the piece is a whole ridge-and-both-slopes cross-section, found by reading its vertices rather than guessing from its bounding box. The Vespers floor read 69.8 to 89.8 of 255 across the hall's length, well clear of SPECS.md's ~25 line; no second brazier or window needed. |
| **R11** Feel | Sonnet 5 | Local: GPU past its Node line | D | ~~The shadow decal and the reaching hand~~ — **the Node half shipped 2026-09-17** (#650 to #654), ahead of the gate, because it never needed one: two draw calls, a canvas-painted decal, a hand that reaches for whatever the prompt is offering, and nine assertions in `plan-vs-scene.mjs`. What is left is the three shots, and nothing else in the theme starts before somebody has looked at them. |

R11 is the one row left in this wave; it does not gate on anything else here.

**R11 did not wait, and the gate was never what it looked like.** Every row
marked `Local: GPU` has a Node acceptance criterion on purpose — the closing
section of this file says so — and R11's turned out to be the whole of its
first increment's code: two objects in the scene, followed by the player, out
of every ray, asserted nine ways in a suite CI runs. It shipped on 2026-09-17
(#650 to #654) with R3 still half open. **What the gate was really protecting
was the judgement, not the work**: whether a blob reads on stone and on grass,
and whether a hand reads as a hand, are still unanswered and still R3's
sitting to answer.

The reading that generalises: for these three rows the gate is on *finishing*,
not on *starting*, and a session that meets the Node half and calls the row
closed has misread the split — which is the same sentence at the bottom of this
file, now with one row's worth of evidence under it.

### Gate 2 — R4c, Thomas Wykes's yard. Open since 2026-09-19.

**Shipped, #703 to #707.** The yard stands on the ground #546 laid: a stretch
of Mereford's wall with the town gate cut in it, a shed on four posts, a low
yard wall on two sides, five blocks of dressed stone and Gruffudd's mark on
one of them. 34 meshes, all of them outside both wards, in a bucket
`test/budget.mjs` still has no ceiling for on purpose.

**What R9 inherits, and it is more than an open gate.** The `town-wall` run at
x -64 is 64 m of wall with the gate already in it, to be extended rather than
replaced. `ward: "outside"` is a room's third answer, with `test/layout.mjs`
check 4c holding what that word costs: clear of the curtain, standing on a
piece of `config.ground.outside`, reached by nobody. And the journal's map
frame grew from 67.6 m wide to 90.8 (#706). R9's town does not fill the gap
that left on the map: it stands west of the town wall, and its rooms and the
yard move to a map drawing of their own, which takes the castle's frame back
to 67.6 (#725, #726).

**The open call it settled: the player sees the yard and never stands in it**
(#703). R9 inherits that too. A town the player can walk into is a way out of
a castle `test/layout.mjs` check 4 asserts is sealed, and that is a decision
to overturn rather than a street to place.

### Wave C — startable now

| Row | Model | Where | Lane |
| --- | --- | --- | --- |
| **R13** The floor plan you can see | Opus 5 | Container | B, and none at all for its first increment |
| **R9** A castle to get lost in: the town | Opus 5 | Container | B |
| ~~**R4** The retro castle: increment 1~~ | Opus 5 | Container | B |

**R4's first increment shipped on 2026-09-21** (#757 to #766): the fifteen
Poly Haven material sets are out and fifteen 128 px pixel textures the repo
draws itself are in, on the same fifteen names, with the rails and the
memory count that went with them (80.8 MB to 37.9, over 70 images). It
needed no `ktx`, no network and no GPU, the opposite of every asset row
before it. **Lane B is free again**; R9 can take it. What gates R4's second
increment is a look on Devon's machine, in the table under "Local: a GPU"
above.

**R13 is new on 2026-09-21** (#745 to #749) and it is in this wave because
nothing gates it. Devon asked for a way to see the whole floor plan; the
layout turns out to be four arrays of `data/scene-config.json` and not a
line of `src/castle-plan.js`, so the tool writes the file the prop editor
already writes (#745). **Its first increment writes nothing** — a top-down
orthographic view over the real scene, drawn from the plan's own boxes
(#746, #748) — which is why that increment is in no lane and may be claimed
beside R9. Increments 2 and 3 are lane B and may not.


A walled town's street, church and quay on the ground the yard proved. The
rooms go on the map the day they go in `config.rooms`, because the map is the
plan's list and not a second one (#588 to #591). **~~The street and the
church~~ shipped 2026-09-21** (#725 to #728): 131 meshes outside both wards,
the map back to 67.6 m and 40 rooms. **What is left is the quay and the
river**, outside the west gate; it has no `SPECS.md` section yet, so it is an
`architect` job first.

### Anytime — never gated, take it when the lane is free

| Row | Model | Where | Lane | Note |
| --- | --- | --- | --- | --- |
| **R10** Bodies | Fable 5.1 | Local: net | C | ~~The child and the hound~~ shipped 2026-09-17 (#643 to #645). ~~Two hens and the spear~~ shipped 2026-09-18 (#684 to #686), off poly.pizza. What is left is the GPU look, and the four activity clips R6 wants, which no body on disk has. Still trades activity clips with R6 in both directions. |
| ~~**R12b** Move-and-delete~~ | Opus 5 | Container | B | **Shipped 2026-09-17** (#636 to #642). The panel lists the rows within six tiles, `M` moves the selected one to the player's feet, `Delete` twice removes it, and `test/tools.mjs` went from 47 assertions to 179 with insert-then-delete byte-exact on both endings. **Lane B is free again.** |
| ~~**R12c** The dialogue format~~ | Opus 5 | Container | C | **Shipped 2026-09-18** (#687 to #690). `dialogue/castle.dlg`: six sigils, 13 speakers, 62 states, 182 lines, and what reaches each state written above it. `|` and `%` compile back into `data/npcs.json` and `data/quests/`; `@`, `:`, `?` and `!` are rebuilt from the clue graph and checked, never authored. `test/dialogue.mjs` is the fifteenth suite, 112 assertions. **Rank 12 is retired whole.** |
| ~~**R4a** The bells call~~ | Opus 5 | Container | A | **Shipped 2026-09-19** (#699 to #702). `day2.watches` is the morning's own list and the engine reads whichever list the day names; #533 is overturned in that clause and stands in the other. It is one bell long, so what changed on the screen is that the chapel bell rings on the morning after instead of returning nothing. No version bump. |
| ~~**R4b** The `since` field~~ | Opus 5 | Container | A | **Shipped** (#646 to #649). `since` rows on a fact, a third `performances` pool that says the changed fact in the guardroom at Lauds, and the grammar exported from `src/mystery.js` so there is one copy of it. It never touched `save.js`, which is the thing lane A was for. |

---

## What this file does not say

**It does not re-rank.** `BACKLOG.md`'s order is Devon's, and the order above
respects it everywhere a gate does not force otherwise. The one real inversion
is that wave A puts R8, R6 and R12a ahead of R4 and R5, and that is because R4's
remaining threads are a design call plus a local job while R5 sits behind gate
1. When R3 lands, the ranks and the order agree again.

**It does not claim a size it cannot see.** Five of the twelve are 2+ rows,
which by this repo's own rule means they will not finish in one sitting and
stay in the table afterwards with their text rewritten to say what is done. The
order above is an order for *starting*, not a schedule.

**It does not soften #53.** Every row marked `Local: GPU` also has a Node
acceptance criterion, deliberately, so the row is not blocked on hardware — but
a Node criterion met is not the row done. A session that meets the Node half
and calls the row closed has misread a split every one of those specs draws on
purpose.
