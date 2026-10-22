/* Closed Caption steal film: pollen (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE BUMBLEBEE (pollen)
 *
 * Everyone knows bees carry pollen from flower to flower and dust everything they land on.
 * This bee carries pollen in Nick's colour, and Nate's chip (round, with a petal-ish dashed
 * ring) looks an awful lot like a flower.
 *
 * Storyboard (ms) - top-down felt table, the bee is a little 3/4-view figure with a shadow.
 *    0-  650  Table deals in: rows drop in, chips pop on.
 *  600- 1100  Camera eases in a touch (whole rows stay in frame).
 *  700- 1150  A round fuzzy bumblebee bumbles in from the right, wings a blur, legs dangling,
 *             two fat pollen sacks (Nick's colour) on its back legs. Dotted flight trail.
 * 1150- 2400  Wobbly figure-eight over the table (speed surges, bobbing, leaning into turns).
 * 2400- 3000  Spots Nate's chip: spirals down around it. Other chips dim; Nate's chip shivers.
 * 3000- 3600  Hovers over the chip facing us, sniffs twice (antennae twitch), eyes sparkle: flower!
 * 3600- 3850  Drops onto the chip: squash, little bounce, the chip presses down, first pollen puff.
 * 3850- 5350  Busy waggle dance across the chip (two figure-eights, abdomen waggling); every step
 *             leaves a patch of Nick-coloured pollen and kicks up specks. Sacks shrink as it goes.
 * 5350- 5700  Big wet-dog shake: sacks empty in a puff of pollen; the chip is engulfed.
 * 5700- 5950  The bee hops up off the chip; the chip pops up in relief and plonks back exactly in
 *             its spot (squash, settle, ring flash in Nick's colour, dust ticks).
 * 5800- 6350  The puff drifts down and settles; the speckle fades: Nick's colour, Nick's initial.
 *             The bee hovers, admires its work, then looks at us, proud.
 * 6180- 6550  Wipes its brow with a front leg (happy closed eyes), flicks off a sweat drop.
 * 6550- 7050  Little dip, then a satisfied buzz-loop (full loop-de-loop, dotted trail).
 * 7050- 7550  Bumbles off to the top right.
 * 6950- 7450  Camera eases back out (the whole table is always in frame).  7450-7600 stillness.
 * 7600-10000  "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', YEL = '#FFC63A', DARK = '#2E2622', CREAM = '#FFE9B0';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000, ZM = 1.14, BS = 1.55;
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
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function bez(p0, p1, p2, p3, u) {
    var v = 1 - u;
    return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
            v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
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
    return { rows: rows, target: target, others: others, ini: ini };
  }

  // ---------- choreography ----------
  // Ground position (x, y on the table plane) + altitude h. Screen position of the feet = (x, y - h).
  function makePlan(L) {
    var T = L.target, tx = T.x, ty = T.y;
    var ccy = clamp(ty - 30, 577 - H / (2 * ZM) + 4, 30 + H / (2 * ZM) - 4); // whole table always in frame
    var viewTop = ccy - H / (2 * ZM);
    var cx = W / 2 + 6, cy = Math.max(ty - 95, viewTop + 108);
    var A = 104, B = 84; // lemniscate (Gerono): x = A sin th, y = B sin th cos th
    var P0 = [W + 60, cy - 80], P3 = [cx, cy];
    var tl = Math.hypot(A, B), P2 = [cx + 55 * A / tl, cy - 55 * B / tl], P1 = [cx + 170, cy - 70];
    var a0 = Math.atan2(cy - ty, cx - tx), d0 = Math.hypot(cx - tx, cy - ty);
    var aEnd = a0 - 1.8 * Math.PI, rEnd = 38;
    var oEnd = [tx + rEnd * Math.cos(aEnd), ty + rEnd * Math.sin(aEnd)];
    var loopR = 22, loopX0 = Math.min(tx - 6, W - 80);
    return { tx: tx, ty: ty, ccy: ccy, cx: cx, cy: cy, A: A, B: B, P0: P0, P1: P1, P2: P2, P3: P3, a0: a0, d0: d0, aEnd: aEnd, rEnd: rEnd, oEnd: oEnd, loopR: loopR, loopX0: loopX0 };
  }

  var GY = -8, D0 = 3850, D1 = 5350, STEP = 115;
  function danceOff(u) {
    var w = eS(u) * 0.35 + u * 0.65, psi = 0.9 * Math.PI * u;
    var x = 12 * Math.sin(2 * Math.PI * 2 * w), y = 6.5 * Math.sin(2 * Math.PI * 4 * w);
    return [x * Math.cos(psi) - y * Math.sin(psi), x * Math.sin(psi) + y * Math.cos(psi)];
  }

  function beePos(P, t) {
    var wob = function (k) { return k * (3.2 * Math.sin(t * 0.0131) + 1.8 * Math.sin(t * 0.0297 + 1.1)); };
    var x, y, h;
    if (t < 1150) {
      var u = seg(t, 700, 1150); u = lerp(u, eo(u), 0.45);
      var q = bez(P.P0, P.P1, P.P2, P.P3, u);
      x = q[0]; y = q[1]; h = 32 + 4 * Math.sin(t * 0.017);
      x += wob(1) * u; y += wob(0.8) * u;
    } else if (t < 2400) {
      var v = seg(t, 1150, 2400); v = v - 0.035 * Math.sin(4 * Math.PI * v);
      var th = Math.PI + 2 * Math.PI * v;
      x = P.cx + P.A * Math.sin(th); y = P.cy + P.B * Math.sin(th) * Math.cos(th);
      h = 32 + 6 * Math.sin(t * 0.017) + 3 * Math.sin(t * 0.041);
      x += wob(1); y += wob(0.8);
    } else if (t < 3000) {
      var o = seg(t, 2400, 3000), oa = lerp(o, eio(o), 0.5);
      var a = P.a0 - 1.8 * Math.PI * oa, r = lerp(P.d0, P.rEnd, lerp(eio(o), eoC(o), 0.6));
      x = P.tx + r * Math.cos(a); y = P.ty + r * Math.sin(a);
      x = softClamp(x, 50, W - 62, 14); y = softClamp(y, P.ty - 150, P.ty + 70, 14);
      h = lerp(32 + 6 * Math.sin(t * 0.017) + 3 * Math.sin(t * 0.041), 26, eio(o));
      var fade = 1 - o;
      x += wob(fade); y += wob(0.8 * fade);
    } else if (t < 3600) {
      var g = eio(seg(t, 3000, 3250));
      x = lerp(P.oEnd[0], P.tx, g); y = lerp(P.oEnd[1], P.ty + GY, g);
      h = lerp(26, 20, g) + 1.6 * Math.sin(t * 0.021) + sniffBob(t) * 3;
    } else if (t < D0) {
      x = P.tx; y = P.ty + GY;
      if (t < 3720) h = lerp(20, 0, ei(seg(t, 3600, 3720)));
      else h = 6 * Math.sin(Math.PI * seg(t, 3720, 3850));
    } else if (t < D1) {
      var du = seg(t, D0, D1), dd = danceOff(du);
      x = P.tx + dd[0]; y = P.ty + GY + dd[1];
      var sp = (t - D0) / STEP;
      h = 1.8 * Math.abs(Math.sin(Math.PI * sp)) * seg(t, D0, D0 + 100) * (1 - seg(t, D1 - 150, D1));
    } else if (t < 6550) {
      x = P.tx - 6 * eio(seg(t, 5700, 5900)); y = P.ty + GY;
      h = t < 5700 ? 0 : HOV * backOut(seg(t, 5700, 5880), 1.3) + 2.5 * Math.sin(t * 0.012) * seg(t, 5700, 5950);
    } else if (t < 6650) {
      var hE = HOV + 2.5 * Math.sin(6550 * 0.012);
      x = P.tx - 6; y = P.ty + GY; h = lerp(hE, 32, eio(seg(t, 6550, 6650)));
    } else if (t < 7050) {
      var ph = loopPh(t);
      x = P.loopX0 + P.loopR * Math.sin(ph); y = P.ty + GY; h = 32 + P.loopR * (1 - Math.cos(ph));
    } else {
      var e = seg(t, 7050, 7550), ee = lerp(e, ei(e), 0.5);
      var q2 = bez([P.loopX0, 32], [P.loopX0 + 70, 32], [W - 20, 70], [W + 80, 150], ee);
      x = q2[0] + wob(e); y = P.ty + GY + wob(0.6 * e) - 60 * ee; h = q2[1];
    }
    return { x: x, y: y, h: h };
  }
  function softClamp(x, lo, hi, k) { return x > hi ? hi + k * (1 - Math.exp(-(x - hi) / k)) : x < lo ? lo - k * (1 - Math.exp(-(lo - x) / k)) : x; }
  var HOV = 40;
  function loopPh(t) { var u = seg(t, 6650, 7050); return 2 * Math.PI * (eio(u) * 0.85 + u * 0.15); }
  function sniffBob(t) { return -Math.max(0, Math.sin(Math.PI * seg(t, 3260, 3380))) - Math.max(0, Math.sin(Math.PI * seg(t, 3400, 3520))); }
  function screenPos(P, t) { var b = beePos(P, t); return [b.x, b.y - b.h]; }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-pollen-' + (++uid) + '-';
    var L = layout(opts), P = makePlan(L), T = L.target;
    var DC = opts.dealerColor || '#E8559E';
    var dust = mix(DC, '#FFFFFF', 0.28), dustL = mix(DC, '#FFFFFF', 0.55), dustD = mix(DC, INK, 0.25);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var coatClip = el('clipPath', { id: id + 'coat', clipPathUnits: 'userSpaceOnUse' }, defs);
    var bodyClipEl = el('clipPath', { id: id + 'body', clipPathUnits: 'userSpaceOnUse' }, defs);
    var bodyClip = el('path', { d: '' }, bodyClipEl);

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
          var cg1 = el('g', {}, wrap); makeChip(cg1, c.color, c.ini);
          var cg2 = el('g', { 'clip-path': 'url(#' + id + 'coat)' }, wrap);
          var inner = el('g', {}, cg2);
          makeChip(inner, DC, L.ini(opts.dealer));
          // pollen speckle texture (fades once the dust settles)
          var speck = el('g', {}, inner);
          for (var s = 0; s < 46; s++) {
            var ang = hash(s + 3) * Math.PI * 2, rr = Math.sqrt(hash(s + 91)) * 21;
            el('circle', { cx: f1(Math.cos(ang) * rr), cy: f1(Math.sin(ang) * rr), r: f1(0.8 + hash(s + 7) * 1.1), fill: s % 3 === 0 ? dustD : dustL }, speck);
          }
          // soft fuzzy edge of each patch: drawn as a lighter rim (part of the same clipped group)
          V = { wrap: wrap, sh: sh, g1: cg1, g2: inner, speck: speck };
        } else {
          var cg = el('g', {}, chipLayer === wrap ? wrap : wrap); makeChip(cg, c.color, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });

    // coat patches (clip circles) from footfalls
    var falls = [];
    falls.push({ t: 3720, x: 0, y: 3, r: 10 });
    var nSteps = Math.floor((D1 - 120 - D0) / STEP);
    for (var i = 1; i <= nSteps; i++) {
      var ti = D0 + i * STEP, u = seg(ti, D0, D1), d = danceOff(u), side = i % 2 ? 1 : -1;
      var fx = d[0] + side * 5.5 + (hash(i) - 0.5) * 3, fy = d[1] + 2 + (hash(i + 40) - 0.5) * 4;
      var m = Math.hypot(fx, fy); if (m > 16) { fx *= 16 / m; fy *= 16 / m; }
      falls.push({ t: ti, x: fx, y: fy, r: 9 + hash(i + 9) * 3, side: side });
    }
    falls.forEach(function (f) { f.el = el('circle', { cx: f1(T.x + f.x), cy: f1(T.y + f.y), r: 0 }, coatClip); });
    var finalCoat = el('circle', { cx: T.x, cy: T.y, r: 0 }, coatClip);

    var ring = el('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // bee shadow + trail + particles
    var shadow = el('ellipse', { rx: 14, ry: 5, fill: INK, opacity: 0.2 }, cam);
    var trail = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 6', opacity: 0 }, cam);
    var cloudG = el('g', {}, cam), clouds = [];
    for (i = 0; i < 5; i++) clouds.push(el('circle', { r: 0, fill: dust, opacity: 0 }, cloudG));
    var partG = el('g', {}, cam), kicks = [], puffs = [];
    falls.forEach(function (f, k) {
      for (var j = 0; j < 3; j++) kicks.push({ f: f, j: j, k: k, e: el('circle', { r: 1.6, fill: j === 2 ? dustL : dust, stroke: INK, 'stroke-width': 0.5, opacity: 0 }, partG) });
    });
    for (i = 0; i < 22; i++) {
      var a = (i / 22) * Math.PI * 2 + (hash(i + 5) - 0.5) * 0.5;
      var land = Math.sqrt(hash(i + 70)) * 18, la = hash(i + 33) * Math.PI * 2;
      puffs.push({ a: a, sp: 26 + hash(i + 2) * 22, rise: 14 + hash(i + 8) * 16, lx: Math.cos(la) * land, ly: Math.sin(la) * land, r: 2 + hash(i + 1) * 1.8,
        e: el('circle', { r: 1.8, fill: i % 4 === 0 ? dustL : dust, stroke: INK, 'stroke-width': 0.5, opacity: 0 }, partG) });
    }

    // ----- the bee -----
    var bee = el('g', {}, cam);
    var B = {};
    B.farLeg = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, bee);
    B.farSack = el('ellipse', { fill: mix(DC, INK, 0.12), stroke: INK, 'stroke-width': 1.5 }, bee);
    B.wings = [];
    for (i = 0; i < 6; i++) B.wings.push(el('ellipse', { rx: 10.5, ry: 6.2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.2 }, bee));
    B.sting = el('path', { fill: INK }, bee);
    B.body = el('path', { fill: YEL, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, bee);
    var stripes = el('g', { 'clip-path': 'url(#' + id + 'body)' }, bee);
    B.tail = el('circle', { r: 7, fill: CREAM }, stripes);
    B.stripe = el('path', { fill: 'none', stroke: DARK, 'stroke-width': 5.2 }, stripes);
    B.stripeF = el('path', { fill: 'none', stroke: DARK, 'stroke-width': 5 }, stripes);
    B.fuzzHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, stripes);
    B.fuzzLo = el('path', { fill: 'none', stroke: INK, 'stroke-opacity': 0.13, 'stroke-width': 4, 'stroke-linecap': 'round' }, stripes);
    B.legs = [0, 1, 2].map(function () { return el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, bee); });
    B.sack = el('ellipse', { fill: DC, stroke: INK, 'stroke-width': 1.6 }, bee);
    B.sackHi = el('ellipse', { fill: '#FFFFFF', 'fill-opacity': 0.4 }, bee);
    B.sackSpk = el('path', { fill: dustD }, bee);
    B.ant = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, bee);
    B.antTips = el('path', { fill: INK }, bee);
    B.head = el('circle', { r: 10, fill: DARK, stroke: INK, 'stroke-width': 2.2 }, bee);
    B.headHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.22, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, bee);
    B.eyeW = [0, 1].map(function () { return el('ellipse', { rx: 3.2, ry: 3.8, fill: '#FFFFFF' }, bee); });
    B.pup = [0, 1].map(function () { return el('circle', { r: 2.1, fill: INK }, bee); });
    B.glint = [0, 1].map(function () { return el('circle', { r: 0.8, fill: '#FFFFFF' }, bee); });
    B.happy = el('path', { fill: 'none', stroke: CREAM, 'stroke-width': 1.7, 'stroke-linecap': 'round' }, bee);
    B.brows = el('path', { fill: 'none', stroke: CREAM, 'stroke-width': 1.9, 'stroke-linecap': 'round' }, bee);
    B.mouth = el('path', { fill: 'none', stroke: CREAM, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, bee);
    B.cheeks = el('path', { fill: '#FF8F7A', opacity: 0.45 }, bee);
    B.arm = el('path', { fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, bee);
    B.armIn = el('path', { fill: 'none', stroke: YEL, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, bee);
    B.drop = el('path', { fill: '#BFE6F7', stroke: INK, 'stroke-width': 1 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return { opts: opts, L: L, P: P, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, falls: falls, finalCoat: finalCoat, ring: ring, ticks: ticks,
      shadow: shadow, trail: trail, clouds: clouds, kicks: kicks, puffs: puffs, bee: bee, B: B, bodyClip: bodyClip, line: line };
  }

  // ---------- bee state (pure function of t) ----------
  function beeState(P, t) {
    var b = beePos(P, t), b0 = beePos(P, t - 24), b1 = beePos(P, t + 24);
    var vx = (b1.x - b0.x) / 48 * 1000, vy = ((b1.y - b1.h) - (b0.y - b0.h)) / 48 * 1000;
    var bm = beePos(P, t - 90), bp = beePos(P, t + 90);
    var ax = ((bp.x - b.x) - (b.x - bm.x)) / (0.09 * 0.09);
    var st = {};
    st.fly = 1 - seg(t, 3640, 3720) * (1 - seg(t, 5690, 5740));
    // facing: from horizontal velocity, overridden for front-facing moments
    var yawV = Math.tanh(vx / 70);
    var front = clamp(seg(t, 3000, 3200) * (1 - seg(t, 3880, 4000))) + clamp(seg(t, 5250, 5400) * (1 - seg(t, 6560, 6650)));
    var danceYaw = Math.tanh(vx / 22) * 0.85 * seg(t, 3880, 4000) * (1 - seg(t, 5250, 5400));
    var loopW = seg(t, 6600, 6680);
    st.yaw = lerp(lerp(yawV, 0, clamp(front)), 1, loopW);
    if (t >= D0 - 30 && t < 5400) st.yaw = lerp(st.yaw, danceYaw, seg(t, 3880, 4000) * (1 - seg(t, 5250, 5400)));
    // tilt into motion (flight)
    var tilt = clamp(vx * 0.07, -20, 20) * st.fly * (1 - loopW) + clamp(-vy * 0.02, -6, 6) * st.fly * Math.sign(st.yaw || 1) * (1 - loopW);
    if (t >= 6650 && t < 7050) {
      var ph = loopPh(t);
      tilt = -ph * 180 / Math.PI;
    } else if (t >= 7050) tilt = -360 + clamp(vx * 0.05, -15, 15) - 8;
    st.tilt = tilt;
    // waggle (rotation about the feet) during dance; shake
    var wag = 0;
    if (t > D0 && t < D1) {
      var du = seg(t, D0, D1);
      wag = 11 * Math.sin((t - D0) * 2 * Math.PI * 7.5 / 1000) * Math.abs(Math.cos(2 * Math.PI * 2 * du)) * seg(t, D0, D0 + 150) * (1 - seg(t, D1 - 150, D1));
    }
    var shk = Math.sin(Math.PI * seg(t, 5350, 5700));
    wag += 13 * shk * Math.sin((t - 5350) * 2 * Math.PI * 13 / 1000);
    st.wag = wag; st.shake = shk;
    // squash/stretch
    var sx = 1, sy = 1;
    sy -= 0.16 * Math.sin(Math.PI * seg(t, 3720, 3800)); // land squash
    sy += spring(t - 3800, 0.08, 4, 90);
    sy -= 0.07 * Math.sin(Math.PI * seg(t, 3560, 3620)); // pre-drop gather
    if (t > D0 && t < D1) sy -= 0.05 * Math.abs(Math.cos(Math.PI * (t - D0) / STEP)) * seg(t, D0, D0 + 100);
    sy += 0.12 * shk * Math.sin((t - 5350) * 2 * Math.PI * 26 / 1000);
    sy -= 0.2 * eio(seg(t, 5630, 5690)) * (1 - seg(t, 5700, 5740)); // crouch
    sy += 0.16 * Math.sin(Math.PI * seg(t, 5700, 5850)); // launch stretch
    sy -= 0.08 * Math.sin(Math.PI * seg(t, 6550, 6680)); // gather before the loop
    sy += 0.04 * Math.sin(t * 0.009) * (1 - st.fly); // breathing
    sy += 0.05 * Math.sin(Math.PI * seg(t, 6200, 6550)); // big satisfied breath during wipe
    sx = 1 + (1 - sy) * 0.7;
    st.sx = sx; st.sy = sy;
    st.vx = vx; st.ax = ax;
    st.pos = b;
    return st;
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var P = S.P, L = S.L, T = L.target, B = S.B, opts = S.opts;

    // camera: gentle push-in (rows stay whole), pull back for payoff
    var zk = eioC(seg(t, 600, 1150)) * (1 - eioC(seg(t, 6950, 7450)));
    var Z = lerp(1, ZM, zk);
    var ccx = W / 2, ccy = lerp(H / 2, P.ccy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 2450, 2750)) * (1 - eio(seg(t, 6700, 7200)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // victim chip: pop, shiver when spotted, pressed while bee stands on it, relief pop & plonk at takeoff
    var V = S.V, sc = chipPop(T), dx = 0, dy = 0, shOff = 0;
    if (t > 2500 && t < 2850) { var q = seg(t, 2500, 2850); dx = 1.8 * Math.sin((t - 2500) * 0.16) * (1 - q); sc *= 1 - 0.04 * Math.sin(Math.PI * q); }
    var press = 0.05 * eo(seg(t, 3720, 3790)) * (1 - seg(t, 5700, 5730));
    if (t > D0 && t < D1) press += 0.012 * Math.abs(Math.sin(Math.PI * (t - D0) / STEP));
    press += 0.03 * Math.sin(Math.PI * seg(t, 5630, 5700)); // bee crouch pushes it
    sc *= 1 - press;
    if (t >= 5700 && t < 5860) { var r1 = eo(seg(t, 5700, 5860)); sc = lerp(1 - 0.05, 1.12, r1); dy = -3.5 * r1; shOff = 5 * r1; }
    else if (t >= 5860 && t < 5940) { var r2 = ei(seg(t, 5860, 5940)); sc = lerp(1.12, 0.92, r2); dy = -3.5 * (1 - r2); shOff = 5 * (1 - r2); }
    else if (t >= 5940) { var dd = t - 5940; sc = 1 - 0.08 * Math.exp(-dd / 110) * Math.cos(2 * Math.PI * 4.5 * dd / 1000); }
    var trS = 'translate(' + f1(T.x + dx) + ',' + f1(T.y + dy) + ') scale(' + sc.toFixed(4) + ')';
    V.g1.setAttribute('transform', trS); V.g2.setAttribute('transform', trS);
    V.sh.setAttribute('r', f1(CR * Math.min(sc, 1.04)));
    V.sh.setAttribute('cx', f1(T.x + 1.5 + shOff * 0.4)); V.sh.setAttribute('cy', f1(T.y + 3.5 + shOff));
    V.sh.setAttribute('opacity', f1(28 - shOff * 1.6) / 100);
    // coat patches grow from footfalls (positions follow the chip scale around its centre)
    S.falls.forEach(function (f) {
      var p = seg(t, f.t, f.t + 260);
      f.el.setAttribute('r', p > 0 ? f1(f.r * eoC(p) * sc) : 0);
      f.el.setAttribute('cx', f1(T.x + dx + f.x * sc)); f.el.setAttribute('cy', f1(T.y + dy + f.y * sc));
    });
    var fc = eio(seg(t, 5480, 5900));
    S.finalCoat.setAttribute('r', fc > 0 ? f1(Math.max(0.1, 26 * fc * sc)) : 0);
    S.finalCoat.setAttribute('cx', f1(T.x + dx)); S.finalCoat.setAttribute('cy', f1(T.y + dy));
    V.speck.setAttribute('opacity', f1((1 - eio(seg(t, 5950, 6350))) * 100) / 100);

    // set-down ring + ticks
    var rp = seg(t, 5940, 6440);
    S.ring.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ring.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ring.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 5940, 6220);
    if (dp > 0 && dp < 1) {
      var tdd = '', ra = 27 + 9 * eoC(dp), rb = ra + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        tdd += 'M' + f1(T.x + Math.cos(a) * ra) + ' ' + f1(T.y + Math.sin(a) * ra) + 'L' + f1(T.x + Math.cos(a) * rb) + ' ' + f1(T.y + Math.sin(a) * rb);
      });
      S.ticks.setAttribute('d', tdd); S.ticks.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);

    // kicked-up pollen specks per footfall
    S.kicks.forEach(function (k) {
      var f = k.f, p = seg(t, f.t, f.t + 380 + 60 * k.j);
      if (p <= 0 || p >= 1) { k.e.setAttribute('opacity', 0); return; }
      var dir = (k.j - 1) * 0.9 + (f.side || 1) * 0.6 + (hash(k.k * 3 + k.j) - 0.5);
      var dist = 9 + 7 * hash(k.k + k.j * 17);
      var x = T.x + f.x + Math.sin(dir) * dist * eo(p), y = T.y + f.y - Math.cos(dir) * dist * 0.4 * eo(p) - 12 * (1 + hash(k.k + 5 * k.j)) * 4 * p * (1 - p) * 0.6;
      k.e.setAttribute('cx', f1(x)); k.e.setAttribute('cy', f1(y));
      k.e.setAttribute('r', f1(1.7 + 0.9 * (1 - p)));
      k.e.setAttribute('opacity', f1((1 - ei(p)) * 100) / 100);
    });
    // big puff on the shake, then settling
    S.puffs.forEach(function (o, i) {
      var t0 = 5420 + (i % 5) * 18, p1 = seg(t, t0, t0 + 300), p2 = seg(t, t0 + 300, 6050 + (i % 4) * 40);
      if (t < t0 || p2 >= 1) { o.e.setAttribute('opacity', 0); return; }
      var ox = T.x, oy = T.y - 16;
      var px = ox + Math.cos(o.a) * o.sp * eoC(p1), py = oy + Math.sin(o.a) * o.sp * 0.55 * eoC(p1) - o.rise * eo(p1);
      var lx = T.x + o.lx, ly = T.y + o.ly;
      var e2 = eio(p2);
      var x = lerp(px, lx, e2) + 3 * Math.sin(t * 0.012 + i) * (1 - e2), y = lerp(py, ly, e2);
      o.e.setAttribute('cx', f1(x)); o.e.setAttribute('cy', f1(y));
      o.e.setAttribute('r', f1(o.r * (1 - 0.4 * e2) + 0.6));
      o.e.setAttribute('opacity', f1((1 - ei(p2)) * 100) / 100);
    });
    S.clouds.forEach(function (c, i) {
      var t0 = 5400 + i * 40, p = seg(t, t0, t0 + 650);
      if (p <= 0 || p >= 1) { c.setAttribute('opacity', 0); return; }
      var a = i * 1.26 + 0.4;
      c.setAttribute('cx', f1(T.x + Math.cos(a) * 14 * eo(p))); c.setAttribute('cy', f1(T.y - 14 + Math.sin(a) * 8 * eo(p) - 8 * eo(p)));
      c.setAttribute('r', f1(10 + 20 * eoC(p)));
      c.setAttribute('opacity', f1(0.6 * (1 - eio(p)) * 100) / 100);
    });

    // ---- the bee ----
    var vis = t > 690 && t < 7700;
    S.bee.setAttribute('opacity', vis ? 1 : 0);
    S.shadow.setAttribute('opacity', 0); S.trail.setAttribute('opacity', 0); S.B.drop.setAttribute('opacity', 0);
    if (vis) drawBee(S, t);

    var lp = seg(t, 7600, 8000);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function drawBee(S, t) {
    var P = S.P, B = S.B, st = beeState(P, t), b = st.pos;
    var yaw = clamp(st.yaw, -1, 1), ay = Math.abs(yaw), sg = yaw >= 0 ? 1 : -1, fly = st.fly;

    // shadow on the felt / chip
    var hh = Math.max(0, b.h);
    S.shadow.setAttribute('cx', f1(b.x)); S.shadow.setAttribute('cy', f1(b.y + 1));
    S.shadow.setAttribute('rx', f1(15 * BS * (1 - hh / 160))); S.shadow.setAttribute('ry', f1(5.2 * BS * (1 - hh / 160)));
    S.shadow.setAttribute('opacity', f1(clamp(0.24 - hh / 600) * 100) / 100);

    // dotted flight trail (sampled from the pure path)
    var trOn = clamp(seg(t, 800, 950) * (1 - seg(t, 2900, 3150))) + clamp(seg(t, 6650, 6720) * (1 - seg(t, 7250, 7500)));
    if (trOn > 0.01) {
      var d = '', n = 34;
      for (var i = 0; i <= n; i++) {
        var tt = t - 60 - i * 22; if (tt < 700) break;
        var sp = screenPos(P, tt);
        d += (i ? 'L' : 'M') + f1(sp[0]) + ' ' + f1(sp[1] - 20 * BS);
      }
      S.trail.setAttribute('d', d); S.trail.setAttribute('opacity', f1(0.55 * trOn * 100) / 100);
    }

    // transform: feet at ground screen point; tilt about body centre; waggle about feet
    var fxp = b.x, fyp = b.y - b.h;
    var bob = fly * (1.2 * Math.sin(t * 0.06));
    S.bee.setAttribute('transform', 'translate(' + f1(fxp) + ',' + f1(fyp + bob) + ') scale(' + BS + ') rotate(' + f1(st.wag) + ') translate(0,-20) rotate(' + f1(st.tilt) + ') translate(0,20) scale(' + f2(st.sx) + ',' + f2(st.sy) + ')');

    var cxB = 0, cyB = -20, rx = 16.5, ry = 14.8;
    // fuzzy scalloped body
    var N = 30, bd = '', fz = 0.5 + 0.6 * st.shake;
    for (i = 0; i <= N; i++) {
      var a = i / N * Math.PI * 2, am = (i - 0.5) / N * Math.PI * 2;
      var px = cxB + rx * Math.cos(a), py = cyB + ry * Math.sin(a);
      var bump = 2.1 + fz * Math.sin(i * 2.3 + t * 0.02);
      var qx = cxB + (rx + bump) * Math.cos(am), qy = cyB + (ry + bump) * Math.sin(am);
      bd += i === 0 ? 'M' + f1(px) + ' ' + f1(py) : 'Q' + f1(qx) + ' ' + f1(qy) + ' ' + f1(px) + ' ' + f1(py);
    }
    bd += 'Z';
    B.body.setAttribute('d', bd); S.bodyClip.setAttribute('d', bd);
    // stripes and tail toward the rear (opposite the face)
    var s1 = -yaw * 3.5, s2 = -yaw * 11.5;
    var stp = '';
    [s1, s2].forEach(function (sx, k) {
      var w = (k ? 1 : 0.9);
      stp += 'M' + f1(sx + yaw * 1.5) + ' ' + f1(cyB - 18) + 'Q' + f1(sx - yaw * 5 * w) + ' ' + f1(cyB) + ' ' + f1(sx + yaw * 1.5) + ' ' + f1(cyB + 18);
    });
    B.stripe.setAttribute('d', stp);
    B.stripe.setAttribute('stroke-width', f1(lerp(6.5, 5, ay)));
    B.stripe.setAttribute('opacity', f1(clamp(ay * 1.6) * 100) / 100);
    B.stripeF.setAttribute('d', 'M-20 ' + f1(cyB - 6) + 'Q0 ' + f1(cyB - 12) + ' 20 ' + f1(cyB - 6) + 'M-20 ' + f1(cyB + 6) + 'Q0 ' + f1(cyB + 1) + ' 20 ' + f1(cyB + 6));
    B.stripeF.setAttribute('opacity', f1(clamp(1 - ay * 1.6) * 100) / 100);
    B.tail.setAttribute('cx', f1(-yaw * 19.5)); B.tail.setAttribute('cy', f1(cyB + 1)); B.tail.setAttribute('opacity', f1(ay * 100) / 100);
    B.fuzzHi.setAttribute('d', 'M' + f1(-9 + yaw * 3) + ' ' + f1(cyB - 9) + 'Q' + f1(yaw * 3) + ' ' + f1(cyB - 14) + ' ' + f1(8 + yaw * 3) + ' ' + f1(cyB - 10));
    B.fuzzLo.setAttribute('d', 'M' + f1(-12) + ' ' + f1(cyB + 11) + 'Q0 ' + f1(cyB + 16) + ' 12 ' + f1(cyB + 11));
    // stinger
    var stX = -yaw * 18.5, stY = cyB + 3;
    B.sting.setAttribute('d', ay > 0.2 ? 'M' + f1(stX) + ' ' + f1(stY - 2.4) + 'L' + f1(stX - sg * 4.5 * ay) + ' ' + f1(stY + 0.6) + 'L' + f1(stX) + ' ' + f1(stY + 2.4) + 'Z' : '');

    // wings (behind body): blurred fan in flight, folded when standing
    var wx = -yaw * 3, wy = cyB - 11;
    var amp = 38 * fly, omega = 0.83;
    for (i = 0; i < 6; i++) {
      var wi = i % 2, ghost = (i / 2) | 0;
      var base = -90 - yaw * 38 + (wi ? 1 : -1) * lerp(42, 12, ay);
      var fold = (1 - fly) * (wi ? 1 : -1) * lerp(18, 6, ay);
      var flap = amp * Math.sin(t * omega + ghost * 2.1 + wi * 0.6);
      if (fly < 0.5 && st.shake > 0) flap += 22 * st.shake * Math.sin(t * 0.7 + ghost);
      var ang = (base + fold + flap) * Math.PI / 180;
      var ex = wx + Math.cos(ang) * 9.5, ey = wy + Math.sin(ang) * 9.5;
      var e = B.wings[i];
      e.setAttribute('cx', f1(ex)); e.setAttribute('cy', f1(ey));
      e.setAttribute('transform', 'rotate(' + f1(ang * 180 / Math.PI) + ' ' + f1(ex) + ' ' + f1(ey) + ')');
      var op = ghost === 0 ? lerp(0.9, 0.38, fly) : 0.3 * fly + (st.shake > 0 && fly < 0.5 ? 0.25 * st.shake : 0);
      e.setAttribute('fill-opacity', f1(op * 100) / 100);
      e.setAttribute('stroke-opacity', f1(op * 0.8 * 100) / 100);
      e.setAttribute('opacity', op > 0.01 ? 1 : 0);
    }

    // legs: dangle and swing in flight (lag behind acceleration), plant when standing
    var swing = clamp(-st.ax / 9000, -0.6, 0.6);
    var frontX = [-5, 4.5, -11], sideX = [6.5, 0.5, -6.5];
    var sackScale = (1 - 0.45 * seg(t, 3720, D1)) * (1 - 0.75 * eio(seg(t, 5380, 5470)));
    sackScale *= 1 + spring(t - 3720, 0.12, 4, 90);
    var stepPh = (t > D0 && t < D1) ? (t - D0) / STEP : 0;
    var legD = [], sackPos = null;
    for (var k = 0; k < 3; k++) {
      var rxl = lerp(frontX[k], sideX[k] * sg, ay), ryl = -9;
      var dang = -sg * 0.5 * ay + swing + 0.18 * Math.sin(t * 0.011 + k * 1.7);
      var fxl = rxl + Math.sin(dang) * 10, fyl = ryl + Math.cos(dang) * 10;
      var lift = (t > D0 && t < D1) ? Math.max(0, Math.sin(Math.PI * (stepPh + (k % 2) * 0.5))) * 2.5 : 0;
      var sfx = rxl + (k === 2 ? -sg * 1.5 * ay : 0.5 * sg * ay), sfy = -lift;
      fxl = lerp(fxl, sfx, 1 - fly); fyl = lerp(fyl, sfy, 1 - fly);
      var kxl = (rxl + fxl) / 2 + sg * 2.4 * ay, kyl = (ryl + fyl) / 2;
      legD.push('M' + f1(rxl) + ' ' + f1(ryl) + 'Q' + f1(kxl) + ' ' + f1(kyl) + ' ' + f1(fxl) + ' ' + f1(fyl));
      if (k === 2) sackPos = [fxl, fyl - 3.5];
    }
    // wipe-brow arm replaces front leg 0
    var wipe = seg(t, 6180, 6520), armOn = wipe > 0 && wipe < 1;
    B.legs.forEach(function (lg, k) { lg.setAttribute('d', armOn && k === 1 ? '' : legD[k]); });
    var ss = Math.max(0.15, sackScale);
    B.sack.setAttribute('cx', f1(sackPos[0])); B.sack.setAttribute('cy', f1(sackPos[1]));
    B.sack.setAttribute('rx', f1(6 * ss)); B.sack.setAttribute('ry', f1(5.2 * ss));
    B.sackHi.setAttribute('cx', f1(sackPos[0] - 1.8 * ss)); B.sackHi.setAttribute('cy', f1(sackPos[1] - 2 * ss));
    B.sackHi.setAttribute('rx', f1(2 * ss)); B.sackHi.setAttribute('ry', f1(1.3 * ss));
    B.sackSpk.setAttribute('d', ss > 0.3 ? circleD(sackPos[0] + 2 * ss, sackPos[1] + 1 * ss, 0.8) + circleD(sackPos[0] - 0.5 * ss, sackPos[1] + 2.6 * ss, 0.7) + circleD(sackPos[0] + 3.2 * ss, sackPos[1] - 2 * ss, 0.6) : '');
    // far back leg + its sack (peeks out the other side)
    var frx = lerp(11, -4 * sg, ay), fry = -10;
    var fdang = -sg * 0.5 * ay + swing * 0.8 + 0.18 * Math.sin(t * 0.011 + 4);
    var ffx = lerp(frx + Math.sin(fdang) * 9, frx - sg * 1.5 * ay, 1 - fly), ffy = lerp(fry + Math.cos(fdang) * 9, -1.5, 1 - fly);
    B.farLeg.setAttribute('d', 'M' + f1(frx) + ' ' + f1(fry) + 'L' + f1(ffx) + ' ' + f1(ffy));
    B.farSack.setAttribute('cx', f1(ffx)); B.farSack.setAttribute('cy', f1(ffy - 3.2));
    B.farSack.setAttribute('rx', f1(5.4 * ss)); B.farSack.setAttribute('ry', f1(4.7 * ss));

    // head
    var hx = lerp(0, sg * 14, ay), hy = lerp(-17, -23, ay) + 2.2 * sniffBob(t) + (fly < 0.5 ? 0 : 0);
    // look down at chip during dance / sniff
    var lookDown = clamp(seg(t, 3000, 3200) * (1 - seg(t, 3530, 3600))) + clamp(seg(t, 3900, 4000) * (1 - seg(t, 5300, 5400))) * 0.8 + clamp(seg(t, 5780, 5860) * (1 - seg(t, 6000, 6080)));
    hy += 1.5 * lookDown;
    B.head.setAttribute('cx', f1(hx)); B.head.setAttribute('cy', f1(hy));
    B.headHi.setAttribute('d', 'M' + f1(hx - 6) + ' ' + f1(hy - 4) + 'Q' + f1(hx - 4) + ' ' + f1(hy - 7.5) + ' ' + f1(hx + 0.5) + ' ' + f1(hy - 8));
    // antennae
    var twitch = 1.5 * Math.sin(t * 0.03) + 3 * (Math.sin(Math.PI * seg(t, 3260, 3330)) + Math.sin(Math.PI * seg(t, 3400, 3470))) + 2.5 * st.shake * Math.sin(t * 0.08);
    var ad = '', atd = '';
    [-1, 1].forEach(function (s, j) {
      var r0x = hx + s * 3.6 + yaw * 1.5, r0y = hy - 8;
      var tipx = r0x + s * (5 - 2 * ay) + yaw * 5 + (fly ? -yaw * 3 * fly : 0), tipy = r0y - 9 + (j ? twitch * 0.6 : twitch * 0.4) - (lookDown ? 0 : 0);
      tipx += s * 0.8 * twitch * (j ? -0.4 : 0.4);
      ad += 'M' + f1(r0x) + ' ' + f1(r0y) + 'Q' + f1(r0x + s * 0.5) + ' ' + f1(r0y - 6) + ' ' + f1(tipx) + ' ' + f1(tipy);
      atd += circleD(tipx, tipy, 1.9);
    });
    B.ant.setAttribute('d', ad); B.antTips.setAttribute('d', atd);

    // face
    var eyeCx = hx + yaw * 3.6, eyeY = hy - 0.5 + 1.2 * lookDown, spread = 4.2 * (1 - 0.3 * ay);
    var sparkle = Math.sin(Math.PI * seg(t, 3480, 3700));
    var happyClosed = clamp(seg(t, 6180, 6230) * (1 - seg(t, 6520, 6580)));
    var blink = (Math.abs(t - 2150) < 60 || Math.abs(t - 4700) < 55 || Math.abs(t - 7000) < 50) ? 1 : 0;
    // look vector
    var lx = yaw * 0.9 * fly, ly = 0.15;
    ly = lerp(ly, 1, lookDown);
    if (t > 2450 && t < 3000) { var tgx = P.tx - b.x, tgy = P.ty - (b.y - b.h); var m = Math.hypot(tgx, tgy) || 1; lx = tgx / m; ly = tgy / m; }
    var cam1 = clamp(seg(t, 6020, 6120) * (1 - seg(t, 6560, 6640)));
    lx = lerp(lx, 0, cam1); ly = lerp(ly, 0, cam1);
    var ew = 3.2 + 0.5 * sparkle, eh = (3.9 + 0.5 * sparkle) * (1 - 0.85 * blink);
    var hap = '';
    [-1, 1].forEach(function (s, j) {
      var ex = eyeCx + s * spread, sc = 1 - 0.18 * ay * (s === -sg ? 1 : 0);
      var vis = happyClosed < 0.5;
      B.eyeW[j].setAttribute('cx', f1(ex)); B.eyeW[j].setAttribute('cy', f1(eyeY));
      B.eyeW[j].setAttribute('rx', f1(ew * sc)); B.eyeW[j].setAttribute('ry', f1(eh * sc));
      B.eyeW[j].setAttribute('opacity', vis ? 1 : 0);
      var px = ex + lx * 1.2, py = eyeY + ly * 1.5;
      B.pup[j].setAttribute('cx', f1(px)); B.pup[j].setAttribute('cy', f1(py));
      B.pup[j].setAttribute('r', f1((2.1 + 0.4 * sparkle) * sc * (1 - 0.8 * blink)));
      B.pup[j].setAttribute('opacity', vis ? 1 : 0);
      B.glint[j].setAttribute('cx', f1(px - 0.8)); B.glint[j].setAttribute('cy', f1(py - 0.9));
      B.glint[j].setAttribute('r', f1(0.75 + 0.5 * sparkle));
      B.glint[j].setAttribute('opacity', vis && !blink ? 1 : 0);
      if (!vis) hap += 'M' + f1(ex - 2.6) + ' ' + f1(eyeY + 0.8) + 'Q' + f1(ex) + ' ' + f1(eyeY - 2.6) + ' ' + f1(ex + 2.6) + ' ' + f1(eyeY + 0.8);
    });
    B.happy.setAttribute('d', hap);
    // brows: determined (inner ends low) in flight & dance, raised/curious at sniff, relaxed-happy at wipe
    var det = kf([[0, 1], [2900, 1], [3050, -0.6], [3600, -0.6], [3750, 0.2], [3900, 0.9], [5300, 0.9], [5450, 0.4], [5750, -0.2], [6100, -0.4], [6560, 0.3], [6650, 0.6], [7000, 0.1]], t);
    var bdp = '';
    [-1, 1].forEach(function (s) {
      var ex = eyeCx + s * spread, inner = ex - s * 2.6, outer = ex + s * 2.6, by = eyeY - 5.6 - 0.6 * sparkle;
      bdp += 'M' + f1(outer) + ' ' + f1(by - 0.4 * det) + 'L' + f1(inner) + ' ' + f1(by + 1.6 * det - 0.4);
    });
    B.brows.setAttribute('d', bdp);
    var mx0 = hx + yaw * 4.2, my0 = hy + 5.2;
    var smile = kf([[0, 0], [3480, 0], [3600, 1], [3800, 0.4], [5600, 0.4], [5800, 1]], t), sniffO = Math.max(Math.sin(Math.PI * seg(t, 3260, 3380)), Math.sin(Math.PI * seg(t, 3400, 3520)));
    if (sniffO > 0.2) B.mouth.setAttribute('d', circleD(mx0, my0, 1 + 0.4 * sniffO));
    else B.mouth.setAttribute('d', 'M' + f1(mx0 - 2.2) + ' ' + f1(my0) + 'Q' + f1(mx0) + ' ' + f1(my0 + 2.6 * smile - 0.2) + ' ' + f1(mx0 + 2.2) + ' ' + f1(my0));
    B.cheeks.setAttribute('d', circleD(eyeCx - spread - 1.5, eyeY + 4, 1.8 * (1 - 0.5 * ay)) + circleD(eyeCx + spread + 1.5, eyeY + 4, 1.8 * (1 - 0.5 * ay)));

    // wipe-brow arm
    if (armOn) {
      var shx = 5.5, shy = -10, wp = eio(clamp(wipe * 1.25));
      var reach = Math.sin(Math.PI * clamp(wipe * 1.1));
      var hxp = lerp(hx + 8, hx - 7, wp), hyp = eyeY - 6 + 1.5 * Math.sin(Math.PI * wp);
      var hxx = lerp(shx + 4, hxp, Math.min(1, reach * 1.6)), hyy = lerp(shy + 8, hyp, Math.min(1, reach * 1.6));
      var armD = 'M' + f1(shx) + ' ' + f1(shy) + 'Q' + f1(shx + 9) + ' ' + f1((shy + hyy) / 2) + ' ' + f1(hxx) + ' ' + f1(hyy);
      B.arm.setAttribute('d', armD); B.armIn.setAttribute('d', armD);
    } else { B.arm.setAttribute('d', ''); B.armIn.setAttribute('d', ''); }
    // sweat drop flicked off (world space, from the brow)
    var dpp = seg(t, 6430, 6750);
    if (dpp > 0 && dpp < 1) {
      var ox = b.x + (hx - 9) * BS, oy = b.y - b.h + (eyeY - 6) * BS;
      var x = ox - 30 * dpp, y = oy - 22 * 4 * dpp * (1 - dpp) + 30 * dpp * dpp;
      var r = 3;
      S.B.drop.setAttribute('d', 'M' + f1(x) + ' ' + f1(y - r * 2) + 'Q' + f1(x + r * 1.2) + ' ' + f1(y - r * 0.2) + ' ' + f1(x) + ' ' + f1(y + r) + 'Q' + f1(x - r * 1.2) + ' ' + f1(y - r * 0.2) + ' ' + f1(x) + ' ' + f1(y - r * 2) + 'Z');
      S.B.drop.setAttribute('opacity', f1((1 - ei(dpp)) * 100) / 100);
    }
  }

  function getScene(root, opts) {
    var c = root.__cc2pollen;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2pollen = S;
    return S;
  }

  window.CCSteal2_pollen = {
    title: 'The Bumblebee',
    blurb: 'A round, fuzzy bumblebee mistakes Nate’s chip for a flower, lands on it and waggle-dances it into a coat of Nick-coloured pollen, then wipes its brow and buzzes off.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2pollen = S;
      var token = {};
      root.__cc2pollenToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2pollenToken !== token) { resolve(); return; }
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
