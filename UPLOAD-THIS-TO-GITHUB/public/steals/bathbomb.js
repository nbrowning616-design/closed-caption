/* Closed Caption steal film: bathbomb (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE BATH BOMB
 *
 * Everyone knows it: drop a bath bomb in and the whole bath turns that colour - and so does
 * whatever's soaking in it. Nate's chip takes a bath in Nick's bath bomb.
 * Top-down felt table; the little claw-foot tub is a front-view toy that rises out of the felt
 * around Nate's chip, so the chip ends up sitting in the water like a bather.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  600- 950  Camera eases in a touch (whole rows stay framed). Other chips dim; Nate's chip
 *            gives a nervous hop.
 *  850-1450  A hole irises open in the felt; a tiny claw-foot tub rises up around the chip
 *            (overshoot, squash, wobble). The rim scoops the chip: SPLOSH, it bobs up afloat.
 * 1320-1700  The chip opens a face (surprised "o"), looks left, right. A rubber duck pops up
 *            out of the water beside it (splash).
 * 1660-1960  A shower cap drops from above and lands on the chip's head (squash, blink).
 * 1960-2380  Ahh: eyes close happily, cheeks blush, gentle bob; steam curls up.
 * 2380-3050  One eye opens, it looks up-left... a round bath bomb in Nick's colour arcs in
 *            from off-frame, spinning; chip and duck track it ("o").
 * 3050-3250  PLOP: splash crown, ripples, the chip squeezes its eyes, the duck bounces.
 * 3150-4900  FIZZ: the bomb spins and shrinks in a froth of bubbles; ribbons of Nick's colour
 *            swirl out across the water until the whole bath is Nick's colour. The duck is
 *            carried round the tub in the current, spinning. The chip relaxes blissfully
 *            (grin, blush, sway) while the colour soaks up through it from the waterline.
 * 4950-5250  Eyes open, it looks down at itself: Nick's colour all over. Happy wiggle.
 * 4900-5650  The duck paddles round to the plug chain, dips, and yanks: the plug pops out.
 * 5650-6450  DRAIN: a gurgling whirlpool swirls the water away; the duck circles the drain;
 *            the chip sinks down to the tub floor watching it go.
 * 6420-6640  The chip shakes itself off; the shower cap flies off into the tub.
 * 6520-6800  Face gives way to the initial: "Ni" pops in, colour ring flash, sparkle ticks.
 * 6760-7150  The duck gives a last SQUEAK and hops... and drops into the tub.
 * 6950-7400  The tub hops and sinks back into the felt; the chip drops the last few pixels
 *            onto its spot (squash, thud lines); hole closes. Camera eases back.
 * 7460-7650  Stillness: whole table settled.
 * 7650-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var BODY = '#FBF8F2', SHADE = '#E4E8EA', INNER = '#E6EEF1', INNER2 = '#D3DFE4', WATER = '#BFE8F4', HOLE = '#143A2E';
  var BRASS = '#E9B949', DUCK = '#FFD447', BEAK = '#F5841F', CAPDOT = '#8FCFEA', BLUSH = '#FF7E9B', STEAM = '#AFC0C7', PLUG = '#3B4248', CHAIN = '#9AA6AD';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var OFF = 60;                 // local y of the tub's feet (tub origin = water-surface centre)
  var FLOAT = -6, FLOOR = -3;   // chip offsets from its spot while afloat / sitting on the tub floor
  var DRAIN = [-34, 5], BOMB_AT = [-31, 4], CHAIN_A = [-47, 11];
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
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function hsh(a) { var x = Math.sin(a * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
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
  function hexOf(c) { // normalise any mix() output back to hex for re-mixing
    var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(c); if (!m) return c;
    return '#' + [m[1], m[2], m[3]].map(function (v) { var s = (+v).toString(16); return s.length < 2 ? '0' + s : s; }).join('');
  }
  function tr(x, y, r, sx, sy) { return 'translate(' + f1(x) + ',' + f1(y) + ')' + (r ? ' rotate(' + f1(r) + ')' : '') + ' scale(' + f2(sx) + ',' + f2(sy === undefined ? sx : sy) + ')'; }
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }
  function squiggle(x, y, len, ph) {
    var d = 'M' + f1(x + 2.5 * Math.sin(ph)) + ' ' + f1(y);
    for (var k = 1; k <= 8; k++) d += 'L' + f1(x + 2.2 * Math.sin(ph + k * 0.8)) + ' ' + f1(y - len * k / 8);
    return d;
  }
  function tickBurst(cx, cy, r0, r1, angs, sxF) {
    var d = ''; sxF = sxF || 1;
    angs.forEach(function (a) { d += 'M' + f1(cx + Math.cos(a) * r0 * sxF) + ' ' + f1(cy + Math.sin(a) * r0) + 'L' + f1(cx + Math.cos(a) * r1 * sxF) + ' ' + f1(cy + Math.sin(a) * r1); });
    return d;
  }

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
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini };
  }

  // ---------- choreography (pure functions of t) ----------
  function tubPose(t) {
    var m = { dx: 0, dy: 0, rot: 0, sqy: 1 };
    if (t < 1420) { var p = seg(t, 1000, 1420); m.dy = 84 * (1 - backOut(p, 1.35)); m.sqy += 0.09 * Math.sin(Math.PI * p); }
    m.sqy += spring(t - 1420, -0.08, 3.4, 120);
    m.rot += spring(t - 1420, 2.2, 2.2, 200);
    m.sqy += spring(t - 3060, -0.035, 4, 110) + spring(t - 5560, -0.035, 4, 100);
    var fz = seg(t, 3150, 3350) * (1 - seg(t, 4500, 4800));
    m.rot += 0.7 * fz * Math.sin(t * 0.021);
    var dr = seg(t, 5650, 5800) * (1 - seg(t, 6250, 6450));
    m.rot += 1.1 * dr * Math.sin(t * 0.047);
    m.dx += 0.8 * dr * Math.sin(t * 0.071);
    m.sqy += 0.015 * dr * Math.sin(t * 0.09);
    // sink: a little hop, then down the hole
    var hp = seg(t, 6950, 7080);
    m.dy -= 6 * Math.sin(Math.PI * hp); m.sqy += 0.05 * Math.sin(Math.PI * hp);
    if (t >= 7060) m.dy += 98 * ei(seg(t, 7060, 7380));
    return m;
  }
  function holeK(t) {
    var bo = function (x) { return backOut(x, 1.6); };
    return kf([[850, 0], [1060, 1, bo], [1520, 1], [1760, 0], [6860, 0], [7030, 1, bo], [7300, 1], [7460, 0]], t);
  }
  function chipFloat(t) {
    if (t < 1220) return 0;
    var y = kf([[1220, 0], [1370, FLOAT - 8, eo], [1540, FLOAT, eio], [1800, FLOAT], [1880, FLOAT + 2, eo], [1990, FLOAT],
      [5700, FLOAT], [6400, FLOOR, eio], [7080, FLOOR], [7150, 0, ei]], t);
    y += 1.3 * Math.sin((t - 1540) * 0.0055) * seg(t, 1500, 1700) * (1 - seg(t, 5650, 5900));
    y += spring(t - 3060, 3.2, 2.2, 160) * (t < 4500 ? 1 : 0);
    return y;
  }
  function waterTint(t) { return eio(seg(t, 3450, 4700)); }
  function soakK(t) { return eio(seg(t, 3450, 4900)); }
  function drainK(t) { return eio(seg(t, 5650, 6450)); }
  function waterEllipse(t) {
    var dp = drainK(t);
    return { cx: lerp(0, DRAIN[0], dp), cy: lerp(3, DRAIN[1] + 2, dp), rx: 53 * (1 - dp), ry: 13.5 * (1 - dp) };
  }
  function bombLocal(t) {
    var r = 1 - eio(seg(t, 3120, 4500));
    return { x: BOMB_AT[0] + 1.5 * Math.sin(t * 0.013) * seg(t, 3100, 3300), y: BOMB_AT[1] + spring(t - 3050, 4, 3, 90) + 0.6 * Math.sin(t * 0.02), s: r, rot: (t - 3050) * 0.32 };
  }
  var BOMB_T0 = 2450, BOMB_T1 = 3050;
  function bombWorld(S, t) {
    var p = seg(t, BOMB_T0, BOMB_T1);
    return arc2(S.bombS0, S.bombE, 95, p);
  }
  function duckPose(t) {
    var d = { x: 34, y: 1, rot: 0, fx: 1, sq: 1 };
    if (t < 1700) { var p = seg(t, 1450, 1680); d.y = lerp(22, 1, backOut(p, 2)); d.rot = -12 * (1 - p); }
    if (t < 5650) d.y += 0.9 * Math.sin(t * 0.0068 + 1) * seg(t, 1650, 1800);
    d.rot += 16 * eio(seg(t, 2420, 2600)) * (1 - eio(seg(t, 3000, 3150)));
    d.y += spring(t - 3070, -5, 2.4, 150);
    if (t >= 3150 && t < 4850) {
      var q = eio(seg(t, 3150, 4850)), th = 2 * Math.PI * q;
      d.x = 34 * Math.cos(th); d.y += -6.5 * Math.sin(th);
      d.fx = Math.cos(3 * 2 * Math.PI * q); d.rot += 9 * Math.sin(th * 2);
    }
    if (t >= 4900 && t < 5650) {
      d.x = kf([[4900, 34], [5250, -27], [5380, -31], [5560, -22, eoC]], t);
      d.y = kf([[4900, 1], [5250, 1], [5380, 4.5], [5560, 0, eoC]], t) - 6.5 * Math.sin(Math.PI * seg(t, 4900, 5250)) + 0.9 * Math.sin(t * 0.0068 + 1);
      d.rot = kf([[5250, 0], [5380, -32], [5560, 14, eoC], [5650, 6]], t);
      d.x += 1.2 * Math.sin(t * 0.06) * seg(t, 4950, 5050) * (1 - seg(t, 5200, 5250)); // paddling waggle
    }
    if (t >= 5650) {
      var a = 0.0042 * (Math.min(t, 6450) - 5650), dq = drainK(t);
      d.x = DRAIN[0] + 12 * Math.cos(a); d.y = -4 * Math.sin(a) + 7.5 * dq;
      d.rot = 6 * (1 - seg(t, 5650, 5800)) + 6 * Math.sin(a * 2);
      d.fx = Math.cos(2 * Math.PI * seg(t, 5650, 6450));
    }
    // squeak-hop and gone
    if (t >= 6700) {
      var ant = Math.sin(Math.PI * seg(t, 6700, 6800));
      d.sq = 1 - 0.18 * ant;
      var h = seg(t, 6800, 7150), P0x = d.x, P0y = d.y;
      if (h > 0) {
        var P = arc2([P0x, P0y], [P0x + 16, 42], 52, h);
        d.x = P[0]; d.y = P[1]; d.rot = 25 * h;
        d.sq = 1 + 0.15 * Math.sin(Math.PI * seg(h, 0, 0.35));
      }
    }
    return d;
  }
  function beakTip(d) {
    var a = d.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    var px = d.fx * -17, py = -11.5 * d.sq;
    return [d.x + c * px - s * py, d.y + s * px + c * py];
  }

  // ---------- build ----------
  function makeChip(parent, color, txt) {
    var g = el('g', {}, parent);
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = null;
    if (txt) {
      tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
      tx.textContent = txt;
    }
    return { g: g, tx: tx };
  }
  function makeDuck(parent) {
    var g = el('g', {}, parent), f = el('g', {}, g);
    el('path', { d: 'M7 -8.5 L13.8 -14.5 L13 -4.5 Z', fill: DUCK, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, f);
    el('ellipse', { cx: 1.5, cy: -3.5, rx: 11.8, ry: 7.6, fill: DUCK, stroke: INK, 'stroke-width': 1.8 }, f);
    el('path', { d: 'M-11 -13.4 Q-17.8 -13.2 -17.2 -10.2 Q-14 -8.4 -10.6 -9.9 Z', fill: BEAK, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, f);
    el('circle', { cx: -5.5, cy: -13, r: 6.5, fill: DUCK, stroke: INK, 'stroke-width': 1.8 }, f);
    el('path', { d: 'M-8.5 -8.9 L-4 -8.6', stroke: DUCK, 'stroke-width': 2.4 }, f); // blend head into body
    el('circle', { cx: -7.6, cy: -14.4, r: 1.55, fill: INK }, f);
    el('circle', { cx: -8.1, cy: -14.9, r: 0.55, fill: '#FFFFFF' }, f);
    el('path', { d: 'M-1.5 -4.8 Q4 -9.8 9.2 -4.3', fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, f);
    el('ellipse', { cx: -3.4, cy: -16.6, rx: 2.4, ry: 1.2, fill: '#FFFFFF', opacity: 0.6, transform: 'rotate(-25 -3.4 -16.6)' }, f);
    return { g: g, f: f };
  }
  function makeBomb(parent, c) {
    var g = el('g', {}, parent);
    el('circle', { r: 10.5, fill: c, stroke: INK, 'stroke-width': 2.2 }, g);
    var spin = el('g', {}, g);
    el('path', { d: 'M-9.8 1 Q0 4.2 9.8 1', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 1.3 }, spin);
    [[-4, -3.5, 1], [3, -5.5, 0], [5.5, 2.5, 1], [-2, 5, 0], [-6.5, 3, 0], [1, -0.5, 1], [6, -2, 0], [-1.5, 7, 1]].forEach(function (p) {
      el('circle', { cx: p[0], cy: p[1], r: p[2] ? 1.15 : 0.95, fill: p[2] ? '#FFFFFF' : mix(c, INK, 0.4), 'fill-opacity': p[2] ? 0.8 : 0.7 }, spin);
    });
    el('path', { d: 'M-6.5 7.5 A10 10 0 0 0 8.5 5.5', fill: 'none', stroke: INK, 'stroke-opacity': 0.18, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
    el('ellipse', { cx: -4, cy: -4.8, rx: 3.3, ry: 1.9, fill: '#FFFFFF', 'fill-opacity': 0.5, transform: 'rotate(-32 -4 -4.8)' }, g);
    return { g: g, spin: spin };
  }
  function makeCap(parent) {
    var g = el('g', {}, parent);
    el('path', { d: 'M-18 0 C-19 -15 -9 -21 0 -21 C9 -21 19 -15 18 0 Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    [[-10, -12, 1.8], [-1, -16, 1.6], [8, -10, 1.9], [-3, -6.5, 1.5], [12, -3.5, 1.3], [-12, -4, 1.3], [5, -17.5, 1.1]].forEach(function (p) {
      el('circle', { cx: p[0], cy: p[1], r: p[2], fill: CAPDOT }, g);
    });
    el('path', { d: 'M12 -2.5 Q15 -10 9.5 -16.5', fill: 'none', stroke: INK, 'stroke-opacity': 0.12, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    var d = 'M-20.5 -2.6 L20.5 -2.6 L20.5 0.6';
    for (var i = 0; i < 8; i++) d += ' q-2.56 3.8 -5.125 0';
    d += ' Z';
    el('path', { d: d, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
    return g;
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-bathbomb-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var OY = T.y - 4; // tub origin y (water-surface centre); the chip's spot is OY + 4
    var natBase = OY + OFF, baseY = Math.min(natBase, 558);

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpT = el('clipPath', { id: id + 'tub', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -400, y: -400, width: 1200, height: f1(baseY + 1.5 + 400) }, cpT);
    var cpO = el('clipPath', { id: id + 'open', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('ellipse', { cx: 0, cy: 0, rx: 55, ry: 14.2 }, cpO);
    var cpS = el('clipPath', { id: id + 'soak', clipPathUnits: 'userSpaceOnUse' }, defs);
    var soakPath = el('path', { d: '' }, cpS);
    var clipT = 'url(#' + id + 'tub)', clipO = 'url(#' + id + 'open)';

    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = el('g', {}, svg);
    var tableG = el('g', {}, cam);
    el('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    el('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    el('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    var rowsG = [], chipsG = [];
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

    // hole + tub shadow + eruption dust
    var hole = el('g', {}, cam);
    var holeE = el('ellipse', { cx: T.x, cy: baseY, rx: 0, ry: 0, fill: HOLE, stroke: INK, 'stroke-width': 2.2 }, hole);
    var holeIn = el('ellipse', { cx: T.x, cy: baseY + 2, rx: 0, ry: 0, fill: '#0B241C' }, hole);
    var tShadow = el('ellipse', { cx: T.x, cy: baseY + 2, rx: 60, ry: 6, fill: INK, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: INK, 'stroke-opacity': 0.5, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // Nate's chip shadow (world, under the tub)
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, cam);

    // ---- tub: back layer ----
    var backWrap = el('g', { 'clip-path': clipT }, cam);
    var tubBack = el('g', {}, backWrap);
    el('ellipse', { cx: 0, cy: 0, rx: 64, ry: 20, fill: BODY, stroke: INK, 'stroke-width': 2.6 }, tubBack);
    el('ellipse', { cx: 0, cy: 0, rx: 60.2, ry: 17.6, fill: 'none', stroke: INK, 'stroke-opacity': 0.1, 'stroke-width': 1.4 }, tubBack);
    el('ellipse', { cx: 0, cy: 0, rx: 56, ry: 15, fill: INNER, stroke: INK, 'stroke-width': 2 }, tubBack);
    var inner = el('g', { 'clip-path': clipO }, tubBack);
    el('path', { d: 'M-56 0 A56 15 0 0 1 56 0 A56 11 0 0 0 -56 0 Z', fill: INNER2, opacity: 0.7 }, inner);
    el('ellipse', { cx: 0, cy: 8, rx: 42, ry: 7.5, fill: INNER2 }, inner);
    el('ellipse', { cx: DRAIN[0], cy: DRAIN[1] + 3, rx: 3.6, ry: 1.6, fill: PLUG, opacity: 0.8 }, inner);
    var water = el('ellipse', { cx: 0, cy: 3, rx: 53, ry: 13.5, fill: WATER }, inner);
    var glints = el('path', { d: 'M-46 1 q4 -2 8 0 q4 2 8 0 M24 8 q4 -2 8 0 q4 2 8 0 M-12 -7 q3 -1.5 6 0', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.8 }, inner);
    var ribbonsG = el('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, inner);
    var ribbons = [0, 1, 2].map(function () {
      return { a: el('path', { stroke: mix(dealerC, INK, 0.08), 'stroke-width': 6 }, ribbonsG), b: el('path', { stroke: mix(dealerC, '#FFFFFF', 0.45), 'stroke-width': 2 }, ribbonsG) };
    });
    var ripples = [0, 1, 2].map(function () { return el('ellipse', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.6, opacity: 0 }, inner); });
    var vortex = el('path', { fill: 'none', stroke: mix(dealerC, INK, 0.4), 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, inner);
    var vortex2 = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0 }, inner);
    // tap at the left end
    var tap = el('g', {}, tubBack);
    el('ellipse', { cx: -58, cy: -3, rx: 5.5, ry: 2.6, fill: BRASS, stroke: INK, 'stroke-width': 1.6 }, tap);
    el('path', { d: 'M-58 -4 L-58 -23 Q-58 -31 -50.5 -31 Q-43 -31 -43 -23 L-43 -19', fill: 'none', stroke: INK, 'stroke-width': 6.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, tap);
    el('path', { d: 'M-58 -4 L-58 -23 Q-58 -31 -50.5 -31 Q-43 -31 -43 -23 L-43 -19', fill: 'none', stroke: BRASS, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, tap);
    el('path', { d: 'M-56.6 -22 Q-56.5 -28.6 -51 -29.4', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 1.1, 'stroke-linecap': 'round' }, tap);
    el('path', { d: 'M-62 -14 L-51 -14', stroke: INK, 'stroke-width': 5.4, 'stroke-linecap': 'round' }, tap);
    el('path', { d: 'M-62 -14 L-51 -14', stroke: BRASS, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, tap);
    el('circle', { cx: -58, cy: -14, r: 2.6, fill: BRASS, stroke: INK, 'stroke-width': 1.4 }, tap);

    // ---- middle-back: things behind the chip ----
    var midBackWrap = el('g', { 'clip-path': clipT }, cam);
    var midBack = el('g', {}, midBackWrap);
    var duckB = makeDuck(midBack);

    // ---- Nate's chip (world) ----
    var vG = el('g', {}, cam);
    var vInner = el('g', {}, vG);
    var vChip = makeChip(vInner, victimC, vIni);
    var soakG = el('g', { 'clip-path': 'url(#' + id + 'soak)' }, vInner);
    makeChip(soakG, dealerC, '');
    var dTxtG = el('g', { opacity: 0 }, vInner);
    var dTxt = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 15 : 18 }, dTxtG);
    dTxt.textContent = dIni;
    var face = el('g', { opacity: 0 }, vInner);
    var blush = [-12.5, 12.5].map(function (x) { return el('ellipse', { cx: x, cy: -1, rx: 3.9, ry: 2.3, fill: BLUSH, opacity: 0 }, face); });
    var eyes = [-7, 7].map(function (x) {
      var g = el('g', {}, face);
      var o = el('g', {}, g);
      el('ellipse', { rx: 4.3, ry: 4.9, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.5 }, o);
      var pup = el('circle', { r: 2.45, fill: INK }, o);
      var gl = el('circle', { r: 0.85, fill: '#FFFFFF' }, o);
      var happy = el('path', { d: 'M-4.3 1.4 Q0 -4.2 4.3 1.4', fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round' }, g);
      var sq = el('path', { d: x < 0 ? 'M-3.6 -3.2 L3.2 0 L-3.6 3.2' : 'M3.6 -3.2 L-3.2 0 L3.6 3.2', fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      return { x: x, g: g, o: o, pup: pup, gl: gl, happy: happy, sq: sq };
    });
    var mouthS = el('path', { d: 'M-4.6 1.2 Q0 5.6 4.6 1.2', fill: 'none', stroke: INK, 'stroke-width': 2.1, 'stroke-linecap': 'round' }, face);
    var mouthO = el('ellipse', { cx: 0, cy: 2.6, rx: 2.5, ry: 3, fill: INK }, face);
    var mouthG = el('path', { d: 'M-5.8 0.6 Q0 8.4 5.8 0.6 Z', fill: INK, stroke: INK, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, face);
    var capOn = el('g', {}, vInner);
    var capOnInner = makeCap(el('g', {}, capOn));

    // ---- middle-front: things in front of the chip ----
    var midFrontWrap = el('g', { 'clip-path': clipT }, cam);
    var midFront = el('g', {}, midFrontWrap);
    var duckF = makeDuck(midFront);
    var foamG = el('g', {}, midFront);
    var foam = [0, 1, 2, 3, 4, 5, 6].map(function () { return el('circle', { r: 2, fill: '#FFFFFF', stroke: INK, 'stroke-opacity': 0.3, 'stroke-width': 0.8 }, foamG); });
    var bombL = makeBomb(midFront, dealerC);
    var capOff = el('g', {}, midFront);
    makeCap(capOff);

    // ---- tub: front layer ----
    var frontWrap = el('g', { 'clip-path': clipT }, cam);
    var tubFront = el('g', {}, frontWrap);
    var overlayG = el('g', { 'clip-path': clipO }, tubFront);
    var overlay = el('path', { fill: WATER }, overlayG);
    var wline = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.75 }, overlayG);
    [-1, 1].forEach(function (s) {
      el('path', { d: 'M' + 30 * s + ' 38 Q' + 47 * s + ' 42 ' + 45.5 * s + ' 52 L' + 37 * s + ' 52 Q' + 37.5 * s + ' 45 ' + 26 * s + ' 42 Z', fill: BRASS, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, tubFront);
      el('circle', { cx: 41 * s, cy: 54.5, r: 4.8, fill: BRASS, stroke: INK, 'stroke-width': 1.8 }, tubFront);
      [-4, 0, 4].forEach(function (o) { el('circle', { cx: 41 * s + o, cy: 58, r: 2.2, fill: BRASS, stroke: INK, 'stroke-width': 1.4 }, tubFront); });
    });
    el('path', { d: 'M-64 0 C-63.5 30 -52 46 -30 46 L30 46 C52 46 63.5 30 64 0 A64 20 0 0 1 -64 0 Z', fill: BODY, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, tubFront);
    el('path', { d: 'M-64 0 A64 20 0 0 0 64 0 L56 0 A56 15 0 0 1 -56 0 Z', fill: BODY }, tubFront);
    el('path', { d: 'M-56 0 A56 15 0 0 0 56 0', fill: 'none', stroke: INK, 'stroke-width': 2 }, tubFront);
    el('path', { d: 'M-63 4 A63 20 0 0 0 63 4', fill: 'none', stroke: INK, 'stroke-opacity': 0.13, 'stroke-width': 1.5 }, tubFront);
    el('path', { d: 'M-55 31 C-46 44 -36 43.5 -26 43.5 L26 43.5 C36 43.5 46 44 55 31', fill: 'none', stroke: SHADE, 'stroke-width': 5, 'stroke-linecap': 'round' }, tubFront);
    el('path', { d: 'M-50 14 Q-48 22 -42 27', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, tubFront);
    el('path', { d: 'M58 12 C57 26 50 36 40 40', fill: 'none', stroke: INK, 'stroke-opacity': 0.08, 'stroke-width': 5, 'stroke-linecap': 'round' }, tubFront);
    // plug chain + plug
    var chain = el('path', { fill: 'none', stroke: CHAIN, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 3.1' }, tubFront);
    el('circle', { cx: CHAIN_A[0], cy: CHAIN_A[1], r: 2.2, fill: BRASS, stroke: INK, 'stroke-width': 1.2 }, tubFront);
    var plug = el('g', {}, tubFront);
    el('path', { d: 'M-4.5 0 L4.5 0 L3.4 6 L-3.4 6 Z', fill: PLUG, stroke: INK, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, plug);
    el('circle', { cx: 0, cy: -1.3, r: 1.6, fill: 'none', stroke: CHAIN, 'stroke-width': 1.2 }, plug);
    // fizz bubbles, steam, local ticks
    var fizzG = el('g', {}, tubFront);
    var fizz = [];
    for (var fi = 0; fi < 18; fi++) fizz.push(el('circle', { r: 1.5, fill: '#FFFFFF', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 0.9, opacity: 0 }, fizzG));
    var gurgle = [0, 1, 2].map(function () { return el('circle', { r: 1.5, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.2, opacity: 0 }, tubFront); });
    var steam = el('path', { fill: 'none', stroke: STEAM, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, tubFront);
    var lticks = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, tubFront);

    // ---- world fx ----
    var bombW = makeBomb(cam, dealerC);
    var trail = el('path', { fill: 'none', stroke: dealerC, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam);
    var trail2 = el('path', { fill: 'none', stroke: dealerC, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);
    cam.insertBefore(trail, bombW.g); cam.insertBefore(trail2, bombW.g);
    var ghosts = [trail, trail2];
    var drops = [];
    for (var di = 0; di < 26; di++) drops.push(el('circle', { r: 2.5, fill: WATER, stroke: INK, 'stroke-width': 1.2, opacity: 0 }, cam));
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var thud = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    var S = {
      opts: opts, L: L, T: T, OY: OY, natBase: natBase, baseY: baseY, dealerC: dealerC, victimC: victimC, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, holeE: holeE, holeIn: holeIn, tShadow: tShadow, dust: dust, vSh: vSh,
      tubLayers: [tubBack, midBack, midFront, tubFront], wraps: [backWrap, midBackWrap, midFrontWrap, frontWrap],
      water: water, glints: glints, ribbons: ribbons, ripples: ripples, vortex: vortex, vortex2: vortex2,
      duckB: duckB, duckF: duckF, vG: vG, vInner: vInner, vChip: vChip, soakPath: soakPath, dTxtG: dTxtG,
      face: face, blush: blush, eyes: eyes, mouthS: mouthS, mouthO: mouthO, mouthG: mouthG, capOn: capOn, capOnInner: capOnInner,
      foam: foam, bombL: bombL, capOff: capOff, overlay: overlay, wline: wline, chain: chain, plug: plug, fizz: fizz,
      gurgle: gurgle, steam: steam, lticks: lticks, bombW: bombW, ghosts: ghosts, drops: drops, ripple: ripple, ticks: ticks, thud: thud, line: line
    };
    S.bombS0 = [-34, T.y - 120];
    S.bombE = toWorld(S, tubPose(BOMB_T1), BOMB_AT[0], BOMB_AT[1]);
    return S;
  }

  // tub local -> world
  function toWorld(S, m, px, py) {
    var a = m.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sqx = 2 - m.sqy;
    var x = px * sqx, y = (py - OFF) * m.sqy;
    return [S.T.x + m.dx + x * c - y * s, S.natBase + m.dy + x * s + y * c];
  }

  // ---------- chip face acting ----------
  function faceState(S, t, cx, cy) {
    var f = { mode: 'open', open: 1, look: [0, 0.15], mouth: 'smile', blush: 0 };
    if (t < 1460) { f.look = [0, -0.25]; f.mouth = 'o'; }
    else if (t < 1570) f.look = [-1, 0.1];
    else if (t < 1680) f.look = [1, 0.1];
    else if (t < 1830) { f.look = [0, -1]; f.mouth = 'o'; }
    else if (t < 1960) f.look = [0, 0.2];
    else if (t < 2370) { f.mode = 'happy'; }
    else if (t < 2450) { f.look = [-0.75, -0.65]; f.mouth = 'flat'; }
    else if (t < 3050) {
      var b = bombWorld(S, t), dx = b[0] - cx, dy = b[1] - (cy - 8), m = Math.hypot(dx, dy) || 1;
      f.look = [dx / m, dy / m]; f.mouth = t > 2700 ? 'o' : 'flat';
    }
    else if (t < 3260) { f.mode = 'squeeze'; f.mouth = 'flat'; }
    else if (t < 4920) { f.mode = 'happy'; f.mouth = 'grin'; }
    else if (t < 5260) { f.look = [0, 1]; f.mouth = t < 5080 ? 'o' : 'grin'; }
    else if (t < 5650) { var d = duckPose(t); f.look = [d.x < 0 ? -1 : 0.6, 0.15]; }
    else if (t < 6420) { f.look = [-0.7, 0.7]; f.mouth = 'o'; }
    else { f.mode = 'squeeze'; f.mouth = 'flat'; }
    // blinks / lid closes on mode boundaries
    f.open = 1 - Math.sin(Math.PI * seg(t, 1830, 1910)) - Math.sin(Math.PI * seg(t, 5000, 5080)) - Math.sin(Math.PI * seg(t, 1580, 1630)) * 0;
    if (t > 2370 && t < 2450) f.open = clamp(seg(t, 2370, 2420)); // one eye at a time handled below
    f.blush = seg(t, 1960, 2150) * (1 - seg(t, 6400, 6550));
    return f;
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6950, 7500)));
    var Z = lerp(1, 1.15, zk);
    var fy = clamp((T.y + S.baseY) / 2 - 30, 280, 345);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 7000, 7450)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- tub ----
    var m = tubPose(t);
    var tVis = t >= 1000 && t < 7390;
    var tubTr = 'translate(' + f1(T.x + m.dx) + ',' + f1(S.natBase + m.dy) + ') rotate(' + f1(m.rot) + ') scale(' + f2(2 - m.sqy) + ',' + f2(m.sqy) + ') translate(0,' + (-OFF) + ')';
    S.wraps.forEach(function (w) { w.setAttribute('display', tVis ? 'inline' : 'none'); });
    if (tVis) S.tubLayers.forEach(function (g) { g.setAttribute('transform', tubTr); });
    var hk = holeK(t);
    S.holeE.setAttribute('rx', f1(76 * hk)); S.holeE.setAttribute('ry', f1(12 * hk));
    S.holeIn.setAttribute('rx', f1(64 * hk)); S.holeIn.setAttribute('ry', f1(7 * hk));
    S.holeE.parentNode.setAttribute('display', hk > 0.01 ? 'inline' : 'none');
    var standing = tVis ? clamp(1 - m.dy / 30) * clamp(1 - Math.max(0, -m.dy) / 30, 0.4, 1) : 0;
    S.tShadow.setAttribute('cx', f1(T.x + m.dx + 2));
    S.tShadow.setAttribute('opacity', f1(standing * 20 * (t > 1300 ? 1 : 0)) / 100);
    var dp0 = seg(t, 1040, 1330);
    if (dp0 > 0 && dp0 < 1) {
      var dd = '';
      [-2.9, -2.5, -0.65, -0.25].forEach(function (a) {
        var r0 = 1 + 0.25 * eoC(dp0), r1 = r0 + 0.18 * (1 - dp0);
        dd += 'M' + f1(T.x + Math.cos(a) * 84 * r0) + ' ' + f1(S.baseY + Math.sin(a) * 16 * r0) + 'L' + f1(T.x + Math.cos(a) * 84 * r1) + ' ' + f1(S.baseY + Math.sin(a) * 16 * r1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- water ----
    var wt = waterTint(t), dp = drainK(t), we = waterEllipse(t);
    var wcol = mix(WATER, S.dealerC, 0.9 * wt);
    var hasW = we.rx > 0.6;
    S.water.setAttribute('cx', f1(we.cx)); S.water.setAttribute('cy', f1(we.cy));
    S.water.setAttribute('rx', f1(Math.max(0, we.rx))); S.water.setAttribute('ry', f1(Math.max(0, we.ry)));
    S.water.setAttribute('fill', wcol);
    S.water.setAttribute('display', hasW ? 'inline' : 'none');
    S.glints.setAttribute('opacity', f2(0.8 * (1 - seg(t, 5650, 5900)) * (1 - 0.4 * wt)));
    S.glints.setAttribute('transform', 'translate(' + f1(1.5 * Math.sin(t * 0.004)) + ',0)');
    // front-of-chip water (lower half of the surface ellipse, translucent)
    if (hasW) {
      S.overlay.setAttribute('d', 'M' + f1(we.cx - we.rx) + ' ' + f1(we.cy) + 'A' + f1(we.rx) + ' ' + f1(we.ry) + ' 0 0 0 ' + f1(we.cx + we.rx) + ' ' + f1(we.cy) + 'Z');
      S.overlay.setAttribute('fill', wcol);
      S.overlay.setAttribute('opacity', f2(0.5 + 0.32 * wt));
      var wl = '';
      var cxw = (chipX(t) - T.x) / (2 - m.sqy);
      wl = 'M' + f1(cxw - 18) + ' ' + f1(we.cy + 0.3 * Math.sin(t * 0.01)) + 'q9 ' + f1(1.6 * Math.sin(t * 0.012)) + ' 18 0q9 ' + f1(-1.6 * Math.sin(t * 0.012)) + ' 18 0';
      S.wline.setAttribute('d', dp < 0.3 && t > 1300 ? wl : '');
    } else { S.overlay.setAttribute('d', ''); S.wline.setAttribute('d', ''); }

    // ribbons of colour from the bomb
    var ribOn = seg(t, 3080, 3220) * (1 - seg(t, 4450, 4900));
    if (ribOn > 0) {
      var bl = bombLocal(Math.min(t, 4500)), R = 8 + 105 * eo(seg(t, 3080, 4300)), rotR = -(t - 3050) * 0.0042;
      S.ribbons.forEach(function (rb, k) {
        var d = '';
        for (var i = 0; i < 18; i++) {
          var s = i / 17, r = R * s, ang = k * 2.094 + s * 3.4 + rotR;
          d += (i ? 'L' : 'M') + f1(bl.x + r * Math.cos(ang)) + ' ' + f1(bl.y + r * Math.sin(ang) * 0.27);
        }
        rb.a.setAttribute('d', d); rb.b.setAttribute('d', d);
        rb.a.setAttribute('opacity', f2(ribOn * 0.95)); rb.b.setAttribute('opacity', f2(ribOn * 0.8));
        rb.a.setAttribute('stroke-width', f1(5 + 6 * seg(t, 3100, 4100)));
      });
    } else S.ribbons.forEach(function (rb) { rb.a.setAttribute('d', ''); rb.b.setAttribute('d', ''); });
    // ripple rings: scoop (around chip) and plop (around bomb)
    [[1290, 0, 3], [3055, BOMB_AT[0], BOMB_AT[1]], [3200, BOMB_AT[0], BOMB_AT[1]]].forEach(function (rr, k) {
      var e = S.ripples[k], a = seg(t, rr[0], rr[0] + 650);
      if (a <= 0 || a >= 1) { e.setAttribute('opacity', 0); return; }
      var rx = (k === 0 ? 24 : 8) + 46 * eoC(a);
      e.setAttribute('cx', rr[1]); e.setAttribute('cy', rr[2]); e.setAttribute('rx', f1(rx)); e.setAttribute('ry', f1(rx * 0.27));
      e.setAttribute('opacity', f2(0.9 * (1 - a)));
    });
    // whirlpool
    var vo = seg(t, 5620, 5750) * (1 - seg(t, 6300, 6460));
    if (vo > 0 && hasW) {
      var vd = '', vd2 = '', vr = -(t - 5620) * 0.013, RR = Math.max(4, we.rx * 0.95);
      for (var k = 0; k < 3; k++) {
        for (var i = 0; i < 14; i++) {
          var s = i / 13, r = RR * (0.12 + 0.88 * s), ang = k * 2.094 + s * 3.8 + vr;
          var px = DRAIN[0] + (we.cx - DRAIN[0]) * s + r * Math.cos(ang), py = DRAIN[1] + 1 + (we.cy - DRAIN[1] - 1) * s + r * Math.sin(ang) * 0.26;
          vd += (i ? 'L' : 'M') + f1(px) + ' ' + f1(py);
          if (i < 9) vd2 += (i ? 'L' : 'M') + f1(px + 1) + ' ' + f1(py - 1.2);
        }
      }
      S.vortex.setAttribute('d', vd); S.vortex.setAttribute('opacity', f2(vo));
      S.vortex2.setAttribute('d', vd2); S.vortex2.setAttribute('opacity', f2(vo * 0.8));
    } else { S.vortex.setAttribute('opacity', 0); S.vortex2.setAttribute('opacity', 0); }
    // gurgle bubbles at the drain
    S.gurgle.forEach(function (g, k) {
      var on = seg(t, 5680, 5760) * (1 - seg(t, 6350, 6460));
      var ph = ((t - 5680) / 330 + k / 3) % 1;
      if (on <= 0 || ph < 0) { g.setAttribute('opacity', 0); return; }
      g.setAttribute('cx', f1(DRAIN[0] + (k - 1) * 4)); g.setAttribute('cy', f1(DRAIN[1] + 1 - 5 * ph));
      g.setAttribute('r', f1(1.2 + 3 * ph));
      g.setAttribute('opacity', f2(on * (1 - ph)));
    });

    // ---- bomb (world flight, then local fizz) ----
    var fl = t >= BOMB_T0 && t < BOMB_T1;
    if (fl) {
      var bw = bombWorld(S, t), bp = seg(t, BOMB_T0, BOMB_T1);
      S.bombW.g.setAttribute('transform', tr(bw[0], bw[1], 0, 1.05));
      S.bombW.spin.setAttribute('transform', 'rotate(' + f1(600 * bp) + ')');
      S.bombW.g.setAttribute('display', 'inline');
      var td = '', td2 = '';
      for (var gi = 0; gi <= 6; gi++) {
        var g2 = bombWorld(S, Math.max(BOMB_T0, t - 84 + gi * 14));
        td += (gi ? 'L' : 'M') + f1(g2[0]) + ' ' + f1(g2[1]);
        var g3 = bombWorld(S, Math.max(BOMB_T0, t - 200 + gi * 25));
        td2 += (gi ? 'L' : 'M') + f1(g3[0] - 3) + ' ' + f1(g3[1] - 12);
      }
      S.ghosts[0].setAttribute('d', td); S.ghosts[0].setAttribute('opacity', f2(0.2 * seg(t, BOMB_T0 + 60, BOMB_T0 + 150)));
      S.ghosts[1].setAttribute('opacity', 0);
    } else { S.bombW.g.setAttribute('display', 'none'); S.ghosts.forEach(function (gh) { gh.setAttribute('opacity', 0); }); }
    var bOn = t >= BOMB_T1 && t < 4520;
    var bl2 = bombLocal(t);
    if (bOn && bl2.s > 0.02) {
      var jig = 1 + 0.06 * Math.sin(t * 0.09);
      S.bombL.g.setAttribute('transform', tr(bl2.x, bl2.y, 8 * Math.sin(t * 0.03), bl2.s * jig, bl2.s / jig));
      S.bombL.spin.setAttribute('transform', 'rotate(' + f1(bl2.rot) + ')');
      S.bombL.g.setAttribute('display', 'inline');
    } else S.bombL.g.setAttribute('display', 'none');
    // foam around the bomb
    S.foam.forEach(function (c, k) {
      var on = seg(t, 3080, 3200) * (1 - seg(t, 4300, 4600));
      if (on <= 0) { c.setAttribute('opacity', 0); return; }
      var a = k / 7 * Math.PI * 2 + t * 0.004 * (k % 2 ? 1 : -1);
      var rr = (9 + 4 * bl2.s) * (1 + 0.15 * Math.sin(t * 0.03 + k));
      c.setAttribute('cx', f1(bl2.x + Math.cos(a) * rr)); c.setAttribute('cy', f1(bl2.y + 1 + Math.sin(a) * rr * 0.3));
      c.setAttribute('r', f1((1.8 + (k % 3) * 0.8) * on * (0.6 + 0.4 * bl2.s)));
      c.setAttribute('fill', mix('#FFFFFF', S.dealerC, 0.2));
      c.setAttribute('opacity', 0.95);
    });
    // fizz bubbles
    var fzOn = seg(t, 3070, 3180) * (1 - seg(t, 4650, 5000));
    S.fizz.forEach(function (b, k) {
      if (fzOn <= 0) { b.setAttribute('opacity', 0); return; }
      var life = 480 + 140 * hsh(k), u = (t - 3070) / life + hsh(k + 40), c = Math.floor(u), ph = u - c;
      var seed = k * 13.7 + c * 3.1;
      if (hsh(seed) > fzOn) { b.setAttribute('opacity', 0); return; }
      var fromBomb = (k % 3 !== 0) && t < 4450;
      var ox, oy;
      if (fromBomb) { ox = bl2.x + (hsh(seed + 1) - 0.5) * 16 * (0.4 + bl2.s); oy = bl2.y - 2; }
      else { ox = (hsh(seed + 2) - 0.5) * 90; oy = 2 + (hsh(seed + 3) - 0.5) * 12; }
      var x = ox + 2 * Math.sin(ph * 9 + k), y = oy - (14 + 18 * hsh(seed + 4)) * eo(ph);
      b.setAttribute('cx', f1(x)); b.setAttribute('cy', f1(y));
      b.setAttribute('r', f1((1.1 + 1.8 * hsh(seed + 5)) * (0.6 + 0.6 * ph)));
      b.setAttribute('fill', mix('#FFFFFF', S.dealerC, 0.3 * wt + 0.15));
      b.setAttribute('opacity', ph > 0.88 ? 0 : 0.95);
    });

    // steam
    var stOn = seg(t, 1750, 2050) * (1 - seg(t, 6000, 6500));
    if (stOn > 0) {
      var sdd = '';
      [-20, 4, 26].forEach(function (ox, k) {
        var ph2 = ((t - 1750) / 1300 + k * 0.33) % 1;
        sdd += squiggle(ox + 3 * Math.sin(k * 2), -26 - 22 * ph2 - (k === 1 ? 10 : 0), 12, t * 0.01 + k * 2);
      });
      S.steam.setAttribute('d', sdd); S.steam.setAttribute('opacity', f2(0.55 * stOn));
    } else S.steam.setAttribute('opacity', 0);

    // ---- duck ----
    var duckVis = t >= 1450 && t < 7200;
    var dk = duckPose(t);
    var front = dk.y >= 1.6 || t >= 6800;
    S.duckF.g.setAttribute('display', duckVis && front && t < 6800 ? 'inline' : 'none');
    S.duckB.g.setAttribute('display', duckVis && (!front || t >= 6800) ? 'inline' : 'none');
    var duck = (front && t < 6800) ? S.duckF : S.duckB;
    duck.g.setAttribute('transform', 'translate(' + f1(dk.x) + ',' + f1(dk.y) + ') rotate(' + f1(dk.rot) + ') scale(' + f2(dk.fx * (2 - dk.sq)) + ',' + f2(dk.sq) + ')');
    // chain + plug
    var tip = beakTip(dk), plugP = null;
    if (t >= 5470 && t < 6800) plugP = tip;
    else if (t >= 6800) { var fp = eo(seg(t, 6800, 6980)); plugP = [lerp(beakTip(duckPose(6799))[0], -42, fp), lerp(beakTip(duckPose(6799))[1], 13, ei(fp))]; }
    var cend = plugP ? [plugP[0], plugP[1] - 1.5] : [-37, 5.5];
    var cmid = [(CHAIN_A[0] + cend[0]) / 2, Math.max(CHAIN_A[1], cend[1]) + (plugP ? 3 : 2)];
    S.chain.setAttribute('d', 'M' + CHAIN_A[0] + ' ' + CHAIN_A[1] + 'Q' + f1(cmid[0]) + ' ' + f1(cmid[1]) + ' ' + f1(cend[0]) + ' ' + f1(cend[1]));
    if (plugP) { S.plug.setAttribute('display', 'inline'); S.plug.setAttribute('transform', 'translate(' + f1(plugP[0]) + ',' + f1(plugP[1]) + ') rotate(' + f1(Math.sin(t * 0.02) * 10) + ') scale(1.3)'); }
    else S.plug.setAttribute('display', 'none');
    // local ticks: plug pop + squeak
    var lt = '', lo = 0;
    var pp = seg(t, 5560, 5800);
    if (pp > 0 && pp < 1) { lt += tickBurst(DRAIN[0], DRAIN[1] - 2, 7 + 6 * eoC(pp), 12 + 6 * eoC(pp) - 4 * pp, [-2.6, -2.0, -1.2, -0.55], 1.3); lo = 1 - pp; }
    var qp = seg(t, 6740, 7000);
    if (qp > 0 && qp < 1) {
      var hd = [dk.x - 5 * dk.fx, dk.y - 13];
      lt += tickBurst(hd[0], hd[1], 10 + 6 * eoC(qp), 15 + 6 * eoC(qp) - 4 * qp, [-2.7, -2.2, -1.57, -0.95, -0.45]);
      lo = Math.max(lo, 1 - qp);
    }
    S.lticks.setAttribute('d', lt); S.lticks.setAttribute('opacity', f2(lo * 0.9));

    // ---- Nate's chip ----
    var cx = chipX(t), cy = T.y + chipFloat(t), rot = 0, ssx = 1, ssy = 1, sc = chipPop(T);
    if (t < 1220) {
      var nh = seg(t, 650, 980);
      cy -= 5 * Math.sin(Math.PI * seg(t, 650, 820));
      cx += 1.8 * Math.sin((t - 650) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
      sc *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 820));
      var cr = Math.sin(Math.PI * seg(t, 1100, 1240)); ssx += 0.06 * cr; ssy -= 0.08 * cr; // braces as the rim arrives
    }
    var sq = spring(t - 1370, 0.1, 3, 110) + spring(t - 1830, 0.09, 3.5, 90) + spring(t - 3060, 0.07, 3.5, 100) + spring(t - 7150, 0.12, 3.4, 90);
    ssx += sq; ssy -= sq;
    rot += 5 * Math.sin((t - 3300) * 0.003) * seg(t, 3250, 3500) * (1 - seg(t, 4700, 4950));
    rot += 7 * Math.sin((t - 5650) * 0.012) * seg(t, 5650, 5800) * (1 - seg(t, 6200, 6400));
    var wg = seg(t, 5080, 5260); rot += 9 * Math.sin(2 * Math.PI * 2 * wg) * (1 - wg);
    var sk = seg(t, 6420, 6640); rot += 16 * Math.sin(2 * Math.PI * 4 * sk) * (1 - sk);
    // reveal pop
    var rv = seg(t, 6560, 6800);
    if (rv > 0 && rv < 1) { var rp = Math.sin(Math.PI * rv) * (1 - rv); ssx += 0.1 * rp; ssy += 0.1 * rp; }
    if (t >= 7400) { cx = T.x; cy = T.y; rot = 0; ssx = 1; ssy = 1; sc = 1; }
    S.vG.setAttribute('transform', 'translate(' + f1(cx) + ',' + f1(cy) + ') rotate(' + f1(rot) + ') scale(' + f2(sc * ssx) + ',' + f2(sc * ssy) + ')');
    // shadow: only when on the card
    var shOn = t < 1300 ? 1 - seg(t, 1180, 1290) : seg(t, 7120, 7200);
    S.vSh.setAttribute('cx', f1(cx + 1.5)); S.vSh.setAttribute('cy', f1(cy + 3.5));
    S.vSh.setAttribute('r', f1(CR * Math.min(1.04, sc)));
    S.vSh.setAttribute('opacity', f2(0.28 * shOn));
    // soak: Nick's colour climbs up through the chip from the waterline
    var sk2 = soakK(t);
    if (sk2 <= 0) S.soakPath.setAttribute('d', 'M-30 40 L30 40 L30 41 L-30 41 Z');
    else if (sk2 >= 1) S.soakPath.setAttribute('d', 'M-30 -30 L30 -30 L30 30 L-30 30 Z');
    else {
      var ey = 24 - 50 * sk2, sd = 'M-30 30 L-30 ' + f1(ey);
      for (var xi = -30; xi <= 30; xi += 6) sd += 'L' + xi + ' ' + f1(ey + 1.6 * Math.sin(xi * 0.35 + t * 0.012));
      S.soakPath.setAttribute('d', sd + 'L30 30 Z');
    }
    // letters: Nate's fades as the face wakes; Nick's pops in at the reveal
    if (S.vChip.tx) S.vChip.tx.setAttribute('opacity', f2(1 - seg(t, 1300, 1420)));
    var rvA = seg(t, 6560, 6720);
    S.dTxtG.setAttribute('opacity', f2(rvA));
    S.dTxtG.setAttribute('transform', 'scale(' + f2(rvA > 0 && rvA < 1 ? 0.4 + 0.6 * backOut(rvA, 2.6) : 1) + ')');
    // face
    var faceA = seg(t, 1320, 1440) * (1 - seg(t, 6500, 6600));
    S.face.setAttribute('opacity', f2(faceA));
    if (faceA > 0) {
      var fs = faceState(S, t, cx, cy);
      S.eyes.forEach(function (e, i) {
        var open = fs.open;
        if (t > 2370 && t < 2450 && i === 1) open = 1 - seg(t, 2370, 2380) + seg(t, 2420, 2450); // wink-open: left eye first
        var mode = fs.mode;
        if (t > 2370 && t < 2420 && i === 1) mode = 'happy';
        e.o.setAttribute('display', mode === 'open' ? 'inline' : 'none');
        e.happy.setAttribute('display', mode === 'happy' ? 'inline' : 'none');
        e.sq.setAttribute('display', mode === 'squeeze' ? 'inline' : 'none');
        e.g.setAttribute('transform', 'translate(' + e.x + ',-8) scale(1,' + f2(mode === 'open' ? Math.max(0.08, open) : 1) + ')');
        var lx = clamp(fs.look[0], -1, 1) * 1.7, ly = clamp(fs.look[1], -1, 1) * 2;
        e.pup.setAttribute('cx', f1(lx)); e.pup.setAttribute('cy', f1(ly));
        e.gl.setAttribute('cx', f1(lx - 0.8)); e.gl.setAttribute('cy', f1(ly - 0.9));
      });
      S.mouthS.setAttribute('display', fs.mouth === 'smile' ? 'inline' : 'none');
      S.mouthO.setAttribute('display', fs.mouth === 'o' ? 'inline' : 'none');
      S.mouthG.setAttribute('display', fs.mouth === 'grin' ? 'inline' : 'none');
      if (fs.mouth === 'flat') { S.mouthS.setAttribute('display', 'inline'); S.mouthS.setAttribute('d', 'M-3.6 2.6 Q0 3.4 3.6 2.6'); }
      else S.mouthS.setAttribute('d', 'M-4.6 1.2 Q0 5.6 4.6 1.2');
      S.blush.forEach(function (b) { b.setAttribute('opacity', f2(0.6 * fs.blush)); });
    }
    // shower cap: drops in from above, sits on, flies off into the tub
    var capVis = t >= 1640 && t < 6440;
    S.capOn.setAttribute('display', capVis ? 'inline' : 'none');
    if (capVis) {
      var cp = seg(t, 1640, 1830), capY, capR, csx = 1, csy = 1;
      if (cp < 1) { capY = lerp(-300, -16, ei(cp)); capR = 14 * Math.sin(cp * 9) * (1 - cp); }
      else { capY = -16; capR = -9 + 2 * Math.sin((t - 1830) * 0.004) * seg(t, 1900, 2100); }
      var cs = spring(t - 1830, 0.16, 3.4, 90); csx += cs; csy -= cs;
      S.capOn.setAttribute('transform', 'translate(0,' + f1(capY) + ') rotate(' + f1(capR) + ') scale(' + f2(csx) + ',' + f2(csy) + ')');
    }
    var coff = seg(t, 6440, 6800);
    if (coff > 0 && t < 7380) {
      var c0 = [(cx - T.x), cy - S.OY - 16], c1 = [38, 13];
      var cP = coff < 1 ? arc2(c0, c1, 46, coff) : c1;
      S.capOff.setAttribute('display', 'inline');
      S.capOff.setAttribute('transform', 'translate(' + f1(cP[0]) + ',' + f1(cP[1]) + ') rotate(' + f1(-9 + 190 * eo(coff)) + ') scale(' + f2(1 - 0.2 * coff) + ')');
    } else S.capOff.setAttribute('display', 'none');

    // ---- splash droplets (world) ----
    var di = 0;
    function splash(t0, o, n, spd, spread, col) {
      for (var i = 0; i < n; i++) {
        var d = S.drops[di++]; if (!d) return;
        var tau = (t - t0) / 1000, life = 0.34 + 0.08 * hsh(t0 + i);
        if (tau <= 0 || tau >= life) { d.setAttribute('opacity', 0); continue; }
        var a = -Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread, v = spd * (0.75 + 0.5 * hsh(t0 * 0.1 + i));
        var x = o[0] + Math.cos(a) * v * tau * 0.8, y = o[1] + Math.sin(a) * v * tau + 520 * tau * tau;
        d.setAttribute('cx', f1(x)); d.setAttribute('cy', f1(y));
        d.setAttribute('r', f1(3.4 * (1 - 0.45 * tau / life) * (0.8 + 0.4 * hsh(i + t0))));
        d.setAttribute('fill', col);
        d.setAttribute('opacity', f2(1 - ei(tau / life)));
      }
    }
    splash(1270, [T.x, T.y - 2], 7, 210, 2.6, WATER);
    splash(1570, toWorld(S, m, 34, -2), 4, 150, 1.8, WATER);
    splash(3055, S.bombE, 9, 260, 2.4, mix(WATER, S.dealerC, 0.35));
    splash(5565, toWorld(S, m, DRAIN[0], DRAIN[1]), 4, 150, 1.6, mix(WATER, S.dealerC, 0.9));
    for (; di < S.drops.length; di++) S.drops[di].setAttribute('opacity', 0);

    // reveal ring + sparkle ticks
    var rg = seg(t, 6560, 7060);
    S.ripple.setAttribute('cx', f1(T.x)); S.ripple.setAttribute('cy', f1(T.y + FLOOR));
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rg)));
    S.ripple.setAttribute('opacity', rg > 0 && rg < 1 ? f2((1 - rg) * 0.9) : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rg) + 0.8));
    var tp = seg(t, 6560, 6840);
    if (tp > 0 && tp < 1) {
      S.ticks.setAttribute('d', tickBurst(T.x, T.y + FLOOR, 28 + 9 * eoC(tp), 34 + 9 * eoC(tp) - 5 * tp, [-2.55, -2.0, -1.57, -1.14, -0.6]));
      S.ticks.setAttribute('opacity', f2((1 - tp) * 0.85));
    } else S.ticks.setAttribute('opacity', 0);
    // set-down thud lines
    var th = seg(t, 7150, 7400);
    if (th > 0 && th < 1) {
      var o2 = 6 * eoC(th), dth = '';
      [-1, 1].forEach(function (s) {
        dth += 'M' + f1(T.x + s * (27 + o2)) + ' ' + f1(T.y + 13) + 'L' + f1(T.x + s * (34 + o2 - 3 * th)) + ' ' + f1(T.y + 15);
        dth += 'M' + f1(T.x + s * (26 + o2)) + ' ' + f1(T.y + 4) + 'L' + f1(T.x + s * (33 + o2 - 3 * th)) + ' ' + f1(T.y + 3);
      });
      S.thud.setAttribute('d', dth); S.thud.setAttribute('opacity', f2((1 - th) * 0.8));
    } else S.thud.setAttribute('opacity', 0);

    // final line
    var lp2 = seg(t, 7650, 7980);
    S.line.setAttribute('opacity', f2(eo(lp2)));
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');

    function chipX(tt) {
      var x = T.x;
      x += 2 * Math.sin((tt - 3300) * 0.0021) * seg(tt, 3250, 3500) * (1 - seg(tt, 4700, 4950));
      x += 2.2 * Math.sin((tt - 5650) * 0.008) * seg(tt, 5650, 5800) * (1 - seg(tt, 6200, 6400));
      return x;
    }
  }

  function getScene(root, opts) {
    var c = root.__cc2bathbomb;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2bathbomb = S;
    return S;
  }

  window.CCSteal2_bathbomb = {
    title: 'The Bath Bomb',
    blurb: 'A tiny claw-foot tub rises up around Nate’s chip for a relaxing soak with a rubber duck, until a bath bomb in Nick’s colour plops in and fizzes the whole bath (and the chip) Nick’s colour; the plug is pulled and the chip is left sitting in its spot, wearing Nick’s initial.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2bathbomb = S;
      var token = {};
      root.__cc2bathbombToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2bathbombToken !== token) { resolve(); return; }
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
