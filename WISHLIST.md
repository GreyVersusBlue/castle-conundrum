# WISHLIST

What Castle Conundrum could become after `BACKLOG.md` is empty. **This file
ranks nothing and claims nothing.** `BACKLOG.md` is open work; this is the
arc after it, written 2026-09-16 from Devon's brief of the same day: depth,
life, side quests, a castle big enough to get lost in, a deeper story and a
lot of lore, a castle that is lived in. Kids running, dogs barking, cooks
baking, knights training. Pie in the sky, on purpose. **All seven themes and
the tooling section moved out on 2026-09-17** (#560 to #567): what is left
below is the baseline they were measured against, Devon's own answers, and a
pointer from each theme's old place to where it lives now, in `BACKLOG.md`
and `SPECS.md`. **An eighth theme was written on 2026-09-21 and has not
moved**: explore, a day with nobody waiting for a name, with four questions
for Devon under it that nobody else can answer.

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
**Theme 8, explore, is the one theme still in this file**, written
2026-09-21 against the castle as it stands after #728, and it waits on Devon
rather than on a session.
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

### 8. Explore: a day with nobody waiting for a name

**Not moved. Written 2026-09-21 from Devon's question of the same day, and it
stays here until he answers questions 11 to 14 below.** Devon is considering a
mode centred on walking the castle and talking to the twelve, with no case to
solve, and weighing whether it sits beside the mystery as a second mode or
becomes the main one with the mystery behind it. He said "perhaps" to the
second half. Both halves are his, and neither is answered here. What this
theme does is say what each costs, which numbered decisions each touches,
and what the first increment is under either answer, written to `SPECS.md`'s
depth so that the day he says "build it" the row is class S by construction
and moves out of this file the way the seven before it did.

**Recommendation, stated once.** A second door on the start panel into the
mystery's own day with its clock's teeth drawn, saved nowhere, first. Not the
main mode, not yet, and not because the idea is small: because the content
that would make an hour of chatting worth an hour does not exist, and a main
mode built on twelve people who each say the same four lines is a walking
simulator with twelve tape loops in it. The flip from second door to first is
one default and the entry beat of six suites, and nothing in the first
increment is spent getting there.

#### What the game already does that is this

The `investigate` stage is free roam. The player rings the bell when they
like, the clock does not move between bells (#550, question 3), and no clue
waits on any other except through the presses. The teeth are four and all of
them are the mystery's:

1. The fourth ring moves no watch, returns a `demand` and moves the frame to
   `accusing` (#415, #425, #490). #490's own last sentence: "Two transitions
   in `data/quest.json` reverse it."
2. `talked:constable` in `investigate` opens the accusation panel, because
   his `default` lines end in `{ACCUSE}` and `validateAgainstNpcs` holds the
   token and the action to each other (#479).
3. The HUD's objective says find out before Vespers.
4. The start panel's paragraph says you have four bells.

Take those four out and what is left is a castle with the twelve at their 45
stations, twelve errands that already never touch the mystery (#550
question 6, #576 to #581, #691 to #695), two sermons, two songs and three
rumours (#592 to #596, #648), a reputation aside per ward (#614), fourteen
populace bodies walking rings (#616), thirteen documents to read (#551 to
#559) and a map that fills in as you stand in rooms (#588 to #591). That is
a walking day already. It is the mystery's day with the accusation never
asked for, and it costs one stage, one engine branch and one button. There
is a precedent for a day defined by what it refuses: #537's morning after
refuses clues, the bell, the accusation and the Present button, and is still
a day the player walks. The walking day refuses exactly one of those four.

#### What it does not do, and what "just chatting" would need

Every one of the twelve says the same three to five `default` lines on every
talk, and every one of those lines is testimony: "he fell", "I sent no
summons", "abed from Compline". A second talk is the first talk again, word
for word. The 27 chatter pairs are written for two populace bodies in earshot
and are unused by the game (#554, #558; rank 6's to spend). The `.dlg` format
keys a state to a press or a quest stage and nothing else: `@`, `:`, `?` and
`!` are rebuilt from the clue graph on every compile and refused if they have
drifted (#687 to #690), so a line set that is reached by "this is the walking
day" is not a shape the compiler knows, the same gap it already has for
`chatter`, `performances`, `reputation` and `day2.lines`.

So "chatting" as a loop of its own is two increments past the first, and the
second of them is class O on its own account. Sizes, so the cost is a
number: one re-talk per person per watch, at three lines each, is 144 lines,
against the 182 the whole `.dlg` holds today. The well to draw them from is
`data/lore.json`'s 61 facts and the 27 chatter pairs already written in the
castle's voice, 54 lines keyed by ward and watch, which is the one pool that
could be re-keyed by speaker rather than written fresh.

#### Second mode or main mode

**The case for a second mode.** Everything built is the mystery's. Seven
phases (#421 to #490), fifteen suites, `test/mystery.mjs` owning the stations
(#529), the two-to-three-watch path rails (#415, #423), `watches` asserted to
be exactly four (#533, and #699 kept that clause), a second day keyed on the
verdict (#533 to #540, #571 to #575), and a save whose every field is a fact
about the case (#413, versions 2 to 6). None of it has to move for a second
door; the door reuses all of it. And the content the mode needs to be worth
its name is not written. A second mode can ship thin and grow.

**The case for the main mode.** Devon's brief of 2026-09-16 is "a castle
that is lived in", and the seven themes that came out of it are all about
what the castle is when nobody is being questioned. Lore, side quests,
performances, a populace, a town seen from the walls: each of those is worth
more to a player who is lingering than to one who is chasing a sheet by
Vespers, and the mystery's own clock argues against lingering. A main mode
says the castle is the game and the case is one thing that happens in it,
which is what `WISHLIST.md`'s first paragraph already half says.

**What the main mode would overturn.** Not one numbered decision cleanly,
which is why it is Devon's and not a session's:

- #415 and #490 as the default day's shape. The plan's premise in #411 to
  #418, shipped in #421 to #490, is "a first-person mystery played across one
  day". A main explore mode does not delete that, but it stops it being what
  the start panel says the game is.
- `index.html`'s start paragraph and objective, the og text (#634, #635) and
  `README.md`, every one of which describes a mystery.
- `data/quest.json`'s `start`, which is `arrive`.
- The entry beat of six browser suites (`plan-vs-scene`, `overlays`, `map`,
  `touch`, `built`, `play-castle`) and the populace beat, all of which enter
  the castle through `#start-button` and expect the mystery's day behind it.
  Each would pick the mystery door explicitly.
- And it wants increment 3 at once, because a main mode a reload forgets is
  not a main mode: a `mode` field on the save, version 7, lane A (#36, #37).

None of that is hard. All of it is a decision about what the game is, and
the class-O row in `CLAUDE.md` says a decision nobody wrote down is how the
plan-suite rule was lost. This is the one to write down first.

#### The first increment, as it would be specced

Under either answer this is the increment, and it is the same increment. It
is named here in `SPECS.md`'s five parts so promotion is a copy and not a
rewrite.

**Scope.** Six files, and `src/save.js` is not one of them.

| File | What changes |
| --- | --- |
| `data/quest.json` | A stage `explore`: objective "Nobody is waiting for a name. Walk where you like; the bell is yours.", `dialogueState: default`, the word-lock, `riddle:solved` and `ask:journal` transitions the other three non-terminal stages carry, and `bell:1` to `bell:4` each doing `ringBell` and moving nowhere. No `talked:constable`, no `ask:accuse`. It is reached from `arrive` on `mode:explore` and leaves on `mode:mystery` to `arrive`, so `validateQuest`'s two reachability rules hold without an exemption (see open call 5). `start` stays `arrive`. |
| `src/mystery.js` | `createMystery({ mystery, npcs, state, mode })`. With `mode: 'explore'`, `ring()` at the day's last index goes back to 0 instead of returning a `demand`, and emits `bell:4` as now; `accuse()` returns `[]`. Nothing else in the engine reads the mode. |
| `src/quest-manager.js` | Begins the graph at `explore` when constructed for it, the mechanism a resumed save already uses (`begin` at a stage). Passes `mode` through. `handleInteract` on the Constable in `explore` is a conversation and nothing after it, which the stage's own transitions already say. |
| `src/main.js` | The UI-flow region, not the rig. A second start callback: `freshState(quest)` in memory, `createMystery` with `mode: 'explore'`, a manager begun at `explore`, and no `auto`. The slot is read as now and never written on this path. `restart` and the start-again panel on this path reload without `slot.reset()`. |
| `index.html`, `src/ui.js` | A second button under Enter the Castle: "Walk the castle", a `link-button` like the touch toggle. `showStart` takes two callbacks. The start-again panel in explore carries "Back to the start", which reloads. |
| `test/quest.mjs`, `test/mystery.mjs`, `test/overlays.mjs`, `test/plan-vs-scene.mjs` | The rails below. |

Not touched: `src/save.js` (no field, no bump, lane A untouched),
`data/mystery.json`, `data/npcs.json` and `dialogue/castle.dlg` (no state and
no line changes, so `npm run dialogue:check` is unchanged), `data/sounds.json`
(see open call 2), `src/castle-plan.js`, `src/castle-builder.js`.

**Acceptance.** Every item is Node or headless; the look of a second button is
the GPU run's (#53).

- `test/quest.mjs`: `validateQuest` accepts the graph with `explore` in it.
  A manager begun at `explore` with an explore engine: three rings walk
  Prime, Terce, Sext, Vespers; the fourth moves the watch to Prime, no
  `demand` reaches the UI and no accusation panel opens; `talked:constable`
  opens nothing; a press still moves its person (the Steward on
  `summons-is-stewards` goes to `admits`); the errands and the reputation
  asides run as on day one; the journal fills. **Breaks**: delete the
  `mode:mystery` transition and the existing rule says
  `explore: no path from it reaches a terminal stage`; put `talked:constable
  → openAccusation` on `explore` and the "no overlay after the Constable"
  assertion fails.
- `test/mystery.mjs`: `ring()` in explore mode at index 3 lands on 0 with a
  `watch` effect and no `demand`. **Break**: skip the wrap and the watch reads
  3. And the wrap leg: every one of the twelve with a Vespers station and a
  Prime station has a walk between them on the player's grid, in the message
  shape #475 set (`cook: no path from KI at sext to GH at vespers`). The
  second day's own "overnight is still a walk" rail in `validateMystery`
  already routes Vespers to Lauds for the thirteen; this is the same rail
  pointed back at Prime, and the populace's rings already check their wrap
  (#616).
  **Break**: on a clone of the data, move the Constable's Prime station inside
  the cell's bars, and the rail says `constable: no path from GH at vespers to
  cell at prime`.
- `test/overlays.mjs`: the second button releases and takes the pointer the
  way the first does, which is the one property that suite asserts over every
  overlay (#659 to #661), and the start-again panel on the explore path has a
  way back. **Break**: the new button without `player.lock()`.
- `test/plan-vs-scene.mjs`, which already holds `src/main.js`'s wires
  (#696 to #698): plant a mystery save at Sext with three clues, press "Walk
  the castle", talk to two people, ring twice, and read
  `localStorage.castleConundrumSave_v1` back byte for byte the same. That is
  #39's line exactly: the mystery save is the thing a reload has to survive.
  **Break**: let the explore path call `auto.mark()`, and the key differs.
- `npm test` fifteen of fifteen, `npm run build` clean, `test/built.mjs`'s
  served set unchanged in kind.

**Open calls, each with a recommendation.**

1. **Loop the day or stop at Vespers?** *Loop.* A day that stops at Vespers
   leaves Thomas Wykes, who is in the castle at Terce only, one ring away from
   never; a day that turns over lets the player meet everyone at every bell,
   and `applyWatch` already puts the world at any bell idempotently, because a
   resumed save has always needed that (#658). The body is at the stair again
   at Prime because that is where the day puts it, and question 13 below is
   whether that is the day Devon wants. Fallback if the wrap rail finds a body
   with no path: the fourth ring is refused with `mystery.ui`'s own voice.
2. **What the wrap ring sounds like.** *The fourth character as it is.*
   `bell.rings` has four, by the engine's `n` (#682, #701); the wrap is
   `bell:4` and rings three slow strokes. The file names that "the summons",
   which is the mystery's reading of it; renaming or adding a character is
   lane E's and not this increment's.
3. **The Constable's `{ACCUSE}` line.** *Leave it.* He still asks for a name
   and the player still has no panel to give one in. A per-stage token
   override is engine growth for one line, and increment 2 gives him an
   explore line set anyway.
4. **Where the mode lives.** *A constructor option on `createMystery`, not a
   field on `state`.* `state` is the save's shape; a field there is a field
   #37 says arrives with a version number, and this increment saves nothing.
5. **Are `mode:explore` and `mode:mystery` dispatched or only drawn?** *Drawn.*
   `main.js` begins the graph at `explore` directly; the two edges exist so
   `validateQuest` keeps "every stage reachable, every stage reaches a
   terminal" with no exemption, because an exemption in a validator is a hole.
   `test/quest.mjs` asserts `begin('explore')`.
6. **Do heard performances reset on the wrap?** *No.* Once per page (#594): a
   wrap that replays the hall's song each loop is a jukebox.
7. **Which button is first?** *Enter the Castle stays first.* Flipping is one
   line, and it is question 12's.
8. **Day two in explore.** *None, by construction.* `beginDay2` is reached
   through a verdict and there is no verdict.

**Dependencies.** Lane D for `src/main.js`, in the UI-flow region rather than
the rig's; a merge beside rank 6 or rank 11 is different lines of one file,
but one row per lane is the rule (#602), so take it when D is free.
`index.html`, `src/ui.js`, `data/quest.json`, `src/mystery.js` and
`src/quest-manager.js` are in no lane. Not beside anything that edits
`data/quest.json`, which today is nobody. The texture-variety idea put to the
architect the same day is not a gate on this increment (question 14); it is a
soft order on increment 2. One rider: #715's prompt string, `Press E to talk
to the Sir Roger Lestrange`, is on every body in the game and is nobody's
row; in a day that is nothing but walking up to people it is the most-read
line on the screen, so the one-line fix ships with or before this increment.

**Constraints.** #36, #37, #413 (the key does not move and the version stays
6). #39 (the untouched-save rail reads the save because a reload has to
survive it). #415 and #490 stand for the mystery's day; the explore stage
exempts itself in its own transitions, which is the amendment #490 itself
priced at two transitions, and the session that ships it records the number.
#529 (the wrap leg is a station question and lives in `test/mystery.mjs`; the
pointer property lives in `test/overlays.mjs`; a live page's localStorage is
not provable in Node). #550 (the bells stay the clock; the loop leans on it).
#594 (once per page). #34, #13 (every break above, from green, FAIL line
quoted in `HISTORY.md`). #53 (what a second button looks like is unseen).
#632 (CRLF here, LF in CI).

#### The increments after it

- **Increment 2, the talk-again pool. Class O.** A line set per person per
  watch that is said on a second talk in place of the testimony, keyed by
  speaker and watch, which is a third `?` kind for the compiler (`? explore at
  sext`) and so amends #690's authoring loop; `_linesFor` picks it when the
  mode is explore and the person has been talked to at this bell. About 144
  lines. Where texture variety matters, if it lands: a castle that reads as
  more varied room to room is worth more to the player this increment is for
  than to the one the first increment is for, so if both are open, that theme
  goes before this increment and not before increment 1.
- **Increment 3, a saved explore. Class O, lane A.** Only if the answer to
  question 12 is yes, or if Devon wants the walking day resumed. A `mode`
  field, version 7, `repair` clamping it to its two values; the explore day
  then has a save of its own shape and the button reads which one to resume.
- **A day before the death.** If question 13's answer is that Hywel is alive
  in the walking day, that is a thirteenth speaker, twelve new `default` sets,
  a second schedule and a validator that knows which day it is reading: a
  content row the size of Phases 6 and 7 together, and not on this list until
  he says so.

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

## Questions put on 2026-09-21, not yet answered

Four questions from theme 8, Devon's to answer the way he answered the ten
above. Each carries the architect's recommendation, which is a
recommendation and not a decision; the answers get numbers in `HISTORY.md`
the day they come, and theme 8 moves to `SPECS.md` and `BACKLOG.md` on a
yes to question 11.

11. **Build the walking day at all?** As a second door on the start panel
    into the mystery's own day with the accusation never asked for, saved
    nowhere. *Recommend yes.* It is one stage, one engine branch, one
    button and four rails, it touches no lane-A file, and it is the
    increment both answers to question 12 need first.
12. **Main mode, or a second one?** *Recommend a second mode now, and revisit
    once increment 2's talk-again lines exist and somebody has walked the
    day for an hour.* Everything built is the mystery's; the content that
    makes a walking day worth its name is not written; and the flip later
    is one default plus the entry beat of six suites, so nothing is lost by
    waiting. A yes here also wants increment 3, a saved explore at version
    7, at once.
13. **In the walking day, is Hywel dead?** *Recommend yes.* Increments 1 and
    2 are the day of the death with its clock's teeth drawn: the body at
    the stair at Prime, the twelve saying what they say, and nobody asking
    for a name. A day before the death is a thirteenth speaker, twelve new
    `default` sets, a second schedule and a validator that knows which day
    it is reading, a content row the size of Phases 6 and 7 together.
14. **Does this wait on the texture-variety idea?** *Recommend no gate.*
    Increment 1 is engine and a button and does not make the castle read
    as more varied; it is also the thing that would first show whether the
    castle holds a lingering eye at all. If both are open, texture variety
    goes before increment 2, the content that is for a player who lingers,
    and not before increment 1. The other theme, if it lands here, carries
    the same sentence from its side.
