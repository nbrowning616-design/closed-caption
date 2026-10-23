/* Closed Caption steal film: octopus (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE OCTOPUS
 *
 * Storyboard (ms) - top-down view of a felt table, caption rows 1/2/3/CC.
 *    0- 700  Table deals in: rows drop in with a soft overshoot, chips pop on.
 *  650-1000  Two arm tips slap over the table rim beside Nate's row and grip.
 * 1000-1350  PEEK: a coral octopus head rises over the edge, eyes first.
 * 1350-1950  It looks up the table, down the table... spots Nate's chip: eyes
 *            go wide, pupils swell, mouth an "o". Nate's chip shivers, the
 *            other chips dim.
 * 1800-2250  Anticipation sink, then it hauls itself over the rim (stretch).
 * 2250-2800  Slithers across the felt in two surges, arms flowing and
 *            trailing in overlapping waves, rights itself upright.
 * 2800-3350  Wraps four arms round the chip like treasure, hugs it close
 *            (chip pulled in ~10px), squashes, happy closed eyes.
 * 3400-3850  Concentrates: eyes squeezed, swelling, trembling - chromatophore
 *            spots of Nick's colour flicker on across its skin.
 * 3850-4400  COLOUR WAVE: Nick's colour sweeps out from the head to the arm
 *            tips (bright wavefront). Eyes pop open, delighted.
 * 4400-4700  Beat: looks at its own arm, then at us. Pleased.
 * 4700-5000  Lets the chip go, leans back, inhales (swells), purses its lips.
 * 5000-5120  "Pfft": one polite squirt of Nick-coloured ink arcs to the chip.
 * 5120-5650  Splat floods the chip (Na -> Ni underneath), droplets, then the
 *            ink soaks in and leaves a clean Nick chip.
 * 5650-5900  Beat: a sheepish glance at camera, polite blink.
 * 5900-6250  TIDY: lets go, one arm pushes the chip back into its exact spot.
 * 6250-6400  Pat: chip squash + Nick-coloured ring + dust ticks (set-down).
 * 6380-6740  Satisfied slow happy blink, little head tilt.
 * 6700-7350  Turns and slides back off the table edge, arms trailing; camera
 *            pulls back.
 * 7350-7500  Stillness.
 * 7500-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', OCTO = '#EF8C69', SUCK = '#FFE8D6';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000, NP = 18, ZMAX = 1.18, K = 1.25;
  var DEG = Math.PI / 180;
  var SPREAD = [-130, -95, -60, -22, 22, 60, 95, 130].map(function (a) { return a * DEG; });
  var ALEN = [52, 48, 54, 56, 56, 54, 48, 52];
  var ORDER = [0, 7, 1, 6, 3, 4, 2, 5];
  var uid = 0;

  // ---------- math ----------
  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerp2(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function eio(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function eioC(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eo(t) { return 1 - (1 - t) * (1 - t); }
  function eoC(t) { return 1 - Math.pow(1 - t, 3); }
  function ei(t) { return t * t; }
  function eS(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function bump(t, a, b) { return Math.sin(Math.PI * seg(t, a, b)); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function P(p) { return f1(p[0]) + ' ' + f1(p[1]); }
  function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function kf(keys, t, ease) {
    ease = ease || eio;
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) { var a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (b[2] || ease)((t - a[0]) / (b[0] - a[0]))); }
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
  function bez3(a, b, c, d, t) {
    var u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
            u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
  }
  function smoothD(pts, close) {
    var s = 'M' + P(pts[0]);
    for (var i = 1; i < pts.length - 1; i++) s += 'Q' + P(pts[i]) + ' ' + P([(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]);
    return s + 'L' + P(pts[pts.length - 1]) + (close ? 'Z' : '');
  }
  function blobD(cx, cy, r, seed) {
    var pts = [], n = 30;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2;
      var rr = r * (1 + 0.13 * Math.sin(5 * a + seed) + 0.07 * Math.sin(3 * a + 2 * seed) + 0.05 * Math.sin(8 * a + 1.7));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    pts.push(pts[1]);
    var s = 'M' + P([(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]);
    for (i = 1; i < pts.length - 1; i++) s += 'Q' + P(pts[i]) + ' ' + P([(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]);
    return s + 'Z';
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
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini };
  }

  // ---------- choreography ----------
  function plan(L) {
    var T = L.target, d = T.x > W / 2 ? -1 : 1;
    var xe = d === 1 ? 14 : W - 14;
    var by = Math.max(46, L.rows[T.row].y - L.g / 2);
    var hug = [T.x, Math.max(T.y - 58, 46)], lean = Math.min(16, hug[1] - 31);
    var hid = [xe - d * 34 * K, by], peek = [xe + d * 13 * K, by], back = [xe - d * 1, by], over = [xe + d * 52, by];
    return { lean: lean, T: T, d: d, xe: xe, by: by, hug: hug, hid: hid, peek: peek, back: back, over: over,
      sl: [over, [T.x - d * 34, by], [T.x - d * 10, hug[1]], hug],
      ex: [hug, [T.x, by - 4], [xe + d * 70, by], [xe - d * 80, by]] };
  }
  function pulsed(p, n) { return eS(p) - (1 / (6.5 * n)) * Math.sin(2 * Math.PI * n * p) * Math.pow(Math.sin(Math.PI * p), 2); }
  function headPos(P, t) {
    var d = P.d, q;
    if (t < 1000) return P.hid;
    if (t < 1350) return lerp2(P.hid, P.peek, backOut(seg(t, 1000, 1350), 1.4));
    if (t < 1800) return [P.peek[0] + d * 1.5 * Math.sin((t - 1350) / 450 * Math.PI), P.by];
    if (t < 1950) return lerp2(P.peek, P.back, eo(seg(t, 1800, 1950)));
    if (t < 2250) return lerp2(P.back, P.over, eioC(seg(t, 1950, 2250)));
    if (t < 2800) { q = pulsed(seg(t, 2250, 2800), 2); return bez3(P.sl[0], P.sl[1], P.sl[2], P.sl[3], q); }
    var h = P.hug, x = h[0], y = h[1];
    if (t < 6750) {
      x += d * spring(t - 2800, 3, 2.6, 130);
      y += 0.8 * Math.sin((t - 2800) / 1000 * 2 * Math.PI * 0.9) * seg(t, 3100, 3300) * (1 - seg(t, 4650, 4750));
      y -= P.lean * eio(seg(t, 4700, 4980)) * (1 - eio(seg(t, 5300, 5650))) + 6 * eio(seg(t, 5300, 5650)) * (1 - eio(seg(t, 5900, 6200)));
      y -= 5 * Math.sin(Math.PI * seg(t, 5000, 5160)) * (1 - seg(t, 5160, 5300) * 0);
      if (t > 3500 && t < 3850) { var a = eio(seg(t, 3500, 3700)) * (1 - seg(t, 3830, 3850)); x += a * 0.9 * Math.sin(t * 0.23); y += a * 0.6 * Math.sin(t * 0.19 + 1); }
      return [x, y];
    }
    var p = seg(t, 6750, 7350);
    q = ei(p) * 0.35 + p * 0.65 - 0.03 * Math.sin(2 * Math.PI * 2 * p) * Math.sin(Math.PI * p);
    return bez3(P.ex[0], P.ex[1], P.ex[2], P.ex[3], clamp(q, 0, 1.2));
  }
  function headRot(P, t) { // degrees
    var d = P.d, r = d * 90;
    r += d * 7 * Math.sin((t - 1380) / 420 * Math.PI * 2) * bump(t, 1380, 1800) * 0.9;
    r = lerp(r, 0, eioC(seg(t, 2000, 2800)));
    r += spring(t - 2800, -d * 7, 2.2, 160);
    r += d * 18 * eio(seg(t, 4700, 4950)) * (1 - eio(seg(t, 5350, 5650)));
    r += -d * 9 * eio(seg(t, 6380, 6480)) * (1 - eio(seg(t, 6600, 6720)));
    r = lerp(r, -d * 90, eioC(seg(t, 6700, 7000)));
    return r;
  }
  function headScale(t) {
    var sx = 1, sy = 1, b;
    b = bump(t, 1000, 1350); sy += 0.1 * b; sx -= 0.05 * b;
    b = eo(seg(t, 1800, 1950)) * (1 - seg(t, 1950, 2000)); sy -= 0.13 * b; sx += 0.08 * b;
    b = bump(t, 1950, 2250); sy += 0.16 * b; sx -= 0.08 * b;
    var p = seg(t, 2250, 2800); b = Math.sin(2 * Math.PI * 2 * p - 0.6) * Math.pow(Math.sin(Math.PI * p), 1);
    sy += 0.07 * b; sx -= 0.04 * b;
    b = bump(t, 2900, 3150); sy -= 0.1 * b; sx += 0.07 * b;
    b = 0.02 * Math.sin((t - 3100) / 1000 * 2 * Math.PI * 0.9) * seg(t, 3100, 3300) * (1 - seg(t, 3400, 3450)); sy += b;
    b = eio(seg(t, 3420, 3830)) * (1 - seg(t, 3850, 3870)); sx += 0.07 * b; sy += 0.06 * b;
    sx += spring(t - 3850, 0.07, 4, 140); sy -= spring(t - 3850, 0.06, 4, 140);
    b = eio(seg(t, 4700, 4980)) * (1 - seg(t, 5000, 5040)); sx += 0.1 * b; sy += 0.07 * b;
    sx += spring(t - 5000, -0.09, 4.5, 120); sy += spring(t - 5000, 0.06, 4.5, 120);
    b = bump(t, 6250, 6400); sy -= 0.05 * b; sx += 0.04 * b;
    b = bump(t, 6750, 7350); sy += 0.12 * b; sx -= 0.07 * b;
    return [sx, sy];
  }
  function headXf(P, t) {
    var p = headPos(P, t), r = headRot(P, t), s = headScale(t); s = [s[0] * K, s[1] * K];
    var rr = r * DEG, c = Math.cos(rr), sn = Math.sin(rr);
    return { x: p[0], y: p[1], r: r, sx: s[0], sy: s[1], c: c, s: sn,
      w: function (lx, ly) { lx *= s[0]; ly *= s[1]; return [p[0] + lx * c - ly * sn, p[1] + lx * sn + ly * c]; },
      dir: function (lx, ly) { return [lx * c - ly * sn, lx * sn + ly * c]; },
      str: 'translate(' + f1(p[0]) + ' ' + f1(p[1]) + ') rotate(' + r.toFixed(2) + ') scale(' + s[0].toFixed(3) + ' ' + s[1].toFixed(3) + ')' };
  }
  function chipOff(t) { return -10 * eio(seg(t, 2950, 3200)) * (1 - eioC(seg(t, 5980, 6250))); }

  // ---------- arms ----------
  function freeArm(i, R, th, L, prm) {
    var pts = [R.slice()], x = R[0], y = R[1], ds = L / (NP - 1), cs = SPREAD[i] < 0 ? 1 : -1;
    for (var k = 1; k < NP; k++) {
      var u = (k - 0.5) / (NP - 1);
      var kap = cs * prm.curl * (0.2 + 3.4 * u * u) * 1.5 / L + prm.A * Math.sin(prm.ph - 2 * Math.PI * 1.1 * u + i * 0.9) * (0.3 + u) * 3 / L;
      th += kap * ds;
      if (prm.tk > 0) th += prm.tk * angDiff(prm.trail, th) * ds / L * 2.4 * (0.4 + u);
      x += Math.cos(th) * ds; y += Math.sin(th) * ds;
      pts.push([x, y]);
    }
    return pts;
  }
  function tgtArm(R, D0, E, De, arcR, arcD) {
    var dist = Math.hypot(E[0] - R[0], E[1] - R[1]), l = dist * 0.42, dense = [];
    var c1 = [R[0] + D0[0] * l, R[1] + D0[1] * l], c2 = [E[0] - De[0] * l, E[1] - De[1] * l];
    for (var i = 0; i <= 24; i++) dense.push(bez3(R, c1, c2, E, i / 24));
    var th = Math.atan2(De[1], De[0]), x = E[0], y = E[1], n = 14, stp = arcR * Math.abs(arcD) / n;
    for (i = 0; i < n; i++) { th += arcD / n / 2; x += Math.cos(th) * stp; y += Math.sin(th) * stp; th += arcD / n / 2; dense.push([x, y]); }
    var cum = [0];
    for (i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    var Lt = cum[cum.length - 1], out = [], j = 0;
    for (var k = 0; k < NP; k++) {
      var s = Lt * k / (NP - 1);
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      var f = clamp((s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]));
      out.push(lerp2(dense[j], dense[j + 1], f));
    }
    return out;
  }
  function blendPts(a, b, w) { if (w <= 0) return a; if (w >= 1) return b; return a.map(function (p, i) { return lerp2(p, b[i], w); }); }
  function armShape(c) {
    var N = c.length, L = [], Rr = [], nr = [], hw = [], tg = [];
    for (var k = 0; k < N; k++) {
      var A = c[Math.max(0, k - 1)], B = c[Math.min(N - 1, k + 1)], dx = B[0] - A[0], dy = B[1] - A[1], m = Math.hypot(dx, dy) || 1;
      tg.push([dx / m, dy / m]); nr.push([-dy / m, dx / m]);
      var u = k / (N - 1), w = K * lerp(5.6, 0.9, Math.pow(u, 0.85));
      hw.push(w);
      L.push([c[k][0] + nr[k][0] * w, c[k][1] + nr[k][1] * w]);
      Rr.push([c[k][0] - nr[k][0] * w, c[k][1] - nr[k][1] * w]);
    }
    var tip = c[N - 1], te = tg[N - 1];
    var outline = smoothD(L.concat([[tip[0] + te[0] * 1.3, tip[1] + te[1] * 1.3]], Rr.reverse()), true);
    var sk = '';
    [7, 9, 11, 13, 15].forEach(function (k) {
      var t0 = tg[k - 1], t1 = tg[k + 1], cr = t0[0] * t1[1] - t0[1] * t1[0], sg = cr >= 0 ? 1 : -1;
      var r = hw[k] * 0.48;
      if (r < 0.7) return;
      var p = [c[k][0] + nr[k][0] * sg * hw[k] * 0.38, c[k][1] + nr[k][1] * sg * hw[k] * 0.38];
      sk += circleD(p[0], p[1], r);
    });
    return { d: outline, s: sk };
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-octopus-' + (++uid) + '-';
    var L = layout(opts), PL = plan(L), T = L.target;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var clip = {};
    ['wv', 'an', 'ink'].forEach(function (k) {
      var c = el('clipPath', { id: id + k, clipPathUnits: 'userSpaceOnUse' }, defs);
      clip[k] = el('path', { d: '', 'clip-rule': 'evenodd' }, c);
    });
    var tc = el('clipPath', { id: id + 'tbl', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28 }, tc);

    // ---- octopus geometry (world space); fill / color inherit from <use> ----
    var oct = el('g', { id: id + 'oct' }, defs);
    var arms = [];
    for (var i = 0; i < 8; i++) arms.push(null);
    ORDER.forEach(function (ai) {
      var g = el('g', {}, oct);
      arms[ai] = {
        p: el('path', { stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g),
        s: el('path', { fill: SUCK, stroke: INK, 'stroke-width': 0.8, 'stroke-opacity': 0.55 }, g)
      };
    });
    var hgA = el('g', {}, oct);
    var sd = PL.d;
    el('path', { d: 'M-21 13C-27.5 1-27.5-18-16-27C-8-33.5 8-33.5 16-27C27.5-18 27.5 1 21 13C15 20.5-15 20.5-21 13Z', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, hgA);
    el('path', { d: circleD(-13, -19, 3.2) + circleD(-4, -25.5, 2.2) + circleD(9, -22, 2.8) + circleD(17, -11, 2) + circleD(-19, -7, 2.1) + circleD(3, -16, 1.5) + circleD(19, 3, 1.6) + circleD(-20, 5, 1.4), fill: INK, 'fill-opacity': 0.15 }, hgA);
    el('ellipse', { cx: -10, cy: -21, rx: 7, ry: 3.6, fill: '#FFFFFF', 'fill-opacity': 0.3, transform: 'rotate(-35 -10 -21)' }, hgA);
    var chroma = el('path', { fill: opts.dealerColor, stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 0.7 }, oct);
    var hgB = el('g', {}, oct);
    var eyes = [-1, 1].map(function (side) {
      var g = el('g', {}, hgB);
      return {
        side: side, g: g,
        white: el('ellipse', { rx: 8.6, ry: 10, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.2 }, g),
        pup: el('circle', { r: 4.4, fill: INK }, g),
        gl1: el('circle', { r: 1.6, fill: '#FFFFFF' }, g),
        gl2: el('circle', { r: 0.9, fill: '#FFFFFF' }, g),
        lid: el('path', { stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, g),
        lash: el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g)
      };
    });
    var mouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, hgB);

    // ---- scene ----
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
      return g;
    }

    var rowsG = [], chipsG = [], victim = {};
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
        var wrap = el('g', {}, chipLayer);
        var sh = el('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        if (c.target) {
          var cg1 = el('g', {}, wrap); makeChip(cg1, c.color, c.ini);
          var w2 = el('g', { 'clip-path': 'url(#' + id + 'ink)' }, wrap);
          var cg2 = el('g', {}, w2); makeChip(cg2, opts.dealerColor, L.ini(opts.dealer));
          var gloss = el('ellipse', { rx: 9, ry: 4, fill: '#FFFFFF', opacity: 0 }, wrap);
          var splat = el('path', { fill: opts.dealerColor, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round', opacity: 0 }, wrap);
          var splatHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, wrap);
          victim = { wrap: wrap, sh: sh, gs: [cg1, cg2], c: c, splat: splat, splatHi: splatHi, gloss: gloss };
        } else {
          var cg = el('g', {}, wrap); makeChip(cg, c.color, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });
    var drops = el('path', { fill: opts.dealerColor, stroke: INK, 'stroke-width': 1.3, opacity: 0 }, cam);
    var ripple = el('circle', { fill: 'none', stroke: opts.dealerColor, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var octLayer = el('g', {}, cam);
    function use(parent, fill, extra) {
      var u = el('use', Object.assign({ href: '#' + id + 'oct', fill: fill, color: fill }, extra || {}), parent);
      u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id + 'oct');
      return u;
    }
    use(octLayer, INK, { opacity: 0.2, transform: 'translate(2.5,4)' });
    use(octLayer, OCTO);
    use(el('g', { 'clip-path': 'url(#' + id + 'wv)' }, octLayer), opts.dealerColor);
    var shimG = el('g', { 'clip-path': 'url(#' + id + 'an)', opacity: 0 }, octLayer);
    use(shimG, '#FFFFFF');

    var fx = el('g', {}, cam);
    var puff = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var blobTr = el('path', { fill: opts.dealerColor, stroke: INK, 'stroke-width': 1.2, opacity: 0 }, fx);
    var blob = el('ellipse', { rx: 8, ry: 5.8, fill: opts.dealerColor, stroke: INK, 'stroke-width': 1.8, opacity: 0 }, fx);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // look targets
    var nearUp = null, nearDown = null, sameRow = null;
    L.others.forEach(function (c) {
      var dd = Math.abs(c.x - T.x) + Math.abs(c.y - T.y) * 0.6;
      if (c.row === T.row) { if (!sameRow || dd < sameRow.d) sameRow = { c: c, d: dd }; }
      else if (c.y < T.y) { if (!nearUp || dd < nearUp.d) nearUp = { c: c, d: dd }; }
      else if (!nearDown || dd < nearDown.d) nearDown = { c: c, d: dd };
    });
    function pt(o, fx_, fy_) { return o ? { p: [o.c.x, o.c.y] } : { p: [fx_, fy_] }; }
    var up = pt(nearUp, PL.xe + PL.d * 120, 40), down = pt(nearDown, PL.xe + PL.d * 120, 560);
    var tg = { p: [T.x, T.y - 6] }, armSpec = { p: [PL.hug[0] - PL.d * 66, PL.hug[1] + 8] };
    var looks = [[0, 'cam'], [1380, up, 150], [1530, down, 170], [1660, tg, 80], [2280, 'fwd', 160], [2650, tg, 150],
      [3340, 'cam', 160], [4420, armSpec, 150], [4580, 'cam', 140], [4720, tg, 120], [5640, 'cam', 140], [5880, tg, 140],
      [6330, 'cam', 160], [6720, 'fwd', 180]];

    // chromatophore spots: head-local positions + arm-relative
    var chromaHead = [[-12, -24, 2.6, 1.3], [2, -28, 2.2, 2.1], [13, -21, 2.6, 0.4], [20, -9, 2.1, 2.9], [-21, -12, 2.3, 4.1],
      [-6, -15, 1.8, 5.2], [8, -12, 1.8, 3.3], [-17, 6, 1.7, 0.9], [18, 8, 1.7, 6.0], [0, -20, 1.5, 2.6]];

    return {
      opts: opts, L: L, P: PL, svg: svg, cam: cam, clip: clip, arms: arms, hgA: hgA, hgB: hgB,
      chroma: chroma, eyes: eyes, mouth: mouth, rowsG: rowsG, chipsG: chipsG, victim: victim, drops: drops, ripple: ripple, dust: dust,
      octLayer: octLayer, shimG: shimG, puff: puff, blob: blob, blobTr: blobTr, line: line, looks: looks, chromaHead: chromaHead, id: id, sd: sd
    };
  }

  // ---------- expressions ----------
  function lidAt(t) {
    return kf([[0, -0.3], [1640, -0.3], [1690, -0.8], [1900, -0.8], [2100, -0.35],
      [2400, -0.35], [2450, 1.05], [2490, 1.05], [2560, -0.35],
      [3000, -0.35], [3080, 1.05], [3260, 1.05], [3340, -0.3],
      [3410, -0.3], [3490, 1.05], [3850, 1.05], [3900, -0.85], [4150, -0.7], [4450, -0.3],
      [4700, -0.3], [4900, -0.55], [4990, -0.55], [5030, 1.05], [5080, 1.05], [5160, -0.45], [5600, -0.3],
      [5690, -0.3], [5730, 1.05], [5760, 1.05], [5810, -0.3],
      [5920, -0.3], [6020, 0.1], [6250, 0.1], [6320, -0.3],
      [6380, -0.3], [6480, 1.05], [6620, 1.05], [6730, -0.3]], t);
  }
  function happyAt(t) { return (t > 2990 && t < 3350) || (t > 6370 && t < 6740); }
  function squeezeAt(t) { return t > 3470 && t < 3870; }
  function eyeScaleAt(t) { return 1 + spring(t - 1660, 0.14, 4.5, 110) + 0.12 * eo(seg(t, 3860, 3920)) * (1 - eio(seg(t, 4100, 4400))) + 0.06 * eio(seg(t, 4750, 4950)) * (1 - seg(t, 5000, 5030)); }
  function dilAt(t) { return 1 + 0.28 * eo(seg(t, 1660, 1760)) * (1 - eio(seg(t, 2300, 2600))) + 0.2 * eo(seg(t, 2650, 2800)) * (1 - eio(seg(t, 3000, 3050))) + 0.18 * eo(seg(t, 3880, 4000)) * (1 - eio(seg(t, 4300, 4500))); }
  function smileAt(t) {
    return kf([[0, 0.5], [1640, 0.5], [2200, 0.5], [2700, 0.7], [2950, 1], [3380, 1], [3460, -0.15], [3850, -0.15], [3950, 1], [4600, 1],
      [5100, 0.3], [5600, 0.3], [5700, 0.75], [5900, 0.75], [6000, 0.25], [6300, 0.25], [6400, 1]], t);
  }
  function ohAt(t) { return (t > 1665 && t < 1930) || (t > 3870 && t < 4060) || (t > 4720 && t < 5040); }

  function specVec(spec, E, Fw) {
    if (spec === 'cam') return [0, 0];
    if (spec === 'fwd') return [Fw[0], Fw[1]];
    var dx = spec.p[0] - E[0], dy = spec.p[1] - E[1], m = Math.hypot(dx, dy) || 1;
    return [dx / m, dy / m];
  }
  function lookVec(list, t, E, Fw) {
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    var cur = list[k], b = specVec(cur[1], E, Fw);
    if (k === 0) return b;
    var a = specVec(list[k - 1][1], E, Fw), p = clamp((t - cur[0]) / (cur[2] || 120));
    if (p >= 1) return b;
    var q = backOut(p, 1.3), x = lerp(a[0], b[0], q), y = lerp(a[1], b[1], q), m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return [x, y];
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var PL = S.P, L = S.L, T = L.target, d = PL.d, opts = S.opts;

    // camera: gentle push-in that keeps the whole row + neighbours in frame
    var zk = eioC(seg(t, 700, 1500)) * (1 - eioC(seg(t, 6750, 7400)));
    var Z = lerp(1, ZMAX, zk), half = W / (2 * ZMAX);
    var cxT = d === 1 ? 8 + half : W - 8 - half;
    var ccx = lerp(W / 2, cxT, zk), ccy = lerp(H / 2, 291, zk);
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1680, 1950)) * (1 - eio(seg(t, 6450, 6900)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // victim chip
    var V = S.victim, sc = chipPop(T), dx = 0, oy = chipOff(t);
    if (t > 1660 && t < 1930) { var q = seg(t, 1660, 1930); dx = 2 * Math.sin((t - 1660) * 0.16) * (1 - q); sc *= 1 - 0.05 * Math.sin(Math.PI * q); }
    sc *= 1 - 0.05 * bump(t, 2950, 3150);                        // hugged
    sc *= 1 + spring(t - 5120, -0.09, 4.5, 110);                  // splat impact
    var pat = t - 6250; if (pat >= 0 && pat < 900) sc *= 1 - 0.08 * Math.exp(-pat / 120) * Math.cos(2 * Math.PI * 4.5 * pat / 1000);
    var C = [T.x + dx, T.y + oy];
    var tr = 'translate(' + f1(C[0]) + ',' + f1(C[1]) + ') scale(' + sc.toFixed(4) + ')';
    V.gs.forEach(function (g) { g.setAttribute('transform', tr); });
    V.sh.setAttribute('r', f1(CR * Math.min(sc, 1.04)));
    V.sh.setAttribute('cx', f1(C[0] + 1.5)); V.sh.setAttribute('cy', f1(C[1] + 3.5));

    // ink splat on chip
    var I = [T.x - 2, T.y - 10 - 2];
    var g1 = eoC(seg(t, 5120, 5300));
    S.clip.ink.setAttribute('d', t < 5120 ? '' : (t > 5400 ? circleD(C[0], C[1], CR * 3) : blobD(I[0], I[1], CR * 1.55 * g1 + 0.1, 0.7)));
    var ro, so;
    if (t < 5120) { ro = 0; so = 0; }
    else if (t < 5300) { ro = CR * 1.32 * g1; so = 1; }
    else { var r2 = eio(seg(t, 5300, 5640)); ro = lerp(CR * 1.32, CR * 0.92, r2); so = 1 - eio(seg(t, 5340, 5650)); }
    if (so > 0.005 && ro > 0.5) {
      V.splat.setAttribute('d', blobD(I[0], I[1], ro, 0.7)); V.splat.setAttribute('opacity', f1(so * 100) / 100);
      V.splatHi.setAttribute('d', 'M' + P([I[0] - ro * 0.55, I[1] - ro * 0.25]) + 'Q' + P([I[0] - ro * 0.5, I[1] - ro * 0.6]) + ' ' + P([I[0] - ro * 0.15, I[1] - ro * 0.68]));
      V.splatHi.setAttribute('opacity', f1(so * 100) / 100);
    } else { V.splat.setAttribute('opacity', 0); V.splatHi.setAttribute('opacity', 0); }
    var gl = bump(t, 5450, 6100);
    V.gloss.setAttribute('cx', f1(C[0] + 4)); V.gloss.setAttribute('cy', f1(C[1] - 11)); V.gloss.setAttribute('opacity', f1(gl * 40) / 100);
    V.gloss.setAttribute('transform', 'rotate(-20 ' + f1(C[0] + 4) + ' ' + f1(C[1] - 11) + ')');
    // droplets
    var dp = seg(t, 5120, 5330);
    if (t > 5120 && t < 5750) {
      var dd = '', fade = 1 - seg(t, 5450, 5750);
      [[-2.6, 37], [-1.5, 33], [-0.4, 40], [0.9, 35], [2.1, 39], [2.9, 31]].forEach(function (a, k) {
        var rr = lerp(14, a[1], eoC(dp)), r = lerp(3.4, 1.7 + (k % 2) * 0.6, eoC(dp)) * (0.4 + 0.6 * fade);
        dd += circleD(I[0] + Math.cos(a[0]) * rr, I[1] + Math.sin(a[0]) * rr, r);
      });
      S.drops.setAttribute('d', dd); S.drops.setAttribute('opacity', f1(fade * 100) / 100);
    } else S.drops.setAttribute('opacity', 0);

    // set-down ring + dust
    var rp = seg(t, 6250, 6750);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dsp = seg(t, 6250, 6530);
    if (dsp > 0 && dsp < 1) {
      var dst = '', r0 = 27 + 9 * eoC(dsp), r1b = r0 + 6 * (1 - dsp);
      [-2.5, -1.9, -0.65, -0.05, 0.6, 2.2, 2.75].forEach(function (a) {
        dst += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', dst); S.dust.setAttribute('opacity', f1((1 - dsp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- octopus ----
    var X = headXf(PL, t);
    S.hgA.setAttribute('transform', X.str); S.hgB.setAttribute('transform', X.str);
    S.octLayer.setAttribute('clip-path', (t < 2700 || t > 6700) ? 'url(#' + S.id + 'tbl)' : 'none');

    // velocity for trailing
    var pa = headPos(PL, t - 20), pb = headPos(PL, t + 20), vx = (pb[0] - pa[0]) / 40, vy = (pb[1] - pa[1]) / 40, spd = Math.hypot(vx, vy);
    var trail = Math.atan2(-vy, -vx), tk = clamp(spd / 0.3) * 1.1;
    var slith = seg(t, 1950, 2150) * (1 - seg(t, 2700, 2900)) + seg(t, 6700, 6850);
    var ph = 2 * Math.PI * (0.7 * t + 1.6 * clamp(t - 1950, 0, 950) + 1.6 * clamp(t - 6700, 0, 800)) / 1000;
    var calm = seg(t, 2800, 3100) * (1 - seg(t, 6650, 6750));
    var sq2 = eio(seg(t, 4700, 4900)) * (1 - eio(seg(t, 5450, 5850)));
    var prm = { curl: lerp(1, 0.55, slith) + 0.25 * calm + 0.9 * sq2, A: lerp(0.35, 1.05, slith) - 0.12 * calm, ph: ph, trail: trail, tk: tk };

    var wW = eio(seg(t, 2760, 3060)) * (1 - eio(seg(t, 4700, 4930)));
    var wG = eo(seg(t, 650, 900)) * (1 - eio(seg(t, 1980, 2250)));
    var tidyArm = d === 1 ? 4 : 3, tside = d === 1 ? 1 : -1;
    var wT = eio(seg(t, 5860, 6000)) * (1 - eio(seg(t, 6330, 6520)));
    var wrapDef = { 3: [-150, -1, 85, CR + 1.5], 2: [-172, -1, 92, CR + 5.5], 4: [-30, 1, 85, CR + 1.5], 5: [-8, 1, 92, CR + 5.5] };
    var armPts = [];
    for (var i = 0; i < 8; i++) {
      var a = SPREAD[i];
      var R = X.w(Math.sin(a) * 12, 9 + Math.cos(a) * 5);
      var dv = X.dir(Math.sin(a), Math.cos(a)), th0 = Math.atan2(dv[1], dv[0]) + (a < 0 ? 1 : -1) * 0.75 * sq2 * (Math.abs(a) < 1.2 ? 1 : 0.5);
      var pts = freeArm(i, R, th0, ALEN[i] * K, prm);
      if ((i === 0 || i === 7) && wG > 0) {
        var top = R[1] < PL.by ? 1 : -1;
        var E = [PL.xe + d * 12, PL.by - top * 29 * K];
        pts = blendPts(pts, tgtArm(R, dv, E, [d, 0.15 * -top], 7, d * top * 3.6), wG);
      }
      if (wrapDef[i] && wW > 0) {
        var wd = wrapDef[i], phi = wd[0] * DEG, rr = wd[3], sg = wd[1];
        var Ew = [C[0] + Math.cos(phi) * rr, C[1] + Math.sin(phi) * rr];
        var De = sg < 0 ? [Math.sin(phi), -Math.cos(phi)] : [-Math.sin(phi), Math.cos(phi)];
        var span = wd[2] * DEG * (1 + 0.04 * Math.sin(t / 1000 * 2 * Math.PI * 0.9));
        pts = blendPts(pts, tgtArm(R, dv, Ew, De, rr, sg * span), wW);
      }
      if (i === tidyArm && wT > 0) {
        var pt = (-90 + tside * 34) * DEG, Et = [C[0] + Math.cos(pt) * (CR - 2), C[1] + Math.sin(pt) * (CR - 2)];
        var Dt = [tside * 0.35, 1], m = Math.hypot(Dt[0], Dt[1]); Dt = [Dt[0] / m, Dt[1] / m];
        var lift = bump(t, 6150, 6250) * 4;
        Et[1] -= lift;
        pts = blendPts(pts, tgtArm(R, dv, Et, Dt, 7, -tside * 2.2), wT);
      }
      armPts.push(pts);
      var sh = armShape(pts);
      S.arms[i].p.setAttribute('d', sh.d); S.arms[i].s.setAttribute('d', sh.s);
    }

    // colour wave from the head centre at the hug
    var o = PL.hug, pw = seg(t, 3850, 4420), rw = pw >= 1 ? 3000 : 120 * eio(pw);
    S.clip.wv.setAttribute('d', rw > 0.2 ? circleD(o[0], o[1], rw) : '');
    S.clip.an.setAttribute('d', rw > 1 && rw < 200 ? circleD(o[0], o[1], rw) + circleD(o[0], o[1], Math.max(0.1, rw - 8)) : '');
    S.shimG.setAttribute('opacity', f1(Math.sin(Math.PI * pw) * 60) / 100);

    // chromatophores flicker on ahead of the wave
    var env = eo(seg(t, 3420, 3620)) * (1 - seg(t, 4400, 4450));
    if (env > 0.01) {
      var cd = '';
      function dot(p, r0, phs) {
        if (rw > 0.2 && Math.hypot(p[0] - o[0], p[1] - o[1]) < rw - 2) return;
        var fl = 0.5 + 0.5 * Math.sin(t * 0.045 + phs * 2.3) * Math.sin(t * 0.017 + phs);
        var r = r0 * env * (0.25 + 0.95 * clamp(fl * 1.3));
        if (r > 0.4) cd += circleD(p[0], p[1], r);
      }
      S.chromaHead.forEach(function (c) { dot(X.w(c[0], c[1]), c[2], c[3]); });
      armPts.forEach(function (pp, k) { dot(pp[5], 1.9, k * 1.7); dot(pp[9], 1.5, k * 2.9 + 1); });
      S.chroma.setAttribute('d', cd);
    } else S.chroma.setAttribute('d', '');

    // eyes
    var Fw = X.dir(0, -1), lid = lidAt(t), es = eyeScaleAt(t), dil = dilAt(t), hap = happyAt(t), sq = squeezeAt(t);
    S.eyes.forEach(function (E, k) {
      var ex = E.side * 10, ey = -2;
      E.g.setAttribute('transform', 'translate(' + ex + ' ' + ey + ') scale(' + es.toFixed(3) + ')');
      var lw = X.w(ex, ey), list = S.looks, tt = t - (k ? 30 : 0);
      var v = lookVec(list, tt, lw, Fw);
      var lv = [v[0] * X.c + v[1] * X.s, -v[0] * X.s + v[1] * X.c];
      var pr = 4.4 * dil, px = lv[0] * 3.3, py = lv[1] * 3.6;
      E.pup.setAttribute('cx', f1(px)); E.pup.setAttribute('cy', f1(py)); E.pup.setAttribute('r', f1(pr));
      E.gl1.setAttribute('cx', f1(px - 1.6)); E.gl1.setAttribute('cy', f1(py - 1.8)); E.gl1.setAttribute('r', f1(1.4 + 0.5 * (dil - 1) * 3));
      E.gl2.setAttribute('cx', f1(px + 1.7)); E.gl2.setAttribute('cy', f1(py + 1.5));
      var rx = 8.6, ry = 10, Ly = clamp(lid, -1, 1.05) * ry;
      if (Ly <= -ry + 0.1) { E.lid.setAttribute('d', ''); E.lash.setAttribute('d', ''); }
      else if (Ly >= ry - 0.1) {
        E.lid.setAttribute('d', 'M' + (-rx - 0.4) + ' 0a' + (rx + 0.4) + ' ' + (ry + 0.4) + ' 0 1 0 ' + (2 * rx + 0.8) + ' 0a' + (rx + 0.4) + ' ' + (ry + 0.4) + ' 0 1 0 ' + (-2 * rx - 0.8) + ' 0Z');
        var cv = hap ? -8 : (sq ? 0 : 5);
        E.lash.setAttribute('d', sq ? (E.side < 0 ? 'M-5 -3.5L3 1L-5 4.5' : 'M5 -3.5L-3 1L5 4.5') : 'M-6.2 1Q0 ' + (1 + cv) + ' 6.2 1');
      } else {
        var xw = rx * Math.sqrt(1 - (Ly / ry) * (Ly / ry));
        E.lid.setAttribute('d', 'M' + f1(-xw) + ' ' + f1(Ly) + 'A' + rx + ' ' + ry + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(xw) + ' ' + f1(Ly) + 'Q0 ' + f1(Ly + 2.4) + ' ' + f1(-xw) + ' ' + f1(Ly) + 'Z');
        E.lash.setAttribute('d', '');
      }
    });
    if (ohAt(t)) { var ob = t > 4720 && t < 5040 ? 1.25 : 1; S.mouth.setAttribute('d', 'M0 ' + f1(12.4 - 2.8 * ob) + 'a' + f1(2.4 * ob) + ' ' + f1(2.8 * ob) + ' 0 1 0 0.01 0Z'); }
    else { var m = smileAt(t); S.mouth.setAttribute('d', 'M-4.8 11.5Q0 ' + f1(11.5 + 5 * m) + ' 4.8 11.5'); }

    // squirt: blob flight + puff
    var X5 = headXf(PL, 5000);
    var Sw = X5.w(0, 13), Sd = X5.dir(0, 1);
    var Ctl = [lerp(Sw[0], I[0], 0.5) + d * 16, lerp(Sw[1], I[1], 0.5) - 6];
    var fq = seg(t, 5000, 5120);
    var mo = X.w(0, 13);
    if (fq > 0 && fq < 1) {
      var qq = eo(fq) * 0.85 + fq * 0.15;
      function qb(u) { var w1 = 1 - u; return [w1 * w1 * Sw[0] + 2 * w1 * u * Ctl[0] + u * u * I[0], w1 * w1 * Sw[1] + 2 * w1 * u * Ctl[1] + u * u * I[1]]; }
      var bp = qb(qq), bp2 = qb(Math.min(1, qq + 0.02)), ang = Math.atan2(bp2[1] - bp[1], bp2[0] - bp[0]) / DEG;
      S.blob.setAttribute('cx', f1(bp[0])); S.blob.setAttribute('cy', f1(bp[1]));
      S.blob.setAttribute('transform', 'rotate(' + f1(ang) + ' ' + f1(bp[0]) + ' ' + f1(bp[1]) + ')'); S.blob.setAttribute('opacity', 1);
      var t1 = qb(Math.max(0, qq - 0.2)), t2 = qb(Math.max(0, qq - 0.38));
      S.blobTr.setAttribute('d', circleD(t1[0], t1[1], 3.4) + circleD(t2[0], t2[1], 2.2)); S.blobTr.setAttribute('opacity', 1);
    } else { S.blob.setAttribute('opacity', 0); S.blobTr.setAttribute('opacity', 0); }
    var pf = seg(t, 5000, 5180);
    if (pf > 0 && pf < 1) {
      var base = mo, pdd = '';
      [-1.25, -0.75, 0.75, 1.25].forEach(function (aa) {
        var a2 = Math.atan2(Sd[1], Sd[0]) + aa;
        var r0 = 6 + 8 * eoC(pf), r1 = r0 + 5 * (1 - pf);
        pdd += 'M' + P([base[0] + Math.cos(a2) * r0, base[1] + Math.sin(a2) * r0]) + 'L' + P([base[0] + Math.cos(a2) * r1, base[1] + Math.sin(a2) * r1]);
      });
      S.puff.setAttribute('d', pdd); S.puff.setAttribute('opacity', f1((1 - pf) * 80) / 100);
    } else S.puff.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7500, 7950);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2octopus;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2octopus = S;
    return S;
  }

  window.CCSteal2_octopus = {
    title: 'The Octopus',
    blurb: 'An octopus peeks over the table edge, slithers over to hug Nate’s chip like treasure, flushes Nick’s colour across its skin, then politely squirts Nick-coloured ink onto the chip and tidies it back into place.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2octopus = S;
      var token = {};
      root.__cc2octopusToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2octopusToken !== token) { resolve(); return; }
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
