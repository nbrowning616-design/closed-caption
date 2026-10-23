// server.js — Express + WebSocket server for Closed Caption
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');
const G = require('./game');
const Stats = require('./stats');   // #41: a private tally (counts only)
const Night = require('./night');   // the end of the night: the ending, the Remote, the monkey, "Previously on"
const { PHASES } = G;

// Address friends on the same Wi-Fi should type in (only used when running on a home computer)
function lanUrl() {
  const port = process.env.PORT || 3000;
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254')) return `http://${i.address}:${port}`;
    }
  }
  return null;
}
const LAN_URL = lanUrl();

const app = express();
// Smaller downloads on a weak party signal (gzip), when the helper is installed
try { app.use(require('compression')()); } catch (e) { console.warn('  (compression not installed — serving uncompressed)'); }
const BOOT = crypto.randomBytes(4).toString('hex');   // changes on every restart; phones use it to tell a restart from a closed room
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 32 * 1024 });   // phone → server messages are small: a full Gallery sync, a restore or a voice offer fits

// Build id: phones compare it and refresh themselves after an update
const INDEX_PATH = path.join(__dirname, 'public', 'index.html');
const INDEX_HTML = fs.readFileSync(INDEX_PATH, 'utf8');
// (a helper that isn't there yet just counts as empty, so a missing file never stops the server)
const readOr = (f) => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { return ''; } };
const BUILD = crypto.createHash('sha1').update(INDEX_HTML + ['game.js', 'store.js'].concat(fs.readdirSync(path.join(__dirname, 'public')).filter(f => f.endsWith('.js')).sort().map(f => 'public/' + f)).map(readOr).join('')).digest('hex').slice(0, 10);   // every public/*.js counts, so no helper is ever left stale
// __V__ busts the phone's cache for the helper scripts after an update
const PAGE = INDEX_HTML.replace('__BUILD__', BUILD).split('__V__').join(BUILD);
app.get('/', (req, res) => { res.set('Cache-Control', 'no-store'); res.type('html').send(PAGE); });
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/healthz', (req, res) => res.send('ok'));
// Cartoon drop-box for the daily ChatGPT batch: the browser hands a finished picture to /intake.html, which posts it
// here; the batch session (with the key) collects it. Pictures only, in memory, gone after 6 hours. Key: sha256 below.
const INTAKE_HASH = '79b119f2571078130ab0bc5d1ef2d2b7a590d274017c29cb9332d8afeec2af69';
const intake = new Map();   // name -> { buf, type, at }
const intakeOk = (k) => typeof k === 'string' && k.length < 100 && crypto.createHash('sha256').update(k).digest('hex') === INTAKE_HASH;
const intakeSweep = () => { const now = Date.now(); for (const [n, v] of intake) if (now - v.at > 6 * 3600 * 1000) intake.delete(n); };
app.post('/intake', express.json({ limit: '6mb' }), (req, res) => {
  const { k, name, data } = req.body || {};
  if (!intakeOk(k)) return res.status(403).end();
  const m = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(String(data || ''));
  const n = String(name || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  if (!m || !n) return res.status(400).end();
  intakeSweep();
  if (intake.size >= 60) return res.status(507).end();
  intake.set(n, { buf: Buffer.from(m[3], 'base64'), type: m[1], at: Date.now() });
  res.set('Cache-Control', 'no-store').json({ ok: true, name: n, bytes: intake.get(n).buf.length });
});
app.get('/intake/list', (req, res) => { if (!intakeOk(req.query.k)) return res.status(403).end(); intakeSweep(); res.set('Cache-Control', 'no-store').json([...intake].map(([n, v]) => ({ name: n, type: v.type, bytes: v.buf.length }))); });
app.get('/intake/get', (req, res) => { if (!intakeOk(req.query.k)) return res.status(403).end(); const v = intake.get(String(req.query.name || '')); if (!v) return res.status(404).end(); res.set('Cache-Control', 'no-store').type(v.type).send(v.buf); });
app.get('/intake/clear', (req, res) => { if (!intakeOk(req.query.k)) return res.status(403).end(); intake.delete(String(req.query.name || '')); res.status(204).end(); });
// Is anyone playing right now? Updates are only pushed when this says no phones are connected.
// Counts only — no names, codes or captions.
// The phone's name, kept as a year-long cookie set by the server: iPhones wipe a site's own storage after
// 7 days without a visit, but keep this. Only the name the player typed; nothing else.
app.get('/remember', (req, res) => {
  const n = String(req.query.name || '').replace(/\s+/g, ' ').trim().slice(0, 12);
  if (n) res.cookie('cc_name', n, { maxAge: 365 * 24 * 3600 * 1000, sameSite: 'lax', path: '/' });
  res.set('Cache-Control', 'no-store').status(204).end();
});
app.get('/status', (req, res) => {
  const live = Object.values(clients).filter(c => c && c.ws && c.ws.readyState === 1);
  const codes = new Set(live.map(c => c.gameCode));
  const inGame = [...codes].filter(c => games[c] && games[c].phase !== 'lobby').length;
  res.set('Cache-Control', 'no-store').json({ phones: live.length, rooms: codes.size, gamesInProgress: inGame });
});
// #23: an invite link (?join=CODE) asks whose table it is, so the page can say "Join Nick's table — 3 here".
// Only the host's first name and a head count; a closed or unknown code is just { open: false }.
// Unknown codes count against the same wrong-code limit as joining (no guessing rooms through here).
app.get('/room/:code', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const ip = clientIp(req);   // (#2: the first public x-forwarded-for entry, like everywhere else)
  const code = String(req.params.code || '').toUpperCase();
  if (blocked(ip)) return res.status(429).json({ open: false, wait: true });
  const g = /^[A-Z]{4}$/.test(code) ? games[code] : null;
  if (!g) { wrongCode(ip); return res.json({ open: false }); }
  const host = g.players.find(p => p.id === g.hostId) || g.players.find(p => p.connected) || g.players[0];
  const here = g.players.filter(p => p.connected).length;
  res.json({ open: true, host: host ? (String(host.name).trim().split(/\s+/)[0] || '') : '', here, started: g.phase !== PHASES.LOBBY, full: g.players.length >= G.MAX_PLAYERS, locked: !!g.locked });
});
// #41: the private tally, for Nick only: /stats?k=<STATS_KEY>. Without the key (or with no STATS_KEY set) it doesn't
// exist (404). Counts only: no names, captions, room codes or addresses.
app.get('/stats', (req, res, next) => {
  const want = process.env.STATS_KEY || '', k = typeof req.query.k === 'string' ? req.query.k : '';
  const a = crypto.createHash('sha256').update(want).digest(), b = crypto.createHash('sha256').update(k).digest();
  if (!want || !crypto.timingSafeEqual(a, b)) return next();   // (falls through to the plain 404)
  res.set('Cache-Control', 'no-store').set('X-Robots-Tag', 'noindex').json(Stats.report());
});
// Solo practice (practice.js): one phone, six cartoons. The real captions stay here until each guess is in.
const Practice = require('./practice');
const pracHits = new Map();   // ip -> [times] of new practice sessions (30 a minute is plenty for a whole Wi-Fi)
setInterval(() => { const now = Date.now(); for (const [ip, l] of pracHits) if (!l.length || now - l[l.length - 1] > 60000) pracHits.delete(ip); }, 60000).unref();
const pracJson = express.json({ limit: '8kb' });
const pracSend = (res, r) => res.set('Cache-Control', 'no-store').status(r && r.error ? (r.gone ? 410 : 400) : 200).json(r || { error: 'That didn’t take. Try again.' });
app.post('/practice/start', pracJson, (req, res) => {
  const ip = clientIp(req), l = pracHits.get(ip) || [], now = Date.now();
  while (l.length && now - l[0] > 60000) l.shift();
  if (l.length >= 30) return pracSend(res, { error: TOO_MANY });
  l.push(now); pracHits.set(ip, l);
  try { pracSend(res, Practice.start(req.body || {})); } catch (e) { console.error('practice start', e); pracSend(res, null); }
});
app.post('/practice/write', pracJson, (req, res) => { try { pracSend(res, Practice.write(req.body || {})); } catch (e) { console.error('practice write', e); pracSend(res, null); } });
app.post('/practice/guess', pracJson, (req, res) => { try { pracSend(res, Practice.guess(req.body || {})); } catch (e) { console.error('practice guess', e); pracSend(res, null); } });
app.use('/images', (req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });   // the cartoons are public pictures: lets the drawing session fetch one to have it redrawn tall
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

const games = {};    // code -> game
const clients = {};  // playerId -> { ws, gameCode }

function broadcast(code, sealTo = null) {
  const game = games[code];
  if (!game) return;
  // #6: every phone keeps a sealed copy of the room, refreshed on each new stage (or every 20 s), to hand back after a restart.
  // #2: and whenever a caption, a bet, the steal or a frame pick lands, so a restart never loses the last one.
  const tag = game.phase + '|' + game.round + '|' + (game.reel ? game.reel.step : '') + '|' + game.players.length + '|' + (game.roundFrames || []).length + '|' + (game.finale ? (game.finale.winner || 'v') + Object.keys(game.finale.votes || {}).length : '')
    + '|' + (game.submissions || []).length + '|' + (game.bets || []).length + '|' + Object.keys(game.blind || {}).length + '|' + (game.dropAt || '') + '|' + Object.keys(game.lateBlind || {}).length + (game.lateDropAt || '') + '|' + (game.steal ? (game.steal.victimId ? 's' : 'p') : '') + '|' + Object.values(game.framePicks || {}).reduce((n, l) => n + (l || []).length, 0) + '|' + Object.keys(game.calls || {}).length + '|' + (game.reel && game.reel.paused ? 'h' : '') + (game.flipHold ? 'h' : '') + '|' + (game.actN || 0)
    + '|' + (game.ending ? game.ending.step + (game.ending.done ? 'd' : '') : '') + '|' + (game.lastCall ? 'lc' : '') + Object.keys(game.departed || {}).length + '|' + (game.readStep || '');
  // #41: a game reached its final scoreboard (counted once per game)
  if (game.phase === PHASES.SCORES && game.gameNo && game._statDone !== game.gameNo && G.isGameOver(game)) { game._statDone = game.gameNo; Stats.finished(); }
  // The end of the night is worked out once, when the final scoreboard lands (night.js)
  const over = game.phase === PHASES.SCORES && G.isGameOver(game);
  if (over) Night.ensureEnding(game);
  const ending = over ? Night.endingView(game) : null;
  const prev = game.phase === PHASES.WRITING ? Night.previouslyView(game) : null;
  const remote = game.phase === PHASES.LOBBY ? Night.lobbyRemote(game) : null;
  let seal = null;
  if (tag !== game._sealTag || Date.now() - (game._sealAt || 0) > 20000) { try { seal = G.sealGame(game); game._sealTag = tag; game._sealAt = Date.now(); } catch (e) { console.error('seal failed', e); } }
  for (const p of game.players) {
    const c = clients[p.id];
    if (c && c.ws.readyState === 1) {
      const view = G.getPlayerView(game, p.id);
      view.lanUrl = LAN_URL;
      view.build = BUILD;
      if (game.phase === PHASES.SCORES) view.wantAgain = game.players.filter(x => x.again).map(x => x.id);   // #35: who's in for another
      if (ending) view.ending = view.newcomer ? { ...ending, ratings: [], remote: null, newcomer: true } : ending;   // cut 8: a first game's ending has no rating or Remote talk
      if (prev) view.previously = prev;
      if (remote) view.remote = remote;
      Night.decorateView(game, view, p.id);   // R30 Last Call; R18 the Late Edition's sealed scores
      c.ws.send(JSON.stringify({ type: 'state', data: view }));
      if (seal) c.ws.send(JSON.stringify({ type: 'seal', code, boot: BOOT, data: seal }));
      else if (sealTo === p.id) { try { c.ws.send(JSON.stringify({ type: 'seal', code, boot: BOOT, data: G.sealGame(game) })); } catch (e) {} }   // #2: a phone back in its seat gets a fresh copy at once
    }
  }
  syncAuto(code);
}

/* #6: the flip and the reveal reel move on by themselves. The game says when (game.flipDue, game.reel.dueAt; null
   while the dealer holds it); every broadcast re-arms one timer per room to match, so a hold, a tap back, a frame
   being hung or a restart all just move the time. */
const autoT = new Map();   // code -> { key, t }
function syncAuto(code) {
  const g = games[code], cur = autoT.get(code);
  let key = null, at = 0;
  if (g && g.phase === PHASES.REVEAL && g.flipDue && !g.flipHold) { key = `${g.round}|flip|${g.flipDue}`; at = g.flipDue; }
  else if (g && g.phase === PHASES.ANSWER && g.reel && g.reel.dueAt && !g.reel.paused) { key = `${g.round}|reel|${g.reel.step}|${g.reel.dueAt}`; at = g.reel.dueAt; }
  if (cur && cur.key === key) return;
  if (cur) { clearTimeout(cur.t); autoT.delete(code); }
  if (!key) return;
  autoT.set(code, { key, t: setTimeout(() => {
    const x = games[code], c2 = autoT.get(code);
    if (!c2 || c2.key !== key) return;
    autoT.delete(code);
    if (!x) return;
    try {
      if (x.phase === PHASES.REVEAL && x.flipDue && !x.flipHold && `${x.round}|flip|${x.flipDue}` === key) { G.moveFromReveal(x); broadcast(code); autoAdvanceBets(code); }
      else if (x.phase === PHASES.ANSWER && x.reel && !x.reel.paused && `${x.round}|reel|${x.reel.step}|${x.reel.dueAt}` === key) { G.reelStep(x, 'next'); broadcast(code); }
    } catch (e) { console.error('auto step failed', code, e); }
  }, Math.max(0, at - Date.now())) });
}

// Run fn later, but only if the game is still where we left it
function later(code, ms, expectPhase, fn) {
  const g0 = games[code];
  if (!g0) return;
  const token = g0.timerToken, round = g0.round;
  setTimeout(() => {
    const g = games[code];
    if (!g || g.phase !== expectPhase || g.round !== round || g.timerToken !== token) return;
    try { fn(g); broadcast(code); } catch (e) { console.error('delayed step failed', code, expectPhase, e); }   // one bad step never takes down every game
  }, ms);
}
// Last line of defence: log and keep serving rather than dropping every room on the site
process.on('uncaughtException', (e) => { console.error('uncaught', e); if (e && (e.code === 'EADDRINUSE' || e.code === 'EACCES')) process.exit(1); });   // can't open the port: quit so the host restarts us
process.on('unhandledRejection', (e) => console.error('unhandled rejection', e));

// Writing ends on its own when the clock runs out (with a short grace for phones auto-sending drafts)
function scheduleWritingEnd(code) {
  const game = games[code];
  if (!game || game.phase !== PHASES.WRITING) return;
  if (!game.timerEnd) return;   // [settings] no timer: writing ends when everyone's in, or the dealer/host ends it
  later(code, Math.max(0, game.timerEnd - Date.now()) + 2000, PHASES.WRITING, (g) => {
    // #34: one caption plus the real one gives the answer away: 30 s more, up to twice, then on regardless
    if (g.submissions.length === 1 && (g.oneCapExt || 0) < 2 && g.players.filter(G.isPresent).length >= 2) {
      g.oneCapExt = (g.oneCapExt || 0) + 1; g.timerEnd = Date.now() + 30000; g.timerToken++;
      g.notice = { text: G.pickLine(g, 'write.oneCaption') || 'One caption isn’t a game. Thirty more seconds.', at: Date.now() };
      return setTimeout(() => scheduleWritingEnd(code), 0);
    }
    g.oneCapExt = 0;
    endWriting(g);
  });
}
function endWriting(g) {
  const r = G.finishWriting(g);
  if (r.empty) {
    // Nobody wrote anything: same round, fresh cartoon, same dealer
    G.startRound(g, { sameRound: true });
    setTimeout(() => scheduleWritingEnd(g.code), 0);
  }
}

// When the last chip of a betting stage lands, move on by itself after a beat
function autoAdvanceBets(code) {
  const g = games[code];
  if (!g) return;
  if (g.phase === PHASES.FIRST_BETS) return scheduleBlind(code);
  if (g.phase === PHASES.SECOND_BETS) return scheduleLate(code);
}
/* Cut 3 The last chips, everyone at once: the same shape as the blind bets. Everyone in -> a short beat -> one
   shared drop; or the 30 s clock runs out first. Then the table has a look and the answer comes. */
const lateT = new Map();   // code -> timeout
function scheduleLate(code) {
  const g = games[code];
  clearTimeout(lateT.get(code)); lateT.delete(code);
  if (!g || g.phase !== PHASES.SECOND_BETS || g.lateDropAt) return;
  const allIn = G.pendingBetters(g).length === 0;
  const at = allIn ? Date.now() + G.ALL_IN_BEAT_MS : (g.lateEnd || Date.now() + G.LATE_BET_MS);
  const round = g.round;
  lateT.set(code, setTimeout(() => {
    lateT.delete(code);
    const x = games[code];
    if (!x || x.phase !== PHASES.SECOND_BETS || x.round !== round || x.lateDropAt) return;
    if (allIn ? G.pendingBetters(x).length > 0 : Date.now() < (x.lateEnd || 0) - 50) return scheduleLate(code);   // someone took theirs back / the clock moved
    lateDropNow(code);
  }, Math.max(0, at - Date.now())));
}
function lateDropNow(code) {
  const g = games[code];
  if (!g || g.phase !== PHASES.SECOND_BETS) return;
  clearTimeout(lateT.get(code)); lateT.delete(code);
  try { G.dropLate(g); } catch (e) { console.error('late drop failed', code, e); }
  broadcast(code);
  later(code, Math.max(0, g.lateDropAt + G.DROP_HOLD_MS - Date.now()), PHASES.SECOND_BETS, G.moveFromSecondBets);
}
/* #7 Blind bets, everyone at once: one timer per room. Everyone in -> a short beat (the last one can still take
   theirs back) -> every chip drops onto the table together. Or the clock runs out first. */
const blindT = new Map();   // code -> timeout
function scheduleBlind(code) {
  const g = games[code];
  clearTimeout(blindT.get(code)); blindT.delete(code);
  if (!g || g.phase !== PHASES.FIRST_BETS || g.dropAt) return;
  const allIn = G.pendingBetters(g).length === 0;
  const at = allIn ? Date.now() + G.ALL_IN_BEAT_MS : g.blindEnd;
  if (!at) return;   // a no-timer room: the dealer or host drops the chips
  const round = g.round;
  blindT.set(code, setTimeout(() => {
    blindT.delete(code);
    const x = games[code];
    if (!x || x.phase !== PHASES.FIRST_BETS || x.round !== round || x.dropAt) return;
    if (allIn ? G.pendingBetters(x).length > 0 : Date.now() < (x.blindEnd || 0) - 50) return scheduleBlind(code);   // someone took theirs back / the clock moved
    dropNow(code);
  }, Math.max(0, at - Date.now())));
}
// The chips drop (every phone, one shared moment), the table gets a look, then the steal or the flip
function dropNow(code) {
  const g = games[code];
  if (!g || g.phase !== PHASES.FIRST_BETS) return;
  clearTimeout(blindT.get(code)); blindT.delete(code);
  try { G.dropBlind(g); } catch (e) { console.error('drop failed', code, e); }
  broadcast(code);
  later(code, Math.max(0, g.dropAt + G.DROP_HOLD_MS - Date.now()), PHASES.FIRST_BETS, G.afterBlinds);
}


// #4 / #51: limits, per phone address. New rooms: 6 a minute. Wrong room codes typed on 'join': 40 per 5 minutes,
// then a 2-minute wait. #2: a whole party shares one Wi-Fi address, so the bar is high, and a phone reconnecting to
// its own seat (with its key) never counts and is never blocked.
const MAX_ROOMS = 1500, MISSES_PER_5MIN = 40;
const hits = new Map();   // ip -> { creates: [t], misses: [t], blockedUntil }
function hitsOf(ip) { let h = hits.get(ip); if (!h) hits.set(ip, h = { creates: [], misses: [], blockedUntil: 0 }); return h; }
const recent = (list, ms) => { const now = Date.now(); while (list.length && now - list[0] > ms) list.shift(); return list; };
function wrongCode(ip) { const h = hitsOf(ip); recent(h.misses, 5 * 60000).push(Date.now()); if (h.misses.length >= MISSES_PER_5MIN) { h.blockedUntil = Date.now() + 2 * 60000; h.misses = []; } }
const TOO_MANY = 'Lots of people on this Wi-Fi. Try again in a minute.';
// #2: the phone's address. Render puts the real client first in x-forwarded-for (and its own hops after it), so the
// first public entry is the phone; the LAST entry can be the proxy's own address, which would lump every phone on the
// site into one and block whole parties. (A faked header only dodges a limit; it can never block anyone else's seat.)
const PRIVATE_IP = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|::$|f[cd][0-9a-f]{0,2}:|fe80:|::ffff:(10|127|192\.168)\.)/i;
function clientIp(req) {
  const xff = String((req && req.headers && req.headers['x-forwarded-for']) || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff.find(a => !PRIVATE_IP.test(a)) || xff[0] || String((req && req.socket && req.socket.remoteAddress) || '');
}
const blocked = (ip) => hitsOf(ip).blockedUntil > Date.now();
const ACKED = new Set(['submit_caption', 'place_bet', 'undo_bet', 'steal', 'frame_pick', 'react', 'call_shot']);   // #2: answered by cid, never applied twice
setInterval(() => { const now = Date.now(); for (const [ip, h] of hits) if (!h.creates.length && !h.misses.length && h.blockedUntil < now) hits.delete(ip); else { recent(h.creates, 60000); recent(h.misses, 5 * 60000); } }, 60000);
/* #30 Same name at the door: "Are you the Chris who was playing, or a different Chris?"
   A different Chris gets a seat of their own ("Chris 2"). 'It's me' takes the old seat only once its phone has
   been gone 2 minutes, or with the host's OK; the old phone is told its seat moved. */
const CLAIM_FREE_MS = 120000;
const BACK_NOTICE_MS = 20000;   // away this long mid-game: the table hears "X's back."
const HOST_TAKEOVER_MS = 20000; // lobby: the host's phone gone this long, the next player may take over
const firstWord = (n) => String(n || '').trim().split(/\s+/)[0] || n;
const claims = new Map();       // claim id -> { ws, code, pid, at } (a phone waiting for the host's OK)
function freeName(game, name) {
  const taken = new Set(game.players.map(p => p.name.toLowerCase()));
  for (let k = 2; k < 10; k++) { const suf = ' ' + k, n = name.slice(0, 12 - suf.length).trim() + suf; if (!taken.has(n.toLowerCase())) return n; }
  return null;
}
// Seat `claimWs` in an existing player's seat: the old phone (if it's still on) is told, and its key stops working
function takeSeat(code, existing, claimWs) {
  const game = games[code];
  if (!game || !claimWs || claimWs.readyState !== 1 || typeof claimWs.seatFn !== 'function') return;
  const old = clients[existing.id];
  if (old && old.ws !== claimWs) { send(old.ws, { type: 'seat_moved' }); try { old.ws.close(4001, 'seat moved'); } catch (e) {} delete clients[existing.id]; }
  if (existing.key) existing.movedKey = existing.key;   // that phone hears "Your seat moved" if it comes back
  existing.key = null;
  existing.connected = false;   // (seat() marks it here again, without a "back" notice of its own)
  existing.disconnectedAt = null;
  if (game.seatClaim && game.seatClaim.pid === existing.id) game.seatClaim = null;
  game.notice = { text: `${firstWord(existing.name)}’s back, on a different phone.`, at: Date.now() };
  claimWs.seatFn(existing.id, code);
}
function dropClaim(id) {
  const c = claims.get(id); if (!c) return;
  claims.delete(id);
  const g = games[c.code];
  if (g && g.seatClaim && g.seatClaim.id === id) { g.seatClaim = null; broadcast(c.code); }
}

// After a restart: a phone hands back its sealed copy and the room comes back as it was
function resumeTimers(code) {
  const g = games[code];
  if (!g) return;
  if (g.phase === PHASES.WRITING) scheduleWritingEnd(code);
  if (g.phase === PHASES.FIRST_BETS && g.dropAt) later(code, 1500, PHASES.FIRST_BETS, G.afterBlinds);   // the drop already happened: on to the steal
  else if (g.phase === PHASES.SECOND_BETS && g.lateDropAt) later(code, 1500, PHASES.SECOND_BETS, G.moveFromSecondBets);
  else if (g.phase === PHASES.FIRST_BETS || g.phase === PHASES.SECOND_BETS) autoAdvanceBets(code);
  syncAuto(code);   // #6: the flip or the reel picks up where it was
}

const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const sendError = (ws, message) => { if (ws.curCid) ws.curFailed = true; send(ws, ws.curCid ? { type: 'error', message, cid: ws.curCid } : { type: 'error', message }); };   // (#2: tied to the message it answers)
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 12);

wss.on('connection', (ws, req) => {
  let playerId = null;
  const ip = clientIp(req);
  send(ws, { type: 'hello', boot: BOOT });
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('error', (e) => { console.warn('socket error:', e && (e.code || e.message)); });   // e.g. a message over maxPayload: that socket closes, the server carries on

  const seat = (id, code) => {
    // #4: one room per phone. Moving to another seat or room leaves the old seat offline (never a ghost that holds up betting)
    if (playerId && playerId !== id && clients[playerId] && clients[playerId].ws === ws) {
      const oldCode = clients[playerId].gameCode, og = games[oldCode];
      delete clients[playerId];
      const op = og && og.players.find(x => x.id === playerId);
      if (op) { op.connected = false; op.disconnectedAt = Date.now(); G.clearVoice(og, playerId); if (oldCode !== code) broadcast(oldCode); }
    }
    const old = clients[id];
    if (old && old.ws !== ws) { try { old.ws.close(4000, 'replaced'); } catch (e) {} }
    playerId = id;
    ws.claimId = null;
    clients[id] = { ws, gameCode: code };
    const g = games[code], p = g.players.find(x => x.id === id);
    const awayMs = p && !p.connected && p.disconnectedAt ? Date.now() - p.disconnectedAt : 0;
    if (p) { p.connected = true; p.disconnectedAt = null; Night.returned(g, id); }   // (back after heading out: in the game again)
    // #30: a player coming back is announced as back (never as someone new), and only after a real absence
    if (p && awayMs >= BACK_NOTICE_MS && g.phase !== PHASES.LOBBY) g.notice = { text: `${firstWord(p.name)}’s back.`, at: Date.now() };
    // #30: the host who stepped away from the lobby gets the room back on return (until the game starts)
    if (p && g.phase === PHASES.LOBBY && g.origHostId === id && g.hostId !== id) { g.hostId = id; g.origHostId = null; g.notice = { text: `${firstWord(p.name)}’s back, and hosting again.`, at: Date.now() }; }
    G.clearVoice(games[code], id);   // a fresh connection starts outside the voice call (the phone re-joins it)
    if (p && !p.key) p.key = crypto.randomBytes(16).toString('base64url');
    send(ws, { type: 'joined', playerId: id, code, key: p ? p.key : null, boot: BOOT });   // #2: the key never leaves this phone; everyone else only ever sees the public id
    broadcast(code, id);
  };
  ws.seatFn = seat;   // (a host letting someone back into their seat seats them from the host's connection)

  // One bad message must never take the whole server down
  ws.on('message', (raw) => { try { onMessage(raw); } catch (e) { console.error('message failed', e); try { sendError(ws, 'That didn’t take. Try again.'); } catch (e2) {} } });
  const onMessage = (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg.action !== 'string') return;

    // Actions that don't need a seat yet
    if (msg.action === 'create') {
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      const h = hitsOf(ip);
      if (recent(h.creates, 60000).length >= 6 || Object.keys(games).length >= MAX_ROOMS) return sendError(ws, 'Too many new rooms just now. Try again in a minute.');
      h.creates.push(Date.now());
      const timer = G.cleanTimer(msg.timer) ?? G.DEFAULT_TIMER;   // [settings] 0 = no timer; default 2 min
      const id = crypto.randomUUID();
      let game; do { game = G.createGame(id, name, timer, Array.isArray(msg.seen) ? msg.seen.slice(0, 200) : []); } while (games[game.code]);
      games[game.code] = game;
      return seat(id, game.code);
    }
    // #2: a phone coming back to its own seat (reconnect), or bringing the room back after a restart (restore), is
    // never slowed or blocked by the per-address limits, and a refusal never counts against its Wi-Fi: only wrong
    // codes typed on Join do. (A seat answers only to its own key, 16 random bytes: nothing to guess.)
    const backToSeat = (code, pid, key) => {
      const game = games[code];
      if (!game) return sendError(ws, 'Game not found');
      const p = game.players.find(x => x.id === pid);
      if (!p) return sendError(ws, 'Player not in game');
      if (p.movedKey && key === p.movedKey && key !== p.key) return send(ws, { type: 'seat_moved' });   // #30: that seat went to another phone
      if (p.key && key !== p.key) return sendError(ws, 'Player not in game');   // #2: a seat answers only to its own phone
      return seat(p.id, code);
    };
    if (msg.action === 'reconnect') return backToSeat(String(msg.code || '').toUpperCase().trim(), msg.playerId, msg.key);
    if (msg.action === 'restore') {
      // #6: the server restarted; this phone brings the room back from its sealed copy (the first copy in wins; the
      // phones re-send their recent captions and bets, and the acks in the copy keep any from landing twice)
      const want = String(msg.code || '').toUpperCase().trim();
      const g = G.unsealGame(msg.data);
      const p = g && g.players.find(x => x.id === msg.playerId);
      if (!g || !p || (p.key && msg.key !== p.key) || (want && g.code !== want)) return backToSeat(want, msg.playerId, msg.key);   // a copy that won't open: the room may be back already
      if (!games[g.code]) { games[g.code] = g; g._lastAct = Date.now(); console.log('room restored after restart', g.code, g.phase); resumeTimers(g.code); }
      return backToSeat(g.code, p.id, msg.key);
    }
    if (msg.action === 'join') {
      const code = String(msg.code || '').toUpperCase().trim();
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      if (blocked(ip)) return sendError(ws, TOO_MANY);
      const game = games[code];
      if (!game) { wrongCode(ip); return sendError(ws, 'Game not found'); }
      const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        // #30: the same name — ask first. A different person gets their own seat; the same person gets theirs
        // back once the old phone has been gone 2 minutes, or with the host's OK (the table is told either way).
        const live = !!(clients[existing.id] && clients[existing.id].ws.readyState === 1);
        if (clients[existing.id] && clients[existing.id].ws === ws) return seat(existing.id, code);   // (this phone, tapping Join twice)
        if (msg.as === 'new') {
          if (game.locked) return sendError(ws, 'The host has locked this room');
          const nm = freeName(game, name);
          if (!nm) return sendError(ws, 'Pick a different name');
          const id = crypto.randomUUID(), r = G.addPlayer(game, id, nm);
          if (r.error) return sendError(ws, r.error);
          Stats.joined(msg.via);   // #41
          return seat(id, code);
        }
        if (msg.as === 'me') {
          const away = !live && existing.disconnectedAt ? Date.now() - existing.disconnectedAt : 0;
          if (!live && !game.locked && away >= CLAIM_FREE_MS) return takeSeat(code, existing, ws);
          if (ws.claimId) dropClaim(ws.claimId);
          const host = game.players.find(p => p.id === game.hostId);
          const hostLive = !!host && host.id !== existing.id && !!clients[host.id] && clients[host.id].ws.readyState === 1;
          const cid = crypto.randomBytes(6).toString('hex');
          ws.claimId = cid;
          claims.set(cid, { ws, code, pid: existing.id, at: Date.now() });
          if (hostLive) { game.seatClaim = { id: cid, pid: existing.id, name: existing.name, oldLive: live, awaySecs: Math.round(away / 1000), at: Date.now() }; broadcast(code); }
          return send(ws, { type: 'claim_wait', name: existing.name, host: hostLive ? host.name : null, oldLive: live, secs: !live && !game.locked ? Math.ceil((CLAIM_FREE_MS - away) / 1000) : null });
        }
        return send(ws, { type: 'same_name', name: existing.name, code, playing: game.phase !== PHASES.LOBBY });
      }
      if (game.locked) return sendError(ws, 'The host has locked this room');
      const id = crypto.randomUUID();
      const r = G.addPlayer(game, id, name);
      if (r.error) return sendError(ws, r.error);
      Stats.joined(msg.via);   // #41: by QR, invite link or typed code
      return seat(id, code);
    }
    if (msg.action === 'tally') {
      // #41: a recap picture or a Gallery card was shared from this phone (a handful per connection at most)
      ws.tallyN = (ws.tallyN || 0) + 1;
      if (ws.tallyN <= 20) Stats.shared(String(msg.what || ''));
      return;
    }

    if (!playerId || !clients[playerId]) return;
    const code = clients[playerId].gameCode;
    const game = games[code];
    if (!game) return;
    const me = game.players.find(p => p.id === playerId);
    if (!me) return;
    game._lastAct = Date.now();
    const dealer = game.players[game.dealerIndex];
    const isDealer = !!dealer && dealer.id === playerId;
    const isHost = game.hostId === playerId;
    const dealerAway = dealer && !dealer.connected && dealer.disconnectedAt ? (Date.now() - dealer.disconnectedAt) / 1000 : 0;
    const canRun = isDealer || isHost || dealerAway >= G.TAKEOVER_SECS;   // may move the table along
    const fail = (r) => { if (r && r.error) { sendError(ws, r.error); return true; } return false; };

    /* #2: captions, bets, the steal and frame picks carry an id (cid). Each one is answered (an 'ack', or an error
       tied to it), and one the room has already taken is never applied again: a phone that lost its connection
       re-sends whatever wasn't answered. The room keeps its recent cids (they travel in the sealed copy, so this
       holds across a restart too). The cid is noted before the action runs, so the copy sealed with it carries it. */
    const handle = () => handleSeated(msg, game, code, me, isDealer, isHost, dealerAway, canRun, fail);
    const cid = ACKED.has(msg.action) && typeof msg.cid === 'string' && /^[A-Za-z0-9_-]{4,40}$/.test(msg.cid) ? msg.cid : null;
    if (!cid) return handle();
    const done = ((game.acks = game.acks || {})[playerId] = game.acks[playerId] || []);
    if (done.includes(cid)) return send(ws, { type: 'ack', cid, dup: true });
    done.push(cid); if (done.length > 24) done.splice(0, done.length - 24);   // (a few rounds' worth; small enough for the sealed copy)
    game.actN = (game.actN || 0) + 1;
    ws.curCid = cid; ws.curFailed = false; ws.curHeld = false;
    let threw = null;
    try { handle(); } catch (e) { threw = e; }
    const failed = !!threw || ws.curFailed, held = ws.curHeld;
    ws.curCid = null; ws.curFailed = false; ws.curHeld = false;
    if (failed || held) { const i = done.indexOf(cid); if (i >= 0) done.splice(i, 1); }   // refused, or only a spelling question: the same cid may come again
    if (threw) { console.error('message failed', msg.action, threw); return send(ws, { type: 'error', message: 'That didn’t take. Try again.', cid }); }
    if (!failed && !held) send(ws, { type: 'ack', cid });
  };
  const handleSeated = (msg, game, code, me, isDealer, isHost, dealerAway, canRun, fail) => {
    switch (msg.action) {
      case 'start': {
        if (!isHost) return sendError(ws, 'Only the host can start');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Game already in progress');
        { const here = game.players.filter(p => p.connected).length, house = G.houseWanted(game);   // two people can play with at least one house player
          if (here < 2 || (here < 3 && house < 1)) return sendError(ws, here < 2 ? 'Need at least 2 players' : 'Need a third player, or a house player'); }
        { const c = G.startCheck(game); if (c.error) return sendError(ws, c.error); }   // the new deck is still being drawn: never start a game that would run out
        if (fail(G.startRound(game))) return;
        Night.beginGame(game);   // "Previously on Closed Caption" when most of this table played last time
        Stats.started(game.players.filter(G.isPresent).length);   // #41
        game.origHostId = null;   // #30: whoever started it hosts it
        broadcast(code);
        scheduleWritingEnd(code);
        return;
      }
      case 'kick_player': {
        const targetId = msg.targetPlayerId;
        if (fail(G.kickPlayer(game, playerId, targetId))) return;
        G.clearVoice(game, targetId);
        const kc = clients[targetId];
        if (kc) { send(kc.ws, { type: 'kicked', message: 'The host has shown you out.' }); try { kc.ws.close(); } catch (e) {} delete clients[targetId]; }
        broadcast(code);
        return;
      }
      case 'lock': {
        // #51: no new names while locked (people already seated can always come back)
        if (!isHost) return sendError(ws, 'Only the host can lock the room');
        game.locked = !!msg.on;
        broadcast(code);
        return;
      }
      case 'claim_answer': {
        // #30: the host lets someone back into a seat on a new phone (or not)
        if (!isHost) return sendError(ws, 'Only the host can do that');
        const id = String(msg.id || ''), c = claims.get(id);
        if (game.seatClaim && game.seatClaim.id === id) game.seatClaim = null;
        claims.delete(id);
        const existing = c && c.code === code ? game.players.find(p => p.id === c.pid) : null;
        if (existing && c.ws.readyState === 1) {
          if (msg.ok) return takeSeat(code, existing, c.ws);
          send(c.ws, { type: 'claim_no', name: existing.name, host: me.name });
          c.ws.claimId = null;
        }
        broadcast(code);
        return;
      }
      case 'take_host': {
        // #30: the host's phone went quiet in the lobby: the next player can run the room until they're back
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Only in the lobby');
        const h = game.players.find(p => p.id === game.hostId);
        if (isHost || (h && (h.connected || !h.disconnectedAt || Date.now() - h.disconnectedAt < HOST_TAKEOVER_MS))) return;
        if (!game.origHostId && h) game.origHostId = h.id;
        game.hostId = playerId;
        game.notice = { text: `${firstWord(me.name)} is hosting until ${h ? firstWord(h.name) + ' is' : 'the host is'} back.`, at: Date.now() };
        broadcast(code);
        return;
      }
      case 'demo_watched': {
        // #36: the host sees how many have watched the 1-minute demo
        if (!me.watched) { me.watched = true; broadcast(code); }
        return;
      }
      case 'update_settings': {
        if (!isHost) return sendError(ws, 'Only the host can change settings');
        if (fail(G.updateSettings(game, msg.settings || {}))) return;
        broadcast(code);
        return;
      }
      case 'seen_sync': {
        fail(G.setPlayerSeen(game, playerId, msg.seen));
        return;
      }
      case 'gallery_sync': {
        const r = G.syncGallery(game, msg.entries);
        if (fail(r)) return;
        if (r.refused) send(ws, { type: 'gallery_purge', below: G.FIRST_LIVE_ID });   // retired frames: refused here, and the phone drops its copy
        if (r.added) broadcast(code);
        return;
      }
      case 'move_seat': {
        if (fail(G.moveSeat(game, playerId, msg.targetPlayerId, Number(msg.dir)))) return;
        broadcast(code);
        return;
      }
      case 'frame_pick': {
        // #5 Frame It on the reveal: frame a revealed fake (or take it back); a majority frames it on the spot
        if (fail(G.pickFrame(game, playerId, msg.target, msg.on))) return;
        broadcast(code);
        return;
      }
      case 'read_next': {
        // the reading, one caption at a time (the dealer, the host, or anyone once the dealer has wandered off)
        if (!canRun) return sendError(ws, 'The dealer reads them');
        if (msg.step !== undefined && Number(msg.step) !== (game.readStep || 1)) return;   // a double tap, or two phones at once: once
        if (fail(G.readNext(game, msg.dir))) return;
        broadcast(code);
        return;
      }
      case 'react': {
        // #26 Ha / Groan: on any caption but your own; nobody sees a count until the answer
        if (fail(G.react(game, playerId, msg.target, msg.kind, msg.on))) return;
        broadcast(code);
        return;
      }
      case 'call_shot': {
        // R11: after you lock in, name the one person you expect to fall for yours (secret until the reveal)
        if (fail(G.callShot(game, playerId, msg.target === undefined ? null : msg.target))) return;
        broadcast(code);
        return;
      }
      case 'kids': {
        // R16: the host: "The kids are in bed" (every cartoon from the next deal) / "One came back down" (family again)
        if (!isHost) return sendError(ws, 'Only the host can do that');
        const r = G.kidsToggle(game, !!msg.on);
        if (fail(r)) return;
        broadcast(code);
        if (r.swapped) scheduleWritingEnd(code);   // a family cartoon took the other one's place: its own clock
        return;
      }
      case 'hold': {
        // #6: the dealer (or the host, or a stand-in) holds the flip or the reel, and lets it go again
        if (!canRun) return sendError(ws, 'The dealer runs the reveal');
        if (msg.phase !== undefined && (msg.phase !== game.phase || (msg.round !== undefined && msg.round !== game.round))) return;
        if (fail(G.setHold(game, !!msg.on))) return;
        broadcast(code);
        return;
      }
      case 'reel_next': case 'reel_prev': case 'reel_skip': {
        // The dealer paces the answer, one caption at a time
        if (!canRun) return sendError(ws, 'The dealer runs the reveal');
        // #30: a tap meant for a step the table has already left (the dealer and the host both tapping) is dropped
        if (game.phase === PHASES.ANSWER && game.reel && msg.step !== undefined && Number(msg.step) !== game.reel.step) return;
        if (fail(G.reelStep(game, msg.action.slice(5)))) return;
        broadcast(code);
        return;
      }
      case 'career': {
        // Each phone keeps its own rating (and the verdict lines it has seen); the server only does the arithmetic
        if (fail(G.setCareer(game, playerId, msg))) return;
        broadcast(code);
        return;
      }
      case 'ending_next': {
        // Game over: the dealer/host taps on through the winner, the awards and the final scores (then Caption of the Night)
        if (!canRun) return sendError(ws, 'The dealer moves things along');
        if (game.phase !== PHASES.SCORES || !G.isGameOver(game)) return;
        Night.ensureEnding(game);
        if (fail(Night.nextBeat(game, msg.beat))) return;
        broadcast(code);
        return;
      }
      case 'head_out': {
        // R28 Heading out: this player leaves (their phone shows a goodbye), the table hears one quiet line,
        // and the seat leaves the turn order like a dropped phone that isn't coming back
        const r = Night.headOut(game, playerId);
        if (fail(r)) return;
        G.clearVoice(game, playerId);
        send(ws, { type: 'credit', data: r.credit });
        delete clients[playerId];
        playerId = null;
        broadcast(code);
        return;
      }
      case 'call_night': {
        // cut 5: game over, and that's the night: straight to Caption of the Night (or the final scores, if nothing framed)
        if (!isHost && !canRun) return sendError(ws, 'Only the host can call it a night');
        if (fail(Night.callNight(game))) return;
        broadcast(code);
        return;
      }
      case 'last_call': {
        // R30 Last Call (the host): the next trip around the table is the last, the Late Edition, sealed
        if (!isHost) return sendError(ws, 'Only the host can call last call');
        if (fail(Night.lastCall(game))) return;
        broadcast(code);
        return;
      }
      case 'tables': {
        // The lobby: this phone's records of tables that look like this one (who has the Remote, last time)
        if (game.phase !== PHASES.LOBBY) return;
        if (fail(Night.setTables(game, playerId, msg.list))) return;
        broadcast(code);
        return;
      }
      case 'more_bet_time': {
        // anyone at the table, once per betting stage: +20 s
        const r = G.moreBetTime(game, playerId);
        if (fail(r)) return;
        broadcast(code);
        if (r.stage === 1) scheduleBlind(code); else scheduleLate(code);
        return;
      }
      case 'add_time': {
        if (!canRun) return sendError(ws, 'Only the dealer or host can add time');
        if (fail(G.addTime(game))) return;
        broadcast(code);
        scheduleWritingEnd(code);   // the old end time no longer applies
        return;
      }
      case 'update_timer': {
        if (!isHost) return sendError(ws, 'Only the host can change the timer');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Timer can only be changed in the lobby');
        const t = Number(msg.timer);
        if (G.cleanTimer(msg.timer) === null) return sendError(ws, 'That didn’t take. Try again.');   // [settings] 0 (no timer) or 30 s – 10 min
        game.timerDuration = t;
        broadcast(code);
        return;
      }
      case 'submit_caption': {
        const mode = ['check', 'fix', 'keep'].includes(msg.mode) ? msg.mode : 'check';
        const r = G.submitCaption(game, playerId, msg.caption, mode);
        if (fail(r)) return;
        if (!r.check) Night.noteSubmit(game, playerId);   // (the night's log knows who was first in, and who was last)
        if (r.check) { ws.curHeld = true; return send(ws, ws.curCid ? { type: 'caption_check', ...r.check, cid: ws.curCid } : { type: 'caption_check', ...r.check }); }   // (#2: answers that cid)
        broadcast(code);
        if (r.allIn) later(code, 900, PHASES.WRITING, endWriting);
        return;
      }
      case 'mulligan': {
        if (game.phase === PHASES.WRITING && !(game.mulliganVotes || []).includes(playerId)) Night.noteSkip(game, playerId);
        const r = G.voteMulligan(game, playerId);
        if (fail(r)) return;
        broadcast(code);
        if (r.triggered) scheduleWritingEnd(code);
        return;
      }
      case 'end_writing': {
        if (!canRun) return sendError(ws, 'Only the dealer or host can do that');
        if (game.phase !== PHASES.WRITING) return;
        if (game.submissions.length === 0) return sendError(ws, 'Nobody has written anything yet');
        if (game.submissions.length < 2) return sendError(ws, 'Wait for one more caption. With one, the real one is obvious.');   // #34
        endWriting(game);
        broadcast(code);
        return;
      }
      case 'place_bet': {
        const r = G.placeBet(game, playerId, { target: msg.target, count: msg.count });
        if (fail(r)) return;
        broadcast(code);
        autoAdvanceBets(code);
        return;
      }
      case 'undo_bet': {
        if (fail(G.undoBet(game, playerId))) return;
        broadcast(code);
        if (game.phase === PHASES.FIRST_BETS) scheduleBlind(code);   // the 'all in' beat waits for them again
        if (game.phase === PHASES.SECOND_BETS) scheduleLate(code);
        return;
      }
      case 'skip_better': {
        // (older phones) there are no turns any more: the dealer or host drops the last chips instead
        if (game.phase === PHASES.SECOND_BETS && canRun && !game.lateDropAt) return lateDropNow(code);
        fail(G.skipCurrentBetter(game));
        return;
      }
      case 'steal': {
        if (game.phase !== PHASES.STEAL) return;
        if (!isDealer && !isHost && !(dealerAway >= G.TAKEOVER_SECS)) return sendError(ws, 'Only the dealer can steal');
        // A stand-in for a missing dealer (or the host, #28) can only pass
        const idx = isDealer ? msg.betIndex : null;
        if (fail(G.stealChip(game, idx === undefined ? null : idx))) return;
        broadcast(code);
        return;
      }
      case 'advance': {
        // One tap per stage: ignore a tap meant for an earlier stage (double taps, slow screens),
        // and any second advance within 1.2 s of the last one (older phones that don't say which stage)
        if (msg.phase !== undefined && (msg.phase !== game.phase || (msg.round !== undefined && msg.round !== game.round))) return;
        if (game._advAt && Date.now() - game._advAt < 1200) return;
        game._advAt = Date.now();
        switch (game.phase) {
          case PHASES.READING:
            if (!canRun) return sendError(ws, 'The dealer starts the betting');
            G.moveToFirstBets(game); broadcast(code); scheduleBlind(code); return;
          case PHASES.FIRST_BETS:
            // 'Drop the chips now' (anyone idle sits the blind bet out); during the table's look, straight on
            if (!canRun) return sendError(ws, 'Only the dealer or host can do that');
            if (!game.dropAt) return dropNow(code);
            G.afterBlinds(game); break;
          case PHASES.REVEAL:
            if (!canRun) return sendError(ws, 'The dealer moves things along');
            if (game.flipAt && Date.now() < game.flipAt + 2400) { game._advAt = 0; return game.steal && game.steal.victimId && Date.now() < game.flipAt ? sendError(ws, 'Let the thief finish') : undefined; }   // the card hasn't turned yet
            G.moveFromReveal(game); break;
          case PHASES.SECOND_BETS:
            // 'Drop the chips now' (anyone not in sits the last chip out); after the drop, straight to the answer
            if (!canRun) return sendError(ws, 'Only the dealer or host can do that');
            if (!game.lateDropAt) return lateDropNow(code);
            G.moveFromSecondBets(game); break;
          case PHASES.ANSWER:
            // The recap: only the dealer (or host, or a stand-in) moves on, straight to the scoreboard (#5: Frame It
            // happened on the reveal)
            if (!canRun) return sendError(ws, 'The dealer moves things along');
            if (fail(G.moveToScoreboard(game))) { game._advAt = 0; return; }   // not until the reel reaches the recap
            break;
          case PHASES.SCORES: {
            const nd = game.players[G.nextDealerIndex(game, game.dealerIndex)];
            if (!canRun && !(nd && nd.id === playerId)) return sendError(ws, 'Waiting for the next dealer');
            if (G.isGameOver(game)) return;
            if (G.finishIfOver(game)) { broadcast(code); return; }   // everyone with a deal to come has gone: this was the last round
            if (fail(G.startRound(game))) return;
            broadcast(code);
            scheduleWritingEnd(code);
            return;
          }
          default: return;
        }
        broadcast(code);
        if (game.phase === PHASES.SECOND_BETS) scheduleLate(code);   // (the flip, tapped on: the last chips' clock)
        return;
      }
      case 'finale_open': {
        // After the final scores: the host (or a stand-in) opens tonight's Gallery for every phone
        if (!canRun) return sendError(ws, 'The host opens the Gallery');
        if (game.ending && !game.ending.full) return sendError(ws, 'Caption of the Night comes at the end of the night');   // cut 5
        if (fail(G.openFinale(game))) return;
        broadcast(code);
        return;
      }
      case 'finale_vote': {
        if (fail(G.voteFinale(game, playerId, msg.key))) return;
        broadcast(code);
        return;
      }
      case 'finale_close': {
        // 'Move on': count the votes now
        if (!canRun) return sendError(ws, 'The host moves things along');
        if (!game.finale) return;
        G.resolveFinale(game);
        broadcast(code);
        return;
      }
      case 'play_again': {
        if (!isHost) return sendError(ws, 'Only the host can start a new game');
        if (game.phase !== PHASES.SCORES || !G.isGameOver(game)) return sendError(ws, 'The game is still going');
        if (Array.isArray(msg.seen)) G.setSeen(game, msg.seen.slice(0, 200));
        Night.keepTable(game);   // the room remembers tonight's table (the Remote, last time) for the next game
        G.resetForNewGame(game);
        Night.reset(game);
        game.players.forEach(p => { delete p.again; });   // #35: a fresh show of hands next time
        broadcast(code);
        return;
      }
      case 'again': {
        // #35: game over: a guest says "I'm in for another" (or takes it back); the host sees the count
        if (game.phase !== PHASES.SCORES || !G.isGameOver(game)) return;
        me.again = msg.on !== false;
        broadcast(code);
        return;
      }
      case 'voice_mode': {
        // #40: the host says how the table talks — 'call' (already on FaceTime/Zoom: the game's voice is off),
        // 'game' (use the game's voice) or null (everyone in one room). Phones read it from state.settings.voice.
        if (!isHost) return sendError(ws, 'Only the host can change that');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Settings can only be changed in the lobby');
        const m = msg.mode === 'call' || msg.mode === 'game' ? msg.mode : null;
        game.settings.voice = m;   // (a phone already in the game's call hangs up by itself when it sees 'call')
        broadcast(code);
        return;
      }
      case 'rtc': {
        // Voice call signalling: pass one small message to one other player in this room (never broadcast)
        const now = Date.now();
        if (!ws.rtcWin || now - ws.rtcWin > 10000) { ws.rtcWin = now; ws.rtcN = 0; }
        if (++ws.rtcN > 300) return;
        const to = String(msg.to || '');
        if (!to || to === playerId || !game.players.some(p => p.id === to)) return;
        const data = msg.data;
        if (!data || typeof data !== 'object' || JSON.stringify(data).length > 16000) return;
        const tc = clients[to];
        if (tc && tc.gameCode === code) send(tc.ws, { type: 'rtc', from: playerId, data });
        return;
      }
      case 'voice': {
        G.setVoice(game, playerId, !!msg.on, !!msg.muted);
        broadcast(code);
        return;
      }
      case 'leave': {
        // Leaving from the lobby frees the seat; mid-game the seat stays (scores are kept)
        if (game.phase === PHASES.LOBBY && !isHost) game.players = game.players.filter(p => p.id !== playerId);
        else { me.connected = false; me.disconnectedAt = Date.now(); }
        G.clearVoice(game, playerId);
        delete clients[playerId];
        playerId = null;
        broadcast(code);
        return;
      }
    }
  };

  ws.on('close', () => {
    if (ws.claimId) dropClaim(ws.claimId);   // a phone that was waiting for the host's OK has gone
    if (!playerId || !clients[playerId] || clients[playerId].ws !== ws) return;
    const code = clients[playerId].gameCode;
    delete clients[playerId];
    const game = games[code];
    if (!game) return;
    const p = game.players.find(x => x.id === playerId);
    if (p) { p.connected = false; p.disconnectedAt = Date.now(); }
    G.clearVoice(game, playerId);
    broadcast(code);
  });
});

// Housekeeping every 3 seconds
setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(games)) try {
    const g = games[code];
    // #4: empty for 30 minutes (10 in the lobby): close the room. Any room idle for 8 hours closes too.
    if (g.players.every(p => !p.connected)) {
      const last = Math.max(0, ...g.players.map(p => p.disconnectedAt || 0));
      if (now - last > (g.phase === PHASES.LOBBY ? 10 : 30) * 60 * 1000) { delete games[code]; continue; }
    }
    if (now - (g._lastAct || g.phaseAt || now) > 8 * 3600 * 1000) { delete games[code]; continue; }
    let changed = false;
    // Host gone: mid-game, after a minute the next person here becomes host (so someone can play again). In the
    // lobby (#30) the next player gets a 'Take over as host' button after 20 s; after 2 minutes it moves anyway.
    // Either way the table is told, and in the lobby the host gets the room back on return.
    const host = g.players.find(p => p.id === g.hostId);
    const hostAway = !host ? Infinity : !host.connected && host.disconnectedAt ? now - host.disconnectedAt : 0;
    if (hostAway > (g.phase === PHASES.LOBBY ? 120000 : 60000)) {
      const nh = g.players.find(p => p.connected);
      if (nh && nh.id !== g.hostId) {
        if (g.phase === PHASES.LOBBY && host && !g.origHostId) g.origHostId = host.id;
        g.hostId = nh.id; changed = true;
        g.notice = { text: g.phase === PHASES.LOBBY && host ? `${firstWord(nh.name)} is hosting until ${firstWord(host.name)} is back.` : `${firstWord(nh.name)} is hosting now.`, at: now };
      }
    }
    // A phone waiting for the host's OK for a seat: the claim lapses after 3 minutes
    for (const [cid, c] of claims) if (c.code === code && now - c.at > 180000) { dropClaim(cid); try { send(c.ws, { type: 'claim_no', lapsed: true }); } catch (e) {} }
    // Writing: everyone still here has written (a phone that went away no longer holds it up)
    if (g.phase === PHASES.WRITING && g.submissions.length >= 2 && G.allCaptionsIn(g)) { endWriting(g); changed = true; }
    // ...and a phone that died mid-writing holds it up a few seconds, never the full 45 s grace
    if (g.phase === PHASES.WRITING && G.connectedAllIn(g)) { if (!g._allOnAt) g._allOnAt = now; else if (now - g._allOnAt >= G.AWAY_WRITER_MS) { g._allOnAt = 0; endWriting(g); changed = true; } }
    else g._allOnAt = 0;
    // #28: a dealer who wanders off doesn't freeze the steal: it passes by itself after 45 s
    if (g.phase === PHASES.STEAL && g.phaseAt) {   // nobody steals: 45 s, or sooner when the dealer was already gone (15 s on screen, 30 s away)
      const dl = g.players[g.dealerIndex], gone = dl && !dl.connected && dl.disconnectedAt && now - dl.disconnectedAt > 30000;
      if (now - g.phaseAt > 45000 || (gone && now - g.phaseAt > 15000)) { G.stealChip(g, null); changed = true; }
    }
    // Bets: the only ones not in are phones that are off: a short wait (12 s), not the clock or the 45 s grace
    if ((g.phase === PHASES.FIRST_BETS && !g.dropAt) || (g.phase === PHASES.SECOND_BETS && !g.lateDropAt)) {
      if (G.onlyAwayPending(g)) { if (!g._betOnAt) g._betOnAt = now; else if (now - g._betOnAt >= G.AWAY_WRITER_MS) { g._betOnAt = 0; if (g.phase === PHASES.FIRST_BETS) dropNow(code); else lateDropNow(code); continue; } }
      else g._betOnAt = 0;
    }
    // Blind bets: the only ones not in are phones gone past the grace — drop without them
    if (g.phase === PHASES.FIRST_BETS && !g.dropAt && !blindT.has(code) && G.pendingBetters(g).length === 0) scheduleBlind(code);
    // Last chips: the only ones not in are phones gone past the grace — drop without them; and never without a clock
    if (g.phase === PHASES.SECOND_BETS && !g.lateDropAt && !lateT.has(code)) scheduleLate(code);
    // #39: the one writer everyone is waiting on can change when a phone drops
    if (g.phase === PHASES.WRITING) { const before = g.lines && g.lines.waitLast ? g.lines.waitLast.pid : null; G.noteLastWriter(g); if ((g.lines && g.lines.waitLast ? g.lines.waitLast.pid : null) !== before) changed = true; }
    // Keep "dealer is away" countdowns fresh
    if (changed || g.players.some(p => !p.connected && p.disconnectedAt && now - p.disconnectedAt < 120000)) broadcast(code);
  } catch (e) { console.error('housekeeping failed', code, e); }   // one bad room never stops the rest
}, 3000);

// #2 Heartbeat, every 10 s: a socket that didn't answer the last ping is dropped (so "offline" shows up within
// ~20 s), and every phone hears a small 'ping' it can see: a phone that hears nothing for ~20 s knows its
// connection is dead (Wi-Fi gone, phone asleep) and reconnects at once.
const PING_MS = 10000;
setInterval(() => {
  const ping = JSON.stringify({ type: 'ping' });
  wss.clients.forEach(ws => {
    if (!ws.isAlive) { try { ws.terminate(); } catch (e) {} return; }
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {}
    try { if (ws.readyState === 1) ws.send(ping); } catch (e) {}
  });
}, PING_MS);

// #41: the tally is written a few seconds after a change; a deploy's stop signal writes it at once
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { try { Stats.flush(); } catch (e) {} process.exit(0); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('');
  console.log('  CLOSED CAPTION is running.');
  console.log(`  On this computer:            http://localhost:${PORT}`);
  if (LAN_URL) console.log(`  On phones (same Wi-Fi):      ${LAN_URL}`);
  console.log(`  Hall of Fame deck:           ${G.store.count()} captions${G.store.file ? ' (' + G.store.file + ')' : ' (memory only)'}`);
  console.log('  Keep this window open while you play. Close it to stop.');
  console.log('');
});
