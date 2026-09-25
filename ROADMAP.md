# ROADMAP

**`BACKLOG.md` says what is worth doing and in what priority. This file says
what can be done *when*, on *what machine*, and *next to what else*.**
`SPECS.md` is the spec behind every row and `HISTORY.md` is the only record.
Nothing here is a locked decision except the lane rule (#600 to #602).

Fourteen open rows: 1, 2a, 2b, 2c, 2d, 2e, 2f, 3, 4, 6, 7, 9, 11, 13. Rows are
named by title as well as by rank (#522), because a rank is a priority and
gets reused across different rows over time, never renumbered mid-table
(#619, #491). Devon re-ranked on 2026-09-25, reopening ranks 1 and 2 for the
Blender rows and retiring rank 10 into 2c and 2d (#801, #802, #807).

---

## 1. What needs a machine this container is not

Four different reasons, and they are not interchangeable (#53).

### Local: Blender

A session without `blender` on `PATH` (or at `BLENDER`) skips a Blender
row's build increment; CI runs only `test/assets.mjs` check 8 against the
committed output, which needs no Blender (#804, #808). Blender 4.5 LTS is
pinned; nothing else is accepted (#805). It runs headless, `blender -b -P`,
on Devon's Windows machine only, never in a container. 2c's and 2d's clips
are also judged under "Local: a GPU" below, once rendered (#53).

| Row | Model | Status |
| --- | --- | --- |
| **1 Blender: the pipeline** | Opus 5 | Specced 2026-09-25 (#801 to #808), nothing built. Gates every rank 2 pack. |
| **2a Blender: evidence props** | Opus 5 | Specced 2026-09-25 (#810 to #812, #816, #819), nothing built. |
| **2b Blender: an interiors kit** | Opus 5 | Specced 2026-09-25 (#813 to #816, #819), nothing built. |
| **2c Blender: a shared rig with swappable parts** | Opus 5 | Specced 2026-09-25 (#820 to #825), nothing built. Increment 1 is Blender; increment 2 is a container. |
| **2d Blender: the animals** | Opus 5 | Specced 2026-09-25 (#826 to #829), nothing built. |
| **2e Blender: the countryside beyond the wall** | Opus 5 | Specced 2026-09-25 (#816 to #819), nothing built. |

### Local: a GPU

`npm run play` opens a real visible window and plays the whole day with
pointer lock and real key presses, 102 assertions, screenshots into
`shots/play/`. It is not in CI. **A real-time assertion that fails under
software-rendered Chromium is inconclusive, not confirmed** — a container
cannot trust a pass either.

| Row | Model | Status |
| --- | --- | --- |
| **3 The GPU run** | Opus 5 | Its gate shipped 2026-09-21 (#780 to #782). The judgement half is done — the twelve, the Lauds sky, the covered hall are all answered in `HISTORY.md`. What is left is `npm run play` reaching exit 0; the third sitting's second run got to the accusation with the wrong ending before the gate's fix. |
| **4 The retro castle**, past increment 1 | Opus 5 | Increment 1 shipped in a container, no GPU needed (#757 to #766). Increment 2 is gated on a look: the checklist is in `SPECS.md`. |
| **11 Feel**, past its Node line | Sonnet 5 | The Node half shipped 2026-09-17 (#650 to #654): a shadow decal and a reaching hand, nine assertions in `plan-vs-scene.mjs`. What is left is whether either reads on a GPU. Gated on rank 3 (below). |
| **2c Blender: a shared rig with swappable parts**, the clips | Opus 5 | Once rendered, the eleven clips and the hen-wife beside a Quaternius body are a GPU look, the gate on committing anything under `assets/blender/folk/` (#824, #53). |
| **2d Blender: the animals**, the clips | Opus 5 | Once rendered, each kind at 10 m and its clips are a GPU look; blocks nothing in `npm test` (#53). |

### Local: a network that reaches the asset hosts

Not a GPU question. Past container attempts could not reach quaternius.com,
itch, poly.pizza, OpenGameArt or Patreon; another could reach poly.pizza.
No row needs it today: rank 10, the row this table used to name here, is
retired into 2c and 2d (#807). Sourcing CC0 stays allowed inside 2c and 2d
if their sections say so (#787).

Every body goes through `tools/encode-assets.mjs` before commit (#506); an
uncompressed body is the one asset nothing else on this list would catch.

### Local: speakers and a person

| Row | Model | Which half |
| --- | --- | --- |
| **7 Sound** | Fable 5.1 | Three increments shipped in a container, all synthesised (#620 to #623, #680 to #683, #696 to #698). Whether any of it sounds right is not a container's question — the listening checklist is in `SPECS.md`. |

### Container, start to finish

**2f** Devon's props, placed (#830 to #834), on any machine with `ktx` on
PATH, since `npm run assets:encode` refuses to start without it; no Blender.

**6** populace, **9** the town (its next increment, the quay and the river,
is specced as two `builder` jobs, #795 to #798), **2c**'s increment 2 (the
other 15 populace humans onto `folk.glb`, once increment 1's GPU look has
passed), **13** the floor-plan editor's remaining increments. Every one is
data, a validator, a Node suite or a headless DOM assertion.

---

## 2. What can run at the same time

Two sessions collide on one thing: a file they both write. **One row per
lane at a time** (#602). The lanes are named by the file, not by the theme.

| Lane | The file that decides it | Rows in it |
| --- | --- | --- |
| **A** | `src/save.js` — the version number and `migrate` | none held; next bump is to 7 |
| **B** | `data/scene-config.json`, and `test/tools.mjs`'s byte-exactness rail | 1, 2a, 2b, 2e, 2f, 4, 9, 13 (increments 2 and 3 only) |
| **C** | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 2c, 2d, 6 |
| **D** | `src/main.js`'s player rig and spawn | 6, 11 |
| **E** | `src/audio.js` and `data/sounds.json` | 7 |
| **F** | `tools/blender/` and `tools/blender/manifest.json` | 1, 2a, 2b, 2c, 2d, 2e |
| **none** | | 3 |

Every Blender row holds lane F, so only one runs at a time, which matches
the one machine with Blender anyway (#804). A Blender row in lane B (1, 2a,
2b, 2e) does not run beside rank 4, rank 9 or rank 13's increments 2 and 3.
2c and 2d in lane C do not run beside rank 6.

Lane B: rank 4 and rank 9 both write `data/scene-config.json` and do not run
together; rank 9's quay increments also write `src/castle-builder.js`
(the gable, 3a), a second reason not to run beside rank 4. Lane C and D:
rank 6 holds both, so it does not run beside 2c or 2d (lane C) or rank 11
(lane D) — a clean merge of two lane-C rows is not the same as a correct
one; nothing in `npm test` would have caught the day rank 1 and rank 6 once
shared a merge where five of rank 6's ten people were left wearing the wrong
body (found by hand, not by CI). 2c, 2d and rank 11 do not share a lane and
may run together.

**Rank 3, the GPU run, needs a `git worktree`, not a lane.** It does not
write the tree; it reads it for ten minutes at a stretch with a browser
holding the page open. Another session's `git checkout` in the same working
tree wiped this row's uncommitted edits mid-run once, and Vite full-reloaded
the page whenever anything under `src/` changed. A working tree is a
resource two sessions cannot share regardless of lane — `npm test`, `dist/`,
the harness ports and `HEAD` are one copy each. `git worktree add` plus a
junction for `node_modules` is the whole cost; take one before starting the
run.

**Read `HISTORY.md` on `origin/main` when you write your decision entry, not
when you branched.** Two rows once picked the same next-free band from a
stale view and had to renumber twice. A decision number is picked at the end
of a row, not the start.

**Startable together right now:** 2f (lane B), and after it rank 1 on
Devon's machine (lanes F and B),
plus rank 3 on the same machine in a worktree, plus rank 6 or rank 11 (not
both, lane D), plus rank 7 in lane E alongside any of them.

---

## 3. The order

**2f, Devon's props, runs before everything else in the band**, on his
request of 2026-09-25 (#830). It needs no Blender and has no gate. It holds
lane B, so rank 1 follows it rather than running beside it, and rank 1 then
finds `propPath` already shipped. **Blender runs first, on Devon's own instruction** (#801). The order inside
the band is 1 the pipeline, then 2a evidence props (lowest risk: it proves
the encode, manifest and budget paths on real content), then 2b the
interiors kit, then 2c the shared rig, then 2d the animals, then 2e the
countryside backdrop. The gates inside the band: 2a after 1; 2b after 2a;
2d after 2c's increment 1; 2e after rank 9's increment 3b, a container row,
so rank 9's quay can run while the Blender rows do, lanes permitting, but
not at the same time as a lane-B Blender row (1, 2a, 2b or 2e).

**Rank 3 is still the highest-value hour on a GPU.** Its gate is open
(#780 to #782) and it unblocks rank 11 past its Node line. It runs on the
same machine as the Blender rows, in a `git worktree`, alongside them.

**One gate outside the band stands**: rank 3 before rank 11 ships past its
Node acceptance. Rank 11's own spec says nothing in it goes past a `snap`
and a sentence until the GPU run has happened. Every other gate this list
carried has shipped and is retired: rank 4c's yard unlocked rank 9's town on
2026-09-19 (#703 to #707); the two renders rank 3 and rank 5 once needed
both arrived without waiting for `npm run play` to reach the end of its day
(#634, #635, #656 to #658) — the lesson from both: name the render a row
needs, not the row that happens to produce one; and **do not gate a looking
on a walking** — a row's judgement half and its walking half fail
independently, every time this list has tried them together.

**No other order is forced.** `BACKLOG.md`'s rank order is Devon's and this
file respects it everywhere a lane or a gate does not force otherwise: below
the Blender band, the existing rows keep their relative order; take the
highest-ranked row whose `Where`, `Gate` and `Lane` you can actually meet.

---

## What this file does not say

**It does not re-rank.** `BACKLOG.md`'s order is Devon's. Devon himself
re-ranked on 2026-09-25, reopening ranks 1 and 2 for the Blender
rows and retiring rank 10 (#801, #802, #807); this file's job is still only
to sequence what he ranks, not to rank it.

**It does not claim a size it cannot see.** A 2+ row will not finish in one
sitting and stays in the table afterwards with its text rewritten to say
what is done.

**It does not soften #53.** Every row marked `Local: GPU` also has a Node
acceptance criterion, deliberately, so the row is not blocked on hardware —
but a Node criterion met is not the row done.
