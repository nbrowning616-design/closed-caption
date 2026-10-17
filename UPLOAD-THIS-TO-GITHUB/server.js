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
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

// Build id: phones compare it and refresh themselves after an update
const INDEX_PATH = path.join(__dirname, 'public', 'index.html');
const INDEX_HTML = fs.readFileSync(INDEX_PATH, 'utf8');
// (a helper that isn't there yet just counts as empty, so a missing file never stops the server)
const readOr = (f) => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { return ''; } };
const BUILD = crypto.createHash('sha1').update(INDEX_HTML + ['game.js', 'store.js', 'public/fx.js', 'public/hof.js', 'public/gallery.js', 'public/music.js', 'public/badges.js', 'public/qrcode.js', 'public/home.js', 'public/recap.js', 'public/guide.js', 'public/moments.js', 'public/steal.js'].map(readOr).join('')).digest('hex').slice(0, 10);
// __V__ busts the phone's cache for the helper scripts after an update
const PAGE = INDEX_HTML.replace('__BUILD__', BUILD).split('__V__').join(BUILD);
app.get('/', (req, res) => { res.set('Cache-Control', 'no-store'); res.type('html').send(PAGE); });
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/healthz', (req, res) => res.send('ok'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

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
    const g = games[code];
    if (!g || g.phase !== expectPhase || g.round !== round || g.timerToken !== token) return;
    fn(g);
    broadcast(code);
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
    setTimeout(() => scheduleWritingEnd(g.code), 0);
  }
}

// When the last chip of a betting stage lands, move on by itself after a beat
function autoAdvanceBets(code) {
  const g = games[code];
  if (!g) return;
  if (g.phase === PHASES.FIRST_BETS && G.pendingBetters(g).length === 0) later(code, 1600, PHASES.FIRST_BETS, G.moveToReveal);
  if (g.phase === PHASES.SECOND_BETS && G.pendingBetters(g).length === 0) later(code, 1600, PHASES.SECOND_BETS, G.moveFromSecondBets);
}

const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const sendError = (ws, message) => send(ws, { type: 'error', message });
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 20);

wss.on('connection', (ws) => {
  let playerId = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  const seat = (id, code) => {
    if (playerId && playerId !== id && clients[playerId] && clients[playerId].ws === ws) delete clients[playerId];
    const old = clients[id];
    if (old && old.ws !== ws) { try { old.ws.close(4000, 'replaced'); } catch (e) {} }
    playerId = id;
    clients[id] = { ws, gameCode: code };
    const p = games[code].players.find(x => x.id === id);
    if (p) { p.connected = true; p.disconnectedAt = null; }
    send(ws, { type: 'joined', playerId: id, code });
    broadcast(code);
  };

  // One bad message must never take the whole server down
  ws.on('message', (raw) => { try { onMessage(raw); } catch (e) { console.error('message failed', e); try { sendError(ws, 'Something went wrong'); } catch (e2) {} } });
  const onMessage = (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg.action !== 'string') return;

    // Actions that don't need a seat yet
    if (msg.action === 'create') {
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      const timer = [60, 90, 120, 180].includes(msg.timer) ? msg.timer : 90;
      const id = crypto.randomUUID();
      let game; do { game = G.createGame(id, name, timer, Array.isArray(msg.seen) ? msg.seen.slice(0, 200) : []); } while (games[game.code]);
      games[game.code] = game;
      return seat(id, game.code);
    }
    if (msg.action === 'reconnect') {
      const code = String(msg.code || '').toUpperCase().trim();
      const game = games[code];
      if (!game) return sendError(ws, 'Game not found');
      if (!game.players.some(p => p.id === msg.playerId)) return sendError(ws, 'Player not in game');
      return seat(msg.playerId, code);
    }
    if (msg.action === 'join') {
      const code = String(msg.code || '').toUpperCase().trim();
      const name = cleanName(msg.name);
      if (!name) return sendError(ws, 'Enter your name');
      const game = games[code];
      if (!game) return sendError(ws, 'Game not found');
      const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        // Same name = same seat (lets someone whose phone died rejoin from a new phone).
        // Only allowed when that seat isn't live on another phone right now.
        if (existing.connected && clients[existing.id] && clients[existing.id].ws.readyState === 1) return sendError(ws, 'Someone is already playing as ' + existing.name);
        return seat(existing.id, code);
      }
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
      case 'plant_flag': {
        // Enough flags inducts the caption (into the permanent deck if a player wrote it); see game.js
        if (fail(G.plantFlag(game, playerId, msg.target))) return;
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
            // The table lingers on the answer: only the dealer (or host, or a stand-in) moves on
            if (!canRun) return sendError(ws, 'The dealer moves to the scoreboard');
            if (fail(G.moveToScoreboard(game))) return;   // not until the reel reaches the recap
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
      case 'play_again': {
        if (!isHost) return sendError(ws, 'Only the host can start a new game');
        if (game.phase !== PHASES.SCORES || !G.isGameOver(game)) return sendError(ws, 'The game is still going');
        if (Array.isArray(msg.seen)) G.setSeen(game, msg.seen.slice(0, 200));
        G.resetForNewGame(game);
        broadcast(code);
        return;
      }
      case 'leave': {
        // Leaving from the lobby frees the seat; mid-game the seat stays (scores are kept)
        if (game.phase === PHASES.LOBBY && !isHost) game.players = game.players.filter(p => p.id !== playerId);
        else { me.connected = false; me.disconnectedAt = Date.now(); }
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
    broadcast(code);
  });
});

// Housekeeping every 3 seconds
setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(games)) try {
    const g = games[code];
    // Empty for 30 minutes: close the room
    if (g.players.every(p => !p.connected)) {
      const last = Math.max(...g.players.map(p => p.disconnectedAt || 0));
      if (now - last > 30 * 60 * 1000) { delete games[code]; continue; }
    }
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
