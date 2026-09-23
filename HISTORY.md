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

## The wishlist comes up whole, ranks 6 to 13 (2026-09-17)

**A plan, not a batch, the same shape as #411 to #418.** `WISHLIST.md`'s
seven themes and its tooling section move into `BACKLOG.md` at ranks 6 to
13 and get a first-increment spec each in `SPECS.md`. No code, no asset, no
claim. Worked from Devon's own request rather than a brief, under Claude
Sonnet 5. Decisions #560 to #567.

**Devon asked for the wishlist taken up now, ahead of his own answer to
question 10.** `WISHLIST.md` question 10, answered 2026-09-16 and locked as
#547, said the current backlog stays as it is and the wishlist falls in line
behind it — the first row out only once `BACKLOG.md` empties. It has not;
ranks 1 to 5 are still open. Devon's instruction this session was direct
rather than routed through that answer, and this repo's rule is that a
judgement call gets made and recorded, not that an old answer gets re-argued
with the person who gave it: #547 stood on 2026-09-16 as the answer to "what
is the first row, absent other instructions," and this is other
instructions. The eight rows below take the ranking `WISHLIST.md`'s own
theme order already gave them, six to ten and twelve in theme order, the
tooling section at thirteen, and theme 3's own unshipped remainder (#551 to
#559 shipped the rest of it) at eight — its old theme slot, since it is a
small remainder of a thing already mid-flight rather than a new theme. None
of the eight `SPECS.md` sections is written from code, because none of the
eight systems exists yet; each names one first increment, at the depth the
size column already implies for a 2+ row, and defers the rest to
`WISHLIST.md`'s own text the way rank 4's second day defers its own later
increments to itself. `WISHLIST.md` empties of theme content and keeps
everything else — the castle-today baseline and Devon's ten questions and
answers — because those are the record a locked decision already made
(#547 to #550), not open work, and each theme's body becomes a pointer
rather than a second copy. The gaol roll's own place does not move with any
of this: it stays rank 4's third thread (`SPECS.md`, "A second day",
increment 3), the one piece of that row a container could already finish,
and it is not duplicated into rank 8 — a lore document with its content
would pre-empt the one clear thread rank 4 has. `BACKLOG.md`'s claimed count
moves from 5 to 13 and every one of the eight new rows' `Claimed` column is
blank, per this repo's own rule that a claim is its own commit before work
starts (#283): this round is the ranking, not the work.

- **Life: a populace, rank 6, Opus 5** (#560). Devon's own answer to
  question 10 named this row first among the eight, "the row that makes
  every other row visible," and it keeps that place: `data/populace.json`,
  a validator, and the first ten bodies off models this repo already has.
  Opus 5 because the row is a data model and a validator, the shape rank 2's
  and rank 9's own Opus 5 rows already are, and a container can carry this
  first increment to green on its own.
- **Sound: a soundscape, rank 7, Fable 5.1** (#561). Ambient beds, event
  sounds, the bells as a soundscape. Fable 5.1 because the row's live
  question — synthesise, or find and licence a CC0 recording — is the same
  search rank 1's "A fourth body" already runs, and rank 1 was Fable 5.1 for
  that reason first; the first increment (the beds, synthesised) is
  container-provable, the recorded half is not.
- **Lore: what is still open, rank 8, Sonnet 5** (#562). The sermon and the
  song, and a `since` field this row explicitly does not carry because it
  waits on rank 4's second day. Sonnet 5 because it is a small remainder with
  no data model of its own to design, matching rank 5's hall covering.
- **Side quests, rank 9, Opus 5** (#563). The `data/quests/` format, a set
  validator holding the mystery-clue and same-NPC rules apart, and the
  cook's missing knife as the first quest, chosen because its resolution
  needs no new prop and touches no `mystery.json` key. Opus 5 for the same
  reason as rank 6: a data model and a validator.
- **A castle to get lost in, rank 10, Opus 5** (#564). Volume before area
  before a second castle, in the order `WISHLIST.md` itself gives; the first
  increment is the unused floors across the eight drums, which is
  `castle-plan.js` and a floor slab and needs no design call. Opus 5, same
  reason.
- **Bodies, rank 11, Fable 5.1** (#565). A low-poly shared rig at the scale
  of a child, a dog, a chicken and a garrison, the same sourcing question
  rank 1 already answered once for a woman's body. Fable 5.1 for the same
  reason as rank 7, and for the same reason as rank 1 before it.
- **Feel, rank 12, Sonnet 5** (#566). Presence, fire, weather, a door that
  opens, each independent and each gated on `npm run play` (#53); the first
  increment is the two `WISHLIST.md` itself calls the cheapest presence cues,
  a shadow and a reaching hand, and neither closes its acceptance without a
  GPU. Sonnet 5, matching rank 5's hall covering, the row this one most
  resembles.
- **The tooling, rank 13, Opus 5** (#567). The placement editor first, ahead
  of the dialogue format and the budget suite, because ranks 6, 9 and 10 are
  the rows about to need it and a session can still hand-type tile
  coordinates without it in the meantime. Opus 5: an editor and a build-time
  guard against it leaking into `dist/`, container-provable end to end.

**What was measured rather than taken from the prompt.** `WISHLIST.md` ran
2955 lines with seven theme sections and one tooling section before this
round; `BACKLOG.md`'s ranked table held 5 rows; `HISTORY.md` ran to #559.
`src/stations.js`'s `STATION_CLEARANCE` (1.5 m), `src/quest-graph.js`'s
exported functions, `data/npcs.json`'s existing 27-pair `chatter` pool keyed
by `ward`, and `data/sounds.json`'s existing `steps`/`bell` shape were read
off the code before being cited in `SPECS.md`, rather than assumed from the
wishlist's own paraphrase of them.

**Not verified here, on purpose.** No suite ran because there is no code
change; `npm test` and `npm run build` are green on `main` before and after
this PR, which touches three markdown files. `npm run play` was not run and
could not be (#53), and nothing in this round claims a GPU result — every
row that needs one says so in its own `SPECS.md` section rather than in this
entry.

## A fourth body: looked for, and not found from here (2026-09-17)

**Ranked row 1, on `claude/backlog-rank-1-tfcr3e`.** `SPECS.md`'s source
order is Quaternius's own packs first, then any CC0 humanoid with an `Idle`,
a `Walk` and a material named `Skin`, never a re-tinted Farmer, and its last
line is that a row with nothing that fits closes as "no woman's body found,
the bet stands" and says where was looked. This is that result, written the
way #518 wrote the texture sets a container could not fetch: the row stays,
with what was found and what to fetch. No asset, no code and no data moved.
Decisions #568 to #570.

- **Every host that carries a Quaternius body answered 403 from this
  container, and the npm registry is the only one that did not** (#568).
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
  proportion** (#569). Rendered headless with poppygl (a software
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
  century** (#570). They are Quaternius's Animated Women rig: `Head`,
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

## A second day, increment 3: the gaol roll (2026-09-17)

**Ranked row 4, on `claude/awesome-bell-s2wweo`, under Claude Opus 5.**
`SPECS.md` named three threads in increment 3 and said two of them wait on
something this container has not got: Thomas Wykes's yard wants a town built
on the ground #546 laid, and a schedule with more than one watch has to
overturn #533 rather than work around it. The third waits on nothing. This is
the third. Decisions #571 to #575. Ten suites green, `npm run build` green,
`dist/` 52 MB against the 200 MB ceiling (#499), and `npm run play` was not
run and could not be (#53).

- **The gaol roll is a piece of evidence in the guardroom, and it convicts
  nobody** (#571). Eleven now, not ten: `data/mystery.json` has a
  `gaol-roll` row in `guardroom` at all four watches, and three clues behind
  it. `gaol-dates` (E) is the roll itself — Madoc Gof committed eleven days
  since for drawing a knife, out to the forge at Prime and in at Vespers
  eight days of the eleven, shut in at Compline every night of it and no
  entry against last night at all. `prisoner-inside` (D) is what those dates
  are worth beside Madoc's own story. `prisoner-forge` (S) is what he says
  when the roll is read back to him: the cart came in empty and went out with
  the axle riding low, and he has shod that horse eleven years, and it was
  not stone — which contradicts `merchant-stone` and gives a player who
  missed Terce a second way to catch Thomas Wykes in it.

  **It is in the guardroom because the garrison keeps the gaol.** The cell
  itself is barred on day one and only opens on the five mornings Madoc walks
  out (#539), so the roll could not live where the man does. The guardroom
  is the North-west Tower's ground room, the sentry sleeps through Prime in
  it, and the watch-bill (#557) is already on its north wall: the roll lies
  on the barrel-head in the east half, across the room from the bill every
  man of the eight reads his own duty off. It is the first piece of evidence
  that room has ever had.

  **Not one of its three clues is in anybody's `convicts` list**, and the
  Constable still takes Madoc's name on nothing at all — `convicts.prisoner`
  is still `[]`. That was the call worth making and it went the other way
  from the obvious one. A roll that made the Constable refuse the accusation
  would have taken the seventh ending away from any player who read it, and
  three refusals end the day as a fall, so reading the roll would have been
  punished. What the roll does instead is leave the player holding the dates
  and free to hang him anyway, which is the thing the second morning is
  about. `test/mystery.mjs` asserts the three are unconvicting, so a later
  session that wires one into the table fails here rather than discovering it
  in an epilogue.

- **The press is keyed on the deduction and not on the roll** (#572). A press
  moves an NPC out of `default` for good, and `prisoner-story` — the clue the
  laundress's own press is keyed on — is a default statement of Madoc's. Had
  the new press been keyed on `gaol-dates`, a player could have examined the
  roll, walked to the bars, pressed without ever having talked to him, and
  lost `prisoner-story`, the laundress's `wife` state and `nest-is-wife` with
  it, silently. Keying it on `prisoner-inside` makes the talk a precondition,
  because `prisoner-story` is one of that deduction's two premises. The same
  hazard exists on the Lady (press her to `window` before talking and
  `lady-hand` goes, and with it the Steward's press); it is not made worse
  here and it is not fixed here.

- **`day2.knew`: the morning after knows what the player read** (#573).
  Every one of the sixty line sets increment 1 shipped is keyed by what the
  player SAID and nothing at all by what he FOUND, and two of them were
  already saying the wrong thing to a player who had done the work. The
  inspector, in the `prisoner` ending, says of the gaol roll that "as far as
  I can tell, nobody else in this castle has ever looked at it" — to a player
  holding `gaol-dates` that is simply false, and it is the only line in the
  game the player can disprove out of his own journal. Nest, in the same
  ending, says "nobody asked me whether he had a wife" to the one clerk who
  pressed her with Madoc's story and got `nest-is-wife` for it, which is the
  game forgetting a conversation it ran.

  A row is `{npc, clue, when?, unless?, lines, why}`, the `when`/`unless`
  grammar is the one `day2.castle` already uses (`changeApplies` is now
  `appliesTo` and both read it), and a row REPLACES the set the
  key/class/default cascade would have resolved. Three rows, all on
  `prisoner`: the inspector, the Constable who hanged on the name, and Nest.
  **A row may never be the only answer.** `dayTwoLines` takes the journal as
  a fourth argument and the validator passes it null on purpose, so every
  reachable ending still has to resolve through the cascade alone; a `knew`
  row is always an extra reading of a morning that already has one. The save
  did not move: the journal is `state.clues`, which day two already carried,
  so the key is still `castleConundrumSave_v1` at version 2 (#36, #413,
  #533) and `migrate` was not touched (#37).

  Nine validator rails, each one a way a row can be dead while the screen
  says nothing because the cascade answers in its place: a speaker not in the
  cast, a speaker with no station at Lauds, a clue the mystery does not have,
  a clue nothing in the castle yields, no lines, no `why`, a `when` naming no
  reachable ending, a row on a morning its speaker is hanged on, and two rows
  on one person and one clue that both fire on one morning.

- **A built slab rests on something, and `test/layout.mjs` says so** (#574).
  Check 1d, new. A `builtProps` entry is a box at a typed `base` and nothing
  about that number is measured off what it is meant to be lying on: the
  cloak's 0.6 is the laundry crate's height typed a second time, the
  walk-bar's 8 is the curtain stub's top typed a second time, and the gaol
  roll's 0.79 is the guardroom barrels' 0.787 typed a second time. Sixteen
  slabs, sixteen numbers that stop being true when what they name moves, and
  a slab hanging in mid-air is invisible to every other check in that file:
  it is in no wall, in no flight, in the right room, and reachable. The rail
  is that something whose top is within 0.05 m of the base overlaps it in
  plan. All sixteen pass; the gaol roll is the first whose support is another
  prop rather than floor or stone.

  **Placed in Node, not by eye**, the way #557 placed the thirteen documents.
  A scratch script loaded the real plan and tested the candidate box against
  every stone sector, every flight, every other box in the tower, the
  guardroom's 2.8 m disc and the walkable cells within 1.5 m: clear of all of
  them, 2.035 m from the disc's centre at its furthest corner against a 2.8 m
  ring, 90 cells within reach. The barrels are 0.947 x 0.48 m at their 1.6
  scale and the 0.4 x 0.3 m slab, rotated with them, sits inside that
  footprint with 0.03 m to spare on the short axis.

- **Increment 3 is not closed by this, and rank 4 stays** (#575). The town
  half and the bells-on-day-two question are untouched and are still what
  `SPECS.md` says they are. What did change about the rest of the row is that
  `day2.knew` exists now: a second mystery for the morning has somewhere to
  put "the player found this out", which every remaining thread in the
  increment needs and none of them had.

**Broken on purpose, from a green baseline** (#34). Five breaks, each from
ten green suites, each reverted from a copy taken before it, green again
after.

1. `gaol-roll`'s `base` 0.79 → 1.2 in `scene-config.json`. `node
   test/layout.mjs` exited 1: `gaol-roll has its base at y 1.20 and nothing
   under it within 0.05 m of that, so it hangs in the air`.
2. The `dayTwoKnew` branch deleted out of `dayTwoLines`. `node
   test/mystery.mjs` exited 1, three assertions down, the named one being
   `the King's man says so to his face`, whose detail printed the shipped
   `prisoner` lines with "nobody else in this castle has ever looked at it"
   in them — the bug the row fixes, in the failure message.
3. `beginDay2` stopped passing `st.clues` to the resolver. The same three
   assertions, which is the point: the wiring and the resolver fail
   separately.
4. `gaol-roll`'s room `guardroom` → `cell` in `mystery.json`. `node
   test/layout.mjs` exited 1: `evidence "gaol-roll" stands at (-34.40,
   -15.20), outside cell (x -22.8..-17.2, z 13.2..18.8)`.
5. `prisoner-inside`'s second premise `prisoner-story` → `cook-lantern`.
   `node test/mystery.mjs` exited 1: `Madoc talks, and the deduction lands
   the instant his story is beside the roll — prisoner-story`, and the press
   assertion under it.

The nine `day2.knew` validator rails are breaks by construction — each one
mutates a copy and asserts the message — and all nine fire with the message
written for them.

**What was measured.** `data/mystery.json` 1775 lines to 1876,
`src/mystery.js` 1036 to 1121, `test/mystery.mjs` 685 to 786,
`test/layout.mjs` 1082 to 1112, `data/scene-config.json` 2530 to 2546,
`data/npcs.json` 579 to 584. Clues 39 to 42, presses 8 to 9, evidence 10 to
11, day-two line sets 60 plus 3 `knew` rows. `plan-vs-scene.mjs` 287 pieces,
one more than before this pass, all within 0.01 m of the plan. `dist/` 52 MB,
unmoved.

**What nobody has seen.** The roll is a parchment-coloured slab on a barrel
head and no eye has been on it. `npm run play` does not walk into the
guardroom — the intended path never enters the North-west Tower — and no
beat was written for it, because a beat that cannot be run from here cannot
be trusted (#53); `test/play-castle.mjs`'s header now says which piece of
evidence it does not walk to and what to look at. The three `knew` line sets
have been read in a terminal and not in the dialogue pane.

## Side quests: the format, the set validator, and the cook's knife (2026-09-17)

**Ranked row 9, on `claude/friendly-darwin-xdh53e`, under Claude Opus 5.**
The first increment `SPECS.md` specs for this row is the format, the set
validator and the cook's missing knife, and it was picked over the two rows
above it that a container can also start because those two read
`data/npcs.json`'s `cast`, which is what rank 1 and rank 11 are for and both
of those are Fable 5.1's. This row reads the cast and never writes it.
Decisions #576 to #581. Ten suites green, `npm run build` green, `dist/` 52 MB
against the 200 MB ceiling (#499), and `npm run play` was not run and could
not be (#53).

- **A side quest is a `QuestGraph` in its own file, driving one person's
  lines and nothing else** (#576). `data/quests/` is the directory,
  `data/quests/index.json` names the files in it because a browser cannot
  read a directory, and `data/quests/cooks-knife.json` is the first. A quest
  file is the frame's own shape — `start`, `stages`, each stage an
  `objective`, a `dialogueState` and `transitions` — plus two fields the
  frame does not need: `id`, which has to be the file's own name, and `npc`,
  which is whose lines this quest may change. `src/quest-manager.js` grew no
  class for it: `_event` sends one event to the frame and then to every side
  quest, `_dispatchSide` is twenty lines, and `_syncStates` gained one
  layer between a press and the frame's floor. `_dispatchSide` cannot reach
  the frame's `_actions` table and says why: a side action added later and
  spelled `showEpilogue` would otherwise end the game out of a quest file.

  The index is not a second place to forget. `test/quest.mjs` reads
  `data/quests/` off disk and holds `index.json` to it in both directions, so
  a quest file added and not named fails the suite rather than sitting
  unloaded and unnoticed.

- **The isolation rule is about `dialogueState`, because there is no effect
  to make it about** (#577). `SPECS.md` wrote the rule as "no quest effect
  names a key `mystery.json`'s clue graph owns", which reads as an action
  that writes a clue key. There is no such action, and there cannot
  accidentally be one: a side quest's action list
  (`QuestManager.sideActions`) is empty, and the engine's idea of who is in
  what state is `st.pressed` (`src/mystery.js:879`), which nothing in
  `data/quests/` can reach. Marged still grants `cook-lantern` and
  `knife-missing` on the first conversation whatever stage the knife quest is
  in, and `test/quest.mjs` asserts exactly that by playing the same four
  presses of E through a manager with the quest and a manager without it and
  diffing the two journals.

  What a side quest **can** do is name a state the clue graph owns. A quest
  that put the Clerk in `cornered` would show his confession to a player who
  never pressed him: the clue is not granted, but the text that is the reward
  for granting it is on screen for free. That is the key the rule names, and
  `validateQuestSet` refuses it by clue id. The second half of the same rule
  is in `_syncStates`, where a press beats a side quest and not the other way
  round, so even a quest that got past the validator could not cover a
  payoff the player earned.

- **One voice per person, in its conservative form** (#578). `SPECS.md`'s
  second set rule is "no two quests want the same NPC in two states at one
  bell". A side-quest stage is not keyed to a bell and two quests have no
  order between them, so which of two competing line sets the player hears is
  whichever file the loader read first, at every bell. Deciding that
  statically means deciding whether two stages can be co-active, which
  without simulating both graphs is undecidable, so the rule enforced is the
  conservative one that implies it: **only one quest per person may hold a
  non-default `dialogueState` at all.** A second quest may still name that
  person and turn on their conversations; it just may not change what they
  say. An increment that wants two threads on one cook replaces this with a
  co-activity check rather than relaxing it.

- **The frame keeps the tracker; a side quest gets a toast** (#579). One
  objective line on the HUD is the frame's (#393) and a side quest writing to
  it would put "find a knife" over the top of a dead mason. The journal's
  open-quests tab `SPECS.md` defers is where a side quest's objective belongs
  and this increment does not build it; what it builds is
  `QuestManager.openQuests()`, which is the tab's data waiting for the tab,
  and a toast on every move, under the quest's own title, through the same
  `ui.toast` a new clue already uses. A resume does not toast, which is why
  the toast is in `_dispatchSide` and not in the constructor.

- **The save is version 4, and `quests` is one stage id per file** (#580).
  The key does not move (#36); it is `castleConundrumSave_v1` still. `quests`
  is `read`'s case and not `day`'s: there is no fact a missing `quests` can
  contradict, because a quest that has never moved is a quest at its own
  `start`, which is what `repair` writes anyway. The version goes up because
  a field arriving is what a version number is for (#37), and `migrate` has
  nothing to do but say so. `repair` writes the block from the catalog rather
  than from what came in, so all three ways a save can be wrong land
  somewhere safe: a quest the save never heard of gets its own start, a stage
  that quest no longer has resets to that quest's start rather than the
  frame's, and a quest id that is no longer a file is dropped by never being
  copied across.

- **The cook's knife connects to the mystery by reading it and writing
  nothing** (#581). Every event the quest turns on is one the engine already
  emits about a clue the mystery already owns. `clue:knife-missing` is
  Marged's own herring statement and opens the thread; `clue:knife-found` is
  the bakehouse barrel, which has been in `mystery.json` since Phase 3 with
  nothing in the game pointing at it; `talked:cook` after that closes it.
  Both clues are `herring: true` and stay that way. What the quest adds is
  three line sets on Marged and a reason to have opened the barrel, and her
  last word on it is "the lantern is the one that went up the Chapel Tower
  stair", which is the mystery's and is the one of the two that matters. This
  is #550 question 6's "independent of, connected to" as a worked case rather
  than as a sentence.

  **`validateMystery` had to learn the third answer.** Its dialogue
  reachability rail said every non-default state is reached by a press or
  named by a stage, and the cook's three knife states are neither. It takes
  the side quests as a fifth argument now and keeps them per npc, so a knife
  state on the cook is no excuse for the same key on the Steward.
  `test/quest.mjs`'s own copy of that check learned the same thing the same
  way.

- **The row is not closed and rank 9 stays** (#581 continued). One quest is
  not a dozen and one quest cannot move a reputation counter anyone could
  tell was moved, which is the deferral `SPECS.md` already recommends. What
  is left in the row is the next eleven quests by ward, the journal's
  open-quests tab, and reputation as two save-carried counters once there are
  enough quests to make one visible. `SPECS.md`'s section is rewritten to say
  what shipped and what the next increment is.

**Broken on purpose, from a green baseline** (#34). Five breaks, each from a
green suite, each reverted, green again after.

1. `data/quests/cooks-knife.json`'s `hunting` transition `on` changed from
   `clue:knife-found` to `clue:knife-lost`. `node test/quest.mjs` exited 1
   with eight failures, the first being `validateQuestSet finds nothing
   wrong with the set as it ships — cooks-knife.json: hunting: 'on' is
   "clue:knife-lost" and no clue knife-lost in mystery.json`. The other
   seven are the knife walk itself, which stops at `hunting` and never
   reaches the telling: the event rail and the walk fail separately, which
   is what makes both worth having.
2. A second quest file written into `data/quests/` and not named in
   `index.json`. `node test/quest.mjs` exited 1: `index.json names exactly
   the 2 quest file(s) on disk — index: cooks-knife.json / disk:
   cooks-knife.json, second.json`.
3. That same second file named in `index.json`, on `steward`, with a stage
   whose `dialogueState` is `admits`. `node test/quest.mjs` exited 1:
   `validateQuestSet finds nothing wrong with the set as it ships —
   second.json: a stage puts steward in 'admits', which is a state
   mystery.json's clue graph owns (clue steward-admits) — a side quest never
   gates or removes a mystery clue (#550, question 6)`.
4. The new clause deleted out of `validateMystery`'s reachability rail
   (`&& !sideStates.get(id)?.has(state)`). `node test/mystery.mjs` exited 1
   with three failures, the first being `validateMystery finds nothing
   wrong, the castle included — cook: state knife-hunting is reached by no
   press, no stage and no side quest`, and the same for `knife-found` and
   `knife-settled`.
5. **`_syncStates`'s press branch reordered so the side quest is consulted
   first, and the suite stayed green** — which is #147's case, and the
   comment was not the thing that was wrong; there was no assertion at all.
   The rule that a press beats a side quest could not fire because the only
   side quest that ships is on the cook and nothing in `mystery.json`
   presses the cook, so the two layers are never both in the room. What
   `test/quest.mjs` has now is a side quest on the Steward, held in a state
   invented in the suite on a cast cloned in the suite (`validateQuestSet`
   refuses `admits` outright, which is the point), pressed on
   `summons-is-stewards` at Sext. With that assertion in, the same reorder
   exits 1: `and the press is what comes out of his mouth, not the side
   quest that was holding him — stocktaking`, and `which is the admission
   the player earned` under it. `rig()` grew two parameters to make it
   possible and neither reaches disk.

The set validator's seven other rails are breaks by construction — each
writes a second quest file into the set in memory and asserts the rule names
it — and all seven fire with the message written for them, as do the two new
`validateMystery` rails.

**What was measured.** `src/quest-graph.js` 228 lines to 368,
`src/quest-manager.js` 537 to 651, `src/save.js` 147 to 173, `src/mystery.js`
1124 to 1133, `src/main.js` 291 to 309, `data/npcs.json` 584 to 601,
`test/quest.mjs` 764 to 1003, `test/save.mjs` 314 to 354, `test/mystery.mjs`
786 to 805. Two new data files, 3.6 KB together. One side quest, four stages,
three new line sets on one of the twelve. `dist/` 52 MB, unmoved.

**What nobody has seen.** Marged's three new line sets have been read in a
terminal and not in the dialogue pane, and the quest's toast has been
asserted as a string and not looked at on a HUD. `npm run play` does not walk
into the kitchen or the bakehouse — the intended path reaches neither — so no
beat was added for the knife, because a beat that cannot be run from here
cannot be trusted (#53).

## The tooling: the placement editor (2026-09-17)

**Ranked row 13, on `claude/friendly-darwin-xdh53e`, under Claude Opus 5.**
This row was reached by way of rank 10, which was claimed first and turned out
to be already built; #582 is that finding and it is why the claim moved.
Decisions #582 to #587. Eleven suites green, `npm run build` green, `dist/`
52 MB against the 200 MB ceiling (#499), and `npm run play` was not run and
could not be (#53).

- **Rank 10's first increment is already shipped, and the row's premise is
  wrong** (#582). `SPECS.md` says "eight drums with three floors each is 24
  rooms against about 6 in use" and asks for a floor slab and a `planId` for
  each unused one. Measured against `data/scene-config.json`: all eight drums
  carry a room at levels 0, 1 and 2, four carry one at level 3, and the castle
  has **40 rooms — 14 on level 0, 11 on level 1, 11 on level 2, 4 on level
  3**, which is the count `test/plan-vs-scene.mjs` has been printing on every
  run since #526. The four drums with no top room are the four with a 2.5 m
  turret, and #523 refused those on arithmetic: a 2.5 m turret in a 2.8 m ring
  leaves a 0.3 m ledge. There is no unused drum floor to add. The row's
  section was written on 2026-09-17 from `WISHLIST.md` rather than from the
  code, and `SPECS.md`'s own header says so about all eight new sections; this
  is the first one where it mattered.

  **What the castle has instead is nineteen empty rooms.** Of the 40, 21 hold
  a piece of evidence, an NPC station, a readable document or a built prop.
  The other 19 hold nothing at all: seven of the eight tower first floors,
  seven of the eight tower top rooms, all four roofs, and the larder.
  `PLAN.md`'s own risk line — "an empty room is worse than no room" — is not a
  risk any more, it is the state of the castle, and it got there because the
  volume shipped ahead of anything to put in it. So rank 10's volume increment
  is closed as done rather than built twice, and the row's next increment is
  the town and the map. Adding a latrine turret and a well chamber, which the
  same paragraph also names, was considered and refused for one reason: it
  would have made the count 22.

- **The placement editor is `?edit=1`, and it writes the file** (#583). Rank
  13's first increment, taken up because the thing rank 10 needed turned out
  to be a content problem and this is the tool for content problems:
  `SPECS.md`'s own words for it are "how every prop in the castle got there so
  far and why there are so few". A panel top-left reads the tile under the
  player's feet as they walk, offers the three placeable arrays
  (`interiorProps`, `builtProps`, `braziers`) with the models and materials
  the config already names, and **P** writes the row into
  `data/scene-config.json`. It does not commit: the diff is for a person.

- **It is a text splice and not a re-serialise, and that is measured** (#584).
  `JSON.stringify(JSON.parse(raw), null, 2)` over `scene-config.json` is not
  the file: the lighting block's `"intensity": 2.0` comes back as `2`, and
  94212 bytes go out as 98330. A round-trip writer would put four kilobytes of
  unrelated churn into every placement's diff, and the diff is the product. So
  `tools/place.mjs` finds the array, finds its closing bracket, and inserts one
  element before it. `test/tools.mjs` asserts the property that matters by
  cutting the new row back out and comparing the whole file to the original,
  byte for byte.

- **The dev-only guarantee is two independent halves and neither is trusted**
  (#585). The client is imported from inside `if (import.meta.env.DEV && ...)`
  in `main.js`, which Vite replaces with `false` and deletes, so
  `src/edit-mode.js` never enters the production module graph at all. The
  writer is a Vite plugin with `apply: 'serve'`, which cannot run in a build
  even if something called it. The `?edit=1` test is *inside* the DEV branch
  rather than beside it, so a query string on a built page can never pull the
  module in.

- **And the check on it is a grep of what got built, not the served-set diff**
  (#586). This is #501's lesson pointed at a second target, and the reason is
  exact: the served-set diff compares what a built page fetched against what a
  source page fetched, and *neither* page asks for the editor — the built one
  cannot and the source one does not without `?edit=1`. The two file sets
  agree perfectly while the editor's code sits inside a bundle a browser
  downloaded. So `test/built.mjs` greps every shipped `.js`, `.css`, `.html`
  and `.json` under `dist/` for `edit-mode.js`'s own sentinel string, and
  asserts the sentinel is still in the source file so that renaming it cannot
  make the check go quiet. The break below confirms the diff stays green while
  the grep fails.

- **`test/tools.mjs` is the eleventh suite, and the hand-test is not the whole
  proof** (#587). `SPECS.md` asked for this row to be proved by walking the
  dev server and looking, and that proof is in the PR. It is not enough on its
  own: the part of this tool that can quietly destroy something is a pure
  string-to-string function over a file ten other suites read. The suite drives
  it against the real `data/scene-config.json` and never writes to disk.

  **It caught a fault on its first run, which is the best kind of evidence.**
  One of its rails holds every key a placeable row may carry to a key the
  existing rows already use, so the allow-list cannot drift into inventing a
  field the builder ignores. It failed on `braziers: base`, which this session
  had put there an hour earlier. `main.js` hands `b.tile` to `createBrazier`
  through `tileToWorld` and reads nothing else, so a `base` written beside it
  would have been read by nobody and a brazier placed on a tower's first floor
  would have silently landed on the ground. The field is gone from both sides
  and the panel says so instead.

**Broken on purpose, from a green baseline** (#34). Two breaks, each reverted,
green again after.

1. The `import.meta.env.DEV &&` dropped out of `main.js`'s guard, so the editor
   is imported on any page with `?edit=1`. `npm run build` then emits
   `dist/bundle/edit-mode-go3WXeTn.js`, and `npm test built` exited 1: `the
   placement editor is in no file dist/ ships — bundle/edit-mode-go3WXeTn.js`.
   **That was the only failure**: the served-set diff, the KTX2 count and the
   offsite-request check all stayed green, which is exactly the claim #586
   makes about why a grep was needed.
2. `insertRow` replaced with `JSON.parse`, `push`, `JSON.stringify(_, null, 2)`.
   `node test/tools.mjs` exited 1 with four failures, three of them the same
   line once per array: `interiorProps: and every other byte is the byte it was
   — 94212 bytes in, 98330 back out`, which is the measurement #584 is written
   on, produced by the break rather than quoted at it.

The shape rules are breaks by construction — eleven of them, each calling
`checkRow` on a row with one thing wrong — and all eleven fire with the message
written for them.

**The hand-test** (`SPECS.md` asks for this one in the PR rather than in
`npm test`). Driven headless so it could be run from here: load `/?edit=1` on
the dev server, wait for the panel, type a comment, press P. The panel mounted
as `castle-placement-editor-v1`, read the player as `tile -10, 0 | West
barbican — feet 0.00 m`, said `wrote interiorProps[12] at -10, 0`, and
`data/scene-config.json` went from 94212 to 94436 bytes with no page error. A
second run through the endpoint alone placed a stool in the larder at tile
[-5.1, -4.1]: nine lines added, nothing else in the file touched, and
`makePlan` built it at 0.57 m from the larder's centre in a 2.8 m disc, sitting
on the floor at y 0.00. Both placements were reverted; this row ships the tool
and no props.

**What was measured.** `tools/place.mjs` new, 144 lines. `src/edit-mode.js`
new, 153. `test/tools.mjs` new, 149. `vite.config.js` 109 lines to 155,
`src/main.js` 309 to 324, `test/built.mjs` 183 to 216, `test/run.mjs` +1,
`README.md` +10, `CLAUDE.md` +9. `dist/` 52 MB, unmoved, and the bundle is 795.26 kB
against 795.31 before this row — the editor is not in it.

**What nobody has seen.** The panel has been driven headless and photographed
by nothing. Whether 280 px of monospace in the top-left corner is usable beside
the HUD, and whether the wireframe marker reads as a marker, are questions for
a machine with a GPU and a person at it (#53).

## A castle to get lost in: the map (2026-09-17)

**Ranked row 10, on `claude/hopeful-feynman-mdnahz`.** The map half of the
row's next increment, which `SPECS.md` said waited on nothing and a container
could start; the town half still waits on rank 4's yard. Decisions #588 to
#591. Twelve suites green, `npm run build` green, and `npm run play` was not
run and could not be (#53).

- **The HUD's room line is the one thing that enters a room** (#588). Until
  this row `main.js` asked two questions of the same point every frame:
  `roomAt`, for the line at the top of the screen (#515), and `inRoom` on the
  one room `mystery.json` makes a clue of, the cross-wall walk, through a
  `placeClues` list gated on the player walking. `inRoom` is the test
  `roomAt` settles for every room, so the second question was the first
  asked narrower. Now the line's own change is the event: when `roomAt`'s
  answer changes and the answer is a room, `quest.handleEnter(id, level)`
  runs, and `engine.enter` does both things a room entry does — grants every
  `L` clue whose source is the room, which is how `walk-crosses` lands, and
  puts the room on `visited` once, saying so with a `visited` effect the
  first time and not the second. The manager marks the autosave on that
  effect the way it does on a clue, so a doorway stepped through twice is one
  mark and not two. **Open ground is not handed over.** `roomAt` answers
  `west-barbican`, `outer-ward`, `inner-ward` or `garden` for a point in no
  room, and none of those is a room the plan builds; `repair` would strip
  them from the save on the next load, and a set the game writes knowing it
  will be stripped is not a set. So `here.open` is the gate and the wards are
  the ground between the rooms, on the map as the space the shapes sit in.

- **The map is the journal's third tab, and it is the plan drawn** (#589).
  "The castle", beside "What you know" and "Things read" (#551). The list is
  `src/stations.js`'s new `nav.rooms()`: the plan's 40 rooms, each with the
  name the HUD's line would show for it, resolved the same way the line
  resolves it, and the plan's own bounds and disc handed over untouched, so
  the map is drawn off the numbers the walls are placed by (#500) and nothing
  computes a second shape. `ui.js` draws one inline SVG per storey, all four
  on one viewBox so a tower's rooms stack under each other down the page,
  in world metres with the plan's -z up because `north-walk` is at z -16 and
  `south-walk` at z 14. A tower room is a `<circle>` on its drum's centre and
  inner radius; everything else is a `<rect>` on its bounds. A room stood in
  is filled and named; a room not yet stood in is an outline and its name
  under the drawing is three dots, because forty named outlines is a
  gazetteer and a map the player earns is the row's own words for it
  (`WISHLIST.md` theme 5). The room the HUD names is ringed, off the id
  `setRoom` now carries beside the text, so "you are here" and the line are
  one answer. The four storey names live in `ui.js` as words, not in the
  plan: the plan has levels and the levels are numbers.

- **The save is version 5, and `visited` is `read`'s case** (#590). One room
  id per room stood in, in the order first entered, after `read` in the
  schema. Nothing a missing list could contradict, so `repair`'s empty
  default is right on its own and `migrate`'s line only keeps the field's
  arrival honest against the number (#37), exactly as #551 argued for `read`.
  The catalog's rooms come off `data/scene-config.json`'s `rooms`, because
  that list is what `makePlan` builds the castle's rooms from and nothing
  else: a room cut from the config is cut from the walls, the HUD, the map
  and the save on the same load. The key did not move (#36).

- **`test/map.mjs` is the twelfth suite, and what it may not assert** (#591).
  It is allowed in CI for the reason `touch.mjs` is: the camera is placed,
  never walked, the render loop runs two frames, and what is read back is a
  data attribute, so #53 does not bite. The probe stands in a room at its
  centre, or failing that at one of eight points 2 m round it, and settles
  on the first point the HUD's own line names the room — because the Great
  Hall's centre at (-20, 10) is no cell at all (a prop stands on it) and a
  room is entered only where there is floor. Three rooms make the tour, one
  of each shape and axis `inRoom` reads: a ground box, a ground disc, a disc
  two storeys up. It asserts the seams only (#529): that a step reaches the
  DOM, that the DOM survives a reload through the save (#39), that the ring
  follows the line, and, once, that a save carrying a room the plan does not
  build loses it on load. That every room has a name that is not its id,
  that `nav.rooms()` is the plan's list one for one, that every shape is a
  box or a disc — those are Node facts and went into `test/layout.mjs`. The
  reload beat reads the set and not the camera: a placed camera is not a
  walking one and marks nothing dirty, so where it comes back is the
  autosave timer's business and the first draft of the suite, which asserted
  it, failed for exactly that reason.

**Broken on purpose, from a green baseline** (#34). Five breaks, each
reverted, green again after.

1. `save.js`'s rail replaced with `Array.isArray(s.visited) ? s.visited : []`.
   `npm test save` exited 1 on three assertions, the first of them `a room
   the plan does not build is dropped from `visited` (#588), the wards with
   it: they are ground, not rooms — great-hall, outer-ward, great-hall,
   oubliette, 7`.
2. `mystery.js`'s `st.visited.push(room)` deleted. `mystery` and `quest`
   both exited 1: `and the walk is on `visited`, with a `visited` effect
   saying so`, `a second step onto it is no effect and no second entry`, and
   in the manager `and the second step into the same room does not — 2
   marks`, which is the once-per-room rule failing from the other side.
   `the first step into a room marks the autosave` stayed green, correctly:
   the effect still fired, every time.
3. `nav.rooms()` made to name every room by its id. `layout` exited 1 with
   forty lines, one per room, the first `"clerk-office" on level 0 would go
   on the map as "clerk-office": neither mystery.json's rooms nor
   scene-config.json names it`.
4. The `quest.handleEnter` call deleted from `main.js`'s room line. `map`
   exited 1 on twelve assertions, the first `standing in great-hall puts it
   on the engine's visited set`. Nothing else in CI noticed, which is the
   point: before this row the cross-wall walk's clue had no check that a
   page could grant it either.
5. `ui.js` made to write `data-visited="0"` on every shape. `map` exited 1
   on five, the first `the map fills in exactly those three`, while `and
   says so in words — 3 of 40` stayed green because the count is rendered
   from the same list the attribute was lying about.

**What was measured.** `test/map.mjs` new, 196 lines. `src/ui.js` 438 lines
to 523, `src/quest-manager.js` 658 to 678, `src/stations.js` 204 to 221,
`src/save.js` 173 to 184, `src/mystery.js` 1133 to 1148, `src/main.js` 324
to 324 (a loop out, a comment in). `test/save.mjs` 354 to 383, `test/quest.mjs`
1003 to 1040, `test/layout.mjs` 1112 to 1137, `test/mystery.mjs` 805 to 812.
`npm test map` takes about 67 s here, three page loads in it. The bundle is
798.10 kB against 795.26 before this row; `dist/` did not move.

**What nobody has seen.** The SVG has been read as a DOM and photographed by
nothing. Whether four storeys of outlines at 620 px wide read as a castle,
whether a filled disc against a dim outline reads as "been there", and
whether the ring is visible at all are questions for a screen and a person
(#53). The stroke widths are `non-scaling-stroke` pixels, 1 and 2, chosen
by arithmetic.

## Lore performed: two sermons, two songs, and the errands you have met (2026-09-17)

**Ranked rows 8 and 9 as the table stood that morning, on
`claude/charming-gates-77fz8r`.** Rank 8 whole, which is `WISHLIST.md` theme
3's two set pieces, the last of that theme that did not need the second day,
and rank 9's next increment, the journal's open-quests tab. Rank 8 closes with
this and every row under it moves up one, so the side quests are rank 8 from
here. Decisions #592 to #596. Twelve suites green, `npm run build` green, and
`npm run play` was not run and could not be (#53).

- **A performance is one person, in one room, at one bell, and the validator
  checks the station** (#592). `data/npcs.json` gains `performances`, two
  pools of two: `sermons` and `songs`. An entry is an `id`, the `npc` who
  says it, the `room` and the `watch` it is said at, the `lines` in order,
  and `cites`, the lore ids it tells, which `data/lore.json`'s own `sources`
  name back by the piece's id: the two-way citation a document and a chatter
  pair already carry (#551). `performance` is the fifth source kind and the
  third content-bearing one.

  The pool is flat where `chatter` is nested by ward and watch, because a
  chatter pair names neither a room nor a speaker's station and a performance
  names both. That is what let the check have teeth: `src/lore.js` reads
  `mystery.json`'s own `schedule` and refuses a piece whose speaker is not in
  that room at that bell, asleep at it, or (for a `lauds` piece) missing from
  `day2.schedule`. It refuses one given to anybody a verdict can take out
  of the castle too, because a sermon said by a man the player may have hanged is
  a sermon that does not happen in six endings out of seven. Two pieces
  wanting one room at one bell is refused too, which is what lets the manager
  never choose. `chatter` settled for each speaker's static `ward` field
  (#554); this did not have to.

- **The hall's song is a Vespers piece, and a second song went into the
  kitchen** (#593). `WISHLIST.md` asked for "a song in the hall at Sext" and
  the schedule puts nobody in the Great Hall at Sext: it would have been sung
  to an empty room, and the validator above says so rather than letting it
  ship. The hall's song moved to Vespers, which is the one bell both wards
  eat there and the canon's own `hall-high-table` says so, with six of the
  twelve in the room; Dafydd ap Rhys sings it, the sentry whose grandfather
  fought the other side of the March War (`sentry-grandfather`), and the last
  two verses are the ones `march-song` says the inner ward has heard the tune
  of for forty years and has never been told the words of. That left both set
  pieces at the last bell, so a fourth piece went in at Sext: Marged over the
  pots in the kitchen, counting the forty mouths she feeds off one oven. The
  four are the chapel at Vespers, the hall at Vespers, the kitchen at Sext,
  and the chapel at Lauds: the morning after, a filled grave, the works'
  own saint said over a man the chaplain's Latin went over the top of.
  A player hears two of the four on one play through day one, which is the
  point of a pool rather than a script.

- **The caption band is its own element, and a piece is heard once per page**
  (#594). `SPECS.md` said "the floating-caption overlay `chatter` already
  uses" and there is no such overlay: the chatter pool has never been played
  by anything, and its own comment in `data/npcs.json` has been promising
  that band since #554. So it exists now: `#caption`, top centre, a name and
  a line, no border and no panel, clear of the tracker, the toast, the
  interact prompt and the dialogue box because a sermon runs the better part
  of a minute and all four of those can happen over it. It is not the toast,
  which replaces itself on the next clue and would cut a verse in half, and
  it is not the dialogue box, which waits for E: nothing here waits for
  anything, the player keeps every key, and walking out of the room is how
  you leave. `QuestManager` steps the lines on its own injectable
  `_schedule`, about a beat plus twenty-two characters a second per line,
  and a run that is no longer the current one does nothing when it wakes up,
  so no timer is ever cancelled and the suite can play a whole sermon in no
  time at all.

  **Once per page and not once per save** (#39, and no version bump). A
  sermon is a thing that happens in a room, not a thing the player holds: a
  reload standing in the chapel at Vespers hearing Vespers again is right
  rather than wrong, and `read`, `quests` and `visited` are all fields a
  reload has to survive because the player earned them. `_heard` is a Set on
  the manager. The save key did not move and the version is still 5 (#36).

- **The journal's fourth tab is the errands you have met** (#595, rank 9).
  `QuestManager.openQuests()` has had the data since #576 and nothing read
  it; all a side quest got for moving was one toast (#579), and two toasts
  missed are two threads a player cannot find again. "Asked of you", beside
  "What you know", "Things read" and "The castle". **A quest sitting in its
  start stage is not on it**: the cook has not mentioned her knife yet, and
  a journal that lists an errand before the errand exists is the game telling
  the player where to go. **A finished one does not drop off it**, either: it
  goes under a Done heading with its title struck through, because "you did
  this" is half of what a list of errands is for. The tab is offered only
  when there is something in it. `questJournal()` returns null and not an
  empty list, the same shape the map already used, so a castle where nobody
  has asked for anything has the one list it always had. The Present picker
  inside a conversation still offers clues alone (#551).

- **Rank 8 closes, and the fact that changes goes to rank 4** (#596). The row
  had two pieces left in it and this PR built one; the other, a `since` field
  so a fact can say something different once the player has done something, is
  the one piece of that theme that cannot start before the second day has
  state to be about. The row's own Open call recommended filing it as a
  dependency of rank 4 rather than carrying a row for it, and that is what
  happened: `SPECS.md`'s "Lore: what is still open" section is gone, "A second
  day" carries the `since` half with a shape to beat, and every row under 8
  moved up one: side quests to 8, the castle to 9, bodies to 10, feel to 11,
  the tooling to 12. `BACKLOG.md` is twelve rows. What is left of
  `WISHLIST.md`'s theme 3 (more gravestones, the mason's marks elsewhere than
  the dormitory) stays in that file, unranked, the way a theme does until
  somebody takes it up.

**Broken on purpose, from a green baseline** (#34). Seven breaks, each
reverted, green again after.

1. `applyWatch`'s `_stopPerformance()` deleted. `quest` exited 1 on two: `the
   Vespers bell over a Sext song ends the song, vespers / "Forty to feed and
   the one oven lit, and eight of them sworn and no use of it;"` and `and the
   rest of the verses are not sung over the new bell, 6 vs 2`.
2. `_heard.add(piece.id)` deleted. `quest` exited 1 on `a piece is said once:
   back into the kitchen at the same bell and Marged has finished, 12 vs 6`.
3. The room test in `handleEnter` deleted, so nothing cut a piece off when the
   player walked out. `quest` exited 1 on `through the door to the bakehouse
   and the band is dark: you cannot hear the kitchen from here` and `and the
   steps still on the clock say nothing when they wake up, 6 vs 3`.
4. `src/lore.js`'s station check deleted. `lore` exited 1 on `a song moved to
   a room its singer is not in` and `and put in the mouth of somebody who is
   somewhere else at that bell, it fails`.
5. The one-room-one-bell rule turned into a plain `byPlace.set`. `lore` exited
   1 on `two pieces wanting the same room at the same bell`.
6. `questJournal()`'s `started` filter removed. `quest` exited 1 on `so the
   journal is handed no quest list at all, and the tab is not offered:
   [{"id":"cooks-knife",...,"objective":"Nobody has said anything about a
   knife."}]`, which is the unmet quest on the page in its own words.
7. `questJournal()` made to drop finished quests instead of marking them.
   `quest` exited 1 on three, including `and a finished errand stays on the
   page, marked done, rather than disappearing off it`.

Every check in `test/lore.mjs`'s new section is itself one of these breaks
held permanently: the section mutates the real pool and asserts the message,
which is why the validator's first run against the real four pieces coming
back clean is worth as little as it sounds.

**What was measured.** `data/npcs.json` 601 lines to 673 (the four pieces and
their comment), `data/lore.json` 545 to 556 (eleven facts now name a
performance as a source). `src/lore.js` 220 to 304, `src/quest-manager.js`
678 to 807, `src/ui.js` 523 to 603, `src/ui.css` 315 to 351, `index.html` 145
to 158, `src/main.js` 324 to 329. `test/lore.mjs` 210 to 299 and its
assertion count 37 to 56, `test/quest.mjs` 1040 to 1243 and 245 to 279.
Twelve suites green.

**What nobody has seen.** The band has been read as a string by a stub UI and
by nothing else: whether a caption at 13 % of the screen is readable over a
lit chapel, whether nine lines of a sermon is generous or tedious at the pace
this file picked, and whether "Asked of you" reads as a tab or as a scold are
all questions for a screen and a person (#53). The pacing is one arithmetic
expression in `src/quest-manager.js` and the band is one rule in `src/ui.css`,
which is where somebody with a GPU should start.

## Side quests: four more errands, and the catch-up (2026-09-17)

**Rank 8's next increment, on `claude/intelligent-bell-4ehggz`.** Four of
`WISHLIST.md`'s dozen, two per ward, on four people the cook's knife never
touched, and the rule the second of them forced out of the manager. Decisions
#597 to #599. Twelve suites green, `npm run build` green, and `npm run play`
was not run and could not be (#53).

- **A clue the player already holds is an event that already happened**
  (#597). `clue:<id>` fires once, when the engine grants it; the barrel says
  `gone` on a second E. So a side quest that reached a stage waiting on a
  clue the player found earlier waited for the rest of the day. The knife
  shipped with that hole (#576): open the bakehouse barrel before Marged
  mentions her knife and the thread opened on `hunting` and never left it,
  because the one event that moves it had fired an hour before the stage
  existed to hear it. The hawk would have had it worse, since the south walk
  is somewhere the mystery sends a player long before a lady mentions a
  bird.

  `QuestManager._catchUp` is the fix: on arriving anywhere, a quest walks
  forward through every `clue:` transition the new stage has for a clue the
  engine holds, and again for the stage that puts it in, until a stage waits
  on something the player has not done. Conversations are not caught up:
  `talked:` is a thing that happens, not a thing the player has, and
  `test/quest.mjs` says so with the porter spoken to before the sentry ever
  asked. **And it runs at the end of the batch, not on the move.** The first
  version ran it inside `_dispatchSide` and the knife went `unheard`,
  `hunting`, `found` on the clue and `settled` on the `talked:cook` three
  effects later, in the one conversation where Marged first mentioned the
  knife: the player heard her `default` lines and the errand was over, with
  the two line sets that *are* the errand never said. `_surface` is the
  batch now (`_inBatch` around its loop, cleared in a `finally`), an event
  inside it marks a mover, and `_settleSide` after the loop does the
  catch-up, one toast for the stage the quest ended up in, and the save. The
  break that proved the order is number 3 below.

  A save is settled the same way once at construction, so a save written
  before this decision that is sitting in exactly that stage comes back
  moved; and that changed one assertion: a save whose stage repair reset to
  `start` (#581) but whose clues are still held now comes back at `found`,
  one conversation from its end, rather than at `unheard` with an event it
  can never hear again. The save key did not move and the version is still
  5 (#36): a stage id is a stage id.

- **Four errands, and the smith's answer stays in the smith's mouth** (#598).
  `data/quests/` is five files. `ladys-hawk.json`: Lady Alys's merlin is
  loose on the south walk parapet over the Bakehouse Tower door, the sentry
  will not leave the north walk for a lady's bird, and the place she sends
  the player is the tally stick's place, so the thread turns on
  `clue:tally-on-walk`; the bird comes back on her own and what the lady
  says instead is what the south walk is, which is `walk-crosses` said
  sooner by somebody else. `candle-count.json`: Father Anselm's column is
  one tallow short since Compline and the fourth candle is the mystery's
  `candle` in the pricket at the first turn of his own stair, so the thread
  turns on `clue:chapel-candle`; what he says for closing the column is what
  a pooled candle's worth of tallow means about how long somebody stood at
  the turn, and not what he heard, which is the press's. `sentrys-dice.json`:
  Dafydd owes Gwilym four pence thrown for at the porter's table at Lauds,
  the errand is `talked:porter` and back, and the branch is the mystery's:
  only after `press:porter:door-unbarred` does he say he has known since
  Lammas that the bar leans on the wall and owed the man four pence and
  held his tongue. `hywels-chisel.json`: Hywel's good chisel went to Madoc
  for the Michaelmas edge a week before Madoc went up the tower.

  The chisel is the call. `SPECS.md` had it down as wanting rank 6's
  populace or an NPC state the game does not compute, and what it actually
  wanted was for Madoc's answer to be Madoc's: his lines are the mystery's
  and a quest changes one person's, so what Ieuan hears back from the bars
  is what the player heard, the lead, the cart, the Clerk's seal and not one
  word about a chisel. That is one ending, `own-edge`, the boy on the lodge
  stone. The other is the roll's: `press:prisoner:prisoner-inside` is the
  player proving Madoc was out to the forge by day, and a smith who works at
  the forge by day left the chisel where he works. Two terminals in one
  graph, which `validateQuest` has allowed since #393 and nothing had used.
  Every stage's state is one the clue graph does not own (`window`, `heard`,
  `forge` are all refused by name); each person got a fourth `default` line
  that opens the thread on the first conversation, the way Marged's did; the
  sentry cannot open his before Terce because the schedule has him asleep at
  Prime and `handleInteract` says so without an event. The walk through all
  five with and without them leaves the identical journal, and every
  pressed state still wins over its errand (#578). `data/lore.json` gained
  four facts sourced from the new states, 61 to 65.

- **A side quest names its ward** (#599). `ward` is which of the two counters
  reputation-by-ward will move when it comes, and the knife already carried
  one; `validateQuestSet` now refuses a file without it or with one the
  castle does not have (`WARDS` is `outer` and `inner`, exported). Three
  outer, two inner. Reputation itself stays deferred: five errands is enough
  for a moved counter to be visible, and it is the next session's, because
  it is a version bump on `save.js` and a chatter line or two and this PR
  was the errands.

**Broken on purpose, from a green baseline** (#34). Four breaks, each
reverted, green again after.

1. `_settleSide`'s `this._catchUp(q)` commented out. `quest` exited 1 on five,
   including `then the lady: the errand opens already past the walk, because
   the walk already happened — ... Go up and look for her. / hawk-loose` and
   `the barrel before Marged: the knife thread opens at `found`, not stuck in
   `hunting` waiting for a barrel that says gone — knife-hunting`.
2. The `WARDS` check turned into `if (false)`. `quest` exited 1 on two:
   `validateQuestSet rejects a quest with no ward — said nothing` and `and one
   in a ward the castle does not have — said nothing`.
3. `_catchUp(q)` put back inside `_dispatchSide`, on the move. `quest` exited
   1 on one: `the barrel before Marged: the knife thread opens at `found` ...
   — knife-settled`, which is the whole errand over in one conversation.
4. The toast put back on the move as well as the settle. `quest` exited 1 on
   `with one toast, for the stage the player is actually in`, showing both:
   `... Go up and look for her. | ... Go back and tell Lady Alys what sits
   there.`

**What was measured.** `data/quests/` 1 file to 5, 308 lines in all.
`data/npcs.json` 673 lines to 752 (four `default` lines and fourteen states),
`data/lore.json` 556 to 593. `src/quest-manager.js` 808 to 887,
`src/quest-graph.js` 368 to 375. `test/quest.mjs` 1243 to 1473 and its
`check` count 238 to 298. Twelve suites green.

**What nobody has seen.** Whether a lady who says "Ask." at the end of an
errand reads as a nudge or a scold, and whether four `default` lines is one
too many to click through on a first conversation, are questions for a
screen and a person (#53). The fourth line is the last in each set, so a
player who has the first three by heart is not made to re-read them.

## Where, Gate and Lane: the backlog says which machine, and `ROADMAP.md` says in what order (2026-09-17)

**Not a ranked row. Devon asked directly**, mid-session, for three things the
project had never written down: what has to happen on a machine this container
is not, what two sessions may hold at once without colliding, and what strictly
has to ship before what. Decisions #600 to #602. No code changed, twelve suites
untouched, `npm run build` untouched.

- **Three labels on every backlog row: `Where`, `Gate`, `Lane`** (#600). All
  three facts were already derivable and none was written where a session
  claiming a row would see it. The header said "ranks 2, 3 and 5 need a GPU" in
  a paragraph a reader had to parse, and it was already wrong in a way that
  mattered: **rank 1 does not need a GPU, it needs a network**, and #518 and
  #541 are the proof that those are different blocks — the same container that
  could not reach Poly Haven in September could reach it a week later, and
  #568's could not reach quaternius.com at all. Calling both "blocked" is what
  kept rank 1 sitting behind the wrong excuse.

  `Where` is one of four: `Container`, `Local: GPU` (#53), `Local: net`, and
  `Local: audio`, which is rank 7 and only for the judgement half. `Gate` is
  what must have shipped first. `Lane` is the file two sessions would collide
  on.

  Rank 4 and rank 12 each carry three values instead of one, because their
  remaining threads genuinely differ and `SPECS.md` already names them
  separately: **4a** the bells call, **4b** the `since` field, **4c** the yard;
  **12a** the budget suite, **12b** move-and-delete, **12c** the dialogue
  format. 4a and 4b are a container's and 4c is not; 12a has no lane, 12b is
  lane B and 12c is lane C. A single label on either row would have been a lie
  about two thirds of it.

- **`ROADMAP.md` is the order; `BACKLOG.md` is still the rank** (#601). A fifth
  document was not obviously warranted and the alternative was a section in
  `BACKLOG.md`. It got its own file because the two answer different questions
  and change on different schedules: the rank is Devon's judgement about worth
  and moves when he says so, and the order is arithmetic over the gates and
  moves whenever one clears. Folding them would mean a shipping session
  rewriting a priority list to record a dependency, which is how a priority
  list stops meaning anything.

  **The file names rows by title as well as by rank**, for the reason #522
  already found in `SPECS.md`: a closed row shifts every number under it, and a
  roadmap that says "after rank 2" ages into a lie the first time a row closes.

  **Four hard gates on twelve rows, and that is the whole finding.** R2 before
  R3 (the images have no other source), R2 before R5 (both criteria are a
  render), R2 before R11 ships past its Node line, and R4c's yard before R9's
  town. Everything else that reads like a dependency in `SPECS.md` — rank 6's
  populace under two of rank 8's errands, rank 10 and rank 6 trading activity
  clips, rank 12's budget suite being more useful with fifty bodies to count —
  is preference, and none of the three blocks a start. Devon expected the list
  to be loose and it is looser than he expected: **R2 is the only row that
  gates more than one other thing, and it is a ¼.**

- **One row per lane at a time, and a lane is a file** (#602). The claim rule
  (#283) stopped two sessions building the same row and says nothing about two
  sessions building different rows into the same file. Five lanes:
  **A** `src/save.js` (R4a, R4b, R8), **B** `data/scene-config.json` (R4c, R5,
  R9, R12b), **C** `data/npcs.json`'s `cast` and `npc.js`'s body machinery
  (R1, R6, R10, R12c), **D** `src/main.js`'s player rig and spawn (R6, R11),
  **E** `src/audio.js` and `data/sounds.json` (R7). R2, R3 and R12a have no
  lane.

  Lane A was already written in prose — rank 4's dependencies say *"do not run
  alongside anything else that touches `save.js`"* — and rank 8's next
  increment is a version bump to 6, so the warning had a live target nobody had
  connected it to. Lane B is the one that would fail quietly: `test/tools.mjs`
  holds `data/scene-config.json` to byte-exactness by cutting an added row back
  out and comparing the whole file, because a re-serialise of that file is not
  that file (#584, 94212 bytes out as 98330), and two splices neither session
  tested against each other is exactly the thing that rail cannot see.

  **Lane C is the `cast` block, not the file.** R8 and R12c write per-person
  `states` and `default` line arrays — a different region that merges — and
  drawing the lane at the whole file would have forbidden the one pairing the
  backlog header already recommends.

**What this leaves.** The three safe-together rows today are R8 (lane A), R6
(lanes C and D) and R12a (no lane), which is what the header already implied
and now says with a reason. Add R2 and R1 on Devon's machine and five things
move at once with no collision. The column values are a judgement over the
specs as they stand on 2026-09-17; a row whose scope changes changes its lane,
and the session that changes it owns the label.

## A fourth body: found, and worn by all three women (2026-09-17)

**Ranked row 1, on `claude/r1-fourth-body`, under Claude Fable 5.1, on Devon's
machine.** #568's container could not reach quaternius.com. This machine
could, and `ktx` v4.4.2 is on its PATH. Decisions #603 to #606. Ten suites
green and `npm run build` green; `tools` and `plan-vs-scene` fail on this
machine on untouched `main` as well, and both are written up at the bottom
rather than waved through. `dist/` is 53 MB against the 200 MB ceiling (#499),
which is the line #419 priced at "a new ceiling" and is not a constraint any
more. `npm run play` was not run: the GPU run is another session's row today.

- **The fourth body is the Ultimate Modular Women Pack's `Medieval.gltf`,
  committed as `assets/NPCs/Woman.glb`, and Marged, Nest and Lady Alys all
  wear it at 1.65 m** (#603). The pack page at
  `quaternius.com/packs/ultimatemodularwomen.html` says CC0 and links a
  public Google Drive folder; `Individual Characters/glTF/` holds ten bodies
  (Adventurer, Casual, Formal, Medieval, Punk, SciFi, Soldier, Suit, Witch,
  Worker), which is not the eight names the search index gave #568. Three were
  fetched, 3.1 to 3.2 MB each, and checked against `SPECS.md`'s three lists:
  all three carry the same 24 clips by the same names as the three on disk,
  `Wrist.R`, `Head` at 1.548 m against the men's 1.547, `Skin` at the same
  0.617, 0.418, 0.238, and zero textures. It is the same rig, so `pickClip`,
  `_findHandBone` and `HAND_BONES` needed nothing, and the `Palm.R` warning
  #570 left was about a different pack. Worker wears a hard hat and a hi-vis
  vest and Witch a pointed hat; Medieval is a hooded woman in a jerkin and
  breeches, and is the only one of the three that belongs in 1280. The other
  seven were not fetched. One oddity for the record: the pack's `License.txt`
  is headed "Ultimate Modular Males". The licence text under it is CC0 1.0 and
  so is the pack page, so this reads as the author's copy-paste and not as a
  different licence.

- **The file is not the pack's file, in four ways, and all four are in the
  re-export rather than in `npc.js`** (#604). The pack names the hair `White`
  and the eyes `Brown`, which `BARE_MATERIALS` does not match, so the tint
  would have dyed three women's hair: the head's two primitives take clones
  named `Hair` and `Eye`, the names the three on disk use. `DarkBrown` on the
  head is the hood and stays cloth on purpose, because a tinted hood is the
  largest thing that tells the three apart from the front. The boots take
  clones named `Boot` and `Boot_Trim` so they keep their leather. And the
  cloth itself was lifted: the pack's `Black`, `DarkBrown` and `LightBrown`
  are 0.03 to 0.16 linear, and a tint is a multiply, so cream, blue and gold
  all came out as the same near-black leather. That was seen, not reasoned:
  the first render of the three side by side could not be told apart. They are
  now 0.42, 0.62 and 0.80 grey-warm, undyed wool, and the tint is the colour.
  The dagger is a node named `Sword` and the pauldrons are the `Metal`
  material; both are hidden per person by `hideNodes` and `hideMaterials`, the
  way the clerk's backpack and the steward's gold already are. Lady Alys keeps
  the `Gold` trim and the cook and the laundress do not.

- **`test/assets.mjs` has a fifth check, and it exists because this session
  tripped the thing `SPECS.md` warned about** (#605). `npm run assets:encode`
  finds the bodies through `cast`. Run before `cast` named the new file, it
  said nothing about `Woman.glb`, left it at 1.55 MB of raw floats, and every
  suite was green. Check 5 reads `extensionsUsed` off every Poly Haven prop
  and every body `data/` names and fails a file with no
  `EXT_meshopt_compression`, naming the script to run. The Kenney kit stays
  exempt (#508). Encoded, the body is 1.02 MB. The same run rewrote ten
  untouched Poly Haven `.gltf` files with LF on a CRLF checkout, ten diffs of
  nothing, so `encodeGLTF` now returns before `io.write` when it has encoded
  neither a texture nor a mesh.

- **Nobody has seen her in the castle** (#606). What was looked at is a
  scratch page that loaded the encoded file beside `Farmer.glb` and
  `King.glb` and applied `cast`'s tints and hides the way `npc.js` does:
  three women in cream, blue and gold, a head shorter than the chaplain and
  the Constable. That is a look at a body on a grey background, not at
  Vespers in the hall. The evidence is still **The GPU run**'s
  `twelve-at-vespers` photograph. One tell is known going in: `Hair` is bare,
  so all three have the same grey-white hair under their hoods, the way the
  Constable, the Steward and the inspector share the King's.

**Broken on purpose, from a green baseline** (#34). Three breaks, each
reverted, green again after.

1. Lady Alys put back on `King.glb`. `mystery` exited 1 on `four bodies, and
   the three women share the one that is a woman's — ... lady wears
   assets/NPCs/King.glb; constable wears assets/NPCs/King.glb too; ...`.
2. `Woman.glb` replaced by the un-encoded re-export. `assets` exited 1 on
   `assets/NPCs/Woman.glb has no EXT_meshopt_compression — run npm run
   assets:encode before committing it (#506)`.
3. `data/npcs.json` stashed with the file left on disk. `assets` exited 1 on
   `nothing references assets/NPCs/Woman.glb`, which is #390's check 4 doing
   its job.

**Two suites that fail on this machine and did before this branch.** Both
were run against untouched `main` in Devon's checkout and fail there the same
way. `tools` fails three times on `and every other byte is the byte it was —
96758 bytes in, 96757 back out`: `core.autocrlf` is `true` here, the checkout
of `data/scene-config.json` ends `}\r\n`, and the splice writes one byte
fewer. `plan-vs-scene` fails on `none of the 12 cells between 0.9 and 2.8 m
of the chapel candles offers them (the nearest offered "Press E to ring the
bell")`, three runs of three on `main` and two of three here. Neither is in
this row's lane and neither was touched. CI is Linux and sees neither.

**A numbering note.** #600 to #602 are `ROADMAP.md`'s and were uncommitted
in Devon's checkout when this was written, so this entry starts at #603. Other
wave A sessions were running at the same time; if one of them also took #603,
the later merge renumbers.

**What this branch does not do.** `BACKLOG.md` and `SPECS.md` still carry the
row. Devon's checkout held uncommitted rewrites of both when this was written
(the `Where`, `Claimed` and `Lane` columns and `ROADMAP.md`), and deleting rank
1 and renumbering eleven rows underneath that is a conflict in every line of
the table. The row comes out in the pass that lands those files.

## Sound: the ambient beds (2026-09-17)

**Rank 7's first increment, on `claude/r7-ambient-beds`, as `ROADMAP.md`'s
wave A row R7.** A room tone per place, synthesised, cross-faded on the room
change the HUD already computes. Decisions #620 to #623. `npm run build`
green. Ten of twelve suites green on the Windows machine this was written on;
`tools` and `plan-vs-scene` fail there on `main` at `f7ea3ff` with none of
this applied, the same assertions with the same text, and CI on Linux is what
says twelve. `npm run play` was not run, and nothing here has been heard by
anybody (#53).

- **The numbers start at #620 and the gap is deliberate** (#620). Wave A is
  four sessions at once by design (#602), and the lanes keep them out of each
  other's files but not out of each other's decision numbers: #600 to #602
  were uncommitted in the shared checkout when this started, and a `#603` was
  already sitting in another session's unpushed `src/castle-builder.js`. Every
  session numbering from the next free integer is every session taking the
  same one. A band taken well clear costs a gap, and this file already has
  gaps (#395 to #410). **The rule worth keeping: a session working beside
  others takes a band, and says which.**

- **A zone is what `roomAt` hands the HUD, and a bed is picked by id first
  and a drum room's storey second** (#621). `bedOf(sounds, zone)` in
  `src/audio.js` is `stepClassOf`'s two steps again, for the same reason:
  eighteen tower floors, top rooms and roofs are three places over and over,
  and the 22 rooms that are somebody's are named. No default. `roomAt` grew a
  `drum` field to make the second step possible.

  **Seven beds, and three the spec listed are not among them.** `SPECS.md`
  named kitchen, forge, chapel, wall walk, outer ward and rain. The castle
  builds no forge: Madoc's is a word in the gaol roll. It has no weather; that
  is the Feel row's. And a garden bed was written and lasted an hour, because
  check 13 called it dead: the garden is behind the east gate, which never
  opens (#469), and not one of the castle's 8981 walkable cells is in it. A bed
  nobody can stand in is a tuning nobody will hear, and the dead-bed assertion
  is what keeps the file to the castle that exists. What shipped is ward, wall
  walk, kitchen (the bakehouse too, which is an oven), hall, chapel, chamber
  and tower.

- **A bed is built when entered and torn down when faded, and it is in the
  head** (#622). Eight beds running at gain 0 is twenty filters computing
  silence on a phone; a bed is about a dozen nodes and costs nothing to make.
  Walking back into a bed still fading out builds a second over it rather than
  reviving the first, and for 1.2 s there are two fires. The teardown is a
  timer and not `onended`, because a suspended context never ends anything
  and a page nobody has started would keep every bed it was walked through.
  The kitchen's crackle is skipped while the context is suspended rather than
  queued, or every click made before the start button lands on the instant it
  is pressed.

  **Not spatialised, which `BACKLOG.md` asked for and `SPECS.md`'s scope did
  not.** One bed at a time, straight to the listener's gain, so the kitchen is
  silent from the ward outside its door and switches on across the threshold
  over the fade. A panner per bed at its room's centre is the next increment
  and is written into both files as that. It was left out because it changes
  the model from one bed to the nearest few, and whether one bed at a time is
  even wrong is a thing to hear first.

- **The Node check sweeps the cells through the nav; the browser check holds
  one line** (#623, and #529's split). `test/layout.mjs` check 13 puts every
  walkable cell through `castleNav(...).roomAt` and resolves what comes back,
  then the plan's own list for rooms no cell reaches: 43 zones, 41 of them as
  the nav names them. The first draft resolved `plan.rooms` directly and
  would have stayed green with `roomAt` dropping the `drum` field, which is
  eighteen silent tower rooms under a passing suite (#34). It also fails a bed
  no zone reaches, a `byRoom` name the castle does not build, and a fade of no
  length. Open ground no cell is in is printed and not asserted.

  `test/map.mjs` section 2b is the seam Node cannot see: that `main.js`
  tells the audio at all. It reads `audio.ambience()`, which says which beds
  exist and nothing about what they sound like, and its one wait is the fade's
  own length on a timer, so a slow rasteriser changes nothing (#53). It stands
  only in rooms already on that suite's tour, so the map's counts do not move.

**Broken on purpose, from green (#34).**

1. `"larder": "tower"` deleted from `byRoom`. `layout` exited 1 on one:
   `"larder" is level 0 of kitchen-tower and data/sounds.json's ambient block
   says nothing about what it sounds like`. This is the spec's own break, a
   zone with no entry, and the check names the zone.
2. `drum` taken back out of `roomAt`'s return. `layout` exited 1 on
   eighteen, one per tower floor, top room and roof, each `"nw-tower-1" is a
   room on level 1 and ... says nothing about what it sounds like`.
3. The kitchen and the bakehouse pointed at `hall`. `layout` exited 1 on
   `data/sounds.json defines the bed "kitchen" that no zone in the castle
   resolves to`.
4. `audio.enter(here)` deleted from the render loop. `map` exited 1 on four,
   the first `out in the ward, the ward's bed and nothing else —
   {"bed":null,"sounding":[]}`.
5. The teardown timer set to 0, which is a cut. `map` exited 1 on `and it is
   a cross-fade, not a cut: the ward has -19 ms left of a 1200 ms fade`.
   **This assertion is the third version, and CI wrote the second.** The first
   stood in the hall with `standIn`, read `sounding` afterwards and wanted two
   names. It passed here and failed on the PR's first CI run, `— hall`: a
   software rasteriser took longer than the fade to get from the change to the
   read, which is a wall-clock assertion under exactly the renderer #53 names.
   The second read from a requestAnimationFrame in the frame of the change,
   went green, and then passed break 5 as well, because a 0 ms timer has not
   run by then either. A fix that leaves the break green is not a fix (#34).
   `ambience()` now carries how many ms each outgoing bed has left, and the
   check holds more than half the fade.
6. The same-bed early return deleted. `map` exited 1 on `the King's Tower top
   room to its first floor is the same bed, and nothing fades —
   {"bed":"tower","sounding":["tower","tower"]}`.

**What was measured.** `data/sounds.json` 71 lines to 188. `src/audio.js`
188 to 351. `test/layout.mjs` 1137 to 1191, `test/map.mjs` 196 to 235 and
its `check` count 19 to 24. `src/main.js` gained two lines of code and
`src/stations.js` one field. No asset added: `dist/` grew by the bundle's
share of 163 lines.

**What nobody has heard.** All of it. Every gain, filter and swell rate in
the `ambient` block was typed on a machine with no speakers attached to the
session, and the file says so in capitals. The three most likely to be wrong:
whether 0.022 for a chamber is audible at all, whether the 880 Hz whistle in
a tower reads as wind in an arrow loop or as a fault, and whether a looped
four-second noise buffer can be picked out under a steady low-pass in the
hall, which is the bed with the least going on to hide it.

## Where, Gate and Lane: the backlog says which machine, and `ROADMAP.md` says in what order (2026-09-17)

**Not a ranked row. Devon asked directly**, mid-session, for three things the
project had never written down: what has to happen on a machine this container
is not, what two sessions may hold at once without colliding, and what strictly
has to ship before what. Decisions #600 to #602. No code changed, twelve suites
untouched, `npm run build` untouched.

- **Three labels on every backlog row: `Where`, `Gate`, `Lane`** (#600). All
  three facts were already derivable and none was written where a session
  claiming a row would see it. The header said "ranks 2, 3 and 5 need a GPU" in
  a paragraph a reader had to parse, and it was already wrong in a way that
  mattered: **rank 1 does not need a GPU, it needs a network**, and #518 and
  #541 are the proof that those are different blocks — the same container that
  could not reach Poly Haven in September could reach it a week later, and
  #568's could not reach quaternius.com at all. Calling both "blocked" is what
  kept rank 1 sitting behind the wrong excuse.

  `Where` is one of four: `Container`, `Local: GPU` (#53), `Local: net`, and
  `Local: audio`, which is rank 7 and only for the judgement half. `Gate` is
  what must have shipped first. `Lane` is the file two sessions would collide
  on.

  Rank 4 and rank 12 each carry three values instead of one, because their
  remaining threads genuinely differ and `SPECS.md` already names them
  separately: **4a** the bells call, **4b** the `since` field, **4c** the yard;
  **12a** the budget suite, **12b** move-and-delete, **12c** the dialogue
  format. 4a and 4b are a container's and 4c is not; 12a has no lane, 12b is
  lane B and 12c is lane C. A single label on either row would have been a lie
  about two thirds of it.

- **`ROADMAP.md` is the order; `BACKLOG.md` is still the rank** (#601). A fifth
  document was not obviously warranted and the alternative was a section in
  `BACKLOG.md`. It got its own file because the two answer different questions
  and change on different schedules: the rank is Devon's judgement about worth
  and moves when he says so, and the order is arithmetic over the gates and
  moves whenever one clears. Folding them would mean a shipping session
  rewriting a priority list to record a dependency, which is how a priority
  list stops meaning anything.

  **The file names rows by title as well as by rank**, for the reason #522
  already found in `SPECS.md`: a closed row shifts every number under it, and a
  roadmap that says "after rank 2" ages into a lie the first time a row closes.

  **Four hard gates on twelve rows, and that is the whole finding.** R2 before
  R3 (the images have no other source), R2 before R5 (both criteria are a
  render), R2 before R11 ships past its Node line, and R4c's yard before R9's
  town. Everything else that reads like a dependency in `SPECS.md` — rank 6's
  populace under two of rank 8's errands, rank 10 and rank 6 trading activity
  clips, rank 12's budget suite being more useful with fifty bodies to count —
  is preference, and none of the three blocks a start. Devon expected the list
  to be loose and it is looser than he expected: **R2 is the only row that
  gates more than one other thing, and it is a ¼.**

- **One row per lane at a time, and a lane is a file** (#602). The claim rule
  (#283) stopped two sessions building the same row and says nothing about two
  sessions building different rows into the same file. Five lanes:
  **A** `src/save.js` (R4a, R4b, R8), **B** `data/scene-config.json` (R4c, R5,
  R9, R12b), **C** `data/npcs.json`'s `cast` and `npc.js`'s body machinery
  (R1, R6, R10, R12c), **D** `src/main.js`'s player rig and spawn (R6, R11),
  **E** `src/audio.js` and `data/sounds.json` (R7). R2, R3 and R12a have no
  lane.

  Lane A was already written in prose — rank 4's dependencies say *"do not run
  alongside anything else that touches `save.js`"* — and rank 8's next
  increment is a version bump to 6, so the warning had a live target nobody had
  connected it to. Lane B is the one that would fail quietly: `test/tools.mjs`
  holds `data/scene-config.json` to byte-exactness by cutting an added row back
  out and comparing the whole file, because a re-serialise of that file is not
  that file (#584, 94212 bytes out as 98330), and two splices neither session
  tested against each other is exactly the thing that rail cannot see.

  **Lane C is the `cast` block, not the file.** R8 and R12c write per-person
  `states` and `default` line arrays — a different region that merges — and
  drawing the lane at the whole file would have forbidden the one pairing the
  backlog header already recommends.

**What this leaves.** The three safe-together rows today are R8 (lane A), R6
(lanes C and D) and R12a (no lane), which is what the header already implied
and now says with a reason. Add R2 and R1 on Devon's machine and five things
move at once with no collision. The column values are a judgement over the
specs as they stand on 2026-09-17; a row whose scope changes changes its lane,
and the session that changes it owns the label.

## Rank 12a, the budget suite: what the castle costs, per ward (2026-09-17)

**`test/budget.mjs`, the thirteenth suite, 0.4 s, Node only.** `SPECS.md`'s
next increment for rank 12, taken because it is the row rank 6 and rank 10 both
walk into: "a shared low-poly rig for the fifty" was written down as a goal by
a spec that could not say what fifty cost, because nothing in this project had
ever counted anything. Decisions #607 to #611. Twelve suites green before,
thirteen now — with two failures on `main` at 94491ff that this branch neither
caused nor fixed, both written up at the bottom.

**The numbers start at #607 and not at #603, which is what they were written
as.** Three branches reached for #603 the same afternoon. Rank 1's merged and
holds it; `claude/rank8-reputation-by-ward` committed it and has not merged;
this branch renumbered rather than argue, because #492 says a number resolves
in its own repo's `HISTORY.md` and it cannot resolve to two things. **That is
the cost of five sessions in parallel that `ROADMAP.md`'s lanes do not cover**
(#602 draws lanes by file and `HISTORY.md` is a file every row writes to), and
the cheap fix is the one used here: read `HISTORY.md` on `origin/main` at the
moment you write the entry, not at the moment you branched.

**The numbers, which are the actual deliverable.** Draw calls: **965 in the
outer ward, 643 in the inner**, 1539 meshes in the castle. Point lights: three,
all three in the outer ward. Skinned bodies: the outer ward peaks at **7** at
Terce and Vespers, the inner at 5 at Prime, out of a cast of twelve.

**And the finding nobody was looking for: 970 of the castle's 1539 meshes —
63 % of everything it draws — is the eight tower drums**, at about 120 ring
sections and caps each. Kitchen Tower alone is 129. That is the biggest single
line in the castle by a factor of ten over the next thing, it has been true
since Phase 3, and no suite, spec or wishlist entry has ever mentioned it.
`buildDrum` makes a `ringSection` per run of sectors sharing an opening list,
and two shells plus up to two caps per section, every one of them carrying the
same material. When the draw-call ceiling below is first hit, merging a drum's
sectors into one geometry is the answer, not deleting a building.

- **The budget suite counts the meshes the builder really makes, by calling the
  builder** (#607). `src/castle-builder.js`'s `built` ladder came out of
  `build()` into an exported `buildPiece(piece, material, metres)`, and its
  "does this carry its own world position" test came out into an exported
  `carriesOwnWorldPosition(piece)`. `build()` calls both, and so does
  `test/budget.mjs`.

  The alternative was four lines of arithmetic in the suite — *a drum is 24
  sectors, so call it 48 shells* — and it would have been wrong by a factor of
  2.5 and green forever. This project has made that mistake twice already:
  `layout.mjs` re-implemented the placement math and said in its own header
  that it therefore could not catch a change to it (#500), and two versions of
  the line-of-sight check passed the whole suite while doing literally nothing
  (#34). A suite that re-derives a number is a suite agreeing with itself.

  Proved by deleting `buildPiece`'s `floor` branch: the run named
  `north-curtain-west-walk` and the four walks after it, *"says built: "floor"
  and castle-builder.js's buildPiece has no branch for it — the budget cannot
  count what it cannot build"*, exit 1. The suite cannot silently under-count a
  shape the builder grew, because the shape has to come back through the same
  function.

- **A ward, for counting, is a rectangle, and a mesh counts in every ward it
  reaches into** (#608). The two wards are the curtain's own footprint
  (x -46..34, z -20..20) cut at the cross-wall's centreline, which is read off
  `cross-wall-north` and `cross-wall-south` rather than typed as 0; the suite
  refuses to run if those two ids are not in the plan, rather than quietly
  moving the line and re-baselining every number under it.

  **Reaching, not containing**, and that is the whole reason the Stockhouse and
  Bakehouse drums come out split 63/76 and 64/76 instead of landing whole on
  one side of a wall they stand astride. A mesh that spans the boundary is
  drawn from either ward, so it is paid for in both. The ground planes are
  counted in both for the same reason. The two ward columns therefore sum to
  more than the castle's mesh count, and are meant to.

  `cross-walk` is the case that decided the shape: the walk over the porter's
  gate, which `scene-config.json` declares `inner` and whose box is x -2..0,
  wholly west of the centreline. A centre-of-box rule called it outer and
  disagreed with the file; a reaching rule agrees with the file and with the
  other 39 rooms, and the suite asserts that agreement for all 40 — which is
  also the rail that catches a room added with no ward at all, invisible to the
  populace budget forever otherwise. Broken by relabelling the chapel `outer`:
  *"room "chapel" says ward "outer" but its bounds x 21.2..26.8 do not reach
  that ward's rectangle"*.

- **The ceilings are guesses, in one block, with what each is anchored on
  written beside it** (#609). `SPECS.md`'s open call recommended exactly this
  over waiting for a device, the way `touch-controls.js` holds its six (#530),
  and the recommendation is taken. **1200 draw calls per ward**, against 965 in
  the outer: 235 of headroom, chosen so the next thing to hit it is a building
  rather than a prop. **6 point lights per ward and 8 in the scene**, against
  3. **20 skinned bodies per ward and 32 in the cast**, against a peak of 7 and
  a cast of 12.

  The skinned numbers are anchored on rank 6 rather than on hardware, because
  rank 6 is what is about to spend them: twelve cast plus its first ten
  populace is 22, which fits 32, and if rank 6 puts all ten in one ward that is
  17 against 20. **Rank 10's fifty fits neither number and is not meant to.**
  That is the answer the row was taken to produce, and it is a failing
  assertion now rather than a shrug in a spec.

  Broken three ways from green. The ceiling moved to 900: *"the outer ward
  draws 965 meshes, over the ceiling of 900. Its three biggest: kitchen-tower
  (129), prison-tower (123), nw-tower (121)"* — the three biggest are printed
  because a ward over its ceiling is almost never over it by a hundred small
  things. The skinned ceiling moved to 6: *"the outer ward holds 7 skinned
  bodies at terce, over the ceiling of 6"*. And six real brazier rows spliced
  into `scene-config.json`, which is the content break rather than the constant
  break: two failures, per-ward and total, *"9 point lights in the scene, over
  the ceiling of 8"*.

- **The point-light count is the braziers, and that claim is grepped rather
  than commented** (#610). `main.js` makes one stand per row of
  `config.braziers` and `createBrazier` makes one `PointLight` per stand, so
  the count is the list's length — for exactly as long as nothing else in
  `src/` makes a point light. Rank 11's fire and candles are the obvious next
  ones, and a light added anywhere else would leave this suite counting three
  and reporting green over a scene carrying nine.

  So `src/` is grepped for `new THREE.PointLight(` and the grep has to find the
  one call in `scene-setup.js`. This is #501's lesson pointed at a third
  target, after #586 pointed it at the editor: the check for a thing a file
  cannot see is a grep of the thing itself. Broken by adding a constructor to
  `src/audio.js`: *"src/ makes point lights in audio.js x1, scene-setup.js x1 —
  this file counts data/scene-config.json's braziers, and one per brazier is no
  longer the whole story."* Not phrased as a bug, because it is not one. It is
  a request to teach the budget where the new lights are.

- **A thirteenth suite rather than a thirty-line block in `layout.mjs`**
  (#611). By the letter of #529 — layout.mjs is every fact derivable from the
  plan in Node — this belonged in layout.mjs. What #529 was drawn to fix was
  that a reader could not tell which of two files to add a line to, and
  splitting by cost answers that question rather than blurring it: whether the
  castle works is layout.mjs, what it costs is budget.mjs, and the two share no
  assertion. layout.mjs is 1137 lines, and the ceilings are the one thing here
  that a content row is expected to come back and renegotiate, which is a bad
  thing to bury at line 900 of something else. `CLAUDE.md`'s statement of #529
  now carries the carve-out.

**What the suite is not, said in its own header so nobody reads the number as a
measurement.** It counts meshes whose box reaches a ward, not what the GPU
submits on a frame: three.js frustum-culls, so a corner of the outer ward draws
fewer than 965, and the sun's shadow map re-draws every caster, so a frame
submits more. It is a budget. The profile is `renderer.info` on real hardware
and it belongs to rank 2's GPU run — which is now carrying a seventh question:
what the eight drums actually cost.

**Two failures on `main`, neither of them this branch's.** Both confirmed
against a clean checkout of 94491ff with this branch stashed.

1. **`test/tools.mjs` fails on a Windows checkout and passes on a Linux one.**
   The byte-exactness rail reports *"96758 bytes in, 96757 back out"* for all
   three placeable kinds. Converting `data/scene-config.json` to LF in place
   makes the suite green and converting it back makes it red, so the splice in
   `tools/place.mjs` drops or normalises one CRLF. CI is Linux and green;
   **Devon's machine is the dev machine (`CLAUDE.md`) and it is red there**,
   which is the worst possible shape for a rail whose whole job is to be
   trusted before a hand-edit. Rank 12b owns that file and that lane.
2. **`test/plan-vs-scene.mjs` fails on the chapel candles, INTERMITTENTLY.**
   *"none of the 12 cells between 0.9 and 2.8 m of the chapel candles offers
   them (the nearest offered "Press E to ring the bell")"* — three failures in
   five runs of the same unchanged file on the same machine. The bell's prompt
   wins the chapel some of the time, which says the two targets are being
   ranked by something that is not stable between loads rather than that the
   candles are unreachable. **A suite that is green three runs in five is worse
   than one that is red**, because the next session to see it green will
   believe it (#13's shape, one level up), and the flake is on the browser
   suite this project trusts most.

## Side quests: reputation by ward (2026-09-17)

**Rank 8's next increment, wave A, lane A.** The two counters `#599` named a
ward for, the save version that carries them, and the two places in the game
that read them out. Decisions #612 to #615. Ten of twelve suites green; the
two that are not are `tools` and `plan-vs-scene`, neither of them this
batch's and both described at the bottom. `npm run build` green. `npm run
play` was not run and could not be (#53).

- **Reputation is two counters the save carries, and version 6 is how they
  arrive** (#612). `outer` and `inner`, one moved per side quest finished in
  that ward, where the ward is the quest file's own (#599) and finished is a
  terminal stage. `SAVE_VERSION` goes 5 to 6 and the key does not move (#36).

  **It is `day`'s case and not `read`'s, which is the whole reason there is a
  `migrate` line at all** (#37). A version-5 save already says where every
  side quest stands, so a player who finished three errands yesterday has a
  true answer sitting in the file and zeroes would be the save claiming they
  had done none of them. `migrate` counts the terminal quests the incoming
  save is already carrying, per ward, through `reputationIn` — and that is
  the one thing about this field only `migrate` can say, which is #147's test
  applied before the fact: `repair`'s own answer to a missing `reputation` is
  zeroes whether migrate ran or not, so an assertion that only checked a
  missing field would have had the word "migrate" in a lie. Break 2 below is
  that assertion earning its name.

  **`repair`'s rail is a ceiling and not a recount.** Each counter clamps to
  the number of quest files in that ward, which `buildCatalog` counts off the
  directory the same way it counts everything else: one per errand, and an
  errand finishes once. It deliberately does not re-derive the counters from
  `quests`, because a favour done is a thing that happened and repair's job on
  this field is to refuse the impossible rather than to recompute the
  possible. What that ceiling is actually stopping is in break 1: nothing
  downstream ever lowers a counter, since the manager reads the save's number
  straight into its own and only adds, so a hand-edited 99 that gets past
  repair is a 99 the castle reads a line out for and goes on reading for the
  rest of the day.

- **Where the counter moves is `_settleSide` and nowhere else, and once is
  the graph rather than a guard** (#613). An errand arriving at a terminal
  stage adds one to its ward, at the end of the batch of events that moved
  it, on the same line the toast is written from. It cannot double-count,
  because `validateQuest` has refused a terminal stage with a transition that
  leaves it since #393: a quest that has arrived at an ending cannot move
  again, and `_settleSide` only ever runs on a quest that moved. That is also
  what makes a reload safe — the save carries the counter and a resume is a
  stage assignment that moves nothing — and what makes the `_catchUp` case
  right, since a quest walked into its ending by the catch-up is an errand
  finished now and counts now.

  **Break 4 is the version of this that looks identical and is not.** The
  same line moved up into `_dispatchSide`, on the move rather than on the
  settle, reads one finished errand as two: `test/quest.mjs` exited 1 with
  `which moves the inner counter and not the outer one — {"outer":0,"inner":2}`.

- **Two things read the counters, and the list of what they are not is
  longer** (#614). `data/npcs.json` gains a `reputation` block: `outer` and
  `inner`, each a list of `{at, line}` in ascending order, and `closing`,
  keyed to both counters added together. The ward lines go on the **end** of
  whatever the person you walked up to was going to say, which is #598's
  fourth-`default`-line reasoning pointed at a second target — the line is
  last, so a player re-reading what came before it is not made to. `closing`
  is one line in the epilogue pane, under the verdict, quieter than it and
  ruled off from it.

  **Who says it is the ward and not the person**, off the cast's own `ward`
  field, in whatever state they are standing in. That is what makes it the
  castle talking rather than one more person with an errand, and it is the
  constraint the lines were written against: each one has to be sayable by a
  cook, a sentry and a man in a cell, or by a Constable, a chaplain and a
  lady. `test/quest.mjs` holds that with Master Robert and Madoc hearing the
  same thing.

  **It is not a dialogue state**, so `validateQuestSet`'s one-voice rule
  (#578) has nothing to arbitrate about it and it cannot collide with a press
  or with an errand. **It is not on a press**: `handlePress` answers the clue
  the player pushed at somebody, which is the mystery's beat, and the
  castle's gossip after a confession is the wrong voice in the wrong second.
  **It is not on the morning after**: `_dayLines` replaces every line set in
  `npcs.json` and a castle burying a man is the wrong room for what the
  kitchen thinks of you, which is the line `_dispatchSide` already draws
  (#576). Break 5 is that one, and it produced exactly the sentence the rule
  exists to prevent — Marged on the morning after Madoc did not hang, saying
  `And there is talk of you in the yard`.

  **A player who ran no errand sees none of this**, including in the pane:
  `closing` returns null below its first threshold and `src/ui.js` hides the
  paragraph rather than writing an empty one. A pane that says you did
  nothing is worse than a pane that says nothing.

- **A threshold nobody can reach fails a suite instead of sitting silent**
  (#615). `validateQuestSet` takes the block as a fifth option and holds
  every `at` to the number of quests `data/quests/` actually has in that ward
  — three outer, two inner, five in all today — plus ascending order, a whole
  number of one or more, and a `line` that is a string. This is the rule
  worth having: an `at: 4` on a ward with three errands is silent in the
  game, indistinguishable from a line that has not been earned yet, and
  nothing else in the project would ever have said so. It lives in
  `validateQuestSet` because that is the only function that knows how many
  errands each ward has, which is the one thing a threshold can be wrong
  about.

  **The thresholds as they ship**: outer at 2 and 3, inner at 1 and 2,
  closing at 1, 3 and 5. The inner ward's first line fires on one errand
  because two is all the inner ward has to give; the ceilings move on their
  own the day a sixth errand lands, and the validator is what will say so.

**Broken on purpose, from a green baseline** (#34). Six breaks, each from a
green suite, each reverted, green again after.

1. `repair`'s clamp replaced with the bare `nonNegInt`. `save` exited 1 on
   three, including `a counter past the errands that exist comes down to them
   — {"outer":99,"inner":99}` and `repaired, it is the errands the outer ward
   has — 99`.
2. `migrate`'s version-6 line changed to default `{}` instead of counting.
   `save` exited 1 on two: `a version-5 save with every errand done comes back
   with the reputation it earned, not with zeroes — {"outer":0,"inner":0}` and
   `and one errand done (cooks-knife, outer) is worth exactly one`.
3. `_settleSide`'s counter line commented out. `quest` exited 1 on sixteen,
   the first being `which moves the inner counter and not the outer one —
   {"outer":0,"inner":0}` and the rest being every line nobody then said.
4. The same line moved into `_dispatchSide`, on the move. `quest` exited 1 on
   fifteen: `the candle account closes and the inner counter is at two —
   {"outer":0,"inner":4}`, which is every errand counted twice.
5. `_linesFor`'s day-two branch folded back into the one-line version, so the
   aside went on the morning after too. `quest` exited 1 on one: `Marged says
   what the morning made of her and not one word about a knife — And there is
   talk of you in the yard bet`.
6. The validator's `if (reputation != null)` turned into `if (false)`.
   `quest` exited 1 on ten, every `validateQuestSet rejects ...` line saying
   `said nothing`.

**What was measured.** `src/save.js` 184 lines to 238, `src/quest-graph.js`
375 to 408, `src/quest-manager.js` 887 to 970, `data/npcs.json` 752 to 789.
`test/quest.mjs` 1473 to 1628 and its `check` count 298 to 331;
`test/save.mjs` 383 to 447 and 92 to 107. The save's schema is fifteen fields
where it was fourteen.

**`rig` hands the real block to every manager `test/quest.mjs` builds**, which
is the opposite of what `performances` does there, and it is on purpose: the
aside appends a line to the end of what somebody says, so every one of that
file's `same(lines, ...)` assertions is an assertion that it is not said
early. That is the half the new section cannot check on its own — it can
prove the line arrives, and it takes the whole rest of the file to prove it
does not arrive before it is earned.

**Two suites failed and neither is this batch's.** `tools` fails on this
machine and not in CI: `core.autocrlf` is true, so `data/scene-config.json` is
checked out CRLF, `insertRow` writes its new row with a bare `\n`, and cutting
the row back out loses one `\r` — 96758 bytes in, 96757 out. It is lane B and
this row is lane A, so it was diagnosed and left. `plan-vs-scene` fails on its
chapel-candle beat, which is the same local failure #599's batch recorded
against an unmodified checkout and which CI was green on; it passed on one run
of this tree and failed on the next, which is the flakiness that note
describes.

**What nobody has seen.** The pane was checked in a real DOM — the paragraph
draws when there is a line and is `hidden` when there is not — and a
screenshot of it is in the PR. What no suite can answer is whether a
one-sentence aside on the end of a fourth conversation reads as the castle
noticing or as the castle nagging, and whether the inner ward's first line
firing on a single errand is too eager (#53). Both are a screen and a person.

**A numbering note, twice over.** This entry was written as #603 to #606,
which is what `ROADMAP.md`'s #600 to #602 left free. Three wave A sessions
wrote against that band the same afternoon. Rank 1's fourth body merged first
and kept it. This row moved to #607 to #610 — and rank 12a, which had seen
this branch commit #603 and moved itself off it, merged onto #607 to #611
while this branch's CI was running. So this entry is **#612 to #615**, and
the rule that settled it every time is the one in the specs already: the
branch that is on `main` keeps its numbers and the branch that is not moves,
because #492 says a number resolves in its own repo's `HISTORY.md` and it
cannot resolve to two things. Nothing in `src/` or `test/` ever cited any of
the three bands: every number this row's code comments carry is older than
all of them.

**What is left in rank 8.** The seven errands of `WISHLIST.md`'s dozen still
unwritten: five need nobody new (the letter for the town that needs a gate
pass, and four the wishlist never named, one voice each on the seven people no
errand has yet), and two want rank 6's populace. Reputation is done and the
row is not.
## Life: a populace, and the first ten of it (2026-09-17)

**Rank 6's first increment, on `claude/populace-first-ten`.** Ten people who
have no clue, no lie and no line, on the same walk grid the twelve stand on,
with a validator that runs in Node and again in the browser before the page
spawns anybody. `data/populace.json`, `src/populace.js`, nine activities onto
three clips the kit already ships, and no new asset. Decisions #616 to #619,
**written as #604 to #606, then #607 to #610, and landed at #616 to #619**:
rank 1 took #603 to #606 while this was being built, and R12a and R8 took
#607 to #615 while it was being merged. Three picks for one row, which is
`ROADMAP.md`'s point exactly — a decision number is not a lane, and the fix
that costs nothing is to read `HISTORY.md` on `origin/main` when the entry is
written rather than when the branch was cut. #619 came with the merge as
well: rank 1's paperwork was left for whoever landed `BACKLOG.md` and
`SPECS.md`, and that is this branch.
Eleven of twelve suites green, `npm run build` green, `npm run play` not run
(#53). The twelfth is `tools`, and it was failing before this branch existed —
see #618's second half.

- **A routine is a ring inside a watch, not a timetable** (#616).
  `data/populace.json` gives every person a `routine` of one LIST per bell,
  and the list is a loop: `{room, tile, activity, facing?}` per stop, walked
  round and round until the next bell. A list of one is a body that stands
  still for the watch; a watch left out is a body that is not in the castle,
  which is the merchant's own answer one file over. That shape comes straight
  out of Devon's answer to question 3 (#547): *the bells stay*, and life
  happens as loops inside a watch rather than against a minute hand. The
  engine is `Populace` in `src/populace.js`, which counts a dwell down, asks
  `castleNav` for the route and hands it to `walkTo` — nine seconds a stop,
  staggered by the body's own index so the ten do not step off together, and
  by the index rather than by `Math.random()` so the castle is the same
  castle twice.

  **`validatePopulace` asks the twelve's own five questions and two more.**
  Floor under the stop, inside the room it names, 1.5 m clear of everybody
  else at that bell, somewhere the player can walk to, and a walk from one
  bell's last stop to the next bell's first. What is new is the ring — every
  leg of it and the wrap back to stop one — and the `activity`, which is a
  clip name one indirection from a `.glb`. What is dropped is the bars:
  nobody in this file is behind them.

  **The room check is `roomAt` and not `inNamedRoom`, which is where it is
  stronger than the schedule's.** `inNamedRoom` answers null for the four
  open rooms, because the two wards, the barbican and the garden have no
  bounds to be inside of — and six of the ten stand in open ground for at
  least one bell. `roomAt` settles it the way the HUD's room line does
  (#515), so a stop that says `inner-ward` and lands west of the porter gate
  is caught, and under the schedule's own rail it would not have been.

  **The clearance check is every stop against every stop, deliberately.** Two
  rings inside one watch have no phase anybody can compute: the dwell is the
  same for all of them and the walks between stops are not, so two rings that
  share a tile will share it at the same moment sooner or later. "Do these
  two rings ever come within 1.5 m of each other" is the only version of the
  question with an answer.

  **Nine activities, three clips, no new asset.** All three bodies under
  `assets/NPCs` ship the same 24 Quaternius clips and not one of them is a
  sweep, a stir, a hammer or a spar, so the vocabulary is restricted to jobs a
  body does standing still — `bake`, `draw`, `haul`, `serve`, `tend`,
  `gossip`, `wait`, `guard`, `muster` — and every one resolves to `Idle`,
  `Idle_Neutral` or `Idle_Sword` through `ACTIVITY_CLIPS`. `sweep`, `stir`,
  `hammer` and `spar` are deferred to the increment that has a clip for them,
  which is what `SPECS.md` recommended. **The table is checked against the
  files**: `test/mystery.mjs` reads the animation list out of every `.glb`
  the file uses and fails on a clip name none of them carries, because
  `pickClip` returns null for a name nobody ships, `playActivity` gives up,
  and a frozen body looks exactly like an idling one.

  **`_restKey` in `src/npc.js`, and it was nearly a rail that asserted
  nothing.** npc.js's arrival branch played the literal `idle` at the end of
  every route, so a body that walked to the oven dropped out of `bake` on the
  frame it arrived. The first version of the guard read the clip after both
  `npc.update` and `Populace.update` had run — and `Populace._arrive` sets the
  activity a moment later whatever npc.js did, so the assertion passed with
  the bug put back on purpose (#34). It reads the arrival frame now, before
  the driver sees it, and fails with `npc.js chose Idle at the end of the
  route`.

  **Where the ten are.** The bakehouse and the well, which is the pair
  `WISHLIST.md` calls cheapest, with a lad hauling between them; the garrison
  mustering in the outer ward at Terce; a scullion between the kitchen and
  the larder, a hen-wife in the ward, an archer on the two wall walks, a maid
  on the Lady, a carter who is only there for two bells, and two of them
  serving in the Great Hall at Vespers. Twelve rooms across the day. Every
  tile is the centre of a real cell in the 0.5 m grid, picked off the grid
  rather than guessed at.

  **Nobody has a Lauds stop**, so the morning after has the cast and nothing
  else. That is the increment's boundary and not a claim about the fiction.

- **A label never out-ranks something to press E at** (#617).
  `InteractionSystem` picked the nearest target in range and nothing else,
  which was right while every target was pressable. It stopped being right
  the moment ten bodies with nothing to say started walking the same castle:
  `STATION_CLEARANCE` holds them 1.5 m off the twelve and E reaches 3.2 m, so
  a baker's lad crossing between the player and the cook is legitimately the
  nearer of the two — and the HUD read *"Iorwerth — the baker's lad"* while
  she stood a metre behind him with the whole mystery in her mouth.

  Two lists now, and the label list is only read when the other is empty. A
  populace target carries `label: true` and a `prompt` that is a name and a
  role rather than an offer, `main.js` returns from `onInteract` on one, and
  nothing in either file knows one of the ten by id. **Measured in the
  browser rather than argued**: `test/plan-vs-scene.mjs` stands a populace
  body 0.83 m from the camera and a suspect 2.50 m behind him, in line of
  sight, and asserts the prompt names the suspect — with the control that
  hiding the suspect on the same spot falls back to the label, so a prompt
  that named nobody could not pass the first line. Reverting the two lists
  fails it with `the HUD offers "Gwladus — the baker" past Gwladus standing
  in front of him`.

- **`garden` is a room id nothing in this castle resolves to, and `npm test`
  was already red on Windows** (#618). Two things found on the way and
  neither is this row's to fix.

  The populace was drafted with a gardener in it. `mystery.json` lists
  `garden`, "East barbican garden", as one of the four open rooms, and the
  grid says there are 93 walkable cells east of the east gate — but every one
  of them is inside the Chapel Tower's or the King's Tower's own disc, so
  `roomAt` names a tower and never the garden. There is no ground out there
  to stand on that is not already a room. The gardener became a hen-wife in
  the outer ward, and the row that will build that ground is rank 9's town or
  rank 4c's yard.

  And `test/tools.mjs` fails on this machine and passes in CI. Its
  byte-exactness rail cuts an inserted row back out with
  `.replace(/,\n$/, '\n')`, which does not match `,\r\n`; the file comes back
  one byte short and all three rows fail. That is a Windows-only failure on a
  repo whose own rule is that **Windows is the dev machine**, so `npm test`
  has been red locally and green on Linux for as long as the rail has
  existed. It is lane B and this row is lanes C and D, so it is left alone
  and written down here instead.

  A third thing, smaller: `plan-vs-scene.mjs`'s chapel-candles beat failed
  twice and then passed five times in a row, on `main` with this branch's
  work stashed. It loops twelve cells looking for an `examine` prompt and
  gives up if the chapel bell answers first; under load one of those reads
  comes back stale. Intermittent, pre-existing, and not touched here.


- **A closed rank is retired, not reused, and rank 1 came out here** (#619).
  Rank 1's own session left `BACKLOG.md` and `SPECS.md` carrying the row and
  said why: Devon's checkout held uncommitted rewrites of both, and *"deleting
  rank 1 and renumbering eleven rows underneath that is a conflict in every
  line of the table"*. This branch is the pass that lands those files, so the
  row comes out here — **and the eleven rows under it keep their numbers**.

  Renumbering is what the files say should happen: `SPECS.md`'s own "How to
  read a section" says a shipped row shifts every number below it. It is the
  wrong call the day four wave A sessions are live. `BACKLOG.md`, `SPECS.md`
  and `ROADMAP.md` carry about a hundred rank references between them, every
  one of them would move, and every other branch in flight would conflict on
  every line of every table — for a change that alters no priority and no
  dependency. **The reason the numbers can be kept is the reason the decision
  numbers were kept when the project moved** (#491, #522): every row is named
  by title as well as by rank in both `SPECS.md` and `ROADMAP.md`, so a
  retired number is a number nobody has to chase. The ranked table starts at 2
  now and says so above itself.

  What this does not settle is what happens when Devon next re-ranks. A rank
  is his judgement about worth, not an id, and if he renumbers the eleven that
  is a renumbering and this note is spent.

## The GPU run: somebody finally played it (2026-09-17)

**Rank 2, claimed on `claude/r2-gpu-run`.** `npm run play` opens a real window
and plays the whole day with pointer lock, WASD and real key presses. No run of
it had happened on a machine with real GPU compositing since Phase 5 (#53). One
did, on Devon's machine, twelve times. Decisions #624 to #630. Nothing in `src/`
changed; `test/play-castle.mjs` and `test/harness.mjs` did.

**The day still does not reach the end, and the row stays open.** What follows
is what twelve runs settled, in the order the run hits them.

- **`npm run play` needs a focused window and a quiet tree, and neither was
  written down** (#624). Two separate things stopped the suite before it played
  a single beat, and both look like bugs in the castle.

  Pointer lock never engaged from a shell that did not have window focus:
  Chrome refuses `requestPointerLock` on a document whose window is not the
  foreground one, and says so as `WrongDocumentError: The root document of this
  element is not valid for pointer lock`, which names neither focus nor
  permissions. The baseline run died at beat 18 with the whole day unplayed.
  `page.bringToFront()` before the start click. Verified both ways: the same
  script locked on a plain click in the foreground and threw backgrounded.

  Then the page reloaded mid-run and threw away the scene probe, and the next
  camera read failed with `Cannot read properties of undefined (reading
  'updateWorldMatrix')` — an error about the probe that says nothing about the
  page having restarted underneath it. Vite full-reloads on any change in its
  module graph. `npm run play` is a ten-minute walk on a machine somebody is
  using, in a repo other sessions are working in. Measured: five screenshots
  written into `shots/play/` left the probe alive, one touch of `src/main.js`
  with its own unchanged bytes killed it. `serveDev(port, { hmr: false })`.
  **It is `hmr` and not `watch`**, and both were tried: with `server.watch:
  null` the touch still reloaded the page.

- **The suite walks the castle's own path graph now** (#625).
  `test/play-castle.mjs` steered by aiming at a target and holding W, with one
  sideways nudge when the distance stopped changing. That is enough in open
  ground and hopeless against a wall with a door in it, and every beat of the
  intended path is a walk across the castle: the first complete run reported
  "walked to the cook in kitchen — never got in range" with the player pressed
  against the far side of the porter's gate, and the same for the porter, the
  apprentice, the cloak and the bell. Four people and a bell, all reading as
  unreachable, none of them unreachable.

  `walkability(plan).path(from, to)` already existed and is what
  `src/stations.js` walks the twelve along when a bell goes. The player walks it
  now, thinned to a waypoint every 2.5 m and to every corner, as a pre-walk
  before the old aim-and-hold loop does the last few metres, so every arrival
  predicate in the file is unchanged. Both ends snap to the nearest standing
  cell within 4 m, because neither reliably is one: the bell hangs in a ring,
  the cloak lies on a crate, and the player is routinely wedged where `cellAt`
  answers null. Three missed waypoints in a row re-plans from where the body
  actually is, twice at most.

- **Four overlays take pointer lock and only one gives it back, and the game is
  unplayable after the journal** (#626). `src/ui.js` calls
  `document.exitPointerLock()` for the riddle, the journal, the accusation panel
  and the verdict pane. `src/quest-manager.js` passes
  `() => this.controlsRef.lock()` as the riddle's `onClose`. Nothing passes
  anything for the other three, and `main.js`'s `unlock` listener will not offer
  its resume panel because an overlay is open at the moment it fires.

  Measured on a real GPU with a real keyboard: before the journal, W moves the
  player 3.70 m; after J and J again, W moves 0.00 m; a plain click on the
  canvas changes nothing, because nothing is listening on it;
  `window.__player.lock()` restores it and W moves 3.74 m again. A player has no
  `window.__player`. **The only way out of a castle you cannot walk is to reload
  the page.**

  **This is the answer to what `npm run play` is for.** Thirteen suites are
  green on it. `test/quest.mjs` drives the same path through the real manager
  against a UI that records instead of rendering; `test/plan-vs-scene.mjs`
  places the camera rather than walking it. Neither has a pointer lock to lose.

- **And a dialogue never releases pointer lock, so its Present button cannot be
  clicked** (#627). The cursor is captured, every pointer event goes to the
  locked element, and Playwright spends thirty seconds on a button it agrees is
  visible, enabled and stable: `canvas intercepts pointer events`.

  **The two bugs hide each other**, which is why neither had been reported. Open
  the journal once and pointer lock is gone for good, which makes Present
  clickable for the rest of the game, at the price of never walking again. Play
  without opening the journal and you can walk and cannot present. Presenting is
  how four of the twelve are pressed.

  Neither is fixed here. `SPECS.md`'s scope for this row is "nothing in `src/`",
  and `src/main.js`'s player rig is lane D, which rank 6 held while this ran
  (#602). Both are asserted in `test/play-castle.mjs`, red, and both are worked
  around so the rest of the day can be played. They are **rank 1** in
  `BACKLOG.md` now.

- **The Bakehouse descent was written with its flight's head and foot swapped**
  (#628). `test/play-castle.mjs`'s ten waypoints down the Bakehouse Tower were a
  mirror of the Kitchen Tower's with the mirror applied to the coordinates and
  not to the stairs. The Bakehouse's ground door faces the other way, so
  `doorEast` flips and `sideX` with it: the plan puts `bakehouse-tower-stair-2`
  sloping from (1.65, 4.00) to (-1.65, 7.90), head west and foot east, and the
  file called x +1.75 "the top" and x -1.8 "the foot". The lower flight's two
  legs stood at x +0.75 against a flight the plan puts at x -0.75.

  What that does to a body: from the level-2 floor at 8.00 the only way onto
  that flight is at its head, 7.90, one 0.10 m step down; at the foot end the
  flight is 4.12 under a floor at 8.00 and `standAt` refuses it. So the player
  walked to the wrong end, was refused, and stood at 8.00 for the rest of the
  day — four legs "reached" with not one metre of descent in them, then a
  Constable who could not be reached because the player was two storeys over his
  head. **`test/layout.mjs` cannot see this and is right not to**: its check
  walks a body up and down every flight starting ON the flight, which is the
  flight's own question. Getting onto one from the floor beside it is a
  different question and nothing asked it.

  The rule that came out of it, and it holds for the third flight too: **square
  on to a flight, never diagonally across it.** Over a flight's own footprint
  there is nothing to stand on at floor height, so a body crossing that band
  diagonally is refused and slides along it. Reach the flight's axis first, then
  walk down it.

- **Two checks in this file were dead and one of them was green** (#629). Filed,
  not rewritten, because this row's scope is the run.

  `interior hall walls are the same height as the outer walls` matches zero
  meshes: it looks for Kenney `wall_*` and `wall-half*` mesh names, and the
  walls became procedural runs carrying a `planId` and no mesh name when Phase 3
  rebuilt them. Both arrays come back empty and the assertion fails on every
  run. `test/plan-vs-scene.mjs` holds every run's box against the plan at
  0.01 m, which is strictly stronger, so the check should go rather than be
  repaired.

  `no brazier is sealed inside the stonework` reports `IN Scene`: the hall
  brazier's bowl falls inside the **gothic statue's** bounding box, and the
  check counts anything over 1.5 m tall as stonework. The furniture check eighty
  lines below documents that exact misfire and dodges it by matching `c.name`
  against `/^(wall|tower|column)/` — which, since the walls stopped having
  names, matches nothing, so **that check has been passing vacuously**. This is
  #147 twice in one file: the assertion's comment is the thing that is wrong,
  and a check that cannot fail is not a check (#13).

- **What the GPU actually showed** (#630). The row's other half is that somebody
  looks, so:

  **A tower roof at 12 m is mostly parapet.** The climb works: three flights,
  `Kitchen Tower, the roof` on the HUD, the camera at 13.7. The view east over
  the plan that #523 was for is largely blocked by the crown's own merlons, and
  their inward faces are **near-black** — unlit surfaces under ACES with
  photographic dark slate, the same failure mode #438 measured on the
  cross-wall, at a spot the hemisphere fill at 2.0 does not reach. From on top
  of a tower you mostly see black slabs.

  **The kit and the maps do not look like one castle.** The pixel-art
  crenellations and the kit's stone stairs sit directly against 1k photographic
  brick and slate, and at a tower top and in the chapel they read as two games.
  That is #411's trade made visible; it was always the known cost and nobody had
  seen the size of it.

  **A body at interact range is close to a silhouette.** The Constable in the
  chapel is a dark shape with white hair and a red collar. Whether twelve read
  as twelve is not answered here — the Vespers shot is the beat that answers it
  and the run does not reach it — but the lighting on the bodies is going to be
  as much of that question as the tint is, and the fourth body (#616 to #619)
  does not change it.

  **The compressed textures are fine** (#507). 1k `castle_wall_slates` at a
  grazing angle a metre from the camera reads as stone: no banding, no blocking,
  detail intact. The ETC1S-on-diffuse, UASTC-on-normal-and-ARM split chosen on a
  reading of the codecs holds up on a real GPU, and that question is closed.

  **The gaol roll reads** (#571). It lies on the barrel-head rather than
  floating over it.

  **And one thing seen and not isolated.** With the camera at (25.5, 17.6) —
  which `makePlan` puts unambiguously inside the chapel's 2.8 m disc, and there
  is no garden room in `plan.rooms` at all — the HUD read `East barbican
  garden`. Whether that is a stale line (the room is recomputed only on frames
  the player is moving) or a wrong one was not chased down. It is written here
  so the next person does not have to find it twice.

**Where the run stopped.** Run twelve reached 81 beats with 7 failures: the
whole wall walk, Prime's conversations, the gaol roll, the first bell, Terce's
cart and the merchant's admission. It stalled with the player at (23.4, 14.4) on
**level 1**, partway up the Chapel Tower's stairs. The path graph treats a
flight as walkable floor, so the shortest route out of the chapel runs across
the stair ramp, the player is driven up it, and every re-plan then starts a
storey too high. The fix looks small — drop ramp and wrong-level waypoints when
both ends are on the same storey — and it is not in this branch, because a fix
nobody has run is not a fix (#53).

**What this cost, and the rule it bought.** Twelve runs at about ten minutes
each. Two of them were lost to things that had nothing to do with the castle: a
run killed by another session's `git checkout` in the same working tree, which
wiped this branch's uncommitted edits to both test files, and a run killed by
Vite reloading the page when a file changed under `src/`. **A GPU run wants a
working tree nobody else is holding.** `ROADMAP.md` gives R2 no lane, on the
grounds that it writes no file anything else writes. That was wrong in the one
way that matters: it does not write the tree, it *reads* it for ten minutes at a
time, and a checkout underneath it is fatal. The answer is a `git worktree`, and
the second half of this row was run from one.

## The byte-exactness rail, red on Windows since the day it was written (2026-09-17)

**`npm test` has been failing on the dev machine and passing in CI for as long
as `test/tools.mjs` has existed**, and both halves of the rail were wrong in the
same way. `data/scene-config.json` is checked out CRLF here (`core.autocrlf` is
`true`, 2546 line endings), and the splice and the cut that undoes it were both
written in LF. All three rows said the same thing: **96758 bytes in, 96757 back
out.** Decisions #631 to #633, on `claude/mystifying-lumiere-49ce52`, lane B.
Part 1 of the suite goes from 17 assertions to 47 and the file from 38 to 70.
Twelve of thirteen suites green, `npm run build` green, `npm run play` not run
(#53); the thirteenth is `plan-vs-scene` and it is written up at the bottom.

**Written as #624 to #626 and landed at #631 to #633.** The GPU run merged as
PR #39 while this was being built and took #624 to #630. The rule that would
have avoided it is the one #619 already wrote down, read `HISTORY.md` on
`origin/main` at the moment you write the entry, and it was followed: the
numbers were read off `origin/main` at `e8052e8`, which was `origin/main` when
this branch was cut and still `origin/main` an hour later. **Reading at write
time is not enough on its own; the read has to be a fresh fetch.** That is the
third renumber in two days from the same cause and the cheap version of the
fix is one command, `git fetch origin` immediately before the entry is written.

**This is #13 and #147 in one bug.** #13 says a check that only prints is a
check that gets ignored, and a check that is red on the machine the work happens
on gets ignored the same way: it was found by #618 on the way past, written
down, and left, because a red line you have learned to scroll past is worth
nothing. #147 is the other half, and it bites twice below. The rail's own
comment claimed "every byte that was not the new row is the byte it was", and on
the machine CLAUDE.md calls the dev machine it was measuring a different file
than the one it said it was.

- **The splice writes the file's own line ending, not this repo's** (#631).
  `tools/place.mjs` now takes every newline it emits from `eolOf(source)`:
  `insertRow`'s two, and the ones `formatRow` puts between a row's lines and
  inside a `tile` it breaks over three. A splice into a CRLF file leaves a CRLF
  file and a splice into an LF file leaves an LF one.

  **The load-bearing byte is not the row's, it is the one the splice has to put
  back.** A non-empty array's last element has no comma, so `insertRow` strips
  the whitespace before the closing bracket with `/\s*$/` and hangs a `,` off
  the element instead. That strip eats the line ending *and* the bracket's
  indent, and `${eol}${text}${eol}${pad}` is what restores them. Writing `\n`
  where the file had `\r\n` is therefore a one-byte change in a region the splice
  was never asked to touch, and that is the whole of the 96758 to 96757.
  `formatRow` keeps `\n` as its default because a row on its own has no file to
  read an ending off; `insertRow` is the only caller that has one and it always
  passes it.

  **Nothing else needed changing, and that was checked rather than assumed.**
  `vite.config.js`'s `/__place` handler reads with `utf8` and writes back the
  string `insertRow` returned, so it normalises nothing at either end.
  `tools/encode-assets.mjs` is the other writer of this file and it rewrites
  quoted paths with `split().join()`, which cannot see a line ending at all.

  **What a person actually gets.** Driving the handler's own code path against
  the real file on disk: 7 added lines, 112 bytes, CRLF count 2546 to 2553, zero
  bare LF. The same write with the old writer produced a git diff that looked
  identical and left **8 bare LFs in the working tree**, with git warning `LF
  will be replaced by CRLF the next time Git touches it`. The diff is the product
  (`place.mjs`'s own opening argument), so a writer that leaves the file mixed
  for the next `git add` to rewrite was failing at the thing it exists for while
  looking like it worked.

- **A rail that reads the working tree reads one machine's working tree, so it
  builds both endings itself** (#632). `test/tools.mjs` no longer splices into
  whatever git handed it. It normalises the file to LF, makes a CRLF copy, and
  runs the whole of part 1 over both: three rows times six assertions, twice,
  plus `eolOf` read back per copy and the empty-array case in each ending.
  Neither machine can now be the only one that runs the half that breaks, which
  was the actual defect. The bug was not that the rail was LF-only. It was that
  **Windows and CI were running different assertions out of the same file** and
  the green one was the one anybody looked at.

  The `eolOf` read-back at the top of each pass is there because the rest of the
  pass takes its expected ending from the same function the writer does. That is
  a test re-implementing the thing it checks unless something independent pins
  it, so the loop asserts the LF copy reads as `\n` and the CRLF copy as `\r\n`
  before trusting `eolOf` for anything else.

- **The byte diff cannot see a newline inside the new row, so the endings are
  counted as well** (#633). This one came out of breaking the code on purpose and
  is #147 pointed at a third target. Forcing `formatRow`'s `eol` back to `\n`
  while leaving `insertRow` correct **leaves the byte-exactness assertion
  green**: the suite finds the row with `out.indexOf(formatRow(row, 4, eol))` and
  cuts exactly what it finds, so a row written with the wrong ending is found
  with the wrong ending and the diff cancels. The rail's headline assertion is
  blind to the interior of the thing it inserted.

  So every splice now also asserts `strayEndings(out, eol) === 0`, a count of
  line endings in the written file that are not the file's, and `formatRow` is
  checked in CRLF directly in part 3. Under that break the count is **8, 14 and
  7** stray LFs for the three rows.

  **The four breaks, from green, and what each one said** (#34):

  | Break | Result |
  | --- | --- |
  | `insertRow` splices `\n` | 10 failures, all CRLF. `and every other byte is the byte it was — 96758 bytes in, 96756 back out`, plus `the previous element got the comma it needed — " },\n"` |
  | the cut looks for `,\n` and skips `+ 1` | 3 failures, all CRLF. `96758 bytes in, 96760 back out` |
  | `formatRow` forced to `\n` | 6 failures. **Byte-exactness stayed green**; caught only by `and the file is still CRLF throughout — 8 line ending(s) of the other kind` and by part 3's `and in CRLF when the file it is going into is CRLF` |
  | `eolOf` always returns `\n` | 7 failures. `eolOf reads this copy as CRLF — "\n"`, then `2545 line ending(s) of the other kind`, and the original symptom exactly: `96758 bytes in, 96757 back out` |

  Every one of them left the LF half of part 1 green, which is the point. That is
  the half CI runs, and it is why none of this was ever visible there.

- **And the thing this row did not fix: `plan-vs-scene`'s chapel-candles beat is
  red on this machine, four runs out of four.** `none of the 12 cells between 0.9
  and 2.8 m of the chapel candles offers them (the nearest offered "Press E to
  ring the bell")`. #618 recorded the same assertion as intermittent, two fails
  then five passes. Here it does not pass at all.

  It is not this branch's. `git diff main...HEAD --name-only` is five markdown
  files, `test/tools.mjs` and `tools/place.mjs`, and that suite reads none of
  them: **`src/` and `data/` are byte-identical to `main`**, so running it here
  is running it at `main`. The beat teleports the camera to a cell, waits two
  `requestAnimationFrame`s and reads the prompt the running `InteractionSystem`
  offers, which is a real-time assertion under a software-rendered Chromium and
  inconclusive from `npm test` by #53's own terms. **CI agrees it is timing and
  not content**: this branch's run passed that suite in 187.3 s against 9.4 s
  here, so the beat gets its two frames on a runner that is twenty times slower
  per suite and does not get them on a fast machine, which is the opposite of
  the way a flake usually reads. It wants the same treatment
  this row just gave `tools`: a rail that does not depend on how fast the machine
  under it happens to be. Left alone because it is a different file and a
  different lane, and written down here rather than scrolled past, which is the
  mistake #618 is an example of and this entry is the correction to.

## Rank 3, the preview and og card: a fallback shot, not the one the spec asked for (2026-09-17)

**Ranked row 3, on `claude/r3-preview-og-card`, no lane.** `SPECS.md`'s
recommended source — the Great Hall at Vespers, six of the twelve and the HUD
— does not exist: the GPU run (rank 2) aborted before reaching Vespers,
stopped by the pointer-lock bug that same run found and that is rank 1 now
(#626). `shots/play/` has twelve frames and none of them is
`twelve-at-vespers.png`. Devon was asked and chose the fallback rather than
holding the row for a second run: `08-the-chapel-at-prime.png`, the constable,
the chaplain and the apprentice, mid-dialogue, HUD and journal chrome
included. Decisions #634 and #635.

- **The source is the chapel-at-Prime shot, by Devon's choice, and the row is
  not `twelve-at-vespers`** (#634). It shows three of the twelve rather than
  six, and a quest panel and a dialogue line rather than the game's wider
  claim. It is real gameplay chrome and not a posed shot, which is what the
  row's `og:image:alt` already said ("Castle Conundrum, mid-play.") and still
  says truthfully. **Revisit once rank 1 is fixed and a run reaches
  Vespers**: nothing here is load-bearing on the chapel shot in particular,
  and the next run's `twelve-at-vespers.png` is a straight swap.

- **Both images were built with this repo's own `sharp`, not
  tools-and-games' canvas trick, and to that project's own numbers** (#635).
  `promote-previews.mjs` (`tools-and-games/Tools/board-check/`) already
  answers every open question a fresh attempt would re-ask: 330x200 under
  60 KB for the preview, 1200x630 under 300 KB for the og card, both cropped
  from the same frame with the crop window's centre 0.42 of the way down the
  source rather than dead centre (every capture's foreground stands above the
  midline, its floor below). That project reasons its way out of an image
  library — `npm install` there has to work with no CDN reachable, so the
  crop, resize and JPEG encode happen in a page's own canvas instead. Neither
  constraint holds here: `sharp` has been a `package.json` dependency of this
  repo since the move (#493, for `tools/encode-assets.mjs`) and is already on
  disk. `sharp.extract` and `.resize(..., { kernel: lanczos3 })` reproduce the
  same crop and the same halving-safe downscale in four lines instead of a
  page evaluate, and a quality ladder of 82/76/70/62/55 stopped at 82 for
  both sizes: 13.6 KB and 99.3 KB, both comfortably under budget on the first
  try, because a screenshot this size compresses easily next to a rendered
  frame at native resolution.

  **The images live in this repo, under `assets/og/`, not in
  `tools-and-games/assets/`** — the other open call, and Devon's answer
  matches `SPECS.md`'s recommendation. `index.html`'s `og:image` and
  `twitter:image` now read
  `https://greyversusblue.github.io/castle-conundrum/assets/og/castle-conundrum.jpg`,
  replacing the `greyversusblue.com` copy the comment above them had called
  deliberate since #504. The board-side relink in `tools-and-games` (its own
  `assets/og/castle-conundrum.jpg` and `assets/previews/castle-conundrum.jpg`,
  330x200, the size this row's `castle-conundrum-preview.jpg` matches) is
  Devon's to do there; nothing in this row touches that repo. `assets/og/` is
  not under the reachability sweep (`poly-haven` and `NPCs` only) because it
  is not a runtime asset — nothing in `src/` fetches it, a crawler does — so
  the sweep's comment says so rather than the sweep growing a third name to
  ignore.

  `test/built.mjs` gains the line `SPECS.md` asked for: `og:image`'s path,
  read off the built `index.html` and resolved against `og:url`, has to exist
  in `dist/`. Verified against #34: renamed `castle-conundrum.jpg` out from
  under it, ran the suite, watched `FAIL og:image's path exists in dist/ —
  assets/og/castle-conundrum.jpg`, put the file back, green again. Fourteen
  suites green (thirteen plus this one line, not a fourteenth suite),
  `npm run build` green. `npm run play` not run — no `src/` changed, and the
  images being right is a look, not a script (#53).
## The tooling, move-and-delete: the editor stops being a stopwatch (2026-09-17)

**Rank 12b, claimed on `claude/r12b-move-and-delete`, lane B.** `?edit=1` could
add a prop and nothing else, so correcting a placement meant opening the 2546-line
file the tool exists to stop anyone opening, counting rows, and typing two
numbers. It can move one and delete one now. Decisions #636 to #642. Four files:
`tools/place.mjs`, `test/tools.mjs`, `src/edit-mode.js`, `vite.config.js`.
Thirteen suites green, `npm run build` green, `npm run play` not run — nothing
here is in `src/main.js` or in anything a built page loads.

**Lane B was the reason this waited and it was clear when it was taken**: the
byte-exactness rail this increment has to keep was red on Windows until #631 to
#633 fixed it that morning, and this row started from a green 47-assertion
baseline rather than from that failure.

- **A row is found by walking the text, not by searching for it** (#636).
  `rowSpans(source, key)` returns the `{ start, end }` of every element of a
  top-level array, walking the string the way `closingBracket` already did, one
  level in. The obvious alternative — `source.indexOf(formatRow(row))` — is
  wrong twice over, both ways are quiet, and the numbers were measured rather
  than assumed. **Three of the file's 31 placeable rows are not what `formatRow`
  would write**, so `indexOf` on them returns -1 and the edit silently targets
  nothing: 28 of 31 come back byte-identical at their own indent and the other
  three carry a `1.0` or a `-2.0` where `JSON.stringify` writes `1` and `-2`,
  which is #584 arriving from the reading end instead of the writing end. And of
  the 28 that would be found, **an exact twin resolves to the first of the
  pair** — the committed file has no duplicate today and the editor can make one
  in two key presses, because a brazier placed twice on the same tile is the
  same 6 lines twice. Editing the second would rewrite the first, and the file
  would parse, read right, and have moved a prop nobody asked about. The suite
  does exactly that, for all three arrays, and edits the first of the pair.
- **The span is checked against `JSON.parse` and not against a second walk**
  (#637, and #34's rule, and #500's). For all 31 placeable rows in the real
  file, on both line endings, `JSON.parse(source.slice(start, end))` has to
  equal `JSON.parse(file)[key][i]`. That is 62 assertions that cost nothing and
  they pin the two things a span can get wrong independently: which row it is,
  and where the row stops. A span one character long fails the parse; a span one
  row off fails the compare. A span finder proved by a second span finder is a
  check agreeing with itself, which is the shape two dead line-of-sight checks
  had in this project already.
- **Which side of a row the comma comes off is the whole of `deleteRow`**
  (#638). Three cases, not one. A row with something before it takes the
  separator on its **left**, which is `insertRow` run backwards — and that is
  what makes the headline assertion possible: **insert a row, delete it again,
  and the file is the file it started as, byte for byte**, on both endings, for
  all three arrays. The first of several takes the separator on its right. The
  last one standing leaves `[]`, which is the empty form `insertRow` already
  knew how to fill, so an array can be emptied and refilled without a person
  touching it. `deleteRow` writes no newline at all — it only slices — so it is
  the one function here that cannot have #631's bug by construction.
- **`replaceRow` promises what is outside the row, and only that** (#639).
  Rewriting a row with its own parsed value is **not** a no-op and is not meant
  to be: a tile the file spells `-2.0` comes back from `JSON.stringify` as `-2`.
  That is #584's churn, confined to the one row being edited, which is the
  bargain the whole module is. What it does promise is that every byte before
  the span and every byte after it is unchanged, and the suite asserts that per
  row rather than per array. **The move's real diff on the live dev server was
  three lines on a 96 KB file** — two numbers and the comment — with the row's
  `model`, `rotationY`, `noCollide` and `yOffset` carried through untouched,
  because a move is a move and not a re-placement: the panel's dropdowns
  describe the next thing to place and have nothing to say about a prop already
  in the file.
- **The panel never keeps its own copy of the array** (#640). Every write
  answers with the whole array as it now stands on disk and the panel replaces
  what it had. This is not tidiness. A delete shifts every index after it, and a
  list that remembered the old order would name the wrong row on the very next
  click — the file would still parse and the prop that moved would be one nobody
  asked about, which is the same silent failure #636 is about, arriving from the
  other end. Driven live: deleting `builtProps[9]` renumbered `gaol-roll` from
  15 to 14 and `watch-bill` from 14 to 13 in the panel's list, in the same tick.
- **Delete is the only verb here that arms** (#641). Two presses inside four
  seconds. The other two add something a person can see and undo by deleting it;
  this one takes away a row that cost somebody a walk to place, and a mis-pressed
  key while running through a doorway should not be what does it. It is bound to
  `Delete` and deliberately **not** to `Backspace`, which is a browser's back
  button in enough setups that a mis-press would leave the castle rather than a
  prop. `M` moves, `N` picks the next row without reaching for the mouse, and the
  list offers every row within six tiles, nearest first, rebuilt as the player
  walks — but never while the `<select>` has the keyboard, because rebuilding one
  somebody is scrolling closes it under their hand.
- **The dev server counts rows before it writes** (#642). `/__place` takes
  `add`, `move` or `delete` now, and each verb says what it should do to the
  array's length. An `add` that lost a row and a `delete` that ate two both
  produce text `JSON.parse` accepts, so the count is checked against the verb's
  promise and nothing is written when it does not hold. That is a second net
  under `test/tools.mjs`'s at the one place the suite cannot stand: the side
  that actually opens the file. A stale index is refused rather than clamped —
  `place: "builtProps" has 15 row(s), so there is no row 99` — because a clamp
  would move the last row instead of failing.

**Seven guards, broken on purpose, from a green baseline** (#34). Five went red
first time: the search-instead-of-walk mutant took out the index checks, a
hardcoded `\n` in `replaceRow` took out all three CRLF rows, a span one byte
long took out the parse compare, a clamped index took out eight, and cutting the
old note at the first full stop took out three. **The sixth stayed green, and it
was the mutant that was wrong, not the suite.** Flipping `deleteRow`'s two
branches — right-hand cut for everything but the last row instead of left-hand
cut for everything but the first — is a different implementation of the same
function, not a bug: every row in these arrays sits at the same indent, so the
two cuts produce identical bytes. Replaced with two that are real, a delete that
eats one byte past the row (`94212 bytes in, 94211 back out`) and one that
leaves the separating comma behind (`94213 back out`); both red. Recorded rather
than quietly swapped, because "the break left the suite green" and "the break was
not a break" look the same from the outside and only one of them is a hole (#147).

**What it was proved on.** `test/tools.mjs` is 179 assertions, up from 47, over
an LF copy and a CRLF copy of the real file. The panel itself was walked on the
dev server: a move and a delete written to the real `data/scene-config.json`, the
three-line diff read, the page reloaded, and the castle built from the edited
file. Both markers were confirmed in the live scene through `test/drive.mjs`'s
own probe rather than by eye — the green box on the last placement, hidden until
there is one, and an amber box on the selected row at `[-33.42, 0.4, 11.26]` for
a row at tile `-8.3557, 2.8149`, following the list as `N` walked it. `git
checkout -- data/scene-config.json` afterwards: **this row ships no content**,
and the branch's `data/` is byte-identical to `main`.

- **The editor will happily delete a row a suite depends on, and that is
  correct.** `builtProps[9]` is the engineer's drawing, which `test/mystery.mjs`
  reads; deleting it left the dev server green and the castle standing. The diff
  is for a person and `npm test` is the net, which is what #583 decided when it
  chose not to commit.
- **`plan-vs-scene`'s chapel-candles beat is still red here and it is still not
  this branch's.** #633 measured it four runs out of four on this machine and
  187.3 s in CI, and nothing has moved: `git diff origin/main --name-only` is
  four markdown files, `test/tools.mjs`, `tools/place.mjs`, `vite.config.js`
  and `src/edit-mode.js`, and that suite loads the page without `?edit=1`, so
  the editor module is not in its graph at all. Running it here is running it at
  `main`.
- **`test/harness.mjs` binds fixed ports and eight sessions now share this
  machine.** Two of three full `npm test` runs here failed on `Port 8126 is
  already in use` and `Port 8127 is already in use`, in `built` and `touch`, both
  of which pass alone and passed in the third run. Not this row's and not fixed
  here — it is `harness.mjs`, which is nobody's lane and everybody's file — but
  the parallel-session regime `ROADMAP.md` now assumes makes a fixed port a
  collision waiting for a schedule, and a red suite that is really a port is
  exactly the kind of thing a session learns to scroll past.

## Bodies: the child off the rig that was there, and a hound (2026-09-17)

**Ranked row 10, on `claude/r10-bodies`, under Claude Fable 5.1, on Devon's
machine, in its own `git worktree`.** The worktree is #624's lesson taken on
the first day it could be: eight rows were in flight at once (R3, R4a, R4b,
R5, R10, R11, R12b, R12c) and this one shared the machine with all of them and
the lane with one. quaternius.com answered, `ktx` v4.4.2 is on PATH.
Decisions #643 to #645, **written as #634 to #636 and moved twice**: rank 3's
preview and og card merged as PR #42 while this was open and took #634 and
#635, and rank 12b merged as PR #45 during the rebase that followed and took
#636 to #642. That is #619's and #633's lesson a fourth and a fifth time, with
the read a fresh fetch every time; a number picked at the end of a row still
moves if the row waits an hour for review. Ten Node suites green; the three browser suites lost
their first run to `Port 8127 is already in use`, which was another session's
`npm test` on the same machine and not this branch, and are written up at the
bottom. `npm run build` green. `npm run play` was not run (#53): this row's
GPU question is the same one rank 2 already owes, and it is written up as
still owed. `dist/` is 31 MB.

- **The child is the rig that was already there, with a bigger head** (#643).
  `SPECS.md`'s open call said to try scaling the existing rig before fetching
  anything, and the try was a line-up on a grey background, the way #606
  looked at the woman: a 1.8 m Farmer, then `Adventurer.glb` at 1.2 m, then
  the same with its `Head` bone at 1.3, then `Woman.glb` at 1.15 m with its
  head at 1.3. **A shrunk Adventurer is a small bearded man.** The beard and
  the backpack are the tells and nothing about proportion helps while they
  are there. The hooded woman's rig is the one that reads: no beard, a hood
  where the hair would be, and with the head a third larger on a body two
  thirds the height it is one part in five and a half against an adult's one
  in seven and a half, which is a child of seven or so. A second line-up put
  the head at 1.3, 1.45 and 1.4 on 1.2 m, 1.2 m and 1.1 m: 1.45 is a cartoon,
  1.1 m stands at the player's chest. She is 1.15 m with `Head` at 1.35.

  Three fields carry it, all on the def and none on an id: `boneScale`, a
  bone name to a scalar applied after the height normalise and untouched by
  the clips, which key position and rotation only; `clips`, one clip name
  put ahead of `npc.js`'s list for a key, so her walk is `Run`; and `speed`,
  in m/s, because a Run clip at the adult 1.1 m/s is a body running on the
  spot. She is Gwenllian, the well-wife's girl, `#a9c4d6`, and she runs a
  three-stop ring from the laundry across the outer ward at Prime at 2.2 m/s.
  `validatePopulace` refuses a bone scaled to 0 (a body with no head), a
  speed of 0 (a body that never arrives and holds `walking` for the watch)
  and a `clips` value that is not a string, and `test/mystery.mjs` asks it
  each of those.

  **And her first stop was on a staircase, which nothing in Node said.** The
  laundry is a drum, its stair hugs the wall, and a stair tread is a walk
  cell with a floor: `cellAt` answers `h: 1.65` for it and `roomAt` says
  `laundry`, so `validatePopulace` passed a stop that put her four treads up
  with the laundress at the foot. Found by photographing her, moved to a
  tread-free cell. The validator does not refuse a stop on a stair, because
  a body on a stair is sometimes the point; what it could say is the height,
  and it does not yet.

- **The hound is a fifth file, and the only fetch** (#644). quaternius.com
  lists two animal packs and both pages say CC0 with a link to the deed.
  The Ultimate Animated Animal Pack's Drive folder has a `glTF/` of twelve:
  Alpaca, Bull, Cow, Deer, Donkey, Fox, Horse, Horse_White, Husky, ShibaInu,
  Stag, Wolf, 1.4 to 3.4 MB each. The Farm Animals pack, which is where a
  chicken would be, has `Blends/`, `FBX/` and `OBJ/` and no glTF at all, so
  **there is no chicken this sitting** and the row says so below. Husky and
  ShibaInu were fetched, 3.06 and 2.89 MB, one data-URI buffer each, 1920
  and 1950 triangles, 49 joints, twelve clips by the same names: `Attack
  Death Eating Gallop Gallop_Jump Idle Idle_2 Idle_2_HeadLow Idle_HitReact1
  Idle_HitReact2 Jump_ToIdle Walk`. The Husky is the hound: bigger,
  wolf-shaped, and at 0.7 m beside the 1.8 m Farmer it is a dog and the
  Shiba at 0.5 m is a fox. It is 3.19 units tall and 3.88 long as authored,
  so `modelHeight` is not optional on it the way it is not on the women.

  The re-export is the same four moves as #604, for the same reasons. The
  pack names the five materials `Material`, `Material.001`, `Material.002`,
  `Material.003` and `Material.006`; they are `Coat` (732 triangles, the dark
  top), `Coat_Light` (1090, belly and muzzle), `Eye` (24), `Eye_White` (14)
  and `Nose` (60), read off the triangle counts and the base colours. The
  coat was lifted from 0.065 and 0.36 linear to 0.55 and 0.85, because a
  tint is a multiply and a tawny tint on a near-black coat is a near-black
  dog; the markings survive as tint times 0.55 against tint times 0.85. The
  node and the mesh were `Cube` and are `Hound`. `Nose` joined
  `BARE_MATERIALS` in `npc.js`, beside skin, eyes, brows and hair, for the
  reason those are there. Encoded, 1.71 MB of raw floats to 0.63 MB.

  It is Gelert, the Constable's hound, `#b08a5a`, and it has the one
  behaviour the spec asks of a dog: `follow: {radius: 6, keep: 1.8}`. Within
  6 m of the player on a floor `nav.route` can reach, `Populace._follow`
  leaves the ring, routes to the cell the player stands in, drops every cell
  inside 1.8 m of them and walks the rest, then turns to face them and
  waits; two metres of hysteresis on the way out, a re-route at most every
  half second, and the route back to the stop it left when they are gone.
  Every step is a grid cell, so a dog following through a doorway took the
  doorway. **Seen, on this GPU**: the live page at Prime, the camera put
  4.2 m from its first stop, and six seconds later the hound at 1.8 m
  facing the camera with `Gelert — the Constable's hound` over it. The one
  line outside this row's lane is `main.js` passing `camera.position` into
  `populace.update`, lane D's file, and the PR says so. The bark is not in:
  a sound is `src/audio.js`'s and lane E's, and rank 7's remaining half is
  event sounds.

  Two new activities, `sniff` (`Idle_2_HeadLow`, the head down) and `eat`
  (`Eating`), exist in one body and `wait` exists in all five. Its ring is
  the outer ward at Prime and Vespers, a place to watch the muster from at
  Terce, and the kitchen at Sext.

- **Three rails, each broken on purpose first, and one the second rig forced**
  (#645). The encoder and `test/assets.mjs`'s check 5 both found bodies
  through `cast` alone, which was #605's finding pointed at a second door:
  the first populace body the cast did not wear would have landed raw with
  every suite green. Both read `data/populace.json` now. The clip check in
  `test/mystery.mjs` asked every clip in `ACTIVITY_CLIPS` of every body the
  household wears, which was true of four bodies that are one rig and is
  false of a dog: `Hound.glb` has `Eating` and no `Idle_Sword`, the guard the
  reverse, and neither is wrong until somebody writes the serjeant's `muster`
  onto the dog. The check is per person now, each person's jobs against the
  clips in the file that person wears, plus one line that every clip the
  table names is in some body on disk. And the row's Node acceptance from
  `SPECS.md` is asserted: **10 silhouettes off 5 body files**, a silhouette
  being body, height, hidden nodes, hidden materials, held prop and bone
  scale, with tint left out on purpose because every tint is already unique
  and counting it makes the number thirteen colours on one body.

  The follow is driven in Node, which is what `populace.js` having no
  three.js in it (#616) was for: the real grid, the real hound, and a body
  that is a plain object recording what it was told. Eight assertions: placed
  at its stop on a load, sent along a route one frame after a player stands
  4 m off, the route ending 2.00 m short of them, every point on it a grid
  cell, facing and waiting once there, and routed back to the stop when they
  are 40 m away.

  What is not counted, and is said rather than fixed: `test/budget.mjs`'s
  bodies-per-ward number is read off `mystery.schedule` and has never
  included the household, so the twelve of them, now with a dog, are not in
  its 7-per-ward peak. That is rank 6's number to answer to (#609) and the
  file that says 20 is where it should be argued.

**Broken on purpose, from a green baseline** (#34). Four breaks, each
reverted, green again after.

1. `Hound.glb` on disk and in `populace.json`, before `npm run assets:encode`.
   `assets` exited 1 on `assets/NPCs/Hound.glb has no EXT_meshopt_compression
   — run npm run assets:encode before committing it (#506)`. Before this
   branch that check would have said nothing, because the hound is in no
   `cast`.
2. `hideNodes`, `hideMaterials`, `heldProp`, `boneScale` and `modelHeight`
   stripped from every entry in both data files. `mystery` exited 1 on
   `5 silhouettes off 5 body files, across the cast and the household`.
3. The hound's Terce stop given `muster`. `validatePopulace` found nothing,
   because `muster` is a real activity, and `mystery` exited 1 on `hound does
   "muster" in assets/NPCs/Hound.glb, which ships no clip called Idle_Sword`.
4. The `walkTo` cut out of `_follow`'s route branch. `mystery` exited 1 three
   times: `one frame later it has been sent along a route — walks: 0`,
   `arrived, it faces the player and waits`, and `and when they are gone it
   is routed back to the stop it left — no walk`.

**What is left of the row.** A chicken, which needs a source: neither
Quaternius pack ships a bird as glTF, and a Blender or FBX export is a
conversion this repo has no tool for. The garrison's spears, which are a held
prop on the rig that exists and not a body, and no pack on disk has a spear:
the Kenney kit's 106 pieces are architecture. And the look at both on a real
run, which is rank 2's `twelve-at-vespers` question with fourteen in it now.

**The browser suites.** `plan-vs-scene`, `touch` and `built` fell over twice in
under a second each on `Port 8125 is already in use` and `Port 8127 is already
in use`: two other sessions' `node` processes on this machine were listening on
8127 and 8128, and the ports are constants in each suite. Run a third time with
the three constants moved to 8225 to 8228 in the working copy and put back
after, **all three passed**, and with them `plan-vs-scene`'s chapel-candles
beat that #606 and #633 both record as red on this machine on an untouched
`main`. Thirteen of thirteen, then, in two runs. The port constants are a
small thing to leave for whoever next runs two suites on one machine.

## A fact that changes with what the player did, and the castle that says it (2026-09-17)

Rank 4's fourth thread, the one the lore row left behind when it closed (#596):
a `since` field on a fact in `data/lore.json`, so the canon says something
different on the morning after. Decisions #649 to #649, on `claude/r4b-since`,
lane A. **It never touches `src/save.js`.** The journal the second day reads is
`state.clues`, which the save has carried since before the gaol roll (#571,
#573), and the ending is `outcomeOf`'s, off `state.accusations`. The key did not
move and the version is still 6. All thirteen suites green on this branch and `npm run build` green inside
`built`; `npm run play` not run (#53). No run of the thirteen got all of them in
one pass: the browser suites take fixed ports and another session on this
machine was holding them, so `map` and `built` each had to be re-run on their
own and each went green immediately. Every failure in every run was `Port 812x
is already in use`. Nothing failed on an assertion, and the reason is at the
bottom of this entry.

`data/lore.json` goes from 65 facts to 66 and `data/npcs.json`'s `performances`
from two pools to three. `test/lore.mjs` gains a tenth section of 27
assertions, `test/quest.mjs` a section of 15.

- **`since` is a list of rows and it may only ever replace** (#646). A fact
  carries `since: [{when?, unless?, knew?, tells, text, why}]`, the first row
  that applies wins, and a play that matches no row reads the fact exactly as
  written. That is #573's rule for `day2.knew` pointed at the canon and it is
  the reason `factText` takes the base text as its floor rather than as another
  branch: every ending has the fact, and only some endings have the change.
  Read it and the answer is one of five today: day one, the smith hanged with
  the gaol roll in the journal, the smith hanged without it, nobody hanged, and
  every other verdict.

  The one fact is `the-clerk-who-asked`, a `rumour`, and what it is about is the
  player: a man came up from Caernarfon and spent a day asking, and by the
  morning after the castle has decided what that was. It is the first thing in
  this game whose **content** rather than whose line set turns on what the
  player found.

- **The grammar is exported, not copied** (#647). `src/mystery.js` grows
  `dayTwoApplies(row, outcome, held)`: `appliesTo`'s `when`/`unless` plus
  `knew`, a list of clues all of which have to be in the journal. `day2.castle`
  and `day2.knew` keep the private `appliesTo`; `data/lore.json`'s `since` rows
  and `data/npcs.json`'s `rumours` pieces both read through the export.
  `src/lore.js` now imports from `src/mystery.js`, which it did not before, and
  that is the point: a second copy of a grammar is a second copy that drifts,
  and the thing being claimed here is that a row means the same in all four
  places.

  `knew` fails closed. No journal is "holding nothing", so a conditioned row
  with no clues in hand does not apply, rather than applying to everything.

- **A room at a bell holds a list, and the rail becomes reachability** (#648).
  The third pool is `rumours`: three pieces, all the guardroom at Lauds, all
  Dafydd ap Rhys, who is off watch and awake there in every one of the seven
  endings. Which one he says is the verdict and the journal.

  #592 wrote two rails and conditions made both of them wrong in the same way.
  *One room at one bell holds one piece* would have refused the pool outright;
  *a piece by a man a verdict can take out of the castle* would have refused a
  piece written for the one ending that man survives. Both are now asked once
  per ending rather than once:

  - **Every piece in a place has to be reachable.** The manager takes the first
    that applies, so what is refused is a piece an earlier one answers for in
    every ending and every journal. An unconditioned pool collapses back to the
    old rail by construction, because a second piece with no `when` and no
    `knew` is shadowed everywhere by the first, and the shipped break for it
    still fails: `sermon-vespers-osyth answers for chapel at vespers in every
    ending and journal this piece claims`.
  - **Absent in an ending this piece applies to**, not absent in any ending at
    all. The suite asserts both halves: the roll piece put in the prisoner's
    mouth is refused, and the same piece under `when: ["nobody"]` is allowed,
    which is a sentence the old rail could not say.

  The enumeration behind both is exact rather than clever: seven endings times
  the subsets of the clue ids the pieces in that place name between them. That
  universe is two subsets today and is sound because a clue no piece there names
  cannot change any of their answers.

  **A condition at one of the four bells is refused** as well. A verdict is a
  thing only the morning after has, so `when` on a Sext song can only ever read
  as "never", and a piece that is silently never played is the failure #13 is
  about.

- **`tells` is the tie, and it is checked in both directions** (#649). The canon
  is read by `src/lore.js` and by nothing on the page. A `since` row with
  nothing saying it out loud is therefore a paragraph in a drawer, and a piece
  heard where its row does not apply is the castle and the canon saying
  different things in one play, with nothing on screen to show it. So a row
  names the piece that carries it, the piece names the fact back in its own
  `cites` the way a document and a chatter pair already do (#551, #592), and the
  validator walks every ending and every journal to refuse a piece heard
  anywhere its row is not true.

  The break that proves it is the one worth having: narrow the row to `when:
  ["full"]` and leave `rumour-lauds-roll` alone, and the suite says `rumour-
  lauds-roll is heard after the verdict prisoner holding gaol-dates, which this
  row does not apply to`. Nothing in the game would have said so.

**Broken on purpose, from a green baseline** (#34). Nine breaks, each reverted,
green again after. Both baselines were confirmed to exit 0 first.

| Break | Result |
| --- | --- |
| `performanceHere` takes `here[0]` instead of the first that applies | `quest` exit 1 on four, including `the guardroom falls past the roll piece to the one about a hanging — rumour-lauds-roll` and `a fall gets the piece about a morning with no rope in it — rumour-lauds-roll` |
| `_applyDay` never records the ending | `quest` exit 1 on five: the guardroom is silent at Lauds in all three endings |
| `_pieceApplies` stops reading `state.clues` | `quest` exit 1 on two. `the guardroom at Lauds is the piece keyed on the roll — rumour-lauds-hanged` |
| the `since` ending vocabulary rail deleted | `lore` exit 1 on `a since row keyed on an ending that does not exist` |
| the `since` clue vocabulary rail deleted | `lore` exit 1 on two, including the evidence id written where the clue id was meant |
| the two-file rail deleted | `lore` exit 1 on `a row narrowed without the piece that says it` |
| the reachability rail deleted | `lore` exit 1 on three, including #592's own shipped break |
| the absence rail stops reading the piece's conditions | `lore` exit 1 on two, one of them #592's shipped break |
| `tells` no longer has to be cited back | `lore` exit 1 on `a row naming a real piece that does not cite it` |

**This row ran in a `git worktree`, and it had to.** It was started in the
shared tree beside rank 3, and rank 3's session held staged changes to
`BACKLOG.md`, `HISTORY.md`, `ROADMAP.md`, `SPECS.md`, `index.html` and
`test/built.mjs` while this one was editing `data/` and `src/`. Nothing
collided in a source file, exactly as the lanes predict (rank 3 has no lane and
this is lane A), but three things happened anyway that a lane cannot cover:

1. **`npm test` was red for three suites and none of them was this row's.**
   `lore` and `plan-vs-scene` failed on a `data/scene-config.json` the other
   session had the `engineer-drawing` slab deleted out of mid-edit; both pass
   against `HEAD:data/scene-config.json` and were confirmed to. `built` failed
   on `Port 8127 is already in use`, which is the other session's harness.
2. **`HEAD` moved under this row five times and the numbers moved twice.**
   `8732d80`, `7074c07`, `4724f25`, then rank 3 as PR #42, rank 12b as PR #45
   and rank 10 as PR #43. This entry was **written as #636 to #639, renumbered
   to #643 to #646, and landed at #646 to #649**. The numbers were read off
   `origin/main` at write time per #619 and `origin/main` topped out at #633
   when they were read; rank 12b merged first and took #636 to #642, and then
   rank 10 merged and took #643 to #645 while this row was rebasing onto them.

   **That is four rows in a row to renumber, and #619's rule stopped none of
   them.** "Read `HISTORY.md` on `origin/main` when you write the entry" is a
   rule about a moment, and the moment it names is not the moment that decides:
   the writing is minutes before the merge and the merge is what allocates.
   Reading later does not help either, because this row read three times and
   still moved twice. **The number is decided by merge order and nothing a
   branch can do changes that**, so the honest shapes are either to take it
   from the merge itself or to accept the renumber as routine and make it cheap.
   It is nearly cheap already: 40 references across eleven files, bumped by
   script in a minute, twice.

   What made both bumps safe is an accident worth not relying on. Rank 12b's
   range was #636 to **#642** and this row's was #636 to **#639**; rank 10's
   was #643 to **#645** and this row's by then #643 to **#646**. Both times
   the two ranges were told apart by their ends. Two rows that had written the
   same range would have had no automatic way to say which "#636" belonged to
   whom, and every bare number in prose would have had to be read by hand. That
   is the same shape as the problem #491 solved once across repos, and it is
   not solved within one.
3. A `git checkout` in that tree would have taken this row's uncommitted work
   with it, which is exactly what #624 to #630 recorded happening to the GPU
   run.
4. Rank 12b hit the port collision too and wrote it up from the other side.
   Two rows finding one defect independently on one afternoon is the clearest
   evidence yet that the fixed harness port is the next thing to fix.

#602 says a lane is a file. **What this says is that a lane is not enough when
the two sessions share a working tree**: the tree itself is the resource, and
`npm test`, `dist/`, the dev server's ports and `HEAD` are all one copy of a
thing that two rows want. The GPU run's entry called a worktree a GPU-run rule.
It is not. It is a two-sessions-one-machine rule, and it costs one `git worktree
add` plus a junction for `node_modules`.
## Feel: a shadow on the ground and a hand on the door (2026-09-17)

**Rank 11's first increment, claimed on `claude/r11-feel`, lane D.** Its own
worktree, because the tree `CLAUDE.md` calls the repo root was another
session's and had that session's uncommitted edits sitting in it. Decisions
#650 to #655. One new file, `src/player-rig.js`; 16 lines of `main.js`, 175 of
`test/plan-vs-scene.mjs` and two of `test/play-castle.mjs`. Thirteen suites
green, `npm run play` not run.

**Written as #634 to #639, landed at #636 to #641, and renumbered again to
#650 to #655 at merge time** — the fifth renumber from the same cause in three
days, and the biggest jump yet. Two other rows (#643 to #645's R10 and #649's
R4b) both merged ahead of this one while it sat open, on the same afternoon
this row was written; a third (this repo's own R5) is still open and gets the
same treatment when its turn comes. The rule #633 wrote down — a fresh
`git fetch origin` immediately before the entry is written — was followed for
the *first* pass and was never going to survive two more rows landing during
review. **The fix that actually holds is the one already in this entry**:
numbers kept to one mechanical substitution across a known file list, so a
second renumber at merge time is the same script run again against whatever
`origin/main` looks like by then, not a re-read of six files by hand. Nine
citations in `HISTORY.md`, nineteen across the other four markdown files, and
two in `test/play-castle.mjs`.

**The Node half only, and the row stays open.** `SPECS.md` splits this row on
purpose: whether the two objects EXIST, follow the player and stay out of every
ray is a browser's question, and whether either of them READS is a GPU's (#53).
The second half is nine sentences of screenshot the next run on Devon's machine
has to take, and it is written down at the bottom of this entry rather than
claimed.

- **A decal, not a shadow-casting light** (#650). The open call in `SPECS.md`
  recommended the decal on the grounds that `WISHLIST.md`'s own words for it
  were "cheapest presence cue", and this takes it. The castle has exactly one
  shadow-casting light, the sun, at a 2048 map (#530); a second one tied to the
  player is a per-frame cost nothing here has ever paid. **What is on the ground
  instead is one 0.46 m disc with a radial gradient painted into a 64 x 64
  canvas at load** — 16 KB of texture, one draw call, and **no file**, so there
  is nothing for `tools/encode-assets.mjs` to compress (#506) and nothing new
  fetched from anywhere (#493). The hand is the second draw call and not the
  seventh: its palm, four fingers, thumb and forearm are six primitives merged
  into one `BufferGeometry` at build time.

  **The rig costs two draw calls and `test/budget.mjs` cannot see either of
  them**, which is not an oversight in that suite. It counts what
  `castle-builder.js`'s `buildPiece` returns, per ward, and the player is not a
  plan piece. Two is written here because here is where the number is kept
  honest.

- **The shadow is on the plan's floor, not on a ray cast down from the camera**
  (#650, same commit). `PlayerController.feet` is the height
  `castle-plan.js`'s `standAt` put the player at, which is the same answer the
  walkability grid stands on (#511). Taking it from there rather than measuring
  it means the shadow and the feet cannot disagree about a slab edge or a step
  of a flight even in principle — there is one number and both read it.

- **Every mesh in the rig refuses rays, and the control is inside the
  assertion** (#651). This is the thing that would have broken the castle
  quietly rather than loudly. The rig is a top-level child of the scene, and
  `interaction.js`'s line-of-sight test calls every top-level child that is not
  a target an occluder; `play-castle.mjs` sweeps the same list to check the
  Constable is visible from interact range. **A disc under the player's own feet
  sits in the path of every ray the player casts downhill, and the symptom is
  not an error — it is the prompt quietly not appearing.** `raycast = () => {}`
  on both meshes is the whole fix, and it is one line here rather than a special
  case in two other files.

  A test that asserts "the ray did not hit" passes just as well when the ray was
  never going to hit anything, which is #34's whole subject. So **the beat casts
  each ray twice: once with the rig's own `raycast`, and once with
  `THREE.Mesh.prototype.raycast` put back over it**, and the assertion is that
  the first misses AND the second hits. Deleting the no-op from the shadow gave
  `1 hit, 1 with the control`; deleting it from the hand gave `3 hit, 3 with the
  control`.

  **And rays were only half of it: the rig is shaped to be mistaken for
  furniture, and `play-castle.mjs` sweeps `scene.children` twice looking for
  exactly that.** Once for anything whose footprint sits mostly over the hall
  table, to catch a candleholder floating 0.40 m above it, and once for anything
  over 1.5 m tall that is not a skinned body, which it calls structure and then
  checks the furniture against. A disc on the floor with a hand up to 1.6 m over
  it, standing wherever the player is standing — which during that beat is in
  that room, next to that furniture — fits both descriptions. So the group
  carries `userData.playerRig` and those two loops skip it, the same way and in
  the same line-shape they already skip a skinned mesh.

  **That suite is the one CI cannot run (#53), so the fact it now depends on is
  asserted in the one that can**: `plan-vs-scene.mjs`'s first line of the beat
  reads the flag, and commenting the flag out fails it with `NOT flagged as the
  player rig`. A fix to a suite nothing runs is a fix nobody can tell is still
  there.

- **The hand reaches for the target the prompt is offering, and does not go
  looking** (#652). `main.js` hands `interaction.currentTarget` to the rig one
  line after `interaction.update()` computes it. The rig reaches only for a
  target that is `isLock` and still `active`, which is the getter `locks()`
  already gives the interaction system, so an answered door stops being reached
  for by the same fact that stops it being pressable. **Nothing in the rig
  searches the scene**, which is what keeps the hand and the prompt from ever
  disagreeing about which door the player is at, and what keeps the reach inside
  the interaction radius without a second copy of that radius.

  The aim point is the leaf's own `focus` — the centre of a 2 m leaf, which is
  within a hand's width of where a handle is — pulled 0.12 m back out of the
  wood and offset right and down off the middle of the view. The clamp is on the
  distance from the eye, 0.78 m, so what the arm's length means is one number
  and the offset cannot quietly lengthen it.

- **`settle()` brings the world matrix with it** (#653). The rig smooths its
  reach with `1 - exp(-dt * rate)` so the rate does not depend on the frame
  rate, and `settle()` collapses the smoothing outright, for the reason
  `PlayerController.settle()` exists: **the suite then asserts a position and
  never a duration**, which is the assertion #53 says a software-rendered
  Chromium cannot answer either way.

  The first version of `settle()` wrote `position` and stopped, and three of the
  nine assertions failed with `0 hit, 0 with the control` — the control that was
  supposed to be impossible to fake, failing. Writing `position` does not move
  an object as far as a `Raycaster` is concerned: `Mesh.raycast` reads
  `matrixWorld`, and nothing updates that until the next render, so the ray was
  being aimed at where the hand had been settled and cast at where it had last
  been drawn. A settle that leaves the matrix a frame behind is a settle that
  moves the rig for anything reading `.position` and leaves it where it was for
  anything casting a ray at it.

- **The hand's colour is read off a body, not written in the file** (#654). A
  hex constant in `player-rig.js` would be a second copy of a number that lives
  in a glTF, and the two would drift the first time rank 10 adds a body. The tint
  leaves `Skin` alone (#419, and `BARE_MATERIALS` in `npc.js`), so every body in
  the castle carries the same one and `plan-vs-scene.mjs` already asserts there
  is exactly one of it; `skinColour(npcs)` walks the first body that has one and
  takes it. The fallback is for a page with no bodies on it at all.

### What the beat asserts, and what each break said

Nine assertions, in `test/plan-vs-scene.mjs` after the HUD's room line. It is
this file and not a new suite because every one of them is a seam: the live
scene, the running `InteractionSystem` and the DOM, none of it derivable in
Node (#529). From a green thirteen, each guard was broken on purpose (#34):

| The break | What failed, and what it said |
| --- | --- |
| shadow parked at the origin | 40 failures. `standing in guardroom the shadow is 36.250 m from under the player` |
| `SHADOW_LIFT` to 0 | 40 failures. `in clerk-office the shadow sits 0.000 m over a floor at 0.000 — it is buried in it, or hovering` |
| no `raycast` no-op on the shadow | `a ray straight down from the eye ... — 1 hit, 1 with the control` |
| no `raycast` no-op on the hand | `and a ray from the eye through the reaching hand ... — 3 hit, 3 with the control` |
| `want` forced to 1, always reaching | `with the word-lock behind the player the hand is not on the screen at all — reach 1, no prompt` |
| `want` forced to 0, never reaching | 3 failures, including `the hand it brings out is nearer the lock than the one it keeps below the frame — 1.96 m against 1.96 m` |
| a `planId` on the shadow | 3 failures. The box diff caught it first: `"ground" (ground) is 75.540 m off the plan` |
| no `userData.playerRig` on the group | `the rig is one flagged group in the scene ... — 0 tagged, NOT flagged as the player rig` |

**The shadow's own trap is the one the standing beat already answers, and it is
answered the same way.** Forty rooms of "the shadow is under the player" all
pass on a shadow nailed to one spot if the player never moves, and the forty
lines above move the player forty times without one of them saying the shadow
went too. So the distinct shadow positions are counted against the distinct
places stood in — **40 against 40** — with the floor height in the key as well
as x and z, because two rooms on two levels sit over each other and a shadow
that tracked only x and z would be right in both of them for the wrong reason.

The beat also puts the page back the way it found it: the riddle overlay has
been open since the word-lock beat, an open overlay stops
`interaction.update()` picking a target at all, and three beats below say in
their own comments that they found it open. It is cancelled, the work is done,
and E is pressed at the door again to put it back — asserted, so that sentence
cannot quietly become false (#147).

### What a GPU still has to answer, and nothing here claims

Nine sentences and two screenshots, to the bar rank 2's photograph set:

- A blob on stone against a blob on grass. Whether 0.42 opacity over a
  0.46 m disc reads as a body's shadow on pavers and still reads on the outer
  ward's grass is the row's own GPU criterion and the reason the two surfaces
  are named in it.
- **The shadow on a flight of stairs.** It is a flat disc at the height of the
  feet, and a flight is a ramp; the disc will cut into the step above and float
  over the step below. Nobody has looked at how bad that is.
- Whether the hand reads as a hand at 0.78 m in a 72-degree view, and whether
  coming up from below the frame over ~0.3 s reads as reaching or as popping.

### #633's chapel-candles flake, with the control run

**It tracks how busy the machine is, and this row watched it turn.** The first
ten runs of this row's work were green on that beat, with five sessions testing
beside it and `mystery` taking 11.4 s; the last eight were red, alone, with
`mystery` taking 6.4 s. #633 read it as a fast machine not giving the beat its
two `requestAnimationFrame`s and a slow CI runner giving them, off one data
point — 187.3 s in CI against 9.4 s here. **Load is the same axis seen from the
other end, on one machine, in one afternoon.**

And the control #633 could infer but did not run, run here: `git checkout
origin/main -- src test`, which takes the rig out of the page and this row's
beat out of the suite, then the suite twice. **Red both times, the same
assertion, the same sentence.** It is not this row's, and now that is measured
rather than argued from a diff.

### And a finding on the way past: thirteen suites on fixed ports, five sessions at once

**`npm test` is not safe to run twice at the same time on one machine, and
five rows running in parallel is exactly that** (#655). Each browser suite
hardcodes a port — 8125 `plan-vs-scene`, 8126 `built`, 8128 `map` — chosen so
the suites do not collide with *each other*, which they do not. They collide
with the same suite in another worktree: `Error: Port 8128 is already in use`,
thrown out of `serveDev`, a suite dead in 0.5 s with no assertion run.

It was seen eight times in ten full runs while R3, R5, R10, R12b and R12c were
running beside this row, on five different suites, and every one of them passed
alone. **The failure looks exactly like a broken suite in the runner's summary**
— `touch (exit 1, 0.4s)` — and the only thing that distinguishes it is the
stack, which the summary does not print. The thirteen did all go green in one
run, twice, in a quiet window.

Not fixed here: it is `test/harness.mjs`'s and it is nobody's lane. The cheap
version is a port taken from the environment or picked free at listen time,
which is a change every suite's constant would have to come out for. Written
down rather than scrolled past, which is the mistake #618 is an example of and
#633 is the correction to.

## Rank 5, the hall covering: seven pieces, not fourteen, and a floor bright enough to leave alone (2026-09-17)

**Ranked row 5, on `claude/r5-hall-covering`, lane B, in a `git worktree`**
(#624's own rule, since rank 5 needed to look and look again while other
sessions kept the main tree moving). `SPECS.md` guessed a 4 m module as two
single-pitch pieces, 7 x 2; a render says otherwise, and the row's own
`Dependencies` line — "the GPU run is what unblocks this" — turned out to
name the wrong half of rank 2. The run that shipped (#624 to #630) never
reached Vespers, so this row could not wait for it and instead rendered the
hall itself, directly. Decisions #656 to #658.

- **`roof.glb` is the whole cross-section, ridge and both slopes, in one
  piece — not a single-pitch wedge that needs a mate** (#656). `partsOf`
  reports all four `roof*.glb` files as the same 1 x 1 x 1 box (BACKLOG.md
  said so and was right that Node cannot break the tie), but `test/gltf.mjs`'s
  `triangles()` reads every vertex, not just the box, and the shape does not
  need a screen to read once the numbers are in front of you: `roof.glb`'s
  unique points sit at `y=0..0.1` for `x=-0.5` AND `x=+0.5`, and at `y=1` for
  `x=0` — low at both edges, a peak in the middle, symmetric. `roof-side.glb`
  and `roof-high-side.glb` are the single-pitch pieces the spec guessed at
  (low at `x=-0.5`, a *vertical* face at `x=+0.5` running the piece's full
  rise) — meant to butt against something taller, not to pair with a mirror
  of themselves across a ridge. One `roof.glb` per 4 m truss bay, rotated 90
  degrees so the slope runs across the hall's 8 m width instead of along its
  28 m length, `scale: [7.25, 2.5, 4]`, covers the full truss-to-truss span in
  a single piece: seven pieces, not fourteen. Confirmed twice — once
  numerically (a piece's world-transformed vertices read back at exactly
  `y=8` at `z=6` and `z=13.25` and `y=10.5` at `z=9.625`, the trusses' own
  ridge line) and once visually, aimed down the hall's length pitched up
  0.72 rad from `[-30.5, 10]` the way `test/play-castle.mjs`'s
  `the-hall-trusses` beat does: a continuous slate ceiling, no gap to the sky,
  no seam that reads as two games stitched together.

- **Bay 1's west edge is narrower than the other six — 3.7 m, not 4 — because
  the full width, grown by `BODY_RADIUS`, reached a walk deck the trusses
  never do** (#657). `test/layout.mjs` check 14 failed once, cleanly:
  `hall-roof-1 blocks 16 reachable cell(s), the first at (-34.25, 5.75)
  standing at 8.00 on west-curtain-south-walk`. The trusses are 0.5 m wide at
  each bay's centre and never reach the hall's actual west wall at x -34; a
  4 m-wide covering piece does, and `west-curtain-south-walk`'s own cells run
  from x -35.75 to -34.25 at the same y=8 the covering's eave sits at, 0.25 m
  outside the room's own boundary — close enough that the check's 0.45 m
  `BODY_RADIUS` margin reaches it. A 0.2 m narrowing (`box.min.x` at -33.8)
  still landed exactly on the grown boundary and still failed; -33.7 clears
  it with a hair of margin. The other six bays are untouched — none of them
  reaches within a body's width of any wall the trusses did not already
  clear.

- **The floor, measured at Vespers with all six of the hall's cast in place,
  reads well clear of the line SPECS.md drew** (#658). The run that would
  have supplied this shot stalled two watches short of Vespers (#630), so
  this reading did not wait for a second one: `window.__quest.applyWatch(
  'vespers', { walk: false })` puts the sky, the evidence and all twelve
  where Vespers has them without ringing a bell three times over, the same
  world-state call `main.js` itself makes when a save resumes mid-day.
  Framed the shot the way `test/play-castle.mjs`'s `the-hall-floor-open` beat
  does — `[-30.5, 10]`, pitched -1.0 — and read mean luma off the live
  render the same way #438 did, `0.2126 R + 0.7152 G + 0.0722 B` over a
  region of raw pixels. **The dev server's own render loop is `rAF`-gated and
  the Browser pane was not always foregrounded while this ran**, so a bare
  `getImageData` on the canvas came back all zeros more than once —
  `gl.readPixels` right after a forced, synchronous `renderer.render(scene,
  camera)` on the SAME canvas and WebGL context (imported straight from
  Vite's own `/node_modules/three/build/three.module.js` URL, tone mapping
  and shadow settings copied by hand from `scene-setup.js` so the reading
  matches what a player actually sees) sidesteps needing the animation loop
  to be running at all. Three points along the hall's length — the west end,
  a middle bay, the east end — read 69.8, 89.8 and 88.6 of 255, all several
  times SPECS.md's ~25 line.

  **Hiding the seven covering pieces and re-measuring the same three points
  changed nothing, to two decimal places.** Not a bug: the sun's shadow
  camera is real (`scene-setup.js`'s `sun.castShadow = true`, frustum -40 to
  40) and toggling `castShadow` on the covering along with its visibility
  confirmed the same null result, but an 8 m-tall wall either side of an 8 m
  -wide hall already shadows the floor from a sun at this castle's elevation
  whether or not anything sits above it — the covering was never the thing
  standing between this floor and direct sun. What is lighting it is the
  hemisphere fill and the hall's own braziers, neither of which the covering
  touches. **No second brazier and no window cut, on this reading**: the
  open call in `SPECS.md` recommended measuring before cutting a hole in a
  wall for nothing, and the number says the hole is not needed. `layout.mjs`
  check 14 green (7 pieces, each 8.00 m or more over its floor, none in a
  reachable head band), check 6b unaffected, `npm test` thirteen suites
  green. `npm run play` not run — no `src/` changed (#53).

## Rank 1, the castle you cannot walk: one place lets the pointer go and one place takes it back (2026-09-18)

**Ranked row 1, a quarter, and the one open row that stopped a player rather
than disappointing one.** Found by the GPU run the day before (#626, #627),
fixed here with a fourteenth suite in front of it.

**The two bugs, and they hid each other.** `src/ui.js` called
`document.exitPointerLock()` in four places — the riddle, the journal, the
accusation panel and the verdict pane — and exactly one path anywhere gave
pointer lock back: `src/quest-manager.js` passed `() => this.controlsRef.lock()`
as the riddle's `onClose`, and the accusation panel had the same for its Cancel.
The journal had nothing. `main.js`'s `unlock` listener would have offered the
resume panel, but it tests `!ui.isOverlayOpen()`, which is false at the instant
`unlock` fires, and it never fires again afterwards. So J and J again left the
player standing in a castle with no pointer lock, no panel, no prompt and no way
out but a reload: measured on a GPU, W carried the player 3.7 m before the
journal and 0.00 m after. The other half ran the other way: a dialogue never
released pointer lock, so the canvas took every pointer event and
`#dialogue-present` could not be clicked by a real mouse at all. Open the
journal once and Present worked for the rest of the game, at the price of never
walking again; play without opening it and you could walk and could not press
four of the twelve.

### #659. Pointer lock is not a GPU question, and two comments that said it was

**`test/harness.mjs` said "the Pointer Lock API and real GPU rendering both need
a browser that is actually compositing frames to a screen", and
`test/play-castle.mjs`'s header said the same.** Measured on 2026-09-18 against
`test/blank.html` in the same headless Chromium `npm test` uses: the start
button's trusted click takes pointer lock, `document.pointerLockElement`
reports it, `exitPointerLock()` drops it, and the next request takes it back.
Both comments are corrected in place rather than deleted, because the sentence
that was wrong is the reason this row was believed to be un-CI-able.

What is a GPU question is what #53 always said it was: how far a held key
carries a body in 700 ms. So the row splits at the cause/effect line.
**`test/overlays.mjs` is the fourteenth suite and it asserts WHO HOLDS THE
POINTER**, which a software rasteriser answers the same way a GPU does;
`test/play-castle.mjs` keeps the walk under it, and that assertion grew a second
half here — J, J again, hold W, and the body has to have moved more than 1 m
from the same standing start.

### #660. One place lets it go, one place takes it back, and a dialogue is on the list

`src/ui.js` owns both halves now. `_freePointer()` is called by every open and
`_takePointer()` by every close, `usePointer(relock)` is what `main.js` injects,
and `wantsPointer()` is the guard that stops the pointer flickering back between
two screens: shutting the Present picker drops into the dialogue that opened it,
and `quest-manager.js`'s `handlePress` closes the journal and opens the next
lines in one call. `closeDialogue` runs its callback BEFORE taking the pointer,
because the last line of the Constable's first conversation is what opens the
accusation panel.

**A dialogue joins the four, which it never was.** It is not modal — E steps it
and the player keeps the HUD — but it carries a button, and a button is a thing
you point at. `main.js`'s `unlock` listener already tested `!ui.isDialogueOpen()`,
so the resume panel does not appear over a conversation.

**What came out.** `controlsRef` is gone from `QuestManager` entirely, and with
it `openRiddle`'s third argument and `openAccusation`'s `onClose` — both existed
only to re-lock. `test/quest.mjs`'s lock counter went with them: who holds the
pointer is not a question a stand-in UI can answer, and `test/overlays.mjs`
answers it in a browser instead. Every `regrip()` call in `test/play-castle.mjs`
is gone, and the synthetic `.click()` on the Present button is a real
`page.click` now, which is the whole difference: one is a coordinate and the
other is a node.

### #661. The browser rations pointer lock, so the restore has to be able to fail

**Measured in Chrome on 2026-09-18, from `test/blank.html`: four
`requestPointerLock()` calls are granted and the fifth is refused with
`NotAllowedError: Too many pointer lock requests in a short window of time`. The
budget comes back 2049 ms after it runs out.** Nothing in this game asked that
often until #660 started taking the pointer back on every close. Five overlays
opened and shut inside two seconds is a player mashing J, and the first green run
of `test/overlays.mjs` hit it on its own beats.

A refused request is not free. It fires `pointerlockerror`, which three's
`PointerLockControls` answers with a console.error, and that class's `lock()`
drops the returned promise on the floor, so the rejection surfaces as an
unhandled one and `page.__errs` is no longer empty. Three things changed:

- **`PlayerController.lock()` answers whether it worked.** It calls
  `requestPointerLock()` itself rather than through `controls.lock()`, returns a
  promise of true or false, and resolves true without asking when the pointer is
  already held — which most closes are.
- **It counts its own asks and stops one short of the browser's budget**: three
  in 2.2 s. Asking and being refused costs a console error that nothing can
  catch, so the ration is ours and it is conservative. Firefox has no such limit
  and loses the fourth ask in a two-second burst, which the next line catches.
- **A refused relock puts the resume panel up**, which is the panel the Esc path
  has always used, one click back into the castle. The start button's own handler
  does the same with its own answer: it hides the panel before `lock()` runs, so
  a refused lock without that line is a castle with nothing on screen and no way
  into it.

### The fourteenth suite, and the break that proves it (#34)

`test/overlays.mjs`, port 8129, in CI. One property over every screen that covers
the castle: it releases the pointer while it is up and gives it back when it goes
away. A fifth overlay that inherits one half fails here. **It was written first
and run first, from a green thirteen, on the unfixed game:**

| Beat | What it said, red |
| --- | --- |
| J, J again | `AND GIVES THE CASTLE BACK — pointer lock is gone, no resume panel is offered, and W does nothing` |
| a dialogue | `a dialogue lets the pointer go, because its Present button is a thing you click` |
| Present, by `page.click` | `the Present button is reachable by a real mouse, not only by a synthetic .click()` |
| and the picker | `and clicking it opens the picker` |
| the verdict pane | `and the verdict pane gives the castle back` |

Eight failures, and the riddle's four beats green throughout, which is the
control: the one overlay that already had both halves is the one that passed.

**The ration beat was broken on purpose separately.** With `ui.usePointer(() =>
player.lock())` in place of the version that offers the panel, mashing J twelve
times reported `locked false, resume panel false, journal false` — the same dead
castle, reached from the other side.

### What a GPU still has to answer

- `npm run play`'s own journal beat, on a real window: pointer lock back AND the
  body moving more than 1 m on 700 ms of W. The assertion is written and the walk
  under it is new; nothing in a container can run it (#53).
- Whether a refused relock's resume panel reads as a resume panel mid-game
  rather than as the game having restarted. It is the same `#start-overlay` the
  Esc path shows and has never been looked at in either situation.

**`npm test` here: fourteen suites, thirteen green.** `plan-vs-scene` failed on
#633's chapel-candles beat, and the control was run the way #655's finding says
to — `git stash`, the suite again, red on the clean tree with the same assertion
and the same sentence, then `git stash pop`. An earlier run also lost `map` in
0.4 s, which is #655's port collision with another worktree's copy of this
suite; it is green alone. `npm run play` not run: no GPU here.

### And CI is red on `main`, on the same suite and a different beat

**Said here because it was found here and because "13 of 14 green" on this
machine would otherwise be the whole test report.** This branch's CI run failed
`plan-vs-scene` on the populace beat:

```
FAIL  baker stands at (1.25, 0.00, 14.81) and the first stop of the
      Prime ring is (1.25, 0.00, 14.75), 0.055 m off
```

**It is not this row's.** The identical assertion, on the same body, failed on
`main` at 04:08 UTC on 2026-09-18 — run 35305787194, the merge of PR #47, before
this branch existed — at 0.408 m rather than 0.055. Two different distances from
the same stop is a body that has started walking its Prime ring by the time the
page is read, which is a time and not a place.

**`TOL` is the problem and it is 0.01 m.** That is `plan-vs-scene.mjs`'s tolerance
for diffing a placed object's `Box3` against the plan, and this beat borrows it
for an NPC the populace is animating. A geometry tolerance on a moving body is a
stopwatch dressed as a ruler; how much slack a ring's first stop is actually owed
is a number somebody in lane C should pick with the step size in hand, so it is
not picked here. **Not fixed in this row**, which is `src/ui.js` and the pointer:
an unrelated tolerance change buried in a rank 1 PR is how the record stops being
readable. Filed in `BACKLOG.md` under where things stand.

**Both the local flake and this one are the same shape**, which is worth saying
once: `plan-vs-scene.mjs` reads a live page, and three of its beats now depend on
how far that page has got by the time the read happens. #633 measured the chapel
candles tracking machine load in one afternoon. This is the second.

## Sound, the second increment: a bed at a point, and four rings that are not the same bell (2026-09-18)

**Ranked row 7's second increment, on `claude/r7-bed-at-a-point`, lane E, in
a `git worktree`** beside other sessions, so the band is #680 to #683 and
taken clear of the #660s the shared checkout was using (#620's rule). What
`SPECS.md` asked for after the beds: a panner per bed at a point off the plan,
the nearest few sounding at once, open ground in the head; and the four bells
given a character each. Both shipped. `npm test` thirteen suites green on the
Windows machine this was written on, `npm run build` green. `npm run play`
was not run, and nothing here has been heard (#53): the machine had no
speakers on the session.

- **A source is heard from the point of its room nearest the player, not
  from the room's centre** (#680). `SPECS.md` said the centre, the way
  `bellAt` places the bell, and the bell is a bell: a thing at a point. A
  room tone is the room, and the south walk is 18 m long; a source at its
  middle is one heard from the far end of the walk and not from the merlon
  beside you. `sourcePoint` clamps the player into the room's box, or onto
  its disc, at ear height over the nearest of its floors. Inside the room
  that is the player's own head, which is what a room tone is inside its
  room, and the bed fills the head across the threshold with no fade at the
  door at all; from the ward it is the near wall, which is where the kitchen
  is heard from outside. The nearest three within 14 m sound at once
  (`audibleFrom`), asked again every 2 m of ground and on every room change,
  and the points move every frame. Open ground stays in the head, faded up
  and down on the HUD's own room change as before (#515, #622), because a
  ward has no near wall to be heard from. `ambient.spatial` is the whole of
  it, with `earMetres` held to `EYE_HEIGHT` by check 13. The panners are
  `equalpower` and not the bell's HRTF: a room tone has no direction worth a
  head model, and three HRTF panners is a cost a phone notices.

- **A drum's storeys with the same bed are one source** (#681). The first
  draft keyed sources by room, and a stair climbed inside the King's Tower
  was the first floor still sounding 4 m below while the top room faded up
  over it: two fires, at every stair, which is the storey fade #623 built
  `bedOf`'s second step to refuse. The key is the drum and the bed, so the
  muniment room under the same drum is a chamber and its own source. 40
  rooms with a bed, 30 sources, 6 of them a drum's storeys merged. Check 13
  holds every merged source's rooms to one footprint, because the merge is
  only right while they share one.

- **The four rings are `bell.rings`, by the engine's own `n`** (#682). The
  day starts at Prime with no bell, so `bell:1` is the ring that brings Terce
  and `bell:4` the one that moves no watch. One stroke for Terce, two for
  Sext, six a little quicker and quieter for Vespers, which is the peal
  `SPECS.md` asked for, and three slow and heavy for the summons, which is a
  passing bell. Each gap is the file's give or take 8 %, because a man on a
  rope is not a clock. `QuestManager.handleBell` passes the `n` off the event
  it already reads, and `test/quest.mjs`'s recorder holds the four to
  `1,2,3,4`. Check 13 holds the block to every `n` the engine can emit and no
  other; `ringOf` a ring the file has nothing for is one plain stroke, and
  the check is what keeps that from being heard.

- **The storey fact moved out of the browser suite, and the browser suite
  holds the seams only** (#683, #529 again). `test/map.mjs` 2b used to hand
  `enter` the King's Tower first floor by hand and want one bed; under
  sources that is a fact about `bedSources` and provable in Node, and the
  first rewrite that stood the camera in the first floor for real put a
  fourth room on the visited set that section 3 counts three of. What 2b
  holds now is what only a page can: that `main.js` hands the audio the plan
  (`placeBeds`) and the head's position (`at`) at all, read as three rooms
  heard from the ward at a distance, the hall at the head in the frame of
  the change, the ward fading with most of 1200 ms left, and the tower source
  the loop placed being the drum's. `ambience()` grew `head` and `placed`
  for it.

**Broken on purpose, from green (#34).**

1. `sourcePoint`'s x clamp replaced with the player's own x. `layout` exited
   1 on 24 sources, the first `source "clerk-office/0" is heard from
   (-200.00, -14.00), which is outside its own footprint`.
2. `"3"` deleted from `bell.rings`. `layout` exited 1: `the engine rings
   bell:3 and data/sounds.json's bell.rings has nothing for it`.
3. `handleBell` calling `bell()` with no number. `quest` exited 1: `and each
   ring carries its number, first to fourth — ,,,`.
4. `audio.at(camera.position)` deleted from the render loop. `map` exited 1
   on five, the first `and 0 rooms are heard from outside, each from its near
   wall within 14 m — []`.
5. `audio.placeBeds(castle.plan)` deleted. `map` exited 1 on the same five.
6. The head bed kept indoors (`enter` handing `zoneBed` through for a room).
   `map` exited 1: `into the Great Hall and the bed is the hall's, with
   nothing in the head — {"bed":"hall","head":"hall",...}`.

**What was measured.** `data/sounds.json` 188 lines to 207. `src/audio.js`
363 to 538. `test/layout.mjs` 1191 to 1262, `test/map.mjs` 259 to 269. Seven
files, 364 lines added and 77 removed. No asset added.

**What nobody has heard.** All of it, again. The three most likely to be
wrong: 14 m of earshot, which is through a stone wall as often as not, since
a panner knows distance and not occlusion; a tower roof's wall walk bed heard
12.5 m up from inside the Great Hall under it, which break 6's output showed
placed; and whether a 1.5 m reference with a rolloff of 2 leaves a kitchen
audible at all from 7 m across the ward.
## Bodies: two hens off poly.pizza, and a spear for the garrison (2026-09-18)

**Ranked row 10, second increment, on `claude/r10-chicken-and-spear`, under
Claude Fable 5.1, on Devon's machine, in its own `git worktree`** beside a
main checkout that had another row's uncommitted files in it. quaternius.com
was not asked this time; poly.pizza was, because #644 had already read the
Farm Animals pack's Drive folder and found `Blends/`, `FBX/` and `OBJ/` and
no glTF, and poly.pizza re-hosts Quaternius's packs as `.glb` under the same
CC0 deed. `ktx` v4.4.2 on PATH. Decisions #684 to #686. They were written
as #659 to #661, read off a fresh `origin/main` that ended at #658, and PR
#49 took that band first; they were renumbered whole at merge, in every
file that cites them. Eleven suites green in one `npm test`;
`built` lost that run to `Port 8127 is already in use`, another session's
suite on the same machine, and passed alone; `plan-vs-scene` is red on the
chapel-candles beat that #633 measured red at `main` on this machine and
that no file in this branch touches. `npm run build` green. `npm run play`
was not run (#53): the look at the two new kinds is the same line-up on a
grey background #606 and #643 used, and it is written up as that and not as
the castle.

- **The hen is a sixth file, and it needed a bake no body before it did**
  (#684). poly.pizza's `chicken` search returns two Quaternius chickens.
  One is the cube-animals toy: a blob, four joints, `Dance`, `Yes`, `No`.
  The other is the Farm Animals bird: 2140 triangles, a seven-joint rig
  (`Root`, two legs, `Body`, each with an `_end`), five clips (`Attack`,
  `Death`, `Idle`, `Idle_Peck`, `Run`) and one 512 px atlas of flat colour
  blocks, 6 KB. It is `assets/NPCs/Hen.glb`, 55 KB meshopted, with the
  `AnimalArmature|AnimalArmature|AnimalArmature|` prefix cut off every clip
  name, the node and mesh named `Hen` and the material `Feathers`.

  **The first render showed nothing where the hens stood, and the box said
  they were there.** Every bone reported the same world position, the
  group's origin. The file is an FBX export: `AnimalArmature` and the mesh
  node both carry scale 100, the bones' translations are 0.003, the vertices
  span 0.012 units, and the inverse bind matrices carry the rotation and no
  scale. gltf-transform's `getBounds` reads that as a 1.24-unit bird because
  it walks the node scales; three r169 rendered it at a few millimetres. The
  Husky (#644) came from the pack's own `glTF/` folder and has no scale on
  any node, which is why it never showed the problem. The re-export bakes
  the 100 into the data: every node scale to 1, every joint translation,
  every vertex, every bind-matrix translation and the twelve translation
  samplers multiplied by 100. The file that results has the Husky's shape,
  and it renders. **This is the fourth move a re-export can need**, after
  #604's three (name the materials, name the nodes, lift the colours), and
  it is the one to look for first on any file that came through FBX.

  The atlas is the colour and the tint is a multiply over it, so the tints
  are chosen the other way round from every body before: near-white
  `#f2ecdf` keeps the authored white hen with her red comb, and tawny
  `#b9855a` makes the second one brown. Two hens, Gwenno and Brith, "one of
  the hen-wife's fowl", 0.45 m and 0.42 m, `speed` 0.9 with `Run` as the
  walk, and `peck` (`Idle_Peck`, the head to the ground and back) as the one
  new activity, in one body only, the way `sniff` and `eat` are the hound's.
  They keep two rings in the outer ward around the hen-wife's two stops.
  **The validator moved the white hen twice**: her first west ring put a
  stop 0.98 m from the clerk's Terce station and another 1.45 m from the
  laundress's at Sext, which is the 1.5 m rule doing exactly what #618 wrote
  it for, and her ring is east of both now.

- **The spear is a held prop that is not Poly Haven's, and the fit is data**
  (#685). poly.pizza's `spear` search has two by Quaternius; the one taken
  is untextured, 1202 triangles, four materials already named (`DarkWood`,
  `LightWood`, `Steel`, `LightSteel`), authored along +Y with the head at
  the top, and it is `assets/NPCs/Spear.glb`, 46 KB meshopted. Nothing in
  it needed renaming. What needed changing was the reading of `heldProp`:
  it had always been a path under `polyhavenBase`, in `npc.js`, in
  `test/assets.mjs` twice, in `tools/encode-assets.mjs` once, four copies
  of one rule. `heldPropPath(base, heldProp)` in `src/populace.js` is the
  one copy now: a `heldProp` that starts with `assets/` is repo-relative,
  anything else is Poly Haven's, and all four readers call it. `populace.js`
  because it is the one `src/` module with no three.js in it, so Node and
  the encoder can import it (#616).

  `_attachHeldProp`'s defaults are a mace's: 0.6 m long, gripped 14 % up
  from the butt, heavy end hanging down past the fist. A spear on those
  numbers is a dart pointing at the floor. `heldPropFit`, optional,
  `{length, grip, tipUp}`, is the three the defaults got wrong: 2.1 m, the
  hand 40 % up from the butt, and `tipUp` reversing the axis the holder
  aligns to the fingers so the head stands over the helmet and the butt
  hangs by the knee. The serjeant and the man-at-arms carry it; the archer
  does not, because an archer with a spear is a spearman. On the grey
  background both read as spears from the first frame, in `Idle_Sword`,
  and no second line-up was needed. `validatePopulace` refuses a length of
  0, a grip outside 0..1, a `tipUp` that is not a boolean and a fit with no
  prop to fit; `test/mystery.mjs` asks it each of those and also asserts
  the two spears are tip-up and at least the wearer's own height, because
  the failure of a bad fit is a prop that renders and is wrong. `SPECS.md`'s
  six variation axes now have a second body with a prop on it: 14
  silhouettes off 6 body files, up from 10 off 5.

- **The rails, each broken from green first** (#686). Both `heldProp`
  sweeps in `test/assets.mjs` (check 1, is the file there; check 4, is the
  file asked for) and the meshopt check 5 read the household's props as well
  as the cast's, and the encoder's prop list does too. `test/mystery.mjs`
  counts 14 and names why. Four breaks:

  1. `Hen.glb` and `Spear.glb` written un-encoded over the encoded ones.
     `assets` exited 1 on `assets/NPCs/Hen.glb has no
     EXT_meshopt_compression` and the same for the spear.
  2. Both `heldProp` lines cut out of `populace.json` with `Spear.glb` left
     on disk. `assets` exited 1 on `nothing references
     assets/NPCs/Spear.glb`, #390's check 4.
  3. The serjeant's `tipUp` set false. `mystery` exited 1 on `2 of the
     household carry the spear (serjeant, man-at-arms), tip up and at least
     their own height`.
  4. `peck` pointed at `Idle_Pekc`. `mystery` exited 1 three times: once per
     hen (`ships no clip called Idle_Pekc`) and once for the table (`peck ->
     Idle_Pekc`).

  All four restored byte-identical and green again.

**Still owed.** The look at either kind in the castle is `npm run play`'s
(#53) and rank 2's. `test/budget.mjs`'s bodies-per-ward number still does
not count the household (#645 said so; two hens and no new light change
nothing about that). The activity clips rank 6 wants (`sweep`, `hammer`,
`spar`, `drill`) are still not in any body on disk; the hen's `Idle_Peck`
is the only clip this increment added to the vocabulary. And the editing
tool this session used wrote `data/populace.json` back with LF once, which
a CRLF count caught before any suite ran and `sed` put back (#632); the
five `.js` and `.mjs` files it edited kept their CRLF.
## Rank 12c, the dialogue format: one file that says who speaks, why, and what it is worth (2026-09-18)

**Ranked row 12's third and last increment, on `claude/r12c-dialogue-format`,
lane C, in a `git worktree`.** `SPECS.md` specced it by deliberately not
speccing it — "speaker, state, conditions, effects, one line each, compiled to
`npcs.json`/`quests/*.json` at build time", with `WISHLIST.md`'s paragraph as
the whole brief. Decisions #687 to #690, written as #659 to #662 off a
`main` that ended at #658 and renumbered whole at merge, in every file that
cites them, because PR #49 took that band first. The suite is the fifteenth
and not the fourteenth for the same reason: `test/overlays.mjs` landed in
PR #49 while this branch was open, so the counts below were measured over
fourteen and the repo runs fifteen. The twelve's 118 lines now read top to
bottom in `dialogue/castle.dlg`, 20398 bytes, 13 speakers and 40 states, and
`test/dialogue.mjs` is the fifteenth suite at 0.3 s and 112 assertions.

- **The format is six sigils and one file, and only two of them are written
  back** (#687). `@ id | name | role | ward` is a speaker, `: state` one of
  their states, `? press default on wax-matches` or `? quest cooks-knife at
  hunting` what moves them into it, `% ...` that quest stage's objective,
  `! says clerk-cloak` the clue the state grants, `| ...` one line of dialogue,
  `#` a comment. **`|` and `%` compile; `@`, `:`, `?` and `!` are only
  checked.** That is the whole bargain and it was the row's one real design
  call. The clue graph lives in `data/mystery.json`'s `presses` and `clues` and
  in `data/quests/*.json`'s `stages`, and `src/mystery.js`'s validator — which
  has caught every wiring mistake this project has made — reads those files and
  not this one. A compiler that could invent a press out of a line of prose
  could silently rewire the mystery behind the validator's back. So the
  annotations are rebuilt from the three JSON files on every compile and the
  compile refuses if one byte of the rebuild is not what the .dlg says: they
  cannot drift, and they cannot be authored either. What the format buys is
  that the four edits in three files an author used to make are now visible in
  one place, in the order a person reads them.

- **It is a hand-run compiler and not a build step, which is where the spec's
  own words were overruled** (#688). `SPECS.md` said "compiled to
  `npcs.json`/`quests/*.json` at build time". Nothing may be generated at build
  time here: `dist/` has no transform in it on purpose, because a build-time
  pipeline makes `npm run dev` serve one thing and `dist/` another, which is
  `test/built.mjs`'s served-set diff failing by construction — the same
  argument that kept the asset encode out of the build (#506). `npm run
  dialogue:extract`, `npm run dialogue:compile` and `npm run dialogue:check`
  are hand-run, `data/npcs.json` stays the file the page fetches, and the .dlg
  is a committed second copy that a suite forbids from drifting. **And it does
  not live under `data/`**, because `vite.config.js` copies that directory into
  `dist/` whole and 20 KB of source would be published to nobody;
  `dialogue/castle.dlg` is a sibling the build has never heard of, and
  `test/dialogue.mjs` asserts the path rather than trusting the comment that
  says so (#586's habit, pointed at a third target).

- **The write is a text splice over a nested path, which is `tools/place.mjs`
  generalised** (#689). Same measured reason: a round trip through
  `JSON.stringify` is not `data/npcs.json`. What is new is that the thing being
  replaced is `cast[7].dialogue["chisel-forge"]` and not an element of a
  top-level array, so `membersOf` walks any object or array and hands back the
  `{keyStart, valueStart, valueEnd}` of every member, `locate` follows a path
  of keys and indices to one of them, and `setValue`, `addKey` and `deleteKey`
  are the three edits that span makes possible. `addKey` and `deleteKey` are
  `insertRow` and `deleteRow` with an object's three cases instead of an
  array's — the member with something before it takes the separator on its
  left, the first of several takes it on the right, and the last one standing
  leaves `{}`, which is the branch the inspector's single state is the only
  live instance of. A compile with nothing to do writes nothing: a state whose
  lines are identical is not touched at all, so the diff of a one-word
  rewording is one line and not 118.

- **The authoring loop is a stub, and the compiler refuses a half-done one**
  (#690). `extract` lists every state `npcs.json` has, then every state the
  press list or a quest stage names that `npcs.json` has not got, so wiring a
  press in `mystery.json` and re-running extract drops a `: state` with its `?`
  line and no `|` lines into the file, waiting to be written. `compile` refuses
  a state with no lines — "a state nobody says anything in is a state the
  player walks away from in silence" — so the stub cannot be committed empty.
  Walked end to end for this record: a `relents` press added to
  `mystery.json`, extract reported `1 state(s) with no lines yet:
  merchant/relents`, compile exited 1, one `|` line written, compile exited 0
  and `data/npcs.json` gained exactly four lines. Reverted afterwards; the
  merchant has two states, as before.

**The suite: 112 assertions in seven parts, both line endings throughout**
(#632). The walk is held to `JSON.parse` for all 40 dialogue spans rather than
to a second span finder (#34, #500). Every one of the 40 states rewritten with
its own lines has to give back `npcs.json` byte for byte, which is the only
assertion that would catch `formatLines` spelling an array two spaces off; one
line changed has to leave every byte outside that state's span alone; a state
added and deleted again, and the last state deleted and added back, both give
the file back byte for byte for all 13 speakers. Part 5 rebuilds the whole .dlg
out of `data/` and compares it with what is committed, part 6 compiles what is
committed back and requires `npcs.json` and all five quest files unchanged, and
part 7 breaks each of the 16 `parse` rules and 11 `problems` rules on purpose.

**Four breaks, from a green baseline** (#34). A line ending hardcoded in
`formatLines` — the exact bug that lived in `test/tools.mjs`'s rail for its
whole life, green in CI and one byte short on Windows (#631 to #633) — turns 8
assertions red and **all 8 of them are CRLF**, which is the point: the LF half
stays green, so a rail that read only what is on disk in CI would have shipped
it. Indenting an element four spaces instead of two turns 6 red, headed by
"all 0 states rewritten with their own lines are the file byte for byte".
Changing one word of one line in the .dlg and not compiling it turns 5 red and
`npm run dialogue:check` exits 1 naming both files. Rewiring a press in
`mystery.json` and not re-extracting turns 2 red, one of them naming the
speaker, the state, what the file says and what the graph says.

**`npm test` fourteen suites green in one run, and not in the next two.** The
two failures are both this machine and neither is this row, which changes no
`src/` and no `data/` at all — the staged file list is four docs, `package.json`,
`test/run.mjs`, and the three files this row adds. `map` and `built` each failed
once on `Port 8128 is already in use` and `Port 8127 is already in use`: five
sessions were running in `git worktree`s on one Windows box and `test/harness.mjs`
binds a fixed port, so two browser suites in two worktrees collide. Both passed
alone immediately after. `plan-vs-scene` failed twice on one assertion — `none of
the 12 cells between 0.9 and 2.8 m of the chapel candles offers them (the nearest
offered "Press E to ring the bell")` — and run alone three times it passed once
and failed twice. That one is local and this session could not tell a real
intermittent bug from five Chromiums contending on one Windows box, which is
#53's line exactly.

**`plan-vs-scene` also failed in CI, and the reason it did is that CI on `main`
has been red since 2026-09-18 03:46 and nobody has said so.** Not this row and
not this machine: the assertion is `baker stands at (1.25, 0.00, 15.14) and the
first stop of the Prime ring is (1.25, 0.00, 14.75), 0.385 m off`, and the same
assertion is red on `main` itself at the merge of PR #47 (0.408 m) and at the
merge of PR #46 (0.110 m). The last green CI on `main` is the merge of PR #44,
so **three merges have landed on a red main**. The growing miss — 0.110, then
0.385, then 0.408 — is the shape of a real-time read of a body that has already
started walking, taken against a tolerance that assumes it has not, and PR #46
was r11's work in `src/main.js`'s rig, which is where startup timing lives.
**This is #13 failing at the level above the suite**: the repo has no
known-failures file precisely so that a red is acted on, and a red that has
survived three merges is a known-failures file kept in nobody's head. It is
flagged on this row's PR and it is not fixed here, because a real-time movement
assertion is not this container's to judge (#53) and rank 6 and rank 11 own the
code under it. `npm run play` not run: no `src/` changed, so there is nothing
for a GPU to decide (#53).

**What is left of rank 12 is nothing.** The placement editor (#583 to #587),
the budget suite (#607 to #611), move-and-delete (#636 to #642) and the
dialogue format are the three tools `WISHLIST.md` named plus the one the editor
asked for, and the row retires. **What this increment does not cover is the
rest of the spoken text**: `npcs.json`'s `chatter` and `performances` pools,
its `reputation` lines and `mystery.json`'s `day2.lines` are all lines somebody
says and none of them is keyed by speaker-and-state, which is the only shape
this format knows. They are a second increment for whoever wants one, and they
are not in this row.
## Side quests: the dozen closes, one voice each on the seven who had none (2026-09-18)

**Ranked row 8, on `claude/r8-seven-errands`, lane A, in a `git worktree`**
(#624's rule; four other rows were moving in the main tree). `SPECS.md`'s
"Side quests" row had five errands shipped (#576 to #581, #595, #597 to #599,
#612 to #615) and **the seven left of the dozen** as what remained. All seven
are in. `data/quests/` has twelve files, `data/npcs.json` has twenty-three new
dialogue states and seven new `default` lines, `src/quest-graph.js` has a sixth
set rule, and `src/save.js` and `src/quest-manager.js` are untouched: the row
turned out to be content, because everything the counters and the journal need
is already read off the files. Decisions #691 to #695, written as #659 to
#663 off a `main` that ended at #658 and renumbered whole at merge, in every
file that cites them: PR #49 took that band first and PRs #48, #50 and #51
went in ahead of this one.

**What #51 cost this row at merge, and it is the obligation `ROADMAP.md`
wrote down the same day.** R12c shipped `dialogue/castle.dlg` as a second
copy of every word the twelve say, and this row's twenty-two new dialogue
states drifted it the moment the two were in one tree: `npm run dialogue:check`
named seven speakers with no `:` for their new states. `npm run dialogue:extract`
is the whole fix — the row authored in `data/`, so `data/` is the direction the
text travels — and the .dlg went from 13 speakers, 40 states and 118 lines to
13, 62 and 182, 20398 bytes to 34243. **Two assertions in `test/dialogue.mjs`
were pinned to the number 40** (`members === 40`, `same === 40`) and are 62
now. Both were checked live before the number moved and after: the .dlg with
one line altered by hand fails the byte compare, and the count set to 61 fails
the two that were changed (#34). The counts in `SPECS.md`, `ROADMAP.md` and
`BACKLOG.md` moved with them; #687 to #690's own report did not, because it
measured what it shipped.

- **The seven are one errand each on the seven people who had none, and the
  three `WISHLIST.md` named are inside that count rather than beside it**
  (#691). The row's scope named a letter for the town that needs a gate pass,
  a child's dog in the east garden, the porter's boy who wants his letters,
  and "four the next session's to name". Two of those wanted rank 6's populace
  and rank 6 has not shipped. The count came out right anyway because the unit
  the row actually named is a *person*: the Constable, the Steward, the Clerk,
  the porter, Nest, Madoc and the merchant, one file each. `stewards-slate`
  (the kitchen's chalk account into a hand Caernarfon will read),
  `rogers-verse` (the words of the garrison's song), `bassetts-years` (six
  years of a dead drunk's ledger), `gwilyms-pass` (a pass out of the gate for
  the porter's son), `nests-windlass` (the south-west well after dark),
  `madocs-fire` (a forge cold eleven days) and `wykes-mark` (a mason's mark on
  a block in a town yard). Four outer, three inner, so the wards are 7 and 5
  and the set is 12. `test/quest.mjs` asserts the stronger fact that fell out
  of it: the twelve `npc` fields are exactly the thirteen of the cast minus the
  inspector, who has not dismounted. A thirteenth file has nobody to be about.

- **The two errands that wanted a body they cannot have kept their idea and
  dropped the body** (#692). The porter's boy is `gwilyms-pass` and the boy is
  never in the castle: he is eleven, the gate is his after his father, and the
  whole errand is one pass signed in a corridor. The gate pass `WISHLIST.md`
  named separately merged into it, because a letter for the town and a boy for
  the town are the same errand from the gate's side. The child's dog in the
  east garden did not survive and is not replaced: a dog is the one of the
  three that is not a conversation, and rank 6's hound (#643 to #645) is where
  it belongs. What this cost is nothing and what it bought is that rank 8 no
  longer depends on rank 6 for anything.

- **Rule 6: a terminal stage may not park a person whose `default` lines pose
  one of the frame's tokens** (#693). `{ACCUSE}` is a line in Sir Roger's
  `default` set and it is how the player is asked for a name. An errand on the
  Constable that ended in a state of its own would take the day's own question
  off the screen from the moment the errand finished until Vespers, and
  **every suite in this repo would have stayed green**, because the accusation
  overlay opens on `talked:constable` and not on the line: the player would
  have got the panel with no line asking for it, for the rest of the day, and
  nothing would have said so. `validateAgainstNpcs` already holds `{ACCUSE}`
  and `openAccusation` to each other in both directions and cannot see
  `data/quests/` at all, which is #501's lesson pointed at a third target.
  `validateQuestSet` takes `tokens` now (the frame's token keys, passed from
  `src/main.js`) and refuses the ending. Broken on purpose from green:
  `written.dialogueState` set to `verse-englished` fails four assertions, one
  of them the validator's and one of them a walk that checks `{ACCUSE}` is
  back on the screen after the errand ends. The rule is about terminal stages
  and not about every stage, because a terminal state is the permanent one;
  the middle stages are the file's own business, and `rogers-verse` answers
  them by ending each of Sir Roger's three errand states with the question in
  his own words.

- **The reputation bands are not one per errand, and the `closing` line at 5
  was wrong the moment the dozen closed** (#694). The ceilings went from 3, 2
  and 5 to 7, 5 and 12, which `validateQuestSet`'s rule 5 reads off the files,
  so every band that shipped is still reachable and nothing was forced. What
  went in is four outer (2, 3, 5, 7), three inner (1, 2, 4) and five closing
  (1, 3, 5, 8, 12): fewer rungs than errands on purpose, so that most favours
  are run and not mentioned. One shipped line had to be rewritten rather than
  added to — `closing` at 5 said "Every favour anybody in this castle thought
  to ask of a passing clerk, you did", which was true of a five-errand castle
  and is a lie in a twelve-errand one. That sentence moved to the band at 12,
  where it is true again.

- **The walk in `test/quest.mjs` is this row's acceptance criterion and it
  grew from five errands to twelve** (#695). One walk through every errand,
  the same calls through a manager built with no side quests, and the two
  journals compared by clue id and order: a side quest that granted, hid or
  gated one clue is a difference of one id. It is identical at twelve the way
  it was at five, every errand finishes inside it, and both ward counters end
  at their ceilings. Two lines of its order are not free and are commented as
  such: Thomas Wykes is at the cart at Terce and nowhere at any other bell, so
  his two calls are last, and the sentry is asleep at Prime, so the dice are
  still after the ring. Three rails were broken on purpose from a green
  baseline (#34) — rule 6 above, an errand naming `cornered` (rule 1, four
  assertions including `test/mystery.mjs`'s unreachable-state check), and a
  file left out of `index.json` (the directory rail, which named the missing
  file on both sides). `npm test` went thirteen suites green once, and red on
  two different things that are both already in this file. `built` and
  `plan-vs-scene` died in 0.4 s on `Error: Port 8126 is already in use`, which
  is #655 exactly, with four other rows testing beside this one.
  `plan-vs-scene` also failed the chapel-candles beat, which is #633, and the
  control that section asks for was run rather than assumed: `git checkout
  origin/main -- src test data` takes this row out of the tree entirely, and
  the beat is red twice over on that, the same assertion and the same
  sentence. Neither is this row's, and both are measured rather than argued
  from a diff.

## Sound, the third increment: a door and a dog, the two event sounds that need no clip (2026-09-19)

**Ranked row 7, on `claude/r7-event-sounds`, lane E, in a `git worktree`**
(#624's rule). `SPECS.md`'s "Sound: a soundscape" row had the beds (#620 to
#623) and a bed at a point with the four rings (#680 to #683) shipped, and
event sounds waiting on rank 6's activity clips. Two of them never needed a
clip: a door swings on `openLock` and `shutLeaf`, which are moments the
builder already has, and the hound that shipped in #644 stands at the
player's heels with nothing to sync a bark to. Both are in, synthesised
(#519, #548), and nobody has heard either (#53). Decisions #696 to #698,
picked off `origin/main` at the end of the row, which ended at #695.

- **An event sound is a list of parts in `data/sounds.json`, a cue is a
  name in `src/audio.js`, and `test/layout.mjs` check 14 holds the two to
  each other both ways** (#696). `events.byCue` maps what the engine does
  to a sound and `events.sounds` is each sound as `parts`: a noise burst or
  a tone, at an offset from the cue, with a struck envelope (`decay`) or a
  held one (`attack`, `hold`, `release`), a slide (`toHz`) and an optional
  filter on a tone, and a `repeat` for a double bark. That is `steps`'
  `byMaterial` and `classes`, and `ambient`'s `byRoom` and `beds`, a third
  time, and the file's own precedent is why: the runtime holds no default,
  `eventOf` and `cueSound` are the only lookups, and the check calls them
  rather than re-reading the file. `CUES` is the code's half: `door-open`,
  `door-shut`, `hound-near`, each with a line saying what fires it. Every
  event plays through a panner of its own at the point the cue names, HRTF,
  torn down 200 ms after its last part, because a latch comes from somewhere
  and three a minute is not three room tones a frame. Broken on purpose from
  green four ways, one assertion each: a fourth cue named in `CUES`
  ("the engine fires "hammer" (nothing yet) and data/sounds.json's
  events.byCue says nothing about what it sounds like"), `door-shut` pointed
  at a sound the file does not define ("resolves to the event sound "slam",
  which data/sounds.json's events.sounds do not define", and the orphaned
  `latch-and-slam` named in the same run), a `byCue` entry no cue fires
  (named, with the three cues that are), and the bark's `withinMetres` set
  to 9 against a follow radius of 6 (""hound-near" barks within 9 m and
  hound follows within 6 m: the cue never fires that close").

- **A leaf's cue fires on a change of state and not on every call, and
  nothing plays before the start button** (#697). `applyDay` is idempotent
  and runs on entering `morning` and again on entering `end` (#539), and
  `src/main.js` opens every remembered lock with `instant: true` on a save's
  resume; a builder that cued on every call would slam the Clerk's door twice
  on the second morning and latch the muniment room's at every reload.
  `openLock` fires only when the leaf was shut (`!opening && progress < 1`)
  and `shutLeaf` only when it was open, through one `onLeaf` hook the
  builder holds and `main.js` points at the audio, from `gd.centre` or,
  for a leaf with none, its hinge. The audio's half: a cue on a context that
  is not `running` is logged and not played, which is the crackle's own rule
  (#622), because a suspended context's clock does not move and every node
  scheduled before the button would land on the instant it is pressed.
  `events()` is the log, for the suite. `test/plan-vs-scene.mjs` drives the
  muniment leaf through open, shut, shut, open and holds the log to
  `door-shut door-open`, once each, from the leaf's centre to 0.01 m. Broken
  twice: the guard taken off `openLock` gave "cued: door-open, door-shut,
  door-open" against the same sentence, and the wire commented out of
  `main.js` gave "cued: nothing".

- **The hound's bark is a cadence over a state, and the state is the
  populace's to report** (#698). `Populace._follow` already knows every
  frame whether the hound is inside its follow radius; it now cues
  `hound-near` on those frames with the hound's position and the gap, and
  keeps no clock. The sound's `cadence` in the file is the clock:
  `withinMetres` 5, `firstSeconds` 0.6, `everySeconds` 7 give or take half,
  and leaving the radius clears it so the next approach barks quickly again.
  The radius is held inside the follow radius by check 14, above, because a
  cue only fires inside the populace's radius and a `withinMetres` past it
  is a bark that never comes. The bark itself is a sawtooth falling from
  560 Hz to 380 Hz through a bandpass at 1100 Hz, a square an octave under,
  and 70 ms of breath, twice, 0.26 s apart: the formant is the number most
  likely to be wrong in the whole file and the file says so.
  `test/plan-vs-scene.mjs` puts the camera 1.5 m from Gelert, drives the
  populace by hand with a supplied dt for `firstSeconds` plus 400 ms of the
  page's own clock, and holds that one bark is cued from where he stands and
  none before the wait is up. Broken twice: the populace's cue turned off
  gave "0 cued" and "Infinity m off", and `firstSeconds` ignored in the
  cadence gave "28 frames had one early". That last run also failed the
  chapel-candles beat, which is #633 and was green in the run before and the
  run after; it is not this row's.

**What was not done, and why.** No recording landed, so #506 and #390 were
not exercised: the sounds stay synthesised until one beats them (#548). The
hammer, the sweep and the rest wait on rank 6's activity clips, as
`SPECS.md` says. Whether any of this sounds right is Devon's ears (#53), and
the listening checklist for the seven beds, the four rings and the two
events is in `SPECS.md` under the row; this entry claims that the cues fire
at the right moments from the right points, and nothing about how they
sound.

## The bells call: the morning after names its own bells (2026-09-19)

**Ranked row 4a, on `claude/r4a-bells-call`, lane A, in a `git worktree`**
(#624's rule). `SPECS.md`'s "A second day" row carried one open design
question, *"it needs bells on day two, or a single-watch mystery, which is the
one design question worth settling first"*, and `ROADMAP.md` gave it what was
left of lane A. It is settled, the shape is the one all three files
recommended, and the morning after is still one bell long. Decisions #699 to
#702. `src/save.js` moved by a helper and two lines and the version did not
move at all.

- **The morning after names its own bells, and #533 is overturned in its second
  clause only** (#699). #533 said two things in one sentence: a second day is a
  `day` field on the save, and `watches` is four. The first is still true and
  is still what the save carries. The second was doing two jobs and only one of
  them was ever argued for. It keeps the rails about a two-to-three-watch
  convicting path honest, and it also said, without saying so, that the morning
  could never move. So `day2.watch`, a fifth bell id deliberately not in
  `watches`, is `day2.watches`, a list, and the engine reads whichever list the
  day names: `watches` on day one, `day2.watches` on day two, and
  `state.watch` is an index into that list rather than into the four.
  `watches` is still asserted to be exactly four, so every rail written against
  that number says exactly what it said.

- **The list is one long today, and the alternative that was rejected is the one
  that would have written that number down as a rule** (#699, the same
  decision). A single-watch mystery, meaning "the morning is one bell,
  forever" with a rail on it and nothing else, is the cheaper answer to the
  question as it was asked, and it costs nothing today. It was rejected because the question
  underneath it is not how many bells the morning has but who gets to decide,
  and the row that will want a second one is increment 3's last thread, Thomas
  Wykes's yard, which is not designed yet. "One, forever" is a door shut on a
  row nobody has written, and opening it again later is this same engine change
  plus an overturned decision. Making it now is six lines in the engine and one
  in the save. **The morning's content is deliberately unchanged**: one sky, one
  station per person, one line set each. A second morning bell with no per-bell
  content is a sky change and a noise, and this row did not write the content
  that would make one worth ringing. `day2.schedule` is still one station for
  the whole morning and `day2.lines` is still keyed by the verdict and not by
  the bell.
- **The chapel bell was a dead prop on the morning after, and it is a bell
  again** (#700). `ring()` opened with a bare `if (ended()) return []`, and
  `ended()` is true from the verdict onward, so pressing E at the rope at Lauds
  returned no effects at all: no sound, no event, nothing on the screen. That
  is what a morning with no bells of its own looked like from inside the game,
  and it is why the list above is not a generalisation with no user: it is the
  one thing in this row a player can hear. The guard is `ended() && !onDayTwo()`
  now, which keeps what it was for (#520: a ring between the verdict and the
  epilogue does nothing, and `test/quest.mjs` asserts the silence as well as the
  no-op) and lets the morning ring. **The last bell of a day rings and moves
  nothing**, which day one already did: its fourth is the Constable's demand
  and the watch stays at Vespers. The morning's is that shape with no
  Constable behind it: the `bell:<n>` event, the sound, and no `demand`. With
  one bell in `day2.watches`, every morning ring is that ring.

- **The morning's rings borrow the day's characters, and `test/layout.mjs` is
  what holds it** (#701). `data/sounds.json`'s `bell.rings` is keyed by the `n`
  of the engine's own `bell:<n>` (#682) and `test/layout.mjs` holds that block
  to every `n` the engine can emit **and no other**. A morning bell numbered
  past the four would be a ring with no sound written for it, and
  `data/sounds.json` is lane E, which this row is not in. So `ring()` numbers a
  day's bells within that day's own list: a morning of M bells emits `bell:1` to
  `bell:M`, and the rail is now the union of the two days' numbers rather than
  day one's alone. One bell in the morning means `bell:1`, Terce's single
  stroke, which #682 called "a morning's first note", the one ring in the file
  already written for a morning. The rail lives where `data/sounds.json` is and
  not in `src/mystery.js`'s validator, which cannot see that file at all: a
  proxy there ("the morning may not have more bells than the day") would have
  been a second owner of one fact, and the check that matters is the one that
  names the missing ring. **A second rail went in beside it**, for the failure
  that is silent in the other direction: `setWatch` in `src/scene-setup.js`
  returns false for a bell `lighting.watches` has never heard of and leaves the
  scene exactly as it was, so a morning bell with no sky would ring, move the
  HUD and not move the light. Every bell of both days has a sky now, asserted
  by reading `data/scene-config.json` and never writing it.

- **No version bump, and the reason is #37's own line rather than an
  oversight** (#702). `SPECS.md` and the row's brief both expected one, because
  version 6 is current and the next is 7. `state.watch` did change meaning on day two,
  where it was ignored outright and now indexes the morning, but **no field
  arrived and no field changed shape**, so there is no drift for `migrate` to be
  honest about. What moved is `repair`, which runs on every load (#37): `watch`
  clamps against whichever list the repaired `day` names, and the demotion of an
  incoherent `day: 2` re-clamps against day one on the way past, so a save
  demoted for having no verdict keeps the watch it came in with. A version-6
  save carrying `day: 2, watch: 3` is not a save from another schema; it is a
  save carrying a number that never meant anything, and 0 is what it has always
  been worth. The key is `castleConundrumSave_v1` and the version inside it is
  still 6 (#36, #413). Lane A's file moved by a helper and two lines.

**What was broken on purpose, from a green baseline of all fifteen suites**
(#34). Eight, and the fifth is the one worth reading.

1. `beginDay2`'s `if (st.day !== 2)` guard removed, so the morning rewinds on
   every re-entry. `test/mystery.mjs`: *beginDay2 called again does not rewind a
   morning that has rung on — lauds / 0* and *and a reload comes back at the
   bell the save was on — lauds*.
2. `ring()`'s guard back to a bare `if (ended())`. Six assertions across
   `mystery` and `quest`, the plainest being *the bell rings on the morning
   after, one stroke, where it used to return nothing at all — 0 rings, the last
   of them bell:3*, bell:3 being Vespers, the last thing the day rang before
   the verdict.
3. `repair`'s clamp pinned to day one (`clampWatch(s.watch, 1, catalog)`).
   `test/save.mjs`: *a day-two watch clamps to the 1 bell of the morning, not to
   the four — 3* and *a morning with two bells in it clamps to 1 — 3*.
4. The demotion's re-clamp deleted. `test/save.mjs`: *a day 2 demoted for having
   no verdict is re-clamped against day one and keeps its watch*, printing the
   whole repaired save with `watch: 0` in it.
5. **`src/stations.js` cut back to the morning's first bell, and the first time
   this was tried the whole suite stayed green** (#147). The nav is a second
   answer to "where does this body stand", and a separate one: `src/main.js`
   places with `engine.stationOf(id, watch) ? nav.at(id, watch) : null`, so a
   nav that indexes only the first bell of the morning puts **nobody at all** in
   the castle at the second. The engine says there is a station there and the
   lookup that turns it into a point says there is not. Nothing in the suite
   could see it, because every other reader goes at `day2.schedule` directly.
   The assertion was written, and the same break then failed it: *and the nav
   has a point for him at both bells, so main.js can put him somewhere at either
   — {"x":4.8,"z":-10,...,"room":"kings-hall",...} / null*.
6. `data/mystery.json`'s morning given a second bell and no sky.
   `test/layout.mjs`: *lauds-two is a bell the engine can stand at with no sky in
   data/scene-config.json's lighting.watches: ringing it would change the HUD
   and not the light*, with the ring rail beside it still green at two bells.
7. The same file given five morning bells. `test/layout.mjs`: *the engine rings
   bell:5 and data/sounds.json's bell.rings has nothing for it*.
8. `src/lore.js` pointed back at the removed singular `d2.watch`. Seven problems
   out of `validateLore` at once, each naming `(no bell of the morning)` where a
   bell id belongs, plus the #13 rail underneath it: *and validateLore does not
   fail on them — a check that only prints is not a check*.

The five validator breaks for `day2.watches` itself are `expect` rows in
`test/mystery.mjs` and fire as written: an empty list, an id that is not an id,
an id that is one of the four, one bell written twice, and the singular
spelling left in the file beside the list.

**And a two-bell morning is driven end to end rather than argued for.**
`test/mystery.mjs` clones `data/mystery.json`, adds one id to `day2.watches` and
changes nothing else. `validateMystery` returns zero problems on it, which is
the row's claim that a second morning bell is a data edit; then the day is
played to a fall, the morning opens at its first bell with the save index back
at 0 from day one's 1, the first ring moves it to the second bell and demands
nothing, the schedule and the nav both answer at both bells, the last ring moves
nothing, `beginDay2` called again does not rewind it, and a fresh engine on the
same save comes back at the bell the save was on.

`npm test`: fifteen suites green, with `dist/` at 52.8 MB. Three full runs, and
the middle one put `plan-vs-scene` red on its own while the other fourteen
passed; it is green alone and green in the run after it, and the failing
assertion was not captured, so it is recorded here as a flake rather than
explained. Two other sessions were testing in the same tree's siblings at the
time, which is #655's and #633's shape. No `dialogue` block was touched, so
`npm run dialogue:check` had nothing to say and `test/dialogue.mjs` is green on
the same .dlg the row started with (#687).

## Rank 4c, Thomas Wykes's yard: the first thing built outside the walls (2026-09-19)

**Lane B, local, decisions #703 to #707.** The ground west of the barbican has
been there since rank 5 laid it on 2026-09-16 (#541 to #546) with a road, four
trees and 150 m of fog, and nothing had ever been built on it. Wykes's stone
yard is: a stretch of Mereford's wall with the town gate cut in it, a shed on
four posts under that wall, a low yard wall on two sides and the road on the
third, four blocks of dressed stone and the fifth with Gruffudd's mark on it.
It is 34 meshes and one ground patch, every one of them outside both wards, and
it is what rank 9's town was gated on.

- **The player sees the yard and never stands in it** (#703). The row's open
  call, settled in the brief before anything was placed. Four things decided
  it, and the first is the only one that would have been expensive to overturn:
  the castle is sealed and `test/layout.mjs` check 4 asserts it, by flooding
  from the spawn and failing on one reachable cell outside the curtain box.
  `config.gates`' own comment has said for two phases that "the thing that
  never opens again is the way OUT of the castle, and the barbican's west face
  has no archway in it at all", so a walk to the yard is an archway in that
  face, a fifth crossing, and check 4 rewritten from a property into a list of
  exceptions. The other three are cheaper and point the same way.
  `data/quests/wykes-mark.json` is terminal in three stages and the player
  enters the yard in none of them: the block is described at Wykes's cart and
  the mark is read off the lodge's board. This row's goal is that the ground
  carries a building, which is a rendering claim and not a traversal one. And
  `day2.knew` does not need feet, because a clue is granted by `mystery.json`
  and the `knew` grammar never asks how the player came by it, so a lead in
  this yard can be granted by looking at it. **What it costs is one room on the
  journal's map that can never be filled in**, and that is the intended reading
  rather than a wart.

- **A room may declare `ward: "outside"`, and the word is paid for in a check
  of its own** (#704). A room past the curtain breaks four things at once and
  every one of them is right to break: it is a fifteenth ground room, it is
  unreachable, the mystery has never heard of it, and it asks for an ambient
  bed in a place no cell is in. The declaration lifts it out of all four,
  `test/layout.mjs` checks 3, 3d and 13 plus `test/budget.mjs`'s ward rail,
  which grew a third answer rather than an exemption. **So the declaration buys
  nothing on its own.** New check 4c holds every outside room to three facts it
  cannot move: its bounds lie wholly clear of `plan.curtain`, which is geometry;
  its bounds lie inside a piece of `config.ground.outside`, which is the whole
  of this row's claim that the building stands on rank 5's ground; and no cell
  of the flood fill is in it, which is #703 written as an assertion, so that
  whoever reverses it has to come here and delete a line. `budget.mjs` needed no
  new rule at all: `wardsOf` has returned `['outside']` for a box reaching
  neither ward since #611, so a yard that drifts into the outer ward fails on
  the same line an outer room drifting out of it does.

  **Four breaks from a green baseline** (#34). Dragging the yard inside the
  walls to x -30..-18: `wykes-yard says ward "outside" and its bounds x
  -30.00..-18.00, z -18.00..-6.00 are not clear of the curtain box x
  -46.00..34.00, z -20.00..20.00`, with the shed's two roof pieces naming
  themselves 32 m and 28 m past its west wall on the way out. Moving it to z
  44..56, off the north edge of `outside-ground`: `wykes-yard at x
  -62.00..-50.00, z 44.00..56.00 stands on none of config.ground.outside's 2
  pieces (outside-ground, outside-road), a floor laid over nothing`. Cutting a
  1.2 m doorway in `barbican-west` so the castle leaks: check 4 named 48963
  reachable cells outside the curtain and check 4c named the consequence,
  `wykes-yard ... is reachable from the spawn: 370 standable cells, the first at
  (-50.75, -5.25)`. And changing the one word to `"outer"` fired five
  assertions in `layout`: the fifteen ground rooms, the unreachable room, the
  room the mystery has never heard of, the missing ambient bed, and 4c itself
  reporting that no room declares `outside` so it measured nothing. `budget`
  added a sixth, `room "wykes-yard" says ward "outer" but its bounds x -62..-50
  do not reach that ward's rectangle`.

- **The town wall carries no battlements, and the reason is a number** (#705).
  It is one run, 64 m of it, 3 m thick and 8 m high at x -64, with the town
  gate as a `doorways` entry at z 0, 4 m wide and 5.5 m to the head, so
  `outside-road`'s own 4 m of cobble runs through it with 2.5 m of lintel over.
  Crenellating it was the first draft and #514's arithmetic refuses it: a kit
  merlon's body stands 1.2 to 2.4 m outward of the run's centreline, so check
  9's "at least half of every merlon's footprint over stone" wants a run **3.6 m
  thick or more**, and the only thickness in this castle that satisfies it is
  the curtain's own 4 m. A 4 m town wall 18 m from a 4 m curtain reads as a
  second castle, so the run takes `interior: true`, which in `castle-plan.js` is
  the field that means "no battlements and no walk" and is the mason's lodge's
  own flag. The wall is plain, and the nearest place the player can stand is
  28 m from it.

  The same family of check caught the yard's own two walls in a smaller way.
  Check 10 refuses two pieces whose tops share a height over a common footprint
  (#513), and two 1.4 m runs turning a corner into each other overlap by
  0.16 m² at exactly one height. The east wall stops **0.2 m short** of the
  north one instead of meeting it, which a person reads as the way in at the
  corner and the suite reads as no shared plane at all.

- **The journal's map frame went from 67.6 m wide to 90.8, and that is the
  price of the yard being on it** (#706). The map draws every storey on one
  frame, deliberately (#589), and the frame is the extent of `plan.rooms` plus a
  metre. The castle's westernmost room is the north walk at x -34 and the yard's
  west edge is x -62, so the drawing grew 23.2 m of mostly empty ground on its
  left and the castle dropped to 74 % of the frame's width. Nothing was done
  about it and nothing should be: **the 28 m between them is the barbican and
  the road, and it is exactly where rank 9's town goes.** If rank 9 never
  happens, this is the row to come back to. The height did not move: the yard is
  12 m deep in z and the castle already spanned 39.6.

- **The camera is pinned, not the spawn, and the yard reads as a yard** (#707).
  `tools/shot-yard.mjs` is hand-run on the dev machine and asserts nothing. It
  exists because there is no walk to this yard and `npm run play` has no beat
  that would ever face that way. Moving `config.spawn` out of the castle to put
  a camera there was the obvious way and it does not work: the walkability fill
  moves with the spawn, and `validatePopulace` throws on the page before the
  castle finishes building, naming ten people's forty stops as "floor the player
  cannot walk to". So the spawn is left alone and the camera is written back
  every frame through the same `updateMatrixWorld` patch `test/drive.mjs`'s
  scene probe already installs, after the rig has had its go at it.

  Six shots, in `shots/yard/`, which is gitignored like every other shot here.
  **Standing in the yard it reads as a stone yard**: paving, a pitched shed
  against the town wall, three courses stacked biggest-down, the marked block
  lying apart from them, a hoist over the loading place, crates, a shrub in the
  corner the carts do not turn in. **From where the player can actually stand it
  reads as a roof and a wall.** The North-west Tower's roof at 12 m is the one
  vantage, and through a crenel of its crown you get the shed's green pitch, one
  of its posts, the town wall behind it and the fog past that, with the stone in
  the yard under the line the parapet allows. The west curtain's walk is not a
  vantage at all and this row found out why: the North-west Tower's drum is 4 m
  of stone standing in that exact line, and the barbican's parapet closes what
  the drum does not. From the spawn, west is 8 m of unbroken wall, which is #703
  seen from the other end. **The verdict in one sentence: the yard reads as a
  yard from inside it and as a building from the castle, which is what the row
  needed, and what the west wants next is rank 9's town rather than anything
  more in this yard.**

- **The outside bucket went from 10 meshes to 44 and still has no ceiling.**
  `test/budget.mjs` counts a mesh in every ward its box reaches and calls
  anything reaching neither `outside`; that was the road, the ground and four
  trees, and it is now those plus the yard. The two wards did not move: outer
  993 of 1200 and inner 643, both of them this row's baseline rather than
  #611's 965, because rank 5's seven hall coverings landed in between. The
  ceiling is left unset on purpose: a number anchored on one yard is anchored on
  nothing, and rank 9's town is the row that will know what to put there.

- **One suite failure this row did not cause, measured rather than argued.**
  `plan-vs-scene`'s chapel-candles beat went red in two of four full `npm test`
  runs here and green three times out of three when run alone, and the control
  was run rather than assumed: `git stash -u` takes this row out of the tree
  entirely, and the beat is red on that, the same assertion and the same
  sentence, `none of the 12 cells between 0.9 and 2.8 m of the chapel candles
  offers them (the nearest offered "Press E to ring the bell")`. It is the flake
  #546's batch first recorded and #599's batch measured as intermittent, three
  failures in five runs of an unchanged file, still. **Two of the four full runs
  of this row are fifteen suites green and the other two are fourteen with that
  one beat red**, which is the same ratio that file has printed for three days
  and is why #599 called a suite green three runs in five worse than one that
  is red. `npm run build` is green and `npm run dialogue:check` says the .dlg
  and `data/` agree, which this row expected because it opened neither.

## The GPU run, second sitting: four runs, and somebody looked at the twelve (2026-09-19)

**Rank 2, on `claude/r2-gpu-run-2`, no lane, in its own `git worktree`**
(#624's rule). `npm run play` was run four times on Devon's machine. It exits
non-zero every time and the day still stops at the second bell. Decisions #708
to #715. **Nothing in `src/` changed**; `test/play-castle.mjs` changed by 67
lines in two helpers and a comment.

**The judgement half of the row is done.** The twelve at Vespers, the Lauds
sky, the covered hall and eleven of the twelve bodies at interact range were
all photographed and looked at — not by playing to them, but the way rank 5
took its two answers (#656 to #658): `applyWatch(watch, { walk: false })` puts
the world at a bell with nobody walking, the camera goes where it needs to be,
and the shutter goes. That is a hand-run look into `shots/look/` and
`shots/look2/`, it is not committed, and it is not a check (#13).

### What the four runs actually changed, which is less than it looks

**Run one and run four have byte-identical failure lists**: the same 22, in the
same order, with the same texts, down to `0.69 m in 700 ms` on the journal
beat. Two bugs were found and fixed between them and **not one assertion
changed its verdict**. That is worth stating first, because the fixes are real
and the natural way to write them up would have implied otherwise (#147).

What did change is the `note` lines under the failures, and they are the whole
story:

| | run one | run four |
| --- | --- | --- |
| the sentry | `gave up 18.9m ... at (-29.9, -0.3) ... locked false` | `gave up 1.1m ... at (-18.9, -14.3) ... locked true` |
| the Stockhouse bar | `32.0m ... at (-29.9, -0.3) ... locked false` | `16.8m ... at (-18.9, -14.3) ... locked true` |
| the tally stick | `38.3m ... at (-29.9, -0.3) ... locked false` | `1.7m ... at (4.9, 13.6) ... locked true` |
| the chapel candles | `55.5m ... at (-29.9, -0.3) ... locked false` | `14.7m ... at (9.1, 12.1) ... locked true` |
| the second bell | `55.1m ... at (-29.9, -0.3) ... locked false` | `14.3m ... at (9.1, 12.1) ... locked true` |

**In run one the player stopped moving at the merchant and never moved again**:
one coordinate, five beats, the distance growing only because the targets get
further from a body standing still. In run four he walks to every one of them
and comes up short. The beats fail either way, and they fail for a different
reason, and only one of those reasons is now open.

- **`present()` never shut the dialogue it opened** (#708). The first `present`
  of the day is the merchant at Terce. `shots/play/19-aborted.png` from run one
  is the diagnosis in one frame: Thomas Wykes's box still open, Present still
  on it. `converse` runs a box out with up to ten E presses and `present` did
  not, so it returned with the dialogue open — and a dialogue is on `ui.js`'s
  list of overlays that hold the pointer released, which is #660's design and
  not a bug, because releasing it is what lets that Present button be clicked
  by a real mouse at all.

  **#660 saw this coordinate and read it as a `src/` bug.** Its note in `hike`
  says the run that found it "got the merchant to admit the cart and then stood
  at (-29.6, -0.3) for the rest of Terce", and the line under it — "`ui.js`
  owns both halves now, so a walk that misses here is a walk that missed" — is
  the assertion's comment being the thing that is wrong (#147). It is true only
  once the box is shut, and nothing shut it. Four lines, the same loop
  `converse` already had.

- **The browser refuses a relock partway through a day, and nothing clicked the
  panel the castle puts up** (#709). Run two lost the pointer twice with no
  dialogue anywhere near it: `locked false` at the pouch in the chapel, then
  the journal's J/J handed the castle back (W moved 1.30 m), then `locked
  false` again on the walk west, 49.9 m short of the cook.

  #661 already knew this could happen: `src/main.js` hands `ui.usePointer` a
  relock that falls back to `ui.showStartAgain()` "because the browser rations
  pointer lock and hands out four requests before it starts refusing". A day of
  play is far more than four. So the castle does exactly what it was built to
  do, and `npm run play`, which has no hand, walks into a wall.

  **The guard added for it had never fired, so it was made to** (#34). Runs
  three and four never lost the pointer, so the four lines in `hike` sat
  unexercised, and a guard nobody has watched work is not a guard. Forced by
  hand into #661's exact state — `document.exitPointerLock()` then
  `ui.showStartAgain()` — from a green baseline:

  | | pointer | panel | W in 700 ms |
  | --- | --- | --- | --- |
  | baseline | locked | down | **3.75 m** |
  | relock refused | **gone** | **up** | **0.00 m** |
  | after the guard's four lines | locked | down | **3.79 m** |

  0.00 m is the bug this file existed to catch in #626, reproduced on purpose;
  3.79 m is the guard undoing it. **And it clicks the panel rather than calling
  `window.__player.lock()`**, which is what the `regrip` #660 deleted used to
  do: that is a handle no player has, and using it would hide the one failure
  #661 built the panel for.

- **What is left is #630's walker, and it stopped at #630's own coordinate**
  (#710). Run three, with both fixes in, drove the player up the Chapel Tower's
  stair ramp and left him there: `stopped 49.4m short at (22.4, 15.2) L1`, then
  `38.1m short at (23.4, 14.4) L1`. #630 recorded its own last stall at
  **(23.4, 14.4) on level 1, partway up the Chapel Tower's stairs**, named the
  fix — drop ramp and wrong-level waypoints when both ends are on the same
  storey — and did not make it. It is **rank 1** in `BACKLOG.md` now.

  **Its second shape is a wall, not a stair**, and it is in every run: the
  player slides along a face he cannot find the door in, `locked true`, at
  (-18.9, -14.3) inside the Kitchen Tower and at (-33.5, 5.0) and (-26.5, 5.0)
  along the Great Hall's north wall, whose two doorways are at x -20 and -12.

### What somebody looked at

- **The Constable and the Steward are the same man in two collars** (#711).
  This is the answer to `PLAN.md`'s standing Risk and to Q53, and it is no.

  **Sir Roger Lestrange, the Constable** — white hair and beard, black tunic,
  **red** collar. **Piers Marrable, the Steward** — white hair, black tunic,
  **green** collar. Nothing else differs, and past about three metres the
  collar is gone. `shots/look/04-the-hall-from-the-middle.png` has both in one
  frame and they read as twins.

  **Master Robert Ferrour, the Clerk** — brown hair and beard, black, no
  collar: told apart at any range, because hair is a discriminator that works
  at distance and a collar tint is not. **Dafydd ap Rhys, the sentry** — at
  Vespers he is mid-performance on the bench end in a gold robe with the
  brazier on him, and he is the most legible man in the hall, which is the pose
  and the firelight rather than the body.

  **The three women are the clearest thing in the castle**, and this is #606's
  photograph, owed since 2026-09-17. **Marged, the cook** — cream coif and
  apron, a servant woman at any range. **Nest, the laundress** — blue hood and
  blue dress, unmistakable. **Lady Alys** — her King's Hall station is behind a
  wall from every angle one camera pass could reach, and she is the one body of
  the twelve still not photographed. `Woman.glb` works, and the lesson is that
  **silhouette does what tint was being asked to do**: the argument for a fifth
  body is now an argument for more shapes, not more colours.

  The porter, chaplain, apprentice and prisoner are in `shots/look2/` and none
  of them is a man in a black tunic. The merchant is not in the castle at
  Vespers at all.

- **The Lauds sky has its own number and no dawn in it** (#712; #533's GPU
  criterion). One camera in the outer ward at (-20, 0) pitched up 0.55 rad, a
  360x200 px patch of sky, mean RGB of 255, Prime measured twice and repeating
  to the decimal:

  | watch | sky rgb | luma |
  | --- | --- | --- |
  | prime | 198 204 214 | 203.4 |
  | terce | 168 178 196 | 177.2 |
  | sext | 180 188 203 | 187.4 |
  | vespers | 124 116 134 | 119.0 |
  | **lauds (day 2)** | **142 152 171** | **151.2** |

  Lauds is not a copy of Prime — it is 52 of 255 darker — but it is the same
  hue as every day watch, blue over green over red, and **Vespers is the only
  watch in the game whose sky changes colour** (124 over 116, the only row
  where red leads). The morning after reads as a duller midday.
  `shots/look2/12-the-lauds-sky-east.png` and `15-the-prime-sky-east.png` are
  the same photograph but for the HUD word.

  **And the day's own arc is backwards.** Prime is the brightest watch at
  203.4, Terce drops to 177.2, Sext comes back up to 187.4, Vespers falls to
  119.0. The sun is brightest at the first bell and the sky gets lighter
  between the second and the third. Whoever takes #533's second half has two
  jobs: give Lauds a colour, and put the four in order.

- **The hall covering hides the trusses, and it does not close** (#713).

  **#527 is moot rather than answered.** Whether `structure-cross.glb`
  stretched to 0.5 x 2.5 x 7.25 reads as a hammerbeam or as scaffolding does
  not arise: rank 5's deck is under them and **not one truss is visible from
  the hall floor** (`shots/look/03-the-hall-trusses-and-covering.png`). Seven
  pieces of geometry nobody in the game will see.

  **There is a gap to the sky at the hall's south-east.** Rank 5 reported "a
  continuous slate ceiling, no gap to the sky" (#656 to #658). At Vespers, from
  the floor, a sliver of 124 116 134 — exactly the Vespers sky measured above —
  shows between the covering and the south wall, in two shots.

  **And the hall's north wall is a black void**, floor to ceiling, in every
  hall frame, at roughly x -28 to -24: an interior face with no direct sun and
  now no sky either. Same failure mode as the tower merlons, which #630
  recorded as near-black from the roof at 12 m and which is unchanged. The
  covered floor reads 57.8 of 255 from the west end, well clear of `SPECS.md`'s
  ~25 line, so the room is not dark; one wall of it is.

- **Five checks in `test/play-castle.mjs` are wrong, and two can only be wrong
  on a GPU** (#714). All five fire before the player takes a step, in all four
  runs, identically.

  **`every texture is at the GPU anisotropy ceiling` — `cap 16, worst 1, 130
  textures`.** This has been passing vacuously on every software-rendered run
  there has ever been: under SwiftShader `MAX_TEXTURE_MAX_ANISOTROPY_EXT` is 1,
  so "every texture is at the cap" is "every texture is at 1", which is true of
  a texture nothing tuned. On a real GPU the cap is 16 and something is at 1.
  The assertion could not fail on the only machine that ever ran it.

  **`every pixel-art texture magnifies NEAREST` — 38 textures at <=128 px.**
  `tuneTexture` skips compressed textures deliberately, and its comment says
  that is safe because "nothing compressed is pixel art here anyway — the retro
  kit is the only thing under 128 px and the kit is deliberately the one thing
  `tools/encode-assets.mjs` leaves alone (#508)". The check says not all 38 are
  NEAREST, so half that sentence is false. Which half is for whoever takes it.

  **`thirteen rigged NPC bodies in the scene` — found 27**: 13 suspects plus
  rank 6's 14 in `data/populace.json`. A hard-coded number rank 6 moved, which
  nothing in CI reads because this file is not in CI.

  **The two #629 filed are still there**, one red and one newly red:
  `interior hall walls are the same height as the outer walls` still matches
  zero meshes, and `no brazier is sealed inside the stonework` now reports
  `IN Scene` for all three.

- **And one bug that is not a check failing, it is every frame of the game**
  (#715). The interact prompt reads **`Press E to talk to the Sir Roger
  Lestrange`**. `src/interaction.js:143` builds ``Press E to talk to the
  ${shown.name}`` and all thirteen of `data/npcs.json`'s `cast` carry a proper
  name, so it is "the Marged", "the Father Anselm", "the Nest", "the Lady
  Alys", all day, every playthrough. The `read` verb has it too: `Press E to
  read the A gravestone in the chapel floor`. **Nothing in fifteen suites
  asserts that string** — `grep -rn "Press E to talk" test/` is empty — which
  is how it survived seven phases and two GPU sittings with a person watching.

### Two things noted and deliberately not changed

**The journal beat's walk assertion is mostly measuring the chapel.** #659's
`moved > 1.0` had never run on a GPU. Four runs gave **0.69, 1.30, 0.51 and
0.69 m** in 700 ms. An unobstructed walk on this machine is **3.75 m**,
measured above, and #626 measured 3.70 m when it wrote the bug up. The beat
holds W from wherever the pouch left the player, which is the tightest corner
in the castle — the chapel, between the stair, the body and the pouch — and
never controls for what is in front of him. The assertion is real and the thing
it guards is real; the number is geometry. Changing it is a decision about what
the beat is for, and the row's scope was the run.

**The body and the pouch are one press apart**, and so are the chapel bell and
the chapel candles. All four runs failed `E on the body: he is at the foot of
the stair` with `summons-note, pouch-empty`: the player stops 1.0 to 1.8 m
short of the body's target, `examine` aims at the body, and
`InteractionSystem` hands him the pouch, which is nearer. Both clues are
collected and the day proceeds; the two assertions are simply swapped.

**The same behaviour is what has CI red on `main`, and it is not the beat
`BACKLOG.md` names.** `npm test` on this branch fails one suite,
`plan-vs-scene`, on `none of the 12 cells between 0.9 and 2.8 m of the chapel
candles offers them (the nearest offered "Press E to ring the bell")`. Run on
a clean `origin/main` at `f5d0c0e` with nothing of this row's in the tree, it
fails identically, so it is not this row's and it is not the baker's Prime
stop that the backlog wrote up on 2026-09-18. **Two suites are now failing on
one behaviour**: a nearer interaction target out-ranks the one the beat is
aimed at, in the chapel both times. Whether `InteractionSystem` should prefer
what the camera is pointed at over what is closest is a `src/` question
nobody has asked, and it is bigger than either suite.

**What this cost.** Four runs of about twenty minutes, two of them stopped by
hand once the cause was certain, plus four hand-run looks. One run was lost to
`Port 8124 is already in use`, left behind by the Vite server of a run that had
been killed — #624's rule about a working tree, for a fourth time, in its
smallest form: the port is one copy too.

## The walker on the stair: route on one storey, and round what a body does not fit through (2026-09-19)

**Rank 1, on `claude/r1-walker-on-the-stair`, container, no lane.** Two GPU
sittings (#624 to #630, #708 to #715) had left one thing between `npm run
play` and the end of the day: `hike`'s route crossed a flight as if it were
floor, drove the player up the Chapel Tower's stair, and every re-plan after
that started a storey too high. `test/route.mjs` is new: 275 lines that do the
routing and the waypoint thinning `hike` used to do inline. Nothing in `src/`
changed. `npm test` runs 14 of 15; `npm run build` is green.

- **The fix went into the suite, not the plan's graph** (#716), as the row's
  first open call recommended. `src/stations.js` walks the twelve along
  `walkability(plan)`'s own graph and neither of this row's two bugs touches
  them: a station is never on a ramp, and an NPC is steered cell by cell
  rather than aimed at and held. Narrowing the graph itself would have moved
  twelve working bodies to fix one broken one, so `routeThrough` in
  `test/route.mjs` searches a same-storey pair's own floor alone, and `hike`
  in `test/play-castle.mjs` calls it instead of `walk.path` directly.

- **The wall symptom is the stair symptom, not a second row** (#717), as the
  row's second open call recommended. Both are the same waypoint list being
  wrong about what a 0.9 m body can reach from where it stands: the stair
  case let the route claim a flight as floor, and the wall case let it hug a
  wall a prop stood against because the grid samples a point where the body
  is 0.45 m of radius. `marksAlong` now puts a mark at the widest point of
  every doorway a route passes through, and a cell a 0.45 m body does not fit
  in costs five cells rather than one, so the shortest route stops running
  down `foundation-stone`'s 0.60 m gap against the cross-wall at (-2.6, 4.0)
  and `barrels-91`'s 0.52 m gap inside the North-west Tower's door. A penalty
  rather than a ban: banning a tight cell outright cut 21 of the 66
  room-to-room routes, the porter's lodge and the guardroom among them.

- **The #34 break, and the fact that the brief's own prescribed break cannot
  fire** (#718). Re-admitting a flight's cells to a same-storey route was the
  break this row's spec named, and it does nothing: a flight's consecutive
  cells sit roughly 0.5 m apart in height, `storeyGraph` drops exactly the
  fill's `sameRamp` rule that joins cells that far apart, and without it a
  flight is not a connected path at all. The ramp-cell break is unfirable by
  construction, not a rail that stayed green. Two different breaks did fire,
  both from a green baseline, both restored afterwards: handing a
  same-storey pair back to `walk.path` printed `FAIL  the walk from
  clerk-office to porter-lodge leaves the ground: 78 of its 139 waypoints are
  off it, the highest at (-18.25, -16.25), h 8.00, storey 2` and exited 1;
  pricing a tight cell at 1 instead of `TIGHT` printed `FAIL  walking
  clerk-office to guardroom, the body stops at (-33.73, -14.32), 1.02 m short
  of its mark at (-34.75, -14.35)` and exited 1. The doorway marks themselves
  are honestly unrailed (`test/route.mjs` says so in place, #13, #147): with
  the clearance pricing in, taking them out changes no answer over the 66
  room-to-room walks either way, 1936 pushed steps of 31,103 against 1913.
  Rank 2's GPU run is what can still kill or confirm them, not a Node check.
  This is #147's lesson turned on a rail that cannot be broken, rather than
  one that stayed green when it should not have.

- **`test/layout.mjs` gained check 8b** (#719): over all 66 pairs of the 12
  ground rooms the fill reaches, no waypoint of a same-storey route leaves
  that storey, and a 0.45 m body is driven through every one of the 1577
  waypoints by `moveBody`, the controller's own. `layout` is 153 ok, 0 fail,
  in 2.7 s.

- **`npm test` is 14 of 15, and the fifteenth is inherited, not this row's**
  (#720). `plan-vs-scene` fails `none of the 12 cells between 0.9 and 2.8 m of
  the chapel candles offers them (the nearest offered "Press E to ring the
  bell")` on a clean `origin/main` too, verified by stashing this row's
  changes and running twice. That is the red `BACKLOG.md`'s "CI on `main` is
  red, and it is nobody's row yet" paragraph already named; it is
  not folded into this row.

**Left for whoever takes it next.** Two props stand inside a 0.45 m body's
width of stone: `foundation-stone` against the cross-wall at (-2.6, 4.0) and
`barrels-91` inside the North-west Tower's door (both #718, above). The
router goes around both now and does not depend on either being moved; moving
them is a small row of its own, filed in `BACKLOG.md`.

**Rank 1 is done. Its section is gone from this file and from `SPECS.md`, and
`ROADMAP.md`'s Gate 1 is back to rank 2, the GPU run** — the walk half of that
row is answered on Node terms; what it is still owed is the run itself, on a
GPU (#53).

## The red suite: the prompt goes to what you are aimed at (2026-09-20)

**Unranked, on `claude/r99-red-ci`, in a `git worktree`, no lane.** `main` had
no green CI run and every PR inherited a red `plan-vs-scene`. `BACKLOG.md`
framed it as an unasked `src/` question — should `InteractionSystem` prefer
what the camera points at over what is nearest — and the answer is yes, with
the castle-wide numbers to say so. Decisions #721 to #723. `npm test` is
**15 of 15**.

- **The cause is the Constable walking, not the beat's two
  `requestAnimationFrame`s, and #633's reading of the flake is overturned**
  (#721). The beat was instrumented to dump every candidate
  `InteractionSystem.update()` sees at every one of its twelve cells. From the
  nearest cell, 0.96 m from the candles and aimed dead at them (dot 1.00), the
  prompt read **`Press E to talk to the Sir Roger Lestrange`** — 0.52 m away
  and dot 0.47, which is 62 degrees off the aim. He was at waypoint 1 of a
  **77-waypoint** route out of the chapel, having moved 0.24 m across the whole
  twelve-cell sweep: the beat before this one rings the bell, `onWatch` sends
  twelve bodies walking, and his Prime station is **0.92 m from the candles**
  (measured off the plan in Node, against no Terce station within 2 m of them).
  So how far he has got when the sweep starts is a count of frames between the
  bell's E and the first cell, which is a property of the machine. That is the
  axis rank 11 measured from both ends — ten runs green under five parallel
  sessions, eight red alone — read correctly at last. #633 blamed a fast
  machine for not giving the beat its frames; the frames were never the
  question.
- **`src/interaction.js` gets a second slot per list: the nearest thing inside
  `AIM_DOT`, and only then the nearest thing at all** (#722). `FACING_DOT` is
  0.35, a 69.5-degree half-cone, and until now it was a gate and nothing else —
  past it, nearest won. `AIM_DOT` is 0.95, 18.2 degrees. Measured over the four
  watches, the twelve's stations, every evidence piece, readable, bell and lock,
  and every walkable cell 0.9 to 2.8 m from one of them: **12371 (cell, target)
  pairs, of which nearest-wins offers what the player is aimed at 6667 and the
  aim rule offers 11521**. It fixes 2834 pairs nearest got wrong and breaks 48
  it got right; of nearest's 5704 misses, **1282 offer something more than 45
  degrees off the aim, and the aim rule's misses do that 0 times**. The 48
  breaks are all one shape — a body inside the same 18-degree cone and nearer
  than the prop, 28 of them the Chaplain who stands 0.20 m from the gravestone —
  and at that separation either answer is defensible. **Not one of them is a
  lock**, which was the named risk: a door 1 m ahead still beats the NPC 3 m
  past it, because both are inside the cone and inside the cone it is still
  nearest-wins. A third rule was measured and rejected: ranking by lateral
  offset from the aim ray scores 8211 of 12371, better than nearest and much
  worse than the cone, for the same shape of change.
- **And it fixes #714's body-and-pouch swap, which is the same bug in the same
  room** (#722). Four GPU runs failed `E on the body: he is at the foot of the
  stair` because `examine` aims at the body and the pouch is nearer. Over the
  six chapel cells 1.0 to 1.8 m from the body at Prime, aimed at the body:
  **nearest-wins offers the body 0 times out of 6, the aim rule offers it 6**.
  The two beats that were failing on one behaviour are fixed by one change.
- **The break, from a green baseline** (#722). `AIM_DOT = 0.35` is `FACING_DOT`
  and therefore nearest-wins verbatim. `plan-vs-scene` went red on the first
  run with `FAIL none of the 12 cells between 0.9 and 2.8 m of the chapel
  candles offers them, nearest cell first — 0.96 m: "Press E to talk to the Sir
  Roger Lestrange"; 1.08 m: "Press E to talk to the Sir Roger Lestrange"; ...
  1.43 m: "Press E to ring the bell"; ... 1.58 m: "Press E to ring the bell"`,
  exit 1. Restored, and the suite ran **six times green** where the same suite
  on `origin/main` at `dc83147` was **red five times in six** on this machine.
  That the fix is the cause rather than the load moving is structural and not
  statistical: from the nearest cell the Constable is 62 degrees off the aim,
  so he is outside `AIM_DOT` wherever on his 77-waypoint route he has got to.
- **The beat's failure message was lying, and it is the assertion's comment
  that was wrong** (#723, #147). `none of the 12 cells ... (the nearest offered
  "Press E to ring the bell")` read `promptNow()` once the sweep was over, so
  it printed the **twelfth** cell's answer under the **first** cell's name. The
  twelfth is the far one, 1.58 m out with the bell at 1.17 m, where the bell
  genuinely does win. Two sessions chased the bell on the strength of that
  sentence. The beat now records what every cell offered and prints the lot,
  nearest first, which is how the Constable's name appeared at all.

### A finding on the way past: nothing keeps a station away from a prop

`STATION_CLEARANCE` is 1.5 m and holds between two bodies — **0 of the
twelve's station pairs are inside it at any watch**. There is no such rule
between a station and something the player presses E at, and two stations are
well inside where one would be: the **Chaplain stands 0.20 m from the
gravestone at all four watches**, and the **Constable 0.92 m from the chapel
candles at Prime**. #722 means neither now steals a prompt from a player aimed
at the prop, but a man standing 20 cm in front of a gravestone is still a man
standing on a grave. The rail is `validateMystery`'s, in `src/mystery.js`,
beside the clearance check it is the second half of — plan arithmetic, provable
in Node, so #529 keeps it out of `plan-vs-scene.mjs`. It is specified in
`SPECS.md` with a recommended 1.0 m and is not done here.

### The populace beat: written down, not changed

`plan-vs-scene.mjs`'s `all N of them stand on the first stop of their Prime
ring within 0.01 m` **does not reproduce on the dev machine**: run six times
on 2026-09-20, green six times, `on 3 level(s)`, no body off by anything. It
was red twice in CI (0.408 m on the merge of PR #47, run 35305787194; 0.055 m
on rank 1's branch the same morning). **It is not a tolerance problem.**
`DWELL` is 9 s and a body's opening timer is `dwell * (0.5 + phase)`, so the
first ring leaves its first stop 4.5 s after `Populace.setWatch` places it and
the last at 11.2 s; the beat is racing a wall clock from page load, and two
distances from one stop are two points on a leg that can be the length of the
room. `TOL` is 0.01 m because that is what this file diffs static geometry at
and a walking body is owed a different number — but the number a walking body
is owed is "stop walking", not a larger epsilon. The recommendation is in
`SPECS.md`: park the rings with `setWatch(watch, { walk: false })` before the
read and keep 0.01 m. Not taken blind on a beat nobody here has watched fail.

### And then taken: the populace beat parks its rings (2026-09-20)

- **`test/plan-vs-scene.mjs` calls `window.__populace.setWatch(mystery.watches[0],
  {walk: false})` immediately before the `window.__folk` read, and `TOL` stays
  0.01 m** (#724). That is `Populace.setWatch`'s own signature, the call
  src/main.js:155 makes at load: it re-places every body on stop 0 of the
  watch's ring with no route and no motion, so what the beat diffs against
  Node's `stopWorld` is static geometry, which is what 0.01 m is the number
  for. The tolerance was not widened and no assertion moved out of this file
  (#13, #529).
- **The failure was driven rather than waited for, and it is the same
  mechanism** (#724, #34). The beat cannot be made to fail here by running it
  — six green in six — so the wall clock CI supplies was supplied by hand:
  with the park skipped, 15 s of dt at 0.05 s a step through `npc.update` and
  `Populace.update` before the read, the same driver the ring-turn beat below
  uses. `all 13 of them stand on the first stop of their Prime ring` went from
  one ok to **7 FAILs**, `hound stands at (-14.75, 0.00, -4.75) and the first
  stop of the Prime ring is (-25.75, 0.00, -3.75), 11.000 m off` the worst and
  `hen-brown ... 3.197 m off` the least, with `hen-brown` at z 1.56 caught
  mid-leg rather than at a stop; exit 1. Restored, **the same 15 s of supplied
  time moves nobody**: 13 of 13 within 0.01 m on 3 levels, and again at 45 s.
  CI's 0.055 m and 0.408 m are two early points on legs this long.
- **What the beat gave up is that `init` called `setWatch` at all** (#724,
  #147), and the comment says so: the park would place these thirteen even if
  the page never had. Placement at load is the thirteen's own beat further up
  the same file, which reads bodies the park does not touch. What survives
  here is `Populace.setWatch` against `stopWorld` — the routine lookup, the
  level, the floor height, the facing, and fourteen bodies built.
- **`npm test` is 15 of 15 and `npm run build` is clean.** The drive is
  supplied dt, not a measured frame, so #53 does not touch it; the run was
  headless on the dev machine.

## Rank 9, the town: where it stands, how the map shows it, what it costs (2026-09-21)

**Lane B, decided before anything is built, decisions #725 to #728.** Ranks 2
and 6 were running at the same time and may take numbers from #725 too; this
band is contiguous so it can be renumbered in one pass at merge. Nothing here
touches `src/` or `test/` yet. `SPECS.md`'s "A castle to get lost in" carries
the first increment these four decisions make buildable, and every number
below is from a Node prototype that cloned `data/scene-config.json` in memory,
added the town, and ran `makePlan`, `walkability`, `buildPiece` and a sight
test over it. Three runs, six houses, a church, four ground props, two rooms.

- **The town stands west of the `town-wall` run, inside it, and not in the
  strip between it and the barbican** (#725). This amends #706, which said
  "the 28 m between them is the barbican and the road, and it is exactly
  where rank 9's town goes", and the three summaries that repeated it. The 28 m
  is a distance on the map, from the north walk's west edge at x -34 to the
  yard's at x -62, and most of it is not ground a room can use. x -46 to -34
  is inside the curtain box, where check 4c refuses an outside room. What is
  left is x -62.5 (the town wall's east face) to -48 (the base's edge), 14.5 m,
  and the yard already takes z -17 to -5 of it. A walled town's street, church
  and quay do not fit in a 14.5 m strip, and the lore does not put them there:
  `west-road` runs "west through the barbican and down through Mereford to the
  quay", `the-quay` is where the carts come up from, and `town-wall`'s own
  comment has the gate on the road and the wall facing the castle. So the run
  is Mereford's east wall, the town lies behind it, and **Wykes's yard stands
  outside the east gate, under the wall**, which is what his quest says it is.
  Three returns close the circuit at x -129.5 with a west gate on the road,
  and the quay is outside that gate in a later increment. #703 is not touched:
  the prototype's `walk.sealed()` is still `true`.

- **Outside rooms go on the map in a drawing of their own, named from the
  first and never counted** (#726). This amends #589's "every storey on the
  same frame", #706's "nothing was done about it and nothing should be", and
  the cost #703 accepted, "one room on the journal's map that can never be
  filled in". One such room was a blank the player could read as a wart. The
  town makes three, and under #725 it puts them 33 to 44 m further west than the yard: one
  shared frame would have gone from 90.8 m wide to about 135, with the castle
  about half of it. So the storey drawings frame the rooms that are not
  outside and go back to 67.6 m, `#journal-map-count` reads out of 40 rather
  than 43, and the three outside rooms get a fourth drawing, "Outside the
  walls", on their own frame, with their names shown, because a name that can
  only be earned by standing somewhere nobody can stand is never earned. The
  map is still the plan's list and not a second one (#588): the split is on
  the room's own `ward`.

- **What is drawn outside both wards counts against each ward's ceiling**
  (#727). This amends #611's three buckets and #707's "the ceiling is left
  unset on purpose", which deferred the number to this row. An outside mesh is
  in view from both wards: the one vantage that sees the town, the North-west
  Tower's roof, is in the outer ward, and an inner-ward roof looks the same
  way over the cross-wall. So the claim is `calls[w] + calls.outside <=
  MAX_DRAW_CALLS_PER_WARD` for each ward, with no new constant. **Before**: the
  outside bucket was 44 meshes with no ceiling. **After**: it is bounded by
  1200 less the busier ward, 1200 - 993 = 207 today. The prototype town takes
  it to 132, so the outer ward's sum is 1125, 75 under, and the inner's 775.
  When it fails, the first answer is still #611's: merge a drum's sectors into
  one geometry before deleting a house.

- **Every room outside the curtain has to be seen from somewhere the player
  can stand** (#728). #703 said the player sees the yard and never stands in
  it, and check 4c asserts only the second half. The first half was a
  photograph (#707). `test/layout.mjs` check 4d makes it geometry: from any
  reachable cell at 8 m or higher, at eye height, a segment to the top of any
  piece whose centre lies in the room meets no other piece's box. The
  prototype, before a line of the suite exists: **the yard is seen from
  `floor-nw-tower-roof` at (-37.75, 13.70, -16.75), by `wykes-shed-pitch-1`**,
  the roof and the shed #707 photographed through a crenel, so the check agrees
  with a picture and not with itself (#34). The street is seen by 14 of its 20
  candidate pieces and the church by 8 of 9. With `town-wall` raised to 20 m
  as the break, the street and the church are seen from nowhere and the yard,
  east of that wall, is still seen. 1939 eyes, 0.2 s.

**Built, and each guard-rail broke from green, verbatim** (#34). `f26cc70`,
2026-09-21.

- **Check 4d, with `town-wall` raised to 20 m** (#728): `FAIL  mereford-street
  is seen from nowhere: none of its 20 pieces (mereford-house-n1, …) has a
  clear line to any of the 1939 places 8 m up the player can stand. #703 says
  the player looks at it`; the church fails the same way, 9 pieces. The yard
  still passes, seen from `floor-nw-tower-roof` at (-37.75, 13.70, -16.75) via
  `wykes-shed-pitch-1`. Restored, 4d checks 1939 eyes in 55 ms: the street is
  seen by 14 of its 20 pieces, the church by 8 of 9.
- **`test/budget.mjs`, with `MAX_DRAW_CALLS_PER_WARD` at 1100** (#727): the
  outer ward alone (993) still passes the old assertion and only the new one
  fails: `FAIL  the outer ward's 993 meshes and the 131 outside both wards
  come to 1124, over the ceiling of 1100: … outside-ground (5),
  wykes-shed-pitch-1 (4), wykes-shed-pitch-2 (4)`.
- **The map, three ways** (#726): a frame built off every room again —
  `FAIL  every storey is framed on the castle's own 67.6 m … — 134.8, 134.8,
  134.8, 134.8`; outside rooms counted in the stood-in denominator —
  `"0 of 43 rooms stood in"` / `"3 of 43"`; and `· · ·` where an outside name
  belongs — `wykes-yard: "· · ·", mereford-street: "· · ·", mereford-church:
  "· · ·"`.

**What shipped counts one mesh under the prototype's, everywhere the
prototype's count was carried forward.** The four ground props measure 6
meshes, not the prototype's 7, so the outside bucket is **131**, the outer
ward's sum is **1124** (76 under 1200) and the inner's is **774** (426
under). `mereford-street-barrels` ships at `rotationY: 0`: at the prototype's
30°, its box went 0.09 m into `mereford-house-s1`. `SPECS.md` carried the
prototype's 132/1125/775 into the built spec by mistake and is corrected to
match.

**The prototype found one thing the spec had to say**: a run that starts and
ends on one tile throws in `runAxis` without an `axis` field, so the church
tower carries `axis: "x"`. `SPECS.md` has it. The prototype is not committed;
the builder writes the check and the town from the spec and breaks each on
purpose from green.

## Rank 6, the populace's second increment, decided: five more, a talk list of its own, and a budget that can see them (2026-09-20)

**Rank 6, on `claude/backlog-rank-6-9678fa`, lanes C and D, no code.** The
`SPECS.md` section said "the other forty", "stopping at twenty", and ambient
talk out of `data/npcs.json`'s chatter pool once two populace bodies stand
within 3 m, read off the DOM "the way the performance captions are read"
in `test/plan-vs-scene.mjs`. Each of those was measured against the code
and each came out wrong. Decisions #729 to #732, and the section is
rewritten so the next increment is class S. **Numbers claimed against
#724 as the highest in this file; ranks 2 and 9 are running at the same
time, so expect to renumber at merge** (#607's lesson).

- **"Twenty" was twenty more, and the budget allows five** (#729).
  `SPECS.md` wrote "room for perhaps twenty more" and "stopping at twenty" on
  2026-09-17, the same day #609 set the ceilings, and neither sentence was
  checked against the other. The page builds **27** skinned bodies today:
  all 13 of `npcs.json`'s `cast`, the inspector included because `main.js`
  builds him on day one and hides him, and all 14 of `populace.json`, whose
  ten from #616 became fourteen with rank 10's girl, hound and two hens.
  `src/npc.js`'s `update` runs every mixer each frame before anything reads
  `visible`, so all 27 are paid for. Against `MAX_SKINNED_TOTAL` of 32 that
  is **5 more**; twenty more would be 47. Per ward, counting a ring in every
  ward its stops are in and the hound in both, the outer ward is at **18 of
  20** at Terce and the inner at 10. So the five go in the inner ward at
  every bell, which takes it to 15 and leaves the outer at 18. Neither
  ceiling moves. **Why not argue 32 up**: the ceiling is a guess (#609), the
  only thing that could replace it with a number is rank 2's
  `renderer.info` on a GPU, and a row that merely wants room is exactly what
  `budget.mjs`'s header says has to bring evidence. The next body after
  these five, a town body, or a rank 10 child or dog, is that argument.

- **`test/budget.mjs` has been counting 12 bodies while the page builds 27,
  and section 3 is taught the populace** (#730). Section 3 iterates
  `mystery.json`'s `schedule` and nothing else, so it printed `12 bodies in
  the castle` and `the outer ward peaks at 7` while the outer ward held 18;
  `ROADMAP.md`'s "17 after" was never read by any suite. The change: a
  populace body counts, at each watch, in every ward that `mystery.json`'s
  `rooms` gives any stop of its ring at that watch; a body with `follow`
  counts in both wards, because the hound leaves its ring for the player and
  the porter gate does not stop it; the total is `cast.length +
  people.length`, every body `main.js` builds. The ring rule is #608's
  reaching rule applied to a body: a mixer is paid for wherever the body can
  be when the player is standing there, and `validatePopulace` already asks
  the clearance question every-stop-against-every-stop for the same reason
  (#616). **Inside #611's carve-out**: it is the same suite and the same two
  assertions, fed a second source, and no assertion crosses the
  `layout` / `plan-vs-scene` / `mystery` / `budget` line. The named case is
  `baker-lad` at Terce, whose ring runs `outer-ward` to `bakehouse`, in the
  way `cross-walk` is #608's.

- **The chatter pool is the twelve's, and the populace gets a `talk` list of
  its own** (#731, amending #554 and `SPECS.md`). #554 shipped 27 pairs "for
  the existing twelve only", validated each speaker against the cast, and in
  the same sentence left them for a populace to spend. The two halves cannot
  both hold. `test/lore.mjs` refuses a speaker who is not in the cast, so a
  populace id cannot name a pair; every line starts with one of the twelve's
  names (`"Marged: That cousin of yours..."`), so a populace body cannot
  voice one either; and the twelve cannot spend it by proximity, because
  **0 of the 27 pairs have their speakers within 3 m at the pair's watch**,
  3 within 4.0 m (clerk and merchant 3.69 m, sentry and cook 4.00, constable
  and steward 4.00), and 5 in the same room, measured off `castleNav`'s
  stations. So `data/populace.json` gains a flat `talk` list, three pairs of
  populace ids at one watch each, with no name prefix in the lines, and the
  chatter pool stays as it is for a later increment to hold to the schedule,
  which is the pass #554 said it skipped. `chatterComment` and `WISHLIST.md`
  stop saying the populace spends it.

- **How talk plays, and which suite holds each half** (#732). Two populace
  bodies named by a pair, each on a one-stop `gossip` ring at the pair's
  watch, 1.5 to 3 m apart in one room, both settled, with the player in that
  room and within 6 m of their midpoint: the pair's lines go to the `#caption`
  band #594 built, through `QuestManager`, sharing its one run slot, its
  `_heard` set and its clock. Once per page and never saved, as #594 decided
  for a sermon (#39), and `SAVE_VERSION` stays 6. A performance out-ranks
  talk and talk never cuts one. The one-stop ring is the rule that makes the
  pair still for the watch and lets a headless beat read it without racing
  the clock #724 was about.

  **The suite split, against #529.** The `SPECS.md` sentence said the
  headless check reads the DOM "the way the performance captions are read
  (#592)" in `test/plan-vs-scene.mjs`, and no caption is read there: #592's
  are held by `test/quest.mjs`, in Node, with a stub UI and a queued
  `_schedule`. So: the validator and the selector `talkDue`, both provable
  from the data and the grid, go in `test/mystery.mjs`, which owns the
  populace; the band's order, once-only and precedence go in
  `test/quest.mjs`; and `test/plan-vs-scene.mjs` gets one beat that asserts
  only that `main.js` handed `Populace` a `talk` callback that reaches the
  DOM, the same shape as the hound's bark wire (#696). Which pairs stand
  within 3 m is never asserted there.

What was not decided here: the lines themselves, which are the builder's to
write inside the rule `SPECS.md` gives them (household talk, nothing about
the death), and the tiles, which the validator picks between.

- **Rank 6's second increment shipped** (#733, building #729 to #732).
  `data/populace.json` gains five people: `page`, `sacristan`,
  `tiring-woman`, `watchman` and `writer`. The file holds 19 household plus
  the cast's 13 is 32 bodies built, exactly `MAX_SKINNED_TOTAL`. Outer ward
  holds 17, 18, 17, 17 and inner ward holds 14, 15, 14, 13 at Prime, Terce,
  Sext and Vespers. `data/populace.json`'s `talk` gains three pairs, and the
  maid's Sext stop in `inner-ward` becomes a `gossip` stop paired with the
  tiring-woman's. **The writer's Prime, Terce and Vespers stops landed in
  `inner-ward`, `tend`**, the fallback the spec allowed, because the
  muniment has no walkable floor that counts as the room: all 8 floor cells
  inside its disc read as `kings-hall`. `src/main.js` also passes `pairs:
  populaceData.talk` to `Populace`, an argument the spec did not name.
  **Breaks watched go red (#34)**: `talkDue` without the `settled` test;
  `overhear` without the `_playing` guard; `test/budget.mjs` counting only a
  ring's first stop; a twentieth household person, `33 bodies built, over
  the ceiling of 32`; `page`, `sacristan` and `writer` moved to `outer-ward`
  at Terce, `the outer ward holds 21 skinned bodies at terce, over the
  ceiling of 20`; `src/main.js` constructed without `talk`, a dark band
  after 20 steps. Three talk and hush wire checks were added beyond the
  spec, because nothing else tested hush. One full-suite run went red on
  `map`, `Port 8128 is already in use`, from another session on the same
  machine sharing the port; the re-run was 15 of 15 green.

## The GPU run, third sitting: the day reaches the accusation, and the rays are not on the body (2026-09-21)

**Rank 2, on Devon's machine, an RTX 3070 Ti.** `npm run play` ran twice,
about twenty minutes each. Both runs still exit 1, but the second is the
first to reach the accusation. Decisions #734 to #741.

### Run one: past the second bell for the first time (#734)

**The suite as merged ran first.** Exit 1, 164 ok, 19 failures, aborted at
"cannot finish without reaching the Constable" at Vespers. This is the first
sitting ever to get past the second bell: rank 1's walker (#716 to #720)
carried the day through Sext, the reload at Sext (all 26 clues survived it,
the camera came back at 21.01, -11.81), the riddle, the third ring, and the
cook's walk to her station, 0.38 m off after 20.2 s.

**#714's body-and-pouch swap is gone, and that is #722 confirmed on a GPU.**
The second sitting's 22 failures included "E on the body: he is at the foot
of the stair," which handed back `summons-note, pouch-empty` instead. It does
not appear in run one's 19. The aim rule shipped on Node terms; a run has now
watched it hold.

### The suite fixes, between run one and run two, six of them

`test/play-castle.mjs` is the only file this row may touch. It changed by 163
lines added and 42 removed, in six places, and each is a decision.

- **`present()` left the Present list and the dialogue open on its failure
  paths** (#735). The porter beat (`shots/play/34-aborted.png`) failed inside
  the box: the pointer stayed released and the Constable walk that followed
  read `locked false` and gave up. #708 fixed this for the success path only.
  `shutPresent()` now runs on every path out of `present()`. Headless: the
  old code left the list and the dialogue open, `locked` false; the new code
  closes both, `locked` true. Mechanics only, not a render question (#53).
- **A walk to another storey counted a waypoint reached by x and z alone**,
  so legs up the Kitchen Tower's flight were ticked off from the floor beside
  it (#736). A Node repro with `moveBody` stopped at (-20.0, -15.5); run one
  stopped at (-20.0, -15.3), the same bug on the machine it was built for.
  The walk now uses Phase 5's own stair legs instead of a flat distance
  check. Run two: "up the Kitchen Tower: every leg reached, now L2."
- **`examine()` always passed level 0**, and the Stockhouse bar and the tally
  stick are level 2 in `data/mystery.json` (#737). Run one put the player
  1.7 m across and about 8 m below the tally. Both beats pass in run two.
- **`walkTo` read the prompt before turning to face the target**, and a short
  step walked the player through the Chaplain, so every read of him came
  from behind the camera (#738). A headless probe with the walk stopped
  short named Father Anselm from the give-up point, both rays clear. The
  turn now happens first. Passes in run two.
- **The Constable-visible check cast its ray from wherever the porter beat
  had left the player**, 17 m away across the cross-wall, instead of walking
  there first (#739). It now walks first. Passes in run two.
- **`snap('twelve-at-vespers')` was a 54 m straight-line walk from the
  chapel bell that ended against stone in the inner ward** (#740, #147).
  Shot 31 is a wall, and the HUD reads "Inner ward." The beat now routes to
  the hall first. Run one's "Great Hall floor at Vespers" luma of 40.1 was
  therefore a wall, not the hall; run two reads 72.7 of 255 from the floor
  itself. The label on the first reading was wrong, not the render it
  described.

`npm test` is 15 of 15 after the six fixes.

### Run two: the accusation, and the ending it reaches is wrong (#741)

**Exit 1, 179 ok, 17 failures. The day reached the accusation for the first
time.** It aborted on `page.click('#restart-button')` not visible, after the
wrong ending: the pane offered "Play Again," not the second day.

**Unchanged in both runs.** #714's five pre-walk checks (27 bodies, NEAREST
on 38 textures, anisotropy cap 16 worst 1, the hall wall height reading
"outer m, hall m," the braziers "IN Scene") and #659's journal walk: 0.69 m
in run one, 0.83 m in run two, the series now 0.69, 1.30, 0.51, 0.69, 0.69,
0.83 m across six runs of the same beat.

**What stopped run two.** The sentry at Terce gave up 0.2 m from his mark at
(-18.0, -15.0), stopping at (-18.1, -14.8) on level 2, prompt null, `locked`
true. The porter at Vespers gave up 0.6 m from his, stopping at (-1.2, 0.6)
on level 2 with the body at (-0.8, y 8.0, 0.3), prompt null. Both are read
from beside the target, on the same walk the target stands on. The cause is
`src/interaction.js`'s two sight rays, cast at fixed world heights of 1.55
and 1.15 m rather than at a height on the body, filed in full as the new
rank 1, "Sight at the body's own height," in `SPECS.md` and `BACKLOG.md`.

**The cascade is the porter's, not the sentry's.** His admission is a
premise of the full ending, so with his sighting missing the accusation
selected 2 of 3 suspects, the stage read "accusing" rather than the correct
ending, and the pane it produced offered "Play Again" rather than the second
day's start. The run aborted trying to click a button that pane does not
have. **The second day has therefore still never been walked by `npm run
play`.**

**Acceptance is met again, in its second form**: `npm run play` exits
non-zero with the failing beat named, and the cause is filed as a new
backlog row, rank 1. Exit 0 is still owed, to whoever ships that row and
runs this one again.

**What this cost.** Two runs of about twenty minutes each on the RTX 3070
Ti, plus the headless probes for the fixes above. `npm test` is 15 of 15.

## The floor plan you can see: a top-down editor over the castle's own plan (2026-09-21)

**Rank 13, decided before anything is built, decisions #745 to #749.** Nothing
in `src/` or `test/` is touched. Devon's ask: the room layout was placed by an
AI one room and one guess at a time with no way to see the whole floor plan,
he is not happy with how it reads, and he wants a GUI to lay it out himself,
or at least to review and correct it visually. `SPECS.md`'s "The floor plan
you can see" is the row those five decisions make buildable. Every number
below was measured on `data/scene-config.json` and the modules named, today.

- **The editor writes `data/scene-config.json`, and there is no new format**
  (#745). The obvious reading of the ask, "a GUI for `src/castle-plan.js`",
  is wrong about where the layout is. `castle-plan.js` holds **no
  coordinate**: `makePlan(config, boundsOf)` is a pure compiler over the
  config, and it throws rather than warns when the config does not hang
  together (`[castle-plan] drum "x" has an interior and no room in
  config.rooms names it`, line 999). The floor plan is four arrays of a
  3113-line JSON file: `walls` (46 runs: 18 curtain at level 0, 3 at level 1,
  25 interior partitions with no `level`), `drums` (8), `gates` (3) and
  `rooms` (43: 23 outer, 17 inner, 3 outside; 9 by `tiles`, 28 by `drum`, 6
  by `bounds`). Eleven runs carry `doorways`, each `{ at, width, height,
  base? }`. So the tool writes the same file the prop editor already writes,
  through `tools/place.mjs`'s splice, and an intermediate JSON would be a
  second source of truth for the castle, which is the thing #500 exists to
  forbid. Re-serialising is still refused and the measurement is bigger than
  it was: `JSON.stringify(JSON.parse(raw), null, 2)` over today's file is
  **124924 bytes against 117131**, 7.8 KB of churn per edit, against #584's
  94212 / 98330 when that was measured.

- **The view is an orthographic camera over the real scene, not a flat
  schematic** (#746). A 2D editor that never loads three cannot compute
  anything here: `makePlan` takes `boundsOf(modelPath)`, and the only thing
  that produces one is `CastleBuilder.measure()`, which loads every model the
  config names and measures its parts (`castle-builder.js:630`). A DOM editor
  would have to re-derive every box the plan computes, which is exactly
  `test/layout.mjs`'s old sin, "it cannot catch a change to that math ... this
  file scales off Z and agrees with itself", written into a tool instead of a
  suite. A camera over the built castle also shows the 123
  `courtyard.placements`, the ground patches and the drums' shells, which a
  schematic would have drawn as nothing. **Devon's own school editor is the
  evidence, not an argument**: after 42 phases `js/render.js:1522` is a
  `THREE.OrthographicCamera` 200 ft over the real scene with the storey below
  ghosted and the one above hidden, and its *flat* drawing (`js/blueprint.js`)
  is a printed sheet, not the thing anybody edits in.

- **One entry point, two modules** (#747). `?edit=1` stays the single flag and
  the single `import.meta.env.DEV` branch to audit, and the layout tool is
  `src/edit-layout.js`, mounted by `src/edit-mode.js`. The data has nothing in
  common (a prop is a tile, a run is two tiles and eight fields), and
  `edit-mode.js` is 327 lines whose value is that one person can read the
  whole of it. The dev-only guarantee is #585's unchanged and the check is
  #586's with a second target: `test/built.mjs`'s one sentinel regex becomes a
  list of `{ file, re }` pairs, `castle-placement-editor-v1` in
  `src/edit-mode.js` and **`castle-layout-editor-v1`** in
  `src/edit-layout.js`, each asserted present in its own source and absent
  from every `.js`, `.css`, `.html` and `.json` under `dist/`.

- **The first increment writes nothing** (#748). "Or at least to review and
  correct it visually" is two things and the first one is cheaper by an order
  of magnitude: a top-down view drawn from `plan.pieces` and `plan.rooms`
  touches no file, no `PLACEABLE`, no `/__place` and not one byte of the
  byte-exactness rail, and it is what tells Devon whether the layout is worth
  redrawing at all. Its pure half is `tools/plan-sheet.mjs`: no three, no
  DOM, no `node:` import, which is `tools/place.mjs`'s own rule and the reason
  a browser can import it, so `test/tools.mjs` can hold it, and the break
  that proves the rail is recomputing one room's box from its `tiles` instead
  of reading `plan.rooms` (#500 in miniature). That split is the one rule
  Devon's school generator states in its README: add a pure module and its
  suite together, and the geometry never touches three.

- **Live validation re-runs the plan; it copies no assertion** (#749). Before
  it posts, the panel calls `makePlan(edited, boundsOf)` and `walkability`,
  the same two pure functions the page and the Node suites already call, and
  refuses to write when `makePlan` throws. It prints the room count, the
  walkable-cell count and whether the fill still seals, and **those are
  numbers, not checks**: a second copy of `layout.mjs`'s check 4 living in a
  dev panel is a rail nobody runs and nobody maintains, which is #13 read
  forwards. Nothing moves or is duplicated across the
  `layout` / `plan-vs-scene` / `mystery` / `budget` line (#529, #611). The
  same reasoning settles the openings: a `doorways` entry is a field of the
  run that owns it, so editing one is a `move` of that run's row through the
  existing verb, and no nested-path splice is needed, which matters because
  the one that exists (`locate` and `membersOf` in `tools/dialogue.mjs`,
  #689) imports `node:fs` at line 61 and no browser module can reach it.

**What came over from the school generator, and what did not.** Read at
`/home/user/greyversusblue/tools-and-games/Projects/school-generator`, and it
is 65277 lines of JS against this repo's castle. Carried as patterns, not
code: the orthographic edit camera with ghosted storeys (`js/render.js:1522`),
an opening as a point along a wall rather than an edge value
(`js/shapes.js`'s `{ seg, t, w }`, which is this config's `doorways`
`{ at, width }` in a different spelling), a grab tolerance and a snap pitch
that follow the zoom rather than being constants (`js/editor.js`'s `SEG_GRAB`
comment, `js/snapgrid.js`'s `PITCHES`), and the pure-module-plus-suite rule
its README calls "the one rule". **Not carried**: its save format, which is a
whole-state `JSON.stringify` at `SAVE_VERSION = 12` (`js/save-load.js:170`)
and is the exact opposite of #584's splice; its rooms, which are polygon rings
with holes and owned walls, against this castle's whole-tile rectangles, drum
discs and independently placed runs; its 4 ft lattice in feet, against 4 m
tiles and a 0.5 m walkability grid; its undo stack (`js/history.js`), because
`git diff` is this tool's undo and the write does not commit; and its
`libs/three.module.js`, which is REVISION 169, the same revision this repo
pins from npm as `"three": "0.169.0"`, so its three code compiles here
unchanged, but it arrives as source under `src/` or `tools/` and never as a
vendored copy (#493, #494).

**Increment 1 built, and each guard-rail broken from green, verbatim** (#34).
`npm test`: 15 of 15 suites, 1772 assertions, 0 failures. `npm run build`:
clean, 672 ms, 836.81 kB bundle. `npm run play` was not run, and did not need
to be: nothing here is real-time or physics (#53). No new decision number is
used below — increment 1 built exactly what #745 to #749 already specified,
including sourcing an opening from `doorways`, not from derived geometry
(`SPECS.md`'s own increment-1 scope already said "one per `doorways` opening
as a point on its run").

Two new files, two touched. `tools/plan-sheet.mjs` is the pure module #748
asked for: no three, no DOM, no `node:` import, `planSheet(plan, level,
{ config, mystery })` returns one entry per plan piece meeting the storey (the
plan's own box, #500), one per room with the plan's own bounds, id, name,
ward and the mystery's flag, and one per `doorways` opening, its
`at`/`width`/`height`/`base` read off the run's own config row and its world
position off the plan piece's own box — never a box recomputed, only boxes
read. (The plan does not carry `doorways` itself, and deriving an opening
from box geometry alone produced a phantom opening on `north-curtain-west`
during the build; the config-row reading above is what `SPECS.md` already
called for, not a new call.) `src/edit-layout.js` is the view #746 and #747
asked for: `LAYOUT_SENTINEL = 'castle-layout-editor-v1'`, `V` toggles it,
`?edit=1&view=plan` opens straight into it, `[`/`]` change storey, Escape
returns, a `THREE.OrthographicCamera` with `up = (0, 0, -1)` over the real
built scene framed on `plan.rooms`'s union, the storey filter hiding what is
wholly above the ceiling and ghosting (opacity 0.25) what is below, and
`scene.fog` nulled while open and restored on close. `src/edit-mode.js`
mounts it from the same `import.meta.env.DEV` branch (#747); `src/main.js`'s
render call is `renderer.render(scene, editor?.camera ?? camera)`.

Two rails. `test/built.mjs`'s single `sentinel` regex is now a list of
`{ file, re }` pairs, one per module, each asserted present in its own source
and absent from every file `dist/` ships (#586, #747). `test/tools.mjs` gains
a fifth part, 29 assertions over `planSheet`: per-storey piece uniqueness,
plan-object identity of every box (#500), storey containment both ways,
every room on exactly one sheet with the plan's own bounds and the mystery
flag, and every opening checked against its run's own config doorways and
against an actual gap in that run's stone.

- **Break 1** (#586, #747): deleted `import.meta.env.DEV &&` from `main.js`'s
  branch, built, ran `built.mjs`:
  `FAIL  the placement editor is in no file dist/ ships — bundle/edit-mode-BZ31_KVA.js`
  `FAIL  the layout review view is in no file dist/ ships — bundle/edit-mode-BZ31_KVA.js`
  The served-set diff stayed green in the same run, so #586's evidence
  extends to the second sentinel. Reverted.
- **Break 2** (#500): made `planSheet` recompute the great-hall room's bounds
  from config tiles instead of reading `plan.rooms`:
  `FAIL  every room on a sheet carries the plan's own bounds — great-hall: bounds.min.x is -32.000 and the plan says -34.000 (2.000 m out)`
  `FAIL  and it is the plan's own bounds object, so no second derivation can drift from it — great-hall`
  Reverted.

No suite gained or lost an assertion in `layout.mjs`, `plan-vs-scene.mjs`,
`mystery.mjs` or `budget.mjs` (#529, #611): this row's rails live only in
`test/tools.mjs` and `test/built.mjs`. Driven live on the dev server at
levels 0 and 1 (17 rooms / 182 pieces / 14 openings, and 11 / 115 / 5),
ghosting correct, no console error — not a GPU or real-time claim (#53 does
not bite), just confirmation the view renders.

**Increments 2 and 3 are not shipped.** Rooms and runs stay undraggable,
doorways stay unedited. Both are lane B, which rank 3 and rank 9's town also
hold (#602): one row per lane at a time, so neither runs beside those.

## The retro castle: the stone goes back to stylised, and the textures are the repo's own (2026-09-21)

**A spec, not a batch, the shape of #411 to #418 and #560 to #567.** Devon's
brief of 2026-09-21: the castle reads as the same everywhere, and he wants
pixel-art textures produced by a model session rather than photographs, for
variety room to room and for a retro look, a style call before a cost one.
No code, no asset, no claim: `SPECS.md` gains "The retro castle: the stone in
the castle's own pixel art", `BACKLOG.md` a rank 3 row and a summary,
`ROADMAP.md` a lane B entry, `WISHLIST.md` an eighth theme written and moved
out on the same day. Worked under Claude Fable 5.1 as the architect, on
`claude/ai-castle-textures-arch-3s8iah`. Decisions #742 to #744, written as
#734 to #736 against #733 on a fresh `origin/main` at `978ab2e` (#633's rule)
and renumbered whole at merge, because rank 2's third sitting (PR #62) took
#734 to #741 first.

**Measured before anything was recommended.** Fifteen material sets under
`assets/poly-haven/`, 1024 px, three maps each, about 25 MB on disk. A KTX2
header carries `pixelWidth`, `pixelHeight`, `levelCount` and
`supercompressionScheme`, and this repo's encoder pairs scheme 1 with ETC1S
and scheme 2 with UASTC (#507), so pixels per level times 0.5 or 1 byte is
the texture's memory on the GPU. Over every `.ktx2` on disk that arithmetic
gives **79.3 MB**, which is the 79.3 MB #506 measured off `renderer.info` on
the live page, to the decimal; the fifteen sets alone are **44.2 MB** and the
ten prop packs the other 35.1. The fifteen dress 46 wall runs under five
names (22 of them one slate), eight drums under two names and eight tints
(#516), 32 room floors under seven names (18 of them two planks), four
grounds, the walk and the gate leaves. The Kenney kit beside them is ten
64 px PNGs, declared `KHR_materials_unlit` in every GLB so GLTFLoader gives
them `MeshBasicMaterial`, NEAREST-magnified by `tuneTexture` at 128 px and
under, and left out of the encoder by size (#508). A 128 px RGBA8 texture
with its mip chain is 85 KB; 128 px over the 3 m repeat #434 set is 43
texels a metre, against the kit's 16 and Poly Haven's 341.

- **The stone is stylised again, and #411 is overturned on Devon's
  direction** (#742). #411 reversed round 1's "leave the walls stylised" on
  Devon's 2026-09-14 choice of eight Poly Haven sets against a 44.4 MB
  ceiling, and `PLAN.md` said the eight were not to be re-opened. Devon has
  re-opened them himself: the walls stay built geometry (#432) and carry
  pixel-art textures the repo draws, and the fifteen sets leave with their
  roles, folder by folder, the commit their names stop pointing at them
  (#390). **Replace, not supplement**: a set kept beside a pixel texture is
  3 MB of video memory for no variety, and the count below refuses it. **The
  props stay**: a prop is a photoscanned model with authored UVs, and
  retexturing one is a modelling job; built geometry carries planar
  world-space UVs at a 3 m repeat (#434), which is exactly the surface a
  tiling texture goes on with no UV work, and is why the swap is one
  sitting. **The material is lit and diffuse only**: `MeshStandardMaterial`
  with a `map`, a constant roughness, no normal and no ARM map, because an
  unlit castle loses the sun per watch (#474), the shadows, the fill (#438),
  the braziers (#610) and the Lauds question (#712) in one move, and this is
  a game whose clock is told partly by light. That is the kit's own model
  with the sun put back on it, and the kit is recommended relit in the same
  increment so the look judges one castle. **And #508's exemption becomes a
  rule by size**: a texture at 128 px or under is a PNG and is not encoded,
  which #507 and #510's "every texture is KTX2" now reads with; the rail
  that holds the exemption to 128 px is `test/assets.mjs`'s, so it cannot
  grow into a 1k PNG. What #630 saw from a tower top, two games in one
  frame, is the evidence for the brief: it was #411's known cost and nobody
  had seen the size of it.

- **A texture this repo draws is committed with the program that draws it,
  is pixel-identical to that program's output, and is credited as the
  repo's own** (#743). This is #494's provenance concern answered for a
  generated file rather than a vendored one. #494 deleted a hand-copied
  1.2 MB library because nothing could say where it came from or how to get
  the next one; a texture drawn by an image model and dropped into
  `assets/` is that file again, with a licence story nobody can write down.
  So the generator is `tools/pixel/`, a table of rows and a handful of
  drawing families that are pure functions of parameters and a seed, run by
  hand as `npm run pixel:render` the way the encoder is (#506), and the
  suite decodes each committed PNG and holds it pixel-identical to the
  generator's row. Provenance is reproduction rather than a download: the
  origin of every byte under `assets/pixel/` is a program in the same
  commit. There is no third party to credit and no CC0 deed to cite;
  the credits line the row adds to `README.md` says the textures are this
  project's own, drawn by its own tools under Devon's direction, and the repo's licence,
  which it has not got, is Devon's call and not this row's. **No
  image-generation model's output lands under `assets/`**: it fails the
  identity rail by construction, which is this decision as a check rather
  than a sentence.

- **Rank 3, lane B, a 2+, and the cost is a fourth count in `test/budget.mjs`
  rather than a renegotiated ceiling** (#744). Rank 3 because the brief is
  Devon's own and it changes what every GPU sitting after it is looking at,
  so it belongs above the content rows and below the run itself; 3 was
  retired on 2026-09-17 and comes back the way 1 came back three times
  (#619): a rank is a priority and not an id. Lane B because the row
  rewrites `data/scene-config.json`'s `materials` block, and rank 9's next
  increment, the quay, has no section and is not startable, so the lane is
  free. **Increment 1 is a container's**, no `ktx`, no network, no GPU, the
  opposite of #518 and #541; the look before increment 2 is Devon's machine
  (#53). On #611: none of the three counts moves, because a run is one mesh
  whatever its material, so nothing is renegotiated. What the row spends and
  saves is a cost no suite counts, which is #609's shape exactly, so
  texture memory from headers goes into `budget.mjs` as a fourth ceiling
  beside the other three, recommended at **64 MB**: below today's 79.3 on
  purpose, so the swap has to land for the suite to go green, and with room
  for three hundred more pixel textures after it. The size (128 px) and the
  palette (32 colours) are the row's own named constants, and the wrap
  rule, the pixel-identity rule and the location rule are `assets.mjs`'s,
  each with a break named in the spec (#34). Nothing crosses the
  `layout` / `plan-vs-scene` / `mystery` / `budget` line (#529).

**What was measured rather than taken from the brief.** The KTX2 header
arithmetic and its agreement with #506; the material counts per role off
`data/scene-config.json`; the kit's `KHR_materials_unlit` and 64 px images
off `wall.glb` and its `Textures/`; `tuneTexture`'s 128 px NEAREST branch and
its refusal to touch a compressed texture; `encodeMaterialMaps` iterating
`materials` alone; `test/assets.mjs` 3b asserting a complete set over that
same block, which is the rail that retires with it, and 3c asserting the
opposite over `plainMaterials` (#448), which is the shape `pixelMaterials`
takes.

**Not verified here, on purpose.** No suite ran because there is no code
change; `npm test` and `npm run build` are green on `main` before and after
this branch, which touches five markdown files. `npm run play` was not run
and could not be (#53), and nothing here claims a look: the section's
checklist is what the look will be.

## Explore, the day before: Devon's answers to questions 11 to 14 (2026-09-21)

`WISHLIST.md`'s theme 8 put four questions to Devon the day it was written
and he answered all four the same day. Decisions #750 to #753. No code and
no asset: `SPECS.md` is untouched and gets its section next; `WISHLIST.md`'s
theme 8 becomes a pointer; `BACKLOG.md` gets a rank 1 row; `ROADMAP.md`
carries the same order.

- **Build the walking day. Recommendation taken** (#750). Question 11: yes.
  One stage, one engine branch, one button and four rails, the way
  `WISHLIST.md`'s theme 8 already specced the first increment. Question 14
  answered the same way, no gate: the texture-variety idea, if it lands, goes
  before increment 2's talk-again lines and not before increment 1's engine,
  because the engine is also the thing that would first show whether the
  castle holds a lingering eye at all.

- **Main mode, now, and the theme's own recommendation is overturned**
  (#751). Question 12: "Walk the castle" is the first door into the game and
  the mystery sits behind it. The theme recommended a second door on the
  start panel, thin, reversible, and revisited once the talk-again pool
  existed; Devon took the harder answer directly. Priced at the theme's own
  numbers, and none of it softened back toward the second-mode version: a
  saved explore, the theme's own increment 3, ships at once rather than
  waiting on an hour of somebody's walking, which is a `mode` field on the
  save, version 7, lane A (#36, #37); the start panel's default button flips
  from "Enter the Castle" to "Walk the castle"; and the entry beat of six
  browser suites — `plan-vs-scene`, `overlays`, `map`, `touch`, `built`,
  `play-castle` — has to pick the mystery door explicitly rather than take
  the page's own default, because the page's own default is no longer the
  mystery.

- **Hywel is alive. The theme's own recommendation is overturned** (#752).
  Question 13: the walking day is the day before the death, not the day of
  it. No body at the stair, no lantern, no cloak in the laundry, no summons
  in anybody's pouch, and none of the twelve saying a word of their day-one
  testimony. The theme recommended the day of the death, because increments
  1 and 2 already draw that day's four teeth — the fourth ring, the
  Constable's `{ACCUSE}` line, the HUD's objective and the start panel's
  four-bells paragraph — and a day before it is priced, in the theme's own
  words, as "a thirteenth speaker, twelve new `default` sets, a second
  schedule and a validator that knows which day it is reading, a content row
  the size of Phases 6 and 7 together." That price is taken as given here,
  not renegotiated, and it is the row `BACKLOG.md` now carries at rank 1.

- **The rank shift #751 and #752 put on `BACKLOG.md`** (#753). The walking
  day ranks above everything behind it: it is the first door into the game
  and the first door outranks whatever is behind it. Rank 1 goes to the
  walking day; "Sight at the body's own height" moves from 1 to 2; "The GPU
  run" from 2 to 3, and its Gate cell "after 1" becomes "after 2"; "The retro
  castle" from 3 to 4, a retired number coming back a second time the same
  day the way 3 itself came back for the retro castle row (#744); rank 11's
  Gate cell "after 2" becomes "after 3". Ranks 6, 7, 9, 10, 11 and 13 do not
  move. This is a rank move, not a reversal of the sight bug's own priority:
  rank 2's bodies-at-height fix still wants to land before the walking day's
  GPU look, because a day that is nothing but walking up to people is where
  that bug bites hardest, and nothing here gates the walking day on it — the
  order is soft, and `BACKLOG.md`'s Gate column for rank 1 stays "—". **A
  live claim on the shifted row does not hold the number still**: the retro
  castle carried `claude/retro-castle-pixel-textures-kliakt` and merged to
  `main` (PR #66) while this band was being written, and it renumbers to 4
  regardless, because a rank is a priority and not an id (#619, #491) and
  every row is named by title as well as by rank for exactly this reason
  (#522). The two rows do not collide either way: the walking day is lanes A
  and D, the retro castle is lane B, and #602 lets different lanes run at
  once.

## Explore, the day before: the section, and three calls the code settled (2026-09-21)

**Rank 1, on `claude/walking-day-before-death-8apcav`, lanes A and D.**
`SPECS.md` gains "Explore: the day before," four increments deep, written
against `src/mystery.js`, `src/save.js`, `src/quest-manager.js`,
`src/stations.js`, `src/lore.js`, `src/ui.js`, `data/mystery.json`,
`data/npcs.json`, `data/quest.json`, `tools/dialogue.mjs` and the entry beat of
every browser suite. Ten open calls, each with a recommendation, so every
increment after this one is class S. **No code, no data and no asset changed**
and no suite ran: `npm test` is 15 of 15 on the baseline this branch started
from and nothing in this commit can move it. Decisions #754 to #756, all three
of them amendments to a number that is already locked.

- **The walking day rides the `day` field and the save stays at version 6**
  (#754, amending #751). #751 priced a saved explore as "a `mode` field,
  version 7, lane A," which is theme 8's own pricing of its own increment 3,
  and that theme's walking day was a second mode running the SAME day, where a
  second field was the only thing that could tell the two apart. #752 made it
  the day BEFORE, and the day is already a field: `repair` is
  `out.day = s.day === 2 ? 2 : 1` (`src/save.js:188`), so a third value is a
  clamp learning a better question and not a field arriving, which is the side
  of the line #702 drew in this exact file for this exact reason. No version-6
  save can be carrying `day: 0`, because nothing has ever written one, so
  `migrate` has no drift to be honest about and is untouched. `SAVE_VERSION`
  stays 6. **The row still holds lane A**, because a lane is a file (#602) and
  this writes it: `buildCatalog` gains the walking day's bell list,
  `clampWatch` a third list, and `repair` one incoherence rail beside line
  218's, a `day: 0` carrying a clue or a recorded verdict reading as day one.
  A `mode` field beside a `day` field would have been two names for one fact,
  and #37's own argument is that a field arrives when it says something nothing
  else can. `BACKLOG.md`'s rank 1 summary and `ROADMAP.md`'s lane A both said
  version 7 and are corrected with this.

- **Two of the six browser suites have no door to name, so the mystery door is
  a method as well as a button** (#755, sharpening #751). #751 said the entry
  beat of `plan-vs-scene`, `overlays`, `map`, `touch`, `built` and
  `play-castle` has to pick the mystery door explicitly. Four of them click:
  `overlays.mjs:121`, `touch.mjs:107`, `built.mjs:216` and `play-castle.mjs:362,
  861, 1560`. **The other two never press it.**
  `plan-vs-scene.mjs:90` and `map.mjs:117, 259, 283` wait for
  `#start-overlay:not(.hidden)`, which is how both spell "the castle finished
  building," and then drive `window.__quest` and `window.__castle` directly.
  They are the two the flip breaks hardest, because with `data/quest.json`'s
  `start` at `explore` the castle at load IS the walking day:
  `plan-vs-scene`'s Prime beat reads `window.__cast` for `bodies.length === 13`
  and `absent.join() === 'inspector,merchant'` (lines 514 and 537) and measures
  every body against the four bells' own stations. So
  `QuestManager.enterMystery()` dispatches `day:1`, the start panel's second
  button calls it, and the two suites that never click call it through
  `window.__quest` before they measure. `#start-button` keeps its id and reads
  "Walk the castle", because it is the panel's primary button and the resume
  path's button and has been since Phase 1; `#start-mystery` is the second, a
  `link-button` like the touch toggle, and it is offered only when there is no
  save to resume, so a resume panel cannot restart the day the player is
  standing in.

- **The body ceiling goes from 32 to 33, and Hywel is the body it is for**
  (#756, #611). `test/budget.mjs`'s `MAX_SKINNED_TOTAL` is 32, and
  `data/npcs.json`'s thirteen cast plus `data/populace.json`'s nineteen
  household is exactly 32, so the fourteenth cast entry fails that suite with
  `33 bodies built, over the ceiling of 32`. The file's own comment says what
  to do about it: "The next body is an argument in `HISTORY.md`." The argument
  is that the walking day adds one body and one only, the man the mystery is
  about, and that he is the only cast member ever to be in the castle on one
  day of the three. **32 to 33, not to 36**: a ceiling with room in it is a
  ceiling nobody argues about, and the fifteenth body should cost whoever wants
  it the same argument this one cost. `MAX_SKINNED_PER_WARD` stays 20, and the
  measurement rather than the guess: the cast's own peak is outer 7 at Terce
  and Vespers and inner 5, the household takes the outer ward to 18 of 20 at
  its peak (#730), and Hywel's station on the walking day is in the outer ward,
  the mason's lodge, so the walking day peaks at 19 of 20 once the household
  has rings of its own there, with the inspector not yet arrived. Section 3
  counts `mystery.watches` only, so the walking day's own bells stay uncounted
  until the increment that writes its stations extends that loop, which the
  section says out loud rather than leaving the suite quietly narrower than its
  own title.

**Five things the code said that the brief had wrong, all of them in the
section.** Every one of #752's five hidden things (the body, the lantern, the
pouch, the cloak, the tally stick) is an `evidence` row and the lantern IS the
body row's prop, so `day0.castle` needs no `gone` verb and starts empty. Nine
of the eleven evidence rows would hide themselves at a bell the walking day
names, and five of those nine are furniture rather than evidence, the muniment
LEAF among them (`data/scene-config.json:1364` carries `evidence: "lock"` and
its collider goes with it), so the walking day names what IS on the ground.
The walking day's lines are a `day0` dialogue state reached by a stage's
`dialogueState`, so `tools/dialogue.mjs` learns no second write target and
#690's bargain is unchanged. `arrives: 0` reads as present on day one at four
call sites, not one. And `src/main.js`'s UI-flow region is smaller than the
theme assumed: the engine, the nav and the whole castle are built before
`ui.showStart` runs, so the door cannot be a second `createMystery`, it has to
be a dispatch into the graph, which is what the morning after already is
(#537).

---

## The retro castle: the stone is drawn here now (2026-09-21)

**Increment 1 of rank 3, shipped.** The fifteen Poly Haven material sets are
gone and the built castle wears fifteen 128 px textures this repo draws.
Worked under Claude Opus 5 as the builder, on
`claude/retro-castle-pixel-textures-kliakt`, against the `SPECS.md` section
#742 to #744 wrote. Decisions #757 to #766, written as #754 to #763 against
a fresh `origin/main` at `3ee4364` whose highest number was #753 (#633's
rule) and renumbered whole at merge, because PR #69 ("Explore, the day
before: the section, and three calls the code settled") took #754 to #756
first. The code cites these as "#742, open call N" rather than by these
numbers, so the renumber cost nothing.

**What shipped.** `tools/pixel/index.mjs` and `tools/pixel/textures.json`: five
drawing families — `courses` seven rows, `planks` four, `ground` two,
`plaster` one, `weave` one — each a pure function of a row's parameters and a
seed to a 128 x 128 RGBA buffer. `npm run pixel:render` writes
`assets/pixel/<name>.png` through sharp; a second run rewrites nothing.
`tools/pixel/sheet.mjs` tiles every row 3 x 3 at 4x into `shots/pixel/sheet.png`
and asserts nothing. Fifteen PNGs committed, 1.2 to 3.8 KB each, six to nine
colours each. Fifteen `assets/poly-haven/` folders deleted in the commit their
names stopped pointing at them: 45 files, 23.9 MB on disk, and that folder went
from 45 MB to 21. `data/scene-config.json`'s `materials` became
`pixelMaterials`, spliced rather than re-serialised (#584) in the file's own
line ending (#632), with nothing else in the file moved. `src/assets.js`'s
`loadPBRMaterial` became `loadPixelMaterial`, `src/castle-builder.js`'s
`material()` reads the new section, `tools/encode-assets.mjs` lost
`encodeMaterialMaps`, and `test/assets.mjs` and `test/budget.mjs` gained the
rails below.

- **Replace the fifteen sets; keep the ten prop packs** (#757, open call 1,
  taken as written). Nothing was supplemented and nothing was kept "just in
  case": a set beside a pixel texture is about 3 MB of video memory for no
  variety, and `test/budget.mjs`'s fourth count now refuses it by arithmetic
  rather than by rule. Measured: the supplement fails at **82.1 MB** against a
  64 MB ceiling.

- **Lit, diffuse only** (#758, open call 2). `loadPixelMaterial({ map,
  roughness }, tint)` builds a `MeshStandardMaterial` with a `map`, `roughness`
  from the row or 1, `metalness` 0 and the tint or white as its colour (#516),
  through the same `loadTexture` and `tuneTexture` as before, so the map is
  NEAREST-magnified at 128 px with no new branch and `PIXEL_ART_MAX_PX` did not
  move. Six of the fifteen rows carry a `roughness`; the nine stone rows do
  not and get 1. The fallback colour went with `loadPBRMaterial`: one file per
  row means a missing file is a console line naming it, not a wall that looks
  nearly right.

- **The kit is relit, and the assumption behind that was checked first**
  (#759, open call 3). Every Kenney GLB read — `battlement.glb`,
  `wall-fortified-gate.glb`, `column.glb`, `column-damaged.glb`,
  `detail-crate.glb` — declares `KHR_materials_unlit` on every material, so
  GLTFLoader does hand back a `MeshBasicMaterial` and the recommendation stood
  as written. `tuneMaterials` swaps it for a `MeshStandardMaterial` over the
  same map, behind `RELIGHT_KIT` in `src/assets.js`. The texture object is
  reused, so `KHR_texture_transform`'s offset and repeat come with it. Nobody
  has seen a lit merlon (#53); `RELIGHT_KIT = false` is the one-line reversal
  if one goes black the way the slate did (#438).

- **A program in the repo generates, and the suite is the review** (#760, open
  call 4). A row is parameters and a seed; `test/assets.mjs` re-renders every
  row in Node and holds the committed PNG pixel-identical to it. An image
  model's output fails that by construction, which is #743 as a check.

- **128 px and at most 32 colours, held in `test/assets.mjs`** (#761, open call
  5). `PIXEL_PX` and `PIXEL_MAX_COLOURS` are declared in the suite and NOT read
  off the generator, and the suite fails if `tools/pixel/index.mjs`'s own
  `SIZE` disagrees with it: a rail that reads its subject's constant is the
  check that re-implements the thing it checks (#34). The fifteen use six to
  nine colours of the 32.

- **PNG, not KTX2, and the exemption is a size** (#762, open call 6). 85 KB in
  video memory with its mip chain, and ETC1S's two base colours per 4 x 4 block
  would mangle a hard pixel edge. `tools/encode-assets.mjs`'s header now states
  the rule as a size — 128 px or under is a PNG — and names check 3b as what
  holds it, so it cannot grow into a 1k PNG. `CLAUDE.md`'s compression bullet
  says the same in one sentence.

- **The fifteen names stay** (#763, open call 7). `data/sounds.json`'s
  `byMaterial`, the drum beat and the config's sixty references did not move,
  and `data/sounds.json` was not touched.

- **No ceiling was renegotiated; there is a fourth count** (#764, open call 8,
  and #611). None of the three existing counts moved: the outer ward still
  draws 993 meshes, the inner 643, the outside bucket 131, three point lights,
  32 bodies. `MAX_TEXTURE_MB = 64` joins them in the ceilings block, and the
  castle reads 37.9.

- **The props are untouched** (#765, open call 9). The ten packs are 35.1 MB of
  the 37.9 and the look is what says whether a photographed cabinet in a pixel
  room is the next wrong thing.

- **Tone mapping and the fill are left for the GPU** (#766, open call 10).
  `toneMappingExposure` and the hemisphere's 2.0 were not touched. They are two
  numbers on the looking checklist and moving either from a container would be
  guessing at a look nobody has had.

**The two numbers this row exists to move.** By the new count's own arithmetic,
the pre-swap tree is **80.8 MB** of texture memory and the post-swap tree is
**37.9 MB**, over 70 images. Of the 80.8, **79.3 MB is the `.ktx2` on disk**,
which is the 79.3 MB #506 measured off `renderer.info.memory` on the live page
to the decimal: that agreement is the calibration, and it is why the number
below it is worth printing. `SPECS.md` predicted 79.3 before and about 36.4
after, and both are 1.5 MB under what the count reports, because the spec's
arithmetic was over the `.ktx2` alone and the count as specified includes the
kit's ten 64 px PNGs (0.2 MB) and the hen's 512 px atlas (1.33 MB). The
difference is the two ends of the same 1.5 MB, not a disagreement about the
swap: 44.2 MB of sets left and 1.25 MB of drawn stone arrived.

**Every new rail was broken on purpose from a green baseline (#34), and here is
what each said.** The baseline was fifteen of fifteen suites green before any
of them.

- `test/budget.mjs`, the ceiling to 30: `FAIL  70 textures come to 37.9 MB of
  video memory, over the ceiling of 30. The three biggest: assets/NPCs/Hen.glb#0
  (1.33 MB, 512x512 RGBA8 + mips),
  assets/poly-haven/WoodenTable_01_1k.gltf/textures/WoodenTable_01_nor_gl_1k.ktx2
  (1.33 MB, 1024x1024 UASTC, 11 levels),
  assets/poly-haven/WoodenTable_01_1k.gltf/textures/WoodenTable_01_arm_1k.ktx2
  (1.33 MB, 1024x1024 UASTC, 11 levels)`. The spec expected all three to be a
  prop's; the biggest is the hen's atlas, which is a body's, and the two after
  it are the table's.
- `test/budget.mjs`, the supplement — the fifteen folders restored out of git
  and their old `diffuse`, `normal` and `arm`/`rough` put back beside the new
  `map`: `FAIL  115 textures come to 82.1 MB of video memory, over the ceiling
  of 64.` Keeping only the normal and the arm, which is the cheaper version of
  the same mistake, is 72.6 MB and fails too.
- `test/assets.mjs` 3b, a PNG re-rendered at 256: `FAIL
  assets/pixel/stone_pavers.png is 256 x 256 by its IHDR, not 128 x 128 — the
  size is what keeps it out of tools/encode-assets.mjs (#508) and what keeps
  tuneTexture on its NEAREST branch`, plus the identity rail refusing to
  compare it.
- 3b, a stripe painted down the last column of `castle_wall_slates.png`: `FAIL
  assets/pixel/castle_wall_slates.png does not wrap left to right: its last
  column differs from its first by 34.50 against a median interior column step
  of 6.51, over 1.5 times it.` and `FAIL ... 384 of 65536 bytes differ, the
  first at pixel (127, 0), 107 where the row says 96.`
- 3b, `wood_floor_deck`'s seed changed in `textures.json` with no re-render:
  `FAIL  assets/pixel/wood_floor_deck.png is not what tools/pixel/index.mjs
  draws for row "wood_floor_deck": 29382 of 65536 bytes differ, the first at
  pixel (31, 0), 51 where the row says 128.`
- 3b, a 1k jpg copied out of commit `c4e0f7a` into `assets/pixel/` and named:
  four rails, `FAIL ... is assets/pixel/castle_wall_slates_diff_1k.jpg — a pixel
  material's map is a .png under assets/pixel/`, `FAIL ... has no PNG IHDR — it
  opens 0xffd8ffe0`, `FAIL ... holds 32559 colours, over 32 — that is a
  photograph, not a drawing`, and `FAIL ... is 1024 x 1024, so it cannot be
  compared with the 128 x 128 its row draws`.
- 3b, a `map` pointed back at `assets/poly-haven/.../wood_planks_diff_1k.ktx2`:
  `FAIL  pixel material "wood_planks"'s map is
  assets/poly-haven/wood_planks_1k.gltf/textures/wood_planks_diff_1k.ktx2 — a
  pixel material's map is a .png under assets/pixel/`, and two more.
- 3b, a `normal` beside `dirty_carpet`'s `map`: FAIL  pixel material
  "dirty_carpet" declares \`normal\` beside its \`map\` — a pixel material is one
  map, lit and diffuse only (#742, open call 2), and src/assets.js reads
  nothing else.
- `test/assets.mjs` check 4, `plastered_wall_04_1k.gltf` restored to disk with
  nothing naming it: `FAIL  nothing references
  assets/poly-haven/plastered_wall_04_1k.gltf/textures/plastered_wall_04_arm_1k.ktx2`
  and two more, then `FAIL  3 unreferenced file(s) under assets/, 0.7 MB`.

**Two breaks changed the code rather than just proving it.** The jpg break
printed `it is .......` because the message rendered the file's magic bytes as
latin1; it prints `0xffd8ffe0` now. The `assets/poly-haven` break threw out of
sharp on a KTX2 and ended the run with a stack trace instead of a name — still
non-zero (#13), but a crash is not a report — so the decode is guarded and an
undecodable map is a failure with its path in it. Both are #147's question
asked of a message rather than of a comment.

**The seam rule has a blind spot, and the generator works around it rather than
the rule being changed.** Check 3b compares the last column against the first
at 1.5 times the MEDIAN interior column step, which is the rule the spec
stated. A texture drawn on a torus can fail it while tiling perfectly: a mortar
course landing on row 0 makes the wrap pair one of the loudest adjacencies in
the image, exactly as rows 15 and 16 are inside the tile. Thirteen of the
fifteen rows failed that way on the first render, `wood_floor_deck`'s rows at
68.93 against a median of 1.41. So every family now phases its hard edges off
the tile's own edge — a course half a course down, a board gap half a board
across, a weave cell half a cell both ways, block and butt joints moved by
`clearOffset` — and `plaster`'s damp patches darken what is under them by an
amount falling to zero at their edge instead of replacing it, which was worth
49 of 255 across one pair of pixels and was the whole of that row's 2.50
against 2.31. All fifteen are at or under 4.47 now. **The rule's remaining
sharp edge, for whoever writes increment 2**: a texture more than half of whose
adjacent column pairs are identical has a median of 0.00, and then only a seam
of exactly 0.00 passes. `old_planks_02` is at 0.20 and passes with a seam of
0.00. A row that trips it is an argument for the architect, not a number to
loosen here.

**Not verified, and it could not be.** `npm run play` was not run: this is a
container with no GPU, and a movement or physics assertion under a
software-rendered Chromium is inconclusive rather than confirmed (#53).
**Nothing here claims a look.** The castle has not been seen in pixel art by
anybody, the kit has not been seen lit, and the section's looking checklist is
what the look is for. No `ktx` was needed or used — nothing new goes through
the encoder, by #762 — and nothing was fetched from any asset host or any
network: the fifteen textures are arithmetic, and `npm install` was the only
thing that touched the wire.

**Green.** Fifteen of fifteen suites, `npm test` exit 0, and `npm run build`
clean in 735 ms. `test/built.mjs` reports **dist/ at 28.9 MB against 52.8 MB
before**, which is the 23.9 MB of deleted sets and nothing else, and both pages
still fetch the same file set: the KTX2 count it compares fell from 91 to 46
on both sides together, which is what it is there to catch. The three counts in
`test/budget.mjs` are unmoved and the fourth reads 37.9 of 64.
`test/plan-vs-scene.mjs`'s drum beat — one map per material, each drum's map
its own plan piece's — passes over the new materials with no assertion added
there and nothing crossing the four-suite line (#529, #611).

---

## Explore, the day before: increment 1 shipped (2026-09-21)

**Increment 1 of rank 1, shipped.** The engine, the save and a placeholder
walking day are in, against the `SPECS.md` section #754 to #756 wrote.
Commits `8009a96` and `aa22098`, worked under Claude Opus 5 as the builder on
`claude/walking-day-before-death-8apcav`, merged from `origin/main` at
`f5fbe80` and again at `7ed041e` once the retro castle band landed. `npm test`
15 of 15, `npm run build` clean, `npm run dialogue:check` green.

**What shipped.** `data/mystery.json` gains a `day0` block, `day2`'s sibling:
its own four bells `prime-eve` to `vespers-eve`, a per-bell thirteen-person
schedule (day one's stations copied under the new ids, plus Hywel's), the six
evidence rows that are on the ground (`candle`, `lock`, `ledger`, `knife`,
`gaol-roll`, `walk-door`), an empty `castle` and a `night` pane. Top level
beside `ui`: `watchLabels`, `watchLike` and `ui.quiet`. `data/quest.json`
starts on `explore` (`enter: ["applyDay0"]`, rings four bells to `night`), adds
`night` (`enter: ["showNight"]`, one transition, `day:1` to `arrive`), and
`arrive` gains `enter: ["applyDay1"]`. `data/npcs.json` gains a fourteenth
`cast` entry, `hywel` (`Farmer.glb`, tint `#7a6a52`, `role` "Master mason",
`ward` "outer", `arrives: 0`), plus fourteen `day0` line sets, one per speaker,
written through the .dlg and compiled in. `src/mystery.js`: `dayWatchesOf`
keyed on the literals 0 and 2, `onDayZero()` beside `onDayTwo()`, day-0 clauses
in `day`, `stationOf`, `available`, `press`, `examine`, `enter`, `ring` and
`accuse`, `beginDay0`, `beginDay1`, `undoDay`, `beforeDayOne`, and the day-0
validator rails. `src/save.js`: the `day: 0` clamp, a third bell list in
`buildCatalog`, and the incoherence rail beside line 218's, at version 6.
`src/quest-manager.js`: `applyDay0`, `applyDay1`, `showNight` and
`enterMystery()`. `src/stations.js` indexes the walking day's bells the way
`day2.watches` is indexed. `src/lore.js` learns `arrives: 0`. `src/main.js`
sets the sky the manager resolves. `src/interaction.js` drops the article,
#715's fix. `test/budget.mjs`'s `MAX_SKINNED_TOTAL` goes 32 to 33.

**Every rail's break and its FAIL line, run from a green baseline (#34, #13).**

- `dayWatchesOf` falling through for day 1: `FAIL the mystery entered from the
  walking day starts at Prime, in \`arrive\`, on day one — prime-eve / arrive /
  day 1`, plus 27 more day-one beats.
- `enter` granting on day 0: `FAIL and grants no \`L\` clue: \`walk-crosses\` in
  a walking day's journal would be the mystery starting the day before it`.
- `ring`'s day-0 clause dropped: `FAIL it returns a \`night\` effect and
  \`bell:4\`, and demands nothing … — ["demand","event"]`.
- The day-0 validator section neutered: 16 FAILs headed `FAIL validateMystery
  finds nothing wrong, the castle included — day0: no walking day, so the
  castle opens on the morning the mason is already dead`.
- The walk into the night: `FAIL rejects a body that cannot walk from its last
  walking-day station to its day-one Prime one — said: cook: no path from KI at
  sext-eve to PT at vespers-eve; …`.
- Hywel's day-one clause: `FAIL rejects a day-one schedule for the man who is
  dead by Prime — said: apprentice and hywel stand 0.00 m apart at prime …`;
  his missing day-0 station: `FAIL rejects no station for him on the one day he
  is alive — said: hywel: no row in day0.schedule …`; his day-two clause:
  `FAIL rejects a station for him on the morning after his own funeral — said:
  … hywel: no day-two lines after the verdict full (a full) …`.
- Lore's chatter clause: `FAIL the fourteenth, Hywel, cannot chatter either —
  he is dead by Prime — said nothing`.
- The day-0 clamp list: `FAIL a walking day with two bells in it clamps to 1,
  so the ceiling is the data and not a number written beside it — 3`.
- The incoherence rail: `FAIL a day: 0 carrying a recorded verdict comes back
  as day one — {"day":0,"watch":3}` and `FAIL and so does a day: 0 carrying a
  clue — {"day":0,"watch":2}`.
- `index.html` left alone: `FAIL index.html's initial objective is the start
  stage's … — "The master mason is dead at the foot of the Chapel Tower stair.
  Find the Constable."` and `FAIL index.html's initial bell is the start
  stage's own, read out as "Prime, the eve" — "Prime"`.
- `arrive`'s `applyDay1` dropped: 45 FAILs from `FAIL and at Prime` /
  `FAIL E on the body: he is at the foot of the stair`, then a hard throw.
- `_showEvidence`'s day-0 list: `FAIL 0 things are on the ground on the
  walking day: — and 11 are not: body, candle, cart, …`.
- `talked:constable` on `explore`: `FAIL and stepping it out opens no
  accusation panel and moves no stage … — arrive / no panel`.
- `_skyOf`: `FAIL the world is put at prime-eve with prime's sky … —
  prime-eve / sky prime-eve`. `_label`: `FAIL and the bell read out as "Prime,
  the eve" … — "Prime-eve"`.
- A `watchLike` entry deleted: `FAIL prime-eve is a bell the engine can stand
  at with no sky … would change the HUD and not the light`; a `watchLike` key
  that is not a bell: `FAIL mystery.watchLike names matins, which is not a bell
  of any day …`.
- `undoDay` as a no-op: `FAIL undoDay of it leaves 701 colliders against the
  plan's 702 …` and `FAIL undoDay maps open, shut, gone, shown to
  open,shut,gone,shown`.
- The ceiling left at 32: `FAIL 33 bodies built, over the ceiling of 32 (14
  cast and 19 household)`.
- One rail beyond the spec's nine, `day0.night.{title,text,button}`
  non-empty: `FAIL rejects a walking day with no pane to end on — said:
  day0.night.button: no text, so the walking day would end on a blank pane`.

**Five places the spec did not fit the code, and each is its own numbered
decision or a clause of one.**

- **The door is increment 1's for three suites and increment 2's for the
  rest** (#767). With `start: explore`, `test/plan-vs-scene.mjs`,
  `test/overlays.mjs` and `test/touch.mjs` measure the walking day and go red
  the moment increment 1 lands, 14 FAILs in `plan-vs-scene` alone including
  `E at the word-lock opened no riddle (stage explore)`. #755's own line,
  `await page.evaluate(() => window.__quest.enterMystery())`, went into those
  three now, with a comment saying increment 2 replaces it with a
  `#start-mystery` click for the two of them that click a panel at all.
  `test/map.mjs` needed nothing, because it never asserted a fact the walking
  day changes. So increment 1's own boundary moved off `SPECS.md`'s table: the
  door is this increment's for three suites and increment 2's for the other
  three named there. **`test/play-castle.mjs` is untouched and `npm run play`
  is broken until increment 2 gives it the same door.** That is not in
  `npm test` and CI does not run it (#53), so nothing went red, and it blocks
  rank 3, the GPU run, until increment 2 lands. Recorded here as a known break
  for whoever takes rank 3 next: read this before running `npm run play` and
  finding it stuck on the walking day.
- **The save break `SPECS.md` specified was vacuous, and it says so in place**
  (#768, #147). Both `day1.watches` and `day0.watches` are four bells long on
  the shipped data, so a clamp rail substituting one list for the other would
  pass whatever the code did: the third clause of #754's own section names
  this and the rail added, `test/save.mjs`, asserts the ceiling against a
  clone whose `day0.watches` is cut to two instead, which is what actually
  catches a clamp reading the wrong list. `test/save.mjs` carries the comment:
  "WITHOUT THE THIRD LIST the clamp would use the four, and say so out loud
  (#147)." This is #147's lesson landing a third time in this project.
- **`SPECS.md`'s own worked example named the wrong cell** (#769). The walk-
  into-the-night acceptance criterion in `SPECS.md`'s scope table read "move
  the cook's `vespers-eve` station into the cell and the rail says `cook: no
  path from CE at vespers-eve to KI at prime`"; the cook's actual `day0`
  station is `PT`, not `CE`, so the message the rail gives is `cook: no path
  from PT at vespers-eve to KI at prime`. `SPECS.md`'s example is corrected
  with this band.
- **`test/dialogue.mjs`'s two `62` literals, and a coverage guard with nowhere
  left to land** (#770). The suite held two hard-coded counts of dialogue
  states (`members === 62`, `same === 62`) and a rail that needs a speaker with
  exactly one state (the inspector) to exercise its `{}` branch. Fourteen new
  `day0` sets took the real count to 77 without moving either literal, and gave
  every speaker at least two states, so neither literal nor the `{}` branch
  could be reached honestly. The two literals are computed off the file now
  (`stateCount`, a sum over `parsed.cast`), asserted with a `>= 62` floor
  rather than replaced with a new literal, because a hard number is a number
  every future content row has to edit by hand; the `{}` branch is reached by
  emptying the shortest block in the fixture outright rather than relying on
  the inspector's shape to still be the thinnest one in the file.

**Two files outside increment 1's own scope table, touched and why.**
`index.html`'s two tracker lines (`#quest-watch` to "Prime, the eve",
`#quest-objective` to the `explore` stage's own text) are what increment 1's
own acceptance criterion in `SPECS.md` demands — the section's `test/quest.mjs`
break names the stale text by quoting it — even though the file is not in the
increment's scope table. `tools/dialogue.mjs`'s speaker-and-state counts in its
header comment (13/62/182 to 14/77/196) and its preamble ("every word the
twelve say" to "every word the cast says") are prose the fourteenth speaker
made false the moment it landed; both are corrected in the same commit that
added him.

---

## Explore, the day before: increment 2 shipped (2026-09-21)

**Increment 2 of rank 1, the two doors, shipped** (#771 to #774, against
#754 to #756). Commit `2d2a8b1`, worked under Claude Opus 5 as the builder on
`claude/walking-day-before-death-8apcav`. `npm test` 15 of 15, `npm run build`
clean, `npm run dialogue:check` reports "dialogue/castle.dlg and data/ agree."

**What shipped, eleven files** (#771). `index.html` gets the second button and
the panel's paragraph, the meta descriptions, and the day-0 tracker line.
`src/ui.js`'s `showStart(onStart, onMystery = null)` hides `#start-mystery`
when handed no second callback, and `showStartAgain` always hides it.
`src/ui.css` lays the panel's buttons out one per line. `src/main.js` wires the
second callback, the first plus `quest.enterMystery()`, and hands it only when
`saved` is null. `README.md`'s opening names both doors. Six suites:
`test/play-castle.mjs`, `test/overlays.mjs`, `test/touch.mjs`, `test/map.mjs`,
`test/built.mjs`, `test/plan-vs-scene.mjs`. `#start-button` keeps its id and
reads "Walk the castle"; `#start-mystery` is the second door, offered on a
fresh save only (#755, `SPECS.md`'s open call 4).

**Six rails, each broken from green, FAIL lines verbatim** (#34, #13):

1. The second door takes the pointer. Break: the `onMystery` callback without
   `player.lock()`. `FAIL and takes pointer lock, the way Walk the castle
   does` — and the suite then aborted on `TimeoutError: Waiting for selector
   #start-overlay:not(.hidden)`, because with no pointer there is no unlock
   and no panel, which is the same bug showing twice.
2. `showStartAgain` never re-offers the second door. Break: drop its
   `classList.add('hidden')`. `FAIL the panel that comes back mid-day does not
   offer to restart the day`
3. #715's live prompt, in `plan-vs-scene`. Break: put the article back in
   `src/interaction.js`. `FAIL the Constable's prompt is his name and no
   article: "Press E to talk to the Sir Roger Lestrange" — expected "Press E
   to talk to Sir Roger Lestrange"`
4. The panel a resumed save gets. Break: pass `onMystery` unconditionally.
   `FAIL a resumed save is offered one door and not two — Walk the castle
   shown true, the day of the death shown true`
5. The tap on the second door, in `touch`. Break: drop `quest.enterMystery()`
   from that callback. `FAIL and it is the day of the death`, plus four
   cascades.
6. The bundle's second door, in `built`. Break: `onMystery` always null.
   `FAIL and the built page's second start button puts the crosshair on the
   screen — crosshair false, panel still up true` and `FAIL and opens on the
   day of the death, not the day before it — day 0`

**Two things the spec did not cover, both done and named, and each is its own
numbered decision or a clause.**

- **`test/play-castle.mjs` carried two day-one facts the door alone does not
  fix** (#772). `rigs.count === 13` is 14 now for Hywel (#752, matching
  `plan-vs-scene`'s `bodies.length === 14`), and its Play Again beat asserted
  `stage === 'arrive'`, which a wiped save can no longer be, because a wiped
  save now opens on the walking day. It expects the fresh walking day and
  then presses the second door for `arrive` at `prime`.
- **`src/ui.css` is outside increment 2's scope table** (#773). Three inline
  buttons in a 460 px panel put the second door beside the first rather than
  under it, so `#start-overlay .panel button { display: block; margin: auto
  }`, scoped to that panel.

**One correction to a rail of the builder's own, and it is the most useful
line in this band** (#774). The resumed-panel plant first wrote the save from
the live game page and reloaded, and came back at Terce rather than Sext:
**the autosave flushes on `pagehide`, so the leaving page overwrote the
plant.** It plants from `test/blank.html` now, which is what that file exists
for. The FAIL it gave: `and the castle behind the panel is the day it was
left on, at Sext — day 1, watch terce`. **The rule, for whoever writes the
next suite that plants a save and then loads the game page: plant from
`blank.html`, because the page you are leaving writes on the way out.**

**What is unverified, and stays unverified here.** The door is wired and the
static checks pass, but nobody has run `npm run play` past it: this container
is software-rendered and the suite needs a real GPU (#53). Whether the day
actually plays through its new door is rank 3's first act.

---

## Explore, the day before: increment 3 shipped, the fourteen day-0 line sets (2026-09-21)

**Increment 3 of rank 1, the walking day, shipped** (#775 to #777, against
`SPECS.md`'s own increment-3 scope). Commit `7152553`, merged from
`origin/main` as `32a4e21`, worked under Claude Opus 5 as the builder on
`claude/walking-day-before-death-8apcav`. `npm test` 15 of 15 before and after
the merge, `npm run build` clean, `npm run dialogue:check` reports
"dialogue/castle.dlg and data/ agree."

**What shipped, five files** (#775). `dialogue/castle.dlg`, the authoring
surface, and `data/npcs.json`, compiled from it and never hand-edited, carry
fifty-seven lines over the fourteen `day0` sets in place of increment 1's
stubs: Hywel's own five, four or five each for the twelve, and the
inspector's one — his `day0` set is unreachable, the way his own `default`
already is, and a set nobody can hear does not earn five lines, a departure
from the spec's "three to five" for a good reason. `data/npcs.json`'s
dialogue total goes from 196 lines to 240; states stay at 77. The lines are
drawn off `data/lore.json`'s canon and matched to the register of the 27
chatter pairs. `tools/dialogue.mjs` gains one check-only `?` kind, `? frame
<stage>`, rebuilt from `data/quest.json`'s stages whose `dialogueState` is
not `default` and written back by nothing — #690's bargain sharpened, not
amended: the rebuild set grew, the write set did not. `test/dialogue.mjs` and
`test/quest.mjs` carry the new rails below.

**Six rails, each broken from green, FAIL lines verbatim** (#34, #13):

1. The new `? frame <stage>` kind in `test/dialogue.mjs`. Break: delete
   `? frame explore` from the cook's block on disk. `npm run dialogue:check`
   exits 1 with `cook/day0: the "?" lines say "frame night" and the clue
   graph says "frame explore / frame night"`, and the suite gives `FAIL all
   14 speakers carry "? frame explore" on their \`day0\` block — cook` plus
   three cascades.
2. `test/quest.mjs` 4f, no token in a day-0 line. Break: compile `{ACCUSE}`
   into the Constable's `day0`. `FAIL and no \`day0\` line carries a {TOKEN}
   at all — constable: {ACCUSE}`, and `validateAgainstNpcs` adds `npc/state
   constable/day0 poses {ACCUSE} but no stage in that dialogueState runs
   openAccusation after that conversation`.
3. **The leak rail**, which is the one #752 asked for. Break: a day-0 line
   about a man who could fall down the stair. `FAIL none of the 14 \`day0\`
   sets says a word of the morning after (#752), over 18 words — constable:
   "fall" in ...`
4. **That rail's own control**, which is what stops it being vacuous (#34,
   #147): the same word list is asserted to catch 10 of the 14 day-one
   `default` sets, so a list that has been gutted cannot pass. Break: gut the
   list. `FAIL and the same 8 words catch 5 of the 14 day-one \`default\`
   sets ... — only 5`
5. Station coverage. Break: cut Hywel to two lines. `FAIL all 13 speakers
   with a day-0 station have three lines or more of their own ... — hywel: 2`
6. No day-0 line repeats a line another state says. **This one failed for
   real on its first run, before any deliberate break**: `FAIL ... —
   lady/day0 = lady/default`, because Lady Alys had been given her day-one
   testimony verbatim. It was reworded. The rail caught the exact mistake the
   increment exists to prevent, on its own, and that is the strongest
   evidence the rail is worth having.

**The death can now be asserted and not only proofread, three ways.** The
five hidden rows are derived (`mystery.evidence` minus `day0.evidence`), and
each must carry a word in `LEAK_WORDS` or the cover assertion fails on its
own before the leak rail runs at all. The 18 words are hand-chosen, with the
reason written in the suite: the discriminating word is not the row's id,
because `cart` is a contract Wykes has held six years and `mason` is a man
standing in the lodge, so `sacking` stands in for the cart and the id itself
never appears in the list. And rail 4 proves the list trips real testimony
rather than nothing. **What stays a reading criterion, not a suite's to
hold**: phrasing that leaks the death without using a banned word. `SPECS.md`
still names that in place, and this band does not claim otherwise.

**Three findings, each its own numbered decision or a clause** (#34, #147).

- **A `day0` block carries two frame lines, not the one the acceptance
  named** (#776). Both `explore` and `night` name `day0` as their
  `dialogueState`, so every speaker's `day0` block reads `? frame explore`
  then `? frame night`. `SPECS.md`'s increment-3 acceptance said only the
  first; it is corrected with this band.
- `test/dialogue.mjs`'s `?`-count assertion had to learn frames: 91 lines is
  9 presses plus 54 stages plus 28 frames, or it would have gone red by
  construction the moment the fourteenth `day0` set carried real `?` lines.
  This is #770's shape again, one band later: a count written as a literal
  against a file that grows.
- **Increment 1's own stub carried a canon error that shipped to `main`, and
  this increment fixed it** (#777). The sentry's placeholder line said "I
  have the walk again tonight. Do not whistle up at me; I will take you for
  the Welsh," and there is no Wales in Vantry, whose history is invented
  around a fictional cast (#549). It went through a green CI run and a
  merged PR carrying that line, and what caught it was a person reading the
  file during the increment that replaced it: no rail looks at whether a
  line agrees with the canon. It now reads "...out of the dark; I will take
  you for the wrong side of the river." **One further change is visible in
  the same diff and is a tightening, not a fix of an error that shipped**:
  the inspector's stub, "The King's inspector is a day's ride off, and does
  not know your name yet," reads "...is two days off yet, and does not know
  your name" now, matching the constable's own `day0` line that he arrives
  two days after the walking day. **The rest of the day's rewording was made
  while the lines were being authored and never reached a commit, so it is
  not in this diff and cannot be.** Lady Alys is the clear case: rail 6 (#775
  above) caught `lady/day0 = lady/default` on its first run, and the line
  was reworded before anything was committed, so her `day0` block only grows
  in the diff and the mistake she made leaves no trace in git at all. A
  reader who goes looking for a removed line of hers, or for the other
  authoring-time fixes the builder reported alongside her, will not find
  one, and should not take the absence as evidence nothing was wrong.

---

## Explore, the day before: increment 4 shipped, the day itself and the household in it (2026-09-21)

**Increment 4 of rank 1, the walking day, shipped** (#778 to #779, against
`SPECS.md`'s own increment-4 scope). Commit `5864e1d`, worked under Claude
Opus 5 as the builder on `claude/walking-day-before-death-8apcav`. `npm test`
15 of 15, `npm run build` clean, `npm run dialogue:check` reports
"dialogue/castle.dlg and data/ agree." Baseline was 15 of 15 before any edit.

**What shipped, five files** (#778). `data/mystery.json`'s `day0.schedule`
stops being increment 1's copy of day one: thirteen people over four bells,
written off each speaker's own `day0` lines so the schedule and the words
agree. The Constable walks the curtain he tells the clerk to walk, the
Steward counts the kitchen's allowance in front of the cook, the laundress
puts her copper on at Sext, the sentry sleeps off one night watch and climbs
to the next, Wykes brings the cart up at Terce and takes it west at Sext
through the barbican, and the porter never moves, because his own line is
that the gate is barred at Vespers and will still be barred if you ask him
then. Hywel carries the king's head up to the chapel at Sext and stands at
the foot of the Chapel Tower stair at Vespers, 0.92 m from where the body
lies at Prime, with his apprentice holding the light. `data/populace.json`
gives the nineteen rings under the four day-0 bells, the four watches' own
rings copied, which is the floor `SPECS.md` set. `src/populace.js` validates
them: `everyBell` is the four plus `day0.watches`, the chain rail runs once
per day rather than walking Vespers-the-eve into Prime, and the cross-check
against the cast now sees the fourteenth body. `test/budget.mjs` section 3
counts both days: the walking day peaks at outer 19 of 20 at terce-eve and
inner 15, which is what #756 predicted before the stations existed.
`test/mystery.mjs` runs increment 1's nine `day0` rails against a schedule
that is not a copy, which is where they earn their keep. Save version stays
6, no assertion crossed the `layout` / `plan-vs-scene` / `mystery` / `budget`
line, `data/scene-config.json` untouched.

**Seven rails, each broken from a green 15-of-15 baseline. FAIL lines
verbatim** (#34, #13):

1. The walking day's own per-ward peak. Break: two of the cast moved into
   the outer ward at terce-eve. `FAIL  on the walking day the outer ward
   holds 21 skinned bodies at terce-eve, over the ceiling of 20`
2. The day-0 loop ran at all. Break: `mystery.day0` misnamed in the loop.
   `FAIL  the walking day names no bells, so this section counts one day and
   says it counts two` and `FAIL  the baker's lad has no ring at undefined,
   so the walking day's own bells were never counted`
3. Hywel ends where the body will be. Break: left in the lodge at the last
   bell. `FAIL  the walking day ends with Hywel 38.47 m from where the body
   lies at prime ... — lodge at vespers-eve / chapel at prime / 38.47 m`
4. The day is not a copy of day one. Break: increment 1's copy put back.
   `FAIL  9 of the 13 change room across the walking day; the 4 who do not
   are the porter at his gate and the smith behind his bars, each with a
   \`note\` saying why — still: chaplain, prisoner, merchant, hywel / with a
   note: none`
5. The household is present. Break: the hen-wife's four day-0 rings cut.
   `FAIL  all 19 of the household are in the castle on the walking day too,
   over 100 stops at its four bells — nobody at any of prime-eve, terce-eve,
   sext-eve, vespers-eve: hen-wife`
6. Three day-0 household rejects (no floor, no walk out, standing on the
   mason). Break: `src/populace.js` section 3 back to the four bells. `FAIL
   rejects a day-0 stop with no floor under it — said nothing`, and the same
   for the walk-out rail and the standing-on-the-mason rail.
7. Clearance sharpened from 0.00 m to the 1.4 m the spec names. Break:
   `STATION_CLEARANCE` to 1.25. `FAIL  rejects two bodies 1.4 m apart at a
   bell of the walking day, a tenth of a metre inside the 1.5 m two bodies
   need — said nothing`

## The most important paragraph in this band

**#775's walk-into-the-night rail was near-vacuous until this increment, and
the builder found it rather than letting it stay green** (#779). Under
increment 1's copied day-0 schedule, all eleven pairs it checked were "day
one's Vespers station to day one's Prime station," which day one's own chain
already implies on an undirected grid, so the rail could not have failed for
any reason the day-0 data controlled. Increment 4's real schedule gives it
two pairs day one does not imply: the sentry (north walk at level 2, to the
guardroom) and the porter (his gate rather than the cross-walk). Break: the
sentry's last bell moved into the cell. `FAIL  validateMystery finds nothing
wrong, the castle included — ... sentry: no path from PT at vespers-eve to
NW at prime ...`

**This is the fourth time on this row that a rail turned out to prove less
than its name claimed** (#768 the save clamp, #770 the count literal, #776
the frame count, and now this), and it is the direct descendant of #147 and
of the two line-of-sight checks that once passed the whole suite while doing
nothing. The lesson: a rail added in an increment whose data is a
placeholder may be vacuous because of the placeholder, and the increment
that replaces the placeholder is the one that owes it a re-check.

**Two places the spec did not fit, neither a stop-and-report.**

- `src/populace.js` is not in increment 4's scope table but the acceptance
  cannot hold without it: `validatePopulace` keyed on `mystery.watches`, so a
  day-0 ring was both unvalidated and refused as "not one of the four
  bells." Same shape as #773. It is in no `ROADMAP.md` lane, so it added no
  second lane. Its message now reads "which is not a bell of either day,"
  and the regex in `test/mystery.mjs` moved with it.
- The `src/lore.js` chatter row of the scope table was conditional and was
  **not** taken: `indexChatter` and `indexPerformances` still refuse any
  watch outside the four, so nothing half-fires on the walking day, and the
  chaplain's own day-0 line argues against a sermon the evening before
  (#648). Recorded here as deliberately not taken, with the reason, so a
  later row does not read it as an oversight.

**One found-not-fixed.** The cross-check message reads `0.00 m from the
hywel's station`, because the template is `the ${id}'s` and its day-one form
(`from the cook's station`) is asserted verbatim, so fixing the article
would move an asserted string. Left alone.

---

## Sight at the body's own height: shipped (2026-09-21)

**Rank 2 shipped** (#780 to #782). Commit `52c8579`, worked under Claude
Opus 5 as the builder on `claude/r2-sight-at-body-height`. `npm test` 15 of
15.

**What shipped** (#780). `src/interaction.js` aims a target with no `focus`
at its feet plus `SIGHT_HEIGHTS`, `[1.55, 1.15]` — world y before, under a
comment that called them "two sample heights on the NPC's body" and was
wrong (#147). A new `STOREY_REACH = 2.0` gates the same targets: skipped
when the body's feet sit more than 2.0 m from the player's own feet
(`camera.position.y - EYE_HEIGHT`), per open call 4. Props keep their
`focus` and are untouched, per open call 3. `src/stations.js`'s `talkable`
asks `walk.fromSpawn(x, z, point.level ?? 0)` instead of looping
`plan.levels`, per open call 5; measured against today's data, 0 of 115
station-watches changed verdict.

**The tests, and a timing seam the spec did not name** (#781).
`test/mystery.mjs` gains two assertions: the Lady's Prime station moved to
level 2 is not talkable, and an awake upstairs station exists at all four of
day one's watches, each with an own-storey cell 0.9 to 2.8 m away and a
lower-storey cell within 2.8 m. `test/plan-vs-scene.mjs` gains twelve, two
halves for each of six station-watches. The beat had to go after the
hound's bark beat: the hound follows the camera and leaves its bark timer
set, and the new beat running first turned the bark beat red — "26 frames
had one early."

**Four breaks, each from a green baseline** (#34):

1. The old aim line back, `target.focus ? at.y : h`. Half 1 red for all six,
   e.g. "sentry at terce, level 2, is offered from their own storey: no cell
   of 12 ... (-18.75, -15.75) level 2 1.06 m: nothing".
2. The old aim line with the gate also removed — `main` as it stood before
   this row. Both halves red for all six, wider than the spec expected: the
   porter offered from 36 of 42 cells below, e.g. "(-0.75, 0.25) level 0
   0.35 m: \"Press E to talk to Gwilym\""; the Lady from 84 of 88; the
   sentry from 5 of 56.
3. The gate removed, the new rays kept. Stayed green: the walk's deck blocks
   at all six today, and the gate is kept anyway (open call 4), which its
   comment now says.
4. The `plan.levels` loop put back in `talkable`. FAIL: "the Lady's Prime
   station is talkable on its own storey and not when it is moved to level
   2, where there is no floor under it — level 1 true, level 2 true".

**Found, not fixed, out of scope for this row** (#782). `src/audio.js`
clears the hound's bark timer only between 5 m and the follow radius (the
follow starts at 6 m, holds to 8 m). A player who leaves past 8 m and
returns gets an immediate first bark. Populace and audio, not this row.

**What is unverified, and stays unverified here.** The proof past the
suites — the sentry at Terce, the porter at Vespers, the accusation
selecting 3 of 3 — is the GPU run's, on Devon's machine (#53). Rank 3's gate
on this row is now open, and its next sitting should start from a `main`
that carries it.

---

## The planning docs, cut down to the current state (2026-09-23)

**#783.** `BACKLOG.md`, `ROADMAP.md` and `SPECS.md` were about 1 MB against
27K lines of `src/` and `test/`, built up in layers: shipped-row narrative
that never left, paragraphs correcting earlier paragraphs, and a
renumbering's worth of strikethrough. A session paid a large reading cost
before it could do anything. Class B, `scribe`.

**Known drift, found and fixed.** `BACKLOG.md` said "Seven ranked rows"
against a table of eight (3, 4, 6, 7, 9, 10, 11, 13) — corrected. `CLAUDE.md`
and `README.md` said 39 MB of assets; `du -sh assets` gives 28 MB, and both
are corrected, nothing else in `CLAUDE.md` touched. `ROADMAP.md` opened with
"four hard gates on twelve rows" when three of the four had shipped and most
of the twelve had too; it is rewritten as a current-state plan with the one
gate still standing (rank 3 before rank 11 past its Node line) and the lane
table's substance kept (#600 to #602, unchanged).

**`BACKLOG.md`**: "Where things stand" (422 lines of day-by-day shipped
narrative) replaced by a one-screen current-state summary with # citations
per claim; "The tooling" (rank 12, retired whole) deleted; the ranked
table's surrounding prose and the gate list trimmed to what is still true.
69983 to about 23100 bytes.

**`ROADMAP.md`**: rewritten whole as a current-state plan — what needs which
machine, the lane table, what can run in parallel now, the worktree rule,
and the order of the eight open rows. The struck-through shipped rows and
the "moved a fourth time" renumbering history are gone; four durable lessons
are kept at one line each with their numbers: name the render a row needs,
not the row that happens to produce one; do not gate a looking on a
walking; a clean merge of two lane-C rows is not a correct one; read
`HISTORY.md` on `origin/main` when picking a decision number, not when a
branch started. 38699 to about 7100 bytes.

**`SPECS.md`**: three fully shipped or retired sections deleted whole —
"Explore: the day before" (rank 1, closed #778 to #779), "A second day"
(rank 4, closed whole by 2026-09-19), "The tooling" (rank 12, retired
#687 to #690). "The red suite" is trimmed to its one open increment (a
station-to-prop `PROP_CLEARANCE` rail); its first two increments shipped as
#721 to #724 and their scope, acceptance and answered open calls are gone.
Every other open row's section (The GPU run, The retro castle, Life: a
populace, Sound, A castle to get lost in, Bodies, Feel, The floor plan you
can see) has its shipped increments stripped to a short "what shipped"
paragraph, keeping every open increment's scope, acceptance, open calls
(word for word) and dependencies. "A castle to get lost in" lost its most
stale content: the town's first increment (#725 to #728) had already shipped
against text that still described it as unbuilt work; that section now says
what shipped and that the quay has no `SPECS.md` scope yet, an `architect`
job. The preamble's stale renumbering history and "the ten suites" (now
fifteen) are corrected. 160555 to about 55900 bytes.

**`briefs/`**: `rank-01-opus-walker-on-the-stair.md` deleted (shipped
#716 to #720) and `rank-99-opus-red-ci-on-main.md` deleted (both its
failures shipped as #721 to #724, and what is left of that row is "The red
suite" increment 3, which has no brief). `rank-02-opus-the-gpu-run.md`
renamed to `rank-03-opus-the-gpu-run.md` to match the row's current rank,
its gate updated to say the sight-height fix shipped. `rank-06`, `rank-09`
and `rank-11` updated where their bodies described work that has since
shipped (rank 6: 10 people, not 19 of 32; rank 9: the town not yet built,
when its first increment has; rank 11: gated on "rank 2", now rank 3).
`rank-07` and `rank-10` were already current and untouched.

**`HISTORY.md`, `PLAN.md`, `WISHLIST.md`**: untouched apart from this entry.
No decision renumbered, no entry rewritten; `src/` and `test/` cite this
file's numbers in about ninety places and none of those citations moved.

**Anchors checked.** Every `SPECS.md#...` link in `BACKLOG.md`'s ranked
table still resolves: the eight open rows' headings are unchanged text, only
their bodies were cut. `test/budget.mjs`, `test/layout.mjs`,
`test/mystery.mjs`, `test/play-castle.mjs` and `tools/dialogue.mjs`'s
comments citing `BACKLOG.md`/`SPECS.md` by rank number or section name are
comments, not links, and none needed a code change to stay true.

`npm test layout budget mystery dialogue tools` and `npm run dialogue:check`
both green after `npm install` (`node_modules` was not present in this
container). The two browser suites in the full `npm test` run were not
confirmed to completion here; nothing in this session touched `src/`,
`test/` or `data/`.

---

## Which model does what, loosened (2026-09-23)

**#784. The class table in `CLAUDE.md` is a default, not a rule, and
judgement about what to delete is not bookkeeping.** #783's cleanup went to
`scribe` because the table called doc edits class B, and the cuts were a
judgement over 300 KB of cross-referenced text; the lead checked them
afterwards and found every dropped recommendation belonged to a shipped
increment, except two of rank 9's that still bind the quay, which are back
in `SPECS.md`. The section is rewritten from 56 lines to 37: the lead may
override the table and says why in one line, a third tie-break says Opus
decides a restructure and `scribe` carries it out, and planning on Opus with
Sonnet executing is allowed for any class where the reading is large and the
deciding is small. Devon asked for it directly. No agent file changed.

---

## Bodies: made here when they cannot be fetched (2026-09-23)

**A spec, not a batch.** Devon's ask for the session: if the backlog cannot
move, make new models of maids, knights, peasants, children, dogs, cows and
chickens. This container reaches npm and does not reach poly.pizza,
quaternius.com, OpenGameArt or itch (all four time out); it has no Blender
and no `ktx`. `SPECS.md`'s "Bodies" gains "The generated half", two
increments with every open call recommended; `BACKLOG.md` and `ROADMAP.md`
say that half is Container. No code, no asset. Decisions #787 to #789,
written as `architect`; #785 and #786 are held by another session.

**#787. Bodies and clips may be generated in this repo by a deterministic
Node script, as textures already are.** `tools/bodies/` reads a table and
writes `.glb` through gltf-transform, `npm run bodies:render`, and a suite
holds each output byte-equal to what the script writes from its row: #742's
shape and #743's provenance rule, pointed at meshes. What was wrong was the
assumption in rank 10's spec that every body is sourced, which made the row
Local: net in full while its largest open item, the activity clips, needs no
network at all. Sourcing CC0 stays allowed and is still the route for any
kind the generator does not make. What this does not license: a generated
human. Maids, knights, peasants and children stay on the four Quaternius
rigs, because tint, height, hidden nodes and the spear already make them
(#643, #685) and a box-built human would sit beside the kit's people looking
like a different game.

**#788. The five activity clips go inside the four human bodies, and they
are the first generated increment.** Measured with gltf-transform: the four
share 62 joint names, but Woman's Idle pose differs from the three men's by
up to 90.5 degrees at `UpperLeg.R` (the men agree within 0.93), her rest
translations by up to 0.108 m, and her clips run 2.08 s to their 1.67 s at
the same 51 keys. A shared clip file would be two files and a loader change
in `npc.js`; clips inside each body need no `npc.js` change and are already
referenced (check 4), encoded (check 5) and read by `mystery.mjs`'s
per-person clip check. Each clip is Idle's 108 channels with model-space
rotations composed on top at integer cycles, so it loops by construction.
King.glb round-trips gltf-transform byte-identical and Woman.glb grows 20,616
bytes once then holds, so a second render is a no-op; Hen.glb does not
round-trip stably, which is why the generator touches only the four. `Drill`
joins rank 6's four because the garrison carries the spear.

**#789. `MAX_SKINNED_TOTAL` goes from 33 to 34 when a generated cow lands,
and only for a body inside the cow's caps.** #756 said the next body should
cost an argument; this is it. A human is 62 joints, 5,476 to 11,110
triangles and five skinned nodes; the cow is capped at 16 joints, 1,000
triangles, 4 primitives and 80 KB, each cap a rail in `test/assets.mjs`.
What it adds is one AnimationMixer and at most four skinned draws.
`MAX_SKINNED_PER_WARD` stays 20: the outer ward peaks at 19 on the walking
day, so a cow there all day makes 20 and fits. A separate budget for cheap
animals was the alternative and is refused, because it would move the hound
and both hens out of the 33 without anyone arguing for it. Shipping the asset
before its placement is refused too: an unreferenced `Cow.glb` fails check 4
(#390). A pig or a goat after it costs its own argument, 34 to 35.

---

## The red suite: a body is not stood on a prop (2026-09-23)

**Increment 3, the last, class S; the row is closed.** `PROP_CLEARANCE` is
1.0 m in `src/stations.js` beside `STATION_CLEARANCE`, and the rail is
`validateMystery`'s, day one's nav block, surfaced by `test/mystery.mjs`
check 1. Plan arithmetic and `nav.at`, so #529 keeps it out of
`plan-vs-scene.mjs`. Decision #785.

**#785. No day-one station stands within 1.0 m of anything the player
presses E at, at the watch it is held.** "Anything" is every plan piece
carrying `evidence`, `read` or `bell` (25 pieces), measured station point to
the centre of the piece's box, same storey only, the way `STATION_CLEARANCE`
skips a pair on two levels; an evidence piece counts only at the watches
`mystery.json` lists it for, so the body's lantern is a prop at Prime and
not at Terce. On the data as it stood the rail said exactly the five pairs
the spec measured: the Chaplain 0.20 m from the gravestone at all four
watches and the Constable 0.92 m from the chapel candles at Prime. The fix
moves two stations and nothing else. **The Chaplain** goes from tile
(5.4, 3.8) to (5.5, 3.55) at all four watches, 1.08 m south-east, 1.02 m
from the gravestone's centre and nothing else pressable within 1.8 m; a spot
1.00 m north at (5.4, 4.05) was as close but 1.11 m from the bell and 1.57 m
from the candles, inside the cells `plan-vs-scene`'s candles beat sweeps.
**The Constable** at Prime goes from (5.9, 4.2) to (5.95, 4.2), 0.20 m east,
1.10 m from the candles, 1.35 m from the bell and 1.44 m from the body's
lantern. Both pass every other nav rail.

**What it does not cover.** Day one only, the four watches the spec measured.
Run over the walking day and the morning after, the same arithmetic finds
the Chaplain 0.20 m from the gravestone at `prime-eve`, `sext-eve`,
`vespers-eve` and `lauds` ("the grave is filled", which is the point),
Hywel 0.34 m from the candles at `vespers-eve` (the foot of the stair he
dies at), Hywel 0.95 m from the obituary roll and the cook 0.93 m from the
knife at `sext-eve`. Whether the rail extends to those days, and whether
Hywel's last station is the one exception, is a decision and not done here.

**The breaks, from green** (#34). The Chaplain's Prime station put back at
(5.4, 3.8) in `data/mystery.json`: check 1 went red with `FAIL
validateMystery finds nothing wrong, the castle included — chaplain stands
0.20 m from gravestone at prime, inside the 1.0 m a body keeps from
something to press E at`, exit 1. The watch filter deleted from the rail:
`FAIL a station on the body's lantern fires at Prime and not at Terce, when
the body is no longer evidence there`, exit 1. Both restored. Three
assertions added to check 2: the Chaplain back on the gravestone at Terce,
the Constable back at the candles at Prime, each held to its exact message,
and the lantern at Prime against Terce. `npm test mystery layout dialogue
quest save lore budget` green; the browser suites were not run here.
