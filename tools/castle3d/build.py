# build.py - builds the realistic castle model from factory startup (#839 to #844).
#
#   blender -b --factory-startup --python-exit-code 1 --python tools/castle3d/build.py
#           -- --out <dir> --blueprint <file> [--only stage,stage]
#
# Run by build.mjs, which is the only supported way in: it pins the version,
# refuses CI and an output inside the repo, and runs check.py afterwards.
#
# `guide` always runs, then the requested stages in common.STAGES' fixed order.
# A full build saves <out>/castle.blend; an --only build saves
# <out>/partial/<stages>.blend and never touches the master (#841). The stage
# list goes into scene["castle3d_stages"] for check.py (#844), and the saved
# path into <out>/last-build.txt for the launcher.
#
# A stage whose module does not exist yet is an error, named, not a skip, so a
# build never saves a castle.blend that silently lacks one (#13). From
# increment 8 every stage has its module, `guide` to `markers`, and `export`
# is never a stage (#896). What stops a full build now is the plan moving
# under the model: until increment 7b, `town` raises naming the quay's 14
# pieces it has no rule for, and the master is not saved (#893).

import os
import sys
import importlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # no __pycache__ in the repo; .gitignore stays as it is
sys.path.insert(0, HERE)

import bpy

import common  # the pin runs here, before anything else

argv = common.args_after_dashes()
out = common.arg(argv, '--out')
bp_path = common.arg(argv, '--blueprint')
only = common.arg(argv, '--only')
if not out or not bp_path:
    raise SystemExit('build.py: needs -- --out <dir> --blueprint <file>')

if only:
    asked = [s for s in only.split(',') if s]
    unknown = [s for s in asked if s not in common.STAGES]
    if unknown:
        raise ValueError(f"build.py: unknown stage(s) {', '.join(unknown)}; the stages are {', '.join(common.STAGES)}")
    stages = [s for s in common.STAGES if s == 'guide' or s in asked]
    target = os.path.join(out, 'partial', '+'.join(s for s in common.STAGES if s in asked) + '.blend')
else:
    stages = list(common.STAGES)
    target = os.path.join(out, 'castle.blend')

bp = common.load_blueprint(bp_path)
scene = common.empty_scene()
# No .blend1 beside a file of a few hundred megabytes; the saves below are two.
bpy.context.preferences.filepaths.save_version = 0
common.OUT = out  # before the first stage, so a stage finds <out>/cache/ (common.cached)

for stage in stages:
    mod_name = common.MODULE[stage]
    if not os.path.exists(os.path.join(HERE, mod_name + '.py')):
        raise RuntimeError(f"build.py: stage {stage} has no module tools/castle3d/{mod_name}.py yet")
    print(f"castle3d: stage {stage}")
    common.seed(stage)
    importlib.import_module(mod_name).build(bp)

scene['castle3d_stages'] = ','.join(stages)
os.makedirs(os.path.dirname(target), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=target, check_existing=False)

# Not packed: packing would put the whole cache into every .blend. Every
# unpacked image's path is made relative to the file just saved, and the file
# saved again, so the master holds //cache/... and a partial //../cache/...,
# and survives the output folder moving whole. check.py line 4 resolves either
# through bpy.path.abspath. The cache is inside the output folder, so relpath
# cannot cross a drive. Blender 5.2's save_as_mainfile already remaps them
# under factory settings; this does not lean on that preference.
relative = 0
for img in bpy.data.images:
    if img.packed_file is not None or img.library is not None or img.source not in {'FILE', 'SEQUENCE', 'TILED'}:
        continue
    if not img.filepath or img.filepath.startswith('//'):
        continue
    img.filepath = bpy.path.relpath(bpy.path.abspath(img.filepath))
    relative += 1
if relative:
    bpy.ops.wm.save_mainfile(check_existing=False)
unpacked = [i for i in bpy.data.images if i.packed_file is None and i.filepath]
print(f"castle3d: {sum(i.filepath.startswith('//') for i in unpacked)} of {len(unpacked)} unpacked image paths "
      f"//-relative ({relative} rewritten after the first save)")
with open(os.path.join(out, 'last-build.txt'), 'w', encoding='utf-8') as f:
    f.write(target + '\n')
print(f"castle3d: saved {target} ({', '.join(stages)})")
