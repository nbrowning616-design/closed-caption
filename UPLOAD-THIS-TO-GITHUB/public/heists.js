/* Closed Caption — THE HEISTS. Thirty ways for the dealer to steal a chip and make it their own.
   Act 0 is The Claw (steal.js). Acts 1..30 live here, in the same order as HEISTS in game.js
   (the server deals them like a deck, so a room sees every heist before any repeats).
   Every heist is a full show on the shared beat (state.steal.at), the same frame on every phone:
     0.0s  the table, the doomed chip trembles, the act's title card
     0.5s  the thief makes its entrance (its own way of moving)
     2.3s  the grab (snatch, tongue, tentacle, tractor beam, lasso…)
     3.4s  into the spotlight: the chip is made the dealer's own (stamped, dunked, licked, zapped…)
     5.2s  set back in its spot, now in the dealer's colour; the thief makes its exit
     6.2s  the gloat card
   Built and wound up before the beat; the beat only shows it. Big sounds on the speaker phone only (big()).
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, big, buzz, tone, noise.
   CSS prefix: hz-. Reuses steal.js's stage, felt and gloat-card styles (st-*). */
(function () {
  'use strict';

  var L = 7600;   // the whole show, ms (index.html STEAL_SHOW_MS; server.js waits the same)
  var TM = { title: 0, enter0: 450, enter1: 2250, grab: 2450, atC: 3350, claim0: 3450, claim1: 5050, back0: 5150, pick: 5300, set: 5800, exit1: 6500, gloat: 6250 };

  /* ── The cast. thief: the emoji; move: how it gets there; grab: how it takes the chip;
        claim: how it makes the chip the dealer's; prop/fx: the claim's tools and confetti. ── */
  var ACTS = [
    null,   // 0: The Claw (steal.js)
    { tag: 'Swoops in. Asks no questions.', thief: '🦅', size: 92, from: 'topright', move: 'swoop', grab: 'carry', claim: 'stamp', prop: '⭐', fx: ['⭐', '✨'], snd: 'screech', exit: 'top' },
    { tag: 'Washes everything first.', thief: '🦝', size: 84, from: 'left', move: 'tiptoe', grab: 'carry', claim: 'dip', prop: '🪣', fx: ['💧', '🫧'], snd: 'creep' },
    { tag: 'Tongue first. Questions later.', thief: '🐸', size: 84, from: 'right', move: 'hop', grab: 'line', line: 'tongue', claim: 'lick', prop: '👅', fx: ['💦', '💧'], snd: 'boing' },
    { tag: 'Not of this table.', thief: '🛸', size: 100, from: 'top', move: 'drift', grab: 'beam', claim: 'zap', prop: '⚡', fx: ['✨', '⚡'], snd: 'ufo', exit: 'top' },
    { tag: 'Nothing up the sleeve. Except your chip.', thief: '🎩', size: 88, from: 'bottom', move: 'rise', grab: 'levitate', claim: 'sparkle', prop: '🪄', fx: ['✨', '🐇', '⭐'], snd: 'magic', exit: 'bottom' },
    { tag: 'Eight arms. One chip.', thief: '🐙', size: 92, from: 'bottom', move: 'rise', grab: 'line', line: 'tentacle', claim: 'splat', prop: null, fx: ['💧', '🫧'], snd: 'blub', exit: 'bottom' },
    { tag: 'Patience. Bait. Theft.', thief: '🎣', size: 84, from: 'top', move: 'drift', grab: 'line', line: 'fishing', claim: 'sticker', prop: '🏷️', fx: ['🐟', '💧'], snd: 'reel', exit: 'top' },
    { tag: 'It’s just physics.', thief: '🧲', size: 84, from: 'right', move: 'glide', grab: 'line', line: 'magnet', claim: 'zap', prop: '⚡', fx: ['⚡', '✨'], snd: 'hum' },
    { tag: 'Sweetie, that’s mine.', thief: '👵', size: 84, from: 'left', move: 'tiptoe', grab: 'carry', claim: 'smooch', prop: '💋', fx: ['💕', '💋'], snd: 'creep' },
    { tag: 'Knocks things off tables. Professionally.', thief: '🐈', size: 88, from: 'right', move: 'tiptoe', grab: 'carry', claim: 'sit', prop: null, fx: ['🐾', '💤'], snd: 'creep' },
    { tag: 'Squawk first, ask later.', thief: '🦜', size: 86, from: 'topleft', move: 'swoop', grab: 'carry', claim: 'stamp', prop: '☠️', fx: ['🪶', '✨'], snd: 'screech', exit: 'top' },
    { tag: 'You will not see this.', thief: '🥷', size: 84, from: 'left', move: 'teleport', grab: 'carry', claim: 'swirl', prop: null, fx: ['💨', '✨'], snd: 'ninja', exit: 'poof' },
    { tag: 'Act of God. Allegedly.', thief: '🌪️', size: 96, from: 'left', move: 'spin', grab: 'carry', claim: 'swirl', prop: null, fx: ['🍂', '💨'], snd: 'wind' },
    { tag: 'Very good boy. Very bad manners.', thief: '🐕', size: 88, from: 'left', move: 'zigzag', grab: 'carry', claim: 'lick', prop: '👅', fx: ['💦', '🦴'], snd: 'yip' },
    { tag: 'Boo. Also: yoink.', thief: '👻', size: 88, from: 'right', move: 'drift', grab: 'levitate', claim: 'swirl', prop: null, fx: ['✨', '💀'], snd: 'spooky', exit: 'fade' },
    { tag: 'T-minus your chip.', thief: '🚀', size: 88, from: 'left', move: 'zoom', grab: 'carry', claim: 'iron', prop: '🔥', fx: ['💨', '🔥'], snd: 'rocket', exit: 'top' },
    { tag: 'Billable hours: one chip.', thief: '💼', size: 80, from: 'right', move: 'tiptoe', grab: 'carry', claim: 'stamp', prop: '⚖️', fx: ['📄', '✨'], snd: 'creep' },
    { tag: 'Sideways. Always sideways.', thief: '🦀', size: 84, from: 'right', move: 'crawl', grab: 'carry', claim: 'sticker', prop: null, fx: ['💥', '✨'], snd: 'clack', noFlip: true },
    { tag: 'Tiny arms. Big ambitions.', thief: '🦖', size: 104, from: 'left', move: 'stomp', grab: 'carry', claim: 'stamp', prop: '🦶', fx: ['💥', '🌿'], snd: 'stomp' },
    { tag: 'He’s been on his way since round one.', thief: '🐌', size: 80, from: 'right', move: 'crawl', grab: 'carry', claim: 'trail', prop: null, fx: ['💚', '✨'], snd: 'slow' },
    { tag: 'Like a french fry at the beach.', thief: '🐦', size: 82, from: 'topright', move: 'swoop', grab: 'carry', claim: 'splat', prop: null, splat: '#FFFFFF', fx: ['💦', '🪶'], snd: 'screech', exit: 'top' },
    { tag: 'Bzzzzzzz.', thief: '🦟', size: 70, from: 'left', move: 'zigzag', grab: 'carry', claim: 'zap', prop: '⚡', fx: ['⚡', '✨'], snd: 'mosquito' },
    { tag: 'A wizard steals precisely when he means to.', thief: '🧙', size: 88, from: 'left', move: 'drift', grab: 'beam', beam: 'magic', claim: 'sparkle', prop: '🪄', fx: ['✨', '⭐', '🌟'], snd: 'magic' },
    { tag: 'BEEP. BOOP. YOINK.', thief: '🤖', size: 86, from: 'right', move: 'march', grab: 'line', line: 'grabber', claim: 'laser', prop: null, fx: ['⚙️', '✨'], snd: 'robot' },
    { tag: 'Sticky fingers. Literally.', thief: '🐝', size: 74, from: 'right', move: 'zigzag', grab: 'carry', claim: 'dip', prop: '🍯', fx: ['💛', '✨'], snd: 'buzz' },
    { tag: 'Swings in from nowhere.', thief: '🐒', size: 90, from: 'top', move: 'swing', grab: 'carry', claim: 'sticker', prop: '🍌', fx: ['🍌', '✨'], snd: 'monkey', exit: 'top' },
    { tag: 'This table ain’t big enough.', thief: '🤠', size: 88, from: 'left', move: 'hop', grab: 'line', line: 'lasso', claim: 'iron', prop: '🔥', fx: ['💨', '⭐'], snd: 'yeehaw' },
    { tag: 'Only comes out at game night.', thief: '🧛', size: 88, from: 'right', move: 'drift', grab: 'carry', claim: 'sparkle', prop: '🦇', fx: ['🦇', '🩸'], snd: 'spooky' },
    { tag: 'Magic is just stealing with glitter.', thief: '🦄', size: 92, from: 'left', move: 'hop', grab: 'carry', claim: 'sparkle', prop: '🌈', fx: ['✨', '🌈', '💖'], snd: 'magic' },
    { tag: 'Cold. Calculated. Adorable.', thief: '🐧', size: 86, from: 'right', move: 'slide', grab: 'carry', claim: 'dip', prop: '🧊', fx: ['❄️', '✨'], snd: 'slide' },
  ];

  var CSS = [
    '.hz-layer{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform,opacity;}',
    '.hz-thief{z-index:6;}',
    '.hz-face{position:absolute;left:0;top:0;transform:translate(-50%,-55%);line-height:1;font-size:var(--sz,84px);filter:drop-shadow(0 8px 8px rgba(0,0,0,.55));user-select:none;}',
    '.hz-held{z-index:5;opacity:0;}',
    '.hz-chipw{position:absolute;left:-23px;top:-23px;width:46px;height:46px;}',
    '.hz-chipw .chip{position:absolute;left:0;top:0;margin:0;box-shadow:0 3px 0 rgba(0,0,0,.55);}',
    '.hz-coat{position:absolute;left:0;top:0;width:46px;height:46px;opacity:0;}',
    '.hz-coat .chip{box-shadow:0 3px 0 rgba(0,0,0,.55),inset 0 0 0 1.5px rgba(255,255,255,.35);}',
    '.hz-prop{z-index:7;opacity:0;}',
    '.hz-prop span{position:absolute;left:0;top:0;transform:translate(-50%,-50%);line-height:1;font-size:var(--sz,64px);filter:drop-shadow(0 6px 6px rgba(0,0,0,.5));}',
    '.hz-line{position:absolute;left:0;top:0;height:8px;width:100px;margin-top:-4px;transform-origin:0 50%;z-index:5;opacity:0;border-radius:6px;will-change:transform,opacity;}',
    '.hz-line.tongue{height:12px;margin-top:-6px;background:linear-gradient(180deg,#ff8fb0,#e84a7a);border:2px solid #1F1A17;}',
    '.hz-line.tentacle{height:14px;margin-top:-7px;background:radial-gradient(circle at 50% 75%,#f7b3e0 0 2.2px,transparent 2.6px) 0 0/11px 14px,linear-gradient(180deg,#c06ad6,#8a3aa8);border:2px solid #1F1A17;}',
    '.hz-line.fishing{height:2px;margin-top:-1px;background:#e8e2d4;border-radius:0;box-shadow:0 0 4px rgba(255,255,255,.4);}',
    '.hz-line.magnet{height:10px;margin-top:-5px;background:repeating-linear-gradient(90deg,#7fd8ff 0 8px,transparent 8px 16px);border-radius:0;box-shadow:0 0 12px #39b8ff;}',
    '.hz-line.grabber{height:10px;margin-top:-5px;background:linear-gradient(180deg,#e9eef2,#7d8894);border:2px solid #1F1A17;border-radius:3px;}',
    '.hz-line.lasso{height:5px;margin-top:-2.5px;background:repeating-linear-gradient(60deg,#c99a5b 0 4px,#8a6331 4px 7px);border-radius:3px;}',
    '.hz-line.laser{height:4px;margin-top:-2px;background:#ff3b30;box-shadow:0 0 10px 3px rgba(255,59,48,.8);border-radius:2px;}',
    '.hz-loop{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:5px solid #b07f45;opacity:0;z-index:6;}',
    '.hz-beam{z-index:4;opacity:0;}',
    '.hz-beam i{position:absolute;left:-75px;top:0;width:150px;height:var(--bh,160px);clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);background:linear-gradient(180deg,rgba(160,255,190,.75),rgba(160,255,190,.12));}',
    '.hz-beam.magic i{background:linear-gradient(180deg,rgba(200,150,255,.8),rgba(200,150,255,.1));}',
    '.hz-fx{position:absolute;inset:0;z-index:8;pointer-events:none;overflow:hidden;}',
    '.hz-fx span{position:absolute;left:0;top:0;font-size:24px;line-height:1;opacity:0;will-change:transform,opacity;}',
    '.hz-ring{position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;border:4px solid #FFF8EA;opacity:0;z-index:7;}',
    '.hz-cloud{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#e8e2ef 70%);opacity:0;z-index:7;}',
    '.hz-splat{position:absolute;left:-40px;top:-40px;width:80px;height:80px;opacity:0;z-index:7;}',
    '.hz-spot{position:absolute;left:-1100px;top:-1100px;width:2200px;height:2200px;z-index:3;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 50%,rgba(8,5,4,0) 0,rgba(8,5,4,0) 80px,rgba(8,5,4,.55) 190px,rgba(8,5,4,.65) 100%);}',
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

  /* ── Sounds (all inside big(): speaker phone only). tone(freq, sec, delayMs, type, vol, glideTo); noise(sec, delayMs, vol, freq, filter) ── */
  var MOVE_SND = {
    screech: function () { tone(2400, 0.5, 0, 'sawtooth', 0.03, 1300); noise(0.6, 0, 0.12, 3000, 'bandpass'); tone(2100, 0.35, 700, 'sawtooth', 0.025, 1500); },
    creep: function () { [0, 1, 2, 3, 4, 5].forEach(function (i) { tone([196, 233, 196, 262, 196, 233][i], 0.12, i * 270, 'triangle', 0.07); }); },
    boing: function () { [0, 1, 2, 3].forEach(function (i) { tone(180, 0.28, i * 430, 'sine', 0.12, 520); }); },
    ufo: function () { for (var i = 0; i < 12; i++) tone(i % 2 ? 620 : 880, 0.14, i * 140, 'sine', 0.05, i % 2 ? 880 : 620); },
    magic: function () { [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, 0.25, i * 90, 'triangle', 0.05); }); },
    blub: function () { [0, 1, 2, 3, 4].forEach(function (i) { tone(300 + i * 40, 0.12, i * 300, 'sine', 0.1, 700); }); },
    reel: function () { noise(1.1, 0, 0.08, 3500, 'bandpass'); tone(900, 1.0, 0, 'square', 0.012, 1300); },
    hum: function () { tone(110, 1.6, 0, 'sawtooth', 0.04, 220); tone(55, 1.6, 0, 'sine', 0.08); },
    ninja: function () { noise(0.15, 0, 0.3, 2500, 'highpass'); noise(0.15, 650, 0.3, 2500, 'highpass'); noise(0.15, 1300, 0.3, 2500, 'highpass'); },
    wind: function () { noise(1.8, 0, 0.25, 600, 'bandpass'); tone(300, 1.8, 0, 'sine', 0.03, 900); },
    yip: function () { [0, 1, 2].forEach(function (i) { tone(900, 0.08, i * 380, 'square', 0.05, 1400); tone(1100, 0.07, i * 380 + 90, 'square', 0.04, 1600); }); },
    spooky: function () { tone(440, 1.6, 0, 'sine', 0.06, 330); tone(445, 1.6, 0, 'sine', 0.04, 600); },
    rocket: function () { noise(0.9, 1300, 0.4, 900, 'lowpass'); tone(120, 0.9, 1300, 'sawtooth', 0.05, 900); },
    clack: function () { for (var i = 0; i < 10; i++) noise(0.03, i * 170, 0.25, 3000, 'bandpass'); },
    stomp: function () { [0, 1, 2, 3].forEach(function (i) { tone(60, 0.35, i * 450, 'sine', 0.4, 38); noise(0.2, i * 450, 0.3, 300, 'lowpass'); }); },
    slow: function () { tone(220, 1.7, 0, 'triangle', 0.04, 210); },
    mosquito: function () { tone(620, 1.8, 0, 'sawtooth', 0.03, 700); tone(640, 1.8, 0, 'sawtooth', 0.02, 610); },
    robot: function () { [0, 1, 2, 3, 4, 5].forEach(function (i) { tone(i % 2 ? 330 : 440, 0.1, i * 300, 'square', 0.04); noise(0.05, i * 300, 0.2, 1800, 'bandpass'); }); },
    buzz: function () { tone(210, 1.8, 0, 'sawtooth', 0.04, 240); },
    monkey: function () { [0, 1, 2, 3].forEach(function (i) { tone(700, 0.12, i * 200, 'square', 0.04, 1100); }); },
    yeehaw: function () { [0, 1, 2, 3].forEach(function (i) { tone(i % 2 ? 330 : 247, 0.1, i * 430, 'triangle', 0.08); noise(0.06, i * 430, 0.25, 900, 'lowpass'); }); },
    slide: function () { noise(1.1, 300, 0.12, 2000, 'bandpass'); tone(700, 1.1, 300, 'sine', 0.03, 300); },
  };
  var CLAIM_SND = {
    stamp: function () { noise(0.2, 0, 0.6, 400, 'lowpass'); tone(80, 0.35, 0, 'sine', 0.4, 45); },
    dip: function () { noise(0.4, 0, 0.35, 900, 'bandpass'); tone(400, 0.2, 0, 'sine', 0.08, 180); tone(300, 0.25, 600, 'sine', 0.08, 900); },
    lick: function () { noise(0.35, 0, 0.3, 1500, 'bandpass'); tone(600, 0.35, 0, 'sine', 0.06, 250); noise(0.35, 500, 0.3, 1500, 'bandpass'); tone(600, 0.35, 500, 'sine', 0.06, 250); },
    zap: function () { for (var i = 0; i < 4; i++) { noise(0.12, i * 220, 0.4, 5000, 'highpass'); tone(1800, 0.1, i * 220, 'sawtooth', 0.05, 200); } },
    sparkle: function () { [1047, 1319, 1568, 2093, 1568, 2093, 2637].forEach(function (f, i) { tone(f, 0.3, i * 80, 'sine', 0.05); }); noise(0.5, 650, 0.2, 2000, 'lowpass'); },
    splat: function () { noise(0.25, 0, 0.5, 700, 'lowpass'); tone(200, 0.2, 0, 'sine', 0.2, 60); },
    sticker: function () { noise(0.08, 0, 0.6, 2500, 'bandpass'); tone(150, 0.12, 0, 'sine', 0.3); },
    smooch: function () { [0, 1, 2].forEach(function (i) { tone(900, 0.12, i * 300, 'sine', 0.08, 1500); noise(0.05, i * 300 + 100, 0.2, 3000, 'highpass'); }); },
    sit: function () { tone(200, 0.4, 0, 'sine', 0.15, 90); noise(0.3, 0, 0.2, 500, 'lowpass'); tone(400, 0.15, 900, 'sine', 0.08, 800); },
    swirl: function () { tone(300, 1.0, 0, 'sine', 0.06, 1800); noise(1.0, 0, 0.12, 1200, 'bandpass'); },
    iron: function () { if (kit().hiss) kit().hiss(900); else noise(0.9, 0, 0.2, 6000, 'highpass'); tone(90, 0.2, 0, 'sine', 0.3, 50); },
    trail: function () { tone(180, 1.0, 0, 'triangle', 0.05, 160); noise(1.0, 0, 0.08, 400, 'lowpass'); },
    laser: function () { tone(2200, 0.9, 0, 'square', 0.03, 1900); noise(0.9, 0, 0.08, 6000, 'highpass'); },
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
    var head = isVictim ? 'That was YOUR chip.' : dealer + ' stole ' + esc(nameOf(st.victimId)) + '’s chip';
    var dc = K.colourOf && K.dealerId ? K.colourOf(K.dealerId()) : '#E8453A';
    var fxN = 26, fx = ''; for (var i = 0; i < fxN; i++) fx += '<span></span>';
    o.innerHTML = '<div class="st-stage" id="st-stage" style="visibility:hidden;--dc:' + dc + '">' +
      '<div class="st-head" id="st-head"><p class="st-eyebrow">' + (me ? 'You send in' : dealer + ' sends in') + '</p><p class="h2 st-title">' + name + '</p><p class="small" style="color:rgba(255,248,234,.7);font-weight:800;margin-top:4px;">' + esc(act.tag) + '</p></div>' +
      '<div class="st-rail"><div class="st-felt">' + rows + '</div></div>' +
      '<div class="hz-spot" id="hz-spot"></div>' +
      '<div class="hz-layer" id="hz-shadow-l"><div class="hz-shadow"></div></div>' +
      '<div class="hz-layer hz-beam ' + (act.beam || '') + '" id="hz-beam"><i></i></div>' +
      '<div class="hz-line ' + (act.line || 'tongue') + '" id="hz-line"></div>' +
      '<div class="hz-line laser" id="hz-laser"></div>' +
      '<div class="hz-layer hz-held" id="hz-held"><div class="hz-chipw" id="hz-chipw"></div></div>' +
      '<div class="hz-layer hz-thief" id="hz-thief"><div class="hz-face" style="--sz:' + (act.size || 84) + 'px">' + act.thief + '</div></div>' +
      '<div class="hz-layer hz-prop" id="hz-prop"><span style="--sz:' + (act.claim === 'lick' ? 80 : 60) + 'px">' + (act.prop || '') + '</span></div>' +
      '<div class="hz-layer" id="hz-fxl" style="z-index:7"><i class="hz-ring" id="hz-ring"></i><i class="hz-loop" id="hz-loop"></i>' +
        '<svg class="hz-splat" id="hz-splat" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8 C46 20 52 10 56 22 C66 18 64 30 72 34 C64 40 74 48 64 52 C68 62 56 60 52 70 C46 62 40 74 34 66 C26 72 24 60 16 60 C20 50 8 46 16 38 C8 32 18 24 24 26 C24 14 34 18 40 8 Z" fill="' + (act.splat || dc) + '" stroke="#1F1A17" stroke-width="2.5"/></svg>' +
        '<i class="hz-cloud" id="hz-c1"></i><i class="hz-cloud" id="hz-c2"></i><i class="hz-cloud" id="hz-c3"></i><i class="hz-cloud" id="hz-c4"></i></div>' +
      '<div class="hz-fx" id="hz-fx">' + fx + '</div>' +
      '<div class="st-veil" id="st-veil"></div>' +
      '<div class="st-gloat" id="st-gloat"><i class="st-bulbs t"></i><i class="st-bulbs b"></i>' +
        '<p class="st-g-eye">' + name + ' strikes</p><p class="st-g-head">' + head + '</p>' +
        '<p class="st-quote">“' + esc(st.gloat || 'Mine now.') + '”</p><p class="st-by">— ' + (me ? 'you' : esc(state.dealerName)) + '</p>' +
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
      T(function () { beat('steal:paint'); paintInPlace(); if (victim) fade(victim.lastElementChild, 500); big(CLAIM_SND[act.claim] || CLAIM_SND.stamp); }, 900);
      T(function () { beat('steal:set'); if (victim) victim.classList.remove('st-doomed'); }, 1500);
      T(function () { beat('steal:gloat'); head.style.opacity = '0'; fade(veil, 400); fade(gl, 400); big(K.SND ? K.SND.gloat : function () {}); if (isVictim) buzz([300, 100, 300]); }, 1700);
      return;
    }

    /* ── Particles: emoji confetti from a point ── */
    var fxPool = [].slice.call(o.querySelectorAll('#hz-fx span')), fxI = 0;
    function puff(x, y, list, n, spread, dur, rise) {
      for (var i = 0; i < n; i++) {
        var el = fxPool[fxI++ % fxPool.length]; if (!el) return;
        el.textContent = list[i % list.length];
        var a = rnd() * Math.PI * 2, d = spread * (0.5 + rnd()), dx = Math.cos(a) * d, dy = Math.sin(a) * d - (rise || 0), s = 0.6 + rnd() * 0.8;
        try { el.getAnimations().forEach(function (q) { q.cancel(); }); } catch (e) {}
        el.animate([{ transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(.3)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.9, offset: 0.7 },
          { transform: 'translate3d(' + (x + dx).toFixed(1) + 'px,' + (y + dy).toFixed(1) + 'px,0) scale(' + s.toFixed(2) + ') rotate(' + ((rnd() - 0.5) * 120).toFixed(0) + 'deg)', opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      }
    }
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
    var flipOf = function (dx) { return act.noFlip || !dx ? 1 : (dx > 0 ? -1 : 1); };   // most emoji face left
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
        T(function () { puff(p.x, p.y, ['💨'], 4, 40, 500, 0); }, t0);
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
      for (var sp = 0; sp < 6; sp++) T((function (k) { return function () { puff(lerp(V.x, under.x, k / 6), lerp(V.y, under.y, k / 6), ['✨'], 2, 30, 600, 0); }; })(sp), TM.grab + sp * 110);
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
      if (ex === 'poof') T(function () { puff(V.x, V.y - 90, ['💨'], 6, 50, 600, 0); }, TM.exit1 - 250);
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
    spot.style.transform = 'translate3d(' + C.x + 'px,' + C.y + 'px,0)';
    anim(spot, [{ opacity: 0 }, { opacity: 1 }], 350, TM.atC - 250, 'ease-out');
    anim(spot, [{ opacity: 1 }, { opacity: 0 }], 400, TM.claim1 + 50, 'ease-in', { fill: 'forwards' });
    T(function () { spot.style.opacity = '0'; }, TM.claim1 + 460);

    function claim(kind) {
      var c0 = TM.claim0, R = 23 * KC, fx = act.fx || ['✨'];
      S(c0 + 300, CLAIM_SND[kind] || CLAIM_SND.stamp);
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
      big(function () { if (K.SND) K.SND.pop(); noise(0.12, 0, 0.4, 1200, 'bandpass'); tone(500, 0.18, 0, 'triangle', 0.12, 900); });
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
    anim(gl, [{ opacity: 0, transform: 'translateY(-50%) scale(.55) rotate(4deg)' }, { opacity: 1, transform: 'translateY(-50%) scale(1.06) rotate(-2.5deg)', offset: 0.55 }, { opacity: 1, transform: 'translateY(-50%) scale(1) rotate(-2deg)' }], 520, TM.gloat, 'cubic-bezier(.2,.8,.3,1)');
    T(function () {
      beat('steal:gloat');
      if (window.ccPunch) window.ccPunch(gl.querySelector('.st-quote'));
      big(function () { if (K.SND) K.SND.gloat(); });
      if (isVictim) { document.body.classList.remove('quake'); void document.body.offsetWidth; document.body.classList.add('quake'); buzz([300, 100, 300, 100, 600]); setTimeout(function () { document.body.classList.remove('quake'); }, 1300); }
    }, TM.gloat);
  }

  window.ccHeist = { play: play, count: ACTS.length - 1 };
})();
