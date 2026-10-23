/* Closed Caption steal film: frosting (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE BAKER (frosting)
 *
 * Everyone knows what frosting does: whatever it covers comes out the frosting's colour.
 * Top-down felt table; the baker (Nick) is just off the top of the frame - we only see two
 * white-gloved hands in chef's sleeves, and the top of a toque (banded in Nick's colour) peeking in.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  550-1200  Camera eases in a touch (whole rows stay in frame); other chips dim; Nate's chip
 *            gives a nervous little hop.
 *  950-1200  A chef's toque peeks in over the top edge of the frame.
 * 1000-1500  A piping bag full of Nick's colour swoops down on an arc, two gloved hands on it,
 *            and overshoots into position over the chip.
 * 1500-1700  Aim: bag lifts a hair, the top hand squeezes (bag bulges), a blip of frosting.
 * 1700-3000  PIPING: round and round, a thick glossy rope spirals in and up - three tiers,
 *            a cupcake swirl. The hands circle, the bag empties, the toque bobs along.
 * 3000-3150  Pull-off: the peak stretches up on a string of frosting...
 * 3150-3450  ...snaps, curls over into a perfect kiss-curl; the whole swirl wobbles (viscous).
 *            The bag lifts away.
 * 3280-4050  A gloved hand dangles a cherry over the peak. Lowers it. Hesitates (cherry swings,
 *            toque tilts: "hmm"). Thinks better of it. Takes it away.
 * 4000-4290  An offset spatula arrives at the left of the swirl, presses in (swirl squishes).
 * 4290-4620  THE SWIPE: one smooth satisfying pass. Behind the blade the swirl becomes a flat
 *            glossy coat exactly the size of the chip; the excess piles up on the blade.
 * 4620-5000  Spatula lifts off with its dollop. Beat: the coat ripples flat, a gloss glint
 *            sweeps across it. (colour-change beat)
 * 4950-6150  A little bag of white icing pipes the dotted ring round the rim, then Nick's
 *            initial on top - the chip is now unmistakably Nick's.
 * 6100-6780  A sprinkle shaker is offered, tips... one sprinkle peeks out of the hole... the toque
 *            shakes "no". The sprinkle slips back; shaker politely withdraws.
 * 6650-7320  The baker stands back (toque leaves, apron hem dips in); both gloves wipe on the
 *            apron, then hands and apron leave. Camera eases back, chips undim.
 * 7300-7600  Set-down beat: the chip settles (tiny squash), a ring pulses, a final gloss glint.
 * 7600-7700  Stillness: the chip sits in exactly its original spot.
 * 7700-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', METAL = '#C3CDD3', GLOVE = '#FFFFFF', CHERRY = '#D7263D', WOOD = '#B9824E';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var TURNS = 2.6, TH0 = 0.3, KY = 0.74;
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
  function tr(x, y, r, s) { return 'translate(' + f1(x) + ',' + f1(y) + ')' + (r ? ' rotate(' + f1(r) + ')' : '') + (s !== undefined && s !== 1 ? ' scale(' + f2(s) + ')' : ''); }
  // piecewise keyframes on [time, value] pairs with per-segment easing
  function kf(keys, t, ease) {
    ease = ease || eio;
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) { var a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (b[2] || ease)((t - a[0]) / (b[0] - a[0]))); }
    }
    return keys[keys.length - 1][1];
  }

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
    var ini = initialsFn(opts), rows = [], target = null;
    cards.forEach(function (c, i) {
      var y = y0 + i * (h + g), mid = y + h / 2;
      var row = { label: String(c.label), y: y, h: h, mid: mid, i: i, chips: [] };
      (c.chips || []).slice(0, 3).forEach(function (ch, j) {
        var chip = { name: ch.name, color: ch.color, ini: ini(ch.name), x: 150 + 72 * j, y: mid, row: i, j: j, target: !!ch.target };
        row.chips.push(chip);
        if (chip.target && !target) target = chip;
      });
      rows.push(row);
    });
    if (!target) for (var r = 0; r < rows.length && !target; r++) if (rows[r].chips.length) { target = rows[r].chips[0]; target.target = true; }
    return { rows: rows, target: target, h: h, ini: ini };
  }

  // ---------- the swirl ----------
  function sw(u) { return { th: TH0 + 2 * Math.PI * TURNS * u, r: 3 + 19 * Math.pow(1 - u, 0.85), h: 27 * Math.pow(u, 0.9), w: 13 - 5 * u }; }
  function swPt(T, u) { var s = sw(u); return [T.x + s.r * Math.cos(s.th), T.y + 2 + KY * s.r * Math.sin(s.th) - s.h]; }
  // chunk boundaries: each new chunk starts at the back of the swirl, so higher tiers overlay lower ones
  var CHUNKS = [0];
  for (var ck = 1; ck < 5; ck++) { var ub = (-Math.PI / 2 + 2 * Math.PI * ck - TH0) / (2 * Math.PI * TURNS); if (ub > 0 && ub < 1) CHUNKS.push(ub); }
  CHUNKS.push(1);
  function pipeP(t) { var p = seg(t, 1700, 3000); return 0.45 * p + 0.55 * eio(p); }

  // ---------- builders ----------
  function makeChipFace(g, color, txt) {
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    return g;
  }
  // gloved hand; local origin = grip point, arm (chef's sleeve) runs off toward -y
  function makeGlove(parent, x, y, a) {
    var g = el('g', { transform: tr(x, y, a) }, parent);
    el('path', { d: 'M-12.5 -10 Q-15 -120 -21 -470 L21 -470 Q15 -120 12.5 -10 Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M7 -14 Q10 -120 14 -470', fill: 'none', stroke: '#E9E3D9', 'stroke-width': 5 }, g);
    el('path', { d: 'M-6 -26 Q-2 -30 3 -27 M-8 -58 Q-1 -63 6 -58 M-10 -96 Q-2 -101 8 -95', fill: 'none', stroke: INK, 'stroke-opacity': 0.22, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
    el('rect', { x: -14, y: -22, width: 28, height: 10, rx: 4, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.2 }, g);
    el('rect', { x: -12.5, y: -14, width: 25, height: 9, rx: 3.5, fill: '#F1ECE4', stroke: INK, 'stroke-width': 2.2 }, g);
    el('ellipse', { cx: 0, cy: 3, rx: 11.5, ry: 10.5, fill: GLOVE, stroke: INK, 'stroke-width': 2.4 }, g);
    el('ellipse', { cx: -10.5, cy: -0.5, rx: 4.2, ry: 6.4, fill: GLOVE, stroke: INK, 'stroke-width': 2.2, transform: 'rotate(18 -10.5 -0.5)' }, g);
    el('path', { d: 'M-4 -2.5 L-4 3 M0.5 -3.5 L0.5 3 M5 -2.5 L5 3', stroke: INK, 'stroke-opacity': 0.55, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M-6 11 Q-3 12.6 0 11.4 Q3 12.6 6 10.6', fill: 'none', stroke: INK, 'stroke-opacity': 0.5, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
    return g;
  }
  // piping bag; local origin = nozzle tip, bag runs up -y
  function makeBag(parent, fillC, white) {
    var rig = el('g', {}, parent);
    var body = el('g', {}, rig);
    el('path', { d: 'M-3 0 L3 0 L7.5 -15 L-7.5 -15 Z', fill: METAL, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, rig);
    el('path', { d: 'M-1 -1.5 L-3.2 -13.5 M1.6 -1.5 L3.4 -13.5', stroke: INK, 'stroke-opacity': 0.45, 'stroke-width': 1.1 }, rig);
    el('path', { d: 'M-8 -13 L-25 -76 Q-26 -84 -14 -86 L-5 -91 L5 -91 L14 -86 Q26 -84 25 -76 L8 -13 Z', fill: '#F6F2EC' }, body);
    var content = el('path', { fill: fillC }, body);
    el('path', { d: 'M-8 -13 L-25 -76 Q-26 -84 -14 -86 L-5 -91 L5 -91 L14 -86 Q26 -84 25 -76 L8 -13 Z', fill: '#FFFFFF', 'fill-opacity': white ? 0.15 : 0.32, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, body);
    el('path', { d: 'M-17 -70 L-8.5 -26', stroke: '#FFFFFF', 'stroke-opacity': 0.75, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, body);
    el('rect', { x: -9.5, y: -18.5, width: 19, height: 6.5, rx: 2.5, fill: METAL, stroke: INK, 'stroke-width': 2 }, rig);
    var top = makeGlove(rig, 0, -95, 32);
    var mid = makeGlove(rig, -19, -50, -78);
    return { rig: rig, body: body, content: content, top: top, mid: mid, white: white };
  }
  function bagContent(level) {
    function hw(y) { return 7 + 17 * ((-y - 14) / 64); }
    return 'M' + f1(-hw(-14)) + ' -14L' + f1(-hw(level)) + ' ' + f1(level) + 'Q0 ' + f1(level - 3) + ' ' + f1(hw(level)) + ' ' + f1(level) + 'L' + f1(hw(-14)) + ' -14Z';
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-frosting-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var sx = T.j < 2 ? 1 : -1;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpS = el('clipPath', { id: id + 'sw', clipPathUnits: 'userSpaceOnUse' }, defs);
    var clipSw = el('rect', { x: -1000, y: -1000, width: 3000, height: 3000 }, cpS);
    var cpC = el('clipPath', { id: id + 'co', clipPathUnits: 'userSpaceOnUse' }, defs);
    var clipCo = el('rect', { x: -3000, y: -1000, width: 0, height: 3000 }, cpC);
    var cpT = el('clipPath', { id: id + 'tx', clipPathUnits: 'userSpaceOnUse' }, defs);
    var clipTx = el('rect', { x: -14, y: -14, width: 0, height: 28 }, cpT);
    var cpG = el('clipPath', { id: id + 'gl', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('circle', { cx: 0, cy: 0, r: CR - 1.4 }, cpG);

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
        var cg = el('g', {}, wrap); makeChipFace(cg, c.color, c.ini);
        chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
      });
    });

    // ---- Nate's chip ----
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(T.x + 1.5), cy: f1(T.y + 3.5) }, cam);
    var vG = el('g', {}, cam); makeChipFace(vG, victimC, vIni);

    // ---- the frosted chip (coat + piped ring + piped initial) ----
    var coatW = el('g', { 'clip-path': 'url(#' + id + 'co)' }, cam);
    var coatG = el('g', {}, coatW);
    var coat = el('path', { fill: dealerC, stroke: INK, 'stroke-width': 2.6 }, coatG);
    var streaks = el('path', { fill: 'none', stroke: mix(dealerC, '#FFFFFF', 0.4), 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, coatG);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, coatG);
    var ring = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, coatG);
    var txG = el('g', { 'clip-path': 'url(#' + id + 'tx)' }, coatG);
    var txt = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 15 : 18 }, txG);
    txt.textContent = dIni;
    var glintG = el('g', { 'clip-path': 'url(#' + id + 'gl)' }, coatG);
    var glint = el('path', { d: 'M-6 -40 L4 -40 L-4 40 L-14 40 Z', fill: '#FFFFFF', opacity: 0 }, glintG);
    var setRing = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);

    // ---- the swirl ----
    var swW = el('g', { 'clip-path': 'url(#' + id + 'sw)' }, cam);
    var swG = el('g', {}, swW);
    var swSh = el('ellipse', { cx: f1(T.x + 3), cy: f1(T.y + 6), rx: 0, ry: 0, fill: INK, opacity: 0.22 }, swG);
    var shade = mix(dealerC, INK, 0.22), hi = mix(dealerC, '#FFFFFF', 0.55);
    var swFill = el('ellipse', { cx: T.x, cy: f1(T.y - 6), rx: 16, ry: 13, fill: shade, opacity: 0 }, swG);
    var chunks = [];
    for (var c = 0; c < CHUNKS.length - 1; c++) {
      var w = sw((CHUNKS[c] + CHUNKS[c + 1]) / 2).w;
      var cg = el('g', {}, swG);
      chunks.push({
        a: CHUNKS[c], b: CHUNKS[c + 1], w: w,
        ink: el('path', { fill: 'none', stroke: INK, 'stroke-width': f1(w + 4.6), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, cg),
        sh: el('path', { fill: 'none', stroke: shade, 'stroke-width': f1(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, cg),
        col: el('path', { fill: 'none', stroke: dealerC, 'stroke-width': f1(w - 3.4), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'translate(0,-1.6)' }, cg),
        gr: el('path', { fill: 'none', stroke: mix(dealerC, INK, 0.4), 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '9 4', opacity: 0.7, transform: 'translate(0,2.2)' }, cg),
        hi: el('path', { fill: 'none', stroke: hi, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85, transform: 'translate(-0.6,-3.6)' }, cg)
      });
    }
    var tail = el('path', { fill: dealerC, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, swG);
    var tailHi = el('path', { fill: 'none', stroke: hi, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.85 }, swG);
    var streamInk = el('path', { fill: 'none', stroke: INK, 'stroke-linecap': 'round' }, cam);
    var streamCol = el('path', { fill: 'none', stroke: dealerC, 'stroke-linecap': 'round' }, cam);
    var blip = el('circle', { r: 0, fill: dealerC, stroke: INK, 'stroke-width': 2 }, cam);
    var wStream = el('circle', { r: 0, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1 }, cam);

    // ---- props ----
    // cherry (origin = pinch point)
    var cherry = el('g', {}, cam);
    el('path', { d: 'M0 0 Q-0.5 9 -4 13', fill: 'none', stroke: '#5B3A1E', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, cherry);
    el('circle', { cx: -4, cy: 20, r: 7.5, fill: CHERRY, stroke: INK, 'stroke-width': 2.2 }, cherry);
    el('ellipse', { cx: -6.5, cy: 17.5, rx: 2.4, ry: 1.6, fill: '#FFFFFF', 'fill-opacity': 0.7, transform: 'rotate(-30 -6.5 17.5)' }, cherry);
    makeGlove(cherry, 2, -4, -38);
    // spatula (origin = blade centre)
    var spat = el('g', {}, cam);
    var blob = el('g', {}, spat);
    var blobE = el('ellipse', { cx: 9, cy: 2, rx: 2, ry: 5, fill: dealerC, stroke: INK, 'stroke-width': 2.2 }, blob);
    var blobH = el('ellipse', { cx: 9, cy: -3, rx: 1.4, ry: 3, fill: hi, opacity: 0.85 }, blob);
    el('path', { d: 'M0 -37 L0 -45 L15 -60', fill: 'none', stroke: INK, 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, spat);
    el('path', { d: 'M0 -37 L0 -45 L15 -60', fill: 'none', stroke: METAL, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, spat);
    el('rect', { x: -5.5, y: -40, width: 11, height: 78, rx: 5.5, fill: '#D3DBE0', stroke: INK, 'stroke-width': 2.2 }, spat);
    el('path', { d: 'M-1.6 -33 L-1.6 30', stroke: '#FFFFFF', 'stroke-opacity': 0.8, 'stroke-width': 2, 'stroke-linecap': 'round' }, spat);
    el('path', { d: 'M15 -60 L40 -108', fill: 'none', stroke: INK, 'stroke-width': 12.5, 'stroke-linecap': 'round' }, spat);
    el('path', { d: 'M15 -60 L40 -108', fill: 'none', stroke: WOOD, 'stroke-width': 8, 'stroke-linecap': 'round' }, spat);
    makeGlove(spat, 31, -90, 28);
    // sprinkle shaker (origin = holes in the lid, lid points down at the chip)
    var shaker = el('g', {}, cam);
    var sprink = el('rect', { x: -1.7, y: 0, width: 3.4, height: 9, rx: 1.7, fill: '#FF6B8B', stroke: INK, 'stroke-width': 0.9 }, shaker);
    el('rect', { x: -11, y: -36, width: 22, height: 31, rx: 5, fill: '#FFFFFF', 'fill-opacity': 0.55, stroke: INK, 'stroke-width': 2.2 }, shaker);
    [['#FF6B8B', -6, -12, 30], ['#FFD24A', 3, -10, -40], ['#5BC0EB', -1, -16, 80], ['#7ED957', 5, -18, 20], ['#B388FF', -5, -20, -60], ['#FFD24A', 0, -8, 10], ['#5BC0EB', 6, -13, -10], ['#FF6B8B', -7, -17, 70]].forEach(function (s) {
      el('rect', { x: s[1] - 1.1, y: s[2] - 3, width: 2.2, height: 6, rx: 1.1, fill: s[0], transform: 'rotate(' + s[3] + ' ' + s[1] + ' ' + s[2] + ')' }, shaker);
    });
    el('rect', { x: -12, y: -6, width: 24, height: 7, rx: 2.5, fill: '#EDE5D8', stroke: INK, 'stroke-width': 2 }, shaker);
    el('path', { d: 'M-5 -2.5 h0.1 M0 -2.5 h0.1 M5 -2.5 h0.1', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, shaker);
    makeGlove(shaker, 15, -24, 70);
    // piping bags
    var bag = makeBag(cam, dealerC, false);
    var wbag = makeBag(cam, '#FBF7F1', true);

    // ---- screen space: the baker just out of shot ----
    var apron = el('g', {}, svg);
    el('rect', { x: -78, y: -120, width: 156, height: 150, rx: 16, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.6 }, apron);
    el('rect', { x: -72, y: 18, width: 144, height: 6, rx: 3, fill: dealerC }, apron);
    el('rect', { x: -24, y: -22, width: 48, height: 28, rx: 7, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.2 }, apron);
    el('path', { d: 'M-20 -16 L20 -16', stroke: dealerC, 'stroke-width': 4, 'stroke-linecap': 'round' }, apron);
    el('path', { d: 'M-60 -40 Q-58 0 -50 16 M56 -50 Q60 -10 52 16', fill: 'none', stroke: INK, 'stroke-opacity': 0.12, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, apron);
    var wipeL = makeGlove(svg, 0, 0, 0), wipeR = makeGlove(svg, 0, 0, 0);
    var hat = el('g', {}, svg);
    [[-16, 13, 13], [16, 13, 13], [0, 19, 15]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: p[2] + 1.3, fill: INK }, hat); });
    [[-16, 13, 13], [16, 13, 13], [0, 19, 15]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: p[2] - 1.2, fill: '#FFFFFF' }, hat); });
    el('path', { d: 'M-9 8 Q-6 17 -9 24 M9 8 Q6 17 9 24', fill: 'none', stroke: INK, 'stroke-opacity': 0.22, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, hat);
    el('rect', { x: -26, y: -60, width: 52, height: 66, rx: 6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.6 }, hat);
    el('rect', { x: -26, y: -3, width: 52, height: 5.5, fill: dealerC }, hat);
    el('path', { d: 'M-26 -3 L26 -3 M-26 2.5 L26 2.5', stroke: INK, 'stroke-width': 1.2 }, hat);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, sx: sx, dealerC: dealerC, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG,
      vSh: vSh, vG: vG, clipSw: clipSw, clipCo: clipCo, clipTx: clipTx, coatW: coatW, coatG: coatG, coat: coat, streaks: streaks, ring: ring,
      glint: glint, setRing: setRing, swW: swW, swG: swG, swSh: swSh, swFill: swFill, chunks: chunks, tail: tail, tailHi: tailHi,
      streamInk: streamInk, streamCol: streamCol, blip: blip, wStream: wStream, cherry: cherry, spat: spat, blobE: blobE, blobH: blobH,
      shaker: shaker, sprink: sprink, bag: bag, wbag: wbag, apron: apron, wipeL: wipeL, wipeR: wipeR, hat: hat, line: line, txtIni: dIni
    };
  }

  // ---------- render helpers ----------
  function chunkD(T, a, b) {
    var d = '', n = Math.max(2, Math.ceil((b - a) / 0.01));
    for (var i = 0; i <= n; i++) { var p = swPt(T, lerp(a, b, i / n)); d += (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }
    return d;
  }
  // the kiss-curl at the peak: centreline grows up from base, bends by `bend`
  function tailD(base, L, wb, bend) {
    var pts = [], n = 10, x = base[0], y = base[1], ds = L / n;
    for (var i = 0; i <= n; i++) {
      var s = i / n, ph = bend * Math.pow(s, 1.5), hw = wb / 2 * Math.pow(1 - s, 0.65) + 0.4;
      pts.push([x, y, ph, hw]);
      x += Math.sin(ph) * ds; y -= Math.cos(ph) * ds;
    }
    var left = '', right = '', spine = '';
    pts.forEach(function (p, i) {
      var nx = Math.cos(p[2]), ny = Math.sin(p[2]);
      left += (i ? 'L' : 'M') + f1(p[0] - nx * p[3]) + ' ' + f1(p[1] - ny * p[3]);
      if (i > 1 && i < 8) spine += (i > 2 ? 'L' : 'M') + f1(p[0] - nx * p[3] * 0.4) + ' ' + f1(p[1] - ny * p[3] * 0.4);
    });
    for (var j = pts.length - 1; j >= 0; j--) { var q = pts[j]; right += 'L' + f1(q[0] + Math.cos(q[2]) * q[3]) + ' ' + f1(q[1] + Math.sin(q[2]) * q[3]); }
    return { d: left + right + 'Z', spine: spine, tip: [pts[n][0], pts[n][1]] };
  }
  function wavyCircle(r, amp, ph) {
    var d = '';
    for (var i = 0; i <= 48; i++) {
      var a = i / 48 * Math.PI * 2, rr = r + amp * (Math.sin(5 * a + ph) * 0.6 + Math.sin(3 * a - ph * 1.3) * 0.4);
      d += (i ? 'L' : 'M') + f1(Math.cos(a) * rr) + ' ' + f1(Math.sin(a) * rr);
    }
    return d + 'Z';
  }
  function ringD(p) {
    if (p <= 0) return '';
    var d = '', n = Math.max(1, Math.ceil(64 * p));
    for (var i = 0; i <= n; i++) { var a = (i / n) * p * Math.PI * 2; d += (i ? 'L' : 'M') + f1(Math.cos(a) * 15.5) + ' ' + f1(Math.sin(a) * 15.5); }
    return d;
  }
  function setBag(B, x, y, rot, sc, level, squeeze, vis, mir) {
    if (!vis) { B.rig.setAttribute('display', 'none'); return; }
    B.rig.setAttribute('display', 'inline');
    B.rig.setAttribute('transform', tr(x, y, rot * mir, sc) + ' scale(' + mir + ',1)');
    B.content.setAttribute('d', bagContent(level));
    B.body.setAttribute('transform', 'translate(0,-14) scale(' + f2(1 + squeeze) + ',' + f2(1 - squeeze * 0.4) + ') translate(0,14)');
    B.top.setAttribute('transform', tr(0, -95 + squeeze * 30, 32 - squeeze * 60));
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var T = S.T, sx = S.sx;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1200)) * (1 - eioC(seg(t, 6900, 7600)));
    var Z = lerp(1, 1.12, zk);
    var ccy = lerp(H / 2, clamp(T.y - 10, 255, 355), zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');
    function toScreen(p) { return [W / 2 + (p[0] - W / 2) * Z, H / 2 + (p[1] - ccy) * Z]; }

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 7000, 7500)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- Nate's chip: singled out ----
    var vs = chipPop(T), vy = T.y, vx = T.x, vsx = 1, vsy = 1;
    vy -= 6 * Math.sin(Math.PI * seg(t, 650, 830));
    vs *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 830));
    var land = spring(t - 830, 0.1, 4, 90); vsx += land; vsy -= land;
    // flinch as the bag arrives, shiver while it aims
    var fl = spring(t - 1430, 0.09, 4, 110); vsx += fl; vsy -= fl;
    if (t > 1500 && t < 1720) vx += 1.2 * Math.sin(t * 0.2) * (1 - seg(t, 1500, 1720));
    S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') scale(' + f2(vs * vsx) + ',' + f2(vs * vsy) + ')');
    S.vSh.setAttribute('r', f1(CR * Math.min(1, vs)));
    var vHide = t >= 4640;
    S.vG.setAttribute('display', vHide ? 'none' : 'inline');

    // ---- the swirl ----
    var P = pipeP(t);
    var peak = swPt(T, 1);
    var J = spring(t - 3150, 0.075, 3.2, 170) + spring(t - 4215, 0.07, 4.2, 110) + spring(t - 1720, 0.05, 5, 80);
    var spPress = eio(seg(t, 4200, 4290)) * 0.06 * (1 - seg(t, 4290, 4500));
    var by = T.y + 16;
    S.swG.setAttribute('transform', 'translate(' + f1(T.x) + ',' + f1(by) + ') scale(' + f2(1 + J * 0.6 + spPress * 0.6) + ',' + f2(1 - J - spPress) + ') translate(' + f1(-T.x) + ',' + f1(-by) + ')');
    var swVis = t >= 1690 && t < 4640;
    S.swW.setAttribute('display', swVis ? 'inline' : 'none');
    if (swVis) {
      S.swSh.setAttribute('rx', f1(29 * clamp(P * 4))); S.swSh.setAttribute('ry', f1(23 * clamp(P * 4)));
      S.swFill.setAttribute('opacity', f2(seg(P, 0.28, 0.45)));
      S.chunks.forEach(function (c) {
        var b = Math.min(c.b, P);
        var d = b > c.a + 0.002 ? chunkD(T, c.a, b) : '';
        c.ink.setAttribute('d', d); c.sh.setAttribute('d', d); c.col.setAttribute('d', d); c.gr.setAttribute('d', d); c.hi.setAttribute('d', d);
      });
    }
    // peak tail: stretch on pull-off, snap, curl
    var tailL = 0, bend = 0, nozTop = null;
    if (t >= 2990) {
      var pu = seg(t, 3000, 3150);
      if (t < 3150) { tailL = 6 + 24 * eio(pu); bend = 0; }
      else { var d0 = t - 3150; tailL = 11 + 19 * Math.exp(-d0 / 70) * Math.cos(2 * Math.PI * 3 * d0 / 1000); bend = -sx * 1.5 * backOut(seg(t, 3150, 3420), 1.6); }
      var td = tailD(peak, tailL, 8.6 * (t < 3150 ? lerp(1, 0.55, eio(pu)) : 1), bend);
      S.tail.setAttribute('d', td.d); S.tailHi.setAttribute('d', td.spine);
      nozTop = td.tip;
    } else { S.tail.setAttribute('d', ''); S.tailHi.setAttribute('d', ''); }

    // ---- piping bag ----
    var bx, byy, brot = 18, bvis = t >= 1000 && t < 3480, level = -70, squeeze = 0;
    var start = swPt(T, 0), above = [start[0], start[1] - 8];
    if (t < 1500) {
      var pin = seg(t, 1000, 1500), q = eoC(pin);
      var from = [T.x + 150 * sx, T.y - 330];
      var pp = arc2(from, above, -60, q);
      bx = pp[0]; byy = pp[1] + 10 * Math.sin(Math.PI * clamp((pin - 0.7) / 0.3)) ;
      brot = lerp(55, 18, backOut(pin, 1.4));
    } else if (t < 1700) {
      var ap = seg(t, 1500, 1700);
      bx = above[0]; byy = above[1] - 7 * Math.sin(Math.PI * ap);
      brot = 18 - 4 * Math.sin(Math.PI * ap);
      squeeze = 0.09 * eio(seg(t, 1580, 1700));
    } else if (t < 3000) {
      var e = swPt(T, P), sth = sw(P).th;
      bx = e[0]; byy = e[1] - 8;
      brot = 18 + 7 * Math.sin(sth) * sx;
      level = lerp(-70, -34, P);
      squeeze = 0.06 + 0.03 * Math.sin(t * 0.03);
    } else {
      level = -34;
      var po = seg(t, 3150, 3480);
      var nz = [peak[0], peak[1] - 6 - tailL];
      if (t < 3150) { bx = nz[0]; byy = nz[1]; brot = 18 - 6 * seg(t, 3000, 3150); }
      else { var lp = arc2([peak[0], peak[1] - 36], [T.x + 170 * sx, T.y - 330], 10, ei(po)); bx = lp[0]; byy = lp[1]; brot = lerp(12, 50, eio(po)); }
      squeeze = 0.06 * (1 - seg(t, 3000, 3100));
    }
    setBag(S.bag, bx, byy, brot, 1.05, level, squeeze, bvis, sx);
    // stream nozzle -> rope
    if (t >= 1700 && t < 3000) {
      var e2 = swPt(T, P), wN = sw(P).w;
      var sd = 'M' + f1(bx) + ' ' + f1(byy - 1) + 'L' + f1(e2[0]) + ' ' + f1(e2[1]);
      S.streamInk.setAttribute('d', sd); S.streamInk.setAttribute('stroke-width', f1(wN * 0.8 + 4.4));
      S.streamCol.setAttribute('d', sd); S.streamCol.setAttribute('stroke-width', f1(wN * 0.8));
    } else { S.streamInk.setAttribute('d', ''); S.streamCol.setAttribute('d', ''); }
    var bl = seg(t, 1620, 1700);
    S.blip.setAttribute('r', bl > 0 && t < 1720 ? f1(2 + 4 * eo(bl)) : 0);
    S.blip.setAttribute('cx', f1(above[0])); S.blip.setAttribute('cy', f1(above[1] + 3 + 4 * bl));

    // ---- cherry: offered... thought better of ----
    var chVis = t >= 3280 && t < 4080;
    S.cherry.setAttribute('display', chVis ? 'inline' : 'none');
    if (chVis) {
      var hov = [peak[0] + 4, peak[1] - 12 - 30], low = [hov[0], hov[1] + 7];
      var cfrom = [T.x - 170 * sx, T.y - 320];
      var cp, crot = 0;
      if (t < 3520) { var ci = seg(t, 3280, 3520); cp = arc2(cfrom, hov, -40, eoC(ci)); crot = 28 * (1 - eoC(ci)) + spring(t - 3520, -10, 2.2, 160); }
      else if (t < 3900) {
        var lo = eio(seg(t, 3540, 3640)) * (1 - eio(seg(t, 3820, 3900)));
        cp = [lerp(hov[0], low[0], lo), lerp(hov[1], low[1], lo)];
        crot = spring(t - 3520, -10, 2.2, 160) + 13 * Math.sin(2 * Math.PI * (t - 3660) / 300) * seg(t, 3660, 3700) * (1 - seg(t, 3820, 3880));
      } else { var co = seg(t, 3900, 4080); cp = arc2(hov, cfrom, 30, ei(co)); crot = -16 * eo(co); }
      S.cherry.setAttribute('transform', tr(cp[0], cp[1], crot * sx) + ' scale(' + sx + ',1)');
    }

    // ---- spatula: one satisfying swipe ----
    var x0 = T.x - 36, x1 = T.x + 44, spY = T.y - 6;
    var spVis = t >= 4000 && t < 4920, spX = x0, spRot = 0, spYY = spY, blobP = 0, spSc = 1;
    if (t < 4220) { var si = seg(t, 4000, 4220); var sp0 = arc2([T.x + 90, T.y - 320], [x0, spY - 10], -30, eoC(si)); spX = sp0[0]; spYY = sp0[1]; spRot = lerp(-30, 0, eoC(si)); }
    else if (t < 4290) { spYY = spY - 10 + 10 * eio(seg(t, 4220, 4290)); spSc = 1 - 0.03 * seg(t, 4220, 4290); }
    else if (t < 4620) { var swp = eioC(seg(t, 4290, 4620)); spX = lerp(x0, x1, swp); spRot = -9 * Math.sin(Math.PI * swp); blobP = swp; spSc = 0.97; }
    else { var so = seg(t, 4620, 4920); var sp1 = arc2([x1, spY], [T.x + 200, T.y - 330], 16, ei(so)); spX = sp1[0]; spYY = sp1[1]; spRot = 20 * eo(so); blobP = 1; spSc = 0.97 + 0.08 * eo(so); }
    S.spat.setAttribute('display', spVis ? 'inline' : 'none');
    if (spVis) {
      S.spat.setAttribute('transform', tr(spX, spYY, spRot, spSc));
      var brx = 2 + 7 * blobP, bry = 5 + 15 * blobP;
      S.blobE.setAttribute('cx', f1(5 + brx)); S.blobE.setAttribute('rx', f1(brx)); S.blobE.setAttribute('ry', f1(bry));
      S.blobH.setAttribute('cx', f1(5 + brx * 1.1)); S.blobH.setAttribute('cy', f1(-bry * 0.35)); S.blobH.setAttribute('ry', f1(bry * 0.4));
      S.blobE.parentNode.setAttribute('display', t >= 4290 ? 'inline' : 'none');
    }
    var cut = t < 4290 ? x0 : t < 4620 ? spX : 5000;
    S.clipSw.setAttribute('x', f1(cut));
    S.clipCo.setAttribute('width', f1(Math.max(0, cut + 3000)));

    // ---- the coat ----
    var coatVis = t >= 4290;
    S.coatW.setAttribute('display', coatVis ? 'inline' : 'none');
    if (coatVis) {
      var cd = t - 4290, amp = t < 4620 ? 1.6 : 1.6 * Math.exp(-(t - 4620) / 200);
      var sq = spring(t - 4630, 0.05, 3.4, 140) + spring(t - 7300, 0.06, 3.6, 120);
      S.coatG.setAttribute('transform', 'translate(' + T.x + ',' + T.y + ') scale(' + f2(1 + sq) + ',' + f2(1 - sq) + ')');
      S.coat.setAttribute('d', amp > 0.05 ? wavyCircle(CR, amp, cd * 0.012) : wavyCircle(CR, 0, 0));
      var stA = 1 - seg(t, 4700, 5150);
      S.streaks.setAttribute('opacity', f2(0.75 * stA));
      S.streaks.setAttribute('d', 'M-15 -5 Q0 -9 15 -5 M-17 6 Q0 2 17 6 M-11 14 Q0 11 11 14');
      // gloss glints: one for the colour change, one for the set-down
      var g1 = seg(t, 4680, 5000), g2 = seg(t, 7330, 7640), gp = g2 > 0 ? g2 : g1;
      S.glint.setAttribute('opacity', gp > 0 && gp < 1 ? f2(0.55 * Math.sin(Math.PI * gp)) : 0);
      S.glint.setAttribute('transform', 'translate(' + f1(lerp(-34, 38, eio(gp))) + ',0)');
      // piped ring + initial
      var rp = eio(seg(t, 5200, 5520));
      S.ring.setAttribute('d', ringD(rp));
      var ip = seg(t, 5580, 5900);
      S.clipTx.setAttribute('width', f1(28 * eio(ip)));
    }
    var sr = seg(t, 7300, 7800);
    S.setRing.setAttribute('r', f1(CR + 22 * eoC(sr)));
    S.setRing.setAttribute('opacity', sr > 0 && sr < 1 ? f1((1 - sr) * 80) / 100 : 0);
    S.setRing.setAttribute('stroke-width', f1(3.5 * (1 - sr) + 0.8));

    // ---- white icing bag: ring then initial ----
    var wvis = t >= 4950 && t < 6160, wx = 0, wy = 0, wr = 15, wsq = 0, wlev = -60, wdot = 0, wtip = null;
    if (wvis) {
      var ringStart = [T.x + 15.5, T.y - 5];
      if (t < 5200) { var wi = seg(t, 4950, 5200); var w0 = arc2([T.x + 160 * sx, T.y - 320], ringStart, -40, eoC(wi)); wx = w0[0]; wy = w0[1]; wr = lerp(50, 15, backOut(wi, 1.3)); }
      else if (t < 5520) { var a = rp * Math.PI * 2; wx = T.x + Math.cos(a) * 15.5; wy = T.y + Math.sin(a) * 15.5 - 5; wr = 15 + 6 * Math.sin(a) * sx; wsq = 0.05; wtip = [wx, wy + 5]; wlev = lerp(-60, -50, rp); }
      else if (t < 5580) { var mv = eio(seg(t, 5520, 5580)); wx = lerp(T.x + 15.5, T.x - 10, mv); wy = T.y - 5 - 6 * Math.sin(Math.PI * mv); wlev = -50; }
      else if (t < 5900) { wx = T.x - 10 + 20 * eio(ip); wy = T.y - 5 + 4.5 * Math.sin(ip * Math.PI * 3); wsq = 0.05; wtip = [wx, wy + 5]; wlev = lerp(-50, -42, ip); }
      else { var wo = seg(t, 5900, 6160); var w1 = arc2([T.x + 10, T.y - 5], [T.x + 180 * sx, T.y - 330], 16, ei(wo)); wx = w1[0]; wy = w1[1]; wr = lerp(15, 50, eio(wo)); wlev = -42; }
    }
    setBag(S.wbag, wx, wy, wr, 0.75, wlev, wsq, wvis, sx);
    if (wtip) { S.wStream.setAttribute('r', 2.2); S.wStream.setAttribute('cx', f1(wtip[0])); S.wStream.setAttribute('cy', f1(wtip[1])); }
    else S.wStream.setAttribute('r', 0);

    // ---- sprinkles: offered, politely withdrawn ----
    var shVis = t >= 6100 && t < 6800;
    S.shaker.setAttribute('display', shVis ? 'inline' : 'none');
    if (shVis) {
      var shPos = [T.x + 8, T.y - 40], shF = [T.x + 190, T.y - 300], spos, srot;
      if (t < 6300) { var s1 = seg(t, 6100, 6300); spos = arc2(shF, shPos, -30, eoC(s1)); srot = lerp(60, 34, eoC(s1)); }
      else if (t < 6620) {
        spos = shPos;
        srot = kf([[6300, 34], [6400, -8, function (x) { return backOut(x, 1.5); }], [6560, -8], [6620, 30, eio]], t);
        srot += 5 * Math.sin(2 * Math.PI * (t - 6470) / 110) * seg(t, 6470, 6490) * (1 - seg(t, 6540, 6560));
      } else { var s2 = seg(t, 6620, 6800); spos = arc2(shPos, shF, 20, ei(s2)); srot = lerp(30, 60, eio(s2)); }
      S.shaker.setAttribute('transform', tr(spos[0], spos[1], srot, 1.45));
      var pk = eio(seg(t, 6410, 6470)) * (1 - eio(seg(t, 6560, 6610)));
      S.sprink.setAttribute('y', f1(-8 + 10 * pk));
      S.sprink.setAttribute('display', pk > 0.01 ? 'inline' : 'none');
    }

    // ---- the baker just off the top of the frame ----
    var hxw = toScreen([T.x + 46 * sx, 0])[0];
    var hx = clamp(hxw, 70, 320);
    var hatK = backOut(seg(t, 950, 1200), 1.8) * (1 - eio(seg(t, 6640, 6820)));
    var hb = 0, hr = 0;
    if (t > 1700 && t < 3000) { var th = sw(P).th; hb = 2.5 * Math.cos(th); hr = 3 * Math.sin(th); }
    hr += 9 * Math.sin(2 * Math.PI * (t - 3660) / 300) * seg(t, 3660, 3700) * (1 - seg(t, 3820, 3880)); // "hmm"
    hr += -6 * Math.sin(Math.PI * seg(t, 4290, 4620)) * sx; // leaning into the swipe
    hr += 8 * Math.sin(2 * Math.PI * (t - 6480) / 140) * seg(t, 6480, 6500) * (1 - seg(t, 6600, 6620)); // "no"
    hb += 3 * Math.sin(Math.PI * seg(t, 4220, 4320)); // press
    S.hat.setAttribute('display', hatK > 0.005 ? 'inline' : 'none');
    S.hat.setAttribute('transform', tr(hx + hr * 0.6, -62 + 62 * hatK + hb, hr, 1.35));
    var apK = eoC(seg(t, 6700, 6880)) * (1 - eio(seg(t, 7120, 7330)));
    S.apron.setAttribute('display', apK > 0.005 ? 'inline' : 'none');
    S.apron.setAttribute('transform', 'translate(' + f1(hx) + ',' + f1(-40 + 72 * apK + 2 * Math.sin(Math.PI * seg(t, 6880, 7080) * 3)) + ')');
    var wk = eoC(seg(t, 6760, 6880)) * (1 - eio(seg(t, 7080, 7270)));
    var wv = wk > 0.005;
    S.wipeL.setAttribute('display', wv ? 'inline' : 'none'); S.wipeR.setAttribute('display', wv ? 'inline' : 'none');
    if (wv) {
      var rub = Math.sin(2 * Math.PI * (t - 6880) / 200) * seg(t, 6860, 6900) * (1 - seg(t, 7060, 7090));
      var gy = -50 + 104 * wk;
      S.wipeL.setAttribute('transform', tr(hx - 34 + 12 * rub, gy + 2 * Math.abs(rub), 14 + 8 * rub));
      S.wipeR.setAttribute('transform', tr(hx + 34 - 12 * rub, gy + 2 * Math.abs(rub), -14 + 8 * rub));
    }

    // final line
    var lp2 = seg(t, 7700, 8050);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2frosting;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2frosting = S;
    return S;
  }

  window.CCSteal2_frosting = {
    title: 'The Baker',
    blurb: 'Two gloved baker’s hands pipe a swirl of frosting in Nick’s colour onto Nate’s chip, think better of the cherry, swipe it flat with one glossy pass, pipe Nick’s initial on top and politely leave - the chip never moved, it just got frosted.',
    duration: T_END,
    frame: function (root, opts, ms) { render(getScene(root, opts), ms || 0); },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2frosting = S;
      var token = {};
      root.__cc2frostingToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2frostingToken !== token) { resolve(); return; }
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
