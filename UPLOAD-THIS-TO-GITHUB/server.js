// server.js — Express + WebSocket server for Closed Caption
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');
const G = require('./game');
const Stats = require('./stats');     // a private tally (counts only)
const Polish = require('./polish');   // the writing bar's spelling check
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
const wss = new WebSocketServer({ server, maxPayload: 32 * 1024 });   // phone → server messages are small (a Gallery sync or a restore fits)

// Build id: phones compare it and refresh themselves after an update
const INDEX_PATH = path.join(__dirname, 'public', 'index.html');
const INDEX_HTML = fs.readFileSync(INDEX_PATH, 'utf8');
// (a helper that isn't there yet just counts as empty, so a missing file never stops the server)
const readOr = (f) => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { return ''; } };
const BUILD = crypto.createHash('sha1').update(INDEX_HTML + ['game.js', 'store.js'].concat(fs.readdirSync(path.join(__dirname, 'public')).filter(f => f.endsWith('.js') || f.endsWith('.css')).sort().map(f => 'public/' + f)).map(readOr).join('')).digest('hex').slice(0, 10);   // every public/*.js and *.css counts, so no helper is ever left stale
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
// The phone's name, kept as a year-long cookie set by the server: iPhones wipe a site's own storage after
// 7 days without a visit, but keep this. Only the name the player typed; nothing else.
app.get('/remember', (req, res) => {
  const n = String(req.query.name || '').replace(/\s+/g, ' ').trim().slice(0, 12);
  if (n) res.cookie('cc_name', n, { maxAge: 365 * 24 * 3600 * 1000, sameSite: 'lax', path: '/' });
  res.set('Cache-Control', 'no-store').status(204).end();
});
// Is anyone playing right now? Updates are only pushed when this says no phones are connected. Counts only.
app.get('/status', (req, res) => {
  const live = Object.values(clients).filter(c => c && c.ws && c.ws.readyState === 1);
  const codes = new Set(live.map(c => c.gameCode));
  const inGame = [...codes].filter(c => games[c] && games[c].phase !== 'lobby').length;
  res.set('Cache-Control', 'no-store').json({ phones: live.length, rooms: codes.size, gamesInProgress: inGame });
});
// An invite link (?join=CODE) asks whose table it is, so the page can say "Join Nick's table — 3 here".
// Only the host's first name and a head count; a closed or unknown code is just { open: false }.
app.get('/room/:code', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const ip = clientIp(req);
  const code = String(req.params.code || '').toUpperCase();
  if (blocked(ip)) return res.status(429).json({ open: false, wait: true });
  const g = /^[A-Z]{4}$/.test(code) ? games[code] : null;
  if (!g) { wrongCode(ip); return res.json({ open: false }); }
  const host = g.players.find(p => p.id === g.hostId) || g.players.find(p => p.connected) || g.players[0];
  const here = g.players.filter(p => p.connected).length;
  res.json({ open: true, host: host ? (String(host.name).trim().split(/\s+/)[0] || '') : '', here, started: g.phase !== PHASES.LOBBY, full: g.players.length >= G.MAX_PLAYERS, locked: !!g.locked });
});
// The private tally, for Nick only: /stats?k=<STATS_KEY>. Without the key it doesn't exist (404). Counts only.
app.get('/stats', (req, res, next) => {
  const want = process.env.STATS_KEY || '', k = typeof req.query.k === 'string' ? req.query.k : '';
  const a = crypto.createHash('sha256').update(want).digest(), b = crypto.createHash('sha256').update(k).digest();
  if (!want || !crypto.timingSafeEqual(a, b)) return next();
  res.set('Cache-Control', 'no-store').set('X-Robots-Tag', 'noindex').json(Stats.report());
});
app.use('/images', (req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });   // the cartoons are public pictures
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

const games = {};    // code -> game
const clients = {};  // playerId -> { ws, gameCode }

function broadcast(code, sealTo = null) {
  const game = games[code];
  if (!game) return;
  // Every phone keeps a sealed copy of the room, refreshed on each new step (or every 20 s), to hand back after a
  // restart; and whenever a caption, a bet, the steal or a Bravo lands, so a restart never loses the last one.
  const tag = [game.phase, game.round, game.reel ? game.reel.step : '', game.players.length, (game.roundFrames || []).length,
    game.finale ? (game.finale.winner || 'v') + Object.keys(game.finale.votes || {}).length : '', (game.submissions || []).length, (game.bets || []).length,
    Object.keys(game.blind || {}).length, game.dropAt || '', Object.keys(game.lateBlind || {}).length, game.lateDropAt || '', game.steal ? 's' : '', game.flipped ? 'f' : '',
    game.actN || 0, game.ending ? game.ending.step : '', game.hostId].join('|');
  if (game.phase === PHASES.SCORES && game.over && game.gameNo && game._statDone !== game.gameNo) { game._statDone = game.gameNo; Stats.finished(); }
  let seal = null;
  if (tag !== game._sealTag || Date.now() - (game._sealAt || 0) > 20000) { try { seal = G.sealGame(game); game._sealTag = tag; game._sealAt = Date.now(); } catch (e) { console.error('seal failed', e); } }
  for (const p of game.players) {
    const c = clients[p.id];
    if (c && c.ws.readyState === 1) {
      const view = G.getPlayerView(game, p.id);
      view.lanUrl = LAN_URL;
      view.build = BUILD;
      c.ws.send(JSON.stringify({ type: 'state', data: view }));
      if (seal) c.ws.send(JSON.stringify({ type: 'seal', code, boot: BOOT, data: seal }));
      else if (sealTo === p.id) { try { c.ws.send(JSON.stringify({ type: 'seal', code, boot: BOOT, data: G.sealGame(game) })); } catch (e) {} }   // a phone back in its seat gets a fresh copy at once
    }
  }
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
process.on('uncaughtException', (e) => { console.error('uncaught', e); if (e && (e.code === 'EADDRINUSE' || e.code === 'EACCES')) process.exit(1); });
process.on('unhandledRejection', (e) => console.error('unhandled rejection', e));

// Writing ends on its own when the clock runs out (with a short grace for phones auto-sending drafts)
function scheduleWritingEnd(code) {
  const game = games[code];
  if (!game || game.phase !== PHASES.WRITING || !game.timerEnd) return;   // no timer: writing ends when everyone's in
  later(code, Math.max(0, game.timerEnd - Date.now()) + 2000, PHASES.WRITING, (g) => {
    // One caption plus the real one gives the answer away: 30 s more, up to twice, then on regardless
    if (g.submissions.length === 1 && (g.oneCapExt || 0) < 2 && g.players.filter(G.isSeated).length >= 2) {
      g.oneCapExt = (g.oneCapExt || 0) + 1; g.timerEnd = Date.now() + 30000; g.timerToken++;
      g.notice = { text: 'One caption isn’t a game. Thirty more seconds.', at: Date.now() };
      return setTimeout(() => scheduleWritingEnd(code), 0);
    }
    g.oneCapExt = 0;
    endWriting(g);
  });
}
function endWriting(g) {
  const r = G.finishWriting(g);
  if (r.empty) { G.startRound(g, { sameRound: true }); setTimeout(() => scheduleWritingEnd(g.code), 0); }   // nobody wrote: a fresh cartoon, same dealer
}

/* Bets, everyone at once: one timer per room and stage. Everyone in -> a short beat (the last one can still take
   theirs back) -> every chip drops onto the table together. Or the clock runs out first. */
const blindT = new Map(), lateT = new Map();
function scheduleBlind(code) {
  const g = games[code];
  clearTimeout(blindT.get(code)); blindT.delete(code);
  if (!g || g.phase !== PHASES.FIRST_BETS || g.dropAt) return;
  const allIn = G.pendingBetters(g).length === 0;
  const at = allIn ? Date.now() + G.ALL_IN_BEAT_MS : (g.blindEnd || Date.now() + G.BLIND_MS);
  const round = g.round;
  blindT.set(code, setTimeout(() => {
    blindT.delete(code);
    const x = games[code];
    if (!x || x.phase !== PHASES.FIRST_BETS || x.round !== round || x.dropAt) return;
    if (allIn ? G.pendingBetters(x).length > 0 : Date.now() < (x.blindEnd || 0) - 50) return scheduleBlind(code);   // someone took theirs back / the clock moved
    dropNow(code);
  }, Math.max(0, at - Date.now())));
}
// The chips drop (every phone, one shared moment), the table gets a look, then the dealer's steal (or the flip)
function dropNow(code) {
  const g = games[code];
  if (!g || g.phase !== PHASES.FIRST_BETS) return;
  clearTimeout(blindT.get(code)); blindT.delete(code);
  try { G.dropBlind(g); } catch (e) { console.error('drop failed', code, e); }
  broadcast(code);
  later(code, Math.max(0, g.dropAt + G.DROP_HOLD_MS - Date.now()), PHASES.FIRST_BETS, G.afterBlinds);
}
function scheduleLate(code) {
  const g = games[code];
  clearTimeout(lateT.get(code)); lateT.delete(code);
  if (!g || g.phase !== PHASES.SECOND_BETS || g.lateDropAt) return;
  const allIn = G.pendingBetters(g).length === 0;
  const at = allIn ? Math.max(Date.now() + G.ALL_IN_BEAT_MS, (g.flipAt || 0) + G.FLIP_MS) : (g.lateEnd || Date.now() + G.LATE_BET_MS);
  const round = g.round;
  lateT.set(code, setTimeout(() => {
    lateT.delete(code);
    const x = games[code];
    if (!x || x.phase !== PHASES.SECOND_BETS || x.round !== round || x.lateDropAt) return;
    if (allIn ? G.pendingBetters(x).length > 0 : Date.now() < (x.lateEnd || 0) - 50) return scheduleLate(code);
    lateDropNow(code);
  }, Math.max(0, at - Date.now())));
}
// The last chips drop together; then the table waits for the dealer's Next (the reveal)
function lateDropNow(code) {
  const g = games[code];
  if (!g || g.phase !== PHASES.SECOND_BETS) return;
  clearTimeout(lateT.get(code)); lateT.delete(code);
  try { G.dropLate(g); } catch (e) { console.error('late drop failed', code, e); }
  broadcast(code);
}
function autoAdvanceBets(code) {
  const g = games[code];
  if (!g) return;
  if (g.phase === PHASES.FIRST_BETS) scheduleBlind(code);
  else if (g.phase === PHASES.SECOND_BETS) scheduleLate(code);
}

// Limits, per phone address. New rooms: 6 a minute. Wrong room codes typed on 'join': 40 per 5 minutes, then a
// 2-minute wait. A whole party shares one Wi-Fi address, so the bar is high, and a phone reconnecting to its own
// seat (with its key) never counts and is never blocked.
const MAX_ROOMS = 1500, MISSES_PER_5MIN = 40;
const hits = new Map();   // ip -> { creates: [t], misses: [t], blockedUntil }
function hitsOf(ip) { let h = hits.get(ip); if (!h) hits.set(ip, h = { creates: [], misses: [], blockedUntil: 0 }); return h; }
const recent = (list, ms) => { const now = Date.now(); while (list.length && now - list[0] > ms) list.shift(); return list; };
function wrongCode(ip) { const h = hitsOf(ip); recent(h.misses, 5 * 60000).push(Date.now()); if (h.misses.length >= MISSES_PER_5MIN) { h.blockedUntil = Date.now() + 2 * 60000; h.misses = []; } }
const TOO_MANY = 'Lots of people on this Wi-Fi. Try again in a minute.';
// The phone's address: the first public x-forwarded-for entry (Render puts the real client first)
const PRIVATE_IP = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1$|::$|f[cd][0-9a-f]{0,2}:|fe80:|::ffff:(10|127|192\.168)\.)/i;
function clientIp(req) {
  const xff = String((req && req.headers && req.headers['x-forwarded-for']) || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff.find(a => !PRIVATE_IP.test(a)) || xff[0] || String((req && req.socket && req.socket.remoteAddress) || '');
}
const blocked = (ip) => hitsOf(ip).blockedUntil > Date.now();
const ACKED = new Set(['submit_caption', 'place_bet', 'undo_bet', 'steal', 'react']);   // answered by cid, never applied twice
setInterval(() => { const now = Date.now(); for (const [ip, h] of hits) if (!h.creates.length && !h.misses.length && h.blockedUntil < now) hits.delete(ip); else { recent(h.creates, 60000); recent(h.misses, 5 * 60000); } }, 60000);
/* Same name at the door: "Are you the Chris who was playing, or a different Chris?" A different Chris gets a seat of
   their own ("Chris 2"). 'It's me' takes the old seat only once its phone has been gone 2 minutes, or with the host's
   OK; the old phone is told its seat moved. */
const CLAIM_FREE_MS = 120000;
const BACK_NOTICE_MS = 20000;   // away this long mid-game: the table hears "X's back."
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
  if (existing.key) existing.movedKey = existing.key;
  existing.key = null;
  existing.connected = false;
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
/* The host. Nick, Oct 29 2026: "it said that I was no longer hosting the game and someone else popped up". The host
   never changes while the host is still in the game: a locked or dropped phone keeps the job for G.GONE_MS (15 min).
   Only a host who leaves, or is gone that long, passes it on; one who comes back gets it back. */
function passHost(g, reason) {
  const host = g.players.find(p => p.id === g.hostId);
  const nh = g.players.find(p => p.connected && !p.gone && p.id !== g.hostId);
  if (!nh) return false;
  if (host && !g.origHostId) g.origHostId = host.id;
  g.hostId = nh.id;
  g.notice = { text: `${firstWord(nh.name)} is hosting now.`, at: Date.now() };
  return true;
}

// After a restart: a phone hands back its sealed copy and the room comes back as it was
function resumeTimers(code) {
  const g = games[code];
  if (!g) return;
  if (g.phase === PHASES.WRITING) scheduleWritingEnd(code);
  if (g.phase === PHASES.FIRST_BETS && g.dropAt) later(code, 1500, PHASES.FIRST_BETS, G.afterBlinds);   // the drop already happened: on to the steal
  else autoAdvanceBets(code);
}

const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const sendError = (ws, message) => { if (ws.curCid) ws.curFailed = true; send(ws, ws.curCid ? { type: 'error', message, cid: ws.curCid } : { type: 'error', message }); };
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 12);

wss.on('connection', (ws, req) => {
  let playerId = null;
  const ip = clientIp(req);
  send(ws, { type: 'hello', boot: BOOT });
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('error', (e) => { console.warn('socket error:', e && (e.code || e.message)); });

  const seat = (id, code) => {
    // One room per phone. Moving to another seat or room leaves the old seat offline
    if (playerId && playerId !== id && clients[playerId] && clients[playerId].ws === ws) {
      const oldCode = clients[playerId].gameCode, og = games[oldCode];
      delete clients[playerId];
      const op = og && og.players.find(x => x.id === playerId);
      if (op) { op.connected = false; op.disconnectedAt = Date.now(); if (oldCode !== code) broadcast(oldCode); }
    }
    const old = clients[id];
    if (old && old.ws !== ws) { try { old.ws.close(4000, 'replaced'); } catch (e) {} }
    playerId = id;
    ws.claimId = null;
    clients[id] = { ws, gameCode: code };
    const g = games[code], p = g.players.find(x => x.id === id);
    const away = p && !p.connected && p.disconnectedAt ? Date.now() - p.disconnectedAt : 0;
    if (p) { p.connected = true; p.disconnectedAt = null; p.gone = false; }   // back at the table: deals and all
    if (p && away >= BACK_NOTICE_MS && g.phase !== PHASES.LOBBY) g.notice = { text: `${firstWord(p.name)}’s back.`, at: Date.now() };
    // The host who stepped away gets the room back on return
    if (p && g.origHostId === id && g.hostId !== id) { g.hostId = id; g.origHostId = null; g.notice = { text: `${firstWord(p.name)}’s back, and hosting again.`, at: Date.now() }; }
    if (p && !p.key) p.key = crypto.randomBytes(16).toString('base64url');
    send(ws, { type: 'joined', playerId: id, code, key: p ? p.key : null, boot: BOOT });   // the key never leaves this phone
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
      const timer = G.cleanTimer(msg.timer) ?? G.DEFAULT_TIMER;
      const id = crypto.randomUUID();
      let game; do { game = G.createGame(id, name, timer, Array.isArray(msg.seen) ? msg.seen.slice(0, 200) : []); } while (games[game.code]);
      games[game.code] = game;
      return seat(id, game.code);
    }
    // A phone coming back to its own seat (reconnect), or bringing the room back after a restart (restore), is never
    // slowed or blocked by the per-address limits. A seat answers only to its own key.
    const backToSeat = (code, pid, key) => {
      const game = games[code];
      if (!game) return sendError(ws, 'Game not found');
      const p = game.players.find(x => x.id === pid);
      if (!p) return sendError(ws, 'Player not in game');
      if (p.movedKey && key === p.movedKey && key !== p.key) return send(ws, { type: 'seat_moved' });
      if (p.key && key !== p.key) return sendError(ws, 'Player not in game');
      return seat(p.id, code);
    };
    if (msg.action === 'reconnect') return backToSeat(String(msg.code || '').toUpperCase().trim(), msg.playerId, msg.key);
    if (msg.action === 'restore') {
      // The server restarted; this phone brings the room back from its sealed copy (the first copy in wins; a newer
      // copy replaces a restored one nobody has acted on yet)
      const want = String(msg.code || '').toUpperCase().trim();
      const g = G.unsealGame(msg.data);
      const p = g && g.players.find(x => x.id === msg.playerId);
      if (!g || !p || (p.key && msg.key !== p.key) || (want && g.code !== want)) return backToSeat(want, msg.playerId, msg.key);
      const cur = games[g.code];
      const newer = cur && cur._restoredAt && !cur._actedSince && (g.sealedAt || 0) > (cur.sealedAt || 0) + 1000;
      if (!cur || newer) { games[g.code] = g; g._lastAct = Date.now(); g._restoredAt = Date.now(); console.log('room restored after restart', g.code, g.phase); resumeTimers(g.code); }
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
        const live = !!(clients[existing.id] && clients[existing.id].ws.readyState === 1);
        if (clients[existing.id] && clients[existing.id].ws === ws) return seat(existing.id, code);   // (this phone, tapping Join twice)
        if (msg.as === 'new') {
          if (game.locked) return sendError(ws, 'The host has locked this room');
          const nm = freeName(game, name);
          if (!nm) return sendError(ws, 'Pick a different name');
          const id = crypto.randomUUID(), r = G.addPlayer(game, id, nm);
          if (r.error) return sendError(ws, r.error);
          Stats.joined(msg.via);
          return seat(id, code);
        }
        if (msg.as === 'me') {
          const away = !live && existing.disconnectedAt ? Date.now() - existing.disconnectedAt : 0;
          if (!live && !game.locked && (away >= CLAIM_FREE_MS || existing.gone)) return takeSeat(code, existing, ws);
          if (ws.claimId) dropClaim(ws.claimId);
          const host = game.players.find(p => p.id === game.hostId);
          const hostLive = !!host && host.id !== existing.id && !!clients[host.id] && clients[host.id].ws.readyState === 1;
          const cid = crypto.randomBytes(6).toString('hex');
          ws.claimId = cid;
          claims.set(cid, { ws, code, pid: existing.id, at: Date.now() });
          if (hostLive) { game.seatClaim = { id: cid, pid: existing.id, name: existing.name, oldLive: live, gone: !!existing.gone, awaySecs: Math.round(away / 1000), at: Date.now() }; broadcast(code); }
          return send(ws, { type: 'claim_wait', name: existing.name, host: hostLive ? host.name : null, oldLive: live, secs: !live && !game.locked ? Math.ceil((CLAIM_FREE_MS - away) / 1000) : null });
        }
        return send(ws, { type: 'same_name', name: existing.name, code, playing: game.phase !== PHASES.LOBBY });
      }
      if (game.locked) return sendError(ws, 'The host has locked this room');
      if ((game.shownOut || {})[name.toLowerCase()] > Date.now()) return sendError(ws, 'The host showed you out of this room. Ask them to let you back in.');
      const id = crypto.randomUUID();
      const r = G.addPlayer(game, id, name);
      if (r.error) return sendError(ws, r.error);
      Stats.joined(msg.via);
      return seat(id, code);
    }
    if (msg.action === 'spell') {
      // The writing bar's spelling check (the same as on sending), a few times a second at most
      const now = Date.now(); if (now - (ws.spellAt || 0) < 350) return; ws.spellAt = now;
      const text = String(msg.text || '').slice(0, 200);
      let typos = [];
      if (text.trim()) { try { typos = (Polish.polish(text).typos || []).slice(0, 4); } catch (e) {} }
      return send(ws, { type: 'spell', n: Number(msg.n) || 0, text, typos });
    }
    if (msg.action === 'tally') {
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
    if (!/^(career|seen_sync|gallery_sync|demo_watched)$/.test(String(msg.action))) game._actedSince = true;   // (a restored room that has been played on stays; see 'restore')
    const dealer = game.players[game.dealerIndex];
    const isDealer = !!dealer && dealer.id === playerId;
    const isHost = game.hostId === playerId;
    const fail = (r) => { if (r && r.error) { sendError(ws, r.error); return true; } return false; };

    /* Captions, bets, the steal and Bravos carry an id (cid). Each one is answered (an 'ack', or an error tied to it),
       and one the room has already taken is never applied again: a phone that lost its connection re-sends whatever
       wasn't answered. The room keeps its recent cids (they travel in the sealed copy, so this holds across a restart). */
    const handle = () => handleSeated(msg, game, code, me, isDealer, isHost, fail);
    const cid = ACKED.has(msg.action) && typeof msg.cid === 'string' && /^[A-Za-z0-9_-]{4,40}$/.test(msg.cid) ? msg.cid : null;
    if (!cid) return handle();
    const done = ((game.acks = game.acks || {})[playerId] = game.acks[playerId] || []);
    if (done.includes(cid)) return send(ws, { type: 'ack', cid, dup: true });
    done.push(cid); if (done.length > 24) done.splice(0, done.length - 24);
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

  // After the dealer's one button (or the host's "Move on without <name>"): every phone, and the next step's clock
  const afterStep = (game, code) => {
    broadcast(code);
    if (game.phase === PHASES.WRITING) scheduleWritingEnd(code);
    if (game.phase === PHASES.FIRST_BETS) scheduleBlind(code);
    if (game.phase === PHASES.SECOND_BETS) scheduleLate(code);
  };
  // One tap per step: a tap meant for an earlier step (a double tap, a slow screen) is dropped
  const staleTap = (game, msg) => (msg.phase !== undefined && msg.phase !== game.phase) || (msg.round !== undefined && msg.round !== game.round)
    || (game.phase === PHASES.ANSWER && game.reel && msg.step !== undefined && Number(msg.step) !== game.reel.step)
    || (game.phase === PHASES.REVEAL && msg.flipped !== undefined && !!msg.flipped !== !!game.flipped);

  const handleSeated = (msg, game, code, me, isDealer, isHost, fail) => {
    switch (msg.action) {
      case 'start': {
        if (!isHost) return sendError(ws, 'Only the host can start');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Game already in progress');
        if (game.players.filter(p => p.connected).length < 3) return sendError(ws, 'Need at least 3 players');
        { const c = G.startCheck(game); if (c.error) return sendError(ws, c.error); }
        if (fail(G.startRound(game))) return;
        Stats.started(game.players.filter(G.isSeated).length);
        game.origHostId = null;   // whoever started it hosts it
        broadcast(code);
        scheduleWritingEnd(code);
        return;
      }
      case 'kick_player': case 'remove_player': {
        // The lobby: the seat is freed. Mid-game: the host moves on without them (their score stays; they can come back).
        const targetId = msg.targetPlayerId;
        const kr = G.removePlayer(game, playerId, targetId); if (fail(kr)) return;
        if (!kr.midGame) (game.shownOut = game.shownOut || {})[String(kr.kickedName || '').toLowerCase()] = Date.now() + 10 * 60000;
        const kc = clients[targetId];
        if (kc) { send(kc.ws, { type: 'kicked', message: kr.midGame ? 'The host moved on without you. Join again with the same name to get back in.' : 'The host has shown you out.' }); try { kc.ws.close(); } catch (e) {} delete clients[targetId]; }
        if (kr.midGame && game.phase === PHASES.WRITING && game.submissions.length >= 2 && G.allCaptionsIn(game)) endWriting(game);
        broadcast(code);
        autoAdvanceBets(code);
        return;
      }
      case 'lock': {
        if (!isHost) return sendError(ws, 'Only the host can lock the room');
        game.locked = !!msg.on;
        broadcast(code);
        return;
      }
      case 'claim_answer': {
        // The host lets someone back into a seat on a new phone (or not)
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
        // Only when the host is really gone (left, or away 15 minutes); they get it back when they return
        const h = game.players.find(p => p.id === game.hostId);
        if (isHost || (h && !G.isGone(h))) return;
        if (!game.origHostId && h) game.origHostId = h.id;
        game.hostId = playerId;
        game.notice = { text: `${firstWord(me.name)} is hosting now.`, at: Date.now() };
        broadcast(code);
        return;
      }
      case 'update_settings': {
        if (!isHost) return sendError(ws, 'Only the host can change settings');
        if (fail(G.updateSettings(game, msg.settings || {}))) return;
        broadcast(code);
        return;
      }
      case 'update_timer': {
        if (!isHost) return sendError(ws, 'Only the host can change the timer');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Timer can only be changed in the lobby');
        const t = G.cleanTimer(msg.timer);
        if (t === null) return sendError(ws, 'That didn’t take. Try again.');
        game.timerDuration = t;
        broadcast(code);
        return;
      }
      case 'seen_sync': { fail(G.setPlayerSeen(game, playerId, msg.seen)); return; }
      case 'gallery_sync': {
        const r = G.syncGallery(game, msg.entries);
        if (fail(r)) return;
        if (r.refused) send(ws, { type: 'gallery_purge', below: G.FIRST_LIVE_ID });
        if (r.added) broadcast(code);
        return;
      }
      case 'react': {
        // Bravo! on any caption but your own; nobody sees a count. A majority frames a revealed fake.
        if (fail(G.react(game, playerId, msg.target, msg.kind, msg.on))) return;
        broadcast(code);
        return;
      }
      case 'career': {
        // Each phone keeps its own rating (and the verdict lines it has seen); the server only does the arithmetic
        if (fail(G.setCareer(game, playerId, msg))) return;
        broadcast(code);
        return;
      }
      case 'submit_caption': {
        const mode = ['check', 'fix', 'keep'].includes(msg.mode) ? msg.mode : 'check';
        const r = G.submitCaption(game, playerId, msg.caption, mode);
        if (fail(r)) return;
        if (r.check) { ws.curHeld = true; return send(ws, ws.curCid ? { type: 'caption_check', ...r.check, cid: ws.curCid } : { type: 'caption_check', ...r.check }); }
        broadcast(code);
        if (r.allIn) later(code, 900, PHASES.WRITING, endWriting);
        return;
      }
      case 'mulligan': {
        const r = G.voteMulligan(game, playerId);
        if (fail(r)) return;
        broadcast(code);
        if (r.triggered) scheduleWritingEnd(code);
        return;
      }
      case 'end_writing': {
        // No-timer games: the dealer can stop the writing once two captions are in
        if (!isDealer) return sendError(ws, 'Only the dealer can do that');
        if (game.phase !== PHASES.WRITING) return;
        if (game.submissions.length < 2) return sendError(ws, 'Wait for one more caption. With one, the real one is obvious.');
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
        autoAdvanceBets(code);   // the 'all in' beat waits for them again
        return;
      }
      case 'more_bet_time': {
        // anyone at the table, once per betting stage: +20 s
        const r = G.moreBetTime(game, playerId);
        if (fail(r)) return;
        broadcast(code);
        autoAdvanceBets(code);
        return;
      }
      case 'steal': {
        // The dealer must steal one chip: there is no pass
        if (game.phase !== PHASES.STEAL) return;
        if (!isDealer) return sendError(ws, 'Only the dealer can steal');
        if (msg.betIndex === null || msg.betIndex === undefined) return sendError(ws, 'Tap a chip to steal it');
        if (fail(G.stealChip(game, msg.betIndex))) return;
        broadcast(code);
        return;
      }
      case 'advance': {
        // Only the dealer moves the game on (Nick, Oct 29 2026: "anyone at the table can push a button and it forwards
        // through"). Everyone else is refused.
        if (!isDealer) return sendError(ws, `Waiting for ${firstWord((game.players[game.dealerIndex] || {}).name || 'the dealer')}`);
        if (staleTap(game, msg)) return;
        if (game._advAt && Date.now() - game._advAt < 600) return;   // a double tap
        const r = G.dealerNext(game, false);
        if (r && r.wait) return;
        if (r && r.error) return r.soft ? undefined : sendError(ws, r.error);
        game._advAt = Date.now();
        afterStep(game, code);
        return;
      }
      case 'stand_in': {
        // The only fallback: the dealer's phone has really been off 2+ minutes (or the host moved on without them).
        // The host's phone alone can move on; the app makes the dealer's choices (a random steal).
        if (!G.canStandIn(game, playerId)) return sendError(ws, 'Waiting for the dealer');
        if (staleTap(game, msg)) return;
        if (game._advAt && Date.now() - game._advAt < 600) return;
        const r = G.dealerNext(game, true);
        if (r && r.wait) return;
        if (r && r.error) return r.soft ? undefined : sendError(ws, r.error);
        game._advAt = Date.now();
        afterStep(game, code);
        return;
      }
      case 'ending_next': {
        // Game over: the host taps on through the winner, everyone's rating, then Caption of the Night
        if (!isHost) return sendError(ws, 'The host moves things along');
        if (fail(G.endingNext(game, msg.step))) return;
        broadcast(code);
        return;
      }
      case 'finale_vote': { if (fail(G.voteFinale(game, playerId, msg.key))) return; broadcast(code); return; }
      case 'finale_close': {
        if (!isHost) return sendError(ws, 'The host moves things along');
        if (!game.finale) return;
        G.resolveFinale(game);
        broadcast(code);
        return;
      }
      case 'play_again': {
        if (!isHost) return sendError(ws, 'Only the host can start a new game');
        if (game.phase !== PHASES.SCORES || !game.over) return sendError(ws, 'The game is still going');
        if (Array.isArray(msg.seen)) G.setSeen(game, msg.seen.slice(0, 200));
        G.resetForNewGame(game);
        broadcast(code);
        return;
      }
      case 'leave': {
        // Leaving from the lobby frees the seat; mid-game the seat stays (scores are kept) but no longer deals
        if (game.phase === PHASES.LOBBY) game.players = game.players.filter(p => p.id !== playerId);
        else { me.connected = false; me.disconnectedAt = Date.now(); me.gone = true; }
        if (isHost) { passHost(game); game.origHostId = null; }
        delete clients[playerId];
        playerId = null;
        if (game.phase === PHASES.WRITING && game.submissions.length >= 2 && G.allCaptionsIn(game)) endWriting(game);
        broadcast(code);
        autoAdvanceBets(code);
        return;
      }
    }
  };

  ws.on('close', () => {
    if (ws.claimId) dropClaim(ws.claimId);
    if (!playerId || !clients[playerId] || clients[playerId].ws !== ws) return;
    const code = clients[playerId].gameCode;
    delete clients[playerId];
    const game = games[code];
    if (!game) return;
    const p = game.players.find(x => x.id === playerId);
    if (p) { p.connected = false; p.disconnectedAt = Date.now(); }
    broadcast(code);
  });
});

// Housekeeping every 3 seconds
setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(games)) try {
    const g = games[code];
    // Empty for 30 minutes (10 in the lobby): close the room. Any room idle for 8 hours closes too.
    if (g.players.every(p => !p.connected)) {
      const last = Math.max(0, ...g.players.map(p => p.disconnectedAt || 0));
      if (now - last > (g.phase === PHASES.LOBBY ? 10 : 30) * 60 * 1000) { delete games[code]; continue; }
    }
    if (now - (g._lastAct || g.phaseAt || now) > 8 * 3600 * 1000) { delete games[code]; continue; }
    let changed = false;
    // The host passes on only when the host is gone for good (left, or away 15 minutes)
    const host = g.players.find(p => p.id === g.hostId);
    if ((!host || G.isGone(host, now)) && passHost(g)) changed = true;
    // A phone waiting for the host's OK for a seat: the claim lapses after 3 minutes
    for (const [cid, c] of claims) if (c.code === code && now - c.at > 180000) { dropClaim(cid); try { send(c.ws, { type: 'claim_no', lapsed: true }); } catch (e) {} }
    // Writing: everyone at the table has written; or everyone whose phone is on has, and the rest get a short wait
    if (g.phase === PHASES.WRITING && g.submissions.length >= 2 && G.allCaptionsIn(g)) { endWriting(g); changed = true; }
    if (g.phase === PHASES.WRITING && G.connectedAllIn(g)) { if (!g._allOnAt) g._allOnAt = now; else if (now - g._allOnAt >= G.AWAY_WAIT_MS) { g._allOnAt = 0; endWriting(g); changed = true; } }
    else g._allOnAt = 0;
    // Bets: the only ones not in are phones that are off: a short wait, not the whole clock
    if ((g.phase === PHASES.FIRST_BETS && !g.dropAt) || (g.phase === PHASES.SECOND_BETS && !g.lateDropAt)) {
      if (G.onlyAwayPending(g)) { if (!g._betOnAt) g._betOnAt = now; else if (now - g._betOnAt >= G.AWAY_WAIT_MS) { g._betOnAt = 0; if (g.phase === PHASES.FIRST_BETS) dropNow(code); else lateDropNow(code); continue; } }
      else g._betOnAt = 0;
      if (g.phase === PHASES.FIRST_BETS && !blindT.has(code)) scheduleBlind(code);
      if (g.phase === PHASES.SECOND_BETS && !lateT.has(code)) scheduleLate(code);
    }
    // The host's "Move on without <name>" appears once the dealer's phone has been off 2 minutes
    const si = G.dealerOff(g, now) ? 'si|' + g.round + '|' + g.phase : '';
    if (si !== (g._siTag || '')) { g._siTag = si; changed = true; }
    // The dealer's 'phone off' line: refresh when someone drops or comes back (the 'state' carries it)
    const off = g.players.filter(p => !p.connected).map(p => p.id + (G.isGone(p, now) ? 'g' : '')).join(',');
    if (off !== (g._offTag || '')) { g._offTag = off; changed = true; }
    if (changed) broadcast(code);
  } catch (e) { console.error('housekeeping failed', code, e); }   // one bad room never stops the rest
}, 3000);

// Heartbeat, every 10 s: a socket that didn't answer the last ping is dropped (so "offline" shows up within ~20 s),
// and every phone hears a small 'ping' it can see: a phone that hears nothing for ~20 s reconnects at once.
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

// The tally is written a few seconds after a change; a deploy's stop signal writes it at once
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { try { Stats.flush(); } catch (e) {} process.exit(0); });

// (for the tests: a test can make a dealer's phone look off for longer than it was)
if (process.env.CC_TEST_HOOKS === '1') app.get('/__test/age', (req, res) => {
  const g = games[String(req.query.code || '').toUpperCase()], p = g && g.players.find(x => x.id === req.query.pid);
  if (!p || p.connected) return res.status(404).end();
  p.disconnectedAt = (p.disconnectedAt || Date.now()) - Number(req.query.ms || 0);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('');
  console.log('  CLOSED CAPTION is running.');
  console.log(`  On this computer:            http://localhost:${PORT}`);
  if (LAN_URL) console.log(`  On phones (same Wi-Fi):      ${LAN_URL}`);
  console.log(`  The Gallery (server copy):   ${G.store.count()} captions${G.store.file ? ' (' + G.store.file + ')' : ' (memory only)'}`);
  console.log('  Keep this window open while you play. Close it to stop.');
  console.log('');
});
