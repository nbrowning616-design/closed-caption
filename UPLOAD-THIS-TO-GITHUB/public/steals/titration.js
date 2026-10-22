/* Closed Caption steal film: titration (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE ENDPOINT (titration)
 *
 * Storyboard (ms) - top-down felt table, caption rows 1/2/3/CC. The lab rig is
 * a little pop-up: it stands up out of a slot in the caption card, behind the chip.
 *    0- 750  Table deals in: rows drop with a soft overshoot, chips pop on.
 *  750-1150  Single out: other chips dim, Nate's chip hops and a pair of lab
 *            goggles snaps onto it (eyes behind the lenses). Gentle push-in.
 * 1150-1700  A ring stand + burette rises from a slot behind the chip, overshoots
 *            and settles; the burette liquid is Nick's colour. Chip looks up.
 * 1850-2150  A gloved hand (lab-coat sleeve) slides in and pinches the stopcock.
 * 2150-3100  Tap cracks open. ONE drop... lands. A faint swirl of Nick's colour,
 *            the chip swirls like a flask - and it fades. Deadpan stare at camera.
 * 3100-3950  Another drop. Bigger swirl, hopeful brows... fades again.
 * 3950-4620  Glove opens the tap more: drips speed up (eyes dart up/down),
 *            each swirl lingers longer. Getting close.
 * 4600-4720  Panic: the glove snaps the tap almost shut, the burette jolts.
 * 4720-5580  THE LAST DROP: it swells at the tip, quivers. Chip goes cross-eyed,
 *            worried brows; the glove nudges the tap a hair; drop lets go; eyes shut.
 * 5580-5800  ENDPOINT: the colour snaps from the impact point across the whole chip,
 *            "Na" becomes "Ni", ping-ripples, chip pulse. It stays.
 * 5800-6300  Beat: chip looks down at itself... then at you, smug half-lids.
 *            Glove slides away.
 * 6280-6700  Rig sinks back into the card; slot closes.
 * 6680-7300  Set-down: chip flicks the goggles off, lifts a hair and plonks into
 *            its exact spot (squash, ring, dust ticks). Camera eases back.
 * 7300-7550  Stillness.
 * 7550-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var GLASS = '#E4F1F2', STEEL = '#9AA6AC', STEEL_DK = '#6B767C', CORK = '#D8A35F', GLOVE = '#D4E3F7', COAT = '#FFFFFF';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22;
  var T_END = 10000;
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

  // ---------- rig geometry (world) ----------
  function rigGeo(T) {
    var tipY = T.y - 33;
    var sY = tipY - 15;                       // stopcock boss
    var tubeBot = sY - 6;
    var Lt = clamp(tubeBot - 16, 48, 112);    // tube length adapts near the top of the table
    var topY = tubeBot - Lt;
    var rodX = T.x - 38, floorY = T.y + 9;
    return { x: T.x, tipY: tipY, sY: sY, tubeBot: tubeBot, Lt: Lt, topY: topY, rodX: rodX, floorY: floorY,
      rigTop: topY - 6, landY: T.y + 5 };
  }

  // ---------- drops: [formStart, detach, land, swirlStrength, fadeLen] ----------
  var DROPS = [
    [2250, 2500, 2590, 0.34, 420],
    [3150, 3400, 3490, 0.52, 620],
    [4020, 4170, 4250, 0.6, 470],
    [4250, 4360, 4440, 0.72, 500],
    [4440, 4520, 4600, 0.85, 540],
    [4720, 5480, 5580, 0, 0]          // the endpoint drop
  ];
  var T_EP = 5580;

  // ---------- timelines ----------
  function tapOpen(t) {
    return kf([[0, 0], [2150, 0], [2260, 0.22, eoC], [3000, 0.22], [3080, 0.34, eoC], [3930, 0.34], [4030, 0.62, eoC],
      [4600, 0.62], [4660, 0.04, eoC], [5330, 0.04], [5400, 0.12, eoC], [5640, 0.12], [5700, 0, eoC]], t);
  }
  function lookX(t) {
    return kf([[0, 0], [1880, 0], [1960, 0.85], [2120, 0.85], [2200, 0], [2780, 0], [2860, 0], [4600, 0], [4640, 0.8], [4760, 0.8], [4820, 0]], t);
  }
  function lookY(t) {
    return kf([[0, 0], [1250, 0], [1450, -1], [1880, -1], [1960, -0.45], [2120, -0.45], [2200, -1], [2500, -1], [2580, 1, ei],
      [2780, 1], [2860, 0], [3120, 0], [3200, -1], [3400, -1], [3480, 1, ei], [3850, 1], [3930, 0], [4000, 0], [4060, -1],
      [4170, -1], [4235, 1], [4255, 1], [4300, -1], [4360, -1], [4420, 1], [4445, 1], [4480, -1], [4520, -1], [4585, 1], [4605, 1],
      [4640, -0.5], [4760, -0.5], [4820, -1], [5480, -1], [5560, 1, ei], [5700, 1], [5760, 1], [6080, 1], [6180, 0]], t);
  }
  function converge(t) { return eio(seg(t, 4950, 5200)) * (1 - seg(t, 5480, 5520)); }
  function lidAt(t) {
    return kf([[0, 0], [1180, 0], [1230, 1], [1290, 1], [1350, 0], [2820, 0], [2900, 0.48], [3080, 0.48], [3140, 0],
      [3880, 0], [3940, 0.35], [4000, 0.35], [4040, 0], [5150, 0], [5250, 0.32], [5500, 0.32], [5540, 1], [5620, 1], [5650, 0, eoC],
      [6120, 0], [6230, 0.5], [6640, 0.5], [6680, 0]], t);
  }
  function eyeScale(t) { return 1 + 0.28 * eo(seg(t, 5620, 5680)) * (1 - eio(seg(t, 5800, 6100))) + spring(t - 4600, 0.12, 5, 100); }
  function browRaise(t) { return kf([[0, 0], [3440, 0], [3520, -2.2], [3850, -2.2], [3930, 0.6], [4020, 0.6], [4080, 0], [4600, 0], [4650, -1.4], [5520, -1.4], [5560, 1.2], [5620, 1.2], [5660, -3, eoC], [6050, -2.5], [6200, 1.1]], t); }
  function browWorry(t) { return kf([[0, 0], [3880, 0], [3940, 0.5], [4020, 0.5], [4080, 0], [4600, 0], [4660, 1], [5500, 1], [5620, 0.4], [5660, -0.2], [6150, -0.2], [6220, -0.55]], t); }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-titration-' + (++uid) + '-';
    var L = layout(opts), T = L.target, G = rigGeo(T);
    var dCol = opts.dealerColor || '#E8559E', vCol = opts.victimColor || T.color;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpChip = el('clipPath', { id: id + 'chip' }, defs); el('circle', { r: CR - 1.2 }, cpChip);
    var cpFill = el('clipPath', { id: id + 'fill' }, defs); var fillC = el('circle', { cx: 0, cy: 5, r: 0 }, cpFill);
    var cpFlash = el('clipPath', { id: id + 'flash' }, defs); var flashP = el('path', { d: '', 'clip-rule': 'evenodd' }, cpFlash);
    var cpFloor = el('clipPath', { id: id + 'floor', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -50, y: -400, width: W + 100, height: f1(G.floorY + 400) }, cpFloor);
    var cpTube = el('clipPath', { id: id + 'tube', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: G.x - 5.3, y: G.topY, width: 10.6, height: f1(G.Lt + 20), rx: 2 }, cpTube);

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
      return { g: g, tx: tx, fs: txt.length > 1 ? 15 : 18 };
    }

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
        if (c.target) return;
        var wrap = el('g', {}, chipLayer);
        var sh = el('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        var cg = makeChip(wrap, c.color, c.ini).g;
        chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
      });
    });

    // ---- slot in the card + rig (behind the target chip) ----
    var slot = el('rect', { x: f1(G.rodX - 10), y: f1(G.floorY - 2.5), width: f1(G.x + 14 - (G.rodX - 10)), height: 5, rx: 2.5, fill: INK, opacity: 0 }, cam);
    var rigClip = el('g', { 'clip-path': 'url(#' + id + 'floor)' }, cam);
    var rig = el('g', {}, rigClip);
    var rodTop = G.topY + 2;
    // base + rod
    el('rect', { x: f1(G.rodX - 3), y: f1(rodTop), width: 6, height: f1(G.floorY - rodTop), rx: 3, fill: STEEL, stroke: INK, 'stroke-width': 2 }, rig);
    el('rect', { x: f1(G.rodX - 1.6), y: f1(rodTop + 4), width: 1.6, height: f1(G.floorY - rodTop - 10), fill: '#FFFFFF', opacity: 0.45 }, rig);
    el('rect', { x: f1(G.rodX - 7), y: f1(G.floorY - 8), width: 34, height: 9, rx: 3, fill: STEEL_DK, stroke: INK, 'stroke-width': 2 }, rig);
    // clamp arms
    var swayG = el('g', {}, rig);
    var armYs = [G.topY + G.Lt * 0.28, G.tubeBot - 14];
    armYs.forEach(function (ay) {
      el('rect', { x: f1(G.rodX - 5), y: f1(ay - 5), width: 10, height: 10, rx: 2, fill: STEEL_DK, stroke: INK, 'stroke-width': 1.8 }, rig);
      el('rect', { x: f1(G.rodX + 4), y: f1(ay - 2), width: f1(G.x - G.rodX - 14), height: 4, rx: 2, fill: STEEL, stroke: INK, 'stroke-width': 1.6 }, rig);
    });
    // burette (sways a touch around the lower clamp)
    var bur = el('g', {}, swayG);
    // tip / nozzle
    el('path', { d: 'M' + f1(G.x - 3.2) + ' ' + f1(G.sY + 4) + 'L' + f1(G.x - 1.6) + ' ' + f1(G.tipY) + 'L' + f1(G.x + 1.6) + ' ' + f1(G.tipY) + 'L' + f1(G.x + 3.2) + ' ' + f1(G.sY + 4) + 'Z', fill: GLASS, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, bur);
    var nozLiq = el('rect', { x: f1(G.x - 0.9), y: f1(G.sY + 4), width: 1.8, height: f1(G.tipY - G.sY - 5), fill: dCol, opacity: 0 }, bur);
    // tube glass
    el('rect', { x: f1(G.x - 7), y: f1(G.topY), width: 14, height: f1(G.Lt + 4), rx: 3, fill: GLASS, stroke: INK, 'stroke-width': 2.2 }, bur);
    var liqG = el('g', { 'clip-path': 'url(#' + id + 'tube)' }, bur);
    var liq = el('path', { d: '', fill: dCol }, liqG);
    el('rect', { x: f1(G.x + 1.6), y: f1(G.topY + 4), width: 2, height: f1(G.Lt - 6), rx: 1, fill: '#FFFFFF', opacity: 0.55 }, bur);
    var tk = '';
    for (var yy = G.topY + 10, k = 0; yy < G.tubeBot - 4; yy += 7, k++) tk += 'M' + f1(G.x - 7) + ' ' + f1(yy) + 'h' + (k % 3 === 0 ? 6 : 3.5);
    el('path', { d: tk, stroke: INK, 'stroke-width': 1.1, 'stroke-opacity': 0.75, fill: 'none' }, bur);
    // lip
    el('rect', { x: f1(G.x - 9), y: f1(G.topY - 3), width: 18, height: 4.5, rx: 2.2, fill: GLASS, stroke: INK, 'stroke-width': 2 }, bur);
    // lower glass neck into stopcock
    el('path', { d: 'M' + f1(G.x - 6) + ' ' + f1(G.tubeBot + 3.5) + 'Q' + f1(G.x - 4) + ' ' + f1(G.sY - 2) + ' ' + f1(G.x - 3) + ' ' + f1(G.sY) + 'L' + f1(G.x + 3) + ' ' + f1(G.sY) + 'Q' + f1(G.x + 4) + ' ' + f1(G.sY - 2) + ' ' + f1(G.x + 6) + ' ' + f1(G.tubeBot + 3.5) + 'Z', fill: GLASS, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, bur);
    // clamp jaws (over the tube)
    armYs.forEach(function (ay) {
      el('rect', { x: f1(G.x - 10.5), y: f1(ay - 4), width: 21, height: 8, rx: 3, fill: CORK, stroke: INK, 'stroke-width': 1.8 }, rig);
    });
    // stopcock key
    var handle = el('path', { d: 'M-9 0L9 0', stroke: INK, 'stroke-width': 5.4, 'stroke-linecap': 'round' }, bur);
    var handleIn = el('path', { d: 'M-9 0L9 0', stroke: '#F2EDE2', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, bur);
    el('circle', { cx: G.x, cy: G.sY, r: 4.4, fill: '#F2EDE2', stroke: INK, 'stroke-width': 1.8 }, bur);
    el('circle', { cx: G.x, cy: G.sY, r: 1.3, fill: INK }, bur);

    // ---- target chip ----
    var tWrap = el('g', {}, cam);
    var tSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, tWrap);
    var tg = el('g', {}, tWrap);
    var chipA = makeChip(tg, vCol, T.ini);
    var swG = el('g', { 'clip-path': 'url(#' + id + 'chip)' }, tg);
    var spirals = DROPS.slice(0, 5).map(function (d, i) {
      var pts = '', turns = 2.4 + i * 0.15, R = 9 + i * 1.2;
      for (var s = 0; s <= 60; s++) {
        var u = s / 60, a = u * turns * 2 * Math.PI + i * 1.7, r = 0.6 + R * Math.pow(u, 0.85);
        pts += (s ? 'L' : 'M') + f1(Math.cos(a) * r) + ' ' + f1(Math.sin(a) * r * 0.86);
      }
      return el('path', { d: pts, fill: 'none', stroke: dCol, 'stroke-width': 2.4 + i * 0.25, 'stroke-linecap': 'round', opacity: 0 }, swG);
    });
    var fillG = el('g', { 'clip-path': 'url(#' + id + 'fill)' }, tg);
    var chipB = makeChip(fillG, dCol, L.ini(opts.dealer));
    var flashG = el('g', { 'clip-path': 'url(#' + id + 'flash)', opacity: 0 }, tg);
    el('circle', { r: CR - 1.3, fill: '#FFFFFF' }, flashG);
    // goggles
    var gog = el('g', {}, tg);
    el('path', { d: 'M-21.2 -4.6Q0 -8.4 21.2 -4.6', fill: 'none', stroke: INK, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, gog);
    el('path', { d: 'M-3 -6.2Q0 -8.2 3 -6.2', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, gog);
    var lids = [], pups = [], glints = [], brows = [], eyeG = [];
    [-1, 1].forEach(function (s) {
      var cx = 8.6 * s, cy = -5.6;
      el('circle', { cx: cx, cy: cy, r: 8.2, fill: '#BFD9DE', stroke: INK, 'stroke-width': 2.2 }, gog);
      var eg = el('g', {}, gog);
      el('circle', { cx: cx, cy: cy, r: 6.3, fill: '#FFFFFF' }, eg);
      pups.push(el('circle', { cx: cx, cy: cy, r: 2.7, fill: INK }, eg));
      glints.push(el('circle', { cx: cx, cy: cy, r: 0.9, fill: '#FFFFFF' }, eg));
      lids.push(el('path', { d: '', stroke: INK, 'stroke-width': 1.2 }, eg));
      eyeG.push(eg);
      el('path', { d: 'M' + f1(cx - 4.5) + ' ' + f1(cy - 3.5) + 'A6 6 0 0 1 ' + f1(cx + 1.5) + ' ' + f1(cy - 5.6), fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0.85 }, gog);
      brows.push(el('path', { d: 'M-3.2 0L3.2 0', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, gog));
    });

    // ---- drops / splash / pings (world) ----
    var fx = el('g', {}, cam);
    var fallDrop = el('path', { d: '', fill: dCol, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, fx);
    var splash = el('ellipse', { cx: G.x, cy: G.landY, rx: 0, ry: 0, fill: 'none', stroke: dCol, 'stroke-width': 2, opacity: 0 }, fx);
    var rings = [0, 1].map(function () { return el('circle', { cx: T.x, cy: T.y, r: CR, fill: 'none', stroke: dCol, opacity: 0 }, fx); });
    var pingT = el('path', { d: '', fill: 'none', stroke: dCol, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var setRing = el('circle', { cx: T.x, cy: T.y, r: CR, fill: 'none', stroke: dCol, opacity: 0 }, fx);
    var dust = el('path', { d: '', fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, fx);

    // ---- glove + sleeve ----
    var armG = el('g', {}, cam);
    var sleeve = el('path', { d: '', fill: COAT, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round' }, armG);
    var hand = el('g', {}, armG);
    function finger(a, b) {
      el('path', { d: 'M' + a + 'L' + b, stroke: INK, 'stroke-width': 7.6, 'stroke-linecap': 'round' }, hand);
      el('path', { d: 'M' + a + 'L' + b, stroke: GLOVE, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, hand);
    }
    el('ellipse', { cx: 11, cy: 0.5, rx: 8.8, ry: 7.4, fill: GLOVE, stroke: INK, 'stroke-width': 2 }, hand);
    finger('9 -5.2', '1.6 -4');
    finger('9 5.2', '1.6 4');
    el('path', { d: 'M6 -1.2Q9 0.4 12 -0.6', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.55 }, hand);
    el('rect', { x: 17, y: -7.6, width: 6, height: 15.2, rx: 2.5, fill: GLOVE, stroke: INK, 'stroke-width': 2 }, hand);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return { opts: opts, L: L, G: G, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, slot: slot, rig: rig, swayG: swayG, bur: bur,
      liq: liq, nozLiq: nozLiq, handle: handle, handleIn: handleIn, tSh: tSh, tg: tg, chipA: chipA, chipB: chipB,
      spirals: spirals, fillC: fillC, flashP: flashP, flashG: flashG, gog: gog, pups: pups, glints: glints, lids: lids, brows: brows, eyeG: eyeG,
      fallDrop: fallDrop, splash: splash, rings: rings, pingT: pingT, setRing: setRing, dust: dust, sleeve: sleeve, hand: hand, line: line };
  }

  // teardrop hanging from (x, y0) with bulb radius r and extra neck length n
  function hangPath(x, y0, r, n, wob) {
    if (r < 0.3) return '';
    var cy = y0 + n + r, rx = r * (1 + wob), ry = r * (1 - wob * 0.7);
    var nw = Math.min(1.6, r * 0.6);
    return 'M' + f1(x - nw) + ' ' + f1(y0) + 'C' + f1(x - nw) + ' ' + f1(y0 + n * 0.6) + ' ' + f1(x - rx) + ' ' + f1(cy - ry * 0.9) + ' ' + f1(x - rx) + ' ' + f1(cy) +
      'A' + f1(rx) + ' ' + f1(ry) + ' 0 0 0 ' + f1(x + rx) + ' ' + f1(cy) +
      'C' + f1(x + rx) + ' ' + f1(cy - ry * 0.9) + ' ' + f1(x + nw) + ' ' + f1(y0 + n * 0.6) + ' ' + f1(x + nw) + ' ' + f1(y0) + 'Z';
  }
  // falling teardrop, centre (x, y), radius r, vertical stretch s
  function fallPath(x, y, r, s) {
    var ry = r * s, rx = r / Math.sqrt(s);
    return 'M' + f1(x) + ' ' + f1(y - ry * 2.1) + 'C' + f1(x + rx * 0.4) + ' ' + f1(y - ry * 1.2) + ' ' + f1(x + rx) + ' ' + f1(y - ry * 0.6) + ' ' + f1(x + rx) + ' ' + f1(y) +
      'A' + f1(rx) + ' ' + f1(ry) + ' 0 0 1 ' + f1(x - rx) + ' ' + f1(y) +
      'C' + f1(x - rx) + ' ' + f1(y - ry * 0.6) + ' ' + f1(x - rx * 0.4) + ' ' + f1(y - ry * 1.2) + ' ' + f1(x) + ' ' + f1(y - ry * 2.1) + 'Z';
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = L.target, G = S.G;

    // camera: gentle push-in that never crops the rows
    var zk = eioC(seg(t, 750, 1600)) * (1 - eioC(seg(t, 6550, 7350)));
    var ZM = 1.28, Z = lerp(1, ZM, zk), hh = H / (2 * ZM);
    var cyT = clamp(T.y - 40, Math.min(hh, G.rigTop - 10 + hh), H - hh);
    var ccy = lerp(H / 2, cyT, zk), ccx = lerp(W / 2, 196, zk);
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 780, 1050)) * (1 - eio(seg(t, 6600, 7100)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ---- rig rise / sink ----
    var riseH = G.floorY - G.rigTop + 14;
    var rp = seg(t, 1150, 1650), sp = seg(t, 6280, 6680);
    var off = rp < 1 ? riseH * (1 - backOut(rp, 1.5)) : riseH * eioC(sp);
    if (rp >= 1 && sp <= 0) off += spring(t - 1650, -2.2, 4, 120);
    var squashY = 1 + spring(t - 1450, 0.05, 4, 110);
    S.rig.setAttribute('transform', 'translate(0,' + f1(off) + ') translate(0,' + f1(G.floorY) + ') scale(1,' + squashY.toFixed(3) + ') translate(0,' + f1(-G.floorY) + ')');
    var slotOpen = eoC(seg(t, 1050, 1200)) * (1 - eio(seg(t, 6620, 6760)));
    S.slot.setAttribute('opacity', f1(slotOpen * 70) / 100);
    S.slot.setAttribute('height', f1(5 * slotOpen + 0.01));
    S.slot.setAttribute('y', f1(G.floorY - 2.5 * slotOpen));
    // burette sway: jolt at the panic, nervous tremble during the last drop, settle after
    var sw = spring(t - 4610, 2.6, 3.2, 200) + spring(t - 1600, 1.2, 2.5, 200);
    var nerv = seg(t, 4800, 4950) * (1 - seg(t, 5440, 5480));
    sw += nerv * 0.35 * Math.sin(t * 0.09);
    S.swayG.setAttribute('transform', 'rotate(' + sw.toFixed(2) + ' ' + G.x + ' ' + f1(G.tubeBot - 14) + ')');
    S.bur.setAttribute('transform', '');

    // ---- liquid ----
    var used = 0;
    DROPS.forEach(function (d) { used += seg(t, d[0], d[1]); });
    var lvl = G.topY + 9 + used * Math.min(3.2, (G.Lt - 24) / 8);
    var slosh = spring(t - 1600, 2.2, 3, 160) + spring(t - 4610, 1.8, 3.5, 140);
    var xl = G.x - 7, xr = G.x + 7;
    S.liq.setAttribute('d', 'M' + f1(xl) + ' ' + f1(lvl - 1.5 - slosh) + 'Q' + f1(G.x) + ' ' + f1(lvl + 2.2) + ' ' + f1(xr) + ' ' + f1(lvl - 1.5 + slosh) + 'L' + f1(xr) + ' ' + f1(G.tubeBot + 12) + 'L' + f1(xl) + ' ' + f1(G.tubeBot + 12) + 'Z');
    var o = tapOpen(t);
    S.nozLiq.setAttribute('opacity', o > 0.01 || t > 2150 && t < 5700 ? 0.9 : 0);

    // ---- stopcock + glove ----
    var a = -o * Math.PI / 2;
    var ca = Math.cos(a), sa = Math.sin(a);
    var hd = 'M' + f1(G.x - 9 * ca) + ' ' + f1(G.sY - 9 * sa) + 'L' + f1(G.x + 9 * ca) + ' ' + f1(G.sY + 9 * sa);
    S.handle.setAttribute('d', hd); S.handleIn.setAttribute('d', hd);
    var swr = sw * Math.PI / 180, py = G.tubeBot - 14;
    function swp(x, y) { var dx = x - G.x, dy = y - py; return [G.x + dx * Math.cos(swr) - dy * Math.sin(swr), py + dx * Math.sin(swr) + dy * Math.cos(swr)]; }
    var he = swp(G.x + 9 * ca, G.sY + 9 * sa);
    var rigDy = off;
    var hin = 1 - eoC(seg(t, 1850, 2150)), hout = ei(seg(t, 5950, 6350));
    var hx = he[0] + 230 * hin + 260 * hout, hy = he[1] + rigDy - 10 * hin - 14 * hout;
    // little grip squeeze on each adjustment + tremble while waiting
    var trem = seg(t, 4780, 4900) * (1 - seg(t, 5330, 5360));
    hx += trem * 0.7 * Math.sin(t * 0.23); hy += trem * 0.6 * Math.sin(t * 0.19 + 1);
    hx += spring(t - 2150, 1.5, 6, 80) + spring(t - 3000, 1.5, 6, 80) + spring(t - 3930, 1.8, 6, 80) + spring(t - 4600, 3, 6, 90) + spring(t - 5330, 1.2, 6, 80);
    var hr = a * 180 / Math.PI * 0.45 + 18 * eio(hout);
    S.hand.setAttribute('transform', 'translate(' + f1(hx) + ',' + f1(hy) + ') rotate(' + hr.toFixed(1) + ') scale(1.35)');
    var hr2 = hr * Math.PI / 180, c2 = Math.cos(hr2), s2 = Math.sin(hr2);
    function hp(x, y) { return [hx + x * c2 - y * s2, hy + x * s2 + y * c2]; }
    var w1 = hp(28.4, -11.6), w2 = hp(28.4, 11.6), farY = G.sY + 26 + rigDy;
    S.sleeve.setAttribute('d', 'M' + f1(w1[0]) + ' ' + f1(w1[1]) + 'C' + f1(w1[0] + 30) + ' ' + f1(w1[1]) + ' ' + f1(W + 20) + ' ' + f1(farY - 14) + ' ' + f1(W + 120) + ' ' + f1(farY - 13) +
      'L' + f1(W + 120) + ' ' + f1(farY + 13) + 'C' + f1(W + 20) + ' ' + f1(farY + 14) + ' ' + f1(w2[0] + 30) + ' ' + f1(w2[1]) + ' ' + f1(w2[0]) + ' ' + f1(w2[1]) + 'Z');
    var armVis = t > 1840 && t < 6400;
    S.hand.setAttribute('opacity', armVis ? 1 : 0); S.sleeve.setAttribute('opacity', armVis ? 1 : 0);

    // ---- drops ----
    var tip = swp(G.x, G.tipY);
    var hangD = '', fallD = '';
    DROPS.forEach(function (d, i) {
      var last = i === DROPS.length - 1;
      if (t >= d[0] && t < d[1]) {
        var g = seg(t, d[0], d[1]);
        var r = last ? lerp(0.8, 5.4, eo(g)) : lerp(0.6, 3.4, eo(g));
        var wob = last ? 0.09 * Math.sin(t * 0.045) * seg(t, 4950, 5100) + spring(t - 5330, 0.12, 9, 70) : 0.04 * Math.sin(g * 18);
        var neck = last ? 0.6 + 2.6 * seg(t, 5250, 5480) : 0.4 + 1.6 * g;
        hangD = hangPath(tip[0], tip[1] + rigDy, r, neck, wob);
      } else if (t >= d[1] && t < d[2]) {
        var fp = ei(seg(t, d[1], d[2]));
        var y = lerp(tip[1] + rigDy + 6, G.landY, fp);
        var rr = last ? 4.8 : 3.3;
        fallD = fallPath(lerp(tip[0], G.x, fp), y, rr, 1.12 + 0.18 * fp);
      }
    });
    S.fallDrop.setAttribute('d', hangD ? hangD + fallD : fallD);

    // splash at landing
    var sl = null;
    DROPS.forEach(function (d) { if (t >= d[2] && t < d[2] + 260) sl = d; });
    if (sl) {
      var q = seg(t, sl[2], sl[2] + 260);
      S.splash.setAttribute('rx', f1(3 + 10 * eoC(q))); S.splash.setAttribute('ry', f1(2 + 6 * eoC(q)));
      S.splash.setAttribute('opacity', f1((1 - q) * 90) / 100);
      S.splash.setAttribute('stroke-width', f1(2.4 * (1 - q) + 0.5));
    } else S.splash.setAttribute('opacity', 0);

    // ---- target chip ----
    var sc = chipPop(T), dx = 0, dy = 0, lift = 0;
    // singled out: hop
    var hp1 = seg(t, 800, 1060);
    if (hp1 > 0 && hp1 < 1) { lift = 7 * Math.sin(Math.PI * hp1); sc *= 1 + 0.06 * Math.sin(Math.PI * hp1); }
    sc *= 1 + spring(t - 1060, -0.07, 5, 90);
    // flask swirl after each drop
    DROPS.forEach(function (d, i) {
      if (t > d[2]) {
        var dt = t - d[2], amp = (i === 5 ? 0 : 2.1) * Math.exp(-dt / 260) * seg(dt, 0, 60);
        dx += amp * Math.cos(2 * Math.PI * 3.2 * dt / 1000); dy += amp * 0.8 * Math.sin(2 * Math.PI * 3.2 * dt / 1000);
        sc *= 1 + spring(dt, -0.045, 6, 70);
      }
    });
    // endpoint ping
    sc *= 1 + spring(t - T_EP, 0.11, 3.6, 170);
    // set-down: flick goggles, lift, plonk
    var shOff = 0;
    sc *= 1 - 0.06 * Math.sin(Math.PI * seg(t, 6660, 6740));
    if (t >= 6740 && t < 6800) sc *= 1 + 0.05 * Math.sin(Math.PI * seg(t, 6740, 6800));
    if (t >= 6800 && t < 6940) { var r1 = eo(seg(t, 6800, 6940)); sc *= lerp(1, 1.11, r1); lift = 3 * r1; shOff = 5 * r1; }
    else if (t >= 6940 && t < 7010) { var r2 = ei(seg(t, 6940, 7010)); sc *= lerp(1.11, 0.92, r2); lift = 3 * (1 - r2); shOff = 5 * (1 - r2); }
    else if (t >= 7010) { var d2 = t - 7010; sc *= 1 - 0.08 * Math.exp(-d2 / 110) * Math.cos(2 * Math.PI * 4.5 * d2 / 1000); }
    S.tg.setAttribute('transform', 'translate(' + f1(T.x + dx) + ',' + f1(T.y + dy - lift) + ') scale(' + sc.toFixed(4) + ')');
    S.tSh.setAttribute('cx', f1(T.x + 1.5 + shOff * 0.4)); S.tSh.setAttribute('cy', f1(T.y + 3.5 + shOff + lift * 0.3));
    S.tSh.setAttribute('r', f1(CR * Math.min(sc, 1.04)));
    S.tSh.setAttribute('opacity', f1(28 - shOff * 1.6 - lift) / 100);

    // goggles on / off + initial position
    var gOn = backOut(seg(t, 880, 1100), 2.4), gOff = seg(t, 6720, 6960);
    var gk = clamp(seg(t, 880, 1040)) * (1 - seg(t, 6720, 6860));
    [S.chipA, S.chipB].forEach(function (c) {
      c.tx.setAttribute('y', f1(lerp(0.5, 11.2, gk)));
      c.tx.setAttribute('font-size', f1(lerp(c.fs, c.fs * 0.72, gk)));
    });
    if (gOff > 0) {
      var go = eoC(gOff);
      S.gog.setAttribute('transform', 'translate(' + f1(14 * gOff) + ',' + f1(-40 * go + 10 * ei(gOff)) + ') rotate(' + f1(55 * gOff) + ') scale(' + (1 - 0.3 * gOff).toFixed(3) + ')');
      S.gog.setAttribute('opacity', f1((1 - eio(seg(gOff, 0.45, 1))) * 100) / 100);
    } else {
      var gs = Math.max(0.001, gOn), drop = (1 - clamp(seg(t, 880, 1000))) * -14;
      S.gog.setAttribute('transform', 'translate(0,' + f1(drop) + ') scale(' + gs.toFixed(3) + ')');
      S.gog.setAttribute('opacity', t < 880 ? 0 : 1);
    }

    // eyes
    var lx = lookX(t), ly = lookY(t), cv = converge(t), lid = clamp(lidAt(t), 0, 1), es = eyeScale(t);
    var bR = browRaise(t), bW = browWorry(t);
    S.eyeG.concat(S.brows).forEach(function (g) { g.setAttribute('opacity', t < 6740 ? 1 : 0); });
    var lidFill = t >= T_EP + 60 ? S.opts.dealerColor : S.opts.victimColor;
    [-1, 1].forEach(function (s, i) {
      var cx = 8.6 * s, cy = -5.6;
      var vx = lx - s * 0.55 * cv, vy = ly * (1 - 0.15 * cv), m = Math.hypot(vx, vy);
      if (m > 1) { vx /= m; vy /= m; }
      var px = cx + vx * 3.1, pyy = cy + vy * 3.1;
      S.pups[i].setAttribute('cx', f1(px)); S.pups[i].setAttribute('cy', f1(pyy)); S.pups[i].setAttribute('r', f1(2.7 * es));
      S.glints[i].setAttribute('cx', f1(px - 0.9)); S.glints[i].setAttribute('cy', f1(pyy - 0.9));
      var R = 6.3, Ly = -R + 2 * R * lid;
      if (lid < 0.02) S.lids[i].setAttribute('d', '');
      else if (lid > 0.98) S.lids[i].setAttribute('d', circleD(cx, cy, R + 0.2));
      else {
        var dxl = Math.sqrt(R * R - Ly * Ly);
        S.lids[i].setAttribute('d', 'M' + f1(cx - dxl) + ' ' + f1(cy + Ly) + 'A' + R + ' ' + R + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(cx + dxl) + ' ' + f1(cy + Ly) + 'Z');
      }
      S.lids[i].setAttribute('fill', lidFill);
      var by = -16.6 + bR - (es - 1) * 6;
      S.brows[i].setAttribute('transform', 'translate(' + f1(cx + s * 0.6) + ',' + f1(by) + ') rotate(' + f1(-s * bW * 24) + ')');
    });

    // swirls of the dealer's colour that fade
    S.spirals.forEach(function (p, i) {
      var d = DROPS[i];
      if (t < d[2]) { p.setAttribute('opacity', 0); return; }
      var dt = t - d[2];
      var al = d[3] * eo(seg(dt, 0, 90)) * (1 - eio(seg(dt, 120, 120 + d[4])));
      var spn = 140 * (1 - Math.exp(-dt / 300)) + i * 40, scl = lerp(0.35, 1, eoC(seg(dt, 0, 320)));
      p.setAttribute('opacity', f1(al * 100) / 100);
      p.setAttribute('transform', 'translate(0,7) rotate(' + f1(spn) + ') scale(' + scl.toFixed(3) + ')');
    });

    // endpoint: colour snaps outward from the impact
    var ep = seg(t, T_EP, T_EP + 170), rf = ep >= 1 ? 40 : 38 * eoC(ep);
    S.fillC.setAttribute('r', f1(rf));
    S.flashP.setAttribute('d', ep > 0 && ep < 1 ? circleD(0, 5, rf) + circleD(0, 5, Math.max(0.1, rf - 6)) : '');
    S.flashG.setAttribute('opacity', ep > 0 && ep < 1 ? 0.7 : 0);

    // pings
    S.rings.forEach(function (r, i) {
      var q = seg(t, T_EP + 30 + i * 140, T_EP + 560 + i * 140);
      r.setAttribute('r', f1(CR + 4 + 30 * eoC(q)));
      r.setAttribute('opacity', q > 0 && q < 1 ? f1((1 - q) * 90) / 100 : 0);
      r.setAttribute('stroke-width', f1(4.2 * (1 - q) + 0.8));
    });
    var pq = seg(t, T_EP + 20, T_EP + 340);
    if (pq > 0 && pq < 1) {
      var pd = '', r0 = 29 + 10 * eoC(pq), r1b = r0 + 7 * (1 - pq);
      [-2.36, -1.57, -0.79, 0.79, 2.36, 0, 3.14].forEach(function (ang) {
        pd += 'M' + f1(T.x + Math.cos(ang) * r0) + ' ' + f1(T.y + Math.sin(ang) * r0) + 'L' + f1(T.x + Math.cos(ang) * r1b) + ' ' + f1(T.y + Math.sin(ang) * r1b);
      });
      S.pingT.setAttribute('d', pd); S.pingT.setAttribute('opacity', f1((1 - pq) * 100) / 100);
    } else S.pingT.setAttribute('opacity', 0);

    // set-down ring + dust
    var sq = seg(t, 7010, 7480);
    S.setRing.setAttribute('r', f1(CR + 22 * eoC(sq)));
    S.setRing.setAttribute('opacity', sq > 0 && sq < 1 ? f1((1 - sq) * 80) / 100 : 0);
    S.setRing.setAttribute('stroke-width', f1(3.5 * (1 - sq) + 0.6));
    var dp = seg(t, 7010, 7280);
    if (dp > 0 && dp < 1) {
      var dd = '', q0 = 27 + 9 * eoC(dp), q1 = q0 + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (ang) {
        dd += 'M' + f1(T.x + Math.cos(ang) * q0) + ' ' + f1(T.y + Math.sin(ang) * q0) + 'L' + f1(T.x + Math.cos(ang) * q1) + ' ' + f1(T.y + Math.sin(ang) * q1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7550, 7980);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2titration;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2titration = S;
    return S;
  }

  window.CCSteal2_titration = {
    title: 'The Endpoint',
    blurb: 'A tiny titration rig rises behind Nate’s goggled chip and drips Nick’s colour onto it: the swirls fade, the drips speed up, then one nervous last drop hits the endpoint and the chip snaps to Nick’s colour for good.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2titration = S;
      var token = {};
      root.__cc2titrationToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2titrationToken !== token) { resolve(); return; }
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
