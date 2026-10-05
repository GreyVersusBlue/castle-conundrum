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
check 8 and a calibration crate placed in the kitchen (#880 to #884); and
rank 2e, the countryside beyond the wall, five backdrop pieces and check 4g (#908); and
rank 13, the floor plan you can see, drag rooms, runs and openings (#909); and
rank 9, a castle to get lost in, the rock dropped and its last look moved to rank 3 (#910); and
rank 2h, the castle in Blender, Mereford and the countryside as a realistic
standalone model with Poly Haven PBR, all ten increments and Devon's closing
verdict on the nine review stills (#839 to #844, #892, #893 to #899, #955 to
#961, #962).

**Open, ranked below.** Devon made Blender-built assets the project's top
priority on 2026-09-25 and reopened ranks 1 and 2 himself to hold them
(#801). Nine rows: the Blender pack band,
three rows lettered by priority (2b an interiors kit, 2c a
shared rig with swappable parts, 2d the animals); the castle's integration
row, after 2h shipped as a realistic standalone Blender model (#962) (2i,
#919 to #924, specced #963 to #968); the GPU run itself, now gated on nothing (rank 3, #780 to #782);
the retro castle's look, its variety increment superseded by 2h (rank 4,
#839); the rest of
the fifty-person populace (rank 6); somebody with speakers to judge the
soundscape (rank 7); the feel theme past
its shadow and hand (rank 11). A session never reuses a retired rank; Devon may, and did, here
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
  committed output. Ranks 2b and 2c (increment 1).
- **Local: Blender GPU.** Blender's full feature set on a real GPU, and so
  **Devon's Windows machine only** (#878), even where huginn has the right
  Blender. Rank 2h, "Castle in Blender" (shipped, #962), used it for
  realistic Poly Haven PBR and Cycles stills at 1920 x 1080, on Blender 5.2
  found at `CASTLE3D_BLENDER` or the Steam path and never at `BLENDER`, and
  nothing in CI runs or checks it (#840, #842). Rank 2i needs the same
  machine.
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
| B | `data/scene-config.json` — and `test/tools.mjs`'s byte-exactness rail | 2b, 4 |
| C | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 2c, 2d, 6 |
| D | `src/main.js`'s player rig and spawn | 6, 11 |
| E | `src/audio.js` and `data/sounds.json` | 7 |
| F | `tools/blender/` and its manifest | 2b, 2c, 2d |
| G | `tools/castle3d/`, and `data/castle-skin.json` (#963) | 2i |

Lane A last bumped the save version to 6 (#612); the next row that bumps it
takes that lane and bumps to 7. Lane C is the `cast` block specifically, not
the whole of `data/npcs.json`: two rows can write per-person `states` and
`default` arrays there and still merge. **A standing obligation on whoever
writes there next**: every `dialogue` block in that file is also
`dialogue/castle.dlg`, and `test/dialogue.mjs` fails if the two disagree, so a
row that adds a state or rewords a line runs `npm run dialogue:extract`
before it commits (#687). Lane B: rank 4 and the Blender row that
places (2b) both write `data/scene-config.json` and do not run together. Lane F is every Blender
row: one machine renders, so they run one at a time regardless (#804). Lane
G is 2i's and shares no file with F, so it may run beside a lane F row;
that is two Blenders on one machine and Devon's call (#842).

## The ranked table

Nine ranked rows: 2b, 2c, 2d, 2i, 3, 4, 6, 7, 11. Devon
reopened ranks 1 and 2 himself on 2026-09-25 for the Blender rows, and
lettered the pack band by priority (#801, #802). 2f, his own props, took
the next letter the same day, ran first, and shipped the same day
(#830 to #834); 2g, the chapel nave, his answer to one of 2f's open
questions, followed it and shipped the same day too (#835 to #838). 2h,
the castle as a realistic Blender model, is his of 2026-09-26 (#839), and
shipped 2026-10-03 (#962).
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
| 2b | Blender: an interiors kit: joined sets dressing the kitchen, the great hall and the cell, specced (#813 to #816, #819); the two hearths and the chapel altar went to 2f (#830); the look gate discharged (#946); increment 1 shipped on huginn (#947): four sets, five placed, the kitchen and the great hall; increment 2, the cell alone, shipped on huginn (#971, decided #951 to #953): a barred-station rail in `validateMystery`, then `cell-pallet` along the cell's west face, 1 outer-ward draw, 1192 to 1193 of 1200, the chapel getting no set (Devon, 2026-10-03); left: increment 3 gated on rank 4's look (#813), the Windows GPU look at the five sets, six placements (#53) | 2+ | Opus 5 | Local: Blender | 1 shipped (#881); 2a shipped (#907) | F, B | | [Blender: an interiors kit](SPECS.md#blender-an-interiors-kit) |
| 2c | Blender: a shared rig with swappable parts: one rig, one-primitive parts, at most five skinned draws a person against the Quaternius rigs' 12 to 15, specced (#820 to #825); increment 1 shipped on huginn (#939 to #941); left: the Windows GPU look, which gates increment 2, the other 15 populace humans (container) | 2+ | Opus 5 | Windows: GPU look (#53), then Container | 1 shipped (#881) | F, C | | [Blender: a shared rig with swappable parts](SPECS.md#blender-a-shared-rig-with-swappable-parts) |
| 2d | Blender: the animals: pig, goat, sheep, horse, cat and two geese on one quadruped topology plus a bird one for the goose, specced (#826 to #829); both increments shipped on huginn (#942 to #945): six files, seven animals placed (pig, goat, sheep, horse and cat on the quadruped topology, the goose on a 12-joint bird topology, two geese); left: the Windows GPU look, which blocks nothing (#53) | 1 | Opus 5 | Windows: GPU look (#53) | 2c increment 1 committed (#941); 1 shipped (#881) | F, C | | [Blender: the animals](SPECS.md#blender-the-animals) |
| 2i | Castle in Blender, the integration row: the game takes the model as a skin and never reads `markers.json` (#919); specced (#963 to #968): one `assets/castle3d/skin.glb` cut from the master by stage (`curtain`, `buildings`, `town`, `land`), about 25 MB and 37.3 MB of texture memory against the master's 570 MB and 1,738.8 MB, trees decimated to 2,000 triangles, KTX2 through `assets:encode`; draw ceiling 1200 to 600, a new 500,000-triangle ceiling, texture 64 to 76 to 84 (#966); #499 and #506 stand (#967); six increments; increment 1, #922's open gate in the model, built (#970) and accepted (#1001); increment 2, the skin, built outside the repo (#1003); increment 3, stage curtain in the game, next | 2+ | Opus 5 | Local: Blender GPU (5.2, Devon's Windows machine only), plus `ktx`; judged local: GPU (#53) | 2h shipped (#962) | G | | [Castle in Blender: the integration row](SPECS.md#castle-in-blender-the-integration-row) |
| 3 | The GPU run: **exit 0 reached** (#1010 to #1012): 217 ok, 0 failures, after 3a (#916), 3b (#917) and 3c (#1012) shipped and three suite bugs were fixed (#1006, #1010, #1011); left: the phone (#530), untouched, and Devon's verdict on the quay stills (#900, #1009); `renderer.info` recorded (#887) | 1 | Opus 5 | Local: GPU | — | — | | [The GPU run](SPECS.md#the-gpu-run) |
| 4 | The retro castle: increment 1 shipped, fifteen sets out and fifteen 128 px textures in (#757 to #766); the look is left; variety per room is superseded by 2h (#839); the props increment moved to 2b (#813) | 2+ | Opus 5 | Container to the look, local: GPU past it | — | B | | [The retro castle](SPECS.md#the-retro-castle-the-stone-in-the-castles-own-pixel-art) |
| 6 | Life: a populace: 32 of 32 bodies built and a talk rail (#616 to #618, #729 to #733); four generated clips placed in the household's routines (#800), `drill` dropped (#915); the twelve's chatter pool placed and played by room and bell, 19 pairs after nine were recast and eight retired (#911, #925 to #938); left: the town's share of the fifty, the GPU look at playback (`npm run play`, #53, the looking list in #931) | 2+ | Opus 5 | Container | — | C, D | | [Life: a populace](SPECS.md#life-a-populace) |
| 7 | Sound: somebody listens to the seven beds, the four rings and the first two event sounds (a bed at a point and the rings, #680 to #683; the door and the hound, #696 to #698) | 1 | Fable 5.1 | Container, judged local: audio | — | E | | [Sound: a soundscape](SPECS.md#sound-a-soundscape) |
| 11 | Feel: the three GPU looks answered (#1013): the blob reads on stone and on grass; the disc is buried in every flight, because a flight is a ramp in the plan and 8 steps on screen; the hand turned along the arm (#1014). Next: the stair disc (architect first: a flight's step count in the plan), then doors that open | 2+ | Sonnet 5 | Container to the Node line, local: GPU past it | **after 3: met** | D | shadow + hand shipped 2026-09-17 (#650 to #654) | [Feel](SPECS.md#feel) |

**`ROADMAP.md` is these three columns turned into an order**: which row to
take first, what each one unblocks, and which ones two sessions may hold at
the same time. This table still ranks; that file sequences (#601).

## Blender: an interiors kit

*Where: local, Blender. Gate: rank 1 shipped (#881); 2a shipped (#907). Lanes: F and B.*

**Rank 2b, size 2+.** Specced whole, decisions #813 to #816 and #819,
amended by #951 to #953. Dresses three rooms, the kitchen, the great hall,
and the cell as the dungeon, with joined sets (a trestle board, a rack of
crocks, a pallet) built as one mesh, one draw call each; the hearths and the
altar are 2f's (#830) and the chapel gets no set (#951); no smithy or stable, because a room
is a layout call and neither exists (#814). Splits from rank 4 by surface
and volume: rank 4 owns every face's texture, this row makes pieces and
never a wall or floor covering, so rank 4's old increment 3 (the props)
moves here as this row's increment 3, gated on rank 4's look (#813). Detail:
[Blender: an interiors kit](SPECS.md#blender-an-interiors-kit).
Increment 1 shipped on huginn (#947) with the look gate discharged (#946):
four sets, five placed, the kitchen and the great hall, 5 outer-ward draws.
Increment 2, the cell alone, shipped on huginn (#971, decided #951 to
#953): first a rail, since a set stood on Madoc's station left
`validateMystery` green, then `cell-pallet` along the cell's flat west face,
456 triangles, 1 outer-ward draw, 1192 to 1193 of 1200. Devon answered on
2026-10-03 that the chapel gets no set. Left: increment 3, gated on rank 4's
look, and the Windows GPU look at the five sets, six placements.

## Blender: a shared rig with swappable parts

*Where: local, Blender for increment 1, then container; judged local GPU
(#53). Gate: rank 1 shipped (#881). Lanes: F and C; not B.*

**Rank 2c, size 2+.** Specced whole, decisions #820 to #825. Rank 10's
successor for people (#807): one rig, `folk.glb`, with every wearable part
its own one-primitive mesh node, so a person names the parts they wear in
`data/populace.json` and draws at most five skinned primitives where a
Quaternius body draws 12 to 15. Increment 1 shipped on huginn (#939 to #941): the
rig, the mallet and the hen-wife, committed before their GPU look (#939).
Left: that look on Windows (the hen-wife beside the baker, the eleven
clips, the carter's mallet fit), which gates increment 2, a container job
that moves the other 15 populace humans. The 14 cast stay on the Quaternius rigs (#824). Makes
bodies and writes a person's first body fields only; "Life: a populace"
still owns every ring and every later change (#821). Detail: [Blender: a
shared rig with swappable parts](SPECS.md#blender-a-shared-rig-with-swappable-parts).

## Blender: the animals

*Where: local, Blender; judged local GPU (#53). Gate: 2c's
increment 1, committed (#941); rank 1 shipped (#881). Lanes: F and C; not B.*

**Rank 2d, size 1.** Specced whole, decisions #826 to #829. Rank 10's
successor for animals (#807): pig, goat, sheep, horse and cat on one
quadruped topology sharing the cow's joint names, and a goose on a bird
topology of its own, each its own file, two materials (`Coat`, tinted, and
`Bare`) over one atlas. The cow, the hound and the two hens stay as they
are (#807). Placed in the two wards beside the hen-wife's patch and the
cow, no stable and no yard (#829); the two skinned-draw ceilings #825 sets
rise by the animals' own draws. Increment 1 shipped on huginn (#942, #943): the five quadrupeds
placed, 25 household people, bodies 34 to 39 (`MAX_SKINNED_TOTAL` 39,
`MAX_SKINNED_PER_WARD` 22), the draw ceilings 380 to 390 and 205 to 209, 206,032
bytes between the five files. Increment 2 shipped on huginn (#944, #945): the
goose's bird topology and two geese, 27 household people, bodies 39 to 41
(`MAX_SKINNED_TOTAL` 41, `MAX_SKINNED_PER_WARD` 24), the draw ceilings 394 and
213, 240,748 bytes between six files. Left: the Windows GPU look, which blocks
nothing (#53). Detail: [Blender: the animals](SPECS.md#blender-the-animals).

## The GPU run

*Where: local, GPU. Gate: none. Lane: none.*

**Rank 3. The sight fix holds on a GPU.** `npm run play` has now run eleven
times across four sittings (#624 to #630, #708 to #715, #734 to #741, #886
to #891). The fourth sitting's fifth run walked the whole day and the whole
second day for the first time: the accusation selects 3 of 3, "Master Robert
Ferrour hangs," and Play Again's pane. `renderer.info` was read at five
beats and recorded against rank 2c and 2d's skinned-draw ceiling (#887). Exit
0 was reached on 2026-10-04 (#1010 to #1012): the fifth sitting confirmed
rank 3a (#916) and rank 3b (#917) on a GPU and filed rank 3c (the curtain
skin's walk bar blocked its own sight line, #1008), 3c shipped (#1012), and
the run ended **217 ok, 0 failures** after three suite bugs were fixed
(#1006, #1010, #1011). What is left is not the run: the phone (#530) is
untouched. **One more shot
moved here from rank 9 (#910)**: the quay through the fog, a pinned camera
through `tools/shot-yard.mjs`, to say whether the toll-house ridge (about 98 m,
60 % fog) and the river (first seen at 119.7 m, 84 % fog) read at all. Seven
stills of that view exist, `q1` to `q5` and two crops in `looks/2026-10-03/`
(#900); Devon's verdict on them is owed and nothing is closed. The fifth
sitting retook it with the skin in (#1009) and read the same.


**Settled and closed by the looking already done** (#711 to #715, #891):
the compressed textures, the tower roof climb, the gaol roll on the
barrel-head, and — the one negative result — two of the twelve do not read
as two, the Constable and the Steward being one white-haired man told apart
only by a collar colour past about three metres. The Lauds sky reads flat,
no dawn colour in it. The covered hall's seven trusses are invisible from
the floor, and a sliver of sky shows at its south-east corner. #715's stray
prompt naming "the Sir Roger Lestrange" is gone, and its `read` half ("read
the The King's writ") went in #948; the next GPU run looks at one.

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
by 2h (#839): the game keeps these fifteen textures until the stage of 2i
that swaps the last surface wearing one (#921), and forty more would be
deleted that day. The ten Poly Haven prop packs stay until the look says otherwise, and
the props increment is 2b's (#813).

## Life: a populace

*Where: container. Gate: none. Lanes: C and D.*

**Rank 6, and a 2+.** Two increments shipped: the first ten people with a
routine (a LOOP per bell, not one station per bell, #547 answer 3) and their
validator (#616 to #618); five more people and a flat `talk` list of three
gossip pairs, bringing the page to 32 of 32 bodies built — 13 cast plus 19
populace, exactly `MAX_SKINNED_TOTAL` (#729 to #733). `test/mystery.mjs`
owns the validator (#529); `test/budget.mjs` counts the household.

**Five increments shipped, and what is left waits on a GPU look and one budget.**
The third held the twelve's chatter pool to the schedule (#911, #912): 10 of
27 pairs carry a `room` at a day-one bell where both speakers stand, with the
rail in `src/lore.js` and its tests in `test/lore.mjs`; the other 17 cannot be
placed without moving a station or recasting, and `unplacedChatter` lists
them as a ratchet until the fifth. The generated clips are placed as before: `tools/bodies/`
shipped five (#790, kept under 2c and 2d, #807), and this row placed four
across twelve stops over both days (#800). `drill` is dropped as an activity
(#915, amending #800): it is out of `ACTIVITY_CLIPS`, and the Drill clip
stays in the bodies until 2c or 2d re-renders them.
The fourth plays the 10 placed pairs on the page (#925 to #931):
`QuestManager` keys them `room/watch`, starts the room's first unheard pair
on walking in, and follows each run or bell with a 4000 ms gap. `handleStand`
tells it about open ground (#926). A cut pair counts as heard (#929), day one
only (#930), and the hall's six pairs come after the Vespers song (#927).
The fifth closed the pool (#932 to #938): nine pairs recast onto two
speakers the schedule puts in one room, eight retired, 19 pairs each with a
`room`, and a pair with no `room` refused by `src/lore.js`.

**Left, in the order it can happen.** (1) The GPU look at playback, which nobody has run: `npm run play` on a
real GPU (#53), judged against the looking list in #931 (the hall at Vespers
end to end at 193.3 s, the chapel's four pairs at Prime between the same two
men, `outer-terce-1` from the east end of the outer ward,
the band over the panel and the journal). (2) The town's share of the fifty, and whether
`garden` becomes ground, which waits on the skinned-draw budget:
`MAX_SKINNED_TOTAL` is 41 since 2d's increment 2 (#945) and 2c's increment 2 renegotiates it again (#825), and
CC-04.

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

**The three GPU looks, answered 2026-10-04 (#1013, #1014).** The blob shadow
reads on stone and on grass at the same bell: 94 to 100% of the disc visible,
darkening the floor 20 to 27% in both terrains. The disc on a flight of
stairs is a defect: a flight is a ramp in the plan but 8 steps on screen, so
the disc sits inside the stone on every tread, 0 to 40% visible going up and
no better than 89% going down, and what shows going down is the disc hanging
over the lower treads rather than lying on one. The hand read as a rolling
pin, laid along the camera's own view axis 7.3 degrees off the line to the
eye; turned to run along the arm instead (#1014), it now reads as an arm and
a hand, 31.5 degrees off that line and in frame end to end.

**What is left, in order.**

1. The stair disc. Specced by `architect` first: the plan needs to carry a
   flight's step count (8 for `stairs-stone.glb`), `layout.mjs` or
   `plan-vs-scene.mjs` asserts it against the model, and the rig puts the
   disc on the tread top under the player while the feet stay on the ramp.
2. Devon's eye on the settled hand: whether its palm wants to turn toward
   the leaf at the word-lock, not just mid-reach.
3. Then the theme's next increment: doors that open. It reuses the hand's
   reach and the word-lock's target, adds no point light and no
   shadow-casting light, and the budget has the room (`test/budget.mjs`
   holds 3 point lights against ceilings of 6 per ward and 8 total; the rig
   itself is two draw calls `budget.mjs` cannot see).

`WISHLIST.md` ranks none of the theme's remaining items; fire is the first
that spends point lights and stays after doors. Weather, examine, wear and
sitting have no order invented among them.
