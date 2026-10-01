Take rank 6 in `BACKLOG.md`, "Life: a populace". Size 2+, container, lanes C and D, no gate. It will not finish in one sitting, so take one increment, ship it, and rewrite the row's text to say what is now done.

Read the row's section in `SPECS.md` and `HISTORY.md` #616 to #618 and #729 to #733 first. Two increments shipped: ten people, then five more plus a `talk` rail. `data/populace.json` holds 19, and the page builds 32 of 32 bodies — 13 cast plus 19 populace, exactly `MAX_SKINNED_TOTAL`. `validatePopulace` is owned by `test/mystery.mjs` (#529).

**Choose the increment and state its class.** The row's own spec says what is left waits on three other rows and one argument:

1. **The rest of the fifty** waited on rank 9's town, which shipped (#725 to #728, the quay #870 to #872). Read the row's section for whether `garden` became ground before taking it.
2. **The twelve's 27-pair chatter pool is still unspent by proximity.** The spec recommends a later lore or dialogue increment hold each pair to the schedule the way #592 holds a performance — 5 of the 27 survive a same-room rule as written, the other 22 need a room and a bell somebody authors. This is startable now and is the most likely next increment.
3. **The ceiling stays 32** until a row renegotiates it against the GPU run's `renderer.info`, not a second guess. Do not renegotiate it from a container.

The generated clips exist and four of the five are placed in the household's routines (#800); `drill` is still nobody's. Rank 10 is retired into 2c and 2d (#807), so a clip no body has is theirs, not this row's.

**Acceptance.** `validatePopulace` finds nothing and `test/mystery.mjs` still rejects every break in its list. Break the new rail on purpose once (#34) and say which assertion failed. A populace stop is not a plan piece and has no `planId` (#500).

**Standing obligation.** If you touch a `dialogue` block in `data/npcs.json`, run `npm run dialogue:extract` before committing, because `test/dialogue.mjs` fails if it and `dialogue/castle.dlg` disagree (#687).

Work in its own `git worktree`. Finish per `BACKLOG.md`'s definition of done, with the row's text rewritten rather than retired. Report in at most fifteen lines.
