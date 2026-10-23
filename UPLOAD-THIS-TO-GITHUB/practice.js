// practice.js — Solo practice (Nick, Oct 21 2026): one phone, six cartoons. For each: write your own fake, then
// find the real caption among five (yours, the real one, three house fakes from the bank rated 4–5, so the real one
// is the best or tied, never outshone). Score = how often you found it. No rating, nothing saved.
//
// Everything that would give the answer away stays here: the phone gets the cartoon to write on, then the five
// captions unlabeled and shuffled, and only after its guess which one was real and who wrote the rest.
const crypto = require('crypto');
const G = require('./game');

const ROUNDS = 6, FAKES = 3, TTL_MS = 2 * 3600 * 1000, MAX_SESSIONS = 4000;
const sessions = new Map();   // token -> session

function sweep() {
  const now = Date.now();
  for (const [k, s] of sessions) if (now - s.at > TTL_MS) sessions.delete(k);
  while (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
}
setInterval(sweep, 10 * 60000).unref();

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const deckOf = (d) => (d === 'family' ? { family: true, spicy: false } : d === 'everything' ? { family: false, spicy: true } : { family: false, spicy: false });
const bankOf = (id) => (((G.CARD_META_OF(id) || {}).decoys) || []).filter(d => d && typeof d.t === 'string' && d.t.trim());

// Six cartoons this phone hasn't seen (seen: oldest first); if the deck runs short, the ones seen longest ago
function pickCards(deck, seen) {
  const pool = G.liveCartoons(deckOf(deck)).filter(c => bankOf(c.id).length >= FAKES);
  const seenAt = new Map(); (Array.isArray(seen) ? seen : []).slice(-400).forEach((id, i) => seenAt.set(Number(id), i));
  const fresh = shuffle(pool.filter(c => !seenAt.has(c.id)));
  const old = pool.filter(c => seenAt.has(c.id)).sort((a, b) => seenAt.get(a.id) - seenAt.get(b.id));
  return fresh.concat(old).slice(0, ROUNDS);
}
// The three house fakes: rated 4–5 first (shuffled within a rating), then the best of the rest; never one that
// nearly matches the player's own caption (two of the same would be odd)
function pickFakes(id, mine) {
  const ranked = shuffle(bankOf(id)).sort((a, b) => (Number(b.s) || 0) - (Number(a.s) || 0));
  const out = [];
  for (const d of ranked) {
    if (out.length >= FAKES) break;
    const t = G.polish(d.t).text;   // (tidied like every caption at the table, so none stands out)
    if (t && !G.nearlySame(t, mine) && !out.some(o => G.nearlySame(o, t))) out.push(t);
  }
  return out;
}
const cardView = (s) => { const c = s.cards[s.i]; return c ? { n: s.i + 1, total: s.cards.length, id: c.id, image: c.image, title: c.title } : null; };
const get = (token) => { const s = typeof token === 'string' ? sessions.get(token) : null; if (s) s.at = Date.now(); return s || null; };

function start(body) {
  sweep();
  const deck = ['family', 'standard', 'everything'].includes(body && body.deck) ? body.deck : 'standard';
  const cards = pickCards(deck, body && body.seen);
  if (!cards.length) return { error: 'No cartoons in this deck yet.' };
  const token = crypto.randomBytes(18).toString('base64url');
  const s = { at: Date.now(), deck, cards: cards.map(c => ({ id: c.id, image: c.image, title: c.title, real: c.correct })), i: 0, score: 0, stage: 'write', round: null };
  sessions.set(token, s);
  return { ok: true, token, total: s.cards.length, card: cardView(s) };
}

// Your fake is in: the five captions, shuffled, nothing saying which is which (except which one is yours)
function write(body) {
  const s = get(body && body.token);
  if (!s) return { error: 'That practice ended. Start a new one.', gone: true };
  if (s.stage !== 'write') return { error: 'Already in.' };
  const c = s.cards[s.i], raw = String((body && body.caption) || '');
  if (raw.length > 260) return { error: 'Too long. The real ones are short.' };
  const p = G.polish(raw);
  if (!p.text || !/[\p{L}\p{N}]/u.test(p.text)) return { error: 'Write something first.' };
  if (p.text.length > 220) return { error: 'Too long. The real ones are short.' };
  const mode = body.mode === 'fix' || body.mode === 'keep' ? body.mode : 'check';
  if (mode === 'check' && p.typos.length) return { ok: true, check: { polished: p.text, fixed: p.fixed, typos: p.typos } };
  const mine = mode === 'keep' ? p.text : p.fixed;
  if (G.tooCloseToReal(mine, c.real)) return { error: 'Too close to the real one. Write your own.' };
  const fakes = pickFakes(c.id, mine), names = shuffle(G.HOUSE_CAST).slice(0, fakes.length);
  const list = shuffle([{ text: mine, who: 'you' }, { text: c.real, who: 'real' }].concat(fakes.map((t, i) => ({ text: t, who: 'house', name: names[i] }))));
  s.round = list; s.stage = 'guess';
  return { ok: true, captions: list.map(x => x.text), mine: list.findIndex(x => x.who === 'you') };
}

// The guess: right or not, which one was real, who wrote the rest, and the next cartoon (or the end)
function guess(body) {
  const s = get(body && body.token);
  if (!s) return { error: 'That practice ended. Start a new one.', gone: true };
  if (s.stage !== 'guess' || !s.round) return { error: 'Write yours first.' };
  const k = Number(body.pick), list = s.round;
  if (!Number.isInteger(k) || k < 0 || k >= list.length || list[k].who === 'you') return { error: 'Pick one of the other four.' };
  const real = list.findIndex(x => x.who === 'real'), right = k === real;
  if (right) s.score++;
  const result = { ok: true, right, pick: k, real, credits: list.map(x => (x.who === 'house' ? { house: x.name } : { who: x.who })), score: s.score, played: s.i + 1, total: s.cards.length };
  s.i++; s.round = null; s.stage = 'write';
  result.done = s.i >= s.cards.length;
  result.next = result.done ? null : cardView(s);
  if (result.done) sessions.delete(body.token);
  return result;
}

module.exports = { start, write, guess, ROUNDS };
