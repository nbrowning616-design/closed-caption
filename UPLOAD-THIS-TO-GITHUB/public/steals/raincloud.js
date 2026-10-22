/* Closed Caption steal film: raincloud (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE LITTLE CLOUD (raincloud)
 *
 * Everyone knows the personal raincloud: you can't outrun it, and whatever it rains on gets soaked.
 * This one is a small, grumpy cloud in the dealer's colour, and its rain is dye.
 * Top-down felt table (cloud hovers in a slight 3/4 cheat, its shadow falls on the chip).
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  550-1250  A small grumpy cloud in Nick's colour drifts in from the edge on a lazy arc,
 *            bobbing, and parks right over Nate's chip (overshoot, squash). Its shadow covers
 *            the chip. Camera eases in a touch (whole rows stay in frame); other chips dim.
 * 1300-1700  Nate's chip opens a little face, looks up... the cloud glares down. GULP.
 * 1700-1960  Scoot #1: the chip zips sideways (anticipation, lean, speed lines, dust).
 * 1960-2200  Relief: happy eyes, grin. The cloud stares at the empty spot. Beat.
 * 2050-2460  The cloud's pupils slide over (one brow up), then it drifts over, unhurried.
 * 2460-2830  The chip's grin drops, eyes pop. Scoot #2: a bigger dash the OTHER way.
 * 2760-2900  The cloud is already there (zips, snaps in with overshoot).
 * 2950-3300  Feints: chip leans one way, the cloud leans with it; the other way, same.
 * 3350-3800  Chip deflates (half-lidded), and trudges back to exactly its original spot,
 *            the cloud gliding along above it, smirking.
 * 3800-3950  The cloud inhales, puffs up...
 * 3950-5000  RAIN: Nick-coloured drops, splashes, a growing puddle. Chip squeezes its eyes shut.
 *            Each drop that lands leaves a dye splotch; they spread and merge until the chip is
 *            Nick's colour, "Na" -> "Ni". The cloud shrinks as it empties.
 * 4950-5200  Last drops. The chip opens its eyes and looks down at itself (beat). Looks up, flat.
 * 5200-5650  The cloud wrings itself out (twist, squeeze, strain)... one last fat drip... plip.
 * 5700-5900  Satisfied puff (swells, eyes closed, smile, little exhale).
 * 5900-6450  It floats off, glancing back.
 * 6150-6700  The chip shakes itself off like a wet dog (dye droplets fling out).
 * 6700-6850  Face blinks away: a plain Nick-coloured chip with Nick's initial.
 * 6850-7100  Set-down: settle squash, ring pulse; the puddle dries. Camera eases back.
 * 7100-7350  Stillness.
 * 7350-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var PARK = -76; // cloud height above the chip (screen cheat)
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
  function bo12(t) { return backOut(t, 1.2); }
  function bo2(t) { return backOut(t, 2.0); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f3(v) { return Math.round(v * 1000) / 1000; }
  function sgn(v) { return v < 0 ? -1 : 1; }
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
  // step function: value of last key <= t
  function st(keys, t) { var v = keys[0][1]; for (var i = 0; i < keys.length; i++) if (t >= keys[i][0]) v = keys[i][1]; return v; }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

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
    // scoot plan: first a short hop to the tighter side, then a bigger dash the other way
    var row = rows[target.row], leftLim = 70 + 18.5 + CR + 8, rightLim = W - 30 - CR - 20, lChip = false, rChip = false;
    row.chips.forEach(function (c) {
      if (c === target) return;
      if (c.x < target.x) { if (c.x + 2 * CR + 2 > leftLim) { leftLim = c.x + 2 * CR + 2; lChip = true; } }
      else if (c.x - 2 * CR - 2 < rightLim) { rightLim = c.x - 2 * CR - 2; rChip = true; }
    });
    // a neighbouring chip can be bumped a little; the badge and the card edge can't
    var roomL = Math.min(58, Math.max(target.x - leftLim, lChip ? 30 : 0)), roomR = Math.min(58, Math.max(rightLim - target.x, rChip ? 30 : 0));
    roomL = Math.max(roomL, 18); roomR = Math.max(roomR, 18);
    var A, B;
    if (roomL <= roomR) { A = -roomL; B = rChip ? Math.min(58, Math.max(roomR, roomL + 8)) : roomR; }
    else { A = roomR; B = -(lChip ? Math.min(58, Math.max(roomL, roomR + 8)) : roomL); }
    // cloud enters from the side with more open felt above, exits the other way
    var enterSide = target.x > W / 2 ? -1 : 1;
    return { rows: rows, target: target, others: others, h: h, ini: ini, A: A, B: B, enterSide: enterSide };
  }

  // ---------- choreography: chip ----------
  function chipDX(L, t) {
    var A = L.A, B = L.B, sA = sgn(A), sB = sgn(B);
    return kf([[0, 0], [1700, 0], [1760, -sA * 3.5], [1885, A * 1.08, eoC], [1975, A], [2560, A], [2610, -sB * 3.5 + A], [2745, B * 1.06, eoC], [2830, B],
      [2950, B], [3010, B + sA * 5], [3100, B], [3150, B], [3210, B + sB * 5], [3300, B], [3560, B], [3820, 0, eS]], t);
  }
  function chipLean(L, t) { // skew degrees (lean into motion)
    var sA = sgn(L.A), sB = sgn(L.B);
    var l = 0;
    l += -sA * 8 * Math.sin(Math.PI * seg(t, 1700, 1760));
    l += sA * 16 * Math.sin(Math.PI * seg(t, 1760, 1885)) - sA * spring(t - 1885, 9, 5, 70);
    l += -sB * 8 * Math.sin(Math.PI * seg(t, 2560, 2610));
    l += sB * 18 * Math.sin(Math.PI * seg(t, 2610, 2745)) - sB * spring(t - 2745, 10, 5, 70);
    l += sA * 7 * Math.sin(Math.PI * seg(t, 2950, 3100)) + sB * 7 * Math.sin(Math.PI * seg(t, 3150, 3300));
    l += -sB * 4 * Math.sin(Math.PI * 3 * seg(t, 3560, 3820)); // trudging waddle
    return l;
  }
  function chipShake(t) { // wet-dog rotation (deg)
    if (t < 6150 || t > 6760) return 0;
    var d = t - 6150, env = seg(t, 6150, 6200) * Math.exp(-Math.max(0, d - 220) / 140);
    return 34 * env * Math.sin(2 * Math.PI * 8 * d / 1000);
  }
  function chipScale(t) { // [sx, sy]
    var s = 1, sy = 1;
    s -= 0.1 * Math.sin(Math.PI * seg(t, 1550, 1700));                  // gulp
    s -= 0.03 * Math.sin(Math.PI * seg(t, 3350, 3560));                  // sigh
    s -= 0.04 * Math.abs(Math.sin(Math.PI * 3 * seg(t, 3560, 3820)));  // trudge steps
    s -= 0.06 * eio(seg(t, 3950, 4100)) * (1 - eio(seg(t, 4900, 5050)));  // hunched in the rain
    s += spring(t - 5650, -0.09, 5, 90);                                // plip
    s += spring(t - 6880, -0.09, 4.5, 110);                             // set-down settle
    var sx = s, syy = s;
    var sq = Math.sin(Math.PI * seg(t, 1885, 1975)) * 0.07 + Math.sin(Math.PI * seg(t, 2745, 2830)) * 0.08;
    return [sx * (1 + sq), syy * (1 - sq)];
  }
  function faceVis(t) {
    if (t < 1300) return 0;
    if (t < 6700) return backOut(seg(t, 1300, 1430), 2.2);
    return 1 - eio(seg(t, 6700, 6850));
  }

  // ---------- choreography: cloud ----------
  function cloudX(L, t) { // relative to target x
    var A = L.A, B = L.B, sA = sgn(A), sB = sgn(L.B), es = L.enterSide;
    var T = L.target, enterX = es > 0 ? W + 80 - T.x : -80 - T.x, exitX = es > 0 ? -95 - T.x : W + 95 - T.x;
    return kf([[0, enterX], [550, enterX], [1260, 0, bo12], [2200, 0], [2470, A, eioC], [2760, A], [2900, B, bo2],
      [2950, B], [3010, B + sA * 7], [3100, B], [3150, B], [3210, B + sB * 7], [3300, B], [3560, B], [3820, 0, eS],
      [5900, 0], [6480, exitX, function (p) { return ei(p) * 0.6 + p * 0.4; }]], t);
  }
  function cloudY(L, t) {
    var y = kf([[0, -250], [550, -250], [1260, PARK, eoC], [5900, PARK], [6480, -200, ei]], t);
    y += 2.4 * Math.sin(2 * Math.PI * 0.8 * t / 1000);
    y -= 5 * eio(seg(t, 3800, 3950)) * (1 - eio(seg(t, 3950, 4150)));
    y -= 6 * Math.sin(Math.PI * seg(t, 5700, 5950));
    return y;
  }
  function cloudBase(t) { // overall size (empties as it rains)
    var s = 1 + 0.13 * eio(seg(t, 3800, 3950)) * (1 - eo(seg(t, 3950, 4150)));
    s -= 0.15 * eio(seg(t, 3950, 5000)) * (1 - eo(seg(t, 5700, 5850)));
    s += 0.16 * Math.sin(Math.PI * seg(t, 5700, 5950)) + spring(t - 5950, 0.04, 3, 120);
    s += spring(t - 1260, 0.05, 3.5, 120) + spring(t - 2900, 0.05, 4, 100);
    return s;
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-raincloud-' + (++uid) + '-';
    var L = layout(opts), T = L.target, DC = opts.dealerColor || '#E8559E', VC = T.color || opts.victimColor;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var splC = el('clipPath', { id: id + 'spl', clipPathUnits: 'userSpaceOnUse' }, defs);
    var splP = el('path', { d: '' }, splC);
    function eyeClip(name, cx, cy, rx, ry) {
      var c = el('clipPath', { id: id + name, clipPathUnits: 'userSpaceOnUse' }, defs);
      el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry }, c);
      return 'url(#' + id + name + ')';
    }

    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = el('g', {}, svg);
    var tableG = el('g', {}, cam);
    el('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    el('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    el('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    function makeChip(parent, color, txt) {
      var g = el('g', {}, parent);
      el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
      el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
      el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
      var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
      tx.textContent = txt;
      return { g: g, tx: tx };
    }

    var rowsG = [], chipsG = [], V = {};
    var cardLayer = el('g', {}, cam);
    var puddleLayer = el('g', {}, cam);
    var chipLayer = el('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = el('g', {}, cardLayer);
      el('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      el('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      el('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = el('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
      r.chips.forEach(function (c) {
        var wrap = el('g', {}, chipLayer);
        var sh = el('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        if (c.target) {
          var tg = el('g', {}, wrap);
          var c1 = makeChip(tg, VC, c.ini);
          var sg = el('g', { 'clip-path': 'url(#' + id + 'spl)' }, tg);
          var c2 = makeChip(sg, DC, L.ini(opts.dealer));
          var wet = el('g', { opacity: 0 }, tg);
          [[9, -12, 1.8], [12.5, -6.5, 1.2], [-13, 6, 1.5], [-5, 15, 1.1]].forEach(function (d) { el('circle', { cx: d[0], cy: d[1], r: d[2], fill: '#FFFFFF', 'fill-opacity': 0.75 }, wet); });
          // face
          var face = el('g', {}, tg);
          var eyes = [-1, 1].map(function (s, k) {
            var ex = s * 7, ey = -7.2, rx = 4.5, ry = 5.1;
            var open = el('g', {}, face);
            var cl = el('g', { 'clip-path': eyeClip('ce' + k, ex, ey, rx, ry) }, open);
            el('ellipse', { cx: ex, cy: ey, rx: rx, ry: ry, fill: '#FFFFFF' }, cl);
            var pup = el('circle', { r: 2.5, fill: INK }, cl);
            var lid = el('path', { fill: VC }, cl);
            var lidE = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, cl);
            el('ellipse', { cx: ex, cy: ey, rx: rx, ry: ry, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, open);
            var glyph = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, face);
            var brow = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, face);
            return { s: s, ex: ex, ey: ey, rx: rx, ry: ry, open: open, pup: pup, lid: lid, lidE: lidE, glyph: glyph, brow: brow };
          });
          var mouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, face);
          V = { wrap: wrap, sh: sh, tg: tg, txs: [c1.tx, c2.tx], wet: wet, face: face, eyes: eyes, mouth: mouth, c: c };
        } else {
          var cg = makeChip(wrap, c.color, c.ini).g;
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });
    // puddle (under target chip)
    var puddle = el('path', { fill: DC, 'fill-opacity': 0.5, stroke: DC, 'stroke-width': 2, 'stroke-opacity': 0.9 }, puddleLayer);
    var puddleHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, puddleLayer);
    chipLayer.insertBefore(puddleLayer, V.wrap); // puddle sits just under the victim chip
    // fx above chips
    var fxLayer = el('g', {}, cam);
    var speed = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, fxLayer);
    var dust = el('path', { fill: 'none', stroke: INK, 'stroke-opacity': 0.55, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, fxLayer);
    var ripple = el('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, fxLayer);
    var cshadow = el('ellipse', { fill: INK, opacity: 0 }, fxLayer);

    // rain: deterministic drops
    var R = rng(7919), drops = [], splots = [];
    var N = 56;
    for (var i = 0; i < N; i++) {
      var p = i / (N - 1);
      var t0 = 3950 + 1000 * (0.82 * p + 0.18 * p * p) + (R() - 0.5) * 30;
      var u = (R() - 0.5) * 50, v = (R() - 0.5) * 34 + 2;
      if (i % 3 === 0) { u *= 0.55; v *= 0.55; }
      var d = { t0: t0, u: u, v: v, dur: 210 + R() * 40, ly: v };
      d.lx = u * 0.9;
      d.on = (d.lx * d.lx + d.ly * d.ly) < 19 * 19;
      if (d.on) splots.push({ x: d.lx, y: d.ly, r: 4.5 + R() * 3.5, t: t0 + d.dur });
      drops.push(d);
    }
    // the final fat drip from the wring
    var dripT = { t0: 5540, dur: 120 };
    var rainLayer = el('g', {}, cam);
    drops.forEach(function (d) {
      d.path = el('path', { fill: DC, stroke: INK, 'stroke-width': 1.3, 'stroke-linejoin': 'round', display: 'none' }, rainLayer);
      d.spl = el('g', { display: 'none' }, rainLayer);
      d.ring = el('ellipse', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.75, 'stroke-width': 1.2 }, d.spl);
      d.b1 = el('circle', { r: 1.9, fill: DC, stroke: INK, 'stroke-width': 1 }, d.spl);
      d.b2 = el('circle', { r: 1.6, fill: DC, stroke: INK, 'stroke-width': 1 }, d.spl);
    });
    var drip = el('path', { fill: DC, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round', display: 'none' }, rainLayer);
    var dripSpl = el('g', { display: 'none' }, rainLayer);
    var dripRing = el('ellipse', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.8 }, dripSpl);
    // shake-off droplets
    var flings = [];
    var R2 = rng(4242);
    for (i = 0; i < 16; i++) {
      var a = (i / 16) * Math.PI * 2 + (R2() - 0.5) * 0.3;
      flings.push({ a: a, t0: 6190 + R2() * 380, d: 22 + R2() * 26, r: 1.8 + R2() * 1.6, p: el('circle', { fill: DC, stroke: INK, 'stroke-width': 1, display: 'none' }, rainLayer) });
    }

    // ---------- the cloud ----------
    var cloudG = el('g', {}, cam);
    var cloudT = el('g', {}, cloudG);
    var PUFFS = [[-27, 7, 14], [-13, -6, 17.5], [6, -11, 19], [24, -1, 15.5], [33, 10, 10.5], [-34, 12, 10], [0, 7, 19]];
    function puffShapes(parent, attrs) {
      PUFFS.forEach(function (p) { el('circle', Object.assign({ cx: p[0], cy: p[1], r: p[2] }, attrs), parent); });
      el('rect', Object.assign({ x: -40, y: 4, width: 80, height: 18, rx: 9 }, attrs), parent);
    }
    puffShapes(cloudT, { fill: INK, stroke: INK, 'stroke-width': 5.2 });
    puffShapes(cloudT, { fill: DC });
    // soft highlight on the top puffs + belly shade line
    el('path', { d: 'M-24 -10 A17 17 0 0 1 -6 -21 M2 -25 A19 19 0 0 1 18 -24', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, cloudT);
    el('path', { d: 'M-31 17 Q0 21 33 17', fill: 'none', stroke: INK, 'stroke-opacity': 0.14, 'stroke-width': 3, 'stroke-linecap': 'round' }, cloudT);
    var twist = el('path', { d: 'M-16 -14 Q-6 4 -14 20 M2 -18 Q12 2 4 21 M18 -10 Q26 6 20 19', fill: 'none', stroke: INK, 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cloudT);
    var cFace = el('g', {}, cloudT);
    var cEyes = [-1, 1].map(function (s, k) {
      var ex = s * 10, ey = 3, rx = 5.4, ry = 6;
      var open = el('g', {}, cFace);
      var cl = el('g', { 'clip-path': eyeClip('de' + k, ex, ey, rx, ry) }, open);
      el('ellipse', { cx: ex, cy: ey, rx: rx, ry: ry, fill: '#FFFFFF' }, cl);
      var pup = el('circle', { r: 2.7, fill: INK }, cl);
      var lid = el('path', { fill: DC }, cl);
      var lidE = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, cl);
      el('ellipse', { cx: ex, cy: ey, rx: rx, ry: ry, fill: 'none', stroke: INK, 'stroke-width': 1.8 }, open);
      var glyph = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, cFace);
      var brow = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, cFace);
      return { s: s, ex: ex, ey: ey, rx: rx, ry: ry, open: open, pup: pup, lid: lid, lidE: lidE, glyph: glyph, brow: brow };
    });
    var cMouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, cFace);
    // exhale puffs
    var exh = [0, 1, 2].map(function () { return el('circle', { fill: DC, stroke: INK, 'stroke-width': 1.5, opacity: 0 }, cloudG); });

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, DC: DC, VC: VC, splP: splP, splots: splots,
      puddle: puddle, puddleHi: puddleHi, speed: speed, dust: dust, ripple: ripple, cshadow: cshadow, drops: drops, drip: drip, dripSpl: dripSpl, dripRing: dripRing,
      flings: flings, cloudG: cloudG, cloudT: cloudT, twist: twist, cEyes: cEyes, cMouth: cMouth, exh: exh, line: line
    };
  }

  // ---------- face drawing (shared by chip and cloud) ----------
  // e: eye; lid 0 open..1 closed; slant >0 = grumpy (inner side lower); look [x,y]; glyph: 0 none, 1 happy ^, 2 squeeze, 3 closed line
  function drawEye(e, lid, slant, look, glyph, wide, browY, browTilt) {
    var ex = e.ex, ey = e.ey, rx = e.rx * wide, ry = e.ry * wide, s = e.s;
    if (glyph) {
      e.open.setAttribute('display', 'none');
      var d;
      if (glyph === 1) d = 'M' + f1(ex - rx) + ' ' + f1(ey + 1.2) + 'Q' + f1(ex) + ' ' + f1(ey - ry * 1.3) + ' ' + f1(ex + rx) + ' ' + f1(ey + 1.2);
      else if (glyph === 2) d = 'M' + f1(ex - s * rx) + ' ' + f1(ey - ry * 0.75) + 'L' + f1(ex + s * rx * 0.7) + ' ' + f1(ey) + 'L' + f1(ex - s * rx) + ' ' + f1(ey + ry * 0.75);
      else d = 'M' + f1(ex - rx) + ' ' + f1(ey) + 'Q' + f1(ex) + ' ' + f1(ey + ry * 0.55) + ' ' + f1(ex + rx) + ' ' + f1(ey);
      e.glyph.setAttribute('d', d);
    } else {
      e.open.setAttribute('display', '');
      e.open.setAttribute('transform', wide !== 1 ? 'translate(' + f1(ex) + ',' + f1(ey) + ') scale(' + f3(wide) + ') translate(' + f1(-ex) + ',' + f1(-ey) + ')' : '');
      e.glyph.setAttribute('d', '');
      var m = Math.hypot(look[0], look[1]), lx = look[0], ly = look[1];
      if (m > 1) { lx /= m; ly /= m; }
      e.pup.setAttribute('cx', f1(ex + lx * e.rx * 0.45)); e.pup.setAttribute('cy', f1(ey + ly * e.ry * 0.42));
      var ER = e.rx, ERy = e.ry;
      var yl = ey - ERy + 2 * ERy * clamp(lid, 0, 1);
      var yIn = yl + slant * ERy * 0.6, yOut = yl - slant * ERy * 0.3;
      var xa = ex - ER - 2, xb = ex + ER + 2;
      var ya = s < 0 ? yOut : yIn, yb = s < 0 ? yIn : yOut;   // left eye (s<0): inner side is +x
      if (lid <= 0.01 && slant <= 0.01) { e.lid.setAttribute('d', ''); e.lidE.setAttribute('d', ''); }
      else {
        e.lid.setAttribute('d', 'M' + f1(xa) + ' ' + f1(ey - ERy - 3) + 'L' + f1(xb) + ' ' + f1(ey - ERy - 3) + 'L' + f1(xb) + ' ' + f1(yb) + 'L' + f1(xa) + ' ' + f1(ya) + 'Z');
        e.lidE.setAttribute('d', 'M' + f1(xa) + ' ' + f1(ya) + 'L' + f1(xb) + ' ' + f1(yb));
      }
    }
    if (browY === null) { e.brow.setAttribute('d', ''); return; }
    // brow: inner end lowered by browTilt
    var bw = e.rx * 1.05, by = ey - e.ry * wide - 2.2 + browY;
    var xi = ex - s * bw, xo = ex + s * bw;
    e.brow.setAttribute('d', 'M' + f1(xo) + ' ' + f1(by - browTilt * 0.4) + 'L' + f1(xi) + ' ' + f1(by + browTilt));
  }
  // mouth: width w, curve c (>0 smile), open o (gulp ring radius), smirk sk (raises one corner)
  function mouthD(cx, cy, w, c, o, sk) {
    if (o > 0.3) return circleD(cx, cy, o);
    return 'M' + f1(cx - w) + ' ' + f1(cy - sk) + 'Q' + f1(cx) + ' ' + f1(cy + c * 2) + ' ' + f1(cx + w) + ' ' + f1(cy + sk * 0.3 - (sk > 0 ? sk : 0));
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = L.target, A = L.A, B = L.B, sA = sgn(A), sB = sgn(B);

    // camera: gentle push-in, horizontally centred so whole rows stay in frame
    var zk = eioC(seg(t, 600, 1300)) * (1 - eioC(seg(t, 6400, 7100)));
    var Z = lerp(1, 1.14, zk);
    var ccy = clamp(lerp(H / 2, T.y - 32, zk), H / (2 * Z), H - H / (2 * Z));
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1150, 1400)) * (1 - eio(seg(t, 6650, 7050)));
    var dx = chipDX(L, t), chx = T.x + dx;
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c), nx = 0;
      if (o.c.row === T.row) { // neighbours get nudged if the chip bumps them
        var gap = o.c.x - chx, ov = 2 * CR + 1 - Math.abs(gap);
        if (ov > 0) nx = sgn(gap) * ov * 1.1;
      }
      o.g.setAttribute('transform', 'translate(' + f1(o.c.x + nx) + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('cx', f1(o.c.x + nx + 1.5));
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ---- victim chip ----
    var V = S.V, pop = chipPop(T), scl = chipScale(t), lean = chipLean(L, t), rot = chipShake(t);
    var dy = -1.8 * Math.abs(Math.sin(Math.PI * 3 * seg(t, 3560, 3820)));
    var jig = rot ? 1.6 * Math.sin(t * 0.09) : 0;
    V.tg.setAttribute('transform', 'translate(' + f1(chx + jig) + ',' + f1(T.y + dy) + ') rotate(' + f1(rot) + ') skewX(' + f1(-lean) + ') scale(' + f3(pop * scl[0]) + ',' + f3(pop * scl[1]) + ')');
    V.sh.setAttribute('cx', f1(chx + 1.5)); V.sh.setAttribute('cy', f1(T.y + 3.5));
    V.sh.setAttribute('r', f1(CR * pop * Math.min(1, scl[0])));

    // face
    var fv = faceVis(t);
    V.txs.forEach(function (tx) { tx.setAttribute('transform', 'translate(0,' + f1(8 * clamp(fv)) + ') scale(' + f3(1 - 0.3 * clamp(fv)) + ')'); });
    if (fv <= 0.001) V.face.setAttribute('display', 'none');
    else { V.face.setAttribute('display', ''); V.face.setAttribute('transform', 'scale(' + f3(fv) + ')'); }
    if (fv > 0.001) {
      // look direction
      var lookX = kf([[0, 0], [1380, 0], [1700, 0], [1760, sA, eoC], [1960, sA], [2000, 0], [2440, 0], [2470, 0], [2600, sB, eoC], [2840, -sB * 0.6], [2950, -sB * 0.6], [3000, sA * 0.6], [3100, sA * 0.6], [3150, sB * 0.4], [3300, sB * 0.4], [3360, 0],
        [5050, 0], [5900, 0], [6100, L.enterSide * -0.9], [6150, 0]], t);
      var lookY = kf([[0, 0], [1380, -1, eoC], [1700, -1], [1760, 0], [1960, 0], [2440, 0], [2470, -1, eoC], [2560, -1], [2600, 0], [2840, -0.8], [3360, 0.3], [3800, 0.6], [3850, -1], [3950, -1],
        [4900, 0.9], [5050, 0.9], [5150, -1], [5600, -1], [5640, 1, eoC], [5760, 1], [5850, -0.8], [6150, -0.6]], t);
      var lid = kf([[0, 0], [1700, 0], [1740, 0.3], [1960, 0.3], [2440, 0.1], [2470, 0], [2560, 0], [2600, 0.3], [2830, 0.3], [2860, 0], [3350, 0], [3480, 0.55], [3850, 0.55], [3880, 0.15],
        [4900, 1], [5000, 0.5], [5150, 0.45], [5600, 0.5]], t);
      var wide = 1 + 0.28 * Math.sin(Math.PI * seg(t, 1450, 1700)) + 0.3 * eoC(seg(t, 2440, 2490)) * (1 - seg(t, 2560, 2610)) + 0.2 * eoC(seg(t, 3850, 3880)) * (1 - seg(t, 3940, 3960));
      var glyph = st([[0, 0], [1960, 1], [2440, 0], [3955, 2], [4900, 0], [5640, 3], [5720, 0], [6140, 2], [6660, 0], [6720, 3]], t);
      var browT = kf([[0, 0], [1700, 0], [1740, 1.6], [1960, 1.6], [2000, -0.5], [2440, -0.5], [2470, -2], [2560, -2], [2600, 1.8], [2850, 1.8], [2900, -1.5], [3350, -1.5], [3480, -2.2], [3850, -2.2], [3880, -2.8], [3960, 1.5],
        [4900, 1.5], [5000, 0], [5150, 1.2], [6100, 1.2], [6150, 1.5], [6660, 1.5], [6700, 0]], t);
      var browY = kf([[0, 0], [2440, 0], [2470, -1.5], [2560, -1.5], [2600, 0], [5000, 0], [5050, -1], [5150, 0.6]], t);
      V.eyes.forEach(function (e) {
        e.lid.setAttribute('fill', t > 4500 ? S.DC : S.VC);
        drawEye(e, lid, 0, [lookX, lookY], glyph, wide, browY, browT);
      });
      var mo = 2.4 * Math.sin(Math.PI * seg(t, 1500, 1720)) + 2.2 * Math.sin(Math.PI * seg(t, 2450, 2600)) + 1.8 * Math.sin(Math.PI * seg(t, 3850, 3950));
      var mc = kf([[0, 0], [1720, 0], [1760, -0.3], [1960, -0.3], [2000, 1.6], [2430, 1.6], [2460, 0], [3350, 0], [3480, -1.3], [3850, -1.3], [3950, -0.8], [4900, -0.8], [5000, -0.2], [5150, -0.6], [6140, -0.6], [6660, 0.8]], t);
      var mw = kf([[0, 3], [1960, 3], [2000, 4.5], [2430, 4.5], [2460, 3], [3950, 3], [4000, 4.2], [4900, 4.2], [4950, 2.8]], t);
      var wob = t > 3960 && t < 4900 ? 0.6 * Math.sin(t * 0.08) : 0;
      V.mouth.setAttribute('d', t < 3960 ? mouthD(0, 16 + wob, mw, mc, mo, 0) : '');
    }

    // soak splotches (chip-local)
    var spd = '';
    if (t >= 4990) spd = circleD(0, 0, 30);
    else if (t > 4000) {
      S.splots.forEach(function (s) {
        if (t < s.t) return;
        var r = s.r * eo(seg(t, s.t, s.t + 240)) * (1 + 0.15 * spring(t - s.t, 1, 6, 80)) + 15 * eio(seg(t, Math.max(s.t, 4400), 4960));
        if (r > 0.3) spd += circleD(s.x, s.y, r);
      });
      var fr = 30 * eio(seg(t, 4800, 4990));
      if (fr > 0.3) spd += circleD(0, 0, fr);
    }
    S.splP.setAttribute('d', spd);
    V.wet.setAttribute('opacity', f3(eio(seg(t, 4950, 5100)) * (1 - seg(t, 6200, 6450))));

    // puddle
    var pr = 36 * eo(seg(t, 4020, 5000)) * (1 - eio(seg(t, 6750, 7150))) + spring(t - 5650, 1.5, 6, 90) * seg(t, 5000, 5001);
    if (pr > 0.5) {
      var pd = '', ph = '';
      for (var k = 0; k <= 36; k++) {
        var a = k / 36 * 2 * Math.PI;
        var rr = pr * (1 + 0.07 * Math.sin(3 * a + 1.2) + 0.05 * Math.sin(5 * a + 0.4) + 0.04 * Math.sin(2 * a + t * 0.002));
        pd += (k ? 'L' : 'M') + f1(T.x + 1 + Math.cos(a) * rr * 1.12) + ' ' + f1(T.y + 4 + Math.sin(a) * rr * 0.82);
      }
      S.puddle.setAttribute('d', pd + 'Z');
      ph = 'M' + f1(T.x - pr * 0.95) + ' ' + f1(T.y - pr * 0.2) + 'Q' + f1(T.x - pr * 0.9) + ' ' + f1(T.y - pr * 0.6) + ' ' + f1(T.x - pr * 0.55) + ' ' + f1(T.y - pr * 0.7);
      S.puddleHi.setAttribute('d', ph);
      S.puddle.setAttribute('display', ''); S.puddleHi.setAttribute('display', '');
    } else { S.puddle.setAttribute('display', 'none'); S.puddleHi.setAttribute('display', 'none'); }

    // speed lines during scoots
    var sp1 = Math.sin(Math.PI * seg(t, 1770, 1930)), sp2 = Math.sin(Math.PI * seg(t, 2620, 2800));
    var spa = Math.max(sp1, sp2), dirS = sp1 > sp2 ? sA : sB;
    if (spa > 0.02) {
      var sd = '';
      [-12, 0, 12].forEach(function (oy, q) {
        var x0 = chx - dirS * (CR + 6 + q % 2 * 4), len = 14 + 10 * spa;
        sd += 'M' + f1(x0) + ' ' + f1(T.y + oy) + 'L' + f1(x0 - dirS * len) + ' ' + f1(T.y + oy);
      });
      S.speed.setAttribute('d', sd); S.speed.setAttribute('opacity', f3(spa));
    } else S.speed.setAttribute('opacity', 0);
    // dust ticks at each stop
    var dd = '', dop = 0;
    [[1885, A, sA], [2745, B, sB], [3820, 0, sB]].forEach(function (s) {
      var p = seg(t, s[0], s[0] + 260);
      if (p > 0 && p < 1) {
        dop = 1 - p;
        var x = T.x + s[1], side = s[2], r0 = CR + 3 + 9 * eoC(p), r1 = r0 + 5 * (1 - p);
        [-0.5, 0, 0.5].forEach(function (a) {
          var ang = (side > 0 ? 0 : Math.PI) + a;
          dd += 'M' + f1(x + Math.cos(ang) * r0) + ' ' + f1(T.y + Math.sin(ang) * r0) + 'L' + f1(x + Math.cos(ang) * r1) + ' ' + f1(T.y + Math.sin(ang) * r1);
        });
      }
    });
    S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f3(dop));

    // set-down ring pulse
    var rp = seg(t, 6880, 7300);
    S.ripple.setAttribute('r', f1(CR + 22 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));

    // ---- cloud ----
    var cx = T.x + cloudX(L, t), cy = T.y + cloudY(L, t);
    if (t > 1260 && t < 5900) cx = clamp(cx, 70, W - 66);
    var vx = (cloudX(L, t + 20) - cloudX(L, t - 20)) / 40;
    var tilt = clamp(vx * 22, -16, 16);
    var bs = cloudBase(t), stretch = Math.min(Math.abs(vx) * 0.22, 0.2);
    var sx = bs * (1 + stretch), sy = bs * (1 - stretch * 0.7);
    // wring out: squeeze + twist
    var wq = eio(seg(t, 5200, 5420)) * (1 - eoC(seg(t, 5530, 5650)));
    sx *= 1 - 0.36 * wq; sy *= 1 + 0.14 * wq;
    var skew = wq * 13 * Math.sin(2 * Math.PI * 4.5 * (t - 5200) / 1000);
    tilt += wq * 7 * Math.sin(2 * Math.PI * 4.5 * (t - 5200) / 1000 + 1.2);
    sx += spring(t - 5530, 0.12, 4, 110); sy -= spring(t - 5530, 0.08, 4, 110);
    // feint leans
    tilt += sA * 6 * Math.sin(Math.PI * seg(t, 2950, 3100)) + sB * 6 * Math.sin(Math.PI * seg(t, 3150, 3300));
    S.cloudT.setAttribute('transform', 'translate(' + f1(cx) + ',' + f1(cy) + ') rotate(' + f1(tilt) + ') skewX(' + f1(skew) + ') scale(' + f3(sx) + ',' + f3(sy) + ')');
    S.twist.setAttribute('opacity', f3(wq * 0.9));
    // cloud shadow on the table
    var hgt = cy - T.y; // negative
    var shOp = 0.17 * clamp(1 - (PARK - hgt) / 70) * clamp((cx + 60) / 60) * clamp((W + 60 - cx) / 60);
    S.cshadow.setAttribute('cx', f1(cx + 2)); S.cshadow.setAttribute('cy', f1(T.y + 4));
    S.cshadow.setAttribute('rx', f1(34 * sx)); S.cshadow.setAttribute('ry', f1(25 * sx));
    S.cshadow.setAttribute('opacity', f3(shOp * (1 - eio(seg(t, 5900, 6120)))));

    // cloud face
    var toChip = [clamp((chx - cx) / 40, -1, 1), 1];
    var cLook = (function () {
      if (t < 1150) return [-L.enterSide * 0.8, 0.7];
      if (t < 1900) return [0, 1];
      if (t < 2040) return [0, 1];
      if (t < 2470) return [lerp(0, sA, eoC(seg(t, 2040, 2110))), lerp(1, 0.35, eoC(seg(t, 2040, 2110)))];
      if (t < 2700) return [0, 1];
      if (t < 2950) return [lerp(0, sB, eoC(seg(t, 2700, 2760))), 0.6];
      if (t < 3560) return [toChip[0] * 1.6, 0.9];
      if (t < 5900) return [toChip[0], 1];
      return [L.enterSide, 0.75];
    })();
    var cLid = kf([[0, 0.35], [1260, 0.35], [1350, 0.45], [2040, 0.45], [2110, 0.55], [2470, 0.55], [2520, 0.4], [3560, 0.5], [3800, 0.5], [3900, 0.62], [5900, 0.55], [6000, 0.5]], t);
    var cGl = st([[0, 0], [5230, 2], [5520, 0], [5570, 3], [5700, 3], [5960, 0]], t);
    var cGlR = st([[0, 0], [5230, 2], [5560, 3], [5960, 0]], t); // right eye stays shut while the left peeks at the drip
    var cBrowT = kf([[0, 3], [2040, 3], [2110, 2.4], [2470, 2.4], [2520, 3], [5200, 3], [5240, 3.6], [5560, 3.6], [5600, 0.5], [5960, 0.5], [6000, 2.4]], t);
    var cBrowRaise = (t > 2040 && t < 2490 ? -3 * eoC(seg(t, 2040, 2110)) * (1 - seg(t, 2450, 2490)) : 0) + (t > 5960 ? -2.5 * eoC(seg(t, 5960, 6050)) : 0);
    S.cEyes.forEach(function (e, k) {
      var raise = (e.s === (t > 5900 ? L.enterSide : sA)) ? cBrowRaise : 0;
      var g = k === 0 ? cGl : cGlR;
      drawEye(e, cLid, (g || t < 1260) ? 0.7 : 1, cLook, g, 1, raise, cBrowT * (raise ? 0.2 : 1));
    });
    var cmC = kf([[0, -1.3], [2040, -1.3], [2110, 0.2], [2470, 0.2], [2520, -1.3], [3560, -1.3], [3650, 0.6], [3800, 0.6], [3900, 1.2], [5200, 1.2], [5240, -0.6], [5560, -0.6], [5650, -0.4], [5720, 2], [5960, 2], [6000, 0.6]], t);
    var cmSk = kf([[0, 0], [2040, 0], [2110, 2.2], [2470, 2.2], [2520, 0], [3560, 0], [3650, 2], [3850, 2], [3950, 0.8], [5200, 0.8], [5240, 0], [5960, 0], [6000, 2.2]], t);
    var cmW = kf([[0, 5], [3800, 5], [3900, 6.5], [5200, 6.5], [5240, 3.5], [5560, 3.5], [5700, 6], [5960, 6], [6000, 5]], t);
    var cmO = 2.4 * Math.sin(Math.PI * seg(t, 3800, 3950)) * 0; // (kept closed: inhale through a tight smirk)
    S.cMouth.setAttribute('d', mouthD(0, 14, cmW, cmC, cmO, cmSk * (sA === 1 ? 1 : 1)));
    // exhale puffs (satisfied)
    S.exh.forEach(function (c, k) {
      var p = seg(t, 5760 + k * 70, 6100 + k * 70);
      if (p <= 0 || p >= 1) { c.setAttribute('opacity', 0); return; }
      var side = -L.enterSide;
      c.setAttribute('cx', f1(cx + side * (42 + 26 * eo(p) + k * 6)));
      c.setAttribute('cy', f1(cy + 6 - 10 * eo(p) - k * 3));
      c.setAttribute('r', f1((5 + 2 * k) * (0.5 + 0.7 * eo(p))));
      c.setAttribute('opacity', f3(1 - p));
    });

    // rain
    var baseY = cy + 18 * sy;
    S.drops.forEach(function (d) {
      var p = (t - d.t0) / d.dur;
      if (p < 0 || p > 1) { d.path.setAttribute('display', 'none'); }
      else {
        var x = T.x + lerp(d.u * 0.8, d.lx, p), y0 = T.y + PARK + 18, y = lerp(y0, T.y + d.ly, 0.35 * p + 0.65 * p * p);
        var len = 6 + 7 * p, w = 3;
        d.path.setAttribute('display', '');
        d.path.setAttribute('d', 'M' + f1(x) + ' ' + f1(y - len) + 'C' + f1(x + w * 0.4) + ' ' + f1(y - len * 0.4) + ' ' + f1(x + w) + ' ' + f1(y - 1) + ' ' + f1(x) + ' ' + f1(y + w * 0.9) +
          'C' + f1(x - w) + ' ' + f1(y - 1) + ' ' + f1(x - w * 0.4) + ' ' + f1(y - len * 0.4) + ' ' + f1(x) + ' ' + f1(y - len) + 'Z');
      }
      var q = (t - d.t0 - d.dur) / 190;
      if (q < 0 || q > 1) { d.spl.setAttribute('display', 'none'); return; }
      var lx = T.x + d.lx, ly = T.y + d.ly;
      d.spl.setAttribute('display', '');
      d.spl.setAttribute('opacity', f3(1 - q));
      d.ring.setAttribute('cx', f1(lx)); d.ring.setAttribute('cy', f1(ly));
      d.ring.setAttribute('rx', f1(2 + 6 * eo(q))); d.ring.setAttribute('ry', f1(1.2 + 3.4 * eo(q)));
      d.b1.setAttribute('cx', f1(lx - 4 - 6 * eo(q))); d.b1.setAttribute('cy', f1(ly - 9 * Math.sin(Math.PI * q)));
      d.b2.setAttribute('cx', f1(lx + 4 + 6 * eo(q))); d.b2.setAttribute('cy', f1(ly - 7 * Math.sin(Math.PI * q)));
    });
    // the wrung-out drip: forms under the cloud, hangs, drops onto the chip
    var dr = '';
    if (t > 5380 && t < 5660) {
      var grow = eo(seg(t, 5380, 5540)), fall = seg(t, 5540, 5660);
      var x = cx, w2 = 2 + 2.6 * grow, yTop = baseY - 2;
      var y = fall > 0 ? lerp(yTop + 6 + 4 * grow, T.y - 2, ei(fall)) : yTop + 3 + 7 * grow + 1.2 * Math.sin(t * 0.05) * grow;
      var len2 = fall > 0 ? 10 + 6 * fall : (y - yTop);
      dr = 'M' + f1(x) + ' ' + f1(y - len2) + 'C' + f1(x + w2 * 0.3) + ' ' + f1(y - len2 * 0.5) + ' ' + f1(x + w2) + ' ' + f1(y - w2 * 0.4) + ' ' + f1(x) + ' ' + f1(y + w2) +
        'C' + f1(x - w2) + ' ' + f1(y - w2 * 0.4) + ' ' + f1(x - w2 * 0.3) + ' ' + f1(y - len2 * 0.5) + ' ' + f1(x) + ' ' + f1(y - len2) + 'Z';
    }
    S.drip.setAttribute('d', dr); S.drip.setAttribute('display', dr ? '' : 'none');
    var dq = seg(t, 5660, 5900);
    if (dq > 0 && dq < 1) {
      S.dripSpl.setAttribute('display', ''); S.dripSpl.setAttribute('opacity', f3(1 - dq));
      S.dripRing.setAttribute('cx', f1(T.x)); S.dripRing.setAttribute('cy', f1(T.y - 2));
      S.dripRing.setAttribute('rx', f1(4 + 13 * eo(dq))); S.dripRing.setAttribute('ry', f1(2.5 + 8 * eo(dq)));
    } else S.dripSpl.setAttribute('display', 'none');

    // shake-off droplets
    S.flings.forEach(function (f) {
      var p = (t - f.t0) / 300;
      if (p <= 0 || p >= 1) { f.p.setAttribute('display', 'none'); return; }
      var r = CR + f.d * eoC(p), hop = 7 * Math.sin(Math.PI * Math.min(1, p * 1.3));
      f.p.setAttribute('display', '');
      f.p.setAttribute('cx', f1(T.x + Math.cos(f.a) * r)); f.p.setAttribute('cy', f1(T.y + Math.sin(f.a) * r * 0.85 - hop));
      f.p.setAttribute('r', f1(f.r * (p < 0.75 ? 1 : 1 - (p - 0.75) * 2.4)));
    });

    // final line
    var lp = seg(t, 7350, 7750);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2raincloud;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2raincloud = S;
    return S;
  }

  window.CCSteal2_raincloud = {
    title: 'The Little Cloud',
    blurb: 'A grumpy little cloud in Nick’s colour parks over Nate’s chip and follows it wherever it scoots, then rains on it until the chip is soaked through in Nick’s colour.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2raincloud = S;
      var token = {};
      root.__cc2raincloudToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2raincloudToken !== token) { resolve(); return; }
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
