Take rank 11 in `BACKLOG.md`, "Feel". Size 2+, lane D. Gated on rank 2 for anything past its Node line, and the Node half of the first increment shipped already (#650 to #654). Confirm what rank 2 has said about the shadow and the hand before starting anything new.

Read the row's section in `SPECS.md` and `HISTORY.md` #650 to #654 first. `src/player-rig.js` puts a 0.46 m blob shadow under the feet and a hand of six primitives that reaches for whatever `interaction.currentTarget` offers. Two draw calls, 16 KB of canvas-painted texture, no asset, and every mesh has `raycast` set to a no-op so the rig cannot occlude the prompt.

**What is still open is three looks, and a GPU decides them (#53).**
1. Does the blob shadow read on stone and still read on grass?
2. What does the flat disc do on a flight of stairs, given that a flight is a ramp?
3. Does the hand read as a hand when it reaches for the muniment room's word-lock?

Nothing else in the theme (weather and sky, fire and its point-light budget, examine, doors that open, wear, sitting) starts until those three are answered, because they say whether the budget has room for more. So the first decision is which of two jobs this session is.

**If a GPU and a person are here:** photograph the three, write one sentence each into `HISTORY.md`, and fix what is wrong inside `src/player-rig.js`. A stairs fix is likely a disc that follows the ramp's surface height, and it must still use the plan's own floor height so the shadow and the feet cannot disagree about a slab edge. Keep the rig out of every ray, and re-verify by casting twice, once with `THREE.Mesh`'s own `raycast` put back.

**If not:** the honest output is a note saying the three looks are still owed. Do not start weather, fire or the rest. Do not claim the row closed on the Node half.

**If the three looks are answered and the budget has room,** pick one further increment from the theme, say which and why, and note that `WISHLIST.md` ranks none of them. Point lights are the number to watch: `test/budget.mjs` holds 3 point lights, all outer, against ceilings of 6 and 8, and video memory is what a light or shadow moves (#499, #510). Renegotiating a ceiling is class O (`architect`), argued in `HISTORY.md` first.

**Rules that bite.** Neither rig object is a plan piece and neither carries a `planId`, and that is asserted (#500). Each new assertion in `test/plan-vs-scene.mjs` is broken on purpose once (#34). Lane D is `src/main.js`'s player rig and spawn, so do not run beside rank 6.

Work in its own `git worktree`. Report in at most fifteen lines.
