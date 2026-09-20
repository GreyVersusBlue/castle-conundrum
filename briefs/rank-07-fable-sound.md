Take rank 7 in `BACKLOG.md`, "Sound: a soundscape". What is left is the listening, and it needs a person with speakers or headphones on Devon's machine. Nothing shipped in this row has been heard (#53).

Read the row's section in `SPECS.md` first, especially its "Listening checklist", and `HISTORY.md` #519 to #522, #548, #680 to #683 and #696 to #698. Seven synthesised ambient beds, a bed at a point, four bell rings, a door and a hound all shipped. Every number in `data/sounds.json`'s `ambient`, `bell.rings` and `events` blocks is a guess, and the file says so.

**The job.** You cannot hear anything, so you run the session as the person at the keyboard's hands.
- Start `npm run play` or the dev server in its own `git worktree`, and step through the checklist one item at a time, telling the listener where to stand and what to press, and asking what they heard in the words the checklist uses ("a wind or a hiss", "a hinge or a buzz", "a dog or a duck").
- Turn each answer into a change in `data/sounds.json` and nowhere else, since that file is the only place a sound is tuned. Re-run, ask again, and keep the loop short. Write what was wrong, not that it was wrong.
- The three most likely wrong: 14 m of earshot through stone (`ambient.spatial.hearMetres`), a tower roof heard from the hall under it, and the bark's formant (560 Hz falling to 380 Hz through 1100 Hz).
- Record each answer, and the number that changed with it, in `HISTORY.md` against this row.

**Recorded audio.** CC0 recordings have been admitted since #548 and none has been looked for. A sound stays synthesised until a recording beats it, not the other way round. If a listener says a synthesised sound cannot be fixed by tuning, name a specific CC0 file and its licence, and that decision goes in `HISTORY.md`. If one lands, it is named by `data/sounds.json`, encoded by `tools/encode-assets.mjs` (Opus in Ogg) the same commit, and swept by `test/assets.mjs` (#390, #506). Nothing is fetched at runtime (#493).

**Do not add** the hammer or the sweep. They wait on rank 6's clips.

**Acceptance.** `test/layout.mjs` checks 13 and 14 stay green. Any new zone, cue or bed keeps them holding both ways. Nothing plays before the start button (#697). Break any rail you add on purpose once (#34). If the listener is not available for an item, leave it unchecked and say so, and do not tune blind.

Lane E is `src/audio.js` and `data/sounds.json`. Finish per `BACKLOG.md`'s definition of done and report in at most fifteen lines.
