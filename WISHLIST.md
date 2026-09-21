# WISHLIST

What Castle Conundrum could become after `BACKLOG.md` is empty. **This file
ranks nothing and claims nothing.** `BACKLOG.md` is open work; this is the
arc after it, written 2026-09-16 from Devon's brief of the same day: depth,
life, side quests, a castle big enough to get lost in, a deeper story and a
lot of lore, a castle that is lived in. Kids running, dogs barking, cooks
baking, knights training. Pie in the sky, on purpose. **All seven themes and
the tooling section moved out on 2026-09-17** (#560 to #567), **and an eighth
theme, Devon's brief of 2026-09-21, was written and moved out the same day**
(#742 to #744): what is left
below is the baseline they were measured against, Devon's own answers, and a
pointer from each theme's old place to where it lives now, in `BACKLOG.md`
and `SPECS.md`. **A second theme, also written on 2026-09-21, carried four
questions nobody but Devon could answer** — explore, a day with nobody
waiting for a name — **and he answered all four the same day they were put
to him, moving it out too** (#750 to #753).

A note on the name. `PLAN.md` was called `WISHLIST.md` until the move
(#491), and `HISTORY.md` and `data/scene-config.json` still cite it by that
name in about ten places. **A citation of `WISHLIST.md` dated before
2026-09-16 means `PLAN.md`.** This file is the second one to carry the name.

When a row here is taken up, it leaves this file, gets a spec in `SPECS.md`
and a rank in `BACKLOG.md`, the same as every row before it. Until then it is
a wish. The ten questions at the bottom were Devon's to answer and he
answered them the same day (#547 to #550); the themes below are written to
his answers.

## What the castle is today, so the wishes are measured against it

- **64 m by 36 m inside the curtain**, eight drums, two wards, a wall walk,
  eleven ground rooms and a first storey. Twelve seconds end to end at the
  5.2 m/s the player runs. A circuit of the walls is a minute.
- **Twelve people, four bells, one crime.** Every NPC has one station per
  watch and walks between them on the same grid the player stands on
  (`src/stations.js`). Nobody does anything at a station but stand there.
- **Everything is data, and every data file has a validator** that runs in
  Node before the page loads: `mystery.json` for clues, schedule and presses,
  `npcs.json` for bodies and lines, `quest.json` for the frame, `sounds.json`
  for the two sounds. This is the pattern every row below extends.
- **Three bodies and 51 MB of assets, against a 200 MB ceiling** (#499). The
  kit has no woman, no child, no animal. Every asset that lands goes through
  `tools/encode-assets.mjs` first (#506).
- **Two sounds, both synthesised.** No audio file exists in the repo yet;
  #519's synthesis-only half was reversed on 2026-09-16 (#548) and recorded
  CC0 audio is admitted, through the encode pipeline like any asset.
- **Nothing here has been seen on a GPU since Phase 5** (#53). Every row
  below that is about how something looks or feels is gated on `npm run play`
  on a real machine, and most of them are.

## The themes

**All seven moved out of this file and into `BACKLOG.md` ranks 6 to 13 on
2026-09-17** (#560 to #567; they are ranks 6 to 12 since the lore row closed
on the same day, #596): Devon asked for the wishlist taken up now rather
than wait on rank 5 to close, which question 10's answer below had assumed.
**Both themes written on 2026-09-21, the retro castle and explore, have now
moved too** (#742 to #744, #750 to #753): nothing waits on Devon here any
more, and what is below is the record of what he was asked and answered.
The order between them, and the content inside each, both came across
unchanged — the ranks below are the order this section already had. What
follows per theme is a pointer, not the brief: `SPECS.md` has the first
increment each row starts from, and the rest of what was written here is now
that row's to spend across further increments, the way rank 4 already spends
its own.

Seven, and the order is the order I would take them in, because each one
makes the next cheaper. Life before size, because an empty big castle is
worse than a full small one. Lore before side quests, because a side quest
is lore with a verb. Tooling early, because the content rows are large and
hand-placing a hundred props in JSON is the cost that will stop them.

### 1. Life: the castle has a population, not a cast

**Moved to `BACKLOG.md` rank 6, `SPECS.md`'s "Life: a populace" section**
(#560). The twelve are the mystery's; the castle needs the other fifty, none
of them with a lie or a clue — what the castle looks like when nobody is
being questioned. `data/populace.json`, activities keyed to the four bells,
children and dogs specifically, the knights training, and ambient talk are
all that row's now, in the order given above; the first increment is the
file, its validator, and ten bodies off models this repo already has.

### 2. Sound: the castle is audible before it is visible

**Moved to `BACKLOG.md` rank 7, `SPECS.md`'s "Sound: a soundscape" section**
(#561). Ambient beds per zone, event sounds, the bells as a soundscape, and
the recorded-CC0-audio rule #548 already reversed are all that row's now; the
first increment is the ambient beds.

### 3. Lore: the castle has a history, and the player can read it

**Shipped, rank 6, 2026-09-16 (#551 to #555), reviewed and expanded
2026-09-17 (#556 to #559).** The mystery is one night; the castle now carries
forty years of building and a war before it, in a validated canon written
against one timeline, thirteen documents the player can read, and a chatter
pool for the twelve. What is below is what shipped and what is still open.

**The world is invented, and it leans into the fantasy** (#549, Devon's
answer to question 1), and stayed invented: `data/lore.json`'s sixty-one
facts name a kingdom, Vantry, two Kings across the forty years (Aldous, who
fought the March War and began the works; his son Osric, who reigns now and
whose coin the Sunder War is still spending), and two saints (Osyth, the
crown's; Cadeyrn, the March's own, kept by the masons without troubling the
chaplain about it). The plan is Conwy's and the feel is the 1280s; the Welsh
names PLAN.md already gave the twelve are untouched, and the kingdom is laid
over them rather than replacing anything. Nobody casts anything on screen.
The hedge-witch, the chapel relic, the well the garrison will not drink from
after dark and the thing Madoc hears under the Prison Tower's floor are all
in, every one of them a `belief` or a `rumour` the game never confirms.

- **A canon, in one file, shipped.** `data/lore.json`: every fact has an id,
  a `kind` (`history`, `person`, `place`, `belief`, `rumour`), one paragraph
  in the period's own voice, and `sources` naming where it is actually told.
  `src/lore.js` validates it — an unknown source, a dangling id, a
  contradiction between two facts neither of which is a `belief` or a
  `rumour`, and a document placed somewhere permanently unreachable all fail
  the suite; a fact with no source is reported as untold rather than failed
  on. A document's slab is one placement written twice, in
  `data/documents.json` and in `data/scene-config.json`'s `builtProps`, and
  the validator fails if the two copies differ by a tile, a base, a size or
  a material (#557). `test/lore.mjs` is the tenth suite. **The canon has a
  timeline** (#556), in years of the works, written into `data/lore.json`'s
  own comment, and every `history` and `person` fact is held to it by hand:
  the review that added it found three facts that did not fit each other and
  two `npc` sources that named a line which did not say the fact. The validator caught a real
  authoring mistake before a single synthetic break was written: two facts
  claimed a document as a source that the document's own `cites` did not
  name back.
- **Documents: thirteen of them, shipped.** The old works ledgers (Clerk of
  Works' office; the open ledger of this year is the mystery's own evidence
  in the muniment room, which is why these are the closed ones), the
  chaplain's obituary roll (his chamber), the porter's gate book (his lodge),
  a builder's graffito cut into the floor at the top of the Kitchen Tower's
  stair (the garrison dormitory), a gravestone in the chapel floor (Sir Walter
  Esturmy, the Constable before this one), the King's writ (the muniment
  room), and, from #557, the foundation stone against the cross-wall in the
  outer ward, the engineer's drawing (the Clerk's chamber), the cook's slate
  (the kitchen), the exchequer's letters on the Steward's floor, the lodge's
  ordinances on a board at its post, the bakers' notches by the oven, and the
  watch-bill in the guardroom. Each is a built slab — no new asset, the same
  pattern the cloak and the walk-bar already used — with a `read` verb that
  opens the dialogue overlay and files itself into the journal's new tab,
  **Things read**, which persists through a reload: the save moved to
  version 3 for it (`read: []`, #36, #37). Still open: the gaol roll (it is
  increment 3's evidence, not lore, and stays on rank 4's path), more
  gravestones (the chapel floor is full; the east barbican garden has no
  walkable cell, so a stone there would be unreachable, and the garden being
  walkable is a castle question before it is a lore one), and the mason's own
  marks cut into stone elsewhere than the dormitory.
- **Chatter: shipped, for the twelve, not the fifty.** `data/npcs.json`
  carries a twenty-seven-pair pool keyed by ward then watch, each pair naming
  its two speakers and, where it tells one, a lore id. It validates against
  each speaker's own `ward` field, not the schedule's exact station, which is
  this row's own recommended-and-taken open call — a later pass could hold it
  to the schedule the way `mystery.js`'s nav rails do. The pool is unused by
  the game today, and the populace does not spend it (#731): it is the
  twelve's, every line opens with one of their names, and none of its pairs
  stands within 3 m at its own watch. `data/populace.json` carries a `talk`
  list of its own for two household bodies in earshot, and holding this pool
  to the schedule is a later lore or dialogue increment's.
- **A castle that says where it is in its own history.** Shipped in the
  canon and the documents: built after a conquest (the March War), by a
  King who is not there (Osric) and whose money is late (the Sunder War),
  with the March's own people supplying the labour and, within a generation,
  its own master masons (Hywel is the fourth). That much is Conwy's shape and
  it stays; the names on it are the game's own. #556 to #559 added the
  engineer who drew it and the cross-wall he put in on second thought, the
  town's road, quay and fair, the seat at Caernarfon the sheet goes to, the
  Stockhouse Tower as the gallows (told by the epilogues, the first use of
  that source kind), and a person fact for most of the twelve, each written
  to fit what `mystery.json` already says about them: eleven years married,
  eleven years cooking, eleven days in the cell, eleven miles to go.
  **The lore names no object of the mystery** (#559): the lead, the passes,
  the cloak, the lantern and the summons are not in `data/lore.json` and are
  not to be, because the lore sits around the mystery and never inside it.
- **The two set pieces shipped on 2026-09-17** (#592 to #596), and with them
  the whole of the row this theme had become. `data/npcs.json` carries a
  `performances` block: two `sermons` and two `songs`, each one person in one
  room at one bell, played a caption at a time to whoever is standing in the
  room. The chaplain's sermon at Vespers is there as asked. The song is not
  in the hall at Sext, because the schedule puts nobody in the Great Hall at
  Sext and the new validator says so; it is in the hall at Vespers, the one
  bell both wards eat there, and a second song went into the kitchen at Sext
  so day one has a piece before its last bell. The fourth is the morning
  after, in the chapel, over a grave that is filled, which is this theme's
  "each its own pool so a second day does not repeat the first", answered by
  the watch rather than by a second file. **Facts that change went to
  `BACKLOG.md` rank 4** (#596), the second-day row, because a `since` field
  needs second-day state to be about.
- **Still open in this theme, and not yet anybody's row.** More gravestones
  (the chapel floor is full), the mason's marks cut into stone somewhere
  other than the dormitory, and whatever else the "documents everywhere"
  idea is still worth. A row moves out of this file when it is taken up.

### 4. Side quests: lore with a verb

**Moved to `BACKLOG.md` rank 8 on 2026-09-17 and closed out of it on
2026-09-18** (#563, rank 9 until the lore row closed; #691 to #695 closed it).
Both files carry the record rather than the row now: `HISTORY.md` has the five
decisions and neither `BACKLOG.md` nor `SPECS.md` has a section for it.
The quest graph (`src/quest-graph.js`, #393), the quest-is-data format, the
first dozen by ward, the independent-of-the-mystery rule (#550, question 6),
many at once (#550, question 7), and reputation by ward are all that row's
now; the first increment is the format, the set validator, and the cook's
missing knife as the first quest. **That increment shipped on 2026-09-17**
(#576 to #581): `data/quests/`, `validateQuestSet`, and Marged's knife found
in the bakehouse without a clue granted either way. **The journal's
open-quests tab shipped the same day** (#595): "Asked of you", every quest the
player has met and the objective it is at now. **Four more errands shipped
the same day** (#597 to #599): the merlin, the candle account, the dice and
the chisel, and **reputation by ward the same day again** (#612 to #615).
**The theme closed on 2026-09-18** (#691 to #695): the last seven errands
went in, one voice each on the seven people who had none, so `data/quests/`
is twelve files and every person the day one schedule puts in the castle has
something to ask a passing clerk. Two of the dozen this file named wanted a
body rank 6 has not built; the porter's boy survived as an errand on the
porter with the boy off screen, and the child's dog was let go rather than
waited for (#692). Nothing of this theme is open, and its row is gone from
`BACKLOG.md`.

### 5. Size: a castle to get lost in

**Moved to `BACKLOG.md` rank 9, `SPECS.md`'s "A castle to get lost in"
section** (#564). Filling the volume, the town, the rock and the river, a
second castle, and the map the player has to earn are all that row's now, in
the order given above; the first increment is the volume this castle already
has and is not using.

**The volume half of that row was found already built on 2026-09-17** (#582):
the eight drums carry a room at every level they can, the castle has 40 rooms,
and nineteen of them are empty. "An empty room is worse than no room" is why
the row's next step is the map and the town rather than more floors.

**The map shipped on 2026-09-17** (#588 to #591): the journal's third tab,
the plan's 40 rooms drawn a storey at a time and filled in as they are stood
in. What is left of the row is the town.

### 6. Bodies: the thing every row above waits on

**Moved to `BACKLOG.md` rank 10, `SPECS.md`'s "Bodies" section** (#565).
Low-poly, one shared rig, CC0 (#550, question 5), variation without files,
and the budget are all that row's now; the first increment is sourcing a
child, a dog, a chicken and a garrison body at the scale rank 1 already
answered for one.

### 7. Feel: the things a GPU decides

**Moved to `BACKLOG.md` rank 11, `SPECS.md`'s "Feel" section** (#566).
Weather and sky, fire, hands and a body, examine, doors that open, wear, and
sitting are all that row's now; the first increment is the two cheapest
presence cues named above, a shadow on the pavers and a hand that reaches
for the door, and every item here is still gated on `npm run play` on a real
machine (#53).

### 8. The retro castle: the stone in the castle's own pixel art

**Moved to `BACKLOG.md` rank 3, `SPECS.md`'s "The retro castle" section**
(#742 to #744), on the day it was written, 2026-09-21. Devon's brief: the
castle reads as the same everywhere, and he wants pixel-art textures
produced by a model session rather than Poly Haven's photographs, for
variety room to room and for a retro look, a style call before a cost one.
It is the third decision on one question: round 1 left the kit's pixel art
on the walls, #411 put photographic stone on them at Devon's choice of eight
sets, and #742 takes it off again at his. What was measured before it moved:
the fifteen sets are 44.2 of the castle's 79.3 MB of texture memory and 22
of 46 wall runs are one slate, and the Kenney kit beside them is 64 px unlit
pixel art already, which #630 saw as two games from a tower top. The
generator, the rails, the fifteen textures in place of the fifteen sets, a
fourth budget count, the look on a GPU, variety per room and the question of
the props are all that row's now; the first increment is the whole swap for
built geometry, so the castle is one look on one sitting.

## The tooling that makes the content rows possible

**Moved to `BACKLOG.md` rank 12, `SPECS.md`'s "The tooling" section**
(#567), and **that row is now retired whole**. The placement editor, the
dialogue format, and the validator-plus-budget-suite were all that row's; the
first increment was the placement editor, `?edit=1` on the dev server only,
never in `dist/`. **It shipped on 2026-09-17** (#583 to #587): a panel that
reads the tile under the player's feet and writes the row into
`data/scene-config.json` on a key press. The budget suite followed the same
day (#607 to #611), move-and-delete after it (#636 to #642), and the dialogue
format on 2026-09-18 (#687 to #690) — `dialogue/castle.dlg`, every word the
twelve say, with what reaches each state written above its lines. **Nothing of
this theme is open.** What none of the four covers is the rest of the spoken
text: the `chatter` and `performances` pools, the `reputation` lines and
`day2.lines` are not keyed by speaker-and-state, which is the only shape the
format knows.

### The floor plan you can see

**Moved to `BACKLOG.md` rank 13, `SPECS.md`'s "The floor plan you can see"
section** (#745 to #749), on the day it was asked for. This is the fifth
tool and it was not on the list above, because the list above was about
content and this one is about the castle itself: the room layout was placed
by an AI one room and one guess at a time with no way to see the whole floor
plan, and Devon wants a GUI to lay it out himself, or at least to review and
correct it visually. What the row found before it was written down is that
the layout is not in `src/castle-plan.js` at all — that file holds no
coordinate — but in four arrays of `data/scene-config.json`: 46 wall runs, 8
drums, 3 gates and 43 rooms, with the openings that connect them carried on
eleven of the runs. So it is the same file and the same splice the placement
editor already writes (#745), the view is an orthographic camera over the
real scene rather than a flat schematic (#746), and the first increment
writes nothing (#748).

### 8. Explore: a day with nobody waiting for a name

**Moved to `BACKLOG.md` rank 1, `SPECS.md`'s "Explore: the day before"
section** (#750 to #753). Devon answered all four questions below on
2026-09-21, the day they were put to him, and overturned the theme's own
recommendation on two of the four: the walking day is the main mode, not a
second door, and it is the day before the death, with Hywel alive, not the
day of it. What the theme found stands as the well the row now draws from —
the four teeth of the mystery's clock that the walking day has to refuse, the
27 chatter pairs and 54 lines already keyed by ward and watch, the 182 lines
`dialogue/castle.dlg` holds today, and the ~144-line cost of a talk-again
pool — and `SPECS.md` is where the first increment now lives.

## Devon's answers, 2026-09-16

Ten questions were put on the day this file was written and Devon answered
every one the same day. They are locked as #547 to #550 in `HISTORY.md`.
The questions are kept here so the answers read against them.

1. **Real history or a castle like it?** *Invented history around a
   fictional cast, and lean into the fantasy* (#549). Conwy's plan and the
   1280s' feel; the kingdom, the King, the war and the saints are the game's
   own. See theme 3.
2. **Bigger how, first?** *The default: volume, then the town, Stirling
   last.* See theme 5.
3. **Does time stay on the bells?** *The default: the bells stay.* In plain
   words: the game's clock is the four bells the player rings, and it does
   not move between them. Life in the castle happens as loops inside a watch
   (a boy fetches water again and again until the next bell), not as a
   minute hand. The sun moves once per bell. Every time gate the mystery has
   is written against a bell and none of them has to change.
4. **Does the no-audio-file rule hold?** *No. Grab audio now* (#548). #519's
   synthesis-only half is reversed. See theme 2 for how a recording lands.
5. **What do the bodies look like?** *Low-poly for now* (#550), so that a
   session can make a drop-in body when a pack has none. See theme 6.
6. **Do side quests touch the mystery?** *No. Independent of the mystery,
   and they may connect to each other or deepen what the player
   understands* (#550). See theme 4.
7. **One day, or a season?** *Many at once* (#550). One open castle, a
   dozen small cases running together. See theme 4.
8. **Who is this for?** *Laptop first* (#550). The phone gets a cap.
9. **Voice?** *Text for now. Voice acting much later.*
10. **What is the first row?** *The current backlog stays as it is, and this
    list falls in line behind it* (#547). When `BACKLOG.md` empties, the
    first row out of here is the populace file and the first ten bodies of
    life (theme 1), because it is the row that makes every other row
    visible. **Overtaken on 2026-09-17** (#560): Devon asked for the whole
    list taken up rather than waited on, so all seven themes are `BACKLOG.md`
    ranks 6 to 13 now, behind ranks 1 to 5 rather than after them. The
    populace file is still first among the eight, which is the one part of
    this answer that held.

## Devon's answers to questions 11 to 14, 2026-09-21

Four questions from theme 8 were put to Devon the day the theme was written
and he answered all four the same day. They are locked as #750 to #753 in
`HISTORY.md`. The questions are kept here, with the architect's own
recommendation still attached, so the answers read against both.

11. **Build the walking day at all?** As a second door on the start panel
    into the mystery's own day with the accusation never asked for, saved
    nowhere. *Recommended yes.* It is one stage, one engine branch, one
    button and four rails, it touches no lane-A file, and it is the
    increment both answers to question 12 need first. **Yes** (#750).
12. **Main mode, or a second one?** *Recommended a second mode now, and
    revisit once increment 2's talk-again lines exist and somebody has
    walked the day for an hour.* **Main mode, now, overturning the
    recommendation** (#751): "Walk the castle" is the first door into the
    game and the mystery sits behind it. The saved explore that a second
    mode would have deferred, increment 3, ships at once: a `mode` field,
    version 7, lane A. The start panel's default button flips to "Walk the
    castle", and the entry beat of six browser suites — `plan-vs-scene`,
    `overlays`, `map`, `touch`, `built`, `play-castle` — now has to pick the
    mystery door explicitly.
13. **In the walking day, is Hywel dead?** *Recommended yes*, because
    increments 1 and 2 are the day of the death with its clock's teeth
    drawn: the body at the stair at Prime, the twelve saying what they say,
    and nobody asking for a name. **No, overturning the recommendation**
    (#752): the walking day is the day before the death. Hywel alive and
    speakable, no body at the stair, no lantern, no cloak in the laundry, no
    summons in anybody's pouch, and none of the twelve saying a word of
    their day-one testimony. Priced at the recommendation's own number and
    taken as given: a thirteenth speaker, twelve new `default` sets, a
    second schedule and a validator that knows which day it is reading, a
    content row the size of Phases 6 and 7 together.
14. **Does this wait on the texture-variety idea?** *Recommended no gate.*
    Increment 1 is engine and a button and does not make the castle read
    as more varied; it is also the thing that would first show whether the
    castle holds a lingering eye at all. **No gate, recommendation taken**
    (#750). If both rows are open, texture variety goes before increment 2,
    the content that is for a player who lingers, and not before increment
    1.

**The rank shift these answers put on `BACKLOG.md`, recorded once** (#753):
the walking day takes rank 1, "Sight at the body's own height" moves to 2,
"The GPU run" to 3 with its gate reworded to "after 2", "The retro castle"
to 4, and rank 11's gate to "after 3". Ranks 6, 7, 9, 10, 11 and 13 do not
move.
