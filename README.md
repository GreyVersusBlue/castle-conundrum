# Castle Conundrum

A first-person medieval murder mystery, played in a browser. Hywel ap Gruffudd,
master mason, is dead at the foot of the Chapel Tower stair. The Constable
wants it written down as a fall before Vespers. You have four bells.

Twelve suspects who move between rooms as the day turns, tell the truth about
most things and lie about one each. Thirty-nine clues and three red herrings in
a graph a validator holds coherent before the page loads. A word-lock over the
muniment room door. One accusation, which you can get wrong, and a hanging at
the end of it.

Then the morning after. Seven endings, seven versions of Lauds: whoever you
named is gone from his station, the rest of the castle has something to say
about it, and the King's inspector is at the table in the King's Hall with the
sheet in front of him and questions you cannot answer any more.

Built in [three.js](https://threejs.org/) r169, on a 4 m tile grid, in a Welsh
castle of the 1280s: two wards divided by a cross-wall with one guarded gate, a
Great Hall, a kitchen, a chapel, a prison, a muniment room, royal apartments on
the floor above, and a wall walk that runs the whole circuit two storeys up —
which is the fact the mystery turns on.

**WASD** move · **mouse** look · **Shift** sprint · **E** talk, examine, ring ·
**J** journal: what you know, things read, a map of the castle that fills in
room by room as you stand in them, and what has been asked of you.

Stand in the right room at the right bell and somebody performs: the chaplain
says Vespers to whoever came, the garrison sings in the hall over supper, the
cook sings over her pots at noon, and on the morning after there is an office
said over a filled grave. Nothing waits for you and nothing stops you walking
out in the middle of it.

On a touchscreen: **left thumb** move · **right thumb** look · **push the stick
over** sprint · one **E** button that says what it will do · **Journal**. The
page picks the scheme by `(pointer: coarse)` and `maxTouchPoints`, and the
start panel has a toggle for the laptop that is both (#530).

It is live at <https://greyversusblue.github.io/castle-conundrum/>, published
by `.github/workflows/pages.yml` on every push to `main`. That workflow runs
`npm run build` and serves `dist/`, **not the repo root** — since the import map
went away in favour of Vite, the source is not servable on its own (#505).

## Running it

```
npm install
npm run dev
```

Then open the URL it prints. `npm run build` writes `dist/`, and
`npm run preview` serves that.

**`?edit=1` on the dev server opens the placement editor.** A panel top-left
reads the tile under your feet as you walk; pick an array and a model and press
**P**, and the row is written into `data/scene-config.json` where a session
would otherwise have hand-typed two numbers. It writes the file and nothing
else: the diff is yours to read and commit. It is dev-only by construction —
the client is behind `import.meta.env.DEV` and the writer is a Vite plugin with
`apply: 'serve'` — and `test/built.mjs` greps `dist/` to prove it (rank 13,
#582 to #586).

Nothing the page fetches leaves its own origin: no CDN, no font host, no asset
host. three comes from npm at build time; the 39 MB of glTF and textures under
`assets/` is committed to this repo and copied into `dist/` whole.

Every texture under `assets/` is KTX2/Basis and every Poly Haven mesh and NPC
body is meshopt-compressed, which is what takes the castle's textures from
317.9 MB of video memory to 79.9 (#506 to #510). That is a **committed
re-encode**, not a build step: `npm run assets:encode` runs
`tools/encode-assets.mjs` over `assets/` in place, and it needs
[KTX-Software](https://github.com/KhronosGroup/KTX-Software)'s `ktx` on PATH.
Run it on anything you add before you commit it.

Every word the twelve say is also `dialogue/castle.dlg`, one line per line, with
what moves a speaker into each state and what the state is worth written above
it. `npm run dialogue:compile` splices it back into `data/npcs.json` and
`data/quests/`, `npm run dialogue:extract` writes it out again, and
`test/dialogue.mjs` fails if the two have drifted (#687 to #690).

## The suites

```
npm test              # all fifteen, cheapest first, non-zero on any failure
npm test layout       # or any subset by name
```

Ten of them are Node against source and take seconds: `gltf`, `assets`,
`layout`, `budget`, `quest`, `mystery`, `save`, `lore`, `tools` and `dialogue`.
`plan-vs-scene` drives a headless Chromium over `npm run dev`, waits for the
castle to finish building, and diffs every placed object's live `Box3` against
`src/castle-plan.js`'s box at 0.01 m. `touch` drives the same dev server on a
412 x 915 page with a touchscreen and taps its way through the HUD. `map`
places the camera in three rooms and reads the journal's map back, before and
after a reload. `overlays` opens and shuts every screen that covers the castle
and asks who holds the pointer after each one. `built` is the one check that
loads what `npm run build` produced.

`npm run play` is the sixteenth and is not in `npm test`. It opens a real
visible window, takes pointer lock, and plays the whole day with real input —
twelve people, ten pieces of evidence, three bells, a reload at Sext and the
full ending — leaving a screenshot per beat in `shots/play/`. It needs a machine
with real GPU compositing, because a real-time movement assertion under a
software-rendered Chromium is inconclusive rather than confirmed, in either
direction. Pointer lock itself is not one of the reasons: headless Chromium
takes it and gives it back exactly as a headed one does, which is why
`overlays` is allowed in CI.

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
[Poly Haven](https://polyhaven.com/) (CC0), the four NPC bodies from
[Quaternius](https://quaternius.com/) (CC0), re-encoded in place; git history is
the originals.
