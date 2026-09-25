# Props

Low-poly props for Castle Conundrum, built by a script in Blender (`Claude Files/Blender Projects/Castle/_source/build.py`).
Every file shares one 128 px pixel-art atlas embedded in the glb, one material per prop, NEAREST filtering.
1 unit = 1 m, glTF Y-up, origin at the base centre of the bounding box, front faces +Z.
Wall-hung pieces (banners, tapestries, shields, sconces, the rood, the window, cobwebs, the watch bill) have their back at -Z, so place them half their depth off the wall.
Cobwebs and the net rack use an alpha-masked, double-sided material.
Nothing here is meshopt-encoded yet: run `npm run assets:encode` once a prop is placed, as #506 asks of every placed prop.

| File | Prop | Tris | W x H x D (m) | Moving nodes |
| --- | --- | ---: | --- | --- |
| `candlestick-brass-bent.glb` | Candlestick, heavy brass, slightly bent | 288 | 0.14 x 0.36 x 0.14 |  |
| `goblet-poisoned.glb` | Poisoned goblet, pewter with dark dregs | 344 | 0.13 x 0.16 x 0.09 |  |
| `garden-shears.glb` | Garden shears, long-handled, rust-flecked | 216 | 0.77 x 0.04 x 0.20 |  |
| `dagger-crested.glb` | Dagger with the family crest on the pommel | 224 | 0.38 x 0.03 x 0.12 |  |
| `body-scene-set.glb` | Body scene: sprawled figure, spilled cup, tipped stool, ink pot | 556 | 2.16 x 0.33 x 1.66 | figure, cup, stool, inkpot |
| `torn-letter.glb` | Torn letter with a broken wax seal | 116 | 0.24 x 0.01 x 0.23 |  |
| `signet-ring.glb` | Signet ring | 128 | 0.03 x 0.03 x 0.01 |  |
| `wax-seal-stamp.glb` | Wax seal stamp and a stick of sealing wax | 156 | 0.13 x 0.11 x 0.07 |  |
| `ledger.glb` | Ledger, thick with a ribbon bookmark | 144 | 0.34 x 0.08 x 0.30 |  |
| `muddy-boot.glb` | Muddy boot | 256 | 0.14 x 0.34 x 0.33 |  |
| `key-ring.glb` | Key ring with four keys | 416 | 0.23 x 0.01 x 0.22 |  |
| `coin-pouch.glb` | Coin pouch | 366 | 0.19 x 0.12 x 0.14 |  |
| `vial-residue.glb` | Small vial with residue | 148 | 0.03 x 0.09 x 0.03 |  |
| `strongbox.glb` | Strongbox, iron-banded with a lock | 216 | 0.44 x 0.28 x 0.31 | lid |
| `chest-iron-banded.glb` | Chest, iron-banded with a hasp lock | 276 | 1.03 x 0.65 x 0.58 | chest, lid |
| `writing-desk-locked.glb` | Writing desk with a locked drawer | 252 | 0.92 x 0.93 x 0.57 | desk, drawer |
| `cell-door-barred.glb` | Barred cell door with stone frame | 288 | 1.40 x 2.25 x 0.30 | frame, door |
| `lectern-slanted.glb` | Slanted lectern with an open book | 192 | 0.66 x 1.32 x 0.48 |  |
| `inkwell-quill-cup.glb` | Inkwell and quill cup | 260 | 0.19 x 0.26 x 0.10 |  |
| `manuscript-stack.glb` | Manuscript stack, loose leaves and tied quires | 120 | 0.54 x 0.16 x 0.34 |  |
| `book-press.glb` | Book press | 232 | 0.60 x 0.67 x 0.32 |  |
| `bookshelf-wall.glb` | Bookshelf, wall unit with mixed spines | 672 | 1.24 x 2.05 x 0.39 |  |
| `altar.glb` | Altar with cloth and a small cross | 312 | 1.80 x 1.55 x 0.93 |  |
| `pulpit.glb` | Pulpit with steps | 350 | 1.07 x 1.90 x 2.31 |  |
| `pew-section.glb` | Pew, modular 1.5 m section | 116 | 1.49 x 1.00 x 0.45 |  |
| `censer-hanging.glb` | Hanging censer | 334 | 0.16 x 1.13 x 0.16 | censer |
| `stone-font.glb` | Stone font with water | 188 | 0.81 x 0.96 x 0.85 |  |
| `rood-cross.glb` | Rood cross, large, for a wall | 96 | 1.82 x 2.76 x 0.20 |  |
| `stained-glass-window.glb` | Stained-glass lancet window | 176 | 1.20 x 2.17 x 0.36 |  |
| `hearth-crane-cauldron.glb` | Hearth crane with a cauldron | 394 | 0.98 x 1.20 x 0.52 | crane, cauldron |
| `spit-rotisserie.glb` | Spit with firedogs and a crank | 308 | 1.60 x 0.72 x 0.31 | firedogs, spit |
| `butcher-block.glb` | Butcher block with a cleaver | 160 | 0.62 x 0.94 x 0.62 |  |
| `herb-bundles.glb` | Hanging herb bundles on a rail | 588 | 1.24 x 0.51 x 0.11 |  |
| `bread-oven-door.glb` | Bread oven door in a stone face | 152 | 1.36 x 1.16 x 0.60 | oven, door |
| `sack-pile.glb` | Sack pile, grain and flour | 464 | 1.15 x 0.73 x 0.90 |  |
| `well-bucket.glb` | Well bucket | 230 | 0.31 x 0.60 x 0.30 |  |
| `trestle-table-set.glb` | Trestle table set with plates, cups and bread | 1072 | 2.40 x 0.98 x 0.80 | table, setting |
| `roasted-boar-platter.glb` | Roasted boar on a platter | 612 | 1.12 x 0.30 x 0.77 |  |
| `lords-high-chair.glb` | Lord's high chair, carved | 240 | 0.83 x 2.26 x 0.63 |  |
| `heraldic-banner-a.glb` | Heraldic banner A (red, gold chevron) | 280 | 1.28 x 1.93 x 0.07 |  |
| `heraldic-banner-b.glb` | Heraldic banner B (blue, white tower) | 280 | 1.28 x 1.93 x 0.07 |  |
| `heraldic-banner-c.glb` | Heraldic banner C (green, gold key) | 280 | 1.28 x 1.93 x 0.07 |  |
| `chandelier-ring.glb` | Chandelier ring, iron wheel with candles | 760 | 1.24 x 1.28 x 1.24 | chandelier |
| `stone-fireplace.glb` | Stone fireplace: carved mantel, chimney breast, log stack | 396 | 2.40 x 4.20 x 1.30 |  |
| `four-poster-bed.glb` | Four-poster bed with curtains | 372 | 1.73 x 2.44 x 2.23 |  |
| `wash-basin-stand.glb` | Wash basin and stand | 442 | 0.44 x 0.85 x 0.42 |  |
| `garderobe-door.glb` | Garderobe door and privy alcove | 236 | 1.20 x 2.30 x 1.17 | alcove, door |
| `travel-chest.glb` | Travel chest with a domed lid | 192 | 0.87 x 0.57 x 0.50 | chest, lid |
| `weapon-rack.glb` | Weapon rack with spears and swords | 444 | 1.48 x 2.37 x 0.30 |  |
| `armour-stand.glb` | Armour stand with a mail shirt and helm | 360 | 0.75 x 1.77 x 0.50 |  |
| `gaming-table.glb` | Gaming table with dice, tankards and a stool | 476 | 0.84 x 0.86 x 1.12 | table, stool |
| `brazier.glb` | Brazier, iron with coals | 280 | 0.67 x 0.85 x 0.67 |  |
| `watch-bill-board.glb` | Watch-bill board with pinned sheets | 216 | 1.06 x 0.75 x 0.09 |  |
| `sundial.glb` | Sundial on a stone pedestal | 176 | 0.55 x 1.07 x 0.55 |  |
| `covered-well.glb` | Covered well with a winch and bucket | 510 | 2.05 x 2.47 x 1.85 | well, bucket |
| `beehive-skep.glb` | Beehive skep on a bench | 272 | 0.84 x 0.86 x 0.43 |  |
| `raised-bed.glb` | Raised bed with herbs and vegetables | 454 | 1.80 x 0.50 x 0.90 |  |
| `scarecrow.glb` | Scarecrow | 320 | 1.26 x 1.91 x 0.48 |  |
| `bell-and-rope.glb` | Tower bell in its frame, with rope and swinging clapper | 528 | 1.80 x 2.48 x 1.35 | frame, bell, clapper |
| `ballista.glb` | Ballista for the wall walk | 456 | 1.95 x 1.10 x 2.51 | base |
| `rowboat.glb` | Rowboat with oars | 324 | 1.44 x 0.80 x 3.32 |  |
| `quay-crane.glb` | Quay crane, timber jib with windlass | 482 | 2.40 x 4.85 x 4.65 | base, jib |
| `net-rack.glb` | Net drying rack with floats | 306 | 2.70 x 1.92 x 1.08 |  |
| `fish-crates.glb` | Fish crates, one stacked | 192 | 1.34 x 0.46 x 0.77 |  |
| `mooring-post.glb` | Mooring post, timber with rope | 224 | 1.34 x 1.00 x 0.89 |  |
| `mooring-bollard.glb` | Mooring bollard, iron on a stone block | 156 | 0.50 x 0.70 x 0.50 |  |
| `toll-house-sign.glb` | Toll-house sign on a post | 104 | 1.20 x 2.70 x 0.40 | post, sign |
| `secret-bookcase.glb` | Secret mechanism: swinging bookcase over a passage | 636 | 1.30 x 2.20 x 0.85 | frame, bookcase |
| `secret-turning-sconce.glb` | Secret mechanism: turning wall sconce | 112 | 0.14 x 0.32 x 0.27 | plate, sconce |
| `wall-torch-sconce.glb` | Wall torch sconce with torch | 144 | 0.10 x 0.70 x 0.21 | sconce, torch |
| `tapestry-a.glb` | Tapestry A (tree of life) | 312 | 1.93 x 2.04 x 0.06 |  |
| `tapestry-b.glb` | Tapestry B (gold lattice) | 312 | 1.93 x 2.04 x 0.06 |  |
| `tapestry-c.glb` | Tapestry C (white stag) | 312 | 1.93 x 2.04 x 0.06 |  |
| `rug-small.glb` | Rug, small (0.9 x 0.6 m) | 30 | 0.90 x 0.01 x 0.60 |  |
| `rug-medium.glb` | Rug, medium (1.6 x 1.0 m) | 30 | 1.60 x 0.01 x 1.00 |  |
| `rug-large.glb` | Rug, large (2.8 x 1.8 m) | 30 | 2.80 x 0.01 x 1.80 |  |
| `apple-barrel.glb` | Apple barrel | 552 | 0.66 x 0.76 x 0.60 |  |
| `firewood-stack.glb` | Firewood stack | 348 | 1.17 x 0.48 x 0.76 |  |
| `cobweb-corner-a.glb` | Cobweb for an upper corner, large | 3 | 0.60 x 0.60 x 0.51 |  |
| `cobweb-corner-b.glb` | Cobweb for an upper corner, small | 3 | 0.35 x 0.35 x 0.30 |  |
| `hanging-lantern.glb` | Hanging lantern with horn panes | 184 | 0.16 x 0.98 x 0.16 | lantern |
| `crest-shield-a.glb` | Crest shield A (red, gold chevron) | 76 | 0.54 x 0.64 x 0.07 |  |
| `crest-shield-b.glb` | Crest shield B (blue, white tower) | 76 | 0.54 x 0.64 x 0.07 |  |
| `crest-shield-c.glb` | Crest shield C (green, gold key) | 76 | 0.54 x 0.64 x 0.07 |  |
| `crest-shield-d.glb` | Crest shield D (quarterly black and gold) | 76 | 0.54 x 0.64 x 0.07 |  |

## Notes

- `candlestick-brass-bent.glb`: The upper stem leans 10 degrees off true at the knop, where a blow would bend it.
- `dagger-crested.glb`: The pommel face (up when the dagger lies flat) carries crest A, the red chevron house.
- `body-scene-set.glb`: Four nodes (figure, cup, stool, inkpot) so the scene can be dressed apart. The figure lies face down, head toward +X, and is clothed and bloodless on purpose.
- `signet-ring.glb`: Real size (2.8 cm). Scale it up if it has to read on a table at 2 m.
- `key-ring.glb`: One of the four keys is brass and newer than the rest, which is the kind of wrong-place key the design brief asks for.
- `vial-residue.glb`: Opaque greenish glass with a dark band around the base; the atlas has no transparency on purpose.
- `strongbox.glb`: The lid is its own node, hinged along the back top edge.
- `chest-iron-banded.glb`: The lid is its own node, hinged along the back top edge.
- `writing-desk-locked.glb`: The drawer is its own node and slides along -Z in glTF. It has a keyhole and no pull, which is the point.
- `cell-door-barred.glb`: The door leaf is its own node, hinged on the left edge (-X). The opening is 0.9 x 2.0 m.
- `pew-section.glb`: The end panels sit inside the 1.5 m, so sections line up end to end with a double panel at each joint. Sitting side faces -Y (front, +Z in glTF).
- `censer-hanging.glb`: Pivot at the top hook (1.1 m above the base), so it can swing.
- `rood-cross.glb`: Plain cross with gilded terminals and no corpus. Back at -Z; hang it with its base on a beam or corbel.
- `stained-glass-window.glb`: Opaque coloured panes; light it from behind with a coloured point light or an emissive tweak in three.js if it should glow.
- `hearth-crane-cauldron.glb`: The crane swings on its post (node pivot at the post); the cauldron hangs from the hook as a child node.
- `spit-rotisserie.glb`: The spit (rod, crank and roast) is its own node turning about the rod axis.
- `butcher-block.glb`: The cleaver is sunk into the block top. The stains are old and dark, not fresh.
- `herb-bundles.glb`: Hangs from a ceiling beam: the rail brackets are at the top. Base is the lowest bundle tip.
- `bread-oven-door.glb`: A stone oven face with its iron door as a child node, hinged on the left. Put the face flush with a wall.
- `sack-pile.glb`: The two cream sacks are flour; a little has spilled at the front.
- `trestle-table-set.glb`: The table and the table setting are separate nodes, so the table can be used bare.
- `lords-high-chair.glb`: The back carries a small shield with crest A (the red chevron house).
- `chandelier-ring.glb`: Pivot at the top ring, 1.3 m above the bottom of the hub. Add a point light at the ring height in three.js.
- `stone-fireplace.glb`: Firebox opening is 1.4 m wide and 1.3 m tall; back it against a wall. Add the fire as a light and a flame sprite in three.js.
- `four-poster-bed.glb`: Foot of the bed faces +Z. The curtains are gathered at the posts, so a player can see and walk to the pillow.
- `garderobe-door.glb`: The alcove is 1.2 m wide and 1.1 m deep; the door leaf is its own node hinged on the left.
- `watch-bill-board.glb`: Wall-mounted; back at -Z. The sheets are the watch bill, a duty roster and two notes.
- `covered-well.glb`: The bucket is a child node hanging on the rope, so it can be raised or lowered.
- `bell-and-rope.glb`: Three nodes: frame, bell (headstock, bell, stay and rope; swings about the axle, along X) and clapper (child of the bell, swings about its own pivot inside the crown).
- `ballista.glb`: Shoots toward +Z in glTF. The upper part is its own node and turns on the base; the pivot is at the top of the turntable.
- `rowboat.glb`: About 3.3 m long, bow toward +Z in glTF, sitting on its keel. Float it by lowering it about 0.25 m into the water plane.
- `quay-crane.glb`: The jib (mast, boom, ropes, windlass) is its own node and slews about the mast; the hook hangs 1.4 m up, 3.3 m out toward +Z.
- `net-rack.glb`: Alpha-masked and double-sided so the nets read as mesh from both sides.
- `toll-house-sign.glb`: The board shows a coin over a river, no words, so it reads without a language. It hangs from its own node and can sway.
- `secret-bookcase.glb`: The bookcase is its own node hinged at its front-left corner; swing it about Y to open. The frame behind is a dark passage mouth. One brass-tipped book on the middle shelf is the trigger.
- `secret-turning-sconce.glb`: The sconce turns on its node (axis along Z in glTF, out of the wall); a quarter turn is the tell.
- `wall-torch-sconce.glb`: Torch is a separate node so it can be taken; put a point light at the flame.
- `hanging-lantern.glb`: Pivot at the top ring so it can sway. The horn panes are warm and opaque; put a point light inside.
