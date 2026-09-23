Take rank 3 in `BACKLOG.md`, "The GPU run". Size ¼, and it is the one row that runs on Devon's own machine, with a real GPU and a visible window. Its gate, "Sight at the body's own height," shipped 2026-09-21 (#780 to #782); confirm that fix is on the `main` you start from.

Read the row's section in `SPECS.md` and `HISTORY.md` #624 to #630, #708 to #715 and #734 to #741 first. The judgement half of this row is already done: the twelve at Vespers, the Lauds sky, the covered hall and eleven bodies at interact range were looked at on 2026-09-19. The third sitting reached the accusation for the first time and got the wrong ending, from the bug the gate above fixed. **What is left is confirming that fix on a GPU.**

**The job.**
- Run `npm run play` in its own `git worktree`, not the shared tree. Another session's `git checkout` wiped a previous run's uncommitted edits mid-run, and Vite full-reloads the page whenever anything under `src/` changes.
- Goal: exit 0, or exit non-zero with each failing beat named and filed. Compare the new failure list against the third sitting's 17 (`HISTORY.md`, #741) and say which moved.
- A beat that fails on a GPU is a bug. A beat that failed under software rendering and passes here was never one (#53).
- `shots/play/` should now hold the numbered set to the end. Look at the shots and write one sentence per beat into `HISTORY.md`.
- Write nothing in `src/`. `test/play-castle.mjs` is the only file this row may change, and only for a suite bug, which must be recorded as one.

**Things already found and not yet fixed** are in `HISTORY.md` under #714, #715 and #718: `Press E to talk to the Sir Roger Lestrange` on every NPC, five stale or vacuous checks in `test/play-castle.mjs` including one that can only fail on a GPU, and a journal walk assertion that read 0.69 to 1.30 m against a 3.75 m unobstructed walk. Decide whether each is in scope for this session or gets its own row, and say which.

**The one item that needs a person.** The phone (#530): the stick throw, the sprint threshold, the look rate, the E button's size and the two render numbers are guesses, and only a real thumb settles them. If someone is at the keyboard with a phone, run it and record the six constants. If not, say plainly that it is untouched.

Finish with `HISTORY.md` recording what the run said beat by beat, the run's exit code, and what is still not seen. If the day does not reach the end, the honest output is the failing beat filed as a new row, not a claim. Report in at most fifteen lines.
