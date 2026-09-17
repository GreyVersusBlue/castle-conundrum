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
whether a covered hall goes dark. The covering is rank 5 below, behind the GPU
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
shipped and what is still open in it. Of that list the gaol roll shipped with
rank 4's increment 3 and the two performed set pieces with #592 to #596; what
is left of the theme is the rest of the "documents everywhere" list and a fact
that changes, which is rank 4's now.

**The wishlist came up whole on 2026-09-17** (#560 to #567): all seven of
`WISHLIST.md`'s themes and its tooling section came in as ranks 6 to 13, and
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

**The side quests got their format on 2026-09-17** (#576 to #581): `data/quests/`
is a directory of one graph per file, `validateQuestSet` in `src/quest-graph.js`
is the rail that keeps them out of the mystery's clue graph, `quest-manager.js`
runs them off the same event stream the frame hears without a second class, and
the cook's missing knife is the first of them. The save is version 4 for
`quests`; the key did not move (#36). **Rank 8 is still open**: one quest is
not a dozen, and reputation by ward waits on enough quests to make a moved
counter visible. The journal's open-quests tab shipped on 2026-09-17 (#595).

**The placement editor shipped on 2026-09-17** (#583 to #587), and it came out
of a finding about the row above it. **Rank 9's first increment was already
built** (#582): all eight drums carry a room at levels 0, 1 and 2, four carry
one at level 3, and the castle has 40 rooms. What it has instead is **nineteen
empty ones** — seven tower first floors, seven top rooms, four roofs and the
larder hold no evidence, no station, no document and no prop. So rank 9's
volume step is closed as done rather than built twice, and the tool that makes
filling a room cost a key press was taken up instead: `?edit=1` on the dev
server writes a prop's tile straight into `data/scene-config.json`.
`test/tools.mjs` is the eleventh suite.

**The map shipped on 2026-09-17** (#588 to #591): the journal's third tab,
"The castle", draws the plan's 40 rooms a storey at a time as the discs and
boxes `castle-plan.js` computes, fills a room in the first time the player
stands in it, withholds the name of every room not yet stood in, and rings
the one the HUD names. The set is `visited` on a version-5 save; the key did
not move (#36). The HUD's room line is now the one thing that enters a room,
the cross-wall walk's clue included, and `test/map.mjs` is the twelfth
suite. **Rank 9 is still open**: the town half waits on rank 4's yard.

**The lore's two set pieces shipped on 2026-09-17, and with them the whole
of that row** (#592 to #596): `data/npcs.json` carries a `performances` block
of two sermons and two songs, one person in one room at one bell, played as a
caption band over the castle to whoever is standing there to hear it. The
chapel at Vespers is the office said to the one boy who came; the Great Hall
at Vespers is the sentry on the bench end with a verse the high table has
never been told the words of; the kitchen at Sext is Marged counting the forty
mouths she feeds off one oven; and the chapel at Lauds is a filled grave on
the morning after. `src/lore.js` refuses a piece whose speaker is not really
in that room at that bell. **Rank 8 is closed and gone from this file**: the
one thing left in it, a `since` field for a fact that changes, went to rank 4's
spec as its own open call recommended, and every row below it moved up one.
**Rank 9's journal tab shipped in the same PR**: "Asked of you", the fourth
tab, carrying every side quest the player has met and keeping the finished ones
under a Done heading rather than dropping them off the page.

**Four more errands shipped on 2026-09-17** (#597 to #599): Lady Alys's
merlin, the chaplain's candle account, the sentry's four pence at dice and
Hywel's good chisel, two per ward, on four people the knife never touched,
each turning on events the mystery already emits and granting nothing. The
chisel was specced as waiting on a populace and waited on nothing once the
smith's answer was left in the smith's mouth. The rule it forced is #597: a
quest reaching a stage that waits on a clue the player already holds is
walked forward at the end of the batch that moved it, which closes the
barrel-before-Marged hole the knife shipped with. `validateQuestSet` holds
every file to a `ward`. **Rank 8 is still open**: seven of the dozen, and
reputation by ward, which five errands is now enough to make visible.

**12 ranked items. Nothing is claimed.** Every one of ranks 1, 2, 3 and 5
needs a machine this one is not: ranks 2, 3 and 5 a GPU (#518), rank 1 a
network that reaches quaternius.com (#568), which #541's did and this one's
did not. **Rank 4 no longer has a thread a container can start on its own**:
the gaol roll was it and it shipped (#571 to #575), and what is left of
increment 3 is a yard to build in the town and a design call to make about
bells on day two. Of ranks 6 to 12, the ones whose next increment is data and
validators rather than a render (6, 8 and 12) are the ones a container can
start; 7, 10 and 11 all want either a recorded sound, a body on disk, or a GPU
before their first increment closes, and 9 has nothing left in it that does
not wait on rank 4's yard. **Ranks 8 and 12 both shipped a first increment on
2026-09-17, and rank 8 a second the same day** (#597 to #599); both next
increments are a container's: rank 8's reputation by ward and the seven
errands left, rank 12's budget suite. **Rank 9's map shipped the same day** (#588 to #591),
and what is left of that row is the town, behind rank 4's yard. Of them all, 6
is the one that reads `data/npcs.json`'s `cast`, which is what ranks 1 and 10
are both for, so a session running beside one of those is better off on 8 or
12.

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
| 8 | Side quests: reputation by ward, and the seven left | 2+ | Opus 5 |  | [Side quests](SPECS.md#side-quests) |
| 9 | A castle to get lost in: the town, the rock and river | 2+ | Opus 5 |  | [A castle to get lost in](SPECS.md#a-castle-to-get-lost-in) |
| 10 | Bodies: a shared low-poly rig for the fifty | 1 | Fable 5.1 |  | [Bodies](SPECS.md#bodies) |
| 11 | Feel: presence, fire, weather, a door that opens | 2+ | Sonnet 5 |  | [Feel](SPECS.md#feel) |
| 12 | The tooling: the budget suite, move-and-delete, a dialogue format | 2+ | Opus 5 |  | [The tooling](SPECS.md#the-tooling) |

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
put "the player found this out" now, which neither had before. **And a third
thread arrived from the lore row when it closed** (#596): a `since` field on a
fact in `data/lore.json`, so that a fact can change with what the player did
on day one, which needs second-day state to be about and is this row's
whenever it takes a fourth increment. `SPECS.md` specs what is left.

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

## Side quests

**Rank 8, and a 2+. Three increments shipped on 2026-09-17** (#576 to #581,
#595, #597 to #599): the format, the set validator and the cook's missing
knife; then the journal's tab; then four more errands.
`data/quests/` holds one `QuestGraph` per file with two fields the frame does
not need, `id` and `npc`; `data/quests/index.json` names the files because a
browser cannot read a directory, and `test/quest.mjs` holds that list to the
directory in both directions. `validateQuestSet` is what makes a file in
there a side quest rather than a second mystery: no stage may put its person
in a state `mystery.json`'s clue graph owns, only one quest per person may
change what they say, and every event a transition turns on has to be one the
game emits. The cook's knife turns on two clues the mystery has owned since
Phase 3 and grants neither, which `test/quest.mjs` proves by playing the same
four presses of E with and without the quest and diffing the journals.

**The journal's tab shipped second** (#595): "Asked of you", the fourth tab,
showing every quest that has left its start stage with the objective it is at
now, and a finished one under a Done heading rather than off the page. A quest
nobody has met is not on it, and a castle where none has been met is not
offered the tab at all.

**Four more shipped third** (#597 to #599): the lady's merlin on the south
walk, which is where the tally stick is; the chaplain's candle account, which
the mystery's candle on his stair closes; the sentry's four pence, carried
through the gate, with one more thing to say only after the porter has
admitted the bar; and Hywel's chisel, with two endings, one for a player who
hears the smith say nothing and one for a player who has the roll. A quest
reaching a stage that waits on a clue the player already holds is walked
forward at the end of the batch (#597), and every file names its `ward`
(#599). Five errands, three outer and two inner.

**What is left.** Reputation by ward, two save-carried counters and a chatter
line or two, no longer deferred: five errands is a moved counter somebody
could see. Then the seven of `WISHLIST.md`'s dozen still unwritten: three it
named, of which two want rank 6's populace (a child's dog, the porter's boy
who wants his letters) and one does not (a letter for the town that needs a
gate pass), and four it never named. `SPECS.md` specs the next increment.

## A castle to get lost in

**Rank 9, and a 2+. The volume step was found already built on 2026-09-17**
(#582) and the row's premise is rewritten against the castle that exists. All
eight drums carry a room at levels 0, 1 and 2, four carry one at level 3, and
`test/plan-vs-scene.mjs` has been printing the count on every run since #526:
40 rooms, 14 / 11 / 11 / 4 by level. The four drums with no top room are the
four with a 2.5 m turret, which #523 refused on arithmetic.

**Nineteen of the 40 are empty** — seven tower first floors, seven top rooms,
four roofs and the larder — which is `PLAN.md`'s "an empty room is worse than
no room" as a fact rather than a risk. A latrine turret and a well chamber
were considered and refused for that reason: they would make it 22.

**The map shipped on 2026-09-17** (#588 to #591): the journal's third tab,
over the 40 rooms the plan computes and the HUD names (#515), with a
`visited` set on a version-5 save and `test/map.mjs` as the twelfth suite.
Every room is drawn from the first; a room gives up its name and its fill
the first time the player stands in it. **What is next is area.** The town
half still waits on rank 4's Thomas Wykes yard proving the ground west of the
barbican can carry a building. Filling the nineteen is rank 6's routines and
whatever documents a later lore row adds, made cheap by rank 12's editor.

## Bodies

**Rank 10.** Every row above this one that needs a new body is waiting on
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

**Rank 11.** Everything in this row is gated on `npm run play` on a real
machine (#53), the same gate **The hall covering** already sits behind, and
most of it is a day's work each once someone can see it: weather and sky, fire
and a shadow budget, examine, doors that open, wear, sitting. The first
increment is the two things `WISHLIST.md` itself calls the cheapest presence
cues there are — a shadow on the pavers and a hand that reaches for the door —
and nothing in this row ships past a `snap` and a sentence in `HISTORY.md`
until **The GPU run** (ranks 2 and 3) has happened.

## The tooling

**Rank 12, and a 2+. The placement editor shipped on 2026-09-17** (#583 to
#587). `?edit=1` on the dev server mounts a panel that reads the tile under
the player's feet as they walk and, on **P**, writes the row into
`data/scene-config.json` — `interiorProps`, `builtProps` or `braziers`, with
the models and materials the config already names. It does not commit; the
diff is for a person. The write is a text splice and not a re-serialise,
because `JSON.stringify(JSON.parse(raw), null, 2)` over that file is not that
file: 94212 bytes go out as 98330 and `"intensity": 2.0` comes back as `2`
(#584). `test/tools.mjs` holds it to byte-exactness by cutting the new row
back out and comparing the whole file.

Dev-only is two independent halves — `import.meta.env.DEV` around the import,
`apply: 'serve'` on the plugin — and neither is trusted: `test/built.mjs`
greps every shipped file for the module's sentinel, because the served-set
diff cannot see a module that neither page ever asks for (#586).

**What is left** is the budget suite (skinned bodies, point lights and draw
calls per ward against a number a phone cannot carry), a move-and-delete in
the editor so correcting a placement is not still hand-editing, and the
dialogue format. `SPECS.md` specs the next increment.

