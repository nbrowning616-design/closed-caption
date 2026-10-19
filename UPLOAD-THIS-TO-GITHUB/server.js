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
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

const games = {};    // code -> game
const clients = {};  // playerId -> { ws, gameCode }

function broadcast(code) {
  const game = games[code];
  if (!game) return;
  // #6: every phone keeps a sealed copy of the room, refreshed on each new stage (or every 20 s), to hand back after a restart
  const tag = game.phase + '|' + game.round + '|' + (game.reel ? game.reel.step : '') + '|' + game.players.length + '|' + (game.frameResult ? 1 : 0) + '|' + (game.finale ? (game.finale.winner || 'v') : '');
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
      g.notice = { text: 'One caption isn’t a game. Thirty more seconds.', at: Date.now() };
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

// #4 / #51: limits, per phone address. New rooms: 6 a minute. Wrong room codes: 12 per 5 minutes, then a 2-minute wait.
const MAX_ROOMS = 1500;
const hits = new Map();   // ip -> { creates: [t], misses: [t], blockedUntil }
function hitsOf(ip) { let h = hits.get(ip); if (!h) hits.set(ip, h = { creates: [], misses: [], blockedUntil: 0 }); return h; }
const recent = (list, ms) => { const now = Date.now(); while (list.length && now - list[0] > ms) list.shift(); return list; };
function wrongCode(ip) { const h = hitsOf(ip); recent(h.misses, 5 * 60000).push(Date.now()); if (h.misses.length >= 12) { h.blockedUntil = Date.now() + 2 * 60000; h.misses = []; } }
const blocked = (ip) => hitsOf(ip).blockedUntil > Date.now();
setInterval(() => { const now = Date.now(); for (const [ip, h] of hits) if (!h.creates.length && !h.misses.length && h.blockedUntil < now) hits.delete(ip); else { recent(h.creates, 60000); recent(h.misses, 5 * 60000); } }, 60000);
const TAKE_SEAT_SECS = 30;   // #26: a seat can only be claimed by name once its phone has been gone this long

// After a restart: a phone hands back its sealed copy and the room comes back as it was
function resumeTimers(code) {
  const g = games[code];
  if (!g) return;
  if (g.phase === PHASES.WRITING) scheduleWritingEnd(code);
  if (g.phase === PHASES.FIRST_BETS || g.phase === PHASES.SECOND_BETS) autoAdvanceBets(code);
  if (g.phase === PHASES.FRAMING && g.frameResult) later(code, Math.max(1500, g.frameResult.endsAt - Date.now()), PHASES.FRAMING, G.moveToScoreboard);
}

const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const sendError = (ws, message) => send(ws, { type: 'error', message });
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 12);

wss.on('connection', (ws, req) => {
  let playerId = null;
  const ip = String((req && req.headers['x-forwarded-for']) || (req && req.socket && req.socket.remoteAddress) || '').split(',')[0].trim();
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
    clients[id] = { ws, gameCode: code };
    const p = games[code].players.find(x => x.id === id);
    if (p) { p.connected = true; p.disconnectedAt = null; }
    G.clearVoice(games[code], id);   // a fresh connection starts outside the voice call (the phone re-joins it)
    if (p && !p.key) p.key = crypto.randomBytes(16).toString('base64url');
    send(ws, { type: 'joined', playerId: id, code, key: p ? p.key : null, boot: BOOT });   // #2: the key never leaves this phone; everyone else only ever sees the public id
    broadcast(code);
  };

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
    if (msg.action === 'reconnect') {
      const code = String(msg.code || '').toUpperCase().trim();
      if (blocked(ip)) return sendError(ws, 'Too many tries. Wait a minute.');
      const game = games[code];
      if (!game) return sendError(ws, 'Game not found');
      const p = game.players.find(x => x.id === msg.playerId);
      if (!p) return sendError(ws, 'Player not in game');
      if (p.key && msg.key !== p.key) { wrongCode(ip); return sendError(ws, 'Player not in game'); }   // #2: a seat answers only to its own phone
      return seat(p.id, code);
    }
    if (msg.action === 'restore') {
      // #6: the server restarted; this phone brings the room back from its sealed copy
      const g = G.unsealGame(msg.data);
      if (!g) return sendError(ws, 'Game not found');
      const p = g.players.find(x => x.id === msg.playerId);
      if (!p || (p.key && msg.key !== p.key)) return sendError(ws, 'Game not found');
      if (!games[g.code]) { games[g.code] = g; g._lastAct = Date.now(); console.log('room restored after restart', g.code, g.phase); resumeTimers(g.code); }
      else if (!games[g.code].players.some(x => x.id === p.id && x.key === p.key)) return sendError(ws, 'Game not found');
      return seat(p.id, g.code);
    }
    if (msg.action === 'join') {
      const code = String(msg.code || '').toUpperCase().trim();
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      if (blocked(ip)) return sendError(ws, 'Too many tries. Wait a minute.');
      const game = games[code];
      if (!game) { wrongCode(ip); return sendError(ws, 'Game not found'); }
      const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        // Same name = same seat (lets someone whose phone died rejoin from a new phone).
        // #26: only once that seat's phone has been gone a while, never in a locked room, and the table is told.
        if (existing.connected && clients[existing.id] && clients[existing.id].ws.readyState === 1) return sendError(ws, existing.name + ' is already at the table');
        if (game.locked) return sendError(ws, 'The host has locked this room');
        const away = existing.disconnectedAt ? (Date.now() - existing.disconnectedAt) / 1000 : 0;
        if (!existing.connected && away < TAKE_SEAT_SECS) return sendError(ws, `${existing.name}’s phone only just dropped. Try again in ${Math.ceil(TAKE_SEAT_SECS - away)} seconds.`);
        existing.key = null;   // the old phone's key stops working
        game.notice = { text: `${existing.name} is back, on a different phone.`, at: Date.now() };
        return seat(existing.id, code);
      }
      if (game.locked) return sendError(ws, 'The host has locked this room');
      const id = crypto.randomUUID();
      const r = G.addPlayer(game, id, name);
      if (r.error) return sendError(ws, r.error);
      return seat(id, code);
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

    switch (msg.action) {
      case 'start': {
        if (!isHost) return sendError(ws, 'Only the host can start');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Game already in progress');
        if (game.players.filter(p => p.connected).length < 3) return sendError(ws, 'Need at least 3 players');
        { const c = G.startCheck(game); if (c.error) return sendError(ws, c.error); }   // the new deck is still being drawn: never start a game that would run out
        if (fail(G.startRound(game))) return;
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
        const st = game.steal, showMs = st && st.at && st.victimId ? (st.stealShow === 'short' ? 6000 + 400 : 12400 + 1200) : 0;   // the full heist (12.4s) or the short stamp (6s), + the phones' start lead and a margin
        if (msg.action === 'reel_next' && game.reel && game.reel.step === 1 && showMs && Date.now() < st.at + showMs) return sendError(ws, 'Let the thief finish');
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
      case 'verdicts_done': {
        // Game over: the dealer/host taps on from the rating verdicts to the Grand Poobah
        if (!canRun) return sendError(ws, 'The dealer moves things along');
        if (fail(G.closeVerdicts(game))) return;
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
        if (G.cleanTimer(msg.timer) === null) return sendError(ws, 'That didn’t take. Try again.');   // [settings] 0 (no timer) or 30 s – 10 min
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
        if (msg.framed !== undefined && game.phase === PHASES.FRAMING && !!msg.framed !== !!game.frameResult) return;
        if (game._advAt && Date.now() - game._advAt < 1200) return;
        game._advAt = Date.now();
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
            if (fail(G.startRound(game))) return;
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
    // Host gone for a minute: the next person here becomes host (so someone can start / play again)
    const host = g.players.find(p => p.id === g.hostId);
    if ((!host || (!host.connected && host.disconnectedAt && now - host.disconnectedAt > 60000))) {
      const nh = g.players.find(p => p.connected);
      if (nh && nh.id !== g.hostId) { g.hostId = nh.id; changed = true; }
    }
    // Writing: everyone still here has written (a phone that went away no longer holds it up)
    if (g.phase === PHASES.WRITING && g.submissions.length >= 2 && G.allCaptionsIn(g)) { endWriting(g); changed = true; }
    // #28: a dealer who wanders off doesn't freeze the steal: it passes by itself after 45 s
    if (g.phase === PHASES.STEAL && g.phaseAt && now - g.phaseAt > 45000) { G.stealChip(g, null); changed = true; }
    // Betting: skip a player whose phone has been gone 45+ seconds
    if (g.phase === PHASES.FIRST_BETS || g.phase === PHASES.SECOND_BETS) {
      const cur = g.players.find(p => p.id === G.currentBetterId(g));
      if (cur && !cur.connected && cur.disconnectedAt && now - cur.disconnectedAt > 45000) {   // 45 s: switching to Messages or a locked phone doesn't cost your turn
        G.skipCurrentBetter(g); changed = true; autoAdvanceBets(code);
      }
    }
    // Frame It: a phone that went away no longer holds it up
    if (g.phase === PHASES.FRAMING && !g.frameResult && G.allFramesIn(g)) { resolveFrames(code); changed = true; }
    // Keep "dealer is away" countdowns fresh
    if (changed || g.players.some(p => !p.connected && p.disconnectedAt && now - p.disconnectedAt < 120000)) broadcast(code);
  } catch (e) { console.error('housekeeping failed', code, e); }   // one bad room never stops the rest
}, 3000);

// Drop dead connections so "offline" shows up quickly
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) { try { ws.terminate(); } catch (e) {} return; }
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {}
  });
}, 15000);

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
