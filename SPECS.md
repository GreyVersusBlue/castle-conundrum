# SPECS

A spec per ranked row in `BACKLOG.md`. **`BACKLOG.md` ranks; `ROADMAP.md`
orders; this file says what each row is, in the detail `PLAN.md` gave the seven
phases and the backlog rows never got.** Each section's Dependencies below is
where `ROADMAP.md`'s gates and lanes came from (#600 to #602); where this file
and that one differ, this one was written against the code and wins. `HISTORY.md` is still the only record: nothing in here is a locked
decision. Every "recommendation" below is exactly that, and the session that
ships the row is the one that records the call with a number.

One section per row still open in `BACKLOG.md`'s ranked table: 3, 4, 6, 7,
9, 11, and the rank 2 band (2b to 2d, and 2h, "Castle in Blender",
which is outside the Blender pipeline, #839, and 2i, its integration row,
#963 to #968). 2f and 2g shipped and their
sections are deleted (#830 to #838); 2a shipped (#907) and its section is cut
to what 2b cites and its open look; 2e shipped (#908) and its section is cut
to its pointer and its open look; 13 shipped (#909) and its section is cut
to its pointer; 2h shipped (#962) and its section is cut to its pointer.
Rank 1, the pipeline, shipped too
(#880 to #884); its section is cut to the two parts the packs cite. The red suite is closed; its section is a
stub pointing at `HISTORY.md`. "Bodies" stays until 2c's and 2d's sections
land, and is then deleted (#807).
A shipped row's section is deleted, not struck through; `HISTORY.md` carries
what it said. **A session never reuses a retired rank; Devon may** (#619 as
#802 amends it, #491, #522): he reopened 1 and 2 on 2026-09-25 for the
Blender rows (#801, #802). 5, 8, 10 and 12 are retired and gone from this
file, not renumbered into gaps.
Where a brief and the code disagree, the code is quoted and the disagreement
is named. Measurements are `git ls-tree`, `du` and `ls -la` against the commit
each section names.

## How to read a section

Each row has the same five parts.

1. **Scope**: the files that change or get added, and the systems involved.
2. **Acceptance**: what done looks like, and which suite says so. Where a new
   guard-rail is warranted, the assertion and the break that proves it is not
   vacuous (#34).
3. **Open calls**: what the row leaves unresolved, with a recommended answer and
   the reasoning. Recommendations, not decisions.
4. **Dependencies**: what has to have shipped first, and what should not run at
   the same time.
5. **Constraints**: the house rules that bite this row, by number, and only
   those.

The depth follows the `Size` column: a ¼ gets bullets, a 1 gets the file-level
plan, and the 2+ is mostly about the first increment.

**A section is named, not numbered.** Each one opens with the rank it holds in
`BACKLOG.md` today, and a shipped row shifts every number below it, so the rank
on that line is a pointer a shipping session updates and nothing else refers to.
Everywhere one section names another it names it by title. The version of this
file written on 2026-09-15 numbered them inline instead and was already a row
out of step with itself inside "The GPU run" before anything had shipped (#522).

## What every row shares

Four facts every row below leans on, stated once:

- **`src/castle-plan.js` computes every transform, box and surface; the builder
  places and tags; `test/plan-vs-scene.mjs` diffs the two at 0.01 m** (#500).
  Anything added to the castle is a plan piece with a `planId`, or it is invisible
  to the net.
- **Nothing the page fetches leaves its origin** (#493). `test/harness.mjs`
  aborts every offsite request and `test/built.mjs` fails on a non-empty
  `page.__blocked`. Decoder files, fonts, sound files and images all land under
  this repo.
- **The fifteen suites are `npm test`; `npm run play` is not** (#53). A row whose
  proof needs a real-time walk or a look at a render has a GPU criterion nobody
  in a session can meet. Every row below also names a Node or headless criterion
  so the row is not blocked on hardware.
- **The save key is `castleConundrumSave_v1` and stays** (#36, #413). Schema
  changes go through `migrate` with a version bump; `repair` runs on every load
  (#37).

---

## The red suite: what the prompt is aimed at

**Shipped, closed.** Four increments: the aim cone and the populace beat's
timing fix (#721 to #724), the day-one `PROP_CLEARANCE` rail (#785), and the
same rail extended to the walking day and the morning after (#792, #793).
`HISTORY.md` carries what shipped.

---

## Blender: what every pack shares

Rank 1, the pipeline, shipped on 2026-10-01 (#880 to #884): `tools/blender/`
(`common.py`, `packs.json`, `render.mjs`, `finish.mjs`, `manifest.json`),
`test/assets.mjs` check 8, and `assets/blender/calibration/crate.glb` placed in
the kitchen as `kitchen-crate` (#880). Its spec is in `HISTORY.md` #801 to #808
and #879 to #884; `tools/blender/packs/calibration.py` is the file a pack's
first script reads. What stays here is the two parts every pack section cites.

### The look (#742, #803)

- **Low-poly and flat-shaded**, the Kenney kit's kind of object: bevels
  only where a silhouette needs one, no subdivision, no sculpt.
- **Colour comes from one palette atlas per pack**, a PNG embedded in each
  `.glb`, at most 128 px a side and 32 colours, one swatch per colour,
  every face's UVs on a swatch centre. That is how the kit colours its own
  pieces with 64 px maps, it keeps an asset to one material and one draw
  call, and a 16 x 16 atlas costs about 1 KB of video memory.
- **The colours are the castle's**: every swatch is a colour in the union
  of `tools/pixel/textures.json`'s palettes, plus at most 8 a pack lists as
  `extraColours` in `packs.json`, each with a `why`.
- **Lit, never unlit**: no `KHR_materials_unlit`, metallic 0, one map, no
  normal or ORM map, as `pixelMaterials` are (#742), so the sun per watch
  and the braziers light it like the stone beside it.
- **No texture over 128 px, and so no KTX2, in this pipeline.** A KTX2 pass
  after `finish.mjs` would change bytes the manifest has already recorded,
  and a pack that needs a bigger texture amends this section first.

### What every Blender pack shares

A pack section cites this paragraph instead of restating it. **A pack is
rows in `tools/blender/packs.json`, one script at
`tools/blender/packs/<pack>.py` that imports `common.py`, and output under
`assets/blender/<pack>/`, written by `npm run blender:render <pack>` on
one of Devon's machines, huginn or Windows, with Blender 5.2 and nowhere
else** (#804, #805, #878, #879). Every
asset is a `.glb` in metres, +Y up, its base at y 0, centred, facing +Z,
seeded by its row, flat-shaded, one material with a palette atlas of at
most 128 px and 32 colours from the castle's palettes plus at most 8 of its
own, lit, meshopt by `finish.mjs`, never KTX2 (this section's "The look").
**A skinned pack amends two of those rules** (#820): it carries two
materials over the one palette image, `Cloth` (or `Coat`), which the tint
multiplies, and `Bare`, which it does not; and it is framed on its root
joint at x and z 0, not centred on its bounding box, because a cloak or a
tail moves the union of its parts off the feet. Every file is a row of
`tools/blender/manifest.json`, and `test/assets.mjs`
check 8 holds it; the pack adds one line to check 8's caps block (triangles
and bytes per asset) and argues it. Every asset is referenced in the commit
it lands (#390). A pack's `HISTORY.md` entry carries its ceilings before and
after (#611) and the second-run no-op. Every pack holds lane F; a pack that
places into `data/scene-config.json` holds B; 2c and 2d hold C. A pack
writes nothing `tools/bodies/` writes and makes no body another row makes
(#807). Its GPU look is a checklist in its own section, and blocks nothing
in `npm test` (#53).

---

## Blender: evidence props

**Rank 2a. Shipped (#907), in two increments, against #810 to #812, #816 and
#819.** Its row is retired from `BACKLOG.md` and `ROADMAP.md`. What other
sections cite, and what is still open:

- **Check 1e, "nothing stands over a pressable"** (`test/layout.mjs`, #812):
  for every piece carrying `evidence`, `read` or `bell`, no other non-ground
  piece overlaps its box in plan by more than 1 cm in x and in z with its own
  base at or above the pressable's centre height and below the pressable's
  base plus `EYE_HEIGHT`. Green over 25 pressables. 2b's sets stand under it.
- **#811's pin**: a swap keeps its piece's id and its box centre to 1 mm, with
  the new footprint inside the old box, so no station moves. Applied to
  `candles-chapel` (pricket), `table-muniment` (ledger desk) and `knife`
  (barrel). 2b's increment 3 uses it.
- **Open: the GPU look (#53).** It belongs with the next rank 3 GPU run.
- **Open and conditional: increment 3**, the pouch and the tally stick, both a
  `detail-crate-small.glb` today in `courtyard.placements` (the tally at level
  2, where `interiorProps` cannot stand). Built only if the look below says a
  crate for a tally stick reads wrong; it needs `propPath` at the placement
  loop and at `test/assets.mjs`'s placement reference check (#500), then the
  same pinned swap. `coin-pouch.glb` in `51735fa` is a candidate for the
  `pouch`. Class S.

### Looking checklist

- [ ] The pricket in the chapel at Prime: one candle burnt down, or a stick?
- [ ] The aumbry's three beside it: do the heights read as a count?
- [ ] The goblet on the hall's photographed table, and the seal in the
      office: the kit's kind of object beside a photograph, or a third look?
- [ ] E at the barrel, the desk and the pricket from where a player stands.

---

## Blender: an interiors kit

**Rank 2b. Size 2+. Model Opus 5. Where: Local: Blender. Gate: rank 1 shipped
(#881; 2a shipped, #907, for check 1e and #811's pin). Lanes F and B.** Modular
pieces that make the castle's working rooms read as what they are. "What
every Blender pack shares" holds and is not restated. Decided as #813 to
#816 and #819, amended by #951 to #953. Three increments: two class S, the
third gated on rank 4's look. **Increment 1 shipped on huginn (#947)**: four
sets, five placed, the GPU look still owed. **Increment 2 shipped on huginn
(#971)** as the cell alone (#951): one set, one outer-ward draw, behind one
new station rail (#953); the GPU look is still owed.

> **#920, discharged by #946 (2026-10-03):** the gate is open and #803's flat look stands for this row. #920's own reason was overtaken: #964 swaps the wall faces round all four rooms, so the sets will stand against photographic walls. The look stands because #964 names 2b's sets among what a room keeps, #813 gives this row no wall to cover, and #803's pipeline takes no image input. A flat set against a swapped wall is a line on the integration row's looking checklist, and its remedy is that row's `keep` list.

**Amended by #830 (2026-09-25).** `kitchen-hearth`, `hall-hearth` and
`chapel-altar` are dropped, because 2f, "Blender: Devon's props, placed",
stands Devon's hearth crane, spit, fireplace and altar there. The altar is
in the Chapel Tower's top room, since the chapel floor would put it 0.4 m
from the apprentice's station. `kitchen-worktable`, `kitchen-shelves`,
`hall-trestle`, `hall-high-table`, `cell-pallet` and increment 3 stand, and
a set may move a 2f row to fit, since both are dressing. `cell-door-barred.glb`
in `51735fa` is available to the cell.

**Amended by #951 to #953 (2026-10-03).** Three things above stopped being
true. The altar is not in the Chapel Tower's top room: #837 moved it into
the nave as `nave-altar`, at world (16.8, 10.25). The chapel gets no 2b set
(#951), so 2b's sets stand in three rooms and increment 2 is the cell.
`cell-door-barred.glb` is not available: `01ee3dd` deleted it with fifteen
others under #390, and it is not restored (#952). And "every set collides,
so the station rails hold it" (#814) was false for the one room increment 2
dresses: a set stood on Madoc's station left `validateMystery` at 0
problems, so the increment opens with the rail that closes that (#953).

**The rooms, measured.** The brief named the kitchen, the great hall, the
chapel, a smithy, stables and a dungeon. `data/scene-config.json` has 43
rooms and no smithy and no stables; #800 found the same ("there is no forge
room", which is why the carter hammers at his cart). The dungeon is the
`cell` in the Prison Tower, the gaol since lore year 9, which today holds
nothing but its 123 drum meshes and is shut. #814 named four rooms; 2b's
sets stand in three of them, and the chapel is dressed by 2a, 2f and 2g
(#951):

| Room | Ward | Extent | What stands in it today |
| --- | --- | --- | --- |
| `kitchen` | outer | x -26..-14, z -14..-6 | two barrels, a crate, a small barrel, the cook's slate |
| `great-hall` | outer | x -34..-6, z 6..14 | nine photographed props (29 draws), a kit dais, seven trusses, seven roofs |
| `chapel` | inner | Chapel Tower, r 2.8 | no 2b set (#951): the body's lantern, 2a's pricket and aumbry, 2f's hung censer, the pouch, the gravestone, the bell, the lower flight in the east half, three cast stations and one household one |
| `cell` | outer | Prison Tower, r 2.8, cut to 4.0 m wide (x -22..-18) over z 14..18 by the south curtain's two ends | nothing; Madoc's one station at tile (-5, 3.5), world (-20, 14) |

**Sets, not loose pieces** (#815). The modular pieces are Python functions
in one script (a hearth, a hood, a spit, a cauldron, a trestle board, a
bench, a shelf, a crock, an altar, a pallet, a bucket, a wall ring and
chain). Each `packs.json` row composes pieces into a **set**, and the set is
joined into one mesh before export: one primitive, one material, one draw
call. Modularity lives where it costs nothing and the draw count stays flat.

### Scope, increment 1: the kitchen and the great hall (class S)

- **`tools/blender/packs/interiors.py`**, importing `common.py`: the piece
  functions and `build_set(row)`, which places `row.pieces` (each `[piece,
  x, y, z, rotationY]` in the set's own metres) and joins them.
- **`tools/blender/packs.json`**, four rows since #830 (six before it),
  pack `interiors`, each with a `why`; `extraColours` at most 8, each with a
  `why`, and only those a set uses (linen is the one increment 1 uses):
  - ~~`kitchen-hearth`~~: dropped by #830; 2f's hearth crane and spit stand
    there.
  - `kitchen-worktable`: a board on trestles, a trough, two pots.
  - `kitchen-shelves`: a rack of crocks.
  - `hall-trestle`: a trestle board and two benches, used twice.
  - `hall-high-table`: a board and a bench on the dais, where
    `data/lore.json` seats the Constable and his lady.
  - ~~`hall-hearth`~~: dropped by #830; 2f's stone fireplace stands there.
- **`assets/blender/interiors/*.glb`**, four files, and their manifest rows.
- **`data/scene-config.json`, `interiorProps`**: five rows, each with an
  `id`, spliced (#584, #632). Every set collides (no `noCollide`), so the nav
  rails hold it; `kitchen-shelves` may hang by `yOffset` and `noCollide` if
  it stands above head height.
- **`test/assets.mjs`**, check 8's caps block, one line:
  `interiors: { triangles: 2500, bytes: 96000 }` (#819).

### Scope, increment 2: the cell (class S)

One set, `cell-pallet`, one file, one `interiorProps` row, one outer-ward
draw (#951). The chapel gets nothing from this row. Two commits, in this
order, each from a green `npm test`.

**Step 1, the rail (#953). No Blender, no asset.**

- **`src/stations.js`**: `castleNav`'s api gains `onFloor(point)`: true when
  `point.h` is within 1 mm of the `top` of the plan room the station names
  (`planRooms`, keyed `id/level`), null when the plan has no such room.
- **`src/mystery.js`**, `validateMystery`: each of the three `barred`
  branches (day one, `day0`, `day2`) says, when `nav.onFloor(point) ===
  false`, `<npc>: station at <watch> is in <code>, behind bars, <h> m up on
  something that is not its floor`. The `talkable` line beside it is
  unchanged.
- **`test/mystery.mjs`**: one `expect` beside the #785 pair, mutating the
  config and not the mystery: `kitchen-worktable`'s row moved to tile
  `[-5, 3.5]`. It expects `/^prisoner: station at prime is in PT, behind
  bars, 1\.10 m up on something that is not its floor$/` (the worktable's
  plan box tops out at 1.10). The break (#34): with the new clause commented
  out the `expect` reads "said nothing", which is today's behaviour.

**Step 2, the set. Blender on huginn or Windows.**

- **`tools/blender/packs/interiors.py`**: four new piece functions. None of
  the four exists today; `PIECES` holds `trestle-board`, `bench`, `trough`,
  `pot`, `crock`, `rack` and `cloth`. Each is built from `cbox` and `lathe`,
  which stand.
  - `pallet`: a board frame in `WOOD_DARK`, a straw fill in `STRAW` proud of
    it, a folded blanket at the foot in `EARTHEN_DARK`. Sizes `length` 1.9,
    `depth` 0.75, `height` 0.18, `board` 0.03.
  - `bucket`: staves lathed at `sides` 8 in `WOOD`, two hoops in `IRON`, the
    inside in `INTERIOR`. Sizes `radius` 0.16, `height` 0.30.
  - `wall-ring`: an `IRON` plate with its back on the piece's own z 0 and a
    ring of 8 segments hanging from it. Nothing reaches behind z 0.
  - `chain`: `links` boxes in `IRON`, alternate links turned 90 degrees,
    rising `drop` from the piece's base.
  - `STRAW = '#b89d55'`, **appended last in `PALETTE`** so slots 0 to 9 keep
    their UVs (#952).
- **`tools/blender/packs.json`**: one row, `cell-pallet`, pack `interiors`,
  seed `interiors/cell-pallet/<the build date>`, a `why`, and
  `packs.interiors.extraColours` gains `#b89d55` with a `why` (2 of 8). The
  pieces, in the set's own metres before `common.frame` centres it, back at
  -Z, which is the wall:

  | Piece | x | y | z | rotationY | What it is for |
  | --- | --- | --- | --- | --- | --- |
  | `pallet` | 0 | 0 | 0 | 0 | 1.9 along the wall, 0.75 into the room |
  | `wall-ring` | -0.60 | 1.05 | -0.375 | 0 | on the wall over the head end, its back flush with the pallet's back edge |
  | `chain` | -0.60 | 0.18 | -0.34 | 0 | `drop` 0.85, from the pallet's top to the ring |
  | `bucket` | -1.21 | 0 | -0.15 | 0 | on the floor past the head end |

  The set's box comes to **2.32 x at most 1.20 x 0.75 m** (x -1.37..0.95,
  z -0.375..0.375). The builder may change a size for the look and may not
  let the box pass 2.36 m long, 0.75 m deep or 1.20 m high.
- **`assets/blender/interiors/cell-pallet.glb`** and its manifest row. **The
  whole pack re-renders**: `interiors.py` is an input to every interiors
  row's `source` hash (check 8 line 4), and the new swatch changes the atlas
  in all five files. The four shipped files keep their triangle counts (240,
  288, 808, 376) and their plan boxes, and change `sha256`, `source` and
  perhaps `bytes`; the builder records all four before and after. A second
  render prints "unchanged" for five files (#883).
- **`data/scene-config.json`, `interiorProps`**: one row, spliced (#584,
  #632): `{ "id": "cell-pallet", "model":
  "assets/blender/interiors/cell-pallet.glb", "tile": [-5.405, 4.05],
  "rotationY": 90 }`. No `yOffset`, no `noCollide`, no `base`.

**Where it stands, and why (#952).** The cell is not a 2.8 m disc. The south
curtain's two ends stand 0.8 m into the drum: `south-curtain-west` is stone
over x -22.8..-22.0 and `south-curtain-mid` over x -18.0..-17.2, both
z 14..18 and 7.8 m high. So the room is 4.0 m wide with a flat face on each
side, and the pallet lies along the west one with nothing between its back
and the stone. A set against the ring itself would stand off it by the
sector boxes' bulge, 0.10 to 0.23 m, which is what #833 found of the pulpit.

- `rotationY` 90 turns the set's -Z to world -x and its -x to world +z, so
  the back is on the west face and the head, the ring and the bucket are at
  the south end, farthest from the bars.
- Tile x: the box's west side at -21.995, 5 mm off the face at -22.0, and
  0.75 deep, so its centre is x -21.62, tile -5.405. In general the tile is
  `(-21.995 + depth / 2) / 4`.
- Tile z: the drum's sectors `x -23.464..-21.980` reach in at z under 14.60
  and over 17.40. A 2.32 m box centred on z 16.20 runs 15.04..17.36, 0.04 m
  short of the south one. Tile 4.05.
- The plan box: x -21.995..-21.245, y 0..1.20, z 15.04..17.36. Measured in
  Node against the live plan with a stand-in box of the set's size: check 1
  clear, no flight, the cell still shut with 12 standable cells within 1.5 m
  of the bars, `validateMystery` and `validatePopulace` at 0, Madoc's cell
  at h 0 and 2.2 m from the box.
- **Through the bars.** The bars' north face is z 12.54, so an eye stands at
  (-20, 12.09). The ray to the ring at (-21.97, 16.59) passes the west jamb
  sector's corner, x -20.725 at z 13.575, at x -20.65, and Madoc at z 14 at
  x -20.84, 0.39 m clear of his 0.45 m body. The bucket at (-21.77, 17.20)
  clears the jamb by 0.21 m and the pallet's near corner by 0.10 m. The
  sector box overstates the jamb, whose stone corner is at z 13.30, so these
  are floors. One step east at the bars opens all of it.
- **It is a full collider, not a step.** A set is one mesh and one plan box
  (#815), and a ring at 1.05 m puts that box's top at about 1.2, over
  `STEP_UP` 0.35. The earlier line here, "a low collider a body may step
  onto", was written for a pallet alone. Madoc's station stays standable
  because the box is 2.2 m from it, and #953's rail is what says so. On the
  morning after, when `cell-bars` is `gone`, the player walks round it: the
  cell's seeded cells go 58 to 49.

**If the placement fails**, in the order the suites would say so:

1. `layout` check 1, "cell-pallet ... is inside south-curtain-west": the
   built set is deeper than 0.75 m. Recompute tile x from the formula above.
2. Check 1, "... is inside Prison Tower": the built set is longer than
   2.36 m. Pull the `bucket`'s x toward the pallet in `packs.json` and
   re-render. The tile does not move south or north to make room.
3. `mystery`, the #953 line or a `prisoner:` line of any kind: not expected
   at 2.2 m. The set's tile moves, Madoc's never (#814).
4. Anything else, or no tile on the west face passing: stop, place nothing,
   record the tiles tried in `HISTORY.md`, and the row comes back to
   `architect`. The east face is the mirror, but under `rotationY` -90 the
   ring would be at the north end beside the jamb, so it needs the set's
   pieces mirrored in x and is not a fallback a builder takes alone.

**`cell-door-barred.glb` is not used (#952).** It is not in the tree. Its
frame is 1.4 x 2.25 m and the doorway's plate is 1.76 x 2.5 m. The bars the
player talks through are the built fixture `cell-bars`, which check 3c holds
and which `day2.castle` takes off on the morning after; a prop door would be
a second door that stays.

### Scope, increment 3: the photographed props (gated)

Rank 4's increment 3 ("the props, if the look says a photographed cabinet
in a pixel room is the next wrong thing") moves here (#813). **Gated on rank
4's looking checklist answering "The props" with "replace"**. Then: the
hall's nine photographed `interiorProps` (table, chair, stool, cabinet,
commode, statue, lantern, candleholders, kite shield: 29 draws) become
`interiors` sets, and `lantern-chapel`, which is evidence `body`, becomes a
pinned swap under #811 (its id and box centre, (23.50, 18.21), kept). Every
Poly Haven folder nothing then references leaves in the same commit (#390,
check 4); `ornate_medieval_mace` stays, held by the populace. That leaves
the outer ward about 20 draws lighter, and frees most of the 35.1 MB the ten
prop packs hold of the 37.9 MB of texture memory `test/budget.mjs` counts
today. Class S if the look says "replace all"; if it says anything
narrower, the increment comes back to `architect` first.

### Acceptance

`npm test` fifteen of fifteen after each increment; each line has its break
(#34).

1. **Check 8** over the new rows, under `interiors`' cap. Line 6's break is
   *local*: `hall-trestle` with its benches' legs bevelled at 8 segments.
2. **Check 1, "no interior prop is in a wall"** (`test/layout.mjs`,
   unchanged). **The break the builder quotes**: `kitchen-shelves` (`kitchen-hearth`
   before #830 dropped it) moved 0.5 m into the kitchen's south wall, where
   it stands, expecting "kitchen-shelves at x ... is inside <that run's
   label>". Increment 2's: `cell-pallet`'s tile x -5.405 to -5.53, 0.5 m
   west, expecting "cell-pallet at x ... is inside south-curtain-west".
3. **Check 1e** (2a's): no set stands over a pressable. Break: `hall-high-
   table` over `cooks-accounts`' tile.
4. **Checks 1b, 11, 14, unchanged**; `validateMystery` and
   `validatePopulace` with no station moved: a set on a Vespers station fails
   as "which the player cannot walk to" (#947's break 4), and the fix is the
   set's tile, never the station (#814). **Behind bars that line is never
   asked**, so increment 2 adds one clause to `validateMystery` and one
   `expect` to `test/mystery.mjs` (#953). It is `mystery`'s because the
   stations are (#529). Its two breaks: the clause commented out, expecting
   the `expect` to read "said nothing"; and `cell-pallet`'s tile moved to
   `[-5, 3.5]`, expecting "prisoner: station at prime is in PT, behind bars,
   <the set's height> m up on something that is not its floor".
5. **`test/budget.mjs`, unchanged** (#816): increment 1 added 5 draws to the
   outer ward (7 before #830). Increment 2 adds 1 to the outer ward and none
   to the inner: outer 1026 to 1027, outer plus outside 1192 to 1193 of
   1200, 7 under; inner 709, and 875 with the outside, both as they were;
   1826 meshes to 1827; 164 textures to 165, one 16 px atlas. The builder
   writes the printed lines before and after in `HISTORY.md`.
6. **`plan-vs-scene.mjs`**, unchanged: one tagged mesh per set, diffed.
7. **Check 8 over `cell-pallet`**: about 360 triangles and 13 KB expected
   (measured at #971: 456 triangles, 13,632 bytes),
   against 2,500 and 96,000; the pack's five files about 2,070 triangles and
   70 KB. Its line 6 is not broken again: #947's break 1 was that line, in
   this pack, through the same `sizes` path. If `cell-pallet` measures over
   600 triangles the builder says why in `HISTORY.md`.

### Open calls

- **Fold, sequence or split with rank 4's increment 2** (a wall and a floor
  texture per named room). Recommend **split, by surface and volume**
  (#813): rank 4 owns every face's texture and makes no piece; 2b makes
  pieces and never one whose job is to cover a wall or a floor (no
  panelling, no floor tiles, no rugs). Both are lane B, so they never run at
  once, and neither waits on the other. Rank 4 may add palette colours and
  never removes one a manifest row uses; check 8 line 7 fails the day it
  does, naming the asset.
- **Instancing or merging.** Recommend **merge in Blender, one mesh per
  set** (#815): an `InstancedMesh` needs a builder branch, a `budget.mjs`
  branch and a rule for which box `plan-vs-scene.mjs` diffs, three new
  things for a count a join gets to for nothing. A repeated bench costs a
  few KB of bytes, not a draw.
- **The smithy and the stables.** Recommend **not in this row** (#814):
  neither is a room, and a room is a layout call (the floor plan editor, #909), not a kit's; #582 refused new rooms for volume. The
  lore puts the forge "under the Prison Tower's wall" (year 12), which is
  outside the south curtain; a stable waits on a horse, which is 2d's to
  make or not.
- **The photographed props.** Recommend **2b's increment 3, gated on rank
  4's look** (#813), since the replacement is Blender sets and 2b makes them.
- **A set against a station.** Recommend **the set moves, the station never**:
  stations are `test/mystery.mjs`'s (#529), and a kit has no claim on them.
- **The draw ceiling.** Recommend **no move** (#816); the numbers are there.
  After increment 2 the outer ward has 7 draws left, so the next row that
  adds to it brings #609's sector merge to `architect` first.
- **For Devon: does the chapel get a 2b set?** **Answered no, 2026-10-03
  22:58 ET (#971).** Recommend **no** (#951): the
  drum's 24.6 square metres already hold seven pieces, a flight and four
  stations, and its altar, pulpit, rood and pews stand next door in 2g's
  nave. **If this is not answered when increment 2 is built, the builder
  builds the cell alone.** A yes is a new increment through `architect`,
  with its tile measured the way the cell's was.
- **Which face of the cell.** Recommend **the west, `rotationY` 90** (#952):
  it is flat, and the head end is seen from the bars' centre past Madoc.
- **Straw.** Recommend **one new `extraColour`, `#b89d55`, appended** (#952):
  #819 already granted it, it is the countryside's wheat so the castle keeps
  one yellow, and a pallet in plaster or linen reads as a mattress.
- **`cell-door-barred.glb`.** Recommend **not used** (#952): the doorway
  already has its bars, and they are the ones the morning after removes.
- **Where the barred-station rail lives.** Recommend **`validateMystery`,
  held by `test/mystery.mjs`** (#953): #529 gives the stations to that
  suite, and `layout.mjs` asks only what is reachable from the spawn.

### Dependencies

- **Gate: rank 1 shipped (#881); 2a shipped (#907)** (check 1e, #811).
- **Lanes F and B.** Not beside any Blender pack, or rank 4.
- **Increment 3 waits on rank 4's look** (#53), which is rank 3's machine
  and sitting.

### Constraints

- #813: no piece covers a face. #815: one mesh per set. #814: no station moves.
- #500: every set is an `interiorProps` plan piece with a `planId`.
- #390, #506, #584, #632. #611, #816: no ceiling moves.
- #529: no rail moves; every one above already exists but check 8's line
  and #953's clause, which is new and on `mystery`'s side.
- #13, #34, #147. #53: whether a room reads as its trade is Devon's look.
- #801 to #808, #811 to #816, #819, #830, #837, #946, #947, #951 to #953, #971.

### Looking checklist

- [ ] The kitchen from its door: a kitchen, or a room with furniture?
- [ ] The hall at Vespers with the household at the trestles: seated, or
      standing in the benches?
- [ ] Kit sets beside the photographed cabinet: the answer rank 4's "The
      props" line needs for increment 3.
- [ ] The cell through the bars, from their centre: the ring, the chain and
      the pallet's head past Madoc's shoulder, or only Madoc?
- [ ] The pallet: straw, or a yellow box? And is a pallet along the west
      face the right wall, or does the cell want it at the back (#952)?
- [ ] The morning after, inside the cell: the set is a 1.2 m collider over a
      0.18 m pallet. Does walking into the air above it read as a bug?

---

## Blender: a shared rig with swappable parts

**Rank 2c. Size 2+. Model Opus 5. Where: Local: Blender (increment 1, built
and committed on huginn; its GPU look is a later Windows sitting, #939);
Container (increment 2, after that look says Yes). Gate: rank 1
shipped (#881). Lanes F and C; not B.** Decided in `HISTORY.md`
as #820 to #825, amended by #939 and #940; this section is the `builder` job
those decisions leave.
**Status: increment 1 shipped on huginn (#941). Left: the Windows GPU look (#939) and increment 2.** Before it, nothing under `assets/blender/folk/` existed. **Rank 10 is retired**
(#807): its "shared low-poly rig for the fifty" is this row, and the Bodies
section is deleted once this one and "Blender: the animals" land. **This row
does not duplicate rank 6**: it makes bodies and writes a person's body
fields; "Life: a populace" owns every ring, every `talk` pair and every new
person's place in the day (#821).

**Every pack rule is "Blender: what every pack shares"'s "What every Blender pack
shares"**, cited, not repeated. What this row changes about it is #820:
a skinned pack carries two materials over its one atlas image, and its frame
is its root joint rather than its box centre.

**The shape, in one line**: one rig in one file, `folk.glb`, carrying every
part as its own one-primitive mesh node; a person names the parts they wear
in `data/populace.json`, `npc.js` hides the rest, and a 2c person draws at
most five skinned primitives where a Quaternius one draws 12 to 15.

**Measured on `86c72fb`, gltf-transform in Node.** The four Quaternius
humans: 62 joints, 5,476 (Farmer) to 11,110 (King) triangles, 1,213,228 to
1,427,344 bytes, and 12 to 15 visible skinned primitives per person once
`hideNodes` and `hideMaterials` are applied (Woman, Farmer and King 12,
Adventurer 15). The 34 bodies the page builds draw **380 skinned primitives**:
the 14 cast 165, the 16 populace humans 204, the hound 5, the hens 1 each,
the cow 4. Per ward, counted the way `test/budget.mjs` section 3 counts
bodies, the peaks are **outer 205 at `terce-eve`, inner 183 at `terce` and
`terce-eve`**. Bodies: 34 of `MAX_SKINNED_TOTAL`'s 34; outer 20 of 20 at
`terce-eve`, inner 15. Clips the 16 populace humans' routines resolve to:
`Idle`, `Idle_Neutral`, `Idle_Sword`, `Sweep`, `Stir`, `Hammer`, `Spar`, and
`Run` for the girl's walk.

### Scope, increment 1: the rig, the parts, one wearer (Local: Blender)

- **`tools/blender/packs.json`**: two packs.
  - **`folk`**, one row, `name: "folk"`: the rig, the parts catalogue and
    the clip table as the row's params, so all three are inside the source
    hash (#806) and check 8 line 4 sees a change to any of them.
  - **`held`**, one row per rigid tool. Increment 1 ships one, `mallet`,
    for the carter (his `hammer` stop, #800).
- **`tools/blender/packs/folk.py`**, importing `common.py`:
  - **The rig** (#823): 20 joints, named as Quaternius names them where one
    exists, so `boneScale: { Head: 1.35 }` and `HAND_BONES`' `/^wrist\.?r$/i`
    keep working with no change: `Root`, `Hips`, `Torso`, `Chest`, `Neck`,
    `Head`, `UpperArm.L/R`, `LowerArm.L/R`, `Wrist.L/R`, `Fingers.L/R`,
    `UpperLeg.L/R`, `LowerLeg.L/R`, `Foot.L/R`. `Fingers.R` exists because
    `_attachHeldProp` aims a prop along the mean of the hand bone's child
    joints and falls back to local -Y, which on a Blender bone points back
    up the arm. One armature, one skin, every part weighted to it.
  - **The parts** (#820), each its own mesh object, one material, so one
    glTF node with one primitive, named `<slot>-<variant>` with a hyphen,
    because three's `sanitizeNodeName` strips dots. Five slots:
    `skin` (face, hands; `Bare`; required), `garment` (required), `hair`,
    `over`, `hat` (each optional). The recommended first catalogue, 22
    parts: `skin-man`, `skin-woman`, `skin-old-man`, `skin-old-woman`;
    `garment-tunic`, `garment-gown`, `garment-robe`, `garment-smock`,
    `garment-mail` (`Bare`); `hair-cropped`, `hair-long`, `hair-bun`,
    `hair-grey`, `hair-beard`; `over-apron`, `over-cloak`, `over-tabard`;
    `hat-coif`, `hat-hood`, `hat-cap`, `hat-wimple`, `hat-helm` (`Bare`).
    Every garment is modelled over the same rest pose, so any garment fits
    any `skin`. A child is `skin-woman` or `skin-man` at `modelHeight` 1.15
    with `Head` at 1.35, as #643 made one.
  - **Two materials over the one atlas image**: `Cloth`, which the tint
    multiplies, and `Bare`, which it does not (skin, hair, eyes, mail, a
    helm). Cloth swatches sit at the light end of the palette, so the tint
    carries the colour the way the hound's coat was lifted (#644) and the
    hen is near-white (#684); undyed linen may be one of the pack's 8
    `extraColours` if `textures.json` has nothing light enough.
  - **The clips** (#822), keyed by the script from the row's `clips` table,
    one row per clip in `tools/bodies/clips.json`'s grammar (`cycles`,
    `driver`, `moves` of `{ bone, axis, rest, amp, phase }`) over this
    rig's own `Idle`. Eleven: `Idle` (at least 2.0 s), `Idle_Neutral`,
    `Idle_Sword`, `Walk`, `Run`, `Wave`, `Sweep`, `Stir`, `Hammer`, `Spar`,
    `Drill`. Integer cycles, so every clip loops by construction. Exported
    with animations on.
  - **The frame** (#820): the `Root` joint at the origin, feet on y 0,
    facing -Y in Blender, so +Z in glTF. Not box-centred: the union of 22
    parts, a cloak's back included, is not where the feet are.
  - The contact sheet lays out six assembled people, not the 22 parts.
- **`tools/blender/packs/held.py`**: a mallet, head and haft, about 0.45 m,
  authored along +Y with the head up; one material, no skin.
- **Output**: `assets/blender/folk/folk.glb`, `assets/blender/held/mallet.glb`,
  their manifest rows.
- **`src/npc.js`** (lane C):
  - `BARE_MATERIALS` gains `/^bare$/i`. One line, as `/^horn$/i` was (#789).
  - **`parts`**: when `def.parts` is set, every mesh under the model whose
    name is not in it is hidden, before anything is measured.
  - **The height of a parts body is its `skin-*` node's box**, not the
    model's: `Box3.setFromObject` counts hidden meshes, so today's line 143
    would scale a bare-headed person by the tallest hat in the file.
  - Nothing else: tint, `boneScale`, `clips`, `speed`, `heldProp` and
    `heldPropFit` already read the def and work on this rig by its names.
- **`src/populace.js`** (lane C, #940): `populaceDefs` gains one line,
  `parts: p.parts,`, beside `hideMaterials`. It copies body fields by name,
  so without it `def.parts` never reaches `npc.js` for a populace person.
  No `?? []`: `npc.js` branches on `def.parts` being set, and an empty list
  would hide every mesh on a Quaternius body. Nothing else in the file.
- **`data/populace.json`** (lane C, body fields only, #821):
  - **The first wearer is the hen-wife**: `modelPath` to
    `assets/blender/folk/folk.glb`, `parts` e.g. `["skin-old-woman",
    "garment-gown", "over-apron", "hat-wimple"]`, her tint kept,
    `hideNodes` and `hideMaterials` removed. Her ring is untouched: `tend`
    and `wait`, `Idle_Neutral` and `Idle`, both in the file. This is the
    reference #390 needs for `folk.glb`, so it is written in the commit
    `folk.glb` lands in, before the GPU look below (#939).
  - **The carter** gains `heldProp: "assets/blender/held/mallet.glb"` and a
    `heldPropFit`, on his Farmer body; the reference #390 needs for the
    mallet.
  - `bodyComment` says what `parts` is and that the body fields are the body
    rows'.
- **`test/assets.mjs`** check 8 (lane F): caps lines `folk` and `held`
  (Acceptance), the `materials` and `frame` amendments of line 6 (#820),
  and a skinned half for `folk`.
- **`test/mystery.mjs`**: the parts rail, and the silhouette tuple gains
  `parts` sorted. The existing household-bodies check (#644, "N bodies, N
  of them the cast's and N the household's own") accepts a body under
  `assets/NPCs/` or `assets/blender/` (#940): both `startsWith` tests in
  it become the pair, and its comment names check 8 as what holds the
  second prefix.
- **`test/budget.mjs`** section 3: skinned draws, per ward and in total,
  beside skinned bodies, with two new ceilings (#825).
- **`test/plan-vs-scene.mjs`**: one beat, the live seam only.
- **Untouched**: `tools/bodies/` and every file it writes (#807),
  `assets/NPCs/`, `data/npcs.json`'s cast, `src/populace.js`'s
  `ACTIVITY_CLIPS` (the eleven names are the values it already maps to;
  the file's one change is `populaceDefs`' line above, #940),
  `src/save.js` (bodies are not saved; `SAVE_VERSION` stays 6),
  `data/scene-config.json`, `MAX_SKINNED_TOTAL` and `MAX_SKINNED_PER_WARD`.

### Scope, increment 2: the rest of the household (Container)

- **`data/populace.json`**: the other 15 populace humans move to `folk.glb`,
  each with `parts` and their tint, `hideNodes` and `hideMaterials` dropped.
  Every ring stays as it is. The girl keeps `modelHeight` 1.15, `boneScale`,
  `clips: { walk: "Run" }` and `speed`; the serjeant, man-at-arms and
  watchman keep `assets/NPCs/Spear.glb` and its fit. At least as many
  distinct `parts` sets as people, so the silhouette count rises.
- **`test/budget.mjs`**: the two draw ceilings come down to what the suite
  then prints (#825): about 256 in total and 143 in the busier ward.
- No Blender and no GPU: every line is data and a Node or headless suite.
  The look at a whole household of 2c people is the next GPU sitting's, not
  this increment's gate, because #807's gate is the line-up increment 1
  already passed.

### Acceptance

**`npm test` fifteen of fifteen.** Each line names its suite and the break
that turns it red from green (#34); *local* needs a re-render.

**`test/assets.mjs` check 8, the caps block gains two lines** (#823):
`folk: { triangles: 12000, bytes: 400000, person: 1500, joints: 20,
materials: ['Cloth', 'Bare'], clips: 11 }` and `held: { triangles: 300,
bytes: 16000 }`. Line 6 reads `materials` off the pack's caps line, one
unnamed material by default (#820), and for a skinned pack holds the `Root`
joint at x and z 0 within 1 mm instead of the box centre. The skinned half,
over `folk.glb`:

1. **Rig.** One skin, at most 20 joints, `Head` and `Wrist.R` among them,
   and `Wrist.R` with a child joint. Break, *local*: drop `Fingers.R`.
2. **Parts.** Every mesh node is one primitive, its material `Cloth` or
   `Bare`, its name `<slot>-<variant>` with the slot one of the five, and
   `skin` and `garment` each have at least one. Break, *local*: join
   `hat-helm` and `hat-coif` into one object with two materials.
3. **A person's triangles.** The sum over the five slots of the heaviest
   part in each is at most `person`, which bounds every combination without
   naming one. Break, *local*: subdivide `garment-robe` past it.
4. **Skin.** Every vertex's weights sum to 1 within 1e-3 and index inside
   the skin, the cow's rail (#794) pointed at this file. Break, *local*:
   weight `hat-cap` to joint 20.
5. **Clips.** Exactly the eleven names; every channel targets a joint of
   the skin; every clip loops (`seamOf`, as 2a's line 4); each activity
   clip's `driver` gets 20 degrees from `Idle` at some key (2a's line 5).
   Break, *local*: `cycles: 1.5` on `Sweep`.

`held` is held by the pipeline's lines as they stand.

**`test/mystery.mjs`, the parts rail**, per person, reading the file the
person wears as the per-person clip check already does:

- every `parts` entry is a mesh node of that file; exactly one `skin-*`,
  exactly one `garment-*`, at most one of each other slot;
- a file with slot-named nodes is refused without `parts` (it would wear
  all 22 at once), and `parts` on a file without them is refused;
- `parts` beside `hideNodes` or `hideMaterials` is refused;
- the silhouette count still exceeds the number of body files.

Break, the one increment 2's builder quotes: delete the page's `parts` line.
Expected: "page wears assets/blender/folk/folk.glb with no parts, and would
show all 22 of them".

**`test/budget.mjs` section 3, skinned draws** (#825). A person's draws are
the skinned primitives of their file left visible by `hideNodes`,
`hideMaterials` and `parts`; a body counts in every ward it counts in for
bodies. `MAX_SKINNED_DRAWS_PER_WARD = 205` and `MAX_SKINNED_DRAWS_TOTAL =
380` in the ceilings block, with #825 beside them. Increment 1 prints 372
in total and 197 in the outer ward at `terce-eve` (#940: the hen-wife goes
from 12 to her 4 parts); increment 2 lowers both ceilings to what it prints.
Break (#940): drop `"Gold"` from the baker's `hideMaterials`; expected "381
skinned draws, over the ceiling of 380". Deleting her `hideNodes:
["Sword"]` is not a break and leaves 380: `Sword` in `Woman.glb` is a rigid
mesh on the joint `Middle1.R`, not a skinned primitive. A rigid mesh held
by a joint is outside this count on purpose, baked in or a `heldProp`: it
is an ordinary draw that no section of `budget.mjs` counts as one (section
1 counts plan pieces), and section 4 prices its texture.

**`test/plan-vs-scene.mjs`, one beat, the seam and nothing Node can prove**
(#529): for every live body whose def has `parts`, the visible meshes under
it are exactly those names; its `Bare` material's colour is `ffffff`, so the
tint missed it; its `skin-*` node's live box top is its `modelHeight` (1.8
if none) within 0.02 m. **Break, the one increment 1's builder quotes:
delete the hide branch for `parts` in `npc.js`.** Expected: "hen-wife shows
22 meshes; her parts name 4", and the height line goes red with it. Deleting
`parts: p.parts,` from `populaceDefs` reads the same, and is the only rail
on that line (#940).

**Held by what exists**: check 1 and check 4 (both files resolve and are
referenced), check 5 (meshopt, `finish.mjs`'s), check 8 lines 1 to 8,
`test/mystery.mjs`'s per-person clip check (every job the hen-wife and,
in increment 2, all sixteen do resolves in `folk.glb`), section 4 of
`test/budget.mjs` pricing the embedded atlas, `test/built.mjs` serving both.

**The GPU look, on Windows, after the commit, and it gates increment 2**
(#939, amending #824; #807, #53). Increment 1 is committed on huginn with
the hen-wife on `folk.glb` and `npm test` green; the look is its own later
sitting on the Windows machine: `npm run dev`, a line-up on the
grey background #606 and #643 used, the hen-wife's parts on `folk.glb` at
1.65 m beside the baker on `Woman.glb`, both tinted, both in `Idle`, then
both in `Walk`. One sentence in a `HISTORY.md` entry of its own: does the
2c woman read as the same game as the Quaternius one? **Yes**: increment 2
may start. **No**: one data commit puts the hen-wife's body fields back on
`Woman.glb`; `folk.glb` stays only if `data/` still names it (#390),
otherwise it and its manifest and `packs.json` rows leave in that commit;
and the row comes back to `architect` with what read wrong. Until the
verdict the published page shows one unjudged body, which #939 accepts.
Rank 10's inherited look goes on the same sitting's checklist and blocks
nothing: the girl at running speed, the spear on the garrison, the five
clips on the four Quaternius bodies, and the eleven on `folk.glb`.

**Determinism, local**: a second `npm run blender:render folk held` prints
"unchanged" for both, `git status` clean.

### Open calls

- **Clips: authored in Blender or retargeted from `tools/bodies/`' five.**
  Recommend **authored in Blender from a table in the row** (#822):
  `clips.json`'s moves are offsets on the Quaternius `Idle`, which Blender
  can only read by importing a `.glb`, which #803 forbids.
- **One file of parts or one file per part.** Recommend **one file**: one
  skeleton per person with no rebinding code in `npc.js`, one fetch, and
  `hideNodes`' own mechanism.
- **Where held tools live.** Recommend **rigid `.glb` rows in a `held` pack
  on `heldProp`**: a skinned tool would be a sixth skinned draw, and
  `_attachHeldProp` already parents a static mesh to `Wrist.R`.
- **Tint on one material or two.** Recommend **two, `Cloth` and `Bare`,
  over one image** (#820): one material tinted puts the tint on faces,
  which is the thing the live skin rail exists to catch (#419).
- **The first wearer.** Recommend **the hen-wife**: populace, not cast; her
  two jobs are two of the eleven clips; she stands in the outer ward beside
  the hens and the cow, which is where 2d's animals go too.
- **The cast.** Recommend **the fourteen stay on Quaternius in this row**
  (#824): the live skin rail reads the cast's `Skin` material, their look
  was judged in the GPU run (#780 to #782), and `tools/bodies/`' byte rails
  need the four files referenced.
- **Swapped parts per bell.** Recommend **no**: `parts` is a body field
  fixed for the page, as `tint` is; a hat that comes off at Sext is a
  routine field, and routines are rank 6's.
- **The 16 more toward fifty.** Recommend **rank 6's, on 2c's rig**, each
  new body costing the #789 argument against both skinned ceilings; this row
  adds no person and moves neither body ceiling (#825).

### Dependencies

- **Gate: rank 1 shipped (#881).** `common.py`, the manifest and check 8
  now exist.
- **Lanes F and C.** Increment 1 holds both; increment 2 holds C only. Not
  beside rank 6 (C), 2d (F and C), or 2b (F). Beside rank 4 (B) and rank 7 (E): yes.
- **Increment 2 after increment 1**, and only after its look passed.
- **"Blender: the animals" follows this row** by letter, and uses
  increment 1's `/^bare$/i`, check 8's `materials` and `frame` amendment
  and the draw count. Recommend **2d may start once increment 1 is
  committed, without the look's verdict** (#939): all three are source the
  commit carries and a No does not remove.

### Constraints

- #807: bodies from Blender only, never from `tools/bodies/`; no file it
  writes is touched; the Quaternius rigs keep every body until the look,
  the hen-wife excepted (#939).
- #803, #805, #806, #808: the pipeline's rules as "What every Blender pack
  shares" states them.
- #390: `folk.glb` and the hen-wife, `mallet.glb` and the carter, one commit
  each.
- #499: two files under about 420 KB against 200 MB.
- #500: a person is not a plan piece; nothing here gets a `planId`.
- #529, #611: file facts in `assets.mjs`, person-against-file in
  `mystery.mjs`, cost in `budget.mjs`, the live hide and height in
  `plan-vs-scene.mjs` only.
- #36: no save field, `SAVE_VERSION` stays 6.
- #632: `populace.json` is written in its own ending; `packs.json` and
  `manifest.json` as the pipeline says.
- #13, #34, #147: every line above has its break; one that stays green on
  its break is not shipped.
- #53: the line-up and every clip's look are a GPU's; a real-time assertion
  failing under software Chromium is inconclusive.
- #820 to #825, #939, #940.

---

## Blender: the animals

**Rank 2d. Size 1. Model Opus 5. Where: Local: Blender. Gate: rank 1 shipped (#881)
and after "Blender: a shared rig with swappable parts" increment 1;
recommended after its increment 2. Lanes F and C; not B.** Decided in
`HISTORY.md` as #826 to #829, on #820's and #825's shape, corrected by #942 and #944.
**Status: both increments shipped on huginn (#942 to #945): six files, 240,748 bytes, bodies 41, outer 24 at `terce-eve`, inner 18, draw ceilings 394 and 213. Left: the Windows GPU look only, which blocks nothing (#53).** **Rank 10 is
retired** (#807): its "pig, then a goat" is this row, and its GPU look at
the hound, the hens and the cow moves into this row's checklist. **This row
does not duplicate rank 6**: it makes the animals and writes each one's
first ring, the reference #390 needs (#821); every later change to a ring is
"Life: a populace"'s.

**Every pack rule is "What every Blender pack shares"**, cited, not repeated,
as #820 amends it for a skinned pack: `Coat` and `Bare` over one atlas image,
framed on the `Root` joint.

**What stays as it is** (#807, #826): `assets/NPCs/Cow.glb` is
`tools/bodies/`' and is not re-made; the hound (`Hound.glb`, #644) and the
two hens (`Hen.glb`, #684) are sourced Quaternius files and stay. This row
adds kinds; it replaces none.

### Scope (two increments, one machine)

- **`tools/blender/packs.json`**: pack `animals`, one row per kind: `pig`,
  `goat`, `sheep`, `horse`, `cat`, `goose`. A row carries the kind's
  proportions (bone heads and lengths) and its clip table in
  `tools/bodies/clips.json`'s grammar.
- **`tools/blender/packs/animals.py`**, importing `common.py`:
  - **One quadruped topology** (#826), the cow's 15 joint names, which
    are the hound's where one exists (#794): `Body`, `Neck1`, `Head`,
    `Ear.L/R`, `FrontUpperLeg.L/R`, `FrontLowerLeg.L/R`,
    `BackUpperLeg.L/R`, `BackLowerLeg.L/R`, `Tail1`, `Tail2`, plus `Root`
    at the origin: 16. Each of the five kinds is its own `.glb` with its own
    rest proportions and meshes; the topology, names and clip grammar are
    shared.
  - **A bird topology for the goose**: `Root`, `Body`, `Neck1`, `Neck2`,
    `Head`, `Wing.L/R`, `UpperLeg.L/R`, `LowerLeg.L/R`, `Tail1`: 12.
  - **Two materials over the one atlas**: `Coat`, tinted, and `Bare`
    (eyes, nose, hooves, horns, beak, feet), not. So one kind file makes a
    white and a dark sheep by `tint`, as two hens are one file (#684).
  - **Clips**: quadrupeds `Idle` (at least 2.0 s), `Walk`, `Eating`; the
    goose `Idle`, `Walk`, `Idle_Peck`. So `wait`, `eat` and `peck` resolve
    through `ACTIVITY_CLIPS` as it stands, and no activity is added. No
    `Wave`: an animal does not greet (#644, #794).
- **Output**: `assets/blender/animals/<kind>.glb`, six files.
- **`data/populace.json`** (lane C): seven people, each with `id`, `name`,
  `role` ("one of the ..." as the hens'), `modelPath`, `modelHeight`,
  `tint`, and a first ring of `wait` and `eat` (or `peck`) stops at all
  eight bells, as the cow's (#794). Where (#829):

  | Kind | Ward | Room | `modelHeight` |
  | --- | --- | --- | --- |
  | pig | outer | `outer-ward`, by the hen-wife's patch, (-5.438, -0.938) (#942) | 0.8 |
  | sheep | outer | `outer-ward`, beside the cow | 0.9 |
  | goose x2 | outer | `outer-ward`, by the hens | 0.75 and 0.72 (#944) |
  | horse | inner | `inner-ward`, south-west corner (#942) | 1.65 |
  | goat | inner | `inner-ward` | 0.95 |
  | cat | inner | `bakehouse` | 0.3 |

  No stable: no such room exists, and a new room is a plan piece in
  `data/scene-config.json`, lane B. No yard: `wykes-yard` is `outside`,
  unreachable by rank 4c's rule, and section 3 refuses a stop there. If
  `validatePopulace` refuses a tile, the fallback is the same ward's
  courtyard, as the writer's was (#729).
- **`test/assets.mjs`** check 8: caps line `animals` and a skinned half.
- **`test/budget.mjs`**: the ceilings #828 sets.
- **`test/mystery.mjs`**: the household count, 20 to 27.
- **Untouched**: `tools/bodies/`, `assets/NPCs/`, `src/npc.js` (2c's
  `/^bare$/i` covers `Bare`), `src/populace.js`, `src/save.js`,
  `data/scene-config.json`.

**Increment 1**: the quadruped topology and its five kinds, placed; bodies
34 to 39. **Increment 2**: the goose and its bird topology, two placed;
39 to 41. One Blender session each.

### Acceptance

**`npm test` fifteen of fifteen.** Check 8's caps block gains
`animals: { triangles: 1000, bytes: 80000, joints: 16, primitives: 2,
materials: ['Coat', 'Bare'] }`, per asset (#827). The skinned half over the
six files, each with its break:

1. **Caps.** One skin; joints, triangles, primitives and bytes under the
   line. Break, *local*: give the pig's snout a third material.
   **This is the break the builder quotes.** Expected:
   "assets/blender/animals/pig.glb has 3 primitives, over 2".
2. **Topology.** A quadruped's joint names are exactly the 16 above, a
   goose's exactly the 12. Break, *local*: rename the goat's `Tail1`.
3. **Skin**, as 2c's line 4. Break, *local*: weight the cat's ear to
   joint 16.
4. **Clips.** Exactly its three names, each channel on a joint of the skin,
   each loop sealed (`seamOf`), `Idle` at least 2.0 s, and `Eating` or
   `Idle_Peck`'s driver (`Head`) 20 degrees from `Idle` at some key.
   Break, *local*: `cycles: 1.5` on the horse's `Walk`.
5. **Reads as four-legged.** A quadruped's bind-pose box is at least 1.15
   times as long (z) as it is tall (y): the cow's 1.3 less the goat's horns.
   Break, *local* (#942): swap y and z on every part and every joint of the sheep and set it back on the floor, a sheep stood on its tail. Swapping only the body's one prism leaves the rail green, since the neck, head and tail still make the box 1.44 m long. Expected: "0.89 m long and 1.45 m tall, under 1.15 to 1".

**`test/budget.mjs`** (#828): increment 1 prints 39 bodies, outer 22 at
`terce-eve`, inner 18; increment 2 prints 41 and outer 24. The draw ceilings
rise by the animals' own draws, 2 each. **`test/mystery.mjs`**: the
per-person clip check holds `eat` and `peck` to the file each animal wears;
the silhouette count rises by six files and seven shapes.

**The GPU look, local, blocks nothing** (#53): each kind at 10 m in the
castle reads as its kind; the pig and sheep beside the cow read as one farm;
the geese beside the hens; and rank 10's inherited three: the hound's
follow, the hens' peck, the cow grazing. One sentence each in the entry.

**Determinism, local**: a second `npm run blender:render animals` prints
"unchanged" six times, `git status` clean.

### Open calls

- **One quadruped rig or one per kind.** Recommend **one topology, the
  cow's names, one file per kind** (#826): proportions differ too much for
  one mesh, and shared names keep one clip grammar and one rail.
- **The geese.** Recommend **a 12-joint bird topology of their own**: the
  quadruped's front legs are wings on nothing, and the hen's 7-joint rig is
  a sourced file this pipeline may not import (#803).
- **Re-make the cow in Blender to match.** Recommend **no**: #807 keeps it
  `tools/bodies/`', it is byte-held in Node, and the look sitting says
  whether it jars.
- **A cheap-animal budget.** Recommend **hold #789's refusal** (#828): the
  draw count #825 adds is the cost measure that tells an animal from a
  human, so a second body count is not needed to make that argument.
- **How many sheep.** Recommend **one**, tinted, and a second only as a
  rank 6 row's argument: one per kind proves the kind, and every body is
  the #789 argument.
- **The cat's job.** Recommend **`wait` and `eat` in the bakehouse**, no
  new activity: `ACTIVITY_CLIPS` is shared with rank 6 and a mouser needs
  no clip the table lacks.
- **If 2c's look fails and its increment 1 never lands** (cannot occur as written, since increment 1 landed first, #939). Recommend
  **2d's increment 1 carries the three shared pieces itself** (the
  `/^bare$/i` line, check 8's `materials` and `frame`, section 3's draw
  count at 380 and 205) and argues its own draws on top in its entry.

### Dependencies

- **Gate: rank 1 shipped (#881)**, and 2c's increment 1 for the shared pieces above.
- **Recommended after 2c's increment 2**, which frees the draw headroom this
  row spends (#828); before it, the argument is 380 to 394 and 205 to 213.
- **Lanes F and C.** Not beside rank 6, 2c or 2b.

### Constraints

- #807: the cow, hound and hens stay; no file `tools/bodies/` writes is
  touched.
- #789, #828: one body, one count, each argued; the per-ward ceiling's
  argument is the draw count, before and after.
- #390: each `.glb` and its person in one commit.
- #499: six files under 480 KB.
- #500, #529, #611: as 2c's.
- #36: no save change.
- #632: `populace.json` in its own ending.
- #13, #34, #147: every line has its break.
- #53: the look is a GPU's and blocks nothing in `npm test`.
- #820, #821, #825 to #829.

---

## Blender: the countryside beyond the wall

**Rank 2e. Shipped (#908), in one increment, against #816 to #819.** Its row is
retired from `BACKLOG.md` and `ROADMAP.md`. What other sections cite, and what
is still open:

- **Check 4g** (`test/layout.mjs`, #817, #818): the five backdrop pieces sit on
  y 0, overlap nothing, meet every side of `ground` and `outside-ground`, and
  their far sides lie past `fog.far` from the nearest eye. A `backdrop` row
  without `noCollide` throws in `src/castle-plan.js`.
- **Open: the GPU look (#53).** It belongs with the next rank 3 GPU run.

### Looking checklist

- [ ] From the north walk: land under the wall, or a seam at the apron?
- [ ] From the North-west Tower's roof: town, quay and hills as one view?
- [ ] The rim at Prime, Sext, Vespers and Lauds: a horizon in the fog?
- [ ] The farms at 60 to 130 m: farms, or boxes?

## Castle in Blender

**Rank 2h. Shipped and closed (#962), against #839 to #844, #892, #893 to
#899 and #955 to #961.** The castle, Mereford and the countryside rebuilt as
a realistic standalone Blender model with Poly Haven PBR and Devon's 71
props re-materialed inside it, built headless under `tools/castle3d/` on
Blender 5.2, outside the Blender pipeline's own rules (#840) and never
loaded by the game (#842). Ten increments plus 7b, each decided before it
was built, all shipped; Devon's verdict on the nine review stills and the
nine look calls, all "as built," closes the row (#962). What depends on it:

- **The integration row (2i, #919 to #924)**: the game takes `castle.glb`
  as a skin swap and never reads `markers.json`; its spec, argued from
  #961's numbers (#923), is "Castle in Blender: the integration row" below
  (#963 to #968).
- **Rank 4**: its increment 2 was superseded by this row (#839); its
  looking checklist is unaffected.

---

## Castle in Blender: the integration row

**Rank 2i. Size 2+ (six increments). Model Opus 5. Where: Local: Blender
GPU (5.2, Devon's Windows machine only, #878) with KTX-Software's `ktx` on
PATH (#506) for every increment that cuts; judged local: GPU (#53). Gate:
none (2h shipped, #962). Lane G, extended to `data/castle-skin.json`
(#963).** Shape decided in #919 to #924; spec decided in #963 to #968,
argued from #961's master and measured in Node against it (#963's entry
says how; the KTX2 projection is calibrated by reproducing #961's 1,738.8 MB
to the decimal). The game takes the model as a skin: the plan stays the
single source for every collider, room, station and box (#500, #919), and
the model replaces what is drawn, a stage at a time (#921, as #964 amends
it).

**The shape, in one line**: `skin.py`, a fourth Blender over the master,
writes `<out>/skin/skin-full.glb` with props, markers and the excluded
model-only objects gone, trees and rocks decimated and joined, tints baked
into pixels and images capped; `skin.mjs` cuts it to the stages
`data/castle-skin.json` lists and writes `assets/castle3d/skin.glb`; `npm run
assets:encode` makes it KTX2 and meshopt; the builder builds every plan
piece as today, hides each one a skin node names, and draws the node in its
place.

**What ships of the master** (#963, #966, #968):

| | The master (#961) | The skin, all four stages, projected |
| --- | --- | --- |
| File | 569,711,256 bytes | about 25 MB: 18.4 MB of KTX2 (measured medians), about 6.5 MB of meshopt geometry (estimated) |
| Texture memory | 1,738.8 MB, 130 images | 37.3 MB, 84 images |
| Triangles placed | 41,821,350 | about 295,000 |
| Draws | 959 | about 280 |

| Stage | Plan pieces | Skin draws | Skin triangles | Texture memory, cumulative | Castle's texture bill (43.9 today) | Outer + outside draws (1187 today) |
| --- | --- | --- | --- | --- | --- | --- |
| `curtain` | 152 | 132 | 40,000 | 14.7 MB, 33 images | 58.6 MB | about 488 |
| `buildings` | 40 | 42 | 6,472 | 21.3 MB, 48 | 65.2 | about 454 |
| `town` | 59 | about 93 | about 28,000 | 28.0 MB, 63 | 71.9 | about 416 |
| `land` | 5 | about 15 | about 221,000 | 37.3 MB, 84 | 81.2 | about 411 |

### Scope, by file

- **`tools/castle3d/gates.py` and `buildings.py`** (increment 1, #922):
  `LEAF_barbican-outer-a` and `-b` open, `PORT_barbican-outer` raised, both
  keeping `modelOnly: "#851"`; the four `#855` drum doors deleted and
  `ROOF_great-hall` cut back to #527's 0.75 m slot of sky. `check.py`'s nine
  lines and `check-export.mjs` stay as they are and pass.
- **`tools/castle3d/skin.py`**, new: a fourth Blender, `blender -b
  <out>/castle.blend --factory-startup --python-exit-code 1 --python
  tools/castle3d/skin.py -- --out <out>`, which never saves the master. In
  order: delete the `props` stage's objects, `BRAZIER_`, every `#853` and
  `#855` object, `GUIDE` and `MARKERS`; decimate (each tree at most 2,000
  triangles, each rock 1,000, `TERRAIN_ground` 40,000); join the land's trees
  to one object per species and its rocks to one per mesh, each joined object
  carrying `joined`, the count of trees or rocks it holds, which the exporter
  writes as `extras.joined` (from increment 3, for check 10); multiply `LOOK`'s
  constant tints into the base colour pixels with `numpy`, and #857's
  per-house `object_tint` into a `COLOR_0` attribute; scale every image to its
  cap (base colour 1024, normal and metal-roughness 512); set each object's
  `stage` custom property from `common.STAGE_OF` and the admit table in #964;
  export `<out>/skin/skin-full.glb` with 2h's export options (#897), Draco
  off. Refuses `CI` and any Blender but 5.2, as `build.mjs` does (#840,
  #842).
- **`tools/castle3d/skin.mjs`**, new, Node, `npm run castle3d:skin`: launches
  `skin.py` (or `--cut-only` over an existing `skin-full.glb`), then with the
  pinned `@gltf-transform/core` keeps the nodes whose `extras.stage` is in
  `data/castle-skin.json`'s `stages` and whose plan id is not in its `keep`,
  prunes, drops `KHR_materials_specular` and `KHR_materials_ior`, sets the
  leaf materials to `MASK` at 0.5, and writes `assets/castle3d/skin.glb` raw.
  `--drop <stage>` removes a stage from the committed, encoded file on any
  machine, which is the revert; dropping the last listed stage deletes the
  file and leaves the manifest with `stages: []` and neither `cut` nor
  `encoded` (from increment 3). `--record`, run after `npm run
  assets:encode`, no Blender, writes the encoded file's bytes and sha256 as
  the manifest's `encoded` row, and refuses a file that lacks
  `EXT_meshopt_compression` or `KHR_texture_basisu`, whose `extras.stage` set
  is not the manifest's `stages`, or whose manifest has no `cut` row (from
  increment 3). It records every input's sha256 (the master
  glb, `skin.py`, `blueprint.json`, `data/castle-skin.json`) and the written
  file's in `tools/castle3d/skin-manifest.json`, and prints "unchanged" and
  writes nothing when the inputs have not moved. It writes a repo file, so it
  takes the file's newline from the file (#632, `eolOf`).
- **`tools/castle3d/skin-manifest.json`**, new, committed: per stage, the
  numbers `skin.mjs` printed; the inputs' sha256; the raw cut's sha256 and
  bytes as `cut`; the encoded file's as `encoded`, written by `skin.mjs
  --record` after `assets:encode`. A re-cut writes the manifest without
  `encoded`, so check 10 is red until the file is encoded and recorded.
- **`tools/encode-assets.mjs`**: a third family, "the castle skin", the file
  `data/castle-skin.json` names, textures by slot (#507) and meshopt with
  `cleanup: false`; and `toKTX2` keeps alpha (`R8G8B8A8_SRGB`, ETC1S) for a
  base colour whose material is not `OPAQUE`, where it calls `removeAlpha()`
  today (#967). The family lands in increment 3 and the alpha path in
  increment 5, the first stage with a non-`OPAQUE` material (open calls,
  "Before increment 3").
- **`data/castle-skin.json`**, new: `{ comment, file:
  "assets/castle3d/skin.glb", stages: [], keep: [], allow: { "<skin node
  name>": "<reason>" } }`, `allow` keyed by node name as #895 keyed
  `allow.json`, since one node may name several pieces. Only this row
  writes it.
- **`assets/castle3d/skin.glb`**, new from increment 3.
- **`src/castle-builder.js`**: `build()` loads `data/castle-skin.json`
  through `assets.js`'s `loadJSON` and, when `stages` is not empty and the
  page does not carry `?edit=1`, the skin through `loadModel`. For each node
  carrying `extras.planId` or `extras.planIds`: every built object it names
  gets `visible = false` and stays in `this.objects` with its tag; the node
  goes in a new `this.skins` map under each id, added at its glb world
  transform, or for a `LEAF_<gate>` node under that gate's pivot with an
  identity transform. A node with no plan id (#851's outer gate, the
  louvre, the land) is added untagged with `userData.skin = true`.
  `setPieceVisible` sets a skin's `visible` where one exists and leaves the
  hidden built object hidden. Shadows as the builder's own pieces.
- **`test/assets.mjs`**: check 4's sweep gains `assets/castle3d`, reachable
  from `data/castle-skin.json`; new check 10, below.
- **`test/layout.mjs`**: a new check, "the skin against the plan", below.
- **`test/budget.mjs`**: sections 1 and 4 learn the skin; a new section 5,
  triangles; the ceilings move as #966 says, in the increments it names.
- **`test/plan-vs-scene.mjs`**: four seams, below.
- **`package.json`**: `"castle3d:skin": "node tools/castle3d/skin.mjs"`.
- **Untouched**: `src/castle-plan.js`, `src/main.js`, `src/save.js` (no
  version bump), `data/scene-config.json`, `data/mystery.json`,
  `tools/blender/`, `test/built.mjs` (its served-set diff and the 200 MB
  line already cover a new file under `assets/`), and `markers.json`, which
  stays outside the repo and is read by nothing in the game (#919).

### Scope, by increment

1. **#922 in the model.** The two script edits above; a full `npm run
   castle3d:build`; nine `check.py` lines and the export check green; one
   Cycles still from `CAM_spawn` of the open arch, rendered twice and held
   to #898's judge, for Devon. `builder`, Local: Blender GPU. Every cut
   reads this master, so it goes first.
2. **The skin, outside the repo.** `skin.py` and `skin.mjs`; `skin-full.glb`
   and a `curtain` cut written to `<out>/skin/`, nothing under `assets/`.
   The report quotes, per stage, draws, triangles, images and the KTX2
   projection beside the table above; a number past 2 MB or 10% of its
   projection sends the row back to `architect` (#966). Two runs over one
   master, the `skin-full.glb` sha256 of each quoted and equal. `builder`,
   Local: Blender GPU.
3. **Stage `curtain` in the game.** In order. `skin.py`'s `joined` line;
   `skin.mjs`'s `--record` and its last-stage `--drop` (both deferred here
   by #1003); `data/castle-skin.json` with `stages: ["curtain"]`; the
   encoder's skin family, meshopt with `cleanup: false` and textures by
   slot, without the alpha path. `skin.py` run twice over one master, the
   two `skin-full.glb` sha256 quoted and equal (#968; `skin.py` moved, so
   #1003's `d9a3bbd1…` no longer stands). Then, on the repo's destination:
   `npm run castle3d:skin`, `npm run assets:encode`, `npm run castle3d:skin
   -- --record`, and one more `npm run castle3d:skin`, which must print
   "unchanged" against the encoded file; that line is the proof the record
   took, since without it `skin.mjs` sees a destination it did not write and
   cuts raw over the encoded file. `assets/castle3d/skin.glb` and
   `tools/castle3d/skin-manifest.json` committed. `--drop` on an encoded
   file, which #1003 did not run: a scratch copy of the committed file with
   its manifest beside it, that manifest's `stages` edited to `["curtain",
   "buildings"]`, then `--drop buildings --dest <scratch>/skin.glb`; the
   rewritten file still carries `EXT_meshopt_compression` and
   `KHR_texture_basisu`, 132 draws and 40,000 triangles, and every embedded
   image's sha256 unchanged, each quoted. Then the builder's skin path; check
   10 without its alpha line, the layout check, the budget changes
   (`MAX_DRAW_CALLS_PER_WARD` 600, `MAX_TRIANGLES_PER_WARD` 500,000) and the
   four seams, each with its break. `npm test` fifteen of fifteen. Then the
   GPU look below, Devon's line recorded. `builder`, Local: Blender GPU for
   the cut, any machine past it.
4. **Stage `buildings`.** Re-cut; one `allow` entry (`ROOF_great-hall`,
   the seven `hall-roof` pieces, 0.80 m of eave); `MAX_TEXTURE_MB` 64 to 76.
   Look, line recorded.
5. **Stage `town`.** Re-cut; thirteen `allow` entries (five `TREE_`, six
   house `ROOF_`, `HOUSE_mereford-house-n1`, `ROOF_mereford-church-tower`);
   the five trees on
   one decimated mesh. The encoder's alpha path and check 10's alpha line,
   with its break: the path removed, naming `tree_small_02_leaves`, the first
   `MASK` material any stage ships. Look, line recorded.
6. **Stage `land`.** Re-cut; two `allow` entries (the ground and the road);
   `MAX_TEXTURE_MB` 76 to 84; check 10's joined line run on the real joins,
   its break `TREES_tree_small_02`'s `extras.joined` halved in a scratch
   copy. Look, line recorded. Then a lane-B clean-up,
   not this row's, deletes the `pixelMaterials` rows no unswapped piece
   wears (#964).

Each of 4 to 6 is a `builder` job against this section; one whose measured
numbers miss the projection by more than #966's margin, or whose look calls
for a `keep` entry, comes back to `architect` first.

### Acceptance

Every increment: `npm test` fifteen of fifteen, and each new assertion's
break run from green, the failing line quoted (#34). Nothing below is in
CI's reach that a container cannot run, except the cut itself.

1. **`test/assets.mjs` check 10, the castle skin** (format, caps, hash; an
   asset fact, as check 8 is for `tools/blender/`). With `stages` empty,
   nothing at `file`. Otherwise the file exists, is at most 32 MB, carries
   `EXT_meshopt_compression` and `KHR_texture_basisu`, and every image is
   `image/ktx2` or a PNG of 128 px or under (#831); no base colour over 1024
   and no normal or metal-roughness over 512, read off the KTX2 header; from
   increment 5, every base colour of a `MASK` or `BLEND` material carries
   alpha in its DFD; no Draco, no `KHR_materials_specular` or `_ior`, no
   camera, no light; the set of `extras.stage` values equals `stages`.
   Triangles, by node class, against three named constants that restate
   #968's caps: a node named `TREES_<species>` or `ROCKS_<name>` carries an
   integer `extras.joined` of 1 or more, and its mesh is at most 2,000
   (trees) or 1,000 (rocks) times it; no other node carries `joined`; a mesh
   named by two or more nodes is at most 2,000; every other mesh is at most
   40,000. The manifest's `stages` and `file` are the config's, and the
   file's bytes and sha256 are the manifest's `encoded` row; a manifest with
   no `encoded` row fails. **Breaks**: a scratch copy with one image put back
   as its 1024 PNG (a fixture, as #884's flipped byte was): `FAIL  skin:
   image <n> is image/png 1024x1024; every image over 128 px is KTX2 (#506)`;
   one base colour swapped for a 2048 KTX2 from `ktx create` (not `skin.py`'s
   cap at 2048, which `skin.mjs` has refused to write since #1003);
   `"buildings"` added to `stages` without a re-cut; one flipped byte against
   the manifest; the raw cut committed before `assets:encode`, so no
   `encoded` row; in a scratch copy rewritten through `skin.mjs`'s reader,
   `DRUM_kings-tower` renamed `ROCKS_kings-tower` with `extras.joined` 1:
   `FAIL  skin: ROCKS_kings-tower is 2722 triangles for 1 joined, 2722 each;
   the cap is 1000 (#968)`, and the same node with `joined` deleted. Every
   fixture also fails the hash line, by design; the report quotes the line
   under test. The alpha break is increment 5's and the halved `joined` is
   increment 6's.
2. **`test/layout.mjs`, the skin against the plan** (a fact derivable in
   Node from the plan and a file, #529). Every plan piece whose stage is
   listed and whose id is not in `keep` is named by exactly one skin node's
   `planId` or `planIds`; every id a node names is a plan piece; each node's
   world box, read as `partsOf` reads a model, has every face within 0.55 m
   of its plan box's (the union, for a node naming several), except that it
   may rise above the top (#965: the batter is exactly 0.5000 m, and the
   drums' roofs rise 3.2 m); an `allow` key that is within that rule fails
   as stale, and one naming no node fails. **Breaks**:
   `WALL_north-curtain-mid` pruned from a scratch copy: `FAIL  skin: plan
   piece north-curtain-mid of stage curtain is named by no skin node`; a
   scratch copy with that node moved 1 m in x; an `allow` entry for
   `WALL_north-curtain-mid`, which fits.
3. **`test/budget.mjs`** (cost, #611). Section 1: a piece a skin node names
   counts the node's primitives, not its built meshes, bucketed by the
   node's world box; untagged skin nodes count too; so outer plus outside
   prints about 488 at `curtain` against 600. Section 4: the skin's embedded
   KTX2 are priced by the existing `fromKTX2` under `skin.glb#<i>`. Section
   5, new: triangles per ward on the same rectangles, the game's built and
   loaded meshes plus the skin's, ward plus outside against
   `MAX_TRIANGLES_PER_WARD`, failing with the three biggest. **Breaks**: the
   section 1 skip removed, so the hidden built drums are counted again:
   outer over 600 naming the drums; a scratch skin with one undecimated tree
   (519,809): outside over 500,000 naming it; the skin's images priced as
   RGBA8: the texture line over its ceiling.
4. **`test/plan-vs-scene.mjs`, four seams** (nothing provable in Node; each
   compares a live object against a box Node computes from the file, as the
   existing diff does against the plan). (a) Every skin node stands where
   the glb says, its live `Box3` within 0.01 m of its world box. (b) Every
   built object a skin node names has `visible` false, and its 0.01 m diff
   against the plan still passes, unchanged. (c) Each of the four leaves'
   skins is within 0.01 m of its pivot's `matrixWorld` times its local box,
   shut and after the page opens it. (d) After the second day's `gone` on
   `cell-bars`, its skin is not visible. **Breaks**: the builder adds the
   node with an identity transform (a); the hide line commented out: `FAIL
   north-curtain-mid is drawn beside its skin` (b); the leaf added to the
   scene rather than its pivot, failing once the leaf swings (c);
   `setPieceVisible` left on the built object alone (d).
5. **`test/built.mjs`, unchanged**: `dist/` about 42 MB at `curtain`, 59 at
   `land`, against 200; the served-set diff fails if `skin.glb` is missing
   from `dist/`, which the report shows by deleting it there once.
6. **The look (#53), local: GPU, after each stage**, from the checklist
   below; Devon's line recorded against the increment. It blocks the next
   stage, not `npm test`.

### Open calls

Each is decided in #963 to #968; the recommendation is that decision.
Devon accepted all 22, as recommended (#969).

- **What ships (#963).** Recommend **one file, `assets/castle3d/skin.glb`,
  holding exactly the listed stages, never the master**: 570 MB cannot be
  committed (GitHub refuses a file over 100 MB), and separate stage files
  would price shared materials twice, 46.7 MB against a 28.0 MB union.
- **Where the game learns the stages (#963).** Recommend **a new
  `data/castle-skin.json`, read by `castle-builder.js`, not
  `scene-config.json` and not `main.js`**, because the first would put the
  row in lane B and the second in lane D for a list only this row writes.
- **The stages (#964).** Recommend **four: `curtain` (walls, towers and
  gates), `buildings`, `town`, `land`**, amending #921, because the gates'
  arches stand in curtain runs and the land is the one stage that needs LOD
  to ship.
- **What a stage admits that has no plan id (#964).** Recommend **#851's
  outer gate and `PORT_west-gate` with the curtain, #854's louvre with the
  buildings, #857's leaves and #956's and #957's water and door with the
  town; never `props`, `BRAZIER_`, #853 or #855**, because the game owns its
  props and braziers and leaves #853's rooms open by design.
- **Interiors (#964).** Recommend **a swapped piece is swapped on every
  face; what a room holds stays the game's, and `keep` is the fallback**,
  amending #921, because a face split needs a second geometry per piece
  and a rule for who owns a face, where `keep` costs one line.
- **Pixel textures (#964).** Recommend **none deleted in this row; one
  lane-B clean-up after `land`**, because deleting a row writes
  `scene-config.json` for 0.085 MB a texture.
- **The swap mechanism (#965).** Recommend **built objects stay built,
  tagged and hidden; skin nodes drawn by plan id; leaves under their
  pivots**, because `plan-vs-scene`'s net then runs on the plan unchanged
  and three's `Box3` and `Raycaster` ignore `visible`.
- **The box rule (#965).** Recommend **every face within 0.55 m, the top
  free, `allow` for the rest (0, 1, 13 and 2 entries by stage)**, because
  0.5 is the batter exactly and a skin taller than its collider (a roof, a
  drum's cone) shows no invisible wall.
- **The editor (#965).** Recommend **no skin under `?edit=1`**, because the
  editor moves the plan and the skin is a picture of an older one.
- **Draw ceiling (#966).** Recommend **`MAX_DRAW_CALLS_PER_WARD` 1200 to 600
  at `curtain`**, because the drums' 1,044 draws leave with the curtain and
  a ceiling met by doing nothing is not one.
- **Triangle ceiling (#966).** Recommend **a new `MAX_TRIANGLES_PER_WARD`,
  500,000, ward plus outside, at `curtain`**, because the master is 41.8
  million and nothing counted triangles; the land projects 448,000.
- **Texture ceiling (#966).** Recommend **`MAX_TEXTURE_MB` 64 to 76 at
  `buildings`, 76 to 84 at `land`, whole castle, not per ward**, because the
  projections are 65.2 and 81.2 and three keeps whatever it uploaded.
- **#499 (#967).** Recommend **not amended: 200 MB stands, and check 10
  holds the file to 32 MB**, because `dist/` goes 34 to about 59 MB and the
  cost #499 cannot see is history, one commit a stage.
- **#506 (#967).** Recommend **not amended; the skin is a family the
  existing encoder walks, and `toKTX2` keeps alpha for a non-opaque base
  colour**, because two KTX2 paths are two rails for one rule and the leaves
  would otherwise go opaque.
- **Resolution (#968).** Recommend **base colour 1024 ETC1S, normal and
  metal-roughness 512 UASTC**: 410 texels a metre against the game's 43, and
  37.3 MB at `land` where 1024 throughout is 93.3.
- **LOD (#968).** Recommend **decimation: trees 2,000, rocks 1,000, ground
  40,000; a 6-triangle cross impostor as the named fallback**, because an
  impostor needs a Cycles bake and a look, and decimation needs neither.
- **Instancing (#968).** Recommend **join, not `EXT_mesh_gpu_instancing`**,
  as #815 chose for 2b, because instancing is a second draw path for
  `budget.mjs` to learn.
- **The bake (#968).** Recommend **tints into pixels with `numpy`,
  `object_tint` into `COLOR_0`, noise dropped; no per-object bake, no atlas;
  no UV rewrite**, because the UVs already are the box projection in metres
  (sampled on three nodes) and an atlas breaks the tiling they carry.
- **Leaves (#968).** Recommend **`MASK` at 0.5**, because 76 sorted `BLEND`
  trees are a sorting problem `MASK` does not have.
- **Determinism (#968).** Recommend **byte-identical `skin-full.glb` on two
  runs; #898's judge only for an impostor bake; "unchanged" on a second
  `skin.mjs`; no Cycles stills of the skin**, because the renderer that
  judges it is the game's.
- **The open arch (#922).** Recommend, as #922 did, **accept the road behind
  the collider at `curtain` and look west from `SPAWN`; the portcullis
  lowered, leaves open, is the fallback**, since a lowered portcullis reads
  shut and moves no collider.
- **Lane (#963).** Recommend **G, extended to `data/castle-skin.json`**;
  `castle-builder.js` and `encode-assets.mjs` belong to no lane and the
  edits are additive.

#### Settled before increment 3 (#1004)

Raised by #1003's measurements, decided by `architect` on 2026-10-03, and
confirmed by Devon on 2026-10-04 ("yes to all 5"). None overturns #963 to
#968; the first restates #968 where check 10 contradicted it.

- **Check 10's triangle line** is caps by node class, held per joined tree
  or rock: a `TREES_` or `ROCKS_` node at most 2,000 or 1,000 times its
  `extras.joined`, which `skin.py` writes; a shared mesh at most 2,000;
  every other mesh at most 40,000; owned by `test/assets.mjs`. This is the
  decision because #968 caps each tree and joins them, and "no mesh over
  40,000" fails its own join: `skin-full.glb` measured `TREES_tree_small_02`
  at 82,000 and `TREES_island_tree_01` at 60,000, which `castle.glb` counts
  as 41 and 30 trees at 2,000 (46 on the small tree's mesh, less Mereford's
  five), and `ROCKS_boulder_01_1` at 11,000, 11 rocks at 1,000. Everything
  else meets 40,000 with room: `TERRAIN_road` 3,760 and `DRUM_kings-tower`
  2,722 are the largest, and `TERRAIN_ground` is 39,999 against its own
  decimation target of 40,000. A flat cap raised to 100,000 lets an
  undecimated rock through (#1003's 8,000 a rock, joined 11 times, is
  88,000) and so does `MAX_TRIANGLES_PER_WARD`, since that join takes the
  land from 220,755 to about 297,755 against 500,000; a named exemption
  list breaks on the next re-scatter and lets 2,400-triangle trees through
  under a fixed ceiling; a per-primitive cap fails too, since the small
  tree's leaf primitive alone is 49,159. Whether a mesh is decimated to its
  cap is what the asset is, so `assets.mjs` holds it; `budget.mjs` section 5
  keeps what it costs a ward, and the two share no assertion (#529, #611).
- **Check 10's number against the UI art row's**: the skin keeps check 10
  and the art row's block becomes check 11. This is the decision because
  the skin's check 10 is on `main` already (#963's and #967's entries, and
  this section), lands within this session, and the art row is uncommitted
  on `claude/art-ui-layer` waiting on source PNGs, so it lands second by the
  rule "whichever lands second renumbers". When it lands, in that worktree:
  `test/assets.mjs`'s header line `10.` becomes `11.`, its banner `10: what
  the image model made` becomes `11:`, and `say`'s prefix `check 10 line`
  becomes `check 11 line`; its SPECS section, "UI art: woodcut illustration
  in the DOM", says check 11 wherever it says check 10 (the four uses held
  "in check 10", the lockfile line, `finish.mjs`'s exports "for
  `test/tools.mjs` and check 10", the scope line "check 10 ... below check
  9" which becomes "check 11 ... below check 10", increments 0, a, b and
  c's acceptance lines, the "new block below check 9" in its merge note,
  and the #529/#611 constraint); its BACKLOG row 14 and the row brief that
  names check 10; its two ROADMAP lines ("its own check 10 below check 9"
  becomes "its own check 11 below check 10"); and its #1002 entry in
  HISTORY.md, three times. Its line 6 then also hashes `skin.glb`'s
  embedded images, about 33 at `curtain`, which costs a read and matches
  nothing.
- **When the encoder's alpha path and check 10's alpha line land**:
  increment 5, not 3. This is the decision because `skin-curtain.glb` has
  no material that is not `OPAQUE` (measured), and `skin-full.glb` has two,
  `tree_small_02_leaves` and `island_tree_01_leaves`, both `BLEND` before
  the cut's `MASK`; at `curtain` the line would be green on nothing, and its
  break would need an encoded fixture from an encoder that walks only
  `assets/`. Town's five trees wear `tree_small_02_leaves`, so increment 5
  is the first file that can fail it. This moves #967's alpha path in time
  and does not amend it.
- **`--drop` of the last stage, and check 10 on an empty `stages`**:
  `--drop` deletes the file when it drops the last stage, and check 10
  then wants nothing at `file`. This is the decision because a file
  nothing loads would still ship about 8 MB in `dist/`, which copies
  `assets/` whole, and the revert of `curtain` should leave the repo as it
  stood before increment 3 but for a manifest and an empty config.
- **`--record`'s refusals**: refuse a file without
  `EXT_meshopt_compression` and `KHR_texture_basisu`, one whose stages are
  not the manifest's, and a manifest with no `cut` row. This is the
  decision because otherwise a raw cut can be recorded as encoded and
  check 10's hash line passes over the wrong file.

### Dependencies

- **Gate: none.** 2h shipped (#962). Increment 1 before any cut, since every
  cut reads its master.
- **Devon's Windows machine**: the Steam Blender 5.2 at `CASTLE3D_BLENDER`
  or the Steam path, never `BLENDER` (#840); `ktx` 4.3 or newer on PATH for
  `assets:encode`. Nothing is fetched: every input is in `CASTLE3D_OUT`.
- **Lane G**, with `data/castle-skin.json`. It may run beside a lane F row,
  two Blenders on one machine, Devon's call (#842). `package.json` gains a
  script line, a one-line merge.
- **After `curtain` lands, a lane-B row that moves a swapped piece** (rank
  4, 2b, the editor) fails the layout skin check by name until this row
  re-cuts. 2b adds props, which are never swapped, so it does not trip it.
- **2b's look re-check (#920)** is independent of this section and is not
  gated by it. If 2b's increment 1 frees the prop packs first, #966's
  texture moves shrink by what it freed.
- **Rank 3's GPU sitting** is where each stage's look can ride.

### Constraints

- #36, #37: no save change; version 6 and `castleConundrumSave_v1` stand;
  lane A untouched (#965).
- #493: the skin is under `assets/` and its decoders are the transcoder and
  `MeshoptDecoder` the page already ships.
- #499, #506, #507, #508, #831: as #967 says.
- #500: the plan computes every transform and collider; the skin draws and
  computes nothing the plan reads. #919: `markers.json` is never read.
- #529, #611: each new assertion on the side #965 places it; ceilings move
  only as #966 says.
- #13, #34, #147: every new line has its break; one that stays green on it
  is not shipped.
- #53: every look is a GPU look; no stage is judged in a container.
- #586: the editor never loads the skin; `test/built.mjs`'s grep is
  unaffected.
- #632: `skin.mjs` writes `skin-manifest.json` with the file's own newline;
  every reader uses `JSON.parse`.
- #840 to #842: the master stays outside the repo; `skin.py` refuses CI and
  any Blender but 5.2.
- Windows: `pathToFileURL` for every absolute `import()`, no brace
  expansion in anything `skin.mjs` shells.

### Looking checklist

- [ ] West from `SPAWN` through the open outer gate: a road, or a way out
      the game will not give?
- [ ] The curtain from the outer ward at 10 m and at 1 m: stone at 1024, or
      a blur? The batter and crenellations against the game's sun: the same
      castle as `CAM_courtyard`, or a darker one?
- [ ] A room against the curtain (the kitchen) and a drum's cell: a
      photographic wall over a pixel floor and a flat prop, one room or
      two? If two, which pieces go on `keep`?
- [ ] The west and porter leaves opening and the muniment's: planks on
      their hinges, or planks through the jamb?
- [ ] 2b's flat sets against the swapped walls (#946): the kitchen, the
      chapel and the cell at `curtain`, the great hall at `buildings`. One
      room or two? If two, the wall goes on `keep`; the set is not rebuilt.
- [ ] The hall's roof and louvre from the outer ward, at `buildings`.
- [ ] Mereford from the North-west Tower, at `town`: a 2,000-triangle tree,
      or a blob? Six roofs' eaves over their walls?
- [ ] The land from the wall walk, at `land`: joined trees and decimated
      rocks at 50 m and 150 m; the ground's edge.
- [ ] `renderer.info.memory` beside `budget.mjs`'s texture line on the
      same build, written down, as #611 asks of the first GPU sitting.

---

## The GPU run

**Rank 3. Size ¼. Its gate, "Sight at the body's own height," shipped
2026-09-21** (#780 to #782); the gate is open. `npm run play` is a numbered
screenshot per beat into `shots/play/`. It has run on a machine with real
compositing eleven times over four sittings (#624 to #630, #708 to #715,
#734 to #741, #886 to #891), and the fourth sitting confirmed the sight fix
holds: the sentry's and the porter's sighting beats pass, the accusation
selects 3 of 3, and the whole day and the whole second day have now been
walked by `npm run play` for the first time. **What is left is exit 0**:
run 5 of the fourth sitting still ends 212 ok, 6 failures. Rank 3a (Play Again
does not start over, #916) and rank 3b (three small suite and data bugs,
#917) have since shipped in Node, leaving one more GPU run, and the phone in
the room (#530) is untouched.

**The judgement half of this row is done.** Every render question this
section used to list is answered in `HISTORY.md`: the twelve at Vespers
(two of them do not read as two — the Constable and the Steward are one
white-haired man told apart only by a collar colour), the Lauds sky (flat,
no dawn colour), the covered hall (its trusses invisible from the floor, a
sliver of sky at one corner), a tower roof from 12 m, and the gaol roll on
the barrel-head. `renderer.info` was read at five beats and handed to rank
2c and 2d's skinned-draw argument (#887). One item is still untouched: a
phone in the room (#530) — the stick throw, sprint threshold, look rate, E
button size and two render numbers are all still guesses.

### Scope, the run

- **Nothing in `src/`.** The run is the deliverable. `test/play-castle.mjs`
  is the only file this row may change.
- **`HISTORY.md`** records what the run said, beat by beat. A beat that fails
  on a GPU is a bug; a beat that failed under software rendering and passes
  here was never one.

### Acceptance, the run

- `npm run play` exits 0 on a machine with a GPU, or exits non-zero with the
  failing beat named and filed as a new backlog row.
- `shots/play/` contains the numbered set and a human has looked at it and
  written one sentence per body: told apart or not.
- No new guard-rail: the run is the check. The `snap` beat is a screenshot,
  not an assertion, and says so in its comment.

**The quay through the fog, moved here from rank 9 (#910).** One more
pinned-camera shot through `tools/shot-yard.mjs`, spawn untouched
(`validatePopulace` refuses it): do the toll-house's slate ridge (about
98 m, 60 % fog) and the river (84 % fog, first seen at (-155, -3) from
`floor-sw-tower-roof`, 119.7 m, through the west gate) read at all. If not,
the lever is `lighting.fog` (#796), not the town or the west wall.
**Stills exist, verdict owed** (#900): `q1` to `q5` and the two `x3` crops
in `looks/2026-10-03/`, from both west tower roofs and the west walk at
Terce, Prime and Vespers. #900 reads the gate as fog colour, the ridge as a
small grey point and no water told apart; that is the session's reading,
not Devon's, and this item stays open until he judges them.

### Dependencies

- **Gated on "Sight at the body's own height," which shipped 2026-09-21**
  (#780 to #782) and confirmed on a GPU 2026-10-01 (#886 to #891).
- The run needs a machine with a GPU, which is Devon's; a session can add a
  beat and cannot run it. If a session is asked to take the run without one,
  the honest output is the beat and a note, not a claim.
- **What exit 0 still owes**: rank 3a (Play Again, #889) shipped (#916) and
  rank 3b (the last three standing failures, #890) shipped (#917). One more
  GPU run is owed, and it confirms both.

### Constraints

- #53 (the whole point of the row).
- #34 does not apply: no rail is added.

---

## Play Again starts over

**Rank 3a. Shipped (#916), in one increment, against #889.** Its row is
retired from `BACKLOG.md` and `ROADMAP.md`. What other sections cite, and what
is still open:

- **The fix**: `src/gvb-save.js`'s `autosave` `stop()` sets `dirty = false` as
  well as clearing the timer, so `restart()`'s `slot.reset()` is not written
  back by the `pagehide` flush. `src/main.js` is unchanged; no `SAVE_VERSION`
  bump (#36).
- **Held by** `test/save.mjs` section 6, 8 assertions, with a control that
  shows a mark then `pagehide` does write.
- **Open**: the three Play Again beats in `npm run play` need a GPU run (#53),
  which stays with rank 3. The fix is not carried back to tools-and-games'
  `assets/js/gvb-save.js`.

---

## play-castle's last three failures

**Rank 3b. Node half shipped (#917), against #890.** Its row is retired from
`BACKLOG.md` and `ROADMAP.md`.

- **The fixes**: (a) the wall-height check is deleted from
  `test/play-castle.mjs`, as recommended; `test/plan-vs-scene.mjs` holds
  every wall's live box to the plan at 0.01 m (#500). (b) `gothic_statue`
  moved 1.2 m west along the hall, tile x -5 to -5.3 in
  `data/scene-config.json`; the brazier did not move. (c) #659's journal walk
  is asserted as at least 0.5 of a baseline walk taken before the journal is
  opened.
- **Held by**: nothing in `npm test`. The beats live in
  `test/play-castle.mjs` and only `npm run play` runs them.
- **Open**: all three beats need a GPU run (#53), which stays with rank 3.
  The porter's-gate pair's root is not identified. The furniture wall check's
  `/^(wall|tower|column)/` still matches no wall.

---

## The retro castle: the stone in the castle's own pixel art

**Rank 4. Size 2+. The first increment shipped on 2026-09-21** (#757 to
#766). Devon's brief of the same day: the castle reads as the same
everywhere, and he wants pixel-art textures produced by a model session
rather than photographs, for variety room to room and for a retro look, a
style call before a cost one. That reverses #411, which put photographic
stone on the walls, and the reversal is locked as #742; the provenance rule
for a texture this repo draws is #743; the row's rank, lane and the shape of
its cost rail are #744. What shipped, and the ten open calls it answered,
are below; the second and third increments wait on the look (#53).

**Increment 2 is superseded by "Castle in Blender" (#839), and nothing
shipped here is reverted.** The game keeps the fifteen pixel textures,
`pixelMaterials`, check 3b, `RELIGHT_KIT` and `MAX_TEXTURE_MB` until the
stage of the integration row (2i) that swaps the last surface wearing one
ships (#921); forty per-room textures would be deleted that day. What is left of this row is
the looking checklist at the end of this section, and a fix if the look
finds a hole.

**What was there before the swap, measured on 2026-09-21.** Fifteen material
sets under `assets/poly-haven/`, 1024 px, three maps each, KTX2 since #506,
about 25 MB on disk. By their own KTX2 headers (pixels per mip level times
0.5 bytes for
ETC1S and 1 byte for UASTC) they hold **44.2 MB of the 79.3 MB** of texture
memory the castle carries, and that estimate is exact: the same arithmetic
over every `.ktx2` on disk gives 79.3 MB, which is the number #506 measured
off `renderer.info` on the live page. The ten prop packs are the other
35.1 MB. The fifteen dress 46 wall runs (five names: `castle_wall_slates` 22,
`medieval_blocks_02` 13, `plastered_wall_04` 8, `old_planks_02` 2,
`defense_wall` 1), the eight drums (two names and eight tints, #516), 32 room
floors (seven names: `wood_planks` 10, `wood_floor_deck` 8, `old_planks_02`
5, `stone_pavers` 5, `rock_tile_floor` 2, `floor_tiles_02` 1, `dirty_carpet`
1), four grounds, the walk's decking and the gate leaves. That is the "same
everywhere" in numbers: 22 of 46 runs are one slate and 18 of 32 floors are
two planks, and a set costs about 3 MB of video memory, which is why there
are fifteen and not forty.

The Kenney kit beside them is the other look already: ten 64 px PNGs, drawn
as pixel art, declared `KHR_materials_unlit` in every GLB so GLTFLoader gives
them `MeshBasicMaterial`, magnified NEAREST by `tuneTexture` (128 px and
under), and left out of the encoder by size (#508). #630 saw the two as two
games from a tower top. This row makes the built stone the kit's kind of
surface, at a little more than twice the kit's texel density: 128 px over
the 3 m repeat #434 set is 43 texels a metre against the kit's 16 and Poly
Haven's 341.

**The shape of the row: three increments, and a look between the first two.**

1. **Shipped** (#757 to #766): the pipeline, its rails, and fifteen
   textures, one per existing material name, so the castle is whole in the
   new look on one GPU sitting and not one wall at a time. A container
   closed it: no `ktx`, no network, no GPU. **Then somebody looks** (#53),
   with the checklist at the end of this section — nobody has yet.
2. ~~**Variety**: a wall and a floor per named room, about forty textures,
   against the texture ceiling below. Gated on the look, the way rank 11's
   second increment is.~~ **Superseded** by "Castle in Blender" (#839).
3. **The props** move to rank 2b's increment 3, gated the same way (#813):
   surfaces are this row's and volumes are the Blender band's, so the props
   are a job of Blender sets, not this row's.

### What shipped, increment 1, in short

A generator (`tools/pixel/index.mjs`, `tools/pixel/textures.json`) draws
fifteen 128 px textures, one per existing material name, deterministic and
hand-run via `npm run pixel:render`. `assets/poly-haven/`'s fifteen material
folders are deleted (45 files, 23.9 MB); `data/scene-config.json`'s
`materials` became `pixelMaterials`; `src/assets.js`'s `loadPixelMaterial`
replaces `loadPBRMaterial` with a lit, diffuse-only material — the Kenney kit
is relit to match, behind `RELIGHT_KIT`, since every kit GLB does declare
`KHR_materials_unlit`. `test/assets.mjs` gained a new check 3b (size,
palette, wrap, one map, pixel-identical to the generator) and
`test/budget.mjs` a fourth count, `MAX_TEXTURE_MB = 64`. Texture memory: 80.8
MB before, 37.9 MB after. `npm test` fifteen of fifteen, `dist/` 52.8 to 28.9
MB. Untouched: `src/castle-plan.js`, `src/save.js`, `data/sounds.json`
(the fifteen names did not change).

**Ten open calls were answered in shipping it** (#757 to #766), locked in
`HISTORY.md`: replace the fifteen sets and keep the ten prop packs (a photo
texture's authored UVs are not a retexturing job this repo has a tool for,
and supplementing measured out at 82.1 MB against the 64 MB ceiling); lit,
not flat-unlit, so the sun-per-watch, shadows and braziers keep working; the
kit relit rather than left; a program in the repo generates, never an image
model, checked by pixel-identity; 128 x 128, at most 32 colours, both named
constants; PNG, not KTX2, exempt by size; the fifteen names kept; no budget
ceiling renegotiated; the ten prop packs untouched; tone mapping and the
hemisphere fill left for the GPU to judge.

### Dependencies

- **Lane B.** Increment 1 held it and released it. Rank 9's next increment,
  the quay, has no section yet and is not startable, so nothing else is in
  the lane today; when it is, the two do not run together.
- **Increment 1 needed no `ktx`, no network and no GPU**, the opposite of
  #518 and #541: a container closed it.
- **Increment 2 is superseded** (#839). Increment 3 is 2b's and waits on
  the look saying so (#813).
- Ranks 6 and 10 are untouched: the bodies carry no images but the hen's
  atlas, which the count counts and the row leaves.

### Constraints

- #34, #13, #147: every rail above has a named break, and a rail that
  cannot be broken is not shipped.
- #390 and #506: the fifteen folders leave in the commit their names do; git
  history is the originals.
- #493: committed, and nothing fetched off-origin. The generator runs in
  Node and never in the page.
- #508, as #742 restates it: a texture at 128 px or under is left out of
  the encoder, and the rail that says which is `test/assets.mjs`'s.
- #434: the repeat stays world-space at 3 m; a tiling texture is the case
  that rule was written for.
- #500: no transform changes. #516: a tint still multiplies the map.
- #529 and #611: the memory count is cost and goes to `budget.mjs`; the
  texture rails are `assets.mjs`'s; nothing crosses the four-suite line.
- #584, #632: `data/scene-config.json` is spliced, in its own line ending.
- #53: the look.
- #742, #743, #744, #757 to #766.

### Looking checklist

Nobody has seen any of this (#53). `npm run play`, or the `applyWatch` look
#711 used, on the dev machine, and write what was wrong rather than that it
was wrong, in `HISTORY.md` against this row.

- [ ] **One castle or two.** From the North-west Tower's roof, #630's own
      vantage: the crown's merlons (the kit) against the drum's stone and
      the curtain (this row). Does the seam between kit and stone still show?
- [ ] **The shadowed faces.** The cross-wall's west face and the Great
      Hall's north wall, which #438 and #713 measured near-black under
      photographic slate. A darker palette, or a hole?
- [ ] **A metre from a wall at a grazing angle.** 43 texels a metre, NEAREST:
      blocks, or a smear? Anisotropy is on; is the minified far wall a moire?
- [ ] **The four skies and Lauds.** The same wall at Prime, Terce, Sext,
      Vespers (#474) and on the morning after (#712): four bells, or one?
- [ ] **The eight tints** (#516) over pixel stone: still eight towers?
- [ ] **Under foot.** The ward's cobbles, the hall's tiles, the walk's
      decking, a tower's boards: does a floor read as its room's?
- [ ] **The props.** A photographed cabinet in a pixel room: the next
      increment, or fine?
- [ ] **The number.** `renderer.info.memory.textures` off the live page
      against `test/budget.mjs`'s estimate, written down beside it.
- [ ] **The two knobs.** `toneMappingExposure` and the hemisphere's 2.0: what
      the palette needs, if anything.

---

## Life: a populace

**Rank 6. Size 2+.** `WISHLIST.md` theme 1. **The first increment shipped on
2026-09-17** (#616 to #618), rank 10 added a child, a hound and two hens to
the same file (#643, #684). **The second increment was specified on
2026-09-20** (#729 to #732) **and shipped the same day** (#733): five more
people, a `talk` list of three pairs, the talk rail wired to
`QuestManager`, and a budget that counts the household. What is left of
this row is below.

### What shipped

- **`data/populace.json`, fourteen bodies, and `src/populace.js`.** Ten people
  from #616, then the well-wife's girl, the Constable's hound (with `follow`)
  and two hens from rank 10. A routine is a ring per bell, one LIST of
  `{room, tile, activity, facing?}` per watch, walked round until the next
  bell, because the clock does not move between bells (#547, answer 3).
  `validatePopulace` asks the twelve's own five nav questions plus every leg
  of the ring and the wrap back to its first stop, and it checks the room
  with `roomAt` rather than `inNamedRoom`. `test/mystery.mjs` owns it (#529).
- **Twelve activities onto six clips**: the nine human jobs on three idle
  variants every human body ships, `sniff` and `eat` on the hound's rig and
  `peck` on the hen's. `ACTIVITY_CLIPS` in `src/populace.js` is the table,
  and `test/mystery.mjs` checks each person's jobs against the clips in that
  person's own `.glb`.
- **`label` on an interaction target** (#617): a populace body shows a name
  and a role on the HUD, E at one does nothing, and a label never takes the
  prompt off a suspect standing behind it.
- **Five more people, to 19 in `data/populace.json`, 32 bodies built,
  exactly `MAX_SKINNED_TOTAL`** (#729, #733): `page`, `sacristan`,
  `tiring-woman`, `watchman` and `writer`, placed per the table #729 set.
  Outer ward holds 17, 18, 17, 17 across Prime, Terce, Sext, Vespers; inner
  ward holds 14, 15, 14, 13. The maid's Sext stop in `inner-ward` is now a
  `gossip` stop, paired with the tiring-woman's. **The writer's Prime, Terce
  and Vespers stops fell back to `inner-ward`, `tend`** — the fallback
  #729 allowed — because all 8 floor cells inside the muniment's disc read
  as `kings-hall` under `roomAt`: that room has no walkable floor that
  counts as itself.
- **A `talk` list of three pairs, and the wire that plays them** (#731,
  #732, #733): `talk-prime-inner-ward` (`page`, `sacristan`),
  `talk-sext-outer-ward` (`baker-lad`, `well-wife`), `talk-sext-inner-ward`
  (`tiring-woman`, `maid`). `Populace.talkDue`, and `overhear`/`stopTalk` in
  `src/quest-manager.js`, share the `#caption` band, `_heard` and
  `_playing` with a performance, so there is one band and one clock; a
  performance always outranks talk. `src/main.js` constructs `Populace`
  with `talk` and `hush` callbacks and also passes `pairs:
  populaceData.talk`, an argument #729 to #732 did not name; `Populace`
  reads its talk pairs from it.
- **`test/budget.mjs` section 3** (#730, #733): counts a populace body in
  every ward any stop of its ring gives it, per watch, beside the cast's,
  and the total as every body `main.js` builds. It prints 32, not 12.
- **`data/npcs.json`'s `chatterComment`** no longer says the pool is for "a
  later populace row to spend", and `WISHLIST.md`'s matching line is
  corrected the same way, both pointing at #731. The pool itself is
  untouched and still unspent by the twelve.

### What the numbers are, now

- **Bodies built: 32.** 13 cast plus 19 populace, exactly
  `MAX_SKINNED_TOTAL`. `test/budget.mjs` prints this.
- **Bodies per ward, cast plus populace, a ring counted in every ward any of
  its stops is in and the hound in both:** outer 17, 18, 17, 17 and inner
  14, 15, 14, 13 at Prime, Terce, Sext and Vespers. The outer ward's peak is
  unchanged at 18 of 20; the inner ward's peak moved from 10 to 15 of 20.
- **The twelve's chatter pool still cannot be spent by proximity** (#731,
  unresolved): of `data/npcs.json`'s 27 `chatter` pairs, 0 have their two
  speakers within 3 m at the pair's own watch. The populace's own `talk`
  list is the three pairs above, a separate mechanism.

### Scope, what is left

- **The rest of the fifty waited on the town** (rank 9, shipped): more bodies, and
  whether `garden` becomes ground, is this row's call (#618, #703 to #707).
- **The ceiling stays 32 until a row renegotiates it, and the evidence it
  brings should be the GPU run's `renderer.info`, not a second guess** (#609,
  #729). Instancing and animation LOD are the tools for that argument, not
  needed yet.
- **The four clips are placed** (#800), on both days: the scullion sweeps
  the kitchen at Prime and stirs at Terce, the carter hammers at his cart in
  the outer ward at Terce, and the serjeant and the man-at-arms spar in the
  yard at Terce, facing each other, where they mustered. Same tiles, so no
  ward count moved. `muster` is in no routine, and `drill` is dropped
  (#915), below.
- **The twelve's 27-pair chatter pool is held to the schedule by increment
  3, below** (#911 to #914): 10 pairs placed, 17 left for Devon.
- **Playback of the ten placed pairs is increment 4, below** (#925 to
  #931): built 2026-10-03.
- **The 17 are increment 5, below** (#932 to #938): Devon decided #914 on
  2026-10-03 as recommended, so nine are recast, eight retired, and the pool
  is 19 pairs with a `room` each.

### Increment 3: the twelve's chatter held to the schedule, and `drill` dropped

**Specified 2026-10-02** (#911 to #915). Class S from here: every open call
below carries a recommendation, no save bump, no assertion crosses a suite
line. Devon's limits hold: no schedule station moves, no pair is recast or
rewritten, no body added, `MAX_SKINNED_TOTAL` and `SAVE_VERSION` (6)
untouched.

**Scope, by file.**

- **`data/npcs.json` `chatter`.** Ten pairs gain `room`, and five of them
  move to the watch key they are said at, keeping their `id` (#911). Moved
  pairs are appended after the pairs already under that key, in the order
  of this table. The other 17 are not touched.

  | Pair | Room | Watch key | Moves from |
  | --- | --- | --- | --- |
  | `outer-terce-1` | `outer-ward` | `outer.terce` | stays |
  | `outer-vespers-1` | `great-hall` | `outer.vespers` | stays |
  | `outer-vespers-2` | `great-hall` | `outer.vespers` | stays |
  | `outer-vespers-3` | `great-hall` | `outer.vespers` | stays |
  | `inner-sext-1` | `kings-hall` | `inner.sext` | stays |
  | `outer-prime-1` | `great-hall` | `outer.vespers` | `outer.prime` |
  | `outer-terce-4` | `great-hall` | `outer.vespers` | `outer.terce` |
  | `outer-sext-2` | `great-hall` | `outer.vespers` | `outer.sext` |
  | `inner-terce-1` | `kings-hall` | `inner.sext` | `inner.terce` |
  | `inner-terce-4` | `chapel` | `inner.prime` | `inner.terce` |

- **`data/npcs.json` `chatterComment`** says what a `room` is, that the
  watch key is the bell a pair is said at and an id no longer spells it, and
  that a pair with no `room` is unplaced and listed by `unplacedChatter`. It
  drops "not one pair has its two speakers within 3 m" in favour of the
  room rule. `performancesComment`'s "a chatter pair names neither" becomes
  "a placed chatter pair names its room, and its watch key is its bell".
- **`src/lore.js`.** `indexChatter` gains #592's station check for a pair
  with a `room` (#912), with these messages, `where` being `chatter pair
  <id>`: `${where}: in no room (${JSON.stringify(room)})`, `${where}: ${npc}
  is not in the castle at ${watch}`, `${where}: ${npc} stands in ${st.room}
  at ${watch}, not in ${room}`, `${where}: ${npc} is asleep at ${watch}`.
  The `n.ward !== ward` check stays as it is. New export
  `unplacedChatter(chatter)`: the ids of pairs with no `room`, in file
  order, a report and never folded into `validateLore`'s list, as
  `untoldFacts` is.
- **`test/lore.mjs`** section 7, in that suite and no other (#529). The
  existing `badChatter.outer.prime[0]` breaks keep working: that slot is
  `outer-prime-2` after the move.
- **`src/populace.js`**: `drill: 'Drill'` leaves `ACTIVITY_CLIPS`, and the
  two comments that say "`drill` is nobody's yet" and "`drill` is the
  garrison's" say it was dropped (#915). **`data/populace.json`
  `activityComment`**: "`sweep`, `stir`, `hammer`, `spar` and `drill`
  resolve to" names the four, and "`drill` is still nobody's" becomes a
  sentence citing #915.
- **Not touched**: `data/lore.json` (ids are kept), `dialogue/castle.dlg`
  and `tools/dialogue.mjs` (the chatter pool is not in the `.dlg`; 0 hits
  for any pair id), `tools/bodies/clips.json`, the four `.glb` bodies,
  `test/assets.mjs`'s `GENERATED_CLIPS`, `src/quest-manager.js`,
  `src/main.js`, `data/mystery.json`, `test/budget.mjs`.

**Acceptance, all in `test/lore.mjs` except 8.**

1. As shipped, `validateLore` is clean, and `unplacedChatter` is exactly
   the 17 of #914, compared sorted against a literal list, so a pair placed
   or unplaced without this list moving is a failure.
2. Ten pairs carry a `room`, and they are the table above, by id, room and
   watch key.
3. `outer-terce-1` given `room: "great-hall"` fails with "clerk stands in
   outer-ward at terce, not in great-hall".
4. `inner-prime-1` given `room: "porter-lodge"` fails with "steward stands
   in kings-hall at prime, not in porter-lodge".
5. `outer-prime-3` given `room: "guardroom"` fails with "sentry is asleep
   at prime".
6. A pair naming `merchant` under `outer.prime` with `room: "outer-ward"`
   fails with "merchant is not in the castle at prime".
7. A pair given `room: "nowhere-at-all"` fails with "in no room".
8. `test/mystery.mjs` still passes with `drill` gone, and a routine stop
   given `activity: "drill"` is refused by `validatePopulace`; the builder
   quotes the message it prints.

**The #34 break.** From green, delete the `st.room !== room` comparison in
the new chatter check; assertions 3 and 4 must go red and the report quotes
what each said. Then restore it and move `inner-terce-4` back under
`inner.terce` with its `room` kept: the shipped baseline must go red with
"constable stands in kings-hall at terce, not in chapel". #632: every new
assertion reads data through `JSON.parse`, so no line ending reaches it; one
that reads a data file's text builds both endings.

**Open calls, each with a recommendation.**

- **Which day's bells may hold a pair.** Recommended: day one's four only
  (#911), because all ten placeable pairs have one and a `-eve` or `lauds`
  pair would need #592's day-two absence rail for no pair that uses it.
- **Does the ward key still have to match both speakers' `ward`.**
  Recommended: yes, as #554 set it, because the key says who is talking and
  the room says where; no placed pair puts an inner pair in an outer room.
- **Several pairs in one room at one bell.** Recommended: allowed, in file
  order (#912), because refusing it leaves the hall at Vespers one of its
  six pairs.
- **`inner-terce-1`'s bell, Sext in the King's Hall or Vespers in the
  Great Hall.** Recommended: Sext, because the Constable's board is where
  the coin is argued and the hall at Vespers already holds six pairs and a
  song.
- **Playback.** Recommended: not in this increment (#913), because it is a
  second trigger in `QuestManager` with its own browser beat. It is
  increment 4, below (#925 to #931): the twelve's pairs heard by room and
  bell rather than by #732's 1.5 to 3 m between settled bodies; a
  performance first, then the room's pairs in file order, one at a time,
  each once per page and never saved (#39); the beat in `quest.mjs` and the
  wire in `plan-vs-scene.mjs`, nothing Node can prove.
- **The 17 unplaced pairs.** Devon's call (#914), options: move a station,
  recast and rewrite, retire. Recommended: never move a station; recast and
  rewrite the nine that are a fact's only teller (`outer-prime-3`,
  `outer-terce-2`, `outer-cell-1`, `outer-sext-3`, `inner-prime-3`,
  `inner-terce-2`, `inner-terce-3`, `inner-sext-3`, `inner-vespers-1`);
  retire the other eight, because a station is an alibi and a retired sole
  teller leaves a fact told by nothing. They stay unplaced here.
- **`Drill` in the bodies.** Recommended: kept until rank 2c and 2d
  re-render the bodies (#807, #915), because taking it out now is a
  re-render for a clip nothing binds.

**Dependencies.** None. Lanes C and D, as this row's earlier increments.
`src/lore.js` and `test/lore.mjs` are in no other open row's scope.

**House rules that bite.** #529 (the chatter rail in `lore.mjs`, the
`drill` refusal in `mystery.mjs`), #13 (the unplaced list is asserted, not
printed), #34 (the break above), #36 and #39 (no save field, `SAVE_VERSION`
stays 6), #632 (above), #592 (the messages are its messages).

### Increment 4: the ten placed pairs, heard on the page

**Specified 2026-10-03** (#925 to #931). Not built. Class S from here: every
open call below carries a recommendation, no save bump, no assertion crosses
a suite line. The limits hold: no pair is placed, recast, rewritten or
retired (the 17 of #914 stay Devon's), no schedule station moves, no body is
added, `MAX_SKINNED_TOTAL` and `SAVE_VERSION` (6) are untouched, nothing
under `tools/castle3d/` is touched.

**What the code says today, and the one thing it gets wrong.**
`QuestManager` learns the player's room from `handleEnter` and from nowhere
else, and `src/main.js` calls it only for a named room: `if (!here.open)
quest.handleEnter(here.id, here.level)`. `outer-ward`, `inner-ward`,
`west-barbican` and `garden` are `open` in `nav.roomAt`. So `_room` keeps
the last named room while the player stands in a ward. Two consequences for
this increment: `outer-terce-1`, placed in `outer-ward`, could never start;
and the hall's six pairs would go on being captioned, one after another,
to a player who walked out into the outer ward. The same hole lets any
performance run on behind a player whose way out of its room leads onto
open ground; read from the code, not watched on a page. #926 closes it.

**The behaviour, in one paragraph.** When the player stands in a room at a
day-one bell, the band says that room's performance first if one is due,
then the room's placed pairs in file order, one at a time, with
`CHATTER_GAP_MS` (4000) of dark band before each pair that follows another
piece or a bell. Each pair is said once per page. Walking out of the room,
onto open ground included, or a bell, cuts the band dark; the cut pair
counts as heard, and walking back in starts the next unheard pair at once.
The caption's name is the name the line itself opens with.

**Scope, by file.**

- **`src/quest-manager.js`.**
  - The constructor takes `chatter = null` (`data/npcs.json`'s `chatter`,
    ward then watch then list) and builds `this._chatter`, a `Map` keyed
    `` `${room}/${watch}` `` like `_performances`, holding only pairs with a
    `room`, in file order (ward key order, then list order). Each entry is
    prepared once: `{ ...pair, watch, names, lines }`, where line `i` is
    split at its first `": "`, `names[i]` is the text before it and
    `lines[i]` the text after. A line with no `": "` keeps its whole text
    and takes the cast name of `pair.npcs[i % 2]` (`this.npcs`), or the id
    if there is none; `test/lore.mjs` is what stops that fallback being
    reached (#928).
  - `CHATTER_GAP_MS = 4000`, a named constant beside `captionMs`.
  - `chatterHere()`: the first pair in `_chatter.get(room/watch)` not in
    `_heard`, or null. Public, as `performanceHere` is.
  - `_maybeChatter()`: if `_playing` is set or `chatterHere()` is null, do
    nothing; otherwise add the id to `_heard` and `_run(pair, (i) =>
    pair.names[i], true)`. A chatter run is a `talk` run to the band, so
    `_maybePerform`'s existing "a performance outranks talk" line covers it
    unchanged, and `stopTalk(id)` never matches it because the ids differ.
  - `_queueChatter()`: if `chatterHere()` is null, schedule nothing.
    Otherwise set `this._gap` to a fresh token and `_schedule` a wake at
    `CHATTER_GAP_MS` that does nothing unless `_gap` is still that token
    and `_playing` is null, and then calls `_maybeChatter()`. Same pattern
    as `_run`'s own token: no timer is cancelled. `_gap` is dropped by every
    `_run`, by every `applyWatch`, and by a `handleStand` into a different
    room.
  - `_run`'s natural end (the `i >= piece.lines.length` branch, and only
    that branch) calls `_queueChatter()` after clearing the band, for every
    kind of run. **With no `chatter` handed over it schedules nothing**, so
    every existing `pending()` and `tick()` count in `test/quest.mjs` stands
    unedited.
  - `handleStand(room)`, new and public (#926): set `_room`; if `_playing`
    is in another room, `_stopPerformance()`; then `_maybePerform()`, and if
    that started nothing and no gap is pending, `_maybeChatter()`. It never
    touches the engine. `handleEnter` calls `handleStand(room)` in place of
    its own three lines and then asks the engine as it does today.
  - `applyWatch`: after `_stopPerformance()`, `_maybePerform()`; if that
    started nothing, `_queueChatter()`. A bell is followed by the gap, not
    by a pair at once (#925).
- **`src/main.js`.** Two edits. The `QuestManager` constructor call gains
  `chatter: npcData.chatter`. The room-change block becomes: named room,
  `quest.handleEnter(here.id, here.level)` as today; open ground,
  `quest.handleStand(here.id)`. The comment above it keeps saying open
  ground is not handed to the engine (#588), and says why the manager now
  hears of it.
- **`src/lore.js`.** `indexChatter` gains one check for a pair with a
  `room`: for each line `i`, the text before the first `": "` must be
  non-empty and the cast `name` of `pair.npcs[i % 2]` must start with it.
  Message, `where` being `chatter pair <id>`: `${where}: line ${i + 1} does
  not open with ${npc}'s name`. Unplaced pairs are not checked. All ten
  pass as shipped: measured, 0 mismatches over all 55 lines of the 27.
- **`data/npcs.json`.** Text of two comments only. `chatterComment`: "The
  pool is not yet played by the game (#913) and exists for src/lore.js to
  validate" becomes a sentence saying the ten placed pairs are played by
  `QuestManager` by room and bell (#925), the name on the band is the name
  the line opens with (#928), and the unplaced 17 are validated and not
  played. `performancesComment`: "(the same band the `chatter` pool above
  is waiting for)" becomes "(the same band the placed `chatter` pairs
  use)". No pair, no `room`, no line changes.
- **`test/quest.mjs`**, **`test/lore.mjs`**, **`test/plan-vs-scene.mjs`**:
  below.
- **Not touched**: `src/populace.js` and `data/populace.json` (the
  household's `talk` rail is as it is), `src/ui.js` and `index.html` (the
  band exists), `src/save.js`, `data/mystery.json`, `data/lore.json`,
  `test/budget.mjs`, `test/mystery.mjs`, `test/play-castle.mjs`,
  `dialogue/castle.dlg`, anything under `tools/`.

**Acceptance.** 1 to 11 in `test/quest.mjs`, a new section after "two of
the household, overheard", on `performRig` with the real `performances` and
the real `npcData.chatter` (`rig` gains a `chatter` option, default null).
12 in `test/lore.mjs` section 7. 13 and 14 in `test/plan-vs-scene.mjs`.

1. `great-hall` at Vespers: the band's first line is
   `song-vespers-hall`'s, under "Dafydd ap Rhys", and no chatter line is
   shown while the song runs.
2. After the song's last line the band is dark and exactly one step is
   pending. That step shows `outer-vespers-1`'s first line under the name
   "Dafydd", and the line does not begin "Dafydd: ".
3. Ticked to the end: the captions after the song are the twelve lines of
   `outer-vespers-1`, `outer-vespers-2`, `outer-vespers-3`,
   `outer-prime-1`, `outer-terce-4`, `outer-sext-2`, in that order, the
   band was cleared between each pair and the next, and it ends dark with
   nothing pending.
4. Once per page: out of the hall and back in at the same bell says
   nothing.
5. Cut by leaving: `kings-hall` at Sext shows `inner-sext-1`'s first line
   on entry with no gap. `handleStand('inner-ward')` darkens the band and
   the steps still pending say nothing. Back in, `inner-terce-1` starts at
   once and `inner-sext-1` is not said again.
6. The bell: standing in `kings-hall` at Terce the band is dark; the ring
   to Sext leaves it dark with one step pending, and that step shows
   `inner-sext-1`. And `chapel` at Prime shows `inner-terce-4`'s first
   line under "Sir Roger"; a ring darkens it and its second line is never
   shown.
7. Against the household: with a chatter pair on the band, `overhear` of a
   `talk` pair returns null and the band's line does not change. With a
   `talk` pair handed over in `kings-hall` at Sext on the band, entering
   that room starts no chatter; when the talk ends one step is pending and
   it shows `inner-sext-1`.
8. Open ground: `handleStand('outer-ward')` at Terce shows
   `outer-terce-1` under "Master Robert", then "Thomas Wykes", and the
   engine's visited set does not gain `outer-ward`.
9. Days: on the walking day, `great-hall` at `vespers-eve` shows nothing;
   on the morning after, `great-hall`, `kings-hall`, `chapel` and
   `outer-ward` at `lauds` show no chatter line.
10. The sweep: every room in `mystery.rooms` stood in at each of the four
    bells and ticked out says exactly the ten placed ids, each once, and
    no line of the 17.
11. Every section of `test/quest.mjs` above the new one passes with no
    edit to its assertions.
12. `validateLore` is clean as shipped. `outer-vespers-1` with line 1's
    opening changed to "Marged: " fails with "chatter pair outer-vespers-1:
    line 1 does not open with sentry's name". The same damage to unplaced
    `outer-prime-2` passes.
13. The wire, on the page at Prime: the camera is put on a floor cell of
    `chapel`, the page's own loop runs two frames, and `#caption` is
    shown with `#caption-name` "Sir Roger" and `#caption-line` equal to
    `inner-terce-4`'s first line less its "Sir Roger: ". The band is read
    dark first, as the talk beat does, so what lights it is the pair.
14. Then the camera is put on open `inner-ward` ground, two more frames,
    and `#caption-line` is neither of `inner-terce-4`'s lines. The camera
    goes back where it was. Parked, not waited on (#724): no timer, no
    `TOL`, and the shortest caption holds 2600 ms, so line one is still up
    two frames in.

`npm test` 15 of 15 and `npm run build` ok.

**The #34 break, four of them, each from green and each restored.**

- Delete the `_queueChatter()` call at `_run`'s natural end: 2 and 3 must
  go red, 1 stays green. Quote both.
- Delete `chatter: npcData.chatter` from `src/main.js`: 13 must go red
  while `npm test quest` stays green. That is what makes 13 a seam and not
  a Node fact (#529).
- Put `src/main.js`'s room-change block back to `if (!here.open)
  quest.handleEnter(...)` with no `handleStand`: 14 must go red, 13 stays
  green.
- Delete the name comparison in `indexChatter`: 12's second assertion must
  go red.

If any of the four leaves its suite green the row comes back to
`architect` (#147).

**Open calls, each with a recommendation.**

- **The trigger.** Recommended: three, all through `handleStand`,
  `applyWatch` and the end of a run (#925), because those are the only
  three moments the room, the bell or the band changes and a per-frame
  poll would be a second clock.
- **The pause.** Recommended: `CHATTER_GAP_MS = 4000` before a pair that
  follows a piece or a bell, none on walking in (#925), because 4000 is
  longer than the shortest caption (2600 ms) so a dark band reads as a
  break, and a player who walks in should not wait for a room that is
  already talking. It is a guess held as one constant; the hall at Vespers
  is where it is judged.
- **Order against the song.** Recommended: the performance first, then the
  pairs (#927), because the song is the hall's set piece (#593) and six
  pairs in front of it are 101 s before a note.
- **Order against the household's `talk`.** Recommended: neither cuts the
  other; whoever holds the band finishes, and a performance cuts both
  (#927), because no room at any bell holds both today and a rule with no
  case should cost no code.
- **Must both speakers be seen in the room.** Recommended: no, the room
  and the bell are enough (#928), because that is the rule a performance
  already plays by, #912 proves the schedule, and `QuestManager` reads no
  body's position. The gap after a bell is the allowance for bodies still
  walking in.
- **The name on the band.** Recommended: the name the line opens with,
  split off the line (#928), because the author wrote "Dafydd" and "Sir
  Roger", and the cast name beside it would print the speaker twice.
- **Does a cut-off pair count as heard.** Recommended: yes (#929), because
  that is what a sermon and a `talk` pair already do and a pair that
  restarts at every doorway is worse than one missed; a reload brings all
  ten back (#39).
- **Day two and the walking day.** Recommended: nothing plays (#930),
  because #911 placed the pairs against day one's schedule only and
  `lauds` and the four `-eve` bells are other stations.
- **`outer-terce-1` across the whole outer ward.** Recommended: accept it,
  heard from anywhere in the ward (#928), because an earshot test is a
  per-frame poll for one pair of ten; it is on the looking list below, and
  the fallback is to hand that one pair to `Populace`'s earshot rail in a
  later increment.

**Looking list, `npm run play` on a GPU (#53), judged by Devon, asserted
nowhere.**

1. The Great Hall at Vespers from the first note: 37.0 s of song, then six
   pairs at 77.3 s with six gaps of 4 s, 138.3 s in all. Does it read as a
   supper or as a wall of captions. `CHATTER_GAP_MS` is the one dial.
2. Ring Sext and walk to the King's Hall: are Sir Roger and Piers Marrable
   both in the room when `inner-sext-1` is captioned, or is one still on
   the road.
3. `outer-terce-1` read from the east end of the outer ward, with the cart
   out of sight.
4. Walking out of the hall door into the outer ward mid-pair: the band
   goes dark on the threshold and not a room later.
5. The band over an open dialogue panel and over the journal: legible, and
   not on top of either.

**Dependencies.** None. Lanes C and D: `data/npcs.json`'s two comments and
`src/main.js`'s constructor call and room-change block.
`src/quest-manager.js`, `src/lore.js`, `test/quest.mjs` and `test/lore.mjs`
are in no other open row's scope. `test/plan-vs-scene.mjs` gains one beat
beside the talk beat and moves none.

**House rules that bite.** #529: the beat is `quest.mjs`'s, the name rail
is `lore.mjs`'s, and `plan-vs-scene.mjs` holds only what `src/main.js`
does, which no Node suite loads. #39: 13 and 14 read the DOM; nothing reads
the save. #36: no save field, `SAVE_VERSION` stays 6. #34 and #147: the
four breaks above. #724 and #53: the browser beat parks and counts frames;
everything timed is on the looking list. #588: open ground still never
reaches `engine.enter`. #632: every new assertion reads data through
`JSON.parse`. #13: every new check exits non-zero.

### Increment 5: nine pairs recast, eight retired, and no pair without a room

**Specified 2026-10-03** (#932 to #938). Class S from here: every open call
below carries a recommendation, no save bump, no assertion crosses a suite
line. **Devon decided #914 on 2026-10-03, as recommended**: never move a
station, recast the nine pairs that are the only teller of a fact, retire
the other eight. The limits hold: no schedule station moves, no body is
added, `MAX_SKINNED_TOTAL` and `SAVE_VERSION` (6) are untouched, the town's
share is not this increment's, and nothing here needs `npm run play`.

**What the schedule allows, measured.** `data/mystery.json`'s day-one
`schedule` puts two of the twelve from one ward in one room, both awake, at
four places only: `chapel` at Prime (constable, chaplain), `outer-ward` at
Terce (clerk, merchant), `kings-hall` at Sext (constable, steward) and
`great-hall` at Vespers (any two of clerk, cook, sentry, laundress, or
constable and steward). The porter, the lady, the apprentice and the prisoner
share a room with nobody of their own ward at any bell, so after this
increment they speak in no pair. The ward rule (#554, #911) is kept.

**The pool after it: 19 pairs, 39 lines, every pair with a `room`.**

**Scope, by file.**

- **`data/npcs.json` `chatter`.** Eight pairs are deleted, nine are recast
  and moved, the ten of #911 are not edited. A recast pair keeps its `id` and
  its `cites` (#911) and takes new `npcs`, a `room`, new `lines` and the
  watch key it is said at. The four watch keys left with nothing under them
  (`outer.prime`, `outer.sext`, `inner.terce`, `inner.vespers`) are deleted,
  not left as `[]` (#935).

  Deleted: `outer-prime-2`, `outer-terce-3`, `outer-sext-1`,
  `inner-prime-1`, `inner-prime-2`, `inner-sext-2`, `inner-sext-4`,
  `inner-vespers-2`.

  Recast (`npcs` in speaking order):

  | Pair | `npcs` | Room | Watch key | Moves from | Tells |
  | --- | --- | --- | --- | --- | --- |
  | `outer-sext-3` | sentry, clerk | `great-hall` | `outer.vespers` | `outer.sext` | `sentry-grandfather`, `march-song` |
  | `outer-prime-3` | sentry, clerk | `great-hall` | `outer.vespers` | `outer.prime` | `cadeyrn-cross-count` |
  | `outer-cell-1` | cook, laundress | `great-hall` | `outer.vespers` | `outer.sext` | `prison-tower-scratching` |
  | `outer-terce-2` | clerk, merchant | `outer-ward` | `outer.terce` | stays | `saint-cadeyrn-miracle` |
  | `inner-prime-3` | constable, chaplain | `chapel` | `inner.prime` | stays | `aldous-heart` |
  | `inner-terce-2` | constable, chaplain | `chapel` | `inner.prime` | `inner.terce` | `sir-walter-debt-rumour` |
  | `inner-vespers-1` | chaplain, constable | `chapel` | `inner.prime` | `inner.vespers` | `chapel-relic` |
  | `inner-sext-3` | constable, steward | `kings-hall` | `inner.sext` | stays | `sir-roger-lestrange`, `lady-alys-brother` |
  | `inner-terce-3` | steward, constable | `kings-hall` | `inner.sext` | `inner.terce` | `town-debt-rumour` |

  **The file order, which is the order a room says them in (#935).** Exactly
  this, and no other key:

  - `outer.terce`: `outer-terce-1`, `outer-terce-2`.
  - `outer.vespers`: `outer-sext-3`, `outer-vespers-1`, `outer-vespers-2`,
    `outer-vespers-3`, `outer-prime-1`, `outer-terce-4`, `outer-sext-2`,
    `outer-prime-3`, `outer-cell-1`.
  - `inner.prime`: `inner-terce-4`, `inner-prime-3`, `inner-terce-2`,
    `inner-vespers-1`.
  - `inner.sext`: `inner-sext-1`, `inner-terce-1`, `inner-sext-3`,
    `inner-terce-3`.

  **The nine pairs' lines, in full.** Copy them as they are; the text before
  the first `": "` is the name on the band (#928).

  `outer-sext-3`:

  1. `Dafydd: My grandfather stood on the other bank of this river against the old King for nine years, Master Robert, and was sworn at the end of it, and kept his word and his opinions both. I stand the King's watch and I have the opinions.`
  2. `Master Robert: And the song, I suppose. I have sat at the high table and heard the garrison sing it every Michaelmas I have kept the works, and never been told a word of what it says.`

  `outer-prime-3`:

  1. `Dafydd: There is a cross cut in the stone for every man who died building this place. Count them and you have the priest's roll without the Latin.`
  2. `Master Robert: A cross goes at the springing of an arch, Dafydd, and it means the arch. The watch has counted them twice and got two numbers, and neither of them was the roll.`

  `outer-cell-1`:

  1. `Marged: Madoc tells whoever stands at his bars that something moves under the Prison Tower's floor at night. Slow. A drag, then a stop, same as it has since before they put him in to hear it.`
  2. `Nest: He has said that every day this week, Marged, and I have believed him every day this week, and neither of those has got him out.`

  `outer-terce-2`:

  1. `Master Robert: The lodge has it that a hod-carrier went off the Bakehouse Tower's scaffold in the ninth year and stood up laughing, for calling on Cadeyrn on the way down.`
  2. `Thomas Wykes: They also say it was a load of straw broke his fall and not the saint. I have hauled that straw. It was a great deal of straw.`

  `inner-prime-3`:

  1. `Sir Roger: They say the old King's heart is under your altar stone, Father, in a lead box sent up from Vantry the year he died, so that some part of him should see the place finished.`
  2. `Father Anselm: I have had a bar under that stone once, Sir Roger, and I will not tell you what I found, because whichever way it went it is a scandal, and I have enough of those.`

  `inner-terce-2`:

  1. `Sir Roger: They say Sir Walter's own coffer covered what the works had lost, before he died, and that is the whole reason his books balanced.`
  2. `Father Anselm: I have read his accounts, Sir Roger. I have also heard what you just said from three other mouths, each swearing he had it from a fourth.`

  `inner-vespers-1` (three lines; line 3 is `npcs[0]`'s again):

  1. `Father Anselm: I keep a knuckle of bone under glass on the north sill, Sir Roger, and call it Saint Osyth's own.`
  2. `Sir Roger: And do you believe that, Father, or only say it?`
  3. `Father Anselm: On my better days, both.`

  `inner-sext-3`:

  1. `Sir Roger: Eleven years married, Piers, and eight of them here. I had twelve men at Bryn Adda and thought myself a Constable. I have eight now and a wall, and think myself less of one.`
  2. `Piers Marrable: And a wife whose brother sits among the justiciar's clerks, Sir Roger, which you have never once mentioned and never once forgotten.`

  `inner-terce-3`:

  1. `Piers Marrable: There is an alderman's family in Mereford that has not paid its wall-tax in a decade, if the roll were ever made to say so.`
  2. `Sir Roger: And whose hand keeps the roll from saying so, Piers? I ask it in this hall, and I would not have it asked past the door.`

- **`data/npcs.json` `chatterComment`**, text only. "Twenty-seven pairs. The
  ten placed pairs are played by QuestManager on the caption band, by room
  and bell (#925), and the name on the band is the name the line opens with
  (#928); the unplaced 17 are validated by src/lore.js and not played."
  becomes: "Nineteen pairs, every one with a `room` (#932): of the first
  twenty-seven, eight were retired and nine recast onto two speakers the
  schedule puts in one room. QuestManager plays them on the caption band, by
  room and bell (#925), and the name on the band is the name the line opens
  with (#928)." After "so an id no longer spells its bell (#911)" add: "nor
  its room or its speakers: `outer-cell-1` is said in the Great Hall by the
  cook and the laundress (#933)". "A pair with a `room` is placed: `room` is
  one of" becomes "Every pair names a `room`, one of". "A pair with no `room`
  is unplaced, waiting on a recast or a retirement (#914), and src/lore.js's
  `unplacedChatter` lists it." becomes "A pair with no `room` is refused by
  src/lore.js (#937)." Add one sentence: "A watch key with no pair under it
  is left out (#935)."
- **`data/npcs.json` `performancesComment`**, text only. "(the same band the
  placed `chatter` pairs use)" becomes "(the same band the `chatter` pairs
  use)", and "while a placed chatter pair names its room, and its watch key
  is its bell" becomes "while a chatter pair names its room, and its watch
  key is its bell".
- **`data/lore.json`.** Seven `sources` rows go, each naming a deleted pair
  (#936): `{kind: "chatter", id: "inner-sext-4"}` from `the-cross-wall`;
  `inner-vespers-2` from `gwilym-porter` and from `household-and-works`;
  `inner-prime-1` from `kings-debt-wages`; `outer-sext-1` from `hywel-rise`;
  `outer-terce-3` from `madoc-smith`; `outer-prime-2` from `saint-cadeyrn`.
  Each fact keeps at least one source (1, 1, 2, 3, 2, 1, 2 left). Nothing
  else in the file changes: the nine recast pairs keep their ids, so the
  eleven `sources` rows that name them stand, `march-song`'s and
  `sir-roger-lestrange`'s among them. No fact `text` is edited.
- **`src/lore.js`.**
  - `indexChatter`: a pair with no `room` is a problem (#937). Message,
    `where` being `chatter pair <id>`: `${where}: names no room`. It is said
    once per pair, where `placed` is computed, and the pair's other checks
    still run.
  - The name rail runs for every pair with two speakers: the `if (placed)`
    around it goes.
  - `unplacedChatter` and its doc comment are deleted.
  - Comments: the block in `indexChatter` that ends "A pair with no `room`
    is unplaced: it passes here and `unplacedChatter` lists it" says a pair
    with no `room` is refused (#937); the name rail's "An unplaced pair is
    not played and is not held to this (#914)" is deleted; the performance
    check's heading "WHAT A PERFORMANCE HAS THAT AN UNPLACED CHATTER PAIR
    DOES NOT" and its "since #911 a placed pair names its room too" say what
    is true now: every chatter pair names its room and is held to the same
    station check (#937).
- **`src/quest-manager.js`**: one comment. "Only a pair with a `room` is
  here (#911); the unplaced 17 are src/lore.js's to validate and nobody's to
  play (#914)." becomes "Every pair names a `room` (#937); one that does not
  is skipped here and refused by src/lore.js." The `pair.room == null` skip
  stays. No code changes.
- **`src/populace.js`**: one comment, near `TALK_RADIUS`. "not one of its 27
  pairs has its speakers within 3 m at the pair's own watch (#731)" becomes
  "it is played by room and bell, not by the 3 m between two bodies (#731,
  #925)".
- **`src/main.js`**: nothing.
- **`test/lore.mjs`**, **`test/quest.mjs`**: below.
- **`test/plan-vs-scene.mjs`**: nothing. Its chatter beat reads
  `inner-terce-4`, which stays the first pair in `chapel` at Prime, and no
  new assertion here is a seam (#529).
- **Not touched**: `data/mystery.json` (no station moves), `src/save.js`,
  `data/populace.json`, `src/ui.js`, `test/budget.mjs`, `test/mystery.mjs`,
  `test/play-castle.mjs`, `dialogue/castle.dlg` and `tools/dialogue.mjs`
  (the chatter pool is not in the `.dlg`; 0 hits for any pair id under
  `dialogue/` or `tools/`), `WISHLIST.md` (its "twenty-seven-pair pool" and
  "27 chatter pairs and 54 lines" are a dated record of what the theme
  found).

**`test/lore.mjs`, edit by edit.**

- The header comment's "a chatter pool of twenty-seven pairs" says nineteen.
- Section 1: `pairs.length === 27` becomes `=== 19`, with its label.
- Seven fixtures use `badChatter.outer.prime[0]` (one in section 4, six in
  section 7). That key is gone. Each becomes `badChatter.outer.terce[0]`,
  which is `outer-terce-1`. Measured against the pool above, each still
  draws the message it looks for, and the "id used twice" fixture pushes
  onto `badChatter.outer.terce`.
- Section 7, continued. The `unplacedChatter` import, `THE_SEVENTEEN` and
  the two assertions on them go. `PLACED` becomes the 19 rows: the ten of
  #911 unchanged plus the nine in the table above. The two assertions on it
  keep their shape, "nineteen pairs carry a room" and "each in its room,
  under its ward and the watch key it is said at", and a third is added:
  every pair in the pool is in `PLACED`, so a twentieth pair without a row
  here is a failure.
- New: `outer-vespers-1` with its `room` deleted fails with `chatter pair
  outer-vespers-1: names no room`.
- `inner-prime-1` given `porter-lodge` is replaced: `inner-terce-3` given
  `room: "steward-chamber"` fails with `chatter pair inner-terce-3: steward
  stands in kings-hall at sext, not in steward-chamber`.
- `outer-prime-3` given `guardroom` is replaced: a pair `{ id:
  'asleep-at-prime', npcs: ['sentry', 'cook'], room: 'guardroom', lines:
  ['Dafydd: Not yet.', 'Marged: So I see.'] }` put under a new
  `bad.outer.prime` fails with `chatter pair asleep-at-prime: sentry is
  asleep at prime`.
- The `merchant-at-prime` fixture is reached through `breakPair('outer-terce-1',
  ...)` and creates `bad.outer.prime` before it pushes. Its message stands.
- The name rail: the first two assertions stand, the label "the ten placed
  pairs" loses "ten placed". "The same damage to unplaced `outer-prime-2`
  passes" is deleted. New: `inner-vespers-1` with line 3's opening changed
  to "Sir Roger: " fails with `chatter pair inner-vespers-1: line 3 does not
  open with chaplain's name`, which is the first check of `i % 2` past line
  2.
- Section 2 stands unedited: `untoldFacts` is still exactly `the-well` and
  `prison-tower-origin`.

**`test/quest.mjs`, edit by edit**, all inside "two of the twelve, in a
room". Nothing above that section is touched, and `rig` is not.

- The header comment's "ten" becomes nineteen, and "none of the 17" goes.
- `HALL_ORDER` is `outer.vespers`'s nine, in the file order above.
- 2: the step after the song shows `outer-sext-3`'s first line under
  "Dafydd", not `outer-vespers-1`'s.
- 3: the captions after the song are the eighteen lines of `HALL_ORDER`;
  the band was cleared between each pair and the next, 8 times; 9 clears.
  Write the two counts as `HALL_ORDER.length - 1` and `HALL_ORDER.length`.
- 5, 6, 7, 8, 9: no edit. `inner-sext-1` then `inner-terce-1` are still the
  King's Hall's first two, `inner-terce-4` the chapel's first, and
  `outer-terce-1` the outer ward's first.
- New, 5b: `chapel` at Prime ticked to the end says `inner-terce-4`,
  `inner-prime-3`, `inner-terce-2`, `inner-vespers-1` in that order, nine
  lines, and the last caption is under "Father Anselm" and is "On my better
  days, both."
- New, 5c: `kings-hall` at Sext ticked to the end says `inner-sext-1`,
  `inner-terce-1`, `inner-sext-3`, `inner-terce-3` in that order.
- New, 8b: after `outer-terce-1`'s second line, one step is pending, and
  the step after the gap shows `outer-terce-2`'s first line under "Master
  Robert".
- 10, the sweep: `placed.length === 19`, "exactly the nineteen pairs". The
  assertion "and no line of the 17" is replaced by `allPairs.length === 19
  && placed.length === allPairs.length`, "and the pool holds no pair
  without a room".

**Acceptance.**

1. `npm test lore`: `validateLore` is clean as shipped, 19 pairs, the
   `PLACED` table of 19 holds in both directions, `untoldFacts` is exactly
   `the-well` and `prison-tower-origin`.
2. A pair with no `room` fails with "names no room".
3. The station fixtures and the two name fixtures above each draw their
   message.
4. `npm test quest`: the hall at Vespers says the song, then the nine pairs
   in file order starting with `outer-sext-3`; the chapel at Prime and the
   King's Hall at Sext say their four in file order; the outer ward at Terce
   says its two; the sweep hears exactly the nineteen, each line once.
5. `grep -rn unplacedChatter src test` returns nothing.
6. No line of the 19 pairs contains an em dash, and each recast line is the
   text above, character for character. The builder diffs the nine pairs'
   lines against this section rather than reading them.
7. `npm test` 15 of 15 and `npm run build` ok. `test/plan-vs-scene.mjs` is
   unedited and green.

**One thing to watch in `test/plan-vs-scene.mjs`, with what to do.** The
chapel at Prime now holds four pairs, and that suite stands the camera in
the chapel at Prime more than once: the chatter beat hears `inner-terce-4`,
the HUD beat (#515) starts and cuts `inner-prime-3`, and any later stand
starts the next. Only two reads look at the band, the chatter beat's own
and the household talk beat's "the band is dark before the beat"; the
second runs with the camera wherever the beats before it left it. If that
read goes red, the report quotes what was on the band. The fix allowed in
class S is in the beat's own setup, standing the camera on open
`inner-ward` ground for two frames before the read, as the chatter beat's
second half does. Reordering the pool to make it pass is not allowed.

**The #34 break, four of them, each from green and each restored.**

- Delete the `names no room` line in `indexChatter`: the new assertion on
  `outer-vespers-1` with its `room` deleted must go red with "said
  nothing". Everything else in `lore.mjs` stays green.
- In `data/npcs.json`, give `outer-sext-3` its old `npcs`, `["sentry",
  "merchant"]`, with its `room` and new lines kept: `validates clean` must
  go red with `chatter pair outer-sext-3: merchant is not in the castle at
  vespers`.
- In `data/lore.json`, put `{ "kind": "chatter", "id": "outer-prime-2" }`
  back into `saint-cadeyrn`'s `sources`: `validates clean` must go red with
  `saint-cadeyrn: unknown source, no chatter pair "outer-prime-2"`.
- In `data/npcs.json`, move `outer-sext-3` to the end of `outer.vespers`:
  `npm test quest` 2 and 3 must go red and `npm test lore` stays green,
  which is what makes the order `quest.mjs`'s and not the rail's.

If any of the four leaves its suite green the row comes back to `architect`
(#147).

**Open calls, each with a recommendation.**

- **Who says `cadeyrn-cross-count`.** Recommended: the sentry and the
  clerk, in the hall at Vespers (#933), because the fact is the garrison's
  belief against the masons' and Dafydd's line then stands word for word,
  with only the name on the answer changed. The fallback, if the hall reads
  as too long on a GPU, is clerk and merchant in the outer ward at Terce.
- **Who answers Dafydd about his grandfather.** Recommended: the clerk
  (#933), because the answer is "never been told a word" of the song, and
  `hall-high-table` seats the Clerk of Works at the high table, which the
  song itself says has none of the words. The cook came up from Mereford
  and the laundress calls the March's tongue "our own".
- **Who reports Madoc.** Recommended: the cook says it and the laundress
  answers (#933), because Nest's answer is then her own line turned to the
  third person, and "tells whoever stands at his bars" is the fact's own
  wording.
- **Where `sir-walter-debt-rumour` and `lady-alys-brother` go.**
  Recommended: the first to the chapel at Prime with the chaplain
  answering, the second to the King's Hall at Sext with Sir Roger speaking
  of himself and the Steward answering (#933). Father Anselm's "I have read
  his accounts" is the stance `sir-walter-esturmy` and the Vespers sermon
  already give him, said over the floor Sir Walter lies under; and it
  leaves each room four pairs instead of five and three.
- **Does a recast pair keep its second cite.** Recommended: yes, both
  (#936). `outer-sext-3` still says the garrison sings the song and a
  King's man has never been told the words; `inner-sext-3` still says eight
  years here and twelve men at Bryn Adda.
- **Where a recast pair sits in its list.** Recommended: after the pairs
  #911 placed, in the order above, except `outer-sext-3`, which goes first
  in `outer.vespers` (#935), because its second line answers the song and
  the song is what the hall says first (#927); behind six pairs it would be
  said 105 s after the last note. Everywhere else the first pair of a room
  is unchanged, so `plan-vs-scene.mjs` and `quest.mjs` 5 to 9 stand.
- **An empty watch key.** Recommended: deleted (#935), because the key is
  the bell a pair is said at and a bell with no pair is not in the file;
  `indexChatter` and `QuestManager` both walk `Object.entries` and need no
  key to exist.
- **A pair with no `room`.** Recommended: a failure, "names no room", and
  `unplacedChatter` deleted (#937), because nothing waits on Devon now, a
  report that must always be empty is a second way of saying the same
  thing, and a pair with no room is one the page can never say.
- **The name rail on a pair with no `room`.** Recommended: it runs too
  (#937), because the gate existed only to leave the 17 alone and there are
  none.
- **`QuestManager`'s skip of a pair with no `room`.** Recommended: kept,
  because the manager is also built with pools no validator has read (the
  rigs in `test/quest.mjs`), and a skip costs one comparison.
- **The ward rule.** Recommended: kept as it is (#554, #911), because all
  nine recasts fit inside it; it is why the porter, the lady, the
  apprentice and the prisoner now speak in no pair, which is accepted.
- **Four pairs in a row from the same two men in the chapel.**
  Recommended: accepted and put on the looking list, because the chapel at
  Prime holds only the Constable and the chaplain of the twelve, and the
  alternative is retiring a sole teller.

**Looking list, added to increment 4's, `npm run play` on a GPU (#53),
judged by Devon, asserted nowhere.** By `captionMs`, with the names split
off:

1. The Great Hall at Vespers is now 37.0 s of song, nine pairs at 120.3 s
   and nine gaps: 193.3 s from the first note, up from 138.3. Is that a
   supper. `CHATTER_GAP_MS` and the first open call's fallback are the two
   dials.
2. The chapel at Prime, walked into: four pairs, 52.0 s and three gaps,
   64.0 s, all Sir Roger and Father Anselm, with the mason laid out between
   them.
3. The King's Hall at Sext, walked into: four pairs, 51.5 s and three gaps,
   63.5 s.
4. The outer ward at Terce: two pairs, 23.2 s and one gap, 27.2 s, heard
   from anywhere in the ward (#928).

**What the builder changes in the doc files.**

- `BACKLOG.md`, the rank 6 row: "10 of the twelve's 27 chatter pairs placed
  by room and bell (#911, #912) and now played by room and bell (#925 to
  #931); left: the 17 that wait on Devon (#914), the town's share" becomes
  "the twelve's chatter pool placed and played by room and bell, 19 pairs
  after nine were recast and eight retired (#911, #925 to #938); left: the
  town's share". The rest of the row stands; the row stays open.
- `BACKLOG.md`, the rank 6 prose: "Four increments shipped" becomes five;
  "and `unplacedChatter` lists them as a ratchet" gains "until the fifth";
  a sentence for the fifth is added after the fourth's: nine recast, eight
  retired, 19 pairs each with a `room`, a pair with no `room` refused
  (#932 to #938). In "Left", item (2), the 17, is deleted and (3) becomes
  (2); item (1)'s "the hall at Vespers end to end at 138.3 s" becomes 193.3
  s, and the chapel's four pairs are added to its list.
- `ROADMAP.md`: "(10 chatter pairs placed, #911; playback and the town's
  share left)" becomes "(19 chatter pairs placed and played, #911 to #938;
  the GPU look and the town's share left)".
- `CLAUDE.md`: nothing. It names neither the pool nor a count.
- `HISTORY.md`: the "Built the same day" paragraph under #938, in the shape
  of increment 4's: files, assertions, the four breaks with what each said,
  the checks on huginn.

**Dependencies.** None. Lane C for `data/npcs.json`. `data/lore.json`,
`src/lore.js`, `src/quest-manager.js`, `test/lore.mjs` and `test/quest.mjs`
are in no other open row's scope.

**House rules that bite.** #529: every assertion here is a fact about two
data files or about `QuestManager` on a rig, provable in Node, so it is
`lore.mjs`'s or `quest.mjs`'s and none goes to `plan-vs-scene.mjs`. #13:
the report is replaced by a failure. #34 and #147: the four breaks. #36 and
#39: no save field, `SAVE_VERSION` stays 6, `_heard` is still per page.
#632: every assertion reads data through `JSON.parse`; `data/npcs.json` and
`data/lore.json` are edited keeping each file's own line ending. #53: the
looking list is not asserted. Writing style: no em dash in any line.

### Dependencies

- **Nothing gates it.** Rank 10 unblocks the four deferred activities and
  this increment waits on none of them.
- **Lanes C and D**: `data/populace.json`, `data/npcs.json`'s comment and
  `src/main.js`'s one constructor. `src/quest-manager.js` is in no other
  open row's scope today.
- **Not `data/scene-config.json`**, which rank 4 and 2b hold in lane B.
- **The GPU run** is what a later ceiling argument cites; this increment
  does not wait on it.

### Constraints

- #500: a populace stop is not a plan piece and has no `planId`.
- #529 and #611: the validator and `talkDue` in `mystery.mjs`, the band in
  `quest.mjs`, the cost in `budget.mjs`, and `plan-vs-scene.mjs` for the
  wire and nothing Node can prove.
- #13, #34: every rail above is broken from green and the failure quoted.
- #36, #39: talk is not saved and `SAVE_VERSION` stays 6.
- #724: the beat parks rather than waits, and `TOL` is not touched.
- #632: any new assertion over a data file's text reads both line endings.

---

## Sound: a soundscape

**Rank 7. Size 1.** `WISHLIST.md` theme 2. **The first increment below
shipped on 2026-09-17** (#620 to #623): `data/sounds.json` carries the
footstep, the chapel bell (#519, #522) and an `ambient` block of seven
synthesised beds; `src/audio.js` has `bedOf` and the cross-fade;
`test/layout.mjs` check 13 and a section of `test/map.mjs` hold them. The
zone list below was written before anybody counted: the castle builds no forge
and has no rain, and the garden cannot be stood in (#469), so none of the
three has a bed (#621). Scope and Acceptance are kept as written, as the
record of what was asked for.

**The second increment, a bed at a point and the four rings, shipped on
2026-09-18** (#680 to #683). A `PannerNode` per source, at the point of the
room's footprint nearest the player rather than its centre (#680, because the
south walk is 18 m long), the nearest three within 14 m sounding at once, open
ground in the head; a drum's storeys with the same bed are one source (#681);
`bell.rings` gives the four rings a stroke count and a gap each (#682). The
Node criterion held is that every source is heard from a point inside its own
footprint, from anywhere; the rest is ears (#53). `ambient.spatial` in
`data/sounds.json` is the whole of the tuning.

**The third increment, the two event sounds that need no clip, shipped on
2026-09-19** (#696 to #698). `data/sounds.json` has an `events` block:
`byCue` maps what the engine does to a sound, `sounds` is each sound as a
list of parts (a noise burst or a tone, at an offset, struck or held), and
`spatial` is the panner every one plays through, at the point the cue names.
`CUES` in `src/audio.js` is the code's half: `door-open` and `door-shut`,
fired by `openLock` and `shutLeaf` from the leaf's centre on a change of
state only, and `hound-near`, cued by the populace every frame the hound is
inside its follow radius and paced into barks by the sound's own `cadence`.
`test/layout.mjs` check 14 holds every cue to a sound and every sound to a
cue, and `test/plan-vs-scene.mjs` holds the two wires in `src/main.js`.
Nothing plays before the start button (#697). The rest of the event sounds,
the hammer and the sweep, still wait on rank 6's clips.

**What is left is the listening**, and the checklist for it is at the end of
this section.

### Scope

- **`data/sounds.json` grows an `ambient` block**: one bed per zone (kitchen,
  forge, chapel, wall walk, outer ward, rain), each a set of oscillator/noise
  parameters in the same shape `steps.classes` already uses, or a named CC0
  file once #548's reversal has one to name. Either way the file is the only
  place the sound is tuned, per the existing pattern.
- **`src/audio.js`** gains the cross-fade: on the room change the HUD already
  computes (#515), fade the outgoing zone's bed down and the incoming one up
  over about a second, rather than cut.
- **Recorded audio, if used**, is named by `data/sounds.json`, swept by
  `test/assets.mjs` for reachability the way a glTF is (#390), and given a
  codec (Opus in Ogg, #506's recommendation) by `tools/encode-assets.mjs`
  before it is committed. No file lands uncompressed.

### Acceptance

- `test/layout.mjs` gains a check that every zone the plan knows has an
  `ambient` entry naming it, the way check 12 already holds every surface to
  a footstep material. Break: add a zone to the plan without an entry; the
  check should name the zone.
- `npm run build` and the existing ten suites stay green; a recorded file (if
  any landed) shows up in `test/assets.mjs`'s reachability sweep and in
  `tools/encode-assets.mjs`'s output the same commit it is added, per #390.
- The actual sound is a `npm run play` question (#53): this row's Node
  acceptance is that a bed is *assigned and cross-faded*, not that it sounds
  right, the same split rank 11 draws for a shadow.

### Open calls

- **Synthesised or recorded, per zone, right now.** Recommend **synthesis
  first for every zone in this increment**, matching `steps` and `bell`'s own
  precedent, and let a recording replace one only once #548's licence
  question is actually answered for a specific CC0 file — "a sound stays
  synthesised until a recording beats it" is `WISHLIST.md`'s own line.
- **Event sounds (door, bark, hammer strike)** are named in the theme but are
  the increment after this one: they want an activity clip to sync to, which
  is rank 6's to add first. (The door and the bark turned out to need no
  clip, and shipped as the third increment, #696 to #698. The hammer still
  waits.)

### Dependencies

- **`data/sounds.json`'s existing `byMaterial`/`byKind` map and #515's room
  tracking** are both shipped; this row is additive to them.
- Event sounds wait on rank 6's activities existing to sync to.
- The bell-as-soundscape half (Prime one bell, Vespers the whole peal) is a
  `partials`/`gain` change to the existing `bell` block, not a new system, and
  can ship inside this same increment if time allows.

### Constraints

- #493 (nothing fetched off-origin; a CC0 file is committed, not linked).
- #506 (encode before commit; no uncompressed audio).
- #390 (asset and reference land in the same commit; `assets.mjs` check 4's
  pattern).
- #519, #548 (synthesis-only reversed; a sound stays synthesised until a
  recording beats it, not the other way round).

### Listening checklist

Nobody has heard any of this (#53). `npm run play` on the dev machine, with
speakers or headphones, and `data/sounds.json` open beside it: every number
below is tuned there and nowhere else. Write what was wrong, not that it was
wrong, and put the answers in `HISTORY.md` against this row.

**The seven beds** (`ambient.beds`; stand in each, then walk out of it):

- [ ] `ward`: the head bed on open ground. Does it read as outdoors, and is it
      still there under the kitchen and the hall heard through their walls?
- [ ] `wallwalk`: up on the walk. Is the wind a wind, and does it stop at the
      top of the stair or bleed down it?
- [ ] `kitchen`: from the ward outside its door first, then across the
      threshold. Is the crackle a fire and not a click, and is the threshold
      a step and not a fade?
- [ ] `hall`: the same test at the Great Hall's door. The near wall is where
      it is heard from outside; is that what it sounds like?
- [ ] `chapel`: the two-note drone is tuned to the bell. Ring it there. Do the
      two agree?
- [ ] `chamber`: the lodge and the solars. Quiet enough to be a room and not
      silence?
- [ ] `tower`: climb the King's Tower. Nothing should fade on the stair
      (#681). Does anything?
- [ ] The two most likely wrong: 14 m of earshot through stone
      (`spatial.hearMetres`), and a tower roof heard from the hall under it.

**The four rings** (`bell.rings`; press E at the bell four times, once per
watch, from the chapel and then from the far ward):

- [ ] Terce, one stroke. Is it a bell and not a chime? The tierce at 396 Hz
      is what should make the difference.
- [ ] Sext, two strokes 1.3 s apart. Two, or one with an echo?
- [ ] Vespers, six at 0.9 s. A peal, or a machine? `gapSpread` is 0.08.
- [ ] The summons, three at 1.8 s and louder. Does it read as heavier, or
      only as slower?
- [ ] From the far ward: thin and placed, or gone?

**The two event sounds** (`events.sounds`):

- [ ] The muniment door, `latch-and-swing`: answer the word standing in front
      of it. A click, a second click, then a rush and a low hinge for the
      2.5 s the leaf takes. Is the hinge sawtooth a hinge, or a buzz? Is the
      whole thing at the door and not in the head?
- [ ] The same door on the second morning, `latch-and-slam`: the Clerk's word
      goes back over it as Lauds opens. A short swing, a thud, a latch. Is
      it audible from where the day starts, and should it be?
- [ ] The hound, `bark`: walk up to Gelert in the outer ward at Prime and
      stand. A double bark inside a second, then one every 7 s or so while
      you stay. Is 560 Hz falling to 380 Hz through an 1100 Hz formant a dog,
      or a duck? Walk away past 5 m and back: the first bark should be quick
      again.
- [ ] Does anything fire before Enter the Castle is pressed? It must not
      (#697); a save resumed with the door open is the case to try.

---

## A castle to get lost in

**Rank 9. Retired (#910), against #582, #588 to #591, #725 to #728 and #795 to
#798.** Its row is out of `BACKLOG.md` and struck through in `ROADMAP.md`.
Devon dropped the rock on 2026-10-02 (#910): it will not be specced. What other
sections cite, and what is open:

- **The map (#588 to #591)**: the journal's third tab, `nav.rooms()` drawn by
  `src/ui.js`, `visited` on the save since version 5, `test/map.mjs`.
- **The town (#725 to #728)**: six houses and a church inside Mereford's wall,
  check 4d (every outside room seen from a wall walk or a tower roof, never
  lower), an `outside` bucket in `test/budget.mjs`. Nothing in it is enterable
  (#703); no bodies in it while that stands (#707).
- **The quay and the river (#870 to #872)**: the toll-house under a `gable`
  built shape, water as a piece and never a surface (#795), checks 4e and 4f.
  First seen point (-155, -3) from `floor-sw-tower-roof` at 119.7 m; the outer
  ward at 1181 of 1200 meshes. Dropped from the spec: a far bank, a boat, a
  sound, a tide (#796 to #798).
- **Open: the quay's look (#53)**, moved to rank 3 (#910), under "The GPU run".
  If it does not read, the lever is `lighting.fog`, not the town or the west
  wall.
- **Dropped: the rock** (#910): a postern and water gate would make the outside
  enterable, overturning #703, and a view down to water means moving the river
  or raising the castle.

---

## Feel

**Rank 11. Size 2+. The first increment's Node half shipped on 2026-09-17**
(#650 to #654). `WISHLIST.md` theme 7. Every item in it is "a thing a
GPU decides," gated on `npm run play` the same way rank 5's hall covering was
— until it shipped by rendering the hall directly rather than waiting on
`npm run play` to reach it (#656 to #658).

### What shipped, in one paragraph

`src/player-rig.js` adds one group to the scene: a 0.46 m disc with a radial
gradient painted into a 64 x 64 canvas at load, sitting 0.02 m over
`PlayerController.feet` — the plan's own floor height, so the shadow and the
feet cannot disagree about a slab edge — and a hand of six primitives merged
into one geometry, which rests below the frame and lerps out to the leaf's own
`focus`, clamped to 0.78 m from the eye. Two draw calls, 16 KB of texture, no
file, no second shadow-casting light (#650). It reaches for
`interaction.currentTarget` rather than searching, so the hand and the prompt
cannot disagree about which door the player is at (#652), and **every mesh in it
has `raycast` set to a no-op**, because the rig is a top-level scene child and
`interaction.js` calls every one of those an occluder (#651). `settle()`
collapses the smoothing and the world matrix with it, which is what lets the
suite assert a position and never a duration (#653). Nine assertions in
`test/plan-vs-scene.mjs`, each broken on purpose; the ray ones cast twice, once
with `THREE.Mesh`'s own `raycast` put back, so "it did not hit" cannot pass on a
ray that was never going to hit anything.

### Scope, first increment — the GPU half, which is what is left

- **A shadow on the pavers and a hand that reaches for the door.** Both are
  named in `WISHLIST.md` as the two cheapest presence cues there are.
  `src/main.js`'s player rig gets a simple blob shadow (a decal or a baked
  circle under the capsule, not a real-time cast shadow, to keep the budget
  #499 and #510 already watch) and a hand node that lerps toward a door's
  handle transform inside the existing `openLock` interaction radius.
- **Nothing else in this theme** (weather, fire, examine, wear, sitting)
  starts before this pair, because they are the cheapest and the ones most
  likely to reveal whether the point-light and shadow budget has room for
  the rest at all.

### Acceptance, first increment

- ~~Node acceptance: the shadow decal and the hand node exist, are tagged with
  a `planId` if they are plan pieces, and do not regress `plan-vs-scene.mjs`.~~
  **Met** (#650 to #654). Neither is a plan piece, so neither carries a
  `planId`, and that is asserted rather than assumed: the rig moves with the
  player and a tagged moving object is a box the plan's diff cannot predict.
- GPU acceptance (#53): a screenshot of the player approaching a door with the
  hand visibly reaching, and a screenshot of the shadow on stone versus on
  grass; one sentence each in `HISTORY.md`, the same bar rank 2's photograph
  sets. **Still open**, and a third shot was added to it by the work: the disc
  is flat and a flight of stairs is a ramp, so what it does on a stair is
  unlooked-at.

### Open calls

- ~~**Real-time shadow or a baked decal.**~~ **Taken: the decal** (#650). A
  shadow-casting light on the player is a cost this castle has never paid, and
  the wishlist's own language ("cheapest presence cue") argued for the cheaper
  of the two. What shipped is cheaper again than a baked file — the gradient is
  painted into a canvas at load, so there is no asset to encode (#506) and
  nothing new is fetched (#493).
- **Everything else in the theme** (weather, fire, examine, wear, sitting) is
  explicitly a later increment each, in no fixed order — `WISHLIST.md` ranks
  none of them against each other, and this spec does not invent an order it
  was not given.

### Dependencies

- **The GPU run** (ranks 2 and 3) is what tells this row whether the shadow
  and hand read at all; nothing here ships past the Node acceptance before it.
- Fire and its point-light budget depend on **The GPU run**'s texture read
  too, since a bright torch over a compressed texture is a second question
  the same render answers.

### Constraints

- #53 (the whole row; a real-time visual claim is inconclusive until a real
  GPU looks at it).
- #499, #510 (video memory is the number to watch, not disk; a shadow or a
  point light is exactly the kind of thing that moves it).
- #500 (anything built as a plan piece gets a `planId`).

---

## The floor plan you can see

**Rank 13. Shipped (#909), in three increments, against #745 to #749.** Its row
is retired from `BACKLOG.md` and `ROADMAP.md`. What is cited and what is open:

- **Increment 1 (#748)**: the read-only top-down sheet, `src/edit-layout.js`
  over `tools/plan-sheet.mjs`, with its own sentinel in `test/built.mjs`'s grep
  of `dist/` (#747, #586).
- **Increments 2 and 3 (#909)**: `walls` and `rooms` are in `tools/place.mjs`'s
  `PLACEABLE`; `tools/layout-edit.mjs` holds the pure row edits; the sheet drags
  rooms, run ends and openings and posts the whole row through `/__place`
  `move` after `makePlan` and `walkability` accept it. Held by
  `test/tools.mjs` on both line endings (#584, #632, #639); no assertion in
  `layout`, `plan-vs-scene`, `mystery` or `budget` (#529, #611).
- **Open calls as decided**: edit `data/scene-config.json` through the splice
  (#745), no re-serialise (#584), no undo, `git diff` is the undo, `drums` and
  `gates` stay out of the editor (call 7).
- **Open: the judgement.** Whether the plan reads better is Devon's call on
  `?edit=1&view=plan` (#53). Not fixed: five `interiorProps` rows with
  `backdrop` and one `builtProps` row with `shape` and `ridge` are not in
  `PLACEABLE`, so the prop editor's `move` refuses them.
