Take rank 9 in `BACKLOG.md`, "A castle to get lost in". Size 2+, container, lane B. The gate is open: rank 4c's Thomas Wykes's yard shipped on 2026-09-19 (#703 to #707), and the town's first increment, Mereford's street and church inside its wall, shipped on 2026-09-21 (#725 to #728). This is a 2+, so take one increment, ship it, and rewrite the row's text to say what is done.

Read the row's section in `SPECS.md`, then `HISTORY.md` #582, #588 to #591, #703 to #707 and #725 to #728, and `PLAN.md` on "an empty room is worse than no room". The volume step, the map, the town wall, its six houses and its church are all shipped. What is left is **the quay and the river**, outside the west gate.

**This row has no `SPECS.md` scope for the quay yet.** The spec section says so directly: water is a surface kind the plan does not have, so this is class O (`architect`) first — write the decision and the spec section, then a later session builds it as class S. Do not start building before that section exists.

**What the quay needs decided**, per the spec's own open call: a water surface kind for `castle-plan.js`'s walkability fill, a step sound for it in check 12, and ground below y 0 for "down through Mereford to the quay." The kit has `water.glb`, `dock-side.glb` and `dock-corner.glb` waiting. `data/lore.json`'s `the-quay` fact already names a slate-roofed toll-house at the quay's head — the one slate roof in the town; every other roof is `roof.glb`.

**The decision that still holds.** #703 settled that the player sees the town and never stands in it, because a town the player can walk into is a way out of a castle that `test/layout.mjs` check 4 asserts is sealed. Keep that unless the quay's own spec section argues otherwise and records the overturn.

**Costs to watch.**
- `test/budget.mjs` has no ceiling for the outside bucket on purpose, and the yard is 34 meshes in it. State the new total. Adding a ceiling is class O.
- Instance repeated pieces, since 63 % of the castle's meshes is already the eight tower drums.
- New assets go through `npm run assets:encode` before commit (#506), and the 200 MB ceiling has about 17 MB spent on the town side so far (#499).

**Suites.** Plan-derivable facts go in `test/layout.mjs`, and `test/plan-vs-scene.mjs` holds the seams only (#529). Break each new rail once on purpose (#34). Add the look with `tools/shot-yard.mjs`'s pinned camera rather than moving the spawn, which `validatePopulace` refuses, and mark the look as unseen if it has not been photographed on a GPU (#53).

Work in its own `git worktree`. Finish per `BACKLOG.md`'s definition of done and report in at most fifteen lines.
