Take rank 10 in `BACKLOG.md`, "Bodies". Sourcing work that needs a network reaching the asset hosts, so it runs on Devon's machine, and it is the asset-sourcing shape rank 1 was: fetch, compare against the rig, reject with a number.

Read the row's section in `SPECS.md` and `HISTORY.md` #603 to #606, #643 to #645 and #684 to #686 first. Shipped so far: the child (`Woman.glb` scaled, with a bigger head), `Hound.glb`, `Hen.glb` and `Spear.glb`, the last three off poly.pizza, which re-hosts Quaternius's CC0 packs as glTF. One shared rig, and `npc.js`'s `pickClip`, `tintBody` and `_findHandBone` must keep working with no code change.

**What is left.** The four activity clips rank 6 defers: `sweep`, `hammer`, `spar` and `drill`. No body on disk has them. The job is to find or make a clip for each on the shared rig, and to report honestly on any that cannot be had.

**How.**
1. Search the same hosts that worked (poly.pizza and the Quaternius packs it re-hosts) and any CC0 animation pack whose skeleton matches the Quaternius rig. State each candidate's licence and check the bone names against the existing files rather than trusting the listing. Measure and reject with a number the way #569 rejected KayKit (head joint at 57 % of body height against the rig's top fifth). The wrong rig or a non-CC0 licence is a reject, not a compromise.
2. Retarget or re-export through `gltf-transform` so the clip lives in the existing body files and not in a new one, and name it so `ACTIVITY_CLIPS` in `src/populace.js` resolves it. Expect the FBX-export problems #684 hit: a 100x armature scale that has to be baked into vertices, joints and bind matrices.
3. Run `npm run assets:encode` before committing (#506). This needs KTX-Software's `ktx` on PATH, so check that first and say if it is missing. An uncompressed body is the one asset nothing else would catch. Keep each body within 0.5 to 1.5 MB meshopted.
4. Reference and asset land in the same commit (#390), and `test/assets.mjs` and the clip check in `test/mystery.mjs` must pass.
5. Add the new rows to `ACTIVITY_CLIPS` only for clips that exist. Do not fake one by aliasing an idle.

The visual acceptance is `npm run play` on a GPU and is separate (#53): note which clips are unlooked-at rather than claiming they read.

**Lane C**, so do not run beside rank 6. The two rows trade clips in both directions, so leave rank 6 a short note in `HISTORY.md` saying what activity names are now available. Work in its own `git worktree`. If nothing suitable exists for a clip, that is a finding, so record the search and the numbers. Report in at most fifteen lines: hosts tried, what was rejected and why, what shipped, its size, and the `npm test` result.
