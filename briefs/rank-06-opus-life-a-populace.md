Take rank 6 in `BACKLOG.md`, "Life: a populace". Size 2+, container, lanes C and D, no gate. It will not finish in one sitting, so take one increment, ship it, and rewrite the row's text to say what is now done.

Read the row's section in `SPECS.md` and `HISTORY.md` #616 to #618 first. Ten people shipped: `data/populace.json`, `src/populace.js`, a routine as a ring per bell, nine activities on three clips the kit already has, and `validatePopulace` owned by `test/mystery.mjs` (#529).

**Choose the increment and state its class.** The spec's open call recommends stopping at twenty bodies until rank 9's town exists, because fifty in the wards reads as a queue. Take that as the answer. The next increment is therefore:

1. **Ten more people, to twenty**, placed only on tiles `roomAt` and the walk grid accept, spread across the two wards, the upper floors and the wall walks. Class S (`builder`) if it needs no schema change. No body may be a woman wearing `Farmer.glb`; women wear `Woman.glb`, which is the one merge mistake lanes C rows have made before.
2. **Ambient talk**: the 27-pair chatter pool in `data/npcs.json` is spent once two populace bodies are within 3 m at one bell. The `gossip` activity marks the stops meant for it. It is read off the DOM in `test/plan-vs-scene.mjs` the way the performance captions are (#592).

Do both if they fit one PR, otherwise the first. Clips (`sweep`, `stir`, `hammer`, `spar`) are still deferred, since no body on disk has them, so do not add an activity that needs one.

**Numbers to answer to.** `test/budget.mjs` holds 20 skinned bodies per ward and 32 in the cast, and the peak is 17 per ward after the first ten (#609). Twenty more people will hit that ceiling, so run the suite early and say where it lands. If the row needs a ceiling renegotiated, that is class O (`architect`): argue it in `HISTORY.md` before building past it. The same goes for instanced meshes and animation LOD if the count demands them.

**Acceptance.** `validatePopulace` finds nothing and `test/mystery.mjs` still rejects every break in its list. Break the new rail on purpose once (#34) and say which assertion failed. A populace stop is not a plan piece and has no `planId` (#500).

**Standing obligation.** If you touch a `dialogue` block in `data/npcs.json`, run `npm run dialogue:extract` before committing, because `test/dialogue.mjs` fails if it and `dialogue/castle.dlg` disagree (#687).

Work in its own `git worktree`. Finish per `BACKLOG.md`'s definition of done, with the row's text rewritten rather than retired. Report in at most fifteen lines.
