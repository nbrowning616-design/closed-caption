/* Closed Caption steal film: blush (built by the animation team, Oct 2026) */
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
