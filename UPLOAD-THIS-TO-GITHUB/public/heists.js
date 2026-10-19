/* Closed Caption — THE HEISTS. Eleven thieves, each drawn in the house ink (black line, soft grey wash,
   white paper; the chips are the only colour), each with the same comic beats on the shared clock.
   Index = HEISTS in game.js (same order). A heist plays only on a 'full' steal (the first steal of a game,
   or a steal off the real caption); every other steal is steal.js's short stamp.
   Reads the page's globals at call time: state, myPlayerId, esc, chipHtml, big, buzz, tone, noise; and
   window.ccStealKit (steal.js). CSS prefix: hz-. */

/* ── The cast. viewBox 0 0 120 160, feet on y≈155, every one drawn facing LEFT (mirrored to face right).
      Parts a heist moves are groups: .hz-arm (rotates at the shoulder), .hz-lids, .hz-tail, .hz-bag,
      .hz-throat, .hz-pl/.hz-pr (the claw's prongs). ── */
(function () {
  var INK = '#1F1A17', P = '#FFFDF8', W1 = '#EFEBE4', W2 = '#D9D3C9', W3 = '#B5AEA2', K = '#3A3531', KH = '#6A625A';
  var LW = 2.3;
  function sh(d, fill, shade, w) {   // a shape: fill, wash shading inside it, then the ink line on top
    return '<path d="' + d + '" fill="' + fill + '"/>' + (shade || '') + '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w || LW) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function wash(d, fill, op) { return '<path d="' + d + '" fill="' + (fill || W2) + '"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  function ln(d, w, col, op) { return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (w || 1.5) + '" stroke-linecap="round" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  function limb(d, w, fill) {   // an outlined limb: a wide ink stroke under a narrower fill stroke
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w + 2 * LW) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + fill + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function dot(x, y, r, c) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 1.6) + '" fill="' + (c || INK) + '"/>'; }
  function circ(x, y, r, fill, w) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (w || LW) + '"/>'; }
  function ground(cx, rx) { return '<ellipse cx="' + cx + '" cy="155" rx="' + rx + '" ry="3.6" fill="' + W3 + '" opacity=".45"/>'; }
  function hatch(x0, y0, x1, y1, n, dx, dy, op) {   // a few parallel wash strokes
    var d = ''; for (var i = 0; i < n; i++) { var u = n === 1 ? 0 : i / (n - 1), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; d += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'l' + dx + ' ' + dy; }
    return ln(d, 1.1, INK, op || 0.35);
  }
  // a group that a claim can move: rotates about (ox, oy) in viewBox units
  function part(cls, ox, oy, inner) { return '<g class="' + cls + '" style="transform-box:view-box;transform-origin:' + ox + 'px ' + oy + 'px">' + inner + '</g>'; }

  var C = {};

  /* The Butler: tailcoat, a towel over the arm, eyes half shut in disapproval */
  C.butler =
    ground(60, 24) +
    limb('M66 104 L68 148', 8, K) + limb('M54 104 L51 148', 8, K) +
    sh('M41 152 Q41 145 50 145 L56 146 L56 152 Z', K) + sh('M60 152 Q60 145 68 145 L74 146 L74 152 Z', K) +
    sh('M70 70 C77 86 80 104 85 126 L76 125 L71 106 Z', K, ln('M74 92 L80 120', 1.2, KH)) +
    sh('M44 60 C45 53 74 52 76 60 L75 106 L45 106 Z', K, ln('M70 62 C72 80 72 94 72 104', 1.3, KH)) +
    sh('M51 56 L65 56 L58 88 Z', P, wash('M60 58 L65 56 L58 88 Z', W1)) +
    ln('M51 56 L57 84 M65 56 L59 84', 1.3, KH) + dot(58, 70, 1.1) + dot(58, 77, 1.1) +
    sh('M53 55 L58 58 L53 61 Z M63 55 L58 58 L63 61 Z', INK, '', 1.5) +
    // the back arm, a towel over the forearm
    limb('M71 62 Q76 76 72 88 L63 92', 7.5, K) +
    sh('M57 88 L73 87 L71 104 L66 101 L61 106 L58 101 Z', P, wash('M66 88 L73 87 L71 104 L66 101 Z', W1)) + ln('M60 92 L70 91', 1, INK, .4) +
    // head
    limb('M58 46 L58 54', 7, P) +
    sh('M45 34 C45 20 70 18 71 34 C71 46 63 50 57 50 C50 50 45 44 45 34 Z', P, wash('M64 24 C70 28 71 40 66 47 C63 49 60 50 58 50 C64 44 67 34 64 24 Z', W1)) +
    sh('M66 26 C73 28 74 40 68 45 C68 38 67 31 64 27 Z', W3, '', 1.6) +
    sh('M66 34 C69 33 70 38 66 39', P, '', 1.5) +
    sh('M47 30 C41 35 40 40 45 42 L47 41', P, '', 1.8) +
    ln('M48 27 Q51.5 25.5 55 27', 1.6) + ln('M48.5 28.6 Q51.5 29.6 54.5 28.6', 1.2) + dot(51.6, 29.2, 1.2) +
    ln('M46 22 Q50 19 56 21', 1.6) + ln('M49 46 L54 45.5', 1.5) +
    // the front arm, reaching
    part('hz-arm', 50, 60, limb('M50 61 Q42 72 32 82', 7.5, K) + sh('M30 79 L35 84 L33 86 L28 82 Z', P, '', 1.4) + circ(28, 85, 4.4, P, 1.8));

  /* The Magician: slicked hair, a waxed moustache, cape, white gloves, a wand */
  C.magician =
    ground(60, 26) +
    sh('M38 60 C40 54 80 54 84 62 L94 140 C80 146 66 140 60 132 Z', K, wash('M72 64 L90 136 C84 140 76 140 70 136 Z', '#4A4440')) +
    limb('M66 104 L68 148', 8, K) + limb('M54 104 L51 148', 8, K) +
    sh('M41 152 Q41 145 50 145 L56 146 L56 152 Z', K) + sh('M60 152 Q60 145 68 145 L74 146 L74 152 Z', K) +
    sh('M45 60 C46 54 72 53 74 60 L73 106 L46 106 Z', K, ln('M68 62 C70 80 70 94 70 104', 1.3, KH)) +
    sh('M52 56 L64 56 L58 80 Z', P, wash('M60 58 L64 56 L58 80 Z', W1)) +
    sh('M54 55 L58 58 L54 61 Z M62 55 L58 58 L62 61 Z', INK, '', 1.5) +
    sh('M38 60 C42 52 50 50 56 54 L48 66 Z', K, '', 2) + sh('M80 60 C76 52 68 50 62 54 L70 66 Z', K, '', 2) +
    limb('M58 46 L58 54', 7, P) +
    sh('M45 34 C45 20 70 18 71 34 C71 46 63 50 57 50 C50 50 45 44 45 34 Z', P, wash('M64 24 C70 28 71 40 66 47 C63 49 60 50 58 50 C64 44 67 34 64 24 Z', W1)) +
    sh('M44 30 C44 16 66 13 72 26 C72 30 70 34 70 38 C66 30 58 26 50 28 C47 29 45 30 44 30 Z', K, ln('M50 20 C56 17 64 18 68 22', 1.1, KH)) +
    sh('M66 34 C69 33 70 38 66 39', P, '', 1.5) +
    sh('M47 31 C42 36 42 40 46 41', P, '', 1.8) +
    ln('M48 29 Q51.5 26.5 55 28.5', 1.6) + dot(51.8, 31, 1.5) +
    sh('M40 43 C44 40 48 41 51 43 C54 41 58 41 60 44 C56 46 54 45 51 45 C48 46 44 46 40 43 Z', K, '', 1.4) + ln('M40 43 C38 41 37 39 38 37 M60 44 C62 43 63 41 62 39', 1.4) +
    part('hz-arm', 50, 61, limb('M50 62 Q42 72 34 80', 7.5, K) + circ(31, 82, 4.6, P, 1.8) +
      '<g transform="rotate(-28 31 82)">' + sh('M8 79.5 L32 79.5 L32 84.5 L8 84.5 Z', K, '', 1.6) + sh('M4 79.5 L10 79.5 L10 84.5 L4 84.5 Z', P, '', 1.6) + '</g>');

  /* Grandma: a bun, glasses on a chain, a cardigan, a handbag that has seen things */
  C.grandma =
    ground(60, 24) +
    limb('M56 128 L54 148', 6, P) + limb('M66 128 L67 148', 6, P) +
    sh('M44 152 Q44 146 51 146 L58 147 L58 152 Z', K) + sh('M62 152 Q62 146 69 146 L75 147 L75 152 Z', K) +
    sh('M44 98 L76 98 L82 130 L40 130 Z', W3, hatch(66, 101, 76, 101, 4, 4, 26, .25)) +
    sh('M42 62 C43 55 75 54 78 62 L80 104 L42 104 Z', W2, wash('M68 60 C74 62 76 66 76 72 L78 104 L68 104 Z', W3, .7)) +
    ln('M60 58 L60 104', 1.4) + dot(56, 70, 1.4) + dot(56, 80, 1.4) + dot(56, 90, 1.4) +
    sh('M50 56 C54 62 64 62 68 56', P, '', 1.6) +
    // the back arm and the bag
    limb('M74 62 Q80 78 78 92', 7, W2) +
    part('hz-bag', 78, 74, ln('M70 80 C70 70 84 70 84 82', 1.8) + sh('M68 84 L88 84 L86 104 L70 104 Z', K, ln('M70 90 L86 90', 1.2, KH)) + dot(78, 87, 1.6, '#B8A16A')) +
    limb('M59 45 L59 54', 7, P) +
    sh('M46 34 C46 21 71 19 72 34 C72 46 64 50 58 50 C51 50 46 45 46 34 Z', P, wash('M65 24 C71 28 72 40 67 47 C64 49 61 50 59 50 C65 44 68 34 65 24 Z', W1)) +
    sh('M45 32 C44 20 60 14 70 22 C74 26 74 34 72 38 C70 30 64 26 56 27 C51 28 47 30 45 32 Z', W2, ln('M50 24 C56 20 64 20 68 24', 1, INK, .5)) +
    circ(70, 18, 6.5, W2, 2) + ln('M67 15 C70 14 72 16 73 18', 1, INK, .5) +
    sh('M66 34 C69 33 70 38 66 39', P, '', 1.5) +
    sh('M48 31 C43 36 43 40 47 41', P, '', 1.8) +
    circ(50.5, 31.5, 4.2, 'none', 1.5) + circ(59.5, 31.5, 4.2, 'none', 1.5) + ln('M54.7 31.5 L55.3 31.5', 1.5) + ln('M63.7 31.5 Q68 34 66 42 Q64 50 60 54', 0.9, INK, .6) +
    dot(50.5, 31.8, 1.2) + dot(59.5, 31.8, 1.2) + ln('M49 45 Q52 47 55 45', 1.4) +
    part('hz-arm', 49, 62, limb('M49 63 Q42 74 33 81', 7, W2) + circ(30, 83, 4.2, P, 1.8) + ln('M27 80 L25 77', 2.4) + ln('M27 80 L25 77', 0.9, P));

  /* The Cat: grey tabby, all business */
  C.cat =
    ground(62, 34) +
    part('hz-tail', 96, 120, limb('M96 122 C112 116 112 92 104 82 C100 78 96 80 98 84', 6, W2) + ln('M106 108 l4 -2 M108 98 l4 0 M104 88 l3 2', 1.3, INK, .55)) +
    limb('M86 128 L88 152', 7, W2) + limb('M44 128 L42 152', 7, W2) +
    sh('M34 112 C34 98 52 94 70 96 C86 98 98 104 98 118 C98 132 86 136 66 136 C46 136 34 128 34 112 Z', W2, wash('M60 98 C80 98 96 104 96 118 C96 130 86 134 70 135 C80 128 84 118 80 108 C76 102 68 99 60 98 Z', W3, .7) + hatch(56, 100, 82, 101, 5, -2, 9, .4)) +
    limb('M80 130 L80 152', 7, W2) + limb('M50 130 L48 152', 7, W2) +
    sh('M41 153 Q41 148 47 148 L52 149 L52 153 Z', W1, '', 1.6) + sh('M75 153 Q75 148 81 148 L86 149 L86 153 Z', W1, '', 1.6) +
    sh('M18 84 C18 70 30 64 42 66 C54 68 58 78 56 88 C54 100 44 104 34 104 C24 104 18 96 18 84 Z', W2, wash('M44 68 C54 72 57 82 54 92 C52 100 44 103 38 104 C46 96 50 84 44 68 Z', W3, .7) + ln('M30 70 l1 5 M36 68 l0 5 M42 69 l-1 5', 1.3, INK, .55)) +
    sh('M22 74 L20 56 L33 66 Z', W2) + sh('M44 66 L52 52 L54 70 Z', W2) + wash('M23 70 L22 60 L29 66 Z', '#E8C9C0', .9) +
    '<g class="hz-lids">' + sh('M24 82 C26 78 31 78 33 82 C31 85 26 85 24 82 Z', '#F2EAD0', '', 1.4) + sh('M40 82 C42 78 47 78 49 82 C47 85 42 85 40 82 Z', '#F2EAD0', '', 1.4) +
    '<rect x="27.6" y="78.4" width="2" height="6.4" rx="1" fill="' + INK + '"/><rect x="43.6" y="78.4" width="2" height="6.4" rx="1" fill="' + INK + '"/></g>' +
    sh('M32 89 L37 89 L34.5 92 Z', '#D9A9A0', '', 1.2) + ln('M34.5 92 L34.5 94 M30 95 Q32.2 97 34.5 94 Q36.8 97 39 95', 1.3) +
    ln('M28 92 L12 89 M28 95 L13 97 M41 92 L56 90 M41 95 L55 98', 0.9, INK, .7);

  /* The Auctioneer: a waistcoat, a watch chain, a moustache, a gavel */
  C.auctioneer =
    ground(60, 28) +
    limb('M67 112 L69 148', 9, K) + limb('M53 112 L50 148', 9, K) +
    sh('M40 152 Q40 145 49 145 L56 146 L56 152 Z', K) + sh('M61 152 Q61 145 70 145 L76 146 L76 152 Z', K) +
    sh('M40 66 C40 56 80 55 82 66 C86 84 86 104 80 114 L42 114 C36 104 36 84 40 66 Z', K, wash('M70 60 C80 64 84 76 84 92 C84 104 82 110 78 114 L72 114 C78 98 78 76 70 60 Z', '#4E4843')) +
    sh('M48 60 L72 60 C76 76 78 96 74 110 L46 110 C42 96 44 76 48 60 Z', W2, wash('M64 60 L72 60 C76 76 78 96 74 110 L66 110 C70 92 68 74 64 60 Z', W3, .8)) +
    ln('M60 62 L60 110', 1.3) + dot(57, 74, 1.4) + dot(57, 84, 1.4) + dot(57, 94, 1.4) + ln('M57 84 C64 90 70 88 73 84', 1, '#9C8650') +
    sh('M54 57 L60 61 L66 57 L66 64 L60 61 L54 64 Z', INK, '', 1.2) +
    limb('M60 47 L60 56', 7, P) +
    sh('M46 34 C46 20 72 18 73 34 C73 47 65 51 59 51 C52 51 46 46 46 34 Z', P, wash('M66 24 C72 28 73 40 68 48 C65 50 62 51 60 51 C66 45 69 34 66 24 Z', W1)) +
    sh('M64 28 C72 26 76 34 72 42 C70 36 68 32 64 30 Z', W3, '', 1.5) + sh('M46 28 C48 22 52 20 56 20 C52 22 49 25 47 30 Z', W3, '', 1.3) +
    sh('M67 34 C70 33 71 38 67 39', P, '', 1.5) +
    sh('M48 31 C41 35 41 41 47 42', P, '', 1.8) +
    ln('M49 26 Q52 24 56 26', 1.6) + dot(52.5, 30, 1.5) +
    sh('M42 44 C46 41 50 42 53 44 C56 42 60 42 62 45 C58 47 55 46 53 46 C50 47 46 48 42 44 Z', W3, '', 1.4) +
    ln('M49 48.5 Q51.5 50 54 48.5', 1.4) +
    limb('M76 66 Q84 80 80 94', 8, K) + circ(79, 97, 4.6, P, 1.8) +
    part('hz-arm', 46, 66, limb('M46 67 Q38 78 30 84', 8, K) + circ(28, 86, 4.6, P, 1.8) +
      sh('M26.5 88 L18 64 L22 62.6 L30.5 86.6 Z', '#8C6E4E', '', 1.5) + sh('M10 56 L26 50 L30 60 L14 66 Z', '#6E5238', ln('M12 59 L27 53', 1, P, .5), 1.8));

  /* The Raccoon: the mask, the ringed tail, very clean hands */
  C.raccoon =
    ground(60, 26) +
    part('hz-tail', 82, 128, limb('M80 132 C98 132 108 120 104 104', 9, W2) + ln('M100 128 l-3 -6 M106 120 l-6 -3 M107 110 l-7 -1', 4, INK, .85)) +
    limb('M50 132 L46 150', 9, W2) + limb('M70 132 L72 150', 9, W2) +
    sh('M38 152 Q38 146 46 146 L52 147 L52 152 Z', K) + sh('M66 152 Q66 146 74 146 L80 147 L80 152 Z', K) +
    sh('M40 100 C38 76 48 64 60 64 C74 64 84 78 82 104 C80 124 74 136 60 136 C46 136 40 122 40 100 Z', W2, wash('M64 66 C76 70 82 84 80 104 C78 122 72 134 62 136 C70 120 72 92 64 66 Z', W3, .8) + wash('M50 92 C50 80 56 76 60 76 C64 76 66 84 64 100 C62 118 52 120 50 108 Z', W1, .9)) +
    limb('M74 80 Q80 94 72 102', 7, W2) +
    sh('M32 54 C30 40 42 32 56 34 C70 36 76 46 72 58 C68 68 58 72 48 70 C38 68 33 62 32 54 Z', W2, wash('M58 36 C70 40 75 48 71 58 C68 66 60 70 52 70 C62 62 64 48 58 36 Z', W3, .7)) +
    sh('M38 40 L36 26 L48 34 Z', W2) + sh('M58 34 L66 22 L68 38 Z', W2) +
    sh('M30 50 C34 44 42 44 47 48 C52 44 60 44 66 48 C62 54 56 56 52 54 C48 53 46 53 44 55 C38 58 32 56 30 50 Z', K, '', 1.4) +
    circ(39, 50, 3, P, 0) + circ(57, 49.5, 3, P, 0) + dot(38.5, 50.2, 1.6) + dot(56.5, 49.8, 1.6) +
    sh('M26 60 C27 55 34 55 40 58 C40 63 34 65 28 63 Z', W1, '', 1.6) + dot(25.8, 59.2, 2.4) +
    ln('M36 64 Q39 66 42 64', 1.2) +
    part('hz-arm', 50, 80, limb('M50 80 Q42 88 34 90', 7, W2) + circ(31, 91, 4.4, K, 1.6) + ln('M27 89 l-2 -2 M27 92 l-3 0', 1.4));

  /* The Accountant: an eyeshade, sleeve garters, a fountain pen */
  C.accountant =
    ground(60, 22) +
    limb('M65 104 L66 148', 7, K) + limb('M55 104 L53 148', 7, K) +
    sh('M43 152 Q43 146 51 146 L57 147 L57 152 Z', K) + sh('M60 152 Q60 146 68 146 L74 147 L74 152 Z', K) +
    sh('M46 60 C47 54 73 53 75 60 L74 106 L47 106 Z', P, wash('M66 58 C72 60 74 64 74 70 L74 106 L67 106 Z', W1)) +
    ln('M60 58 L60 104', 1.1, INK, .5) +
    sh('M58 57 L62 57 L63 64 L61 84 L59 84 L57 64 Z', K, '', 1.4) +
    limb('M72 62 Q78 78 74 92', 6.5, P) + ln('M73.5 72 L80 70', 2.6, KH) + circ(74, 94, 4, P, 1.8) +
    limb('M60 46 L60 54', 6, P) +
    sh('M47 34 C47 21 71 19 72 34 C72 46 64 50 59 50 C52 50 47 45 47 34 Z', P, wash('M65 24 C71 28 72 40 67 47 C64 49 61 50 59 50 C65 44 68 34 65 24 Z', W1)) +
    sh('M48 28 C50 20 66 18 72 26 C72 30 71 33 70 36 C68 30 64 27 58 27 C54 27 50 28 48 28 Z', K, '') +
    sh('M68 34 C71 33 72 38 68 39', P, '', 1.5) +
    sh('M49 32 C44 36 44 40 48 41', P, '', 1.7) +
    circ(52, 31.5, 3.6, 'none', 1.4) + ln('M55.6 31 L58 30.6', 1.2) + dot(52, 32, 1.1) +
    ln('M51 45 L55 45', 1.3) +
    sh('M38 25 C46 20 62 19 72 23 L71 27 C62 25 50 26 42 30 Z', '#C9D3C2', wash('M38 25 C46 20 62 19 72 23 L71 25 C60 22 48 23 40 27 Z', P, .5), 1.8) +
    part('hz-arm', 50, 61, limb('M50 61 Q43 72 34 79', 6.5, P) + ln('M44 70 L40 66', 2.6, KH) + circ(31, 81, 4, P, 1.8) +
      sh('M30 82 L20 92 L18 90 L28 80 Z', K, '', 1.4) + sh('M20 92 L15.5 96.5 L18 90 Z', '#B8A16A', '', 1.2));

  /* The Mime: stripes, white face, beret, a rope that isn't there */
  C.mime =
    ground(60, 22) +
    limb('M66 104 L68 148', 8, K) + limb('M54 104 L51 148', 8, K) +
    sh('M41 152 Q41 145 50 145 L56 146 L56 152 Z', K) + sh('M60 152 Q60 145 68 145 L74 146 L74 152 Z', K) +
    sh('M45 60 C46 54 74 53 76 60 L75 106 L46 106 Z', P, wash('M67 58 C73 60 75 64 75 70 L75 106 L68 106 Z', W1) +
      ln('M46 66 L75 66 M46 74 L75 74 M46 82 L75 82 M46 90 L75 90 M46 98 L75 98', 3.6, K)) +
    sh('M52 56 C55 60 65 60 68 56 L66 54 L54 54 Z', P, '', 1.4) +
    limb('M72 62 Q78 78 74 90', 7, P) + ln('M72 70 L78 69 M74 80 L79 80', 3, K) + circ(74, 93, 4.6, P, 1.8) +
    limb('M60 46 L60 54', 6.5, P) +
    sh('M46 34 C46 20 71 18 72 34 C72 46 64 50 59 50 C51 50 46 45 46 34 Z', P, wash('M65 24 C71 28 72 40 67 47 C64 49 61 50 59 50 C65 44 68 34 65 24 Z', W1)) +
    sh('M44 24 C46 14 64 12 74 20 C70 22 58 22 46 26 Z', K, '', 1.8) + ln('M60 13 L61 9', 2) +
    sh('M48 31 C43 35 43 39 47 40', P, '', 1.7) +
    ln('M48.5 26.5 L50.5 31 M53.5 26.5 L51.5 31', 0.9, INK, .7) + dot(51, 31.5, 1.4) + ln('M49 29 Q51 28 53 29', 0.8) +
    ln('M48 44 Q50.5 42.5 53 44', 1.6) + ln('M44 38 C42 41 44 43 46 43', 0.9, INK, .4) +
    part('hz-arm', 50, 61, limb('M50 62 Q42 70 34 76', 7, P) + ln('M44 66 L40 72 M38 70 L36 76', 3, K) + circ(31, 78, 4.8, P, 1.8));

  /* The Frog: sitting, patient, with a long reach */
  C.frog =
    ground(60, 34) +
    sh('M24 148 C18 136 22 122 34 118 C40 128 42 140 46 148 Z', W2) + sh('M96 148 C102 136 98 122 86 118 C80 128 78 140 74 148 Z', W2) +
    sh('M26 120 C22 98 36 82 60 82 C84 82 98 98 94 120 C92 140 78 150 60 150 C42 150 28 140 26 120 Z', W2,
      wash('M70 84 C86 88 96 102 93 120 C91 138 80 148 64 150 C78 138 84 120 80 104 C78 96 74 90 70 84 Z', W3, .75) +
      '<circle cx="74" cy="108" r="4" fill="' + W3 + '"/><circle cx="84" cy="124" r="3" fill="' + W3 + '"/><circle cx="64" cy="98" r="2.6" fill="' + W3 + '"/>') +
    part('hz-throat', 52, 122, sh('M38 118 C40 128 50 134 60 134 C70 134 78 128 80 118 C72 124 48 124 38 118 Z', W1, '', 1.6)) +
    ln('M32 112 C42 120 76 120 88 112', 2.2) +
    sh('M30 148 Q30 141 38 141 L46 142 L46 148 Z', W2, '', 1.8) + sh('M74 148 Q74 141 82 141 L90 142 L90 148 Z', W2, '', 1.8) +
    sh('M30 96 C28 82 46 76 50 90 Z', W2) + sh('M70 90 C74 76 92 82 90 96 Z', W2) +
    '<g class="hz-lids">' + circ(40, 90, 7.5, P, 2) + circ(80, 90, 7.5, P, 2) + dot(38, 91, 3) + dot(78, 91, 3) + '</g>' +
    ln('M33 86 Q40 81 47 85 M73 85 Q80 81 87 86', 1.8);

  /* The Octopus: heavy lids, a great many arms */
  C.octopus =
    ground(60, 36) +
    limb('M40 116 C30 128 34 140 22 146 C18 148 16 144 19 142', 7, W2) +
    limb('M80 116 C90 128 86 140 98 146 C102 148 104 144 101 142', 7, W2) +
    limb('M50 120 C46 134 52 144 42 152', 7, W2) + limb('M70 120 C74 134 68 144 78 152', 7, W2) +
    limb('M60 122 C60 136 62 146 58 153', 7, W2) +
    sh('M34 96 C30 60 44 40 62 40 C80 40 92 60 88 96 C86 112 76 122 60 122 C46 122 36 112 34 96 Z', W2,
      wash('M68 42 C82 48 90 66 87 94 C85 110 76 120 64 122 C76 106 80 74 68 42 Z', W3, .75) + wash('M44 58 C46 50 52 46 56 46 C50 52 48 58 48 66 Z', P, .7) +
      '<circle cx="74" cy="64" r="2.6" fill="' + W3 + '"/><circle cx="80" cy="76" r="2" fill="' + W3 + '"/><circle cx="70" cy="54" r="1.8" fill="' + W3 + '"/>') +
    '<g class="hz-lids">' + circ(50, 92, 6.5, P, 1.8) + circ(68, 92, 6.5, P, 1.8) + dot(48.5, 94, 2.6) + dot(66.5, 94, 2.6) +
    sh('M43 91 C44 84 56 84 57 91 Z', W3, '', 1.6) + sh('M61 91 C62 84 74 84 75 91 Z', W3, '', 1.6) + '</g>' +
    ln('M55 108 Q59 110 63 108', 1.5) +
    '<circle cx="24" cy="138" r="1.3" fill="' + INK + '" opacity=".5"/><circle cx="96" cy="138" r="1.3" fill="' + INK + '" opacity=".5"/>';

  /* The Claw: an arcade claw, drawn like a piece of equipment in an old catalogue */
  C.claw =
    '<rect x="57" y="-1000" width="6" height="1028" fill="' + W2 + '" stroke="' + INK + '" stroke-width="1.8"/>' +
    sh('M52 22 L68 22 L68 32 L52 32 Z', W2, '', 2) +
    sh('M36 44 C36 34 46 30 60 30 C74 30 84 34 84 44 L84 54 C84 60 78 62 60 62 C42 62 36 60 36 54 Z', W1, wash('M70 31 C80 33 84 38 84 46 L84 54 C84 59 79 61 72 62 C76 54 76 40 70 31 Z', W2) + ln('M42 38 L42 56', 2.4, P, .9)) +
    ln('M38 48 L82 48', 1.2, INK, .45) + dot(60, 40, 2.6, INK) +
    part('hz-pl', 44, 60, limb('M44 60 L32 80 Q28 94 40 104 L44 101', 5, W1)) +
    part('hz-pr', 76, 60, limb('M76 60 L88 80 Q92 94 80 104 L76 101', 5, W1)) +
    part('hz-pc', 60, 62, limb('M60 62 L60 82 Q61 96 58 104', 5, W2)) +
    sh('M42 58 L78 58 L78 66 L42 66 Z', W2, '', 2);


  window.ccCast = C;
})();

/* ── The heists: one comic beat structure, eleven thieves ──
   Index = HEISTS in game.js (the server deals them like a deck). Every full show runs 9.6 s on the shared beat:
     0.0  the panel: who's sending whom in; the doomed chip is circled in pencil  (anticipation)
     1.3  the thief arrives, and stops. A look at the chip.                          (anticipation)
     3.7  the grab
     4.5  the thief makes it the dealer's own (each in its own way)
     5.9  set back on the table, in the dealer's colour; the thief leaves
     6.6  held: the chip circled again, "Lilah's chip. Margaret's now."               (the result)
     7.6  the gloat line, given time to land; 9.1 fade; 9.6 gone
   Every layer is sampled from one function of time and played as a Web Animation pinned to the beat, so a
   frame at time t is the same on every phone. No flashes, no strobing; Reduce Motion gets a still panel and
   cross-fades on the same beats. Layers are the size of the panel or smaller. */
(function () {
  'use strict';
  var CAST = window.ccCast || {};
  var L = 9600;
  var TM = { ring: 300, enter0: 1300, enter1: 3000, look1: 3700, grab: 3700, take: 3950, held: 4500, claim1: 5900, set: 6400, exit0: 6550, exit1: 7700, result: 6650, gloat: 7600 };
  var INK = '#1F1A17';

  // key, the thief's drawing, size (px per viewBox unit), hand/shoulder points in the drawing, tagline
  var ACTS = [
    { key: 'claw', name: 'The Claw', tag: 'Skill game. Allegedly.', k: 1.05 },
    { key: 'butler', name: 'The Butler', tag: 'Clears the table. Thoroughly.', k: 1.3, sh: [50, 61], hand: [28, 85] },
    { key: 'magician', name: 'The Magician', tag: 'Nothing up the sleeve.', k: 1.3, sh: [50, 62], hand: [31, 82] },
    { key: 'grandma', name: 'Grandma', tag: 'Sweetheart, that’s mine.', k: 1.3, sh: [49, 63], hand: [30, 83], bag: [78, 95] },
    { key: 'cat', name: 'The Cat', tag: 'It was on the table.', k: 0.95 },
    { key: 'auctioneer', name: 'The Auctioneer', tag: 'Going once.', k: 1.3, sh: [46, 67], hand: [28, 86], back: [80, 94] },
    { key: 'raccoon', name: 'The Raccoon', tag: 'Washes everything first.', k: 1.3, sh: [50, 80], hand: [31, 91] },
    { key: 'accountant', name: 'The Accountant', tag: 'Moves it to another column.', k: 1.3, sh: [50, 61], hand: [31, 81], pen: [16, 96] },
    { key: 'mime', name: 'The Mime', tag: 'Says nothing. Takes everything.', k: 1.3, sh: [50, 61], hand: [31, 78] },
    { key: 'frog', name: 'The Frog', tag: 'Patient. Then not.', k: 1.0, mouth: [56, 119] },
    { key: 'octopus', name: 'The Octopus', tag: 'Has a hand in everything.', k: 1.0, arm: [40, 112] }
  ];

  var CSS = [
    '.hz-l{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform,opacity;}',
    '.hz-thief{z-index:0;}',
    '.hz-thief.front{z-index:3;}',
    '.hz-thief svg{position:absolute;overflow:visible;display:block;}',
    '.hz-chip{z-index:4;opacity:0;}',
    '.hz-chip>span{position:absolute;left:-17px;top:-17px;width:34px;height:34px;}',
    '.hz-chip .chip{position:absolute;left:0;top:0;margin:0;box-shadow:0 2px 0 rgba(31,26,23,.75);}',
    '.hz-chip .hz-coat{position:absolute;left:0;top:0;width:34px;height:34px;opacity:0;}',
    '.hz-line{position:absolute;left:0;top:0;width:100px;height:8px;margin-top:-4px;transform-origin:0 50%;z-index:2;opacity:0;border:2px solid ' + INK + ';border-radius:5px;box-sizing:border-box;pointer-events:none;will-change:transform,opacity;}',
    '.hz-line.tongue{background:#E7CFC9;}',
    '.hz-line.tentacle{height:11px;margin-top:-5.5px;border-radius:6px;background:#D9D3C9;}',
    '.hz-puff{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:#F4F1EC;border:2px solid ' + INK + ';z-index:5;opacity:0;pointer-events:none;}',
    '.hz-bub{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;border:1.6px solid ' + INK + ';background:#fff;z-index:5;opacity:0;pointer-events:none;}',
    '.hz-glint{position:absolute;left:-9px;top:-9px;width:18px;height:18px;z-index:5;opacity:0;pointer-events:none;}',
    '.hz-say{position:absolute;left:0;top:0;z-index:6;opacity:0;font-family:var(--serif,"Libre Caslon Text",Georgia,serif);font-style:italic;font-size:17px;color:' + INK + ';white-space:nowrap;transform:translate(-50%,-50%);pointer-events:none;}',
    '.st-table.tight .st-row{min-height:36px;padding:3px 2px;}',
    '.st-table.tight .chip{--s:28px;}'
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-heist-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, u) { return a + (b - a) * u; };
  var U = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var eio = function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  var eo = function (u) { return 1 - Math.pow(1 - u, 3); };
  var ei = function (u) { return u * u * u; };
  var back = function (u) { var c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  var bell = function (u) { return Math.sin(Math.PI * clamp(u, 0, 1)); };
  var kit = function () { return window.ccStealKit || {}; };

  /* Sounds (speaker phone only, via big()). Soft; nothing above the game's own seal. */
  function step(at) { noise(0.035, at, 0.07, 1300, 'bandpass'); }
  var FX = {
    steps: function (n, gap) { for (var i = 0; i < n; i++) step(i * gap); },
    hum: function () { tone(70, 1.2, 0, 'sine', 0.05, 66); tone(140, 1.2, 0, 'sine', 0.02); },
    pop: function () { tone(1100, 0.06, 0, 'sine', 0.05, 640); noise(0.04, 0, 0.08, 2400, 'bandpass'); },
    whoosh: function () { noise(0.28, 0, 0.07, 1100, 'bandpass'); },
    chime: function () { tone(1319, 0.5, 0, 'sine', 0.03); tone(1760, 0.6, 90, 'sine', 0.022); },
    puff: function () { noise(0.35, 0, 0.09, 700, 'lowpass'); },
    rustle: function () { noise(0.22, 0, 0.08, 2200, 'bandpass'); noise(0.18, 260, 0.07, 1800, 'bandpass'); },
    knock: function () { noise(0.05, 0, 0.16, 1500, 'bandpass'); tone(260, 0.12, 0, 'triangle', 0.06); },
    scrub: function () { for (var i = 0; i < 5; i++) noise(0.08, i * 170, 0.05, 3000, 'bandpass'); },
    scribble: function () { noise(0.6, 0, 0.045, 4200, 'bandpass'); },
    gulp: function () { tone(240, 0.22, 0, 'sine', 0.06, 110); },
    slurp: function () { tone(380, 0.14, 0, 'sine', 0.04, 900); noise(0.1, 0, 0.05, 1600, 'bandpass'); },
    purr: function () { for (var i = 0; i < 6; i++) tone(52, 0.09, i * 110, 'sine', 0.05, 46); },
    hop: function (n, gap) { for (var i = 0; i < n; i++) tone(150, 0.12, i * gap, 'sine', 0.045, 300); },
    servo: function () { tone(220, 0.5, 0, 'triangle', 0.025, 150); },
    clunk: function () { noise(0.1, 0, 0.14, 500, 'lowpass'); tone(110, 0.16, 0, 'sine', 0.08, 70); }
  };

  /* ── The choreography: frame(t) for each act. Shared helpers work in panel pixels. ── */
  function script(act, G) {
    var V = G.V, W = G.W, top = G.top, k = act.k * G.kz;
    var m = V.x < W / 2 ? 1 : -1;   // 1: drawn facing left, standing to the chip's right; -1: mirrored
    var feet = top + Math.min(46 * G.kz, G.th - 8);   // behind the table: the table hides the legs, however few rows it has
    var L2S = function (X, Y, mm, p, kk) { return { x: X + (p[0] - 60) * (kk || k) * mm, y: Y + (p[1] - 155) * (kk || k) }; };
    var rot = function (p, c, a) { var r = a * Math.PI / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]; };
    var standX = function (p) { return clamp(V.x - (p[0] - 60) * k * m, 40, W - 40); };
    var off = function (side) { return side > 0 ? W + 110 : -110; };
    // walking: x eased between two points, a light bob per step, a small sway
    var walk = function (t, t0, t1, x0, x1, y, per) {
      var u = U(t, t0, t1), x = lerp(x0, x1, eio(u)), moving = t > t0 && t < t1, ph = (t - t0) / (per || 400);
      return { x: x, y: y - (moving ? Math.abs(Math.sin(ph * Math.PI)) * 3.5 * G.kz : 0), r: moving ? Math.sin(ph * Math.PI) * 1.6 : 0 };
    };
    var arc = function (a, b, u, h) { return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - h * bell(u) }; };
    var VP = { x: V.x, y: V.y };
    var F = { th: { x: -999, y: 0, m: m, r: 0, sx: 1, sy: 1, o: 1 }, arm: 0, chip: { x: V.x, y: V.y, s: 1, o: 0, c: 0, r: 0, clip: 0 }, tv: 1, tc: 0 };

    if (act.key === 'claw') {
      var cx = V.x, hover = V.y - 120 * G.kz, lift = Math.max(70 * G.kz, top - 90 * G.kz), grip = [60, 101];
      var clawY = function (t) {   // y of the claw's grip
        if (t < TM.enter0) return -60;
        if (t < 2700) return lerp(-60, hover, back(U(t, TM.enter0, 2700)));
        if (t < TM.grab) return hover;
        if (t < 4000) return lerp(hover, V.y, ei(U(t, TM.grab, 4000)));
        if (t < 4150) return V.y;
        if (t < 4700) return lerp(V.y, lift, eio(U(t, 4150, 4700)));
        if (t < 5900) return lift + Math.sin((t - 4700) / 380) * 3;
        if (t < TM.set) return lerp(lift, V.y, eio(U(t, 5900, TM.set)));
        if (t < 6650) return V.y;
        return lerp(V.y, -90, eio(U(t, 6650, 7500)));
      };
      var clawX = function (t) {   // it hesitates: a little to one side, then back over the chip
        var d = 34 * G.kz * (V.x < W / 2 ? 1 : -1);
        if (t < 2700) return cx;
        if (t < 3150) return cx + d * eio(U(t, 2700, 3150));
        if (t < 3600) return cx + d * (1 - eio(U(t, 3150, 3600)));
        return cx;
      };
      return {
        layers: 'claw', front: true,
        frame: function (t) {
          var f = JSON.parse(JSON.stringify(F)), gy = clawY(t), gx = clawX(t);
          var sway = t < TM.grab ? Math.sin((t - TM.enter0) / 520) * 1.4 * (1 - U(t, 2700, 3600)) : 0;
          f.th = { x: gx, y: gy + (155 - grip[1]) * k, m: 1, r: sway, sx: 1, sy: 1, o: 1 };
          var closed = (t >= 3980 && t < 6420) ? 1 : (t < 3980 ? 0 : 0);
          var openA = t < TM.grab ? 4 : 16;
          f.pl = closed ? -6 : (t > 3500 && t < 3980 ? lerp(4, 18, U(t, 3500, 3800)) : (t >= 6420 ? lerp(-6, 16, U(t, 6420, 6560)) : openA));
          f.pr = -f.pl;
          var held = t >= 4000 && t < TM.set;
          f.tv = t < 4000 ? 1 : (t < TM.set ? 0 : 1);
          f.tc = t >= TM.set ? 1 : 0;
          var sw = t >= 4150 && t < TM.set ? Math.sin((t - 4150) / 260) * 4 * (1 - U(t, 4150, 5400)) : 0;
          f.th.r += sw;
          f.chip = { x: gx - sw * 0.8, y: gy - 2, s: 1, o: held ? 1 : 0, c: t > 4850 ? 1 : 0, r: sw, clip: 1 - eio(U(t, 4850, 5550)) };
          return f;
        },
        sounds: [[TM.enter0, FX.servo], [TM.grab, FX.servo], [4000, FX.clunk], [4150, FX.servo], [4850, FX.scribble], [5900, FX.servo], [6650, FX.servo]]
      };
    }

    if (act.key === 'cat') {
      // walks along the chip's own row, sits on it, gets up when it's done
      var ck = k, cfeet = V.y + 13 * G.kz, body = [66, 118];
      var sx = clamp(V.x - (body[0] - 60) * ck * m, 20, W - 20), beside = sx + 62 * G.kz * m;
      return {
        layers: 'thief', front: true,
        frame: function (t) {
          var f = JSON.parse(JSON.stringify(F)), w;
          if (t < TM.look1) { w = walk(t, TM.enter0, TM.enter1, off(m), beside, cfeet, 330); f.th = { x: w.x, y: w.y, m: m, r: w.r, sx: 1, sy: 1, o: 1 }; }
          else if (t < TM.claim1) {
            var u = U(t, TM.grab, 4150), x = lerp(beside, sx, eio(u)), sit = U(t, 4100, 4350);
            f.th = { x: x, y: cfeet + (u > 0 && u < 1 ? -10 * bell(u) * G.kz : 0) + 4 * sit, m: m, r: 0, sx: 1 + 0.06 * bell(sit), sy: 1 - 0.08 * bell(sit), o: 1 };
          } else { w = walk(t, TM.claim1 + 300, TM.exit1, sx, off(-m), cfeet, 330); f.th = { x: w.x, y: w.y, m: t > TM.claim1 + 200 ? -m : m, r: w.r, sx: 1, sy: 1, o: 1 }; }
          f.lids = (t > 3150 && t < 3550) ? 1 - 0.85 * bell(U(t, 3150, 3550)) : (t > 4900 && t < 5500 ? 1 - 0.85 * bell(U(t, 4900, 5500)) : 1);
          f.tail = Math.sin(t / 420) * 8 + (t > TM.held && t < TM.claim1 ? Math.sin(t / 260) * 6 : 0);
          f.tv = 1; f.tc = t > 4600 ? 1 : 0;
          return f;
        },
        sounds: [[TM.enter0, function () { FX.steps(5, 330); }], [4100, FX.purr], [TM.claim1 + 300, function () { FX.steps(4, 330); }]]
      };
    }

    if (act.key === 'frog' || act.key === 'octopus') {
      var oc = act.key === 'octopus', fk = k * (oc ? 1 : 1.05);
      var ffeet = top + Math.min((oc ? 40 : 26) * G.kz, G.th - 6);
      var fx = clamp(V.x + (oc ? 96 : 84) * G.kz * m, 62 * fk, W - 62 * fk);
      var src = oc ? act.arm : act.mouth;
      var spot = function (t) { return L2S(fx, ffeet, m, src, fk); };
      var showAt = { x: 0, y: 0 };
      return {
        layers: 'thief', front: false, line: oc ? 'tentacle' : 'tongue',
        frame: function (t) {
          var f = JSON.parse(JSON.stringify(F)), y, x = fx;
          if (oc) {   // rises from behind the table, sinks back
            y = t < TM.enter1 ? lerp(ffeet + 170 * G.kz, ffeet, eo(U(t, TM.enter0, TM.enter1))) : (t < TM.exit0 + 200 ? ffeet : lerp(ffeet, ffeet + 190 * G.kz, ei(U(t, TM.exit0 + 200, TM.exit1))));
            y += Math.sin(t / 600) * 2.5 * G.kz;
          } else {     // three hops in, three hops out
            var hopIn = function (tt) { var u = U(tt, TM.enter0, TM.enter1), n = 3, i = Math.min(n - 1, Math.floor(u * n)), ph = u * n - i; return { x: lerp(off(m), fx, (i + eio(ph)) / n), y: ffeet - (u < 1 ? 46 * G.kz * bell(ph) : 0) }; };
            var hopOut = function (tt) { var u = U(tt, TM.exit0, TM.exit1), n = 3, i = Math.min(n - 1, Math.floor(u * n)), ph = u * n - i; return { x: lerp(fx, off(m), (i + eio(ph)) / n), y: ffeet - (u > 0 && u < 1 ? 46 * G.kz * bell(ph) : 0) }; };
            var h = t < TM.exit0 ? hopIn(t) : hopOut(t); x = h.x; y = h.y;
          }
          f.th = { x: x, y: y, m: m, r: 0, sx: 1, sy: 1, o: 1 };
          var M = L2S(x, y, m, src, fk);
          f.lids = (t > 3100 && t < 3500) ? 1 - 0.85 * bell(U(t, 3100, 3500)) : (t > 5050 && t < 5450 ? 1 - 0.85 * bell(U(t, 5050, 5450)) : 1);
          // the line: out to the chip, back with it; later out again to set it down
          var tip = null;
          if (t >= 3600 && t < 3800) tip = { x: lerp(M.x, V.x, eo(U(t, 3600, 3800))), y: lerp(M.y, V.y, eo(U(t, 3600, 3800))) };
          else if (t >= 3800 && t < 4200) tip = { x: lerp(V.x, M.x, eio(U(t, 3800, 4200))), y: lerp(V.y, M.y, eio(U(t, 3800, 4200))) };
          var hold = oc ? { x: M.x - 30 * G.kz * m, y: M.y - 64 * G.kz } : M;
          if (oc && t >= 4200 && t < 5900) tip = { x: lerp(M.x, hold.x, eio(U(t, 4200, 4500))), y: lerp(M.y, hold.y, eio(U(t, 4200, 4500))) };
          if (t >= 5900 && t < 6300) { var a = oc ? hold : M; tip = { x: lerp(a.x, V.x, eio(U(t, 5900, 6300))), y: lerp(a.y, V.y, eio(U(t, 5900, 6300))) - 22 * bell(U(t, 5900, 6300)) }; }
          if (t >= 6300 && t < 6550) tip = { x: lerp(V.x, M.x, eio(U(t, 6300, 6550))), y: lerp(V.y, M.y, eio(U(t, 6300, 6550))) };
          if (oc && t >= 4200 && t < 5900 && !tip) tip = hold;
          if (tip) f.line = { ax: M.x, ay: M.y, bx: tip.x, by: tip.y, o: 1 };
          // the chip rides the tip; the frog swallows it (it comes back out the dealer's)
          var carried = t >= 3800 && t < 6320;
          var gone = !oc && t >= 4180 && t < 5880;
          f.chip = { x: tip ? tip.x : M.x, y: tip ? tip.y : M.y, s: oc ? (t > 4400 && t < 5900 ? 1.25 : 1) : (t > 4100 && t < 4200 ? 0.6 : 1), o: carried && !gone ? 1 : 0, c: t > (oc ? 5150 : 5000) ? 1 : 0, r: 0, ry: oc && t > 4700 && t < 5600 ? 720 * eio(U(t, 4700, 5600)) : 0, clip: 0 };
          f.tv = t < 3800 ? 1 : (t < 6300 ? 0 : 1); f.tc = t >= 6300 ? 1 : 0;
          if (!oc) f.throat = t > 4200 && t < 4900 ? 1 + 0.16 * bell(U(t, 4200, 4550)) + 0.1 * bell(U(t, 4550, 4900)) : 1;
          return f;
        },
        sounds: oc ? [[TM.enter0, FX.whoosh], [3600, FX.slurp], [4700, FX.whoosh], [5900, FX.slurp], [TM.exit0 + 200, FX.whoosh]]
                   : [[TM.enter0, function () { FX.hop(3, 567); }], [3600, FX.slurp], [4250, FX.gulp], [5900, FX.slurp], [TM.exit0, function () { FX.hop(3, 383); }]]
      };
    }

    /* The people (and the raccoon): walk in behind the table, stop, look, reach, hold it up, make it theirs */
    var X = standX(act.hand), hand = function (x, y, a) { return L2S(x, y, m, rot(act.hand, act.sh, a)); };
    var holdA = 24, lowA = -26;   // arm angles: held up / reaching down
    var claim = act.key;
    return {
      layers: 'thief', front: false,
      frame: function (t) {
        var f = JSON.parse(JSON.stringify(F)), w, mm = m;
        if (t < TM.exit0) w = walk(t, TM.enter0, TM.enter1, off(m), X, feet, 420);
        else { mm = -m; w = walk(t, TM.exit0 + 60, TM.exit1, X, off(m), feet, 420); }
        var lean = (t > TM.enter1 && t < TM.look1 ? -2.5 * bell(U(t, TM.enter1 + 100, TM.look1)) : 0)
          - 9 * m * bell(U(t, TM.grab - 100, TM.held)) - 7 * m * bell(U(t, TM.claim1 + 100, TM.exit0 + 100));
        var R = w.r + lean, armX = null;
        hand = function (x, y, ang) { var p = L2S(x, y, m, rot(act.hand, act.sh, ang)), r = R * Math.PI / 180, dx = p.x - x, dy = p.y - y; return { x: x + dx * Math.cos(r) - dy * Math.sin(r), y: y + dx * Math.sin(r) + dy * Math.cos(r) }; };
        f.th = { x: w.x, y: w.y, m: mm, r: R, sx: 1, sy: 1, o: 1 };
        // the arm: down for the chip, up to hold it, down to set it
        var a = 0;
        if (t >= TM.grab && t < TM.take) a = lowA * eio(U(t, TM.grab, TM.take));
        else if (t >= TM.take && t < TM.held) a = lerp(lowA, holdA, eio(U(t, TM.take + 80, TM.held)));
        else if (t >= TM.held && t < TM.claim1) a = holdA;
        else if (t >= TM.claim1 && t < TM.set) a = lerp(holdA, lowA, eio(U(t, TM.claim1, TM.set)));
        else if (t >= TM.set && t < TM.exit0 + 100) a = lerp(lowA, 0, eio(U(t, TM.set, TM.exit0 + 100)));
        var H = hand(w.x, w.y, a), c = { x: H.x, y: H.y + 4 * G.kz, s: 1, o: 0, c: 0, r: 0, clip: 0 };
        var held = t >= TM.take + 120 && t < TM.set;
        if (t >= TM.take - 60 && t < TM.take + 260) { var p = arc(VP, H, eo(U(t, TM.take - 60, TM.take + 260)), 18 * G.kz); c.x = p.x; c.y = p.y; c.o = 1; }
        if (held) c.o = 1;
        if (t >= TM.claim1 && t < TM.set) { var q = arc(H, VP, eio(U(t, TM.claim1 + 120, TM.set)), 14 * G.kz); c.x = q.x; c.y = q.y; }
        // each one's claim
        var c0 = TM.held, c1 = TM.claim1;
        if (claim === 'butler') {          // a polish with the towel, a glint
          if (t > c0 + 200 && t < c1 - 300) { a += Math.sin((t - c0) / 120) * 5; H = hand(w.x, w.y, a); c.x = H.x; c.y = H.y + 4 * G.kz; c.r = Math.sin((t - c0) / 120) * 8; }
          c.c = eio(U(t, c0 + 500, c0 + 1100));
          f.glint = { x: c.x + 12 * G.kz, y: c.y - 12 * G.kz, s: bell(U(t, c0 + 1050, c1 - 50)), o: bell(U(t, c0 + 1050, c1 - 50)) };
        } else if (claim === 'magician') { // the chip floats; two taps of the wand; a puff of smoke
          var fl = { x: H.x - 30 * G.kz * m, y: H.y - 20 * G.kz + Math.sin(t / 300) * 3 };
          if (t >= c0 - 200 && t < c1) { var u2 = U(t, c0 - 200, c0 + 200); c.x = lerp(H.x, fl.x, eio(u2)); c.y = lerp(H.y + 4, fl.y, eio(u2)); }
          var tap = function (tt) { return bell(U(t, tt, tt + 260)); };
          if (t >= c0 && t < c1) armX = holdA - 20 * (tap(c0 + 250) + tap(c0 + 650));
          if (t >= c1 && t < TM.set) { var q2 = arc(fl, VP, eio(U(t, c1, TM.set)), 0); c.x = q2.x; c.y = q2.y; }
          c.c = t > c0 + 980 ? 1 : 0;
          var pu = U(t, c0 + 860, c0 + 1450);
          f.puffs = [[-12, -4], [10, -10], [2, 10]].map(function (d, i) { return { x: fl.x + d[0] * G.kz, y: fl.y + d[1] * G.kz - 14 * pu, s: 0.4 + 1.1 * eo(U(t, c0 + 860 + i * 50, c0 + 1200)), o: pu > 0 && pu < 1 ? Math.min(1, (1 - pu) * 2.2) : 0 }; });
        } else if (claim === 'grandma') {  // into the handbag; the bag has a think; out comes the dealer's
          var B = L2S(w.x, w.y, m, act.bag);
          if (t >= c0 + 100 && t < c0 + 450) { var p3 = arc(H, B, eio(U(t, c0 + 100, c0 + 450)), 30 * G.kz); c.x = p3.x; c.y = p3.y; c.s = lerp(1, 0.7, U(t, c0 + 100, c0 + 450)); }
          else if (t >= c0 + 450 && t < c0 + 1000) c.o = 0;
          else if (t >= c0 + 1000 && t < c0 + 1350) { var p4 = arc(B, H, eio(U(t, c0 + 1000, c0 + 1350)), 30 * G.kz); c.x = p4.x; c.y = p4.y; c.s = lerp(0.7, 1, U(t, c0 + 1000, c0 + 1350)); }
          f.bag = (t > c0 + 450 && t < c0 + 1000) ? Math.sin((t - c0 - 450) / 70) * 5 * bell(U(t, c0 + 450, c0 + 1000)) : 0;
          c.c = t > c0 + 700 ? 1 : 0;
        } else if (claim === 'auctioneer') { // the chip in the other hand; three raps of the gavel
          var BK = L2S(w.x, w.y, m, act.back);
          if (t >= TM.take + 120 && t < c1) {
            var u5 = U(t, TM.take + 120, c0); c.x = lerp(H.x, BK.x, eio(u5)); c.y = lerp(H.y, BK.y, eio(u5)) - 16 * bell(u5);
            var rap = 0; [c0 + 150, c0 + 600, c0 + 1050].forEach(function (r0) { rap += bell(U(t, r0, r0 + 300)); });
            if (t >= c0) armX = holdA + 16 - 34 * rap;
          }
          if (t >= c1 && t < TM.set) { var q5 = arc(BK, VP, eio(U(t, c1, TM.set)), 18); c.x = q5.x; c.y = q5.y; }
          c.c = t > c0 + 1080 ? 1 : 0;   // on 'Sold.'
          f.say = [c0 + 150, c0 + 600, c0 + 1050];
        } else if (claim === 'raccoon') {  // a thorough wash
          if (t > c0 + 100 && t < c1 - 200) { var sc = Math.sin((t - c0) / 85); c.x += sc * 4 * G.kz; c.r = sc * 10; a += sc * 4; }
          c.c = eio(U(t, c0 + 500, c0 + 1200));
          f.bubs = [0, 1, 2, 3].map(function (i) { var u6 = U(t, c0 + 200 + i * 220, c0 + 900 + i * 220); return { x: c.x + (i % 2 ? 12 : -10) * G.kz + Math.sin(u6 * 6) * 3, y: c.y - 6 - 46 * u6 * G.kz, s: 0.6 + 0.6 * u6, o: u6 > 0 && u6 < 1 ? 1 - u6 * u6 : 0 }; });
        } else if (claim === 'accountant') { // signed for: the colour follows the pen
          if (t > c0 + 200 && t < c0 + 1100) { a += Math.sin((t - c0) / 55) * 3.5; H = hand(w.x, w.y, a); if (held) { c.x = H.x; c.y = H.y + 4 * G.kz; } }
          c.c = 1; c.clip = 1 - eio(U(t, c0 + 250, c0 + 1100));
        } else if (claim === 'mime') {     // an invisible rope: three pulls, and the chip comes, jerkily
          if (t >= TM.grab && t < TM.held + 300) {
            var pulls = U(t, TM.grab, TM.held + 300) * 3, i8 = Math.min(2, Math.floor(pulls)), ph8 = pulls - i8;
            a = lowA + 30 * Math.sin(Math.PI * ph8) * 0.8;
            var dest = hand(w.x, w.y, holdA), pr8 = (i8 + eo(clamp(ph8 * 1.6, 0, 1))) / 3;
            c.x = lerp(V.x, dest.x, pr8); c.y = lerp(V.y, dest.y + 4 * G.kz, pr8) - 10 * bell(pr8); c.o = 1;
            f.tvMime = 1;
          }
          if (t >= TM.held + 300 && t < c1) { c.c = 1; c.clip = 1 - eio(U(t, TM.held + 450, c1 - 200)); a = holdA + Math.sin((t - c0) / 160) * 6 * bell(U(t, TM.held + 400, c1 - 150)); var H8 = hand(w.x, w.y, a); c.x = H8.x; c.y = H8.y + 4 * G.kz; }
          if (t >= c1) c.c = 1, c.clip = 0;
        }
        f.arm = armX != null ? armX : a;
        f.chip = c;
        f.tv = t < TM.take - 60 ? 1 : (t < TM.set ? 0 : 1);
        if (claim === 'mime') f.tv = t < TM.grab ? 1 : (t < TM.set ? 0 : 1);
        f.tc = t >= TM.set ? 1 : 0;
        return f;
      },
      sounds: [[TM.enter0, function () { FX.steps(4, 420); }], [TM.take, FX.pop]].concat(
        claim === 'magician' ? [[TM.held + 250, FX.chime], [TM.held + 860, FX.puff]] :
        claim === 'grandma' ? [[TM.held + 450, FX.rustle]] :
        claim === 'auctioneer' ? [[TM.held + 300, FX.knock], [TM.held + 750, FX.knock], [TM.held + 1200, FX.knock]] :
        claim === 'raccoon' ? [[TM.held + 150, FX.scrub]] :
        claim === 'accountant' ? [[TM.held + 250, FX.scribble]] :
        claim === 'butler' ? [[TM.held + 1100, function () { tone(2093, 0.4, 0, 'sine', 0.018); }]] : [],
        [[TM.exit0 + 60, function () { FX.steps(3, 420); }]])
    };
  }

  var SAY = ['Going once.', 'Twice.', 'Sold.'];

  /* ── The show ── */
  function play(wait, opt) {
    var st = state.steal, o = document.getElementById('stealshow');
    var n = ACTS.length, idx = ((st.act | 0) % n + n) % n, act = ACTS[idx];   // an older server's act numbers wrap
    var K = kit();
    (window._ssT || []).forEach(clearTimeout); window._ssT = [];
    var startAt = performance.now() + Math.max(0, wait);
    var T = function (fn, ms) { window._ssT.push(setTimeout(function () { try { fn(); } catch (e) { console.error('heist', e); } }, Math.max(0, startAt + ms - performance.now()))); };
    var close = function () { (window._ssT || []).forEach(clearTimeout); window._ssT = []; o.classList.remove('on', 'out', 'quick'); o.innerHTML = ''; };
    o.innerHTML = ''; o.classList.remove('out', 'quick'); o.classList.add('on');
    o.onclick = function () { close(); if (window._answerGo) window._answerGo(); };
    // It always clears, whatever happens below
    T(function () { o.classList.add('out'); }, L - 450);
    T(close, L);
    try { run(o, st, act, startAt, T, K); } catch (e) { console.error('heist', e); var sg = o.querySelector('#st-stage'); if (sg) sg.style.visibility = ''; }
    return Math.max(0, wait) + L;
  }

  function run(o, st, act, startAt, T, K) {
    var me = state.isDealer, dId = K.dealerId(), isVictim = st.victimId === myPlayerId;
    var dealer = me ? 'You' : esc(K.first(dId) || state.dealerName);
    var drawing = CAST[act.key] || '';
    var chipV = st.victimId ? chipHtml(st.victimId, '') : '', chipD = dId ? chipHtml(dId, '') : chipV;
    o.innerHTML = '<div class="st-stage" id="st-stage" style="visibility:hidden;--dc:' + K.colourOf(dId) + '">' +
      '<div class="st-head"><p class="st-eye">' + (me ? 'You send in' : dealer + ' sends in') + '</p><p class="st-title">' + esc(act.name) + '</p><p class="st-tag">' + esc(act.tag) + '</p></div>' +
      '<div class="st-panel" id="st-panel">' + K.tableHtml(st) + K.RING +
        '<div class="hz-l hz-thief" id="hz-thief"><svg viewBox="0 0 120 160" aria-hidden="true">' + drawing + '</svg></div>' +
        '<div class="hz-line ' + (act.key === 'octopus' ? 'tentacle' : 'tongue') + '" id="hz-line"></div>' +
        '<div class="hz-l hz-chip" id="hz-chip"><span>' + chipV + '<span class="hz-coat" id="hz-coat">' + chipD + '</span></span></div>' +
        '<i class="hz-puff"></i><i class="hz-puff"></i><i class="hz-puff"></i>' +
        '<i class="hz-bub"></i><i class="hz-bub"></i><i class="hz-bub"></i><i class="hz-bub"></i>' +
        '<svg class="hz-glint" id="hz-glint" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0 -9 L0 9 M-9 0 L9 0 M-4 -4 L4 4 M-4 4 L4 -4" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        (act.key === 'auctioneer' ? SAY.map(function (w) { return '<span class="hz-say">' + w + '</span>'; }).join('') : '') +
      '</div>' +
      '<div class="st-cap"><p class="st-res" id="st-res">' + K.resultLine(st) + '</p><p class="st-quote" id="st-quote">“' + esc(st.gloat || 'Mine now.') + '”</p></div>' +
      '</div>';
    var $q = function (s) { return o.querySelector(s); };
    var stage = $q('#st-stage'), panel = $q('#st-panel'), table = o.querySelector('.st-table');
    if (table && table.children.length > 4) table.classList.add('tight');
    var victim = $q('[data-st="victim"]'), tcoat = victim && victim.querySelector('.st-over');
    var thief = $q('#hz-thief'), svg = thief.firstChild, chip = $q('#hz-chip'), coat = $q('#hz-coat'), line = $q('#hz-line'), ring = $q('#st-ring');
    var res = $q('#st-res'), quote = $q('#st-quote');
    var anim = K.animator(startAt), beat = function (b) { if (window.ccBeat) window.ccBeat(b); };

    // Measure the panel: where the chip is, where the table starts, how big the thief can be
    var W = panel.clientWidth, Hh = panel.clientHeight;
    var V = victim ? K.centreIn(victim, panel) : { x: W / 2, y: Hh * 0.7 };
    var tr = table ? K.centreIn(table, panel) : { y: Hh * 0.7, h: 0 }, top = tr.y - tr.h / 2;
    var kz = clamp((top - 12) / 150, 0.62, 1.5);
    var kk = act.k * kz;
    svg.setAttribute('width', (120 * kk).toFixed(1)); svg.setAttribute('height', (160 * kk).toFixed(1));
    svg.style.left = (-60 * kk).toFixed(1) + 'px'; svg.style.top = (-155 * kk).toFixed(1) + 'px';
    if (ring) ring.style.transform = 'translate(' + V.x.toFixed(1) + 'px,' + V.y.toFixed(1) + 'px)';
    var S = script(act, { V: V, W: W, H: Hh, top: top, th: tr.h || 120, kz: kz });
    if (S.front) thief.classList.add('front');
    var part = function (c) { return svg.querySelector('.' + c); };

    var RM = K.reduced();
    if (RM) {
      // Reduce Motion: the thief stands still where it will strike; the chip cross-fades to the dealer's;
      // the result, then the line. Same beats, no movement, no flash.
      var f0 = S.frame(act.key === 'claw' ? 3000 : 3200);
      thief.style.transform = 'translate3d(' + f0.th.x.toFixed(1) + 'px,' + f0.th.y.toFixed(1) + 'px,0) scale(' + f0.th.m + ',1)';
      if (act.key === 'cat') { thief.style.transform = 'translate3d(' + f0.th.x.toFixed(1) + 'px,' + f0.th.y.toFixed(1) + 'px,0) scale(' + f0.th.m + ',1)'; }
      if (ring) { ring.firstChild.style.strokeDashoffset = '0'; anim(ring, [{ opacity: 0 }, { opacity: 1 }], 400, TM.ring, 'ease-out'); }
      anim(thief, [{ opacity: 0 }, { opacity: 1 }], 500, TM.enter0, 'ease-out');
      anim(tcoat, [{ opacity: 0 }, { opacity: 1 }], 700, 4000, 'ease-in-out');
      anim(thief, [{ opacity: 1 }, { opacity: 0 }], 600, TM.exit0, 'ease-in', { fill: 'forwards' });
      anim(res, [{ opacity: 0 }, { opacity: 1 }], 400, TM.result, 'ease-out');
      anim(quote, [{ opacity: 0 }, { opacity: 1 }], 500, TM.gloat, 'ease-out');
      T(function () { stage.style.visibility = ''; beat('steal:full'); }, 0);
      T(function () { beat('steal:snatch'); buzz(isVictim ? [120, 40, 200] : 40); }, 4000);
      T(function () { beat('steal:set'); big(K.SND.clack); }, 4700);
      T(function () { beat('steal:gloat'); big(K.SND.gloat); if (isVictim) buzz([200, 100, 200]); }, TM.gloat);
      return;
    }

    /* Sample every layer from the one clock */
    var STEP = 40, frames = [];
    for (var t = 0; t <= L; t += STEP) frames.push(S.frame(t));
    var kf = function (fn) { return frames.map(function (f, i) { var k = fn(f); k.offset = Math.min(1, i * STEP / L); return k; }); };
    var whole = function (el, fn) { if (el) anim(el, kf(fn), L, 0, 'linear'); };
    whole(thief, function (f) { var th = f.th; return { transform: 'translate3d(' + th.x.toFixed(1) + 'px,' + th.y.toFixed(1) + 'px,0) rotate(' + (th.r || 0).toFixed(2) + 'deg) scale(' + (th.m * th.sx).toFixed(3) + ',' + th.sy.toFixed(3) + ')', opacity: th.o }; });
    var arm = part('hz-arm');
    if (arm) whole(arm, function (f) { return { transform: 'rotate(' + (f.arm || 0).toFixed(2) + 'deg)' }; });
    var pl = part('hz-pl'), pr = part('hz-pr');
    if (pl) whole(pl, function (f) { return { transform: 'rotate(' + (f.pl || 0).toFixed(2) + 'deg)' }; });
    if (pr) whole(pr, function (f) { return { transform: 'rotate(' + (f.pr || 0).toFixed(2) + 'deg)' }; });
    var lids = part('hz-lids');
    if (lids) { lids.style.transformBox = 'fill-box'; lids.style.transformOrigin = '50% 50%'; whole(lids, function (f) { return { transform: 'scaleY(' + (f.lids == null ? 1 : f.lids).toFixed(3) + ')' }; }); }
    var tail = part('hz-tail'); if (tail) whole(tail, function (f) { return { transform: 'rotate(' + (f.tail || 0).toFixed(2) + 'deg)' }; });
    var bag = part('hz-bag'); if (bag) whole(bag, function (f) { return { transform: 'rotate(' + (f.bag || 0).toFixed(2) + 'deg)' }; });
    var throat = part('hz-throat'); if (throat) { throat.style.transformBox = 'fill-box'; throat.style.transformOrigin = '50% 30%'; whole(throat, function (f) { return { transform: 'scale(' + (f.throat || 1).toFixed(3) + ')' }; }); }
    whole(chip, function (f) { var c = f.chip; return { transform: 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0) rotate(' + (c.r || 0).toFixed(1) + 'deg) rotateY(' + (c.ry || 0).toFixed(1) + 'deg) scale(' + (c.s || 1).toFixed(3) + ')', opacity: c.o }; });
    whole(coat, function (f) { var c = f.chip, cl = (clamp(c.clip || 0, 0, 1) * 100).toFixed(1); return { opacity: c.c, clipPath: 'inset(0 ' + cl + '% 0 0)', WebkitClipPath: 'inset(0 ' + cl + '% 0 0)' }; });
    if (S.line) whole(line, function (f) {
      var l = f.line; if (!l) return { opacity: 0, transform: 'translate3d(0,0,0) rotate(0deg) scaleX(.01)' };
      var dx = l.bx - l.ax, dy = l.by - l.ay, len = Math.max(1, Math.hypot(dx, dy));
      return { opacity: 1, transform: 'translate3d(' + l.ax.toFixed(1) + 'px,' + l.ay.toFixed(1) + 'px,0) rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2) + 'deg) scaleX(' + (len / 100).toFixed(3) + ')' };
    });
    if (victim) whole(victim, function (f) { return { opacity: f.tv }; });
    whole(tcoat, function (f) { return { opacity: f.tc }; });
    [].slice.call(o.querySelectorAll('.hz-puff')).forEach(function (el, i) { if (frames.some(function (f) { return f.puffs; })) whole(el, function (f) { var p = f.puffs && f.puffs[i]; return p ? { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) scale(' + p.s.toFixed(3) + ')', opacity: p.o } : { opacity: 0, transform: 'translate3d(-60px,-60px,0)' }; }); });
    [].slice.call(o.querySelectorAll('.hz-bub')).forEach(function (el, i) { if (frames.some(function (f) { return f.bubs; })) whole(el, function (f) { var p = f.bubs && f.bubs[i]; return p ? { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) scale(' + p.s.toFixed(3) + ')', opacity: p.o } : { opacity: 0, transform: 'translate3d(-60px,-60px,0)' }; }); });
    var gl = $q('#hz-glint'); if (frames.some(function (f) { return f.glint; })) whole(gl, function (f) { var g = f.glint; return g ? { transform: 'translate3d(' + g.x.toFixed(1) + 'px,' + g.y.toFixed(1) + 'px,0) scale(' + g.s.toFixed(3) + ')', opacity: g.o } : { opacity: 0 }; });
    // the auctioneer's patter, by his head
    var says = [].slice.call(o.querySelectorAll('.hz-say'));
    if (says.length) {
      var fa = S.frame(TM.held), side = fa.th.m;
      says.forEach(function (el, i) {
        // to the right of his head (the lamp hangs on the left), clear of the panel's edge
        var at = TM.held + 150 + i * 450, x = clamp(fa.th.x + 70 * kk, 70, W - 62), y = Math.max(24, fa.th.y - 172 * kk);
        el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
        anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], i === 2 ? 900 : 430, at, 'ease-out');
      });
    }
    // the pencil ring: around the doomed chip, gone at the grab, around the dealer's chip for the result
    K.ringOn(anim, ring, TM.ring, 600);
    anim(ring, [{ opacity: 1 }, { opacity: 0 }], 200, TM.grab - 150, 'ease-out', { fill: 'forwards' });
    T(function () { if (!ring) return; ring.getAnimations().forEach(function (a) { a.cancel(); }); ring.style.opacity = '1'; K.ringOn(K.animator(startAt), ring, TM.result, 560); }, TM.result - 80);
    anim(res, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 380, TM.result + 250, 'ease-out');
    anim(quote, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], 520, TM.gloat, 'cubic-bezier(.2,.7,.3,1)');

    // Sound and touch, on the beats
    (S.sounds || []).forEach(function (sd) { if (sd[1]) T(function () { big(sd[1]); }, sd[0]); });
    T(function () { stage.style.visibility = ''; beat('steal:full'); buzz(25); big(K.SND.pencil); }, 0);
    T(function () { beat('steal:hover'); big(K.SND.creep); }, TM.enter1);
    T(function () { beat('steal:snatch'); buzz(isVictim ? [120, 40, 200] : 35); }, act.key === 'claw' ? 4000 : TM.take);
    T(function () { beat('steal:paint'); }, TM.held);
    T(function () { beat('steal:set'); big(K.SND.clack); buzz(isVictim ? [80, 40, 80] : 20); }, TM.set);
    T(function () { big(K.SND.pencil); }, TM.result);
    T(function () { beat('steal:gloat'); big(K.SND.gloat); if (isVictim) buzz([200, 100, 200]); }, TM.gloat);
  }

  window.ccHeist = { play: play, count: ACTS.length, names: ACTS.map(function (a) { return a.name; }), keys: ACTS.map(function (a) { return a.key; }), L: L };
})();
