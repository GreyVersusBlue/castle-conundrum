// tools/castle3d/skin-stages.mjs: which skin stage a plan piece is in, for
// Node (rank 2i, #964). test/layout.mjs's skin check reads it.
//
// `STAGE_RULES` is common.py's table, row for row, first match wins, and
// `SKIN_OF` is skin.py's. Blender stages every exported object through the
// Python pair and writes the answer as extras.stage; the layout check asks the
// same question of the plan from this copy. A drift between the two copies
// is not silent: a piece this file puts in a listed stage that skin.py put in
// another is "named by no skin node", and a node whose piece this file puts in
// an unlisted stage is "names a piece of stage ...". Change both or neither.

export const SKIN_STAGES = ['curtain', 'buildings', 'town', 'land'];

/** common.py's STAGE_RULES: [build stage, kinds or null, id pattern or null]. */
export const STAGE_RULES = [
  ['gates', ['gate-leaf', 'gate-arch', 'fixture'], null],
  ['gates', ['prop'], /^walk-bar$/],
  ['props', ['decor'], /^quay-crane$/],
  ['town', null, /^(quay-|floor-mereford-quay$)/],
  ['props', ['prop'], null],
  ['town', null, /^(mereford-|town-|wykes-|floor-wykes-yard$)/],
  ['terrain', ['ground'], /^(?!floor-)/],
  ['buildings', ['ground'], null],
  ['towers', ['tower', 'stair'], null],
  ['towers', ['floor'], /^floor-(.*-tower-(\d+|roof)|chaplain-chamber|stockhouse-walk)$/],
  ['walls', ['wall', 'floor'], /^(north-curtain|south-curtain|west-curtain|east-curtain|cross-wall|barbican-|garden-|west-gate-over|east-gate-over|porter-gate-over)/],
  ['walls', ['decor'], /^merlon-\d+$/],
  ['buildings', ['wall', 'floor'], null],
  ['buildings', ['decor'], /^hall-(truss|roof)-\d+$/],
  ['props', ['decor'], null],
];

/** skin.py's SKIN_OF: the build stage to the skin's. `props` is absent: the game owns its props (#964). */
export const SKIN_OF = { walls: 'curtain', towers: 'curtain', gates: 'curtain', buildings: 'buildings', town: 'town', terrain: 'land' };

/** common.py's stage_of: the build stage of a plan piece. Throws on a piece no rule takes. */
export function buildStageOf(piece) {
  for (const [stage, kinds, pattern] of STAGE_RULES) {
    if (kinds && !kinds.includes(piece.kind)) continue;
    if (pattern && !pattern.test(piece.id)) continue;
    return stage;
  }
  throw new Error(`STAGE_OF: no stage takes piece ${piece.id} of kind ${piece.kind}`);
}

/** The skin stage of a plan piece, or null for one the skin never admits (a prop). */
export const skinStageOf = (piece) => SKIN_OF[buildStageOf(piece)] ?? null;
