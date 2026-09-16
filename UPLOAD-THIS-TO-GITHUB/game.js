// game.js — Core game logic for Closed Caption

const PHASES = {
  LOBBY: 'lobby',
  WRITING: 'writing',
  DEALER_REVIEW: 'dealer_review',
  READING: 'reading',
  FIRST_BETS: 'first_bets',
  REVEAL: 'reveal',
  SECOND_BETS: 'second_bets',
  ANSWER: 'answer',
  SCORES: 'scores',
};

// Sample cartoons for demo — in production this would be a database
const CARTOONS = [
  { id: 1, title: "The Fish Therapist", image: "card_1.jpg", correct: "So you feel like nobody notices you." },
  { id: 2, title: "The Alien Restaurant", image: "card_2.jpg", correct: "What's good here? We've come a long way." },
  { id: 3, title: "Dog Board Meeting", image: "card_3.jpg", correct: "Any questions? No? Good boy." },
  { id: 5, title: "Grim Reaper Café", image: "card_5.jpg", correct: "Nobody ever wants to sit with me." },
  { id: 6, title: "Self-Driving Car", image: "card_6.jpg", correct: "Recalculating route to couples therapy." },
  { id: 7, title: "Snowman Doctor", image: "card_7.jpg", correct: "No, antibiotics will not help." },
  { id: 10, title: "Pigeon Consultant", image: "card_10.jpg", correct: "The first thing we need to do is update your LinkedIn." },
  { id: 11, title: "Airplane Squeeze", image: "card_11.jpg", correct: "They said middle seats have more legroom now." },
  { id: 12, title: "Scuba Date", image: "card_12.jpg", correct: "My profile said I was adventurous." },
  { id: 13, title: "Victorian Beach Lady", image: "card_13.jpg", correct: "Have you seen the price of sunscreen lately?" },
  { id: 14, title: "Octopus Interview", image: "card_14.jpg", correct: "You seem like a hands-on kind of guy." },
  { id: 16, title: "The Gym", image: "card_16.jpg", correct: "He has been skipping head day." },
  { id: 17, title: "Pirate Therapy", image: "card_17.jpg", correct: "Everything seems to be an arrrrrrrgument." },
  { id: 19, title: "Giant Sushi", image: "card_19.jpg", correct: "The bathtub of soy is on its way." },
  { id: 21, title: "Big Head Barber", image: "card_21.jpg", correct: "You seem like a cerebral guy." },
  { id: 22, title: "Giant Mouth Dentist", image: "card_22.jpg", correct: "We may need to reschedule. I can't find my assistant." },
  { id: 23, title: "The Speedo Strut", image: "card_23.jpg", correct: "Nobody said anything. Nobody could." },
  { id: 24, title: "Horse Witness", image: "card_24.jpg", correct: "I'll ask again. Were you at the barn that night?" },
  { id: 25, title: "Stick Figure Art", image: "card_25.jpg", correct: "Under magnification its clearly a boy." },
  { id: 26, title: "Yoga Pretzel", image: "card_26.jpg", correct: "Namaste." },
  { id: 27, title: "Giraffe Tailor", image: "card_27.jpg", correct: "The suit was easy. The tie is the problem." },
  { id: 29, title: "Enormous Cat", image: "card_29.jpg", correct: "You should see the litter box." },
  { id: 30, title: "The Elevator", image: "card_30.jpg", correct: "One fart, five casualties." },
  { id: 31, title: "The Burger", image: "card_31.jpg", correct: "The salad was her idea." },
  { id: 32, title: "The Consultation", image: "card_32.jpg", correct: "Cowabunga." },
  { id: 33, title: "The Tee Shot", image: "card_33.jpg", correct: "He sliced it so hard the Middle Ages showed up." },
  { id: 34, title: "The Worm", image: "card_34.jpg", correct: "Nobody's that friendly for free." },
  { id: 35, title: "The Landing Zone", image: "card_35.jpg", correct: "Thankfully he was filled with helium." },
  { id: 36, title: "The First Date", image: "card_36.jpg", correct: "He's forty-three. The steak is cut into squares." },
  { id: 37, title: "The Interview", image: "card_37.jpg", correct: "What are your thoughts on spanking?" },
  { id: 38, title: "The Dress", image: "card_38.jpg", correct: "It's her third marriage. Budget reflects that." },
  { id: 39, title: "The Arm Wrestle", image: "card_39.jpg", correct: "Cardio pays off eventually." },
  { id: 40, title: "The Drive-Through", image: "card_40.jpg", correct: "He tipped in licks." },
  { id: 41, title: "The Proposal", image: "card_41.jpg", correct: "The hydrant was flattered but not ready for that kind of commitment." },
  { id: 42, title: "The Birthday Inferno", image: "card_42.jpg", correct: "Happy birthday. Evacuate." },
  { id: 44, title: "The Spa", image: "card_44.jpg", correct: "And now for the salmon oil." },
  { id: 46, title: "The Plumber", image: "card_46.jpg", correct: "Someone in your family needs more fiber." },
];

// Probability that the correct caption goes in the closed box automatically
const AUTO_CLOSE_PROBABILITY = 0.15;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Default game settings — can be overridden by the host in lobby
const DEFAULT_SETTINGS = {
  rounds: null,                  // null = one full dealer rotation; else fixed number
  targetScore: null,             // null = play full rounds; else first to X points wins
  pointsOpenBet: 2,              // BLIND (first-round) bet, per marker, on the correct open caption
  pointsClosedBet: 3,            // BLIND (first-round) bet, per marker, on the closed caption when it's correct
  pointsOpenLate: 1,             // second-round (post-reveal) bet, per marker, on the correct caption (open or closed — no premium once revealed)
  pointsClosedLate: 1,           // kept equal to pointsOpenLate; the closed caption only pays extra when bet blind
  pointsPerFool: 1,              // points to the writer for every marker another player puts on their caption
  dealerBonus: 4,                // dealer scores this if nobody puts a marker on the correct caption
  autoCloseProbability: 0.15,    // chance the app auto-places the correct caption in the closed box (0..1)
};

function createGame(hostId, hostName, timerDuration = 90) {
  return {
    code: generateRoomCode(),
    phase: PHASES.LOBBY,
    players: [{ id: hostId, name: hostName, score: 0, connected: true }],
    hostId,
    timerDuration,
    settings: { ...DEFAULT_SETTINGS },
    round: 0,
    dealerIndex: -1, // will be set to 0 on first round
    usedCartoonIds: [],
    // Round state
    cartoon: null,
    correctCaption: '',
    autoClose: false,
    submissions: [],      // { playerId, playerName, caption }
    closedCaption: '',
    closedIsCorrect: false,
    closedPlayerId: null,
    openCaptions: [],      // { caption, isCorrect, playerId }
    firstBets: {},         // playerId -> { target, count }   (kept for history view)
    secondBets: {},
    bets: [],              // public bet log, in the order placed: { playerId, target, count, stage }
    betOrder: [],          // playerIds clockwise from the dealer's left
    roundScores: {},       // playerId -> points earned this round
    roundScoreDetails: {}, // playerId -> [{ pts, reason }]
    dealerBonusAwarded: false,
    timerEnd: null,
    timerToken: 0,         // increments on each new writing phase to invalidate stale timers
    // Past rounds
    history: [],           // [{ round, cartoon, correctCaption, openCaptions, closedCaption, ... }]
  };
}

function updateSettings(game, partial) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Settings can only be changed in the lobby' };
  const s = game.settings;
  const allowed = ['rounds', 'targetScore', 'pointsOpenBet', 'pointsClosedBet', 'pointsOpenLate', 'pointsClosedLate', 'pointsPerFool', 'dealerBonus', 'autoCloseProbability'];
  for (const key of allowed) {
    if (key in partial) {
      const val = partial[key];
      // Validation
      if (val === null) {
        s[key] = null;
      } else if (key === 'autoCloseProbability') {
        const n = Number(val);
        if (isNaN(n) || n < 0 || n > 1) return { error: 'Invalid auto-close probability' };
        s[key] = n;
      } else {
        const n = Number(val);
        if (!Number.isInteger(n) || n < 0 || n > 100) return { error: `Invalid ${key}` };
        s[key] = n;
      }
    }
  }
  return { ok: true };
}

function addPlayer(game, playerId, playerName) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Game already in progress' };
  if (game.players.length >= 8) return { error: 'Game is full (max 8)' };
  if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    return { error: 'Name already taken' };
  }
  game.players.push({ id: playerId, name: playerName, score: 0, connected: true });
  return { ok: true };
}

function removePlayer(game, playerId) {
  game.players = game.players.filter(p => p.id !== playerId);
}

// Host kicks a player out of the lobby. Lobby-only — can't kick mid-game.
function kickPlayer(game, hostId, targetPlayerId) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Can only kick players in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can kick' };
  if (hostId === targetPlayerId) return { error: 'You can\'t kick yourself' };
  const target = game.players.find(p => p.id === targetPlayerId);
  if (!target) return { error: 'Player not in game' };

  game.players = game.players.filter(p => p.id !== targetPlayerId);
  return { ok: true, kickedName: target.name };
}

function startRound(game, options = {}) {
  if (!options.skipRoundIncrement) {
    game.round++;
  }
  if (options.advanceDealer || !options.skipRoundIncrement) {
    game.dealerIndex = game.round === 1 && !options.skipRoundIncrement ? 0 : (game.dealerIndex + 1) % game.players.length;
  }

  // Pick a cartoon not yet used
  if (CARTOONS.length === 0) {
    // Catastrophic safety check — shouldn't happen
    game.phase = PHASES.LOBBY;
    return;
  }
  const available = CARTOONS.filter(c => !game.usedCartoonIds.includes(c.id));
  let cartoon;
  if (available.length === 0) {
    game.usedCartoonIds = [];
    cartoon = CARTOONS[Math.floor(Math.random() * CARTOONS.length)];
  } else {
    cartoon = available[Math.floor(Math.random() * available.length)];
  }
  game.usedCartoonIds.push(cartoon.id);

  game.cartoon = { id: cartoon.id, title: cartoon.title, image: cartoon.image };
  game.correctCaption = cartoon.correct;
  game.autoClose = Math.random() < (game.settings ? game.settings.autoCloseProbability : AUTO_CLOSE_PROBABILITY);
  game.submissions = [];
  game.closedCaption = '';
  game.closedIsCorrect = false;
  game.closedPlayerId = null;
  game.openCaptions = [];
  game.firstBets = {};
  game.secondBets = {};
  game.bets = [];
  game.betOrder = [];
  game.roundScores = {};
  game.roundScoreDetails = {};
  game.dealerBonusAwarded = false;
  game.phase = PHASES.WRITING;
  game.timerEnd = Date.now() + (game.timerDuration * 1000);
  game.timerToken = (game.timerToken || 0) + 1; // invalidate any old timers
}

function submitCaption(game, playerId, caption) {
  if (game.phase !== PHASES.WRITING) return { error: 'Not in writing phase' };
  const dealer = game.players[game.dealerIndex];
  if (!dealer) return { error: 'No dealer set' };
  if (playerId === dealer.id) return { error: 'Dealer cannot submit' };
  if (game.submissions.some(s => s.playerId === playerId)) return { error: 'Already submitted' };

  const player = game.players.find(p => p.id === playerId);
  if (!player) return { error: 'Player not in game' };

  const trimmed = (caption || '').toString().trim();
  if (!trimmed) return { error: 'Caption cannot be empty' };
  if (trimmed.length > 200) return { error: 'Caption too long (max 200)' };

  game.submissions.push({ playerId, playerName: player.name, caption: trimmed });

  // Check if all non-dealer players have submitted
  const nonDealerCount = game.players.length - 1;
  if (game.submissions.length >= nonDealerCount) {
    game.phase = PHASES.DEALER_REVIEW;
  }
  return { ok: true, allIn: game.submissions.length >= nonDealerCount };
}

function endWritingPhase(game) {
  // Called when timer expires — move to dealer review even if not all submitted
  if (game.phase !== PHASES.WRITING) return { ok: true };
  // If nobody submitted anything, just skip this round entirely
  if (game.submissions.length === 0) {
    startRound(game, { skipRoundIncrement: true, advanceDealer: true });
    return { ok: true, autoSkipped: true };
  }
  game.phase = PHASES.DEALER_REVIEW;
  return { ok: true };
}

function dealerDecision(game, chosenPlayerId) {
  if (game.phase !== PHASES.DEALER_REVIEW) return { error: 'Not in dealer review phase' };

  // If nobody submitted, skip this round entirely
  if (game.submissions.length === 0) {
    return { error: 'Nobody submitted a caption this round — use Skip Round' };
  }

  if (game.autoClose) {
    // Correct caption goes in the box automatically
    game.closedCaption = game.correctCaption;
    game.closedIsCorrect = true;
    game.closedPlayerId = null;

    // All submissions become open captions
    const opens = game.submissions.map(s => ({
      caption: s.caption,
      isCorrect: false,
      playerId: s.playerId,
    }));
    game.openCaptions = shuffleArray(opens);
  } else {
    // Dealer chose a player submission to hide
    const chosen = game.submissions.find(s => s.playerId === chosenPlayerId);
    if (!chosen) return { error: 'Invalid player selection' };

    game.closedCaption = chosen.caption;
    game.closedIsCorrect = false;
    game.closedPlayerId = chosen.playerId;

    // Remaining submissions + correct caption become open
    const opens = game.submissions
      .filter(s => s.playerId !== chosenPlayerId)
      .map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId }));
    opens.push({ caption: game.correctCaption, isCorrect: true, playerId: null });
    game.openCaptions = shuffleArray(opens);
  }

  game.phase = PHASES.READING;
  return { ok: true };
}

// Betting order: clockwise from the dealer's left, dealer excluded
function computeBetOrder(game) {
  const n = game.players.length;
  const order = [];
  for (let k = 1; k < n; k++) {
    order.push(game.players[(game.dealerIndex + k) % n].id);
  }
  return order;
}

function moveToFirstBets(game) {
  game.betOrder = computeBetOrder(game);
  game.bets = [];
  game.phase = PHASES.FIRST_BETS;
}

function stage1Bet(game, playerId) {
  return game.bets.find(b => b.playerId === playerId && b.stage === 1) || null;
}
function stage2Bet(game, playerId) {
  return game.bets.find(b => b.playerId === playerId && b.stage === 2) || null;
}

// Who still owes a bet in the current stage (in table order)
function pendingBetters(game) {
  if (game.phase === PHASES.FIRST_BETS) {
    return game.betOrder.filter(pid => !stage1Bet(game, pid));
  }
  if (game.phase === PHASES.SECOND_BETS) {
    return game.betOrder.filter(pid => {
      const b1 = stage1Bet(game, pid);
      return b1 && b1.target !== 'pass' && b1.count === 1 && !stage2Bet(game, pid);
    });
  }
  return [];
}

function currentBetterId(game) {
  const pending = pendingBetters(game);
  return pending.length ? pending[0] : null;
}

function validateTarget(game, target) {
  if (target === 'closed') return { ok: true, target: 'closed' };
  const idx = Number(target);
  if (!Number.isInteger(idx) || idx < 0 || idx >= game.openCaptions.length) {
    return { error: 'Invalid caption target' };
  }
  return { ok: true, target: idx };
}

function placeFirstBet(game, playerId, betTarget) {
  // betTarget: { target: number | 'closed', count: 1 or 2 }
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Not in first bets phase' };

  const dealer = game.players[game.dealerIndex];
  if (dealer && dealer.id === playerId) return { error: 'Dealer cannot bet' };
  if (stage1Bet(game, playerId)) return { error: 'You already bet' };
  if (currentBetterId(game) !== playerId) return { error: 'Not your turn yet' };

  if (!betTarget || typeof betTarget !== 'object') return { error: 'Invalid bet' };
  const count = Number(betTarget.count);
  if (count !== 1 && count !== 2) return { error: 'Invalid marker count' };
  const v = validateTarget(game, betTarget.target);
  if (v.error) return v;

  const bet = { playerId, target: v.target, count, stage: 1 };
  game.bets.push(bet);
  game.firstBets[playerId] = { target: v.target, count };
  return { ok: true, allIn: pendingBetters(game).length === 0 };
}

function moveToReveal(game) {
  game.phase = PHASES.REVEAL;
}

function moveToSecondBets(game) {
  game.phase = PHASES.SECOND_BETS;
}

function placeSecondBet(game, playerId, betTarget) {
  if (game.phase !== PHASES.SECOND_BETS) return { error: 'Not in second bets phase' };

  const dealer = game.players[game.dealerIndex];
  if (dealer && dealer.id === playerId) return { error: 'Dealer cannot bet' };

  const first = stage1Bet(game, playerId);
  if (!first || first.target === 'pass') return { error: 'You have no marker left' };
  if (first.count === 2) return { error: 'You already used both markers' };
  if (stage2Bet(game, playerId)) return { error: 'You already bet' };
  if (currentBetterId(game) !== playerId) return { error: 'Not your turn yet' };

  if (!betTarget || typeof betTarget !== 'object') return { error: 'Invalid bet' };
  const count = Number(betTarget.count);
  if (count !== 1) return { error: 'Second bet must be 1 marker' };
  const v = validateTarget(game, betTarget.target);
  if (v.error) return v;
  if (v.target === first.target) return { error: 'You can\'t double down on the caption you already picked' };

  const bet = { playerId, target: v.target, count, stage: 2 };
  game.bets.push(bet);
  game.secondBets[playerId] = { target: v.target, count };
  return { ok: true, allIn: pendingBetters(game).length === 0 };
}

// Dealer skips whoever is up (e.g. they walked away or lost connection)
function skipCurrentBetter(game) {
  if (game.phase !== PHASES.FIRST_BETS && game.phase !== PHASES.SECOND_BETS) return { error: 'Not a betting phase' };
  const pid = currentBetterId(game);
  if (!pid) return { error: 'Nobody is waiting to bet' };
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : 2;
  game.bets.push({ playerId: pid, target: 'pass', count: 0, stage });
  return { ok: true, skipped: pid };
}

function isBetOnCorrect(game, bet) {
  if (!bet || bet.target === 'pass') return false;
  if (bet.target === 'closed') return !!game.closedIsCorrect;
  const c = game.openCaptions[bet.target];
  return !!(c && c.isCorrect);
}

function revealAnswer(game) {
  game.phase = PHASES.ANSWER;

  const s = game.settings || DEFAULT_SETTINGS;
  const nameOf = (pid) => (game.players.find(p => p.id === pid) || {}).name || '?';

  const scores = {};
  const details = {};
  game.players.forEach(p => { scores[p.id] = 0; details[p.id] = []; });
  const add = (pid, pts, reason) => {
    if (!pts || !(pid in scores)) return;
    scores[pid] += pts;
    details[pid].push({ pts, reason });
  };

  let anyoneRight = false;

  for (const bet of game.bets) {
    if (!bet || bet.target === 'pass') continue;
    const blind = bet.stage === 1;
    const onClosed = bet.target === 'closed';
    const both = bet.count === 2;

    // Betting points
    if (isBetOnCorrect(game, bet)) {
      anyoneRight = true;
      // Blind bets pay more; once the Closed Caption is revealed, a late bet pays the same anywhere
      const per = blind ? (onClosed ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
      let reason;
      if (onClosed && both) reason = 'Shot the moon';
      else if (!onClosed && both) reason = 'Half-moon on the right caption';
      else if (onClosed && blind) reason = 'Blind bet on the Closed Caption';
      else reason = blind ? 'Blind bet on the right caption' : 'Late bet on the right caption';
      add(bet.playerId, per * bet.count, reason);
    }

    // Writing points: the author of the caption you bet on gets paid (unless it's your own)
    const author = onClosed ? game.closedPlayerId : (game.openCaptions[bet.target] || {}).playerId;
    if (author && author !== bet.playerId) {
      add(author, s.pointsPerFool * bet.count, `Fooled ${nameOf(bet.playerId)}`);
    }
  }

  // Dealer bonus: nobody found the correct caption
  const dealer = game.players[game.dealerIndex];
  game.dealerBonusAwarded = false;
  if (!anyoneRight && dealer && s.dealerBonus > 0) {
    add(dealer.id, s.dealerBonus, 'Nobody found it — dealer wins the round');
    game.dealerBonusAwarded = true;
  }

  game.roundScores = scores;
  game.roundScoreDetails = details;

  // Snapshot the rankings BEFORE applying the new points
  const sortedBefore = [...game.players].sort((a, b) => b.score - a.score);
  const previousRank = {};
  sortedBefore.forEach((p, i) => { previousRank[p.id] = i; });
  game.previousRank = previousRank;

  // Apply to cumulative scores
  for (const [playerId, pts] of Object.entries(scores)) {
    const player = game.players.find(p => p.id === playerId);
    if (player) player.score += pts;
  }

  // Capture this round in history
  game.history.push({
    round: game.round,
    cartoon: { ...game.cartoon },
    correctCaption: game.correctCaption,
    dealerName: dealer ? dealer.name : '',
    autoClose: game.autoClose,
    openCaptions: game.openCaptions.map(c => ({
      caption: c.caption,
      isCorrect: c.isCorrect,
      playerName: c.playerId ? game.players.find(p => p.id === c.playerId)?.name : null,
      playerId: c.playerId,
    })),
    closedCaption: game.closedCaption,
    closedIsCorrect: game.closedIsCorrect,
    closedPlayerName: game.closedPlayerId ? game.players.find(p => p.id === game.closedPlayerId)?.name : null,
    closedPlayerId: game.closedPlayerId,
    firstBets: { ...game.firstBets },
    secondBets: { ...game.secondBets },
    bets: game.bets.map(b => ({ ...b })),
    roundScores: { ...scores },
    roundScoreDetails: JSON.parse(JSON.stringify(details)),
    dealerBonusAwarded: game.dealerBonusAwarded,
  });
}

function moveToScoreboard(game) {
  game.phase = PHASES.SCORES;
}

function isGameOver(game) {
  const s = game.settings || DEFAULT_SETTINGS;

  // Check target score first if set
  if (s.targetScore && s.targetScore > 0) {
    if (game.players.some(p => p.score >= s.targetScore)) return true;
  }

  // Use configured rounds, or default to one dealer rotation
  const targetRounds = s.rounds || game.players.length;
  return game.round >= targetRounds;
}

function nameOfPlayer(game, pid) {
  const p = game.players.find(x => x.id === pid);
  return p ? p.name : '?';
}

// Play again with the same table: scores wiped, cartoons already seen stay out of the deck
function resetForNewGame(game) {
  game.phase = PHASES.LOBBY;
  game.round = 0;
  game.dealerIndex = -1;
  game.history = [];
  game.previousRank = {};
  game.players.forEach(p => { p.score = 0; });
  game.cartoon = null;
  game.submissions = [];
  game.bets = [];
  game.betOrder = [];
  game.roundScores = {};
  game.roundScoreDetails = {};
  game.timerEnd = null;
  game.timerToken = (game.timerToken || 0) + 1;
}

// Build the state each player should see (hide dealer-only info)
function getPlayerView(game, playerId) {
  const dealer = game.players[game.dealerIndex] || null;
  const isDealer = dealer && dealer.id === playerId;

  const dealerDisconnectedSecs = dealer && !dealer.connected && dealer.disconnectedAt
    ? Math.floor((Date.now() - dealer.disconnectedAt) / 1000)
    : 0;

  const s = game.settings || DEFAULT_SETTINGS;
  const totalRounds = s.rounds || game.players.length;

  const base = {
    code: game.code,
    phase: game.phase,
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
      disconnectedSecs: !p.connected && p.disconnectedAt ? Math.floor((Date.now() - p.disconnectedAt) / 1000) : 0,
    })),
    round: game.round,
    totalRounds,
    settings: { ...s },
    dealerId: dealer ? dealer.id : null,
    dealerName: dealer ? dealer.name : null,
    dealerConnected: dealer ? dealer.connected : false,
    dealerDisconnectedSecs,
    canTakeover: !isDealer && dealerDisconnectedSecs >= 60,
    isDealer,
    playerId,
    timerDuration: game.timerDuration,
    timerEnd: game.timerEnd,
  };

  if (game.phase === PHASES.LOBBY) {
    base.isHost = game.hostId === playerId;
    base.hostId = game.hostId;
    return base;
  }

  // Cartoon visible to all during and after writing
  if (game.cartoon) {
    base.cartoon = game.cartoon;
  }

  // Writing phase: show who has submitted (not what)
  if (game.phase === PHASES.WRITING) {
    base.submittedPlayerIds = game.submissions.map(s => s.playerId);
    base.hasSubmitted = game.submissions.some(s => s.playerId === playerId);
    // Dealer sees the names of who hasn't submitted
    if (isDealer) {
      base.pendingPlayers = game.players
        .filter((p, i) => i !== game.dealerIndex && !game.submissions.some(s => s.playerId === p.id))
        .map(p => ({ id: p.id, name: p.name, connected: p.connected }));
    }
  }

  // Dealer review: only dealer sees submissions and autoClose
  if (game.phase === PHASES.DEALER_REVIEW) {
    if (isDealer) {
      base.autoClose = game.autoClose;
      base.submissions = game.submissions.map(s => ({
        playerId: s.playerId,
        playerName: s.playerName,
        caption: s.caption,
      }));
      base.correctCaption = game.correctCaption;
    }
  }

  // Reading and beyond: show open captions (without revealing who wrote what)
  if ([PHASES.READING, PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.SCORES].includes(game.phase)) {
    base.openCaptions = game.openCaptions.map(c => c.caption);
  }

  // Betting is public: everyone sees every bet as it lands, and whose turn it is
  if ([PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.SCORES].includes(game.phase)) {
    base.bets = game.bets.map(b => ({ ...b }));
    base.betOrder = [...game.betOrder];
    base.myFirstBet = game.firstBets[playerId] || null;
    base.currentBetterId = currentBetterId(game);
    base.currentBetterName = base.currentBetterId ? nameOfPlayer(game, base.currentBetterId) : null;
    base.isMyTurn = base.currentBetterId === playerId;
    base.pendingBetters = pendingBetters(game);
    base.allBetsIn = base.pendingBetters.length === 0;
    base.eligibleSecondBetters = game.betOrder.filter(pid => {
      const b1 = stage1Bet(game, pid);
      return b1 && b1.target !== 'pass' && b1.count === 1;
    });
  }

  // Reveal and beyond: show closed caption
  if ([PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.SCORES].includes(game.phase)) {
    base.closedCaption = game.closedCaption;
  }

  // Second bets
  if (game.phase === PHASES.SECOND_BETS || game.phase === PHASES.ANSWER || game.phase === PHASES.SCORES) {
    base.mySecondBet = game.secondBets[playerId] || null;
  }

  // Answer: show everything
  if (game.phase === PHASES.ANSWER || game.phase === PHASES.SCORES) {
    base.correctCaption = game.correctCaption;
    base.closedIsCorrect = game.closedIsCorrect;
    base.roundScores = game.roundScores;
    base.roundScoreDetails = game.roundScoreDetails || {};
    base.dealerBonusAwarded = !!game.dealerBonusAwarded;
    base.closedPlayerName = game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null;
    base.openCaptionDetails = game.openCaptions.map(c => ({
      caption: c.caption,
      isCorrect: c.isCorrect,
      playerName: c.playerId ? game.players.find(p => p.id === c.playerId)?.name : null,
    }));
  }

  // Scores
  if (game.phase === PHASES.SCORES) {
    base.gameOver = isGameOver(game);
    base.previousRank = game.previousRank || {};
    base.history = game.history || [];
    if (!base.gameOver) {
      const nextDealerIdx = (game.dealerIndex + 1) % game.players.length;
      base.nextDealerName = game.players[nextDealerIdx].name;
      base.nextDealerId = game.players[nextDealerIdx].id;
      base.isNextDealer = base.nextDealerId === playerId;
    }
    base.isHost = game.hostId === playerId;
  }

  return base;
}

module.exports = {
  PHASES,
  CARTOONS,
  DEFAULT_SETTINGS,
  createGame,
  updateSettings,
  addPlayer,
  removePlayer,
  kickPlayer,
  startRound,
  submitCaption,
  endWritingPhase,
  dealerDecision,
  moveToFirstBets,
  placeFirstBet,
  moveToReveal,
  moveToSecondBets,
  placeSecondBet,
  skipCurrentBetter,
  currentBetterId,
  pendingBetters,
  resetForNewGame,
  revealAnswer,
  moveToScoreboard,
  isGameOver,
  getPlayerView,
  generateRoomCode,
};
