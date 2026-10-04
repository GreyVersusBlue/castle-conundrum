# tools/castle3d: the castle as a realistic Blender model

Rank 2h, "Castle in Blender" (`SPECS.md`, decisions #839 to #844 in
`HISTORY.md`). A standalone model of the castle, Mereford and the country
around them, built by these scripts from today's layout and dressed with
Poly Haven PBR materials. **The game loads none of it**: nothing here writes
under `src/`, `data/`, `assets/` or `test/`, and no suite reads this folder.

## Running it

```
npm run castle3d:build                        a full build, <out>/castle.blend
npm run castle3d:build -- --only guide        <out>/partial/guide.blend
npm run castle3d:build -- --only walls,towers <out>/partial/walls+towers.blend
npm run castle3d:build -- --export-only       castle.glb and markers.json from the existing master
```

On Devon's Windows machine only: this is the full feature set on a real GPU,
and huginn does not take it (#878). The launcher, `build.mjs`, in order:

1. exits non-zero if `CI` is set (#842);
2. finds Blender at `CASTLE3D_BLENDER`, else the Steam install at
   `C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe`. It
   never reads `BLENDER`, which is rank 1's (#805, #879);
3. refuses any Blender whose `--version` does not start `Blender 5.2` (#840),
   and `common.py` refuses it again from inside, exiting 3;
4. refuses an output folder inside the repo (#841);
5. writes `<out>/blueprint.json` from `makePlan` (`export-blueprint.mjs`);
6. fetches and hashes every `sources.json` row into `<out>/cache/`
   (`fetch.mjs`, the only network use);
7. runs `build.py` in a factory-startup Blender with `PYTHONHASHSEED=0`;
8. runs `check.py` in a second Blender over the file it saved (#844);
9. on a full build only, never on `--only`, runs `export.py` in a third
   Blender over the master, which writes `castle.glb` and `markers.json` and
   never saves the `.blend` (#897);
10. runs `check-export.mjs` over those two files (#898).

`--export-only` writes the blueprint fresh, skips the fetch, the build and
`check.py`, refuses when `<out>/castle.blend` is missing, and runs 9 and 10
over the master as it stands.

Every Blender launch carries `--python-exit-code 1`, because without it an
uncaught Python exception exits 0. Any failure exits the launcher non-zero.

## The two environment variables

| Variable | Default | What |
| --- | --- | --- |
| `CASTLE3D_BLENDER` | the Steam `blender.exe` | Which Blender. Must report 5.2. |
| `CASTLE3D_OUT` | `C:\Users\devon\OneDrive\Documents\Claude Files\Blender Projects\Castle\castle3d\` | Where everything lands. Refused inside the repo. |

## The output folder

| File | What |
| --- | --- |
| `blueprint.json` | `makePlan`'s output in the game's frame, rewritten every build, never committed (#500, #841). |
| `cache/<asset>/<file>` | The hash-pinned Poly Haven inputs, one folder per `sources.json` `asset`. See below. |
| `castle.blend` | The master, from a full build only. Always output, never input: an MCP adjustment goes back into a script or it is lost (#841). |
| `castle.glb` | `export.py`'s glb of the master, from a full build or `--export-only`. About 570 MB; see "The export" below. |
| `markers.json` | `MARKERS` read back from the master in the game's frame and the blueprint's shape, about 177 KB. |
| `partial/<stages>.blend` | An `--only` build. Never overwrites the master. |
| `last-build.txt` | The path `build.py` saved, which the launcher hands to `check.py`. |

## The stages, in their fixed order

| Stage | Module | Builds | Increment |
| --- | --- | --- | --- |
| `guide` | `blueprint.py` | `GUIDE`: a wireframe box per piece and ramp, a box or 32-sided cylinder per room, a box per open room over its gate band. Always runs. | 0 |
| `terrain` | `terrain.py` | A 400 m height field on game x -81, z 0, exactly 0 over the pieces plus 10 m and seeded hills outside; the cobbled road to the west gate; 120 trees and 60 rocks from Poly Haven models, each with a seeded yaw, scale, lean and leaf tint; grass by a seeded Geometry Nodes scatter. The World was terrain's until increment 7 moved it to `lighting` (#873). Mud, grass and cobble come from `materials.py`. From 7b (#956): the river, read from `quay-water`'s and `quay-bank-north`'s boxes, the bed at -2 west of x -141, a 1 m slope to the shore at -140, the hills eased down to it over 25 m; everything west of the shore mud with no grass; `WATER_estuary` (`modelOnly: "#956"`) from the slab's foot to its surface over the rest of the square west of the shore, in `materials.water()`; the road from `outside-road`'s west end (-129.5); trees and rocks west of x -134 not placed, after their draws, so every other stands where it stood. The five backdrops (#960) are left out of the pad and the grass footprints. | 1, 7b |
| `walls` | `walls.py` | The 21 runs (16 curtain, 2 cross-wall, 3 gate-over) as the plan's collider boxes clipped to each piece's box, so a doorway the plan cuts is an opening; the 15 walks; one crenellation per run carrying its kit merlons in `planIds`, every one of the 61 claimed by exactly one run or the stage raises. Arrow slits through every other merlon. The blueprint's own slugs (#849) from `materials.library`. | 2 |
| `towers` | `towers.py` | The eight drums from each piece's per-sector `stone` (doors and crown included), hollow to the interior radius, with a 0.4 m plinth over the bottom 2 m and an arrow slit per storey in every third sector not buried in a run; floors and flat roofs as the plan's discs cut to their colliders (the stair wells); the four turrets, capped at 12 m, under roof_slates_02 cones in the drum's own object; the 18 flights as solid steps of about 0.18 m along each ramp's `slope`, in defense_wall. | 2 |
| `gates` | `gates.py` | The three gate arches (`ARCH_<gate id>`), round-headed to the leaf's `springline` and `archRadius` through the arch's depth, in the stone of the runs either side, the west and east jambs battered with the curtain; the four leaves (`LEAF_<id>`: seven planks, two ledges, iron straps) built in the hinge's frame and parented to `GATE_<id>_HINGE`, a plain-axes empty in `MARKERS` at the blueprint's `pivot`; the west gate's portcullis, raised, in a slot, no `planId`; `BARS_cell-bars` (the plan's six uprights and two rails) and `BAR_walk-bar`. Each leaf and bar is held within 0.01 m of its blueprint box or the stage raises. Then #851's outer gate in `barbican-west`, which `walls.py` cuts out through `walls.OUTER_GATE`: `ARCH_barbican-outer`, two leaves and a portcullis, each `modelOnly: "#851"` and none with a `planId`; from #922 the leaves stand open along their jambs and the portcullis is raised, or the stage raises (`check_outer`). `wooden_gate` and `rusty_metal` (#852), which `oak` and `iron` reach through `materials.ALIAS`, with no tiling break-up (`materials.PLAIN`). | 3 |
| `buildings` | `buildings.py` | The 11 inner runs as their colliders clipped to their boxes, unbattered, so every doorway and Lady Alys's window is an opening; the lodge's deck; the 3 upper floors (the carpet 0.02 m of `dirty_carpet` over `wood_planks`) and the 9 ground floors (6 boxes 5 mm over the terrain, 3 drum discs), every slab less the drum discs (`masonry.minus_discs`); the two columns, plinth, round shaft and capital, the damaged one short a quadrant; the hall's seven king-post trusses (`TRUSS_hall-truss-<n>`, `rough_wood`), and `ROOF_great-hall` carrying the seven `hall-roof` ids in `planIds`, `old_planks_02` boards under `roof_slates_02`, both slopes less the drum discs, with board gables, the south slope ending at the pieces' own south face, #527's 0.75 m slot short of the curtain (#922, held by the stage). #853, model only (`modelOnly`, no `planId`): the hall's five north windows cut like the plan's one (`WINDOWS`, `WINDOW_LIKE`), its gables and its six corbels. Each column and truss is held within 0.01 m of its blueprint box, and a window that comes within 0.1 m of a prop raises. | 4 |
| `town` | `town.py` | Mereford, the town wall, Wykes's yard. From 7b (#957), the quay: `TOLL_quay-toll-house` with a shut door (`DOOR_`, `modelOnly: "#957"`) on its road face, `ROOF_quay-toll-house-roof` as the plan's gable (`built`, `ridge`) in `roof_slates_02` with stone ends, `DOCK_quay-front` (one box over the eight dock pieces, which must tile it, paved on top), the two `BANK_`s in the terrain's mud and `WATER_quay-water`, the plan's slab. 59 pieces. | 5, 7b |
| `props` | `props.py` | The 195 pieces `STAGE_OF` gives it from 7b (#958 to #960), `quay-crane` among them on the kit hoist generator; 190 drawn, the five `backdrop-*` taken and not drawn, which `allow.json` names. Before 7b the 187 pieces it was given, one `PROP_<piece id>` each with `planId` and `noCollide` (#863 to #868), in blueprint order: the 80 kit decor pieces generated in each kit file's local bounds (`KIT_LOCAL`, checked against every kit box), Mereford's crates and barrels among them, posts under the lodge's and Wykes's decks, a timber dais, ladders, a braced frame, a hurdle, brick stacks, two hoists (a bell on `bell: true`) and five shrubs from `tree_small_02`'s canopy; the 12 Poly Haven `interiorProps`, the game's own nine models at 1k, under an empty at their authored offsets with their own materials; Devon's 75 appended by collection from the pinned `castle_props.blend` (#867) and re-materialed per face by the atlas region under its UV centroid, 28 regions into five PBR kinds (`materials.PROP_KINDS`, tinted by an `atlas_rgb` attribute) and the other 71 kept on his atlas, the region names read from `tools/props/atlas.py`; the four flame regions (`EMIT`) emissive on `MAT_flame` (#874); the 20 `builtProps` as their boxes, `slate`, `parchment` and `wool` through `materials.ALIAS`. Four wall-hung props are pushed under a centimetre off the plaster (`HANG_GAP`). From 7b (#959), the packs: the five pieces on `assets/blender/calibration/` and `evidence/` glbs (`PACK_MODEL`), imported from the repo by Blender's glTF importer, the node's translation baked into the mesh, each face re-materialed by its palette colour (`PACK_KIND` wood and iron onto the prop kinds, `PACK_KEEP` on the glb's own material); 2a's swaps leave 10 Poly Haven rows. Each object is held to its box within 0.01 m. | 6, 7b |
| `lighting` | `lighting.py` | `LIGHTING`, no `planId` (#873 to #875): the only World, `WORLD_hdri`, the HDRI unrotated with its sun clamped at 16 for every ray but the camera's; `SUN`, the Sun lamp carrying what the clamp removes; the game's three braziers, `BRAZIER_<n>`, Devon's `brazier` at `scene-config.json`'s positions through the blueprint, raising on a clash unless `BRAZIER_CLASH` names it; a Point light wherever the model draws a flame, found by a rule over faces (37 on increment 7's through build: 30 candle, 2 torch, 4 brazier, 1 hearth; 26 on 7b's master, 19 candle, since `candles-chapel` left `brass_candleholders` for `pricket.glb`, which draws no flame); the five cameras from `cameras.json` through the blueprint, `CAM_spawn` the scene's. A build without it has no World. | 7 |
| `markers` | `markers.py` | `MARKERS`, #843's contract, from the blueprint (#893 to #896): a wire `ROOM_` per blueprint room and open place, a CUBE empty `COL_` per collider and `STAIR_` per ramp with `_LOW` and `_HIGH` ends, a `GATE_` per gate, `gates.py`'s four `GATE_<id>_HINGE` adopted (made here when `gates` did not run), `SPAWN` aimed at `lookAt`, and an `EVID_`, `READ_` or `BELL_` at each carrying piece's box centre; 899 objects on the 445-piece plan, each tagged `marker` and hidden from render. `ADJUST` moves a marker off the blueprint with a reason, and ships empty. | 8 |

`export.py` (increment 9) writes `castle.glb` and `markers.json`, in a third
Blender over the saved master, and is not a stage (#896, #897); see "The
export" below. A stage whose
module does not exist yet is an error naming it, not a skip. Every stage has
its module from increment 8, and from 7b (#955 to #960) a plain build exits 0
and writes the master over the 451-piece plan. `--only guide` prints `STAGE_OF`,
the table in `common.py` that gives each blueprint piece to one stage.

The batter and the crenellation (increment 2, the lead's call): a curtain run
standing on the ground splays its outer face, the one away from the curtain
box's centre, 0.5 m outward over the bottom 2.5 m, and its inner face stays
plumb so nothing inside the ward moves; the cross-wall and the gate-over runs
have none. The parapet takes the kit merlons' band (1.2 m deep, 8 to 9.6 m)
and alternates merlons and crenels at the drums' `crown` read as widths, 1.5
and 0.6 m, stretched to fit whole, with the crenel sill 0.9 m over the walk.

The frame, from #843: a game point `(x, y, z)` is Blender `(x, -z, y)`, and
a game `rotationY` is the same angle about Blender Z, same sign.

## The cache

`fetch.mjs` lands each `url` row of `sources.json` at
`<out>/cache/<asset>/<file>`, and `common.cached(row)` is the same path on the
Blender side. `asset` is the Poly Haven slug. `file` is the URL's file name
for a texture map, an HDRI or a model's `.blend`, and the API's `include` key
verbatim for a file only a model's `.blend` reads
(`textures/island_tree_01_leaves_diff_1k.png`), so each `.blend` finds its
`textures/` beside it exactly as Poly Haven laid it out. One row per file,
each with its own sha256 and `bytes`. A row whose `asset` or `file` is
missing, absolute, or holds a `..` segment or a backslash is refused, and so
are two rows that land on one path.

A cached file that hashes differently from its row is deleted and the fetch
exits non-zero; run it again to download it fresh. A new row's sha256 comes
from one download whose size and md5 matched the Poly Haven API's listing
(`https://api.polyhaven.com/files/<id>`); the helper that did that is not
committed, and `fetch.mjs` has no pin mode.

Images are not packed. `build.py` saves every image path `//`-relative, so
`castle.blend` reads `//cache/...` and a partial `//../cache/...`: copy or move
the whole output folder and it still opens whole; move a `.blend` without its
`cache/` and `check.py` line 4 names every image it lost.

## check.py

Nine lines (#844, amended by #876 and #895), each printed `ok`, `FAIL` or `--` (did not run). Line 4,
images, runs on every build; the rest run when their stage did, and a line
whose stage ran before its body was written fails. Lines 5 (level ground) and
6 (coverage) are live from increment 1, and 7 (light) and 8 (cameras) from increment 7, when `lighting` ran;
lines 1 (rooms), 2 (gates), 3 (where) and 9 (markers) from increment 8, when `markers` ran.
Line 3 holds every marker within 0.5 m of the blueprint unless `allow.json` names it with a
reason, and the ones a geometry stage realises within 0.5 m of that object, which
`allow.json` cannot excuse. Line 6 fails on any piece of a stage that ran that
nothing names, unless `allow.json` names it with a reason; from 7b (#960) it
also fails on a piece-id entry some object realises (stale) and on a key that
is no piece, marker or `model:<file>`, and its pass line counts the allowed
ids when any applied. From increment 9 (#898) line 9 also holds, when `props`
ran, each `PROP_<id>`'s `noCollide` to its blueprint piece's. Non-zero on any
failure.

## The export

`export.py` opens `castle.blend` (a full build's, or it refuses) and runs
Blender's glTF exporter: GLB, Draco off, images embedded (`AUTO`, so a cached
JPEG goes in byte for byte), renderable objects only, which is the whole
exclusion of `GUIDE` and `MARKERS`, modifiers applied, custom properties as
node extras (`planId`, `planIds`, `noCollide`), no cameras, lights or
animation, Y-up, so the glb is in the game's frame. The four gate hinges are
dropped and each `LEAF_` becomes a root node on its pivot. It writes
`castle.part.glb` and moves it onto `castle.glb` (the exporter appends `.glb`
to any other name), so a failed export leaves no half file. `markers.json` is
`MARKERS` read back from each object's world matrix through
`common.to_game`, never copied from the blueprint, every float to 4 decimals,
LF. Each file's bytes and sha256 are printed, and two `--export-only` runs
over one master print the same.

`check-export.mjs` then holds both files and prints one `ok    export:` line
with the glb's numbers, computed with the pinned `@gltf-transform/core`:
glTF 2, no Draco, every image embedded, no camera or light, no node named
`GUIDE_` or as a marker, every blueprint piece named by a node's extras unless
`allow.json` names it, each `LEAF_` within 0.01 m and 0.1 degree of its
pivot; `markers.json`'s ids the blueprint's, list by list, and each marker
within 0.5 m of the blueprint unless `allowed` names it. Runnable alone:
`node tools/castle3d/check-export.mjs --out <dir> [--glb <file>]`.

The sizes, on 7b's master: the glb about 570 MB, about 3.6 million
triangles in 441 meshes and about 42 million placed (the 71 terrain trees on
one shared mesh are most of it), 130 images, about 1.7 GB of texture memory
uncompressed. That is the integration row's (2i) to argue down; nothing
here bites, since the glb lives outside the repo (#841).

## The skin (rank 2i)

```
npm run castle3d:skin -- --stages curtain --dest <file>   skin.py, then the curtain cut to <file>
npm run castle3d:skin -- --cut-only --stages curtain      the cut alone, from <out>/skin/skin-full.glb
npm run castle3d:skin -- --drop <stage>                   one stage out of the written file, no Blender
```

`skin.py` is a fourth Blender over the master and never saves it; `skin.mjs`
checks castle.blend's sha256 before and after. It deletes props, `BRAZIER_`,
#853 and #855, GUIDE and MARKERS; decimates each tree to 2,000 triangles, each
rock to 1,000 and the ground to 40,000; joins the land's trees per species and
rocks per mesh; bakes `LOOK`'s tint and warm into base colour pixels and #857's
house colours into `COLOR_0`; caps base colour at 1024 and normal and
metal-roughness at 512; stages every object; and writes
`<out>/skin/skin-full.glb`. `skin.mjs` cuts it by `extras.stage`, holds the
caps again, writes the cut raw, prints each stage's draws, triangles, images and
projected KTX2 memory, and records its inputs' sha256 in a manifest:
`tools/castle3d/skin-manifest.json` for a cut in the repo, or
`skin-manifest.json` beside a cut outside it. With no input moved it prints
"unchanged" and writes nothing. SPECS.md, "Castle in Blender: the integration
row", is the spec.

## Committed here

The scripts, `cameras.json` (the five cameras, #875), `sources.json` (every input with its URL or path, licence and
sha256; 132 rows from increment 4), `allow.json` (each departure from the
blueprint with its reason, a marker's keyed by its object name; from 7b the
five backdrops, #960), this file and `CREDITS.md`. No `.blend`,
no image, no model: those stay in the output folder (#499, #841).
