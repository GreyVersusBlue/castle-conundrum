# BACKLOG

Open work on Castle Conundrum, ranked. **`HISTORY.md` records what shipped;
this file ranks what is open; `PLAN.md` is the plan the seven shipped phases
came out of** and its "What this leaves for a later arc" list is where most of
the rows below came from. Nothing open lives in `HISTORY.md` and nothing that
shipped belongs here.

## Where things stand

**Castle Conundrum v2 is finished** (#489, 2026-09-15). All seven phases of
`PLAN.md` shipped, PRs #306 to #320 in `tools-and-games`. **The project moved
here on 2026-09-15** (#491 to #503): its own repo, its own CI, Vite instead of
a hand-vendored `libs/`, and a 200 MB asset ceiling instead of 44.4.

**11 ranked items.** Take rank 1.

Two things are true of the whole list and worth saying once. **Nothing here has
been seen on a GPU since Phase 5.** `npm run play` walks the whole intended day
— twelve people, ten pieces of evidence, three bells, a reload at Sext, the
accusation and the epilogue, 102 assertions — and no run of it since Phase 5 has
happened on a machine with real compositing (#53). Rank 4 is that run. And
**the game has never had a thumb on it**: pointer lock has no phone form at all.

## How this repo is worked

The standing instruction is *"work the next batch of ranked items in
`BACKLOG.md`, open a PR, merge to `main`."* It runs unattended; Devon is not
reviewing these rounds. **Never stop to ask.** If a row needs a judgement call,
make it, ship it, and record the call in `HISTORY.md` as a locked decision so
it can be reversed cheaply.

**A batch is what fits in one pull request and can be closed out in one
sitting** (#497). That is a judgement, and the `Size` column is there to inform
it, not to arithmetic it: the old repo's "up to 6 quarters, 3 halves, or one 1"
was measured against a cost that scaled with the number of *areas* a batch
spanned, and this repo has one area. Whatever the batch, it merges as **one
PR**, every row in it. A **2+** row is the whole batch on its own, will not
finish in one session, and stays in the table afterwards with its text rewritten
to say what is done.

**Claim your row before you start.** Write your branch name into the `Claimed`
column, commit that alone, open a PR, merge it, then start (#283). A claim on a
branch nobody else can read is not a claim: two sessions in the old repo once
built the same row in full. Clear the column after your merge is confirmed, in
the same pass that updates this header.

**Definition of done.** The work is on a branch and the branch is a merged PR
with CI green. `npm run build` and `npm test` both pass. Any guard-rail you
added has been broken on purpose once, from a green baseline, and you watched
it fail and can say which assertion and what it said (#34). `HISTORY.md` has
your decisions and this file's header, ranks and `Claimed` column are updated
**before you finish** — never left for a later session.

## The ranked table

| Rank | Item | Size | Model | Claimed | Detail |
| --- | --- | --- | --- | --- | --- |
| 1 | KTX2/Basis, meshopt and Draco over the 43 MB of assets, via `@gltf-transform/cli` | 1 | Opus 5 |  | [Asset compression](#asset-compression) |
| 2 | Sound: footsteps by surface, and the bell | ½ | Fable 5.1 |  | [Sound](#sound) |
| 3 | A fourth body, and a woman's in particular | ½ | Fable 5.1 |  | [A fourth body](#a-fourth-body) |
| 4 | A real GPU run of `npm run play`, and somebody looks at the twelve | ¼ | Opus 5 |  | [The GPU run](#the-gpu-run) |
| 5 | A new preview and og card, from that run | ¼ | Opus 5 |  | [The GPU run](#the-gpu-run) |
| 6 | Touch: pointer lock has no phone form | 1 | Opus 5 |  | [Touch](#touch) |
| 7 | The turrets and the tower tops: four cylinders nobody can climb | 1 | Fable 5.1 |  | [The turrets](#the-turrets) |
| 8 | The town side: a textured ground outside the west barbican, and a road | 1 | Fable 5.1 |  | [The town side](#the-town-side) |
| 9 | Stirling's Great Hall roof: a hammerbeam from `structure-cross.glb` | ½ | Sonnet 5 |  | [The hall roof](#the-hall-roof) |
| 10 | A second day, in which the epilogue's consequences play | 2+ | Opus 5 |  | [A second day](#a-second-day) |
| 11 | `test/layout.mjs` and `test/plan-vs-scene.mjs` overlap; decide what each is for | ¼ | Sonnet 5 |  | [The two plan suites](#the-two-plan-suites) |

## Asset compression

**Rank 1.** `assets/` is 43 MB across 127 files the page actually fetches:
1k Poly Haven texture sets as .jpg, a Kenney kit of .glb, and three NPC bodies.
None of it is compressed for the GPU — every texture is decoded to RGBA in
video memory at full size, and every mesh ships as uncompressed glTF.

The work is `@gltf-transform/cli` over the lot: **KTX2/Basis** for the
textures, **meshopt** for the geometry, **Draco** where meshopt does not pay.
three r169 reads all three with the loaders it already ships
(`KTX2Loader`, `MeshoptDecoder`, `DRACOLoader`); wiring them into
`src/assets.js` is the code half, and the transcoder and decoder files are
dependencies that have to land under this origin like everything else (#493).

The ceiling is **200 MB** and this is not a fight for room under it (#499).
The current build is 42.0 MB with 158 MB of headroom, so the reason to do this
is load time and video memory, not weight. Two things to hold it to:
`test/assets.mjs`'s reachability sweep must still pass over whatever the
pipeline writes, and `test/built.mjs` diffs the file sets the source page and
the built page fetch — if the pipeline runs at build time rather than as a
committed re-encode, those two sets stop matching and that assertion is the
one that will say so.

**Devon's brief, 2026-09-15**, named this increment two of the move and rank 1
here, explicitly not the session that did the move.

## Sound

**Rank 2.** `AudioListener` is on the camera and nothing has ever played
through it. Footsteps on planks against footsteps on pavers is the cheap one
and the surface is already known — `surfacesAt` in `src/castle-plan.js` returns
it. The bell is the obvious one: four watches, and ringing it is the single
most consequential press in the game.

## A fourth body

**Rank 3.** Marged, Nest and Lady Alys are three of twelve and the Kenney kit
has no woman's body. Twelve NPCs come off three bodies by tint (#417, #419) and
that was accepted as a risk, not as a solution. **Question 1 for Devon in
`PLAN.md`**, and under this repo's own rule a session may answer it: find or
make a fourth body, add it to `data/npcs.json`'s `cast`, and record the call.

## The GPU run

**Ranks 4 and 5.** `npm run play` has not run on a machine with real GPU
compositing since Phase 5 (#53). It is 102 assertions over the whole day and it
writes a numbered screenshot per beat into `shots/play/`. Two things come out
of one run: whether the walk, the stairs and the wall walk actually behave, and
whether **twelve NPCs off three bodies read as twelve** — photograph all twelve
in the Great Hall at Vespers and look (`PLAN.md`, Risks).

Rank 5 depends on rank 4 having happened. The board preview and og card in
`tools-and-games` are from before Phase 3: they show the archway wide open in a
7x7 courtyard that no longer exists, with none of the HUD the game has now
(#374, #379). New images come out of the same run. **Where they go is Devon's**
— those two files live in `tools-and-games/assets/` and he relinks.

## Touch

**Rank 6.** Pointer lock has no phone form and the project has never had a
thumb on it. This is a second input scheme, not a HUD addition: look, move,
sprint, and a single E that has to mean talk, examine and ring depending on
what is in front of it.

## The turrets

**Rank 7.** Four cylinders nobody can climb. A third stair per inner tower and
a view over the whole plan from 12 m. Phase 5 built the upper level and the
wall walk and stopped below the tower tops.

## The town side

**Rank 8.** The world ends at the curtain by budget. A textured ground outside
the west barbican and a road is one texture set Devon dropped
(`forest_ground_06`) and a different ending — the clerk arrives from somewhere
and currently that somewhere is a hard edge.

## The hall roof

**Rank 9.** The Great Hall is full height with a flat ceiling. A hammerbeam
from `structure-cross.glb` is a day's work and not a gameplay change.

## A second day

**Rank 10, and a 2+.** The save schema already has `watch` and `accusations[]`
and nothing stops a day two in which the epilogue's consequences play. The
content does not exist — that is the whole row, and it is a writing job the
size of `PLAN.md`'s mystery section before it is a code job. Do one increment,
ship it, leave the row standing.

## The two plan suites

**Rank 11.** `test/layout.mjs` checks the plan's arithmetic in Node and
`test/plan-vs-scene.mjs` checks the scene against the same plan in a browser,
and the second is slower than the whole rest of the suite put together. Phase 2
wrote `layout.mjs` when it was the only check there was; some of what it asserts
is now asserted twice, and a check that re-implements the thing it checks is not
a check (#34). Read both, decide what each is for, and delete what is doubled —
but break whatever you keep on purpose first, because "these two overlap" is
exactly the reasoning that leaves two lines guarding the same absence and both
of them dead.
