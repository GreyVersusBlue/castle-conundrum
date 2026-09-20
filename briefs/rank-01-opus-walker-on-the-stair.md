Take rank 1 in `BACKLOG.md`, "The walker on the stair" (#710). Size ¼, container, no lane, no gate. It is the one thing between `npm run play` and the end of the day, and it gates rank 2.

Read the row's section in `SPECS.md` first, then classify the increment per the lead's protocol in `CLAUDE.md` and dispatch. The spec has both open calls answered, so this is class S (`builder`): the fix goes in the suite, and the wall symptom is the same row.

**The problem.** `test/play-castle.mjs`'s `hike` walks the path graph from `walkability(plan)` in `src/castle-plan.js`, and that graph treats a stair flight as walkable floor. The shortest route out of the chapel crosses the Chapel Tower's ramp, the player is driven up it, and every re-plan starts a storey too high and returns the same route. Three identical answers is the `lost the line` path, and the beat gives up. Run three on 2026-09-19 stalled at (22.4, 15.2) L1 and then (23.4, 14.4) L1, the second being #630's own recorded coordinate.

**The second symptom is the same row.** With pointer lock healthy the player also slides along a face it cannot find the door in: (-18.9, -14.3) inside the Kitchen Tower, and (-33.5, 5.0) and (-26.5, 5.0) along the Great Hall's north wall, whose doorways are at x -20 and -12. A waypoint list with no mark in the doorway lets the aim-and-hold loop cut the corner into the jamb.

**What to do.**
- Drop ramp and wrong-level waypoints when both ends of a route are on the same storey, in the suite's thinning rather than the plan's graph. `src/stations.js` walks the twelve along the same graph without this trouble, and changing the graph would move twelve bodies to fix one.
- Make the waypoint list put a mark in every doorway a route passes through.
- Add a Node check that a route between two rooms on the same storey has no waypoint whose level differs from both ends, over every pair of ground rooms the plan knows. It is derivable from the plan in Node, so it goes in `test/layout.mjs` and not `plan-vs-scene.mjs` (#529).
- Break it on purpose once (#34): re-admit one ramp cell to a route, watch the new assertion fail from a green baseline, and say which assertion and what it said.

**Not this row's.** The proof that the day runs to the second bell and beyond needs a GPU and is rank 2's (#53). A pass under software rendering does not close it, so do not claim the day runs. Say what the Node check holds and that the run is still owed.

Do not touch `src/` unless the suite cannot be fixed without it, and if it comes to that, stop and write the reason into `HISTORY.md` as a decision. Work in its own `git worktree` with a junction for `node_modules`, since a working tree is one copy of `npm test`, `dist/` and the harness ports.

Finish per `BACKLOG.md`'s definition of done: `npm run build` and `npm test` green, HISTORY numbers read from `origin/main` at the end and not the start, the row retired from `BACKLOG.md`, `ROADMAP.md` and `SPECS.md` with rank 2's gate note updated, and the header rewritten. Report in at most fifteen lines: files touched, the assertion added and which one failed when broken, the `npm test` result, and the HISTORY numbers claimed.
