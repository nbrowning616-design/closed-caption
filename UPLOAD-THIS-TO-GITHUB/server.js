// server.js — Express + WebSocket server for Closed Caption
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const {
  createGame, updateSettings, addPlayer, removePlayer, kickPlayer, startRound, submitCaption,
  endWritingPhase, dealerDecision, moveToFirstBets, placeFirstBet,
  moveToReveal, moveToSecondBets, placeSecondBet, revealAnswer,
  moveToScoreboard, getPlayerView, PHASES, skipCurrentBetter, resetForNewGame, isGameOver,
} = require('./game');

// Address friends on the same Wi-Fi should type into their phones
function lanUrl() {
  const os = require('os');
  const port = process.env.PORT || 3000;
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list) {
      if (i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254')) return `http://${i.address}:${port}`;
    }
  }
  return null;
}
const LAN_URL = lanUrl();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Build id = when the phone screen was last changed. Phones compare it and refresh themselves after an update.
const fs = require('fs');
const INDEX_PATH = path.join(__dirname, 'public', 'index.html');
const BUILD = String(Math.floor(fs.statSync(INDEX_PATH).mtimeMs));
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.send(fs.readFileSync(INDEX_PATH, 'utf8').replace('__BUILD__', BUILD));
});
app.get('/index.html', (req, res) => res.redirect('/'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory game store
const games = {};      // code -> game
const clients = {};    // playerId -> { ws, gameCode }

function broadcast(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  for (const player of game.players) {
    const client = clients[player.id];
    if (client && client.ws.readyState === 1) {
      const view = getPlayerView(game, player.id);
      view.lanUrl = LAN_URL;
      view.build = BUILD;
      client.ws.send(JSON.stringify({ type: 'state', data: view }));
    }
  }
}

// Schedule the writing-phase auto-end with a stale-token check.
// If the round has moved on (token changed), the timer is a no-op.
// If endWritingPhase triggers an auto-skip (zero submissions), we recursively
// reschedule for the new round.
function scheduleWritingEnd(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  const myToken = game.timerToken;
  const timeLeft = game.timerEnd - Date.now();
  setTimeout(() => {
    const g = games[gameCode];
    if (!g) return;
    if (g.timerToken !== myToken) return;
    if (g.phase === PHASES.WRITING) {
      const result = endWritingPhase(g);
      broadcast(gameCode);
      // If the round was auto-skipped (no submissions), reschedule for new round
      if (result && result.autoSkipped) {
        scheduleWritingEnd(gameCode);
      }
    }
  }, timeLeft + 1000); // 1s grace
}

function sendError(ws, msg) {
  ws.send(JSON.stringify({ type: 'error', message: msg }));
}

function sendOk(ws, data = {}) {
  ws.send(JSON.stringify({ type: 'ok', ...data }));
}

wss.on('connection', (ws) => {
  let playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.action) {

      case 'create': {
        const name = (msg.name || '').trim();
        if (!name || name.length > 20) return sendError(ws, 'Invalid name');
        const timer = [60, 90, 120, 180].includes(msg.timer) ? msg.timer : 90;

        playerId = require('crypto').randomUUID();
        const game = createGame(playerId, name, timer);
        games[game.code] = game;
        clients[playerId] = { ws, gameCode: game.code };

        ws.send(JSON.stringify({ type: 'joined', playerId, code: game.code }));
        broadcast(game.code);
        break;
      }

      case 'reconnect': {
        // Used when client has stored playerId + code from previous session
        const code = (msg.code || '').toUpperCase().trim();
        const storedId = msg.playerId;

        const game = games[code];
        if (!game) return sendError(ws, 'Game not found');

        const existing = game.players.find(p => p.id === storedId);
        if (!existing) return sendError(ws, 'Player not in game');

        // Clean up any previous playerId mapping on this socket
        if (playerId && playerId !== existing.id && clients[playerId] && clients[playerId].ws === ws) {
          delete clients[playerId];
        }

        playerId = existing.id;
        existing.connected = true;
        clients[playerId] = { ws, gameCode: code };
        ws.send(JSON.stringify({ type: 'joined', playerId, code }));
        broadcast(code);
        break;
      }

      case 'join': {
        const code = (msg.code || '').toUpperCase().trim();
        const name = (msg.name || '').trim();
        if (!name || name.length > 20) return sendError(ws, 'Invalid name');

        const game = games[code];
        if (!game) return sendError(ws, 'Game not found');

        // Check if rejoining by name (any connection status — we allow it)
        const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          // Disconnect any old client with the same player slot
          if (existing.connected && clients[existing.id] && clients[existing.id].ws !== ws) {
            try { clients[existing.id].ws.close(); } catch (e) {}
          }
          // Clean up previous playerId mapping
          if (playerId && playerId !== existing.id && clients[playerId] && clients[playerId].ws === ws) {
            delete clients[playerId];
          }
          playerId = existing.id;
          existing.connected = true;
          clients[playerId] = { ws, gameCode: code };
          ws.send(JSON.stringify({ type: 'joined', playerId, code }));
          broadcast(code);
          break;
        }

        playerId = require('crypto').randomUUID();
        const result = addPlayer(game, playerId, name);
        if (result.error) return sendError(ws, result.error);

        clients[playerId] = { ws, gameCode: code };
        ws.send(JSON.stringify({ type: 'joined', playerId, code }));
        broadcast(code);
        break;
      }

      case 'start': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;
        if (game.hostId !== playerId) return sendError(ws, 'Only host can start');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Game already in progress');
        const connectedCount = game.players.filter(p => p.connected).length;
        if (connectedCount < 3) return sendError(ws, 'Need at least 3 connected players');

        startRound(game);
        broadcast(client.gameCode);
        scheduleWritingEnd(client.gameCode);
        break;
      }

      case 'kick_player': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        const targetId = msg.targetPlayerId;
        const result = kickPlayer(game, playerId, targetId);
        if (result.error) return sendError(ws, result.error);

        // Tell the kicked player they were kicked, then close their socket
        const kickedClient = clients[targetId];
        if (kickedClient && kickedClient.ws.readyState === 1) {
          try {
            kickedClient.ws.send(JSON.stringify({ type: 'kicked', message: 'You were removed from the game by the host' }));
            kickedClient.ws.close();
          } catch (e) {}
        }
        delete clients[targetId];

        broadcast(client.gameCode);
        break;
      }

      case 'update_settings': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;
        if (game.hostId !== playerId) return sendError(ws, 'Only host can change settings');

        const result = updateSettings(game, msg.settings || {});
        if (result.error) return sendError(ws, result.error);
        broadcast(client.gameCode);
        break;
      }

      case 'update_timer': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;
        if (game.hostId !== playerId) return sendError(ws, 'Only host can change timer');
        if (game.phase !== PHASES.LOBBY) return sendError(ws, 'Timer can only be changed in lobby');

        const t = Number(msg.timer);
        if (![60, 90, 120, 180].includes(t)) return sendError(ws, 'Invalid timer');
        game.timerDuration = t;
        broadcast(client.gameCode);
        break;
      }

      case 'end_writing': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        const dealer = game.players[game.dealerIndex];
        if (!dealer || dealer.id !== playerId) return sendError(ws, 'Only dealer can end writing');
        if (game.phase !== PHASES.WRITING) return sendError(ws, 'Not in writing phase');
        if (game.submissions.length === 0) return sendError(ws, 'Need at least one submission — use Skip Round instead');

        endWritingPhase(game);
        broadcast(client.gameCode);
        break;
      }

      case 'skip_round': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        const dealer = game.players[game.dealerIndex];
        if (!dealer || dealer.id !== playerId) return sendError(ws, 'Only dealer can skip round');

        // Skip this round: advance dealer, keep same round number
        startRound(game, { skipRoundIncrement: true, advanceDealer: true });
        broadcast(client.gameCode);
        scheduleWritingEnd(client.gameCode);
        break;
      }

      case 'reroll_cartoon': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        const dealer = game.players[game.dealerIndex];
        if (!dealer || dealer.id !== playerId) return sendError(ws, 'Only dealer can reroll');
        if (game.phase !== PHASES.WRITING) return sendError(ws, 'Can only reroll during writing');
        if (game.submissions.length > 0) return sendError(ws, 'Players have already submitted');

        // Pick a new cartoon, excluding the current one
        const { CARTOONS } = require('./game.js');
        const currentId = game.cartoon ? game.cartoon.id : null;
        let available = CARTOONS.filter(c => !game.usedCartoonIds.includes(c.id) && c.id !== currentId);
        if (available.length === 0) {
          // Reset deck but still exclude current
          game.usedCartoonIds = currentId ? [currentId] : [];
          available = CARTOONS.filter(c => c.id !== currentId);
        }
        if (available.length === 0) {
          // Only one cartoon exists — nothing to swap to
          return sendError(ws, 'No other cartoons available');
        }
        const cartoon = available[Math.floor(Math.random() * available.length)];
        // Remove old cartoon from used list (we're swapping)
        game.usedCartoonIds = game.usedCartoonIds.filter(id => id !== currentId);
        game.usedCartoonIds.push(cartoon.id);

        game.cartoon = { id: cartoon.id, title: cartoon.title, image: cartoon.image };
        game.correctCaption = cartoon.correct;
        // Reset auto-close roll using current settings
        game.autoClose = Math.random() < (game.settings ? game.settings.autoCloseProbability : 0.20);
        // Reset the timer (and invalidate the old token)
        game.timerEnd = Date.now() + (game.timerDuration * 1000);
        game.timerToken = (game.timerToken || 0) + 1;
        broadcast(client.gameCode);
        scheduleWritingEnd(client.gameCode);
        break;
      }

      case 'submit_caption': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        const caption = (msg.caption || '').trim();
        if (!caption || caption.length > 200) return sendError(ws, 'Invalid caption');

        const result = submitCaption(game, playerId, caption);
        if (result.error) return sendError(ws, result.error);
        broadcast(client.gameCode);
        break;
      }

      case 'dealer_decision': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        // msg.chosenPlayerId — which submission to close (null if auto-close)
        const result = dealerDecision(game, msg.chosenPlayerId);
        if (result.error) return sendError(ws, result.error);
        broadcast(client.gameCode);
        break;
      }

      case 'advance': {
        // Dealer advances through reading/betting phases
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        const dealer = game.players[game.dealerIndex];
        const isDealer = dealer && dealer.id === playerId;

        // Allow takeover if dealer has been disconnected for 60+ seconds
        const dealerDcSecs = dealer && !dealer.connected && dealer.disconnectedAt
          ? (Date.now() - dealer.disconnectedAt) / 1000
          : 0;
        const canTakeover = !isDealer && dealerDcSecs >= 60;

        // On the scoreboard, the NEXT dealer deals the next round (the current dealer may too)
        const nextDealer = game.players[(game.dealerIndex + 1) % game.players.length];
        const isNextDealer = game.phase === PHASES.SCORES && nextDealer && nextDealer.id === playerId;

        if (!isDealer && !canTakeover && !isNextDealer) {
          return sendError(ws, 'Only the dealer can do that');
        }

        switch (game.phase) {
          case PHASES.READING:
            moveToFirstBets(game); break;
          case PHASES.FIRST_BETS:
            moveToReveal(game); break;
          case PHASES.REVEAL:
            moveToSecondBets(game); break;
          case PHASES.SECOND_BETS:
            revealAnswer(game); break;
          case PHASES.ANSWER:
            moveToScoreboard(game); break;
          case PHASES.SCORES:
            // Don't advance past game-over
            if (isGameOver(game)) break;
            startRound(game);
            broadcast(client.gameCode);
            scheduleWritingEnd(client.gameCode);
            return; // already broadcast
        }
        broadcast(client.gameCode);
        break;
      }

      case 'skip_better': {
        // Dealer skips whoever is holding up the betting
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;
        const dealer = game.players[game.dealerIndex];
        if (!dealer || dealer.id !== playerId) return sendError(ws, 'Only the dealer can skip a player');
        const result = skipCurrentBetter(game);
        if (result.error) return sendError(ws, result.error);
        broadcast(client.gameCode);
        break;
      }

      case 'play_again': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;
        if (game.hostId !== playerId) return sendError(ws, 'Only the host can start a new game');
        if (game.phase !== PHASES.SCORES || !isGameOver(game)) return sendError(ws, 'The game is still going');
        resetForNewGame(game);
        broadcast(client.gameCode);
        break;
      }

      case 'place_bet': {
        if (!playerId) return;
        const client = clients[playerId];
        if (!client) return;
        const game = games[client.gameCode];
        if (!game) return;

        // The game.js placeFirstBet/placeSecondBet now validate everything
        const bet = { target: msg.target, count: msg.count };
        let result;
        if (game.phase === PHASES.FIRST_BETS) {
          result = placeFirstBet(game, playerId, bet);
        } else if (game.phase === PHASES.SECOND_BETS) {
          result = placeSecondBet(game, playerId, bet);
        } else {
          return sendError(ws, 'Not in a betting phase');
        }
        if (result && result.error) return sendError(ws, result.error);
        broadcast(client.gameCode);
        break;
      }
    }
  });

  ws.on('close', () => {
    if (playerId && clients[playerId]) {
      const code = clients[playerId].gameCode;
      const game = games[code];
      if (game) {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
          player.connected = false;
          player.disconnectedAt = Date.now();
        }
        broadcast(code);

        // Schedule cleanup: if room is empty for 10 mins, delete it
        setTimeout(() => {
          const g = games[code];
          if (g && g.players.every(p => !p.connected)) {
            const oldestDisconnect = Math.min(...g.players.map(p => p.disconnectedAt || Date.now()));
            if (Date.now() - oldestDisconnect > 10 * 60 * 1000) {
              delete games[code];
              console.log(`Cleaned up empty room ${code}`);
            }
          }
        }, 10 * 60 * 1000);
      }
      delete clients[playerId];
    }
  });
});

// Periodic re-broadcast for games with disconnected players (every 5s)
// This keeps the disconnect countdown ticking on connected clients
setInterval(() => {
  for (const code in games) {
    const game = games[code];
    const hasDisconnect = game.players.some(p => !p.connected && p.disconnectedAt);
    if (hasDisconnect) broadcast(code);
  }
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('');
  console.log('  CLOSED CAPTION is running.');
  console.log(`  On this computer:            http://localhost:${PORT}`);
  if (LAN_URL) console.log(`  On phones (same Wi-Fi):      ${LAN_URL}`);
  console.log('  Keep this window open while you play. Close it to stop.');
  console.log('');
});
