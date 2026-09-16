# WISHLIST

What Castle Conundrum could become after `BACKLOG.md` is empty. **This file
ranks nothing and claims nothing.** `BACKLOG.md` is open work; this is the
arc after it, written 2026-09-16 from Devon's brief of the same day: depth,
life, side quests, a castle big enough to get lost in, a deeper story and a
lot of lore, a castle that is lived in. Kids running, dogs barking, cooks
baking, knights training. Pie in the sky, on purpose.

A note on the name. `PLAN.md` was called `WISHLIST.md` until the move
(#491), and `HISTORY.md` and `data/scene-config.json` still cite it by that
name in about ten places. **A citation of `WISHLIST.md` dated before
2026-09-16 means `PLAN.md`.** This file is the second one to carry the name.

When a row here is taken up, it leaves this file, gets a spec in `SPECS.md`
and a rank in `BACKLOG.md`, the same as every row before it. Until then it is
a wish. The ten questions at the bottom were Devon's to answer and he
answered them the same day (#547 to #550); the themes below are written to
his answers.

## What the castle is today, so the wishes are measured against it

- **64 m by 36 m inside the curtain**, eight drums, two wards, a wall walk,
  eleven ground rooms and a first storey. Twelve seconds end to end at the
  5.2 m/s the player runs. A circuit of the walls is a minute.
- **Twelve people, four bells, one crime.** Every NPC has one station per
  watch and walks between them on the same grid the player stands on
  (`src/stations.js`). Nobody does anything at a station but stand there.
- **Everything is data, and every data file has a validator** that runs in
  Node before the page loads: `mystery.json` for clues, schedule and presses,
  `npcs.json` for bodies and lines, `quest.json` for the frame, `sounds.json`
  for the two sounds. This is the pattern every row below extends.
- **Three bodies and 51 MB of assets, against a 200 MB ceiling** (#499). The
  kit has no woman, no child, no animal. Every asset that lands goes through
  `tools/encode-assets.mjs` first (#506).
- **Two sounds, both synthesised.** No audio file exists in the repo yet;
  #519's synthesis-only half was reversed on 2026-09-16 (#548) and recorded
  CC0 audio is admitted, through the encode pipeline like any asset.
- **Nothing here has been seen on a GPU since Phase 5** (#53). Every row
  below that is about how something looks or feels is gated on `npm run play`
  on a real machine, and most of them are.

## The themes

Seven, and the order is the order I would take them in, because each one
makes the next cheaper. Life before size, because an empty big castle is
worse than a full small one. Lore before side quests, because a side quest
is lore with a verb. Tooling early, because the content rows are large and
hand-placing a hundred props in JSON is the cost that will stop them.

### 1. Life: the castle has a population, not a cast

The twelve are the mystery's. The castle needs the other fifty: the people
who were there before the mason died and will be there after the inspector
leaves. None of them has a lie or a clue. They are what the castle looks like
when nobody is being questioned.

- **`data/populace.json`, a fourth data file with a validator.** A populace
  entry is a body, a tint, a name the HUD shows if the player looks, and a
  **routine**: a list of activities per watch, each `{room, tile, activity,
  facing?}`. The validator holds every tile walkable, every room real, every
  two bodies at one bell at least `STATION_CLEARANCE` apart, and every
  activity to a name `npc.js` can play. This is `mystery.json`'s schedule
  with the clue graph taken out and an activity put in, and `stations.js`
  already does the walking.
- **Activities, not stations.** `npc.js` plays `idle` and `walk`. The list
  it needs: `sweep`, `stir`, `knead`, `carry` (a held prop, which it already
  hangs off the right hand), `kneel`, `sit`, `eat`, `hammer`, `spar`, `drill`,
  `sleep`. Whether the bodies carry those clips or a shared rig retargets
  them is the first question the row asks, and the answer decides which body
  source is usable (theme 6).
- **The activities of a castle day**, keyed to the four bells so they read
  as time passing: at Prime the bakehouse fires and the ovens draw, the
  well is worked, the garrison drills in the outer ward at a quintain; at
  Terce the works are loud, the mason's lodge cuts stone and the smith's
  forge rings; at Sext the hall eats, the dogs are under the table, the
  kitchen is a kitchen; at Vespers the chapel fills, torches are lit, the
  outer ward empties and the sentry walks. This is a fixed schedule and a
  small number of activities, and it is enough: a player who sees the same
  boy fetch water at Prime three days running believes in the boy.
- **Children and dogs, specifically.** Devon named them first and the kit has
  neither. Children are the cheapest life there is because they run, and
  running is the one thing the walk grid already does well: a child's routine
  is a loop of tiles at 2.5 m/s that never stops. A dog is a body that
  follows a person's station and barks when the player is close, and one dog
  that follows the player from the barbican is a companion the whole game
  gets for one body and one behaviour. Chickens in the outer ward that
  scatter at the player's radius are the third, and are the cheapest of all.
- **The knights training** is the garrison at a quintain and a pell, two
  props and two clips, in the outer ward by the mason's lodge, at Prime and
  Terce. Six bodies with spears in a line reads as a garrison from the wall
  walk, which is where the player will see it from.
- **Ambient talk.** Two populace bodies within 3 m of each other at the same
  bell get a line pair from a pool, played as a floating caption when the
  player is in earshot. Not a conversation, not interactable, and it is where
  most of the lore (theme 3) gets said, because a rumour overheard is worth
  ten paragraphs in a book. `npcs.json` already keys lines by state; this is
  a `chatter` pool keyed by watch and ward.
- **The cost.** Fifty skinned bodies is a draw-call and a skinning bill this
  page has never paid. Instanced skinned meshes, an animation LOD that
  freezes bodies more than 30 m away, and a per-ward population cap are the
  three levers. **Laptop first** (#550, question 8): the laptop's number is
  the one the population is built to, and the phone (#530) gets a cap, not a
  different castle.

### 2. Sound: the castle is audible before it is visible

Two sounds exist and both are synthesised (#519). A lived-in castle is
mostly heard: the bell was the obvious one, and the next twenty are ambient.

- **Ambient beds per zone**, spatialised at a point per room: the kitchen's
  clatter and fire, the forge, the chapel's quiet, wind on the wall walk,
  the outer ward's yard noise, rain on the pavers. Cross-faded by the room
  the HUD already knows the player is in (#515).
- **Event sounds**: a door, a bark, a hammer strike synced to the smith's
  clip, a chicken, a distant shout from the drill, a spoon on a pot, the
  bakehouse oven door, a crow on the battlement. Footsteps for every NPC, not
  only the player, at a gain that falls with distance.
- **The bells become a soundscape.** Four bells a day and each has a
  character: Prime is one bell, Vespers is the whole peal.
- **The rule that bit, and does not any more.** #519 was synthesis only.
  Devon reversed it on 2026-09-16 (#548): recorded CC0 samples come in,
  named by `data/sounds.json`, swept by `test/assets.mjs` for reachability
  the way every glTF is (#390), and given a codec in
  `tools/encode-assets.mjs` (Opus in an Ogg container is the one to reach
  for; #506 says nothing lands uncompressed). Synthesis stays for what it
  does well, which is the footstep and the bell, and a sound stays
  synthesised until a recording beats it.

### 3. Lore: the castle has a history, and the player can read it

The mystery is one night. The castle is forty years of building and a war
before that, and none of it is anywhere in the game.

**The world is invented, and it leans into the fantasy** (#549, Devon's
answer to question 1). The plan is Conwy's and the feel is the 1280s, but
the kingdom, the King, the war and the saints are made up, and the kit is
called a retro *fantasy* kit for a reason: v1 had a Wizard, and the castle
can have a hedge-witch in the outer ward, a relic in the chapel that the
chaplain half believes in, a well the garrison will not drink from after
dark, and a story about what is under the Prison Tower that Madoc has
heard through the floor. Not high fantasy. Nobody casts anything on screen.
The fantasy is what the people believe and what the player is never quite
told is untrue, and an invented world is what lets the second mystery and
the tenth be about anything at all.

- **A canon, in one file.** `data/lore.json`: who built the castle and why,
  when each tower went up and who died on it, what the war before it was,
  what the town outside owes and to whom, who was Constable before this one,
  what the garrison is owed in wages and how far behind the King is, what
  the people of the outer ward think of the household in the inner, and the
  handful of things nobody can prove. Every fact carries an id, and every
  place it is said (a document, a line, a chatter pair, an epilogue pane)
  cites the id, so the validator can say which facts are never told and
  which two tellings disagree.
- **Documents everywhere.** The works ledger, the gaol roll (already on
  rank 4's path), the chaplain's obituary roll, the porter's gate book, the
  cook's accounts, the steward's letters, the mason's own marks cut into the
  stone, a builder's graffito at the top of a stair, gravestones in the
  chapel floor, the King's writ on the muniment room wall. Each is a prop
  with a `read` verb that opens a pane, in the period's own voice, and each
  one the player reads goes into the journal under a new tab, **Things
  read**. Most convict nobody. That is the point.
- **A castle that says where it is in its own history.** A castle built
  after a conquest, by foreign masons, with the conquered as labourers, for a
  King who is not there and whose money is late. That much is Conwy's shape
  and it stays; the names on it are the game's own. A player who finishes
  the game should know all of it without having been told it once as
  exposition.
- **The chaplain's sermon at Vespers and a song in the hall at Sext** are
  the two set pieces where lore is performed, not read, and each is a
  pool of texts so a second day does not repeat the first.
- **Facts that change.** The second day (#533) already carries seven endings'
  worth of consequences. Lore is the same shape over a longer clock: a fact
  can carry a `since` field, and a rumour told on day two can be about what
  the player did on day one.

### 4. Side quests: lore with a verb

The quest graph (`src/quest-graph.js`, #393) is already a validated state
machine that knows no NPC by id. Every side quest is a small one of those.

- **A quest is data.** `data/quests/*.json`, one file each, each with the
  frame `quest.json` already has: stages, transitions on events the game
  already emits (`talked:`, `found:`, `presented:`, `bell:`, `entered:`),
  and effects the manager already applies. A validator holds each one
  reachable and terminal, and a second holds the set: no two quests want
  the same NPC in two states at one bell.
- **The first dozen, by ward.** The cook's missing knife (it is in the
  laundry; Nest took it to cut the cloak's tallow hem, which is a clue the
  main mystery already has). The apprentice's unfinished carving and the
  tool he needs from the smith who is in gaol. Lady Alys's hawk, loose on the
  wall walk, that the sentry will not leave his post to catch. The sentry's
  dice debt to the porter, which is why the walk door was not barred. A
  child's dog, in the east garden. The porter's boy who wants to learn his
  letters from the clerk, who is the player. A letter for the town that
  needs a gate pass, and the steward signs gate passes. The chaplain's
  candle account that does not add up. Every one of these is under ten
  lines of dialogue and one prop, and every one of them makes the main
  mystery's facts land in a second place.
- **Independent of the mystery, connected to each other** (#550, Devon's
  answer to question 6). A side quest never gates a clue the murder needs
  and never takes one away, so the mystery stays solvable by a player who
  does none of them. What a side quest may do is open another side quest,
  and deepen what the player understands: the sentry's dice debt is why the
  walk door was not barred, and a player who has done that quest reads the
  porter's lie differently without the game saying so. The set validator
  holds the two rules apart: no quest effect touches a `mystery.json` clue,
  and quest-to-quest links are a graph the validator can walk.
- **Many at once** (#550, question 7). The castle is one open place with a
  dozen small cases running at the same time, not one case a day. A quest
  starts when the player walks into it and waits for as long as the player
  leaves it, so the journal needs a tab that lists what is open and what
  the last thing said was. The second day (rank 4) is not contradicted by
  this: it is a day, and the quests run through it.
- **Reputation, by ward.** Two counters the save carries. The outer ward
  trusts a clerk who does its errands; the inner ward trusts a clerk who
  keeps its confidences. Some chatter, one or two lines, and one closing
  pane read off them. Not a system, a tint.

### 5. Size: a castle to get lost in

Devon wants it huge. The plan's own risk section says why a bigger plan is
not the first move: an empty room is worse than no room. So the order is
volume before area, and area before a second castle.

- **Fill the volume it has.** Eight drums with three floors each is
  twenty-four rooms and the game uses about six. The tower roofs (#523) are
  four more. An undercroft under the Great Hall, cellars under the kitchen,
  a well chamber, a latrine turret off the wall walk, the guardroom over the
  porter's gate. All of it is `castle-plan.js` and a floor slab each, and all
  of it is somewhere a document or a populace routine can go.
- **The town.** The ground outside the west barbican exists now (#541 to
  #546). Conwy's town is a walled town, and the yard where the lead went is
  rank 4's third thread. A street of six houses, a church, a quay and the
  merchant's yard is a second population and a second set of documents,
  and it is where the second mystery lives. **This is the row that makes
  "get lost in it" true**, and it is a Phase-3-sized build.
- **The rock and the river.** The castle stands on a spur over an estuary
  and the game's world ends at the curtain. A view down from the wall walk
  to water, a postern down the rock to a water gate, and a boat. One texture
  set and a lot of height.
- **A second castle.** Stirling was Devon's second on 2026-09-14 and is
  where the plan stopped. A second castle is a second `castle-plan.js` and
  a second cast, and it is the whole arc again. It goes last and it is the
  reward for the six rows above it working.
- **Getting lost needs a map the player has to earn.** No minimap. A
  journal page that fills in as rooms are entered, drawn as a plan, in the
  hand of a 1280s clerk.

### 6. Bodies: the thing every row above waits on

The plan bet the project on tints (#419) and rank 1 is the first fourth
body. Life, children, dogs and a garrison are all bodies, and the kit has
none of them.

- **Low-poly, one shared rig, CC0** (#550, question 5), for now. Devon's
  reason is the useful one: a low-poly body is something a session can make
  or edit as a drop-in when the packs have no child or no dog, and a
  high-fidelity one is not. Whatever the fourth body is, the fiftieth comes
  from the same place and carries the same clips.
- **Variation without files.** Tint is one axis. Height scale, a hood or hat
  as a hidden node, a held prop, and a beard material toggle give six axes,
  and six axes over four bodies is a crowd. `npc.js` already hides named
  nodes and materials.
- **A budget.** Bodies through `encode-assets.mjs` come in at about 0.5 to
  1.5 MB each meshopted. Ten bodies and thirty clips is under 20 MB against
  149 MB of headroom, and the video memory number (#510) is the one to
  watch, not the disk one.

### 7. Feel: the things a GPU decides

Everything here is gated on `npm run play` on a real machine (#53), and
most of it is a day's work each once someone can see it.

- **Weather and sky.** Rain in the outer ward, wind on the walk, smoke from
  the kitchen chimney and the bakehouse, a sun that moves between bells so
  the shadows say what time it is, and a Lauds sky that is actually dark.
- **Fire.** Torches at Vespers with a flicker, braziers that light the hall,
  the forge's glow. Point lights with a shadow budget and a distance cull.
- **Hands and a body.** The player has no shadow and no hands. A shadow on
  the pavers and a hand that reaches for the door are the two cheapest
  presence cues there are.
- **Examine.** Pick a piece of evidence up and turn it, Paradise Killer's
  verb. The tally stick has eleven notches and the player should count them.
- **Doors that open.** Every door is a built leaf and none of them swings.
  A door that opens as the player reaches it, and closes behind them, is the
  difference between a castle and a diorama.
- **Wear.** Decals: soot over the ovens, a worn path across the outer ward
  to the well, tallow on the chapel stair, moss on the north face of the
  curtain. Puddles after rain.
- **Sitting, and a moment.** Let the player sit on the hall bench at Sext
  and watch the room eat. The game has no idle verb and this is the one.

## The tooling that makes the content rows possible

None of the seven themes above is a code problem. They are content
problems at a scale the current tooling cannot carry: a populace of fifty,
a hundred documents, a dozen quests, a town. Three tools first.

- **A placement editor in the browser.** Walk to a spot, press a key, pick a
  prop, and it writes the entry into a JSON the builder reads. Exists as
  `?edit=1` on the dev server only, never in `dist/`. The alternative is a
  session hand-typing fractional tile coordinates, which is how every prop
  in the castle got there, and it is why there are so few.
- **A dialogue format that is not JSON arrays of strings.** A text format
  with speaker, state, conditions and effects on one line each, compiled to
  the JSON the validators read at build time. Writing lore in JSON is
  writing with a hand tied behind you.
- **A validator for everything, and the population cap as a test.** Every
  data file in the list above has a validator and a Node suite that runs it
  (#13). The one new kind: a budget suite that counts skinned bodies, point
  lights and draw calls per ward off the plan and fails on the number the
  phone cannot carry.

## Devon's answers, 2026-09-16

Ten questions were put on the day this file was written and Devon answered
every one the same day. They are locked as #547 to #550 in `HISTORY.md`.
The questions are kept here so the answers read against them.

1. **Real history or a castle like it?** *Invented history around a
   fictional cast, and lean into the fantasy* (#549). Conwy's plan and the
   1280s' feel; the kingdom, the King, the war and the saints are the game's
   own. See theme 3.
2. **Bigger how, first?** *The default: volume, then the town, Stirling
   last.* See theme 5.
3. **Does time stay on the bells?** *The default: the bells stay.* In plain
   words: the game's clock is the four bells the player rings, and it does
   not move between them. Life in the castle happens as loops inside a watch
   (a boy fetches water again and again until the next bell), not as a
   minute hand. The sun moves once per bell. Every time gate the mystery has
   is written against a bell and none of them has to change.
4. **Does the no-audio-file rule hold?** *No. Grab audio now* (#548). #519's
   synthesis-only half is reversed. See theme 2 for how a recording lands.
5. **What do the bodies look like?** *Low-poly for now* (#550), so that a
   session can make a drop-in body when a pack has none. See theme 6.
6. **Do side quests touch the mystery?** *No. Independent of the mystery,
   and they may connect to each other or deepen what the player
   understands* (#550). See theme 4.
7. **One day, or a season?** *Many at once* (#550). One open castle, a
   dozen small cases running together. See theme 4.
8. **Who is this for?** *Laptop first* (#550). The phone gets a cap.
9. **Voice?** *Text for now. Voice acting much later.*
10. **What is the first row?** *The current backlog stays as it is, and this
    list falls in line behind it* (#547). When `BACKLOG.md` empties, the
    first row out of here is the populace file and the first ten bodies of
    life (theme 1), because it is the row that makes every other row
    visible.
