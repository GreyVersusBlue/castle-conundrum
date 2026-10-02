# BACKLOG

Open work on Castle Conundrum, ranked. **`HISTORY.md` records what shipped;
this file ranks what is open; `ROADMAP.md` puts the open rows in an order and
says which machine each needs; `SPECS.md` is the spec for each row below;
`PLAN.md` is the plan the seven shipped phases came out of** and its "What this
leaves for a later arc" list is where most of the rows below came from. Nothing
open lives in `HISTORY.md` and nothing that shipped belongs here.

Each row's `Detail` link goes to its section in `SPECS.md`: scope by file,
acceptance criteria and the suite that holds them, the open judgement calls with
a recommended answer, dependencies, and the house rules that bite. The sections
under the table here are the one-paragraph summaries; where a summary and
`SPECS.md` differ, `SPECS.md` was written against the code and wins.

## Where things stand

Castle Conundrum is a finished first-person murder mystery in three.js: a day
of walking the castle before the killing, a four-bell mystery day with twelve
suspects, an accusation, and a morning after with a thirteenth cast member
(#489, #533 to #540, #699 to #707). `npm run dev` serves it; `npm run build`
produces `dist/`, the only thing served in production (#494, #505). Assets are
compressed (KTX2/Basis, meshopt) except the Kenney kit and this repo's own
generated pixel-art textures at 128 px or under (#506, #742, #757 to #766).
`du -sh assets` is 28 MB, against a 200 MB ceiling (#499). Fifteen suites run
under `npm test`; `npm run play` is the GPU-backed end-to-end walk and only
runs by hand, on Devon's machine (#53). Devon made Blender-built assets the
project's top priority on 2026-09-25 (#801).

**Shipped and closed**, in one line each, numbers only: the move to this repo
and asset compression (#491 to #510); four GPU-found fixes from Phase 5
(#511 to #517); synthesised footstep and bell sound (#519 to #522); the tower
roofs (#523 to #526); the Great Hall's roof frame and its covering (#527,
#528, #656 to #658); the plan-suite split, `layout` / `plan-vs-scene` /
`mystery` (#529); touch controls (#530 to #532); the second day and morning
after, whole, including the bells call and the gaol roll (#533 to #540, #571
to #575, #699 to #707); the lore row, its documents and its two set pieces
(#551 to #555, #556 to #559, #592 to #596); the texture sets and the town's
ground (#541 to #546); the wishlist's eight rows opened as ranks 6 to 13
(#560 to #567); the fourth body (#603 to #606); all twelve side quests plus
reputation by ward (#576 to #581, #591 to #599, #612 to #615, #691 to #695);
the placement editor, its budget suite, move-and-delete, and the dialogue
format — this closed rank 12 whole (#583 to #587, #607 to #611, #636 to #642,
#687 to #690); the map (#588 to #591); the ambient beds, a bed at a point, and
two event sounds (#620 to #623, #680 to #683, #696 to #698); the byte-
exactness rail on both line endings (#631 to #633); the pointer-lock bug that
stopped the day being walked after the journal opened (#659 to #661); the
walker-on-the-stair routing fix (#716 to #720); two `plan-vs-scene` failures,
the chapel-candles aim and the populace beat's timing (#721 to #724); the
town's first increment, street and church (#725 to #728); the day-before
walking day, whole, all four increments (#750 to #756, #767 to #779); the
retro castle's first increment, fifteen generated textures replacing fifteen
photographed sets (#742 to #744, #757 to #766); the sight-ray fix that
aims at a body's own height instead of a fixed world height (#780 to #782);
the red suite, closed whole: the day-one `PROP_CLEARANCE` rail and its
extension to the walking day and the morning after (#785, #792, #793); and
bodies' generated half, increments 2a and 2b: five activity clips in the
four human rigs and a generated cow grazing in the outer ward, 34 bodies
built (#787 to #790, #794); and, in rank 6, the first four of those clips
placed in the household's routines (#800); and rank 10, retired into 2c and
2d (#807); and Devon's own props placed, 70 rows from 69 files dressing
thirteen rooms and two open-ward stretches (#830 to #834); and the chapel
nave, a new inner-ward ground room for the pulpit and the rood (#835 to
#838); and rank 9's quay and river, increments 3a and 3b, the toll-house
under Mereford's one slate gable and the water past it (#870 to #872); and
the Blender pipeline, `tools/blender/` with its manifest, `test/assets.mjs`
check 8 and a calibration crate placed in the kitchen (#880 to #884).

**Open, ranked below.** Devon made Blender-built assets the project's top
priority on 2026-09-25 and reopened ranks 1 and 2 himself to hold them
(#801). Thirteen rows: the Blender pack band,
five rows lettered by priority (2a evidence props, 2b an interiors kit, 2c a
shared rig with swappable parts, 2d the animals, 2e the countryside beyond
the wall); the castle rebuilt as a realistic standalone Blender model, outside
the pipeline (2h, #839 to #844); the GPU run itself, now gated on nothing (rank 3, #780 to #782);
the retro castle's look, its variety increment superseded by 2h (rank 4,
#839); the rest of
the fifty-person populace (rank 6); somebody with speakers to judge the
soundscape (rank 7); the rock, the last of rank 9, unspecced; the feel theme past
its shadow and hand (rank 11); and the floor-plan editor's drag increments
(rank 13). A session never reuses a retired rank; Devon may, and did, here
(#802). Rank 10 is retired, with 2c and 2d as its successors (#807). Ranks
5, 8 and 12 stay retired numbers, not gaps: a rank is a priority, never an
id, and a number a session retires is never reused (#619, #522, #491, #802).

**The red suite is closed.** Four increments shipped: the aim cone and the
populace beat's timing fix (#721 to #724); a `PROP_CLEARANCE` rail of 1.0 m
in `src/mystery.js`, moving the Chaplain and the Constable off the
gravestone and the candles, day one only (#785); the same rail extended to
the walking day and the morning after, seven stations moved in total
(#792, #793).

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

**Read the `Where`, `Gate` and `Lane` columns before you claim** (#600). A row
marked anything but `Container` cannot be finished from a session like this
one and should not be claimed by one; a row whose `Gate` has not shipped is
not startable at all; and a row whose `Lane` is already held by a live claim
will collide on one named file, so take a different lane (#602). `ROADMAP.md`
is the same three facts as an order.

**Definition of done.** The work is on a branch and the branch is a merged PR
with CI green. `npm run build` and `npm test` both pass. Any guard-rail you
added has been broken on purpose once, from a green baseline, and you watched
it fail and can say which assertion and what it said (#34). `HISTORY.md` has
your decisions and this file's header, ranks and `Claimed` column are updated
**before you finish** — never left for a later session.

## What the three labels mean

Three columns were added to the table below on 2026-09-17 (#600). They answer
the three things a session needs to know before it claims a row, and none of
them was written anywhere before: the header said "ranks 2, 3 and 5 need a
GPU" in a paragraph a reader had to parse, and said nothing at all about which
two rows would collide.

**Where.** Six values now, and five of them mean this container cannot
finish the row.

- **Container.** A session like this one closes it: data, validators, Node
  suites, headless Chromium.
- **Local: Blender.** Basic headless Blender: Blender 5.2 LTS on `PATH`
  (or at `BLENDER`), on either of Devon's machines, huginn or Windows
  (#804, #878, #879). Both have 5.2.2 already: huginn on PATH, Windows as
  the Steam install; `render.mjs` refuses any other line. A session without it does not
  claim the row's build increment; CI runs only the Node check against the
  committed output. Ranks 2a, 2b, 2c (increment 1), 2d and 2e.
- **Local: Blender GPU.** Blender's full feature set on a real GPU, and so
  **Devon's Windows machine only** (#878), even where huginn has the right
  Blender. Rank 2h, "Castle in Blender": realistic Poly Haven PBR and
  Cycles stills at 1920 x 1080, on Blender 5.2 found at `CASTLE3D_BLENDER`
  or the Steam path and never at `BLENDER`, and nothing in CI runs or
  checks it (#840, #842).
- **Local: GPU.** Needs `npm run play` on a machine with real compositing, or
  needs somebody to look at a render. This is #53, and #53 cuts both ways: a
  real-time assertion that *fails* under software rendering is inconclusive,
  not confirmed. Ranks 3, 4 past its first increment, and rank 11 past its
  Node line; 2c's and 2d's clips are judged here too.
- **Local: net.** Needs a network that reaches the asset hosts. Not a GPU
  question and not the same block: #518's container could not reach Poly
  Haven and #541's could; #568's could not reach quaternius.com. No row needs
  it today, since rank 10 retired (#807), but sourcing CC0 stays allowed
  inside 2c and 2d if their sections say so.
- **Local: audio.** Needs speakers and a person. Rank 7 only, and only for the
  judgement — the assignment and the cross-fade are a container's.

**Gate.** What must have shipped before the row can start. **The list had
four hard gates; three have shipped and are retired.** The lesson from the two
that shipped early (#634, #635, #656 to #658): name the render a row needs,
not the row that happens to produce one.

The one gate still standing: **rank 3 before rank 11 ships past its Node
acceptance.** Rank 11's own spec says nothing in it goes past a `snap` and a
sentence until the GPU run has happened.

One softer dependency, not a gate, worth naming: a budget ceiling reads
against whatever bodies exist at the time (#609).

**Lane.** The file that two sessions would collide on. **One row per lane at a
time** (#602); rows in different lanes, or with no lane, may be claimed
together.

| Lane | The file that decides it | Rows |
| --- | --- | --- |
| A | `src/save.js` — the version number and `migrate` | none held |
| B | `data/scene-config.json` — and `test/tools.mjs`'s byte-exactness rail | 2a, 2b, 2e, 4, 9, 13 (increments 2 and 3 only) |
| C | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 2c, 2d, 6 |
| D | `src/main.js`'s player rig and spawn | 6, 11 |
| E | `src/audio.js` and `data/sounds.json` | 7 |
| F | `tools/blender/` and its manifest | 2a, 2b, 2c, 2d, 2e |
| G | `tools/castle3d/` | 2h |

Lane A last bumped the save version to 6 (#612); the next row that bumps it
takes that lane and bumps to 7. Lane C is the `cast` block specifically, not
the whole of `data/npcs.json`: two rows can write per-person `states` and
`default` arrays there and still merge. **A standing obligation on whoever
writes there next**: every `dialogue` block in that file is also
`dialogue/castle.dlg`, and `test/dialogue.mjs` fails if the two disagree, so a
row that adds a state or rewords a line runs `npm run dialogue:extract`
before it commits (#687). Lane B: rank 4 and rank 9 both write
`data/scene-config.json` and do not run together; rank 13's increments 2 and 3
are the same lane and wait behind whichever of the other two is running; the
Blender rows that place (2a, 2b, 2e) hold it too. Lane F is every Blender
row: one machine renders, so they run one at a time regardless (#804). Lane
G is 2h's alone and shares no file with F, so 2h may run beside a lane F row;
that is two Blenders on one machine and Devon's call (#842).

## The ranked table

Fifteen ranked rows: 2a, 2b, 2c, 2d, 2e, 2h, 3, 3a, 3b, 4, 6, 7, 9, 11, 13. Devon
reopened ranks 1 and 2 himself on 2026-09-25 for the Blender rows, and
lettered the pack band by priority (#801, #802). 2f, his own props, took
the next letter the same day, ran first, and shipped the same day
(#830 to #834); 2g, the chapel nave, his answer to one of 2f's open
questions, followed it and shipped the same day too (#835 to #838). 2h,
the castle as a realistic Blender model, is his of 2026-09-26 (#839).
**A session never reuses a retired rank; Devon may, and did, here** (#802).
Rank 10 is retired, with
2c and 2d as its successors (#807). Ranks 5, 8 and 12 stay retired numbers,
not gaps: a rank is a priority, not an id (#619, #491), which is why every
row is named by title as well as by rank in this file, `SPECS.md` and
`ROADMAP.md` (#522): that is what makes a renumbering survivable even when
a row is claimed. Rank 1 cycled through four different rows before retiring
on 2026-09-21 (the fourth body, the castle you could not walk, the walker on
the stair, then the day-before walking day, #778 to #779) and reopened for
the Blender pipeline on 2026-09-25, which shipped and retired it again on
2026-10-01 (#880 to #884); rank 2 was last held by "Sight at the
body's own height," which shipped 2026-09-21 (#780 to #782) and opened
rank 3's gate, and reopened the same day as the Blender pack band. Ranks 5,
8 and 12 finished rather than being retired part-way: 5 was the hall
covering (#656 to #658), 8 was the twelve side quests (#691 to #695), 12 was
the placement editor, budget suite, move-and-delete and the dialogue format
(#583 to #587, #607 to #611, #636 to #642, #687 to #690).

| Rank | Item | Size | Model | Where | Gate | Lane | Claimed | Detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2a | Blender: evidence props: three pinned swaps (the knife, the candle, the ledger) and the aumbry candles, specced (#810 to #812, #816, #819); the goblet, the vial and the seal went to 2f (#830); nothing built | 1 | Opus 5 | Local: Blender | 1 shipped (#881) | F, B | | [Blender: evidence props](SPECS.md#blender-evidence-props) |
| 2b | Blender: an interiors kit: joined sets dressing the kitchen, the great hall and the cell, specced (#813 to #816, #819); the two hearths and the chapel altar went to 2f (#830); nothing built | 2+ | Opus 5 | Local: Blender | after 2a (1 shipped, #881) | F, B | | [Blender: an interiors kit](SPECS.md#blender-an-interiors-kit) |
| 2c | Blender: a shared rig with swappable parts: one rig, one-primitive parts, at most five skinned draws a person against the Quaternius rigs' 12 to 15, specced (#820 to #825); nothing built | 2+ | Opus 5 | Local: Blender, then Container; judged local: GPU (#53) | 1 shipped (#881) | F, C | | [Blender: a shared rig with swappable parts](SPECS.md#blender-a-shared-rig-with-swappable-parts) |
| 2d | Blender: the animals: pig, goat, sheep, horse, cat and two geese on one quadruped topology plus a bird one for the goose, specced (#826 to #829); nothing built | 1 | Opus 5 | Local: Blender; judged local: GPU (#53) | after 2c increment 1 (1 shipped, #881) | F, C | | [Blender: the animals](SPECS.md#blender-the-animals) |
| 2e | Blender: the countryside beyond the wall: five backdrop pieces cut from one seeded height field, specced (#816 to #819); nothing built | 1 | Opus 5 | Local: Blender | 1 and rank 9's 3b shipped (#881, #871) | F, B | | [Blender: the countryside beyond the wall](SPECS.md#blender-the-countryside-beyond-the-wall) |
| 2h | Castle in Blender: the castle, Mereford and the countryside as a realistic standalone model with Poly Haven PBR, built by committed scripts on Blender 5.2, with gameplay markers, specced (#839 to #844); increments 0 to 6 shipped (#839 to #869, PR #90, 34357ac); increments 7 to 9 (lighting and cameras, markers, export) are left; the game loads none of it | 2+ | Opus 5 | Local: Blender GPU (5.2, Devon's Windows machine only); Local: net for its fetches | — | G | | [Castle in Blender](SPECS.md#castle-in-blender) |
| 3 | The GPU run: the fourth sitting confirmed the sight fix on a GPU and walked the whole day and the second day (#886 to #891); exit 1, 6 failures, filed as 3a and 3b; `renderer.info` recorded (#887); the phone (#530) untouched | 1 | Opus 5 | Local: GPU | — | — | | [The GPU run](SPECS.md#the-gpu-run) |
| 3a | Play Again starts over: `slot.autosave`'s `stop()` leaves the save dirty and the reload's `pagehide` flush writes the ended game back (#889) | ¼ | Opus 5 | Container | — | D | | [Play Again starts over](SPECS.md#play-again-starts-over) |
| 3b | play-castle's last three failures: a wall check that matches nothing, a statue over the hall brazier, and #659's journal walk (#890) | ¼ | Opus 5 | Container, then local: GPU to confirm | — | B | | [play-castle's last three failures](SPECS.md#play-castles-last-three-failures) |
| 4 | The retro castle: increment 1 shipped, fifteen sets out and fifteen 128 px textures in (#757 to #766); the look is left; variety per room is superseded by 2h (#839); the props increment moved to 2b (#813) | 2+ | Opus 5 | Container to the look, local: GPU past it | — | B | | [The retro castle](SPECS.md#the-retro-castle-the-stone-in-the-castles-own-pixel-art) |
| 6 | Life: a populace: 32 of 32 bodies built and a talk rail (#616 to #618, #729 to #733); four of the five generated clips placed in the household's routines (#800), `drill` still nobody's; the town and the chatter pool are left | 2+ | Opus 5 | Container | — | C, D | | [Life: a populace](SPECS.md#life-a-populace) |
| 7 | Sound: somebody listens to the seven beds, the four rings and the first two event sounds (a bed at a point and the rings, #680 to #683; the door and the hound, #696 to #698) | 1 | Fable 5.1 | Container, judged local: audio | — | E | | [Sound: a soundscape](SPECS.md#sound-a-soundscape) |
| 9 | A castle to get lost in: the town (#725 to #728) and the quay and river (#870 to #872) shipped; the rock is left, unspecced, and the quay's look is the GPU run's | 2+ | Opus 5 | Container | — (4c opened it) | B | | [A castle to get lost in](SPECS.md#a-castle-to-get-lost-in) |
| 11 | Feel: presence, fire, weather, a door that opens | 2+ | Sonnet 5 | Container to the Node line, local: GPU past it | **after 3** | D | shadow + hand shipped 2026-09-17 (#650 to #654) | [Feel](SPECS.md#feel) |
| 13 | The floor plan you can see: the review view shipped (#745 to #749); a way to redraw it is left | 2+ | Opus 5 | Container | — | B | increment 1 shipped 2026-09-21 (#745 to #749) | [The floor plan you can see](SPECS.md#the-floor-plan-you-can-see) |

**`ROADMAP.md` is these three columns turned into an order**: which row to
take first, what each one unblocks, and which ones two sessions may hold at
the same time. This table still ranks; that file sequences (#601).

## Blender: evidence props

*Where: local, Blender. Gate: rank 1 shipped (#881). Lanes: F and B.*

**Rank 2a, size 1.** Specced whole, decisions #810 to #812, #816 and #819.
`data/mystery.json`'s eleven evidence rows hold no dagger, goblet, vial or
seal: the brief's six against the data's names three of them wrong. Three
pinned swaps replace what the player presses (the knife, the candle, the
ledger), each keeping its piece's id and box centre so no station moves
(#811); four dressings (the goblet, the vials, the aumbry's three candles,
the Clerk's seal) stand beside a pressable or in a room with none, and
dress nothing pressable, so no clue changes. New `test/layout.mjs` check
1e holds that nothing stands over a pressable (#812). Detail: [Blender:
evidence props](SPECS.md#blender-evidence-props).

## Blender: an interiors kit

*Where: local, Blender. Gate: after 2a; rank 1 shipped (#881). Lanes: F and B.*

**Rank 2b, size 2+.** Specced whole, decisions #813 to #816 and #819. Dresses
four rooms, the kitchen, the great hall, the chapel, and the cell as the
dungeon, with joined sets (a hearth, a trestle board, an altar, a pallet)
built as one mesh, one draw call each; no smithy or stable, because a room
is a layout call and neither exists (#814). Splits from rank 4 by surface
and volume: rank 4 owns every face's texture, this row makes pieces and
never a wall or floor covering, so rank 4's old increment 3 (the props)
moves here as this row's increment 3, gated on rank 4's look (#813). Detail:
[Blender: an interiors kit](SPECS.md#blender-an-interiors-kit).

## Blender: a shared rig with swappable parts

*Where: local, Blender for increment 1, then container; judged local GPU
(#53). Gate: rank 1 shipped (#881). Lanes: F and C; not B.*

**Rank 2c, size 2+.** Specced whole, decisions #820 to #825. Rank 10's
successor for people (#807): one rig, `folk.glb`, with every wearable part
its own one-primitive mesh node, so a person names the parts they wear in
`data/populace.json` and draws at most five skinned primitives where a
Quaternius body draws 12 to 15. Increment 1 renders the rig and moves one
wearer, the hen-wife, gated on a GPU look beside a Quaternius body before
anything else is committed; increment 2, a container job, moves the other
15 populace humans. The 14 cast stay on the Quaternius rigs (#824). Makes
bodies and writes a person's first body fields only; "Life: a populace"
still owns every ring and every later change (#821). Detail: [Blender: a
shared rig with swappable parts](SPECS.md#blender-a-shared-rig-with-swappable-parts).

## Blender: the animals

*Where: local, Blender; judged local GPU (#53). Gate: after 2c's
increment 1; rank 1 shipped (#881). Lanes: F and C; not B.*

**Rank 2d, size 1.** Specced whole, decisions #826 to #829. Rank 10's
successor for animals (#807): pig, goat, sheep, horse and cat on one
quadruped topology sharing the cow's joint names, and a goose on a bird
topology of its own, each its own file, two materials (`Coat`, tinted, and
`Bare`) over one atlas. The cow, the hound and the two hens stay as they
are (#807). Placed in the two wards beside the hen-wife's patch and the
cow, no stable and no yard (#829); the two skinned-draw ceilings #825 sets
rise by the animals' own draws. Detail: [Blender: the animals](SPECS.md#blender-the-animals).

## Blender: the countryside beyond the wall

*Where: local, Blender. Gate: rank 1 shipped (#881); rank 9's increment 3b shipped (#871). Lanes:
F and B.*

**Rank 2e, size 1.** Specced whole, decisions #816 to #819. Five backdrop
pieces cut from one seeded height field, tiling the ground and each other
edge to edge so nothing seams, placed as `interiorProps` with `backdrop` and
`noCollide` so they push no collider and no surface. New `test/layout.mjs`
check 4g holds the seam to the ground's sides and the far edge out to the
fog's distance (#817, #818). Was gated on rank 9's 3b, shipped (#871), which set the ground's
west edge and lifts the eyes check 4g reads. Detail: [Blender: the
countryside beyond the wall](SPECS.md#blender-the-countryside-beyond-the-wall).

## Castle in Blender

*Where: local, Blender 5.2, and a network for its fetches. Gate: none.
Lane: G.*

**Rank 2h, size 2+.** Specced whole, decisions #839 to #844, from Devon's
instruction of 2026-09-26. The castle, Mereford and 400 m of countryside
rebuilt as a realistic standalone Blender model with Poly Haven PBR, today's
layout as the guide through a `blueprint.json` that `makePlan` writes in
Node, and his 71 props re-materialed inside it. Committed scripts under
`tools/castle3d/` build it headless on Blender 5.2, outside the Blender pipeline's
pipeline and exempt from #803 and #805 (#840); the master `.blend`, its
texture cache and `castle.glb` live outside the repo (#841); a second
Blender runs `check.py` over the saved file and fails the build (#844).
Gameplay is authored as named markers (`ROOM_`, `COL_`, `GATE_` with its
hinge, `STAIR_`, `SPAWN`, `EVID_`, `READ_`, `BELL_`) so that Blender can
drive the plan later (#843). The game loads none of it, `npm test` stays
fifteen suites, and CI never runs it (#842). Ten increments, one stage each.
Detail: [Castle in Blender](SPECS.md#castle-in-blender).

## The GPU run

*Where: local, GPU. Gate: none. Lane: none.*

**Rank 3. The sight fix holds on a GPU.** `npm run play` has now run eleven
times across four sittings (#624 to #630, #708 to #715, #734 to #741, #886
to #891). The fourth sitting's fifth run walked the whole day and the whole
second day for the first time: the accusation selects 3 of 3, "Master Robert
Ferrour hangs," and Play Again's pane. `renderer.info` was read at five
beats and recorded against rank 2c and 2d's skinned-draw ceiling (#887). Exit
0 is still owed — the run's six remaining failures are filed as rank 3a
(Play Again does not start over) and rank 3b (three small suite and data
bugs) — and the phone (#530) is untouched.

**Settled and closed by the looking already done** (#711 to #715, #891):
the compressed textures, the tower roof climb, the gaol roll on the
barrel-head, and — the one negative result — two of the twelve do not read
as two, the Constable and the Steward being one white-haired man told apart
only by a collar colour past about three metres. The Lauds sky reads flat,
no dawn colour in it. The covered hall's seven trusses are invisible from
the floor, and a sliver of sky shows at its south-east corner. #715's stray
prompt naming "the Sir Roger Lestrange" is gone; every prompt now reads
correctly.

## Play Again starts over

*Where: container. Gate: none. Lane: D.*

**Rank 3a.** `src/main.js:285`'s restart calls `auto.stop()`, `slot.reset()`,
then reloads. `src/gvb-save.js`'s `autosave.stop()` clears the timer but
leaves `dirty` true, and the same autosave flushes on `pagehide`, so the
reload writes the ended game straight back over the reset (#889). A player
at the end of the game cannot start a new one without clearing site data by
hand, and three of the fourth sitting's beats fail on it. Recommended fix:
`stop()` also clears `dirty`.

## play-castle's last three failures

*Where: container, then local: GPU to confirm. Gate: none. Lane: B.*

**Rank 3b.** Three small, unrelated breaks in `test/play-castle.mjs` and the
data it reads (#890): a wall-height check that matches zero meshes, because
no wall is named `wall_` or `wall-half` any more; the Great Hall's brazier
sealed inside `gothic_statue`'s box after the hall cluster's shift, plus one
brazier pair inside an unidentified "Scene" root; and #659's journal walk,
whose ten GPU readings now run 0.51 to 1.30 m against a flat `> 1.0 m`
threshold.

## The retro castle

*Where: container to the look, local GPU past it. Gate: none. Lane: B.*

**Rank 4, and a 2+. The first increment shipped on 2026-09-21** (#757 to
#766), from Devon's brief the same day: built geometry carries pixel-art
textures this repo draws with its own program, reversing #411, not Poly
Haven's photographs and not an image model's output either (#743). A
generator under `tools/pixel/` renders fifteen 128 px PNGs to
`assets/pixel/`, one per existing material name; the fifteen Poly Haven set
folders are deleted (45 files, 23.9 MB); `materials` became `pixelMaterials`
with a diffuse-only lit material; the Kenney kit is relit behind
`RELIGHT_KIT` now that every GLB is confirmed `KHR_materials_unlit`; five
rails went into `test/assets.mjs` and a fourth count, `MAX_TEXTURE_MB = 64`,
into `test/budget.mjs`. Texture memory: **80.8 MB before, 37.9 MB after**.
`npm test` fifteen of fifteen, `dist/` 52.8 to 28.9 MB. No `ktx`, network or
GPU needed.

**Then somebody looks** (#53), with the checklist in `SPECS.md`. The second
increment, a wall and a floor of its own in every named room, is superseded
by 2h (#839): the game keeps these fifteen textures until the row that puts
the realistic model in the game ships, and forty more would be deleted that
day. The ten Poly Haven prop packs stay until the look says otherwise, and
the props increment is 2b's (#813).

## Life: a populace

*Where: container. Gate: none. Lanes: C and D.*

**Rank 6, and a 2+.** Two increments shipped: the first ten people with a
routine (a LOOP per bell, not one station per bell, #547 answer 3) and their
validator (#616 to #618); five more people and a flat `talk` list of three
gossip pairs, bringing the page to 32 of 32 bodies built — 13 cast plus 19
populace, exactly `MAX_SKINNED_TOTAL` (#729 to #733). `test/mystery.mjs`
owns the validator (#529); `test/budget.mjs` counts the household.

**What is left waits on one other row and one argument.** The rest of the
fifty, some of it on 2c's rig once it ships (#821), and whether `garden`
becomes ground, is rank 9's town. The four activities that had no clip,
`sweep`, `stir`, `hammer` and `spar`, now do: `tools/bodies/` shipped all
five clips into the four human bodies (#790, kept as it is under 2c and 2d,
#807), and this row has placed four of them, twelve stops across both days
(#800): the scullion sweeps and stirs in the kitchen, the carter hammers at
his cart, and the serjeant and the man-at-arms spar in the yard where they
used to muster. `drill` is still nobody's. `MAX_SKINNED_TOTAL` stays 34
until 2c or 2d renegotiates it (#825, #828). And the twelve's 27-pair
chatter pool is still unspent by proximity; a later lore or dialogue
increment is recommended to hold each pair to the schedule the way #592
holds a performance.

## Sound: a soundscape

*Where: container to write it, local with speakers to judge it. Gate: none. Lane: E.*

**Rank 7.** Three increments shipped, all synthesised, no audio file in the
repo (#519, #548): seven ambient room tones with a 1.2 s cross-fade on the
HUD's room change (#620 to #623); a bed at a point per room, heard through a
panner, the nearest three within 14 m sounding at once, plus the bell's ring
pattern (#680 to #683); and the two event sounds that need no clip, a door
and the hound's bark, with `test/layout.mjs` checks 13 and 14 holding the
wiring (#696 to #698).

**What is left, in order.** Somebody with speakers listens (#53): every
number in all three blocks is a guess and the file says so, and the three
most likely wrong are 14 m of earshot through a stone wall, a tower roof
heard from the hall under it, and the bark's formant. The listening
checklist is in `SPECS.md` under this row. Hammer, sweep and the rest of the
event sounds wait on rank 6's activity clips to sync to. Recorded CC0 audio
is admitted since #548, named by `data/sounds.json` and run through
`tools/encode-assets.mjs` like any asset (#506), and none has been looked
for.

## A castle to get lost in

*Where: container. Gate: none; rank 4c opened it on 2026-09-19. Lane: B.*

**Rank 9, and a 2+.** The castle's own 40 rooms are built and mapped (#582,
#588 to #591); nineteen are deliberately empty, per `PLAN.md`'s "an empty
room is worse than no room." **The town's first increment shipped on
2026-09-21** (#725 to #728): six houses and a church west of Mereford's town
wall, seen from the North-west Tower's roof, entered by nobody, drawn on a
map frame of their own and out of the room count (back to 67.6 m, 40 rooms),
held against both wards' mesh ceiling. **The quay and the river shipped on
2026-09-29** (#870 to #872), both increments in one PR, outside the west gate:
3a, a stone toll-house under a new `gable` built shape, the one slate roof in
Mereford and the only part of the quay the walls can see (check 4d); 3b, the
water, a plan piece with no surface running into the fog, with the ground cut
back to the bank, held by new checks 4e (nothing stands on it) and 4f (it is
seen, through the west gate, at 119.7 m). The outer ward now draws 1181 of
its 1200 meshes counting the outside. **What is left** is the rock, which
nothing specs yet, and the GPU run's word on whether the quay reads through
the fog (#53). Filling the nineteen empty
rooms is rank 6's routines and a later lore row's documents.

## Feel

*Where: container to the Node line, local GPU past it. Gate: after rank 3. Lane: D.*

**Rank 11, and a 2+. The first increment's Node half shipped on 2026-09-17**
(#650 to #654): `src/player-rig.js` puts a blob shadow on whatever the feet are
standing on and a hand that comes up out of the bottom of the frame and reaches
for the muniment room's word-lock. **Two draw calls, 16 KB of texture painted
into a canvas at load, and no file added** — a decal rather than a second
shadow-casting light, which is the open call taken. Nine assertions in
`test/plan-vs-scene.mjs`, each broken on purpose once, and the one that matters
most is that neither object answers a ray: the rig is a top-level scene child
and `interaction.js` calls every one of those an occluder, so a disc under the
player's feet would have stopped the prompt appearing and said nothing about it.

**What is left needs a GPU and the rest of the theme needs it more.** Whether a
blob reads on stone and still reads on grass, what the disc does on a flight of
stairs, and whether a hand reads as a hand are the row's own GPU criteria (#53)
and are unanswered. Nothing else in the theme — weather and sky, fire and its
point-light budget, examine, doors that open, wear, sitting — starts before that
pair has been looked at, because they are the ones that say whether the budget
has room for the rest at all.

## The floor plan you can see

*Where: container. Gate: none. Lane: B, for what is left — increment 1 needed
none.*

**Rank 13, and a 2+. Decided before anything was built, decisions #745 to
#749, 2026-09-21.** Devon's ask: the room layout was placed by an AI one room
and one guess at a time with no way to see the whole floor plan, and he wants
a GUI to lay it out himself, or at least to review and correct it visually.

**The layout is not in `src/castle-plan.js`.** That file holds no coordinate:
it is a pure compiler over `data/scene-config.json` and throws on a config
that does not hang together. The floor plan is four arrays of that file:
`walls` (46 runs, 25 of them interior partitions), `drums` (8), `gates` (3)
and `rooms` (43, which are names over extents and own no geometry), plus the
`doorways` on eleven runs that are how two spaces connect. So the tool writes
the same 3113-line file the prop editor already writes, through the same
splice, and there is no new format (#745).

**The first increment shipped the same day** (#748): a top-down orthographic
view over the real scene, drawn from the plan's own boxes, with a storey
filter and room labels. A flat 2D editor was refused because `makePlan` needs
`boundsOf(modelPath)` and only a loaded model gives one, so a schematic would
have to re-derive every box the plan computes (#746). It is `?edit=1`'s second
module, `src/edit-layout.js`, with its own sentinel and its own line in
`test/built.mjs`'s grep of `dist/` (#747, #586); the pure half is
`tools/plan-sheet.mjs`, held by 29 new assertions in `test/tools.mjs`.
`npm test` is 15 of 15, 1772 assertions.

**What is left.** Increment 2 makes `rooms` and `walls` draggable and
increment 3 the openings; `drums` and `gates` are not in this row. Neither
increment has started. Validation re-runs `makePlan` and `walkability` in the
page and copies no assertion out of any suite (#749, #529). Both remaining
increments are lane B, which rank 3 and rank 9's town also hold, so only one
of the three runs at a time (#602).

