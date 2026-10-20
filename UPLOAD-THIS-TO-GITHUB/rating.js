// rating.js — the chess-style rating (server side). Pure functions: no sockets, no clock, no storage.
//
// Each phone keeps its own rating (localStorage) and reports it with the 'career' message. The server only
// does the arithmetic once per game, freezes the result into the game, and every phone applies its own row once.
//
// The math (Elo, many players):
//   Every pair of rated players at the table is one "match": the higher final score wins (1), equal is a draw (½).
//   Expected score E = 1 / (1 + 10^((Rother − Rme) / 400)), from the two ratings the phones reported at the start.
//   Change = round( K / (n − 1) × Σ (S − E) ) over the other n − 1 players. K = 48 for a player's first 3 games
//   (provisional), 24 after. So the most anyone can move in one game is K, however big the table.
//   A short game moves it less: K is scaled by the game's length (full from 8 rounds; 4 rounds = half).
//   Ratings stay within 100..3500.
//
// Who is rated: everyone who was seated when the game started — including anyone who left before the end, on
// the score they left with (leaving is resigning: you can't walk out on a loss). Their phone applies the result
// only if it comes back to the room before the next game. Late joiners are not rated that game (they missed rounds).
// Phones that never reported a rating count as 1200, provisional.
// Deterministic: the same snapshot and scores always give the same numbers (players in seat order, no randomness).
// The lines (verdicts.js) are picked with a seeded random, once, and frozen with the result.

const START = 1200, MIN = 100, MAX = 3500, PROVISIONAL_GAMES = 3;
const K_NEW = 48, K = 24;
const TITLES = [
  { at: 2000, name: 'Grandmaster' },
  { at: 1800, name: 'Senior Master' },
  { at: 1600, name: 'Master' },
  { at: 1400, name: 'Candidate' },
];
const titleOf = (r) => { for (const t of TITLES) if (r >= t.at) return t.name; return null; };
const titleRank = (r) => { const t = titleOf(r); return t ? TITLES.length - TITLES.findIndex(x => x.name === t) : 0; };
const clamp = (r) => Math.max(MIN, Math.min(MAX, Math.round(r)));
const bandOf = (r) => r < 1000 ? 'b0' : r < 1200 ? 'b1' : r < 1400 ? 'b2' : r < 1600 ? 'b3' : r < 1800 ? 'b4' : r < 2000 ? 'b5' : 'b6';

// What a phone may report
const validRating = (n) => Number.isInteger(n) && n >= MIN && n <= MAX;
const validGames = (n) => Number.isInteger(n) && n >= 0 && n <= 100000;
const LINE_KEY = /^[0-9a-z]{6}$/;
const MAX_SEEN = 1500;
function cleanSeenLines(list) {
  if (!Array.isArray(list)) return null;
  const out = [], have = new Set();
  for (const k of list.slice(-MAX_SEEN)) if (typeof k === 'string' && LINE_KEY.test(k) && !have.has(k)) { have.add(k); out.push(k); }
  return out;
}

// A short stable key for a line: FNV-1a over the text, 6 base-36 characters. Editing a line makes a new key.
function lineKey(text) {
  let h = 0x811c9dc5;
  const s = String(text).trim();
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ('000000' + h.toString(36)).slice(-6);
}

// Seeded random (mulberry32), seeded from a string
function rngFrom(seed) {
  let a = parseInt(lineKey(seed), 36) >>> 0 || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

let POOL = null;
function pool() {
  if (!POOL) { try { POOL = require('./public/verdicts.js'); } catch (e) { console.error('verdicts.js failed to load', e); POOL = {}; } }
  return POOL;
}
const linesOf = (kind) => (Array.isArray(pool()[kind]) ? pool()[kind] : []).filter(t => typeof t === 'string' && t.trim());

// How recently a list of phones saw each key: 0..1 (1 = just now); missing = never
function recency(seenLists) {
  const m = new Map();
  for (const list of seenLists) {
    if (!list || !list.length) continue;
    list.forEach((k, i) => { const v = (i + 1) / list.length; if (!(m.get(k) >= v)) m.set(k, v); });
  }
  return m;
}
// One line from a pool: never one already used at this table this game; of the rest, one these phones haven't
// seen (random); if they've seen them all, the one seen longest ago.
function pickLine(kind, seen, taken, rnd, name) {
  const all = linesOf(kind).map(t => ({ t, k: lineKey(t) }));
  if (!all.length) return null;
  let cand = all.filter(x => !taken.has(x.k));
  if (!cand.length) cand = all;
  const fresh = cand.filter(x => !seen.has(x.k));
  let pick;
  if (fresh.length) pick = fresh[Math.floor(rnd() * fresh.length)];
  else { const lo = Math.min(...cand.map(x => seen.get(x.k))); const old = cand.filter(x => seen.get(x.k) === lo); pick = old[Math.floor(rnd() * old.length)]; }
  taken.add(pick.k);
  return { text: pick.t.split('{name}').join(name || 'You'), key: pick.k };
}

// The table as it sits down: who is rated, and their rating going in
function snapshot(players) {
  const out = {};
  for (const p of players) {
    const unrated = !validRating(p.rating);
    out[p.id] = { r: unrated ? START : p.rating, g: unrated ? 0 : (validGames(p.games) ? p.games : 0), name: p.name };
  }
  return out;
}
const provisional = (s) => s.g < PROVISIONAL_GAMES;

// The opening card: "Ranked like chess, but judged by friends." + a line, the table, the favorite and the long shot
function opening(players, snap, seed) {
  const rnd = rngFrom('open|' + seed), taken = new Set();
  const here = players.filter(p => snap[p.id]);
  const seen = recency(here.map(p => p.seenLines));
  const anyName = () => here.length ? here[Math.floor(rnd() * here.length)].name : '';
  const table = here.map(p => ({ id: p.id, name: p.name, rating: snap[p.id].r, provisional: provisional(snap[p.id]), title: provisional(snap[p.id]) ? null : titleOf(snap[p.id].r) }));
  const settled = table.filter(t => !t.provisional).sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  const o = { table, opener: pickLine('opener', seen, taken, rnd, anyName()) };
  if (settled.length < 2) o.newTable = pickLine('newTable', seen, taken, rnd, anyName());
  else {
    const fav = settled[0], dog = settled[settled.length - 1];
    if (fav.rating - dog.rating < 100) o.evenTable = pickLine('evenTable', seen, taken, rnd, anyName());
    else {
      o.favorite = { id: fav.id, name: fav.name, rating: fav.rating, line: pickLine('favorite', seen, taken, rnd, fav.name) };
      o.underdog = { id: dog.id, name: dog.name, rating: dog.rating, line: pickLine('underdog', seen, taken, rnd, dog.name) };
    }
  }
  o.keys = [o.opener, o.newTable, o.evenTable, o.favorite && o.favorite.line, o.underdog && o.underdog.line].filter(Boolean).map(x => x.key);
  return o;
}

// Game over: everyone's change, title, and line. scores: { id: finalScore }. players: the current seats (for seen lists).
// scale (0..1): a short game moves the rating less (game.js: full amount from 8 rounds, in proportion below).
function settle(snap, scores, players, seed, favoriteId, scale) {
  const ids = Object.keys(snap).filter(id => typeof scores[id] === 'number');
  const n = ids.length;
  const rows = {};
  const sc = typeof scale === 'number' && scale > 0 && scale < 1 ? scale : 1;
  for (const id of ids) {
    const me = snap[id], k = (provisional(me) ? K_NEW : K) * sc;
    let sum = 0;
    for (const o of ids) {
      if (o === id) continue;
      const S = scores[id] > scores[o] ? 1 : scores[id] === scores[o] ? 0.5 : 0;
      const E = 1 / (1 + Math.pow(10, (snap[o].r - me.r) / 400));
      sum += S - E;
    }
    const delta = n > 1 ? Math.round(k / (n - 1) * sum) : 0;
    const after = clamp(me.r + delta);
    // Titles are shown once the first three games are played: finishing the third can bring a 'new title'
    const shownBefore = me.g >= PROVISIONAL_GAMES ? titleRank(me.r) : 0, settledAfter = me.g + 1 >= PROVISIONAL_GAMES;
    const title = settledAfter ? titleOf(after) : null;
    rows[id] = { before: me.r, after, delta: after - me.r, provisional: provisional(me), games: me.g + 1, title, newTitle: title && titleRank(after) > shownBefore ? title : null };
  }
  // The lines: each player's from their band (or the provisional pool), never one their phone has seen,
  // never two the same at this table. Add-ons: a new title; an upset (the winner was rated 100+ below the
  // table's best); the favorite who didn't win.
  const rnd = rngFrom('verdict|' + seed), taken = new Set();
  const byId = new Map(players.map(p => [p.id, p]));
  const top = n ? Math.max(...ids.map(id => scores[id])) : 0;
  const best = n ? Math.max(...ids.map(id => snap[id].r)) : 0;
  const order = ids.slice().sort((a, b) => scores[b] - scores[a] || snap[b].r - snap[a].r || (a < b ? -1 : 1));
  for (const id of order) {
    const r = rows[id], p = byId.get(id), name = (p && p.name) || snap[id].name;
    const seen = recency([p && p.seenLines]);
    const kind = r.provisional ? 'provisional' : bandOf(r.after);
    r.line = n > 1 ? pickLine(kind, seen, taken, rnd, name) : null;
    let extra = null;
    if (n > 1 && r.newTitle) extra = 'newTitle';
    else if (n > 1 && scores[id] === top && best - snap[id].r >= 100) extra = 'upset';
    else if (n > 1 && id === favoriteId && scores[id] < top) extra = 'favoriteLost';
    r.extraKind = extra;
    r.extra = extra ? pickLine(extra, seen, taken, rnd, name) : null;
  }
  const keys = [];
  for (const id of order) { const r = rows[id]; if (r.line) keys.push(r.line.key); if (r.extra) keys.push(r.extra.key); }
  return { rows, order, keys };
}

module.exports = { START, MIN, MAX, K, K_NEW, PROVISIONAL_GAMES, TITLES, titleOf, bandOf, lineKey, validRating, validGames, cleanSeenLines, snapshot, opening, settle, MAX_SEEN };
