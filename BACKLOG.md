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
whether a covered hall goes dark. **The covering shipped on 2026-09-17**
(#656 to #658): seven `roof.glb` pieces, rendered and read rather than
guessed at, and a floor bright enough at Vespers to leave the two windows
uncut.

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
**Rank 4 has since shipped whole** (#699 to #707): the bells call and the yard.

**The texture sets and the town side shipped on 2026-09-16** (#541 to #546):
`ktx` was on PATH and Poly Haven answered this time, so both rows that #518
had blocked came due together. Five materials over four roles — a dressed
ashlar for the inner ward, a red brick for the four inner drums, a plaster for
the two walls that exist only at level 1, and a deck plank for the eight tower
first floors — plus a sixth, `forest_ground_06`, restored out of this repo's
own history to texture the ground west of the barbican, with a road and four
trees. `dist/` grew by about 17 MB against 200. Increment 3's town half is
unblocked, and the yard that had to stand on this ground before rank 9's town
could start went in on 2026-09-19 (#703 to #707). The bells question #533 raised shipped
the same day (#699 to #702), and rank 4 retired whole with it.

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
says, and one line under the verdict. **The seven errands left of the dozen
shipped on 2026-09-18 and closed the row** (#691 to #695): one voice each on
the seven people who had none, so every person the day one schedule puts in
the castle now has an errand, and `validateQuestSet` gained a sixth rule to
stop one of them parking the Constable out of the lines that pose `{ACCUSE}`.

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
in that room at that bell. **The lore row is closed and gone from this file**:
the one thing left in it, a `since` field for a fact that changes, went to rank
4's spec as its own open call recommended, and every row below it moved up one.
It held rank 8 on the day it closed and a different row holds that number now,
which is why it is named here by title (#522).
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
every file to a `ward`. **The last seven shipped on 2026-09-18** (#691 to
#695) and the row closed with them: the Steward's slate, the Constable's song,
the Clerk's inherited six years, the porter's pass, Nest's windlass, Madoc's
forge and a mason's mark on a block in a town yard. Twelve files, seven outer
and five inner, and the walk that proves the journal is identical without them
grew with the set.

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

**Seven ranked rows, numbered 1 to 11 with gaps. There were six until
2026-09-21, when Devon asked for a way to see the whole floor plan and rank 1
was opened for it (#729 to #733); the count above this line said seven while
the table held six, and it is corrected here. Nothing is claimed, and
lanes B and C are free**: the byte-exactness rail merged as PR #40 (#631 to
#633) and 12b's move-and-delete after it (#636 to #642), 4c built Wykes's yard
on 2026-09-19 (#703 to #707) and left lane B free again with **rank 9's gate
open**, and 12c retired rank 12 whole on 2026-09-18 (#687 to #690). The
**first** rank 1 shipped
on 2026-09-17 and **the numbers under it were not shifted up** (#619):
`SPECS.md` and `ROADMAP.md` already name every row by title as well as by
rank, for exactly this reason (#522), and four wave A sessions were running
the day it closed — renumbering eleven rows across three files would have put
a conflict in every line of every table, which is the reason rank 1's own
session gave for leaving the row in. A rank is retired, not reused, the way a
decision number is (#491). Ranks 2, 3 and 5 still need a machine this one is
not: all three want a GPU (#518). **Rank 4 shipped whole and is retired**: the gaol roll (#571 to #575), then
the bells call (#699 to #702) and the yard (#703 to #707). Of ranks 6 to 12, the ones whose next increment is data and
validators rather than a render (6 and 12, and 8 until it closed) are the ones
a container can start; 7, 10 and 11 all want either a recorded sound, a body on disk, or a GPU
before their first increment closes, and 9 has nothing left in it that does
not wait on rank 4's yard. **Rank 8 shipped four increments on 2026-09-17 and
closed on 2026-09-18; rank 12 shipped two** — rank 8's first errand, the
journal's tab, four more errands (#597 to #599), reputation by ward (#612 to
#615) and then the seven that finished the dozen (#691 to #695), rank 12's
placement editor and then its budget suite (#607 to #611).
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

**It ran four more times on 2026-09-19** (#708 to #715), and the looking is
done. The twelve at Vespers, the Lauds sky, the covered hall and eleven of the
twelve bodies at interact range were all photographed and written up, one
sentence per body. **Two of the twelve do not read as two** (#711): the
Constable and the Steward are one white-haired man in a black tunic, told
apart by a red collar and a green one, and past three metres there is nothing
to tell. The three women are the clearest bodies in the castle, which is the
argument for silhouette over tint made by a photograph rather than by a
paragraph. The Lauds sky (#533) has its own number — 151.2 of 255 against
Prime's 203.4 — and no dawn colour in it.

**Not settled, and rank 2 stays open for it.** The day still does not run end
to end. Two of the three stops were this suite lying to itself and are fixed
(#708, #709); the third is rank 1's walker (#710), and it stopped at #630's
own recorded coordinate. Nobody has put a thumb on a phone (#530); that half
is untouched and is still the feel, and it is now the whole of rank 2's
unlooked-at list.

**The third stop is fixed now, on Node terms** (#716 to #720, 2026-09-19).
`test/route.mjs` is new: a same-storey walk now searches that storey's own
floor, so a route can no longer take a flight for a short cut, and a cell a
0.45 m body does not fit in costs five cells rather than one, so the same fix
stops the route hugging the two walls a prop stands against
(`foundation-stone` and `barrels-91`). `test/layout.mjs`'s new check 8b holds
it over all 66 pairs of the 12 ground rooms: 153 ok, 0 fail. **Watched carry a
real `npm run play` past the second bell on 2026-09-21** (#734), the proof
rank 2 owed. **Rank 1 is done, its section is gone from this file and from
`SPECS.md`, and its number is retired.**

**Both failures behind the red `plan-vs-scene` are found and fixed, unranked.
The row shipped as PR #58, merged to `main`** (#721 to #724). The chapel-candles failure was never
the bell: ringing it sends twelve bodies walking, and the Constable's Prime
station is 0.92 m from the candles, so from the nearest of the twelve measured
cells he stands 0.52 m away and 62 degrees off the aim, and nearest-wins ranking
hands the player his prompt instead (#721). `src/interaction.js` now takes a
second slot per list — nearest inside an 18.2-degree aim cone, then nearest at
all (#722). Measured over four watches and 12371 (cell, target) pairs,
nearest-wins offered what the player was aimed at 6667 times against the aim
rule's 11521: 2834 pairs fixed, 48 broken, none of the 48 a lock. The same
change fixes the chapel's body-and-pouch swap (#722): `examine` aims at the
body and the pouch is nearer, and the six cells that used to hand back the
pouch now hand back the body, 6 of 6. The failure message itself was lying —
it printed the sweep's twelfth cell under the first cell's name — and now
prints every cell it tried, nearest first (#723).

The populace beat's baker-at-Prime failure — 0.408 m off on the merge of PR
#47, 0.055 m off on rank 1's branch — does not reproduce on the dev machine, 6
of 6 green. It is a wall clock, not a tolerance: `DWELL` is 9 s and the first
ring leaves its stop 4.5 s after placement, which a slow CI runner crosses and
this machine does not. `test/plan-vs-scene.mjs` now parks the rings with
`window.__populace.setWatch(watch, { walk: false })` before the read and keeps
`TOL` at 0.01 m (#724). Driven by hand with 15 s of supplied time and the park
skipped, 7 of 13 bodies failed, worst 11.000 m off; restored, the beat holds at
0.01 m at 15 s and again at 45 s.

**`npm test` is 15 of 15 locally and `npm run build` is clean. CI on the PR is
green** — build and the fifteen suites pass, 12m50s, run 35547097670 — and the
populace half of this fix was confirmed only there: the baker-at-Prime
failure never reproduced on the dev machine, so that CI run is the only place
it has ever been exercised. A finding and not a fix: nothing stops a station
standing on top of a prop — the Chaplain 0.20 m from the gravestone at every
watch, the Constable 0.92 m from the chapel candles at Prime — and `SPECS.md`
carries a recommended `PROP_CLEARANCE = 1.0 m` for whoever takes that row.

**And the run found the thing it exists to find**, which was a castle you
could not walk in after opening the journal: a bug in `src/`, not in the suite,
and nothing but a hand on a keyboard was ever going to see it. **It shipped as
rank 1 on 2026-09-18** (#659 to #661). `src/ui.js` owns the pointer now, one
place letting it go and one taking it back, a dialogue is on that list so its
Present button can be clicked by a real mouse, and a relock the browser refuses
puts the resume panel up instead of leaving the player nowhere. The fourteenth
suite, `test/overlays.mjs`, holds all of it headlessly, because pointer lock
turned out not to be a GPU question at all — two comments that said it was are
corrected (#659). **Rank 1 is done, its section is gone from this file and from
`SPECS.md`, and its number is retired.**

**Rank 3 shipped the same day anyway** (#634, #635): asked to choose between
holding the row for a second run or a fallback frame, Devon took the fallback.
The new preview and og card are built from the chapel-at-Prime shot rather
than the Vespers hall the spec wanted, and they live in this repo's
`assets/og/` now rather than in `tools-and-games`. **Rank 3 is done, gone from
the ranked table above, and its own scope is gone from `SPECS.md`**; what it
shared with rank 2 stays in "The GPU run" section below, rewritten to say
what shipped.

**Rank 6's second increment shipped on 2026-09-20** (#729 to #733): five more
people take `data/populace.json` to 19 and the page to 32 bodies built, 13
cast plus 19 populace, exactly `MAX_SKINNED_TOTAL`, and a flat `talk` list of
three pairs is played through the `#caption` band by a rail in
`src/populace.js` and `src/quest-manager.js`. `test/budget.mjs` now counts
the household. **Rank 6 is still open**: the rest of the fifty waits on rank
9's town, the four activities without a clip wait on rank 10, and the
twelve's 27-pair chatter pool is still unspent by proximity.

**Rank 2's third sitting ran on 2026-09-21, twice** (#734 to #741). Run one,
the suite as merged, confirmed the walker on a GPU and got past the second
bell for the first time: 164 ok, 19 failures, aborted at the Constable at
Vespers. Six fixes to `test/play-castle.mjs` (#735 to #740) then carried run
two to the accusation for the first time: 179 ok, 17 failures, and it aborted
on the wrong ending's `#restart-button`. **The day still does not run end to
end**, and this time the cause is in `src/`: `interaction.js`'s sight rays
are cast at fixed world heights, so the sentry and the porter go untalked-to
from beside them on their own storey, and the porter's admission is a premise
of the ending. Filed as the new rank 1, "Sight at the body's own height."
**Rank 2 stays open, gated on it.**

**The retro castle was specified and ranked on 2026-09-21** (#742 to #744),
from Devon's brief of the same day: the castle reads as the same everywhere,
and he wants pixel-art textures the repo draws itself, for variety room to
room and for a retro look. That reverses #411, the choice that put
photographic stone on the walls, and it is the third time this one question
has been decided. Measured first: the fifteen Poly Haven material sets hold
44.2 MB of the castle's 79.3 MB of texture memory by their own KTX2 headers
(an estimate that lands on #506's measured number to the decimal), 22 of 46
wall runs are one slate and 18 of 32 floors are two planks, and the Kenney
kit beside them is 64 px unlit pixel art already. **Rank 3, lane B, a 2+**:
the first increment is a generator, its rails, fifteen 128 px textures under
`assets/pixel/` in place of the fifteen sets, and a fourth count in
`test/budget.mjs` for texture memory, all of it a container's; then a look
on a GPU (#53) before variety per room.

**The first increment shipped the same day** (#757 to #766): fifteen
textures the repo draws replace the fifteen Poly Haven sets (45 files, 23.9
MB gone), `data/scene-config.json`'s `materials` became `pixelMaterials`,
the kit is relit behind `RELIGHT_KIT` now that every Kenney GLB was read and
confirmed to declare `KHR_materials_unlit`, and `test/assets.mjs` and
`test/budget.mjs` gained the five rails and the fourth count the spec asked
for. Texture memory: **80.8 MB before, 37.9 MB after, over 70 images**; 79.3
of the 80.8 is the `.ktx2` alone, matching #506's live measurement to the
decimal. `npm test` fifteen of fifteen, `npm run build` clean, `dist/` 52.8
to 28.9 MB. **Increment 2 waits on the look** (#53): nobody has seen the
castle in pixel art or the kit relit yet.

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
  not confirmed. Ranks 3, 4, 5, and rank 11 past its Node line.
- **Local: net.** Needs a network that reaches the asset hosts. Not a GPU
  question and not the same block: #518's container could not reach Poly
  Haven and #541's could; #568's could not reach quaternius.com. Ranks 1 and
  10.
- **Local: audio.** Needs speakers and a person. Rank 7 only, and only for the
  judgement — the assignment and the cross-fade are a container's.

**Gate.** What must have shipped before the row can start. **There were four
hard gates on the whole list; two of them turned out to be softer than
written down.** Ranks 3 and 5 both named "rank 2" as their gate when what they
actually needed was *a render*, not specifically the one `npm run play`'s day
would have produced, and both shipped on 2026-09-17 without rank 2 reaching
the end of its day (#634, #635, #656 to #658). The lesson, for the two gates
still standing: name the render a row needs, not the row that happens to
produce one.

1. ~~Rank 2 before rank 3.~~ Shipped from a fallback frame instead (#634,
   #635).
2. ~~Rank 2 before rank 5.~~ Shipped by rendering the hall directly instead
   (#656 to #658).
3. **Rank 3 before rank 11 ships past its Node acceptance.** The row's own
   spec says nothing in it goes past a `snap` and a sentence until the run has
   happened.
4. ~~Rank 4c before rank 9's town.~~ **Open since 2026-09-19** (#703 to
   #707). Thomas Wykes's yard stands on that ground, passes every plan check,
   and reads as a building from the North-west Tower's roof. Rank 9 starts
   from its town wall, its `ward: "outside"` room rule and its map frame.

Three softer ones are worth naming and are not gates: rank 6's populace
unlocked rank 7's event sounds when its first ten shipped (#616) and was
named as unlocking two of rank 8's errands, which in the end it did not have
to: both kept their idea and dropped the body they wanted (#692), rank 10 and
rank 6 trade activity clips both ways, and rank 12's budget suite was more
useful once there were more bodies to count. None of the three blocked a start,
and the budget suite went first anyway (#609) — a ceiling on a castle with
twelve bodies in it is still the ceiling rank 6's ten are spent against.

**Lane.** The file that two sessions would collide on. **One row per lane at a
time** (#602); rows in different lanes, or with no lane, may be claimed
together.

| Lane | The file that decides it | Rows |
| --- | --- | --- |
| A | `src/save.js` — the version number and `migrate` | 1 (4a, 4b and 8 are done) |
| B | `data/scene-config.json` — and `test/tools.mjs`'s byte-exactness rail | 4, 13 (increments 2 and 3 only), 9 (4c, 5 and 12b are done) |
| C | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | 6, 10 (12c is done) |
| D | `src/main.js`'s player rig and spawn | 1, 6, 11 |
| E | `src/audio.js` and `data/sounds.json` | 7 |

Lane D is three rows deep now, all writing `src/main.js` in different
regions: rank 1's second start callback and its UI-flow lines, rank 6's
populace rig work, and rank 11's presence cues. Different regions of one
file still merge, the way lane C's did for ranks 8 and 12c, but one row per
lane at a time is the rule (#602) — rank 1 is not beside rank 6 or rank 11.

Lane A is the one the specs already warned about in words: **"do not run
alongside anything else that touches `save.js`"** is written into rank 4's
dependencies. Rank 8 was the other row in it and turned out never to need the
file at all: closing the dozen added seven quest files and no field, and both
ward counters are already clamped against whatever `data/quests/` holds, so
the ceilings rose on the next load with nothing written down twice (#691).
Lane C is the `cast` block specifically, not the whole of `data/npcs.json`.
Ranks 8 and 12c both wrote per-person `states` and `default` line arrays there,
which is a different region of the same file and merges, and both are closed.
**What 12c left behind is a standing obligation on whoever writes there next**:
every `dialogue` block in that file is also `dialogue/castle.dlg` now, and
`test/dialogue.mjs` fails if the two disagree, so a row that adds a state or
rewords a line runs `npm run dialogue:extract` before it commits (#687).

Rank 4 splits three ways because its remaining threads do, and the spec
already names them separately: **4a** is the bells-on-day-two design call and
`day2.watches` (#699 to #702), **4b** is the `since` field on a fact that
changes (#596), and **4c** was Thomas Wykes's yard (#703 to #707). All three
shipped, and rank 4 retired whole on 2026-09-19. Rank 12 split the same way and for the
same reason: **12a** the budget suite (#607 to #611), **12b** move-and-delete
in the editor (#636 to #642), **12c** the dialogue format (#687 to #690).
All three shipped and **the row is retired**.

## The ranked table

**5, 8 and 12 are numbers that have left the list rather than gaps in it, 3
left on 2026-09-17 and came back on 2026-09-21 for the retro castle (#744),
and 1 is a number that keeps coming back.** Before 2026-09-21 it had been
used three times and retired three times: the fourth body on 2026-09-17 (#619); the castle you
cannot walk, which the GPU run opened the same day (#624 to #630) and which
shipped on 2026-09-18 (#659 to #661); and the walker on the stair, which the
second GPU sitting reopened the same way on 2026-09-19 (#710) and which
shipped, on Node terms, the same day (#716 to #720). That is the retirement
rule working as intended rather than against it: a rank is a priority and not
an id, so the number came back to the top of the list when something
belonged there, and went again when it was done. Rank 2, the GPU run, held
still at 2 through all three: it was never promoted to 1 in the gaps,
because each time the gap closed with a new thing to walk before it could.
Rank 3 shipped on 2026-09-17 from a fallback source rather than
the shot the spec asked for (#634, #635), and rank 5 the same day, by rendering
the hall directly rather than waiting on a second GPU run to reach Vespers
(#656 to #658). **Two rows left by finishing rather than by being retired
part-way, both on 2026-09-18**: rank 12, whose three increments shipped across
two days and whose last one, the dialogue format, closed it (#687 to #690);
and rank 8, when the last seven of `WISHLIST.md`'s dozen errands went in and
the theme ran out of rows rather than out of interest (#691 to #695). Every row
below is named by title in `SPECS.md` and `ROADMAP.md` as well as by rank,
which is what makes that survivable (#522).

**The number 1 was back a fourth time, on 2026-09-21, for the same reason as
the other three**: the third GPU sitting found the next thing rank 2 cannot
walk past, sight rays aimed at world heights instead of at the body. A
blocker of rank 2 ranks above it, and only one number does. That sentence is
about the sight-bug row, which the same day's later answers moved to rank 2:
Devon's answers to `WISHLIST.md`'s explore questions (#750 to #753) put the
walking day above it, because a first door into the game ranks above
everything behind it. **1 went to the walking day, and 3, which had come
back for the retro castle that same morning, became 4 the same day it
arrived** — a rank moving twice in one day is the same rule as a number
coming back four times, applied to the same 2026-09-21. The GPU run's own
gate follows it down, from "after 1" to "after 2", and rank 11's from "after
2" to "after 3". Ranks 6, 7, 9, 10 and 13 did not move. **A live claim on
the shifted row is not a reason to leave its number alone**: the retro
castle carried `claude/retro-castle-pixel-textures-kliakt` in its Claimed
column, merged to `main` while this band was being written, and it moves to
4 anyway. A rank is a priority and not an id (#619, #491), a shipped or
claimed row's number is a pointer the next renumbering session updates, and
#522 is the reason every row is named by title in `SPECS.md` and
`ROADMAP.md` as well as by rank — which is exactly what makes a claimed
row's renumbering survivable. The claiming session's own prose still says
"rank 3" and stays true as a dated record, the same as every earlier rank-1
reference in this file.

| Rank | Item | Size | Model | Where | Gate | Lane | Claimed | Detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Explore: the day before the death, the walking day as the main mode, Hywel alive and nobody waiting for a name: increment 1 shipped, the engine, the save and a placeholder walking day (#750 to #756, #767 to #770); the two doors, the real lines and the day itself are left | 2+ | Opus 5 | Container | — | A, D | claude/walking-day-before-death-8apcav | [Explore: the day before](SPECS.md#explore-the-day-before) |
| 2 | Sight at the body's own height: nobody upstairs can be talked to from beside them, and the porter on the walk can be from 8 m below | ¼ | Opus 5 | Container | — | — | | [Sight at the body's own height](SPECS.md#sight-at-the-bodys-own-height) |
| 3 | The GPU run: the looks are taken (#711 to #715); the walker holds on a GPU (#734, #736) and the third sitting reached the accusation with the wrong ending (#735 to #741) | 1 | Opus 5 | Local: GPU | **after 2** | — | | [The GPU run](SPECS.md#the-gpu-run) |
| 4 | The retro castle: increment 1 shipped, fifteen sets out and fifteen 128 px textures in (#757 to #766); the look, then variety per room, are left | 2+ | Opus 5 | Container to the look, local: GPU past it | — | B | | [The retro castle](SPECS.md#the-retro-castle-the-stone-in-the-castles-own-pixel-art) |
| 6 | Life: a populace: 32 of 32 bodies built and a talk rail (#616 to #618, #729 to #733); the town, the four clips and the chatter pool are left | 2+ | Opus 5 | Container | — | C, D | | [Life: a populace](SPECS.md#life-a-populace) |
| 7 | Sound: somebody listens to the seven beds, the four rings and the first two event sounds (a bed at a point and the rings, #680 to #683; the door and the hound, #696 to #698) | 1 | Fable 5.1 | Container, judged local: audio | — | E | | [Sound: a soundscape](SPECS.md#sound-a-soundscape) |
| 9 | A castle to get lost in: the town, the rock and river | 2+ | Opus 5 | Container | — (4c opened it) | B | | [A castle to get lost in](SPECS.md#a-castle-to-get-lost-in) |
| 10 | Bodies: a shared low-poly rig for the fifty (the child and the hound shipped, #643 to #645; two hens and the spear, #684 to #686) | 1 | Fable 5.1 | Local: net | — | C | | [Bodies](SPECS.md#bodies) |
| 11 | Feel: presence, fire, weather, a door that opens | 2+ | Sonnet 5 | Container to the Node line, local: GPU past it | **after 3** | D | shadow + hand shipped 2026-09-17 (#650 to #654) | [Feel](SPECS.md#feel) |
| 13 | The floor plan you can see: the review view shipped (#745 to #749); a way to redraw it is left | 2+ | Opus 5 | Container | — | B | increment 1 shipped 2026-09-21 (#745 to #749) | [The floor plan you can see](SPECS.md#the-floor-plan-you-can-see) |

**`ROADMAP.md` is these three columns turned into an order**: which row to
take first, what each one unblocks, and which ones two sessions may hold at
the same time. This table still ranks; that file sequences (#601).

## Explore: the day before

*Where: container. Gate: none. Lanes: A, D.*

**Rank 1, and a 2+. Claimed on `claude/walking-day-before-death-8apcav`,
2026-09-21. Increment 1 shipped the same day.** `WISHLIST.md` theme 8 put four
questions to Devon the day it was written and he answered all four the same
day (#750 to #753), overturning the theme's own recommendation on two of them:
the walking day is the main mode, "Walk the castle" the first door into the
game with the mystery behind it, and it is the day before the death — Hywel
alive and speakable, no body, no lantern, no cloak, no summons, none of the
twelve saying a word of their day-one testimony. The first increment the
theme already specced to `SPECS.md`'s depth — a stage `explore`, the mode
threaded through `src/mystery.js` and `src/quest-manager.js`, a second start
button, and four rails — did not cover what was answered, and the day-before
content is priced as its own row the size of Phases 6 and 7 together.
**`SPECS.md`'s section landed on 2026-09-21** (#754 to #756), four increments
deep with ten open calls answered, so every increment after it is class S: the
engine, the save and a placeholder walking day, then the two doors, then the
lines, then the day itself. Two things it settled against the theme's own
pricing. **The save stays at version 6** (#754): the walking day is `day: 0`
on the field that already says which day a save is on, so there is no `mode`
field and nothing for `migrate` to do, and the row holds lane A for
`repair`'s clamp rather than for a bump. And **the mystery's door is a
method as well as a button** (#755): `plan-vs-scene` and `map` never click
`#start-button` at all, so `QuestManager.enterMystery()` is what they call.
The fourteenth body takes `test/budget.mjs`'s ceiling from 32 to 33 (#756,
#611). **A soft order, not a gate**: rank 2's
sight-at-height bug bites hardest in a day that is nothing but walking up to
people, so this row's own GPU look wants rank 2 fixed first, though nothing
here waits on it and the Gate cell stays "—". **Does not collide with rank
4, the retro castle**: this row is lanes A and D, the retro castle is lane
B, and #602 lets different lanes run at once, so both may be claimed
together. The spec keeps it that way on purpose: the walking day's four
bells borrow the four hours' skies through an alias in
`data/mystery.json` rather than copying four blocks into
`data/scene-config.json`, which would have put this row in lane B as well.

**Increment 1 shipped 2026-09-21** (#767 to #770): the `day0` block, the
fourteenth cast entry, and the engine, save and validator rails that make the
walking day a day the mystery can stand on, with a placeholder schedule
(day one's own, copied) and one stub line per speaker. `npm test` 15 of 15.
Two findings the increment's own commits made: the door out of the walking
day (`window.__quest.enterMystery()`) had to move into `test/plan-vs-scene.mjs`,
`test/overlays.mjs` and `test/touch.mjs` a whole increment early, because
`start: explore` puts those suites on the wrong day the moment it lands; and
`test/play-castle.mjs` is untouched, so **`npm run play` is broken until
increment 2 gives it the same door**, which blocks rank 3, the GPU run, until
then. **Increments 2, 3 and 4 are open**: the two doors and everything that
says what the game is; the fourteen real `day0` line sets; and the day-before
content itself, the size of Phases 6 and 7 together.

## Sight at the body's own height

*Where: container. Gate: none. Lane: none.*

**Rank 2, filed 2026-09-21 from the third GPU sitting's second run.**
`src/interaction.js` casts its two sight rays at world y 1.55 and 1.15 (line
34, used at line 210) instead of at heights on the body, and measures range
with `to.y = 0` (line 151). So a body on an upper storey is aimed at through
his own floor: the sentry on the north walk at Terce, 0.2 m from the player
on the same walk, pointer locked, prompt null; the porter on the cross-wall
walk at Vespers, 0.6 m, prompt null. And the porter was talkable from the
ground 8 m under him, which is how run 1 passed his beat. His admission is a
premise of the full ending, so the accusation selected 2 of 3 and the run
aborted at the second-day button.

**Props were never affected.** Every lock, bell, piece of evidence and
readable carries a `focus` at its plan-box centre, and line 210 aims at that;
the Stockhouse bar and the tally stick passed on the walk at 1.75 m and
2.81 m in the same run. The Lady in the royal apartments at Prime, Terce and
Vespers is the third person it bites, and the populace's archers, serjeant,
man-at-arms and maid upstairs are labels that never show.

**The fix is about fifteen lines**: aim at feet plus 1.55 and 1.15, gate NPC
targets to within 2.0 m of the player's own feet, and make `nav.talkable`
ask the station's own storey. The proof is a `plan-vs-scene.mjs` beat over
the six upstairs station-watches (talked to from their own storey, not from
the one below) and two `mystery.mjs` rails; `SPECS.md` has the breaks.
**Rank 3 is gated on it.** Apart from #714's five stale checks and #659's
journal number, it is what stands between `npm run play` and exit 0.

## The GPU run

*Where: local, GPU. Gate: rank 2, sight at the body's own height. Lane: none.*

**Rank 3. It ran again on 2026-09-21, twice** (#734 to #741), and this is the
first sitting to get past the second bell. Run one, the suite as merged: 164
ok, 19 failures, aborted at the Constable at Vespers, and it confirmed rank
1's walker on a GPU for the first time, carrying the day through Sext, the
reload, the riddle, the third ring and the cook's walk. Six fixes to
`test/play-castle.mjs` (#735 to #740) then carried run two to the
accusation for the first time: 179 ok, 17 failures, and it aborted on the
wrong ending's `#restart-button`. **What stopped it is a new bug in
`src/interaction.js`**, filed as rank 1, "Sight at the body's own height":
the sentry and the porter were read from the wrong world height and went
untalked-to, and the porter's admission is a premise of the ending. **This
row is gated on that one now.**

**The looks were taken the way rank 5 took its two** (#656 to #658):
`applyWatch(watch, { walk: false })` puts the world at a bell with nobody
walking, the camera goes where it needs to be, and the shutter goes. That is a
hand-run look, it is not committed, and it is not a substitute for the run —
it is how a render question gets answered while a movement question is still
open.

**Settled and closed.** The compressed textures (#507), the three flights to a
tower roof at 12 m (#523), the gaol roll on the barrel-head (#571). And now:
whether twelve read as twelve — **no, two of them do not** (#711), the
Constable and the Steward being one white-haired man in a red collar and a
green one; the Lauds sky (#712), which has its own number, 151.2 of 255
against Prime's 203.4, and no dawn colour in it; and the covered hall (#713),
whose seven trusses are invisible from the floor and which shows a sliver of
sky at its south-east corner.

**Three things came out of it that are nobody's row yet** and are written up
in `HISTORY.md` rather than here, because none of them is big enough to rank
and all three are one-line fixes: `Press E to talk to the Sir Roger Lestrange`
on every NPC in the game (#715), five checks in `test/play-castle.mjs` that are
stale or vacuous including one that can only fail on a GPU (#714), and a
journal walk assertion that read 0.69, 1.30, 0.51, 0.69 and 0.83 m across five
runs of the same beat, against 3.75 m for an unobstructed walk on the same
machine. **The five checks and the journal number are both still unchanged in
the third sitting** (#734, #741): all five checks read the same, and the
0.83 m is the third sitting's own reading. All three are still open. A fourth
thing this same sitting turned up, the chapel's body-and-pouch swap named in
"Where things stand" above, is not: #722 fixed it, and the third sitting
confirmed the fix on a GPU (#734) by its absence from run one's 19 failures.

**A fourth thing came out of rank 1 and is nobody's row either** (#718).
Route pricing a tight cell found two props standing inside a 0.45 m body's
width of stone: `foundation-stone` leaves 0.60 m against the cross-wall at
(-2.6, 4.0), and `barrels-91` leaves 0.52 m inside the North-west Tower's
door. The router goes around both now and does not depend on either being
moved; moving the props themselves is a small row nobody has taken.

**Two of the four second-sitting runs were stopped by this suite, not by the
castle** (#708, #709), and both fixes are in `test/play-castle.mjs`:
`present()` never shut the dialogue it opened, and nothing clicked the resume
panel that #661 puts up when the browser refuses a relock. Both had been read
as `src/` bugs before.

**And neither fix made a single assertion pass.** Run one and run four have
byte-identical failure lists, 22 apiece. What changed is underneath them: in
run one the player stopped at the merchant and never moved again, five beats
giving up from one coordinate with `locked false`; in run four he walks to
every one of them and comes up short, `locked true` throughout, the sentry at
1.1 m instead of 18.9. The beats fail either way and they now fail for rank
1's reason, which is the only one still open.

**The third sitting's six fixes, unlike the second sitting's two, did move
assertions** (#735 to #740): `shutPresent()` closes the Present list and the
dialogue on every path out of `present()`, not only the success path; a walk
to another storey now uses Phase 5's own stair legs instead of counting a
waypoint reached by x and z alone; `examine()` passes the target's own level
instead of always 0; `walkTo` turns to face a target before reading its
prompt; the Constable-visible check walks to range before it casts; and
`snap('twelve-at-vespers')` routes to the hall before it shoots, so run one's
"Great Hall floor at Vespers" luma of 40.1 turns out to have been a wall
(#147) and run two reads 72.7 of 255 from the hall itself. Run two, with all
six in, reached the accusation for the first time and found the row's real
blocker: `src/interaction.js`'s sight rays, filed as rank 1 (#741).

**Rank 5 shipped the same day, without waiting for a second run** (#656 to
#658). The gate below named this row's blocker as "the visual half" of rank
2, but the two things rank 5 actually needed — which way a kit roof piece
slopes, and whether the covered hall reads as dark — turned out to be
answerable by rendering the hall directly (`window.__quest.applyWatch`
puts the world at Vespers without ringing three bells) rather than by
waiting on `npm run play` to walk there. `roof.glb` turned out to be a whole
ridge-and-both-slopes cross-section rather than the single-pitch piece
`SPECS.md` guessed at, so the covering is seven pieces, not fourteen. The
floor read 69.8 to 89.8 of 255 across the hall's length, well clear of the
~25 line; no second brazier or window cut.

**Rank 3 shipped the same day, and not from the shot this spec meant** (#634,
#635). The old board preview and og card in `tools-and-games` were from before
Phase 3: they showed the archway wide open in a 7x7 courtyard that no longer
exists, with none of the HUD the game has now (#374, #379). The obvious
replacement, `twelve-at-vespers`, does not exist — the run stops short of it —
so Devon chose a fallback frame instead of holding the row open behind rank 2
a second time: `08-the-chapel-at-prime.png`, three of the twelve mid-dialogue,
HUD and journal chrome included. The new preview and og card live in this
repo, `assets/og/`, not in `tools-and-games`: `index.html`'s `og:image` and
`twitter:image` point at this repo's own GitHub Pages URL now. **A Vespers
frame exists now** — `shots/look/02-twelve-at-vespers.png`, 2026-09-19 — and
it is not obviously the better card: the hall at Vespers is a dark room with
two legible bodies in it and a black north wall, against a chapel frame with
three people and the HUD. Revisit it if somebody wants to; nothing about where
the images live or how they were built is specific to either frame.

## The retro castle

*Where: container to the look, local GPU past it. Gate: none. Lane: B.*

**Rank 4, and a 2+. The first increment shipped on 2026-09-21** (#757 to
#766). Devon's brief of the same day, and the reversal of #411 (#742): the
walls are built geometry carrying pixel-art textures this repo draws with a
program of its own, not Poly Haven's photographs, and not an image model's
output either (#743). The first increment was the whole swap for built
geometry, so the castle is one look on one GPU sitting: a generator under
`tools/pixel/` whose fifteen rows render to `assets/pixel/`, one 128 px PNG
per material name the config already had, so not a run, a room or a
`byMaterial` row moved; the fifteen Poly Haven set folders deleted, 45 files,
23.9 MB on disk; `materials` became `pixelMaterials` and `loadPBRMaterial`
became `loadPixelMaterial`, a diffuse-only lit material, which is the kit's
own model with the sun put back on it — every Kenney GLB read does declare
`KHR_materials_unlit`, so the relight behind `RELIGHT_KIT` was the right call
rather than an assumption; five rails went into `test/assets.mjs` (size,
palette, wrap, one map, pixel-identical to the generator) and a fourth count
into `test/budget.mjs`, `MAX_TEXTURE_MB = 64`. Texture memory: **80.8 MB
before, 37.9 MB after, over 70 images** — 79.3 of the 80.8 is the `.ktx2`
alone, which is #506's live measurement to the decimal. `npm test` fifteen
of fifteen, `npm run build` clean, `dist/` 52.8 to 28.9 MB. No `ktx`, no
network and no GPU were needed to close it.

**Then somebody looks** (#53), with the checklist in `SPECS.md`, before the
second increment puts a wall and a floor of its own in every named room. The
ten Poly Haven prop packs stay until the look says otherwise, and a third
increment for them waits on the look saying so too.

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

**The second increment shipped on 2026-09-20** (#729 to #733): five more
people, `page`, `sacristan`, `tiring-woman`, `watchman` and `writer`, take
`data/populace.json` to 19 and the page to 32 bodies built, 13 cast plus 19
populace, exactly `MAX_SKINNED_TOTAL`. Outer ward holds 17, 18, 17, 17 and
inner ward 14, 15, 14, 13 across Prime, Terce, Sext and Vespers.
`data/populace.json` also gains a flat `talk` list of three pairs, and
`src/populace.js` and `src/quest-manager.js` carry the rail that plays one
when the player stands near two settled, gossiping bodies, sharing the
`#caption` band with a performance. `test/budget.mjs` counts the household
now, not just the twelve's schedule.

**What is left waits on three other rows and one argument.** The rest of the
fifty, and whether `garden` becomes ground, is rank 9's town. The four
activities still without a clip, `sweep`, `stir`, `hammer` and `spar`, wait
on rank 10. The ceiling stays 32 until a row renegotiates it with rank 2's
`renderer.info`. And the twelve's 27-pair chatter pool is still unspent by
proximity; a later lore or dialogue increment is recommended to hold each
pair to the schedule the way #592 holds a performance.

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

**A bed at a point and the four rings shipped on 2026-09-18** (#680 to
#683). Every room with a bed is a source, heard through a panner of its own
at the point of the room nearest the player, and the nearest three within
14 m sound at once: the kitchen from the ward outside its door, and the hall
at the player's own head across the threshold with no fade at the door. The
ward stays in the head. A drum's storeys with the same bed are one source,
so a stair inside a tower fades nothing. `ambient.spatial` is the whole of
it, `bedSources`, `sourcePoint` and `audibleFrom` in `src/audio.js` are pure
over the plan, and `test/layout.mjs` check 13 holds all 30 sources to a
point inside their own footprint. The bell rings by the engine's own `n`:
one stroke for Terce, two for Sext, six for Vespers, three slow for the
summons, in `bell.rings`.

**The first two event sounds shipped on 2026-09-19** (#696 to #698): a
door and the hound, the two that needed no clip. `events` in
`data/sounds.json` is a sound per cue as a list of parts, `CUES` in
`src/audio.js` is the three cues the engine fires, and `test/layout.mjs`
check 14 holds the two to each other both ways. The builder fires
`door-open` and `door-shut` from a leaf's centre on a change of state only,
so the second day's idempotent `applyDay` is one door and not two; the
populace cues `hound-near` every frame the hound is inside its radius and
the file's `cadence` turns that into a bark 0.6 s after the approach and
every 7 s after. Nothing plays before the start button: a cue on a
suspended context is logged and not played. `test/plan-vs-scene.mjs` holds
the two wires.

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
the first time the player stands in it. **What is next is area, and nothing
is in front of it any more**: rank 4c built Thomas Wykes's yard on the ground
west of the barbican on 2026-09-19 (#703 to #707), which is the proof this row
was gated on. Three things it leaves for this row to build from: the
`town-wall` run at x -64, 64 m of Mereford's wall with the town gate already
in it; `ward: "outside"` as a room's third answer, with `test/layout.mjs`
check 4c holding what that word costs; and a map frame that grew to fit the
yard (#706). **The town's first increment shipped on 2026-09-21** (#725 to
#728): the town lies west of that wall, not in the 14.5 m strip between it
and the barbican; six houses and a church, seen from the North-west Tower's
roof and entered by nobody; outside rooms on a map drawing of their own and
out of the count, back to 67.6 m and 40 rooms; and what they draw held
against both wards' ceiling, 131 meshes outside both, the outer ward's sum
1124 of 1200 and the inner's 774. **What is next is the quay and the river**,
outside the west gate, deferred because water is a surface kind the plan does
not have yet; it has no `SPECS.md` section, so it is an `architect` job first.
Filling the nineteen is rank 6's routines and whatever documents a later lore
row adds, made cheap by rank 12's editor.

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
meshopted, with a `follow` that brings it to heel along the grid.

**Two hens and the spear shipped on 2026-09-18** (#684 to #686), both off
poly.pizza, which re-hosts Quaternius's packs as glTF under the same CC0.
`Hen.glb` is the Farm Animals bird, 55 KB, and it needed a fourth re-export
move no body before it did: the 100x scale an FBX export leaves on the
armature baked into the vertices, joints and bind matrices, because three
rendered it at millimetres until then. `Spear.glb` is 46 KB and is the first
held prop that is not Poly Haven's, so `heldProp` paths under `assets/` are
read as repo-relative now, and `heldPropFit` says how long, where the hand
goes and which end is up. The serjeant and the man-at-arms carry it. What is
left of the row is the look at all of it on a GPU that `npm run play` owes
(#53), and the four activity clips rank 6 still wants (`sweep`, `hammer`,
`spar`, `drill`), which no body on disk has.

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

## The tooling

*Where: container. Gate: none. Lane: none left — 12a had no lane, 12b held lane
B and 12c held lane C. All three are done and the row is retired.*

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

**What was left was the dialogue format, and it shipped on 2026-09-18** (#687
to #690). `dialogue/castle.dlg` is every word the twelve say — 13 speakers, 62
states, 182 lines, 34243 bytes — with what moves a speaker into each state and
what the state is worth written above its lines. Six sigils: `@` a speaker, `:`
a state, `?` a press or a quest stage, `%` that stage's objective, `!` a clue
the state grants, `|` one line. **`|` and `%` compile back into
`data/npcs.json` and `data/quests/`; `@`, `:`, `?` and `!` are rebuilt from the
clue graph on every compile and refused if they have drifted, never authored** —
because a compiler that could invent a press out of a line of prose could
rewire the mystery behind `src/mystery.js`'s validator, which reads
`mystery.json` and not the .dlg. It is hand-run and not a build step (#688,
overruling the spec's own words for #506's reason), it lives outside `data/` so
`vite.config.js` cannot publish it, and the write is `tools/place.mjs`'s splice
generalised to a nested path (#689). `test/dialogue.mjs` is the fifteenth
suite: 112 assertions, 0.3 s, both line endings, and it is the only thing
standing between the .dlg and the drift a second copy of 182 lines invites.

**The row is retired. What it does not cover** is the rest of the spoken text —
`npcs.json`'s `chatter` and `performances` pools, its `reputation` lines, and
`mystery.json`'s `day2.lines`. None of those is keyed by speaker-and-state,
which is the only shape this format knows, so they are a second increment for
whoever opens one and they are not a row today.

