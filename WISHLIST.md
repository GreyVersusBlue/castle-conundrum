# Castle Conundrum Feature Wishlist

**Status: this is the v2 plan, written 2026-09-14, and it is finished. Phases 1
to 4 shipped that day (PRs #306, #309, #312 and #314, #421 to #450), Phase 5
(PR #316, #451 to #464), Phase 6 (PR #318, #465 to #476) and Phase 7 (#477 to
#490) on 2026-09-15.** Seven phases, each sized to one session, each taken in
order because each read what the one before it wrote. What is left is under
"What this leaves for a later arc", and `npm run play` has never been run on a
GPU for any phase from 5 on (#53).
The game today is `Projects/Castle Conundrum/index.html`: a fifteen minute walk
across one 28 m courtyard to one riddle, three NPCs, 3,089 lines of code, 29 MB
of assets. The project's history is the repo root's `HISTORY.md`, under
"Castle Conundrum's asset diet" (#389 to #392), "Castle Conundrum's quest is a
graph" (#393 to #395), and "Castle Conundrum v2 is planned" (#411 to #418),
which is this plan's own record.

The prompt this plan answers is Devon's, 2026-09-14: the best castle
walking-simulator puzzle-solver on the web, a denser mystery, more NPCs and
moving ones, a multi-level castle with a real courtyard, Conwy first and
Stirling second, on eight texture sets he already chose. The eight are listed
under "The stone" below and are not re-opened here.

## What it is, finished

A first-person mystery played across one day in a Welsh castle of the 1280s.
The King's clerk arrives a day early, by the west barbican, and finds the
master mason dead at the foot of the Chapel Tower stair; the Constable wants
it called a fall by Vespers, because the inspector arrives tomorrow. Two wards
divided by a cross-wall with one guarded gate; a Great Hall, a kitchen, a
chapel, a prison, a muniment room, royal apartments on the floor above, and a
wall walk that runs the whole circuit two storeys up, which is the fact the
mystery turns on. Twelve NPCs who move between rooms on four bells, tell the
truth about most things and lie about one each. Thirty-five clues and three
red herrings in a graph that a validator holds coherent before the page loads.
An accusation the player can get wrong, with a hanging at the end of it. Sixty
minutes on a first play,
saved to one key so a reload resumes the day. 44.4 MB, with the walls in
coursed slate and squared ashlar rather than pixel art, on a 4 m tile grid
that every suite can read in Node without a browser.

## The order, and why it is not quite Devon's

Devon proposed mystery, then castle, then NPC automation and interactivity,
and that is the order of this plan at the level of arcs. Two things move
inside it. First, the mystery's content is written here, in this file, and
Phase 1 ships it as data with a validator and the save; but a clue sits in a
room and is told by an NPC standing somewhere, so the mystery cannot be
*played* until the rooms exist (Phases 3 to 5) and the NPCs move (Phase 6).
Phase 1 is therefore the same shape as Corner & Kettle's Phase 1, "the sim
without the page": the whole mystery runs in Node, and the page gains only the
save. Second, `test/layout.mjs` re-implements `castle-builder.js` and so
cannot see a change to the builder; a multi-level castle built on top of that
would be green while the player fell through a floor. So the builder is
refactored to emit the structure the suite reads (Phase 2) before a single new
wall goes up. Everything else is Devon's order: shell, rooms, upper level,
schedules, then the mystery goes live.

## What is already there, measured 2026-09-14

- **Code, 3,089 lines.** `src/main.js` 90, `castle-builder.js` 312, `npc.js`
  287, `quest-graph.js` 203, `assets.js` 183, `scene-setup.js` 163,
  `interaction.js` 145, `ui.js` 143, `player-controller.js` 96,
  `quest-manager.js` 85. three.js r169 vendored in `libs/`,
  PointerLockControls, an import map in `index.html`.
- **The quest is a validated graph** (#393 to #395). `data/quest.json` is
  three stages, each with an `objective`, a `dialogueState` every NPC switches
  to, transitions on `talked:<npcId>` and `riddle:solved`, and `enter` actions
  from the three the manager implements (`openRiddle`, `openGate`,
  `showVictory`). `validateQuest` refuses a `to` naming no stage, an unknown
  action, an unreachable stage, a stage that cannot reach a terminal, two
  stages with one objective, two transitions on one event.
  `validateAgainstNpcs` holds every stage's `dialogueState` to every NPC and
  the `{RIDDLE}` token to exactly the conversations that open the riddle.
  `QuestGraph.dispatch(event)` returns effects and never throws. The manager
  holds no state and knows no NPC by id. This is kept, extended, not replaced.
- **NPCs move and animate already.** `npc.js` walks `patrol` waypoints at
  1.1 m/s, turns at 4 rad/s, runs an AnimationMixer with clip aliases (`walk`
  matches Walk, Walking or Run), hides named nodes and materials, and hangs a
  held prop off the right hand bone. The Wizard has a four-point patrol; the
  other two have `"patrol": null`. Three bodies on disk:
  `assets/NPCs/Adventurer.glb` 1.9 MB, `Farmer.glb` 1.4 MB, `King.glb` 2.0 MB.
- **The castle is `data/scene-config.json`, 429 lines.** A 4 m tile, a 7x7
  courtyard at x -3..3, z -3..3 with the gate at (0, 3), a hall behind the
  north wall built from `wall-half.glb` pieces at half-tile steps, 14 kit
  placements, 9 Poly Haven interior props, 3 braziers, the built gate leaf.
  `+x` is east, `+z` is south. The gate leaf is `ExtrudeGeometry` with planar
  UVs carrying `wooden_gate_1k`'s three maps through `loadPBRMaterial`, which
  is the precedent every built wall below follows.
- **The player** is a 0.45 m radius circle at a fixed 1.7 m eye height
  against world-space AABBs, resolved per axis. There is no `y` in movement at
  all: `pos.y = EYE_HEIGHT` every frame, and a collider is skipped only if it
  is entirely above the head or under 0.25 m tall. A level-one wall would
  block a player standing on level two.
- **Four Node suites, three in CI** (`site-ci.yml`, the Castle Conundrum
  matrix entry runs `assets.mjs`, `layout.mjs`, `quest.mjs`). `test/assets.mjs`
  277 lines: every reference resolves, none is a preview ball, the leaf fits
  the archway, and every byte under `assets/Poly Haven` and `assets/NPCs` is
  named by `data/`. `test/layout.mjs` 156 lines: no interior prop overlaps a
  wall, tower or column in plan, and the cabinet and commode stand 0.02 to
  0.30 m off their walls. `test/quest.mjs` 270 lines, 61 assertions, drives the
  real manager. `test/gltf.mjs` 126 lines is the reader the other three share.
  `Tools/board-check/play-castle.mjs`, 551 lines, 34 beats, hand-run, needs
  real GPU compositing, hard-codes `SCHOLAR` and `GUARD` at lines 40 and 41 and
  `HALL_BRAZIER` and `HALL_TABLE` under them.
- **The Kenney kit, read piece by piece.** 106 GLBs under
  `assets/kenney_retro-fantasy-kit/Models/GLB format/`, every one 1 unit deep
  and scaled 4x by `normalizeToTile`. What matters for a second storey, at
  that 4x: `floor.glb` 4 x 0.2 x 4 m, `wood-floor.glb` 4 x 0.52 x 4 m with
  half, quarter and railing variants, `stairs-stone.glb` and `stairs-wood.glb`
  2 m wide rising 4 m over a 4 m run (a full storey in one tile, at 45
  degrees), `stairs-corner.glb` 4 x 4 x 4, `floor-stairs.glb` a 4 m ramp
  rising 1.4 m, `floor-steps.glb` rising 0.8 m, `ladder.glb` 1.2 x 4 x 0.2,
  `battlement.glb` 4 x 1.6 x 1.2 with half and inner and outer corners,
  `overhang.glb` and `overhang-round-railing.glb` 6 x 1.6 x 6, `tower.glb` a 4
  m square prism with `tower-base` 4.4 m and `tower-top` 4.8 x 1.2 x 4.8, seven
  roof pieces. **There is no drum in the kit.** Every tower piece is square.
  Conwy's towers are round, so the drums below are built cylinders carrying
  `defense_wall`, and the kit supplies stairs, battlements, floor edges,
  railings, doors, windows and props.

## The stone

Chosen by Devon on 2026-09-14 against measured weights. Restored per set,
`textures/` only, by the phase that first references it, with the restore
command from the repo root:

    git checkout a5c241c^ -- "Projects/Castle Conundrum/assets/Poly Haven/<set>.gltf/textures"

| Set | MB | Where it goes | Phase |
| --- | --- | --- | --- |
| `castle_wall_slates_1k` | 2.1 | The curtain, both faces, and the barbicans | 3 |
| `defense_wall_1k` | 2.0 | The eight drum towers and the cross-wall | 3 |
| `grassy_cobblestone_1k` | 2.1 | The outer ward's ground | 3 |
| `rock_tile_floor_1k` | 2.8 | The Great Hall, the King's Hall, the chapel vestibule | 4 |
| `floor_tiles_02_1k` | 0.8 | The chapel | 4 |
| `old_planks_02_1k` | 1.0 | Kitchen, Clerk's office, porter's lodge, laundry, steward's chamber, every stair tread | 4 |
| `wood_planks_1k` | 1.6 | Every level-one floor except the royal apartments, and the wall-walk decking over the towers' doors | 5 |
| `dirty_carpet_1k` | 3.0 | The royal apartments over the King's Hall | 5 |

Weights are `git ls-tree` sizes of the three maps in each set at `a5c241c^`,
rounded as Devon's table rounds them; the eight sum to 15.4 MB. Not chosen,
and so not planned around: no exposed rock (the spur is a plan shape), no
ruined masonry (no breach, no rubble room), nothing outside the walls (the
world ends at the curtain; both barbican gates stay shut forever), no thatch,
no door or shutter textures (doors are built geometry with a material the
project already has), no sibling stone. `stone_pavers_1k` is on disk and is the
inner ward, the barbicans and the tower floors. That is two outdoor surfaces,
grassy cobbles for the outer ward nobody sweeps and pavers for the ward the
Constable walks, and no third.

**Locked #411**: the round-1 decision to leave the walls stylised is
reversed by this choice. The walls are built geometry carrying these maps;
the kit's pixel-art pieces stay where the kit has the shape and the maps do
not (stairs, battlements, railings, props).

## The layout

Tile coordinates, 4 m per tile, `+x` east, `+z` south, exactly as
`scene-config.json` reads them today. A tile coordinate names the tile's
centre in world space (`tileToWorld`), so tile x 1 is world x 4. Conwy's plan
is a rectangle roughly three times as long as it is wide, following a rock
spur along the river, with the towers close-set and the cross-wall about two
fifths of the way along from the landward end. Scaled to a walk: the rectangle
below is 16 tiles by 9 inside the curtain (64 m by 36 m), which at 5.2 m/s is
twelve seconds end to end and about a minute to circuit the wall walk.

```
      x: -10 -9 -8 -7 -6 -5 -4 -3 -2 -1  0  1  2  3  4  5  6  7  8
z -4      .  NW ## ## ## KT ## ## ## ## ST ## ## ## ## ## KG  .  .
z -3      .  ## CL CL KI KI KI .. ML ML || KH KH KH KH KH ## GD .
z -2      .  ## CL CL KI KI KI .. ML ML || KH KH KH KH KH ## GD .
z -1     BB  ## .. .. .. .. .. .. .. .. || .. .. .. .. .. ## GD .
z  0     BB  WG .. .. .. .. .. .. .. .. PG .. .. .. .. .. EG GD .
z  1     BB  ## .. .. .. .. .. .. .. .. || .. .. .. .. .. ## GD .
z  2      .  ## GH GH GH GH GH GH GH .. || SC SC .. .. .. ## GD .
z  3      .  ## GH GH GH GH GH GH GH .. || SC SC .. .. .. ## .  .
z  4      .  SW ## ## ## PT ## ## ## ## BT ## ## ## ## ## CT  .  .
```

`##` curtain (`castle_wall_slates`, 8 m high, 1 tile thick, wall walk on top
at y 8 behind a battlement). `||` the cross-wall (`defense_wall`, 8 m, walk on
top). Two-letter tower codes are drums 2 tiles (8 m) across centred on the
marked tile, 12 m high, `defense_wall`: **NW** North-west Tower, **KT**
Kitchen Tower, **ST** Stockhouse Tower, **KG** King's Tower, **SW**
South-west Tower, **PT** Prison Tower, **BT** Bakehouse Tower, **CT** Chapel
Tower. The four inner-ward towers (ST, BT, KG, CT) carry a 2 m turret
cylinder on top, the note Conwy is known for. `..` open ground: the outer
ward x -8..-1 is `grassy_cobblestone`, the inner ward x 1..5 is
`stone_pavers`. **WG** the west gate in the west barbican **BB** (x -10, z
-1..1, pavers, the spawn), **PG** the porter's gate through the cross-wall,
**EG** the east gate to the east barbican garden **GD** (x 7, z -3..2,
pavers, four shrubs from the kit).

Rooms, ground floor (level 0, floor at y 0):

| Code | Room | Tiles | Floor | Door | Locked |
| --- | --- | --- | --- | --- | --- |
| CL | Clerk of Works' office | x -8..-7, z -3..-2 | old planks | south, at (-7.5, -1.5) | never |
| KI | Kitchen | x -6..-4, z -3..-2 | old planks | south, at (-5, -1.5) | never |
| ML | Mason's lodge, an open-sided shed of `structure-poles` | x -2..-1, z -3..-2 | cobbles | open | never |
| GH | Great Hall, full height, no floor above | x -8..-2, z 2..3 | rock tile | north, at (-5, 1.5); a second at (-3, 1.5) | never |
| KH | King's Hall (presence chamber) | x 1..5, z -3..-2 | rock tile | south, at (3, -1.5) | never |
| SC | Steward's chamber | x 1..2, z 2..3 | old planks | north, at (1.5, 1.5) | never |
| NW | Guardroom | tower interior | pavers | east, into the outer ward | never |
| KT | Larder, and the outer ward's stair to the walk | tower interior | pavers | south | never |
| SW | Well chamber and laundry | tower interior | pavers | east | never |
| PT | The cell, behind a barred door the player talks through | tower interior | pavers | north | always (the bars are the door) |
| ST | Porter's lodge, and the stair to the cross-wall walk | tower interior | old planks | south, off the porter's gate passage | never |
| BT | Bakehouse | tower interior | pavers | north | never |
| KG | Muniment room | tower interior | old planks | west, a word-lock | until the riddle is answered |
| CT | Chapel, and the stair Hywel died at the foot of | tower interior | floor tiles 02 | west | never |

Rooms, level 1 (floor slabs 3.8..4.0, walk at y 4), reached by
`stairs-stone.glb` inside the named tower, one tile each, 0 to 4 and 4 to 8:

| Room | Over | Floor | Stair in | Who is there |
| --- | --- | --- | --- | --- |
| Clerk's chamber | CL | wood planks | NW | his bed, an empty key hook, the cipher note |
| Garrison dormitory | KI | wood planks | KT | the sentry sleeps here at Prime |
| Royal apartments | KH | dirty carpet | KG | Lady Alys, her window over the inner ward |
| Chaplain's chamber | CT interior | wood planks | CT | Father Anselm's bed, above the stair |
| Tower rooms | every other tower | wood planks | that tower | empty, a chest or a brazier |

Level 2 (y 8) is the wall walk: `wood_planks` decking 2 m wide along the
inside of every curtain run and along the cross-wall, `battlement.glb` on the
outer edge, the tower doors at each tower where the walk passes through a
tower's level-two room. It is continuous around the whole circuit, and along
the cross-wall, which means **the walk connects the wards above the porter's
head**. The door on the walk at the Stockhouse Tower is the one the porter is
supposed to bar at night. Stairs to the walk: NW, KT, PT, SW in the outer
ward; ST, BT, KG, CT in the inner. Turret tops on ST, BT, KG, CT are not
reachable; the towers' level-three stairs are omitted, and this is where
Stirling's vertical drama stops.

Where the two references actually went in: Conwy gives the plan, the eight
drums, the cross-wall, the two barbicans, the four turreted inner towers, the
Great Hall in the outer ward along the south, the kitchen along the north, the
prison tower, the chapel in a tower, the royal apartments in the inner ward,
and the 1280s garrison-and-works population. Stirling gives the Great Hall's
scale (full height, the largest room, a dais at the east end), the royal
apartments as a carpeted palace floor above a hall rather than a tower room,
and the idea that the interiors are grander than the walls. These are from
memory of Cadw's and Historic Environment Scotland's plans, not fetched, since
this session's proxy blocks the reference sites; none of the geometry above
depends on a measurement from either castle, and the tower names are labels
the mystery uses, not claims.

## The mystery

**Shape.** Paradise Killer's, with Ace Attorney's verb. Evidence is found in
rooms and taken from statements, the player walks where they like, and the
end is an accusation before an authority who judges what is *presented*, not
what is true. Inside a conversation the one verb beyond "continue" is
*present*: show an NPC a clue from the journal, and if that clue contradicts
what they said, they move to a new state and say more. That is Ace Attorney's
press, without the courtroom. A third borrowing from The Case of the Golden
Idol: after the verdict, whatever it was, the epilogue tells the true account,
so a wrong ending is a wrong ending the player can see was wrong.

**Can the player be wrong?** Yes, three ways. The Constable accepts any
accusation backed by two clues from that person's `implicates` list, hangs
them, and the epilogue says who actually did it. He accepts the prisoner with
no clues at all, because that is the sheet he wants; the game ends inside
five minutes if the player takes it. And he refuses an accusation with fewer
than two, three refusals ending the day as "a fall". The fourth bell ends the
day the same way. So the corridor is gone: eleven wrong accusations are
reachable and two of them are easy.

**How long.** Sixty minutes first play. Four watches of about twelve minutes
each, plus the accusation and epilogue. What fills it: the walk (a circuit of
the walls is a minute), twelve conversations at three to five lines each
across four states, sixteen pieces of physical evidence in eleven rooms on
three levels, four time-gated things that vanish or appear on a bell, one
word-lock, and the journal work of noticing that two statements disagree.

**How much is data.** All of it. `data/mystery.json` (clues, evidence, the
schedule, the presses, the accusation), `data/npcs.json` (bodies and every
line, keyed by state as now), `data/quest.json` (the frame: four stages), and
`data/riddle.json` (the word-lock). `src/mystery.js` is the validator and the
engine, pure, and the manager applies its effects to the UI the way
`quest-manager.js` does today. The schemas are in Phase 1.

### The crime

The night before the game, Hywel ap Gruffudd, master mason, was pushed down
the Chapel Tower stair by Master Robert Ferrour, Clerk of Works, and died at
its foot. Hywel had been keeping a private tally of the lead delivered for the
roofs: 340 sheets received, 212 laid, and he had worked out where the other
128 went. Robert had been selling them by the cartload to Thomas Wykes, a
town merchant, on gate passes signed by Piers Marrable, the Constable's
steward, who took a third and entered the missing sheets as "wastage" in the
works ledger in his own hand.

Hywel took his tallies to Piers. Piers panicked and wrote a note: *Come at
the second bell, the chapel roof, bring your tallies. P.M.* He meant Robert
to meet Hywel there and buy him. Hywel went to the inner ward at Compline,
told the porter the Steward had sent for him about the chapel roof, and was
let through the porter's gate: the one crossing, logged. Robert did not use
the gate. He went up the Kitchen Tower stair in the outer ward, east along the
north wall walk past the sentry's post, through the Stockhouse Tower's walk
door, which the porter had not barred, and down the King's Tower stair into
the inner ward. On the Chapel Tower stair, by the one candle at its first
turn, the two argued. Robert pushed. He went down to the body, took the
bundle of eleven tally sticks from Hywel's belt, set the lantern upright on
the step out of some reflex, and left by the same walk, this time along the
south side, dropping one tally stick in the gutter by the Bakehouse Tower's
walk door, and down the Prison Tower stair to his lodging. His fur-trimmed
cloak, hem stiff with the stair candle's tallow, went to the laundry at dawn
by his boy's hand. The Constable found the body at first light, saw the
lantern, and decided the mason had been drunk.

### The cast

Twelve. Bodies are the three on disk, told apart by a per-NPC `tint`
(Phase 6, #417); a fourth model is a question for Devon, not a phase's call.

| Id | Name | Role | Ward | The lie |
| --- | --- | --- | --- | --- |
| `constable` | Sir Roger Lestrange | Constable | inner | none; he wants a fall and says so |
| `steward` | Piers Marrable | Steward | inner | "I sent no summons. The roof is sound." |
| `clerk` | Master Robert Ferrour | Clerk of Works | outer | "Abed in my lodging from Compline." |
| `porter` | Gwilym | Porter of the cross-wall gate | inner | "The walk door at my tower, barred as always." |
| `cook` | Marged | Cook | outer | none |
| `chaplain` | Father Anselm | Chaplain | inner | "I sleep sound. I heard nothing." (fear, not guilt) |
| `sentry` | Dafydd ap Rhys | Garrison, night watch on the north walk | outer | none |
| `apprentice` | Ieuan | Hywel's apprentice | outer | none |
| `laundress` | Nest | Laundress, the prisoner's wife | outer | none |
| `prisoner` | Madoc the smith | Held for the lead theft | outer (PT) | none; nobody believes him |
| `merchant` | Thomas Wykes | Town merchant, at Terce only | outer | "Dressed stone. I buy stone." |
| `lady` | Lady Alys | The Constable's wife | inner, level 1 | none |

The two wards are two populations. The inner ward is the Constable's
household and the porter; the outer ward is the works and the garrison. The
porter's gate is the only crossing at ground level and the porter logs it.
The wall walk is the crossing nobody logs.

### The schedule

Four watches. The bell in the chapel (CT) advances the watch when the player
rings it; the fourth ring ends the day. An NPC's station is a room id and a
tile position; `null` is "not in the castle". Phase 6 fills the positions.

| Id | Prime | Terce | Sext | Vespers |
| --- | --- | --- | --- | --- |
| `constable` | CT, at the body | KH | KH | GH, high table |
| `steward` | KH | SC | KH | GH |
| `clerk` | CL | outer ward, at the cart | CL | GH |
| `porter` | ST | ST | ST | the cross-wall walk, level 2 |
| `cook` | KI | KI | KI | GH |
| `chaplain` | CT, at the body | CT | CT | CT |
| `sentry` | NW, asleep | north walk by KT, level 2 | north walk by KT | GH |
| `apprentice` | ML | ML | ML | CT, the vigil |
| `laundress` | SW | SW | outer ward, a patrol along the washing line | GH |
| `prisoner` | PT | PT | PT | PT |
| `merchant` | null | outer ward, at the cart by WG | null | null |
| `lady` | royal apartments | royal apartments | GD, the garden | royal apartments |

Time-gated evidence: the body is at the stair foot at Prime only and is in
the chapel under a sheet from Terce; Hywel's effects (the pouch) are on the
body at Prime and on the chaplain's table from Terce; the cloak is in the
laundry at Prime and Terce and is washed by Sext (the wax is gone); the
merchant's cart is in the outer ward at Terce only.

### The clues

Thirty-eight, in the shape `data/mystery.json` will hold them. `S` is a statement
(granted when an NPC in that state finishes speaking), `E` is evidence (an
examinable object in a room, available in the listed watches), `D` is a
deduction (granted the moment its premises are both held), `L` a location
(granted on entering a place). `herring` marks a clue that leads nowhere on
purpose; the validator makes a session say so.

| Id | Kind | Source | What it says |
| --- | --- | --- | --- |
| `body-stair` | E | CT stair foot, Prime | Hywel, dead; a lantern beside him, upright, glass whole |
| `cook-lantern` | S | cook / default | He took the kitchen lantern at Compline, "called to the inner ward, the chapel roof" |
| `lantern-set-down` | D | body-stair + cook-lantern | A lantern that fell with him would have broken. Someone stood it up |
| `porter-log` | S | porter / default | Let the mason through at Compline on the Steward's word; nobody else, either way; gate barred |
| `porter-barred` | S | porter / default | "And the walk door at my tower, barred as always" |
| `summons-note` | E | the pouch: body at Prime, chaplain's table from Terce | "Come at the second bell, the chapel roof, bring your tallies. P.M." |
| `steward-denies` | S | steward / default | "I sent no summons. The roof is sound. He was drunk" |
| `constable-accident` | S | constable / default | "He fell. The inspector is tomorrow. A clean sheet by Vespers" |
| `hywel-sober` | S | apprentice / default | Hywel never drank on a working day, and yesterday was one |
| `apprentice-tallies` | S | apprentice / default | Eleven tally sticks on his belt, one notch a sheet; 212 sheets laid, by his count |
| `pouch-empty` | E | the pouch, same as summons-note | The pouch: the note, a knife, no tally sticks |
| `tallies-taken` | D | apprentice-tallies + pouch-empty | Eleven sticks left with him and none came back |
| `lady-hand` | S | lady / default | "Piers writes his sevens like gallows. Everyone in this ward knows his hand" |
| `summons-is-stewards` | D | summons-note + lady-hand | The note is in the Steward's hand |
| `steward-admits` | S | steward / pressed, on summons-is-stewards | "I sent him to be talked to. By Robert. Not to the stair" |
| `sentry-sighting` | S | sentry / default, Terce or Sext (asleep at Prime) | A fur-trimmed cloak went east along the north walk at the second bell. "The Clerk's the only man in the works with fur on him" |
| `clerk-abed` | S | clerk / default | Abed from Compline; the lead is "sheet-perfect" |
| `cloak-wax` | E | SW laundry, Prime and Terce | A fur-trimmed cloak, the hem stiff with tallow, outer-ward mud on the fur |
| `laundress-cloak` | S | laundress / default | "The Clerk's. His boy brought it down at first light" |
| `chapel-candle` | E | CT stair, first turn, all day | One tallow candle in a pricket; wax pooled on the step below it |
| `wax-matches` | D | cloak-wax + chapel-candle | Tallow on the hem, tallow on the stair. The cloak was on that stair |
| `clerk-cloak` | S | clerk / pressed, on wax-matches | "That cloak has been in the laundry since Sunday" (contradicts laundress-cloak) |
| `walk-crosses` | L | level 2 over the cross-wall line, all day | The walk runs over the cross-wall. The wards are one ward up here |
| `door-unbarred` | E | ST level 2, the walk door, all day | The bar leaning on the wall; dust on the brackets undisturbed for days |
| `porter-admits` | S | porter / pressed, on door-unbarred | "I was in my cups. It has not been barred this month. A hanging matter to say so" |
| `chaplain-feet` | S | chaplain / pressed, on steward-admits | "Two men on the stair at the second bell. Voices. Then one man, going up" |
| `lady-window` | S | lady / pressed, on walk-crosses | From her window: one lantern going up the Chapel Tower stair, and later a shadow along the south walk, westward |
| `tally-on-walk` | E | south walk gutter by BT's door, level 2, all day | A tally stick, eleven notches, mason's marks |
| `prisoner-story` | S | prisoner / default | "The lead went out the gate on a cart, by daylight, with the Clerk's seal on the pass" |
| `merchant-stone` | S | merchant / default, Terce | "Dressed stone. I buy stone" |
| `merchant-cart` | E | outer ward by WG, Terce | Under the sacking, rolled lead sheets with the King's mark |
| `merchant-admits` | S | merchant / pressed, on merchant-cart | "The Clerk sells. The Steward signs the pass. I only buy" |
| `word-lock` | E | KG door, all day | The Clerk's conceit: a riddle for a lock. Answer it and the door opens |
| `ledger` | E | KG, after the lock | 340 received, 212 laid, "wastage 128" in the Steward's sevens |
| `lead-sold` | D | ledger + apprentice-tallies | 212 laid is the apprentice's count too. The 128 are not wastage; they left on a cart |
| `clerk-cornered` | S | clerk / pressed, on lead-sold | "Wastage is a mason's word." He does not confess; it contradicts `clerk-abed`'s "sheet-perfect" |
| `knife-missing` | S | cook / default | A kitchen knife gone since yesterday. `herring` |
| `knife-found` | E | BT, all day | The knife, in the bakehouse, flour on it. `herring` |
| `nest-is-wife` | S | laundress / pressed, on prisoner-story | Madoc is her husband. She has no reason to lie for the Clerk and one to lie against him. `herring` |

Thirty-eight rows: thirty-five on a path to the accusation and three
herrings. The riddle in
`riddle.json` becomes the word-lock's riddle (#416): *I have a bed but never
sleep, a mouth but never eat, I run and never walk.* Answer: a river, the one
the castle stands on. `judgeAnswer`, the hint, the escalating wrong answers
and the overlay all survive unchanged.

### The accusation

The Constable takes the accusation whenever the player asks him for it, or
demands it at the fourth bell. The player names one of the twelve or "no
one, a fall" and presents up to three clues from the journal.

```
"accusation": {
  "judge": "constable",
  "truth": { "who": "clerk", "motive": "lead-sold" },
  "convicts": {
    "clerk":   ["sentry-sighting", "wax-matches", "tally-on-walk", "lady-window", "chaplain-feet"],
    "steward": ["summons-is-stewards", "steward-admits", "lead-sold", "merchant-admits"],
    "porter":  ["porter-admits", "porter-barred"],
    "prisoner": [],
    "merchant": ["merchant-cart", "merchant-admits"]
  },
  "needs": 2,
  "refusals": 3,
  "verdicts": { "<who>": { "convicted": "…", "epilogue": "…" }, "nobody": { … } }
}
```

Outcomes: the Clerk with two convicting clues and `lead-sold` among the three
is the full ending (the Clerk hangs, the Steward is taken, the lead is
found in the town). The Clerk without `lead-sold` is the right hanging and the
Steward keeps his post. The Steward with two of his four is a wrong hanging
of a guilty man for the wrong crime, and the Clerk walks. The porter, the
merchant: wrong hangings. The prisoner: accepted on nothing, the ending the
Constable wanted. Anyone else: refused. "A fall": the Constable is relieved,
the inspector signs, and the epilogue counts the sheets still leaving.

### The intended path

Prime (CT, the body and the pouch; KI, the cook; ST, the porter; SW, the
cloak; ML, the apprentice; CT, the chaplain says nothing yet). Ring the bell.
Terce (the cart and the merchant; KT stair up to the walk, the sentry's
sighting; east along the walk to the Stockhouse door, `walk-crosses` and
`door-unbarred`; on round the south side, `tally-on-walk`). Ring. Sext (KG
stair up to the lady, `lady-hand` and, presented with `walk-crosses`,
`lady-window`; the Steward, presented with `summons-is-stewards`; the
chaplain, presented with `steward-admits`; the word-lock and the ledger,
which with the apprentice's count is `lead-sold`; the Clerk, presented with
it). Ring. Vespers (the porter on the cross-wall
walk, presented with `door-unbarred`; the Constable, in the Great Hall, with
everybody; accuse the Clerk on `sentry-sighting`, `wax-matches`, `lead-sold`).
Twenty-two interactions on the shortest full-ending path; the validator
holds the shortest convicting path to no fewer than two watches and no more
than three, so it is neither solvable at Prime nor lost by Vespers.

## Conventions a new builder must know

- **No build step, ever, and zero offsite requests** (`CLAUDE.md`). Plain ES
  modules from the repo root, three.js in `libs/`, every map and model
  vendored. **Each project vendors its own copy** (#17): the eight sets live
  under this project's `assets/Poly Haven/`, and a shared pipeline is rank 12's
  problem, not this project's.
- **Add an asset and its reference in the same commit** (#390).
  `test/assets.mjs` is a reachability check: a file under `assets/Poly Haven`
  or `assets/NPCs` has to be named by `data/`, directly or as a buffer or
  image of a `.gltf` `data/` names. Restoring one set without a reference
  produced three unreferenced-file failures and a rolled-up fourth on
  2026-09-14, and `node test/assets.mjs` exited 1. Restore `textures/` only,
  never the folder above it: every Poly Haven texture pack's `.gltf` is a
  material-preview ball with a 2.3 MB `.bin`, and one was once the gate.
- **The save key is `castleConundrumSave_v1` and it never changes** (#36,
  #413). There was no key before Phase 1, so #36 did not bind when the key
  was chosen; it binds from the moment it ships. `migrate` is for version
  drift, `repair` runs on every load (#37), and `repair` filters every id in
  the save against a catalog built from `mystery.json`, never against a list
  written beside it.
- **A check that only prints is ignored** (#13); **a guard-rail is broken on
  purpose once from a green baseline** (#34), and the break has to be caught
  by the assertion whose comment claims it. `layout.mjs` re-implementing the
  builder was this project's own instance of the failure #34 describes; Phase 2
  ended it. There is one copy of the placement math now, `src/castle-plan.js`,
  and the game, `layout.mjs` and `plan-vs-scene.mjs` all read it.
- **A real-time movement assertion under software-rendered Chromium is
  inconclusive** (#53). Every exit criterion below that says *GPU* is one
  `npm run play` verifies and nothing in CI can; every phase also has a Node
  criterion so no phase is blocked on hardware nobody has.
- **`play-castle.mjs` hard-codes NPC positions** (`SCHOLAR`, `GUARD`, lines 40
  and 41). A phase that moves an NPC moves those; Phase 6 makes the file read
  stations from data so that stops being true.
- **Windows is the dev machine.** Absolute `import()` paths through
  `pathToFileURL`; no shell brace expansion. **The invocations, from
  `Projects/Castle Conundrum`:** `node test/assets.mjs`, `node test/layout.mjs`,
  `node test/quest.mjs`, `node test/mystery.mjs`, `node test/save.mjs` and
  `node test/plan-vs-scene.mjs` — all six in the CI matrix as of Phase 2, whose
  entry now carries `install: Tools/board-check` because the last of them
  borrows `harness.mjs`. `plan-vs-scene.mjs` opens headless Chromium and is in
  CI anyway: it moves nothing and times nothing, which is the line #53 draws.
  From `Tools/board-check`: `npm run play`, headed, GPU, hand-run.
- **Writing style.** Direct, numbers over adjectives, no em dashes, never
  "comprehensive" or "robust".

## Questions for Devon

Two open, in `BACKLOG.md`'s table as Q54 and Q57; Q55 was answered by Phase 7's
session, as the plan below said (#490). Only where the answer
changes the work; everything else is decided below and in `HISTORY.md` (#411 to
#420).

**Four are answered**, and the numbering below is unchanged so the Q numbers
still line up:

- **Q53, twelve NPCs from three bodies or a fourth model: tints** (#419), and
  **Phase 1 writes the tint**, not Phase 6, because Phase 1 already replaces the
  three NPCs with twelve in `npcs.json` and a hex per NPC costs nothing while
  that file is open. The risk below is accepted, not removed.
- **Q58, ranks 1 to 7: yes** (#420). The phases stay at the top. No other
  project is worked until the arc finishes.

2. **A death, or only a theft?** The mystery as written is a killing made to
   look like a fall, with a hanging at the end. A theft-only version is a
   different cast and a different clue graph. Changes Phase 1.
3. **The fourth bell forces the accusation.** *Answered by Phase 7's session,
   2026-09-15: yes, as written* (#490, Q55), because it was the one question
   standing in front of that row. Phase 1 had already shipped the engine half —
   `ring()`'s fourth moves no watch, returns a `demand` and emits `bell:4` — so
   the open-day alternative meant unpicking a green rail rather than not writing
   one. `bell:4` moves the frame to `accusing` and its `enter` opens the panel.
   The player can still ask for it at any time by talking to the Constable; what
   the bell removes is never answering.
4. **The riddle survives as the muniment room's word-lock.** *Answered by
   Phase 4's session, 2026-09-14: yes* (#447, Q56), because it was the one
   question standing in front of that row. `openRiddle` runs on `lock:muniment`,
   the Scholar points at the door instead of posing anything, and `riddle.json`
   carries the river riddle. Retiring the overlay is still Phase 7's to do, and
   this leaves it one door and one stage rather than a system.
5. **The barbican gates stay shut forever.** Nothing outside the curtain is
   textured, so the west gate the player arrived through never opens again
   and the east gate opens onto a walled garden. If Devon wants the ending to
   walk out of the castle, that is a texture set that is not on the list.
   Changes Phase 3.
6. **Ranks 1 to 7.** The seven phases were inserted at the top of the ranked
   table with every other row's relative order unchanged (#418). If Devon
   wants them lower, that is one edit.

## The phases

The model convention: **Claude Opus 5** where a suite or a visible result
catches a wrong answer, **Claude Fable 5.1** where a wrong answer is silent:
the mystery's coherence and the save schema (Phase 1), and the player standing
on floor two (Phase 5). Every phase is a 1. A phase is finished when its
branch is a pull request merged to `main` with CI green, `BACKLOG.md`'s
header and this file's phase entry are rewritten to say so, and the closing
report names the next phase's number and model.

The running weight, on the prompt's basis (29 MB today; `git ls-tree` on
`main` reads the tracked bytes as 27.3 MB, so the same sets land at 42.7 on
that basis, and the ceiling is Devon's number either way):

| After | Sets restored | MB |
| --- | --- | --- |
| today | | 29.0 |
| Phase 1 | none | 29.0 |
| Phase 2 | none | 29.0 |
| Phase 3 | castle_wall_slates 2.1, defense_wall 2.0, grassy_cobblestone 2.1 | 35.2 |
| Phase 4 | rock_tile_floor 2.8, floor_tiles_02 0.8, old_planks_02 1.0 | 39.8 |
| Phase 5 | wood_planks 1.6, dirty_carpet 3.0 | 44.4 (`du` reads 44) |
| Phase 6 | none (tints, not bodies) | 44.4 |
| Phase 7 | none | 44.4 |

## Phase 1: The mystery as data, and the save

**Shipped 2026-09-14, PR #306, under Claude Fable 5.1** (#421 to #425). The
content above is `data/mystery.json`, `src/mystery.js` validates it and runs
it in Node, and the page has a save. The page plays exactly the riddle quest
it played before; this was the sim without the page. What the plan below said
and what shipped differ in five places, each a locked decision:

- **`npcs.json` keeps the three under `npcs` and adds the twelve under
  `cast`** (#421), rather than replacing them. The page plays the riddle quest
  on `talked:scholar` and `talked:guard` until Phase 7, Phase 3 moves the
  three and Phase 6 removes them, and `play-castle.mjs` walks to two of them
  by name; replacing them here would have contradicted two later phases and
  broken 34 beats nothing here can run.
- **`quest.json` keeps the riddle quest at the top level and carries the v2
  frame under `frame`** (#422). The save's stage catalog is the union of both
  graphs. Phase 7 promotes `frame` and deletes the riddle stages.
- **The Constable hears no accusation at Prime** (`accusation.from`, #423).
  The clue graph as written above convicts the Clerk in one watch
  (`wax-matches`, `tally-on-walk`, `lead-sold` are all Prime), which the
  two-to-three watch rail caught on the plan's own data. The shortest
  full-ending path is **2 watches and 8 interactions**, not the 3 and 22 the
  exit line below guessed; the prisoner-on-nothing ending is one ring and one
  talk.
- **Thirty-nine clues, not thirty-eight** (#424): the table above has 39 rows,
  36 on a path and 3 herrings. A press carries a `from` list; a clue may
  `contradicts` an earlier statement; a clue is on a path if it convicts,
  contradicts, is a default-state statement, is a herring, or is an ancestor
  (premise, press key, `requires`) of one that is.
- **The engine's API grew** (#425): `talk`, `unlock`, `holds`, `npcState` and
  a `state` getter beyond the list below; `accuse` emits `ask:accuse` itself
  so the frame reaches `accusing` before a verdict; the fourth ring keeps the
  watch at Vespers so the save's clamp to four loses nothing.

Every guard-rail below was broken on disk from a green baseline and named its
break; the table is in PR #306's body and in `HISTORY.md`. `npm run play`'s
reload beat is written and not run (#53). The plan as written follows.

**Size 1. Claude Fable 5.1.** The content above becomes `data/mystery.json`,
`src/mystery.js` validates it and runs it in Node, and the page gains a save.
The page otherwise plays exactly the riddle quest it plays today; this is the
sim without the page.

- [x] **`data/mystery.json`.** `watches` (four ids), `rooms` (id, ward, level,
  name; positions come in Phase 3 from the plan), `clues` (id, kind, title,
  text, `source`: `{npc, state}` for S, `{evidence}` for E, `{premises}` for
  D, `{room, level}` for L; `herring`), `evidence` (id, room, `watches`,
  `clue`, `requires` for the ledger behind the lock, `prop` naming a kit or
  Poly Haven model already on disk), `schedule` (npc → watch → `{room,
  tile, facing}` or `null`), `presses` (npc, `on` clue, `to` state), and
  `accusation` as written above. Every line of dialogue stays in
  `data/npcs.json`, keyed by state, for the twelve; the three current NPCs
  are replaced by the twelve in this file even though only three bodies
  exist, because `assets.mjs` checks bodies, not ids, and `npc.js` already
  keys nothing off an id. **Each of the twelve carries its `tint`** (a hex the
  body's main material is multiplied by) and names one of the three bodies,
  written here rather than in Phase 6 (#419): the file is open anyway, and a
  second pass over twelve entries five phases later buys nothing. Nothing reads
  `tint` until Phase 6; it is data waiting for its renderer.
- [x] **`data/quest.json` grows to the frame:** `arrive` (Prime, before the
  Constable has spoken), `investigate` (on `talked:constable`), `accusing`
  (on `bell:4` or `ask:accuse`), and one terminal per verdict class
  (`verdict:full`, `verdict:right`, `verdict:wrong`, `verdict:fall`). New
  events: `bell:<n>`, `clue:<id>`, `press:<npc>:<clue>`, `accused:<who>`.
  New actions the manager lists: `ringBell`, `openJournal`, `openAccusation`,
  `showEpilogue`. `validateQuest` is unchanged and already allows several
  terminals.
- [x] **`src/mystery.js`, pure.** `validateMystery(mystery, npcs, quest)`
  returns problems; `createMystery({mystery, npcs, state})` returns
  `{discover(clueId), press(npc, clueId), ring(), enter(room, level),
  examine(evidenceId), accuse(who, clueIds), available(npc), stationOf(npc),
  journal()}`, every call returning effects the manager applies. Discovery
  is a fixed point: a D clue lands the instant both premises are held, a
  press moves an NPC only if the clue is held and the NPC is in the state
  the press leaves from.
- [x] **What the validator rejects,** each with a message that names the id:
  a clue with no source; a source naming an npc or state not in `npcs.json`;
  an npc state no press and no stage reaches; an evidence in no room, in no
  watch, or in a room the schedule never lets the player reach (Phase 3 wires
  the plan in; until then every room is reachable); a statement only
  available at a watch the npc is `null`; a press on a clue that cannot be
  held before the state it leaves from is reached (a cycle); a deduction
  whose premises are not both discoverable; a clue that is an ancestor of no
  convicting clue (as a premise or a press key), contradicts nothing, is not
  a `default`-state statement, and is not marked `herring`; a `convicts` entry naming an
  undiscoverable clue; an accusable with no verdict text; a `truth.who` with
  a `convicts` list shorter than `needs`; and the two length rails, the
  shortest convicting path under two watches or over three. Plus every
  `{TOKEN}` check `validateAgainstNpcs` does today.
- [x] **`test/mystery.mjs`.** Validates; computes discoverability and prints
  the shortest path in watches and interactions; drives `createMystery`
  through the intended path above and asserts the full ending, then the
  prisoner on nothing, the Steward on two, the porter on one (refused), and
  three refusals ending as a fall. Breaks from green, each named in the
  closing report: delete `lady-hand`'s source (`summons-is-stewards: premise
  lady-hand is discoverable from nothing`); delete the `steward-admits`
  press (`chaplain-feet: its press is on a clue that cannot be held`); make
  `sentry-sighting` available at Prime only while the sentry is asleep in NW
  (`available at prime, when the sentry cannot be spoken to about it`); drop
  the `herring` flag off `knife-found` (`knife-found: on no path to any
  accusation`). In the CI matrix.
- [x] **The save.** `src/save.js` imports `../../../assets/js/gvb-save.js` and
  builds one slot: `game: "castle-conundrum"`, `key: "castleConundrumSave_v1"`,
  `version: 1`. The schema, complete now so no later phase adds a field:
  `{stage, watch, clues[], pressed{npc: state[]}, taken[], locks[],
  accusations[{who, clues, verdict, watch}], refusals, riddleWrong,
  player{x, y, z, yaw} | null}`. `validate` refuses a non-object and a
  non-string stage; `repair` builds its catalog from `mystery.json` and
  `quest.json` (the ids `repair` accepts cannot drift from the ids the game
  renders), drops unknown ids from every list, resets a stage the graph does
  not have to `start`, clamps `watch` to the four, and nulls a `player` with
  a non-finite coordinate. Saved through `autosave` on every effect the
  manager applies. `test/save.mjs` asserts every rail twice, the repaired
  value and what goes wrong without it, section 10 style.
- [x] **The page adopts it,** for the riddle quest: `main.js` loads the slot,
  begins the graph at the saved stage, restores `riddleWrong` and the player's
  position, and the victory screen's button calls `slot.reset()` before the
  reload. A reload mid-quest resumes mid-quest. `play-castle.mjs` gains one
  beat: reload after the riddle and assert the objective still says
  Keystone. That beat is GPU; the Node criterion is `test/save.mjs`.

**Guard-rail:** the validator's rails, broken four ways above, and the
`repair` rails in `test/save.mjs`. **Exit:** `node test/mystery.mjs` green
with the shortest full-ending path printed at 3 watches and 22 interactions;
`node test/save.mjs` green; the riddle quest resumes after a reload (GPU, one
`npm run play` beat). **Weight:** 29.0 MB, nothing restored. **Model:** Fable,
because the mystery's coherence and the save schema are the two things in
this plan a wrong answer to is silent.

## Phase 2: The plan the builder and the suite both read

**Shipped 2026-09-14, PR #309, under Claude Opus 5** (#426 to #431).
`src/castle-plan.js` is the placement math, once. `castle-builder.js` loads
what the plan names and applies the transform the plan computed; it works out
no position, no scale and no collider box of its own. `test/layout.mjs` reads
the same plan, so the header it used to carry — "it cannot catch a change to
that math" — is gone. `test/plan-vs-scene.mjs` holds the two together against
the running page: **all 59 pieces are within 0.0000 m of their plan box.**

What the plan below said and what shipped differ in six places, each a locked
decision:

- **`boundsOf(modelPath)` returns `{parts}`, not a `Box3`** (#426). three's
  `Box3.setFromObject` never measures vertices: it transforms the eight corners
  of each MESH's own `geometry.boundingBox` by that mesh's `matrixWorld` and
  unions the results, and GLTFLoader makes one mesh per glTF primitive. A
  placed model's runtime box is therefore not a function of its whole-model
  box. Collapsing `parts` to one box and re-running `plan-vs-scene.mjs` puts
  brass_candleholders 0.129 m and GothicCabinet_01 0.113 m away from the
  castle the browser builds, against a 0.01 m tolerance. The cabinet is the
  instructive one: it is placed at 90 degrees, where rotating corners is exact,
  and it is still wrong, because its four doors are separate nodes rotated open
  and three boxes each of those separately.
- **The gatehouse was open, and `sealed()` found it the first time it ran**
  (#427). `gate-arch` carried `noCollide: true` with the comment "a doorway is
  meant to have a hole in it". The piece is 4 m wide and its doorway is 1.9 m,
  so the exemption left **two 1.05 m strips of walk-through stone** either side
  of a shut gate — wider than the 0.9 m player. `archColliders` gives the piece
  two jambs and a lintel now, sized from `gateDoor.leaf`, which `assets.mjs`
  already holds to the model's measured opening. `noCollide` also means one
  thing everywhere now: re-adding it to `gate-arch` used to be a silent no-op.
- **A collider blocks a whole cell, not the point at its centre** (#428). The
  first run of the grid flooded the entire 140 m ground plane through a shut
  gate: the leaf is 0.16 m thick and no 0.5 m cell centre lands inside it, so a
  centre test steps over any wall thinner than the grid. Overlapping the cell's
  square is also the truer model of a body, which is 0.9 m across — wider than
  a cell.
- **The leak message names where the fill crossed, recorded during the fill**
  (#429). Picking "the leak" out of the finished set afterwards does not work: a
  breach floods 75,228 cells, and any after-the-fact sort then points at one of
  them that has nothing to do with the hole. The first version said the castle
  leaked at (-14.25, 0.25) for a hole at (0, -14), and reported "9999 cells"
  because 9999 was the limit it had asked for.
- **Removing the END piece of the north run is green, and correctly so**
  (#430). The plan's break says "remove one `wall.glb` from the north run";
  `count: 7` to `6` drops the tile-3 piece, and the hole it leaves at
  x 10..14, z -14..-10 is walled off from the interior by the east wall's own
  end and is reachable from nothing. Dropping the MIDDLE piece is the break
  that bites: 75,228 cells outside, the fill stepping through at (-1.75,
  -14.25) and (0.25, -14.25), which is exactly the missing piece's span.
- **`plan-vs-scene.mjs` is in the CI matrix** (#431), three runs, three passes,
  6 s each. Its matrix entry carries `install: Tools/board-check` for
  `harness.mjs`. It clears the save from a cheap page on the same origin rather
  than loading the game and reloading it: the reload aborts the model requests
  the first load had in flight and `page.__errs` outlives the navigation, so
  the run ends by reporting a missing `wall.glb` that loaded fine.

`data/scene-config.json` gained `rooms` (two today, the great hall and the
courtyard, bounds measured off the plan) and a `curtain: true` flag on the five
outer wall runs, the two towers and the gate archway, from which the plan
derives the curtain rectangle `sealed()` tests against. **Weight: 29.0 MB,
nothing restored.** `npm run play` is unrun here (#53) and no beat of it touches
the gate's jambs: the quest ends at the gate opening and the victory screen, and
nothing in it walks through the archway.

## Phase 3: The shell: two wards, eight drums, a cross-wall

**Shipped 2026-09-14, PR #312, under Claude Opus 5** (#432 to #438). 219
pieces, all within 0.0000 m of the running page. 29.0 MB to 35. The plan
below is what it was asked to do; that session left this line off and Phase
4's put it here, so the next reader does not take a shipped phase for an open
one.

**Size 1. Claude Opus 5.** The layout above, at ground level, without the
rooms inside it. The old 7x7 courtyard and its hall go.

- [ ] **`scene-config.json` grows a `walls` section:** runs of built geometry
  (`{from, to, height, thickness, material, level}`) that the builder emits
  as one `BoxGeometry` per run with planar UVs at a world-space repeat (one
  repeat per 3 m, so a 4 m tile shows 1.33 repeats of the 1k map and reads
  as coursed stone rather than a smeared texture), and `drums`
  (`{tile, radius, height, material, turret}`) as `CylinderGeometry`, both
  through `loadPBRMaterial`. The curtain is `castle_wall_slates`, the drums
  and cross-wall `defense_wall`. Battlements along the top of every run and
  around every drum from `battlement.glb` and its corners, at 4x.
- [ ] **Two grounds.** The outer ward is a `grassy_cobblestone` plane over
  x -8..-1; the inner ward, the two barbicans and the tower floors stay
  `stone_pavers`. The 140 m ground plane shrinks to the curtain's footprint
  plus 2 m; outside it is fog.
- [ ] **Three gates.** The west gate and the east gate reuse `buildGateLeaf`
  and `wooden_gate_1k` and never open; the porter's gate through the
  cross-wall is a third leaf with an `id` the quest can open and close (it is
  open all day; it is the *logged* crossing, not a locked one). The
  `wall-fortified-gate.glb` archway is kept for all three; the leaf-fit check
  in `assets.mjs` now runs per gate.
- [ ] **The spawn moves** to the west barbican, tile (-10, 0), facing east.
  The three current NPCs move to stations that exist: the Guard to the
  porter's gate, the Scholar to the King's Hall's site, the Wizard's patrol to
  the outer ward. `SCHOLAR` and `GUARD` in `play-castle.mjs` move with them.
- [ ] **`rooms` in `scene-config.json`** for every ground room in the table,
  as bounds only; the walls between them come in Phase 4. The plan already
  reports each as reachable because nothing encloses them yet, which is
  fine: the seal is what this phase asserts.

**Guard-rail:** delete one cross-wall run and watch `layout.mjs` fail on
"inner ward reachable at level 0 with the porter's gate closed" (the
walkability fill run once with the gate leaf's collider in place); delete a
curtain run and watch `sealed()` fail. **Exit:** Node suites green including
the seal and the two-ward check; `assets.mjs` shows exactly three new
texture folders and every file in them referenced; `npm run play` walks
barbican to porter's gate to King's Hall (GPU). **Weight:** 35.2 MB
(castle_wall_slates, defense_wall, grassy_cobblestone). **Model:** Opus.

## Phase 4: The ground-floor rooms

**Shipped 2026-09-14, PR #314, under Claude Opus 5** (#439 to #450). Fourteen
rooms, walled, doored and floored, on level 0. 259 pieces, all within
0.0000 m of the running page; 35 MB to 39.8, three texture sets restored.
Twelve rooms are walked into from the spawn, the muniment room opens when the
riddle is answered and the cell never opens, because the bars are its door.

What the plan below said and what shipped differ in six places, each a locked
decision:

- **The doorway is in the drum's own ring, and at six of the eight towers a
  doorway through the run beside it as well** (#439). #433 said a drum on a
  tile-thick wall cannot be entered from the ward and that what opens it is a
  doorway cut through the adjacent run. Half right. A drum is 8 m across on a
  4 m wall, so two metres of every tower stands proud of the wall's inner face
  and the quarter of the ring facing that way is clear of both runs — which is
  all the two mid-run towers (the Larder and the cell) need. At a corner it is
  not enough: the two runs meeting there tile the two quadrants and touch at a
  single point, and the 0.5 m grid cannot cross a diagonal. Those six get a
  1.2 m doorway at the run's own end, inside the drum's footprint so the ring
  still seals it from outside.
- **A tower room is a disc and its bounding square is not the room** (#440).
  Found by walling a tower's doorway shut and watching the suite stay green:
  the room still read "reachable, 4 cells", and the four cells were the ones
  standing *in* the blocked doorway, which is in the ring and inside the
  square. `walkability().rooms()` takes a `shape` now.
- **Which rooms are shut is `mystery.json`'s answer, not the castle's**
  (#441). The first version read the expectation off `door.leaf.closed` — the
  field being tested — so shipping the word-lock open moved the expectation
  with the break. `locks` and the cell's `barred` are facts about the crime;
  the castle has to match them.
- **`wall-door.glb` is not a door frame here** (#446). The plan says "door
  frames from `wall-door.glb` where a doorway needs a lintel". It is authored
  1 x 1 x 1 and `scaleRuleFor` gives every `wall*` piece the depth rule, so it
  arrives 4 m deep in a 1 m partition. The lintel is built stone, cut from the
  run's own box.
- **The riddle is the word-lock, and `openGate` means that leaf** (#447). The
  east gate keeps its archway and never opens again. `openRiddle` runs on
  `lock:muniment`, which is the player pressing E at the door, and `openGate`
  sits on the next stage's `enter` so a save resumed there finds it open.
- **Two colour-only surfaces live in `plainMaterials`** (#448), apart from
  `materials`, so the complete-texture-set rail there goes on meaning what it
  says. The cell's bars and the cloak over the laundry crate are the two.

**Still open from this phase:** `npm run play` is unrun (#53). Its riddle
beats were rewritten for the word-lock and its gate beat now looks up the
`muniment` leaf, and none of that is verified; the GPU exit criterion below
is outstanding.

**Size 1. Claude Opus 5.** Fourteen rooms from the table, walled, doored and
floored, on level 0.

- [ ] **Room walls** as built runs (`defense_wall` inside the drums, plaster
  is not on the list so interior partitions carry `castle_wall_slates` at a
  tighter repeat), doorways as gaps the plan's walkability sees, and door
  frames from `wall-door.glb` where a doorway needs a lintel. Floors: the
  Great Hall and King's Hall on `rock_tile_floor`, the chapel on
  `floor_tiles_02`, the service rooms on `old_planks_02`, per the room table.
- [ ] **The muniment room's word-lock.** A door leaf on the King's Tower's
  west face with `id: "muniment"`; `openRiddle` is repointed at it (the
  Scholar stops posing it), `riddle.json` carries the river riddle, and the
  quest's `riddle:solved` opens this leaf instead of the west gate. The
  riddle overlay, `judgeAnswer`, the hint and the escalation are untouched.
- [ ] **Furniture** from the Poly Haven props on disk and the kit's crates,
  barrels, `structure-poles` for the mason's lodge, a dais in the Great Hall
  from `floor-steps.glb`. Every interior prop goes through the existing
  prop-in-wall check, which now covers fourteen rooms.
- [ ] **The evidence props** get their objects, unexaminable until Phase 7:
  a lantern at the Chapel Tower stair foot, the cloak in the laundry
  (`kite_shield` is the wrong shape; use a built cloth quad over a crate),
  the candle pricket on the stair, the cart by the west gate at Terce (a
  `pulley-crate` and barrels until Phase 6 makes it appear on a bell).

**Guard-rail:** wall a doorway shut and watch `layout.mjs` fail with the
room's id in "unreachable from spawn". **Exit:** fourteen rooms reachable,
none leaking, every prop clear of every wall; `npm run play` enters the
Great Hall, the chapel and the cell's bars (GPU). **Weight:** 39.8 MB
(rock_tile_floor, floor_tiles_02, old_planks_02). **Model:** Opus.

## Phase 5: The upper level and the wall walk

**Shipped 2026-09-15, PR #316, under Claude Fable 5.1** (#451 to #464). Three
levels: slabs at 3.8..4.0 over the Clerk's office, the kitchen and the King's
Hall and in every tower, the wall walk flush with the top of every curtain run
and the cross-wall, fourteen flights, doors in the rings at levels 1 and 2, and
a player whose feet stand on `src/castle-plan.js`'s `standAt`, which is the
function the walkability grid stands on. 307 pieces at 0.0000 m against the
live scene, the camera on the plan's floor in all 36 rooms at 0.0000 m; 39.8 MB
to 44, the two sets restored, the ceiling.

What the plan below said and what shipped differ in eight places, each a
locked decision:

- **The flights are 1.5 m wide, not 2** (#452). Two 2 m flights side by side
  are a 4 m square whose corners sit 2.83 m from the tower's centre, in a ring
  whose inner face is at 2.8. `stairs-stone.glb` is placed per axis at
  3 x 3.9 x 3.9, in an L: the lower flight along z with its foot on the outer
  wall, the upper along x in the outer half rising toward it, 2.05 m of head
  room where they overlap, and the last 0.1 m onto each slab a step.
- **The lower flight stands on the half away from the ground door** (#460). It
  splits the tower floor into two halves joined only through its own footprint,
  and the ring's sector boxes cut the crescents at the diagonals; a body coming
  in on the flight's side cannot reach its foot. Found when the flight's body
  stopped being walkable floor and five towers went dark at once. The chapel's
  candles, lantern and pouch and the laundry's crate moved out of the flights,
  and `layout.mjs` now refuses a prop in one.
- **Two towers have no lower flight** (#455). The cell and the muniment room are
  shut, and a stair from a shut room to the walk is a way round what shuts it:
  the first time every tower had both flights, both rooms read reachable from
  the spawn, down from the walk. The Prison Tower and the King's Tower keep the
  upper flight, standing on a first floor reached from the walk, and the suite
  floods each from its own top room and asks that the ground room stay dark.
- **The level-1 rooms are walled, not railed** (#453). The five partitions
  under them go to 8 m; `wood-floor-railing.glb` is not placed, because no slab
  meets a drop. Lady Alys's window is a doorway with a `base` a metre above her
  floor, and its sill is a box like any other.
- **A level-2 door is sixty degrees** (#454), and its bearing is where the
  decking actually is: the west curtain's inner face is at x -34, which is the
  EAST half of the towers centred at -36, and two doors were first cut on the
  west (#457). The Stockhouse Tower's walk door is a `bar` — an opening with
  nothing to draw while it is open, sealed by its own ring sectors when the
  suite bars it — and the bar leaning beside it is the evidence object.
- **The walk is the curtain and the cross-wall, and the Stockhouse door is its
  one crossing** (#461). Decking is 2 m, flush with the wall's top, sunk into
  the stone and drawn polygon-offset, cut back to every drum's outer circle.
  The Bakehouse Tower has no west door, so the outer ward's south walk ends at
  its ring and only the Stockhouse door joins the wards two storeys up; the
  barbican and garden walls carry no walk. Three runs of stone go over the
  gates, so the west and east walks are continuous and the cross-wall walk runs
  over the porter's head.
- **A floor is a collider whatever its thickness** (#458). Slabs and decks were
  under the 0.3 m decor threshold and never blocked anyone, so the wells cut for
  the flights were needed by nothing; taking them out left every suite green.
- **Merlons stop at towers and at T-junctions** (#456). A run's last merlon
  reached through the ring into the tower's top room, and the barbicans' last
  merlons stood across the west walk. Two walls turning a corner each keep
  theirs. The hollow drums are roofed.

**Still open from this phase:** `npm run play` is unrun (#53). Its walk beat
climbs the Kitchen Tower, walks the north curtain east, crosses the cross-wall
and comes down the Bakehouse Tower, reading 5.7, 9.7 and 1.7 off the camera;
none of it has been seen on a GPU, and the wishlist's own warning stands: a
walk that clips through a deck on a software renderer is a walk to re-run on a
real one before it is called a bug.

**Size 1. Claude Fable 5.1.** The part of this plan that is genuinely
unsolved: the player standing on floor two, and the suite knowing it.

- [x] **Surfaces with height.** Level-one slabs as built `BoxGeometry`
  3.8..4.0 m carrying `wood_planks`, `dirty_carpet` over the King's Hall;
  the wall walk as 2 m decking at y 8 along every run and the cross-wall;
  `stairs-stone.glb` in the eight towers, two per tower, entered in the plan
  as ramps (`slope: {from: 0, to: 4}` over the piece's own run, read from
  its bounds). Floor edges from `wood-floor-railing.glb` where a slab meets a
  drop; battlements already on the outer edge of the walk.
- [x] **The player has a `y`.** `PlayerController` asks the plan for the
  highest standable surface under the player within 0.35 m of the current
  feet height and stands the eye 1.7 m above it; ramps interpolate. Colliders
  are tested in a band relative to the feet (`feet + 0.3` to `feet + 1.9`),
  so a level-one wall does not stop a walker on the wall walk and the walk's
  parapet does. No jumping, no falling: a step down over 0.35 m is a wall.
  The interaction ray already uses world positions and needs no change; NPCs
  gain `level` in their station so a level-two porter is not walked to at
  ground.
- [x] **`walkability` grows the second and third levels** for real, and the
  checks that the mystery's geometry holds: the cross-wall walk connects the
  north and south curtain walks at level 2 (`walk-crosses` is a place a
  player can stand on); with the Stockhouse Tower's walk door collider
  closed, the wards do *not* connect at level 2 (the porter's bar works when
  it is barred); every tower's level 1 and level 2 rooms are reachable from
  its stair; no reachable cell has a ceiling under 1.9 m.
- [x] **`plan-vs-scene.mjs` grows a standing beat:** teleport the camera to
  every room's anchor on every level and assert the plan's floor height there
  equals the surface the runtime reports, to 0.01 m. Headless, no movement.

**Guard-rail:** delete the Kitchen Tower's lower stair and watch `layout.mjs`
fail with "garrison dormitory unreachable"; lower the royal apartments' slab
to 1.6 m and watch the head-clearance rail fail under it; bar the Stockhouse
walk door in the config and watch "level 2 connects the wards" fail, then
unbar it and watch "barred door separates them" fail when the door is
removed entirely. **Exit:** all Node suites green with the three-level fill
printed (cells per level); `npm run play` climbs the Kitchen Tower stair,
walks the north curtain, crosses over the cross-wall, comes down the King's
Tower stair and reports the camera at y 9.7 on the walk and 1.7 in the ward
(GPU, and the one criterion in this plan that #53 makes inconclusive
elsewhere: a walk that clips through the deck on a software renderer is a
walk to re-run on a real one before it is called a bug). **Weight:** 44.4 MB
(wood_planks, dirty_carpet), the ceiling. **Model:** Fable; a player falling
through a floor is silent to every CI check, and the surface arithmetic is a
model layer with invariants nothing on screen shows until somebody stands on
it.

## Phase 6: Twelve NPCs on four bells

**Shipped 2026-09-15, PR #318, under Claude Opus 5** (#465 to #476). The cast is
on the screen: twelve bodies, three models and a tint each, standing where
`data/mystery.json`'s schedule says at the bell the game is on. The bell is a
crank and a rope in the chapel; ringing it moves the watch, and the watch moves
the sky, the evidence that is only there at some bells, and twelve people, each
walking the breadth-first route from where they stand to where they are due, on
the same grid the player walks. `test/mystery.mjs` 100 assertions to 113,
`test/plan-vs-scene.mjs` 7 to 16. 44 MB and nothing restored.

What the plan below said and what shipped differ in seven places, each a
locked decision:

- **A station is a tile, not a room** (#466). Six people stand in the Great Hall
  at Vespers and each of them has to be somewhere the player can walk up to and
  talk to alone, so every station in the schedule carries a fractional `tile` in
  `scene-config.json`'s own units. `src/stations.js` is the new file that turns
  one into a world point and a walk.
- **The validator takes a nav and asks five things of every station** (#467):
  floor under it, the room it names around it, 1.5 m between any two bodies at
  one bell, the player able to walk to it (or, for the one barred room, to
  within talking range of its bars), and a walk from the station before it.
- **Lady Alys leaves the garden** (#469). Her Sext station was the east barbican
  garden, which is behind a gate that never opens: nobody could ever have walked
  to her there and no rail before this one could say so. She takes the air in
  the inner ward.
- **A station carries the floor's height, not just its level** (#470), and the
  first version of the browser check could not tell: both sides read `h ?? 0`,
  so Lady Alys stood on the ground floor inside the King's Hall and every
  assertion agreed she was where she should be.
- **The tint clones the material first** (#471). Three.js shares materials
  across every clone of a cached glTF, so tinting in place repaints everyone
  wearing the same body. Skin, eyes, brows and hair are left alone.
- **The three of v1 are gone and the riddle quest ends on the Constable** (#472),
  with every stage in `default`: none of the twelve has a `hasKeystone` line, and
  writing twelve of them for three stages Phase 7 deletes is content with an
  expiry date on it. `npcs.json` is the twelve now, and Dafydd carries the mace
  the Guard left behind.
- **Anything the player presses E at is held clear of the stone** (#473). The
  bell's first tile put 0.9 m of its box inside the Chapel Tower's ring while its
  own tile point stood on clear floor, and the only thing that said so was
  `interaction.js` refusing to offer a prompt through stone.

**The break the plan named ran green** (#475). Walling the kitchen's south door
does not strand the cook: the Kitchen Tower's own ground door opens into the
kitchen and its stair runs to the wall walk, so she goes out through the larder,
along the north walk, down another tower and into the hall, 195 cells instead of
47. That is Phase 5's lesson arriving a second time. The suite asserts both
halves now: one door walled leaves her a way round, and both doors walled
produces `cook: no path from KI at sext to GH at vespers`.

**`npm run play` is unrun** (#53). Its `SCHOLAR` and `GUARD` constants are gone
and it looks up `stationOf` instead, rings the bell three times and walks to the
Great Hall to find the cook there; none of that has been seen on a GPU, and the
phase's GPU exit criterion is outstanding.

## Phase 7: The mystery goes live

**Shipped 2026-09-15, under Claude Opus 5** (#477 to #490). Phase 1's engine
meets Phase 6's cast in Phase 5's castle, through the UI. E on a thing examines
it, J opens the journal, Present in a conversation presses somebody with a clue,
and the Constable's last line opens a panel with twelve names, a fall and
everything written down. `quest.json` is one graph: the frame is the top level
and the riddle quest's three stages are gone, along with `openGate` and
`showVictory`. The riddle survived as the word-lock (#416) and one press of E now
reads the word into the journal and asks it. `test/quest.mjs` 76 assertions to
**154**, `test/mystery.mjs` 113 to 118, `test/save.mjs` 50 to 56,
`test/plan-vs-scene.mjs` 16 to 34. **43.18 MB by `git ls-tree`, unchanged**: no
asset added and none restored.

- [x] **Examine.** `castle.evidence()` is ten targets beside the NPCs, the bell
  and the lock, each prompted with mystery.json's own `name`; the manager calls
  `examine(id)`, the clue toasts its title into the HUD, and evidence with
  `take: true` leaves the world and lands in `taken[]`.
- [x] **The journal.** `J` opens the held clues with their text; Present inside a
  conversation opens the same list and picking one calls `press(npc, clue)`. A
  press that moves nobody gets the NPC's `default` lines back.
- [x] **The accusation.** The Constable's `default` lines end in `{ACCUSE}` and
  `validateAgainstNpcs` takes a list of token/action pairs; the overlay lists the
  twelve and a fall, then up to three journal clues, then becomes the verdict and
  the epilogue, whose button erases the save.
- [x] **The riddle quest retires.** Three stages, two actions and the victory
  screen deleted; the start panel and the initial objective say the mason is
  dead; the board card and the og text changed in the same PR.
- [x] **`test/quest.mjs` is the manager's suite for the whole thing:** the
  intended path driven through stand-in UI to the full ending, the prisoner on
  nothing, three refusals to a fall, a reload at Sext with the journal intact.
  `play-castle.mjs` is rewritten around the intended path, 34 beats to **102**.

What the plan above said and what shipped differ in six places, each a locked
decision:

- **`validateAgainstNpcs` takes pairs, not a generalised "token and action"**
  (#479). The plan asked for the check to be generalised to any token and action
  pair; the argument is a list of them, so the riddle and the accusation are both
  rails rather than one rail and one special case.
- **One press of E reads the word-lock and asks it** (#480). The plan had examine
  and the lock as separate things. The muniment room's leaf carries
  `evidence: "lock"` in `scene-config.json` and is a lock target already, so
  giving it a second prompt would have let the player read the word without ever
  being offered the riddle.
- **Five lines of the castle's own voice are data** (#481). `mystery.ui` carries
  what the HUD says when the engine hands back something that is not a clue —
  asleep, not here at this bell, already taken, still locked, already read,
  nothing written down, and "No one. He fell." Seven strings, required by the
  validator, because they are content.
- **"Which room am I in" is not a question this castle answers** (#482). The one
  location clue needed somebody to notice the player walking onto the cross-wall
  walk. A general `roomAt` came back naming ten of the forty-five stations as a
  room their own schedule does not call them, because the towers' discs overlap
  the walks and the cell's disc overlaps the Great Hall. `nav.inRoom(room, level,
  x, z, feet)` asks about one room, which has one answer.
- **A shrug is not a conversation** (#483). Presenting the wrong thing dispatches
  no `talked:` event, so shrugging at the Constable does not also open the
  accusation panel.
- **The word-lock and the journal are offered in `arrive` too** (#486). The plan
  left `arrive` as one conversation. A door across the castle that is inert until
  the player has spoken to somebody reads as a broken door, and
  `test/plan-vs-scene.mjs` pressed E at it before meeting anybody and found
  exactly that.

**Both breaks the plan named fired.** Unhooking the Present button from the
manager failed eight assertions, the named one among them: `presenting
summons-is-stewards to the Steward moves him to pressed — state default, holds
false`. Dropping `accusation.needs` to 1 failed six, the named one first: `one
clue is refused — refusals 0, stage wrong`. Seven more breaks are in the closing
report; one of them, a place clue moved into open ground, is the only one whose
own rail had to be written for it.

**`npm run play` is unrun** (#53). It walks the whole intended path now — twelve
people, ten pieces of evidence, three bells, a reload at Sext, the accusation
panel and the epilogue, 102 assertions against 34 — and none of it has been seen
on a GPU. The phase's GPU exit criterion is outstanding, as Phase 6's still is.

## What this leaves for a later arc

- **A fourth body**, and a woman's body in particular: Marged, Nest and Lady
  Alys are three of twelve and the kit has no woman. Question 1 for Devon.
- **The turrets and the tower tops.** Four cylinders nobody can climb; a
  third stair per inner tower and a view over the whole plan from 12 m.
- **The town side.** The world ends at the curtain by budget. A textured
  ground outside the west barbican and a road is one set Devon dropped
  (`forest_ground_06`) and a different ending.
- **A second day.** The save schema has `watch` and `accusations[]` and
  nothing stops a day two in which the epilogue's consequences play; the
  content does not exist.
- **Sound.** `AudioListener` is on the camera and nothing has ever played
  through it. Footsteps on planks against footsteps on pavers is the cheap
  one, and the bell is the obvious one.
- **Touch.** Pointer lock has no phone form, and the project has never had a
  thumb on it.
- **Stirling's Great Hall roof.** The Great Hall is full height with a flat
  ceiling; a hammerbeam from `structure-cross.glb` is a day's work and not a
  gameplay change.

## Risks

- **The plan and the scene disagree.** Phase 2 stakes the whole verification
  story on one module both sides read. If the builder ever computes a
  transform the plan did not, the suite is green and the wall is elsewhere.
  `plan-vs-scene.mjs` is the net; if it cannot be made stable headless, a
  builder that is allowed to drift is the state Phase 2 was written to end.
- **Twelve NPCs from three bodies read as three NPCs.** Tints are cheap and
  may not be enough, and nothing in Node can say. **Devon answered Q53 with
  tints on 2026-09-14** (#419), which accepts this risk rather than removing
  it. The GPU beat in Phase 6
  should photograph all twelve in the Great Hall at Vespers and somebody
  should look.
- **The riddle overlay's pattern generalised badly.** The `{RIDDLE}`
  poser-and-opener check is exact and pairs one token with one action; the
  accusation and the bell each want the same shape, and Phase 7's
  generalisation is where a token could open nothing and the validator not
  notice. The break for it is in Phase 7.
- **Sixty minutes is a guess.** Twenty-two interactions on the shortest full
  path is the number; how long a real player takes to notice that two
  statements disagree is not measurable here, and the validator's two-to-three
  watch band is a floor and a ceiling on structure, not on time.
- **Stairs at 45 degrees.** `stairs-stone.glb` at 4x is steep; a player who
  reads it as a wall never finds the walk. If that is what the GPU run
  reports, `floor-stairs.glb` in three tiles is the shallow answer and costs
  each tower 8 m of footprint it does not have. The plan's ramp entry is the
  same either way.

**The one I would bet the project fails on** is the second: the cast. A
denser mystery is a cast the player can tell apart at twenty metres, and
three bodies with tints is a bet that colour is enough. **Devon took the bet**
(#419): the risk is carried, and the Vespers photograph in Phase 6 is the first
time anyone will know. The reversal stays priced at 1.4 to 2.0 MB for a fourth
body, over a 44.4 MB ceiling that is his number and not a session's.
