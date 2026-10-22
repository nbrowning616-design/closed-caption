/* Closed Caption steal film: paintball (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: HIGH NOON (paintball)
 *
 * Everyone knows the Western stand-off: two gunslingers, a tumbleweed, a twitching hand,
 * DRAW. Here the dealer is quicker on the draw and the "bullet" is a paintball in his colour,
 * so Nate's chip ends up wearing Nick's colour. Top-down felt table; the two chips act as
 * little front-facing characters (eyes, tiny hats, gun belts) just for the duel.
 *
 * Storyboard (ms)
 *    0- 700  Table deals in: rows drop in, chips pop on.
 *  620- 900  Other chips dim; Nate's chip shivers and its eyes pop open, glancing left/right.
 *  800-1750  Nick's chip rolls in along the felt gap from the table edge (black hat bobbing,
 *            gun belt), skids, rocks back and stops across the row from Nate. Camera eases in.
 * 1850-2200  A little hat flops down onto Nate's chip (squash, belt pops on). It looks up at it.
 * 2300-3300  A tumbleweed bounces through between them. Both pairs of eyes follow it... and
 *            snap back to each other.
 * 3300-4250  Slow dramatic push-in. Eyes narrow, hands hover over holsters, Nate sweats,
 *            Nick's fingers twitch once.
 * 4250-4340  DRAW. Nick whips out a tiny paint pistol (hopper full of his colour); Nate is
 *            only just reaching. Pop: puff of smoke, recoil.
 * 4340-4520  One paintball arcs across.
 * 4520-4650  SPLAT: big blot of Nick's colour on Nate's chip, flecks fly, chip knocked back,
 *            eyes squeezed shut, camera jolt.
 * 4650-5200  The splat soaks out into a full coat; "Na" becomes "Ni" under the wavefront.
 * 5200-5800  Beat. Nate's eyes pop open, it wobbles, looks down at itself. Pause.
 * 5650-6050  Nick lifts the pistol and blows across the barrel (wisp of smoke).
 * 5850-6450  Nate tips its hat to Nick in sportsmanlike defeat.
 * 6050-6450  Nick twirls the pistol twice and drops it into the holster.
 * 6450-7250  Nick rolls back off the way he came. Camera eases back out.
 * 6700-7000  Nate's hat pops off in a puff, the face and belt fade; the chip is a chip again.
 * 7000-7330  Chip lifts and plonks down in exactly its spot (squash, ring, dust ticks).
 * 7330-7700  Stillness.
 * 7700-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var LEATHER = '#8A5A33', LEATHER_D = '#6B4325', METAL = '#7D8891', HAT_N = '#E7D3A6', HAT_D = '#3A2F2B';
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
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function dspring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.cos(2 * Math.PI * hz * dt / 1000); }
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
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  // wobbly blob (closed, smooth via quadratic midpoints)
  function blobD(cx, cy, r, n, amp, seed, rot) {
    if (r < 0.2) return '';
    var p = [];
    for (var i = 0; i < n; i++) {
      var a = rot + 2 * Math.PI * i / n, rr = r * (1 + amp * (2 * hash(seed + i) - 1));
      p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    var d = '', m0 = [(p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2];
    d += 'M' + f1(m0[0]) + ' ' + f1(m0[1]);
    for (i = 0; i < n; i++) {
      var q = p[i], nx = p[(i + 1) % n], m = [(q[0] + nx[0]) / 2, (q[1] + nx[1]) / 2];
      d += 'Q' + f1(q[0]) + ' ' + f1(q[1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]);
    }
    return d + 'Z';
  }
  function angLerp(a, b, t) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; }
  function unwrapNear(a, ref) { while (a - ref > Math.PI) a -= 2 * Math.PI; while (a - ref < -Math.PI) a += 2 * Math.PI; return a; }

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
    var below = !(rows.length > 1 && target.row === rows.length - 1);
    var by = below ? trow.y + h + g / 2 : trow.y - g / 2;
    // Nick's mark: a felt-gap spot between chip columns, ~125px across from Nate
    var cands = [108, 186, 258], best = cands[0], bs = 1e9;
    cands.forEach(function (x) { var s = Math.abs(Math.abs(x - target.x) - 125); if (s < bs) { bs = s; best = x; } });
    return { rows: rows, target: target, others: others, by: by, below: below, nx: best, h: h, g: g, ini: ini, trow: trow };
  }

  // ---------- timing helpers ----------
  var T_FIRE = 4340, T_HIT = 4520;

  function nickX(L, t) {
    var side = L.nx > L.target.x ? 1 : -1;            // Nick enters from his own side of the table
    var x0 = L.nx + side * 300;
    if (t < 1500) return lerp(x0, L.nx - side * 7, eoC(seg(t, 800, 1500)) * (t >= 800 ? 1 : 0));
    if (t < 1750) return lerp(L.nx - side * 7, L.nx, eio(seg(t, 1500, 1750)));
    if (t < 6450) return L.nx;
    return lerp(L.nx, L.nx + side * 330, ei(seg(t, 6450, 7250)));
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-paintball-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var coatClipC = mk('clipPath', { id: id + 'coat', clipPathUnits: 'userSpaceOnUse' }, defs);
    var coatClip = mk('path', { d: '' }, coatClipC);
    var chipClipC = mk('clipPath', { id: id + 'chip', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('circle', { cx: 0, cy: 0, r: CR - 1 }, chipClipC);
    var EX = 6.4, EY = -6.2, ERX = 4.5, ERY = 5.4;
    [-1, 1].forEach(function (s) {
      var c = mk('clipPath', { id: id + 'eye' + (s < 0 ? 'L' : 'R'), clipPathUnits: 'userSpaceOnUse' }, defs);
      mk('ellipse', { cx: s * EX, cy: EY, rx: ERX, ry: ERY }, c);
    });

    mk('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = mk('g', {}, svg);
    var tableG = mk('g', {}, cam);
    mk('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    mk('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    mk('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    function makeChip(parent, color, txt) {
      var g = mk('g', {}, parent);
      mk('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
      mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
      mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
      var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
      tx.textContent = txt;
      return { g: g, tx: tx, fs: txt.length > 1 ? 15 : 18 };
    }

    var rowsG = [], chipsG = [];
    var cardLayer = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
    var victim = null;
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
        if (c.target) { victim = { wrap: wrap, sh: sh, c: c }; }
        else { var cg = makeChip(mk('g', {}, wrap), c.color, c.ini); chipsG.push({ wrap: wrap, g: cg.g.parentNode, sh: sh, c: c }); }
      });
    });

    // ---- Nate (victim) ----
    var sideV = L.nx > T.x ? 1 : -1;                 // which way Nate faces (towards Nick)
    var dNN = [L.nx - T.x, L.by - T.y], dm = Math.hypot(dNN[0], dNN[1]); dNN = [dNN[0] / dm, dNN[1] / dm]; // Nate -> Nick
    var hp = [dNN[0] * CR * 0.42, dNN[1] * CR * 0.42];   // hit point (chip-local)
    var vb = mk('g', {}, victim.wrap);
    var vBase = makeChip(vb, T.color, T.ini);
    var coatG = mk('g', { 'clip-path': 'url(#' + id + 'coat)' }, vb);
    var vCoat = makeChip(coatG, opts.dealerColor, L.ini(opts.dealer));
    var wet = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0, d: 'M' + f1(-13) + ' ' + f1(4) + 'Q' + f1(-14) + ' ' + f1(-10) + ' ' + f1(-3) + ' ' + f1(-15) }, vb);
    var splat = mk('path', { fill: opts.dealerColor, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round', opacity: 0 }, vb);
    var splatHi = mk('path', { fill: '#FFFFFF', 'fill-opacity': 0.35, opacity: 0 }, vb);
    var ring = mk('circle', { fill: 'none', stroke: opts.dealerColor, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- face / kit builder (front-facing toy-character overlay) ----
    function makeKit(parent, hatFill, bandFill, side, ammo) {
      var g = mk('g', {}, parent);
      var kit = { g: g, side: side };
      kit.belt = mk('g', {}, g);
      var a0 = 0.35, a1 = Math.PI - 0.35, rb = CR - 1.2;
      mk('path', { d: 'M' + f1(Math.cos(a0) * rb) + ' ' + f1(Math.sin(a0) * rb) + 'A' + rb + ' ' + rb + ' 0 0 1 ' + f1(Math.cos(a1) * rb) + ' ' + f1(Math.sin(a1) * rb), fill: 'none', stroke: INK, 'stroke-width': 5.6, 'stroke-linecap': 'round' }, kit.belt);
      mk('path', { d: 'M' + f1(Math.cos(a0) * rb) + ' ' + f1(Math.sin(a0) * rb) + 'A' + rb + ' ' + rb + ' 0 0 1 ' + f1(Math.cos(a1) * rb) + ' ' + f1(Math.sin(a1) * rb), fill: 'none', stroke: LEATHER, 'stroke-width': 3, 'stroke-linecap': 'round' }, kit.belt);
      mk('rect', { x: -3.2, y: rb - 3, width: 6.4, height: 5.6, rx: 1.2, fill: '#E9C25A', stroke: INK, 'stroke-width': 1.3 }, kit.belt);
      // gun (local: grip at origin, barrel along +x)
      kit.gun = mk('g', {}, g);
      var gi = mk('g', { transform: 'scale(1.35)' }, kit.gun); kit.gunInner = gi;
      mk('path', { d: 'M-2.6 -1L1.6 -1L3 7.2Q0.6 8.4 -1.6 7.4Z', fill: LEATHER_D, stroke: INK, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, gi);
      mk('rect', { x: -3.5, y: -4.6, width: 12, height: 4.6, rx: 1.4, fill: METAL, stroke: INK, 'stroke-width': 1.3 }, gi);
      mk('rect', { x: 8, y: -3.9, width: 8.6, height: 3, rx: 1, fill: METAL, stroke: INK, 'stroke-width': 1.3 }, gi);
      mk('path', { d: 'M1.2 0Q1.8 3.4 4.6 3.2L4.8 0', fill: 'none', stroke: INK, 'stroke-width': 1.1 }, gi);
      kit.hopper = mk('g', {}, gi);
      mk('circle', { cx: 2.6, cy: -7.6, r: 3.8, fill: ammo, stroke: INK, 'stroke-width': 1.3 }, kit.hopper);
      mk('circle', { cx: 1.5, cy: -8.7, r: 1.1, fill: '#FFFFFF', 'fill-opacity': 0.7 }, kit.hopper);
      kit.holster = mk('path', { d: 'M-4.8 -5.5L4.8 -5.5L3.8 14Q0 17 -3.8 14Z', fill: LEATHER, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
      kit.arm = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      kit.hand = mk('g', {}, g);
      mk('circle', { r: 4.3, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.8 }, kit.hand);
      kit.fing = mk('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, kit.hand);
      // face
      kit.face = mk('g', {}, g);
      kit.eyes = [-1, 1].map(function (s) {
        var eg = mk('g', {}, kit.face);
        var cg = mk('g', { 'clip-path': 'url(#' + id + 'eye' + (s < 0 ? 'L' : 'R') + ')' }, eg);
        mk('ellipse', { cx: s * EX, cy: EY, rx: ERX, ry: ERY, fill: '#FFFFFF' }, cg);
        var pup = mk('circle', { r: 2.35, fill: INK }, cg);
        var gl = mk('circle', { r: 0.8, fill: '#FFFFFF' }, cg);
        var lid = mk('path', { stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, cg);
        mk('ellipse', { cx: s * EX, cy: EY, rx: ERX, ry: ERY, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, eg);
        var brow = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, eg);
        var shut = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, eg);
        return { s: s, g: eg, open: [cg, eg.childNodes[1]], pup: pup, gl: gl, lid: lid, brow: brow, shut: shut };
      });
      kit.mouth = mk('ellipse', { cx: side * 3, cy: 3.4, rx: 1.7, ry: 2, fill: INK, opacity: 0 }, kit.face);
      // hat (local origin at crown base centre)
      kit.hat = mk('g', {}, g);
      kit.hatIn = mk('g', {}, kit.hat);
      mk('path', { d: 'M-8 0L-7 -10.5Q-4 -12.6 -0.2 -9.6Q4 -12.6 7 -10.5L8 0Z', fill: hatFill, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, kit.hatIn);
      mk('path', { d: 'M-7.7 -3.6L7.7 -3.6L8 0L-8 0Z', fill: bandFill, stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, kit.hatIn);
      mk('path', { d: 'M-17.5 -3.4Q-15 1.2 -8 1.4L8 1.4Q15 1.2 17.5 -3.4Q16 3.8 8 4.2L-8 4.2Q-16 3.8 -17.5 -3.4Z', fill: hatFill, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, kit.hatIn);
      mk('path', { d: 'M-5 -8.6Q-4.4 -4.8 -5.4 -4.6', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, kit.hatIn);
      return kit;
    }

    var vKitWrap = mk('g', {}, cam);
    var vKit = makeKit(vKitWrap, HAT_N, LEATHER, sideV, T.color);
    vKit.gun.setAttribute('opacity', 1);
    var sweat = mk('path', { d: 'M0 -4Q3.2 0.6 2.4 2.4Q0 4.8 -2.4 2.4Q-3.2 0.6 0 -4Z', fill: '#BFE6F5', stroke: INK, 'stroke-width': 1.2, opacity: 0 }, vKit.face);

    // ---- Nick (dealer) ----
    var nWrap = mk('g', {}, cam);
    var nSh = mk('circle', { r: CR, cx: 1.5, cy: 3.5, fill: INK, opacity: 0.28 }, nWrap);
    var nBody = mk('g', {}, nWrap);
    var nChip = makeChip(nBody, opts.dealerColor, L.ini(opts.dealer));
    var nKit = makeKit(nWrap, HAT_D, opts.dealerColor, -sideV, opts.dealerColor);

    // ---- tumbleweed ----
    var twSh = mk('ellipse', { rx: 11, ry: 4.5, fill: INK, opacity: 0 }, cam);
    var tw = mk('g', { opacity: 0 }, cam);
    var twIn = mk('g', {}, tw);
    var twd = '';
    for (var i = 0; i < 9; i++) {
      var a = hash(40 + i) * Math.PI, rx = 7 + 5 * hash(60 + i), ry = 3 + 6 * hash(80 + i), cx = (hash(100 + i) - 0.5) * 6, cy = (hash(120 + i) - 0.5) * 6;
      var ca = Math.cos(a), sa = Math.sin(a);
      var P = function (u) { return f1(cx + Math.cos(u) * rx * ca - Math.sin(u) * ry * sa) + ' ' + f1(cy + Math.cos(u) * rx * sa + Math.sin(u) * ry * ca); };
      twd += 'M' + P(0) + 'A' + f1(rx) + ' ' + f1(ry) + ' ' + f1(a * 180 / Math.PI) + ' 1 1 ' + P(Math.PI * 1.85);
    }
    mk('circle', { r: 11.5, fill: '#D8B677', 'fill-opacity': 0.35 }, twIn);
    mk('path', { d: twd, fill: 'none', stroke: INK, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, twIn);
    mk('path', { d: twd, fill: 'none', stroke: '#C69A55', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, twIn);

    // ---- shot fx ----
    var fx = mk('g', {}, cam);
    var puffs = [0, 1, 2].map(function () { return mk('circle', { fill: PAPER, stroke: INK, 'stroke-width': 1.4, opacity: 0 }, fx); });
    var popTicks = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var streak = mk('path', { fill: 'none', stroke: opts.dealerColor, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var ball = mk('g', { opacity: 0 }, fx);
    mk('circle', { r: 4.4, fill: opts.dealerColor, stroke: INK, 'stroke-width': 1.6 }, ball);
    mk('circle', { cx: -1.4, cy: -1.5, r: 1.3, fill: '#FFFFFF', 'fill-opacity': 0.75 }, ball);
    var drops = [];
    for (i = 0; i < 7; i++) drops.push(mk('circle', { fill: opts.dealerColor, stroke: INK, 'stroke-width': 1.2, opacity: 0 }, fx));
    var wisp = mk('path', { fill: 'none', stroke: '#A39A8E', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var blowLines = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, fx);
    var hatPuffs = [0, 1, 2, 3].map(function () { return mk('circle', { fill: PAPER, stroke: INK, 'stroke-width': 1.4, opacity: 0 }, fx); });
    var clack = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, fx);

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // camera framing: Nate, Nick (with hats/kit) and the whole target row must be in shot;
    // every other chip and row badge is either fully in or fully out (nothing sliced at the edge).
    var cam0 = frameCam(L, 1.62), zMid = lerp(1, cam0.Z, 0.5), cam1 = frameCam(L, zMid);
    if (cam1.Z < zMid - 0.1) cam1 = cam0.Z > 1 ? frameCam(L, zMid, cam0.Z) : cam1;

    return {
      opts: opts, L: L, T: T, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, victim: victim, vb: vb, vBase: vBase, vCoat: vCoat,
      coatClip: coatClip, splat: splat, splatHi: splatHi, wet: wet, ring: ring, dust: dust, sideV: sideV, dNN: dNN, hp: hp,
      vKitWrap: vKitWrap, vKit: vKit, sweat: sweat, nWrap: nWrap, nSh: nSh, nBody: nBody, nChip: nChip, nKit: nKit,
      tw: tw, twIn: twIn, twSh: twSh, puffs: puffs, popTicks: popTicks, streak: streak, ball: ball, drops: drops, wisp: wisp,
      blowLines: blowLines, hatPuffs: hatPuffs, clack: clack, line: line, cam0: cam0, cam1: cam1
    };
  }

  function frameCam(L, zCap, zUp) {
    var T = L.target, items = [];
    L.rows.forEach(function (r) {
      items.push({ x0: 49, x1: 91, y0: r.mid - 21, y1: r.mid + 21, must: false });
      r.chips.forEach(function (c) { items.push({ x0: c.x - 25, x1: c.x + 25, y0: c.y - 25, y1: c.y + 27, must: r === L.trow }); });
    });
    items.push({ x0: T.x - 40, x1: T.x + 40, y0: T.y - 42, y1: T.y + 36, must: true });
    items.push({ x0: L.nx - 42, x1: L.nx + 42, y0: L.by - 44, y1: L.by + 38, must: true });
    var ix = [T.x, L.nx], iy = [T.y, L.by];
    var idealX = (Math.min.apply(null, ix) + Math.max.apply(null, ix)) / 2, idealY = (iy[0] + iy[1]) / 2;
    for (var Z = zCap; zUp ? Z <= zUp + 1e-6 : Z > 1.0; Z += zUp ? 0.03 : -0.03) {
      var vw = W / Z, vh = H / Z, best = null;
      for (var cx = vw / 2; cx <= W - vw / 2 + 0.01; cx += 2) {
        for (var cy = Math.max(vh / 2 + 8, idealY - 120); cy <= Math.min(612 - vh / 2, idealY + 120); cy += 2) {
          var X0 = cx - vw / 2, X1 = cx + vw / 2, Y0 = cy - vh / 2, Y1 = cy + vh / 2, ok = true;
          for (var i = 0; i < items.length && ok; i++) {
            var it = items[i];
            var inside = it.x0 >= X0 + 6 && it.x1 <= X1 - 6 && it.y0 >= Y0 + 6 && it.y1 <= Y1 - 6;
            var outside = it.x1 <= X0 || it.x0 >= X1 || it.y1 <= Y0 || it.y0 >= Y1;
            if (it.must ? !inside : !(inside || outside)) ok = false;
          }
          if (!ok) continue;
          var cost = Math.abs(cx - idealX) + Math.abs(cy - idealY);
          if (!best || cost < best.c) best = { x: cx, y: cy, c: cost };
        }
      }
      if (best) return { Z: Z, x: best.x, y: best.y };
    }
    return { Z: 1, x: W / 2, y: H / 2 };
  }

  // ---------- look targets ----------
  function lookVec(list, t, from, S) {
    function vec(spec) {
      if (spec === 'cam') return [0, 0];
      if (spec === 'down') return [0, 1];
      if (spec === 'up') return [0, -1];
      var p = typeof spec === 'function' ? spec(t) : spec;
      var dx = p[0] - from[0], dy = p[1] - from[1], m = Math.hypot(dx, dy) || 1;
      return [dx / m, dy / m];
    }
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    var b = vec(list[k][1]);
    if (k === 0) return b;
    var a = vec(list[k - 1][1]), p = clamp((t - list[k][0]) / (list[k][2] || 110));
    var q = backOut(p, 1.2);
    return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  }

  // ---------- kit pose ----------
  function poseKit(kit, o) {
    // o: { hand:[x,y], fingT, gun:{x,y,r,vis}, hatY, hatR, hatS, hatX, look:[x,y], lid, tilt, browY, browA, eyeS, faceO, kitO, mouth }
    var s = kit.side;
    kit.holster.setAttribute('transform', 'translate(' + f1(s * 16.5) + ',' + f1(17.5) + ') rotate(' + f1(-s * 28) + ')');
    var gp = o.gun;
    kit.hopper.setAttribute('opacity', gp.holstered ? 0 : 1);
    kit.gun.setAttribute('transform', 'translate(' + f1(gp.x) + ',' + f1(gp.y) + ') rotate(' + f1(gp.r * 180 / Math.PI) + ') scale(1,' + gp.fs + ')');
    var hx = o.hand[0], hy = o.hand[1], ha = Math.atan2(hy, hx);
    var ax = Math.cos(ha) * (CR - 2), ay = Math.sin(ha) * (CR - 2);
    var dist = Math.hypot(hx, hy);
    if (dist < CR + 1) kit.arm.setAttribute('d', '');
    else {
      var nxp = -Math.sin(ha) * 2.2 * s;
      kit.arm.setAttribute('d', 'M' + f1(ax) + ' ' + f1(ay) + 'Q' + f1((ax + hx) / 2 + nxp) + ' ' + f1((ay + hy) / 2 + Math.cos(ha) * 2.2 * s) + ' ' + f1(hx) + ' ' + f1(hy));
    }
    kit.hand.setAttribute('transform', 'translate(' + f1(hx) + ',' + f1(hy) + ') scale(' + (o.handS || 1).toFixed(3) + ')');
    var ft = o.fingT || 0;
    kit.fing.setAttribute('d', 'M' + f1(-2.2 + ft) + ' ' + f1(1.2) + 'L' + f1(-1.6 + ft * 1.4) + ' ' + f1(4.2) + 'M' + f1(0.4) + ' ' + f1(1.6) + 'L' + f1(0.8 - ft) + ' ' + f1(4.4));
    kit.hat.setAttribute('transform', 'translate(' + f1(o.hatX || 0) + ',' + f1(o.hatY) + ') rotate(' + f1((o.hatR || 0) * 180 / Math.PI) + ') scale(' + f1((o.hatSx || 1) * 1000) / 1000 + ',' + f1((o.hatSy || 1) * 1000) / 1000 + ')');
    kit.hat.setAttribute('opacity', o.hatO === undefined ? 1 : f1(o.hatO * 100) / 100);
    kit.face.setAttribute('opacity', f1(o.faceO * 100) / 100);
    kit.face.setAttribute('transform', 'translate(' + f1(o.look[0] * 0.8) + ',' + f1(o.look[1] * 0.6) + ')');
    var kitO = o.kitO === undefined ? 1 : o.kitO;
    [kit.belt, kit.holster, kit.arm, kit.hand, kit.gun].forEach(function (e) { e.setAttribute('opacity', f1(kitO * 100) / 100); });
    var es = o.eyeS === undefined ? 1 : o.eyeS;
    kit.eyes.forEach(function (E) {
      var ex = E.s * 6.4, ey = -6.2;
      E.g.setAttribute('transform', 'translate(' + f1(ex) + ',' + f1(ey) + ') scale(' + es.toFixed(3) + ') translate(' + f1(-ex) + ',' + f1(-ey) + ')');
      var px = ex + o.look[0] * 2.1, py = ey + o.look[1] * 2.6;
      E.pup.setAttribute('cx', f1(px)); E.pup.setAttribute('cy', f1(py));
      E.gl.setAttribute('cx', f1(px - 0.8)); E.gl.setAttribute('cy', f1(py - 0.9));
      // lid: covers from the top down to lid level; tilt>0 = mean (inner side lower), <0 = worried
      var lid = clamp(o.lid, 0, 1), base = ey - 5.6 + 11.2 * lid;
      var inner = -E.s; // inner side x direction
      var tl = (o.tilt || 0) * 2.6 * (1 - Math.abs(lid - 0.5) * 1.2);
      var yIn = base + tl, yOut = base - tl;
      var xl = ex - 6, xr = ex + 6;
      var yL = inner < 0 ? yIn : yOut, yR = inner < 0 ? yOut : yIn;
      if (lid <= 0.01 && Math.abs(tl) < 0.01) E.lid.setAttribute('d', '');
      else E.lid.setAttribute('d', 'M' + f1(xl) + ' ' + f1(ey - 8) + 'L' + f1(xr) + ' ' + f1(ey - 8) + 'L' + f1(xr) + ' ' + f1(yR) + 'L' + f1(xl) + ' ' + f1(yL) + 'Z');
      E.lid.setAttribute('fill', o.lidFill);
      var closed = lid > 0.9;
      E.open.forEach(function (e) { e.setAttribute('opacity', closed ? 0 : 1); });
      E.shut.setAttribute('opacity', closed ? 1 : 0);
      if (closed) {
        if (o.squeeze) E.shut.setAttribute('d', 'M' + f1(ex - inner * 3.6) + ' ' + f1(ey - 3.2) + 'L' + f1(ex + inner * 2.6) + ' ' + f1(ey) + 'L' + f1(ex - inner * 3.6) + ' ' + f1(ey + 3.2));
        else E.shut.setAttribute('d', 'M' + f1(ex - 4) + ' ' + f1(ey + 0.4) + 'Q' + f1(ex) + ' ' + f1(ey + 3.4) + ' ' + f1(ex + 4) + ' ' + f1(ey + 0.4));
      }
      var by = ey - 8.6 + (o.browY || 0), ba = (o.browA || 0) * 2.4;
      // browA>0 = angry (inner end down)
      var bxI = ex + inner * 3.6, bxO = ex - inner * 4.2;
      E.brow.setAttribute('d', 'M' + f1(bxO) + ' ' + f1(by - ba * 0.5) + 'Q' + f1(ex) + ' ' + f1(by - 1.4) + ' ' + f1(bxI) + ' ' + f1(by + ba));
    });
    kit.mouth.setAttribute('opacity', f1((o.mouth || 0) * 100) / 100);
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, opts = S.opts, sideV = S.sideV;

    // ---- camera ----
    var c0 = S.cam0, c1 = S.cam1;
    function camK(k) { return kf([[0, k === 'Z' ? 1 : (k === 'x' ? W / 2 : H / 2)], [750, k === 'Z' ? 1 : (k === 'x' ? W / 2 : H / 2)], [1700, c1[k]], [3300, c1[k]], [4300, c0[k], eS2], [6500, c0[k]], [7300, k === 'Z' ? 1 : (k === 'x' ? W / 2 : H / 2)]], t); }
    var Z = camK('Z'), ccx = camK('x'), ccy = camK('y');
    ccx = clamp(ccx, W / (2 * Z), W - W / (2 * Z));
    var shk = t >= T_HIT ? Math.exp(-(t - T_HIT) / 70) : 0;
    ccx += shk * 2.2 * Math.sin((t - T_HIT) * 0.25); ccy += shk * 1.6 * Math.cos((t - T_HIT) * 0.31);
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // ---- table intro ----
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 620, 900)) * (1 - eio(seg(t, 6600, 7050)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ---- Nate's chip transform ----
    var d = S.dNN;
    var sc = chipPop(T), dx = 0, dy = 0, rot = 0, shOff = 0;
    if (t > 640 && t < 900) { var q = seg(t, 640, 900); dx += 1.6 * Math.sin((t - 640) * 0.17) * (1 - q); }
    if (t > 3700 && t < 4250) dx += 0.45 * Math.sin(t * 0.21) * seg(t, 3700, 3900);            // nerves
    var kb = t >= T_HIT ? eo(seg(t, T_HIT, T_HIT + 40)) * dspring(t - T_HIT, 7, 2.6, 170) : 0;    // knocked back
    dx -= d[0] * kb; dy -= d[1] * kb;
    rot += -sideV * (t >= T_HIT ? spring(t - T_HIT + 40, 0.22, 2.2, 260) : 0);
    rot += sideV * 0.05 * eio(seg(t, 5450, 5650)) * (1 - eio(seg(t, 5800, 6000)));                // droop as he looks down
    rot += -sideV * 0.1 * Math.sin(Math.PI * seg(t, 5950, 6350));                                 // little bow with the hat tip
    if (t >= 1960 && t < 2300) { var hq = t - 1960; sc *= 1 - 0.07 * Math.exp(-hq / 90) * Math.sin(Math.PI * clamp(hq / 140)); } // hat plop squash
    if (t >= 7000 && t < 7150) { var r1 = eo(seg(t, 7000, 7150)); sc = lerp(1, 1.12, r1); dy = -3 * r1; shOff = 5 * r1; }
    else if (t >= 7150 && t < 7230) { var r2 = ei(seg(t, 7150, 7230)); sc = lerp(1.12, 0.92, r2); dy = -3 * (1 - r2); shOff = 5 * (1 - r2); }
    else if (t >= 7230 && t < 8000) { var dd0 = t - 7230; sc = 1 - 0.08 * Math.exp(-dd0 / 110) * Math.cos(2 * Math.PI * 4.5 * dd0 / 1000); }
    var vTr = 'translate(' + f1(T.x + dx) + ',' + f1(T.y + dy) + ') rotate(' + f1(rot * 180 / Math.PI) + ') scale(' + sc.toFixed(4) + ')';
    S.vb.setAttribute('transform', vTr);
    S.vKitWrap.setAttribute('transform', vTr);
    S.victim.sh.setAttribute('r', f1(CR * Math.min(sc, 1.04)));
    S.victim.sh.setAttribute('cx', f1(T.x + dx + 1.5 + shOff * 0.4)); S.victim.sh.setAttribute('cy', f1(T.y + dy + 3.5 + shOff));
    S.victim.sh.setAttribute('opacity', f1(28 - shOff * 1.6) / 100);

    // face amount (letters shrink to make room for eyes)
    var faV = eoC(seg(t, 640, 780)) * (1 - eio(seg(t, 6800, 7020)));
    [S.vBase, S.vCoat].forEach(function (c) {
      c.tx.setAttribute('y', f1(lerp(0.5, 8.6, faV)));
      c.tx.setAttribute('font-size', f1(lerp(c.fs, c.fs * 0.58, faV)));
    });

    // ---- coat / splat ----
    var hp = S.hp, ps = seg(t, T_HIT, T_HIT + 110), pc = seg(t, T_HIT + 60, 5200);
    var rc = t < T_HIT ? 0 : (pc >= 1 ? 200 : lerp(CR * 0.8 * backOut(ps, 1.6), CR * 1.85, eio(pc)));
    S.coatClip.setAttribute('d', rc > 0.3 ? (rc > 150 ? circleD(0, 0, 200) : blobD(hp[0], hp[1], rc, 13, 0.16, 7, 0.3 + 0.6 * pc)) : '');
    var so = t < T_HIT ? 0 : 1 - eio(seg(t, 4680, 5050));
    var sr = CR * 0.95 * backOut(ps, 2);
    S.splat.setAttribute('d', so > 0 ? blobD(hp[0], hp[1], sr, 11, 0.34, 21, 0.2) + circleD(hp[0] - d[0] * sr * 1.25 + d[1] * 6, hp[1] - d[1] * sr * 1.25 - d[0] * 6, 3.4 * ps) + circleD(hp[0] + d[1] * sr * 1.15, hp[1] - d[0] * sr * 1.15, 2.6 * ps) : '');
    S.splat.setAttribute('opacity', f1(so * 100) / 100);
    S.splatHi.setAttribute('d', so > 0 ? blobD(hp[0] - sr * 0.28, hp[1] - sr * 0.3, sr * 0.28, 7, 0.25, 3, 0) : '');
    S.splatHi.setAttribute('opacity', f1(so * 100) / 100);
    var wo = t < 4900 ? 0 : 0.55 * seg(t, 4900, 5100) * (1 - seg(t, 5900, 6500));
    S.wet.setAttribute('opacity', f1(wo * 100) / 100);

    // flecks
    S.drops.forEach(function (e, i) {
      var p = seg(t, T_HIT, T_HIT + 300 + 60 * hash(i + 3));
      if (p <= 0 || p >= 1) { e.setAttribute('opacity', 0); return; }
      var base = Math.atan2(-d[1], -d[0]), a = base + (hash(i + 9) - 0.5) * 2.6;
      var dist = (CR + 6 + 22 * hash(i + 17)) * eoC(p);
      var hx = T.x + hp[0] + Math.cos(a) * dist, hy = T.y + hp[1] + Math.sin(a) * dist - 8 * Math.sin(Math.PI * p);
      e.setAttribute('cx', f1(hx)); e.setAttribute('cy', f1(hy));
      e.setAttribute('r', f1((1.6 + 2.2 * hash(i + 31)) * (1 - ei(p))));
      e.setAttribute('opacity', 1);
    });

    // ring + dust at the set-down
    var rp = seg(t, 7230, 7730);
    S.ring.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ring.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ring.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 7230, 7510);
    if (dp > 0 && dp < 1) {
      var ds = '', r0 = 27 + 9 * eoC(dp), r1b = r0 + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        ds += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', ds); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- Nick position ----
    var nx = nickX(L, t), ny = L.by, sideN = -sideV;
    var rollA = (nx - L.nx) / CR;  // rolling wheel; 0 at his mark
    var vel = (nickX(L, t + 16) - nickX(L, t - 16)) / 32;
    var nTilt = clamp(-vel * 0.35, -0.3, 0.3);
    var skid = spring(t - 1500, 0.07, 3, 120) * -sideN;
    var nPop = 1 + spring(t - 1750, 0.03, 4, 100);
    S.nWrap.setAttribute('transform', 'translate(' + f1(nx) + ',' + f1(ny) + ')');
    S.nBody.setAttribute('transform', 'rotate(' + f1(rollA * 180 / Math.PI) + ') scale(' + nPop.toFixed(3) + ')');
    var nVis = nx > -60 && nx < W + 60;
    S.nWrap.setAttribute('opacity', nVis ? 1 : 0);
    S.nChip.tx.setAttribute('y', 8.6); S.nChip.tx.setAttribute('font-size', f1(S.nChip.fs * 0.58));

    // tumbleweed path: perpendicular to the duel line, through the midpoint
    var mid = [(T.x + L.nx) / 2, (T.y + L.by) / 2], perp = [-d[1], d[0]];
    if (perp[1] < 0) perp = [-perp[0], -perp[1]];
    var twp = seg(t, 2250, 3350), twS = lerp(-330, 330, twp);
    var twx = mid[0] + perp[0] * twS, twy = mid[1] + perp[1] * twS;
    var bounce = Math.abs(Math.sin(twp * Math.PI * 4.2)) * 14 * (1 - 0.35 * twp);
    var twOn = twp > 0 && twp < 1;
    S.tw.setAttribute('opacity', twOn ? 1 : 0);
    S.twSh.setAttribute('opacity', twOn ? f1((0.22 - bounce * 0.006) * 100) / 100 : 0);
    S.tw.setAttribute('transform', 'translate(' + f1(twx) + ',' + f1(twy - bounce - 4) + ')');
    S.twIn.setAttribute('transform', 'rotate(' + f1(twS / 11 * 180 / Math.PI * (perp[0] >= 0 ? 1 : -1)) + ') scale(' + f1((1.3 + 0.07 * Math.cos(twp * 30)) * 100) / 100 + ',' + f1((1.3 - 0.07 * Math.cos(twp * 30)) * 100) / 100 + ')');
    S.twSh.setAttribute('cx', f1(twx)); S.twSh.setAttribute('cy', f1(twy + 8));
    S.twSh.setAttribute('rx', f1(11 - bounce * 0.25));
    var twPt = function () { return [twx, twy - bounce]; };

    var natePt = [T.x, T.y], nickPt = function (tt) { return [nickX(L, tt), L.by]; };

    // ---- Nick's gun choreography (Nick-local, translate-only frame) ----
    var ax = d[0] * -1, ay = d[1] * -1; // Nick -> Nate
    var aim = Math.atan2(ay, ax);
    var G0 = { x: sideN * 15.5, y: 12.5, r: Math.PI / 2 - sideN * 0.5 };
    var fs = sideN;
    var rA = unwrapNear(aim, G0.r), rB = unwrapNear(-Math.PI / 2, rA);
    var rEnd = unwrapNear(G0.r, rB) + sideN * 4 * Math.PI;
    var A = { x: ax * (CR + 11), y: ay * (CR + 11) };
    var B = { x: sideN * (CR + 3), y: -9 };
    var Sp = { x: sideN * (CR + 11), y: 2 };
    var rest = { x: sideN * 26, y: 4 };
    var gun, hand, fing = 0;
    var twitch = Math.exp(-Math.pow((t - 3950) / 45, 2)) + 0.6 * Math.exp(-Math.pow((t - 4090) / 35, 2));
    if (t < 4250) {
      gun = { x: G0.x, y: G0.y, r: G0.r };
      var hov = seg(t, 3300, 3800);
      hand = { x: lerp(rest.x, sideN * 21, eio(hov)), y: lerp(rest.y, 5, eio(hov)) + 0.5 * Math.sin(t * 0.012) * hov };
      fing = twitch * 1.6;
      hand.x += sideN * twitch * 1.2;
    } else if (t < 4290) {
      var p1 = eio(seg(t, 4250, 4290));
      gun = { x: G0.x, y: G0.y, r: G0.r };
      hand = { x: lerp(sideN * 21, G0.x, p1), y: lerp(5, G0.y, p1) };
    } else if (t < 5650) {
      var p2 = eoC(seg(t, 4290, 4335));
      var rec = t >= T_FIRE ? Math.exp(-(t - T_FIRE) / 90) * (t - T_FIRE < 25 ? (t - T_FIRE) / 25 : 1) : 0;
      gun = { x: lerp(G0.x, A.x, p2) - ax * 3 * rec, y: lerp(G0.y, A.y, p2) - ay * 3 * rec, r: lerp(G0.r, rA, p2) - sideN * 0.45 * rec };
      hand = { x: gun.x, y: gun.y };
    } else if (t < 6000) {
      var p3 = eio(seg(t, 5650, 5800));
      gun = { x: lerp(A.x, B.x, p3), y: lerp(A.y, B.y, p3), r: lerp(rA, rB, p3) };
      hand = { x: gun.x, y: gun.y };
    } else if (t < 6380) {
      var p4 = eio(seg(t, 6000, 6080)), p5 = seg(t, 6060, 6380);
      gun = { x: lerp(B.x, Sp.x, p4), y: lerp(B.y, Sp.y, p4), r: lerp(rB, rEnd, eoC(p5)) };
      hand = { x: gun.x, y: gun.y };
    } else {
      var p6 = eio(seg(t, 6380, 6460)), p7 = eio(seg(t, 6440, 6560));
      var rEndN = rEnd - sideN * 4 * Math.PI;
      gun = { x: lerp(Sp.x, G0.x, p6), y: lerp(Sp.y, G0.y, p6) - 4 * Math.sin(Math.PI * p6), r: lerp(rEnd, rEnd, p6) };
      gun.r = rEndN;
      hand = { x: lerp(Sp.x, rest.x, p7), y: lerp(Sp.y, rest.y, p7) };
    }
    // Nick's face
    var nLook = lookVec([[0, 'cam'], [900, function (tt) { return [nickX(L, tt) - sideN * 100, L.by]; }], [1650, natePt, 140], [2350, twPt, 150], [3250, natePt, 110],
      [5700, [nx + B.x, ny + B.y - 14], 140], [6040, 'cam', 140], [6420, function () { return [nx - sideN * 200, ny]; }, 140]], t, [nx, ny], S);
    var nLid = kf([[0, 0.35], [1600, 0.35], [1700, 0.42], [3300, 0.42], [4200, 0.62], [4250, 0.18, eoC], [4600, 0.18], [4800, 0.4], [5700, 0.4], [5780, 0.95], [6000, 0.95], [6080, 0.4], [6400, 0.4], [6460, 0.3]], t);
    var nBlink = Math.exp(-Math.pow((t - 2120) / 40, 2));
    nLid = Math.max(nLid, nBlink);
    var nHatBob = Math.abs(Math.sin(rollA)) * -2.2 * clamp(Math.abs(vel) * 8);
    var nHatR = nTilt * 0.6 + skid + spring(t - 4290, -0.12 * sideN, 3, 90);
    var tipN = Math.sin(Math.PI * seg(t, 6180, 6420)); // tiny return nod during the spin finish
    poseKit(S.nKit, {
      hand: [hand.x, hand.y], fingT: fing, gun: { x: gun.x, y: gun.y, r: gun.r, fs: fs, holstered: t < 4295 || t > 6440 },
      hatY: -CR + 2 + nHatBob - 1.2 * tipN, hatR: nHatR + sideN * 0.08 * tipN, look: nLook, lid: nLid, tilt: kf([[0, 0.6], [3300, 0.6], [4200, 1], [4250, 0.2], [4700, 0.7]], t),
      browY: kf([[0, 0], [3300, 0], [4200, 1.3], [4250, -1.2, eoC], [4600, 0], [5780, 0.6], [6000, 0.6], [6100, 0]], t), browA: kf([[0, 0.6], [3300, 0.6], [4200, 1.1], [4250, 0.2], [4700, 0.8]], t),
      faceO: 1, lidFill: opts.dealerColor, mouth: seg(t, 5760, 5800) * (1 - seg(t, 6000, 6040)), eyeS: 1
    });
    S.nSh.setAttribute('opacity', 0.28);

    // muzzle position (world)
    var gcos = Math.cos(gun.r), gsin = Math.sin(gun.r);
    function gunPt(lx, ly) { ly *= fs; return [nx + gun.x + lx * gcos - ly * gsin, ny + gun.y + lx * gsin + ly * gcos]; }
    var muz = gunPt(17 * 1.35, -2.4 * 1.35);

    // pop + paintball
    var pp = seg(t, T_FIRE, T_FIRE + 420);
    S.puffs.forEach(function (e, i) {
      if (pp <= 0 || pp >= 1) { e.setAttribute('opacity', 0); return; }
      var mz = [nx + A.x + ax * 17, ny + A.y + ay * 17];
      var off = 3 + 5 * i * eoC(pp);
      e.setAttribute('cx', f1(mz[0] + ax * off + ay * (i - 1) * 4 * eoC(pp))); e.setAttribute('cy', f1(mz[1] + ay * off - ax * (i - 1) * 4 * eoC(pp) - 4 * pp));
      e.setAttribute('r', f1((2.5 + 2 * i) * (0.5 + eoC(pp)) * (1 - 0.6 * pp)));
      e.setAttribute('opacity', f1((1 - ei(pp)) * 100) / 100);
    });
    var tk = seg(t, T_FIRE, T_FIRE + 160);
    if (tk > 0 && tk < 1) {
      var mz2 = [nx + A.x + ax * 18, ny + A.y + ay * 18], tks = '';
      [-0.9, 0, 0.9].forEach(function (o) {
        var a = aim + o, r0 = 5 + 9 * eoC(tk), r1 = r0 + 6 * (1 - tk);
        tks += 'M' + f1(mz2[0] + Math.cos(a) * r0) + ' ' + f1(mz2[1] + Math.sin(a) * r0) + 'L' + f1(mz2[0] + Math.cos(a) * r1) + ' ' + f1(mz2[1] + Math.sin(a) * r1);
      });
      S.popTicks.setAttribute('d', tks); S.popTicks.setAttribute('opacity', 1);
    } else S.popTicks.setAttribute('opacity', 0);
    var bp = seg(t, T_FIRE, T_HIT);
    if (bp > 0 && bp < 1) {
      var st = [nx + A.x + ax * 17, ny + A.y + ay * 17], en = [T.x + hp[0], T.y + hp[1]];
      var bx = lerp(st[0], en[0], bp), byy = lerp(st[1], en[1], bp) - 9 * Math.sin(Math.PI * bp);
      S.ball.setAttribute('transform', 'translate(' + f1(bx) + ',' + f1(byy) + ') scale(' + f1((1 + 0.25 * Math.sin(Math.PI * bp)) * 100) / 100 + ')');
      S.ball.setAttribute('opacity', 1);
      var bp0 = Math.max(0, bp - 0.22);
      var sx0 = lerp(st[0], en[0], bp0), sy0 = lerp(st[1], en[1], bp0) - 9 * Math.sin(Math.PI * bp0);
      S.streak.setAttribute('d', 'M' + f1(sx0) + ' ' + f1(sy0) + 'L' + f1(bx) + ' ' + f1(byy));
      S.streak.setAttribute('opacity', 0.45);
    } else { S.ball.setAttribute('opacity', 0); S.streak.setAttribute('opacity', 0); }

    // blow on the barrel: wind lines then a curling wisp
    var bl = seg(t, 5790, 6000);
    if (bl > 0 && bl < 1) {
      var mo = [nx + sideN * 3, ny + 3.4], tip = muz, ls = '';
      [-1, 1].forEach(function (k) {
        var u0 = 0.25 + 0.15 * ((bl * 3 + (k + 1) * 0.3) % 1), u1 = u0 + 0.3;
        ls += 'M' + f1(lerp(mo[0], tip[0], u0) + k * 1.5) + ' ' + f1(lerp(mo[1], tip[1], u0) + k * 1.5) + 'L' + f1(lerp(mo[0], tip[0], u1) + k * 1.5) + ' ' + f1(lerp(mo[1], tip[1], u1) + k * 1.5);
      });
      S.blowLines.setAttribute('d', ls); S.blowLines.setAttribute('opacity', f1(Math.sin(Math.PI * bl) * 90) / 100);
    } else S.blowLines.setAttribute('opacity', 0);
    var wp = seg(t, 5560, 6250);
    if (wp > 0 && wp < 1) {
      var wb = [nx + B.x, ny + B.y - 17];
      if (t < 5800) wb = muz;
      var blown = eoC(seg(t, 5820, 6250));
      var wd = '', n = 10;
      for (var i = 0; i <= n; i++) {
        var u = i / n, yy = -u * (12 + 6 * wp), xx = 2.6 * Math.sin(u * 6 + t * 0.012) * u + sideN * blown * (8 + 14 * u);
        wd += (i ? 'L' : 'M') + f1(wb[0] + xx) + ' ' + f1(wb[1] + yy - blown * 6);
      }
      S.wisp.setAttribute('d', wd);
      S.wisp.setAttribute('opacity', f1(Math.min(seg(t, 5560, 5660), 1 - blown) * 85) / 100);
    } else S.wisp.setAttribute('opacity', 0);
    // holster clack
    var ck = seg(t, 6455, 6620);
    if (ck > 0 && ck < 1) {
      var hc = [nx + sideN * 16.5, ny + 12], cks = '';
      [-2.2, -1.6, -1.0].forEach(function (a0) {
        var a = sideN > 0 ? a0 + 0.5 : -Math.PI - a0 - 0.5, r0 = 6 + 6 * eoC(ck), r1 = r0 + 4 * (1 - ck);
        cks += 'M' + f1(hc[0] + Math.cos(a) * r0) + ' ' + f1(hc[1] + Math.sin(a) * r0) + 'L' + f1(hc[0] + Math.cos(a) * r1) + ' ' + f1(hc[1] + Math.sin(a) * r1);
      });
      S.clack.setAttribute('d', cks); S.clack.setAttribute('opacity', 1);
    } else S.clack.setAttribute('opacity', 0);

    // ---- Nate's face & kit ----
    var vLook = lookVec([[0, 'cam'], [700, [T.x - 70, T.y + 10], 90], [830, [T.x + 70, T.y + 10], 110], [1000, nickPt, 160], [1900, 'up', 110], [2150, nickPt, 140],
      [2330, twPt, 150], [3200, nickPt, 120], [5340, 'cam', 80], [5480, 'down', 180], [5880, function () { return [nx, ny]; }, 160],
      [6480, function () { return [nx, ny]; }, 100], [6800, 'cam', 160]], t, [T.x, T.y], S);
    var vLid = kf([[0, 1], [640, 1], [740, 0, eoC], [1480, 0], [1530, 1], [1600, 0], [3300, 0], [4200, 0.4], [4260, 0, eoC], [T_HIT, 0], [T_HIT + 40, 1, eoC],
      [5300, 1], [5360, 0, eoC], [5480, 0], [5650, 0.35], [5850, 0.35], [5950, 0.15], [6700, 0.15], [6780, 0.25], [6950, 1]], t);
    var vTilt = kf([[0, -0.6], [3300, -0.6], [4200, -0.2], [4300, -1], [T_HIT, -1], [T_HIT + 40, 0], [5350, -0.8], [5800, -0.8], [6000, -0.3]], t);
    var vEyeS = 1 + spring(t - 640, 0.25, 4, 90) + 0.18 * eoC(seg(t, 4260, 4320)) * (1 - seg(t, T_HIT, T_HIT + 30)) + spring(t - 5340, 0.2, 4, 90);
    vEyeS *= 1 - 0.7 * eio(seg(t, 6850, 7020));
    // Nate's hand
    var vRest = { x: sideV * 26, y: 4 }, vh;
    var vG = { x: sideV * 15.5, y: 12.5 };
    if (t < 4300) {
      var hv = seg(t, 3300, 3800);
      vh = { x: lerp(vRest.x, sideV * 21.5, eio(hv)), y: lerp(vRest.y, 5, eio(hv)) };
      vh.x += 0.6 * Math.sin(t * 0.09) * seg(t, 3600, 3900);                  // trembling
      vh.y += 0.5 * Math.sin(t * 0.11 + 1) * seg(t, 3600, 3900);
    } else if (t < T_HIT) {
      var r3 = eio(seg(t, 4300, T_HIT));
      vh = { x: lerp(sideV * 21.5, vG.x + sideV * 2, r3 * 0.75), y: lerp(5, vG.y, r3 * 0.75) };
    } else if (t < 5850) {
      var fl = eoC(seg(t, T_HIT, T_HIT + 90)), lm = eio(seg(t, 4700, 5100));
      var r4x = lerp(sideV * 18.5, sideV * 30, fl), r4y = lerp(10, -4, fl);
      vh = { x: lerp(r4x, sideV * 25, lm), y: lerp(r4y, 14, lm) };
    } else {
      var up = eio(seg(t, 5850, 5980)), dn = eio(seg(t, 6330, 6480));
      var hatHand = { x: sideV * 15, y: -CR - 2 };
      vh = { x: lerp(lerp(sideV * 25, hatHand.x, up), vRest.x, dn), y: lerp(lerp(14, hatHand.y, up), vRest.y, dn) };
      var lift = Math.sin(Math.PI * seg(t, 5980, 6330));
      vh.y -= 5 * lift; vh.x += sideV * 1.5 * lift;
    }
    // Nate's hat
    var hp0 = seg(t, 1850, 2000);
    var hatY = -CR + 1, hatR = 0, hatSx = 1, hatSy = 1, hatO = 1, hatX = 0;
    if (t < 1850) hatO = 0;
    else if (t < 2000) { hatY = lerp(-150, -CR + 1, ei(hp0)); hatR = 0.4 * sideV * (1 - hp0); }
    else { var hq2 = t - 2000; hatSx = 1 + dspring(hq2, 0.22, 4, 110); hatSy = 1 - dspring(hq2, 0.22, 4, 110); hatR = spring(hq2, 0.12, 3, 160); }
    var tipL = Math.sin(Math.PI * seg(t, 5980, 6330));
    hatY -= 5 * tipL; hatR += -sideV * 0.4 * tipL; hatX += sideV * 1.5 * tipL;
    hatR += -sideV * 0.06 * eio(seg(t, 4300, 4400)) * (1 - seg(t, T_HIT, T_HIT + 50)) + spring(t - T_HIT, 0.25 * sideV, 3, 150);
    hatY -= spring(t - T_HIT, 3, 3, 120) > 0 ? spring(t - T_HIT, 3, 3, 120) : 0;
    var hOff = seg(t, 6700, 6900);
    if (hOff > 0) { hatY -= 12 * eoC(hOff); hatSx *= 1 - eio(hOff); hatSy *= 1 - eio(hOff); hatO = 1 - seg(t, 6820, 6900); }
    var kitIn = eoC(seg(t, 1980, 2160)) * (1 - eio(seg(t, 6720, 6950)));
    var vLidFill = t >= T_HIT + 40 ? opts.dealerColor : T.color;
    poseKit(S.vKit, {
      hand: [vh.x, vh.y], fingT: 0.8 * Math.sin(t * 0.09) * seg(t, 3600, 3900) * (1 - seg(t, 4250, 4300)), gun: { x: vG.x, y: vG.y, r: Math.PI / 2 - sideV * 0.5, fs: sideV, holstered: true },
      hatY: hatY, hatR: hatR, hatSx: hatSx, hatSy: hatSy, hatO: hatO, hatX: hatX, look: vLook, lid: vLid, tilt: vTilt,
      browY: kf([[0, 0], [700, -1.5], [900, 0], [3300, 0], [4200, -0.5], [4280, -2.6, eoC], [T_HIT, -2.6], [T_HIT + 40, 0.8], [5300, 0.8], [5360, -2.2], [5600, -0.4], [6000, -1.2], [6400, -0.2]], t),
      browA: kf([[0, -0.6], [3300, -0.6], [4200, -1], [T_HIT + 40, 1], [5300, 1], [5360, -1.2], [5700, -0.8], [6100, -0.5]], t),
      faceO: faV, kitO: kitIn, squeeze: t > T_HIT && t < 5340, lidFill: vLidFill, eyeS: vEyeS, handS: 1
    });
    S.vKit.hand.setAttribute('opacity', f1(kitIn * 100) / 100);
    // sweat
    var sw = seg(t, 3650, 4250);
    S.sweat.setAttribute('opacity', sw > 0 && sw < 1 ? f1(Math.min(1, sw * 5) * (1 - ei(sw)) * 100) / 100 : 0);
    S.sweat.setAttribute('transform', 'translate(' + f1(-sideV * 13) + ',' + f1(-13 + 10 * ei(sw)) + ') scale(' + f1((0.7 + 0.4 * sw) * 100) / 100 + ')');
    // hat puff
    var hpf = seg(t, 6740, 7000);
    S.hatPuffs.forEach(function (e, i) {
      if (hpf <= 0 || hpf >= 1) { e.setAttribute('opacity', 0); return; }
      var a = -Math.PI / 2 + (i - 1.5) * 0.75, r = 6 + 9 * eoC(hpf);
      e.setAttribute('cx', f1(T.x + Math.cos(a) * r)); e.setAttribute('cy', f1(T.y - CR - 9 + Math.sin(a) * r * 0.7));
      e.setAttribute('r', f1((3 + 1.2 * (i % 2)) * (0.6 + 0.6 * eoC(hpf)) * (1 - 0.5 * hpf)));
      e.setAttribute('opacity', f1((1 - ei(hpf)) * 100) / 100);
    });

    // ---- final line ----
    var lp = seg(t, 7700, 8150);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }
  function eS2(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  function getScene(root, opts) {
    var c = root.__cc2paintball;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2paintball = S;
    return S;
  }

  window.CCSteal2_paintball = {
    title: 'High Noon',
    blurb: 'A tiny-hatted Western stand-off on the felt: a tumbleweed rolls by, hands hover, and Nick’s chip outdraws Nate’s with one paintball in his colour; Nate’s chip tips its hat, coated in Nick’s colour, right where it stood.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2paintball = S;
      var token = {};
      root.__cc2paintballToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2paintballToken !== token) { resolve(); return; }
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
