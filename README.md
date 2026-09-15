# Castle Conundrum

A first-person medieval murder mystery, played in a browser. Hywel ap Gruffudd,
master mason, is dead at the foot of the Chapel Tower stair. The Constable
wants it written down as a fall before Vespers. You have four bells.

Twelve suspects who move between rooms as the day turns, tell the truth about
most things and lie about one each. Thirty-nine clues and three red herrings in
a graph a validator holds coherent before the page loads. A word-lock over the
muniment room door. One accusation, which you can get wrong, and a hanging at
the end of it.

Built in [three.js](https://threejs.org/) r169, on a 4 m tile grid, in a Welsh
castle of the 1280s: two wards divided by a cross-wall with one guarded gate, a
Great Hall, a kitchen, a chapel, a prison, a muniment room, royal apartments on
the floor above, and a wall walk that runs the whole circuit two storeys up —
which is the fact the mystery turns on.

**WASD** move · **mouse** look · **Shift** sprint · **E** talk, examine, ring ·
**J** journal.

## Running it

```
npm install
npm run dev
```

Then open the URL it prints. `npm run build` writes `dist/`, and
`npm run preview` serves that.

Nothing the page fetches leaves its own origin: no CDN, no font host, no asset
host. three comes from npm at build time; the 43 MB of glTF and textures under
`assets/` is committed to this repo and copied into `dist/` whole.

## The suites

```
npm test              # all eight, cheapest first, non-zero on any failure
npm test layout       # or any subset by name
```

Six of them are Node against source and take seconds: `gltf`, `assets`,
`layout`, `quest`, `mystery`, `save`. `plan-vs-scene` drives a headless
Chromium over `npm run dev`, waits for the castle to finish building, and diffs
every placed object's live `Box3` against `src/castle-plan.js`'s box at 0.01 m.
`built` is the one check that loads what `npm run build` produced.

`npm run play` is the ninth and is not in `npm test`. It opens a real visible
window, takes pointer lock, and plays the whole day with real input — twelve
people, ten pieces of evidence, three bells, a reload at Sext and the full
ending — leaving a screenshot per beat in `shots/play/`. It needs a machine
with real GPU compositing, because a real-time movement assertion under a
software-rendered Chromium is inconclusive rather than confirmed, in either
direction.

CI runs `npm run build` and then `npm test`, on every pull request and every
push to `main`. There is no list of failures that are allowed to stay red.

## How this is worked

**`BACKLOG.md` ranks what is open. `HISTORY.md` records what shipped, as
numbered locked decisions. `PLAN.md` is the plan the whole thing was built
from** — 64 K of phase plans, all seven phases now shipped, ending in a list of
what a later arc could take up. `CLAUDE.md` is the house rules, and the two
that matter most are that `src/castle-plan.js` is the single source the builder
and every suite read, and that a guard-rail you add gets broken on purpose once
before you believe it.

The project lived in [`GreyVersusBlue/tools-and-games`](https://github.com/GreyVersusBlue/tools-and-games)
under `Projects/Castle Conundrum/` until 2026-09-15 and moved here with its
history intact. `PLAN.md` was moved unedited and still spells the old paths.

## Credits

Models from [Kenney](https://kenney.nl/)'s Retro Fantasy Kit (CC0) and
[Poly Haven](https://polyhaven.com/) (CC0).
