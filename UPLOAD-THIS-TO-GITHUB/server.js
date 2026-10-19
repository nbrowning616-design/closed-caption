// server.js — Express + WebSocket server for Closed Caption
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');
const G = require('./game');
const { PHASES } = G;

// Errors are logged as one line of JSON (easy to search in Render's log), and never stop the server
function logError(where, err, extra) {
  try {
    console.error(JSON.stringify({ level: 'error', at: new Date().toISOString(), where, message: String((err && err.message) || err), stack: err && err.stack ? String(err.stack).split('\n').slice(0, 6).join(' | ') : undefined, ...(extra || {}) }));
  } catch (e) { console.error('error', where, err); }
}
process.on('uncaughtException', (err) => logError('uncaughtException', err));
process.on('unhandledRejection', (err) => logError('unhandledRejection', err));

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
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });   // room for one small headshot

// Build id: phones compare it and refresh themselves after an update
const INDEX_PATH = path.join(__dirname, 'public', 'index.html');
const INDEX_HTML = fs.readFileSync(INDEX_PATH, 'utf8');
// (a helper that isn't there yet just counts as empty, so a missing file never stops the server)
const readOr = (f) => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { return ''; } };
// (every public/*.js counts, so a changed helper always reaches the phones)
const PUBLIC_JS = (() => { try { return fs.readdirSync(path.join(__dirname, 'public')).filter(f => f.endsWith('.js')).sort().map(f => 'public/' + f); } catch (e) { return []; } })();
const BUILD = crypto.createHash('sha1').update(INDEX_HTML + ['game.js', 'store.js', ...PUBLIC_JS].map(readOr).join('')).digest('hex').slice(0, 10);
// __V__ busts the phone's cache for the helper scripts after an update
const PAGE = INDEX_HTML.replace('__BUILD__', BUILD).split('__V__').join(BUILD);
app.get('/', (req, res) => { res.set('Cache-Control', 'no-store'); res.type('html').send(PAGE); });
app.get('/index.html', (req, res) => res.redirect('/'));
// For the uptime pinger (keeps the free server awake) and Render's health check: answers at once
app.get('/healthz', (req, res) => { res.set('Cache-Control', 'no-store'); res.type('text/plain').send('ok'); });
// The privacy notice (public/privacy.html), at /privacy as well
const PRIVACY_PATH = path.join(__dirname, 'public', 'privacy.html');
app.get('/privacy', (req, res) => {
  fs.access(PRIVACY_PATH, fs.constants.R_OK, (err) => {
    if (err) return res.status(404).type('text/plain').send('Not found');
    res.set('Cache-Control', 'no-cache');
    res.sendFile('privacy.html', { root: path.join(__dirname, 'public') }, (e) => { if (e && !res.headersSent) res.status(404).type('text/plain').send('Not found'); });
  });
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
// A player's headshot for this room (versioned by ?v=, so phones can cache it)
app.get('/face/:code/:pid', (req, res) => {
  const buf = G.faceOf(games[String(req.params.code || '').toUpperCase()], String(req.params.pid || ''));
  if (!buf) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=86400'); res.type('image/jpeg').send(buf);
});

const games = {};    // code -> game
const clients = {};  // playerId -> { ws, gameCode }

function broadcast(code) {
  const game = games[code];
  if (!game) return;
  for (const p of game.players) {
    const c = clients[p.id];
    if (c && c.ws.readyState === 1) {
      const view = G.getPlayerView(game, p.id);
      view.lanUrl = LAN_URL;
      view.build = BUILD;
      c.ws.send(JSON.stringify({ type: 'state', data: view }));
    }
  }
}

// Run fn later, but only if the game is still where we left it
function later(code, ms, expectPhase, fn) {
  const g0 = games[code];
  if (!g0) return;
  const token = g0.timerToken, round = g0.round;
  setTimeout(() => {
    // A delayed step that goes wrong is logged; the room and every other game carry on
    try {
      const g = games[code];
      if (!g || g.phase !== expectPhase || g.round !== round || g.timerToken !== token) return;
      fn(g);
    } catch (e) { logError('later', e, { code, phase: expectPhase }); }
    try { broadcast(code); } catch (e) { logError('later.broadcast', e, { code }); }
  }, ms);
}

// Writing ends on its own when the clock runs out (with a short grace for phones auto-sending drafts)
function scheduleWritingEnd(code) {
  const game = games[code];
  if (!game || game.phase !== PHASES.WRITING) return;
  later(code, Math.max(0, game.timerEnd - Date.now()) + 2000, PHASES.WRITING, endWriting);
}
function endWriting(g) {
  const r = G.finishWriting(g);
  if (r.empty) {
    // Nobody wrote anything: same round, fresh cartoon, same dealer
    G.startRound(g, { sameRound: true });
    setTimeout(() => { try { scheduleWritingEnd(g.code); } catch (e) { logError('scheduleWritingEnd', e, { code: g.code }); } }, 0);
  }
}

// When the last chip of a betting stage lands, move on by itself after a beat
function autoAdvanceBets(code) {
  const g = games[code];
  if (!g) return;
  // 'All chips are down' gets a beat to land (and the last bettor a moment to undo) before the table moves on
  if (g.phase === PHASES.FIRST_BETS && G.pendingBetters(g).length === 0) later(code, 3200, PHASES.FIRST_BETS, (x) => G.pendingBetters(x).length ? null : G.moveToReveal(x));
  if (g.phase === PHASES.SECOND_BETS && G.pendingBetters(g).length === 0) later(code, 3200, PHASES.SECOND_BETS, (x) => G.pendingBetters(x).length ? null : G.moveFromSecondBets(x));
}

// Frame It: count the picks once, then the scoreboard comes by itself after the ceremony
function resolveFrames(code) {
  const g = games[code];
  if (!g || g.phase !== PHASES.FRAMING || g.frameResult) return false;
  const r = G.resolveFraming(g);
  if (r.error) return false;
  later(code, Math.max(0, r.endsAt - Date.now()), PHASES.FRAMING, G.moveToScoreboard);
  return true;
}

const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const sendError = (ws, message, extra) => send(ws, { type: 'error', message, ...(extra || {}) });
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 20);

/* ── Seat keys ──
   Everyone at the table sees each player's public id (it colours chips, names bets, etc.). Acting as a seat needs
   that seat's private key: made here, sent only to that phone (in 'joined'), kept in its localStorage, and stored
   on the server only as a fingerprint (game.seatHash[id]). It never appears in any state sent to any phone. */
const newSeatKey = () => crypto.randomBytes(32).toString('base64url');
const hashKey = (k) => crypto.createHash('sha256').update(String(k)).digest('base64url');
function keyFits(game, id, key) {
  const want = game && game.seatHash && game.seatHash[id];
  if (!want || typeof key !== 'string' || key.length < 20 || key.length > 100) return false;
  const a = Buffer.from(hashKey(key)), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function giveKey(game, id) { const k = newSeatKey(); (game.seatHash = game.seatHash || {})[id] = hashKey(k); return k; }

/* ── Room limits ── */
const MAX_ROOMS = 3000;                                   // a safety cap for the whole server
const CREATE_PER_CONN = { n: 5, ms: 60 * 1000 };          // one phone: 5 new rooms a minute
const CREATE_PER_IP = { n: Number(process.env.CREATE_LIMIT_PER_IP) || 30, ms: 10 * 60 * 1000 };      // one network (a whole house on one Wi-Fi): 30 per 10 minutes
const ipCreates = new Map();                              // ip -> [times]
function allowCreate(ws) {
  const now = Date.now();
  ws.creates = (ws.creates || []).filter(t => now - t < CREATE_PER_CONN.ms);
  const ipList = (ipCreates.get(ws.ip) || []).filter(t => now - t < CREATE_PER_IP.ms);
  if (ws.creates.length >= CREATE_PER_CONN.n || ipList.length >= CREATE_PER_IP.n) return 'Too many new rooms — wait a minute and try again';
  if (Object.keys(games).length >= MAX_ROOMS) return 'The server is very busy — try again in a few minutes';
  ws.creates.push(now); ipList.push(now); ipCreates.set(ws.ip, ipList);
  return null;
}
const IDLE_EMPTY_MS = 30 * 60 * 1000;     // nobody connected for 30 minutes: the room closes
const IDLE_LOBBY_MS = 2 * 3600 * 1000;    // a lobby nobody has touched for 2 hours: the room closes
const IDLE_ANY_MS = 6 * 3600 * 1000;      // any room nobody has touched for 6 hours: the room closes
const touch = (game) => { if (game) game.touchedAt = Date.now(); };
const closedCodes = new Map();            // rooms this server closed (code -> when), so a returning phone hears 'it closed', not 'the server restarted'
function forgetRoom(code) { delete games[code]; closedCodes.set(code, Date.now()); }

// A seat goes offline (its phone moved to another room, left, or dropped)
function markAway(code, id) {
  const game = games[code];
  if (!game) return;
  const p = game.players.find(x => x.id === id);
  if (p && p.connected) { p.connected = false; p.disconnectedAt = Date.now(); }
  G.clearVoice(game, id);
  broadcast(code);
}

/* ── Stale taps ──
   Every move-the-table-along tap carries the screen the phone was on: phase, round and step
   (the reveal reel's step on the answer; 0/1 for Frame It before/after the frames are counted).
   A tap from an older screen (a double tap landing on the next stage) is ignored. */
function stepTag(game) {
  if (game.phase === PHASES.ANSWER) return game.reel ? game.reel.step : 0;
  if (game.phase === PHASES.FRAMING) return game.frameResult ? 1 : 0;
  return 0;
}
const NEEDS_TAG = new Set(['advance', 'reel_next', 'reel_prev', 'reel_skip']);           // must say where they were
const CHECK_TAG = new Set(['start', 'end_writing', 'skip_better', 'steal', 'play_again', 'finale_open', 'finale_close']);   // checked when they do
function isStale(game, msg) {
  const has = msg.phase !== undefined || msg.round !== undefined;
  if (!has) return NEEDS_TAG.has(msg.action);
  if (!NEEDS_TAG.has(msg.action) && !CHECK_TAG.has(msg.action)) return false;
  if (msg.phase !== game.phase || Number(msg.round) !== game.round) return true;
  if (msg.step !== undefined && msg.step !== null && Number(msg.step) !== stepTag(game)) return true;
  if (msg.action === 'skip_better' && msg.better !== undefined && msg.better !== G.currentBetterId(game)) return true;
  return false;
}

wss.on('connection', (ws, req) => {
  let playerId = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  // The phone's network address (for the room-creation limit): the proxy's own headers first, then X-Forwarded-For
  try {
    const h = (req && req.headers) || {};
    ws.ip = String(h['cf-connecting-ip'] || h['true-client-ip'] || String(h['x-forwarded-for'] || '').split(',')[0] || '').trim() || (req && req.socket && req.socket.remoteAddress) || '?';
  } catch (e) { ws.ip = '?'; }

  // key: this seat's private key (sent back only to this phone)
  const seat = (id, code, key) => {
    // One room per phone: the seat this connection held before (another room, or another seat) goes offline
    if (playerId && playerId !== id && clients[playerId] && clients[playerId].ws === ws) {
      const prev = clients[playerId].gameCode;
      delete clients[playerId];
      markAway(prev, playerId);
    }
    const old = clients[id];
    if (old && old.ws !== ws) { try { old.ws.close(4000, 'replaced'); } catch (e) {} }
    playerId = id;
    clients[id] = { ws, gameCode: code };
    const p = games[code].players.find(x => x.id === id);
    if (p) { p.connected = true; p.disconnectedAt = null; }
    G.clearVoice(games[code], id);   // a fresh connection starts outside the voice call (the phone re-joins it)
    touch(games[code]);
    send(ws, { type: 'joined', playerId: id, code, seatKey: key });
    broadcast(code);
  };
  // A phone that's starting over somewhere else tells us the seat it had (proved by its key): that seat goes offline
  const releasePrev = (prev) => {
    if (!prev || typeof prev !== 'object') return;
    const code = String(prev.code || '').toUpperCase().trim(), id = String(prev.playerId || ''), game = games[code];
    if (!game || !keyFits(game, id, prev.seatKey)) return;
    const c = clients[id];
    // An old connection still open for that seat (a frozen tab, or a dead phone not noticed yet) is let go;
    // a tab that really is still open just reconnects to it by itself
    if (c && c.ws !== ws) { try { c.ws.close(4000, 'replaced'); } catch (e) {} }
    if (c) delete clients[id];
    if (playerId === id) playerId = null;
    markAway(code, id);
  };

  // One bad message must never take the whole server down
  let lastAction = null;
  ws.on('message', (raw) => { try { onMessage(raw); } catch (e) { logError('message', e, { action: lastAction }); try { sendError(ws, 'Something went wrong'); } catch (e2) {} } });
  const onMessage = (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (typeof msg.action !== 'string' && msg.type === 'deleteHeadshot') msg.action = 'deleteHeadshot';   // the 'Delete my photo' button
    if (typeof msg.action !== 'string') return;
    lastAction = msg.action;

    // Actions that don't need a seat yet
    if (msg.action === 'create') {
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      const timer = [60, 90, 120, 180].includes(msg.timer) ? msg.timer : 90;
      const limited = allowCreate(ws);
      if (limited) return sendError(ws, limited);
      releasePrev(msg.prev);
      const id = crypto.randomUUID();
      let game; do { game = G.createGame(id, name, timer, Array.isArray(msg.seen) ? msg.seen.slice(0, 200) : []); } while (games[game.code]);
      games[game.code] = game;
      return seat(id, game.code, giveKey(game, id));
    }
    if (msg.action === 'reconnect') {
      const code = String(msg.code || '').toUpperCase().trim();
      const game = games[code];
      // gone: the room isn't on this server (it restarted, or the room closed) — the phone offers Restore
      if (!game) return sendError(ws, 'Game not found', { gone: closedCodes.has(code) ? 'closed' : 'restart', code });
      const id = String(msg.playerId || '');
      if (!game.players.some(p => p.id === id)) return sendError(ws, 'Player not in game');
      if (!keyFits(game, id, msg.seatKey)) return sendError(ws, 'Player not in game');   // only the phone holding the seat's key
      return seat(id, code, msg.seatKey);
    }
    if (msg.action === 'restore') {
      // The host's phone brings the room back after a server restart (same code, same scores; next round)
      const snap = msg.snapshot;
      const code = String((snap && snap.code) || '').toUpperCase().trim();
      const live = games[code];
      if (live) {
        // Already back (someone restored it first): this is just a rejoin
        const sid = String((snap && snap.hostId) || '');
        if (live.players.some(p => p.id === sid) && keyFits(live, sid, msg.seatKey)) return seat(sid, code, msg.seatKey);
        return sendError(ws, 'That room code is in use');
      }
      const limited = allowCreate(ws);
      if (limited) return sendError(ws, limited);
      const r = G.gameFromSnapshot(snap);
      if (r.error) return sendError(ws, r.error);
      if (typeof msg.seatKey !== 'string' || hashKey(msg.seatKey) !== r.hostKh) return sendError(ws, 'Only the host’s phone can restore this game');
      touch(r.game);
      games[code] = r.game;
      console.log(JSON.stringify({ level: 'info', at: new Date().toISOString(), event: 'restored', code, players: r.game.players.length, round: r.game.round }));
      return seat(r.game.hostId, code, msg.seatKey);
    }
    if (msg.action === 'join') {
      const code = String(msg.code || '').toUpperCase().trim();
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      const game = games[code];
      if (!game) return sendError(ws, 'Game not found');
      const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        // This phone holds the seat's key: an ordinary rejoin
        if (keyFits(game, existing.id, msg.seatKey)) { releasePrev(msg.prev); return seat(existing.id, code, msg.seatKey); }
        // Same name = same seat (lets someone whose phone died rejoin from a new phone).
        // Only when that seat is offline right now; the seat gets a new key (the old phone's key stops working).
        if (existing.connected && clients[existing.id] && clients[existing.id].ws.readyState === 1) return sendError(ws, 'Someone is already playing as ' + existing.name);
        releasePrev(msg.prev);
        return seat(existing.id, code, giveKey(game, existing.id));
      }
      const id = crypto.randomUUID();
      const r = G.addPlayer(game, id, name);
      if (r.error) return sendError(ws, r.error);
      releasePrev(msg.prev);
      return seat(id, code, giveKey(game, id));
    }

    if (!playerId || !clients[playerId]) return;
    const code = clients[playerId].gameCode;
    const game = games[code];
    if (!game) return;
    const me = game.players.find(p => p.id === playerId);
    if (!me) return;
    touch(game);
    // A tap from a screen that's already gone (a double tap): ignore it, and bring that phone up to date
    if (isStale(game, msg)) {
      const view = G.getPlayerView(game, playerId); view.lanUrl = LAN_URL; view.build = BUILD;
      return send(ws, { type: 'state', data: view, stale: msg.action });
    }
    const dealer = game.players[game.dealerIndex];
    const isDealer = !!dealer && dealer.id === playerId;
    const isHost = game.hostId === playerId;
    const dealerAway = dealer && !dealer.connected && dealer.disconnectedAt ? (Date.now() - dealer.disconnectedAt) / 1000 : 0;
    const canRun = isDealer || isHost || dealerAway >= G.TAKEOVER_SECS;   // may move the table along
    const fail = (r) => { if (r && r.error) { sendError(ws, r.error); return true; } return false; };

    switch (msg.action) {
      case 'start': {
        if (!isHost) return sendError(ws, 'Only the host can start');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Game already in progress');
        if (game.players.filter(p => p.connected).length < 3) return sendError(ws, 'Need at least 3 players');
        G.startRound(game);
        broadcast(code);
        scheduleWritingEnd(code);
        return;
      }
      case 'kick_player': {
        const targetId = msg.targetPlayerId;
        if (fail(G.kickPlayer(game, playerId, targetId))) return;
        G.clearVoice(game, targetId);
        if (game.seatHash) delete game.seatHash[targetId];
        const kc = clients[targetId];
        if (kc) { send(kc.ws, { type: 'kicked', message: 'The host removed you from the game' }); try { kc.ws.close(); } catch (e) {} delete clients[targetId]; }
        broadcast(code);
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
      case 'set_face': {
        // The phone checks it's a headshot before sending; the server only checks it's a small JPEG
        if (fail(G.setFace(game, playerId, msg.data === null ? null : msg.data))) return;
        broadcast(code);
        return;
      }
      case 'deleteHeadshot': {
        // 'Delete my photo': this seat's headshot is gone from the room (it was only ever kept in memory)
        if (fail(G.setFace(game, playerId, null))) return;
        broadcast(code);
        return;
      }
      case 'gallery_sync': {
        const r = G.syncGallery(game, msg.entries);
        if (fail(r)) return;
        if (r.added) broadcast(code);
        return;
      }
      case 'move_seat': {
        if (fail(G.moveSeat(game, playerId, msg.targetPlayerId, Number(msg.dir)))) return;
        broadcast(code);
        return;
      }
      case 'frame_pick': {
        // One secret pick per cartoon (or 'pass'); when everyone here has decided, the frames are counted
        const r = G.pickFrame(game, playerId, msg.target);
        if (fail(r)) return;
        if (r.allIn) resolveFrames(code);
        broadcast(code);
        return;
      }
      case 'react': {
        // Anyone, on any caption (their own too); counts only until the answer
        if (fail(G.react(game, playerId, msg.target, msg.kind))) return;
        broadcast(code);
        return;
      }
      case 'reel_next': case 'reel_prev': case 'reel_skip': {
        // The dealer paces the answer, one caption at a time
        if (!canRun) return sendError(ws, 'The dealer runs the reveal');
        // Nobody skips ahead while the whole table is still watching the Claw
        // The full heist (first steal of the game, or a steal off the real caption) or the short show: st.stealShow / st.showMs
        const st = game.steal, showMs = st && st.at && st.victimId ? (st.showMs || G.STEAL_SHOW_MS.full) + 1200 : 0;
        if (msg.action === 'reel_next' && game.reel && game.reel.step === 1 && showMs && Date.now() < st.at + showMs) return sendError(ws, 'Let the Claw finish');
        if (fail(G.reelStep(game, msg.action.slice(5)))) return;
        broadcast(code);
        return;
      }
      case 'career': {
        // Each phone keeps its own career; we just pass the rank around the table
        const rank = msg.rank === undefined ? null : msg.rank;
        if (fail(G.setCareer(game, playerId, rank, msg.rockets, msg.total))) return;
        broadcast(code);
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
        if (![60, 90, 120, 180].includes(t)) return sendError(ws, 'Invalid timer');
        game.timerDuration = t;
        broadcast(code);
        return;
      }
      case 'submit_caption': {
        const mode = ['check', 'fix', 'keep'].includes(msg.mode) ? msg.mode : 'check';
        const r = G.submitCaption(game, playerId, msg.caption, mode);
        if (fail(r)) return;
        if (r.check) return send(ws, { type: 'caption_check', ...r.check });
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
        if (!canRun) return sendError(ws, 'Only the dealer or host can do that');
        if (game.phase !== PHASES.WRITING) return;
        if (game.submissions.length === 0) return sendError(ws, 'Nobody has written anything yet');
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
        return;
      }
      case 'skip_better': {
        // Anyone can skip a player whose phone has dropped; otherwise dealer/host only
        const cur = game.players.find(p => p.id === G.currentBetterId(game));
        if (!canRun && !(cur && !cur.connected)) return sendError(ws, 'Only the dealer or host can skip a turn');
        if (fail(G.skipCurrentBetter(game))) return;
        broadcast(code);
        autoAdvanceBets(code);
        return;
      }
      case 'steal': {
        if (game.phase !== PHASES.STEAL) return;
        if (!isDealer && !(dealerAway >= G.TAKEOVER_SECS)) return sendError(ws, 'Only the dealer can steal');
        // A stand-in for a missing dealer can only pass
        const idx = isDealer ? msg.betIndex : null;
        if (fail(G.stealChip(game, idx === undefined ? null : idx))) return;
        broadcast(code);
        return;
      }
      case 'advance': {
        switch (game.phase) {
          case PHASES.READING:
            if (!canRun) return sendError(ws, 'The dealer starts the betting');
            G.moveToFirstBets(game); break;
          case PHASES.FIRST_BETS:
            if (!canRun) return sendError(ws, 'Only the dealer or host can do that');
            G.moveToReveal(game); break;
          case PHASES.REVEAL:
            if (!canRun) return sendError(ws, 'The dealer moves things along');
            G.moveFromReveal(game); break;
          case PHASES.SECOND_BETS:
            if (!canRun) return sendError(ws, 'Only the dealer or host can do that');
            G.moveFromSecondBets(game); break;
          case PHASES.ANSWER:
            // The table lingers on the answer: only the dealer (or host, or a stand-in) moves on, to Frame It
            if (!canRun) return sendError(ws, 'The dealer moves things along');
            if (fail(G.moveToFraming(game))) return;   // not until the reel reaches the recap
            break;
          case PHASES.FRAMING:
            // 'Move on' counts the picks now; once they're counted, straight to the scoreboard
            if (!canRun) return sendError(ws, 'The dealer moves things along');
            if (!game.frameResult) resolveFrames(code);
            else if (fail(G.moveToScoreboard(game))) return;
            break;
          case PHASES.SCORES: {
            const nd = game.players[G.nextDealerIndex(game, game.dealerIndex)];
            if (!canRun && !(nd && nd.id === playerId)) return sendError(ws, 'Waiting for the next dealer');
            if (G.isGameOver(game)) return;
            G.startRound(game);
            broadcast(code);
            scheduleWritingEnd(code);
            return;
          }
          default: return;
        }
        broadcast(code);
        return;
      }
      case 'finale_open': {
        // After the Grand Poobah: the host (or a stand-in) opens tonight's Gallery for every phone
        if (!canRun) return sendError(ws, 'The host opens the Gallery');
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
        G.resetForNewGame(game);
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
        if (game.phase === PHASES.LOBBY && !isHost) { game.players = game.players.filter(p => p.id !== playerId); if (game.seatHash) delete game.seatHash[playerId]; }
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
    try {
      if (!playerId || !clients[playerId] || clients[playerId].ws !== ws) return;
      const code = clients[playerId].gameCode;
      delete clients[playerId];
      const game = games[code];
      if (!game) return;
      const p = game.players.find(x => x.id === playerId);
      if (p) { p.connected = false; p.disconnectedAt = Date.now(); }
      G.clearVoice(game, playerId);
      broadcast(code);
    } catch (e) { logError('close', e); }
  });
  ws.on('error', (e) => logError('ws', e));
});
wss.on('error', (e) => logError('wss', e));
server.on('error', (e) => logError('http', e));

// Close a room: anyone still connected is told, and sent home
function closeRoom(code, why) {
  const g = games[code];
  forgetRoom(code);
  if (!g) return;
  for (const p of g.players) {
    const c = clients[p.id];
    if (c && c.gameCode === code) { try { send(c.ws, { type: 'kicked', message: why }); } catch (e) {} delete clients[p.id]; }
  }
}

// Housekeeping every 3 seconds
setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(games)) try {
    const g = games[code];
    // Empty for 30 minutes: close the room
    if (g.players.every(p => !p.connected)) {
      const last = Math.max(g.touchedAt || 0, ...g.players.map(p => p.disconnectedAt || 0));
      if (now - last > IDLE_EMPTY_MS) { forgetRoom(code); continue; }
    }
    // Nobody has touched it for hours: close the room
    const idle = now - (g.touchedAt || g.phaseAt || now);
    if ((g.phase === PHASES.LOBBY && idle > IDLE_LOBBY_MS) || idle > IDLE_ANY_MS) { closeRoom(code, 'This room closed after sitting idle for a while. Start a new one any time!'); continue; }
    let changed = false;
    // Host gone for a minute: the next person here becomes host (so someone can start / play again)
    const host = g.players.find(p => p.id === g.hostId);
    if ((!host || (!host.connected && host.disconnectedAt && now - host.disconnectedAt > 60000))) {
      const nh = g.players.find(p => p.connected);
      if (nh && nh.id !== g.hostId) { g.hostId = nh.id; changed = true; }
    }
    // Writing: everyone still here has written (a phone that went away no longer holds it up)
    if (g.phase === PHASES.WRITING && g.submissions.length && G.allCaptionsIn(g)) { endWriting(g); changed = true; }
    // Betting: skip a player whose phone has been gone 10+ seconds
    if (g.phase === PHASES.FIRST_BETS || g.phase === PHASES.SECOND_BETS) {
      const cur = g.players.find(p => p.id === G.currentBetterId(g));
      if (cur && !cur.connected && cur.disconnectedAt && now - cur.disconnectedAt > 10000) {
        G.skipCurrentBetter(g); changed = true; autoAdvanceBets(code);
      }
    }
    // Frame It: a phone that went away no longer holds it up
    if (g.phase === PHASES.FRAMING && !g.frameResult && G.allFramesIn(g)) { resolveFrames(code); changed = true; }
    // Keep "dealer is away" countdowns fresh
    if (changed || g.players.some(p => !p.connected && p.disconnectedAt && now - p.disconnectedAt < 120000)) broadcast(code);
  } catch (e) { logError('housekeeping', e, { code }); }   // one bad room never stops the rest
  // Forget old room-creation counts, and rooms closed more than 12 hours ago
  try { for (const [c, t] of closedCodes) if (now - t > 12 * 3600 * 1000 || games[c]) closedCodes.delete(c); } catch (e) {}
  try { for (const [ip, list] of ipCreates) { const keep = list.filter(t => now - t < CREATE_PER_IP.ms); if (keep.length) ipCreates.set(ip, keep); else ipCreates.delete(ip); } } catch (e) { logError('housekeeping.ip', e); }
}, 3000);

// Drop dead connections so "offline" shows up quickly
setInterval(() => {
  try {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) { try { ws.terminate(); } catch (e) {} return; }
      ws.isAlive = false;
      try { ws.ping(); } catch (e) {}
    });
  } catch (e) { logError('ping', e); }
}, 15000);

// Test-only (never on unless CC_TEST_HOOKS=1): make a delayed step throw, to prove the server survives it
if (process.env.CC_TEST_HOOKS === '1') {
  app.get('/__test/throw-later/:code', (req, res) => {
    const code = String(req.params.code || '').toUpperCase(), g = games[code];
    if (!g) return res.status(404).send('no room');
    later(code, 50, g.phase, () => { throw new Error('test: a delayed step blew up'); });
    setTimeout(() => { throw new Error('test: an uncaught timer error'); }, 80);
    Promise.reject(new Error('test: an unhandled rejection'));
    res.send('ok');
  });
  app.get('/__test/age/:code/:ms', (req, res) => {
    const g = games[String(req.params.code || '').toUpperCase()];
    if (!g) return res.status(404).send('no room');
    const ms = Number(req.params.ms) || 0;
    g.touchedAt -= ms; g.players.forEach(p => { if (p.disconnectedAt) p.disconnectedAt -= ms; });
    res.send('ok');
  });
  app.get('/__test/rooms', (req, res) => res.json({ rooms: Object.keys(games).length, rss: process.memoryUsage().rss }));
}

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
