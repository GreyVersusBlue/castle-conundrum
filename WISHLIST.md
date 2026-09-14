# Castle Conundrum Feature Wishlist

**Status: this is the v2 plan, written 2026-09-14, and no phase of it has
shipped.** Seven phases, ranked 1 to 7 in `BACKLOG.md`, each sized to one
session, each taken in order because each reads what the one before it wrote.
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
  builder is this project's own instance of the failure #34 describes, and
  Phase 2 exists to end it.
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
  `node test/quest.mjs`, all three in the CI matrix; Phase 1 adds
  `node test/mystery.mjs` and `node test/save.mjs`, Phase 2 adds
  `node test/plan-vs-scene.mjs` (headless Chromium, not real time). From
  `Tools/board-check`: `npm run play`, headed, GPU, hand-run.
- **Writing style.** Direct, numbers over adjectives, no em dashes, never
  "comprehensive" or "robust".

## Questions for Devon

Six, in `BACKLOG.md`'s table as Q53 to Q58. Only where the answer changes the
work; everything else is decided below and in `HISTORY.md` (#411 to #418).

1. **Twelve NPCs from three bodies, or a fourth model?** Tints are free and
   are the plan. A fourth body is 1.4 to 2.0 MB over the 44.4 MB ceiling and
   falls under the reachability rule. Changes Phase 6.
2. **A death, or only a theft?** The mystery as written is a killing made to
   look like a fall, with a hanging at the end. A theft-only version is a
   different cast and a different clue graph. Changes Phase 1.
3. **The fourth bell forces the accusation.** The alternative is an open day
   that ends only when the player accuses. Changes Phase 1's engine and
   Phase 7's UI.
4. **The riddle survives as the muniment room's word-lock.** The alternative
   is retiring `riddle.json` and the overlay. Changes Phases 4 and 7.
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
| Phase 5 | wood_planks 1.6, dirty_carpet 3.0 | 44.4 |
| Phase 6 | none (tints, not bodies) | 44.4 |
| Phase 7 | none | 44.4 |

## Phase 1: The mystery as data, and the save

**Size 1. Claude Fable 5.1.** The content above becomes `data/mystery.json`,
`src/mystery.js` validates it and runs it in Node, and the page gains a save.
The page otherwise plays exactly the riddle quest it plays today; this is the
sim without the page.

- [ ] **`data/mystery.json`.** `watches` (four ids), `rooms` (id, ward, level,
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
  keys nothing off an id.
- [ ] **`data/quest.json` grows to the frame:** `arrive` (Prime, before the
  Constable has spoken), `investigate` (on `talked:constable`), `accusing`
  (on `bell:4` or `ask:accuse`), and one terminal per verdict class
  (`verdict:full`, `verdict:right`, `verdict:wrong`, `verdict:fall`). New
  events: `bell:<n>`, `clue:<id>`, `press:<npc>:<clue>`, `accused:<who>`.
  New actions the manager lists: `ringBell`, `openJournal`, `openAccusation`,
  `showEpilogue`. `validateQuest` is unchanged and already allows several
  terminals.
- [ ] **`src/mystery.js`, pure.** `validateMystery(mystery, npcs, quest)`
  returns problems; `createMystery({mystery, npcs, state})` returns
  `{discover(clueId), press(npc, clueId), ring(), enter(room, level),
  examine(evidenceId), accuse(who, clueIds), available(npc), stationOf(npc),
  journal()}`, every call returning effects the manager applies. Discovery
  is a fixed point: a D clue lands the instant both premises are held, a
  press moves an NPC only if the clue is held and the NPC is in the state
  the press leaves from.
- [ ] **What the validator rejects,** each with a message that names the id:
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
- [ ] **`test/mystery.mjs`.** Validates; computes discoverability and prints
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
- [ ] **The save.** `src/save.js` imports `../../../assets/js/gvb-save.js` and
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
- [ ] **The page adopts it,** for the riddle quest: `main.js` loads the slot,
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

**Size 1. Claude Opus 5.** `test/layout.mjs` re-implements `tileToWorld`,
`normalizeToTile`, `normalizeHeight` and `groundAndCenter` and says so in its
own header; it cannot catch a change to them. Before the castle grows a `y`
axis, the placement math moves into one pure module both sides read.

- [ ] **`src/castle-plan.js`, pure.** `makePlan(config, boundsOf)` where
  `boundsOf(modelPath)` is injected: three's `Box3` of the loaded model at
  runtime, `test/gltf.mjs`'s `boundsOf` in Node. Returns `{pieces, colliders,
  surfaces, rooms, spawn}`. A piece is `{id, kind, model | built, level,
  transform: {position, rotationY, scale}, box}`; a surface is `{box, top,
  level, slope}` where `slope` is `null` for a floor and `{from, to}` for a
  ramp; a room is `{id, level, ward, bounds}` from `config.rooms`. The
  builder loads each piece and applies the plan's transform; it computes no
  transform of its own, and `colliders` come from the plan, so the runtime
  and the suite cannot disagree about where a wall is.
- [ ] **`walkability(plan)`.** A 0.5 m grid over the plan. A cell at height
  `h` is standable if a surface covers its centre at `h` and no collider
  crosses the column above it between `h + 0.3` and `h + 1.9`. Cells connect
  when adjacent and their heights differ by at most 0.35 m, or along a
  ramp's slope. Flood fill from `spawn`. Exposes `reachable(x, z, level)`,
  `rooms()` with each room's reachability, and `sealed()`, true when no
  reachable cell lies outside the curtain's outer face.
- [ ] **`test/layout.mjs` rewritten to read the plan.** The prop-in-wall check
  and the cabinet margins become plan queries; three new checks: every room
  reachable from the spawn, the castle sealed, every NPC position in
  `npcs.json` on a reachable cell. `assets.mjs`'s archway measurement is
  untouched.
- [ ] **`test/plan-vs-scene.mjs`.** Headless Chromium through
  `Tools/board-check/harness.mjs`, loads the page, waits for the scene probe,
  and diffs every placed object's live `Box3` against its plan `box` to
  0.01 m. No pointer lock, no movement, no timing, so not #53's class. In the
  CI matrix if it proves stable over three runs; hand-run otherwise, and the
  closing report says which.
- [ ] **The player reads the plan.** `getColliders` becomes `plan.colliders`;
  no behaviour change yet. `EYE_HEIGHT` stays constant until Phase 5.

**Guard-rail, broken on purpose:** switch the plan's wall scaling from depth
to width (the 8 m `wall-half` bug of round 2) and watch `layout.mjs` fail on
the hall table inside the interior south wall; remove one `wall.glb` from the
north run and watch `sealed()` fail with the leaking cell's coordinates. If
either break runs green the plan is not what the suite reads and the phase
is not done. **Exit:** all four Node suites green; `plan-vs-scene.mjs` green
headless; `npm run play` 35 beats green (GPU). **Weight:** 29.0 MB. **Model:**
Opus; the refactor has an oracle, the two breaks.

## Phase 3: The shell: two wards, eight drums, a cross-wall

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

**Size 1. Claude Fable 5.1.** The part of this plan that is genuinely
unsolved: the player standing on floor two, and the suite knowing it.

- [ ] **Surfaces with height.** Level-one slabs as built `BoxGeometry`
  3.8..4.0 m carrying `wood_planks`, `dirty_carpet` over the King's Hall;
  the wall walk as 2 m decking at y 8 along every run and the cross-wall;
  `stairs-stone.glb` in the eight towers, two per tower, entered in the plan
  as ramps (`slope: {from: 0, to: 4}` over the piece's own run, read from
  its bounds). Floor edges from `wood-floor-railing.glb` where a slab meets a
  drop; battlements already on the outer edge of the walk.
- [ ] **The player has a `y`.** `PlayerController` asks the plan for the
  highest standable surface under the player within 0.35 m of the current
  feet height and stands the eye 1.7 m above it; ramps interpolate. Colliders
  are tested in a band relative to the feet (`feet + 0.3` to `feet + 1.9`),
  so a level-one wall does not stop a walker on the wall walk and the walk's
  parapet does. No jumping, no falling: a step down over 0.35 m is a wall.
  The interaction ray already uses world positions and needs no change; NPCs
  gain `level` in their station so a level-two porter is not walked to at
  ground.
- [ ] **`walkability` grows the second and third levels** for real, and the
  checks that the mystery's geometry holds: the cross-wall walk connects the
  north and south curtain walks at level 2 (`walk-crosses` is a place a
  player can stand on); with the Stockhouse Tower's walk door collider
  closed, the wards do *not* connect at level 2 (the porter's bar works when
  it is barred); every tower's level 1 and level 2 rooms are reachable from
  its stair; no reachable cell has a ceiling under 1.9 m.
- [ ] **`plan-vs-scene.mjs` grows a standing beat:** teleport the camera to
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

**Size 1. Claude Opus 5.** The cast moves to its stations.

- [ ] **`npcs.json` grows `tint`** (a hex the body's main material is
  multiplied by) and each of the twelve names one of the three bodies. The
  Guard, Scholar and Wizard are gone. `hideNodes` and `hideMaterials` do the
  rest: the King's crown for the Constable only, the Adventurer's pack for
  nobody.
- [ ] **The bell.** An examinable in the chapel; `ringBell` advances the
  watch, the manager tells every NPC its new station, and the lighting
  section of `scene-config.json` gains a per-watch sun position and fog
  colour so Vespers looks like Vespers. Time-gated evidence appears and
  vanishes on the same event.
- [ ] **NPCs path between stations.** `npc.js`'s patrol loop is fed a
  waypoint list from `walkability`'s grid (breadth-first from station to
  station, through doorways and up stairs), so the cook walks from the
  kitchen to the Great Hall at Vespers rather than teleporting. An NPC that
  cannot path is a validator failure, not a frozen body: `validateMystery`
  now takes the plan and rejects a station with no path from the previous
  watch's station.
- [ ] **`play-castle.mjs` reads stations from data.** `SCHOLAR` and `GUARD`
  go; the walk beats look up `stationOf(npc, watch)`. Two constants that
  three phases have had to move by hand stop existing.

**Guard-rail:** wall the kitchen's door in the config and watch
`mystery.mjs` fail with "cook: no path from KI at sext to GH at vespers";
put two NPCs on one tile at one watch and watch the station-collision rail
fail. **Exit:** twelve NPCs at their Prime stations in Node
(`stationOf` for all twelve, all reachable); the bell rung four times moves
every one of them along an existing path; `npm run play` rings the bell and
finds the cook in the Great Hall (GPU). **Weight:** 44.4 MB. **Model:** Opus.

## Phase 7: The mystery goes live

**Size 1. Claude Opus 5.** Phase 1's engine meets Phase 6's cast in
Phase 5's castle, through the UI.

- [ ] **Examine.** `interaction.js` grows examinables beside NPCs: the
  prompt says "Press E to examine", the manager calls `examine(id)`, the
  clue lands in the journal with a toast. Evidence with `take: true` (the
  tally stick, the note) leaves the world and `taken[]` in the save.
- [ ] **The journal.** `J` opens a list of held clues with their text; from
  inside a conversation, "Present" opens the same list and choosing one calls
  `press(npc, clue)`. A press that moves nobody gets the NPC's `default`
  shrug line rather than silence, so a wrong present is answered.
- [ ] **The accusation.** The Constable's `default` lines end in an
  `{ACCUSE}` token the way the Scholar's end in `{RIDDLE}`, and
  `validateAgainstNpcs`'s poser-and-opener check is generalised to any token
  and action pair; the overlay lists the twelve and "a fall", then up to
  three journal clues, then the verdict lines and the epilogue, then `slot
  .reset()` on the button.
- [ ] **The riddle quest retires.** `quest.json` is the four-stage frame from
  Phase 1; `index.html`'s start panel and initial objective say the mason is
  dead; the board card's description and `assets/og` text change in the same
  PR, called out in the body as the shared-file edit it is.
- [ ] **`test/quest.mjs` becomes the manager's suite for the whole thing:**
  the intended path driven through stand-in UI to the full ending, the
  prisoner on nothing, three refusals to a fall, a reload at Sext resuming
  with the journal intact. `play-castle.mjs` is rewritten around the intended
  path: 34 beats become about 60, and the preview recapture (parked in
  `BACKLOG.md`) follows this phase, because every frame goes stale the
  moment the castle changed in Phase 3 and stays stale until the HUD is
  final here.

**Guard-rail:** remove the manager's `press` wiring and watch `quest.mjs`
fail on "presenting summons-is-stewards to the Steward moves him to
pressed"; let the Constable accept the porter on one clue and watch "one
clue is refused" fail. **Exit:** `quest.mjs` walks the full ending in Node;
`npm run play` plays it in a browser to the epilogue (GPU). **Weight:**
44.4 MB. **Model:** Opus; the content and the save are Phase 1's, the suite
drives the real manager, and every failure here is loud.

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
  may not be enough, and nothing in Node can say. The GPU beat in Phase 6
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
three bodies with tints is a bet that colour is enough. If Devon answers
question 1 with a fourth model, Phase 6 gets 1.4 to 2.0 MB and the ceiling
moves; if he does not, the risk is carried, and the Vespers photograph in
Phase 6 is the first time anyone will know.
