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

## The page gets a URL, and the root stops being servable (2026-09-15)

Same day as the move, one round after it. Devon relinked the board card in
`tools-and-games` to
<https://greyversusblue.github.io/castle-conundrum/> (that repo's #493), which
settled where this page lives and turned up something the move had quietly
broken.

- **This page is served from GitHub Pages at
  `https://greyversusblue.github.io/castle-conundrum/`, and `og:url` says so**
  (#504). It had been
  `https://greyversusblue.com/Projects/Castle%20Conundrum/`, which is a path
  that no longer exists anywhere: `tools-and-games` deleted the directory when
  the project left. A share card pointing at a 404 is worse than no card.
  **`og:image` still points at `greyversusblue.com/assets/og/castle-conundrum.jpg`
  and that is deliberate**, not forgotten: the preview and og images stayed in
  that repo when the project left, the URL resolves, and a crawler fetching it
  is not *the page* fetching it, so #493's same-origin rule is untouched. If the
  image is ever moved here, that meta line is the one to change.
- **Pages serves `dist/`, built by `.github/workflows/pages.yml`, and the repo
  root is not servable on its own** (#505). This is the price of #494 and it
  was invisible until there was a URL to point at. Under
  `Projects/Castle Conundrum/` the directory was directly servable: `index.html`
  carried an import map, so a static host could hand a browser the source and
  the browser resolved `three` itself. Deleting that map in favour of Vite means
  `src/main.js` opens with a bare `import * as THREE from 'three'`, which no
  browser can resolve without a build.

  **Checked rather than reasoned about.** This checkout was served by a plain
  `node:http` static server — no Vite, nothing else changed — and opened in the
  same headless Chromium the suites use:

  ```
  pageerror: Failed to resolve module specifier "three".
             Relative references must start with either "/", "./", or "../".
  start overlay shown: false | loading says: "Summoning stonework…"
  ```

  The page hangs on its loading screen forever. So "deploy from a branch" would
  publish exactly that, and **the repo's Pages source has to stay GitHub
  Actions**; `configure-pages` sets it with `enablement: true` on the first run.
  The workflow is build-and-publish only and runs no suites: `ci.yml` already
  runs `npm run build` on every push to `main`, so a build that cannot succeed
  fails there first and more loudly.

  `base: './'` in `vite.config.js` is what makes the subpath work, and it was
  already there. Every emitted URL is relative and every runtime fetch is
  relative to the document (`data/scene-config.json`, and every asset path
  inside it), so the same `dist/` serves correctly under `/castle-conundrum/`
  and under a bare domain later. Nothing hardcodes a prefix, and nothing should
  start.

  **That was checked too, not assumed**, because "relative paths will be fine"
  is the kind of claim that is wrong once and expensively. `dist/` served under
  a `/castle-conundrum` prefix by a plain static server, the way Pages serves a
  project site:

  ```
  castle finished building under /castle-conundrum
  asset+data files served: 127
  offsite requests: 0
  errors: 0
  Enter the Castle works: true
  ```

  127 is the same count `test/built.mjs` diffs at the root, so the prefix costs
  nothing and hides nothing.

## KTX2 for the textures, meshopt for the meshes (2026-09-15)

**Ranked row 1, claimed on `main` before the work started (#283, PR #4) and
merged as one PR.** A 1 on its own. Decisions #506 to #510.

The reason for the row was never weight. `dist/` was 42.0 MB against a 200 MB
ceiling (#499), so there was no room to fight for. It was that every 1k jpg was
decoded to RGBA and handed to the GPU at full size, and 105 textures over one
castle came to **317.9 MB of video memory**. That is the number this row moved.

**Measured off the live page, before and after, by walking every material on
every mesh in the scene and adding up each texture's real GPU footprint —
mipmaps included, compressed textures by their actual block bytes:**

```
before   105 textures, 317.9 MB   (0 compressed)
after    105 textures,  79.9 MB   (79.3 MB compressed, 0.6 MB not)
```

**4.0x, 238 MB off the GPU.** The 0.6 MB that is still RGBA is the Kenney kit's
64 px pixel art, which is left alone on purpose (#508).

Disk barely moved, and one half of it moved the wrong way, exactly as expected:

```
assets/ total          41.20 MB -> 39.47 MB
  textures (jpg->ktx2) 29.94 MB -> 31.75 MB      up 1.8 MB
  Poly Haven geometry   4.33 MB ->  2.65 MB      down 39%
  the three NPC bodies  5.27 MB ->  3.35 MB      down 36%
  the Kenney kit        1.60 MB ->  1.60 MB      untouched
dist/                  42.0  MB -> 40.9  MB
```

- **A committed re-encode, over the originals, not a build step** (#506).
  `tools/encode-assets.mjs` is run by hand (`npm run assets:encode`), needs
  KTX-Software's `ktx` on PATH, and writes over what it reads. Three reasons,
  in order: seven suites read `assets/` off disk at repo-relative paths;
  `test/built.mjs` diffs the file set the dev server and the bundle serve, and
  a build-time pipeline would make `npm run dev` serve jpg while `dist/` served
  ktx2, which is that assertion failing by construction; and #493 says assets
  live in git. **The originals are not kept**: git history is the originals
  (#390's reasoning), and a second copy on disk is exactly what
  `test/assets.mjs` check 4 exists to refuse. The script is a deliverable
  rather than a convenience — BACKLOG ranks 3 and 8 both add assets, and an
  asset that did not come through it is an uncompressed one nothing notices.
  Re-running is safe: it skips a texture already in KTX2 and a file already
  carrying `EXT_meshopt_compression`, so adding one asset encodes that asset.

  It uses `@gltf-transform/core`, `/extensions` and `/functions` rather than
  `@gltf-transform/cli`, which SPECS.md named. The CLI is a wrapper over those
  three plus `ktx`, and it brought 234 packages into `devDependencies` for a
  script that shells `ktx` itself so it can pick a codec per texture slot. The
  libraries plus `sharp` and `meshoptimizer` are 84.

- **ETC1S for colour, UASTC for anything whose channels mean different things**
  (#507). Diffuse and `rough` go to ETC1S (`basis-lz`); **normal and `arm` go to
  UASTC**, which is where this departs from SPECS.md's recommendation of ETC1S
  for `arm`. ETC1S quantises RGB jointly against a shared palette. That is right
  for a photograph of stone and wrong for a normal map, whose channels are the
  x, y and z of a direction — which SPECS.md already said — and wrong in exactly
  the same way for an ARM map, whose channels are ambient occlusion, roughness
  and metalness. `src/assets.js` feeds an ARM map's blue channel straight into
  `metalness`, so colour bleed between its channels is not a soft artefact: it
  is the sheet-metal castle wall `loadPBRMaterial`'s own comment describes.

  The price is disk, and it is the +1.8 MB above: a 1k UASTC map is about 1 MB
  before supercompression whatever the source, so the props' small ARM jpgs
  (130-210 KB) came out three times larger. Allowed under #499 and predicted by
  SPECS.md. **Load bytes for textures went up and GPU bytes went down 4x**, and
  saying it the other way round would be a nicer sentence and not a true one.

  Every input is widened to three channels through `sharp` first. Four `rough`
  maps are single-channel greyscale JPEGs, and encoding those as `R8_UNORM`
  gives a red-only texture — three reads roughness out of **green**, so that is
  a roughness of zero everywhere and a castle of mirrors.

- **meshopt on the Poly Haven props and the three NPC bodies; nothing on the
  Kenney kit; no Draco anywhere** (#508). The kit is 1.6 MB across 106 GLBs of
  64 px pixel art: the saving would not pay for the risk, because
  `test/assets.mjs` measures the gate archway's opening out of
  `wall-fortified-gate.glb` triangle by triangle and that is the one
  measurement in the project that reads raw index and position buffers. Draco
  buys over meshopt only on dense static meshes and there are none here; it
  would cost a 1 MB decoder under the origin and a second decode path in Node.

  **The Node reader had to learn to decode** (`test/gltf.mjs`), which SPECS.md
  named as the constraint the brief missed. A meshopt bufferView carries no
  bytes of its own — it names a range in another buffer, a mode and a filter —
  so `viewBytes` decodes through `meshoptimizer`, at a top-level `await` so
  `triangles` and `partsOf` stay synchronous and five suites stay unchanged.
  And meshopt quantises: positions are normalised 16-bit integers with the
  scale put back on the node, and **an accessor's `min`/`max` are stored in the
  same quantised units**, so `partsOf` dequantises them too. Without that, every
  plan box is 32767 times too big.

- **The Basis transcoder is copied out of the pinned `three` package at build
  time, not committed** (#509). `KTX2Loader` fetches `basis_transcoder.js` and
  `.wasm` by URL, so Rollup never sees them. `vite.config.js` writes them to
  `dist/decoders/basis/` and answers the same path from `node_modules` on the
  dev server, which keeps both pages fetching the same file set and keeps
  everything on this origin (#493). Copied rather than vendored because a
  hand-copied decoder nothing can tell you the provenance of is what #494
  deleted. The path handed to `setTranscoderPath` is relative, so the subpath
  deploy still works (#505).

- **`test/built.mjs` compares `decoders/` as well as `assets/` and `data/`, and
  asserts the format by name** (#510). Two new lines: both transcoder files
  present in `dist/`, and both pages fetched the same non-zero number of `.ktx2`
  with no jpg or png under `assets/poly-haven` or `assets/NPCs`. `test/assets.mjs`'s
  complete-set rail grows one line: every declared map path ends `.ktx2`.

### Broken on purpose, from green, before any of it was believed (#34)

The baseline was all eight suites green. Each rail was then broken and watched
to fail, and the failing assertion is quoted.

1. **The build stops copying `basis_transcoder.wasm.`** `test/built.mjs`, two
   failures, which is the point — if only the new line had fired, the old one
   would not be catching what its comment claims:
   `FAIL dist/decoders/basis/basis_transcoder.wasm is there` and
   `FAIL no console errors — THREE.GLTFLoader: Couldn't load texture textures/WoodenTable_01_nor_gl_1k.ktx2`.
2. **One material pointed back at its old `.jpg`.** `test/assets.mjs`, four
   failures, the first naming the material and the slot:
   `FAIL material "castle_wall_slates"'s diffuse is .jpg, not .ktx2`, then
   `FAIL nothing references ...castle_wall_slates_diff_1k.ktx2` and
   `FAIL material castle_wall_slates's diffuse needs ....jpg, which is not there`.
   That second pair is check 4, and it is the same failure a pipeline that
   skipped one texture set would produce.
3. **`setMeshoptDecoder` commented out.** `test/plan-vs-scene.mjs`, one failure
   per compressed prop:
   `FAIL "WoodenTable_01" loaded as a magenta placeholder box — its model is missing or broken`.
4. **`partsOf` dequantising by 30000 instead of 32767**, a 9% error.
   `test/plan-vs-scene.mjs`:
   `FAIL "GothicCabinet_01" (prop) is 0.109 m off the plan`, against a 0.01 m
   tolerance, and the same for every meshopt file. Removing the dequantisation
   altogether does **not** produce a clean failure — the boxes come out 32767x
   too large and `makePlan` wedges before any assertion runs — so the break was
   sized to what the rail is for rather than to the largest wrong number
   available.
5. **The new rails run against the uncompressed assets this row replaced**, out
   of a worktree at the pre-change commit: `FAIL both pages fetched the same 0
   KTX2 textures — bundle 0, source 0` and `FAIL and neither asked for a jpg or
   a png under assets/poly-haven or assets/NPCs`. A silent fall back to jpg
   would otherwise pass every other line in that suite.

One rail failed first time for real, which is the best evidence any of them are
live: `and neither asked for a jpg or a png under assets/` named
`cobblestone.png` out of the Kenney kit. The assertion was wrong, not the
build — the kit is left uncompressed on purpose — and it was narrowed to
`assets/poly-haven` and `assets/NPCs`, which is the scope the script covers
(#147: when a break lands somewhere unexpected, ask whether the assertion's
comment is the thing that is wrong).

### What this did not do

**Nobody has looked at it.** Every number above is off a software-rendered
headless Chromium, which is fine for bytes and geometry and says nothing about
whether an ETC1S diffuse bands on a 8 m wall or a UASTC normal holds up at a
grazing angle (#53). Ranked row 4 is the GPU run, and a look at the walls is
now part of what it is for.

## Stairs, crowns and floors: three things a GPU saw and no suite could (2026-09-15)

**Not a ranked row.** Devon walked the castle on a real machine and reported
four things: a player who cannot leave a flight at its top, turret parapets
with air under them, ground floors that flicker, and rooms that all look the
same. The first three are geometry and shipped as one PR on
`claude/fervent-clarke-566ery`; the fourth is the next PR. Decisions #511 to
#514. Every one was invisible to `npm test` for the same reason: the grid
samples a point, `plan-vs-scene.mjs` compares boxes that carry the same offset
the scene does, and a depth fight is not a property of a plan. Each fix came
with the check that would have caught it, and each check was broken on
purpose from green first (#34).

- **A slab's collider well is a body's radius wider than its surface well, and
  the controller's move is a plan function** (#511). The slab beside a stair-well
  is a collider (#458) and a wall to a body whose feet are more than HEAD_LOW
  under its top; on a 1:1 flight that is everything but the last 0.2 m of run.
  A 0.45 m body pushed clear of the strip past the well's head stopped with its
  feet at 3.45, where the floor at 4.0 was a 0.55 m climb against a 0.35 m
  step. The grid's top cell sat exactly a step under the slab (#459) and every
  suite was green. No rule keyed on the feet can fix it: the body is held a
  radius short of the edge whatever the band says. So the collider holes are
  grown by `BODY_RADIUS` and the surface holes are not, which keeps the well's
  edge a wall to a body on the slab. `moveBody` in `castle-plan.js` is the
  controller's one-axis move over the plan's colliders, so Node can walk it:
  `layout.mjs` check 8 walks a body up and down all 14 flights.
- **A flight's run is 3.3 m, and the grid reads a flight at the cell edge**
  (#512). Check 8's first run said something else as well: a body descending an
  upper flight stopped at feet 4.40, 0.40 m short of the foot, pushed by
  `north-curtain-west-2`. A curtain run drives 2 m into every tower it meets,
  and a 3.9 m flight centred on the tower ended 0.05 m from that pier at both
  ends. Widening nothing fixes that; clearance does. At 3.3 m of run each end
  has 0.35 m of floor, the body reaches within 0.1 m of either end, and at the
  head its feet are at 7.78, past the 7.7 where the pier's top stops being a
  wall. The steeper flight then broke the grid, which connected two cells only
  when their centre heights were within a step, and a 0.5 m cell on a 3.9 over
  3.3 flight is 0.59 m of rise; `nothing on level 1 can be reached`. Two cells
  meet at the edge between them, so a cell on a flight is now compared at the
  flight's height at that edge, which is where a body crosses. Headroom where
  the two flights overlap went from 2.05 m to 4.0. 11 of the 28 walks in check
  8 leave the flight through the crescent beside it, as `play-castle.mjs` has
  always described the walk.
- **No two upward faces share a plane** (#513). The clerk's office, the kitchen
  and the Great Hall flickered: base pavers, the outer ward's grass and the
  room's floor were three meshes at y 0 over one footprint, and the polygon
  offset meant to settle it was the same offset on two of them, on materials
  shared by every mesh of that texture. `oneFacePerPlane` in `castle-plan.js`
  makes the plan say who owns every top: a ground piece is cut round every
  ground piece after it, a run's top under a floor stops at the floor's
  underside, and the later of two runs sharing a top gives way round the
  earlier. Only the drawn boxes and their union change; colliders and surfaces
  keep the whole stone. `buildGround` draws the strips with world-space UVs and
  the offsets are gone. `layout.mjs` check 10 listed 77 pairs on the baseline:
  17 at y 0, 24 decks flush in curtain tops, the curtain stubs and sills level
  with the tower slabs, and 11 wall corners.
- **A drum wears a crown, and a run's merlons reach the drum's face** (#514).
  `battlement.glb` is authored with its body 0.3 to 0.6 behind its origin, and
  `place` moves nothing in plan, so at scale 4 every merlon stands 1.2 to 2.4 m
  outward of its anchor. On a 4 m run that is the outer 0.8 m of the wall and
  0.4 m over the face. On a drum, anchored on the rim at radius 4, it was
  radius 5.2 to 6.4: twelve merlons per tower hanging in the air. The drum's
  parapet is now its own sectors carried on above 12, alternating 13.5 and
  12.6, built stone with the sector colliders the drum already had (#432), so
  the drum's box grows and `plan-vs-scene.mjs` would see a builder that forgot
  it. The merlon is 0.1 under the kit's 1.6 so the last run merlon, whose trim
  is now taken at its body's outer edge so it meets the drum's face, shares no
  top with it. 157 merlons to 61. `SPECS.md`'s turret row said the merlons stood
  on the rim; it says what is there now.

**The breaks, from green.** Check 8 with the exact well: `nw-tower flight 1
cannot be climbed: the body stops at feet 3.37, 0.45 m short of the top edge at
3.90, pushed by floor-nw-tower-1-3`. Check 8 with the 3.9 m run: `kitchen-tower
flight 2 cannot be descended: the body stops at feet 4.40, 0.40 m short of the
bottom edge at 4.00, pushed by north-curtain-west-2`. Check 10 with the Great
Hall's hole skipped: `outer-ward and floor-great-hall share a top at 0.000 over
64.00 m² at x -14.0..-6.0, z 6.0..14.0`; with the decks left flush:
`north-curtain-west and north-curtain-west-walk share a top at 8.000 over 16.76
m²`. Check 9 with the rim merlons back: `merlon-0 at y 12.00 has 0% of its
footprint over stone`. Check 9b with a 0.2 m crenel: `nw-tower sector 1 crowns
at 12.20, under the 12.30 a body on the lid would need stopping by`.

**What this did not do.** None of it has been seen on a GPU (#53). Check 10
closes the flicker as a matter of geometry, and the GPU run (ranked row 3) is
where somebody looks.

## Knowing where you are: a room line, eight tints, thirty-six landmarks (2026-09-15)

**Not a ranked row; the fourth thing Devon saw**, after #511 to #514 shipped
the other three (PR #6). "It feels like you're constantly going in circles,
because we might be." Read against the data it was true: 25 of 36 rooms held
nothing, every room above the ground among them, every upper floor was the
same plank, all eight drums were one stone at one size, and the HUD had the
bell and the objective and no bearing. Decisions #515 to #517, one PR on
`claude/fervent-clarke-566ery-variation`.

- **The HUD says where you are** (#515). `nav.roomAt(x, z, feet)` in
  `stations.js` asks `inRoom` of every room and settles the overlap that
  function's comment warns about: a disc beats a box, so the cell beats the
  Great Hall's square round it and a tower's top room beats the walk crossing
  it. Storeys need no rule, and the first version had one: "highest level
  wins" was flipped to lowest and nothing failed, because `inRoom` reads the
  feet against the floor and no two floors are within a metre (#34). Open
  ground is told apart by the three gates' x, which the gates now carry. The
  names are `mystery.json`'s, and the fourteen tower rooms it does not name
  got one in `scene-config.json`. The line is written on the frame the
  answer changes. Two rails: `mystery.mjs` holds `roomAt` to the schedule at
  all 45 stations, allowing a walk station that is also inside the tower the
  walk crosses (the sentry "by the Kitchen Tower" stands 2.24 m from its
  centre) and never the other way round; `plan-vs-scene.mjs` reads the DOM
  with the camera settled in each of the 36 rooms (#39).
- **Eight drums, eight tints, one texture set** (#516). A `tint` on a drum,
  run or room multiplies the stone's diffuse for that piece; `assets.js`
  caches every texture by URL so the eight materials read one set and the
  GPU holds one. The outer four are cool (blue-grey, warm grey, green-grey,
  slate) and the inner four warm (sand, gold, ochre, pale). The rail reads
  each drum's live material colour against the tint the plan gives it: the
  first version asked only for eight distinct colours, and a drum whose tint
  was deleted came back white, which is distinct too (#34).
- **Something in every room** (#517). 36 `courtyard.placements` from the kit
  pieces already committed and never used: barrels, crates, a ladder, a hoist,
  a pile of stone, a timber frame, one or two per room, each clear of the
  flights, the stations and the wells, on the room's own floor by `base`.
  `layout.mjs` check 11 refuses a room that is not open ground and not shut
  with nothing in it. The porter's lodge read as furnished and was not: the
  one thing over it was the walk-bar, 8 m up on the walk.
- **New texture sets did not happen here, and are a row** (#518). Devon said
  yes to downloading Poly Haven sets and KTX-Software in this session; the
  container's network policy answers 403 to both hosts (npm is the only
  registry it reaches, and `ktx` is not on it). The sets are chosen and the
  row is written against the encode pipeline (#506), for a machine with
  `ktx`.

**The breaks, from green.** `mystery.mjs`, box over disc: `at prime,
prisoner stands in cell and roomAt says great-hall`; one ward for all open
ground: `at sext, lady stands in inner-ward and roomAt says outer-ward`.
`plan-vs-scene.mjs`, the HUD write deleted: `standing in clerk-office the
HUD's room line reads "", and roomAt names it "Clerk of Works' office"`; the
Prison Tower's tint deleted: `prison-tower wants no tint at all and shows
ffffff`. `layout.mjs` check 11, the dormitory emptied: `dormitory (level 1)
has nothing in it`.

## The castle makes a noise: footsteps by surface, and the bell (2026-09-15)

**Ranked row 1, claimed on `claude/festive-hopper-nf7391` (#283, PR #8).**
`scene-setup.js` created an `AudioListener`, added it to the camera and
returned it, and `main.js` had never destructured it. Seven phases, twelve
suspects, four bells, and not one sound. Decisions #519 to #522.

- **Both sounds are synthesised, and there is not a byte of audio in this
  repo** (#519). `SPECS.md` recommended synthesis for the footsteps and a
  recorded CC0 bell "if one is found"; none was looked for, because a file
  buys a licence question, a new `assets/audio/` for `test/assets.mjs`'s
  reachability sweep to grow (#390), and a place in the encode pipeline that
  has no codec for it (#506), against a sound that six sine oscillators
  make. `src/audio.js` builds a one-second white-noise buffer once and reads
  it from a random offset per footfall, through a biquad and an exponential
  decay; the bell is a 35 ms filtered strike transient and six partials at
  the standard inharmonic ratios of a tuned bell — hum 0.5, prime 1, tierce
  1.2, quint 1.5, nominal 2, on a 330 Hz prime, about a hundredweight. The
  tierce is the whole difference between a bell and a chime. Every number is
  in `data/sounds.json` and `src/audio.js` holds no default of its own. The
  bell is positional, a plain `PannerNode` at the bell piece's centre:
  `THREE.AudioListener.updateMatrixWorld` already writes the camera's
  position and orientation into `context.listener` on every frame the
  renderer draws, so spatialising it needed no three import at all, and
  `src/audio.js` has none. That is what lets `stepClassOf` be a pure function
  `test/layout.mjs` imports in Node.
- **A surface says what it is made of** (#519, same pass). `plan.surfaces`
  carried an id, a box and a level, and the material was on the piece with
  the same id — except for the three window sills, which have no piece at
  all. `makePlan` now copies `material` and `kind` onto every surface in one
  pass before it returns, and the sills take the run's own stone where they
  are pushed. `data/sounds.json` maps material to step class, then kind for
  the two kinds that never have a material (the kit's `stairs-stone.glb` and
  a Poly Haven prop top). No default: a surface neither map answers for is a
  failure in Node, which is `layout.mjs` check 12. The spread the castle
  actually has is 47 planks, 22 stone, 1 carpet, 1 grass.
- **The bell rings off the engine's event, not the graph's action** (#520).
  `SPECS.md` named `quest-manager.js:103`'s `ringBell: () => {}` as the hook.
  It is the wrong one: that action runs only for a stage carrying a
  `bell:<n>` transition, and a man pulling a bell rope is not conditional on
  the quest graph listening. `handleBell` fires the sound when
  `engine.ring()` returns a `bell:` event, which every ring emits, which the
  fourth ring emits although it moves no watch, and which a day already ended
  emits none of. So the fourth bell rings and a press at the rope after the
  verdict is silent.
- **A step every 1.6 m, not every 0.75 m** (#521). `SPECS.md` said ~0.75 m
  walking and ~1.0 m sprinting, which is a real person's stride and wrong
  here: `WALK_SPEED` is 5.2 m/s, so 0.75 m is 6.9 footfalls a second and
  1.0 m under the 1.75 sprint multiplier is 9.1. This player does not walk,
  he runs. 1.6 m and 2.2 m give 3.25 and 4.1 a second. The accumulator counts
  ground **actually covered**, not asked for, so a body pressed into a wall
  goes quiet, and `standAt` is asked once per footfall rather than once per
  frame — about three times a second against sixty.
- **A `SPECS.md` section is named, not numbered** (#522). Every section
  opened with a rank, every section referred to every other section by rank,
  and this row shipping shifted ten of them. Worse, the file was already a
  row out of step with itself before anything had shipped: "The GPU run" is
  headed "Ranks 3 and 4" and its own subheadings read "Scope, rank 4" (the
  play run) and "Scope, rank 5" (the images), with "Rank 4 cannot start until
  rank 3 has run" under Dependencies meaning the images and the run. A number
  that is wrong in the file that defines it is worse than no number. Sections
  name each other by title now; the opening `**Rank N.**` line stays as a
  pointer into `BACKLOG.md` that the session shipping a row updates, and is
  the only rank number left in the file.

**What is not here.** No NPC footsteps (`SPECS.md`'s recommendation, taken:
twelve walkers at a bell is a mix, not a feature), no ambience, and no
assertion anywhere about a sound. `harness.mjs` already launched with
`--mute-audio` and nothing in CI hears anything (#53); what the castle sounds
like is a question for a machine with speakers, and the two numbers most
likely to be wrong — the stride and the bell's 330 Hz prime — are one data
edit each.

**The breaks, from green.** `layout.mjs` check 12, `dirty_carpet` deleted
from `byMaterial`: `"floor-royal-apartments" is a dirty_carpet floor and
data/sounds.json says nothing about what standing on it sounds like`, and the
second half of the same check caught the other side of the same edit,
`data/sounds.json defines step class "carpet" that no surface in the castle
resolves to`. `quest.mjs`, the sound put back to a no-op the way it was:
`four rings, four bells — 0`.

## Four tower roofs, and the turrets stop being holes (2026-09-15)

**Ranked row 5 at the time it was taken, "The turrets and the tower tops"
(rank 6 before sound shipped), claimed on `claude/festive-hopper-nf7391`
(#283, PR #8).** Eight drums 12 m high, a level-2 room at 8 m, and a lid at 12
with no surface on it: nobody had ever stood on a tower. Decisions #523 to
#526.

- **The roofs go on the four drums with no turret, not on the four with
  one** (#523). `SPECS.md` recommended the inner four — stockhouse, King's,
  bakehouse, chapel — because they carry a `turret: {radius: 2.5, height: 2}`
  and the outer four would be "a helipad". The arithmetic says otherwise. A
  drum is hollow to 2.8 m, so a 2.5 m turret standing on its top leaves a
  0.3 m ledge; a body is 0.9 m across; and the stair well a third flight
  needs reaches 2.23 m from the centre, which is under the turret in its
  entirety. A floor at 12 m on a turreted drum is a floor nobody can stand
  on and a flight that rises into solid stone. So the North-west, Kitchen,
  South-west and Prison Towers get roofs and the four turrets stay exactly
  where they are. `makePlan` refuses a drum that carries both, by name. The
  "helipad" argument died with #514 anyway: every drum wears a built crown
  now, so a roof at 12 m is a crenellated platform with 0.6 m crenels and
  1.5 m merlons round it, and that is the parapet — nothing new was built
  for it.
- **A roof is a room, and nothing else** (#523). `data/scene-config.json`
  gains four rooms at `level: 3` with `drum` and a `floor`, and every other
  part of it falls out of machinery that was already there: `makePlan` reads
  the drum's own height for which level is its top, the slab code cuts the
  well from whichever ramps cross the slab's y range, `buildFloor` draws a
  disc with holes, `walkability` floods it, `plan-vs-scene.mjs` stands the
  camera in it, and `nav.roomAt` names it in the HUD. What had to be written
  was the third flight, the lid turning off, and the level lists.
- **The third flight stands directly on the second** (#524). Same tile, same
  bearing, one storey up, which means its well in the roof IS the second
  flight's well in the level-2 floor, and it takes **not one square metre of
  walkable level-2 floor**. That floor is the wall walk's junction — two or
  three doors at 8 m and a crossing between them — and it is 5.6 m across
  with the second flight's well already in half of it. The two alternatives
  were measured and both close the walk: along the first flight's footprint
  leaves 0.71 m of clearance where a 0.90 m body has to pass, and against the
  ring on the door side leaves 0.55 m. The cost is that the climb is not a
  switchback — a body leaves the second flight at its head, walks round the
  well the way it already can, and starts the third at the foot — and the
  gain is that `layout.mjs` check 6b did not move a centimetre. Head room
  between the two flights is the storey, 4 m.
- **A turret is solid now** (#525). Four of them had been two metres of
  cylinder that the drum's bounding box knew about and no collider did, since
  Phase 3. Nothing could reach 12 m, which is how a hole like that lives for
  four phases. `drumParts` emits 24 wedge colliders from the centre at 12 to
  14, the same polygon the builder draws (#432), and `layout.mjs` check 13 is
  6c one shape up: no reachable cell inside a turret, feet or head band.
- **The castle says how many storeys it has** (#526). `plan.levels`, read off
  the rooms. The list `[0, 1, 2]` was a literal in four places — the
  validator's room rail in `mystery.js`, `stations.js`'s `talkable`, and one
  loop in each of the two plan suites — and a fourth storey had to be
  remembered into all four or it was silently out of reach and out of talking
  range. `validateMystery` asks `nav.plan.levels` when it has a plan and
  accepts any whole level when it does not, because a ceiling written into
  that file is a second copy of `storey` that can disagree with the first.

**What the roofs are.** 36 reachable cells each, `stone_pavers` tinted to its
own drum (#516), one thing on each (#517): a signal pole on the North-west and
South-west, a barrel of pitch on the Kitchen, a pile of sling-stone on the
Prison. The view from 12 m is a GPU question and nobody in a session can
answer it (#53).

**The breaks, from green.** The well left out of every roof (the third
flight filtered out of the slab's hole list): `nothing on level 3 can be
reached from the spawn`, then `nw-tower-roof (outer ward, level 3) cannot be
reached on foot from the spawn — 0 standable cells in x -38.8..-33.2, z
-18.8..-13.2`, and `nw-tower-roof cannot be reached by nw-tower's own stairs`.
The third flight moved onto the first's footprint, which is the arrangement
#524 rejected: ten failures, including check 6b's `from the North-west
Tower's stairs alone the walk does not reach kitchen-tower-2,
stockhouse-walk, kings-tower-2, sw-tower-2, prison-tower-2,
bakehouse-tower-2, chapel-tower-2, north-walk, south-walk, cross-walk`. The
turret colliders deleted, with the both-at-once guard disabled and a roof
added to the Chapel Tower on purpose: `a body at (24.25, 17.25) standing at
10.25 is inside chapel-tower's turret, which runs 12.00 to 14.00 within 2.5 m
of (24.00, 16.00)`, six of them, a body climbing the third flight with its
head in the stone. The builder drawing a level-3 floor 4 m low:
`"floor-nw-tower-roof" (floor) is 4.000 m off the plan`, four of them, in
`plan-vs-scene.mjs`. And the level list, with `royal-apartments` moved to
level 4 in `mystery.json`: `room royal-apartments: level 4 is not one of the
castle's levels 0, 1, 2, 3`.

## The Great Hall gets a roof frame (2026-09-15)

**Ranked row "Stirling's Great Hall roof", claimed on
`claude/festive-hopper-nf7391` (#283, PR #8).** `PLAN.md` said the hall was
"full height with a flat ceiling" and the config said otherwise: 28 x 8 m of
`rock_tile_floor` with 8 m walls and nothing at all over it, open to the sky
since Phase 3. Six of the twelve stand in it at Vespers and the accusation is
made there. Decisions #527 and #528.

- **Seven trusses, and a placement can be scaled per axis** (#527).
  `structure-cross.glb` is authored 1 x 1 x 1 — `SPECS.md` said 2 x 2 x 2,
  measured off the file it is 1 — and one number cannot make a truss of it.
  `courtyard.placements` already handled `typeof p.scale === 'number'`;
  `scaleFor` already handled an array, because the stairs are scaled
  `[3, 3.9, 3.3]`. Joining the two is one condition. The trusses are
  `[0.5, 2.5, 7.25]` at `base` 8 on x -32 to -8 on 4 m centres: 0.5 m thick,
  ridge at 10.5 m, under the tower tops at 12. `noCollide: true`, which under
  #427 means no collider at all, because a collider 8 m up that only a
  walk-walker could ever meet is a trap with no upside. What keeps them out of
  the way instead is a check.
- **`roofs: "<room>"` and `layout.mjs` check 14** (#527). A piece with `roofs`
  is over a room rather than standing in it, and three things hold: it clears
  `HEAD_HIGH` over that room's floor, its footprint is inside that room's own
  rectangle, and no reachable cell's head band is inside its box **grown by a
  body's radius**. The last clause is #511 one storey up — the grid samples a
  cell centre and a body is 0.9 m across — and it is not decoration: at the
  hall's full 8 m span the fourth truss reaches into the Prison Tower's disc,
  which pokes 0.75 m into the hall's rectangle and has a body standing in it at
  8 m. The trusses are 7.25 m for that reason and the number is in the config's
  comment with it. Read off the box and not off the colliders, because they
  have none: a truss over the south walk would be walked *through*, which is
  worse than walked into.
- **No covering, and that is a decision** (#528). `SPECS.md` recommended the
  kit's `roof*.glb` over the trusses — "hammerbeams against open sky are a
  ruin, not Stirling" — and that recommendation cannot be taken in this
  container. `partsOf` hands back four parts for `roof.glb` and all four have
  the same 1 x 1 x 1 box, so nothing here knows which way the thing slopes;
  fourteen pieces guessed from a bounding box is the kind of work that reads as
  wrong in one glance and green in every suite. And a covering is the one
  change on this list that can make a room dark: #438's answer to "is it dark"
  is a luma read off a real render, six of the twelve stand in this room at
  Vespers, and the accusation is made there. So the trusses ship and the
  covering — with the two north windows at `base` 5 that exist to offset it —
  is a new `BACKLOG.md` row behind the GPU run, which is what unblocks both
  halves of it.

**The breaks, from green.** Check 14, one truss dropped to `base` 1.5:
`hall-truss-3 hangs 1.50 m over great-hall's floor at 0.00 — a standing body
needs 1.9`. One truss slid 1 m south: `hall-truss-3 reaches outside
great-hall: 0.50 m past its south wall`. And the head-band clause, with one
truss put back to the hall's full 8 m: `hall-truss-4 blocks 2 reachable
cell(s), the first at (-19.75, 13.75) standing at 8.00 on
floor-prison-tower-2` — which is how the 7.25 m span was found rather than
chosen.

## The line between the two plan suites (2026-09-15)

**Ranked row "`test/layout.mjs` and `test/plan-vs-scene.mjs` overlap; decide
what each is for", claimed on `claude/festive-hopper-nf7391` (#283, PR #8).**
Both import `makePlan`, `walkability` and `partsOf`; one is 1 s of Node and one
is two minutes of headless Chromium; and a reader could not tell which of them
a new line belonged in. Decision #529.

- **The line, and it is written in three places now** (#529). `layout.mjs` is
  every fact derivable from the plan in Node: geometry, reachability, the plan
  against `mystery.json`. `plan-vs-scene.mjs` is **the seams only** — that the
  builder placed what the plan named (the box diff), that the runtime stands
  where the plan says (`settle()`), that a tint reached a live material, and
  that the DOM wiring works — and **nothing it asserts may be provable in
  Node**. `test/mystery.mjs` owns the stations, through `validateMystery`'s nav
  rails. It is in both files' headers and in `CLAUDE.md`'s #500 bullet.
- **`layout.mjs` check 5 is deleted** (#529). It filtered both lists in
  `npcs.json` for entries with a `position` array; `npcs` was deleted in Phase
  6 (#472) and no `cast` entry has ever carried one, so it ran zero times and
  asserted nothing (#13). Its job is `validateMystery`'s.
- **Two browser assertions become preconditions that throw** (#529). "Every
  room has a floor at its centre to anchor the camera on" and "there is floor
  under every Prime station" are Node facts; a suite that cannot anchor or
  cannot place a body cannot do its job, so it now stops with the room or the
  name in the message and asserts nothing. A `fail()` reads as "the castle is
  wrong"; a throw reads as "this suite cannot run", which is the true claim.
  The assertion count is down by three.
- **One assertion moves to where it can fail** (#529). The coverage guard
  `nobody is upstairs at Prime, so this checks nothing` sat inside
  `plan-vs-scene.mjs`'s height check. Whether anybody is upstairs at Prime is a
  fact about `mystery.json`'s schedule, so it is beside the schedule in
  `test/mystery.mjs` now, as its own line.
- **AND NO CHECK CAME BACK THE OTHER WAY, ON PURPOSE** (#529). `SPECS.md` asked
  for the room-centre assertion to become a `layout.mjs` line. Written down
  there it cannot fail, and three attempts proved it: a room the fill reaches
  has cells by definition; the only two it does not reach are ground rooms with
  the base pavers under them; barring the Stockhouse walk door leaves its top
  room reachable up its own stairs anyway; and deleting a tower room's `floor`
  stops the room naming one at all, so the check filters it out instead of
  failing. The nearest falsifiable neighbour — "a room that names a floor above
  the ground is built and walked on" — was written in full and could not be
  made to fail either, by removing the floor or by moving its surface 4 m. So
  nothing was added. Shipping a third line guarding the same absence, all three
  dead, is precisely what this row existed to avoid (#34, #147, #13), and the
  row's own text said so: "that is exactly the reasoning that leaves two lines
  guarding the same absence and both of them dead."
- **The clock was never the point, and is not now.** `plan-vs-scene.mjs`'s two
  minutes is one page load under SwiftShader, not the assertions; moving three
  of them out saved nothing measurable. `SPECS.md` said so before the work
  started and the measurement agrees: 114.2 s before, 114.2 s after.

**The breaks, from green.** The moved coverage guard, with Lady Alys's Prime
station moved down into the Great Hall: `0 of the cast is upstairs at Prime, so
plan-vs-scene.mjs's height check has something to check — nobody`. The deleted
check 5, with the cook's Prime station put in a wall — the break that proves
the job is done elsewhere — `test/mystery.mjs`: `cook: station at prime is at
tile (-3.5, -2.5) on level 0, where there is no floor to stand on`, which is
that suite's own standing assertion `rejects a station inside a wall`. The same
break against the browser suite, which no longer asserts it: `the run threw:
cook are due at Prime where the grid finds no floor — test/mystery.mjs's
validateMystery should have failed first`, exit 1. And the two failed attempts
at a Node check, above, which are breaks that did NOT fire and are the reason
the check is not there.

## The game gets a thumb (2026-09-15)

**Ranked row "Touch: pointer lock has no phone form", claimed on
`claude/festive-hopper-nf7391` — after the work had started rather than before
it, which #283 says is the wrong order and is recorded here rather than
tidied away (PR #13).** Seven phases of a first-person game whose only input is
pointer lock, WASD, E and J: on a phone the start button worked and nothing
after it did. Decisions #530 to #532.

- **A second input scheme, and the controller cannot tell which is driving it**
  (#530). `src/touch-controls.js` reads touches off the canvas and writes two
  things: an axis triple `{forward, strafe, sprint}` shaped exactly like the one
  `PlayerController.update` derived from the key set, and yaw/pitch onto the
  camera in `YXZ` — the order `PointerLockControls` writes and `drive.mjs`'s
  `aimAt` reads. The controller's `axes()` takes whichever of the two is pushing
  harder on each axis, so a laptop with a touchscreen answers to both without a
  mode switch mid-frame, and `update`'s only change below that is that the
  stick's magnitude survives the normalise: half over is half speed, where a key
  is 0 or 1. Pointer lock stops being what says the player is playing — a phone
  has none — so `isLocked` answers `enabled` on touch and `lock()`/`unlock()`
  are no-ops. No three import in the new file; it takes the camera as a thing
  with a `.rotation`.
- **A tap on the stick must not advance the dialogue it is standing in front
  of** (#531). This is the bug the row would otherwise have shipped, and it is
  two guards with one job each rather than one guard with two. A tap fires a
  synthetic `click`, and `src/interaction.js` listens for clicks on the document
  because a click is how a dialogue is advanced with a mouse — so a thumb
  landing on the movement stick would step the conversation, every step, for the
  whole game. `touchend` is `preventDefault()`ed for every touch the zones
  handled, which is what tells the browser not to synthesise that click;
  `touchmove` is prevented for the ordinary reason (the page scrolls under the
  thumb); `touchstart` is left alone, because preventing it in Chrome cancels
  the gesture and the move events with it. The second guard is one line in
  `interaction.js`: a click inside `#touch-hud` is the HUD's, never the game's,
  which stops the E button firing `tryInteract` twice — once from the button and
  once from the document — and stepping two lines on one tap.
- **One button, and it wears the prompt** (#530). `setInteractPrompt` already
  wrote the HUD's line; the touch E button now wears the same words with the key
  that is not there stripped off, so one button means talk, examine or ring
  depending on what is in front of the player, which is what the row asked for.
  Both touch buttons call `InteractionSystem`'s own `tryInteract` and
  `tryJournal`, so the scheme adds no second path into the quest. An overlay is
  drawn over the HUD and owns the screen while it is up, which is
  `tryInteract`'s existing rule with a z-index behind it.
- **Detected, with a toggle** (#532). `isTouchLikely()` asks two questions
  because neither alone is right: `(pointer: coarse)` is the honest one and
  `navigator.maxTouchPoints` is true of a laptop with a touchscreen whose owner
  is using the mouse. Detection picks the default and the start panel's toggle
  overrides it, which is the hybrid case both of them get wrong. Two render
  numbers come down with the detection and not with the toggle: pixel ratio 2 to
  1.5 and the sun's shadow map 2048 to 1024. Both are laptop numbers, both are
  the biggest per-frame costs in this scene, and neither has been measured on a
  phone by anybody.
- **`test/touch.mjs`, the ninth suite** (#530). Headless, on a 412 x 915 page
  with `hasTouch` and `isMobile` — `prepPage` grew the option and both engines
  spell `page.touchscreen.tap` the same way. Nothing moves and nothing is timed,
  which is the line #53 draws: the camera is placed, taps are dispatched, and
  what is read back is a class on a div and a string in the DOM. Twenty-two
  assertions.

**What is outstanding, and it is the whole feel of it.** Nobody has had a thumb
on this. The stick throw (56 px), the sprint threshold (80 percent of it), the
look rate (0.0042 rad/px), the 92 px E button and the two render numbers are all
guesses, written as named constants in one file each so that arguing with them
is one edit. A phone is real compositing and real input latency and there is not
one in this container (#53), exactly as the Phase 5 to 7 GPU criteria are
outstanding.

**The breaks, from green.** The `touchend` guard removed: `a stick touch did
not advance the dialogue — moved on to "The King's inspector rides in
tomorrow. "` — the thumb stepping the conversation, which is the bug itself.
The E button unhooked in `ui.js`: `a tap on E at the word-lock opened the
riddle`, and three more behind it, including `nothing to tap: #riddle-cancel is
not on the screen`. The detection forced to false: `the touch HUD is shown under
a coarse pointer — hidden true, body.touch false`, `and the start panel says
thumbs, not keys`, `the toggle reads on — Touch controls: off`, and `the player
is enabled and on the touch scheme, with no pointer lock to take`.

## A second day, increment 1: the morning after (2026-09-15)

**Ranked row 6, "A second day, in which the epilogue's consequences play",
claimed on `main` on `claude/second-day-epilogue-pzfxie` before the work
started (#283, PR #15) and shipped as PR #16.** It is a **2+**: this is
increment 1 and the row stays in the table. Six of the seven open rows want a
machine this container is not — a GPU for ranks 2, 3 and 7, polyhaven.com and
the KTX-Software release for 4 and 5, both of which answer 403 from here
(#518) — so this was the row that could be finished. Decisions #533 to #538.

It was a writing job before it was a code job, as `BACKLOG.md` said: sixty line
sets, 140 lines, seven closing panes and a thirteenth person, against about 250
lines of engine and manager.

- **A `day` field on the save, not a fifth bell, and `SAVE_VERSION` goes to 2**
  (#533). `watches` is asserted to be exactly four in `validateMystery`,
  `ring()`'s fourth is the Constable demanding an answer rather than a watch,
  and both length rails ("neither solvable at Prime nor lost by Vespers") are
  written against one day. A fifth entry in `watches` would have made all of
  that say nothing. So `data/mystery.json` grows a `day2` block whose `watch` is
  `lauds`, deliberately *not* in `watches`, and `src/stations.js` indexes it as a
  fifth watch in the one place that cares about "where does a body stand at a
  named bell" — which is what lets the day-two schedule run through the same
  five nav rails as day one with no second copy of any of them. The save's key
  does not change (#36, #413); the version inside it does. `migrate` adds
  `day: 1` to anything written before version 2, which is the honest record of
  a field arriving, and `repair` clamps it on every load (#37). #413 said the
  schema was complete so that no phase would add a field, and no phase did: all
  seven shipped against version 1.
- **The thirteenth is the King's inspector, and his lines are the mystery's**
  (#534). `Master Adam Fraunceys`, on `King.glb` with `hideMaterials: ["Gold"]`
  and a tint nobody else has, at the King's Hall table 1.80 m off the Constable
  — the room the accusation was supposed to have been brought to. He is a
  thirteenth entry in `npcs.json`'s `cast` with `arrives: 2`, and that one field
  does three things: `validateMystery` asks him for a day-two station instead of
  a day-one schedule and refuses him if he has both, `quest-manager.js` keeps
  him out of the accusation panel (twelve names and a fall is the choice the
  Constable offers, and a man who has not dismounted cannot be argued with), and
  `main.js` spawns his body hidden like the merchant's at Prime. His seven
  speeches live in `mystery.json`'s `day2.lines`, not in `npcs.json`, because
  which one he gives is a fact about the mystery rather than about the body; his
  `npcs.json` `default` is one fallback line that is only reachable if
  `applyDay` never ran.
- **The man who hangs is gone, and the full ending takes two more with him**
  (#535). `day2.absent` is `{accused: true, also: {full: [steward, merchant]}}`,
  applied by the engine at runtime because the file cannot know what the player
  said. `SPECS.md` named only the Steward for `full`; the merchant went in too
  because the `full` epilogue's own words are that the lead was found in Thomas
  Wykes's yard in the town, and a man whose yard the King's inspector has just
  emptied is not at the west gate with a cart the next morning. **There is no
  body at the gallows.** A corpse the player can walk up to is a new asset and a
  tone decision that is Devon's; the hanged man simply has no station, which
  means an empty desk, an empty lodge or an empty cell depending on who it was.
- **Day-two lines are keyed by outcome, and both halves of the coverage are
  checked** (#536). One resolver, `dayTwoLines`, reads the exact ending key
  first (one of `accusation.verdicts`' own seven: `full`, the five accusables,
  `nobody`), then the verdict class (`full`, `right`, `wrong`, `fall`), then
  `default`. Two vocabularies on purpose: Nest has one thing to say when it is
  her own husband who hanged and another when it is anybody else, and the
  Constable has seven. The validator then asks it in both directions — every
  ending that leaves somebody standing has to resolve to lines, and every line
  set has to be reachable by some ending — because those fail in opposite
  directions and neither shows on a screen: a missing set opens the dialogue box
  on `undefined`, and an unreachable set is content written for an ending that
  cannot happen, which reads as work done.
- **The epilogue's button is the second day, and `victory` stops meaning "the
  day is judged"** (#537). The four verdict stages are not `terminal` any more:
  each carries one transition, `day:2` to a new `morning` stage whose `enter` is
  `applyDay`, and whose only way out is `talked:inspector` to `end`, which is
  terminal and shows the same pane again with the sheet signed. `showEpilogue`
  decides which button it is putting up by reading whether the stage the graph
  is *actually in* has a `day:2` transition, not by a stage id written in the
  manager, so making one ending final again is deleting one line of
  `quest.json`. The consequence is that `QuestManager.victory` — the graph is in
  a terminal stage — is false between the epilogue pane and the inspector, when
  the player is walking a castle at Lauds. `judged` is the other question and is
  what `main.js` and both browser suites wanted all along; the two of them had
  been the same thing since Phase 7 and nothing had had to tell them apart.
- **What a day two refuses.** No clues, no bell, no accusation, and no Present
  button. The engine already refused the last three once a verdict was recorded;
  what was new is the press, because the journal is still in the player's hand
  and the day-one presses are still in the data, so `press()` shrugs on day two
  rather than moving a Steward into `admits` against a verdict already in the
  ground. No evidence is listed at `lauds`, so the body, the cart and the cloak
  are all off the ground with no code saying so.

**The content.** Thirteen people at Lauds; eleven of the twelve stand at a tile
they already stood on during the day, which is the point rather than the
shortcut — the castle goes back to work and the difference is who is missing
from it. The two who move are the sentry, awake in the guardroom he slept
through Prime in, and the merchant, at the west gate at first light instead of
at Terce. Sixty line sets and 140 lines against day one's 57, seven closing
panes, and a `lauds` sky in
`scene-config.json`: the sun lower in the east than Prime's and a third of its
strength, the coldest fog in the file, and the hemisphere held at 2.2 for the
reason Phase 3 measured (a darker watch is a lower, colder sun and not an unlit
castle).

- **A hidden body is not something to press E at** (#538), and this one was a
  bug the second day found rather than one it introduced.
  `InteractionSystem.update` skips a target whose `active` is false, and
  `castle-builder.js` has said `get active() { return obj.visible; }` for every
  piece of evidence since Phase 7. NPCs never had one. On day one that hid: the
  merchant is not in the castle until Terce and his group sits at the origin
  with `visible` false, which no player walks up to. The morning after puts a
  hidden body exactly where the player is certain to go, because the man who
  hanged stays standing, invisible, at the Vespers station the accusation was
  made at. Measured in the browser before the fix, with the merchant moved into
  the Great Hall on purpose and the camera 2 m in front of him: `Press E to
  talk to the Thomas Wykes`, identical with `visible` true and false.
  `src/npc.js` gets the getter `castle-builder.js` already had.

**What increment 1 leaves.** `SPECS.md`'s list, unchanged in order: a second
mystery for day two (the inspector's audit, and the missing 128 sheets as
evidence in the town, which needs **The town side**'s road); bells on day two
and a schedule with more than one watch; and consequences that change the
castle rather than only the cast — an empty cell that is a shut door, a
muniment room sealed, the cart gone. And one thing this increment added to that
list: **nobody has seen a Lauds sky.** The five numbers in
`lighting.watches.lauds` were written against the four already there and
checked by nothing but the four (#53).

**The breaks, from green.** Eight, and one of them found a bug in a check
rather than in the code.

- `day2.absent.accused` set to `false` in the data, which is the switch that
  takes the hanged man out of the morning: `validateMystery finds nothing wrong,
  the castle included — clerk: has a station at lauds and hangs in full, clerk;
  steward: has a station at lauds and hangs in steward; porter: has a station at
  lauds and hangs in porter; merchant: ...; prisoner: ...`, and behind it
  `full: clerk hanged at first light and is not in the castle —
  {"room":"clerk-office","tile":[-7.5,-2.5]}` for each ending in turn. **This is
  not the break `SPECS.md` named.** It proposed writing the Clerk a day-two
  station; that does not fail and should not, because the Clerk has a morning in
  the four endings he lives through. The rule is the thing worth guarding, and
  the message is the one `SPECS.md` wrote.
- `day2.lines.inspector.nobody` deleted: `validateMystery finds nothing wrong,
  the castle included — inspector: no day-two lines after the verdict nobody (a
  fall)`, and `nobody: all 13 of them who are there have lines — inspector`.
- The engine's own half of the same rule, `stationOf`'s absent branch deleted:
  `full: and cannot be spoken to`, `clerk: and cannot be spoken to`, and five
  more — the validator refuses the data and the engine refuses the body, and
  breaking either one leaves the other standing.
- `applyDay` unhooked from `morning`'s `enter`, which is the break `SPECS.md`
  named and it fires as written: `a non-terminal stage runs applyDay: that is
  the morning`, then `the frame is in \`morning\` and the save is on day two —
  morning, day 1`, `the panel is closed, the world is at Lauds and the HUD says
  so — vespers / Vespers`, and four more. The stage moves and the morning does
  not happen, which is exactly the failure worth catching.
- `_hasMorning()` forced to false, so the pane's button always restarts: `the
  button offers the morning after rather than a fresh day — "Play Again"`, `and
  pressing it does not erase the save`, and in `test/save.mjs` the resumed-at-a-
  verdict case, `its button offers the second day rather than a fresh one —
  "Play Again"`.
- `repair`'s day-two-needs-a-verdict line deleted: `day 2 with no accusation at
  all falls back to day 1`, `and so does day 2 behind a refusal, which is an
  accusation with no verdict in it`, and `and on the repaired incoherent one it
  is back on day one at Prime — day 2 at lauds`.
- `get active()` deleted from `src/npc.js` again: `and hidden, 2 m in front of
  the camera, merchant offers nothing to press E at — the HUD said "Press E to
  talk to the Thomas Wykes" over a body nobody can see`. **That beat carries its
  own control, and the control is what made it worth writing.** A "no prompt" on
  its own proves nothing, because the camera might be looking at a wall, so the
  same body is made visible on the same spot with the same camera and the prompt
  has to appear. The first run of the beat reported no prompt for a VISIBLE body
  — the word-lock beat above it had left the riddle overlay open, and an open
  overlay hides the prompt whatever is in front of the camera — so without the
  control the line under it would have passed while asserting nothing at all.
- **And the one that was wrong.** `migrate` reverted to `(s) => s` left
  `test/save.mjs` **green**, which is #147 arriving on schedule. The assertion
  read `a version-1 save comes through migrate as day one`, and it could not
  tell you migrate had run: a version-1 save carries no `day` at all, and
  `repair`'s clamp answers a missing `day` with 1 whether migrate ran or not, so
  the word "migrate" in the assertion's name was a lie. What only migrate can
  say is that a version-1 save is a save of the FIRST day whatever is written in
  it — day two did not exist when it was written, so a stray `day: 2` in one is
  not a second day the player was on, while `repair` would take it because the
  verdict beside it makes it coherent. That assertion is in the file now and it
  fails on the break: `a version-1 save claiming day 2 is still day one: version
  1 had no second day to be on — 2`.

## A second day, increment 2: what the verdict does to the stone (2026-09-16)

**Ranked row 6 again, claimed on `main` on the same branch before the work
started (#283, PR #17) and shipped as PR #18.** Increment 1 (PR #16) put the
morning after in people: an empty desk, an empty cell, a laundress at the foot
of the Stockhouse Tower. The castle itself did not know anything had happened —
the cell's bars were still on the morning Madoc the smith walks home, and the
muniment door was still standing open on the morning the Clerk keeps the works
and puts a new word over it. Decisions #539 and #540. The row is a 2+ and
**stays in the table**: what is left after this is the two items that want
something this repo has not got.

- **The overlay lives in `mystery.json`, not in `scene-config.json`** (#540),
  which overrules `SPECS.md`'s own recommendation and is recorded so it can be
  reversed cheaply. `SPECS.md` argued that `mystery.json` is who and what and
  `scene-config.json` is where and how big, and a piece of castle is the
  castle's. What settled it the other way is that a day-two change is neither:
  it is **when and why**, and what decides it is the verdict. Putting it in
  `scene-config.json` would have put `accusation.verdicts`' seven keys into a
  file that has never heard of an accusation, and the alternative — a castle
  file that changes unconditionally — is not the row. So `day2.castle` is a
  list of rows in `mystery.json`, each naming a `planId` the plan already
  builds, and `scene-config.json` is untouched.
- **Four verbs, and `castle-plan.js` owns the list** (#539). `DAY_SETS` is
  `open`, `shut`, `gone`, `shown`; `castle-builder.js` implements exactly those
  and `validateMystery` refuses anything else, which is the arrangement
  `QuestManager.actions` already has with `quest.json`. A verb nobody
  implements is caught at load rather than on the one morning it was meant to
  happen.
- **Only two of the four can change the collider list, and both only subtract**
  (#539). `plan.colliders` is the castle as the plan builds it, which is the
  muniment leaf shut and the cell's bars standing, so `shut` and `shown` put
  back exactly what is already there and have nothing to add. That is not a
  detail: it is what makes seven endings cost two fills instead of seven, and
  what lets `validateMystery`'s day-two station rails go on asking the day-one
  grid and be conservative rather than wrong. Every ending's morning is the
  day-one castle with cells added and none taken away.
- **Three rows, and every ending changes at least one of them.** The cell's
  bars come off in the five endings where Madoc walks out at noon, and stay on
  in the two where he does not: in `prisoner` he was taken out to the rope and
  the door was barred again behind him, in `nobody` there was no killing at all
  so he is still in it for a knife he did not draw. The muniment door stands
  open in `full`, because the inspector has been in it since first light, and
  is shut again in the other six, which is the `clerk` epilogue's own words:
  "the ledger stays shut". **The cell is the payoff.** It is one of the
  fourteen ground rooms and the only one nobody has ever been able to stand in
  — Madoc's whole clue is spoken through the bars — and on the morning he is
  let out it opens to the player: 122 cells that were not there the day before,
  the cell and the muniment room between them.
- **`why` is compulsory** (#539). A change to the castle that nobody wrote the
  reason for is a change nobody can argue with, so `validateMystery` refuses a
  row without one, the way it already refuses a piece of evidence without a
  `name`.
- **E at a re-locked door stops saying "Nothing there now."** The muniment leaf
  is a lock target again once it is shut, which is right — the riddle can be
  answered a second time, and a door that does nothing reads as a broken door.
  What was wrong is that `handleLock` also examines the leaf, and `word-lock`
  is not listed at Lauds, so the engine answered `absent` and the HUD said
  "Nothing there now." about a door the player was standing in front of. The
  reading is day one's now.

**What is left of the row, in order.** A second mystery for day two (the
inspector's audit, and the missing 128 sheets as evidence in the town, which
needs **The town side**'s road, which does not exist). Bells on day two and a
schedule with more than one watch, which is the one that has to argue with
#533. And **somebody looks at a Lauds sky**, which belongs to **The GPU run**.

**The breaks, from green.** Thirteen: nine validator rails that break
themselves inside `test/mystery.mjs`, and four on the code.

- Every `day2.castle` rail, each one a mutation of a copy of the real file:
  `day2.castle[0]: the castle builds no piece called "gallows"`,
  `day2.castle[0]: \`set\` "burn" is not one of open, shut, gone, shown`,
  `day2.castle[0]: cell-bars is a fixture, and only a gate leaf can be open`,
  `day2.castle[1]: muniment is a gate leaf, so say open or shut rather than
  gone`, `day2.castle[0]: no \`why\`, so nothing says what the verdict did to
  cell-bars`, `day2.castle[0]: \`unless\` names "acquitted", which is neither an
  ending nor a verdict class`, `day2.castle[0]: applies to no ending, so
  cell-bars never changes`, `day2.castle: cell-bars is set twice after the
  verdict full (rows 0 and 3), and only the last would show`, and
  `day2.castle[0]: floor-muniment is floor the player stands on, and hiding it
  leaves a hole nothing else can see`.
- `this.castle?.applyDay?.()` deleted from the quest manager: `the castle is
  handed the full ending's own changes: the cell opens and the muniment door
  stands open`, and `a fall shuts the muniment door and leaves the cell barred:
  Madoc is still in it`.
- `collidersWith` made to ignore `gone`: `"cell-bars gone" takes 0 collider(s)
  out of the castle and the plan gives that piece 1`. Made to ignore `open`:
  `"muniment open" takes 0 collider(s) out of the castle and the plan gives
  that piece 4`.
- `setPieceVisible` made to hide the mesh and leave the box: `and its box out
  of the colliders, so the cell is not a wall nobody can see — 1 left`.
- `shutLeaf` made to stop rebuilding the boxes `openLock` spliced out:
  `muniment shut again stands in for all 4 pieces of stone the plan gives it —
  {"boxes":0,...}`, and `and the morning after puts the leaf and every one of
  its boxes back a second time`.

**And two findings, both from breaks that did not fail first time.**

- **The first version of the layout rail was too weak.** It asserted that the
  union of every change adds at least one cell, and `collidersWith` broken to
  ignore `gone` entirely left it **green**: the other row still opened the
  muniment room, the union still grew, and the row that had stopped working hid
  behind the row beside it. The rail counts boxes per row now, against what the
  plan gives that piece, and both halves of the break fail on it by name.
- **"The morning after is never a smaller castle" cannot fail against today's
  plan, and the comment says so** (#147). `shut` is the only verb that can
  close anything, and a leaf carries `blocks` — the stone it stands in for —
  only while the plan builds it shut, so shutting a leaf the plan ships open
  puts back an empty list. Tried: `{ piece: "west-gate", set: "shut" }` takes
  nothing away and the comparison stays green. It is kept as a guard against a
  plan that does not exist yet, said out loud as one, with the falsifiable rail
  underneath it.

**And one break that found a beat asserting nothing.** The new
`plan-vs-scene.mjs` beat for `shut` was written assuming the muniment door
starts shut. It does not: the word-lock beat above it answers the riddle, so
the door is open when the beat gets there, and the first run reported
`muniment starts shut, standing in for 4 pieces of stone — {"boxes":0,"angle":
6.8068}`. The beat drives the leaf round the whole cycle now rather than
assuming either end of it, and puts it back open on the way out so the beats
below see the castle they were written against.

## The texture sets and the town side (2026-09-16)

**Ranked rows 4 and 5, claimed on `main` before the work started (#283, PR
#19) and shipped as one PR.** `ktx` was on PATH and Poly Haven answered
(neither refused this container the way #518 says they refused the one PR #7
was built in), so both rows that were blocked on that came due at once. Four
new stone, brick, plaster and plank sets dress the inner ward and the tower
floors; a fifth, restored out of this repo's own history, textures the ground
west of the barbican, with a road and four trees. Ten materials became
fifteen; `dist/` grew from 50.7 to roughly 68 MB against the 200 MB ceiling.

- **`castle_brick_02` is not a Poly Haven id; `castle_brick_02_red` is**
  (#541). The pack ships a red and a white variant and neither is plain
  `castle_brick_02`. Red is the first one the API lists, which is the row's
  own tie-break rule ("recommend the first name listed for each and no
  agonising") applied to a name that turned out to need it.
- **`kings-hall-south` takes `medieval_blocks_02`, and the Royal Apartments
  gets no wall of its own** (#542). The row's scope claims `src: nothing` for
  the four texture roles, and for this one wall that is not true: King's Hall
  and the Royal Apartments directly above it share one run, one box, height 8
  from the ground to the wall-top, and a run has exactly one material for its
  whole height (`castle-builder.js`'s `buildRun`). Splitting it by storey is a
  geometry change, which is a different row. Between the two names on the
  role's own list — "the King's Hall, the steward's chamber, the cross-wall's
  inner face" — the King's Hall is the more specific, so it wins; the Royal
  Apartments keeps the signature it already had, the one carpet in the castle.
  Reversible by cutting `kings-hall-south` into two boxes at y 4 the day
  someone wants the split for real.
- **`plastered_wall_04` lands on `west-gate-over` and `east-gate-over`, not on
  any room's own wall** (#543). "The level-1 rooms' interior partitions" names
  no run in `scene-config.json`: every level-1 room is floored by a slab over
  a ground room and walled by the same curtain or drum ring that walls the
  room below it, at one material for the whole height, the same limit #542
  hit. The two gate-over runs are the only walls that exist AT level 1 and
  nowhere else — the missing top half over each gate archway (#453) — so they
  are the closest concrete thing to "upstairs" this castle's walls have, and
  they took the plaster.
- **`wood_floor_deck` is the eight tower first-floor rooms' own `floor`, and
  nothing else's** (#544). Read directly off the rooms that carry a `drum`
  field at `level` 1 — nw-tower-1, kitchen-tower-1, stockhouse-tower-1,
  kings-tower-1, sw-tower-1, prison-tower-1, bakehouse-tower-1,
  chaplain-chamber — which is exactly "the tower first floors" the row names.
  `clerk-chamber`, `dormitory` and `royal-apartments` have no `drum` and keep
  `wood_planks`, and so does `config.walk.material`, the decking itself: the
  row's own text is "so the walk's decking and a tower room's boards are not
  one plank," and the walk was never a candidate to begin with.
- **Both `cross-wall-north` and `cross-wall-south` take `medieval_blocks_02`,
  not one of them** (#545). "The cross-wall's inner face" is not a thing this
  data model can build: `buildRun` textures a box on every face from the one
  material it is given, so a run has no inner or outer side to give
  separately. The two runs together are the whole cross-wall, on both sides of
  the porter's gate, and reading "inner face" as "the wall that faces the
  inner ward" rather than as a literal half of one box was the reading that
  did not leave one of the two porter's-gate segments looking like a seam.
- **`ground.outside` is a new list, in world metres rather than tiles, and it
  reuses `oneFacePerPlane`'s existing hole-cutting instead of a rule of its
  own** (#546). `config.ground.patches` is tile-based because every patch it
  has ever carried lies inside the base's own footprint; the outside ground
  lies past the tile grid the castle is drawn on, so `src/castle-plan.js` reads
  its `box.min`/`box.max` as metres directly and pushes it into the same
  `grounds` array `patches` already fills, in list order — the forest patch
  first, the road listed after it — so the same "a ground piece is cut round
  every ground piece after it that meets it" rule that already keeps
  `outer-ward` and `chapel-vestibule` from fighting the base cuts the forest
  patch's hole for the road for free. **150 m is the fog's own `far`, read
  literally as the outside ground's whole depth west of the base's edge**,
  because the row's own recommendation ties the two together ("anything the
  fog hides is bytes drawn for nobody") and picking a different number would
  have needed a reason the row does not give one. The road starts at the
  barbican's own west face, 2 m inside the base's margin, which is an overlap
  and not a touch — `test/layout.mjs`'s new check treats meeting the base
  (touching OR overlapping, on both axes) as "no gap," because the only thing
  that check exists to catch is a piece that clears the base on some axis and
  leaves empty space between the castle's ground and the world. Broken once,
  from green, by moving the forest patch 3 m west: the check named the gap in
  both edges and passed again the moment the box moved back.
- **Ten drums, one map each, became two.** The four inner drums —
  Stockhouse, King's, Bakehouse, Chapel — read `castle_brick_02_red` now and
  the four outer stay `defense_wall`; `tint` sits over either the same way it
  always did. `test/plan-vs-scene.mjs`'s drum beat asked for exactly one
  diffuse map across all eight drums, which stopped being true the moment this
  landed and is not a regression: it now asks for one map per material and
  fails if any drum's map disagrees with its own plan piece, which is a
  stricter claim than the one it replaces.
- **`data/sounds.json`'s `byMaterial` grew five entries**: the four rank-4
  sets and `forest_ground_06` as `stone`, `stone`, `stone`, `planks` and
  `grass` respectively, matching the class the nearest existing set of the
  same kind already carries. `test/layout.mjs` check 12 (every surface has a
  step sound) is what asked for this; without it, the eight new tower floors
  and the ground west of the barbican would be silent underfoot.
- **The two epilogues that mention the inspector's arrival — `full` and
  `nobody` — each grew one sentence naming the west road**, the
  recommendation SPECS.md made for **the town side**'s optional last line. No
  other epilogue changed.
- **One suite failure this batch did not cause and did not fix**:
  `plan-vs-scene.mjs`'s chapel-candle beat fails locally ("none of the 12
  cells between 0.9 and 2.8 m of the chapel candles offers them") on an
  unmodified checkout of this branch's claim commit, before any of the above
  landed, and GitHub Actions' own run of that same commit (PR #19, run
  35050428182) is green. It is a local rendering difference, not a code
  regression this PR introduced or one this PR's own scope covers, and is left
  for whoever next touches the chapel or the bell to chase.

## The wishlist, and Devon's ten answers (2026-09-16)

`WISHLIST.md` is new: the arc after `BACKLOG.md`, written from Devon's brief
of the day (depth, life, side quests, a castle to get lost in, lore, a castle
that is lived in), seven themes, three tools, and ten questions. Devon
answered all ten the same day. Decisions #547 to #550.

- **The wishlist falls in line behind the backlog, and ranks nothing**
  (#547). The five ranked rows in `BACKLOG.md` stay as they are. A wishlist
  row moves into `SPECS.md` and `BACKLOG.md` when it is taken up and not
  before, and the first to move when the table empties is the populace file
  and the first ten bodies of life. `PLAN.md` carried the name `WISHLIST.md`
  before the move (#491) and about ten citations still use it; a citation of
  that name dated before 2026-09-16 means `PLAN.md`.
- **Recorded audio is admitted, reversing the synthesis-only half of #519**
  (#548). Devon's words: "we want to grab audio now." #519's reasons were a
  licence question, a new directory for `test/assets.mjs`'s sweep to grow,
  and no codec in the encode pipeline; the answer to each is the one every
  glTF already has. A recording is CC0, named by `data/sounds.json` so the
  reachability sweep (#390) covers it, and goes through
  `tools/encode-assets.mjs` before it is committed (#506), which needs an
  audio codec added to that script. What #519 built stays: the footstep
  and the bell are synthesised until a recording beats them, and a sound
  synthesis does well is not replaced for the sake of it. Nothing lands in
  `assets/` under this decision until a wishlist row asks for it.
- **The world is invented, and leans into the fantasy** (#549). Conwy's plan
  and the 1280s' feel stay; the kingdom, the King, the war and the saints are
  the game's own, and the lore may carry what people believe and the game
  never confirms. Nobody casts anything on screen. The reason is the one
  the plan's Q1 was written against: an invented world lets the second
  mystery and the tenth be about anything.
- **Five smaller calls, in one number** (#550). Side quests are independent
  of the mystery (they never gate or remove a clue) and may connect to each
  other or deepen what the player understands. Many run at once, in one open
  castle, rather than one a day. Bodies are low-poly and CC0 for now, so a
  session can make a drop-in when a pack has no child or dog. Laptop first;
  the phone gets a cap, not a different castle. Text only; voice acting is
  much later. Bells stay as the clock (Q3), the default taken.

## Lore: the canon, six documents, a chatter pool (2026-09-16)

**Rank 6, claimed on `main` before the work started (PR #22) and taken up
whole, `WISHLIST.md`'s theme 3.** `data/lore.json` is new (31 facts),
`data/documents.json` is new (six readable props), `src/lore.js` and
`test/lore.mjs` are new (the tenth suite), and `data/npcs.json` gains a
17-pair chatter pool. The save moves to version 3. Decisions #551 to #555.

- **The canon is a flat list of facts, each with an id, a `kind`, one
  paragraph and `sources`, and the validator is what makes "told" a checkable
  claim rather than a comment** (#551). Thirty-one facts: 13 `history`, 5
  `person`, 3 `place`, 6 `belief`, 4 `rumour`. A source names a document, an
  npc line, a chatter pair or an epilogue key, and for the two content-bearing
  kinds (`document`, `chatter`) the citation has to run both ways — the fact's
  own `sources` names the document, and the document's own `cites` names the
  fact back — the same shape `src/mystery.js` already holds evidence and its
  clue to (`evidence ${id} does not list it as its clue`). Four contradiction
  pairs exist on purpose (a `history` fact and the `rumour` that quietly
  disagrees with it: the chapel bell's true origin against the melted-shrine-
  bell rumour, the previous Constable's balanced accounts against the rumour
  that his own coffer covered the gap, and two more), and two facts are left
  with no source at all (`the-well`, `prison-tower-origin`) to prove
  `untoldFacts` reports rather than fails on them.

  **The validator caught a real mistake before a single synthetic break was
  written** (#34, the honest version of it): authoring `obituary-roll` last,
  its `sources` on `castle-founding` and `saint-osyth` were written by hand
  and the two facts' own `sources` arrays were not updated to name it back.
  First run: `validates clean — ["obituary-roll: cites castle-founding, but
  that fact's own sources do not name obituary-roll back", "obituary-roll:
  cites saint-osyth, but that fact's own sources do not name obituary-roll
  back"]`. Fixed by adding the missing `{kind: "document", id:
  "obituary-roll"}` entries; the suite has been green since.

  **Broken again on purpose, from that green baseline, to have a clean
  transcript for the record.** `kingdom-vantry` given `contradicts:
  ["saint-osyth"]` (both `history`, no `belief` or `rumour` on either side):
  `node test/lore.mjs` exited 1, and the assertion that claims two facts may
  not both be `history` said `kingdom-vantry: contradicts saint-osyth, and
  neither is a belief nor a rumour — two history facts may not disagree`.
  Reverted; `diff` against the pre-break file showed no difference and the
  suite was green again.

- **The world is invented, over the cast PLAN.md already fixed, and nothing
  about the crime moved** (#552, answering #549 in the concrete). A kingdom,
  Vantry; two Kings across the forty years — Aldous, who fought the March War
  and began the works, and his son Osric, reigning now, whose coin the Sunder
  War is still spending; two saints, Osyth (the crown's, the chapel's) and
  Cadeyrn (the March's own, kept by the masons without troubling the chaplain
  about it); a previous Constable, Sir Walter Esturmy, two and thirty years
  in the post and buried in the chapel floor he paid the last stone of; a
  town, Mereford, chartered with the castle and still paying for its own
  wall. The hedge-witch, the chapel relic, the well the garrison will not
  draw from after dark and the thing Madoc hears under the Prison Tower's
  floor (#549's own list) are all in, every one a `belief` or a `rumour`.
  Nothing in `data/mystery.json` — the clues, the presses, the schedule, the
  accusation, the endings — was read for anything but the twelve's existing
  names, roles and wards.

- **Six documents, as built slabs, the same pattern the cloak and the walk-bar
  already used, in rooms the castle already builds** (#553). The works
  ledger (Clerk of Works' office), the chaplain's obituary roll (his chamber,
  level 1), the porter's gate book (his lodge), a builder's graffito cut into
  the floor at the head of the Kitchen Tower's stair (the garrison dormitory,
  level 1), a gravestone in the chapel floor, and the King's writ (the
  muniment room). No new asset (#506); `data/scene-config.json` gained two
  `plainMaterials` (`parchment`, `slate`) and six `builtProps` entries, each
  carrying a `read` field the way an evidence prop carries `evidence`.
  `src/castle-plan.js` passes `read` through all three prop loops;
  `src/castle-builder.js`'s `readables()` mirrors `evidence()` exactly, one
  target per id with `isReadable: true` and a "Press E to read the …" prompt.
  `src/interaction.js` needed no change: a readable is a target like any
  other, and `main.js` routes `isReadable` to `quest.handleRead`, which opens
  the existing dialogue overlay (a title, one long line) and marks the id
  into the save's new `read` list the instant it opens — the same instant
  `examine()` already marks a taken piece of evidence gone.

  **First placement pass failed `test/layout.mjs` on four of the six, plus a
  fifth failure (a stair flight) on one of those four.** Two Welsh-named
  drums at the castle's east corners — the chapel tower and the King's
  tower — turn out to have a smaller safe interior than their nominal 2.8 m
  radius suggests: the east barbican's garden wall and the tower's own
  ground-floor stair each cut into it from a specific side, and a document
  placed by tile arithmetic alone landed half in one or the other three
  times running. Found by loading the real plan in Node (`makePlan` plus the
  same `partsOf` reader `layout.mjs` uses) and testing candidate boxes
  against every stone sector, collider and flight directly, the same
  question the suite asks, rather than guessing a second time and waiting two
  minutes for the browser suites to say no again. The gravestone's footprint
  also came down from 0.9 x 1.8 m to 0.6 x 1.2 m: nowhere in that tower's
  interior circle held the larger slab clear of the stair, the curtain, the
  garden wall and the existing candles and lantern all at once.

- **Chatter: 17 pairs, keyed by ward then watch, for the existing twelve
  only, unspent** (#554). `data/npcs.json` gains a `chatter` block; each pair
  names its two speakers and, where it tells one, a lore id. Validated
  against each speaker's own static `ward` field rather than the schedule's
  exact station at that watch — `SPECS.md`'s own recommended-and-taken open
  call, because holding it to the schedule the way `mystery.js`'s nav rails
  do is a second pass this row did not need to make to ship the pool. The
  thirteenth, the inspector, is refused by the same `arrives` field
  `validateMystery` already reads (`arrives on day 2 and is not one of the
  existing twelve`). The pool is data only: this repo has no populace yet
  (`WISHLIST.md` theme 1), and spending it on two bodies in earshot is that
  row's to do.

- **The save moves to version 3, for `read`, through `migrate` even though
  `repair` alone would default it correctly** (#555, #36, #37). Unlike `day`
  (#533), nothing about a pre-version-3 save's missing `read` is incoherent
  the way a version-1 save claiming day 2 was — there is no verdict-shaped
  fact a missing `read` could contradict — so `repairState`'s own default (an
  empty list, `idsIn` on `undefined`) is already correct on every old save.
  The version bumped anyway, because #37's line about a field's arrival being
  honest is about the number, not about whether `repair` happens to cover for
  it; `migrate`'s new line documents the transition and says so. `buildCatalog`
  takes a fourth data file, `data/documents.json`, and builds a `documents` id
  set; `repairState` filters `read` against it the way `taken` is filtered
  against evidence. `src/mystery.js`'s `freshState()` gained `read: []` for
  the same reason. The journal overlay (`src/ui.js`) grew two tabs, "What you
  know" and "Things read", shown only when opened cold on J — the Present
  picker offered mid-conversation stays clues-only, since presenting a
  document to someone is not a verb this row added.

**What was measured.** `data/lore.json` 268 lines, `data/documents.json` 145,
`src/lore.js` 186, `test/lore.mjs` 181; the `data/npcs.json` diff for the
chatter block is 175 lines. All ten suites green: `npm test` — layout,
mystery, lore and the rest — and `npm run build` (dist 50.7 MB, the built
page fetching the same 150 files under `assets/`, `data/` and `decoders/` as
the source page, per `test/built.mjs`). `plan-vs-scene.mjs`: 279 pieces (273
before this row), all within 0.0000 m of the plan. `npm run play` was not run
and could not be (#53); nothing in this row moves the player, the walk or a
render, so the honest gap is only that nobody has looked at the six documents
or heard the chatter with eyes and ears rather than a Node assertion.

## Lore, reviewed and expanded: a timeline, thirteen documents, twenty-seven pairs (2026-09-17)

**The lore row (#551 to #555, PR #23) read back as a whole, and then
expanded.** The brief was to check the merge "makes sense together" and then
deepen it: more facts, more objects. `data/lore.json` goes from 31 facts to 61,
`data/documents.json` from six documents to thirteen, `data/npcs.json`'s
chatter pool from 17 pairs to 27, and `src/lore.js` gains one more
cross-reference to hold. Nothing in `data/mystery.json`, `data/quest.json`,
`data/riddle.json` or the cast's own dialogue moved. Decisions #556 to #559.

- **The canon has a timeline, written into the file, and every `history` and
  `person` fact is held to it** (#556). In years of the works, year 40 being
  this Michaelmas: the March War from year -9 to 0, the first stone at 0, the
  well at 2, the bell and Gruffudd's fall at 3, the cross-wall at 4, the
  curtain closed at 6, the gaol at 9, Aldous dead and Osric crowned at 15, the
  towers done at 16, Sir Walter dead and Sir Roger come at 32, the Sunder War
  from 32 to 38, the inspections yearly from 34. The review that wrote it
  found the shipped canon disagreeing with itself in three places and with
  `mystery.json` in one, none of which the validator could see, because a
  validator reads ids and not arithmetic:
  1. `king-aldous` had him die "in the fifteenth year of the works with the
     curtain barely closed", and `castle-founding` had the curtain closed in
     six. Now he dies with the towers still open to the sky, which year 15 is.
  2. Lady Alys says in `npcs.json` that she has "been married to a Constable
     eleven years", and Sir Walter's two and thirty years from year 0 put Sir
     Roger in this post eight. Reconciled by a new `person` fact rather than
     by moving the gravestone: Sir Roger was Constable of Bryn Adda, a March
     post of twelve men, three years before he came here, and married one
     year into it.
  3. `hywel-rise` had him a journeyman before twenty and "twenty years a
     mason and eleven a master", which from a boy of nine in year 3 does not
     add up to any one age. Now seven and twenty years a mason, eleven of them
     a master, forty-six years old.
  4. `works-ledger` was titled "The works ledger" and stood in the Clerk of
     Works' office, while the mystery's own evidence `ledger`, "works ledger",
     is the thing behind the word-lock in the muniment room. A player reading
     one and then finding the other would have been right to ask which was
     the ledger. The document is now "The old works ledgers", the closed
     volumes of years one to thirty-nine, and says in its own first line that
     this year's book is under the Clerk's own lock and is not here.

  Two `npc` sources were dropped because the line they named did not say the
  fact: `king-osric` cited the Constable's default lines, which mention the
  inspector and never the King, and `saint-osyth` cited the chaplain's, which
  never name a saint. The validator checks that an `npc` source names a
  dialogue state that exists and cannot check what the state says, so this
  is the one source kind where "told" is still a claim a reader has to
  verify by hand; the file's comment now says so. The count was wrong too:
  `WISHLIST.md` and `test/lore.mjs`'s header said eighteen pairs and the pool
  had seventeen. The weak contradiction was sharpened: `prison-tower-origin`
  now says what is under the floor (rock, sounded by the engineer), so that
  Madoc's dragging sound actually disagrees with it, and `the-well` says it is
  a spring in the rock so that the new `well-depth` rumour (it goes down to
  the river and the tide comes up in it) has something to contradict.

- **Thirteen documents, and a document's slab is one placement written twice
  and held to** (#557). Seven new readable props, each a built slab in a room
  the castle already builds (#553's pattern, #506's rule): the foundation
  stone on end against the cross-wall's west face in the outer ward, the
  engineer's drawing flat on the Clerk's chamber floor, the cook's slate
  against the kitchen's west wall, the exchequer's letters on the Steward's
  floor, the lodge's ordinances on a board at the mason's lodge's south-west
  post, the bakers' notches in the floor by the bakehouse oven, and the
  watch-bill in the guardroom. `data/documents.json` and
  `data/scene-config.json`'s `builtProps` each carry the slab, because the
  room check runs on the document without the scene config and the builder
  reads slabs from the scene config alone, and two copies of one placement
  drift. So `validateLore` takes `builtProps` and fails on a document whose
  tile, base, size or material differs from the entry carrying `read: <its
  id>`, on a document with no such entry, and on an entry naming no document.

  **Placed in Node, not by eye.** A scratch script loaded the real plan the
  way `test/layout.mjs` does (`makePlan` with `test/gltf.mjs`'s `partsOf`)
  and tested each candidate box against every stone sector, every flight,
  every other prop's box, the room's rectangle or disc, and the walkable
  cells within 1.5 m at that level, the same questions the suite asks. Two
  candidates failed it before `layout.mjs` ever ran: the cook's slate at
  0.3 m from the kitchen's west wall stood inside the CL/KI party wall, and
  the first idea, a memorial stone in the east barbican garden for the
  garden's planter, could not be placed at all, because the garden has no
  walkable cell: the ground east of x = 26 is the barbican's own stone. That
  is why "more gravestones" stays open in `WISHLIST.md` and why the garden
  being walkable is noted there as a castle question before a lore one. The
  gaol roll is not a document on purpose: `SPECS.md`'s increment 3 names it
  as evidence, and a lore document with the same content would pre-empt that
  row's one thread a container can finish.

  **Broken on purpose, from a green baseline** (#34). The gate book's tile
  moved from 0.375 to 0.625 in `scene-config.json` alone; `node
  test/lore.mjs` exited 1, five assertions down, and the one that names it
  said `gate-book: data/documents.json and the builtProps entry gate-book
  describe different slabs (tile [0.375,-4.375] vs [0.625,-4.375])`.
  Reverted from a copy taken before the break; green again. The suite also
  carries the same break as synthetic data, plus a height, a material, a
  document with no slab, a slab with no document, and the no-`builtProps`
  call that skips the check rather than failing it.

- **Chatter to twenty-seven pairs, two silent pairs now cite what they tell,
  and the epilogue is used as a source for the first time** (#558). Ten new
  pairs, the existing twelve only, each speaker in their own ward as #554
  validates. `outer-terce-1` (eleven miles, the quay toll) and
  `inner-terce-1` (Caernarfon) were telling `west-road`, `thomas-wykes` and
  `caernarfon-seat` without a `cites`, which the validator cannot see either
  way; they cite now. Four facts are told by the verdict and second-day text
  in `mystery.json`: `stockhouse-gallows` by every convicted verdict (each
  one hangs its man from the Stockhouse Tower), `caernarfon-seat` by the
  merchant's, `west-road` by the acquittal ("The carts keep to the west road,
  past the barbican"), `thomas-wykes` by the full one (the lead "in Thomas
  Wykes's yard in the town"). `test/lore.mjs` now asserts all four source
  kinds are in use, so the epilogue path in `src/lore.js` is exercised by
  real data and not only by the synthetic break.

- **The lore names no object of the mystery, and the mystery's own numbers
  are canon the lore fits** (#559). The lead, the passes, the cloak, the
  lantern and the summons do not appear in `data/lore.json` and the file's
  comment says they are not to. The other direction is the one that bit:
  `mystery.json` already said Caernarfon, eleven miles, forty mouths, eleven
  years married, eleven years cooking and eleven days in the cell, and every
  new fact was written to those rather than around them. Caernarfon is a real
  Welsh name in an invented kingdom and stays, because `mystery.json`,
  `quest.json` and the day-two text say it in twelve places and #549's line
  was that the plan's Welsh-flavoured names are kept. New invented names are
  Hensford (the market eleven miles up the valley), Bryn Adda (Sir Roger's
  old post), Master Jocelin (the engineer), Ranulf and Hugh Bassett (the
  first two Clerks of Works).

**What was measured.** `data/lore.json` 545 lines (268 before), `data/documents.json` 315 (145),
`src/lore.js` 220 (186), `test/lore.mjs` 210 (181); the `data/npcs.json`
chatter diff is 94 lines added and the seven `builtProps` entries 113. Facts
by kind: 24 `history`, 15 `person`, 9 `place`, 7 `belief`, 6 `rumour`; six
contradiction pairs, every one with a `belief` or a `rumour` on one side; the
same two facts untold on purpose. All ten suites green (`npm test`, in this
container with its headless Chromium): `plan-vs-scene.mjs` 286 pieces (279
before this pass), all within 0.01 m of the plan; `built.mjs` green;
`npm run build` green, `dist/` 52 MB. `npm run play` was not run and could
not be (#53); as with #555, nothing here moves the player or a render, so the
gap is that nobody has read the thirteen with eyes rather than a Node
assertion, and the chatter pool is still unspent by the game.


## A fourth body: looked for, and not found from here (2026-09-17)

**Ranked row 1, on `claude/backlog-rank-1-tfcr3e`.** `SPECS.md`'s source
order is Quaternius's own packs first, then any CC0 humanoid with an `Idle`,
a `Walk` and a material named `Skin`, never a re-tinted Farmer, and its last
line is that a row with nothing that fits closes as "no woman's body found,
the bet stands" and says where was looked. This is that result, written the
way #518 wrote the texture sets a container could not fetch: the row stays,
with what was found and what to fetch. No asset, no code and no data moved.
Decisions #560 to #562.

- **Every host that carries a Quaternius body answered 403 from this
  container, and the npm registry is the only one that did not** (#560).
  quaternius.com, quaternius.itch.io, poly.pizza, opengameart.org and
  patreon.com were refused by the egress proxy by name, through `curl` and
  through the fetch tool alike. That is #518's network policy again; the
  session that shipped the texture sets had a different one (#541). The
  registry was searched under eleven phrasings and three packages came
  back: `@jgengine/assets@0.18.1`, an index of Quaternius and KayKit packs
  whose pinned download URLs all point at the hosts above;
  `hearthling@0.2.0`, which bundles five of KayKit's Adventurers and the
  rig's animation files; and `deskrpg@2026.917.3`, 253 MB, fifty office
  bodies built on Quaternius's Animated Women and Animated Man packs. A
  GitHub mirror of any pack was not tried: this session's GitHub access is
  scoped to this repository, and a mirror is a repository.

- **KayKit's Mage and Rogue are women and CC0, and are rejected on
  proportion** (#561). Rendered headless with poppygl (a software
  rasteriser off npm that draws the bind pose and does not skin, so the
  Quaternius bodies came out folded and only the KayKit pair could be
  looked at), both are chibi. The `head` joint sits at 1.24 m on a 2.17 m
  body, 57 % of the way up; on the Quaternius rig `Head` is at 1.55 m with
  `Neck` at 1.47 and `Hips` at 0.86, the top fifth of a man. `npc.js`
  scales every body to one height, so a Mage at the spec's 1.65 m would
  have a head 0.9 m tall standing beside a Farmer whose head is a fifth of
  him: not a woman among twelve, a different species, which is the line
  #419 drew for tint. Two costs were priced and would have been paid had
  the shape fit. The body is one material over a 1024 px palette PNG (15 KB,
  a gradient atlas rather than flat swatches), so the tint would have gone
  onto the face until the atlas was split into flat `Skin`, `Hair` and
  cloth materials by sampling each triangle's centre, and the file would
  have needed `ktx` (#506) or that split, because there is no `ktx` here
  either. And the clips live in `Rig_Medium_General.glb` and
  `Rig_Medium_MovementBasic.glb` beside the body, keyed by bone name, not
  in it.

- **deskrpg's fifty are the right rig and the wrong licence, and the wrong
  century** (#562). They are Quaternius's Animated Women rig: `Head`,
  `Neck`, `Palm.R`, materials named `Skin`, `Eyes`, `Eyebrows` and `Hair`,
  zero images, `idle`, `walk` and `sit`, the closest thing to the three on
  disk that was found. But each is the maintainers' own derivative
  work, re-modelled with jackets, shoulder bags, notebooks, lanyards, bows
  and glasses, and the licence over that work is the package's "Sustainable
  Use License": free non-commercial use and redistribution only. This repo's
  credits are CC0 three times over and a fourth body does not buy a second
  licence; and no `hideNodes` list turns an office blouse and a midi skirt
  into 1280. The one code change it would have needed is worth writing
  down for whichever body does come: `HAND_BONES` in `npc.js` has no
  pattern for `Palm.R`, so a held prop on that rig falls back to the
  group-offset branch.

**What a container that reaches quaternius.com does.** Which pack the three
came from is written nowhere in this repo (the file headers say only
`glTF-Transform`, and the spec's "the pack the three came from" is the
sum of what is known). Fetch the Ultimate Modular Women Pack at
`quaternius.com/packs/ultimatemodularwomen.html` first, which the search
index lists as Witch, Worker, Suit, Soldier, Animated Woman, Punk,
Adventurer and Hooded Adventurer, the same names as the men's pack the
Adventurer here is likely from; check its node, material and clip names
against `SPECS.md`'s three lists before anything else; re-export through
`gltf-transform`, then `npm run assets:encode`, which needs `ktx` on PATH
for nothing in a textureless body but is the script every asset goes
through (#506). The rest of the row is unchanged and still ½.
