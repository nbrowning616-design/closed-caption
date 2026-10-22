/* Closed Caption steal film: auntie (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE AUNTIE (key: auntie)
 *
 * Everyone has the relative who kisses you on both cheeks and leaves lipstick everywhere.
 * Top-down felt table; an enormous auntie (just her lips, cat-eye sunglasses with arched
 * brows, and a dangling pearl necklace) leans down into shot. Her lipstick is the dealer's
 * colour, so every kiss leaves a dealer-coloured print, until the chip is coated.
 *
 * Storyboard (ms)
 *    0- 700  Table deals in: rows drop in with a soft overshoot, chips pop on.
 *  550-1250  Camera eases in a touch (whole rows stay in frame).
 * 1000-1500  A shadow looms; other chips dim; Nate's chip trembles. The auntie swoops in
 *            from the top of frame: pearls swinging, brows up - "there you are!"
 * 1500-1760  Settles over the chip with a delighted smile.
 * 1760-1950  Wind-up: rises toward camera, lips pucker... and plunges: MWAH #1.
 * 1950-2240  Smooch, then pops away (smack ticks, a little heart). One print, tilted.
 * 2240-2650  Nate's chip shudders. Auntie admires her work, beaming.
 * 2650-3000  "Mwah, mwah": a quick double, head cocked at silly angles - two more prints.
 * 3000-3470  The chip tries to wriggle away: crouch, hop, hop, skidding off its spot.
 *            Brows snap into a frown, lips purse: "oh no you don't".
 * 3420-3880  She swoops and CATCHES it with a kiss, drags it back to its spot by suction,
 *            lets go (drop, bounce, dazed wobble).
 * 3880-4650  The flurry: six rapid kisses at every angle, the chip squashing under each.
 * 4650-5350  The prints run together into one solid coat in her colour; dashed ring
 *            returns, a polish glint sweeps, and the dealer's initial pops in.  (beat)
 * 5370-5660  A final, gentle, affectionate peck - the chip sticks to her lips and lifts...
 * 5660-6200  ...pops free and plonks back exactly in its spot (squash, ring, dust ticks).
 *            She beams, a heart floats up.
 * 6150-6950  She dips, then withdraws up out of frame, pearls trailing. Camera eases back.
 * 6950-7400  Stillness; the whole table quiet.
 * 7400-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var LENS = '#2A2230', GOLD = '#F2C14E', PEARL = '#FBF6EC';
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
  function eiC(t) { return t * t * t; }
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
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
    // escape direction: first candidate that keeps clear of other chips and the badge
    var T = target, cand = [[-26, h * 0.42], [26, h * 0.42], [-36, 0], [36, 0], [0, -h * 0.42]], E = cand[0];
    for (var k = 0; k < cand.length; k++) {
      var ex = T.x + cand[k][0], ey = T.y + cand[k][1], ok = ex - CR > 91 && ex + CR < 356;
      others.forEach(function (o) { if (Math.hypot(o.x - ex, o.y - ey) < 47) ok = false; });
      if (ok) { E = cand[k]; break; }
    }
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini, E: E };
  }

  // ---------- shapes ----------
  // Lips, centred on the mouth line. w half-width, hu/hl lip heights, sm smile (corner lift), pk pucker 0..1
  function lipsGeom(w, hu, hl, sm, pk) {
    var cy = -sm * 6 * (1 - pk), cx = w;          // corners
    var bow = lerp(0.62, 0.45, pk);               // cupid's bow dip
    var ml = lerp(1.5, 0.6, pk) + sm * 1.5;       // mouth-line sag at centre
    var up = 'M' + P2(-cx, cy) +
      'C' + P2(-w * 0.8, cy - hu * 0.75) + ' ' + P2(-w * 0.55, -hu) + ' ' + P2(-w * 0.3, -hu) +
      'C' + P2(-w * 0.14, -hu) + ' ' + P2(-w * 0.07, -hu * bow) + ' ' + P2(0, -hu * bow) +
      'C' + P2(w * 0.07, -hu * bow) + ' ' + P2(w * 0.14, -hu) + ' ' + P2(w * 0.3, -hu) +
      'C' + P2(w * 0.55, -hu) + ' ' + P2(w * 0.8, cy - hu * 0.75) + ' ' + P2(cx, cy) +
      'C' + P2(w * 0.5, ml) + ' ' + P2(-w * 0.5, ml) + ' ' + P2(-cx, cy) + 'Z';
    var lo = 'M' + P2(-cx, cy) +
      'C' + P2(-w * 0.5, ml) + ' ' + P2(w * 0.5, ml) + ' ' + P2(cx, cy) +
      'C' + P2(w * 0.85, cy + hl * 0.9) + ' ' + P2(w * 0.45, hl) + ' ' + P2(0, hl) +
      'C' + P2(-w * 0.45, hl) + ' ' + P2(-w * 0.85, cy + hl * 0.9) + ' ' + P2(-cx, cy) + 'Z';
    var line = 'M' + P2(-cx * 0.96, cy) + 'C' + P2(-w * 0.5, ml) + ' ' + P2(w * 0.5, ml) + ' ' + P2(cx * 0.96, cy);
    // pucker creases
    var cr = '';
    if (pk > 0.05) {
      [-0.42, -0.14, 0.14, 0.42].forEach(function (f) {
        cr += 'M' + P2(w * f, -hu * 0.28) + 'L' + P2(w * f * 1.12, -hu * 0.72);
        cr += 'M' + P2(w * f, hl * 0.3) + 'L' + P2(w * f * 1.12, hl * 0.74);
      });
    }
    var shine = 'M' + P2(-w * 0.35, hl * 0.55) + 'Q' + P2(0, hl * 0.78) + ' ' + P2(w * 0.3, hl * 0.52);
    return { up: up, lo: lo, line: line, cr: cr, shine: shine, cy: cy };
  }
  // A puckered lip print (two lobes with a gap and streaks), centred at 0,0
  function printGeom() {
    var w = 13, hu = 8.5, hl = 9.5;
    var up = 'M' + P2(-w, 0) + 'C' + P2(-w * 0.8, -hu * 0.8) + ' ' + P2(-w * 0.5, -hu) + ' ' + P2(-w * 0.28, -hu) +
      'C' + P2(-w * 0.12, -hu) + ' ' + P2(-w * 0.06, -hu * 0.55) + ' ' + P2(0, -hu * 0.55) +
      'C' + P2(w * 0.06, -hu * 0.55) + ' ' + P2(w * 0.12, -hu) + ' ' + P2(w * 0.28, -hu) +
      'C' + P2(w * 0.5, -hu) + ' ' + P2(w * 0.8, -hu * 0.8) + ' ' + P2(w, 0) +
      'C' + P2(w * 0.5, -1.4) + ' ' + P2(-w * 0.5, -1.4) + ' ' + P2(-w, 0) + 'Z';
    var lo = 'M' + P2(-w * 0.92, 1.6) + 'C' + P2(-w * 0.5, 0.6) + ' ' + P2(w * 0.5, 0.6) + ' ' + P2(w * 0.92, 1.6) +
      'C' + P2(w * 0.8, hl * 0.95) + ' ' + P2(w * 0.4, hl) + ' ' + P2(0, hl) +
      'C' + P2(-w * 0.4, hl) + ' ' + P2(-w * 0.8, hl * 0.95) + ' ' + P2(-w * 0.92, 1.6) + 'Z';
    var st = '';
    [-0.55, -0.2, 0.2, 0.55].forEach(function (f) {
      st += 'M' + P2(w * f, -hu * 0.25) + 'L' + P2(w * f * 1.1, -hu * 0.75);
      st += 'M' + P2(w * f, hl * 0.32) + 'L' + P2(w * f * 1.1, hl * 0.8);
    });
    return { up: up, lo: lo, st: st };
  }
  // cat-eye lens, right-hand one (mirror for left), centred at 0,0
  var LENS_D = 'M-23 -6C-24 -16 -10 -18 4 -16C16 -14.5 25 -21 30 -22C32 -12 27 4 18 11C9 18 -10 18 -18 11C-23 6 -23 0 -23 -6Z';
  var LENS_L = 'M23 -6C24 -16 10 -18 -4 -16C-16 -14.5 -25 -21 -30 -22C-32 -12 -27 4 -18 11C-9 18 10 18 18 11C23 6 23 0 23 -6Z';
  var LX = 37, LY = -60;     // lens centres (±LX, LY), face-local
  var PA = [74, -158];       // pearl anchors (±)
  var HEART = 'M0 4.5C-1 3 -7 -0.5 -7 -4.2C-7 -7 -4.4 -8.4 -2.4 -7.6C-1.3 -7.2 -0.4 -6.2 0 -5.2C0.4 -6.2 1.3 -7.2 2.4 -7.6C4.4 -8.4 7 -7 7 -4.2C7 -0.5 1 3 0 4.5Z';

  // ---------- choreography ----------
  function plan(L) {
    var T = L.target, hx = T.x, hy = T.y, E = L.E;
    // chip offset track (relative to its home) + rotation
    var cxK = [[0, 0], [3150, 0], [3290, 0.55 * E[0], eoC], [3360, 0.55 * E[0]], [3470, E[0], eoC], [3600, E[0]], [3820, 0, eioC]];
    var cyK = [[0, 0], [3150, 0], [3290, 0.55 * E[1], eoC], [3360, 0.55 * E[1]], [3470, E[1], eoC], [3600, E[1]], [3820, 0, eioC]];
    var crK = [[0, 0], [3100, 0], [3200, 14], [3290, 6], [3335, -4], [3420, -15], [3470, -9], [3600, -9], [3820, 0]];
    function chipOff(t) { return [kf(cxK, t), kf(cyK, t)]; }
    function chipRot(t) { return kf(crK, t); }
    function chipAt(t) { var o = chipOff(t); return [hx + o[0], hy + o[1]]; }

    var kisses = [
      { tc: 1950, hold: 80, o: [-2, -5], r: -14, big: 1, heart: 1 },
      { tc: 2780, hold: 45, o: [9, 7], r: 30 },
      { tc: 2950, hold: 45, o: [-10, 9], r: -40 },
      { tc: 3520, hold: 340, o: [3, -10], r: 22, catchK: 1 },
      { tc: 3980, hold: 30, o: [11, -9], r: 42 },
      { tc: 4110, hold: 30, o: [-12, -2], r: -50 },
      { tc: 4240, hold: 30, o: [3, 12], r: 8 },
      { tc: 4360, hold: 30, o: [13, 4], r: -24 },
      { tc: 4470, hold: 30, o: [-7, -13], r: 36 },
      { tc: 4580, hold: 30, o: [-13, 12], r: -18 },
      { tc: 5450, hold: 70, o: [0, -1], r: 0, peck: 1, noPrint: 1 }
    ];
    kisses.forEach(function (k) {
      var c = chipAt(k.tc);
      k.cx = c[0] + k.o[0]; k.cy = c[1] + k.o[1];
      var cr = chipRot(k.tc), lo = rotv(k.o[0], k.o[1], -cr);
      k.lx = lo[0]; k.ly = lo[1]; k.lr = k.r - cr;   // print in chip-local space
    });
    function hov(k, dist) { var a = k.r * Math.PI / 180; return [k.cx + Math.sin(a) * dist, k.cy - Math.cos(a) * dist]; }

    // poses: x, y (lips centre), r (deg), d (depth: 0 hover, 1 touching, <0 nearer camera), p pucker, s smile, b brows
    var fx = hx + (W / 2 - hx) * 0.3;
    var poses = [], cur = { x: fx + 80, y: -240, r: 20, d: -0.45, p: 0, s: 0.6, b: 0.4 };
    function P(t, o, e) { for (var k in o) cur[k] = o[k]; var c = {}; for (var q in cur) c[q] = cur[q]; c.t = t; c.e = e; poses.push(c); }
    var K = kisses;
    P(0, {}); P(1020, {});
    P(1520, { x: fx - 8, y: hy - 30, r: -7, d: 0.06, s: 1, b: 1 }, eoC);
    P(1700, { x: fx, y: hy - 40, r: 0, d: 0 });
    P(1770, {});
    P(1885, { x: fx - 2, y: hy - 52, r: -6, d: -0.3, p: 1, s: 0, b: 0.7 }, eoC);
    P(1950, { x: K[0].cx, y: K[0].cy, r: K[0].r, d: 1 }, ei);
    P(2030, {});
    P(2250, { x: fx, y: hy - 42, r: -4, d: -0.08, p: 0.15, s: 1, b: 1 }, eoC);
    P(2620, { x: fx + 3, y: hy - 38, r: 4, d: 0, p: 0 });
    var h2 = hov(K[1], 22);
    P(2715, { x: h2[0], y: h2[1], r: K[1].r * 0.7, d: -0.1, p: 1, s: 0, b: 0.8 }, eoC);
    P(2780, { x: K[1].cx, y: K[1].cy, r: K[1].r, d: 1 }, ei);
    P(2825, {});
    var h3 = hov(K[2], 18);
    P(2890, { x: h3[0], y: h3[1], r: K[2].r * 0.8, d: 0.3 }, eoC);
    P(2950, { x: K[2].cx, y: K[2].cy, r: K[2].r, d: 1 }, ei);
    P(2995, {});
    P(3160, { x: fx, y: hy - 42, r: 0, d: 0, p: 0, s: 1, b: 1 }, eoC);
    var c33 = chipAt(3330);
    P(3320, { x: c33[0] + 0.3 * L.E[0], y: c33[1] - 46, r: -12, d: -0.05, p: 0.45, s: 0, b: -1 }, eoC);
    var c42 = chipAt(3430), h4 = hov(K[3], 26);
    P(3440, { x: lerp(c42[0], h4[0], 0.5), y: h4[1] - 6, r: 14, d: -0.22, p: 1, b: -0.4 });
    P(3520, { x: K[3].cx, y: K[3].cy, r: K[3].r, d: 1 }, ei);
    P(3600, { d: 1 });
    P(3820, { d: 0.82, r: 12 });
    P(3870, { d: 0.82, b: 1 });
    // flurry
    for (var i = 4; i <= 9; i++) {
      var k = K[i], hv = hov(k, 15);
      P(k.tc - 55, { x: hv[0], y: hv[1], r: k.r, d: 0.35, p: 1, s: 0, b: 1 }, eoC);
      P(k.tc, { x: k.cx, y: k.cy, d: 1 }, ei);
      P(k.tc + k.hold, {});
    }
    P(4820, { x: fx, y: hy - 42, r: 0, d: 0, p: 0, s: 1, b: 1 }, eoC);
    P(5290, { r: -3 });
    P(5375, { x: fx, y: hy - 48, r: 0, d: -0.14, p: 0.85, s: 0, b: 0.6 }, eoC);
    P(5450, { x: K[10].cx, y: K[10].cy, d: 1 }, eio);
    P(5520, {});
    P(5660, { d: 0.5 }, eio);
    P(5860, { x: fx, y: hy - 44, r: -8, d: -0.06, p: 0, s: 1, b: 1 }, eoC);
    P(6150, { r: -10, d: 0 });
    P(6270, { y: hy - 36, r: -4, d: 0.14, b: 0.7 });
    P(6950, { x: fx + 70, y: -280, r: 18, d: -0.55, b: 1 }, eioC);
    var ch = {};
    ['x', 'y', 'r', 'd', 'p', 's', 'b'].forEach(function (n) { ch[n] = poses.map(function (q) { return [q.t, q[n], q.e]; }); });
    // windows where the lips are stuck to the chip (catch-drag, peck-lift)
    var attach = [{ t0: 3520, t1: 3860, o: K[3].o }];
    return { chipOff: chipOff, chipRot: chipRot, chipAt: chipAt, kisses: kisses, ch: ch, attach: attach, hx: hx, hy: hy };
  }

  function faceAt(P, t) {
    var f = {};
    for (var n in P.ch) f[n] = kf(P.ch[n], t);
    P.attach.forEach(function (a) {
      if (t >= a.t0 && t <= a.t1) { var c = P.chipAt(t); f.x = c[0] + a.o[0]; f.y = c[1] + a.o[1]; }
    });
    // fond "mm-mm" sway while she admires the finished coat
    var w = seg(t, 4850, 4950) * (1 - seg(t, 5250, 5340));
    f.r += 4 * Math.sin((t - 4850) / 1000 * 2 * Math.PI * 2.2) * w;
    f.y += -1.5 * Math.abs(Math.sin((t - 4850) / 1000 * 2 * Math.PI * 2.2)) * w;
    // hover breathing
    f.d += 0.02 * Math.sin(t / 1000 * 2 * Math.PI * 1.3);
    return f;
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-auntie-' + (++uid) + '-';
    var L = layout(opts), P = plan(L), T = L.target, DC = opts.dealerColor || '#E8559E';
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cc = mk('clipPath', { id: id + 'chip', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('circle', { cx: 0, cy: 0, r: CR }, cc);
    var lc = mk('clipPath', { id: id + 'lens', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('path', { d: LENS_L, transform: 'translate(' + (-LX) + ',' + LY + ')' }, lc);
    mk('path', { d: LENS_D, transform: 'translate(' + LX + ',' + LY + ')' }, lc);

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
      var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
      tx.textContent = txt;
      return { g: g, body: body, ring: ring, hi: hi, tx: tx };
    }

    var rowsG = [], chipsG = [], V = {};
    var cardLayer = mk('g', {}, cam), shadowFloor = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
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
          var base = chipParts(tg, c.color, c.ini);
          var clipG = mk('g', { 'clip-path': 'url(#' + id + 'chip)' }, tg);
          var coat = mk('circle', { r: CR, fill: DC, opacity: 0 }, clipG);
          var pg = printGeom(), prints = [];
          P.kisses.forEach(function (k) {
            if (k.noPrint) return;
            var pgr = mk('g', { opacity: 0 }, clipG);
            var inner = mk('g', {}, pgr);
            var u = mk('path', { d: pg.up, fill: DC, stroke: INK, 'stroke-width': 1.1, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round' }, inner);
            var lw = mk('path', { d: pg.lo, fill: DC, stroke: INK, 'stroke-width': 1.1, 'stroke-opacity': 0.55, 'stroke-linejoin': 'round' }, inner);
            var st = mk('path', { d: pg.st, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.3, 'stroke-width': 0.9, 'stroke-linecap': 'round' }, inner);
            prints.push({ k: k, g: pgr, inner: inner, u: u, lw: lw, st: st });
          });
          var shimmer = mk('rect', { x: -40, y: -40, width: 9, height: 80, fill: '#FFFFFF', opacity: 0 }, clipG);
          var outline = mk('circle', { r: CR, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, tg);
          var topG = mk('g', { opacity: 0 }, tg);
          mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, topG);
          mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, topG);
          var ntxt = L.ini(opts.dealer);
          var txG = mk('g', {}, tg);
          var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': ntxt.length > 1 ? 15 : 18, opacity: 0 }, txG);
          tx.textContent = ntxt;
          V = { wrap: wrap, sh: sh, tg: tg, coat: coat, prints: prints, shimmer: shimmer, topG: topG, txG: txG, tx: tx, c: c, outline: outline };
        } else {
          var cg = mk('g', {}, wrap); chipParts(cg, c.color, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });
    var ripple = mk('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- auntie ----
    // floor shadow (silhouette of lips + glasses)
    var shG = mk('g', { opacity: 0.17 }, shadowFloor);
    var shUp = mk('path', { fill: INK }, shG), shLo = mk('path', { fill: INK }, shG);
    mk('path', { d: LENS_L, fill: INK, transform: 'translate(' + (-LX) + ',' + LY + ')' }, shG);
    mk('path', { d: LENS_D, fill: INK, transform: 'translate(' + LX + ',' + LY + ')' }, shG);
    mk('path', { d: 'M-15 ' + (LY - 6) + 'Q0 ' + (LY - 14) + ' 15 ' + (LY - 6), fill: 'none', stroke: INK, 'stroke-width': 5 }, shG);

    var fxLayer = mk('g', {}, cam);
    var pearlG = mk('g', {}, fxLayer);
    var pearlStr = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.4, opacity: 0.7 }, pearlG);
    var pearls = [];
    for (var i = 0; i < 17; i++) {
      var pg2 = mk('g', {}, pearlG);
      mk('circle', { r: 5, fill: PEARL, stroke: INK, 'stroke-width': 1.6 }, pg2);
      mk('circle', { cx: -1.6, cy: -1.7, r: 1.5, fill: '#FFFFFF' }, pg2);
      mk('path', { d: 'M-3 2.2Q0 4 3 2.2', fill: 'none', stroke: INK, 'stroke-opacity': 0.18, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, pg2);
      pearls.push(pg2);
    }
    var face = mk('g', {}, fxLayer);
    // glasses
    var glasses = mk('g', {}, face);
    mk('path', { d: 'M' + (-LX - 29) + ' ' + (LY - 17) + 'L' + (-LX - 42) + ' ' + (LY - 40), stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round', fill: 'none' }, glasses);
    mk('path', { d: 'M' + (LX + 29) + ' ' + (LY - 17) + 'L' + (LX + 42) + ' ' + (LY - 40), stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round', fill: 'none' }, glasses);
    mk('path', { d: LENS_L, fill: LENS, stroke: INK, 'stroke-width': 4.6, 'stroke-linejoin': 'round', transform: 'translate(' + (-LX) + ',' + LY + ')' }, glasses);
    mk('path', { d: LENS_D, fill: LENS, stroke: INK, 'stroke-width': 4.6, 'stroke-linejoin': 'round', transform: 'translate(' + LX + ',' + LY + ')' }, glasses);
    mk('path', { d: 'M-14 ' + (LY - 7) + 'Q0 ' + (LY - 15) + ' 14 ' + (LY - 7), fill: 'none', stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, glasses);
    var refl = mk('g', { 'clip-path': 'url(#' + id + 'lens)' }, glasses);
    mk('path', { d: 'M' + (-LX - 14) + ' ' + (LY + 12) + 'L' + (-LX + 6) + ' ' + (LY - 14) + 'M' + (LX - 14) + ' ' + (LY + 12) + 'L' + (LX + 6) + ' ' + (LY - 14), stroke: '#FFFFFF', 'stroke-opacity': 0.22, 'stroke-width': 5, 'stroke-linecap': 'round' }, refl);
    var glint = mk('rect', { x: -10, y: LY - 30, width: 12, height: 60, fill: '#FFFFFF', opacity: 0.5 }, refl);
    [-1, 1].forEach(function (s) {
      mk('circle', { cx: s * (LX + 29.5), cy: LY - 21.5, r: 3.2, fill: GOLD, stroke: INK, 'stroke-width': 1.3 }, glasses);
      mk('circle', { cx: s * (LX + 22), cy: LY - 18.6, r: 1.9, fill: GOLD, stroke: INK, 'stroke-width': 1 }, glasses);
    });
    var brows = [mk('path', { fill: 'none', stroke: INK, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, face),
                 mk('path', { fill: 'none', stroke: INK, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, face)];
    // lips
    var lipsG = mk('g', {}, face);
    var lo = mk('path', { fill: DC, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, lipsG);
    var up = mk('path', { fill: DC, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, lipsG);
    var upShade = mk('path', { fill: INK, opacity: 0.13 }, lipsG);
    var lshine = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 3, 'stroke-linecap': 'round' }, lipsG);
    var crease = mk('path', { fill: 'none', stroke: INK, 'stroke-opacity': 0.3, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, lipsG);
    var mline = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, lipsG);
    var dimples = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, lipsG);
    var mole = mk('circle', { r: 2.3, fill: INK }, face);

    var ticks = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, fxLayer);
    var hearts = [mk('path', { d: HEART, fill: DC, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0 }, fxLayer),
                  mk('path', { d: HEART, fill: DC, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0 }, fxLayer)];

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, P: P, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, ripple: ripple, dust: dust,
      shG: shG, shUp: shUp, shLo: shLo, pearls: pearls, pearlStr: pearlStr, face: face, glint: glint, brows: brows,
      lo: lo, up: up, upShade: upShade, lshine: lshine, crease: crease, mline: mline, dimples: dimples, mole: mole,
      ticks: ticks, hearts: hearts, line: line, lipsG: lipsG
    };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var P = S.P, L = S.L, T = L.target, V = S.V;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6500, 7200)));
    var Z = lerp(1, 1.15, zk);
    var fy = clamp(T.y - 40, H / (2 * 1.15) - 10, 600 - H / (2 * 1.15) + 20);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1100, 1450)) * (1 - eio(seg(t, 6200, 6700)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- victim chip ----
    var off = P.chipOff(t), rot = P.chipRot(t), sc = chipPop(T), dx = 0;
    // loom tremble
    var lt = seg(t, 1250, 1350) * (1 - seg(t, 1650, 1760));
    dx += 0.9 * lt * Math.sin(t * 0.19);
    // big shudder after the first kiss
    if (t > 2240 && t < 2700) { var q = seg(t, 2240, 2700); dx += 3 * Math.sin((t - 2240) * 0.13) * Math.pow(1 - q, 1.5); sc *= 1 - 0.05 * Math.sin(Math.PI * Math.min(1, q * 2.5)); }
    if (t > 3000 && t < 3110) dx += 1.4 * Math.sin((t - 3000) * 0.2);
    // crouch, hops
    sc *= 1 - 0.07 * eo(seg(t, 3040, 3140)) * (1 - seg(t, 3150, 3200));
    var lift = 0.12 * Math.sin(Math.PI * seg(t, 3150, 3290)) + 0.1 * Math.sin(Math.PI * seg(t, 3360, 3470));
    lift += 0.5 * eo(seg(t, 3600, 3660)) * (1 - ei(seg(t, 3820, 3870)));     // carried back by suction
    lift += eio(seg(t, 5520, 5660)) * (1 - ei(seg(t, 5660, 5740)));           // final peck lift
    sc *= 1 + 0.14 * lift;
    // contact squashes
    P.kisses.forEach(function (k) {
      var d = t - k.tc;
      if (d >= 0 && d < 500) sc *= 1 - (k.peck ? 0.04 : 0.08) * Math.exp(-d / 90) * Math.cos(2 * Math.PI * 4 * d / 1000);
    });
    // landings
    [3290, 3470].forEach(function (tl) { var d = t - tl; if (d >= 0 && d < 350) sc *= 1 - 0.05 * Math.exp(-d / 80) * Math.cos(2 * Math.PI * 5 * d / 1000); });
    if (t >= 3870 && t < 4400) { var d1 = t - 3870; sc *= 1 - 0.07 * Math.exp(-d1 / 90) * Math.cos(2 * Math.PI * 4.5 * d1 / 1000); rot += 7 * Math.exp(-d1 / 160) * Math.sin(2 * Math.PI * 3 * d1 / 1000); }
    if (t >= 5740 && t < 6600) { var d2 = t - 5740; sc *= 1 - 0.09 * Math.exp(-d2 / 110) * Math.cos(2 * Math.PI * 4.5 * d2 / 1000); }
    var cxp = T.x + off[0] + dx, cyp = T.y + off[1];
    V.tg.setAttribute('transform', 'translate(' + f1(cxp) + ',' + f1(cyp) + ') rotate(' + f1(rot) + ') scale(' + f3(sc) + ')');
    var so = 5 * lift;
    V.sh.setAttribute('r', f1(CR * Math.min(sc, 1.04)));
    V.sh.setAttribute('cx', f1(cxp + 1.5 + so * 0.5)); V.sh.setAttribute('cy', f1(cyp + 3.5 + so * 1.6));
    V.sh.setAttribute('opacity', f1(28 - so * 2) / 100);

    // prints
    var merge = seg(t, 4680, 5000);
    V.prints.forEach(function (pr) {
      var tr = pr.k.tc + Math.min(pr.k.hold, 60) - 15, p = seg(t, tr, tr + 130);
      if (p <= 0) { pr.g.setAttribute('opacity', 0); return; }
      var s2 = lerp(1.25, 1, eoC(p));
      pr.g.setAttribute('opacity', f1(clamp(p * 4) * 100) / 100);
      pr.g.setAttribute('transform', 'translate(' + f1(pr.k.lx) + ',' + f1(pr.k.ly) + ') rotate(' + f1(pr.k.lr) + ')');
      pr.inner.setAttribute('transform', 'scale(' + f3(s2 * (1 + 0.12 * eio(merge))) + ')');
      pr.u.setAttribute('stroke-opacity', f1(55 * (1 - merge)) / 100); pr.lw.setAttribute('stroke-opacity', f1(55 * (1 - merge)) / 100);
      pr.st.setAttribute('stroke-opacity', f1(30 * (1 - eio(seg(t, 4800, 5100)))) / 100);
    });
    V.coat.setAttribute('opacity', f3(eio(seg(t, 4760, 5080))));
    V.topG.setAttribute('opacity', f3(eio(seg(t, 5000, 5200))));
    var tp = seg(t, 5120, 5420);
    V.tx.setAttribute('opacity', tp > 0 ? f3(clamp(tp * 3)) : 0);
    V.txG.setAttribute('transform', 'scale(' + f3(tp > 0 ? backOut(tp, 2.6) : 0.01) + ')');
    var shp = seg(t, 5180, 5480);
    V.shimmer.setAttribute('opacity', shp > 0 && shp < 1 ? 0.55 : 0);
    V.shimmer.setAttribute('transform', 'rotate(30) translate(' + f1(lerp(-6, 76, eio(shp))) + ',0)');

    // set-down ring + dust
    var rp = seg(t, 5740, 6240);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 5740, 6020);
    if (dp > 0 && dp < 1) {
      var dd = '', r0 = 27 + 9 * eoC(dp), r1b = r0 + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + P2(T.x + Math.cos(a) * r0, T.y + Math.sin(a) * r0) + 'L' + P2(T.x + Math.cos(a) * r1b, T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- auntie ----
    var F = faceAt(P, t);
    var fs = 1.12 * (1 - 0.16 * F.d);
    // contact squash on the lips, and a smack overshoot as they pull off
    var sq = 0, smack = 0;
    P.kisses.forEach(function (k) {
      var a = seg(t, k.tc - 10, k.tc + 25), b = 1 - seg(t, k.tc + k.hold, k.tc + k.hold + 60);
      sq = Math.max(sq, a * b * (k.peck ? 0.6 : 1));
      smack += spring(t - (k.tc + k.hold), k.big ? 0.12 : 0.07, 6, 90);
    });
    var pk = clamp(F.p);
    var lw = lerp(31, 15, pk) * (1 + 0.32 * sq) * (1 + smack), hu = lerp(12, 14, pk) * (1 - 0.22 * sq) * (1 + smack * 0.6), hl = lerp(14, 16, pk) * (1 - 0.22 * sq) * (1 + smack * 0.6);
    var lg = lipsGeom(lw, hu, hl, clamp(F.s), pk);
    S.up.setAttribute('d', lg.up); S.lo.setAttribute('d', lg.lo); S.upShade.setAttribute('d', lg.up);
    S.mline.setAttribute('d', lg.line); S.crease.setAttribute('d', lg.cr); S.lshine.setAttribute('d', lg.shine);
    S.mline.setAttribute('stroke-width', f1(lerp(2.4, 1.6, pk)));
    if (F.s > 0.3 && pk < 0.3) {
      var cy = lg.cy, k2 = clamp((F.s - 0.3) / 0.7) * (1 - pk / 0.3);
      S.dimples.setAttribute('d', 'M' + P2(-lw - 1, cy - 3 * k2) + 'Q' + P2(-lw - 4.5 * k2, cy) + ' ' + P2(-lw - 1, cy + 3 * k2) + 'M' + P2(lw + 1, cy - 3 * k2) + 'Q' + P2(lw + 4.5 * k2, cy) + ' ' + P2(lw + 1, cy + 3 * k2));
    } else S.dimples.setAttribute('d', '');
    S.mole.setAttribute('cx', f1(lw * 0.9 + 4)); S.mole.setAttribute('cy', f1(-hu - 5));
    // brows: b>0 raised & arched, b<0 frown (inner ends down)
    var b = F.b;
    [-1, 1].forEach(function (s, i) {
      var ox = s * LX, by = LY - 27 - 6 * Math.max(0, b) + 2 * Math.max(0, -b);
      var inner = by + 9 * Math.max(0, -b) - 1, outer = by - 2 * Math.max(0, b) + 3 * Math.max(0, -b);
      var arch = by - 8 - 3 * Math.max(0, b) + 5 * Math.max(0, -b);
      S.brows[i].setAttribute('d', 'M' + P2(ox - s * 17, inner) + 'Q' + P2(ox + s * 2, arch) + ' ' + P2(ox + s * 24, outer));
    });
    // glint sweeps on arrival and before leaving
    var gp1 = seg(t, 1450, 1800), gp2 = seg(t, 5900, 6250), gp = gp1 > 0 && gp1 < 1 ? gp1 : gp2;
    S.glint.setAttribute('transform', 'rotate(28) translate(' + f1(lerp(-90, 110, gp)) + ',0)');
    S.glint.setAttribute('opacity', gp > 0 && gp < 1 ? 0.45 : 0);

    var ftr = 'translate(' + f1(F.x) + ',' + f1(F.y) + ') rotate(' + f1(F.r) + ') scale(' + f3(fs) + ')';
    S.face.setAttribute('transform', ftr);
    // floor shadow: offset grows with height
    var hgt = 1 - clamp(F.d, -0.6, 1);
    S.shUp.setAttribute('d', lg.up); S.shLo.setAttribute('d', lg.lo);
    S.shG.setAttribute('transform', 'translate(' + f1(F.x + 5 + 9 * hgt) + ',' + f1(F.y + 7 + 16 * hgt) + ') rotate(' + f1(F.r) + ') scale(' + f3(fs * (0.97 + 0.05 * hgt)) + ')');
    S.shG.setAttribute('opacity', f3(0.24 - 0.07 * hgt));

    // pearls: a dangling loop above the glasses, lagging behind her motion
    var Fp = faceAt(P, t - 90);
    var vx = clamp(F.x - Fp.x, -45, 45), vy = clamp(F.y - Fp.y, -45, 45);
    function toW(lx, ly) { var v = rotv(lx * fs, ly * fs, F.r); return [F.x + v[0], F.y + v[1]]; }
    var A = toW(-PA[0], PA[1]), B = toW(PA[0], PA[1]), M = toW(0, PA[1] + 74);
    var sw = 6 * Math.sin(t / 1000 * 2 * Math.PI * 0.9);
    var C = [M[0] - vx * 0.9 + sw, M[1] - vy * 0.5];
    var spath = 'M' + P2(A[0], A[1]) + 'Q' + P2(C[0], C[1]) + ' ' + P2(B[0], B[1]);
    S.pearlStr.setAttribute('d', spath);
    var n = S.pearls.length;
    for (var i = 0; i < n; i++) {
      var u = (i + 0.5) / n, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
      var px = w0 * A[0] + w1 * C[0] + w2 * B[0], py = w0 * A[1] + w1 * C[1] + w2 * B[1];
      S.pearls[i].setAttribute('transform', 'translate(' + P2(px, py) + ') scale(' + f3(fs) + ')');
    }

    // smack ticks around the lips as they pull off
    var td = '';
    P.kisses.forEach(function (k) {
      var tr = k.tc + k.hold, p = seg(t, tr, tr + (k.big ? 280 : 200));
      if (p <= 0 || p >= 1) return;
      var cx = k.cx, cy = k.cy, R0 = (k.big ? 24 : 19) + 12 * eoC(p), R1 = R0 + (k.big ? 9 : 6) * (1 - p);
      [-150, -115, -65, -30].forEach(function (a) {
        var aa = (a + k.r) * Math.PI / 180;
        td += 'M' + P2(cx + Math.cos(aa) * R0 * 1.25, cy + Math.sin(aa) * R0) + 'L' + P2(cx + Math.cos(aa) * R1 * 1.25, cy + Math.sin(aa) * R1);
      });
    });
    S.ticks.setAttribute('d', td);

    // hearts
    [[2050, P.kisses[0]], [5700, null]].forEach(function (hd, i) {
      var p = seg(t, hd[0], hd[0] + 750), hEl = S.hearts[i];
      if (p <= 0 || p >= 1) { hEl.setAttribute('opacity', 0); return; }
      var bx = hd[1] ? hd[1].cx + 30 : T.x + 28, by = hd[1] ? hd[1].cy - 18 : T.y - 26;
      var x = bx + 6 * Math.sin(p * Math.PI * 2.2), y = by - 46 * eoC(p);
      var s3 = (i ? 1.3 : 1.05) * backOut(clamp(p * 3), 2.2);
      hEl.setAttribute('transform', 'translate(' + P2(x, y) + ') rotate(' + f1(10 * Math.sin(p * 9)) + ') scale(' + f3(s3) + ')');
      hEl.setAttribute('opacity', f3(1 - seg(p, 0.6, 1)));
    });

    // final line
    var lp = seg(t, 7400, 7850);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2auntie;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2auntie = S;
    return S;
  }

  window.CCSteal2_auntie = {
    title: 'The Auntie',
    blurb: 'An enormous, glamorous auntie leans into shot and smothers Nate’s chip in kisses until her lipstick (Nick’s colour) coats it completely.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2auntie = S;
      var token = {};
      root.__cc2auntieToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2auntieToken !== token) { resolve(); return; }
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
