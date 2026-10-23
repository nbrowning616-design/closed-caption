// practice.js — Solo practice (Nick, Oct 21 2026; betting added Oct 23 2026: "it should be how people learn without
// playing a group"). One phone, six cartoons, a real round each: write your own fake; five captions go on the table
// (yours, the real one, three house fakes from the bank rated 4–5, so the real one is never outshone), one of them
// FACE-DOWN — usually a fake (a house fake or yours), the real one about as often as at the table (~1 round in 7,
// never twice in a row). Two chips: blind bets (1 or both, or sit it out), the face-down card turns over, then the
// last chip. Paid exactly like the game: blind 2 a chip, blind on the face-down real one 5 a chip (Double Down /
// Blind Double Down), late 1. No dealer, no steal, nobody to fool. No rating, nothing saved.
//
// Everything that would give the answer away stays here: the phone gets the cartoon to write on, then the open
// captions unlabeled (the face-down one's text only at the flip), and which was real only after the last chip.
const crypto = require('crypto');
const G = require('./game');

const ROUNDS = 6, FAKES = 3, REAL_DOWN = 0.15, PTS = { open: 2, closed: 5, late: 1 }, TTL_MS = 2 * 3600 * 1000, MAX_SESSIONS = 4000;
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
  const s = { at: Date.now(), deck, cards: cards.map(c => ({ id: c.id, image: c.image, title: c.title, real: c.correct })), i: 0, score: 0, points: 0, lastDown: false, stage: 'write', round: null };
  sessions.set(token, s);
  return { ok: true, token, total: s.cards.length, card: cardView(s), pts: PTS };
}

// Your fake is in: the table. One caption face-down (its text stays here until the flip), the rest open and
// unlabeled except which one is yours.
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
  const all = [{ text: mine, who: 'you' }, { text: c.real, who: 'real' }].concat(fakes.map((t, i) => ({ text: t, who: 'house', name: names[i] })));
  // The face-down one: the real caption about 1 round in 7 (never two in a row), otherwise one of the fakes
  const realDown = !s.lastDown && Math.random() < REAL_DOWN;
  const down = realDown ? all[1] : shuffle(all.filter(x => x.who !== 'real'))[0];
  s.lastDown = realDown;
  const open = shuffle(all.filter(x => x !== down));
  s.round = { open, down, blind: null, late: null };
  s.stage = 'blind';
  return { ok: true, captions: open.map(x => x.text), mine: open.findIndex(x => x.who === 'you'), downMine: down.who === 'you' };
}

const targetOk = (s, t) => t === 'closed' || (Number.isInteger(t) && t >= 0 && t < s.round.open.length);
const capAt = (s, t) => (t === 'closed' ? s.round.down : s.round.open[t]);

// Blind bets: 1 chip or both on any caption (the face-down one too), or sit it out. Then the face-down card turns over.
function bet(body) {
  const s = get(body && body.token);
  if (!s) return { error: 'That practice ended. Start a new one.', gone: true };
  if (s.stage !== 'blind' || !s.round) return { error: 'Not now.' };
  const pass = !!(body && body.pass);
  const t = body && body.target === 'closed' ? 'closed' : Number(body && body.target), n = Number(body && body.count);
  if (!pass && (!targetOk(s, t) || (n !== 1 && n !== 2))) return { error: 'That didn’t take. Try again.' };
  s.round.blind = pass ? { pass: true } : { target: t, count: n };
  const left = pass ? 1 : 2 - n;
  if (!left) return finish(s, { flipped: s.round.down.text });
  s.stage = 'late';
  return { ok: true, flipped: s.round.down.text, left };
}

// The last chip, after the flip: anywhere (on top of your first one too), or keep it
function late(body) {
  const s = get(body && body.token);
  if (!s) return { error: 'That practice ended. Start a new one.', gone: true };
  if (s.stage !== 'late' || !s.round) return { error: 'Not now.' };
  if (body && body.keep) { s.round.late = null; return finish(s, {}); }
  const t = body && body.target === 'closed' ? 'closed' : Number(body && body.target);
  if (!targetOk(s, t)) return { error: 'That didn’t take. Try again.' };
  s.round.late = { target: t, count: 1 };
  return finish(s, {});
}

// The answer: which was real, who wrote the rest, what you scored and why, then the next cartoon (or the end)
function finish(s, extra) {
  const r = s.round, lines = [];
  let pts = 0, found = false;
  const b = r.blind, l = r.late;
  if (b && !b.pass && capAt(s, b.target).who === 'real') {
    const per = b.target === 'closed' ? PTS.closed : PTS.open, both = b.count === 2;
    const why = b.target === 'closed' ? (both ? 'Blind Double Down' : 'Blind chip on the face-down one') : (both ? 'Double Down' : 'Blind chip on the real one');
    pts += per * b.count; lines.push({ pts: per * b.count, why }); found = true;
  }
  if (l && capAt(s, l.target).who === 'real') { pts += PTS.late; lines.push({ pts: PTS.late, why: 'Late chip on the real one' }); found = true; }
  if (found) s.score++;
  s.points += pts;
  const credit = (x) => (x.who === 'house' ? { house: x.name } : { who: x.who });
  const result = Object.assign({ ok: true, done: false }, extra, {
    answer: true, real: r.down.who === 'real' ? 'closed' : r.open.findIndex(x => x.who === 'real'),
    credits: r.open.map(credit), downCredit: credit(r.down), downText: r.down.text,
    blind: b, late: l, pts, lines, found, points: s.points, score: s.score, played: s.i + 1, total: s.cards.length,
  });
  s.i++; s.round = null; s.stage = 'write';
  result.done = s.i >= s.cards.length;
  result.next = result.done ? null : cardView(s);
  if (result.done) for (const [k, v] of sessions) if (v === s) sessions.delete(k);
  return result;
}

module.exports = { start, write, bet, late, ROUNDS, PTS };
