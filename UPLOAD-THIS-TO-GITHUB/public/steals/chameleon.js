/* Closed Caption steal film: chameleon (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE CHAMELEON
 *
 * Storyboard (ms) - top-down view of a felt table, caption rows 1/2/3/CC.
 *   0- 700  Table deals in: rows drop in with a soft overshoot, chips pop on.
 *  200-1500 A lime chameleon rocks onto the felt from the nearest edge, walking
 *           the gap under the victim's row: surge-pause gait, planted feet,
 *           body undulation, curly tail bouncing.
 * 1500-2650 SIZING UP. It stops (tail follow-through). Eyes swivel
 *           independently: one to a chip above, the other to a chip below,
 *           then both spin opposite ways... one snaps to Nate's chip, the
 *           other catches up a beat late. Head turns, Nate's chip shivers,
 *           every other chip dims. Lids narrow. Deadpan.
 * 2500-3400 Anticipation crouch, then it scrambles up onto the chip and runs
 *           the rim, curling round it (landing squash, chip presses down).
 * 3350-4000 Camouflage gag: it turns Nate's blue from the head outwards and
 *           all but vanishes into the chip. Stares at camera.
 * 4000-4400 Effort: lids squeeze shut, body swells and trembles, tail winds tight.
 * 4400-5000 Release: a pink ripple sweeps out from its head across its body
 *           AND the chip - "Na" becomes "Ni" under the wavefront.
 * 5000-5400 Beat: it admires the chip, lids settle back to half-mast.
 * 5400-6300 It unwinds off the rim. The chip lifts... and plonks back down in
 *           exactly its spot (squash, settle, pink ring + dust ticks).
 * 6000-6450 Looks back with one eye, at you with the other: slow blink.
 * 6400-7300 Ambles off the way it came.
 * 7300-7600 Stillness.
 * 7600-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', FELT = '#2B6A53', CHAM = '#B6D236';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, RING = 32, K = 1.3;
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
  function eS(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function f1(v) { return Math.round(v * 10) / 10; }
  // keyframes [[t, v], ...] eased between keys
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
    var same = d && v && Array.from(d)[0].toUpperCase() === Array.from(v)[0].toUpperCase();
    return function (name) {
      name = name || '?';
      if (same && (name === d || name === v)) return Array.from(name).slice(0, 2).join("");
      return Array.from(name)[0].toUpperCase();
    };
  }

  // ---------- path (arc-length parameterised polyline) ----------
  function makePath(start) {
    var pts = [start.slice()], marks = {};
    var api = {
      line: function (b) {
        var a = pts[pts.length - 1], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
        for (var i = 1; i <= n; i++) pts.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]);
        return api;
      },
      bez: function (c1, c2, b) {
        var a = pts[pts.length - 1];
        for (var i = 1; i <= 240; i++) {
          var t = i / 240, u = 1 - t;
          pts.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
                    u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]);
        }
        return api;
      },
      arc: function (cx, cy, r, a0, a1) {
        var n = Math.ceil(Math.abs(a1 - a0) * r * 2);
        for (var i = 1; i <= n; i++) { var a = lerp(a0, a1, i / n); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
        return api;
      },
      mark: function (name) { marks[name] = pts.length - 1; return api; },
      build: function () {
        var cum = [0];
        for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        var L = cum[cum.length - 1], ds = 0.5, N = Math.floor(L / ds) + 1, X = new Float64Array(N), Y = new Float64Array(N), j = 0;
        for (var k = 0; k < N; k++) {
          var s = k * ds;
          while (j < cum.length - 2 && cum[j + 1] < s) j++;
          var f = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]);
          X[k] = lerp(pts[j][0], pts[j + 1][0], clamp(f)); Y[k] = lerp(pts[j][1], pts[j + 1][1], clamp(f));
        }
        var TX = new Float64Array(N), TY = new Float64Array(N);
        for (k = 0; k < N; k++) {
          var a = Math.max(0, k - 3), b = Math.min(N - 1, k + 3), dx = X[b] - X[a], dy = Y[b] - Y[a], m = Math.hypot(dx, dy) || 1;
          TX[k] = dx / m; TY[k] = dy / m;
        }
        var ms = {};
        for (var key in marks) ms[key] = cum[marks[key]];
        var Lr = (N - 1) * ds;
        function at(s) {
          if (s <= 0) return { x: X[0] + TX[0] * s, y: Y[0] + TY[0] * s, tx: TX[0], ty: TY[0] };
          if (s >= Lr) return { x: X[N - 1] + TX[N - 1] * (s - Lr), y: Y[N - 1] + TY[N - 1] * (s - Lr), tx: TX[N - 1], ty: TY[N - 1] };
          var q = s / ds, i = Math.floor(q), f = q - i;
          var tx = lerp(TX[i], TX[i + 1], f), ty = lerp(TY[i], TY[i + 1], f), m = Math.hypot(tx, ty) || 1;
          return { x: lerp(X[i], X[i + 1], f), y: lerp(Y[i], Y[i + 1], f), tx: tx / m, ty: ty / m };
        }
        return { at: at, L: Lr, marks: ms };
      }
    };
    return api;
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
    if (!target) { // fallback: first chip
      for (var r = 0; r < rows.length && !target; r++) if (rows[r].chips.length) { target = rows[r].chips[0]; target.target = true; others.splice(others.indexOf(target), 1); }
    }
    var trow = rows[target.row];
    return { rows: rows, target: target, others: others, bandY: trow.y + h + g / 2, h: h, g: g, ini: ini };
  }

  // ---------- choreography ----------
  var S_STRIDE = 60;
  function plan(L) {
    var T = L.target, sx = T.x > W / 2 ? -1 : 1, sy = (L.rows.length > 1 && T.row === L.rows.length - 1) ? -1 : 1;
    function mx(x) { return sx === 1 ? x : W - x; }
    var cx = mx(T.x), cy = T.y, by = L.bandY, R = RING;
    var p = makePath([-70, by])
      .line([cx - 42, by]).mark('stop1')
      .bez([cx - 18, by], [cx - R, cy + 24], [cx - R, cy]).mark('ring')
      .arc(cx, cy, R, Math.PI, Math.PI * 2.5).mark('bottom')
      .bez([cx - 28, cy + R], [cx - 58, by], [cx - 92, by]).mark('bez2')
      .line([-420, by]).build();
    var m = p.marks;
    var s = {
      stop1: m.stop1, curl: m.ring + R * (Math.PI * 222 / 180), bottom: m.bottom,
      band: m.bez2 + 15
    };
    s.end = s.band + (cx - 107) + 215;
    return { path: p, s: s, sx: sx, sy: sy, fy: function (y) { return sy === 1 ? y : 2 * cy - y; }, mx: mx, cx: cx, cy: cy, by: by };
  }

  function walkS(t, t0, t1, s0, s1, easeFn) {
    var p = seg(t, t0, t1), D = s1 - s0;
    var n = Math.max(1, Math.round(D / (S_STRIDE / 2)));
    var env = Math.pow(Math.sin(Math.PI * p), 2);
    return s0 + D * easeFn(p) - (D / (6.5 * n)) * Math.sin(2 * Math.PI * n * p) * env;
  }
  function easeInWalk(p) { return p < .35 ? (p * p) / .7 : (p - .175); } // accelerate, then constant
  function sHeadAt(P, t) {
    var s = P.s;
    if (t < 1500) return walkS(t, 200, 1500, 0, s.stop1, eS);
    if (t < 2500) return s.stop1;
    if (t < 2650) return s.stop1 - 5 * eo(seg(t, 2500, 2650));
    if (t < 3150) return lerp(s.stop1 - 5, s.curl, eioC(seg(t, 2650, 3150)));
    if (t < 5400) return s.curl + spring(t - 3150, 2.5, 3.5, 110);
    if (t < 5750) return lerp(s.curl, s.band, eio(seg(t, 5400, 5750)));
    if (t < 6400) return s.band;
    var q = seg(t, 6400, 7300);
    var e = function (x) { return easeInWalk(x) / easeInWalk(1); };
    return walkS(t, 6400, 7300, s.band, s.end, e);
  }
  function walkAmt(t) { // how "walky" (undulation)
    return clamp(seg(t, 200, 400) * (1 - seg(t, 1350, 1550))) + seg(t, 6400, 6600);
  }
  function tuckAt(t) { return eio(seg(t, 3000, 3300)) * (1 - eio(seg(t, 5400, 5650))); }
  function widthAt(t) {
    var w = 1;
    w += 0.1 * eo(seg(t, 2500, 2650)) * (1 - seg(t, 2650, 2760));         // crouch
    w -= 0.13 * Math.sin(Math.PI * seg(t, 2650, 3150));                     // stretch in the leap
    w += (t >= 3150 ? 0.14 * Math.exp(-(t - 3150) / 130) * Math.cos(2 * Math.PI * 4 * (t - 3150) / 1000) : 0); // land squash
    w += 0.13 * eio(seg(t, 4000, 4380)) * (1 - seg(t, 4400, 4401));      // effort swell
    w += t >= 4400 ? 0.13 * Math.exp(-(t - 4400) / 140) * Math.cos(2 * Math.PI * 4.5 * (t - 4400) / 1000) : 0;
    w += 0.03 * Math.sin(t / 1000 * 2 * Math.PI * 0.9) * seg(t, 3400, 3600) * (1 - seg(t, 3950, 4000)); // breathing
    return w;
  }
  function tailCurlAt(t, sH) {
    var k = 1 + 0.05 * Math.sin(2 * Math.PI * sH / S_STRIDE);
    k += spring(t - 1500, 0.22, 2.4, 220) + spring(t - 3150, 0.3, 2.6, 200) + spring(t - 5750, 0.18, 2.4, 200);
    k += 0.32 * eio(seg(t, 4000, 4380)) * (1 - seg(t, 4400, 4401));
    k += spring(t - 4400, -0.35, 2.2, 220);
    k -= 0.12 * Math.sin(Math.PI * seg(t, 2650, 3150));
    return k;
  }
  function yawAt(t, sH) {
    var y = 0.07 * Math.sin(2 * Math.PI * sH / S_STRIDE + 1) * (seg(t, 200, 400) * (1 - seg(t, 1400, 1550)) + seg(t, 6400, 6600));
    y += spring(t - 1500, 0.07, 2, 160);
    y += -0.32 * eoC(seg(t, 2220, 2380)) * (1 - eio(seg(t, 2650, 2900)));    // turns to Nate's chip
    y += -0.4 * tuckAt(t);                                                // rests head turned out
    y += -0.18 * eio(seg(t, 5950, 6150)) * (1 - eio(seg(t, 6400, 6600))); // glance back
    return y;
  }
  function trembleAt(t) {
    var a = eio(seg(t, 4050, 4380)) * (1 - seg(t, 4400, 4420));
    return [a * 0.9 * Math.sin(t * 0.21), a * 0.7 * Math.sin(t * 0.17 + 1.3)];
  }
  function lidAt(t) { // lid line offset in opening radii units: -1 open, 1 closed
    return kf([[0, -0.15], [2330, -0.15], [2480, 0.25], [2850, 0.25], [3000, -0.15],
      [3700, -0.15], [3850, 0.1], [4000, 0.1], [4070, 1.05], [4400, 1.05], [4440, -1], [4900, -1], [5150, -0.15],
      [6080, -0.15], [6260, 1.05], [6330, 1.05], [6520, -0.15]], t);
  }
  function eyeScaleAt(t) { return 1 + spring(t - 2230, 0.1, 5, 90) + 0.12 * eo(seg(t, 4400, 4460)) * (1 - eio(seg(t, 4800, 5100))); }

  // ---------- body geometry ----------
  var LF = 78, LT = 164, DU = 2;
  var WPROF = [[0, 15], [5, 19], [12, 22.5], [24, 24.5], [36, 21.5], [46, 15.5], [56, 10], [70, 7], [126, 2.6]];
  function wprof(u) {
    u /= K;
    for (var i = 1; i < WPROF.length; i++) if (u <= WPROF[i][0]) { var a = WPROF[i - 1], b = WPROF[i]; return K * lerp(a[1], b[1], eS((u - a[0]) / (b[0] - a[0]))); }
    return K * WPROF[WPROF.length - 1][1];
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-chameleon-' + (++uid) + '-';
    var L = layout(opts), P = plan(L), T = L.target;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var clip = {};
    ['w1', 'w2', 'a1', 'a2'].forEach(function (k) {
      var c = el('clipPath', { id: id + k, clipPathUnits: 'userSpaceOnUse' }, defs);
      clip[k] = el('path', { d: '', 'clip-rule': 'evenodd' }, c);
    });
    // chameleon geometry (world space). fill/color inherit from <use>.
    var cham = el('g', { id: id + 'cham' }, defs);
    var flipG = el('g', P.sy === -1 ? { transform: 'matrix(1 0 0 -1 0 ' + f1(2 * P.cy) + ')' } : {}, cham);
    var legs = [];
    for (var i = 0; i < 4; i++) {
      var lg = el('g', {}, flipG);
      legs.push({
        ink: el('path', { fill: 'none', stroke: INK, 'stroke-width': 9.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lg),
        col: el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 5.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lg),
        foot: el('path', { stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, lg)
      });
    }
    var body = el('path', { stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, flipG);
    var bands = el('path', { fill: 'none', stroke: INK, 'stroke-opacity': 0.16, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, flipG);
    var shine = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.28, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, flipG);
    var head = el('path', { stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, flipG);
    var headDet = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-opacity': 0.75 }, flipG);
    var nostr = el('path', { fill: INK }, flipG);
    var eyes = [0, 1].map(function () {
      var g = el('g', {}, cham);
      return {
        tur: el('circle', { r: 7, stroke: INK, 'stroke-width': 2.2 }, g),
        open: el('circle', { r: 4.4, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.5 }, g),
        pup: el('circle', { r: 3, fill: INK }, g),
        glint: el('circle', { r: 1, fill: '#FFFFFF' }, g),
        lid: el('path', { stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g)
      };
    });

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
          var tg = el('g', {}, wrap);
          var cg1 = el('g', {}, tg); makeChip(cg1, c.color, c.ini);
          var w2 = el('g', { 'clip-path': 'url(#' + id + 'w2)' }, tg);
          var cg2 = el('g', {}, w2); makeChip(cg2, opts.dealerColor, L.ini(opts.dealer));
          var a2 = el('g', { 'clip-path': 'url(#' + id + 'a2)' }, tg);
          var cg3 = el('g', {}, a2); el('circle', { r: CR, fill: '#FFFFFF' }, cg3);
          victim = { wrap: wrap, sh: sh, gs: [cg1, cg2, cg3], shimmer: a2, c: c };
        } else {
          var cg = el('g', {}, wrap); makeChip(cg, c.color, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });
    var ripple = el('circle', { fill: 'none', stroke: opts.dealerColor, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var chamLayer = el('g', {}, cam);
    function use(parent, fill, extra) {
      var u = el('use', Object.assign({ href: '#' + id + 'cham', fill: fill, color: fill }, extra || {}), parent);
      u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id + 'cham');
      return u;
    }
    var uses = [];
    uses.push(use(chamLayer, INK, { opacity: 0.2, 'data-shadow': 1 }));
    uses.push(use(chamLayer, CHAM));
    uses.push(use(el('g', { 'clip-path': 'url(#' + id + 'w1)' }, chamLayer), opts.victimColor));
    uses.push(use(el('g', { 'clip-path': 'url(#' + id + 'w2)' }, chamLayer), opts.dealerColor));
    var sh1g = el('g', { 'clip-path': 'url(#' + id + 'a1)' }, chamLayer), sh2g = el('g', { 'clip-path': 'url(#' + id + 'a2)' }, chamLayer);
    uses.push(use(sh1g, '#FFFFFF')); uses.push(use(sh2g, '#FFFFFF'));

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // wave origin: neck when curled (world)
    var nk = P.path.at(P.s.curl);
    var origin = [P.mx(nk.x), P.fy(nk.y)];

    // look targets
    var nearUp = null, nearDown = null, sameRow = null;
    L.others.forEach(function (c) {
      var d = Math.abs(c.x - T.x) + Math.abs(c.y - T.y) * 0.6;
      if (c.row === T.row) { if (!sameRow || d < sameRow.d) sameRow = { c: c, d: d }; }
      else if (c.y < T.y) { if (!nearUp || d < nearUp.d) nearUp = { c: c, d: d }; }
      else if (!nearDown || d < nearDown.d) nearDown = { c: c, d: d };
    });
    function pt(o, fx, fy) { return o ? { p: [o.c.x, o.c.y] } : { p: [fx, fy] }; }
    var up = pt(nearUp || sameRow, T.x, 0), down = pt(nearDown || sameRow, T.x, H), side = pt(sameRow || nearUp || nearDown, P.sx === 1 ? W : 0, T.y);
    var tg = { p: [T.x, T.y] };
    // per-eye look schedules: [time, spec, duration]; eye0 = upper eye at size-up
    var looks = [
      [[0, 'fwd'], [1560, up, 150], [1880, side, 170], [2110, tg, 90], [3200, 'cam', 220], [4420, tg, 120], [5150, 'cam', 200], [5380, 'fwd', 160], [5950, tg, 180], [6400, 'fwd', 180]],
      [[0, 'fwd'], [800, 'cam', 140], [1050, 'fwd', 140], [1700, down, 150], [1890, 'back', 220], [2215, tg, 75], [3260, tg, 100], [3700, 'cam', 240], [4420, tg, 120], [5380, 'fwd', 160], [5950, 'cam', 200], [6430, 'fwd', 180]]
    ];

    return {
      opts: opts, L: L, P: P, svg: svg, cam: cam, clip: clip, legs: legs, body: body, bands: bands, shine: shine, head: head, headDet: headDet, nostr: nostr,
      eyes: eyes, rowsG: rowsG, chipsG: chipsG, victim: victim, ripple: ripple, dust: dust, uses: uses, line: line, origin: origin,
      looks: looks, sh1g: sh1g, sh2g: sh2g
    };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var P = S.P, L = S.L, T = L.target, mx = P.mx;

    // camera: push in on the action, pull back for the payoff
    var zk = eioC(seg(t, 850, 1750)) * (1 - eioC(seg(t, 6450, 7250)));
    var Z = lerp(1, 1.5, zk);
    var lead = 30 + 16 * eio(seg(t, 5300, 5900));
    var ccx = clamp(lerp(W / 2, T.x - P.sx * lead, zk), W / (2 * Z) - 55 * zk, W - W / (2 * Z) + 55 * zk);
    var ccy = clamp(lerp(H / 2, T.y + P.sy * ((L.bandY - T.y) / 2 - 4), zk), H / (2 * Z) - 10 * zk, Math.max(H / (2 * Z), 610 - H / (2 * Z)));
    S.cam.setAttribute('transform', 'translate(' + (W / 2).toFixed(2) + ',' + (H / 2).toFixed(2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 2260, 2520)) * (1 - eio(seg(t, 6050, 6500)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // victim chip: pop in, shiver, press, lift & plonk
    var V = S.victim, sc = chipPop(T), dx = 0, dy = 0, shOff = 0;
    if (t > 2230 && t < 2480) { var q = seg(t, 2230, 2480); dx = 1.9 * Math.sin((t - 2230) * 0.16) * (1 - q); sc *= 1 - 0.05 * Math.sin(Math.PI * q); }
    var press = 0.045 * eo(seg(t, 3000, 3150)) * (1 - seg(t, 5640, 5700));
    sc *= 1 - press - (t > 3150 && t < 5640 ? 0.04 * Math.exp(-(t - 3150) / 100) * Math.sin(Math.PI * clamp((t - 3150) / 160)) : 0);
    if (t >= 5640 && t < 5800) { var r1 = eo(seg(t, 5640, 5800)); sc = lerp(1 - 0.045, 1.12, r1); dy = -3 * r1; shOff = 5 * r1; }
    else if (t >= 5800 && t < 5880) { var r2 = ei(seg(t, 5800, 5880)); sc = lerp(1.12, 0.92, r2); dy = -3 * (1 - r2); shOff = 5 * (1 - r2); }
    else if (t >= 5880 && t < 6700) { var d = t - 5880; sc = 1 - 0.08 * Math.exp(-d / 110) * Math.cos(2 * Math.PI * 4.5 * d / 1000); }
    var tr = 'translate(' + f1(T.x + dx) + ',' + f1(T.y + dy) + ') scale(' + sc.toFixed(4) + ')';
    V.gs.forEach(function (g) { g.setAttribute('transform', tr); });
    V.sh.setAttribute('r', f1(CR * Math.min(sc, 1.04)));
    V.sh.setAttribute('cx', f1(T.x + 1.5 + shOff * 0.4)); V.sh.setAttribute('cy', f1(T.y + 3.5 + shOff));
    V.sh.setAttribute('opacity', f1(28 - shOff * 1.6) / 100);

    var rp = seg(t, 5880, 6380);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 5880, 6160);
    if (dp > 0 && dp < 1) {
      var dd = '', r0 = 27 + 9 * eoC(dp), r1b = r0 + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // colour waves (world circles from the chameleon's neck)
    var o = S.origin;
    var p1 = seg(t, 3350, 3800), p2 = seg(t, 4420, 5020);
    var rw1 = p1 >= 1 ? 3000 : 96 * eio(p1), rw2 = p2 >= 1 ? 3000 : 96 * eio(p2);
    S.clip.w1.setAttribute('d', rw1 > 0.2 ? circleD(o[0], o[1], rw1) : '');
    S.clip.w2.setAttribute('d', rw2 > 0.2 ? circleD(o[0], o[1], rw2) : '');
    function ann(r) { return r > 1 && r < 200 ? circleD(o[0], o[1], r) + circleD(o[0], o[1], Math.max(0.1, r - 7)) : ''; }
    S.clip.a1.setAttribute('d', ann(rw1)); S.clip.a2.setAttribute('d', ann(rw2));
    S.sh1g.setAttribute('opacity', f1(Math.sin(Math.PI * p1) * 55) / 100);
    S.sh2g.setAttribute('opacity', f1(Math.sin(Math.PI * p2) * 65) / 100);
    S.victim.shimmer.setAttribute('opacity', f1(Math.sin(Math.PI * p2) * 65) / 100);

    // ---- chameleon ----
    var sH = sHeadAt(P, t), wa = walkAmt(t), tuck = tuckAt(t);
    var ws = widthAt(t) * lerp(1, 0.8, tuck), kt = tailCurlAt(t, sH);
    var phase = 2 * Math.PI * sH / S_STRIDE;
    var sp = [], i, u;
    for (u = 0; u <= LF; u += DU) {
      var a = P.path.at(sH - u);
      var lat = 2.6 * wa * Math.sin(2 * Math.PI * u / 64 - phase) * (u / LF);
      sp.push([a.x - a.ty * lat, a.y + a.tx * lat]);
    }
    var pl = sp[sp.length - 1], pq = sp[sp.length - 3];
    var th = Math.atan2(pl[1] - pq[1], pl[0] - pq[0]);
    var px = pl[0], py = pl[1];
    for (u = LF + DU; u <= LT; u += DU) {
      var up2 = (u - LF) / (LT - LF);
      th += kt * lerp(1 / 17, 1 / 4.4, Math.pow(up2, 1.5)) / K * DU;
      px += Math.cos(th) * DU; py += Math.sin(th) * DU;
      sp.push([px, py]);
    }
    // to world (mirror)
    var mxx = P.sx === 1 ? function (x) { return x; } : function (x) { return W - x; };
    var N = sp.length, nrm = [], wv = [];
    for (i = 0; i < N; i++) {
      var A = sp[Math.max(0, i - 1)], B = sp[Math.min(N - 1, i + 1)], ddx = B[0] - A[0], ddy = B[1] - A[1], m = Math.hypot(ddx, ddy) || 1;
      nrm.push([-ddy / m, ddx / m]);
      var uu = i * DU, wsc = uu < LF + 8 ? ws : lerp(ws, 1, clamp((uu - LF - 8) / 30));
      wv.push(wprof(uu) * wsc / 2);
    }
    var lft = '', rgt = '';
    for (i = 0; i < N; i++) {
      lft += (i ? 'L' : 'M') + f1(mxx(sp[i][0] + nrm[i][0] * wv[i])) + ' ' + f1(sp[i][1] + nrm[i][1] * wv[i]);
    }
    for (i = N - 1; i >= 0; i--) rgt += 'L' + f1(mxx(sp[i][0] - nrm[i][0] * wv[i])) + ' ' + f1(sp[i][1] - nrm[i][1] * wv[i]);
    S.body.setAttribute('d', lft + rgt + 'Z');
    // back bands + shine
    var bd = '';
    [20, 34, 46].forEach(function (uq) {
      var k = uq / DU, w = wv[k] * 0.62, p = sp[k], n = nrm[k];
      var b0 = [p[0] + n[0] * w, p[1] + n[1] * w], b1 = [p[0] - n[0] * w, p[1] - n[1] * w];
      var bk = sp[k + 1];
      bd += 'M' + f1(mxx(b0[0])) + ' ' + f1(b0[1]) + 'Q' + f1(mxx(bk[0] + (bk[0] - p[0]) * 2)) + ' ' + f1(bk[1] + (bk[1] - p[1]) * 2) + ' ' + f1(mxx(b1[0])) + ' ' + f1(b1[1]);
    });
    S.bands.setAttribute('d', bd);
    var shd = '';
    for (i = 3; i <= 29; i++) { var k2 = i, off = wv[k2] * 0.38; shd += (i === 3 ? 'M' : 'L') + f1(mxx(sp[k2][0] - nrm[k2][0] * off)) + ' ' + f1(sp[k2][1] - nrm[k2][1] * off); }
    S.shine.setAttribute('d', shd);

    // legs
    var legDef = [[12, -1, 0], [12, 1, 0.5], [52, 1, 0], [52, -1, 0.5]];
    var latBase = lerp(19.5, 10, tuck);
    legDef.forEach(function (ld, li) {
      var uu = ld[0], side = ld[1], k = uu / DU;
      var c = sH / S_STRIDE + ld[2], n = Math.floor(c), f = c - n, aEx = S_STRIDE / 4, off, lift;
      if (f < 0.5) { var q = eio(f / 0.5); off = lerp(-aEx, aEx, q); lift = Math.sin(Math.PI * q); }
      else { off = aEx - 2 * aEx * ((f - 0.5) / 0.5); lift = 0; }
      if (uu > 26) off -= 4;
      var fp = P.path.at(sH - uu + off + (uu < 26 ? 5 : 0));
      var latF = latBase + lift * 3;
      var foot = [fp.x - fp.ty * side * latF, fp.y + fp.tx * side * latF];
      var p = sp[k], nn = nrm[k], hw = wv[k] - 4;
      var att = [p[0] + nn[0] * side * hw, p[1] + nn[1] * side * hw];
      var mid = [(att[0] + foot[0]) / 2, (att[1] + foot[1]) / 2];
      var bend = (uu < 26 ? -1 : 1) * 6;
      var tdir = [sp[Math.max(0, k - 1)][0] - sp[k + 1][0], sp[Math.max(0, k - 1)][1] - sp[k + 1][1]], tm = Math.hypot(tdir[0], tdir[1]) || 1;
      var knee = [mid[0] + nn[0] * side * 5 + tdir[0] / tm * bend, mid[1] + nn[1] * side * 5 + tdir[1] / tm * bend];
      var dpath = 'M' + f1(mxx(att[0])) + ' ' + f1(att[1]) + 'Q' + f1(mxx(knee[0])) + ' ' + f1(knee[1]) + ' ' + f1(mxx(foot[0])) + ' ' + f1(foot[1]);
      var Lg = S.legs[li];
      Lg.ink.setAttribute('d', dpath); Lg.col.setAttribute('d', dpath);
      // mitten foot: two toes (zygodactyl) as a little split oval
      var fr = 4.5 * (1 + 0.18 * lift), ang = Math.atan2(foot[1] - knee[1], mxx(foot[0]) - mxx(knee[0]));
      var fx = mxx(foot[0]), fy = foot[1], ca = Math.cos(ang), sa = Math.sin(ang);
      function rot(x, y) { return f1(fx + x * ca - y * sa) + ' ' + f1(fy + x * sa + y * ca); }
      Lg.foot.setAttribute('d', 'M' + rot(-1.5, -fr) + 'Q' + rot(fr + 1.6, -fr - 0.6) + ' ' + rot(fr * 0.7, -0.4) + 'L' + rot(0.6, 0) + 'L' + rot(fr * 0.7, 0.4) + 'Q' + rot(fr + 1.6, fr + 0.6) + ' ' + rot(-1.5, fr) + 'Q' + rot(-3.2, 0) + ' ' + rot(-1.5, -fr) + 'Z');
    });

    // head (mirror frame)
    var n0 = sp[0], n2 = sp[2], F = [n0[0] - n2[0], n0[1] - n2[1]], fm = Math.hypot(F[0], F[1]) || 1;
    F = [F[0] / fm, F[1] / fm];
    var yw = yawAt(t, sH), cy_ = Math.cos(yw), sy_ = Math.sin(yw);
    F = [F[0] * cy_ - F[1] * sy_, F[0] * sy_ + F[1] * cy_];
    var NF = [-F[1], F[0]], hs = K * (1 + 0.04 * (widthAt(t) - 1));
    function HP(lx, ly) { lx *= hs; ly *= hs; return [mxx(n0[0] + F[0] * lx + NF[0] * ly), n0[1] + F[1] * lx + NF[1] * ly]; }
    function Hs(lx, ly) { var q = HP(lx, ly); return f1(q[0]) + ' ' + f1(q[1]); }
    S.head.setAttribute('d', 'M' + Hs(-4, -9.5) + 'C' + Hs(3, -13) + ' ' + Hs(11, -13.5) + ' ' + Hs(16.5, -9.8) + 'C' + Hs(21.5, -6.6) + ' ' + Hs(25.5, -3.2) + ' ' + Hs(25.5, 0) +
      'C' + Hs(25.5, 3.2) + ' ' + Hs(21.5, 6.6) + ' ' + Hs(16.5, 9.8) + 'C' + Hs(11, 13.5) + ' ' + Hs(3, 13) + ' ' + Hs(-4, 9.5) + 'Z');
    S.headDet.setAttribute('d', 'M' + Hs(-2, 0) + 'L' + Hs(15, 0) + 'M' + Hs(-2, -4.5) + 'L' + Hs(4, 0) + 'L' + Hs(-2, 4.5));
    var ns1 = HP(22, -2.6), ns2 = HP(22, 2.6);
    S.nostr.setAttribute('d', circleD(ns1[0], ns1[1], 0.95) + circleD(ns2[0], ns2[1], 0.95));
    var Fw = [P.sx * F[0], P.sy * F[1]];

    // eyes
    var tremb = trembleAt(t), lid = lidAt(t), es = eyeScaleAt(t);
    [-1, 1].forEach(function (side, ei2) {
      var E = HP(9, side * 10.8), Eo = S.eyes[ei2];
      E = [E[0], P.fy(E[1])];
      var v = lookVec(S.looks[ei2], t, E, Fw);
      var tr = 9.6 * es, oR = 6.2 * es;
      var O = [E[0] + v[0] * 3.2, E[1] + v[1] * 3.2];
      Eo.tur.setAttribute('cx', f1(E[0])); Eo.tur.setAttribute('cy', f1(E[1])); Eo.tur.setAttribute('r', f1(tr));
      Eo.open.setAttribute('cx', f1(O[0])); Eo.open.setAttribute('cy', f1(O[1])); Eo.open.setAttribute('r', f1(oR));
      var pp = [O[0] + v[0] * 1.5, O[1] + v[1] * 1.5];
      Eo.pup.setAttribute('cx', f1(pp[0])); Eo.pup.setAttribute('cy', f1(pp[1]));
      Eo.glint.setAttribute('cx', f1(pp[0] - 1)); Eo.glint.setAttribute('cy', f1(pp[1] - 1));
      var Ly = clamp(lid, -1, 1.05) * oR;
      if (Ly <= -oR + 0.05) Eo.lid.setAttribute('d', '');
      else if (Ly >= oR - 0.05) Eo.lid.setAttribute('d', circleD(O[0], O[1], oR + 0.3));
      else {
        var dxl = Math.sqrt(oR * oR - Ly * Ly);
        Eo.lid.setAttribute('d', 'M' + f1(O[0] - dxl) + ' ' + f1(O[1] + Ly) + 'A' + f1(oR) + ' ' + f1(oR) + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(O[0] + dxl) + ' ' + f1(O[1] + Ly) + 'Z');
      }
    });
    S.uses.forEach(function (u, k) {
      var tx = tremb[0] + (k === 0 ? 2.5 : 0), ty = tremb[1] + (k === 0 ? 4 : 0);
      u.setAttribute('transform', 'translate(' + f1(tx) + ',' + f1(ty) + ')');
    });

    // final line
    var lp = seg(t, 7600, 8050);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function specVec(spec, E, Fw) {
    if (spec === 'cam') return [0, 0];
    if (spec === 'fwd') return [Fw[0], Fw[1]];
    if (spec === 'back') return [-Fw[0], -Fw[1]];
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
    var ma = Math.hypot(a[0], a[1]), mb = Math.hypot(b[0], b[1]);
    var q = backOut(p, 1.3);
    if (ma > 0.5 && mb > 0.5) {
      var aa = Math.atan2(a[1], a[0]), ab = Math.atan2(b[1], b[0]), d = ab - aa;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      var an = aa + d * q, mg = lerp(ma, mb, p);
      return [Math.cos(an) * mg, Math.sin(an) * mg];
    }
    var x = lerp(a[0], b[0], q), y = lerp(a[1], b[1], q), m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return [x, y];
  }

  function getScene(root, opts) {
    var c = root.__cc2chameleon;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2chameleon = S;
    return S;
  }

  window.CCSteal2_chameleon = {
    title: 'The Chameleon',
    blurb: 'A deadpan chameleon sizes up the table with two independent eyes, curls up on Nate’s chip, blends in, then strains and ripples into Nick’s pink, taking the chip with it.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2chameleon = S;
      var token = {};
      root.__cc2chameleonToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2chameleonToken !== token) { resolve(); return; }
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
