# SPECS

A spec per ranked row in `BACKLOG.md`. **`BACKLOG.md` ranks; `ROADMAP.md`
orders; this file says what each row is, in the detail `PLAN.md` gave the seven
phases and the backlog rows never got.** Each section's Dependencies below is
where `ROADMAP.md`'s gates and lanes came from (#600 to #602); where this file
and that one differ, this one was written against the code and wins. `HISTORY.md` is still the only record: nothing in here is a locked
decision. Every "recommendation" below is exactly that, and the session that
ships the row is the one that records the call with a number.

One section per row still open in `BACKLOG.md`'s ranked table: 3, 4, 6, 7, 9,
10, 11, 13, plus "The red suite," unranked, its last increment still open.
A shipped row's section is deleted, not struck through; `HISTORY.md` carries
what it said. **Ranks are retired, never reused** (#619, #491, #522): 1, 2, 5,
8 and 12 are gone from this file for that reason, not renumbered into gaps.
Where a brief and the code disagree, the code is quoted and the disagreement
is named. Measurements are `git ls-tree`, `du` and `ls -la` against the commit
each section names.

## How to read a section

Each row has the same five parts.

1. **Scope**: the files that change or get added, and the systems involved.
2. **Acceptance**: what done looks like, and which suite says so. Where a new
   guard-rail is warranted, the assertion and the break that proves it is not
   vacuous (#34).
3. **Open calls**: what the row leaves unresolved, with a recommended answer and
   the reasoning. Recommendations, not decisions.
4. **Dependencies**: what has to have shipped first, and what should not run at
   the same time.
5. **Constraints**: the house rules that bite this row, by number, and only
   those.

The depth follows the `Size` column: a ¼ gets bullets, a 1 gets the file-level
plan, and the 2+ is mostly about the first increment.

**A section is named, not numbered.** Each one opens with the rank it holds in
`BACKLOG.md` today, and a shipped row shifts every number below it, so the rank
on that line is a pointer a shipping session updates and nothing else refers to.
Everywhere one section names another it names it by title. The version of this
file written on 2026-09-15 numbered them inline instead and was already a row
out of step with itself inside "The GPU run" before anything had shipped (#522).

## What every row shares

Four facts every row below leans on, stated once:

- **`src/castle-plan.js` computes every transform, box and surface; the builder
  places and tags; `test/plan-vs-scene.mjs` diffs the two at 0.01 m** (#500).
  Anything added to the castle is a plan piece with a `planId`, or it is invisible
  to the net.
- **Nothing the page fetches leaves its origin** (#493). `test/harness.mjs`
  aborts every offsite request and `test/built.mjs` fails on a non-empty
  `page.__blocked`. Decoder files, fonts, sound files and images all land under
  this repo.
- **The fifteen suites are `npm test`; `npm run play` is not** (#53). A row whose
  proof needs a real-time walk or a look at a render has a GPU criterion nobody
  in a session can meet. Every row below also names a Node or headless criterion
  so the row is not blocked on hardware.
- **The save key is `castleConundrumSave_v1` and stays** (#36, #413). Schema
  changes go through `migrate` with a version bump; `repair` runs on every load
  (#37).

## The red suite: what the prompt is aimed at

**Unranked, the row `BACKLOG.md` calls "nobody's row yet". Size ¼.
Increments 1 and 2 shipped** (#721 to #724): the chapel-candles aim
(`AIM_DOT = 0.95`, a second nearest-inside-cone slot in
`InteractionSystem.update`) and the populace beat's timing fix (park the
rings with `setWatch(watch, { walk: false })` before reading them, `TOL`
still 0.01 m). **One increment is left, class S**: a station-to-prop
clearance rail.

### Scope, increment 3

| File | What changes |
| --- | --- |
| `src/mystery.js` (`validateMystery`'s nav rails), `test/mystery.mjs` | a station-to-prop clearance beside `STATION_CLEARANCE`, and the two stations that fail it |

Nothing here touches `src/save.js`, its version or `migrate`, and nothing moves
an assertion across the `layout` / `plan-vs-scene` / `mystery` / `budget` line.

### Acceptance, increment 3

`test/mystery.mjs` gains a rail saying no station stands within
`PROP_CLEARANCE` of anything the player presses E at, at the watch that
station is held. It is red on the data as it stands, so the increment carries
the data fix with it. `npm test mystery layout plan-vs-scene` is the subset.

### Open calls

1. **Where does the station-to-prop rail live?** *`src/mystery.js`'s
   `validateMystery`, surfaced by `test/mystery.mjs`*, beside the
   `STATION_CLEARANCE` check it is a second half of. It is plan arithmetic and
   `nav.at`, provable in Node, so #529 forbids it in `plan-vs-scene.mjs`.
2. **What number?** *1.0 m, named `PROP_CLEARANCE` in `src/stations.js` beside
   `STATION_CLEARANCE`.* It catches the two that actually bit and nothing else:
   the Chaplain 0.20 m from the gravestone at all four watches, and the
   Constable 0.92 m from the chapel candles at Prime. Reusing
   `STATION_CLEARANCE`'s 1.5 m instead would also flag the Constable against
   the bell (1.15 m) and the body (1.41 m), the apprentice against the
   obituary roll (1.44 m) and the sentry against the gaol roll (1.44 m) —
   nine pairs instead of five, four of them a body standing a sensible arm's
   length from the thing it is meant to be attending to.

### Dependencies

Not in a named lane: `test/mystery.mjs` and `src/stations.js` are in none of
A to E. Increment 3 edits station coordinates in `data/mystery.json`, which
the second day's own rows also read, so do not run it beside a row touching
that block.

### Constraints

- **#529.** The clearance rail is Node arithmetic and goes to
  `test/mystery.mjs`, not `plan-vs-scene.mjs`.
- **#34.** The increment names its break above, and a flake needs the
  stronger version: show the cause moved, not the load.
- **#13.** No skip list.
- **CRLF here, LF in CI** (#632).

---

## The GPU run

**Rank 3. Size ¼. Its gate, "Sight at the body's own height," shipped
2026-09-21** (#780 to #782); the gate is open. `npm run play` is 102
assertions and a numbered screenshot per beat into `shots/play/`. It has run
on a machine with real compositing six times over three sittings (#624 to
#630, #708 to #715, #734 to #741), and the third sitting's second run reached
the accusation for the first time — 179 ok, 17 failures — with the wrong
ending, because `src/interaction.js` read the sentry and the porter from a
fixed world height instead of their own. That fix shipped as this row's gate.
**What is left is the run that confirms it on a GPU.**

**The judgement half of this row is done.** Every render question this
section used to list is answered in `HISTORY.md`: the twelve at Vespers
(two of them do not read as two — the Constable and the Steward are one
white-haired man told apart only by a collar colour), the Lauds sky (flat,
no dawn colour), the covered hall (its trusses invisible from the floor, a
sliver of sky at one corner), a tower roof from 12 m, and the gaol roll on
the barrel-head. One item is still untouched: a phone in the room (#530) —
the stick throw, sprint threshold, look rate, E button size and two render
numbers are all still guesses.

### Scope, the run

- **Nothing in `src/`.** The run is the deliverable. `test/play-castle.mjs`
  is the only file this row may change.
- **`HISTORY.md`** records what the run said, beat by beat. A beat that fails
  on a GPU is a bug; a beat that failed under software rendering and passes
  here was never one.

### Acceptance, the run

- `npm run play` exits 0 on a machine with a GPU, or exits non-zero with the
  failing beat named and filed as a new backlog row.
- `shots/play/` contains the numbered set and a human has looked at it and
  written one sentence per body: told apart or not.
- No new guard-rail: the run is the check. The `snap` beat is a screenshot,
  not an assertion, and says so in its comment.

### Dependencies

- **Gated on "Sight at the body's own height," which shipped 2026-09-21**
  (#780 to #782). Run again from a `main` that carries the fix.
- The run needs a machine with a GPU, which is Devon's; a session can add a
  beat and cannot run it. If a session is asked to take the run without one,
  the honest output is the beat and a note, not a claim.
- The journal beat's walk assertion (#659) has now run on a GPU five times:
  0.69, 1.30, 0.51, 0.69 and 0.83 m against its `> 1.0` threshold. It is
  measuring the chapel's geometry more than it is measuring the pointer. What
  to do about that is a decision about what the beat is for, and it is left
  open rather than guessed at.

### Constraints

- #53 (the whole point of the row).
- #34 does not apply: no rail is added.

---

## The retro castle: the stone in the castle's own pixel art

**Rank 4. Size 2+. The first increment shipped on 2026-09-21** (#757 to
#766). Devon's brief of the same day: the castle reads as the same
everywhere, and he wants pixel-art textures produced by a model session
rather than photographs, for variety room to room and for a retro look, a
style call before a cost one. That reverses #411, which put photographic
stone on the walls, and the reversal is locked as #742; the provenance rule
for a texture this repo draws is #743; the row's rank, lane and the shape of
its cost rail are #744. What shipped, and the ten open calls it answered,
are below; the second and third increments wait on the look (#53).

**What was there before the swap, measured on 2026-09-21.** Fifteen material
sets under `assets/poly-haven/`, 1024 px, three maps each, KTX2 since #506,
about 25 MB on disk. By their own KTX2 headers (pixels per mip level times
0.5 bytes for
ETC1S and 1 byte for UASTC) they hold **44.2 MB of the 79.3 MB** of texture
memory the castle carries, and that estimate is exact: the same arithmetic
over every `.ktx2` on disk gives 79.3 MB, which is the number #506 measured
off `renderer.info` on the live page. The ten prop packs are the other
35.1 MB. The fifteen dress 46 wall runs (five names: `castle_wall_slates` 22,
`medieval_blocks_02` 13, `plastered_wall_04` 8, `old_planks_02` 2,
`defense_wall` 1), the eight drums (two names and eight tints, #516), 32 room
floors (seven names: `wood_planks` 10, `wood_floor_deck` 8, `old_planks_02`
5, `stone_pavers` 5, `rock_tile_floor` 2, `floor_tiles_02` 1, `dirty_carpet`
1), four grounds, the walk's decking and the gate leaves. That is the "same
everywhere" in numbers: 22 of 46 runs are one slate and 18 of 32 floors are
two planks, and a set costs about 3 MB of video memory, which is why there
are fifteen and not forty.

The Kenney kit beside them is the other look already: ten 64 px PNGs, drawn
as pixel art, declared `KHR_materials_unlit` in every GLB so GLTFLoader gives
them `MeshBasicMaterial`, magnified NEAREST by `tuneTexture` (128 px and
under), and left out of the encoder by size (#508). #630 saw the two as two
games from a tower top. This row makes the built stone the kit's kind of
surface, at a little more than twice the kit's texel density: 128 px over
the 3 m repeat #434 set is 43 texels a metre against the kit's 16 and Poly
Haven's 341.

**The shape of the row: three increments, and a look between the first two.**

1. **Shipped** (#757 to #766): the pipeline, its rails, and fifteen
   textures, one per existing material name, so the castle is whole in the
   new look on one GPU sitting and not one wall at a time. A container
   closed it: no `ktx`, no network, no GPU. **Then somebody looks** (#53),
   with the checklist at the end of this section — nobody has yet.
2. **Variety**: a wall and a floor per named room, about forty textures,
   against the texture ceiling below. Gated on the look, the way rank 11's
   second increment is.
3. **The props**, if the look says a photographed cabinet in a pixel room is
   the next wrong thing. Waits on the look saying so; "What shipped" below
   carries the recorded answer to each open call increment 1 raised.

### What shipped, increment 1, in short

A generator (`tools/pixel/index.mjs`, `tools/pixel/textures.json`) draws
fifteen 128 px textures, one per existing material name, deterministic and
hand-run via `npm run pixel:render`. `assets/poly-haven/`'s fifteen material
folders are deleted (45 files, 23.9 MB); `data/scene-config.json`'s
`materials` became `pixelMaterials`; `src/assets.js`'s `loadPixelMaterial`
replaces `loadPBRMaterial` with a lit, diffuse-only material — the Kenney kit
is relit to match, behind `RELIGHT_KIT`, since every kit GLB does declare
`KHR_materials_unlit`. `test/assets.mjs` gained a new check 3b (size,
palette, wrap, one map, pixel-identical to the generator) and
`test/budget.mjs` a fourth count, `MAX_TEXTURE_MB = 64`. Texture memory: 80.8
MB before, 37.9 MB after. `npm test` fifteen of fifteen, `dist/` 52.8 to 28.9
MB. Untouched: `src/castle-plan.js`, `src/save.js`, `data/sounds.json`
(the fifteen names did not change).

**Ten open calls were answered in shipping it** (#757 to #766), locked in
`HISTORY.md`: replace the fifteen sets and keep the ten prop packs (a photo
texture's authored UVs are not a retexturing job this repo has a tool for,
and supplementing measured out at 82.1 MB against the 64 MB ceiling); lit,
not flat-unlit, so the sun-per-watch, shadows and braziers keep working; the
kit relit rather than left; a program in the repo generates, never an image
model, checked by pixel-identity; 128 x 128, at most 32 colours, both named
constants; PNG, not KTX2, exempt by size; the fifteen names kept; no budget
ceiling renegotiated; the ten prop packs untouched; tone mapping and the
hemisphere fill left for the GPU to judge.

### Dependencies

- **Lane B.** Increment 1 held it and released it. Rank 9's next increment,
  the quay, has no section yet and is not startable, so nothing else is in
  the lane today; when it is, the two do not run together.
- **Increment 1 needed no `ktx`, no network and no GPU**, the opposite of
  #518 and #541: a container closed it.
- **Increment 2 waits on the look**, the way rank 11 waits past its Node
  line. Increment 3 waits on the look saying so.
- Ranks 6 and 10 are untouched: the bodies carry no images but the hen's
  atlas, which the count counts and the row leaves.

### Constraints

- #34, #13, #147: every rail above has a named break, and a rail that
  cannot be broken is not shipped.
- #390 and #506: the fifteen folders leave in the commit their names do; git
  history is the originals.
- #493: committed, and nothing fetched off-origin. The generator runs in
  Node and never in the page.
- #508, as #742 restates it: a texture at 128 px or under is left out of
  the encoder, and the rail that says which is `test/assets.mjs`'s.
- #434: the repeat stays world-space at 3 m; a tiling texture is the case
  that rule was written for.
- #500: no transform changes. #516: a tint still multiplies the map.
- #529 and #611: the memory count is cost and goes to `budget.mjs`; the
  texture rails are `assets.mjs`'s; nothing crosses the four-suite line.
- #584, #632: `data/scene-config.json` is spliced, in its own line ending.
- #53: the look.
- #742, #743, #744, #757 to #766.

### Looking checklist

Nobody has seen any of this (#53). `npm run play`, or the `applyWatch` look
#711 used, on the dev machine, and write what was wrong rather than that it
was wrong, in `HISTORY.md` against this row.

- [ ] **One castle or two.** From the North-west Tower's roof, #630's own
      vantage: the crown's merlons (the kit) against the drum's stone and
      the curtain (this row). Does the seam between kit and stone still show?
- [ ] **The shadowed faces.** The cross-wall's west face and the Great
      Hall's north wall, which #438 and #713 measured near-black under
      photographic slate. A darker palette, or a hole?
- [ ] **A metre from a wall at a grazing angle.** 43 texels a metre, NEAREST:
      blocks, or a smear? Anisotropy is on; is the minified far wall a moire?
- [ ] **The four skies and Lauds.** The same wall at Prime, Terce, Sext,
      Vespers (#474) and on the morning after (#712): four bells, or one?
- [ ] **The eight tints** (#516) over pixel stone: still eight towers?
- [ ] **Under foot.** The ward's cobbles, the hall's tiles, the walk's
      decking, a tower's boards: does a floor read as its room's?
- [ ] **The props.** A photographed cabinet in a pixel room: the next
      increment, or fine?
- [ ] **The number.** `renderer.info.memory.textures` off the live page
      against `test/budget.mjs`'s estimate, written down beside it.
- [ ] **The two knobs.** `toneMappingExposure` and the hemisphere's 2.0: what
      the palette needs, if anything.

---

## Life: a populace

**Rank 6. Size 2+.** `WISHLIST.md` theme 1. **The first increment shipped on
2026-09-17** (#616 to #618), rank 10 added a child, a hound and two hens to
the same file (#643, #684). **The second increment was specified on
2026-09-20** (#729 to #732) **and shipped the same day** (#733): five more
people, a `talk` list of three pairs, the talk rail wired to
`QuestManager`, and a budget that counts the household. What is left of
this row is below.

### What shipped

- **`data/populace.json`, fourteen bodies, and `src/populace.js`.** Ten people
  from #616, then the well-wife's girl, the Constable's hound (with `follow`)
  and two hens from rank 10. A routine is a ring per bell, one LIST of
  `{room, tile, activity, facing?}` per watch, walked round until the next
  bell, because the clock does not move between bells (#547, answer 3).
  `validatePopulace` asks the twelve's own five nav questions plus every leg
  of the ring and the wrap back to its first stop, and it checks the room
  with `roomAt` rather than `inNamedRoom`. `test/mystery.mjs` owns it (#529).
- **Twelve activities onto six clips**: the nine human jobs on three idle
  variants every human body ships, `sniff` and `eat` on the hound's rig and
  `peck` on the hen's. `ACTIVITY_CLIPS` in `src/populace.js` is the table,
  and `test/mystery.mjs` checks each person's jobs against the clips in that
  person's own `.glb`.
- **`label` on an interaction target** (#617): a populace body shows a name
  and a role on the HUD, E at one does nothing, and a label never takes the
  prompt off a suspect standing behind it.
- **Five more people, to 19 in `data/populace.json`, 32 bodies built,
  exactly `MAX_SKINNED_TOTAL`** (#729, #733): `page`, `sacristan`,
  `tiring-woman`, `watchman` and `writer`, placed per the table #729 set.
  Outer ward holds 17, 18, 17, 17 across Prime, Terce, Sext, Vespers; inner
  ward holds 14, 15, 14, 13. The maid's Sext stop in `inner-ward` is now a
  `gossip` stop, paired with the tiring-woman's. **The writer's Prime, Terce
  and Vespers stops fell back to `inner-ward`, `tend`** — the fallback
  #729 allowed — because all 8 floor cells inside the muniment's disc read
  as `kings-hall` under `roomAt`: that room has no walkable floor that
  counts as itself.
- **A `talk` list of three pairs, and the wire that plays them** (#731,
  #732, #733): `talk-prime-inner-ward` (`page`, `sacristan`),
  `talk-sext-outer-ward` (`baker-lad`, `well-wife`), `talk-sext-inner-ward`
  (`tiring-woman`, `maid`). `Populace.talkDue`, and `overhear`/`stopTalk` in
  `src/quest-manager.js`, share the `#caption` band, `_heard` and
  `_playing` with a performance, so there is one band and one clock; a
  performance always outranks talk. `src/main.js` constructs `Populace`
  with `talk` and `hush` callbacks and also passes `pairs:
  populaceData.talk`, an argument #729 to #732 did not name; `Populace`
  reads its talk pairs from it.
- **`test/budget.mjs` section 3** (#730, #733): counts a populace body in
  every ward any stop of its ring gives it, per watch, beside the cast's,
  and the total as every body `main.js` builds. It prints 32, not 12.
- **`data/npcs.json`'s `chatterComment`** no longer says the pool is for "a
  later populace row to spend", and `WISHLIST.md`'s matching line is
  corrected the same way, both pointing at #731. The pool itself is
  untouched and still unspent by the twelve.

### What the numbers are, now

- **Bodies built: 32.** 13 cast plus 19 populace, exactly
  `MAX_SKINNED_TOTAL`. `test/budget.mjs` prints this.
- **Bodies per ward, cast plus populace, a ring counted in every ward any of
  its stops is in and the hound in both:** outer 17, 18, 17, 17 and inner
  14, 15, 14, 13 at Prime, Terce, Sext and Vespers. The outer ward's peak is
  unchanged at 18 of 20; the inner ward's peak moved from 10 to 15 of 20.
- **The twelve's chatter pool still cannot be spent by proximity** (#731,
  unresolved): of `data/npcs.json`'s 27 `chatter` pairs, 0 have their two
  speakers within 3 m at the pair's own watch. The populace's own `talk`
  list is the three pairs above, a separate mechanism.

### Scope, what is left

- **The rest of the fifty waits on the town** (rank 9): more bodies, and
  whether `garden` becomes ground, is that row's call (#618, #703 to #707).
- **The ceiling stays 32 until a row renegotiates it, and the evidence it
  brings should be the GPU run's `renderer.info`, not a second guess** (#609,
  #729). Instancing and animation LOD are the tools for that argument, not
  needed yet.
- **Four clips**, `sweep`, `stir`, `hammer` and `spar`, wait on rank 10
  shipping a clip for them.
- **The twelve's 27-pair chatter pool stays unspent.** Recommend a later
  lore or dialogue increment hold each pair to the schedule the way #592
  holds a performance, which is the pass #554 named and skipped: 5 of the
  27 survive a same-room rule as written, and the other 22 need a room and
  a bell somebody authors (#731).

### Dependencies

- **Nothing gates it.** Rank 10 unblocks the four deferred activities and
  this increment waits on none of them.
- **Lanes C and D**: `data/populace.json`, `data/npcs.json`'s comment and
  `src/main.js`'s one constructor. `src/quest-manager.js` is in no other
  open row's scope today.
- **Not `data/scene-config.json`**, which rank 9 holds in lane B.
- **The GPU run** is what a later ceiling argument cites; this increment
  does not wait on it.

### Constraints

- #500: a populace stop is not a plan piece and has no `planId`.
- #529 and #611: the validator and `talkDue` in `mystery.mjs`, the band in
  `quest.mjs`, the cost in `budget.mjs`, and `plan-vs-scene.mjs` for the
  wire and nothing Node can prove.
- #13, #34: every rail above is broken from green and the failure quoted.
- #36, #39: talk is not saved and `SAVE_VERSION` stays 6.
- #724: the beat parks rather than waits, and `TOL` is not touched.
- #632: any new assertion over a data file's text reads both line endings.

---

## Sound: a soundscape

**Rank 7. Size 1.** `WISHLIST.md` theme 2. **The first increment below
shipped on 2026-09-17** (#620 to #623): `data/sounds.json` carries the
footstep, the chapel bell (#519, #522) and an `ambient` block of seven
synthesised beds; `src/audio.js` has `bedOf` and the cross-fade;
`test/layout.mjs` check 13 and a section of `test/map.mjs` hold them. The
zone list below was written before anybody counted: the castle builds no forge
and has no rain, and the garden cannot be stood in (#469), so none of the
three has a bed (#621). Scope and Acceptance are kept as written, as the
record of what was asked for.

**The second increment, a bed at a point and the four rings, shipped on
2026-09-18** (#680 to #683). A `PannerNode` per source, at the point of the
room's footprint nearest the player rather than its centre (#680, because the
south walk is 18 m long), the nearest three within 14 m sounding at once, open
ground in the head; a drum's storeys with the same bed are one source (#681);
`bell.rings` gives the four rings a stroke count and a gap each (#682). The
Node criterion held is that every source is heard from a point inside its own
footprint, from anywhere; the rest is ears (#53). `ambient.spatial` in
`data/sounds.json` is the whole of the tuning.

**The third increment, the two event sounds that need no clip, shipped on
2026-09-19** (#696 to #698). `data/sounds.json` has an `events` block:
`byCue` maps what the engine does to a sound, `sounds` is each sound as a
list of parts (a noise burst or a tone, at an offset, struck or held), and
`spatial` is the panner every one plays through, at the point the cue names.
`CUES` in `src/audio.js` is the code's half: `door-open` and `door-shut`,
fired by `openLock` and `shutLeaf` from the leaf's centre on a change of
state only, and `hound-near`, cued by the populace every frame the hound is
inside its follow radius and paced into barks by the sound's own `cadence`.
`test/layout.mjs` check 14 holds every cue to a sound and every sound to a
cue, and `test/plan-vs-scene.mjs` holds the two wires in `src/main.js`.
Nothing plays before the start button (#697). The rest of the event sounds,
the hammer and the sweep, still wait on rank 6's clips.

**What is left is the listening**, and the checklist for it is at the end of
this section.

### Scope

- **`data/sounds.json` grows an `ambient` block**: one bed per zone (kitchen,
  forge, chapel, wall walk, outer ward, rain), each a set of oscillator/noise
  parameters in the same shape `steps.classes` already uses, or a named CC0
  file once #548's reversal has one to name. Either way the file is the only
  place the sound is tuned, per the existing pattern.
- **`src/audio.js`** gains the cross-fade: on the room change the HUD already
  computes (#515), fade the outgoing zone's bed down and the incoming one up
  over about a second, rather than cut.
- **Recorded audio, if used**, is named by `data/sounds.json`, swept by
  `test/assets.mjs` for reachability the way a glTF is (#390), and given a
  codec (Opus in Ogg, #506's recommendation) by `tools/encode-assets.mjs`
  before it is committed. No file lands uncompressed.

### Acceptance

- `test/layout.mjs` gains a check that every zone the plan knows has an
  `ambient` entry naming it, the way check 12 already holds every surface to
  a footstep material. Break: add a zone to the plan without an entry; the
  check should name the zone.
- `npm run build` and the existing ten suites stay green; a recorded file (if
  any landed) shows up in `test/assets.mjs`'s reachability sweep and in
  `tools/encode-assets.mjs`'s output the same commit it is added, per #390.
- The actual sound is a `npm run play` question (#53): this row's Node
  acceptance is that a bed is *assigned and cross-faded*, not that it sounds
  right, the same split rank 11 draws for a shadow.

### Open calls

- **Synthesised or recorded, per zone, right now.** Recommend **synthesis
  first for every zone in this increment**, matching `steps` and `bell`'s own
  precedent, and let a recording replace one only once #548's licence
  question is actually answered for a specific CC0 file — "a sound stays
  synthesised until a recording beats it" is `WISHLIST.md`'s own line.
- **Event sounds (door, bark, hammer strike)** are named in the theme but are
  the increment after this one: they want an activity clip to sync to, which
  is rank 6's to add first. (The door and the bark turned out to need no
  clip, and shipped as the third increment, #696 to #698. The hammer still
  waits.)

### Dependencies

- **`data/sounds.json`'s existing `byMaterial`/`byKind` map and #515's room
  tracking** are both shipped; this row is additive to them.
- Event sounds wait on rank 6's activities existing to sync to.
- The bell-as-soundscape half (Prime one bell, Vespers the whole peal) is a
  `partials`/`gain` change to the existing `bell` block, not a new system, and
  can ship inside this same increment if time allows.

### Constraints

- #493 (nothing fetched off-origin; a CC0 file is committed, not linked).
- #506 (encode before commit; no uncompressed audio).
- #390 (asset and reference land in the same commit; `assets.mjs` check 4's
  pattern).
- #519, #548 (synthesis-only reversed; a sound stays synthesised until a
  recording beats it, not the other way round).

### Listening checklist

Nobody has heard any of this (#53). `npm run play` on the dev machine, with
speakers or headphones, and `data/sounds.json` open beside it: every number
below is tuned there and nowhere else. Write what was wrong, not that it was
wrong, and put the answers in `HISTORY.md` against this row.

**The seven beds** (`ambient.beds`; stand in each, then walk out of it):

- [ ] `ward`: the head bed on open ground. Does it read as outdoors, and is it
      still there under the kitchen and the hall heard through their walls?
- [ ] `wallwalk`: up on the walk. Is the wind a wind, and does it stop at the
      top of the stair or bleed down it?
- [ ] `kitchen`: from the ward outside its door first, then across the
      threshold. Is the crackle a fire and not a click, and is the threshold
      a step and not a fade?
- [ ] `hall`: the same test at the Great Hall's door. The near wall is where
      it is heard from outside; is that what it sounds like?
- [ ] `chapel`: the two-note drone is tuned to the bell. Ring it there. Do the
      two agree?
- [ ] `chamber`: the lodge and the solars. Quiet enough to be a room and not
      silence?
- [ ] `tower`: climb the King's Tower. Nothing should fade on the stair
      (#681). Does anything?
- [ ] The two most likely wrong: 14 m of earshot through stone
      (`spatial.hearMetres`), and a tower roof heard from the hall under it.

**The four rings** (`bell.rings`; press E at the bell four times, once per
watch, from the chapel and then from the far ward):

- [ ] Terce, one stroke. Is it a bell and not a chime? The tierce at 396 Hz
      is what should make the difference.
- [ ] Sext, two strokes 1.3 s apart. Two, or one with an echo?
- [ ] Vespers, six at 0.9 s. A peal, or a machine? `gapSpread` is 0.08.
- [ ] The summons, three at 1.8 s and louder. Does it read as heavier, or
      only as slower?
- [ ] From the far ward: thin and placed, or gone?

**The two event sounds** (`events.sounds`):

- [ ] The muniment door, `latch-and-swing`: answer the word standing in front
      of it. A click, a second click, then a rush and a low hinge for the
      2.5 s the leaf takes. Is the hinge sawtooth a hinge, or a buzz? Is the
      whole thing at the door and not in the head?
- [ ] The same door on the second morning, `latch-and-slam`: the Clerk's word
      goes back over it as Lauds opens. A short swing, a thud, a latch. Is
      it audible from where the day starts, and should it be?
- [ ] The hound, `bark`: walk up to Gelert in the outer ward at Prime and
      stand. A double bark inside a second, then one every 7 s or so while
      you stay. Is 560 Hz falling to 380 Hz through an 1100 Hz formant a dog,
      or a duck? Walk away past 5 m and back: the first bark should be quick
      again.
- [ ] Does anything fire before Enter the Castle is pressed? It must not
      (#697); a save resumed with the door open is the case to try.

---

## A castle to get lost in

**Rank 9. Size 2+. The first increment as this section first specced it was
already built, and the row's premise was corrected on 2026-09-17** (#582).
**The map shipped the same day** (#588 to #591). `WISHLIST.md` theme 5.
**The town's first increment shipped on 2026-09-21** (#725 to #728): a street
of six houses and a church inside Mereford's wall, west of the town gate, seen
from the walls and entered by nobody. **What is next is the quay and the
river**, outside the west gate: see Open calls below.

### What was measured, and what it changed

This section used to say "eight drums with three floors each is 24 rooms
against about 6 in use" and ask for a floor slab and a `planId` for each
unused one. That was written from `WISHLIST.md` rather than from the code, as
this file's own header says of all eight sections added that day. Against
`data/scene-config.json`: **every one of the eight drums carries a room at
levels 0, 1 and 2**, four carry one at level 3, and the castle has **40
rooms — 14, 11, 11 and 4 by level**, which is the count
`test/plan-vs-scene.mjs` prints on every run. The four drums with no top room
are the four with a 2.5 m turret, refused on arithmetic by #523: a 2.5 m
turret in a 2.8 m ring leaves a 0.3 m ledge. There is no unused drum floor
left to add.

**What the castle has instead is nineteen empty rooms**: seven of the eight
tower first floors, seven of the eight tower top rooms, all four roofs, and
the larder hold no evidence, no station, no document and no prop. `PLAN.md`'s
"an empty room is worse than no room" is the state of the castle rather than a
risk to it, and more volume makes it worse — which is why the latrine turret
and the well chamber this section also named were considered and refused
(#582): they would have made the count 22, not filled any of the 19.

### The map, shipped (#588 to #591)

The journal's third tab, "The castle", is `src/stations.js`'s `nav.rooms()`
drawn by `src/ui.js`: one inline SVG per storey, off the plan's own bounds
and discs (#500). A room is entered once and marked `visited`, carried on
the save since version 5 (#590). `test/map.mjs` is the suite (#591).

### The town's first increment, shipped (#725 to #728)

Mereford, west of the `town-wall` run: three wall runs closing a circuit
with the west gate cut in, six houses, a church with a saddleback tower, all
Kenney kit or Poly Haven pieces already in `assets/`, no new asset. Nothing
in it is enterable — #703 stands, the castle is sealed. Two new rooms,
`ward: "outside"`, drawn on their own map section rather than the castle's:
`mereford-street` and `mereford-church`. `test/layout.mjs` gained check 4d,
every outside room seen from somewhere a player can stand (from a wall walk
or a tower roof, never lower); `test/budget.mjs` gained an `outside` bucket
summed into both wards' ceiling, 131 meshes. `npm test` fifteen of fifteen.

### What is next: the quay and the river

**No `SPECS.md` scope yet — this is an `architect` job, not a class-S one.**
Outside the west gate. Deferred because water is a surface kind the plan
does not have: the walkability fill would call it floor, check 12 would want
a step sound for it, and the ground needs to go below y 0. The kit has
`water.glb`, `dock-side.glb` and `dock-corner.glb` waiting for it.
`data/lore.json`'s `the-quay` fact already names a slate-roofed toll-house at
the quay's head, the one slate roof in Mereford; every other town roof is
`roof.glb`.

Two calls from the town's first increment still bind the next one:

- **Bodies in the town: none while #703 stands.** `validatePopulace` refuses
  a stop the player cannot walk to (#707), so rank 6's "the rest of the fifty
  go in rank 9's town" is answered no until something outside the curtain is
  enterable. A figure in a street nobody enters is a different system from a
  populace.
- **Doors and windows on the house fronts: none yet.** If the GPU run says the
  rows read as blocks, `wall-pane-wood-door.glb` and
  `wall-pane-wood-window.glb` go on as facades and check 4d still holds.

### Constraints

- #500, #529: every new piece is a plan piece; a sight check is Node
  arithmetic and belongs in `test/layout.mjs`, never `plan-vs-scene.mjs`.
- #611: `test/budget.mjs` holds cost, `test/layout.mjs` holds whether the
  castle works.
- #703, #704: nothing outside the curtain is enterable; `ward: "outside"` is
  the only way a room lies past it.
- #513: runs meet by touching, never by overlapping.
- #584, #632: `data/scene-config.json` is spliced, never re-serialised, in
  its own line ending.
- #493, #506: no asset fetched without going through the encoder.
- #53: the look is the GPU run's.

---

## Bodies

**Rank 10. Size 1.** `WISHLIST.md` theme 6. The plan bet the project on tints
(#419); this row answers the body-sourcing question at the scale of a child,
a dog, a chicken and a garrison rather than one woman.

### What shipped

The child is the existing rig scaled down (`Woman.glb` at 1.15 m, a bigger
head bone, `Run` for `walk`), not a new rig (#643). The dog is a fifth file,
Quaternius's Husky as `assets/NPCs/Hound.glb`, meshopted to 0.63 MB, with a
`follow` behaviour and `sniff`/`eat` clips (#644). Rails: bodies are found
through `populace.json` as well as `cast`, and a silhouette count asserts
more distinct combinations than there are new bodies (#645). Two hens off
poly.pizza's re-export of Quaternius's Farm Animals pack, `Hen.glb`, 55 KB
(#684). A held prop, `Spear.glb`, 46 KB, the first held prop not from Poly
Haven, worn by the serjeant and the man-at-arms (#685). **Not shipped**: the
GPU look at any of it (#53), and the activity clips rank 6 wants (`sweep`,
`hammer`, `spar`, `drill`), which no body has.

### The generated half (#787 to #789)

Bodies and clips may be made here by a deterministic Node script, the way
`tools/pixel/` makes textures (#742, #787). Two increments, each one
builder job, 2a first (#788). Both are Container; the sourced half below
stays Local: net.

**Measured 2026-09-23 with gltf-transform in Node.** The four human bodies
share one skeleton by name: 62 joints, `Root` to `PT.R`, hand bone
`Wrist.R`. They do not share a pose. Farmer, Adventurer and King agree to
0.93 degrees at Idle's first key; Woman differs from them by up to 90.5
degrees (`UpperLeg.R`) and has her own rest translations (up to 0.108 m).
Every kit clip keys rotation on 56 joints and translation on 52, at 51 keys:
1.67 s on the three men, 2.08 s on Woman. A kit clip costs 25.7 KB of
King.glb on average. Read and written back through gltf-transform, King.glb
is byte-identical, Woman.glb grows 20,616 bytes once and is then stable, and
Hen.glb is not stable between two passes.

#### Scope, increment 2a: five activity clips on the four human rigs

- **`tools/bodies/clips.json`**, the table. One row per clip: `Sweep`,
  `Stir`, `Hammer`, `Spar`, `Drill`. Each row has `cycles` (an integer),
  `driver` (the joint the motion rail reads) and `moves`, each
  `{ bone, axis, rest, amp, phase }`: a glTF joint name, an axis in the
  body's model frame (+y up, +z the way it faces), a static offset and an
  amplitude in degrees, and a phase in cycles. The angle at key k of 50 is
  `rest + amp * sin(2π(cycles * k / 50 + phase))`.
- **`tools/bodies/index.mjs`**, `npm run bodies:render`. For each of
  `Woman.glb`, `Farmer.glb`, `Adventurer.glb`, `King.glb`: read the body,
  drop any animation whose name is in the table, and for each row write a
  new clip keyed at the body's own Idle key times. Every channel Idle keys
  (56 rotation, 52 translation) is copied from Idle; each move composes onto
  its bone as `inverse(parentWorld_k) * R(axis, angle) * parentWorld_k *
  local_k`, root to tip, `parentWorld_k` taken from the pose already built
  at that key. Written with the reader's `EXT_meshopt_compression` intact, so
  the writer is the encoder for these four and check 5 holds (#506). Exports
  `renderBody(file) -> Uint8Array`, pure, for the suite. Touches no other
  file under `assets/`.
- **`src/populace.js`**: `ACTIVITY_CLIPS` gains `sweep: 'Sweep'`,
  `stir: 'Stir'`, `hammer: 'Hammer'`, `spar: 'Spar'`, `drill: 'Drill'`, and
  the comment above it stops saying the kit has none. `data/populace.json`'s
  `activityComment` likewise. No routine uses them yet; writing them into
  routines is "Life: a populace"'s.
- **`test/mystery.mjs`**: the validator case at `expect('an activity no clip
  in npc.js answers to'` uses `"hammer"` as its unknown job and goes red the
  moment hammer is known. Change the word to one the table will not grow
  (`"juggle"`). The orphan check below it already covers the five new names.
- **`src/npc.js`**: no change. `pickClip` finds the clips by name.

#### Acceptance, increment 2a

New check 7 in `test/assets.mjs`, beside check 6's pixel provenance, over
the four bodies. Each line is the break that has to turn it red (#34).

1. **Present.** Each body carries 29 animations: the kit's 24 by name and
   the table's 5. Break: delete `Drill` from the table and re-render.
2. **Targets.** Every channel of a generated clip targets a joint of that
   body's skin, and the set of (joint, path) pairs equals Idle's, so a
   cross-fade never drops a bone to bind pose. Break: rename a move's bone
   to `UpperArmR` (three's sanitised name, not glTF's); the generator must
   throw on an unknown bone rather than skip it, and if it skips, this
   fails.
3. **Duration.** Each generated clip's last key time equals the body's Idle
   last key time within 1e-4 s (1.67 on the men, 2.08 on Woman). Break:
   key over 60 steps instead of 50.
4. **Loops.** For every channel of a generated clip, the first and last
   keys differ by no more than two quantisation steps (2/32767 on a
   normalised int16). Break: `cycles: 1.5` on `Hammer`.
5. **Moves.** At some key, each clip's `driver` joint is at least 20
   degrees from Idle's rotation of that joint at the same key. Break:
   `amp: 0` on every move of `Stir` and re-render; line 6 stays green on a
   clip that is only Idle, which is why this line exists.
6. **Provenance and determinism.** `renderBody(file)` equals the file on
   disk byte for byte, for all four. A second `npm run bodies:render` is
   therefore a no-op. Break: change one `amp` by 1 degree without
   re-rendering; the failure names the body and says to run
   `npm run bodies:render`.
7. **Size.** Each body is at most its pre-increment size plus 250 KB: Woman
   1,073,992, Farmer 1,041,692, Adventurer 1,215,560, King 1,255,852 bytes,
   the four as constants in the check: about twice the kit's 25.7 KB a
   clip, five times. Break: key at 500 steps.

`test/mystery.mjs`'s orphan check holds `ACTIVITY_CLIPS` to the files.
Whether a Sweep reads as sweeping is `npm run play`'s (#53).

#### Scope, increment 2b: a cow, generated and placed

- **`tools/bodies/bodies.json`**, a second table: one row per animal. The
  cow's row lists joints (name, parent, head position), parts (a box or a
  six-sided prism, a centre, a size, one joint it is rigidly weighted to, a
  material) and clips. Joint names follow the hound's where one exists
  (`Body`, `Neck1`, `Head`, `FrontUpperLeg.L`, `BackLowerLeg.R`, `Tail1`).
  Flat-shaded, one skin.
- **Caps, which #789's ceiling depends on**: at most 16 joints, 1,000
  triangles, 4 primitives, 80 KB on disk. Materials `Hide` and `Hide_Patch`
  take the tint; `Nose`, `Eye` and `Horn` do not. Clips `Idle` (at least
  2.0 s), `Walk` and `Eating`, so `CLIPS`' idle and walk resolve and the
  existing `eat: 'Eating'` needs no new activity. No `Wave`: the cow does
  not greet, like the hound.
- **`tools/bodies/index.mjs`** builds `assets/NPCs/Cow.glb` with
  gltf-transform and applies `meshopt({ encoder, cleanup: false })`, the
  call `tools/encode-assets.mjs` makes.
- **`src/npc.js`**: `BARE_MATERIALS` gains `/^horn$/i`. One line.
- **`data/populace.json`**: one person, `id: "cow"`, in the outer ward by
  the hens, `wait` and `eat` stops, `modelHeight` 1.45, a tint no other
  person has. Asset and reference land together (#390).
- **`test/budget.mjs`**: `MAX_SKINNED_TOTAL` 33 to 34, with #789 cited in
  the comment block. `MAX_SKINNED_PER_WARD` stays 20.

#### Acceptance, increment 2b

Check 7 grows a cow half in `test/assets.mjs`.

1. **Caps.** Joints, triangles, primitives and bytes under the four caps.
   Break: raise the body's prism sides until it passes 1,000 triangles.
2. **Skin.** Every vertex has weights summing to 1 within 1e-3 and joint
   indices inside the skin. Break: weight one part to joint 16.
3. **Clips.** `Idle`, `Walk`, `Eating` present, targets exist, first key
   equals last as in 2a. Break: `cycles: 1.5` on `Walk`.
4. **Reads as four-legged.** The bind-pose box is at least 1.3 times as long
   (z) as it is tall (y). Break: swap the body part's y and z sizes.
5. **Provenance and determinism**, as 2a's line 6.

Held by the suites as they stand: check 4 (the cow is referenced), check 5
(meshopt), `test/mystery.mjs`'s per-person clip check and the #645
silhouette count, and `test/budget.mjs`: 34 built of 34, the outer ward's
peak under 20. Whether a cow reads as a cow is `npm run play`'s (#53).

#### Open calls, the generated half

- **Clips in the four bodies, or one shared clip file.** Recommend **in the
  bodies** (#788): Woman's pose differs by 90.5 degrees, so a shared file
  would be two files plus a loader change in `npc.js`, and the bodies are
  already referenced, encoded and read by `mystery.mjs`'s per-person check.
- **Which clips.** Recommend **all five**, `Drill` included: the garrison's
  spear (#685) is the reason, and a fifth row in a table costs one render.
- **Where a new animal counts.** Recommend **against `MAX_SKINNED_TOTAL`,
  raised by one per animal, each with its argument** (#789). A separate
  cheap-animal budget would move the hound and both hens out of the 33
  without anyone arguing for it.
- **Ship the cow's asset first, place it later.** Recommend **no**: an
  unreferenced `Cow.glb` fails check 4 (#390), and a catalogue to make it
  referenced is a second reference kind for one file.
- **After the cow.** Recommend **a pig, then a goat**, one table row, one
  placement and one ceiling argument each. **Maids, knights, peasants and
  children stay on the four Quaternius rigs** (#787): tint, height, hidden
  nodes and the spear already make them, and a generated human would not
  match the kit's look or carry its 29 clips.

#### Dependencies, the generated half

- None to start 2a. 2b after 2a, because both write `tools/bodies/index.mjs`.
- Lane C with "Life: a populace", which writes `data/populace.json` and
  `src/populace.js` too; 2a and 2b do not run beside it.

#### Constraints, the generated half

- #787 (a table row per generated asset; no hand-edited output).
- #390, #499 (2a adds at most 1 MB across four files; 2b under 80 KB).
- #506 (the generator writes meshopt; nothing lands raw).
- #53 (the look at every clip and at the cow is a GPU question and blocks
  nothing here).
- #632 does not bite: `.glb` is binary and git leaves its bytes alone.

### Scope, the sourced half (Local: net)

- **Sourcing, the same search rank 1 ran and won**: a
  low-poly, one-rig, CC0 body per new kind, re-exported through
  `gltf-transform` if it is not already the right generator, so `npc.js`'s
  `pickClip`, `tintBody` and `_findHandBone` keep working with no code change.
  A child scaled down from the existing rig rather than a new one is the
  cheapest version of "child," and should be tried first.
- **`data/npcs.json`** (or `data/populace.json` once rank 6 exists) gets the
  new `modelPath`s and the variation fields `WISHLIST.md` names: `modelHeight`
  (already precedented at #128, rank 1), a tint, a hidden hood/hat node, a
  held prop, a beard-material toggle — all `npc.js` machinery that exists for
  hiding nodes and materials today.
- **The dog**: one body, one behaviour (follow a station or the player,
  bark within a radius), the cheapest "companion" the theme names.

### Acceptance

- `test/assets.mjs` check 4: every new body referenced the same commit it
  lands, per #390.
- A visual acceptance — does the child read as a child at running speed, does
  the dog read as a dog — is `npm run play`'s (#53), same split as rank 1's.
- Node acceptance: the six variation axes (tint, height, hood, prop, beard,
  body) combine to more distinct silhouettes than there are new bodies, which
  a script can just count off `data/npcs.json`/`populace.json`.

### Open calls

- **Which kind first.** Recommend **the child**, per `WISHLIST.md`'s own
  ordering ("Devon named them first," and running is the one thing the walk
  grid already does well), then the dog, then chickens, then the garrison's
  spear-bodies, in that order.
- **New rig or scaled existing rig for the child.** Recommend **scale the
  existing rig** first and only source a true child rig if the proportions
  read wrong on a GPU — this is the cheaper thing to try and to be wrong
  about.

### Dependencies

- **Every activity clip rank 6 defers** (`sweep`, `stir`, `hammer`,
  `spar`, `drill`) is increment 2a's, above; the two rows trade work back
  and forth rather than one strictly gating the other.
- Goes through `tools/encode-assets.mjs` (#506) before commit, same as rank 1.

### Constraints

- #390 (asset and reference, one commit).
- #499 (budget: `WISHLIST.md`'s own number is 0.5-1.5 MB a body meshopted,
  ten bodies and thirty clips under 20 MB against headroom).
- #419, #471 (tint clones the material; a new body's own `Skin` hex is either
  matched to the existing three or the live-skin assertion changes to say what
  it actually guards, the same call rank 1 already has to make).

---

## Feel

**Rank 11. Size 2+. The first increment's Node half shipped on 2026-09-17**
(#650 to #654). `WISHLIST.md` theme 7. Every item in it is "a thing a
GPU decides," gated on `npm run play` the same way rank 5's hall covering was
— until it shipped by rendering the hall directly rather than waiting on
`npm run play` to reach it (#656 to #658).

### What shipped, in one paragraph

`src/player-rig.js` adds one group to the scene: a 0.46 m disc with a radial
gradient painted into a 64 x 64 canvas at load, sitting 0.02 m over
`PlayerController.feet` — the plan's own floor height, so the shadow and the
feet cannot disagree about a slab edge — and a hand of six primitives merged
into one geometry, which rests below the frame and lerps out to the leaf's own
`focus`, clamped to 0.78 m from the eye. Two draw calls, 16 KB of texture, no
file, no second shadow-casting light (#650). It reaches for
`interaction.currentTarget` rather than searching, so the hand and the prompt
cannot disagree about which door the player is at (#652), and **every mesh in it
has `raycast` set to a no-op**, because the rig is a top-level scene child and
`interaction.js` calls every one of those an occluder (#651). `settle()`
collapses the smoothing and the world matrix with it, which is what lets the
suite assert a position and never a duration (#653). Nine assertions in
`test/plan-vs-scene.mjs`, each broken on purpose; the ray ones cast twice, once
with `THREE.Mesh`'s own `raycast` put back, so "it did not hit" cannot pass on a
ray that was never going to hit anything.

### Scope, first increment — the GPU half, which is what is left

- **A shadow on the pavers and a hand that reaches for the door.** Both are
  named in `WISHLIST.md` as the two cheapest presence cues there are.
  `src/main.js`'s player rig gets a simple blob shadow (a decal or a baked
  circle under the capsule, not a real-time cast shadow, to keep the budget
  #499 and #510 already watch) and a hand node that lerps toward a door's
  handle transform inside the existing `openLock` interaction radius.
- **Nothing else in this theme** (weather, fire, examine, wear, sitting)
  starts before this pair, because they are the cheapest and the ones most
  likely to reveal whether the point-light and shadow budget has room for
  the rest at all.

### Acceptance, first increment

- ~~Node acceptance: the shadow decal and the hand node exist, are tagged with
  a `planId` if they are plan pieces, and do not regress `plan-vs-scene.mjs`.~~
  **Met** (#650 to #654). Neither is a plan piece, so neither carries a
  `planId`, and that is asserted rather than assumed: the rig moves with the
  player and a tagged moving object is a box the plan's diff cannot predict.
- GPU acceptance (#53): a screenshot of the player approaching a door with the
  hand visibly reaching, and a screenshot of the shadow on stone versus on
  grass; one sentence each in `HISTORY.md`, the same bar rank 2's photograph
  sets. **Still open**, and a third shot was added to it by the work: the disc
  is flat and a flight of stairs is a ramp, so what it does on a stair is
  unlooked-at.

### Open calls

- ~~**Real-time shadow or a baked decal.**~~ **Taken: the decal** (#650). A
  shadow-casting light on the player is a cost this castle has never paid, and
  the wishlist's own language ("cheapest presence cue") argued for the cheaper
  of the two. What shipped is cheaper again than a baked file — the gradient is
  painted into a canvas at load, so there is no asset to encode (#506) and
  nothing new is fetched (#493).
- **Everything else in the theme** (weather, fire, examine, wear, sitting) is
  explicitly a later increment each, in no fixed order — `WISHLIST.md` ranks
  none of them against each other, and this spec does not invent an order it
  was not given.

### Dependencies

- **The GPU run** (ranks 2 and 3) is what tells this row whether the shadow
  and hand read at all; nothing here ships past the Node acceptance before it.
- Fire and its point-light budget depend on **The GPU run**'s texture read
  too, since a bright torch over a compressed texture is a second question
  the same render answers.

### Constraints

- #53 (the whole row; a real-time visual claim is inconclusive until a real
  GPU looks at it).
- #499, #510 (video memory is the number to watch, not disk; a shadow or a
  point light is exactly the kind of thing that moves it).
- #500 (anything built as a plan piece gets a `planId`).

---

## The floor plan you can see

**Rank 13. Size 2+. Nothing is built; decisions #745 to #749, 2026-09-21.**
Devon's ask, in his words: the room layout was placed by an AI one room and
one guess at a time with no way to see the whole floor plan, he is not happy
with how it reads, and he wants a GUI to lay it out himself, **or at least to
review and correct it visually**. That last clause is why increment 1 below
writes nothing.

### What the layout is today, measured

**`src/castle-plan.js` holds no coordinate.** It is a pure compiler:
`makePlan(config, boundsOf)` reads `data/scene-config.json` and returns
`{tile, pieces, colliders, surfaces, rooms, curtain, spawn}`, and it throws
rather than warns on a config that does not hang together: `[castle-plan]
drum "x" has an interior and no room in config.rooms names it`
(castle-plan.js:999). So the floor plan is **data**: four arrays of
`data/scene-config.json`, and a fifth that holds what stands on it.

| Array | Rows | What one row is |
| --- | --- | --- |
| `walls` | 46: 18 curtain at level 0, 3 at level 1, 25 interior partitions with no `level` at all | a run between two tile centres, carrying `from`, `to`, `material`, `height`, `thickness`, and optionally `axis`, `base`, `walk`, `repeatMetres`, `interior`, `doorways` |
| `drums` | 8 | a tower, carrying `tile`, `radius`, `height`, `segments`, `turret`, `stairs`, and an `interior` carrying its own `doors` |
| `gates` | 3 | an arch on a tile with a `leaf` |
| `rooms` | 43: 23 outer, 17 inner, 3 outside; 9 by `tiles`, 28 by `drum`, 6 by `bounds` | **a name over an extent, with no geometry of its own** |
| `courtyard.placements` | 123 | a kit model at a tile, which is where the roofs, sheds and trees are |

**Eleven runs carry `doorways`**, each `{ at, width, height, base? }`: an
opening at a point along a run, which is how two spaces connect. Nothing is
derived from anything else. A wall is not a room's edge, a room is an
annotation over ground that runs happen to enclose, a door is a hole in a run,
a stair is two flags on a drum. An editor here edits four independent lists,
not one building.

The file is **3113 lines** and every one was hand-typed. `?edit=1`
(`src/edit-mode.js`, 327 lines; #583 to #587, move-and-delete #636 to #642)
writes three *other* arrays of the same file (`interiorProps` (12),
`builtProps` (21), `braziers` (3)) through `tools/place.mjs`'s splice and a
Vite middleware, and touches none of the four above. It is walked in first
person, so **the whole plan has never been on a screen at once.**

### Increment 1, shipped

`src/edit-layout.js`, mounted by `src/edit-mode.js` inside `main.js`'s
`import.meta.env.DEV` branch (#585): an orthographic camera over the real
scene, not a second drawing (#746), with a storey filter and ghosting.
`tools/plan-sheet.mjs`, new and pure, draws the labels, room outlines and
openings off the plan's own boxes, never recomputed (#500). `V` toggles the
view, `[`/`]` change storey. Nothing else changed: not `src/castle-plan.js`,
`src/castle-builder.js`, `data/scene-config.json`, `tools/place.mjs` or
`vite.config.js`.

### Scope, increment 2: rooms and runs become editable

Class S. **Lane B** (`data/scene-config.json` and `test/tools.mjs`'s
byte-exactness rail).

- **`tools/place.mjs`.** `PLACEABLE` gains `walls` and `rooms` with their key
  lists. `checkRow` becomes per-key shape rules rather than one shape:
  today every branch of it demands a `tile`, and a wall row has `from` and
  `to`. `formatRow` learns two shapes the four arrays have and the three
  placeable ones do not: an object value (`tiles: { min, max }`) and an array
  of objects (`doorways`). It writes both on one line today.
- **`src/edit-layout.js`.** Drag a room's rectangle or a run's end on the
  sheet; the sheet snaps to whole tiles, `Alt` to a quarter tile. The selected
  row's whole record is posted through the existing `/__place` `move` verb.
  No new verb and no change to `vite.config.js`.
- **`test/tools.mjs`.** Parts 1 and 2 run the two new arrays: insert, then cut
  the row back out, and the file is the file byte for byte, on an LF copy and
  a CRLF copy (#632). Part 3's `'an array that is not placeable'` case moves
  off `rooms`, which is placeable now, onto `materials`, which is an object
  and never will be. Part 4 covers the nested formatting.

### Scope, increment 3: the openings, which is how rooms connect

Class S, lane B. A `doorways` entry is a field of the run that owns it, so
editing one is a `move` of that run's row and needs no nested-path splice
anywhere (#749). Drag an opening along its run, type a width, `Delete` twice
to cut it, the way the prop editor already arms a delete.

### Acceptance

- **Increment 1, shipped**: `test/built.mjs` greps `dist/` for both dev-tool
  sentinels, and `test/tools.mjs` holds `planSheet(plan, level)` to the
  plan's own boxes, never recomputed (#500).
- **Increments 2 and 3.** `test/tools.mjs`'s headline rail, extended: an
  insert and a delete of the same `walls` row, and of the same `rooms` row,
  give back the file byte for byte on both endings, and every byte outside a
  rewritten row's span is the byte it was. **Break**: hardcode `\n` in
  `formatRow`'s nested-object branch; the CRLF copy fails by one byte per
  nested line, which is exactly #631's failure with a new surface under it.
- **Every increment.** `npm test` is 15 of 15 and `npm run build` is clean.
  No suite gains or loses an assertion in `layout.mjs`, `plan-vs-scene.mjs`,
  `mystery.mjs` or `budget.mjs` (#529, #611): a dev tool's rails are
  `test/tools.mjs`'s and `test/built.mjs`'s.
- **What no suite can say** is whether the plan reads better afterwards. That
  is Devon's, on the dev server, with `?edit=1&view=plan`. It is not a GPU
  question (#53), because an orthographic top-down of a static scene is not a
  real-time movement assertion, so a container can build and drive it, and
  only a person can judge the result.

### Open calls

1. **Does the GUI edit `castle-plan.js`, or an intermediate JSON?**
   **Neither: it edits `data/scene-config.json` directly, through
   `tools/place.mjs`'s splice** (#745). `castle-plan.js` is a compiler with no
   coordinate in it, so there is nothing there to round-trip; and the four
   layout arrays sit in the same file, under the same 3113-line splice rail,
   as the three the editor already writes. An intermediate format would be a
   second source of truth for the castle, which is exactly the thing #500
   exists to forbid. `eolOf` already gives it #632 for free.
2. **A re-serialise, now that whole rows are being rewritten?** **No** (#584,
   measured again today): `JSON.stringify(JSON.parse(raw), null, 2)` over the
   current file is 124924 bytes against 117131, so a round-trip writer puts
   7.8 KB of churn into every edit's diff, and the diff is the product. The
   churn a `move` makes inside the one row it rewrites stays the accepted
   bargain (#639).
3. **Top-down camera in the engine, or a flat 2D editor that never loads
   three?** **The camera** (#746). A flat schematic cannot compute anything
   here: `makePlan` takes `boundsOf(modelPath)`, and the only place that
   exists is `CastleBuilder.measure()`, which loads every model and measures
   its parts (castle-builder.js:630). A DOM editor would have to re-derive
   every box the plan computes, which is `test/layout.mjs`'s old sin written
   into a tool (castle-plan.js's header, #500). The camera also shows the 123
   `courtyard.placements`, the ground patches and the drums' own shells, which
   are the things a schematic would have drawn as nothing. Devon's own school
   editor landed here after 42 phases: `js/render.js:1522` is an
   `OrthographicCamera` 200 ft over the real scene with storeys ghosted, not a
   second canvas.
4. **Same tool or a new one?** **Same entry point, second module** (#747).
   `?edit=1` stays the one flag and the one DEV branch to audit;
   `src/edit-layout.js` is its own file because the data has nothing in
   common (a prop is a tile, a run is two tiles and eight fields) and
   because folding it into `edit-mode.js` would double a file whose whole
   value is that a person can read it in one sitting.
5. **Live validation, or write and let `npm test` catch it?** **Both, and the
   live half copies no assertion** (#749). Before it posts, the panel calls
   `makePlan(edited, boundsOf)` and `walkability`, the same two pure
   functions the page and every Node suite already call, and refuses to write
   when `makePlan` throws, showing the throw. It prints the room count, the
   walkable-cell count and whether the fill still seals, and **those are
   numbers, not checks**: #13's rule is why they are not allowed to be
   checks, because a second copy of check 4 living in a panel is a rail nobody
   runs and nobody maintains. No check from `layout.mjs`, `plan-vs-scene.mjs`
   or `budget.mjs` is copied, moved or re-implemented (#529, #611).
6. **A new row or an amendment to the placement editor's?** **New row.** Rank
   12 retired whole on 2026-09-18 (#687 to #690) and a retired row does not
   reopen; the scope is different besides: that row was props on a castle
   that already exists, this one is the castle.
7. **Which arrays does the write path take, and in what order?** **`rooms`
   and `walls` first, `doorways` second, `drums` and `gates` not in this row.**
   A drum is 970 of the castle's 1539 meshes (#609) and eight fields that the
   crown, the stairs and the turret all read; a gate carries a `leaf` spec
   with a springline in it. Both are a later increment's, and both stay
   readable in the review view from increment 1.
8. **Undo?** **No.** `git diff` is the undo, the write does not commit, and
   the one module in Devon's school editor most worth lifting (`js/history.js`,
   a JSON structural diff behind a 100-deep stack) is the one this repo does
   not need, because that tool's design lives in memory and this one's lives
   in a file git is already watching.
9. **Does the room's own record grow anything?** **No.** A room is a name over
   an extent and the builder works out what is in it; a second answer written
   beside the builder's is a second answer to drift, which is #583's rule for
   the prop editor's comment and holds here unchanged.
10. **Read-only first, as its own increment?** **Yes** (#748), and it is the
    answer to the half of Devon's sentence that says "or at least to review".
    It ships without touching `tools/place.mjs`, `PLACEABLE`, `/__place` or
    the byte-exactness rail, so the first thing anybody looks at costs nothing
    that could break a file ten suites read.

### Dependencies

- **Increment 1 is in no lane** and may be claimed beside anything, including
  rank 9. **Increments 2 and 3 are lane B**, which rank 9's town also holds:
  one row per lane at a time (#602), so they do not run beside it.
- Nothing gates this row and it gates nothing. It makes rank 9's remaining
  work and the nineteen empty rooms cheaper, the way the prop editor did for
  the content rows (#583).
- `src/edit-mode.js` is the host; a session in this row and a session
  extending the prop editor would collide on that file.

### Constraints

- **#500.** The sheet reads `plan.pieces` and `plan.rooms` and recomputes no
  box. A tool that re-derives the castle is the failure `castle-plan.js` was
  written to end.
- **#529, #611.** No assertion moves. A dev tool's rails live in
  `test/tools.mjs` and `test/built.mjs`.
- **#585, #586.** Two independent halves, neither trusted: the module is
  reached only from inside `import.meta.env.DEV`, the writer is still a plugin
  with `apply: 'serve'`, and the check is the grep of `dist/`, now for two
  sentinels.
- **#584, #632, #639.** Splice, never re-serialise; every newline from
  `eolOf(source)`; every byte outside the edited row's span unchanged, on both
  endings.
- **#13, #34.** The panel's numbers are not checks. Every rail named above is
  broken on purpose once, from green, with the FAIL line quoted in
  `HISTORY.md`.
- **#493, #494, #506.** No asset, no vendored library. Anything carried over
  from the school editor arrives as source under `src/` or `tools/`, never as
  a `libs/` copy.
- **#53.** An orthographic still of a static scene is not a real-time
  assertion, so the suite half of this row is a container's. Whether the plan
  reads better is Devon's.

