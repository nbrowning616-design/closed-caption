/* Closed Caption - "steal" moment - concept: THE WINNER'S JACKET (key: putt)
 *
 * Golf. Nate's chip lines up the putt of its life, lips out, gets a little
 * "help" from the dealer's chip... and the champion's blazer it is so proudly
 * draped in turns out to be in Nick's colour. It buttons up and it is Nick's.
 *
 * Storyboard (ms) - top-down felt table, caption rows 1/2/3/CC.
 *    0- 700  Table deals in: rows drop with a soft overshoot, chips pop on.
 *  550-1250  Gentle push-in on the target row (row + neighbours stay in frame).
 *  900-1450  Others dim. Nate's chip comes alive: eyes pop, stubby arms & legs,
 *            it glances back, then forward.
 * 1150-1800  A putting green unrolls from its feet along the row; the cup sinks
 *            in and a little flag springs up. A ball drops and bounces to rest.
 * 1700-1950  A putter spins in from above - caught one-handed.
 * 1950-2400  READS THE GREEN: crouches and plumb-bobs - putter held out at arm's
 *            length, one eye shut, the other squinting down the line.
 * 2400-2900  Licks a finger, holds it up to test the wind; glances at the flag
 *            (it flutters); a satisfied nod.
 * 2900-3470  Address, two waggles, slow backswing, pause... stroke (click).
 * 3470-4150  The ball rolls, slowing; the chip leans after it (body English).
 * 4150-4560  It reaches the cup, circles the rim one and a half times... and
 *            LIPS OUT, stopping dead on the edge.
 * 4560-5000  Agony: hand to head, mouth wide; then a full-body lean, one leg up,
 *            pleading with the ball.
 * 5000-5480  THE GAG: Nick's chip peeks in from off the edge, puffs its cheeks
 *            and blows. The flag whips round, the ball drops (plop). Nick's chip
 *            glances at camera, all innocence, and ducks away.
 * 5350-5950  Nate's chip goes wild: two leaps (the second a full twirl), putter
 *            hurled skyward.
 * 5680-6330  Nick's chip scurries back in holding a champion's blazer - in Nick's
 *            colour - over its head, and ceremonially drapes it over Nate's chip.
 * 6330-6600  Nate's chip preens: hands on lapels, chest out. Nick's chip applauds.
 * 6600-6960  It buttons up: the lapels close and the coat fits like a whole new
 *            chip - Nick's colour all over, Nick's initial stitched onto the chest,
 *            a polish glint. (beat)  Nick's chip winks at camera and leaves.
 * 6850-7250  Flag and cup pop away, the green rolls itself up; limbs and face
 *            tuck in; the chip lifts and plonks into exactly its spot (ring, dust).
 * 7250-7500  Stillness; camera eases back.
 * 7500-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var G1 = '#8BC95C', G2 = '#97D269', GF = '#5F9F46', GR = '#6FB04C', FLAG = '#F4BE3E';
  var STEEL = '#B9C1C9', STEEL2 = '#8C969F';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000, ZM = 1.08, PL = 26;
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
  function damp(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.cos(2 * Math.PI * hz * dt / 1000); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f3(v) { return Math.round(v * 1000) / 1000; }
  function P2(x, y) { return f1(x) + ' ' + f1(y); }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  // scheduled transitions: [[t0, value], [tStart, value, dur, ease?], ...]; values may be numbers or [x, y]
  function sched(list, t) {
    var cur = list[0][1];
    for (var i = 1; i < list.length; i++) {
      var it = list[i];
      if (t <= it[0]) break;
      var p = (it[3] || eoC)(clamp((t - it[0]) / (it[2] || 1)));
      if (typeof cur === 'number') cur = lerp(cur, it[1], p);
      else cur = [lerp(cur[0], it[1][0], p), lerp(cur[1], it[1][1], p)];
    }
    return cur;
  }
  function hexRGB(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mixC(a, b, t) { return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')'; }

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
    var T = target, dir = T.j < 2 ? 1 : -1;
    var HX = dir > 0 ? 322 : 116, LY = T.y + 38;
    return {
      rows: rows, target: T, others: others, h: h, ini: ini, dir: dir, HX: HX, LY: LY,
      B0: [T.x + dir * 19, LY],
      EXP: dir > 0 ? 364 : 18,            // where Nick's chip peeks in (half off-screen)
      NP: [T.x + dir * 50, T.y + 6],      // where it stands to present the blazer
      gx0: dir > 0 ? T.x - 34 : HX - 32, gx1: dir > 0 ? HX + 32 : T.x + 34, gy0: T.y + 13, gy1: T.y + 62
    };
  }

  // ---------- choreography (x values are "toward the hole" = +) ----------
  var N = {
    life: [[0, 0], [900, 1, 260, eoC], [6980, 0, 130, eio]],
    hb: [[0, [-27, 12]], [1840, [-25, 6], 100], [1950, [-14, 19], 120], [2400, [-24, 10], 90], [2440, [-6, 4], 110],
      [2620, [-23, -30], 120], [2900, [8, 12], 140], [3150, [3, 12], 250, eio], [3420, [10, 12], 45, ei], [3470, [15, 9], 90],
      [4560, [-12, -22], 110], [4800, [-29, -6], 140], [5350, [-22, -32], 100], [5950, [-26, 10], 150], [6090, [-30, 0], 100],
      [6380, [-12, -6], 140], [6600, [-3, 10], 160], [6800, [-17, 9], 130]],
    hf: [[0, [27, 12]], [1840, [24, -6], 80], [1950, [32, -6], 120], [2400, [25, 8], 100], [2900, [11, 12], 140],
      [3150, [6, 12], 250, eio], [3420, [11, 12], 45, ei], [3470, [16, 9], 90], [4560, [14, -22], 110], [4800, [30, -4], 140],
      [5350, [22, -33], 100], [5950, [26, 10], 150], [6090, [30, 0], 100], [6380, [12, -6], 140], [6600, [3, 10], 160], [6800, [17, 9], 130]],
    th: [[0, 0], [3150, -34, 250, eio], [3420, 0, 45, ei], [3466, 28, 100, eoC], [4560, 0, 160], [4800, 70, 140], [5350, 180, 140]],
    dy: [[0, 0], [1950, 4, 120], [2400, 0, 100], [2900, 2, 140], [4560, 3, 100], [4800, 1, 100], [5950, 0, 100]],
    rot: [[0, 0], [1950, 4, 120], [2400, 0, 100], [2500, -4, 120], [2720, 0, 150], [2900, 2, 140], [3150, -3, 250, eio], [3420, 4, 60],
      [3560, 10, 500, eio], [4150, 14, 250], [4200, 6, 250], [4560, -3, 100], [4800, 16, 150], [5300, 0, 80]],
    sx: [[0, 1], [1950, 1.07, 120], [2400, 1, 100], [4560, 1.04, 100], [4800, 1, 100], [6380, 1.05, 140], [6800, 1, 150]],
    sy: [[0, 1], [1950, 0.88, 120], [2400, 1, 100], [2900, 0.97, 140], [3480, 1, 200], [4560, 0.9, 100], [4800, 1, 100], [6090, 1.03, 100], [6800, 1, 150]],
    look: [[0, [0, 0]], [1220, [-0.9, -0.2], 120], [1420, [0.9, -0.1], 140], [1600, [1, 0.3], 120], [1700, [0.5, -1], 90],
      [1790, [0.6, 0.9], 90], [1860, [0.5, -1], 70], [1960, [1, 0.1], 120], [2420, [0, 0.3], 100], [2640, [-0.8, -1], 120],
      [2790, [0.9, -0.9], 110], [2900, [0.5, 0.9], 140], [3480, [0.9, 0.5], 150], [4150, [1, 0.3], 150], [4560, [1, 0.2], 100],
      [5380, [0, 0], 80], [5980, [1, 0], 120], [6380, [0, 0], 120], [6620, [0, 1], 140], [6820, [0, 0.1], 140]],
    hap: [[0, 0], [5380, 1, 80], [5950, 0, 100], [6380, 1, 120], [6600, 0, 100], [6800, 1, 120]],
    sqz: [[0, 0], [1950, 1, 110], [2400, 0, 100]],
    wide: [[0, 0], [4150, 0.3, 150], [4560, 0.2, 100], [4800, 0, 100], [5300, 0.6, 50], [5380, 0, 60], [5980, 0.35, 80], [6380, 0, 100]],
    browR: [[0, 0], [1150, 0.4, 120], [1450, 0, 150], [4150, 0.8, 150], [4560, 1, 100], [4800, 0.1, 100], [5300, 1, 60], [5950, 0.3, 100], [6380, 0, 100]],
    browK: [[0, 0], [1950, 1, 100], [2400, 0, 100], [2640, 0.5, 100], [2830, -0.2, 80], [2900, 0.7, 100], [3480, 0, 120], [4560, -1, 100], [4800, 0.9, 120], [5300, 0, 60]],
    mS: [[0, 0.6], [1950, -0.2, 100], [2400, 0.2, 100], [2830, 0.8, 80], [2900, 0, 100], [3480, 0.3, 100], [4150, 0, 150], [4800, -0.6, 120], [5300, 0, 60], [6090, 0.9, 120]],
    mO: [[0, 0], [4150, 0.45, 300], [4560, 1, 90], [4800, 0, 100], [5300, 0.9, 40], [5380, 0, 60], [5980, 0.5, 80], [6090, 0, 100]],
    mG: [[0, 0], [5380, 1, 80], [5950, 0.6, 100], [6090, 0, 100]]
  };
  var BLINKS = [1330, 3000, 6000];


  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-putt-' + (++uid) + '-';
    var L = layout(opts), T = L.target, DC = opts.dealerColor || '#E8559E', VC = T.color || opts.victimColor || '#2F6FE0';
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cc = mk('clipPath', { id: id + 'chip', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('circle', { cx: 0, cy: 0, r: CR }, cc);
    var gc = mk('clipPath', { id: id + 'green', clipPathUnits: 'userSpaceOnUse' }, defs);
    var gClip = mk('rect', { x: 0, y: L.gy0 - 6, width: 0, height: L.gy1 - L.gy0 + 12 }, gc);
    var sc = mk('clipPath', { id: id + 'stitch', clipPathUnits: 'userSpaceOnUse' }, defs);
    var stClip = mk('rect', { x: -16, y: -14, width: 0, height: 28 }, sc);

    mk('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = mk('g', {}, svg);
    var tableG = mk('g', {}, cam);
    mk('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    mk('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    mk('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    function chipParts(parent, color, txt) {
      var g = mk('g', {}, parent);
      mk('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
      mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
      mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
      var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
      tx.textContent = txt;
      return g;
    }

    var rowsG = [], chipsG = [];
    var cardLayer = mk('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = mk('g', {}, cardLayer);
      mk('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      mk('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      mk('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = mk('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
    });

    // ---- the putting green (a mat under the chips) ----
    var greenL = mk('g', {}, cam);
    var gw = L.gx1 - L.gx0, gh = L.gy1 - L.gy0;
    var gShadow = mk('rect', { x: L.gx0 + 1, y: L.gy0 + 4, width: gw, height: gh, rx: 24, fill: INK, opacity: 0.22, 'clip-path': 'url(#' + id + 'green)' }, greenL);
    var gIn = mk('g', { 'clip-path': 'url(#' + id + 'green)' }, greenL);
    mk('rect', { x: L.gx0, y: L.gy0, width: gw, height: gh, rx: 24, fill: G1, stroke: INK, 'stroke-width': 2.4 }, gIn);
    var stripes = mk('g', {}, gIn);
    var stripeClip = mk('clipPath', { id: id + 'gin', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('rect', { x: L.gx0 + 5, y: L.gy0 + 5, width: gw - 10, height: gh - 10, rx: 19 }, stripeClip);
    stripes.setAttribute('clip-path', 'url(#' + id + 'gin)');
    for (var sx = L.gx0; sx < L.gx1; sx += 28) mk('rect', { x: sx, y: L.gy0, width: 14, height: gh, fill: G2 }, stripes);
    mk('rect', { x: L.gx0 + 2.5, y: L.gy0 + 2.5, width: gw - 5, height: gh - 5, rx: 21.5, fill: 'none', stroke: GF, 'stroke-width': 4 }, gIn);
    mk('rect', { x: L.gx0, y: L.gy0, width: gw, height: gh, rx: 24, fill: 'none', stroke: INK, 'stroke-width': 2.4 }, gIn);
    var tube = mk('g', {}, greenL);
    mk('rect', { x: -6, y: L.gy0 - 3, width: 12, height: gh + 6, rx: 6, fill: GR, stroke: INK, 'stroke-width': 2.2 }, tube);
    mk('path', { d: 'M-2 ' + (L.gy0 + 2) + 'V' + (L.gy1 - 2), stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 2, 'stroke-linecap': 'round' }, tube);

    // cup
    var hole = mk('g', {}, greenL);
    mk('ellipse', { rx: 8.5, ry: 5.6, fill: '#3D7A35' }, hole);
    mk('ellipse', { rx: 7.5, ry: 4.8, fill: '#231C17', stroke: INK, 'stroke-width': 1.4 }, hole);
    mk('path', { d: 'M-6 1.6Q0 4.8 6 1.6', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.25, 'stroke-width': 1.2 }, hole);
    var plop = mk('ellipse', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0 }, greenL);

    // chips
    var shadowLayer = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
    L.rows.forEach(function (r) {
      r.chips.forEach(function (c) {
        if (c.target) return;
        var wrap = mk('g', {}, chipLayer);
        var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        var g = chipParts(wrap, c.color, c.ini);
        chipsG.push({ wrap: wrap, g: g, sh: sh, c: c });
      });
    });

    // ---- character builder (eyes, mouth, limbs) ----
    function limb(parent, col) {
      var g = mk('g', {}, parent);
      return {
        g: g,
        ink: mk('path', { fill: 'none', stroke: INK, 'stroke-width': 6.6, 'stroke-linecap': 'round' }, g),
        col: mk('path', { fill: 'none', stroke: col, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g),
        end: mk('ellipse', { rx: 3.6, ry: 3.6, stroke: INK, 'stroke-width': 1.6, fill: col }, g)
      };
    }
    function eyesFor(parent, ex) {
      return [-1, 1].map(function (sd) {
        var g = mk('g', {}, parent);
        return {
          sd: sd, cx: sd * ex,
          white: mk('ellipse', { cx: sd * ex, cy: -6, rx: 3.7, ry: 4.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.5 }, g),
          pup: mk('ellipse', { rx: 2.1, ry: 2.3, fill: INK }, g),
          glint: mk('circle', { r: 0.75, fill: '#FFFFFF' }, g),
          lid: mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g),
          shut: mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
        };
      });
    }

    // ---- Nate's chip ----
    var natWrap = mk('g', {}, chipLayer);
    var nSh = mk('ellipse', { rx: CR, ry: CR, fill: INK, opacity: 0.28 }, shadowLayer);
    var nat = mk('g', {}, natWrap);
    var legs = [limb(nat, VC), limb(nat, VC)];
    mk('circle', { r: CR, fill: VC, stroke: INK, 'stroke-width': 2.6 }, nat);
    mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, nat);
    mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, nat);
    var txtV = mk('g', {}, nat);
    var tv = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': T.ini.length > 1 ? 15 : 18 }, txtV);
    tv.textContent = T.ini;
    // the fitted coat
    var coat = mk('circle', { r: CR, fill: DC, stroke: INK, 'stroke-width': 2.6, opacity: 0 }, nat);
    function blazer(parent) {
      var g = mk('g', {}, parent);
      mk('path', { d: 'M-15 -23.5L15 -23.5Q25 -23 26.5 -12Q28 4 22 16Q13 27 0 27.5Q-13 27 -22 16Q-28 4 -26.5 -12Q-25 -23 -15 -23.5Z', fill: INK, opacity: 0.2, transform: 'translate(1,3)' }, g);
      mk('path', { d: 'M-15 -23.5L15 -23.5Q25 -23 26.5 -12Q28 4 22 16Q13 27 0 27.5Q-13 27 -22 16Q-28 4 -26.5 -12Q-25 -23 -15 -23.5Z', fill: DC, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, g);
      mk('path', { d: 'M-21 -16Q-19 -20 -14 -21', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      var v = mk('g', {}, g);            // the open front (scaled shut when it buttons up)
      mk('path', { d: 'M-9.5 -23.5L0 6L9.5 -23.5Z', fill: VC, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, v);
      mk('path', { d: 'M-9.5 -23.5L-15 -21L-11 -9L-14 -7L0 6M9.5 -23.5L15 -21L11 -9L14 -7L0 6', fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, v);
      mk('path', { d: 'M-9.5 -23.5L-15 -21L-11 -9L-14 -7L0 6ZM9.5 -23.5L15 -21L11 -9L14 -7L0 6Z', fill: '#FFFFFF', 'fill-opacity': 0.16 }, v);
      mk('circle', { cx: 0, cy: 12, r: 2, fill: FLAG, stroke: INK, 'stroke-width': 1.2 }, g);
      mk('circle', { cx: 0, cy: 19, r: 2, fill: FLAG, stroke: INK, 'stroke-width': 1.2 }, g);
      mk('path', { d: 'M15 -6L22 -6L21 -1L16 -1Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, g);
      mk('path', { d: 'M-20 7H-12M20 7H12M-5 27.2L0 22L5 27.2', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': 0.7 }, g);
      return { g: g, v: v };
    }
    var blzL = blazer(nat);
    var topG = mk('g', { opacity: 0 }, nat);
    mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, topG);
    mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, topG);
    var dIni = L.ini(opts.dealer);
    var txtD = mk('g', {}, nat);
    var tdS = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.3, 'stroke-dasharray': '1.8 1.3', 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 15 : 18, 'clip-path': 'url(#' + id + 'stitch)' }, txtD);
    tdS.textContent = dIni;
    var tdF = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 15 : 18, opacity: 0 }, txtD);
    tdF.textContent = dIni;
    var shimG = mk('g', { 'clip-path': 'url(#' + id + 'chip)' }, nat);
    var shimmer = mk('rect', { x: -40, y: -40, width: 8, height: 80, fill: '#FFFFFF', opacity: 0 }, shimG);
    var face = mk('g', {}, nat);
    var nEyes = eyesFor(face, 6.9);
    var nBrows = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round' }, face);
    var nMouth = mk('path', { fill: INK, stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, face);
    var nTongue = mk('ellipse', { rx: 2.2, ry: 2.6, fill: '#F07C8E', stroke: INK, 'stroke-width': 1.1, opacity: 0 }, face);
    var putter = mk('g', {}, nat);
    mk('path', { d: 'M0 2V' + PL, stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round' }, putter);
    mk('path', { d: 'M0 2V' + PL, stroke: STEEL, 'stroke-width': 1.7, 'stroke-linecap': 'round' }, putter);
    mk('path', { d: 'M0 -3V7', stroke: INK, 'stroke-width': 4.6, 'stroke-linecap': 'round' }, putter);
    var pHead = mk('rect', { y: PL - 1.5, width: 10, height: 5, rx: 2, fill: STEEL2, stroke: INK, 'stroke-width': 1.5 }, putter);
    var arms = [limb(nat, VC), limb(nat, VC)];
    var finger = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round', opacity: 0 }, nat);
    var fingerC = mk('path', { fill: 'none', stroke: VC, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, nat);

    // ball (over the chips, it sits in front of the feet)
    var ballG = mk('g', {}, cam);
    var ballSh = mk('ellipse', { rx: 4.4, ry: 2.2, fill: INK, opacity: 0.25 }, ballG);
    var ball = mk('g', {}, ballG);
    mk('circle', { r: 4.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6 }, ball);
    var ballMark = mk('circle', { r: 0.9, fill: INK, opacity: 0.35 }, ball);

    // flag
    var flagG = mk('g', {}, cam);
    mk('path', { d: 'M0 0V-48', stroke: INK, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, flagG);
    mk('path', { d: 'M0 0V-48', stroke: PAPER, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, flagG);
    var flag = mk('path', { fill: FLAG, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, flagG);

    // fx
    var fx = mk('g', {}, cam);
    var ticks = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, fx);
    var wind = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var puffInk = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round' }, fx);
    var puffs = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, fx);
    var ripple = mk('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, fx);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, fx);

    // ---- Nick's chip ----
    var nick = mk('g', {}, cam);
    var kLegs = [limb(nick, DC), limb(nick, DC)];
    mk('circle', { r: CR, fill: DC, stroke: INK, 'stroke-width': 2.6 }, nick);
    mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, nick);
    mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, nick);
    var kt = mk('text', { x: 0, y: 13, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 8 : 9.5 }, nick);
    kt.textContent = dIni;
    var kEyes = eyesFor(nick, 6.9);
    var kCheeks = mk('path', { fill: DC, stroke: INK, 'stroke-width': 1.4, opacity: 0 }, nick);
    var kMouth = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, nick);
    var kBrows = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round' }, nick);
    var kArms = [limb(nick, DC), limb(nick, DC)];
    var blzW = blazer(cam);

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, DC: DC, vRGB: hexRGB(VC), dRGB: hexRGB(DC), svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG,
      gClip: gClip, gShadow: gShadow, tube: tube, hole: hole, plop: plop, nSh: nSh, nat: nat, legs: legs, arms: arms, txtV: txtV, coat: coat,
      blzL: blzL, topG: topG, txtD: txtD, tdS: tdS, tdF: tdF, stClip: stClip, shimmer: shimmer, face: face, nEyes: nEyes, nBrows: nBrows,
      nMouth: nMouth, nTongue: nTongue, putter: putter, pHead: pHead, finger: finger, fingerC: fingerC, ballG: ballG, ball: ball, ballSh: ballSh, ballMark: ballMark,
      flagG: flagG, flag: flag, ticks: ticks, wind: wind, puffs: puffs, puffInk: puffInk, ripple: ripple, dust: dust,
      nick: nick, kLegs: kLegs, kEyes: kEyes, kCheeks: kCheeks, kMouth: kMouth, kBrows: kBrows, kArms: kArms, blzW: blzW, line: line
    };
  }

  // ---------- helpers for drawing ----------
  function drawLimb(Lm, sx, sy, hx, hy, k, bend, footy, col) {
    var px = lerp(sx, hx, k), py = lerp(sy, hy, k);
    var mx = (sx + px) / 2, my = (sy + py) / 2, dx = px - sx, dy = py - sy, d = Math.hypot(dx, dy) || 1;
    var nx = -dy / d, ny = dx / d;
    if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }   // bow outward
    var cx = mx + nx * bend * k, cy = my + ny * bend * k;
    var dd = 'M' + P2(sx, sy) + 'Q' + P2(cx, cy) + ' ' + P2(px, py);
    Lm.ink.setAttribute('d', dd); Lm.col.setAttribute('d', dd);
    Lm.end.setAttribute('cx', f1(px)); Lm.end.setAttribute('cy', f1(py));
    var r = 3.6 * clamp(k * 1.5);
    Lm.end.setAttribute('rx', f1(footy ? r * 1.2 : r)); Lm.end.setAttribute('ry', f1(footy ? r * 0.85 : r));
    Lm.g.setAttribute('opacity', k > 0.02 ? 1 : 0);
    if (col) { Lm.col.setAttribute('stroke', col); Lm.end.setAttribute('fill', col); }
  }
  // eyes: o openness (>1 = wide), hap ^^, lx/ly look, shutL/shutR (sd -1 / +1) extra closing, lid = sly half lid
  function drawEyes(E, o, hap, lx, ly, shut, lid) {
    E.forEach(function (e) {
      var ex = e.cx, ey = -6, oo = o * (1 - (shut[e.sd] || 0));
      if (hap > 0.5) {
        e.white.setAttribute('ry', 0); e.pup.setAttribute('ry', 0); e.glint.setAttribute('r', 0); e.lid.setAttribute('d', '');
        e.shut.setAttribute('d', 'M' + P2(ex - 3.6, ey + 1.4) + 'Q' + P2(ex, ey - 3.6) + ' ' + P2(ex + 3.6, ey + 1.4));
        return;
      }
      if (oo < 0.18) {
        e.white.setAttribute('ry', 0); e.pup.setAttribute('ry', 0); e.glint.setAttribute('r', 0); e.lid.setAttribute('d', '');
        e.shut.setAttribute('d', 'M' + P2(ex - 3.6, ey) + 'Q' + P2(ex, ey + 2.4) + ' ' + P2(ex + 3.6, ey));
        return;
      }
      e.shut.setAttribute('d', '');
      var big = Math.max(1, oo), ry = 4.6 * Math.min(1, oo) * (1 + (big - 1) * 0.6), rx = 3.7 * (1 + (big - 1) * 0.5);
      e.white.setAttribute('rx', f1(rx)); e.white.setAttribute('ry', f1(ry));
      var pr = big > 1.1 ? 1.7 : 2.1;
      var px = ex + lx * (rx - pr - 0.4), py = ey + ly * Math.max(0, ry - pr - 0.4);
      if (lid) py = Math.max(py, ey - ry + pr + ry * 0.55 * lid);
      e.pup.setAttribute('cx', f1(px)); e.pup.setAttribute('cy', f1(py));
      e.pup.setAttribute('rx', f1(pr)); e.pup.setAttribute('ry', f1(Math.min(pr * 1.1, ry - 0.3)));
      e.glint.setAttribute('cx', f1(px - 0.7)); e.glint.setAttribute('cy', f1(py - 0.8)); e.glint.setAttribute('r', 0.75);
      if (lid) {
        var ly2 = ey - ry + 2 * ry * 0.5 * lid;
        e.lid.setAttribute('d', 'M' + P2(ex - rx - 0.6, ly2 + 0.6) + 'L' + P2(ex + rx + 0.6, ly2 - 0.2));
      } else e.lid.setAttribute('d', '');
    });
  }

  function ballAt(L, t) {
    var dir = L.dir, B0 = L.B0, HX = L.HX, LY = L.LY;
    var o = { x: B0[0], y: B0[1], s: 1, op: 1, lift: 0, d: 0 };
    if (t < 1700) { o.op = 0; return o; }
    if (t < 1960) {
      var lift = 0;
      if (t < 1820) lift = 80 * (1 - ei(seg(t, 1700, 1820)));
      else lift = 10 * Math.sin(Math.PI * seg(t, 1820, 1920));
      o.lift = lift; o.y = B0[1] - lift; return o;
    }
    var ex = HX - dir * 8, ang0 = dir > 0 ? Math.PI : 0;
    if (t < 3465) return o;
    if (t < 4150) {
      var p = seg(t, 3465, 4150), q = 1 - Math.pow(1 - p, 1.7);
      o.x = lerp(B0[0], ex, q); o.d = Math.abs(o.x - B0[0]); return o;
    }
    var full = Math.abs(ex - B0[0]);
    if (t < 4560) {
      var p2 = seg(t, 4150, 4560), a = ang0 + 3 * Math.PI * (1 - Math.pow(1 - p2, 1.8)), r = lerp(8, 9.2, ei(p2));
      o.x = HX + r * Math.cos(a); o.y = LY + 0.62 * r * Math.sin(a); o.d = full + 3 * Math.PI * 8 * p2; return o;
    }
    var end = [HX + dir * 9.2, LY];
    o.d = full + 3 * Math.PI * 8;
    if (t < 5285) {
      var wob = 0.9 * Math.exp(-(t - 4560) / 250) * Math.sin((t - 4560) / 1000 * 2 * Math.PI * 6);
      if (t > 4800 && t < 5050) wob += 0.5 * Math.sin((t - 4800) / 1000 * 2 * Math.PI * 9) * Math.sin(Math.PI * seg(t, 4800, 5050));
      o.x = end[0] - dir * wob; o.y = end[1]; return o;
    }
    var p3 = seg(t, 5285, 5390);
    o.x = lerp(end[0] + dir * 0, HX, eo(p3)); o.y = LY + 1.5 * p3; o.s = lerp(1, 0.35, ei(p3)); o.op = 1 - seg(t, 5340, 5400);
    o.d += 8 * p3;
    return o;
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = L.target, dir = L.dir;

    // camera
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6900, 7500)));
    var Z = lerp(1, ZM, zk);
    var fy = clamp(T.y + 14, H / (2 * ZM) - 6, 590 - H / (2 * ZM) + 20);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1100, 1450)) * (1 - eio(seg(t, 6950, 7450)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ---- green ----
    var un = eioC(seg(t, 1150, 1650)), ru = eioC(seg(t, 6930, 7230));
    var a = ru, b = un, span = L.gx1 - L.gx0 + 12, x0, x1;
    if (dir > 0) { x0 = L.gx0 - 6 + span * a; x1 = L.gx0 - 6 + span * b; }
    else { x0 = L.gx1 + 6 - span * b; x1 = L.gx1 + 6 - span * a; }
    S.gClip.setAttribute('x', f1(x0)); S.gClip.setAttribute('width', f1(Math.max(0, x1 - x0)));
    var tubeOn = (un > 0 && un < 1) || (ru > 0 && ru < 1);
    var tubeX = (un < 1) ? (dir > 0 ? x1 : x0) : (dir > 0 ? x0 : x1);
    var tubeS = un < 1 ? 1 - 0.35 * un : 0.65 + 0.35 * ru;
    S.tube.setAttribute('transform', 'translate(' + f1(tubeX) + ',' + f1((L.gy0 + L.gy1) / 2) + ') scale(' + f3(tubeS) + ',1) translate(0,' + f1(-(L.gy0 + L.gy1) / 2) + ')');
    S.tube.setAttribute('opacity', tubeOn ? 1 : 0);
    var hp = seg(t, 1500, 1640), hq = seg(t, 6860, 6960);
    var hs = (hp > 0 ? backOut(hp, 2) : 0) * (1 - ei(hq));
    S.hole.setAttribute('transform', 'translate(' + L.HX + ',' + L.LY + ') scale(' + f3(Math.max(0.001, hs)) + ')');
    var plp = seg(t, 5340, 5700);
    S.plop.setAttribute('cx', L.HX); S.plop.setAttribute('cy', L.LY);
    S.plop.setAttribute('rx', f1(8 + 16 * eoC(plp))); S.plop.setAttribute('ry', f1(5 + 10 * eoC(plp)));
    S.plop.setAttribute('opacity', plp > 0 && plp < 1 ? f3((1 - plp) * 0.9) : 0);

    // ---- flag ----
    var fp = seg(t, 1580, 1820), fq = seg(t, 6820, 6900);
    var fsy = (fp > 0 ? backOut(fp, 2.6) : 0) * (1 - ei(fq));
    var jig = damp(t - 5345, 6, 5, 140) * (t > 5345 ? 1 : 0) + damp(t - 1820, 0, 1, 1);
    S.flagG.setAttribute('transform', 'translate(' + L.HX + ',' + L.LY + ') rotate(' + f1(jig) + ') scale(1,' + f3(Math.max(0.001, fsy)) + ')');
    S.flagG.setAttribute('opacity', fsy > 0.01 ? 1 : 0);
    var fdir = sched([[0, 1], [5195, -1, 110], [5550, 1, 350, eio]], t) * dir;
    var amp = 1 + 1.6 * Math.sin(Math.PI * seg(t, 2680, 2980)) + 2.6 * Math.sin(Math.PI * seg(t, 5190, 5500));
    var wv = amp * Math.sin(t * 0.014), wv2 = amp * Math.sin(t * 0.014 + 1.6);
    var fl = 18 * Math.abs(fdir) + 1;
    S.flag.setAttribute('d', 'M0 -48Q' + P2(fdir * fl * 0.5, -48 + wv) + ' ' + P2(fdir * fl, -42 + wv2) + 'Q' + P2(fdir * fl * 0.5, -36 + wv) + ' 0 -36Z');

    // ---- Nate's chip ----
    var life = sched(N.life, t);
    var dy = sched(N.dy, t), rotN = sched(N.rot, t), sxN = sched(N.sx, t), syN = sched(N.sy, t), dx = 0;
    // emerging shiver
    if (t > 850 && t < 1050) dx += 1.2 * Math.sin(t * 0.2) * Math.sin(Math.PI * seg(t, 850, 1050));
    // wobble while pleading
    if (t > 4900 && t < 5300) rotN += 3 * Math.sin((t - 4900) / 1000 * 2 * Math.PI * 5);
    // satisfied nod after the wind test
    dy += 2 * Math.sin(Math.PI * seg(t, 2830, 2930)) + 2 * Math.sin(Math.PI * seg(t, 2930, 3030)) * 0.6;
    // celebration leaps
    var hop1 = seg(t, 5400, 5640), hop2 = seg(t, 5680, 5940), lift = 0;
    if (t >= 5340 && t < 5400) { var an = Math.sin(Math.PI * seg(t, 5340, 5400)); syN *= 1 - 0.12 * an; sxN *= 1 + 0.08 * an; dy += 3 * an; }
    if (hop1 > 0 && hop1 < 1) { lift = 30 * Math.sin(Math.PI * hop1); syN *= 1 + 0.08 * Math.sin(Math.PI * hop1); }
    if (hop2 > 0 && hop2 < 1) { lift = 36 * Math.sin(Math.PI * hop2); rotN += 360 * eio(hop2); }
    [5640, 5940].forEach(function (tl) { var d = t - tl; if (d >= 0 && d < 400) { var s = damp(d, 0.12, 4, 80); syN *= 1 - s; sxN *= 1 + s * 0.7; } });
    // blazer lands
    if (t >= 6330) { var dl = t - 6330; syN *= 1 - damp(dl, 0.1, 4, 90); sxN *= 1 + damp(dl, 0.07, 4, 90); }
    // preening sway
    rotN += 3 * Math.sin((t - 6380) / 1000 * 2 * Math.PI * 1.8) * seg(t, 6380, 6450) * (1 - seg(t, 6560, 6620));
    // final lift and plonk
    var up1 = eo(seg(t, 7100, 7190)), dn = ei(seg(t, 7190, 7240));
    lift += 7 * up1 * (1 - dn);
    var gsc = 1 + 0.08 * up1 * (1 - dn);
    if (t >= 7240) { var d2 = t - 7240; gsc *= 1 - damp(d2, 0.08, 4.5, 110); }
    gsc *= chipPop(T);
    var cx = T.x + dx * 1, cy = T.y + dy - lift;
    S.nat.setAttribute('transform', 'translate(' + f1(cx) + ',' + f1(cy) + ') rotate(' + f1(rotN * dir) + ') scale(' + f3(sxN * gsc) + ',' + f3(syN * gsc) + ')');
    var so = lift;
    S.nSh.setAttribute('cx', f1(T.x + 1.5 + so * 0.15)); S.nSh.setAttribute('cy', f1(T.y + 3.5 + dy + so * 0.3));
    S.nSh.setAttribute('rx', f1(CR * clamp(sxN * gsc * (1 - so * 0.006), 0.6, 1.2))); S.nSh.setAttribute('ry', f1(CR * clamp(syN * gsc * (1 - so * 0.006), 0.6, 1.2)));
    S.nSh.setAttribute('opacity', t < 1000 && chipPop(T) < 0.01 ? 0 : f3(clamp(0.28 - so * 0.004, 0.12, 0.28)));

    // texts
    var tl = eoC(seg(t, 1000, 1250)) * (1 - eioC(seg(t, 6990, 7130)));
    var ttr = 'translate(0,' + f1(12.5 * tl) + ') scale(' + f3(lerp(1, 0.52, tl)) + ')';
    S.txtV.setAttribute('transform', ttr); S.txtD.setAttribute('transform', ttr);
    S.txtV.setAttribute('opacity', t < 6330 ? 1 : 0);
    var stp = seg(t, 6760, 6930);
    S.stClip.setAttribute('width', f1(32 * stp));
    S.tdS.setAttribute('opacity', stp > 0 ? f3(1 - seg(t, 6930, 7010)) : 0);
    S.tdF.setAttribute('opacity', f3(eio(seg(t, 6900, 7000))));

    // coat
    var onL = t >= 6330;
    var fit = eioC(seg(t, 6600, 6800));
    S.blzL.g.setAttribute('opacity', onL ? f3(1 - seg(t, 6730, 6790)) : 0);
    S.blzL.g.setAttribute('transform', 'scale(' + f3(lerp(1, 0.9, fit)) + ',' + f3(lerp(1, 0.86, fit)) + ')');
    S.blzL.v.setAttribute('transform', 'scale(' + f3(Math.max(0.001, 1 - fit)) + ',1)');
    S.coat.setAttribute('opacity', f3(seg(t, 6690, 6780)));
    S.topG.setAttribute('opacity', f3(eio(seg(t, 6780, 6880))));
    var shp = seg(t, 6880, 7080);
    S.shimmer.setAttribute('opacity', shp > 0 && shp < 1 ? 0.55 : 0);
    S.shimmer.setAttribute('transform', 'rotate(30) translate(' + f1(lerp(-6, 76, eio(shp))) + ',0)');

    // limbs
    var hb = sched(N.hb, t), hf = sched(N.hf, t);
    var sleeve = onL ? 1 : 0, trou = fit;
    var armCol = mixC(S.vRGB, S.dRGB, sleeve), legCol = mixC(S.vRGB, S.dRGB, trou);
    var akimbo = seg(t, 6800, 6930);
    drawLimb(S.arms[0], -dir * 19, 2, dir * hb[0], hb[1], life, 3 + 5 * akimbo, false, armCol);
    drawLimb(S.arms[1], dir * 19, 2, dir * hf[0], hf[1], life, 3 + 5 * akimbo, false, armCol);
    // legs: tuck on leaps, back leg up while pleading
    var tuck = Math.max(Math.sin(Math.PI * hop1), Math.sin(Math.PI * hop2)) * (hop1 > 0 && hop1 < 1 || hop2 > 0 && hop2 < 1 ? 1 : 0);
    var plead = eoC(seg(t, 4800, 4920)) * (1 - eio(seg(t, 5280, 5360)));
    var crouch = sched([[0, 0], [1950, 1, 120], [2400, 0, 100]], t);
    var fB = [-9 - 8 * plead + 3 * crouch, 33 - 6 * tuck - 7 * plead - 4 * crouch], fF = [9 - 3 * crouch, 33 - 6 * tuck - 4 * crouch];
    drawLimb(S.legs[0], -dir * 7, 19, dir * fB[0], fB[1], life, 2, true, legCol);
    drawLimb(S.legs[1], dir * 7, 19, dir * fF[0], fF[1], life, 2, true, legCol);
    // wet finger
    var fo = seg(t, 2560, 2640) * (1 - seg(t, 2880, 2930)) * life;
    var fxp = dir * hb[0], fyp = hb[1];
    var fd = 'M' + P2(fxp, fyp - 2) + 'L' + P2(fxp + dir * 0.6, fyp - 8);
    S.finger.setAttribute('d', fd); S.fingerC.setAttribute('d', fd);
    S.finger.setAttribute('opacity', fo > 0.5 ? 1 : 0); S.fingerC.setAttribute('opacity', fo > 0.5 ? 1 : 0);

    // putter
    var pIn = seg(t, 1700, 1900), pOut = seg(t, 5880, 6300);
    var th = sched(N.th, t);
    if (t > 3000 && t < 3150) th += 7 * Math.sin((t - 3000) / 140 * 2 * Math.PI) * Math.sin(Math.PI * seg(t, 3000, 3150));
    if (t > 5480 && t < 5880) th += 18 * Math.sin((t - 5480) / 1000 * 2 * Math.PI * 3);
    var gx = dir * hf[0], gy = hf[1], prot = -th * dir;
    if (pIn < 1) { var pe = eoC(pIn); gx += dir * 70 * (1 - pe); gy += -170 * (1 - pe); prot += -dir * 900 * (1 - pe); }
    if (pOut > 0) { gx += -dir * 50 * pOut; gy += -420 * eo(pOut); prot += dir * 1100 * pOut; }
    S.putter.setAttribute('transform', 'translate(' + P2(gx, gy) + ') rotate(' + f1(prot) + ')');
    S.putter.setAttribute('opacity', t >= 1700 && pOut < 1 ? 1 : 0);
    S.pHead.setAttribute('x', dir > 0 ? -7 : -3);

    // face
    S.face.setAttribute('opacity', life > 0.01 ? 1 : 0);
    S.face.setAttribute('transform', 'scale(' + f3(Math.max(0.001, life < 1 && t < 2000 ? backOut(life, 2) : life)) + ')');
    var bl = 0;
    BLINKS.forEach(function (b0) { bl = Math.max(bl, Math.sin(Math.PI * seg(t, b0, b0 + 110))); });
    var wide = sched(N.wide, t), hap = sched(N.hap, t), sqz = sched(N.sqz, t);
    var look = sched(N.look, t);
    var open = (1 + wide) * (1 - bl) * (1 - 0.5 * sqz);
    var shut = {}; shut[-dir] = sqz;
    drawEyes(S.nEyes, open, hap, look[0] * dir, look[1], shut, 0);
    var bR = sched(N.browR, t), bK = sched(N.browK, t);
    var by = -13.2 - 2.6 * bR + 1.4 * sqz;
    var bVis = life > 0.3;
    S.nBrows.setAttribute('d', bVis ? 'M' + P2(-10.8, by - 0.4 * bR - 0.8 * Math.min(0, bK)) + 'L' + P2(-3.8, by + 2.2 * bK) + 'M' + P2(3.8, by + 2.2 * bK) + 'L' + P2(10.8, by - 0.4 * bR - 0.8 * Math.min(0, bK)) : '');
    var mS = sched(N.mS, t), mO = sched(N.mO, t), mG = sched(N.mG, t);
    var md;
    if (mO > 0.15) { var orx = 1.4 + 2 * mO, ory = 1.6 + 2.6 * mO; md = 'M' + P2(-orx, 3) + 'A' + P2(orx, ory) + ' 0 1 0 ' + P2(orx, 3) + 'A' + P2(orx, ory) + ' 0 1 0 ' + P2(-orx, 3) + 'Z'; S.nMouth.setAttribute('fill', INK); }
    else if (mG > 0.2) { var gw2 = 4 + 1.5 * mG; md = 'M' + P2(-gw2, 1) + 'Q0 ' + f1(1 + 9 * mG) + ' ' + P2(gw2, 1) + 'Z'; S.nMouth.setAttribute('fill', INK); }
    else { md = 'M-4 1.8Q0 ' + f1(1.8 + 3.4 * mS) + ' 4 1.8'; S.nMouth.setAttribute('fill', 'none'); }
    S.nMouth.setAttribute('d', md);
    var tg = Math.sin(Math.PI * seg(t, 2470, 2620));
    S.nTongue.setAttribute('cx', f1(-dir * 1.5)); S.nTongue.setAttribute('cy', f1(3 + 2.2 * tg)); S.nTongue.setAttribute('opacity', tg > 0.05 ? 1 : 0);

    // ---- ball ----
    var B = ballAt(L, t);
    S.ballG.setAttribute('opacity', f3(B.op));
    S.ball.setAttribute('transform', 'translate(' + P2(B.x, B.y) + ') scale(' + f3(B.s) + ')');
    S.ballSh.setAttribute('cx', f1(B.x + 1)); S.ballSh.setAttribute('cy', f1(B.y + B.lift + 3.4));
    S.ballSh.setAttribute('rx', f1(4.4 * B.s)); S.ballSh.setAttribute('opacity', B.s < 0.9 ? 0 : 0.25);
    var ma = B.d / 4.6;
    S.ballMark.setAttribute('cx', f1(2.4 * Math.sin(ma) * dir)); S.ballMark.setAttribute('cy', f1(-1.2 * Math.cos(ma)));

    // ---- fx: click, rim ticks, wind, puffs, ring ----
    var td = '';
    function burst(x, y, p, r0, n, len, a0) {
      if (p <= 0 || p >= 1) return;
      for (var i = 0; i < n; i++) {
        var ang = a0 + i * (2 * Math.PI / n), R0 = r0 + 7 * eoC(p), R1 = R0 + len * (1 - p);
        td += 'M' + P2(x + Math.cos(ang) * R0, y + Math.sin(ang) * R0) + 'L' + P2(x + Math.cos(ang) * R1, y + Math.sin(ang) * R1);
      }
    }
    burst(L.B0[0], L.B0[1], seg(t, 3465, 3700), 7, 5, 5, -1.3);
    burst(L.HX + dir * 9.2, L.LY, seg(t, 4560, 4760), 6, 4, 4, -2.4);
    burst(L.HX, L.LY - 2, seg(t, 5345, 5600), 11, 6, 6, -1.57);
    // celebration sparks
    burst(T.x, T.y - lift, seg(t, 5420, 5700), 28, 8, 7, 0.2);
    burst(T.x, T.y - lift, seg(t, 5960, 6200), 28, 8, 7, 0.6);
    S.ticks.setAttribute('d', td);
    var wp = seg(t, 2680, 2960);
    if (wp > 0 && wp < 1) {
      var wd = '';
      [0, 1].forEach(function (k) {
        var x0 = T.x - dir * 50 + dir * 110 * wp + dir * k * 14, y0 = T.y - 34 - k * 9;
        wd += 'M' + P2(x0, y0);
        for (var s = 1; s <= 5; s++) wd += 'L' + P2(x0 + dir * s * 4, y0 + 1.6 * Math.sin(s * 1.4 + wp * 12 + k));
      });
      S.wind.setAttribute('d', wd); S.wind.setAttribute('opacity', f3(Math.sin(Math.PI * wp) * 0.9));
    } else S.wind.setAttribute('opacity', 0);

    // ---- Nick's chip ----
    var EXO = L.EXP + dir * 46;
    var kx, ky, krot = 0, kvis = 0, kbob = 0, walk = 0;
    var mouthAt = [0, 0];
    if (t >= 4980 && t < 5500) {
      var pin = eoC(seg(t, 4980, 5110)), pout = eio(seg(t, 5360, 5480));
      kx = lerp(EXO, L.EXP, pin * (1 - pout)); ky = L.LY - 14; krot = -dir * 16 * pin * (1 - pout); kvis = 1;
    } else if (t >= 5650 && t < 7150) {
      var pw = seg(t, 5650, 6080), pb = seg(t, 6350, 6440), px2 = eio(seg(t, 6760, 7100));
      kx = lerp(EXO, L.NP[0], pw) + dir * 8 * eio(pb); kx = lerp(kx, EXO + dir * 20, px2);
      ky = L.NP[1];
      walk = (pw > 0 && pw < 1) || (px2 > 0 && px2 < 1) ? 1 : 0;
      kbob = walk ? -2.5 * Math.abs(Math.sin(t * 0.03)) : 0;
      krot = walk ? 5 * Math.sin(t * 0.03) : 0;
      kvis = 1;
    }
    S.nick.setAttribute('opacity', kvis);
    S.blzW.g.setAttribute('opacity', 0);
    if (kvis) {
      var puffIn = Math.sin(Math.PI * seg(t, 5110, 5200)) * 0 + eo(seg(t, 5110, 5180)) * (1 - seg(t, 5190, 5290));
      var ksc = 1 + 0.07 * puffIn;
      S.nick.setAttribute('transform', 'translate(' + P2(kx, ky + kbob) + ') rotate(' + f1(krot) + ') scale(' + f3(ksc) + ')');
      var face2 = -dir;     // Nick faces back toward Nate
      var klook = sched([[0, [face2, 0.4]], [5290, [0, 0], 60], [5650, [face2, 0.1], 10], [6080, [face2, 0.3], 100], [6680, [0, 0], 100], [6900, [dir, 0], 100]], t);
      var wink = Math.sin(Math.PI * seg(t, 6690, 6900));
      var ksh = {}; ksh[dir] = wink > 0.3 ? 1 : 0;
      var kop = 1 - Math.sin(Math.PI * seg(t, 5300, 5340)) * 0;
      drawEyes(S.kEyes, kop * (t > 5285 && t < 5340 ? 1.1 : 1), 0, klook[0], klook[1], ksh, t > 5285 && t < 5345 ? 0 : 1);
      S.kBrows.setAttribute('d', 'M-10.6 -13.6L-3.8 ' + f1(-12.2 - (t > 5285 && t < 5345 ? 2 : 0)) + 'M3.8 ' + f1(-12.2 - (t > 5285 && t < 5345 ? 2 : 0)) + 'L10.6 -13.6');
      // mouth: smirk / puffed / whistle-o
      var blow = seg(t, 5190, 5290) > 0 && t < 5300;
      var whistle = t >= 5300 && t < 5420;
      S.kCheeks.setAttribute('opacity', puffIn > 0.2 ? 1 : 0);
      var cr2 = 3 * puffIn;
      S.kCheeks.setAttribute('d', 'M' + P2(-11, 4) + 'm' + f1(-cr2) + ' 0a' + P2(cr2, cr2) + ' 0 1 0 ' + f1(2 * cr2) + ' 0a' + P2(cr2, cr2) + ' 0 1 0 ' + f1(-2 * cr2) + ' 0M' + P2(11, 4) + 'm' + f1(-cr2) + ' 0a' + P2(cr2, cr2) + ' 0 1 0 ' + f1(2 * cr2) + ' 0a' + P2(cr2, cr2) + ' 0 1 0 ' + f1(-2 * cr2) + ' 0');
      if (blow || whistle || puffIn > 0.2) {
        var rr = blow ? 2.2 : 1.5;
        S.kMouth.setAttribute('d', 'M' + P2(face2 * 2 - rr, 4) + 'a' + P2(rr, rr) + ' 0 1 0 ' + f1(2 * rr) + ' 0a' + P2(rr, rr) + ' 0 1 0 ' + f1(-2 * rr) + ' 0');
        S.kMouth.setAttribute('fill', INK);
      } else {
        S.kMouth.setAttribute('d', 'M' + P2(-4.5, 2.2) + 'Q' + P2(0, 4.6) + ' ' + P2(4.5, 1));
        S.kMouth.setAttribute('fill', 'none');
      }
      mouthAt = [kx + face2 * 2 * ksc, ky + 4];
      // arms
      var ah;
      if (t < 5500) ah = [[-18, 12], [18, 12]];
      else {
        var carry = t < 6110, drape = seg(t, 6110, 6330);
        var cl = 0;
        if (t > 6400 && t < 6680) cl = Math.abs(Math.sin((t - 6400) / 280 * Math.PI * 3));
        if (carry) ah = [[-12, -27], [12, -27]];
        else if (drape < 1) ah = [[lerp(-12, face2 * 26 - 4, eio(drape)), lerp(-27, -10, eio(drape))], [lerp(12, face2 * 26 + 4, eio(drape)), lerp(-27, -10, eio(drape))]];
        else {
          var ap = eoC(seg(t, 6330, 6420));
          ah = [[lerp(face2 * 26 - 4, -2 - 9 * (1 - cl), ap), lerp(-10, 9, ap)], [lerp(face2 * 26 + 4, 2 + 9 * (1 - cl), ap), lerp(-10, 9, ap)]];
          if (t > 6700) { var wv3 = seg(t, 6700, 6800); ah[0] = [lerp(ah[0][0], -20, wv3), lerp(ah[0][1], 10, wv3)]; ah[1] = [lerp(ah[1][0], 20, wv3), lerp(ah[1][1], 10, wv3)]; }
        }
      }
      drawLimb(S.kArms[0], -19, 2, ah[0][0], ah[0][1], 1, 3, false);
      drawLimb(S.kArms[1], 19, 2, ah[1][0], ah[1][1], 1, 3, false);
      var st = walk ? Math.sin(t * 0.03) : 0;
      drawLimb(S.kLegs[0], -7, 19, -9 + 4 * st, 33 - 3 * Math.max(0, st), 1, 2, true);
      drawLimb(S.kLegs[1], 7, 19, 9 + 4 * st, 33 - 3 * Math.max(0, -st), 1, 2, true);
      // the blazer, carried overhead then swung over Nate
      if (t >= 5650 && t < 6330) {
        var dp = eio(seg(t, 6110, 6330));
        var bx0 = kx, by0 = ky + kbob - 44;
        var bxx = lerp(bx0, cx, dp), byy = lerp(by0, cy, dp) - 34 * Math.sin(Math.PI * dp);
        var bs = lerp(0.82, 1, dp), br = krot * 0.6 - dir * 22 * Math.sin(Math.PI * dp) + rotN * dir * dp;
        S.blzW.g.setAttribute('transform', 'translate(' + P2(bxx, byy) + ') rotate(' + f1(br) + ') scale(' + f3(bs) + ',' + f3(bs * (1 - 0.15 * Math.sin(Math.PI * dp))) + ')');
        S.blzW.g.setAttribute('opacity', 1);
      }
    }
    // puffs of breath toward the ball
    var pd = '';
    [0, 1, 2].forEach(function (k) {
      var p = seg(t, 5195 + k * 35, 5330 + k * 35);
      if (p <= 0 || p >= 1) return;
      var sx0 = L.EXP - dir * 26, sy0 = L.LY - 10 + (k - 1) * 4;
      var ex2 = L.HX + dir * 12, ey2 = L.LY - 2 + (k - 1) * 4;
      var x = lerp(sx0, ex2, eo(p)), y = lerp(sy0, ey2, eo(p)), len = 12 * (1 - 0.4 * p);
      pd += 'M' + P2(x, y) + 'q' + P2(dir * len * 0.5, -3) + ' ' + P2(dir * len, 0);
    });
    S.puffs.setAttribute('d', pd); S.puffInk.setAttribute('d', pd);

    // set-down ring + dust
    var rp = seg(t, 7240, 7740);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp2 = seg(t, 7240, 7520);
    if (dp2 > 0 && dp2 < 1) {
      var dd = '', r0 = 27 + 9 * eoC(dp2), r1b = r0 + 6 * (1 - dp2);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a2) {
        dd += 'M' + P2(T.x + Math.cos(a2) * r0, T.y + Math.sin(a2) * r0) + 'L' + P2(T.x + Math.cos(a2) * r1b, T.y + Math.sin(a2) * r1b);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp2) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7500, 7900);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2putt;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2putt = S;
    return S;
  }

  window.CCSteal2_putt = {
    title: 'The Winner’s Jacket',
    blurb: 'Nate’s chip reads the green like a pro, lips out, gets a sneaky puff of help from the dealer’s chip, and proudly buttons up the champion’s blazer it’s handed, which is in Nick’s colour and fits it like a whole new chip.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2putt = S;
      var token = {};
      root.__cc2puttToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2puttToken !== token) { resolve(); return; }
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
