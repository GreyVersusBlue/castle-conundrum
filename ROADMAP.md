# ROADMAP

**`BACKLOG.md` says what is worth doing and in what priority. This file says
what can be done *when*, on *what machine*, and *next to what else*.**
`SPECS.md` is still the spec behind every row and `HISTORY.md` is still the
only record. Nothing here is a locked decision except #600 to #602, which are
in `HISTORY.md` like everything else.

Written 2026-09-17 against `main` at `f7ea3ff`, from `BACKLOG.md`'s twelve rows
and `SPECS.md`'s twelve Dependencies sections. Rank numbers shift every time a
row closes; **this file names rows by title as well as rank**, the way
`SPECS.md` already does (#522), so a closed row does not silently renumber the
order below.

Devon's framing for what he wanted out of this: *"Do #1 first, then you can do
2, 3 and 4 in any order alongside each other, then #5 before you can
continue."* The honest answer is that this list is looser than that. **There
are four hard gates on twelve rows**, and everything else is preference,
lane-avoidance, or which machine is free.

---

## The short version

```
NOW, in parallel, no gates:

  Devon's machine                    A container
  ---------------                    -----------
  R2  GPU run        --+             R8   quests: reputation + errands   lane A
  R1  fourth body      |             R6   populace: the first ten        lanes C D
                       |             R7   ambient beds                   lane E
                       |             (R12a budget suite SHIPPED, #607-611)
                       |             R4a  the bells call   (lane A: not beside R8)
                       |             R4b  the since field  (lane A: not beside R8)
                       |
R2 lands --------------+--> unlocks R3, R5, R11

  R3  preview + og card      local GPU, no lane
  R5  hall covering          local GPU, lane B
  R11 feel: shadow + hand    lane D

R4c Thomas Wykes's yard  --> unlocks R9's town
  local, lane B                  container, lane B

Never gated, take whenever the lane is free:
  R10 bodies (local: net, lane C)    R12b move-and-delete (lane B)
                                     R12c dialogue format (lane C)
```

---

## 1. What needs a machine this container is not

Three different reasons, and they are not interchangeable. Calling all three
"needs a GPU" is what the old header did, and it is why rank 1 sat unstarted
behind the wrong excuse.

### Local: a GPU (#53)

`npm run play` opens a real visible window and plays the whole day with pointer
lock and real key presses, 102 assertions, screenshots into `shots/play/`. It
is not in CI and is not going to be. **A real-time movement or physics
assertion that fails under software-rendered Chromium is inconclusive, not
confirmed** — which means a container cannot trust a pass either.

| Row | Model | Why the GPU |
| --- | --- | --- |
| **R2 The GPU run** | Opus 5 | The run itself. Six things nobody has looked at: a compressed texture (#507), the five that shipped after it (#541 to #546), a tower roof from 12 m (#523), seven trusses over the hall (#527), a Lauds sky (#533), the gaol roll on the guardroom barrels (#571). Plus the standing question: do twelve NPCs off three bodies read as twelve. |
| **R3 The images** | Opus 5 | The preview and og card come out of R2's screenshots. There is no other source. They land in `tools-and-games/assets/`, not here, and Devon relinks. |
| **R5 The hall covering** | Sonnet 5 | Both criteria are a render. `partsOf` gives all four of `roof.glb`'s parts the same 1 x 1 x 1 box, so nothing in Node can tell which way a kit roof piece slopes; and whether a covered hall goes dark is a luma read off the floor (#438). |
| **R11 Feel**, past its Node line | Sonnet 5 | The Node half — a shadow decal and a hand node exist and do not regress `plan-vs-scene.mjs` — is a container's. Whether a blob shadow reads on stone versus on grass is not. |
| **R4c The yard**, in practice | Opus 5 | Placeable in Node, but the tool that makes it cheap (`?edit=1`, #583) reads the tile under the player's feet as they walk, and whether a yard reads as a yard is a look. |

**R2 is the single highest-value hour on this list.** It is a ¼ and it unblocks
three rows outright.

### Local: a network that reaches the asset hosts

Not a GPU question and not the same block. #518's container could not reach
Poly Haven; #541's could, and both blocked rows came due the same day. #568's
could not reach quaternius.com, itch, poly.pizza, OpenGameArt or Patreon.

| Row | Model | What to fetch |
| --- | --- | --- |
| **R1 A fourth body** | Fable 5.1 | Quaternius's Ultimate Modular Women Pack first, checked against `SPECS.md`'s three name lists. The npm registry's two rigged CC0 alternatives were measured and rejected: KayKit is the wrong shape (head joint 57 % up the body against the Quaternius rig's top fifth, #569) and deskrpg is the wrong licence (#570). |
| **R10 Bodies** | Fable 5.1 | A low-poly one-rig CC0 body per new kind — the child first, per the row's own recommendation. A child scaled down from the existing rig is the cheapest version of "child" and should be tried before anything is fetched at all. |

Both go through `tools/encode-assets.mjs` before commit (#506), which needs
KTX-Software's `ktx` on PATH. **An uncompressed body passes every suite and is
the one asset nothing else on this list would catch.**

### Local: speakers and a person

| Row | Model | Which half |
| --- | --- | --- |
| **R7 Sound** | Fable 5.1 | The first increment — an `ambient` block per zone in `data/sounds.json`, the cross-fade in `src/audio.js`, a `layout.mjs` check that every zone the plan knows has an entry — is a container's, with synthesis standing in. Whether a kitchen sounds like a kitchen is not. Recorded CC0 audio, if it is wanted, folds the network block in too. |

### Container, start to finish

**R6** populace, **R8** side quests, **R9** the town once its gate clears,
**R12a/b/c** the tooling, **R4a** the bells call, **R4b** the `since` field.
Six and a half rows of twelve. Every one is data, a validator, a Node suite or
a headless DOM assertion, and every one has an acceptance criterion a container
can actually meet.

---

## 2. What can run at the same time

Two sessions collide on one thing: a file they both write. **One row per lane
at a time** (#602). The lanes are named by the file, not by the theme, because
the theme is not what conflicts.

| Lane | The file that decides it | Rows in it |
| --- | --- | --- |
| **A** | `src/save.js` — the version number and `migrate` | R4a, R4b, R8 |
| **B** | `data/scene-config.json`, and `test/tools.mjs`'s byte-exactness rail | R4c, R5, R9, R12b |
| **C** | `data/npcs.json`'s `cast` block, and `npc.js`'s body machinery | R1, R6, R10, R12c |
| **D** | `src/main.js`'s player rig and spawn | R6, R11 |
| **E** | `src/audio.js` and `data/sounds.json` | R7 |
| **none** | | R2, R3, R12a |

Lane A is the one the specs already warned about in words: *"do not run
alongside anything else that touches `save.js`"* is written into R4's
dependencies, and R8's next increment is a version bump to 6 with a clamp in
`repair`. Two sessions bumping the same version number produce a merge that
compiles and a save that does not migrate.

Lane B is sharp for a different reason. `test/tools.mjs` holds
`data/scene-config.json` to byte-exactness by cutting an added row back out and
comparing the whole file, because `JSON.stringify(JSON.parse(raw), null, 2)`
over that file is not that file: 94212 bytes go out as 98330 (#584). Two
sessions splicing into it is two splices neither one tested against.

Lane C is the `cast` block **specifically**, not all of `data/npcs.json`. R8
and R12c write per-person `states` and `default` line arrays, which is a
different region of the same file and merges cleanly. A session doing either
should still say so in its PR.

### Three that are genuinely safe together right now

**R8 (lane A), R6 (lanes C and D), R12a (no lane).** Different files, different
suites, no gate on any of them, and the backlog's existing advice already
points here: *"a session running beside one of those is better off on 8 or
12."*

**R12a shipped on 2026-09-17** (#607 to #611), which was the test of that claim: it ran
beside R8 in the same working tree and beside R6, R1 and R7 in worktrees, and
touched `src/castle-builder.js`, `test/run.mjs` and a new `test/budget.mjs`,
none of which is in any lane. **R7 is the replacement third**, alone in lane E.

Add **R2** and **R1** on Devon's machine and that is five things moving at once
without a single collision.

### What not to pair

- R6 beside R1 or R10. All three are lane C, and R6 reads the `cast` that R1
  and R10 both exist to change.
- R8 beside R4a or R4b. Lane A, and both want the version number.
- R5, R9, R4c and R12b, any two of them. All lane B.
- R6 beside R11. Lane D, both inside `src/main.js`'s rig.

---

## 3. The order

### Gate 1 — R2, the GPU run. Do this one first.

**Local, GPU, Opus 5, size ¼.** Not because it is the hardest but because it is
the cheapest thing that unblocks the most: three rows wait on it and one of
them (R3) has no other possible source. It also carries six unlooked-at
questions that have been stacking up since Phase 5, and one of those — whether
the ETC1S/UASTC split #507 chose on a reading of what each codec does to which
channels actually holds up — gets more expensive to answer the more assets ship
on top of it.

Nothing is gated on R2 *starting*, so everything in wave A runs alongside it.

### Wave A — right now, no gate, in parallel

One row per lane. All of these are startable today.

| Row | Model | Where | Lane | Next increment |
| --- | --- | --- | --- | --- |
| **R2** The GPU run | Opus 5 | **Local: GPU** | none | Gate 1, above. |
| **R8** Side quests | Opus 5 | Container | A | Reputation by ward: two save counters, version 6 through `migrate`, a clamp in `repair`, a chatter line per threshold and one line in one closing pane. Then the seven errands left of the dozen; five of the seven need nobody new. |
| **R6** Life: a populace | Opus 5 | Container | C, D | `data/populace.json`, `src/populace.js`, and ten bodies off the `cast` that already exists. No new asset, no new clip, so the row that makes every other wishlist row visible does not itself wait on one. |
| **R1** A fourth body | Fable 5.1 | **Local: net** | C | Fetch, check against the three name lists, encode, add to `cast`. Not beside R6. |
| **R7** Sound | Fable 5.1 | Container | E | The ambient beds and the cross-fade. Alone in its lane, which makes it the right row for a session when A, C and D are all held. |

R4a (the bells call) and R4b (the `since` field) are startable today too, but
both are lane A and R8 is the better use of that lane: R8's next increment is
specced down to the field names, while R4a is an open design question that has
to overturn #533 rather than work around it.

### Wave B — the moment R2 lands

| Row | Model | Where | Lane | Note |
| --- | --- | --- | --- | --- |
| **R3** The images | Opus 5 | Local: GPU | none | Straight out of R2's screenshots. Do it in the same sitting: the run is already done and the shots are already on disk. |
| **R5** The hall covering | Sonnet 5 | Local: GPU | B | A ¼, and the smallest thing left on the list. Six of the twelve stand in that room at Vespers and the accusation is made there, which is why #528 would not guess at it. |
| **R11** Feel | Sonnet 5 | Local: GPU past its Node line | D | The shadow decal and the reaching hand only. Nothing else in the theme starts before that pair, because they are the ones most likely to reveal whether the budget has room for the rest at all. |

These three do not gate each other. R5 and R11 are different lanes and R3 has
no lane.

### Gate 2 — R4c, Thomas Wykes's yard

**Local, lane B, Opus 5.** Ground west of the barbican has existed since #546 —
ground, a road, four trees and fog — and nothing is built on it. The yard is
the first building, and until one building stands there **R9's town cannot
start**, because nobody has proven that ground carries one.

Take it in the same sitting as R5 if the machine is already up, or after. Same
lane, so not at the same time.

### Wave C — after Gate 2

| Row | Model | Where | Lane |
| --- | --- | --- | --- |
| **R9** A castle to get lost in: the town | Opus 5 | Container | B |

A walled town's street, church and quay on the ground the yard proved. The
rooms go on the map the day they go in `config.rooms`, because the map is the
plan's list and not a second one (#588 to #591).

### Anytime — never gated, take it when the lane is free

| Row | Model | Where | Lane | Note |
| --- | --- | --- | --- | --- |
| **R10** Bodies | Fable 5.1 | Local: net | C | Trades activity clips with R6 in both directions; neither strictly gates the other. Try a scaled-down child before fetching anything. |
| **R12b** Move-and-delete | Opus 5 | Container | B | Turns the editor from a stopwatch into an editor. Every content row got cheaper the day the editor landed and none was blocked on it; the same is true of this. **Starts from a red suite**: `test/tools.mjs`'s byte-exactness rail passes on LF and fails on CRLF, so it is red on the dev machine and green in CI, written up under #607 to #611. |
| **R12c** The dialogue format | Opus 5 | Container | C | Deliberately unspecified. `WISHLIST.md`'s paragraph is the whole brief. |
| **R4a** The bells call | Opus 5 | Container | A | Has to overturn #533 rather than work around it. The cheapest shape that does not fight it: `day2.watches`, its own list, with the engine reading whichever list the day names. |
| **R4b** The `since` field | Opus 5 | Container | A | A fact in `data/lore.json` that changes with what the player did on day one. It needs second-day state to be about, and `day2.knew` (#575) is that state, shipped. |

---

## What this file does not say

**It does not re-rank.** `BACKLOG.md`'s order is Devon's, and the order above
respects it everywhere a gate does not force otherwise. The one real inversion
is that wave A puts R8, R6 and R12a ahead of R4 and R5, and that is because R4's
remaining threads are a design call plus a local job while R5 sits behind gate
1. When R2 lands, the ranks and the order agree again.

**It does not claim a size it cannot see.** Five of the twelve are 2+ rows,
which by this repo's own rule means they will not finish in one sitting and
stay in the table afterwards with their text rewritten to say what is done. The
order above is an order for *starting*, not a schedule.

**It does not soften #53.** Every row marked `Local: GPU` also has a Node
acceptance criterion, deliberately, so the row is not blocked on hardware — but
a Node criterion met is not the row done. A session that meets the Node half
and calls the row closed has misread a split every one of those specs draws on
purpose.
