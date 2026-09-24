# ROADMAP

**`BACKLOG.md` says what is worth doing and in what priority. This file says
what can be done *when*, on *what machine*, and *next to what else*.**
`SPECS.md` is the spec behind every row and `HISTORY.md` is the only record.
Nothing here is a locked decision except the lane rule (#600 to #602).

Eight open rows: 3, 4, 6, 7, 9, 10, 11, 13. Rows are named by title as well as
by rank (#522), because a rank is a priority and gets reused across different
rows over time, never renumbered mid-table (#619, #491).

---

## 1. What needs a machine this container is not

Three different reasons, and they are not interchangeable (#53).

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

### Local: a network that reaches the asset hosts

Not a GPU question. Past container attempts could not reach quaternius.com,
itch, poly.pizza, OpenGameArt or Patreon; another could reach poly.pizza.

| Row | Model | What to fetch |
| --- | --- | --- |
| **10 Bodies**, sourced half | Fable 5.1 | A low-poly, one-rig, CC0 body per new kind. The child and the hound shipped without a fetch at all — the child is the existing rig scaled down (#643 to #645); two hens and a spear came off poly.pizza (#684 to #686). What is left here: the GPU look, and any kind the generator (below) should not make. |

Every body goes through `tools/encode-assets.mjs` before commit (#506); an
uncompressed body is the one asset nothing else on this list would catch.

### Local: speakers and a person

| Row | Model | Which half |
| --- | --- | --- |
| **7 Sound** | Fable 5.1 | Three increments shipped in a container, all synthesised (#620 to #623, #680 to #683, #696 to #698). Whether any of it sounds right is not a container's question — the listening checklist is in `SPECS.md`. |

### Container, start to finish

**6** populace, **9** the town (past its next increment, which has no spec
yet), **10** bodies' generated half (both increments shipped: the five clips
and a generated cow, #787 to #790, #794, 34 bodies built), **13** the
floor-plan editor's remaining increments. Every one is data, a validator, a
Node suite or a headless DOM assertion.

---

## 2. What can run at the same time

Two sessions collide on one thing: a file they both write. **One row per
lane at a time** (#602). The lanes are named by the file, not by the theme.

| Lane | The file that decides it | Rows in it |
| --- | --- | --- |
| **A** | `src/save.js` — the version number and `migrate` | none held; next bump is to 7 |
| **B** | `data/scene-config.json`, and `test/tools.mjs`'s byte-exactness rail | 4, 9, 13 (increments 2 and 3 only) |
| **C** | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 6, 10 |
| **D** | `src/main.js`'s player rig and spawn | 6, 11 |
| **E** | `src/audio.js` and `data/sounds.json` | 7 |
| **none** | | 3 |

Lane B: rank 4 and rank 9 both write `data/scene-config.json` and do not run
together; rank 9's next increment (the quay) has no `SPECS.md` section yet
and is not startable regardless. Lane C and D: rank 6 holds both, so it does
not run beside rank 10 (lane C) or rank 11 (lane D) — a clean merge of two
lane-C rows is not the same as a correct one; nothing in `npm test` would
have caught the day rank 1 and rank 6 once shared a merge where five of
rank 6's ten people were left wearing the wrong body (found by hand, not by
CI). Rank 10 and rank 11 do not share a lane and may run together.

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

**Startable together right now, with no gate on any of them:** rank 3 on
Devon's machine, plus one lane-B row (4 or 9) and one of {rank 6 alone} or
{ranks 10 and 11 together}, plus rank 7 in lane E alongside any of them.

---

## 3. The order

**Rank 3 is the highest-value hour on this list.** Its gate is open
(#780 to #782) and it unblocks rank 11 past its Node line. Nothing else
gates on it starting — every other row above runs alongside it.

**One gate stands**: rank 3 before rank 11 ships past its Node acceptance.
Rank 11's own spec says nothing in it goes past a `snap` and a sentence
until the GPU run has happened. Every other gate this list carried has
shipped and is retired: rank 4c's yard unlocked rank 9's town on 2026-09-19
(#703 to #707); the two renders rank 3 and rank 5 once needed both arrived
without waiting for `npm run play` to reach the end of its day (#634, #635,
#656 to #658) — the lesson from both: name the render a row needs, not the
row that happens to produce one; and **do not gate a looking on a walking**
— a row's judgement half and its walking half fail independently, every
time this list has tried them together.

**No other order is forced.** `BACKLOG.md`'s rank order is Devon's and this
file respects it everywhere a lane or a gate does not force otherwise: take
the highest-ranked row whose `Where`, `Gate` and `Lane` you can actually
meet.

---

## What this file does not say

**It does not re-rank.** `BACKLOG.md`'s order is Devon's.

**It does not claim a size it cannot see.** A 2+ row will not finish in one
sitting and stays in the table afterwards with its text rewritten to say
what is done.

**It does not soften #53.** Every row marked `Local: GPU` also has a Node
acceptance criterion, deliberately, so the row is not blocked on hardware —
but a Node criterion met is not the row done.
