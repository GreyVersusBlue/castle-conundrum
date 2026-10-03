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
which is outside the Blender pipeline, #839). 2f and 2g shipped and their
sections are deleted (#830 to #838); 2a shipped (#907) and its section is cut
to what 2b cites and its open look; 2e shipped (#908) and its section is cut
to its pointer and its open look; 13 shipped (#909) and its section is cut
to its pointer. Rank 1, the pipeline, shipped too
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
#816 and #819. Three increments: two class S, the third gated on rank 4's
look.

> **#901:** this row's build is gated on an `architect` re-check of #803's look against the photographic castle the game is heading for (#900); recommended answer, the look stands, since interiors keep the kit (#902).

**Amended by #830 (2026-09-25).** `kitchen-hearth`, `hall-hearth` and
`chapel-altar` are dropped, because 2f, "Blender: Devon's props, placed",
stands Devon's hearth crane, spit, fireplace and altar there. The altar is
in the Chapel Tower's top room, since the chapel floor would put it 0.4 m
from the apprentice's station. `kitchen-worktable`, `kitchen-shelves`,
`hall-trestle`, `hall-high-table`, `cell-pallet` and increment 3 stand, and
a set may move a 2f row to fit, since both are dressing. `cell-door-barred.glb`
in `51735fa` is available to the cell.

**The rooms, measured.** The brief named the kitchen, the great hall, the
chapel, a smithy, stables and a dungeon. `data/scene-config.json` has 43
rooms and no smithy and no stables; #800 found the same ("there is no forge
room", which is why the carter hammers at his cart). The dungeon is the
`cell` in the Prison Tower, the gaol since lore year 9, which today holds
nothing but its 123 drum meshes and is shut. So the kit dresses four rooms
(#814):

| Room | Ward | Extent | What stands in it today |
| --- | --- | --- | --- |
| `kitchen` | outer | x -26..-14, z -14..-6 | two barrels, a crate, a small barrel, the cook's slate |
| `great-hall` | outer | x -34..-6, z 6..14 | nine photographed props (29 draws), a kit dais, seven trusses, seven roofs |
| `chapel` | inner | Chapel Tower, r 2.8 | the body's lantern, candles, pouch, gravestone, bell, three stations |
| `cell` | outer | Prison Tower, r 2.8 | nothing |

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
- **`tools/blender/packs.json`**, six rows, pack `interiors`, each with a
  `why`; `extraColours` at most 8 (linen, straw, ember, each with a `why`):
  - `kitchen-hearth`: a raised hearth, its hood, a spit and a cauldron on a
    chain, about 2.4 m wide, against a wall.
  - `kitchen-worktable`: a board on trestles, a trough, two pots.
  - `kitchen-shelves`: a rack of crocks.
  - `hall-trestle`: a trestle board and two benches, used twice.
  - `hall-high-table`: a board and a bench on the dais, where
    `data/lore.json` seats the Constable and his lady.
  - `hall-hearth`: an open hearth with a stone kerb, mid-hall.
- **`assets/blender/interiors/*.glb`**, six files, and their manifest rows.
- **`data/scene-config.json`, `interiorProps`**: seven rows, each with an
  `id`, spliced (#584, #632). Every set collides (no `noCollide`), so the nav
  rails hold it; `kitchen-shelves` may hang by `yOffset` and `noCollide` if
  it stands above head height.
- **`test/assets.mjs`**, check 8's caps block, one line:
  `interiors: { triangles: 2500, bytes: 96000 }` (#819).

### Scope, increment 2: the chapel and the cell (class S)

- Two rows: `chapel-altar` (a stone altar, a frontal, a cross) and
  `cell-pallet` (a straw pallet, a bucket, a ring and chain on the wall).
  Two files, two `interiorProps` rows.
- **The chapel is the tight one**: three stations, five pressables, a stair
  in its east half. The altar stands where check 1e, check 1b and the nav
  rails all pass with no station moved. If no spot does, the chapel gets no
  altar and `HISTORY.md` records the spots tried.
- **The cell is shut**, so the pallet is seen through the bars; it is a
  low collider a body may step onto (its top is under `STEP_UP`), so
  Madoc's stations stay standable.

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
   unchanged). **The break the builder quotes**: `kitchen-hearth` moved 0.5 m
   into the kitchen's north wall, expecting "kitchen-hearth at x ... is inside
   <that run's label>".
3. **Check 1e** (2a's): no set stands over a pressable. Break: `hall-high-
   table` over `cooks-accounts`' tile.
4. **Checks 1b, 11, 14, unchanged**; `validateMystery` and
   `validatePopulace` with no station moved: a set on a Vespers station fails
   `nav.standable` by name, and the fix is the set's tile, never the
   station (#814).
5. **`test/budget.mjs`, unchanged** (#816): increment 1 adds 7 draws to the
   outer ward, increment 2 one to each ward. The builder writes the printed
   lines before and after in `HISTORY.md`.
6. **`plan-vs-scene.mjs`**, unchanged: one tagged mesh per set, diffed.

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

### Dependencies

- **Gate: rank 1 shipped (#881); 2a shipped (#907)** (check 1e, #811).
- **Lanes F and B.** Not beside any Blender pack, or rank 4.
- **Increment 3 waits on rank 4's look** (#53), which is rank 3's machine
  and sitting.

### Constraints

- #813: no piece covers a face. #815: one mesh per set. #814: no station moves.
- #500: every set is an `interiorProps` plan piece with a `planId`.
- #390, #506, #584, #632. #611, #816: no ceiling moves.
- #529: no rail moves; every one above already exists but check 8's line.
- #13, #34, #147. #53: whether a room reads as its trade is Devon's look.
- #801 to #808, #811 to #816, #819.

### Looking checklist

- [ ] The kitchen from its door: a kitchen, or a room with furniture?
- [ ] The hall at Vespers with the household at the trestles: seated, or
      standing in the benches?
- [ ] Kit sets beside the photographed cabinet: the answer rank 4's "The
      props" line needs for increment 3.
- [ ] The cell through the bars.

---

## Blender: a shared rig with swappable parts

**Rank 2c. Size 2+. Model Opus 5. Where: Local: Blender (increment 1, whose
GPU look is on the same machine); Container (increment 2). Gate: rank 1
shipped (#881). Lanes F and C; not B.** Decided in `HISTORY.md`
as #820 to #825; this section is the `builder` job those decisions leave.
Nothing under `assets/blender/` exists on `86c72fb`. **Rank 10 is retired**
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
- **`data/populace.json`** (lane C, body fields only, #821):
  - **The first wearer is the hen-wife**: `modelPath` to
    `assets/blender/folk/folk.glb`, `parts` e.g. `["skin-old-woman",
    "garment-gown", "over-apron", "hat-wimple"]`, her tint kept,
    `hideNodes` and `hideMaterials` removed. Her ring is untouched: `tend`
    and `wait`, `Idle_Neutral` and `Idle`, both in the file. This is the
    reference #390 needs for `folk.glb`, and it is written only after the
    GPU look below passes.
  - **The carter** gains `heldProp: "assets/blender/held/mallet.glb"` and a
    `heldPropFit`, on his Farmer body; the reference #390 needs for the
    mallet.
  - `bodyComment` says what `parts` is and that the body fields are the body
    rows'.
- **`test/assets.mjs`** check 8 (lane F): caps lines `folk` and `held`
  (Acceptance), the `materials` and `frame` amendments of line 6 (#820),
  and a skinned half for `folk`.
- **`test/mystery.mjs`**: the parts rail, and the silhouette tuple gains
  `parts` sorted.
- **`test/budget.mjs`** section 3: skinned draws, per ward and in total,
  beside skinned bodies, with two new ceilings (#825).
- **`test/plan-vs-scene.mjs`**: one beat, the live seam only.
- **Untouched**: `tools/bodies/` and every file it writes (#807),
  `assets/NPCs/`, `data/npcs.json`'s cast, `src/populace.js`'s
  `ACTIVITY_CLIPS` (the eleven names are the values it already maps to),
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
380` in the ceilings block, with #825 beside them. Increment 1 prints about
373 and 198; increment 2 lowers both ceilings to what it prints. Break:
delete the baker's `hideNodes: ["Sword"]`; expected "381 skinned draws,
over the ceiling of 380".

**`test/plan-vs-scene.mjs`, one beat, the seam and nothing Node can prove**
(#529): for every live body whose def has `parts`, the visible meshes under
it are exactly those names; its `Bare` material's colour is `ffffff`, so the
tint missed it; its `skin-*` node's live box top is its `modelHeight` (1.8
if none) within 0.02 m. **Break, the one increment 1's builder quotes:
delete the hide branch for `parts` in `npc.js`.** Expected: "hen-wife shows
22 meshes; her parts name 4", and the height line goes red with it.

**Held by what exists**: check 1 and check 4 (both files resolve and are
referenced), check 5 (meshopt, `finish.mjs`'s), check 8 lines 1 to 8,
`test/mystery.mjs`'s per-person clip check (every job the hen-wife and,
in increment 2, all sixteen do resolves in `folk.glb`), section 4 of
`test/budget.mjs` pricing the embedded atlas, `test/built.mjs` serving both.

**The GPU look, local, and it gates the wearer** (#807, #53). On Devon's
machine, before `populace.json` is touched: `npm run dev`, a line-up on the
grey background #606 and #643 used, the hen-wife's parts on `folk.glb` at
1.65 m beside the baker on `Woman.glb`, both tinted, both in `Idle`, then
both in `Walk`. One sentence in the increment's `HISTORY.md` entry: does the
2c woman read as the same game as the Quaternius one? **Yes**: the hen-wife
moves in this commit. **No**: nothing under `assets/blender/folk/` is
committed, and the row comes back to `architect` with what read wrong.
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
  and the draw count.

### Constraints

- #807: bodies from Blender only, never from `tools/bodies/`; no file it
  writes is touched; the Quaternius rigs keep every body until the look.
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
- #820 to #825.

---

## Blender: the animals

**Rank 2d. Size 1. Model Opus 5. Where: Local: Blender. Gate: rank 1 shipped (#881)
and after "Blender: a shared rig with swappable parts" increment 1;
recommended after its increment 2. Lanes F and C; not B.** Decided in
`HISTORY.md` as #826 to #829, on #820's and #825's shape. **Rank 10 is
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
  | pig | outer | `outer-ward`, by the hen-wife's patch | 0.8 |
  | sheep | outer | `outer-ward`, beside the cow | 0.9 |
  | goose x2 | outer | `outer-ward`, by the hens | 0.75 |
  | horse | inner | `inner-ward`, by the porter's lodge | 1.65 |
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
   Break, *local*: swap the sheep body's y and z.

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
- **If 2c's look fails and its increment 1 never lands.** Recommend
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

**Rank 2h. Size 2+. Model Opus 5. Where: Local: Blender GPU (5.2, Devon's Windows machine only, #878), plus Local:
net for the first fetch. Gate: none. Lane G.** Devon, 2026-09-26: rebuild
the castle, Mereford and the countryside as a realistic standalone Blender
model with Poly Haven PBR materials, today's layout as the guide, his 71
props re-materialed inside it (#839). Decided in `HISTORY.md` as #839 to
#844, with #845 to #858 since (#851 amends #435 for the model only: a shut
outer gate in `barbican-west`; #853 covers and windows the rooms the game
leaves open to the sky, model only; #854 is Devon's ruling on the ten open
look notes, and adds the hall's louvre, dressed openings and a darker
plaster; #855 corrects 4b from its stills; #856 moves the roof boards to
`wood_planks`; #857 is Mereford's shape in the model, thatch and jetties,
ruled by Devon, built first on a `rough_wood` stand-in; #858 is his picks
on 4b's four open notes and moves the dressing to `stone_pavers`, amending
#854; #860 and #861 are increment 5's look fixes, `medieval_blocks_02`'s
rise, tint and 2.5 m scale and `rough_wood`'s warm dark tint, amending
#854's "leave"; #862 closes increment 5, thatch `reed_roof_04` and the
stone at 2.5 m by Devon's rulings; #863 to #868 decide increment 6, the
props, before anything is built, and #869 closes it; #873 to #877 decide
increment 7, the light and the five cameras, before anything is built, and
#876 amends #844 to eight `check.py` lines); this section is the `builder`
job those decisions leave. Nothing
under `tools/castle3d/` exists on `e05ac72`. **The game loads none of it**:
no file under `src/`, `data/`, `assets/` or `test/` changes in any
increment, `npm test` stays fifteen of fifteen, and the integration row
(rank 2i, shape decided in #900 to #905, spec after increment 9's numbers)
that would change that is not this one (#839).

**The shape, in one line**: Node writes `blueprint.json` from `makePlan`;
Blender 5.2 builds the model from factory startup, one stage module at a
time, snapped to that blueprint and dressed from a hash-pinned Poly Haven
cache; a second Blender opens what was saved and runs `check.py`; the
master `.blend`, the `.glb` and the markers land outside the repo (#840 to
#844).

### Scope, by file

Everything below is new, under `tools/castle3d/` unless it says otherwise.
The layout copies `tools/props/build.py` and `kit.py`: one entry script,
one shared module, one module per stage.

- **`build.mjs`**, `npm run castle3d:build [-- --only stage,stage]`. In
  order: exit non-zero if `CI` is set (#842); find Blender at
  `CASTLE3D_BLENDER`, then `C:\Program Files (x86)\Steam\steamapps\common\
  Blender\blender.exe`, never `BLENDER`; run `--version` and refuse
  anything not starting `Blender 5.2`; resolve the output folder
  (`CASTLE3D_OUT`, default `C:\Users\devon\OneDrive\Documents\Claude Files\
  Blender Projects\Castle\castle3d\`) and refuse one inside the repo root
  (#841); call `export-blueprint.mjs`; call `fetch.mjs`; launch `blender -b
  --factory-startup --python-exit-code 1 --python tools/castle3d/build.py
  -- --out <dir> --blueprint <file> [--only ...]` with `PYTHONHASHSEED=0`;
  launch `blender -b <saved file> --factory-startup --python-exit-code 1
  --python tools/castle3d/check.py -- --blueprint <file>`; exit non-zero if
  either Blender did. `path.join` everywhere and `pathToFileURL` for any
  absolute `import()`: this runs on Windows.
- **`export-blueprint.mjs`**, pure Node, exported as a function and
  runnable alone. Imports `makePlan` from `src/castle-plan.js` and `partsOf`
  from `test/gltf.mjs`, builds `boundsOf` exactly as `test/layout.mjs` line
  69 does, and writes `<out>/blueprint.json` in the game's frame (metres,
  Y-up). It carries what the plan returns and computes no transform of its
  own (#500): `tile`, `storey`, `slab`, `levels`, `spawn`, `curtain`,
  `rooms`, `gates`, `ramps`, `drums`, `grounds`, `pieces` (id, kind,
  level, curtain, material, model, transform, box, drum, disc, pivot,
  evidence, read, bell, roofs) and `colliders`. Two fields are read
  rather than copied: each piece's `noCollide`, true when no collider
  carries its id, and `openRooms`, the `data/mystery.json` rooms marked
  `open` with their `ward`, beside the three gate-arch `x` values that cut
  the ground into them (#843). It prints the counts: 427 pieces, 745
  colliders, 44 rooms, 4 open, 5 gates, 18 ramps, 8 drums on `e05ac72`.
  From increment 3 the piece fields gain `leaf` (`width`, `springline`,
  `archRadius`, `thickness`, on the four gate leaves) and `bars` (`width`,
  `height`, `thickness`, `count`, on `cell-bars`), copied as the plan returns
  them, so `gates.py` draws the game's round-headed leaf and six bars without
  a second copy of `scene-config.json`'s numbers (#500). From increment 7
  (#874, #875) two more fields are read rather than copied: `braziers`,
  `scene-config.json`'s three through the plan's own `tileToWorld`, and
  `cameras`, `cameras.json`'s five with each eye's `stand` (`standAt`) and
  `reachable` (`walkability`); see increment 7's open calls.
- **`cameras.json`**, committed, hand-edited, from increment 7 (#875): the
  five cameras, `{ name, eye, target, lens | fovY, exposure, samples }`,
  `"eye": "spawn"` for `CAM_spawn`.
- **`fetch.mjs`**, Node. For each row of `sources.json` not already in
  `<out>/cache/` with the right hash, downloads it and checks its sha256;
  a mismatch deletes the file and exits non-zero (#840). It also hashes
  the props `.blend` against its row, where it stands; from increment 6
  (#867) that row's `path` resolves against the output folder, and one that
  is absolute or holds a backslash is refused by row id. It is the only
  network use, and Blender never touches the network. From increment 1 a `url` row lands
  at `<out>/cache/<asset>/<file>` (`cachePath`, replacing increment 0's
  flat `<id>__<name>`), creating the folders, so a Poly Haven `.blend`
  finds its `textures/` beside it exactly as the API's `include` lists
  them. It refuses a row whose `asset` or `file` is missing, absolute,
  holds a `..` segment or a backslash, and two rows that resolve to the
  same cache path, each by row id.
- **`sources.json`**, committed, hand-edited: one row per file, `{ id,
  kind: "texture" | "hdri" | "model" | "include" | "blend", asset, file,
  url or path, resolution, licence, sha256, bytes }`. `asset` is the Poly
  Haven slug (`island_tree_01`), the grouping field; `file` is the path
  inside `<out>/cache/<asset>/`, the URL's file name for a texture map, an
  HDRI or a model's `.blend`, and the API's `include` key verbatim
  (`textures/island_tree_01_leaves_diff_1k.png`) for an `include`, which
  is a file only a model's `.blend` reads and no stage opens by name. A
  `path` row (the props `.blend`) carries neither; its `path` is relative to
  the output folder, `../_source/castle_props.blend` (#867). Empty in
  increment 0.
- **`allow.json`**, committed, `{}` in increment 0: every departure from
  the blueprint that `check.py` lines 3 and 6 would otherwise fail, keyed
  `ROOM_<id>`, a piece id, or `model:<file>`, each with a reason.
- **`build.py`**: pins through `common.py`, parses `--only`, runs `guide`
  and then the requested stages in the fixed order below, records the
  stage list in `scene["castle3d_stages"]`, and saves. A full build saves
  `<out>/castle.blend`; an `--only` build saves
  `<out>/partial/<stages>.blend` and never overwrites the master (#841).
  From increment 1 it sets `common.OUT` before the first stage, so a stage
  finds the cache, and after the first save it rewrites every unpacked
  image's `filepath` with `bpy.path.relpath` against the saved file and
  saves again, so the file holds `//cache/...` or `//../cache/...` and
  survives the whole output folder moving.
- **`common.py`**: the pin (`bpy.app.version[:2] != (5, 2)` exits 3, #840);
  the empty scene; metric units at scale 1; `to_blender((x, y, z))` returns
  `(x, -z, y)` and the rotation rule (game `rotationY` is Blender Z, same
  sign, #843); one collection per stage plus `GUIDE` and `MARKERS`;
  `seed(stage)`; `STAGE_OF`, the table that gives every blueprint piece to
  exactly one stage by kind and id prefix, which `--only guide` prints; the
  material library (below).
- **`materials.py`**: node materials from the cached maps, box-projected on
  object or world coordinates so a wall of any length tiles with no UV work.
  A missing map raises; it never falls back to a flat colour. Increment 1
  writes it with the mud, grass and cobble materials and
  `world_from_hdri(row)`, which `terrain.py` calls (#846). Every map is
  found through `common.cached(row)`, `os.path.join(OUT, 'cache',
  row['asset'], *row['file'].split('/'))`, which is `fetch.mjs`'s
  `cachePath` in one line; if the two drift, the map is not a file and
  materials.py raises naming it. From increment 3, `ALIAS = {'iron':
  'rusty_metal', 'oak': 'wooden_gate'}` maps a blueprint slug with no set of
  its own onto one in `LIBRARY`, which gains `wooden_gate` (1.9 m) and
  `rusty_metal` (1.5 m); see the open calls. From increment 4, `LIBRARY`
  gains `old_planks_02` (2.0 m), `rock_tile_floor` (1.96), `floor_tiles_02`
  (4.0), `dirty_carpet` (0.6) and `rough_wood` (0.5); `PLAIN` gains the two
  tile floors and `SWAP_RISE` the carpet and `rough_wood`; `ALIAS` is
  unchanged. See the increment 4 open calls. From 4b (#854), `LOOK` gives
  `plastered_wall_04` a tint, a warm multiply, a grime noise and an
  undulation bump inside `library()`, and `dressing()` builds
  `MAT_medieval_blocks_02_dressing`, the dressed stone darkened to the
  rubble's albedo; `LIBRARY` gains nothing and nothing is fetched. See
  increment 4b's open calls. From increment 5 (#857), `THATCH_SET` names the
  thatch's set, size, rise and look in one tuple and `thatch()` builds it,
  first a stand-in from `rough_wood`; `DRESSING` moves
  to `stone_pavers` at Value 1.2 (#858, amending #854); `LIBRARY` and
  `SWAP_RISE` gain nothing; and `LOOK`'s `plastered_wall_04` gains
  `object_tint`, a multiply by the object's colour, white on every object
  but the six houses; `terrain.append_model` gains a memo so the town's trees
  reuse the terrain's template. See increment 5's open calls. From
  increment 5's look fixes (#860, #861), `LOOK` gains `medieval_blocks_02`
  (a tint) and `rough_wood` (a tint, a warm and a `rough_min`, which
  `box_material` gains and passes to `_maps`), and `SWAP_RISE` gains
  `medieval_blocks_02` at 0.5; both reach the castle as well as the town.
  See "Increment 5's look fixes". **Increment 5 closes (#862)**: the thatch
  is `reed_roof_04`, `THATCH_SET = ('reed_roof_04', 2.5, 0.0, {})`, and the
  stand-in is retired; `LIBRARY['medieval_blocks_02']` is 2.5 m, #860's
  named fallback, taken on Devon's yes. From increment 6 (#863, #865),
  `ALIAS` gains `slate`, `parchment` and `wool`, and `PROP_KINDS` and
  `prop_material(kind)` build the five PBR kinds Devon's props take, tinted
  per face by an `atlas_rgb` attribute and box-projected on object
  coordinates (`box_material` gains `atlas_detail`, `coords` and
  `metallic`); nothing already built changes. See increment 6's open calls.
  From increment 7 (#873, #874), `world_from_hdri` gains `clamp` and moves
  from `terrain.py`'s call to `lighting.py`'s, and `flame_material()` builds
  `MAT_flame`, the atlas as emission for `props.py`'s flame faces. See
  increment 7's open calls.
- **The stage modules**, one per increment 1 to 8: `blueprint.py` (the
  `GUIDE` collection, increment 0), `terrain.py`, `walls.py`, `towers.py`,
  `gates.py`, `buildings.py`, `town.py`, `props.py`, `lighting.py`,
  `markers.py`, and `export.py` (increment 9).
- **`check.py`**: #844's six lines, each printing a line of its own, pass
  or fail and why, and exiting non-zero when any failed. From increment 7,
  eight (#876): line 7 `light` and line 8 `cameras`, both run when
  `lighting` did.
- **`README.md`**: how to run it, the two env vars, the output folder, what
  each stage builds. **`CREDITS.md`**: every `sources.json` `asset` by
  name, author and licence, one line per asset rather than per file,
  regenerated by hand in the commit that adds a row.
- **Root files**: `package.json` gains `"castle3d:build": "node
  tools/castle3d/build.mjs"`. `.gitignore` gains one line, `__pycache__/`
  (Devon, 2026-09-27), because Blender's Python compiles each stage module
  it imports into `tools/castle3d/__pycache__/` on every build (#852);
  `shots/` already covers `shots/castle3d/`. `CLAUDE.md`'s npm table and `README.md`'s credits line
  are the lead's one-liners. blender-mcp's config is the lead's (class F);
  see the open calls.
- **Untouched**: `src/`, `data/`, `assets/` (and so `assets/props/`),
  `test/`, `tools/props/`, `tools/blender/`, `src/save.js` (no version
  bump), every ceiling in `test/budget.mjs`.

### Scope, by increment (class S each, one per sitting)

The stage order is fixed, and a stage may read what an earlier one built.
Each increment ends with a Cycles still from its stage's review camera into
`shots/castle3d/<stage>.png`, sent to Devon, and his one-line answer
recorded in `HISTORY.md` against the increment (#53).

0. **Tooling and the blueprint.** `build.mjs`, `export-blueprint.mjs`,
   `fetch.mjs` (with an empty `sources.json`), `build.py`, `common.py`,
   `blueprint.py`, `check.py` with every line's frame and line 4 live,
   `README.md`, `CREDITS.md`, `allow.json`, the npm script. `GUIDE` holds a
   wireframe box per blueprint piece and ramp, a box or 32-sided cylinder
   per room, and one flat box per open room over its gate band.
1. **Terrain and surroundings.** `fetch.mjs`'s first real rows, after Devon
   has seen the list with sizes and said yes (he did on 2026-09-27: three
   2k texture sets, two trees at 1k (#845), two rocks and a grass model at
   2k, and the HDRI at 4k, about 249 MB), with the cache layout and row
   shape in the open calls below. The World lit from the HDRI (#846). A
   displaced height field 400
   m square, centred on the pieces' span (x -81, z 0, so x -281 to 119 and
   z -200 to 200), exactly 0 over the pieces' footprint plus 10 m; the road
   to the west gate at x -36; trees and rocks from Poly Haven models; grass
   by a seeded Geometry Nodes scatter. Mud, grass and cobble materials.
2. **Curtain walls and towers.** The 18 curtain runs and the cross-wall
   with batter, a wall walk at 8 m, crenellations and arrow slits, the 8
   drums at the blueprint's centres and radii with conical or flat roofs,
   their floors at 0, 4, 8 and 12 m, and the 18 flights on the blueprint's
   ramps. Rock and ashlar materials, the blueprint's own slugs (#849). The
   61 kit merlons are realised by
   each run's crenellation, which carries their ids in `planIds`.
3. **Gatehouses.** `gates.py` builds the stage's nine pieces (4
   `gate-leaf`, 3 `gate-arch`, `cell-bars`, `walk-bar`) and #851's outer
   gate. `ARCH_<gate id>` (`planId` `<gate id>-arch`) for the west, east and
   porter gates: jambs and a lintel from the arch's three colliders, a
   round head matching the game's leaf, battered outer faces on the west
   and east gates, in the stone of the wall each stands in. `LEAF_<id>`
   (`planId` `<id>`) for `west-gate`, `east-gate`, `porter-gate` and
   `muniment`: planks, two ledges and iron straps in the plan's leaf
   outline, parented to a `GATE_<id>_HINGE` empty at the blueprint's
   `pivot` in `MARKERS`, which increment 8 adopts. `PORT_west-gate`, raised,
   no `planId`. `BARS_cell-bars` and `BAR_walk-bar`. Then #851: `walls.py`
   cuts the 4 m block out of `WALL_barbican-west`, and `gates.py` builds
   `ARCH_barbican-outer`, two shut `LEAF_barbican-outer-a`/`-b` and a
   lowered `PORT_barbican-outer`, none with a `planId`. Textures (Devon,
   2026-09-27): `wooden_gate` and `rusty_metal`, 2k jpg, five maps each, 10
   `sources.json` rows, 15.9 MB (15,887,307 bytes), already fetched on this
   branch; `oak` and `iron` reach them through `materials.ALIAS`.
   `export-blueprint.mjs` gains `leaf` and `bars`. The tiling break-up in
   `materials.py` that Devon made required on `walls.png` (#850) is this
   increment's too, as its own edit, and lands first. Every number the
   builder needs is in the increment 3 open calls below.
4. **Inner buildings with interiors**, two sittings, 4a and 4b, every
   number in the increment 4 open calls below. `STAGE_OF` gives the stage
   40 pieces on `b3f2034`: 11 room runs, `masons-lodge-roof` (a 0.3 m plank
   deck), `column-61` and `column-damaged-62`, 7 `hall-truss`, 7
   `hall-roof`, 3 upper floors and 9 ground floors. **4a** builds all 40:
   the runs as their colliders clipped to their boxes, as `walls.build_run`
   does, so every door the plan cuts is an opening; the floors, less every
   drum's disc; the columns; one `TRUSS_hall-truss-<n>` per truss, so the
   trusses stay trusses (#528); `ROOF_great-hall`, carrying the seven
   `hall-roof` ids in `planIds`; and in the hall, #853's five windows,
   gables and corbels. It adds five texture sets, 25 `sources.json` rows,
   50.8 MB, once Devon has said yes to the list. **4b** is #853 for the
   other rooms: flat roofs over the Clerk's chamber, the dormitory, the
   royal apartments and the chapel nave, a lean-to over the Steward's
   chamber, beams under every upper floor and flat roof, five windows, and
   plaster in the three upper rooms; and, from Devon's rulings of
   2026-09-28 (#854), a ridge louvre on the hall's roof, dressed stone round
   every opening in a rubble run and through the three rubble gate arches'
   passages, and `plastered_wall_04` darkened, warmed and broken up, which
   reaches the two gate-overs too. *Corrected 2026-09-27*: this line said
   "the castle's 21 non-curtain runs", which is the plan's 33 `curtain:
   false` wall pieces less increment 5's twelve: it counted the 4 town-wall
   runs (`town`'s), the 2 cross-wall runs and `porter-gate-over` (`walls`',
   built in increment 2), and this stage's 14 wall pieces, of which 11 are
   runs. The runs' thickness is the plan's 1 m already, and a window's
   reveal is that 1 m, straight, as the plan's one window has it. *Amended
   2026-09-28 (#854)*: still straight and still 1 m, and in a rubble run
   dressed, by material slot, in the plan's dressed stone; the shape does not
   change, the look does.
5. **Mereford.** The 29 `mereford-*` pieces (9 runs, 20 decor) and Wykes's
   yard's 3 runs, shed and ground: the town wall, the church, and
   timber-framed houses from a parametric generator seeded by
   `seed("town")` and each house's index. Roof slate or thatch.
   *Corrected 2026-09-28*: `STAGE_OF` gives the stage 43 pieces on
   `8a90b88`: the 29 `mereford-*` (9 `wall`, of which 8 are buildings and one
   is the churchyard cross, and 20 `decor`), the 4 town-wall runs, the 4
   `town-tree-*`, and Wykes's 2 runs, shed deck, 2 shed pitches and yard
   floor. Every roof is thatch (#857, the lore's one slate roof is the
   toll-house), and each house draws from `random.Random("town:<id>")`.
   Every number the builder needs is in the increment 5 open calls below.
   Devon's yes to #857 is given; the dressed stone round every opening
   moves to `stone_pavers` (#858). **Increment 5 closed (#862)**: the
   thatch, built first on a `rough_wood` stand-in, is `reed_roof_04` at
   2.5 m, and `medieval_blocks_02` (the town wall, the church, the houses'
   plinths and chimneys, and the castle faces the same slug reaches) is
   2.5 m too, rise 0.5 and tinted (#860, #861).
6. **Props.** The 71 files' meshes appended from the pinned
   `castle_props.blend` by object name (`libraries.load`, #840) and
   re-materialed; each of the 75 rows that name one is placed by its
   blueprint `transform` as `PROP_<piece id>` with `noCollide` (#843). The
   12 Poly Haven `interiorProps` come from Poly Haven's own models, the 21
   `builtProps` are generated slabs with PBR materials, and the kit decor
   follows the open call below. The 14 files in `castle_props.blend` that
   the game does not place stay out, for #833's reasons.
   *Corrected 2026-09-28 (#863)*: appended by collection name, the file's
   stem, not by object name, since each file is a collection whose root
   empty carries the stem and whose mesh does not; 20 `builtProps`, not 21
   (`walk-bar` is `gates`'); the kit decor is generated, all 80 (#866); so
   the stage is 187 pieces, 75 Devon, 12 Poly Haven at 1k (#864), 20 built
   and 80 kit. It also closes #858 (a) and the lodge's and Wykes's shed's
   floating decks (#868). Every number the builder needs is in increment 6's
   open calls.
7. **Lighting and cameras.** The HDRI, whose World `terrain.py` has set
   since increment 1 and whose `world_from_hdri` call moves here, and a
   sun; the three braziers and
   the candles as practicals; five cameras, `CAM_spawn` (on `SPAWN`, at
   eye height), `CAM_courtyard`, `CAM_hall`, `CAM_chapel` and `CAM_town`,
   each standing where a player can stand in the game.
   *Corrected 2026-09-28 (#873 to #877)*: "the three braziers" are
   `scene-config.json`'s, which the blueprint did not carry and which the
   model builds from Devon's `brazier`; the practicals are a light wherever
   the model draws a flame, 37 on the through build (30 candle, 2 torch, 4
   brazier, 1 hearth), found by a rule; `CAM_town` stands on the North-west
   Tower's roof, since no player stands in Mereford (`layout.mjs` 4c); and
   `check.py` gains lines 7 and 8. Every number the builder needs is in
   increment 7's open calls.
8. **Markers.** `markers.py` writes every marker in #843 from the
   blueprint into `MARKERS`, then a session adjusts them to the new
   geometry, each departure past 0.5 m with an `allow.json` reason.
9. **Export.** `export.py` writes `castle.blend`, `castle.glb` (Draco off,
   textures embedded, `MARKERS` and `GUIDE` excluded) and `markers.json`
   in the game's frame and the blueprint's shape, plus a Cycles still from
   each of the five cameras.

### Acceptance

**Every increment: `npm test` fifteen of fifteen, unchanged, and
`npm run castle3d:build` exits 0 on Devon's machine with every `check.py`
line that ran passing.** No suite holds this row (#842); each line below
is held by `check.py` or the launcher, and each has the break that must
turn it red from green (#34). The report quotes the failing line.

- **Increment 0.** `--only guide` exits 0 and `partial/guide.blend`'s
  `GUIDE` holds 427 piece boxes, 18 ramp boxes, 44 room volumes and 4
  open-room boxes; `blueprint.json` prints the counts above. Breaks, all
  from green: `CI=1` exits non-zero before Blender starts; a `raise` in
  `blueprint.py` exits non-zero, which is `--python-exit-code 1`, and the
  report also says what the same raise exits with the flag removed (0,
  #805's reason); `CASTLE3D_BLENDER` at a Blender that is not 5.2, or at any
  exe whose `--version` says otherwise, is refused by name;
  `CASTLE3D_OUT` set to the repo's `assets/` is refused; line 4 fails,
  naming the image, on a material whose Image Texture node points at a
  path that does not exist.
- **Increment 1.** Lines 4 and 5 pass on a build of `terrain`. Break for
  line 5: lift the flattened pad by 0.1 m; it names the first room whose
  corner it lifted. `fetch.mjs` refuses a cached file edited by one byte
  (`sources.json`'s hash, #840). Break for the layout: drop `textures/`
  from one `include` row's `file` of `island_tree_01`, from a cache
  without that file; the fetch still passes, its hash unchanged, and line
  4 names the tree's image and the path it looked for. Line 4 also passes
  with `castle.blend`'s folder copied whole to another path, and the
  report quotes one image's saved `filepath` to show it is `//`-relative.
- **Increments 2 to 6.** Line 6 passes for each stage's kinds, and names
  any piece nothing realises. Break, per increment: delete one object that
  carries a `planId` (increment 2, one drum; 6, `PROP_nave-pulpit`, the
  pulpit's piece id, corrected from `PROP_pulpit` by #863); line 6 names the
  missing id. An `allow.json` entry with no reason fails line 6.
  Increment 6 also refuses a props `.blend` whose hash is not its
  `sources.json` row.
- **Increment 3, in full.** `--only walls,towers,gates` and `--only gates`
  both exit 0 with line 6 passing: 9 pieces of `gates`, and on the first
  build every walls and towers piece too, `barbican-west` included. Breaks,
  each from green and each quoted: delete `LEAF_west-gate` (line 6 names
  `west-gate`; this is a valid break only because `GATE_west-gate_HINGE`
  carries no `planId`, so say so); delete `ARCH_porter-gate` (line 6 names
  `porter-gate-arch`); an `allow.json` entry `{"walk-bar": ""}` (line 6
  fails on the empty reason); pose `GATE_west-gate_HINGE` at the gate's
  `shutAngle` (90) instead of `pivot.rotationY` (180) (the build raises,
  naming `west-gate` and its box's worst face in metres); shift
  `walls.OUTER_GATE`'s block 1 m in z (the build raises, naming
  `outside-road`). Deleting `PORT_west-gate` leaves line 6 green by design,
  and the report says so in one line: a portcullis realises no plan piece,
  and it is held by the still and the checklist, as the arrow slits are.
  Two stills, `shots/castle3d/gates.png` from the spawn looking east at the
  west gate and `gates-outer.png` from the road at game (-60, 1.7, 3)
  looking at (-44, 2, 0), with Devon's line on each recorded in
  `HISTORY.md`.
- **Increment 4a, in full.** `npm run castle3d:build -- --only
  terrain,walls,towers,gates,buildings` and `--only buildings` both exit 0
  with every line that ran passing: lines 4, 5 and 6 on the first, whose
  line 6 counts 197 pieces (5 terrain, 97 walls, 46 towers, 9 gates, 40
  buildings), and lines 4 and 6 on the second, 40 pieces. `buildings.py`
  reads the blueprint and never another stage's objects, which is what lets
  `--only buildings` build alone. Breaks, each from green and each quoted:
  delete `TRUSS_hall-truss-4` (line 6 names `hall-truss-4`); delete
  `ROOF_great-hall` (line 6 names `hall-roof-1` to `hall-roof-7`, all seven,
  inside the message's cap of twelve); an `allow.json` entry
  `{"hall-truss-1": ""}` (line 6 fails on the empty reason); lower
  `TRUSS_hall-truss-2`'s tie beam to start at y 7.9 (the build raises,
  naming `hall-truss-2` and its min y face, 0.1 m off); add `'kings-hall-south':
  [10]` to `WINDOWS` (the build raises, naming `royal-tapestry`). Deleting
  `CORBELS_great-hall` leaves line 6 green by design, and the report says so
  in one line: an #853 object realises no plan piece, and the still holds
  it. The report quotes `ROOF_great-hall`'s `planIds`. Two stills,
  `shots/castle3d/buildings.png` and `buildings-hall.png`, with Devon's line
  on each recorded in `HISTORY.md`.
- **Increment 4b, in full.** `npm test` fifteen of fifteen, unchanged. Both
  builds above exit 0 again, lines 4, 5 and 6 passing on the first and 4
  and 6 on the second, line 6 unchanged at 197 and 40, since 4b adds no
  `planId`. The report quotes: the dressed openings per run (12 in 3 runs:
  `clerk-office-south` 2, `kitchen-south` 3, `great-hall-north` 7) and the
  faces painted in each; the passage faces painted in `ARCH_west-gate`,
  `ARCH_east-gate` and `ARCH_barbican-outer`, and none in
  `ARCH_porter-gate`; `MAT_plastered_wall_04`'s `LOOK` values; and
  `LOUVRE_great-hall`'s print line (bay, hole, foot y, head y, cap ridge y);
  from #855, `ROOF_steward-chamber`'s pitch (0.449) and eave (z 5.2, underside
  3.865, top 4.045), `PLATE_steward-chamber`, and the four
  `DOOR_` leaves by name (`prison-tower-1`, `-2`, `sw-tower-1`, `-2`) with
  the 13 doors the rule passed over.
  Breaks, each from green and each quoted: move the King's hall beams to x
  6, 10, 14 and 18 (the build raises, naming `kings-hall-chandelier`, whose
  top at 3.73 m is inside the beam at x 14); an `allow.json` entry
  `{"kings-hall-south": ""}` (line 6 fails on the empty reason); delete
  `ROOF_dormitory` (line 6 stays green by design, and the report says so in
  one line: an #853 object realises no plan piece, and the still holds it);
  `LOUVRE_X = -12` (the build raises, naming `hall-truss-6`, whose box the
  hole grown by 0.1 m meets); `DRESS = 1.3` (the build raises, naming the
  first rubble run it dresses and a door and the window over or beside it,
  whose grown boxes overlap from y 3.7 to 3.8). Four stills, with Devon's
  line on each recorded in `HISTORY.md`: `buildings-dormitory.png`,
  `buildings.png` and `buildings-hall.png` again from 4a's two cameras, and
  `gates-dressed.png`; see increment 4b's open calls. From #855: deleting
  `DOOR_prison-tower-2` or `PLATE_steward-chamber` leaves line 6 green by
  design, and the report says so in one line; the two interiors at 1024
  samples and the two exteriors at 128, each with its Film exposure; and
  Devon's line on the lean-to and the hall's drum doors recorded.
  From #856: every board surface `buildings.py` takes from `ROOF_BOARDS`
  is `MAT_wood_planks` (the hall roof's slot 1 and gables, the louvre's
  slats, end boards and cap boards, the lean-to's slot 1), and
  `DECK_masons-lodge-roof` and the five `old_planks_02` ground floors still
  carry `MAT_old_planks_02`; the report quotes each object's slot list,
  and `buildings-hall-4b.png` is re-rendered at 1024 samples for Devon.
- **Increment 5, in full.** `npm test` fifteen of fifteen, unchanged.
  `npm run castle3d:build -- --only terrain,walls,towers,gates,buildings,town`
  exits 0 with lines 4, 5 and 6 passing, line 5 unchanged at 18 level-0
  rooms and 90 points and line 6 at 240 pieces (5 terrain, 97 walls, 46
  towers, 9 gates, 40 buildings, 43 town); `--only town` exits 0 with lines
  4 and 6 passing, line 6 at 43 and line 5 not run. The report quotes: the
  six house lines, which equal the increment 5 table, from two `--only town`
  builds; each roof's pitch, eaves, verges and ridge top; the leaves' x
  spans; each tree's height and nearest margin; `WALL_west-gate-over`'s
  `color`, `(1, 1, 1, 1)`; the line 4 counts. The eight breaks in increment
  5's open calls, each from green, each quoted. Four stills, `town.png`,
  `town-gate.png`, `town-street.png` and `town-church.png`, each with its
  exposure, and Devon's line on each recorded in `HISTORY.md`. **The look
  fixes (#860, #861)**, before increment 5 closes: the same two builds exit
  0 with line 5 and line 6 unchanged, and line 4's image and texture node
  counts unchanged (#860 moves an existing node, not a new one); the six
  house lines unchanged; break (11) red and restored; the six stills in
  "Increment 5's look fixes", each with its exposure.
- **Increment 6, in full.** `npm test` fifteen of fifteen, unchanged.
  Before `props.py` exists, `--only terrain,walls,towers,gates,buildings,town`
  still prints line 4 at 212 and 132, line 5 at 18 and 90 and line 6 at 240,
  after the `materials.py`, `terrain.py`, `town.py`, `common.py` and
  `fetch.mjs` edits. Then `npm run castle3d:build -- --only
  terrain,walls,towers,gates,buildings,town,props` exits 0 with lines 4, 5 and
  6 passing, line 5 unchanged at 18 level-0 rooms and 90 points and line 6 at
  427 pieces; `--only props` exits 0 with lines 4 and 6 passing, line 6 at
  187 and line 5 not run; the fetch prints `203 sources`. Line 4's counts on
  both builds are measured and recorded, not predicted (#860): the report
  quotes both and the stage's printed split, and they are written into this
  line and `HISTORY.md`. *Measured 2026-09-28*: the through build `ok line 4
  images: 310 image texture nodes, 189 images` (the stage's share 98 and 57:
  the nine Poly Haven assets 57/57, the atlas 2/1, `MAT_*_prop` and `_brass`
  40/0); `--only props` 188 and 122 (Poly Haven 57/57, atlas 2/1, `library()`
  sets 80/45, `MAT_*_prop` and `_brass` 40/10, the tree template 10/10).
  The report also quotes the count by group (80, 12,
  75, 20); the faces per kind (2,572 wood, 545 stone, 2,096 iron, 1,632
  brass, 697 straw, 4,341 kept); the atlas check's difference; the five
  pushes on four props; each Poly Haven asset's objects kept and deleted;
  the worst `check_tree` and `check_box` differences. The eleven breaks in
  increment 6's open calls, each from green, each quoted. Five stills, each
  with its exposure, and Devon's line on each recorded in `HISTORY.md`.
- **Increment 7.** Five stills exist, one per camera, and line 4 passes
  with the HDRI in the scene. *In full (#873 to #877)*: `npm test` fifteen
  of fifteen, unchanged. After the `props.py` and `materials.py` edits and
  before `lighting.py` exists, `--only terrain,walls,towers,gates,buildings,
  town,props` exits 0 with line 5 at 18 and 90 and line 6 at 427, and line
  4 quoted (310 and 189 plus `MAT_flame`'s printed share, terrain's call
  still in place); the faces per kind print `flame 149, kept 4192` (per
  mesh; 172 flame faces are placed, see *Measured* below). Then `--only
  terrain,walls,towers,gates,buildings,town,props,lighting` exits 0 with lines 4 to 8 passing, line 5 and 6 unchanged, line
  7 at 37 practicals (30 candle, 2 torch, 4 brazier, 1 hearth) and 3
  braziers, line 8 at 5 cameras; `--only lighting` exits 0 with lines 4, 7
  and 8 passing, line 7 at 3 practicals, 5 and 6 not run. `blueprint.json`
  prints `3 braziers, 5 cameras, 5 standing`. Line 4 on both builds is
  measured and recorded with the stages' printed shares, not predicted.
  *Measured 2026-09-29*: before `lighting.py`, terrain's call in place, the
  through build to `props` `ok line 4 images: 311 image texture nodes, 189
  images` (the stage's share 99 and 57: #869's 98 and 57 plus `MAT_flame`
  1/0); after the move, the same build 310 and 188, one node and one image
  lower; through to `lighting` 311 and 189 (`lighting`'s share 1/1, the
  World; the braziers' append reuses `castle_props`, its atlas and the kind
  materials); `--only lighting` 43 and 22 (`WORLD_hdri` 1/1, brazier atlas
  1/1, `MAT_flame` 1/0, `MAT_*_prop` and `_brass` 40/20). The faces per kind
  print `flame 149, kept 4192`, not 172 and 4,169: the two King's hall
  sconces share one mesh, and the stage counts each mesh once, so the
  sconce's 23 flame faces were counted twice in the 172. The 172 stays
  right as faces placed in the scene, which is what #874 says take
  `MAT_flame`. **A plain `npm run castle3d:build` exits 1 in increment 7 by
  design**: `build.py` imports a module per stage and `markers.py` is
  increment 8's, so it stops at `markers` and saves no master; the through
  build is `--only terrain,walls,towers,gates,buildings,town,props,lighting`
  and the master `castle.blend` is first written in increment 8. The
  report quotes line 7's sun angle and energy, each brazier's overlaps, and
  the twelve breaks in increment 7's open calls ((6) is two), each from
  green. Five
  stills from the `CAM_` objects, each with its exposure inside the bands,
  and Devon's line on each recorded in `HISTORY.md`.
- **Increment 8.** Lines 1, 2 and 3 pass: 48 `ROOM_`, 5 `GATE_` and 4
  hinges, 745 `COL_`, 18 `STAIR_`, one `SPAWN`, 11 `EVID_`, 13 `READ_`, one
  `BELL_`. Breaks: delete `ROOM_kitchen` (line 1 names it); delete
  `GATE_west-gate_HINGE` (line 2); move `ROOM_kitchen` 0.6 m (line 3); add
  an `allow.json` entry for a room that is within 0.5 m (line 3, stale).
  The report quotes line 3's message.
- **Increment 9.** A full build writes `castle.blend`, `castle.glb` and
  `markers.json`, and `npx gltf-transform inspect castle.glb`'s size,
  triangle count and texture memory are written into `HISTORY.md`. Those
  are the numbers the integration row (2i) argues from (#611, #904).

**The look, local** (#53): one sentence from Devon per still, recorded,
blocking nothing in `npm test`. Does it read as the same castle the game
walks, in daylight, at the five places the game's own player stands?

### Open calls

- **Where the download runs.** Recommend **Node (`fetch.mjs`), before
  Blender starts**: a bad or partial download fails in seconds rather than
  ten minutes into a build, and the hash check has one home.
- **The terrain's size and centre.** Recommend **400 m square on x -81, z
  0**: it keeps 83 m of country past both the town's west end at -198 and
  the east curtain at 36, and the plan's span sets it, not a guess.
- **The river and a moat.** Recommend **neither in this row until rank 9's
  3b ships**: the river's course is rank 9's layout decision (#795 to
  #798), and since 3b landed (#870 to #872) the terrain stage reads its piece out of the
  blueprint like any other. The road to the west gate is in.
- **UVs or projection on built stone.** Recommend **box projection with a
  0.2 blend on world coordinates for walls, floors and ground, and the
  meshes' own UVs for props**: generated walls have no authored UVs, and
  world coordinates keep the texel density equal across runs of any length.
- **Texture resolution.** Recommend **2k**, as the plan says: 4k quadruples
  the cache for a model reviewed in stills at 1920 x 1080. Two departures
  from Devon's list of 2026-09-27: the trees at 1k (#845), where
  `island_tree_01` is 80.0 MB with its includes against 138.0 MB at 2k
  (the `.blend` is 58.1 MB at both; only the textures grow), and
  the HDRI at 4k, since an equirectangular 2k is 512 px across a 90 degree
  camera and the sky is in every still.
- **How a Poly Haven model and its includes land in the cache.** The API's
  `blend` entry for a model is one `.blend` (58.1 MB for
  `island_tree_01` at 1k, 5.4 MB for `boulder_01`) and an `include` map of
  files at `textures/<name>`, in mixed formats: the tree's 1k `.blend`
  reads 7 PNGs, 1 JPG and 2 EXRs, the boulder's 1 JPG and 2 EXRs. A
  texture set (`sparse_grass`) and the HDRI
  (`kloofendal_48d_partly_cloudy_puresky`, 20.7 MB `.hdr` at 4k) have no
  includes. Increment 0's flat `<id>__<name>` cache breaks every one of
  those relative paths. Recommend **one row per file, laid out at
  `<out>/cache/<asset>/<file>` with `file` copied verbatim from the API's
  `include` key, the model appended whole and each appended image's path
  made absolute against the model's folder, and every image path made
  `//`-relative when `build.py` saves**: the layout is the one Poly Haven
  authored, so no per-model rebinding table exists to go stale, and each
  file keeps its own sha256 (#840) where a zip or a nested include list
  would put several files behind one hash. The parts, so `builder` has
  nothing left to decide:
  - **Rows.** `kind: "model"` for the `.blend`, `"include"` for each
    `include` entry, `"texture"` per map of a set, `"hdri"`; every row of
    one asset shares `asset` and `resolution`. Copy the `include` URLs from
    the same resolution's `blend` entry, not the `Diffuse` or `nor_gl` URL
    of the same map: the `.blend` reads the EXR normal, not the JPG, and a
    JPG row would hash fine and leave line 4 red. Ids are free-form and
    unique; `<asset>:<map>` reads well (`island_tree_01:blend`,
    `island_tree_01:leaves_alpha`).
  - **The sha256.** The API gives `md5` and `size`, not sha256. Download
    each file once into the session's scratch folder, refuse it unless its
    size and md5 equal the API listing's (that is the evidence the bytes
    are Poly Haven's), then write its sha256 and `bytes` into the row by
    hand. The helper that does this stays in scratch and is not
    committed; `fetch.mjs` gains no pin mode, since nothing in this family
    writes a repo file (#632 below). No `md5` field in the row: one hash
    per file.
  - **Appending.** `bpy.data.libraries.load(cached(model_row), link=False)`
    taking every object, then deleting what is not a mesh and raising if
    none is left. Appending all rather than by name needs no object name
    in `sources.json`, and the names cannot drift anyway: a different
    `.blend` under the URL fails its hash before Blender opens. Right after
    the load, every newly appended image whose `filepath` starts `//` is
    set to `os.path.join(<model folder>, rest)`, because Blender resolves
    an appended relative path against the main file, and the build's main
    file is unsaved until the end. Print one image's path after the load in
    the increment's report.
  - **Saving.** Not packed: packing puts 249 MB into every `.blend` the
    build writes. After the first save `build.py` sets each unpacked
    image's `filepath` to `bpy.path.relpath(abs)` and saves again, so the
    master holds `//cache/...` and a partial `//../cache/...`. `check.py`
    line 4 resolves either through `bpy.path.abspath` in the second
    Blender. A `.blend` moved without its `cache/` fails line 4, named,
    which is the right answer. `relpath` raises across drives on Windows;
    the cache lives inside the output folder, so it cannot.
- **Where the World is set before increment 7.** Recommend **`terrain.py`
  calls `materials.world_from_hdri(row)` (an Environment Texture on the
  HDRI row, strength 1, no sun) in increment 1, and increment 7 moves the
  call to `lighting.py` and adds the sun**: the HDRI is fetched in 1
  (#846), increment 1's still needs daylight to judge mud against grass,
  and line 4 then checks the Environment Texture six increments earlier.
- **Where the ground materials live.** Recommend **`materials.py`, from
  increment 1**: mud, grass and cobble are box-projected library
  materials like every later stone, and a second home in `terrain.py`
  would be the first thing increment 2 has to move.
- **The kit decor (120 pieces that are not merlons).** Recommend **a Poly
  Haven model where a CC0 equivalent exists (barrels, crates, trees),
  generated otherwise (poles, ladders, steps), and the 14 kit roof pieces
  over the hall realised by its roof through `planIds`**: every one stays
  covered by line 6 without an allow-list line per crate.
- **How the props are re-materialed.** Recommend **per face, by the atlas
  region under the face's UV centroid, through a committed table keyed on
  `tools/props/atlas.py`'s region names** (wood, iron, cloth, stone and the
  rest): the atlas already names its regions, so the table is data rather
  than a colour-matching guess.
- **Where the markers go on export.** Recommend **`markers.json` in the
  game's frame, and nothing in `castle.glb`**: a marker mesh in the glb is
  something a renderer draws, and a JSON in the blueprint's shape can be
  diffed against `makePlan` in Node by the integration row, at 0.5 m with
  each exception an `allow.json` entry; the game never reads it (#900).
- **blender-mcp's config.** Recommend **local scope (`claude mcp add
  --scope local`), not a committed `.mcp.json`**: the server's path is
  `C:\Users\devon\.blender-mcp\...`, and a committed absolute Windows path
  fails in every other session that opens this repo. The lead shows Devon
  the exact command before running it.
- **Stills.** Recommend **Cycles, 1920 x 1080, 128 samples with the
  denoiser**: enough to judge material and light, and a minute or two per
  still rather than ten.
- **An open room's marker.** Recommend **a box over its gate band, clipped
  to the curtain's x and z, floor to 4 m**: the game has no box for these 4 and finds
  them by x alone (`stations.js` line 207), so the band is the only shape
  there is to match.

**Increment 3's open calls** (architect, 2026-09-27, against `ef5c1bc`
plus this branch; the lead's recommendations, with three departures marked).
Every number is in the game's frame. All five arches run their passage along
x, so "across" is z.

- **The arch's opening.** Recommend **the game's drawn shape, not the
  collider rectangle: straight jambs at z -0.95 and 0.95 to a springing at
  y 2.0, a semicircular head of radius 0.95 to a crown at 2.95, run through
  the arch's whole 4 m depth, and the lintel box from 2.95 to 4 over z -2
  to 2**, read from the leaf's `springline` and `archRadius` and the three
  colliders. *Departs from the lead's head cut into the lintel above 2.95*:
  `test/assets.mjs` holds the leaf to the Kenney arch's measured opening
  (width 1.9, springing 2, apex 2.95, within 0.11 m), so the game draws a
  round-headed arch, and a head above 2.95 would leave a hole 0.95 m tall
  over every shut leaf, the east gate's and the outer gate's. The model is
  then less open than the colliders by the two spandrels above 2.0, 0.39 m²
  a section, all above a head's height (the vault is 2.64 m at 0.7 m off
  the centreline), which is the safe direction. Build it with
  `masonry.Solid`: per side a prism whose inner face is z = ±0.95 to 2.0
  and ±sqrt(0.95² - (y - 2)²) above, with levels at 0, 2.0, 2.5 and 16
  steps through the head, then the lintel box. One object per arch,
  `ARCH_<gate id>`, `planId` `<gate id>-arch`.
- **The arch's stone.** Recommend **the `material` of the level-0 wall
  pieces whose boxes touch the arch box's z faces, which must be one slug or
  `gates.py` raises naming them**: `castle_wall_slates` for the west and
  east gates (the four curtain ends), `medieval_blocks_02` for the porter
  gate (the cross-wall), `castle_wall_slates` for the outer gate; the
  gate-arch pieces carry `material: null`, and a table would be a second
  copy of which wall is which.
- **Jamb batter.** Recommend **the lead's call**: the west and east arches
  splay their outer face (x -38 and x 26, away from the ward centre as
  `walls._facing` decides it) `walls.BATTER`, 0.5 m over 2.5 m, through
  `masonry.splay`, imported and not copied, so the four curtain feet at z
  -2 and 2 meet a jamb foot of the same splay. The porter arch stands in
  the unbattered cross-wall and stays plumb. The outer gate's outer face at
  x -46 splays like `barbican-west`'s. The lintel starts at 2.95, above the
  batter, so it is plumb everywhere.
- **Who builds what at the outer gate.** Recommend **`walls.py` owns
  `walls.OUTER_GATE = {'run': 'barbican-west', 'like': 'west-gate-arch'}`
  and builds `WALL_barbican-west` from its collider less the block (the
  run's x, -46 to -42; the like-arch box's z, -2 to 2, and y, 0 to 4), as
  three boxes into `build_run`: z -10 to -2 and 2 to 10 at y 0 to 8,
  battered and returned as today, and z -2 to 2 at y 4 to 8, above the
  batter; `gates.py` builds the block as `ARCH_barbican-outer` from the
  like-arch's three colliders with x replaced by the run's**: the cut and
  the arch read one constant, `WALL_barbican-west` keeps its `planId`, and
  the block is exactly what walls.py left out. `walls.py` raises unless the
  block's z span equals `outside-road`'s within 1e-6, naming both, so a
  plan that moves the road leaves a failed build and not a gate beside it.
  Every outer-gate object carries `modelOnly: "#851"` and no `planId`.
- **Line 6 and #851.** Recommend **no `allow.json` entry**: nothing it
  covers goes missing (`barbican-west` is still named) and nothing names an
  unknown id, so line 6 would not fail, and `allow.json` holds only what
  lines 3 and 6 would otherwise fail (#851 says why an entry would do harm).
- **The portcullis.** Recommend **the lead's two, with numbers**: in each
  of the two gates, a 0.15 m slot centred 0.25 m inside the outer face (x -37.75 for the
  west gate, -45.75 for the outer gate), cut 0.15 m into each jamb (z ±1.1)
  from the ground to 4 m, where the gate-over stone caps it; in the slot's x
  band the arch has only its two jamb boxes, z ±1.1 to ±2, and no head or
  lintel. The portcullis is 2.2 m wide and 3.2 m tall, 0.12 m deep centred
  in its slot: a 3.0 m timber grid of seven verticals 0.1 wide by 0.06 deep
  at 0.35 m centres and six horizontals 0.1 tall by 0.06 deep on the
  barbican side, evenly from the grid's foot (0 to 0.1) to its top (2.9 to
  3.0), all `wooden_gate`; under each vertical a 0.2 m iron point
  (`Solid.cone`, 4 segments), and an iron strap 0.08 by 0.01 over each of
  the two lowest horizontals, all `iron`; one object, two slots. The west
  gate's is raised with its points' tips at the crown less 0.3, 2.65 m,
  which clears the open west leaf's head by at least 0.05 m at the timber
  (the leaf is 2.60 m tall at x -37.69) and 0.036 m anywhere in the slot;
  the outer gate's tips stand on 0. Its
  top then runs into the gate-over stone, hidden. `PORT_west-gate` and
  `PORT_barbican-outer`, no `planId`: the plan has no portcullis piece, so
  line 6 needs nothing and cannot see one go.
- **A check for the portcullis.** Recommend **none**: it is dressing, like
  the arrow slits no line holds, and a check.py line for it would amend
  #844 for a thing the game does not have; the still and the checklist hold
  it.
- **The leaves.** Recommend **built in the hinge's local frame from the
  piece's `leaf` and `pivot`, never from `shutAngle` or `openAngle`**: the
  blueprint's `pivot.rotationY` is already the posed angle (`shutAngle` when
  `closed`, `openAngle` when not: west 180 open, east 90 shut, porter 180
  open, muniment 300 shut), and `transform` is that pose flattened, so
  reading the angles again would be a second derivation (#500). Local u
  runs 0 to `width` from the hinge (the plan's `offset` is `width` / 2), w
  is ±`thickness` / 2, the outline is the rectangle to `springline` capped
  by the `archRadius` semicircle, 24 segments like `buildGateLeaf`. Layers
  across w: straps from -0.08 to -0.07, seven planks from -0.07 to 0.03
  with 0.005 m gaps, each the outline clipped to its strip, and two ledges
  from 0.03 to 0.08, 0.2 m tall, at 20% and 60% of `springline`, 0.05 m in
  from each edge; so the leaf fills its 0.16 m exactly. Straps 0.06 m tall
  at the ledges' heights, from u 0 to 85% of `width`. Materials:
  `wooden_gate` and `iron`. The mesh's vertices are written local (game (u,
  y, w) to Blender (u, -w, y)), the object parented with an identity
  parent inverse. `gates.py` raises unless each `LEAF_`, `BARS_` and `BAR_`
  object's evaluated world box is within 0.01 m of its blueprint box on
  every face, naming the piece and the worst face. `masonry` gains the one
  helper this needs: a closed polygon in a vertical plane extruded across
  it.
- **The open leaves against the vault.** Recommend **accept the clip, as
  the game does**: the west and porter leaves stand open at z 0.87 to 1.03,
  0.08 m into the jamb, and their round heads rise past the vault, which is
  2.38 m high at z 0.87, so up to 0.57 m of each leaf's head is inside the
  stone; the Kenney arch clips them the same way today. A leaf recess would
  be a second model-only departure for a detail under a vault. If Devon's
  still says the leaf goes through the stone, the fix is named: a 0.1 m
  recess and a flat soffit at 2.95 over the leaf's x span.
- **The hinge empties.** Recommend **created now in `MARKERS`, by
  `common.stage_collection('markers')`, as plain axes 0.3 m, at
  `pivot.position` turned by `pivot.rotationY`, with no `planId` and none
  of #843's props yet; increment 8's `markers.py` adopts them by name and
  adds the props, and never makes a second**: #843 puts them in `MARKERS`,
  so no later increment moves an object a leaf hangs on, and line 6 already
  ignores `MARKERS`, so a hinge can never stand in for a deleted leaf. *This
  departs from the lead's "the gates collection now, moved later".* The
  leaves stay in `GATES` and render; an object's render visibility is its
  own collection's, not its parent's.
- **The outer gate's leaves.** Recommend **two leaves from `west-gate`'s
  `leaf` numbers split at the centre, each 0.95 wide with a quarter-circle
  head, shut in the plane x -44.08 to -43.92 (the block's middle, where the
  plan's shut east leaf stands in its arch), no hinge empties**: Devon said
  two leaves, and hinges are #843's markers for the plan's gates only.
  `LEAF_barbican-outer-a` is z -0.95 to 0 (north), `-b` z 0 to 0.95, ledges
  on the barbican side.
- **`cell-bars`.** Recommend **the plan's six, not bars 0.12 m apart**:
  six square iron uprights 0.05 m, centred where `buildBars` puts them
  (span = `width` - `thickness`, `count` from the exported `bars`), between
  two flat rails 0.06 m tall and the box's full 0.12 m deep at its foot and
  top, all in the box, `BARS_cell-bars`, `planId` `cell-bars`, `iron`.
  *This departs from the lead's spacing*: `bars.count` is plan data (#500),
  and a thirteen-bar grate would be a different fixture from the one the
  player looks through.
- **`walk-bar`.** Recommend **the lead's call**: one squared timber, the
  blueprint box exactly (0.12 by 0.12, 1.5 m standing), 0.01 m chamfers,
  `BAR_walk-bar`, `planId` `walk-bar`, `oak`; the `stockhouse-walk` gate
  carries `bar: true` and no hinge, so nothing is parented.
- **The alias.** Recommend **`ALIAS = {'iron': 'rusty_metal', 'oak':
  'wooden_gate'}` beside `LIBRARY`, `library(slug)` resolving `asset =
  ALIAS.get(slug, slug)` and naming the material `MAT_<asset>`, and the
  module raising at import if an alias key is in `LIBRARY` or a target is
  not**: `MAT_<asset>` gives `oak` and `wooden_gate` one material and one
  set of image loads where `MAT_oak` would be a second copy of the same
  maps, and the name says which Poly Haven set is on the object, which is
  what `CREDITS.md` and line 4 speak in.
- **The tiling break-up on timber and iron.** Recommend **off: `library`
  builds `wooden_gate` and `rusty_metal` with `vary=False`, through a
  `PLAIN` set beside `ALIAS`**: a leaf is 1.9 m, one tile of `wooden_gate`,
  and the break-up's offset sample would shift boards sideways at a patch
  seam across a leaf; #850's repetition was 40 m of stone.
- **The review stills.** Recommend **two, `gates.png` and
  `gates-outer.png`, from uncommitted scratch cameras as #848 and #850
  did**: the spawn looks east and never sees #851's gate, which is the one
  Devon decided today.

**Increment 4's open calls** (architect, 2026-09-27, against `b3f2034`; the
lead's ten, and four more found in the reading). Every number is in the
game's frame. "Tile centres" are the plan's 4 m grid's, the x the seven
trusses already stand on (-32, -28, ..., -8). "Less the drum discs" means
less every drum's outer circle (radius 4 about its centre); only two drums'
hollows reach into a room's rectangle, the Kitchen Tower's (to z -13.2 at x
-20, into the kitchen and dormitory) and the Prison Tower's (to z 13.2 at x
-20, into the hall), and a slab left inside either shows in a drum room or
fights the drum's own floor, so the rule is applied everywhere rather than
to two. Everything `buildings.py` adds that realises no plan piece carries
`modelOnly: "#853"` and no `planId`.

- **The count and the scope line.** Recommend **the corrected paragraph
  above**: 40 pieces, 14 `wall`, 14 `decor`, 3 `floor`, 9 `ground`, 16 of
  them `material: null`. The objects: `WALL_<id>` for the 11
  runs, `DECK_masons-lodge-roof`, `COLUMN_<id>` for the two columns,
  `FLOOR_<id>` for the 12 floors, `TRUSS_<id>` for the 7 trusses, and one
  `ROOF_great-hall` with `planIds` the 7 `hall-roof` ids. `buildings.py`
  reads the blueprint alone, so `--only buildings` builds.
- **The 16 null pieces' materials.** Recommend **three named constants in
  `buildings.py`, as `towers.STAIR_MATERIAL` did for the plan's null
  flights**: `TIMBER = 'rough_wood'` for the 7 trusses (and every #853
  beam); `ROOF_BOARDS = 'old_planks_02'` under `towers.ROOF_MATERIAL`
  (`roof_slates_02`, imported, not copied) for the 7 `hall-roof` pieces,
  whose underside is what the hall shows between the trusses; and
  `COLUMN_STONE = 'medieval_blocks_02'` for the 2 columns. Each is the
  blueprint's own slug where the plan has one for the job (#849):
  `old_planks_02` is `masons-lodge-roof`'s, the plan's only roof with a
  material, and `medieval_blocks_02` is the plan's dressed stone (#541,
  `kings-hall-south`'s `materialComment`). The columns do not take the
  gates' arch rule: an arch is part of the wall it stands in, a column
  stands free, and the hall's walls are `castle_wall_slates`, coursed
  rubble no mason turns into a round shaft. The trusses do not take `oak`
  (`wooden_gate` through `ALIAS`): that set is a plank door, 1.9 m of about
  0.27 m boards, and box-projected onto a 0.3 m member it draws board
  seams across a squared timber in the one still Devon asked to see from
  underneath. `rough_wood` is grain with no plank seams. `oak` stays on
  `walk-bar` as shipped. *Amended 2026-09-28 (#856)*: `ROOF_BOARDS =
  'wood_planks'`. `old_planks_02` is exterior cladding with rust-stained
  nail runs and drip stains at the foot of every board, so each 2.0 m tile
  laid a row of dark streaks up the hall's 34.6 degree underside; Devon:
  "Fix the roof board steaks now." `wood_planks` (1.5 m, coursed) is the
  plan's own board under `stone_pavers` on the flat roofs and reads clean
  on the dormitory's ceiling in the same render. The constant's reason
  above no longer holds for it: it is a model-only choice, and the
  pieces whose blueprint `material` is `old_planks_02` keep it (#849).
- **The new `sources.json` rows.** Recommend **five sets, 2k jpg, the five
  maps each (diff, nor_gl, rough, disp, ao), 25 rows, 50,820,764 bytes**,
  fetched after Devon's yes to this list with sizes: `old_planks_02`
  6,286,253 (2 m; `masons-lodge-roof`, 5 ground floors, and the hall
  roof's boards until #856 moved those to `wood_planks`), `rock_tile_floor` 15,323,983 (1.96 m; the hall and the King's
  hall), `floor_tiles_02` 5,186,646 (4 m; the chapel drum and the nave),
  `dirty_carpet` 16,509,766 (0.6 m; `floor-royal-apartments`, "the one
  carpet in the castle") and `rough_wood` 7,514,116 (0.5 m; the trusses and
  the beams). The first four are blueprint slugs and are 43,306,648 bytes
  alone; `medieval_wood` (9,370,196, 2 m planks) is refused for the timber
  for `wooden_gate`'s reason. Rows as increments 2 and 3: one download each
  into scratch, refused unless size and md5 equal the API's, then sha256 and
  `bytes` by hand; `CREDITS.md` gains five lines (132 files in 25 assets).
  `ALIAS` gains nothing: no null piece takes a slug, it takes a constant.
  **`PLAIN` gains `rock_tile_floor` and `floor_tiles_02`**, whose grout grid
  the break-up's offset sample would step at every patch seam across a
  floor, the fault `PLAIN` exists for. **`SWAP_RISE` gains `rough_wood` and
  `dirty_carpet` at 0.5**, uncoursed like the slates, since a 0.5 m grain
  and a 0.6 m carpet repeat 14 and 33 times along a truss and a 20 m floor.
  `old_planks_02` takes the coursed default (rise 0), as `wood_planks` does
  on the 15 walks Devon has seen. If the hall's still shows the tiles' 1.96
  m repeat, the fix is named: a per-set offset of whole tiles, not the
  break-up.
- **The hall's roof and trusses as objects, and line 6.** Recommend
  **seven `TRUSS_hall-truss-<n>`, each with its own `planId`, and one
  `ROOF_great-hall` with `planIds` the seven `hall-roof` ids**: #528 says
  the trusses stay trusses, the game draws one `roof.glb` per bay over one
  truss per bay (#656), and deleting a truss then names that truss, and
  deleting the roof names the seven roof ids, which are the two breaks
  above. One object for all fourteen would name fourteen ids on either
  break and could not tell a missing truss from a missing roof.
- **The hall roof's shape.** Recommend **the pieces' own section, with
  #853's three departures**. The pieces fix it: eaves at y 8 on z 6 and z
  13.25, a ridge at y 10.5 on z 9.625, so the pitch is 2.5 over 3.625,
  0.6897, 34.6 degrees, the ridge along x. The trusses' top edges are those
  two lines and the roof's underside lies on them; the roof is 0.18 m thick
  measured vertically, 0.12 of `ROOF_BOARDS` boards (slot 1) under 0.06
  of `roof_slates_02` (slot 0), so its ridge top is 10.68. The south eave
  does not stand on the curtain: #527 stopped the trusses at 13.25, 0.75 m
  short of its face at z 14, for the Prison Tower's level-2 floor, and in
  the game that is a slot of sky. The departures: (a) x -34 to -6, the
  hall's own, not `hall-roof-1`'s -33.7, since #657's 0.3 m is a fit to a
  body radius and in the model is a slot of sky over the west end; (b) the
  north slope runs past z 6 to an eave at z 5.2, 0.3 m past the run's outer
  face, underside 7.45 there, and the south slope runs on at the same pitch
  to the curtain's face at z 14, underside 7.48 there, tucked under the
  walk's edge; (c) both slopes less the drum discs: the Prison Tower's
  cuts z 14 at x -23.46 and -16.54 and reaches z 12 at x -20, the South-west
  Tower's cuts the corner from x -34, z 12.54 to x -32.54, z 14, and the
  roof meets each drum's face. Closed at both ends by a gable of
  `ROOF_BOARDS` boards 0.05 m thick inside the roof's x span (x -34 to
  -33.95 and -6.05 to -6), the triangle (z 6, y 8), (9.625, 10.5), (13.25,
  8), in `ROOF_great-hall`'s own object: a stone gable on the west curtain
  would stand on the west walk. (`ROOF_BOARDS` is `wood_planks` since
  #856, `old_planks_02` before.) `masonry` gains `Solid.slab(poly, under,
  thickness, slot)`, a plan polygon lifted onto a plane, closed.
- **The trusses' shape.** Recommend **a king-post truss in the piece's
  box, drawn in its (z, y) plane**: the two principal rafters 0.3 m deep
  measured vertically under the slope lines, from each eave point to the
  apex; a tie beam y 8.0 to 8.3 between the rafters' feet; a king post 0.25
  m wide from the tie beam to the apex; two struts 0.2 m wide from the king
  post's foot to each rafter's midpoint; every member 0.3 m across x,
  centred on the piece's x. `buildings.py` raises unless each `TRUSS_`'s
  world box is within `BOX_TOLERANCE` (0.01) of its blueprint box on the y
  and z faces and its x centre within 0.01, naming the piece and the worst
  face: the piece is 0.5 m thick and a 0.5 m oak member is twice what a
  hall truss carries. `masonry.plate` gains `axis='z'` (today's) or `'x'`,
  so a truss is one plate call per member. Truss 4's south foot, at
  (-20, 13.25), is 0.05 m inside the Prison Tower's hollow, as it is in the
  game; accept it. The six other south feet stand on #853's corbels:
  `CORBELS_great-hall`, one stone block per foot, x the truss's ± 0.2, z
  13.0 to 14.0, y 7.4 to 8.0, in the `material` of the wall piece whose box
  face is at z 14 behind it (`castle_wall_slates`, raising if none or two
  slugs), none under a foot inside a drum disc.
- **The runs, doors and windows.** Recommend **`walls.build_run(solid,
  piece, cols, None, batter=False)`, imported**, on each run's colliders
  from `masonry.colliders_of`, so the 7 doorways the colliders leave (y 0
  to 2.5, 2 m wide) and Lady Alys's window are openings exactly as the
  plan cuts them, and no run is battered (none is `curtain`). The plan has
  one window in these runs, `kings-hall-south` between colliders `-3` (top
  5.0) and `-4` (foot 6.4) over x 15.4 to 16.6. #853's windows copy it:
  `WINDOW_LIKE = ('kings-hall-south-3', 'kings-hall-south-4')`, read for
  width 1.2, sill 5.0 and head 6.4 (#500), each cut through the run's whole
  1 m by `walls.minus_block` (imported), straight, unglazed. They stand at
  the tile lines inside the room's span, between the trusses or beams, in
  the one run of each covered room that faces a ward, as a committed table:
  `WINDOWS = {'great-hall-north': [-30, -22, -18, -14, -10]}` in 4a, and
  4b adds `'clerk-office-south': [-30]`, `'kitchen-south': [-22, -18]`,
  `'chapel-nave-north': [14]` and `'chapel-nave-east': [10]` (a z, the
  east window over the rood). The hall's sixth tile line, -26, is left out
  because `hall-fireplace` (x -28.2 to -25.8, 4.2 m tall) is under it and
  its flue is in that wall; that is a look call, written in the table's
  comment, not a rule. `buildings.py` raises if a window's block grown by
  0.1 m meets any props-stage piece's box, naming both, which is the
  `royal-tapestry` break. None in the royal apartments, which already have
  the plan's window, and none in a ground room under an upper floor, which
  the game roofs today.
- **The floors.** Recommend **every slab less the drum discs, and: the 3
  upper floors as their colliders clipped to the box (one collider each),
  in the piece's slug, except `floor-royal-apartments`, which is 0.02 m of
  `dirty_carpet` (3.98 to 4.0) over 0.18 m of `wood_planks`, so the King's
  hall's ceiling is boards and not carpet; the 6 rectangular ground floors
  as their box from y -0.1 to 0.005 (`walls.WALK_LIFT`'s 5 mm over the
  terrain), since a `ground` piece has no collider and a zero-height box;
  the 3 disc ground floors (`floor-porter-lodge`, `floor-muniment`,
  `floor-chapel`) as the piece's `disc` at `towers.DISC_FACETS` over the
  same y, uncut; `DECK_masons-lodge-roof` as its box (no collider,
  `noCollide`)**. check.py line 5 rays onto `TERRAIN_ground` alone, so a
  floor 5 mm above it moves nothing. `masonry` gains `minus_discs(rect,
  discs)`: the rectangle's outline with each disc that cuts an edge or a
  corner replaced by its arc at `masonry.arc`'s 3.75 degrees, one plan
  polygon `Solid.prism` takes as its ring, raising if a disc lies wholly
  inside or splits the rectangle.
- **The columns.** Recommend **both one shape, their box exactly: a 0.8 m
  square plinth 0.3 m tall, a round shaft 0.6 m across at 32 facets, a 0.8
  m square capital 0.3 m tall (3.7 to 4.0); `column-damaged-62` loses the
  capital's quadrant that faces the hall's centre (x -, z +)**, so it reads
  as damaged from the floor and still reaches its box on every face.
  `buildings.py` raises unless each `COLUMN_` is within 0.01 m of its box
  on every face; both have colliders equal to their boxes, and this is the
  one piece kind here a body walks into.
- **Beams and plaster (4b).** Recommend **beams at the tile centres, 0.3
  by 0.3 m, under every upper floor (y 3.5 to 3.8) and every #853 flat
  roof (y 7.5 to 7.8), spanning z from the north stone face, or a drum
  disc where one cuts in, to the south run's face at z -6.5 (the nave, 6.5
  to 14), each end 0.25 m into the stone it bears on, in `TIMBER`, one
  `BEAMS_<room id>` per room ceilinged**: x -32 and -28 (the Clerk's rooms),
  -24, -20 and -16 (the kitchen and dormitory; the -20 beam starts at the
  Kitchen Tower's face, z -12.0), 4, 8, 12, 16 and 20 (the King's hall and
  royal apartments), 12 and 16 (the nave). The tile centres are where the
  trusses stand, and they clear every hung prop: `kitchen-herbs` (x -21.62
  to -20.38, top 3.78), `kings-hall-chandelier` (x 12.88 to 14.12, top
  3.73), `royal-lantern` and both cobwebs; the tile lines between them put a beam
  through the chandelier, which is the break. `buildings.py` raises if a
  beam's box meets a props-stage piece's box. **Plaster in the three upper
  rooms only**, `PLASTER_<room id>`, 0.015 m of `plastered_wall_04` on the
  room-facing face of every flat run that bounds the room (the buildings
  runs and the curtain and cross-wall faces), built from the same boxes
  `build_run` received less the window blocks, so every opening stays open,
  from the floor's top at 4.0 to the roof's underside at 7.8. *Amended
  2026-09-28 (#854)*: in a rubble run the skin also stops at each opening
  grown by `DRESS`, so the dressed band shows inside as stone round the
  window, as it would in a limewashed chamber; in a `medieval_blocks_02` run
  (Lady Alys's window) it stops at the opening itself. Drum faces
  stay stone, and a skin that runs behind a drum's bulge is buried in its
  stone. The ground rooms keep the plan's stone, since their slugs were
  chosen for them (#541) and the upper rooms' were not.
- **The drum ground rooms and the lodge.** Recommend **`buildings` dresses
  no drum interior beyond the three disc floors `STAGE_OF` gives it**: the
  rings and the upper floors are `towers`', the furniture is `props`', and
  the five rooms whose `floor` is null (guardroom, larder, laundry, cell,
  bakehouse) keep the terrain's ground, which is what the plan says. The
  terrain already keeps its grass scatter off every room's footprint; if a
  still shows the grass texture on a drum floor, the fix is `terrain.py`'s
  `mud` attribute inside each drum, not a floor the plan lacks, and not
  this increment's. The lodge gets its deck only: its four posts are the
  plan's kit decor `structure-pole-73` to `-76`, which increment 6
  realises, so the deck floats in 4a's stills, and the report says so.
- **Roofs over the blocks the plan leaves open (4b).** Recommend **flat
  roofs at 8 m on the four rooms whose walls all stand to 8 m, and a
  lean-to on the Steward's chamber, all #853**: `ROOF_clerk-chamber` (x
  -34 to -26.5, z -14 to -6.5), `ROOF_dormitory` (x -25.5 to -14.5, z -14
  to -6.5), `ROOF_royal-apartments` (x 2 to 22, z -14 to -6.5) and
  `ROOF_chapel-nave` (x 10.5 to 17.5, z 6.5 to 14), each the room's clear
  span between its stone faces less the drum discs, y 7.8 to 8.0: 0.05 m of
  `stone_pavers`, the plan's flat-roof slug (#849), over 0.15 m of
  `wood_planks`. The top is flush with the walls' tops and the walks, so
  the castle's silhouette at 8 m is the game's, and a drum's walk door (8
  to 10.5 m) opens onto a roof rather than into a ridge. Pitched roofs are
  refused for that door and because every ridge would stand beside a walk
  and need a gable at each end. `ROOF_steward-chamber`: x 2 to 9.5, z 5.2
  to 14, less the Bakehouse Tower's disc (it cuts x 2 at z 12.54 and z 14
  at x 3.46), its underside through (z 6.5, y 4.0), the north run's top
  inner edge, and (z 14, y 7.82), a pitch of 0.509, 27 degrees, 0.18 m
  thick as the hall's roof is, so it meets the curtain at 8.0 under the
  walk's edge and its eave at z 5.2 is 3.34 m up, 1.43 m over the tallest
  garden row (`garden-scarecrow`, 1.91). *Amended 2026-09-28 (#855)*: the
  underside runs through the north run's OUTER top edge, (z 5.5, y 4.0),
  and (z 14, y 7.82): pitch 3.82 / 8.5 = 0.449, 24.2 degrees. Built through
  the inner edge, the roof's top was 3.67 at z 5.5, so the wall's outer
  arris stood 0.33 m up through the slates and the eave hung under the wall
  top as a loose strip; Devon: "The roof should sit on the wall." Derived:
  eave at z 5.2, underside 3.865 and top 4.045, 1.955 m over
  `garden-scarecrow`; at z 5.5 underside 4.000 (on the arris), top 4.180; at
  z 6.5, the inner edge, underside 4.449; at the Bakehouse disc's cut, z
  12.54 at x 2, underside 7.164 and top 7.344; at the curtain's face, z 14,
  underside 7.82 and top 8.00, flush with the wall top and under the walk's
  edge as before. The disc cut is the plan's and does not move. The wedge
  this leaves over the wall top, 1.0 m deep and 0.449 m tall at the inner
  face, is filled by `PLATE_steward-chamber`; see increment 4b's open
  calls. `buildings.py` raises if any #853
  roof's box meets a props-stage piece's box. The Steward's chamber gets
  no window: a sill at 5 m does not fit a 4 m wall, and its door is its
  light, as the King's hall's is.
- **The chapel nave (#835 to #838).** Recommend **honour five facts, none
  of which needs a line of its own**: the nave is x 10 to 18, z 6 to 14 on
  `floor_tiles_02`, the chapel drum's own slug; it shares
  `steward-chamber-east`, 8 m since #837 because the rood tops out at 4.46,
  and the south curtain; it does not open into the Chapel Tower, so
  `chapel-nave-east` is one collider and gets no door, only #853's east
  window at a sill of 5.0, 0.54 m over the rood; its door is
  `chapel-nave-north-1`, x 11 to 13; and the pulpit stands against the
  north wall (x 14.34 to 16.66, 1.9 m) under #853's north window at x 14.
  The garden rows #837 moved stand against the Steward's north wall, under
  the lean-to's eave. No station, evidence or room moves (#836).
- **The review stills.** Recommend **Devon's two for 4a and one for 4b,
  from uncommitted scratch cameras as #848 and #850 did, Cycles 1920 x 1080,
  128 samples with the denoiser, 24 mm**: `shots/castle3d/buildings.png`,
  the hall from the outer ward, eye at game (-4, 1.7, -5) looking at (-13,
  5.5, 7), which holds both the hall's north corners and its ridge in frame;
  `buildings-hall.png`, under the trusses, #656's framing from
  `test/play-castle.mjs`'s `the-hall-trusses` beat, eye at (-30.5, 1.7, 10)
  looking east pitched up 0.72 rad, at (-20.5, 10.47, 10); and for 4b,
  `buildings-dormitory.png`, eye at (-25, 5.7, -10) looking at (-14.5, 6.2,
  -9), which holds the south windows, the beams, the plaster and the
  Kitchen Tower's bulge. Light is increment 7's, so a still may raise the
  Film exposure, and the report says by how much. *Amended 2026-09-28
  (#854)*: 4b sends four stills, not one; increment 4b's open calls name
  them.
- **Two sittings, not one.** Decided, Devon 2026-09-27: **4a then 4b, each
  a class S sitting**: 4a is every piece with a `planId` plus the hall's
  #853 pieces, which Devon's two stills need (a roofed hall with no windows
  is a black still); 4b is #853 everywhere else.

**Increment 4b's open calls** (architect, 2026-09-28, against `1d1308e`;
Devon's rulings of 2026-09-28 on the ten open look notes, #854, and the
lead's measurements in Devon's live Blender, Material Preview, scene World).
Every number is in the game's frame. Everything below is a material or a
model-only object, so line 6 stays at 197 and 40 and no `planId` moves.

- **Which notes 4b takes.** Decided, Devon 2026-09-28 (#854): #852's (b),
  the west gate-over's flat grey plaster, and (c), the west arch's pale
  soffit; 4a's (a), the hall roof hidden from the outer ward (a ridge
  louvre), (b), the pale flat reveals, and (c), the dark hall. Left:
  #852's (a), (d) and (e). Withdrawn: #852's (f), the wall height (#850's
  open question is closed). Later: 4a's (d), the lodge deck, which
  increment 6's four poles fix.
- **Why the reveals read pale and flat.** Not a projection fault:
  `masonry.finish` writes `UVMap` per face by its dominant axis, the box
  projection makes the same choice, and a jamb's rubble is at the face's
  scale. A jamb, head or sill is the same `castle_wall_slates` rubble as the
  face, cut dead straight through 1 m, facing another part of the sky, with
  nothing at the arris to say the stone turned there. The three rubble gate
  arches are the same fault over a 4 m passage (#852 c).
- **The dressed openings in the runs.** Recommend **the plan's dressed
  stone round every opening in a run whose slug is not already
  `materials.DRESSED` (`'medieval_blocks_02'`, #541), as a second material
  slot on the run's own faces, over the reveal and a band `DRESS` 0.25 m
  wide on both wall faces round the jambs, head and sill**. A slot moves no
  vertex: every opening stays the plan's size (#500), the run's solid stays
  its colliders clipped to its box, and line 6 is untouched, where a skin
  inside the opening narrows it and a skin proud of the face stands outside
  the collider with an arris of its own. The band is what a mason's dressed
  jamb shows on the face, and it moves the material change a quarter metre
  out from the arris, so the eye reads a surround and not a paint line. In
  `buildings.py`, for each such run, after #853's windows are cut:
  `openings(piece, cols)` is the piece box less the colliders, found on the
  grid of the colliders' edges along the run and in y, merged along the
  run, each spanning the run's whole depth or the stage raises; each is
  grown by `DRESS` along the run and in y, except that an opening standing
  on the piece's foot (a door) grows no sill band; the stage raises if a
  grown opening leaves the piece box or meets another's, naming the run and
  both openings by their centres; `masonry.split_boxes(cols, cuts)` cuts
  every collider box at each grown box's along and y planes, so no face
  straddles a band's edge; `walls.build_run` as today; then
  `Solid.paint(test, 1)` paints every face whose centre lies inside a grown
  opening (across, the piece box's full depth), and `finish` takes
  `[library(slug), materials.dressing()]`. Dressed: `clerk-office-south`
  (its door and #853's window at x -30), `kitchen-south` (door, windows at
  -22 and -18), `great-hall-north` (two doors, five windows); 12 openings.
  Not dressed, already `medieval_blocks_02`: `kings-hall-south` (door and
  Lady Alys's window), `steward-chamber-north`, `chapel-nave-north` and
  `chapel-nave-east`. At `DRESS` 0.25 no two grown openings meet: a door's
  band tops out at 2.75 and a window's sill band starts at 4.75.
- **The dressed passages in the gates.** Recommend **the passage faces
  only, painted slot 1, in `ARCH_west-gate`, `ARCH_east-gate` and
  `ARCH_barbican-outer`**, the three in `castle_wall_slates`;
  `ARCH_porter-gate` stands in the `medieval_blocks_02` cross-wall and is
  left alone. After `build_arch`, `Solid.paint` takes every face whose
  centre is strictly inside the arch's x span (so neither end face, plumb or
  battered) and within `inner(y) + SLOT_JAMB + EPS` of the passage's
  centre in z, `inner` being 0 above the crown: the jambs, the vault's
  soffit and the portcullis slot's cuts. No face band on the arch ends: a
  band round a round head needs a curved split the prisms do not have, and
  the 4 m passage is what Devon saw.
- **The dressing's tone.** Recommend **`MAT_medieval_blocks_02_dressing`,
  the set coursed (rise 0) with a Hue/Saturation/Value of Value 0.6, built
  once by `materials.dressing()` from `DRESSING = ('medieval_blocks_02',
  0.6)`**. Measured on the 2k maps as the linear luminance of diffuse times
  AO, which is what `_maps` feeds the shader: `castle_wall_slates` 0.109,
  `medieval_blocks_02` 0.180. Value 0.6 puts the dressing at 0.108, the
  rubble's own, so the brightness step at the arris is the light's alone
  and the blocks' joints and relief (displacement std 0.145) do the
  reading; the undarkened set would be a frame 1.65 times the rubble's
  brightness round a note that says "pale". The name keeps the Poly Haven
  set in it for line 4 and `CREDITS.md`. The cross-wall, the columns and
  the blocks runs keep `MAT_medieval_blocks_02` as Devon has seen them. If
  the still reads the band as dark, the fix is that one number.
- **Why the plaster is a white card.** Measured on the 2k maps:
  `plastered_wall_04`'s diffuse is neutral grey (sRGB mean 0.553, 0.542,
  0.531), linear luminance 0.257 with std 0.019; its AO map is 1.000
  everywhere (slates' mean 0.445), its displacement std 0.003 (slates'
  0.137) and its roughness std 0.015. So it renders at 0.257 against the
  rubble's 0.109, 2.4 times as bright, with a coefficient of variation of
  0.07 against the rubble's 0.67. It is a smooth modern render.
- **The plaster fix.** Recommend **option (i), keep the set, no fetch:
  `materials.LOOK = {'plastered_wall_04': {...}}`, applied inside
  `library()` so `MAT_plastered_wall_04` is the one material everywhere**:
  `tint` `{'Hue': 0.5, 'Saturation': 1.0, 'Value': 0.65}`; `warm` `(1.0,
  0.93, 0.80, 1.0)`, a limewash cream; `grime`, a world Noise of 1.5 m
  (detail 4) whose Fac, mapped from 0.4 to 0.6 onto 0.75 to 1.2 and
  clamped, multiplies the colour's Value after #850's drift; `undulate`, a
  Bump node (Strength 0.3, Distance 0.02 m) on a world Noise of 0.6 m
  (detail 3), fed the Normal Map's output and feeding the BSDF's Normal, so
  the render follows the uneven stone under it. `_maps` gains `grime`,
  `_finish` gains `undulate`, both off for every other set. The effective
  albedo goes from 0.257 to 0.156 (0.257 x 0.65 x 0.935, the warm's
  luminance weight), 1.43 times the rubble and 0.87 times the blocks, so it
  still reads as a lighter finish and no longer as a lit card; its linear
  red to blue goes from 1.09 to 1.36. One material means the fix reaches
  `west-gate-over`, `east-gate-over`, every `PLASTER_<room id>` and the six
  plastered Mereford houses of increment 5. Option (ii), another Poly Haven
  plaster, is refused for now: it is a round trip to Devon for a fetch, it
  leaves the blueprint's own slug (#849), and the fault is brightness, which
  is two numbers. If `gates-dressed.png` still reads a card, the fallback is
  named and is the lead's to price: `plastered_stone_wall` or
  `painted_plaster_wall`, IDs not yet checked against
  `api.polyhaven.com/files/<id>`.
- **The ridge louvre.** Recommend **`LOUVRE_great-hall`, one object,
  `modelOnly: "#854"`, no `planId`, over the bay between `hall-truss-5` (x
  -16) and `hall-truss-6` (-12), centred `LOUVRE_X = -14`, with the roof
  opened under it**. The sight line: from 4a's eye (-4, 1.7, -5) over
  `great-hall-north`'s outer top arris (z 5.5, y 8), a ray's height at z is
  1.7 + 0.6 (z + 5), whatever its x, since the wall and the ridge both run
  along x: 9.875 at z 8.625 and 10.475 at the ridge, z 9.625, whose top is
  10.68, the 0.2 m the still shows. The louvre, footprint x -15.2 to -12.8
  (2.4 m) by z 8.625 to 10.625 (2.0 m) on the ridge: sill plates `rough_wood`
  0.12 by 0.12 along both long sides, y 9.99 to 10.11 (9.99 is the roof's
  top at 1.0 m off the ridge, 10.68 - 0.6897); four corner posts 0.12 m
  square, 10.11 to 11.28; head plates 11.28 to 11.40, `LOUVRE_RISE` 0.72
  over the ridge top; between the posts on each long side four slats of
  `ROOF_BOARDS`, 0.25 by 0.025 m, tipped 45 degrees with their low edge
  outward, centred on the side's plane (z 8.685 and 10.565) at y 10.256,
  10.549, 10.841 and 11.134, so light and smoke pass and rain does not;
  each end closed by `ROOF_BOARDS` boards 0.05 m thick (x -15.2 to -15.15
  and -12.85 to -12.8) from the roof's top line to the cap's underside, as
  two convex quads per end, (8.625, 9.99), (9.625, 10.68), (9.625, 12.09),
  (8.625, 11.40) and its mirror; a cap of the hall roof's own section,
  0.12 m of `ROOF_BOARDS` (slot 1) under 0.06 m of `roof_slates_02`
  (slot 0, `towers.ROOF_MATERIAL`), pitch 0.6897, ridge along x, underside
  12.09 at z 9.625 and 11.40 at the head plates, eaves 0.1 m past the
  footprint on all four sides (x -15.3 to -12.7, z 8.525 to 10.725), ridge
  top 12.27. Slots: 0 `roof_slates_02`, 1 `ROOF_BOARDS` (`wood_planks`
  since #856), 2 `rough_wood`,
  `smooth_angle` 5 as the roof. **What reads**: the louvre's whole north
  side is above the sight line, its foot 0.115 m over it and its sill's top
  0.235 m, and its cap ridge stands 1.80 m over the sight line at the ridge
  and 1.59 m over the hall's ridge, 2.28 m of louvre from foot to cap. Why
  that bay: it is outside the Prison Tower disc's cut of the south slope (x
  -23.46 to -16.54), so the slope's rectangles split round the hole keep
  `minus_discs`' one-corner rule (a hole at x -18 has both its south
  corners inside the disc and raises); its centre is 1 m from where
  `buildings.png`'s camera axis crosses the ridge (x -14.97); it is not
  over the fireplace at -26; and `buildings-hall.png`'s camera sees it 28.6
  degrees up, inside its frame. **The roof is opened**: a hole x -15.08 to
  -12.92, z 8.745 to 10.505, inside the sill and post faces so every louvre
  member stands on roof, through boards and slates both. `build_roof` builds
  each slope as three rectangles, the two either side of the hole's x span
  whole and the middle one stopping at the hole's z, each through
  `minus_discs` as today; the gables do not change. The hole is what lets a
  louvre work, and it is the hall's one new source of daylight (4a's c).
  `buildings.py` raises if the hole's x span grown by 0.1 m meets any
  `hall-truss` piece's box, naming it (the `LOUVRE_X = -12` break names
  `hall-truss-6`), and if the louvre's box grown by 0.1 m meets any
  props-stage piece's box, naming both, as every #853 object does. Constants
  in `buildings.py`, citing #854: `LOUVRE_X`, `LOUVRE_SIZE = (2.4, 2.0)`,
  `LOUVRE_RISE`, `LOUVRE_FRAME = 0.12`, `LOUVRE_SLATS = 4`, `SLAT = (0.25,
  0.025, 45)`, `LOUVRE_EAVE = 0.1`; the end boards reuse `GABLE`. The
  object is named for the room it vents, as `ROOF_great-hall` and
  `CORBELS_great-hall` are.
- **The dark hall (4a's c).** Recommend **no light in this increment**:
  light is increment 7's, and #853's windows are already in the hall. 4b's
  windows, beams and plaster answer it for the other rooms and the louvre's
  hole adds the hall's daylight. The report gives the Film exposure each of
  the four stills needed, and `buildings-hall.png`'s against 4a's +7 stops.
- **The module split.** Recommend **`masonry.py` gains two helpers,
  `split_boxes(cols, cuts)` (each collider box cut at every plane in `cuts`
  = `{'x': [...], 'y': [...], 'z': [...]}` that lies strictly inside it, ids
  kept, raising unless the pieces' summed volume is the box's within 1e-9)
  and `Solid.paint(test, slot)` (sets `material_index` on every face of the
  bmesh whose centre, turned back into the game frame, passes `test(x, y,
  z)`, and returns the count); `materials.py` gains `DRESSED`, `DRESSING`,
  `dressing()`, `LOOK` and the `grime` and `undulate` parameters;
  `buildings.py` gains `DRESS`, `openings`, the dressing pass, the louvre
  and the opened roof; `gates.py` gains the passage paint, reading
  `materials.DRESSED`, never `buildings` (which imports `gates`)**:
  `DRESSED` lives in `materials.py` because both stages read it and it is a
  material fact. `walls.py` and `towers.py` do not change.
- **The lean-to's wall plate (#855).** Recommend **`PLATE_steward-chamber`,
  one `rough_wood` (`TIMBER`) wedge filling the space between the north
  run's top and the lean-to's underside, `modelOnly: "#855"`, no
  `planId`**: x 2 to 9.5 (the roof's span; the Bakehouse disc does not
  reach z 5.5 to 6.5), section (z 5.5, y 4.0), (6.5, 4.0), (6.5, 4.449), a
  `Solid.plate` with `axis='x'`. With the roof through the outer arris the
  wedge is closed outside, since roof and arris meet on a line, and open
  inside: from the chamber the eye sees a slot 0.449 m tall at the inner
  face narrowing to nothing 1 m back, a dark sliver under every rafter
  line. Nothing would leave that slot as a gap in the one room the lean-to
  exists to close; a plate is what a lean-to's rafters bear on, and its
  0.449 m face reads as one. `buildings.py` raises if its box grown by 0.1
  m meets a props-stage piece's box, naming both.
- **The drum walk doors under a pitched roof (#855).** Recommend **a shut
  plank leaf, `DOOR_<drum id>-<door index>`, in every drum door whose base
  is 8 and whose arc passes under an #853 roof whose top there stands above
  the door's base; `modelOnly: "#855"`, no `planId`, `oak` (so
  `MAT_wooden_gate` through `ALIAS`, the plan's leaf timber, as #851's shut
  leaves are)**. In the game these doors open onto #527's 0.75 m slot of
  sky; in the model the hall roof now runs past them, so between the sill
  at 8 and the roof's underside the lit drum room glows into the hall
  (`buildings-hall-4b.png`, rays on `DRUM_prison-tower` at x -22.3 to
  -21.2, y 8.0 to 9.6, z 12.9 to 13.3). The hall roof's top is above 8 for
  z under 13.51 (top 8.18 + 0.6897 (13.25 - z)), which is where every hit
  lay. The rule, computed in `buildings.py` from the blueprint's `drums`
  (`cx`, `cz`, `radius`, `doors` with `from`, `arc`, `base`, `top`) and the
  #853 roofs' own planes, not a table: sample the door's arc 0.05 m
  outside the ring (on the ring itself a sample lies on the roof polygon's
  own disc-cut edge) at `masonry.arc`'s step; a door takes a leaf if any sample inside a roof's
  plan polygon has that roof's top above `base` + 1e-6. The walk doors
  checked, all base 8, top 10.5, are 17:
  - **Under the hall roof, a leaf each (4)**: `prison-tower` door 1 (arc
    90 to 150, x -18 to -16, z 12.54 to 16) and door 2 (210 to 270, x -24
    to -22, the still's); `sw-tower` door 1 (90 to 150, x -34 to -32, z
    12.54 to 16) and door 2 (135 to 180, of which x -34 to -33.17, z 12.3
    to 13.17 is under the roof and the rest opens on the west walk). The
    two `sw-tower` doors are behind 4a's hall camera, which is why no ray
    found them.
  - **Onto a flat #853 roof, top 8.00 = the sill, no leaf (6)**:
    `nw-tower` 2 and 3 (the Clerk's chamber), `kitchen-tower` 2 and 3 (the
    dormitory), `stockhouse-tower` 2 and `kings-tower` 2 (the royal
    apartments).
  - **Onto the lean-to, below the sill, no leaf (1)**: `bakehouse-tower`
    door 2 (x 2 to 4, z 12.54 to 16), where the roof's top is 7.344 to 8.00
    along the arc, so the door opens onto the roof outdoors, as a walk door
    onto a lower roof does.
  - **Onto walks or open ground, no #853 roof (6)**: `stockhouse-tower` 1
    and 3, `kings-tower` 3, `bakehouse-tower` 1, `chapel-tower` 1 and 2
    (the chapel drum's two open east of the nave's x 18).
  The leaf: two plates of `oak`, 0.1 m thick, 5 mm apart at the middle, on
  the chord between the door's outer-arc ends (4.0 m for a 60 degree door,
  3.06 m for a 45; the chord's middle is at radius 3.46 or 3.70, inside the
  ring's 2.8 to 4.0), set 0.1 m inward of the chord, from y 8.0 to 10.5.
  `buildings.py` raises if a chord's middle is not inside the ring, and if a
  leaf's box grown by 0.1 m meets a props-stage piece's box, naming both.
  This shuts four walk doors the game leaves open; the model is not walked
  and a shut door is what the walk would show (#851's reasoning). The
  report lists the four by name.
- **The review stills.** Recommend **four, from uncommitted scratch
  cameras, Cycles 1920 x 1080 with the denoiser; the two interiors,
  `buildings-dormitory.png` and `buildings-hall.png`, at 1024 samples, and
  the two exteriors at 128, until increment 7's light** (#855: at the hall
  eye, 960 x 540 and +11.5 stops, 128 samples raw was nearly pure noise and
  128 denoised smeared streaks along the ceiling boards that Devon read as
  "a lighting issue at the top of the ceiling"; 1024 denoised was clean):
  `buildings-dormitory.png` as increment 4's call has it; `buildings.png`
  and `buildings-hall.png` from 4a's two cameras exactly, so Devon compares
  the louvre, the dressed doors and windows and the hall's light against
  the stills he liked; and `gates-dressed.png`, 18 mm, eye (-40.5, 1.7,
  1.5) inside the barbican looking at (-35, 2.4, -0.3), which holds the
  west arch's jamb and soffit and the plastered gate-over. *Amended
  2026-09-28 (#855)*: this call named eye (-41.5, 1.7, 8) at (-37, 4.25,
  0), which framed a dark corner with no arch in view. Film exposure,
  auto-probed to a median display value of about 0.35, as used for 4b's
  first stills: `buildings-dormitory` +11, `buildings-4b` (4a's outer-ward
  eye) +2.5, `buildings-hall-4b` +11.5, `gates-dressed` +3.5. The report
  gives each still's exposure.

**Increment 5's open calls** (architect, 2026-09-28, against `8a90b88`; the
lead's list, and five more found in the reading). Every number is in the
game's frame. "The road" is `outside-road`, x -198 to -46, z -2 to 2, centre
line z 0. k is a pitch as rise over run; tan 50 degrees is 1.19175. Every
object `town.py` adds that realises no plan piece carries `modelOnly: "#857"`
and no `planId`; what departs from a piece's box inside an object that
carries its `planId` (a jetty, a chimney, a roof above its pitch boxes) is
held in a named constant citing #857, as #853's were, and the object carries
no `modelOnly`. **#857's four look calls are ruled** (thatch at 50 degrees,
no slate, jettied houses, a thatched saddleback), recorded in `HISTORY.md`.
**The thatch set is not picked, and the builder does not wait for it**:
Devon, 2026-09-28, "Build with stand-in". Every thatch surface takes
`materials.thatch()`, a stand-in from `rough_wood` (below), and the build,
the counts, the breaks and the stills proceed on it; every still with thatch
in it is labelled "stand-in thatch". Swapping the real set in later is one
5-row fetch, one line (`materials.THATCH_SET`) and the stills re-rendered. **Devon's four
picks on 4b's look notes** (#858): (a) the tapestry and watch-bill backs,
increment 6; (b) the dressed surrounds reading as rubble, this increment,
below; (c) `wood_planks`' board-end grid on the hall roof, left; (d) the
interiors' +11 to +11.5 stops, increment 7.

- **The count and the scope line.** Confirmed against `castle-plan.js` on
  `8a90b88` (`export-blueprint.mjs`, then `STAGE_OF`): 29 `mereford-*`
  pieces, 9 `wall` and 20 `decor`, as the scope line says, but only 8 of the
  9 are buildings. `mereford-churchyard-cross` is `kind: wall` because the
  plan builds it from `column-damaged.glb` with a collider; it is a stone
  cross here, not a run. Wykes's yard is 2 runs (`wykes-yard-north`,
  `-east`), the shed's deck `wykes-shed-roof` (a `wall` lifted on `base` 3,
  with no collider), `wykes-shed-pitch-1` and `-2`, and `floor-wykes-yard`;
  the scope's "3 runs" counted the deck as one. The stage also takes the 4
  town-wall runs and the 4 `town-tree-*`, which the scope line did not name:
  **43 pieces, 16 `wall`, 26 `decor`, 1 `ground`**. Not the stage's:
  `wykes-block`, `wykes-course-1` to `-3` and `wykes-slab` (`kind: prop`, so
  `props`), the shed's four posts `structure-pole-126` to `-129` and the
  yard's kit decor `ladder-130` to `tree-shrub-136` (`props`, increment 6).
  So the shed's deck floats until increment 6, as the lodge's does (#854's
  note 10), and the report says so. The objects, in build order, 33 of them
  carrying the 43 ids: `WALL_<id>` for `town-wall`, `town-wall-north`,
  `town-wall-south`, `town-wall-west`, `wykes-yard-north` and
  `wykes-yard-east`; `DECK_wykes-shed-roof`; `FLOOR_floor-wykes-yard`;
  `ROOF_wykes-shed-roof` (`planIds` the 2 shed pitches); `HOUSE_<id>` and
  `ROOF_<id>` for each of the 6 houses (`planIds` its 2 pitches);
  `CHURCH_mereford-church-nave`, `ROOF_mereford-church-nave` (`planIds` its 4
  pitches), `CHURCH_mereford-church-tower`, `ROOF_mereford-church-tower`
  (`planIds` `mereford-church-tower-pitch`); `CROSS_mereford-churchyard-cross`,
  `BARRELS_mereford-street-barrels`, `CRATE_mereford-street-crate`; and
  `TREE_<id>` for the 4 `town-tree-*` and `mereford-churchyard-tree`. Two more
  carry no `planId`: `LEAVES_town-wall` and `LEAVES_town-wall-west`. A `ROOF_`
  is named for the wall piece its pitches sit on. **Line 6 then counts 43
  pieces on `--only town` and 240 on `--only
  terrain,walls,towers,gates,buildings,town`** (5 terrain, 97 walls, 46
  towers, 9 gates, 40 buildings, 43 town). `STAGE_OF`, `check.py` and
  `allow.json` do not change. Correct the scope line to say so.
- **Which piece is which, by rule.** Recommend **constants in `town.py`, and
  a raise for any town piece no rule takes, naming it, as `buildings.py`
  does**: `RUNS = r'^(town-wall|wykes-yard-)'` (built from their colliders),
  `HOUSES = r'^mereford-house-'`, `CHURCH = r'^mereford-church-(nave|tower)$'`,
  `CROSS = 'mereford-churchyard-cross'`, a deck is any other `wall` with no
  collider of its own (`buildings`' `has_col` test), a pitch is a `decor`
  whose id ends `-pitch` or `-pitch-<n>`, and the tree, barrels and crate are
  found by the piece's `model` file name (`tree-large.glb`, `barrels.glb`,
  `detail-crate.glb`). A pitch belongs to the one `wall` piece whose box top
  equals the pitch box's foot within 1e-6 and whose plan rectangle holds the
  pitch's; none or two raises, naming the pitch. Every pitch in the stage
  has `rotationY` 90, which is a ridge along x; one whose `rotationY` is not
  90 or 270, or two pitches of one building that disagree, raises: no town
  roof runs along z on `8a90b88`, and a roof builder for both axes is code
  nothing exercises.
- **The seed and the draws.** Recommend **`common.seed("town")` as every stage
  has it, and each house and tree drawing from its own `rng =
  random.Random(f"town:{piece id}")`, never from the global `random`**. A
  str seed is hashed with sha512, so it is independent of `PYTHONHASHSEED`
  (#840), and a house's draws do not move when another house draws more or
  less. *This departs from the lead's "each house's index"*: an index moves
  every later house's look the day the plan adds one, and the id does not.
  A house's draws, in this order, one call each: (1) `frame =
  rng.choice(('square', 'close'))`; (2) `jetty = rng.choice((0.3, 0.45,
  0.6))`; (3) `tint = rng.randrange(4)`; (4) `door = rng.randrange(4)`, the
  street bay; (5) four `rng.random() < 0.5`, ground street windows by bay;
  (6) four `< 0.6`, upper street; (7) four `< 0.35`, ground rear; (8) four `<
  0.4`, upper rear; (9) two `< 0.5`, the west and east gable windows; (10)
  `chimney = rng.choice((None, 'west', 'east'))`. Then three fix-ups, in
  order: the door's bay loses its ground street window; a house with no
  upper street window takes one in bay `(door + 2) % 4`; and, going west
  from the gate along each row (`n1`, `n2`, `n3`; `s1`, `s2`, `s3`), a house
  whose tint equals the house before it takes `(tint + 1) % 4`. Bays count
  from the house's west end. Computed with Blender 5.2's own Python 3.13
  (and 3.14, which agrees), the six lines the build must print, `W` a window
  and `-` none, bays 0 to 3 west to east, gables west then east:

  | House | Frame | Jetty | Tint | Door bay | Ground street | Upper street | Ground rear | Upper rear | Gables | Chimney | Ridge top |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | `n1` | square | 0.6 | 3 | 3 | `WWW-` | `---W` | `W-W-` | `----` | `-W` | east | 9.383 |
  | `n2` | close | 0.45 | 0 (drew 3) | 3 | `W-W-` | `-W-W` | `---W` | `WWW-` | `-W` | none | 9.293 |
  | `n3` | square | 0.3 | 1 | 0 | `-WWW` | `--W-` | `WW--` | `WWWW` | `-W` | west | 9.204 |
  | `s1` | square | 0.45 | 0 | 2 | `WW-W` | `W-WW` | `---W` | `WWWW` | `--` | east | 9.293 |
  | `s2` | square | 0.45 | 2 | 3 | `W---` | `W-WW` | `----` | `-W-W` | `-W` | east | 9.293 |
  | `s3` | close | 0.45 | 3 (drew 2) | 1 | `W---` | `WWWW` | `W---` | `W-W-` | `-W` | east | 9.293 |

  A second `--only town` prints the same six lines; the report quotes both.
- **The house, in section.** Recommend **a solid, as the game's is (a house
  nobody enters is a block, #703 and `mereford-house-n1`'s comment), two
  storeys with a jetty to the street, its plaster face `FRAME_PROUD` 0.05 m
  inside the plan box so the timbers stand flush with the box's faces**. The
  street face is the box's z face nearer the road's centre line (`n*` at z
  -3, `s*` at z 3); the rear face is the other. `PLINTH` 0.3: the full box, y
  0 to 0.3, in `materials.DRESSED` (`medieval_blocks_02`, slot 2). The ground
  storey: y 0.3 to `FIRST` 2.6, the box less `FRAME_PROUD` on every side, in
  the piece's `material` (`plastered_wall_04`, slot 0). The upper storey: one
  `Solid.plate(axis='x')` from x a0 + 0.05 to a1 - 0.05, the pentagon (rear
  + 0.05, 2.6), (street' - 0.05, 2.6), (street' - 0.05, 5.0), (zr, apex),
  (rear + 0.05, 5.0), signs taken toward the house, where street' is the
  street face moved `jetty` toward the road, zr the middle of rear and
  street', and apex the thatch's underside at the ridge (below), so the
  gables are plaster to the thatch. Under the jetty, `JOIST` ends, 0.15 m
  square at 0.5 m centres along x (first 0.25 in from each end), from the
  street face to street', y 2.45 to 2.6, `TIMBER` (slot 1). The house holds
  its box on `min x`, `max x`, `min y` and the rear z face within
  `BOX_TOLERANCE` 0.01 (`buildings.check_box`), and the rear face is found
  from the road, not from the jetty code, which is what the sign break
  below catches. It stands past its box by the jetty (0.3 to 0.6 m, from
  2.45 m up) and the chimney. **Ruled by Devon (#857): "yes".**
- **The framing.** Recommend **a box frame of `buildings.TIMBER`
  (`rough_wood`, slot 1), every member 0.1 m deep from the box face inward,
  so 0.05 m proud of the plaster, imported and not copied**, per storey and
  face: bays `round(length / BAY)`, `BAY` 2.0, so a long face is 4 bays of 2
  m and a gable face 3 (6 m below, 6.3 to 6.6 m above); a `POST` 0.2 m wide
  at every bay line, 0.2 m square at a corner; rails 0.2 m tall unless
  given: a sill beam y 0.3 to 0.5, the ground head rail 2.4 to 2.6, on the
  street face a bressumer 2.6 to 2.85 at street', on the other three faces a
  girding beam 2.6 to 2.8, and a wall plate 4.8 to 5.0 round the upper
  storey. `frame` `square`: a mid rail per bay, 1.35 to 1.55 below and 3.7 to
  3.9 above, and one `BRACE` 0.15 m wide in each end bay of every face and
  storey, a straight strut from the corner post's inner edge at the upper
  rail's foot to the mid rail's top 0.9 m along; the mid rail and the brace
  are left out of a bay holding a door or window. `frame` `close`: studs 0.15
  m wide at `CLOSE` 0.5 m centres between the posts on the two long faces,
  rail to rail, the gables staying square; a stud crossing a window's span
  grown by 0.1 m keeps only its parts below the sill timber and above the
  head timber, and one crossing the door keeps only its part above the door
  head. Each gable carries a king post 0.2 m wide from the wall plate's top
  to the thatch's underside at zr.
- **Doors and windows.** Recommend **shut, as #851's gate and #855's walk
  doors are shut: the model is not walked, and a shut leaf needs no room
  behind it, where an opening in a solid block is the "6 m tunnel"
  `mereford-house-n1`'s comment refuses**. One door per house on the street
  face, in bay `door`: a leaf of `oak` (`MAT_wooden_gate` through
  `materials.ALIAS`, slot 3), 1.0 by 2.0 m from the plinth's top (0.3) to
  2.3, centred in the bay, from the plaster face out 0.03 m, so 0.02 m
  behind the posts' faces; a door head timber 2.3 to 2.45 across the bay;
  two `iron` straps (slot 4) 0.06 m tall, 0.01 m proud of the leaf, at 0.4
  and 1.8 m over the threshold, over 0.8 of the leaf's width from its west
  edge. A window is an opening's frame with its shutters shut: ground 0.8 by
  0.8 m, sill 1.0, head 1.8; upper 0.8 by 0.9, sill 3.4, head 4.3; gable
  (upper storey, the face's middle bay) 0.6 by 0.7, sill 3.5, head 4.2; each
  centred in its bay, with a sill timber 0.1 m tall under it and a head
  timber 0.1 m tall over it, each the opening's width plus 0.2, flush with
  the box face, and two shutters of `oak`, each half the width less 0.005,
  0.03 m proud of the plaster. The rear faces get windows and no door.
- **The plaster's tint per house.** Recommend **`materials.LOOK`'s
  `plastered_wall_04` gains `object_tint: True`, a Multiply by Object Info's
  Color after `warm`, and each `HOUSE_` sets `ob.color` from `PLASTER_TINTS`
  by its `tint`**: `(1.0, 1.0, 1.0)` (the LOOK cream as it is), `(1.0, 0.92,
  0.76)` (ochre wash), `(1.0, 0.88, 0.84)` (a pink wash), `(0.92, 0.94,
  0.96)` (a cool white). Every other object keeps Blender's default colour,
  `(1, 1, 1, 1)`, so `MAT_plastered_wall_04` on the gate-overs and the three
  `PLASTER_` rooms renders exactly as Devon passed it in 4b; the report
  quotes `WALL_west-gate-over`'s `color`. One material still (#854), and six
  houses of one tone is what the checklist's "one house forty times" asks
  about.
- **Roofs: thatch, not slate, and the rule.** Recommend **every pitched roof
  in the stage is thatch, with no list**: `data/lore.json`'s `the-quay` and
  `data/documents.json` say the toll-house at the quay's head is "the one
  building in Mereford with a slate roof", and `mereford-church-nave-pitch-1`'s
  comment already refuses slate for the nave on that line. The toll-house is
  rank 9's increment 3a and is not in this blueprint, so no roof here is
  slate. That covers the six houses, the nave, the tower's saddleback and
  Wykes's shed, which stands outside the gate but is a Mereford man's.
  **Ruled by Devon (#857): "tatch everywhere"** (his typo, quoted as typed).
  *A taste call for Devon on the tower*: a thatched saddleback on a stone
  tower is less usual than the nave's thatch; the recommendation keeps the
  rule whole rather than open a second fetch for one 4 m roof, and the named
  alternative is a shingle set, fetched after his yes. **Ruled by Devon
  (#857): "Thatch".**
- **Pitch, eaves, verges and what stands above the boxes.** Recommend
  **`THATCH_MIN_PITCH` 50 degrees: a roof takes the steeper of its pitches'
  own and 50 degrees; its underside through the wall's top outer arris at
  the pitches' foot height, as #855's lean-to sits on its wall; `THATCH`
  0.45 m thick measured vertically (0.29 m square to the slope); eaves
  `THATCH_EAVE` 0.4 m out from each wall line; verges `VERGE` 0.3 m past each
  gable end, stopped at the face of any town `wall` piece whose box the
  verge's box would enter (the shed's west end at the town wall's east face,
  x -62.5, and the nave's west end at the tower's east face, x -100); a
  ridge roll of 12 facets, radius 0.22 m, centred 0.05 m under the ridge
  top, the roof's length; slot 0 `materials.thatch()`.** Why 50: thatch sheds rain
  at 45 degrees and up and is laid at about 50, and the plan's 33.7 degrees
  (the kit's `roof.glb`) is a slate pitch; and `masonry.finish` writes `UVMap`
  by the face's dominant axis, so a slope steeper than 45 degrees takes the
  side projection and the straws run downslope, where at 33.7 the top
  projection lays them along the ridge. *A taste call for Devon*: the
  fallback is the plans' own pitch, one constant. **Ruled by Devon (#857):
  "50 sounds good".** The numbers (plan box
  tops in brackets): houses, half-span (6 + jetty) / 2, ridge underside and
  top 8.754 and 9.204 (jetty 0.3), 8.843 and 9.293 (0.45), 8.933 and 9.383
  (0.6), roll top 0.17 over those (the plan's 7.0); every eave's underside
  4.523 and top 4.973 at 0.4 m out; the nave, 7 + 4k, 11.767 and 12.217
  (10.0); the tower keeps the plan's 56.3 degrees (3 over 2, steeper than 50),
  18.0 and 18.45 (18.0); the shed, 3.3 + 3k, 6.875 and 7.325 (5.3). Model
  only, above the plan's boxes, under #857. The rule that holds the street:
  `town.py` raises if a house's jetty or street eave passes the road's box
  edge (z -2 or 2) by more than 1e-6, naming the house, the eave's z and the
  jetty; at green `n1`, jetty 0.6, puts its eave at exactly -2.0.
- **Chimneys.** Recommend **`CHIMNEY` 0.8 m square in `DRESSED` (slot 2),
  centred on zr at x a0 + 0.9 (west) or a1 - 0.9 (east), from y 5.0 to its
  roof's ridge top plus 1.0**, part of `HOUSE_`: from the North-west Tower's
  roof a stack is what tells six ridges apart.
- **The church.** Recommend **the nave and tower as solids with recessed
  openings, in their slug, `medieval_blocks_02` (slot 0), with the recess
  faces in `materials.dressing()` (slot 1) so an opening reads dark**. Each
  face that carries an opening is a core inset by `RECESS` 0.3 m plus a skin
  0.3 m deep, split along the face at each opening's edges: a strip with no
  opening is one box; a strip with one is a box from the foot to the sill
  (none for a door) and, above the springing, two convex quads per opening
  as `Solid.plate`s, (a, springing), (mid, apex), (mid, top), (a, top) and
  its mirror, so the head is pointed by two straight chords. Skins on the
  faces normal to z run the face's full length; a skin on a face normal to x
  stops `RECESS` short of each end that meets another skin, so no two skins
  share a coplanar face. The core is cut by `masonry.split_boxes` at each
  opening's edges and sill and apex, and `Solid.paint` gives slot 1 to every
  face whose centre lies within an opening's span and sill-to-apex band and
  within `RECESS` of the outer face (back, reveals, chord soffits). Openings,
  `(width, sill, springing, apex)`: `LANCET` (0.7, 2.2, 4.6, 5.2) at x -96,
  -92 and -88 on the north face and -93 and -89 on the south; `EAST_WINDOW`
  (1.4, 2.4, 5.2, 6.2) at z -18 in the east face; `NAVE_DOOR` (1.4, 0, 2.4,
  3.1) at x -97 in the south face, its leaf of `oak` (slot 2) the opening's
  outline standing 0.06 m off the core; `BELFRY` (0.5, 12.8, 13.9, 14.3)
  centred on each of the tower's four faces, whose east one clears the
  nave's ridge roll (12.387) by 0.41 m. The nave's gables are one stone
  triangle prism along x over its whole length, (-22, 7), (-18, 11.767),
  (-14, 7); the tower's the same, (-20, 15), (-18, 18.0), (-16, 15). No
  porch, buttresses or chancel: the plan has none. Each `CHURCH_` holds its
  box within 0.01 on `min x`, `max x`, `min z`, `max z` and `min y`.
- **The town wall and its gates.** Recommend **the four runs through
  `walls.build_run(s, p, cols, None, batter=False)`, imported, on
  `masonry.colliders_of`, so the two gates are the plan's openings exactly
  (4 m wide at z -2 to 2, flat-headed at 5.5 m, 3 m deep), plain-topped with
  no parapet (#705), undressed since the slug is `DRESSED`; and in each gate
  two open leaves, one object per gate, `LEAVES_<run id>`, `modelOnly:
  "#857"`**. Each leaf is `oak`, 2.0 m (half the opening) by 5.4 m (the head
  less 0.1), 0.1 m thick, standing 0.02 m off a passage side (z -1.98 to
  -1.88 and 1.88 to 1.98), from a hinge line 0.3 m inside the gate's outer
  face toward the town: the outer face is the run's x face farther from the
  town's centre, the middle of the four runs' union (x -96, z -2), so
  `town-wall`'s leaves are x -64.8 to -62.8 and `town-wall-west`'s -129.2 to
  -127.2; two `iron` straps 0.08 m tall and 0.01 m proud on the passage side
  at y 1.0 and 4.2. Open, because the road runs through and the model is a
  day. The flat 4 m stone head is the plan's (#500); if the still reads it
  as impossible stone, the named fix is a timber lintel face, not a taller
  opening than the colliders.
- **Wykes's yard.** Recommend **the two runs as the town wall's are;
  `DECK_wykes-shed-roof` as its box, x -62.5 to -54, y 3 to 3.3, z -16 to
  -10, in its slug `old_planks_02`, as `DECK_masons-lodge-roof` is;
  `FLOOR_floor-wykes-yard` as its box from `buildings.GROUND_Y` (-0.1 to
  0.005) in `stone_pavers`; `ROOF_wykes-shed-roof` thatched as above, x -62.5
  to -53.7, eaves z -16.4 and -9.6, with a gable of `buildings.ROOF_BOARDS`
  boards `buildings.GABLE` 0.05 m thick at the deck's east end (x -54.05 to
  -54), the triangle (-16, 3.3), (-13, 6.875), (-10, 3.3), in slot 1**. The
  west end needs none: the town wall closes it.
- **The cross, the barrels and the crate.** Recommend **generated, each held
  to its box on every face within 0.01, no fetch**. `CROSS_`: steps 0.8 m
  square 0 to 0.3 and 0.55 m square 0.3 to 0.6, a shaft 0.3 m square 0.6 to
  4.0, arms `CROSS_ARM` 0.8 m along x by 0.3 m in z at y 3.2 to 3.45, in
  `materials.dressing()` (the plan's dressed stone, #541, squared by #858). `BARRELS_`: two barrels of 16
  facets at x = box x0 + dx / 4 and x0 + 3 dx / 4 (-72.37 and -71.63), z the
  box's centre, the box's height, belly radius min(dx / 4, dz / 2) = 0.37,
  ends 0.8 of the belly, rings at 0, 0.10, 0.16, 0.5, 0.84, 0.90 and 1.0 of
  the height with radius end + (belly - end) sin(pi t), `rough_wood` (slot
  0) and the two hoop bands, 0.10 to 0.16 and 0.84 to 0.90, `iron` (slot 1).
  `CRATE_`: a cube of side dx / (|cos r| + |sin r|) = 0.750 m, 0.75 m tall,
  turned by the piece's `rotationY` r (-20) about the box centre in three's
  sense (x' = x cos r + z sin r, z' = -x sin r + z cos r), 12 edge battens
  0.06 m square inside the outline in `rough_wood`, panels the cube shrunk
  0.02 m a side in `wood_planks`. A Poly Haven barrel or crate is increment
  6's call for the kit decor; two dressings at 30 m are not worth a fetch
  before it.
- **The trees.** Recommend **`tree_small_02` (already cached, #845), its
  `LOD1` mesh through `terrain.append_model`, placed at the piece's
  `transform` x and z, y 0 less terrain's 0.05 sink, turned by the piece's
  `rotationY` about Blender Z (#843), no lean, height
  `rng.uniform(*TOWN_TREE_METRES)` with `TOWN_TREE_METRES = (4.0, 4.6)`, scale
  height / 4.564 (the mesh's own), `TREE_<id>` with `planId` the id, sharing
  the template's mesh, its leaf materials through `materials.tint_leaves`**.
  Heights: `town-tree-1` 4.159, `-2` 4.204, `-3` 4.190, `-4` 4.275,
  `mereford-churchyard-tree` 4.186. The kit trees are 1.7 m and a Poly Haven
  one is not; 4.0 to 4.6 is what clears: measured on the cached mesh with
  each tree's own yaw, `town-tree-2`, which stands in Wykes's yard at (-52,
  -10), has its canopy's box reach x -53.58 at 4.204 m, 0.12 m clear of
  `ROOF_wykes-shed-roof`'s verge at -53.7, and at 5.0 m it is into the shed.
  `town.py` raises if a `TREE_`'s world bounding box meets the world
  bounding box of any other object the stage built, `FLOOR_` and `TREE_`
  aside, naming both, checked in build order. `terrain.append_model` gains
  a module memo, `_APPENDED = {asset: templates}`, returning the first
  call's templates on a second call: a second append of the same `.blend`
  renames the mesh `tree_small_02_LOD1.001`, `MODELS`' pattern deletes it,
  and the call raises. This is the one place `town` shares data with
  another stage, and it is the template mesh, not a placed object: under
  `--only town` the town's call is the first and appends.
- **Materials: nothing fetched in increment 5.** *Amended 2026-09-28
  (#857, #858)*: this call said "one new set, the thatch", with `LIBRARY`
  and `SWAP_RISE` gaining it after Devon's pick. He has not picked, and
  ruled "Build with stand-in"; the two calls below replace that. The set is
  still his to pick among `reed_roof_03` (2.5 m, 11,799,312 bytes, the
  lead's recommendation), `reed_roof_04` (2.5 m, 11,072,326 bytes) and
  `thatch_roof_angled` (0.54 m, 15,012,012 bytes), 2k jpg, five maps, 5
  `sources.json` rows. `PLAIN`, `ALIAS`, `LIBRARY` and `SWAP_RISE` gain
  nothing. Reused, unfetched: `plastered_wall_04` (with `LOOK`, #854, and
  `object_tint`), `rough_wood` (`buildings.TIMBER`, and the stand-in
  thatch), `medieval_blocks_02` (`DRESSED`), `stone_pavers` (the floor and,
  from #858, `dressing()`), `wooden_gate` and `rusty_metal` through `oak` and
  `iron`, `old_planks_02`, `wood_planks` and `tree_small_02`. `CREDITS.md`
  gains nothing in increment 5, since every set is already credited, and
  one line at the swap.
- **The thatch stand-in (#857).** Recommend **`materials.THATCH_SET =
  ('rough_wood', 2.0, 0.5, {'warm': (1.0, 0.88, 0.66, 1.0)})`, the set,
  metres per repeat, rise and look in one tuple, and `materials.thatch()`
  building `MAT_<set>_thatch` from it once per file through
  `box_material(name, set, size, rise=rise, **look)`, as `dressing()` does;
  every thatch face in `town.py` is `thatch()`, never `library()`**. The
  constant is named `THATCH_SET` because `town.py`'s `THATCH` is the 0.45 m
  thickness. The thatch is not a `LIBRARY` entry: `LIBRARY` is the slugs a
  blueprint `material` names, and no pitch names thatch; so `SWAP_RISE`
  gains nothing and the rise lives in the tuple. **Why `rough_wood`**,
  measured on the cached 2k maps as diffuse times AO: linear luminance
  0.103, mean sRGB (0.417, 0.383, 0.341), hue 33 degrees, saturation 0.18, a
  grey-brown between straw and weathered reed, and its grain is long fine
  splits running the image's height, which the side projection turns
  downslope as the straws should run. Refused: `wood_planks` (saturation
  0.53, orange, board joints, and 4b note (c) is its grid), `old_planks_02`
  (boards), `sparse_grass` (a `GROUND` set, luminance 0.045, saturation 0.73
  with green patches: a turf roof), and a flat `LOOK` tint, which has no
  fibre and is the "brown felt" the checklist asks about, built in. **Why
  2.0 m and not its real 0.5**: at 0.5 the splits are cracks in a board and
  repeat about 9 times down a house's 5.6 m slope (3.6 m out from the ridge
  at 50 degrees, 0.65 m a repeat after the stretch below); at 2.0 they are 4
  times longer and read as runs of straw at the 5 to 80 m the stills see
  roofs from. This is
  the library's one size that is not the set's real size, and the tuple's
  comment says so and cites #857. **The warm**, a multiply as `LOOK`'s is,
  pulls the grey toward straw, blue cut most, and lands at about 0.092
  linear luminance. `MAT_rough_wood_thatch` is its own material, so
  `buildings.TIMBER` and `MAT_rough_wood` do not change; it loads the same 5
  images (`check_existing`), so check line 4's image count does not move for
  it and its texture node count rises by 10. **The projection under the
  stand-in, unchanged**: a 50 degree slope's normal has |horizontal| 0.766
  against vertical 0.643, so `masonry.finish` and the box projection both
  take the side (x, height) projection, the image's height runs downslope,
  and the repeat is stretched 1 / sin 50 = 1.305 along the slope: 2.61 m for
  the stand-in, 3.26 m for a 2.5 m reed set. The tower's 56.3 degrees is the
  same projection, stretched 1.202. `town.png` and `town-street.png` are
  where Devon judges it. **The rise under the stand-in is 0.5**, as
  `rough_wood`'s `SWAP_RISE` is, since grain has no course. **At the swap**:
  fetch the picked set's 5 rows as increments 2 to 4 did; set `THATCH_SET`
  to `('reed_roof_03', 2.5, 0.0, {})` or `('reed_roof_04', 2.5, 0.0, {})`,
  rise 0 because a reed roof's butt ends lie in horizontal courses and a
  vertical shift would step them at every patch seam, as it would brick's,
  or `('thatch_roof_angled', 0.54, 0.5, {})`, rise 0.5 unless its diffuse
  shows courses, which the lead checks by eye on the fetched map; the look
  starts empty, and a new-gold read is fixed in the tuple's look; re-render
  the four town stills without the label; `CREDITS.md` gains one line. No
  other file changes.
- **The dressed stone round an opening (#858, amending #854).** Devon's pick
  on 4b note (b): fix in 5. **Diagnosis: the set, not the scale, and the
  tint only for the red.** `medieval_blocks_02`'s 2k diffuse is random
  rubble: irregular round-edged stones from about 0.05 to 0.35 m across at
  its 1.5 m size, in mortar that is about a third of the face, with no
  course and no squared edge, and a red-orange stone in each tile. At any
  scale it is rubble in mortar: at 3.0 m the stones are 0.1 to 0.7 m and
  still round. The red is the tint: `DRESSING`'s Value 0.6 keeps its hue (27
  degrees) and saturation (0.38, mean sRGB 0.673, 0.531, 0.416, the most
  saturated stone in `LIBRARY`), so the darkened sand goes red-brown. #854
  took the set on the plan's word "dressed stone" (#541) and measured its
  luminance, not its shape. **Recommend `DRESSING = ('stone_pavers', 1.2)`,
  one line, no fetch**: `stone_pavers`' diffuse is squared blocks in
  straight courses, four courses to its 2.0 m tile, so courses 0.49 m and
  blocks 0.55 to 0.65 m long with 0.03 m joints, hue 27, saturation 0.25,
  luminance 0.090; Value 1.2 brings it to 0.108, #854's own target against
  the slates' 0.107, so the step at the arris stays light. Its courses run
  the image's width, so the side projection lays them level on a jamb and a
  band, and a soffit (top projection) takes them as a floor does; rise stays
  0 (coursed). The material becomes `MAT_stone_pavers_dressing`, distinct
  from the floors' `MAT_stone_pavers`. `materials.py` gains, beside `ALIAS`'s
  check, `DRESSING[0]` must be in `LIBRARY`, raising `materials: DRESSING
  names '<slug>', which is not in LIBRARY`. **`DRESSED` stays
  `medieval_blocks_02`**: it is the plan's slug (#541), and a rubble church,
  town wall, plinth and chimney with squared dressings is what a parish
  church and a town wall were; `gates.py` and `buildings.py` still leave a
  run or arch already in `DRESSED` unpainted. On the church, the recesses'
  backs, reveals and chord soffits are pavers at 0.108 against the walls'
  0.178, 0.61 of the wall, which is the dark the church call asks for.
  **The cross takes `dressing()`, not `library(DRESSED)`**: a 0.3 m shaft in
  0.35 m rubble is not a cross, and the plan's "dressed stone" means
  squared. The 4b objects this changes, with no vertex moved and the painted
  face counts unchanged (`clerk-office-south` 47, `kitchen-south` 59,
  `great-hall-north` 134, `ARCH_west-gate` 78, `ARCH_east-gate` 38,
  `ARCH_barbican-outer` 78): every run with a dressed opening and the three
  rubble arches. Stills: see the review stills below.
- **The module split.** Recommend **`town.py` new, reading the blueprint and
  never another stage's objects, so `--only town` builds alone; `materials.py`
  gains `THATCH_SET` and `thatch()` (#857), `DRESSING`'s new set and its
  `LIBRARY` check (#858), and `object_tint` in `_maps`, `box_material` and
  `LOOK`; `terrain.py` gains `_APPENDED`;
  `buildings.check_box` gains `stage='buildings'`, the prefix of its message,
  so `town.py` imports it rather than copying it; `town.py` imports
  `walls.build_run`, `buildings.TIMBER`, `ROOF_BOARDS`, `GABLE`, `GROUND_Y`,
  `BOX_TOLERANCE` and `check_box`, and `materials.DRESSED`**. `common.py`,
  `check.py`, `build.py`, `allow.json`, `walls.py`, `towers.py` and `gates.py`
  do not change. The stage prints one line per house (the table's
  columns), one per roof (pitch in degrees, eave z each side, ridge top,
  verge each end), one per church object, the leaves' x spans, and each
  tree's height and its nearest object's margin.
- **The breaks from green** (#34), each quoted in the report: (1) skip
  `HOUSE_mereford-house-s2`'s `finish`: `FAIL line 6 coverage: 1 piece(s)
  nothing realises: mereford-house-s2`; (2) skip `ROOF_mereford-church-nave`:
  line 6 names `mereford-church-nave-pitch-1` to `-4`, all four; (3)
  `allow.json` `{"town-tree-3": ""}`: `FAIL line 6 coverage: allow.json
  entries with no reason: town-tree-3`; (4) `THATCH_EAVE = 0.5` in
  `town.py`: the build raises naming `mereford-house-n1`, eave z -1.9 past
  the road's edge at -2, jetty 0.6; (5) flip the street side's sign in the
  jetty code only: the build raises from `check_box` naming
  `HOUSE_mereford-house-n1`, off by 0.700 m at `min z -9.700 against
  -9.000`. *Corrected 2026-09-28 (#859)*: this said 0.600 m at -9.600,
  which is the jetty alone; n1's east chimney is centred on zr, the flipped
  jetty moves zr to -9.3, and the 0.8 m stack's far face lands at -9.7. The
  first run gave 1.153 m at -10.153, from a brace overrunning a 0.6 m
  gable, fixed by clamping each brace to its bay with no change at green; (6) `CROSS_ARM = 1.0`: `check_box` raises naming
  `mereford-churchyard-cross`, off by 0.100 m at `min x -92.500 against
  -92.400`; (7) `TOWN_TREE_METRES = (5.0, 6.5)`: the build raises naming
  `TREE_town-tree-2` (5.509 m, its box about x -54.07 to -50.56) and
  `DECK_wykes-shed-roof`, the first object in build order its box meets;
  (8) skip `LEAVES_town-wall`: line 6 stays green by design, and the report
  says so in one line (a #857 object realises no plan piece; the still holds
  it); (9) `DRESSING = ('stone_paver', 1.2)`: the build raises on importing
  `materials`, `ValueError: materials: DRESSING names 'stone_paver', which is
  not in LIBRARY`; (10) `THATCH_SET = ('reed_roof_03', 2.5, 0.0, {})` with no
  fetch: `--only town` raises at the first `thatch()`, `KeyError: 'sources.json
  has no row reed_roof_03:diff'`, which is the proof the swap cannot land
  without its 5 rows. Each is restored before the next.
- **The review stills.** Recommend **four, from uncommitted scratch cameras
  as #848 to #856's were, of `partial/terrain+walls+towers+gates+buildings+
  town.blend` (so the World, the road and the pad are in them), Cycles 1920
  by 1080, 24 mm, 128 samples with the denoiser, all four exterior (#855),
  Film exposure auto-probed to a median display value of about 0.35 and
  given per still**; before rendering, a Material Preview capture over MCP
  from each eye in Devon's live Blender (GUIDE and MARKERS hidden, overlays
  off, scene World) to check the frame. `town.png`, eye (-38.5, 13.7, -13.6)
  at (-82, 3, -4): the North-west Tower's roof, which is `tools/shot-yard.mjs`'s
  `4-nw-tower-roof-road` eye and the one place the game shows the town
  (#727, #728); it judges the checklist's line, a town or one house six
  times, roofs and chimneys over a wall, with the tower's own merlons in the
  foreground as the player has them. `town-gate.png`, eye (-50, 1.7, 1.0) at
  (-64, 3.5, -2): the road to the east gate, which no player stands on (as
  `gates-outer.png` was); it judges the wall's stone, the flat head, the open
  leaves, the yard's walls and the shed and its floating deck. `town-street.png`,
  eye (-67, 1.7, 0.5) at (-95, 4, -1), inside the gate: it judges the jetties,
  framing, shut doors and shutters, the tints and the thatch eaves, with the
  church tower over the north row about 23 degrees up, inside the frame's 22.9
  degree half-height above a 4.7 degree pitch. `town-church.png`, eye (-76,
  1.7, -11.5) at (-98, 7, -17.5), between the north row's backs and the nave:
  it judges the recessed lancets and door, the thatched nave and saddleback,
  and the cross. **All four carry thatch and are labelled "stand-in thatch"**
  in the file name (`town-standin.png` and so on) and in the report's line
  for each, and are rendered again under their plain names at the swap
  (#857). **And two re-renders of 4b for #858**, so Devon judges the dressing
  against the stills he flagged: `gates-dressed-5.png` and
  `buildings-4b-5.png`, from 4b's own cameras, lens, 128 samples and
  exposures (+3.5 and +2.5) exactly, of `partial/terrain+walls+towers+gates+
  buildings.blend` rebuilt after the `materials.py` step, so the pair
  differs from 4b's only by `DRESSING`. They show the west arch's jamb and
  soffit and the outer-ward dressed doors and windows. `buildings-hall-4b` is
  not re-rendered: its dressing is the same material on the hall's inner
  faces, a 1024-sample interior at +11.5 stops is cost with nothing the two
  exteriors do not show, and the interiors re-render under increment 7's
  sun (note (d)). `buildings-dormitory` shows no dressed opening. Six stills
  in all.

**Increment 5's look fixes** (architect, 2026-09-28, against `51ec045`,
where #859 was the last; the lead's read of #859's stills, items (2) and
(3), after Devon's "Make your best call"). Class S from here: every number
is below, no `save.js` change, no suite line moves. Measured on the cached
2k maps, "luminance" is linear diffuse times AO as #854 and #858 measured
it, "hue" and "saturation" are of the mean colour in sRGB, and the tints
were computed by applying the Hue/Saturation/Value node's own sums to every
texel in linear, as Blender does. Item (1), the thatch, waits on Devon's
pick (#857); item (4) needs nothing.

- **The town wall's and the church's stone: rise 0.5 and a tint, no scale
  change (#860, amending #854's "leave" on #852 (e)).** **What the maps
  say**: `medieval_blocks_02` is diffuse sRGB (0.686, 0.547, 0.440), hue
  26, saturation 0.36, luminance 0.180, against `castle_wall_slates`' hue
  39, saturation 0.24, luminance 0.109; the render's wall in
  `town-gate-standin.png` samples at hue 25 to 26, saturation 0.29 to 0.33,
  which is the pink. Red-orange texels (hue under 22, saturation over 0.45)
  are 0.8% of the map, so the cast is the whole set's salmon, not its one
  red stone. The repeat: the map's row means have a coefficient of
  variation of 0.125 against 0.080 for its column means, with a dark mortar
  band at 0.02 of the tile at 0.67 of the mean; the slates' figures are
  0.154, 0.084 and 0.68. So the set carries a horizontal band every 1.5 m
  as the slates do, and `SWAP_RISE` gives it rise 0, so `_maps`' B sample
  moves 0.37 or 0.61 of a tile sideways and never up: every patch keeps
  A's band heights, the bands run the full 64 m, and the few large stones
  on that grid of 1.5 m rows read as diagonals under perspective. That is
  #852 (e)'s own diagnosis ("their courses keep a rise of 0"), and
  `SWAP_RISE`'s comment files the set with brick as "coursed" on its name;
  #858 found it is random rubble with no course. **Recommend**:
  `SWAP_RISE['medieval_blocks_02'] = 0.5`, as the slates, `defense_wall`
  and `plastered_wall_04` have, and `LOOK['medieval_blocks_02'] = {'tint':
  {'Hue': 0.52, 'Saturation': 0.6, 'Value': 0.65}}`, which takes it to hue
  31, saturation 0.20, mean sRGB (0.451, 0.409, 0.362), luminance 0.144.
  The Value is 0.65 and not higher because desaturating in linear lifts
  the two lower channels: Saturation 0.6 at Value 0.8 leaves luminance at
  0.177. **Scale stays 1.5 m**: `LIBRARY` holds each set's real size
  (#849) and the stand-in thatch is its one labelled exception (#857); a
  larger tile repeats fewer times (43 along the town wall's 64 m at 1.5, 26
  at 2.5) but draws the same banded grid larger, and a simulated 24 by 8 m
  face under `_maps`' swap gave a one-tile autocorrelation of 0.61 to 0.76
  at 1.5, 2.0 and 2.5 m alike, so size is not the lever. The named
  fallback, if `town-gate-standin-fix.png` still shows the diagonal, is
  `LIBRARY['medieval_blocks_02'] = 2.5` as a second labelled exception,
  which needs Devon's yes. **It reaches the castle too, on purpose**:
  `LOOK` and `SWAP_RISE` act inside `library()`, and `MAT_medieval_blocks_02`
  is one material wherever the slug is (#854's rule for the plaster), so
  the fix lands on the 7 castle pieces in the set (`cross-wall-north` and
  `-south` in `walls`; `kings-hall-south`, `steward-chamber-north` and
  `-east`, `chapel-nave-north` and `-east` in `buildings`) as on the 6 town
  runs, the church, and the houses' plinths and chimneys. A town-only copy
  would give the plan's one slug two looks, and #852 (e) was raised on the
  castle's faces first. `dressing()` is `stone_pavers` (#858) and does not
  change: the church's recesses stay at 0.108 against a wall now at 0.144,
  0.75 of it where #858 had 0.61, still the darker. **Line 4 does not
  move**: the second sample already existed before this fix, because
  `SWAP_RISE.get(asset, 0.0)` returned 0.0 for `medieval_blocks_02` and
  sample B built regardless of rise; #860 only moves B's Location z from
  0 to 0.5, repositioning an existing node rather than adding one.
  Measured after the fix, unchanged from baseline: 4b builds 202/127 and
  115/60, the full build 212/127, `--only town` 100/50 (texture nodes /
  images).
- **Timber: darker, warmer and matte (#861).** **What the maps say**:
  `rough_wood` is diffuse sRGB (0.428, 0.395, 0.352), hue 34, saturation
  0.18, luminance 0.105, roughness mean 0.51; the render's posts and
  girding beams in `town-street-standin.png` sample at saturation 0.07 to
  0.13, below the map's, which is the sky mirrored off a surface at 0.51,
  the fault `MUD_ROUGH` exists for on the mud. **Recommend**:
  `LOOK['rough_wood'] = {'tint': {'Hue': 0.5, 'Saturation': 1.0, 'Value':
  0.5}, 'warm': (1.0, 0.78, 0.55, 1.0), 'rough_min': 0.75}`, which takes it
  to mean sRGB (0.272, 0.219, 0.160), hue 32, saturation 0.41, luminance
  0.043: weathered oak, 3.6 times darker than the plain plaster (0.157) and
  2.3 times darker than the darkest tint below. `box_material` gains
  `rough_min=None` and passes it to `_maps`, which already takes it, so the
  key works from `LOOK` like the other four. **Reach**: every
  `materials.library('rough_wood')`, which is `buildings.TIMBER` (the hall
  trusses, every #853 beam, `PLATE_steward-chamber`, the louvre's frame)
  and the town's frames, joists, king posts, window and door timbers,
  barrels and crate battens. One material per set, and a castle truss is
  the same oak as a house post. `MAT_rough_wood_thatch` does not change:
  `thatch()` builds from `THATCH_SET`'s own look, not `LOOK`, so the
  stand-in stays exactly #857's. The castle's timber is interior bar the
  louvre frame and the plate, and interiors re-render under increment 7's
  sun (#858 (d)), so no castle still is taken for it.
- **The plaster tints: four, far enough apart, assigned as now (#861).**
  **What was wrong**: `PLASTER_TINTS` multiplies `LOOK`'s cream, and
  computed as CIE Lab colours the four #857 values sit 1.6 to 6.1 apart
  (dE76), the closest pair, 0 (white) and 3 (cool white), at 1.6, which is
  under what an eye tells apart side by side. **Recommend**:
  `PLASTER_TINTS = [(1.0, 1.0, 1.0), (1.0, 0.80, 0.48), (0.95, 0.66, 0.58),
  (0.60, 0.64, 0.66)]`: limewash as passed (luminance 0.157, L* 46.6), a
  yellow ochre wash (0.130, hue 38, saturation 0.40), a red ochre wash
  (0.114, hue 22, saturation 0.32) and an unwashed grey daub (0.099, hue 46,
  saturation 0.10). Pairwise 9.2 to 15.7 dE76, the closest now white and
  grey at 9.2, which is 5.75 times the old closest; the four also step down
  in L* (46.6, 42.8, 40.2, 37.7), so they separate in a grey still too.
  **Four, not six**: the draw is `rng.randrange(4)`, and `randrange(6)`
  would draw differently and move every later draw, so the increment 5
  table would change; four already gives six houses no equal neighbour.
  **Assignment unchanged**: draw, then #857's fix-up going west along each
  row, so the table's tints stand, n1 3, n2 0, n3 1, s1 0, s2 2, s3 3: no
  two neighbours in a row share one, the three pairs across the street
  (n1 and s1, n2 and s2, n3 and s3) differ, and all four are used. From the
  North-west Tower's roof what shows is the three north gables and the
  chimneys, grey, white and ochre. Objects other than the houses stay
  white, so the gate-overs and the three `PLASTER_` rooms do not change.
  **The rail**: `town.py` gains `TINT_APART = 0.15`, and raises at import
  if any two `PLASTER_TINTS` are closer than that as RGB triples, naming
  the closest pair; the new closest is 1 and 2 at 0.179, the old was 1 and
  2 at 0.089, so the constant sits between them.
- **Breaks for the fixes** (#34), from green, each restored: rerun (9) and
  (10), since `materials.py`'s import checks and `thatch()`'s call into
  `box_material` are what the fixes touch, and quote both unchanged. New
  (11): set `PLASTER_TINTS` back to #857's four; the build raises on
  importing `town`, `ValueError: town: PLASTER_TINTS 1 (1.0, 0.92, 0.76) and
  2 (1.0, 0.88, 0.84) are 0.089 apart, under TINT_APART 0.15`. Breaks
  (1) to (8) move no vertex and are not rerun. `SWAP_RISE` and `LOOK`'s
  values get no break: they are looks, and #53 makes the stills the check.
- **The stills for the fixes.** Six, as #859's were (Cycles OPTIX,
  1920x1080, 24 mm, 128 samples, denoiser, all exterior). **The castle's
  pair first**, before `materials.py` is touched: `blocks-inner-before.png`,
  eye (18, 1.7, 1) at (2, 4, -2), from the inner ward's open ground (no
  piece's box holds the eye; the garden props stand at z 3.6 and up), of
  `partial/terrain+walls+towers+gates+buildings.blend`, exposure probed to
  a median display value near 0.35; it frames `kings-hall-south`'s 20 m
  face, the cross-wall's east face with the porter gate, and
  `steward-chamber-north`. After the fixes, `blocks-inner-fix.png` from the
  same eye at the same exposure, so the pair differs by material alone; a
  Material Preview capture over MCP from that eye before either, to check
  the frame. **Then the four town stills again**, from #859's cameras at
  #859's exposures held, not re-probed (-0.5, -0.5, +2.5, -0.5), so Devon
  compares each against its pair: `town-standin-fix.png` (tints on the
  gables, the chimneys, the walls from above), `town-gate-standin-fix.png`
  (the rise and the tint over the town wall's longest face, where the
  diagonal was worst), `town-street-standin-fix.png` (the timber, the
  tints, the plinths) and `town-church-standin-fix.png` (the church's
  stone and its recesses). Each still with thatch keeps the "stand-in"
  label. Not re-rendered: `gates-dressed-5.png` and `buildings-4b-5.png`,
  which frame no `medieval_blocks_02` face and no timber beyond the
  louvre's frame; the interiors, which wait for increment 7.
- **The swap, by Devon's ruling of 2026-09-28.** The thatch is
  `reed_roof_04` ("Thatch: reed_roof_04"), `THATCH_SET = ('reed_roof_04',
  2.5, 0.0, {})`, its 5 rows fetched and the stand-in retired; the stone
  is `medieval_blocks_02` at 2.5 m ("yes for stone at 2.5"), #860's
  fallback, the second labelled exception to #849.

**Increment 6's open calls** (architect, 2026-09-28, against `5ffc1e2`, where
#862 was the last; decided as #863 to #868). Every number is in the game's
frame unless it says **local**, which is a kit file's own frame (x across, y
up, z toward its front, origin where the file has it) in metres at scale 1,
times the piece's `scale`. Measured on this branch, not predicted: a fresh
`blueprint.json` (427 pieces), `_source/castle_props.blend` opened by a
background Blender 5.2.2 from factory startup, the Kenney files through
`test/gltf.mjs`'s `partsOf`, the cached 2k maps, `api.polyhaven.com/files/<id>`
and `/info/<id>`, and three green builds of today's code (line 4 below).
Nothing `props.py` adds is model-only: every object it makes realises one
piece, so no `modelOnly` and no `allow.json` entry.

- **The count and the scope line.** `STAGE_OF` gives the stage **187 pieces,
  107 `prop` and 80 `decor`**. The 107 are 75 of Devon's rows (71 files;
  `pew-section` four times, `wall-torch-sconce` twice), 12 Poly Haven rows (9
  assets) and **20** `builtProps`, not 21: the 21st, `walk-bar`, has been
  `gates`' since increment 3. The 80 `decor` are the kit's, 14 files. 54
  carry `noCollide` true (36 Devon, 4 Poly Haven, 11 built, 3 kit).
  Recommend **one object per piece, named `PROP_<piece id>`, carrying `planId`
  and `noCollide` from the blueprint (#843), in the `PROPS` collection, built
  and checked in blueprint order** (kit 80, Poly Haven 12, Devon 75, built
  20), so a break names the first piece in that order. **Line 6 counts 187
  on `--only props` and 427 on `--only
  terrain,walls,towers,gates,buildings,town,props`**, which is every piece
  in the blueprint (5 + 97 + 46 + 9 + 40 + 43 + 187). The pulpit's id is
  `nave-pulpit`, so the object is `PROP_nave-pulpit`; the acceptance's
  `PROP_pulpit` is corrected. `props.py` reads the blueprint and never
  another stage's objects, so `--only props` builds alone.
- **Devon's 75: out of the file (#863).** Measured: `castle_props.blend`
  holds 85 collections, one per file, each with exactly one root, an EMPTY
  named as the collection, laid out in browse rows (`pulpit` at Blender (2.935,
  15.0, 0)), its meshes children under it (86 mesh objects across the 71
  placed files; the pulpit's mesh is `pulpit.001`, the crane's `crane` and
  `cauldron`). Recommend **append by collection name, the file stem, not by
  object name**: `libraries.load(path, link=False)` with `collections` set to
  the 71 stems of the rows' `model`s; every appended object moved into `PROPS`
  and the 71 appended collections removed; the root renamed `PROP_<piece
  id>`, `location = to_blender(position)`, `rotation_euler = (0, 0,
  radians(rotationY))`, `scale` the piece's; a second row of a file is a copy
  of the root and its tree sharing mesh data (`ob.copy()` down the tree,
  `matrix_parent_inverse` copied). Object names are the wrong key: `altar` is
  the empty and `altar.001` its mesh, and a stem is what the plan's `model`
  carries. **Measured with exactly this rule**: all 75 land within 0.0001 m
  of their blueprint boxes on every face. `props.check_tree(root, piece,
  push)` holds that in the build: the union of every mesh descendant's
  `bound_box` through `matrix_world`, against the blueprint box moved by the
  piece's plaster push (below), within `buildings.BOX_TOLERANCE` 0.01 on every
  face, raising in `buildings.check_box`'s words with stage `props`. The 14
  files the game does not place stay out, for #833's reasons.
- **Devon's 75: re-materialed (#863, amending "How the props are
  re-materialed" above and #830's "nothing runs these files").** Measured:
  every placed mesh carries `castle_props` (84) or `castle_props_cutout` (2,
  the cobwebs), both reading one 128 px atlas, `castle_props_atlas`, packed
  in the file, Closest; 11,883 faces, and every face's UV centroid lies inside
  one named atlas region; 103 regions in use. Recommend **per face by the
  region under its UV centroid, into one of five PBR kinds or kept on
  Devon's atlas, with Devon's colour carried into the PBR material**:
  - **The names.** `props.py` imports `tools/props/atlas.py` (sys.path, read
    only) for `SWATCHES`, `SW`, `T16`, `T32` and `IMG`, which it paints
    deterministically at import, and raises unless `IMG` equals the appended
    image's pixels (rows flipped, Blender stores them bottom up) within
    `ATLAS_TOL` 0.0025. Measured: 0.00196, the 8-bit rounding. So the names
    are provably the names of the pixels the faces sample, and no second copy
    of the atlas layout exists to drift.
  - **The table.** `REGION_KIND` in `props.py`, 28 names, 7,542 faces:
    `wood` (`wood_light`, `wood`, `wood_dark`, `wood_grey`, `wood_red`,
    `planks`, `log_end`; 2,572 faces, 151.7 m²), `stone` (`stone`,
    `stone_light`, `stone_dark`, `stone_warm`, `soot`, `blocks`,
    `bricks_warm`, `fireback`; 545, 126.9 m²), `iron` (`iron`, `iron_dark`,
    `iron_rust`, `steel`; 2,096, 14.8 m²), `brass` (`brass`, `brass_dark`,
    `gold`, `pewter`; 1,632, 3.7 m²), `straw` (`rope`, `straw`,
    `straw_dark`, `herb_dried`, `skep`; 697, 2.5 m²). `KEEP`, the other 75
    names in use, 4,341 faces, 166.2 m², stay on `castle_props`: every
    cloth, leather and burlap, paper and ink, food, flame and ember, clay,
    glass and glaze, and every tile Devon drew a picture on (`crest_a` to
    `_d`, the three tapestries, `rug_a` to `_c`, `cobweb`, `cobweb_b`,
    `stained_glass`, `spines`, `writing`, `dial`, `mail`, `linenfold`,
    `frontal`, `morris`, `bill`, `roster`, `coals`). A face whose region is in
    neither raises, naming the region, the object and the file. **Why cloth
    stays**: `LIBRARY` has no cloth; `dirty_carpet` is a patterned rug at
    linear luminance 0.020 with a coefficient of variation of 0.97, which would
    print a carpet across every banner, and a matte flat colour is what felt
    and wool render as. **Why the pictures stay**: they are the props'
    identity, "his objects, or somebody else's?".
  - **The kinds.** `materials.PROP_KINDS`, each built once per file by
    `materials.prop_material(kind)`:

    | Kind | Set | Metres | `DETAIL` | Metallic | Rough min | Material |
    | --- | --- | --- | --- | --- | --- | --- |
    | wood | `rough_wood` | 0.5 | 0.1219 | 0 | 0.75 | `MAT_rough_wood_prop` |
    | stone | `stone_pavers` | 2.0 | 0.1166 | 0 | none | `MAT_stone_pavers_prop` |
    | iron | `rusty_metal` | 1.5 | 0.2709 | 0 | none | `MAT_rusty_metal_prop` |
    | brass | `rusty_metal` | 1.5 | 0.2709 | 1.0 | none | `MAT_rusty_metal_brass` |
    | straw | `reed_roof_04` | 2.5 | 0.1857 | 0 | none | `MAT_reed_roof_04_prop` |

    `DETAIL` is the mean over texels of max(R, G, B) of linear diffuse times
    AO on the cached 2k maps, which is what a Hue/Saturation/Value node at
    Saturation 0 outputs. Rise as `library()` gives a set (none if `PLAIN`,
    else `SWAP_RISE.get(set, 0.0)`, so `reed_roof_04` takes 0, as
    `THATCH_SET` does); `LOOK` is not applied, since the colour now
    comes from the atlas. `stone_pavers` is the dressing's squared stone
    (#858), right for a fireplace, a font and a well head; `rough_wood` is
    the castle's timber; the 0.75 floor is #861's reason.
  - **The colour.** `props.py` writes a `FLOAT_COLOR` attribute on the
    `CORNER` domain, `atlas_rgb`, on every Devon mesh: each face's region's
    mean `IMG` colour, sRGB to linear per channel. `box_material` gains
    `atlas_detail=None` (with it, after `_maps`' colour, a Hue/Saturation/Value
    at Hue 0.5, Saturation 0, Value 1 / `atlas_detail`, then a Multiply by an
    Attribute node reading `atlas_rgb`), `coords='world'` (`'object'` feeds the
    mapping from Texture Coordinate's Object output instead of Geometry's
    Position) and `metallic=None` (`_finish` sets the BSDF's Metallic). So a
    `wood_dark` face renders at Devon's (80, 60, 44) with `rough_wood`'s grain,
    normal and roughness about a mean of 1, and a `brass` face is metal.
  - **The UVs.** The atlas layer is renamed `atlas` and stays the active
    render layer, which `castle_props`' Image Texture reads by default; a new
    `UVMap` is written per face by its dominant axis in object-local metres,
    `masonry.finish`'s rule, which the Normal Map (`uv_map='UVMap'`) names;
    object-coordinate projection keeps the two in one frame on a turned prop.
  - **The slots.** On every Devon mesh: 0 its own material (`castle_props`
    or `_cutout`), 1 wood, 2 stone, 3 iron, 4 brass, 5 straw. The build prints
    the faces per kind; they must equal the counts above.
- **The 12 Poly Haven rows (#864).** Recommend **the game's own 9 assets,
  each model's `.blend` and its `include` files at 1k, 65 `sources.json`
  rows, 67,515,544 bytes (67.5 MB, 64.4 MiB)**, fetched the #852 way after
  Devon's yes to this table: one download each into scratch, refused unless
  size and md5 equal the API's, then sha256 and `bytes` by hand; rows as
  increment 1's models (`kind` `model` and `include`, `file` the `include` key
  verbatim).

  | Asset | Rows (pieces) | Files | Bytes | `.blend` md5 | Author |
  | --- | --- | --- | --- | --- | --- |
  | `WoodenTable_01` | `WoodenTable_01`, `table-muniment` | 5 | 1,587,487 | `7a4e81181d8bfe7e0dbc0c42b32cdaf4` | Ethan Place |
  | `WoodenChair_01` | `WoodenChair_01` | 5 | 2,521,201 | `2ae7fdc60a6a33ac9fcfe402f9332fb7` | Jake Mobley |
  | `wooden_stool_02` | `wooden_stool_02` | 4 | 3,790,678 | `ba2ad5906da02e3361ea07cc52272634` | Kuutti Siitonen |
  | `GothicCabinet_01` | `GothicCabinet_01` | 5 | 2,137,498 | `a8ad744ee9d3cc1f0a6a3b71cb3292f8` | Kirill Sannikov |
  | `GothicCommode_01` | `GothicCommode_01` | 5 | 1,530,393 | `ecef5bb5ef2964a5fe099d6cf4ea6742` | Kirill Sannikov |
  | `gothic_statue` | `gothic_statue` | 4 | 4,638,955 | `e957fd865d58721e5efccf6fccc12604` | Benny Weimer |
  | `wooden_lantern_01` | `wooden_lantern_01`, `lantern-chapel` | 10 | 18,600,741 | `080ef40b1681445143654fa5a4976e67` | James Ray Cock |
  | `brass_candleholders` | `brass_candleholders`, `candles-chapel` | 17 | 25,364,579 | `412ad9c5b4401461bc0e6790f94f2eb2` | Tina |
  | `kite_shield` | `kite_shield` | 10 | 7,344,012 | `d7087fa821647eec87c68183dacbb175` | Ulan Cabanilla |
  | **9** | **12** | **65** | **67,515,544** | | |

  Each include's md5 is in the API listing the scratch helper reads; the
  table gives the `.blend`'s, the file the append opens. **Why 1k, a second
  departure from "Texture resolution" after #845's trees**: 2k is
  235.3 MB for the same nine, 3.5 times, and 158 MB of that is the
  candleholders (87.5) and the lantern (70.4), whose normals ship as PNG and
  EXR. None is over 2.4 m; at 24 mm on a 1920 px frame a surface 3 m off
  gets 427 px per metre, and a 1k map across a 1.8 m table gives about 570,
  so 1k out-resolves every interior still here; the game ships all nine at
  1k. **The append**: `props.append_asset(asset)`, every object of the
  `.blend`; the images' `//` paths made absolute against the model's
  folder by `terrain.absolute_images(before, folder)`, the lines
  `append_model` has today factored out and called by both; every mesh
  named `*_LOD[1-9]` deleted; every non-mesh deleted after its children's
  `matrix_world` is kept; the meshes parented to an empty `PROP_<piece id>`
  with their authored transforms as the local offset, **not zeroed** as
  `append_model` zeroes a tree's, because `GothicCabinet_01`'s four doors and
  `brass_candleholders`' three holders stand off the origin in the gltf the
  plan measured; the empty takes the piece's transform. A second row of an
  asset is a linked copy. Their own Poly Haven materials, untouched.
  `check_tree` holds each on every face within 0.01. If a `.blend` lays its
  objects out other than its gltf does, that check raises naming the asset,
  and the builder stops and reports the box: a number fitted to make it pass
  is a second plan.
- **The 20 `builtProps` (#865).** Recommend **each its blueprint box exactly,
  `PROP_<piece id>`, `materials.library(material)`, held on every face
  within 0.01, and three slugs mapped onto `LIBRARY` sets through `ALIAS`, no
  fetch**. Today `library()` raises on three of the five slugs the 20 carry:

  | Slug | Pieces | Set | Why |
  | --- | --- | --- | --- |
  | `oak` | `works-ledger`, `gate-book`, `lodge-ordinances`, `watch-bill` | `wooden_gate` | the existing `ALIAS` (#852) |
  | `medieval_blocks_02` | `wykes-block`, `wykes-course-1` to `-3`, `wykes-slab` | itself | in `LIBRARY`; Wykes's stone is the town wall's |
  | `slate` | `builder-graffito`, `gravestone`, `foundation-stone`, `cooks-accounts`, `bakehouse-tally` | `roof_slates_02` | the one set that is slate: luminance 0.192, hue 37, saturation 0.19 |
  | `parchment` | `obituary-roll`, `kings-writ`, `engineer-drawing`, `steward-letters`, `gaol-roll` | `plastered_wall_04` | `LOOK`'s limewash cream, 0.156, matte (rough 0.93), no joints, no grain |
  | `wool` | `cloak` | `dirty_carpet` | the one woven set; 0.020 reads as a dark cloak folded on its crate |

  `ALIAS = {'iron': 'rusty_metal', 'oak': 'wooden_gate', 'slate':
  'roof_slates_02', 'parchment': 'plastered_wall_04', 'wool':
  'dirty_carpet'}`; the import check already refuses a key in `LIBRARY` or a
  target outside it. Each is then `MAT_<set>`, the same material as the
  roofs, the plaster and the carpet, which is #854's one-set-one-material
  rule. Refused: `castle_wall_slates` for slate (rubble with mortar, a
  gravestone with joints), `stone_pavers` (0.49 m courses across a 0.5 m
  tally) and a flat colour for parchment (the library never falls back to
  one). If a still reads a slab wrong, the fix is its `ALIAS` line.
- **The kit decor (#866, replacing the open call "The kit decor" above).**
  Recommend **all 80 generated, no fetch, each built in its local frame so
  its local bounds are the kit file's times `scale`, then placed by the
  piece's transform as Devon's are**: `bound_box` through `matrix_world` is
  then exactly what `partsOf` and `boxOfParts` compute, so every kit object is
  held on every face within 0.01 whatever its shape inside. Poly Haven
  barrels and crates are refused: Mereford's generated barrels and crate
  (#857) are the ones Devon passed ("all of those stills look great"),
  `wooden_barrels_01` is 34.4 MB at 1k, and one look per object kind is the
  point. `KIT_LOCAL`, committed in `props.py`, is each file's local bounds
  measured through `partsOf` (union of its parts, metres at scale 1), and
  `props.py` raises unless every kit piece's blueprint box equals its
  transform applied to its file's row within 0.01, naming the piece and the
  face, so the table cannot drift from the files the plan reads:

  | File | Pieces | Local x | Local y | Local z | Built as | Material |
  | --- | --- | --- | --- | --- | --- | --- |
  | `structure-pole.glb` | 10 | -0.05, 0.05 | 0, 1 | -0.05, 0.05 | the box | `TIMBER` |
  | `detail-crate.glb` | 9 | -0.15, 0.15 | 0, 0.3 | -0.15, 0.15 | `town.build_crate` | `rough_wood`, `wood_planks` |
  | `detail-crate-small.glb` | 7 | -0.1, 0.1 | 0, 0.2 | -0.1, 0.1 | `town.build_crate` | same |
  | `detail-crate-ropes.glb` | 7 | -0.15, 0.15 | 0, 0.3 | -0.15, 0.15 | `town.build_crate`, no ropes | same |
  | `barrels.glb` | 12 | -0.296, 0.296 | 0, 0.492 | -0.15, 0.15 | `town.build_barrels` | `rough_wood`, `iron` |
  | `detail-barrel.glb` | 7 | -0.123, 0.123 | 0, 0.3 | -0.123, 0.123 | `town.barrel`, one | same |
  | `bricks.glb` | 5 | -0.2098, 0.2978 | 0, 0.1722 | -0.2227, 0.24 | a stack | `DRESSED` |
  | `floor-steps.glb` | 9 | -0.5, 0.5 | 0, 0.2 | -0.5, 0.5 | the box | `wood_floor_deck` |
  | `ladder.glb` | 3 | -0.15, 0.15 | 0, 1 | -0.025, 0.025 | stiles and rungs | `TIMBER` |
  | `structure-cross.glb` | 1 | -0.5, 0.5 | 0, 1 | -0.5, 0.5 | a braced frame | `TIMBER` |
  | `fence.glb` | 1 | -0.5, 0.5 | 0, 0.5 | 0, 0 | a hurdle | `TIMBER` |
  | `pulley.glb` | 2 | -0.05, 0.05 | -0.95, 0.05 | -0.6, 0 | a hoist, a bell on `bell: true` | `TIMBER`, straw, brass |
  | `pulley-crate.glb` | 2 | -0.1837, 0.1837 | -0.95, 0.05 | -0.7337, 0 | a hoist over a crate | the two above |
  | `tree-shrub.glb` | 5 | -0.4596, 0.4596 | 0, 0.7 | -0.4596, 0.4596 | a leaf canopy | `tree_small_02`'s leaves |

  The generators, every number local and times `scale`, built with
  `masonry.Solid` and finished as the other stages finish:
  - **Crates and barrels reuse Mereford's code unchanged**:
    `town.build_crate(s, {'box': local, 'transform': {'rotationY': 0}})` and
    `town.build_barrels(s, {'box': local})` read a box and draw into it.
    `town.py` gains `barrel(s, cx, cz, y0, h, belly)`, lifted out of
    `build_barrels`, which calls it twice as before, so no town object
    moves; a `detail-barrel` is one `barrel` at the local centre with belly
    the local half-width. A barrel pair's depth is 2 x 0.148 against 0.300,
    0.002 x `scale` short each side, 0.0032 m at the largest scale (1.6).
    The crate's ropes are left out: there is no rope set, and the crate is
    what reads at 5 m.
  - **Bricks**: a bottom course of four blocks tiling the local footprint in
    a 2 by 2 grid, each (dx / 2 - 0.01) by (dz / 2 - 0.01), y 0 to h / 2,
    `BRICK_GAP` 0.01 between them, and one block over the middle, x 0.2 to
    0.8 and z 0.25 to 0.75 of the footprint, y h / 2 to h: the bounds reach
    every face and the stack reads as a mason's.
  - **The dais**: the nine `floor-steps` in the hall (x -11.4 to -6.6, z 7.6
    to 12.4) are a 3 by 3 grid of 1.6 m tiles 0.32 m tall at scale 1.6;
    each is its box in `wood_floor_deck`, so together a timber dais under
    `hall-high-chair`, whose box starts at y 0.32. No steps are cut: each
    kit tile carries one, and nine steps across one dais read as nine ramps.
  - **Ladder**: two stiles 0.06 m wide at the local x ends, the full local
    depth and height; square rungs 0.04 m between them, centred in z, at y
    0.25 m and every 0.3 m up to the height less 0.15 (at 2.5 m tall: 8
    rungs).
  - **The braced frame** (`structure-cross-100`, the dormitory, 2.5 m): the
    12 edges of the local cube as members 0.12 m square inside it, and on
    each vertical face one brace 0.08 m square from a foot corner to the
    opposite head corner, as a `Solid.plate` in the face's plane.
  - **The hurdle** (`fence-67`): the kit's fence is a plane, local z 0 to 0,
    so the hurdle is 0.02 m deep, centred on it: three posts 0.06 wide at x
    -0.47, 0 and 0.47, the full height; two rails 0.04 tall with their feet
    at y 0.12 and 0.38, the full width. At its 45 degrees the depth moves each world face
    0.007 m, inside 0.01.
  - **The hoist** (`pulley`, `pulley-crate`): a post x -0.05 to 0.05, z -0.1
    to 0, the full local height; an arm x -0.05 to 0.05, y -0.05 to 0.05, z
    -0.6 to 0; a wheel of 16 facets, radius 0.06, 0.03 thick across x,
    centred at y -0.12, z -0.52; a rope 0.008 square hanging at z -0.52 from
    y -0.18 to -0.64 (`pulley`) or to the crate's top (`pulley-crate`). The
    crate is `town.build_crate` on the local box x -0.1837 to 0.1837, z
    -0.7337 to -0.3663, y -0.95 to -0.5826. On a piece whose blueprint `bell`
    is true (`chapel-bell`, the only one) a bell hangs from the rope: 16
    facets, crown y -0.64 to mouth y -0.84, radius 0.024, 0.032, 0.040 and
    0.05 at 0, 0.3, 0.7 and 1 of its height, so it stays inside the post's
    width and the bounds do not move; at scale 2.5 it is 0.25 m across the
    mouth and 0.5 m tall. Read from the plan's field, not an id. Post, arm
    and wheel `TIMBER`; the rope `prop_material('straw')` and the bell
    `prop_material('brass')`, with `atlas_rgb` written from the atlas's
    `rope` and `bronze` swatches, so the kit's rope and bell are Devon's.
  - **The shrubs**: `tree_small_02`'s LOD1 through `terrain.append_model`
    (the memo, #857), copied into a new mesh with every face whose material is
    not the leaves' deleted (the leaves' is the one `materials.tint_leaves`
    finds), that canopy's own bounds scaled per axis onto the local bounds
    times `scale`, one mesh per piece, the leaves' material with its tint
    per object. So a shrub is a small tree's canopy fitted into the kit's
    bounds, standing on the ground, with no fetch and no generated leaf.
- **`castle_props.blend`'s pin (#867).** It lives at `C:\Users\devon\
  OneDrive\Documents\Claude Files\Blender Projects\Castle\_source\
  castle_props.blend`, 429,037 bytes, saved 2026-09-24 19:39, sha256
  `b212a041fc2f5a119f35c32d9fe265a896b0e588cfb4273f37421d0989ed2062`. Its
  packed atlas is byte-identical to `_source/castle_props_atlas.png`, sha256
  `e58ea65f8c61cc648c7ad0ab9d2f42bc8064e455c30d18a4451e96eb1bd3688c`, the
  hash #830 recorded (measured on the packed bytes), so no second row. Recommend **a `path` relative to
  the output folder, not an absolute one**: the default `CASTLE3D_OUT` is
  `...\Castle\castle3d\` and `_source` is its sibling, so the committed row
  names no user folder, and an output folder moved elsewhere fails the fetch
  by name, which is the right answer. The row, first in `sources.json`:
  `{ "id": "castle_props:blend", "kind": "blend", "path":
  "../_source/castle_props.blend", "licence": "Devon Moore, own work (#830)",
  "sha256": "b212a041fc2f5a119f35c32d9fe265a896b0e588cfb4273f37421d0989ed2062",
  "bytes": 429037 }`. `fetch.mjs` resolves a `path` row with
  `path.resolve(outDir, ...row.path.split('/'))` rather than against the
  working directory, refusing a `path` that is absolute or holds a
  backslash, and still hashes it where it stands and copies nothing;
  `common.source_path(row)` is the same join in Python, which `props.py`
  opens. The hash has one home, the fetch, before Blender starts (#840's "the
  build refuses a changed props `.blend`" is `build.mjs` calling it). A new
  hash lands in the commit that wants it. `CREDITS.md` gains one line for the
  file under its own heading, since it is not Poly Haven's.
- **#858 (a), the backs in the plaster (#868).** The fault is four props,
  not two: each stands 0.010 m off the stone as the game places it, and 4b's
  `PLASTER_<room>` skin is 0.015 thick, so each is about 5 mm into it.
  Measured on the blueprint against the three `PLASTERED` rooms' clear spans
  (`buildings.clear_span`), from the upper floor's top (4.0) to `FLAT_Y[0]`
  (7.8):

  | Piece | Room | Face | Into the skin | Push |
  | --- | --- | --- | --- | --- |
  | `dormitory-weapon-rack` | dormitory | max x -14.50999 at x -14.5 | 0.00501 | 0.00701 toward -x |
  | `dormitory-watch-bill` | dormitory | min x -25.48906 at x -25.5 | 0.00406 | 0.00606 toward +x |
  | `royal-tapestry` | royal apartments | max z -6.50969 at z -6.5 | 0.00531 | 0.00731 toward -z |
  | `royal-cobweb` | royal apartments | max x 21.99 at x 22; max z -6.51026 at z -6.5 | 0.00500; 0.00475 | 0.00700 toward -x; 0.00675 toward -z |

  The Clerk's chamber has none. Recommend **move the prop, not the
  plaster**: `props.py` imports `buildings.PLASTERED`, `PLASTER`, `FLAT_Y` and
  `clear_span`, takes each room's four edge planes over its span from its
  `floor-<room>` top to `FLAT_Y[0]`, and for every props piece whose box
  meets a skin pushes it into the room by `PLASTER` less its gap to the
  stone plus `HANG_GAP` 0.002, per axis; so each back stands 2 mm proud of
  the plaster, as a hung board or cloth does. A cut in the plaster behind
  each would leave an unplastered rim wherever the prop is narrower than
  its cut, and a thinner skin changes every plastered room for four props.
  The largest push is 0.0073 m. `props.py` raises if a pushed box still
  meets a skin, and if a push exceeds `HANG_MAX` 0.01, naming the piece: a
  prop set deeper into a wall is the plan's fault, for the lead. The skin is
  taken whole along each edge, openings included, so the rule is the
  blueprint's alone and `--only props` needs no `PLASTER_` object. The
  report prints each push. For the integration row (#839, 2i): a push of under
  a centimetre on four `noCollide` props moves nothing a body meets.
- **The floating decks (#868).** They are closed by realising the posts the
  plan already has, as #854's ruling 10 and #859 said, with no model-only
  object: the lodge's `structure-pole-73` to `-76` are 0.4 m square from y 0
  to 4.0, `DECK_masons-lodge-roof`'s underside (x -10 to -2, z -14 to -6, y
  4.0 to 4.3), 0.1 m in from each deck edge; Wykes's shed's `-126` to `-129`
  are 0.3 m square from y 0 to 3.0, `DECK_wykes-shed-roof`'s underside (x
  -62.5 to -54, z -16 to -10, y 3.0 to 3.3), at x -61.6 and -54.4, z -15.6
  and -10.4. Each post is its box in `TIMBER`, held on every face within
  0.01, so its top is the deck's underside to the centimetre and deleting one
  is named by line 6 (break (10)).
- **Check line 4: measured, not predicted (#860's correction is why).**
  **The pre-props baseline, measured today on `5ffc1e2` with
  `CASTLE3D_OUT` at the default folder** (fetch: 137 sources, 137 held, 0
  downloaded): `--only terrain,walls,towers,gates,buildings,town`, `ok line 4
  images: 212 image texture nodes, 132 images`, line 5 `18 level-0 rooms, 90
  points, largest |height| 0.0001 m`, line 6 `240 pieces`; `--only town`,
  100 and 55, line 6 43; `--only guide`, 0 and 0. Also measured: appending
  the 71 collections brings 2 image texture nodes (`castle_props` and
  `_cutout`) and 1 image, the packed atlas. **No total is written here for
  after**: the five prop materials, the Poly Haven models and the tree
  template each add nodes that depend on code not yet written and files not
  yet fetched. **How the builder measures and records it**: `props.py`
  snapshots `bpy.data.images` and every material's and node group's
  `TEX_IMAGE` nodes before its first line and after its last, and prints
  `props: line 4 share: <n> image texture nodes, <m> images new in this
  stage` split by source (atlas, `MAT_*_prop` and `_brass`, each Poly Haven
  asset, the tree template, `library()` sets); the builder runs the
  through build and `--only props`, quotes check.py's line 4 from both and
  that split, and the numbers go into `HISTORY.md` and this acceptance as
  measured. The through build's line 4 minus 212 and 132 is the stage's
  share when terrain has already appended the tree and every set the stage
  reads is already loaded by an earlier stage; `--only props` is the stage
  alone. Line 5 is unchanged at 18 and 90: no prop touches
  `TERRAIN_ground`.
- **The breaks from green (#34)**, each restored before the next, each
  quoted: (1) delete `PROP_nave-pulpit`: `FAIL line 6 coverage: 1 piece(s)
  nothing realises: nave-pulpit`. (2) `castle_props:blend`'s `sha256` last
  digit `2` to `3`: `build.mjs` exits non-zero before Blender starts, `fetch:
  castle_props:blend: <folder>\_source\castle_props.blend hashes
  b212a041...2062, sources.json says b212a041...2063`. (3) its `path` to
  `../_source/castle_prop.blend`: `fetch: castle_props:blend: <folder>\_source\
  castle_prop.blend does not exist`. (4) `tools/props/atlas.py`'s
  `wood_light` from (152, 122, 88) to (172, 122, 88), in the working tree
  only: the build raises on the atlas check, naming `ATLAS_TOL` and a maximum
  difference near 0.078. (5) `'rope'` out of `REGION_KIND`'s straw: the build
  raises naming region `rope`, the first object in build order that carries
  it, and its file. (6) `HANG_GAP = -0.006`: the build raises naming
  `dormitory-weapon-rack`, 0.005 m into the dormitory's plaster at x -14.5.
  (7) `KIT_LOCAL['structure-pole.glb']`'s y top 1 to 0.9: the build raises
  naming `structure-pole-73`, off 0.400 m at max y (its scale is 4). (8)
  Devon's roots placed at `(x, z, y)`, the sign of z dropped: the build
  raises from `check_tree` naming `PROP_kitchen-hearth-crane` (piece
  `kitchen-hearth-crane`), off by 13.540 m at its worst face, min z 6.510
  against -7.030. (9) `allow.json` `{"nave-pulpit": ""}`: `FAIL line 6
  coverage: allow.json entries with no reason: nave-pulpit`. (10) delete
  `PROP_structure-pole-126`: `FAIL line 6 coverage: 1 piece(s) nothing
  realises: structure-pole-126`, which is the shed's deck floating again,
  named. (11) map `WoodenTable_01`'s pieces to the `GothicCommode_01` asset:
  `check_tree` raises naming `PROP_WoodenTable_01`; its worst face is
  expected at max y, about 1.21 against 0.549, and the report quotes what it
  printed. Each quoted as printed; where the text above says "about", the
  printed number is the record.
- **The review stills.** Recommend **five, from `still_6.py` in
  `CASTLE3D_OUT\review\increment6\`, a copy of `still_5.py` with one set,
  `props`, of `partial/terrain+walls+towers+gates+buildings+town+props.blend`:
  Cycles OPTIX (CUDA if not), 1920 x 1080, the denoiser, 128 samples outside
  and 1024 inside (#855), Film exposure auto-probed by `still_5.py`'s loop
  (three 480 x 270 renders at 32 samples to a median display value within
  0.03 of 0.35) and printed with the median, clipped and crushed shares**;
  GUIDE and MARKERS hidden. The probe's first frame is also the framing
  check, so no live session is needed. Game (x, y, z) is Blender (x, -z, y):

  | Still | Game eye | Game target | Blender eye | Lens | Samples | What it judges |
  | --- | --- | --- | --- | --- | --- | --- |
  | `props-hall.png` | (-31.5, 1.7, 8.2) | (-19.5, 0.9, 10.6) | (-31.5, -8.2, 1.7) | 24 | 1024 | the Poly Haven table, chair, stool, statue, candles and lantern, the goblet, the fireplace, and the dais and high chair at the far end |
  | `props-kings-hall.png` | (3.2, 1.7, -8.2) | (15.0, 2.0, -12.4) | (3.2, 8.2, 1.7) | 24 | 1024 | Devon's trestle, boar, tapestry, banner, sconce, chandelier, rug and brazier: the re-material |
  | `props-nave.png` | (10.9, 1.7, 10.25) | (17.4, 2.2, 10.25) | (10.9, -10.25, 1.7) | 18 | 1024 | down the aisle between the pews to the altar and rood, the pulpit at the left edge, the east window |
  | `props-lodge.png` | (-14.5, 1.7, -1.5) | (-6.0, 2.5, -10.0) | (-14.5, 1.5, 1.7) | 24 | 128 | the lodge's deck on its four posts, `lodge-ordinances` |
  | `props-yard.png` | (-52.5, 1.7, 1.5) | (-57.5, 2.0, -12.0) | (-52.5, -1.5, 1.7) | 24 | 128 | Wykes's shed on its four posts, the bricks, courses, block and slab, ladder, hoist, crate, barrels, the shrub |

  Each eye is outside every piece's box grown by 0.3 m, and the frame's
  contents above were checked against the blueprint's boxes at the lens's
  angles. The nave takes 18 mm, as `gates-dressed` did: at 24 mm the pews
  fall below the frame or the pulpit off its side. `props-yard` replaces
  `town-gate`'s camera for the deck, which caught only the deck's west end.
  Each still's exposure goes into the report; the three interiors are
  expected near #855's +11, and light stays increment 7's.
- **The module split.** Recommend **`props.py` new; `materials.py` gains
  `PROP_KINDS`, `prop_material(kind)`, the three `ALIAS` lines and
  `box_material`'s `atlas_detail`, `coords` and `metallic` (`_maps` and
  `_finish` take them); `terrain.py` gains `absolute_images(before,
  folder)`, lifted out of `append_model`; `town.py` gains `barrel()`, lifted
  out of `build_barrels`; `common.py` gains `source_path(row)`; `fetch.mjs`
  resolves `path` rows against the output folder; `sources.json` gains 66
  rows (65 Poly Haven, 1 `path`); `CREDITS.md` gains nine Poly Haven lines and
  Devon's, and reads 202 cached files in 35 assets, 470.6 MB, plus
  `castle_props.blend`; `README.md`'s stage list gains `props`**. `check.py`,
  `build.py`, `build.mjs`, `allow.json`, `STAGE_OF`, `walls.py`, `towers.py`,
  `gates.py` and `buildings.py` do not change. The terrain, town and
  materials edits move nothing already built: the through build before
  `props.py` exists must still print 212 and 132, 18 and 90, and 240. The
  stage prints: the count by group (80, 12, 75, 20); the faces per kind;
  the four pushes; each Poly Haven asset's objects kept and deleted; the
  worst `check_tree` and `check_box` differences; the line 4 share.

**Increment 7's open calls: lighting and cameras, decided before anything is
built** (architect, 2026-09-28, against `34357ac`, where #869 was the last;
decided as #873 to #877). Every number is in the game's frame unless it says
Blender; game (x, y, z) is Blender (x, -z, y). **Measured on this branch, not
predicted** (#860's correction is the reason): the cached 4k `.hdr` read
pixel by pixel in a background Blender 5.2.2, and the sun's direction
confirmed by rendering the bare World through a 400 mm camera (46,664 at
the measured direction, under 0.5 at its three mirror images); Cycles' point
and sun normalisation on a white plane (0.3167 and 0.3174 against 1/pi
0.3183); `castle_props`' atlas regions under every placed prop's faces;
`makePlan`'s `standAt` and `walkability` in Node for every camera eye; and 78
probe renders of
`partial/terrain+walls+towers+gates+buildings+town+props.blend` (the build
#869 closed on) with a throwaway script that added the sun, the practicals,
the braziers and the cameras below, 480 x 270 (20 of them 960 x 540, for
the samples call), 64 samples with adaptive
sampling and the denoiser, AgX (the factory view transform, which every
still in this row has used), exposure found by bisection on the saved linear
EXR to a display median of 0.35 and rounded to 0.25. Nothing in the repo
but this section and `HISTORY.md` changed.

- **The stage (7).** Recommend **`lighting`, `lighting.py`, already in
  `common.STAGES` after `props` and in `MODULE`, not in `GEOMETRY`, one
  collection `LIGHTING`**: it realises no plan piece, so line 6 never covers
  it and nothing it makes carries a `planId`. It reads the blueprint (its new
  `braziers` and `cameras`, below), the HDRI row, the pinned props `.blend`
  (for the three braziers), and, when `props` ran in the same build, the
  `PROP_` trees' flame faces; it moves no object another stage made. So
  `--only lighting` builds alone (the World, the sun, the three braziers
  and their three lights, the five cameras), and `--only
  terrain,walls,towers,gates,buildings,town,props,lighting` is the build that
  lights every practical, and the through build of this increment: a plain
  build exits 1 at `markers` until increment 8 writes `markers.py` (#876's
  correction). **From this increment a build without `lighting`
  has no World and renders a black sky**: `read_factory_settings(use_empty=
  True)` makes no World (measured), and terrain no longer sets one. Every
  review still from here on is taken from a build that ran `lighting`.
- **The World (#873).** Recommend **`terrain.py` loses its
  `world_from_hdri` call and its `HDRI` constant, and `lighting.py` makes the
  only World, `WORLD_hdri`, through `materials.world_from_hdri(row,
  clamp=SUN_CLAMP)`, with no rotation and Background strength 1**. The
  file's sun is unclipped: its brightest pixel, in the disc, reads 74,609,
  and the disc is 69% of the map's horizontal irradiance by luminance (4.786
  with it, 1.478 clamped). A lamp on top of that would count the sun twice. So the World clamps every channel at `SUN_CLAMP` 16
  for every ray but the camera's: an Environment Texture into a Mix (Color,
  blend `DARKEN`, factor 1, B (16, 16, 16)), and a second Mix whose factor is
  Light Path's Is Camera Ray, A the clamped colour and B the raw one, into the
  Background. The camera still sees the sun's disc; nothing is lit by it
  twice. Measured: the brightest pixel more than 5 degrees from the sun is
  15.25 on any channel, so 16 takes nothing but the disc (0.00000 of the
  removed energy lies outside 5 degrees), and it removes (4.4212, 4.4553,
  4.0524) per channel, 4.4190 by luminance. Refused: a lower clamp (at 10,
  0.0005 of the removal is cloud) and editing the image (a second file
  under one hash, #840). **No rotation**: at rotation 0 the file's sun
  already stands within 4.8 degrees of the game's Terce sun, `lighting.sun`
  (30, 45, 18) in `scene-config.json`, elevation 47.9 against 52.1 and
  bearing 124.3 against 120.9 degrees, so the model's sky is the game's
  morning without a Mapping node.
- **The sun (1, #873).** Recommend **one Sun light, `SUN`, strength 4.4553,
  colour (0.9924, 1.0, 0.9096), angle 0.53 degrees, `rotation_euler`
  (42.129, 0, 55.740) degrees in Blender, so its +Z points at the file's
  sun: Blender (0.55441, -0.37763, 0.74164), game (0.55441, 0.74164,
  0.37763), elevation 47.871 and Blender azimuth -34.260 degrees**. The
  direction is the energy-weighted centroid of every pixel over 50 (937
  pixels), identical within 0.03 degrees to the brightest pixel's; the
  strength and colour are exactly what the clamp removes, so strength times
  colour's luminance is 4.4190, and daylight is unchanged by the move: the
  eight probe cameras read the same exposure with the file's sun as with the
  lamp, and their linear medians agree within 0.6% outdoors and 2.6% indoors,
  which is 64 samples' noise. The angle is the real
  sun's: 96.7% of the removed energy lies within 0.5 degrees of the centroid,
  so the file's disc is under a degree across and its spread is camera bloom.
  **It does not light the hall through its windows, measured**: from a 0.5 m
  grid at y 0.05, 0 of 896 points in `great-hall` see the sun, 0 of 640 in
  `kings-hall` and 0 of 256 in `chapel-nave`. The hall's five windows are in
  `great-hall-north` and face -z; the sun is at +z. No light linking and no
  exclusion: the sun lights what it reaches.
- **The practicals (2, #874).** Recommend **a light wherever the model draws
  a flame, found by a rule over the faces and never by a table of piece
  ids**. A flame face is one of Devon's faces whose atlas region is `flame`,
  `flame_core`, `ember` or `coals`, or a face on Poly Haven's
  `brass_candleholders_flame`. Per source (a `PROP_` or `BRAZIER_` tree): if
  it has `coals`, one light at the area-weighted centroid of all its coals and
  ember faces raised 0.05 m, `brazier` if it has `ember` and `hearth` if not;
  otherwise its flame faces' vertex-connected components, merged when two
  centroids of one source lie within 0.06 m, each one light at its
  centroid, `torch` if its area is 0.01 m² or more and `candle` if less
  (measured: 0.0354 for each sconce, 0.00181 for a chandelier flame, 0.00113
  and 0.00227 for the candleholders'). Named `LIGHT_<source>-<n>`, n from 1
  in (x, y, z) order within the source, each carrying `lightFor` (the piece
  id or `brazier-<n>`) and `kind`. **Measured on the #869 build, 37
  lights**:

  | Source | Lights | Kind | At (game) |
  | --- | --- | --- | --- |
  | `brass_candleholders` | 11 | candle | y 0.90 to 1.37, x -20.79 to -19.85 |
  | `candles-chapel` | 11 | candle | y 0.36 to 0.82, x 22.31 to 23.26 |
  | `kings-hall-chandelier` | 8 | candle | y 2.66 to 2.70, a ring of radius 0.60 on (13.5, -10) |
  | `kings-hall-sconce-west`, `-east` | 1 each | torch | (8.0, 2.173, -13.815), (17.0, 2.173, -13.815) |
  | `kings-hall-brazier` | 1 | brazier | (17.496, 0.812, -11.2) |
  | `hall-fireplace` | 1 | hearth | (-27.0, 0.170, 7.03) |
  | `brazier-1` to `-3` | 1 each | brazier | 0.812 over each position, below |

  So 30 candle, 2 torch, 4 brazier, 1 hearth. The four candles Devon drew
  without a flame (`nave-altar`'s two, `steward-candlestick`,
  `kings-tower-sconce`) stay unlit: a light with no flame in frame is light
  from nowhere, and a flame drawn for them would be model-only geometry
  nobody ruled on. Measured, it costs nothing in exposure: the nave reads
  +10.0 with no practicals at all. If Devon's `CAM_chapel` still wants the
  altar lit, the named fix is a flame on the two altar candle tops at (17.024,
  1.472, 9.70) and (17.024, 1.472, 10.80), `modelOnly`, and two candle
  lights.
- **The practicals' power, colour and size (2, #874).** Recommend **Point
  lights, `use_temperature` on (it is a Light property in 5.2.2, measured),
  colour white, power `lumens x PRACTICAL_GAIN / LUX_PER_UNIT`, with
  `LUX_PER_UNIT` 20,000 and `PRACTICAL_GAIN` 32**:

  | Kind | Lumens | Power (W) | `shadow_soft_size` (m) | Temperature (K) |
  | --- | --- | --- | --- | --- |
  | candle | 12 | 0.0192 | 0.01 | 1850 |
  | torch | 200 | 0.32 | 0.04 | 1900 |
  | brazier | 2500 | 4.0 | 0.15 | 1900 |
  | hearth | 150 | 0.24 | 0.25 | 1700 |

  `LUX_PER_UNIT` puts the file on a physical scale: its sun disc is 4.42
  units of irradiance and direct sun at 48 degrees is about 88,000 lux; the
  point normalisation (power / (4 pi d²)) was measured equal to the sun's.
  **Why a gain of 32, measured** (the exposure table below): at the physical
  1 the practicals move the hall a quarter stop and the nave not at all,
  since firelight at Terce is about ten stops under daylight; at 1361, the
  game's own ratio (its brazier is `PointLight(0xff9033, 8, 12, 2)`, 8 cd
  against a 2.6 sun, 1361 times the physical 199 cd against 88,000 lux), the
  hall reads +6.25 but its walls go orange, the hall's brazier blows out and
  the room reads as night, because the model roofs every room the game
  leaves open to the sky (#853). At 32 the firelight equals the daylight at
  the median of the two rooms that have both, 1.2 times in the hall and 1.3
  in the King's hall (linear medians: daylight 5.6e-5 and 8.0e-5, with
  practicals at 32 1.25e-4 and 1.84e-4), so a still is a daylit room with its
  fires lit. One gain for every kind keeps a candle a candle beside a
  brazier.
- **The flames' material (2, #874).** Recommend **yes, emissive, and the
  material is `props.py`'s, not `lighting.py`'s**: `props.py` moves `flame`,
  `flame_core`, `ember` and `coals` out of `KEEP` into `EMIT` and gives those
  faces a sixth slot, `MAT_flame` (`materials.flame_material()`): an Emission
  shader whose colour is the atlas through an Image Texture on
  `castle_props_atlas` (Closest, UV map `atlas`), strength `FLAME_EMISSION`
  16 (a candle flame's 10,000 cd/m² on the same scale, 0.5, times the gain),
  `material.cycles.emission_sampling = 'NONE'` (measured to exist), so the
  flame is seen and the point light alone lights; nothing is counted twice
  and no mesh light adds noise. Measured: 172 faces move, 64 chandelier
  flame, 46 sconce flame and core, 56 brazier coals and ember, 6 hearth
  coals, so `KEEP` is 71 names and 4,169 faces and the faces-per-kind line
  gains `flame 172`. *Measured after the build*: that line counts each mesh
  once and prints `flame 149, kept 4192`, since the two King's hall sconces
  share one torch mesh with 23 flame faces; 172 is faces placed. Poly Haven's `brass_candleholders_flame` is already
  emissive (strength 1, textured) and stays untouched (#864).
- **The three braziers (#874).** They are `scene-config.json`'s `braziers`,
  which `main.js` builds at runtime through `createBrazier`, and the plan
  does not carry them, so the blueprint has had no brazier. Recommend
  **`export-blueprint.mjs` writes `braziers`, `[{ id: "brazier-<n>", tile,
  position, comment }]`, each `position` from `castle-plan.js`'s own
  `tileToWorld(plan.tile, ...tile)`, the function `main.js` reaches through
  `castle.tileToWorld`; `lighting.py` builds each as `BRAZIER_<n>`, Devon's
  `brazier` collection appended from the pinned props `.blend` and
  re-materialed by the same code `props.py` uses for `kings-hall-brazier`,
  at `position` with rotation 0 and scale 1, carrying `configId`
  `braziers[<i>]`, no `planId`, no `modelOnly`**: they are the game's, and
  one look per object kind (#866) makes them Devon's brazier rather than
  `scene-setup.js`'s primitive tripod. `props.py` lifts the append and the
  re-material of one stem into a function both stages call; the through
  build's line 4 and faces per kind must not move for it. Positions:
  `brazier-1` (-4.8, 0, -2.4), `brazier-2` (-4.8, 0, 2.4), both in the outer
  ward flanking the porter gate, and `brazier-3` (-20, 0, 10) in the hall.
  **`brazier-3` stands in two props, measured**: Devon's brazier box there is
  x -20.336 to -19.664, z 9.667 to 10.333, y 0 to 0.846, and it meets
  `gothic_statue` (x -20.69 to -19.22, z 8.73 to 10.29), `WoodenTable_01` (z
  from 10.17, top 0.55) and `brass_candleholders` (z from 10.25), and the
  game's colliders of the first two. That is the game's placement, and
  neither `layout.mjs` nor `plan-vs-scene.mjs` sees a brazier. Recommend
  **the model places it where the game does, and `lighting.py` raises when a
  brazier's box meets any piece's box unless the brazier is in
  `BRAZIER_CLASH = {'brazier-3': '#874: the game's own placement'}`, and
  raises on an entry that meets nothing**, so the exception dies with the
  game's fix, a one-tile edit to `scene-config.json` that is a game row and
  not this one. The build prints each brazier's overlaps by piece id.
- **The five cameras (3, #875).** Recommend **a committed
  `tools/castle3d/cameras.json`, read by `export-blueprint.mjs`, which writes
  `cameras` into the blueprint with where each eye stands, computed by the
  plan's own functions**: `stand` is `standAt(plan, x, z, eye.y -
  EYE_HEIGHT)` (`{h, surface, level}` or null) and `reachable` is
  `walkability(plan).reachable(x, z, stand.level)`, the spawn's flood fill.
  That is "where a player can stand", in Node, once (#500); `check.py` reads
  the answer and never re-derives it. `CAM_spawn`'s eye and target are
  `plan.spawn`'s `position` and `lookAt`, written `"eye": "spawn"` in the
  file. Every eye is 1.7 m (`EYE_HEIGHT`) over its `stand.h`:

  | Camera | Game eye | Game target | Blender eye | Lens | Stands on | Exposure | Samples |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | `CAM_spawn` | (-40, 1.7, 0) | (0, 1.7, 0) | (-40, 0, 1.7) | 72 degrees vertical | `ground`, level 0 | +4.00 | 128 |
  | `CAM_courtyard` | (-4, 1.7, -5) | (-13, 5.5, 7) | (-4, 5, 1.7) | 24 mm | `ground`, level 0 | +2.50 | 128 |
  | `CAM_hall` | (-31.5, 1.7, 8.2) | (-19.5, 0.9, 10.6) | (-31.5, -8.2, 1.7) | 24 mm | `ground`, level 0 | +9.75 | 1024 |
  | `CAM_chapel` | (10.9, 1.7, 10.25) | (17.4, 2.2, 10.25) | (10.9, -10.25, 1.7) | 18 mm | `ground`, level 0 | +10.00 | 1024 |
  | `CAM_town` | (-37.75, 13.7, -15.25) | (-85, 4, 4.3) | (-37.75, 15.25, 13.7) | 24 mm | `floor-nw-tower-roof`, level 3 | -0.50 | 128 |

  All five `reachable` true, measured. `CAM_spawn` takes the game's own
  field of view, `PerspectiveCamera(72, ...)` in `scene-setup.js`, as
  `sensor_fit` VERTICAL and `angle_y` 72 degrees, so the looking checklist's
  "the same distance and height the game shows" is a still against a
  screenshot. The other four are the review cameras Devon has already judged:
  `CAM_courtyard` is 4a's `buildings.png` eye (the outer ward, the hall's
  north wall and louvre), `CAM_hall` and `CAM_chapel` are `props-hall` and
  `props-nave` (#869). **`CAM_town` moved, because no player stands in
  Mereford**: `layout.mjs` check 4c asserts that no cell of the spawn's fill
  reaches a room outside the curtain, so every eye increment 5 used for the
  town (the street, the gate, the church) fails `reachable`, and
  `town.png`'s (-38.5, 13.7, -13.6) is on top of the North-west Tower's
  ring, where `standAt` finds no floor. The eye is on the tower's roof, 2.0
  m from its centre on the axis of crenel sector 19 (285 to 300 degrees),
  looking through the crenel at the street; the probe frame holds the church
  tower, Mereford's thatch beyond Wykes's yard, and the crenel's merlons at
  both edges. The South-west Tower was tried at (-37.25, 13.7, 14.75): one
  house fills its crenel. Each camera `clip_start` 0.05, `clip_end` 2000,
  and carries `exposure` and `samples` as custom properties from the file;
  `scene.camera` is `CAM_spawn`.
- **The stills come from the cameras (4, #875).** Recommend **yes:
  `still_7.py` in `CASTLE3D_OUT\review\increment7\`, uncommitted as
  `still_6.py` was, sets `scene.camera` to each `CAM_` object in turn and
  makes no camera of its own**, so the stills and line 8 test the same five
  objects and increment 9's export has nothing new to aim. Five stills,
  `cam-spawn.png` to `cam-town.png`, Cycles OPTIX (CUDA if not), 1920 x 1080,
  the denoiser, adaptive sampling at Blender's default, each camera's
  `samples`. Exposure is found as the probes found it, replacing
  `still_5.py`'s three-try loop, which stopped short on every interior in
  #869: one 480 x 270 render at 64 samples to a 32-bit EXR, then
  `Image.save_render` at trial exposures, 13 bisection steps between -8 and
  +18, to a display median of 0.35, rounded to 0.25; the report gives each
  still's exposure, median, clipped and crushed shares.
- **Exposure, measured, and the bands (5, #877).** Film exposure by camera
  and light, with the practicals' gain across the top (A is today's World
  with its own sun and no practicals):

  | Camera | A | Sun lamp | x1 | **x32** | x64 | x256 | x1361 |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | `CAM_spawn` | +4.00 | +4.00 | +4.00 | **+4.00** | +4.00 | +4.00 | +4.00 |
  | `CAM_courtyard` | +2.50 | +2.50 | +2.50 | **+2.50** | +2.50 | +2.50 | +2.25 |
  | `CAM_hall` | +11.00 | +11.00 | +10.75 | **+9.75** | +9.50 | +8.25 | +6.25 |
  | `CAM_chapel` | +10.00 | +10.00 | +10.00 | **+10.00** | | | |
  | `CAM_town` | | | | **-0.50** | | | |
  | `props-kings-hall` (#869) | +10.50 | +10.50 | +10.25 | **+9.50** | +8.75 | +7.50 | +5.25 |
  | `props-lodge` (#869) | +2.75 | +2.75 | +2.75 | **+2.75** | | | |
  | `props-yard` (#869) | 0.00 | 0.00 | 0.00 | **0.00** | | | |

  At x32, clipped and crushed shares: spawn 0% and 0.03%, courtyard 0% and
  1.29%, hall 0.01% and 0.46%, chapel 0.72% and 0%, town 0% and 0.06%, King's
  hall 0.27% and 1.22%. `CAM_chapel`'s +10.00 is the sun-lamp column, with
  no practical in frame; the x64 to x1361 runs lit the altar's two candles,
  which this spec does not, so their nave column is left blank. **What #869
  expected, and what it gets**: "well below +11.5" is not what light at a
  gain that keeps daylight in the room buys. First, #869's +11.5 on all
  three interiors was the three-try probe overshooting (#869 says it stopped
  above 0.35); bisection on the same build gives +11.0, +10.5 and +10.0.
  Second, the sun cannot help, since no interior floor point sees it. Third,
  at x32 the hall comes down 1.25 stops and the King's hall 1.0, and the nave
  none. An interior at +10 is the camera's setting, not a fault, and Devon's
  #858 (d) is answered by the light's colour and direction in the stills
  rather than by a number. **The bands**: a still's own probed exposure
  within 0.5 of the table's x32 column, clipped (display luminance at or
  over 0.99) at most 1.5% (Devon passed `props-kings-hall` at 1.43%), crushed
  (at or under 0.01) at most 5%. Outside any band, the builder stops and
  reports the number; a gain or a camera moved to pass is a second spec.
- **Check line 4, and lines 7 and 8 (6, #876, amending #844's six lines to
  eight).** **Line 4, measured today**: in the #869 through build the World
  is exactly 1 of line 4's 310 image texture nodes and 1 of its 189 images
  (the `.hdr`; no material reads it); `props.blend` has no World (188 and
  122) and `terrain.blend` has it (52 and 47). So with terrain's call still
  in place the through build to `props` prints 310 and 189 plus `MAT_flame`'s
  share, and after the move any build without `lighting` is exactly one node
  and one image lower than it was. **No total is written
  for after**: `MAT_flame` and the braziers' append add nodes that depend on
  code not yet written (whether the append reuses `castle_props` and the
  kind materials or duplicates them). `lighting.py` and `props.py` print
  their line 4 share (image texture nodes and images new in the stage,
  snapshot before and after, as #868's split); the builder runs the through
  build to `lighting` and `--only lighting` and quotes check.py's line 4 from
  both, and the numbers go into `HISTORY.md` and the acceptance as measured.
  Line 4 must count the World's Environment Texture on both. Lines 5 and 6
  are unchanged, 18 and 90 and 427, since `lighting` adds no `planId`.
  **Line 7, `light`** (runs when `lighting` ran): (a) `bpy.data.worlds` is
  exactly one World, `scene.world`, named `WORLD_hdri` (a zero-user World is
  not saved, so a second World shows only as the survivor's `.001`), whose tree has exactly one Environment
  Texture, its Vector input unlinked, its image's file name the HDRI row's
  `file`, the Background's Strength 1.0, and a `DARKEN` Mix feeding the
  Background whose B is a grey c over 0; (b) exactly one Sun light, `SUN`,
  whose world +Z is within `SUN_TOLERANCE` 0.5 degrees of the file's sun,
  measured by check.py from the World's image (every pixel with a channel
  over c, weighted by its luminance over c times its solid angle, at
  azimuth 2 pi (0.5 - u) and elevation pi (v - 0.5), v from the bottom row,
  which is the mapping measured above), and whose strength times its colour's
  luminance is within 2% of that removed luminance; (c) every other light is
  a Point light carrying `lightFor` and `kind`, inside its source's box grown
  by 0.1 m (the blueprint piece's box, or the `BRAZIER_` tree's world
  bounds); (d) one `BRAZIER_<n>` per blueprint brazier, each root within
  0.01 m of its `position`. The measurement in (b) is check.py's own, from the
  saved file; `lighting.py` holds the numbers as constants, so a sun or an
  HDRI row that drifts from the other is named. Passing prints `WORLD_hdri
  from kloofendal_48d_partly_cloudy_puresky_4k.hdr, clamp 16; SUN 0.0x deg
  from the HDRI's sun, 4.419 against 4.419 removed; 37 practicals (30
  candle, 2 torch, 4 brazier, 1 hearth); 3 braziers at the blueprint's
  positions` (on `--only lighting`, `3 practicals (3 brazier)`). **Line 8,
  `cameras`** (runs when `lighting` ran): one camera object `CAM_<name>` per
  blueprint camera and no other object named `CAM_*`; each within 0.01 m of
  its eye and 0.1 degrees of its aim, its `lens` (or `angle_y`) the file's;
  each blueprint camera's `stand` not null, its `reachable` true and its eye
  1.7 over `stand.h` within 0.01; `scene.camera` is `CAM_spawn`. Passing
  prints `5 cameras (spawn, courtyard, hall, chapel, town), each at its
  blueprint eye and aim, each on a floor the spawn reaches (ground x4,
  floor-nw-tower-roof x1); scene camera CAM_spawn`. The header comment and
  `README.md` say eight lines.
- **The breaks from green (8, #34)**, each restored before the next, each
  quoted as printed. The texts below are the format `check.py` is written
  to; where a number is "about", the printed one is the record. (1) Delete
  `CAM_hall`: `FAIL  line 8 cameras: CAM_hall missing; the blueprint has
  camera hall at game (-31.5, 1.7, 8.2)`. (2) `cameras.json`'s town eye to
  (-38.6, 13.7, -14.8), `town.png`'s ring top: `FAIL  line 8 cameras: camera
  town at game (-38.6, 13.7, -14.8) has no floor a player stands on within
  0.35 m of feet 12.0` (measured: `standAt` null; only `ground` under it).
  (3) The hall's eye to (-34.5, 1.7, 8.2), inside the west curtain: `FAIL
  line 8 cameras: camera hall at game (-34.5, 1.7, 8.2) stands on ground
  (level 0) at 0.00, which the spawn does not reach` (measured: `standAt`
  ground, `reachable` false). (4) `CAM_courtyard` moved 0.5 m in x after
  it is made: `FAIL  line 8 cameras: CAM_courtyard is 0.500 m from its
  blueprint eye (-4, 1.7, -5)`. (5) Comment out `lighting.py`'s
  `world_from_hdri` call, which is the HDRI removed: `FAIL  line 7 light:
  the scene has no World; lighting builds WORLD_hdri from
  kloofendal_48d_partly_cloudy_puresky:hdri`, and line 4 still passes one
  node and one image lower, which the report quotes as the reason line 7
  exists. (6a) Leave `terrain.py`'s call in place: the
  through build raises `lighting: the file already has 1 World(s)
  (WORLD_hdri) before this stage; lighting builds the only one (#873), so
  whatever made that one has kept terrain's old call` and `build.mjs` exits 1
  before check.py runs. (6b) The same with that raise commented out: the
  build saves, and `FAIL  line 7 light: the World is WORLD_hdri.001, not
  WORLD_hdri: a World made before lighting's was dropped on save; lighting
  builds the only one`. The `2 worlds` text this call first specified never
  prints: Blender drops terrain's World on save, since lighting's took
  `scene.world` from it, and check.py saw one World and passed (#876's
  correction). (7)
  The world with no clamp (`clamp=None`): `FAIL  line 7 light: WORLD_hdri
  has no sun clamp (a DARKEN mix before its Background), so the sun is
  counted twice`. (8) `SUN`'s Blender Z rotation 55.740 to 60.740: `FAIL
  line 7 light: SUN points 3.35 deg from the HDRI's sun (limit 0.5)`, about
  3.35 since 5 degrees of azimuth at 47.87 degrees of elevation is that arc.
  (9) Delete `BRAZIER_2`: `FAIL  line 7 light: 2 BRAZIER_ objects for the
  blueprint's 3 braziers; missing brazier-2`. (10) `BRAZIER_CLASH = {}`: the
  build raises `lighting: brazier-3 (BRAZIER_3) at game (-20, 0, 10)
  meets WoodenTable_01 and 2 more (gothic_statue, brass_candleholders); a
  brazier stands clear of every piece unless BRAZIER_CLASH names it (#874)`,
  the table being first in blueprint order. (11) `'coals'` out of `EMIT` and not back in
  `KEEP`: `props.py` raises naming region `coals`, the first object in build
  order that carries it, and its file (#863's guard, unchanged).
- **The render budget (9, #877).** Recommend **#855's 1024 samples inside
  and 128 outside, unchanged, per camera in `cameras.json`**. Measured at
  960 x 540 with adaptive sampling on (Blender's default noise threshold),
  denoised, at each still's exposure: the mean display difference from a
  1024-sample render was 0.0160 at 128, 0.0152 at 256 and 0.0158 at 512 in
  the hall at x32, and 0.0156 between two 1024-sample renders with different
  seeds; the King's hall (0.0161, 0.0161, 0.0161 against 0.0164) and the
  nave (0.0201, 0.0200, 0.0202 against 0.0198) the same, and today's
  lighting in the hall too. So at that size 128 is as converged as 1024. It
  is kept at 1024 because #855's streaks were seen by Devon at 1920 x 1080
  and a mean difference cannot see a streak, and because it costs nothing
  worth saving: every one of those renders took 29 to 34 s whatever its
  sample count, scene sync and texture load being most of it.
- **New assets (10).** Recommend **none, and nothing is fetched**: the World
  is the HDRI row increment 1 fetched, the flames are Devon's atlas, the
  braziers are his `brazier` collection in the pinned `.blend`. `fetch.mjs`
  still prints 203 sources; `CREDITS.md` does not change.
- **The module split.** Recommend **`lighting.py` new; `cameras.json` new;
  `export-blueprint.mjs` gains `braziers` and `cameras` and prints `3
  braziers, 5 cameras, 5 standing` after its counts; `materials.py`'s
  `world_from_hdri` gains `clamp` and `flame_material()` is new;
  `terrain.py` loses its call and `HDRI`; `props.py` gains `EMIT` and slot
  6 and the one-stem append-and-re-material function; `check.py` gains lines
  7 and 8; `README.md`'s stage row and the line count**. `build.py`,
  `build.mjs`, `common.py`, `fetch.mjs`, `sources.json`, `allow.json`,
  `CREDITS.md`, `STAGE_OF` and every geometry stage but `terrain` and
  `props` do not change. `lighting.py` holds `SUN_CLAMP`, the sun's four
  numbers, `LUX_PER_UNIT`, `PRACTICAL_GAIN`, the kinds table and
  `BRAZIER_CLASH`, and `materials.py` holds `FLAME_EMISSION`, each citing
  #873 or #874. `lighting.py` prints the practicals by kind and by source, each
  brazier's overlaps, the five cameras with their `stand`, and its line 4
  share.

### Dependencies

- **Gate: none.** Needs Devon's Windows machine with the Steam Blender 5.2
  (#840): it is "Local: Blender GPU", the full feature set on a real GPU,
  and huginn does not take it (#878),
  and a network to Poly Haven for each increment that adds a `sources.json`
  row (1, 2, 3, 4 and 6, and the thatch swap after 5; increment 5 builds
  on a stand-in and fetches nothing, #857; the
  HDRI moved from 7 to 1, #846; increment 2's
  nine sets are #849; increment 3's two, `wooden_gate` and `rusty_metal`,
  are #852, Devon's of 2026-09-27, already fetched). The first fetch waited
  on Devon's yes to the asset list with sizes, given 2026-09-27. **Increment
  4's five, `old_planks_02`, `rock_tile_floor`, `floor_tiles_02`,
  `dirty_carpet` and `rough_wood` (25 rows, 50,820,764 bytes), have Devon's
  yes to that list with sizes, given 2026-09-27, and are not yet fetched.**
- **Increment 3's order inside the lane**: the tiling break-up in
  `materials.py` (#850) lands before `gates.py` starts, because `ALIAS` and
  `PLAIN` edit the same `library` function.
- **Increment 4's order inside the lane**: Devon's yes to the five sets,
  then `materials.py`'s `LIBRARY`, `PLAIN` and `SWAP_RISE` and `masonry.py`'s
  three helpers (`minus_discs`, `Solid.slab`, `plate`'s `axis`), then 4a's
  `buildings.py`, then Devon's lines on 4a's two stills, then 4b. **4b's
  own order** (#854): `materials.py`'s `DRESSED`, `DRESSING`, `LOOK` and
  its two parameters and `masonry.py`'s `split_boxes` and `Solid.paint`
  first, then `gates.py`'s passage paint (a `--only gates` build shows the
  dressed arch and the new plaster before `buildings.py` is touched), then
  `buildings.py`. No fetch: 4b adds no `sources.json` row.
- **Increment 5's order inside the lane**: Devon's lines on #857's look
  calls, the stand-in and 4b's notes are given (2026-09-28), so no fetch;
  `materials.py` (`THATCH_SET`, `thatch()`, `DRESSING` and its check,
  `object_tint`), `terrain.py`'s memo and `buildings.check_box`'s `stage`
  first, with 4b's two `--only` builds rerun green and the two #858
  re-renders made before `town.py` is touched, so a moved gate-over or hall
  is caught as those files' fault and the dressing is judged on its own;
  check line 4's counts before and after are quoted, since the dressing now
  loads `stone_pavers`' images where it loaded `medieval_blocks_02`'s; then
  `town.py`. **The look fixes (#860, #861)**, before increment 5 closes:
  `blocks-inner-before.png` from the green build first; then
  `materials.py` (`SWAP_RISE`, the two `LOOK` entries, `box_material`'s
  `rough_min`) with 4b's two `--only` builds rerun and their line 4 counts
  quoted; then `town.py`'s `PLASTER_TINTS` and `TINT_APART`; then the full
  and `--only town` builds, the breaks and the five after-stills. No fetch.
  **The swap, a later increment of its own**: Devon's pick among
  the three sets; the fetch (5 rows, one download each into scratch,
  refused unless size and md5 equal the API's, then sha256 and `bytes` by
  hand, as increments 2 to 4); `THATCH_SET`, one line; the four town stills
  under their plain names. A `builder` job, since every number is here.
- **Increment 6's order inside the lane**: Devon's yes to the 65-row Poly
  Haven list at 1k (67.5 MB, #864) before its fetch, the increment's one
  network use; nothing else waits on it. First the shared edits
  (`materials.py`, `terrain.absolute_images`, `town.barrel`,
  `common.source_path`, `fetch.mjs`'s `path` rule and the
  `castle_props:blend` row), with the through build rerun unchanged at
  212/132, 18/90 and 240; then `props.py` for the kit, Devon's 75 and the
  built slabs, at which point `--only props` fails line 6 naming exactly the
  12 Poly Haven ids, the expected red, which says the other 175 are
  realised; then the fetch and the 12; then the breaks and the stills. One
  `builder` sitting; a look pass after Devon's lines on the stills is its own
  increment, as 4b and #860 were.
- **Increment 7's order inside the lane** (#873 to #877): no fetch and no
  Devon yes waits on it. First `export-blueprint.mjs` and `cameras.json`
  (Node alone; the blueprint prints `3 braziers, 5 cameras, 5 standing`);
  then `materials.py` and `props.py` (`MAT_flame`, `EMIT`, the one-stem
  function) with `terrain.py`'s call still in place, the through build to
  `props` rerun with line 5 and 6 unchanged and line 4 quoted; then
  `terrain.py` loses the call and `lighting.py` lands, with `check.py`'s
  lines 7 and 8 in the same commit, since a stage that ran with no body for
  its lines fails by design; then the two builds, the breaks, and the five
  stills. One `builder` sitting. The game-side fix for `brazier-3` (a
  one-tile edit to `scene-config.json`) is not this row's and does not gate
  it.
- **Lane G, `tools/castle3d/`**, this row's alone (#842). It shares no file
  with lane F, so it may run beside a rank 1 or rank 2 session; that is two
  Blenders on one machine and Devon's call. Both add a line to
  `package.json`'s scripts, a one-line merge.
- **Rank 9's quay and river**: shipped (#870 to #872), not a gate.
  Increment 1 picks the water up from the blueprint.
- **The integration row**, ranked 2i, shape decided in #900 to #905, full
  spec waits on increment 9's `gltf-transform inspect` numbers, which it
  argues from (#904). Lane G. It will open the outer gate and the four drum
  doors in the model (#903), which changes `tools/castle3d/` after this row
  closes.
- **Rank 4**: its increment 2 is superseded by this row (#839); its
  looking checklist is unaffected and runs in rank 3's sitting.

### Constraints

- #36, #37: no save change; lane A is not touched.
- #493: nothing the page fetches changes. `fetch.mjs` is a build-time tool
  on Devon's machine, never in the page or in CI.
- #499: nothing lands in the repo but scripts and three small JSON and
  Markdown files; the model's hundreds of megabytes stay outside (#841).
- #500: `blueprint.json` is `makePlan`'s output, computed once, never
  committed, never re-derived.
- #506: nothing reaches `assets/`, so nothing is encoded; that is the
  integration row's (2i; ceilings and encode argued from increment 9's
  numbers, #904).
- #529, #611: no assertion moves and no ceiling moves; no suite gains a
  line.
- #13, #34, #147: every `check.py` line and every launcher refusal has its
  break; a line that stays green on its break is not shipped.
- #53: every look is Devon's, from stills or the live session.
- #632: `sources.json` and `allow.json` are read by `JSON.parse` and
  `json.load`, which take either line ending; nothing here writes a repo
  file.
- #803, #805: whole for `tools/blender/`, and not this family's (#840).
  #804's CI exit is (#842).
- Windows: `pathToFileURL` for every absolute `import()`, no brace
  expansion in anything `build.mjs` shells.
- #839 to #844.
- #830, amended by #863 for this family only: `props.py` imports
  `tools/props/atlas.py` for the atlas's region names and checks its painted
  pixels against the packed image; nothing else under `tools/props/` runs,
  and nothing there changes.
- #435 and #851: the game's `barbican-west` stays solid and #435 stands for
  the game; the model's outer gate carries no `planId`, no `GATE_` name and
  no `allow.json` entry.
- #844, amended by #876: eight `check.py` lines, not six; lines 7 and 8 run
  when `lighting` did, and each has its break.
- #500 and #843, extended by #874 and #875: the braziers' positions and the
  cameras' footing are computed in Node by `castle-plan.js`'s own
  `tileToWorld`, `standAt` and `walkability`, never again in Python.

### Looking checklist

- [ ] From `CAM_spawn`: the barbican and the west gate, the same distance
      and height the game shows?
- [ ] The curtain's batter and crenellation against the drums: one build?
- [ ] From the road: the outer gate shut, the road arriving at it?
- [ ] The open west and porter leaves under their vaults: a leaf against
      its jamb, or a leaf through the stone?
- [ ] The raised portcullis in the west gate's crown: points, or a plank?
- [ ] Box-projected ashlar at a corner and along a 40 m run: a seam, or a
      repeat you can count?
- [ ] The hall and the chapel nave at `CAM_hall` and `CAM_chapel`: rooms
      with thickness, or boxes with a texture?
- [ ] The hall's roof from the outer ward and from under the trusses: a
      roof on a frame, or a lid on scaffolding? The tile floor: a floor,
      or a repeat you can count?
- [ ] The louvre from the outer ward: a louvre on a ridge, or a box on a
      roof? The dressed doors and windows: a surround, or a painted frame?
- [ ] The gate-overs and the upper rooms' plaster: a limewashed wall, or a
      lit card?
- [ ] Devon's props re-materialed: his objects, or somebody else's?
- [ ] The Poly Haven furniture beside Devon's props in the hall: one room,
      or two catalogues? The kit's barrels and crates: Mereford's, or
      another kit's?
- [ ] Mereford at `CAM_town`: a town, or one house forty times?
- [ ] The thatch from the North-west Tower and from the street: thatch, or
      a brown felt? The jetties and the framing: a street, or a stage set?
- [ ] `CAM_hall` and `CAM_chapel` at +9.75 and +10: a daylit room with its
      fires lit, or a night scene? The candle flames and the brazier's
      coals: a flame, or a white blob?
- [ ] `CAM_spawn` beside a game screenshot from the spawn: the same view?
      The sun's shadows the same way round?
- [ ] The hall's brazier (`brazier-3`) against the statue and the table:
      the game's clash, reproduced; seen?

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
ships (#902); forty per-room textures would be deleted that day. What is left of this row is
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
  second trigger in `QuestManager` with its own browser beat. What is left
  for that increment: the twelve's pairs heard by room and bell rather than
  by #732's 1.5 to 3 m between settled bodies; a performance first, then
  the room's pairs in file order, one at a time, each once per page and
  never saved (#39); the beat in `quest.mjs` and the wire in
  `plan-vs-scene.mjs`, nothing Node can prove.
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
