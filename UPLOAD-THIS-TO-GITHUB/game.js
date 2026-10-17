// game.js — Core game logic for Closed Caption
//
// How a round works (v2, "everyone plays"):
//   1. WRITING      Everyone — the dealer too — writes a caption for the same cartoon.
//                   Anyone can vote to mulligan the cartoon; half the table swaps it.
//   2. READING      The app secretly picks the Closed Caption (usually a random player's
//                   caption; sometimes the real one). The rest are shown. The dealer reads aloud.
//   3. FIRST_BETS   Blind bets, one player at a time, clockwise from the dealer's left.
//                   The dealer does not bet. 1 chip, or both (Half-Moon / Shoot the Moon).
//   4. REVEAL       The Closed Caption is turned face-up.
//   5. SECOND_BETS  Anyone holding a chip places it — anywhere, even on the same caption.
//   6. STEAL        The dealer may knock one chip off the table.
//   7. ANSWER       The real caption is shown and points are paid.
//   8. SCORES       Scoreboard; the deal moves left.

const PHASES = {
  LOBBY: 'lobby',
  WRITING: 'writing',
  READING: 'reading',
  FIRST_BETS: 'first_bets',
  REVEAL: 'reveal',
  SECOND_BETS: 'second_bets',
  STEAL: 'steal',
  ANSWER: 'answer',
  SCORES: 'scores',
};

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
  { id: 25, title: "Stick Figure Art", image: "card_25.jpg", correct: "Under magnification it's clearly a boy." },
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

// The real captions get the same polish as players' captions, so they look identical
const { polish } = require('./polish');
for (const c of CARTOONS) c.correct = polish(c.correct).text;

// The permanent Hall of Fame deck (lives across games and game nights)
const store = require('./store');

const MAX_PLAYERS = 8;

// Shown on everyone's screen when the table votes a cartoon off
const MULLIGAN_QUIPS = [
  'This cartoon has been voted off the island.',
  'The table has spoken. Next!',
  'Nope. Nope. Nope.',
  'That cartoon is going to need therapy.',
  'Rejected harder than a timeshare pitch.',
  'Into the shredder it goes.',
  'Not even the artist liked that one.',
  'Cartoon fired. Security will walk it out.',
];
// How the rejected cartoon meets its end (every phone plays the same one)
const EXECUTIONS = ['punch', 'tear', 'fire', 'flush', 'stomp', 'shred'];

// What the dealer says after the steal (rotates)
const GLOATS = [
  'Got you, buddy. It’s mine now.',
  'Thanks for the chip. I’ll treasure it.',
  'Nothing personal. Okay, a little personal.',
  'Finders keepers.',
  'You weren’t using that, were you?',
  'That’s going on my mantel.',
  'Shhh. It’s okay. Let it go.',
  'Mine now. Say goodbye.',
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const DEFAULT_SETTINGS = {
  rounds: null,                  // null = everyone deals once; else fixed number
  targetScore: null,             // null = play the rounds; else first to X points
  pointsOpenBet: 2,              // blind chip on the real caption, out in the open
  pointsClosedBet: 3,            // blind chip on the Closed Caption when it's the real one
  pointsOpenLate: 1,             // late chip (after the reveal) on the real caption, anywhere
  pointsClosedLate: 1,           // kept equal to pointsOpenLate
  pointsPerFool: 1,              // to the writer, for each chip someone else puts on their caption
  dealerBonus: 4,                // dealer scores this if no chip ends up on the real caption
  pointsStealCorrect: 1,         // dealer scores this for stealing a chip that was on the real caption
  autoCloseProbability: 0.15,    // share of rounds where the real caption is the Closed Caption
  stealEnabled: true,            // dealer may knock one chip off the table before the answer
  direction: 'left',             // which way the deal and the betting go around the table
  expert: false,                 // Expert Mode: the real answer comes from the Hall of Fame deck
};

function createGame(hostId, hostName, timerDuration = 90, seenIds = []) {
  return {
    seenIds: cleanSeen(seenIds),   // cartoons the host's phone has seen in earlier games
    closePlan: [],                  // closePlan[round - 1] = true when the real caption is face-down that round
    flags: [],                      // Hall of Fame flags: { fromId, round, target }
    inducted: [],                   // 'round|target' keys already inducted this game
    lastInduction: null,            // the latest induction, for the celebration: { n, round, target, caption, ... }
    realCredit: null,               // Expert Mode: who wrote this round's real answer { author, month, flags, entryId }
    code: generateRoomCode(),
    phase: PHASES.LOBBY,
    players: [{ id: hostId, name: hostName, score: 0, connected: true }],
    hostId,
    timerDuration,
    settings: { ...DEFAULT_SETTINGS },
    round: 0,
    dealerIndex: -1,
    usedCartoonIds: [],
    cartoon: null,
    correctCaption: '',
    autoClose: false,
    submissions: [],      // { playerId, playerName, caption }
    closedCaption: '',
    closedIsCorrect: false,
    closedPlayerId: null,
    openCaptions: [],     // { caption, isCorrect, playerId }
    firstBets: {},
    secondBets: {},
    bets: [],             // public log, in order: { playerId, target, count, stage, stolen? }
    betOrder: [],
    steal: null,          // { victimId, target, stage, betIndex } | { skipped: true }
    mulliganVotes: [],
    mulliganCount: 0,
    mulliganEvent: null,  // { n, quip, image }
    roundScores: {},
    roundScoreDetails: {},
    dealerBonusAwarded: false,
    previousRank: {},
    timerEnd: null,
    timerToken: 0,
    history: [],
    reactions: {},        // { [targetKey]: { [playerId]: kind } } — this round only
    reel: null,           // the answer screen's reveal reel: { order: [targetKey...], step }
    roundBadges: [],      // { kind, playerIds, target, detail } — this round
    gameBadges: [],       // every round's badges this game, each with its round
    crowns: {},           // Grand Poobah crowns this game: { playerId: n }
    promotion: null,      // the latest rank-up: { playerId, name, rank, n, at }
  };
}

function cleanSeen(ids) {
  const valid = new Set(CARTOONS.map(c => c.id));
  return Array.isArray(ids) ? [...new Set(ids.map(Number).filter(n => valid.has(n)))] : [];
}
function setSeen(game, ids) { game.seenIds = cleanSeen(ids); }

function updateSettings(game, partial) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Settings can only be changed in the lobby' };
  const s = game.settings;
  const ints = ['rounds', 'targetScore', 'pointsOpenBet', 'pointsClosedBet', 'pointsOpenLate', 'pointsClosedLate', 'pointsPerFool', 'dealerBonus', 'pointsStealCorrect'];
  for (const key of Object.keys(partial || {})) {
    const val = partial[key];
    if (key === 'stealEnabled') { s.stealEnabled = !!val; continue; }
    if (key === 'expert') {
      if (typeof val !== 'boolean') return { error: 'Invalid expert mode' };
      if (val && deckCartoons(game) < 3) return { error: 'The Gallery opens once 3 cartoons have a framed caption' };
      s.expert = val; continue;
    }
    if (key === 'direction') { if (val !== 'left' && val !== 'right') return { error: 'Invalid direction' }; s.direction = val; continue; }
    if (key === 'autoCloseProbability') {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > 1) return { error: 'Invalid auto-close probability' };
      s.autoCloseProbability = n; continue;
    }
    if (!ints.includes(key)) continue;
    if (val === null && (key === 'rounds' || key === 'targetScore')) { s[key] = null; continue; }
    const n = Number(val);
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: `Invalid ${key}` };
    s[key] = n;
  }
  return { ok: true };
}

function addPlayer(game, playerId, playerName) {
  if (game.players.length >= MAX_PLAYERS) return { error: `Game is full (max ${MAX_PLAYERS})` };
  if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) return { error: 'Name already taken' };
  // Late joiners are added at the end of the table, so the deal order of everyone else is unchanged.
  // They score from zero and join in from the current writing phase or the next round.
  game.players.push({ id: playerId, name: playerName, score: 0, connected: true, joinedRound: game.round });
  return { ok: true, midGame: game.phase !== PHASES.LOBBY };
}

function kickPlayer(game, hostId, targetPlayerId) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Can only remove players in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can remove players' };
  if (hostId === targetPlayerId) return { error: 'You can\'t remove yourself' };
  const target = game.players.find(p => p.id === targetPlayerId);
  if (!target) return { error: 'Player not in game' };
  game.players = game.players.filter(p => p.id !== targetPlayerId);
  return { ok: true, kickedName: target.name };
}

// Lobby: the host moves a seat up (-1) or down (+1) the table order
function moveSeat(game, hostId, targetId, dir) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Seats can only be changed in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can arrange the seats' };
  const i = game.players.findIndex(p => p.id === targetId), j = i + (dir < 0 ? -1 : 1);
  if (i < 0) return { error: 'Player not in game' };
  if (j < 0 || j >= game.players.length) return { ok: true };
  [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
  return { ok: true };
}

const connectedPlayers = (game) => game.players.filter(p => p.connected);
const dealerOf = (game) => game.players[game.dealerIndex] || null;
const nameOfPlayer = (game, pid) => (game.players.find(p => p.id === pid) || {}).name || '?';

const stepOf = (game) => (game.settings.direction === 'right' ? -1 : 1);
const seatAt = (n, i) => ((i % n) + n) % n;

// The next seat after `from`, going the table's direction, held by someone who is here.
// The first deal of a game goes to seat 1. Falls back to the next seat.
function nextDealerIndex(game, from) {
  const n = game.players.length, step = stepOf(game);
  if (!n) return -1;
  if (from < 0) { for (let k = 0; k < n; k++) if (game.players[k].connected) return k; return 0; }
  for (let k = 1; k <= n; k++) {
    const i = seatAt(n, from + k * step);
    if (game.players[i].connected) return i;
  }
  return seatAt(n, from + step);
}

/* ── Which rounds have the real caption face-down ──
   Planned ahead so it's about the lobby's share of rounds, never two in a row. */
function planBlock(len, k, forbidFirst) {
  const start = forbidFirst ? 1 : 0, m = len - start;
  k = Math.max(0, Math.min(k, Math.ceil(m / 2)));
  // k non-adjacent spots among m: pick k of (m - k + 1), then spread them apart
  const picks = shuffleArray([...Array(Math.max(0, m - k + 1)).keys()]).slice(0, k).sort((a, b) => a - b);
  const block = Array(len).fill(false);
  picks.forEach((c, i) => { block[start + c + i] = true; });
  return block;
}
// "A little luck" (Nick, Oct 17): every planned round gets its own chance at the lobby's share,
// so a game averages 15% but can land on 0, 1 or now and then 2 (or more in long games).
const luckyCount = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; };
function ensurePlan(game, round) {
  const p = game.settings.autoCloseProbability;
  if (!game.closePlan.length && !game.settings.targetScore) {
    const n = totalRounds(game);
    game.closePlan = planBlock(n, luckyCount(n, p), false);
  }
  while (game.closePlan.length < round) {
    // First-to-X games (and extra rounds): blocks of 7, same luck
    game.closePlan.push(...planBlock(7, luckyCount(7, p), !!game.closePlan[game.closePlan.length - 1]));
  }
  return !!game.closePlan[round - 1];
}

/* ── Expert Mode: the real answer is a Hall of Fame caption ──
   Never one written by someone at this table (nobody gets dealt their own caption as the answer). */
const tableNames = (game) => new Set(game.players.map(p => p.name.toLowerCase()));
function expertCartoonIds(game) {
  const names = tableNames(game), out = new Set();
  for (const [id, authors] of store.cartoonAuthors()) for (const a of authors.keys()) if (!names.has(a)) { out.add(id); break; }
  return CARTOONS.filter(c => out.has(c.id)).map(c => c.id);
}
const deckCartoons = (game) => expertCartoonIds(game).length;

// Expert deal: a cartoon with a Hall of Fame caption this table can play, or null (then deal normally)
function dealExpert(game, currentId) {
  const ok = new Set(expertCartoonIds(game)), seen = new Set(game.seenIds || []);
  let pool = CARTOONS.filter(c => ok.has(c.id) && !game.usedCartoonIds.includes(c.id) && c.id !== currentId && !seen.has(c.id));
  // The host's phone has seen every deck cartoon: start over on those (the seen list stays for normal dealing)
  if (!pool.length) pool = CARTOONS.filter(c => ok.has(c.id) && !game.usedCartoonIds.includes(c.id) && c.id !== currentId);
  if (!pool.length) return null;   // every deck cartoon has been played this game
  const cartoon = pick(pool), names = tableNames(game);
  const entry = pick(store.byCartoon(cartoon.id).filter(e => !names.has(e.author.toLowerCase())));
  return entry ? { cartoon, entry } : null;
}

// Put a fresh cartoon on the table, never the one being replaced
function dealCartoon(game) {
  const currentId = game.cartoon ? game.cartoon.id : null;
  const x = game.settings.expert ? dealExpert(game, currentId) : null;
  if (x) {
    game.usedCartoonIds.push(x.cartoon.id);
    game.cartoon = { id: x.cartoon.id, title: x.cartoon.title, image: x.cartoon.image };
    game.correctCaption = polish(x.entry.caption).text;
    game.realCredit = { author: x.entry.author, month: x.entry.month, flags: x.entry.flags, entryId: x.entry.id };
  } else dealNormal(game, currentId);
  game.autoClose = ensurePlan(game, Math.max(1, game.round));   // a mulligan keeps the round's plan
  game.submissions = [];
  game.mulliganVotes = [];
  game.timerEnd = Date.now() + game.timerDuration * 1000;
  game.timerToken = (game.timerToken || 0) + 1;
}
function dealNormal(game, currentId) {
  const seen = new Set(game.seenIds || []);
  let available = CARTOONS.filter(c => !game.usedCartoonIds.includes(c.id) && c.id !== currentId && !seen.has(c.id));
  if (available.length === 0) {
    // The host's phone has seen the whole deck: start over
    game.seenIds = [];
    available = CARTOONS.filter(c => !game.usedCartoonIds.includes(c.id) && c.id !== currentId);
  }
  if (available.length === 0) {
    game.usedCartoonIds = currentId ? [currentId] : [];
    available = CARTOONS.filter(c => c.id !== currentId);
  }
  const cartoon = pick(available.length ? available : CARTOONS);
  game.usedCartoonIds.push(cartoon.id);
  game.cartoon = { id: cartoon.id, title: cartoon.title, image: cartoon.image };
  game.correctCaption = cartoon.correct;
  game.realCredit = null;
}

function startRound(game, options = {}) {
  if (!options.sameRound) {
    game.round++;
    game.dealerIndex = nextDealerIndex(game, game.dealerIndex);
  }
  dealCartoon(game);
  game.closedCaption = '';
  game.closedIsCorrect = false;
  game.closedPlayerId = null;
  game.openCaptions = [];
  game.firstBets = {};
  game.secondBets = {};
  game.bets = [];
  game.betOrder = [];
  game.steal = null;
  game.mulliganEvent = null;
  game.roundScores = {};
  game.roundScoreDetails = {};
  game.dealerBonusAwarded = false;
  game.reactions = {};
  game.reel = null;
  game.roundBadges = [];
  game.phase = PHASES.WRITING;
}

// Someone whose phone just locked or blinked off for a few seconds still counts as here
const AWAY_GRACE_MS = 15000;
const isPresent = (p) => p.connected || (p.disconnectedAt && Date.now() - p.disconnectedAt < AWAY_GRACE_MS);

// Everyone who is here has written something
function allCaptionsIn(game) {
  const here = game.players.filter(isPresent);
  return here.length > 0 && here.every(p => game.submissions.some(s => s.playerId === p.id));
}

// mode: 'check' = if there are likely typos, send them back to the writer instead of submitting;
//       'fix'   = submit with the spelling fixes; 'keep' = submit with the writer's own spelling.
// Punctuation, capitals and apostrophes are always tidied.
function submitCaption(game, playerId, caption, mode = 'check') {
  if (game.phase !== PHASES.WRITING) return { error: 'Writing time is over' };
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { error: 'Player not in game' };
  if (game.submissions.some(s => s.playerId === playerId)) return { error: 'Already submitted' };
  const raw = (caption || '').toString();
  if (raw.length > 400) return { error: 'Caption too long (max 200)' };
  const p = polish(raw);
  if (!p.text || !/[A-Za-z0-9]/.test(p.text)) return { error: 'Caption cannot be empty' };
  if (p.text.length > 220) return { error: 'Caption too long (max 200)' };
  if (mode === 'check' && p.typos.length) return { ok: true, check: { polished: p.text, fixed: p.fixed, typos: p.typos } };
  const finalText = mode === 'keep' ? p.text : p.fixed;
  game.submissions.push({ playerId, playerName: player.name, caption: finalText });
  return { ok: true, allIn: allCaptionsIn(game) };
}

// Toggle this player's mulligan vote. Half the table (at least 2 people) swaps the cartoon.
function mulliganThreshold(game) {
  const c = connectedPlayers(game).length;
  return c < 2 ? 1 : Math.max(2, Math.ceil(c / 2));
}
function voteMulligan(game, playerId) {
  if (game.phase !== PHASES.WRITING) return { error: 'You can only mulligan while writing' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  const i = game.mulliganVotes.indexOf(playerId);
  if (i >= 0) { game.mulliganVotes.splice(i, 1); return { ok: true, triggered: false }; }
  game.mulliganVotes.push(playerId);
  const here = new Set(connectedPlayers(game).map(p => p.id));
  const votes = game.mulliganVotes.filter(id => here.has(id)).length;
  if (votes < mulliganThreshold(game)) return { ok: true, triggered: false };

  const oldImage = game.cartoon ? game.cartoon.image : null;
  dealCartoon(game);
  game.mulliganCount = (game.mulliganCount || 0) + 1;
  game.mulliganEvent = { n: game.mulliganCount, quip: pick(MULLIGAN_QUIPS), kind: pick(EXECUTIONS), image: oldImage, at: Date.now() };
  return { ok: true, triggered: true };
}

// Writing is over: the app picks the Closed Caption and lays out the rest.
function finishWriting(game) {
  if (game.phase !== PHASES.WRITING) return { ok: true, noop: true };
  if (game.submissions.length === 0) return { ok: true, empty: true };

  const subs = shuffleArray(game.submissions);
  if (game.autoClose) {
    game.closedCaption = game.correctCaption;
    game.closedIsCorrect = true;
    game.closedPlayerId = null;
    game.openCaptions = subs.map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId }));
  } else {
    const chosen = subs[0];
    game.closedCaption = chosen.caption;
    game.closedIsCorrect = false;
    game.closedPlayerId = chosen.playerId;
    const opens = subs.slice(1).map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId }));
    opens.push({ caption: game.correctCaption, isCorrect: true, playerId: null });
    game.openCaptions = shuffleArray(opens);
  }
  game.mulliganVotes = [];
  game.phase = PHASES.READING;
  return { ok: true };
}

// Around the table from the dealer, in the table's direction; the dealer doesn't bet
function computeBetOrder(game) {
  const n = game.players.length, order = [], step = stepOf(game);
  for (let k = 1; k < n; k++) order.push(game.players[seatAt(n, game.dealerIndex + k * step)].id);
  return order;
}

function moveToFirstBets(game) {
  if (game.phase !== PHASES.READING) return { error: 'Not reading' };
  game.betOrder = computeBetOrder(game);
  game.bets = [];
  game.phase = PHASES.FIRST_BETS;
  return { ok: true };
}

const stageBet = (game, pid, stage) => game.bets.find(b => b.playerId === pid && b.stage === stage) || null;

function eligibleSecondBetters(game) {
  return game.betOrder.filter(pid => { const b1 = stageBet(game, pid, 1); return b1 && b1.target !== 'pass' && b1.count === 1; });
}

function pendingBetters(game) {
  if (game.phase === PHASES.FIRST_BETS) return game.betOrder.filter(pid => !stageBet(game, pid, 1));
  if (game.phase === PHASES.SECOND_BETS) return eligibleSecondBetters(game).filter(pid => !stageBet(game, pid, 2));
  return [];
}
function currentBetterId(game) { const p = pendingBetters(game); return p.length ? p[0] : null; }

function validateTarget(game, target) {
  if (target === 'closed') return { ok: true, target: 'closed' };
  if ((typeof target !== 'number' && typeof target !== 'string') || target === '') return { error: 'Invalid caption' };   // Number({}) can throw; Number(null) is 0
  const idx = Number(target);
  if (!Number.isInteger(idx) || idx < 0 || idx >= game.openCaptions.length) return { error: 'Invalid caption' };
  return { ok: true, target: idx };
}

function placeBet(game, playerId, betTarget) {
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : game.phase === PHASES.SECOND_BETS ? 2 : 0;
  if (!stage) return { error: 'Not a betting phase' };
  const dealer = dealerOf(game);
  if (dealer && dealer.id === playerId) return { error: 'The dealer doesn\'t bet' };
  if (stageBet(game, playerId, stage)) return { error: 'You already bet' };
  if (currentBetterId(game) !== playerId) return { error: 'Not your turn yet' };
  if (!betTarget || typeof betTarget !== 'object') return { error: 'Invalid bet' };
  const count = Number(betTarget.count);
  if (stage === 1 && count !== 1 && count !== 2) return { error: 'Invalid chip count' };
  if (stage === 2 && count !== 1) return { error: 'You have one chip left' };
  const v = validateTarget(game, betTarget.target);
  if (v.error) return v;
  // Second chip can go anywhere — including on top of your first one.
  game.bets.push({ playerId, target: v.target, count, stage });
  (stage === 1 ? game.firstBets : game.secondBets)[playerId] = { target: v.target, count };
  return { ok: true, allIn: pendingBetters(game).length === 0 };
}

function skipCurrentBetter(game) {
  if (game.phase !== PHASES.FIRST_BETS && game.phase !== PHASES.SECOND_BETS) return { error: 'Not a betting phase' };
  const pid = currentBetterId(game);
  if (!pid) return { error: 'Nobody is waiting to bet' };
  game.bets.push({ playerId: pid, target: 'pass', count: 0, stage: game.phase === PHASES.FIRST_BETS ? 1 : 2 });
  return { ok: true, skipped: pid, allIn: pendingBetters(game).length === 0 };
}

function moveToReveal(game) {
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Not in blind bets' };
  game.phase = PHASES.REVEAL;
  return { ok: true };
}

const chipsOnTable = (game) => game.bets.reduce((n, b) => n + (b.target === 'pass' ? 0 : b.count), 0);

// After the reveal: second bets if anyone has a chip left, else straight on
function moveFromReveal(game) {
  if (game.phase !== PHASES.REVEAL) return { error: 'Not revealing' };
  if (eligibleSecondBetters(game).length) { game.phase = PHASES.SECOND_BETS; return { ok: true }; }
  return afterAllBets(game);
}

// All chips are down: the dealer's steal, or straight to the answer
function afterAllBets(game) {
  const dealer = dealerOf(game);
  if (game.settings.stealEnabled && dealer && chipsOnTable(game) > 0) {
    game.phase = PHASES.STEAL;
    game.steal = null;
    return { ok: true };
  }
  revealAnswer(game);
  return { ok: true };
}

function moveFromSecondBets(game) {
  if (game.phase !== PHASES.SECOND_BETS) return { error: 'Not in second bets' };
  return afterAllBets(game);
}

// The dealer knocks one chip off the table (betIndex = index in game.bets), or passes (null)
function stealChip(game, betIndex) {
  if (game.phase !== PHASES.STEAL) return { error: 'Not the steal' };
  if (betIndex === null || betIndex === undefined) {
    game.steal = { skipped: true };
  } else {
    const bet = game.bets[Number(betIndex)];
    if (!bet || bet.target === 'pass' || bet.count < 1) return { error: 'No chip there' };
    bet.count -= 1;
    bet.stolen = (bet.stolen || 0) + 1;
    game.steal = { victimId: bet.playerId, target: bet.target, stage: bet.stage, betIndex: Number(betIndex), onCorrect: isBetOnCorrect(game, bet), gloat: pick(GLOATS), seed: Math.floor(Math.random() * 1e9), at: Date.now() };
  }
  revealAnswer(game);
  return { ok: true };
}

function isBetOnCorrect(game, bet) {
  if (!bet || bet.target === 'pass') return false;
  if (bet.target === 'closed') return !!game.closedIsCorrect;
  const c = game.openCaptions[bet.target];
  return !!(c && c.isCorrect);
}

function revealAnswer(game) {
  game.phase = PHASES.ANSWER;
  const s = game.settings;
  const scores = {}, details = {};
  game.players.forEach(p => { scores[p.id] = 0; details[p.id] = []; });
  const add = (pid, pts, reason) => {
    if (!pts || !(pid in scores)) return;
    scores[pid] += pts;
    details[pid].push({ pts, reason });
  };

  let anyoneRight = false;
  for (const bet of game.bets) {
    if (!bet || bet.target === 'pass' || bet.count < 1) continue;
    const blind = bet.stage === 1, onClosed = bet.target === 'closed', both = bet.count === 2;
    if (isBetOnCorrect(game, bet)) {
      anyoneRight = true;
      const per = blind ? (onClosed ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
      let reason;
      if (blind && onClosed && both) reason = 'Shot the Moon';
      else if (blind && both) reason = 'Half-Moon on the real caption';
      else if (blind && onClosed) reason = 'Blind chip on the Closed Caption';
      else if (blind) reason = 'Blind chip on the real caption';
      else reason = 'Late chip on the real caption';
      add(bet.playerId, per * bet.count, reason);
    }
    const author = onClosed ? game.closedPlayerId : (game.openCaptions[bet.target] || {}).playerId;
    if (author && author !== bet.playerId) add(author, s.pointsPerFool * bet.count, `Fooled ${nameOfPlayer(game, bet.playerId)}`);
  }

  const dealer = dealerOf(game);
  // Nick's rule: stealing a chip off the real caption pays the dealer
  if (dealer && game.steal && game.steal.victimId && game.steal.onCorrect) add(dealer.id, s.pointsStealCorrect, 'Stole a chip off the real caption');
  game.dealerBonusAwarded = false;
  if (!anyoneRight && dealer && s.dealerBonus > 0) {
    add(dealer.id, s.dealerBonus, 'Dealer’s revenge — no chip on the real caption');
    game.dealerBonusAwarded = true;
  }

  game.roundScores = scores;
  game.roundScoreDetails = details;

  // Rank before this round's points (tied players share a rank)
  game.previousRank = {};
  game.players.forEach(p => { game.previousRank[p.id] = game.players.filter(q => q.score > p.score).length; });
  for (const [pid, pts] of Object.entries(scores)) {
    const p = game.players.find(x => x.id === pid);
    if (p) p.score += pts;
  }

  game.reel = { order: reelOrder(game), step: 1 };
  // Badges never break the answer: if anything goes wrong, the round just has none
  try { awardBadges(game); } catch (e) { console.error('badges', e); game.roundBadges = []; }

  game.history.push({
    round: game.round,
    cartoon: { ...game.cartoon },
    correctCaption: game.correctCaption,
    realCredit: game.realCredit ? { ...game.realCredit } : null,
    dealerName: dealer ? dealer.name : '',
    autoClose: game.autoClose,
    openCaptions: game.openCaptions.map(c => ({ caption: c.caption, isCorrect: c.isCorrect, playerId: c.playerId, playerName: c.playerId ? nameOfPlayer(game, c.playerId) : null })),
    closedCaption: game.closedCaption,
    closedIsCorrect: game.closedIsCorrect,
    closedPlayerId: game.closedPlayerId,
    closedPlayerName: game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null,
    bets: game.bets.map(b => ({ ...b })),
    steal: game.steal ? { ...game.steal } : null,
    roundScores: { ...scores },
    roundScoreDetails: JSON.parse(JSON.stringify(details)),
    dealerBonusAwarded: game.dealerBonusAwarded,
    reactions: JSON.parse(JSON.stringify(game.reactions || {})),
    reelOrder: [...game.reel.order],
    badges: JSON.parse(JSON.stringify(game.roundBadges)),
  });
}

function moveToScoreboard(game) {
  if (game.phase !== PHASES.ANSWER) return { error: 'Not on the answer' };
  if (game.reel && game.reel.step < game.reel.order.length + 1) return { error: 'Finish the reveal first' };
  game.phase = PHASES.SCORES;
  game.scoresAt = Date.now();   // phones time the Grand Poobah ceremony from this, so it plays together
  return { ok: true };
}

function totalRounds(game) { return game.settings.rounds || game.players.length; }

function isGameOver(game) {
  const s = game.settings;
  if (s.targetScore && s.targetScore > 0 && game.players.some(p => p.score >= s.targetScore)) return true;
  if (s.targetScore && s.targetScore > 0) return false;
  return game.round >= totalRounds(game);
}

/* ── Hall of Fame flags: one per player per game, honour only ── */
function authorOf(game, target) { return target === 'closed' ? game.closedPlayerId : (game.openCaptions[target] || {}).playerId; }
function plantFlag(game, playerId, target) {
  if (game.phase !== PHASES.ANSWER && game.phase !== PHASES.SCORES) return { error: 'Flags go down after the answer' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  const v = validateTarget(game, target);
  if (v.error) return v;
  if (authorOf(game, v.target) === playerId) return { error: 'You can’t flag your own caption' };
  const mine = game.flags.find(f => f.fromId === playerId);
  if (mine && mine.round !== game.round) return { error: 'You already used your flag this game' };
  if (mine && String(mine.target) === String(v.target)) { game.flags = game.flags.filter(f => f !== mine); return { ok: true, removed: true }; }
  if (mine) game.flags = game.flags.filter(f => f !== mine);
  game.flags.push({ fromId: playerId, round: game.round, target: v.target, at: Date.now() });
  const fl = game.flags.filter(f => f.round === game.round && String(f.target) === String(v.target)), count = fl.length;
  const key = game.round + '|' + v.target;
  game.inducted = game.inducted || [];
  if (count < inductNeed(game) || game.inducted.includes(key)) return { ok: true, count };
  // The moment happens once: taking a flag back later never un-inducts it
  game.inducted.push(key);
  try { induct(game, v.target, fl, count); } catch (e) { console.error('induction', e); }
  return { ok: true, count, inducted: true };
}
// Big tables need three flags; five or fewer, two
const inductNeed = (game) => (game.players.length <= 5 ? 2 : 3);
// A caption just made the Hall of Fame: player-written fakes join the permanent deck
function induct(game, target, fl, count) {
  const h = game.history.find(x => x.round === game.round);
  if (!h) return;
  const c = target === 'closed' ? { caption: h.closedCaption, playerId: h.closedPlayerId, isCorrect: h.closedIsCorrect } : (h.openCaptions[target] || {});
  const isReal = !!c.isCorrect, author = c.playerId ? nameOfPlayer(game, c.playerId) : null;
  const image = h.cartoon && h.cartoon.image, flaggers = fl.map(f => nameOfPlayer(game, f.fromId)), month = MONTH();
  let entry = null;
  // The real caption is celebrated but not added (it's already the real one)
  if (!isReal && author && c.caption) entry = store.add({ cartoonId: h.cartoon.id, image, caption: c.caption, author, flaggers, flags: count, month });
  game.lastInduction = {
    n: ((game.lastInduction && game.lastInduction.n) || game.inductionCount || 0) + 1,
    round: game.round, target, at: Date.now(), caption: c.caption || '', author: isReal ? null : author, isReal,
    image, flaggers, flags: count, month, entryId: entry ? entry.id : null,
  };
}
const MONTH = () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
// Captions with enough flags (see inductNeed), with everything a Hall of Fame card needs
function hallOfFame(game) {
  const groups = new Map();
  for (const f of game.flags) { const k = f.round + '|' + f.target; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }
  const out = [];
  for (const [k, fl] of groups) {
    // Once inducted, always listed (even if a late joiner raises the bar or a flag is taken back)
    if (fl.length < inductNeed(game) && !(game.inducted || []).includes(k)) continue;
    const { round, target } = fl[0];
    let caption, writerName, writerId, image, isReal;
    const live = round === game.round && (game.phase === PHASES.ANSWER || game.phase === PHASES.SCORES);
    const h = game.history.find(x => x.round === round);
    if (!h) continue;
    image = h.cartoon && h.cartoon.image;
    if (target === 'closed') { caption = h.closedCaption; writerId = h.closedPlayerId; isReal = !!h.closedIsCorrect; }
    else { const c = h.openCaptions[target] || {}; caption = c.caption; writerId = c.playerId; isReal = !!c.isCorrect; }
    writerName = writerId ? nameOfPlayer(game, writerId) : null;
    out.push({ round, target, caption, writerId, writerName, isReal, image, flaggers: fl.map(f => nameOfPlayer(game, f.fromId)), month: MONTH(), live });
  }
  return out.sort((a, b) => a.round - b.round);
}

/* ── Emoji reactions: one per person per caption, counts only until the answer ── */
const REACTION_KINDS = ['laugh', 'up', 'fire', 'huh', 'dead', 'roll'];
const REACT_FACE_UP = [PHASES.READING, PHASES.FIRST_BETS];            // the Closed Caption is still face-down
const REACT_ALL = [PHASES.REVEAL, PHASES.SECOND_BETS];                 // open captions and the Closed Caption
function react(game, playerId, target, kind) {
  const early = REACT_FACE_UP.includes(game.phase);
  if (!early && !REACT_ALL.includes(game.phase)) return { error: 'Reactions close once the bets are in' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  if (!REACTION_KINDS.includes(kind)) return { error: 'Invalid reaction' };
  const v = validateTarget(game, target);
  if (v.error) return v;
  if (early && v.target === 'closed') return { error: 'The Closed Caption is still face-down' };
  const key = String(v.target);
  const map = game.reactions[key] || (game.reactions[key] = {});
  if (map[playerId] === kind) delete map[playerId];   // same one again takes it back
  else map[playerId] = kind;                          // a different one replaces it
  return { ok: true };
}
// { [targetKey]: { [kind]: n } } — never who, or it would give away who wrote what
function reactionCounts(game) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) {
    const c = {};
    for (const kind of Object.values(map)) c[kind] = (c[kind] || 0) + 1;
    if (Object.keys(c).length) out[key] = c;
  }
  return out;
}
function myReactions(game, playerId) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) if (map[playerId]) out[key] = map[playerId];
  return out;
}

/* ── Who wrote what, and who believed it (shared by the reel and the badges) ── */
const keyOf = (t) => String(t);
const chipsOf = (b) => (b && b.target !== 'pass' ? (b.count || 0) + (b.stolen || 0) : 0);   // stolen chips still count as belief
const writerOfKey = (game, key) => (key === 'closed' ? game.closedPlayerId : (game.openCaptions[Number(key)] || {}).playerId) || null;
const realKey = (game) => (game.closedIsCorrect ? 'closed' : keyOf(game.openCaptions.findIndex(c => c.isCorrect)));
const captionOfKey = (game, key) => (key === 'closed' ? game.closedCaption : (game.openCaptions[Number(key)] || {}).caption) || '';
// Every caption a player wrote this round (the Closed Caption included when it's theirs)
function playerKeys(game) {
  const keys = game.openCaptions.map((c, i) => (c.playerId ? keyOf(i) : null)).filter(k => k !== null);
  if (game.closedPlayerId) keys.push('closed');
  return keys;
}
// Chips other players put on a caption (the writer's own don't count)
function votesOn(game, key) {
  const w = writerOfKey(game, key);
  return game.bets.reduce((n, b) => n + (keyOf(b.target) === key && b.playerId !== w ? chipsOf(b) : 0), 0);
}
// Fakes from fewest votes to most (ties in random order), the real caption last
function reelOrder(game) {
  const fakes = shuffleArray(playerKeys(game)).map(k => ({ k, v: votesOn(game, k) })).sort((a, b) => a.v - b.v).map(x => x.k);
  const real = realKey(game);
  return real === '-1' ? fakes : [...fakes, real];
}
// The dealer steps through the reel one caption at a time; the last step is the round recap
function reelStep(game, how) {
  if (game.phase !== PHASES.ANSWER || !game.reel) return { error: 'Not on the answer' };
  const last = game.reel.order.length + 1;
  if (how === 'next') { if (game.reel.step >= last) return { error: 'Already at the recap' }; game.reel.step++; }
  else if (how === 'prev') { if (game.reel.step <= 1) return { error: 'Already at the first caption' }; game.reel.step--; }
  else if (how === 'skip') game.reel.step = last;
  else return { error: 'Invalid step' };
  return { ok: true, step: game.reel.step };
}

/* ── Badges: worked out once the answer is in, never shown before.
   Only the five that tell a story: moon, three_bagger, clean_sweep, great_minds, pickpocket ── */
const normCaption = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function nearlySame(a, b) {
  const x = normCaption(a), y = normCaption(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const wx = new Set(x.split(' ')), wy = new Set(y.split(' '));
  if (x.split(' ').length < 3 || y.split(' ').length < 3) return false;
  const both = [...wx].filter(w => wy.has(w)).length;
  return both / new Set([...wx, ...wy]).size >= 0.6;
}
function awardBadges(game) {
  const here = new Set(game.players.map(p => p.id));
  const out = [];
  const give = (kind, ids, target, detail = {}) => {
    const playerIds = [...new Set(ids)].filter(id => here.has(id));
    if (playerIds.length) out.push({ kind, playerIds, target: target === null ? null : keyOf(target), detail });
  };
  const real = realKey(game);
  const fakes = playerKeys(game);
  const order = (game.reel && game.reel.order) || [];
  const bothBlind = (b) => b.stage === 1 && chipsOf(b) === 2;
  const betsOn = (key) => game.bets.filter(b => keyOf(b.target) === key && chipsOf(b) > 0);
  const othersOn = (key, test = () => true) => [...new Set(betsOn(key).filter(b => b.playerId !== writerOfKey(game, key) && test(b)).map(b => b.playerId))];

  // Moon: both chips blind on the real caption (Shoot the Moon if it was face-down)
  for (const b of game.bets) if (bothBlind(b) && keyOf(b.target) === real) give('moon', [b.playerId], real, { shot: real === 'closed' ? 'moon' : 'half' });

  for (const key of fakes) {
    const w = writerOfKey(game, key), votes = votesOn(game, key);
    const bagged = othersOn(key, bothBlind);
    if (bagged.length >= 3) give('three_bagger', [w], key, { by: bagged });
    const backers = othersOn(key);
    const field = game.betOrder.filter(id => id !== w);
    if (field.length >= 2 && field.every(id => backers.includes(id))) give('clean_sweep', [w], key, { votes });
  }

  // Great minds: two players wrote nearly the same caption; it pops on whichever is revealed second
  for (let i = 0; i < fakes.length; i++) for (let j = i + 1; j < fakes.length; j++) {
    const a = fakes[i], b = fakes[j];
    if (!nearlySame(captionOfKey(game, a), captionOfKey(game, b))) continue;
    const later = order.indexOf(a) > order.indexOf(b) ? a : b;
    give('great_minds', [writerOfKey(game, a), writerOfKey(game, b)], later, { targets: [a, b] });
  }

  // Pickpocket: the dealer stole a chip off the real caption
  const dealer = dealerOf(game);
  if (dealer && game.steal && game.steal.victimId && game.steal.onCorrect) give('pickpocket', [dealer.id], game.steal.target, {});

  // (The Grand Poobah is crowned by the phones from the bets; it is not a badge.)

  game.roundBadges = out;
  game.gameBadges = (game.gameBadges || []).concat(out.map(b => ({ ...b, round: game.round })));
}

/* ── Ranks: each phone keeps its own career; the server only passes it around ── */
const careerInt = (n) => Number.isInteger(n) && n >= 0 && n <= 100000;
function setCareer(game, playerId, rank, rockets, total) {
  const p = game.players.find(x => x.id === playerId);
  if (!p) return { error: 'Player not in game' };
  if (rank !== null && (typeof rank !== 'string' || rank.length > 20)) return { error: 'Invalid rank' };
  if (!careerInt(rockets) || !careerInt(total)) return { error: 'Invalid career' };
  const before = p.rank === undefined ? null : p.rank;
  p.rank = rank; p.rockets = rockets; p.badgeTotal = total;
  // A new rank (not the first one we hear about) is a promotion the whole table sees
  const RANKS = ['Cadet', 'Captain', 'Commodore', 'Admiral'];
  // Only a real step UP is announced (a borrowed phone or a reset never shows as a 'promotion')
  if (before !== null && rank !== null && RANKS.indexOf(rank) > RANKS.indexOf(before) && RANKS.indexOf(before) >= 0) {
    game.promotion = { playerId, name: p.name, rank, n: (game.promotion ? game.promotion.n : 0) + 1, at: Date.now() };
    return { ok: true, promoted: true };
  }
  return { ok: true };
}

function resetForNewGame(game) {
  game.phase = PHASES.LOBBY;
  game.flags = [];
  game.inducted = [];
  game.realCredit = null;
  // The celebration belongs to the old game (n keeps counting, so phones still spot the next one)
  game.inductionCount = game.lastInduction ? game.lastInduction.n : (game.inductionCount || 0);
  game.lastInduction = null;
  game.closePlan = [];
  game.round = 0;
  game.dealerIndex = -1;
  game.history = [];
  game.previousRank = {};
  game.players.forEach(p => { p.score = 0; });
  game.cartoon = null;
  game.submissions = [];
  game.bets = [];
  game.betOrder = [];
  game.steal = null;
  game.mulliganVotes = [];
  game.mulliganEvent = null;
  game.roundScores = {};
  game.roundScoreDetails = {};
  game.timerEnd = null;
  game.timerToken = (game.timerToken || 0) + 1;
  game.reactions = {};
  game.reel = null;
  game.roundBadges = [];
  game.gameBadges = [];
  game.crowns = {};
}

const AFTER_WRITING = [PHASES.READING, PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.SCORES];
const BETTING_ON = [PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.SCORES];
const REVEALED = [PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.SCORES];
const ANSWERED = [PHASES.ANSWER, PHASES.SCORES];

const TAKEOVER_SECS = 30;
const GAZETTE_SIZE = 40;

// What each phone is allowed to see
function getPlayerView(game, playerId) {
  const dealer = dealerOf(game);
  const isDealer = !!dealer && dealer.id === playerId;
  const dealerAwaySecs = dealer && !dealer.connected && dealer.disconnectedAt ? Math.floor((Date.now() - dealer.disconnectedAt) / 1000) : 0;
  const s = game.settings;
  const published = store.authorCounts();   // lowercase name -> captions in the Hall of Fame deck

  const base = {
    code: game.code,
    phase: game.phase,
    players: game.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected, rank: p.rank === undefined ? null : p.rank, rockets: p.rockets || 0, published: published.get(p.name.toLowerCase()) || 0 })),
    round: game.round,
    totalRounds: s.targetScore ? null : totalRounds(game),
    settings: { ...s },
    deckSize: CARTOONS.length,
    hostId: game.hostId,
    isHost: game.hostId === playerId,
    dealerId: dealer ? dealer.id : null,
    dealerName: dealer ? dealer.name : null,
    dealerConnected: dealer ? dealer.connected : false,
    dealerAwaySecs,
    canTakeover: !isDealer && dealerAwaySecs >= TAKEOVER_SECS,
    takeoverSecs: TAKEOVER_SECS,
    isDealer,
    playerId,
    timerDuration: game.timerDuration,
    timerEnd: game.timerEnd,
    serverNow: Date.now(),
    promotion: game.promotion || null,
    inductNeed: inductNeed(game),
    lastInduction: game.lastInduction ? { ...game.lastInduction, flaggers: [...game.lastInduction.flaggers] } : null,   // only made after an answer
    hofDeck: deckCartoons(game),
    hofTotal: store.count(),
  };
  // The Gazette: the newest Hall of Fame captions, between rounds only
  if (game.phase === PHASES.LOBBY || game.phase === PHASES.SCORES) base.gazette = store.recent(GAZETTE_SIZE);
  if (game.phase === PHASES.LOBBY) return base;

  if (game.cartoon) base.cartoon = game.cartoon;
  const mine = game.submissions.find(x => x.playerId === playerId);

  if (game.phase === PHASES.WRITING) {
    base.submittedPlayerIds = game.submissions.map(x => x.playerId);
    base.hasSubmitted = !!mine;
    base.myCaption = mine ? mine.caption : null;
    base.mulliganVotes = [...game.mulliganVotes];
    base.mulliganNeeded = mulliganThreshold(game);
    base.myMulligan = game.mulliganVotes.includes(playerId);
  }
  base.mulliganEvent = game.mulliganEvent;

  if (AFTER_WRITING.includes(game.phase)) {
    base.openCaptions = game.openCaptions.map(c => c.caption);
    base.myOpenIndex = game.openCaptions.findIndex(c => c.playerId === playerId);
    base.iWrote = !!mine;
  }

  if (BETTING_ON.includes(game.phase)) {
    base.bets = game.bets.map(b => ({ ...b }));
    base.betOrder = [...game.betOrder];
    base.myFirstBet = game.firstBets[playerId] || null;
    base.mySecondBet = game.secondBets[playerId] || null;
    base.currentBetterId = currentBetterId(game);
    base.currentBetterName = base.currentBetterId ? nameOfPlayer(game, base.currentBetterId) : null;
    base.isMyTurn = base.currentBetterId === playerId;
    base.pendingBetters = pendingBetters(game);
    base.allBetsIn = base.pendingBetters.length === 0;
    base.eligibleSecondBetters = eligibleSecondBetters(game);
    base.steal = game.steal ? { ...game.steal } : null;
  }

  // Before the answer: how many of each reaction, never who; after: the full picture
  if (REACT_FACE_UP.includes(game.phase) || REACT_ALL.includes(game.phase) || game.phase === PHASES.STEAL) {
    base.reactionCounts = reactionCounts(game);
    base.myReactions = myReactions(game, playerId);
  }
  if (ANSWERED.includes(game.phase)) {
    base.reactions = JSON.parse(JSON.stringify(game.reactions || {}));
    base.reel = game.reel ? { order: [...game.reel.order], step: game.reel.step } : null;
    base.roundBadges = (game.roundBadges || []).map(b => ({ ...b }));
  }

  if (REVEALED.includes(game.phase)) {
    base.closedCaption = game.closedCaption;
    base.iWroteClosed = game.closedPlayerId === playerId;
  }

  if (ANSWERED.includes(game.phase)) {
    base.correctCaption = game.correctCaption;
    base.realCredit = game.realCredit ? { ...game.realCredit } : null;
    base.closedIsCorrect = game.closedIsCorrect;
    base.closedPlayerName = game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null;
    base.roundScores = game.roundScores;
    base.roundScoreDetails = game.roundScoreDetails || {};
    base.dealerBonusAwarded = !!game.dealerBonusAwarded;
    base.openCaptionDetails = game.openCaptions.map(c => ({ caption: c.caption, isCorrect: c.isCorrect, playerId: c.playerId, playerName: c.playerId ? nameOfPlayer(game, c.playerId) : null }));
    base.closedPlayerId = game.closedPlayerId;
    base.flags = game.flags.filter(f => f.round === game.round).map(f => ({ ...f }));
    base.allFlags = game.flags.map(f => ({ ...f }));
    const mf = game.flags.find(f => f.fromId === playerId);
    base.myFlag = mf ? { ...mf } : null;
    base.hallOfFame = hallOfFame(game);
  }

  if (game.phase === PHASES.SCORES) {
    base.gameOver = isGameOver(game);
    base.previousRank = game.previousRank || {};
    base.history = game.history || [];
    base.scoresAt = game.scoresAt || null;
    base.gameBadges = (game.gameBadges || []).map(b => ({ ...b }));
    if (!base.gameOver) {
      const nd = game.players[nextDealerIndex(game, game.dealerIndex)];
      base.nextDealerName = nd ? nd.name : '';
      base.nextDealerId = nd ? nd.id : null;
      base.isNextDealer = !!nd && nd.id === playerId;
    }
  }
  return base;
}

module.exports = {
  PHASES, CARTOONS, DEFAULT_SETTINGS, MAX_PLAYERS, TAKEOVER_SECS,
  createGame, updateSettings, addPlayer, kickPlayer, moveSeat, setSeen, plantFlag, hallOfFame, planBlock, ensurePlan,
  inductNeed, deckCartoons, dealCartoon, store,
  startRound, submitCaption, voteMulligan, finishWriting, allCaptionsIn,
  moveToFirstBets, placeBet, skipCurrentBetter, moveToReveal, moveFromReveal, moveFromSecondBets,
  stealChip, revealAnswer, moveToScoreboard, isGameOver, resetForNewGame,
  REACTION_KINDS, react, reelStep, reelOrder, votesOn, awardBadges, setCareer,
  currentBetterId, pendingBetters, nextDealerIndex, getPlayerView, generateRoomCode,
};
