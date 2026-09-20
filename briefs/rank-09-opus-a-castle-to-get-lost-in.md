Take rank 9 in `BACKLOG.md`, "A castle to get lost in". Size 2+, container, lane B. The gate is open: rank 4c's Thomas Wykes's yard shipped on 2026-09-19 (#703 to #707) and proved the ground west of the barbican can carry a building. This is a 2+, so take one increment, ship it, and rewrite the row's text to say what is done.

Read the row's section in `SPECS.md`, then `HISTORY.md` #582, #588 to #591 and #703 to #707, and `PLAN.md` on "an empty room is worse than no room". The volume step and the map are already shipped. What is left is **the town**.

**What the yard left to build from.**
- The `town-wall` run at x -64: 64 m of Mereford's wall with the town gate already cut in. Extend it, do not replace it.
- `ward: "outside"` as a room's third answer, with `test/layout.mjs` check 4c holding what that word costs: clear of the curtain, standing on a piece of `config.ground.outside`, reached by nobody.
- 28 m of empty ground between the castle and the yard, on a map frame that grew from 67.6 m wide to 90.8 (#706). That is where the street goes.

**The decision that decides the class.** #703 settled that the player sees the yard and never stands in it, because a town the player can walk into is a way out of a castle that `test/layout.mjs` check 4 asserts is sealed. Keep that. If the increment can be done inside it (a street, a church and a quay as visible, named, mapped outside rooms), it is class S (`builder`). If it needs the player to walk into the town, that overturns a numbered decision and check 4, which is class O (`architect`): write the decision and its spec section before any building.

**Suggested first increment.** The street and its buildings as plan pieces, each carrying a `planId`, plus the outside rooms in `config.rooms` so the journal's map draws them, since the map is the plan's list and not a second one. Room ids the map shows must be reflected in `repair`'s visited-set clamp. That does not need a save version bump unless the field itself changes; if it does, stop, since that is class O and lane A's.

**Costs to watch.**
- `test/budget.mjs` has no ceiling for the outside bucket on purpose, and the yard is 34 meshes in it. State the new total. Adding a ceiling is class O.
- Instance repeated pieces, since 63 % of the castle's meshes is already the eight tower drums.
- New assets go through `npm run assets:encode` before commit (#506), and the 200 MB ceiling has about 17 MB spent on the town side so far (#499).

**Suites.** Plan-derivable facts go in `test/layout.mjs`, and `test/plan-vs-scene.mjs` holds the seams only (#529). Break each new rail once on purpose (#34). Add the look with `tools/shot-yard.mjs`'s pinned camera rather than moving the spawn, which `validatePopulace` refuses, and mark the look as unseen if it has not been photographed on a GPU (#53).

Work in its own `git worktree`. Finish per `BACKLOG.md`'s definition of done and report in at most fifteen lines.
