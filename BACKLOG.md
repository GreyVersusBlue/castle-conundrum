# BACKLOG

Open work on Castle Conundrum, ranked. **`HISTORY.md` records what shipped;
this file ranks what is open; `SPECS.md` is the spec for each row below;
`PLAN.md` is the plan the seven shipped phases came out of** and its "What this
leaves for a later arc" list is where most of the rows below came from. Nothing
open lives in `HISTORY.md` and nothing that shipped belongs here.

Each row's `Detail` link goes to its section in `SPECS.md`: scope by file,
acceptance criteria and the suite that holds them, the open judgement calls with
a recommended answer, dependencies, and the house rules that bite. The sections
under the table here are the one-paragraph summaries; where a summary and
`SPECS.md` differ, `SPECS.md` was written against the code and wins.

## Where things stand

**Castle Conundrum v2 is finished** (#489, 2026-09-15). All seven phases of
`PLAN.md` shipped, PRs #306 to #320 in `tools-and-games`. **The project moved
here on 2026-09-15** (#491 to #503): its own repo, its own CI, Vite instead of
a hand-vendored `libs/`, and a 200 MB asset ceiling instead of 44.4.

**Asset compression shipped on 2026-09-15** (#506 to #510): KTX2/Basis over
every texture, meshopt over the Poly Haven props and the NPC bodies, and 317.9
MB of video memory down to 79.9. `tools/encode-assets.mjs` is the pipeline, and
anything **A fourth body** adds has to come through it, the way the texture
sets and the town side already did.

**Four things a GPU saw shipped on 2026-09-15** (#511 to #517, PRs #6 and
#7): a body can climb every flight, the drums wear built crowns instead of
merlons hanging in the air, no two faces share a plane so nothing flickers,
and the castle says where you are: a HUD room line, a tint per drum, and
something in every room. New texture sets did not ship with it, because that
container could not reach Poly Haven or KTX-Software (#518); a later one
could, and the row that came out of that is below.

**Sound shipped on 2026-09-15** (#519 to #522): a footstep per surface class
and the chapel bell, both synthesised out of `data/sounds.json`, no audio file
in the repo at all. What it sounds like is a question for a machine with
speakers (#53).

**The tower roofs shipped on 2026-09-15** (#523 to #526): the North-west,
Kitchen, South-west and Prison Towers have a third flight and a floor at 12 m,
36 walkable cells each under the crown #514 built. The four turreted drums did
not get one and the reason is arithmetic: a 2.5 m turret in a 2.8 m ring leaves
a 0.3 m ledge. The turrets are solid now, which they had never been.

**The lore row shipped on 2026-09-16** (#551 to #555) and **was reviewed and
expanded on 2026-09-17** (#556 to #559): `data/lore.json` is a canon of 61
facts written against one timeline, `data/documents.json` is thirteen readable
props in rooms the castle already builds, `data/npcs.json` carries a 27-pair
chatter pool, and `src/lore.js` holds every cross-reference among them,
including a document's slab against the `builtProps` entry that builds it.
The row is done and its section is gone from this file and from `SPECS.md`;
what is still open in it is in `WISHLIST.md`, theme 3.

**The Great Hall's roof frame shipped on 2026-09-15** (#527 and #528): seven
trusses across the hall at 8 m, and no covering over them, because nothing in
a container that cannot render can tell which way a kit roof piece slopes or
whether a covered hall goes dark. The covering is rank 7 below, behind the GPU
run.

**The line between the two plan suites was drawn on 2026-09-15** (#529):
`layout.mjs` is every fact derivable from the plan in Node, `plan-vs-scene.mjs`
is the seams only, `mystery.mjs` owns the stations. One dead check deleted,
three assertions moved or turned into preconditions, and **no new check written
to replace them**, because three attempts at one could not be made to fail.

**Touch shipped on 2026-09-15** (#530 to #532): a stick under each thumb, one
E button that wears the prompt, a Journal button, a toggle on the start panel,
and `test/touch.mjs` as the ninth suite. What it FEELS like is unknown — nobody
has had a thumb on it, and the six numbers that decide that are named constants
in one file each (#53).

**The second day shipped in three increments, on 2026-09-15, 2026-09-16 and
2026-09-17** (#533 to #540 and #571 to #575, PRs #16, #18 and #28). The
epilogue's button reads "The next morning" now. One watch, `lauds`, thirteen
stations, sixty line sets keyed by which of the seven endings the player
reached, seven closing panes, and a thirteenth cast entry — the King's
inspector — whose conversation is the end of the game. The save is version 2
with a `day` field; the key did not move (#36). Increment 2 gave the stone its
half: the cell's bars come off on the five mornings Madoc walks out, which
opens to the player the one ground room nobody has ever stood in, and the
muniment door stands open in the full ending and is shut again in the other
six. **Increment 3 shipped its gaol roll**: an eleventh piece of evidence, on
the barrel-head in the guardroom, that convicts nobody, and `day2.knew` — the
first thing on the second day keyed by what the player found rather than by
what he said, which is what stops the King's man telling a clerk who had the
roll off the barrel-head that nobody in this castle ever looked at it.
**Rank 4 is still open**: the town half and the bells-on-day-two question are
untouched.

**The texture sets and the town side shipped on 2026-09-16** (#541 to #546):
`ktx` was on PATH and Poly Haven answered this time, so both rows that #518
had blocked came due together. Five materials over four roles — a dressed
ashlar for the inner ward, a red brick for the four inner drums, a plaster for
the two walls that exist only at level 1, and a deck plank for the eight tower
first floors — plus a sixth, `forest_ground_06`, restored out of this repo's
own history to texture the ground west of the barbican, with a road and four
trees. `dist/` grew by about 17 MB against 200. Increment 3's town half is
unblocked; what it still needs is Thomas Wykes's yard built on the ground this
row laid, and the bells-on-day-two question #533 raises.

**The lore row shipped on 2026-09-16** (#551 to #555): `data/lore.json`'s
thirty-one facts, six readable documents built as slabs in rooms the castle
already builds, a 17-pair chatter pool for the existing twelve, and the save
at version 3 for `read`. `WISHLIST.md`'s theme 3 is rewritten to say what
shipped and what is still open in it (the gaol roll and the rest of the
"documents everywhere" list, the two performed set pieces, facts that
change).

**The wishlist came up whole on 2026-09-17** (#560 to #567): all seven of
`WISHLIST.md`'s themes and its tooling section are ranks 6 to 13 below, and
`WISHLIST.md` is rewritten to point at them rather than describe them twice.
Devon asked for this directly rather than waiting on rank 5 to close, which is
question 10's answer overtaken by the man who gave it; the order between the
eight new rows and the content inside each one both come from the wishlist as
written, not reinvented. Each names a model, defaulting to Opus 5, and Fable
5.1 where the row is asset-sourcing in the shape rank 1 already is. None of
the eight has shipped anything: `SPECS.md` specs a first increment for each,
the way rank 4 already specs its own increments, and a shipping session picks
up where that increment stops.

**The fourth body was looked for on 2026-09-17 and not found from here** (#568
to #570): every host that carries a Quaternius body was refused by the
container's network policy, the way #518's was, and the two rigged CC0
bodies the npm registry did carry were the wrong shape (KayKit, chibi) and the
wrong licence (deskrpg, non-commercial derivative). The row stays at rank 1
with what to fetch written into it.

**13 ranked items. Rank 9 is claimed by `claude/friendly-darwin-xdh53e`.** Every one of ranks 1, 2, 3 and 5
needs a machine this one is not: ranks 2, 3 and 5 a GPU (#518), rank 1 a
network that reaches quaternius.com (#568), which #541's did and this one's
did not. **Rank 4 no longer has a thread a container can start on its own**:
the gaol roll was it and it shipped (#571 to #575), and what is left of
increment 3 is a yard to build in the town and a design call to make about
bells on day two. Of ranks 6 to 13, the ones whose first increment is data
and validators rather than a render — 6, 8, 9, 10 and 13 — are the ones a
container can start; 7, 11 and 12 all want either a recorded sound, a body on
disk, or a GPU before their first increment closes.

One thing is true of the whole list and worth saying once. **Nothing here has
been seen on a GPU since Phase 5.** `npm run play` walks the whole intended day
— twelve people, ten pieces of evidence, three bells, a reload at Sext, the
accusation and the epilogue, 102 assertions — and no run of it since Phase 5 has
happened on a machine with real compositing (#53). Rank 2 is that run, and it
carries six jobs it did not have: nobody has looked at a compressed texture
(#507) or at the five that shipped after it (#541 to #546), at a tower roof
from 12 m (#523), at seven trusses over the hall (#527), at a Lauds sky
(#533), or at the gaol roll on the guardroom barrels (#571, the first built
slab whose support is another prop) — and nobody has put a thumb on a phone
(#530). The second standing
line, "the game has never had a thumb on it", came out with #530: the scheme
is there, it is in CI, and what is left of it is the feel.

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
| 1 | A fourth body, and a woman's in particular: fetch it from a machine that reaches quaternius.com | ½ | Fable 5.1 |  | [A fourth body](SPECS.md#a-fourth-body) |
| 2 | A real GPU run of `npm run play`, and somebody looks at the twelve | ¼ | Opus 5 |  | [The GPU run](SPECS.md#the-gpu-run) |
| 3 | A new preview and og card, from that run | ¼ | Opus 5 |  | [The GPU run](SPECS.md#the-gpu-run) |
| 4 | A second day: increment 3, the town half and the bells question | 2+ | Opus 5 |  | [A second day](SPECS.md#a-second-day) |
| 5 | The hall's covering, and the two windows under it | ¼ | Sonnet 5 |  | [The hall covering](SPECS.md#the-hall-covering) |
| 6 | Life: a populace, and the first ten bodies of it | 2+ | Opus 5 |  | [Life: a populace](SPECS.md#life-a-populace) |
| 7 | Sound: ambient beds, event sounds, a bell that is a soundscape | 1 | Fable 5.1 |  | [Sound: a soundscape](SPECS.md#sound-a-soundscape) |
| 8 | Lore: the sermon, the song, and facts that change | ¼ | Sonnet 5 |  | [Lore: what is still open](SPECS.md#lore-what-is-still-open) |
| 9 | Side quests: the first dozen, and reputation by ward | 2+ | Opus 5 | `claude/friendly-darwin-xdh53e` | [Side quests](SPECS.md#side-quests) |
| 10 | A castle to get lost in: the volume, the town, the rock and river | 2+ | Opus 5 |  | [A castle to get lost in](SPECS.md#a-castle-to-get-lost-in) |
| 11 | Bodies: a shared low-poly rig for the fifty | 1 | Fable 5.1 |  | [Bodies](SPECS.md#bodies) |
| 12 | Feel: presence, fire, weather, a door that opens | 2+ | Sonnet 5 |  | [Feel](SPECS.md#feel) |
| 13 | The tooling: a placement editor, a dialogue format, a budget suite | 2+ | Opus 5 |  | [The tooling](SPECS.md#the-tooling) |

## A fourth body

**Rank 1.** Marged, Nest and Lady Alys are three of twelve and the Kenney kit
has no woman's body. Twelve NPCs come off three bodies by tint (#417, #419) and
that was accepted as a risk, not as a solution. **Question 1 for Devon in
`PLAN.md`**, and under this repo's own rule a session may answer it: find or
make a fourth body, add it to `data/npcs.json`'s `cast`, and record the call.
Whatever it is goes through `tools/encode-assets.mjs` before it is committed
(#506): an uncompressed body is the one asset nothing else on this list would
notice. **Looked for on 2026-09-17 and not found from a container whose
network refuses quaternius.com, itch, poly.pizza, OpenGameArt and Patreon**
(#568). What the npm registry carries instead was measured and rejected:
KayKit's Mage and Rogue are CC0 women with the head joint 57 % of the way up
the body against the Quaternius rig's top fifth (#569), and deskrpg's fifty
are the right Quaternius rig under a non-commercial licence, in office
clothes (#570). Fetch the Ultimate Modular Women Pack first, check it against
`SPECS.md`'s three name lists, and the rest of the row is as specced.

## The GPU run

**Ranks 2 and 3.** `npm run play` has not run on a machine with real GPU
compositing since Phase 5 (#53). It is 102 assertions over the whole day and it
writes a numbered screenshot per beat into `shots/play/`. Two things come out
of one run: whether the walk, the stairs and the wall walk actually behave, and
whether **twelve NPCs off three bodies read as twelve** — photograph all twelve
in the Great Hall at Vespers and look (`PLAN.md`, Risks). **And now a third:
nobody has looked at a compressed texture.** #507 put ETC1S on every diffuse and
UASTC on every normal and ARM map on a reading of what each codec does to which
channels, checked by nothing but bytes and a headless software rasteriser.
Whether 8 m of `castle_wall_slates` bands is a question only a real render
answers.

Rank 3 depends on rank 2 having happened. The board preview and og card in
`tools-and-games` are from before Phase 3: they show the archway wide open in a
7x7 courtyard that no longer exists, with none of the HUD the game has now
(#374, #379). New images come out of the same run. **Where they go is Devon's**
— those two files live in `tools-and-games/assets/` and he relinks.

## A second day

**Rank 4, and a 2+. Increments 1 and 2 shipped on 2026-09-15 and 2026-09-16**
(#533 to #540) and **increment 3's gaol roll on 2026-09-17** (#571 to #575):
the morning after is there in seven shapes, the cast says what the verdict
made of them, the castle moves with them, and one thread of the second
mystery is answerable. The gaol roll is the eleventh piece of evidence and
the only one that convicts nobody: its dates put Madoc at the forge by day
and behind the bars by night, and a player may read them and hang him anyway,
which is what the King's man says to his face on the morning after. That last
half is `day2.knew`, three line sets keyed by the journal rather than the
verdict.

**Two threads are left and both wait on something.** The missing 128 sheets
are in Thomas Wykes's yard, which nobody has placed on the ground the town
side laid (#541 to #546). A schedule with more than one watch still has to
argue with #533 rather than work around it. Both of them have somewhere to
put "the player found this out" now, which neither had before. `SPECS.md`
specs what is left.

## The hall covering

**Rank 5.** The Great Hall has seven trusses over it since #527 and nothing
between them. The kit's `roof*.glb` pieces would cover it, and two windows at
`base` 5 in `great-hall-north` would keep the daylight the covering takes
away. Both halves need somebody to look: nothing in a container that cannot
render can tell which way a kit roof piece slopes (`partsOf` gives all four of
`roof.glb`'s parts the same 1 x 1 x 1 box), and whether a covered hall is dark
is a luma read off a real render (#438). Six of the twelve stand in this room
at Vespers and the accusation is made there, which is why #528 would not guess
at it.

## Life: a populace

**Rank 6.** The twelve are the mystery's; the castle needs the other fifty who
were there before the mason died and will be there after. `data/populace.json`
is a fourth data file with a validator, keyed to a body, a tint and a routine
of `{room, tile, activity, facing?}` per watch, on `stations.js`'s own walk
grid and `STATION_CLEARANCE`. The first increment, per Devon's own answer to
question 10 in `WISHLIST.md`, is the file, the validator, and the first ten
bodies off the models this repo already has — no new asset, no new clip — so
the row that makes every other wishlist row visible does not itself wait on
one.

## Sound: a soundscape

**Rank 7.** Two sounds exist and both are synthesised (#519, #548). This row
is the other twenty: ambient beds per zone, spatialised at a point per room
and cross-faded by the room the HUD already tracks (#515), event sounds tied
to an activity clip, and the four bells given a character each. Recorded CC0
audio is admitted since #548 reversed #519's synthesis-only half, named by
`data/sounds.json` and run through `tools/encode-assets.mjs` like any asset
(#506). The first increment is the ambient beds: the zones and the
cross-fade, with synthesis standing in wherever a recording has not been
found yet.

## Lore: what is still open

**Rank 8.** The bulk of the lore row shipped (#551 to #559): a 61-fact canon,
thirteen documents, a chatter pool. Two pieces named in `WISHLIST.md` theme 3
did not: the chaplain's sermon at Vespers and a song in the hall at Sext,
each its own pool so a second day does not repeat the first, and a `since`
field for a fact that changes with what the player did on day one. The second
piece wants the second-day machinery **A second day** (rank 4) is still
building and cannot start before it; the first does not, and is the whole of
this row's first increment.

## Side quests

**Rank 9.** `src/quest-graph.js` (#393) is already a validated state machine
that knows no NPC by id; every side quest is a small one of those, in its own
`data/quests/*.json` file, on the frame `quest.json` already has. A quest
never gates or removes a mystery clue (#550, question 6) and the set validator
holds that apart from the graph of quest-to-quest links it may build. The
first increment is the format, the set validator, and the first quest: the
cook's missing knife, which needs no new prop and whose resolution points at
a clue `mystery.json` already has without an effect that touches it.
Reputation by ward is data the save carries and follows once more than one
quest exists to move it.

## A castle to get lost in

**Rank 10.** Devon wants it huge; the plan's own risk section says why size
is not the first move (an empty room is worse than no room), so the order
inside this row is the wishlist's own: volume before area, area before a
second castle. The first increment is the volume this castle already has and
is not using — the unused floors across the eight drums, an undercroft, a
well chamber, a latrine turret, the guardroom over the porter's gate — all of
it `castle-plan.js` and a floor slab, all of it somewhere a rank-8 document
or a rank-6 routine can go. The town, the rock and the river, the map, and a
second castle are later increments of this same row, in that order, and none
of them starts before the volume does.

## Bodies

**Rank 11.** Every row above this one that needs a new body is waiting on
this one. Low-poly, one shared rig, CC0, for now (#550, question 5): a body a
session can make or edit as a drop-in, the way **A fourth body** (rank 1)
already had to answer once for a woman's body and this row answers at the
scale of a child, a dog, a chicken and a garrison. Variation without files —
tint, height scale, a hidden hood or hat node, a held prop, a beard toggle —
is `npc.js`'s existing hide-node and hide-material machinery, not new code.
Every body goes through `tools/encode-assets.mjs` before it is committed
(#506); an uncompressed body is the one asset nothing else on this list would
catch.

## Feel

**Rank 12.** Everything in this row is gated on `npm run play` on a real
machine (#53), the same gate **The hall covering** already sits behind, and
most of it is a day's work each once someone can see it: weather and sky, fire
and a shadow budget, examine, doors that open, wear, sitting. The first
increment is the two things `WISHLIST.md` itself calls the cheapest presence
cues there are — a shadow on the pavers and a hand that reaches for the door —
and nothing in this row ships past a `snap` and a sentence in `HISTORY.md`
until **The GPU run** (ranks 2 and 3) has happened.

## The tooling

**Rank 13.** None of the seven themes above is a code problem; they are
content problems at a scale the current tooling cannot carry, and the
wishlist names three tools for it. The first increment is the placement
editor: `?edit=1` on the dev server only, never in `dist/`, that writes a
prop's tile coordinates into the JSON the builder reads instead of a session
hand-typing them, which is how every prop in the castle got there so far and
why there are so few. A dialogue format that compiles to the JSON the
validators read, and a budget suite that counts skinned bodies, point lights
and draw calls per ward against the number the phone cannot carry, are this
row's next two.
