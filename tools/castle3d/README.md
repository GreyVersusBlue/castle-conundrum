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
| `cache/` | The hash-pinned Poly Haven inputs. |
| `castle.blend` | The master, from a full build only. Always output, never input: an MCP adjustment goes back into a script or it is lost (#841). |
| `partial/<stages>.blend` | An `--only` build. Never overwrites the master. |
| `last-build.txt` | The path `build.py` saved, which the launcher hands to `check.py`. |

## The stages, in their fixed order

| Stage | Module | Builds | Increment |
| --- | --- | --- | --- |
| `guide` | `blueprint.py` | `GUIDE`: a wireframe box per piece and ramp, a box or 32-sided cylinder per room, a box per open room over its gate band. Always runs. | 0 |
| `terrain` | `terrain.py` | A 400 m height field, flat at 0 under the castle, the road, trees, rocks, grass. | 1 |
| `walls` | `walls.py` | The curtain, the cross-wall, walks, crenellation. | 2 |
| `towers` | `towers.py` | The eight drums, their floors and eighteen flights. | 2 |
| `gates` | `gates.py` | Arches, portcullis, leaves on `GATE_<id>_HINGE`, the bars. | 3 |
| `buildings` | `buildings.py` | The inner rooms with thickness, the hall's trusses and roof. | 4 |
| `town` | `town.py` | Mereford, the town wall, Wykes's yard. | 5 |
| `props` | `props.py` | Devon's 71 props re-materialed, Poly Haven props, built slabs, kit decor. | 6 |
| `lighting` | `lighting.py` | HDRI, sun, practicals, five cameras. | 7 |
| `markers` | `markers.py` | `MARKERS`, #843's contract. | 8 |

`export.py` (increment 9) writes `castle.glb` and `markers.json`. A stage
whose module does not exist yet is an error naming it, not a skip, so a full
build fails until every stage has shipped. `--only guide` prints `STAGE_OF`,
the table in `common.py` that gives each blueprint piece to one stage.

The frame, from #843: a game point `(x, y, z)` is Blender `(x, -z, y)`, and
a game `rotationY` is the same angle about Blender Z, same sign.

## check.py

Six lines (#844), each printed `ok`, `FAIL` or `--` (did not run). Line 4,
images, runs on every build; the rest run when their stage did, and a line
whose stage ran before its body was written fails. Non-zero on any failure.

## Committed here

The scripts, `sources.json` (every input with its URL or path, licence and
sha256; empty until increment 1), `allow.json` (each departure from the
blueprint with its reason; empty), this file and `CREDITS.md`. No `.blend`,
no image, no model: those stay in the output folder (#499, #841).
