/* Closed Caption — THE HEISTS. Thirty ways for the dealer to steal a chip and make it their own.
   Act 0 is The Claw (steal.js). Acts 1..30 live here, in the same order as HEISTS in game.js
   (the server deals them like a deck, so a room sees every heist before any repeats).
   A heist plays only on a 'full' steal (the first steal of a game, or a steal off the real caption);
   every other steal is steal.js's short paperwork stamp.
   Every heist is a full show on the shared beat (state.steal.at), the same frame on every phone:
     0.0s  the table, the doomed chip trembles, the act's title card
     0.5s  the thief makes its entrance (its own way of moving)
     2.3s  the grab (snatch, tongue, tentacle, beam, lasso, an invisible rope…)
     3.4s  into the spotlight: the chip is made the dealer's own (stamped, signed, tagged, covered…)
     5.2s  set back in its spot, now in the dealer's colour; the thief makes its exit
     6.2s  the gloat card
   House style: every thief and prop is drawn in the house ink (no emoji); a few ink specks in the dealer's
   colour at most; every sound is soft (sine/triangle ≤0.05, or filtered noise), short (≤0.8s).
   Built and wound up before the beat; the beat only shows it. Big sounds on the speaker phone only (big()).
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, big, buzz, tone, noise.
   CSS prefix: hz-. Reuses steal.js's stage, felt and gloat-card styles (st-*). */
(function () {
  'use strict';

  var L = 7600;   // the whole show, ms (index.html STEAL_SHOW_MS; server.js waits the same for a 'full' steal)
  var TM = { title: 0, enter0: 450, enter1: 2250, grab: 2450, atC: 3350, claim0: 3450, claim1: 5050, back0: 5150, pick: 5300, set: 5800, exit1: 6500, gloat: 6250 };

  /* ── The cast. move: how it gets there; grab: how it takes the chip; claim: how it makes the chip the
        dealer's; prop: the claim's ink tool (PROP_SVG); snd/csnd: its entrance and claim sounds. ── */
  var ACTS = [
    null,   // 0: The Claw (steal.js)
    { tag: 'Swoops in. Asks no questions.', size: 92, from: 'topright', move: 'swoop', grab: 'carry', claim: 'sticker', snd: 'swoosh', exit: 'top' },
    { tag: 'Washes everything first.', size: 84, from: 'left', move: 'tiptoe', grab: 'carry', claim: 'dip', prop: 'bucket', snd: 'creep' },
    { tag: 'Tongue first. Questions later.', size: 84, from: 'right', move: 'hop', grab: 'line', line: 'tongue', claim: 'lick', snd: 'hop' },
    { tag: 'Not of this table.', size: 100, from: 'top', move: 'drift', grab: 'beam', claim: 'swirl', snd: 'hum', exit: 'top' },
    { tag: 'Nothing up the sleeve. Except your chip.', size: 88, from: 'bottom', move: 'rise', grab: 'levitate', claim: 'sparkle', prop: 'wand', snd: 'magic', exit: 'bottom' },
    { tag: 'Has a hand in everything.', size: 92, from: 'bottom', move: 'rise', grab: 'line', line: 'tentacle', claim: 'splat', snd: 'blub', exit: 'bottom' },
    { tag: 'Moves it to another column.', size: 86, from: 'left', move: 'tiptoe', grab: 'carry', claim: 'sign', prop: 'pen', snd: 'steps' },
    { tag: 'Clears the table. Thoroughly.', size: 88, from: 'right', move: 'glide', grab: 'carry', claim: 'cloche', prop: 'cloche', snd: 'steps' },
    { tag: 'Sweetie, that’s mine.', size: 84, from: 'left', move: 'tiptoe', grab: 'carry', claim: 'dip', prop: 'purse', snd: 'creep', csnd: 'snap' },
    { tag: 'Knocks things off tables. Professionally.', size: 88, from: 'right', move: 'tiptoe', grab: 'carry', claim: 'sit', snd: 'creep' },
    { tag: 'Says nothing. Takes everything.', size: 88, from: 'left', move: 'glide', grab: 'line', line: 'none', claim: 'wipe', snd: 'none', csnd: 'none' },
    { tag: 'You will not see this.', size: 84, from: 'left', move: 'teleport', grab: 'carry', claim: 'swirl', snd: 'ninja', exit: 'poof' },
    { tag: 'Act of God. Allegedly.', size: 96, from: 'left', move: 'spin', grab: 'carry', claim: 'swirl', snd: 'wind' },
    { tag: 'Very good boy. Very bad manners.', size: 88, from: 'left', move: 'zigzag', grab: 'carry', claim: 'sit', snd: 'pat' },
    { tag: 'Was here the whole time.', size: 88, from: 'right', move: 'drift', grab: 'levitate', claim: 'swirl', snd: 'spooky', exit: 'fade' },
    { tag: 'Going once. Gone.', size: 86, from: 'right', move: 'march', grab: 'carry', claim: 'stamp', prop: 'gavel', snd: 'steps', csnd: 'gavel' },
    { tag: 'Billable hours: one chip.', size: 84, from: 'right', move: 'tiptoe', grab: 'carry', claim: 'stamp', prop: 'rubber', snd: 'creep' },
    { tag: 'Armored, and petty about it.', size: 84, from: 'right', move: 'crawl', grab: 'carry', claim: 'sticker', snd: 'clack', noFlip: true },
    { tag: 'Sixty-six million years of grudges.', size: 104, from: 'left', move: 'stomp', grab: 'carry', claim: 'sit', snd: 'stomp' },
    { tag: 'He’s been on his way since round one.', size: 80, from: 'right', move: 'crawl', grab: 'carry', claim: 'trail', snd: 'slow' },
    { tag: 'Has never once asked permission.', size: 82, from: 'topright', move: 'swoop', grab: 'carry', claim: 'peck', snd: 'swoosh', exit: 'top' },
    { tag: 'Works from under the table.', size: 86, from: 'bottom', move: 'rise', grab: 'carry', claim: 'dip', prop: 'molehill', snd: 'dig', exit: 'bottom' },
    { tag: 'Asks nothing. Swallows everything.', size: 92, from: 'left', move: 'tiptoe', grab: 'carry', claim: 'sit', snd: 'waddle', csnd: 'gulp' },
    { tag: 'Runs on spite and AA batteries.', size: 86, from: 'right', move: 'march', grab: 'line', line: 'grabber', claim: 'sticker', prop: 'barcode', snd: 'robot' },
    { tag: 'Pollinates. Takes a cut.', size: 74, from: 'right', move: 'zigzag', grab: 'carry', claim: 'peck', snd: 'buzz' },
    { tag: 'Prickly about returns.', size: 82, from: 'right', move: 'crawl', grab: 'carry', claim: 'trail', snd: 'pat' },
    { tag: 'Rides in. Doesn’t tip.', size: 88, from: 'left', move: 'hop', grab: 'line', line: 'lasso', claim: 'iron', prop: 'flame', snd: 'hooves' },
    { tag: 'Only comes out at game night.', size: 88, from: 'right', move: 'drift', grab: 'carry', claim: 'wipe', snd: 'spooky' },
    { tag: 'Guarding it. From you.', size: 88, from: 'left', move: 'glide', grab: 'beam', beam: 'torch', claim: 'tag', prop: 'tag', snd: 'steps' },
    { tag: 'Dressed for the occasion.', size: 86, from: 'right', move: 'slide', grab: 'carry', claim: 'dip', prop: 'icehole', snd: 'slide' },
  ];

  /* ── Every thief, drawn in the house ink (emoji look cheap and differ by phone brand).
        viewBox 100×100, facing LEFT (flipOf mirrors them when they walk right). Flat fills, a 4px ink line. ── */
  var G0 = '<g stroke="#1F1A17" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">', G1 = '</g>';
  var SKIN = '#F2C9A0', INKC = '#1F1A17';
  var dot = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 2.4) + '" fill="' + INKC + '" stroke="none"/>'; };
  // a plain torso for the people (shirt colour, optional lapel/vest detail drawn on top)
  var torso = function (fill, extra) { return '<path d="M28 96 C28 74 38 62 51 62 C64 62 74 74 74 96 Z" fill="' + fill + '"/>' + (extra || ''); };
  var THIEF_SVG = {
    1: G0 +   // The Bald Eagle
      '<path d="M50 76 L47 92 L40 94 M60 76 L62 92 L56 95" fill="none" stroke-width="7"/><path d="M50 76 L47 92 L40 94 M60 76 L62 92 L56 95" fill="none" stroke="#FFC93C" stroke-width="3"/>' +
      '<path d="M76 66 L96 76 L80 80 Z" fill="#fff"/>' +
      '<path d="M36 52 C46 44 72 46 84 62 C76 76 60 82 46 78 C36 74 32 62 36 52 Z" fill="#6B4423"/>' +
      '<path d="M54 54 C66 40 84 32 96 26 C94 44 82 58 66 64 Z" fill="#5A3A1E"/><path d="M66 50 L84 40 M70 56 L88 48" fill="none" stroke-width="2.5"/>' +
      '<path d="M20 42 C18 28 30 22 42 24 C52 26 56 36 52 46 C48 54 38 56 30 54 C24 52 21 48 20 42 Z" fill="#fff"/>' +
      '<path d="M22 38 C12 37 6 42 8 50 C10 47 15 46 20 47 L24 44 Z" fill="#FFC93C"/>' +
      dot(30, 36, 2.6) + '<path d="M24 30 L36 33" stroke-width="3.5"/>' + G1,
    5: G0 +   // The Magician: a top hat, and the eyes of whoever is under it
      '<path d="M30 14 L70 14 L68 60 L32 60 Z" fill="#2A2522"/>' +
      '<path d="M32 50 L68 50 L68 58 L32 58 Z" fill="#B3263A" stroke-width="3"/>' +
      '<path d="M14 64 C14 58 86 58 86 64 C86 70 14 70 14 64 Z" fill="#2A2522"/>' +
      '<path d="M36 22 L36 44" stroke="#fff" stroke-opacity=".35" stroke-width="4"/>' +
      '<ellipse cx="38" cy="78" rx="7" ry="6" fill="#fff" stroke-width="3"/><ellipse cx="58" cy="78" rx="7" ry="6" fill="#fff" stroke-width="3"/>' +
      dot(35, 78, 2.8) + dot(55, 78, 2.8) + G1,
    6: G0 +   // The Octopus
      '<path d="M28 62 C20 74 26 84 14 90 M40 64 C38 78 44 86 34 95 M56 64 C60 78 54 86 62 95 M70 62 C78 72 74 84 88 88" fill="none" stroke-width="11"/>' +
      '<path d="M28 62 C20 74 26 84 14 90 M40 64 C38 78 44 86 34 95 M56 64 C60 78 54 86 62 95 M70 62 C78 72 74 84 88 88" fill="none" stroke="#C06AD6" stroke-width="5"/>' +
      '<path d="M22 54 C18 28 34 10 52 10 C72 10 84 28 80 54 C78 64 68 68 51 68 C34 68 24 64 22 54 Z" fill="#C06AD6"/>' +
      '<path d="M60 20 C68 22 74 30 74 38" fill="none" stroke="#E8B8F2" stroke-width="4"/>' +
      '<circle cx="36" cy="42" r="6" fill="#fff" stroke-width="3"/><circle cx="54" cy="42" r="6" fill="#fff" stroke-width="3"/>' + dot(34, 43, 2.6) + dot(52, 43, 2.6) +
      '<path d="M38 56 Q44 58 50 56" fill="none" stroke-width="3"/>' + G1,
    7: G0 +   // The Accountant: green visor, round glasses, a ledger under the arm
      torso('#F4F1EA', '<path d="M51 63 L47 76 L51 86 L55 76 Z" fill="#2E5EAA" stroke-width="2.5"/>') +
      '<path d="M34 72 L18 80" stroke-width="9"/><path d="M34 72 L18 80" stroke="#F4F1EA" stroke-width="4"/>' +
      '<rect x="10" y="70" width="22" height="26" rx="2" fill="#2E9E6B" transform="rotate(-10 21 83)"/>' +
      '<circle cx="50" cy="40" r="17" fill="' + SKIN + '"/>' +
      '<path d="M38 26 C44 20 58 20 64 26" fill="none" stroke-width="3"/>' +
      '<path d="M30 30 C38 24 60 24 68 30 L66 34 C56 30 42 30 32 36 Z" fill="#3FA46A" fill-opacity=".9"/><path d="M32 34 L14 38 L32 39 Z" fill="#3FA46A"/>' +
      '<circle cx="40" cy="42" r="5.5" fill="#fff" stroke-width="2.5"/><circle cx="54" cy="42" r="5.5" fill="#fff" stroke-width="2.5"/><path d="M45.5 42 L48.5 42" stroke-width="2.5"/>' +
      dot(39, 42, 1.8) + dot(53, 42, 1.8) + '<path d="M40 52 L47 52" stroke-width="2.5"/>' + G1,
    8: G0 +   // The Butler: tails, a bow tie, a towel over the arm, eyes closed in disapproval
      torso('#2A2522', '<path d="M44 63 L51 82 L58 63 Z" fill="#fff" stroke-width="2.5"/><path d="M44 64 L51 67 L58 64 L58 70 L51 67 L44 70 Z" fill="' + INKC + '" stroke-width="2"/>') +
      '<path d="M32 72 L20 74" stroke-width="9"/><path d="M14 70 L26 70 L28 90 L16 92 Z" fill="#fff" stroke-width="3"/>' +
      '<ellipse cx="50" cy="38" rx="16" ry="18" fill="' + SKIN + '"/>' +
      '<path d="M64 30 C68 34 68 42 64 46 M36 28 C33 31 33 35 34 38" fill="none" stroke="#9AA3AD" stroke-width="5"/>' +
      '<path d="M38 36 Q41 34 44 36 M50 36 Q53 34 56 36" fill="none" stroke-width="2.5"/>' +
      '<path d="M37 40 L31 45 L38 46" fill="none" stroke-width="2.5"/><path d="M40 51 L47 51" stroke-width="2.5"/>' + G1,
    9: G0 +   // Grandma: a bun, glasses on a chain, a cardigan
      torso('#E8A0B8', '<path d="M51 64 V96" fill="none" stroke-width="2.5"/>' + dot(55, 74, 2) + dot(55, 84, 2)) +
      '<path d="M40 63 Q51 70 62 63" fill="none" stroke="#fff" stroke-width="3"/>' +
      '<circle cx="62" cy="20" r="8" fill="#D9D9DE"/>' +
      '<circle cx="50" cy="40" r="17" fill="' + SKIN + '"/>' +
      '<path d="M33 40 C30 24 42 19 52 21 C64 22 69 31 67 41 C62 31 51 27 40 31 Z" fill="#D9D9DE"/>' +
      '<circle cx="41" cy="43" r="5.5" fill="#fff" fill-opacity=".6" stroke-width="2.5"/><circle cx="55" cy="43" r="5.5" fill="#fff" fill-opacity=".6" stroke-width="2.5"/><path d="M46.5 43 L49.5 43" stroke-width="2.5"/>' +
      dot(40, 43, 1.8) + dot(54, 43, 1.8) +
      '<circle cx="36" cy="50" r="3.4" fill="#F49AAE" stroke="none"/><path d="M42 52 Q46 55 50 52" fill="none" stroke-width="2.5"/>' + G1,
    11: G0 +   // The Mime: stripes, white face, beret, one gloved hand pulling an invisible rope
      torso('#fff', '<path d="M31 72 H71 M29 80 H73 M28 88 H74" stroke-width="5"/>') +
      '<path d="M36 68 L20 60" stroke-width="9"/><path d="M36 68 L20 60" stroke="#fff" stroke-width="4"/><circle cx="17" cy="58" r="6" fill="#fff" stroke-width="3"/>' +
      '<ellipse cx="50" cy="38" rx="15" ry="18" fill="#fff"/>' +
      '<path d="M33 26 C35 14 63 12 67 24 C58 21 44 21 33 26 Z" fill="' + INKC + '"/><path d="M52 14 L53 9" stroke-width="3"/>' +
      '<path d="M39 30 Q42 27 45 30 M51 30 Q54 27 57 30" fill="none" stroke-width="2.5"/>' + dot(42, 36, 2) + dot(54, 36, 2) +
      '<path d="M54 41 L55 45" stroke-width="2"/><path d="M45 48 Q48 46 51 48" fill="none" stroke="#E8453A" stroke-width="3"/>' + G1,
    12: G0 +   // The Ninja
      torso('#2A2522', '<path d="M30 82 H72" stroke="#B3263A" stroke-width="5"/>') +
      '<path d="M66 34 L86 26 L82 34 L92 38" fill="none" stroke-width="8"/><path d="M66 34 L86 26 L82 34 L92 38" fill="none" stroke="#B3263A" stroke-width="4"/>' +
      '<circle cx="50" cy="40" r="18" fill="#2A2522"/>' +
      '<path d="M33 35 Q50 31 65 35 L65 45 Q50 48 33 45 Z" fill="' + SKIN + '" stroke-width="2.5"/>' +
      '<path d="M37 40 L44 39 M50 39 L57 40" stroke-width="3"/>' + G1,
    13: G0 +   // The Tornado
      '<path d="M12 16 C28 6 74 6 90 16 C88 26 72 30 50 30 C30 30 14 26 12 16 Z" fill="#B9C2CC"/>' +
      '<path d="M20 36 C34 30 68 30 80 36 C76 44 64 46 50 46 C36 46 24 44 20 36 Z" fill="#CDD3DA"/>' +
      '<path d="M30 54 C40 50 62 50 70 54 C66 60 58 62 50 62 C42 62 34 60 30 54 Z" fill="#B9C2CC"/>' +
      '<path d="M38 70 C44 67 58 67 62 70 C60 76 54 77 50 77 C46 77 40 75 38 70 Z" fill="#CDD3DA"/>' +
      '<path d="M45 84 C48 82 54 82 56 85 C54 89 50 90 48 89 Z" fill="#B9C2CC"/>' +
      '<path d="M82 46 L90 42 L88 52 Z M14 58 L20 52 L22 60 Z" fill="#6BBF59" stroke-width="2.5"/>' +
      '<path d="M30 20 Q50 26 72 20" fill="none" stroke-width="2.5" stroke-opacity=".5"/>' + G1,
    14: G0 +   // The Good Boy
      '<path d="M78 58 C88 50 92 42 90 32" fill="none" stroke-width="9"/><path d="M78 58 C88 50 92 42 90 32" fill="none" stroke="#E3A857" stroke-width="4"/>' +
      '<path d="M48 72 L46 92 M58 74 L58 92 M70 72 L72 92 M78 68 L82 90" fill="none" stroke-width="9"/><path d="M48 72 L46 92 M58 74 L58 92 M70 72 L72 92 M78 68 L82 90" fill="none" stroke="#E3A857" stroke-width="4"/>' +
      '<ellipse cx="62" cy="64" rx="22" ry="14" fill="#E3A857"/>' +
      '<circle cx="32" cy="46" r="15" fill="#E3A857"/>' +
      '<ellipse cx="20" cy="53" rx="10" ry="7" fill="#F2CF95"/>' + dot(12, 51, 3.4) +
      '<path d="M36 34 C46 32 49 48 43 57 C38 51 36 43 36 34 Z" fill="#B97A35"/>' + dot(28, 42, 2.4) +
      '<path d="M18 59 C18 66 25 66 25 59" fill="#F49AAE" stroke-width="2.5"/>' +
      '<path d="M42 56 C46 61 46 66 44 70" fill="none" stroke="#E8453A" stroke-width="5"/>' + G1,
    16: G0 +   // The Auctioneer: waistcoat, slicked hair, a moustache, mid-sentence
      torso('#B3263A', '<path d="M44 63 L51 80 L58 63 Z" fill="#fff" stroke-width="2.5"/><path d="M45 64 L51 67 L57 64 L57 69 L51 67 L45 69 Z" fill="' + INKC + '" stroke-width="2"/>') +
      '<circle cx="50" cy="40" r="17" fill="' + SKIN + '"/>' +
      '<path d="M33 36 C33 22 46 20 56 22 C64 24 69 30 67 38 C60 30 48 28 33 36 Z" fill="#3A2F28"/>' +
      '<path d="M37 37 L43 34 M52 35 L57 36" stroke-width="2.5"/>' + dot(41, 41, 2.2) + dot(55, 41, 2.2) +
      '<path d="M38 49 C42 45 46 47 49 49 C52 47 56 45 60 49 C56 51 52 51 49 50 C46 51 42 51 38 49 Z" fill="#3A2F28" stroke-width="2"/>' +
      '<ellipse cx="48" cy="54" rx="3" ry="2.2" fill="' + INKC + '" stroke="none"/>' + G1,
    17: G0 +   // The Lawyer: a grey suit, a briefcase, a small smile
      torso('#4A5260', '<path d="M42 63 L51 82 L60 63 Z" fill="#fff" stroke-width="2.5"/><path d="M51 66 L48 76 L51 84 L54 76 Z" fill="#B3263A" stroke-width="2"/><path d="M42 63 L46 78 M60 63 L56 78" fill="none" stroke-width="2.5"/>') +
      '<path d="M32 72 L24 80" stroke-width="9"/><path d="M32 72 L24 80" stroke="#4A5260" stroke-width="4"/>' +
      '<rect x="8" y="78" width="28" height="18" rx="3" fill="#7A4A2A"/><path d="M17 78 V73 H27 V78" fill="none" stroke-width="3"/>' +
      '<circle cx="50" cy="40" r="17" fill="' + SKIN + '"/>' +
      '<path d="M33 36 C33 22 46 20 56 22 C64 24 69 30 67 40 C64 32 58 28 50 28 C44 30 38 32 33 36 Z" fill="#2A2522"/>' +
      dot(41, 41, 2.2) + dot(55, 41, 2.2) + '<path d="M41 50 Q46 52 51 49" fill="none" stroke-width="2.5"/>' + G1,
    18: G0 +   // The Crab (faces you; never flipped)
      '<path d="M26 62 L10 70 M26 68 L12 80 M74 62 L90 70 M74 68 L88 80" fill="none" stroke-width="5"/>' +
      '<path d="M26 52 C12 46 9 30 17 23 C21 29 25 29 28 25 C34 33 32 46 26 52 Z" fill="#E8603A"/>' +
      '<path d="M74 52 C88 46 91 30 83 23 C79 29 75 29 72 25 C66 33 68 46 74 52 Z" fill="#E8603A"/>' +
      '<ellipse cx="50" cy="64" rx="28" ry="17" fill="#E8603A"/>' +
      '<path d="M42 50 L40 36 M58 50 L60 36" fill="none" stroke-width="3.5"/>' +
      '<circle cx="40" cy="33" r="5.5" fill="#fff" stroke-width="3"/><circle cx="60" cy="33" r="5.5" fill="#fff" stroke-width="3"/>' + dot(40, 34, 2.4) + dot(60, 34, 2.4) +
      '<path d="M36 28 L44 30 M56 30 L64 28" stroke-width="3"/><path d="M44 70 Q50 66 56 70" fill="none" stroke-width="3"/>' + G1,
    20: G0 +   // The Snail
      '<path d="M10 84 C10 76 18 72 28 72 L84 72 C91 72 95 78 93 84 Z" fill="#B8C9A0"/>' +
      '<path d="M18 74 C16 62 20 52 27 52 C34 52 36 62 34 74 Z" fill="#B8C9A0"/>' +
      '<path d="M23 54 L17 38 M30 54 L33 38" fill="none" stroke-width="3"/>' +
      '<circle cx="17" cy="35" r="4.5" fill="#fff" stroke-width="2.5"/><circle cx="33" cy="35" r="4.5" fill="#fff" stroke-width="2.5"/>' + dot(16, 36, 1.8) + dot(32, 36, 1.8) +
      '<circle cx="62" cy="52" r="22" fill="#D9A066"/>' +
      '<path d="M62 52 C62 46 70 46 70 52 C70 60 58 62 54 54 C50 44 62 36 72 40 C82 46 82 62 72 70" fill="none" stroke-width="3"/>' + G1,
    22: G0 +   // The Mole: a miner's helmet with a lamp
      '<path d="M18 94 C14 66 28 46 52 46 C76 46 88 64 84 94 Z" fill="#5B4A42"/>' +
      '<path d="M26 62 C14 58 8 64 12 70 C18 72 26 70 30 66 Z" fill="#5B4A42"/><circle cx="10" cy="66" r="4.5" fill="#F49AAE"/>' +
      '<path d="M28 78 C16 78 12 86 18 90 C24 92 32 86 32 82 Z" fill="#F49AAE"/>' +
      '<path d="M32 58 L37 58" stroke-width="3"/>' +
      '<path d="M28 50 C28 30 70 28 74 48 Z" fill="#FFD23F"/><path d="M24 50 L78 48" stroke-width="4"/>' +
      '<circle cx="34" cy="40" r="5" fill="#FFF8EA" stroke-width="3"/>' + G1,
    23: G0 +   // The Pelican
      '<path d="M58 80 L56 94 L50 96 M68 80 L70 94 L64 96" fill="none" stroke-width="7"/><path d="M58 80 L56 94 L50 96 M68 80 L70 94 L64 96" fill="none" stroke="#F2A33A" stroke-width="3"/>' +
      '<ellipse cx="64" cy="64" rx="22" ry="19" fill="#fff"/>' +
      '<path d="M58 58 C72 52 86 58 88 72 C78 76 66 74 58 68 Z" fill="#DDE3E8"/>' +
      '<path d="M46 58 C42 46 42 32 48 26 C54 22 62 26 60 34 C58 42 56 50 58 60 Z" fill="#fff"/>' +
      '<path d="M46 31 L6 40 L46 36 Z" fill="#F2A33A"/>' +
      '<path d="M46 36 L8 41 C14 56 34 60 48 50 Z" fill="#F7C27A"/>' + dot(52, 30, 2.4) + G1,
    24: G0 +   // The Robot
      '<path d="M40 82 V94 M60 82 V94" stroke-width="7"/>' +
      '<rect x="28" y="56" width="44" height="28" rx="4" fill="#AAB4BE"/><circle cx="40" cy="70" r="4" fill="#E8453A" stroke-width="2.5"/><path d="M50 64 H64 M50 70 H64 M50 76 H60" stroke-width="2.5"/>' +
      '<path d="M50 20 V10" stroke-width="3"/><circle cx="50" cy="8" r="3.5" fill="#FFD23F" stroke-width="2.5"/>' +
      '<rect x="26" y="20" width="48" height="32" rx="6" fill="#C9D0D8"/>' +
      '<rect x="31" y="27" width="11" height="8" rx="2" fill="#7FD8FF" stroke-width="2.5"/><rect x="48" y="27" width="11" height="8" rx="2" fill="#7FD8FF" stroke-width="2.5"/>' +
      '<path d="M34 44 H56" stroke-width="3" stroke-dasharray="3 3"/>' + G1,
    26: G0 +   // The Hedgehog
      '<path d="M24 72 L18 48 L30 54 L30 32 L40 44 L46 24 L52 40 L62 24 L64 42 L76 32 L74 50 L88 46 L82 62 L94 66 L84 76 Z" fill="#7A5A3A"/>' +
      '<path d="M24 72 L84 76 C80 86 32 86 24 72 Z" fill="#E9C9A0"/>' +
      '<path d="M30 72 C18 72 10 68 7 61 C14 55 22 53 31 55 Z" fill="#E9C9A0"/>' + dot(6, 61, 3) + dot(21, 59, 2.2) +
      '<path d="M40 84 L38 92 M66 84 L68 92" stroke-width="5"/>' + G1,
    27: G0 +   // The Cowboy
      torso('#C46A3A', '<path d="M40 62 L51 74 L62 62 Z" fill="#E8453A" stroke-width="2.5"/><path d="M36 70 L40 96 M66 70 L62 96" fill="none" stroke-width="2.5"/>') +
      '<circle cx="50" cy="42" r="16" fill="' + SKIN + '"/>' +
      '<path d="M38 41 L44 41 M52 41 L58 41" stroke-width="2.5"/>' +
      '<path d="M40 50 C44 47 48 48 50 50 C52 48 56 47 60 50" fill="none" stroke-width="3"/>' +
      '<path d="M32 30 C32 12 40 10 50 15 C60 10 68 12 68 30 Z" fill="#8A5A2B"/>' +
      '<path d="M14 30 C28 22 72 22 88 30 C74 36 28 36 14 30 Z" fill="#8A5A2B"/><path d="M33 26 H67" stroke-width="2.5"/>' + G1,
    28: G0 +   // The Vampire
      '<path d="M12 96 L30 56 L51 64 L72 56 L90 96 Z" fill="#2A2522"/>' +
      '<path d="M30 56 L20 30 L40 48 Z M72 56 L82 30 L62 48 Z" fill="#B3263A"/>' +
      '<ellipse cx="51" cy="40" rx="15" ry="18" fill="#E4E8EC"/>' +
      '<path d="M36 34 C35 20 45 18 51 28 C57 18 67 20 66 34 C63 26 57 24 51 30 C45 24 39 26 36 34 Z" fill="' + INKC + '"/>' +
      '<path d="M40 38 L46 40 M56 40 L62 38" stroke-width="2.5"/>' + dot(43, 43, 2) + dot(59, 43, 2) +
      '<path d="M44 51 Q51 54 58 51" fill="none" stroke-width="2.5"/><path d="M47 52 L48 56 L49 52" fill="#fff" stroke-width="1.5"/>' + G1,
    29: G0 +   // The Night Watchman: cap, uniform, a torch held out front
      torso('#2E3F6E', '<circle cx="60" cy="74" r="3.5" fill="#FFD23F" stroke-width="2"/>') +
      '<path d="M36 70 L20 66" stroke-width="9"/><path d="M36 70 L20 66" stroke="#2E3F6E" stroke-width="4"/>' +
      '<rect x="4" y="60" width="18" height="9" rx="2" fill="#AAB4BE" transform="rotate(-8 13 64)"/>' +
      '<circle cx="50" cy="42" r="16" fill="' + SKIN + '"/>' +
      '<path d="M32 32 C34 18 64 18 68 32 Z" fill="#2E3F6E"/><path d="M33 32 L18 35 L34 36 Z" fill="' + INKC + '"/><circle cx="50" cy="24" r="2.6" fill="#FFD23F" stroke-width="2"/>' +
      '<path d="M38 42 Q41 40 44 42 M52 42 Q55 40 58 42" fill="none" stroke-width="2.5"/>' +
      '<path d="M40 50 C44 48 48 49 50 51 C52 49 56 48 60 50" fill="none" stroke-width="3"/>' + G1,
    30: G0 +   // The Penguin, in a bow tie
      '<ellipse cx="44" cy="92" rx="8" ry="4" fill="#F2A33A"/><ellipse cx="60" cy="92" rx="8" ry="4" fill="#F2A33A"/>' +
      '<path d="M70 52 C82 62 82 74 74 80 C72 70 70 62 66 56 Z" fill="#2A2522"/>' +
      '<ellipse cx="52" cy="58" rx="24" ry="32" fill="#2A2522"/>' +
      '<ellipse cx="46" cy="66" rx="15" ry="22" fill="#fff" stroke-width="3"/>' +
      '<ellipse cx="42" cy="38" rx="11" ry="9" fill="#fff" stroke-width="3"/>' + dot(39, 37, 2.3) +
      '<path d="M32 39 L18 43 L32 47 Z" fill="#F2A33A"/>' +
      '<path d="M40 52 L46 55 L52 52 L52 58 L46 55 L40 58 Z" fill="#E8453A" stroke-width="2"/>' + G1,
  };
  /* The eight drawn earlier (Raccoon, Frog, UFO, Cat, Ghost, T. rex, Seagull, Bee) */
  Object.assign(THIEF_SVG, {
    2: G0 +   // The Raccoon
      '<path d="M66 60 C84 58 96 46 93 33 C91 25 83 27 83 35 C83 45 75 51 64 53 Z" fill="#8E949C"/>' +
      '<path d="M86 29 L80 37 M92 41 L83 45 M86 53 L78 53" stroke-width="5"/>' +
      '<path d="M44 74 L42 88 M54 76 L54 89 M64 75 L67 88 M72 71 L77 85" stroke-width="9"/><path d="M44 74 L42 88 M54 76 L54 89 M64 75 L67 88 M72 71 L77 85" stroke="#8E949C" stroke-width="3.5"/>' +
      '<ellipse cx="57" cy="62" rx="24" ry="16" fill="#9CA2AA"/>' +
      '<path d="M24 29 L21 13 L34 24 Z M41 25 L47 11 L51 28 Z" fill="#9CA2AA"/>' +
      '<path d="M13 44 C13 30 25 22 38 24 C48 26 54 34 52 46 C50 56 40 60 30 60 C20 60 13 54 13 44 Z" fill="#BAC0C7"/>' +
      '<path d="M12 42 C18 36 26 38 31 40 C36 37 44 35 52 40 C50 47 44 49 38 46 C34 45 30 45 28 47 C22 50 15 48 12 42 Z" fill="#1F1A17" stroke-width="2"/>' +
      '<circle cx="22" cy="43" r="3.6" fill="#fff" stroke="none"/><circle cx="42" cy="42" r="3.6" fill="#fff" stroke="none"/><circle cx="21" cy="43" r="1.6" fill="#1F1A17" stroke="none"/><circle cx="41" cy="42" r="1.6" fill="#1F1A17" stroke="none"/>' +
      '<path d="M9 51 C10 46 17 46 23 50 C24 55 18 58 12 56 Z" fill="#F4EFE6" stroke-width="3"/><circle cx="9" cy="50" r="3.4" fill="#1F1A17" stroke="none"/>' + G1,
    3: G0 +   // The Frog
      '<ellipse cx="30" cy="88" rx="10" ry="4.5" fill="#4FA83E"/><ellipse cx="70" cy="88" rx="10" ry="4.5" fill="#4FA83E"/>' +
      '<path d="M13 69 C9 50 24 37 50 37 C76 37 91 50 87 69 C85 82 71 88 50 88 C29 88 15 82 13 69 Z" fill="#5DBB4A"/>' +
      '<circle cx="32" cy="34" r="13" fill="#5DBB4A"/><circle cx="68" cy="34" r="13" fill="#5DBB4A"/>' +
      '<circle cx="31" cy="33" r="8" fill="#fff" stroke-width="3"/><circle cx="67" cy="33" r="8" fill="#fff" stroke-width="3"/>' +
      '<circle cx="28" cy="34" r="4" fill="#1F1A17" stroke="none"/><circle cx="64" cy="34" r="4" fill="#1F1A17" stroke="none"/>' +
      '<ellipse cx="50" cy="77" rx="20" ry="8" fill="#CDE8A0" stroke-width="3"/>' +
      '<path d="M24 58 Q50 74 76 58" fill="none"/>' +
      '<circle cx="23" cy="65" r="4.5" fill="#F49AAE" stroke="none"/><circle cx="77" cy="65" r="4.5" fill="#F49AAE" stroke="none"/>' + G1,
    4: G0 +   // The UFO
      '<path d="M29 47 C29 19 71 19 71 47 Z" fill="#BFE8F5"/>' +
      '<path d="M50 26 L50 18" stroke-width="2.5"/><circle cx="50" cy="16.5" r="2.6" fill="#E8453A" stroke-width="2"/>' +
      '<ellipse cx="50" cy="35" rx="8" ry="9" fill="#7ED957" stroke-width="3"/><ellipse cx="46.5" cy="34" rx="2" ry="3" fill="#1F1A17" stroke="none"/><ellipse cx="53.5" cy="34" rx="2" ry="3" fill="#1F1A17" stroke="none"/>' +
      '<path d="M35 33 C36 28 40 25 44 24" fill="none" stroke="#fff" stroke-width="3"/>' +
      '<ellipse cx="50" cy="65" rx="18" ry="6" fill="#6C7784"/>' +
      '<ellipse cx="50" cy="56" rx="45" ry="13" fill="#AAB4BE"/>' +
      '<path d="M8 55 Q50 66 92 55" fill="none" stroke-width="3"/>' +
      '<circle cx="23" cy="58" r="3.4" fill="#FFD23F" stroke-width="2"/><circle cx="37" cy="61" r="3.4" fill="#FFD23F" stroke-width="2"/><circle cx="50" cy="62" r="3.4" fill="#FFD23F" stroke-width="2"/><circle cx="63" cy="61" r="3.4" fill="#FFD23F" stroke-width="2"/><circle cx="77" cy="58" r="3.4" fill="#FFD23F" stroke-width="2"/>' + G1,
    10: G0 +   // The Cat
      '<path d="M68 85 C88 85 95 70 89 58 C86 52 80 55 83 61 C87 70 82 78 68 78" fill="#F2A541"/>' +
      '<path d="M33 87 C29 70 36 52 54 50 C70 50 77 66 74 87 Z" fill="#F2A541"/>' +
      '<path d="M60 57 L67 61 M58 65 L69 69 M59 74 L70 77" stroke-width="3"/>' +
      '<ellipse cx="41" cy="87" rx="7" ry="4" fill="#F7C27A" stroke-width="3"/><ellipse cx="55" cy="87" rx="7" ry="4" fill="#F7C27A" stroke-width="3"/>' +
      '<path d="M21 31 L19 12 L34 24 Z M40 23 L50 9 L53 29 Z" fill="#F2A541"/><path d="M23 26 L22 18 L29 24 Z" fill="#F49AAE" stroke="none"/>' +
      '<circle cx="36" cy="40" r="18" fill="#F2A541"/>' +
      '<path d="M32 23 L33 29 M38 22 L38 28" stroke-width="3"/>' +
      '<ellipse cx="29" cy="40" rx="2.6" ry="4" fill="#1F1A17" stroke="none"/><ellipse cx="42" cy="40" rx="2.6" ry="4" fill="#1F1A17" stroke="none"/>' +
      '<path d="M32 46 L36 46 L34 49 Z" fill="#F49AAE" stroke-width="2"/><path d="M30 52 Q32 54 34 51 Q36 54 38 52" fill="none" stroke-width="2.5"/>' +
      '<path d="M24 47 L9 44 M24 51 L9 53" stroke-width="2"/>' + G1,
    15: G0 +   // The Ghost
      '<path d="M24 50 C14 50 7 44 9 37 C13 35 19 41 25 43 Z" fill="#fff"/><path d="M76 50 C86 50 92 45 91 38 C87 36 81 41 75 43 Z" fill="#fff"/>' +
      '<path d="M22 86 C20 60 20 40 30 26 C40 12 66 12 74 28 C82 42 80 64 82 86 L74 80 L66 88 L58 80 L50 88 L42 80 L34 88 Z" fill="#fff"/>' +
      '<ellipse cx="40" cy="44" rx="5" ry="7" fill="#1F1A17" stroke="none"/><ellipse cx="58" cy="44" rx="5" ry="7" fill="#1F1A17" stroke="none"/>' +
      '<circle cx="38.5" cy="41" r="1.7" fill="#fff" stroke="none"/><circle cx="56.5" cy="41" r="1.7" fill="#fff" stroke="none"/>' +
      '<ellipse cx="48" cy="63" rx="6" ry="8" fill="#1F1A17" stroke="none"/><ellipse cx="48" cy="67" rx="3.5" ry="3" fill="#F49AAE" stroke="none"/>' + G1,
    19: G0 +   // The T. rex
      '<path d="M60 56 C76 54 92 58 98 71 C86 68 74 70 62 73 Z" fill="#6BBF59"/>' +
      '<path d="M40 73 L38 89 L28 91 L30 96 L46 96 L49 75 Z" fill="#5AAE49"/><path d="M56 71 L58 89 L50 91 L52 96 L66 96 L65 71 Z" fill="#6BBF59"/>' +
      '<path d="M33 46 C43 40 62 44 66 58 C70 72 60 82 46 80 C36 78 29 66 33 46 Z" fill="#6BBF59"/>' +
      '<path d="M38 58 C44 61 51 61 57 58 M38 66 C44 69 51 69 57 66" fill="none" stroke="#A9DE8F" stroke-width="3"/>' +
      '<path d="M38 50 L28 54 L26 59" fill="none" stroke-width="7"/><path d="M38 50 L28 54 L26 59" fill="none" stroke="#6BBF59" stroke-width="2.5"/>' +
      '<path d="M7 30 C7 18 18 11 34 11 C46 11 53 19 51 30 L49 42 C41 46 31 46 25 44 L9 44 C7 40 7 36 7 30 Z" fill="#6BBF59"/>' +
      '<path d="M10 36 L13 40 L16 36 L19 40 L22 36 L25 40 L28 36 L31 40 L34 36" fill="#fff" stroke-width="2"/><path d="M9 36 L46 36" fill="none" stroke-width="3"/>' +
      '<circle cx="36" cy="22" r="4.5" fill="#fff" stroke-width="3"/><circle cx="35" cy="22.5" r="2" fill="#1F1A17" stroke="none"/><path d="M29 15 L41 18" stroke-width="3.5"/>' +
      '<circle cx="12" cy="22" r="1.6" fill="#1F1A17" stroke="none"/><circle cx="58" cy="50" r="3" fill="#4E9A3F" stroke="none"/><circle cx="64" cy="62" r="2.4" fill="#4E9A3F" stroke="none"/>' + G1,
    21: G0 +   // The Seagull
      '<path d="M48 75 L46 91 L39 94 M58 75 L60 91 L53 94" fill="none" stroke-width="7"/><path d="M48 75 L46 91 L39 94 M58 75 L60 91 L53 94" fill="none" stroke="#F29A2E" stroke-width="3"/>' +
      '<path d="M20 50 C22 40 34 36 48 40 C66 44 86 50 96 58 C84 62 74 62 66 66 C58 78 40 80 30 70 C22 64 18 58 20 50 Z" fill="#fff"/>' +
      '<path d="M44 50 C58 46 76 52 92 58 C80 62 66 64 54 62 C46 60 42 56 44 50 Z" fill="#AAB4BE"/>' +
      '<path d="M80 56 C86 57 90 58 96 58 C90 62 84 62 78 62 Z" fill="#1F1A17" stroke-width="2"/>' +
      '<circle cx="28" cy="38" r="13" fill="#fff"/>' +
      '<path d="M16 37 L2 41 L16 45 Z" fill="#FFC93C" stroke-width="3"/><circle cx="8" cy="42.5" r="1.9" fill="#E8453A" stroke="none"/>' +
      '<circle cx="24" cy="35" r="2.5" fill="#1F1A17" stroke="none"/><path d="M19 30 L29 33" stroke-width="3.5"/>' + G1,
    25: G0 +   // The Bee
      '<path d="M84 57 L98 60 L84 64 Z" fill="#1F1A17" stroke-width="2"/>' +
      '<path d="M44 78 L40 88 M56 80 L54 90 M68 78 L68 88" fill="none" stroke-width="3"/>' +
      '<ellipse cx="58" cy="60" rx="28" ry="20" fill="#FFD23F"/>' +
      '<path d="M52 42 C48 52 48 68 52 78 M66 42 C62 52 62 68 66 78 M78 47 C76 54 76 66 78 73" fill="none" stroke-width="7" stroke-linecap="butt"/>' +
      '<path d="M24 42 C20 31 14 29 10 31 M32 41 C32 30 28 24 24 24" fill="none" stroke-width="3"/><circle cx="10" cy="31" r="2.6" fill="#1F1A17" stroke="none"/><circle cx="24" cy="24" r="2.6" fill="#1F1A17" stroke="none"/>' +
      '<circle cx="27" cy="54" r="14" fill="#3A2F28"/>' +
      '<circle cx="22" cy="50" r="4.2" fill="#fff" stroke="none"/><circle cx="21" cy="50.5" r="2" fill="#1F1A17" stroke="none"/><path d="M16 60 Q21 64 26 60" fill="none" stroke="#fff" stroke-width="2.5"/>' +
      '<ellipse cx="50" cy="30" rx="12" ry="19" transform="rotate(-22 50 30)" fill="#E2F4FF" fill-opacity=".9" stroke-width="3"/><ellipse cx="66" cy="32" rx="11" ry="17" transform="rotate(20 66 32)" fill="#E2F4FF" fill-opacity=".9" stroke-width="3"/>' + G1,
  });
  function thiefHtml(i, act) {
    var s = THIEF_SVG[i], px = act.size || 84;
    return '<svg viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" style="display:block;overflow:visible">' + (s || '') + '</svg>';
  }
  /* ── The claims' tools, in the same ink. viewBox 100×100, centred; the business end at the bottom. ── */
  var DC = 'style="fill:var(--dc)"';
  var PROP_SVG = {
    bucket: '<path d="M24 32 C24 6 76 6 76 32" fill="none" stroke-width="3"/><path d="M20 32 L80 32 L72 90 L28 90 Z" fill="#9AA3AD"/><ellipse cx="50" cy="32" rx="30" ry="7" fill="#5E8FB0"/><path d="M30 46 L34 82" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>',
    wand: '<path d="M22 82 L76 28" stroke-width="13"/><path d="M22 82 L76 28" stroke="#2A2522" stroke-width="7"/><path d="M66 38 L76 28" stroke="#fff" stroke-width="7"/>',
    purse: '<path d="M32 46 C32 18 68 18 68 46" fill="none" stroke-width="5"/><path d="M16 46 L84 46 L78 90 L22 90 Z" fill="#B3263A"/><path d="M16 46 L84 46 L82 58 L18 58 Z" fill="#8E1E2E"/><circle cx="50" cy="52" r="5" fill="#FFD23F" stroke-width="2.5"/>',
    rubber: '<circle cx="50" cy="14" r="10" fill="#7A4A2A"/><rect x="45" y="22" width="10" height="34" fill="#9A6A3A"/><rect x="22" y="56" width="56" height="18" rx="3" fill="#C99A5B"/><rect x="24" y="74" width="52" height="10" ' + DC + '/>',
    gavel: '<path d="M50 6 L50 58" stroke-width="12"/><path d="M50 6 L50 58" stroke="#B07A44" stroke-width="6"/><rect x="22" y="56" width="56" height="24" rx="5" fill="#8A5A2B"/><rect x="16" y="54" width="9" height="28" rx="2" fill="#6B4423"/><rect x="75" y="54" width="9" height="28" rx="2" fill="#6B4423"/>',
    pen: '<path d="M30 74 L74 20 L84 28 L40 82 Z" fill="#2A2522"/><path d="M62 36 L70 42" stroke="#FFD23F" stroke-width="3"/><path d="M30 74 L20 92 L40 82 Z" fill="#FFD23F"/>',
    cloche: '<circle cx="50" cy="18" r="6" fill="#AAB4BE"/><path d="M10 80 C10 42 30 24 50 24 C70 24 90 42 90 80 Z" fill="#DCE2E8"/><path d="M26 68 C24 52 32 40 42 36" fill="none" stroke="#fff" stroke-width="5"/><rect x="4" y="78" width="92" height="8" rx="4" fill="#AAB4BE"/>',
    molehill: '<path d="M2 92 C12 62 30 46 50 46 C70 46 88 62 98 92 Z" fill="#7A5A3A"/><ellipse cx="50" cy="52" rx="15" ry="5" fill="#2A1F18" stroke-width="3"/><path d="M28 72 L33 68 M62 64 L66 68 M72 82 L77 78 M40 84 L44 80" stroke-width="3"/>',
    icehole: '<ellipse cx="50" cy="62" rx="46" ry="20" fill="#E2F4FF"/><ellipse cx="50" cy="60" rx="26" ry="10" fill="#2E5EAA"/><path d="M14 56 L6 50 M86 56 L95 52 M30 76 L26 84" stroke-width="2.5"/>',
    barcode: '<rect x="12" y="26" width="76" height="50" rx="4" fill="#fff"/><path d="M22 34 V60 M27 34 V60 M34 34 V60 M38 34 V60 M45 34 V60 M52 34 V60 M56 34 V60 M63 34 V60 M70 34 V60 M74 34 V60 M79 34 V60" stroke-width="3" stroke-linecap="butt"/><path d="M22 68 H78" stroke-width="2" stroke-dasharray="3 3"/>',
    tag: '<path d="M26 45 C14 40 8 30 4 18" fill="none" stroke-width="2"/><path d="M32 20 L86 20 L86 72 L32 72 L16 46 Z" fill="#F4E6C4"/><rect x="62" y="20" width="24" height="52" ' + DC + '/><circle cx="27" cy="46" r="4.5" fill="#fff" stroke-width="2.5"/><path d="M38 36 H56 M38 46 H54 M38 56 H50" stroke-width="2.5"/>',
  };
  function propHtml(name, px) {
    if (!name) return '';
    if (name === 'flame') return FLAME(Math.round(px * 0.75));
    var s = PROP_SVG[name];
    return s ? '<svg viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true" style="display:block;overflow:visible">' + G0 + s + G1 + '</svg>' : '';
  }
  // ink flames for the hot-iron claim (the Cowboy's brand)
  var FLAME = function (w) { return window.ccInk && window.ccInk.flame ? window.ccInk.flame(w) : ''; };

  var CSS = [
    '.hz-layer{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform,opacity;}',
    '.hz-thief{z-index:6;}',
    '.hz-face{position:absolute;left:0;top:0;transform:translate(-50%,-55%);line-height:1;filter:drop-shadow(0 8px 8px rgba(0,0,0,.55));user-select:none;}',
    '.hz-held{z-index:5;opacity:0;}',
    '.hz-chipw{position:absolute;left:-23px;top:-23px;width:46px;height:46px;}',
    '.hz-chipw .chip{position:absolute;left:0;top:0;margin:0;box-shadow:0 3px 0 rgba(0,0,0,.55);}',
    '.hz-coat{position:absolute;left:0;top:0;width:46px;height:46px;opacity:0;}',
    '.hz-coat .chip{box-shadow:0 3px 0 rgba(0,0,0,.55),inset 0 0 0 1.5px rgba(255,255,255,.35);}',
    '.hz-prop{z-index:7;opacity:0;}',
    '.hz-prop span{position:absolute;left:0;top:0;transform:translate(-50%,-50%);line-height:1;filter:drop-shadow(0 6px 6px rgba(0,0,0,.5));}',
    '.hz-line{position:absolute;left:0;top:0;height:8px;width:100px;margin-top:-4px;transform-origin:0 50%;z-index:5;opacity:0;border-radius:6px;will-change:transform,opacity;}',
    '.hz-line.tongue{height:12px;margin-top:-6px;background:linear-gradient(180deg,#ff8fb0,#e84a7a);border:2px solid #1F1A17;}',
    '.hz-line.tentacle{height:14px;margin-top:-7px;background:radial-gradient(circle at 50% 75%,#f7b3e0 0 2.2px,transparent 2.6px) 0 0/11px 14px,linear-gradient(180deg,#c06ad6,#8a3aa8);border:2px solid #1F1A17;}',
    '.hz-line.grabber{height:10px;margin-top:-5px;background:linear-gradient(180deg,#e9eef2,#7d8894);border:2px solid #1F1A17;border-radius:3px;}',
    '.hz-line.lasso{height:5px;margin-top:-2.5px;background:repeating-linear-gradient(60deg,#c99a5b 0 4px,#8a6331 4px 7px);border-radius:3px;}',
    '.hz-line.none{visibility:hidden;}',   /* the Mime's rope: there is no rope */
    '.hz-loop{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:5px solid #b07f45;opacity:0;z-index:6;}',
    '.hz-beam{z-index:4;opacity:0;}',
    '.hz-beam i{position:absolute;left:-75px;top:0;width:150px;height:var(--bh,160px);clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);background:linear-gradient(180deg,rgba(160,255,190,.55),rgba(160,255,190,.08));}',
    '.hz-beam.torch i{background:linear-gradient(180deg,rgba(255,236,170,.6),rgba(255,236,170,.06));}',
    '.hz-fx{position:absolute;inset:0;z-index:8;pointer-events:none;overflow:hidden;}',
    /* specks: a few drops of ink in the dealer's colour (they replace the emoji confetti) */
    '.hz-fx span{position:absolute;left:0;top:0;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--dc);border:1.5px solid #1F1A17;opacity:0;will-change:transform,opacity;}',
    '.hz-ring{position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;border:3px solid #FFF8EA;opacity:0;z-index:7;}',
    '.hz-cloud{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#e8e2ef 70%);border:2px solid #1F1A17;opacity:0;z-index:7;}',
    '.hz-splat{position:absolute;left:-40px;top:-40px;width:80px;height:80px;opacity:0;z-index:7;}',
    '.hz-sig{position:absolute;left:-46px;top:-46px;width:92px;height:92px;z-index:7;opacity:0;overflow:visible;}',
    /* #48: the spotlight is the size of the screen (it used to be a 2200px square); its hole is placed with background-position */
    '.hz-spot{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;}',
    '.hz-shadow{position:absolute;left:-40px;top:-12px;width:80px;height:24px;border-radius:50%;z-index:4;background:radial-gradient(ellipse,rgba(0,0,0,.6),transparent 70%);opacity:0;}',
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-heist-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, u) { return a + (b - a) * u; };
  var ease = function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
  var easeOut = function (u) { return 1 - Math.pow(1 - u, 3); };
  var easeIn = function (u) { return u * u * u; };
  var kit = function () { return window.ccStealKit || {}; };
  function seeded(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ── Sounds (all inside big(): speaker phone only). tone(freq, sec, delayMs, type, vol, glideTo); noise(sec, delayMs, vol, freq, filter)
        One rule: every heist sound is sine or triangle at ≤0.05, or filtered noise, and ≤0.8s. The foley that is
        actually funny stays: the pizzicato tiptoe, the ninja's whoosh, the cat's sit, the stamp, the snail's long note. ── */
  var MOVE_SND = {
    none: function () {},
    swoosh: function () { noise(0.5, 0, 0.12, 1400, 'bandpass'); tone(500, 0.5, 0, 'sine', 0.03, 900); },
    creep: function () { [196, 233, 196, 262].forEach(function (f, i) { tone(f, 0.12, i * 180, 'triangle', 0.05); }); },
    steps: function () { [0, 1, 2, 3].forEach(function (i) { noise(0.04, i * 190, 0.1, 1200, 'bandpass'); }); },
    hop: function () { [0, 1, 2].forEach(function (i) { tone(180, 0.18, i * 240, 'sine', 0.05, 420); }); },
    hum: function () { tone(110, 0.8, 0, 'sine', 0.05, 140); tone(220, 0.8, 0, 'sine', 0.02); },
    magic: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.2, i * 90, 'triangle', 0.035); }); },
    blub: function () { [0, 1, 2].forEach(function (i) { tone(300 + i * 60, 0.12, i * 220, 'sine', 0.05, 600); }); },
    ninja: function () { noise(0.15, 0, 0.15, 2500, 'highpass'); noise(0.15, 600, 0.15, 2500, 'highpass'); },
    wind: function () { noise(0.8, 0, 0.12, 600, 'bandpass'); tone(300, 0.8, 0, 'sine', 0.02, 700); },
    pat: function () { [0, 1, 2, 3].forEach(function (i) { noise(0.04, i * 160, 0.12, 900, 'lowpass'); }); },
    spooky: function () { tone(440, 0.8, 0, 'sine', 0.04, 330); },
    clack: function () { [0, 1, 2, 3].forEach(function (i) { noise(0.03, i * 170, 0.12, 3000, 'bandpass'); }); },
    stomp: function () { [0, 1, 2, 3].forEach(function (i) { tone(60, 0.3, i * 450, 'sine', 0.15, 38); noise(0.15, i * 450, 0.12, 300, 'lowpass'); }); },
    slow: function () { tone(220, 0.8, 0, 'triangle', 0.04, 200); },
    dig: function () { [0, 1, 2].forEach(function (i) { noise(0.12, i * 230, 0.12, 500, 'lowpass'); }); },
    waddle: function () { [0, 1, 2, 3].forEach(function (i) { tone(i % 2 ? 150 : 170, 0.06, i * 190, 'sine', 0.04); }); },
    robot: function () { [0, 1, 2, 3].forEach(function (i) { tone(i % 2 ? 330 : 440, 0.08, i * 200, 'sine', 0.035); }); },
    buzz: function () { tone(210, 0.8, 0, 'triangle', 0.03, 240); },
    hooves: function () { [0, 1, 2, 3].forEach(function (i) { noise(0.05, i * 190, 0.12, 700, 'lowpass'); }); },
    slide: function () { noise(0.7, 200, 0.08, 2000, 'bandpass'); tone(700, 0.6, 200, 'sine', 0.025, 300); },
  };
  var CLAIM_SND = {
    none: function () {},
    stamp: function () { noise(0.12, 0, 0.15, 500, 'lowpass'); tone(90, 0.25, 0, 'sine', 0.05, 55); },
    gavel: function () { noise(0.05, 400, 0.15, 1500, 'bandpass'); tone(300, 0.12, 400, 'triangle', 0.05); },
    dip: function () { noise(0.3, 0, 0.12, 900, 'bandpass'); tone(400, 0.2, 0, 'sine', 0.04, 180); },
    snap: function () { [0, 600].forEach(function (d) { noise(0.04, d, 0.15, 3000, 'bandpass'); tone(900, 0.05, d, 'triangle', 0.04); }); },
    lick: function () { noise(0.3, 0, 0.12, 1500, 'bandpass'); noise(0.3, 450, 0.12, 1500, 'bandpass'); },
    sparkle: function () { [1047, 1319, 1568].forEach(function (f, i) { tone(f, 0.25, i * 90, 'sine', 0.03); }); noise(0.3, 450, 0.08, 2000, 'lowpass'); },
    splat: function () { noise(0.2, 0, 0.15, 700, 'lowpass'); tone(200, 0.18, 0, 'sine', 0.05, 70); },
    sticker: function () { noise(0.06, 0, 0.15, 2500, 'bandpass'); tone(150, 0.1, 0, 'sine', 0.05); },
    sit: function () { tone(200, 0.3, 0, 'sine', 0.05, 90); noise(0.2, 0, 0.1, 500, 'lowpass'); },
    gulp: function () { tone(220, 0.25, 0, 'sine', 0.05, 110); },
    swirl: function () { tone(300, 0.7, 0, 'sine', 0.035, 900); noise(0.7, 0, 0.08, 1200, 'bandpass'); },
    iron: function () { noise(0.7, 0, 0.1, 6000, 'highpass'); tone(90, 0.2, 0, 'sine', 0.05, 50); },
    trail: function () { tone(180, 0.8, 0, 'triangle', 0.035, 160); },
    sign: function () { noise(0.7, 0, 0.06, 4000, 'bandpass'); },
    cloche: function () { noise(0.05, 50, 0.1, 2400, 'bandpass'); tone(1568, 0.6, 800, 'sine', 0.03); },
    tag: function () { noise(0.05, 0, 0.1, 2500, 'bandpass'); tone(700, 0.08, 0, 'triangle', 0.03); },
    peck: function () { [0, 1, 2].forEach(function (i) { noise(0.03, i * 350, 0.15, 2500, 'bandpass'); }); },
    wipe: function () { noise(0.8, 0, 0.06, 1500, 'bandpass'); },
  };

  /* ── Paths: entrances ── */
  function entry(from, B, W, H, rnd) {
    var jit = (rnd() - 0.5) * 60;
    switch (from) {
      case 'left': return { x: -100, y: B.y + jit };
      case 'right': return { x: W + 100, y: B.y + jit };
      case 'top': return { x: B.x + jit, y: -120 };
      case 'bottom': return { x: B.x + jit, y: H + 120 };
      case 'topleft': return { x: -100, y: -100 };
      default: return { x: W + 100, y: -100 };   // topright
    }
  }
  // Each mover: f(u) -> {x, y, r, sx, sy, o} for u in 0..1 from A to B
  var MOVERS = {
    glide: function (A, B) { return function (u) { var e = ease(u); return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e) + Math.sin(u * Math.PI * 3) * 5 }; }; },
    hop: function (A, B) { var n = 4; return function (u) { var e = u, ph = (e * n) % 1, h = Math.sin(ph * Math.PI); return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e) - h * 70, sy: ph < 0.08 || ph > 0.92 ? 0.8 : 1.05, sx: ph < 0.08 || ph > 0.92 ? 1.15 : 0.96 }; }; },
    zigzag: function (A, B) { return function (u) { var e = ease(u), w = Math.sin(u * Math.PI * 7) * 55 * (1 - u * 0.7); return { x: lerp(A.x, B.x, e) + w * 0.4, y: lerp(A.y, B.y, e) + w, r: Math.cos(u * Math.PI * 7) * 14 }; }; },
    swoop: function (A, B) { var cx = lerp(A.x, B.x, 0.35), cy = B.y + 160; return function (u) { var e = easeOut(u), x = (1 - e) * (1 - e) * A.x + 2 * (1 - e) * e * cx + e * e * B.x, y = (1 - e) * (1 - e) * A.y + 2 * (1 - e) * e * cy + e * e * B.y; return { x: x, y: y, r: (1 - u) * (B.x > A.x ? 25 : -25) }; }; },
    tiptoe: function (A, B) { var n = 6; return function (u) { var k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k, p = (k + ease(clamp(f * 1.6, 0, 1))) / n; return { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p) - Math.abs(Math.sin(f * Math.PI)) * 12, r: Math.sin(f * Math.PI * 2) * 6, sy: 1 + Math.sin(f * Math.PI) * 0.06 }; }; },
    drift: function (A, B) { return function (u) { var e = ease(u); return { x: lerp(A.x, B.x, e) + Math.sin(u * Math.PI * 2) * 40, y: lerp(A.y, B.y, e) + Math.sin(u * Math.PI * 4) * 12, o: clamp(u * 3, 0, 1), r: Math.sin(u * Math.PI * 4) * 6 }; }; },
    zoom: function (A, B) { return function (u) { var e = u < 0.62 ? 0 : easeOut((u - 0.62) / 0.38); return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), sx: e > 0 && e < 0.9 ? 1.5 : 1, sy: e > 0 && e < 0.9 ? 0.75 : 1, r: e > 0 && e < 0.9 ? (B.x > A.x ? 45 : -45) : 0 }; }; },
    crawl: function (A, B) { return function (u) { return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), r: Math.sin(u * Math.PI * 16) * 7 }; }; },
    spin: function (A, B) { return function (u) { var e = ease(u), rr = 70 * (1 - e); return { x: lerp(A.x, B.x, e) + Math.cos(u * Math.PI * 6) * rr, y: lerp(A.y, B.y, e) + Math.sin(u * Math.PI * 6) * rr * 0.5, r: Math.sin(u * Math.PI * 12) * 12, sx: 1 + Math.sin(u * Math.PI * 12) * 0.15 }; }; },
    stomp: function (A, B) { var n = 4; return function (u) { var ph = (u * n) % 1, h = Math.sin(ph * Math.PI); return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u) - h * 28, r: (ph < 0.5 ? -1 : 1) * 6, sy: ph > 0.9 || ph < 0.05 ? 0.88 : 1 }; }; },
    march: function (A, B) { var n = 6; return function (u) { var k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k, p = (k + clamp(f * 2, 0, 1)) / n; return { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p) - (f < 0.5 ? Math.sin(f * 2 * Math.PI) * 8 : 0), r: f < 0.5 ? 0 : (k % 2 ? 4 : -4) }; }; },
    rise: function (A, B) { return function (u) { var e = easeOut(u); return { x: lerp(A.x, B.x, e) + Math.sin(u * Math.PI * 5) * 18, y: lerp(A.y, B.y, e), r: Math.sin(u * Math.PI * 5) * 10 }; }; },
    swing: function (A, B, W) { var py = -260, len = B.y - py; return function (u) { var a = (-70 * (1 - easeOut(u))) + Math.sin(u * Math.PI * 3) * 14 * (1 - u); var rad = a * Math.PI / 180; return { x: B.x + Math.sin(rad) * len, y: py + Math.cos(rad) * len, r: a }; }; },
    slide: function (A, B) { return function (u) { var e = u < 0.82 ? easeIn(u / 0.82) * 1.06 : 1.06 - 0.06 * ease((u - 0.82) / 0.18); return { x: lerp(A.x, B.x, e), y: B.y + 18 - (u > 0.82 ? 18 * ease((u - 0.82) / 0.18) : 0), r: u < 0.82 ? (B.x > A.x ? 80 : -80) : (B.x > A.x ? 80 : -80) * (1 - ease((u - 0.82) / 0.18)) }; }; },
    teleport: null,   // special-cased: blinks between spots
  };

  /* ── The show ── */
  function play(wait, opt) {
    var st = state.steal, o = document.getElementById('stealshow'), act = ACTS[st.act];
    if (!act) return window.ccClaw ? window.ccClaw.play(wait, opt) : 0;
    (window._ssT || []).forEach(clearTimeout); window._ssT = [];
    var startAt = performance.now() + Math.max(0, wait);
    var T = function (fn, ms) { window._ssT.push(setTimeout(fn, Math.max(0, startAt + ms - performance.now()))); };
    var close = function () { (window._ssT || []).forEach(clearTimeout); window._ssT = []; o.classList.remove('on', 'out', 'quick'); o.innerHTML = ''; };
    o.innerHTML = ''; o.classList.remove('out', 'quick'); o.classList.add('on');
    o.onclick = function () { close(); if (window._answerGo) window._answerGo(); };
    build(o, st, act);
    try { choreograph(o, st, act, startAt, T); } catch (e) { console.error('heist', e); var sg = o.querySelector('#st-stage'); if (sg) sg.style.visibility = ''; }
    T(function () { o.classList.add('out'); }, L - 450);
    T(close, L);
    return Math.max(0, wait) + L;
  }

  function build(o, st, act) {
    var K = kit(), bets = state.bets || [], targets = (state.openCaptions || []).map(function (_, i) { return i; }).concat(['closed']);
    var rows = targets.map(function (t) {
      var chips = [];
      bets.forEach(function (b, bi) {
        if (b.target === 'pass' || String(b.target) !== String(t)) return;
        var n = b.count + (b.stolen || 0);
        for (var k = 0; k < n; k++) chips.push(chipHtml(b.playerId, 'lg', '', 'data-st="' + (bi === st.betIndex && k === n - 1 ? 'victim' : 'other') + '"'));
      });
      return '<div class="st-row"><span class="st-lbl">' + (t === 'closed' ? '<span class="cc-badge">CC</span>' : t + 1) + '</span><div class="st-chips">' + (chips.join('') || '<span class="st-none">no chips</span>') + '</div></div>';
    }).join('');
    var me = state.isDealer, dealer = me ? 'You' : esc(state.dealerName), isVictim = st.victimId === myPlayerId;
    var name = esc(st.actName || 'The Thief');
    var head = isVictim ? 'Your chip.' : dealer + ' stole ' + esc(nameOf(st.victimId)) + '’s chip';
    var dc = K.colourOf && K.dealerId ? K.colourOf(K.dealerId()) : '#E8453A';
    var fxN = 8, fx = ''; for (var i = 0; i < fxN; i++) fx += '<span></span>';
    o.innerHTML = '<div class="st-stage" id="st-stage" style="visibility:hidden;--dc:' + dc + '">' +
      '<div class="st-head" id="st-head"><p class="st-eyebrow">' + (me ? 'You send in' : dealer + ' sends in') + '</p><p class="h2 st-title">' + name + '</p><p class="st-tagline">' + esc(act.tag) + '</p></div>' +
      '<div class="st-rail"><div class="st-felt">' + rows + '</div></div>' +
      '<div class="hz-spot" id="hz-spot"></div>' +
      '<div class="hz-layer" id="hz-shadow-l"><div class="hz-shadow"></div></div>' +
      '<div class="hz-layer hz-beam ' + (act.beam || '') + '" id="hz-beam"><i></i></div>' +
      '<div class="hz-line ' + (act.line || 'tongue') + '" id="hz-line"></div>' +
      '<div class="hz-line laser" id="hz-laser"></div>' +
      '<div class="hz-layer hz-held" id="hz-held"><div class="hz-chipw" id="hz-chipw"></div></div>' +
      '<div class="hz-layer hz-thief" id="hz-thief"><div class="hz-face" style="--sz:' + (act.size || 84) + 'px">' + thiefHtml(st.act, act) + '</div></div>' +
      '<div class="hz-layer hz-prop" id="hz-prop"><span>' + propHtml(act.prop, 60) + '</span></div>' +
      '<div class="hz-layer" id="hz-fxl" style="z-index:7"><i class="hz-ring" id="hz-ring"></i><i class="hz-loop" id="hz-loop"></i>' +
        '<svg class="hz-splat" id="hz-splat" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8 C46 20 52 10 56 22 C66 18 64 30 72 34 C64 40 74 48 64 52 C68 62 56 60 52 70 C46 62 40 74 34 66 C26 72 24 60 16 60 C20 50 8 46 16 38 C8 32 18 24 24 26 C24 14 34 18 40 8 Z" fill="' + dc + '" stroke="#1F1A17" stroke-width="2.5"/></svg>' +
        '<svg class="hz-sig" id="hz-sig" viewBox="-50 -50 100 100" aria-hidden="true"><path d="M-38 6 C-30 -14 -24 18 -16 -2 C-10 -16 -6 12 2 -4 C8 -14 12 10 18 0 C24 -8 28 4 38 -2" fill="none" stroke="#1F1A17" stroke-width="4" stroke-linecap="round" stroke-dasharray="200" stroke-dashoffset="200"/></svg>' +
        '<i class="hz-cloud" id="hz-c1"></i><i class="hz-cloud" id="hz-c2"></i><i class="hz-cloud" id="hz-c3"></i><i class="hz-cloud" id="hz-c4"></i></div>' +
      '<div class="hz-fx" id="hz-fx">' + fx + '</div>' +
      '<div class="st-veil" id="st-veil"></div>' +
      '<div class="st-gloat" id="st-gloat">' +
        '<p class="st-g-eye">' + name + ' strikes</p><p class="st-g-head">' + head + '</p>' +
        '<p class="st-quote">“' + esc(st.gloat || 'Mine now.') + '”</p>' +
      '</div>' +
      '</div>';
  }

  function choreograph(o, st, act, startAt, T) {
    var $q = function (s) { return o.querySelector(s); };
    var K = kit(), stage = $q('#st-stage'), thief = $q('#hz-thief'), held = $q('#hz-held'), chipw = $q('#hz-chipw'), prop = $q('#hz-prop'), line = $q('#hz-line'), laser = $q('#hz-laser');
    var beam = $q('#hz-beam'), fxl = $q('#hz-fxl'), ring = $q('#hz-ring'), loop = $q('#hz-loop'), splat = $q('#hz-splat'), spot = $q('#hz-spot'), shadowL = $q('#hz-shadow-l');
    var head = $q('#st-head'), veil = $q('#st-veil'), gl = $q('#st-gloat');
    var victim = $q('[data-st="victim"]'), isVictim = st.victimId === myPlayerId;
    var W = o.clientWidth || innerWidth, H = o.clientHeight || innerHeight;
    var lag = Math.max(0, performance.now() - startAt);
    var rnd = seeded((st.seed || 7) + st.act * 131);
    var beat = function (n) { if (window.ccBeat) window.ccBeat(n); };
    var S = function (ms, fn) { T(function () { big(fn); }, ms); };
    var c = function (el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    var dId = K.dealerId ? K.dealerId() : null;
    var dChip = dId ? chipHtml(dId, 'lg') : (victim ? victim.outerHTML : '');
    var paintInPlace = function () {
      if (!victim || !dId) return;
      victim.insertAdjacentHTML('beforeend', chipHtml(dId, 'lg st-over painted', K.DRIP || ''));
      var ov = victim.lastElementChild; if (ov) ov.removeAttribute('title');
    };
    if (victim) chipw.innerHTML = victim.outerHTML.replace('data-st="victim"', '') + '<span class="hz-coat" id="hz-coat">' + dChip + '</span>';
    var coat = $q('#hz-coat');

    var anim = function (el, kf, ms, at, easing, extra) {
      if (!el) return null;
      var opts = { duration: ms, delay: at, easing: easing || 'linear', fill: 'both' };
      for (var k in extra || {}) opts[k] = extra[k];
      try {
        var a = el.animate(kf, opts);
        try { if (document.timeline && document.timeline.currentTime != null) a.startTime = startAt; } catch (e) { a.currentTime = lag; }
        return a;
      } catch (e) { return null; }
    };
    var whole = function (el, pts, frame) {
      if (!el || !pts.length) return null;
      pts.sort(function (a, b) { return a.t - b.t; });
      var out = pts.map(function (p) { var f = frame(p); f.offset = clamp(p.t / L, 0, 1); f.easing = p.e || 'linear'; return f; });
      for (var i = 1; i < out.length; i++) if (out[i].offset < out[i - 1].offset) out[i].offset = out[i - 1].offset;
      if (out[0].offset > 0) out.unshift(Object.assign({}, out[0], { offset: 0 }));
      if (out[out.length - 1].offset < 1) out.push(Object.assign({}, out[out.length - 1], { offset: 1, easing: 'linear' }));
      return anim(el, out, L, 0);
    };

    var V = victim ? c(victim) : { x: W / 2, y: H / 2 };
    var rows = [].slice.call(o.querySelectorAll('.st-row')), top = rows.length ? c(rows[0]) : V;
    var C = { x: W / 2, y: clamp(top.y - 150, 150, H * 0.42) };   // the spotlight, above the felt
    var KC = 1.75;                                                 // the chip, held up close
    var side = V.x < W / 2 ? 1 : -1;                              // which side of the chip the thief stands on during the claim
    var reduced = K.reduced ? K.reduced() : false;

    if (reduced) {
      // Reduce Motion: no thief, no flight. The table; the doomed chip glows; it fades into the dealer's;
      // the gloat card fades in and holds until the show's end (the server paces the next step anyway).
      [thief, held, prop, line, laser, beam, fxl, spot, shadowL].forEach(function (el) { if (el) el.style.display = 'none'; });
      var fade = function (el, ms) { if (el) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms || 400, fill: 'forwards', easing: 'ease-out' }); };
      T(function () { stage.style.visibility = ''; beat('steal:full'); if (victim) victim.classList.add('st-doomed'); }, 0);
      T(function () { beat('steal:snatch'); big(CLAIM_SND.stamp); buzz(isVictim ? [120, 40, 200] : 40); }, 700);
      T(function () { beat('steal:paint'); paintInPlace(); if (victim) fade(victim.lastElementChild, 500); big(CLAIM_SND[act.csnd || act.claim] || CLAIM_SND.stamp); }, 900);
      T(function () { beat('steal:set'); if (victim) victim.classList.remove('st-doomed'); }, 1500);
      T(function () { beat('steal:gloat'); head.style.opacity = '0'; fade(veil, 400); fade(gl, 400); big(K.SND ? K.SND.gloat : function () {}); if (isVictim) buzz([300, 100, 300]); }, 1700);
      return;
    }

    /* ── Particles: a few specks of ink in the dealer's colour (no emoji confetti; the colour change is the payoff) ── */
    var fxPool = [].slice.call(o.querySelectorAll('#hz-fx span')), fxI = 0;
    function puff(x, y, list, n, spread, dur, rise) {
      n = Math.min(n, 4);
      for (var i = 0; i < n; i++) {
        var el = fxPool[fxI++ % fxPool.length]; if (!el) return;
        var a = rnd() * Math.PI * 2, d = spread * 0.5 * (0.5 + rnd()), dx = Math.cos(a) * d, dy = Math.sin(a) * d - (rise || 0) * 0.4, s = 0.6 + rnd() * 0.6;
        try { el.getAnimations().forEach(function (q) { q.cancel(); }); } catch (e) {}
        el.animate([{ transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(.4)', opacity: 0 }, { opacity: 0.9, offset: 0.15 }, { opacity: 0.8, offset: 0.7 },
          { transform: 'translate3d(' + (x + dx).toFixed(1) + 'px,' + (y + dy).toFixed(1) + 'px,0) scale(' + s.toFixed(2) + ')', opacity: 0 }], { duration: Math.min(dur, 700), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      }
    }
    var fx0 = ['.'];
    var coatOn = function (at, ms) { anim(coat, [{ opacity: 0 }, { opacity: 1 }], ms || 1, at, 'ease-in-out'); };
    var propAt = function (pts, sz) {   // prop path {t, x, y, r, s, o}
      whole(prop, pts, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + (p.r || 0) + 'deg) scale(' + (p.s == null ? 1 : p.s) + ')', opacity: p.o == null ? 1 : p.o }; });
    };
    var ringAt = function (at, x, y, scale) {
      anim(ring, [{ opacity: 0.95, transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(.4)' }, { opacity: 0, transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + (scale || 2) + ')' }], 520, at, 'ease-out', { fill: 'none' });
    };
    // Photosensitivity: the screen flashes once per heist (the snatch). Claim impacts light up the chip instead.
    var glow = function (at, k) { anim(chipw, [{ filter: 'brightness(' + (k || 1.7) + ') saturate(1.3)' }, { filter: 'none' }], 320, at, 'ease-out', { fill: 'none' }); };
    var impact = function (at, strong) { glow(at, strong ? 1.9 : 1.5); T(function () { if (window.ccImpact) window.ccImpact({ flash: false, shake: strong ? stage : false }); buzz(isVictim ? [80, 30, 120] : 30); }, at); };
    var clipReveal = function (at, ms, dir) {   // the dealer's colour wipes across the chip
      var from = dir === 'down' ? 'inset(0 0 100% 0)' : dir === 'left' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      coat.style.opacity = '1';
      anim(coat, [{ clipPath: from, WebkitClipPath: from }, { clipPath: 'inset(0 0 0 0)', WebkitClipPath: 'inset(0 0 0 0)' }], ms, at, 'ease-in-out');
    };

    /* ── Where the thief stands for the grab ── */
    var grab = act.grab, mouth = { x: 0, y: -(act.size || 84) * 0.12 };   // the line leaves from about the middle of the face
    var Gp;   // the thief's position when the grab starts
    if (grab === 'carry') Gp = { x: V.x, y: V.y - 44 };
    else if (grab === 'beam' || grab === 'levitate') Gp = { x: clamp(V.x, 70, W - 70), y: Math.max(80, V.y - 170) };
    else if (act.from === 'top') Gp = { x: clamp(V.x + 30, 60, W - 60), y: Math.max(70, V.y - 230) };
    else if (act.from === 'bottom') Gp = { x: clamp(V.x + side * 20, 60, W - 60), y: Math.min(H - 70, V.y + 190) };
    else { var sd = act.from === 'left' || act.from === 'topleft' ? -1 : 1; Gp = { x: clamp(V.x + sd * 135, 55, W - 55), y: V.y - 20 }; }
    var A = entry(act.from, Gp, W, H, rnd);
    var flipOf = function (dx) { return act.noFlip || !dx ? 1 : (dx > 0 ? -1 : 1); };   // every thief is drawn facing left
    var face = flipOf(Gp.x - A.x);

    /* ── The thief's path TP and the chip's path HP: {t, x, y, r, sx, sy, o} ── */
    var TP = [], HP = [];
    var tp = function (t, x, y, extra) { var p = { t: t, x: x, y: y, r: 0, sx: 1, sy: 1, o: 1, f: face }; for (var k in extra || {}) p[k] = extra[k]; TP.push(p); return p; };
    var hp = function (t, x, y, k, extra) { var p = { t: t, x: x, y: y, k: k || 1, r: 0, o: 1 }; for (var q in extra || {}) p[q] = extra[q]; HP.push(p); return p; };
    var sample = function (t0, t1, fn, step) { for (var t = t0; t <= t1 + 0.1; t += step || 50) { var u = clamp((t - t0) / (t1 - t0), 0, 1), q = fn(u); tp(Math.min(t, t1), q.x, q.y, { r: q.r || 0, sx: q.sx || 1, sy: q.sy || 1, o: q.o == null ? 1 : q.o, f: q.f || face }); } };

    // 1. Entrance
    tp(0, A.x, A.y, { o: act.move === 'drift' ? 0 : 1 });
    if (act.move === 'teleport') {
      var spots = [{ x: W * (0.2 + rnd() * 0.2), y: top.y + 30 + rnd() * 80 }, { x: W * (0.6 + rnd() * 0.2), y: Math.max(120, top.y - 60) }, Gp];
      tp(TM.enter0, A.x, A.y, { o: 0, sx: 0, sy: 0 });
      spots.forEach(function (p, i) {
        var t0 = TM.enter0 + i * 600;
        tp(t0, p.x, p.y, { o: 0, sx: 0.1, sy: 0.1, e: 'cubic-bezier(.2,1.6,.4,1)' });
        tp(t0 + 180, p.x, p.y, { o: 1, sx: 1, sy: 1 });
        if (i < 2) { tp(t0 + 430, p.x, p.y, { o: 1, sx: 1, sy: 1, e: 'ease-in' }); tp(t0 + 560, p.x, p.y, { o: 0, sx: 0.1, sy: 1.6 }); }
        T(function () { puff(p.x, p.y, fx0, 3, 40, 500, 0); }, t0);
      });
      tp(TM.enter1, Gp.x, Gp.y);
    } else {
      sample(TM.enter0, TM.enter1, MOVERS[act.move] ? MOVERS[act.move](A, Gp, W) : MOVERS.glide(A, Gp), 50);
    }
    if (act.move === 'stomp') [0, 1, 2, 3].forEach(function (i) { T(function () { if (window.ccImpact) window.ccImpact({ flash: 0, shake: stage }); }, TM.enter0 + (i + 1) * (TM.enter1 - TM.enter0) / 4 - 20); });

    // 2. The grab, then carry to the spotlight
    var claimPos = act.claim === 'sit' ? { x: C.x, y: C.y - 30 } : act.claim === 'trail' ? { x: C.x - 80, y: C.y - 6 } : { x: C.x + side * 105, y: C.y - 30 };
    var carryOff = { x: 0, y: 40 };   // the chip, just under the thief while carried
    hp(0, V.x, V.y, 1, { o: 0 });
    hp(TM.grab - 1, V.x, V.y, 1, { o: 0 });
    if (grab === 'carry') {
      tp(TM.enter1 + 60, Gp.x, Gp.y - 10, { e: 'cubic-bezier(.6,0,.9,.5)' });
      tp(TM.grab, V.x, V.y - 36, { sy: 0.88, sx: 1.08, e: 'ease-out' });                       // pounce
      tp(TM.grab + 120, V.x, V.y - 44, { e: 'cubic-bezier(.3,0,.2,1.1)' });
      hp(TM.grab, V.x, V.y, 1); hp(TM.grab + 120, V.x, V.y - 44 + carryOff.y, 1.05, { e: 'cubic-bezier(.3,0,.2,1.1)' });
      var midT = (TM.grab + 120 + TM.atC) / 2, mx = lerp(V.x, C.x, 0.5), my = Math.min(V.y, C.y) - 50;
      tp(midT, mx, my - carryOff.y, { f: flipOf(C.x - V.x), r: (C.x - V.x) > 0 ? 8 : -8 });
      hp(midT, mx, my, 1.35, { r: (C.x - V.x) > 0 ? -10 : 10 });
      tp(TM.atC, C.x, C.y - carryOff.y - 20, { f: flipOf(C.x - V.x) });
      hp(TM.atC, C.x, C.y, KC, { e: 'cubic-bezier(.3,0,.3,1.2)' });
    } else if (grab === 'line') {
      // the line shoots out to the chip, then reels it in
      var Mo = { x: Gp.x + mouth.x, y: Gp.y + mouth.y };
      tp(TM.grab + 80, Gp.x, Gp.y, { sx: 1.08, sy: 0.92 });
      var reelEnd = TM.grab + 520, held0 = { x: Gp.x, y: Gp.y + 34 };
      hp(TM.grab, V.x, V.y, 1);
      hp(reelEnd, held0.x, held0.y, 1.1, { e: 'cubic-bezier(.5,0,.3,1)' });
      // the line: from the thief's mouth to the chip; out (enter1→grab), reel (grab→reelEnd)
      var LP = [], lp = function (t, x2, y2, op) { var dx = x2 - Mo.x, dy = y2 - Mo.y; LP.push({ t: t, x: Mo.x, y: Mo.y, a: Math.atan2(dy, dx) * 180 / Math.PI, len: Math.max(1, Math.hypot(dx, dy)), o: op }); };
      lp(0, V.x, V.y, 0); lp(TM.enter1 - 1, Mo.x + 1, Mo.y, 0);
      for (var t = TM.enter1; t <= TM.grab; t += 40) { var u = (t - TM.enter1) / (TM.grab - TM.enter1), e = easeOut(u); lp(t, lerp(Mo.x, V.x, e), lerp(Mo.y, V.y, e), 1); }
      for (t = TM.grab; t <= reelEnd; t += 40) { var u2 = (t - TM.grab) / (reelEnd - TM.grab), e2 = ease(u2); lp(t, lerp(V.x, held0.x, e2), lerp(V.y, held0.y, e2), 1); }
      lp(reelEnd + 60, held0.x, held0.y, 0);
      whole(line, LP, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + p.a.toFixed(2) + 'deg) scaleX(' + (p.len / 100).toFixed(3) + ')', opacity: p.o }; });
      if (act.line === 'lasso') {   // a loop drops over the chip
        anim(loop, [{ opacity: 0, transform: 'translate3d(' + V.x + 'px,' + (V.y - 50) + 'px,0) scale(1.6)' }, { opacity: 1, transform: 'translate3d(' + V.x + 'px,' + V.y + 'px,0) scale(.85)' }], 260, TM.grab - 260, 'ease-in');
        anim(loop, [{ opacity: 1, transform: 'translate3d(' + V.x + 'px,' + V.y + 'px,0) scale(.85)' }, { opacity: 0, transform: 'translate3d(' + held0.x + 'px,' + held0.y + 'px,0) scale(.6)' }], 520, TM.grab, 'cubic-bezier(.5,0,.3,1)', { fill: 'forwards' });
      }
      var midL = (reelEnd + TM.atC) / 2;
      tp(reelEnd, Gp.x, Gp.y);
      tp(midL, lerp(Gp.x, C.x, 0.5), Math.min(Gp.y, C.y) - 60, { f: flipOf(C.x - Gp.x) });
      tp(TM.atC, C.x, C.y - carryOff.y - 20, { f: flipOf(C.x - Gp.x) });
      hp(midL, lerp(Gp.x, C.x, 0.5), Math.min(Gp.y, C.y) - 60 + 34, 1.4);
      hp(TM.atC, C.x, C.y, KC, { e: 'cubic-bezier(.3,0,.3,1.2)' });
    } else {   // beam / levitate: the chip floats up to the thief
      var under = { x: Gp.x, y: Gp.y + 52 };
      if (grab === 'beam') {
        var bh = Math.max(60, V.y - Gp.y + 20);
        beam.style.setProperty('--bh', bh + 'px');
        anim(beam, [{ opacity: 0, transform: 'translate3d(' + Gp.x + 'px,' + (Gp.y + 20) + 'px,0) scaleY(.2)' }, { opacity: 1, transform: 'translate3d(' + Gp.x + 'px,' + (Gp.y + 20) + 'px,0) scaleY(1)' }], 300, TM.enter1 - 100, 'ease-out');
        anim(beam, [{ opacity: 1 }, { opacity: 0 }], 250, TM.grab + 700, 'ease-in', { fill: 'forwards' });
        T(function () { beam.style.opacity = '0'; }, TM.grab + 950);
      }
      hp(TM.grab, V.x, V.y, 1);
      hp(TM.grab + 180, V.x, V.y - 12, 1.05, { r: -8 });
      hp(TM.grab + 420, lerp(V.x, under.x, 0.5), lerp(V.y, under.y, 0.5), 1.15, { r: 10 });
      hp(TM.grab + 700, under.x, under.y, 1.2, { r: -4, e: 'ease-out' });
      tp(TM.grab + 700, Gp.x, Gp.y);
      var midB = (TM.grab + 700 + TM.atC) / 2;
      tp(midB, lerp(Gp.x, C.x, 0.5), Math.min(Gp.y, C.y - 52) - 20, { f: flipOf(C.x - Gp.x) });
      tp(TM.atC, C.x, C.y - 70, { f: flipOf(C.x - Gp.x) });
      hp(midB, lerp(Gp.x, C.x, 0.5), Math.min(Gp.y, C.y - 52) + 32, 1.4);
      hp(TM.atC, C.x, C.y, KC, { e: 'cubic-bezier(.3,0,.3,1.2)' });
      for (var sp = 0; sp < 6; sp++) T((function (k) { return function () { puff(lerp(V.x, under.x, k / 6), lerp(V.y, under.y, k / 6), fx0, 1, 30, 600, 0); }; })(sp), TM.grab + sp * 110);
    }

    // 3. The claim: the thief steps aside (or sits on it, or crawls across it); the chip becomes the dealer's
    var cf = act.claim === 'trail' ? flipOf(1) : flipOf(C.x - claimPos.x);
    tp(TM.claim0, claimPos.x, claimPos.y, { f: cf, e: 'cubic-bezier(.3,0,.3,1.2)' });
    hp(TM.claim0, C.x, C.y, KC);
    hp(TM.claim1, C.x, C.y, KC);
    claim(act.claim);
    tp(TM.claim1, act.claim === 'trail' ? C.x + 80 : act.claim === 'sit' ? C.x + side * 100 : claimPos.x, act.claim === 'sit' ? C.y - 50 : claimPos.y, { f: cf });

    // 4. Back to its spot, in the dealer's colour; the thief leaves
    tp(TM.pick, C.x, C.y - carryOff.y - 24, { f: flipOf(V.x - C.x), e: 'ease-in-out' });
    hp(TM.pick, C.x, C.y - 6, KC);
    var midR = (TM.pick + TM.set) / 2;
    tp(midR, lerp(C.x, V.x, 0.5), Math.min(C.y, V.y) - 70, { f: flipOf(V.x - C.x) });
    hp(midR, lerp(C.x, V.x, 0.5), Math.min(C.y, V.y) - 70 + carryOff.y, 1.35);
    tp(TM.set - 20, V.x, V.y - carryOff.y - 4, { e: 'ease-out' });
    hp(TM.set - 20, V.x, V.y + 2, 1, { e: 'ease-out' });
    hp(TM.set, V.x, V.y, 1);
    hp(TM.set + 1, V.x, V.y, 1, { o: 0 });
    tp(TM.set + 80, V.x, V.y - carryOff.y - 20, { sy: 1.06, e: 'ease-in' });
    var ex = act.exit || (act.from === 'left' || act.from === 'topleft' ? 'right' : 'left');
    var X = ex === 'top' ? { x: V.x + (rnd() - 0.5) * 120, y: -160 } : ex === 'bottom' ? { x: V.x, y: H + 160 } : ex === 'right' ? { x: W + 140, y: V.y - 80 } : ex === 'left' ? { x: -140, y: V.y - 80 } : { x: V.x, y: V.y - 70 };
    var xf = flipOf(X.x - V.x);
    if (ex === 'poof' || ex === 'fade') {
      tp(TM.exit1 - 300, V.x, V.y - 80, { f: xf, sx: 1, sy: 1 });
      tp(TM.exit1, V.x, V.y - 90, { f: xf, o: 0, sx: ex === 'poof' ? 0.1 : 1.2, sy: ex === 'poof' ? 0.1 : 1.2 });
      if (ex === 'poof') T(function () { puff(V.x, V.y - 90, fx0, 4, 50, 600, 0); }, TM.exit1 - 250);
    } else {
      tp(TM.set + 250, lerp(V.x, X.x, 0.12), lerp(V.y - 70, X.y, 0.12), { f: xf, e: 'cubic-bezier(.5,0,.8,.4)', r: act.move === 'slide' ? (X.x > V.x ? 80 : -80) : 0 });
      tp(TM.exit1, X.x, X.y, { f: xf, r: act.move === 'slide' ? (X.x > V.x ? 80 : -80) : 0 });
    }

    // Run the paths
    whole(thief, TP, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + (p.r || 0).toFixed(1) + 'deg) scale(' + ((p.sx || 1) * (p.f || 1)).toFixed(3) + ',' + (p.sy || 1).toFixed(3) + ')', opacity: p.o == null ? 1 : p.o }; });
    whole(held, HP, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + (p.r || 0) + 'deg) scale(' + p.k.toFixed(3) + ')', opacity: p.o }; });
    // a soft shadow under the thief while it's on the felt
    whole(shadowL, TP.map(function (p) { return { t: p.t, x: p.x, y: p.y, o: p.o }; }), function (p) { var near = clamp(1 - Math.abs((V.y + 26) - (p.y + 40)) / 140, 0, 1); return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + (V.y + 30).toFixed(1) + 'px,0)', opacity: (near * (p.o == null ? 1 : p.o) * 0.9).toFixed(2) }; });
    // the spotlight on the claim
    spot.style.background = 'radial-gradient(circle at ' + C.x.toFixed(0) + 'px ' + C.y.toFixed(0) + 'px,rgba(8,5,4,0) 0,rgba(8,5,4,0) 80px,rgba(8,5,4,.55) 190px,rgba(8,5,4,.65) 100%)';
    anim(spot, [{ opacity: 0 }, { opacity: 1 }], 350, TM.atC - 250, 'ease-out');
    anim(spot, [{ opacity: 1 }, { opacity: 0 }], 400, TM.claim1 + 50, 'ease-in', { fill: 'forwards' });
    T(function () { if (spot.parentNode) spot.parentNode.removeChild(spot); }, TM.claim1 + 460);   // #48: gone from the page once it has faded

    function claim(kind) {
      var c0 = TM.claim0, R = 23 * KC, fx = ['.'];
      S(c0 + 300, CLAIM_SND[act.csnd || kind] || CLAIM_SND.stamp);
      switch (kind) {
        case 'stamp': {   // the prop rises high, wobbles… SLAM
          var hit = c0 + 700;
          propAt([{ t: 0, x: C.x, y: C.y - 220, o: 0, s: 0.4 }, { t: c0, x: C.x, y: C.y - 220, o: 0, s: 0.4, e: 'cubic-bezier(.2,1.5,.4,1)' }, { t: c0 + 250, x: C.x, y: C.y - 150, s: 1.6, r: -10 },
            { t: hit - 120, x: C.x, y: C.y - 170, s: 1.7, r: 8, e: 'cubic-bezier(.7,0,1,.6)' }, { t: hit, x: C.x, y: C.y - 6, s: 1.9, r: 0 }, { t: hit + 90, x: C.x, y: C.y - 2, s: 2.1 }, { t: hit + 700, x: C.x, y: C.y - 2, s: 1.9, e: 'ease-in' }, { t: c0 + 1500, x: C.x, y: C.y - 260, s: 1, o: 0 }]);
          coatOn(hit + 20, 1); ringAt(hit, C.x, C.y, 2.6); impact(hit, true);
          T(function () { puff(C.x, C.y, fx, 12, 110, 900, 30); }, hit);
          // "squish" the chip under the stamp
          anim(chipw, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.18,.78)', offset: 0.2 }, { transform: 'scale(.94,1.06)', offset: 0.6 }, { transform: 'scale(1)' }], 500, hit, 'ease-out', { fill: 'none' });
          break;
        }
        case 'dip': {   // into the bucket (or honey, or ice) and back out, dripping
          var by = C.y + 64;
          propAt([{ t: 0, x: C.x, y: by + 40, o: 0, s: 0.2 }, { t: c0, x: C.x, y: by + 40, o: 0, s: 0.2, e: 'cubic-bezier(.2,1.6,.4,1)' }, { t: c0 + 260, x: C.x, y: by, s: 2.0 }, { t: c0 + 1300, x: C.x, y: by, s: 2.0, e: 'ease-in' }, { t: TM.claim1, x: C.x, y: by + 80, s: 0.6, o: 0 }]);
          hp(c0 + 300, C.x, C.y, KC, { e: 'cubic-bezier(.6,0,.9,.6)' }); hp(c0 + 620, C.x, by + 6, KC * 0.8, { o: 1 }); hp(c0 + 640, C.x, by + 10, KC * 0.8, { o: 0 });
          hp(c0 + 900, C.x, by + 10, KC * 0.8, { o: 0 }); hp(c0 + 920, C.x, by + 6, KC * 0.8, { o: 1, e: 'cubic-bezier(.2,1.4,.4,1)' }); hp(c0 + 1250, C.x, C.y, KC, { r: 0 });
          coatOn(c0 + 700, 1);
          T(function () { puff(C.x, by - 24, fx, 10, 70, 800, 60); }, c0 + 620);
          T(function () { puff(C.x, by - 24, fx, 8, 60, 800, 50); }, c0 + 920);
          anim(chipw, [{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(0)' }], 600, c0 + 1250, 'ease-out', { fill: 'none' });
          break;
        }
        case 'lick': {   // a big tongue, two slurps across
          var lx0 = C.x - side * 110, lx1 = C.x + side * 20;
          propAt([{ t: 0, x: lx0, y: C.y, o: 0, s: 0.4 }, { t: c0 + 150, x: lx0, y: C.y + 10, o: 0, s: 0.4 }, { t: c0 + 300, x: lx0, y: C.y + 10, o: 1, s: 1, r: side * 20 },
            { t: c0 + 650, x: lx1, y: C.y - 10, s: 1.1, r: -side * 15, e: 'ease-in-out' }, { t: c0 + 850, x: lx0, y: C.y + 14, s: 1, r: side * 20, e: 'ease-in-out' }, { t: c0 + 1200, x: lx1, y: C.y - 4, s: 1.1, r: -side * 15 },
            { t: c0 + 1400, x: lx0, y: C.y + 20, s: 0.4, o: 0 }]);
          if (prop.firstChild && side < 0) prop.firstChild.style.transform = 'translate(-50%,-50%) scaleX(-1)';
          clipReveal(c0 + 350, 900, side > 0 ? 'right' : 'left');
          T(function () { puff(C.x, C.y, fx, 10, 90, 900, -20); }, c0 + 650);
          T(function () { puff(C.x, C.y, fx, 8, 90, 900, -20); }, c0 + 1200);
          break;
        }
        case 'zap': {   // lightning: three bolts, and the chip flickers between owners, then stays the dealer's
          // Photosensitivity: bolts 400ms apart (never more than 3 a second), and only the chip flickers —
          // no full-screen flash (UFO, Magnet, Mosquito used to strobe the whole screen 4-6 times a second)
          var zs = [c0 + 250, c0 + 650, c0 + 1050];
          var pk = [{ t: 0, x: C.x, y: C.y - 70, o: 0, s: 1.4 }];
          zs.forEach(function (z, i) {
            var ox = (i % 2 ? 1 : -1) * (30 + rnd() * 30);
            pk.push({ t: z - 1, x: C.x + ox, y: C.y - 60, o: 0, s: 1.6 }, { t: z, x: C.x + ox, y: C.y - 50, o: 1, s: 1.9, r: ox > 0 ? 12 : -12 }, { t: z + 160, x: C.x + ox, y: C.y - 50, o: 0, s: 1.9 });
            T(function () { puff(C.x, C.y, fx, 4, 80, 450, 0); }, z);
            glow(z, 1.8);
          });
          propAt(pk);
          // the coat: on with each bolt, half back off between them, on for good with the last
          anim(coat, [{ opacity: 0 }, { opacity: 1, offset: 0.02 }, { opacity: 1, offset: 0.2 }, { opacity: 0.15, offset: 0.3 }, { opacity: 1, offset: 0.5 }, { opacity: 1, offset: 0.7 }, { opacity: 0.25, offset: 0.8 }, { opacity: 1, offset: 1 }], 800, c0 + 250, 'steps(1,end)');
          anim(chipw, [{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(-2px,-1px)' }, { transform: 'translate(0,0)' }], 160, c0 + 250, 'linear', { iterations: 6, fill: 'none' });
          impact(c0 + 1050, true);
          break;
        }
        case 'sparkle': {   // a wave of the wand (or bats, or a rainbow), a poof of smoke, ta-da
          var wx = C.x + side * 70;
          propAt([{ t: 0, x: wx, y: C.y - 70, o: 0, s: 0.4 }, { t: c0 + 100, x: wx, y: C.y - 70, o: 0, s: 0.4, e: 'cubic-bezier(.2,1.5,.4,1)' }, { t: c0 + 350, x: wx, y: C.y - 70, o: 1, s: 1.2, r: -30 },
            { t: c0 + 500, x: wx - side * 10, y: C.y - 80, s: 1.2, r: 25 }, { t: c0 + 650, x: wx, y: C.y - 70, s: 1.2, r: -30 }, { t: c0 + 800, x: wx - side * 10, y: C.y - 84, s: 1.3, r: 30 }, { t: c0 + 1400, x: wx, y: C.y - 90, s: 0.5, o: 0 }]);
          var clouds = ['#hz-c1', '#hz-c2', '#hz-c3', '#hz-c4'].map($q), poof = c0 + 850;
          clouds.forEach(function (cl, i) {
            var sz = 70 + i * 14, ox = [-26, 24, -8, 14][i], oy = [-14, -10, 18, 14][i];
            cl.style.width = cl.style.height = sz + 'px'; cl.style.left = (-sz / 2) + 'px'; cl.style.top = (-sz / 2) + 'px';
            anim(cl, [{ opacity: 0, transform: 'translate3d(' + (C.x + ox) + 'px,' + (C.y + oy) + 'px,0) scale(.2)' }, { opacity: 1, transform: 'translate3d(' + (C.x + ox) + 'px,' + (C.y + oy) + 'px,0) scale(1)', offset: 0.3 },
              { opacity: 1, transform: 'translate3d(' + (C.x + ox * 1.2) + 'px,' + (C.y + oy - 6) + 'px,0) scale(1.08)', offset: 0.6 }, { opacity: 0, transform: 'translate3d(' + (C.x + ox * 2.4) + 'px,' + (C.y + oy - 30) + 'px,0) scale(1.5)' }], 1000, poof + i * 40, 'ease-out');
          });
          coatOn(poof + 300, 1);
          T(function () { puff(C.x, C.y, fx, 16, 130, 1100, 20); }, poof + 450);
          impact(poof + 450, false);
          break;
        }
        case 'splat': {   // something lands on it from above (ink, or… the seagull thing). Then it's the dealer's.
          var land = c0 + 520;
          anim(splat, [{ opacity: 0, transform: 'translate3d(' + C.x + 'px,' + (C.y - 260) + 'px,0) scale(.3,.6)' }, { opacity: 1, transform: 'translate3d(' + C.x + 'px,' + (C.y - 40) + 'px,0) scale(.4,.9)', offset: 0.85 }, { opacity: 1, transform: 'translate3d(' + C.x + 'px,' + C.y + 'px,0) scale(1.05,.95)' }], 380, land - 380, 'cubic-bezier(.6,0,1,.6)');
          anim(splat, [{ opacity: 1, transform: 'translate3d(' + C.x + 'px,' + C.y + 'px,0) scale(1.05,.95)' }, { opacity: 1, transform: 'translate3d(' + C.x + 'px,' + C.y + 'px,0) scale(1)', offset: 0.6 }, { opacity: 0, transform: 'translate3d(' + C.x + 'px,' + C.y + 'px,0) scale(1.4)' }], 900, land + 400, 'ease-in', { fill: 'forwards' });
          coatOn(land + 500, 500);
          T(function () { puff(C.x, C.y, fx, 10, 90, 800, -30); }, land);
          impact(land, false);
          anim(chipw, [{ transform: 'scale(1)' }, { transform: 'scale(1.15,.8)', offset: 0.25 }, { transform: 'scale(1)' }], 400, land, 'ease-out', { fill: 'none' });
          break;
        }
        case 'sticker': {   // a sticker of the dealer's chip, slapped right on top (with a prop sticker for flavour)
          var slap = c0 + 650;
          anim(coat, [{ opacity: 0, transform: 'translate(' + (side * 120) + 'px,-140px) rotate(' + (side * -60) + 'deg) scale(2.2)' }, { opacity: 1, transform: 'translate(0,0) rotate(-6deg) scale(1.15)', offset: 0.8 }, { opacity: 1, transform: 'rotate(-4deg) scale(1)' }], 420, slap - 420, 'cubic-bezier(.5,0,.9,.6)');
          if (act.prop) propAt([{ t: 0, x: C.x + R * 0.7, y: C.y - R * 0.7, o: 0, s: 2.4 }, { t: slap + 250, x: C.x + R * 0.7, y: C.y - R * 0.7, o: 0, s: 2.4, r: 30, e: 'cubic-bezier(.5,0,.9,.6)' }, { t: slap + 500, x: C.x + R * 0.75, y: C.y - R * 0.75, o: 1, s: 0.75, r: 18 }, { t: TM.claim1, x: C.x + R * 0.75, y: C.y - R * 0.75, o: 1, s: 0.75, r: 18 }, { t: TM.claim1 + 200, x: C.x + R * 0.75, y: C.y - R * 0.75, o: 0, s: 0.75 }]);
          ringAt(slap, C.x, C.y, 2.2); impact(slap, true);
          T(function () { puff(C.x, C.y, fx, 10, 100, 800, 10); }, slap);
          S(slap + 500, CLAIM_SND.sticker);
          break;
        }
        case 'smooch': {   // three big kisses, each one a little more the dealer's
          var ks = [c0 + 300, c0 + 600, c0 + 900], pts = [{ t: 0, x: C.x, y: C.y, o: 0, s: 0.4 }];
          ks.forEach(function (k, i) {
            var ox = [-14, 16, 0][i], oy = [-10, 4, 14][i];
            pts.push({ t: k - 140, x: C.x + ox, y: C.y + oy - 60, o: 0, s: 2.2, r: (i - 1) * 12, e: 'cubic-bezier(.6,0,.9,.5)' }, { t: k, x: C.x + ox, y: C.y + oy, o: 1, s: 0.9, r: (i - 1) * 12 }, { t: k + 180, x: C.x + ox, y: C.y + oy, o: 0, s: 1.1 });
            T(function () { puff(C.x + ox, C.y + oy, fx, 5, 70, 800, 40); }, k);
          });
          propAt(pts);
          anim(coat, [{ opacity: 0 }, { opacity: 0.35, offset: 0.05 }, { opacity: 0.35, offset: 0.48 }, { opacity: 0.7, offset: 0.52 }, { opacity: 0.7, offset: 0.95 }, { opacity: 1 }], 640, c0 + 300, 'linear');
          impact(c0 + 900, false);
          break;
        }
        case 'sit': {   // the thief sits on it. Wiggles. Gets up. It's the dealer's now. Don't ask.
          var sitAt = c0 + 300;
          tp(sitAt - 120, C.x, C.y - 80, { f: cf, e: 'cubic-bezier(.6,0,.9,.5)' });
          tp(sitAt, C.x, C.y - 18, { f: cf, sy: 0.82, sx: 1.12 });
          tp(sitAt + 200, C.x, C.y - 22, { f: cf, sy: 0.95, sx: 1.03 });
          [0, 1, 2, 3].forEach(function (i) { tp(sitAt + 300 + i * 160, C.x + (i % 2 ? 6 : -6), C.y - 22, { f: cf, r: i % 2 ? 6 : -6 }); });
          tp(sitAt + 1000, C.x, C.y - 22, { f: cf });
          tp(sitAt + 1200, C.x + side * 100, C.y - 50, { f: cf, e: 'cubic-bezier(.2,1.4,.4,1)' });
          coatOn(sitAt + 600, 1);
          T(function () { puff(C.x, C.y - 30, fx, 8, 80, 1000, 50); }, sitAt + 500);
          impact(sitAt, false);
          break;
        }
        case 'swirl': {   // spun so fast the colour comes off and the dealer's goes on
          anim(chipw, [{ transform: 'rotateY(0) rotate(0)' }, { transform: 'rotateY(1440deg) rotate(30deg)' }], 1100, c0 + 200, 'cubic-bezier(.4,0,.2,1)', { fill: 'none' });
          coatOn(c0 + 650, 1);
          for (var w = 0; w < 4; w++) T((function (k) { return function () { puff(C.x, C.y, fx, 4, 90, 700, 0); }; })(w), c0 + 250 + w * 220);
          impact(c0 + 1300, false);
          break;
        }
        case 'iron': {   // pressed hot: smoke, sizzle, the dealer's colour glowing through
          var press = c0 + 450;
          propAt([{ t: 0, x: C.x, y: C.y - 180, o: 0, s: 0.6 }, { t: c0 + 100, x: C.x, y: C.y - 180, o: 0, s: 0.6, e: 'cubic-bezier(.2,1.4,.4,1)' }, { t: c0 + 300, x: C.x, y: C.y - 110, o: 1, s: 1.5 },
            { t: press, x: C.x, y: C.y - 30, s: 1.6, e: 'linear' }, { t: press + 700, x: C.x, y: C.y - 26, s: 1.6, r: 3 }, { t: press + 900, x: C.x, y: C.y - 140, s: 1, o: 0 }]);
          anim(coat, [{ opacity: 0, filter: 'brightness(2) saturate(2)' }, { opacity: 1, filter: 'brightness(1.6) saturate(1.6)', offset: 0.6 }, { opacity: 1, filter: 'none' }], 1100, press, 'ease-in-out');
          for (var p2 = 0; p2 < 5; p2++) T((function (k) { return function () { puff(C.x + (k - 2) * 10, C.y - 10, fx, 3, 30, 1000, 90); }; })(p2), press + p2 * 150);
          impact(press, false);
          break;
        }
        case 'trail': {   // the thief crawls right across it, leaving the dealer's colour behind
          tp(c0, C.x - 80, C.y - 6, { f: flipOf(1) });
          tp(TM.claim1, C.x + 80, C.y - 6, { f: flipOf(1) });
          clipReveal(c0 + 300, 1200, 'right');
          for (var g = 0; g < 4; g++) T((function (k) { return function () { puff(C.x - 40 + k * 26, C.y + 10, fx, 2, 20, 900, -10); }; })(g), c0 + 300 + g * 300);
          break;
        }
        case 'laser': {   // eyes down, laser on, scan top to bottom
          var eye = { x: claimPos.x, y: claimPos.y - 10 }, LZ = [];
          var lz = function (t, y, op) { var dx = C.x - eye.x, dy = y - eye.y; LZ.push({ t: t, a: Math.atan2(dy, dx) * 180 / Math.PI, len: Math.hypot(dx, dy), o: op }); };
          lz(0, C.y - R, 0); lz(c0 + 280, C.y - R, 0); lz(c0 + 300, C.y - R, 1);
          for (var ty = 0; ty <= 4; ty++) lz(c0 + 300 + ty * 250, C.y - R + (2 * R) * (ty / 4), 1);
          lz(c0 + 1320, C.y + R, 0);
          whole(laser, LZ, function (p) { return { transform: 'translate3d(' + eye.x.toFixed(1) + 'px,' + eye.y.toFixed(1) + 'px,0) rotate(' + p.a.toFixed(2) + 'deg) scaleX(' + (p.len / 100).toFixed(3) + ')', opacity: p.o }; });
          clipReveal(c0 + 300, 1000, 'down');
          for (var lzI = 0; lzI < 5; lzI++) T((function (k) { return function () { puff(C.x, C.y - R + (2 * R) * (k / 4), fx, 2, 40, 600, 0); }; })(lzI), c0 + 300 + lzI * 250);
          break;
        }
        case 'sign': {   // the Accountant initials it: a pen scribbles across, and the colour follows the pen
          var s0 = c0 + 250, sig = $q('#hz-sig'), zz = [[-0.85, 0.1], [-0.5, -0.25], [-0.15, 0.2], [0.2, -0.2], [0.55, 0.15], [0.9, -0.05]];
          var pp = [{ t: 0, x: C.x - R, y: C.y - R - 50, o: 0, s: 0.9 }, { t: s0 - 120, x: C.x - R, y: C.y - R - 50, o: 0, s: 0.9, e: 'ease-out' }, { t: s0, x: C.x - R * 0.85 + 16, y: C.y - 22, o: 1, s: 0.9 }];
          zz.forEach(function (q, i) { pp.push({ t: s0 + 130 + i * 130, x: C.x + q[0] * R + 16, y: C.y + q[1] * R - 22, s: 0.9 }); });
          pp.push({ t: s0 + 1000, x: C.x + R + 30, y: C.y - R - 40, s: 0.9, o: 0 });
          propAt(pp);
          if (sig) {
            sig.style.transform = 'translate3d(' + C.x.toFixed(1) + 'px,' + C.y.toFixed(1) + 'px,0)';
            anim(sig, [{ opacity: 0 }, { opacity: 1, offset: 0.01 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], TM.claim1 - s0, s0, 'linear');
            anim(sig.firstChild, [{ strokeDashoffset: 200 }, { strokeDashoffset: 0 }], 800, s0 + 100, 'linear');
          }
          clipReveal(s0 + 100, 800, 'right');
          break;
        }
        case 'cloche': {   // the Butler covers it with a silver dome, a pause, lifts it: it's the dealer's
          var dn = c0 + 350, up = c0 + 1150;
          propAt([{ t: 0, x: C.x, y: C.y - 220, o: 0, s: 2.2 }, { t: c0, x: C.x, y: C.y - 220, o: 0, s: 2.2 }, { t: c0 + 120, x: C.x, y: C.y - 180, o: 1, s: 2.2, e: 'cubic-bezier(.5,0,.8,.6)' },
            { t: dn, x: C.x, y: C.y - 8, s: 2.2 }, { t: up, x: C.x, y: C.y - 8, s: 2.2, e: 'cubic-bezier(.4,0,.2,1)' }, { t: up + 300, x: C.x, y: C.y - 170, s: 2.2 }, { t: TM.claim1, x: C.x, y: C.y - 190, s: 2.2, o: 0 }]);
          coatOn(dn + 300, 1);
          break;
        }
        case 'tag': {   // a luggage tag, tied on, in the dealer's colour
          var hang = c0 + 500, tx = C.x + R * 0.95 + 14, ty = C.y + R * 0.45;
          propAt([{ t: 0, x: tx + 60, y: C.y - 120, o: 0, s: 0.9, r: -30 }, { t: c0 + 100, x: tx + 60, y: C.y - 120, o: 0, s: 0.9, r: -30 }, { t: hang, x: tx, y: ty, o: 1, s: 0.9, r: 14, e: 'cubic-bezier(.3,1.4,.5,1)' },
            { t: hang + 260, x: tx, y: ty, s: 0.9, r: -8 }, { t: hang + 520, x: tx, y: ty, s: 0.9, r: 4 }, { t: TM.claim1 - 1, x: tx, y: ty, s: 0.9, r: 0 }, { t: TM.claim1 + 200, x: tx, y: ty, s: 0.9, o: 0 }]);
          coatOn(hang, 300); glow(hang, 1.4);
          break;
        }
        case 'peck': {   // three small pecks (or stings); each one a little more the dealer's
          [c0 + 300, c0 + 650, c0 + 1000].forEach(function (k) {
            tp(k - 140, claimPos.x, claimPos.y, { f: cf });
            tp(k, C.x + side * 46, C.y - 18, { f: cf, r: -side * 22 });
            tp(k + 140, claimPos.x, claimPos.y, { f: cf });
            glow(k, 1.4);
          });
          anim(coat, [{ opacity: 0 }, { opacity: 0.35, offset: 0.05 }, { opacity: 0.35, offset: 0.48 }, { opacity: 0.7, offset: 0.52 }, { opacity: 0.7, offset: 0.95 }, { opacity: 1 }], 720, c0 + 300, 'linear');
          break;
        }
        case 'wipe': {   // no tools: the Mime mimes painting it; the Vampire drains it. The colour runs down the chip.
          for (var wi = 0; wi < 4; wi++) tp(c0 + 250 + wi * 230, claimPos.x + (wi % 2 ? -side * 12 : 0), claimPos.y + (wi % 2 ? 6 : 0), { f: cf, r: wi % 2 ? -side * 8 : 0 });
          clipReveal(c0 + 250, 900, 'down');
          break;
        }
      }
    }

    // The thief's sound, under its entrance

    S(TM.enter0, MOVE_SND[act.snd] || MOVE_SND.creep);

    /* ── The beats ── */
    T(function () { stage.style.visibility = ''; beat('steal:full'); buzz(30); if (victim) victim.classList.add('st-doomed'); }, 0);
    T(function () { if (victim) victim.animate([{ transform: 'translate(1px,0) rotate(.8deg)' }, { transform: 'translate(-1px,1px) rotate(-.8deg)' }], { duration: 90, iterations: 10, direction: 'alternate' }); }, TM.enter1 - 900);
    T(function () { beat('steal:hover'); head.style.opacity = '.55'; }, TM.enter1 - 300);
    T(function () {   // the snatch
      beat('steal:snatch');
      if (victim) { victim.style.visibility = 'hidden'; victim.classList.remove('st-doomed'); }
      if (window.ccImpact) window.ccImpact({ flash: isVictim ? 0.8 : 0.5, shake: isVictim ? stage : false });
      big(function () { if (K.SND) K.SND.pop(); noise(0.12, 0, 0.15, 1200, 'bandpass'); tone(500, 0.18, 0, 'triangle', 0.05, 900); });
      buzz(isVictim ? [140, 50, 260] : 45);
      head.style.opacity = '0';
    }, TM.grab);
    T(function () { beat('steal:paint'); }, TM.claim0);
    T(function () {   // back in its spot, now the dealer's
      beat('steal:set');
      if (victim) { paintInPlace(); victim.style.visibility = ''; }   // (no flash here: one per heist)
      big(function () { if (K.SND) K.SND.clack(); });
      buzz(isVictim ? [80, 40, 80] : 25);
    }, TM.set);
    anim(veil, [{ opacity: 0 }, { opacity: 1 }], 320, TM.gloat - 60, 'ease-out');
    anim(gl, [{ opacity: 0, transform: 'translateY(-46%) rotate(-1deg)' }, { opacity: 1, transform: 'translateY(-50%) rotate(-1deg)' }], 380, TM.gloat, 'cubic-bezier(.2,.8,.3,1)');
    T(function () {
      beat('steal:gloat');
      big(function () { if (K.SND) K.SND.gloat(); });
      if (isVictim) buzz([200, 100, 300]);
    }, TM.gloat);
  }

  window.ccHeist = { play: play, count: ACTS.length - 1, acts: ACTS, thief: thiefHtml, prop: propHtml };
})();
