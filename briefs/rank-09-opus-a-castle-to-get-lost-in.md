Take rank 9 in `BACKLOG.md`, "A castle to get lost in". Size 2+, container, lane B. The town (#725 to #728) and the quay and river (#870 to #872) have shipped, so the row's text says what is left; read it first. This is a 2+, so take one increment, ship it, and rewrite the row's text to say what is done.

Read the row's section in `SPECS.md`, then `HISTORY.md` #582, #588 to #591, #703 to #707 and #725 to #728, and `PLAN.md` on "an empty room is worse than no room". The volume step, the map, the town wall, its six houses and its church are all shipped. The quay and the river shipped as increments 3a and 3b, and its look is unseen on a GPU (#53), which is rank 3's run. What is left is **the rock**, which has no `SPECS.md` scope yet, so it is class O (`architect`) first: write the decision and the spec section, then a later session builds it as class S. Do not start building before that section exists.

**The decision that still holds.** #703 settled that the player sees the town and never stands in it, because a town the player can walk into is a way out of a castle that `test/layout.mjs` check 4 asserts is sealed. Keep that unless the quay's own spec section argues otherwise and records the overturn.

**Costs to watch.**
- `test/budget.mjs` has no ceiling for the outside bucket on purpose, and the yard is 34 meshes in it. State the new total. Adding a ceiling is class O.
- Instance repeated pieces, since 63 % of the castle's meshes is already the eight tower drums.
- New assets go through `npm run assets:encode` before commit (#506), and the 200 MB ceiling has about 17 MB spent on the town side so far (#499).

**Suites.** Plan-derivable facts go in `test/layout.mjs`, and `test/plan-vs-scene.mjs` holds the seams only (#529). Break each new rail once on purpose (#34). Add the look with `tools/shot-yard.mjs`'s pinned camera rather than moving the spawn, which `validatePopulace` refuses, and mark the look as unseen if it has not been photographed on a GPU (#53).

Work in its own `git worktree`. Finish per `BACKLOG.md`'s definition of done and report in at most fifteen lines.
