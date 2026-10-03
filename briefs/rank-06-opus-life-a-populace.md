Take rank 6 in `BACKLOG.md`, "Life: a populace". Size 2+, container, lanes C and D, no gate. It will not finish in one sitting, so take one increment, ship it, and rewrite the row's text to say what is now done.

Read the row's section in `SPECS.md` and `HISTORY.md` #616 to #618, #729 to #733 and #911 to #915 first. Three increments shipped: ten people, five more plus a `talk` rail, then the chatter pool held to the schedule. `data/populace.json` holds 19, and the page builds 32 of 32 bodies (13 cast plus 19 populace), exactly `MAX_SKINNED_TOTAL`, which is 34 in `test/budget.mjs`. `validatePopulace` is owned by `test/mystery.mjs` (#529); the chatter rail is in `src/lore.js` and `test/lore.mjs` (#912).

**Choose the increment and state its class.** Done: 10 of the twelve's 27 chatter pairs carry a `room` at a day-one bell where both speakers stand (#911). `drill` is dropped as an activity (#915), so no clip is owed to this row; the Drill clip stays in the bodies until 2c or 2d re-render them (#807). What is left:

1. **Playback of the 10 placed pairs (#913).** The most likely next increment. `QuestManager`'s overhear band (#732) plays populace pairs by two settled bodies 1.5 to 3 m apart; the twelve stand on stations, so it needs a second trigger, an order against the sentry's song in the hall at Vespers (the hall holds six pairs), and its own browser beat.
2. **The 17 unplaced pairs, once Devon answers #914.** Recommended: recast and rewrite the 9 that are the only teller of a fact, retire the other 8, never move a station. Do not start this before the answer.
3. **The town's share of the fifty**, and whether `garden` becomes ground. It waits on the skinned-draw budget: `MAX_SKINNED_TOTAL` stays 34 until 2c or 2d (and CC-04) renegotiate it against the GPU run's `renderer.info`. Do not renegotiate it from a container.

**Acceptance.** `validatePopulace` finds nothing and `test/mystery.mjs` still rejects every break in its list. Break the new rail on purpose once (#34) and say which assertion failed. A populace stop is not a plan piece and has no `planId` (#500).

**Standing obligation.** If you touch a `dialogue` block in `data/npcs.json`, run `npm run dialogue:extract` before committing, because `test/dialogue.mjs` fails if it and `dialogue/castle.dlg` disagree (#687).

Work in its own `git worktree`. Finish per `BACKLOG.md`'s definition of done, with the row's text rewritten rather than retired. Report in at most fifteen lines.
