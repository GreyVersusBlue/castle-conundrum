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
# A stage whose module does not exist yet is an error, named, not a skip: a
# full build before increment 8 fails on the first missing stage rather than
# saving a castle.blend that silently lacks it (#13).

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
with open(os.path.join(out, 'last-build.txt'), 'w', encoding='utf-8') as f:
    f.write(target + '\n')
print(f"castle3d: saved {target} ({', '.join(stages)})")
