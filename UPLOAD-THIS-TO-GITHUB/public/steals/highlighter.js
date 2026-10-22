/* Closed Caption steal film: highlighter (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE HIGHLIGHTER
 *
 * A word game deserves a highlighter. A chunky felt-tip highlighter pen in Nick's colour (with a
 * paper label for a face) decides Nate's chip is "the important bit" and highlights it: the
 * translucent ink in Nick's colour soaks the chip, and it ends up as Nick's chip, same spot.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  550-1250  Camera eases in a touch (whole rows stay in frame). Others dim; Nate's chip hops nervously.
 *  900-1500  The capped highlighter hops in from the side (three hops, lean into the motion),
 *            skids to a stop beside the chip with a whip of overshoot. Blinks at us.
 * 1640-1780  Crouch and strain (eyes squeezed, teeth gritted)...
 * 1780-2250  POP: click burst, the pen springs up out of its cap; the cap spins away in a high arc
 *            and clatters onto the felt between the cards (bounce, rock). Pen watches it, winces.
 * 2350-2850  Hovering, it squints at the table like a student cramming: leans in, brows furrowed,
 *            tongue out, eyes scanning chip to chip...
 * 2850-3050  ...lands on Nate's chip: eyes pop wide, little hop. That's the important bit. (Chip flinches.)
 * 3050-3380  Lifts, leans back (anticipation), plunges the nib down at the chip's edge: squash.
 * 3380-4000  STROKE 1: one confident, slightly wobbly drag across the chip; translucent ink in
 *            Nick's colour lays down behind the nib. Tongue out, pen leaning into the drag.
 * 4000-4500  Flick off the end. It looks back... squints at the missed bottom edge. Hmm.
 * 4500-5050  STROKE 2: back across the bottom, quicker. The overlap darkens.
 * 5050-5600  Pen floats back, admires its work (beat: the chip is tinted, overlap dark, "Na" showing through).
 * 5600-6000  The ink soaks in: the stripe on the card draws into the chip, the coat settles into a clean
 *            solid chip in Nick's colour with "Ni" - pop, ring flash. (Second beat on the change.)
 * 6000-6450  The cap wiggles, hops back across in an arc and clicks onto the nib (pen flinches).
 * 6450-6950  Lands on its cap, a tiny bow (eyes closed happy).
 * 6950-7350  Glides off the way it came; camera eases back out.
 * 7350-7500  Whole table still; Nick's chip sits exactly where Nate's was.
 * 7500-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var PS = 0.95, REST = 6 * PS, HOV = 24;
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
  function bo(s) { return function (x) { return backOut(x, s); }; }
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
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini, n: n };
  }

  // ---------- build helpers ----------
  function makeChip(parent, color, txt) {
    var g = el('g', {}, parent);
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    return g;
  }
  // the cap, centred on its own middle; long axis = y, open end at -26, closed end at +26
  function makeCap(parent, C) {
    var g = el('g', {}, parent);
    var d = 'M-20.5 -26 L20.5 -26 L20.5 11 Q20.5 26 6 26 L-6 26 Q-20.5 26 -20.5 11 Z';
    el('path', { d: d, fill: C.body }, g);
    el('path', { d: 'M13 -26 L20.5 -26 L20.5 11 Q20.5 26 6 26 L2 26 Q13 22 13 8 Z', fill: INK, 'fill-opacity': 0.13 }, g);
    el('rect', { x: -20.5, y: -26, width: 41, height: 7, fill: C.dark }, g);
    el('path', { d: 'M-13 -14 L-13 12', stroke: '#FFFFFF', 'stroke-opacity': 0.42, 'stroke-width': 3.6, 'stroke-linecap': 'round' }, g);
    el('path', { d: d, fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-20.5 -19 L20.5 -19', stroke: INK, 'stroke-width': 1.8 }, g);
    // pocket clip
    el('path', { d: 'M17 -23 L25.5 -23 Q27.5 -23 27.5 -21 L27.5 7 Q27.5 11 24 11 Q22.5 11 22.5 9 L22.5 -16 L17 -16 Z', fill: C.dark, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    return g;
  }
  function makeEye(parent, x, y) {
    var g = el('g', { transform: 'translate(' + x + ',' + y + ')' }, parent);
    var inner = el('g', {}, g);
    el('circle', { r: 6.3, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.8 }, inner);
    var pup = el('circle', { r: 3, fill: INK }, inner);
    var gl = el('circle', { r: 1, fill: '#FFFFFF' }, inner);
    var top = el('path', { fill: PAPER, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, inner);
    var bot = el('path', { fill: PAPER, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, inner);
    var shut = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner);
    return { x: x, y: y, inner: inner, pup: pup, gl: gl, top: top, bot: bot, shut: shut };
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-highlighter-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.j < 2 ? 1 : -1;
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var C = { body: dealerC, dark: mix(dealerC, INK, 0.3), cone: mix(dealerC, '#FFFFFF', 0.55), nib: mix(dealerC, '#FFFFFF', 0.12) };
    var trow = L.rows[T.row];
    var rightmost = Math.max.apply(null, trow.chips.map(function (c) { return c.x; }));
    var HX = Math.min(rightmost + 70, 334), GY = T.y + 6, tw = -1;
    var gapY = T.row < L.rows.length - 1 ? trow.y + trow.h + L.g / 2 : trow.y - L.g / 2;
    var capX = rightmost + 70 <= 334 ? HX - 46 : clamp(HX - 76, 100, 300);
    var enterX = W + 80;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpC = el('clipPath', { id: id + 'chip', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('circle', { cx: T.x, cy: T.y, r: CR - 1.3 }, cpC);

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

    // ---- Nate's chip, with the highlighter ink under (on the card) and over (on the chip) ----
    var inkC = dealerC;
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, cam);
    var inkCard = el('g', {}, cam);
    var ink1 = el('path', { fill: 'none', stroke: inkC, 'stroke-opacity': 0.5, 'stroke-width': 31, 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' }, inkCard);
    var ink2 = el('path', { fill: 'none', stroke: inkC, 'stroke-opacity': 0.5, 'stroke-width': 31, 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' }, inkCard);
    var vG = el('g', {}, cam);
    makeChip(vG, victimC, vIni);
    var vGD = el('g', { opacity: 0 }, vG); makeChip(vGD, dealerC, dIni);
    var inkChip = el('g', { 'clip-path': 'url(#' + id + 'chip)' }, cam);
    var ink1c = el('path', { fill: 'none', stroke: inkC, 'stroke-opacity': 0.55, 'stroke-width': 31, 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' }, inkChip);
    var ink2c = el('path', { fill: 'none', stroke: inkC, 'stroke-opacity': 0.55, 'stroke-width': 31, 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' }, inkChip);
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- cap (world) + shadows ----
    var capSh = el('ellipse', { rx: 22, ry: 5.5, fill: INK, opacity: 0 }, cam);
    var penSh = el('ellipse', { rx: 16, ry: 4.5, fill: INK, opacity: 0 }, cam);
    var capLow = el('g', {}, cam);            // cap when it lies on the table (under the pen)
    var capG = makeCap(capLow, C);

    // ---- the pen (local: nib tip at 0,0, axis up -y) ----
    var penG = el('g', {}, cam);
    el('rect', { x: -13, y: -147, width: 26, height: 10, rx: 3.5, fill: C.dark, stroke: INK, 'stroke-width': 2.2 }, penG);
    var barrelD = 'M-19 -130 Q-19 -140 -9 -140 L9 -140 Q19 -140 19 -130 L19 -30 L-19 -30 Z';
    el('path', { d: barrelD, fill: C.body }, penG);
    el('path', { d: 'M12.5 -134 L12.5 -32', stroke: INK, 'stroke-opacity': 0.13, 'stroke-width': 7 }, penG);
    el('path', { d: 'M-12 -132 L-12 -104 M-12 -54 L-12 -36', stroke: '#FFFFFF', 'stroke-opacity': 0.4, 'stroke-width': 3.6, 'stroke-linecap': 'round' }, penG);
    el('rect', { x: -19, y: -100, width: 38, height: 42, fill: PAPER }, penG);
    el('path', { d: 'M13 -99 L13 -59', stroke: INK, 'stroke-opacity': 0.07, 'stroke-width': 7 }, penG);
    el('path', { d: 'M-19 -100 L19 -100 M-19 -58 L19 -58', stroke: INK, 'stroke-width': 2 }, penG);
    // cone + nib
    el('path', { d: 'M-17 -30 L17 -30 L9 -15 L-9 -15 Z', fill: C.cone, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, penG);
    el('path', { d: 'M-12 -25 L12 -25', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 1.4 }, penG);
    el('path', { d: 'M-7 -15 L7 -15 L6.5 -4 L-6.5 0 Z', fill: C.nib, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, penG);
    el('path', { d: 'M-3.5 -12 L-3.5 -3', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, penG);
    el('path', { d: barrelD, fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, penG);
    // face
    var eyes = [makeEye(penG, -8.5, -82), makeEye(penG, 8.5, -82)];
    var brows = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, penG);
    var mouth = el('path', { stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, penG);
    var tongue = el('path', { d: 'M3.2 -67.2 Q3.4 -62 6 -62 Q8.6 -62 8.2 -67.6 Z', fill: '#EE7F8B', stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, penG);
    var teeth = el('g', {}, penG);
    el('rect', { x: -6, y: -70.4, width: 12, height: 5.6, rx: 1.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6 }, teeth);
    el('path', { d: 'M-6 -67.6 L6 -67.6 M-2 -70.4 L-2 -64.8 M2 -70.4 L2 -64.8', stroke: INK, 'stroke-width': 1 }, teeth);
    // cap when on the pen / in flight (above the pen)
    var capHi = el('g', {}, cam);
    var click = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var swish = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // scanning targets: the nearest other chips
    var near = L.others.slice().sort(function (a, b) { return (Math.abs(a.row - T.row) * 100 + Math.abs(a.x - T.x)) - (Math.abs(b.row - T.row) * 100 + Math.abs(b.x - T.x)); });
    var scanA = near[0] ? [near[0].x, near[0].y] : [T.x - sx * 70, T.y - 60];
    var scanB = near[1] ? [near[1].x, near[1].y] : [T.x + sx * 40, T.y + 70];

    var S = {
      opts: opts, L: L, T: T, sx: sx, tw: tw, HX: HX, GY: GY, gapY: gapY, capX: capX, enterX: enterX, C: C,
      dealerC: dealerC, victimC: victimC, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG,
      vSh: vSh, vG: vG, vGD: vGD, inkCard: inkCard, ink1: ink1, ink2: ink2, ink1c: ink1c, ink2c: ink2c, inkChip: inkChip,
      ripple: ripple, ticks: ticks, capSh: capSh, penSh: penSh, capLow: capLow, capHi: capHi, capG: capG, penG: penG,
      eyes: eyes, brows: brows, mouth: mouth, tongue: tongue, teeth: teeth, click: click, swish: swish, line: line,
      scanA: scanA, scanB: scanB
    };
    S.st = [strokeFn(S, 1), strokeFn(S, 2)];
    return S;
  }

  // ---------- the two highlighter strokes ----------
  function strokeFn(S, k) {
    var T = S.T, sx = S.sx;
    if (k === 1) {
      var A = [T.x - sx * 44, T.y - 6], B = [T.x + sx * 45, T.y - 9];
      return function (s) { return [lerp(A[0], B[0], s), lerp(A[1], B[1], s) - 3.2 * Math.sin(Math.PI * s) + 2.1 * Math.sin(s * Math.PI * 2.3 + 0.4)]; };
    }
    var A2 = [T.x + sx * 42, T.y + 11.5], B2 = [T.x - sx * 43, T.y + 9];
    return function (s) { return [lerp(A2[0], B2[0], s), lerp(A2[1], B2[1], s) + 1.4 * Math.sin(Math.PI * s) + 1.5 * Math.sin(s * Math.PI * 1.7 + 1.1)]; };
  }
  function strokeD(fn, p) {
    if (p <= 0.001) return '';
    var n = Math.max(2, Math.ceil(28 * p)), d = '';
    for (var i = 0; i <= n; i++) { var q = fn(p * i / n); d += (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1]); }
    return d;
  }
  var S1A = 3380, S1B = 4000, S2A = 4650, S2B = 5050;
  function s1p(t) { return eS(seg(t, S1A, S1B)); }
  function s2p(t) { return eS(seg(t, S2A, S2B)); }

  // ---------- pen pose: pure function of t ----------
  function penPose(S, t) {
    var sx = S.sx, tw = S.tw, HX = S.HX, GY = S.GY, T = S.T;
    var a1 = S.st[0](0), b1 = S.st[0](1), a2 = S.st[1](0), b2 = S.st[1](1);
    var x = kf([[0, S.enterX], [900, S.enterX], [1500, HX, eio], [2350, HX], [2600, HX + tw * 10], [2850, HX + tw * 16], [3000, HX + tw * 10],
      [3330, a1[0], eio], [S1A, a1[0]], [S1B, b1[0]], [4150, b1[0] + sx * 12, eo], [4450, T.x + sx * 30], [S2A, a2[0], eio], [S2B, b2[0]],
      [5200, b2[0] - sx * 12, eo], [5650, HX], [6950, HX], [7350, S.enterX, ei]], t);
    var g = kf([[0, GY], [3000, GY], [3330, a1[1]], [S1A, a1[1]], [S1B, b1[1]], [4150, b1[1] - 2], [4450, T.y + 26], [S2A, a2[1]], [S2B, b2[1]], [5200, b2[1]], [5650, GY]], t);
    if (t >= S1A && t < S1B) { var q1 = S.st[0](s1p(t)); x = q1[0]; g = q1[1]; }
    if (t >= S2A && t < S2B) { var q2 = S.st[1](s2p(t)); x = q2[0]; g = q2[1]; }
    var hv = kf([[0, REST], [1780, REST], [1960, HOV + 6, bo(1.4)], [2350, HOV], [2600, HOV - 9], [2850, HOV - 9], [2930, HOV + 10, eo], [3060, HOV + 2],
      [3250, HOV + 14], [S1A, 0, ei], [S1B, 0], [4150, HOV, eo], [4450, HOV - 4], [4540, HOV + 8], [S2A, 0, ei], [S2B, 0], [5200, HOV, eo],
      [6450, HOV], [6600, REST, ei], [7000, REST]], t);
    // hops on the way in
    var hq = seg(t, 900, 1500);
    if (hq > 0 && hq < 1) hv += 17 * Math.abs(Math.sin(3 * Math.PI * hq)) * (1 - 0.35 * hq);
    // hover bob
    var hovering = (t > 1960 && t < 3250) || (t > 4150 && t < 4500) || (t > 5200 && t < 6450);
    if (hovering) hv += 2.4 * Math.sin((t - 1960) * 0.0062);
    // little skate-hops on the way out
    var xq = seg(t, 6950, 7350);
    if (xq > 0 && xq < 1) hv += 6 * Math.abs(Math.sin(2 * Math.PI * xq));

    var rot = kf([[0, 0], [2350, 0], [2600, tw * 11], [2850, tw * 11], [2950, -tw * 3, eo], [3060, 0], [3250, -sx * 12], [S1A, -sx * 4],
      [3540, sx * 19, eo], [3940, sx * 17], [4120, -sx * 6, eo], [4300, -sx * 13], [4480, -sx * 13], [4600, sx * 10], [S2A, sx * 2],
      [4780, -sx * 20, eo], [5000, -sx * 19], [5180, sx * 5, eo], [5420, 0], [6620, 0], [6760, tw * 28, eio], [6850, tw * 28], [6960, 0, eo],
      [7100, -tw * 12], [7350, -tw * 14]], t);
    // entry lean into motion + stop whip
    if (hq > 0 && hq < 1) rot += tw * 11 * Math.sin(Math.PI * Math.min(1, hq * 1.15));
    rot += spring(t - 1500, tw * 11, 2.2, 190);
    // straining wobble, pop recoil
    rot += 1.4 * Math.sin(t * 0.3) * seg(t, 1660, 1700) * (t < 1780 ? 1 : 0);
    rot += spring(t - 1780, -sx * 6, 2.6, 170);
    // wobbly strokes
    if (t > S1A && t < S1B) rot += 3 * Math.sin((t - S1A) * 0.028) * Math.sin(Math.PI * seg(t, S1A, S1B));
    if (t > S2A && t < S2B) rot += 2.4 * Math.sin((t - S2A) * 0.034) * Math.sin(Math.PI * seg(t, S2A, S2B));
    // cap click
    rot += spring(t - 6450, sx * 4, 3, 140);

    var sq = 1;
    if (hq > 0 && hq < 1) { var c = Math.abs(Math.sin(3 * Math.PI * hq)); sq -= 0.13 * clamp(1 - c * 4) * (hq > 0.04 ? 1 : 0); sq += 0.06 * c; }
    sq += spring(t - 1500, -0.12, 3.4, 110);
    if (t >= 1600 && t < 1780) sq -= 0.17 * eio(seg(t, 1640, 1760));
    if (t >= 1780) sq += spring(t - 1780, 0.2, 3.1, 150);
    sq += 0.04 * Math.sin(Math.PI * seg(t, 2850, 3000));
    sq += spring(t - S1A, -0.13, 3.2, 110) + spring(t - S2A, -0.12, 3.2, 110);
    if (t > S1A && t < S1B) sq -= 0.05 * seg(t, S1A, S1A + 200);
    if (t > S2A && t < S2B) sq -= 0.05 * seg(t, S2A, S2A + 160);
    sq += spring(t - 4000, 0.07, 3.5, 90) + spring(t - 5050, 0.07, 3.5, 90);
    sq += spring(t - 6450, -0.14, 3.4, 120) + spring(t - 6600, -0.07, 3.6, 90);
    // bow squash
    sq -= 0.06 * Math.sin(Math.PI * seg(t, 6620, 6960));
    return { x: x, g: g, hv: hv, rot: rot, sq: sq };
  }
  function penTf(P) {
    return 'translate(' + f1(P.x) + ',' + f1(P.g - P.hv) + ') rotate(' + f1(P.rot) + ') scale(' + f2(PS * (1 + (1 - P.sq) * 0.7)) + ',' + f2(PS * P.sq) + ')';
  }
  function toWorld(P, px, py) {
    var a = P.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    var x = px * PS * (1 + (1 - P.sq) * 0.7), y = py * PS * P.sq;
    return [P.x + x * c - y * s, P.g - P.hv + x * s + y * c];
  }

  // ---------- cap pose ----------
  var POP = 1780, LAND = 2250, HOP = 6150, ON = 6450;
  function capPose(S, t) {
    var sx = S.sx, rEnd = sx * 450;
    if (t < POP || t >= ON) return { on: true };
    var P0 = penPose(S, POP), c0 = toWorld(P0, 0, -20), r0 = P0.rot;
    var rest = [S.capX, S.gapY];
    if (t < LAND) {
      var q = seg(t, POP, LAND), p = arc2(c0, rest, 120, q);
      return { x: p[0], y: p[1], rot: lerp(r0, rEnd, q), air: Math.sin(Math.PI * q) * 1.0, grd: lerp(c0[1] + 24, rest[1] + 6, q), gx: p[0], hi: true };
    }
    if (t < HOP) {
      var b = seg(t, LAND, LAND + 170), rr = rEnd + spring(t - LAND, sx * 14, 2.4, 160);
      var y = rest[1] - 9 * Math.sin(Math.PI * b);
      var wig = seg(t, 5980, 6050) * (1 - seg(t, HOP - 10, HOP));
      rr += 7 * Math.sin((t - 5980) * 0.075) * wig;
      y -= 1.5 * wig * Math.abs(Math.sin((t - 5980) * 0.075));
      return { x: rest[0], y: y, rot: rr, air: 0.1 * Math.sin(Math.PI * b), grd: rest[1] + 6, gx: rest[0], hi: false };
    }
    var P1 = penPose(S, ON), c1 = toWorld(P1, 0, -20);
    var q2 = seg(t, HOP, ON), e = eio(q2), p2 = arc2(rest, c1, 85, e);
    return { x: p2[0], y: p2[1], rot: lerp(rEnd, P1.rot, eo(q2)), air: Math.sin(Math.PI * q2), grd: lerp(rest[1] + 6, P1.g + 6, e), gx: p2[0], hi: true };
  }

  // ---------- eyes / face ----------
  function lookDir(S, t, P) {
    var E = toWorld(P, 0, -82), T = S.T, sx = S.sx;
    function capPt(tt) { var c = capPose(S, tt); return c.on ? toWorld(penPose(S, tt), 0, -20) : [c.x, c.y]; }
    function tip() { return [P.x, P.g - P.hv]; }
    var list = [
      [0, 'cam'], [900, function () { return [E[0] + S.tw * 60, E[1] + 10]; }], [1520, 'cam'],
      [POP, function () { return capPt(t); }], [2330, function () { return S.scanA; }], [2580, function () { return S.scanB; }],
      [2780, function () { return [T.x, T.y]; }], [3050, function () { var a = S.st[0](0); return a; }],
      [S1A, function () { var q = tip(); return [q[0] + sx * 34, q[1]]; }], [4050, 'cam'],
      [4180, function () { return [T.x, T.y + 18]; }], [4520, function () { return S.st[1](0); }],
      [S2A, function () { var q = tip(); return [q[0] - sx * 34, q[1]]; }], [5120, function () { return [T.x, T.y]; }],
      [6000, function () { return capPt(t); }], [ON, 'cam'], [7000, function () { return [E[0] - S.tw * 60, E[1]]; }], [7180, 'cam']];
    function dirOf(spec) {
      if (spec === 'cam') return [0, 0.15];
      var p = spec(), dx = p[0] - E[0], dy = p[1] - E[1], m = Math.hypot(dx, dy) || 1;
      return [dx / m, dy / m];
    }
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    var b = dirOf(list[k][1]);
    if (k === 0) return b;
    var a = dirOf(list[k - 1][1]), p = clamp((t - list[k][0]) / 110), qq = backOut(p, 1.2);
    return [lerp(a[0], b[0], qq), lerp(a[1], b[1], qq)];
  }
  function mouthMode(t) {
    var m = [[0, 'smile'], [1640, 'grit'], [POP, 'o'], [2240, 'flat'], [2400, 'tongue'], [2840, 'o'], [3050, 'grin'], [3330, 'tongue'],
      [4050, 'wiggle'], [4560, 'tongue'], [5100, 'smile'], [5700, 'o'], [5950, 'grin'], [6250, 'smile'], [6440, 'grit'], [6560, 'grin'], [6990, 'smile']];
    var r = 'smile';
    for (var i = 0; i < m.length; i++) if (t >= m[i][0]) r = m[i][1];
    return r;
  }
  var MOUTH = {
    smile: ['M-5 -68.5 Q0 -63.5 5 -68.5', 'none'],
    grin: ['M-6.5 -69.5 Q0 -69 6.5 -69.5 Q5 -62 0 -62 Q-5 -62 -6.5 -69.5 Z', INK],
    flat: ['M-4 -67 L4 -67', 'none'],
    o: [null, INK],
    grit: ['', 'none'],
    tongue: ['M-4.5 -67 Q0 -66.4 4.5 -67.8', 'none'],
    wiggle: ['M-5.5 -67 Q-2.7 -69.5 0 -67 Q2.7 -64.5 5.5 -67', 'none']
  };
  function face(S, t, P) {
    var top = kf([[0, 0.15], [1500, 0.15], [1540, 1], [1600, 0.15], [1650, 0.15], [1700, 1], [1790, 1], [1850, 0], [2200, 0.05], [2250, 0.65], [2320, 0.1],
      [2420, 0.56], [2800, 0.56], [2850, -0.1], [3000, -0.1], [3100, 0.22], [3330, 0.42], [4000, 0.42], [4080, 0.08], [4200, 0.52], [4440, 0.52],
      [4540, 0.2], [S2A, 0.42], [S2B, 0.42], [5150, 0.1], [5300, 0.36], [5600, 0.36], [5700, -0.1], [5950, -0.05], [6050, 0.15],
      [6430, 0.15], [6460, 1], [6540, 1], [6580, 0.18], [6660, 0.18], [6720, 1], [6960, 1], [7030, 0.15]], t);
    var bot = kf([[0, 0], [2350, 0], [2420, 0.3], [2800, 0.3], [2850, 0], [4150, 0], [4200, 0.3], [4450, 0.3], [4540, 0], [5250, 0], [5300, 0.3], [5600, 0.3], [5680, 0]], t);
    var big = 1 + 0.16 * (Math.sin(Math.PI * seg(t, 2830, 3080)) + Math.sin(Math.PI * seg(t, 5680, 6000)) + 0.7 * Math.sin(Math.PI * seg(t, 1800, 2000)));
    var shutStyle = (t >= 6700 && t < 6990) ? 'happy' : ((t >= 1680 && t < 1800) || (t >= 6440 && t < 6560)) ? 'squeeze' : 'blink';
    var dir = lookDir(S, t, P), a = -P.rot * Math.PI / 180;
    var lx = dir[0] * Math.cos(a) - dir[1] * Math.sin(a), ly = dir[0] * Math.sin(a) + dir[1] * Math.cos(a);
    S.eyes.forEach(function (e, i) {
      e.inner.setAttribute('transform', 'scale(' + f2(big) + ')');
      e.pup.setAttribute('cx', f1(lx * 2.6)); e.pup.setAttribute('cy', f1(ly * 2.6));
      e.gl.setAttribute('cx', f1(lx * 2.6 - 1)); e.gl.setAttribute('cy', f1(ly * 2.6 - 1));
      var r = 6.5, tp = clamp(top, 0, 1), bt = clamp(bot, 0, 1);
      if (tp + bt >= 0.97) {
        e.top.setAttribute('d', circleD(0, 0, r)); e.bot.setAttribute('d', '');
        var sd = shutStyle === 'happy' ? 'M-4.2 1.4 Q0 -3.6 4.2 1.4' : shutStyle === 'squeeze' ? (i === 0 ? 'M-3.4 -2.8 L2.6 0 L-3.4 2.8' : 'M3.4 -2.8 L-2.6 0 L3.4 2.8') : 'M-4.6 0.4 Q0 2.6 4.6 0.4';
        e.shut.setAttribute('d', sd);
        return;
      }
      e.shut.setAttribute('d', '');
      if (tp <= 0.02) e.top.setAttribute('d', '');
      else { var c = -r + 2 * r * tp, dx = Math.sqrt(Math.max(0, r * r - c * c)); e.top.setAttribute('d', 'M' + f1(-dx) + ' ' + f1(c) + 'A' + r + ' ' + r + ' 0 ' + (c > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(c) + 'Z'); }
      if (bt <= 0.02) e.bot.setAttribute('d', '');
      else { var c2 = r - 2 * r * bt, dx2 = Math.sqrt(Math.max(0, r * r - c2 * c2)); e.bot.setAttribute('d', 'M' + f1(dx2) + ' ' + f1(c2) + 'A' + r + ' ' + r + ' 0 ' + (c2 < 0 ? 1 : 0) + ' 1 ' + f1(-dx2) + ' ' + f1(c2) + 'Z'); }
    });
    // brows: + = furrowed (inner ends down), - = raised
    var tilt = kf([[0, 0], [1650, 0], [1700, 0.9], [1790, 0.9], [1830, -0.8], [2200, -0.3], [2400, 1], [2800, 1], [2850, -1.2], [3050, -0.5], [3330, 0.6],
      [4000, 0.6], [4100, -0.2], [4200, 0.4], [4450, 0.4], [4540, 0.6], [S2B, 0.6], [5150, -0.3], [5400, -0.2], [5700, -1.1], [6000, -0.4],
      [6440, -0.3], [6470, 0.9], [6560, -0.3], [7000, -0.3]], t);
    var by = -91.5 + Math.max(0, tilt) * 1.6 + Math.min(0, tilt) * 2.2, k = Math.max(-0.4, tilt) * 2.2;
    // "hmm": one brow up while it spots the missed edge
    var hm = Math.sin(Math.PI * seg(t, 4180, 4480)) * 2.6;
    S.brows.setAttribute('d', 'M-13 ' + f1(by - k - (S.sx > 0 ? hm : 0)) + 'L-4.5 ' + f1(by + k - (S.sx > 0 ? hm * 0.4 : 0)) +
      'M4.5 ' + f1(by + k - (S.sx < 0 ? hm * 0.4 : 0)) + 'L13 ' + f1(by - k - (S.sx < 0 ? hm : 0)));
    var mm = mouthMode(t), M = MOUTH[mm];
    if (mm === 'o') { var ro = 2.6 + 0.6 * Math.sin(t * 0.02); S.mouth.setAttribute('d', 'M-2.4 -67a2.4 ' + f1(ro) + ' 0 1 0 4.8 0a2.4 ' + f1(ro) + ' 0 1 0 -4.8 0Z'); }
    else S.mouth.setAttribute('d', M[0]);
    S.mouth.setAttribute('fill', M[1]);
    S.tongue.setAttribute('display', mm === 'tongue' ? 'inline' : 'none');
    S.tongue.setAttribute('transform', mm === 'tongue' ? 'rotate(' + f1(6 * Math.sin(t * 0.012)) + ' 5.5 -67)' : '');
    S.teeth.setAttribute('display', mm === 'grit' ? 'inline' : 'none');
  }

  function burst(path, cx, cy, p, r0, r1, angs, sy) {
    if (p <= 0 || p >= 1) { path.setAttribute('opacity', 0); return; }
    var d = '', a = r0 + r1 * eoC(p), b = a + 7 * (1 - p);
    angs.forEach(function (an) {
      d += 'M' + f1(cx + Math.cos(an) * a) + ' ' + f1(cy + Math.sin(an) * a * (sy || 1)) + 'L' + f1(cx + Math.cos(an) * b) + ' ' + f1(cy + Math.sin(an) * b * (sy || 1));
    });
    path.setAttribute('d', d); path.setAttribute('opacity', f1((1 - ei(p)) * 95) / 100);
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, sx = S.sx;

    // camera: gentle push-in that keeps whole rows (and the pen) in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6950, 7350)));
    var Z = lerp(1, 1.12, zk);
    var fy = clamp(T.y + 150, 245, 330);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 6950, 7350)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      // a glance from the cramming pen makes a chip sit up a little
      var gl = 0;
      if (S.scanA[0] === o.c.x && S.scanA[1] === o.c.y) gl = Math.sin(Math.PI * seg(t, 2380, 2560));
      if (S.scanB[0] === o.c.x && S.scanB[1] === o.c.y) gl = Math.sin(Math.PI * seg(t, 2630, 2800));
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + f1(o.c.y - 2.5 * gl) + ') scale(' + (sc * (1 + 0.04 * gl)).toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim + 0.35 * gl * dim).toFixed(3));
    });

    // ---- Nate's chip ----
    var vx = T.x, vy = T.y, vs = chipPop(T), vsx = 1, vsy = 1;
    var nh = seg(t, 650, 980);
    vy -= 5 * Math.sin(Math.PI * seg(t, 650, 820));
    vx += 1.8 * Math.sin((t - 650) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
    vs *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 820));
    // spotted: flinch
    var fl = seg(t, 2860, 3060);
    vy -= 4 * Math.sin(Math.PI * fl);
    vx += 1.4 * Math.sin((t - 2860) * 0.2) * (fl > 0 && fl < 1 ? 1 - fl : 0);
    // nib pressure
    var pr = spring(t - S1A, 0.05, 3, 90) + spring(t - S2A, 0.05, 3, 90);
    vsx += pr; vsy -= pr;
    // clean coat pop
    var cp = t - 5850;
    var pop = cp > 0 ? Math.exp(-cp / 90) * Math.sin(Math.PI * clamp(cp / 140)) : 0;
    vsx += 0.12 * pop; vsy -= 0.1 * pop;
    var wob = cp > 0 ? 0.06 * Math.exp(-cp / 200) * clamp(cp / 60) * (cp > 140 ? 1 : 0) : 0;
    if (wob > 0.002) {
      var wa = (cp) * 0.02;
      S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(wa * 57.3) + ') scale(' + f2(1 + wob) + ',' + f2(1 - wob) + ') rotate(' + f1(-wa * 57.3) + ')');
    } else S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') scale(' + f2(vs * vsx) + ',' + f2(vs * vsy) + ')');
    S.vSh.setAttribute('cx', f1(vx + 1.5)); S.vSh.setAttribute('cy', f1(T.y + 3.5 + (T.y - vy) * 0.3));
    S.vSh.setAttribute('r', f1(CR * Math.min(1.04, vs)));
    var coat = eio(seg(t, 5650, 5900));
    S.vGD.setAttribute('opacity', f2(coat));

    // ---- ink ----
    var p1 = t >= S1B ? 1 : t >= S1A ? s1p(t) : 0, p2 = t >= S2B ? 1 : t >= S2A ? s2p(t) : 0;
    var d1 = strokeD(S.st[0], p1), d2 = strokeD(S.st[1], p2);
    S.ink1.setAttribute('d', d1); S.ink1c.setAttribute('d', d1);
    S.ink2.setAttribute('d', d2); S.ink2c.setAttribute('d', d2);
    // soak in: the stripe on the card draws into the chip and fades
    var soak = eio(seg(t, 5600, 5950));
    var cardA = 1 - eio(seg(t, 5620, 5980));
    S.inkCard.setAttribute('transform', soak > 0 ? 'translate(' + T.x + ',0) scale(' + f2(lerp(1, 0.45, soak)) + ',' + f2(lerp(1, 0.85, soak)) + ') translate(' + (-T.x) + ',' + f1(soak * T.y * 0.15 / 0.85 * 0) + ')' : '');
    S.inkCard.setAttribute('opacity', f2(cardA));
    S.inkCard.setAttribute('display', cardA > 0.005 && t >= S1A ? 'inline' : 'none');
    S.inkChip.setAttribute('opacity', f2(1 - coat));
    S.inkChip.setAttribute('display', coat < 0.995 && t >= S1A ? 'inline' : 'none');

    var rp = seg(t, 5850, 6350);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    burst(S.ticks, T.x, T.y, seg(t, 5850, 6120), 27, 9, [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75, 0.8, 1.6]);

    // ---- pen ----
    var P = penPose(S, t);
    S.penG.setAttribute('transform', penTf(P));
    face(S, t, P);
    var penOn = t >= 880 && t < 7360;
    S.penG.setAttribute('display', penOn ? 'inline' : 'none');
    var tipW = toWorld(P, 0, 0);
    var hgt = Math.max(0, P.g - tipW[1]);
    S.penSh.setAttribute('cx', f1(tipW[0] + 3)); S.penSh.setAttribute('cy', f1(P.g + 2));
    S.penSh.setAttribute('rx', f1(lerp(19, 9, clamp(hgt / 40))));
    S.penSh.setAttribute('opacity', penOn ? f1(lerp(26, 10, clamp(hgt / 40))) / 100 : 0);

    // ---- cap ----
    var C = capPose(S, t);
    if (C.on) {
      if (S.capG.parentNode !== S.capHi) S.capHi.appendChild(S.capG);
      S.capG.setAttribute('transform', penTf(P) + ' translate(0,-20)');
      S.capG.setAttribute('display', penOn ? 'inline' : 'none');
      S.capSh.setAttribute('opacity', 0);
    } else {
      var par = C.hi ? S.capHi : S.capLow; if (S.capG.parentNode !== par) par.appendChild(S.capG);
      S.capG.setAttribute('display', 'inline');
      S.capG.setAttribute('transform', 'translate(' + f1(C.x) + ',' + f1(C.y) + ') rotate(' + f1(C.rot) + ') scale(' + PS + ')');
      S.capSh.setAttribute('cx', f1(C.gx + 2)); S.capSh.setAttribute('cy', f1(C.grd + 3));
      S.capSh.setAttribute('rx', f1(22 * (1 - 0.45 * C.air)));
      S.capSh.setAttribute('opacity', f1(24 * (1 - 0.7 * C.air)) / 100);
    }

    // click bursts (pop off, cap back on) + clatter on landing
    var cj;
    if (t < 3000) { cj = toWorld(penPose(S, POP), 0, -44); burst(S.click, cj[0], cj[1], seg(t, POP, POP + 260), 22, 12, [Math.PI, 0, -0.5, -2.64, 0.5, 2.64]); }
    else if (t < 6200) burst(S.click, S.capX, S.gapY, seg(t, LAND, LAND + 240), 26, 8, [-2.8, -2.3, -0.84, -0.34], 0.7);
    else { cj = toWorld(penPose(S, ON), 0, -44); burst(S.click, cj[0], cj[1], seg(t, ON, ON + 260), 22, 12, [Math.PI, 0, -0.5, -2.64, 0.5, 2.64]); }

    // final line
    var lp2 = seg(t, 7500, 7850);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2highlighter;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2highlighter = S;
    return S;
  }

  window.CCSteal2_highlighter = {
    title: 'The Highlighter',
    blurb: 'A chunky highlighter in Nick’s colour pops its cap, squints at the table like a student cramming, decides Nate’s chip is the important bit and highlights it in two wobbly strokes until it’s Nick’s chip.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2highlighter = S;
      var token = {};
      root.__cc2highlighterToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2highlighterToken !== token) { resolve(); return; }
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
