/* Closed Caption - "steal" moment - concept: THE VICTORY SHOWER (key: dunk)
 *
 * The big-game tradition: the winner celebrates, and a teammate sneaks up behind with the
 * sports-drink cooler and dumps it over their head. Here the cooler is full of the dealer's
 * colour, so Nate's chip comes out of it dyed Nick's colour. The gag is the classic look-back:
 * Nate senses something, whips round, the sneaking cooler freezes mid-tiptoe and looks
 * innocent; Nate turns away again... and THEN gets dunked. After sputtering, it shakes off
 * like a wet dog, and one last ice cube lands on its head.
 *
 * Storyboard (ms)
 *    0- 700  Table deals in: rows drop in, chips pop on.
 *  550-1250  Camera eases in a touch (whole rows stay in frame). Others dim.
 *  800-1100  Nate's chip wakes: eyes, little arms, a football held aloft.
 * 1100-1430  Wind-up... SPIKE: the ball slams down and bounces away off the table.
 * 1450-2300  Smug victory dance: arms up, happy eyes, smirk, bouncing.
 * 1600-2440  Behind it, a cooler (Nick's-colour lid, band, and teammate peeking over the top)
 *            tiptoes in from the edge on little sneakers.
 * 2300-2420  Nate stops mid-pump: eyes open, pupils slide. It senses something.
 * 2420-2520  Whips round. The cooler FREEZES mid-step, foot in the air, eyes up, innocent.
 * 2520-3150  The stare. Nate squints; the cooler whistles a note; a sweat drop slides.
 * 3150-3380  Nate shrugs it off, turns back front, arms up, smug again.
 * 3300-3780  Two more tiptoes, the lid pops off, the cooler is hoisted over Nate (shadow).
 * 3780-3900  DUNK: it tips, a gush of Nick's colour and ice cubes, SPLASH.
 * 3900-4450  Drenched: eyes wide, arms limp, liquid drains to a puddle; chip is dyed.
 *            Cooler rights itself and scurries off.
 * 4450-4880  Sputters: two spits, blinks.
 * 4900-5420  Shakes off like a dog: whips side to side, droplets fly, little hop...
 * 5400-5850  ...lands exactly in its spot (squash, ring, dust). Dashed ring returns, Nick's
 *            initial pops in with a glint; Nate looks itself over.  (colour beat)
 * 5950-6150  A single ice cube drops from above and lands on its head. Clink.
 * 6150-6600  Deadpan stare up at it.  (beat)
 * 6600-6950  Cube melts away, eyes close, face and arms fade: just a chip again.
 * 6700-7200  Camera eases back, others undim. Stillness.
 * 7400-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', COOL = '#EEF1F4', COOL_D = '#C6CFD8', ICE = '#E3F4FF', BALL = '#9A5B32';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000, ZM = 1.22;
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
  function dspring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.cos(2 * Math.PI * hz * dt / 1000); }
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
  function rotv(x, y, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function P2(x, y) { return f1(x) + ' ' + f1(y); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function blob(cx, cy, r, t, k) {
    var d = '', n = 40;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2;
      var rr = r * (1 + 0.1 * Math.sin(5 * a + t * 0.012 + k) + 0.06 * Math.sin(3 * a - t * 0.009 + 2 * k));
      d += (i ? 'L' : 'M') + P2(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    return d + 'Z';
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
    return { rows: rows, target: target, others: others, h: h, ini: ini };
  }

  // ---------- choreography ----------
  // Arm angles: 0 = straight out sideways, -90 = up, +90 = down (left arm mirrored).
  var AR = [[0, -70], [1100, -70], [1340, -118, eio], [1430, 45, ei], [1560, -68, eoC], [2300, -68], [2400, -45], [2520, 25, eoC],
    [3120, 25], [3200, -35, eoC], [3270, 20], [3380, -68, eoC], [3830, -68], [3890, 70, eoC], [4880, 65], [5450, 30], [6150, 32]];
  var AL = [[0, 55], [1100, 55], [1340, 35], [1430, -10, ei], [1560, -68, eoC], [2300, -68], [2400, -45], [2520, 25, eoC],
    [3120, 25], [3200, -35, eoC], [3270, 20], [3380, -68, eoC], [3830, -68], [3890, 70, eoC], [4880, 65], [5450, 30], [6150, 32]];
  // eyes: lid (0 open..1 closed), pupil px/py, size, happy ^^ (0/1), shut >< (0/1)
  var E_LID = [[0, 0], [1100, 0], [1250, 0.3], [1430, 0.3], [1500, 0], [2520, 0], [2680, 0.55], [3120, 0.55], [3220, 0], [3860, 0],
    [5420, 0], [5500, 0], [6080, 0], [6180, 0.5, eoC], [6560, 0.5], [6720, 1]];
  var E_PX = [[0, 0], [1100, -1], [1350, 1], [1450, 0], [2300, 0], [2400, 2.4], [2520, 2.6], [3150, 2.6], [3260, 0], [5480, 0],
    [5560, -2.2], [5700, -2.2], [5800, 2.2], [5900, 0.5], [6150, 0.3]];
  var E_PY = [[0, 0], [1100, -1.5], [1350, 1.5], [1450, 0], [2300, 0], [2400, -0.5], [2520, -2.2], [3150, -2.2], [3260, 0], [5480, 0],
    [5560, 2.4], [5800, 2.4], [5900, -1], [6000, -3], [6150, -3.2]];
  var E_SC = [[0, 1], [3850, 1], [3880, 1.38, eoC], [4400, 1.25], [4880, 1.1], [5450, 1], [6100, 1], [6180, 0.95]];
  var E_HAPPY = [[0, 0], [1460, 0], [1500, 1], [2300, 1], [2340, 0], [3300, 0], [3350, 1], [3860, 1], [3870, 0]];
  // mouth: curve (+smile), asym (smirk), open (0..1)
  var M_CV = [[0, 2], [1100, 2], [1250, 1], [1430, 1], [1520, 3.6, eoC], [2300, 3.6], [2380, 0.4], [2520, 0], [2700, -1.6], [3120, -1.6],
    [3260, 1], [3380, 3.6], [3860, 3.6], [3870, 0], [4900, 0], [4950, -2.4], [5420, -2.4], [5520, 0], [5850, -0.6], [6150, 0]];
  var M_AS = [[0, 0], [1430, 0], [1520, 1.4], [2300, 1.4], [2380, 0], [2700, -1.2], [3120, -1.2], [3260, 0], [3380, 1.4], [3860, 1.4], [3870, 0]];
  var M_OP = [[0, 0], [3860, 0], [3880, 1, eoC], [4400, 0.8], [4480, 0.15], [4560, 0.05], [4610, 1, ei], [4660, 0.2], [4700, 0.05],
    [4760, 1, ei], [4810, 0.15], [4900, 0], [5000, 0.3], [5420, 0.3], [5480, 0]];

  var sdG = 1;
  function chipS(t) {
    var ox = 0, oy = 0, rot = 0, sx = 1, sy = 1, lift = 0;
    // wind-up lean and spike follow-through
    rot += kf([[0, 0], [1100, 0], [1340, -9], [1430, 8, ei], [1600, 0, eoC]], t);
    // victory bounce
    var d1 = seg(t, 1480, 1560) * (1 - seg(t, 2260, 2320)) + seg(t, 3360, 3420) * (1 - seg(t, 3800, 3850));
    var ph = (t - 1480) / 1000 * 2 * Math.PI * 2.6;
    oy += -3 * Math.abs(Math.sin(ph)) * d1;
    rot += 5 * Math.sin(ph) * d1;
    sy *= 1 + 0.04 * Math.abs(Math.sin(ph)) * d1; sx *= 1 - 0.03 * Math.abs(Math.sin(ph)) * d1;
    // the turn: rotate toward the cooler, slight squash for a three-quarter cheat, lean in
    var tn = eoC(seg(t, 2420, 2520)) * (1 - eioC(seg(t, 3160, 3290)));
    rot += 16 * tn * sdG; sx *= 1 - 0.08 * tn;
    var ln = eio(seg(t, 2560, 2760)) * (1 - eioC(seg(t, 3140, 3260)));
    ox += 3 * ln * sdG; oy += -2 * ln;
    // shrug bob
    oy += -2.5 * Math.sin(Math.PI * seg(t, 3140, 3260));
    // splash impact
    var dsq = t - 3860;
    if (dsq >= 0 && dsq < 700) { var q = dspring(dsq, 0.16, 4, 110); sx *= 1 + q * 0.5; sy *= 1 - q; }
    // sputter twitches
    [4610, 4760].forEach(function (ts) { var d = t - ts; if (d >= 0 && d < 260) { sy *= 1 + dspring(d, 0.07, 6, 60); ox += -2 * Math.exp(-d / 60); } });
    // dog shake
    if (t > 4900 && t < 5500) {
      var d2 = t - 4900, env = Math.min(1, d2 / 60) * Math.exp(-Math.max(0, d2 - 200) / 200);
      rot += 30 * env * Math.sin(2 * Math.PI * 7.5 * d2 / 1000);
      ox += 2.5 * env * Math.sin(2 * Math.PI * 7.5 * d2 / 1000 + 0.6);
    }
    lift = eo(seg(t, 4990, 5200)) * (1 - ei(seg(t, 5220, 5400)));
    var dl = t - 5400;
    if (dl >= 0 && dl < 700) { var q2 = dspring(dl, 0.1, 4.5, 100); sx *= 1 + q2 * 0.6; sy *= 1 - q2; }
    // ice cube lands
    var dc = t - 6150;
    if (dc >= 0 && dc < 500) { var q3 = dspring(dc, 0.07, 5, 80); sx *= 1 + q3 * 0.5; sy *= 1 - q3; }
    var s = 1 + 0.15 * lift;
    return { ox: ox, oy: oy, rot: rot, sx: sx * s, sy: sy * s, lift: lift };
  }

  function plan(L) {
    var T = L.target;
    var sd = T.x > 230 ? -1 : 1;   // the side with room for the cooler
    var edge = sd > 0 ? W + 60 : -60, rx = T.x + sd * 46, gy = T.y - 58;
    var cool = {
      sd: sd,
      x: [[0, edge], [1600, edge], [2440, rx, lin], [3300, rx], [3550, T.x + sd * 36], [3780, T.x + sd * 30, eio], [4150, T.x + sd * 30], [4400, T.x + sd * 52, eoC], [4800, edge + sd * 30, ei]],
      y: [[0, gy], [3550, gy - 2], [3780, T.y - 62, eoC], [4150, T.y - 62], [4400, T.y - 92, eoC], [4800, T.y - 150, ei]],
      s: [[0, 1], [3550, 1], [3780, 1.32, eoC], [4250, 1.25], [4450, 1]],
      r: [[0, 0], [3550, 0], [3700, 8, eio], [3790, -6, eio], [3880, -128, ei], [4150, -128], [4380, 0, eoC]]
    };
    return { T: T, cool: cool };
  }
  function coolerAt(P, t) {
    var c = { x: kf(P.cool.x, t), y: kf(P.cool.y, t), s: kf(P.cool.s, t), r: kf(P.cool.r, t) * P.cool.sd };
    // tiptoe step phase (continuous), frozen at 2440 mid-step
    var ph;
    if (t < 2440) ph = (t - 1600) / 280 * Math.PI + 0.5 * Math.PI;
    else if (t < 3300) ph = 840 / 280 * Math.PI + 0.5 * Math.PI;
    else if (t < 3550) ph = (840 + (t - 3300)) / 280 * Math.PI + 0.5 * Math.PI;
    else if (t < 4400) ph = (840 + 250) / 280 * Math.PI + 0.5 * Math.PI;
    else ph = (840 + 250 + (t - 4400) * 2.2) / 280 * Math.PI + 0.5 * Math.PI;
    var walking = (t < 3550 || t > 4400) ? 1 : 0;
    c.ph = ph; c.walk = walking * (1 - seg(t, 3500, 3560));
    if (t < 3300 && t > 2440) c.walk = 1;
    // freeze tremble
    if (t > 2700 && t < 3200) c.x += 0.6 * Math.sin(t * 0.9);
    return c;
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-dunk-' + (++uid) + '-';
    var L = layout(opts), P = plan(L), T = L.target, DC = opts.dealerColor || '#E8559E', VC = T.color || opts.victimColor || '#2F6FE0';
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cc = mk('clipPath', { id: id + 'chip', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('circle', { cx: 0, cy: 0, r: CR }, cc);

    mk('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = mk('g', {}, svg);
    var tableG = mk('g', {}, cam);
    mk('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    mk('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    mk('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    function chipParts(parent, color, txt) {
      var g = mk('g', {}, parent);
      var body = mk('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
      var ring = mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
      var hi = mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
      var txg = mk('g', {}, g);
      var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, txg);
      tx.textContent = txt;
      return { g: g, body: body, ring: ring, hi: hi, tx: tx, txg: txg };
    }

    var rowsG = [], chipsG = [], V = {};
    var cardLayer = mk('g', {}, cam), floorLayer = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = mk('g', {}, cardLayer);
      mk('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      mk('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      mk('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = mk('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
      r.chips.forEach(function (c) {
        var wrap = mk('g', {}, chipLayer);
        var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        if (c.target) {
          var tg = mk('g', {}, wrap);
          // arms sit behind the chip body
          var arms = [];
          for (var a = 0; a < 2; a++) {
            var ag = mk('g', {}, tg);
            var ao = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 6.4, 'stroke-linecap': 'round' }, ag);
            var ai = mk('path', { fill: 'none', stroke: VC, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, ag);
            var hand = mk('circle', { r: 4.3, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.8 }, ag);
            arms.push({ g: ag, o: ao, i: ai, h: hand });
          }
          var base = chipParts(tg, c.color, c.ini);
          var clipG = mk('g', { 'clip-path': 'url(#' + id + 'chip)' }, tg);
          var coat = mk('circle', { r: CR, fill: DC, opacity: 0 }, clipG);
          var wet = mk('path', { d: 'M-22 -6Q-12 -2 -6 -9T8 -5T22 -8', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, clipG);
          var shimmer = mk('rect', { x: -40, y: -40, width: 9, height: 80, fill: '#FFFFFF', opacity: 0 }, clipG);
          // drips running off the lower edge
          var drips = mk('g', { opacity: 0 }, tg);
          var dripEls = [];
          [[-12, 0.9], [3, 1.3], [14, 0.7]].forEach(function (dd) {
            var p = mk('path', { fill: DC, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, drips);
            dripEls.push({ el: p, x: dd[0], k: dd[1] });
          });
          var outline = mk('circle', { r: CR, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, tg);
          var topG = mk('g', { opacity: 0 }, tg);
          mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, topG);
          mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, topG);
          var ntxt = L.ini(opts.dealer);
          var txG = mk('g', {}, tg);
          var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': ntxt.length > 1 ? 15 : 18, opacity: 0 }, txG);
          tx.textContent = ntxt;
          // face
          var face = mk('g', { opacity: 0 }, tg);
          var eyes = [];
          [-1, 1].forEach(function (s) {
            var eg = mk('g', {}, face);
            var wh = mk('ellipse', { fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.7 }, eg);
            var pu = mk('circle', { r: 2.1, fill: INK }, eg);
            var lid = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round' }, eg);
            var hap = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, eg);
            eyes.push({ s: s, g: eg, wh: wh, pu: pu, lid: lid, hap: hap });
          });
          var mouth = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round' }, face);
          var mouthO = mk('ellipse', { fill: INK }, face);
          V = { wrap: wrap, sh: sh, tg: tg, base: base, coat: coat, wet: wet, shimmer: shimmer, drips: drips, dripEls: dripEls, topG: topG,
            txG: txG, tx: tx, c: c, face: face, eyes: eyes, mouth: mouth, mouthO: mouthO, arms: arms };
        } else {
          var cg = mk('g', {}, wrap); chipParts(cg, c.color, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });
    // puddle sits under the chip
    var puddle = mk('path', { fill: DC, stroke: INK, 'stroke-width': 1.8, 'stroke-opacity': 0.6, opacity: 0 }, floorLayer);
    var coolShadow = mk('ellipse', { fill: INK, opacity: 0 }, floorLayer);
    var ripple = mk('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var fx = mk('g', {}, cam);
    // football
    var ball = mk('g', { opacity: 0 }, fx);
    mk('ellipse', { rx: 11.5, ry: 7.2, fill: BALL, stroke: INK, 'stroke-width': 2 }, ball);
    mk('path', { d: 'M-4 0H4M-2.5 -1.8V1.8M0 -1.8V1.8M2.5 -1.8V1.8', stroke: '#FFFFFF', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, ball);
    mk('path', { d: 'M-9 -1.5Q-7.5 -4.5 -5.5 -5.2M9 -1.5Q7.5 -4.5 5.5 -5.2', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, ball);
    var ballTicks = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, fx);

    // cooler (local origin = body centre)
    var cool = mk('g', {}, fx);
    var peek = mk('g', {}, cool);
    mk('path', { d: 'M-19 -26C-19 -60 19 -60 19 -26Z', fill: DC, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round' }, peek);
    var pe = [];
    [-1, 1].forEach(function (s) {
      var g = mk('g', { transform: 'translate(' + (s * 7) + ',-45)' }, peek);
      mk('ellipse', { rx: 4.3, ry: 5.2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6 }, g);
      var pu = mk('circle', { r: 2, fill: INK }, g);
      var lid = mk('path', { fill: DC, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
      pe.push({ pu: pu, lid: lid });
    });
    var feet = [];
    [-1, 1].forEach(function (s) {
      var g = mk('g', {}, cool);
      mk('path', { d: 'M-8 0C-8 -5 -3 -6 2 -5C6 -4.5 9 -2.5 9 0.5C9 3 6 4 0 4C-6 4 -8 3 -8 0Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
      mk('path', { d: 'M-6.5 2.6H7.5', stroke: DC, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
      feet.push({ s: s, g: g });
    });
    var body = mk('g', {}, cool);
    mk('rect', { x: -24, y: -26, width: 48, height: 52, rx: 10, fill: COOL, stroke: INK, 'stroke-width': 2.6 }, body);
    mk('path', { d: 'M14 -24.5H24V16Q24 24 14 24.5Z', fill: COOL_D, opacity: 0.9 }, body);
    mk('rect', { x: -24, y: -10, width: 48, height: 15, fill: DC, stroke: INK, 'stroke-width': 2 }, body);
    mk('rect', { x: -24, y: -26, width: 48, height: 52, rx: 10, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, body);
    mk('rect', { x: -4, y: 12, width: 8, height: 7, rx: 2, fill: COOL_D, stroke: INK, 'stroke-width': 1.6 }, body);
    mk('path', { d: 'M-16 -20V-14', stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }, body);
    var sideDrip = mk('path', { d: 'M-13 5V12Q-13 15 -10.5 15Q-8 15 -8 12V5Z', fill: DC, stroke: INK, 'stroke-width': 1.4 }, body);
    var hands = [];
    [-1, 1].forEach(function (s) {
      var g = mk('g', { transform: 'translate(' + (s * 26) + ',-4)' }, cool);
      mk('circle', { r: 5.2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.9 }, g);
      mk('path', { d: 'M' + (s * -1) + ' -3.5V3.5', stroke: INK, 'stroke-width': 1.1, opacity: 0.5 }, g);
      hands.push(g);
    });
    var lid = mk('g', {}, fx);
    mk('rect', { x: -27, y: -6, width: 54, height: 12, rx: 6, fill: DC, stroke: INK, 'stroke-width': 2.4 }, lid);
    mk('path', { d: 'M-9 -6V-10H9V-6', fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, lid);
    mk('path', { d: 'M-20 -2H6', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linecap': 'round' }, lid);
    var note = mk('g', { opacity: 0 }, fx);
    mk('path', { d: 'M2 4V-9L9 -6', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, note);
    mk('ellipse', { cx: -1, cy: 4, rx: 3.6, ry: 2.8, fill: INK, transform: 'rotate(-20 -1 4)' }, note);
    var sweat = mk('path', { d: 'M0 -5C2 -2 3.5 0.5 3.5 2.2A3.5 3.5 0 0 1 -3.5 2.2C-3.5 0.5 -2 -2 0 -5Z', fill: ICE, stroke: INK, 'stroke-width': 1.5, opacity: 0 }, fx);

    // liquid
    var stream = mk('path', { fill: DC, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round', opacity: 0 }, fx);
    var splash = mk('path', { fill: DC, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity: 0 }, fx);
    var splashHi = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var drops = [];
    for (var i = 0; i < 26; i++) drops.push(mk('circle', { fill: DC, stroke: INK, 'stroke-width': 1.3, opacity: 0 }, fx));
    function cube(parent) {
      var g = mk('g', { opacity: 0 }, parent);
      mk('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2.6, fill: ICE, stroke: INK, 'stroke-width': 1.7 }, g);
      mk('path', { d: 'M-3 -3.4H2', stroke: '#FFFFFF', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
      return g;
    }
    var cubes = [cube(fx), cube(fx), cube(fx)];
    var lastCube = cube(fx);
    var clink = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var melt = mk('path', { d: 'M0 -3.5C1.5 -1.5 2.5 0 2.5 1.2A2.5 2.5 0 0 1 -2.5 1.2C-2.5 0 -1.5 -1.5 0 -3.5Z', fill: ICE, stroke: INK, 'stroke-width': 1.3, opacity: 0 }, fx);

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return { opts: opts, L: L, P: P, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, DC: DC, VC: VC, puddle: puddle, coolShadow: coolShadow,
      ripple: ripple, dust: dust, ball: ball, ballTicks: ballTicks, cool: cool, peek: peek, pe: pe, feet: feet, hands: hands, lid: lid, note: note,
      sweat: sweat, stream: stream, splash: splash, splashHi: splashHi, drops: drops, cubes: cubes, lastCube: lastCube, clink: clink, melt: melt,
      line: line, sideDrip: sideDrip };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = L.target, V = S.V, P = S.P, DC = S.DC;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6700, 7300)));
    var Z = lerp(1, ZM, zk);
    var fy = clamp(T.y - 30, H / (2 * ZM) - 10, 600 - H / (2 * ZM) + 20);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 900, 1250)) * (1 - eio(seg(t, 6700, 7200)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- Nate's chip ----
    sdG = P.cool.sd;
    var C = chipS(t), pop = chipPop(T);
    var cx = T.x + C.ox, cy = T.y + C.oy;
    var csx = C.sx * pop, csy = C.sy * pop;
    var xf = 'translate(' + f1(cx) + ',' + f1(cy) + ') rotate(' + f1(C.rot) + ') scale(' + f3(csx) + ',' + f3(csy) + ')';
    V.tg.setAttribute('transform', xf);
    function toW(lx, ly) { var v = rotv(lx * csx, ly * csy, C.rot); return [cx + v[0], cy + v[1]]; }
    var so = 6 * C.lift;
    V.sh.setAttribute('r', f1(CR * Math.min(Math.max(csx, csy), 1.05)));
    V.sh.setAttribute('cx', f1(cx + 1.5 + so * 0.5)); V.sh.setAttribute('cy', f1(cy + 3.5 + so * 1.6));
    V.sh.setAttribute('opacity', f1(28 - so * 2) / 100);

    var SPL = 3860, soaked = t >= SPL;
    var curCol = soaked ? DC : S.VC;
    var faceOn = eoC(seg(t, 800, 980)) * (1 - eio(seg(t, 6650, 6950)));
    var armOn = backOut(seg(t, 820, 1050), 2) * (1 - eio(seg(t, 6600, 6900)));
    V.coat.setAttribute('opacity', soaked ? 1 : 0);
    V.wet.setAttribute('opacity', soaked ? f3(1 - seg(t, 5300, 5500)) : 0);
    V.wet.setAttribute('transform', 'translate(0,' + f1(6 * seg(t, SPL, 5300)) + ')');
    V.base.txg.setAttribute('transform', 'translate(0,' + f1(11 * faceOn) + ') scale(' + f3(1 - 0.32 * faceOn) + ')');
    V.base.txg.setAttribute('opacity', soaked ? 0 : 1);
    V.base.hi.setAttribute('opacity', 1);
    // drips
    var dr = 0;
    V.drips.setAttribute('opacity', dr > 0 ? 1 : 0);
    if (dr > 0) {
      var dg = seg(t, 4050, 4800);
      V.dripEls.forEach(function (d) {
        var len = 2 + 5.5 * d.k * eo(dg), x = d.x, yb = Math.sqrt(Math.max(0, CR * CR - x * x)) - 2;
        V.dripEls.indexOf(d);
        d.el.setAttribute('d', 'M' + P2(x - 3.4, yb - 2) + 'L' + P2(x - 2.6, yb + len) + 'A2.8 2.8 0 0 0 ' + P2(x + 2.6, yb + len) + 'L' + P2(x + 3.4, yb - 2) + 'Z');
      });
    }
    // ring, new initial, glint
    V.topG.setAttribute('opacity', f3(eio(seg(t, 5450, 5650))));
    var tp = seg(t, 5480, 5780);
    V.tx.setAttribute('opacity', tp > 0 ? f3(clamp(tp * 3)) : 0);
    V.txG.setAttribute('transform', 'translate(0,' + f1(11 * faceOn) + ') scale(' + f3((tp > 0 ? backOut(tp, 2.6) : 0.01) * (1 - 0.32 * faceOn)) + ')');
    var shp = seg(t, 5560, 5860);
    V.shimmer.setAttribute('opacity', shp > 0 && shp < 1 ? 0.55 : 0);
    V.shimmer.setAttribute('transform', 'rotate(30) translate(' + f1(lerp(-6, 76, eio(shp))) + ',0)');

    // arms
    var pump = seg(t, 1560, 1620) * (1 - seg(t, 2260, 2300)) + seg(t, 3380, 3430) * (1 - seg(t, 3800, 3830));
    var pph = Math.sin((t - 1480) / 1000 * 2 * Math.PI * 2.6);
    var flail = seg(t, 4900, 4950) * (1 - seg(t, 5300, 5420));
    var angs = [kf(AL, t), kf(AR, t)];
    V.arms.forEach(function (A, i) {
      var s = i ? 1 : -1;
      var ang = angs[i] - 14 * pump * pph * (i ? 1 : -1) * -1 + 35 * flail * Math.sin((t - 4900) / 1000 * 2 * Math.PI * 7.5 + i * 2);
      var len = 17 * armOn, a = ang * Math.PI / 180;
      var bx = s * 19, by = -1;
      var hx = bx + s * Math.cos(a) * (len + 1), hy = by + Math.sin(a) * (len + 1);
      var mx = (bx + hx) / 2 + s * Math.sin(a) * 2.5, my = (by + hy) / 2 - Math.cos(a) * 2.5 * 0;
      var d = 'M' + P2(bx, by) + 'Q' + P2(mx, my) + ' ' + P2(hx, hy);
      A.o.setAttribute('d', d); A.i.setAttribute('d', d); A.i.setAttribute('stroke', curCol);
      A.h.setAttribute('cx', f1(hx)); A.h.setAttribute('cy', f1(hy)); A.h.setAttribute('r', f1(4.8 * clamp(armOn * 1.2)));
      A.g.setAttribute('opacity', armOn > 0.02 ? 1 : 0);
      A.hand = [hx, hy];
    });

    // face
    V.face.setAttribute('opacity', f3(faceOn));
    var fsx = 0, fsy = 0;
    var tn = eoC(seg(t, 2420, 2520)) * (1 - eioC(seg(t, 3160, 3290)));
    fsx += 4.5 * tn * P.cool.sd; fsy += -2.5 * tn;
    V.face.setAttribute('transform', 'translate(' + f1(fsx) + ',' + f1(fsy) + ') scale(' + f3(clamp(faceOn * 1.3)) + ')');
    var lidv = kf(E_LID, t), px = kf(E_PX, t), py = kf(E_PY, t), esc = kf(E_SC, t), hap = kf(E_HAPPY, t);
    // blinks
    [[2950, 90], [4530, 70], [4690, 60], [5650, 90]].forEach(function (b) { var p = seg(t, b[0], b[0] + b[1]); if (p > 0 && p < 1) lidv = Math.max(lidv, Math.sin(Math.PI * p)); });
    var shut = (t > 4600 && t < 4655) || (t > 4750 && t < 4805) || (t > 4900 && t < 5420) ? 1 : 0;
    // during shock, pupils tiny
    var pr = 2.1 * (t > SPL && t < 4500 ? 0.62 : 1);
    V.eyes.forEach(function (e) {
      var ex = e.s * 6.6, ey = -8.5, rx = 4.2 * esc, ry = 5 * esc;
      e.g.setAttribute('transform', 'translate(' + ex + ',' + ey + ')');
      var showOpen = hap < 0.5 && !shut;
      e.wh.setAttribute('opacity', showOpen ? 1 : 0); e.pu.setAttribute('opacity', showOpen ? 1 : 0);
      var top = -ry + 2 * ry * clamp(lidv, 0, 0.92), ccy2 = (top + ry) / 2, rry = Math.max(0.6, (ry - top) / 2);
      e.wh.setAttribute('cx', 0); e.wh.setAttribute('cy', f1(ccy2)); e.wh.setAttribute('rx', f1(rx)); e.wh.setAttribute('ry', f1(rry));
      var ppx = clamp(px * ((t > 2300 && t < 3300) ? P.cool.sd : 1), -rx + 2, rx - 2), ppy = clamp(py + 0.6, top + 1.6, ry - 1.6);
      e.pu.setAttribute('cx', f1(ppx)); e.pu.setAttribute('cy', f1(lidv > 0.85 ? ccy2 : ppy)); e.pu.setAttribute('r', f1(Math.min(pr, rry)));
      e.lid.setAttribute('d', showOpen && lidv > 0.12 ? 'M' + P2(-rx - 1.2, top + (e.s > 0 ? 0 : 0)) + 'L' + P2(rx + 1.2, top) : '');
      if (shut) e.hap.setAttribute('d', 'M' + P2(-e.s * 3.2, -3.2) + 'L' + P2(e.s * 2.4, 0) + 'L' + P2(-e.s * 3.2, 3.2));
      else if (hap >= 0.5) e.hap.setAttribute('d', 'M' + P2(-3.4, 1.4) + 'Q' + P2(0, -4.4) + ' ' + P2(3.4, 1.4));
      else e.hap.setAttribute('d', '');
    });
    var cv = kf(M_CV, t), as = kf(M_AS, t), op = kf(M_OP, t), my0 = 1.8;
    if (op > 0.08) {
      V.mouth.setAttribute('d', '');
      V.mouthO.setAttribute('cx', 0); V.mouthO.setAttribute('cy', f1(my0 + 0.5));
      V.mouthO.setAttribute('rx', f1(1.8 + 1.4 * op)); V.mouthO.setAttribute('ry', f1(0.8 + 2.4 * op));
      V.mouthO.setAttribute('opacity', 1);
    } else {
      V.mouthO.setAttribute('opacity', 0);
      var mw = 4.4;
      V.mouth.setAttribute('d', 'M' + P2(-mw, my0 - cv * 0.35 + as * 0.4) + 'Q' + P2(as * 0.8, my0 + cv * 0.75) + ' ' + P2(mw, my0 - cv * 0.35 - as * 0.9));
    }

    // ---- football ----
    var ballOn = seg(t, 860, 960);
    var bx, by, bs = 1, br = -30;
    if (t < 1430) {
      var hR = V.arms[1].hand, wp = toW(hR[0], hR[1] - 3);
      bx = wp[0]; by = wp[1] - 4; br = -30 + kf(AR, t) * 0.4; bs = clamp(armOn);
    } else {
      var p = seg(t, 1430, 2150);
      var H0 = [T.x + 30, T.y + 14];
      bx = lerp(H0[0], W + 50, p); by = lerp(H0[1], H0[1] + 70, p);
      var hgt = 28 * Math.abs(Math.sin(Math.PI * 2 * Math.pow(p, 0.8))) * (1 - 0.5 * p);
      by -= hgt * 0.6; bs = 1 + hgt / 50; br = 40 + 900 * p;
      var dq = t - 1430; if (dq < 160) bs *= 1 - 0.25 * Math.exp(-dq / 40);
    }
    S.ball.setAttribute('opacity', t < 2150 ? f3(ballOn) : 0);
    S.ball.setAttribute('transform', 'translate(' + P2(bx, by) + ') rotate(' + f1(br) + ') scale(' + f3(bs) + ')');
    var bt = seg(t, 1430, 1650);
    if (bt > 0 && bt < 1) {
      var bd = '', r0 = 12 + 10 * eoC(bt), r1 = r0 + 6 * (1 - bt), hx0 = T.x + 30, hy0 = T.y + 14;
      [-2.6, -2, -1.2, -0.5, 0.2].forEach(function (a) { bd += 'M' + P2(hx0 + Math.cos(a) * r0, hy0 + Math.sin(a) * r0) + 'L' + P2(hx0 + Math.cos(a) * r1, hy0 + Math.sin(a) * r1); });
      S.ballTicks.setAttribute('d', bd); S.ballTicks.setAttribute('opacity', f3(1 - bt));
    } else S.ballTicks.setAttribute('opacity', 0);

    // ---- cooler ----
    var K = coolerAt(P, t), sd = P.cool.sd;
    var vis = t > 1600 && t < 4800;
    S.cool.setAttribute('opacity', vis ? 1 : 0);
    var bob = K.walk * 4 * Math.abs(Math.sin(K.ph)), tilt = sd * (K.walk * 6 * Math.sin(K.ph) - 5 * K.walk);
    S.cool.setAttribute('transform', 'translate(' + P2(K.x, K.y - bob) + ') rotate(' + f1(K.r + tilt) + ') scale(' + f3(K.s * sd) + ',' + f3(K.s) + ')');
    S.feet.forEach(function (f, i) {
      var up = K.walk * Math.max(0, (i ? -1 : 1) * Math.sin(K.ph));
      var hoist = seg(t, 3550, 3700) * (1 - seg(t, 4300, 4420));
      f.g.setAttribute('transform', 'translate(' + P2(f.s * 11 - 5 * up, 29 - 9 * up + 2 * hoist) + ') rotate(' + f1(-22 * up) + ')');
    });
    // peeking teammate eyes
    var sneaky = t < 2440 || (t > 3300 && t < 3790);
    var innocent = t >= 2440 && t <= 3300;
    var peekOn = 1 - seg(t, 3760, 3800) + seg(t, 4380, 4420);
    S.peek.setAttribute('opacity', f3(clamp(peekOn)));
    S.pe.forEach(function (e, i) {
      var ex = innocent ? (t < 2470 ? 0 : -1.6) : -1.8, ey = innocent ? -2.4 : 1;
      if (t > 4380) { ex = 1.8; ey = 0; }
      var lid = sneaky ? 0.45 : 0;
      if (innocent) { var bp = seg(t, 2880, 2980); if (bp > 0 && bp < 1) lid = Math.sin(Math.PI * bp); }
      if (t > 2440 && t < 2500) lid = 0;
      e.pu.setAttribute('cx', f1(ex)); e.pu.setAttribute('cy', f1(ey));
      var top = -5.2 + 10.4 * lid;
      e.lid.setAttribute('d', lid > 0.05 ? 'M-4.6 -5.6H4.6V' + f1(top) + 'H-4.6Z' : '');
    });
    // lid: on until it pops at 3640
    var lp = seg(t, 3640, 4050);
    var lidW;
    if (lp <= 0) {
      var lv = rotv(0, -26 * K.s, K.r + tilt); lidW = [K.x + lv[0], K.y - bob + lv[1]];
      S.lid.setAttribute('transform', 'translate(' + P2(lidW[0], lidW[1]) + ') rotate(' + f1(K.r + tilt) + ') scale(' + f3(K.s) + ')');
      S.lid.setAttribute('opacity', vis ? 1 : 0);
    } else {
      var l0 = rotv(0, -29, 0);
      var lx = K.x + sd * 70 * eo(lp), ly = K.y - 34 - 120 * eo(lp) + 40 * lp * lp;
      S.lid.setAttribute('transform', 'translate(' + P2(lx, ly) + ') rotate(' + f1(sd * (-10 + 200 * lp)) + ') scale(' + f3(1.3 + 0.25 * lp) + ')');
      S.lid.setAttribute('opacity', lp < 1 ? 1 : 0);
    }
    // whistle note + sweat
    var np = seg(t, 2580, 3200);
    S.note.setAttribute('opacity', np > 0 && np < 1 ? f3(clamp(np * 5) * (1 - seg(np, 0.7, 1))) : 0);
    S.note.setAttribute('transform', 'translate(' + P2(K.x + sd * 20 + 6 * Math.sin(np * 7), K.y - 46 - 26 * eo(np)) + ') scale(' + f3(0.6 + 0.5 * eoC(clamp(np * 3))) + ')');
    var sp = seg(t, 2760, 3200);
    S.sweat.setAttribute('opacity', sp > 0 && sp < 1 ? f3(clamp(sp * 6) * (1 - seg(sp, 0.8, 1))) : 0);
    S.sweat.setAttribute('transform', 'translate(' + P2(K.x - sd * 18, K.y - 40 + 10 * ei(sp)) + ')');
    S.sideDrip.setAttribute('opacity', t < 3880 ? 1 : 0);
    // cooler shadow on the felt
    var hs = K.s - 1;
    S.coolShadow.setAttribute('opacity', vis ? f3(0.22 - hs * 0.2) : 0);
    S.coolShadow.setAttribute('cx', f1(K.x + 3 + sd * 30 * hs));
    S.coolShadow.setAttribute('cy', f1(lerp(K.y + 32, T.y + 6, clamp(hs / 0.3))));
    S.coolShadow.setAttribute('rx', f1(26 + 40 * hs)); S.coolShadow.setAttribute('ry', f1(8 + 50 * hs));

    // ---- the gush ----
    var mv = rotv(0, -27 * K.s, K.r + tilt), M = [K.x + mv[0], K.y - bob + mv[1]];
    var st0 = seg(t, 3800, 3870), st1 = seg(t, 3880, 3990);
    if (t > 3800 && t < 3990) {
      var head = [lerp(M[0], T.x, ei(st0)), lerp(M[1], T.y, ei(st0))];
      var tail = [lerp(M[0], T.x, eio(st1)), lerp(M[1], T.y, eio(st1))];
      var dx = head[0] - tail[0], dy = head[1] - tail[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
      var w0 = 13 * (1 - st1 * 0.6), w1 = 17;
      var wob = 2.5 * Math.sin(t * 0.08);
      var d = 'M' + P2(tail[0] + nx * w0, tail[1] + ny * w0) +
        'Q' + P2((tail[0] + head[0]) / 2 + nx * (w0 + w1) / 2 + wob, (tail[1] + head[1]) / 2 + ny * (w0 + w1) / 2) + ' ' + P2(head[0] + nx * w1, head[1] + ny * w1) +
        'A' + f1(w1) + ' ' + f1(w1) + ' 0 0 1 ' + P2(head[0] - nx * w1, head[1] - ny * w1) +
        'Q' + P2((tail[0] + head[0]) / 2 - nx * (w0 + w1) / 2 - wob, (tail[1] + head[1]) / 2 - ny * (w0 + w1) / 2) + ' ' + P2(tail[0] - nx * w0, tail[1] - ny * w0) +
        'A' + f1(w0) + ' ' + f1(w0) + ' 0 0 1 ' + P2(tail[0] + nx * w0, tail[1] + ny * w0) + 'Z';
      S.stream.setAttribute('d', d); S.stream.setAttribute('opacity', 1);
    } else S.stream.setAttribute('opacity', 0);
    // splash blob over the chip, then fades to reveal the soaked chip
    var sp1 = seg(t, SPL, SPL + 90), sfade = seg(t, 4080, 4380);
    if (t >= SPL && sfade < 1) {
      var rr = lerp(14, 36, eoC(sp1)) * lerp(1, 0.75, sfade);
      S.splash.setAttribute('d', blob(cx, cy, rr, t, 0)); S.splash.setAttribute('opacity', f3(1 - sfade));
      S.splashHi.setAttribute('d', 'M' + P2(cx - rr * 0.55, cy - rr * 0.35) + 'Q' + P2(cx - rr * 0.2, cy - rr * 0.68) + ' ' + P2(cx + rr * 0.25, cy - rr * 0.6));
      S.splashHi.setAttribute('opacity', f3(1 - sfade));
    } else { S.splash.setAttribute('opacity', 0); S.splashHi.setAttribute('opacity', 0); }
    // puddle under the chip
    var pg = seg(t, SPL, SPL + 120), pd = seg(t, 4950, 5450);
    if (t >= SPL && pd < 1) {
      var prr = lerp(20, 38, eoC(pg)) * lerp(1, 0.55, eio(pd));
      S.puddle.setAttribute('d', blob(T.x + 2, T.y + 4, prr, t * 0.3, 1.7)); S.puddle.setAttribute('opacity', f3(0.92 * (1 - pd)));
    } else S.puddle.setAttribute('opacity', 0);

    // droplets: splash burst, spits, and dog-shake spray
    var di = 0;
    function drop(x, y, r, o) { var e = S.drops[di++]; if (!e) return; e.setAttribute('cx', f1(x)); e.setAttribute('cy', f1(y)); e.setAttribute('r', f1(r)); e.setAttribute('opacity', f3(o)); }
    var bp2 = seg(t, SPL, SPL + 420);
    if (bp2 > 0 && bp2 < 1) {
      for (var i = 0; i < 9; i++) {
        var a = i / 9 * Math.PI * 2 + hash(i) * 0.6, dist = 30 + (34 + 20 * hash(i + 9)) * eoC(bp2);
        drop(T.x + Math.cos(a) * dist, T.y + Math.sin(a) * dist, (2.4 + 2.2 * hash(i + 3)) * (1 - bp2 * 0.6), 1 - seg(bp2, 0.6, 1));
      }
    }
    [4610, 4760].forEach(function (ts, k) {
      var q = seg(t, ts, ts + 360);
      if (q <= 0 || q >= 1) return;
      var m0 = toW(0, 2);
      for (var j = 0; j < 3; j++) {
        var vx = (8 + 10 * j) * (k ? -1 : 1), vy = -26 - 8 * j;
        drop(m0[0] + vx * q, m0[1] + vy * q + 60 * q * q, 2.2 - 0.4 * j, 1 - seg(q, 0.6, 1));
      }
    });
    if (t > 4950 && t < 5700) {
      for (var k2 = 0; k2 < 12; k2++) {
        var te = 4960 + k2 * 36, q2 = seg(t, te, te + 320);
        if (q2 <= 0 || q2 >= 1) continue;
        var side = k2 % 2 ? 1 : -1, ang = (side > 0 ? 0 : Math.PI) + (hash(k2 + 40) - 0.5) * 1.6;
        var r0 = 22 + 46 * eoC(q2);
        drop(T.x + Math.cos(ang) * r0, T.y + Math.sin(ang) * r0 * 0.9 + 10 * q2 * q2, (2.6 + 1.4 * hash(k2)) * (1 - 0.5 * q2), 1 - seg(q2, 0.55, 1));
      }
    }
    for (; di < S.drops.length; di++) S.drops[di].setAttribute('opacity', 0);

    // cubes in the gush
    S.cubes.forEach(function (cb, i) {
      var q = seg(t, 3830 + i * 25, 4330 + i * 25);
      if (q <= 0 || q >= 1) { cb.setAttribute('opacity', 0); return; }
      var tx2 = [[-48, 18], [44, 30], [-20, 44]][i];
      var x = lerp(M[0], T.x + tx2[0], eoC(q)), y = lerp(M[1], T.y + tx2[1], eoC(q)) - 18 * Math.sin(Math.PI * clamp(q * 1.6));
      cb.setAttribute('opacity', f3(1 - seg(q, 0.7, 1)));
      cb.setAttribute('transform', 'translate(' + P2(x, y) + ') rotate(' + f1(200 * q * (i % 2 ? -1 : 1) + i * 30) + ') scale(' + f3(1.1 - 0.15 * q) + ')');
    });

    // the last ice cube
    var lc = seg(t, 5950, 6150), melt = seg(t, 6600, 6950);
    if (t >= 5950 && melt < 1) {
      var top2 = toW(2, -CR - 3);
      var x, y, r, s3;
      if (t < 6150) { x = lerp(T.x + 10, top2[0], lc); y = lerp(T.y - 190, top2[1], ei(lc)); r = lerp(-160, 14, lc); s3 = lerp(1.7, 1, lc); }
      else {
        var dc = t - 6150;
        x = top2[0]; y = top2[1] - 6 * Math.abs(Math.sin(Math.PI * seg(dc, 0, 160))) * (dc < 160 ? 1 : 0); r = 14 + 6 * Math.exp(-dc / 120) * Math.sin(dc * 0.04); s3 = 1;
      }
      s3 *= 1 - 0.85 * eio(melt);
      S.lastCube.setAttribute('opacity', 1);
      S.lastCube.setAttribute('transform', 'translate(' + P2(x, y + 4 * melt) + ') rotate(' + f1(r) + ') scale(' + f3(s3) + ')');
    } else S.lastCube.setAttribute('opacity', 0);
    var mp = seg(t, 6780, 7100);
    if (mp > 0 && mp < 1) {
      var m1 = [T.x + 3, T.y - CR];
      S.melt.setAttribute('opacity', f3(1 - seg(mp, 0.6, 1)));
      S.melt.setAttribute('transform', 'translate(' + P2(m1[0] + 10 * eio(mp), m1[1] + 4 + 18 * ei(mp)) + ') scale(' + f3(1 - 0.4 * mp) + ')');
    } else S.melt.setAttribute('opacity', 0);
    var ck = seg(t, 6150, 6400);
    if (ck > 0 && ck < 1) {
      var cd = '', c0 = toW(2, -CR - 3), R0 = 11 + 8 * eoC(ck), R1 = R0 + 5 * (1 - ck);
      [-2.7, -2.2, -0.95, -0.45].forEach(function (a) { cd += 'M' + P2(c0[0] + Math.cos(a) * R0, c0[1] + Math.sin(a) * R0) + 'L' + P2(c0[0] + Math.cos(a) * R1, c0[1] + Math.sin(a) * R1); });
      S.clink.setAttribute('d', cd); S.clink.setAttribute('opacity', f3(1 - ck));
    } else S.clink.setAttribute('opacity', 0);

    // set-down ring + dust when it lands from the shake hop
    var rp = seg(t, 5400, 5900);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 5400, 5680);
    if (dp > 0 && dp < 1) {
      var dd = '', r0b = 27 + 9 * eoC(dp), r1b = r0b + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + P2(T.x + Math.cos(a) * r0b, T.y + Math.sin(a) * r0b) + 'L' + P2(T.x + Math.cos(a) * r1b, T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lq = seg(t, 7400, 7850);
    S.line.setAttribute('opacity', f1(eo(lq) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lq, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2dunk;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2dunk = S;
    return S;
  }

  window.CCSteal2_dunk = {
    title: 'The Victory Shower',
    blurb: 'Nate’s chip spikes the ball and struts, a cooler tiptoes up behind it and freezes innocently when it looks back, then dumps a shower of Nick’s colour over its head.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2dunk = S;
      var token = {};
      root.__cc2dunkToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2dunkToken !== token) { resolve(); return; }
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
