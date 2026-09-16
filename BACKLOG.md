# BACKLOG

Open work on Castle Conundrum, ranked. **`HISTORY.md` records what shipped;
this file ranks what is open; `SPECS.md` is the spec for each row below;
`PLAN.md` is the plan the seven shipped phases came out of** and its "What this
leaves for a later arc" list is where most of the rows below came from. Nothing
open lives in `HISTORY.md` and nothing that shipped belongs here.

Each row's `Detail` link goes to its section in `SPECS.md`: scope by file,
acceptance criteria and the suite that holds them, the open judgement calls with
a recommended answer, dependencies, and the house rules that bite. The sections
under the table here are the one-paragraph summaries; where a summary and
`SPECS.md` differ, `SPECS.md` was written against the code and wins.

## Where things stand

**Castle Conundrum v2 is finished** (#489, 2026-09-15). All seven phases of
`PLAN.md` shipped, PRs #306 to #320 in `tools-and-games`. **The project moved
here on 2026-09-15** (#491 to #503): its own repo, its own CI, Vite instead of
a hand-vendored `libs/`, and a 200 MB asset ceiling instead of 44.4.

**Asset compression shipped on 2026-09-15** (#506 to #510): KTX2/Basis over
every texture, meshopt over the Poly Haven props and the NPC bodies, and 317.9
MB of video memory down to 79.9. `tools/encode-assets.mjs` is the pipeline, and
anything **A fourth body** adds has to come through it, the way the texture
sets and the town side already did.

**Four things a GPU saw shipped on 2026-09-15** (#511 to #517, PRs #6 and
#7): a body can climb every flight, the drums wear built crowns instead of
merlons hanging in the air, no two faces share a plane so nothing flickers,
and the castle says where you are: a HUD room line, a tint per drum, and
something in every room. New texture sets did not ship with it, because that
container could not reach Poly Haven or KTX-Software (#518); a later one
could, and the row that came out of that is below.

**Sound shipped on 2026-09-15** (#519 to #522): a footstep per surface class
and the chapel bell, both synthesised out of `data/sounds.json`, no audio file
in the repo at all. What it sounds like is a question for a machine with
speakers (#53).

**The tower roofs shipped on 2026-09-15** (#523 to #526): the North-west,
Kitchen, South-west and Prison Towers have a third flight and a floor at 12 m,
36 walkable cells each under the crown #514 built. The four turreted drums did
not get one and the reason is arithmetic: a 2.5 m turret in a 2.8 m ring leaves
a 0.3 m ledge. The turrets are solid now, which they had never been.

**The Great Hall's roof frame shipped on 2026-09-15** (#527 and #528): seven
trusses across the hall at 8 m, and no covering over them, because nothing in
a container that cannot render can tell which way a kit roof piece slopes or
whether a covered hall goes dark. The covering is rank 7 below, behind the GPU
run.

**The line between the two plan suites was drawn on 2026-09-15** (#529):
`layout.mjs` is every fact derivable from the plan in Node, `plan-vs-scene.mjs`
is the seams only, `mystery.mjs` owns the stations. One dead check deleted,
three assertions moved or turned into preconditions, and **no new check written
to replace them**, because three attempts at one could not be made to fail.

**Touch shipped on 2026-09-15** (#530 to #532): a stick under each thumb, one
E button that wears the prompt, a Journal button, a toggle on the start panel,
and `test/touch.mjs` as the ninth suite. What it FEELS like is unknown — nobody
has had a thumb on it, and the six numbers that decide that are named constants
in one file each (#53).

**The second day shipped in two increments, on 2026-09-15 and 2026-09-16**
(#533 to #540, PRs #16 and #18). The epilogue's button reads "The next
morning" now. One watch, `lauds`, thirteen stations, sixty line sets keyed by
which of the seven endings the player reached, seven closing panes, and a
thirteenth cast entry — the King's inspector — whose conversation is the end of
the game. The save is version 2 with a `day` field; the key did not move (#36).
Increment 2 gave the stone its half: the cell's bars come off on the five
mornings Madoc walks out, which opens to the player the one ground room nobody
has ever stood in, and the muniment door stands open in the full ending and is
shut again in the other six. **Rank 4 is still open**: it is a 2+ and increment
3 is a second mystery for the morning, most of which waited on a town to walk
to.

**The texture sets and the town side shipped on 2026-09-16** (#541 to #546):
`ktx` was on PATH and Poly Haven answered this time, so both rows that #518
had blocked came due together. Five materials over four roles — a dressed
ashlar for the inner ward, a red brick for the four inner drums, a plaster for
the two walls that exist only at level 1, and a deck plank for the eight tower
first floors — plus a sixth, `forest_ground_06`, restored out of this repo's
own history to texture the ground west of the barbican, with a road and four
trees. `dist/` grew by about 17 MB against 200. Increment 3's town half is
unblocked; what it still needs is Thomas Wykes's yard built on the ground this
row laid, and the bells-on-day-two question #533 raises.

**5 ranked items. Nothing is claimed. Take rank 1.** It is the only row a
container without a GPU can finish outright. Rank 4's next increment is the
other thing a container can start, and `SPECS.md` names the one thread of it
that does not wait on a design call: the gaol roll. Ranks 2, 3 and 5 all need
a machine this one is not (#518).

One thing is true of the whole list and worth saying once. **Nothing here has
been seen on a GPU since Phase 5.** `npm run play` walks the whole intended day
— twelve people, ten pieces of evidence, three bells, a reload at Sext, the
accusation and the epilogue, 102 assertions — and no run of it since Phase 5 has
happened on a machine with real compositing (#53). Rank 2 is that run, and it
carries five jobs it did not have: nobody has looked at a compressed texture
(#507) or at the five that shipped after it (#541 to #546), at a tower roof
from 12 m (#523), at seven trusses over the hall (#527), or at a Lauds sky
(#533) — and nobody has put a thumb on a phone (#530). The second standing
line, "the game has never had a thumb on it", came out with #530: the scheme
is there, it is in CI, and what is left of it is the feel.

## How this repo is worked

The standing instruction is *"work the next batch of ranked items in
`BACKLOG.md`, open a PR, merge to `main`."* It runs unattended; Devon is not
reviewing these rounds. **Never stop to ask.** If a row needs a judgement call,
make it, ship it, and record the call in `HISTORY.md` as a locked decision so
it can be reversed cheaply.

**A batch is what fits in one pull request and can be closed out in one
sitting** (#497). That is a judgement, and the `Size` column is there to inform
it, not to arithmetic it: the old repo's "up to 6 quarters, 3 halves, or one 1"
was measured against a cost that scaled with the number of *areas* a batch
spanned, and this repo has one area. Whatever the batch, it merges as **one
PR**, every row in it. A **2+** row is the whole batch on its own, will not
finish in one session, and stays in the table afterwards with its text rewritten
to say what is done.

**Claim your row before you start.** Write your branch name into the `Claimed`
column, commit that alone, open a PR, merge it, then start (#283). A claim on a
branch nobody else can read is not a claim: two sessions in the old repo once
built the same row in full. Clear the column after your merge is confirmed, in
the same pass that updates this header.

**Definition of done.** The work is on a branch and the branch is a merged PR
with CI green. `npm run build` and `npm test` both pass. Any guard-rail you
added has been broken on purpose once, from a green baseline, and you watched
it fail and can say which assertion and what it said (#34). `HISTORY.md` has
your decisions and this file's header, ranks and `Claimed` column are updated
**before you finish** — never left for a later session.

## The ranked table

| Rank | Item | Size | Model | Claimed | Detail |
| --- | --- | --- | --- | --- | --- |
| 1 | A fourth body, and a woman's in particular | ½ | Fable 5.1 |  | [A fourth body](SPECS.md#a-fourth-body) |
| 2 | A real GPU run of `npm run play`, and somebody looks at the twelve | ¼ | Opus 5 |  | [The GPU run](SPECS.md#the-gpu-run) |
| 3 | A new preview and og card, from that run | ¼ | Opus 5 |  | [The GPU run](SPECS.md#the-gpu-run) |
| 4 | A second day: increment 3, a second mystery for the morning | 2+ | Opus 5 |  | [A second day](SPECS.md#a-second-day) |
| 5 | The hall's covering, and the two windows under it | ¼ | Sonnet 5 |  | [The hall covering](SPECS.md#the-hall-covering) |

## A fourth body

**Rank 1.** Marged, Nest and Lady Alys are three of twelve and the Kenney kit
has no woman's body. Twelve NPCs come off three bodies by tint (#417, #419) and
that was accepted as a risk, not as a solution. **Question 1 for Devon in
`PLAN.md`**, and under this repo's own rule a session may answer it: find or
make a fourth body, add it to `data/npcs.json`'s `cast`, and record the call.
Whatever it is goes through `tools/encode-assets.mjs` before it is committed
(#506): an uncompressed body is the one asset nothing else on this list would
notice.

## The GPU run

**Ranks 2 and 3.** `npm run play` has not run on a machine with real GPU
compositing since Phase 5 (#53). It is 102 assertions over the whole day and it
writes a numbered screenshot per beat into `shots/play/`. Two things come out
of one run: whether the walk, the stairs and the wall walk actually behave, and
whether **twelve NPCs off three bodies read as twelve** — photograph all twelve
in the Great Hall at Vespers and look (`PLAN.md`, Risks). **And now a third:
nobody has looked at a compressed texture.** #507 put ETC1S on every diffuse and
UASTC on every normal and ARM map on a reading of what each codec does to which
channels, checked by nothing but bytes and a headless software rasteriser.
Whether 8 m of `castle_wall_slates` bands is a question only a real render
answers.

Rank 3 depends on rank 2 having happened. The board preview and og card in
`tools-and-games` are from before Phase 3: they show the archway wide open in a
7x7 courtyard that no longer exists, with none of the HUD the game has now
(#374, #379). New images come out of the same run. **Where they go is Devon's**
— those two files live in `tools-and-games/assets/` and he relinks.

## A second day

**Rank 4, and a 2+. Increments 1 and 2 shipped on 2026-09-15 and 2026-09-16**
(#533 to #540): the morning after is there in seven shapes, the cast says what
the verdict made of them, and the castle moves with them. **What is left is a
second mystery for the morning**, and most of it waits on things this repo has
not got. The inspector asks questions the player cannot answer; increment 3 is
where some of them become answerable. Of its three threads, the town has
shipped now (#541 to #546): the missing 128 sheets are in a yard nobody has
placed yet, on ground that now exists to place it on. A schedule with more
than one watch still has to argue with #533 rather than work around it. The
third thread is not blocked at all: the gaol roll is a piece of evidence in a
room the castle already builds, it convicts nobody, and its whole content is
the dates that were in front of everybody and that nobody read. `SPECS.md`
specs it.

## The hall covering

**Rank 5.** The Great Hall has seven trusses over it since #527 and nothing
between them. The kit's `roof*.glb` pieces would cover it, and two windows at
`base` 5 in `great-hall-north` would keep the daylight the covering takes
away. Both halves need somebody to look: nothing in a container that cannot
render can tell which way a kit roof piece slopes (`partsOf` gives all four of
`roof.glb`'s parts the same 1 x 1 x 1 box), and whether a covered hall is dark
is a luma read off a real render (#438). Six of the twelve stand in this room
at Vespers and the accusation is made there, which is why #528 would not guess
at it.
