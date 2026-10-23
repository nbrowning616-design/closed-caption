/* Closed Caption steal film: contraption (built by the animation team, Oct 2026) */
/*
 * Closed Caption - "steal" moment - concept: CONTRAPTION (Rube Goldberg chain)
 *
 * Storyboard (ms). World = side-view machine on a pegboard ABOVE a top-down felt table.
 * Camera = translate/scale of one world group, smooth Catmull-Rom through keyframes.
 *
 *  1.     0 -  900  TABLE. Felt table, caption rows 1/2/3/CC with chips. A dashed spotlight
 *                   ring snaps onto Nate's chip; other chips dim; Nate's chip does a nervous gulp.
 *  2.   860 - 1620  REVEAL. Camera glides up off the table to a pegboard machine wearing Nick's chip badge.
 *  3.  1560 - 1870  PLUNGER. Spring plunger pulls back (anticipation), shivers, fires; marble launches.
 *  4.  1870 - 3240  ZIGZAG. Marble rolls 3 ramps (accelerating, rolling stripe), bonks the end walls
 *                   with squash, drops ramp to ramp; camera drifts with it.
 *  5.  3240 - 3560  BUCKET. Marble hops into a tipping bucket; bucket sways, tips; the string goes taut
 *                   over a pulley and yanks the pin out from under a little trapdoor shelf.
 *  6.  3560 - 3990  DUCK. Trapdoor swings away; the toy duck hangs in mid-air (cartoon beat), looks down,
 *                   gulps, stretches... and drops.
 *  7.  3990 - 4150  BELLOWS. Duck lands on the bellows (squash on both); nozzle - aimed at Nate's chip -
 *                   puffs, firing a blob of Nick's paint from the paint tin.
 *  8.  4150 - 5150  FLIGHT. Blob arcs down out of the machine, stretching with speed; camera chases it
 *                   back to the table; its shadow grows on Nate's chip.
 *  9.  5150 - 5720  SPLAT (extra beat 1). Splat + droplets, chip squashes, Nick's colour floods the chip
 *                   from the impact point, "Na" spins out, "Ni" pops in.
 * 10.  5800 - 6750  HOP & SET DOWN (extra beat 2). Chip crouches, hops up toward camera with a coin flip,
 *                   lands exactly in its original spot - squash, dust ring, pink ring flash, settle.
 * 11.  6450 - 7000  Camera eases back to the full table; other chips undim.
 * 12.  7000 - 7250  Stillness.
 * 13.  7250 -10000  "Nick stole Nate's chip." rises in and holds (2.5 s).  TOTAL 10.0 s
 */
window.CCSteal2_contraption = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', FELT = '#2F6B52', FELT_D = '#1F4A37';
  var WOOD = '#DDA867', WOOD_D = '#B67C43', BOARD = '#F3E3C3', BRASS = '#E2B24C';
  var LEATHER = '#B5603F', DUCK = '#F7C948', BEAK = '#EE8A2A', MARBLE = '#7FA3C7';
  var FONT = 'Fredoka, Nunito, "Trebuchet MS", system-ui, sans-serif';
  var T_END = 10000, W = 390, H = 700, CR = 25, uid = 0;

  // ---------- math ----------
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function eo(u) { return 1 - Math.pow(1 - u, 3); }
  function ei(u) { return u * u; }
  function eback(u) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  // decaying oscillation starting at 0 (s = seconds since start)
  function wob(s, amp, k, w) { return s <= 0 ? 0 : amp * Math.exp(-k * s) * Math.sin(w * s); }
  function rot(x, y, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function f(n) { return Math.round(n * 100) / 100; }

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function inkd(extra) { var o = { stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }; for (var k in extra) o[k] = extra[k]; return o; }

  function initials(name, opts) {
    var d = opts.dealer || 'Nick', v = opts.victim || 'Nate';
    var share = Array.from(d)[0].toUpperCase() === Array.from(v)[0].toUpperCase();
    if (share && (name === d || name === v)) return Array.from(name)[0].toUpperCase() + name.slice(1, 2).toLowerCase();
    return Array.from(name)[0].toUpperCase();
  }

  // ---------- chip ----------
  function chipFace(parent, color, r) {
    S('circle', { r: r, fill: color }, parent);
    S('circle', { r: r * 0.72, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.8, 'stroke-dasharray': '4.2 3.3' }, parent);
    S('path', { d: 'M' + (-r * 0.62) + ' ' + (-r * 0.2) + ' A ' + r * 0.66 + ' ' + r * 0.66 + ' 0 0 1 ' + (-r * 0.1) + ' ' + (-r * 0.66), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
  }
  function chipText(parent, txt, r) {
    var t = S('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', y: 1, fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? r * 0.7 : r * 0.82 }, parent);
    t.textContent = txt;
    return t;
  }

  // ---------- build ----------
  function build(el, opts) {
    while (el.firstChild) el.removeChild(el.firstChild);
    uid++;
    var id = 'cc2-contraption-' + uid;
    var dealer = opts.dealer || 'Nick', victim = opts.victim || 'Nate';
    var dCol = opts.dealerColor || '#E8559E', vCol = opts.victimColor || '#2F6FE0';
    var cards = opts.cards || [];

    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', 'class': 'cc2-contraption-svg' });
    svg.style.display = 'block';
    el.appendChild(svg);
    var defs = S('defs', {}, svg);
    var pat = S('pattern', { id: id + 'peg', width: 22, height: 22, patternUnits: 'userSpaceOnUse' }, defs);
    S('circle', { cx: 11, cy: 11, r: 1.7, fill: '#D9C49C' }, pat);

    S('rect', { x: -2000, y: -2000, width: 4400, height: 4400, fill: PAPER }, svg);
    var world = S('g', {}, svg);
    var screen = S('g', {}, svg);

    // ===== TABLE (top-down) =====
    var FT = 112, FB = 684;
    S('rect', { x: 14, y: FT + 5, width: 362, height: FB - FT, rx: 28, fill: INK, opacity: 0.16 }, world);
    S('rect', inkd({ x: 14, y: FT, width: 362, height: FB - FT, rx: 28, fill: FELT, 'stroke-width': 2.6 }), world);
    S('rect', { x: 24, y: FT + 10, width: 342, height: FB - FT - 20, rx: 20, fill: 'none', stroke: '#FFF8EA', 'stroke-opacity': 0.22, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }, world);

    var n = Math.max(1, cards.length);
    var gap = 14, avail = FB - FT - 48;
    var ch = Math.min(104, (avail - gap * (n - 1)) / n);
    var total = ch * n + gap * (n - 1);
    var top0 = FT + (FB - FT - total) / 2;
    var chipXs = [[268], [218, 290], [176, 248, 320]];
    var tableG = S('g', {}, world);
    var others = S('g', {}, world);
    var target = null;
    var cardLayer = S('g', {}, tableG);
    var chipLayer = S('g', {}, others);
    for (var i = 0; i < cards.length; i++) {
      var cy = top0 + i * (ch + gap) + ch / 2;
      S('rect', { x: 30, y: cy - ch / 2 + 4, width: 330, height: ch, rx: 14, fill: FELT_D, opacity: 0.55 }, cardLayer);
      S('rect', inkd({ x: 30, y: cy - ch / 2, width: 330, height: ch, rx: 14, fill: PAPER }), cardLayer);
      S('circle', { cx: 64, cy: cy, r: 18, fill: INK }, cardLayer);
      var lb = S('text', { x: 64, y: cy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': String(cards[i].label).length > 1 ? 14 : 18 }, cardLayer);
      lb.textContent = cards[i].label;
      S('rect', { x: 94, y: cy - 10, width: 46, height: 7, rx: 3.5, fill: '#E9DCC2' }, cardLayer);
      S('rect', { x: 94, y: cy + 4, width: 32, height: 7, rx: 3.5, fill: '#E9DCC2' }, cardLayer);
      var chips = (cards[i].chips || []).slice(0, 3);
      var xs = chipXs[Math.max(0, chips.length - 1)];
      for (var j = 0; j < chips.length; j++) {
        var c = chips[j], cx = xs[j];
        if (c.target) { target = { x: cx, y: cy, name: c.name, color: c.color || vCol }; continue; }
        S('circle', { cx: cx + 1.5, cy: cy + 4, r: CR, fill: INK, opacity: 0.22 }, chipLayer);
        var g = S('g', { transform: 'translate(' + cx + ' ' + cy + ')' }, chipLayer);
        chipFace(g, c.color, CR);
        chipText(g, initials(c.name, opts), CR);
        S('circle', inkd({ r: CR, fill: 'none', 'stroke-width': 2.4 }), g);
      }
    }
    if (!target) target = { x: 268, y: top0 + ch / 2, name: victim, color: vCol };
    var TX = target.x, TY = target.y;
    var oldTxt = initials(victim, opts), newTxt = initials(dealer, opts);

    // spotlight ring (under the chip)
    var spot = S('g', { transform: 'translate(' + TX + ' ' + TY + ')' }, world);
    var spotRing = S('circle', { r: 36, fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' }, spot);
    var flashRing = S('circle', { r: 30, fill: 'none', stroke: dCol, 'stroke-width': 4, opacity: 0 }, world);
    flashRing.setAttribute('cx', TX); flashRing.setAttribute('cy', TY);
    var dustRing = S('circle', { cx: TX, cy: TY, r: 28, fill: 'none', stroke: PAPER, 'stroke-width': 3, opacity: 0 }, world);

    // target chip
    var tShadow = S('circle', { r: CR, fill: INK, opacity: 0.22 }, world);
    var blobShadow = S('ellipse', { cx: TX, cy: TY, rx: 10, ry: 9, fill: INK, opacity: 0 }, world);
    var tG = S('g', {}, world);
    var tIn = S('g', {}, tG);
    chipFace(tIn, target.color, CR);
    var clip = S('clipPath', { id: id + 'clip' }, defs);
    var clipC = S('circle', { cx: 0, cy: 0, r: 0 }, clip);
    var over = S('g', { 'clip-path': 'url(#' + id + 'clip)' }, tIn);
    chipFace(over, dCol, CR);
    var tOld = chipText(tIn, oldTxt, CR);
    var tNew = chipText(tIn, newTxt, CR);
    S('circle', inkd({ r: CR, fill: 'none', 'stroke-width': 2.4 }), tIn);
    // move blobShadow above chip
    tG.appendChild(blobShadow);

    // splat + droplets (above chip)
    var splatG = S('g', { transform: 'translate(' + TX + ' ' + TY + ')' }, world);
    var sp = '';
    for (var k = 0; k < 16; k++) {
      var a = k / 16 * Math.PI * 2, rr = (k % 2 ? 19 : 29) + (k % 4 === 0 ? 4 : 0);
      sp += (k ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr);
    }
    var splat = S('path', inkd({ d: sp + 'Z', fill: dCol, opacity: 0 }), splatG);
    var drops = [];
    for (k = 0; k < 7; k++) {
      var dd = S('circle', inkd({ r: 4.5, fill: dCol, 'stroke-width': 1.6, opacity: 0 }), splatG);
      drops.push({ el: dd, a: (k / 7) * Math.PI * 2 + 0.4 + (k % 2) * 0.2, d: 38 + (k * 13 % 17) });
    }

    // ===== MACHINE (side view, above the table) =====
    var M = S('g', {}, world);
    S('rect', { x: 18, y: -626, width: 354, height: 590, rx: 18, fill: INK, opacity: 0.12 }, M);
    S('rect', inkd({ x: 18, y: -630, width: 354, height: 590, rx: 18, fill: BOARD }), M);
    S('rect', { x: 26, y: -622, width: 338, height: 574, rx: 12, fill: 'url(#' + id + 'peg)' }, M);
    // hanging hooks: board hangs from the top of the screen
    // Nick's maker badge
    var badge = S('g', { transform: 'translate(306 -592)' }, M);
    chipFace(badge, dCol, 17); chipText(badge, newTxt, 17);
    S('circle', inkd({ r: 17, fill: 'none' }), badge);

    // ramps
    var MR = 9;
    var ramps = [
      { a: [58, -515], b: [268, -490] },
      { a: [278, -452], b: [64, -427] },
      { a: [56, -388], b: [270, -362] }
    ];
    function surfY(R, x) { var u = (x - R.a[0]) / (R.b[0] - R.a[0]); return lerp(R.a[1], R.b[1], u); }
    function onRamp(R, x) { // marble centre on ramp at x
      var dx = R.b[0] - R.a[0], dy = R.b[1] - R.a[1], L = Math.sqrt(dx * dx + dy * dy);
      var nx = dy / L, ny = -dx / L; if (ny > 0) { nx = -nx; ny = -ny; }
      // find surface point p such that p + n*r has x-coordinate x
      var px = x - nx * MR;
      return [x, surfY(R, px) + ny * MR];
    }
    ramps.forEach(function (R, idx) {
      var p = R.a[0] + ',' + R.a[1] + ' ' + R.b[0] + ',' + R.b[1] + ' ' + R.b[0] + ',' + (R.b[1] + 9) + ' ' + R.a[0] + ',' + (R.a[1] + 9);
      S('polygon', inkd({ points: p, fill: WOOD }), M);
      // pegs
      var m1 = lerp(R.a[0], R.b[0], 0.15), m2 = lerp(R.a[0], R.b[0], 0.85);
      [m1, m2].forEach(function (mx) { S('circle', { cx: mx, cy: surfY(R, mx) + 4.5, r: 1.8, fill: WOOD_D }, M); });
    });
    // walls: R1 right, R2 right backstop + left
    S('rect', inkd({ x: 266, y: -512, width: 7, height: 31, rx: 2, fill: WOOD_D }), M);
    S('rect', inkd({ x: 278, y: -474, width: 7, height: 31, rx: 2, fill: WOOD_D }), M);
    S('rect', inkd({ x: 58, y: -449, width: 7, height: 31, rx: 2, fill: WOOD_D }), M);

    // plunger
    var MY0 = onRamp(ramps[0], 72)[1];
    S('rect', inkd({ x: 30, y: MY0 - 9, width: 24, height: 18, rx: 3, fill: BRASS }), M);
    var plRod = S('rect', inkd({ x: 0, y: MY0 - 2.5, width: 28, height: 5, rx: 2.5, fill: '#9B8F84' }), M);
    var plKnob = S('circle', inkd({ r: 7, cy: MY0, fill: '#E4573D' }), M);
    var plSpring = S('polyline', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, M);
    var plHead = S('rect', inkd({ y: MY0 - 8, width: 6, height: 16, rx: 2, fill: '#E4573D' }), M);

    // bucket on yoke
    var AX = 308, AY = -336;
    S('path', inkd({ d: 'M' + (AX - 26) + ' ' + (AY + 52) + ' L' + AX + ' ' + AY + ' L' + (AX + 26) + ' ' + (AY + 52), fill: 'none', stroke: WOOD_D, 'stroke-width': 5 }), M);
    S('path', inkd({ d: 'M' + (AX - 26) + ' ' + (AY + 52) + ' L' + AX + ' ' + AY + ' L' + (AX + 26) + ' ' + (AY + 52), fill: 'none', 'stroke-width': 1.4 }), M);
    S('rect', inkd({ x: AX - 32, y: AY + 50, width: 64, height: 7, rx: 3, fill: WOOD }), M);

    // string (behind bucket)
    var str = S('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, M);
    var cupG = S('g', {}, M);
    var cupMarbleSlot = S('g', {}, cupG);
    S('path', inkd({ d: 'M-19 -17 L19 -17 L14 15 Q0 19 -14 15 Z', fill: '#E4573D' }), cupG);
    S('path', { d: 'M-17 -7 L17 -7', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2.5 }, cupG);
    S('ellipse', inkd({ cx: 0, cy: -17, rx: 19, ry: 4, fill: '#A9372A' }), cupG);
    S('circle', inkd({ cx: -21, cy: 0, r: 3, fill: BRASS, 'stroke-width': 1.6 }), cupG);
    S('circle', inkd({ cx: 0, cy: 0, r: 3.2, fill: BRASS, 'stroke-width': 1.6 }), cupG);

    // pulley
    var PX = 282, PY = -235;
    S('line', inkd({ x1: PX, y1: PY, x2: PX + 14, y2: PY - 14, 'stroke-width': 3 }), M);
    S('circle', inkd({ cx: PX, cy: PY, r: 6, fill: BRASS }), M);
    S('circle', { cx: PX, cy: PY, r: 1.6, fill: INK }, M);

    // duck shelf: fixed bracket + trapdoor + pin
    var HX = 170, HY = -235;
    S('path', inkd({ d: 'M' + (HX - 14) + ' ' + (HY - 6) + ' L' + HX + ' ' + (HY - 6) + ' L' + HX + ' ' + (HY + 4) + ' L' + (HX - 8) + ' ' + (HY + 18) + ' L' + (HX - 14) + ' ' + (HY + 18) + 'Z', fill: WOOD_D }), M);
    S('rect', inkd({ x: 226, y: -224, width: 12, height: 14, rx: 2, fill: WOOD_D }), M);
    var door = S('g', {}, M);
    S('rect', inkd({ x: 0, y: -3, width: 60, height: 7, rx: 2.5, fill: WOOD }), door);
    S('circle', inkd({ cx: 0, cy: 0, r: 3.5, fill: BRASS, 'stroke-width': 1.6 }), M).setAttribute('transform', 'translate(' + HX + ' ' + HY + ')');
    var pin = S('g', {}, M);
    S('rect', inkd({ x: -26, y: -2.2, width: 26, height: 4.4, rx: 2, fill: '#9B8F84', 'stroke-width': 1.6 }), pin);
    S('circle', inkd({ cx: 0, cy: 0, r: 3.6, fill: 'none', 'stroke-width': 1.8 }), pin);

    // bellows + paint tin + nozzle
    var BX = 200;
    var tube = S('path', { d: 'M252 -112 Q252 -96 214 -98', fill: 'none', stroke: '#6E5A4C', 'stroke-width': 5, 'stroke-linecap': 'round' }, M);
    var tubeIn = S('path', { d: 'M252 -112 Q252 -96 214 -98', fill: 'none', stroke: dCol, 'stroke-width': 2, 'stroke-linecap': 'round' }, M);
    S('rect', inkd({ x: 238, y: -140, width: 28, height: 30, rx: 3, fill: '#FBF2E0' }), M);
    S('rect', { x: 239, y: -132, width: 26, height: 14, fill: dCol }, M);
    S('rect', inkd({ x: 238, y: -140, width: 28, height: 30, rx: 3, fill: 'none' }), M);
    S('ellipse', inkd({ cx: 252, cy: -140, rx: 14, ry: 3.5, fill: dCol }), M);
    S('path', inkd({ d: 'M244 -139 q2 9 0 14 q-2 3 -4 0 q-1 -6 0 -12', fill: dCol, 'stroke-width': 1.6 }), M);
    var nozG = S('g', { transform: 'translate(' + BX + ' -112)' }, M);
    S('path', inkd({ d: 'M-12 0 L12 0 L4 26 L-4 26 Z', fill: BRASS }), nozG);
    S('path', { d: 'M-6 4 L-2 20', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linecap': 'round' }, nozG);
    var drip = S('circle', inkd({ cx: 0, cy: 29, r: 3.2, fill: dCol, 'stroke-width': 1.4 }), nozG);
    S('rect', inkd({ x: BX - 36, y: -118, width: 72, height: 8, rx: 3, fill: WOOD }), M); // bottom board
    S('path', inkd({ d: 'M' + (BX - 36) + ' -110 l-10 10 l0 8 l12 0', fill: 'none', stroke: WOOD_D, 'stroke-width': 4 }), M);
    var acc = S('path', inkd({ fill: LEATHER }), M);
    var topB = S('rect', inkd({ x: BX - 36, width: 72, height: 8, rx: 3, fill: WOOD }), M);
    var knob = S('rect', inkd({ x: BX - 6, width: 12, height: 5, rx: 2, fill: WOOD_D, 'stroke-width': 1.6 }), M);
    var puffG = S('g', {}, M);
    var puffs = [];
    for (k = 0; k < 4; k++) puffs.push(S('circle', inkd({ r: 6, fill: '#FFFFFF', 'stroke-width': 1.6, opacity: 0 }), puffG));

    // duck
    var duck = S('g', {}, M);
    var duckIn = S('g', {}, duck);
    S('path', inkd({ d: 'M-18 -12 Q-20 -24 -10 -20 Q0 -24 10 -18 Q20 -14 16 -6 Q12 0 0 0 Q-16 0 -18 -12 Z', fill: DUCK }), duckIn);
    S('path', { d: 'M-8 -12 Q0 -6 8 -12', fill: 'none', stroke: '#C99A1E', 'stroke-width': 2, 'stroke-linecap': 'round' }, duckIn);
    var head = S('g', { }, duckIn);
    S('circle', inkd({ cx: 0, cy: 0, r: 8.5, fill: DUCK }), head);
    S('path', inkd({ d: 'M7 -2 L16 1 L7 4 Z', fill: BEAK, 'stroke-width': 1.6 }), head);
    var eye = S('circle', { cx: 3, cy: -2.5, r: 1.8, fill: INK }, head);

    // marble (on top of machine parts)
    var marble = S('g', {}, M);
    var marbleSpin = S('g', {}, marble);
    S('circle', inkd({ r: MR, fill: MARBLE }), marbleSpin);
    S('path', { d: 'M-6 -3 Q0 3 6 -3', fill: 'none', stroke: '#3E5E86', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, marbleSpin);
    S('circle', { cx: -3, cy: -3.5, r: 2.2, fill: '#FFFFFF', opacity: 0.75 }, marble);

    // impact ticks (little burst lines)
    var ticks = [];
    function addTick(tt, x, y, ang, spread) {
      var g = S('g', { transform: 'translate(' + f(x) + ' ' + f(y) + ')', opacity: 0 }, M);
      var ls = [];
      [-1, 0, 1].forEach(function (k) { ls.push({ el: S('line', { stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g), a: (ang + k * spread) / 57.3 }); });
      ticks.push({ t: tt, g: g, ls: ls });
    }

    // paint blob (in world, top)
    var blob = S('g', {}, world);
    var blobIn = S('g', {}, blob);
    S('ellipse', inkd({ rx: 11, ry: 11, fill: dCol }), blobIn);
    S('ellipse', { cx: -3, cy: -4, rx: 3.5, ry: 2.5, fill: '#FFFFFF', opacity: 0.55 }, blobIn);

    // final line (screen space)
    var line = S('text', { x: W / 2, y: 64, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 27, opacity: 0 }, screen);
    line.textContent = dealer + ' stole ' + victim + "'s chip.";

    // ===== timeline helpers =====
    var R1 = ramps[0], R2 = ramps[1], R3 = ramps[2];
    var X0 = 72, X1 = 256, X2 = 78, X3 = 262;
    var CUP_IN = [0, 3];
    function cupAngle(t) {
      if (t < 3380) return 0;
      var s = (t - 3380) / 1000;
      var sway = -wob(s, 7, 14, 40) * (t < 3460 ? 1 : 1);
      var tip = 66 * eio(seg(t, 3420, 3600)) + wob((t - 3600) / 1000, 7, 7, 22);
      return tip + sway;
    }
    function marbleAt(t) {
      var p, r = 0, sx = 1, sy = 1, d1 = X1 - X0, d2 = X1 - X2;
      if (t < 1870) { p = onRamp(R1, X0); }
      else if (t < 2330) { var u = seg(t, 1870, 2330); u = 0.45 * u + 0.55 * u * u; var x = lerp(X0, X1, u); p = onRamp(R1, x); r = x - X0; }
      else if (t < 2480) {
        var a = onRamp(R1, X1), b = onRamp(R2, X1 - 2), u2 = seg(t, 2380, 2480);
        var bx = t < 2380 ? -2 * Math.sin(seg(t, 2330, 2380) * Math.PI) : 0;
        p = [X1 + bx - 2 * u2, lerp(a[1], b[1], ei(u2))]; r = d1;
        if (t < 2380) { var q = Math.sin(seg(t, 2330, 2380) * Math.PI); sx = 1 - 0.18 * q; sy = 1 + 0.12 * q; }
      }
      else if (t < 2840) { var u3 = seg(t, 2480, 2840); u3 = 0.25 * u3 + 0.75 * u3 * u3; var x3 = lerp(X1 - 2, X2, u3); p = onRamp(R2, x3); r = d1 - (X1 - 2 - x3);
        var q3 = Math.max(0, 1 - (t - 2480) / 70); sx = 1 + 0.2 * q3; sy = 1 - 0.2 * q3; }
      else if (t < 2940) {
        var a4 = onRamp(R2, X2), b4 = onRamp(R3, X2 + 2), u4 = seg(t, 2870, 2940);
        var bx4 = t < 2870 ? 2 * Math.sin(seg(t, 2840, 2870) * Math.PI) : 0;
        p = [X2 + bx4 + 2 * u4, lerp(a4[1], b4[1], ei(u4))]; r = d1 - d2;
        if (t < 2870) { var q4 = Math.sin(seg(t, 2840, 2870) * Math.PI); sx = 1 - 0.18 * q4; sy = 1 + 0.12 * q4; }
      }
      else if (t < 3240) { var u5 = seg(t, 2940, 3240); u5 = 0.3 * u5 + 0.7 * u5 * u5; var x5 = lerp(X2 + 2, X3, u5); p = onRamp(R3, x5); r = d1 - d2 + (x5 - X2);
        var q5 = Math.max(0, 1 - (t - 2940) / 70); sx = 1 + 0.2 * q5; sy = 1 - 0.2 * q5; }
      else if (t < 3380) {
        var s0 = onRamp(R3, X3), u6 = seg(t, 3240, 3380), e = [AX + CUP_IN[0], AY + CUP_IN[1] - 6];
        p = [lerp(s0[0], e[0], u6), lerp(s0[1], e[1], u6 * u6) - 18 * 4 * u6 * (1 - u6) * 0.6]; r = d1 - d2 + (X3 - X2) + 40 * u6;
      }
      else { return null; } // inside cup
      return { x: p[0], y: p[1], r: r / MR * 57.3, sx: sx, sy: sy };
    }
    // string pull geometry
    var EY = [-21, 0];
    function attach(th) { var p = rot(EY[0], EY[1], th); return [AX + p[0], AY + p[1]]; }
    var Q = [PX + 6, PY];
    function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
    var L0 = dist(attach(12), Q);
    function pullAt(t) { return dist(attach(cupAngle(t)), Q) - L0; }
    var tRel = 3700;
    for (var tt = 3380; tt < 3900; tt += 2) { if (pullAt(tt) > 9) { tRel = tt; break; } }
    var tHang0 = tRel + 60, tDrop = tRel + 270, tLand = tDrop + 190;

    var BTOP_REST = 24;
    function accH(t) {
      if (t < tLand) return BTOP_REST;
      var u = seg(t, tLand, tLand + 110);
      var h = lerp(BTOP_REST, 9, eo(u));
      if (t > tLand + 110) h = 9 + 3 * (1 - Math.exp(-(t - tLand - 110) / 160)) + wob((t - tLand - 110) / 1000, 2.5, 6, 25);
      return h;
    }
    var tPuff = tLand + 90;
    addTick(1858, 66, MY0, -90, 55);
    addTick(2330, X1 + 9, onRamp(R1, X1)[1], 180, 50);
    addTick(2840, X2 - 9, onRamp(R2, X2)[1], 0, 50);
    addTick(3380, AX, AY - 14, -90, 50);
    addTick(tRel, 222, -229, 180, 45);
    addTick(tLand, BX, -118 - 9 - 8, -90, 62);
    var NOZ = [BX, -84];
    var nozAng = Math.atan2(TX - NOZ[0], TY - NOZ[1]) * 57.3; // deg from straight down
    var tHit = 5150;
    function blobAt(t) {
      var u = seg(t, tPuff, tHit);
      // puffed out fast, eases, then gravity takes it
      var uy = 0.35 * eo(u) + 0.65 * ei(u);
      var ux = eio(u);
      var x = lerp(NOZ[0], TX, ux) + Math.sin(Math.PI * u) * (TX >= NOZ[0] ? -18 : 18);
      var y = lerp(NOZ[1], TY, uy);
      return [x, y];
    }

    // camera keyframes [t, cx, cy, zoom]
    var K = [
      [0, 195, 350, 1], [860, 195, 350, 1],
      [1620, 168, -448, 1.2], [1850, 166, -452, 1.25],
      [2900, 180, -420, 1.22], [3400, 222, -340, 1.32],
      [tRel + 150, 218, -262, 1.42], [tPuff, 205, -205, 1.36],
      [tPuff + 500, lerp(205, TX, 0.55), lerp(-205, TY, 0.62), 1.38],
      [tHit, TX, TY - 4, 1.72], [5700, TX, TY, 1.86], [6420, TX, TY - 10, 1.72],
      [7000, 195, 350, 1], [T_END, 195, 350, 1]
    ];
    var HOLD = { 0: 1, 1: 1, 12: 1, 13: 1 };
    function cam(t) {
      var i = 0;
      while (i < K.length - 2 && t > K[i + 1][0]) i++;
      var a = K[i], b = K[i + 1], dt = b[0] - a[0];
      var u = clamp((t - a[0]) / dt, 0, 1);
      var out = [];
      for (var c = 1; c <= 3; c++) {
        var m0 = 0, m1 = 0;
        if (!HOLD[i] && i > 0) m0 = (b[c] - K[i - 1][c]) / (b[0] - K[i - 1][0]) * dt;
        if (!HOLD[i + 1] && i + 2 < K.length) m1 = (K[i + 2][c] - a[c]) / (K[i + 2][0] - a[0]) * dt;
        var u2 = u * u, u3 = u2 * u;
        out.push((2 * u3 - 3 * u2 + 1) * a[c] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[c] + (u3 - u2) * m1);
      }
      return out;
    }

    function update(t) {
      t = clamp(t, 0, T_END);
      var C = cam(t);
      world.setAttribute('transform', 'translate(' + W / 2 + ' ' + H / 2 + ') scale(' + f(C[2] * 1000) / 1000 + ') translate(' + f(-C[0]) + ' ' + f(-C[1]) + ')');

      // --- table: singling out ---
      var dim = 1 - 0.5 * eio(seg(t, 250, 650)) + 0.5 * eio(seg(t, 6500, 6950));
      others.setAttribute('opacity', f(dim));
      var sIn = eback(seg(t, 200, 560));
      var sOut = eio(seg(t, 6300, 6700));
      spot.setAttribute('transform', 'translate(' + TX + ' ' + TY + ') rotate(' + f(t * 0.03) + ') scale(' + f(Math.max(0.001, sIn * (1 + 0.15 * sOut))) + ')');
      spot.setAttribute('opacity', f(Math.min(1, seg(t, 200, 320)) * (1 - sOut)));
      spotRing.setAttribute('stroke', t < 6300 ? INK : dCol);

      // --- target chip transform ---
      var sc = 1, sx = 1, yo = 0, rz = 0, lift = 0;
      if (t > 420 && t < 950) { var gs = (t - 420) / 1000; sc = 1 + wob(gs, 0.14, 7, 24); rz = wob(gs, 9, 6, 38); }
      if (t >= tHit && t < 5800) { sc = 1 - wob((t - tHit) / 1000, 0.17, 6, 22); }
      if (t >= 5800 && t < 5900) { sc = 1 - 0.1 * eio(seg(t, 5800, 5900)); }
      if (t >= 5900 && t < 6300) {
        var hu = seg(t, 5900, 6300);
        lift = Math.sin(Math.PI * hu);
        sc = lerp(0.9, 1, eo(Math.min(1, hu * 3))) + 0.38 * lift;
        sx = Math.max(0.06, Math.abs(Math.cos(Math.PI * 2 * eio(hu))));
        yo = -20 * lift;
      }
      if (t >= 6300) { var ls = (t - 6300) / 1000; sc = 1 - wob(ls, 0.13, 7, 26); rz = wob(ls, 5, 6, 20); }
      tG.setAttribute('transform', 'translate(' + f(TX) + ' ' + f(TY + yo) + ') rotate(' + f(rz) + ') scale(' + f(sc * sx) + ' ' + f(sc) + ')');
      tShadow.setAttribute('cx', f(TX + 1.5 + 10 * lift)); tShadow.setAttribute('cy', f(TY + 4 + 12 * lift));
      tShadow.setAttribute('r', f(CR * (sc * (1 + 0.05 * lift)))); tShadow.setAttribute('opacity', f(0.22 - 0.1 * lift));
      tShadow.setAttribute('transform', sx < 1 ? 'translate(' + f(TX + 1.5 + 10 * lift) + ' 0) scale(' + f(sx) + ' 1) translate(' + f(-(TX + 1.5 + 10 * lift)) + ' 0)' : '');

      // colour flood
      var fl = eo(seg(t, tHit + 10, tHit + 260));
      clipC.setAttribute('r', f(fl * 34));
      clipC.setAttribute('cx', f(lerp(-6, 0, fl))); clipC.setAttribute('cy', f(lerp(-8, 0, fl)));
      var o1 = seg(t, tHit + 260, tHit + 400), o2 = seg(t, tHit + 340, tHit + 560);
      tOld.setAttribute('transform', 'rotate(' + f(-120 * ei(o1)) + ') scale(' + f(Math.max(0.001, 1 - ei(o1))) + ')');
      tOld.setAttribute('opacity', o1 >= 1 ? 0 : 1);
      var nb = eback(o2);
      tNew.setAttribute('transform', 'rotate(' + f(90 * (1 - o2)) + ') scale(' + f(Math.max(0.001, nb)) + ')');
      tNew.setAttribute('opacity', o2 <= 0 ? 0 : 1);

      // blob shadow on chip (in chip local coords)
      var bsu = seg(t, tHit - 300, tHit);
      blobShadow.setAttribute('cx', 0); blobShadow.setAttribute('cy', 0);
      blobShadow.setAttribute('rx', f(6 + 9 * bsu)); blobShadow.setAttribute('ry', f(5 + 8 * bsu));
      blobShadow.setAttribute('opacity', t < tHit && bsu > 0 ? f(0.35 * bsu) : 0);

      // splat + droplets
      var su = seg(t, tHit, tHit + 110), sf = seg(t, tHit + 120, tHit + 290);
      splat.setAttribute('opacity', t >= tHit && sf < 1 ? 1 : 0);
      splat.setAttribute('transform', 'scale(' + f(Math.max(0.001, lerp(0.35, 1.3, eo(su)) - 0.62 * eio(sf))) + ') rotate(' + f(su * 12 + sf * 20) + ')');
      drops.forEach(function (d) {
        var du = seg(t, tHit, tHit + 420);
        var ok = t >= tHit && du < 1;
        d.el.setAttribute('opacity', ok ? 1 : 0);
        if (ok) {
          var r = 24 + d.d * eo(du);
          d.el.setAttribute('cx', f(Math.cos(d.a) * r)); d.el.setAttribute('cy', f(Math.sin(d.a) * r - 14 * Math.sin(Math.PI * du)));
          d.el.setAttribute('r', f(4.5 * (1 - du * 0.6)));
          d.el.setAttribute('opacity', f(1 - ei(du)));
        }
      });
      // landing dust + flash
      var dr = seg(t, 6300, 6650);
      dustRing.setAttribute('r', f(27 + 22 * eo(dr)));
      dustRing.setAttribute('opacity', t >= 6300 && dr < 1 ? f(0.75 * (1 - dr)) : 0);
      dustRing.setAttribute('stroke-width', f(4 * (1 - dr) + 0.5));
      var fr = seg(t, 6320, 6800);
      flashRing.setAttribute('r', f(28 + 14 * eo(fr)));
      flashRing.setAttribute('opacity', t >= 6320 && fr < 1 ? f(0.9 * (1 - fr)) : 0);

      // --- plunger ---
      var hx;
      if (t < 1550) hx = 62;
      else if (t < 1800) hx = lerp(62, 42, eio(seg(t, 1560, 1800)));
      else if (t < 1850) hx = 42 + Math.sin((t - 1800) * 1.4) * 0.8;
      else if (t < 1875) hx = lerp(42, 64, eo(seg(t, 1850, 1875)));
      else hx = 62 + wob((t - 1875) / 1000, 2.5, 8, 30) + 2 * Math.exp(-(t - 1875) / 80);
      plHead.setAttribute('x', f(hx - 6));
      plRod.setAttribute('x', f(hx - 30));
      plKnob.setAttribute('cx', f(hx - 30));
      var sp2 = '', x0s = 54, x1s = hx - 6, nz = 7;
      for (k = 0; k <= nz; k++) sp2 += f(lerp(x0s, x1s, k / nz)) + ',' + f(MY0 + (k === 0 || k === nz ? 0 : (k % 2 ? -6 : 6))) + ' ';
      plSpring.setAttribute('points', sp2);
      plSpring.setAttribute('opacity', hx > 56 ? 1 : 1);

      // --- marble ---
      var mb = marbleAt(t), th = cupAngle(t);
      if (mb) {
        if (marble.parentNode !== M) M.appendChild(marble);
        marble.setAttribute('transform', 'translate(' + f(mb.x) + ' ' + f(mb.y) + ') scale(' + f(mb.sx) + ' ' + f(mb.sy) + ')');
        marbleSpin.setAttribute('transform', 'rotate(' + f(mb.r) + ')');
      } else {
        if (marble.parentNode !== cupMarbleSlot) cupMarbleSlot.appendChild(marble);
        marble.setAttribute('transform', 'translate(' + CUP_IN[0] + ' ' + (CUP_IN[1] - 6) + ')');
      }
      cupG.setAttribute('transform', 'translate(' + AX + ' ' + AY + ') rotate(' + f(th) + ')');

      // --- string + pin ---
      var A = attach(th), pull = pullAt(t);
      var pd = Math.max(0, pull) * 1.15;
      var pinX = 244 + pd;
      pin.setAttribute('transform', 'translate(' + f(pinX) + ' -229)');
      var slack = Math.max(0, -pull);
      var sag = Math.min(12, Math.sqrt(slack) * 3.2);
      var my = (A[1] + Q[1]) / 2;
      str.setAttribute('d', 'M' + f(pinX + 3) + ' -229 L' + PX + ' -229 Q' + (PX + 6) + ' -229 ' + (PX + 6) + ' -235 Q' + f((A[0] + Q[0]) / 2 - sag) + ' ' + f(my) + ' ' + f(A[0]) + ' ' + f(A[1]));

      // --- trapdoor ---
      var da = 0;
      if (t > tRel) { var ds = (t - tRel) / 1000; da = 92 * (1 - Math.exp(-6 * ds) * Math.cos(13 * ds)); }
      door.setAttribute('transform', 'translate(' + HX + ' ' + HY + ') rotate(' + f(da) + ')');

      // --- duck ---
      var dyb = -238, dsx = 1, dsy = 1, hr = 0, dx = 200, drz = 0;
      var duckSitY = -118 - accH(t) - 8;
      if (t > tHang0 && t < tDrop) { hr = 28 * eio(seg(t, tHang0, tHang0 + 110)); if (t > tDrop - 70) { var q = Math.sin(seg(t, tDrop - 70, tDrop) * Math.PI); dsy = 1 + 0.1 * q; dsx = 1 - 0.07 * q; } drz = (t > tHang0 + 120 && t < tHang0 + 190) ? Math.sin((t - tHang0 - 120) * 0.25) * 3 : 0; }
      if (t >= tDrop && t < tLand) { var fu = seg(t, tDrop, tLand); dyb = lerp(-238, duckSitY, ei(fu)); hr = lerp(28, -10, fu); dsy = 1 + 0.16 * fu; dsx = 1 - 0.1 * fu; }
      if (t >= tLand) { dyb = duckSitY; var ls2 = (t - tLand) / 1000; var w2 = wob(ls2, 0.3, 7, 24); dsx = 1 + w2; dsy = 1 - w2; hr = -10 * Math.exp(-ls2 * 5) + wob(ls2, 12, 5, 20); }
      duck.setAttribute('transform', 'translate(' + dx + ' ' + f(dyb) + ') rotate(' + f(drz) + ') scale(' + f(dsx) + ' ' + f(dsy) + ')');
      head.setAttribute('transform', 'translate(7 -19) rotate(' + f(hr) + ')');
      eye.setAttribute('r', t > tHang0 + 100 && t < tLand + 200 ? 2.6 : 1.8);

      // --- bellows ---
      var h = accH(t), yb = -118, yt = yb - h;
      var folds = 3, dpath = 'M' + (BX - 34) + ' ' + f(yt);
      for (k = 1; k <= folds * 2; k++) dpath += ' L' + (BX - 34 + (k % 2 ? 7 : 0)) + ' ' + f(yt + h * k / (folds * 2));
      dpath += ' L' + (BX + 34) + ' ' + yb;
      for (k = folds * 2 - 1; k >= 0; k--) dpath += ' L' + (BX + 34 - (k % 2 ? 7 : 0)) + ' ' + f(yt + h * k / (folds * 2));
      acc.setAttribute('d', dpath + ' Z');
      topB.setAttribute('y', f(yt - 8));
      knob.setAttribute('y', f(yt - 12));
      var na = 0;
      if (t > tRel) na = nozAng * eio(seg(t, tRel + 100, tRel + 400));
      na += wob((t - tPuff) / 1000, 6, 8, 40);
      nozG.setAttribute('transform', 'translate(' + BX + ' -110) rotate(' + f(-na) + ') scale(' + f(1 + wob((t - tPuff) / 1000, 0.12, 9, 40)) + ' 1)');
      var dripR = t < tPuff ? 3.2 + 0.6 * Math.sin(t / 260) : 0;
      drip.setAttribute('r', f(Math.max(0.001, dripR)));
      drip.setAttribute('opacity', t < tPuff ? 1 : 0);
      var tubeTh = 2 + 2 * Math.max(0, Math.sin(seg(t, tLand, tPuff + 60) * Math.PI));
      tubeIn.setAttribute('stroke-width', f(tubeTh));
      // puffs at nozzle tip
      var tip = rot(0, 28, -na);
      puffs.forEach(function (p, i2) {
        var pu = seg(t, tPuff + i2 * 25, tPuff + 380 + i2 * 25);
        var on = t >= tPuff + i2 * 25 && pu < 1;
        p.setAttribute('opacity', on ? f(1 - pu) : 0);
        if (on) {
          var ang = (-0.9 + i2 * 0.6) - na / 57.3;
          var rr = 6 + 22 * eo(pu);
          p.setAttribute('cx', f(BX + tip[0] + Math.sin(ang) * rr));
          p.setAttribute('cy', f(-110 + tip[1] + Math.cos(ang) * rr * 0.6 - 4));
          p.setAttribute('r', f(4 + 6 * eo(pu)));
        }
      });

      // --- blob ---
      if (t >= tPuff && t < tHit) {
        var bp = blobAt(t), bq = blobAt(t - 16);
        var vx = bp[0] - bq[0], vy = bp[1] - bq[1], v = Math.sqrt(vx * vx + vy * vy);
        var st = Math.min(0.9, v / 18);
        var ang2 = Math.atan2(vy, vx) * 57.3;
        var grow = 1 + 0.3 * ei(seg(t, tHit - 260, tHit));
        var popIn = eback(seg(t, tPuff, tPuff + 120));
        blob.setAttribute('opacity', 1);
        blob.setAttribute('transform', 'translate(' + f(bp[0]) + ' ' + f(bp[1]) + ') rotate(' + f(ang2) + ') scale(' + f((1 + st) * grow * popIn) + ' ' + f(grow * popIn / (1 + st * 0.6)) + ')');
      } else blob.setAttribute('opacity', 0);

      ticks.forEach(function (k) {
        var u = seg(t, k.t, k.t + 170), on = t >= k.t && u < 1;
        k.g.setAttribute('opacity', on ? f(1 - ei(u)) : 0);
        if (on) k.ls.forEach(function (l) {
          var r0 = 10 + 8 * eo(u), r1 = r0 + 7 * (1 - u) + 2;
          l.el.setAttribute('x1', f(Math.cos(l.a) * r0)); l.el.setAttribute('y1', f(Math.sin(l.a) * r0));
          l.el.setAttribute('x2', f(Math.cos(l.a) * r1)); l.el.setAttribute('y2', f(Math.sin(l.a) * r1));
        });
      });

      // --- final line ---
      var lu = seg(t, 7250, 7600);
      line.setAttribute('opacity', f(eio(Math.min(1, lu * 1.4))));
      line.setAttribute('transform', 'translate(' + W / 2 + ' ' + f(64 + 12 * (1 - eo(lu))) + ') scale(' + f(0.94 + 0.06 * eback(lu)) + ') translate(' + (-W / 2) + ' -64)');
    }
    return { update: update };
  }

  return {
    title: 'The Contraption',
    blurb: 'Nick’s pegboard machine - marble, zigzag, bucket, pin, duck, bellows - lobs one perfect blob of paint onto Nate’s chip and claims it in place.',
    play: function (el, opts) {
      var sc = build(el, opts);
      sc.update(0);
      return new Promise(function (resolve) {
        var t0 = null;
        function step(now) {
          if (t0 === null) t0 = now;
          var t = now - t0;
          sc.update(Math.min(t, T_END));
          if (t >= T_END) resolve(); else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    },
    frame: function (el, opts, ms) { var sc = build(el, opts); sc.update(ms || 0); }
  };
})();
