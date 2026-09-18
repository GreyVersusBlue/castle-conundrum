// lore.js — the canon (data/lore.json) as data, validated without a page. No
// DOM, no three, no timers, in the style of src/mystery.js: `validateLore`
// reads the canon against data/documents.json, data/npcs.json's `cast`,
// `chatter` and `performances`, data/mystery.json and data/scene-config.json's
// `builtProps`, and returns every problem it finds, each naming the id it is
// about.
// `untoldFacts` is a separate, non-failing report: a fact with no source is
// allowed (WISHLIST.md, theme 3), and a check that only prints is not a check
// (#13), so "untold" is never folded into the list `validateLore` returns.
//
// WHY A FACT NEEDS A SOURCE TO BE "TOLD". Forty years of history is easy to
// invent and easy to leave unreachable: a fact nobody ever says, in no
// document, no line, no chatter pair, no sermon, no song and no epilogue, is
// exposition sitting in a JSON file and nothing else. `sources` is where a
// fact claims to be told, and this file is the net that says whether the claim
// is true — a document that does not actually cite the fact it is claimed to
// tell is the same failure as a clue whose evidence does not list it (src/mystery.js's
// `evidence ${id} does not list it as its clue`).

import { dayTwoApplies, dayTwoOutcomes, dayTwoAbsent } from './mystery.js';

/**
 * A FACT THAT CHANGES WITH WHAT THE PLAYER DID (#646, #596). `text` is what
 * the canon says; `since` is a list of rows that replace it once the verdict
 * is in, each `{when?, unless?, knew?, tells, text, why}` on the same
 * `when`/`unless`/`knew` grammar `day2.castle` and `day2.knew` already share
 * and imported from src/mystery.js rather than copied, because a second copy
 * of a grammar is a second copy that drifts.
 *
 * `since` MAY ONLY EVER REPLACE, NEVER SUPPLY THE ONLY TEXT, which is #573s
 * rule for `day2.knew` pointed at the canon: a fact with no row that applies
 * still reads as `text`, so every play has the fact and only some plays have
 * the change. The first applicable row wins, in file order.
 *
 * `tells` IS WHAT KEEPS THIS OUT OF A DRAWER (#649). The canon is read by this file
 * and by nothing on the page, so a `since` nobody says is a paragraph in a
 * JSON file: a row names the `rumours` piece that carries it, the piece cites
 * the fact the way every other source already does (#551, #592), and
 * `validateLore` walks every ending and every journal to refuse a piece that
 * is heard where its row does not apply.
 */
const KINDS = new Set(['history', 'person', 'place', 'belief', 'rumour']);
const CONTRADICTABLE = new Set(['belief', 'rumour']);
const SOURCE_KINDS = new Set(['document', 'npc', 'chatter', 'epilogue', 'performance']);
const WARDS = new Set(['outer', 'inner']);
const POOLS = new Set(['sermons', 'songs', 'rumours']);

const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

/** Every epilogue key the game can end a day on: `accusation.verdicts` and `day2.endings` share one vocabulary of keys. */
function epilogueKeys(mystery) {
  const keys = new Set();
  for (const k of Object.keys(mystery?.accusation?.verdicts ?? {})) keys.add(k);
  for (const k of Object.keys(mystery?.day2?.endings ?? {})) keys.add(k);
  return keys;
}

/** Every `{npc, state}` a line can be attributed to: every dialogue key each cast member actually has. */
function npcLineIndex(npcs) {
  const map = new Map();
  for (const n of npcs ?? []) map.set(n.id, new Set(Object.keys(n.dialogue ?? {})));
  return map;
}

/** Flatten data/npcs.json's `chatter` (ward -> watch -> pairs) into one map by pair id, plus every problem in its own shape. */
function indexChatter(chatter, { npcs, mystery, problems }) {
  const say = (m) => problems.push(m);
  const cast = new Map((npcs ?? []).map((n) => [n.id, n]));
  const watches = new Set(Array.isArray(mystery?.watches) ? mystery.watches : []);
  const byId = new Map();
  for (const [ward, byWatch] of Object.entries(chatter ?? {})) {
    if (!WARDS.has(ward)) say(`chatter: ward ${JSON.stringify(ward)} is not outer or inner`);
    for (const [watch, pairs] of Object.entries(byWatch ?? {})) {
      if (!watches.has(watch)) say(`chatter.${ward}: watch ${JSON.stringify(watch)} is not one of the four bells`);
      for (const p of asList(pairs)) {
        const where = `chatter pair ${p?.id ?? '(no id)'}`;
        if (!nonEmpty(p?.id)) { say(`${where}: no id`); continue; }
        if (byId.has(p.id)) say(`${where}: id used twice (${ward}/${watch} and ${byId.get(p.id).ward}/${byId.get(p.id).watch})`);
        byId.set(p.id, { ...p, ward, watch });
        const speakers = asList(p.npcs);
        if (speakers.length !== 2) { say(`${where}: names ${speakers.length} speakers, not two`); continue; }
        for (const npcId of speakers) {
          const n = cast.get(npcId);
          if (!n) { say(`${where}: ${npcId} is not in the cast`); continue; }
          if ((n.arrives ?? 1) > 1) say(`${where}: ${npcId} arrives on day ${n.arrives} and is not one of the existing twelve`);
          else if (n.ward !== ward) say(`${where}: ${npcId}'s own ward is ${JSON.stringify(n.ward)}, not ${ward}`);
        }
        if (speakers[0] && speakers[1] && speakers[0] === speakers[1]) say(`${where}: both lines given to ${speakers[0]}`);
        const lines = asList(p.lines);
        if (lines.length < 2 || !lines.every(nonEmpty)) say(`${where}: fewer than two non-empty lines`);
      }
    }
  }
  return byId;
}

/**
 * Flatten data/npcs.json's `performances` (pool -> entries) into one map by id,
 * plus every problem in its own shape.
 *
 * WHAT A PERFORMANCE HAS THAT A CHATTER PAIR DOES NOT: a room and a bell. A
 * chatter pair is two bodies talking wherever the pair's ward puts them, so
 * #554 settled for checking each speaker's own static `ward` field. A
 * performance is one body saying one thing in one named room at one named
 * bell, and data/mystery.json's `schedule` already says where everybody is at
 * every bell, so this checks the station itself: the sermon is said where the
 * chaplain actually stands, not where a data file wishes he stood. A piece at
 * `day2.watch` is checked against `day2.schedule` instead, and against the
 * day-two absences, because a sermon said by a man the player may have hanged
 * is a sermon that does not happen in six endings out of seven.
 *
 * WHAT THE THIRD POOL ADDED (#648). A `rumours` piece carries
 * `when`/`unless`/`knew`, so what the castle is saying on the morning after
 * depends on the verdict and on the journal. That turns both of the rails
 * above from a yes/no into a question asked once per ending:
 *
 * - **One room at one bell holds one piece** becomes *the first piece there
 *   that applies*, and the rail becomes *every piece there is reachable*. A
 *   narrow piece written above a wide one is the point of an order: the
 *   sharpest thing the castle can say about a player who hanged the smith
 *   with the gaol roll in his own journal is not sayable as a condition
 *   disjoint from "somebody hanged". What is refused is a piece no ending and
 *   no journal ever reaches, because an earlier piece in the same room and
 *   bell answers everywhere it does. The enumeration is exact rather than
 *   clever: seven endings times the subsets of the few clue ids the pieces
 *   themselves name. An unconditioned pool collapses back to the old rail by
 *   construction, because a second piece with no `when` and no `knew` is
 *   shadowed everywhere by the first.
 * - **A piece by a man who may be gone** becomes *a piece by a man who is gone
 *   in an ending this piece applies to*. `when: ["nobody"]` on a piece the
 *   prisoner says is a piece said only in the one ending he is alive for,
 *   which is a thing the old rail could not express and therefore refused.
 *
 * So there is still never a choice to make at run time (#592): the manager
 * takes the first applicable piece, in file order, and this file has already
 * refused every piece that order would have silenced.
 */
function indexPerformances(performances, { npcs, mystery, problems }) {
  const say = (m) => problems.push(m);
  const cast = new Map((npcs ?? []).map((n) => [n.id, n]));
  const watches = new Set(Array.isArray(mystery?.watches) ? mystery.watches : []);
  const d2 = mystery?.day2 ?? {};
  const rooms = new Set((mystery?.rooms ?? []).map((r) => r.id));
  const outcomes = dayTwoOutcomes(mystery);
  const byId = new Map();
  const byPlace = new Map(); // "room/watch" -> the pieces that want it, in file order
  for (const [pool, entries] of Object.entries(performances ?? {})) {
    if (!POOLS.has(pool)) say(`performances: pool ${JSON.stringify(pool)} is not sermons, songs or rumours`);
    for (const e of asList(entries)) {
      const where = `performance ${e?.id ?? '(no id)'}`;
      if (!nonEmpty(e?.id)) { say(`${where}: no id`); continue; }
      if (byId.has(e.id)) { say(`${where}: id used twice`); continue; }
      byId.set(e.id, { ...e, pool });
      const lines = asList(e.lines);
      if (lines.length < 2 || !lines.every(nonEmpty)) say(`${where}: fewer than two non-empty lines`);
      if (!rooms.has(e.room)) say(`${where}: in no room (${JSON.stringify(e.room)})`);
      const onDayTwo = e.watch === d2.watch;
      if (!watches.has(e.watch) && !onDayTwo) say(`${where}: watch ${JSON.stringify(e.watch)} is not one of the four bells nor ${JSON.stringify(d2.watch)}`);
      // A condition on a piece said at one of the four bells is a condition on
      // a verdict nobody has reached yet, which can only ever read as "never".
      // Refused here rather than left to be silently never played.
      if (!onDayTwo && (e.when != null || e.unless != null || e.knew != null)) {
        say(`${where}: carries when/unless/knew at ${e.watch}, and a verdict is a thing only ${d2.watch} has`);
      }
      // Two pieces wanting one room at one bell is a choice nothing should have
      // to make: the manager plays the piece for where the player is standing.
      // On the morning after that becomes one per ending and journal, which is
      // the enumeration after this loop: it needs every piece in hand first.
      const place = `${e.room}/${e.watch}`;
      if (!byPlace.has(place)) byPlace.set(place, []);
      byPlace.get(place).push({ ...e, pool });
      const n = cast.get(e.npc);
      if (!n) { say(`${where}: ${JSON.stringify(e.npc)} is not in the cast`); continue; }
      if (onDayTwo) {
        const st = d2.schedule?.[e.npc];
        if (!st) say(`${where}: ${e.npc} has no station at ${d2.watch} and cannot perform on the morning after`);
        else if (st.room !== e.room) say(`${where}: ${e.npc} stands in ${st.room} at ${d2.watch}, not in ${e.room}`);
        // Not "may ever be absent" but "absent in an ending this piece claims".
        const dead = outcomes.filter((o) => dayTwoApplies({ when: e.when, unless: e.unless }, o) && dayTwoAbsent(mystery, o).has(e.npc));
        if (dead.length) say(`${where}: ${e.npc} is gone from the castle at ${d2.watch} in at least one ending this piece applies to (${dead.map((o) => o.key).join(", ")}), so this would be said in some plays and not others`);
        if (!outcomes.some((o) => dayTwoApplies({ when: e.when, unless: e.unless }, o))) say(`${where}: applies to no ending, so it is never said`);
      } else if (watches.has(e.watch)) {
        if ((n.arrives ?? 1) > 1) say(`${where}: ${e.npc} arrives on day ${n.arrives} and is not one of the existing twelve`);
        const st = mystery?.schedule?.[e.npc]?.[e.watch];
        if (!st) say(`${where}: ${e.npc} is not in the castle at ${e.watch}`);
        else if (st.room !== e.room) say(`${where}: ${e.npc} stands in ${st.room} at ${e.watch}, not in ${e.room}`);
        else if (st.asleep) say(`${where}: ${e.npc} is asleep at ${e.watch}`);
      }
    }
  }

  // EVERY PIECE IN ONE ROOM AT ONE BELL IS REACHABLE. The manager takes the
  // first that applies, so a piece an earlier one answers for everywhere is a
  // piece nobody will ever hear, and that is the failure worth a name.
  for (const [place, here] of byPlace) {
    for (let j = 1; j < here.length; j++) {
      if (reachable(here[j], here.slice(0, j), outcomes)) continue;
      const [room, watch] = place.split("/");
      say(`performance ${here[j].id}: ${here.slice(0, j).map((e) => e.id).join(" and ")} answer${j > 1 ? "" : "s"} for ${room} at ${watch} in every ending and journal this piece claims, so ${here[j].id} is never heard, and one room at one bell holds one piece`);
    }
  }
  return byId;
}

/**
 * Is there one play that reaches this piece past the ones written above it?
 * Exact, by enumeration: every ending, times every subset of the clue ids the
 * pieces in this place name between them. That universe is their own `knew`
 * lists and nothing wider, which keeps it two or four subsets rather than
 * 2^36, and is sound because a clue no piece here names cannot change any of
 * their answers.
 */
function reachable(piece, earlier, outcomes) {
  // No verdict table at all is not a licence: a second piece in one place is
  // still unreachable, the way it was before any of this was conditional.
  if (!outcomes.length) return false;
  const universe = [...new Set([piece, ...earlier].flatMap((e) => asList(e.knew)))];
  for (const o of outcomes) {
    for (let mask = 0; mask < (1 << universe.length); mask++) {
      const held = universe.filter((_, k) => mask & (1 << k));
      if (!dayTwoApplies(piece, o, held)) continue;
      if (earlier.some((e) => dayTwoApplies(e, o, held))) continue;
      return true;
    }
  }
  return false;
}

/**
 * Every problem in data/lore.json, each naming the id it is about. Empty
 * means the canon is coherent: every source it claims actually tells it,
 * every id a fact or a document points at exists, no two facts disagree
 * unless one of them is a `belief` or a `rumour`, and every document sits
 * somewhere the player can actually reach.
 *
 * @param lore       parsed data/lore.json
 * @param documents  parsed data/documents.json's `documents`
 * @param npcs       data/npcs.json's `cast`
 * @param chatter    data/npcs.json's `chatter`
 * @param performances data/npcs.json's `performances` (#592): the sermons and
 *                   the songs, each one person in one room at one bell
 * @param mystery    parsed data/mystery.json, for rooms, watches and epilogue keys
 * @param builtProps data/scene-config.json's `builtProps`, or undefined to skip
 *                   the slab check (#557): a document and the `builtProps`
 *                   entry carrying `read: <its id>` have to describe one slab,
 *                   tile, base, size and material alike, because the reading
 *                   pane opens on the entry and the room check above runs on
 *                   the document, and two copies of one placement drift.
 */
export function validateLore(lore, { documents, npcs, chatter, performances, mystery, builtProps } = {}) {
  const problems = [];
  const say = (m) => problems.push(m);
  if (!lore || typeof lore !== 'object') return ['lore is not an object'];
  const facts = Array.isArray(lore.facts) ? lore.facts : null;
  if (!facts) return ['lore.facts is not a list'];

  const factsById = new Map();
  for (const f of facts) {
    if (!f || typeof f.id !== 'string') { say('a fact with no id'); continue; }
    if (factsById.has(f.id)) say(`${f.id}: id used twice`);
    factsById.set(f.id, f);
  }

  const rooms = new Map((mystery?.rooms ?? []).map((r) => [r.id, r]));
  // A room the player can never stand in at all: barred, and named by no lock
  // that ever opens it. The muniment room is barred in effect (the word-lock),
  // but not by this flag, and is not in this set; the cell is.
  const neverOpens = new Set(
    [...rooms.values()].filter((r) => r.barred && !(mystery?.locks ?? []).some((l) => l.room === r.id)).map((r) => r.id)
  );

  const docs = Array.isArray(documents) ? documents : [];
  const docsById = new Map();
  for (const d of docs) {
    if (!d || typeof d.id !== 'string') { say('a document with no id'); continue; }
    if (docsById.has(d.id)) say(`${d.id}: document id used twice`);
    docsById.set(d.id, d);
    if (!d.room || !rooms.has(d.room)) say(`${d.id}: in no room (${JSON.stringify(d.room)})`);
    else if (neverOpens.has(d.room)) say(`${d.id}: placed in ${d.room}, which is barred and behind no lock that ever opens — nobody can reach it`);
    for (const id of asList(d.cites)) {
      if (!factsById.has(id)) say(`${d.id}: cites ${id}, which is not a fact in data/lore.json`);
    }
  }

  // The slab: one placement, written twice (#557). documents.json carries it so
  // the room check above can run without the scene config; scene-config.json
  // carries it because that is where the builder reads slabs from. Neither
  // copy is allowed to move without the other.
  if (Array.isArray(builtProps)) {
    const byRead = new Map();
    for (const b of builtProps) {
      if (!b?.read) continue;
      if (byRead.has(b.read)) say(`${b.read}: two builtProps entries carry read: ${JSON.stringify(b.read)} (${byRead.get(b.read).id} and ${b.id})`);
      byRead.set(b.read, b);
    }
    const sameList = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
    for (const d of docs) {
      if (!d || !d.id) continue;
      const b = byRead.get(d.id);
      if (!b) { say(`${d.id}: no builtProps entry in data/scene-config.json carries read: ${JSON.stringify(d.id)}, so nothing in the castle can be read as it`); continue; }
      const drift = [];
      if (!sameList(d.tile, b.tile)) drift.push(`tile ${JSON.stringify(d.tile)} vs ${JSON.stringify(b.tile)}`);
      if ((d.base || 0) !== (b.base || 0)) drift.push(`base ${d.base || 0} vs ${b.base || 0}`);
      if (!sameList(d.size, b.size)) drift.push(`size ${JSON.stringify(d.size)} vs ${JSON.stringify(b.size)}`);
      if (d.material !== b.material) drift.push(`material ${JSON.stringify(d.material)} vs ${JSON.stringify(b.material)}`);
      if (drift.length) say(`${d.id}: data/documents.json and the builtProps entry ${b.id} describe different slabs (${drift.join('; ')})`);
    }
    for (const [read, b] of byRead) {
      if (!docsById.has(read)) say(`${b.id}: builtProps entry carries read: ${JSON.stringify(read)}, which is not a document in data/documents.json`);
    }
  }

  const npcLines = npcLineIndex(npcs);
  const chatterById = indexChatter(chatter, { npcs, mystery, problems });
  const performanceById = indexPerformances(performances, { npcs, mystery, problems });
  const epilogues = epilogueKeys(mystery);

  const sourceOk = (fact, src) => {
    if (!src || typeof src !== 'object' || !SOURCE_KINDS.has(src.kind)) {
      say(`${fact.id}: unknown source ${JSON.stringify(src)}`);
      return;
    }
    if (src.kind === 'document') {
      const d = docsById.get(src.id);
      if (!d) say(`${fact.id}: unknown source, no document ${JSON.stringify(src.id)}`);
      else if (!asList(d.cites).includes(fact.id)) say(`${fact.id}: names document ${src.id} as a source, but that document's own \`cites\` does not name ${fact.id} back`);
    } else if (src.kind === 'npc') {
      const states = npcLines.get(src.npc);
      if (!states) say(`${fact.id}: unknown source, no npc ${JSON.stringify(src.npc)}`);
      else if (!states.has(src.state)) say(`${fact.id}: unknown source, ${src.npc} has no dialogue.${src.state}`);
    } else if (src.kind === 'chatter') {
      const p = chatterById.get(src.id);
      if (!p) say(`${fact.id}: unknown source, no chatter pair ${JSON.stringify(src.id)}`);
      else if (!asList(p.cites).includes(fact.id)) say(`${fact.id}: names chatter pair ${src.id} as a source, but that pair's own \`cites\` does not name ${fact.id} back`);
    } else if (src.kind === 'performance') {
      const e = performanceById.get(src.id);
      if (!e) say(`${fact.id}: unknown source, no performance ${JSON.stringify(src.id)}`);
      else if (!asList(e.cites).includes(fact.id)) say(`${fact.id}: names performance ${src.id} as a source, but that piece's own \`cites\` does not name ${fact.id} back`);
    } else if (src.kind === 'epilogue') {
      if (!epilogues.has(src.id)) say(`${fact.id}: unknown source, ${JSON.stringify(src.id)} is not an epilogue or day-two ending`);
    }
  };

  const outcomes = dayTwoOutcomes(mystery);
  const clueIds = new Set((mystery?.clues ?? []).map((c) => c.id));
  const endingWords = new Set([...epilogues, ...outcomes.map((o) => o.class)]);

  for (const f of facts) {
    if (!f || !factsById.has(f.id)) continue;
    if (!KINDS.has(f.kind)) say(`${f.id}: kind ${JSON.stringify(f.kind)} is not history, person, place, belief or rumour`);
    if (!nonEmpty(f.text)) say(`${f.id}: no text`);
    for (const src of asList(f.sources)) sourceOk(f, src);
    sinceOk(f, { outcomes, clueIds, endingWords, performanceById, mystery, say });
    for (const other of asList(f.contradicts)) {
      const g = factsById.get(other);
      if (!g) { say(`${f.id}: contradicts ${other}, which is not a fact (dangling id)`); continue; }
      if (!CONTRADICTABLE.has(f.kind) && !CONTRADICTABLE.has(g.kind)) {
        say(`${f.id}: contradicts ${other}, and neither is a belief nor a rumour — two ${f.kind === g.kind ? f.kind + ' facts' : `${f.kind} and ${g.kind} facts`} may not disagree`);
      }
    }
  }

  // Every document's `cites` is told from the document's side too: a fact
  // that never lists this document as a source is content nobody can reach
  // by reading it, cited without being told.
  for (const d of docs) {
    if (!d || !d.id) continue;
    for (const id of asList(d.cites)) {
      const f = factsById.get(id);
      if (f && !asList(f.sources).some((s) => s?.kind === 'document' && s.id === d.id)) {
        say(`${d.id}: cites ${id}, but that fact's own sources do not name ${d.id} back`);
      }
    }
  }
  for (const [, p] of chatterById) {
    for (const id of asList(p.cites)) {
      if (!factsById.has(id)) say(`chatter pair ${p.id}: cites ${id}, which is not a fact (dangling id)`);
    }
  }
  for (const [, e] of performanceById) {
    for (const id of asList(e.cites)) {
      const f = factsById.get(id);
      if (!f) { say(`performance ${e.id}: cites ${id}, which is not a fact (dangling id)`); continue; }
      if (!asList(f.sources).some((s2) => s2?.kind === 'performance' && s2.id === e.id)) {
        say(`performance ${e.id}: cites ${id}, but that fact's own sources do not name ${e.id} back`);
      }
    }
  }

  return problems;
}

/**
 * Every problem in one fact's `since`. Four kinds, and the first two are what
 * SPECS.md asked for in so many words: a row may not name an ending or a clue
 * the mystery has not got.
 *
 * 1. The vocabulary. `when`/`unless` name an ending key or a verdict class;
 *    `knew` names clue ids. A typo in either is a row that reads as "never"
 *    and says so nowhere.
 * 2. Reachability. A row that applies to no ending at all is dead text, the
 *    same failure `day2.castle` already refuses.
 * 3. It has to be a change. Empty text, or text the same as the fact's own,
 *    is a row that costs a reader a diff to discover it did nothing.
 * 4. It has to be told, and told only where it is true (#649). `tells` names a
 *    performance; that piece must cite this fact back, and every ending and
 *    journal that reaches the piece must be one this row applies to. A piece
 *    heard in an ending the row does not cover is the castle saying the new
 *    thing in a play where the canon still says the old one.
 */
function sinceOk(fact, { outcomes, clueIds, endingWords, performanceById, mystery, say }) {
  const rows = fact.since;
  if (rows == null) return;
  if (!Array.isArray(rows) || !rows.length) { say(`${fact.id}: since is not a non-empty list`); return; }
  const seen = new Map();
  rows.forEach((row, i) => {
    const where = `${fact.id}: since[${i}]`;
    if (!row || typeof row !== 'object') { say(`${where} is not an object`); return; }
    for (const key of ['when', 'unless']) {
      for (const k of asList(row[key])) {
        if (!endingWords.has(k)) say(`${where}: ${key} names ${JSON.stringify(k)}, which is not an ending this mystery can reach nor a verdict class`);
      }
    }
    for (const id of asList(row.knew)) {
      if (!clueIds.has(id)) say(`${where}: knew names ${JSON.stringify(id)}, which is not a clue in data/mystery.json`);
    }
    const live = outcomes.filter((o) => dayTwoApplies(row, o, asList(row.knew)));
    if (!live.length) say(`${where}: applies to no ending, so the canon never says it`);
    if (!nonEmpty(row.text)) say(`${where}: no text, so the fact would change into nothing`);
    else if (row.text.trim() === String(fact.text ?? '').trim()) say(`${where}: the same text the fact already has, so nothing changes`);
    // Two rows keyed alike is two rows only the first of which is ever read.
    // Ordering is what resolves a general row after a specific one; it cannot
    // resolve two rows with the same key.
    const key = `${asList(row.when).join('|')}>${asList(row.unless).join('|')}>${[...asList(row.knew)].sort().join('|')}`;
    if (seen.has(key)) say(`${where}: keyed exactly as since[${seen.get(key)}], and only the first would be read`);
    else seen.set(key, i);

    const piece = performanceById.get(row.tells);
    if (!nonEmpty(row.tells)) { say(`${where}: no \`tells\`, so nothing in the castle says the changed fact`); return; }
    if (!piece) { say(`${where}: tells ${JSON.stringify(row.tells)}, which is not a performance`); return; }
    if (!asList(piece.cites).includes(fact.id)) { say(`${where}: tells ${row.tells}, but that piece's own \`cites\` does not name ${fact.id} back`); return; }
    // Heard where the row is not true: every ending, every subset of the clue
    // ids either side names. The piece may be narrower than the row and may
    // not be wider.
    const universe = [...new Set([...asList(row.knew), ...asList(piece.knew)])];
    for (const o of outcomes) {
      for (let mask = 0; mask < (1 << universe.length); mask++) {
        const held = universe.filter((_, k) => mask & (1 << k));
        if (!dayTwoApplies(piece, o, held) || dayTwoApplies(row, o, held)) continue;
        if (dayTwoAbsent(mystery, o).has(piece.npc)) continue;
        const journal = held.length ? ` holding ${held.join(', ')}` : '';
        say(`${where}: ${row.tells} is heard after the verdict ${o.key}${journal}, which this row does not apply to, so the castle would say the changed fact while the canon still says the old one`);
        return;
      }
    }
  });
}

/**
 * What the canon says about one fact after one ending, with one journal: the
 * first `since` row that applies, or the fact's own `text` when none does.
 * `outcome` is null on day one, which is the same answer as a fact with no
 * `since`, because the morning after is the only day this question has a
 * second answer.
 */
export function factText(fact, outcome = null, held = null) {
  if (!fact) return null;
  for (const row of asList(fact.since)) {
    if (dayTwoApplies(row, outcome, held) && nonEmpty(row.text)) return row.text;
  }
  return fact.text ?? null;
}

/** Fact ids with no source at all. A report, not a failure: WISHLIST.md's own rule for theme 3. */
export function untoldFacts(lore) {
  return (lore?.facts ?? []).filter((f) => f && !asList(f.sources).length).map((f) => f.id);
}
