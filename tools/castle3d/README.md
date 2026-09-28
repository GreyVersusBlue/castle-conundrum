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
```

On Devon's machine only. The launcher, `build.mjs`, in order:

1. exits non-zero if `CI` is set (#842);
2. finds Blender at `CASTLE3D_BLENDER`, else the Steam install at
   `C:\Program Files (x86)\Steam\steamapps\common\Blender\blender.exe`. It
   never reads `BLENDER`, which rank 1 points at a 4.5 (#805);
3. refuses any Blender whose `--version` does not start `Blender 5.2` (#840),
   and `common.py` refuses it again from inside, exiting 3;
4. refuses an output folder inside the repo (#841);
5. writes `<out>/blueprint.json` from `makePlan` (`export-blueprint.mjs`);
6. fetches and hashes every `sources.json` row into `<out>/cache/`
   (`fetch.mjs`, the only network use);
7. runs `build.py` in a factory-startup Blender with `PYTHONHASHSEED=0`;
8. runs `check.py` in a second Blender over the file it saved (#844).

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
| `partial/<stages>.blend` | An `--only` build. Never overwrites the master. |
| `last-build.txt` | The path `build.py` saved, which the launcher hands to `check.py`. |

## The stages, in their fixed order

| Stage | Module | Builds | Increment |
| --- | --- | --- | --- |
| `guide` | `blueprint.py` | `GUIDE`: a wireframe box per piece and ramp, a box or 32-sided cylinder per room, a box per open room over its gate band. Always runs. | 0 |
| `terrain` | `terrain.py` | A 400 m height field on game x -81, z 0, exactly 0 over the pieces plus 10 m and seeded hills outside; the cobbled road to the west gate; 120 trees and 60 rocks from Poly Haven models, each with a seeded yaw, scale, lean and leaf tint; grass by a seeded Geometry Nodes scatter; the World from the HDRI. Mud, grass and cobble come from `materials.py`. | 1 |
| `walls` | `walls.py` | The 21 runs (16 curtain, 2 cross-wall, 3 gate-over) as the plan's collider boxes clipped to each piece's box, so a doorway the plan cuts is an opening; the 15 walks; one crenellation per run carrying its kit merlons in `planIds`, every one of the 61 claimed by exactly one run or the stage raises. Arrow slits through every other merlon. The blueprint's own slugs (#849) from `materials.library`. | 2 |
| `towers` | `towers.py` | The eight drums from each piece's per-sector `stone` (doors and crown included), hollow to the interior radius, with a 0.4 m plinth over the bottom 2 m and an arrow slit per storey in every third sector not buried in a run; floors and flat roofs as the plan's discs cut to their colliders (the stair wells); the four turrets, capped at 12 m, under roof_slates_02 cones in the drum's own object; the 18 flights as solid steps of about 0.18 m along each ramp's `slope`, in defense_wall. | 2 |
| `gates` | `gates.py` | The three gate arches (`ARCH_<gate id>`), round-headed to the leaf's `springline` and `archRadius` through the arch's depth, in the stone of the runs either side, the west and east jambs battered with the curtain; the four leaves (`LEAF_<id>`: seven planks, two ledges, iron straps) built in the hinge's frame and parented to `GATE_<id>_HINGE`, a plain-axes empty in `MARKERS` at the blueprint's `pivot`; the west gate's portcullis, raised, in a slot, no `planId`; `BARS_cell-bars` (the plan's six uprights and two rails) and `BAR_walk-bar`. Each leaf and bar is held within 0.01 m of its blueprint box or the stage raises. Then #851's shut outer gate in `barbican-west`, which `walls.py` cuts out through `walls.OUTER_GATE`: `ARCH_barbican-outer`, two shut leaves and a lowered portcullis, each `modelOnly: "#851"` and none with a `planId`. `wooden_gate` and `rusty_metal` (#852), which `oak` and `iron` reach through `materials.ALIAS`, with no tiling break-up (`materials.PLAIN`). | 3 |
| `buildings` | `buildings.py` | The inner rooms with thickness, the hall's trusses and roof. | 4 |
| `town` | `town.py` | Mereford, the town wall, Wykes's yard. | 5 |
| `props` | `props.py` | Devon's 71 props re-materialed, Poly Haven props, built slabs, kit decor. | 6 |
| `lighting` | `lighting.py` | HDRI, sun, practicals, five cameras. | 7 |
| `markers` | `markers.py` | `MARKERS`, #843's contract. | 8 |

`export.py` (increment 9) writes `castle.glb` and `markers.json`. A stage
whose module does not exist yet is an error naming it, not a skip, so a full
build fails until every stage has shipped. `--only guide` prints `STAGE_OF`,
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

Six lines (#844), each printed `ok`, `FAIL` or `--` (did not run). Line 4,
images, runs on every build; the rest run when their stage did, and a line
whose stage ran before its body was written fails. Lines 5 (level ground) and
6 (coverage) are live from increment 1; lines 1 to 3 wait for the markers.
Non-zero on any failure.

## Committed here

The scripts, `sources.json` (every input with its URL or path, licence and
sha256; 107 rows from increment 3), `allow.json` (each departure from the
blueprint with its reason; empty), this file and `CREDITS.md`. No `.blend`,
no image, no model: those stay in the output folder (#499, #841).
