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

**Castle Conundrum v2 is finished** (#489, 2026-09-15). All seven phases of
`PLAN.md` shipped, PRs #306 to #320 in `tools-and-games`. **The project moved
here on 2026-09-15** (#491 to #503): its own repo, its own CI, Vite instead of
a hand-vendored `libs/`, and a 200 MB asset ceiling instead of 44.4.

**Asset compression shipped on 2026-09-15** (#506 to #510): KTX2/Basis over
every texture, meshopt over the Poly Haven props and the NPC bodies, and 317.9
MB of video memory down to 79.9. `tools/encode-assets.mjs` is the pipeline, and
anything a new body adds has to come through it, the way the texture sets,
the town side and `Woman.glb` already did (#605).

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
5.1 where the row is asset-sourcing in the shape rank 1 was. None of
the eight has shipped anything: `SPECS.md` specs a first increment for each,
the way rank 4 already specs its own increments, and a shipping session picks
up where that increment stops.

**The fourth body shipped on 2026-09-17** (#603 to #606), from Devon's own
machine after #568's container could not reach a single host that carries a
Quaternius body. It is the Ultimate Modular Women Pack's `Medieval.gltf`,
committed as `assets/NPCs/Woman.glb`, and Marged, Nest and Lady Alys all wear
it at 1.65 m. **Rank 1 is done and its section is gone from this file and
from `SPECS.md`.** Rank 6's populace put five more women in it the same day.

**The side quests got their format on 2026-09-17** (#576 to #581): `data/quests/`
is a directory of one graph per file, `validateQuestSet` in `src/quest-graph.js`
is the rail that keeps them out of the mystery's clue graph, `quest-manager.js`
runs them off the same event stream the frame hears without a second class, and
the cook's missing knife is the first of them. The save is version 4 for
`quests`; the key did not move (#36). The journal's open-quests tab shipped
the same day (#595), four more errands after it (#597 to #599), and
**reputation by ward the same day again** (#612 to #615): two counters at save
version 6, a line per ward threshold on the end of what anybody in that ward
says, and one line under the verdict. **Rank 8 is still open**: what is left
in it is the seven errands of the dozen still unwritten.

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

**The ambient beds shipped on 2026-09-17** (#620 to #623): `data/sounds.json`
carries an `ambient` block of seven synthesised room tones, `bedOf` in
`src/audio.js` picks one from whatever zone the HUD's room line names, and the
render loop cross-fades to it over 1.2 s on the same change that writes the
line (#515). `test/layout.mjs` check 13 puts every one of the castle's 8981
walkable cells through the nav and fails a zone with no bed, a bed with no
zone, and a `byRoom` name the castle does not build; `test/map.mjs` holds the
one line in `main.js` that Node cannot see. No forge and no rain, because the
castle has neither, and no garden, because check 13 found that nobody can
stand in it (#469). **Rank 7 is still open**: nobody has heard any of it (#53),
a bed is in the head rather than at a point in its room, and the bells and the
event sounds are untouched.

**The first ten of the populace shipped on 2026-09-17** (#616 to #618):
`data/populace.json`, `src/populace.js` and ten people with no clue, no lie
and no line, walking rings inside a watch on the same grid the twelve's
schedule is checked against. Nine activities onto three clips the kit already
ships, so no asset was needed and none was added. **Rank 6 is still open**:
the other forty, the ambient talk, the children and dogs, and every activity
that wants a clip nobody has baked yet.

**The byte-exactness rail is green on both line endings, on both machines**
(#631 to #633, 2026-09-17). `test/tools.mjs` failed all three of its
byte-exactness rows on a Windows checkout and passed them in CI for as long as
the rail had existed: `data/scene-config.json` comes out of git CRLF here and
both the splice and the cut that undoes it were written in LF, so the file came
back one byte short. `tools/place.mjs` takes every newline it writes from
`eolOf(source)` now, and the suite builds an LF copy and a CRLF copy of the real
file and asserts over both rather than over whatever git handed the machine. Part
1 went from 17 assertions to 47. **Nothing in the row is open**, and the two
things found on the way that are not in it are in `HISTORY.md` under #633.

**Twelve ranked items, numbered 1 to 12. Nothing is claimed, and lane B is
free**: the byte-exactness rail merged as PR #40 (#631 to #633) and 12b's
move-and-delete after it (#636 to #642), so ranks 4c, 5 and 9 are startable and
12b is done. The **first** rank 1 shipped
on 2026-09-17 and **the numbers under it were not shifted up** (#619):
`SPECS.md` and `ROADMAP.md` already name every row by title as well as by
rank, for exactly this reason (#522), and four wave A sessions were running
the day it closed — renumbering eleven rows across three files would have put
a conflict in every line of every table, which is the reason rank 1's own
session gave for leaving the row in. A rank is retired, not reused, the way a
decision number is (#491). Ranks 2, 3 and 5 still need a machine this one is
not: all three want a GPU (#518). **Rank 4 no longer has a thread a container can start on its own**:
the gaol roll was it and it shipped (#571 to #575), and what is left of
increment 3 is a yard to build in the town and a design call to make about
bells on day two. Of ranks 6 to 12, the ones whose next increment is data and
validators rather than a render (6, 8 and 12) are the ones a container can
start; 7, 10 and 11 all want either a recorded sound, a body on disk, or a GPU
before their first increment closes, and 9 has nothing left in it that does
not wait on rank 4's yard. **Rank 8 shipped four increments on 2026-09-17 and
rank 12 two** — rank 8's first errand, the journal's tab, four more errands
(#597 to #599) and reputation by ward (#612 to #615), rank 12's placement
editor and then its budget suite (#607 to #611). Rank 8's next increment is a
container's: the seven errands left.
**Rank 12 is down to the dialogue format.** Move-and-delete shipped on
2026-09-17 (#636 to #642) — the panel lists the rows within six tiles, `M` moves
the selected one to the player's feet and `Delete` twice removes it — and the
live failure that had been waiting for whoever took it went the same morning:
`test/tools.mjs`'s byte-exactness rail was red on a Windows checkout and green
on a Linux one, and it now runs over both endings on either machine (#631 to
#633). **Rank 9's map shipped the same day** (#588 to #591),
and what is left of that row is the town, behind rank 4's yard. Of them all, 6
is the one that reads `data/npcs.json`'s `cast`, which is what rank 10 is
for, so a session running beside that one is better off on 8 or
12.

**It has been seen on a GPU now** (#624 to #630, 2026-09-17). `npm run play`
ran on Devon's machine with real compositing for the first time since Phase 5,
and the standing line that nothing here had been looked at comes out with it.
What that run settled, and what it did not:

**Settled.** The walk up three flights to a tower roof at 12 m and along the
wall walk, over the cross-wall and down into the ward — Phase 5's own exit
criterion, met (#523). The compressed textures (#507): 1k `castle_wall_slates`
at a grazing angle reads as stone, no banding, and the ETC1S/UASTC split holds.
The gaol roll on the barrel-head (#571). A body at interact range, and what a
tower roof actually looks like from on top of it, which is mostly parapet.

**Not settled, and rank 2 stays open for it.** The day does not yet run end to
end, so there is no `twelve-at-vespers`, no shot of the seven trusses from
under them (#527) and no luma read off the hall floor (#438) — which is what
rank 5 is waiting on, so **that gate is still shut**. The Lauds sky (#533) is
past where the run reaches. Nobody has put a thumb on a phone (#530); that
half is untouched and is still the feel.

**And the run found the thing it exists to find.** Rank 1 below is a castle you
cannot walk in after you open the journal, and it is a bug in `src/`, not in
the suite. Nothing but a hand on a keyboard was ever going to see it.

**Rank 3 shipped the same day anyway** (#634, #635): asked to choose between
holding the row for a second run or a fallback frame, Devon took the fallback.
The new preview and og card are built from the chapel-at-Prime shot rather
than the Vespers hall the spec wanted, and they live in this repo's
`assets/og/` now rather than in `tools-and-games`. **Rank 3 is done, gone from
the ranked table above, and its own scope is gone from `SPECS.md`**; what it
shared with rank 2 stays in "The GPU run" section below, rewritten to say
what shipped.

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
  suites, headless Chromium. Seven of the twelve.
- **Local: GPU.** Needs `npm run play` on a machine with real compositing, or
  needs somebody to look at a render. This is #53, and #53 cuts both ways: a
  real-time assertion that *fails* under software rendering is inconclusive,
  not confirmed. Ranks 2, 3, 5, and rank 11 past its Node line.
- **Local: net.** Needs a network that reaches the asset hosts. Not a GPU
  question and not the same block: #518's container could not reach Poly
  Haven and #541's could; #568's could not reach quaternius.com. Ranks 1 and
  10.
- **Local: audio.** Needs speakers and a person. Rank 7 only, and only for the
  judgement — the assignment and the cross-fade are a container's.

**Gate.** What must have shipped before the row can start. **There are four
hard gates on the whole list** and everything else is preference:

1. **Rank 2 before rank 3.** The images come out of that run; there is no
   other source.
2. **Rank 2 before rank 5.** Both of the hall covering's criteria are a
   render: which way a kit roof piece slopes, and whether a covered hall goes
   dark.
3. **Rank 2 before rank 11 ships past its Node acceptance.** The row's own
   spec says nothing in it goes past a `snap` and a sentence until the run has
   happened.
4. **Rank 4c before rank 9's town.** Thomas Wykes's yard is what proves the
   ground west of the barbican carries a building.

Three softer ones are worth naming and are not gates: rank 6's populace
unlocked two of rank 8's seven errands and rank 7's event sounds when its
first ten shipped (#616), rank 10 and
rank 6 trade activity clips both ways, and rank 12's budget suite was more
useful once there were more bodies to count. None of the three blocked a start,
and the budget suite went first anyway (#609) — a ceiling on a castle with
twelve bodies in it is still the ceiling rank 6's ten are spent against.

**Lane.** The file that two sessions would collide on. **One row per lane at a
time** (#602); rows in different lanes, or with no lane, may be claimed
together.

| Lane | The file that decides it | Rows |
| --- | --- | --- |
| A | `src/save.js` — the version number and `migrate` | 4a, 4b, 8 |
| B | `data/scene-config.json` — and `test/tools.mjs`'s byte-exactness rail | 4c, 5, 9 (12b is done) |
| C | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 1, 6, 10, 12c |
| D | `src/main.js`'s player rig and spawn | 6, 11 |
| E | `src/audio.js` and `data/sounds.json` | 7 |

Lane A is the one the specs already warned about in words: **"do not run
alongside anything else that touches `save.js`"** is written into rank 4's
dependencies, and rank 8's next increment is a version bump to 6. Lane C is
the `cast` block specifically, not the whole of `data/npcs.json`: rank 8 and
rank 12c write per-person `states` and `default` line arrays, which is a
different region of the same file and merges, but a session doing either
should say so in its PR.

Rank 4 splits three ways because its remaining threads do, and the spec
already names them separately: **4a** is the bells-on-day-two design call and
`day2.watches`, **4b** is the `since` field on a fact that changes (#596), and
**4c** is Thomas Wykes's yard. 4a and 4b are a container's; 4c wants the
editor walked and the yard looked at. Rank 12 splits the same way and for the
same reason: **12a** the budget suite (shipped, #607 to #611), **12b**
move-and-delete in the editor (shipped, #636 to #642), **12c** the dialogue
format, which is all that is left of the row.

## The ranked table

**It started at 2 and has a 1 again, and now has a gap at 3 too.** The first
rank 1 shipped on 2026-09-17 and its number was retired rather than reused
(#619); the rank 1 below is a different row, opened the same day by what the
GPU run found (#624 to #630). That is the retirement rule working as intended
rather than against it: a rank is a priority and not an id, so the number
came back to the top of the list when something belonged there. Rank 3
shipped the same day, from a fallback source rather than the shot the spec
asked for (#634, #635), and its number is gone the same way rank 1's first
use is. Every row below is named by title in `SPECS.md` and `ROADMAP.md` as
well as by rank, which is what makes that survivable (#522).

| Rank | Item | Size | Model | Where | Gate | Lane | Claimed | Detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The castle you cannot walk: pointer lock after an overlay, and a Present nobody can click | ¼ | Opus 5 | Container | — | D | | [The castle you cannot walk](SPECS.md#the-castle-you-cannot-walk) |
| 2 | The GPU run: the day end to end, and somebody looks at the twelve (the run happened, #624 to #630) | 1 | Opus 5 | Local: GPU | **after 1** | — | | [The GPU run](SPECS.md#the-gpu-run) |
| 4 | A second day: increment 3, the town half and the bells question (4b, the fact that changes, shipped #646 to #649) | 2+ | Opus 5 | 4a container, 4c local | — | A (4a), B (4c) | | [A second day](SPECS.md#a-second-day) |
| 5 | The hall's covering, and the two windows under it | ¼ | Sonnet 5 | Local: GPU | **after 2** | B | | [The hall covering](SPECS.md#the-hall-covering) |
| 6 | Life: a populace: the fifty, the activity clips and the ambient talk | 2+ | Opus 5 | Container | — | C, D | | [Life: a populace](SPECS.md#life-a-populace) |
| 7 | Sound: somebody listens to the seven beds, then a bed at a point, the four bells, event sounds | 1 | Fable 5.1 | Container, judged local: audio | — | E | | [Sound: a soundscape](SPECS.md#sound-a-soundscape) |
| 8 | Side quests: the seven errands left of the dozen | 2+ | Opus 5 | Container | — | A | | [Side quests](SPECS.md#side-quests) |
| 9 | A castle to get lost in: the town, the rock and river | 2+ | Opus 5 | Container | **after 4c** | B | | [A castle to get lost in](SPECS.md#a-castle-to-get-lost-in) |
| 10 | Bodies: a shared low-poly rig for the fifty (the child and the hound shipped, #643 to #645) | 1 | Fable 5.1 | Local: net | — | C | | [Bodies](SPECS.md#bodies) |
| 11 | Feel: presence, fire, weather, a door that opens | 2+ | Sonnet 5 | Container to the Node line, local: GPU past it | **after 2** | D | shadow + hand shipped 2026-09-17 (#650 to #654) | [Feel](SPECS.md#feel) |
| 12 | The tooling: a dialogue format (the placement editor, its budget suite and its move-and-delete all shipped, #583 to #587, #607 to #611, #636 to #642) | 2+ | Opus 5 | Container | — | C (12c) | | [The tooling](SPECS.md#the-tooling) |

**`ROADMAP.md` is these three columns turned into an order**: which row to
take first, what each one unblocks, and which ones two sessions may hold at
the same time. This table still ranks; that file sequences (#601).

## The castle you cannot walk

*Where: container. Gate: none; it gates rank 2. Lane: D.*

**Rank 1, and it is a ¼ that stops the game.** Found by the GPU run on
2026-09-17 (#626, #627). `src/ui.js` calls `document.exitPointerLock()` for
four overlays — the riddle, the journal, the accusation panel and the verdict
pane — and `src/quest-manager.js` takes pointer lock back for **the riddle
alone**. Open the journal and shut it and the player cannot move, cannot look,
is offered no resume panel, and has no way back but reloading the page:
measured, W moves the player 3.7 m before and 0.00 m after. Separately, a
dialogue never releases pointer lock, so its **Present button cannot be clicked
by a real mouse** — the cursor is captured and every pointer event goes to the
canvas. **The two hide each other**: open the journal once and Present works
for the rest of the game, at the price of never walking again. Presenting is
how four of the twelve are pressed, so neither half is a corner of the game.
The fix is `src/`, lane D, and it wants a guard-rail that presses J twice and
asserts the player can still move. `test/play-castle.mjs` already asserts both,
red, and works around both so the rest of the day can be played.

## The GPU run

*Where: local, GPU. Gate: after rank 1. Lane: none.*

**Rank 2. The run happened on 2026-09-17** (#624 to #630) and the row stays
open because the day does not reach the end yet. What it costs to get there is
now a known list rather than a guess: rank 1 above, and a walker that still
wanders onto a stair (#630). **What is still unanswered is the visual half** —
`twelve-at-vespers` with six in the Great Hall, the seven trusses from under
them (#527), and the luma read off the hall floor (#438). Rank 5 waits on
exactly those, and the beats that take them are written and in the file;
nothing reaches them.

Settled by the run and not open any more: the compressed textures (#507) look
right on a real GPU, the three flights to a tower roof at 12 m are walkable
(#523), and the gaol roll reads on the barrel-head (#571).

**Rank 3 shipped the same day, and not from the shot this spec meant** (#634,
#635). The old board preview and og card in `tools-and-games` were from before
Phase 3: they showed the archway wide open in a 7x7 courtyard that no longer
exists, with none of the HUD the game has now (#374, #379). The obvious
replacement, `twelve-at-vespers`, does not exist — the run stops short of it —
so Devon chose a fallback frame instead of holding the row open behind rank 2
a second time: `08-the-chapel-at-prime.png`, three of the twelve mid-dialogue,
HUD and journal chrome included. The new preview and og card live in this
repo, `assets/og/`, not in `tools-and-games`: `index.html`'s `og:image` and
`twitter:image` point at this repo's own GitHub Pages URL now. Revisit the
source once rank 2 reaches Vespers; nothing about where the images live or how
they were built is specific to this frame.

## A second day

*Where: 4a container, 4c local. Gate: none; 4c gates rank 9. Lanes: A (4a), B (4c). 4b shipped.*

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

**The fact that changes shipped on 2026-09-17** (#646 to #649), which is the
third of the three threads the lore row left here when it closed (#596): a
`since` field on a fact in `data/lore.json`, a third `performances` pool that
says the changed fact out loud in the guardroom at Lauds, and a validator that
refuses the two halves to drift. It is the first thing in this game whose
content, and not only whose line set, turns on what the player found. It
touched no lane-A file.

**Two threads are left and both wait on something.** The missing 128 sheets
are in Thomas Wykes's yard, which nobody has placed on the ground the town
side laid (#541 to #546). A schedule with more than one watch still has to
argue with #533 rather than work around it. Both of them have somewhere to
put "the player found this out" now, which neither had before. `SPECS.md`
specs what is left.

## The hall covering

*Where: local, GPU. Gate: after rank 2. Lane: B.*

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

*Where: container. Gate: none. Lanes: C and D.*

**Rank 6, and a 2+. The first increment shipped on 2026-09-17** (#616 to
#618): `data/populace.json` is ten people with no clue, no lie and no line,
`src/populace.js` is their validator and the engine that turns their rings,
and nine activities resolve to three clips the kit already ships, so nothing
here waited on an asset. A routine is a LOOP per bell rather than one station
per bell (#547, answer 3), and the validator asks the twelve's own five
questions — floor, room, 1.5 m clearance, reachable, a walk from the last
bell — plus every leg of the ring and the wrap back to its first stop.
`test/mystery.mjs` owns it (#529) and rejects thirteen breaks; the page runs
the same validator and throws rather than warns.

**What is left is the other forty and everything that needs a clip.** The
ambient talk (`data/npcs.json`'s chatter pool, once two bodies are within 3 m
at one bell), children and dogs, the knights actually training rather than
standing with a sword, and the instanced-mesh and animation-LOD cost fifty
bodies will have that ten do not — which rank 12a's budget suite is now
there to price. `WISHLIST.md` theme 1 is the source for all of it. **Rank
10's bodies is the row that unblocks the clips**: `sweep`, `stir`, `hammer`
and `spar` are deferred until something ships a clip for them.

## Sound: a soundscape

*Where: container to write it, local with speakers to judge it. Gate: none. Lane: E.*

**Rank 7. The ambient beds shipped on 2026-09-17** (#620 to #623). Seven
room tones, all synthesised (#519, #548): ward, wall walk, kitchen, hall,
chapel, chamber and tower, each a few layers of filtered noise that swell on
their own slow sines, a two-note drone under the chapel tuned to the bell, and
a random crackle in the kitchen and the bakehouse. `data/sounds.json`'s
`ambient` block is the only place they are tuned. `bedOf` resolves a zone by
its id first and a drum room's storey second, with no default, and
`test/layout.mjs` check 13 sweeps every walkable cell through `roomAt` to hold
43 zones to a bed. The cross-fade is 1.2 s on the HUD's own room change
(#515), and a bed is built when entered and torn down when faded.

**What is left, in order.** First, somebody with speakers listens (#53):
every number in the block is a guess and the file says so. Then a bed at a
point per room through a panner, the way the bell already is, so the kitchen
is heard from the ward outside its door rather than switching on at the
threshold. Then the four bells given a character each, which is a `partials`
and `gain` change to the existing `bell` block. Event sounds still wait on
rank 6's activity clips. Recorded CC0 audio is admitted since #548, named by
`data/sounds.json` and run through `tools/encode-assets.mjs` like any asset
(#506), and none has been looked for.

## Side quests

*Where: container. Gate: none, but two of the seven errands want rank 6. Lane: A.*

**Rank 8, and a 2+. Four increments shipped on 2026-09-17** (#576 to #581,
#595, #597 to #599, #612 to #615): the format, the set validator and the
cook's missing knife; then the journal's tab; then four more errands; then
reputation by ward.
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

**Reputation by ward shipped fourth** (#612 to #615): `outer` and `inner`,
two counters the save carries at version 6, one moved per errand finished in
that ward. `migrate` counts what a version-5 save had already finished rather
than writing zeroes, and `repair` clamps each to the errands that ward has.
Two things read them and nothing else does: a line on the **end** of whatever
anybody in that ward says, off `data/npcs.json`'s new `reputation` block, and
one line under the verdict in the epilogue pane, with nothing at all shown to
a player who ran no errand. Not a state, not on a press, not on the morning
after. `validateQuestSet` holds every threshold to an errand that exists to be
finished, which is the rule worth having: an unreachable one is silent in the
game and looks exactly like a line not yet earned.

**What is left.** The seven of `WISHLIST.md`'s dozen still unwritten: three it
named, of which two want rank 6's populace (a child's dog, the porter's boy
who wants his letters) and one does not (a letter for the town that needs a
gate pass), and four it never named. `SPECS.md` specs the next increment.

## A castle to get lost in

*Where: container. Gate: after rank 4c's yard. Lane: B.*

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

*Where: local, a network that reaches the asset hosts. Gate: none. Lane: C.*

**Rank 10.** Every row above this one that needs a new body is waiting on
this one. Low-poly, one shared rig, CC0, for now (#550, question 5): a body a
session can make or edit as a drop-in, the way the fourth body (rank 1,
shipped, #603) answered it once for a woman's body and this row answers at the
scale of a child, a dog, a chicken and a garrison. Variation without files —
tint, height scale, a hidden hood or hat node, a held prop, a beard toggle —
is `npc.js`'s existing hide-node and hide-material machinery, not new code.
Every body goes through `tools/encode-assets.mjs` before it is committed
(#506); an uncompressed body is the one asset nothing else on this list would
catch.

**The child and the hound shipped on 2026-09-17** (#643 to #645). The child is
not a rig: she is `Woman.glb` at 1.15 m with her head bone a third larger,
running between her stops, three data fields `npc.js` did not have before. The
hound is a fifth file, Quaternius's Husky as `assets/NPCs/Hound.glb`, 0.63 MB
meshopted, with a `follow` that brings it to heel along the grid. What is left
of the row is a chicken, which neither Quaternius pack ships as glTF, and the
garrison's spears, which no pack on disk has; and the look at both on a GPU
that `npm run play` owes (#53).

## Feel

*Where: container to the Node line, local GPU past it. Gate: after rank 2. Lane: D.*

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

## The tooling

*Where: container. Gate: none. Lane: C (12c). 12a had no lane and 12b held lane
B; both are done.*

**Rank 12, and a 2+. The placement editor shipped on 2026-09-17** (#583 to
#587). `?edit=1` on the dev server mounts a panel that reads the tile under
the player's feet as they walk and, on **P**, writes the row into
`data/scene-config.json` — `interiorProps`, `builtProps` or `braziers`, with
the models and materials the config already names. It does not commit; the
diff is for a person. The write is a text splice and not a re-serialise,
because `JSON.stringify(JSON.parse(raw), null, 2)` over that file is not that
file: 94212 bytes go out as 98330 and `"intensity": 2.0` comes back as `2`
(#584). `test/tools.mjs` holds it to byte-exactness by cutting the new row
back out and comparing the whole file, over an LF copy and a CRLF copy of the
real file on either machine: the splice takes its newline from the file it is
splicing into, because a hardcoded `\n` rewrote the one existing line ending
the splice has to put back and made `npm test` red on Windows and green in CI
for as long as the rail existed (#631 to #633).

Dev-only is two independent halves — `import.meta.env.DEV` around the import,
`apply: 'serve'` on the plugin — and neither is trusted: `test/built.mjs`
greps every shipped file for the module's sentinel, because the served-set
diff cannot see a module that neither page ever asks for (#586).

**The budget suite shipped the same day** (#607 to #611). `test/budget.mjs` is the
thirteenth suite: three counts per ward against three ceilings held as named
constants with a comment saying they are guesses. **965 draw calls in the outer
ward and 643 in the inner against 1200; three point lights, all outer, against
6 and 8; a peak of 7 skinned bodies in the outer ward against 20 per ward and
32 in the cast.** The draw-call count calls `castle-builder.js`'s own
`buildPiece` and counts the meshes it really returns rather than deriving them,
because a suite that re-derives a number agrees with itself (#34, #500). **The
finding: 970 of the castle's 1539 meshes, 63 % of everything it draws, is the
eight tower drums.** Rank 10's fifty bodies fit neither skinned ceiling, which
is the answer the row was taken to produce.

**Move-and-delete shipped the same day** (#636 to #642). The panel lists every
row within six tiles of the player, nearest first, rebuilt as they walk; `M`
writes the selected one to the tile they are standing on and `Delete` twice
inside four seconds cuts it out. A row's span is walked for and not searched
for, because three of the file's 31 placeable rows are not what `formatRow`
would write — `indexOf` on those returns -1 and edits nothing — and an exact
twin, which the editor can make in two key presses, would resolve to the first
of the pair. `test/tools.mjs` went from 47 assertions to 179, and the headline
is that **an insert and a delete of the same row give back the file byte for
byte**, on both endings, for all three arrays. `/__place` takes three verbs now
and checks each one's row count before it writes.

**What is left is the dialogue format.** `SPECS.md` specs it, in the sense that
it deliberately does not: `WISHLIST.md`'s paragraph is the brief.

