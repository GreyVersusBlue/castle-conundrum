# ASSET-WISHLIST

What to generate with Nano Banana Pro and Veo for Castle Conundrum, written
2026-10-03 from a read of the repo. Nothing in the repo was changed to write
this. It ranks 4 image jobs (22 to 27 finished images) and no video.

**Read this first: the repo already refuses most of what an image model could
make for it.** #743, #760 and #803 lock it: a texture the castle wears is drawn
by a program in the repo and held pixel-identical to that program's output, and
"an image model's output" is refused by name. `test/assets.mjs` check 3b, 8 and
9 enforce it (128 px, 32 colours, re-rendered in Node). So nothing below goes
onto a mesh. Every shipped item is in the DOM layer: the loading screen, the
dialogue box, the accusation panel, the verdict pane, the social card.

**Even that needs one decision before any of it ships.** #743's reason was
provenance ("a licence story nobody can write down"), and that reason does not
stop at meshes. Items 1 to 3 need a new numbered decision, class O, written by
`architect`: generated illustration is admitted in the DOM, never on a mesh,
and each file is a row in a committed manifest (model, date, prompt, sha256).
Item 4 ships nothing and needs no decision.

## 1. Style anchor

The 3D castle is low-poly and flat-shaded, with 128 px pixel-art stone
magnified NEAREST at 43 texels a metre, under a flat fog-coloured sky that
changes at each of four bells (`#c6ccd6` at Prime to `#7c7486` at Vespers).
The DOM over it is a different, quieter thing: Georgia serif, parchment
`#e8dcc0` text on a near-black brown panel `rgba(24,18,12,0.92)`, one gold
accent `#d4a349`, thin `#8a6a2f` borders. The setting is a Welsh royal castle
of the 1280s on Conwy's plan, in an invented kingdom, and nobody casts
anything on screen. The tone is dry and grave: a clerk's record of a death,
written by people who would rather it were a fall.

**The generated art belongs to the DOM layer, so it matches the DOM and does
not imitate the 3D.** An image model fakes a pixel grid badly, and a painted
castle on the loading screen promises graphics the game does not have. A
four-colour woodcut in the UI's own palette reads as the document layer of the
same game, hides model artefacts behind hatching, and compresses to almost
nothing.

**Style prefix, paste at the start of every prompt:**

```
Hand-cut woodcut print illustration, like a plate in a medieval chronicle.
Exactly four flat colours and nothing else: brown-black ink (#2a2118),
warm parchment (#e8dcc0), antique gold (#d4a349), brick red (#7e2a20).
Bold carved outlines, parallel hatching for shadow, no gradients, no soft
shading, no photorealism, no 3D render look, no pixel art. Flat, even
parchment background with no stains, no torn edges and no vignette.
Setting: a Welsh royal castle of the 1280s, grey stone drum towers,
plain wool and linen clothing, no plate armour, no fantasy elements,
no magic, no modern objects. Mood: quiet, grave, unsentimental.
No text, no lettering, no border, no frame, no signature, no watermark.
```

The four hex values are already in the repo: `--ink`, `--parchment` and
`--accent` in `src/ui.css`, and the favicon's red in `index.html`.

**One post-process for everything shipped.** After generating, quantise each
image to those four colours plus at most two blends (sharp, already a
devDependency), then export WebP. That step is what makes 20 images from 20
generations look like one hand, and it is what keeps the whole set under
1 MB. It is a small script under `tools/art/` and it is where the manifest
gets written. Described in section 7, not made.

## 2. Nano Banana Pro, ranked by impact per effort

### 2.1 The key art: one image, three uses

**What and where.** The social card is today a muddy mid-play screenshot with
a "New clue" toast across an NPC's back (`assets/og/castle-conundrum.jpg`,
101 KB). The loading screen is a radial gradient and a bar
(`#loading-screen` in `index.html`, `src/ui.css` line 27) and it is on screen
for the whole of a 28 MB asset load. The README has no image at all. One
textless master fixes all three.

**Prompt (master, landscape):**

```
[STYLE PREFIX]
Wide view of a castle on a rock above a river estuary at dusk, seen from
outside and slightly below. A long curtain wall with eight round drum
towers, divided into two wards by a cross-wall, one tower taller than the
rest with a small bell-cote. A wall walk runs the whole circuit at the top
of the wall. One tiny figure carrying a lantern stands alone on the wall
walk between two towers, the lantern the only gold in the upper half.
A plain sky of horizontal hatching, a low sun behind the towers.
The lower-left third of the image is calm, mostly empty parchment-coloured
water with a few hatch lines, left clear for a title to be placed later.
```

**Prompt (title variant, an edit of the approved master):**

```
Keep this image exactly as it is. In the empty lower-left area add the
words CASTLE CONUNDRUM in two lines of wide-spaced serif capitals, in the
brown-black ink colour, carved in the same woodcut manner. Add nothing else.
```

**Prompt (portrait recompose, with the master attached as reference):**

```
[STYLE PREFIX]
The same castle, same towers, same lantern figure, recomposed as a tall
image: the castle in the upper half, the rock and the river filling the
lower half with calm, mostly empty water.
```

**Set, exactly three generations:**

| File | Aspect | Generate at | Ship at |
| --- | --- | --- | --- |
| `key-art-master.png` (textless, not shipped, keep outside the repo) | 16:9 | 4K | n/a |
| `key-art-title.png` (the edit, not shipped) | 16:9 | 4K | n/a |
| `key-art-portrait.png` (textless, not shipped) | 9:16 | 2K | n/a |

Derived files, all made by cropping and resizing, no further generation:

| File | Size | Target weight |
| --- | --- | --- |
| `assets/og/castle-conundrum.jpg` (from the title variant, cropped to 1.905:1) | 1200 x 630 | under 150 KB |
| `assets/og/castle-conundrum-preview.jpg` | 330 x 200 | under 20 KB |
| `src/art/loading-wide.webp` (textless) | 1600 x 900 | under 150 KB |
| `src/art/loading-tall.webp` (textless) | 900 x 1600 | under 110 KB |
| README hero, the same 1200 x 630 jpg | | 0 extra |

**Background.** Opaque. No transparency needed anywhere.

**Why first.** Three surfaces from one approved image, and the og swap is a
file replace plus one word of alt text.

### 2.2 The roll: fourteen portraits

**What and where.** Fourteen named people stand on four body files: three on
`King.glb`, five on `Adventurer.glb`, three on `Woman.glb`, three on
`Farmer.glb`, told apart by a tint. A twelve-suspect mystery where the
Constable, the Steward and the King's inspector are the same mesh in three
colours is the weakest thing in the game that a still image can fix. The
portrait goes in the dialogue box beside `#dialogue-name` and on each
`.pick-person` button in the accusation panel (`src/ui.js` lines 329 and 639).

**Background.** Opaque, on purpose. Each portrait is a square medallion on
flat parchment and is shown in a 1 px `--accent-dim` frame. No cutout, no
chroma key. A cutout head over the 3D scene would need clean alpha that the
model cannot give and would look pasted on.

**Consistency.** A set. Generate the Constable first and approve it. Attach
that approved image as a style reference to every one of the other thirteen
with the line "same hand, same line weight, same framing as the attached
print". Each garment takes the person's `tint` from `data/npcs.json`, which is
the one link between the portrait and the body in the castle. Because the
post-process flattens to four colours, the tint is asked for as a pattern
(solid, hatched, striped, pale) and not as a hue.

**Shared portrait frame, paste after the style prefix:**

```
Head-and-shoulders portrait, three-quarter view facing left, eyes on the
viewer, centred, the head filling the middle two thirds of a square image,
flat empty parchment behind. An invented face, not resembling any real
person or actor. Neutral, guarded expression.
```

**The fourteen, one line each, appended to the frame:**

| File | Line |
| --- | --- |
| `constable.webp` | A knight of about fifty, cropped grey beard, heavy brow, a brick-red surcoat over mail at the collar, a plain gold chain. |
| `steward.webp` | A soft, careful man of forty-five, clean-shaven, a close linen coif, a dark hatched gown with a gold key at the belt. |
| `clerk.webp` | A thin, neat man of about forty, ink-stained fingers raised to his collar, a dark solid hood pushed back, a wax tablet under his arm. |
| `porter.webp` | A broad, weathered man of sixty, grey stubble, a plain hatched hood, a ring of iron keys on his shoulder. |
| `cook.webp` | A strong woman of about forty, sleeves rolled, a pale linen head-wrap and apron, flour on one forearm. |
| `chaplain.webp` | A tonsured priest of fifty-five, tired eyes, a plain dark solid habit, a small wooden cross on a cord. |
| `sentry.webp` | A young garrison soldier, about twenty-five, a padded jack drawn in vertical stripes, an iron kettle-hat, short dark beard. |
| `apprentice.webp` | A boy of about sixteen, stone dust in his hair, a pale tunic, a mason's mallet handle at his shoulder. |
| `laundress.webp` | A woman of about thirty, a pale kerchief, red hatched hands from the wash, a pale striped dress. |
| `prisoner.webp` | A big smith of about forty, eleven days unshaven, a torn dark shirt, soot on his neck. Calm, not menacing. |
| `merchant.webp` | A town merchant of fifty, well fed, a fur-trimmed hatched cloak, a red felt hat, a purse at the belt. |
| `lady.webp` | A noblewoman of about thirty-five, a white wimple and gold fillet, a pale gown with a gold-edged mantle. |
| `inspector.webp` | A lean royal official of fifty, travel-stained plain cloak, a flat cap, a leather document case on a strap. |
| `hywel.webp` | A master mason of about fifty-five, grey beard, a leather apron, a pair of iron dividers in his hand. Alive, steady, looking straight out. |

**Aspect, resolution, files.** 1:1, generate at 1K, ship at 256 x 256 WebP
into `assets/art/portraits/<id>.webp`, where `<id>` is the cast id in
`data/npcs.json`. Target 12 to 18 KB each, about 210 KB for the set.

### 2.3 Three verdict plates

**What and where.** The game ends on `#verdict-pane`: an `h1`, two paragraphs
and a button. Seven verdicts in `data/mystery.json` under
`accusation.verdicts`. Seven plates is a consistency job with little return,
because five of the seven are "the wrong man, or the right man for too little".
Three plates cover all seven and say something the text does not.

| File | Verdict keys | Prompt, after the style prefix |
| --- | --- | --- |
| `verdict-full.webp` | `full` | A rider in a plain cloak seen from behind, riding west along a road away from a castle at first light, a walled yard with stacked grey sheets beside the road. He does not look at it. Long hatched shadows, a low gold sun. |
| `verdict-hanged.webp` | `clerk`, `steward`, `porter`, `merchant`, `prisoner` | One tall drum tower of a castle at first light, seen from the ward below, its door standing open and nobody in it. Three crows on the battlements. An empty ward, long shadows, a low gold sun. No people, no rope, no gallows. |
| `verdict-nobody.webp` | `nobody` | A single sheet of parchment on a plain oak table, a red wax seal pressed at its foot, a quill laid across it, an unlit candle. Seen from above at an angle. The sheet has ruled lines but no readable writing. |

**Aspect, resolution.** 3:2, generate at 2K, ship at 1080 x 720 WebP into
`assets/art/verdict/`. Target 60 to 90 KB each. Opaque, a set of three, the
Constable portrait attached as the style reference.

### 2.4 Reference sheets for the Blender rows (never committed, never shipped)

**What and where.** Rows 2b (interiors kit) and 2d (the animals) are specced
and unbuilt, and both are Blender scripts written from text with nobody
looking at a picture. #803 forbids an input file, and a picture a person
looks at while the script is written is not one. A front and side orthographic
sheet per kind is the cheapest way to get a pig's proportions right the first
time on a low-RAM box where every render costs.

**This is the one item that breaks the style prefix on purpose.** It is
reference for the 3D look, so it asks for the 3D look:

```
Orthographic model sheet on a flat mid-grey background: front view and
side view of the same object at the same scale, side by side, with a thin
horizontal ground line. Low-poly, flat-shaded, faceted, very few polygons,
no bevels, no textures, each face one flat colour from a muted medieval
palette of stone greys, oak browns, linen and rust. No perspective, no
shadows, no labels, no text. Subject: [SUBJECT]
```

**Set, nine sheets, 16:9 at 2K, PNG, kept outside the repo or under a
gitignored `briefs/ref/`:** a pig, a goat, a sheep, a horse, a cat, a goose
(2d's six kinds), and one sheet each of a medieval kitchen's dressing, a great
hall's dressing, and a prison cell's dressing (2b's three rooms, several
objects to a sheet).

## 3. Veo

**Skipped. This repo has no good use for generated video, and I would not
spend a credit on it.** Five reasons, each from the code:

1. **There is nowhere for a hero loop.** `#start-overlay` is a 55 % black
   scrim over the live 3D castle, already rendered. A video there covers the
   game with a picture of a different, better-looking game.
2. **The loading screen is the wrong place to add megabytes.** It exists
   because 28 MB is coming down the wire. A 2 MB clip competes with the thing
   it is decorating, and on a fast connection it is on screen for 3 seconds.
3. **The look cannot match.** Veo makes photoreal or painterly motion. The
   castle is flat-shaded low-poly with NEAREST pixel stone. An intro clip
   sets an expectation the first frame of play breaks.
4. **The endings are the tempting cutscene and the wrong one.** Six of seven
   end in a hanging. A generated clip either shows it, which is a content
   problem, or pans across an empty tower, which a still does for 80 KB
   (item 2.3) without a `<video>` element, a poster frame or an autoplay
   policy to test in `test/overlays.mjs` and `test/touch.mjs`.
5. **A trailer should be the game.** `npm run play` already walks the whole
   day in a real window on a GPU and leaves a screenshot per beat in
   `shots/play/`. Screen-recording that run is a truer trailer than anything
   generated, and it lives on GitHub or YouTube, not in `dist/`.

If you want to burn Veo credits anyway, the only defensible clip is an
image-to-video of the approved key art (the lantern figure walking ten paces
along the wall walk, locked camera, 8 s, 16:9) posted to social and never
shipped in the page. I would still make it a still.

## 4. Don't generate

| Thing | Why not | What instead |
| --- | --- | --- |
| Wall, floor and ground textures | Locked: #742, #743, #760. Check 3b re-renders each one in Node and an image model's output fails by construction. | `tools/pixel/textures.json` rows. |
| Tapestries, banners, stained glass, crest shields | They exist already as `assets/props/*.glb`, each on one 128 px, 32-colour atlas (check 9, #831). A generated image is neither. | Devon's Blender script in `tools/props/`. |
| A sky | Every screenshot in `looks/2026-10-03/` has a flat sky, and it is the weakest 40 % of each frame. It is still a mesh-side texture, so #743 applies, and a painted panorama over pixel stone is two games in one frame again (#630). | A gradient dome and a few pixel clouds from `tools/pixel/`, per watch, reading the existing `lighting.watches` colours. Worth a row of its own. |
| The journal map | It is drawn as SVG from `src/castle-plan.js` (#589). A generated map would be wrong about a castle whose geometry is tested to 0.01 m. | Leave it. |
| The engineer's drawing, the mason's mark, the bakers' notches | Same reason: these documents describe the real plan and real marks. | SVG from the plan, if ever. |
| Parchment or paper textures for panels | A 4-line CSS gradient or one SVG `feTurbulence` filter does it at 0 bytes and scales to any panel. | CSS. |
| Favicon, crosshair, HUD icons, the touch ring | The favicon is already an inline SVG. Icons need exact edges at 16 to 46 px and a model gives soft ones. | SVG. |
| Loading bar art, button art, borders | CSS. | CSS. |
| Four bell title cards | Considered and cut. The bell changing is already a sky, a toast and a sound; a card stops a player the game promises never to stop. | Nothing. |
| Seven verdict plates | Three cover it (2.3). | Three. |
| Item or clue icons for 39 clues | A 39-image consistent set for a list that reads fine as text. | Nothing. |
| Gameplay-looking screenshots | A generated "screenshot" is a false claim about the game. | `shots/play/` from a real GPU run. |

## 5. Constraints check

**Page weight.** `dist/` is 35 MB today: 28 MB of `assets/`, an 843 KB
bundle. Everything shipped above totals about 0.8 MB (og 170 KB, loading
260 KB, portraits 210 KB, plates 240 KB). Hold it under 1 MB and treat that
as the budget. The loading backdrop is the only file on the critical path, so
it is the only one whose size matters to first paint: under 150 KB wide,
under 110 KB tall.

**GitHub Pages limits.** Published site 1 GB, 100 GB a month of bandwidth,
100 MB per file in git. This repo's own ceiling is tighter and is the one
that binds: 200 MB (#499). None of it is near.

**Single-file HTML.** Not relevant. This is a Vite build into `dist/`, not a
single file, and nothing should be inlined as base64. Vite inlines assets
under 4 KB on its own; none of these are.

**The `test/built.mjs` trap.** That suite diffs every file served under
`/assets/`, `/data/` and `/decoders/` between the dev server and `dist/`. An
image under `assets/` referenced from `src/ui.css` gets hashed by Vite into
`dist/bundle/` in the build and served from `/assets/` in dev, so the diff
goes red with "1 missing". Two safe routes, and section 7 uses both: CSS
backgrounds live under `src/art/` so Vite owns them on both sides, and
anything under `assets/art/` is addressed by a string built at runtime, the
way every glTF already is.

**Same origin (#493).** All of it is committed and served from the page's own
origin. No hotlinking a generated image from Google storage, ever.
`harness.mjs` would block it and `built.mjs` would fail on `__blocked`.

**The encoder (#506).** `npm run assets:encode` turns textures into KTX2, and
a `<img>` or a CSS background cannot read KTX2. These are DOM images, not
textures, and the new decision has to say so in words, or the next reader of
"every asset is compressed, by a script" will encode them. `assets/og/` is
the precedent: two JPEGs the encoder leaves alone.

**Check 4 does not sweep `assets/art/`.** It sweeps five named directories.
An unreferenced portrait would sit there as dead weight with nothing to say
so. Extending the sweep is part of the integration, and it gets broken on
purpose once (#34).

**Video.** None, so no poster frames, no lazy loading, no autoplay policy.

**Lazy loading for images.** Portraits and plates are fetched when first
shown, not at load. The loading backdrop is the only eager one.

**Age-appropriateness.** Nothing in the repo says this is student-facing, but
it is public on Pages, and the text already carries a death and six hangings.
The images stay a notch gentler than the text: no body, no rope, no gallows,
no figure on a tower, no blood, no weapons drawn. The prisoner is "calm, not
menacing" in his prompt for that reason, and plate 2 says "no people, no
rope, no gallows" in the prompt itself, because a model asked for a hanging
tower will draw one.

**Copyright and likeness.**

- No artist names and no game names in any prompt. The woodcut-chronicle look
  will remind people of a well-known 2022 narrative game; do not name it, and
  do not ask for its lettering.
- Every portrait prompt carries "an invented face, not resembling any real
  person or actor". Do not add "looks like" anything.
- The castle is described, not named. The plan is Conwy's, but a prompt that
  says "Conwy Castle" returns a tourist photograph's composition.
- No real heraldry. If a model puts three lions on the Constable, regenerate:
  those are a real crown's arms and the kingdom here is invented.
- The names are either invented or seven centuries dead. No risk there.
- Google embeds an invisible SynthID mark in every output, and that is fine.
  Check the corner of each download for a visible mark as well; if your plan
  adds one, compose so the crop removes that corner, and say in the README's
  Credits that the illustrations are model-generated. The repo's credits are
  exact about where everything else came from and these should be too.

## 6. Batching plan

Three sessions, about equal effort. All image, no Veo.

| Session | What | Generations, with retries | Why here |
| --- | --- | --- | --- |
| **1. Lock the style and the key art** | 2.1's master, title edit and portrait recompose. Then the Constable portrait as the style test. | 15 to 20 | Everything after this attaches these two images as references. If the four-colour woodcut does not hold up at 256 px, find out now, before thirteen more. |
| **2. The roll** | The other thirteen portraits, each with the Constable attached. | 30 to 40 | The largest set and the one consistency matters most on. Do it in one sitting, same chat, same reference. |
| **3. The plates and the sheets** | Three verdict plates, then nine reference sheets. | 20 to 25 | The plates reuse session 1's style. The sheets are a different style and independent, so they go last and can be dropped without loss to the page. |

**Veo: zero clips are worth the credits.** Each candidate and what it should
be instead:

| Candidate clip | Verdict |
| --- | --- |
| Hero loop behind the start panel | Nothing. The live castle is already there. |
| Loading screen loop | A still: `loading-wide.webp`. |
| Intro cutscene | Nothing. The start panel's one paragraph does it. |
| Ending cutscenes | Stills: the three plates. |
| Trailer | A screen recording of `npm run play`. |
| Social teaser from the key art | The only arguable one. Still a still. |

## 7. Integration notes

Described, not made. Classes are `CLAUDE.md`'s.

**Before any of it (class O, `architect`).** One `HISTORY.md` decision
amending #743 and #803: model-generated illustration is admitted in the DOM
and never on a mesh; the files are not textures and do not go through
`tools/encode-assets.mjs`; provenance is a row per file in
`tools/art/manifest.json` (model, date, full prompt, sha256). One `SPECS.md`
section with the three increments below. Then `README.md`'s Credits gets a
paragraph.

**A script (class S, `builder`).** `tools/art/finish.mjs`: reads a source PNG
from a path outside the repo, crops, quantises to the four colours, writes the
WebP or JPEG, writes the manifest row. Hand-run, like `pixel:render`. A
second run is a no-op.

| Asset | Path | Code change |
| --- | --- | --- |
| Social card | `assets/og/castle-conundrum.jpg`, `assets/og/castle-conundrum-preview.jpg` | Replace both files, same names, same sizes (1200 x 630, 330 x 200). In `index.html`, change `og:image:alt` from "Castle Conundrum, mid-play." to a line that describes a woodcut. `test/built.mjs`'s og check keeps passing because the path does not move. |
| README hero | none new | One image line at the top of `README.md` pointing at `assets/og/castle-conundrum.jpg`. |
| Loading backdrop | `src/art/loading-wide.webp`, `src/art/loading-tall.webp` | In `src/ui.css`, `#loading-screen` gets `background-image: url('./art/loading-wide.webp')` under the existing radial gradient as a darkening layer (about 70 % so the bar and the status line keep their contrast), `background-size: cover`, and an `(orientation: portrait)` media query swapping in the tall file. No JS. Vite hashes both into `dist/bundle/`. `test/built.mjs` is untouched because neither side serves them from `/assets/`. |
| Portraits | `assets/art/portraits/<id>.webp`, 14 files | `index.html`: an `<img id="dialogue-portrait" alt="">` inside `#dialogue-box`, hidden by default. `src/ui.js`: where line 329 sets `dialogueName`, also set the image `src` from a string built at runtime, `'./assets/art/portraits/' + id + '.webp'`, and hide it for a speaker with no file (documents, the populace). The dialogue call has to be handed the cast id, not only the name; check what `src/npc.js` and `src/quest-manager.js` pass. In the accusation picker (line 639) each `.pick-person` button gets the same image at 48 px. `src/ui.css`: a 96 px frame left of the text on wide screens, 56 px on the 412 px touch layout. `loading="lazy"` and explicit width and height on every `<img>`. `test/overlays.mjs` and `test/touch.mjs` drive both screens and will need a look; `test/assets.mjs` check 4 extends to `assets/art/` so each of the 14 is reachable from a cast id and no fifteenth file can sit there. |
| Verdict plates | `assets/art/verdict/verdict-full.webp`, `verdict-hanged.webp`, `verdict-nobody.webp` | `data/mystery.json`: each of the seven `accusation.verdicts` rows gains a `plate` key naming one of the three (the mapping is in 2.3). `src/mystery.js`'s validator fails a verdict with no plate or an unknown one, which keeps it a data fact `test/mystery.mjs` holds in Node. `index.html`: an `<img id="verdict-plate" alt="">` above the `h1` in `#verdict-pane`. `src/ui.js` `showEpilogue` (line 706) takes `plate` and sets the `src` by runtime string. The second day reuses the pane with a different label and passes no plate, so the image hides. No save change: the verdict is already in the save and the plate is derived from it. |
| Reference sheets | outside the repo, or `briefs/ref/` added to `.gitignore` | None. Attach the relevant sheet when handing over 2b or 2d. Never under `tools/blender/` and never under `assets/`: check 8 hashes that pipeline's inputs. |

**Order to hand back in.** The social card and README first: two files and
one attribute, shippable the day the decision is written. The loading
backdrop second: CSS only. Portraits third: the only one that touches two
browser suites. Plates last: one new data key and its validator line.
