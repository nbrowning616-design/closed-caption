/* Closed Caption - "steal" moment - concept: THE JERSEY SWAP (key: jerseyswap)
 *
 * Football's classic post-match ritual: at the final whistle, opponents shake hands
 * and swap shirts. Every chip is secretly wearing a jersey in its own colour, so
 * when Nate's chip pulls on the dealer's shirt it is, quite literally, wearing
 * Nick's colours. The gag: the shirt gets stuck over its head first.
 *
 * Storyboard (ms) - top-down felt table, caption rows 1/2/3/CC.
 *    0- 750  Table deals in: rows drop in with a soft overshoot, chips pop on.
 *  700-1300  Camera eases in a touch (whole rows stay in frame).
 * 1100-2350  FULL TIME. A referee's whistle swings down on its cord and blows
 *            peep... peep... peeeeep. Other chips dim.
 * 1380-1650  Nate's chip wakes: sleeves and a collar pop out (it was wearing its
 *            jersey all along), little legs, eyes blink open; it hops.
 * 1600-2400  Nick's chip trots in from the edge in Nick's-colour jersey.
 * 2430-3130  Handshake: hands meet in the middle, three firm pumps.
 * 3120-3550  Both whip their shirts off over their heads (bare cream chips).
 * 3550-3950  The swap: shirts arc across, spinning, and are caught overhead.
 * 3950-4150  Nick's chip tugs Nate's shirt on in one clean pop. Smug nod.
 * 3950-4500  Nate's chip pulls Nick's shirt on... and it STICKS over its head:
 *            arms up in the sleeves, eyes gone, wriggling.
 * 4500-5050  Blind stumble: lurch back, sway, then charge straight into a
 *            neighbour chip - BONK. (Neighbour opens annoyed eyes, gets shoved.)
 * 5050-5300  Recoil, spin, plop on its bottom.
 * 5380-5600  Wind-up wriggle... POP! The head bursts through the collar; the shirt
 *            snaps down. It now wears Nick's colours, Nick's initial on its chest.
 * 5600-6250  Beat: wide eyes, looks down at its new shirt, then a happy little jump.
 *            Nick's chip nods approvingly and trots off, waving, in Nate's shirt.
 * 6150-6560  Nate's chip toddles back to its exact spot.
 * 6560-6950  Tucks in: sleeves, legs and eyes fold away; collar becomes the dashed
 *            ring - a plain chip again, Nick's colour, Nick's initial. Little hop,
 *            set-down at 6800 (squash, ring, dust).
 * 6950-7450  Stillness; camera eases back.
 * 7500-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', BARE = '#F4E8CF', SILVER = '#D3D8DF';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
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
  function lin(t) { return t; }
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  // decaying cosine (starts at amp), cut off cleanly so the end state is exact
  function dc(dt, amp, hz, decay) { return dt < 0 || dt > 1400 ? 0 : amp * Math.exp(-dt / decay) * Math.cos(2 * Math.PI * hz * dt / 1000); }
  function bump(t, a, b) { var p = seg(t, a, b); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f3(v) { return Math.round(v * 1000) / 1000; }
  function kf(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        var a = keys[i - 1], b = keys[i];
        return lerp(a[1], b[1], (b[2] || eio)((t - a[0]) / (b[0] - a[0])));
      }
    }
    return keys[keys.length - 1][1];
  }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function P2(x, y) { return f1(x) + ' ' + f1(y); }
  function dir(deg) { var a = deg * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }
  function blink(t, times) { var o = 1; times.forEach(function (b) { o = Math.min(o, 1 - bump(t, b, b + 150)); }); return o; }

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
    var T = target, gap = h / 2 + g / 2 + 2;
    // where Nick's chip stands for the handshake: clear of every other chip
    var cands = [[60, 0], [40, -gap], [40, gap], [-40, -gap], [-40, gap], [0, -gap], [0, gap]], N = null;
    for (var k = 0; k < cands.length && !N; k++) {
      var nx = T.x + cands[k][0], ny = T.y + cands[k][1];
      var ok = nx >= 100 && nx <= 336 && ny >= 70 && ny <= 540;
      others.forEach(function (o) { if (Math.hypot(o.x - nx, o.y - ny) < 54) ok = false; });
      if (ok) N = [nx, ny];
    }
    if (!N) N = [T.x + 40, T.y + (T.y > 300 ? -gap : gap)];
    // who gets bumped by the blind stumble: nearest chip not in Nick's direction
    var nd = Math.atan2(N[1] - T.y, N[0] - T.x), best = null, bs = 1e9;
    others.forEach(function (o) {
      var a = Math.atan2(o.y - T.y, o.x - T.x), da = Math.abs(((a - nd + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      var s = Math.hypot(o.x - T.x, o.y - T.y) + (da < 1.0 ? 600 : 0);
      if (s < bs) { bs = s; best = o; }
    });
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini, N: N, bumpee: best };
  }

  // ---------- choreography ----------
  function plan(L) {
    var T = L.target, Hx = T.x, Hy = T.y, N = L.N;
    var B = L.bumpee ? [L.bumpee.x, L.bumpee.y] : N;
    var dx = B[0] - Hx, dy = B[1] - Hy, dist = Math.max(1, Math.hypot(dx, dy));
    var u = [dx / dist, dy / dist], p = [-u[1], u[0]];
    if (p[0] * (N[0] - Hx) + p[1] * (N[1] - Hy) > 0) p = [-p[0], -p[1]];
    var trav = Math.max(0, dist - 45);
    var C = [Hx + u[0] * trav, Hy + u[1] * trav];
    var R = [C[0] - u[0] * 24 + p[0] * 7, C[1] - u[1] * 24 + p[1] * 7];
    function pk(i) {
      var o = i ? 1 : 0;
      return [[0, [Hx, Hy][o]], [4480, [Hx, Hy][o]],
        [4640, [Hx, Hy][o] - u[o] * 13 + p[o] * 10, eoC],
        [4800, [Hx, Hy][o] - u[o] * 3 - p[o] * 8, eio],
        [4930, [Hx, Hy][o] + u[o] * trav * 0.4 + p[o] * 5, eio],
        [5050, C[o], ei],
        [5210, R[o], eoC],
        [6150, R[o]],
        [6560, [Hx, Hy][o], eio]];
    }
    var axK = pk(0), ayK = pk(1);
    var arK = [[0, 0], [4480, 0], [4640, -14], [4800, 12], [4930, -8], [5050, 6, ei], [5130, -24, eoC], [5230, -9], [5320, 0], [6150, 0], [6300, -5], [6450, 5], [6560, 0]];
    var homeWalk = Math.hypot(R[0] - Hx, R[1] - Hy) > 3;
    var ex = 440;
    var bxK = [[0, ex], [1600, ex], [2400, N[0], function (q) { return 1 - Math.pow(1 - q, 1.6); }], [6000, N[0]], [6680, ex + 10, function (q) { return Math.pow(q, 1.4); }]];
    var byK = [[0, N[1] + 6], [1600, N[1] + 6], [2400, N[1]], [6000, N[1]], [6680, N[1] - 10]];
    return { Hx: Hx, Hy: Hy, N: N, B: B, u: u, p: p, C: C, R: R, axK: axK, ayK: ayK, arK: arK, homeWalk: homeWalk, bxK: bxK, byK: byK, sA: N[0] >= Hx ? 1 : -1 };
  }

  // ---------- builders ----------
  function chipParts(parent, color, txt) {
    var g = mk('g', {}, parent);
    mk('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    return g;
  }
  var SLEEVE = 'M-3 -6.5L11 -7.6Q14.5 -7.6 14.5 -4.4L14.5 4.4Q14.5 7.6 11 7.6L-3 6.5Z';
  function makeJersey(layer, color, label) {
    var g = mk('g', {}, layer), sl = [];
    [0, 1].forEach(function () {
      var s = mk('g', {}, g);
      mk('path', { d: SLEEVE, fill: color, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round' }, s);
      mk('path', { d: 'M10 -6.6L10 6.6', stroke: '#FFFFFF', 'stroke-opacity': 0.8, 'stroke-width': 2, fill: 'none' }, s);
      sl.push(s);
    });
    mk('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    var ring = mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var bul = mk('ellipse', { cx: 0, cy: -20, rx: 10, ry: 4, fill: color, stroke: INK, 'stroke-width': 2.4, opacity: 0 }, g);
    var colG = mk('g', {}, g);
    var colU = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 4.6, 'stroke-linecap': 'round' }, colG);
    var colW = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, colG);
    var lg = mk('g', {}, g);
    var tx = mk('text', { x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': label.length > 1 ? 15 : 18 }, lg);
    tx.textContent = label;
    return { g: g, sl: sl, ring: ring, bul: bul, colG: colG, colU: colU, colW: colW, lg: lg };
  }
  // s: { tr, aL, aR, sleeve, collar, pinch, chip }
  function renderJersey(J, s) {
    J.g.setAttribute('transform', s.tr);
    var ss = Math.max(0.001, s.sleeve);
    J.sl[0].setAttribute('transform', 'translate(-16.5,-11) rotate(' + f1(s.aL) + ') scale(' + f3(ss) + ')');
    J.sl[1].setAttribute('transform', 'translate(16.5,-11) rotate(' + f1(s.aR) + ') scale(' + f3(ss) + ')');
    J.sl[0].setAttribute('opacity', s.sleeve > 0.02 ? 1 : 0); J.sl[1].setAttribute('opacity', s.sleeve > 0.02 ? 1 : 0);
    var pu = (s.push || 0) * s.pinch, by = -20.6 - s.pinch * (3 + 5 * pu);
    var hw = lerp(7, 2.6, s.pinch), dep = lerp(-12.5, by + 1, s.pinch);
    var d = 'M' + P2(-hw, by) + 'Q' + P2(0, dep) + ' ' + P2(hw, by);
    J.bul.setAttribute('opacity', s.pinch > 0.02 ? 1 : 0);
    J.bul.setAttribute('cy', f1(-19 - s.pinch * (1 + 2.5 * pu))); J.bul.setAttribute('rx', f1(lerp(6, 11, s.pinch) - 2 * pu)); J.bul.setAttribute('ry', f1(lerp(1, 4.5 + 3.5 * pu, s.pinch)));
    J.colU.setAttribute('d', d); J.colW.setAttribute('d', d);
    J.colG.setAttribute('opacity', f3(clamp(s.collar)));
    J.ring.setAttribute('opacity', f3(clamp(s.chip)));
    var c = clamp(s.chip);
    J.lg.setAttribute('transform', 'translate(0,' + f1(lerp(9.5, 0.5, c)) + ') scale(' + f3(lerp(0.6, 1, c)) + ')');
  }

  function makeEyes(layer, small) {
    var g = mk('g', {}, layer), eyes = [];
    var rx = small ? 3.1 : 3.8, ry = small ? 3.7 : 4.6;
    [-1, 1].forEach(function (s) {
      var eg = mk('g', {}, g), inner = mk('g', {}, eg);
      var wh = mk('ellipse', { rx: rx, ry: ry, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6 }, inner);
      var pu = mk('circle', { r: small ? 1.8 : 2.2, fill: INK }, inner);
      var hp = mk('path', { d: 'M-3.6 1.2Q0 -3.4 3.6 1.2', fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, eg);
      eyes.push({ s: s, eg: eg, inner: inner, wh: wh, pu: pu, hp: hp });
    });
    var brows = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, g);
    return { g: g, eyes: eyes, brows: brows, small: small };
  }
  // s: { tr, op, open, wide, happy, lx, ly, dy, brow }
  function renderEyes(E, s, ex, ey) {
    E.g.setAttribute('transform', s.tr);
    E.g.setAttribute('opacity', f3(clamp(s.op)));
    if (s.op <= 0.001) return;
    E.eyes.forEach(function (e) {
      e.eg.setAttribute('transform', 'translate(' + P2(e.s * ex, ey + (s.dy || 0)) + ')');
      var o = Math.max(0.06, s.open);
      e.inner.setAttribute('transform', 'scale(' + f3(s.wide) + ',' + f3(s.wide * o) + ')');
      e.pu.setAttribute('transform', 'translate(' + P2(s.lx, s.ly) + ')');
      e.inner.setAttribute('opacity', f3(1 - s.happy));
      e.hp.setAttribute('opacity', f3(s.happy));
    });
    if (s.brow) {
      E.brows.setAttribute('opacity', f3(s.brow));
      E.brows.setAttribute('d', 'M' + P2(-ex - 4, ey - 8) + 'L' + P2(-ex + 3, ey - 5.5) + 'M' + P2(ex + 4, ey - 8) + 'L' + P2(ex - 3, ey - 5.5));
    }
  }

  function makeChar(layer, shLayer) {
    var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28 }, shLayer);
    var g = mk('g', {}, layer);
    var arms = [], hands = [], legs = [], feet = [];
    [0, 1].forEach(function () {
      legs.push(mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g));
      feet.push(mk('ellipse', { fill: INK }, g));
    });
    [0, 1].forEach(function () {
      arms.push(mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, g));
    });
    var body = mk('circle', { r: CR, fill: BARE, stroke: INK, 'stroke-width': 2.6 }, g);
    mk('circle', { r: 15.5, fill: 'none', stroke: INK, 'stroke-opacity': 0.14, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    var handsG = mk('g', {}, layer); // hands drawn above jerseys' layer order is handled by caller
    [0, 1].forEach(function () { hands.push(mk('circle', { r: 3.7, fill: BARE, stroke: INK, 'stroke-width': 1.8 }, handsG)); });
    return { sh: sh, g: g, arms: arms, hands: hands, legs: legs, feet: feet, body: body, handsG: handsG };
  }
  function charTr(s) { return 'translate(' + P2(s.x, s.y - s.lift) + ') rotate(' + f1(s.rot) + ') scale(' + f3(s.sx) + ',' + f3(s.sy) + ')'; }
  // s: { x,y,rot,sx,sy,lift,m,walk,ph, hands:[[x,y],[x,y]], bodyOp }
  function renderChar(C, s) {
    var tr = charTr(s);
    C.g.setAttribute('transform', tr);
    C.handsG.setAttribute('transform', tr);
    var m = Math.max(0, s.m), vis = m > 0.02;
    C.g.setAttribute('opacity', s.hide ? 0 : 1); C.handsG.setAttribute('opacity', s.hide || !vis ? 0 : 1);
    C.body.setAttribute('opacity', s.bodyOp);
    for (var i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      // legs
      var fl = s.walk * Math.max(0, Math.sin(s.ph + i * Math.PI)) * 4;
      var ll = 9 * m;
      var lx0 = sd * 7, ly0 = 16, lx1 = sd * (7.5 + 1.2 * s.walk * Math.sin(s.ph + i * Math.PI)), ly1 = 16 + ll - fl;
      C.legs[i].setAttribute('d', vis ? 'M' + P2(lx0, ly0) + 'L' + P2(lx1, ly1) : '');
      C.feet[i].setAttribute('cx', f1(lx1 + sd * 1.2)); C.feet[i].setAttribute('cy', f1(ly1 + 1.2));
      C.feet[i].setAttribute('rx', f1(4.6 * m)); C.feet[i].setAttribute('ry', f1(2.7 * m));
      C.feet[i].setAttribute('opacity', vis ? 1 : 0);
      // arms
      var px = sd * 14.5, py = -6, hx = px + (s.hands[i][0] - px) * m, hy = py + (s.hands[i][1] - py) * m;
      var mx = (px + hx) / 2, my = (py + hy) / 2, vx = hx - px, vy = hy - py, vl = Math.max(1, Math.hypot(vx, vy));
      var bend = 3.5 * sd;
      var cx = mx - vy / vl * bend, cy = my + vx / vl * bend;
      C.arms[i].setAttribute('d', vis ? 'M' + P2(px, py) + 'Q' + P2(cx, cy) + ' ' + P2(hx, hy) : '');
      C.hands[i].setAttribute('cx', f1(hx)); C.hands[i].setAttribute('cy', f1(hy));
      C.hands[i].setAttribute('r', f1(3.7 * Math.min(1.1, m)));
    }
    var so = s.lift;
    C.sh.setAttribute('cx', f1(s.x + 1.5 + so * 0.15)); C.sh.setAttribute('cy', f1(s.y + 3.5 + (s.shy || 0)));
    C.sh.setAttribute('r', f1(CR * Math.max(0.01, (s.shs || 1)) * (1 - so * 0.008)));
    C.sh.setAttribute('opacity', s.hide ? 0 : f3(0.28 - so * 0.006));
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-jerseyswap-' + (++uid) + '-';
    var L = layout(opts), P = plan(L), T = L.target;
    var DC = opts.dealerColor || '#E8559E', VC = T.color || opts.victimColor || '#2F6FE0';
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);

    mk('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = mk('g', {}, svg);
    var tableG = mk('g', {}, cam);
    mk('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    mk('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    mk('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    var rowsG = [], chipsG = [];
    var cardLayer = mk('g', {}, cam), shLayer = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = mk('g', {}, cardLayer);
      mk('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      mk('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      mk('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = mk('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
      r.chips.forEach(function (c) {
        if (c.target) return;
        var wrap = mk('g', {}, chipLayer);
        var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        var cg = mk('g', {}, wrap); chipParts(cg, c.color, c.ini);
        var o = { wrap: wrap, g: cg, sh: sh, c: c };
        if (c === L.bumpee) o.eyes = makeEyes(cg, true);
        chipsG.push(o);
      });
    });

    // jersey flight shadows
    var fsh = [mk('ellipse', { rx: 20, ry: 9, fill: INK, opacity: 0 }, cam), mk('ellipse', { rx: 20, ry: 9, fill: INK, opacity: 0 }, cam)];
    var charLayer = mk('g', {}, cam);
    var A = makeChar(charLayer, shLayer), Bc = makeChar(charLayer, shLayer);
    var jLayer = mk('g', {}, cam);
    var J1 = makeJersey(jLayer, VC, T.ini), J2 = makeJersey(jLayer, DC, L.ini(opts.dealer));
    // hands above jerseys, eyes above all
    jLayer.appendChild(A.handsG); jLayer.appendChild(Bc.handsG);
    var eyeLayer = mk('g', {}, cam);
    var EA = makeEyes(eyeLayer, false), EB = makeEyes(eyeLayer, false);
    var flyLayer = mk('g', {}, cam);
    var fx = mk('g', {}, cam);
    var ticks = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, fx);
    var ripple = mk('circle', { fill: 'none', stroke: DC, opacity: 0 }, fx);
    var pring = mk('circle', { fill: 'none', stroke: DC, opacity: 0 }, fx);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, fx);

    // whistle on a cord (screen space)
    var wh = mk('g', {}, svg);
    var cord = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, wh);
    var whB = mk('g', {}, wh);
    var whBody = mk('g', {}, whB);
    mk('circle', { cx: 18, cy: -12, r: 4.6, fill: 'none', stroke: INK, 'stroke-width': 2.2 }, whBody);
    mk('path', { d: 'M-27 -7L-2 -9L-2 9L-27 5Q-30 4.5 -30 2L-30 -4Q-30 -6.5 -27 -7Z', fill: SILVER, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, whBody);
    mk('circle', { cx: 6, cy: 1, r: 14, fill: SILVER, stroke: INK, 'stroke-width': 2.6 }, whBody);
    mk('path', { d: 'M-6 -8.5L4 -8.5', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, whBody);
    mk('path', { d: 'M-1 -4Q4 -9 11 -6', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.7, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, whBody);
    mk('path', { d: 'M-25 -3L-6 -4', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-linecap': 'round' }, whBody);
    var pea = mk('circle', { r: 3.4, fill: '#F2C14E', stroke: INK, 'stroke-width': 1.4 }, whBody);
    var blast = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, whB);

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return { opts: opts, L: L, P: P, svg: svg, cam: cam, jLayer: jLayer, flyLayer: flyLayer, rowsG: rowsG, chipsG: chipsG, A: A, Bc: Bc, J1: J1, J2: J2, EA: EA, EB: EB, fsh: fsh,
      ticks: ticks, ripple: ripple, pring: pring, dust: dust, wh: wh, cord: cord, whB: whB, whBody: whBody, pea: pea, blast: blast, line: line };
  }

  // ---------- render ----------
  var REST_L = 150, UP_L = 245;
  function armKeysA() {
    return [[0, REST_L], [3110, REST_L], [3260, UP_L, eoC], [3530, UP_L], [3600, 200, eoC], [3700, 212], [3880, UP_L, eoC], [5545, UP_L], [5640, 192, eoC], [5760, 196], [5900, 158], [5960, 252, eoC], [6170, 250], [6300, REST_L, eio]];
  }
  function armKeysB() {
    return [[0, REST_L], [3110, REST_L], [3260, UP_L, eoC], [3530, UP_L], [3600, 200, eoC], [3700, 212], [3880, UP_L, eoC], [3990, UP_L], [4130, REST_L, eoC]];
  }
  var AKA = armKeysA(), AKB = armKeysB();

  function render(S, t) {
    t = clamp(t, 0, T_END);
    var P = S.P, L = S.L, T = L.target;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 700, 1300)) * (1 - eioC(seg(t, 6950, 7450)));
    var Zm = Math.min(1.25, W / (Math.max(P.N[0], P.Hx) + 50 - 36)), Z = lerp(1, Zm, zk);
    var fy = clamp(T.y - 20, H / (2 * Zm) - 10, 600 - H / (2 * Zm) + 20);
    var fxc = clamp(36 + W / (2 * Zm), W / 2, W - W / (2 * Zm) + 30);
    var ccy = lerp(H / 2, fy, zk), ccx = lerp(W / 2, fxc, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1250, 1600)) * (1 - eio(seg(t, 6700, 7100)));
    var bk = eo(seg(t, 5045, 5100)) * (1 - eioC(seg(t, 5350, 5800)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c), ox = 0, oy = 0, rot = 0, op = 1 - 0.5 * dim;
      if (o.eyes) {
        ox = P.u[0] * 10 * bk; oy = P.u[1] * 10 * bk;
        rot = 16 * bk * Math.sin((t - 5050) * 0.028) * (1 - seg(t, 5300, 5700));
        sc *= 1 - dc(t - 5050, 0.1, 5, 90);
        var ew = seg(t, 5060, 5120) * (1 - seg(t, 5700, 5780));
        op = lerp(op, 1, ew);
        var A0 = [P.Hx - (o.c.x + ox), P.Hy - (o.c.y + oy)], al = Math.max(1, Math.hypot(A0[0], A0[1]));
        renderEyes(o.eyes, { tr: '', op: ew, open: blink(t, [5480]) * (1 - eio(seg(t, 5680, 5760))), wide: 1, happy: 0, lx: A0[0] / al * 1.3, ly: A0[1] / al * 1.3, brow: ew }, 6.2, -9.5);
      }
      o.g.setAttribute('transform', 'translate(' + P2(o.c.x + ox, o.c.y + oy) + ') rotate(' + f1(rot) + ') scale(' + f3(sc) + ')');
      o.sh.setAttribute('cx', f1(o.c.x + ox + 1.5)); o.sh.setAttribute('cy', f1(o.c.y + oy + 3.5));
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', f3(op));
    });

    // ---------- whistle ----------
    var wIn = seg(t, 1080, 1320), wOut = seg(t, 2080, 2380);
    var wy = lerp(-70, 74, backOut(wIn, 1.3)) - 150 * ei(wOut);
    var blasts = [[1330, 1450], [1510, 1630], [1700, 2060]], bl = 0;
    blasts.forEach(function (b) { var q = seg(t, b[0], b[0] + 40) * (1 - seg(t, b[1] - 30, b[1])); bl = Math.max(bl, q); });
    var wxo = 302, wsw = 10 * Math.sin((t - 1080) * 0.006) * Math.exp(-Math.max(0, t - 1080) / 500);
    var wr = -16 + wsw - 6 * bl;
    S.wh.setAttribute('opacity', t > 1060 && t < 2400 ? 1 : 0);
    S.cord.setAttribute('d', 'M' + P2(wxo + 30, -20) + 'Q' + P2(wxo + 30 + wsw * 0.6, wy - 40) + ' ' + P2(wxo + 18 * Math.cos(wr * Math.PI / 180) + 12 * Math.sin(wr * Math.PI / 180), wy - 12));
    var wsc = 1 + 0.08 * bl * (0.6 + 0.4 * Math.sin(t * 0.09));
    S.whB.setAttribute('transform', 'translate(' + P2(wxo, wy) + ') rotate(' + f1(wr) + ') scale(' + f3(1.35 * wsc) + ',' + f3(1.35 * (2 - wsc)) + ')');
    S.pea.setAttribute('cx', f1(6 + 4 * bl * Math.sin(t * 0.21))); S.pea.setAttribute('cy', f1(2 + 3 * bl * Math.cos(t * 0.17)));
    var bd = '';
    if (bl > 0.02) {
      var r0 = 22 + 6 * ((t * 0.012) % 1), r1 = r0 + 9 * bl;
      [150, 175, 200, 225, 125].forEach(function (a) {
        var v = dir(a); bd += 'M' + P2(-10 + v[0] * r0, v[1] * r0) + 'L' + P2(-10 + v[0] * r1, v[1] * r1);
      });
    }
    S.blast.setAttribute('d', bd);

    // ---------- Nate's chip (A) ----------
    var popA = chipPop(T);
    var mRaw = seg(t, 1380, 1620), mA = mRaw > 0 ? backOut(mRaw, 2) : 0;
    var tuck = eioC(seg(t, 6560, 6860));
    mA *= 1 - tuck;
    var mAc = clamp(mA);
    var ax = kf(P.axK, t), ay = kf(P.ayK, t), arot = kf(P.arK, t);
    var stuckW = seg(t, 4090, 4130) * (1 - seg(t, 5545, 5575));
    var strug = kf([[4130, 0], [4180, 1], [4480, 1], [4520, 0.45], [5040, 0.45], [5080, 0], [5320, 0], [5360, 1], [5530, 1], [5560, 0]], t) * stuckW;
    arot += 7 * Math.sin(t * 0.03) * strug;
    var walkA = (seg(t, 4480, 4520) * (1 - seg(t, 5000, 5050))) + (P.homeWalk ? seg(t, 6150, 6200) * (1 - seg(t, 6510, 6560)) : 0);
    var phA = t / 1000 * 2 * Math.PI * (t < 5200 ? 4.6 : 3.4);
    // handshake
    var hs = eoC(seg(t, 2430, 2580)) * (1 - eio(seg(t, 3000, 3130)));
    var pump = seg(t, 2590, 2640) * (1 - seg(t, 2950, 3000));
    var pumpY = 4.5 * Math.sin(2 * Math.PI * 6.5 * (t - 2590) / 1000) * pump;
    // squash/stretch & lift
    var sq = 0, lift = 0;
    lift += 12 * bump(t, 1430, 1640);
    sq += 0.1 * bump(t, 1360, 1440) + dc(t - 1640, 0.1, 4.5, 90);
    sq += 0.03 * Math.sin(2 * Math.PI * 6.5 * (t - 2590) / 1000) * pump;
    sq += dc(t - 3290, -0.08, 4, 90) + dc(t - 3560, 0.06, 4, 80);
    sq += dc(t - 4130, 0.14, 5, 90);
    sq += 0.05 * Math.sin(t * 0.045) * strug;
    sq += walkA * 0.04 * Math.abs(Math.sin(phA));
    sq += dc(t - 5050, 0.15, 5, 80);
    sq += dc(t - 5300, 0.18, 4.5, 100);
    sq += 0.15 * eio(seg(t, 5380, 5530)) * (1 - seg(t, 5545, 5565));
    sq += dc(t - 5565, -0.17, 4, 110);
    lift += 7 * bump(t, 5565, 5760);
    sq += 0.1 * bump(t, 5930, 5990) + dc(t - 6200, 0.12, 4.5, 90);
    lift += 15 * bump(t, 5990, 6200);
    lift += walkA * 2 * Math.abs(Math.sin(phA));
    lift += 8 * bump(t, 6640, 6800);
    sq += 0.08 * bump(t, 6590, 6640) + dc(t - 6800, 0.13, 4.5, 110);
    lift += 20 * bump(t, 5130, 5300) * 0.5;
    var stA = { x: ax, y: ay + pumpY * 0.25 * hs, rot: arot + walkA * 5 * Math.sin(phA), sx: popA * (1 + sq), sy: popA * (1 - sq), lift: lift, m: mA, walk: walkA, ph: phA };
    stA.bodyOp = mAc > 0.001 ? 1 : 0;
    stA.shs = popA;

    // ---------- Nick's chip (B) ----------
    var bx = kf(P.bxK, t), by = kf(P.byK, t);
    if (!L.bumpee) { bx += P.u[0] * 10 * bk; by += P.u[1] * 10 * bk; }
    var walkB = seg(t, 1600, 1650) * (1 - seg(t, 2340, 2400)) + seg(t, 6000, 6060);
    var phB = t / 1000 * 2 * Math.PI * 3.6;
    var sqB = walkB * 0.04 * Math.abs(Math.sin(phB)) + dc(t - 2400, 0.1, 4, 90);
    sqB += 0.03 * Math.sin(2 * Math.PI * 6.5 * (t - 2590) / 1000 + Math.PI) * pump;
    sqB += dc(t - 3290, -0.08, 4, 90) + dc(t - 3560, 0.06, 4, 80) + dc(t - 4110, 0.12, 5, 90);
    sqB += 0.06 * bump(t, 4180, 4330) + 0.06 * bump(t, 5640, 5790) + 0.06 * bump(t, 5800, 5950);
    if (!L.bumpee) sqB += dc(t - 5050, 0.14, 5, 80);
    var liftB = walkB * 2.4 * Math.abs(Math.sin(phB));
    var stB = { x: bx, y: by - pumpY * 0.25 * hs, rot: walkB * 6 * Math.sin(phB), sx: 1 + sqB, sy: 1 - sqB, lift: liftB, m: 1, walk: walkB, ph: phB + 1.3, bodyOp: 1 };
    stB.hide = t < 1500 || t > 6700;

    // ---------- arms ----------
    var aA = kf(AKA, t), aB = kf(AKB, t);
    var flail = 22 * Math.sin(t * 0.032) * strug;
    var aAL = aA + flail, aAR = 180 - aA + 22 * Math.sin(t * 0.032 + 1.7) * strug;
    var aBL = aB, aBR = 180 - aB;
    // Nick waves goodbye with his outside arm
    var wv = seg(t, 5990, 6080), wave = -72 + 24 * Math.sin(2 * Math.PI * 3 * (t - 6080) / 1000);
    aBR = lerp(aBR, wave, wv);
    // handshake target
    var Mx = (stA.x + stB.x) / 2, My = (stA.y + stB.y) / 2 + pumpY;
    var sA = P.sA; // +1: A uses right arm, B left arm

    // jersey attachment states
    function jAttach(st, oy, jx, jy, jr) { return charTr(st) + ' translate(0,' + f1(oy) + ') rotate(' + f1(jr) + ') scale(' + f3(jx) + ',' + f3(jy) + ')'; }
    function handFrom(a, oy, jy, side, dressed) {
      if (dressed) { var v = dir(a); return [side * 16.5 + v[0] * 17.5, -11 * jy + oy + v[1] * 17.5]; }
      var w = dir(a); return [side * 14.5 + w[0] * 19, -6 + w[1] * 19];
    }
    function localOf(st, X, Y) { // world -> char-local (ignores squash)
      var dx = X - st.x, dy = Y - (st.y - st.lift), a = -st.rot * Math.PI / 180;
      return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
    }
    function fly(p, from, to, spin) {
      var ddx = to[0] - from[0], ddy = to[1] - from[1], dl = Math.max(1, Math.hypot(ddx, ddy)), sn = Math.sin(Math.PI * p);
      var x = lerp(from[0], to[0], eio(p)) - ddy / dl * 40 * sn, y = lerp(from[1], to[1], eio(p)) + ddx / dl * 40 * sn - 10 * sn;
      var s = 1 + 0.16 * Math.sin(Math.PI * p);
      return { x: x, y: y, s: s, rot: spin * 360 * eio(p), gx: lerp(from[0], to[0], eio(p)), gy: lerp(from[1], to[1], eio(p)) + 34 };
    }
    var pullA = { oy: kf([[3240, 0], [3480, -34, eio]], t), j: 0.12 * bump(t, 3240, 3480) };
    var flyP = seg(t, 3550, 3950);
    var headA = [P.Hx, P.Hy - 34], headB = [P.N[0], P.N[1] - 34];

    // ---- J1: Nate's own shirt ----
    var j1, j1s;
    if (t < 3550) {
      j1 = { oy: pullA.oy, jx: 1 + 0.06 * pullA.j, jy: 1 - pullA.j, jr: 0, w: stA, side: 'A' };
    } else if (t < 3950) {
      var F1 = fly(flyP, headA, headB, 1);
      j1s = F1;
    } else {
      var oy1 = kf([[3950, -34], [4100, 0, eioC]], t), st1 = 0.16 * bump(t, 3950, 4100);
      j1 = { oy: oy1 + dc(t - 4100, 1.5, 5, 70), jx: 1 - st1 * 0.4, jy: 1 + st1, jr: 0, w: stB, side: 'B' };
    }
    // ---- J2: Nick's shirt ----
    var j2, j2s;
    if (t < 3550) {
      j2 = { oy: pullA.oy, jx: 1 + 0.06 * pullA.j, jy: 1 - pullA.j, jr: 0, w: stB, side: 'B' };
    } else if (t < 3950) {
      j2s = fly(flyP, headB, headA, -1);
    } else {
      var oy2 = kf([[3950, -34], [4130, -15, eoC], [5380, -15], [5530, -18.5, eio], [5575, 0, eoC]], t);
      oy2 += 2.2 * Math.sin(t * 0.05) * strug + dc(t - 5575, 2.2, 5, 80);
      var jy2 = lerp(1, 1.1 + 0.07 * Math.sin(t * 0.045), stuckW) + dc(t - 5575, 0.1, 5, 90) - 0.06 * bump(t, 3950, 4130) * 0;
      var jx2 = lerp(1, 0.95 - 0.05 * Math.sin(t * 0.045), stuckW) - dc(t - 5575, 0.06, 5, 90);
      j2 = { oy: oy2, jx: jx2, jy: jy2, jr: 8 * Math.sin(t * 0.027 + 1) * strug, w: stA, side: 'A' };
    }

    // hands for each character
    var dressedA = t < 3330 || t >= 4000, dressedB = dressedA;
    var jA = j1 && j1.side === 'A' ? j1 : (j2 && j2.side === 'A' ? j2 : null);
    var jB = j1 && j1.side === 'B' ? j1 : (j2 && j2.side === 'B' ? j2 : null);
    function handsFor(st, aL, aR, jj, dressed, shakeSide, ownSide) {
      var oy = jj ? jj.oy : 0, jy = jj ? jj.jy : 1;
      var hL = handFrom(aL, oy, jy, -1, dressed && jj), hR = handFrom(aR, oy, jy, 1, dressed && jj);
      var ang = [aL, aR];
      if (hs > 0) {
        var loc = localOf(st, Mx, My), idx = shakeSide > 0 ? 1 : 0;
        var hh = idx ? hR : hL;
        hh = [lerp(hh[0], loc[0], hs), lerp(hh[1], loc[1], hs)];
        var piv = [(idx ? 1 : -1) * 16.5, -11];
        var a2 = Math.atan2(hh[1] - piv[1], hh[0] - piv[0]) * 180 / Math.PI;
        if (!idx && a2 < 0) a2 += 360;
        ang[idx] = lerp(ang[idx], a2, hs);
        if (idx) hR = hh; else hL = hh;
      }
      return { hands: [hL, hR], ang: ang };
    }
    var HA = handsFor(stA, aAL, aAR, jA, dressedA, sA);
    var HB = handsFor(stB, aBL, aBR, jB, dressedB, -sA);
    stA.hands = HA.hands; stB.hands = HB.hands;
    renderChar(S.A, stA); renderChar(S.Bc, stB);
    // hands in flight (throw) ride the shirt: hide when bare + arms up? keep simple.

    function jRender(J, jj, fs, label) {
      if (jj && J.g.parentNode !== S.jLayer) S.jLayer.insertBefore(J.g, S.A.handsG);
      if (!jj && J.g.parentNode !== S.flyLayer) S.flyLayer.appendChild(J.g);
      if (jj) {
        var who = jj.side === 'A' ? HA : HB, st = jj.w;
        var isA = jj.side === 'A';
        var m = isA ? mA : 1, mc = isA ? mAc : 1;
        renderJersey(J, { tr: jAttach(st, jj.oy, jj.jx, jj.jy, jj.jr), aL: who.ang[0], aR: who.ang[1], sleeve: m, collar: mc, pinch: isA && J === S.J2 ? stuckW : 0, push: 0.5 + 0.5 * Math.sin(t * 0.045 + 1.2), chip: 1 - mc });
        J.g.setAttribute('opacity', st.hide ? 0 : 1);
      } else {
        var fl = Math.sin(t * 0.04) * 26;
        renderJersey(J, { tr: 'translate(' + P2(fs.x, fs.y) + ') rotate(' + f1(fs.rot) + ') scale(' + f3(fs.s) + ')', aL: UP_L - 20 + fl, aR: 180 - UP_L + 20 - fl, sleeve: 1, collar: 1, pinch: 0, chip: 0 });
        J.g.setAttribute('opacity', 1);
      }
    }
    jRender(S.J1, j1, j1s); jRender(S.J2, j2, j2s);
    [j1s, j2s].forEach(function (fs, i) {
      var e = S.fsh[i];
      if (!fs) { e.setAttribute('opacity', 0); return; }
      e.setAttribute('cx', f1(fs.gx + 2)); e.setAttribute('cy', f1(fs.gy + 4));
      e.setAttribute('rx', f1(20 / fs.s)); e.setAttribute('opacity', f3(0.16 * bump(flyP, 0, 1) + 0.04));
    });

    // ---------- eyes ----------
    function lookAt(st, X, Y, k) { var l = localOf(st, X, Y), d = Math.max(1, Math.hypot(l[0], l[1] + 4)); return [l[0] / d * k, (l[1] + 4) / d * k]; }
    // A
    var passA = seg(t, 3290, 3320) * (1 - seg(t, 3450, 3480));
    var lkA = [0, 0], dyA = 0;
    if (t >= 1720 && t < 3150) lkA = lookAt(stA, stB.x, stB.y, 1.6);
    else if (t >= 3150 && t < 3540) lkA = [0, -1.6];
    else if (t >= 3540 && t < 4000 && j2s) lkA = lookAt(stA, j2s.x, j2s.y, 1.6);
    else if (t >= 3540 && t < 4000) lkA = [0, -1.6];
    else if (t >= 5700 && t < 5960) { lkA = [0, 1.7]; dyA = 1.5 * eio(seg(t, 5700, 5780)); }
    else if (t >= 6260 && t < 6560) lkA = lookAt(stA, P.Hx, P.Hy + 30, 1.2);
    var openA = blink(t, [1760, 2380, 6380]) * (1 - eio(seg(t, 6600, 6720)));
    var wideA = 1 + 0.32 * seg(t, 5565, 5600) * (1 - seg(t, 5680, 5760)) + 0.1 * bump(t, 1450, 1700);
    var happyA = seg(t, 5950, 5990) * (1 - seg(t, 6220, 6270));
    renderEyes(S.EA, { tr: charTr(stA), op: mAc * (1 - passA) * (1 - seg(t, 3955, 3985) * (1 - seg(t, 5545, 5575))) * (1 - seg(t, 6680, 6760)), open: openA, wide: wideA, happy: happyA, lx: lkA[0], ly: lkA[1], dy: dyA }, 6.5, -4);
    // B
    var passB = passA + seg(t, 3955, 3985) * (1 - seg(t, 4085, 4110));
    var lkB = [-1.6, 0];
    if (t >= 2200 && t < 3150) lkB = lookAt(stB, stA.x, stA.y, 1.6);
    else if (t >= 3150 && t < 3540) lkB = [0, -1.6];
    else if (t >= 3540 && t < 4000 && j1s) lkB = lookAt(stB, j1s.x, j1s.y, 1.6);
    else if (t >= 4300 && t < 6000) lkB = lookAt(stB, stA.x, stA.y, 1.6);
    else if (t >= 6000) lkB = [1.6, 0];
    var openB = blink(t, [2050, 4560, 5050, 5100]);
    var happyB = seg(t, 4160, 4200) * (1 - seg(t, 4300, 4340)) + seg(t, 5640, 5680) * (1 - seg(t, 5900, 5940));
    renderEyes(S.EB, { tr: charTr(stB), op: (stB.hide ? 0 : 1) * (1 - passB), open: openB, wide: 1, happy: happyB, lx: lkB[0], ly: lkB[1] }, 6.5, -4);

    // ---------- effects ----------
    var td = '';
    // handshake ticks
    if (pump > 0) {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
        var k = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.04));
        td += 'M' + P2(Mx + q[0] * 7, My + q[1] * 9) + 'L' + P2(Mx + q[0] * (7 + 5 * k), My + q[1] * (9 + 5 * k));
      });
    }
    // struggle lines around the stuck shirt
    if (strug > 0.05) {
      var ph2 = Math.floor(t / 90) % 2;
      [-1, 1].forEach(function (s) {
        var x0 = stA.x + s * (36 + 3 * ph2), y0 = stA.y - stA.lift - 26;
        td += 'M' + P2(x0, y0 - 7) + 'Q' + P2(x0 + s * 5, y0) + ' ' + P2(x0, y0 + 7);
        td += 'M' + P2(x0 + s * 6, y0 - 4) + 'Q' + P2(x0 + s * 9, y0) + ' ' + P2(x0 + s * 6, y0 + 4);
      });
    }
    // bonk
    var bp = seg(t, 5050, 5300);
    if (bp > 0 && bp < 1) {
      var qx = P.C[0] + P.u[0] * 22, qy = P.C[1] + P.u[1] * 22, ra = 8 + 14 * eoC(bp), rb = ra + 9 * (1 - bp);
      var ba = Math.atan2(P.u[1], P.u[0]) * 180 / Math.PI;
      [-90, -50, -15, 15, 50, 90].forEach(function (a) { var v = dir(ba + 180 + a); td += 'M' + P2(qx - v[0] * -ra, qy - v[1] * -ra) + 'L' + P2(qx + v[0] * rb, qy + v[1] * rb); });
    }
    // pop-through
    var pp = seg(t, 5575, 5860);
    if (pp > 0 && pp < 1) {
      var R0 = 30 + 14 * eoC(pp), R1 = R0 + 9 * (1 - pp), cxp = stA.x, cyp = stA.y - stA.lift - 6;
      [-160, -125, -90, -55, -20, 20, 160].forEach(function (a) { var v = dir(a); td += 'M' + P2(cxp + v[0] * R0, cyp + v[1] * R0) + 'L' + P2(cxp + v[0] * R1, cyp + v[1] * R1); });
    }
    S.ticks.setAttribute('d', td);
    var pr = seg(t, 5575, 5980);
    S.pring.setAttribute('cx', f1(stA.x)); S.pring.setAttribute('cy', f1(stA.y - stA.lift));
    S.pring.setAttribute('r', f1(CR + 30 * eoC(pr)));
    S.pring.setAttribute('opacity', pr > 0 && pr < 1 ? f1((1 - pr) * 90) / 100 : 0);
    S.pring.setAttribute('stroke-width', f1(5 * (1 - pr) + 0.8));
    // set-down ring + dust
    var rp = seg(t, 6800, 7300);
    S.ripple.setAttribute('cx', P.Hx); S.ripple.setAttribute('cy', P.Hy);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 6800, 7080);
    if (dp > 0 && dp < 1) {
      var dd = '', r0d = 27 + 9 * eoC(dp), r1d = r0d + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + P2(P.Hx + Math.cos(a) * r0d, P.Hy + Math.sin(a) * r0d) + 'L' + P2(P.Hx + Math.cos(a) * r1d, P.Hy + Math.sin(a) * r1d);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7500, 7950);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2jerseyswap;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2jerseyswap = S;
    return S;
  }

  window.CCSteal2_jerseyswap = {
    title: 'The Jersey Swap',
    blurb: 'At the final whistle Nate’s chip swaps shirts with Nick’s, gets the jersey stuck over its head, bonks a neighbour, and finally pops through wearing Nick’s colours.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2jerseyswap = S;
      var token = {};
      root.__cc2jerseyswapToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2jerseyswapToken !== token) { resolve(); return; }
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
