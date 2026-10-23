/* Closed Caption steal film: magichat (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE MAGICIAN (magichat)
 *
 * Everyone knows the trick: put something in the magician's hat, cover it, tap it with the wand,
 * and what comes out is not what went in. The hat is lined in the dealer's colour, the silk is
 * the dealer's colour, the gloves have the dealer's cuffs - so of course the chip comes out his.
 * Top-down felt table; the hat and the floating white gloves are a front-view stage cheat.
 *
 * Storyboard (ms)
 *    0- 600  Table deals in: rows drop in, chips pop on.
 *  550-1000  Camera eases in a touch (whole rows stay in frame). Other chips dim; Nate's chip
 *            gives a nervous hop-shiver.
 *  750-1100  A top hat tumbles down out of the sky, flipping, and lands upside-down beside the
 *            chip (squash, wobble, dust ticks).
 * 1050-1450  Two white gloves pop in with a sparkle and a twirl, cuffs in Nick's colour, and
 *            present the hat: "behold".
 * 1450-1920  They take the brim, lift the hat and tip it toward us: nothing inside but the
 *            Nick-coloured lining. Set it down.
 * 1880-2400  Flourish: one hand loops over to Nate's chip, plucks it, carries it high over the hat,
 *            teases (the chip shivers)...
 * 2400-2580  ...and lets go. The chip tumbles in; the hat gulps (squash).
 * 2580-3160  The hands meet above the hat and draw apart: a silk in Nick's colour unfurls
 *            between them. They lower it and it drapes over the hat.
 * 3100-3720  A wand twirls into one hand. Tap, tap, tap - each a little burst of sparkles,
 *            the silk dimpling under the tip.
 * 3720-4060  The dramatic beat: wand held high, the other hand pinches the top of the silk. Hold.
 * 4060-4310  WHIP! The silk streams up and away and vanishes into the fist (sparkle). Wand
 *            vanishes too. The hand opens: gone.
 * 4300-4830  They tip the hat toward us again: EMPTY. Hold on it.
 * 4790-5000  Gasp: both gloves jump back, fingers splayed, trembling.
 * 4980-5480  One hand reaches in, rummages (the hat jiggles)... and pulls the chip out:
 *            now Nick's colour, with his initial.
 * 5480-5960  Held up to the light: halo, twinkles, the chip turns once, a glint sweeps it.
 * 5960-6350  Carried back and set down exactly in its spot: squash, ring flash, ticks.
 * 6350-6600  Ta-da: both hands spread wide.
 * 6600-6830  A bow (hands sweep low, the hat dips).
 * 6830-7130  Puff! Hat and gloves vanish in a little cloud. Camera eases back, table undims.
 * 7130-7480  Stillness.
 * 7480-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', HAT = '#3A3337', HAT_HI = '#6A6064', GOLD = '#FFD24A', GLOVE = '#FFFFFF';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var PINCH = 28, CHIPD = 43, WAND = 54, HS = 1.15, HSC = 1.12;
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
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }
  function P(x, y) { return f1(x) + ' ' + f1(y); }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function starD(x, y, r) {
    if (r < 0.3) return '';
    var k = r * 0.22;
    return 'M' + P(x, y - r) + 'Q' + P(x + k, y - k) + ' ' + P(x + r, y) + 'Q' + P(x + k, y + k) + ' ' + P(x, y + r) +
      'Q' + P(x - k, y + k) + ' ' + P(x - r, y) + 'Q' + P(x - k, y - k) + ' ' + P(x, y - r) + 'Z';
  }
  // object keyframes: [[t, {fields}, ease?]]
  function kfo(keys, t) {
    if (t <= keys[0][0]) return Object.assign({}, keys[0][1]);
    for (var i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        var a = keys[i - 1], b = keys[i], q = (b[2] || eio)((t - a[0]) / (b[0] - a[0])), o = {};
        for (var k in b[1]) o[k] = lerp(a[1][k] !== undefined ? a[1][k] : b[1][k], b[1][k], q);
        for (var k2 in a[1]) if (o[k2] === undefined) o[k2] = a[1][k2];
        return o;
      }
    }
    return Object.assign({}, keys[keys.length - 1][1]);
  }
  function blendO(a, b, k) { var o = {}; for (var key in a) o[key] = typeof a[key] === 'number' && typeof b[key] === 'number' ? lerp(a[key], b[key], k) : a[key]; return o; }

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

  // ---------- drawing helpers ----------
  function makeChip(parent, color, txt, glintId) {
    var g = el('g', {}, parent);
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    var glint = null;
    if (glintId) {
      var cg = el('g', { 'clip-path': 'url(#' + glintId + ')' }, g);
      glint = el('path', { d: 'M-6 -30 L4 -30 L-6 30 L-16 30 Z', fill: '#FFFFFF', opacity: 0 }, cg);
    }
    el('circle', { r: CR, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, g);
    return { g: g, glint: glint };
  }

  // White glove. Local frame: wrist at origin, fingers toward -y, thumb on -x.
  function makeHand(parent, dealerC) {
    var g = el('g', {}, parent);
    var wandG = el('g', {}, g);
    el('rect', { x: -2.4, y: -WAND, width: 4.8, height: WAND + 10, rx: 2, fill: INK, stroke: INK, 'stroke-width': 1.4 }, wandG);
    el('rect', { x: -2.4, y: -WAND, width: 4.8, height: 9, rx: 2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4 }, wandG);
    el('rect', { x: -2.4, y: 3, width: 4.8, height: 7, rx: 2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4 }, wandG);
    el('path', { d: 'M-0.6 -40 L-0.6 -14', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, wandG);
    el('rect', { x: -12.4, y: -23.4, width: 24.8, height: 27.4, rx: 10.4, fill: INK }, g);
    var inkF = el('path', { fill: 'none', stroke: INK, 'stroke-width': 11.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('rect', { x: -10, y: -21, width: 20, height: 23, rx: 8, fill: GLOVE }, g);
    var whiteF = el('path', { fill: 'none', stroke: GLOVE, 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-4.2 -15 L-4.2 -8 M0 -15.5 L0 -8 M4.2 -15 L4.2 -8', stroke: INK, 'stroke-opacity': 0.3, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M7.5 -17 Q8.6 -10 6.5 -4', fill: 'none', stroke: '#D9D2C8', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    el('rect', { x: -12.5, y: -1.5, width: 25, height: 10, rx: 3.2, fill: dealerC, stroke: INK, 'stroke-width': 2.2 }, g);
    el('path', { d: 'M-9.5 1.5 L9.5 1.5', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: 6.5, cy: 4.5, r: 1.7, fill: GOLD, stroke: INK, 'stroke-width': 1 }, g);
    return { g: g, wandG: wandG, inkF: inkF, whiteF: whiteF };
  }
  var FB = [[-6.6, -18, 11.5], [-2.2, -19.5, 14], [2.2, -19.5, 13.5], [6.6, -18, 11]];
  function fingersD(sp, cu) {
    var d = '';
    FB.forEach(function (f, i) {
      var a = (i - 1.5) * sp * 13 * Math.PI / 180;
      var L = f[2] * (1 - 0.62 * cu), L1 = L * 0.55, L2 = L * 0.45;
      var b2 = a - (i - 1.5) * 0.12 * cu;
      var x1 = f[0] + Math.sin(a) * L1, y1 = f[1] - Math.cos(a) * L1;
      var x2 = x1 + Math.sin(b2) * L2, y2 = y1 - Math.cos(b2) * L2;
      d += 'M' + P(f[0], f[1] + 3) + 'L' + P(x1, y1) + 'L' + P(x2, y2);
    });
    var ta = -(48 + 26 * sp - 22 * cu) * Math.PI / 180, tl = 10.5 * (1 - 0.25 * cu);
    var tx0 = -8.5, ty0 = -8;
    var tx1 = tx0 + Math.sin(ta) * tl * 0.55, ty1 = ty0 - Math.cos(ta) * tl * 0.55;
    var ta2 = ta + 0.35 * cu;
    d += 'M' + P(tx0 + 2, ty0 + 1) + 'L' + P(tx1, ty1) + 'L' + P(tx1 + Math.sin(ta2) * tl * 0.45, ty1 - Math.cos(ta2) * tl * 0.45);
    return d;
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-magichat-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.j < 2 ? 1 : -1;
    var HX = T.x + sx * 80, baseY = T.y + Math.min(36, L.h / 2 - 8), brim0 = baseY - 50 * HS;
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var farRoom = sx === 1 ? 356 - HX : HX - 34;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpG = el('clipPath', { id: id + 'gl', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('circle', { r: CR - 1.5 }, cpG);

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

    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, cam);
    var hatSh = el('ellipse', { cx: HX, cy: baseY + 3, rx: 0, ry: 6, fill: INK, opacity: 0.22 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    // hat back
    var hatBack = el('g', {}, cam);
    var brimBack = el('ellipse', { cx: 0, rx: 37, fill: HAT, stroke: INK, 'stroke-width': 2.6 }, hatBack);
    var opening = el('ellipse', { cx: 0, rx: 27, fill: dealerC, stroke: INK, 'stroke-width': 2 }, hatBack);
    var floorE = el('ellipse', { cx: 0, rx: 22, fill: mix(dealerC, INK, 0.55) }, hatBack);
    var liningHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.3, 'stroke-width': 2, 'stroke-linecap': 'round' }, hatBack);
    var inside = el('g', {}, cam);
    // hat front
    var hatFront = el('g', {}, cam);
    var crown = el('path', { fill: HAT, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, hatFront);
    var band = el('path', { fill: mix(HAT, dealerC, 0.4), stroke: INK, 'stroke-width': 1.8 }, hatFront);
    var crownHi = el('path', { fill: 'none', stroke: HAT_HI, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, hatFront);
    var brimFront = el('path', { fill: HAT, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, hatFront);
    var brimHi = el('path', { fill: 'none', stroke: HAT_HI, 'stroke-width': 2, 'stroke-linecap': 'round' }, hatFront);
    // silk
    var silkG = el('g', {}, cam);
    var silk = el('path', { fill: dealerC, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, silkG);
    var silkFold = el('path', { fill: 'none', stroke: mix(dealerC, INK, 0.32), 'stroke-width': 2.2, 'stroke-linecap': 'round' }, silkG);
    var silkHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, silkG);
    // light halo (behind the held chip)
    var haloG = el('g', {}, cam);
    var halo = el('circle', { r: 0, fill: '#FFE7A0', opacity: 0 }, haloG);
    var rays = el('path', { fill: 'none', stroke: '#F5B92E', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, haloG);
    var front = el('g', {}, cam);
    // chip actor (victim face + dealer face)
    var chipA = el('g', {}, front);
    var chipV = makeChip(el('g', {}, chipA), victimC, vIni);
    var chipDg = el('g', { opacity: 0 }, chipA);
    var chipD = makeChip(chipDg, dealerC, dIni, id + 'gl');
    // hands
    var handsL = el('g', {}, cam);
    var hN = makeHand(handsL, dealerC), hF = makeHand(handsL, dealerC);
    hF.wandG.setAttribute('display', 'none');
    // fx
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var sparks = el('path', { fill: GOLD, stroke: INK, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, cam);
    var puffInk = el('path', { fill: INK, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, cam);
    var puffFill = el('path', { fill: PAPER }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    var S = {
      opts: opts, L: L, T: T, sx: sx, HX: HX, baseY: baseY, brim0: brim0, farRoom: farRoom, dealerC: dealerC, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, vSh: vSh, hatSh: hatSh, dust: dust, hatBack: hatBack, brimBack: brimBack, opening: opening, floorE: floorE,
      liningHi: liningHi, inside: inside, hatFront: hatFront, crown: crown, band: band, crownHi: crownHi, brimFront: brimFront, brimHi: brimHi,
      silkG: silkG, silk: silk, silkFold: silkFold, silkHi: silkHi, halo: halo, rays: rays, front: front, chipA: chipA, chipDg: chipDg, chipD: chipD,
      handsL: handsL, hN: hN, hF: hF, ripple: ripple, ticks: ticks, sparks: sparks, puffInk: puffInk, puffFill: puffFill, line: line
    };
    S.keysN = keysN(S); S.keysF = keysF(S);
    return S;
  }

  // ---------- choreography ----------
  // hat pose: world transform = translate(X,Y) rotate(rot) scale(a,b) about the base centre
  function hatPose(t, S) {
    var sx = S.sx, h = { dx: 0, dy: 0, rot: 0, sqy: 1, tilt: 0, sc: 1 };
    h.vis = t >= 750 && t < 6905; h.tl = 0;
    var spin = 0;
    if (t < 1100) { var q = seg(t, 750, 1100); h.dy = -(S.baseY + 110) * (1 - q * q); spin = -540 * sx * (1 - eo(q)); }
    h.sqy += spring(t - 1100, -0.2, 3, 110) + 0.08 * Math.sin(Math.PI * seg(t, 1040, 1100));
    h.rot += spring(t - 1100, 5 * sx, 2.2, 160);
    var k1 = eio(seg(t, 1530, 1680)) * (1 - eio(seg(t, 1780, 1860)));
    var k2 = eio(seg(t, 4380, 4520)) * (1 - eio(seg(t, 4700, 4780)));
    h.tilt = k1 + k2; h.dy -= 24 * (k1 + k2);
    h.rot += -sx * 3 * Math.sin(Math.PI * seg(t, 1530, 1860)) + -sx * 3 * Math.sin(Math.PI * seg(t, 4380, 4780));
    h.sqy += spring(t - 1860, -0.07, 4, 100) + spring(t - 4780, -0.07, 4, 100);
    h.sqy += spring(t - 2500, -0.1, 4, 100);
    h.sqy += spring(t - 3060, -0.04, 4, 100);
    [3330, 3510, 3690].forEach(function (hit) { h.sqy += spring(t - hit, -0.05, 5, 70); });
    h.rot += spring(t - 4120, -4 * sx, 3, 140);
    h.dy -= 6 * Math.sin(Math.PI * seg(t, 4800, 4940));
    var re = seg(t, 5140, 5200) * (1 - seg(t, 5300, 5360));
    h.rot += 4.5 * re * Math.sin((t - 5140) * 0.075); h.dx += 1.6 * re * Math.sin((t - 5140) * 0.11);
    h.sqy += 0.04 * re * Math.sin((t - 5140) * 0.09);
    h.dy -= 9 * eo(seg(t, 5340, 5420)) * (1 - eio(seg(t, 5420, 5520)));
    h.sqy += spring(t - 5520, -0.06, 4, 100);
    var bw = Math.sin(Math.PI * seg(t, 6600, 6830));
    h.tilt += 0.45 * bw; h.sqy -= 0.07 * bw; h.dy += 3 * bw;
    h.sc = HS * (1 - eio(seg(t, 6835, 6900)));
    // rotation for the tumble is about the hat's centre: compensate the base pivot
    var b = h.sqy * h.sc, c = [0, -25 * b], R = spin * Math.PI / 180;
    h.dx += c[0] - (c[0] * Math.cos(R) - c[1] * Math.sin(R));
    h.dy += c[1] - (c[0] * Math.sin(R) + c[1] * Math.cos(R));
    h.rot += spin;
    h.crownH = 50 - 10 * Math.min(1, h.tilt);
    return h;
  }
  function hatW(S, h, px, py) {
    var a = h.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    var x = px * (2 - h.sqy) * h.sc, y = py * h.sqy * h.sc;
    return [S.HX + h.dx + x * c - y * s, S.baseY + h.dy + x * s + y * c];
  }
  function brimY(S, h) { return hatW(S, h, 0, -h.crownH)[1]; }

  // hands: own-side frame. kx outward (near hand: toward the chip), ky relative to rest brim.
  function I(kx, ky, rot, sp, cu, s) { return { kx: kx, ky: ky, rot: rot, sp: sp, cu: cu, s: s === undefined ? 1 : s }; }
  function keysN(S) {
    return [
      [0, I(60, 4, -200, 0.6, 0.15, 0)], [1120, I(60, 4, -200, 0.6, 0.15, 0)],
      [1350, I(58, -2, -35, 1.1, 0, 1), function (x) { return backOut(x, 1.5); }], [1450, I(58, 0, -32, 1.1, 0)],
      [1880, I(58, 8, -10, 0.6, 0.15)], [2580, I(58, 8, 0, 0.6, 0.15)],
      [2660, I(6, -44, -90, 0.2, 0.3)], [2820, I(44, -52, -15, 0.3, 0.55)], [2940, I(44, -8, -15, 0.3, 0.55)], [3060, I(42, -4, -15, 0.3, 0.55)],
      [3160, I(62, -4, 360, 0.5, 1)], [3240, I(58, -10, 360, 0, 1)],
      [3720, I(58, -10, 360, 0, 1)], [3820, I(30, -72, 372, 0, 1), function (x) { return backOut(x, 1.4); }], [4140, I(30, -74, 372, 0, 1)],
      [4240, I(58, -34, 360, 1.15, 0)], [4300, I(58, -30, 360, 1.0, 0.05)],
      [4800, I(56, 4, 340, 0.6, 0.1)], [4870, I(76, -22, 400, 1.4, 0, 1.12), function (x) { return backOut(x, 2); }], [4980, I(68, -10, 385, 0.9, 0.05, 1)],
      [6350, I(70, -40, 540, 1.1, 0)], [6500, I(86, -58, 420, 1.3, 0), function (x) { return backOut(x, 1.6); }], [6600, I(86, -56, 420, 1.25, 0)],
      [6830, I(48, 14, 290, 0.4, 0.2)], [7200, I(48, 14, 290, 0.4, 0.2)]
    ];
  }
  function keysF(S) {
    return [
      [0, I(60, 4, 200, 0.6, 0.15, 0)], [1050, I(60, 4, 200, 0.6, 0.15, 0)],
      [1280, I(58, -2, -35, 1.1, 0, 1), function (x) { return backOut(x, 1.5); }], [1450, I(58, 0, -32, 1.1, 0)],
      [1880, I(58, 8, -10, 0.6, 0.15)], [2250, I(60, 2, -28, 1.05, 0)], [2450, I(60, 0, -32, 1.1, 0)],
      [2580, I(58, 8, 0, 0.6, 0.15)],
      [2660, I(6, -44, -90, 0.2, 0.3)], [2820, I(44, -52, -15, 0.3, 0.55)], [2940, I(44, -8, -15, 0.3, 0.55)], [3060, I(42, -4, -15, 0.3, 0.55)],
      [3180, I(60, 2, 12, 0.7, 0.1)], [3760, I(60, 2, 12, 0.7, 0.1)],
      [3940, I(-5, -30, 170, 0.15, 0.6)], [4060, I(-5, -34, 170, 0.15, 0.62)],
      [4240, I(70, -128, 60, 0, 1), eoC], [4310, I(70, -116, 30, 1.35, 0)],
      [4800, I(56, 4, -20, 0.6, 0.1)], [4870, I(76, -22, 40, 1.4, 0, 1.12), function (x) { return backOut(x, 2); }], [4980, I(66, -8, 20, 0.9, 0.05, 1)],
      [5560, I(60, -10, -20, 0.9, 0.05)], [5700, I(56, -30, -50, 1.15, 0)], [5960, I(56, -32, -48, 1.15, 0)], [6250, I(62, -4, 0, 0.6, 0.1)],
      [6350, I(66, -20, 20, 0.8, 0.05)], [6500, I(86, -58, 60, 1.3, 0), function (x) { return backOut(x, 1.6); }], [6600, I(86, -56, 60, 1.25, 0)],
      [6830, I(48, 14, -70, 0.4, 0.2)], [7200, I(48, 14, -70, 0.4, 0.2)]
    ];
  }
  function pinchOff(rot, side, s, len) { var R = side * rot * Math.PI / 180; len = len || PINCH; return [len * s * Math.sin(R), -len * s * Math.cos(R)]; }
  function toWorldH(S, k, side) {
    var kx = k.kx;
    if (side === S.sx) kx = Math.min(kx, S.farRoom);
    return { x: S.HX + side * kx, y: S.brim0 + k.ky, rot: k.rot, s: k.s * HSC, sp: k.sp, cu: k.cu };
  }
  function trackH(S, which, t) {
    var side = which === 'N' ? -S.sx : S.sx;
    var o = toWorldH(S, kfo(which === 'N' ? S.keysN : S.keysF, t), side);
    return o;
  }
  // grip on the brim, fingers pointing in
  function gripH(S, h, side) {
    var g = hatW(S, h, side * 34, -h.crownH + 9 + 4 * h.tilt);
    return { x: g[0] + side * PINCH * HSC * 0.92, y: g[1] + 3, rot: -94, s: HSC, sp: 0.3, cu: 0.5 };
  }
  function gripA(t) {
    return seg(t, 1450, 1530) * (1 - seg(t, 1860, 1920)) + seg(t, 4300, 4380) * (1 - seg(t, 4780, 4830));
  }
  function chipKey(S) { return { cl: [S.HX - S.sx * 12, S.brim0 - 92], cd: [S.HX, S.brim0 - 58] }; }

  // near hand: base track + overrides that carry the chip
  function handN(S, t, h) {
    var side = -S.sx, T = S.T, K = chipKey(S), st, chip = null;
    st = trackH(S, 'N', t);
    var A = gripA(t);
    if (A > 0) st = blendO(st, gripH(S, h, side), eio(A));
    function fromChip(C, rot, s) { var o = pinchOff(rot, side, s || HSC, CHIPD); return [C[0] - o[0], C[1] - o[1]]; }
    if (t >= 1880 && t < 2580) {
      var W0 = trackH(S, 'N', 1880), Wg = fromChip([T.x, T.y], 180);
      if (t < 2080) {
        var p = seg(t, 1880, 2080), q = eio(p);
        var lx = -side * 0 + 14 * Math.sin(2 * Math.PI * q) * side, ly = -26 * Math.sin(Math.PI * q) - 8 * (1 - Math.cos(2 * Math.PI * q));
        st = { x: lerp(W0.x, Wg[0], q) + lx, y: lerp(W0.y, Wg[1], q) + ly, rot: lerp(W0.rot, 180, q), s: HSC, sp: lerp(0.6, 0.9, Math.sin(Math.PI * p)), cu: 0.15 };
      } else if (t < 2120) {
        var pc = eo(seg(t, 2080, 2120));
        st = { x: Wg[0], y: Wg[1] + 3 * Math.sin(Math.PI * pc), rot: 180, s: HSC, sp: lerp(0.6, 0.15, pc), cu: lerp(0.15, 0.6, pc) };
        chip = [T.x, T.y];
      } else if (t < 2400) {
        var pa = eio(seg(t, 2120, 2320)), C = arc2([T.x, T.y], K.cd, 40, pa);
        if (t >= 2320) C = [K.cd[0] + 1.5 * Math.sin((t - 2320) * 0.25), K.cd[1] - 4 * Math.sin(Math.PI * seg(t, 2320, 2400))];
        var W1 = fromChip(C, 180);
        st = { x: W1[0], y: W1[1], rot: 180 + 6 * side * Math.sin(Math.PI * pa), s: HSC, sp: 0.15, cu: 0.6 };
        chip = C;
      } else {
        var Wr = fromChip(K.cd, 180), pr = eoC(seg(t, 2400, 2450));
        var rel = { x: Wr[0], y: Wr[1] - 10 * pr, rot: 180, s: HSC, sp: lerp(0.15, 1.2, pr), cu: lerp(0.6, 0, pr) };
        st = blendO(rel, trackH(S, 'N', 2580), eio(seg(t, 2450, 2580)));
      }
    }
    // wand taps: solve the wrist so the wand tip lands on the silk
    var A2 = seg(t, 3240, 3300) * (1 - seg(t, 3700, 3760));
    if (A2 > 0) {
      var lift = t < 3150 ? 16 : 16 * Math.abs(Math.sin(Math.PI * (Math.min(t, 3690) - 3150) / 180));
      var rot = 360 - 52 + 12 * lift / 16;
      var tip = [S.HX + side * 10, brimY(S, h) - 3 - lift];
      var o = pinchOff(rot, side, HSC, WAND);
      st = blendO(st, { x: tip[0] - o[0], y: tip[1] - o[1], rot: rot, s: HSC, sp: 0, cu: 1 }, eio(A2));
    }
    if (t >= 4980 && t < 6500) {
      var bY = brimY(S, h);
      if (t < 5080) {
        st = blendO(trackH(S, 'N', 4980), { x: S.HX, y: bY - 42, rot: 180, s: HSC, sp: 0.4, cu: 0.2 }, eio(seg(t, 4980, 5080)));
      } else if (t < 5160) {
        st = { x: S.HX, y: lerp(bY - 42, bY - 20, eio(seg(t, 5080, 5160))), rot: 180, s: HSC, sp: 0.4, cu: 0.2 };
      } else if (t < 5340) {
        var r = t - 5160, env = Math.sin(Math.PI * seg(t, 5160, 5340));
        st = { x: S.HX + 7 * env * Math.sin(r * 0.06), y: bY - 20 + 4 * env * Math.sin(r * 0.09 + 1), rot: 180 + 14 * env * Math.sin(r * 0.05), s: HSC, sp: 0.4 + 0.3 * env * Math.sin(r * 0.07), cu: 0.2 + 0.3 * env * (0.5 + 0.5 * Math.sin(r * 0.08)) };
        if (t > 5300) { st.cu = lerp(st.cu, 0.6, seg(t, 5300, 5340)); st.sp = lerp(st.sp, 0.15, seg(t, 5300, 5340)); }
      } else if (t < 5480) {
        var bY0 = brimY(S, hatPose(5340, S)), y0 = bY0 - 20;
        st = { x: S.HX, y: lerp(y0, S.brim0 - 90, eoC(seg(t, 5340, 5480))), rot: 180, s: HSC, sp: 0.15, cu: 0.6 };
        chip = [st.x, st.y + CHIPD * HSC];
      } else {
        var C0 = [S.HX, S.brim0 - 90 + CHIPD * HSC], Cc, rt, sc = 1;
        if (t < 5620) { var pq = eio(seg(t, 5480, 5620)); Cc = arc2(C0, K.cl, 26, pq); rt = lerp(180, 360, pq); }
        else if (t < 5960) { var pl = eio(seg(t, 5620, 5960)); Cc = [K.cl[0], K.cl[1] - 5 * pl]; rt = 360 + side * 4 * Math.sin(Math.PI * pl); }
        else if (t < 6220) { var pm = eio(seg(t, 5960, 6220)); Cc = arc2([K.cl[0], K.cl[1] - 5], [T.x, T.y - 14], 26, pm); rt = lerp(360, 540, pm); }
        else if (t < 6290) { Cc = [T.x, lerp(T.y - 14, T.y, ei(seg(t, 6220, 6290)))]; rt = 540; }
        else { Cc = [T.x, T.y]; rt = 540; }
        var Wc = fromChip(Cc, rt);
        st = { x: Wc[0], y: Wc[1], rot: rt, s: HSC, sp: 0.15, cu: 0.6 };
        if (t >= 6290) {
          var pr2 = eoC(seg(t, 6290, 6350));
          st.y -= 12 * pr2; st.sp = lerp(0.15, 1.1, pr2); st.cu = lerp(0.6, 0, pr2);
          if (t >= 6350) st = blendO(st, trackH(S, 'N', t), eio(seg(t, 6350, 6500)));
        } else chip = Cc;
      }
    }
    st.side = side; st.chip = chip;
    st.wand = t < 3100 ? 0 : t < 3240 ? backOut(seg(t, 3100, 3240), 2) : t < 4160 ? 1 : 1 - eio(seg(t, 4160, 4240));
    st.wandSpin = t >= 3100 && t < 3240 ? 1 - eoC(seg(t, 3100, 3240)) : 0;
    return st;
  }
  function handF(S, t, h) {
    var side = S.sx, st = trackH(S, 'F', t);
    var A = gripA(t);
    if (A > 0) st = blendO(st, gripH(S, h, side), eio(A));
    st.side = side;
    return st;
  }
  function handScale(t) { return 1 - eio(seg(t, 6835, 6900)); }
  function bob(t, ph) { return 1.6 * Math.sin(t * 0.0065 + ph); }

  // silk outline: corners TL, TR, BR, BL plus controls; returns null when hidden
  function silkPts(S, t, h, nH, fH) {
    if (t < 2660 || t >= 4245) return null;
    var side = S.sx;
    var pN = pinchW(nH), pF = pinchW(fH);
    var left = pN[0] < pF[0] ? pN : pF, right = pN[0] < pF[0] ? pF : pN;
    var hh = 66 * eo(seg(t, 2660, 2820));
    var wv = 3 * Math.sin(t * 0.012);
    var held = {
      TL: left, TR: right, TC: [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2 + 6 * seg(t, 2660, 2760)],
      RC: [right[0] + 3, right[1] + hh / 2], BR: [right[0] + 2, right[1] + hh], BL: [left[0] - 2, left[1] + hh], LC: [left[0] - 3, left[1] + hh / 2], wv: wv * seg(hh, 10, 40)
    };
    var bw = brimY(S, h), base = S.baseY + h.dy + 3, X = S.HX + h.dx;
    var dent = 0;
    [3330, 3510, 3690].forEach(function (hit) { dent += spring(t - hit, 6, 3, 90) * (t > hit ? 1 : 0); });
    var drp = {
      TL: [X - 40 * HS, bw + 1], TR: [X + 40 * HS, bw + 1], TC: [X, bw + 4 + Math.abs(dent)], RC: [X + 46 * HS, (bw + base) / 2], BR: [X + 46 * HS, base], BL: [X - 46 * HS, base], LC: [X - 46 * HS, (bw + base) / 2],
      wv: 2.2 * Math.sin(t * 0.008)
    };
    if (t >= 3940) {
      var G = pinchW(fH), ten = seg(t, 3940, 4060);
      drp.TC = [lerp(drp.TC[0], G[0], ten), lerp(drp.TC[1], G[1] - 6, ten)];
    }
    var d = eio(seg(t, 2940, 3060));
    var o = {};
    if (d <= 0) o = held; else if (d >= 1) o = drp; else {
      ['TL', 'TR', 'TC', 'RC', 'BR', 'BL', 'LC'].forEach(function (k) { o[k] = [lerp(held[k][0], drp[k][0], d), lerp(held[k][1], drp[k][1], d)]; });
      o.wv = lerp(held.wv, drp.wv, d);
    }
    if (t >= 4060) {
      var w = seg(t, 4060, 4245), Gp = pinchW(fH);
      var dl = { TC: 0, TL: 0.1, TR: 0.1, LC: 0.25, RC: 0.25, BL: 0.4, BR: 0.4 };
      ['TL', 'TR', 'TC', 'RC', 'BR', 'BL', 'LC'].forEach(function (k) {
        var wi = eio(clamp((w - dl[k]) / (1 - dl[k])));
        o[k] = [lerp(o[k][0], Gp[0], wi), lerp(o[k][1], Gp[1], wi)];
      });
      o.wv *= 1 - w; o.wv += 6 * Math.sin(Math.PI * w) * Math.sin(t * 0.05);
    }
    return o;
  }
  function pinchW(st) { var o = pinchOff(st.rot, st.side, st.s); return [st.x + o[0], st.y + o[1]]; }
  function wandTipW(st) { var o = pinchOff(st.rot, st.side, st.s, WAND - 3); return [st.x + o[0], st.y + o[1]]; }

  // chip actor
  function chipState(S, t, nH, h) {
    var T = S.T, c = { x: T.x, y: T.y, s: 1, sxk: 1, syk: 1, rot: 0, dealer: false, layer: 'front', vis: true, sh: 1, glint: -1 };
    function pop() { var p = seg(t, 200 + 70 * T.row + 60 * T.j, 520 + 70 * T.row + 60 * T.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    if (t < 2080) {
      c.s = pop();
      c.y -= 5 * Math.sin(Math.PI * seg(t, 620, 780));
      var nh = seg(t, 620, 920); c.x += 1.8 * Math.sin((t - 620) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
      c.s *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 620, 780));
      var ap = seg(t, 1940, 2080); c.x += 1.4 * Math.sin(t * 0.21) * ap;
      c.y += 1.2 * Math.sin(Math.PI * seg(t, 1080, 1180)) * 2;
    } else if (t < 2400) {
      c.x = nH.chip[0]; c.y = nH.chip[1]; c.sh = 1 - seg(t, 2080, 2160);
      c.x += t > 2300 ? 1.3 * Math.sin(t * 0.33) : 0;
      c.rot = 8 * Math.sin(Math.PI * seg(t, 2120, 2320)) * -S.sx;
    } else if (t < 2525) {
      var K = chipKey(S), q = seg(t, 2400, 2525);
      c.x = K.cd[0]; c.y = lerp(K.cd[1], brimY(S, h) + 26, ei(q));
      c.syk = Math.max(0.22, Math.abs(Math.cos(Math.PI * 1.3 * q)));
      c.sh = 0; c.layer = 'inside';
    } else if (t < 5340) { c.vis = false; }
    else {
      c.dealer = true; c.sh = 0;
      if (nH.chip) { c.x = nH.chip[0]; c.y = nH.chip[1]; }
      else { c.x = T.x; c.y = T.y; }
      c.layer = t < 5440 ? 'inside' : 'front';
      if (t >= 5620 && t < 5960) {
        var fl = seg(t, 5680, 5880); c.sxk = Math.max(0.08, Math.abs(Math.cos(Math.PI * eio(fl)))); c.s = 1 + 0.12 * eio(seg(t, 5560, 5680));
        c.glint = seg(t, 5860, 5960);
      } else if (t >= 5480 && t < 5620) c.s = 1 + 0.12 * eio(seg(t, 5560, 5620));
      else if (t >= 5960 && t < 6290) c.s = 1.12 - 0.12 * eio(seg(t, 5960, 6200));
      c.rot = t < 5620 ? 0 : 0;
      if (t >= 6290) {
        var d = t - 6290, land = Math.exp(-d / 70) * Math.sin(Math.PI * clamp(d / 110));
        c.sxk = 1 + 0.15 * land; c.syk = 1 - 0.15 * land; c.sh = 1; c.x = T.x; c.y = T.y;
      } else if (t >= 6200) c.sh = seg(t, 6200, 6290);
    }
    return c;
  }

  // ---------- render ----------
  function setHandEl(H, st, sc) {
    var s = st.s * sc;
    if (s < 0.01) { H.g.setAttribute('display', 'none'); return; }
    H.g.setAttribute('display', 'inline');
    H.g.setAttribute('transform', 'translate(' + f1(st.x) + ',' + f1(st.y) + ') rotate(' + f1(st.side * st.rot) + ') scale(' + f2(st.side * s) + ',' + f2(s) + ')');
    var d = fingersD(clamp(st.sp, -0.2, 1.6), clamp(st.cu, 0, 1));
    H.inkF.setAttribute('d', d); H.whiteF.setAttribute('d', d);
    if (st.wand !== undefined) {
      if (st.wand < 0.01) H.wandG.setAttribute('display', 'none');
      else { H.wandG.setAttribute('display', 'inline'); H.wandG.setAttribute('transform', 'translate(0,-10) rotate(' + f1(st.wandSpin * -540) + ') scale(' + f2(st.wand) + ') translate(0,10)'); }
    }
  }

  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, sx = S.sx, HX = S.HX, baseY = S.baseY;

    // camera
    var zk = eioC(seg(t, 550, 1000)) * (1 - eioC(seg(t, 6950, 7400)));
    var Z = lerp(1, 1.12, zk);
    var fy = clamp(baseY - 100, 290, 330);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    var dim = eio(seg(t, 600, 850)) * (1 - eio(seg(t, 6950, 7350)));
    S.chipsG.forEach(function (o) {
      var p = seg(t, 200 + 70 * o.c.row + 60 * o.c.j, 520 + 70 * o.c.row + 60 * o.c.j), sc = p <= 0 ? 0.001 : backOut(p, 2.2);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      var under = o.c.row === T.row && Math.abs(o.c.x - HX) < 44 ? seg(t, 1090, 1110) * (1 - seg(t, 6880, 6900)) : 0;
      o.wrap.setAttribute('opacity', ((1 - 0.55 * dim) * (1 - under)).toFixed(3));
    });

    // ---- hat ----
    var h = hatPose(t, S);
    var hv = h.vis && h.sc > 0.01;
    [S.hatBack, S.hatFront].forEach(function (g) {
      g.setAttribute('display', hv ? 'inline' : 'none');
      if (hv) g.setAttribute('transform', 'translate(' + f1(HX + h.dx) + ',' + f1(baseY + h.dy) + ') rotate(' + f1(h.rot) + ') scale(' + f2((2 - h.sqy) * h.sc) + ',' + f2(h.sqy * h.sc) + ')');
    });
    if (hv) {
      var tl = Math.min(1.4, h.tilt), ch = h.crownH, bry = 8 + 11 * tl, ory = 5.5 + 11 * tl;
      S.brimBack.setAttribute('cy', f1(-ch)); S.brimBack.setAttribute('ry', f1(bry));
      S.opening.setAttribute('cy', f1(-ch)); S.opening.setAttribute('ry', f1(ory));
      S.floorE.setAttribute('cy', f1(-ch + ory * 0.3)); S.floorE.setAttribute('ry', f1(ory * 0.66)); S.floorE.setAttribute('rx', f1(21 + 2 * tl));
      S.liningHi.setAttribute('d', 'M' + P(-20, -ch - ory * 0.45) + 'Q' + P(-8, -ch - ory * 0.85) + ' ' + P(6, -ch - ory * 0.8));
      S.crown.setAttribute('d', 'M' + P(-27, -ch) + 'L' + P(-23.5, -7) + 'Q' + P(-23.5, 0) + ' ' + P(-16, 0) + 'L' + P(16, 0) + 'Q' + P(23.5, 0) + ' ' + P(23.5, -7) + 'L' + P(27, -ch) + 'Z');
      var b0 = -ch + 4, b1 = -ch + 12;
      S.band.setAttribute('d', 'M' + P(-26.6, b0) + 'L' + P(26.6, b0) + 'L' + P(26, b1) + 'L' + P(-26, b1) + 'Z');
      S.crownHi.setAttribute('d', 'M' + P(-18.5, -ch + 17) + 'L' + P(-17.5, -8));
      S.brimFront.setAttribute('d', 'M' + P(-37, -ch) + 'A37 ' + f1(bry) + ' 0 0 0 ' + P(37, -ch) + 'L' + P(27, -ch) + 'A27 ' + f1(ory) + ' 0 0 1 ' + P(-27, -ch) + 'Z');
      S.brimHi.setAttribute('d', 'M' + P(-31, -ch + bry * 0.5) + 'Q' + P(-22, -ch + bry * 0.86) + ' ' + P(-10, -ch + bry * 0.97));
    }
    var landed = t >= 1040 && hv ? clamp(1 - Math.max(0, -h.dy) / 60) : 0;
    S.hatSh.setAttribute('cx', f1(HX + h.dx)); S.hatSh.setAttribute('rx', f1(30 * landed * h.sc)); S.hatSh.setAttribute('opacity', f1(22 * landed) / 100);
    // landing dust
    var dp0 = seg(t, 1100, 1380);
    if (dp0 > 0 && dp0 < 1) {
      var dd = '';
      [-2.95, -2.55, -0.6, -0.2, 2.75, 0.4].forEach(function (a) {
        var r0 = 1 + 0.3 * eoC(dp0), r1 = r0 + 0.2 * (1 - dp0);
        dd += 'M' + P(HX + Math.cos(a) * 40 * r0, baseY + Math.sin(a) * 11 * r0) + 'L' + P(HX + Math.cos(a) * 40 * r1, baseY + Math.sin(a) * 11 * r1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- hands ----
    var nH = handN(S, t, h), fH = handF(S, t, h);
    var hs = handScale(t);
    var A = gripA(t), carry = (t >= 2080 && t < 2400) || (t >= 5080 && t < 6290);
    if (!carry && A < 0.5 && !(t >= 3240 && t < 3760)) { nH.y += bob(t, 0); }
    if (A < 0.5 && !(t >= 3940 && t < 4245)) fH.y += bob(t, 2.2);
    // gasp tremble
    var tr = seg(t, 4850, 4880) * (1 - seg(t, 4960, 5020));
    if (tr > 0) { nH.x += 1.6 * tr * Math.sin(t * 0.5); fH.x += 1.6 * tr * Math.sin(t * 0.5 + 1.3); nH.rot += 3 * tr * Math.sin(t * 0.43); fH.rot += 3 * tr * Math.sin(t * 0.47); }
    var nInside = t >= 5080 && t < 5440;
    if (nInside) { if (S.hN.g.parentNode !== S.inside) S.inside.appendChild(S.hN.g); }
    else if (S.hN.g.parentNode !== S.handsL) S.handsL.insertBefore(S.hN.g, S.hF.g);
    setHandEl(S.hN, nH, hs);
    setHandEl(S.hF, fH, hs);

    // ---- silk ----
    var sp = silkPts(S, t, h, nH, fH);
    if (sp) {
      S.silkG.setAttribute('display', 'inline');
      var dS = 'M' + P(sp.TL[0], sp.TL[1]) + 'Q' + P(sp.TC[0], sp.TC[1]) + ' ' + P(sp.TR[0], sp.TR[1]) + 'Q' + P(sp.RC[0], sp.RC[1]) + ' ' + P(sp.BR[0], sp.BR[1]);
      for (var i = 0; i < 4; i++) {
        var a0 = [lerp(sp.BR[0], sp.BL[0], i / 4), lerp(sp.BR[1], sp.BL[1], i / 4)], a1 = [lerp(sp.BR[0], sp.BL[0], (i + 1) / 4), lerp(sp.BR[1], sp.BL[1], (i + 1) / 4)];
        dS += 'Q' + P((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 + (i % 2 ? 1 : -1) * (2.5 + sp.wv)) + ' ' + P(a1[0], a1[1]);
      }
      dS += 'Q' + P(sp.LC[0], sp.LC[1]) + ' ' + P(sp.TL[0], sp.TL[1]) + 'Z';
      S.silk.setAttribute('d', dS);
      function q2(a, b, c, u) { return [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * b[1] + u * u * c[1]]; }
      var f0 = q2(sp.TL, sp.TC, sp.TR, 0.32), f0b = q2(sp.TL, sp.TC, sp.TR, 0.66);
      var g0 = [lerp(sp.BL[0], sp.BR[0], 0.26), lerp(sp.BL[1], sp.BR[1], 0.26) - 3], g1 = [lerp(sp.BL[0], sp.BR[0], 0.72), lerp(sp.BL[1], sp.BR[1], 0.72) - 3];
      S.silkFold.setAttribute('d', 'M' + P(f0[0], f0[1] + 5) + 'Q' + P(lerp(f0[0], g0[0], 0.5) - 3, lerp(f0[1], g0[1], 0.5)) + ' ' + P(g0[0], g0[1]) +
        'M' + P(f0b[0], f0b[1] + 5) + 'Q' + P(lerp(f0b[0], g1[0], 0.5) + 3, lerp(f0b[1], g1[1], 0.5)) + ' ' + P(g1[0], g1[1]));
      var hA = [lerp(sp.TL[0], sp.BL[0], 0.15) + 6, lerp(sp.TL[1], sp.BL[1], 0.15) + 3], hB = [lerp(sp.TL[0], sp.BL[0], 0.62) + 5, lerp(sp.TL[1], sp.BL[1], 0.62)];
      S.silkHi.setAttribute('d', 'M' + P(hA[0], hA[1]) + 'L' + P(hB[0], hB[1]));
    } else S.silkG.setAttribute('display', 'none');

    // ---- chip ----
    var c = chipState(S, t, nH, h);
    if (c.vis) {
      var lay = c.layer === 'inside' ? S.inside : S.front;
      if (S.chipA.parentNode !== lay) { if (lay === S.inside) lay.insertBefore(S.chipA, lay.firstChild); else lay.appendChild(S.chipA); }
      S.chipA.setAttribute('display', 'inline');
      S.chipA.setAttribute('transform', 'translate(' + f1(c.x) + ',' + f1(c.y) + ') rotate(' + f1(c.rot) + ') scale(' + f2(c.s * c.sxk) + ',' + f2(c.s * c.syk) + ')');
      S.chipDg.setAttribute('opacity', c.dealer ? 1 : 0);
      if (c.glint > 0 && c.glint < 1) { S.chipD.glint.setAttribute('opacity', 0.75); S.chipD.glint.setAttribute('transform', 'translate(' + f1(lerp(-34, 40, c.glint)) + ',0)'); }
      else S.chipD.glint.setAttribute('opacity', 0);
    } else S.chipA.setAttribute('display', 'none');
    var lift = Math.max(0, T.y - c.y) * 0.2;
    S.vSh.setAttribute('cx', f1(c.x + 1.5 + lift * 0.4)); S.vSh.setAttribute('cy', f1(c.y + 3.5 + lift));
    S.vSh.setAttribute('r', f1(CR * c.s * Math.max(c.sxk, 1)));
    S.vSh.setAttribute('opacity', c.vis ? f1(28 * c.sh) / 100 : 0);

    // ---- light halo ----
    var K = chipKey(S), hl = seg(t, 5520, 5650) * (1 - seg(t, 5940, 6060));
    if (hl > 0) {
      var hc = [c.x, c.y];
      S.halo.setAttribute('cx', f1(hc[0])); S.halo.setAttribute('cy', f1(hc[1]));
      S.halo.setAttribute('r', f1(40 * eo(hl) + 2 * Math.sin(t * 0.01))); S.halo.setAttribute('opacity', f1(70 * hl) / 100);
      var rd = '', ra = t * 0.0012;
      for (var k = 0; k < 12; k++) {
        var a = ra + k * Math.PI / 6, r0 = 44 + 2 * Math.sin(t * 0.012 + k), r1 = r0 + (k % 2 ? 7 : 12) * hl;
        rd += 'M' + P(hc[0] + Math.cos(a) * r0, hc[1] + Math.sin(a) * r0) + 'L' + P(hc[0] + Math.cos(a) * r1, hc[1] + Math.sin(a) * r1);
      }
      S.rays.setAttribute('d', rd); S.rays.setAttribute('opacity', f1(90 * hl) / 100);
    } else { S.halo.setAttribute('opacity', 0); S.rays.setAttribute('opacity', 0); }

    // ---- sparkles ----
    var sd = '';
    function burst(t0, pt, n, R, size, dur, rot0, r0) {
      var p = seg(t, t0, t0 + (dur || 420));
      if (p <= 0 || p >= 1) return;
      for (var i = 0; i < n; i++) {
        var a = (rot0 || 0) + i * 2 * Math.PI / n, rr = (r0 || 0) + R * eoC(p) * (i % 2 ? 0.75 : 1);
        sd += starD(pt[0] + Math.cos(a) * rr, pt[1] + Math.sin(a) * rr, size * (i % 2 ? 0.7 : 1) * Math.sin(Math.PI * Math.min(1, p * 1.25)));
      }
    }
    burst(1050, [trackH(S, 'F', 1200).x, trackH(S, 'F', 1200).y - 12], 5, 22, 5.5, 420, 0.3);
    burst(1120, [trackH(S, 'N', 1270).x, trackH(S, 'N', 1270).y - 12], 5, 22, 5.5, 420, 0.9);
    if (t >= 2660 && t < 3100) { var hp = silkPts(S, 2700, hatPose(2700, S), handN(S, 2700, hatPose(2700, S)), handF(S, 2700, hatPose(2700, S))); burst(2660, hp.TC, 6, 30, 5.5, 460, 0.2); }
    if (t >= 3100 && t < 3600) { var wn = handN(S, 3170, hatPose(3170, S)); burst(3110, wandTipW(wn), 5, 20, 5, 420, 0.5); }
    [3330, 3510, 3690].forEach(function (hit, k) {
      if (t >= hit && t < hit + 500) { var hn = handN(S, hit, hatPose(hit, S)); burst(hit, wandTipW(hn), 5 + k, 18 + 6 * k, 5.5 + k, 400 + 40 * k, k * 0.7); }
    });
    if (t >= 4160 && t < 4700) {
      var hf = handF(S, 4245, hatPose(4245, S)); burst(4240, pinchW(hf), 7, 30, 6, 460, 0.1);
      var hn2 = handN(S, 4200, hatPose(4200, S)); burst(4180, wandTipW(hn2), 5, 18, 4.5, 380, 0.6);
    }
    if (t >= 5440 && t < 5900) { var cs = chipState(S, 5460, handN(S, 5460, hatPose(5460, S)), hatPose(5460, S)); burst(5440, [cs.x, cs.y], 6, 18, 5, 460, 0.4, 28); }
    // twinkles while held to the light
    if (hl > 0) {
      for (var j = 0; j < 5; j++) {
        var ph = ((t - 5520) / 520 + j / 5) % 1, ang = j * 1.3 + 0.6;
        sd += starD(c.x + Math.cos(ang) * (30 + 9 * (j % 2)), c.y + Math.sin(ang) * (30 + 9 * (j % 2)) - 3 * ph, 4.6 * Math.sin(Math.PI * ph) * hl);
      }
    }
    burst(6290, [T.x, T.y], 6, 22, 5, 480, 0.25, 30);
    if (t >= 6380 && t < 6900) { var a1 = handN(S, 6480, hatPose(6480, S)), a2 = handF(S, 6480, hatPose(6480, S)); burst(6400, [a1.x, a1.y - 34], 4, 18, 4.5, 420, 0.2); burst(6430, [a2.x, a2.y - 34], 4, 18, 4.5, 420, 1.0); }
    S.sparks.setAttribute('d', sd);

    // ---- landing ring + ticks ----
    var rp = seg(t, 6290, 6790);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var tp = seg(t, 6290, 6560);
    if (tp > 0 && tp < 1) {
      var td = '', r0t = 27 + 9 * eoC(tp), r1t = r0t + 6 * (1 - tp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        td += 'M' + P(T.x + Math.cos(a) * r0t, T.y + Math.sin(a) * r0t) + 'L' + P(T.x + Math.cos(a) * r1t, T.y + Math.sin(a) * r1t);
      });
      S.ticks.setAttribute('d', td); S.ticks.setAttribute('opacity', f1((1 - tp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);

    // ---- puff ----
    var pp = seg(t, 6830, 7130);
    if (pp > 0 && pp < 1) {
      var di = '', dfl = '';
      var hp0 = hatPose(6830, S), cen = [HX + hp0.dx, baseY + hp0.dy - 26];
      var n0 = handN(S, 6830, hp0), f0p = handF(S, 6830, hp0);
      [[cen, 34, 7], [[n0.x, n0.y - 12], 17, 5], [[f0p.x, f0p.y - 12], 17, 5]].forEach(function (P0, gi) {
        var grow = backOut(seg(pp, 0, 0.32), 1.8), fade = eio(seg(pp, 0.35, 1));
        for (var i = 0; i < P0[2]; i++) {
          var a = i * 2 * Math.PI / P0[2] + gi, rr = P0[1] * (0.55 + 0.35 * grow + 0.25 * fade);
          var cx = P0[0][0] + Math.cos(a) * rr * 0.75, cy = P0[0][1] + Math.sin(a) * rr * 0.62 - 14 * fade;
          var r = P0[1] * 0.55 * grow * (1 - fade) * (i % 2 ? 0.85 : 1);
          if (r > 0.4) { di += circleD(cx, cy, r); dfl += circleD(cx, cy, r); }
        }
      });
      S.puffInk.setAttribute('d', di); S.puffFill.setAttribute('d', dfl);
    } else { S.puffInk.setAttribute('d', ''); S.puffFill.setAttribute('d', ''); }

    // final line
    var lp2 = seg(t, 7480, 7830);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2magichat;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2magichat = S;
    return S;
  }

  window.CCSteal2_magichat = {
    title: 'The Magician',
    blurb: 'A pair of white-gloved hands drop Nate’s chip into a top hat lined in Nick’s colour, cover it with Nick’s silk, tap it three times and whip the silk away: the hat is empty! Then they pull the chip back out, now Nick’s, and set it exactly back in its spot. Ta-da.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2magichat = S;
      var token = {};
      root.__cc2magichatToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2magichatToken !== token) { resolve(); return; }
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
