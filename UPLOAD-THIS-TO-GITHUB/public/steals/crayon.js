/* Closed Caption steal film: crayon (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE COLOURING BOOK (crayon)
 *
 * Nate's chip turns into a colouring-book outline, and a fat wax crayon in Nick's colour
 * colours it in with the earnest energy of a small child.
 * Top-down felt table; the crayon is a little front-view character standing on the card.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  550-1150  Camera eases in a touch (whole rows stay in frame). Other chips dim;
 *            Nate's chip gives a nervous little hop-shiver.
 * 1000-1650  DRAIN: Nate's colour (and his initial) drains out of the chip like a sink,
 *            wavy surface dropping, two drips falling off the bottom. The dashed ring
 *            turns to ink. What is left is a blank colouring-book outline.
 * 1650-1950  Beat: the empty outline just sits there, gives a tiny forlorn shiver.
 * 1900-2400  A fat wax crayon in Nick's colour (paper wrapper, torn flap) tumbles in from
 *            off the table, cartwheeling, and lands upright beside the chip
 *            (squash, rebound hop, wobbly settle).
 * 2600-2960  It looks at the blank chip, blinks, looks at us... two excited little hops.
 * 2960-3160  Hops onto the chip, leaning in like a hand holding it.
 * 3160-4250  SCRIBBLE: fast back-and-forth strokes, the crayon wobbling with each
 *            reversal, eyes narrowed, the chip shoved about a little. Twice it flings
 *            a stroke right outside the lines.
 * 4250-4550  Oops: it freezes, looks at the stray mark, looks at us.
 * 4550-5150  Careful edge work: slow lap round the rim, tongue poking out, tiny tremble.
 *            The tip has visibly worn blunt.
 * 5150-5350  Hops back off.
 * 5200-5450  SET-DOWN: the shoved chip lifts, squares itself up and lands exactly in its
 *            spot (squash, wobble, ticks).
 * 5500-5850  The waxy scribble smooths into a clean coat (sheen sweep), stray marks vanish,
 *            ring goes back to white.
 * 5800-6050  Nick's initial stamps in; ring flash in Nick's colour.
 * 6000-6520  The crayon admires its work: leans back, happy eyes, a proud little hop.
 * 6620-7200  It tips over and cartwheels off the way it came.
 * 6900-7350  Camera eases back; dim lifts.
 * 7350-7500  Stillness.
 * 7500-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', TONGUE = '#F0798F';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var KS = 1.12;          // crayon scale
  var BODY_H = 56;        // crayon body height above the cone (local units)
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
  function rot2(v, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }
  function norm(v) { var m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; }

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

  // ---------- the colouring paths (chip-local) ----------
  function polyLen(pts) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return cum;
  }
  function polyAt(P, f) {
    var pts = P.pts, cum = P.cum, L = cum[cum.length - 1], d = clamp(f) * L;
    for (var i = 1; i < pts.length; i++) {
      if (d <= cum[i] || i === pts.length - 1) {
        var k = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
        return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
      }
    }
    return pts[pts.length - 1];
  }
  function polyD(pts) {
    var d = '';
    pts.forEach(function (p, i) { d += (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); });
    return d;
  }
  function makePaths(sx) {
    // zigzag scribble: back-and-forth strokes along u, stepping across along v
    var a = (sx > 0 ? -28 : 28) * Math.PI / 180, u = [Math.cos(a), Math.sin(a)], v = [-Math.sin(a), Math.cos(a)];
    var N = 11, pts = [], R = CR, over = [], farPlus = (-sx * u[0]) > 0;
    for (var i = 0; i < N; i++) {
      var s = -18.5 + i * 3.7, c = Math.sqrt(R * R - s * s);
      var kA = 0.84 + 0.07 * Math.sin(i * 7.3), kB = 0.84 + 0.07 * Math.cos(i * 5.1);
      if (farPlus && (i === 4 || i === 8)) kB = 1.62;
      if (!farPlus && (i === 3 || i === 7)) kA = 1.62;
      var x0 = i % 2 ? kB * c : -kA * c, x1 = i % 2 ? -kA * c : kB * c;
      var bow = (i % 2 ? 1 : -1) * 1.5;
      for (var k = (i ? 1 : 0); k <= 6; k++) {
        var q = k / 6, x = lerp(x0, x1, q), b = s + bow * 4 * q * (1 - q);
        pts.push([b * v[0] + x * u[0], b * v[1] + x * u[1]]);
      }
      if ((farPlus && (i === 4 || i === 8)) || (!farPlus && (i === 3 || i === 7))) over.push(pts[pts.length - 1]);
    }
    var zig = { pts: pts, cum: polyLen(pts) };
    // careful lap round the rim, starting where the scribble ended
    var e = pts[pts.length - 1], a0 = Math.atan2(e[1], e[0]), dir = sx > 0 ? -1 : 1, rim = [];
    for (var j = 0; j <= 64; j++) { var aa = a0 + dir * j / 64 * Math.PI * 2 * 1.12, rr = 18.2 + 0.5 * Math.sin(j * 0.9); rim.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); }
    var edge = { pts: rim, cum: polyLen(rim) };
    return { zig: zig, edge: edge, over: over };
  }

  // timing of the colouring
  var Z0 = 3160, Z1 = 4250, E0 = 4550, E1 = 5150;
  function zigF(t) { var p = seg(t, Z0, Z1); return p + 0.018 * Math.sin(p * Math.PI * 2 * 5.5) * Math.sin(Math.PI * p); }
  function edgeF(t) { return eio(seg(t, E0, E1)) * 0.85 + 0.15 * seg(t, E0, E1); }

  // ---------- chip pose (offsets from its spot) ----------
  function chipPose(t, S) {
    var sx = S.sx, c = { dx: 0, dy: 0, rot: 0, sqx: 1, sqy: 1, lift: 0 };
    // singled out: nervous hop + shiver
    var nh = seg(t, 650, 980);
    c.dy -= 5 * Math.sin(Math.PI * seg(t, 650, 820));
    c.dx += 1.8 * Math.sin((t - 650) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
    var hs = 0.08 * Math.sin(Math.PI * seg(t, 650, 820)); c.sqx += hs; c.sqy += hs;
    // gulp as the colour starts to drain
    var g = spring(t - 1010, -0.1, 3.2, 120); c.sqy += g; c.sqx -= g * 0.7;
    // forlorn shiver once empty
    var fs = seg(t, 1680, 1900);
    if (fs > 0 && fs < 1) c.dx += 1.3 * Math.sin((t - 1680) * 0.2) * (1 - fs);
    // shoved about by the colouring
    var shove = eio(seg(t, Z0, Z1)) + 0.6 * eio(seg(t, E0, E1));
    var back = eio(seg(t, 5220, 5420));
    var drift = shove * (1 - back);
    c.dx += -sx * 2.6 * drift; c.dy += 1.8 * drift; c.rot += -sx * 9 * drift;
    if (t > Z0 && t < Z1) {
      var a = polyAt(S.P.zig, zigF(t)), b = polyAt(S.P.zig, zigF(t + 12)), d = norm([b[0] - a[0], b[1] - a[1]]);
      var on = Math.sin(Math.PI * seg(t, Z0, Z1));
      c.dx += 0.9 * d[0] * on; c.dy += 0.9 * d[1] * on;
    }
    // crayon lands on it / hops off
    var cl = spring(t - 3160, -0.05, 4, 90) + spring(t - 5160, -0.04, 4, 90); c.sqy += cl; c.sqx -= cl * 0.6;
    // set-down hop: lifts, squares up, lands in its exact spot
    var sd = seg(t, 5220, 5450);
    c.lift = 8 * Math.sin(Math.PI * sd);
    c.dy -= c.lift;
    var st = 0.06 * Math.sin(Math.PI * sd); c.sqx -= st * 0.6; c.sqy += st;
    var land = Math.exp(-(t - 5450) / 70) * Math.sin(Math.PI * clamp((t - 5450) / 110));
    if (t > 5450) { c.sqx += 0.13 * land; c.sqy -= 0.13 * land; }
    // initial stamps in
    var ip = Math.sin(Math.PI * seg(t, 5820, 6000)); c.sqx += 0.07 * ip; c.sqy += 0.07 * ip;
    // crayon's proud landing nudges it
    var pl = spring(t - 6460, -0.03, 4, 80); c.sqy += pl; c.sqx -= pl * 0.5;
    return c;
  }
  function chipWorld(S, t, p) {
    var c = chipPose(t, S), r = rot2(p, c.rot);
    return [S.T.x + c.dx + r[0], S.T.y + c.dy + r[1]];
  }

  // ---------- crayon pose: tip position (world), rotation (deg, about the tip), squash ----------
  var HC = 36; // tip->centre distance in local units (cone + half body)
  function centreToTip(C, rot) { var r = rot2([0, HC * KS], rot); return [C[0] + r[0], C[1] + r[1]]; }
  function crayonPose(t, S) {
    var sx = S.sx, P0 = S.P0, k = { x: P0[0], y: P0[1], rot: 0, sqx: 1, sqy: 1, vis: true, gy: P0[1], gx: P0[0], air: 0 };
    if (t < 1900 || t >= 7200) { k.vis = false; return k; }
    if (t < 2400) {
      // tumble in, cartwheeling
      var p = seg(t, 1900, 2400);
      var Cs = [sx > 0 ? W + 50 : -50, S.T.y - 190], Cl = [P0[0], P0[1] - HC * KS];
      var C = [lerp(Cs[0], Cl[0], p), lerp(Cs[1], Cl[1], ei(p)) - 70 * Math.sin(Math.PI * p) * (1 - p)];
      k.rot = sx * 720 * (1 - p);
      var tip = centreToTip(C, k.rot); k.x = tip[0]; k.y = tip[1];
      k.sqx = 0.95; k.sqy = 1.06;
      k.gx = C[0]; k.air = Math.max(0, P0[1] - HC * KS - C[1]);
      return k;
    }
    // landed: squash, rebound hop, wobble
    k.sqy += spring(t - 2400, -0.22, 3.4, 95);
    k.rot += spring(t - 2400, -sx * 16, 2.2, 190);
    var rb = seg(t, 2440, 2600); k.y -= 10 * Math.sin(Math.PI * rb); if (rb > 0 && rb < 1) k.sqy += 0.06 * Math.sin(Math.PI * rb);
    k.sqy += spring(t - 2600, -0.12, 4, 80);
    // two excited hops
    [[2790, 2870], [2875, 2955]].forEach(function (h) {
      var q = seg(t, h[0], h[1]);
      if (q > 0 && q < 1) { k.y -= 7 * Math.sin(Math.PI * q); k.sqy += 0.08 * Math.sin(Math.PI * q); }
      k.sqy += spring(t - h[1], -0.1, 5, 50);
    });
    if (t < 2960) { k.air = P0[1] - k.y; finish(k); return k; }
    // hop onto the chip
    if (t < 3160) {
      var hp = seg(t, 2960, 3160), q2 = eio(hp);
      var B = chipWorld(S, 3160, polyAt(S.P.zig, 0));
      var Pp = arc2(P0, B, 34, q2);
      k.x = Pp[0]; k.y = Pp[1]; k.rot = lerp(0, sx * 34, q2);
      k.sqx = 1 - 0.08 * Math.sin(Math.PI * hp); k.sqy = 1 + 0.1 * Math.sin(Math.PI * hp);
      k.gx = k.x; k.gy = lerp(P0[1], B[1], q2); k.air = k.gy - k.y;
      return k;
    }
    if (t < 5150) {
      // colouring: the tip rides the chip
      var lp;
      if (t < Z1) lp = polyAt(S.P.zig, zigF(t));
      else if (t < E0) { var zEnd = polyAt(S.P.zig, 1), eSt = polyAt(S.P.edge, 0), mv = eio(seg(t, 4470, E0)); lp = [lerp(zEnd[0], eSt[0], mv), lerp(zEnd[1], eSt[1], mv)]; }
      else lp = polyAt(S.P.edge, edgeF(t));
      var w = chipWorld(S, t, lp); k.x = w[0]; k.y = w[1];
      var base = kf([[3160, 34], [4250, 34], [4340, 2, function (x) { return backOut(x, 1.4); }], [4480, 4], [4600, 40], [5150, 40]], t) * sx;
      k.rot = base;
      k.sqy += spring(t - 3160, -0.1, 4, 90);
      if (t < Z1) {
        // wobble with each stroke reversal (the child pressing hard)
        var a = polyAt(S.P.zig, zigF(t - 10)), b = polyAt(S.P.zig, zigF(t + 10)), vx = (b[0] - a[0]);
        var on = Math.sin(Math.PI * seg(t, Z0, Z1));
        k.rot += clamp(vx * 1.6, -8, 8) * on + 2.5 * Math.sin(t * 0.06) * on;
        k.sqy -= 0.05 * Math.abs(Math.sin(t * 0.045)) * on;
      } else if (t < E0) {
        // oops: shrinks into itself a little
        var oo = Math.sin(Math.PI * seg(t, 4260, 4520));
        k.sqy -= 0.07 * oo; k.sqx += 0.04 * oo;
        k.y -= 6 * oo;
      } else {
        k.rot += 1.1 * Math.sin(t * 0.11) + 0.6 * Math.sin(t * 0.23);
      }
      k.gx = k.x; k.gy = k.y; k.air = 0;
      return k;
    }
    if (t < 5350) {
      // hop back off
      var hb = seg(t, 5150, 5350), qb = eio(hb), A = chipWorld(S, 5150, polyAt(S.P.edge, 1));
      var Pb = arc2(A, P0, 30, qb);
      k.x = Pb[0]; k.y = Pb[1]; k.rot = lerp(sx * 40, 0, qb);
      k.sqx = 1 - 0.07 * Math.sin(Math.PI * hb); k.sqy = 1 + 0.09 * Math.sin(Math.PI * hb);
      k.gx = k.x; k.gy = lerp(A[1], P0[1], qb); k.air = k.gy - k.y;
      return k;
    }
    k.x = P0[0]; k.y = P0[1]; k.rot = 0; k.sqx = 1; k.sqy = 1;
    k.sqy += spring(t - 5350, -0.14, 3.6, 90);
    k.rot += spring(t - 5350, sx * 6, 2.6, 140);
    // surprise bounce as the initial stamps in
    k.sqy += spring(t - 5850, 0.08, 4.5, 90);
    // admire: lean back, puff up
    var ad = eio(seg(t, 6000, 6200)) * (1 - eio(seg(t, 6560, 6680)));
    k.rot += sx * 11 * ad; k.sqy += 0.04 * ad; k.sqx -= 0.02 * ad;
    // proud hop
    var an = Math.sin(Math.PI * seg(t, 6250, 6330)); k.sqy -= 0.12 * an; k.sqx += 0.08 * an;
    var ph = seg(t, 6330, 6470);
    if (ph > 0 && ph < 1) { k.y -= 20 * Math.sin(Math.PI * ph); k.sqy += 0.1 * Math.sin(Math.PI * ph); }
    k.sqy += spring(t - 6470, -0.16, 3.8, 85);
    // anticipation lean, then cartwheel off the way it came
    var al = eio(seg(t, 6600, 6690)); k.rot -= sx * 10 * al;
    if (t >= 6690) {
      var ep = seg(t, 6690, 7200), q3 = ei(ep) * 0.35 + ep * 0.65;
      var C0 = [P0[0], P0[1] - HC * KS], C1 = [sx > 0 ? W + 70 : -70, P0[1] - HC * KS - 6];
      var Cx = lerp(C0[0], C1[0], q3), Cy = lerp(C0[1], C1[1], q3) - 22 * Math.abs(Math.sin(Math.PI * 1.6 * q3)) * (1 - 0.3 * q3);
      k.rot = sx * (-10 + 560 * q3);
      var tp = centreToTip([Cx, Cy], k.rot); k.x = tp[0]; k.y = tp[1];
      k.sqx = 1; k.sqy = 1; k.gx = Cx; k.air = Math.max(0, C0[1] - Cy);
      return k;
    }
    finish(k);
    return k;
    function finish(k2) { k2.air = Math.max(0, P0[1] - k2.y); k2.gx = k2.x; k2.gy = P0[1]; }
  }

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

  function makeCrayon(parent, color, sx) {
    var wrapC = mix(color, '#FFFFFF', 0.42), dark = mix(color, INK, 0.32), wrapDark = mix(color, INK, 0.12);
    var g = el('g', {}, parent);
    var m = el('g', { transform: 'scale(' + sx + ',1)' }, g);
    var cone = el('path', { fill: color, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, m);
    var coneSh = el('path', { fill: INK, 'fill-opacity': 0.14 }, m);
    var worn = el('ellipse', { fill: '#FFFFFF', 'fill-opacity': 0.3, rx: 0, ry: 0 }, m);
    var bodyG = el('g', {}, m);
    var bodyD = 'M-12.5 0 L-12.5 -' + (BODY_H - 5) + ' Q-12.5 -' + BODY_H + ' -5.5 -' + BODY_H + ' L5.5 -' + BODY_H + ' Q12.5 -' + BODY_H + ' 12.5 -' + (BODY_H - 5) + ' L12.5 0 Z';
    el('path', { d: bodyD, fill: color }, bodyG);
    el('path', { d: 'M-12.5 -' + (BODY_H - 5) + ' Q-12.5 -' + BODY_H + ' -5.5 -' + BODY_H + ' L5.5 -' + BODY_H + ' Q12.5 -' + BODY_H + ' 12.5 -' + (BODY_H - 5) + ' Z', fill: '#FFFFFF', 'fill-opacity': 0.22 }, bodyG);
    // paper wrapper with a torn top edge
    var wTop = -(BODY_H - 6);
    var wd = 'M-12.5 -4 L-12.5 ' + (wTop + 2) + ' L-7.5 ' + (wTop - 0.5) + ' L-5 ' + (wTop + 2.2) + ' L-2 ' + (wTop - 0.8) + ' L0.8 ' + (wTop + 1.8) + ' L3.6 ' + (wTop - 0.4) + ' L6.5 ' + (wTop + 2.4) + ' L12.5 ' + (wTop + 3) + ' L12.5 -4 Z';
    el('path', { d: wd, fill: wrapC }, bodyG);
    el('path', { d: 'M-12.5 -10 L12.5 -10 M-12.5 ' + (wTop + 7) + ' L12.5 ' + (wTop + 7), stroke: wrapDark, 'stroke-width': 2.2 }, bodyG);
    el('path', { d: 'M-8.6 -14 L-8.6 ' + (wTop + 10), stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, bodyG);
    el('rect', { x: 7.8, y: wTop + 3, width: 4.3, height: -wTop - 7, fill: INK, 'fill-opacity': 0.1 }, bodyG);
    el('path', { d: wd, fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, bodyG);
    // torn flap peeling off the wrapper
    el('path', { d: 'M12.5 ' + (wTop + 3) + ' L17.4 ' + (wTop - 1.5) + ' L15.4 ' + (wTop + 6.5) + ' L12.5 ' + (wTop + 8) + ' Z', fill: wrapC, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, bodyG);
    el('path', { d: bodyD, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, bodyG);
    // face
    var EY = -32;
    var eyes = [[-5.6, EY], [5.6, EY]].map(function (p) {
      var eg = el('g', { transform: 'translate(' + p[0] + ',' + p[1] + ')' }, bodyG);
      el('circle', { r: 4.7, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4 }, eg);
      return { p: p, pup: el('circle', { r: 2.3, fill: INK }, eg), gl: el('circle', { r: 0.6, fill: '#FFFFFF' }, eg), lid: el('path', { fill: wrapC, stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, eg), arc: el('path', { d: 'M-3.1 1 Q0 -2.6 3.1 1', fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, eg) };
    });
    var mouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, bodyG);
    var tongue = el('ellipse', { rx: 1.9, ry: 2.6, fill: TONGUE, stroke: INK, 'stroke-width': 1.1 }, bodyG);
    return { g: g, cone: cone, coneSh: coneSh, worn: worn, bodyG: bodyG, eyes: eyes, mouth: mouth, tongue: tongue };
  }

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-crayon-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    // the crayon works from the side of the chip that has no neighbouring chip
    var row = L.rows[T.row], hasR = row.chips.some(function (c) { return c.j === T.j + 1; });
    var sx = T.j === 0 ? -1 : (!hasR ? 1 : -1);
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var dIni = L.ini(opts.dealer), vIni = T.ini;
    var P = makePaths(sx);

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpD = el('clipPath', { id: id + 'drain', clipPathUnits: 'userSpaceOnUse' }, defs);
    var drainP = el('path', { d: 'M-30 -30 L30 -30 L30 30 L-30 30 Z' }, cpD);
    var cpC = el('clipPath', { id: id + 'chip', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('circle', { r: CR }, cpC);

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
        var cg = el('g', {}, wrap); makeChip(cg, c.color, c.ini);
        chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
      });
    });

    // ---- Nate's chip, built in layers so it can be drained and coloured ----
    var vWrap = el('g', {}, cam);
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, vWrap);
    var vG = el('g', {}, vWrap);
    el('circle', { r: CR, fill: '#FFFFFF' }, vG);
    var drainG = el('g', { 'clip-path': 'url(#' + id + 'drain)' }, vG);
    el('circle', { r: CR, fill: victimC }, drainG);
    var vTx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': vIni.length > 1 ? 15 : 18 }, drainG);
    vTx.textContent = vIni;
    var surf = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.55, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, vG);
    var drips = [0, 1].map(function () { return el('ellipse', { rx: 2.4, ry: 3.2, fill: victimC, stroke: INK, 'stroke-width': 1, opacity: 0 }, vG); });
    var tint = el('circle', { r: CR, fill: dealerC, opacity: 0 }, vG);
    var scrG = el('g', {}, vG);
    var zigD = polyD(P.zig.pts), edgeD = polyD(P.edge.pts);
    var zigLen = P.zig.cum[P.zig.cum.length - 1], edgeLen = P.edge.cum[P.edge.cum.length - 1];
    var zig = el('path', { d: zigD, fill: 'none', stroke: dealerC, 'stroke-width': 4.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': f1(zigLen + 1) + ' ' + f1(zigLen + 20) }, scrG);
    var zigS = el('path', { d: zigD, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.32, 'stroke-width': 1, 'stroke-linecap': 'round', transform: 'translate(0.9,-0.9)', 'stroke-dasharray': f1(zigLen + 1) + ' ' + f1(zigLen + 20) }, scrG);
    var edgeP = el('path', { d: edgeD, fill: 'none', stroke: dealerC, 'stroke-width': 6.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': f1(edgeLen + 1) + ' ' + f1(edgeLen + 20) }, scrG);
    var edgeS = el('path', { d: edgeD, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.3, 'stroke-width': 1, 'stroke-linecap': 'round', transform: 'translate(0.8,-1)', 'stroke-dasharray': f1(edgeLen + 1) + ' ' + f1(edgeLen + 20) }, scrG);
    var coat = el('circle', { r: CR, fill: dealerC, opacity: 0 }, vG);
    el('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, vG);
    var sheenG = el('g', { 'clip-path': 'url(#' + id + 'chip)' }, vG);
    var sheen = el('rect', { x: -5, y: -40, width: 10, height: 80, fill: '#FFFFFF', opacity: 0 }, sheenG);
    var ring = el('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, vG);
    var dTxG = el('g', {}, vG);
    var dTx = el('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 15 : 18 }, dTxG);
    dTx.textContent = dIni;
    el('circle', { r: CR, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, vG);

    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var ticks2 = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // crayon
    var kSh = el('ellipse', { rx: 12, ry: 4, fill: INK, opacity: 0 }, cam);
    var K = makeCrayon(el('g', {}, cam), dealerC, sx);
    var dust = el('path', { fill: 'none', stroke: INK, 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, sx: sx, P: P, P0: [T.x + sx * 42, T.y + 16], dealerC: dealerC, victimC: victimC, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, vWrap: vWrap, vSh: vSh, vG: vG, drainG: drainG, drainP: drainP, surf: surf, drips: drips,
      tint: tint, scrG: scrG, zig: zig, zigS: zigS, edgeP: edgeP, edgeS: edgeS, zigLen: zigLen, edgeLen: edgeLen, coat: coat,
      sheen: sheen, ring: ring, dTxG: dTxG, ripple: ripple, ticks: ticks, ticks2: ticks2, kSh: kSh, K: K, dust: dust, line: line
    };
  }

  // ---------- render ----------
  function burst(cx, cy, angs, r0, r1) {
    var d = '';
    angs.forEach(function (a) { d += 'M' + f1(cx + Math.cos(a) * r0) + ' ' + f1(cy + Math.sin(a) * r0) + 'L' + f1(cx + Math.cos(a) * r1) + ' ' + f1(cy + Math.sin(a) * r1); });
    return d;
  }
  function crayonLook(t, S, k, E) {
    // returns a world-space direction for the eyes
    var T = S.T;
    function toChip() { var c = chipPose(t, S); return norm([T.x + c.dx - E[0], T.y + c.dy - E[1]]); }
    function toTip() { return norm([k.x - E[0], k.y - E[1]]); }
    var CAM = [0, 0.25];
    var keys = [[1900, function () { return [S.sx > 0 ? -0.8 : 0.8, 0.5]; }], [2420, toChip], [2730, function () { return CAM; }], [2960, toTip],
      [4250, function () { var o = S.P.over[1]; var w = chipWorld(S, t, o); return norm([w[0] - E[0], w[1] - E[1]]); }], [4400, function () { return CAM; }], [4540, toTip],
      [5150, toChip], [5950, function () { return CAM; }], [6100, toChip], [6600, function () { return [S.sx, 0.2]; }]];
    var i = 0; for (var j = 0; j < keys.length; j++) if (t >= keys[j][0]) i = j;
    var cur = keys[i][1]();
    if (i === 0) return cur;
    var prev = keys[i - 1][1](), q = backOut(seg(t, keys[i][0], keys[i][0] + 110), 1.3);
    return [lerp(prev[0], cur[0], q), lerp(prev[1], cur[1], q)];
  }

  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, sx = S.sx;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1150)) * (1 - eioC(seg(t, 6900, 7350)));
    var Z = lerp(1, 1.2, zk);
    var fy = clamp(T.y - 20, 270, 430);
    var ccy = lerp(H / 2, fy, zk);
    // keep the crayon's working side in frame (left edge still shows the row badges)
    var half = W / 2 / 1.2, fx = W / 2 + clamp(S.P0[0] + 40 - (W / 2 + half), 0, 16) - clamp((W / 2 - half) - (S.P0[0] - 40), 0, 16);
    var ccx = lerp(W / 2, fx, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 6950, 7350)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- Nate's chip ----
    var c = chipPose(t, S), vs = chipPop(T);
    var cx = T.x + c.dx, cy = T.y + c.dy;
    S.vG.setAttribute('transform', 'translate(' + f1(cx) + ',' + f1(cy) + ') rotate(' + f1(c.rot) + ') scale(' + f2(vs * c.sqx) + ',' + f2(vs * c.sqy) + ')');
    S.vSh.setAttribute('cx', f1(T.x + c.dx + 1.5 + c.lift * 0.3)); S.vSh.setAttribute('cy', f1(T.y + c.dy + c.lift + 3.5 + c.lift * 0.4));
    S.vSh.setAttribute('r', f1(CR * vs * (1 - c.lift * 0.012)));

    // drain: the colour level drops out of the bottom, wavy surface
    var dp = seg(t, 1020, 1640), lvl = -24 + 48 * (dp * 0.3 + ei(dp) * 0.7);
    if (dp < 1) {
      S.drainG.setAttribute('display', 'inline');
      var amp = dp > 0 ? 1.8 * (1 - dp * 0.5) : 0, dd = 'M-30 30 L-30 ' + f1(lvl), sd = '';
      for (var x = -24; x <= 24; x += 3) {
        var yy = lvl + amp * Math.sin(x * 0.32 + t * 0.022) + (dp > 0 ? 1.2 * Math.sin(Math.PI * dp) * (x / 24) * Math.sin(t * 0.012) : 0);
        dd += 'L' + x + ' ' + f1(yy);
        var inside = CR * CR - x * x - yy * yy;
        if (dp > 0 && inside > 4) sd += (sd && sd.slice(-1) !== '|' ? 'L' : 'M') + x + ' ' + f1(yy); else if (sd && sd.slice(-1) !== '|') sd += '|';
      }
      dd += 'L30 30 Z';
      S.drainP.setAttribute('d', dd);
      S.surf.setAttribute('d', sd.replace(/\|/g, ''));
      S.surf.setAttribute('opacity', dp > 0 ? 1 : 0);
    } else { S.drainG.setAttribute('display', 'none'); S.surf.setAttribute('opacity', 0); }
    [[1320, -5], [1500, 6]].forEach(function (d0, i) {
      var q = seg(t, d0[0], d0[0] + 340), e = S.drips[i];
      if (q <= 0 || q >= 1) { e.setAttribute('opacity', 0); return; }
      e.setAttribute('cx', d0[1]); e.setAttribute('cy', f1(21 + 16 * ei(q)));
      e.setAttribute('ry', f1(2.6 + 1.6 * Math.sin(Math.PI * q)));
      e.setAttribute('opacity', f1(100 * (1 - ei(q))) / 100);
    });
    var blank = seg(t, 1150, 1600);

    // colouring in
    var zf = t < Z0 ? 0 : zigF(t), ef = t < E0 ? 0 : edgeF(t);
    var coatK = eio(seg(t, 5500, 5850));
    S.zig.setAttribute('stroke-dashoffset', f1((S.zigLen + 1) * (1 - zf)));
    S.zigS.setAttribute('stroke-dashoffset', f1((S.zigLen + 1) * (1 - zf)));
    S.edgeP.setAttribute('stroke-dashoffset', f1((S.edgeLen + 1) * (1 - ef)));
    S.edgeS.setAttribute('stroke-dashoffset', f1((S.edgeLen + 1) * (1 - ef)));
    S.zig.setAttribute('display', zf > 0.002 ? 'inline' : 'none'); S.zigS.setAttribute('display', zf > 0.002 ? 'inline' : 'none');
    S.edgeP.setAttribute('display', ef > 0.002 ? 'inline' : 'none'); S.edgeS.setAttribute('display', ef > 0.002 ? 'inline' : 'none');
    S.scrG.setAttribute('opacity', f2(1 - coatK));
    S.tint.setAttribute('opacity', f2(0.3 * seg(t, Z0, Z1) + 0.2 * seg(t, E0, E1)));
    S.coat.setAttribute('opacity', f2(coatK));
    var shp = seg(t, 5520, 5900);
    if (shp > 0 && shp < 1) {
      S.sheen.setAttribute('opacity', f2(0.6 * Math.sin(Math.PI * shp)));
      S.sheen.setAttribute('transform', 'rotate(' + (sx > 0 ? 30 : -30) + ') translate(' + f1(lerp(-34, 34, eio(shp))) + ',0)');
    } else S.sheen.setAttribute('opacity', 0);
    var inkK = blank * (1 - coatK);
    S.ring.setAttribute('stroke', mix('#FFFFFF', INK, inkK));
    S.ring.setAttribute('stroke-opacity', f2(0.85 - 0.1 * inkK));
    var ip = seg(t, 5800, 6050);
    S.dTxG.setAttribute('opacity', ip > 0 ? f2(Math.min(1, ip * 3)) : 0);
    S.dTxG.setAttribute('transform', 'scale(' + f2(ip > 0 ? Math.max(0.01, backOut(ip, 2.6)) : 0.01) + ')');

    // set-down ticks + colour ring flash
    var tp = seg(t, 5450, 5720);
    if (tp > 0 && tp < 1) {
      S.ticks.setAttribute('d', burst(T.x, T.y, [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75], 27 + 9 * eoC(tp), 33 + 9 * eoC(tp) + 4 * (1 - tp)));
      S.ticks.setAttribute('opacity', f2(0.9 * (1 - tp)));
    } else S.ticks.setAttribute('opacity', 0);
    var rp = seg(t, 5830, 6380);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f2((1 - rp) * 0.85) : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));

    // ---- crayon ----
    var k = crayonPose(t, S), K = S.K;
    K.g.setAttribute('display', k.vis ? 'inline' : 'none');
    S.kSh.setAttribute('display', k.vis ? 'inline' : 'none');
    if (k.vis) {
      var wear = eio(seg(t, Z0, E1)), coneH = lerp(14, 9, wear), bl = lerp(2.4, 10, wear);
      K.g.setAttribute('transform', 'translate(' + f1(k.x) + ',' + f1(k.y) + ') rotate(' + f1(k.rot) + ') scale(' + f2(k.sqx * KS) + ',' + f2(k.sqy * KS) + ')');
      K.cone.setAttribute('d', 'M-12.5 ' + f1(-coneH) + ' L' + f1(-bl / 2) + ' -0.6 Q0 ' + f1(0.8) + ' ' + f1(bl / 2) + ' -0.6 L12.5 ' + f1(-coneH) + ' Z');
      K.coneSh.setAttribute('d', 'M4 ' + f1(-coneH + 0.8) + ' L11.2 ' + f1(-coneH + 0.8) + ' L' + f1(bl / 2) + ' -1.2 L' + f1(bl / 2 - 1.6) + ' -1.2 Z');
      K.worn.setAttribute('cx', 0); K.worn.setAttribute('cy', -1.4); K.worn.setAttribute('rx', f1(bl / 2 * 0.8 * wear)); K.worn.setAttribute('ry', f1(1.1 * wear));
      K.bodyG.setAttribute('transform', 'translate(0,' + f1(-coneH) + ')');
      // eyes
      var Ew = (function () { var r = rot2([0, -(coneH + 32) * KS], k.rot); return [k.x + r[0], k.y + r[1]]; })();
      var lv = crayonLook(t, S, k, Ew), loc = rot2(lv, -k.rot); loc[0] *= sx;
      var lid = kf([[0, -1], [2650, -1], [2690, 1], [2730, -1], [3160, -1], [3260, 0.3], [4250, 0.3], [4300, -1], [4550, -1], [4650, 0.42], [5150, 0.42], [5250, -1], [5420, -1], [5450, 1], [5490, -1]], t);
      var happy = t >= 6020 && t < 6640;
      K.eyes.forEach(function (e) {
        var px = loc[0] * 2, py = loc[1] * 2 + (happy ? 0 : 0);
        e.pup.setAttribute('cx', f1(px)); e.pup.setAttribute('cy', f1(py));
        e.gl.setAttribute('cx', f1(px - 0.6)); e.gl.setAttribute('cy', f1(py - 0.7));
        var r = 4.9;
        if (happy) { e.lid.setAttribute('d', circleD(0, 0, r)); e.arc.setAttribute('display', 'inline'); }
        else {
          e.arc.setAttribute('display', 'none');
          if (lid <= -0.97) e.lid.setAttribute('d', '');
          else if (lid >= 0.98) e.lid.setAttribute('d', circleD(0, 0, r) + 'M-2.8 0.4 Q0 2 2.8 0.4');
          else { var Ly = lid * r, dx = Math.sqrt(r * r - Ly * Ly); e.lid.setAttribute('d', 'M' + f1(-dx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx) + ' ' + f1(Ly) + 'Z'); }
        }
      });
      // mouth & tongue
      var tg = clamp(eio(seg(t, 4560, 4680)) * (1 - eio(seg(t, 5100, 5170))) + 0.6 * Math.sin(Math.PI * seg(t, 3500, 3800)) + 0.6 * Math.sin(Math.PI * seg(t, 3950, 4200)));
      var oops = Math.sin(Math.PI * seg(t, 4260, 4540));
      var mY = -23.5;
      if (happy || (t > 5850 && t < 6020)) K.mouth.setAttribute('d', 'M-3.6 ' + f1(mY - 0.6) + ' Q0 ' + f1(mY + 3.6) + ' 3.6 ' + f1(mY - 0.6));
      else if (oops > 0.05) K.mouth.setAttribute('d', 'M-2.6 ' + f1(mY + 0.6) + ' Q-1.3 ' + f1(mY - 0.6) + ' 0 ' + f1(mY + 0.4) + ' Q1.3 ' + f1(mY + 1.4) + ' 2.6 ' + f1(mY + 0.2));
      else if (tg > 0.05) K.mouth.setAttribute('d', 'M-3.2 ' + f1(mY) + ' Q0 ' + f1(mY + 1.2) + ' 2.4 ' + f1(mY - 0.4));
      else K.mouth.setAttribute('d', 'M-2.8 ' + f1(mY - 0.4) + ' Q0 ' + f1(mY + 2) + ' 2.8 ' + f1(mY - 0.4));
      var tw = Math.sin(t * 0.03) * 0.6;
      K.tongue.setAttribute('display', tg > 0.03 ? 'inline' : 'none');
      K.tongue.setAttribute('transform', 'translate(' + f1(-2.6 + tw * 0.4) + ',' + f1(mY + 1 + 1.6 * tg) + ') rotate(' + f1(18 + tw * 10) + ') scale(' + f2(Math.max(0.05, tg)) + ')');
      // shadow on the table
      var gy = k.gy + 2, air = k.air;
      S.kSh.setAttribute('cx', f1(k.gx + 2)); S.kSh.setAttribute('cy', f1(gy));
      S.kSh.setAttribute('rx', f1(13 * clamp(1 - air / 160, 0.4, 1)));
      S.kSh.setAttribute('opacity', f2(0.24 * clamp(1 - air / 150, 0.2, 1)));
    }
    // landing dust puffs (crayon)
    var lands = [2400, 5350, 6470], dd2 = '';
    lands.forEach(function (lt) {
      var q = seg(t, lt, lt + 260);
      if (q > 0 && q < 1) dd2 += burst(S.P0[0], S.P0[1] + 1, [Math.PI * 0.92, Math.PI * 1.08, -0.08, 0.08], 12 + 10 * eoC(q), 16 + 10 * eoC(q) + 3 * (1 - q));
    });
    var anyQ = lands.reduce(function (m, lt) { var q = seg(t, lt, lt + 260); return q > 0 && q < 1 ? Math.max(m, 1 - q) : m; }, 0);
    S.dust.setAttribute('d', dd2); S.dust.setAttribute('opacity', f2(anyQ));

    // final line
    var lp2 = seg(t, 7500, 7850);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2crayon;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2crayon = S;
    return S;
  }

  window.CCSteal2_crayon = {
    title: 'The Colouring Book',
    blurb: 'Nate’s chip drains to a blank colouring-book outline, and a fat wax crayon in Nick’s colour tumbles in and colours it in like a small child, scribbling outside the lines and all, until it is a clean coat of Nick’s colour in exactly the same spot.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2crayon = S;
      var token = {};
      root.__cc2crayonToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2crayonToken !== token) { resolve(); return; }
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
