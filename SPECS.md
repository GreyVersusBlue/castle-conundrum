# SPECS

A spec per ranked row in `BACKLOG.md`. **`BACKLOG.md` ranks; `ROADMAP.md`
orders; this file says what each row is, in the detail `PLAN.md` gave the seven
phases and the backlog rows never got.** Each section's Dependencies below is
where `ROADMAP.md`'s gates and lanes came from (#600 to #602); where this file
and that one differ, this one was written against the code and wins. `HISTORY.md` is still the only record: nothing in here is a locked
decision. Every "recommendation" below is exactly that, and the session that
ships the row is the one that records the call with a number.

One section per row still open in `BACKLOG.md`'s ranked table: 1, 3, 4, 6, 7,
9, 11, 13, and the rank 2 band (2a to 2e), whose five pack sections are
being written by other sessions. The red suite is closed; its section is a
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

## Blender: the pipeline

**Rank 1. Size 1. Model Opus 5. Where: Local: Blender. Gate: none; it is
the gate for every rank 2 pack. Lanes F and B.** Devon's instruction of
2026-09-25: assets made in Blender are the top priority (#801). Blender runs
on his Windows machine only, headless, never in a container and never in CI
(#804). This row builds the pipeline every pack in the rank 2 band (2a
evidence props, 2b an interiors kit, 2c the shared rig, 2d animals, 2e the
countryside backdrop) goes through, and proves it end to end with one placed
crate. Decided in `HISTORY.md` as #801 to #808; this section is the
`builder` job those decisions leave. Nothing under `tools/blender/` exists
on `6a279de`.

**The shape, in one line**: Blender builds each asset from an empty factory
scene out of a seeded script, exports it into a gitignored staging folder,
and a Node step writes the bytes that are committed, meshopt-encoded, with a
manifest row per file; CI never runs Blender and holds the committed bytes
to the manifest and the manifest to the scripts (#803, #806).

### Scope, the pipeline (class S from here)

- **`tools/blender/common.py`**, imported by every pack script. In order:
  - **The pin** (#805): `if bpy.app.version[:2] != (4, 5):` print the
    version found and `sys.exit(3)`.
  - **An empty scene**: delete every object, mesh, material, image and
    camera the factory startup made, so an asset owes nothing to what was
    there. `scene.unit_settings.system = 'METRIC'`, `scale_length = 1.0`:
    one Blender unit is one metre.
  - **The seed**: `seed(row)` calls `random.seed(row["seed"])` with the
    row's string seed, and every random draw in a pack goes through Python's
    `random` after it. No `time`, no `uuid`, no `os.urandom`, no iteration
    over a `set` of strings whose order matters (`render.mjs` fixes
    `PYTHONHASHSEED=0`, which is a backstop, not a licence).
  - **The frame**: build Z-up, as Blender is; before export, move every
    root so the asset's bounding box has min Z at 0 and is centred in X and
    Y, and apply the transform. The front faces Blender -Y, which the
    exporter turns into glTF +Z, the way the bodies face (#788).
  - **The look helpers**: `flat(obj)` shades flat; `palette_material(pack)`
    makes the pack's one material, a Principled BSDF with metallic 0,
    roughness 1, and a palette atlas PNG (below) on base colour, sampled
    Closest; `swatch_uv(obj, face, colour)` points a face's UVs at a
    swatch's centre.
  - **The export**: `export(path)` calls `bpy.ops.export_scene.gltf` with
    `export_format='GLB'`, `export_yup=True`, `export_apply=True`,
    `export_extras=False`, no cameras, no lights, animations only when the
    pack says so, into the staging path `render.mjs` passed.
  - **The contact sheet**: `contact_sheet(pack, objects)` lays the pack's
    assets on a row, one fixed orthographic camera at a three-quarter view,
    Workbench with flat lighting, 1600 x 900, into `shots/blender/<pack>.png`.
    `shots/` is already gitignored. It is for Devon to look at and is not a
    test.
- **`tools/blender/packs.json`**, the table, one row per asset:
  `{ pack, name, script, seed, why, ...params }`, and per pack an optional
  `extraColours` (below). The table is what the source hash reads.
- **`tools/blender/packs/calibration.py`**, the one pack this row ships: a
  crate, about 0.8 m on a side, planks and two battens, flat, under the caps
  below. It is a real prop and stays; it is also the file a later session
  reads to write its first pack.
- **`tools/blender/render.mjs`**, `npm run blender:render [pack ...]`,
  Devon's machine only. Exits non-zero if `CI` is set (#804). Finds Blender
  at `BLENDER` or on PATH, runs `blender --version` and refuses anything but
  4.5 before any pack. For each row: `blender -b --factory-startup
  --python-exit-code 1 -P tools/blender/packs/<script> -- --row <json>
  --out tools/blender/.staging/<pack>/<name>.glb`, with `PYTHONHASHSEED=0` in
  the environment and `pathToFileURL`/`path.join` for every path, since it
  runs on Windows. Then calls `finish.mjs` on what landed. Prints a line per
  file: written, or unchanged.
- **`tools/blender/finish.mjs`**, pure Node, exports `finish(staged, row) ->
  { bytes, manifestRow }` for `render.mjs` (#806). Reads with gltf-transform,
  sets `asset.generator` to `"castle-conundrum tools/blender"`, drops
  `asset.copyright` and every `extras`, applies `meshopt({ encoder:
  MeshoptEncoder, cleanup: false })`, and returns the bytes and the row:
  `{ file, pack, name, bytes, sha256, triangles, images: [[w, h], ...],
  blender, source }`. `render.mjs` writes the `.glb` only if the bytes differ
  from what is on disk, and the manifest only if a row changed.
- **`tools/blender/manifest.json`**: `{ comment, blender: "4.5", rows }`,
  rows sorted by `file`, two-space JSON. **Written in the file's own line
  ending** with `eolOf` from `tools/place.mjs` (#631, #632): CRLF on Devon's
  checkout, LF in CI, and a new file starts LF. `render.mjs` for one pack
  rewrites that pack's rows and leaves every other row's text alone.
- **`source`**, the hash that makes a stale render visible: sha256 over, in
  order, `common.py`, the row's script, `finish.mjs`, and the row as
  `JSON.stringify` of its keys sorted, **each text file normalised to LF
  first**, so the same commit hashes the same on Windows and in CI. The
  function is exported from `finish.mjs` so check 8 and the writer agree by
  import, and check 8's line 5 is what stops that being a test that
  re-implements its subject.
- **`assets/blender/calibration/crate.glb`**, the only asset.
- **`src/castle-plan.js`**: export `propPath(base, model)`, `heldPropPath`'s
  rule (a `model` starting `assets/` is repo-relative, anything else is under
  `polyhavenBase`), and use it at all eight sites that join an
  `interiorProps` model today: `castle-plan.js` twice, `castle-builder.js`,
  `tools/encode-assets.mjs`, `test/budget.mjs`, `test/assets.mjs` three
  times (#500: one computation, everybody reads it). An `interiorProps` row
  whose `model` starts `assets/` with no `id` throws, naming the model
  (#812): check 2's messages and `plan-vs-scene.mjs`'s tags name a piece by
  its id, and deriving one from a basename would give two goblets one id in
  silence.
- **`data/scene-config.json`**: one `interiorProps` row, `"id":
  "larder-crate"`, `"model": "assets/blender/calibration/crate.glb"`, in
  the larder, spliced by `tools/place.mjs`'s writer in the file's own
  ending (#584, #632). Asset and reference in one commit (#390).
- **`test/assets.mjs`**: check 8 (below), and check 4's sweep gains
  `assets/blender`.
- **`package.json`**: `"blender:render": "node tools/blender/render.mjs"`.
  **`.gitignore`**: `tools/blender/.staging/`. `CLAUDE.md`'s npm table and
  `README.md`'s credits line (the meshes under `assets/blender/` are the
  project's own, as #743 said of the pixels) are the lead's one-liners.
- **Untouched**: `tools/bodies/`, `tools/pixel/`, `assets/NPCs/`,
  `src/save.js` (no version bump), `test/budget.mjs`'s ceilings.

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

### Acceptance

**`npm test` fifteen of fifteen, and check 8 is new in `test/assets.mjs`**
(#808), after check 7, over every row of `tools/blender/manifest.json` and
every file under `assets/blender/`. Its caps are named constants in one
block at the top of the check, one line per pack, never read from the
generator: `calibration: { triangles: 300, bytes: 24000 }`. Each line below
has the break that must turn it red from green (#34); the ones marked
*local* need a re-render, and so Devon's machine.

1. **The pin.** Every row's `blender` starts `4.5.` Break: edit the crate's
   row to `4.2.1`.
2. **The bytes.** Every row's `file` exists, is `bytes` long and hashes to
   `sha256`. **Break, the one the builder quotes in the report: flip one
   byte of `crate.glb`.** Expected: "assets/blender/calibration/crate.glb
   hashes to ..., the manifest says ...: it changed after its render".
3. **Both ways.** Every file under `assets/blender/` is a manifest row, and
   every manifest row is a `packs.json` row and back. Break: delete the
   crate's manifest row.
4. **Not stale.** Each row's `source` equals the hash of today's
   `common.py`, script, `finish.mjs` and table row. Break: change the
   crate's `seed` in `packs.json` without rendering. The failure says to run
   `npm run blender:render calibration` on a machine with Blender 4.5.
5. **Both endings** (#632). The source hash of each input, built once as LF
   and once as CRLF from what is on disk, is the same hash; and
   `manifest.json` has no line ending of the other kind. Break: remove the
   LF normalisation from the hash; the CRLF copy disagrees on every machine.
6. **The shape.** Each file carries `EXT_meshopt_compression`, and no
   `KHR_texture_basisu`, `KHR_materials_unlit` or `COLOR_0`; one material,
   metallic 0; its triangle count (`test/gltf.mjs`'s `triangles`) equals the
   row's and is under its pack's cap, and its bytes are under the cap; its
   box (`partsOf`) has min y within 1 mm of 0 and x and z centred within
   1 mm. Breaks, *local*: a bevel with enough segments to pass 300
   triangles; the crate lifted 0.1 m before export.
7. **The images.** Every image in a Blender `.glb` is a PNG, at most 128 px
   a side, at most 32 colours, and every texel is in the castle's palette
   union or the pack's `extraColours`. Break, *local*: one swatch
   `#ff00ff`.
8. **No input files** (#803). No `.blend` anywhere under `tools/` or
   `assets/`, and no file under `tools/blender/` calls `import_scene`,
   `open_mainfile`, `libraries.load` or `images.load`, or imports `time`.
   Break: add a `bpy.ops.import_scene.gltf(...)` line to `calibration.py`
   (line 4 goes red too; the report quotes line 8's message).

**Held by what already exists, once `propPath` is in**: check 1 (the
crate's model resolves), check 4 (it is referenced), check 5 (meshopt),
`test/layout.mjs`'s prop rules and `PROP_CLEARANCE`, `test/plan-vs-scene.mjs`
diffing its box at 0.01 m with no new line (#529), `test/budget.mjs` counting
its one draw and its atlas, `test/built.mjs` serving it from `dist/`.

**Determinism, local, and written into `HISTORY.md`**: two consecutive
`npm run blender:render` on Devon's machine; the second prints "unchanged"
for the crate and `git status` is clean. If it is not, #806's fallback, in
that order.

**The look, local** (#53): the contact sheet and the crate in the larder on
a GPU, one sentence each: does it read as the kit's kind of object beside
the kit's barrels? Blocks nothing in `npm test`.

### Open calls

- **Where the crate stands.** Recommend **the larder**, against a wall, on
  the ground: a store room already reads as crates, it is indoors so it
  moves no outside bucket, and one draw call is the whole cost.
- **Vertex colours or an atlas.** Recommend **the atlas, and `COLOR_0`
  refused**: a float colour through linear-to-sRGB is not checkable against
  a palette without a tolerance, an atlas texel is, and it is the kit's own
  method. The cow's vertex colours are `tools/bodies/`' and untouched.
- **Colours outside `textures.json`.** Recommend **at most 8 per pack in
  `extraColours`, each with a `why`**: a bloodstain or a cow's hide has no
  stone colour, and a cap keeps the look one castle.
- **One manifest or one per pack.** Recommend **one**: line 3 is one read,
  lane F serialises every writer anyway, and one machine renders.
- **Commit the contact sheet.** Recommend **no**, into `shots/blender/`:
  it is a look, not a record, and a binary nobody diffs.
- **What the source hash covers.** Recommend **`common.py`, the script,
  `finish.mjs` and the row**, not `render.mjs`: `render.mjs` only launches,
  and a change to how it launches that moves bytes shows up in line 2 on
  the next render anyway.
- **If Devon's installed Blender is not 4.5.** Recommend **install 4.5 LTS
  beside it (the portable zip) and point `BLENDER` at it**; the pin moves
  only by a HISTORY entry and a full re-render (#805).

### Dependencies

- **Gate: none to start.** Needs Blender 4.5 and Devon's machine (#804);
  a session without it writes nothing here.
- **Lanes F and B.** F because this row makes `tools/blender/`; B because
  the crate is spliced into `data/scene-config.json`, so it does not run
  beside rank 4, rank 9 or rank 13's increments 2 and 3.
- **Every rank 2 pack is gated on this row shipping**: none of them has a
  `common.py`, a manifest or a check 8 to extend until it does.
- **Beside rank 3 on the same machine**: yes, if rank 3 takes its
  `git worktree` first (#602's note); this row writes the tree.

### Constraints

- #493: nothing fetched; Blender and its exporter run offline.
- #499: the crate is under 24 KB against 200 MB.
- #506: meshopt by `finish.mjs`, the encoder's own call; nothing lands raw.
- #390: the crate and its `interiorProps` row in one commit.
- #500: `propPath` lives in `castle-plan.js` and every site reads it.
- #529, #611: every rail is `assets.mjs`'s; no ceiling moves, the draw count
  is `budget.mjs`'s as it stands.
- #632: the manifest in its own ending, the source hash over LF, both
  endings asserted.
- #13, #34, #147: every line has its break; a line that stays green on its
  break is not shipped.
- #53: the look and the second-run evidence are Devon's machine's.
- Windows: `pathToFileURL` for any absolute `import()`, no brace expansion
  in any script `render.mjs` shells.
- #801 to #808.

### What every Blender pack shares

A pack section cites this paragraph instead of restating it. **A pack is
rows in `tools/blender/packs.json`, one script at
`tools/blender/packs/<pack>.py` that imports `common.py`, and output under
`assets/blender/<pack>/`, written by `npm run blender:render <pack>` on
Devon's machine with Blender 4.5 and nowhere else** (#804, #805). Every
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

**Rank 2a. Size 1. Model Opus 5. Where: Local: Blender. Gate: after rank 1.
Lanes F and B.** The first pack after the calibration crate, and the one
that proves `finish.mjs`, check 8 and `test/budget.mjs` on content a player
presses E at. Everything under "What every Blender pack shares" in "Blender:
the pipeline" holds here and is not restated. Decided in `HISTORY.md` as
#810, #811, #812, #816 and #819, against `86c72fb`; this section is the
`builder` job those leave. Two increments, both class S, each one sitting on
Devon's machine; a third is conditional on the GPU look.

**What the brief asked for, against the data.** The brief named a dagger, a
goblet, vials, candles at several heights, a ledger and a seal.
`data/mystery.json` has eleven evidence rows and none of them is a dagger, a
goblet, a vial or a seal. What each of the six is, measured:

| Brief | What the data has | Stand-in today | This pack |
| --- | --- | --- | --- |
| dagger | `knife`, "bakehouse barrel": "The kitchen knife, in the bakehouse, flour on it" (`knife-found`, a herring) | `detail-barrel.glb`, a kit barrel, in `courtyard.placements` | **swap**: `knife-barrel.glb`, a flour barrel with the knife's handle over the rim |
| candles at several heights | `candle`, "chapel candles": "One tallow candle in a pricket at the first turn of the Chapel Tower stair. Wax pooled on the step below it"; `candle-count` quest: four tallow in the aumbry at Compline, three at Lauds | `brass_candleholders`, a photoscanned 1.08 m spread of three brass candlesticks, 7 primitives, 41,936 triangles | **swap**: `pricket.glb`, an iron floor pricket, a stub burnt to 4 cm, the wax pool; **dress**: `aumbry-candles.glb`, the aumbry with the three at 26, 22 and 18 cm |
| ledger | `ledger`, "works ledger", behind the word-lock: "340 sheets received, 212 laid" | `WoodenTable_01`, a photoscanned table with nothing on it | **swap**: `ledger-desk.glb`, a desk with the ledger open on it |
| seal | no evidence; `prisoner-story`: "with the Clerk's seal on the pass" | nothing | **dress**: `seal.glb`, the seal matrix, a stick of red wax and a folded pass, in the Clerk of Works' office |
| goblet | no evidence; `steward-denies` ("He was drunk") against `hywel-sober` | nothing | **dress**: `goblet.glb`, pewter, on the Great Hall's table |
| vials | nothing in any clue, quest or document | nothing | **dress**: `vials.glb`, three stoppered vials in a rack, on rank 1's crate in the larder |

Three swaps replace the thing the player presses; four dressings stand
beside it or in a room with no evidence at all. No dressing is pressable,
so no dressing is a clue, and no clue, deduction, press or station changes
(#810).

### Scope, increment 1: the four dressings (class S)

- **`tools/blender/packs/evidence.py`**, importing `common.py`: one function
  per asset, dispatched on the row's `name`. Round things (goblet, vials,
  candles) are lathed at 8 to 12 sides; nothing is subdivided.
- **`tools/blender/packs.json`**: four rows, pack `evidence`, each with a
  `why` that names the clue it dresses or says it dresses none. The pack's
  `extraColours`, at most 8: tallow, sealing wax, brass, pewter, two glass
  and steel, each with a `why`. The palette union has no bright tallow,
  wax red, glass or brass.
- **`assets/blender/evidence/{goblet,vials,aumbry-candles,seal}.glb`** and
  their `tools/blender/manifest.json` rows.
- **`data/scene-config.json`, `interiorProps`**, four rows, spliced by
  `tools/place.mjs` in the file's own ending (#584, #632), each with an
  explicit `id`:
  - `hall-goblet` on the Great Hall's `WoodenTable_01`, a free spot on its
    top clear of the lantern and the candleholders; stacked by
    `surfaceHeightUnder`, so the row comes after the table's.
  - `larder-vials` on rank 1's crate, stacked the same way. The larder is
    one of the nineteen empty rooms (#582), and this is its second thing.
  - `chapel-aumbry` on the chapel's drum wall, `yOffset` 1.2 and
    `noCollide`, the way `kite_shield` hangs in the hall. The builder picks
    the arc, clear of the chapel's door and of every pressable (check 1e
    below), and writes the tile in `HISTORY.md`.
  - `clerk-seal` on the roped crate by the barrels in the Clerk of Works'
    office (tile [-8.1, -1.85]), `yOffset` the crate's top off `partsOf`,
    `noCollide`. Not on `works-ledger`, which is a pressable.
- **`src/castle-plan.js`**: an `interiorProps` row whose `model` starts
  `assets/` and carries no `id` throws, naming the model (#812). Today the
  id is `p.model.split('/')[0]`, which is `"assets"` for every Blender
  path, so the second Blender row would share an id with the first. Rank
  1's crate row gains `id: "larder-crate"` in this commit if it shipped
  without one.
- **`test/layout.mjs`, new check 1e, "nothing stands over a pressable"**
  (#812): for every piece carrying `evidence`, `read` or `bell`, no other
  non-ground piece overlaps its box in plan by more than 1 cm in x and in z
  with its own base at or above the pressable's centre height and below
  the pressable's base plus `EYE_HEIGHT`. That is the band between the
  prompt's aim point and a standing eye, where
  `InteractionSystem.hasLineOfSight` would meet it: `occluders()` is every
  scene child but the bodies and the targets, and a dressing is neither. A
  floor slab 4 m over a level-0 pressable is above the band, and a crate
  under the gaol roll or the cloak is below it. A plan fact, so here and
  not in `plan-vs-scene.mjs` (#529).
- **`test/assets.mjs`**, check 8's caps block, one line:
  `evidence: { triangles: 600, bytes: 32000 }` (#819).

### Scope, increment 2: the three pinned swaps (class S)

- **`tools/blender/packs.json`**: three rows, `pricket`, `knife-barrel`,
  `ledger-desk`. Each asset is symmetric about its origin in x and z to
  1 mm, so a rotation cannot move its box centre.
- **`assets/blender/evidence/{pricket,knife-barrel,ledger-desk}.glb`** and
  their manifest rows.
- **`data/scene-config.json`**, each swap under #811's rule (same id, box
  centre to 1 mm, footprint inside the old box):
  - `candles-chapel`: `model` to `assets/blender/evidence/pricket.glb`, tile
    **[5.69705, 4.30765]**, rotationY 0. That tile is the old box's centre,
    (22.7882, 17.2306), over 4. The old tile [5.675, 4.325] was the
    photoscan's origin, 0.114 m off its box centre, and is not where the
    rail measures from. Footprint at most 0.4 x 0.4 m inside the old
    1.08 x 0.43.
  - `table-muniment`: `model` to `assets/blender/evidence/ledger-desk.glb`,
    tile and rotationY 90 unchanged, since the table's box centre is its
    tile (24.2, -16.6). Footprint inside 0.66 x 1.80.
  - `knife`: the row leaves `courtyard.placements` and becomes an
    `interiorProps` row, same `id` and `evidence`, `model`
    `assets/blender/evidence/knife-barrel.glb`, tile [0.125, 3.825] (the
    kit barrel's centre, (0.5, 15.3)), because `propPath` is read at the
    `interiorProps` sites only. `tools/place.mjs` does not take
    `courtyard.placements`, so that one row is cut by hand in the file's own
    ending (#632). The piece's kind goes from `decor` to `prop`, which puts
    it under check 1; it stands 0.86 m from the drum's centre and clears
    the stone. Footprint inside 0.49 x 0.49.
- **`data/mystery.json`**: the three evidence rows' `prop` become the three
  new paths. `name`, `clue`, `watches`, `room` and every station unchanged.
- **`test/mystery.mjs` check 1, one line**: the resolver for "every evidence
  prop is a model already on disk" tests `e.prop.startsWith('assets/')`
  before `.endsWith('.glb')` and takes such a path as repo-relative through
  `propPath`. Today every `.glb` is joined to `kenneyBase`, so
  `assets/blender/evidence/pricket.glb` reads as missing. **No station line
  in `test/mystery.mjs` changes** (#529): check 2's four `PROP_CLEARANCE`
  expectations stay byte-identical, which is the evidence that the pins
  held.
- **Untouched**: `data/npcs.json`, `data/populace.json`, `data/quests/`,
  `src/save.js`, `src/interaction.js`, `test/plan-vs-scene.mjs`,
  `test/budget.mjs`'s ceilings. The brass candleholders' pack stays on disk:
  the hall's table still carries a set.

### Acceptance

`npm test` fifteen of fifteen after each increment. Each line names its
suite and the break that turns it red from green (#34).

1. **Check 8, the pack's lines** (`test/assets.mjs`), over seven new rows,
   under `evidence`'s cap. **The break the builder quotes for increment 1 is
   line 2's**: flip one byte of `goblet.glb`, expecting "assets/blender/
   evidence/goblet.glb hashes to ..., the manifest says ...: it changed after
   its render". Line 6 (the cap) is *local*: `goblet.py`'s lathe at 64 sides.
2. **Check 1e** (`test/layout.mjs`), new, green on today's data before any
   dressing lands; if it is red on today's data, that is a finding for
   `HISTORY.md` before anything is placed. Break: `hall-goblet`'s tile set
   onto `table-muniment`'s centre (after increment 2, `ledger-desk`), expecting
   "hall-goblet stands over table-muniment, which the player presses E at".
3. **The id rule** (`makePlan`, surfaced by every Node suite). Break: delete
   `hall-goblet`'s `id`; `makePlan` throws naming
   `assets/blender/evidence/goblet.glb`.
4. **`test/mystery.mjs` check 1, the resolver.** Break: take the `assets/`
   branch out; expecting "every evidence prop is a model already on disk"
   to fail listing `candle`, `knife` and `ledger`.
5. **The pins** (`test/mystery.mjs` check 2, unchanged). **The break the
   builder quotes for increment 2**: `candles-chapel` at the old tile
   [5.675, 4.325]. The Constable's put-back station at (5.9, 4.2) is then
   1.03 m from the candle and the rail says nothing, so "the Constable back
   at the candles at Prime" fails; restore the pinned tile and it prints
   0.92 m again, as Hywel's line prints 0.34.
6. **Held with no new line**: `test/layout.mjs` check 3e (each evidence
   piece's model ends with its `prop`, in its room, base inside 1.5 m of the
   floor), checks 1, 1b and 11; `validateMystery` and `validatePopulace` with
   no station moved; `test/plan-vs-scene.mjs` diffing all seven boxes at
   0.01 m, and its candles beat still finding a cell 0.9 to 2.8 m out that
   offers the pricket; `test/built.mjs` serving the seven from `dist/`.
7. **The budget, recorded, not asserted anew** (#816): increment 1 moves
   the outer ward up 3 (goblet, vials, seal) and the inner up 1 (the
   aumbry); increment 2 takes the inner ward down 6 (seven primitives of
   candleholders become one) and removes 41,936 triangles no suite counts.
   The builder writes the two lines `test/budget.mjs` prints, before and
   after each increment, in `HISTORY.md`.

### Open calls

- **The brief's six against the data's eleven.** Recommend **three pinned
  swaps and four dressings, as the table above**: the knife, the candle and
  the ledger are evidence whose stand-in is the wrong object, and the other
  three name no evidence, so they dress rooms rather than invent clues.
- **Swap or dress, for the knife and the ledger.** Recommend **swap**: a
  dressing on top of a pressable sits in its sight ray, and the target is
  the one object the ray is not tested against, so what the player sees on
  it has to be the target itself.
- **Make the seal, the goblet or the vials pressable.** Recommend **no**: a
  new pressable is a new clue with a `source`, which is `validateMystery`'s
  and the mystery's shape, not an asset row's.
- **Rename "chapel candles".** Recommend **no**: `plan-vs-scene.mjs`'s
  candles beat and `npm run play`'s `examine('candle', 'chapel candles')`
  read the name, and it still fits a chapel with an aumbry of three and a
  stub on a pricket.
- **Where the vials stand.** Recommend **on rank 1's crate in the larder**:
  a store room is where vinegar and verjuice stand, it fills an empty room a
  little, and it proves stacking on a Blender asset.
- **An `assets/` row with no id: derive or throw.** Recommend **throw**:
  check 2's messages and `plan-vs-scene.mjs`'s tags name a piece by its id,
  and a basename rule would give two goblets one id without a word.
- **The pouch and the tally stick**, both a `detail-crate-small.glb` today.
  Recommend **a conditional increment 3, only if the GPU look says a crate
  for a tally stick reads wrong**: both are `courtyard.placements` (the
  tally at level 2, where `interiorProps` cannot stand, since the plan
  gives every `interiorProps` row `level: 0`), so it needs `propPath` at the
  placement loop and at `test/assets.mjs`'s placement reference check
  (#500), then the same pinned swap. Class S as written here.

### Dependencies

- **Gate: rank 1 shipped.** `common.py`, the manifest, check 8, `propPath`
  and the larder crate the vials stand on are all rank 1's.
- **Lanes F and B.** Not beside another Blender pack (F), nor rank 4, rank 9
  or rank 13's increments 2 and 3 (B).
- **Rank 3**: increment 2 changes three things `npm run play` examines.
  The next GPU run after it is the one that says the pricket, the barrel and
  the desk still take E on a real screen (#53); run it from a worktree.
- **2b after 2a**: 2b's increment 3 uses #811's pin, and check 1e is the
  rail 2b's sets stand under.

### Constraints

- #529: check 1e is `layout.mjs`'s; `mystery.mjs` changes one resolver line
  and no station line; `plan-vs-scene.mjs` gains nothing.
- #785, #792: `PROP_CLEARANCE` is measured to a pressable's box centre, so
  a swap pins the centre and a dressing is not pressable.
- #500: one `propPath`, read by the resolver too. #390: each asset and its
  row in one commit. #584, #632: spliced, own line ending, including the
  hand-cut `knife` row.
- #611, #816: no ceiling moves. #499: seven files under 32 KB each.
- #13, #34, #147: every line above has its break.
- #53: whether the pricket reads as a candle is a GPU look.
- #801 to #808, #810 to #812, #816, #819.

### Looking checklist

- [ ] The pricket in the chapel at Prime: one candle burnt down, or a stick?
- [ ] The aumbry's three beside it: do the heights read as a count?
- [ ] The goblet on the hall's photographed table, and the seal in the
      office: the kit's kind of object beside a photograph, or a third look?
- [ ] E at the barrel, the desk and the pricket from where a player stands.

---

## Blender: an interiors kit

**Rank 2b. Size 2+. Model Opus 5. Where: Local: Blender. Gate: after rank 1
(and after 2a, for check 1e and #811's pin). Lanes F and B.** Modular
pieces that make the castle's working rooms read as what they are. "What
every Blender pack shares" holds and is not restated. Decided as #813 to
#816 and #819. Three increments: two class S, the third gated on rank 4's
look.

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
  neither is a room, and a room is a layout call (rank 13's editor or a
  rank 9 increment), not a kit's; #582 refused new rooms for volume. The
  lore puts the forge "under the Prison Tower's wall" (year 12), which is
  outside the south curtain; a stable waits on a horse, which is 2d's to
  make or not.
- **The photographed props.** Recommend **2b's increment 3, gated on rank
  4's look** (#813), since the replacement is Blender sets and 2b makes them.
- **A set against a station.** Recommend **the set moves, the station never**:
  stations are `test/mystery.mjs`'s (#529), and a kit has no claim on them.
- **The draw ceiling.** Recommend **no move** (#816); the numbers are there.

### Dependencies

- **Gate: rank 1 shipped; 2a shipped** (check 1e, #811).
- **Lanes F and B.** Not beside any Blender pack, rank 4, rank 9, or rank
  13's increments 2 and 3.
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
GPU look is on the same machine); Container (increment 2). Gate: after rank
1, "Blender: the pipeline". Lanes F and C; not B.** Decided in `HISTORY.md`
as #820 to #825; this section is the `builder` job those decisions leave.
Nothing under `assets/blender/` exists on `86c72fb`. **Rank 10 is retired**
(#807): its "shared low-poly rig for the fifty" is this row, and the Bodies
section is deleted once this one and "Blender: the animals" land. **This row
does not duplicate rank 6**: it makes bodies and writes a person's body
fields; "Life: a populace" owns every ring, every `talk` pair and every new
person's place in the day (#821).

**Every pack rule is "Blender: the pipeline"'s "What every Blender pack
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

- **Gate: rank 1 shipped.** No `common.py`, manifest or check 8 exists
  before it.
- **Lanes F and C.** Increment 1 holds both; increment 2 holds C only. Not
  beside rank 6 (C), 2d (F and C), or 2a, 2b, 2e (F). Beside rank 9 or rank
  4 (B) and rank 7 (E): yes.
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

**Rank 2d. Size 1. Model Opus 5. Where: Local: Blender. Gate: after rank 1
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

- **Gate: rank 1**, and 2c's increment 1 for the shared pieces above.
- **Recommended after 2c's increment 2**, which frees the draw headroom this
  row spends (#828); before it, the argument is 380 to 394 and 205 to 213.
- **Lanes F and C.** Not beside rank 6, 2c, 2a, 2b or 2e.

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

**Rank 2e. Size 1. Model Opus 5. Where: Local: Blender. Gate: after rank 1
and after rank 9's increment 3b. Lanes F and B.** Hills, fields, tree lines
and distant farms on every side the walls look out on, so that what lies
past the curtain is land and not the fog's colour. "What every Blender pack
shares" holds and is not restated. Decided as #816 to #819. One increment,
class S.

**What is there now, measured on `86c72fb`.** The base ground is x -48..36,
z -22..22, the curtain plus 2 m. `outside-ground` is x -198..-48, z -40..40,
west only, and rank 9's 3b cuts its west edge to -140 for the river. North,
south and east of the base's 2 m apron there is nothing: `scene.background`
is the fog colour, so from the north walk the land stops two metres out.
The eyes (every reachable cell 8 m up, 4d's set) run x -38.25..26.25, z
-17.25..17.25, and the highest stands at 12 m, an eye at 13.7. Fog is
`smoothstep(30, 150, depth)`, the camera's far plane 300. The town's walls
reach z -34..30.

**The shape** (#817). One seeded height field over **x -140..180, z
-170..170**, cut into **five backdrop pieces** that, with the two grounds,
tile that rectangle edge to edge:

| Piece | Box in plan | Tile (centre / 4) |
| --- | --- | --- |
| `backdrop-north` | x -48..180, z -170..-22 | [16.5, -24] |
| `backdrop-south` | x -48..180, z 22..170 | [16.5, 24] |
| `backdrop-east` | x 36..180, z -22..22 | [27, 0] |
| `backdrop-north-west` | x -140..-48, z -170..-40 | [-23.5, -26.25] |
| `backdrop-south-west` | x -140..-48, z 40..170 | [-23.5, 26.25] |

Cut from one field, two pieces sharing an edge share its heights by
construction. No piece crosses the river's line at x -140, and nothing is
built west of the water (#796 stands: no far bank).

### Scope (class S)

- **`tools/blender/packs/countryside.py`**, importing `common.py`. The
  field's constants live in the script; each row carries only its `cut`.
  Heights: 0 within 10 m of either ground rectangle; rising through fields
  and slopes; a crest of at least 20 m along every edge that touches nothing
  (the rim, #818). Fields are swatch-coloured faces of the field in its low
  ground; tree lines are low-poly clumps along field edges; woods on the
  slopes; four to six farmsteads (a longhouse, a barn, a fence, a rick) at 60
  to 130 m from the curtain, none nearer than 40 m. All of a piece is joined
  into one mesh: one draw.
- **`tools/blender/packs.json`**: five rows, pack `countryside`, one shared
  seed, `extraColours` at most 8 (wheat, meadow, thatch, each with a `why`).
- **`assets/blender/countryside/*.glb`**, five files; manifest rows.
- **`src/castle-plan.js`**: an `interiorProps` row may carry `backdrop:
  true`, and the piece carries `backdrop: true`. A `backdrop` row without
  `noCollide` throws, because a colliding prop pushes its box top as a
  surface and a 20 m surface over the countryside is a floor nobody built.
  Nothing else changes: with `noCollide` a prop pushes no collider and no
  surface, so the fill, `surfacesAt`, check 4e and check 12 never see it.
- **`data/scene-config.json`, `interiorProps`**: five rows, ids and tiles as
  the table, rotationY 0, `noCollide`, `backdrop`. Spliced (#584, #632).
- **`test/layout.mjs`, new check 4g, "the countryside meets the ground and
  runs into the fog"** (#818), over every `backdrop` piece:
  - its box's min y is 0 within 1 mm;
  - in plan it overlaps no ground piece and no other backdrop piece;
  - every side of `ground` and `outside-ground` (read by id, and the check
    stops if either id is missing, as `budget.mjs` does for the cross-wall)
    is met along its whole length by a backdrop piece's side or another
    ground piece's, except `outside-ground`'s west side, which is the
    river's (#796). That is the seam rule: a gap is a line of fog colour
    between the land and the apron;
  - for each axis in which its box lies wholly beyond the base ground, its
    far side is at least `config.lighting.fog.far` from the nearest of 4d's
    eyes along that axis, except a side on `outside-ground`'s min x, which
    #796 gives to the fog. Measured today: north 152.75, south 152.75, east
    153.75, north-west and south-west 152.75 in z.
  - If no piece is a backdrop, it fails saying it measured nothing.

  4d's eyes come from the one function 3b lifted for 4d and 4f, not a copy.
- **`test/assets.mjs`**, check 8's caps block, one line:
  `countryside: { triangles: 6000, bytes: 160000 }` (#819).

### Acceptance

`npm test` fifteen of fifteen. Each line has its break (#34).

1. **Check 4g, the seam.** **The break the builder quotes**:
   `backdrop-east`'s tile to [27.25, 0], 1 m east, expecting "ground's east
   side at x 36 is met by nothing over z -22..22". (A rule that only asked
   each piece to touch something stays green here, because the moved piece
   still touches the north and south pieces along z -22 and 22; that is why
   the rule is written from the ground's sides.)
2. **Check 4g, overlap.** Break: `backdrop-north`'s tile to [16.5, -23.75],
   1 m south: it overlaps `ground` by 1.00 m in z.
3. **Check 4g, the far side.** Break: `backdrop-north`'s `cut` to z
   -100..-22 and a re-render, *local*: the far side is 82.75 m from the
   nearest eye, inside 150.
4. **The throw.** Break: delete `noCollide` from `backdrop-south`; `makePlan`
   throws naming it.
5. **Checks 4d and 4f, unchanged**, with the five boxes among their
   occluders, which only makes them harder to pass. Every box lies at
   |z| >= 22 east of x -48 and |z| >= 40 west of it; the lines 4d and 4f
   print today (the quay's ridge from `west-curtain-north-walk`, the water
   from `sw-tower-stair-3`, the yard from the North-west Tower's roof) run
   at z -17..16 and meet none of them. The builder records the printed lines
   as unchanged; if one moves, it is still a pass and the new line goes in
   `HISTORY.md`; if one fails, the piece is lowered near the castle, and the
   town is not moved.
6. **Checks 1, 4, 4c, 4e, 10, 11, unchanged**: the backdrop is clear of
   stone, the castle is still sealed, no surface lies over the water, and no
   room has a backdrop piece's centre in it.
7. **`test/budget.mjs`, unchanged** (#816): five meshes, all outside both
   wards, so five more in each ward's sum. The builder records the printed
   lines before and after.
8. **Check 8** over five rows under `countryside`'s cap; line 6 is *local*:
   the field at a 1 m grid.

### Open calls

- **Pieces or ground.** Recommend **pieces with `backdrop` and
  `noCollide`** (#817): a `ground.outside` box is a flat walkable surface
  that check 10 and the rank-5 check hold, and a hill is neither.
- **One mesh, five, or many.** Recommend **five, cut from one field**: five
  draws, and the edges match without a rule to hold them.
- **How far.** Recommend **to `fog.far` past the nearest eye** (170 north
  and south, 180 east): short of it, the land ends in a line against the
  background; past it, it is bytes nobody sees.
- **The rim.** Recommend **a crest of at least 20 m on every edge that
  touches nothing** (#818): the highest eye is 13.7 m, so a crest above it
  hides the field's back edge the way a horizon does.
- **West of the river.** Recommend **nothing** (#796 stands).
- **The forge under the Prison Tower** (lore year 12). Recommend **not
  here**: it is a building by a wall, not country, and 2b's #814 names it.
- **Beasts in the fields.** Recommend **none**: a body is 2d's and costs a
  skinned draw and an `AnimationMixer` against a per-ward ceiling at 20 of
  20 on the walking day.
- **Shadows.** Recommend **as the builder does now**: the sun's shadow
  camera is 80 m square (`scene-setup.js`, -40..40), so at most each piece's
  inner 18 m is ever drawn into the shadow map.
- **A triangle ceiling.** Recommend **none** (#816): the five cap at 30,000
  and are expected near 12,000, against about 234,000 in the castle's static
  pieces, of which the two photoscanned candlestick sets are 83,872.

### Dependencies

- **Gate: rank 1 shipped, and rank 9's 3b shipped.** 3b sets the ground's
  west edge at -140 that the two west pieces are cut to, and lifts 4d's eyes
  into the function 4g calls.
- **Lanes F and B.** Not beside any Blender pack, rank 4, rank 9, or rank
  13's increments 2 and 3.
- A later rank 9 increment that moves `outside-ground` breaks check 4g by
  name; it re-cuts the field in the same commit.

### Constraints

- #796: no far bank; the water runs into the fog. #795: nothing here is a
  surface. #703, #704: nothing out there is reachable.
- #500: the field's ground rectangles are typed in the script and check 4g
  is what holds them to the plan, the way check 1d holds a roof's base.
- #529: 4g is plan arithmetic and `layout.mjs`'s; `plan-vs-scene.mjs` gains
  nothing.
- #611, #727, #816: every piece is paid in both wards; no ceiling moves.
- #390, #499, #506, #584, #632. #13, #34, #147.
- #53: whether it reads as land at each bell is the GPU's.
- #801 to #808, #816 to #819.

### Looking checklist

- [ ] From the north walk: land under the wall, or a seam at the apron?
- [ ] From the North-west Tower's roof: town, quay and hills as one view?
- [ ] The rim at Prime, Sext, Vespers and Lauds: a horizon in the fog?
- [ ] The farms at 60 to 130 m: farms, or boxes?

---

## The GPU run

**Rank 3. Size ¼. Its gate, "Sight at the body's own height," shipped
2026-09-21** (#780 to #782); the gate is open. `npm run play` is 102
assertions and a numbered screenshot per beat into `shots/play/`. It has run
on a machine with real compositing six times over three sittings (#624 to
#630, #708 to #715, #734 to #741), and the third sitting's second run reached
the accusation for the first time — 179 ok, 17 failures — with the wrong
ending, because `src/interaction.js` read the sentry and the porter from a
fixed world height instead of their own. That fix shipped as this row's gate.
**What is left is the run that confirms it on a GPU.**

**The judgement half of this row is done.** Every render question this
section used to list is answered in `HISTORY.md`: the twelve at Vespers
(two of them do not read as two — the Constable and the Steward are one
white-haired man told apart only by a collar colour), the Lauds sky (flat,
no dawn colour), the covered hall (its trusses invisible from the floor, a
sliver of sky at one corner), a tower roof from 12 m, and the gaol roll on
the barrel-head. One item is still untouched: a phone in the room (#530) —
the stick throw, sprint threshold, look rate, E button size and two render
numbers are all still guesses.

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

### Dependencies

- **Gated on "Sight at the body's own height," which shipped 2026-09-21**
  (#780 to #782). Run again from a `main` that carries the fix.
- The run needs a machine with a GPU, which is Devon's; a session can add a
  beat and cannot run it. If a session is asked to take the run without one,
  the honest output is the beat and a note, not a claim.
- The journal beat's walk assertion (#659) has now run on a GPU five times:
  0.69, 1.30, 0.51, 0.69 and 0.83 m against its `> 1.0` threshold. It is
  measuring the chapel's geometry more than it is measuring the pointer. What
  to do about that is a decision about what the beat is for, and it is left
  open rather than guessed at.

### Constraints

- #53 (the whole point of the row).
- #34 does not apply: no rail is added.

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
2. **Variety**: a wall and a floor per named room, about forty textures,
   against the texture ceiling below. Gated on the look, the way rank 11's
   second increment is.
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
- **Increment 2 waits on the look**, the way rank 11 waits past its Node
  line. Increment 3 waits on the look saying so.
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

- **The rest of the fifty waits on the town** (rank 9): more bodies, and
  whether `garden` becomes ground, is that row's call (#618, #703 to #707).
- **The ceiling stays 32 until a row renegotiates it, and the evidence it
  brings should be the GPU run's `renderer.info`, not a second guess** (#609,
  #729). Instancing and animation LOD are the tools for that argument, not
  needed yet.
- **The four clips are placed** (#800), on both days: the scullion sweeps
  the kitchen at Prime and stirs at Terce, the carter hammers at his cart in
  the outer ward at Terce, and the serjeant and the man-at-arms spar in the
  yard at Terce, facing each other, where they mustered. Same tiles, so no
  ward count moved. `drill` is still in no routine, and `muster` is now in
  none either.
- **The twelve's 27-pair chatter pool stays unspent.** Recommend a later
  lore or dialogue increment hold each pair to the schedule the way #592
  holds a performance, which is the pass #554 named and skipped: 5 of the
  27 survive a same-room rule as written, and the other 22 need a room and
  a bell somebody authors (#731).

### Dependencies

- **Nothing gates it.** Rank 10 unblocks the four deferred activities and
  this increment waits on none of them.
- **Lanes C and D**: `data/populace.json`, `data/npcs.json`'s comment and
  `src/main.js`'s one constructor. `src/quest-manager.js` is in no other
  open row's scope today.
- **Not `data/scene-config.json`**, which rank 9 holds in lane B.
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

**Rank 9. Size 2+. The first increment as this section first specced it was
already built, and the row's premise was corrected on 2026-09-17** (#582).
**The map shipped the same day** (#588 to #591). `WISHLIST.md` theme 5.
**The town's first increment shipped on 2026-09-21** (#725 to #728): a street
of six houses and a church inside Mereford's wall, west of the town gate, seen
from the walls and entered by nobody. **What is next is the quay and the
river**, outside the west gate, specced below in two class-S increments
(#795 to #798).

### What was measured, and what it changed

This section used to say "eight drums with three floors each is 24 rooms
against about 6 in use" and ask for a floor slab and a `planId` for each
unused one. That was written from `WISHLIST.md` rather than from the code, as
this file's own header says of all eight sections added that day. Against
`data/scene-config.json`: **every one of the eight drums carries a room at
levels 0, 1 and 2**, four carry one at level 3, and the castle has **40
rooms — 14, 11, 11 and 4 by level**, which is the count
`test/plan-vs-scene.mjs` prints on every run. The four drums with no top room
are the four with a 2.5 m turret, refused on arithmetic by #523: a 2.5 m
turret in a 2.8 m ring leaves a 0.3 m ledge. There is no unused drum floor
left to add.

**What the castle has instead is nineteen empty rooms**: seven of the eight
tower first floors, seven of the eight tower top rooms, all four roofs, and
the larder hold no evidence, no station, no document and no prop. `PLAN.md`'s
"an empty room is worse than no room" is the state of the castle rather than a
risk to it, and more volume makes it worse — which is why the latrine turret
and the well chamber this section also named were considered and refused
(#582): they would have made the count 22, not filled any of the 19.

### The map, shipped (#588 to #591)

The journal's third tab, "The castle", is `src/stations.js`'s `nav.rooms()`
drawn by `src/ui.js`: one inline SVG per storey, off the plan's own bounds
and discs (#500). A room is entered once and marked `visited`, carried on
the save since version 5 (#590). `test/map.mjs` is the suite (#591).

### The town's first increment, shipped (#725 to #728)

Mereford, west of the `town-wall` run: three wall runs closing a circuit
with the west gate cut in, six houses, a church with a saddleback tower, all
Kenney kit or Poly Haven pieces already in `assets/`, no new asset. Nothing
in it is enterable — #703 stands, the castle is sealed. Two new rooms,
`ward: "outside"`, drawn on their own map section rather than the castle's:
`mereford-street` and `mereford-church`. `test/layout.mjs` gained check 4d,
every outside room seen from somewhere a player can stand (from a wall walk
or a tower roof, never lower); `test/budget.mjs` gained an `outside` bucket
summed into both wards' ceiling, 131 meshes. `npm test` fifteen of fifteen.

### What is next: the quay and the river

**Two increments, both class S, 3a first** (the map and the town were this
row's first two). Decided before anything is
built (#795 to #798), against `ec11009`, from a Node prototype that cloned
`data/scene-config.json` in memory, added everything below, and ran
`makePlan`, `walkability`, `surfacesAt` and check 4d's own sight test over
it. The prototype is not committed; the builder writes each rail from this
section and breaks it from green (#34).

**What the stub under this heading got wrong.** It said water is a surface
kind the plan lacks, that the walkability fill would call it floor, that
check 12 would want a step sound for it, and that the ground has to go below
y 0. Measured, only the second is true, and not of the water: with
`outside-ground` left at x -198 over a river, **all 18,240 grid points of
the water's footprint have `outside-ground` under them at y 0**, so what
calls the river floor is the ground over it. Water is a piece and never a
surface (#795): the ground stops at the bank, the water has no surface, so
`surfacesAt` over it returns nothing, check 12 never sees it and no step
class is added. Nothing that is a surface goes below y 0. What does is stone
faces and the water plane, and a kit placement with a negative `base` takes
`levelUnder`'s level -1; a grep of `src/` and `test/` finds nothing that
reads a placed piece's `level` and breaks on -1, and the builder confirms
it by the suites staying green.

**What the kit has, measured with `partsOf`.** `water.glb` is 1 x 0.2 x 1,
**its origin at a corner** (x -1..0, z 0..1), one primitive, a plane at 0.1
with a ripple to 0.2, `KHR_materials_unlit`, opaque. `dock-side.glb` is
1 x 0.5 x 1.1 (z -0.6..0.5, the 0.1 past -0.5 is the lip over the water),
two primitives; `dock-corner.glb` is 1.1 x 0.5 x 1.1 with the lip on -x and
-z, two primitives. At scale 4 a dock piece is a 2 m stone face with its
paved top at 2. `pulley-crate.glb` is three primitives, `barrels.glb` two,
`detail-crate.glb` one. No boat in the kit.

**What the player sees of it, measured.** The west town wall is 8 m and the
nearest place 8 m up is 88 m east of it, so a line from the walls to
anything low past that wall is under its top. **The quay room passes check
4d on the toll-house's slate ridge and on nothing else**: with the ridge at
9 m, 261 eyes see it, the first `west-curtain-north-walk` at (-35.75, 9.70,
-11.75); at 8 m, 64; at 7 m, none. The walls, the crane, the barrels and
the crate are seen by nobody. **The water is seen only through the west
gate**, from the tops of the two west towers: 134 of the 1,120 points of a 2 m
lattice on its top, the nearest (-155, -3) at 119.2 m from
`floor-sw-tower-roof`; with the gate's doorway deleted, none. Three's fog is
`smoothstep(30, 150, depth)`, so the ridge at about 98 m is about 60 %
fog and the nearest water about 84 %. That is what this increment buys, and
the GPU run is what says whether it reads (#53).

#### Scope, increment 3a: the toll-house and the quay (class S)

- **`src/castle-plan.js`, `builtProps`**: an entry may carry `shape:
  "gable"` and `ridge: "x"` or `"z"`. It is placed exactly as a slab is
  (same `tile`, `size`, `base`, same box, same collider) and the piece says
  `built: 'gable'` and carries `ridge`. Anything else in `shape`, or a
  gable with no `ridge`, throws, the way a diagonal run does. The box is the gable's bounding box, which is
  what `Box3` reports for a prism, so `plan-vs-scene.mjs`'s existing 0.01 m
  diff holds it with no new line.
- **`src/castle-builder.js`**: `buildGable(box, ridge, material, metres)`,
  one mesh, a triangular prism filling the box: the two eaves at the box's
  bottom along the ridge axis, the ridge at the top centre, two sloped faces
  and two triangular ends, no underside. World-space UVs at `repeatMetres`,
  the way `worldUVsOnBox` does it (u along the ridge, v up the slope's own
  length), so the slate courses match the curtain's. `buildPiece` gains the
  branch and `carriesOwnWorldPosition` gains `'gable'`. Without the branch
  `test/budget.mjs` already fails naming the piece ("has no branch for it").
- **`test/layout.mjs` check 1d**: the filter becomes `built === 'slab' ||
  built === 'gable'`. The roof's `base` is the house's height typed a second
  time, which is exactly the number check 1d exists for.
- **`data/scene-config.json`** (spliced, #584, #632):
  - `quay-toll-house`, a run `from [-34, -2] to [-33, -2]`, thickness 6,
    height 6, `medieval_blocks_02`, `repeatMetres` 3, `interior: true`: x
    -138..-130, z -11..-5, north of the road at the quay's head, 0.5 m clear
    of `town-wall-west`. Stone, not plaster, because it is the King's.
  - `quay-toll-house-roof`, a `builtProps` entry, `shape: "gable"`, `ridge:
    "x"`, `tile [-33.5, -2]`, `size [8, 3, 6]`, `base 6`,
    `castle_wall_slates`: the one slate roof in Mereford (`the-quay` in
    `data/lore.json`), in the curtain's own stone, ridge at 9.
  - Room `mereford-quay`, `ward: "outside"`, name **"The King's quay"**,
    bounds x -140..-129.5, z -16..16, `floor: "stone_pavers"`. Inside
    `outside-ground` in both increments; its centre (-134.75, 0) is on the
    floor patch, which check 15 and `plan-vs-scene`'s anchor need.
  - Three placements on the quay's floor so check 11 has something in the
    room: `quay-crane`, `pulley-crate.glb`, tile [-34.6, 1.5], rotationY 90,
    scale 2.5, at the water's edge; `quay-barrels`, `barrels.glb`, tile
    [-33.5, 1.2], scale 2.5; `quay-crate`, `detail-crate.glb`, tile [-34.2,
    2.6], rotationY 15, scale 2.5.
- **No change** to `plan-vs-scene.mjs`, `data/lore.json`, `data/mystery.json`,
  `data/sounds.json` or `data/populace.json`.

#### Acceptance, increment 3a

Each line names the suite and the break that turns it red from green (#34).

1. **`test/layout.mjs` check 4d**, unchanged, now over four outside rooms:
   `mereford-quay` seen by `quay-toll-house-roof`. Break: toll-house height
   4 and the roof's base 4, ridge at 7: `mereford-quay is seen from
   nowhere`. The yard, the street and the church still pass, which is the
   control.
2. **Check 1d on the gable.** Break: toll-house height 5 with the roof's
   base left at 6: `quay-toll-house-roof has its base at y 6.00 and nothing
   under it`.
3. **Checks 3d2, 4c, 11 and 12, unchanged**: a name that is not its id, the
   room clear of the curtain, on `outside-ground` and reached by nobody,
   three things in it, and `floor-mereford-quay` resolving to the
   `stone_pavers` step class the base already uses.
4. **`test/budget.mjs`, unchanged**: the gable is one mesh through
   `buildPiece`. Break: delete the `gable` branch; the "no branch" line
   fails. The prototype's count for 3a is about 10 more outside meshes
   (run 1, gable 1, floor 1, crane 3, barrels 2, crate 1, and `outside-ground`
   re-cut round the new patch); the builder reads the real number off the
   run and writes it in `HISTORY.md`.
5. **`plan-vs-scene.mjs` and `map.mjs`, unchanged** and green: the gable is a
   tagged piece the box diff already covers, and the outside drawing picks
   up a fourth room by the plan's own list (#726).

#### Scope, increment 3b: the water (class S)

- **`src/castle-plan.js`, the placement loop's kind rule**: a model whose
  name starts `water` is `kind: 'water'`, beside the `tower` and
  `wall|column` rules. One line. It pushes no surface (placements never do)
  and the config gives it `noCollide`.
- **`data/scene-config.json`**:
  - `outside-ground`'s box min x from -198 to **-140**, and `outside-road`'s
    likewise. Both comments rewritten: the ground's west edge is the bank
    now, and the fog's `far` is the water's to meet. Both still meet the
    base box, so the rank-5 check is unchanged.
  - `quay-water`, `water.glb`, tile [-35.25, -10], rotationY 0, scale [57,
    1, 80], base -1.3, `noCollide: true`: x -198..-141, z -40..40, y
    -1.3..-1.1. One mesh. The tile is the model's corner origin, not its
    centre, and the comment says so.
  - Six `dock-side.glb` at tile x -35.5, z -2.5 to 2.5 by 1, rotationY 90,
    scale 4, base -2, and two `dock-corner.glb` at [-35.5, -3.5] rotationY 0
    and [-35.5, 3.5] rotationY 90, same scale and base: the quay front,
    x -144.4..-140, z -16.4..16.4, stone from -2 to a top flush with the
    road at 0.
  - Two bank runs, `quay-bank-north` `from [-35.125, -9.5] to [-35.125,
    -4.6]` and `quay-bank-south` `from [-35.125, 4.6] to [-35.125, 9.5]`,
    thickness 1, height 2, `base: -2`, `forest_ground_06`, `interior: true`:
    x -141..-140, the earth face from the water up to the ground either side
    of the quay, stopping at the dock corners' ends so the two do not
    overlap.
- **`test/layout.mjs`, new check 4e, "nothing stands on the water"**: for
  every `kind: 'water'` piece, every point of a 0.5 m grid over its box's
  footprint gets nothing from `surfacesAt`. A plan fact, so here and not in
  `plan-vs-scene.mjs` (#529). If no piece is water, it fails saying it
  measured nothing.
- **`test/layout.mjs`, new check 4f, "the water is seen"**: for every water
  piece, some point of a 2 m lattice on its top (0.05 m under the box's top,
  as 4d does) has a clear segment from one of 4d's eyes, within
  `config.lighting.fog.far` of it, past 4d's occluders less the water itself.
  Nearest the castle first, stop at the first seen point. 4d's eyes and
  segment test are lifted into one function both checks call, not copied.
  Prototype: seen at (-155, -7) from `sw-tower-stair-3` at 120.9 m after
  257 of 1,120 points, 98 ms; the full sweep on the break is 229 ms.
- **`test/budget.mjs`**: no line changes (#798).

#### Acceptance, increment 3b

1. **Check 4e.** Break: put `outside-ground`'s min x back at -198; the
   failure names `outside-ground` at y 0 over 18,240 of the water's 18,240
   points, the prototype's count. Check 10 also names the two bank runs sharing a top
   with `outside-ground`, which is the second net and not a reason to skip
   the first.
2. **Check 4f.** Break: delete `town-wall-west`'s doorway: `quay-water is
   seen from nowhere`, 0 of 1,120 points.
3. **Check 10, unchanged**: the bank runs and the quay floor touch
   `outside-ground` at x -140 and share no top.
4. **Check 4, unchanged**: sealed; the fill never leaves the castle.
5. **`test/budget.mjs`, unchanged**: about 20 more outside meshes (docks 16,
   water 1, banks 2, and the shorter ground re-cut). With 3a, the
   prototype's outside bucket goes from 131 to about 161, the outer ward's
   sum from 1124 to about 1154 of 1200, the inner's to about 804. The
   builder records the measured numbers.
6. **`plan-vs-scene.mjs`, unchanged**: every new piece is tagged and diffed.

#### Open calls, the quay and the river

- **Water as a surface of its own kind, refused by walkability, or as a
  piece with no surface.** Recommend **a piece** (#795): a surface is
  something a foot can land on, so a water surface would need a step class
  that check 12's dead-class rail would then have to excuse, and a rule in
  the fill to refuse it. No surface needs neither.
- **A far bank.** Recommend **none; the water runs into the fog** (#796). A
  far bank is ground touching nothing the rank-5 check accepts, and the lore
  puts the castle on a river mouth ("four rivers running to the sea ... a
  King's castle now on the mouth of each"), which is an estuary.
- **The road "down through Mereford to the quay".** Recommend **flat**: a
  gradient on ground nobody walks is a sloped ground piece the plan does not
  have, seen at 90 m through fog as nothing.
- **Bodies on the quay.** Recommend **none**, #707 as for the town.
- **A boat.** Recommend **none in this row**: the kit has none, and a hull is
  #787's generator's to make, with its own table row, if the GPU run says
  the quay reads empty.
- **A sound for the river.** Recommend **none**: `ambient.spatial.hearMetres`
  is 14 and the nearest place the player stands is 88 m away; check 13
  already excludes outside rooms.
- **The room's name.** Recommend **"The King's quay"**: `the-quay` says it is
  the King's and not the town's, and the map is the one place the player
  reads the name.
- **If the GPU run cannot see the river.** Recommend **fog, not more water**:
  the lever is `lighting.fog`, which is every view's, and is a decision for
  whoever changes it, not this row. Do not move the town or cut the west
  wall; #725's 8 m wall is why the street reads as a street.
- **Tide.** Recommend **a fixed level at -1.1**: moving water is a runtime
  animation of a plan piece, which `plan-vs-scene`'s box diff would have to
  learn about, for a plane 84 % fogged.

#### Dependencies, the quay and the river

- The town's first increment, shipped (#725 to #728). 3b after 3a: both
  write `data/scene-config.json`, and 3a's room is what 3b's docks stand at.
- **Lane B.** Not beside rank 4 or rank 13's increments 2 and 3. 3a also
  writes `src/castle-builder.js`, which rank 4's later increments may touch;
  another reason not to run beside it.
- No save bump, no `data/npcs.json`, no `src/audio.js`: lanes A, C, D and E
  are free of it.

Two calls from the town's first increment still bind the next one:

- **Bodies in the town: none while #703 stands.** `validatePopulace` refuses
  a stop the player cannot walk to (#707), so rank 6's "the rest of the fifty
  go in rank 9's town" is answered no until something outside the curtain is
  enterable. A figure in a street nobody enters is a different system from a
  populace.
- **Doors and windows on the house fronts: none yet.** If the GPU run says the
  rows read as blocks, `wall-pane-wood-door.glb` and
  `wall-pane-wood-window.glb` go on as facades and check 4d still holds.

### Constraints

- #500, #529: every new piece is a plan piece; a sight check is Node
  arithmetic and belongs in `test/layout.mjs`, never `plan-vs-scene.mjs`.
  Checks 4e and 4f go there; `plan-vs-scene.mjs` gains nothing, because
  the gable and the water are tagged pieces its box diff already holds.
- #795 to #798: water is never a surface; the ground stops at the bank; the
  gable is the one new built shape; no ceiling moves.
- #728: every outside room seen from the walls, and #796 holds the water to
  the same standard inside `fog.far`.
- #13, #34: 4e, 4f and check 1d's gable each go red from green on the break
  this section names before the increment is called done.
- #611: `test/budget.mjs` holds cost, `test/layout.mjs` holds whether the
  castle works.
- #703, #704: nothing outside the curtain is enterable; `ward: "outside"` is
  the only way a room lies past it.
- #513: runs meet by touching, never by overlapping.
- #584, #632: `data/scene-config.json` is spliced, never re-serialised, in
  its own line ending.
- #493, #506: no asset fetched without going through the encoder.
- #53: the look is the GPU run's.

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

**Rank 13. Size 2+. Nothing is built; decisions #745 to #749, 2026-09-21.**
Devon's ask, in his words: the room layout was placed by an AI one room and
one guess at a time with no way to see the whole floor plan, he is not happy
with how it reads, and he wants a GUI to lay it out himself, **or at least to
review and correct it visually**. That last clause is why increment 1 below
writes nothing.

### What the layout is today, measured

**`src/castle-plan.js` holds no coordinate.** It is a pure compiler:
`makePlan(config, boundsOf)` reads `data/scene-config.json` and returns
`{tile, pieces, colliders, surfaces, rooms, curtain, spawn}`, and it throws
rather than warns on a config that does not hang together: `[castle-plan]
drum "x" has an interior and no room in config.rooms names it`
(castle-plan.js:999). So the floor plan is **data**: four arrays of
`data/scene-config.json`, and a fifth that holds what stands on it.

| Array | Rows | What one row is |
| --- | --- | --- |
| `walls` | 46: 18 curtain at level 0, 3 at level 1, 25 interior partitions with no `level` at all | a run between two tile centres, carrying `from`, `to`, `material`, `height`, `thickness`, and optionally `axis`, `base`, `walk`, `repeatMetres`, `interior`, `doorways` |
| `drums` | 8 | a tower, carrying `tile`, `radius`, `height`, `segments`, `turret`, `stairs`, and an `interior` carrying its own `doors` |
| `gates` | 3 | an arch on a tile with a `leaf` |
| `rooms` | 43: 23 outer, 17 inner, 3 outside; 9 by `tiles`, 28 by `drum`, 6 by `bounds` | **a name over an extent, with no geometry of its own** |
| `courtyard.placements` | 123 | a kit model at a tile, which is where the roofs, sheds and trees are |

**Eleven runs carry `doorways`**, each `{ at, width, height, base? }`: an
opening at a point along a run, which is how two spaces connect. Nothing is
derived from anything else. A wall is not a room's edge, a room is an
annotation over ground that runs happen to enclose, a door is a hole in a run,
a stair is two flags on a drum. An editor here edits four independent lists,
not one building.

The file is **3113 lines** and every one was hand-typed. `?edit=1`
(`src/edit-mode.js`, 327 lines; #583 to #587, move-and-delete #636 to #642)
writes three *other* arrays of the same file (`interiorProps` (12),
`builtProps` (21), `braziers` (3)) through `tools/place.mjs`'s splice and a
Vite middleware, and touches none of the four above. It is walked in first
person, so **the whole plan has never been on a screen at once.**

### Increment 1, shipped

`src/edit-layout.js`, mounted by `src/edit-mode.js` inside `main.js`'s
`import.meta.env.DEV` branch (#585): an orthographic camera over the real
scene, not a second drawing (#746), with a storey filter and ghosting.
`tools/plan-sheet.mjs`, new and pure, draws the labels, room outlines and
openings off the plan's own boxes, never recomputed (#500). `V` toggles the
view, `[`/`]` change storey. Nothing else changed: not `src/castle-plan.js`,
`src/castle-builder.js`, `data/scene-config.json`, `tools/place.mjs` or
`vite.config.js`.

### Scope, increment 2: rooms and runs become editable

Class S. **Lane B** (`data/scene-config.json` and `test/tools.mjs`'s
byte-exactness rail).

- **`tools/place.mjs`.** `PLACEABLE` gains `walls` and `rooms` with their key
  lists. `checkRow` becomes per-key shape rules rather than one shape:
  today every branch of it demands a `tile`, and a wall row has `from` and
  `to`. `formatRow` learns two shapes the four arrays have and the three
  placeable ones do not: an object value (`tiles: { min, max }`) and an array
  of objects (`doorways`). It writes both on one line today.
- **`src/edit-layout.js`.** Drag a room's rectangle or a run's end on the
  sheet; the sheet snaps to whole tiles, `Alt` to a quarter tile. The selected
  row's whole record is posted through the existing `/__place` `move` verb.
  No new verb and no change to `vite.config.js`.
- **`test/tools.mjs`.** Parts 1 and 2 run the two new arrays: insert, then cut
  the row back out, and the file is the file byte for byte, on an LF copy and
  a CRLF copy (#632). Part 3's `'an array that is not placeable'` case moves
  off `rooms`, which is placeable now, onto `materials`, which is an object
  and never will be. Part 4 covers the nested formatting.

### Scope, increment 3: the openings, which is how rooms connect

Class S, lane B. A `doorways` entry is a field of the run that owns it, so
editing one is a `move` of that run's row and needs no nested-path splice
anywhere (#749). Drag an opening along its run, type a width, `Delete` twice
to cut it, the way the prop editor already arms a delete.

### Acceptance

- **Increment 1, shipped**: `test/built.mjs` greps `dist/` for both dev-tool
  sentinels, and `test/tools.mjs` holds `planSheet(plan, level)` to the
  plan's own boxes, never recomputed (#500).
- **Increments 2 and 3.** `test/tools.mjs`'s headline rail, extended: an
  insert and a delete of the same `walls` row, and of the same `rooms` row,
  give back the file byte for byte on both endings, and every byte outside a
  rewritten row's span is the byte it was. **Break**: hardcode `\n` in
  `formatRow`'s nested-object branch; the CRLF copy fails by one byte per
  nested line, which is exactly #631's failure with a new surface under it.
- **Every increment.** `npm test` is 15 of 15 and `npm run build` is clean.
  No suite gains or loses an assertion in `layout.mjs`, `plan-vs-scene.mjs`,
  `mystery.mjs` or `budget.mjs` (#529, #611): a dev tool's rails are
  `test/tools.mjs`'s and `test/built.mjs`'s.
- **What no suite can say** is whether the plan reads better afterwards. That
  is Devon's, on the dev server, with `?edit=1&view=plan`. It is not a GPU
  question (#53), because an orthographic top-down of a static scene is not a
  real-time movement assertion, so a container can build and drive it, and
  only a person can judge the result.

### Open calls

1. **Does the GUI edit `castle-plan.js`, or an intermediate JSON?**
   **Neither: it edits `data/scene-config.json` directly, through
   `tools/place.mjs`'s splice** (#745). `castle-plan.js` is a compiler with no
   coordinate in it, so there is nothing there to round-trip; and the four
   layout arrays sit in the same file, under the same 3113-line splice rail,
   as the three the editor already writes. An intermediate format would be a
   second source of truth for the castle, which is exactly the thing #500
   exists to forbid. `eolOf` already gives it #632 for free.
2. **A re-serialise, now that whole rows are being rewritten?** **No** (#584,
   measured again today): `JSON.stringify(JSON.parse(raw), null, 2)` over the
   current file is 124924 bytes against 117131, so a round-trip writer puts
   7.8 KB of churn into every edit's diff, and the diff is the product. The
   churn a `move` makes inside the one row it rewrites stays the accepted
   bargain (#639).
3. **Top-down camera in the engine, or a flat 2D editor that never loads
   three?** **The camera** (#746). A flat schematic cannot compute anything
   here: `makePlan` takes `boundsOf(modelPath)`, and the only place that
   exists is `CastleBuilder.measure()`, which loads every model and measures
   its parts (castle-builder.js:630). A DOM editor would have to re-derive
   every box the plan computes, which is `test/layout.mjs`'s old sin written
   into a tool (castle-plan.js's header, #500). The camera also shows the 123
   `courtyard.placements`, the ground patches and the drums' own shells, which
   are the things a schematic would have drawn as nothing. Devon's own school
   editor landed here after 42 phases: `js/render.js:1522` is an
   `OrthographicCamera` 200 ft over the real scene with storeys ghosted, not a
   second canvas.
4. **Same tool or a new one?** **Same entry point, second module** (#747).
   `?edit=1` stays the one flag and the one DEV branch to audit;
   `src/edit-layout.js` is its own file because the data has nothing in
   common (a prop is a tile, a run is two tiles and eight fields) and
   because folding it into `edit-mode.js` would double a file whose whole
   value is that a person can read it in one sitting.
5. **Live validation, or write and let `npm test` catch it?** **Both, and the
   live half copies no assertion** (#749). Before it posts, the panel calls
   `makePlan(edited, boundsOf)` and `walkability`, the same two pure
   functions the page and every Node suite already call, and refuses to write
   when `makePlan` throws, showing the throw. It prints the room count, the
   walkable-cell count and whether the fill still seals, and **those are
   numbers, not checks**: #13's rule is why they are not allowed to be
   checks, because a second copy of check 4 living in a panel is a rail nobody
   runs and nobody maintains. No check from `layout.mjs`, `plan-vs-scene.mjs`
   or `budget.mjs` is copied, moved or re-implemented (#529, #611).
6. **A new row or an amendment to the placement editor's?** **New row.** Rank
   12 retired whole on 2026-09-18 (#687 to #690) and a retired row does not
   reopen; the scope is different besides: that row was props on a castle
   that already exists, this one is the castle.
7. **Which arrays does the write path take, and in what order?** **`rooms`
   and `walls` first, `doorways` second, `drums` and `gates` not in this row.**
   A drum is 970 of the castle's 1539 meshes (#609) and eight fields that the
   crown, the stairs and the turret all read; a gate carries a `leaf` spec
   with a springline in it. Both are a later increment's, and both stay
   readable in the review view from increment 1.
8. **Undo?** **No.** `git diff` is the undo, the write does not commit, and
   the one module in Devon's school editor most worth lifting (`js/history.js`,
   a JSON structural diff behind a 100-deep stack) is the one this repo does
   not need, because that tool's design lives in memory and this one's lives
   in a file git is already watching.
9. **Does the room's own record grow anything?** **No.** A room is a name over
   an extent and the builder works out what is in it; a second answer written
   beside the builder's is a second answer to drift, which is #583's rule for
   the prop editor's comment and holds here unchanged.
10. **Read-only first, as its own increment?** **Yes** (#748), and it is the
    answer to the half of Devon's sentence that says "or at least to review".
    It ships without touching `tools/place.mjs`, `PLACEABLE`, `/__place` or
    the byte-exactness rail, so the first thing anybody looks at costs nothing
    that could break a file ten suites read.

### Dependencies

- **Increment 1 is in no lane** and may be claimed beside anything, including
  rank 9. **Increments 2 and 3 are lane B**, which rank 9's town also holds:
  one row per lane at a time (#602), so they do not run beside it.
- Nothing gates this row and it gates nothing. It makes rank 9's remaining
  work and the nineteen empty rooms cheaper, the way the prop editor did for
  the content rows (#583).
- `src/edit-mode.js` is the host; a session in this row and a session
  extending the prop editor would collide on that file.

### Constraints

- **#500.** The sheet reads `plan.pieces` and `plan.rooms` and recomputes no
  box. A tool that re-derives the castle is the failure `castle-plan.js` was
  written to end.
- **#529, #611.** No assertion moves. A dev tool's rails live in
  `test/tools.mjs` and `test/built.mjs`.
- **#585, #586.** Two independent halves, neither trusted: the module is
  reached only from inside `import.meta.env.DEV`, the writer is still a plugin
  with `apply: 'serve'`, and the check is the grep of `dist/`, now for two
  sentinels.
- **#584, #632, #639.** Splice, never re-serialise; every newline from
  `eolOf(source)`; every byte outside the edited row's span unchanged, on both
  endings.
- **#13, #34.** The panel's numbers are not checks. Every rail named above is
  broken on purpose once, from green, with the FAIL line quoted in
  `HISTORY.md`.
- **#493, #494, #506.** No asset, no vendored library. Anything carried over
  from the school editor arrives as source under `src/` or `tools/`, never as
  a `libs/` copy.
- **#53.** An orthographic still of a static scene is not a real-time
  assertion, so the suite half of this row is a container's. Whether the plan
  reads better is Devon's.

