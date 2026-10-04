# ROADMAP

**`BACKLOG.md` says what is worth doing and in what priority. This file says
what can be done *when*, on *what machine*, and *next to what else*.**
`SPECS.md` is the spec behind every row and `HISTORY.md` is the only record.
Nothing here is a locked decision except the lane rule (#600 to #602).

Nine open rows: 2b, 2c, 2d, 2i, 3, 4, 6, 7, 11, and ~~2a~~ (#907),
~~2e~~ (#908), ~~3a~~ (#916), ~~3b~~ (#917), ~~13~~ (#909), ~~9~~ (#910), ~~2h~~ (#962), ~~2f~~ and ~~2g~~ shipped (#830 to #838). Rows are named by title as well as by rank
(#522), because a rank is a priority and gets reused across different rows
over time, never renumbered mid-table (#619, #491). Devon re-ranked on
2026-09-25, reopening ranks 1 and 2 for the Blender rows and retiring rank 10
into 2c and 2d (#801, #802, #807). He added 2h, "Castle in Blender", on
2026-09-26 (#839), and it shipped 2026-10-03 (#962).

---

## 1. What needs a machine this container is not

Four different reasons, and they are not interchangeable (#53).

### Local: Blender

A session without `blender` on `PATH` (or at `BLENDER`) skips a Blender
row's build increment; CI runs only `test/assets.mjs` check 8 against the
committed output, which needs no Blender (#804, #808). Blender 5.2 LTS is
pinned; nothing else is accepted (#879, which moved #805's 4.5). It runs headless, `blender -b -P`,
on Devon's machines only, huginn or Windows, never in a container (#878);
both machines have 5.2.2 already. Rank 2i
is "Local: Blender GPU": Devon's Windows machine only (#878). 2c's and 2d's clips
are also judged under "Local: a GPU" below, once rendered (#53).

**2i inherits 2h's exception by machine, not by version** (#840, #879, #962):
the Steam install, `5.2.2 LTS`, found at `CASTLE3D_BLENDER` or the Steam path
and never at `BLENDER`, which is `tools/blender/`'s (#842). Both pin 5.2 now. Nothing of it is committed but
scripts, so CI neither runs nor checks it. 2h's increments 1, 6 and 7 needed
a network that reaches Poly Haven, once each, into a hash-pinned cache.

| Row | Model | Status |
| --- | --- | --- |
| **2b Blender: an interiors kit** | Opus 5 | Specced (#813 to #816, #819), gate discharged (#946), increment 1 shipped on huginn (#947): four sets, five placed; increment 2 respecced as the cell alone (#951 to #953), a `builder` job: the barred-station rail, then `cell-pallet`, 1 outer-ward draw (1193 of 1200), no chapel set; left: increment 2, increment 3 gated on rank 4's look, the Windows GPU look. |
| **2c Blender: a shared rig with swappable parts** | Opus 5 | Specced 2026-09-25 (#820 to #825). Increment 1 shipped on huginn (#939 to #941). Left: the Windows GPU look, then increment 2, a container job. |
| ~~**2d Blender: the animals**~~ | Opus 5 | ~~Specced 2026-09-25 (#826 to #829).~~ Both increments shipped on huginn (#942 to #945). Nothing left for Blender; the Windows GPU look is under "Local: a GPU". |
| **2i Castle in Blender, the integration row** (Blender 5.2) | Opus 5 | Shape decided 2026-10-02 (#919 to #924); specced 2026-10-03 (#963 to #968), argued from #961's master: one skin file cut by stage, `curtain`, `buildings`, `town`, `land`, the ceilings moved in #966. Increment 1, #922's open gate in the model, built (#970), its still awaiting Devon's line. Increment 2, the skin, next, a `builder` job on Devon's Windows machine. |

### Local: a GPU

`npm run play` opens a real visible window and plays the whole day with
pointer lock and real key presses, 102 assertions, screenshots into
`shots/play/`. It is not in CI. **A real-time assertion that fails under
software-rendered Chromium is inconclusive, not confirmed** — a container
cannot trust a pass either.

| Row | Model | Status |
| --- | --- | --- |
| **3 The GPU run** | Opus 5 | The fourth sitting confirmed the sight fix on a GPU and walked the whole day and the second day for the first time (#886 to #891). What is left is `npm run play` reaching exit 0: 3a (#916) and 3b (#917) shipped, so one more GPU run, which also confirms 3b's three beats and the three Play Again beats, the phone in the room (#530), and a shot, the quay through the fog (#910): seven stills of it are in `looks/2026-10-03/` (#900) and Devon's verdict on them is owed. |
| **4 The retro castle**, past increment 1 | Opus 5 | Increment 1 shipped in a container, no GPU needed (#757 to #766). What is left is the look: the checklist is in `SPECS.md`. Increment 2 is superseded by 2h (#839). |
| **11 Feel**, past its Node line | Sonnet 5 | The Node half shipped 2026-09-17 (#650 to #654): a shadow decal and a reaching hand, nine assertions in `plan-vs-scene.mjs`. What is left is whether either reads on a GPU. Gated on rank 3 (below). |
| **2c Blender: a shared rig with swappable parts**, the clips | Opus 5 | The eleven clips and the hen-wife beside a Quaternius body are a GPU look, the gate on increment 2 (#939, #53). Increment 1 is committed (#941). |
| **2d Blender: the animals**, the clips | Opus 5 | Both increments are committed (#943, #945). The look is six kinds at 10 m and their clips on Windows; blocks nothing in `npm test` (#53). |

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

~~**2f** Devon's props, placed (#830 to #834), on any machine with `ktx` on
PATH, since `npm run assets:encode` refuses to start without it; no
Blender.~~ **Shipped** in `01ee3dd`.

~~**2g** the chapel nave (#835 to #838), on the same terms, after 2f: two
files restored from `51735fa` and encoded, a room, two walls and 14 rows.~~
**Shipped** in `41457cb`.

~~**3a** Play Again starts over (#889): `src/gvb-save.js`'s `autosave.stop()`
and a Node test in `test/save.mjs`.~~ **Shipped** (#916). **6**
populace (19 chatter pairs placed and played, #911 to #938; the GPU look and the town's share left), **2c**'s increment 2 (the
other 15 populace humans onto `folk.glb`, once increment 1's GPU look has
passed). Every one is
data, a validator, a Node suite or a headless DOM assertion.

---

## 2. What can run at the same time

Two sessions collide on one thing: a file they both write. **One row per
lane at a time** (#602). The lanes are named by the file, not by the theme.

| Lane | The file that decides it | Rows in it |
| --- | --- | --- |
| **A** | `src/save.js` — the version number and `migrate` | none held; next bump is to 7 |
| **B** | `data/scene-config.json`, and `test/tools.mjs`'s byte-exactness rail | 1, 2b, 4 |
| **C** | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 2c, 2d, 6 |
| **D** | `src/main.js`'s player rig and spawn | 6, 11 |
| **E** | `src/audio.js` and `data/sounds.json` | 7 |
| **F** | `tools/blender/` and `tools/blender/manifest.json` | 1, 2b, 2c, 2d |
| **G** | `tools/castle3d/`, and `data/castle-skin.json` (#963) | 2i |
| **none** | | 3 |

Every Blender row holds lane F, so only one runs at a time, which matches
the one machine with Blender anyway (#804). Lane G is 2i's and
shares no file with F, so it may run beside a lane F row: two Blenders on
one machine, which is Devon's call on the day (#842). Both add a line to
`package.json`'s scripts, a one-line merge. The Blender row in lane B (2b)
does not run beside rank 4.
2c and 2d in lane C do not run beside rank 6.

Lane B: rank 4 and 2b both write `data/scene-config.json` and do not run
together. Lane C and D:
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

**Startable together right now:** ~~2f (lane B), then 2g (lanes B and
E)~~, both shipped; 2b on Devon's machine (lanes F and B), plus rank 3
on the same machine in a worktree, plus rank 6 or rank 11 (not both, lane
D), plus rank 7 in lane E alongside any of them, plus 2i in lane G on the
same machine if Devon wants two Blenders at once, now that 2h has shipped
and closed (#962).

---

## 3. The order

~~**2f, Devon's props, runs before everything else in the band**, on his
request of 2026-09-25 (#830). It needs no Blender and has no gate. It holds
lane B, so rank 1 follows it rather than running beside it, and rank 1 then
finds `propPath` already shipped.~~ **Shipped** (#830 to #834), in
`01ee3dd`. ~~**2g, the chapel nave, follows 2f and precedes rank 1** on the
same terms: it is Devon's answer to 2f's pulpit and rood, lane B, no
Blender, no gate (#835). It also holds lane E for one line of
`data/sounds.json`, so it does not run beside rank 7 if rank 7 writes that
file.~~ **Shipped** (#835 to #838), in `41457cb`. **Blender runs first, on
Devon's own instruction** (#801). The pipeline shipped on 2026-10-01 (#880 to #884). The order inside
the band began with 2a evidence props, which shipped (#907) and proved
the encode, manifest and budget paths on real content; then 2b the
interiors kit, then 2c the shared rig, then 2d the animals; 2e the
countryside backdrop shipped (#908). The gates inside the band: 2b after 2a, which shipped (#907), so that gate is
open; 2d after 2c's increment 1. **2h was not in that order**: it had no
gate, went through nothing of `tools/blender/`'s, and started whenever
Devon's machine was free (#839, #840); it shipped and closed 2026-10-03
(#962). The integration row,
**2i** (#919 to #924), puts its model in the game as a skin swap, last in the
band, in lane G; its gate, 2h's increment 9, has shipped (#961), and its
spec, which waited on that increment's numbers (#923), is written (#963 to
#968). Its six increments run in order, each stage's GPU look before the
next stage.

**Rank 3's hour on a GPU is spent: the fourth sitting confirmed the sight
fix** (#886 to #891). What is left of the row, 3a (#916) and 3b (#917) having shipped, is one more
GPU `npm run play`; it needs Devon's Windows machine and nothing else.

**One gate outside the band stands**: rank 3 before rank 11 ships past its
Node acceptance. Rank 11's own spec says nothing in it goes past a `snap`
and a sentence until the GPU run has happened. Every other gate this list
carried has shipped and is retired: rank 4c's yard unlocked rank 9's town on
2026-09-19 (#703 to #707), and rank 9 is retired (#910); the two renders rank 3 and rank 5 once needed
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
