# HISTORY

What already shipped in Castle Conundrum, and every locked decision the project
has, by number. **Nothing open lives here** — open work is in `BACKLOG.md`, and
the plan those rows come out of is `PLAN.md`.

**These sections came across from `GreyVersusBlue/tools-and-games`' own
`HISTORY.md` on 2026-09-15, verbatim** (#491). That file carried 490 numbered
decisions across a dozen projects; the eleven sections below are the ones that
were Castle Conundrum's. They are in the order they shipped, oldest first.

## How the numbers work

The numbers start at **#389**, which is where this project's first locked
decision landed in the file it came from. They were kept rather than renumbered
because `src/` and `test/` cite them by number in about ninety places, and
renumbering would have turned every one of those citations into a lie.

Two consequences, and they are worth reading before you cite anything:

- **A number below #389 is `tools-and-games`'.** Nine of them are cited here
  and in `CLAUDE.md` because the rule they carry crossed with the project: #13,
  #17, #34, #36, #37, #39, #53, #147, #382. Where one crossed, #495 to #498
  below say so and say what it means here.
- **Numbers #395 to #410 are not here and never were this project's.** They
  belong to Orbital, Closing Time, Numina and the School Generator, and they
  stayed. The band is not a gap in the record; it is other people's work.

From **#491** the two repos number independently (#492). A `#495` here and a
`#495` in `tools-and-games` are different decisions, in different files, about
different things.

---

# Locked decisions

## Castle Conundrum's asset diet, and the two cabinets reach their walls (2026-09-14)

**Ranked rows 1 and 18, claimed on `main` before the work started (#283, PR #291) and
merged as one PR.** Row 1 named Claude Opus 5 and row 18 named Claude Sonnet 5; both
were worked under Opus 5. One area, a 1 plus a ¼, which is what the same-area column of
the size table allows for a 1 (#382). Decisions #389 to #392.

- **165 MB of assets against 1,525 lines of code is 29 MB** (#389). Three separate
  things were on disk that nothing could reach. **Thirty-six of the forty-eight Poly
  Haven folders were named by nothing** in `data/scene-config.json` or
  `data/npcs.json` at all. **Twenty of the forty-eight were texture packs whose
  `.gltf` and `.bin` are a material-preview ball** (#374) at 2.3 MB of `.bin` each —
  including the two that are used, since the ground and the gate load only the
  `textures/` beside the ball, so `stone_pavers_1k.gltf` and `wooden_gate_1k.gltf` keep
  their jpgs and lose 4.6 MB of sphere between them. **The Kenney kit shipped the same
  106 models three times**, in FBX, OBJ and GLB, and `loadModel` reads GLB.

  Nothing outside this project referenced any of it; Bell to Bell has its own copies of
  `wood_planks` and its own Kenney kit, which is locked decision #17 working as
  intended.

- **The check that holds a diet is reachability, not a denylist** (#390). `test/
  assets.mjs`'s new fourth check walks `assets/Poly Haven` and `assets/NPCs` and fails
  any file that `data/` does not name, directly or as a `buffers[].uri` or
  `images[].uri` of a `.gltf` that `data/` names. 75 files, every one asked for. Bell
  to Bell's Phase 6 did the same diet and recorded it as a `_pruned` path list its
  suite asserts stays absent — a real pattern, and the reason not to copy it is that a
  denylist only catches the thirty-six folders somebody already thought of, while a
  reachability rule catches the thirty-seventh. What the list buys and this does not is
  a record of what was there and why; git history is that record, and this entry names
  the categories.

  Two things fell out of writing it. **`data/npcs.json` had never been checked at all**:
  the King's `heldProp` is `ornate_medieval_mace_1k`, and a preview ball in a hand is
  the same #374 bug as a preview ball in an archway. Checks 1 and 2 read both data files
  now, 23 references to 27. And **the Kenney kit is vendored whole, in one format**: the
  GLB folder keeps all 106 models against the 14 the config places, because placing a
  fifteenth should be a config edit and not a re-download, while shipping the same
  models in two formats no loader can open is just weight. The assertion is on the
  format folders, not on the models.

- **A column that constrains in `z` is not a constraint in `x`** (#391).
  `GothicCabinet_01` stood 1.143 m off the hall's west wall and `GothicCommode_01`
  1.311 m off the east — out in the room rather than against it. The round-3 note called
  it a forced choice between flush-to-wall and clear-of-column, the hall columns sitting
  at world x -6..-5.2 and 5.2..6, right in the path. They are 0.8 m deep in z
  (-10..-9.2), so the choice was never forced: 0.6 m and 0.75 m south takes each piece
  out of the column's z band and the wall becomes reachable. Tiles `[-1.1,-2.2]` →
  `[-1.36,-2.05]` and `[1.1,-2.2]` → `[1.4,-2.05]`; the cabinet is 0.103 m off its wall
  and 0.140 m clear of its column, the commode 0.111 m and 0.398 m. Both keep the same
  tile z so the config reads as the mirror pair it is; their boxes do not line up,
  because the cabinet is 1.72 m deep in z and the commode 1.20 m.

  This breaks the "whole hall cluster moves as one rigid shift" rule those two rows'
  comments carry. That rule was about clearing the north wall without changing the
  table-chair-statue spacing; these two are wall furniture and were never part of that
  composition.

- **`Projects/Castle Conundrum/test/layout.mjs`, in CI** (#392). Four objects in this
  project have been found sealed inside a wall — the hall table and the gothic statue in
  round 2, then these same two cabinets — and not one of them by a check. The beat
  `play-castle.mjs` grew afterwards needs a real browser and real GPU compositing so it
  is outside CI on purpose (#353), it names four objects by hand, and it answers `clear`
  or `EMBEDDED` with no number in it. `layout.mjs` reproduces `castle-builder.js`'s
  placement math in Node and checks all nine interior props against all thirty-nine
  wall, tower and column pieces, plus the two margins above as a band of 0.02 to 0.30 m.

  **What it cannot prove, said in the file rather than left to be discovered** (#34, and
  the warning in `CLAUDE.md` about a test that re-implements the thing it checks): it
  re-implements `tileToWorld`, `normalizeToTile`, `normalizeHeight` and
  `groundAndCenter`, so if `normalizeToTile` starts scaling off X again this file scales
  off Z and agrees with itself. It catches the config drifting, which is the failure
  that has actually happened here four times. `play-castle.mjs` is still the thing that
  holds the two together, and that is why it stays hand-run.

  The glTF reader came out of `assets.mjs` into `test/gltf.mjs` to be shared, and grew
  node-hierarchy transforms on the way. The old inline copy ignored them, which was
  harmless for the two things it measured — `wall-fortified-gate.glb` and the preview
  balls are single untransformed nodes — and wrong for `GothicCabinet_01`, whose four
  doors are translated up to 1.75 m off the carcass and rotated open. An untransformed
  read understates that box by most of its height, which would have made every margin
  in #391 a different number.

**Broken on purpose, five times, from a green baseline (#34).** Both suites exit 0
before each break and after it is reverted.

1. `git checkout HEAD -- "assets/Poly Haven/wooden_barrels_01_1k.gltf"`, one of the
   thirty-six:

   ```
   FAIL  nothing references assets/Poly Haven/wooden_barrels_01_1k.gltf/textures/wooden_barrels_01_barrel01_arm_1k.jpg
   ...eight of them, then
   FAIL  ...and 3 more unreferenced files
   FAIL  11 unreferenced file(s) under assets/, 7.1 MB        suite exit 1
   ```

2. The King's `heldProp` pointed at `stone_pavers_1k.gltf/stone_pavers_1k.gltf`, with
   that ball restored from git so the failure is about its shape and not its absence.
   The first attempt, without restoring it, failed on `no such file` instead — the right
   answer for the wrong reason, and not a test of the assertion under test:

   ```
   FAIL  guard's heldProp: assets/Poly Haven/stone_pavers_1k.gltf/stone_pavers_1k.gltf is a Poly Haven material-preview ball, not a model
   ```

   That is the assertion that did not exist before, firing on the file that was not
   being read before.

3. The cabinet tile put back to `[-1.1,-2.2]`:

   ```
   FAIL  GothicCabinet_01 stands 1.143 m off the hall wall at x -6, over the 0.3 m this room reads as "against the wall"
   ```

   The other three margin assertions stayed green, which is the right ones failing: the
   old position was never *inside* anything, it was just far away.

4. The cabinet moved to `[-1.45,-2.2]`, into the wall and the column at once. Three
   different assertions, each naming a different thing, which is what says they are
   three checks and not one restated:

   ```
   FAIL  GothicCabinet_01 at x -6.26..-5.14, z -9.66..-7.94 is inside interior hall west wall
   FAIL  GothicCabinet_01 stands -0.257 m from the hall wall at x -6 — its back is in the stone
   FAIL  GothicCabinet_01 is 0.460 m into column.glb, which shares its x band
   3 failure(s)        suite exit 1
   ```

5. `Models/OBJ format/` recreated with one file in it:

   ```
   FAIL  assets/kenney_retro-fantasy-kit/Models holds GLB format, OBJ format — loadModel reads GLB and nothing else, so the rest is dead weight
   ```

**Suites.** `node test/assets.mjs` — 27 model references, 75 asset files, the gate fit,
0 failed. `node test/layout.mjs` — 9 props against 39 stone pieces, 4 margin assertions,
0 failed. `cd Tools/board-check && npm run check` — **1822 units checked, 0 broken**, 0
collisions, tightest vertical gap 3.5 px; 1818 → 1822 is the two new `.mjs` files, which
that sweep reads twice each, once to parse and once for offsite hosts.
`npm run social:check` — 23 notices, 21 already current, 0 out of date. `node
ci-check.mjs` — every failure is a known one and every known one still fails;
`known-failures.json` untouched and still empty in all three sections. `npm run play` is
this project's other half and needs real GPU compositing (#53, #353), so it was not run.

## Castle Conundrum's quest is a graph (2026-09-14)

**Ranked row 1, claimed on `main` before the work started (#283, PR #293) and merged as
PR #294.** The row named Claude Fable 5.1 and was worked under Fable 5.1. A 1 in one area
with no ¼ rows left beside it, so a batch of one under the size table (#382). Decisions
#393 to #395.

- **The quest is data, validated before it runs, and the manager holds no state** (#393).
  `data/quest.json` is three stages (`seek-keystone`, `present-keystone`, `gate-open`),
  each carrying the objective the tracker shows, the dialogue state every NPC switches to
  on entry, the transitions out (`talked:<npcId>`, `riddle:solved`) and the actions on
  entry. `src/quest-graph.js` reads it: a `dispatch(event)` that returns effects and never
  throws, and a `validateQuest` that refuses a `to` naming no stage, an action the manager
  does not implement, a stage the start cannot reach, a stage that cannot reach a
  terminal, two stages sharing an objective, and two transitions on one event. The old
  manager was two booleans and an if/else that knew `scholar` and `guard` by name; the
  new one lists the three actions the data may name (`QuestManager.actions`) and runs
  them, and `main.js` exposes it as `window.__quest`. The reason validation runs at
  construction rather than at the first bad dispatch: a graph that is wrong should fail
  on the loading screen, not on the walk to the Guard, which is the one place nothing in
  CI can see. `_wrongCount` is the manager's only own field, and it is riddle state, not
  quest state.

- **The graph is held to the cast, both ways** (#394). `validateAgainstNpcs` fails a
  stage whose `dialogueState` is missing from any NPC in `npcs.json` — the failure it
  replaces was `getDialogueLines()` returning `undefined` and the dialogue box opening on
  it, which no assertion and no console error had ever reported — and it fails a
  `{TOKEN}` in a line that `quest.tokens` does not define. The riddle is the coupling
  that mattered: the old code opened it whenever the Scholar's lines contained
  `{RIDDLE}` and the keystone was not yet held, so the token was the trigger. Now the
  token is only text, the `openRiddle` action on `talked:scholar` is the trigger, and the
  check is that the two agree exactly — every (npc, state) whose lines pose the token is
  one some stage in that state opens the riddle after, and no other. Breaking either
  side alone fails: the Scholar losing his last line, or the Guard gaining one.

- **`test/quest.mjs` drives the real manager, not a re-implementation of it** (#395,
  and #34). The suite constructs `QuestManager` against stand-in UI, NPCs and castle
  with `schedule` and `restart` injected, and plays it: the Guard refused first, two wrong
  answers and a hint, the right one, the Scholar again with no second riddle, the Guard,
  the gate once, the victory screen scheduled 2600 ms out and shown only when the timer
  fires, and the button calling the restart. 61 assertions in about 40 ms, in the CI
  matrix beside `assets.mjs` and `layout.mjs`. Six breaks from green, each caught by the
  assertion that claims it: the Wizard's `hasKeystone` renamed (`npc wizard has no
  dialogue.hasKeystone lines`), a `to` naming no stage (the validator, then parts 3 to 5
  skipped with a summary line), the manager no longer applying `dialogueState` (`every
  npc switched to hasKeystone` and three more), the victory delay dropped (`scheduled
  2600 ms out, not shown yet — []`), the riddle reopened on every Scholar conversation
  (`talking to him again does not reopen the riddle`, with the ordered log showing
  `riddle:open` three extra times), and `index.html`'s initial objective edited. The
  fourth break first died on a TypeError after the right failure had printed; a missing
  timer is a failure now and the suite finishes its summary. What the suite cannot see
  is `ui.js` — the DOM half of `openDialogue`, `openRiddle`, `showVictory` — and the
  walk. `play-castle.mjs` is still that, and it gained one beat: at the gate it reads
  `window.__quest.victory` and asserts the graph is terminal. It was not run here; it
  needs real GPU compositing (#53, #353).

  Two things the suite holds for the browser beat, since that beat is not in CI: the
  keystone objective still matches `/Keystone/` and the terminal one `/gate is open/i`,
  which `play-castle.mjs` reads by regex. And `index.html`'s hard-coded initial objective
  has to equal the start stage's, or the tracker would flash one line and then another.

- **Still no save**, and the decided things stay decided: walls stylised, no save. If a
  save ever comes, the stage id is the thing to write; there is no key to preserve, so
  #36 does not bind.

Suites, all from the directories that own them: `node test/quest.mjs`, `node
test/assets.mjs`, `node test/layout.mjs` green. `cd Tools/board-check && node ci-check.mjs`
green — 0 collisions, 23 social notices with 21 current and 0 out of date;
`known-failures.json` untouched and still empty in all three sections.

## Castle Conundrum v2 is planned (2026-09-14)

**A plan, not a batch** (#382): `Projects/Castle Conundrum/WISHLIST.md` is new, seven
phases go into `BACKLOG.md` at ranks 1 to 7, the Castle Conundrum section in Tier 2 is
rewritten, and six questions join the table as Q53 to Q58. No code, no asset, no claim.
Worked under Claude Fable 5.1 from Devon's planning prompt of the same day. Decisions #411
to #418.

- **The walls stop being stylised** (#411). Round 1 decided to leave the Kenney kit's pixel
  art on the kit's own walls, with five 1k stone sets on disk unused, on before/after pairs.
  Devon's 2026-09-14 choice of eight texture sets against a 44.4 MB ceiling reverses that,
  and the plan says how the stone goes on: built geometry (`BoxGeometry` runs and
  `CylinderGeometry` drums through `loadPBRMaterial`, the way the gate leaf already is)
  carries the maps, and the kit supplies what has a shape the maps do not (stairs,
  battlements, railings, door frames, props). The kit has no drum; every tower piece is
  square, measured piece by piece, so Conwy's round towers are cylinders.

- **The order is Devon's at the level of arcs, with two moves inside it** (#412). Mystery,
  castle, NPCs stands. Inside it: the mystery ships first as data with a validator and the
  save, the way Corner & Kettle's Phase 1 shipped the sim without the page, because a clue
  sits in a room and is told by an NPC at a station, and neither exists until Phases 3 to 6;
  and the builder is refactored to emit the structure the suite reads (Phase 2) before the
  castle grows a `y`, because `test/layout.mjs` re-implements the builder's placement math
  and cannot see it change, which is #34's failure mode by name. The castle is three
  phases (shell, ground rooms, upper level) rather than one, sized so each is a 1: the
  prompt said a 2+ phase has to be split or argued, and the split falls where the texture
  sets do, three per phase.

- **The save** (#413). Key `castleConundrumSave_v1`, `game: "castle-conundrum"`, version 1,
  through `assets/js/gvb-save.js` by relative import. There was no key before, so #36 did
  not bind on the choice and binds from the moment it ships. The schema is written in full
  in Phase 1 so no later phase adds a field: `stage`, `watch`, `clues[]`, `pressed{}`,
  `taken[]`, `locks[]`, `accusations[]`, `refusals`, `riddleWrong`, `player`. `repair`
  builds its catalog from `mystery.json` and `quest.json` rather than a list beside them
  (Corner & Kettle's habit, #37's rule), drops unknown ids, resets an unknown stage to
  `start`, clamps the watch, nulls a non-finite player. Phase 1 puts the slot on the
  current riddle quest, so the save is live before any content depends on it.

- **The mystery is a death made to look like a fall, and the player can be wrong** (#414).
  Paradise Killer's shape with Ace Attorney's present-a-clue verb and Golden Idol's true
  account after the verdict. The Constable accepts any accusation backed by two clues from
  that person's `implicates` list and hangs them; accepts the prisoner on nothing, because
  that is the sheet he wants; refuses fewer than two, and three refusals end the day as a
  fall. Eleven wrong accusations are reachable and two are easy. The crime, the twelve, who
  lies about what, the thirty-eight clues, the accusation data and the intended path are
  written in the wishlist so a later session executes rather than invents. Q54 asks Devon
  whether a killing is what he wants on the site; the plan proceeds on yes.

- **Four watches, and the fourth bell forces the accusation** (#415). The player rings the
  chapel bell to advance the day; NPCs move to their next station and time-gated evidence
  appears or vanishes; the fourth ring is the Constable's demand. The validator holds the
  shortest convicting path to no fewer than two watches and no more than three, which is
  the one number in the plan that makes "denser" a check rather than an adjective. Q55.

- **The riddle survives as the word-lock on the muniment room** (#416). `judgeAnswer`, the
  overlay, the hint and the escalating wrong answers are all kept; the riddle's text becomes
  one a 1280s clerk could have set (a river), and `validateAgainstNpcs`'s poser-and-opener
  check is generalised in Phase 7 to any token and action pair so the accusation and the
  bell reuse it. Q56.

- **Twelve NPCs from three bodies, by tint** (#417). A per-NPC `tint` in `npcs.json`
  multiplies the body's material; nothing keys off an id, `assets.mjs` checks bodies not
  ids, and the weight is zero. A fourth model is 1.4 to 2.0 MB over the ceiling and is Q53,
  the question the plan names as the one it would bet the project fails on.

- **The seven phases are ranks 1 to 7** (#418). Inserted at the top of the ranked table
  with every other row's relative order unchanged and the header, parked list and rank
  references renumbered by seven. Inserting a block is ranking what the session added, not
  re-ranking what it did not; if Devon wants them lower it is one edit (Q58).

**What was measured rather than taken from the prompt.** The eight sets sum to 15.4 MB by
`git ls-tree` at `a5c241c^`; the project's tracked bytes on `main` are 27.3 MB where the
prompt and the diet entry say 29, so the plan carries both bases and keeps Devon's 44.4 MB
as the ceiling. Every Kenney GLB was measured (`stairs-stone.glb` is 2 x 4 x 4 m at 4x, a
storey in one tile at 45 degrees; `floor.glb` is 0.2 m thick; `tower.glb` is square).
Conwy's and Stirling's facts are from memory and say so in the wishlist: this session's
proxy blocks the reference sites, and no geometry in the plan depends on a measurement
from either castle.

**Not verified here, on purpose.** No suite ran against a code change because there is no
code change; `node test/assets.mjs`, `layout.mjs` and `quest.mjs` are green on `main` and
this PR touches three markdown files. `npm run play` was not run and could not be (#53).

## Devon answers Q53 and Q58 (2026-09-14)

**Two questions closed before Phase 1 starts**, and a count in `CLAUDE.md` that had gone
stale by eight. No code, no asset, no phase moves, no claim. Decisions #419 and #420.

- **Twelve NPCs stay three bodies and a tint, and Phase 1 writes the tint** (#419, answering
  Q53). Devon, asked before Phase 1 rather than before Phase 6: stick with tinting for now,
  add real models later if they are needed. **The bet is accepted, not removed.** The plan's
  own risk list calls three bodies with tints a bet that colour is enough and says nothing in
  Node can tell; that stands. The first time anyone will know is the Vespers photograph in
  Phase 6, which is a GPU beat and Devon's to run (#53). The escape hatch is unchanged and
  costs a new ceiling rather than a decision: a fourth body is 1.4 to 2.0 MB over 44.4 MB,
  and 44.4 is Devon's number to move, not a session's.

  **The scheduling changes, and that is the part that touches Phase 1.** `tint` was Phase 6's
  to add (#417), but Phase 1 already replaces the three NPCs with twelve in the same file,
  because `assets.mjs` checks bodies rather than ids. Writing a hex per NPC while that file is
  open costs nothing and saves a second pass over all twelve entries five phases later. Phase
  6 keeps the bodies, `hideNodes` and `hideMaterials`; it no longer adds the field. Reversible
  in one line: drop `tint` from Phase 1's `npcs.json` bullet and put it back in Phase 6's.

- **The seven phases stay at ranks 1 to 7** (#420, answering Q58). Devon confirmed the
  insertion the plan made (#418): the phases sit at the top with every other row's relative
  order unchanged, which is what refocusing the repo on this project means. Nothing below them
  is reordered. The consequence is stated so it is not rediscovered as a surprise: **no other
  project is worked until the arc finishes**, because ranks 1 to 7 are all Castle Conundrum
  and a batch takes the next ranked rows. Reversible in one edit, and no phase changes if it
  is made.

**What was measured rather than asserted.** `CLAUDE.md` read "all 410 locked decisions" while
`HISTORY.md` ran to #418, so the line was eight behind before these two; it reads 420 now.
The four suites under `Projects/Castle Conundrum/` are green on `main` and this PR touches
four markdown files, so none of them could go red; `npm run play` was not run and could not
be (#53).

## Castle Conundrum v2, Phase 1: the mystery as data, and the save (2026-09-14)

**Rank 1, a 1 in one area, alone under the size table** (PR #306). The row named Claude
Fable 5.1 and was worked under Fable 5.1. `data/mystery.json` is new and carries the whole
mystery; `src/mystery.js` validates it and runs it in Node; `src/save.js` is the slot;
`test/mystery.mjs` and `test/save.mjs` are new and in the CI matrix. Nothing restored, the
project stays at 29 MB, and the page plays the same riddle quest it played the day before,
now with a save. Decisions #421 to #425.

- **`npcs.json` keeps the three under `npcs` and adds the twelve under `cast`** (#421). The
  plan said the twelve replace the three because `assets.mjs` checks bodies, not ids. What
  that missed: the page plays the riddle quest on `talked:scholar` and `talked:guard` until
  Phase 7 retires it, Phase 3's entry moves the three to stations that exist, Phase 6's says
  "the Guard, Scholar and Wizard are gone", and `play-castle.mjs` walks to `SCHOLAR` and
  `GUARD` by name across 34 beats nothing here can run (#53). Replacing them in Phase 1 would
  have contradicted two later phases and broken the one hand-run suite blind. So `npcs` is
  what the page spawns and the riddle quest validates against, `cast` is what the mystery
  validates against, and Phase 6 deletes `npcs`. Each of the twelve names one of the three
  bodies and a `tint` (#419); the twelve tints are distinct and `test/mystery.mjs` says so.

- **`quest.json` keeps the riddle quest at the top level and carries the frame under
  `frame`** (#422). Same reason: the save has to resume the quest the page plays, so its
  stage catalog has to hold `seek-keystone`, `present-keystone` and `gate-open`, and
  `validateQuest` wants one `start` with everything reachable from it. `frame` is a whole
  graph definition of its own (`arrive`, `investigate`, `accusing`, four terminals), validated
  by the same `validateQuest` with the manager's grown action list and by `validateAgainstNpcs`
  against the cast, and driven in `test/mystery.mjs` by the engine's events. `buildCatalog`
  takes the union of both graphs' stages. Phase 7 promotes `frame` to the top level and
  deletes the riddle stages; the catalog shrinks with it and old saves at a riddle stage
  reset to `start` through `repair`, which is the right thing for a game that has changed.

- **The Constable hears no accusation at Prime** (#423, `accusation.from: "terce"`). The
  plan's rail says the shortest convicting path takes at least two watches "so it is neither
  solvable at Prime nor lost by Vespers", and its exit line says that path prints at 3 watches
  and 22 interactions. The validator, run on the clue graph exactly as the plan wrote it,
  said `the shortest convicting path is 1 watch (wax-matches, tally-on-walk, lead-sold)`: the
  cloak is in the laundry at Prime, the candle and the tally stick are on their stair and
  walk all day, the word-lock and the ledger are open all day, and the apprentice is in the
  lodge at Prime. The Clerk hangs before the first bell. That is the plan being wrong about
  its own data, caught by the rail written to catch it, and it is the reason this phase went
  to Fable. The fix is one field: at Prime the Constable stands over the body and sends the
  clerk away (`accusation.early`, not a refusal). The shortest full-ending path is now
  **2 watches and 8 interactions** (talk sentry, examine tally, examine lock, answer the
  riddle, examine ledger, talk apprentice, one ring, one accusation), and the right-hanging
  path is 2 watches and 4. The plan's 22 was an estimate of the intended path, not the
  shortest one; the number that matters is the rail, and it holds. Reversible in one field,
  and the rail fires the moment it is.

- **Thirty-nine clues, and how a clue is on a path** (#424). The plan's table lists 39 rows
  and calls them 38; the suite asserts 39, 36 on a path and 3 herrings. Three fields the
  plan's schema did not name were needed to make the "leads nowhere" rail decidable: a press
  carries `from` (a list of states it leaves from, so the Clerk can be cornered from either
  `default` or `cloak`), a clue may `contradicts` earlier statements (the lie it gives away),
  and evidence may sit behind a `lock` (the ledger, behind `muniment`, opened by
  `riddle:solved`). A clue counts as on a path if it convicts someone, contradicts something,
  is a default-state statement, is a herring, or is an ancestor of one that is, through
  premises, press keys and `requires`. Under that rule every one of the 36 leads somewhere
  and dropping `herring` from `knife-found` fails with the message the plan wrote.

- **The engine's API, and two behaviours the plan left open** (#425). `createMystery` returns
  the plan's nine calls plus `talk(npc)` (a conversation ended: its statements land),
  `unlock(lock)`, `holds(clue)`, `npcState(npc)` and a `state` getter, because the manager
  and the suite both needed them and the save is that state object mutated in place. Two
  calls: `accuse` emits `ask:accuse` before its verdict so the frame moves to `accusing`
  before it moves to a terminal (the first draft went straight to the verdict and the frame
  ignored it; the suite caught it on "the frame ends in `full`"); and the fourth ring keeps
  `watch` at Vespers and emits `demand` plus `bell:4`, so the save's clamp to the four (#413)
  loses nothing on a reload after the demand.

**Guard-rails broken on purpose** (#34), each applied to the file on disk from a green
baseline, not to a clone inside the suite, and restored after:

| Break | Fired | Said |
| --- | --- | --- |
| `lady-hand`'s source deleted | `validateMystery finds nothing wrong` | `summons-is-stewards: premise lady-hand is discoverable from nothing` |
| the `steward-admits` press deleted | same | `chaplain-feet: its press is on a clue that cannot be held (steward-admits)` |
| `sentry-sighting` at Prime only | same | `sentry-sighting: available at prime, when the sentry cannot be spoken to about it` |
| `knife-found`'s `herring` dropped | same, and the count line | `knife-found: on no path to any accusation` |
| `accusation.from` set to `prime` | same, and the shortest-path line | `the shortest convicting path is 1 watch (wax-matches, tally-on-walk, lead-sold); it must take at least two` |
| `repairState`: stage reset removed | `a stage the graph lacks resets to start` | `the-attic` |
| player nulling removed | four `player ... is nulled` lines | and `NaN reaches disk as null` |
| watch clamp removed | `watch clamps to 0..3` | |
| unknown-clue filter removed | `unknown and duplicate clues are dropped` | and `an unversioned save loads through repair` |
| refusals clamp removed | `refusals: a non-negative integer or 0` | and `the third refusal is the fall` |

Every break exited 1 and was caught by the assertion whose comment claims it; the first
four are the ones Phase 1's entry names, with its messages verbatim.

**What was measured.** `mystery.json` 159 lines, `mystery.js` 599, `save.js` 104,
`test/mystery.mjs` 343, `test/save.mjs` 200. First-held counts: 35 clues at Prime, 4 at
Terce, none later. `npm run check`, `npm run social:check` and `node ci-check.mjs` green
from `Tools/board-check` after `npm ci --ignore-scripts` (the checkout had no
`node_modules`; `check-collisions.mjs` crashed on `puppeteer-core` on the untouched tree
too, and ran clean once installed). `npm run play` was not run and could not be (#53);
its new reload beat and the key-clearing at start are written blind and are the first thing
the next GPU run should look at. CI's first run went red on `assets/js/gvb-save.test.mjs`:
every importer of the shared save library has to be a named adopter, so `src/save.js` is
now in its map, in the module's "Adopted by" header and in the README's "Who uses it"
table, the fourteenth adopter and a shared-file edit this PR carries.

**Next:** rank 1 is now Phase 2, the plan the builder and the suite both read, a 1 on Claude
Opus 5.

## Castle Conundrum v2, Phase 2: the plan the builder and the suite both read (2026-09-14)

**Rank 1, a 1 in one area, alone under the size table** (PR #309). The row named Claude
Opus 5 and was worked under Opus 5. `src/castle-plan.js` is new and is the only place a
transform or a collider box is computed; `castle-builder.js` drops from 312 lines to 234
and applies what the plan hands it; `test/layout.mjs` is rewritten off the plan;
`test/plan-vs-scene.mjs` is new and in the CI matrix. Nothing restored, the project stays
at 29 MB, and the page plays exactly what it played the day before. Decisions #426 to #431.

**The row was Phase 2, not Phase 1.** The session was started on a prompt naming Phase 1
and rank 1; Phase 1 had merged an hour earlier (PR #306, then #307), so rank 1 in
`BACKLOG.md` was Phase 2. The prompt's "do not work ahead into Phase 2" was written to keep
one session from taking two phases, not to stop the next session taking the next phase, and
"work rank 1" is the instruction the repo runs on. Phase 2 was taken, in order, alone.

- **`boundsOf(modelPath)` returns `{parts}`, not a `Box3`** (#426). The plan for this phase
  wrote the injected measurement as "three's `Box3` of the loaded model at runtime". It
  cannot be. `Box3.setFromObject` never looks at a vertex: it takes the eight corners of
  each MESH's own `geometry.boundingBox`, transforms them by that mesh's `matrixWorld`, and
  unions the results — and GLTFLoader builds one mesh per glTF primitive. A placed model's
  runtime box is therefore not a function of its whole-model box, and a plan built on one
  box cannot reproduce the castle the browser builds. The measurement, taken by collapsing
  `parts` to one box and re-running `plan-vs-scene.mjs` against the live page:
  brass_candleholders **0.129 m** out, GothicCabinet_01 **0.113 m**, against that file's
  0.01 m tolerance. The cabinet is the one to remember, because it is placed at 90 degrees
  where rotating corners is exact and it is still wrong by eleven tolerances: its four doors
  are separate nodes translated up to 1.75 m off the carcass and rotated open, and three
  boxes each of those separately. With `parts`, all 59 pieces sit at **0.0000 m**.
  `test/gltf.mjs` grew `partsOf` for the Node half and lost a dead `boundsOf` that returned
  a different shape under the same name.

- **The gatehouse was open, and the first run of `sealed()` found it** (#427). `gate-arch`
  carried `noCollide: true` and the comment "a doorway is meant to have a hole in it". The
  piece is 4 m wide and the doorway in it is 1.9 m, so the exemption was not the doorway —
  it was the whole piece, leaving **two 1.05 m strips of walk-through stone** flanking a
  shut gate, each wider than the 0.9 m player. This was shipped, live, and invisible to
  every check the project had: `layout.mjs` measured props against walls and never asked
  whether the castle was closed, and `play-castle.mjs` ends at the victory screen without
  walking through the archway. `archColliders` gives the piece two jambs and a lintel,
  sized from `gateDoor.leaf`, which `test/assets.mjs` already holds to the model's measured
  opening to 0.11 m. `noCollide` now means one thing on every piece: the first version kept
  the archway's special case ahead of the flag, which made re-adding `noCollide: true` to
  `gate-arch` a silent no-op — a config flag that reads as "open the gatehouse back up" and
  did nothing at all. What stops it being re-added is `sealed()`, not a special case.

- **A collider blocks a whole cell, not the point at its centre** (#428). The first run of
  the walkability grid reported 76,494 reachable cells and `sealed() === false`: it had
  flooded the entire 140 m ground plane straight through the shut gate. The leaf is 0.16 m
  thick and the grid is 0.5 m, so no cell centre lands inside it — a centre test steps over
  any wall thinner than the grid, which in a castle about to grow doors, screens and
  balustrades is most of what a wall can be. Testing the cell's whole square against the
  collider is also the truer model of what it is asking, because the player is 0.9 m across,
  wider than a cell: a cell with stone in any corner is not somewhere to stand. Reachable
  cells went 76,494 to 1,189 and the run from 277 ms to 14 ms.

- **The leak message names where the fill crossed, and it has to be recorded during the
  fill** (#429). A breach floods 75,228 cells, so picking "the leak" out of the finished set
  afterwards picks one of seventy-five thousand cells that has nothing to do with the hole:
  sorted by distance from the origin it named (-14.25, 0.25) for a hole at (0, -14). It also
  said "9999 reachable cells outside the curtain", which was not a count but the limit the
  message had asked for. A cell first reached FROM a cell inside the curtain is the hole and
  nothing else is, so `walkability` records those as it goes. The same break now reads *the
  fill stepped through at (-1.75, -14.25), (0.25, -14.25)* — the missing piece's own span.

- **Removing the END piece of the north run runs green, and that is the right answer**
  (#430). The phase's plan says the break is "remove one `wall.glb` from the north run".
  Taken literally — `count: 7` to `6` — the suite stayed green at exactly 1,189 cells, which
  is a finding under #34 and not a formality. The dropped piece is the tile-3 one, and the
  hole it leaves at x 10..14, z -14..-10 is walled off from the interior by the east wall's
  own northern end; the flood fill is 4-connected, so it touches that hole only at a corner
  point and never enters it. Nothing reachable is outside the curtain, so the castle really
  is still sealed. The break that bites is the MIDDLE piece: 75,228 cells outside, crossing
  at (-1.75, -14.25). **A break that runs green is a claim about the castle, not a broken
  check** — but you only get to say that after working out why.

- **`plan-vs-scene.mjs` is in the CI matrix** (#431), not hand-run. #53 is about real-time
  movement and physics being inconclusive under a software rasteriser; this file takes no
  pointer lock, moves nothing and times nothing. It waits for `CastleBuilder.build()` to
  resolve, reads every object the builder tagged with a `planId`, and diffs static boxes.
  Three runs, three passes, 6 s each. Its matrix entry carries `install: Tools/board-check`
  because it borrows `harness.mjs`. It clears the save from a cheap page on the same origin
  rather than loading the game and reloading it: the reload aborts the model requests the
  first load has in flight, `page.__errs` outlives the navigation, and the run then ends by
  reporting a missing `wall.glb` that had loaded fine.

**Guard-rails broken on purpose** (#34), each applied to the file on disk from a green
baseline and restored after:

| Break | Fired | Said |
| --- | --- | --- |
| wall scaling from width, not depth | `interior props against the stone around them`, 7 lines, and the NPC line | `WoodenTable_01 at x -0.90..0.90, z -8.33..-7.67 is inside interior hall south wall`; `scholar stands at (1.5, -8) ... which the player cannot reach` |
| the END `wall.glb` of the north run removed | **nothing — green at 1,189 cells** | see #430: the hole is unreachable and the castle is still sealed |
| the MIDDLE `wall.glb` of the north run removed | `the curtain` | `the castle leaks: 75228 reachable cells outside the curtain ... The fill stepped through at (-1.75, -14.25), (0.25, -14.25)` |
| the hall doorway walled up | `great-hall ... cannot be reached` | `0 standable cells in x -6..6, z -10..-6` |
| the wizard moved into the west curtain | `where the NPCs stand` | `wizard stands at (-12, 0) on level 0, which the player cannot reach — in stone, outside the curtain, or shut in` |
| `noCollide: true` back on `gate-arch` | first **nothing** (the flag was ignored, #427), then `the curtain` | `the fill stepped through at (-1.25, 14.25), (0.25, 14.25)` |
| the builder ignores the plan's `rotationY` | `plan-vs-scene.mjs`, 9 pieces | `"wall-half-31" (wall) is 2.000 m off the plan` |
| the builder skips a piece the plan names | same | `the plan places "gate-door" (gate-leaf) and the scene has no such object` |
| `boundsOf` collapsed to one whole-model box | same | `"brass_candleholders" (prop) is 0.129 m off the plan`; `"GothicCabinet_01" (prop) is 0.113 m` |

Two of the nine ran green first time, and both were worth the hour: one was a wrong break
(#430) and one was a real hole in the code (#427).

**What was measured.** `castle-plan.js` 527 lines, `castle-builder.js` 312 to 234,
`layout.mjs` 156 to 169, `plan-vs-scene.mjs` 134. The walkability grid: 0.5 m, 1,189
reachable cells, 139 in the great hall and 948 in the courtyard, 14 ms. 59 pieces, 56
colliders, 7 surfaces, all 59 within 0.0000 m of the live scene. `layout.mjs`'s two
pre-existing numbers are unchanged across the rewrite — the cabinet still stands 0.103 m off
its wall and clears its column by 0.140 m — so the plan reproduces what the file it replaced
computed. All six Castle Conundrum suites green, plus `npm run check`, `npm run social:check`
and `node ci-check.mjs` from `Tools/board-check`. `npm run play` was not run and could not be
(#53); no beat of it walks through the archway, so the new jambs reach nothing it asserts.

**Next:** rank 1 is now Phase 3, the shell: two wards, eight drums, a cross-wall, a 1 on
Claude Opus 5. It is the first phase that restores an asset (castle_wall_slates, defense_wall
and grassy_cobblestone, 29.0 MB to 35.2).

## Castle Conundrum v2, Phase 3: the shell, two wards, eight drums, the cross-wall (2026-09-14)

**Rank 1, a 1 in one area, alone under the size table** (PR #312). The row named Claude
Opus 5 and was worked under Opus 5. The 7x7 courtyard and its hall are gone; the castle is
`WISHLIST.md`'s Conwy map, tile for tile — 80 m by 40 inside a curtain, two wards divided by
a cross-wall with one gate through it, eight drum towers, a barbican at each end. 219 pieces
against the old 59. 29.0 MB to 35, three texture sets restored. Decisions #432 to #438.

**The row was Phase 3, not Phase 1, for the second time running.** The session was started on
a prompt naming Phase 1 and rank 1, and carrying Phase 1's riders: ships no asset, stays at
29 MB, "if you find yourself reaching for a Poly Haven set you have drifted into Phase 3".
Phase 1 had shipped (#421 to #425) and Phase 2 had shipped an hour earlier (PR #309, #426 to
#431), so rank 1 was Phase 3 — whose own spec restores three sets and goes to 35.2 MB. Phase
2's session resolved the identical collision the identical way and wrote it down; this is the
second instance, which makes it a pattern rather than an accident. **"Work rank 1" is the
instruction; the phase named beside it is a snapshot that goes stale the moment a PR merges.**
The riders belong to the phase, not to the session.

- **A run IS its box, and that is why the curtain stopped being kit pieces** (#432). `walls`
  is eighteen runs of `{from, to, thickness, height, material}` in tile coordinates, spanning
  their end tiles whole so a run written `from [-8,-4] to [-6,-4]` covers the three `##` tiles
  the map draws; `drums` is eight solid cylinders. Both are computed in `src/castle-plan.js`
  and emitted as `BoxGeometry` and `CylinderGeometry` by the builder. The point is not the
  look, it is that built geometry is the one thing the plan can describe *exactly*: the plan's
  box and the geometry are the same eight numbers rather than two measurements that have to
  agree. The drum is the case that proves it — the builder's `CylinderGeometry(r, r, h, 24)`
  and the plan's collider sectors are boxes over the **same twenty-four vertices**, not two
  roundings of one circle. `plan-vs-scene.mjs`: all 219 pieces within **0.0000 m**.
- **The eight tower interiors are not rooms until Phase 4, and the drum is not what stops
  them** (#433). Phase 3's plan says to put every ground room in the table into `rooms`,
  "reachable because nothing encloses them yet". Six of the fourteen are. The other eight are
  tower interiors, and a hollow drum with a doorway in its ring does not produce one you can
  walk into: the curtain is a whole tile thick, so at a corner the two runs meeting there
  overlap in **neither axis** — the west run at x -38..-34 and the north run at z -18..-14
  touch at the single point (-34, -14). The ward is the quadrant south-east of it, the drum
  the quadrant north-west, and the two meet at a pinch of exactly zero width. No radius up to
  the map's 4 m opens it; six of the eight towers are built that way. What opens it is a
  doorway cut *through* the adjacent run, which is Phase 4's own bullet ("doorways as gaps the
  plan's walkability sees, and door frames from `wall-door.glb` where a doorway needs a
  lintel") and Phase 4's own exit ("fourteen rooms reachable"). So the drums are solid here
  and the eight rooms are Phase 4's. **A room listed in `rooms` that nothing can reach is not
  a placeholder, it is a failing check**, and widening the check to accept it would have been
  the wrong half to move.
- **The texture repeat is world-space and lives in the geometry's UVs, not in
  `texture.repeat`** (#434). One repeat per 3 m, so a 4 m tile shows 1.33 repeats of the 1k
  map and a 20 m run shows 6.67. It cannot be done on the texture: the material is shared by
  every piece naming the same stone, and a shared texture has one repeat for all of them — a
  4 m barbican wall and a 20 m curtain run would show the same single smear. Each geometry's
  UVs are multiplied by its own metres instead, per face for a box and per group for a
  cylinder, so the side reads circumference and height and the cap reads diameter.
- **Three gates, and `archColliders` takes the gate's rotation instead of reading it off the
  box** (#435). The west gate stands open and never animates (the clerk was admitted through
  it and the spawn is behind it in the barbican; the barbican's west face carries no archway
  at all, which is `WISHLIST.md`'s answered question 5 honoured by having nothing to open);
  the east gate is shut until the riddle quest's `openGate` swings it onto the walled garden,
  which keeps that quest playable and inside the curtain until Phase 4 repoints the riddle at
  the muniment lock; the porter's gate is open all day. The collider fix is the one that
  mattered: `across` was `(box.max.x - box.min.x) >= (box.max.z - box.min.z)`, and the archway
  is a 4 x 4 x 4 m cube at **every** rotation, so that comparison is `4 >= 4` and true for all
  three — including the three this phase turns 90 degrees into north-south walls. It would
  have laid their jambs across the passage and left the doorway's real sides open. That is
  #426's bug with the opposite sign, and it was found by reasoning about the expression, not
  by a check: nothing in the suite distinguishes a jamb from a lintel.
- **Two grounds, and the base is derived from the curtain rather than written down** (#436).
  "The 140 m ground plane shrinks to the curtain's footprint plus 2 m." The footprint is a
  number only the plan knows, so the ground is one of the plan's pieces now and
  `scene-setup.js` no longer builds it — which also puts it inside `plan-vs-scene.mjs`, where
  the old plane never was. The outer ward's grassy cobbles are a patch on the base at the same
  y; walkability's own cell dedupe (within 1e-6 m) reads two coplanar surfaces as one floor,
  so the patch costs no second storey. The patch carries polygon offset as **insurance, not a
  fix**: it wins the depth test unaided on the software rasterizer CI runs on, and "wins on
  the machine I measured" is not a property of coplanar geometry (#53). Raising it a
  centimetre would have fixed the draw everywhere and put a second floor over the whole outer
  ward.
- **`arm` and `rough` are different images and a material declares exactly one** (#437). The
  two packs already here (stone_pavers, wooden_gate) ship `arm_1k.jpg`: AO in red, roughness
  in green, metalness in blue, and `loadPBRMaterial` sets `metalness = 1` to let the map drive
  it. The three restored here ship `rough_1k.jpg`: roughness alone. Feeding a `rough` map to
  the `arm` slot renders 8 m of castle wall as sheet metal; feeding it to nothing leaves the
  wall matte plastic and nothing says so. Both slots exist now and `test/assets.mjs` fails a
  material declaring both or neither.
- **The hemisphere fill goes 0.55 to 2.0, because the stone changed** (#438). The sun sits at
  (30, 45, 18), so every wall face pointing -x or -z has `n.l <= 0` and gets **no direct light
  at all** — the west face of the cross-wall, the north face of every run, the inside of the
  west curtain the player spawns looking at. That was survivable while the walls were the
  Kenney kit's 64 px pixel art, which is bright and flat. Under ACES tone mapping with
  photographic dark slate it was black. Measured off the live canvas at one spot on the
  shadowed cross-wall: **0.55 → mean luma 6 of 255, 1.1 → 14, 2.0 → 27, 3.5 → 44**. Worth
  recording that the first read of this was wrong: two screenshots at 0.55 and 1.1 looked
  identical and the fill was nearly written off as the wrong lever. It was not; the base was
  just so low that a doubling was invisible in a thumbnail. **Measure the pixel, do not judge
  the thumbnail.**

**The guard-rails, each broken once from a green baseline** (#34). Five breaks, five
non-zero exits, each caught by the assertion whose comment claims it:

| break | assertion that fired | what it said |
| --- | --- | --- |
| `cross-wall-north` deleted | the new ward check | `inner ward reachable at level 0 with the porter's gate closed: kings-hall (624 cells), stewards-chamber (248 cells). The cross-wall has a second way through it` |
| `north-curtain-mid` deleted — the MIDDLE run, per #430 | `the curtain` | `the castle leaks: 1984 reachable cells outside the curtain ... The fill stepped through at (-15.75, -20.25), (-17.75, -20.25), (-24.75, -20.25)` |
| a prop moved into drum stone | `interior props against the stone` | `GothicCabinet_01 at x -20.46..-19.33, z -13.86..-12.14 is inside Kitchen Tower` |
| `stone_pavers` given both `arm` and `rough` | the new material check | ``material "stone_pavers" declares both `arm` and `rough` — src/assets.js reads exactly one`` |
| `porter-gate`'s leaf widened to 2.6 m | the per-gate loop | `porter-gate: leaf width 2.6 m is wider than the opening's 2.000 m — it would clip the stone` |

**The third break was a finding before it was a pass.** The first attempt put the cabinet at
a tile that landed it in a *wall run*, not a drum — the check fired, and told nothing, because
the old bounding-box code would have caught a wall run just as well. What had actually changed
was that `layout.mjs` reads each piece's own collider boxes instead of the box bounding them,
and a drum's `box` is the 8 x 8 m square around twenty-four sectors, three quarters of a metre
of which is ward floor at each corner. Redone at a point inside drum stone and inside no run,
it names the drum. **A break that fires the right assertion for the wrong reason is not a
verified guard-rail**, and the only way to tell the two apart is to check that the break is
inside the thing the change was about.

**The ward division is the assertion this phase exists for.** `layout.mjs` floods the castle a
second time with the porter's gate forced shut (`makePlan(config, boundsOf, { closed:
['porter-gate'] })`) and asserts the inner ward is then unreachable: **872 inner-ward cells
with the gate open, 0 with it shut**, and the outer ward unchanged at 4 rooms either way. That
is the opposite assertion to "every room is reachable", not a restatement of it — delete
either and a real hole opens, which is the distinction #34's "two lines guarding the same
absence" warns about.

**What was measured.** 219 pieces, 236 colliders, 8 surfaces. The walkability grid: 0.5 m,
5,831 reachable cells over an 84 by 44 m footprint, 167 ms. Six rooms, all reachable. All six
Castle Conundrum suites green, plus `npm run check`, `npm run social:check` and `node
ci-check.mjs` from `Tools/board-check`; `known-failures.json` still empty in all three
sections. **`npm run play` was not run and could not be** (#53). Its `SCHOLAR`, `GUARD`,
`HALL_BRAZIER` and `HALL_TABLE` constants moved with the geometry, and its gate beat looks the
leaf up by plan id now rather than hunting the scene near z 12 for an object of about the right
size — a positional search after a layout change finds either nothing or the wrong thing —
but none of that is verified. The phase's GPU exit criterion, barbican to porter's gate to
King's Hall, is outstanding.

**Next:** rank 1 is now Phase 4, the fourteen ground-floor rooms and the word-lock, a 1 on
Claude Opus 5. It restores rock_tile_floor, floor_tiles_02 and old_planks_02, and it owns the
eight tower interiors this phase left as solid stone (#433).

## Castle Conundrum v2, Phase 4: the fourteen ground-floor rooms and the word-lock (2026-09-14)

**Rank 1, a 1 in one area, alone under the size table** (PR #314). The row named Claude Opus
5 and was worked under Opus 5. The eight towers are hollow and have doors; the six walled
rooms have walls, doorways and floors; the muniment room is behind the riddle and the cell is
behind bars. **259 pieces against Phase 3's 219, all 259 within 0.0000 m of the live scene.**
35 MB to 39.8, three texture sets restored. Decisions #439 to #450.

**The row was Phase 4, not Phase 1, for the third time running** (#450). The session was
started on a prompt naming Phase 1 and rank 1 and carrying Phase 1's riders: ships no asset,
stays at 29 MB, "if you find yourself reaching for a Poly Haven set you have drifted into
Phase 3". Phases 1, 2 and 3 had shipped (PRs #306, #309, #312) and `BACKLOG.md:402` read
Phase 4, whose own spec restores three sets and goes to 39.8 MB. Phase 2's and Phase 3's
sessions hit the identical collision and resolved it the identical way. Three instances is
not an accident: **the prompt's "rank 1" is the instruction and the phase named beside it is a
snapshot that goes stale the moment a PR merges.** The riders belong to the phase, not to the
session. Nothing in the repo needs changing for this; the next session should read the ranked
table before the prompt's description of it.

- **The doorway goes in the drum's own ring, and #433 was half right** (#439). Phase 3 wrote
  that a drum standing on a tile-thick wall cannot be entered from the ward, because at a
  corner the two runs meeting there overlap in neither axis and the ward and the drum meet at
  a pinch of exactly zero width; what opens it, it said, is a doorway cut through the adjacent
  run. The pinch is real and the conclusion was too broad. A drum is 8 m across on a 4 m wall,
  so **two metres of every tower stands proud of the wall's inner face**, and the quarter of
  the ring facing that way is clear of both runs. That is all the two mid-run towers need: the
  Larder's door is a 30-degree gap in its own ring at due south and no run is touched. At the
  six towers that stand at a corner or at a cross-wall junction it is not enough, and the
  reason is the grid rather than the stone: the two runs' boxes tile the two quadrants exactly
  and touch at a single point, so the fill would have to move diagonally. Those six carry a
  **1.2 m doorway at the adjacent run's own end**, entirely inside that drum's footprint so
  the ring still seals it from the outside, and a **60-degree** ring arc rather than 30,
  because at 30 the first sector of stone reaches 0.08 m into the only cell the grid can use.
- **A tower room is a disc, and its bounding square is not the room** (#440). `rooms()`
  counted cells inside the room's `bounds`, which for a tower is the square around the
  interior disc. The square's corners sit at 1.414 x 2.8 = 3.96 m, out in the ring — and the
  doorway's own cells are in the ring. So a tower whose way in had been walled up still read
  **"reachable, 4 cells"**, and the four were the cells standing in the blocked doorway. Found
  by walling one up on purpose and watching the suite stay green (#34). Rooms carry a `shape`
  now and the disc is what is counted; the square is only the index into the grid.
- **Which rooms are shut is `mystery.json`'s answer, not `scene-config.json`'s** (#441). The
  first version of the lock check took its expectation from `room.locked`, which the plan
  derives from `door.leaf.closed` — the very field being tested. Shipping the muniment room's
  leaf `closed: false` moved the expectation along with the break and the suite stayed green.
  This is #147 in the small: a claim the arithmetic cannot distinguish. `mystery.json`'s
  `locks` names the rooms a riddle opens, and the cell now carries `barred: true`, which is a
  fact about the crime rather than about the geometry. The castle has to match them, and the
  mismatch is its own failure line.
- **The plan never handed the builder the interior, and every tower rendered solid** (#442).
  `piece.drum` carried `cx, cz, radius, height, segments, turret` and not `inner` or `door`,
  so `castle-builder.js` read `d.inner` as undefined and took the solid-cylinder branch. The
  colliders were hollow, the walkability grid was hollow, fourteen rooms were reachable, all
  six Node suites were green — and the castle on the screen had eight solid drums with no
  doors in them. `plan-vs-scene.mjs` could not see it either: **a solid drum's bounds are a
  hollow drum's bounds, to the millimetre.** It came out of deleting the lintel over a doorway
  on purpose and watching nothing happen, which is the #34 discipline paying for itself
  twice — the break was aimed at the lintel and hit this instead.
- **`RingGeometry`'s theta is not `CylinderGeometry`'s** (#443). The flat annulus capping each
  ring section was a `RingGeometry` laid flat by a rotation. Ring lays its vertices out as
  `(r cos t, r sin t)` in its own xy plane; Cylinder lays its out as `(r sin t, r cos t)` in
  xz. The two differ by a quarter turn **and a reflection**, so a cap given the shell's own
  `thetaStart` covers a different quarter of the tower than the wall it caps — including, in
  every case here, the doorway. That is what was holding the drum's bounds up from the wrong
  side and keeping the lintel break green after #442 was fixed. The cap is built from the same
  `sin, cos` the shells and the plan's collider sectors use; with it aligned, deleting a
  lintel moves the drum **0.136 m** and the suite says so.
- **A rule that changes no answer is not a check, so it was deleted** (#444). Hollowing the
  towers puts walkable floor 0.8 m past the curtain's outer face, which looked like it needed
  `walkability`'s seal test taught that a tower interior is inside the castle. A drum-aware
  `outsideCurtain` was written for it. Deleting it on purpose changed nothing: `curtain: true`
  is on all eight drums, so the curtain box has read z -20..20 rather than -18..18 since Phase
  3 and a cell in a tower was never outside it. It is gone, and the comment in its place says
  why, because the next person to hollow something will have the same thought.
- **A room's boundary is not its wall's face** (#445). Interior partitions sit on tile EDGES —
  their `from`/`to` carry a half — so half of a 1 m partition stands inside the room and the
  room's tile rectangle is half a metre out in the air. `layout.mjs`'s "the cabinet and the
  commode are against their side walls" measured against `hall.bounds`, which was the same
  number as the wall while every wall of the Great Hall was a curtain run. It measures the
  nearest stone box sharing the prop's z band now, and reports which piece: **GothicCommode_01
  stands 0.120 m off great-hall-east at x -6.5**. The commode and the hall's east column moved
  0.5 m west with the wall.
- **`wall-door.glb` is not a door frame in a 1 m wall** (#446). Phase 4's plan says "door
  frames from `wall-door.glb` where a doorway needs a lintel". The model is authored
  1 x 1 x 1 and `scaleRuleFor` gives every `wall*` piece the depth rule, so it arrives 4 m
  deep — four times the partition it would sit in. A doorway is a gap in the run's boxes with
  the run's own stone over it, which is what a castle doorway is; the kit keeps the shapes the
  maps do not have, and a lintel is not one of them.
- **The riddle is the muniment room's word-lock, and `openGate` means that leaf** (#447). The
  Scholar stops posing it and points at the door; `riddle.json` carries the river riddle;
  `openRiddle` runs on `lock:muniment`, which is the player pressing E at the leaf. Three
  things fell out of it. `validateAgainstNpcs` takes `lock:<id>` as the second legal shape for
  `openRiddle` and `test/quest.mjs` owns the half that knows the castle — a lock the quest
  listens for has to be a door `scene-config.json` builds, that ships shut, that carries a
  prompt, and that `mystery.json` calls a riddle lock. `InteractionSystem` takes targets
  rather than NPCs, a target being anything with a group, a name and optionally a prompt, a
  focus point and an `active` getter. And `openGate` sits on the next stage's `enter` rather
  than on the transition, so a save resumed there finds the door open. The east gate keeps its
  archway and never opens again, exactly as Phase 3 predicted.
- **Two colour-only surfaces live apart from the stone list** (#448). The cell's bars and the
  cloak over the laundry crate have no map on disk and none on WISHLIST.md's stone table. A
  colour-only entry in `materials` would have meant weakening "every material is a complete
  diffuse, normal and arm/rough set" to "unless it is not", so `plainMaterials` is a second
  section carrying the opposite assertion: a six-digit hex colour and no path to anything.
- **The evidence the mystery names now has objects, and the two files are held together**
  (#449). Every level-0 row in `mystery.json`'s `evidence` gets a piece carrying its id: the
  lantern at the Chapel Tower stair foot, the pouch, the chapel candles, the cloak, the cart
  by the west gate, the ledger in the muniment room, the barrel in the bakehouse, and the
  muniment door itself. `layout.mjs` asserts each stands inside the room the mystery names it
  in — a room's own door being the exception, since a door stands in the wall — and that the
  fourteen room ids in `scene-config.json` and the fourteen enclosed level-0 rooms in
  `mystery.json` are the same fourteen. They were not: Phase 1 wrote `clerk-office` and
  `lodge` where the scene config had `clerks-office` and `masons-lodge`, and nothing said so.

**The guard-rails, and what each break said.** Eleven breaks from a green baseline. **Four of
the eleven ran green**, and every one of those four was worth more than the seven that fired:

1. Walled the King's Hall's doorway shut. `kings-hall (inner ward, level 0) cannot be reached
   on foot from the spawn — 0 standable cells in x 2..22, z -14..-6`, plus the porter's lodge
   and the muniment room, which open off it, and the Scholar, who stands in it. That is the
   break Phase 4's plan names.
2. Walled the North-west Tower's doorway through the curtain shut. `guardroom (outer ward,
   level 0) cannot be reached on foot from the spawn`. **This one ran green the first time**
   and found #440.
3. Shipped the word-lock `closed: false`. `muniment is open in scene-config.json and shut with
   riddle in mystery.json` and `muniment is reachable from the spawn with its word-lock
   unanswered — 50 standable cells`. **Also green the first time**, and found #441.
4. Deleted the cell's bars. Three lines: the mystery mismatch, `cell is reachable from the
   spawn with its bars in place — 58 standable cells`, and `no bars in the plan — the cell has
   no door at all`.
5. Deleted the drum-aware seal rule. Green, and that is #444: the rule was not doing anything.
6. Deleted the MIDDLE curtain run (#430's lesson). `the castle leaks: 1984 reachable cells
   outside the curtain ... The fill stepped through at (-15.75, -20.25)`.
7. Moved the chapel candles into the inner ward. `evidence "candle" stands at (16.09, 11.93),
   outside chapel (x 21.2..26.8, z 13.2..18.8)`.
8. Renamed `porter-lodge` to `porters-lodge` in the scene config. Both directions fired:
   `mystery.json puts people or evidence in "porter-lodge" and the castle has no such room`
   and `the castle builds a room "porters-lodge" that the mystery has never heard of`.
9. Pointed the quest's lock at a door shipping open. `lock:muniment names a door that
   scene-config.json ships open — the riddle would unlock nothing`.
10. Dropped the lintel over a drum's doorway. **Green twice**, which found #442 and then
    #443; with both fixed it reads `"kitchen-tower" (tower) is 0.136 m off the plan` with the
    plan and scene boxes printed.
11. Dropped the lintel over a wall run's doorway. `"north-curtain-west" (wall) is 1.200 m off
    the plan`, and five more.

Two more on the word-lock beat that `plan-vs-scene.mjs` gained: taking the prompt off the leaf
gives `standing two metres in front of the muniment room's door, looking at it, offers no
prompt`, and pointing the quest at `lock:vault` gives `E at the word-lock opened no riddle
(stage seek-keystone)`.

**The word-lock is in CI, and the walk is not.** `plan-vs-scene.mjs` places the camera two
metres in front of the muniment room's door, waits two frames for the render loop's own
`interaction.update()`, reads the prompt out of the DOM and dispatches a `KeyE` keydown.
Nothing there moves or is timed, which is the line #53 draws, and it is the only automated
cover the whole Phase 4 wiring has — the fixture targeting, the line of sight to a leaf that
hangs off a hinge at its own edge, the prompt text, and E reaching the quest graph.

**What was measured.** 259 pieces, 284 colliders, 20 surfaces, 14 rooms. The walkability grid:
0.5 m, 5,743 reachable cells, twelve rooms open and two shut. The muniment room opens to 58
cells when the word-lock does and no other room moves. Eight standable cells within 1.5 m of
the cell's bars. `assets.mjs`: eight complete texture sets, two plain materials, 50 material
names across the walls, drums, doors, grounds, floors and built props, 93 files under
`assets/Poly Haven` and `assets/NPCs` with every one of them asked for. All Castle Conundrum
suites green, plus `npm run check`, `npm run social:check` and `node ci-check.mjs` from
`Tools/board-check`; `known-failures.json` still empty in all three sections. **`npm run play`
was not run and could not be** (#53). Its Scholar beat no longer waits for a riddle, it has a
new beat that walks to the word-lock and presses E, its answer is `River`, and its gate beat
looks up the `muniment` leaf; none of that is verified, and the phase's GPU exit criterion —
the Great Hall, the chapel and the cell's bars — is outstanding.

**Next:** rank 1 is now Castle Conundrum v2, Phase 5, the upper level and the wall walk, a 1
on **Claude Fable 5.1**. It restores wood_planks and dirty_carpet, 39.8 MB to 44.4, and the
wishlist calls it the genuinely unsolved part of the plan: the player standing on floor two,
and the suite knowing it. `base` on a wall run is already there and is how its floor slabs are
written; the disc a tower room is measured by is already there and is what its stairs will
have to land in.

## Castle Conundrum v2, Phase 5: the upper level, the wall walk, and a player with a y (2026-09-15)

**Rank 1, a 1 in one area, alone under the size table** (PR #316). The row named Claude Fable
5.1 and was worked under Fable 5.1. Three levels: slabs at 3.8..4.0 over the Clerk's office,
the kitchen and the King's Hall and in every tower; the wall walk flush with the top of every
curtain run, the cross-wall and three new runs over the gates; fourteen flights; doors in
the rings at levels 1 and 2; a window. The player's feet stand on `castle-plan.js`'s
`standAt`, which is the function the walkability grid stands on. **307 pieces against
Phase 4's 259, all 307 within 0.0000 m of the live scene, and the camera on the plan's
floor in all 36 rooms at 0.0000 m.** 39.8 MB to 44, wood_planks and dirty_carpet restored,
the ceiling. Decisions #451 to #464.

**The row was Phase 5, not Phase 1, for the fourth time running** (#451). The prompt named
Phase 1 and rank 1 and carried Phase 1's riders; `BACKLOG.md:401` said Phase 5, on Fable
5.1, which is what this session runs. #450 already says the table is the instruction and
the phase beside it a stale snapshot. Nothing more to record except that it happened again.

- **The flights are 1.5 m wide, placed per axis, in an L** (#452). `stairs-stone.glb` at
  the tile's uniform 4 is 2 m wide and 4 m long; two of those side by side in a tower are a
  4 m square whose corners stand 2.83 m from the centre, 0.03 m into a ring whose inner
  face is at 2.8. So `placementMatrix` takes `[sx, sy, sz]` for the first time and the
  flights are 3 x 3.9 x 3.9: 1.5 m wide, 3.9 m of rise over 3.9 m of run, the last 0.1 m
  onto the slab a step. The lower flight runs along z with its foot on the outer wall; the
  upper runs along x in the outer half; they overlap in one quadrant, the lower flight's
  low half under the upper flight's high half, with 2.05 m of head room at the worst
  point. The upper flight's well is on the outer half so the walk, crossing the tower's top
  room along the inner half, never meets the hole.
- **The level-1 rooms are walled, not railed** (#453). The plan says "floor edges from
  `wood-floor-railing.glb` where a slab meets a drop". A bedchamber or a dormitory open to
  the ward along one side is a gallery, not a room, so the five partitions under the three
  chambers go from 4 m to 8 and no slab meets a drop. Lady Alys's window over the inner
  ward is a `doorway` on the King's Hall's south wall with a `base` a metre above her floor:
  `runBoxes` cuts the run into columns at every opening's edges and leaves the stone
  between openings, so a window's sill is a box the grid and the body both meet.
- **A level-2 door is sixty degrees wide** (#454). A 2 m deck crosses the ring over about
  thirty degrees of cell centres, and the sector boxes bulge: a box over a fifteen-degree
  arc at radius 2.8 reaches 0.38 m past the ring at its inner corner, and a cell whose
  square overlaps that corner by two centimetres is blocked. Sixty is what lets three of
  the deck's four cell columns through. The corner towers therefore have a quarter of
  their ring open at the top, which is what a tower on a wall walk looks like.
- **The Prison Tower and the King's Tower have no lower flight** (#455). The first time
  every tower had both flights, `layout.mjs` read `cell is reachable from the spawn with
  its bars in place — 80 standable cells` and `muniment is reachable ... with its word-lock
  unanswered — 66 standable cells`: down the walk, into the tower's top room, down two
  flights, into the shut room. A stair from a barred cell or a locked treasury to the walk
  is a way round what shuts it. Those two keep the upper flight, standing on a first floor
  that is reached from the walk, and the suite floods each from its own top room and asks
  both that the first floor is reached and that the ground room is not. The royal
  apartments over the King's Hall are therefore reached over the walk before the word-lock
  is answered and only over the walk after it, which is how the intended path already had
  it: the walk is climbed at Terce, the lady visited at Sext. The rail also refuses a tower
  that keeps its stairs from the walk while its ground room is open.
- **Merlons stop at towers and at T-junctions, and the drums are roofed** (#456). Every
  curtain run ends 2 m short of a drum's centre, inside its ring, and a 4 m merlon centred
  over the run's last 4 m reached through the ring into the tower's top room: a pixel-art
  crenellation standing on the level-2 floor beside the Stockhouse walk door, in the first
  render of the walk. Each span is trimmed to where the run's centreline leaves the drum's
  outer circle. Then the barbicans' last merlons stood across the west walk, on the west
  curtain's top where the barbican wall butts into it, and the trim learned to stop at
  another run's box too, but only a box that reaches past both of the span's faces: two
  walls turning a corner each keep their merlon and overlap at the corner as they have
  since Phase 3. The first version trimmed at corners too and left every barbican and
  garden corner bare; the diff of merlon positions is what showed it. 159 merlons to 157,
  the two on the west walk. And a hollow drum seen from the walk of the tower next door
  was a chimney, so each ring carries a lid at its top.
- **The west walk lies on the towers' east half** (#457). The west curtain runs x -38..-34
  and its inner face is at -34, so its decking is x -36..-34, which is the east half of the
  towers centred at -36. The North-west Tower's south door and the South-west Tower's north
  door were first cut on the west half, where the deck is not, and the walk from the
  North-west Tower's stairs reached neither the South-west nor the Prison Tower. The rail
  that found it (below) is the one that floods with one tower's flights and asks for every
  deck end to end.
- **A floor is a collider whatever its thickness** (#458). `collide` drops anything under
  0.3 m as floor decor, since Phase 2. A slab is 0.2 m and a deck 0.1, so for the first
  hour of this phase no upper floor was a collider: no body on a flight ever met the floor
  over its head, and the wells cut in the slabs were needed by nothing. Found by taking
  the wells out on purpose and watching every suite stay green (#34). `thin: true` is how
  a floor gets in, and with it the wells are load-bearing: without them the flight's chain
  of cells breaks between 1.9 and 3.7 m of rise and `nothing on level 1 can be reached`.
- **A millionth at the step height** (#459). The top cell of an upper flight stands
  exactly a step under the slab beside its well, 7.7 against 8.0, and `4 + 3.9 * (3.7 /
  3.9)` rounds a hair under 7.7 at one x and not at another, so the North-west Tower's
  flight was blocked by the slab strip beside its well while the Kitchen Tower's identical
  flight was not. A box whose top is exactly HEAD_LOW over the feet is a step, not a
  wall; the grid's `blocked` and the controller's band both carry 1e-6 now.
- **The lower flight stands on the half away from the ground door** (#460). It splits the
  tower's floor into two halves joined only through its own footprint and the crescents
  beside it, and the crescents are cut by the sector boxes at the diagonals. While the
  flight's body was walkable floor (the discard rule below said `> lo` and let a body
  stand on the slab under a flight), the halves connected through the footprint and
  nobody noticed; when the rule was fixed, five towers went dark at once, every one whose
  ground door faces east. So the flight stands in the west half where the door faces east
  and the east half otherwise, read off the ground door's bearing, and the upper flight
  rises toward it. The chapel's candles, lantern and pouch and the laundry's cloak crate
  were standing where the flights now stand; Phase 4 placed them with no stair to avoid.
  They moved, and `layout.mjs` refuses a prop in a flight.
- **The walk is the curtain and the cross-wall, and the Stockhouse door is its one
  crossing** (#461). Decking is `walk.width` 2 m along the inner face of every run marked
  `walk: true`, flush with the run's top, sunk into the stone and drawn polygon-offset like
  a ground patch, cut back to every drum's outer circle so the tower's own disc floor takes
  over inside. Three runs of stone go over the three gates, whose 4 m archway had left a
  4 m notch in an 8 m wall since Phase 3, so the west and east walks are continuous and
  the cross-wall walk runs over the porter's head. The Bakehouse Tower has no west door,
  so the outer ward's south walk ends at its ring, and the barbican and garden walls carry
  no walk; the Stockhouse Tower's west door at level 2 is the only way between the wards
  two storeys up. That door is a `bar`: an opening with nothing to draw while it is open,
  sealed by its own ring sectors when the suite bars it, with a plank plate drawn only
  then. The bar leaning beside it is a built prop and the evidence object for
  `door-unbarred`.
- **A raised doorway has a sill surface** (#462). A level-1 doorway cut through a
  curtain's end is a passage whose floor is the wall's own stone at 4 m, and stone under
  an opening was not a surface: the Clerk's chamber read unreachable with its slab, its
  door and its stairs all in place. `runSills` makes one per raised opening.
- **The standing beat puts the camera a step too high** (#463). Placed exactly on the
  plan's floor, a `settle()` that did nothing would have passed, and the first version did
  exactly that. It is placed 0.3 m over the floor plus the eye, and the runtime has to
  bring it down: a `settle()` that trusts the camera reads `0.300 m off` in every room.
- **The crossings rail is two floods, and the old one was the wrong assertion now** (#464).
  Phase 4's 4b asserted that with the porter's gate shut nothing in the inner ward is
  reachable; with the walk in place that is false by design. It is now: with the porter's
  gate shut and the walk door open, the inner ward is still reached, over the top; with
  the walk door barred as well, nothing in it is, on any level. Each half is broken by a
  different edit and deleting either leaves a hole.

**The guard-rails, and what each break said.** Thirteen breaks from the final green
baseline, after the fixes above; five of them ran green the first time they were tried
during the phase, and each of those five was a finding (#457, #458, #459, #460, and the
`> lo` bound), which is more than the eight that fired straight off.

1. The Kitchen Tower loses its lower flight, in the config (`lowerFlight: false`):
   `kitchen-tower has no lower flight and its ground room larder is open — only a shut
   room may keep its stairs from the walk`. The same break written as a bug in the plan,
   the flight silently not built: `kitchen-tower-1 and kitchen-tower-2 and dormitory
   cannot be reached by kitchen-tower's own stairs — ... dormitory unreachable`. **Check
   3, the plain reachability from the spawn, stays green under both**, because the walk
   reaches the Kitchen Tower's first floor from the North-west Tower's stairs, along the
   north walk and down; check 6, which floods with one tower's flights, is the one that
   fires, and that is why it exists.
2. The royal apartments' slab at 1.6 m: `floor-royal-apartments hangs 1.40 m over
   kings-hall's floor at 0 — a standing body needs 1.9`, and six more lines, the King's
   Hall and the apartments both unreachable among them.
3. The Stockhouse walk door barred in the config: `stockhouse-walk is shut with barred in
   scene-config.json and open in mystery.json`, `the Stockhouse walk door ships barred ...
   door-unbarred is the porter's lie`, and `level 2 does not connect the wards: with the
   porter's gate shut and the walk door open, cross-walk, stockhouse-walk, kings-hall,
   royal-apartments cannot be reached — 0 inner-ward rooms can`.
4. The walk door removed entirely: `no walk door in the plan: the Stockhouse Tower's top
   room has nothing in its west doorway that could be barred` and `the barred door does
   not separate the wards: ... kings-hall (level 0, 596 cells) ... can still be reached.
   There is a second way across`.
5. No sill under a raised doorway: `clerk-chamber (outer ward, level 1) cannot be reached
   on foot from the spawn` and the apartments with it.
6. The Kitchen Tower's west walk door removed: `north-walk is reached only over x
   -33.75..-24.25 from the North-west Tower's stairs, not -31..-5 — the walk is broken part
   way along it`.
7. No well in any tower's floor: `nothing on level 1 can be reached from the spawn`,
   `nothing on level 2 can be reached from the spawn`, and every upper room. **Green until
   #458**, which is how #458 was found.
8. Merlons without colliders: **green**, and it stays green. The grid never stands on the
   parapet's strip because nothing there is a surface, so the merlons block no cell; what
   they stop is the runtime body's 0.45 m radius, which no Node suite has. The GPU walk is
   the only thing that can see a body inside a merlon.
9. The flight's body walked through (the discard rule deleted): `242 reachable cells stand
   inside a flight's body, e.g. (-36.25, -17.75) at 0.00 under nw-tower-stair-1, which is
   at 0.20 there`. **Green before the bound was fixed**; the rail's own bound had the same
   bug and was fixed with it.
10. The chapel's candles back where Phase 4 put them: `candles-chapel stands in
    chapel-tower flight 1` and `chaplain-chamber and chapel-tower-2 cannot be reached by
    chapel-tower's own stairs`.
11. `settle()` doing nothing: `in clerk-office (level 0) the plan's floor is at 0.000 and
    the runtime stands on trusted at 0.300, 0.300 m off`, in every room.
12. The builder laying every upper floor a storey low: `"north-curtain-west-walk" (floor)
    is 4.000 m off the plan`, and every floor after it.
13. The builder drawing every drum solid: `standing two metres in front of the muniment
    room's door, looking at it, offers no prompt` and `E at the word-lock opened no
    riddle`. The box comparison stays green, as #442 recorded, and so does the standing
    beat, because the camera stands on colliders that come from the plan; the word-lock's
    line of sight is what sees a solid ring.

**What was measured.** 307 pieces, 601 colliders, 71 surfaces, 36 rooms on three levels,
14 flights. The walkability grid: 0.5 m, 8,953 reachable cells, 5,876 on level 0, 1,592 on
level 1, 1,485 on level 2; the flood runs in about 100 ms with colliders bucketed by
column, against 150 before bucketing. With the porter's gate shut the whole castle is
still reached; with the walk door barred as well, 3,598 cells and no inner-ward room.
`assets.mjs`: ten complete texture sets, three plain materials, 99 files under `assets/Poly
Haven` and `assets/NPCs` with every one asked for. All Castle Conundrum suites green, plus
`npm run check`, `npm run social:check` and `node ci-check.mjs` from `Tools/board-check`;
`known-failures.json` still empty in all three sections. **`npm run play` was not run and
could not be** (#53). Its new beat climbs the Kitchen Tower's two flights, walks the north
curtain east, passes the Stockhouse walk door, crosses the cross-wall to the Bakehouse
Tower and comes down its two flights into the inner ward, reading the camera at 5.7, 9.7
and 1.7 on the way; the plan's own criterion said the King's Tower, which has no lower
flight now. None of it has been seen on a GPU.

**Next:** rank 1 is now Castle Conundrum v2, Phase 6, twelve NPCs on four bells and pathing
between stations, a 1 on **Claude Opus 5**. Two things this phase leaves ready for it: a
station carries `level` already (Phase 1 wrote it, and `mystery.js` holds it to the room's
level), and `walkability` connects the three levels through the flights, which is the
grid its breadth-first pathing walks. Its `stationOf` for the porter at Vespers is the
cross-wall walk, which is a place a player can stand on as of this phase, and the sentry's
post by the Kitchen Tower on the north walk is another.

## Castle Conundrum v2, Phase 6: twelve NPCs on four bells (2026-09-15)

**Rank 1, a 1 in one area, alone under the size table** (PR #318). The row named Claude
Opus 5 and was worked under Opus 5. The cast is on the screen: twelve bodies, three models
and a tint each, standing where `data/mystery.json`'s schedule says at the bell the game is
on. The bell is a crank and a rope in the chapel; ringing it moves the watch, and the watch
moves the sky, the evidence that is only there at some bells, and twelve people, each
walking the breadth-first route from where they stand to where they are due, on the same
grid the player walks. `test/mystery.mjs` 100 assertions to 113, `test/plan-vs-scene.mjs`
7 to 16. 43.13 MB to **43.18** by `git ls-tree`, no asset restored and none added: the
whole phase is 1,245 lines of text. Decisions #465 to #476.

**The row was Phase 6, not Phase 1, for the fifth time running** (#465). The prompt named
Phase 1 and rank 1 and carried Phase 1's riders (29 MB, no asset, "if you reach for a Poly
Haven set you have drifted into Phase 3"). `BACKLOG.md:416` said Phase 6, on Opus 5, which
is what this session ran. #450 and #451 already say the table is the instruction and the
phase beside it a stale snapshot; recorded once more only because it is now five for five,
and because the previous session's branch name carried the same stale "phase-1" into this
one's.

- **A station is a tile, not a room** (#466). Six people stand in the Great Hall at
  Vespers and each has to be somewhere the player can walk up to and talk to alone, so
  every station in the schedule carries a fractional `tile` in `scene-config.json`'s own
  units and `src/stations.js` turns it into a world point. Deriving a point from the room
  instead would have put the cook in the geometric middle of the kitchen and needed a
  spread rule for the six in the hall; the data already said "at the cart", "the high
  table", "by the Kitchen Tower", and a coordinate is the honest form of that.
- **The validator takes a nav, and asks five things of every station** (#467): floor under
  it, the room it names around it, 1.5 m between any two bodies at one bell, the player
  able to walk to it, and a walk from the station before it. `validateMystery`'s fourth
  parameter is `castleNav(plan, mystery)` rather than the plan itself, so the flood is
  built once per run and the file's other rails stay geometry-free. Which stations the
  player has to reach is the mystery's answer and not the castle's: `barred` in
  `mystery.json` is the fact that excuses Madoc's, and it asks instead for somewhere to
  stand within talking range of his bars, which is how `test/layout.mjs` already reads that
  field (#441).
- **The walk between two stations is the player's own grid** (#468). `walkability` records
  its edges as it floods and answers `path(from, to)` breadth-first; it also takes `seeds`,
  extra starting points so floor the player never reaches is still in the graph, which is
  the only way the man behind the bars has a station at all. Its first version linked both
  directions with a comment about path searches over half a graph. Deleting the back-link
  changed no answer in any suite, because every reached cell is popped exactly once and
  links to all four neighbours whether or not they were reached first, so the line went
  (#13).
- **Lady Alys leaves the east barbican garden** (#469). Her Sext station was the garden,
  which is behind a gate that never opens (WISHLIST.md's answered question 5), so the
  garden is scenery: nobody could ever have walked to her there, `speakable` said she could
  be spoken to, and no rail before this one could tell. She takes the air in the inner
  ward. The Constable's first Prime station was the same class of mistake with a different
  shape: standing on top of the chapel's candlesticks, 0.84 m up, floor by every rail but
  the one that asks whether a body can step onto it.
- **A station carries the floor's height, not just its level** (#470). Without it the
  browser check compared `h ?? 0` against a body placed at `h ?? 0`, so Lady Alys stood on
  the ground floor inside the King's Hall and every assertion agreed she was where she
  should be — #147 again, a claim the arithmetic cannot distinguish. `castleNav` reads each
  station's height off the grid, and `plan-vs-scene.mjs` now asserts separately that the
  one who is upstairs is upstairs.
- **The tint clones the material first** (#471). Three.js shares materials across every
  clone of a cached glTF, so tinting in place repaints everyone wearing the same body:
  with the clone removed, twelve people read as five sets of colours. Skin, eyes, brows and
  hair are left alone, because a green face is a different species and not a different
  person.
- **The three of v1 are gone, and the riddle quest ends on the Constable** (#472).
  `npcs.json`'s `npcs` list is deleted and the page spawns the twelve of `cast`. The riddle
  quest it still plays until Phase 7 has every stage in `default` and its last transition
  on `talked:constable`: none of the twelve has a `hasKeystone` line, and writing twelve of
  them for three stages Phase 7 deletes is content with a known expiry date. Dafydd ap Rhys
  carries the mace the Guard left behind, which keeps the one held prop in the project
  referenced and is also what reads as a soldier from across the ward, where a tint alone
  does not.
- **Anything the player presses E at is held clear of the stone** (#473). The bell's first
  tile put 0.9 m of its box inside the Chapel Tower's ring while its own tile point stood
  on clear floor: the model reaches 1.4 m past its origin at that rotation. Nothing caught
  it except `interaction.js` refusing to offer a prompt through stone, which is the same
  rail that caught the Guard sealed in the gatehouse in v1. `test/layout.mjs`'s check 1
  covers `prop` pieces and the bell is `decor`, so there is a check 1c now.
- **The sky is per watch** (#474). `lighting.watches` carries a sun position, colour and
  intensity, a fog colour and a hemisphere strength for each of the four bells: Prime low
  in the east, Vespers low in the west and warm. The hemisphere does not go far below the
  2.0 Phase 3 measured the shadowed slate needs, so a darker Vespers is a lower, warmer sun
  and a colder fog rather than an unlit castle.
- **The break the plan named ran green** (#475). Walling the kitchen's south door does not
  strand the cook: the Kitchen Tower's own ground door opens into the kitchen and its stair
  runs up to the wall walk, so she leaves through the larder, along the north walk, down
  another tower and into the hall, 195 cells against 47. Phase 5's lesson arriving a second
  time. The suite asserts both halves now, and the break that produces
  `cook: no path from KI at sext to GH at vespers` is both doors.
- **`play-castle.mjs` reads stations from data** (#476). `SCHOLAR = [10, -10]` and
  `GUARD = [-5.5, 0]` had to be moved by hand every time the castle under them changed;
  the beats ask `stationOf` where somebody is due at the bell the game is on. Its new
  beats ring the bell three times and walk to the Great Hall to find the cook there.

**What was run.** `test/mystery.mjs` 113 assertions, `test/layout.mjs` 82, `test/quest.mjs`
76, `test/save.mjs` 50, `test/assets.mjs` 29, `test/plan-vs-scene.mjs` 16, all green, plus
`npm run check`, `npm run social:check` and `node ci-check.mjs` from `Tools/board-check`;
`known-failures.json` still empty in all three sections. Eight breaks were run on purpose
from a green baseline and six fired: the bell back in the tower ring, the tint without its
clone, the sky never applied, the larder's door taken out, and the two validator rails
deleted one at a time. Two ran green and both changed the code: the back-link in the fill
(deleted, #468) and the named kitchen break (#475). **`npm run play` was not run and could
not be** (#53).

**Next:** rank 1 is now Castle Conundrum v2, Phase 7, the mystery going live — examine,
the journal, present, accuse, and the riddle quest retiring — a 1 on **Claude Opus 5**, and
the last phase of the plan. What this phase leaves ready for it: the engine is already on
the page as `window.__mystery`, wired to the bell and to the save's `watch`;
`castle.setEvidenceVisible` hides and shows a piece of evidence with its collider, which is
what `taken` will need; `castle.bells()` reads a flag on a plan piece rather than knowing a
prop by name, which is the shape `evidence` targets want; and the three stages of the
riddle quest it deletes are down to one transition and one dialogue state.

## Castle Conundrum v2, Phase 7: the mystery goes live (2026-09-15)

**Rank 1, a 1 in one area, alone under the size table** (PR #320). The row named Claude Opus 5 and was
worked under Opus 5. Phase 1's engine meets Phase 6's cast in Phase 5's castle, through the
UI: E on a thing examines it, J opens the journal, Present inside a conversation presses
somebody with a clue, and the Constable's last line opens a panel with twelve names, a fall
and everything written down, which becomes the verdict and the epilogue in place.
`data/quest.json` is one graph now — the frame is the top level and the riddle quest's three
stages are gone with `openGate`, `showVictory` and the victory screen. `test/quest.mjs` 76
assertions to **154**, `test/mystery.mjs` 113 to 118, `test/save.mjs` 50 to 56,
`test/plan-vs-scene.mjs` 16 to 34, `play-castle.mjs` 34 beats to 102. **43.18 MB by
`git ls-tree`, unchanged**: no asset added and none restored. Decisions #477 to #490.

**The row was Phase 7, not Phase 1, for the sixth time running** (#477). The prompt named
Phase 1 and rank 1 and carried Phase 1's riders whole: "the project stays at 29 MB" against
43.18 on `main`, "tint is written in Phase 1 alongside the twelve NPCs, not in Phase 6
(#419)" when Phase 6 shipped the twelve and their tints the session before, "Phase 1's entry
names four specific breaks" when Phase 7's names two, and "the phases stay at ranks 1 to 7
(#420)" when only Phase 7 was left in the table. `BACKLOG.md`'s rank 1 said Phase 7 and the
Castle Conundrum section said Phases 1 to 6 had shipped. #450, #451 and #465 already say the
table is the instruction and the phase beside it a stale snapshot; recorded a third time only
because six for six is no longer an accident, and because a session that took the prompt at
its word would have rebuilt `data/mystery.json` on top of a castle that already runs it.

- **The frame is the graph, and a riddle-quest save is repaired rather than migrated**
  (#478). Phase 1 wrote the v2 graph under a `frame` key beside the three stages the page
  played; promoting it is one move and deleting the three is another, and both happen here.
  `openGate` and `showVictory` go with them, because only the riddle quest named them.
  `buildCatalog` stops reading `quest.frame.stages`, so a save carrying `present-keystone`
  fails the catalog and `repair` resets it to `start` (#37). That is the honest answer and
  not a gap: the quest that save was halfway through does not exist any more, the key is
  untouched (#36), and every other field in it — the watch, the clues, who has been pressed,
  what has been accused — is still read.
- **`validateAgainstNpcs` takes a list of token/action pairs** (#479). It was written for
  one pair and hard-coded both names: lines ending in `{RIDDLE}` need a stage that runs
  `openRiddle` after that conversation, and a stage that runs it needs lines that pose it.
  The accusation is the same shape with different nouns — the Constable's `default` lines end
  in `{ACCUSE}` and two stages answer it — so the argument is `pairs` and the riddle is its
  default entry. A second pair costs a line of data; the alternative was a second copy of
  forty lines of checking, which is the thing #34 keeps catching. `test/quest.mjs` breaks
  both directions of the new pair and then asserts that neither break fires when only the
  riddle pair is passed, so the rail is the list and not a second hard-coded token.
- **One press of E reads the word-lock and asks it** (#480). The muniment room's leaf carries
  `evidence: "lock"` in `scene-config.json` and was already a lock target, so `castle.evidence()`
  skips gate leaves and `locks()` carries the evidence id instead. Giving the door a second
  prompt would have let the player read the word into the journal without ever being offered
  the riddle, and `test/quest.mjs` holds the leaf's `evidence` to a row in the same room as
  the lock, because losing it makes `word-lock` ungrantable in the browser while every file
  goes on validating alone.
- **Five answers that are not a clue are content, so they are data** (#481). `mystery.ui`
  carries seven lines — asleep, not here at this bell, already taken, still locked, already
  read, nothing written down, and "No one. He fell." — and `validateMystery` requires all
  seven, because a missing one shows as an empty toast, which reads as a prompt that does
  not work. Every evidence row grew a `name` for the same reason: without it the prompt says
  "Press E to examine the undefined" on a real wall, and `undefined` renders fine.
- **"Which room am I in" is not a question this castle answers** (#482). One clue in
  `mystery.json` is kind `L` and it is the cross-wall walk, so somebody has to notice the
  player walking onto it or `lady-window` — one of the five that convict the Clerk — is
  unreachable in the browser while `engine.enter` goes on working in Node. The first version
  was `nav.roomAt(x, z, feet)`, and checked against all forty-five stations it named ten of
  them as a room their own schedule does not call them: the towers' discs overlap the walks
  that cross their roofs, the cell's disc overlaps the Great Hall's box, and whichever room
  won was whichever `plan.rooms` listed first. `nav.inRoom(room, level, x, z, feet)` asks
  about one room, which has one answer, and `main.js` asks it only of the rooms that are
  themselves a clue — read off the clue list, so a second location clue needs no code.
- **A shrug is not a conversation** (#483). Presenting a clue that moves nobody gets the
  NPC's `default` lines back rather than silence, and dispatches no `talked:` event. Without
  that, presenting the wrong thing to the Constable would open the accusation panel, because
  `talked:constable` is what opens it.
- **The engine owns an NPC's dialogue state; the stage is only the floor** (#484). The
  graph's `dialogueState` effect set every NPC at once, which is right for a stage change and
  wrong the moment a press moves one person: a pressed Steward went back to `default` at the
  next stage and his admission was lost. `_syncStates` reads `engine.npcState(id)` and falls
  back to the stage. The reload beat is what catches it — a save with `pressed: {steward:
  ['admits']}` has to come back in `admits`.
- **What is on the ground at a bell is the manager's, because the manager owns `taken`**
  (#485). `main.js` set evidence visibility from `watches` alone, so the pouch came back onto
  the body at Terce after the player had pocketed it at Prime, with `taken` in the save saying
  otherwise the whole time. It moved to `QuestManager._showEvidence`, which is also the only
  reason `test/quest.mjs` can see it: nothing loads `main.js` in Node.
- **The word-lock and the journal are offered in `arrive` too** (#486). `arrive` is one
  conversation long and gating the castle behind it seemed harmless. `test/plan-vs-scene.mjs`
  pressed E at the muniment room's door before meeting anybody and got no riddle — a door
  across the castle that is inert until the player has spoken to somebody reads as a broken
  door, and so does a J key that does nothing. Both are repeated in all three non-terminal
  stages now; what `arrive` gates is the objective, which is the only thing it should.
- **A toast that hides itself after 3.2 s cannot be asserted after two rAF** (#487). The
  browser beat read the toast's `hidden` class and passed four runs out of five; the fifth
  came back with the right text and the class already back on. Two `requestAnimationFrame`s
  under a software rasteriser with no compositor can take longer than three seconds, which
  makes it a wall-clock assertion under exactly the renderer #53 calls inconclusive. It reads
  the text, which persists, and says in the comment why it does not read the class.
- **The four overlays scroll with `safe center`** (#132 again, #488). The journal holds up to
  39 clues and the accusation panel holds thirteen names with the whole journal under them,
  so both are taller than the window on a short screen. `align-items: center` on an
  overflowing flex child puts its own top above the scroll origin where no scrollbar reaches,
  which is how Torchbearer's title screen lost its top three buttons. Written in before it
  could happen rather than after, because this is the second project to meet it.
- **Nine breaks, and the one that needed its own rail** (#489). Both the ones `WISHLIST.md`
  named fired: unhooking Present from the manager failed eight assertions including
  `presenting summons-is-stewards to the Steward moves him to pressed — state default, holds
  false`, and `accusation.needs: 1` failed six including `one clue is refused — refusals 0,
  stage wrong`. Of the seven others, six were caught by an assertion whose comment claims
  them. The seventh was not, the first time: moving `walk-crosses` to level 1 was caught by
  `validateMystery`'s existing level rail rather than by the new places check, so the break
  was redone as a move into `outer-ward` — a room `mystery.json` really has and the plan
  builds no bounds for, because it is open ground — and the places check fired on its own
  message, `walk-crosses: names room outer-ward on level 0, which the plan does not build`.
  A break that is caught by a different assertion than the one whose comment claims it is not
  a verified rail (#34).

**Q55 is answered, and it is the plan's answer** (#490). "Does the fourth bell force the
accusation?" stood in front of this row and nothing else, so this session answered it: **yes**.
Phase 1 had already shipped the engine half — `ring()`'s fourth moves no watch, returns a
`demand` and emits `bell:4` — so an open day that ends only when the player chooses would have
meant unpicking a rail that was already green, not declining to write one. `bell:4` moves the
frame to `accusing`, whose `enter` opens the panel, which is also what brings a save resumed
there back to it. The player can still ask for the panel at any time by talking to the
Constable; what the bell removes is the option of never answering, which is the whole shape of
the fiction — the inspector rides in tomorrow and the Constable wants a clean sheet by Vespers.
Two transitions in `data/quest.json` reverse it.

**`npm run play` is unrun** (#53). It walks the whole intended path now — twelve people, ten
pieces of evidence, three bells, the cross-wall crossing, a reload at Sext, the accusation
panel and the epilogue, 102 assertions against 34 — and none of it has been seen on a GPU,
the same as Phase 6's. **The v2 arc is finished**: seven phases, seven sessions, PRs #306 to #320.

## Castle Conundrum moves to its own repository (2026-09-15)

**Devon's instruction, 2026-09-15.** The project leaves
`GreyVersusBlue/tools-and-games/Projects/Castle Conundrum/` and all work on it
happens here from now on. Hosting and link updates are his; nothing here
touches DNS, Pages settings, a deploy workflow or a redirect. The board card
and the preview and og images stay in `tools-and-games` and keep pointing at
the current URL until he relinks.

**The history came with it.** `git subtree split --prefix='Projects/Castle
Conundrum'` over `tools-and-games` at `bd3263e`, 30 commits, every historical
version of the GLBs and textures among them. The `.git` size is in the pull
request body.

**Devon's brief said decisions #389 to #438 move.** That range stops in the
middle of Phase 3 and would have left Phases 4 to 7 — #439 to #490, which is
the ground floor, the upper level, the wall walk, the twelve NPCs and the
mystery going live — behind in a repo with none of the code they describe. The
whole of this project's record moved instead: #389 to #394 and #411 to #490,
which is every section `tools-and-games`' `HISTORY.md` filed under Castle
Conundrum. #395 to #410 are Orbital's, Closing Time's, Numina's and the School
Generator's and stayed where they are.

- **Castle Conundrum is its own repository, and `tools-and-games` keeps a
  pointer rather than a copy** (#491). The project directory is deleted there,
  along with `site-ci.yml`'s Castle Conundrum matrix entry, its `BACKLOG.md`
  rows, its Ownership table row and its Questions block. Three files that were
  always this project's and lived elsewhere for want of a home came with it:
  `Tools/board-check/play-castle.mjs` (which that repo's `ownership.json` had
  been recording as Castle Conundrum's in prose, at line 85, because the sweep
  it feeds only reads `.html`), and the parts of `harness.mjs` and `drive.mjs`
  the two browser suites call. `harness.mjs` came across a third of its old
  size: two of its three jobs were site-wide shims, one for Google Fonts and
  one for a jsDelivr copy of three, and this page has never asked either host
  for anything.
- **A decision number resolves in its own repo's `HISTORY.md`** (#492). From
  #491 the two files number independently. This is a real collision — both will
  eventually have a #495 — and the alternative was worse: renumbering this
  project's decisions from 1 would have broken about ninety citations in `src/`
  and `test/`, and reserving a band in one repo for the other's growth is a
  coupling between two repositories that were just separated. Each file says
  which numbers are its own; a citation means the file it is written in.
- **Vendoring splits in two, and only one half changed** (#493). The half that
  changed: **manual vendoring of code is dropped.** `libs/three.module.js` and
  `libs/addons/` are deleted and three is `"three": "0.169.0"` in
  `package.json`. A hand-copied 1.2 MB file with no record of where it came
  from or how to get the next one is not a supply chain; npm is. The half that
  did not change: **everything the page fetches at runtime comes from its own
  origin, and no CDN, font host or asset host is ever contacted.** That was
  always the point of vendoring and it is untouched — three is resolved at
  build time and ends up inside `dist/bundle/`, not requested from anywhere.
  The rule is asserted rather than promised: `test/harness.mjs` refuses every
  offsite request and records it, and `test/built.mjs` fails on a non-empty
  `page.__blocked`. **Assets stay committed**: the 43 MB under `assets/` is in
  git and stays there. Only code dependencies move to npm.
- **There is a build step, and it is Vite** (#494). This replaces the old
  repo's first house rule, "no build step — static files served from the repo
  root, no bundler, no transpiler". That rule was right for a repo of forty
  pages that Firebase served whole, where a build step per project meant forty
  build steps. It is wrong for one project whose entry point already needed an
  import map to resolve two bare specifiers, which is a build step written by
  hand in HTML. `index.html`'s import map is deleted; not one `import`
  statement in `src/` changed, because the map's `"three"` and
  `"three/addons/"` are exactly what Vite resolves from `node_modules`.
  `npm run dev`, `npm run build`, `npm run preview`.
- **#17 does not cross, because there is nothing left to vendor a second copy
  of** (#495). "Each project vendors its own copy; nothing is shared across
  projects" existed to stop a shared `Pathfinder/fonts/` becoming a coupling
  between three pages in one repo. This repo is one project. Its one
  cross-project import — `src/save.js` reaching three levels up into
  `assets/js/gvb-save.js` — is resolved by the rule's own logic: the file is
  copied to `src/gvb-save.js` and the import is relative (#502).
- **The Ownership table does not cross** (#496). It existed because a dozen
  projects shared one repo and sessions kept editing each other's files. Here
  the repository boundary is the ownership boundary, and a table that says
  "this project owns everything" is a table that will go stale without ever
  being read. `BACKLOG.md`'s `Claimed` column stays: that one is about two
  sessions taking the same row, which a single-project repo does nothing to
  prevent.
- **#382's batch sizing does not cross** (#497). "Up to 6 quarters, 3 halves,
  or one 1; halve it if the batch spans areas" was measured against a repo
  where the cost that scaled was the closeout — a suite, a `HISTORY.md` entry
  and a backlog rewrite *per area*. There is one area here, so the second axis
  is always 1 and the first is a number with nothing behind it. What replaces
  it: **a batch is what fits in one pull request and can be closed out in one
  sitting**, which is a judgement, and the `Size` column in `BACKLOG.md` is
  there to inform it. A 2+ row is still alone and still leaves its row standing
  with the text rewritten to say what is done.
- **The three-file BACKLOG / HISTORY / ARCHIVE split does not cross** (#498).
  `ARCHIVE.md` held work that will not be done, and it existed because five
  archived teaching tools needed somewhere to be that was not the ranked table
  (#206). Nothing here is archived and nothing is likely to be: a Castle
  Conundrum idea that will not be done is a line in `PLAN.md`'s "What this
  leaves for a later arc", which is where the ones that exist already are.
  Two files, `BACKLOG.md` and `HISTORY.md`, and `PLAN.md` beside them.
- **The asset ceiling is 200 MB** (#499). The old number was 44.4 MB and it was
  never about this game: it was a share of one Firebase deploy carrying forty
  pages, and Castle Conundrum sat at 43.18 MB against it with no room to
  restore a texture set without arguing for it. This repo deploys alone. 200 MB
  is asserted in `test/built.mjs` against the built `dist/`, which is what
  actually ships; the current build is 42.0 MB, so the headroom is real and it
  is what `BACKLOG.md`'s rank 1 is for — KTX2/Basis, meshopt and Draco should
  be adopted because they make the page load faster, not because a ceiling
  forced a texture out.
- **`src/castle-plan.js` is the single source the builder and every suite read,
  and `test/plan-vs-scene.mjs` is the net** (#500). This has been true since
  Phase 2 and was never written down as a rule; it was visible only in the
  shape of the files, which is how a rule gets lost. Stated: neither side
  computes a transform the other cannot see. The plan says where a piece goes,
  `castle-builder.js` puts it there and tags it with a `planId`, and
  `plan-vs-scene.mjs` loads the page, takes every tagged object's live `Box3`
  and diffs it against the plan's box at 0.01 m. Broken on purpose for this
  migration: `barsParts`' `max.y` changed from `height` to `height * 0.9`, one
  number, and the suite failed through the new Vite runner on the per-piece box
  diff — `FAIL "cell-bars" (fixture) is 0.250 m off the plan`, plan
  `y 0.000..2.250` against scene `y 0.000..2.500`, exit 1, after 308 objects had
  been read.
- **The suites run against source; one smoke check loads the bundle** (#501).
  Six are Node against `src/`. `plan-vs-scene.mjs` drives `vite dev`, which
  serves the files a developer edits. `built.mjs` is the only one that loads
  `dist/`, and what it asks is narrow on purpose: not "did it build", which
  Vite answers itself, but "does the built page load the same castle the source
  page loads". Both pages are loaded and the sets of files they fetched under
  `assets/` and `data/` are diffed — 127 files. Nothing else can catch a build
  that dropped one, because every glTF and every texture is fetched by a string
  out of `data/scene-config.json` at runtime and no bundler can see any of it.
  **Two things about that assertion had to be fixed by breaking it** (#34,
  #147). One `.jpg` was deleted out of `dist/` on purpose. First run: green.
  The diff compared what the page *requested*, and a page asks for a missing
  texture just as loudly as for one that is there; only the console-error
  assertion caught it, and the comment above the diff claiming it caught a
  dropped file was simply wrong. Changed to compare what the server *served*,
  under status 400. Second run: still green, and for a better reason — Vite's
  default `appType: 'spa'` answers *any* miss with `index.html` at status 200,
  including a request for a .jpg, so nothing on that page ever 404s. With
  `appType: 'mpa'` in `vite.config.js`, which is what a one-page site with no
  client-side routing should have had anyway, the third run failed on the
  intended assertion: `FAIL the built page fetched the same 127 files under
  assets/ and data/ as the source page — 1 missing
  (/assets/poly-haven/wood_planks_1k.gltf/textures/wood_planks_diff_1k.jpg)`.
- **`gvb-save.js` is vendored into `src/`** (#502). `src/save.js` imported
  `../../../assets/js/gvb-save.js`, a 390-line site-wide module that eleven
  projects in the old repo share. It is copied to `src/gvb-save.js` and the
  import is `./gvb-save.js`. The cost is a fork: a fix to the shared copy will
  not reach this one. The alternative was publishing it to npm or pulling it
  from a URL, and one of those is Devon's call about a file eleven other
  projects depend on while the other breaks #493's runtime guarantee. **The
  storage key did not change and must not** (#36): `castleConundrumSave_v1`,
  `game: "castle-conundrum"`, version 1, as #413 set it.
- **No spaces in paths** (#503). The old home's URL carried `%20` in every link
  because the project directory was `Castle Conundrum`; the split dropped that
  by making the project the repo root. Two asset directories had the same
  problem and were renamed with it: `assets/Poly Haven` to
  `assets/poly-haven`, and `assets/kenney_retro-fantasy-kit/Models/GLB format`
  to `Models/glb-format`. Both are named once each, as `polyhavenBase` and
  `kenneyBase` in `data/scene-config.json`, so the rename is two config lines
  and three literals in `test/assets.mjs`. The Kenney kit's three `.url`
  shortcuts were renamed for the same reason and kept for the attribution they
  carry.
