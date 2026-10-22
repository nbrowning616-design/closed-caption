/* Closed Caption steal film: laundry (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE ONE RED SOCK (laundry)
 *
 * Everyone knows it: one coloured sock in the wash and all the whites come out that colour.
 * Top-down felt table; the little washer is a front-view toy that pops up out of the felt.
 *
 * Storyboard (ms)
 *   0-  650  Table deals in: rows drop in, chips pop on.
 * 600- 950  Camera eases in a touch (whole rows stay in frame). Other chips dim; Nate's chip
 *           gives a nervous little hop-shiver.
 * 800-1380  A hole irises open in the felt beside the chip and a tiny washing machine
 *           pops up out of it (overshoot, squash on landing, wobbly settle).
 *1280-1600  Its panel eyes blink awake and look at Nate's chip. Door pops open.
 *1600-2050  Chip crouches, hops in an arc through the door, lands in the drum.
 *2000-2700  A small sock in Nick's colour inch-worms along the felt from the table edge, stops
 *           at the door, glances at us (sneaky).
 *2700-2900  Sock hops in after the chip.
 *2900-3250  Beat: the machine's eyes drop to its window... it noticed. A pause. Door slams.
 *3250-4500  WASH: drum tumbles, suds, the sock bleeds dye into the water, which turns Nick's
 *           colour; the chip inside follows. Machine rocks and shimmies across the felt and back,
 *           tinted bubbles float out of the top.
 *4500-5420  SPIN: drum blurs, water drains, machine shakes frantically, eyes clenched.
 *5420-5720  Stops dead, dizzy eyes; DING (pop of the lid, tick burst).
 *5700-6330  Door pops, steam. The chip tumbles out (now Nick's colour, "Ni"), bounces once and
 *           lands exactly in its spot: squash, Euler-disc settle, ring flash, still steaming.
 *6150-6950  The sock peeks out of the door, looks at the chip, then at us. Ducks back in.
 *6950-7600  Door shuts; machine hops, sinks back into the felt; hole closes. Camera eases back.
 *7640-7680  Settle; whole table still.
*7680-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var BODY = '#FBF8F2', PANEL = '#D3E1E6', METAL = '#BFCAD1', DRUM = '#28333D', WATER = '#AEDCEA', HOLE = '#143A2E';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var WY = -37, WR = 20.5, CS = 0.56, SS = 0.62, MS = 1.22, SW = 1.35;
  var uid = 0;

  // ---------- math ----------
  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function eio(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function eioC(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eo(t) { return 1 - (1 - t) * (1 - t); }
  function eoC(t) { return 1 - Math.pow(1 - t, 3); }
  function ei(t) { return t * t; }
  function eS(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f2(v) { return Math.round(v * 1000) / 1000; }
  function kf(keys, t, ease) {
    ease = ease || eio;
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        var a = keys[i - 1], b = keys[i];
        return lerp(a[1], b[1], (b[2] || ease)((t - a[0]) / (b[0] - a[0])));
      }
    }
    return keys[keys.length - 1][1];
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function rgb(h) {
    h = String(h || '#888888').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h.slice(0, 6), 16); if (isNaN(n)) n = 0x888888;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    var A = rgb(a), B = rgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  function tr(x, y, r, sx, sy) { return 'translate(' + f1(x) + ',' + f1(y) + ')' + (r ? ' rotate(' + f1(r) + ')' : '') + ' scale(' + f2(sx) + ',' + f2(sy === undefined ? sx : sy) + ')'; }
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }

  function initialsFn(opts) {
    var d = opts.dealer || '', v = opts.victim || '';
    var same = d && v && d[0].toUpperCase() === v[0].toUpperCase();
    return function (name) {
      name = name || '?';
      if (same && (name === d || name === v)) return name.slice(0, 2);
      return name[0].toUpperCase();
    };
  }

  // ---------- layout ----------
  function layout(opts) {
    var cards = opts.cards || [], n = Math.max(1, cards.length);
    var top = 50, bot = 560, g = 24;
    var h = Math.min(100, (bot - top - (n - 1) * g) / n);
    var total = n * h + (n - 1) * g, y0 = top + (bot - top - total) / 2;
    var ini = initialsFn(opts), rows = [], target = null, others = [];
    cards.forEach(function (c, i) {
      var y = y0 + i * (h + g), mid = y + h / 2;
      var row = { label: String(c.label), y: y, h: h, mid: mid, i: i, chips: [] };
      (c.chips || []).slice(0, 3).forEach(function (ch, j) {
        var chip = { name: ch.name, color: ch.color, ini: ini(ch.name), x: 150 + 72 * j, y: mid, row: i, j: j, target: !!ch.target };
        row.chips.push(chip);
        if (chip.target && !target) target = chip; else others.push(chip);
      });
      rows.push(row);
    });
    if (!target) {
      for (var r = 0; r < rows.length && !target; r++) if (rows[r].chips.length) { target = rows[r].chips[0]; target.target = true; others.splice(others.indexOf(target), 1); }
    }
    var trow = rows[target.row];
    return { rows: rows, target: target, others: others, bandY: trow.y + h + g / 2, h: h, g: g, ini: ini };
  }

  // ---------- choreography ----------
  // machine pose (offsets from rest) as a pure function of t
  function machinePose(t, S) {
    var sx = S.sx, m = { dx: 0, dy: 0, rot: 0, sqy: 1 };
    if (t < 1380) { var p = seg(t, 1000, 1380); m.dy = 112 * (1 - backOut(p, 1.5)); m.sqy += 0.1 * Math.sin(Math.PI * p); }
    m.sqy += spring(t - 1380, -0.11, 3.4, 130);
    m.rot += spring(t - 1380, 4.5 * sx, 2.1, 230);
    m.rot += spring(t - 1460, -1.8 * sx, 3, 150);
    m.sqy += spring(t - 2050, -0.045, 4, 100) + spring(t - 2900, -0.04, 4, 100);
    // door slam
    m.rot += spring(t - 3250, 2.6 * sx, 3, 160); m.sqy += spring(t - 3250, -0.08, 4, 120);
    // wash: rock & shimmy across the felt and back
    var wa = seg(t, 3300, 3500) * (1 - seg(t, 4420, 4600));
    var ph = 2 * Math.PI * (t - 3300) / 430;
    m.rot += 3.4 * wa * Math.sin(ph);
    m.dy -= 2 * wa * Math.abs(Math.sin(ph));
    m.dx += sx * kf([[3450, 0], [3980, S.walk], [4520, 0]], t, eS) + 1.2 * wa * Math.sin(ph * 2);
    // spin: frantic
    var A = eio(seg(t, 4500, 5150)) * (1 - eio(seg(t, 5260, 5420)));
    m.rot += 6 * A * Math.sin(t * 0.097);
    m.dx += 3.8 * A * Math.sin(t * 0.131 + 1);
    m.dy -= 7.5 * A * Math.abs(Math.sin(t * 0.043));
    m.sqy += 0.05 * A * Math.sin(t * 0.11);
    // stop jolt
    m.rot += spring(t - 5420, 3.2 * sx, 2.4, 170);
    // DING hop
    var dp = seg(t, 5550, 5720);
    m.dy -= 10 * Math.sin(Math.PI * dp); m.sqy += 0.07 * Math.sin(Math.PI * dp) + spring(t - 5720, -0.08, 4, 110);
    m.rot += spring(t - 5700, -2.2 * sx, 3, 140) + spring(t - 5800, -1.6 * sx, 3, 140);
    // sink: little hop, then down the hole
    m.dy -= 6 * Math.sin(Math.PI * seg(t, 6990, 7130));
    m.sqy += 0.06 * Math.sin(Math.PI * seg(t, 6990, 7130));
    if (t >= 7090) m.dy += 118 * ei(seg(t, 7090, 7460));
    m.rot += 2.2 * Math.sin(t * 0.07) * seg(t, 7100, 7200);
    return m;
  }
  function holeK(t) {
    return kf([[800, 0], [1060, 1, function (x) { return backOut(x, 1.6); }], [1480, 1], [1760, 0], [6890, 0], [7060, 1, function (x) { return backOut(x, 1.6); }], [7430, 1], [7640, 0]], t);
  }
  function doorAng(t) {
    var a = kf([[0, 0], [1460, 0], [1610, 120, function (x) { return backOut(x, 1.8); }], [3130, 120], [3250, 0, ei], [5700, 0], [5850, 125, function (x) { return backOut(x, 1.8); }], [6950, 125], [7090, 0, ei]], t);
    a += spring(t - 3250, 7, 5, 70) * (t > 3250 && t < 3500 ? 1 : 0) + spring(t - 7090, 6, 5, 70) * (t > 7090 && t < 7300 ? 1 : 0);
    return Math.max(0, a);
  }
  var W1 = 2 * Math.PI / 1100, W2 = 2 * Math.PI / 140;
  function omega(t) {
    if (t < 3250) return 0;
    if (t < 3450) return W1 * seg(t, 3250, 3450);
    if (t < 4500) return W1;
    if (t < 5000) return lerp(W1, W2, eio(seg(t, 4500, 5000)));
    if (t < 5300) return W2;
    if (t < 5470) return W2 * (1 - eo(seg(t, 5300, 5470)));
    return 0;
  }
  function drumRot(t) {
    var a = 0, end = Math.min(t, 5470);
    for (var s = 3250; s < end; s += 4) a += omega(s + 2) * Math.min(4, end - s);
    return a;
  }
  function waterTint(t) { return eio(seg(t, 3420, 5000)); }
  function chipTint(t) { return eio(seg(t, 3750, 5150)); }

  // ---------- build ----------
  function makeChip(parent, color, txt) {
    var g = el('g', {}, parent);
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    return g;
  }
  // sock puppet, centred on the origin, toe pointing +x
  function makeSock(parent, color) {
    var g = el('g', {}, parent);
    var inner = el('g', { transform: 'translate(-4,12.3)' }, g);
    var dark = mix(color, INK, 0.3);
    var bodyD = 'M-7 -20 L3.5 -20 L3.5 -10 Q3.5 -7.5 6.5 -7.5 L10.5 -7.5 Q15.8 -7.5 15.8 -3.6 Q15.8 0.4 10.5 0.4 L-2.5 0.4 Q-7 0.4 -7 -4.5 Z';
    el('path', { d: bodyD, fill: color }, inner);
    el('path', { d: 'M-7 -6.5 Q-7 0.4 -2.5 0.4 L0.8 0.4 Q-3.6 -1.4 -3.8 -6.5 Z', fill: dark }, inner);
    el('path', { d: 'M10.8 -7.5 Q15.8 -7.5 15.8 -3.6 Q15.8 0.4 10.8 0.4 Q12.8 -3.6 10.8 -7.5 Z', fill: dark }, inner);
    el('path', { d: 'M-4.3 -16.5 L-4.3 -9', stroke: '#FFFFFF', 'stroke-opacity': 0.4, 'stroke-width': 2, 'stroke-linecap': 'round' }, inner);
    el('path', { d: bodyD, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, inner);
    el('rect', { x: -8.3, y: -25, width: 13.1, height: 6.4, rx: 2.2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2 }, inner);
    el('path', { d: 'M-6.5 -21.9 L3 -21.9', stroke: color, 'stroke-width': 1.7 }, inner);
    var eyes = [[7.4, -9.2], [12.1, -8.6]].map(function (p) {
      var eg = el('g', { transform: 'translate(' + p[0] + ',' + p[1] + ')' }, inner);
      el('circle', { r: 2.9, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.3 }, eg);
      return { pup: el('circle', { r: 1.45, fill: INK }, eg), lid: el('path', { fill: color, stroke: INK, 'stroke-width': 1.1 }, eg) };
    });
    return { g: g, eyes: eyes };
  }
  function setSockEyes(S, look, lid) {
    S.eyes.forEach(function (e) {
      e.pup.setAttribute('cx', f1(look[0] * 1.3)); e.pup.setAttribute('cy', f1(look[1] * 1.3));
      if (lid <= -0.95) e.lid.setAttribute('d', '');
      else { var r = 3.0, Ly = clamp(lid, -1, 1) * r, dx = Math.sqrt(Math.max(0, r * r - Ly * Ly)); e.lid.setAttribute('d', lid >= 0.98 ? circleD(0, 0, r) : 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
    });
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-laundry-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.j < 2 ? 1 : -1;
    var MX = T.x + sx * 72, baseY = Math.min(L.bandY + 4, 566);
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var room = sx === 1 ? 362 - (MX + 44) : (MX - 44) - 28, walk = clamp(room, 8, 26);

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpM = el('clipPath', { id: id + 'm', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -400, y: -400, width: 1200, height: f1(baseY + 5.5 * MS + 400) }, cpM);
    var cpW = el('clipPath', { id: id + 'w', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('circle', { cx: 0, cy: WY, r: WR }, cpW);

    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = el('g', {}, svg);
    var tableG = el('g', {}, cam);
    el('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    el('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    el('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    var rowsG = [], chipsG = [], V = null;
    var cardLayer = el('g', {}, cam), chipLayer = el('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = el('g', {}, cardLayer);
      el('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      el('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      el('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = el('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
      r.chips.forEach(function (c) {
        if (c === T) return;
        var wrap = el('g', {}, chipLayer);
        var sh = el('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        var cg = el('g', {}, wrap); makeChip(cg, c.color, c.ini);
        chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
      });
    });

    // hole in the felt + machine shadow
    var hole = el('g', {}, cam);
    var holeE = el('ellipse', { cx: MX, cy: baseY, rx: 0, ry: 0, fill: HOLE, stroke: INK, 'stroke-width': 2.2 }, hole);
    var holeIn = el('ellipse', { cx: MX, cy: baseY + 2, rx: 0, ry: 0, fill: '#0B241C' }, hole);
    var mShadow = el('ellipse', { cx: MX, cy: baseY + 4, rx: 40, ry: 6, fill: INK, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- machine ----
    var mWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var mG = el('g', {}, mWrap);
    var bodyG = el('g', { transform: 'scale(' + sx + ',1)' }, mG);
    el('rect', { x: -28, y: -3, width: 11, height: 8.5, rx: 3, fill: INK }, bodyG);
    el('rect', { x: 17, y: -3, width: 11, height: 8.5, rx: 3, fill: INK }, bodyG);
    el('rect', { x: -36, y: -88, width: 72, height: 88, rx: 11, fill: BODY, stroke: INK, 'stroke-width': 2.6 }, bodyG);
    el('path', { d: 'M27 -64 L27 -12 Q27 -6 21 -6', fill: 'none', stroke: INK, 'stroke-opacity': 0.08, 'stroke-width': 5, 'stroke-linecap': 'round' }, bodyG);
    el('path', { d: 'M-36 -66 L-36 -77 Q-36 -88 -25 -88 L25 -88 Q36 -88 36 -77 L36 -66 Z', fill: PANEL, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, bodyG);
    el('path', { d: 'M-27 -83.5 L14 -83.5', stroke: '#FFFFFF', 'stroke-opacity': 0.55, 'stroke-width': 2, 'stroke-linecap': 'round' }, bodyG);
    el('path', { d: 'M-29 -6 L29 -6', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, bodyG);
    var mEyes = [[-21, -77], [-8.5, -77]].map(function (p) {
      var g = el('g', { transform: 'translate(' + p[0] + ',' + p[1] + ')' }, bodyG);
      el('circle', { r: 5.4, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.7 }, g);
      return { p: p, pup: el('circle', { r: 2.7, fill: INK }, g), gl: el('circle', { r: 0.9, fill: '#FFFFFF' }, g), lid: el('path', { fill: PANEL, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g) };
    });
    var light = el('circle', { cx: 4.5, cy: -77, r: 2.6, fill: '#94A3A9', stroke: INK, 'stroke-width': 1.3 }, bodyG);
    var knobG = el('g', { transform: 'translate(21,-77)' }, bodyG);
    el('circle', { r: 6.8, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2 }, knobG);
    var knobPtr = el('path', { d: 'M0 0 L0 -4.6', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, knobG);
    el('circle', { cx: 0, cy: WY, r: 22.5, fill: DRUM }, bodyG);
    // contents (not mirrored), clipped to the window
    var cont = el('g', { 'clip-path': 'url(#' + id + 'w)' }, mG);
    var perfG = el('g', {}, cont);
    for (var pi = 0; pi < 10; pi++) {
      var pa = pi / 10 * Math.PI * 2;
      el('circle', { cx: f1(Math.cos(pa) * 15), cy: f1(Math.sin(pa) * 15), r: 1.3, fill: '#FFFFFF', 'fill-opacity': 0.2 }, perfG);
    }
    el('path', { d: 'M-17 0 L17 0 M0 -17 L0 17', stroke: '#FFFFFF', 'stroke-opacity': 0.08, 'stroke-width': 3 }, perfG);
    var water = el('path', { fill: WATER, opacity: 0.92 }, cont);
    var clouds = [0, 1, 2, 3].map(function () { return el('circle', { r: 0, fill: dealerC, opacity: 0 }, cont); });
    var blur = el('circle', { cx: 0, cy: WY, r: 8, fill: 'none', 'stroke-width': 13, opacity: 0 }, cont);
    var blur2 = el('circle', { cx: 0, cy: WY, r: 14, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4, 'stroke-dasharray': '6 9', opacity: 0 }, cont);
    var cChip = el('g', {}, cont);
    makeChip(cChip, victimC, vIni);
    var cChipD = el('g', { opacity: 0 }, cChip); makeChip(cChipD, dealerC, dIni);
    var cSock = makeSock(el('g', {}, cont), dealerC);
    var suds = [];
    for (var si = 0; si < 8; si++) suds.push(el('circle', { r: 3, fill: '#FFFFFF', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 0.8, opacity: 0 }, cont));
    // gasket
    el('circle', { cx: 0, cy: WY, r: 21.4, fill: 'none', stroke: '#7D8990', 'stroke-width': 2.6 }, mG);
    el('circle', { cx: 0, cy: WY, r: 22.8, fill: 'none', stroke: INK, 'stroke-width': 1.6 }, mG);
    // door (mirrored with body; hinge on the far side from the chip)
    var doorM = el('g', { transform: 'scale(' + sx + ',1)' }, mG);
    var door = el('g', {}, doorM);
    el('rect', { x: 25, y: WY - 9, width: 7, height: 5, rx: 1.5, fill: METAL, stroke: INK, 'stroke-width': 1.4 }, door);
    el('rect', { x: 25, y: WY + 4, width: 7, height: 5, rx: 1.5, fill: METAL, stroke: INK, 'stroke-width': 1.4 }, door);
    el('path', { d: circleD(0, WY, 28) + circleD(0, WY, WR), 'fill-rule': 'evenodd', fill: METAL, stroke: INK, 'stroke-width': 2.4 }, door);
    el('rect', { x: -32.5, y: WY - 7, width: 6, height: 14, rx: 2.5, fill: METAL, stroke: INK, 'stroke-width': 1.8 }, door);
    var glass = el('circle', { cx: 0, cy: WY, r: WR, fill: '#DDF4FC', 'fill-opacity': 0.22 }, door);
    el('path', { d: 'M-12.5 ' + (WY - 6) + ' A14 14 0 0 1 -4 ' + (WY - 13.5), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 3, 'stroke-linecap': 'round' }, door);
    el('path', { d: 'M12 ' + (WY + 9) + ' A15 15 0 0 1 6.5 ' + (WY + 13.5), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linecap': 'round' }, door);
    el('path', { d: 'M-24 ' + (WY - 10) + ' A26 26 0 0 1 -10 ' + (WY - 24), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-linecap': 'round' }, door);

    // ---- world-space actors over the machine ----
    var sockW = makeSock(el('g', {}, cam), dealerC);
    var vWrap = el('g', {}, cam);
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, vWrap);
    var vG = el('g', {}, vWrap);
    makeChip(vG, victimC, vIni);
    var vGD = el('g', { opacity: 0 }, vG); makeChip(vGD, dealerC, dIni);
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var ding = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var bubbles = [0, 1, 2, 3].map(function () { return el('circle', { r: 0, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.2, opacity: 0 }, cam); });
    var steamD = el('path', { fill: 'none', stroke: '#AFC0C7', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam);
    var steamC = el('path', { fill: 'none', stroke: '#AFC0C7', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, sx: sx, walk: walk, MX: MX, baseY: baseY, dealerC: dealerC, victimC: victimC, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, holeE: holeE, holeIn: holeIn, mShadow: mShadow, dust: dust, mWrap: mWrap, mG: mG,
      mEyes: mEyes, light: light, knobPtr: knobPtr, perfG: perfG, water: water, clouds: clouds, blur: blur, blur2: blur2,
      cChip: cChip, cChipD: cChipD, cSock: cSock, suds: suds, door: door, glass: glass, sockW: sockW,
      vWrap: vWrap, vSh: vSh, vG: vG, vGD: vGD, ripple: ripple, ticks: ticks, ding: ding, bubbles: bubbles,
      steamD: steamD, steamC: steamC, line: line
    };
  }

  // machine local -> world
  function toWorld(S, m, px, py) {
    var a = m.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sqx = 2 - m.sqy;
    var x = px * sqx * MS, y = py * m.sqy * MS;
    return [S.MX + m.dx + x * c - y * s, S.baseY + m.dy + x * s + y * c];
  }
  // contents positions (window-local, relative to window centre)
  function contentPos(S, t) {
    var sx = S.sx, rot = drumRot(t);
    var restC = [-sx * 6, 7.5], restS = [sx * 8, 9.5];
    var orb = eio(seg(t, 3250, 3480)) * (1 - eio(seg(t, 5330, 5520)));
    var ac = Math.PI / 2 + rot + 0.3 * Math.sin(rot * 1.0), as = Math.PI / 2 + rot + 2.7;
    var rc = 8 + 1.5 * Math.sin(rot * 2), rs = 8.5;
    var oc = [Math.cos(ac) * rc, Math.sin(ac) * rc], os = [Math.cos(as) * rs, Math.sin(as) * rs];
    var c = [lerp(restC[0], oc[0], orb), lerp(restC[1], oc[1], orb)];
    var s = [lerp(restS[0], os[0], orb), lerp(restS[1], os[1], orb)];
    return { c: c, s: s, rot: rot, orb: orb };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, sx = S.sx, MX = S.MX, baseY = S.baseY;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6950, 7650)));
    var Z = lerp(1, 1.15, zk);
    var fy = clamp((T.y + baseY) / 2 - 20, 280, 330);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 7150, 7600)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- machine ----
    var m = machinePose(t, S);
    var mVis = t >= 1000 && t < 7465;
    S.mWrap.setAttribute('display', mVis ? 'inline' : 'none');
    var hk = holeK(t);
    S.holeE.setAttribute('rx', f1(46 * MS * hk)); S.holeE.setAttribute('ry', f1(10.5 * hk));
    S.holeIn.setAttribute('rx', f1(38 * MS * hk)); S.holeIn.setAttribute('ry', f1(6 * hk));
    S.holeE.parentNode.setAttribute('display', hk > 0.01 ? 'inline' : 'none');
    var standing = mVis ? clamp(1 - m.dy / 40) * clamp(1 - Math.max(0, -m.dy) / 30, 0.4, 1) : 0;
    S.mShadow.setAttribute('cx', f1(MX + m.dx + 2)); S.mShadow.setAttribute('rx', f1(40 * MS * (0.8 + 0.2 * standing)));
    S.mShadow.setAttribute('opacity', f1(standing * 22 * (t > 1300 ? 1 : 0)) / 100);
    if (mVis) S.mG.setAttribute('transform', 'translate(' + f1(MX + m.dx) + ',' + f1(baseY + m.dy) + ') rotate(' + f1(m.rot) + ') scale(' + f2((2 - m.sqy) * MS) + ',' + f2(m.sqy * MS) + ')');

    // eruption dust
    var dp0 = seg(t, 1040, 1330);
    if (dp0 > 0 && dp0 < 1) {
      var dd = '';
      [-2.9, -2.5, -0.65, -0.25, 2.6, 0.5].forEach(function (a) {
        var r0 = 1 + 0.25 * eoC(dp0), r1 = r0 + 0.18 * (1 - dp0);
        dd += 'M' + f1(MX + Math.cos(a) * 56 * r0) + ' ' + f1(baseY + Math.sin(a) * 14 * r0) + 'L' + f1(MX + Math.cos(a) * 56 * r1) + ' ' + f1(baseY + Math.sin(a) * 14 * r1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // door
    var da = doorAng(t) * Math.PI / 180, dc = Math.cos(da);
    S.door.setAttribute('transform', 'translate(27,0) scale(' + f2(dc) + ',' + f2(1 + 0.05 * Math.sin(da)) + ') translate(-27,0)');
    S.glass.setAttribute('fill-opacity', dc > 0 ? 0.24 : 0.5);

    // machine eyes
    var mlid = kf([[0, 1], [1280, 1], [1360, -1], [1940, -1], [1990, 1], [2030, -1], [2160, -1], [2260, 0.25], [2840, 0.25], [2900, -1],
      [3170, -1], [3260, 0.3], [3780, 0.3], [3820, 1], [3870, 0.3], [4480, 0.3], [4580, 1.05], [5380, 1.05], [5430, -1], [6430, -1], [6470, 1], [6520, -1],
      [6850, -1], [6950, 0.1], [7020, 0.1], [7100, 1.05]], t);
    var lookPts = [[0, 'cam'], [1400, [T.x, T.y], 160], [1760, 'win', 220], [2160, 'cam', 160], [2860, 'winlow', 80], [3260, 'cam', 160],
      [5430, 'dizzy'], [5600, 'cam', 100], [5800, 'chip', 120], [6450, [T.x, T.y], 120], [6600, 'win', 160], [6760, 'cam', 140]];
    S.mEyes.forEach(function (e) {
      var E = toWorld(S, m, sx * e.p[0], e.p[1]);
      var v = lookAt(S, lookPts, t, E, m);
      var vx = v[0] * sx, vy = v[1];
      var shake = (t > 4500 && t < 5400) ? 0.6 * Math.sin(t * 0.21) : 0;
      e.pup.setAttribute('cx', f1(vx * 2.4 + shake)); e.pup.setAttribute('cy', f1(vy * 2.4));
      e.gl.setAttribute('cx', f1(vx * 2.4 - 0.9 * sx + shake)); e.gl.setAttribute('cy', f1(vy * 2.4 - 0.9));
      var r = 5.6, Ly = clamp(mlid, -1, 1.05) * r;
      if (mlid <= -0.97) e.lid.setAttribute('d', '');
      else if (mlid >= 0.99) e.lid.setAttribute('d', circleD(0, 0, r) + (t > 4500 && t < 5400 ? 'M-3.5 -1.6 L1 0.4 L-3.5 2.2' : 'M-4 0.4 Q0 2.4 4 0.4'));
      else { var dx = Math.sqrt(r * r - Ly * Ly); e.lid.setAttribute('d', 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
    });
    var running = seg(t, 3250, 3300) * (1 - seg(t, 5450, 5500));
    var dingF = seg(t, 5550, 5600) * (1 - seg(t, 5900, 6100));
    S.light.setAttribute('fill', dingF > 0 ? mix('#94A3A9', '#FFD24A', dingF) : mix('#94A3A9', '#6BD38A', running * (0.75 + 0.25 * Math.sin(t * 0.02))));
    var ka = kf([[3150, -60], [3260, 30, eoC], [4480, 30], [4560, 150, eoC], [5520, 150], [5600, -60, eoC]], t);
    S.knobPtr.setAttribute('transform', 'rotate(' + f1(ka * sx) + ')');

    // ---- drum contents ----
    var cp = contentPos(S, t), rot = cp.rot;
    S.perfG.setAttribute('transform', 'translate(0,' + WY + ') rotate(' + f1(rot * 180 / Math.PI) + ')');
    var om = omega(t), spinA = clamp((om - 0.012) / 0.026);
    // water: fills, tints with the sock's dye, drains in the spin
    var wl = kf([[3250, 24], [3480, 3, eo], [4580, 3], [5050, 25, ei]], t);
    var tilt = -Math.tan(m.rot * Math.PI / 180);
    var wt = waterTint(t);
    if (wl < 22 && t > 3250) {
      var wd = '';
      for (var x = -24; x <= 24; x += 4) wd += (x === -24 ? 'M' : 'L') + x + ' ' + f1(WY + wl + tilt * x + 1.8 * Math.sin(x * 0.28 + t * 0.012) * (1 - spinA)) ;
      wd += 'L24 ' + (WY + 24) + 'L-24 ' + (WY + 24) + 'Z';
      S.water.setAttribute('d', wd);
      S.water.setAttribute('fill', mix(WATER, S.dealerC, 0.72 * wt));
    } else S.water.setAttribute('d', '');
    // dye clouds from the sock
    [3330, 3640, 3960, 4280].forEach(function (te, k) {
      var c = S.clouds[k], a = seg(t, te, te + 820);
      if (a <= 0 || a >= 1) { c.setAttribute('opacity', 0); return; }
      var p = contentPos(S, te).s;
      c.setAttribute('cx', f1(p[0] + 3 * a * Math.sin(k * 2))); c.setAttribute('cy', f1(WY + p[1] - 4 * a));
      c.setAttribute('r', f1(4 + 9 * eo(a)));
      c.setAttribute('opacity', f1(55 * Math.sin(Math.PI * a) * (wl < 20 ? 1 : 0)) / 100);
    });
    // spin blur
    var ct = chipTint(t);
    S.blur.setAttribute('stroke', mix(mix(S.victimC, S.dealerC, ct), S.dealerC, 0.5));
    S.blur.setAttribute('opacity', f1(spinA * 85) / 100);
    S.blur2.setAttribute('opacity', f1(spinA * 70) / 100);
    S.blur2.setAttribute('transform', 'rotate(' + f1(rot * 180 / Math.PI) + ' 0 ' + WY + ')');
    var itemA = 1 - 0.85 * spinA;
    // chip inside
    var inChip = t >= 2050 && t < 5800;
    if (inChip) {
      var cpos = cp.c;
      if (t < 2260) { var lp = seg(t, 2050, 2260); cpos = [lerp(0, cpos[0], lp), lerp(0, cpos[1], 1 - Math.abs(Math.cos(Math.PI * 1.5 * lp)) * (1 - lp))]; }
      var crot = t < 2260 ? -sx * 360 * (1 - seg(t, 1720, 2260)) : rot * 140;
      S.cChip.setAttribute('transform', tr(cpos[0], WY + cpos[1], crot, CS));
      S.cChip.setAttribute('opacity', f1(itemA * 100) / 100);
      S.cChipD.setAttribute('opacity', f2(ct));
    } else S.cChip.setAttribute('opacity', 0);
    // sock inside
    var inSock = t >= 2900 && t < 7460;
    if (inSock) {
      var sp = cp.s, ssc = SS, srot = 0, sl = [sx, 0], slid = -1;
      if (t < 3100) { var lq = seg(t, 2900, 3100); sp = [lerp(sx * 2, sp[0], lq), lerp(-2, sp[1], eo(lq))]; srot = sx * 20 * (1 - lq); sl = [0, 1]; }
      else if (t < 3250) { sl = [0, 0]; }
      else if (t < 5550) { srot = (rot * 180 / Math.PI) * 1.1 + 15 * Math.sin(rot * 3); }
      // peek out at the end
      var pk = eio(seg(t, 6150, 6380)) * (1 - eio(seg(t, 6820, 6960)));
      if (pk > 0) {
        sp = [lerp(sp[0], -sx * 3, pk), lerp(sp[1], -3, pk)];
        ssc = lerp(SS, 0.95, pk); srot = -sx * 14 * pk;
        sl = lookSock(t, [S.T.x, S.T.y], S, sp);
        slid = kf([[6380, -1], [6600, -1], [6680, 0.15], [6820, 0.15], [6860, -1]], t);
      } else if (t >= 5550) { srot = -8 * sx; sl = [0, 1]; slid = 0.2; }
      S.cSock.g.setAttribute('transform', tr(sp[0], WY + sp[1], srot, sx * ssc, ssc));
      S.cSock.g.setAttribute('opacity', f1(itemA * 100) / 100);
      setSockEyes(S.cSock, [sl[0] * sx, sl[1]], slid);
    } else S.cSock.g.setAttribute('opacity', 0);
    // suds
    S.suds.forEach(function (b, k) {
      var x = -19 + k * 5.5 + 1.5 * Math.sin(t * 0.004 + k);
      var on = seg(t, 3300 + k * 40, 3550 + k * 40) * (1 - seg(t, 4600, 4950));
      if (on <= 0 || wl > 20) { b.setAttribute('opacity', 0); return; }
      var y = WY + wl + tilt * x - 1 - 1.2 * Math.abs(Math.sin(t * 0.009 + k * 1.7));
      b.setAttribute('cx', f1(x)); b.setAttribute('cy', f1(y));
      b.setAttribute('r', f1((2.4 + (k % 3) * 1.1) * on));
      b.setAttribute('fill', mix('#FFFFFF', S.dealerC, 0.28 * wt));
      b.setAttribute('opacity', 0.95);
    });

    // bubbles drifting out of the lid during the wash (tinted)
    [3600, 3880, 4150, 4400].forEach(function (te, k) {
      var b = S.bubbles[k], a = seg(t, te, te + 900);
      if (a <= 0 || a >= 1) { b.setAttribute('opacity', 0); return; }
      var m0 = machinePose(te, S), o = toWorld(S, m0, (k % 2 ? 12 : -14) * sx * 0.6, -90);
      b.setAttribute('cx', f1(o[0] + 6 * Math.sin(a * 7 + k))); b.setAttribute('cy', f1(o[1] - 46 * eo(a)));
      b.setAttribute('r', f1(3 + (k % 2) * 1.6 + 1.5 * a));
      b.setAttribute('fill', mix('#FFFFFF', S.dealerC, 0.35 * waterTint(te + 400)));
      b.setAttribute('opacity', a > 0.9 ? 0 : 0.95);
    });

    // DING burst
    var dg = seg(t, 5560, 5860);
    if (dg > 0 && dg < 1) {
      var top = toWorld(S, m, 0, -88), ddg = '';
      [-2.6, -2.05, -1.57, -1.09, -0.54].forEach(function (a) {
        var r0 = 8 + 14 * eoC(dg), r1 = r0 + 8 * (1 - dg);
        ddg += 'M' + f1(top[0] + Math.cos(a) * (r0 + 22) * 0.9) + ' ' + f1(top[1] + Math.sin(a) * r0) + 'L' + f1(top[0] + Math.cos(a) * (r1 + 22) * 0.9) + ' ' + f1(top[1] + Math.sin(a) * r1);
      });
      S.ding.setAttribute('d', ddg); S.ding.setAttribute('opacity', f1((1 - ei(dg)) * 100) / 100);
    } else S.ding.setAttribute('opacity', 0);

    // steam from the door
    var sd = seg(t, 5720, 6500);
    if (sd > 0 && sd < 1) {
      var wc = toWorld(S, m, 0, WY - 14), sdd = '';
      [-9, 0, 9].forEach(function (ox, k) {
        var by = wc[1] - 26 * eo(sd) - k * 3, bx = wc[0] + ox;
        sdd += squiggle(bx, by, 14 + 6 * sd, t * 0.012 + k);
      });
      S.steamD.setAttribute('d', sdd); S.steamD.setAttribute('opacity', f1(Math.sin(Math.PI * sd) * 80) / 100);
    } else S.steamD.setAttribute('opacity', 0);

    // ---- Nate's chip (world) ----
    var vx = T.x, vy = T.y, vs = chipPop(T), vsx = 1, vsy = 1, vr = 0, shOn = 1, dealerA = 0, wobA = 0;
    var vVis = !(t >= 2050 && t < 5800);
    if (t < 1600) {
      // singled out: nervous hop + shiver
      var nh = seg(t, 650, 980);
      vy -= 5 * Math.sin(Math.PI * seg(t, 650, 820));
      vx += 1.8 * Math.sin((t - 650) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
      vs *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 820));
    } else if (t < 1720) {
      var cr = eo(seg(t, 1600, 1700)); vsx = 1 + 0.12 * cr; vsy = 1 - 0.14 * cr; vx -= sx * 2 * cr;
    } else if (t < 2050) {
      var hp = seg(t, 1720, 2050), q = eio(hp);
      var A0 = [T.x, T.y], B0 = toWorld(S, machinePose(2050, S), 0, WY);
      var P = arc2(A0, B0, 46, q);
      vx = P[0]; vy = P[1]; vs = lerp(1, CS * MS, ei(hp)); vr = -sx * 360 * q;
      vsx = 1 - 0.1 * Math.sin(Math.PI * hp); vsy = 1 + 0.12 * Math.sin(Math.PI * hp);
      shOn = 1 - seg(hp, 0, 0.3);
    } else if (t >= 5800) {
      dealerA = 1;
      var S0 = toWorld(S, machinePose(5800, S), -sx * 6, WY + 7.5);
      var B1 = [lerp(S0[0], T.x, 0.48), Math.max(S0[1], T.y) + 6];
      if (t < 6070) {
        var h1 = seg(t, 5800, 6070), P1 = arc2(S0, B1, 34, h1);
        vx = P1[0]; vy = P1[1]; vs = lerp(CS * MS, 0.86, eo(h1)); vr = -sx * 200 * h1;
        vsx = Math.max(0.2, Math.abs(Math.cos(Math.PI * 2 * h1))); shOn = 0;
      } else if (t < 6330) {
        var h2 = seg(t, 6070, 6330), P2 = arc2(B1, [T.x, T.y], 30, h2);
        vx = P2[0]; vy = P2[1]; vs = lerp(0.86, 1, h2); vr = -sx * (200 + 160 * h2);
        vsx = Math.max(0.2, Math.abs(Math.cos(Math.PI * 2 * h2))); shOn = seg(h2, 0.5, 1);
        var sqz = Math.sin(Math.PI * seg(t, 6060, 6110)); vsx *= 1 + 0.15 * sqz; vsy = 1 - 0.15 * sqz;
      } else {
        var d = t - 6330;
        vr = -sx * 360;
        var land = Math.exp(-d / 70) * Math.sin(Math.PI * clamp(d / 110));
        vsx = 1 + 0.14 * land; vsy = 1 - 0.14 * land;
        wobA = 0.09 * Math.exp(-d / 210) * clamp(d / 60);
      }
    }
    if (wobA > 0.002) {
      var wa2 = (t - 6330) * 0.02;
      S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(wa2 * 57.3) + ') scale(' + f2(1 + wobA) + ',' + f2(1 - wobA) + ') rotate(' + f1(-wa2 * 57.3) + ')');
    } else S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(vr) + ') scale(' + f2(vs * vsx) + ',' + f2(vs * vsy) + ')');
    S.vWrap.setAttribute('display', vVis ? 'inline' : 'none');
    S.vGD.setAttribute('opacity', dealerA);
    var lift = Math.max(0, (T.y - vy) * 0.2) + (t >= 1720 && t < 6330 ? 6 : 0);
    S.vSh.setAttribute('cx', f1(vx + 1.5 + lift * 0.4)); S.vSh.setAttribute('cy', f1(vy + 3.5 + lift));
    S.vSh.setAttribute('r', f1(CR * Math.min(1.04, vs)));
    S.vSh.setAttribute('opacity', f1(28 * shOn) / 100);

    // landing ring + ticks
    var rp = seg(t, 6330, 6830);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var tp = seg(t, 6330, 6600);
    if (tp > 0 && tp < 1) {
      var td = '', r0 = 27 + 9 * eoC(tp), r1b = r0 + 6 * (1 - tp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        td += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.ticks.setAttribute('d', td); S.ticks.setAttribute('opacity', f1((1 - tp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);
    // the chip is still steaming a bit
    var sc2 = seg(t, 5900, 7650);
    if (sc2 > 0 && sc2 < 1) {
      var scd = '';
      [-6, 6].forEach(function (ox, k) {
        var ph2 = ((t - 5900) / 700 + k * 0.5) % 1;
        scd += squiggle(vx + ox, vy - 20 - 16 * ph2, 9, t * 0.014 + k * 2);
      });
      S.steamC.setAttribute('d', scd); S.steamC.setAttribute('opacity', f1(70 * Math.min(1, sc2 * 6) * (1 - ei(sc2))) / 100);
    } else S.steamC.setAttribute('opacity', 0);

    // ---- the sock sneaking in (world) ----
    var sW = S.sockW;
    if (t >= 1990 && t < 2900) {
      var floorY = Math.min(baseY + 9, 569), stopX = MX - sx * 66, startX = sx === 1 ? -24 : W + 24;
      var sxp, syp, ssx = 1, ssy = 1, srot2 = 0, look = [1, 0], slid2 = -1;
      if (t < 2480) {
        var p = seg(t, 2000, 2480), n = 4, env = Math.sin(Math.PI * p);
        var prog = p - Math.sin(2 * Math.PI * n * p) / (2 * Math.PI * n);
        sxp = lerp(startX, stopX, prog);
        var rate = 1 - Math.cos(2 * Math.PI * n * p);
        ssx = 1 + 0.2 * (rate - 1) * env; ssy = 1 - 0.16 * (rate - 1) * env;
        syp = floorY - 12 * SW * ssy - 3 * Math.abs(Math.sin(Math.PI * n * p)) * env;
        srot2 = 6 * Math.sin(2 * Math.PI * n * p) * env;
      } else if (t < 2700) {
        sxp = stopX;
        var st = spring(t - 2480, 0.1, 4, 80);
        ssx = 1 - st; ssy = 1 + st;
        var cr2 = eio(seg(t, 2620, 2700)); ssy -= 0.15 * cr2; ssx += 0.1 * cr2;
        syp = floorY - 12 * SW * ssy;
        look = t < 2540 ? [1, 0] : t < 2610 ? [0, 0] : [0.8, -0.6];
        slid2 = t > 2550 && t < 2610 ? 0.15 : -1;
        srot2 = -sx * 0 + 4 * cr2;
      } else {
        var hp2 = seg(t, 2700, 2900), qq = eio(hp2);
        var Pp = arc2([stopX, floorY - 12 * SW], toWorld(S, machinePose(2900, S), sx * 2, WY - 2), 40, qq);
        sxp = Pp[0]; syp = Pp[1];
        var sc3 = lerp(SW, SS * MS, ei(hp2)); ssx = sc3 * (1 + 0.1 * Math.sin(Math.PI * hp2)); ssy = sc3 * (1 - 0.06 * Math.sin(Math.PI * hp2));
        srot2 = 25 * Math.sin(Math.PI * hp2); look = [0.7, 0.7];
      }
      if (t < 2700) { ssx *= SW; ssy *= SW; }
      sW.g.setAttribute('transform', tr(sxp, syp, srot2 * sx, sx * ssx, ssy));
      sW.g.setAttribute('display', 'inline');
      setSockEyes(sW, look, slid2);
    } else sW.g.setAttribute('display', 'none');

    // final line
    var lp2 = seg(t, 7680, 8030);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function squiggle(x, y, len, ph) {
    var d = 'M' + f1(x + 2.5 * Math.sin(ph)) + ' ' + f1(y);
    for (var k = 1; k <= 8; k++) d += 'L' + f1(x + 2.2 * Math.sin(ph + k * 0.8)) + ' ' + f1(y - len * k / 8);
    return d;
  }
  function lookSock(t, chipPt, S, sp) {
    if (t < 6420) return [0, -0.2];
    if (t < 6600) { var dx = chipPt[0] - (S.MX + sp[0]), dy = chipPt[1] - (S.baseY + WY + sp[1]), m = Math.hypot(dx, dy) || 1; return [dx / m * S.sx, dy / m]; }
    return [0, 0.1];
  }
  function specVec(S, spec, E, m) {
    if (spec === 'cam') return [0, 0.15];
    var p;
    if (spec === 'win') p = toWorld(S, m, 0, WY);
    else if (spec === 'winlow') return [0.15 * S.sx, 1];
    else if (spec === 'chip') { p = S.__chipPt || [S.T.x, S.T.y]; }
    else p = spec;
    var dx = p[0] - E[0], dy = p[1] - E[1], mm = Math.hypot(dx, dy) || 1;
    return [dx / mm, dy / mm];
  }
  function lookAt(S, list, t, E, m) {
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    var cur = list[k];
    if (cur[1] === 'dizzy') { var a = t * 0.045; return [Math.cos(a) * 0.9, Math.sin(a) * 0.9]; }
    if (cur[1] === 'chip') { var cp2 = chipPathPt(S, t); var dx = cp2[0] - E[0], dy = cp2[1] - E[1], mm = Math.hypot(dx, dy) || 1; return [dx / mm, dy / mm]; }
    var b = specVec(S, cur[1], E, m);
    if (k === 0 || list[k - 1][1] === 'dizzy' || list[k - 1][1] === 'chip') {
      if (k > 0 && list[k - 1][1] !== undefined && (list[k - 1][1] === 'chip')) { var pa = chipPathPt(S, cur[0]), dx2 = pa[0] - E[0], dy2 = pa[1] - E[1], m2 = Math.hypot(dx2, dy2) || 1; return blend([dx2 / m2, dy2 / m2], b, clamp((t - cur[0]) / (cur[2] || 120))); }
      if (k > 0 && list[k - 1][1] === 'dizzy') { var aa = cur[0] * 0.045; return blend([Math.cos(aa) * 0.9, Math.sin(aa) * 0.9], b, clamp((t - cur[0]) / (cur[2] || 120))); }
      return b;
    }
    var av = specVec(S, list[k - 1][1], E, m);
    return blend(av, b, clamp((t - cur[0]) / (cur[2] || 120)));
  }
  function blend(a, b, p) { var q = backOut(p, 1.3); return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)]; }
  function chipPathPt(S, t) {
    var T = S.T, sx = S.sx;
    if (t < 5800) return toWorld(S, machinePose(5800, S), -sx * 6, WY + 7.5);
    var S0 = toWorld(S, machinePose(5800, S), -sx * 6, WY + 7.5);
    var B1 = [lerp(S0[0], T.x, 0.48), Math.max(S0[1], T.y) + 6];
    if (t < 6070) return arc2(S0, B1, 34, seg(t, 5800, 6070));
    if (t < 6330) return arc2(B1, [T.x, T.y], 30, seg(t, 6070, 6330));
    return [T.x, T.y];
  }

  function getScene(root, opts) {
    var c = root.__cc2laundry;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2laundry = S;
    return S;
  }

  window.CCSteal2_laundry = {
    title: 'The One Red Sock',
    blurb: 'A tiny washing machine pops out of the felt and swallows Nate’s chip, a sock in Nick’s colour sneaks in after it, and after a frantic spin cycle the chip tumbles out dyed Nick’s colour and settles right back in its spot.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2laundry = S;
      var token = {};
      root.__cc2laundryToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2laundryToken !== token) { resolve(); return; }
          if (t0 === null) t0 = now;
          var t = now - t0;
          render(S, t);
          if (t >= T_END) { resolve(); return; }
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
  };
})();
