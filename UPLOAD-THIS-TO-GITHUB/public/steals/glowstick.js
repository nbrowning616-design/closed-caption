/* Closed Caption - "steal" moment - concept: LIGHTS OUT (glow stick)
 *
 * Everyone knows it: snap a glow stick, shake it, and it lights up; anything it touches in the
 * dark catches its colour. Top-down felt table; a pull-cord light switch hangs over the top
 * right corner; the glow stick is a little floating character.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on. A pull cord hangs at the top right.
 *  650-1000  Camera eases in a touch (whole rows stay in frame). Nate's chip does a nervous hop.
 *  950-1170  The cord is yanked from off-screen: CLICK. The room goes dark (with a flicker).
 * 1170-1450  Dark beat. Everything is a dim silhouette; Nate's chip shivers.
 * 1400-2200  Two blinking eyes drift in from the left: a dull, uncracked glow stick, floating.
 *           It looks down at Nate's chip, then at us.
 * 2200-2550  It grips itself and BENDS, straining, eyes squinting.
 *      2550  CRACK: a spark at the bend, the stick snaps straight, eyes wide.
 * 2700-3300  SHAKE: it shakes itself silly; light floods up through it in Nick's colour with
 *           light trails, throwing a glow pool across the table.
 * 3300-3550  It stops, radiant, looks down at itself (wow), then at us. Proud.
 * 3550-4400  Rave dance: it bobs and twirls over to Nate's chip in a figure-eight, two light trails.
 * 4400-4700  Wind-up and TAP: it bonks the centre of the chip like a wand (sparkle burst, squash).
 * 4700-5350  The chip catches the glow from the centre out, rising a hair, until it is radiant
 *           in Nick's colour with Nick's initial. The stick watches in awe...
 * 5320-5600  ...and does a delighted little bounce. The glowing chip holds (beat).
 * 5600-6230  The stick floats up to the cord, hooks the bead, and tugs: CLICK, lights on.
 * 6230-7200  In the light the stick has gone dim; it droops, yawns, and drifts off to the right.
 * 6380-6650  The chip, still Nick's colour, sets back down in exactly its spot: squash + ring.
 * 6650-7350  Camera is already back; the whole table settles and holds still.
 * 7350-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', NIGHT = '#0B1026';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000, DARK = 0.78;
  var SC = 1.3, HL = 32;
  var uid = 0;

  // ---------- math ----------
  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function lin(t) { return t; }
  function eio(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function eioC(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eo(t) { return 1 - (1 - t) * (1 - t); }
  function eoC(t) { return 1 - Math.pow(1 - t, 3); }
  function ei(t) { return t * t; }
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
  function hex(c) { // rgb(...) -> #hex so mix() can chain
    var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(c); if (!m) return c;
    return '#' + [m[1], m[2], m[3]].map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('');
  }
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }
  function lerp2(a, b, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)]; }

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

  // ---------- the stick: pure functions of t ----------
  var CORD_X = 350, BEAD_Y = 86;
  function darkV(t) {
    return kf([[0, 0], [1080, 0], [1105, DARK], [1135, 0.34], [1170, DARK], [6230, DARK], [6255, 0.06], [6285, 0.42], [6340, 0]], t, lin);
  }
  function litV(t) {
    if (t < 2550) return 0;
    if (t < 2700) return 0.22 * (1 - seg(t, 2550, 2700)) + 0.06;
    var L = 0.06 + 0.94 * eio(seg(t, 2700, 3250));
    if (t < 3300) L *= 0.88 + 0.12 * Math.abs(Math.sin((t - 2700) * 0.024)); // sloshes brighter on each shake
    L *= 1 + 0.04 * Math.sin(t * 0.011);
    if (t > 6230) L = lerp(L, 0.16, eoC(seg(t, 6260, 6600)));
    return L;
  }
  function bobEnv(t) { return kf([[0, 1], [4350, 1], [4450, 0], [4900, 0], [5050, 1], [5950, 1], [6050, 0], [6300, 0], [6500, 1]], t); }

  function pose(S, t) {
    var P1 = S.P1, D = S.D, Hh = S.H, Wt = S.Wt, C = S.Cpos, E0 = S.E0;
    var x, y, rot = 0, sx = 1, sy = 1, bend = 0, vis = t >= 1380 && t < 7250, q;
    if (t < 2200) {
      q = seg(t, 1380, 2200);
      x = lerp(E0[0], P1[0], eoC(q)); y = lerp(E0[1], P1[1], eio(q));
      rot = 14 * Math.sin(Math.PI * q) * (1 - q) + 6 * Math.sin(Math.PI * seg(t, 1950, 2200));
    } else if (t < 2550) {
      x = P1[0]; y = P1[1];
      bend = 0.95 * eio(seg(t, 2240, 2530));
      x += 0.9 * Math.sin(t * 0.9) * seg(t, 2300, 2530);
      sy = 1 - 0.05 * bend;
    } else if (t < 3550) {
      x = P1[0]; y = P1[1];
      var d = t - 2550;
      bend = 0.95 * Math.exp(-d / 40) * Math.cos(2 * Math.PI * 7 * d / 1000);
      y -= 10 * Math.sin(Math.PI * seg(t, 2550, 2720));
      sy += spring(d, 0.12, 6, 60);
      var A = seg(t, 2700, 2760) * (1 - seg(t, 3230, 3300)), ph = 2 * Math.PI * (t - 2700) / 125;
      y += 15 * A * Math.sin(ph);
      rot += 20 * A * Math.sin(ph + 0.7);
      sy += 0.09 * A * Math.abs(Math.cos(ph)); sx -= 0.05 * A * Math.abs(Math.cos(ph));
      var td = Math.sin(Math.PI * seg(t, 3320, 3500));
      y -= 7 * td; sy += 0.1 * td; sx -= 0.06 * td;
    } else if (t < 4400) {
      q = seg(t, 3550, 4400);
      var b = lerp2(P1, D, eio(q)), env = Math.sin(Math.PI * q), th = 2 * Math.PI * 1.5 * q;
      x = b[0] + 38 * Math.sin(th) * env;
      y = b[1] + 16 * Math.sin(2 * th) * env - 8 * Math.abs(Math.sin(2 * Math.PI * 4 * q)) * env;
      rot = 360 * eio(seg(q, 0.3, 0.74)) + 16 * Math.sin(4 * th) * env;
      var bb = Math.abs(Math.cos(2 * Math.PI * 4 * q)) * env;
      sy += 0.08 * bb; sx -= 0.05 * bb;
    } else if (t < 4560) {
      q = eo(seg(t, 4400, 4560));
      x = D[0] + 14 * q; y = D[1] - 16 * q; rot = 360 - 14 * q; sy = 1 + 0.06 * q;
    } else if (t < 4650) {
      q = ei(seg(t, 4560, 4650));
      x = lerp(D[0] + 14, Hh[0], q); y = lerp(D[1] - 16, Hh[1], q); rot = lerp(346, 385, q); sy = 1 + 0.08 * Math.sin(Math.PI * q);
    } else if (t < 4760) {
      x = Hh[0]; y = Hh[1]; rot = 385;
      var sq = Math.exp(-(t - 4650) / 45) * Math.cos(2 * Math.PI * 8 * (t - 4650) / 1000);
      sy = 1 - 0.14 * sq; sx = 1 + 0.1 * sq;
    } else if (t < 5600) {
      q = eo(seg(t, 4760, 5000));
      x = lerp(Hh[0], Wt[0], q); y = lerp(Hh[1], Wt[1], q); rot = lerp(385, S.rotW, q);
      var bo = Math.sin(Math.PI * seg(t, 5330, 5530));
      y -= 13 * bo; sy += 0.1 * bo; sx -= 0.06 * bo;
      sy += spring(t - 5530, -0.1, 5, 60); sx -= spring(t - 5530, -0.06, 5, 60);
      rot += 8 * Math.sin(2 * Math.PI * seg(t, 5330, 5530));
    } else if (t < 6230) {
      q = eio(seg(t, 5600, 6050));
      var p = arc2(Wt, C, 46, q);
      x = p[0]; y = p[1]; rot = lerp(S.rotW, 360, q) + 10 * Math.sin(Math.PI * q);
      y -= 4 * Math.sin(Math.PI * seg(t, 6050, 6150));
      var pull = eio(seg(t, 6150, 6230));
      y += 20 * pull; sy += 0.06 * pull; sx -= 0.04 * pull;
    } else {
      var rel = seg(t, 6230, 6450);
      x = C[0]; y = C[1] + 20 - 26 * eo(seg(t, 6230, 6330)) + 14 * eio(seg(t, 6330, 6560));
      rot = 360 + 20 * eio(seg(t, 6300, 6650));
      var dq = eio(seg(t, 6650, 7250));
      x += (S.exitX - C[0]) * dq; y += 26 * dq;
      rot += 6 * Math.sin((t - 6650) * 0.008) * seg(t, 6650, 6800);
      var yawn = Math.sin(Math.PI * seg(t, 6480, 6760));
      sy += 0.08 * yawn; sx -= 0.04 * yawn;
      void rel;
    }
    y += 3.5 * Math.sin(2 * Math.PI * t / 1000) * bobEnv(t);
    return { x: x, y: y, rot: rot, sx: sx, sy: sy, bend: bend, vis: vis };
  }
  function tube(bend) {
    var k = 1 - 0.12 * Math.abs(bend);
    return { A: [-12 * bend, -HL * k], B: [-12 * bend, HL * k], Q: [26 * bend, 0] };
  }
  function qpt(g, s) {
    var u = 1 - s;
    return [u * u * g.A[0] + 2 * s * u * g.Q[0] + s * s * g.B[0], u * u * g.A[1] + 2 * s * u * g.Q[1] + s * s * g.B[1]];
  }
  function qd(a, q, b) { return 'M' + f1(a[0]) + ' ' + f1(a[1]) + 'Q' + f1(q[0]) + ' ' + f1(q[1]) + ' ' + f1(b[0]) + ' ' + f1(b[1]); }
  function subQ(g, s0, s1, ox) {
    var a = qpt(g, s0), b = qpt(g, s1), m = qpt(g, (s0 + s1) / 2);
    var c = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
    return qd([a[0] + ox, a[1]], [c[0] + ox, c[1]], [b[0] + ox, b[1]]);
  }
  function toW(p, lx, ly) {
    var a = p.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    var X = lx * SC * p.sx, Y = ly * SC * p.sy;
    return [p.x + X * c - Y * s, p.y + X * s + Y * c];
  }
  function trailA(t) { return seg(t, 2720, 2820) * (1 - seg(t, 3230, 3310)) * 0.85 + seg(t, 3570, 3660) * (1 - seg(t, 4320, 4420)); }

  // eyes / mouth acting
  function lidV(t) {
    return kf([[0, -1], [1560, -1], [1600, 1], [1650, -1], [1960, -1], [2000, 1], [2050, -1], [2240, -1], [2320, 0.5], [2540, 0.5], [2565, -1],
      [2700, -1], [2750, 1], [3280, 1], [3330, -1], [3570, -1], [3630, 1], [4260, 1], [4320, -0.3], [4520, 0.1], [4650, 0.15], [4700, -1],
      [5320, -1], [5360, 1], [5540, 1], [5590, -1], [6150, -1], [6180, 0.5], [6230, 0.5], [6260, -1], [6400, -1], [6470, 0.45],
      [6560, 0.45], [6600, 1], [6740, 1], [6790, 0.5], [7300, 0.5]], t);
  }
  function lidMark(t) {
    if ((t > 2740 && t < 3290) || (t > 3620 && t < 4270) || (t > 5350 && t < 5550)) return 'happy';
    if (t > 6590 && t < 6750) return 'sleep';
    return '';
  }
  function mouthD(t) {
    if (t < 2240) return 'M-3 0 Q0 1.8 3 0';
    if (t < 2550) return 'M-4 0.4 L-2 -0.8 L0 0.6 L2 -0.8 L4 0.4';
    if (t < 2700) return 'o';
    if (t < 3300) return 'grin';
    if (t < 3430) return 'o';
    if (t < 4400) return 'grin';
    if (t < 4690) return 'M-3 0.4 L3 0.4';
    if (t < 5330) return 'o';
    if (t < 5600) return 'grin';
    if (t < 6150) return 'M-3.5 -0.4 Q0 3 3.5 -0.4';
    if (t < 6230) return 'M-4 0.4 L-2 -0.8 L0 0.6 L2 -0.8 L4 0.4';
    if (t < 6420) return 'o';
    if (t > 6480 && t < 6760) return 'yawn';
    return 'M-3 1 Q0 -0.6 3 1';
  }
  function lookV(S, t, p) {
    function toChip(tt) { var dx = S.T.x - p.x, dy = S.T.y - p.y, m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; }
    var L = [[0, [1, 0.1]], [1850, toChip], [2120, [0, 0.15]], [2550, [0, 0]], [3300, [0.15, 0.95]], [3430, [0, 0.15]],
      [3560, [0.6, 0.3]], [4300, toChip], [5320, [0, 0.15]], [5600, [0.25, -0.95]], [6240, [0, 0.15]], [6420, [0.35, 0.85]]];
    var k = 0; for (var i = 0; i < L.length; i++) if (t >= L[i][0]) k = i;
    function v(e) { return typeof e[1] === 'function' ? e[1](t) : e[1]; }
    var b = v(L[k]);
    if (k === 0) return b;
    var a = v(L[k - 1]), q = backOut(clamp((t - L[k][0]) / 120), 1.3);
    return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  }

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
  function radial(defs, id, stops) {
    var g = el('radialGradient', { id: id, cx: '50%', cy: '50%', r: '50%' }, defs);
    stops.forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] }, g); });
    return g;
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-glowstick-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var BRIGHT = hex(mix(dealerC, '#FFFFFF', 0.42)), CORE = hex(mix(dealerC, '#FFFFFF', 0.82)), TRAIL = hex(mix(dealerC, '#FFFFFF', 0.25));
    var DULL = hex(mix(hex(mix(dealerC, '#8C93A3', 0.78)), '#2A3045', 0.3));
    var side = T.x > 260 ? -1 : 1;

    var S = { opts: opts, L: L, T: T, dealerC: dealerC, victimC: victimC, BRIGHT: BRIGHT, CORE: CORE, TRAIL: TRAIL, DULL: DULL };
    S.P1 = [Math.max(48, T.x - 108), Math.max(64, T.y - 60)];
    S.E0 = [-50, S.P1[1] + 34];
    S.D = [T.x - 6, Math.max(60, T.y - 74)];
    var tipL = HL * SC * 0.98;
    S.H = [T.x + Math.sin(25 * Math.PI / 180) * tipL, T.y - Math.cos(25 * Math.PI / 180) * tipL];
    S.Wt = [T.x + 40 * side, Math.max(58, T.y - 66)];
    S.rotW = 360 - 12 * side;
    S.Cpos = [CORD_X, BEAD_Y + (HL + 6.5) * SC];
    S.exitX = 460;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    radial(defs, id + 'hole', [['0', '#000', 1], ['0.45', '#000', 0.75], ['1', '#000', 0]]);
    radial(defs, id + 'pool', [['0', dealerC, 0.62], ['0.35', dealerC, 0.32], ['1', dealerC, 0]]);
    radial(defs, id + 'bloom', [['0', CORE, 0.95], ['0.3', BRIGHT, 0.6], ['1', BRIGHT, 0]]);
    radial(defs, id + 'ring', [['0', BRIGHT, 0], ['0.47', BRIGHT, 0], ['0.53', CORE, 0.9], ['0.7', BRIGHT, 0.45], ['1', BRIGHT, 0]]);
    var cpC = el('clipPath', { id: id + 'rev' }, defs);
    var revC = el('circle', { cx: 0, cy: 0, r: 0 }, cpC);
    var mask = el('mask', { id: id + 'mask', maskUnits: 'userSpaceOnUse', x: -400, y: -500, width: 1200, height: 1700 }, defs);
    el('rect', { x: -400, y: -500, width: 1200, height: 1700, fill: '#FFFFFF' }, mask);
    var mStick = el('circle', { r: 0, fill: 'url(#' + id + 'hole)' }, mask);
    var mChip = el('circle', { r: 0, fill: 'url(#' + id + 'hole)' }, mask);

    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = el('g', {}, svg);
    el('rect', { x: -400, y: -500, width: 1200, height: 1700, fill: PAPER }, cam);
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

    // Nate's chip (victim underneath, dealer revealed from the centre out)
    var vWrap = el('g', {}, cam);
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, vWrap);
    var vG = el('g', {}, vWrap);
    makeChip(vG, victimC, vIni);
    var vGD = el('g', { 'clip-path': 'url(#' + id + 'rev)' }, vG); makeChip(vGD, dealerC, dIni);
    var front = el('circle', { r: 0, fill: 'none', stroke: CORE, 'stroke-width': 3, opacity: 0 }, vG);

    // stick shadow (only reads in the light)
    var stSh = el('ellipse', { rx: 13, ry: 5, fill: INK, opacity: 0 }, cam);

    // pull cord
    var cordG = el('g', {}, cam);
    var cord = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, cordG);
    var bead = el('g', {}, cordG);
    el('path', { d: 'M0 -7 C4.5 -7 6.5 -1 6.5 3 C6.5 7.5 3.5 9.5 0 9.5 C-3.5 9.5 -6.5 7.5 -6.5 3 C-6.5 -1 -4.5 -7 0 -7Z', fill: '#F2E4C4', stroke: INK, 'stroke-width': 2 }, bead);
    el('path', { d: 'M-3 0 Q-3 -3 -0.5 -4', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.9 }, bead);

    // darkness
    var dark = el('rect', { x: -400, y: -500, width: 1200, height: 1700, fill: NIGHT, opacity: 0, mask: 'url(#' + id + 'mask)' }, cam);

    // light (above the darkness)
    var poolS = el('circle', { r: 0, fill: 'url(#' + id + 'pool)', opacity: 0 }, cam);
    var poolC = el('circle', { r: 0, fill: 'url(#' + id + 'pool)', opacity: 0 }, cam);
    var ringC = el('circle', { r: 46, fill: 'url(#' + id + 'ring)', opacity: 0 }, cam);
    var trails = [];
    for (var e = 0; e < 2; e++) {
      var soft = el('path', { fill: 'none', stroke: BRIGHT, 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam);
      var parts = [];
      for (var c = 0; c < 4; c++) parts.push(el('path', { fill: 'none', stroke: c === 0 ? CORE : TRAIL, 'stroke-width': 5 - c, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam));
      trails.push({ soft: soft, parts: parts });
    }
    var bloom = el('circle', { r: 50, fill: 'url(#' + id + 'bloom)', opacity: 0 }, cam);
    var sparks = [];
    for (var si = 0; si < 5; si++) sparks.push(el('path', { fill: CORE, stroke: BRIGHT, 'stroke-width': 1, opacity: 0 }, cam));

    // ---- the glow stick ----
    var stG = el('g', {}, cam);
    var ringL = el('circle', { r: 4.6, fill: 'none', stroke: INK, 'stroke-width': 4.4 }, stG);
    var ringI = el('circle', { r: 4.6, fill: 'none', stroke: DULL, 'stroke-width': 1.8 }, stG);
    var tO = el('path', { fill: 'none', stroke: INK, 'stroke-width': 19.5, 'stroke-linecap': 'round' }, stG);
    var tF = el('path', { fill: 'none', stroke: DULL, 'stroke-width': 14.5, 'stroke-linecap': 'round' }, stG);
    var tCore = el('path', { fill: 'none', stroke: CORE, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, stG);
    var vial = el('path', { fill: 'none', stroke: '#C9D0DA', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.4 }, stG);
    var tHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.45 }, stG);
    var eyes = [-3.7, 3.7].map(function (ox) {
      var g = el('g', {}, stG);
      el('circle', { r: 3.5, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.3 }, g);
      return { ox: ox, g: g, pup: el('circle', { r: 1.75, fill: INK }, g), lid: el('path', { stroke: INK, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, g), mark: el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g) };
    });
    var mouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, stG);

    var bead2 = bead.cloneNode(true); cam.appendChild(bead2);
    var bursts = {
      click: el('path', { fill: 'none', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam),
      crack: el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam),
      tap: el('path', { fill: 'none', stroke: CORE, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, cam),
      land: el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam)
    };
    var flash = el('circle', { r: 0, fill: 'url(#' + id + 'bloom)', opacity: 0 }, cam);
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    S.svg = svg; S.cam = cam; S.rowsG = rowsG; S.chipsG = chipsG; S.vG = vG; S.vGD = vGD; S.vSh = vSh; S.front = front; S.revC = revC;
    S.mStick = mStick; S.mChip = mChip; S.dark = dark; S.poolS = poolS; S.poolC = poolC; S.ringC = ringC; S.trails = trails; S.bloom = bloom;
    S.sparks = sparks; S.stG = stG; S.ringL = ringL; S.ringI = ringI; S.tO = tO; S.tF = tF; S.tCore = tCore; S.vial = vial; S.tHi = tHi;
    S.eyes = eyes; S.mouth = mouth; S.bursts = bursts; S.flash = flash; S.ripple = ripple; S.line = line; S.cord = cord; S.bead = bead; S.bead2 = bead2; S.stSh = stSh;
    return S;
  }

  function burstD(cx, cy, p, r0, grow, len, angs, sq) {
    var d = '', a0 = r0 + grow * eoC(p), a1 = a0 + len * (1 - p);
    sq = sq || 1;
    angs.forEach(function (a) {
      d += 'M' + f1(cx + Math.cos(a) * a0) + ' ' + f1(cy + Math.sin(a) * a0 * sq) + 'L' + f1(cx + Math.cos(a) * a1) + ' ' + f1(cy + Math.sin(a) * a1 * sq);
    });
    return d;
  }
  function starD(x, y, r) {
    var k = r * 0.28;
    return 'M' + f1(x) + ' ' + f1(y - r) + 'Q' + f1(x + k) + ' ' + f1(y - k) + ' ' + f1(x + r) + ' ' + f1(y) + 'Q' + f1(x + k) + ' ' + f1(y + k) + ' ' + f1(x) + ' ' + f1(y + r) +
      'Q' + f1(x - k) + ' ' + f1(y + k) + ' ' + f1(x - r) + ' ' + f1(y) + 'Q' + f1(x - k) + ' ' + f1(y - k) + ' ' + f1(x) + ' ' + f1(y - r) + 'Z';
  }
  function cordState(S, t, p) {
    // bead position (pull down + sway)
    var pull = 18 * eo(seg(t, 950, 1070));
    if (t >= 1080) pull = 18 * (1 - eo(seg(t, 1080, 1200))) + spring(t - 1200, -4, 3, 120);
    var bx = CORD_X + spring(t - 1150, 5, 1.3, 320) + spring(t - 6260, -6, 1.3, 320), by = BEAD_Y + pull;
    if (t >= 6050 && t < 6230) { var top = toW(p, 0, -HL - 6.5); bx = top[0]; by = top[1]; }
    else if (t >= 6230) by += 20 * (1 - eo(seg(t, 6230, 6330))) + spring(t - 6330, -4, 3, 110);
    if (t >= 5950 && t < 6050) { var q = eio(seg(t, 5950, 6050)), top2 = toW(p, 0, -HL - 6.5); bx = lerp(bx, top2[0], q); by = lerp(by, top2[1], q); }
    return [bx, by];
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var T = S.T;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 600, 1150)) * (1 - eioC(seg(t, 5560, 6150)));
    var Z = lerp(1, 1.08, zk);
    var fy = clamp(T.y - 10, 300, 355);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 6700, 7200)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.4 * dim).toFixed(3));
    });

    var dv = darkV(t), dF = dv / DARK, Lt = litV(t);
    var p = pose(S, t);

    // ---- Nate's chip ----
    var vx = T.x, vy = T.y, vs = chipPop(T), vsx = 1, vsy = 1;
    vy -= 5 * Math.sin(Math.PI * seg(t, 650, 820)); vs *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 820));
    var shv = seg(t, 1180, 1250) * (1 - seg(t, 1420, 1480));
    vx += 1.3 * Math.sin(t * 0.21) * shv;
    var lift = eio(seg(t, 4800, 5300)) * (1 - ei(seg(t, 6380, 6620)));
    var tapd = t - 4650, land = 0;
    if (tapd > 0) land += Math.exp(-tapd / 70) * Math.sin(Math.PI * clamp(tapd / 120));
    var ld = t - 6620;
    if (ld > 0) land += Math.exp(-ld / 80) * Math.sin(Math.PI * clamp(ld / 130));
    vsx = 1 + 0.13 * land; vsy = 1 - 0.13 * land;
    var pulse = 1 + 0.03 * Math.sin(t * 0.012) * lift;
    vs *= (1 + 0.07 * lift) * pulse; vy -= 3 * lift;
    var wob = ld > 0 ? 0.06 * Math.exp(-ld / 200) * clamp(ld / 60) : 0;
    if (wob > 0.002) {
      var wa = ld * 0.02;
      S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(wa * 57.3) + ') scale(' + f2(1 + wob) + ',' + f2(1 - wob) + ') rotate(' + f1(-wa * 57.3) + ')');
    } else S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') scale(' + f2(vs * vsx) + ',' + f2(vs * vsy) + ')');
    S.vSh.setAttribute('cx', f1(vx + 1.5 + 4 * lift)); S.vSh.setAttribute('cy', f1(vy + 3.5 + 9 * lift));
    S.vSh.setAttribute('r', f1(CR * Math.min(1.04, chipPop(T)) * (1 - 0.08 * lift)));
    S.vSh.setAttribute('opacity', f1(28 - 10 * lift) / 100);
    var rv = eio(seg(t, 4680, 5350));
    S.revC.setAttribute('r', f1(rv * (CR + 2.5)));
    S.front.setAttribute('r', f1(rv * (CR + 1)));
    S.front.setAttribute('opacity', f2(Math.sin(Math.PI * rv) * 0.95));
    S.front.setAttribute('stroke-width', f1(2 + 3 * Math.sin(Math.PI * rv)));
    var cg = eio(seg(t, 4690, 5400));

    // ---- darkness + light ----
    S.dark.setAttribute('opacity', f2(dv));
    var stickLight = Lt * dF * (p.vis ? 1 : 0);
    var mid = toW(p, 0, 0);
    S.mStick.setAttribute('cx', f1(mid[0])); S.mStick.setAttribute('cy', f1(mid[1]));
    S.mStick.setAttribute('r', f1(stickLight > 0.01 ? 40 + 110 * Lt : 0));
    S.mStick.setAttribute('opacity', f2(clamp(Lt * 1.1)));
    S.mChip.setAttribute('cx', f1(vx)); S.mChip.setAttribute('cy', f1(vy));
    S.mChip.setAttribute('r', f1(cg > 0.01 ? 30 + 70 * cg : 0));
    S.poolS.setAttribute('cx', f1(mid[0])); S.poolS.setAttribute('cy', f1(mid[1] + 6));
    S.poolS.setAttribute('r', f1(50 + 110 * Lt));
    S.poolS.setAttribute('opacity', f2(0.75 * stickLight));
    S.poolC.setAttribute('cx', f1(vx)); S.poolC.setAttribute('cy', f1(vy));
    S.poolC.setAttribute('r', f1(40 + 70 * cg));
    S.poolC.setAttribute('opacity', f2(0.6 * cg * dF));
    S.ringC.setAttribute('cx', f1(vx)); S.ringC.setAttribute('cy', f1(vy));
    S.ringC.setAttribute('r', f1(CR * vs * 2.05));
    S.ringC.setAttribute('opacity', f2(cg * dF * (0.85 + 0.15 * Math.sin(t * 0.012))));
    S.bloom.setAttribute('cx', f1(mid[0])); S.bloom.setAttribute('cy', f1(mid[1]));
    S.bloom.setAttribute('r', f1(46 + 6 * Math.sin(t * 0.013)));
    S.bloom.setAttribute('opacity', f2(clamp(Lt * (0.25 + 0.75 * dF)) * 0.75 * (p.vis ? 1 : 0)));

    // ---- light trails (the two ends of the stick) ----
    var ta = trailA(t) * Lt;
    S.trails.forEach(function (tr, e) {
      if (ta < 0.02) { tr.soft.setAttribute('opacity', 0); tr.parts.forEach(function (q) { q.setAttribute('opacity', 0); }); return; }
      var pts = [];
      for (var k = 0; k <= 48; k++) {
        var pk = pose(S, t - k * 4.5), gk = tube(pk.bend), end = e ? gk.B : gk.A;
        pts.push(toW(pk, end[0] * 0.92, end[1] * 0.92));
      }
      var all = '';
      pts.forEach(function (q, i) { all += (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1]); });
      tr.soft.setAttribute('d', all); tr.soft.setAttribute('opacity', f2(0.22 * ta));
      tr.parts.forEach(function (q, c) {
        var d = '';
        for (var i = c * 12; i <= c * 12 + 12; i++) d += (i === c * 12 ? 'M' : 'L') + f1(pts[i][0]) + ' ' + f1(pts[i][1]);
        q.setAttribute('d', d); q.setAttribute('opacity', f2(ta * (1 - c / 4.2)));
      });
    });

    // ---- the stick ----
    S.stG.setAttribute('display', p.vis ? 'inline' : 'none');
    if (p.vis) {
      S.stG.setAttribute('transform', 'translate(' + f1(p.x) + ',' + f1(p.y) + ') rotate(' + f1(p.rot) + ') scale(' + f2(SC * p.sx) + ',' + f2(SC * p.sy) + ')');
      var g = tube(p.bend), d = qd(g.A, g.Q, g.B);
      var body = mix(S.DULL, S.BRIGHT, clamp(Lt));
      S.tO.setAttribute('d', d); S.tF.setAttribute('d', d); S.tF.setAttribute('stroke', body);
      S.tCore.setAttribute('d', subQ(g, 0.06, 0.94, 0)); S.tCore.setAttribute('opacity', f2(clamp(Lt * 1.2)));
      S.vial.setAttribute('d', subQ(g, 0.12, 0.88, 0)); S.vial.setAttribute('opacity', t < 2550 ? 0.35 : 0);
      S.tHi.setAttribute('d', subQ(g, 0.08, 0.36, -3.6) + subQ(g, 0.62, 0.7, -3.6));
      var ra = g.A, rdir = [g.A[0] - g.Q[0], g.A[1] - g.Q[1]], rm = Math.hypot(rdir[0], rdir[1]) || 1;
      var rc = [ra[0] + rdir[0] / rm * 6.5, ra[1] + rdir[1] / rm * 6.5];
      S.ringL.setAttribute('cx', f1(rc[0])); S.ringL.setAttribute('cy', f1(rc[1]));
      S.ringI.setAttribute('cx', f1(rc[0])); S.ringI.setAttribute('cy', f1(rc[1])); S.ringI.setAttribute('stroke', body);
      // face
      var fe = qpt(g, 0.3), fm = qpt(g, 0.47);
      var lv = lookV(S, t, p), ar = -p.rot * Math.PI / 180;
      var lx = lv[0] * Math.cos(ar) - lv[1] * Math.sin(ar), ly = lv[0] * Math.sin(ar) + lv[1] * Math.cos(ar);
      var lid = lidV(t), mk = lidMark(t);
      if (t > 2550 && t < 2700) lid = -1;
      S.eyes.forEach(function (e) {
        e.g.setAttribute('transform', 'translate(' + f1(fe[0] + e.ox) + ',' + f1(fe[1]) + ')');
        e.pup.setAttribute('cx', f1(lx * 1.5)); e.pup.setAttribute('cy', f1(ly * 1.5));
        e.pup.setAttribute('r', t > 2550 && t < 2700 ? 1.2 : 1.75);
        e.lid.setAttribute('fill', body);
        var r = 3.6;
        if (lid <= -0.97) e.lid.setAttribute('d', '');
        else if (lid >= 0.98) e.lid.setAttribute('d', circleD(0, 0, r));
        else { var Ly = clamp(lid, -1, 1) * r, dx = Math.sqrt(Math.max(0, r * r - Ly * Ly)); e.lid.setAttribute('d', 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
        e.mark.setAttribute('d', lid >= 0.98 ? (mk === 'happy' ? 'M-2.4 1 Q0 -1.9 2.4 1' : 'M-2.4 0.4 Q0 1.8 2.4 0.4') : '');
      });
      var md = mouthD(t), mx = fm[0], my = fm[1] + 1;
      S.mouth.setAttribute('transform', 'translate(' + f1(mx) + ',' + f1(my) + ')');
      if (md === 'o') { S.mouth.setAttribute('d', 'M-1.8 0a1.8 2.2 0 1 0 3.6 0a1.8 2.2 0 1 0 -3.6 0Z'); S.mouth.setAttribute('fill', INK); }
      else if (md === 'yawn') { var yw = Math.sin(Math.PI * seg(t, 6480, 6760)); S.mouth.setAttribute('d', 'M-2.4 0a2.4 ' + f1(1.2 + 2.4 * yw) + ' 0 1 0 4.8 0a2.4 ' + f1(1.2 + 2.4 * yw) + ' 0 1 0 -4.8 0Z'); S.mouth.setAttribute('fill', INK); }
      else if (md === 'grin') { S.mouth.setAttribute('d', 'M-4.2 -1 Q0 6 4.2 -1Z'); S.mouth.setAttribute('fill', INK); }
      else { S.mouth.setAttribute('d', md); S.mouth.setAttribute('fill', 'none'); }
      // soft shadow on the felt (only reads with the lights on)
      S.stSh.setAttribute('cx', f1(p.x + 8)); S.stSh.setAttribute('cy', f1(p.y + 46));
      S.stSh.setAttribute('opacity', f2(0.16 * (1 - dF)));
    } else S.stSh.setAttribute('opacity', 0);

    // ---- cord ----
    var bp = cordState(S, t, p);
    S.cord.setAttribute('d', 'M' + CORD_X + ' -400 Q' + f1(CORD_X + (bp[0] - CORD_X) * 0.3) + ' ' + f1(bp[1] - 120) + ' ' + f1(bp[0]) + ' ' + f1(bp[1] - 7));
    S.bead.setAttribute('transform', 'translate(' + f1(bp[0]) + ',' + f1(bp[1]) + ') rotate(' + f1(-(bp[0] - CORD_X) * 2) + ')');
    // while the stick holds it, the bead sits over the stick's loop (lit by the stick)
    S.bead2.setAttribute('transform', S.bead.getAttribute('transform'));
    S.bead2.setAttribute('display', t >= 5950 && t < 6330 ? 'inline' : 'none');

    // ---- bursts ----
    var B = S.bursts, cp;
    cp = seg(t, 1080, 1330); var cp2 = seg(t, 6230, 6480);
    if (cp > 0 && cp < 1) { B.click.setAttribute('d', burstD(bp[0], bp[1] + 2, cp, 13, 10, 7, [-0.4, 0.25, 0.9, 2.25, 2.9, 3.55])); B.click.setAttribute('opacity', f2(1 - ei(cp))); B.click.setAttribute('stroke', '#FFE59A'); }
    else if (cp2 > 0 && cp2 < 1) { B.click.setAttribute('d', burstD(bp[0], bp[1] + 2, cp2, 13, 10, 7, [-0.4, 0.25, 0.9, 2.25, 2.9, 3.55])); B.click.setAttribute('opacity', f2(1 - ei(cp2))); B.click.setAttribute('stroke', INK); }
    else B.click.setAttribute('opacity', 0);
    var kp = seg(t, 2550, 2800);
    if (kp > 0 && kp < 1) {
      var g0 = tube(0.95), bpnt = toW(pose(S, 2549), qpt(g0, 0.5)[0], qpt(g0, 0.5)[1]);
      B.crack.setAttribute('d', burstD(bpnt[0], bpnt[1], kp, 16, 12, 8, [-2.8, -2.2, -0.95, -0.3, 0.35, 2.6]));
      B.crack.setAttribute('opacity', f2(1 - ei(kp)));
      S.flash.setAttribute('cx', f1(bpnt[0])); S.flash.setAttribute('cy', f1(bpnt[1]));
      S.flash.setAttribute('r', f1(8 + 26 * eoC(kp))); S.flash.setAttribute('opacity', f2(1 - eo(kp)));
    } else { B.crack.setAttribute('opacity', 0); S.flash.setAttribute('opacity', 0); }
    var tp = seg(t, 4650, 4950);
    if (tp > 0 && tp < 1) { B.tap.setAttribute('d', burstD(T.x, T.y, tp, 26, 14, 9, [-2.6, -2.0, -1.2, -0.45, 0.3, 1.1, 1.9, 2.7])); B.tap.setAttribute('opacity', f2(1 - ei(tp))); }
    else B.tap.setAttribute('opacity', 0);
    var lp = seg(t, 6620, 6900);
    if (lp > 0 && lp < 1) { B.land.setAttribute('d', burstD(T.x, T.y, lp, 27, 9, 6, [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75])); B.land.setAttribute('opacity', f2(0.9 * (1 - lp))); }
    else B.land.setAttribute('opacity', 0);
    var rp = seg(t, 6620, 7120);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f2((1 - rp) * 0.85) : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));

    // sparkles: tap + the chip becoming radiant
    var spk = [[4700, -0.9, 34], [4760, 2.3, 30], [5250, -2.2, 36], [5330, 0.5, 33], [5420, 1.6, 38]];
    S.sparks.forEach(function (s, i) {
      var sp = spk[i], a = seg(t, sp[0], sp[0] + 420);
      if (a <= 0 || a >= 1 || dF < 0.05) { s.setAttribute('opacity', 0); return; }
      var rr = sp[2] + 8 * a;
      s.setAttribute('d', starD(T.x + Math.cos(sp[1]) * rr, T.y + Math.sin(sp[1]) * rr, 6 * Math.sin(Math.PI * a)));
      s.setAttribute('opacity', f2(dF));
    });

    // final line
    var lq = seg(t, 7350, 7700);
    S.line.setAttribute('opacity', f2(eo(lq)));
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lq, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2glowstick;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2glowstick = S;
    return S;
  }

  window.CCSteal2_glowstick = {
    title: 'Lights Out',
    blurb: 'The lights click off, a sleepy glow stick cracks itself and shakes up a glow in Nick’s colour, raves over and taps Nate’s chip like a wand, and when the lights come back on the chip has caught the glow, right where it was.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2glowstick = S;
      var token = {};
      root.__cc2glowstickToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2glowstickToken !== token) { resolve(); return; }
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
