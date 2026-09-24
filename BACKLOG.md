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
runs by hand, on Devon's machine (#53).

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
placed in the household's routines (#800).

**Open, ranked below.** Eight rows: the GPU run itself, now gated on nothing
(rank 3, #780 to #782); the retro castle's look and its remaining two
increments (rank 4); the rest of the fifty-person populace (rank 6); somebody
with speakers to judge the soundscape (rank 7); the town's quay and river
(rank 9); a shared low-poly rig for the rest of the bodies (rank 10); the feel
theme past its shadow and hand (rank 11); and the floor-plan editor's drag
increments (rank 13). Ranks 1, 2, 5, 8 and 12 are retired numbers, not gaps: a
rank is a priority, never an id, and never reused (#619, #522, #491).

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

**Where.** Four values, and three of them mean this container cannot finish
the row.

- **Container.** A session like this one closes it: data, validators, Node
  suites, headless Chromium.
- **Local: GPU.** Needs `npm run play` on a machine with real compositing, or
  needs somebody to look at a render. This is #53, and #53 cuts both ways: a
  real-time assertion that *fails* under software rendering is inconclusive,
  not confirmed. Ranks 3, 4 past its first increment, and rank 11 past its
  Node line.
- **Local: net.** Needs a network that reaches the asset hosts. Not a GPU
  question and not the same block: #518's container could not reach Poly
  Haven and #541's could; #568's could not reach quaternius.com. Rank 10.
- **Local: audio.** Needs speakers and a person. Rank 7 only, and only for the
  judgement — the assignment and the cross-fade are a container's.

**Gate.** What must have shipped before the row can start. **The list had
four hard gates; three have shipped and are retired.** The lesson from the two
that shipped early (#634, #635, #656 to #658): name the render a row needs,
not the row that happens to produce one.

The one gate still standing: **rank 3 before rank 11 ships past its Node
acceptance.** Rank 11's own spec says nothing in it goes past a `snap` and a
sentence until the GPU run has happened.

Two softer dependencies, not gates, worth naming: rank 10 and rank 6 trade
activity clips both ways, and a budget ceiling read against whatever bodies
exist at the time (#609).

**Lane.** The file that two sessions would collide on. **One row per lane at a
time** (#602); rows in different lanes, or with no lane, may be claimed
together.

| Lane | The file that decides it | Rows |
| --- | --- | --- |
| A | `src/save.js` — the version number and `migrate` | none held |
| B | `data/scene-config.json` — and `test/tools.mjs`'s byte-exactness rail | 4, 9, 13 (increments 2 and 3 only) |
| C | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 6, 10 |
| D | `src/main.js`'s player rig and spawn | 6, 11 |
| E | `src/audio.js` and `data/sounds.json` | 7 |

Lane A last bumped the save version to 6 (#612); the next row that bumps it
takes that lane and bumps to 7. Lane C is the `cast` block specifically, not
the whole of `data/npcs.json`: two rows can write per-person `states` and
`default` arrays there and still merge. **A standing obligation on whoever
writes there next**: every `dialogue` block in that file is also
`dialogue/castle.dlg`, and `test/dialogue.mjs` fails if the two disagree, so a
row that adds a state or rewords a line runs `npm run dialogue:extract`
before it commits (#687). Lane B: rank 4 and rank 9 both write
`data/scene-config.json` and do not run together; rank 13's increments 2 and 3
are the same lane and wait behind whichever of the other two is running.

## The ranked table

Eight ranked rows: 3, 4, 6, 7, 9, 10, 11, 13. **Ranks 1, 2, 5, 8 and 12 are
retired numbers, not gaps.** A rank is a priority, not an id, and a retired
number is never reused (#619, #491) — which is why every row is named by
title as well as by rank in this file, `SPECS.md` and `ROADMAP.md` (#522):
that is what makes a renumbering survivable even when a row is claimed.
Rank 1 cycled through four different rows before retiring for good on
2026-09-21 (the fourth body, the castle you could not walk, the walker on the
stair, then the day-before walking day, #778 to #779); rank 2 was last held
by "Sight at the body's own height," which shipped the same day (#780 to
#782) and opened rank 3's gate. Ranks 5, 8 and 12 finished rather than being
retired part-way: 5 was the hall covering (#656 to #658), 8 was the twelve
side quests (#691 to #695), 12 was the placement editor, budget suite,
move-and-delete and the dialogue format (#583 to #587, #607 to #611, #636 to
#642, #687 to #690).

| Rank | Item | Size | Model | Where | Gate | Lane | Claimed | Detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | The GPU run: the looks are taken (#711 to #715); the walker holds on a GPU (#734, #736) and the third sitting reached the accusation with the wrong ending (#735 to #741) | 1 | Opus 5 | Local: GPU | — | — | | [The GPU run](SPECS.md#the-gpu-run) |
| 4 | The retro castle: increment 1 shipped, fifteen sets out and fifteen 128 px textures in (#757 to #766); the look, then variety per room, are left | 2+ | Opus 5 | Container to the look, local: GPU past it | — | B | | [The retro castle](SPECS.md#the-retro-castle-the-stone-in-the-castles-own-pixel-art) |
| 6 | Life: a populace: 32 of 32 bodies built and a talk rail (#616 to #618, #729 to #733); four of rank 10's five clips placed in the household's routines (#800), `drill` still nobody's; the town and the chatter pool are left | 2+ | Opus 5 | Container | — | C, D | | [Life: a populace](SPECS.md#life-a-populace) |
| 7 | Sound: somebody listens to the seven beds, the four rings and the first two event sounds (a bed at a point and the rings, #680 to #683; the door and the hound, #696 to #698) | 1 | Fable 5.1 | Container, judged local: audio | — | E | | [Sound: a soundscape](SPECS.md#sound-a-soundscape) |
| 9 | A castle to get lost in: the town, the rock and river | 2+ | Opus 5 | Container | — (4c opened it) | B | | [A castle to get lost in](SPECS.md#a-castle-to-get-lost-in) |
| 10 | Bodies: a shared low-poly rig for the fifty (the child and the hound shipped, #643 to #645; two hens and the spear, #684 to #686); five clips generated onto the four human rigs shipped (#790); a generated cow shipped (2b, #787 to #789, #794), body count 34 | 1 | Fable 5.1 | Generated: Container; sourced: Local: net | — | C | | [Bodies](SPECS.md#bodies) |
| 11 | Feel: presence, fire, weather, a door that opens | 2+ | Sonnet 5 | Container to the Node line, local: GPU past it | **after 3** | D | shadow + hand shipped 2026-09-17 (#650 to #654) | [Feel](SPECS.md#feel) |
| 13 | The floor plan you can see: the review view shipped (#745 to #749); a way to redraw it is left | 2+ | Opus 5 | Container | — | B | increment 1 shipped 2026-09-21 (#745 to #749) | [The floor plan you can see](SPECS.md#the-floor-plan-you-can-see) |

**`ROADMAP.md` is these three columns turned into an order**: which row to
take first, what each one unblocks, and which ones two sessions may hold at
the same time. This table still ranks; that file sequences (#601).

## The GPU run

*Where: local, GPU. Gate: none. Lane: none.*

**Rank 3.** `npm run play` has run six times across three sittings (#624 to
#630, #708 to #715, #734 to #741). The third sitting's second run reached the
accusation for the first time (179 ok, 17 failures) and got the wrong
ending: `src/interaction.js` was reading the sentry and the porter from a
fixed world height instead of their own, and the porter's admission is a
premise of the ending. That bug shipped its fix as "Sight at the body's own
height" (#780 to #782), and this row's gate is open. **What is left is the
run itself**: nobody has confirmed the fix on a GPU yet.

**Settled and closed by the looking already done** (#711 to #715): the
compressed textures, the tower roof climb, the gaol roll on the barrel-head,
and — the one negative result — two of the twelve do not read as two, the
Constable and the Steward being one white-haired man told apart only by a
collar colour past about three metres. The Lauds sky reads flat, 151.2 of
255 against Prime's 203.4, with no dawn colour in it. The covered hall's
seven trusses are invisible from the floor, and a sliver of sky shows at its
south-east corner.

**Three findings still nobody's row, written up in `HISTORY.md`**: a stray
`Press E to talk to the Sir Roger Lestrange` used as a prompt for every NPC
(#715); five checks in `test/play-castle.mjs` that are stale or vacuous,
one of which can only fail on a GPU (#714); and a journal walk assertion
that reads 0.69 to 1.30 m across separate runs against 3.75 m for an
unobstructed walk (#708 to #741). A fourth, route pricing near two props
standing inside a 0.45 m body's width of stone, is worked around in the
router rather than fixed at the source (#718).

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

**Then somebody looks** (#53), with the checklist in `SPECS.md`, before the
second increment puts a wall and a floor of its own in every named room. The
ten Poly Haven prop packs stay until the look says otherwise, and a third
increment for them waits on the look saying so too.

## Life: a populace

*Where: container. Gate: none. Lanes: C and D.*

**Rank 6, and a 2+.** Two increments shipped: the first ten people with a
routine (a LOOP per bell, not one station per bell, #547 answer 3) and their
validator (#616 to #618); five more people and a flat `talk` list of three
gossip pairs, bringing the page to 32 of 32 bodies built — 13 cast plus 19
populace, exactly `MAX_SKINNED_TOTAL` (#729 to #733). `test/mystery.mjs`
owns the validator (#529); `test/budget.mjs` counts the household.

**What is left waits on one other row and one argument.** The rest of the
fifty, and whether `garden` becomes ground, is rank 9's town. The four
activities that had no clip, `sweep`, `stir`, `hammer` and `spar`, now do:
rank 10 shipped all five clips into the four human bodies (#790), and this
row has placed four of them, twelve stops across both days (#800): the
scullion sweeps and stirs in the kitchen, the carter hammers at his cart,
and the serjeant and the man-at-arms spar in the yard where they used to
muster. `drill` is still nobody's. The ceiling stays at rank 10's 34 until
a row renegotiates it with rank 2's
`renderer.info`. And the twelve's 27-pair chatter pool is still unspent by
proximity; a later lore or dialogue increment is recommended to hold each
pair to the schedule the way #592 holds a performance.

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
held against both wards' mesh ceiling. **What is next is the quay and the
river**, outside the west gate, deferred because water is a surface kind the
plan does not have yet; it has no `SPECS.md` section, so it is an `architect`
job first. Filling the nineteen empty rooms is rank 6's routines and a later
lore row's documents.

## Bodies

*Where: the generated half is Container (#787); the sourced half is local, a network that reaches the asset hosts. Gate: none. Lane: C.*

**Rank 10.** Every row above this one that needs a new body is waiting on
this one. Low-poly, one shared rig, CC0 (#550 question 5). Shipped: the
child, at 1.15 m off the existing rig with a bigger head, and the hound,
Quaternius's Husky (#643 to #645); two hens and a spear, off poly.pizza,
the first held prop that is not Poly Haven's (#684 to #686). Bodies and
clips may be made here rather than fetched (#787), and increment 2a
shipped: `Sweep`, `Stir`, `Hammer`, `Spar` and `Drill` written into Woman,
Farmer, Adventurer and King by `npm run bodies:render` (#788, #790). Rank
6's four deferred clips now exist and are its to place in a routine.
Increment 2b shipped too: a generated cow grazing in the outer ward,
`MAX_SKINNED_TOTAL` 33 to 34, 34 of 34 bodies built (#789, #794). What is
left here: the look at all of it on a GPU (#53), and further generated
kinds (a pig, then a goat), each its own table row and ceiling argument.

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

