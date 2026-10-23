/* Closed Caption - "steal" moment - concept: THE QUICK CHANGE (phone booth)
 *
 * Everyone knows the gag: a mild-mannered type in glasses ducks into a phone booth, there's a
 * frantic flurry of clothes, and out strides a caped hero. Here the "costume" is Nick's colour.
 * Top-down felt table; the booth is a front-view toy that rises out of the felt.
 *
 * Storyboard (ms)
 *    0-  650  Table deals in: rows drop in, chips pop on.
 *  600-  980  Camera eases in a touch (whole rows stay in frame). Other chips dim. Nate's chip
 *             "wakes": eyes blink open, tiny round glasses pop on, initial tucks down.
 *  900- 1420  A hole irises open beside the chip and a narrow wooden phone booth rises out of
 *             the felt (overshoot, squash, wobble). Chip startles (little hop, eyes wide).
 *             Roof lamp flicks on.
 * 1450- 2050  Shifty: chip glances left... right... back at us. The booth door creaks open.
 * 2050- 2400  Crouch, then a hop in an arc into the booth.
 * 2380- 2460  Door SLAMS (booth jolts, ticks).
 * 2550- 4300  The quick change: booth shudders and rocks wildly, lamp flickers, frantic staccato
 *             silhouettes in the frosted panes (arms flailing, a sock being yanked off, then a
 *             cape) shifting from Nate's colour to Nick's.
 * 3050- 3560  A sock (Nate's colour stripes) flies out over the top, spins, THUMPS onto the roof
 *             and drapes there.
 * 4300- 4500  One last big shake/hop... lands.
 * 4480- 4900  Puffs of smoke squeeze out of every gap. Beat of stillness.
 * 4750- 4950  Door BURSTS open; cloud rolls out; the hero stands in the doorway - Nick's
 *             colour, Nick's initial, no glasses, determined brows, short cape in Nick's colour.
 * 4950- 5450  Two heroic strides (hops) back to the exact spot, cape streaming.
 * 5450- 6150  The pose: chest out, tilt, cape billowing, a glint. Held.
 * 6150- 6900  The cape whips off and flies away up out of frame.
 * 6150- 6750  Door shuts; booth hops and sinks into the felt (sock and all); hole closes.
 * 6450- 6950  Chip settles flat into its spot: squash, ring flash, ticks; the face fades and
 *             the initial returns to centre. Camera eases back, chips undim.
 * 7150- 7550  Stillness.
 * 7550-10000  "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', HOLE = '#143A2E';
  var WOOD = '#B97445', WOOD_D = '#8A5230', WOOD_L = '#D69A63', BRASS = '#E3B44C', INSIDE = '#3B2A22', PANE = '#E6F0EF';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000, BS = 1, IN_Y = -28, IN_S = 0.88;
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
  function f1(v) { return Math.round(v * 10) / 10; }
  function f2(v) { return Math.round(v * 1000) / 1000; }
  function hash(a, b) { var x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); }
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
    var mm = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(String(h).replace(/\s/g, ''));
    if (mm) return [+mm[1], +mm[2], +mm[3]];
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
    var same = d && v && Array.from(d)[0].toUpperCase() === Array.from(v)[0].toUpperCase();
    return function (name) {
      name = name || '?';
      if (same && (name === d || name === v)) return Array.from(name).slice(0, 2).join("");
      return Array.from(name)[0].toUpperCase();
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
  function boothPose(t, S) {
    var sx = S.sx, m = { dx: 0, dy: 0, rot: 0, sqy: 1 };
    // rise
    if (t < 1360) { var p = seg(t, 960, 1360); m.dy = 175 * (1 - backOut(p, 1.4)); m.sqy += 0.12 * Math.sin(Math.PI * p); }
    m.sqy += spring(t - 1360, -0.1, 3.2, 140);
    m.rot += spring(t - 1360, 3.5 * sx, 2.0, 230);
    // door creak / slam
    m.rot += spring(t - 1800, -1.2 * sx, 3, 120);
    m.rot += spring(t - 2440, 3.4 * sx, 3.4, 150); m.sqy += spring(t - 2440, -0.08, 4, 110);
    // the quick change: wild rocking
    var A = seg(t, 2540, 2700) * (1 - seg(t, 4180, 4320));
    if (A > 0) {
      var kk = Math.floor((t - 2540) / 140), ph = (t - 2540 - kk * 140) / 140;
      // staccato jolts layered on smooth rocking
      var j0 = hash(kk, 3) - 0.5, j1 = hash(kk + 1, 3) - 0.5;
      var jolt = lerp(j0, j1, eo(clamp(ph * 2.5)));
      m.rot += A * (6.5 * Math.sin((t - 2540) * 0.024) + 5 * jolt + 2.2 * Math.sin(t * 0.091));
      m.dx += A * (2.5 * Math.sin(t * 0.047) + 2 * jolt);
      m.dy -= A * 6 * Math.abs(Math.sin((t - 2540) * 0.019)) * (0.5 + hash(kk, 7));
      m.sqy += A * 0.05 * Math.sin(t * 0.083);
    }
    // sock thump on the roof
    m.sqy += spring(t - 3560, -0.08, 4, 100);
    // final big shake & hop
    var fp = seg(t, 4300, 4480);
    m.dy -= 18 * Math.sin(Math.PI * fp);
    m.sqy += 0.08 * Math.sin(Math.PI * fp) + spring(t - 4480, -0.12, 4, 120);
    m.rot += 5 * Math.sin(Math.PI * 3 * fp) * Math.sin(Math.PI * fp);
    // swell before the burst, burst
    m.sqy += 0.04 * eio(seg(t, 4560, 4740)) * (t < 4750 ? 1 : 0);
    m.rot += spring(t - 4750, -2.8 * sx, 3, 160); m.sqy += spring(t - 4750, -0.07, 4, 120);
    // door shut, then sink
    m.rot += spring(t - 6280, 1.6 * sx, 3, 120);
    m.dy -= 7 * Math.sin(Math.PI * seg(t, 6330, 6450));
    m.sqy += 0.06 * Math.sin(Math.PI * seg(t, 6330, 6450));
    if (t >= 6420) m.dy += 185 * ei(seg(t, 6420, 6780));
    m.rot += 1.6 * Math.sin(t * 0.08) * seg(t, 6430, 6500);
    // tipping onto a corner lifts the base
    m.dy -= Math.abs(Math.sin(m.rot * Math.PI / 180)) * 28 * BS;
    return m;
  }
  function holeK(t) {
    var bo = function (x) { return backOut(x, 1.6); };
    return kf([[860, 0], [1100, 1, bo], [1500, 1], [1760, 0], [6230, 0], [6400, 1, bo], [6760, 1], [6980, 0]], t);
  }
  function doorAng(t) {
    var a = kf([[0, 0], [1780, 0], [1990, 108, function (x) { return backOut(x, 1.4); }], [2380, 108], [2445, 0, ei],
      [4750, 0], [4840, 122, function (x) { return backOut(x, 2.4); }], [6160, 122], [6270, 0, ei]], t);
    a += (t > 2445 && t < 2700 ? spring(t - 2445, 6, 6, 60) : 0) + (t > 6270 && t < 6450 ? spring(t - 6270, 5, 6, 60) : 0);
    return Math.max(0, a);
  }
  function toWorld(S, m, px, py) {
    var a = m.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sqx = 2 - m.sqy;
    var x = px * sqx * BS, y = py * m.sqy * BS;
    return [S.MX + m.dx + x * c - y * s, S.baseY + m.dy + x * s + y * c];
  }

  // ---------- build helpers ----------
  function makeChip(parent, color, txt, face, glasses) {
    var g = el('g', {}, parent);
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    var o = { g: g, tx: tx, big: txt.length > 1 ? 15 : 18, small: txt.length > 1 ? 10.5 : 12 };
    if (!face) return o;
    var fg = el('g', {}, g);
    o.face = fg;
    o.eyes = [-6.6, 6.6].map(function (x) {
      var eg = el('g', { transform: 'translate(' + x + ',-6.5)' }, fg);
      el('circle', { r: 3.7, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.3 }, eg);
      return { g: eg, pup: el('circle', { r: 1.85, fill: INK }, eg), lid: el('path', { fill: color, stroke: INK, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, eg) };
    });
    if (glasses) {
      var gg = el('g', {}, fg);
      el('path', { d: circleD(-6.6, -6.5, 5.6) + circleD(6.6, -6.5, 5.6), fill: '#FFFFFF', 'fill-opacity': 0.12, stroke: INK, 'stroke-width': 1.7 }, gg);
      el('path', { d: 'M-1.2 -7.6 Q0 -8.8 1.2 -7.6 M-12.2 -7.4 L-15.5 -9 M12.2 -7.4 L15.5 -9', fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, gg);
      el('path', { d: 'M-9.6 -9.4 L-8 -10.6 M3.6 -9.4 L5.2 -10.6', stroke: '#FFFFFF', 'stroke-width': 1.2, 'stroke-linecap': 'round' }, gg);
      o.glasses = gg;
    } else {
      o.brows = el('path', { d: 'M-10.5 -12.4 Q-7 -13.6 -3.2 -11.2 M10.5 -12.4 Q7 -13.6 3.2 -11.2', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, fg);
    }
    return o;
  }
  function setFace(o, f, look, lid) {
    // f: 0 = plain chip, 1 = face on
    o.face.setAttribute('opacity', f2(clamp(f * 1.6)));
    o.tx.setAttribute('y', f1(lerp(0.5, 8, eio(f))));
    o.tx.setAttribute('font-size', f1(lerp(o.big, o.small, eio(f))));
    o.eyes.forEach(function (e) {
      e.pup.setAttribute('cx', f1(look[0] * 1.5)); e.pup.setAttribute('cy', f1(look[1] * 1.5));
      var r = 3.75;
      if (lid <= -0.97) e.lid.setAttribute('d', '');
      else if (lid >= 0.98) e.lid.setAttribute('d', circleD(0, 0, r) + 'M-2.6 0.6 Q0 2.2 2.6 0.6');
      else { var Ly = clamp(lid, -1, 1) * r, dx = Math.sqrt(Math.max(0, r * r - Ly * Ly)); e.lid.setAttribute('d', 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
    });
  }
  // sock: leg up, foot pointing +x; origin at its middle
  function makeSock(parent, color) {
    var g = el('g', {}, parent);
    var d = 'M-5 -12 L5 -12 L5 0 Q5 2.5 7.5 2.5 L10 2.5 Q14.5 2.5 14.5 7 Q14.5 11.5 10 11.5 L-1 11.5 Q-5 11.5 -5 7 Z';
    el('path', { d: d, fill: '#FFFFFF' }, g);
    el('path', { d: 'M10.3 2.5 Q14.5 2.5 14.5 7 Q14.5 11.5 10.3 11.5 Q12.3 7 10.3 2.5 Z', fill: color }, g);
    el('path', { d: 'M-5 3 Q-5 11.5 -1 11.5 L1.5 11.5 Q-2 9 -2 3.5 Z', fill: color }, g);
    el('path', { d: 'M-5 -8 L5 -8 M-5 -4.6 L5 -4.6', stroke: color, 'stroke-width': 2 }, g);
    el('path', { d: d, fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-5 -12 L5 -12', stroke: INK, 'stroke-width': 2.4 }, g);
    return g;
  }
  // cape in chip-local units: hangs from behind the top of the chip. dir = side it streams to,
  // th = angle from horizontal (90 = hanging straight down), len, ph = flutter phase, amp = flutter.
  function capeD(dir, th, len, ph, amp) {
    var a = th * Math.PI / 180, v = [dir * Math.cos(a), Math.sin(a)], pp = [-v[1], v[0]];
    var n = 6, A = [], B = [], C = [];
    for (var i = 0; i <= n; i++) {
      var s = i / n, wv = amp * Math.sin(ph + s * 4.6) * s;
      var c = [v[0] * len * s + pp[0] * wv, -13 + v[1] * len * s + pp[1] * wv];
      var hw = lerp(12.5, 19, s);
      C.push(c); A.push([c[0] + pp[0] * hw, c[1] + pp[1] * hw]); B.push([c[0] - pp[0] * hw, c[1] - pp[1] * hw]);
    }
    function P(q) { return f1(q[0]) + ' ' + f1(q[1]); }
    function smooth(pts) { var d = ''; for (var k = 1; k < pts.length - 1; k++) { var m = [(pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2]; d += 'Q' + P(pts[k]) + ' ' + P(m); } return d + 'L' + P(pts[pts.length - 1]); }
    var e = C[n], tip = [e[0] + v[0] * 4, e[1] + v[1] * 4];
    var hem = 'Q' + P([lerp(A[n][0], tip[0], 0.5) + v[0] * 4, lerp(A[n][1], tip[1], 0.5) + v[1] * 4]) + ' ' + P([e[0] + pp[0] * 6 + v[0] * 1, e[1] + pp[1] * 6 + v[1] * 1]) +
      'Q' + P([tip[0], tip[1]]) + ' ' + P([e[0] - pp[0] * 6 + v[0] * 1, e[1] - pp[1] * 6 + v[1] * 1]) +
      'Q' + P([lerp(B[n][0], tip[0], 0.5) + v[0] * 4, lerp(B[n][1], tip[1], 0.5) + v[1] * 4]) + ' ' + P(B[n]);
    var d = 'M' + P(A[0]) + smooth(A) + hem + smooth(B.slice().reverse()) + 'Z';
    var Bs = B.slice(2), Cs = C.slice(2);
    var lin = 'M' + P(Cs[0]) + smooth(Cs) + 'L' + P([e[0] - pp[0] * 6 + v[0], e[1] - pp[1] * 6 + v[1]]) + 'L' + P(B[n]) + smooth(Bs.slice().reverse()) + 'Z';
    return { d: d, lin: lin };
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-phonebooth-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.j < 2 ? 1 : -1;
    var MX = T.x + sx * 72, baseY = Math.min(L.bandY + 4, 566);
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpM = el('clipPath', { id: id + 'm', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -400, y: -400, width: 1200, height: f1(baseY + 4 + 400) }, cpM);
    var cpD = el('clipPath', { id: id + 'd', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -24, y: -113, width: 48, height: 105 }, cpD);

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

    // hole + booth shadow
    var hole = el('g', {}, cam);
    var holeE = el('ellipse', { cx: MX, cy: baseY, rx: 0, ry: 0, fill: HOLE, stroke: INK, 'stroke-width': 2.2 }, hole);
    var holeIn = el('ellipse', { cx: MX, cy: baseY + 2, rx: 0, ry: 0, fill: '#0B241C' }, hole);
    var bShadow = el('ellipse', { cx: MX, cy: baseY + 3, rx: 40, ry: 6, fill: INK, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- booth back (body, roof, interior, silhouettes) ----
    var bWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var bG = el('g', {}, bWrap);
    var bM = el('g', { transform: 'scale(' + sx + ',1)' }, bG);
    el('rect', { x: -34, y: -9, width: 68, height: 9, rx: 2.5, fill: WOOD_D, stroke: INK, 'stroke-width': 2.4 }, bM);
    el('rect', { x: -30, y: -134, width: 60, height: 127, rx: 4, fill: WOOD, stroke: INK, 'stroke-width': 2.6 }, bM);
    el('path', { d: 'M24.5 -128 L24.5 -12', stroke: INK, 'stroke-opacity': 0.12, 'stroke-width': 5, 'stroke-linecap': 'round' }, bM);
    el('path', { d: 'M-26.5 -128 L-26.5 -14', stroke: WOOD_L, 'stroke-width': 2, 'stroke-linecap': 'round' }, bM);
    // interior
    el('rect', { x: -24, y: -113, width: 48, height: 105, fill: INSIDE, stroke: INK, 'stroke-width': 2 }, bM);
    el('path', { d: 'M-24 -60 L24 -60', stroke: '#000000', 'stroke-opacity': 0.18, 'stroke-width': 2 }, bM);
    // wall phone (generic)
    var ph = el('g', { transform: 'translate(9,-86)' }, bM);
    el('rect', { x: -7, y: -11, width: 14, height: 21, rx: 3, fill: '#5E6A70', stroke: INK, 'stroke-width': 1.6 }, ph);
    el('circle', { cx: 0, cy: 1, r: 4, fill: '#C7CDD0', stroke: INK, 'stroke-width': 1.2 }, ph);
    el('path', { d: 'M-9.5 -10 Q-12.5 -10 -12.5 -6 L-12.5 6 Q-12.5 10 -9.5 10', fill: 'none', stroke: '#2C3236', 'stroke-width': 4, 'stroke-linecap': 'round' }, ph);
    el('path', { d: 'M-12 9 Q-14 18 -9 20 Q-4 22 -6 28', fill: 'none', stroke: '#2C3236', 'stroke-width': 1.2 }, ph);
    // lit interior + silhouettes
    var litIn = el('rect', { x: -24, y: -113, width: 48, height: 105, fill: '#FFE9B0', opacity: 0 }, bG);
    var silG = el('g', { 'clip-path': 'url(#' + id + 'd)' }, bG);
    var silCape = el('path', {}, silG);
    var silArms = el('path', { fill: 'none', 'stroke-width': 6.5, 'stroke-linecap': 'round' }, silG);
    var silBody = el('ellipse', { rx: 18, ry: 18 }, silG);
    var silSock = el('path', { d: 'M-4 -11 L4 -11 L4 1 L10 1 Q13 1 13 5 Q13 9 9 9 L-1 9 Q-4 9 -4 6 Z' }, silG);
    // roof + lamp + sign
    el('path', { d: 'M-37 -133 L37 -133 L33 -141 Q22 -150 0 -151 Q-22 -150 -33 -141 Z', fill: WOOD_D, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, bM);
    el('path', { d: 'M-26 -143 Q-12 -148 6 -148', fill: 'none', stroke: WOOD_L, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, bM);
    var lampGlow = el('circle', { cx: 0, cy: -157, r: 13, fill: '#FFE07A', opacity: 0 }, bG);
    el('rect', { x: -5, y: -154, width: 10, height: 4, rx: 1, fill: BRASS, stroke: INK, 'stroke-width': 1.5 }, bG);
    var lamp = el('path', { d: 'M-5 -154 Q-5.5 -163 0 -163.5 Q5.5 -163 5 -154 Z', fill: '#CDBF98', stroke: INK, 'stroke-width': 1.6 }, bG);
    el('rect', { x: -22, y: -129, width: 44, height: 13, rx: 2.5, fill: '#FFF1D6', stroke: INK, 'stroke-width': 2 }, bM);
    // handset glyph on the sign
    el('path', { d: 'M-6.5 -120 Q-6.5 -124.5 0 -124.5 Q6.5 -124.5 6.5 -120 L4 -120 L3 -122 L-3 -122 L-4 -120 Z', fill: INK }, bM);

    // ---- actor layer (world) ----
    var actor = el('g', {}, cam);
    var aSh = el('ellipse', { rx: CR, ry: CR, fill: INK, opacity: 0.28 }, actor);
    var vG = el('g', {}, actor);
    var vChip = makeChip(vG, victimC, vIni, true, true);
    var hG = el('g', {}, actor);
    var capeG = el('g', {}, hG);
    var capeDark = mix(dealerC, INK, 0.35);
    var capeP = el('path', { fill: dealerC, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, capeG);
    var capeIn = el('path', { fill: capeDark, opacity: 0.55 }, capeG);
    var hChip = makeChip(hG, dealerC, dIni, true, false);
    var clasp = el('g', {}, hG);
    el('path', { d: 'M-13.5 -19.5 Q0 -15 13.5 -19.5', fill: 'none', stroke: capeDark, 'stroke-width': 3, 'stroke-linecap': 'round' }, clasp);
    el('circle', { cx: 0, cy: -17, r: 3.2, fill: BRASS, stroke: INK, 'stroke-width': 1.4 }, clasp);

    // ---- booth front (door) ----
    var fWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var fG = el('g', {}, fWrap);
    var fM = el('g', { transform: 'scale(' + sx + ',1)' }, fG);
    var door = el('g', {}, fM);
    var doorD = 'M-24 -113 L24 -113 L24 -8 L-24 -8 Z';
    for (var qr = 0; qr < 3; qr++) for (var qc = 0; qc < 2; qc++) { var qx = -19 + qc * 19.5, qy = -107 + qr * 27; doorD += 'M' + qx + ' ' + qy + 'L' + qx + ' ' + (qy + 24) + 'L' + (qx + 18.5) + ' ' + (qy + 24) + 'L' + (qx + 18.5) + ' ' + qy + 'Z'; }
    el('path', { d: doorD, fill: WOOD, 'fill-rule': 'evenodd', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, door);
    var panes = [];
    for (var pr = 0; pr < 3; pr++) for (var pc = 0; pc < 2; pc++) {
      panes.push(el('rect', { x: -19 + pc * 19.5, y: -107 + pr * 27, width: 18.5, height: 24, rx: 1.5, fill: PANE, 'fill-opacity': 0.62, stroke: INK, 'stroke-width': 1.6 }, door));
    }
    el('path', { d: 'M-15 -88 L-8 -101 M-14.5 -61 L-10 -69 M5 -92 L9.5 -100', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 2, 'stroke-linecap': 'round' }, door);
    el('rect', { x: -19, y: -24, width: 38, height: 12, rx: 2, fill: WOOD_D, stroke: INK, 'stroke-width': 1.6 }, door);
    el('rect', { x: -21.5, y: -64, width: 5, height: 12, rx: 2.4, fill: BRASS, stroke: INK, 'stroke-width': 1.5 }, door);
    el('rect', { x: 21, y: -100, width: 4.5, height: 9, rx: 1.4, fill: BRASS, stroke: INK, 'stroke-width': 1.3 }, door);
    el('rect', { x: 21, y: -32, width: 4.5, height: 9, rx: 1.4, fill: BRASS, stroke: INK, 'stroke-width': 1.3 }, door);

    // sock (world, clipped at the felt)
    var sockWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var sock = makeSock(sockWrap, victimC);
    var sockTicks = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var slamTicks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // smoke puffs
    var puffG = el('g', {}, cam);
    var puffs = [];
    for (var pi = 0; pi < 22; pi++) puffs.push(el('circle', { r: 0, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.8, opacity: 0 }, puffG));

    // flying cape
    var flyG = el('g', {}, cam);
    var flyP = el('path', { fill: dealerC, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, flyG);
    var flyIn = el('path', { fill: capeDark, opacity: 0.55 }, flyG);

    var glint = el('path', { fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round', opacity: 0 }, cam);
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var stepDust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, sx: sx, MX: MX, baseY: baseY, dealerC: dealerC, victimC: victimC, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, holeE: holeE, holeIn: holeIn, hole: hole, bShadow: bShadow, dust: dust,
      bWrap: bWrap, bG: bG, fWrap: fWrap, fG: fG, door: door, panes: panes, lamp: lamp, lampGlow: lampGlow,
      litIn: litIn, silG: silG, silCape: silCape, silArms: silArms, silBody: silBody, silSock: silSock,
      actor: actor, aSh: aSh, vG: vG, vChip: vChip, hG: hG, hChip: hChip, capeP: capeP, capeIn: capeIn, capeG: capeG, clasp: clasp,
      sock: sock, sockTicks: sockTicks, slamTicks: slamTicks, puffs: puffs, flyG: flyG, flyP: flyP, flyIn: flyIn,
      glint: glint, ripple: ripple, ticks: ticks, stepDust: stepDust, line: line
    };
  }

  function burst(cx, cy, rx, ry, angs, p, len) {
    var d = '';
    angs.forEach(function (a) {
      var r0 = 1 + 0.35 * eoC(p), r1 = r0 + len * (1 - p);
      d += 'M' + f1(cx + Math.cos(a) * rx * r0) + ' ' + f1(cy + Math.sin(a) * ry * r0) + 'L' + f1(cx + Math.cos(a) * rx * r1) + ' ' + f1(cy + Math.sin(a) * ry * r1);
    });
    return d;
  }

  // ---------- the chip actor ----------
  // returns {x,y,s,sxk,syk,rot,lift,who:'v'|'h'|null}
  function actorState(S, t) {
    var T = S.T, sx = S.sx;
    var st = { x: T.x, y: T.y, s: 1, sxk: 1, syk: 1, rot: 0, lift: 0, who: 'v' };
    var pop = seg(t, 200 + 70 * T.row + 60 * T.j, 520 + 70 * T.row + 60 * T.j);
    if (t < 2050) {
      st.s = pop <= 0 ? 0.001 : backOut(pop, 2.2);
      // wakes: small hop
      var wk = seg(t, 680, 860);
      st.y -= 6 * Math.sin(Math.PI * wk); st.syk += 0.06 * Math.sin(Math.PI * wk); st.sxk -= 0.04 * Math.sin(Math.PI * wk);
      // startled by the booth
      var sp = seg(t, 1030, 1220);
      st.y -= 11 * Math.sin(Math.PI * sp); st.syk += 0.1 * Math.sin(Math.PI * sp); st.sxk -= 0.06 * Math.sin(Math.PI * sp);
      st.rot += spring(t - 1220, -5 * sx, 3, 120);
      st.syk += spring(t - 1220, -0.08, 4, 90); st.sxk -= spring(t - 1220, -0.06, 4, 90);
      // glances
      var lk = glance(t);
      st.x += lk * 3.5; st.rot += lk * 9;
      if (lk !== 0 || t > 1450) st.lift = 2;
      if (t > 1450) st.lift = 2;
    } else if (t < 2150) {
      var c = eo(seg(t, 2050, 2140));
      st.sxk = 1 + 0.14 * c; st.syk = 1 - 0.16 * c; st.x += sx * 2 * c; st.y += 2 * c; st.rot = sx * 4 * c; st.lift = 2;
    } else if (t < 2400) {
      var hp = seg(t, 2150, 2400), q = eio(hp);
      var B = toWorld(S, boothPose(2400, S), 0, IN_Y);
      var P = arc2([T.x, T.y], B, 58, q);
      st.x = P[0]; st.y = P[1]; st.s = lerp(1, IN_S * BS, q);
      st.sxk = 1 - 0.1 * Math.sin(Math.PI * hp); st.syk = 1 + 0.14 * Math.sin(Math.PI * hp);
      st.rot = sx * 14 * Math.sin(Math.PI * hp); st.lift = lerp(2, 0, hp) + 30 * Math.sin(Math.PI * hp);
    } else if (t < 2460) {
      var Bi = toWorld(S, boothPose(t, S), 0, IN_Y);
      st.x = Bi[0]; st.y = Bi[1]; st.s = IN_S * BS;
      var sq = Math.sin(Math.PI * seg(t, 2400, 2460)); st.sxk = 1 + 0.14 * sq; st.syk = 1 - 0.14 * sq; st.lift = 0;
    } else if (t < 4750) {
      st.who = null;
    } else {
      st.who = 'h';
      var P0 = toWorld(S, boothPose(4840, S), 0, IN_Y);
      var M1 = [lerp(P0[0], T.x, 0.52), lerp(P0[1], T.y, 0.52) + 4];
      if (t < 4950) {
        var Pc = toWorld(S, boothPose(t, S), 0, IN_Y);
        st.x = Pc[0]; st.y = Pc[1]; st.s = IN_S * BS;
        var gp = seg(t, 4800, 4900); st.syk = 1 + 0.08 * Math.sin(Math.PI * gp); st.sxk = 1 - 0.05 * Math.sin(Math.PI * gp);
        st.rot = -sx * 4 * eo(seg(t, 4880, 4950));
      } else if (t < 5200) {
        var h1 = seg(t, 4950, 5200), P1 = arc2(P0, M1, 22, eio(h1));
        st.x = P1[0]; st.y = P1[1]; st.s = lerp(IN_S * BS, 0.95, h1);
        st.syk = 1 + 0.1 * Math.sin(Math.PI * h1); st.sxk = 1 - 0.07 * Math.sin(Math.PI * h1);
        st.rot = -sx * 8; st.lift = 6 + 14 * Math.sin(Math.PI * h1);
      } else if (t < 5450) {
        var h2 = seg(t, 5200, 5450), P2 = arc2(M1, [T.x, T.y], 20, eio(h2));
        st.x = P2[0]; st.y = P2[1]; st.s = lerp(0.95, 1, h2);
        var lq = Math.sin(Math.PI * seg(t, 5190, 5250));
        st.syk = 1 + 0.1 * Math.sin(Math.PI * h2) - 0.14 * lq; st.sxk = 1 - 0.07 * Math.sin(Math.PI * h2) + 0.12 * lq;
        st.rot = -sx * 8; st.lift = 6 + 12 * Math.sin(Math.PI * h2);
      } else {
        // land, pose, settle
        var ld = Math.sin(Math.PI * seg(t, 5450, 5540));
        var pose = eio(seg(t, 5540, 5720)) * (1 - eio(seg(t, 6420, 6520)));
        st.sxk = 1 + 0.14 * ld - 0.05 * pose; st.syk = 1 - 0.15 * ld + 0.09 * pose;
        st.rot = lerp(-sx * 8, 0, eo(seg(t, 5450, 5560))) + sx * 7 * pose + spring(t - 6160, -6 * sx, 2.6, 160);
        st.y -= 3 * pose;
        st.lift = 6 * (1 - seg(t, 6560, 6660));
        // settle hop
        var a = Math.sin(Math.PI * seg(t, 6420, 6500));
        st.sxk += 0.1 * a; st.syk -= 0.12 * a;
        var up = seg(t, 6500, 6660);
        st.y -= 11 * Math.sin(Math.PI * up);
        st.syk += 0.08 * Math.sin(Math.PI * up); st.sxk -= 0.05 * Math.sin(Math.PI * up);
        var land = t >= 6660 ? Math.exp(-(t - 6660) / 70) * Math.sin(Math.PI * clamp((t - 6660) / 120)) : 0;
        st.sxk += 0.15 * land; st.syk -= 0.15 * land;
      }
    }
    return st;
  }
  function glance(t) {
    return kf([[1450, 0], [1510, -1, eoC], [1680, -1], [1740, 1, eoC], [1910, 1], [1980, 0, eoC]], t);
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, sx = S.sx, MX = S.MX, baseY = S.baseY;

    // camera: gentle push-in that keeps whole rows (and the booth top) in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6600, 7150)));
    var Z = lerp(1, 1.12, zk);
    var fy = clamp(baseY - 95, 250, 330);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 6700, 7150)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- booth ----
    var m = boothPose(t, S);
    var bVis = t >= 960 && t < 6790;
    S.bWrap.setAttribute('display', bVis ? 'inline' : 'none');
    S.fWrap.setAttribute('display', bVis ? 'inline' : 'none');
    var hk = holeK(t);
    S.holeE.setAttribute('rx', f1(48 * hk)); S.holeE.setAttribute('ry', f1(10.5 * hk));
    S.holeIn.setAttribute('rx', f1(40 * hk)); S.holeIn.setAttribute('ry', f1(6 * hk));
    S.hole.setAttribute('display', hk > 0.01 ? 'inline' : 'none');
    var standing = bVis ? clamp(1 - m.dy / 40) * clamp(1 - Math.max(0, -m.dy) / 40, 0.4, 1) : 0;
    S.bShadow.setAttribute('cx', f1(MX + m.dx + 3)); S.bShadow.setAttribute('rx', f1(42 * (0.8 + 0.2 * standing)));
    S.bShadow.setAttribute('opacity', f1(standing * 24 * (t > 1300 ? 1 : 0)) / 100);
    var btr = 'translate(' + f1(MX + m.dx) + ',' + f1(baseY + m.dy) + ') rotate(' + f1(m.rot) + ') scale(' + f2((2 - m.sqy) * BS) + ',' + f2(m.sqy * BS) + ')';
    if (bVis) { S.bG.setAttribute('transform', btr); S.fG.setAttribute('transform', btr); }

    // eruption dust
    var dp0 = seg(t, 1000, 1300);
    if (dp0 > 0 && dp0 < 1) { S.dust.setAttribute('d', burst(MX, baseY, 58, 14, [-2.9, -2.5, -0.65, -0.25, 2.6, 0.5], dp0, 0.2)); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100); }
    else if (seg(t, 6430, 6700) > 0 && seg(t, 6430, 6700) < 1) { var dq = seg(t, 6430, 6700); S.dust.setAttribute('d', burst(MX, baseY, 58, 14, [-2.9, -2.4, -0.7, -0.25], dq, 0.2)); S.dust.setAttribute('opacity', f1((1 - dq) * 80) / 100); }
    else S.dust.setAttribute('opacity', 0);

    // door
    var da = doorAng(t) * Math.PI / 180, dc = Math.cos(da);
    S.door.setAttribute('transform', 'translate(24,0) scale(' + f2(dc) + ',' + f2(1 + 0.04 * Math.sin(da)) + ') translate(-24,0)');
    var changing = seg(t, 2500, 2560) * (1 - seg(t, 4700, 4760));
    var pOp = f2(dc > 0 ? lerp(0.62, 0.3, changing) : 0.85);
    S.litIn.setAttribute('opacity', f2(changing * (t > 4480 && t < 4750 ? 0.55 : (t > 2560 && t < 4300 && Math.floor((t - 2560) / 90) % 3 === 1) ? 0.7 : 1)));
    S.panes.forEach(function (p) { p.setAttribute('fill-opacity', pOp); });

    // lamp
    var lampOn = t > 1340 ? 1 : 0;
    if (t > 2560 && t < 4300) lampOn = (Math.floor((t - 2560) / 90) % 3 === 1) ? 0.15 : 1;
    if (t > 4480 && t < 4750) lampOn = 0.15;
    S.lamp.setAttribute('fill', mix('#CDBF98', '#FFE07A', lampOn));
    S.lampGlow.setAttribute('opacity', f2(0.45 * lampOn * (0.85 + 0.15 * Math.sin(t * 0.01))));

    // silhouettes
    if (t > 2440 && t < 4760) {
      S.silG.setAttribute('display', 'inline');
      var cc = mix(mix(S.victimC, S.dealerC, eio(seg(t, 3250, 3950))), INK, 0.22);
      var k = Math.floor((t - 2460) / 130), ph = (t - 2460 - k * 130) / 130;
      var snap = eoC(clamp(ph / 0.35));
      function pose(kk) {
        var still = t > 4300;
        return { x: still ? 0 : (hash(kk, 1) - 0.5) * 20, y: still ? -40 : -44 - hash(kk, 2) * 34, r: still ? 0 : (hash(kk, 3) - 0.5) * 60,
          a1: -Math.PI / 2 - 0.3 - hash(kk, 4) * 2.2, a2: -Math.PI / 2 + 0.3 + hash(kk, 5) * 2.2, sq: still ? 1 : 0.8 + hash(kk, 6) * 0.4 };
      }
      var p0 = pose(k - 1), p1 = pose(k);
      var bx = lerp(p0.x, p1.x, snap), by = lerp(p0.y, p1.y, snap), br = lerp(p0.r, p1.r, snap), bq = lerp(p0.sq, p1.sq, snap);
      var a1 = lerp(p0.a1, p1.a1, snap), a2 = lerp(p0.a2, p1.a2, snap);
      var still2 = t > 4300;
      S.silBody.setAttribute('cx', f1(bx)); S.silBody.setAttribute('cy', f1(by));
      S.silBody.setAttribute('rx', f1(18 * (2 - bq))); S.silBody.setAttribute('ry', f1(18 * bq));
      S.silBody.setAttribute('fill', cc);
      var al = 27;
      var arms = still2 ? 'M' + f1(bx - 15) + ' ' + f1(by + 2) + 'L' + f1(bx - 22) + ' ' + f1(by + 14) + 'M' + f1(bx + 15) + ' ' + f1(by + 2) + 'L' + f1(bx + 22) + ' ' + f1(by + 14)
        : 'M' + f1(bx - 12) + ' ' + f1(by) + 'L' + f1(bx - 12 + Math.cos(a1) * al) + ' ' + f1(by + Math.sin(a1) * al) +
          'M' + f1(bx + 12) + ' ' + f1(by) + 'L' + f1(bx + 12 + Math.cos(a2) * al) + ' ' + f1(by + Math.sin(a2) * al);
      S.silArms.setAttribute('d', arms); S.silArms.setAttribute('stroke', cc);
      // a sock being yanked about (before it gets flung)
      if (t < 3050) {
        var hx = bx + 12 + Math.cos(a2) * al, hy = by + Math.sin(a2) * al;
        S.silSock.setAttribute('display', 'inline');
        S.silSock.setAttribute('transform', 'translate(' + f1(hx) + ',' + f1(hy) + ') rotate(' + f1(br * 2 + 90) + ')');
        S.silSock.setAttribute('fill', mix(cc, PAPER, 0.15));
      } else S.silSock.setAttribute('display', 'none');
      // a cape getting flung on
      if (t > 3650) {
        S.silCape.setAttribute('display', 'inline');
        var cw = still2 ? 0 : 16 * Math.sin((t - 3650) * 0.03) * sx;
        S.silCape.setAttribute('d', 'M' + f1(bx - 12) + ' ' + f1(by - 12) + 'L' + f1(bx - 24 + cw) + ' ' + f1(by + 30) + 'L' + f1(bx + 24 + cw) + ' ' + f1(by + 30) + 'L' + f1(bx + 12) + ' ' + f1(by - 12) + 'Z');
        S.silCape.setAttribute('fill', cc); S.silCape.setAttribute('opacity', 0.75);
      } else S.silCape.setAttribute('display', 'none');
      S.silG.setAttribute('opacity', f2(seg(t, 2440, 2500)));
    } else S.silG.setAttribute('display', 'none');

    // slam ticks
    var sl = seg(t, 2445, 2700), bt0 = toWorld(S, m, 0, -60);
    if (sl > 0 && sl < 1) { S.slamTicks.setAttribute('d', burst(bt0[0], bt0[1], 44, 70, [-0.3, 0.1, 0.5, Math.PI + 0.3, Math.PI - 0.1, Math.PI - 0.5], sl, 0.18)); S.slamTicks.setAttribute('opacity', f1((1 - sl) * 95) / 100); }
    else S.slamTicks.setAttribute('opacity', 0);

    // ---- the sock ----
    var landL = [-sx * 6, -150], landRot = -sx * 78;
    if (t >= 3050 && t < 6790) {
      S.sock.setAttribute('display', 'inline');
      var sp, srot, ssx = 1.25, ssy = 1.25;
      if (t < 3560) {
        var fp = seg(t, 3050, 3560);
        var A0 = toWorld(S, boothPose(3050, S), sx * 4, -138), B0 = toWorld(S, boothPose(3560, S), landL[0], landL[1] - 7);
        sp = arc2(A0, B0, clamp(A0[1] - 100, 45, 95), fp);
        srot = sx * 620 * eo(fp) + lerp(0, landRot - sx * 720 + sx * 720, fp) * 0;
        srot = lerp(0, sx * 720 + landRot, eo(fp));
        ssx = 1.25 * (1 - 0.15 * Math.sin(Math.PI * fp)); ssy = 1.25 * (1 + 0.15 * Math.sin(Math.PI * fp));
      } else {
        sp = toWorld(S, m, landL[0], landL[1] - 7);
        srot = landRot + m.rot + spring(t - 3560, 14 * sx, 3, 140);
        var th = Math.exp(-(t - 3560) / 80) * Math.sin(Math.PI * clamp((t - 3560) / 120));
        ssx = 1.25 * (1 + 0.25 * th); ssy = 1.25 * (1 - 0.25 * th);
      }
      S.sock.setAttribute('transform', tr(sp[0], sp[1], srot, ssx * sx, ssy));
    } else S.sock.setAttribute('display', 'none');
    var stp = seg(t, 3560, 3820);
    if (stp > 0 && stp < 1) { var sr = toWorld(S, m, landL[0], landL[1] - 6); S.sockTicks.setAttribute('d', burst(sr[0], sr[1], 20, 12, [-2.7, -2.1, -1.57, -1.0, -0.4], stp, 0.3)); S.sockTicks.setAttribute('opacity', f1((1 - stp) * 100) / 100); }
    else S.sockTicks.setAttribute('opacity', 0);

    // ---- smoke puffs ----
    var pk = 0;
    function puff(t0, dur, lx, ly, vx, vy, r) {
      var c = S.puffs[pk++]; if (!c) return;
      var a = seg(t, t0, t0 + dur);
      if (a <= 0 || a >= 1) { c.setAttribute('opacity', 0); return; }
      var o = toWorld(S, boothPose(t0, S), lx, ly);
      c.setAttribute('cx', f1(o[0] + vx * eo(a))); c.setAttribute('cy', f1(o[1] + vy * eo(a) - 6 * a));
      c.setAttribute('r', f1(r * (a < 0.35 ? backOut(a / 0.35, 1.5) : 1 - 0.55 * ei((a - 0.35) / 0.65))));
      c.setAttribute('opacity', 1);
    }
    // squeezing out of the gaps
    [[-27, -100], [-27, -70], [-27, -38], [27, -95], [27, -62], [27, -30]].forEach(function (p, i) {
      puff(4480 + i * 35, 520, p[0] * sx, p[1], (p[0] > 0 ? 1 : -1) * sx * 16, -4, 6 + (i % 3));
    });
    [[-24, -146], [0, -152], [22, -146]].forEach(function (p, i) { puff(4520 + i * 40, 500, p[0], p[1], p[0] * 0.4, -16, 7); });
    [[-30, -4], [30, -4]].forEach(function (p, i) { puff(4500 + i * 50, 480, p[0], p[1], p[0] * 0.6, 2, 6.5); });
    // the burst cloud rolling out of the doorway
    [[0, -60, -sx * 34, 6, 15], [-8, -90, -sx * 28, -16, 12], [8, -30, -sx * 40, 10, 13], [0, -100, -sx * 10, -26, 11],
      [-12, -50, -sx * 46, -6, 10], [10, -75, -sx * 18, -10, 13], [-4, -20, -sx * 30, 14, 11], [6, -110, sx * 8, -24, 9], [-14, -10, -sx * 52, 12, 9]].forEach(function (p, i) {
      puff(4750 + i * 20, 560, p[0], p[1], p[2], p[3], p[4]);
    });

    // ---- the chip actor ----
    var st = actorState(S, t);
    if (st.who) {
      S.actor.setAttribute('display', 'inline');
      var gtr = 'translate(' + f1(st.x) + ',' + f1(st.y) + ') rotate(' + f1(st.rot) + ') scale(' + f2(st.s * st.sxk) + ',' + f2(st.s * st.syk) + ')';
      S.vG.setAttribute('display', st.who === 'v' ? 'inline' : 'none');
      S.hG.setAttribute('display', st.who === 'h' ? 'inline' : 'none');
      S.aSh.setAttribute('cx', f1(st.x + 1.5 + st.lift * 0.35)); S.aSh.setAttribute('cy', f1(st.y + 3.5 + st.lift));
      S.aSh.setAttribute('rx', f1(CR * st.s * Math.max(0.6, 1 - st.lift * 0.008))); S.aSh.setAttribute('ry', f1(CR * st.s * Math.max(0.6, 1 - st.lift * 0.008)));
      var shOn = 1;
      if (t >= 2150 && t < 2460) shOn = 1 - seg(t, 2150, 2250);
      if (t >= 4750 && t < 4960) shOn = 0;
      if (t >= 4950 && t < 5200) shOn = seg(t, 5000, 5200) * 0.8;
      S.aSh.setAttribute('opacity', f2(0.28 * shOn));
      if (st.who === 'v') {
        S.vG.setAttribute('transform', gtr);
        var fOn = eio(seg(t, 650, 860));
        var lid = kf([[0, 1], [700, 1], [800, -1], [1000, -1], [1010, -1], [1500, -1], [1580, -0.35], [1640, -0.35], [1700, -1], [2010, -1], [2060, -0.25]], t, eo);
        var surprised = seg(t, 1030, 1060) * (1 - seg(t, 1350, 1450));
        var g = glance(t);
        var look = [g, 0.1];
        if (t > 1240 && t < 1450) { var bp = toWorld(S, m, 0, -80); var dx = bp[0] - st.x, dy = bp[1] - st.y, mm = Math.hypot(dx, dy) || 1; look = [dx / mm, dy / mm]; }
        if (t > 2050) look = [sx * 0.9, -0.3];
        setFace(S.vChip, fOn, look, lid);
        S.vChip.eyes.forEach(function (e) { e.pup.setAttribute('r', f1(1.85 * (1 - 0.35 * surprised))); });
        var gs = backOut(seg(t, 760, 940), 2.4);
        S.vChip.glasses.setAttribute('transform', 'translate(0,' + f1(-7 * (1 - gs)) + ') translate(0,-6.5) scale(' + f2(Math.max(0.001, gs)) + ') translate(0,6.5)');
        S.vChip.glasses.setAttribute('opacity', t < 760 ? 0 : 1);
      } else {
        S.hG.setAttribute('transform', gtr);
        var fade = 1 - eio(seg(t, 6720, 6980));
        var hl = kf([[4750, -0.3], [6220, -0.3], [6260, 1], [6320, -0.3], [6640, -0.3], [6700, 1]], t, eo);
        var hlook = t < 4960 ? [-sx * 0.6, 0] : t < 5450 ? [-sx * 0.7, -0.2] : t < 6150 ? [0.35 * sx, -0.5] : t < 6420 ? [-sx * 0.3, -0.9] : [0, 0.1];
        if (t > 6150 && t < 6420) hlook = [-sx * 0.5, -0.9];
        setFace(S.hChip, fade, hlook, hl);
        S.hChip.brows.setAttribute('opacity', f2(1 - seg(t, 6650, 6700)));
        // cape
        var capeOn = t < 6160;
        S.capeG.setAttribute('display', capeOn ? 'inline' : 'none');
        S.clasp.setAttribute('display', capeOn ? 'inline' : 'none');
        if (capeOn) {
          var th = kf([[4750, 84], [4950, 84], [5020, 22, eoC], [5450, 22], [5600, 34], [6150, 34]], t);
          if (t > 5450) th += 7 * Math.sin((t - 5450) * 0.008);
          var len = kf([[4750, 34], [4950, 34], [5020, 38], [5450, 38], [5650, 42], [6150, 42]], t);
          var amp = kf([[4750, 1.2], [4950, 1.5], [5020, 4.5], [5450, 4.5], [5600, 3.2]], t);
          var cd = capeD(sx, th, len, -t * 0.026, amp);
          S.capeP.setAttribute('d', cd.d); S.capeIn.setAttribute('d', cd.lin);
        }
      }
      S.actor.setAttribute('transform', '');
    } else S.actor.setAttribute('display', 'none');

    // step dust on the hero's landings
    var sdd = '', sdo = 0;
    [[5200, 0], [5450, 1]].forEach(function (L2) {
      var q = seg(t, L2[0], L2[0] + 260);
      if (q > 0 && q < 1) {
        var P = L2[1] ? [T.x, T.y] : (function () { var P0 = toWorld(S, boothPose(4840, S), 0, IN_Y); return [lerp(P0[0], T.x, 0.52), lerp(P0[1], T.y, 0.52) + 4]; })();
        sdd += burst(P[0], P[1] + 14, 22, 10, [2.8, 2.4, 0.35, 0.75], q, 0.35); sdo = 1 - q;
      }
    });
    S.stepDust.setAttribute('d', sdd); S.stepDust.setAttribute('opacity', f2(0.9 * sdo));

    // glint during the pose
    var gl = seg(t, 5660, 5960);
    if (gl > 0 && gl < 1) {
      var gx = T.x + 15 * (sx > 0 ? -1 : 1) * -1, gy = T.y - 20, gs2 = Math.sin(Math.PI * gl) * 7;
      gx = T.x + 14;
      S.glint.setAttribute('d', 'M' + f1(gx) + ' ' + f1(gy - gs2) + 'Q' + f1(gx) + ' ' + f1(gy) + ' ' + f1(gx + gs2) + ' ' + f1(gy) + 'Q' + f1(gx) + ' ' + f1(gy) + ' ' + f1(gx) + ' ' + f1(gy + gs2) + 'Q' + f1(gx) + ' ' + f1(gy) + ' ' + f1(gx - gs2) + ' ' + f1(gy) + 'Q' + f1(gx) + ' ' + f1(gy) + ' ' + f1(gx) + ' ' + f1(gy - gs2) + 'Z');
      S.glint.setAttribute('opacity', 1);
      S.glint.setAttribute('transform', 'rotate(' + f1(gl * 90) + ' ' + f1(gx) + ' ' + f1(gy) + ')');
    } else S.glint.setAttribute('opacity', 0);

    // the cape whips off and flies away
    var cf = seg(t, 6160, 6950);
    if (cf > 0 && cf < 1) {
      S.flyG.setAttribute('display', 'inline');
      var P0c = [T.x + sx * 16, T.y - 4], P1c = [T.x + sx * 30, T.y - 150], P2c = [T.x - sx * 10 + sx * 140, -120];
      var u = ei(cf) * 0.7 + cf * 0.3;
      var bx2 = (1 - u) * (1 - u) * P0c[0] + 2 * u * (1 - u) * P1c[0] + u * u * P2c[0];
      var by2 = (1 - u) * (1 - u) * P0c[1] + 2 * u * (1 - u) * P1c[1] + u * u * P2c[1];
      var crot = sx * (7 + 380 * ei(cf)) + 30 * Math.sin(cf * 9);
      var csc = 1 + 0.25 * cf;
      S.flyG.setAttribute('transform', 'translate(' + f1(bx2) + ',' + f1(by2) + ') rotate(' + f1(crot) + ') scale(' + f2(csc * (0.85 + 0.15 * Math.cos(cf * 14))) + ',' + f2(csc) + ')');
      var fc = capeD(sx, 40 + 40 * Math.sin(cf * 11), 38, -t * 0.045, 5);
      S.flyP.setAttribute('d', fc.d); S.flyIn.setAttribute('d', fc.lin);
    } else S.flyG.setAttribute('display', 'none');

    // landing ring + ticks (the set-down)
    var rp = seg(t, 6660, 7160);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var tp = seg(t, 6660, 6930);
    if (tp > 0 && tp < 1) {
      var td = '', r0 = 27 + 9 * eoC(tp), r1b = r0 + 6 * (1 - tp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        td += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.ticks.setAttribute('d', td); S.ticks.setAttribute('opacity', f1((1 - tp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);

    // final line
    var lp2 = seg(t, 7550, 7900);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2phonebooth;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2phonebooth = S;
    return S;
  }

  window.CCSteal2_phonebooth = {
    title: 'The Quick Change',
    blurb: 'A phone booth rises out of the felt, Nate’s bespectacled chip ducks inside, and after a frantic flurry of flying socks it strides out caped and in Nick’s colour, strikes a pose and settles right back in its spot.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2phonebooth = S;
      var token = {};
      root.__cc2phoneboothToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2phoneboothToken !== token) { resolve(); return; }
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
