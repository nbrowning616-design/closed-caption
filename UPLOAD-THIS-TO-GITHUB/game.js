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
//   8. FRAMING      "Anything frame-worthy?" Everyone secretly picks one caption (not their own) or passes.
//                   Enough picks on one caption and it's framed: it hangs in The Gallery.
//   9. SCORES       Scoreboard; the deal moves left.

const PHASES = {
  LOBBY: 'lobby',
  WRITING: 'writing',
  READING: 'reading',
  FIRST_BETS: 'first_bets',
  REVEAL: 'reveal',
  SECOND_BETS: 'second_bets',
  STEAL: 'steal',
  ANSWER: 'answer',
  FRAMING: 'framing',
  SCORES: 'scores',
};

const CARTOONS = [
  { id: 1, title: "The Fish Therapist", image: "card_1.jpg", correct: "From now on, let’s keep these sessions to fifteen minutes." },
  { id: 2, title: "The Alien Restaurant", image: "card_2.jpg", correct: "Could you take our picture? Nobody back home will believe this." },
  { id: 3, title: "Dog Board Meeting", image: "card_3.jpg", correct: "That’s all for today. Henderson, stay." },
  { id: 5, title: "Grim Reaper Café", image: "card_5.jpg", correct: "Don’t mind me. I’m early." },
  { id: 6, title: "Self-Driving Car", image: "card_6.jpg", correct: "Can we please not do this in front of the car?" },
  { id: 7, title: "Snowman Doctor", image: "card_7.jpg", correct: "Any recent travel to Florida?" },
  { id: 10, title: "Pigeon Consultant", image: "card_10.jpg", correct: "Keep wearing the suit. She’ll never know." },
  { id: 11, title: "Airplane Squeeze", image: "card_11.jpg", correct: "I haven’t felt my arms since Cleveland." },
  { id: 12, title: "Scuba Date", image: "card_12.jpg", correct: "I hear the soup is bottomless." },
  { id: 13, title: "Victorian Beach Lady", image: "card_13.jpg", correct: "Is that ironic? Tell me it’s ironic." },
  { id: 14, title: "Octopus Interview", image: "card_14.jpg", correct: "Strong résumé. The handshake was a lot." },
  { id: 16, title: "The Gym", image: "card_16.jpg", correct: "Is this what they meant by ‘results may vary’?" },
  { id: 17, title: "Pirate Therapy", image: "card_17.jpg", correct: "He tells the parrot things he won’t tell me." },
  { id: 19, title: "Giant Sushi", image: "card_19.jpg", correct: "Omakase means you don’t get to say when." },
  { id: 21, title: "Big Head Barber", image: "card_21.jpg", correct: "Just a little off the top." },
  { id: 22, title: "Giant Mouth Dentist", image: "card_22.jpg", correct: "Doctor, he says he’d like to rinse now." },
  { id: 23, title: "The Speedo Strut", image: "card_23.jpg", correct: "Everyone stay in the water until he passes." },
  { id: 24, title: "Horse Witness", image: "card_24.jpg", correct: "Isn’t it true you started wearing glasses for this trial?" },
  { id: 25, adult: true, title: "Stick Figure Art", image: "card_25.jpg", correct: "Honestly, it’s the twenty-five cents that gets me." },
  { id: 26, title: "Yoga Pretzel", image: "card_26.jpg", correct: "His free trial ended in April." },
  { id: 27, title: "Giraffe Tailor", image: "card_27.jpg", correct: "Nothing with spots. I don’t want to look like I’m trying." },
  { id: 29, title: "Enormous Cat", image: "card_29.jpg", correct: "The vet says it’s mostly fur." },
  { id: 30, title: "The Elevator", image: "card_30.jpg", correct: "Don’t look up. He’s from corporate." },
  { id: 31, title: "The Burger", image: "card_31.jpg", correct: "She keeps saying it isn’t a competition." },
  { id: 32, adult: true, title: "The Consultation", image: "card_32.jpg", correct: "Before we begin, I’ll need your previous surgeon’s name." },
  { id: 33, title: "The Tee Shot", image: "card_33.jpg", correct: "Last year he came in shorts." },
  { id: 34, title: "The Worm", image: "card_34.jpg", correct: "Earl took the free lunch. We don't talk about Earl." },
  { id: 35, title: "The Landing Zone", image: "card_35.jpg", correct: "Her doctor told her to get more fresh air." },
  { id: 36, title: "The First Date", image: "card_36.jpg", correct: "Watch closely, dear. I won't be around forever." },
  { id: 37, adult: true, title: "The Interview", image: "card_37.jpg", correct: "We'll have to keep this short. I go down at two." },
  { id: 38, title: "The Dress", image: "card_38.jpg", correct: "It's a beach wedding, so we're keeping it casual." },
  { id: 39, title: "The Arm Wrestle", image: "card_39.jpg", correct: "Frank always said he'd die before he lost." },
  { id: 40, title: "The Drive-Through", image: "card_40.jpg", correct: "He asked us to throw it." },
  { id: 41, title: "The Proposal", image: "card_41.jpg", correct: "My dog introduced us." },
  { id: 42, title: "The Birthday Inferno", image: "card_42.jpg", correct: "Sir, the permit only covered eighty." },
  { id: 44, title: "The Spa", image: "card_44.jpg", correct: "Don’t worry. He only does deep tissue." },
  { id: 46, title: "The Plumber", image: "card_46.jpg", correct: "You've sprung a leak. Several, actually." },
  { id: 47, title: "The DMV Bear", image: "card_47.jpg", correct: "Your license expired in November. Again." },
  { id: 48, title: "The Conference", image: "card_48.jpg", correct: "The good news is he's very observant." },
  { id: 49, title: "The Groom's Side", image: "card_49.jpg", correct: "They insisted on black tie." },
  { id: 50, title: "The Lumber Aisle", image: "card_50.jpg", correct: "There's no sampling in lumber." },
  { id: 51, title: "The X-Ray", image: "card_51.jpg", correct: "He still says it's in the couch." },
  { id: 52, title: "Farm to Table", image: "card_52.jpg", correct: "She'd like to know who ordered the omelet." },
  { id: 53, title: "The Security Line", image: "card_53.jpg", correct: "This is why I drive." },
  { id: 54, title: "Shoe Rental", image: "card_54.jpg", correct: "Shoes are four dollars. Per pair." },
  { id: 55, title: "The Cubicle Knight", image: "card_55.jpg", correct: "He heard reviews were today." },
  { id: 56, adult: true, title: "The Slideshow", image: "card_56.jpg", correct: "Let's use this one for the Christmas card." },
  { id: 57, spicy: true, title: "Name Tag", image: "card_57.jpg", correct: "Most guests go with the forehead." },
  { id: 58, spicy: true, title: "The Suite", image: "card_58.jpg", correct: "Your mother called ahead." },
  { id: 59, spicy: true, title: "Senior Ed", image: "card_59.jpg", correct: "Skip to the bees, we don't have that kind of time." },
  { id: 60, spicy: true, title: "The Refill", image: "card_60.jpg", correct: "And something for me to sleep through it." },
  { id: 61, spicy: true, title: "Room 12", image: "card_61.jpg", correct: "We'll give them until bingo." },
  { id: 62, spicy: true, title: "Overnight Bag", image: "card_62.jpg", correct: "My profile did say long-term." },
  { id: 63, spicy: true, title: "Noise Complaint", image: "card_63.jpg", correct: "I'm going to need all of you to stop tipping me." },
  { id: 64, spicy: true, title: "The Specialist", image: "card_64.jpg", correct: "Just the one, please." },
  { id: 65, spicy: true, title: "Sunday Morning", image: "card_65.jpg", correct: "She's either very early or very late." },
  { id: 66, spicy: true, title: "Donor of the Month", image: "card_66.jpg", correct: "He's the reason the whole town has that chin." },
  { id: 67, title: "Let It Go", image: "card_67.jpg", correct: "And now we breathe through the mouth." },
  { id: 68, title: "Open House", image: "card_68.jpg", correct: "The previous owners were married fifty-one years." },
  { id: 69, spicy: true, title: "The Chart", image: "card_69.jpg", correct: "That was the week the cable went out." },
  { id: 70, spicy: true, title: "Mood Lighting", image: "card_70.jpg", correct: "You can breathe on your own for ten minutes." },
  { id: 71, spicy: true, title: "The Scanner", image: "card_71.jpg", correct: "You only had to take off the shoes." },
  { id: 72, spicy: true, title: "Bridge Night", image: "card_72.jpg", correct: "We'll take the barrel for five." },
  { id: 73, spicy: true, title: "The Judges", image: "card_73.jpg", correct: "The four is from her husband." },
  { id: 74, adult: true, title: "The Cone", image: "card_74.jpg", correct: "He's handling it better than you did." },
  { id: 75, spicy: true, title: "Do Not Disturb", image: "card_75.jpg", correct: "On day five they asked for a chiropractor." },
  { id: 76, spicy: true, title: "Book Club", image: "card_76.jpg", correct: "We should have started this club in 1958." },
  { id: 77, spicy: true, title: "Par Three", image: "card_77.jpg", correct: "He's never needed more than three." },
  { id: 78, spicy: true, title: "Boudoir Session", image: "card_78.jpg", correct: "Is this an anniversary gift or a threat?" },
  { id: 79, spicy: true, title: "From Mom", image: "card_79.jpg", correct: "I'm not getting any younger, kids." },
  { id: 80, spicy: true, title: "The Hotline", image: "card_80.jpg", correct: "Hold on, I dropped a stitch." },
  { id: 81, title: "Going Down", image: "card_81.jpg", correct: "If it were me, you'd know." },
  { id: 82, title: "The Commissioner", image: "card_82.jpg", correct: "He never did tell anyone the password." },
  { id: 83, title: "Actual Scorecards", image: "card_83.jpg", correct: "It says here you were a seven handicap." },
  { id: 84, title: "Red Card", image: "card_84.jpg", correct: "Go wait in the car." },
  { id: 85, title: "The First Marathon", image: "card_85.jpg", correct: "His last words were his split times." },
  { id: 86, title: "The Inspector", image: "card_86.jpg", correct: "Ordinarily we'd start with a warning." },
  { id: 87, title: "Night Shift", image: "card_87.jpg", correct: "Forty years and not one of them has asked about me." },
  { id: 88, title: "Photo Finish", image: "card_88.jpg", correct: "Same three as last year." },
  { id: 89, title: "Jury of Peers", image: "card_89.jpg", correct: "Whatever happens, don't let them see the crusts.", adult: true },
  { id: 90, title: "Open House", image: "card_90.jpg", correct: "The previous owners are still very much in the area.", adult: true },
  { id: 91, title: "Veni, Vidi", image: "card_91.jpg", correct: "Name for the cup?", adult: true },
  { id: 92, title: "The Standoff", image: "card_92.jpg", correct: "He wants the good tuna and a plane to Belize.", adult: true },
  { id: 93, title: "Spin Class", image: "card_93.jpg", correct: "The first class is free. Most of them never leave.", adult: true },
  { id: 94, title: "Guest of Honor", image: "card_94.jpg", correct: "He brought wine.", adult: true },
  { id: 95, title: "Series A", image: "card_95.jpg", correct: "Gerald still wants to know what it does.", adult: true },
  { id: 96, title: "Irreconcilable", image: "card_96.jpg", correct: "She's asking for the house. He's asking for the box.", adult: true },
  { id: 97, title: "The Pairing", image: "card_97.jpg", correct: "Pump four has a lovely finish.", adult: true },
  { id: 98, title: "Book Club", image: "card_98.jpg", correct: "I just think she deserved better than the duke.", adult: true },
  { id: 99, title: "Good Fences", image: "card_99.jpg", correct: "It started with one tomato hanging over the line.", adult: true },
  { id: 100, title: "Annual Review", image: "card_100.jpg", correct: "Walk me through the bank on Fourth Street.", adult: true },
  { id: 101, title: "Open Plan", image: "card_101.jpg", correct: "Let's take the dragon offline.", adult: true },
  { id: 102, title: "Exit Interview", image: "card_102.jpg", correct: "Honestly, this is more than we did for your promotion.", adult: true },
  { id: 103, title: "On Duty", image: "card_103.jpg", correct: "He's very good with the whistle." },
  { id: 104, title: "Night School", image: "card_104.jpg", correct: "Who can tell me what a mouse is worth?" },
  { id: 105, title: "Bake Sale", image: "card_105.jpg", correct: "Her brother did the cupcakes. He's eight." },
  { id: 106, title: "Lost & Found", image: "card_106.jpg", correct: "Funny. The skunk swore it was his." },
  { id: 107, title: "Overcast", image: "card_107.jpg", correct: "These won't help. You need to talk to somebody." },
  { id: 108, title: "Moving Day", image: "card_108.jpg", correct: "Careful, he's been in that bowl since 1987." },
  { id: 109, title: "Off Season", image: "card_109.jpg", correct: "He tried \"boo\" and she said \"no thanks.\"" },
  { id: 110, title: "Last Stop", image: "card_110.jpg", correct: "Nobody's actually ordered anything since June." },
  { id: 111, title: "Quiet Please", image: "card_111.jpg", correct: "Six o'clock. Somebody hide his watch." },
  { id: 112, title: "Deluxe", image: "card_112.jpg", correct: "He comes in every Tuesday. He's never once paid." },
];

// The real captions get the same polish as players' captions, so they look identical
const { polish } = require('./polish');
for (const c of CARTOONS) c.correct = polish(c.correct).text;
// The original deck is retired: never dealt again (kept only so old Gallery frames still show their picture)
const RETIRED_BELOW = 47;
for (const c of CARTOONS) if (c.id < RETIRED_BELOW) c.retired = true;

// The permanent Hall of Fame deck (lives across games and game nights)
const store = require('./store');
const Rating = require('./rating');
// A room's Gallery starts from the server's saved copy (when there is one); phones add theirs on join
function newRoomDeck() { const d = store.createDeck(); if (store.file) for (const e of store.all().reverse()) d.add(e, true); return d; }   // without a saved copy, rooms never see each other's captions
const deckOf = (game) => game.deck || (game.deck = newRoomDeck());
// #3: a Gallery caption is stamped by the server when a table frames it. Phones carry the stamp between nights;
// a caption typed into a phone's storage has none, so Expert Mode never deals it as the real answer.
const crypto = require('crypto');
const SIGN_KEY = process.env.GALLERY_KEY || 'closed-caption/gallery/v1';
const sigOf = (e) => crypto.createHmac('sha256', SIGN_KEY).update(Number(e.cartoonId) + '|' + store.norm(e.caption) + '|' + String(e.author || '').toLowerCase()).digest('base64url').slice(0, 32);
const SIG_FROM = Date.UTC(2026, 9, 19, 16);   // frames from before stamping began are trusted as they are
const signed = (e) => !!e && ((typeof e.sig === 'string' && e.sig === sigOf(e)) || (!e.sig && Number(e.at) > 0 && Number(e.at) < SIG_FROM));
function trustedEntries(game) {
  const d = deckOf(game), n = d.count(), top = n ? d.recent(1)[0].id : '';
  if (!game._trusted || game._trusted.n !== n || game._trusted.top !== top) game._trusted = { n, top, list: d.all().filter(signed) };
  return game._trusted.list;
}
// Phones carry the Gallery between nights: merge what one brings (max 300, cartoons we know)
function syncGallery(game, entries) {
  if (!Array.isArray(entries)) return { error: 'That didn’t take. Try again.' };
  const known = new Set(CARTOONS.map(c => c.id)); let added = 0;
  for (const e of entries.slice(0, 300)) if (e && known.has(Number(e.cartoonId)) && deckOf(game).add(e, true)) added++;
  return { ok: true, added };
}

const MAX_PLAYERS = 8;

// Shown on everyone's screen when the table votes a cartoon off
const MULLIGAN_QUIPS = [
  'Thank you for your submission.',
  'The table has spoken.',
  'Noted, and declined.',
  'The cartoonist has been informed.',
  'Politely, firmly, no.',
  'Into the shredder it goes.',
  'Not even the artist liked that one.',
  'Cartoon fired. Security will walk it out.',
];
// How the rejected cartoon meets its end (every phone plays the same one)
const EXECUTIONS = ['punch', 'tear', 'fire', 'flush', 'stomp', 'shred'];

// The steal shows. 'full' (the first steal of a game, or a steal off the real caption): one of the heists below,
// drawn in public/heists.js in this same order (index = act). A room deals them like a deck, so nobody sees a
// repeat until all have played. Every other steal is 'short': a transfer-of-ownership stamp (RECEIPTS).
// House rule for every line here: a caption. Short, specific, deadpan, one beat. Every line is used once.
const HEISTS = [
  { name: 'The Claw', gloats: ['Skill game.', 'First try, too.'] },
  { name: 'The Butler', gloats: ['Will that be all?', 'I’ve put it with the good silver.'] },
  { name: 'The Magician', gloats: ['Is this your chip? Not anymore.', 'No, you may not examine it.'] },
  { name: 'Grandma', gloats: ['You can visit it on holidays.', 'I’ll keep it somewhere safe. You’ll never find it.'] },
  { name: 'The Cat', gloats: ['If I sat on it, it’s mine.', 'Next time, don’t leave it out.'] },
  { name: 'The Auctioneer', gloats: ['Sold, to the dealer.', 'No other bids.'] },
  { name: 'The Raccoon', gloats: ['Rinsed it. Mine now.', 'Found it in the open. Basically garbage.'] },
  { name: 'The Accountant', gloats: ['For tax purposes, it’s mine.', 'It balances now.'] },
  { name: 'The Mime', gloats: ['(Pockets it. Says nothing.)', '(Points at you. Shrugs.)'] },
  { name: 'The Frog', gloats: ['It looked like a fly. Still mine.', 'It was moving slowly. That’s on you.'] },
  { name: 'The Octopus', gloats: ['I had seven free hands. Do the math.', 'Eight arms. Zero apologies.'] },
];
// The short show is paperwork: a transfer-of-ownership stamp and one typed line. {name} = whose chip it was.
const RECEIPTS = [
  'Received from {name}. Condition: used.',
  'Received from {name}. No receipt.',
  'Transferred from {name}. Signed for.',
  'Formerly {name}’s. Condition: fair.',
];
// Callbacks: the same player robbed twice in one game
// A chip stolen off a fake caption pays its owner this much (the steal's cost)
const STEAL_CAUGHT_PTS = 1;
const AGAIN_FULL = 'We meet again, {name}.';
const AGAIN_SHORT = 'Received from {name}. Again.';
const firstNameOf = (game, pid) => { const p = game.players.find(q => q.id === pid); return (String(p ? p.name : '').trim().split(/\s+/)[0]) || 'you'; };
// Next heist off the room's deck; a fresh shuffle never opens with the one that just played
function nextHeist(game) {
  // a room restored from an older server may hold a deck from the old 31-heist list: keep only acts that still exist
  if (Array.isArray(game.heistDeck)) game.heistDeck = game.heistDeck.filter(i => Number.isInteger(i) && i >= 0 && i < HEISTS.length);
  if (!Array.isArray(game.heistDeck) || !game.heistDeck.length) {
    let d = shuffleArray(HEISTS.map((_, i) => i));
    if (d.length > 1 && d[0] === game.lastHeist) d.push(d.shift());
    game.heistDeck = d;
  }
  const act = game.heistDeck.shift();
  game.lastHeist = act;
  return act;
}

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
  pointsStealCorrect: 1,         // (retired: a stolen chip on the real caption now pays the dealer what it would have paid)
  autoCloseProbability: 0.15,    // share of rounds where the real caption is the Closed Caption
  stealEnabled: true,            // dealer may knock one chip off the table before the answer
  // [settings] Lobby settings (Nick, Oct 18 2026)
  dealerMode: 'steal',           // 'steal' = dealer doesn't bet, steals one chip (default); 'bet' = no steal, the dealer bets 2 chips like everyone;
                                 // 'both' = "kitchen sink": the dealer bets 2 chips AND then steals one (never their own)
  laps: 1,                       // game length when rounds/targetScore are null: everyone deals once (1), twice (2) or three times (3)
  family: false,                 // family cartoons only (skips the few grown-up ones)
  spicy: false,                  // 'After dark': mixes in the PG-13 cartoons
  direction: 'left',             // which way the deal and the betting go around the table
  expert: false,                 // Expert Mode: the real answer comes from the Hall of Fame deck
};

// [settings] Writing timer: 0 = no timer (nobody is rushed; the dealer or host ends writing), else 30 s to 10 min.
const DEFAULT_TIMER = 120;   // new rooms: 2 minutes
function cleanTimer(t) {
  const n = Number(t);
  if (t === null || t === undefined || t === '' || !Number.isInteger(n)) return null;
  return n === 0 || (n >= 30 && n <= 600) ? n : null;
}
// [settings] Dealer modes
const dealerBets = (game) => game.settings.dealerMode === 'bet' || game.settings.dealerMode === 'both';
const stealOn = (game) => game.settings.dealerMode !== 'bet' && !!game.settings.stealEnabled;

function createGame(hostId, hostName, timerDuration = DEFAULT_TIMER, seenIds = []) {
  return {
    seenIds: cleanSeen(seenIds),   // cartoons the host's phone has seen in earlier games
    seenBy: { [hostId]: cleanSeen(seenIds) },   // every phone's 'already seen' list, by player
    deck: newRoomDeck(),            // this room's Gallery: the server's saved copy + whatever the phones bring
    closePlan: [],                  // closePlan[round - 1] = true when the real caption is face-down that round
    flags: [],                      // Frame It picks, recorded when each round's framing resolves: { fromId, round, target, at }
    framePicks: {},                 // this round's secret picks while framing: { playerId: target | 'pass' }
    frameVoters: [],                // who was here when framing began (late joiners may pick, never block)
    frameResult: null,              // once framing resolves: { at, framed: [target], counts: { key: n }, endsAt }
    inducted: [],                   // 'round|target' keys already inducted this game
    lastInduction: null,            // the latest induction, for the celebration: { n, round, target, caption, ... }
    realCredit: null,               // Expert Mode: who wrote this round's real answer { author, month, flags, entryId }
    code: generateRoomCode(),
    phase: PHASES.LOBBY,
    phaseAt: Date.now(),  // server time of the latest phase change
    stepAt: null,         // server time of the latest reveal-reel step
    stealShows: 0,        // steals this game: only the first gets the full show
    players: [{ id: hostId, name: hostName, score: 0, connected: true }],
    voice: {},            // voice call: { playerId: { on, muted } } (cleared when a phone drops)
    hostId,
    timerDuration,
    settings: { ...DEFAULT_SETTINGS },
    round: 0,
    dealerIndex: -1,
    dealCount: {},        // [settings] how many times each player has dealt this game (game length = everyone deals N times)
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
    gameNo: 0,            // games started in this room (the rating result is keyed by room + game)
    ratingSnap: null,     // the table as the game started: { playerId: { r, g, name } } (rating.js)
    opening: null,        // the opening card: { at, gameId, table, opener, favorite, underdog, ... }
    ratingResult: null,   // game over: { gameId, rows: { playerId: { before, after, delta, ... } }, order }
    verdictsAt: null,     // the dealer/host moved on from the verdicts (phones time the Grand Poobah from this)
  };
}

// Every phase change is stamped with the server clock: phones start the big moments from it, together
function setPhase(game, phase) { game.phase = phase; game.phaseAt = Date.now(); }
function setReelStep(game, step) { game.reel.step = step; game.stepAt = Date.now(); }

function cleanSeen(ids) {
  const valid = new Set(CARTOONS.map(c => c.id));
  return Array.isArray(ids) ? [...new Set(ids.map(Number).filter(n => valid.has(n)))] : [];
}
function setSeen(game, ids) { game.seenIds = cleanSeen(ids); (game.seenBy = game.seenBy || {})[game.hostId] = game.seenIds; }
// A phone tells us which cartoons it has already seen (on joining, and back in the lobby)
function setPlayerSeen(game, playerId, ids) {
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  if (!Array.isArray(ids)) return { error: 'That didn’t take. Try again.' };
  (game.seenBy = game.seenBy || {})[playerId] = cleanSeen(ids.slice(0, 200));
  return { ok: true };
}
// How many people at the table have already seen each cartoon
function seenCounts(game) {
  const here = new Set(game.players.map(p => p.id)), n = new Map();
  for (const [pid, ids] of Object.entries(game.seenBy || {})) if (here.has(pid)) for (const id of ids) n.set(id, (n.get(id) || 0) + 1);
  return n;
}
// Of these cartoons, the ones the fewest people here have seen (ideally nobody)
function freshest(game, list) {
  if (!list.length) return list;
  const n = seenCounts(game), min = Math.min(...list.map(c => n.get(c.id) || 0));
  const out = list.filter(c => (n.get(c.id) || 0) === min);
  if (min === 0) {                       // nobody here has seen these: the newest cartoons go first
    const newest = out.filter(c => c.id >= NEWEST_FROM);
    return newest.length ? newest : out;
  }
  // Everyone has seen something: deal the ones seen longest ago
  const ago = seenAgo(game), most = Math.max(...out.map(c => ago.get(c.id) ?? 1e9));
  return out.filter(c => (ago.get(c.id) ?? 1e9) === most);
}
const NEWEST_FROM = 47;                  // the newest batch of cartoons
// For each cartoon: how many cartoons ago anyone here last saw it (0 = the last one they saw)
function seenAgo(game) {
  const here = new Set(game.players.map(p => p.id)), m = new Map();
  for (const [pid, ids] of Object.entries(game.seenBy || {})) if (here.has(pid))
    ids.forEach((id, i) => { const a = ids.length - 1 - i; m.set(id, Math.min(m.has(id) ? m.get(id) : a, a)); });
  return m;
}

function updateSettings(game, partial) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Settings can only be changed in the lobby' };
  const s = game.settings;
  const ints = ['rounds', 'targetScore', 'pointsOpenBet', 'pointsClosedBet', 'pointsOpenLate', 'pointsClosedLate', 'pointsPerFool', 'dealerBonus', 'pointsStealCorrect'];
  for (const key of Object.keys(partial || {})) {
    const val = partial[key];
    if (key === 'stealEnabled') { s.stealEnabled = !!val; continue; }
    // [settings] Dealer mode: the steal is on in 'steal' and 'both' ('kitchen sink'), off in 'bet'
    if (key === 'dealerMode') {
      if (!['steal', 'bet', 'both'].includes(val)) return { error: 'That didn’t take. Try again.' };
      s.dealerMode = val; s.stealEnabled = val !== 'bet'; continue;
    }
    // [settings] Game length: everyone deals 1, 2 or 3 times
    if (key === 'laps') {
      const n = Number(val);
      if (![1, 2, 3].includes(n)) return { error: 'That didn’t take. Try again.' };
      s.laps = n; continue;
    }
    if (key === 'family') { s.family = !!val; if (s.family) s.spicy = false; continue; }
    if (key === 'spicy') { s.spicy = !!val; if (s.spicy) s.family = false; continue; }
    if (key === 'expert') {
      if (typeof val !== 'boolean') return { error: 'That didn’t take. Try again.' };
      if (val && deckCartoons(game) < 3) return { error: 'The Gallery opens once 3 cartoons have a framed caption' };
      s.expert = val; continue;
    }
    if (key === 'direction') { if (val !== 'left' && val !== 'right') return { error: 'That didn’t take. Try again.' }; s.direction = val; continue; }
    if (key === 'autoCloseProbability') {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > 1) return { error: 'That didn’t take. Try again.' };
      s.autoCloseProbability = n; continue;
    }
    if (!ints.includes(key)) continue;
    if (val === null && (key === 'rounds' || key === 'targetScore')) { s[key] = null; continue; }
    const n = Number(val);
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: 'That didn’t take. Try again.' };
    s[key] = n;
  }
  return { ok: true };
}

function addPlayer(game, playerId, playerName) {
  if (game.players.length >= MAX_PLAYERS) return { error: `The table’s full (${MAX_PLAYERS} max)` };
  if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) return { error: 'Someone here already has that name' };
  // Late joiners are added at the end of the table, so the deal order of everyone else is unchanged.
  // They score from zero and join in from the current writing phase or the next round.
  game.players.push({ id: playerId, name: playerName, score: 0, connected: true, joinedRound: game.round });
  return { ok: true, midGame: game.phase !== PHASES.LOBBY };
}

function kickPlayer(game, hostId, targetPlayerId) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Can only remove players in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can remove players' };
  if (hostId === targetPlayerId) return { error: 'You can’t remove yourself' };
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
  // #29: in 'everyone deals N times' games, nobody deals more than their share while someone here still has a deal to come
  const s = game.settings, laps = [1, 2, 3].includes(s.laps) ? s.laps : 1, counts = game.dealCount || {};
  if (!s.rounds && !s.targetScore) for (let k = 1; k <= n; k++) {
    const i = seatAt(n, from + k * step);
    if (game.players[i].connected && (counts[game.players[i].id] || 0) < laps) return i;
  }
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
  for (const e of trustedEntries(game)) if (!names.has(e.author.toLowerCase())) out.add(e.cartoonId);
  return CARTOONS.filter(c => !c.retired && out.has(c.id)).map(c => c.id);
}
const deckCartoons = (game) => expertCartoonIds(game).length;

// Expert deal: a cartoon with a Hall of Fame caption this table can play, or null (then deal normally)
function dealExpert(game, currentId) {
  const ok = new Set(expertCartoonIds(game));
  // Never twice in one game; otherwise the ones the fewest people here have seen
  const pool = freshest(game, allowed(game).filter(c => ok.has(c.id) && !game.usedCartoonIds.includes(c.id) && c.id !== currentId));
  if (!pool.length) return null;   // every deck cartoon has been played this game
  const cartoon = pick(pool), names = tableNames(game);
  const entry = pick(trustedEntries(game).filter(e => e.cartoonId === cartoon.id && !names.has(e.author.toLowerCase())));
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
  game.timerEnd = game.timerDuration > 0 ? Date.now() + game.timerDuration * 1000 : null;   // [settings] no timer: no end time
  game.timeAdds = 0;
  game.timerToken = (game.timerToken || 0) + 1;
}
// Family games never deal the grown-up cartoons
// PG-13 cartoons only come up in 'After dark' games
const allowed = (game) => CARTOONS.filter(c => !c.retired && !(game.settings.family && (c.adult || c.spicy)) && !(c.spicy && !game.settings.spicy));
function dealNormal(game, currentId) {
  // Never twice in one game; of the rest, the ones the fewest people at the table have seen.
  // Nobody sees a repeat until they've seen the whole deck.
  let available = freshest(game, allowed(game).filter(c => !game.usedCartoonIds.includes(c.id) && c.id !== currentId));
  if (available.length === 0) {
    game.usedCartoonIds = currentId ? [currentId] : [];
    available = allowed(game).filter(c => c.id !== currentId);
  }
  const cartoon = pick(available.length ? available : allowed(game).length ? allowed(game) : CARTOONS.filter(c => !c.retired));
  game.usedCartoonIds.push(cartoon.id);
  game.cartoon = { id: cartoon.id, title: cartoon.title, image: cartoon.image };
  game.correctCaption = cartoon.correct;
  game.realCredit = null;
}

function startRound(game, options = {}) {
  if (!options.sameRound) {
    game.round++;
    game.dealerIndex = nextDealerIndex(game, game.dealerIndex);
    // [settings] count the deal (game length 'everyone deals N times' reads this)
    const d = game.players[game.dealerIndex];
    if (d) { game.dealCount = game.dealCount || {}; game.dealCount[d.id] = (game.dealCount[d.id] || 0) + 1; }
  }
  dealCartoon(game);
  if (game.round === 1 && !options.sameRound && !game.ratingSnap) beginRated(game);
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
  game.framePicks = {};
  game.frameVoters = [];
  game.frameResult = null;
  setPhase(game, PHASES.WRITING);
}

// Someone whose phone just locked or blinked off for a few seconds still counts as here
const AWAY_GRACE_MS = 45000;   // a phone that locks or switches apps keeps its place for 45 s
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
  if (raw.length > 400) return { error: 'Too long. The real ones are short.' };
  const p = polish(raw);
  if (!p.text || !/[A-Za-z0-9]/.test(p.text)) return { error: 'Write something first' };
  if (p.text.length > 220) return { error: 'Too long. The real ones are short.' };
  if (mode === 'check' && p.typos.length) return { ok: true, check: { polished: p.text, fixed: p.fixed, typos: p.typos } };
  const finalText = mode === 'keep' ? p.text : p.fixed;
  if (tooCloseToReal(finalText, game.correctCaption)) return { error: 'Too close to the real one. Write your own.' };   // #31: regulars remember the real ones
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
  if (game.timerEnd) game.timerEnd += 4500;   // the execution plays over the new cartoon: give that time back ([settings] no timer: nothing to give)
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
  setPhase(game, PHASES.READING);
  return { ok: true };
}

// Around the table from the dealer, in the table's direction; the dealer doesn't bet
// ([settings] unless the dealer mode is 'bet' or 'both': then the dealer bets last)
function computeBetOrder(game) {
  const n = game.players.length, order = [], step = stepOf(game);
  for (let k = 1; k < n; k++) order.push(game.players[seatAt(n, game.dealerIndex + k * step)].id);
  const dealer = dealerOf(game);
  if (dealer && dealerBets(game)) order.push(dealer.id);
  return order;
}

function moveToFirstBets(game) {
  if (game.phase !== PHASES.READING) return { error: 'Too late — the game moved on' };
  game.betOrder = computeBetOrder(game);
  game.bets = [];
  setPhase(game, PHASES.FIRST_BETS);
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
  if ((typeof target !== 'number' && typeof target !== 'string') || target === '') return { error: 'That didn’t take. Try again.' };   // Number({}) can throw; Number(null) is 0
  const idx = Number(target);
  if (!Number.isInteger(idx) || idx < 0 || idx >= game.openCaptions.length) return { error: 'That didn’t take. Try again.' };
  return { ok: true, target: idx };
}

function placeBet(game, playerId, betTarget) {
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : game.phase === PHASES.SECOND_BETS ? 2 : 0;
  if (!stage) return { error: 'Too late — the game moved on' };
  const dealer = dealerOf(game);
  if (dealer && dealer.id === playerId && !dealerBets(game)) return { error: 'The dealer doesn’t bet' };   // [settings] 'bet'/'both': the dealer bets too
  if (stageBet(game, playerId, stage)) return { error: 'You already bet' };
  if (currentBetterId(game) !== playerId) return { error: 'Not your turn yet' };
  if (!betTarget || typeof betTarget !== 'object') return { error: 'That didn’t take. Try again.' };
  const count = Number(betTarget.count);
  if (stage === 1 && count !== 1 && count !== 2) return { error: 'That didn’t take. Try again.' };
  if (stage === 2 && count !== 1) return { error: 'You have one chip left' };
  const v = validateTarget(game, betTarget.target);
  if (v.error) return v;
  // Second chip can go anywhere — including on top of your first one.
  game.bets.push({ playerId, target: v.target, count, stage, at: Date.now() });
  (stage === 1 ? game.firstBets : game.secondBets)[playerId] = { target: v.target, count };
  return { ok: true, allIn: pendingBetters(game).length === 0 };
}

// Mis-tap? Take your chip back within a few seconds, as long as nobody has bet after you
const UNDO_MS = 4000;
function undoBet(game, playerId) {
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : game.phase === PHASES.SECOND_BETS ? 2 : 0;
  const last = game.bets[game.bets.length - 1];
  if (!stage || !last || last.playerId !== playerId || last.stage !== stage || last.target === 'pass') return { error: 'Too late to take it back' };
  if (Date.now() - (last.at || 0) > UNDO_MS) return { error: 'Too late to take it back' };
  game.bets.pop();
  delete (stage === 1 ? game.firstBets : game.secondBets)[playerId];
  game.timerToken = (game.timerToken || 0) + 1;   // cancels the 'all chips are down' move
  return { ok: true };
}

function skipCurrentBetter(game) {
  if (game.phase !== PHASES.FIRST_BETS && game.phase !== PHASES.SECOND_BETS) return { error: 'Too late — the game moved on' };
  const pid = currentBetterId(game);
  if (!pid) return { error: 'Nobody is waiting to bet' };
  game.bets.push({ playerId: pid, target: 'pass', count: 0, stage: game.phase === PHASES.FIRST_BETS ? 1 : 2 });
  return { ok: true, skipped: pid, allIn: pendingBetters(game).length === 0 };
}

function moveToReveal(game) {
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Too late — the game moved on' };
  setPhase(game, PHASES.REVEAL);
  return { ok: true };
}

const chipsOnTable = (game) => game.bets.reduce((n, b) => n + (b.target === 'pass' ? 0 : b.count), 0);

// After the reveal: second bets if anyone has a chip left, else straight on
function moveFromReveal(game) {
  if (game.phase !== PHASES.REVEAL) return { error: 'Too late — the game moved on' };
  if (eligibleSecondBetters(game).length) { setPhase(game, PHASES.SECOND_BETS); return { ok: true }; }
  return afterAllBets(game);
}

// All chips are down: the dealer's steal, or straight to the answer
// [settings] only when the dealer mode has a steal, and only other players' chips can be stolen
const othersChipsOnTable = (game, dealer) => game.bets.reduce((n, b) => n + (b.target === 'pass' || (dealer && b.playerId === dealer.id) ? 0 : b.count), 0);
function afterAllBets(game) {
  const dealer = dealerOf(game);
  if (stealOn(game) && dealer && othersChipsOnTable(game, dealer) > 0) {
    setPhase(game, PHASES.STEAL);
    game.steal = null;
    return { ok: true };
  }
  revealAnswer(game);
  return { ok: true };
}

function moveFromSecondBets(game) {
  if (game.phase !== PHASES.SECOND_BETS) return { error: 'Too late — the game moved on' };
  return afterAllBets(game);
}

// The dealer knocks one chip off the table (betIndex = index in game.bets), or passes (null)
function stealChip(game, betIndex) {
  if (game.phase !== PHASES.STEAL) return { error: 'Too late — the game moved on' };
  if (betIndex === null || betIndex === undefined) {
    game.steal = { skipped: true };
  } else {
    const bet = game.bets[Number(betIndex)];
    if (!bet || bet.target === 'pass' || bet.count < 1) return { error: 'No chip there' };
    const dl = dealerOf(game);
    if (dl && bet.playerId === dl.id) return { error: 'You can’t steal your own chip' };   // [settings] kitchen sink: the dealer's own chips stay put
    bet.count -= 1;
    bet.stolen = (bet.stolen || 0) + 1;
    const onCorrect = isBetOnCorrect(game, bet);
    game.stealShows = (game.stealShows || 0) + 1;
    // 'full' for the first steal of the game or a steal off the real caption; every other steal is 'short'
    const stealShow = game.stealShows === 1 || onCorrect ? 'full' : 'short';
    const robbedBefore = game.history.some(h => h.steal && h.steal.victimId === bet.playerId);
    const vname = firstNameOf(game, bet.playerId);
    let act = null, actName = null, gloat;
    if (stealShow === 'full') {   // only a full show deals a heist off the deck, so they stay a treat
      act = nextHeist(game); actName = HEISTS[act].name;
      gloat = robbedBefore ? AGAIN_FULL.replace('{name}', vname) : pick(HEISTS[act].gloats);
    } else {
      gloat = (robbedBefore ? AGAIN_SHORT : pick(RECEIPTS)).replace('{name}', vname);
    }
    game.steal = { victimId: bet.playerId, target: bet.target, stage: bet.stage, betIndex: Number(betIndex), onCorrect, act, actName, gloat, again: robbedBefore, stealShow, seed: Math.floor(Math.random() * 1e9), at: Date.now(), show: game.stealShows };
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
  setPhase(game, PHASES.ANSWER);
  const s = game.settings;
  const scores = {}, details = {};
  game.players.forEach(p => { scores[p.id] = 0; details[p.id] = []; });
  const add = (pid, pts, reason) => {
    if (!pts || !(pid in scores)) return;
    scores[pid] += pts;
    details[pid].push({ pts, reason });
  };

  // [settings] 'anyoneRight' = another player (not the dealer) has a chip left on the real caption.
  // A betting dealer's own chip on the real one scores like anyone's, and never cancels the dealer's revenge.
  const dealerNow = dealerOf(game);
  let anyoneRight = false;
  for (const bet of game.bets) {
    if (!bet || bet.target === 'pass' || bet.count + (bet.stolen || 0) < 1) continue;
    const blind = bet.stage === 1, onClosed = bet.target === 'closed', both = bet.count === 2;
    if (bet.count > 0 && isBetOnCorrect(game, bet)) {
      if (!dealerNow || bet.playerId !== dealerNow.id) anyoneRight = true;
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
    const fooled = bet.count + (bet.stolen || 0);   // a stolen chip still fooled them: the writer keeps that point
    if (author && author !== bet.playerId) add(author, s.pointsPerFool * fooled, `Fooled ${nameOfPlayer(game, bet.playerId)}`);
  }

  const dealer = dealerOf(game);
  // Nick's rule: stealing a chip off the real caption pays the dealer
  // Nick's rule: a stolen chip becomes the dealer's chip. If it sits on the real caption, it pays the dealer
  // exactly what it would have paid its old owner (blind open, blind Closed Caption, or late); the victim gets nothing for it.
  if (dealer && game.steal && game.steal.victimId && game.steal.onCorrect) {
    const st = game.steal, blind = st.stage === 1;
    const per = blind ? (st.target === 'closed' ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
    add(dealer.id, per, blind ? 'Stole a blind chip off the real caption — it’s yours now' : 'Stole a chip off the real caption — it’s yours now');
  }
  // Owner's rule (Oct 2026): the steal has a cost. A chip stolen off a FAKE caption pays its owner +1 ("caught you"):
  // the dealer has shown everyone which caption they think is fake. (Off the real caption: unchanged, it pays the dealer.)
  if (dealer && game.steal && game.steal.victimId && !game.steal.onCorrect) {
    add(game.steal.victimId, STEAL_CAUGHT_PTS, 'Caught you: your chip was stolen off a fake caption');
  }
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

  { const order = reelOrder(game), real = realKey(game); let k = 0;
    while (k < order.length && order[k] !== real && votesOn(game, order[k]) === 0) k++;
    game.reel = { order, step: 1, nobody: k >= 2 && k < order.length ? k : 0 }; }   // #24: the captions nobody bit on share one step
  game.stepAt = game.phaseAt;
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

// The recap is done: "Anything frame-worthy?"
function moveToFraming(game) {
  if (game.phase !== PHASES.ANSWER) return { error: 'Too late — the game moved on' };
  if (game.reel && game.reel.step < game.reel.order.length + 1) return { error: 'Finish the reveal first' };
  game.framePicks = {};
  game.frameVoters = game.players.filter(isPresent).map(p => p.id);
  game.frameResult = null;
  setPhase(game, PHASES.FRAMING);
  return { ok: true };
}
// Framing over (resolving it first if the dealer moves on early): the scoreboard
function moveToScoreboard(game) {
  if (game.phase === PHASES.ANSWER) return { error: 'Frame It comes first' };
  if (game.phase !== PHASES.FRAMING) return { error: 'Too late — the game moved on' };
  if (!game.frameResult) resolveFraming(game);
  setPhase(game, PHASES.SCORES);
  game.scoresAt = Date.now();   // phones time the Grand Poobah ceremony from this, so it plays together
  if (isGameOver(game)) settleRating(game);
  return { ok: true };
}

// [settings] 'Everyone deals N times' (laps): the rounds played so far, plus the deals still to come going around
// the table from the current dealer, stopping at the first seat that has already dealt N times. With N = 1 and
// nobody joining late this is exactly the old 'one round per player'; a late joiner adds the deals they will get.
function totalRounds(game) {
  const s = game.settings;
  if (s.rounds) return s.rounds;
  const n = game.players.length, laps = [1, 2, 3].includes(s.laps) ? s.laps : 1;
  if (!game.round || game.dealerIndex < 0 || !game.dealCount || !n) return n * laps;
  const c = { ...game.dealCount }, step = stepOf(game);
  let i = game.dealerIndex, more = 0;
  for (let g = 0; g <= n * laps; g++) {
    i = seatAt(n, i + step);
    const id = game.players[i].id;
    if (!isPresent(game.players[i]) && (c[id] || 0) < laps) continue;   // #29: someone who left doesn't hold the game open for their deal
    if ((c[id] || 0) >= laps) break;
    c[id] = (c[id] || 0) + 1; more++;
  }
  return game.round + more;
}

function isGameOver(game) {
  const s = game.settings;
  if (s.targetScore && s.targetScore > 0 && game.players.some(p => p.score >= s.targetScore)) return true;
  if (s.targetScore && s.targetScore > 0) return false;
  return game.round >= totalRounds(game);
}

/* ── Frame It: after every answer, one secret pick per player per cartoon, every round (no limit per game) ──
   A caption is FRAMED when a majority of the other players (everyone but its writer) pick it (inductNeed):
   player-written ones join The Gallery deck. */
function authorOf(game, target) { return target === 'closed' ? game.closedPlayerId : (game.openCaptions[target] || {}).playerId; }
// Pick a caption (not your own) or 'pass'. Changeable until the framing resolves.
function pickFrame(game, playerId, target) {
  if (game.phase !== PHASES.FRAMING) return { error: 'Framing happens after the answer' };
  if (game.frameResult) return { error: 'The frames are in' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  let t = 'pass';
  if (target !== 'pass') {
    const v = validateTarget(game, target);
    if (v.error) return v;
    if (authorOf(game, v.target) === playerId) return { error: 'You can’t frame your own caption' };
    if (isBetOnCorrect(game, { target: v.target })) return { error: 'The real caption can’t be framed' };
    t = v.target;
  }
  (game.framePicks = game.framePicks || {})[playerId] = t;
  return { ok: true, allIn: allFramesIn(game) };
}
// Everyone who was here when framing began, and is still here, has decided (a dropped phone stops counting after the grace)
function allFramesIn(game) {
  const picks = game.framePicks || {};
  const voters = new Set(game.frameVoters || []);
  return game.players.filter(p => voters.has(p.id) && isPresent(p)).every(p => p.id in picks);
}
// The ceremony's beats (server clock): each framed caption gets a slot, then the scoreboard
const FRAME_LEAD_MS = 900, FRAME_SLOT_MS = 10000, FRAME_NONE_MS = 3600;   // a framing gets time to be admired before the scoreboard
// Count the picks; every caption with enough is framed (most picks first). Happens once per round.
function resolveFraming(game) {
  if (game.phase !== PHASES.FRAMING) return { error: 'Too late — the game moved on' };
  if (game.frameResult) return { ok: true, noop: true };
  const at = Date.now(), counts = {}, by = {};
  const order = game.openCaptions.map((_, i) => String(i)).concat('closed');
  for (const [pid, t] of Object.entries(game.framePicks || {})) {
    if (t === 'pass' || !game.players.some(p => p.id === pid)) continue;
    const k = String(t);
    counts[k] = (counts[k] || 0) + 1;
    (by[k] = by[k] || []).push(pid);
  }
  // Every pick is kept (the night's 'Most Framed' award and the Gallery's 'framed by' read them)
  game.flags = (game.flags || []).filter(f => f.round !== game.round);
  for (const k of order) for (const pid of by[k] || []) game.flags.push({ fromId: pid, round: game.round, target: k === 'closed' ? 'closed' : Number(k), at });
  const need = inductNeed(game);
  const framed = Object.keys(counts).filter(k => counts[k] >= need).sort((x, y) => counts[y] - counts[x] || order.indexOf(x) - order.indexOf(y));
  game.inducted = game.inducted || [];
  const items = [];
  framed.forEach((k, i) => {
    const target = k === 'closed' ? 'closed' : Number(k), key = game.round + '|' + target;
    if (!game.inducted.includes(key)) game.inducted.push(key);
    const fl = game.flags.filter(f => f.round === game.round && String(f.target) === k);
    try { const it = induct(game, target, fl, counts[k], at + FRAME_LEAD_MS + i * FRAME_SLOT_MS); if (it) items.push(it); } catch (e) { console.error('induction', e); }
  });
  if (items.length) {
    const n = ((game.lastInduction && game.lastInduction.n) || game.inductionCount || 0) + 1;
    game.lastInduction = { ...items[0], n, list: items };
  }
  const endsAt = framed.length ? at + FRAME_LEAD_MS + framed.length * FRAME_SLOT_MS : at + FRAME_NONE_MS;
  game.frameResult = { at, framed: framed.map(k => (k === 'closed' ? 'closed' : Number(k))), counts, endsAt };
  return { ok: true, framed: game.frameResult.framed, endsAt };
}
// Framed = a majority of the OTHER players (the writer can't frame their own): 3 players -> 2, 4 -> 2, 5 -> 3, 6 -> 3, 8 -> 4
const inductNeed = (game) => Math.floor(Math.max(1, game.players.length - 1) / 2) + 1;
// A caption was just framed: player-written fakes join the permanent deck. Returns the celebration (at = when it plays)
function induct(game, target, fl, count, at = Date.now()) {
  const h = game.history.find(x => x.round === game.round);
  if (!h) return null;
  const c = target === 'closed' ? { caption: h.closedCaption, playerId: h.closedPlayerId, isCorrect: h.closedIsCorrect } : (h.openCaptions[target] || {});
  const isReal = !!c.isCorrect, author = c.playerId ? nameOfPlayer(game, c.playerId) : null;
  const image = h.cartoon && h.cartoon.image, flaggers = fl.map(f => nameOfPlayer(game, f.fromId)), month = MONTH();
  let entry = null;
  // The real caption is celebrated but not added (it's already the real one)
  if (!isReal && author && c.caption) {
    const raw = { cartoonId: h.cartoon.id, image, caption: c.caption, author, flaggers, flags: count, month };
    entry = deckOf(game).add({ ...raw, sig: sigOf(raw) });
    if (entry && store.file) store.add(entry, true);   // the server's saved copy (kept for good when DATA_DIR is set)
  }
  return {
    round: game.round, target, at, caption: c.caption || '', author: isReal ? null : author, isReal,
    image, flaggers, flags: count, month, entryId: entry ? entry.id : null,
    entry: entry || null,   // phones save this to carry The Gallery to the next game night
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
    const live = round === game.round && ANSWERED.includes(game.phase);
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

/* ── The finale: after the winner and the Grand Poobah, tonight's Gallery.
   Every caption framed tonight is shown; with two or more, the table votes (never for your own).
   The winner is Caption of the Night: a short ceremony on every phone at once, then memorialized
   on the untouched cartoon in The Gallery. ── */
const SHOW_LEAD_MS = 1500;   // a beat after the result, so every phone starts the ceremony together
function finaleEntries(game) {
  return hallOfFame(game).filter(e => !e.isReal && e.caption && e.writerId).map(e => ({
    key: e.round + '|' + e.target, round: e.round, target: e.target, caption: e.caption,
    writerId: e.writerId, writerName: e.writerName, image: e.image,
    cartoonId: ((game.history.find(h => h.round === e.round) || {}).cartoon || {}).id,
    frames: e.flaggers.length, flaggers: e.flaggers,
  }));
}
const finaleCanVote = (f, pid) => f.entries.some(e => e.writerId !== pid);
function openFinale(game) {
  if (game.phase !== PHASES.SCORES || !isGameOver(game)) return { error: 'The Gallery opens when the game is over' };
  if (game.finale) return { ok: true, noop: true };
  const entries = finaleEntries(game);
  if (!entries.length) return { error: 'Nothing was framed tonight' };
  game.finale = { at: Date.now(), entries, votes: {}, voters: game.players.filter(isPresent).map(p => p.id), winner: null, counts: null, tie: false, showAt: null };
  if (entries.length === 1) resolveFinale(game);
  return { ok: true };
}
function voteFinale(game, playerId, key) {
  const f = game.finale;
  if (!f || f.winner) return { error: 'The votes are in' };
  const e = f.entries.find(x => x.key === String(key));
  if (!e) return { error: 'Pick one of tonight’s frames' };
  if (e.writerId === playerId) return { error: 'You can’t vote for your own' };
  f.votes[playerId] = e.key;
  if (!f.voters.includes(playerId)) f.voters.push(playerId);
  if (finaleAllIn(game)) resolveFinale(game);
  return { ok: true };
}
function finaleAllIn(game) {
  const f = game.finale; if (!f) return false;
  const need = f.voters.filter(pid => { const p = game.players.find(x => x.id === pid); return p && isPresent(p) && finaleCanVote(f, pid); });
  return need.length > 0 && need.every(pid => pid in f.votes);
}
// Most votes; a tie goes to more frames, then a coin flip (and the ceremony says so)
function resolveFinale(game) {
  const f = game.finale;
  if (!f || f.winner) return { ok: true, noop: true };
  const counts = {}; for (const e of f.entries) counts[e.key] = 0;
  for (const k of Object.values(f.votes)) if (k in counts) counts[k]++;
  const top = Math.max(...Object.values(counts));
  let best = f.entries.filter(e => counts[e.key] === top);
  const most = Math.max(...best.map(e => e.frames));
  best = best.filter(e => e.frames === most);
  f.tie = best.length > 1;
  f.winner = best[Math.floor(Math.random() * best.length)].key;
  f.counts = counts;
  f.showAt = Date.now() + SHOW_LEAD_MS;
  // Memorialized: the room's Gallery remembers it was Caption of the Night
  const w = f.entries.find(e => e.key === f.winner);
  f.best = 'Caption of the Night · ' + MONTH();
  try { const d = deckOf(game); if (d.markBest) d.markBest(w.cartoonId, w.caption, f.best); } catch (e) {}
  return { ok: true };
}

/* ── Emoji reactions: one per person per caption, counts only until the answer ── */
const REACTION_KINDS = ['laugh', 'up', 'fire', 'huh', 'dead', 'roll'];
const REACT_FACE_UP = [PHASES.READING, PHASES.FIRST_BETS];            // the Closed Caption is still face-down
const REACT_ALL = [PHASES.REVEAL, PHASES.SECOND_BETS];                 // open captions and the Closed Caption
function react(game, playerId, target, kind) {
  const early = REACT_FACE_UP.includes(game.phase);
  if (!early && !REACT_ALL.includes(game.phase)) return { error: 'Reactions close once the bets are in' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  if (!REACTION_KINDS.includes(kind)) return { error: 'That didn’t take. Try again.' };
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
  if (game.phase !== PHASES.ANSWER || !game.reel) return { error: 'Too late — the game moved on' };
  const last = game.reel.order.length + 1;
  const k = game.reel.nobody || 0;   // #24: steps 1..k are one 'Nobody bit' screen
  if (how === 'next') { if (game.reel.step >= last) return { error: 'Already at the recap' }; setReelStep(game, k && game.reel.step <= k ? k + 1 : game.reel.step + 1); }
  else if (how === 'prev') { if (game.reel.step <= 1 || (k && game.reel.step <= k)) return { error: 'Already at the first caption' }; setReelStep(game, k && game.reel.step === k + 1 ? 1 : game.reel.step - 1); }
  else if (how === 'skip') setReelStep(game, last);
  else return { error: 'That didn’t take. Try again.' };
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
// #31: word for word (or nearly) the real caption. Strict on purpose: a fresh caption almost never trips it,
// and a loose test would hint at the real answer.
function tooCloseToReal(a, real) {
  const x = normCaption(a), y = normCaption(String(real || '').replace(/\s*\(\d+\)\s*$/, ''));
  if (!x || !y) return false;
  if (x === y) return true;
  const xs = x.split(' '), ys = y.split(' ');
  if (xs.length < 4 || ys.length < 4) return false;
  const wx = new Set(xs), wy = new Set(ys), both = [...wx].filter(w => wy.has(w)).length;
  return both / new Set([...wx, ...wy]).size >= 0.8;
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

/* ── The rating (chess-style, rating.js): each phone keeps its own; the server does the arithmetic once a game ──
   The 'career' message: { rating, games, total, lines } — this phone's rating and games played, its badge count,
   and the short keys of the verdict lines it has already been shown (so nobody reads the same line twice). */
const OPEN_MS = 3500;   // the opening card before the first cartoon (round 1's writing clock starts after it)
function setCareer(game, playerId, msg) {
  const p = game.players.find(x => x.id === playerId);
  if (!p) return { error: 'Player not in game' };
  msg = msg || {};
  const bad = { error: 'That didn’t take. Try again.' };
  if (msg.rating !== undefined && msg.rating !== null && !Rating.validRating(msg.rating)) return bad;
  if (msg.games !== undefined && !Rating.validGames(msg.games)) return bad;
  if (msg.total !== undefined && !Rating.validGames(msg.total)) return bad;
  let lines = null;
  if (msg.lines !== undefined) { lines = Rating.cleanSeenLines(msg.lines); if (!lines) return bad; }
  const rated = Rating.validRating(msg.rating);
  p.rating = rated ? msg.rating : null;
  p.games = rated && Rating.validGames(msg.games) ? msg.games : 0;
  if (msg.total !== undefined) p.badgeTotal = msg.total;
  if (lines) p.seenLines = lines;
  // A phone that reports a moment after the start (it was still connecting) still counts, until the first answer
  const sn = game.ratingSnap && game.ratingSnap[playerId];
  if (sn && !sn.reported && rated && game.round <= 1 && !ANSWERED.includes(game.phase)) {
    game.ratingSnap[playerId] = { ...Rating.snapshot([p])[playerId], reported: true };
  }
  return { ok: true };
}
const ratingTitle = (p) => Rating.validRating(p.rating) && (p.games || 0) >= Rating.PROVISIONAL_GAMES ? Rating.titleOf(p.rating) : null;
// The game starts: freeze the table's ratings, pick the opening card's lines, give round 1 its full clock back
function beginRated(game) {
  game.gameNo = (game.gameNo || 0) + 1;
  game.gameId = game.code + '-' + game.gameNo + '-' + Date.now().toString(36);
  const here = game.players.filter(isPresent);
  const snap = Rating.snapshot(here);
  here.forEach(p => { snap[p.id].reported = Rating.validRating(p.rating); });
  game.ratingSnap = snap;
  game.ratingResult = null;
  game.verdictsAt = null;
  try {
    const o = Rating.opening(here, snap, game.gameId);
    game.opening = { ...o, at: Date.now(), ms: OPEN_MS, gameId: game.gameId };
    if (game.timerEnd) game.timerEnd += OPEN_MS;   // the writers never lose time to the card
  } catch (e) { console.error('opening card failed', e); game.opening = null; }
}
// Game over: everyone seated at the start is rated on their final score (a player who left counts on the score they left with)
function settleRating(game) {
  if (game.ratingResult || !game.ratingSnap) return;
  try {
    const scores = {};
    for (const p of game.players) if (game.ratingSnap[p.id]) scores[p.id] = p.score;
    const fav = game.opening && game.opening.favorite ? game.opening.favorite.id : null;
    const r = Rating.settle(game.ratingSnap, scores, game.players, game.gameId, fav);
    if (r.order.length < 2) { game.ratingResult = { gameId: game.gameId, rows: {}, order: [], none: true }; return; }
    game.ratingResult = { gameId: game.gameId, rows: r.rows, order: r.order, at: Date.now() };
  } catch (e) { console.error('rating failed', e); game.ratingResult = { gameId: game.gameId, rows: {}, order: [], none: true }; }
}
// The dealer/host moves on from the verdicts to the Grand Poobah
function closeVerdicts(game) {
  if (game.phase !== PHASES.SCORES || !isGameOver(game)) return { error: 'Not yet' };
  if (!game.verdictsAt) game.verdictsAt = Date.now();
  return { ok: true };
}

function resetForNewGame(game) {
  setPhase(game, PHASES.LOBBY);
  game.finale = null;
  game.flags = [];
  game.framePicks = {};
  game.frameVoters = [];
  game.frameResult = null;
  game.inducted = [];
  game.realCredit = null;
  // The celebration belongs to the old game (n keeps counting, so phones still spot the next one)
  game.inductionCount = game.lastInduction ? game.lastInduction.n : (game.inductionCount || 0);
  game.lastInduction = null;
  game.closePlan = [];
  game.round = 0;
  game.dealerIndex = -1;
  game.dealCount = {};   // [settings]
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
  game.stealShows = 0;
  game.stepAt = null;
  game.ratingSnap = null;
  game.opening = null;
  game.ratingResult = null;
  game.verdictsAt = null;
}

const AFTER_WRITING = [PHASES.READING, PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];
const BETTING_ON = [PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];
const REVEALED = [PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];
const ANSWERED = [PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];

const TAKEOVER_SECS = 30;
const GAZETTE_SIZE = 40;

// Voice chat: who's in the call and who's muted ({ playerId: { on, muted } }); the audio itself goes phone to phone
function setVoice(game, playerId, on, muted) {
  if (!game.voice) game.voice = {};
  if (on && game.players.some(p => p.id === playerId)) game.voice[playerId] = { on: true, muted: !!muted };
  else delete game.voice[playerId];
}
const clearVoice = (game, playerId) => { if (game && game.voice) delete game.voice[playerId]; };

// What each phone is allowed to see
function getPlayerView(game, playerId) {
  const dealer = dealerOf(game);
  const isDealer = !!dealer && dealer.id === playerId;
  const dealerAwaySecs = dealer && !dealer.connected && dealer.disconnectedAt ? Math.floor((Date.now() - dealer.disconnectedAt) / 1000) : 0;
  const s = game.settings;
  const published = deckOf(game).authorCounts();   // lowercase name -> captions in the Hall of Fame deck

  const base = {
    code: game.code,
    phase: game.phase,
    locked: !!game.locked,           // #51: the host locked the room (no new names)
    notice: game.notice || null,     // #26: a table announcement { text, at }
    players: game.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected, watched: !!p.watched, rating: Rating.validRating(p.rating) ? p.rating : null, provisional: !Rating.validRating(p.rating) || (p.games || 0) < Rating.PROVISIONAL_GAMES, title: ratingTitle(p), published: published.get(p.name.toLowerCase()) || 0 })),
    round: game.round,
    totalRounds: s.targetScore ? null : totalRounds(game),
    settings: { ...s },
    deckSize: CARTOONS.filter(c => !c.retired).length,
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
    phaseAt: game.phaseAt || null,   // server time this phase began (phones sync the big moments to it)
    stepAt: game.stepAt || null,     // server time of the latest reveal-reel step
    stealShows: game.stealShows || 0,
    voice: Object.fromEntries(Object.entries(game.voice || {}).filter(([pid]) => game.players.some(p => p.id === pid && p.connected)).map(([pid, v]) => [pid, { on: true, muted: !!v.muted }])),   // who's in the voice call
    inductNeed: inductNeed(game),
    lastInduction: game.lastInduction ? { ...game.lastInduction, flaggers: [...game.lastInduction.flaggers], list: (game.lastInduction.list || []).map(x => ({ ...x, flaggers: [...x.flaggers] })) } : null,   // only made when framing resolves
    hofDeck: deckCartoons(game),
    hofTotal: deckOf(game).count(),
  };
  // #3: in Expert games the Gallery holds the real answers, so every cartoon still to be dealt is kept out of sight
  // (and the one on the table until its answer is out). Phones hide these from the Gallery they carry, too.
  const hide = s.expert ? new Set(expertCartoonIds(game).filter(id => !game.usedCartoonIds.includes(id))) : null;
  if (hide && game.cartoon && !ANSWERED.includes(game.phase)) hide.add(game.cartoon.id);
  base.galleryHidden = hide ? [...hide] : [];
  // The Gazette: the newest Hall of Fame captions, between rounds only
  if (game.phase === PHASES.LOBBY || game.phase === PHASES.SCORES) {
    base.gazette = hide ? deckOf(game).recent(GAZETTE_SIZE * 4).filter(e => !hide.has(e.cartoonId)).slice(0, GAZETTE_SIZE) : deckOf(game).recent(GAZETTE_SIZE);
  }
  if (game.phase === PHASES.LOBBY) {
    const pool = allowed(game), seen = seenCounts(game);
    base.freshCount = pool.filter(c => !(seen.get(c.id) > 0)).length; base.poolCount = pool.length;
    return base;
  }

  if (game.cartoon) base.cartoon = game.cartoon;
  if (game.opening && game.round === 1 && game.phase === PHASES.WRITING) base.opening = JSON.parse(JSON.stringify(game.opening));
  const mine = game.submissions.find(x => x.playerId === playerId);

  if (game.phase === PHASES.WRITING) {
    base.submittedPlayerIds = game.submissions.map(x => x.playerId);
    base.hasSubmitted = !!mine;
    base.myCaption = mine ? mine.caption : null;
    base.mulliganVotes = [...game.mulliganVotes];
    base.mulliganNeeded = mulliganThreshold(game);
    base.timeAdds = game.timeAdds || 0;
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
    base.reel = game.reel ? { order: [...game.reel.order], step: game.reel.step, nobody: game.reel.nobody || 0 } : null;
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
    base.hallOfFame = hallOfFame(game);
  }

  // Frame It: who has decided (never who picked what, or how many) until it resolves
  if (game.phase === PHASES.FRAMING) {
    const picks = game.framePicks || {}, r = game.frameResult;
    base.framing = {
      voters: [...(game.frameVoters || [])],
      decided: Object.keys(picks),
      myPick: playerId in picks ? picks[playerId] : null,
      resolved: !!r,
      result: r ? { at: r.at, framed: [...r.framed], counts: { ...r.counts }, endsAt: r.endsAt } : null,
    };
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
    if (base.gameOver) {
      base.framedTonight = finaleEntries(game).length;
      settleRating(game);   // (a room restored from before the rating: worked out now, once)
      if (game.ratingResult && !game.ratingResult.none) base.rating = JSON.parse(JSON.stringify(game.ratingResult));
      base.verdictsAt = game.verdictsAt || null;
      const f = game.finale;
      if (f) base.finale = {
        at: f.at, entries: f.entries.map(e => ({ ...e, flaggers: [...e.flaggers] })),
        voters: [...f.voters], decided: Object.keys(f.votes), myVote: f.votes[playerId] || null,
        canVote: finaleCanVote(f, playerId), winner: f.winner, counts: f.counts ? { ...f.counts } : null,
        tie: f.tie, showAt: f.showAt, best: f.best || null,
      };
    }
  }
  return base;
}

// The dealer (or host) gives the table 30 more seconds — up to three times a cartoon
function addTime(game) {
  if (game.phase !== PHASES.WRITING) return { error: 'Only while writing' };
  if (!game.timerEnd) return { error: 'No timer this game' };   // [settings] no timer: nothing to add to
  if ((game.timeAdds || 0) >= 3) return { error: 'That’s all the extra time this round' };
  game.timeAdds = (game.timeAdds || 0) + 1;
  game.timerEnd = Math.max(game.timerEnd, Date.now()) + 30000;
  game.timerToken = (game.timerToken || 0) + 1;
  return { ok: true };
}

/* #6: a restart (every update restarts the server) used to wipe every room. The host's phone keeps a sealed copy
   of the room (encrypted and signed by the server, unreadable on the phone) and hands it back after a restart. */
const SEAL_KEY = crypto.createHash('sha256').update('seal|' + (process.env.RESTORE_KEY || process.env.GALLERY_KEY || 'closed-caption/restore/v1')).digest();
const SKIP = new Set(['deck', '_trusted', '_advAt', '_sealTag', '_sealAt', 'voice']);
function sealGame(game) {
  const plain = {};
  for (const k of Object.keys(game)) if (!SKIP.has(k)) plain[k] = game[k];
  plain.players = (game.players || []).map(p => { const { seenLines, ...rest } = p; return rest; });   // the phones send their seen lines again when they rejoin (keeps the copy small)
  plain.sealedAt = Date.now();
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', SEAL_KEY, iv);
  const body = Buffer.concat([c.update(require('zlib').deflateSync(Buffer.from(JSON.stringify(plain)))), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
}
function unsealGame(blob) {
  try {
    const b = Buffer.from(String(blob || ''), 'base64url');
    if (b.length < 30 || b.length > 400000) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', SEAL_KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    const g = JSON.parse(require('zlib').inflateSync(Buffer.concat([d.update(b.subarray(28)), d.final()])).toString());
    if (!g || !g.code || !Array.isArray(g.players) || Date.now() - g.sealedAt > 6 * 3600 * 1000) return null;   // a copy older than 6 h is a different night
    g.deck = newRoomDeck(); g.voice = {};
    g.players.forEach(p => { p.connected = false; p.disconnectedAt = Date.now(); });
    g.timerToken = (g.timerToken || 0) + 1;
    if (g.timerEnd) g.timerEnd = Math.max(g.timerEnd, Date.now() + 30000);   // writers get a fair 30 s back
    return g;
  } catch (e) { return null; }
}

module.exports = {
  sealGame, unsealGame, tooCloseToReal,
  PHASES, CARTOONS, DEFAULT_SETTINGS, MAX_PLAYERS, TAKEOVER_SECS,
  cleanTimer, DEFAULT_TIMER, totalRounds,   // [settings]
  addTime, undoBet, freshest, createGame, updateSettings, addPlayer, kickPlayer, moveSeat, setSeen, pickFrame, allFramesIn, resolveFraming, hallOfFame, planBlock, ensurePlan,
  inductNeed, deckCartoons, dealCartoon, store, syncGallery, setPlayerSeen, seenCounts,
  startRound, submitCaption, voteMulligan, finishWriting, allCaptionsIn,
  moveToFirstBets, placeBet, skipCurrentBetter, moveToReveal, moveFromReveal, moveFromSecondBets,
  openFinale, voteFinale, resolveFinale, finaleAllIn,
  setVoice, clearVoice,
  stealChip, revealAnswer, moveToFraming, moveToScoreboard, isGameOver, resetForNewGame, isPresent,
  REACTION_KINDS, react, reelStep, reelOrder, votesOn, awardBadges, setCareer, closeVerdicts, OPEN_MS,
  currentBetterId, pendingBetters, nextDealerIndex, getPlayerView, generateRoomCode,
};
