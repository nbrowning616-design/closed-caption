// night.js — the end of the night (and the night before), worked out on the server so every phone shows the same.
//
//   THE ENDING (game over): the winner (with each player's rating change, and the Remote changing hands), one awards
//   slide, the END CREDITS (one freeze-frame card per player, an epilogue earned from how they played, ~6.5 s each,
//   the dealer can tap on), the cast list (and the monkey, if it out-guessed anyone), then Caption of the Night.
//   game.ending = { at, step, stepAt, beats, done, ... }: phones work out the beat on screen from the server clock;
//   'ending_next' (the dealer or host) moves to the next beat at once.
//
//   THE REMOTE: the table's traveling trophy. Phones keep each table's history (cc_tables): who holds the Remote,
//   the masking tape (every winner's name and date), the first cartoon, and a short summary of the last game.
//   A table is mostly the same names: in the lobby the phones send the records that fit, and the most recent wins.
//
//   PREVIOUSLY ON CLOSED CAPTION: when most of tonight's table played that table's last game, round 1 opens with a
//   cold open the dealer reads (last time's winner, last time's Caption of the Night, one grudge, "And now, the
//   rematch."). On the table's anniversary it shows the first cartoon they ever played.
//
//   SEALED SCORES (R18): once the Late Edition starts, the phones get the totals as they stood when it began, and the
//   scoreboard says only "Scores are sealed until the end" and your own points for the round. At game over the
//   ending opens by reading the standings from last place up, one name a beat, then the top two together.
//
//   HEADING OUT (R28): a player who leaves early gets their own credit on the spot (from their play so far); the
//   table hears "Bob has left the building."; their seat leaves the turn order; at the end their credit is read with
//   everyone else's, "in absentia". LAST CALL (R30): the host makes the next trip around the table the last one.
//
//   THE MONKEY: every round a monkey bets at random under the same chip rules (nobody sees it; seeded from the game,
//   so a restored room gets the same monkey). If anyone found the real caption fewer times than the monkey did over
//   the same rounds, the credits end on one line about it.
//
// Reads the game record (game.js history, flags, ratingResult) and never changes it, apart from its own fields:
// game.nightLog, game.ending, game.previously, game.nightTable, game.tableCands, game.lastTable.
// Never sends or logs a real caption: every caption here is a player's fake (the real one is skipped everywhere).
'use strict';
const crypto = require('crypto');
const Rating = require('./rating');
const W = require('./credits');
let G = null;
const game_ = () => G || (G = require('./game'));   // (late: game.js is still loading when this file is first read)

const WINNER_MS = 7000, AWARDS_MS = 7500, CREDIT_MS = 8000, LEAD_MS = 400;   // the ending's beats (a credit: the dealer taps on; 8 s if not)
const EPILOGUE_WORDS = 22;   // cut 5: epilogues of about 20 words (longer lines only when nothing shorter fits)
const RETURN_GAP_MS = 6 * 3600 * 1000;   // cut 5: "Previously on" only when the table comes back on a later day
const STAND_MS = 2800, TOP_MS = 3600;   // sealed games: the standings read from the bottom, then the top two held together
const PREV_MS = 10000;   // the cold open (round 1's writers get the time back)
const MAX_TAPE = 40, MAX_CANDS = 8;

/* ── small helpers ── */
function rngFrom(seed) {
  let a = parseInt(Rating.lineKey(String(seed)), 36) >>> 0 || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = (n) => (n >= 0 && n <= 12 ? WORDS[n] : String(n));
const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : num(n) + ' times');
const SINGULAR = { captions: 'caption', chips: 'chip', fakes: 'fake', groans: 'groan', skips: 'skip', cartoons: 'cartoon', points: 'point', 'do-overs': 'do-over' };
// Fill a line: {name} {other} {n} ("{n} times" -> once/twice/three times; "{n} fakes" -> one fake / two fakes)
function fill(text, ctx) {
  const n = Number(ctx.n) || 0;
  let t = String(text);
  t = t.replace(/\{n\} times\b/g, () => times(n));
  if (ctx.digits) t = t.replace(/\{n\}/g, String(n));
  t = t.replace(/\{n\}( fake| other)? (captions|chips|fakes|groans|skips|cartoons|points|do-overs)\b/g, (m, mid, noun) => (n === 1 ? 'one' + (mid || '') + ' ' + SINGULAR[noun] : num(n) + (mid || '') + ' ' + noun));
  t = t.replace(/\{n\}/g, num(n));
  for (const [k, v] of Object.entries(ctx)) if (typeof v === 'string') t = t.split('{' + k + '}').join(v);
  return t;
}
const wordsIn = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
const firstWord = (s) => String(s || '').trim().split(/\s+/)[0] || String(s || '');
const listNames = (a) => (a.length <= 1 ? (a[0] || '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const isoDay = (ms) => { try { return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return new Date(ms).toISOString().slice(0, 10); } };

// Seen lines: how recently any phone at the table saw each key (0..1, 1 = just now); missing = never
function recency(lists) {
  const m = new Map();
  for (const list of lists) {
    if (!Array.isArray(list) || !list.length) continue;
    list.forEach((k, i) => { const v = (i + 1) / list.length; if (!(m.get(k) >= v)) m.set(k, v); });
  }
  return m;
}
// One of these, never one used at this table this game; of the rest one nobody here has seen; else the oldest
function pickFrom(list, seen, taken, rnd) {
  const all = list.map(x => ({ x, k: Rating.lineKey(x.text) }));
  if (!all.length) return null;
  let cand = all.filter(o => !taken.has(o.k));
  if (!cand.length) cand = all;
  const fresh = cand.filter(o => !seen.has(o.k));
  let pick;
  if (fresh.length) pick = fresh[Math.floor(rnd() * fresh.length)];
  else { const lo = Math.min(...cand.map(o => seen.get(o.k))); const old = cand.filter(o => seen.get(o.k) === lo); pick = old[Math.floor(rnd() * old.length)]; }
  taken.add(pick.k);
  return pick;
}
const seenAt = (game) => recency((game.players || []).map(p => p.seenLines));

/* ── The Ha / Groan tallies (#26), read defensively ──
   history[r].reacts[key] = { ha, groan, haBlind } (counts per caption, from the round's close) · or .tallies[key] ·
   or .groans[key] / .has[key] = n or { pid: 1 } · or history[r].reactions[key][pid] = { ha: 1|2, groan: 1|2 } or a kind word */
function countOf(v) {
  if (typeof v === 'number') return v > 0 ? v : 0;
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === 'object') return Object.values(v).filter(Boolean).length;
  return 0;
}
function tallyIn(h, kind) {
  const out = {};
  const add = (k, n) => { if (n > 0) out[String(k)] = (out[String(k)] || 0) + n; };
  const want = kind === 'groan' ? /groan/i : /^(ha|laugh|haha)$/i;
  try {
    const t = h && (h.reacts || h.tallies || h.reactionTallies);
    if (t && typeof t === 'object') for (const [k, v] of Object.entries(t)) if (v && typeof v === 'object') for (const [kk, vv] of Object.entries(v)) if (want.test(kk) || want.test(kk.replace(/s$/, ''))) add(k, countOf(vv));
    const direct = h && (kind === 'groan' ? (h.groans || h.groan) : (h.has || h.ha || h.laughs));
    if (direct && typeof direct === 'object') for (const [k, v] of Object.entries(direct)) add(k, countOf(v));
    if (!Object.keys(out).length && h && h.reactions && typeof h.reactions === 'object') {
      for (const [k, m] of Object.entries(h.reactions)) if (m && typeof m === 'object') add(k, Object.values(m).filter(x => (x && typeof x === 'object' ? Object.keys(x).some(kk => x[kk] && want.test(kk)) : want.test(String(x)))).length);
    }
  } catch (e) {}
  return out;
}
const hasTallies = (game, kind) => (game.history || []).some(h => Object.keys(tallyIn(h, kind)).length > 0);

/* ── What the phones can't see: the order captions came in, and the skip votes ── */
function log(game) {
  if (!game.nightLog || typeof game.nightLog !== 'object') game.nightLog = { subs: [], skips: {} };
  if (!Array.isArray(game.nightLog.subs)) game.nightLog.subs = [];
  if (!game.nightLog.skips || typeof game.nightLog.skips !== 'object') game.nightLog.skips = {};
  return game.nightLog;
}
function noteSubmit(game, pid) {
  try {
    const L = log(game), c = game.cartoon;
    L.subs.push({ r: game.round, c: c ? c.id : null, p: pid, at: Date.now(), end: game.timerEnd || null });
    if (L.subs.length > 400) L.subs.splice(0, L.subs.length - 400);
  } catch (e) {}
}
function noteSkip(game, pid) {
  try {
    const L = log(game), k = game.round + '|' + (game.cartoon ? game.cartoon.id : '');
    const list = L.skips[pid] = Array.isArray(L.skips[pid]) ? L.skips[pid] : [];
    if (!list.includes(k)) list.push(k);
  } catch (e) {}
}

/* ── The facts of the night, per player ── */
function capOf(h, t) { return t === 'closed' ? { playerId: h.closedPlayerId, isCorrect: !!h.closedIsCorrect, caption: h.closedCaption } : ((h.openCaptions || [])[Number(t)] || {}); }
function facts(game) {
  const H = (game.history || []).filter(h => h && Array.isArray(h.openCaptions));
  const ps = game.players || [];
  const idByName = new Map(ps.map(p => [String(p.name), p.id]));
  const F = {};
  for (const p of ps) F[p.id] = { id: p.id, name: p.name, score: p.score || 0, late: (p.joinedRound || 0) > 0, wrote: 0, fooled: 0, victims: {}, gotFooled: 0, found: 0, bet: 0, blindClosed: 0, longShot: 0, steals: 0, stoleFrom: {}, stolen: 0, framedMine: 0, framedOthers: 0, first: 0, last: 0, subRounds: 0, skips: 0, groans: 0, caps: [], dealt: 0 };
  let framed = [];
  try { framed = game_().hallOfFame(game).filter(e => !e.isReal && e.writerId); } catch (e) {}
  const framedKey = new Set(framed.map(e => e.round + '|' + e.target));
  const cum = {}; ps.forEach(p => { cum[p.id] = 0; });
  const after = [];   // after[i] = everyone's total after round i + 1
  const L = log(game);
  for (const h of H) {
    const dealerId = idByName.get(String(h.dealerName));
    if (dealerId && F[dealerId]) F[dealerId].dealt++;
    const groans = tallyIn(h, 'groan'), has = tallyIn(h, 'ha');
    const keys = h.openCaptions.map((_, i) => String(i)).concat('closed');
    const capRow = {};
    for (const k of keys) {
      const c = capOf(h, k);
      if (!c.playerId || !F[c.playerId] || c.isCorrect || !c.caption) continue;
      F[c.playerId].wrote++;
      const row = { round: h.round, key: k, caption: c.caption, image: h.cartoon && h.cartoon.image, cartoonId: h.cartoon && h.cartoon.id, chips: 0, by: {}, ha: has[k] || 0, groans: groans[k] || 0, framed: framedKey.has(h.round + '|' + (k === 'closed' ? 'closed' : Number(k))) };
      F[c.playerId].caps.push(row); capRow[k] = row;
      F[c.playerId].groans += row.groans;
      if (row.framed) F[c.playerId].framedMine++;
    }
    const betters = new Set(), finders = new Set();
    for (const b of h.bets || []) {
      if (!b || b.target === 'pass' || !F[b.playerId]) continue;
      const n = (b.count || 0) + (b.stolen || 0);
      if (n < 1) continue;
      const k = String(b.target), c = capOf(h, k);
      betters.add(b.playerId);
      if (c.isCorrect) finders.add(b.playerId);
      else if (c.playerId && c.playerId !== b.playerId && F[c.playerId]) {
        F[c.playerId].fooled += n;
        F[c.playerId].victims[b.playerId] = (F[c.playerId].victims[b.playerId] || 0) + n;
        F[b.playerId].gotFooled += n;
        if (capRow[k]) { capRow[k].chips += n; capRow[k].by[b.playerId] = (capRow[k].by[b.playerId] || 0) + n; }
      }
      if (b.stage === 1 && k === 'closed') { F[b.playerId].blindClosed++; if (h.closedIsCorrect && (b.count || 0) > 0) F[b.playerId].longShot++; }
    }
    betters.forEach(id => { F[id].bet++; });
    finders.forEach(id => { F[id].found++; });
    if (h.steal && h.steal.victimId && dealerId && F[dealerId] && F[h.steal.victimId]) {
      F[dealerId].steals++;
      F[dealerId].stoleFrom[h.steal.victimId] = (F[dealerId].stoleFrom[h.steal.victimId] || 0) + 1;
      F[h.steal.victimId].stolen++;
    }
    // Who was first in and last in (the captions that made it to this cartoon)
    const subs = L.subs.filter(s => s.r === h.round && (!h.cartoon || s.c === h.cartoon.id) && F[s.p]).sort((a, b) => a.at - b.at);
    const seenP = new Set(), uniq = subs.filter(s => (seenP.has(s.p) ? false : (seenP.add(s.p), true)));
    uniq.forEach(s => { F[s.p].subRounds++; });
    if (uniq.length >= 2) {
      F[uniq[0].p].first++;
      const z = uniq[uniq.length - 1];
      if (!z.end || z.at >= z.end - 20000) F[z.p].last++;   // with a clock: in the last 20 seconds (or after it ran out)
    }
    for (const [pid, pts] of Object.entries(h.roundScores || {})) if (pid in cum) cum[pid] += pts || 0;
    after.push({ ...cum });
  }
  for (const [pid, list] of Object.entries(L.skips)) if (F[pid] && Array.isArray(list)) F[pid].skips = list.length;
  // Frame picks for other people's captions (whatever screen Frame It lives on, game.flags keeps them)
  const picks = {};
  for (const f of game.flags || []) if (f && F[f.fromId]) (picks[f.fromId] = picks[f.fromId] || new Set()).add(f.round + '|' + f.target);
  for (const [pid, s] of Object.entries(picks)) F[pid].framedOthers = s.size;
  const rows = (game.ratingResult && game.ratingResult.rows) || {};
  for (const p of ps) { const r = rows[p.id]; F[p.id].delta = r && Number.isFinite(r.delta) ? r.delta : null; }
  return { F, after, rounds: H.length };
}

/* ── The monkey: a dart-throwing control player. Every round it bets 1 or 2 chips blind on any caption (the
   face-down one too); holding one chip, it puts the other down after the flip, anywhere. Never seen, never scores. ── */
function monkeyRounds(game) {
  const out = {};
  const rnd = rngFrom('monkey|' + (game.gameId || game.code || ''));
  for (const h of game.history || []) {
    if (!h || !Array.isArray(h.openCaptions)) continue;
    const keys = h.openCaptions.map((_, i) => String(i)).concat('closed');
    const real = h.closedIsCorrect ? 'closed' : String(h.openCaptions.findIndex(c => c && c.isCorrect));
    const blind = keys[Math.floor(rnd() * keys.length)], two = rnd() < 0.5;
    const late = two ? null : keys[Math.floor(rnd() * keys.length)];
    out[h.round] = blind === real || late === real;
  }
  return out;
}
function monkeyLine(game, F) {
  const M = monkeyRounds(game);
  const rows = [];
  for (const p of game.players || []) {
    const f = F[p.id]; if (!f) continue;
    let m = 0, k = 0, n = 0;
    for (const h of game.history || []) {
      if (!h || !(h.bets || []).some(b => b && b.playerId === p.id && b.target !== 'pass' && (b.count || 0) + (b.stolen || 0) > 0)) continue;
      n++;
      if (M[h.round]) m++;
      if ((h.bets || []).some(b => b && b.playerId === p.id && b.target !== 'pass' && (b.count || 0) + (b.stolen || 0) > 0 && capOf(h, String(b.target)).isCorrect)) k++;
    }
    if (n >= 2 && m >= 1 && k < m) rows.push({ id: p.id, name: p.name, m, k });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => (b.m - b.k) - (a.m - a.k) || a.k - b.k);
  const top = rows.filter(r => r.m === rows[0].m && r.k === rows[0].k);
  const names = listNames(top.map(r => firstWord(r.name)));
  const text = `The monkey found the real caption ${times(top[0].m)}. ${names} ${top[0].k ? 'found it ' + times(top[0].k) : 'never did'}.`;
  return { text, ids: top.map(r => r.id), m: top[0].m, k: top[0].k };
}

/* ── Each player's candidates for a credit: [{ t, score, n, other }] ── */
function candidates(game, X, stand, partial) {
  const { F, after, rounds } = X;
  const ps = (game.players || []).filter(p => F[p.id] && (F[p.id].wrote || F[p.id].bet || F[p.id].dealt || p.score || (game.departed && game.departed[p.id])));
  const sorted = ps.slice().sort((a, b) => b.score - a.score);
  const rankOf = (p) => sorted.filter(q => q.score > p.score).length;
  const n = ps.length, top = sorted.length ? sorted[0].score : 0, low = sorted.length ? sorted[sorted.length - 1].score : 0;
  const winners = (stand && stand.winners) || [], tied = (stand && stand.tied) || [];
  const settled = ps.filter(p => !F[p.id].late);
  const max = (key) => Math.max(0, ...ps.map(p => F[p.id][key] || 0));
  const solo = (key, v) => ps.filter(p => (F[p.id][key] || 0) === v).length === 1;
  const bonus = (key, v) => (v > 0 && v === max(key) ? (solo(key, v) ? 10 : 4) : 0);
  const more = (k, v, capAt = 24) => Math.min(capAt, k * v);   // a bigger count is more distinctive, up to a point
  const out = {};
  for (const p of ps) {
    const f = F[p.id], c = [], add = (t, score, extra = {}) => c.push({ t, score, ...extra }), rank = rankOf(p);
    if (winners.length === 1 && winners[0] === p.id) add('won', 72);
    if (tied.length >= 2 && tied.includes(p.id)) add('tiedFirst', 84);
    if (n >= 3 && p.score === low && low < top) add('last', 66);
    if (n >= 3 && rank > 0 && p.score !== low) add('middle', 24);
    if (rounds >= 4 && after.length >= 2 && !f.late) {
      const a2 = after[1], vals = settled.map(q => a2[q.id] || 0), lo2 = Math.min(...vals), hi2 = Math.max(...vals);
      if ((a2[p.id] || 0) === lo2 && lo2 < hi2 && rank <= 1) add('comeback', 95, { second: rank === 1 && !tied.includes(p.id) });
      const hh = after[Math.floor(rounds / 2) - 1], hv = settled.map(q => hh[q.id] || 0), hiH = Math.max(...hv);
      if (hiH > 0 && (hh[p.id] || 0) === hiH && rank >= Math.ceil(n / 2)) add('collapse', 92);
    }
    if (f.fooled >= 3) {
      const [vid, vn] = Object.entries(f.victims).sort((a, b) => b[1] - a[1])[0] || [];
      if (vid && vn >= 2 && F[vid]) add('fooledMany', 60 + more(6, f.fooled) + bonus('fooled', f.fooled), { n: vn, other: F[vid].name });
    }
    if (f.wrote >= 2 && f.fooled === 0) add('fooledNobody', 70 + more(3, f.wrote - 2, 12));
    if (f.gotFooled >= 3) add('gotFooled', 48 + more(6, f.gotFooled) + bonus('gotFooled', f.gotFooled), { n: f.gotFooled });
    if (f.found >= 3) add('foundMany', 50 + more(8, f.found) + bonus('found', f.found), { n: f.found });
    if (f.bet >= 3 && f.found === 0) add('neverFound', 72 + more(2, f.bet, 10));
    if (f.blindClosed >= 2) add('blindMany', 52 + more(8, f.blindClosed) + bonus('blindClosed', f.blindClosed), { n: f.blindClosed });
    if (f.longShot >= 1) add('longShot', 86 + more(4, f.longShot - 1, 8));
    if (f.steals >= 2) add('stoleMany', 54 + more(8, f.steals) + bonus('steals', f.steals), { n: f.steals });
    { const [vid, vn] = Object.entries(f.stoleFrom).sort((a, b) => b[1] - a[1])[0] || []; if (vid && vn >= 2 && F[vid]) add('robbedTwice', 88, { n: vn, other: F[vid].name }); }
    if (f.stolen >= 2) add('robbedMany', 54 + more(8, f.stolen) + bonus('stolen', f.stolen), { n: f.stolen });
    if (f.framedMine >= 1) add('framedMine', 64 + more(10, f.framedMine, 30) + bonus('framedMine', f.framedMine), { n: f.framedMine });
    if (f.framedOthers >= 2) add('framedOthers', 46 + more(6, f.framedOthers) + bonus('framedOthers', f.framedOthers), { n: f.framedOthers });
    if (f.last >= 2 && f.last >= 0.6 * f.subRounds) add('lastSecond', 58 + more(6, f.last) + bonus('last', f.last), { n: f.last });
    if (f.first >= 2 && f.first >= 0.6 * f.subRounds) add('firstIn', 56 + more(6, f.first) + bonus('first', f.first), { n: f.first });
    if (f.skips >= 2) add('skips', 56 + more(8, f.skips) + bonus('skips', f.skips), { n: f.skips });
    if (f.delta !== null && f.delta >= 20) add('ratingUp', 44 + Math.min(40, f.delta / 2), { n: f.delta, digits: true });
    if (f.delta !== null && f.delta <= -20) add('ratingDown', 44 + Math.min(40, -f.delta / 2), { n: -f.delta, digits: true });
    if (f.groans >= 2 && f.groans === max('groans')) add('groans', 62 + more(4, f.groans), { n: f.groans });
    if (!c.some(x => !['middle', 'last', 'won', 'tiedFirst'].includes(x.t))) add('quiet', 12);
    c.sort((a, b) => b.score - a.score);
    // heading out mid-game: no place, comeback or rating to speak of yet
    out[p.id] = partial ? c.filter(x => !['won', 'tiedFirst', 'last', 'middle', 'comeback', 'collapse', 'ratingUp', 'ratingDown'].includes(x.t)) : c;
    if (partial && !out[p.id].length) out[p.id] = [{ t: 'quiet', score: 12 }];
  }
  return { out, order: sorted.map(p => p.id), rankOf: Object.fromEntries(ps.map(p => [p.id, rankOf(p)])) };
}

// Give everyone their most distinctive credit, never two the same when it can be helped (the best total)
function assign(cands, ids, fixed) {
  fixed = fixed || {};
  const lists = ids.map(id => { if (fixed[id]) return [{ t: fixed[id], score: 0, fixed: true }]; const all = cands[id] || []; const top = all.slice(0, 7); return top.length ? top : [{ t: 'quiet', score: 12 }]; });
  const best = { total: -Infinity, pick: null }, cur = new Array(ids.length), used = new Map();
  const ub = []; for (let i = ids.length - 1; i >= 0; i--) ub[i] = (ub[i + 1] || 0) + Math.max(...lists[i].map(c => c.score));
  let steps = 0;
  (function go(i, total) {
    if (++steps > 300000) return;
    if (i === ids.length) { if (total > best.total) { best.total = total; best.pick = cur.slice(); } return; }
    if (total + ub[i] <= best.total) return;
    for (const c of lists[i]) {
      const dup = used.get(c.t) || 0;
      used.set(c.t, dup + 1); cur[i] = c;
      go(i + 1, total + c.score - dup * 1000);   // a repeat only when nobody has anything else
      used.set(c.t, dup);
    }
  })(0, 0);
  const pick = {};
  ids.forEach((id, i) => { pick[id] = (best.pick && best.pick[i]) || lists[i][0]; });
  return pick;
}

// A player's freeze-frame: their best caption tonight (most chips, then framed, then laughs), on its cartoon
function freezeOf(game, f) {
  const caps = (f.caps || []).slice().sort((a, b) => b.chips - a.chips || (b.framed - a.framed) || b.ha - a.ha || b.round - a.round);
  const c = caps[0];
  if (c) return { caption: c.caption, image: c.image, round: c.round };
  const h = (game.history || [])[game.history.length - 1];
  return h && h.cartoon ? { caption: null, image: h.cartoon.image, round: h.round } : null;
}

/* ── The one awards slide (#12, #27) ── */
function awards(game, X, rnd) {
  const { F } = X, out = [];
  const all = Object.values(F).flatMap(f => f.caps.map(c => ({ ...c, writer: f.id })));
  const nm = (id) => (F[id] ? F[id].name : '?');
  // Best Lie: the fake that drew the most chips (with who fell for it)
  const lies = all.filter(c => c.chips >= 2).sort((a, b) => b.chips - a.chips || Object.keys(b.by).length - Object.keys(a.by).length || b.round - a.round);
  if (lies.length) {
    const L = lies[0], by = Object.entries(L.by).sort((a, b) => b[1] - a[1]);
    const fell = by.length === 1 ? `${firstWord(nm(by[0][0]))} fell for it${by[0][1] > 1 ? ' with both chips' : ''}.` : `${listNames(by.map(([id]) => firstWord(nm(id))))} fell for it.`;
    out.push({ k: 'bestLie', title: 'Best Lie', who: nm(L.writer), quote: L.caption, image: L.image, line: fell });
  }
  // Best Liar (what the old hat measured): the most chips on their fakes, all night
  const liars = Object.values(F).filter(f => f.fooled >= 2), mf = Math.max(0, ...liars.map(f => f.fooled));
  if (mf >= 2) {
    const top = liars.filter(f => f.fooled === mf);
    out.push({ k: 'bestLiar', title: 'Best Liar', who: listNames(top.map(f => f.name)), line: top.length === 1 ? `Lied ${times(top[0].wrote)}. Believed ${times(mf)}.` : `Believed ${times(mf)} each.` });
  }
  // Nobody Bit: a fake that drew no chips at all, quoted gently (framed ones first, then the ones people laughed at)
  const none = all.filter(c => c.chips === 0 && !(lies[0] && c === lies[0]));
  if (none.length) {
    const framed = none.filter(c => c.framed), laughed = none.filter(c => c.ha >= 2).sort((a, b) => b.ha - a.ha);
    const N = framed.length ? framed[Math.floor(rnd() * framed.length)] : laughed.length ? laughed[0] : none[Math.floor(rnd() * none.length)];
    const line = N.framed ? W.NOBODY_BIT_FRAMED : N.ha >= 2 ? W.NOBODY_BIT_HA : W.NOBODY_BIT[Math.floor(rnd() * W.NOBODY_BIT.length)];
    out.push({ k: 'nobodyBit', title: 'Nobody Bit', who: nm(N.writer), quote: N.caption, line });
  }
  // Most Groans (only when the table has groan tallies)
  if (hasTallies(game, 'groan')) {
    const mg = Math.max(0, ...Object.values(F).map(f => f.groans));
    if (mg >= 2) { const top = Object.values(F).filter(f => f.groans === mg); out.push({ k: 'groans', title: 'Most Groans', who: listNames(top.map(f => f.name)), line: `${num(mg)[0].toUpperCase() + num(mg).slice(1)} groans. ${W.GROANS_LINE[Math.floor(rnd() * W.GROANS_LINE.length)]}` }); }
  }
  // Sharpest Eye, if there's room and it isn't a third award for someone already named twice
  const ms = Math.max(0, ...Object.values(F).map(f => f.found));
  if (ms >= 2) {
    const top = Object.values(F).filter(f => f.found === ms), named = (n) => out.filter(a => a.who.split(/, | and /).includes(n)).length;
    if (!top.some(f => named(f.name) >= 2)) out.push({ k: 'sharp', title: 'Sharpest Eye', who: listNames(top.map(f => f.name)), line: `Found the real caption ${times(ms)}.` });
  }
  return out.slice(0, 4);
}

/* ── The table: what the phones keep (cc_tables), cleaned on the way in ── */
const str = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const okMs = (n) => Number.isFinite(n) && n > 1.6e12 && n < Date.now() + 864e5;
function cleanFact(x) {
  if (!x || typeof x !== 'object' || typeof x.k !== 'string' || !W.GRUDGE_ORDER.includes(x.k)) return null;
  const o = { k: x.k, a: str(x.a, 24) };
  if (!o.a) return null;
  if (x.b) o.b = str(x.b, 24);
  if (Number.isInteger(x.n) && x.n > 0 && x.n < 100) o.n = x.n;
  return o;
}
function cleanTable(r) {
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !/^[A-Za-z0-9_-]{6,24}$/.test(r.id) || !okMs(r.at)) return null;
  const names = Array.isArray(r.names) ? r.names.slice(0, 12).map(n => str(n, 24).trim()).filter(Boolean) : [];
  if (names.length < 2) return null;
  const o = { id: r.id, at: r.at, names, games: Number.isInteger(r.games) && r.games > 0 && r.games < 1e5 ? r.games : 1 };
  o.holder = Array.isArray(r.holder) ? r.holder.slice(0, 8).map(n => str(n, 24).trim()).filter(Boolean) : [];
  o.tape = Array.isArray(r.tape) ? r.tape.slice(-MAX_TAPE).map(t => (t && typeof t === 'object' ? { n: str(t.n, 40).trim(), d: /^\d{4}-\d{2}-\d{2}$/.test(t.d) ? t.d : '' } : null)).filter(t => t && t.n && t.d) : [];
  if (r.first && typeof r.first === 'object' && okMs(r.first.at)) o.first = { at: r.first.at, cartoonId: Number(r.first.cartoonId) || null, image: /^[\w.-]{1,60}$/.test(r.first.image || '') ? r.first.image : null };
  o.anniv = Number.isInteger(r.anniv) && r.anniv >= 0 && r.anniv < 100 ? r.anniv : 0;
  if (r.vsBest && Number.isInteger(r.vsBest.table) && Number.isInteger(r.vsBest.cartoonist) && r.vsBest.table >= 0 && r.vsBest.cartoonist >= 0 && r.vsBest.table < 1000 && r.vsBest.cartoonist < 1000) o.vsBest = { table: r.vsBest.table, cartoonist: r.vsBest.cartoonist };
  if (r.last && typeof r.last === 'object' && okMs(r.last.at)) {
    const l = r.last;
    o.last = { at: l.at, winners: Array.isArray(l.winners) ? l.winners.slice(0, 8).map(n => str(n, 24).trim()).filter(Boolean) : [] };
    const c = l.coton;
    if (c && typeof c === 'object' && typeof c.caption === 'string' && c.caption.trim() && /^[\w.-]{1,60}$/.test(c.image || '')) o.last.coton = { caption: str(c.caption, 220), image: c.image, writer: str(c.writer, 24), cartoonId: Number(c.cartoonId) || null };
    o.last.facts = Array.isArray(l.facts) ? l.facts.slice(0, 16).map(cleanFact).filter(Boolean) : [];
  }
  return o;
}
// A phone in the lobby sends the records that fit the names here (most recent version of each table wins)
function setTables(game, pid, list) {
  if (!Array.isArray(list)) return { error: 'That didn’t take. Try again.' };
  const cands = Array.isArray(game.tableCands) ? game.tableCands : [];
  for (const raw of list.slice(0, 4)) {
    const r = cleanTable(raw); if (!r) continue;
    const i = cands.findIndex(x => x.id === r.id);
    if (i < 0) cands.push(r); else if (r.at > cands[i].at || (r.at === cands[i].at && (r.tape || []).length > (cands[i].tape || []).length)) cands[i] = r;
  }
  cands.sort((a, b) => b.at - a.at);
  game.tableCands = cands.slice(0, MAX_CANDS);
  return { ok: true };
}
// Most of tonight's table played that table's last game (2 or more of them)
function fits(names, rec) {
  const set = new Set((rec.names || []).map(norm));
  const o = names.filter(n => set.has(norm(n))).length;
  return o >= 2 && o * 2 > names.length;
}
function matchTable(game, names) {
  const all = [].concat(game.lastTable ? [game.lastTable] : [], Array.isArray(game.tableCands) ? game.tableCands : []);
  let best = null;
  for (const r of all) if (r && fits(names, r) && (!best || r.at > best.at)) best = r;
  return best;
}
const hereNames = (game) => (game.players || []).filter(p => p.connected || (game.phase !== 'lobby')).map(p => p.name);
const streakOf = (tape) => { if (!tape || !tape.length) return 0; const k = norm(tape[tape.length - 1].n); let s = 0; for (let i = tape.length - 1; i >= 0 && norm(tape[i].n) === k; i--) s++; return s; };
// The lobby: who has the Remote (and the tape, to read)
function lobbyRemote(game) {
  const names = hereNames(game), rec = names.length >= 2 ? matchTable(game, names) : null;
  if (!rec || !rec.holder || !rec.holder.length) return null;
  const here = new Set(names.map(norm));
  return { holder: rec.holder.slice(), present: rec.holder.some(n => here.has(norm(n))), streak: streakOf(rec.tape), tape: (rec.tape || []).slice(-MAX_TAPE), games: rec.games || 1, since: rec.first ? isoDay(rec.first.at) : null };
}

/* ── Previously on Closed Caption: round 1's cold open ── */
function grudge(game, rec, names, rnd) {
  const here = new Set(names.map(norm));
  const facts = ((rec.last && rec.last.facts) || []).filter(f => here.has(norm(f.a)) && (!f.b || here.has(norm(f.b))));
  if (!facts.length) return null;
  const seen = seenAt(game), taken = new Set();
  const kinds = W.GRUDGE_ORDER.filter(k => facts.some(f => f.k === k && k !== 'won')).slice(0, 3);
  if (!kinds.length) kinds.push('won');
  // the top kind most of the time, now and then the next one (so a regular table doesn't hear the same fight)
  const r = rnd(), kind = kinds[r < 0.6 || kinds.length === 1 ? 0 : r < 0.88 || kinds.length === 2 ? 1 : 2];
  const f = facts.find(x => x.k === kind); if (!f) return null;
  const pick = pickFrom(W.GRUDGES.filter(g => g.k === kind && (!/\{n\}/.test(g.text) || f.n)), seen, taken, rnd);
  if (!pick) return null;
  return { text: fill(pick.x.text, { a: f.a, b: f.b || '', n: f.n || 0 }), key: pick.k };
}
function beginGame(game) {
  try {
    game.nightLog = { subs: [], skips: {} };
    game.ending = null;
    game.previously = null;
    const names = (game.players || []).filter(p => p.connected || (p.disconnectedAt && Date.now() - p.disconnectedAt < 45000)).map(p => p.name);
    const rec = names.length >= 2 ? matchTable(game, names) : null;
    game.nightTable = rec ? JSON.parse(JSON.stringify(rec)) : null;
    if (!rec) return;
    if (rec.last && Number(rec.last.at) > 0 && Date.now() - Number(rec.last.at) < RETURN_GAP_MS) return;   // (same night: no cold open)
    const rnd = rngFrom('prev|' + (game.gameId || game.code) + '|' + rec.id);
    const p = { at: Date.now(), ms: PREV_MS };
    if (rec.last) {
      p.winners = (rec.last.winners || []).slice(0, 4);
      // #3: in an Expert game last time's frame could be tonight's real answer: its words stay out of it
      if (rec.last.coton && !(game.settings && game.settings.expert)) p.coton = { ...rec.last.coton };
      p.grudge = grudge(game, rec, names, rnd);
    }
    // The table's anniversary: a year (or two…) since its first cartoon, shown once per year
    const years = rec.first ? Math.floor((Date.now() - rec.first.at) / (365.25 * 864e5)) : 0;
    if (years >= 1 && years > (rec.anniv || 0) && rec.first.image) { p.anniv = { years, image: rec.first.image, since: isoDay(rec.first.at) }; game.nightTable.annivNow = years; }
    if (!(p.winners && p.winners.length) && !p.anniv) return;
    p.keys = p.grudge ? [p.grudge.key] : [];
    game.previously = p;
    const opening = game.opening && game.opening.ms ? game.opening.ms : 0;   // the cold open takes the rating card's place
    if (game.timerEnd) game.timerEnd += Math.max(0, PREV_MS - opening);
  } catch (e) { console.error('cold open failed', e); game.previously = null; }
}

/* ── The ending ── */
function standingOf(game) { try { return game_().standing(game); } catch (e) { return null; } }
function ensureEnding(game) {
  if (game.ending && game.ending.gameId === (game.gameId || game.code)) return game.ending;
  try { game.ending = buildEnding(game); }
  catch (e) { console.error('ending failed', e); game.ending = { gameId: game.gameId || game.code, at: Date.now(), step: 0, stepAt: Date.now(), beats: [{ k: 'cast' }], done: true, cast: [], credits: {}, awards: [], ratings: [], broken: true }; }
  return game.ending;
}
function buildEnding(game) {
  const at = (game.scoresAt || Date.now()) + LEAD_MS, gid = game.gameId || game.code;
  const rnd = rngFrom('ending|' + gid);
  const X = facts(game), stand = standingOf(game);
  const C = candidates(game, X, stand);
  const ids = C.order;
  const gone = game.departed || {}, fixed = {};
  for (const [id, d] of Object.entries(gone)) if (d && d.credit && ids.includes(id)) fixed[id] = d.credit.trigger;
  const pick = assign(C.out, ids, fixed);
  const fam = !!(game.settings && game.settings.family);
  const seen = seenAt(game), taken = new Set(Object.values(gone).map(d => d && d.credit && d.credit.key).filter(Boolean));
  const rows = (game.ratingResult && game.ratingResult.rows) || {};
  const credits = {}, keys = [];
  // The credits roll from the bottom of the table up; the winner's comes last
  const roll = ids.slice().reverse();
  for (const id of roll) {
    const f = X.F[id], c = pick[id] || { t: 'quiet' }, r0 = rows[id];
    if (fixed[id]) {   // heading out: the credit they were shown when they left, read in absentia
      const d = gone[id].credit;
      if (d.key) keys.push(d.key);
      credits[id] = { trigger: d.trigger, role: d.role, text: d.text, key: d.key || null, freeze: d.freeze || freezeOf(game, f), absentia: true, blurb: null, rating: null };   // (cut 5: no rating line)
      void r0;
      continue;
    }
    let pool = (W.LINES[c.t] || []).filter(l => (!fam || !l.adult) && (!l.need || (l.need === 'second' && c.second)) && (!/\{other\}/.test(l.text) || c.other));
    if (!pool.length) pool = (W.LINES.quiet || []).filter(l => !fam || !l.adult);
    { const short = pool.filter(l => wordsIn(l.text) <= EPILOGUE_WORDS); if (short.length) pool = short; }
    const pk = pickFrom(pool, seen, taken, rnd);
    const text = pk ? fill(pk.x.text, { name: f.name, other: c.other || '', n: c.n || 0, digits: !!c.digits }) : '';
    if (pk) keys.push(pk.k);
    const r = rows[id];
    const blurb = r ? ((r.extra && r.extra.text) || (r.line && r.line.text) || null) : null;
    credits[id] = { trigger: c.t, role: W.ROLES[c.t] || 'The Extra', text, key: pk ? pk.k : null, freeze: freezeOf(game, f), blurb: null, rating: null };   // (cut 5: no rating line on the credits)
    void blurb;
  }
  const monkey = monkeyLine(game, X.F);
  const aw = awards(game, X, rnd);
  const beats = [];
  // R18 a sealed game: the standings, read from last place up (one name a beat), then the top two held together
  if (game.lateFrom) {
    const win = ((stand && stand.winners) || []).filter(id => ids.includes(id));
    const order = win.concat(ids.filter(id => !win.includes(id)));
    const topN = Math.min(order.length, Math.max(2, win.length));
    const score = (id) => X.F[id].score;
    for (let i = order.length - 1; i >= topN; i--) {
      const id = order[i];
      beats.push({ k: 'stand', id, place: order.filter(x => score(x) > score(id)).length + 1, tied: order.some(x => x !== id && score(x) === score(id)), ms: STAND_MS });
    }
    beats.push({ k: 'top', ids: order.slice(0, topN), ms: TOP_MS });
  }
  beats.push({ k: 'winner', ms: WINNER_MS });
  if (aw.length) beats.push({ k: 'awards', ms: AWARDS_MS });
  // cut 5: the credits, the cast list and Caption of the Night only after the night's last game (Last Call, or the
  // host's "Call it a night" at game over: callNight adds them then). Earlier games: the winner, the awards, the scores.
  const full = !!game.lastCall;
  if (full) { for (const id of roll) beats.push({ k: 'credit', id, ms: CREDIT_MS }); beats.push({ k: 'cast' }); }
  else beats.push({ k: 'final' });
  const remote = remoteChange(game, stand);
  const e = {
    gameId: gid, at, step: 0, stepAt: at, beats, done: false, full, credits, awards: aw, monkey, keys: full ? keys : [], creditKeys: keys, remote,
    cast: ids.map(id => ({ id, name: X.F[id].name, role: credits[id].role, absentia: !!credits[id].absentia })),
    scores: Object.fromEntries(ids.map(id => [id, X.F[id].score])),
    summary: summaryFacts(game, X, stand, pick, monkey),
    vs: vsOf(game),
    firstCartoon: firstCartoon(game),
  };
  return e;
}
// R10 the table vs. the cartoonist (blind laughs, kept by the round): tonight's score, and how it stands against
// this table's best night (kept with the table, to beat next time)
function vsOf(game) {
  const t = game.tvc || (game.record && game.record.table);
  if (!t || typeof t !== 'object') return null;
  const table = Number(t.table) || 0, cartoonist = Number(t.cartoonist) || 0;
  if (table + cartoonist < 1) return null;
  const best = game.nightTable && game.nightTable.vsBest;
  const better = (a, b) => !b || (a.table - a.cartoonist) > (b.table - b.cartoonist) || ((a.table - a.cartoonist) === (b.table - b.cartoonist) && a.table > b.table);
  const now = { table, cartoonist };
  return { table, cartoonist, record: !!best && better(now, best), best: best ? { table: best.table, cartoonist: best.cartoonist } : null };
}
// Who holds the Remote after tonight, and what the winner beat says about it
function remoteChange(game, stand) {
  const rec = game.nightTable;
  const won = ((stand && stand.winners) || []).map(id => ((game.players || []).find(p => p.id === id) || {}).name).filter(Boolean);
  if (!won.length) return null;
  const before = rec && rec.holder && rec.holder.length ? rec.holder.slice() : [];
  const kept = before.length && won.some(n => before.map(norm).includes(norm(n)));
  const same = kept && won.length === before.length && won.every(n => before.map(norm).includes(norm(n)));
  const h = listNames(before.map(firstWord));
  let line;
  if (!before.length) line = W.REMOTE.first.replace('{w}', listNames(won.map(firstWord)));
  else if (won.length > 1) line = kept ? W.REMOTE.jointKept : W.REMOTE.jointNew.replace('{h}', h);
  else line = same ? W.REMOTE.retained : W.REMOTE.handover.replace('{h}', h);
  const day = isoDay(Date.now());
  const tape = ((rec && rec.tape) || []).concat(won.map(n => ({ n, d: day }))).slice(-MAX_TAPE);
  return { before, after: won, line, kind: !before.length ? 'first' : same ? 'retained' : won.length > 1 ? 'joint' : 'handover', tape, streak: streakOf(tape) };
}
function firstCartoon(game) {
  const h = (game.history || [])[0];
  return h && h.cartoon ? { cartoonId: h.cartoon.id, image: h.cartoon.image } : null;
}
// The last game, in a few facts (names, not ids: the next room has new ids), for next time's grudge
function summaryFacts(game, X, stand, pick, monkey) {
  const { F } = X, out = [], nm = (id) => (F[id] ? F[id].name : null);
  const best = (pairs) => pairs.sort((a, b) => b[2] - a[2])[0];
  const steal = best(Object.values(F).flatMap(f => Object.entries(f.stoleFrom).map(([v, n]) => [f.id, v, n])));
  if (steal && nm(steal[1])) out.push({ k: 'robbed', a: nm(steal[0]), b: nm(steal[1]), n: steal[2] });
  const fool = best(Object.values(F).flatMap(f => Object.entries(f.victims).map(([v, n]) => [f.id, v, n])));
  if (fool && fool[2] >= 2 && nm(fool[1])) out.push({ k: 'fooled', a: nm(fool[0]), b: nm(fool[1]), n: fool[2] });
  if (stand && stand.tied && stand.tied.length >= 2) out.push({ k: 'tie', a: nm(stand.tied[0]), b: nm(stand.tied[1]) });
  if (monkey) out.push({ k: 'monkey', a: nm(monkey.ids[0]) });
  for (const [id, c] of Object.entries(pick)) {
    if (c.t === 'collapse') out.push({ k: 'collapse', a: nm(id) });
    if (c.t === 'comeback') out.push({ k: 'comeback', a: nm(id) });
  }
  const top = (key, min) => { const m = Math.max(0, ...Object.values(F).map(f => f[key] || 0)); const w = Object.values(F).filter(f => f[key] === m); return m >= min && w.length === 1 ? w[0] : null; };
  let t;
  if ((t = top('gotFooled', 3))) out.push({ k: 'gotFooled', a: t.name, n: t.gotFooled });
  for (const f of Object.values(F)) if (f.wrote >= 2 && f.fooled === 0) { out.push({ k: 'nobody', a: f.name }); break; }
  for (const f of Object.values(F)) if (f.bet >= 3 && f.found === 0) { out.push({ k: 'never', a: f.name }); break; }
  if ((t = top('found', 3))) out.push({ k: 'sharp', a: t.name, n: t.found });
  if ((t = top('framedMine', 1))) out.push({ k: 'framed', a: t.name });
  if ((t = top('blindClosed', 2))) out.push({ k: 'blind', a: t.name, n: t.blindClosed });
  if ((t = top('skips', 2))) out.push({ k: 'skips', a: t.name, n: t.skips });
  for (const [id, c] of Object.entries(pick)) if (c.t === 'lastSecond') { out.push({ k: 'lastSecond', a: nm(id) }); break; }
  const ps = Object.values(F), lo = Math.min(...ps.map(f => f.score)), hi = Math.max(...ps.map(f => f.score));
  const lasts = ps.filter(f => f.score === lo);
  if (ps.length >= 3 && lo < hi && lasts.length === 1) out.push({ k: 'last', a: lasts[0].name });
  if (stand && stand.winners && stand.winners.length === 1) out.push({ k: 'won', a: nm(stand.winners[0]) });
  return out.filter(f => f.a).slice(0, 16);
}
// The record every phone at the table saves (cc_tables), Caption of the Night included once it's chosen
function tableRecord(game) {
  const e = game.ending; if (!e) return null;
  const rec = game.nightTable, now = e.at;
  const names = (game.players || []).map(p => p.name).slice(0, 12);
  if (names.length < 2) return null;
  const rm = e.remote;
  let coton = null;
  const f = game.finale;
  if (f && f.winner) { const w = (f.entries || []).find(x => x.key === f.winner); if (w) coton = { caption: w.caption, image: w.image, writer: w.writerName, cartoonId: w.cartoonId || null }; }
  return {
    id: rec ? rec.id : crypto.createHash('sha1').update('table|' + (e.gameId || '') + '|' + names.join('|')).digest('base64url').slice(0, 12),
    at: now, names, games: (rec ? rec.games || 1 : 0) + 1,
    holder: rm ? rm.after : (rec ? rec.holder : []), tape: rm ? rm.tape : (rec ? rec.tape : []),
    first: rec && rec.first ? rec.first : (e.firstCartoon ? { at: now, ...e.firstCartoon } : undefined),
    anniv: rec ? Math.max(rec.anniv || 0, rec.annivNow || 0) : 0,
    vsBest: e.vs && (!e.vs.best || e.vs.record) ? { table: e.vs.table, cartoonist: e.vs.cartoonist } : (rec && rec.vsBest) || undefined,
    last: { at: now, winners: rm ? rm.after : [], coton, facts: e.summary || [] },
  };
}

/* cut 5: "Call it a night" (the host, at game over after a short ending): the credits, the cast list, then
   Caption of the Night, on every phone */
function callNight(game) {
  const g = game_();
  if (!(game.phase === 'scores' && g.isGameOver(game))) return { error: 'The game is still going' };
  const e = ensureEnding(game);
  if (!e || e.broken) return { error: 'That didn’t take. Try again.' };
  if (e.full) return { ok: true, noop: true };
  const roll = (e.cast || []).map(c => c.id).reverse();
  e.beats = roll.filter(id => e.credits[id]).map(id => ({ k: 'credit', id, ms: CREDIT_MS })).concat([{ k: 'cast' }]);
  e.full = true; e.night = true; e.keys = e.creditKeys || [];
  e.step = 0; e.at = e.stepAt = Date.now() + LEAD_MS; e.done = false; delete e.doneAt;
  game.nightCalled = true;
  return { ok: true };
}

/* Which beat is on screen at `now` (server clock) */
function beatNow(e, now) {
  let i = Math.max(0, Math.min(e.step || 0, e.beats.length - 1)), t = e.stepAt || e.at;
  while (i < e.beats.length - 1 && e.beats[i].ms && now >= t + e.beats[i].ms) { t += e.beats[i].ms; i++; }
  return { i, start: t };
}
// The dealer or host taps on: the next beat now (the cast list's tap ends it: Caption of the Night, or the final page)
function nextBeat(game, seen) {
  const e = game.ending;
  if (!e || e.done) return { ok: true, noop: true };
  const { i } = beatNow(e, Date.now());
  if (Number.isInteger(seen) && seen !== i) return { ok: true, noop: true };   // a tap meant for a beat that has already gone
  if (e.beats[i].k === 'final') { e.done = true; e.doneAt = Date.now(); return { ok: true, done: true }; }
  if (e.beats[i].k === 'cast') {
    e.done = true; e.doneAt = Date.now();
    try { const g = game_(); if (!game.finale) { const r = g.openFinale(game); if (r && r.error) { /* nothing framed tonight: the final page */ } } } catch (x) {}
    return { ok: true, done: true };
  }
  e.step = i + 1; e.stepAt = Date.now();
  return { ok: true };
}
// What a phone gets: the ending (it's the same for everyone), plus the table record to keep
function endingView(game) {
  const e = game.ending; if (!e) return null;
  const v = JSON.parse(JSON.stringify(e));
  delete v.summary; delete v.creditKeys;
  v.table = tableRecord(game);
  const rr = game.ratingResult;
  v.ratings = rr && !rr.none && Array.isArray(rr.order) ? rr.order.map(id => { const r = rr.rows[id]; return r ? { id, after: r.after, delta: r.delta, title: r.title || null, newTitle: r.newTitle || null, provisional: !!r.provisional } : null; }).filter(Boolean) : [];
  v.short = !!(rr && rr.short);
  return v;
}
function previouslyView(game) {
  if (!game.previously || game.round !== 1 || game.phase !== 'writing') return null;
  return JSON.parse(JSON.stringify(game.previously));
}
function reset(game) {
  game.ending = null; game.previously = null; game.nightLog = { subs: [], skips: {} }; game.lastCall = null; game.departed = {};
  game.players = (game.players || []).filter(p => !p.gone || p.connected);   // whoever headed out has left the building
  for (const p of game.players) delete p.gone;
}

/* ── R18 Sealed scores: from the first deal of the Late Edition until the final scoreboard ── */
function sealedNow(game) {
  if (!game.lateFrom || game.round < game.lateFrom || game.phase === 'lobby') return false;
  return !(game.phase === 'scores' && game_().isGameOver(game));
}
// Points scored since the seal (taken off the totals the phones see)
function sinceSeal(game) {
  const out = {};
  for (const h of game.history || []) if (h && h.round >= game.lateFrom) for (const [pid, pts] of Object.entries(h.roundScores || {})) out[pid] = (out[pid] || 0) + (pts || 0);
  return out;
}
const ANSWERED = ['answer', 'framing', 'scores'];
// Every phone's view, after game.js has made it: Last Call, and the seal
function decorateView(game, view, pid) {
  try {
    if (game.lastCall) {
      view.lastCall = { at: game.lastCall.at, laps: game.lastCall.laps, more: game.lastCall.more !== false };   // more: false = this trip was already the last (nothing added)
      // first to N doesn't know by itself that the next deal starts the Late Edition
      if (view.phase === 'scores' && !view.gameOver && !game.lateFrom && view.nextDealerId) view.nextLate = (((game.dealCount || {})[view.nextDealerId] || 0) + 1) >= game.lastCall.laps;
    }
    const gone = game.departed || {};
    if (Object.keys(gone).length) view.departed = Object.keys(gone);
    if (!sealedNow(game)) return view;
    const since = sinceSeal(game), mine = (game.roundScores || {})[pid] || 0;
    view.players = (view.players || []).map(p => ({ ...p, score: p.score - (since[p.id] || 0) }));
    view.sealed = { from: game.lateFrom, round: game.round, mine: ANSWERED.includes(game.phase) ? mine : null };
    if (game.phase === 'scores') {
      view.roundScores = { [pid]: mine };
      view.roundScoreDetails = { [pid]: ((game.roundScoreDetails || {})[pid] || []).map(x => ({ ...x })) };
      delete view.previousRank;
      if (view.lines) delete view.lines.stamp;   // (the round winner's stamp names who won the round, or who leads: sealed too)
      if (Array.isArray(view.history)) view.history = view.history.map(h => (h && h.round >= game.lateFrom ? { ...h, roundScores: { [pid]: (h.roundScores || {})[pid] || 0 }, roundScoreDetails: { [pid]: (h.roundScoreDetails || {})[pid] || [] } } : h));
    }
  } catch (e) { console.error('view decorate failed', e); }
  return view;
}

/* ── R28 Heading out: this player's credit now, from their play so far; their seat leaves the turn order ── */
function headOut(game, pid) {
  const g = game_();
  const p = (game.players || []).find(x => x.id === pid);
  if (!p) return { error: 'Player not in game' };
  if (game.phase === 'lobby') return { error: 'The game hasn’t started yet.' };
  if (game.phase === 'scores' && g.isGameOver(game)) return { error: 'The game is over.' };
  game.departed = game.departed || {};
  if (!game.departed[pid]) {
    const X = facts(game), C = candidates(game, X, null, true);
    const used = new Set(Object.values(game.departed).map(d => d && d.credit && d.credit.trigger));
    const list = (C.out[pid] || [{ t: 'quiet', score: 12 }]);
    const c = list.find(x => !used.has(x.t)) || list[0] || { t: 'quiet' };
    const fam = !!(game.settings && game.settings.family), rnd = rngFrom('out|' + (game.gameId || game.code) + '|' + pid);
    const taken = new Set(Object.values(game.departed).map(d => d && d.credit && d.credit.key).filter(Boolean));
    let pool = (W.LINES[c.t] || []).filter(l => (!fam || !l.adult) && !l.need && (!/\{other\}/.test(l.text) || c.other));
    if (!pool.length) pool = (W.LINES.quiet || []).filter(l => !fam || !l.adult);
    const pk = pickFrom(pool, seenAt(game), taken, rnd);
    const f = X.F[pid] || { name: p.name, caps: [] };
    game.departed[pid] = { at: Date.now(), round: game.round, credit: { trigger: c.t, role: W.ROLES[c.t] || 'The Extra', text: pk ? fill(pk.x.text, { name: p.name, other: c.other || '', n: c.n || 0, digits: !!c.digits }) : '', key: pk ? pk.k : null, freeze: freezeOf(game, f) } };
  }
  p.gone = true; p.connected = false; p.disconnectedAt = Date.now() - 60000;   // past the 45 s grace at once: nobody waits on them
  delete p.again;
  let hosting = '';
  if (game.hostId === pid) { const nh = game.players.find(x => x.connected && !x.gone); if (nh) { game.hostId = nh.id; hosting = ` ${firstWord(nh.name)} is hosting now.`; } }
  game.notice = { text: `${firstWord(p.name)} has left the building.${hosting}`, at: Date.now() };
  const d = game.departed[pid].credit;
  return { ok: true, credit: { name: p.name, text: d.text, role: d.role, key: d.key, freeze: d.freeze, round: game.departed[pid].round } };
}
// Back after heading out (the same seat, on a phone): they're in the game again, and get a credit at the end like anyone
function returned(game, pid) { const p = (game.players || []).find(x => x.id === pid); if (p && p.gone) { delete p.gone; if (game.departed) delete game.departed[pid]; } }

/* ── R30 Last Call: the next trip around the table is the last (the Late Edition, sealed), then the end ── */
function lastCall(game) {
  const g = game_();
  if (game.phase === 'lobby') return { error: 'The game hasn’t started yet.' };
  if (game.phase === 'scores' && g.isGameOver(game)) return { error: 'The game is over.' };
  if (game.lateFrom) return { error: game.round >= game.lateFrom ? 'This is already the last trip around the table.' : 'The last trip around the table is next already.' };
  if (game.lastCall) return { ok: true, noop: true };
  const here = (game.players || []).filter(p => g.isPresent(p));
  const deals = Math.max(1, ...(here.length ? here : game.players).map(p => (game.dealCount || {})[p.id] || 0));
  // The trip being played is finished; it adds a trip only to an open-ended game, never to one that was going to
  // end sooner ("everyone deals once" mid-trip: this trip is the last)
  const planned = g.lapsOf(game);
  const laps = planned ? Math.min(planned, deals + 1) : deals + 1;
  game.lastCall = { at: Date.now(), laps, more: laps > deals };
  return { ok: true };
}
// The room keeps the newest record (so the next game here needs nothing from the phones)
function keepTable(game) { try { const r = cleanTable(tableRecord(game)); if (r) game.lastTable = r; } catch (e) {} }

module.exports = {
  noteSubmit, noteSkip, beginGame, ensureEnding, nextBeat, beatNow, endingView, previouslyView, lobbyRemote, setTables, reset, keepTable,
  decorateView, headOut, returned, lastCall, callNight, sealedNow,
  // for tests
  facts, candidates, assign, monkeyRounds, monkeyLine, awards, fill, cleanTable, matchTable, tableRecord, tallyIn,
  WINNER_MS, AWARDS_MS, CREDIT_MS, PREV_MS,
};
