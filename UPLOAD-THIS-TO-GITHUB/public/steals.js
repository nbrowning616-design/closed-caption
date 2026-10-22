/* Closed Caption — the steal shows (steals.js). Eight short animated films, one per steal, dealt like a deck for the night
   (game.js HEISTS). Each exposes window.CCSteal2_<key> = { title, blurb, duration, play(el, opts), frame(el, opts, ms) }.
   Built by the animation team, Oct 22 2026 (Nick: "All of those steals are excellent ... I like all of them in the variety"). */

/* ── chameleon ── */
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
    var same = d && v && d[0].toUpperCase() === v[0].toUpperCase();
    return function (name) {
      name = name || '?';
      if (same && (name === d || name === v)) return name.slice(0, 2);
      return name[0].toUpperCase();
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


/* ── octopus ── */
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


/* ── laundry ── */
/* Closed Caption - "steal" moment - concept: THE ONE RED SOCK (laundry)
 *
 * Everyone knows it: one coloured sock in the wash and all the whites come out that colour.
 * Top-down felt table; the little washer is a front-view toy that pops up out of the felt.
 *
 * Storyboard (ms)
 *   0-  650  Table deals in: rows drop in, chips pop on.
 * 600- 950  Camera eases in a touch (whole rows stay in frame). Other chips dim; Nate's chip
 *           gives a nervous little hop-shiver.
 * 800-1380  A hole irises open in the felt beside the chip and a tiny washing machine
 *           pops up out of it (overshoot, squash on landing, wobbly settle).
 *1280-1600  Its panel eyes blink awake and look at Nate's chip. Door pops open.
 *1600-2050  Chip crouches, hops in an arc through the door, lands in the drum.
 *2000-2700  A small sock in Nick's colour inch-worms along the felt from the table edge, stops
 *           at the door, glances at us (sneaky).
 *2700-2900  Sock hops in after the chip.
 *2900-3250  Beat: the machine's eyes drop to its window... it noticed. A pause. Door slams.
 *3250-4500  WASH: drum tumbles, suds, the sock bleeds dye into the water, which turns Nick's
 *           colour; the chip inside follows. Machine rocks and shimmies across the felt and back,
 *           tinted bubbles float out of the top.
 *4500-5420  SPIN: drum blurs, water drains, machine shakes frantically, eyes clenched.
 *5420-5720  Stops dead, dizzy eyes; DING (pop of the lid, tick burst).
 *5700-6330  Door pops, steam. The chip tumbles out (now Nick's colour, "Ni"), bounces once and
 *           lands exactly in its spot: squash, Euler-disc settle, ring flash, still steaming.
 *6150-6950  The sock peeks out of the door, looks at the chip, then at us. Ducks back in.
 *6950-7600  Door shuts; machine hops, sinks back into the felt; hole closes. Camera eases back.
 *7640-7680  Settle; whole table still.
*7680-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var BODY = '#FBF8F2', PANEL = '#D3E1E6', METAL = '#BFCAD1', DRUM = '#28333D', WATER = '#AEDCEA', HOLE = '#143A2E';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var WY = -37, WR = 20.5, CS = 0.56, SS = 0.62, MS = 1.22, SW = 1.35;
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
  function tr(x, y, r, sx, sy) { return 'translate(' + f1(x) + ',' + f1(y) + ')' + (r ? ' rotate(' + f1(r) + ')' : '') + ' scale(' + f2(sx) + ',' + f2(sy === undefined ? sx : sy) + ')'; }
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
    var trow = rows[target.row];
    return { rows: rows, target: target, others: others, bandY: trow.y + h + g / 2, h: h, g: g, ini: ini };
  }

  // ---------- choreography ----------
  // machine pose (offsets from rest) as a pure function of t
  function machinePose(t, S) {
    var sx = S.sx, m = { dx: 0, dy: 0, rot: 0, sqy: 1 };
    if (t < 1380) { var p = seg(t, 1000, 1380); m.dy = 112 * (1 - backOut(p, 1.5)); m.sqy += 0.1 * Math.sin(Math.PI * p); }
    m.sqy += spring(t - 1380, -0.11, 3.4, 130);
    m.rot += spring(t - 1380, 4.5 * sx, 2.1, 230);
    m.rot += spring(t - 1460, -1.8 * sx, 3, 150);
    m.sqy += spring(t - 2050, -0.045, 4, 100) + spring(t - 2900, -0.04, 4, 100);
    // door slam
    m.rot += spring(t - 3250, 2.6 * sx, 3, 160); m.sqy += spring(t - 3250, -0.08, 4, 120);
    // wash: rock & shimmy across the felt and back
    var wa = seg(t, 3300, 3500) * (1 - seg(t, 4420, 4600));
    var ph = 2 * Math.PI * (t - 3300) / 430;
    m.rot += 3.4 * wa * Math.sin(ph);
    m.dy -= 2 * wa * Math.abs(Math.sin(ph));
    m.dx += sx * kf([[3450, 0], [3980, S.walk], [4520, 0]], t, eS) + 1.2 * wa * Math.sin(ph * 2);
    // spin: frantic
    var A = eio(seg(t, 4500, 5150)) * (1 - eio(seg(t, 5260, 5420)));
    m.rot += 6 * A * Math.sin(t * 0.097);
    m.dx += 3.8 * A * Math.sin(t * 0.131 + 1);
    m.dy -= 7.5 * A * Math.abs(Math.sin(t * 0.043));
    m.sqy += 0.05 * A * Math.sin(t * 0.11);
    // stop jolt
    m.rot += spring(t - 5420, 3.2 * sx, 2.4, 170);
    // DING hop
    var dp = seg(t, 5550, 5720);
    m.dy -= 10 * Math.sin(Math.PI * dp); m.sqy += 0.07 * Math.sin(Math.PI * dp) + spring(t - 5720, -0.08, 4, 110);
    m.rot += spring(t - 5700, -2.2 * sx, 3, 140) + spring(t - 5800, -1.6 * sx, 3, 140);
    // sink: little hop, then down the hole
    m.dy -= 6 * Math.sin(Math.PI * seg(t, 6990, 7130));
    m.sqy += 0.06 * Math.sin(Math.PI * seg(t, 6990, 7130));
    if (t >= 7090) m.dy += 118 * ei(seg(t, 7090, 7460));
    m.rot += 2.2 * Math.sin(t * 0.07) * seg(t, 7100, 7200);
    return m;
  }
  function holeK(t) {
    return kf([[800, 0], [1060, 1, function (x) { return backOut(x, 1.6); }], [1480, 1], [1760, 0], [6890, 0], [7060, 1, function (x) { return backOut(x, 1.6); }], [7430, 1], [7640, 0]], t);
  }
  function doorAng(t) {
    var a = kf([[0, 0], [1460, 0], [1610, 120, function (x) { return backOut(x, 1.8); }], [3130, 120], [3250, 0, ei], [5700, 0], [5850, 125, function (x) { return backOut(x, 1.8); }], [6950, 125], [7090, 0, ei]], t);
    a += spring(t - 3250, 7, 5, 70) * (t > 3250 && t < 3500 ? 1 : 0) + spring(t - 7090, 6, 5, 70) * (t > 7090 && t < 7300 ? 1 : 0);
    return Math.max(0, a);
  }
  var W1 = 2 * Math.PI / 1100, W2 = 2 * Math.PI / 140;
  function omega(t) {
    if (t < 3250) return 0;
    if (t < 3450) return W1 * seg(t, 3250, 3450);
    if (t < 4500) return W1;
    if (t < 5000) return lerp(W1, W2, eio(seg(t, 4500, 5000)));
    if (t < 5300) return W2;
    if (t < 5470) return W2 * (1 - eo(seg(t, 5300, 5470)));
    return 0;
  }
  function drumRot(t) {
    var a = 0, end = Math.min(t, 5470);
    for (var s = 3250; s < end; s += 4) a += omega(s + 2) * Math.min(4, end - s);
    return a;
  }
  function waterTint(t) { return eio(seg(t, 3420, 5000)); }
  function chipTint(t) { return eio(seg(t, 3750, 5150)); }

  // ---------- build ----------
  function makeChip(parent, color, txt) {
    var g = el('g', {}, parent);
    el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
    var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    return g;
  }
  // sock puppet, centred on the origin, toe pointing +x
  function makeSock(parent, color) {
    var g = el('g', {}, parent);
    var inner = el('g', { transform: 'translate(-4,12.3)' }, g);
    var dark = mix(color, INK, 0.3);
    var bodyD = 'M-7 -20 L3.5 -20 L3.5 -10 Q3.5 -7.5 6.5 -7.5 L10.5 -7.5 Q15.8 -7.5 15.8 -3.6 Q15.8 0.4 10.5 0.4 L-2.5 0.4 Q-7 0.4 -7 -4.5 Z';
    el('path', { d: bodyD, fill: color }, inner);
    el('path', { d: 'M-7 -6.5 Q-7 0.4 -2.5 0.4 L0.8 0.4 Q-3.6 -1.4 -3.8 -6.5 Z', fill: dark }, inner);
    el('path', { d: 'M10.8 -7.5 Q15.8 -7.5 15.8 -3.6 Q15.8 0.4 10.8 0.4 Q12.8 -3.6 10.8 -7.5 Z', fill: dark }, inner);
    el('path', { d: 'M-4.3 -16.5 L-4.3 -9', stroke: '#FFFFFF', 'stroke-opacity': 0.4, 'stroke-width': 2, 'stroke-linecap': 'round' }, inner);
    el('path', { d: bodyD, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, inner);
    el('rect', { x: -8.3, y: -25, width: 13.1, height: 6.4, rx: 2.2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2 }, inner);
    el('path', { d: 'M-6.5 -21.9 L3 -21.9', stroke: color, 'stroke-width': 1.7 }, inner);
    var eyes = [[7.4, -9.2], [12.1, -8.6]].map(function (p) {
      var eg = el('g', { transform: 'translate(' + p[0] + ',' + p[1] + ')' }, inner);
      el('circle', { r: 2.9, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.3 }, eg);
      return { pup: el('circle', { r: 1.45, fill: INK }, eg), lid: el('path', { fill: color, stroke: INK, 'stroke-width': 1.1 }, eg) };
    });
    return { g: g, eyes: eyes };
  }
  function setSockEyes(S, look, lid) {
    S.eyes.forEach(function (e) {
      e.pup.setAttribute('cx', f1(look[0] * 1.3)); e.pup.setAttribute('cy', f1(look[1] * 1.3));
      if (lid <= -0.95) e.lid.setAttribute('d', '');
      else { var r = 3.0, Ly = clamp(lid, -1, 1) * r, dx = Math.sqrt(Math.max(0, r * r - Ly * Ly)); e.lid.setAttribute('d', lid >= 0.98 ? circleD(0, 0, r) : 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
    });
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-laundry-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.j < 2 ? 1 : -1;
    var MX = T.x + sx * 72, baseY = Math.min(L.bandY + 4, 566);
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var room = sx === 1 ? 362 - (MX + 44) : (MX - 44) - 28, walk = clamp(room, 8, 26);

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpM = el('clipPath', { id: id + 'm', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -400, y: -400, width: 1200, height: f1(baseY + 5.5 * MS + 400) }, cpM);
    var cpW = el('clipPath', { id: id + 'w', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('circle', { cx: 0, cy: WY, r: WR }, cpW);

    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = el('g', {}, svg);
    var tableG = el('g', {}, cam);
    el('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    el('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    el('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    var rowsG = [], chipsG = [], V = null;
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

    // hole in the felt + machine shadow
    var hole = el('g', {}, cam);
    var holeE = el('ellipse', { cx: MX, cy: baseY, rx: 0, ry: 0, fill: HOLE, stroke: INK, 'stroke-width': 2.2 }, hole);
    var holeIn = el('ellipse', { cx: MX, cy: baseY + 2, rx: 0, ry: 0, fill: '#0B241C' }, hole);
    var mShadow = el('ellipse', { cx: MX, cy: baseY + 4, rx: 40, ry: 6, fill: INK, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- machine ----
    var mWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var mG = el('g', {}, mWrap);
    var bodyG = el('g', { transform: 'scale(' + sx + ',1)' }, mG);
    el('rect', { x: -28, y: -3, width: 11, height: 8.5, rx: 3, fill: INK }, bodyG);
    el('rect', { x: 17, y: -3, width: 11, height: 8.5, rx: 3, fill: INK }, bodyG);
    el('rect', { x: -36, y: -88, width: 72, height: 88, rx: 11, fill: BODY, stroke: INK, 'stroke-width': 2.6 }, bodyG);
    el('path', { d: 'M27 -64 L27 -12 Q27 -6 21 -6', fill: 'none', stroke: INK, 'stroke-opacity': 0.08, 'stroke-width': 5, 'stroke-linecap': 'round' }, bodyG);
    el('path', { d: 'M-36 -66 L-36 -77 Q-36 -88 -25 -88 L25 -88 Q36 -88 36 -77 L36 -66 Z', fill: PANEL, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, bodyG);
    el('path', { d: 'M-27 -83.5 L14 -83.5', stroke: '#FFFFFF', 'stroke-opacity': 0.55, 'stroke-width': 2, 'stroke-linecap': 'round' }, bodyG);
    el('path', { d: 'M-29 -6 L29 -6', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, bodyG);
    var mEyes = [[-21, -77], [-8.5, -77]].map(function (p) {
      var g = el('g', { transform: 'translate(' + p[0] + ',' + p[1] + ')' }, bodyG);
      el('circle', { r: 5.4, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.7 }, g);
      return { p: p, pup: el('circle', { r: 2.7, fill: INK }, g), gl: el('circle', { r: 0.9, fill: '#FFFFFF' }, g), lid: el('path', { fill: PANEL, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g) };
    });
    var light = el('circle', { cx: 4.5, cy: -77, r: 2.6, fill: '#94A3A9', stroke: INK, 'stroke-width': 1.3 }, bodyG);
    var knobG = el('g', { transform: 'translate(21,-77)' }, bodyG);
    el('circle', { r: 6.8, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2 }, knobG);
    var knobPtr = el('path', { d: 'M0 0 L0 -4.6', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, knobG);
    el('circle', { cx: 0, cy: WY, r: 22.5, fill: DRUM }, bodyG);
    // contents (not mirrored), clipped to the window
    var cont = el('g', { 'clip-path': 'url(#' + id + 'w)' }, mG);
    var perfG = el('g', {}, cont);
    for (var pi = 0; pi < 10; pi++) {
      var pa = pi / 10 * Math.PI * 2;
      el('circle', { cx: f1(Math.cos(pa) * 15), cy: f1(Math.sin(pa) * 15), r: 1.3, fill: '#FFFFFF', 'fill-opacity': 0.2 }, perfG);
    }
    el('path', { d: 'M-17 0 L17 0 M0 -17 L0 17', stroke: '#FFFFFF', 'stroke-opacity': 0.08, 'stroke-width': 3 }, perfG);
    var water = el('path', { fill: WATER, opacity: 0.92 }, cont);
    var clouds = [0, 1, 2, 3].map(function () { return el('circle', { r: 0, fill: dealerC, opacity: 0 }, cont); });
    var blur = el('circle', { cx: 0, cy: WY, r: 8, fill: 'none', 'stroke-width': 13, opacity: 0 }, cont);
    var blur2 = el('circle', { cx: 0, cy: WY, r: 14, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.4, 'stroke-dasharray': '6 9', opacity: 0 }, cont);
    var cChip = el('g', {}, cont);
    makeChip(cChip, victimC, vIni);
    var cChipD = el('g', { opacity: 0 }, cChip); makeChip(cChipD, dealerC, dIni);
    var cSock = makeSock(el('g', {}, cont), dealerC);
    var suds = [];
    for (var si = 0; si < 8; si++) suds.push(el('circle', { r: 3, fill: '#FFFFFF', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 0.8, opacity: 0 }, cont));
    // gasket
    el('circle', { cx: 0, cy: WY, r: 21.4, fill: 'none', stroke: '#7D8990', 'stroke-width': 2.6 }, mG);
    el('circle', { cx: 0, cy: WY, r: 22.8, fill: 'none', stroke: INK, 'stroke-width': 1.6 }, mG);
    // door (mirrored with body; hinge on the far side from the chip)
    var doorM = el('g', { transform: 'scale(' + sx + ',1)' }, mG);
    var door = el('g', {}, doorM);
    el('rect', { x: 25, y: WY - 9, width: 7, height: 5, rx: 1.5, fill: METAL, stroke: INK, 'stroke-width': 1.4 }, door);
    el('rect', { x: 25, y: WY + 4, width: 7, height: 5, rx: 1.5, fill: METAL, stroke: INK, 'stroke-width': 1.4 }, door);
    el('path', { d: circleD(0, WY, 28) + circleD(0, WY, WR), 'fill-rule': 'evenodd', fill: METAL, stroke: INK, 'stroke-width': 2.4 }, door);
    el('rect', { x: -32.5, y: WY - 7, width: 6, height: 14, rx: 2.5, fill: METAL, stroke: INK, 'stroke-width': 1.8 }, door);
    var glass = el('circle', { cx: 0, cy: WY, r: WR, fill: '#DDF4FC', 'fill-opacity': 0.22 }, door);
    el('path', { d: 'M-12.5 ' + (WY - 6) + ' A14 14 0 0 1 -4 ' + (WY - 13.5), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 3, 'stroke-linecap': 'round' }, door);
    el('path', { d: 'M12 ' + (WY + 9) + ' A15 15 0 0 1 6.5 ' + (WY + 13.5), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linecap': 'round' }, door);
    el('path', { d: 'M-24 ' + (WY - 10) + ' A26 26 0 0 1 -10 ' + (WY - 24), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-linecap': 'round' }, door);

    // ---- world-space actors over the machine ----
    var sockW = makeSock(el('g', {}, cam), dealerC);
    var vWrap = el('g', {}, cam);
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, vWrap);
    var vG = el('g', {}, vWrap);
    makeChip(vG, victimC, vIni);
    var vGD = el('g', { opacity: 0 }, vG); makeChip(vGD, dealerC, dIni);
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var ding = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var bubbles = [0, 1, 2, 3].map(function () { return el('circle', { r: 0, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.2, opacity: 0 }, cam); });
    var steamD = el('path', { fill: 'none', stroke: '#AFC0C7', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam);
    var steamC = el('path', { fill: 'none', stroke: '#AFC0C7', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, sx: sx, walk: walk, MX: MX, baseY: baseY, dealerC: dealerC, victimC: victimC, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, holeE: holeE, holeIn: holeIn, mShadow: mShadow, dust: dust, mWrap: mWrap, mG: mG,
      mEyes: mEyes, light: light, knobPtr: knobPtr, perfG: perfG, water: water, clouds: clouds, blur: blur, blur2: blur2,
      cChip: cChip, cChipD: cChipD, cSock: cSock, suds: suds, door: door, glass: glass, sockW: sockW,
      vWrap: vWrap, vSh: vSh, vG: vG, vGD: vGD, ripple: ripple, ticks: ticks, ding: ding, bubbles: bubbles,
      steamD: steamD, steamC: steamC, line: line
    };
  }

  // machine local -> world
  function toWorld(S, m, px, py) {
    var a = m.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sqx = 2 - m.sqy;
    var x = px * sqx * MS, y = py * m.sqy * MS;
    return [S.MX + m.dx + x * c - y * s, S.baseY + m.dy + x * s + y * c];
  }
  // contents positions (window-local, relative to window centre)
  function contentPos(S, t) {
    var sx = S.sx, rot = drumRot(t);
    var restC = [-sx * 6, 7.5], restS = [sx * 8, 9.5];
    var orb = eio(seg(t, 3250, 3480)) * (1 - eio(seg(t, 5330, 5520)));
    var ac = Math.PI / 2 + rot + 0.3 * Math.sin(rot * 1.0), as = Math.PI / 2 + rot + 2.7;
    var rc = 8 + 1.5 * Math.sin(rot * 2), rs = 8.5;
    var oc = [Math.cos(ac) * rc, Math.sin(ac) * rc], os = [Math.cos(as) * rs, Math.sin(as) * rs];
    var c = [lerp(restC[0], oc[0], orb), lerp(restC[1], oc[1], orb)];
    var s = [lerp(restS[0], os[0], orb), lerp(restS[1], os[1], orb)];
    return { c: c, s: s, rot: rot, orb: orb };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, sx = S.sx, MX = S.MX, baseY = S.baseY;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6950, 7650)));
    var Z = lerp(1, 1.15, zk);
    var fy = clamp((T.y + baseY) / 2 - 20, 280, 330);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 7150, 7600)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- machine ----
    var m = machinePose(t, S);
    var mVis = t >= 1000 && t < 7465;
    S.mWrap.setAttribute('display', mVis ? 'inline' : 'none');
    var hk = holeK(t);
    S.holeE.setAttribute('rx', f1(46 * MS * hk)); S.holeE.setAttribute('ry', f1(10.5 * hk));
    S.holeIn.setAttribute('rx', f1(38 * MS * hk)); S.holeIn.setAttribute('ry', f1(6 * hk));
    S.holeE.parentNode.setAttribute('display', hk > 0.01 ? 'inline' : 'none');
    var standing = mVis ? clamp(1 - m.dy / 40) * clamp(1 - Math.max(0, -m.dy) / 30, 0.4, 1) : 0;
    S.mShadow.setAttribute('cx', f1(MX + m.dx + 2)); S.mShadow.setAttribute('rx', f1(40 * MS * (0.8 + 0.2 * standing)));
    S.mShadow.setAttribute('opacity', f1(standing * 22 * (t > 1300 ? 1 : 0)) / 100);
    if (mVis) S.mG.setAttribute('transform', 'translate(' + f1(MX + m.dx) + ',' + f1(baseY + m.dy) + ') rotate(' + f1(m.rot) + ') scale(' + f2((2 - m.sqy) * MS) + ',' + f2(m.sqy * MS) + ')');

    // eruption dust
    var dp0 = seg(t, 1040, 1330);
    if (dp0 > 0 && dp0 < 1) {
      var dd = '';
      [-2.9, -2.5, -0.65, -0.25, 2.6, 0.5].forEach(function (a) {
        var r0 = 1 + 0.25 * eoC(dp0), r1 = r0 + 0.18 * (1 - dp0);
        dd += 'M' + f1(MX + Math.cos(a) * 56 * r0) + ' ' + f1(baseY + Math.sin(a) * 14 * r0) + 'L' + f1(MX + Math.cos(a) * 56 * r1) + ' ' + f1(baseY + Math.sin(a) * 14 * r1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // door
    var da = doorAng(t) * Math.PI / 180, dc = Math.cos(da);
    S.door.setAttribute('transform', 'translate(27,0) scale(' + f2(dc) + ',' + f2(1 + 0.05 * Math.sin(da)) + ') translate(-27,0)');
    S.glass.setAttribute('fill-opacity', dc > 0 ? 0.24 : 0.5);

    // machine eyes
    var mlid = kf([[0, 1], [1280, 1], [1360, -1], [1940, -1], [1990, 1], [2030, -1], [2160, -1], [2260, 0.25], [2840, 0.25], [2900, -1],
      [3170, -1], [3260, 0.3], [3780, 0.3], [3820, 1], [3870, 0.3], [4480, 0.3], [4580, 1.05], [5380, 1.05], [5430, -1], [6430, -1], [6470, 1], [6520, -1],
      [6850, -1], [6950, 0.1], [7020, 0.1], [7100, 1.05]], t);
    var lookPts = [[0, 'cam'], [1400, [T.x, T.y], 160], [1760, 'win', 220], [2160, 'cam', 160], [2860, 'winlow', 80], [3260, 'cam', 160],
      [5430, 'dizzy'], [5600, 'cam', 100], [5800, 'chip', 120], [6450, [T.x, T.y], 120], [6600, 'win', 160], [6760, 'cam', 140]];
    S.mEyes.forEach(function (e) {
      var E = toWorld(S, m, sx * e.p[0], e.p[1]);
      var v = lookAt(S, lookPts, t, E, m);
      var vx = v[0] * sx, vy = v[1];
      var shake = (t > 4500 && t < 5400) ? 0.6 * Math.sin(t * 0.21) : 0;
      e.pup.setAttribute('cx', f1(vx * 2.4 + shake)); e.pup.setAttribute('cy', f1(vy * 2.4));
      e.gl.setAttribute('cx', f1(vx * 2.4 - 0.9 * sx + shake)); e.gl.setAttribute('cy', f1(vy * 2.4 - 0.9));
      var r = 5.6, Ly = clamp(mlid, -1, 1.05) * r;
      if (mlid <= -0.97) e.lid.setAttribute('d', '');
      else if (mlid >= 0.99) e.lid.setAttribute('d', circleD(0, 0, r) + (t > 4500 && t < 5400 ? 'M-3.5 -1.6 L1 0.4 L-3.5 2.2' : 'M-4 0.4 Q0 2.4 4 0.4'));
      else { var dx = Math.sqrt(r * r - Ly * Ly); e.lid.setAttribute('d', 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
    });
    var running = seg(t, 3250, 3300) * (1 - seg(t, 5450, 5500));
    var dingF = seg(t, 5550, 5600) * (1 - seg(t, 5900, 6100));
    S.light.setAttribute('fill', dingF > 0 ? mix('#94A3A9', '#FFD24A', dingF) : mix('#94A3A9', '#6BD38A', running * (0.75 + 0.25 * Math.sin(t * 0.02))));
    var ka = kf([[3150, -60], [3260, 30, eoC], [4480, 30], [4560, 150, eoC], [5520, 150], [5600, -60, eoC]], t);
    S.knobPtr.setAttribute('transform', 'rotate(' + f1(ka * sx) + ')');

    // ---- drum contents ----
    var cp = contentPos(S, t), rot = cp.rot;
    S.perfG.setAttribute('transform', 'translate(0,' + WY + ') rotate(' + f1(rot * 180 / Math.PI) + ')');
    var om = omega(t), spinA = clamp((om - 0.012) / 0.026);
    // water: fills, tints with the sock's dye, drains in the spin
    var wl = kf([[3250, 24], [3480, 3, eo], [4580, 3], [5050, 25, ei]], t);
    var tilt = -Math.tan(m.rot * Math.PI / 180);
    var wt = waterTint(t);
    if (wl < 22 && t > 3250) {
      var wd = '';
      for (var x = -24; x <= 24; x += 4) wd += (x === -24 ? 'M' : 'L') + x + ' ' + f1(WY + wl + tilt * x + 1.8 * Math.sin(x * 0.28 + t * 0.012) * (1 - spinA)) ;
      wd += 'L24 ' + (WY + 24) + 'L-24 ' + (WY + 24) + 'Z';
      S.water.setAttribute('d', wd);
      S.water.setAttribute('fill', mix(WATER, S.dealerC, 0.72 * wt));
    } else S.water.setAttribute('d', '');
    // dye clouds from the sock
    [3330, 3640, 3960, 4280].forEach(function (te, k) {
      var c = S.clouds[k], a = seg(t, te, te + 820);
      if (a <= 0 || a >= 1) { c.setAttribute('opacity', 0); return; }
      var p = contentPos(S, te).s;
      c.setAttribute('cx', f1(p[0] + 3 * a * Math.sin(k * 2))); c.setAttribute('cy', f1(WY + p[1] - 4 * a));
      c.setAttribute('r', f1(4 + 9 * eo(a)));
      c.setAttribute('opacity', f1(55 * Math.sin(Math.PI * a) * (wl < 20 ? 1 : 0)) / 100);
    });
    // spin blur
    var ct = chipTint(t);
    S.blur.setAttribute('stroke', mix(mix(S.victimC, S.dealerC, ct), S.dealerC, 0.5));
    S.blur.setAttribute('opacity', f1(spinA * 85) / 100);
    S.blur2.setAttribute('opacity', f1(spinA * 70) / 100);
    S.blur2.setAttribute('transform', 'rotate(' + f1(rot * 180 / Math.PI) + ' 0 ' + WY + ')');
    var itemA = 1 - 0.85 * spinA;
    // chip inside
    var inChip = t >= 2050 && t < 5800;
    if (inChip) {
      var cpos = cp.c;
      if (t < 2260) { var lp = seg(t, 2050, 2260); cpos = [lerp(0, cpos[0], lp), lerp(0, cpos[1], 1 - Math.abs(Math.cos(Math.PI * 1.5 * lp)) * (1 - lp))]; }
      var crot = t < 2260 ? -sx * 360 * (1 - seg(t, 1720, 2260)) : rot * 140;
      S.cChip.setAttribute('transform', tr(cpos[0], WY + cpos[1], crot, CS));
      S.cChip.setAttribute('opacity', f1(itemA * 100) / 100);
      S.cChipD.setAttribute('opacity', f2(ct));
    } else S.cChip.setAttribute('opacity', 0);
    // sock inside
    var inSock = t >= 2900 && t < 7460;
    if (inSock) {
      var sp = cp.s, ssc = SS, srot = 0, sl = [sx, 0], slid = -1;
      if (t < 3100) { var lq = seg(t, 2900, 3100); sp = [lerp(sx * 2, sp[0], lq), lerp(-2, sp[1], eo(lq))]; srot = sx * 20 * (1 - lq); sl = [0, 1]; }
      else if (t < 3250) { sl = [0, 0]; }
      else if (t < 5550) { srot = (rot * 180 / Math.PI) * 1.1 + 15 * Math.sin(rot * 3); }
      // peek out at the end
      var pk = eio(seg(t, 6150, 6380)) * (1 - eio(seg(t, 6820, 6960)));
      if (pk > 0) {
        sp = [lerp(sp[0], -sx * 3, pk), lerp(sp[1], -3, pk)];
        ssc = lerp(SS, 0.95, pk); srot = -sx * 14 * pk;
        sl = lookSock(t, [S.T.x, S.T.y], S, sp);
        slid = kf([[6380, -1], [6600, -1], [6680, 0.15], [6820, 0.15], [6860, -1]], t);
      } else if (t >= 5550) { srot = -8 * sx; sl = [0, 1]; slid = 0.2; }
      S.cSock.g.setAttribute('transform', tr(sp[0], WY + sp[1], srot, sx * ssc, ssc));
      S.cSock.g.setAttribute('opacity', f1(itemA * 100) / 100);
      setSockEyes(S.cSock, [sl[0] * sx, sl[1]], slid);
    } else S.cSock.g.setAttribute('opacity', 0);
    // suds
    S.suds.forEach(function (b, k) {
      var x = -19 + k * 5.5 + 1.5 * Math.sin(t * 0.004 + k);
      var on = seg(t, 3300 + k * 40, 3550 + k * 40) * (1 - seg(t, 4600, 4950));
      if (on <= 0 || wl > 20) { b.setAttribute('opacity', 0); return; }
      var y = WY + wl + tilt * x - 1 - 1.2 * Math.abs(Math.sin(t * 0.009 + k * 1.7));
      b.setAttribute('cx', f1(x)); b.setAttribute('cy', f1(y));
      b.setAttribute('r', f1((2.4 + (k % 3) * 1.1) * on));
      b.setAttribute('fill', mix('#FFFFFF', S.dealerC, 0.28 * wt));
      b.setAttribute('opacity', 0.95);
    });

    // bubbles drifting out of the lid during the wash (tinted)
    [3600, 3880, 4150, 4400].forEach(function (te, k) {
      var b = S.bubbles[k], a = seg(t, te, te + 900);
      if (a <= 0 || a >= 1) { b.setAttribute('opacity', 0); return; }
      var m0 = machinePose(te, S), o = toWorld(S, m0, (k % 2 ? 12 : -14) * sx * 0.6, -90);
      b.setAttribute('cx', f1(o[0] + 6 * Math.sin(a * 7 + k))); b.setAttribute('cy', f1(o[1] - 46 * eo(a)));
      b.setAttribute('r', f1(3 + (k % 2) * 1.6 + 1.5 * a));
      b.setAttribute('fill', mix('#FFFFFF', S.dealerC, 0.35 * waterTint(te + 400)));
      b.setAttribute('opacity', a > 0.9 ? 0 : 0.95);
    });

    // DING burst
    var dg = seg(t, 5560, 5860);
    if (dg > 0 && dg < 1) {
      var top = toWorld(S, m, 0, -88), ddg = '';
      [-2.6, -2.05, -1.57, -1.09, -0.54].forEach(function (a) {
        var r0 = 8 + 14 * eoC(dg), r1 = r0 + 8 * (1 - dg);
        ddg += 'M' + f1(top[0] + Math.cos(a) * (r0 + 22) * 0.9) + ' ' + f1(top[1] + Math.sin(a) * r0) + 'L' + f1(top[0] + Math.cos(a) * (r1 + 22) * 0.9) + ' ' + f1(top[1] + Math.sin(a) * r1);
      });
      S.ding.setAttribute('d', ddg); S.ding.setAttribute('opacity', f1((1 - ei(dg)) * 100) / 100);
    } else S.ding.setAttribute('opacity', 0);

    // steam from the door
    var sd = seg(t, 5720, 6500);
    if (sd > 0 && sd < 1) {
      var wc = toWorld(S, m, 0, WY - 14), sdd = '';
      [-9, 0, 9].forEach(function (ox, k) {
        var by = wc[1] - 26 * eo(sd) - k * 3, bx = wc[0] + ox;
        sdd += squiggle(bx, by, 14 + 6 * sd, t * 0.012 + k);
      });
      S.steamD.setAttribute('d', sdd); S.steamD.setAttribute('opacity', f1(Math.sin(Math.PI * sd) * 80) / 100);
    } else S.steamD.setAttribute('opacity', 0);

    // ---- Nate's chip (world) ----
    var vx = T.x, vy = T.y, vs = chipPop(T), vsx = 1, vsy = 1, vr = 0, shOn = 1, dealerA = 0, wobA = 0;
    var vVis = !(t >= 2050 && t < 5800);
    if (t < 1600) {
      // singled out: nervous hop + shiver
      var nh = seg(t, 650, 980);
      vy -= 5 * Math.sin(Math.PI * seg(t, 650, 820));
      vx += 1.8 * Math.sin((t - 650) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
      vs *= 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 820));
    } else if (t < 1720) {
      var cr = eo(seg(t, 1600, 1700)); vsx = 1 + 0.12 * cr; vsy = 1 - 0.14 * cr; vx -= sx * 2 * cr;
    } else if (t < 2050) {
      var hp = seg(t, 1720, 2050), q = eio(hp);
      var A0 = [T.x, T.y], B0 = toWorld(S, machinePose(2050, S), 0, WY);
      var P = arc2(A0, B0, 46, q);
      vx = P[0]; vy = P[1]; vs = lerp(1, CS * MS, ei(hp)); vr = -sx * 360 * q;
      vsx = 1 - 0.1 * Math.sin(Math.PI * hp); vsy = 1 + 0.12 * Math.sin(Math.PI * hp);
      shOn = 1 - seg(hp, 0, 0.3);
    } else if (t >= 5800) {
      dealerA = 1;
      var S0 = toWorld(S, machinePose(5800, S), -sx * 6, WY + 7.5);
      var B1 = [lerp(S0[0], T.x, 0.48), Math.max(S0[1], T.y) + 6];
      if (t < 6070) {
        var h1 = seg(t, 5800, 6070), P1 = arc2(S0, B1, 34, h1);
        vx = P1[0]; vy = P1[1]; vs = lerp(CS * MS, 0.86, eo(h1)); vr = -sx * 200 * h1;
        vsx = Math.max(0.2, Math.abs(Math.cos(Math.PI * 2 * h1))); shOn = 0;
      } else if (t < 6330) {
        var h2 = seg(t, 6070, 6330), P2 = arc2(B1, [T.x, T.y], 30, h2);
        vx = P2[0]; vy = P2[1]; vs = lerp(0.86, 1, h2); vr = -sx * (200 + 160 * h2);
        vsx = Math.max(0.2, Math.abs(Math.cos(Math.PI * 2 * h2))); shOn = seg(h2, 0.5, 1);
        var sqz = Math.sin(Math.PI * seg(t, 6060, 6110)); vsx *= 1 + 0.15 * sqz; vsy = 1 - 0.15 * sqz;
      } else {
        var d = t - 6330;
        vr = -sx * 360;
        var land = Math.exp(-d / 70) * Math.sin(Math.PI * clamp(d / 110));
        vsx = 1 + 0.14 * land; vsy = 1 - 0.14 * land;
        wobA = 0.09 * Math.exp(-d / 210) * clamp(d / 60);
      }
    }
    if (wobA > 0.002) {
      var wa2 = (t - 6330) * 0.02;
      S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(wa2 * 57.3) + ') scale(' + f2(1 + wobA) + ',' + f2(1 - wobA) + ') rotate(' + f1(-wa2 * 57.3) + ')');
    } else S.vG.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(vr) + ') scale(' + f2(vs * vsx) + ',' + f2(vs * vsy) + ')');
    S.vWrap.setAttribute('display', vVis ? 'inline' : 'none');
    S.vGD.setAttribute('opacity', dealerA);
    var lift = Math.max(0, (T.y - vy) * 0.2) + (t >= 1720 && t < 6330 ? 6 : 0);
    S.vSh.setAttribute('cx', f1(vx + 1.5 + lift * 0.4)); S.vSh.setAttribute('cy', f1(vy + 3.5 + lift));
    S.vSh.setAttribute('r', f1(CR * Math.min(1.04, vs)));
    S.vSh.setAttribute('opacity', f1(28 * shOn) / 100);

    // landing ring + ticks
    var rp = seg(t, 6330, 6830);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var tp = seg(t, 6330, 6600);
    if (tp > 0 && tp < 1) {
      var td = '', r0 = 27 + 9 * eoC(tp), r1b = r0 + 6 * (1 - tp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        td += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.ticks.setAttribute('d', td); S.ticks.setAttribute('opacity', f1((1 - tp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);
    // the chip is still steaming a bit
    var sc2 = seg(t, 5900, 7650);
    if (sc2 > 0 && sc2 < 1) {
      var scd = '';
      [-6, 6].forEach(function (ox, k) {
        var ph2 = ((t - 5900) / 700 + k * 0.5) % 1;
        scd += squiggle(vx + ox, vy - 20 - 16 * ph2, 9, t * 0.014 + k * 2);
      });
      S.steamC.setAttribute('d', scd); S.steamC.setAttribute('opacity', f1(70 * Math.min(1, sc2 * 6) * (1 - ei(sc2))) / 100);
    } else S.steamC.setAttribute('opacity', 0);

    // ---- the sock sneaking in (world) ----
    var sW = S.sockW;
    if (t >= 1990 && t < 2900) {
      var floorY = Math.min(baseY + 9, 569), stopX = MX - sx * 66, startX = sx === 1 ? -24 : W + 24;
      var sxp, syp, ssx = 1, ssy = 1, srot2 = 0, look = [1, 0], slid2 = -1;
      if (t < 2480) {
        var p = seg(t, 2000, 2480), n = 4, env = Math.sin(Math.PI * p);
        var prog = p - Math.sin(2 * Math.PI * n * p) / (2 * Math.PI * n);
        sxp = lerp(startX, stopX, prog);
        var rate = 1 - Math.cos(2 * Math.PI * n * p);
        ssx = 1 + 0.2 * (rate - 1) * env; ssy = 1 - 0.16 * (rate - 1) * env;
        syp = floorY - 12 * SW * ssy - 3 * Math.abs(Math.sin(Math.PI * n * p)) * env;
        srot2 = 6 * Math.sin(2 * Math.PI * n * p) * env;
      } else if (t < 2700) {
        sxp = stopX;
        var st = spring(t - 2480, 0.1, 4, 80);
        ssx = 1 - st; ssy = 1 + st;
        var cr2 = eio(seg(t, 2620, 2700)); ssy -= 0.15 * cr2; ssx += 0.1 * cr2;
        syp = floorY - 12 * SW * ssy;
        look = t < 2540 ? [1, 0] : t < 2610 ? [0, 0] : [0.8, -0.6];
        slid2 = t > 2550 && t < 2610 ? 0.15 : -1;
        srot2 = -sx * 0 + 4 * cr2;
      } else {
        var hp2 = seg(t, 2700, 2900), qq = eio(hp2);
        var Pp = arc2([stopX, floorY - 12 * SW], toWorld(S, machinePose(2900, S), sx * 2, WY - 2), 40, qq);
        sxp = Pp[0]; syp = Pp[1];
        var sc3 = lerp(SW, SS * MS, ei(hp2)); ssx = sc3 * (1 + 0.1 * Math.sin(Math.PI * hp2)); ssy = sc3 * (1 - 0.06 * Math.sin(Math.PI * hp2));
        srot2 = 25 * Math.sin(Math.PI * hp2); look = [0.7, 0.7];
      }
      if (t < 2700) { ssx *= SW; ssy *= SW; }
      sW.g.setAttribute('transform', tr(sxp, syp, srot2 * sx, sx * ssx, ssy));
      sW.g.setAttribute('display', 'inline');
      setSockEyes(sW, look, slid2);
    } else sW.g.setAttribute('display', 'none');

    // final line
    var lp2 = seg(t, 7680, 8030);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function squiggle(x, y, len, ph) {
    var d = 'M' + f1(x + 2.5 * Math.sin(ph)) + ' ' + f1(y);
    for (var k = 1; k <= 8; k++) d += 'L' + f1(x + 2.2 * Math.sin(ph + k * 0.8)) + ' ' + f1(y - len * k / 8);
    return d;
  }
  function lookSock(t, chipPt, S, sp) {
    if (t < 6420) return [0, -0.2];
    if (t < 6600) { var dx = chipPt[0] - (S.MX + sp[0]), dy = chipPt[1] - (S.baseY + WY + sp[1]), m = Math.hypot(dx, dy) || 1; return [dx / m * S.sx, dy / m]; }
    return [0, 0.1];
  }
  function specVec(S, spec, E, m) {
    if (spec === 'cam') return [0, 0.15];
    var p;
    if (spec === 'win') p = toWorld(S, m, 0, WY);
    else if (spec === 'winlow') return [0.15 * S.sx, 1];
    else if (spec === 'chip') { p = S.__chipPt || [S.T.x, S.T.y]; }
    else p = spec;
    var dx = p[0] - E[0], dy = p[1] - E[1], mm = Math.hypot(dx, dy) || 1;
    return [dx / mm, dy / mm];
  }
  function lookAt(S, list, t, E, m) {
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    var cur = list[k];
    if (cur[1] === 'dizzy') { var a = t * 0.045; return [Math.cos(a) * 0.9, Math.sin(a) * 0.9]; }
    if (cur[1] === 'chip') { var cp2 = chipPathPt(S, t); var dx = cp2[0] - E[0], dy = cp2[1] - E[1], mm = Math.hypot(dx, dy) || 1; return [dx / mm, dy / mm]; }
    var b = specVec(S, cur[1], E, m);
    if (k === 0 || list[k - 1][1] === 'dizzy' || list[k - 1][1] === 'chip') {
      if (k > 0 && list[k - 1][1] !== undefined && (list[k - 1][1] === 'chip')) { var pa = chipPathPt(S, cur[0]), dx2 = pa[0] - E[0], dy2 = pa[1] - E[1], m2 = Math.hypot(dx2, dy2) || 1; return blend([dx2 / m2, dy2 / m2], b, clamp((t - cur[0]) / (cur[2] || 120))); }
      if (k > 0 && list[k - 1][1] === 'dizzy') { var aa = cur[0] * 0.045; return blend([Math.cos(aa) * 0.9, Math.sin(aa) * 0.9], b, clamp((t - cur[0]) / (cur[2] || 120))); }
      return b;
    }
    var av = specVec(S, list[k - 1][1], E, m);
    return blend(av, b, clamp((t - cur[0]) / (cur[2] || 120)));
  }
  function blend(a, b, p) { var q = backOut(p, 1.3); return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)]; }
  function chipPathPt(S, t) {
    var T = S.T, sx = S.sx;
    if (t < 5800) return toWorld(S, machinePose(5800, S), -sx * 6, WY + 7.5);
    var S0 = toWorld(S, machinePose(5800, S), -sx * 6, WY + 7.5);
    var B1 = [lerp(S0[0], T.x, 0.48), Math.max(S0[1], T.y) + 6];
    if (t < 6070) return arc2(S0, B1, 34, seg(t, 5800, 6070));
    if (t < 6330) return arc2(B1, [T.x, T.y], 30, seg(t, 6070, 6330));
    return [T.x, T.y];
  }

  function getScene(root, opts) {
    var c = root.__cc2laundry;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2laundry = S;
    return S;
  }

  window.CCSteal2_laundry = {
    title: 'The One Red Sock',
    blurb: 'A tiny washing machine pops out of the felt and swallows Nate’s chip, a sock in Nick’s colour sneaks in after it, and after a frantic spin cycle the chip tumbles out dyed Nick’s colour and settles right back in its spot.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2laundry = S;
      var token = {};
      root.__cc2laundryToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2laundryToken !== token) { resolve(); return; }
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


/* ── sunbather ── */
/* Closed Caption - "steal" moment - concept: THE TAN (key: sunbather)
 *
 * Storyboard (ms) - top-down felt table, caption rows 1/2/3/CC.
 *    0- 700  Table deals in: rows drop with a soft overshoot, chips pop on.
 *  700-1500  Gentle push-in on the target row (whole row + neighbours stay in
 *            frame). Other chips dim. Nate's chip shivers, grows a little and
 *            comes alive: eyes pop open, stubby arms and legs poke out; it
 *            glances left, right.
 * 1250-1900  Beach kit pops up on its spot: deck chair unfolds under it,
 *            rolled towel pillow, striped umbrella spins open (its shade falls
 *            across the chip). Chip blinks at camera, smug little smile.
 * 1900-2450  Sunglasses on (hands up, shades drop down), then it lies back,
 *            hands behind head, legs crossed. Bliss.
 * 2300-3100  SUNRISE: a small sun in Nick's colour, sly half-lidded eyes and a
 *            smirk, rises in over the table's right edge. Its light (in
 *            Nick's colour) falls on the chip; the umbrella's shadow starts to
 *            swing round with the sun.
 * 3100-5300  TIME-LAPSE: the sun climbs, the shade slides off the chip. The chip
 *            dozes off: slow breaths, a little sleep bubble. The sun beats
 *            down harder in four pulses (3700/4200/4700/5150) - each pulse
 *            swells the sun, flashes the chip and wisps of heat rise off it,
 *            and the chip tans one step toward Nick's colour. On the last
 *            pulse "Na" becomes "Ni".
 * 5300-6000  Bubble pops, it wakes with a jolt, sits up, pushes the shades up
 *            onto its head ... revealing a pale sunglasses-shaped TAN LINE in
 *            Nate's old colour.
 * 6000-6450  It blinks, looks down at itself, eyes go wide, hands up. (beat)
 * 6450-6850  It glares up at the sun (the sun looks away, whistling); the tan
 *            line fills in. The chip is now completely Nick's colour.
 * 6750-7000  The sun winks at camera and starts to set.
 * 6850-7200  Props fold away (umbrella closes, chair folds, towel rolls),
 *            the shades vanish, eyes and limbs tuck in.
 * 7200-7450  It is a plain chip again: lift... plonk in exactly its spot
 *            (squash, settle, ring + dust ticks). Camera eases back out,
 *            sun sinks past the left edge of the table.
 * 7450-7700  Stillness.
 * 7700-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, ZMAX = 1.28, GROW = 0.3;
  var T_END = 10000;
  var KEY = 'sunbather';
  var uid = 0;
  var PULSES = [3700, 4200, 4700, 5150];

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
  function f2(v) { return Math.round(v * 100) / 100; }
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
  // step schedule: [[t, value, dur], ...] -> eased transition of `dur` ms starting at t
  function sched(list, t, ease) {
    ease = ease || eio;
    var v = list[0][1];
    for (var i = 1; i < list.length; i++) {
      var k = list[i];
      if (t <= k[0]) break;
      v = lerp(v, k[1], ease(seg(t, k[0], k[0] + (k[2] || 160))));
    }
    return v;
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function rrD(x, y, w, h, r) {
    return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h - r) + 'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) +
      'H' + (x + r) + 'Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Z';
  }

  // ---------- colour ----------
  function rgb(c) {
    c = String(c || '#888').trim();
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) {
      var h = m[1]; if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /rgba?\(([^)]+)\)/i.exec(c);
    if (m) { var p = m[1].split(',').map(parseFloat); return [p[0] || 0, p[1] || 0, p[2] || 0]; }
    return [136, 136, 136];
  }
  function mix(a, b, t) {
    t = clamp(t);
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
  }

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

  // ---------- timing curves ----------
  function tanAt(t) { var v = 0; PULSES.forEach(function (p) { v += 0.25 * eoC(seg(t, p, p + 280)); }); return v; }
  function bandTanAt(t) { return eio(seg(t, 6480, 6880)); }
  function pulseEnv(t) { var v = 0; PULSES.forEach(function (p) { var d = t - p + 140; if (d > 0) v = Math.max(v, d < 140 ? eo(d / 140) : Math.exp(-(d - 140) / 260)); }); return v; }
  function heatAt(t) { return eio(seg(t, 2700, 5200)) * (1 - eio(seg(t, 5900, 7300))); }
  function sunAngle(t) { // degrees
    if (t < 3100) return lerp(-16, 28, eoC(seg(t, 2300, 3100)));
    if (t < 5300) return lerp(28, 68, eS(seg(t, 3100, 5300)));
    if (t < 6650) return lerp(68, 76, eio(seg(t, 5300, 6650)));
    return lerp(76, 200, eioC(seg(t, 6650, 7300)));
  }

  // limb poses: [hand x, hand y, elbow x, elbow y] for the right side (mirror for left)
  var POSE = {
    rest: [25, 12, 28, 5], wave: [27, -2, 30, 6], up: [12, -9, 27, -6], head: [12, -21, 31, -16],
    sit: [24, 15, 28, 7], sur: [31, -11, 33, 0], fist: [22, 10, 26, 4]
  };
  var POSE_L = [[0, 'rest'], [1300, 'wave', 180], [1500, 'rest', 200], [1880, 'up', 180], [2150, 'head', 260],
    [5420, 'sit', 180], [6200, 'sur', 160], [6450, 'fist', 200], [6880, 'rest', 200]];
  var POSE_R = [[0, 'rest'], [1300, 'wave', 180], [1500, 'rest', 200], [1880, 'up', 180], [2150, 'head', 260],
    [5420, 'sit', 180], [5680, 'up', 160], [5800, 'sit', 200], [6200, 'sur', 160], [6450, 'fist', 200], [6880, 'rest', 200]];
  function poseAt(list, t) {
    var v = POSE[list[0][1]].slice();
    for (var i = 1; i < list.length; i++) {
      var k = list[i]; if (t <= k[0]) break;
      var q = eio(seg(t, k[0], k[0] + (k[2] || 160))), P = POSE[k[1]];
      for (var j = 0; j < 4; j++) v[j] = lerp(v[j], P[j], q);
    }
    return v;
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-' + KEY + '-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var vRGB = rgb(T.color || opts.victimColor), dRGB = rgb(opts.dealerColor);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var bg = el('linearGradient', { id: id + 'beam', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': opts.dealerColor, 'stop-opacity': 0.55 }, bg);
    el('stop', { offset: '1', 'stop-color': opts.dealerColor, 'stop-opacity': 0.12 }, bg);
    var sg = el('radialGradient', { id: id + 'glow' }, defs);
    el('stop', { offset: '0.45', 'stop-color': opts.dealerColor, 'stop-opacity': 0.5 }, sg);
    el('stop', { offset: '1', 'stop-color': opts.dealerColor, 'stop-opacity': 0 }, sg);
    var stripeClip = el('clipPath', { id: id + 'canvas' }, defs);
    el('rect', { x: -19, y: -32, width: 38, height: 68, rx: 4 }, stripeClip);

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

    var rowsG = [], chipsG = [];
    var cardLayer = el('g', {}, cam);
    // light beam from the sun: falls on the table, under the chips
    var beam = el('path', { fill: 'url(#' + id + 'beam)', opacity: 0 }, cam);
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
        if (c.target) return;
        var wrap = el('g', {}, chipLayer);
        var sh = el('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        var cg = el('g', {}, wrap); makeChip(cg, c.color, c.ini);
        chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
      });
    });

    // ---- the sunbather's spot ----
    var spot = el('g', {}, cam);
    // deck chair (top-down), unfolds along y
    var chair = el('g', {}, spot);
    el('rect', { x: -25, y: -35, width: 50, height: 78, rx: 8, fill: INK, opacity: 0.25, transform: 'translate(2,4)' }, chair);
    el('rect', { x: -24, y: -37, width: 48, height: 78, rx: 8, fill: '#C98B4E', stroke: INK, 'stroke-width': 2.2 }, chair);
    var canvasG = el('g', { 'clip-path': 'url(#' + id + 'canvas)' }, chair);
    for (var s = 0; s < 7; s++) el('rect', { x: -19 + s * 38 / 7, y: -32, width: 38 / 7 + 0.3, height: 68, fill: s % 2 ? PAPER : '#E8604C' }, canvasG);
    el('rect', { x: -19, y: -32, width: 38, height: 68, rx: 4, fill: 'none', stroke: INK, 'stroke-width': 1.6 }, chair);
    el('path', { d: 'M-24 -6H24M-24 14H24', stroke: INK, 'stroke-width': 1.4, 'stroke-opacity': 0.45, fill: 'none' }, chair);
    // rolled towel pillow
    var towel = el('g', {}, spot);
    el('rect', { x: -18, y: -6, width: 36, height: 12, rx: 6, fill: PAPER, stroke: INK, 'stroke-width': 2 }, towel);
    el('path', { d: 'M-9 -5.5V5.5M-5 -5.5V5.5M5 -5.5V5.5M9 -5.5V5.5', stroke: '#3BA7C9', 'stroke-width': 2.2, fill: 'none' }, towel);
    el('path', { d: 'M-12 -2.5H12', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, towel);

    var csh = el('ellipse', { rx: CR, ry: CR, fill: INK, opacity: 0.28 }, spot);

    // the chip character (local coords, chip centred at 0,0)
    var chip = el('g', {}, spot);
    var limbs = [];
    for (var li = 0; li < 4; li++) {
      var lg = el('g', {}, chip);
      limbs.push({
        g: lg,
        ink: el('path', { fill: 'none', stroke: INK, 'stroke-width': 6.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lg),
        col: el('path', { fill: 'none', stroke: '#888', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lg),
        end: el('ellipse', { rx: 3.6, ry: 3.6, stroke: INK, 'stroke-width': 1.6, fill: '#888' }, lg)
      });
    }
    var disc = el('circle', { r: CR, fill: T.color, stroke: INK, 'stroke-width': 2.6 }, chip);
    var GL = rrD(-13.2, -10.6, 12, 9.2, 3.6) + rrD(1.2, -10.6, 12, 9.2, 3.6) + 'M-1.6 -8.6H1.6V-6.6H-1.6Z';
    var band = el('path', { d: GL, fill: T.color }, chip);
    var flash = el('circle', { r: CR - 1.3, fill: '#FFFFFF', opacity: 0 }, chip);
    el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, chip);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, chip);
    var txtG = el('g', {}, chip);
    function chipText(s) {
      var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': s.length > 1 ? 15 : 18 }, txtG);
      tx.textContent = s; return tx;
    }
    var txtV = chipText(T.ini), txtD = chipText(L.ini(opts.dealer));
    var face = el('g', {}, chip);
    var eyes = [-1, 1].map(function (sd) {
      var g = el('g', {}, face);
      return {
        sd: sd,
        white: el('ellipse', { cx: sd * 6.9, cy: -6, rx: 3.7, ry: 4.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.5 }, g),
        pup: el('ellipse', { rx: 2.1, ry: 2.3, fill: INK }, g),
        glint: el('circle', { r: 0.75, fill: '#FFFFFF' }, g),
        shut: el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g)
      };
    });
    var brows = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, face);
    var mouth = el('path', { fill: INK, stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, face);
    var bubble = el('circle', { r: 0, fill: '#FFFFFF', 'fill-opacity': 0.75, stroke: INK, 'stroke-width': 1.1 }, face);
    var pop = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0 }, face);
    var glasses = el('g', {}, chip);
    el('path', { d: GL, fill: INK, stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, glasses);
    el('path', { d: 'M-10.8 -4L-6.6 -9.2M-8 -3.2L-5.2 -6.8M3.6 -4L7.8 -9.2M6.4 -3.2L9.2 -6.8', stroke: '#FFFFFF', 'stroke-opacity': 0.55, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, glasses);

    // umbrella shade + umbrella
    var ushadow = el('ellipse', { rx: 21, ry: 18, fill: INK, opacity: 0 }, cam);
    var umb = el('g', {}, cam);
    var wedges = [];
    for (var w = 0; w < 8; w++) wedges.push(el('path', { fill: w % 2 ? PAPER : '#F4BE3E', stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, umb));
    var urim = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, umb);
    el('circle', { r: 3.4, fill: '#C98B4E', stroke: INK, 'stroke-width': 1.6 }, umb);

    // heat wisps, set-down ring + dust
    var wisps = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var ripple = el('circle', { fill: 'none', stroke: opts.dealerColor, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);


    // the sun (Nick)
    var sun = el('g', {}, cam);
    var glow = el('circle', { r: 46, fill: 'url(#' + id + 'glow)' }, sun);
    var rayInk = el('path', { fill: 'none', stroke: INK, 'stroke-width': 7.4, 'stroke-linecap': 'round' }, sun);
    var rayCol = el('path', { fill: 'none', stroke: opts.dealerColor, 'stroke-width': 4, 'stroke-linecap': 'round' }, sun);
    el('circle', { r: 20, fill: opts.dealerColor, stroke: INK, 'stroke-width': 2.6 }, sun);
    el('ellipse', { cx: -8, cy: -10, rx: 6, ry: 3.2, fill: '#FFFFFF', 'fill-opacity': 0.28, transform: 'rotate(-32 -8 -10)' }, sun);
    var sEyes = [-1, 1].map(function (sd) {
      return {
        sd: sd,
        white: el('path', { fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, sun),
        pup: el('circle', { r: 1.9, fill: INK }, sun),
        shut: el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, sun)
      };
    });
    var sBrows = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, sun);
    var sMouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sun);
    var sCheek = el('path', { fill: '#FFFFFF', 'fill-opacity': 0.25 }, sun);

    var tint = el('rect', { x: -10, y: -10, width: W + 20, height: H + 20, fill: '#FFB43A', opacity: 0, 'pointer-events': 'none' }, svg);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    var sx = T.x > 230 ? -1 : 1;   // umbrella + sun come from the roomier side
    var Oy = Math.max(T.y - 8, 178);
    var U = [T.x + sx * 41, T.y - 31];
    var gutY = T.y - L.h / 2 - L.g / 2;
    return {
      opts: opts, L: L, T: T, vRGB: vRGB, dRGB: dRGB, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG,
      chair: chair, towel: towel, csh: csh, chip: chip, limbs: limbs, disc: disc, band: band, flash: flash,
      txtG: txtG, txtV: txtV, txtD: txtD, face: face, eyes: eyes, brows: brows, mouth: mouth, bubble: bubble, pop: pop, glasses: glasses,
      ushadow: ushadow, umb: umb, wedges: wedges, urim: urim, wisps: wisps, ripple: ripple, dust: dust, beam: beam, beamGrad: bg,
      sun: sun, glow: glow, rayInk: rayInk, rayCol: rayCol, sEyes: sEyes, sBrows: sBrows, sMouth: sMouth, sCheek: sCheek,
      tint: tint, line: line, Oy: Oy, Ox: clamp(T.x - sx * 40, 110, 280), U: U, sx: sx, gutY: gutY
    };
  }

  function sunPos(S, t) {
    var a = sunAngle(t) * Math.PI / 180;
    var x = S.Ox + S.sx * 158 * Math.cos(a), y = S.Oy - 162 * Math.sin(a);
    x += S.sx * 190 * (1 - eoC(seg(t, 2300, 3050)));       // slides in from beyond the right edge
    x -= S.sx * 140 * ei(seg(t, 7000, 7320));               // and away past the left edge
    if (t > 6650) y = Math.min(y, S.gutY + 4 * ei(seg(t, 7000, 7320)));   // sets along the gutter, clear of the badges
    return [x, y];
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var T = S.T;

    // camera: a gentle push that keeps the whole target row (and neighbours) in frame
    var zk = eioC(seg(t, 750, 1550)) * (1 - eioC(seg(t, 7000, 7650)));
    var Z = lerp(1, ZMAX, zk);
    var ccx = W / 2;
    var ccy = lerp(H / 2, clamp(T.y + 20, H / (2 * ZMAX), H - H / (2 * ZMAX)), zk);
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 850, 1150)) * (1 - eio(seg(t, 6950, 7400)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ---- props ----
    var chairS = backOut(seg(t, 1250, 1480), 1.8) * (1 - eioC(seg(t, 6950, 7150)));
    var chairX = eio(seg(t, 6950, 7150));
    S.chair.setAttribute('transform', 'translate(' + T.x + ',' + f1(T.y + 4) + ') scale(' + f2(Math.max(0.001, 1.12 * chairS * (1 - 0.3 * chairX))) + ',' + f2(Math.max(0.001, 1.1 * chairS)) + ')');
    S.chair.setAttribute('opacity', chairS > 0.01 ? 1 : 0);
    var towS = backOut(seg(t, 1400, 1620), 2.2) * (1 - eioC(seg(t, 6880, 7060)));
    var towelY = T.y - 35 + 8 * eio(seg(t, 6880, 7060));
    S.towel.setAttribute('transform', 'translate(' + T.x + ',' + f1(towelY) + ') scale(' + f2(Math.max(0.001, towS)) + ',' + f2(Math.max(0.001, towS * (1 + 0.3 * seg(t, 6880, 7060)))) + ')');
    S.towel.setAttribute('opacity', towS > 0.01 ? 1 : 0);

    // umbrella: spins open, closes into a point
    var uOpen = backOut(seg(t, 1550, 1850), 1.6), uClose = eioC(seg(t, 6830, 7050));
    var uS = Math.max(0.001, uOpen * (1 - uClose)), uRot = -70 * (1 - eoC(seg(t, 1550, 1850))) + 90 * uClose;
    var spread = lerp(1, 0.35, uClose) * lerp(0.4, 1, eoC(seg(t, 1550, 1850)));
    var R = 21, wd = '';
    S.wedges.forEach(function (wp, k) {
      var a0 = (k / 8) * Math.PI * 2, a1 = a0 + (Math.PI * 2 / 8) * spread;
      var am = (a0 + a1) / 2;
      var mr = R * (1 - 0.12 * spread);
      wp.setAttribute('d', 'M0 0L' + f1(R * Math.cos(a0)) + ' ' + f1(R * Math.sin(a0)) + 'Q' + f1(R * 1.06 * Math.cos(am)) + ' ' + f1(R * 1.06 * Math.sin(am)) + ' ' + f1(R * Math.cos(a1)) + ' ' + f1(R * Math.sin(a1)) + 'Z');
      wd += (k ? 'L' : 'M') + f1(R * Math.cos(a0)) + ' ' + f1(R * Math.sin(a0)) + 'Q' + f1(mr * Math.cos(am) * 1.18) + ' ' + f1(mr * Math.sin(am) * 1.18) + ' ' + f1(R * Math.cos(a1)) + ' ' + f1(R * Math.sin(a1));
    });
    S.urim.setAttribute('d', spread > 0.97 ? wd + 'Z' : '');
    S.umb.setAttribute('transform', 'translate(' + f1(S.U[0]) + ',' + f1(S.U[1]) + ') rotate(' + f1(uRot) + ') scale(' + f2(uS) + ')');
    S.umb.setAttribute('opacity', uS > 0.02 ? 1 : 0);

    // ---- the sun ----
    var sp = sunPos(S, t), heat = heatAt(t), pe = pulseEnv(t);
    var sunOn = t > 2250 && t < 7330;
    var sunVis = seg(t, 2300, 2450) * (1 - seg(t, 7200, 7320));
    var sunS = (1 + 0.14 * heat + 0.16 * pe) * (0.6 + 0.4 * eoC(seg(t, 2300, 2900))) * (1 - 0.3 * eio(seg(t, 6900, 7300)));
    S.sun.setAttribute('transform', 'translate(' + f1(sp[0]) + ',' + f1(sp[1]) + ') scale(' + f2(sunS) + ')');
    S.sun.setAttribute('opacity', sunOn ? f2(sunVis) : 0);
    S.glow.setAttribute('r', f1(40 + 14 * heat + 16 * pe));
    var rot = t * 0.012 + 40 * eio(seg(t, 3100, 5300)), rd = '';
    for (var r = 0; r < 12; r++) {
      var a = (rot + r * 30) * Math.PI / 180, ln = (r % 2 ? 6 : 10) * (1 + 0.35 * heat + 0.7 * pe) * eoC(seg(t, 2450, 2900));
      if (ln < 0.5) continue;
      rd += 'M' + f1(25 * Math.cos(a)) + ' ' + f1(25 * Math.sin(a)) + 'L' + f1((25 + ln) * Math.cos(a)) + ' ' + f1((25 + ln) * Math.sin(a));
    }
    S.rayInk.setAttribute('d', rd); S.rayCol.setAttribute('d', rd);
    // sun face: sly, focused while baking, innocent when caught, then a wink
    var toC = [T.x - sp[0], T.y - sp[1]], tm = Math.hypot(toC[0], toC[1]) || 1; toC = [toC[0] / tm, toC[1] / tm];
    var innocent = eio(seg(t, 6430, 6560)) * (1 - eio(seg(t, 6700, 6800)));
    var atCam = eio(seg(t, 6700, 6800));
    var lookX = lerp(lerp(toC[0], -0.7, innocent), 0, atCam), lookY = lerp(lerp(toC[1], -0.8, innocent), 0.2, atCam);
    var lidBase = lerp(-0.4, 0.6, heat) ;
    var lid = lerp(lidBase, -2.7, innocent);
    var wink = kf([[0, 0], [6760, 0], [6840, 1], [7080, 1], [7180, 0]], t);
    S.sEyes.forEach(function (e) {
      var ex = e.sd * 7.2, ey = -3.5, rx = 4.4, ry = 3.6;
      var ly = e.sd === -1 ? lerp(lid, 3.6, wink) : lid;
      ly = clamp(ly, -ry + 0.05, ry);
      if (ly > ry - 0.8) {
        e.white.setAttribute('d', ''); e.pup.setAttribute('r', 0);
        e.shut.setAttribute('d', 'M' + f1(ex - 4.4) + ' ' + f1(ey + 0.5) + 'Q' + f1(ex) + ' ' + f1(ey + 3.6) + ' ' + f1(ex + 4.4) + ' ' + f1(ey + 0.5));
        return;
      }
      e.shut.setAttribute('d', '');
      var hx = rx * Math.sqrt(1 - (ly / ry) * (ly / ry));
      e.white.setAttribute('d', 'M' + f1(ex - hx) + ' ' + f1(ey + ly) + 'A' + rx + ' ' + ry + ' 0 ' + (ly < 0 ? 1 : 0) + ' 0 ' + f1(ex + hx) + ' ' + f1(ey + ly) + 'Z');
      var px = ex + lookX * 1.9, py = ey + Math.max(lookY * 1.6 + 0.6, ly + 1.7);
      py = Math.min(py, ey + ry - 1.6);
      e.pup.setAttribute('r', 1.9); e.pup.setAttribute('cx', f1(px)); e.pup.setAttribute('cy', f1(py));
    });
    var bR = 1.5 * innocent;
    S.sBrows.setAttribute('d', 'M-11 ' + f1(-10.5 - bR + 0.8 * heat) + 'L-4.5 ' + f1(-9.4 - bR) + 'M4.5 ' + f1(-11.6 - bR - 0.6 * (1 - innocent)) + 'Q8 ' + f1(-13.4 - bR) + ' 11 ' + f1(-11.5 - bR + 0.6 * innocent));
    if (innocent > 0.5) {
      S.sMouth.setAttribute('d', circleD(2.5, 7, 1.8 * innocent));
    } else {
      var smile = 1 + 1.6 * heat + 2.2 * wink;
      S.sMouth.setAttribute('d', 'M-6.5 ' + f1(6.2) + 'Q-1 ' + f1(7.5 + smile) + ' 7 ' + f1(4.2 - 0.6 * wink));
    }
    S.sCheek.setAttribute('d', circleD(-11.5, 4, 2.6) + circleD(11.5, 3, 2.6));

    // light beam
    var beamO = (eio(seg(t, 2600, 3200)) * (0.45 + 0.4 * heat) + 0.35 * pe) * (1 - eio(seg(t, 6450, 7000)));
    if (beamO > 0.01 && sunOn) {
      var nx = -toC[1], ny = toC[0], s0 = 14 * sunS, s1 = 30;
      var bx0 = sp[0] + toC[0] * 18, by0 = sp[1] + toC[1] * 18;
      S.beam.setAttribute('d', 'M' + f1(bx0 + nx * s0) + ' ' + f1(by0 + ny * s0) + 'L' + f1(T.x + nx * s1) + ' ' + f1(T.y + ny * s1) +
        'A' + s1 + ' ' + s1 + ' 0 0 1 ' + f1(T.x - nx * s1) + ' ' + f1(T.y - ny * s1) + 'L' + f1(bx0 - nx * s0) + ' ' + f1(by0 - ny * s0) + 'Z');
      S.beamGrad.setAttribute('x1', f1(bx0)); S.beamGrad.setAttribute('y1', f1(by0));
      S.beamGrad.setAttribute('x2', f1(T.x)); S.beamGrad.setAttribute('y2', f1(T.y));
      S.beam.setAttribute('opacity', f2(clamp(beamO)));
    } else S.beam.setAttribute('opacity', 0);

    // umbrella shadow swings with the sun
    var dU = [S.U[0] - sp[0], S.U[1] - sp[1]], dm = Math.hypot(dU[0], dU[1]) || 1;
    var elev = Math.sin(clamp(sunAngle(t), 0, 90) * Math.PI / 180);
    var sunUp = eio(seg(t, 2500, 3000));
    var slen = (36 * (1 - elev) + 5) * sunUp;
    var shx = S.U[0] + lerp(2, dU[0] / dm * slen, sunUp), shy = S.U[1] + lerp(4, dU[1] / dm * slen, sunUp);
    S.ushadow.setAttribute('cx', f1(shx)); S.ushadow.setAttribute('cy', f1(shy));
    S.ushadow.setAttribute('rx', f1(21 * uS * (1 + 0.25 * (1 - elev) * sunUp))); S.ushadow.setAttribute('ry', f1(18 * uS));
    S.ushadow.setAttribute('transform', 'rotate(' + f1(Math.atan2(dU[1], dU[0]) * 180 / Math.PI * sunUp) + ' ' + f1(shx) + ' ' + f1(shy) + ')');
    S.ushadow.setAttribute('opacity', f2(0.24 * uS));

    // global warmth
    S.tint.setAttribute('opacity', f2(0.11 * heat + 0.05 * pe + 0.06 * Math.sin(Math.PI * seg(t, 6900, 7800))));

    // ---- the chip ----
    var tan = tanAt(t), bt = bandTanAt(t);
    var body = mix(S.vRGB, S.dRGB, tan);
    S.disc.setAttribute('fill', body);
    S.band.setAttribute('fill', mix(S.vRGB, S.dRGB, bt));
    S.flash.setAttribute('opacity', f2(0.45 * pe * (t < 5500 ? 1 : 0) + 0.5 * Math.sin(Math.PI * seg(t, 6480, 6880)) * 0.6));
    var life = eoC(seg(t, 1000, 1250)) * (1 - eioC(seg(t, 7020, 7220)));   // face/limbs present
    var lim = backOut(seg(t, 1080, 1320), 2) * (1 - eioC(seg(t, 7000, 7180)));

    // chip transform
    var sc = chipPop(T) * (1 + GROW * eoC(seg(t, 1000, 1250)) * (1 - eioC(seg(t, 7020, 7220))));
    var dx = 0, dy = 0, rotC = 0, sx = 1, sy = 1, shOff = 0;
    if (t > 860 && t < 1080) dx = 1.6 * Math.sin((t - 860) * 0.17) * (1 - seg(t, 860, 1080));
    sy *= 1 + spring(t - 1000, 0.09, 4, 120); sx *= 1 - spring(t - 1000, 0.06, 4, 120);
    // smug hop onto the chair
    var hop = Math.sin(Math.PI * seg(t, 1660, 1880));
    dy -= 9 * hop; shOff += 6 * hop;
    sy *= 1 + 0.06 * hop + spring(t - 1880, -0.08, 4, 110); sx *= 1 + spring(t - 1880, 0.06, 4, 110);
    // lie back
    var lie = eio(seg(t, 2150, 2450)) * (1 - eio(seg(t, 5450, 5700)));
    rotC += -11 * lie; dy -= 3 * lie; sy *= 1 - 0.05 * lie;
    // dozing breaths
    var doze = seg(t, 3150, 3400) * (1 - seg(t, 5350, 5420));
    var br = Math.sin(2 * Math.PI * (t - 3300) / 760);
    sx *= 1 + 0.03 * br * doze; sy *= 1 + 0.03 * br * doze;
    // jolt awake
    var jolt = Math.sin(Math.PI * seg(t, 5400, 5560));
    dy -= 6 * jolt; shOff += 4 * jolt; sy *= 1 + 0.07 * jolt;
    // notice: tiny recoil
    sy *= 1 + spring(t - 6200, 0.06, 5, 110);
    // glare: lean toward the sun
    var lean = eio(seg(t, 6450, 6620)) * (1 - eio(seg(t, 6850, 7000)));
    rotC += 6 * S.sx * lean;
    // final lift & plonk into place
    if (t >= 7200 && t < 7330) { var r1 = eo(seg(t, 7200, 7330)); sc *= lerp(1, 1.1, r1); dy -= 4 * r1; shOff += 6 * r1; }
    else if (t >= 7330 && t < 7400) { var r2 = ei(seg(t, 7330, 7400)); sc *= lerp(1.1, 0.92, r2); dy -= 4 * (1 - r2); shOff += 6 * (1 - r2); }
    else if (t >= 7400) { var dd = t - 7400; sc *= 1 - 0.08 * Math.exp(-dd / 110) * Math.cos(2 * Math.PI * 4.5 * dd / 1000); }
    S.chip.setAttribute('transform', 'translate(' + f1(T.x + dx) + ',' + f1(T.y + dy) + ') rotate(' + f1(rotC) + ') scale(' + (sc * sx).toFixed(4) + ',' + (sc * sy).toFixed(4) + ')');
    S.csh.setAttribute('cx', f1(T.x + 1.5 + shOff * 0.3)); S.csh.setAttribute('cy', f1(T.y + 3.5 + shOff));
    S.csh.setAttribute('rx', f1(CR * Math.min(sc, 1.4))); S.csh.setAttribute('ry', f1(CR * Math.min(sc, 1.4)));
    S.csh.setAttribute('opacity', f2(0.28 - shOff * 0.012));

    // text: shrinks to the bottom while the chip has a face; Na -> Ni on the last pulse
    var tl = eoC(seg(t, 1000, 1250)) * (1 - eioC(seg(t, 7080, 7330)));
    S.txtG.setAttribute('transform', 'translate(0,' + f1(12.5 * tl) + ') scale(' + f2(lerp(1, 0.52, tl)) + ')');
    var sw = eio(seg(t, 5150, 5400));
    S.txtV.setAttribute('opacity', f2(1 - sw)); S.txtD.setAttribute('opacity', f2(sw));
    // hide text while the mouth / bubble need the space? keep - it's below the mouth

    // limbs
    var LP = poseAt(POSE_L, t), RP = poseAt(POSE_R, t);
    // breathing arms + sleepy flop
    var legCross = lie;
    var limbDefs = [
      { sh: [-19, 3], p: [-LP[0], LP[1]], e: [-LP[2], LP[3]] },
      { sh: [19, 3], p: [RP[0], RP[1]], e: [RP[2], RP[3]] },
      { sh: [-7, 19], p: [lerp(-9, 5, legCross), lerp(33, 33, legCross) + 2 * Math.sin(t / 90) * seg(t, 5420, 5450) * 0], e: [lerp(-9, -6, legCross), 27] },
      { sh: [7, 19], p: [lerp(9, 13, legCross) + 1.5 * Math.sin(2 * Math.PI * (t - 2400) / 520) * lie * (1 - doze), lerp(33, 30, legCross)], e: [lerp(9, 11, legCross), 26] }
    ];
    var lc = mix(S.vRGB, S.dRGB, tan);
    limbDefs.forEach(function (d, k) {
      var Lg = S.limbs[k];
      var px = lerp(d.sh[0], d.p[0], lim), py = lerp(d.sh[1], d.p[1], lim);
      var ex = lerp(d.sh[0], d.e[0], lim), ey = lerp(d.sh[1], d.e[1], lim);
      var dp = 'M' + f1(d.sh[0]) + ' ' + f1(d.sh[1]) + 'Q' + f1(ex) + ' ' + f1(ey) + ' ' + f1(px) + ' ' + f1(py);
      Lg.ink.setAttribute('d', dp); Lg.col.setAttribute('d', dp);
      Lg.col.setAttribute('stroke', lc); Lg.end.setAttribute('fill', lc);
      Lg.end.setAttribute('cx', f1(px)); Lg.end.setAttribute('cy', f1(py));
      var er = 3.6 * clamp(lim * 1.5);
      Lg.end.setAttribute('rx', f1(k > 1 ? er * 1.15 : er)); Lg.end.setAttribute('ry', f1(k > 1 ? er * 0.85 : er));
      Lg.g.setAttribute('opacity', lim > 0.02 ? 1 : 0);
    });

    // face
    S.face.setAttribute('opacity', life > 0.01 ? 1 : 0);
    S.face.setAttribute('transform', 'translate(0,' + f1(-4 * (1 - life)) + ') scale(' + f2(Math.max(0.001, backOut(clamp(life), 2))) + ')');
    var open = kf([[0, 1], [1600, 1], [1650, 0.05], [1720, 1], [1940, 1], [2050, 0.1],
      [5750, 0.1], [5900, 0.35], [6000, 0.35], [6060, 0.05], [6130, 0.55], [6180, 0.6], [6240, 1.3], [6420, 1.3], [6520, 0.6], [6850, 0.6], [6950, 1]], t);
    var lookList = [[0, [0, 0]], [1120, [-1, -0.2], 130], [1330, [1, -0.3], 150], [1560, [0.9, -0.9], 140], [1760, [0, 0.1], 140],
      [5900, [0, 0.2], 120], [6080, [0, 1], 140], [6440, [0, 0], 0], [6950, [0, 0], 160]];
    var lx = sched(lookList.map(function (k) { return [k[0], k[1][0], k[2]]; }), t, eoC);
    var ly = sched(lookList.map(function (k) { return [k[0], k[1][1], k[2]]; }), t, eoC);
    var glare = eio(seg(t, 6440, 6560)) * (1 - eio(seg(t, 6880, 6960)));
    var sv = [sp[0] - T.x, sp[1] - T.y], sm = Math.hypot(sv[0], sv[1]) || 1;
    lx = lerp(lx, sv[0] / sm, glare); ly = lerp(ly, sv[1] / sm, glare);
    S.eyes.forEach(function (e) {
      var ex = e.sd * 6.9, ey = -6, o = open;
      if (o < 0.18) {
        e.white.setAttribute('ry', 0); e.pup.setAttribute('ry', 0); e.glint.setAttribute('r', 0);
        e.shut.setAttribute('d', 'M' + f1(ex - 3.6) + ' ' + f1(ey) + 'Q' + f1(ex) + ' ' + f1(ey + 2.4) + ' ' + f1(ex + 3.6) + ' ' + f1(ey));
        return;
      }
      e.shut.setAttribute('d', '');
      var big = Math.max(1, o), ry = 4.6 * Math.min(1, o) * (big > 1 ? 1 + (big - 1) * 0.6 : 1), rx = 3.7 * (big > 1 ? 1 + (big - 1) * 0.5 : 1);
      e.white.setAttribute('rx', f1(rx)); e.white.setAttribute('ry', f1(ry));
      var pr = big > 1 ? 1.7 : 2.1;
      var px = ex + lx * (rx - pr - 0.4), py = ey + ly * Math.max(0, ry - pr - 0.4);
      e.pup.setAttribute('cx', f1(px)); e.pup.setAttribute('cy', f1(py));
      e.pup.setAttribute('rx', f1(pr)); e.pup.setAttribute('ry', f1(Math.min(pr * 1.1, ry - 0.3)));
      e.glint.setAttribute('cx', f1(px - 0.7)); e.glint.setAttribute('cy', f1(py - 0.8)); e.glint.setAttribute('r', 0.75);
    });
    // brows: raised in surprise, knitted in the glare
    var sur = eio(seg(t, 6200, 6280)) * (1 - eio(seg(t, 6420, 6500)));
    var bY = -13 - 2.4 * sur, knit = glare;
    var browVis = (t > 5750 && t < 7000) || (t > 1000 && t < 1950);
    S.brows.setAttribute('d', browVis ? 'M-10.5 ' + f1(bY - 0.6 * sur) + 'L-3.8 ' + f1(bY + 2.2 * knit) + 'M3.8 ' + f1(bY + 2.2 * knit) + 'L10.5 ' + f1(bY - 0.6 * sur) : '');
    // mouth: smile / sleepy o / shocked O / grumpy line
    var smileOn = (t < 5400), shock = sur, grump = glare;
    var md;
    var mo = Math.max(shock * 1, (doze > 0.5 ? 0.35 : 0));
    if (mo > 0.3) {
      md = circleD(0, 2.6, f1(1.1 + 1.6 * shock));
      S.mouth.setAttribute('fill', INK);
    } else {
      var c = smileOn ? 3.2 : (grump > 0.3 ? -2 : 0.5);
      md = 'M-4 1.6Q0 ' + f1(1.6 + c) + ' 4 1.6';
      S.mouth.setAttribute('fill', 'none');
    }
    S.mouth.setAttribute('d', md);
    // sleep bubble that pops on waking
    var bub = 0;
    if (t > 3350 && t < 5400) bub = clamp(0.5 + 0.5 * Math.sin(2 * Math.PI * (t - 3300) / 760 - 1.2)) * seg(t, 3350, 3800);
    var bubR = bub * 4.4 * (t > 5100 ? 1 + 0.5 * seg(t, 5100, 5400) : 1);
    if (t > 5100 && t < 5400) bubR = Math.max(bubR, 4.4 * (1 + 0.5 * seg(t, 5100, 5400)) * seg(t, 5100, 5250));
    S.bubble.setAttribute('cx', f1(3 + bubR * 0.7)); S.bubble.setAttribute('cy', f1(3.2 + bubR * 0.5)); S.bubble.setAttribute('r', f1(bubR));
    var pp = seg(t, 5400, 5560);
    if (pp > 0 && pp < 1) {
      var pd = '', cx = 7, cy = 5.5;
      [0, 1.2, 2.4, 3.6, 4.8].forEach(function (a) {
        var r0 = 3 + 5 * eo(pp), r1 = r0 + 2.4 * (1 - pp);
        pd += 'M' + f1(cx + Math.cos(a) * r0) + ' ' + f1(cy + Math.sin(a) * r0) + 'L' + f1(cx + Math.cos(a) * r1) + ' ' + f1(cy + Math.sin(a) * r1);
      });
      S.pop.setAttribute('d', pd); S.pop.setAttribute('opacity', f2(1 - pp));
    } else S.pop.setAttribute('opacity', 0);

    // sunglasses: drop on, slip while dozing, pushed up on waking, vanish
    var gOn = eoC(seg(t, 1950, 2150)), gUp = backOut(seg(t, 5680, 5860), 1.4), gOff = eioC(seg(t, 6850, 7000));
    var gy = -24 * (1 - gOn) + 1.6 * doze - 16.5 * gUp - 6 * gOff;
    var gr = -8 * (1 - gOn) + 4 * doze * (1 - gUp) - 6 * gUp;
    var gs = (1 - gOff) * (1 - 0.08 * gUp);
    S.glasses.setAttribute('transform', 'translate(0,' + f1(gy) + ') rotate(' + f1(gr) + ') scale(' + f2(Math.max(0.001, gs)) + ')');
    S.glasses.setAttribute('opacity', f2(seg(t, 1950, 2020) * (1 - gOff)));

    // heat wisps after each pulse
    var wd2 = '', wo = 0;
    PULSES.forEach(function (p) {
      var q = seg(t, p + 40, p + 620);
      if (q <= 0 || q >= 1) return;
      wo = Math.max(wo, Math.sin(Math.PI * q));
      [-13, 0, 13].forEach(function (ox, i) {
        var y0 = T.y - 30 - 18 * eo(q) - i % 2 * 4, x0 = T.x + ox - 6;
        wd2 += 'M' + f1(x0) + ' ' + f1(y0);
        for (var k = 1; k <= 6; k++) wd2 += 'L' + f1(x0 + 2.4 * Math.sin(k * 1.3 + q * 9 + i)) + ' ' + f1(y0 - k * 2.4);
      });
    });
    S.wisps.setAttribute('d', wd2); S.wisps.setAttribute('opacity', f2(wo * 0.85));

    // set-down ring + dust
    var rp = seg(t, 7400, 7900);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f2((1 - rp) * 0.85) : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp2 = seg(t, 7400, 7680);
    if (dp2 > 0 && dp2 < 1) {
      var ddp = '', q0 = 27 + 9 * eoC(dp2), q1 = q0 + 6 * (1 - dp2);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        ddp += 'M' + f1(T.x + Math.cos(a) * q0) + ' ' + f1(T.y + Math.sin(a) * q0) + 'L' + f1(T.x + Math.cos(a) * q1) + ' ' + f1(T.y + Math.sin(a) * q1);
      });
      S.dust.setAttribute('d', ddp); S.dust.setAttribute('opacity', f2((1 - dp2) * 0.9));
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7700, 8150);
    S.line.setAttribute('opacity', f2(eo(lp)));
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2sunbather;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2sunbather = S;
    return S;
  }

  window.CCSteal2_sunbather = {
    title: 'The Tan',
    blurb: 'Nate’s chip sets up a deck chair, umbrella and shades and dozes off in the sun - but the sun is Nick, and it bakes the chip, tan line and all, into Nick’s colour.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2sunbather = S;
      var token = {};
      root.__cc2sunbatherToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2sunbatherToken !== token) { resolve(); return; }
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


/* ── blush ── */
/* Closed Caption - "steal" moment - concept: THE CHARMER (key: blush)
 *
 * Storyboard (ms) - top-down felt table, caption rows 1/2/3/CC.
 *    0- 700  Table deals in: rows drop in with a soft overshoot, chips pop on.
 *  900-1700  Camera eases in on Nate's row (whole row + neighbours stay in frame).
 * 1000-2200  Nick's chip struts in from the near edge along the felt gap:
 *            surge-and-coast swagger, rocking side to side, leaning back,
 *            dashed ring spinning like a rolling wheel. Other chips dim.
 * 2200-2500  Skids to a stop beside Nate's chip (overshoot, rock-forward settle).
 * 2300-2750  Faces bloom: Nick's initial shrinks into a face - half-lidded eyes,
 *            a handlebar moustache unfurls, a tiny top hat drops on with a bounce.
 *            Nate's chip gets a face too: a startled blink.
 * 2650-3450  THE CHARM: Nick raises one eyebrow... and a slow wink, with a tilt.
 *            Nate is flustered: eyes dart away/back/away, squiggle mouth,
 *            nervous wobble.
 * 3350-4000  The flower: a little Nick-coloured flower pops out with a sparkle,
 *            Nick leans in, the flower arcs over and tucks onto Nate's chip.
 *            Nate's eyes go wide, mouth an "o", gulp.
 * 4050-4450  BLUSH: Nate squeezes its eyes shut (happy arcs), bashful sway,
 *            rosy Nick-coloured cheeks bloom with blush hatch marks.
 *            Nick shoots the camera a smug brow-wiggle.
 * 4450-5250  The flush spreads out from the cheeks (soft leading edge) until
 *            the whole chip is Nick's colour; chip trembles, then a little pop
 *            and a heart floats up.
 * 5250-5800  Nate opens dreamy eyes, smiles. Nick tips his hat.
 * 5800-6600  Nick struts back off the way he came; Nate's eyes follow him.
 * 6150-6550  Nate's face, flower and cheeks fade; Nick's initial pops in.
 * 6550-7000  Set-down: the chip lifts and plonks back exactly in its spot
 *            (squash, Nick-coloured ring + dust ticks). Camera pulls back.
 * 7000-7300  Stillness.
 * 7300-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', LEAF = '#7DBE58';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, ZMAX = 1.4, STRIDE = 46;
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
  function bump(t, a, b, c, d) { return eio(seg(t, a, b)) * (1 - eio(seg(t, c, d))); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f2(v) { return Math.round(v * 100) / 100; }
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
  function rot(v, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
  function norm(v) { var m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; }

  function initialsFn(opts) {
    var d = opts.dealer || '', v = opts.victim || '';
    var same = d && v && d[0].toUpperCase() === v[0].toUpperCase();
    return function (name) {
      name = name || '?';
      if (same && (name === d || name === v)) return name.slice(0, 2);
      return name[0].toUpperCase();
    };
  }

  // ---------- path (arc-length parameterised polyline) ----------
  function makePath(start) {
    var pts = [start.slice()];
    var api = {
      line: function (b) {
        var a = pts[pts.length - 1], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
        for (var i = 1; i <= n; i++) pts.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]);
        return api;
      },
      bez: function (c1, c2, b) {
        var a = pts[pts.length - 1];
        for (var i = 1; i <= 120; i++) {
          var t = i / 120, u = 1 - t;
          pts.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
                    u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]);
        }
        return api;
      },
      build: function () {
        var cum = [0];
        for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        var L = cum[cum.length - 1];
        function at(s) {
          var n = pts.length;
          if (s <= 0) { var d0 = norm([pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]]); return { x: pts[0][0] + d0[0] * s, y: pts[0][1] + d0[1] * s, tx: d0[0], ty: d0[1] }; }
          if (s >= L) { var d1 = norm([pts[n - 1][0] - pts[n - 2][0], pts[n - 1][1] - pts[n - 2][1]]); return { x: pts[n - 1][0] + d1[0] * (s - L), y: pts[n - 1][1] + d1[1] * (s - L), tx: d1[0], ty: d1[1] }; }
          var lo = 0, hi = n - 1;
          while (hi - lo > 1) { var m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
          var f = (s - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo]);
          var d = norm([pts[hi][0] - pts[lo][0], pts[hi][1] - pts[lo][1]]);
          return { x: lerp(pts[lo][0], pts[hi][0], f), y: lerp(pts[lo][1], pts[hi][1], f), tx: d[0], ty: d[1] };
        }
        return { at: at, L: L };
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
    if (!target) {
      for (var r = 0; r < rows.length && !target; r++) if (rows[r].chips.length) { target = rows[r].chips[0]; target.target = true; others.splice(others.indexOf(target), 1); }
    }
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini };
  }

  // ---------- choreography plan ----------
  function plan(L) {
    var T = L.target, trow = L.rows[T.row];
    var sx = T.x > W / 2 ? -1 : 1;
    var sy = (L.rows.length > 1 && T.row === L.rows.length - 1) ? -1 : 1;
    var nx = T.x - sx * 42, ny = T.y + sy * Math.max(L.h * 0.5, 50);
    var by = sy === 1 ? trow.y + L.h + L.g / 2 : trow.y - L.g / 2;
    var startX = sx === 1 ? -60 : W + 60;
    var path = makePath([startX, by]).line([nx - sx * 46, by]).bez([nx - sx * 22, by], [nx - sx * 4, lerp(by, ny, 0.4)], [nx, ny]).build();
    // camera framing: whole target row's chips + Nick's stop point
    var xs = [nx, 70 - 20 + 34];
    L.rows.forEach(function (r) { if (Math.abs(r.i - T.row) <= 1) r.chips.forEach(function (c) { xs.push(c.x); }); });
    var minX = Math.min.apply(null, xs) - 34, maxX = Math.max.apply(null, xs) + 34;
    var zoom = Math.min(ZMAX, W / (maxX - minX + 8));
    var half = W / (2 * zoom), halfY = H / (2 * zoom);
    var camX = clamp((minX + maxX) / 2, half, W - half);
    var camY = clamp((T.y + ny) / 2 + 10, halfY, Math.max(halfY, 610 - halfY));
    var v2 = norm([T.x - nx, T.y - ny]); // Nick -> Nate
    return { zoom: zoom, sx: sx, sy: sy, nx: nx, ny: ny, by: by, path: path, camX: camX, camY: camY, v2: v2, vN: [-v2[0], -v2[1]] };
  }

  // Nick's distance along his path
  function nickS(P, t) {
    var D = P.path.L, n = Math.max(2, Math.round(D / STRIDE));
    if (t < 2200) {
      var p = seg(t, 1000, 2200), env = Math.pow(Math.sin(Math.PI * p), 2), DD = D + 8;
      return -10 + (DD + 10) * eo(p) - (DD / (6 * n)) * Math.sin(2 * Math.PI * n * p) * env;
    }
    if (t < 5850) return D + 8 * Math.exp(-(t - 2200) / 90) * Math.cos(2 * Math.PI * 3 * (t - 2200) / 1000);
    var q = seg(t, 5850, 6650), DX = D + 110, env2 = Math.sin(Math.PI * q);
    var e = q < .4 ? (q * q) / .8 : q - .2; e /= 0.8;
    return D - DX * e + (DX / (6 * n)) * Math.sin(2 * Math.PI * n * q) * env2 * 0.6;
  }
  function strutAmt(t) { return clamp(seg(t, 1000, 1150) * (1 - seg(t, 2100, 2250))) + seg(t, 5850, 6000); }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-blush-' + (++uid) + '-';
    var L = layout(opts), P = plan(L), T = L.target;
    var dCol = opts.dealerColor || '#E8559E';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var clipFull = el('path', { d: '' }, el('clipPath', { id: id + 'flush', clipPathUnits: 'userSpaceOnUse' }, defs));
    var clipSoft = el('path', { d: '' }, el('clipPath', { id: id + 'soft', clipPathUnits: 'userSpaceOnUse' }, defs));

    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = el('g', {}, svg);
    var tableG = el('g', {}, cam);
    el('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    el('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    el('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    function chipBody(parent, color) {
      var g = el('g', {}, parent);
      el('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
      var ring = el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
      el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
      return { g: g, ring: ring };
    }
    function chipText(parent, txt) {
      var tx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, parent);
      tx.textContent = txt;
      return tx;
    }

    var rowsG = [], chipsG = [], V = {};
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
          chipBody(tg, c.color);
          // the flush: soft leading edge, then full colour, both from the cheeks
          chipBody(el('g', { 'clip-path': 'url(#' + id + 'soft)', opacity: 0.5 }, tg), dCol);
          chipBody(el('g', { 'clip-path': 'url(#' + id + 'flush)' }, tg), dCol);
          var txV = chipText(tg, c.ini), txD = chipText(tg, L.ini(opts.dealer));
          // cheeks
          var cheeks = el('g', {}, tg);
          var chD = [-1, 1].map(function (k) { return el('ellipse', { cx: k * 11.5, cy: 5, rx: 4.8, ry: 3.1, fill: dCol }, cheeks); });
          var chW = [-1, 1].map(function (k) { return el('ellipse', { cx: k * 11.5, cy: 5, rx: 4.8, ry: 3.1, fill: '#FFFFFF', opacity: 0 }, cheeks); });
          var hatch = '';
          [-1, 1].forEach(function (k) { for (var q = -1; q <= 1; q++) { var x = k * 11.5 + q * 2.6; hatch += 'M' + f1(x - 0.9) + ' ' + f1(6.6) + 'L' + f1(x + 0.9) + ' ' + f1(3.4); } });
          var hatchP = el('path', { d: hatch, stroke: '#FFFFFF', 'stroke-width': 1.1, 'stroke-linecap': 'round', fill: 'none', opacity: 0 }, cheeks);
          // face
          var face = el('g', {}, tg);
          var eyes = [-1, 1].map(function (k) {
            var g = el('g', {}, face);
            return {
              k: k,
              scl: el('ellipse', { cx: k * 7.5, cy: -3.5, rx: 4.6, ry: 4.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4 }, g),
              pup: el('ellipse', { cx: k * 7.5, cy: -3.5, rx: 2.5, ry: 2.5, fill: INK }, g),
              gl: el('circle', { r: 0.8, fill: '#FFFFFF' }, g),
              arc: el('path', { d: 'M' + (k * 7.5 - 4) + ' -2.2Q' + (k * 7.5) + ' -7.2 ' + (k * 7.5 + 4) + ' -2.2', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g)
            };
          });
          var mouth = el('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, face);
          var mouthO = el('ellipse', { cx: 0, cy: 8.5, rx: 2.3, ry: 2.8, fill: INK }, face);
          V = { wrap: wrap, sh: sh, tg: tg, txV: txV, txD: txD, cheeks: cheeks, chD: chD, chW: chW, hatch: hatchP, face: face, eyes: eyes, mouth: mouth, mouthO: mouthO, c: c };
        } else {
          var cg = el('g', {}, wrap); chipBody(cg, c.color); chipText(cg, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });
    var ripple = el('circle', { fill: 'none', stroke: dCol, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- Nick's chip ----
    var nLayer = el('g', {}, cam);
    var nSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, nLayer);
    var nG = el('g', {}, nLayer);
    var nBody = chipBody(nG, dCol);
    var nTx = chipText(nG, L.ini(opts.dealer));
    var nFace = el('g', {}, nG);
    var nEyes = [-1, 1].map(function (k) {
      var g = el('g', {}, nFace);
      return {
        k: k,
        scl: el('circle', { cx: k * 7.5, cy: -4.5, r: 4.5, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4 }, g),
        pup: el('circle', { cx: k * 7.5, cy: -4.5, r: 2.4, fill: INK }, g),
        gl: el('circle', { r: 0.8, fill: '#FFFFFF' }, g),
        lid: el('path', { d: '', fill: dCol, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g),
        shut: el('path', { d: 'M' + (k * 7.5 - 4.2) + ' -4Q' + (k * 7.5) + ' -1.2 ' + (k * 7.5 + 4.2) + ' -4', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g)
      };
    });
    var nBrows = el('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round' }, nFace);
    var nSmile = el('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round' }, nFace);
    var nStache = el('g', {}, nFace);
    el('path', { d: 'M0 2.4C-1.8 0.6 -4.8 0.2 -7.4 1.8C-9.4 3 -10.6 1.8 -10.4 -0.4C-11.8 1.4 -10.9 5 -7.2 4.9C-4.6 4.8 -2 4.1 0 5C2 4.1 4.6 4.8 7.2 4.9C10.9 5 11.8 1.4 10.4 -0.4C10.6 1.8 9.4 3 7.4 1.8C4.8 0.2 1.8 0.6 0 2.4Z', fill: INK, transform: 'translate(0,3.4)' }, nStache);
    var nHat = el('g', {}, nG);
    var hatIn = el('g', {}, nHat);
    el('rect', { x: -11.5, y: -2.4, width: 23, height: 4.4, rx: 2.2, fill: INK }, hatIn);
    el('rect', { x: -7.2, y: -15.5, width: 14.4, height: 14.5, rx: 2, fill: INK }, hatIn);
    el('rect', { x: -7.2, y: -5.6, width: 14.4, height: 3.6, fill: dCol }, hatIn);
    el('rect', { x: -5.2, y: -13.6, width: 2.2, height: 6.5, rx: 1.1, fill: '#FFFFFF', opacity: 0.3 }, hatIn);

    // ---- flower, sparkle, heart (top layer) ----
    var fxLayer = el('g', {}, cam);
    var flower = el('g', {}, fxLayer);
    [-1, 1].forEach(function (k) { el('ellipse', { cx: k * 5, cy: 5.2, rx: 4.2, ry: 2, fill: LEAF, stroke: INK, 'stroke-width': 1.1, transform: 'rotate(' + (k * 30) + ' ' + (k * 5) + ' 5.2)' }, flower); });
    for (var pi = 0; pi < 5; pi++) {
      var a = -Math.PI / 2 + pi * 2 * Math.PI / 5;
      el('circle', { cx: f1(Math.cos(a) * 4.3), cy: f1(Math.sin(a) * 4.3), r: 3.7, fill: dCol, stroke: INK, 'stroke-width': 1.2 }, flower);
    }
    el('circle', { r: 2.6, fill: '#FFD45C', stroke: INK, 'stroke-width': 1.1 }, flower);
    var sparkle = el('path', { d: '', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0 }, fxLayer);
    var heart = el('path', { d: 'M0 3.6C-1.6 2.2 -6 -0.6 -6 -3.6C-6 -6.2 -3 -7.4 0 -4.6C3 -7.4 6 -6.2 6 -3.6C6 -0.6 1.6 2.2 0 3.6Z', fill: dCol, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round', opacity: 0 }, fxLayer);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, P: P, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, ripple: ripple, dust: dust,
      clipFull: clipFull, clipSoft: clipSoft,
      nSh: nSh, nG: nG, nRing: nBody.ring, nTx: nTx, nFace: nFace, nEyes: nEyes, nBrows: nBrows, nSmile: nSmile, nStache: nStache, nHat: nHat, hatIn: hatIn,
      flower: flower, sparkle: sparkle, heart: heart, line: line
    };
  }

  // eye lid (covers the top of an eye down to Ly, chip-local)
  function lidD(cx, cy, r, Ly) {
    if (Ly <= -r + 0.05) return '';
    if (Ly >= r - 0.05) return circleD(cx, cy, r + 0.3);
    var dx = Math.sqrt(r * r - Ly * Ly);
    return 'M' + f1(cx - dx) + ' ' + f1(cy + Ly) + 'A' + f1(r) + ' ' + f1(r) + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(cx + dx) + ' ' + f1(cy + Ly) + 'Z';
  }
  // look schedule: [[t, vec|fn, dur]]
  function lookVec(list, t, ctx) {
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    function v(x) { return typeof x === 'function' ? x(ctx) : x; }
    var b = v(list[k][1]);
    if (k === 0) return b;
    var p = clamp((t - list[k][0]) / (list[k][2] || 80));
    if (p >= 1) return b;
    var a = v(list[k - 1][1]), q = backOut(p, 1.4);
    return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var P = S.P, L = S.L, T = L.target, V = S.V, sx = P.sx;

    // camera
    var zk = eioC(seg(t, 900, 1700)) * (1 - eioC(seg(t, 6350, 7000)));
    var Z = lerp(1, P.zoom, zk);
    var ccx = lerp(W / 2, P.camX, zk), ccy = lerp(H / 2, P.camY, zk);
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1500, 1850)) * (1 - eio(seg(t, 6300, 6800)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ===== Nick =====
    var s = nickS(P, t), np = P.path.at(s), sa = strutAmt(t);
    var phase = 2 * Math.PI * s / STRIDE;
    var nRot = 11 * Math.sin(phase) * sa;
    nRot += -sx * 7 * clamp(seg(t, 1000, 1250) * (1 - seg(t, 2050, 2300)));       // leaning back, cool
    nRot += sx * 7 * seg(t, 5850, 6050);                                           // leans into the exit
    nRot += spring(t - 2200, sx * 9, 2.4, 170);                                    // skid: tips forward, settles
    nRot += -sx * 7 * bump(t, 2950, 3100, 3300, 3480);                             // tilt into the wink
    nRot += sx * 4 * bump(t, 3450, 3600, 3950, 4150);                              // lean in with the flower
    nRot += -sx * 5 * bump(t, 5380, 5500, 5650, 5800);                             // bow with the hat tip
    var lean = 5 * bump(t, 3450, 3620, 3950, 4200);
    var nx = np.x + P.v2[0] * lean, ny = np.y + P.v2[1] * lean;
    var actK = eio(seg(t, 2250, 2600)) * (1 - eio(seg(t, 6000, 6350))), AS = 1 + 0.3 * actK;
    var bob = 1 + 0.035 * Math.abs(Math.sin(phase)) * sa;
    var nSc = AS * bob + spring(t - 2200, 0.06, 3.5, 110) + spring(t - 2330, 0.05, 4, 100);
    S.nG.setAttribute('transform', 'translate(' + f1(nx) + ',' + f1(ny) + ') rotate(' + f1(nRot) + ') scale(' + nSc.toFixed(3) + ')');
    S.nRing.setAttribute('transform', 'rotate(' + f1((s - P.path.L) / CR * 57.3 * 0.8) + ')');
    var lift = Math.max(sa, actK);
    S.nSh.setAttribute('cx', f1(nx + 1.5 + 2 * lift)); S.nSh.setAttribute('cy', f1(ny + 3.5 + 3 * lift));
    S.nSh.setAttribute('opacity', f2(0.28 - 0.06 * lift));

    // Nick: initial -> face
    var nTxK = 1 - eio(seg(t, 2280, 2400));
    S.nTx.setAttribute('transform', 'scale(' + Math.max(0.001, nTxK).toFixed(3) + ')');
    S.nTx.setAttribute('opacity', nTxK > 0.02 ? 1 : 0);
    var fk = seg(t, 2330, 2530), fK = fk <= 0 ? 0.001 : backOut(fk, 2);
    S.nFace.setAttribute('transform', 'scale(' + fK.toFixed(3) + ')');
    S.nFace.setAttribute('opacity', fk > 0 ? 1 : 0);
    var mk = seg(t, 2420, 2620);
    S.nStache.setAttribute('transform', 'translate(0,3) scale(' + (mk <= 0 ? 0.001 : backOut(mk, 2.4)).toFixed(3) + ',' + (0.6 + 0.4 * eo(mk)).toFixed(3) + ') translate(0,-3)');
    var hk = seg(t, 2470, 2720);
    var hatY = -20 - 22 * (1 - eoC(hk)) + (hk > 0.6 ? 0 : 0) + spring(t - 2640, 1.8, 4, 90);
    var tip = bump(t, 5350, 5500, 5600, 5800);
    var hatRot = -sx * 12 + spring(t - 2640, sx * 8, 3, 140) - sx * 30 * tip;
    S.nHat.setAttribute('transform', 'translate(' + f1(-sx * 3 - sx * 3 * tip) + ',' + f1(hatY - 13 * tip) + ') rotate(' + f1(hatRot) + ')');
    S.nHat.setAttribute('opacity', f2(eo(seg(t, 2470, 2560))));

    // Nick: eyes
    var toNate = rot(P.v2, -nRot);
    var near = sx; // eye on the side of Nate
    var nLook = lookVec([[0, toNate], [4380, [0, 0.25], 110], [4900, toNate, 110], [5850, [-sx, 0], 120]], t);
    var lidBase = kf([[0, -1], [2550, -1], [2700, 0.1], [5380, 0.1], [5470, 1.05], [5680, 1.05], [5780, 0.1]], t);
    var wink = kf([[0, 0], [2950, 0], [3170, 1], [3330, 1], [3450, 0]], t, eio);
    S.nEyes.forEach(function (E) {
      var ex = E.k * 7.5, ey = -4.5, Ly;
      Ly = E.k === near ? lerp(lidBase, 1.05, wink) : lidBase;
      if (E.k === near) Ly += 0; else Ly = Math.min(Ly, lidBase + 0.0);
      var shut = Ly >= 0.98;
      E.scl.setAttribute('opacity', shut ? 0 : 1); E.pup.setAttribute('opacity', shut ? 0 : 1); E.gl.setAttribute('opacity', shut ? 0 : 1);
      E.lid.setAttribute('d', shut ? '' : lidD(ex, ey, 4.5, Ly * 4.5));
      E.shut.setAttribute('opacity', shut ? 1 : 0);
      var px = ex + nLook[0] * 1.9, py = ey + nLook[1] * 1.9 + 0.6;
      E.pup.setAttribute('cx', f1(px)); E.pup.setAttribute('cy', f1(py));
      E.gl.setAttribute('cx', f1(px - 0.8)); E.gl.setAttribute('cy', f1(py - 0.9));
    });
    // brows: near one arches up for the charm, both wiggle for the camera
    var raise = 5 * eo(seg(t, 2650, 2800)) * (1 - eio(seg(t, 3450, 3650))) + spring(t - 2650, 1.2, 5, 90);
    var wig = 2.4 * Math.max(0, Math.sin(2 * Math.PI * (t - 4420) / 260)) * bump(t, 4400, 4440, 4880, 4920);
    var bd = '';
    [-1, 1].forEach(function (k) {
      var ex = k * 7.5, r = (k === near ? raise : 0) + wig, by = -10.6 - r;
      var inner = k === near ? 0.4 : 1.2; // smug: far brow a touch lower at the inside
      bd += 'M' + f1(ex - k * 3.8) + ' ' + f1(by + inner) + 'Q' + f1(ex) + ' ' + f1(by - 1.8 - (k === near ? r * 0.3 : 0)) + ' ' + f1(ex + k * 3.6) + ' ' + f1(by + 0.6);
    });
    S.nBrows.setAttribute('d', bd);
    var grin = 1 + 0.6 * bump(t, 2950, 3100, 3350, 3500) + 0.5 * bump(t, 4400, 4500, 4850, 5000);
    S.nSmile.setAttribute('d', 'M' + f1(-4.2) + ' 11.2Q' + f1(0.6) + ' ' + f1(11.2 + 2.6 * grin) + ' ' + f1(4.8) + ' ' + f1(10.2 - 0.6 * grin));

    // ===== Nate =====
    var vx = T.x, vy = T.y, vRot = 0, vSc = chipPop(T);
    if (t > 1450 && t < 1750) { var qq = seg(t, 1450, 1750); vx += 1.6 * Math.sin((t - 1450) * 0.17) * (1 - qq); }  // singled out: a shiver
    vRot += 7 * Math.sin(2 * Math.PI * 6.5 * (t - 2900) / 1000) * bump(t, 2900, 3000, 3350, 3500);            // flustered wobble
    vRot += 6 * Math.sin(2 * Math.PI * 1.6 * (t - 4100) / 1000) * bump(t, 4100, 4250, 4450, 4600);            // bashful sway
    var trem = bump(t, 4500, 4600, 5150, 5250);
    vx += 0.6 * Math.sin(t * 0.23) * trem; vy += 0.5 * Math.sin(t * 0.19 + 1) * trem;
    vSc *= 1 + spring(t - 2450, 0.06, 4, 100) + spring(t - 3950, -0.07, 4, 120) + 0.05 * eio(seg(t, 4500, 5200)) * (1 - seg(t, 5250, 5260))
      + spring(t - 5250, 0.09, 3.5, 140) - 0.03 * bump(t, 5450, 5600, 5800, 6000);
    vSc *= AS;
    var dy = 0, shOff = 4 * actK;
    if (t >= 6550 && t < 6700) { var r1 = eo(seg(t, 6550, 6700)); vSc = lerp(1, 1.12, r1); dy = -3 * r1; shOff = 5 * r1; }
    else if (t >= 6700 && t < 6770) { var r2 = ei(seg(t, 6700, 6770)); vSc = lerp(1.12, 0.92, r2); dy = -3 * (1 - r2); shOff = 5 * (1 - r2); }
    else if (t >= 6770 && t < 7700) { var d = t - 6770; vSc = 1 - 0.08 * Math.exp(-d / 110) * Math.cos(2 * Math.PI * 4.5 * d / 1000); }
    vy += dy;
    V.tg.setAttribute('transform', 'translate(' + f1(vx) + ',' + f1(vy) + ') rotate(' + f1(vRot) + ') scale(' + vSc.toFixed(4) + ')');
    V.sh.setAttribute('r', f1(CR * Math.min(vSc, 1.04)));
    V.sh.setAttribute('cx', f1(T.x + 1.5 + shOff * 0.4)); V.sh.setAttribute('cy', f1(T.y + 3.5 + shOff));
    V.sh.setAttribute('opacity', f1(28 - shOff * 1.6) / 100);
    function vWorld(lx, ly) { var q = rot([lx * vSc, ly * vSc], vRot); return [vx + q[0], vy + q[1]]; }

    // letters
    var tvk = 1 - eio(seg(t, 2400, 2520));
    V.txV.setAttribute('transform', 'scale(' + Math.max(0.001, tvk).toFixed(3) + ')');
    V.txV.setAttribute('opacity', tvk > 0.02 ? 1 : 0);
    var tdk = seg(t, 6300, 6560);
    V.txD.setAttribute('transform', 'scale(' + (tdk <= 0 ? 0.001 : backOut(tdk, 2.2)).toFixed(3) + ')');
    V.txD.setAttribute('opacity', tdk > 0 ? 1 : 0);

    // face in / out
    var vfIn = seg(t, 2450, 2650), vfOut = seg(t, 6150, 6380);
    var vF = (vfIn <= 0 ? 0.001 : backOut(vfIn, 2)) * (1 - eio(vfOut)) + 0.001;
    V.face.setAttribute('transform', 'scale(' + vF.toFixed(3) + ')');
    V.face.setAttribute('opacity', vfIn > 0 && vfOut < 1 ? 1 : 0);

    // Nate eyes
    var toNick = P.vN, perp = [-toNick[1], toNick[0]], away = [-toNick[0], -toNick[1]];
    var flowerPos = null; // filled below
    var vLook = lookVec([
      [0, [0, 0]], [2560, toNick, 90],
      [2990, norm([away[0] + perp[0], away[1] + perp[1] - 0.3]), 70], [3110, toNick, 60], [3200, norm([away[0] - perp[0], away[1] - perp[1]]), 70], [3290, [0, -1], 70], [3360, toNick, 60],
      [3600, function () { return flowerPos ? norm([flowerPos[0] - vx, flowerPos[1] - vy]) : toNick; }, 60],
      [3990, [0, 0.4], 120], [5250, toNick, 120],
      [5850, function () { return norm([nx - vx, ny - vy]); }, 120]
    ], t);
    var open = kf([[0, 1], [2620, 1], [2680, 0.1], [2740, 1], [4060, 1], [4180, 0], [5250, 0], [5380, 0.62]], t, eio);
    var wide = 1 + 0.22 * bump(t, 3360, 3440, 3950, 4060) + spring(t - 3380, 0.08, 5, 80);
    V.eyes.forEach(function (E) {
      var ex = E.k * 7.5, ey = -3.5, r = 4.6 * wide, show = open > 0.12;
      E.scl.setAttribute('rx', f1(r)); E.scl.setAttribute('ry', f1(r * Math.max(0.12, open)));
      var px = ex + vLook[0] * 2.1 * wide, py = ey + vLook[1] * 2.1 * Math.max(0.3, open);
      E.pup.setAttribute('cx', f1(px)); E.pup.setAttribute('cy', f1(py));
      E.pup.setAttribute('rx', 2.5); E.pup.setAttribute('ry', f1(2.5 * Math.min(1, open * 1.4)));
      E.gl.setAttribute('cx', f1(px - 0.8)); E.gl.setAttribute('cy', f1(py - 0.8 * open));
      E.scl.setAttribute('opacity', show ? 1 : 0); E.pup.setAttribute('opacity', show ? 1 : 0); E.gl.setAttribute('opacity', show && open > 0.5 ? 1 : 0);
      E.arc.setAttribute('opacity', show ? 0 : 1);
    });
    // Nate mouth: smile c, squiggle w, "o" o
    var mc = kf([[0, 0], [5250, 0], [5400, 1]], t) + 0.5 * bump(t, 4150, 4300, 5150, 5250);
    var mw = bump(t, 2950, 3020, 3330, 3400);
    var mo = bump(t, 3370, 3450, 3990, 4100);
    V.mouthO.setAttribute('ry', f1(2.8 * Math.max(0.01, mo))); V.mouthO.setAttribute('rx', f1(2.3 * Math.max(0.01, mo)));
    V.mouthO.setAttribute('opacity', mo > 0.05 ? 1 : 0);
    var md = '';
    if (mo < 0.6) {
      var wq = 3.6 + 1.2 * mc;
      if (mw > 0.05) {
        md = 'M' + f1(-wq) + ' 8.5';
        for (var i = 1; i <= 4; i++) md += 'Q' + f1(-wq + (i - 0.5) * wq / 2) + ' ' + f1(8.5 + (i % 2 ? -1.6 : 1.6) * mw) + ' ' + f1(-wq + i * wq / 2) + ' 8.5';
      } else md = 'M' + f1(-wq) + ' 8.2Q0 ' + f1(8.2 + 4 * mc) + ' ' + f1(wq) + ' 8.2';
    }
    V.mouth.setAttribute('d', md); V.mouth.setAttribute('opacity', mo < 0.6 ? 1 : 0);

    // blush: cheeks, hatch, flush
    var ck = seg(t, 4120, 4380), cOut = 1 - eio(seg(t, 6150, 6380));
    var cs = (ck <= 0 ? 0.001 : backOut(ck, 2)) * cOut + 0.001;
    V.cheeks.setAttribute('opacity', ck > 0 && cOut > 0 ? 1 : 0);
    V.chD.forEach(function (e, i) { e.setAttribute('transform', 'translate(' + ((i ? 1 : -1) * 11.5) + ',5) scale(' + cs.toFixed(3) + ') translate(' + ((i ? -1 : 1) * 11.5) + ',-5)'); });
    var wk = 0.3 * eio(seg(t, 4950, 5250)) * cOut;
    V.chW.forEach(function (e) { e.setAttribute('opacity', f2(wk)); });
    V.hatch.setAttribute('opacity', f2(eo(seg(t, 4250, 4400)) * cOut));
    var fp = seg(t, 4450, 5250), rF = 30 * (fp < 0.5 ? 2.2 * fp * fp : lerp(0.55, 1, eo((fp - 0.5) / 0.5))) ;
    rF = 30 * eio(fp) * 0.15 + rF * 0.85;
    if (fp >= 1) rF = 40;
    var cheekR = 4.6 * eo(seg(t, 4300, 4450));
    var rFull = Math.max(cheekR > 0.3 ? 0 : 0, rF), rSoft = rF > 0.1 ? rF + 6 * Math.sin(Math.PI * Math.min(1, fp * 1.05)) + 0.5 : 0;
    S.clipFull.setAttribute('d', rFull > 0.2 ? circleD(-11.5, 5, rFull) + circleD(11.5, 5, rFull) : '');
    S.clipSoft.setAttribute('d', rSoft > 0.2 && fp < 1 ? circleD(-11.5, 5, rSoft) + circleD(11.5, 5, rSoft) : '');

    // flower: pop beside Nick, offered, arcs over, tucks onto Nate
    var fS = 0, fx = 0, fy = 0, fR = 0;
    var tuckL = [-sx * 13.5 * (P.v2[0] !== 0 ? 1 : 1), -14];
    var popK = seg(t, 3350, 3520);
    if (t >= 3350) {
      var startW = [nx + P.v2[0] * 30, ny + P.v2[1] * 30 - 2];
      var endW = vWorld(tuckL[0], tuckL[1]);
      var tr = seg(t, 3640, 3950), e = eioC(tr);
      var arcH = -22 * Math.sin(Math.PI * e);
      fx = lerp(startW[0], endW[0], e); fy = lerp(startW[1], endW[1], e) + arcH;
      fy += t < 3640 ? -1.5 * Math.sin(2 * Math.PI * (t - 3500) / 300) * seg(t, 3500, 3560) : 0;
      fS = (popK <= 0 ? 0.001 : backOut(popK, 2.4)) * (1 - eio(seg(t, 6150, 6380))) + spring(t - 3950, -0.15, 4, 90);
      fR = lerp(-25, sx * -20, e) + spring(t - 3950, 12, 3, 140) + vRot;
      fS *= (t >= 3950 ? vSc : 1);
      flowerPos = [fx, fy];
    }
    S.flower.setAttribute('transform', 'translate(' + f1(fx) + ',' + f1(fy) + ') rotate(' + f1(fR) + ') scale(' + Math.max(0.001, fS).toFixed(3) + ')');
    S.flower.setAttribute('opacity', t >= 3350 && t < 6380 ? 1 : 0);
    // recompute look with flower now known (cheap: only affects 3600-3990)
    if (t >= 3600 && t < 3990) {
      var lv = norm([fx - vx, fy - vy]);
      V.eyes.forEach(function (E) {
        var ex = E.k * 7.5, ey = -3.5, px = ex + lv[0] * 2.1 * wide, py = ey + lv[1] * 2.1;
        E.pup.setAttribute('cx', f1(px)); E.pup.setAttribute('cy', f1(py));
        E.gl.setAttribute('cx', f1(px - 0.8)); E.gl.setAttribute('cy', f1(py - 0.8));
      });
    }
    // sparkle on the pop
    var spk = seg(t, 3350, 3620);
    if (spk > 0 && spk < 1) {
      var sd = '', r0 = 9 + 8 * eoC(spk), r1b = r0 + 4 * (1 - spk);
      for (var si = 0; si < 6; si++) { var an = -Math.PI / 2 + si * Math.PI / 3; sd += 'M' + f1(fx + Math.cos(an) * r0) + ' ' + f1(fy + Math.sin(an) * r0) + 'L' + f1(fx + Math.cos(an) * r1b) + ' ' + f1(fy + Math.sin(an) * r1b); }
      S.sparkle.setAttribute('d', sd); S.sparkle.setAttribute('opacity', f2(1 - spk));
    } else S.sparkle.setAttribute('opacity', 0);

    // heart floats up at the pop
    var hp = seg(t, 5250, 6050);
    if (hp > 0 && hp < 1) {
      var hb = vWorld(sx * 6, P.sy === 1 ? -24 : 24);
      var hs = backOut(seg(t, 5250, 5450), 2.6) * (1 - 0.2 * hp);
      S.heart.setAttribute('transform', 'translate(' + f1(hb[0] + sx * 4 * Math.sin(hp * 5)) + ',' + f1(hb[1] - 26 * eo(hp)) + ') scale(' + f2(hs * 1.15) + ')');
      S.heart.setAttribute('opacity', f2(1 - eio(seg(hp, 0.6, 1))));
    } else S.heart.setAttribute('opacity', 0);

    // set-down ring + dust
    var rp = seg(t, 6770, 7270);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 6770, 7050);
    if (dp > 0 && dp < 1) {
      var dd = '', ra = 27 + 9 * eoC(dp), rb = ra + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + f1(T.x + Math.cos(a) * ra) + ' ' + f1(T.y + Math.sin(a) * ra) + 'L' + f1(T.x + Math.cos(a) * rb) + ' ' + f1(T.y + Math.sin(a) * rb);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7300, 7700);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2blush;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2blush = S;
    return S;
  }

  window.CCSteal2_blush = {
    title: 'The Charmer',
    blurb: 'Nick’s chip struts over in a moustache and top hat, raises an eyebrow, winks and offers a flower; Nate’s flustered chip blushes Nick’s colour from the cheeks out, and is won over for good.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2blush = S;
      var token = {};
      root.__cc2blushToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2blushToken !== token) { resolve(); return; }
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


/* ── titration ── */
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


/* ── shellgame ── */
/*
  CLOSED CAPTION - "The Shell Game" steal  (KEY: shellgame)

  Storyboard (ms, deterministic; picture = f(t)):
   B1    0-250    Establish: felt table, caption rows (1, 2, 3, CC), chips on printed bet spots.
   B2  250-1000   Single out: Nate's chip squashes, hops, lands; a blue pulse ring; the rest of the table dims.
   B3  880-1400   Push in on Nate's row. The chip gives a nervous little shiver (1030-1160).
   B4 1150-1650   Three red paper cups drop from above - the centre one onto Nate's chip first -
                  stretch on the fall, squash + wobble on landing, impact ticks.
   B5 1420-1850   The dealer's gloved hands (pink cuffs, dark sleeves) swoop in from across the table.
   B6 1880-4450   The hustle: 10 moves on overlapping front/back arcs, accelerating 360 -> 140 ms,
                  cups lean into the motion and follow through, smears at top speed, a feint,
                  a three-way rotation, then one slow, taunting swap. Chip cup rests in the middle.
   B7 4580-5250   Reveal: left cup lifted (empty spot) and flicked away; right cup (empty) flicked away.
   B8 5460-5620   Last cup: a press (anticipation), then yanked up and off.
   B9 5620-6240   The chip pops up, flipping Na/Ni - blue/pink - slowing, and lands on its exact spot, pink.
   B10 6240-6900  Coin-settle wobble, bounce, pink pulse rings; hands spread "ta-da" and withdraw.
   B11 6700-7450  Pull back to the whole table; stillness.
   B12 7450-10000 "Nick stole Nate's chip." fades up and holds (~2.5 s).
*/
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', SPOT = '#F3E7CF', FELT = '#2E6B4F';
  var CUP = '#E0503C', CUP_DK = '#A93A2B', CUP_TOP = '#F2836C', CREAM = '#FFF1D6';
  var GLOVE = '#FFFDF6', SLEEVE = '#3A322E';
  var FONT = "Fredoka, Nunito, 'Trebuchet MS', system-ui, sans-serif";
  var PI = Math.PI;

  function E(tag, a, p) { var e = document.createElementNS(NS, tag); if (a) for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sg(t, a, b) { return cl((t - a) / (b - a), 0, 1); }
  function lr(a, b, u) { return a + (b - a) * u; }
  function ioC(u) { return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function oC(u) { return 1 - Math.pow(1 - u, 3); }
  function iC(u) { return u * u * u; }
  function oQ(u) { return 1 - (1 - u) * (1 - u); }
  function ioS(u) { return -(Math.cos(PI * u) - 1) / 2; }
  function oB(u) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')';
  }

  /* ---------------- timeline plan (geometry independent) ---------------- */
  var HOP0 = 250, PUSH0 = 880, PUSH1 = 1400, FALL = 230;
  var DROP = [1260, 1150, 1340];          // cup 1 starts over the chip
  var ENTER = 1420, SH0 = 1880, GAP = 18;
  var MOVES = [['s', 1, 2, 360], ['s', 0, 1, 300], ['s', 1, 2, 260], ['f', 0, 2, 280], ['s', 0, 1, 200],
               ['s', 0, 2, 175], ['s', 1, 2, 150], ['s', 0, 1, 140], ['c', 0, 2, 220], ['s', 0, 2, 320]];
  var SEGS = [[], [], []], HMOVES = [], END_SLOT, CUP_AT_END, SH_END;
  (function () {
    var slotOf = [0, 1, 2], cupAt = [0, 1, 2], t = SH0;
    MOVES.forEach(function (m, k) {
      var t0 = t, t1 = t + m[3];
      if (m[0] !== 'c') {
        var i = m[1], j = m[2], a = cupAt[i], b = cupAt[j], amp = (j - i === 1 ? 24 : 40), front = k % 2 === 0;
        SEGS[a].push({ t0: t0, t1: t1, s0: i, s1: j, amp: front ? amp : -amp * .8, f: m[0] === 'f' });
        SEGS[b].push({ t0: t0, t1: t1, s0: j, s1: i, amp: front ? -amp * .8 : amp, f: m[0] === 'f' });
        HMOVES.push({ t0: t0, t1: t1, cups: [a, b], slots: [i, j] });
        if (m[0] === 's') { cupAt[i] = b; cupAt[j] = a; slotOf[a] = j; slotOf[b] = i; }
      } else {
        var c0 = cupAt[0], c1 = cupAt[1], c2 = cupAt[2];
        SEGS[c0].push({ t0: t0, t1: t1, s0: 0, s1: 1, amp: 12 });
        SEGS[c1].push({ t0: t0, t1: t1, s0: 1, s1: 2, amp: 12 });
        SEGS[c2].push({ t0: t0, t1: t1, s0: 2, s1: 0, amp: -44 });
        HMOVES.push({ t0: t0, t1: t1, cups: [c0, c2], slots: [0, 2] });
        cupAt = [c2, c0, c1]; slotOf[c2] = 0; slotOf[c0] = 1; slotOf[c1] = 2;
      }
      t = t1 + GAP;
    });
    SH_END = t - GAP; END_SLOT = slotOf.slice(); CUP_AT_END = cupAt.slice();
  })();
  var R0 = SH_END + 130;
  var LA = R0 + 150, LF = R0 + 420, RA = R0 + 400, RF = R0 + 670;
  var MA = R0 + 880, MY = MA + 150, CL = MY + 12, LAND = CL + 620, TOSSH = 100;
  var EXIT0 = LAND + 200, EXIT1 = EXIT0 + 330;
  var PB0 = EXIT0 + 260, PB1 = PB0 + 500, TXT = PB1 + 250, TXT1 = TXT + 320;
  var DUR = Math.max(TXT + 2550, 7000);

  // hand tracks: keys {t, dur, spec, e, arc}
  function buildHandKeys() {
    var L = [{ t: 0, dur: 0, spec: { rest: 0 } }], R = [{ t: 0, dur: 0, spec: { rest: 1 } }];
    var hc = [null, null];
    HMOVES.forEach(function (m, k) {
      var a = m.cups[0], b = m.cups[1], want;
      if (k === 0) want = [a, b];
      else {
        var keep = (hc[0] === a && hc[1] === b) ? [a, b] : (hc[0] === b && hc[1] === a) ? [b, a] : null;
        if (keep) want = keep;
        else {
          var c1 = (hc[0] === a ? 0 : 1) + (hc[1] === b ? 0 : 1), c2 = (hc[0] === b ? 0 : 1) + (hc[1] === a ? 0 : 1) + .6;
          want = c1 <= c2 ? [a, b] : [b, a];
        }
      }
      [L, R].forEach(function (tr, h) {
        if (k === 0) tr.push({ t: ENTER + h * 70, dur: 400, spec: { cup: want[h] }, e: oB, arc: 0 });
        else if (hc[h] !== want[h]) tr.push({ t: m.t0 - 50, dur: 95, spec: { cup: want[h] }, e: ioS, arc: 14 });
      });
      hc = want;
    });
    var cL = CUP_AT_END[0], cM = CUP_AT_END[1], cR = CUP_AT_END[2];
    L.push({ t: R0, dur: 170, spec: { cup: cL, dy: -14 }, e: ioS, arc: 10 });
    L.push({ t: LA - 60, dur: 60, spec: { cup: cL }, e: oQ });
    L.push({ t: LF, dur: 280, spec: { pt: [-56, -118], r: -6 }, e: oC });
    L.push({ t: LAND - 160, dur: 320, spec: { pt: [-74, -88], r: -14 }, e: ioC, arc: 8 });
    L.push({ t: EXIT0, dur: EXIT1 - EXIT0, spec: { rest: 0 }, e: iC });
    R.push({ t: R0, dur: 170, spec: { cup: cR, dy: -14 }, e: ioS, arc: 10 });
    R.push({ t: RA - 60, dur: 60, spec: { cup: cR }, e: oQ });
    R.push({ t: RF, dur: 280, spec: { pt: [58, -118], r: 6 }, e: oC });
    R.push({ t: MA - 190, dur: 190, spec: { cup: cM }, e: ioS, arc: 16 });
    R.push({ t: MY + 80, dur: 300, spec: { pt: [74, -96], r: 14 }, e: oC });
    R.push({ t: EXIT0 + 40, dur: EXIT1 - EXIT0, spec: { rest: 1 }, e: iC });
    return [L, R];
  }
  var HKEYS = buildHandKeys();
  var SPREAD = [
    [[0, 1.7], [ENTER + 300, 1, 140], [R0, 1.4, 150], [LA - 60, 1, 60], [LF, 1.8, 140], [LAND - 80, 2.3, 220], [EXIT0, 1.2, 300]],
    [[0, 1.7], [ENTER + 370, 1, 140], [R0, 1.4, 150], [RA - 60, 1, 60], [RF, 1.8, 140], [MA - 190, 1.3, 150], [MA, 1, 60], [MY + 80, 1.9, 140], [LAND - 60, 2.3, 220], [EXIT0, 1.2, 300]]
  ];

  /* ---------------- geometry (per opts) ---------------- */
  var G; // current geometry, set before each render
  function initials(opts) {
    var d = opts.dealer || 'Dealer', v = opts.victim || 'Player', same = d.charAt(0).toLowerCase() === v.charAt(0).toLowerCase();
    return function (name) {
      if (same && (name === d || name === v)) return name.slice(0, 2);
      return name.charAt(0).toUpperCase();
    };
  }
  function layout(opts) {
    var cards = (opts.cards || []).slice(0, 5), n = Math.max(cards.length, 1);
    var pitch = Math.min(118, 500 / n), cardH = pitch - 18, total = n * pitch - 18, top = 318 - total / 2;
    var SP = [114, 170, 226, 282, 338], rows = [], target = null;
    cards.forEach(function (c, i) {
      var cy = top + i * pitch + cardH / 2, chips = [], hasT = c.chips.some(function (ch) { return ch.target; });
      var order = hasT ? [4, 0] : [2, 1, 3], oi = 0;
      c.chips.slice(0, 3).forEach(function (ch) {
        if (ch.target && !target) { target = { row: i, x: SP[2], y: cy }; return; }
        chips.push({ name: ch.name, color: ch.color, x: SP[order[oi++ % order.length]], y: cy });
      });
      rows.push({ label: c.label, cy: cy, chips: chips, target: hasT });
    });
    if (!target) { target = { row: 0, x: SP[2], y: rows[0] ? rows[0].cy : 318 }; }
    var g = { rows: rows, top: top, cardH: cardH, total: total, SP: SP, SPX: target.x, SPY: target.y, BASEY: target.y + 22,
      SLOTX: [SP[1], SP[2], SP[3]], trow: target.row };
    g.ANCH = [{ x: g.SPX - 175, y: g.BASEY - 360 }, { x: g.SPX + 175, y: g.BASEY - 360 }];
    g.REST = [{ x: g.SPX - 160, y: g.BASEY - 320 }, { x: g.SPX + 160, y: g.BASEY - 320 }];
    return g;
  }

  /* ---------------- motion functions ---------------- */
  function cupState(c, t) {
    var s = { x: G.SLOTX[c], y: G.BASEY, lift: 0, r: 0, sx: 1, sy: 1, sc: 1, vis: 1, shadow: 1, smear: null };
    var d0 = DROP[c], land = d0 + FALL;
    if (t < d0) { s.vis = 0; return s; }
    if (t < land) {
      var p = sg(t, d0, land), e = p * p;
      s.lift = (1 - e) * 340; s.sy = 1 + .16 * p; s.sx = 1 - .07 * p; s.shadow = e; return s;
    }
    var tau = t - land;
    if (tau < 500) { var k = .2 * Math.exp(-tau / 85) * Math.cos(tau * 2 * PI / 200); s.sy *= 1 - k; s.sx *= 1 + .7 * k; }
    // shuffle
    var segs = SEGS[c], x = G.SLOTX[c], yo = 0, r = 0;
    for (var i = 0; i < segs.length; i++) {
      var q = segs[i]; if (t < q.t0) break;
      var X0 = G.SLOTX[q.s0], X1 = G.SLOTX[q.s1], dur = q.t1 - q.t0, dir = X1 > X0 ? 1 : -1, dist = Math.abs(X1 - X0);
      var L = cl(dist / dur * 62, 5, 14);
      if (t < q.t1) {
        var u = (t - q.t0) / dur, ee, lean;
        if (q.f) { ee = .42 * Math.sin(PI * u); lean = dir * L * .9 * Math.sin(2 * PI * u); }
        else { ee = dur >= 250 ? ioC(u) : ioS(u); lean = dir * L * Math.sin(PI * u); }
        x = lr(X0, X1, ee); yo = q.amp * Math.sin(PI * (q.f ? ee / .42 * .5 : ee)); r += lean;
        if (dur < 250) { var sp = Math.sin(PI * u); s.sx *= 1 + .1 * sp; s.sy *= 1 - .05 * sp; }
        if (dur <= 230 && !q.f) s.smear = { q: q, u: u, ee: ee, X0: X0, X1: X1 };
      } else {
        x = q.f ? X0 : X1; yo = 0;
        var ta = t - q.t1; if (ta < 450) r += (q.f ? 1 : -1) * dir * L * .5 * Math.sin(2 * PI * ta / 230) * Math.exp(-ta / 110);
      }
    }
    s.x = x; s.y = G.BASEY + yo; s.r += r; s.sc = 1 + yo / 330;
    // reveal
    var es = END_SLOT[c];
    if (es !== 1) {
      var side = es === 0 ? -1 : 1, A = es === 0 ? LA : RA, F = es === 0 ? LF : RF;
      if (t >= A - 80 && t < A) { var pa = Math.sin(PI * sg(t, A - 80, A)); s.sy *= 1 - .08 * pa; s.sx *= 1 + .04 * pa; }
      if (t >= A) {
        var pl = oC(sg(t, A, A + 200)); s.lift = 52 * pl; s.r += side * 14 * pl; s.x += side * 5 * pl;
        if (t < F) s.r += side * 2 * Math.sin((t - A) / 60);
        if (t >= F) {
          var tf = t - F; s.lift += 1.05 * tf + .0009 * tf * tf; s.x += side * .55 * tf; s.r += side * (2 * Math.sin((F - A) / 60) + .5 * tf);
          if (tf > 650) s.vis = 0;
        }
      }
    } else {
      if (t >= MA && t < MY + 60) { var pm = oQ(sg(t, MA, MA + 110)); s.sy *= 1 - .12 * pm; s.sx *= 1 + .07 * pm; }
      if (t >= MY) {
        var ty = t - MY, rel = sg(ty, 0, 60);
        s.sy *= 1 + .26 * oQ(rel) * Math.exp(-ty / 220); s.sx *= 1 - .08 * oQ(rel);
        s.lift = 1.15 * ty + .0028 * ty * ty;
        s.r += -10 * Math.sin(cl(ty / 120, 0, 1) * PI / 2) - (ty > 120 ? .35 * (ty - 120) : 0);
        if (ty > 600) s.vis = 0;
      }
    }
    s.shadow = cl(1 - s.lift / 110, 0, 1);
    return s;
  }
  function cupTop(c, t, dy) {
    var s = cupState(c, t), a = s.r * PI / 180, h = (58 * s.sy * s.sc) - 1 - (dy || 0);
    return { x: s.x + Math.sin(a) * h, y: s.y - s.lift - Math.cos(a) * h, r: s.r };
  }
  function specPos(sp, t) {
    if (sp.rest !== undefined) return { x: G.REST[sp.rest].x, y: G.REST[sp.rest].y, r: 0 };
    if (sp.pt) return { x: G.SPX + sp.pt[0], y: G.BASEY + sp.pt[1], r: sp.r || 0 };
    return cupTop(sp.cup, t, sp.dy);
  }
  function keyPos(keys, i, t) {
    var k = keys[i], p = specPos(k.spec, t);
    if (i > 0 && t < k.t + k.dur) {
      var q = keyPos(keys, i - 1, t), u = (t - k.t) / k.dur, e = (k.e || ioS)(u);
      p = { x: lr(q.x, p.x, e), y: lr(q.y, p.y, e) - (k.arc || 0) * Math.sin(PI * u), r: lr(q.r, p.r, e) };
    }
    return p;
  }
  function handPos(h, t) {
    var keys = HKEYS[h], i = keys.length - 1;
    while (i > 0 && keys[i].t > t) i--;
    return keyPos(keys, i, t);
  }
  function spreadAt(h, t) {
    var ks = SPREAD[h], v = ks[0][1];
    for (var i = 1; i < ks.length; i++) {
      if (t < ks[i][0]) break;
      v = lr(v, ks[i][1], ioS(sg(t, ks[i][0], ks[i][0] + ks[i][2])));
    }
    return v;
  }
  function chipState(t) {
    var s = { x: G.SPX, y: G.SPY, h: 0, sx: 1, sy: 1, r: 0, th: 0, sc: 1, vis: 1, air: false };
    if (t >= HOP0 && t < 370) { var p = oQ(sg(t, HOP0, 370)); s.sy = 1 - .18 * p; s.sx = 1 + .12 * p; }
    else if (t >= 370 && t < 600) {
      var u = sg(t, 370, 600); s.h = 26 * Math.sin(PI * u);
      s.sy = u < .25 ? lr(.82, 1.12, oQ(u / .25)) : u < .7 ? lr(1.12, .98, ioS((u - .25) / .45)) : lr(.98, 1.06, (u - .7) / .3);
      s.sx = 2 - s.sy;
    } else if (t >= 600 && t < 1000) {
      var ta = t - 600, k = .19 * Math.exp(-ta / 70) * Math.cos(2 * PI * ta / 180) + (.06 * (1 - sg(ta, 0, 30)));
      s.sy = 1 - k; s.sx = 1 + .7 * k;
    }
    if (t >= 1030 && t < 1170) {
      var env = Math.sin(PI * sg(t, 1030, 1170));
      s.r = 7 * env * Math.sin(2 * PI * (t - 1030) / 56); s.sy *= 1 - .05 * env;
    }
    if (t >= DROP[1] + FALL - 4 && t < MY) s.vis = 0;
    if (t >= CL && t < LAND) {
      var v = sg(t, CL, LAND); s.h = TOSSH * 4 * v * (1 - v); s.th = 5 * PI * oQ(v);
      s.sc = 1 + .4 * (s.h / TOSSH); s.r = -18 * Math.sin(PI * v); s.air = true;
    } else if (t >= LAND) {
      var tl = t - LAND; s.th = PI;
      if (tl < 90) { var kk = .2 * Math.sin(PI * tl / 90); s.sy = 1 - kk; s.sx = 1 + .7 * kk; }
      else if (tl < 230) { s.h = 7 * Math.sin(PI * (tl - 90) / 140); var st = .05 * Math.sin(PI * (tl - 90) / 140); s.sy = 1 + st; s.sx = 1 - st; }
      else if (tl < 290) { var k2 = .07 * Math.sin(PI * (tl - 230) / 60); s.sy = 1 - k2; s.sx = 1 + .6 * k2; }
      if (tl >= 260 && tl < 1000) {
        var w = tl - 260, A = .55 * Math.exp(-w / 170), ph = 2 * PI * (w / 120 + w * w / 60000);
        s.th = PI + A * Math.sin(ph); s.r = 9 * A * Math.cos(ph);
      }
    }
    return s;
  }

  /* ---------------- build ---------------- */
  function makeChip(p, col, ini, shadow) {
    var g = E('g', {}, p);
    if (shadow) E('circle', { cx: 0, cy: 3.5, r: 21, fill: INK, opacity: .22 }, g);
    E('circle', { r: 21, fill: col, stroke: INK, 'stroke-width': 2.5 }, g);
    E('circle', { r: 15.5, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-dasharray': '4.1 3.2', opacity: .9 }, g);
    E('path', { d: 'M-14.5,-6 A15.5,15.5 0 0 1 -6,-14.3', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none', opacity: .4 }, g);
    var tx = E('text', { y: 0, dy: '.36em', 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 700, 'font-size': ini.length > 1 ? 15 : 18, fill: '#fff' }, g);
    tx.textContent = ini;
    return g;
  }
  function makeCup(p) {
    var g = E('g', {}, p);
    E('path', { d: 'M-26,0 L-17.5,-58 Q0,-62.5 17.5,-58 L26,0 Q0,8 -26,0Z', fill: CUP, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
    E('path', { d: 'M-22.8,-22 Q0,-16.5 22.8,-22 L21.3,-31 Q0,-25.5 -21.3,-31Z', fill: CREAM }, g);
    E('path', { d: 'M-22.8,-22 Q0,-16.5 22.8,-22 M21.3,-31 Q0,-25.5 -21.3,-31', fill: 'none', stroke: INK, 'stroke-width': 1.4, opacity: .55 }, g);
    E('path', { d: 'M-26,0 Q0,8 26,0 L25.3,-5 Q0,3 -25.3,-5Z', fill: CUP_DK, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    E('ellipse', { cx: 0, cy: -58, rx: 17.5, ry: 4.6, fill: CUP_TOP, stroke: INK, 'stroke-width': 2.2 }, g);
    E('path', { d: 'M-19.5,-9 L-14.5,-50', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: .32 }, g);
    return g;
  }
  function makeHand(p, color, mirror) {
    var g = E('g', {}, p), inner = E('g', { transform: mirror ? 'scale(-1,1)' : '' }, g), fingers = [];
    E('ellipse', { cx: -14, cy: -1, rx: 5, ry: 8.5, transform: 'rotate(28 -14 -1)', fill: GLOVE, stroke: INK, 'stroke-width': 2.2 }, inner);
    [-11, -3.7, 3.7, 11].forEach(function (fx, i) {
      var fg = E('g', {}, inner);
      E('rect', { x: -3.9, y: -4, width: 7.8, height: 20, rx: 3.9, fill: GLOVE, stroke: INK, 'stroke-width': 2.2 }, fg);
      fingers.push({ g: fg, x: fx, a: [14, 5, -5, -14][i], l: [0, 1, 1, 0][i] });
    });
    E('ellipse', { cx: 0, cy: -4, rx: 15.5, ry: 12.5, fill: GLOVE, stroke: INK, 'stroke-width': 2.2 }, inner);
    E('path', { d: 'M-6,-9 Q-3,-11 0,-9', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: .45 }, inner);
    E('rect', { x: -12.5, y: -25, width: 25, height: 9, rx: 3.5, fill: color, stroke: INK, 'stroke-width': 2.2 }, inner);
    return { g: g, fingers: fingers };
  }

  function build(el, opts) {
    while (el.firstChild) el.removeChild(el.firstChild);
    var g = layout(opts), ini = initials(opts), dCol = opts.dealerColor || '#E8559E', vCol = opts.victimColor || '#2F6FE0';
    var svg = E('svg', { viewBox: '0 0 390 700', preserveAspectRatio: 'xMidYMid meet', width: '100%', height: '100%', style: 'display:block;width:100%;height:100%;overflow:hidden' });
    svg.setAttribute('aria-label', (opts.dealer || '') + ' stole ' + (opts.victim || '') + "'s chip");
    el.appendChild(svg);
    E('rect', { x: -400, y: -400, width: 1190, height: 1500, fill: PAPER }, svg);
    var cam = E('g', {}, svg);
    var feltTop = g.top - 26, feltH = g.total + 52;
    E('rect', { x: 10, y: feltTop + 5, width: 370, height: feltH, rx: 30, fill: INK, opacity: .18 }, cam);
    E('rect', { x: 10, y: feltTop, width: 370, height: feltH, rx: 30, fill: FELT, stroke: INK, 'stroke-width': 3 }, cam);
    E('rect', { x: 19, y: feltTop + 9, width: 352, height: feltH - 18, rx: 23, fill: 'none', stroke: PAPER, 'stroke-width': 1.6, 'stroke-dasharray': '1 7', 'stroke-linecap': 'round', opacity: .3 }, cam);
    var rowG = [], tOthers = [];
    g.rows.forEach(function (row, i) {
      var rg = E('g', {}, cam); rowG.push(rg);
      var y0 = row.cy - g.cardH / 2;
      E('rect', { x: 24, y: y0 + 3.5, width: 342, height: g.cardH, rx: 14, fill: INK, opacity: .28 }, rg);
      E('rect', { x: 24, y: y0, width: 342, height: g.cardH, rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, rg);
      E('rect', { x: 34, y: row.cy - 20, width: 46, height: 40, rx: 10, fill: INK }, rg);
      var lb = E('text', { x: 57, y: row.cy, dy: '.36em', 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 600, 'font-size': String(row.label).length > 1 ? 17 : 22, fill: PAPER }, rg);
      lb.textContent = row.label;
      g.SP.forEach(function (x) { E('circle', { cx: x, cy: row.cy, r: 21, fill: SPOT, stroke: INK, 'stroke-width': 1.5, opacity: .9, 'stroke-opacity': .25 }, rg); });
      row.chips.forEach(function (ch) {
        var cg = makeChip(row.target ? cam : rg, ch.color, ini(ch.name), true);
        cg.setAttribute('transform', 'translate(' + ch.x + ',' + ch.y + ')');
        if (row.target) tOthers.push(cg);
      });
    });
    var groundL = E('g', {}, cam), shadowL = E('g', {}, cam), fxLow = E('g', {}, cam), smearL = E('g', {}, cam), cupL = E('g', {}, cam), airL = E('g', {}, cam), armL = E('g', {}, cam), handL = E('g', {}, cam), fxL = E('g', {}, cam);
    // target chip
    var chipShadow = E('circle', { r: 21, fill: INK, opacity: .22 }, groundL);
    var chipG = E('g', {}, groundL);
    var edge = E('circle', { r: 21, fill: shade(vCol, .62), stroke: INK, 'stroke-width': 2.5 }, chipG);
    var fV = makeChip(chipG, vCol, ini(opts.victim || 'P'), false), fD = makeChip(chipG, dCol, ini(opts.dealer || 'D'), false);
    // cups
    var cups = [], shadows = [], smears = [];
    for (var c = 0; c < 3; c++) {
      shadows.push(E('ellipse', { rx: 29, ry: 7, fill: INK }, shadowL));
      smears.push(E('path', { fill: 'none', stroke: CUP, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, smearL));
      cups.push(makeCup(cupL));
    }
    // arms + hands
    var arms = [], hands = [];
    for (var h = 0; h < 2; h++) {
      arms.push([E('path', { fill: 'none', stroke: INK, 'stroke-width': 17, 'stroke-linecap': 'round' }, armL),
                 E('path', { fill: 'none', stroke: SLEEVE, 'stroke-width': 11.5, 'stroke-linecap': 'round' }, armL)]);
      hands.push(makeHand(handL, dCol, h === 1));
    }
    // fx
    var hopRing = E('circle', { cx: g.SPX, cy: g.SPY, fill: 'none', stroke: vCol }, fxLow);
    var rings = [E('circle', { cx: g.SPX, cy: g.SPY, fill: 'none', stroke: dCol }, fxLow), E('circle', { cx: g.SPX, cy: g.SPY, fill: 'none', stroke: dCol }, fxLow)];
    var ticks = [];
    for (var i = 0; i < 12; i++) ticks.push(E('line', { stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, fxL));
    var txt = E('text', { x: 195, y: 652, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 600, fill: INK }, svg);
    var line = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'Player') + "'s chip.";
    txt.textContent = line;
    txt.setAttribute('font-size', r2(Math.min(30, 355 / (line.length * .5))));
    return { g: g, opts: opts, svg: svg, cam: cam, rowG: rowG, tOthers: tOthers, groundL: groundL, airL: airL, cupL: cupL,
      chipShadow: chipShadow, chipG: chipG, edge: edge, fV: fV, fD: fD, vCol: vCol, dCol: dCol,
      cups: cups, shadows: shadows, smears: smears, arms: arms, hands: hands, hopRing: hopRing, rings: rings, ticks: ticks, txt: txt, order: '' };
  }

  /* ---------------- render ---------------- */
  function setTicks(R, t) {
    var k = 0, T = R.ticks;
    function line(x1, y1, x2, y2, o) { var l = T[k++]; l.setAttribute('x1', r2(x1)); l.setAttribute('y1', r2(y1)); l.setAttribute('x2', r2(x2)); l.setAttribute('y2', r2(y2)); l.setAttribute('opacity', r2(o)); }
    for (var c = 0; c < 3; c++) {
      var tl = t - (DROP[c] + FALL), x = G.SLOTX[c];
      for (var sd = -1; sd <= 1; sd += 2) {
        if (tl >= 0 && tl < 200) {
          var p = oC(tl / 200), x1 = x + sd * (31 + 12 * p), y1 = G.BASEY - 4 - 5 * p;
          line(x1, y1, x1 + sd * 10 * (1 - .6 * p), y1 - 4 * (1 - .6 * p), 1 - p);
        } else line(0, 0, 0, 0, 0);
      }
    }
    var tc = t - LAND;
    for (var a = 0; a < 6; a++) {
      if (tc >= 0 && tc < 240) {
        var pp = oC(tc / 240), ang = (a * 60 + 30) * PI / 180, r1 = 27 + 13 * pp, len = 9 * (1 - .6 * pp);
        line(G.SPX + Math.cos(ang) * r1, G.SPY + Math.sin(ang) * r1, G.SPX + Math.cos(ang) * (r1 + len), G.SPY + Math.sin(ang) * (r1 + len), 1 - pp);
      } else line(0, 0, 0, 0, 0);
    }
  }
  function ring(el, t, t0, d, r0, r1, w0) {
    var p = sg(t, t0, t0 + d);
    if (p <= 0 || p >= 1) { el.setAttribute('opacity', 0); return; }
    var e = oC(p);
    el.setAttribute('r', r2(lr(r0, r1, e))); el.setAttribute('stroke-width', r2(lr(w0, .5, e))); el.setAttribute('opacity', r2(1 - p));
  }
  function render(R, t) {
    G = R.g; t = cl(t, 0, DUR);
    // camera
    var z = ioC(sg(t, PUSH0, PUSH1)) * (1 - ioC(sg(t, PB0, PB1))), s = 1 + .45 * z;
    var cx = lr(195, G.SPX, z), cy = lr(350, G.SPY, z), ax = 195, ay = lr(350, 392, z);
    R.cam.setAttribute('transform', 'translate(' + r2(ax) + ',' + r2(ay) + ') scale(' + r2(s * 1000) / 1000 + ') translate(' + r2(-cx) + ',' + r2(-cy) + ')');
    // dimming
    var dim = ioS(sg(t, 450, 1000)) * (1 - ioS(sg(t, PB0, PB1)));
    R.rowG.forEach(function (rg, i) { rg.setAttribute('opacity', i === G.trow ? 1 : r2(1 - .58 * dim)); });
    R.tOthers.forEach(function (cg) { cg.setAttribute('opacity', r2(1 - .3 * dim)); });
    // cups
    var st = [0, 1, 2].map(function (c) { return cupState(c, t); });
    st.forEach(function (s, c) {
      var cup = R.cups[c], sh = R.shadows[c], sm = R.smears[c];
      cup.setAttribute('opacity', s.vis);
      cup.setAttribute('transform', 'translate(' + r2(s.x) + ',' + r2(s.y - s.lift) + ') rotate(' + r2(s.r) + ') scale(' + r2(s.sx * s.sc * 1000) / 1000 + ',' + r2(s.sy * s.sc * 1000) / 1000 + ')');
      sh.setAttribute('cx', r2(s.x)); sh.setAttribute('cy', r2(s.y + 1));
      sh.setAttribute('rx', r2(29 * s.sc * s.sx * (.55 + .45 * s.shadow))); sh.setAttribute('ry', r2(7 * s.sc * (.55 + .45 * s.shadow)));
      sh.setAttribute('opacity', s.vis ? r2(.28 * s.shadow) : 0);
      if (s.smear) {
        var m = s.smear, pts = [], e1 = m.ee, e0 = Math.max(0, e1 - .3);
        for (var k = 0; k <= 6; k++) {
          var e = lr(e0, e1, k / 6), px = lr(m.X0, m.X1, e), py = G.BASEY + m.q.amp * Math.sin(PI * e) - 30 * (1 + m.q.amp * Math.sin(PI * e) / 330);
          pts.push((k ? 'L' : 'M') + r2(px) + ',' + r2(py));
        }
        sm.setAttribute('d', pts.join(' ')); sm.setAttribute('stroke-width', r2(40 * s.sc)); sm.setAttribute('opacity', r2(.3 * Math.sin(PI * m.u)));
      } else sm.setAttribute('opacity', 0);
    });
    var ord = [0, 1, 2].sort(function (a, b) { return (st[a].y + (st[a].lift > 1 ? 1000 + st[a].lift : 0)) - (st[b].y + (st[b].lift > 1 ? 1000 + st[b].lift : 0)); });
    var os = ord.join('');
    if (os !== R.order) { ord.forEach(function (c) { R.cupL.appendChild(R.cups[c]); }); R.order = os; }
    // chip
    var ch = chipState(t), parent = ch.air ? R.airL : R.groundL;
    if (R.chipG.parentNode !== parent) parent.appendChild(R.chipG);
    var co = Math.cos(ch.th), sn = Math.abs(Math.sin(ch.th)), fy = Math.max(Math.abs(co), .05);
    var sxx = r2(ch.sc * ch.sx * 1000) / 1000, syy = r2(ch.sc * ch.sy * fy * 1000) / 1000;
    R.chipG.setAttribute('opacity', ch.vis);
    R.fV.setAttribute('transform', 'translate(' + r2(ch.x) + ',' + r2(ch.y - ch.h) + ') rotate(' + r2(ch.r) + ') scale(' + sxx + ',' + syy + ')');
    R.fD.setAttribute('transform', R.fV.getAttribute('transform'));
    R.fV.setAttribute('opacity', co >= 0 ? 1 : 0); R.fD.setAttribute('opacity', co >= 0 ? 0 : 1);
    R.edge.setAttribute('fill', shade(co >= 0 ? R.vCol : R.dCol, .62));
    R.edge.setAttribute('opacity', sn > .02 ? 1 : 0);
    R.edge.setAttribute('transform', 'translate(' + r2(ch.x) + ',' + r2(ch.y - ch.h + 5 * sn * ch.sc) + ') rotate(' + r2(ch.r) + ') scale(' + sxx + ',' + syy + ')');
    var hf = ch.h / TOSSH;
    R.chipShadow.setAttribute('cx', G.SPX); R.chipShadow.setAttribute('cy', r2(G.SPY + 3.5));
    R.chipShadow.setAttribute('r', r2(21 * (1 - .55 * hf)));
    R.chipShadow.setAttribute('opacity', ch.vis ? r2(.22 * (1 - .7 * hf)) : 0);
    // hands
    var hv = t >= ENTER && t <= EXIT1 + 10;
    for (var h = 0; h < 2; h++) {
      var hp = handPos(h, t), H = R.hands[h], A = R.arms[h], an = G.ANCH[h];
      H.g.setAttribute('opacity', hv ? 1 : 0); A[0].setAttribute('opacity', hv ? 1 : 0); A[1].setAttribute('opacity', hv ? 1 : 0);
      if (!hv) continue;
      H.g.setAttribute('transform', 'translate(' + r2(hp.x) + ',' + r2(hp.y) + ') rotate(' + r2(hp.r) + ') scale(1.15)');
      var spv = spreadAt(h, t);
      H.fingers.forEach(function (f) { f.g.setAttribute('transform', 'translate(' + f.x + ',' + (2 - f.l * (spv - 1) * 1.5) + ') rotate(' + r2(f.a * spv) + ')'); });
      var ra = hp.r * PI / 180, wx = hp.x + Math.sin(ra) * 25, wy = hp.y - Math.cos(ra) * 25;
      var d = 'M' + r2(an.x) + ',' + r2(an.y) + ' C' + r2(an.x) + ',' + r2(an.y + 120) + ' ' + r2(wx - Math.sin(ra) * 70) + ',' + r2(wy - Math.cos(ra) * 70) + ' ' + r2(wx) + ',' + r2(wy);
      A[0].setAttribute('d', d); A[1].setAttribute('d', d);
    }
    // fx
    ring(R.hopRing, t, 590, 460, 23, 50, 4.5);
    ring(R.rings[0], t, LAND + 30, 520, 23, 60, 5);
    ring(R.rings[1], t, LAND + 170, 560, 23, 74, 3.5);
    setTicks(R, t);
    // final line
    var tp = sg(t, TXT, TXT1), te = oC(tp);
    R.txt.setAttribute('opacity', r2(tp));
    R.txt.setAttribute('transform', 'translate(0,' + r2(10 * (1 - te)) + ')');
  }

  function inst(el, opts) {
    if (!el.__cc2shell || el.__cc2shell.opts !== opts) el.__cc2shell = build(el, opts);
    return el.__cc2shell;
  }

  window.CCSteal2_shellgame = {
    title: 'The Shell Game',
    blurb: 'Nick hides Nate\'s chip under three cups, hustles them, and lifts the last one to flip out a chip that is now his.',
    duration: DUR,
    frame: function (el, opts, ms) { render(inst(el, opts), ms || 0); },
    play: function (el, opts) {
      el.__cc2shell = null;
      var R = inst(el, opts);
      render(R, 0);
      return new Promise(function (resolve) {
        var t0 = null;
        function tick(now) {
          if (t0 === null) t0 = now;
          var t = now - t0;
          render(R, t);
          if (t < DUR) requestAnimationFrame(tick); else resolve();
        }
        requestAnimationFrame(tick);
      });
    }
  };
})();


/* ── contraption ── */
/*
 * Closed Caption - "steal" moment - concept: CONTRAPTION (Rube Goldberg chain)
 *
 * Storyboard (ms). World = side-view machine on a pegboard ABOVE a top-down felt table.
 * Camera = translate/scale of one world group, smooth Catmull-Rom through keyframes.
 *
 *  1.     0 -  900  TABLE. Felt table, caption rows 1/2/3/CC with chips. A dashed spotlight
 *                   ring snaps onto Nate's chip; other chips dim; Nate's chip does a nervous gulp.
 *  2.   860 - 1620  REVEAL. Camera glides up off the table to a pegboard machine wearing Nick's chip badge.
 *  3.  1560 - 1870  PLUNGER. Spring plunger pulls back (anticipation), shivers, fires; marble launches.
 *  4.  1870 - 3240  ZIGZAG. Marble rolls 3 ramps (accelerating, rolling stripe), bonks the end walls
 *                   with squash, drops ramp to ramp; camera drifts with it.
 *  5.  3240 - 3560  BUCKET. Marble hops into a tipping bucket; bucket sways, tips; the string goes taut
 *                   over a pulley and yanks the pin out from under a little trapdoor shelf.
 *  6.  3560 - 3990  DUCK. Trapdoor swings away; the toy duck hangs in mid-air (cartoon beat), looks down,
 *                   gulps, stretches... and drops.
 *  7.  3990 - 4150  BELLOWS. Duck lands on the bellows (squash on both); nozzle - aimed at Nate's chip -
 *                   puffs, firing a blob of Nick's paint from the paint tin.
 *  8.  4150 - 5150  FLIGHT. Blob arcs down out of the machine, stretching with speed; camera chases it
 *                   back to the table; its shadow grows on Nate's chip.
 *  9.  5150 - 5720  SPLAT (extra beat 1). Splat + droplets, chip squashes, Nick's colour floods the chip
 *                   from the impact point, "Na" spins out, "Ni" pops in.
 * 10.  5800 - 6750  HOP & SET DOWN (extra beat 2). Chip crouches, hops up toward camera with a coin flip,
 *                   lands exactly in its original spot - squash, dust ring, pink ring flash, settle.
 * 11.  6450 - 7000  Camera eases back to the full table; other chips undim.
 * 12.  7000 - 7250  Stillness.
 * 13.  7250 -10000  "Nick stole Nate's chip." rises in and holds (2.5 s).  TOTAL 10.0 s
 */
window.CCSteal2_contraption = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', FELT = '#2F6B52', FELT_D = '#1F4A37';
  var WOOD = '#DDA867', WOOD_D = '#B67C43', BOARD = '#F3E3C3', BRASS = '#E2B24C';
  var LEATHER = '#B5603F', DUCK = '#F7C948', BEAK = '#EE8A2A', MARBLE = '#7FA3C7';
  var FONT = 'Fredoka, Nunito, "Trebuchet MS", system-ui, sans-serif';
  var T_END = 10000, W = 390, H = 700, CR = 25, uid = 0;

  // ---------- math ----------
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function eo(u) { return 1 - Math.pow(1 - u, 3); }
  function ei(u) { return u * u; }
  function eback(u) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  // decaying oscillation starting at 0 (s = seconds since start)
  function wob(s, amp, k, w) { return s <= 0 ? 0 : amp * Math.exp(-k * s) * Math.sin(w * s); }
  function rot(x, y, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function f(n) { return Math.round(n * 100) / 100; }

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function inkd(extra) { var o = { stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }; for (var k in extra) o[k] = extra[k]; return o; }

  function initials(name, opts) {
    var d = opts.dealer || 'Nick', v = opts.victim || 'Nate';
    var share = d.charAt(0).toUpperCase() === v.charAt(0).toUpperCase();
    if (share && (name === d || name === v)) return name.charAt(0).toUpperCase() + name.slice(1, 2).toLowerCase();
    return name.charAt(0).toUpperCase();
  }

  // ---------- chip ----------
  function chipFace(parent, color, r) {
    S('circle', { r: r, fill: color }, parent);
    S('circle', { r: r * 0.72, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.8, 'stroke-dasharray': '4.2 3.3' }, parent);
    S('path', { d: 'M' + (-r * 0.62) + ' ' + (-r * 0.2) + ' A ' + r * 0.66 + ' ' + r * 0.66 + ' 0 0 1 ' + (-r * 0.1) + ' ' + (-r * 0.66), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
  }
  function chipText(parent, txt, r) {
    var t = S('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', y: 1, fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? r * 0.7 : r * 0.82 }, parent);
    t.textContent = txt;
    return t;
  }

  // ---------- build ----------
  function build(el, opts) {
    while (el.firstChild) el.removeChild(el.firstChild);
    uid++;
    var id = 'cc2-contraption-' + uid;
    var dealer = opts.dealer || 'Nick', victim = opts.victim || 'Nate';
    var dCol = opts.dealerColor || '#E8559E', vCol = opts.victimColor || '#2F6FE0';
    var cards = opts.cards || [];

    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', 'class': 'cc2-contraption-svg' });
    svg.style.display = 'block';
    el.appendChild(svg);
    var defs = S('defs', {}, svg);
    var pat = S('pattern', { id: id + 'peg', width: 22, height: 22, patternUnits: 'userSpaceOnUse' }, defs);
    S('circle', { cx: 11, cy: 11, r: 1.7, fill: '#D9C49C' }, pat);

    S('rect', { x: -2000, y: -2000, width: 4400, height: 4400, fill: PAPER }, svg);
    var world = S('g', {}, svg);
    var screen = S('g', {}, svg);

    // ===== TABLE (top-down) =====
    var FT = 112, FB = 684;
    S('rect', { x: 14, y: FT + 5, width: 362, height: FB - FT, rx: 28, fill: INK, opacity: 0.16 }, world);
    S('rect', inkd({ x: 14, y: FT, width: 362, height: FB - FT, rx: 28, fill: FELT, 'stroke-width': 2.6 }), world);
    S('rect', { x: 24, y: FT + 10, width: 342, height: FB - FT - 20, rx: 20, fill: 'none', stroke: '#FFF8EA', 'stroke-opacity': 0.22, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }, world);

    var n = Math.max(1, cards.length);
    var gap = 14, avail = FB - FT - 48;
    var ch = Math.min(104, (avail - gap * (n - 1)) / n);
    var total = ch * n + gap * (n - 1);
    var top0 = FT + (FB - FT - total) / 2;
    var chipXs = [[268], [218, 290], [176, 248, 320]];
    var tableG = S('g', {}, world);
    var others = S('g', {}, world);
    var target = null;
    var cardLayer = S('g', {}, tableG);
    var chipLayer = S('g', {}, others);
    for (var i = 0; i < cards.length; i++) {
      var cy = top0 + i * (ch + gap) + ch / 2;
      S('rect', { x: 30, y: cy - ch / 2 + 4, width: 330, height: ch, rx: 14, fill: FELT_D, opacity: 0.55 }, cardLayer);
      S('rect', inkd({ x: 30, y: cy - ch / 2, width: 330, height: ch, rx: 14, fill: PAPER }), cardLayer);
      S('circle', { cx: 64, cy: cy, r: 18, fill: INK }, cardLayer);
      var lb = S('text', { x: 64, y: cy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': String(cards[i].label).length > 1 ? 14 : 18 }, cardLayer);
      lb.textContent = cards[i].label;
      S('rect', { x: 94, y: cy - 10, width: 46, height: 7, rx: 3.5, fill: '#E9DCC2' }, cardLayer);
      S('rect', { x: 94, y: cy + 4, width: 32, height: 7, rx: 3.5, fill: '#E9DCC2' }, cardLayer);
      var chips = (cards[i].chips || []).slice(0, 3);
      var xs = chipXs[Math.max(0, chips.length - 1)];
      for (var j = 0; j < chips.length; j++) {
        var c = chips[j], cx = xs[j];
        if (c.target) { target = { x: cx, y: cy, name: c.name, color: c.color || vCol }; continue; }
        S('circle', { cx: cx + 1.5, cy: cy + 4, r: CR, fill: INK, opacity: 0.22 }, chipLayer);
        var g = S('g', { transform: 'translate(' + cx + ' ' + cy + ')' }, chipLayer);
        chipFace(g, c.color, CR);
        chipText(g, initials(c.name, opts), CR);
        S('circle', inkd({ r: CR, fill: 'none', 'stroke-width': 2.4 }), g);
      }
    }
    if (!target) target = { x: 268, y: top0 + ch / 2, name: victim, color: vCol };
    var TX = target.x, TY = target.y;
    var oldTxt = initials(victim, opts), newTxt = initials(dealer, opts);

    // spotlight ring (under the chip)
    var spot = S('g', { transform: 'translate(' + TX + ' ' + TY + ')' }, world);
    var spotRing = S('circle', { r: 36, fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' }, spot);
    var flashRing = S('circle', { r: 30, fill: 'none', stroke: dCol, 'stroke-width': 4, opacity: 0 }, world);
    flashRing.setAttribute('cx', TX); flashRing.setAttribute('cy', TY);
    var dustRing = S('circle', { cx: TX, cy: TY, r: 28, fill: 'none', stroke: PAPER, 'stroke-width': 3, opacity: 0 }, world);

    // target chip
    var tShadow = S('circle', { r: CR, fill: INK, opacity: 0.22 }, world);
    var blobShadow = S('ellipse', { cx: TX, cy: TY, rx: 10, ry: 9, fill: INK, opacity: 0 }, world);
    var tG = S('g', {}, world);
    var tIn = S('g', {}, tG);
    chipFace(tIn, target.color, CR);
    var clip = S('clipPath', { id: id + 'clip' }, defs);
    var clipC = S('circle', { cx: 0, cy: 0, r: 0 }, clip);
    var over = S('g', { 'clip-path': 'url(#' + id + 'clip)' }, tIn);
    chipFace(over, dCol, CR);
    var tOld = chipText(tIn, oldTxt, CR);
    var tNew = chipText(tIn, newTxt, CR);
    S('circle', inkd({ r: CR, fill: 'none', 'stroke-width': 2.4 }), tIn);
    // move blobShadow above chip
    tG.appendChild(blobShadow);

    // splat + droplets (above chip)
    var splatG = S('g', { transform: 'translate(' + TX + ' ' + TY + ')' }, world);
    var sp = '';
    for (var k = 0; k < 16; k++) {
      var a = k / 16 * Math.PI * 2, rr = (k % 2 ? 19 : 29) + (k % 4 === 0 ? 4 : 0);
      sp += (k ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr);
    }
    var splat = S('path', inkd({ d: sp + 'Z', fill: dCol, opacity: 0 }), splatG);
    var drops = [];
    for (k = 0; k < 7; k++) {
      var dd = S('circle', inkd({ r: 4.5, fill: dCol, 'stroke-width': 1.6, opacity: 0 }), splatG);
      drops.push({ el: dd, a: (k / 7) * Math.PI * 2 + 0.4 + (k % 2) * 0.2, d: 38 + (k * 13 % 17) });
    }

    // ===== MACHINE (side view, above the table) =====
    var M = S('g', {}, world);
    S('rect', { x: 18, y: -626, width: 354, height: 590, rx: 18, fill: INK, opacity: 0.12 }, M);
    S('rect', inkd({ x: 18, y: -630, width: 354, height: 590, rx: 18, fill: BOARD }), M);
    S('rect', { x: 26, y: -622, width: 338, height: 574, rx: 12, fill: 'url(#' + id + 'peg)' }, M);
    // hanging hooks: board hangs from the top of the screen
    // Nick's maker badge
    var badge = S('g', { transform: 'translate(306 -592)' }, M);
    chipFace(badge, dCol, 17); chipText(badge, newTxt, 17);
    S('circle', inkd({ r: 17, fill: 'none' }), badge);

    // ramps
    var MR = 9;
    var ramps = [
      { a: [58, -515], b: [268, -490] },
      { a: [278, -452], b: [64, -427] },
      { a: [56, -388], b: [270, -362] }
    ];
    function surfY(R, x) { var u = (x - R.a[0]) / (R.b[0] - R.a[0]); return lerp(R.a[1], R.b[1], u); }
    function onRamp(R, x) { // marble centre on ramp at x
      var dx = R.b[0] - R.a[0], dy = R.b[1] - R.a[1], L = Math.sqrt(dx * dx + dy * dy);
      var nx = dy / L, ny = -dx / L; if (ny > 0) { nx = -nx; ny = -ny; }
      // find surface point p such that p + n*r has x-coordinate x
      var px = x - nx * MR;
      return [x, surfY(R, px) + ny * MR];
    }
    ramps.forEach(function (R, idx) {
      var p = R.a[0] + ',' + R.a[1] + ' ' + R.b[0] + ',' + R.b[1] + ' ' + R.b[0] + ',' + (R.b[1] + 9) + ' ' + R.a[0] + ',' + (R.a[1] + 9);
      S('polygon', inkd({ points: p, fill: WOOD }), M);
      // pegs
      var m1 = lerp(R.a[0], R.b[0], 0.15), m2 = lerp(R.a[0], R.b[0], 0.85);
      [m1, m2].forEach(function (mx) { S('circle', { cx: mx, cy: surfY(R, mx) + 4.5, r: 1.8, fill: WOOD_D }, M); });
    });
    // walls: R1 right, R2 right backstop + left
    S('rect', inkd({ x: 266, y: -512, width: 7, height: 31, rx: 2, fill: WOOD_D }), M);
    S('rect', inkd({ x: 278, y: -474, width: 7, height: 31, rx: 2, fill: WOOD_D }), M);
    S('rect', inkd({ x: 58, y: -449, width: 7, height: 31, rx: 2, fill: WOOD_D }), M);

    // plunger
    var MY0 = onRamp(ramps[0], 72)[1];
    S('rect', inkd({ x: 30, y: MY0 - 9, width: 24, height: 18, rx: 3, fill: BRASS }), M);
    var plRod = S('rect', inkd({ x: 0, y: MY0 - 2.5, width: 28, height: 5, rx: 2.5, fill: '#9B8F84' }), M);
    var plKnob = S('circle', inkd({ r: 7, cy: MY0, fill: '#E4573D' }), M);
    var plSpring = S('polyline', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, M);
    var plHead = S('rect', inkd({ y: MY0 - 8, width: 6, height: 16, rx: 2, fill: '#E4573D' }), M);

    // bucket on yoke
    var AX = 308, AY = -336;
    S('path', inkd({ d: 'M' + (AX - 26) + ' ' + (AY + 52) + ' L' + AX + ' ' + AY + ' L' + (AX + 26) + ' ' + (AY + 52), fill: 'none', stroke: WOOD_D, 'stroke-width': 5 }), M);
    S('path', inkd({ d: 'M' + (AX - 26) + ' ' + (AY + 52) + ' L' + AX + ' ' + AY + ' L' + (AX + 26) + ' ' + (AY + 52), fill: 'none', 'stroke-width': 1.4 }), M);
    S('rect', inkd({ x: AX - 32, y: AY + 50, width: 64, height: 7, rx: 3, fill: WOOD }), M);

    // string (behind bucket)
    var str = S('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, M);
    var cupG = S('g', {}, M);
    var cupMarbleSlot = S('g', {}, cupG);
    S('path', inkd({ d: 'M-19 -17 L19 -17 L14 15 Q0 19 -14 15 Z', fill: '#E4573D' }), cupG);
    S('path', { d: 'M-17 -7 L17 -7', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2.5 }, cupG);
    S('ellipse', inkd({ cx: 0, cy: -17, rx: 19, ry: 4, fill: '#A9372A' }), cupG);
    S('circle', inkd({ cx: -21, cy: 0, r: 3, fill: BRASS, 'stroke-width': 1.6 }), cupG);
    S('circle', inkd({ cx: 0, cy: 0, r: 3.2, fill: BRASS, 'stroke-width': 1.6 }), cupG);

    // pulley
    var PX = 282, PY = -235;
    S('line', inkd({ x1: PX, y1: PY, x2: PX + 14, y2: PY - 14, 'stroke-width': 3 }), M);
    S('circle', inkd({ cx: PX, cy: PY, r: 6, fill: BRASS }), M);
    S('circle', { cx: PX, cy: PY, r: 1.6, fill: INK }, M);

    // duck shelf: fixed bracket + trapdoor + pin
    var HX = 170, HY = -235;
    S('path', inkd({ d: 'M' + (HX - 14) + ' ' + (HY - 6) + ' L' + HX + ' ' + (HY - 6) + ' L' + HX + ' ' + (HY + 4) + ' L' + (HX - 8) + ' ' + (HY + 18) + ' L' + (HX - 14) + ' ' + (HY + 18) + 'Z', fill: WOOD_D }), M);
    S('rect', inkd({ x: 226, y: -224, width: 12, height: 14, rx: 2, fill: WOOD_D }), M);
    var door = S('g', {}, M);
    S('rect', inkd({ x: 0, y: -3, width: 60, height: 7, rx: 2.5, fill: WOOD }), door);
    S('circle', inkd({ cx: 0, cy: 0, r: 3.5, fill: BRASS, 'stroke-width': 1.6 }), M).setAttribute('transform', 'translate(' + HX + ' ' + HY + ')');
    var pin = S('g', {}, M);
    S('rect', inkd({ x: -26, y: -2.2, width: 26, height: 4.4, rx: 2, fill: '#9B8F84', 'stroke-width': 1.6 }), pin);
    S('circle', inkd({ cx: 0, cy: 0, r: 3.6, fill: 'none', 'stroke-width': 1.8 }), pin);

    // bellows + paint tin + nozzle
    var BX = 200;
    var tube = S('path', { d: 'M252 -112 Q252 -96 214 -98', fill: 'none', stroke: '#6E5A4C', 'stroke-width': 5, 'stroke-linecap': 'round' }, M);
    var tubeIn = S('path', { d: 'M252 -112 Q252 -96 214 -98', fill: 'none', stroke: dCol, 'stroke-width': 2, 'stroke-linecap': 'round' }, M);
    S('rect', inkd({ x: 238, y: -140, width: 28, height: 30, rx: 3, fill: '#FBF2E0' }), M);
    S('rect', { x: 239, y: -132, width: 26, height: 14, fill: dCol }, M);
    S('rect', inkd({ x: 238, y: -140, width: 28, height: 30, rx: 3, fill: 'none' }), M);
    S('ellipse', inkd({ cx: 252, cy: -140, rx: 14, ry: 3.5, fill: dCol }), M);
    S('path', inkd({ d: 'M244 -139 q2 9 0 14 q-2 3 -4 0 q-1 -6 0 -12', fill: dCol, 'stroke-width': 1.6 }), M);
    var nozG = S('g', { transform: 'translate(' + BX + ' -112)' }, M);
    S('path', inkd({ d: 'M-12 0 L12 0 L4 26 L-4 26 Z', fill: BRASS }), nozG);
    S('path', { d: 'M-6 4 L-2 20', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linecap': 'round' }, nozG);
    var drip = S('circle', inkd({ cx: 0, cy: 29, r: 3.2, fill: dCol, 'stroke-width': 1.4 }), nozG);
    S('rect', inkd({ x: BX - 36, y: -118, width: 72, height: 8, rx: 3, fill: WOOD }), M); // bottom board
    S('path', inkd({ d: 'M' + (BX - 36) + ' -110 l-10 10 l0 8 l12 0', fill: 'none', stroke: WOOD_D, 'stroke-width': 4 }), M);
    var acc = S('path', inkd({ fill: LEATHER }), M);
    var topB = S('rect', inkd({ x: BX - 36, width: 72, height: 8, rx: 3, fill: WOOD }), M);
    var knob = S('rect', inkd({ x: BX - 6, width: 12, height: 5, rx: 2, fill: WOOD_D, 'stroke-width': 1.6 }), M);
    var puffG = S('g', {}, M);
    var puffs = [];
    for (k = 0; k < 4; k++) puffs.push(S('circle', inkd({ r: 6, fill: '#FFFFFF', 'stroke-width': 1.6, opacity: 0 }), puffG));

    // duck
    var duck = S('g', {}, M);
    var duckIn = S('g', {}, duck);
    S('path', inkd({ d: 'M-18 -12 Q-20 -24 -10 -20 Q0 -24 10 -18 Q20 -14 16 -6 Q12 0 0 0 Q-16 0 -18 -12 Z', fill: DUCK }), duckIn);
    S('path', { d: 'M-8 -12 Q0 -6 8 -12', fill: 'none', stroke: '#C99A1E', 'stroke-width': 2, 'stroke-linecap': 'round' }, duckIn);
    var head = S('g', { }, duckIn);
    S('circle', inkd({ cx: 0, cy: 0, r: 8.5, fill: DUCK }), head);
    S('path', inkd({ d: 'M7 -2 L16 1 L7 4 Z', fill: BEAK, 'stroke-width': 1.6 }), head);
    var eye = S('circle', { cx: 3, cy: -2.5, r: 1.8, fill: INK }, head);

    // marble (on top of machine parts)
    var marble = S('g', {}, M);
    var marbleSpin = S('g', {}, marble);
    S('circle', inkd({ r: MR, fill: MARBLE }), marbleSpin);
    S('path', { d: 'M-6 -3 Q0 3 6 -3', fill: 'none', stroke: '#3E5E86', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, marbleSpin);
    S('circle', { cx: -3, cy: -3.5, r: 2.2, fill: '#FFFFFF', opacity: 0.75 }, marble);

    // impact ticks (little burst lines)
    var ticks = [];
    function addTick(tt, x, y, ang, spread) {
      var g = S('g', { transform: 'translate(' + f(x) + ' ' + f(y) + ')', opacity: 0 }, M);
      var ls = [];
      [-1, 0, 1].forEach(function (k) { ls.push({ el: S('line', { stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g), a: (ang + k * spread) / 57.3 }); });
      ticks.push({ t: tt, g: g, ls: ls });
    }

    // paint blob (in world, top)
    var blob = S('g', {}, world);
    var blobIn = S('g', {}, blob);
    S('ellipse', inkd({ rx: 11, ry: 11, fill: dCol }), blobIn);
    S('ellipse', { cx: -3, cy: -4, rx: 3.5, ry: 2.5, fill: '#FFFFFF', opacity: 0.55 }, blobIn);

    // final line (screen space)
    var line = S('text', { x: W / 2, y: 64, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 27, opacity: 0 }, screen);
    line.textContent = dealer + ' stole ' + victim + "'s chip.";

    // ===== timeline helpers =====
    var R1 = ramps[0], R2 = ramps[1], R3 = ramps[2];
    var X0 = 72, X1 = 256, X2 = 78, X3 = 262;
    var CUP_IN = [0, 3];
    function cupAngle(t) {
      if (t < 3380) return 0;
      var s = (t - 3380) / 1000;
      var sway = -wob(s, 7, 14, 40) * (t < 3460 ? 1 : 1);
      var tip = 66 * eio(seg(t, 3420, 3600)) + wob((t - 3600) / 1000, 7, 7, 22);
      return tip + sway;
    }
    function marbleAt(t) {
      var p, r = 0, sx = 1, sy = 1, d1 = X1 - X0, d2 = X1 - X2;
      if (t < 1870) { p = onRamp(R1, X0); }
      else if (t < 2330) { var u = seg(t, 1870, 2330); u = 0.45 * u + 0.55 * u * u; var x = lerp(X0, X1, u); p = onRamp(R1, x); r = x - X0; }
      else if (t < 2480) {
        var a = onRamp(R1, X1), b = onRamp(R2, X1 - 2), u2 = seg(t, 2380, 2480);
        var bx = t < 2380 ? -2 * Math.sin(seg(t, 2330, 2380) * Math.PI) : 0;
        p = [X1 + bx - 2 * u2, lerp(a[1], b[1], ei(u2))]; r = d1;
        if (t < 2380) { var q = Math.sin(seg(t, 2330, 2380) * Math.PI); sx = 1 - 0.18 * q; sy = 1 + 0.12 * q; }
      }
      else if (t < 2840) { var u3 = seg(t, 2480, 2840); u3 = 0.25 * u3 + 0.75 * u3 * u3; var x3 = lerp(X1 - 2, X2, u3); p = onRamp(R2, x3); r = d1 - (X1 - 2 - x3);
        var q3 = Math.max(0, 1 - (t - 2480) / 70); sx = 1 + 0.2 * q3; sy = 1 - 0.2 * q3; }
      else if (t < 2940) {
        var a4 = onRamp(R2, X2), b4 = onRamp(R3, X2 + 2), u4 = seg(t, 2870, 2940);
        var bx4 = t < 2870 ? 2 * Math.sin(seg(t, 2840, 2870) * Math.PI) : 0;
        p = [X2 + bx4 + 2 * u4, lerp(a4[1], b4[1], ei(u4))]; r = d1 - d2;
        if (t < 2870) { var q4 = Math.sin(seg(t, 2840, 2870) * Math.PI); sx = 1 - 0.18 * q4; sy = 1 + 0.12 * q4; }
      }
      else if (t < 3240) { var u5 = seg(t, 2940, 3240); u5 = 0.3 * u5 + 0.7 * u5 * u5; var x5 = lerp(X2 + 2, X3, u5); p = onRamp(R3, x5); r = d1 - d2 + (x5 - X2);
        var q5 = Math.max(0, 1 - (t - 2940) / 70); sx = 1 + 0.2 * q5; sy = 1 - 0.2 * q5; }
      else if (t < 3380) {
        var s0 = onRamp(R3, X3), u6 = seg(t, 3240, 3380), e = [AX + CUP_IN[0], AY + CUP_IN[1] - 6];
        p = [lerp(s0[0], e[0], u6), lerp(s0[1], e[1], u6 * u6) - 18 * 4 * u6 * (1 - u6) * 0.6]; r = d1 - d2 + (X3 - X2) + 40 * u6;
      }
      else { return null; } // inside cup
      return { x: p[0], y: p[1], r: r / MR * 57.3, sx: sx, sy: sy };
    }
    // string pull geometry
    var EY = [-21, 0];
    function attach(th) { var p = rot(EY[0], EY[1], th); return [AX + p[0], AY + p[1]]; }
    var Q = [PX + 6, PY];
    function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
    var L0 = dist(attach(12), Q);
    function pullAt(t) { return dist(attach(cupAngle(t)), Q) - L0; }
    var tRel = 3700;
    for (var tt = 3380; tt < 3900; tt += 2) { if (pullAt(tt) > 9) { tRel = tt; break; } }
    var tHang0 = tRel + 60, tDrop = tRel + 270, tLand = tDrop + 190;

    var BTOP_REST = 24;
    function accH(t) {
      if (t < tLand) return BTOP_REST;
      var u = seg(t, tLand, tLand + 110);
      var h = lerp(BTOP_REST, 9, eo(u));
      if (t > tLand + 110) h = 9 + 3 * (1 - Math.exp(-(t - tLand - 110) / 160)) + wob((t - tLand - 110) / 1000, 2.5, 6, 25);
      return h;
    }
    var tPuff = tLand + 90;
    addTick(1858, 66, MY0, -90, 55);
    addTick(2330, X1 + 9, onRamp(R1, X1)[1], 180, 50);
    addTick(2840, X2 - 9, onRamp(R2, X2)[1], 0, 50);
    addTick(3380, AX, AY - 14, -90, 50);
    addTick(tRel, 222, -229, 180, 45);
    addTick(tLand, BX, -118 - 9 - 8, -90, 62);
    var NOZ = [BX, -84];
    var nozAng = Math.atan2(TX - NOZ[0], TY - NOZ[1]) * 57.3; // deg from straight down
    var tHit = 5150;
    function blobAt(t) {
      var u = seg(t, tPuff, tHit);
      // puffed out fast, eases, then gravity takes it
      var uy = 0.35 * eo(u) + 0.65 * ei(u);
      var ux = eio(u);
      var x = lerp(NOZ[0], TX, ux) + Math.sin(Math.PI * u) * (TX >= NOZ[0] ? -18 : 18);
      var y = lerp(NOZ[1], TY, uy);
      return [x, y];
    }

    // camera keyframes [t, cx, cy, zoom]
    var K = [
      [0, 195, 350, 1], [860, 195, 350, 1],
      [1620, 168, -448, 1.2], [1850, 166, -452, 1.25],
      [2900, 180, -420, 1.22], [3400, 222, -340, 1.32],
      [tRel + 150, 218, -262, 1.42], [tPuff, 205, -205, 1.36],
      [tPuff + 500, lerp(205, TX, 0.55), lerp(-205, TY, 0.62), 1.38],
      [tHit, TX, TY - 4, 1.72], [5700, TX, TY, 1.86], [6420, TX, TY - 10, 1.72],
      [7000, 195, 350, 1], [T_END, 195, 350, 1]
    ];
    var HOLD = { 0: 1, 1: 1, 12: 1, 13: 1 };
    function cam(t) {
      var i = 0;
      while (i < K.length - 2 && t > K[i + 1][0]) i++;
      var a = K[i], b = K[i + 1], dt = b[0] - a[0];
      var u = clamp((t - a[0]) / dt, 0, 1);
      var out = [];
      for (var c = 1; c <= 3; c++) {
        var m0 = 0, m1 = 0;
        if (!HOLD[i] && i > 0) m0 = (b[c] - K[i - 1][c]) / (b[0] - K[i - 1][0]) * dt;
        if (!HOLD[i + 1] && i + 2 < K.length) m1 = (K[i + 2][c] - a[c]) / (K[i + 2][0] - a[0]) * dt;
        var u2 = u * u, u3 = u2 * u;
        out.push((2 * u3 - 3 * u2 + 1) * a[c] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[c] + (u3 - u2) * m1);
      }
      return out;
    }

    function update(t) {
      t = clamp(t, 0, T_END);
      var C = cam(t);
      world.setAttribute('transform', 'translate(' + W / 2 + ' ' + H / 2 + ') scale(' + f(C[2] * 1000) / 1000 + ') translate(' + f(-C[0]) + ' ' + f(-C[1]) + ')');

      // --- table: singling out ---
      var dim = 1 - 0.5 * eio(seg(t, 250, 650)) + 0.5 * eio(seg(t, 6500, 6950));
      others.setAttribute('opacity', f(dim));
      var sIn = eback(seg(t, 200, 560));
      var sOut = eio(seg(t, 6300, 6700));
      spot.setAttribute('transform', 'translate(' + TX + ' ' + TY + ') rotate(' + f(t * 0.03) + ') scale(' + f(Math.max(0.001, sIn * (1 + 0.15 * sOut))) + ')');
      spot.setAttribute('opacity', f(Math.min(1, seg(t, 200, 320)) * (1 - sOut)));
      spotRing.setAttribute('stroke', t < 6300 ? INK : dCol);

      // --- target chip transform ---
      var sc = 1, sx = 1, yo = 0, rz = 0, lift = 0;
      if (t > 420 && t < 950) { var gs = (t - 420) / 1000; sc = 1 + wob(gs, 0.14, 7, 24); rz = wob(gs, 9, 6, 38); }
      if (t >= tHit && t < 5800) { sc = 1 - wob((t - tHit) / 1000, 0.17, 6, 22); }
      if (t >= 5800 && t < 5900) { sc = 1 - 0.1 * eio(seg(t, 5800, 5900)); }
      if (t >= 5900 && t < 6300) {
        var hu = seg(t, 5900, 6300);
        lift = Math.sin(Math.PI * hu);
        sc = lerp(0.9, 1, eo(Math.min(1, hu * 3))) + 0.38 * lift;
        sx = Math.max(0.06, Math.abs(Math.cos(Math.PI * 2 * eio(hu))));
        yo = -20 * lift;
      }
      if (t >= 6300) { var ls = (t - 6300) / 1000; sc = 1 - wob(ls, 0.13, 7, 26); rz = wob(ls, 5, 6, 20); }
      tG.setAttribute('transform', 'translate(' + f(TX) + ' ' + f(TY + yo) + ') rotate(' + f(rz) + ') scale(' + f(sc * sx) + ' ' + f(sc) + ')');
      tShadow.setAttribute('cx', f(TX + 1.5 + 10 * lift)); tShadow.setAttribute('cy', f(TY + 4 + 12 * lift));
      tShadow.setAttribute('r', f(CR * (sc * (1 + 0.05 * lift)))); tShadow.setAttribute('opacity', f(0.22 - 0.1 * lift));
      tShadow.setAttribute('transform', sx < 1 ? 'translate(' + f(TX + 1.5 + 10 * lift) + ' 0) scale(' + f(sx) + ' 1) translate(' + f(-(TX + 1.5 + 10 * lift)) + ' 0)' : '');

      // colour flood
      var fl = eo(seg(t, tHit + 10, tHit + 260));
      clipC.setAttribute('r', f(fl * 34));
      clipC.setAttribute('cx', f(lerp(-6, 0, fl))); clipC.setAttribute('cy', f(lerp(-8, 0, fl)));
      var o1 = seg(t, tHit + 260, tHit + 400), o2 = seg(t, tHit + 340, tHit + 560);
      tOld.setAttribute('transform', 'rotate(' + f(-120 * ei(o1)) + ') scale(' + f(Math.max(0.001, 1 - ei(o1))) + ')');
      tOld.setAttribute('opacity', o1 >= 1 ? 0 : 1);
      var nb = eback(o2);
      tNew.setAttribute('transform', 'rotate(' + f(90 * (1 - o2)) + ') scale(' + f(Math.max(0.001, nb)) + ')');
      tNew.setAttribute('opacity', o2 <= 0 ? 0 : 1);

      // blob shadow on chip (in chip local coords)
      var bsu = seg(t, tHit - 300, tHit);
      blobShadow.setAttribute('cx', 0); blobShadow.setAttribute('cy', 0);
      blobShadow.setAttribute('rx', f(6 + 9 * bsu)); blobShadow.setAttribute('ry', f(5 + 8 * bsu));
      blobShadow.setAttribute('opacity', t < tHit && bsu > 0 ? f(0.35 * bsu) : 0);

      // splat + droplets
      var su = seg(t, tHit, tHit + 110), sf = seg(t, tHit + 120, tHit + 290);
      splat.setAttribute('opacity', t >= tHit && sf < 1 ? 1 : 0);
      splat.setAttribute('transform', 'scale(' + f(Math.max(0.001, lerp(0.35, 1.3, eo(su)) - 0.62 * eio(sf))) + ') rotate(' + f(su * 12 + sf * 20) + ')');
      drops.forEach(function (d) {
        var du = seg(t, tHit, tHit + 420);
        var ok = t >= tHit && du < 1;
        d.el.setAttribute('opacity', ok ? 1 : 0);
        if (ok) {
          var r = 24 + d.d * eo(du);
          d.el.setAttribute('cx', f(Math.cos(d.a) * r)); d.el.setAttribute('cy', f(Math.sin(d.a) * r - 14 * Math.sin(Math.PI * du)));
          d.el.setAttribute('r', f(4.5 * (1 - du * 0.6)));
          d.el.setAttribute('opacity', f(1 - ei(du)));
        }
      });
      // landing dust + flash
      var dr = seg(t, 6300, 6650);
      dustRing.setAttribute('r', f(27 + 22 * eo(dr)));
      dustRing.setAttribute('opacity', t >= 6300 && dr < 1 ? f(0.75 * (1 - dr)) : 0);
      dustRing.setAttribute('stroke-width', f(4 * (1 - dr) + 0.5));
      var fr = seg(t, 6320, 6800);
      flashRing.setAttribute('r', f(28 + 14 * eo(fr)));
      flashRing.setAttribute('opacity', t >= 6320 && fr < 1 ? f(0.9 * (1 - fr)) : 0);

      // --- plunger ---
      var hx;
      if (t < 1550) hx = 62;
      else if (t < 1800) hx = lerp(62, 42, eio(seg(t, 1560, 1800)));
      else if (t < 1850) hx = 42 + Math.sin((t - 1800) * 1.4) * 0.8;
      else if (t < 1875) hx = lerp(42, 64, eo(seg(t, 1850, 1875)));
      else hx = 62 + wob((t - 1875) / 1000, 2.5, 8, 30) + 2 * Math.exp(-(t - 1875) / 80);
      plHead.setAttribute('x', f(hx - 6));
      plRod.setAttribute('x', f(hx - 30));
      plKnob.setAttribute('cx', f(hx - 30));
      var sp2 = '', x0s = 54, x1s = hx - 6, nz = 7;
      for (k = 0; k <= nz; k++) sp2 += f(lerp(x0s, x1s, k / nz)) + ',' + f(MY0 + (k === 0 || k === nz ? 0 : (k % 2 ? -6 : 6))) + ' ';
      plSpring.setAttribute('points', sp2);
      plSpring.setAttribute('opacity', hx > 56 ? 1 : 1);

      // --- marble ---
      var mb = marbleAt(t), th = cupAngle(t);
      if (mb) {
        if (marble.parentNode !== M) M.appendChild(marble);
        marble.setAttribute('transform', 'translate(' + f(mb.x) + ' ' + f(mb.y) + ') scale(' + f(mb.sx) + ' ' + f(mb.sy) + ')');
        marbleSpin.setAttribute('transform', 'rotate(' + f(mb.r) + ')');
      } else {
        if (marble.parentNode !== cupMarbleSlot) cupMarbleSlot.appendChild(marble);
        marble.setAttribute('transform', 'translate(' + CUP_IN[0] + ' ' + (CUP_IN[1] - 6) + ')');
      }
      cupG.setAttribute('transform', 'translate(' + AX + ' ' + AY + ') rotate(' + f(th) + ')');

      // --- string + pin ---
      var A = attach(th), pull = pullAt(t);
      var pd = Math.max(0, pull) * 1.15;
      var pinX = 244 + pd;
      pin.setAttribute('transform', 'translate(' + f(pinX) + ' -229)');
      var slack = Math.max(0, -pull);
      var sag = Math.min(12, Math.sqrt(slack) * 3.2);
      var my = (A[1] + Q[1]) / 2;
      str.setAttribute('d', 'M' + f(pinX + 3) + ' -229 L' + PX + ' -229 Q' + (PX + 6) + ' -229 ' + (PX + 6) + ' -235 Q' + f((A[0] + Q[0]) / 2 - sag) + ' ' + f(my) + ' ' + f(A[0]) + ' ' + f(A[1]));

      // --- trapdoor ---
      var da = 0;
      if (t > tRel) { var ds = (t - tRel) / 1000; da = 92 * (1 - Math.exp(-6 * ds) * Math.cos(13 * ds)); }
      door.setAttribute('transform', 'translate(' + HX + ' ' + HY + ') rotate(' + f(da) + ')');

      // --- duck ---
      var dyb = -238, dsx = 1, dsy = 1, hr = 0, dx = 200, drz = 0;
      var duckSitY = -118 - accH(t) - 8;
      if (t > tHang0 && t < tDrop) { hr = 28 * eio(seg(t, tHang0, tHang0 + 110)); if (t > tDrop - 70) { var q = Math.sin(seg(t, tDrop - 70, tDrop) * Math.PI); dsy = 1 + 0.1 * q; dsx = 1 - 0.07 * q; } drz = (t > tHang0 + 120 && t < tHang0 + 190) ? Math.sin((t - tHang0 - 120) * 0.25) * 3 : 0; }
      if (t >= tDrop && t < tLand) { var fu = seg(t, tDrop, tLand); dyb = lerp(-238, duckSitY, ei(fu)); hr = lerp(28, -10, fu); dsy = 1 + 0.16 * fu; dsx = 1 - 0.1 * fu; }
      if (t >= tLand) { dyb = duckSitY; var ls2 = (t - tLand) / 1000; var w2 = wob(ls2, 0.3, 7, 24); dsx = 1 + w2; dsy = 1 - w2; hr = -10 * Math.exp(-ls2 * 5) + wob(ls2, 12, 5, 20); }
      duck.setAttribute('transform', 'translate(' + dx + ' ' + f(dyb) + ') rotate(' + f(drz) + ') scale(' + f(dsx) + ' ' + f(dsy) + ')');
      head.setAttribute('transform', 'translate(7 -19) rotate(' + f(hr) + ')');
      eye.setAttribute('r', t > tHang0 + 100 && t < tLand + 200 ? 2.6 : 1.8);

      // --- bellows ---
      var h = accH(t), yb = -118, yt = yb - h;
      var folds = 3, dpath = 'M' + (BX - 34) + ' ' + f(yt);
      for (k = 1; k <= folds * 2; k++) dpath += ' L' + (BX - 34 + (k % 2 ? 7 : 0)) + ' ' + f(yt + h * k / (folds * 2));
      dpath += ' L' + (BX + 34) + ' ' + yb;
      for (k = folds * 2 - 1; k >= 0; k--) dpath += ' L' + (BX + 34 - (k % 2 ? 7 : 0)) + ' ' + f(yt + h * k / (folds * 2));
      acc.setAttribute('d', dpath + ' Z');
      topB.setAttribute('y', f(yt - 8));
      knob.setAttribute('y', f(yt - 12));
      var na = 0;
      if (t > tRel) na = nozAng * eio(seg(t, tRel + 100, tRel + 400));
      na += wob((t - tPuff) / 1000, 6, 8, 40);
      nozG.setAttribute('transform', 'translate(' + BX + ' -110) rotate(' + f(-na) + ') scale(' + f(1 + wob((t - tPuff) / 1000, 0.12, 9, 40)) + ' 1)');
      var dripR = t < tPuff ? 3.2 + 0.6 * Math.sin(t / 260) : 0;
      drip.setAttribute('r', f(Math.max(0.001, dripR)));
      drip.setAttribute('opacity', t < tPuff ? 1 : 0);
      var tubeTh = 2 + 2 * Math.max(0, Math.sin(seg(t, tLand, tPuff + 60) * Math.PI));
      tubeIn.setAttribute('stroke-width', f(tubeTh));
      // puffs at nozzle tip
      var tip = rot(0, 28, -na);
      puffs.forEach(function (p, i2) {
        var pu = seg(t, tPuff + i2 * 25, tPuff + 380 + i2 * 25);
        var on = t >= tPuff + i2 * 25 && pu < 1;
        p.setAttribute('opacity', on ? f(1 - pu) : 0);
        if (on) {
          var ang = (-0.9 + i2 * 0.6) - na / 57.3;
          var rr = 6 + 22 * eo(pu);
          p.setAttribute('cx', f(BX + tip[0] + Math.sin(ang) * rr));
          p.setAttribute('cy', f(-110 + tip[1] + Math.cos(ang) * rr * 0.6 - 4));
          p.setAttribute('r', f(4 + 6 * eo(pu)));
        }
      });

      // --- blob ---
      if (t >= tPuff && t < tHit) {
        var bp = blobAt(t), bq = blobAt(t - 16);
        var vx = bp[0] - bq[0], vy = bp[1] - bq[1], v = Math.sqrt(vx * vx + vy * vy);
        var st = Math.min(0.9, v / 18);
        var ang2 = Math.atan2(vy, vx) * 57.3;
        var grow = 1 + 0.3 * ei(seg(t, tHit - 260, tHit));
        var popIn = eback(seg(t, tPuff, tPuff + 120));
        blob.setAttribute('opacity', 1);
        blob.setAttribute('transform', 'translate(' + f(bp[0]) + ' ' + f(bp[1]) + ') rotate(' + f(ang2) + ') scale(' + f((1 + st) * grow * popIn) + ' ' + f(grow * popIn / (1 + st * 0.6)) + ')');
      } else blob.setAttribute('opacity', 0);

      ticks.forEach(function (k) {
        var u = seg(t, k.t, k.t + 170), on = t >= k.t && u < 1;
        k.g.setAttribute('opacity', on ? f(1 - ei(u)) : 0);
        if (on) k.ls.forEach(function (l) {
          var r0 = 10 + 8 * eo(u), r1 = r0 + 7 * (1 - u) + 2;
          l.el.setAttribute('x1', f(Math.cos(l.a) * r0)); l.el.setAttribute('y1', f(Math.sin(l.a) * r0));
          l.el.setAttribute('x2', f(Math.cos(l.a) * r1)); l.el.setAttribute('y2', f(Math.sin(l.a) * r1));
        });
      });

      // --- final line ---
      var lu = seg(t, 7250, 7600);
      line.setAttribute('opacity', f(eio(Math.min(1, lu * 1.4))));
      line.setAttribute('transform', 'translate(' + W / 2 + ' ' + f(64 + 12 * (1 - eo(lu))) + ') scale(' + f(0.94 + 0.06 * eback(lu)) + ') translate(' + (-W / 2) + ' -64)');
    }
    return { update: update };
  }

  return {
    title: 'The Contraption',
    blurb: 'Nick’s pegboard machine - marble, zigzag, bucket, pin, duck, bellows - lobs one perfect blob of paint onto Nate’s chip and claims it in place.',
    play: function (el, opts) {
      var sc = build(el, opts);
      sc.update(0);
      return new Promise(function (resolve) {
        var t0 = null;
        function step(now) {
          if (t0 === null) t0 = now;
          var t = now - t0;
          sc.update(Math.min(t, T_END));
          if (t >= T_END) resolve(); else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    },
    frame: function (el, opts, ms) { var sc = build(el, opts); sc.update(ms || 0); }
  };
})();

