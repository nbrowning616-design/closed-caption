/* Closed Caption steal film: fondue (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE FONDUE
 *
 * Everyone knows it: whatever you dip in the fondue comes out coated in the fondue.
 * The pot's fondue is Nick's colour. A white-gloved hand in Nick's sleeve dips Nate's chip.
 * Top-down felt table; the little fondue set is a front-view toy that pops up out of the felt.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  600- 950  Camera eases in a touch (whole rows stay framed). Other chips dim; Nate's chip
 *            gives a nervous hop.
 *  750-1300  A hole irises open in the felt beside the chip; a tiny fondue pot on a stand
 *            pops up (overshoot, squash, wobble). WHOOMP: the burner flame lights.
 * 1300-1500  The pot's eyes blink awake and look at Nate's chip. The fondue (Nick's colour)
 *            starts to bubble: blip... blip.
 * 1450-2050  A long fondue fork descends from above, held by a white glove in a sleeve of
 *            Nick's colour (overshoot, settle). Hovers over Nate's chip; the chip trembles.
 * 2050-2300  The pinky extends - very refined. A little considering waggle.
 * 2300-2650  Fork lowers, delicately picks the chip up on its prongs (tiny squash), lifts.
 * 2650-3020  Carries it in an arc over the pot; the pot's eyes follow it up.
 * 3020-3360  Slowly lowers it into the thick sauce: half the chip goes Nick's colour, the
 *            dip line wobbling with sauce. The pot shuts its eyes in bliss.
 * 3360-4660  A lazy figure-eight through the sauce (wake trails on the surface, chip drags
 *            and leans, dunks under completely at the far loops).
 * 4660-5080  Lifts out - slow to unstick - trailing one long glossy strand that thins... snap.
 * 5080-6020  Holds it up: fully coated, glossy, "Ni". Taps the fork: drip... drip... drip
 *            (each one plops back in). Pot's eyes open wide and follow each drip.
 * 6020-6340  Twirls it once on the fork (glint).
 * 6340-6760  Carries it back and sets it down exactly in its spot: squash, settle, ring flash.
 * 6760-7250  Prongs slide out; pinky flourish; the hand rises away out of frame.
 * 6880-7520  The pot gives one last big BLIP, the flame snuffs (wisp), it hops and sinks back
 *            into the felt; hole closes. Camera eases back.
 * 7520-7600  Stillness: whole table settled.
 * 7600-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var IRON = '#3D4852', IRON_HI = '#5D6C79', IRON_IN = '#222A31', METAL = '#C9D2D8', WOOD = '#7A5236', HOLE = '#143A2E';
  var GLOVE = '#FFFFFF', GOLD = '#F2C14E';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var PS = 1.45;          // pot scale
  var CS = 0.9;         // chip scale while on the fork
  var SY = -57, SRX = 27, SRY = 7; // sauce surface (pot-local)
  var TINE = 7;          // chip centre is this far below the tine tips (world, at scale 1)
  var HOLD = -77;        // hold height above the sauce (depth)
  var DRIPS = [5130, 5430, 5730];
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
  function eS(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function backOut(t, s) { s = s === undefined ? 1.7 : s; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
  function spring(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.sin(2 * Math.PI * hz * dt / 1000); }
  function bump(t, a, b) { var p = seg(t, a, b); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f2(v) { return Math.round(v * 1000) / 1000; }
  function hash(k) { var s = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); }
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
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }
  function squiggle(x, y, len, ph) {
    var d = 'M' + f1(x + 2.5 * Math.sin(ph)) + ' ' + f1(y);
    for (var k = 1; k <= 8; k++) d += 'L' + f1(x + 2.2 * Math.sin(ph + k * 0.8)) + ' ' + f1(y - len * k / 8);
    return d;
  }
  // tapered strand from (x, yt) [width wt] to (x2, yb) [width wb] with a neck of width wn
  function strandD(x, yt, wt, x2, yb, wb, wn) {
    var ym1 = lerp(yt, yb, 0.38), ym2 = lerp(yt, yb, 0.62), xm = (x + x2) / 2;
    var c = Math.max(0.25, (wn / 2 - 0.125 * (wt / 2 + wb / 2)) / 0.75);
    return 'M' + f1(x - wt / 2) + ' ' + f1(yt) + 'C' + f1(xm - c) + ' ' + f1(ym1) + ' ' + f1(xm - c) + ' ' + f1(ym2) + ' ' + f1(x2 - wb / 2) + ' ' + f1(yb) +
      'L' + f1(x2 + wb / 2) + ' ' + f1(yb) + 'C' + f1(xm + c) + ' ' + f1(ym2) + ' ' + f1(xm + c) + ' ' + f1(ym1) + ' ' + f1(x + wt / 2) + ' ' + f1(yt) + 'Z';
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
    var trow = rows[target.row];
    return { rows: rows, target: target, others: others, bandY: trow.y + h + g / 2, h: h, g: g, ini: ini };
  }

  // ---------- choreography ----------
  function potPose(t) {
    var m = { dx: 0, dy: 0, rot: 0, sqy: 1 };
    if (t < 1180) { var p = seg(t, 820, 1180); m.dy = 100 * (1 - backOut(p, 1.5)); m.sqy += 0.12 * Math.sin(Math.PI * p); }
    m.sqy += spring(t - 1180, -0.12, 3.4, 120);
    m.rot += spring(t - 1180, 4, 2.2, 200) + spring(t - 1260, -1.6, 3, 140);
    // whoomp of the flame
    m.sqy += spring(t - 1290, 0.05, 4, 90);
    // little shiver of delight as the chip goes in
    m.sqy += spring(t - 3160, -0.04, 5, 110);
    // final blip, hop, sink
    m.sqy += 0.05 * bump(t, 6900, 7020) + spring(t - 7020, -0.07, 4, 100);
    m.dy -= 7 * bump(t, 7060, 7190);
    m.sqy += 0.06 * bump(t, 7060, 7190);
    if (t >= 7160) m.dy += 105 * ei(seg(t, 7160, 7470));
    return m;
  }
  function holeK(t) {
    return kf([[720, 0], [960, 1, function (x) { return backOut(x, 1.6); }], [1280, 1], [1520, 0], [7000, 0], [7150, 1, function (x) { return backOut(x, 1.6); }], [7440, 1], [7600, 0]], t);
  }
  function toWorld(S, m, px, py) {
    var a = m.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sqx = 2 - m.sqy;
    var x = px * sqx * PS, y = py * m.sqy * PS;
    return [S.MX + m.dx + x * c - y * s, S.baseY + m.dy + x * s + y * c];
  }
  // rest-pose surface point (u in pot units, w in -1..1 front/back)
  function surf(S, u, w) { return [S.MX + u * PS, S.baseY + (SY + w * SRY * 0.8) * PS]; }

  // swirl parameters
  var SW0 = 3360, SW1 = 4660;
  function swirlTheta(t) { return 2 * Math.PI * seg(t, SW0, SW1); }
  function swirlUW(t) {
    var th = swirlTheta(t);
    return [14 * Math.sin(th), 0.9 * Math.sin(th) * Math.cos(th) * 2];
  }
  // depth of the chip centre below the sauce surface (world px), only meaningful 3020..5080
  function depthAt(t) {
    if (t < 3020) return -40;
    if (t < 3360) return kf([[3020, -40], [3200, -14, eio], [3360, -9, function (x) { return eo(x); }]], t);
    if (t < SW1) { var th = swirlTheta(t); return -9 + 7 * Math.pow(Math.sin(th), 2); }
    return kf([[SW1, -9], [4810, -12, ei], [5080, HOLD, function (x) { return eio(x); }]], t);
  }
  // the thick sauce clings and creeps up the chip as it swirls
  function coatLine(t) {
    if (t < 3020) return 99;
    var md = t < 3360 ? depthAt(t) : Math.max(-9, depthAt(Math.min(t, SW0 + (SW1 - SW0) / 4)));
    return -md / CS - 34 * eio(seg(t, 3420, 4450));
  }
  function tapAt(t) {
    var a = 0;
    DRIPS.forEach(function (d) { a += bump(t, d + 120, d + 230); });
    return a;
  }

  // chip centre (world), scale, flip, phase
  function chipBase(S, t) {
    var T = S.T, c = { x: T.x, y: T.y, s: 1, flip: 1, held: false, inPot: false, sqx: 1, sqy: 1 };
    var L1 = [T.x, T.y - 26];
    var A = surf(S, 0, 0); A = [A[0], A[1] - 40];
    if (t < 2440) {
      // nervous hop when singled out, trembles under the hovering fork
      c.y -= 5 * bump(t, 650, 820);
      var tr = seg(t, 1950, 2050) * (1 - seg(t, 2380, 2440));
      c.x += 1.3 * tr * Math.sin(t * 0.28);
      var sq = bump(t, 2380, 2470);
      c.sqx = 1 + 0.07 * sq; c.sqy = 1 - 0.08 * sq;
    } else if (t < 2640) {
      var p = eio(seg(t, 2470, 2640)); c.held = true;
      c.y = lerp(T.y, L1[1], p); c.s = lerp(1, CS, p);
      var sq2 = bump(t, 2400, 2490); c.sqx = 1 + 0.07 * sq2; c.sqy = 1 - 0.08 * sq2;
    } else if (t < 3020) {
      var q = eio(seg(t, 2640, 3020)), P = arc2(L1, A, 34, q);
      c.x = P[0]; c.y = P[1]; c.s = CS; c.held = true;
    } else if (t < 6020) {
      var uw = (t >= SW0 && t < SW1) ? swirlUW(t) : [0, 0];
      var sp = surf(S, uw[0], uw[1]);
      c.x = sp[0]; c.y = sp[1] + depthAt(t) + 3.2 * tapAt(t); c.s = CS; c.held = true; c.inPot = t < 5080;
      c.surfY = sp[1]; c.uw = uw;
      if (t >= 5080) c.y += 1.5 * Math.sin((t - 5080) * 0.006) * (1 - seg(t, 5900, 6020));
    } else if (t < 6340) {
      var sp2 = surf(S, 0, 0), p2 = seg(t, 6020, 6340);
      c.x = sp2[0]; c.y = sp2[1] + HOLD - 7 * Math.sin(Math.PI * p2); c.s = CS; c.held = true;
      c.flip = Math.max(0.06, Math.abs(Math.cos(2 * Math.PI * eio(p2))));
    } else {
      var H0 = surf(S, 0, 0); H0 = [H0[0], H0[1] + HOLD];
      c.held = t < 6790;
      if (t < 6690) {
        var pc = eio(seg(t, 6340, 6690)), P2 = arc2(H0, [T.x, T.y - 12], 26, pc);
        c.x = P2[0]; c.y = P2[1]; c.s = lerp(CS, 0.97, pc);
      } else if (t < 6760) {
        var pd = ei(seg(t, 6690, 6760));
        c.y = lerp(T.y - 12, T.y, pd); c.s = lerp(0.97, 1, pd);
      } else {
        var d = t - 6760, land = Math.exp(-d / 75) * Math.sin(Math.PI * clamp(d / 120));
        c.sqx = 1 + 0.14 * land; c.sqy = 1 - 0.14 * land;
        c.wob = 0.08 * Math.exp(-d / 220) * clamp(d / 60);
      }
    }
    return c;
  }
  function chipRot(S, t) {
    if (t < 2470 || t > 6760) return 0;
    var a = chipBase(S, t), b = chipBase(S, t - 30);
    var v = (a.x - b.x) / 30;
    var r = clamp(v * 120, -16, 16);
    return r * seg(t, 2470, 2560) * (1 - seg(t, 6690, 6760));
  }

  // fork tip (world) and hand rotation
  function handPose(S, t) {
    var T = S.T, h = { x: T.x, y: T.y - 58, rot: 0, pinky: 70, vis: t >= 1400 && t < 7340 };
    if (t < 2050) {
      var p = seg(t, 1450, 2050);
      h.y = T.y - 58 - 520 * (1 - backOut(p, 1.25));
      h.rot = 6 * (1 - eo(p)) + spring(t - 2050, -3, 2, 160);
      h.x += 10 * (1 - eo(p));
    } else if (t < 2300) {
      h.x += 4 * Math.sin((t - 2100) * 0.025) * bump(t, 2100, 2300);
      h.rot = spring(t - 2050, -3, 2, 160) + 3 * Math.sin((t - 2100) * 0.025) * bump(t, 2100, 2300);
    } else if (t < 2440) {
      var q = eio(seg(t, 2300, 2440));
      h.y = lerp(T.y - 58, T.y - TINE, q);
    } else if (t <= 6760) {
      var c = chipBase(S, t);
      h.x = c.x; h.y = c.y - TINE * c.s; h.rot = chipRot(S, t);
    } else {
      var p2 = eo(seg(t, 6780, 6900));
      h.y = lerp(T.y - TINE, T.y - 40, p2);
      // flourish: a little loop
      var fl = seg(t, 6900, 7040);
      h.x += 6 * Math.sin(2 * Math.PI * fl) * (fl > 0 && fl < 1 ? 1 : 0);
      h.y -= 6 * (1 - Math.cos(2 * Math.PI * fl)) / 2 * (fl > 0 && fl < 1 ? 1 : 0);
      h.rot = -5 * Math.sin(Math.PI * fl);
      h.y -= 1100 * ei(seg(t, 7020, 7320));
    }
    // pinky: tucked, then out (refined), waggles at the end
    h.pinky = kf([[2050, 70], [2240, -35, function (x) { return backOut(x, 2.2); }], [6900, -35], [6960, -55], [7020, -25], [7080, -50]], t);
    return h;
  }
  function wetness(t) { return seg(t, 3160, 3260) * (1 - eio(seg(t, 6800, 7450))); }

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

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-fondue-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    // stand the pot in a free chip slot of the target row if there is one (keeps neighbours visible)
    var occ = L.rows[T.row].chips.map(function (ch) { return ch.x; }), best = null;
    [150, 222, 294].forEach(function (x) { if (occ.indexOf(x) < 0 && (best === null || Math.abs(x - T.x) < Math.abs(best - T.x))) best = x; });
    var sx, MX;
    if (best !== null) { sx = best > T.x ? 1 : -1; MX = best + sx * 6; }
    else { sx = T.j < 2 ? 1 : -1; MX = T.x + sx * 86; }
    MX = clamp(MX, 80, 294);
    var baseY = Math.min(L.bandY + 4, 566);
    var dealerC = opts.dealerColor || '#E8559E', victimC = opts.victimColor || T.color;
    var sauceD = mix(dealerC, INK, 0.28), sauceL = mix(dealerC, '#FFFFFF', 0.35);
    var dIni = L.ini(opts.dealer), vIni = T.ini;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpM = el('clipPath', { id: id + 'm', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -400, y: -400, width: 1200, height: f1(baseY + 5 * PS + 400) }, cpM);
    var cpS = el('clipPath', { id: id + 's', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('ellipse', { cx: 0, cy: SY, rx: SRX, ry: SRY }, cpS);
    var cpD = el('clipPath', { id: id + 'd', clipPathUnits: 'userSpaceOnUse' }, defs);
    var dipRect = el('rect', { x: -200, y: -2000, width: 800, height: 4000 }, cpD);
    var cpC = el('clipPath', { id: id + 'c', clipPathUnits: 'userSpaceOnUse' }, defs);
    var coatPath = el('path', { d: '' }, cpC);

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

    // Nate's chip shadow (on the felt)
    var vSh = el('circle', { r: CR, fill: INK, opacity: 0.28 }, cam);

    // hole in the felt + pot shadow
    var hole = el('g', {}, cam);
    var holeE = el('ellipse', { cx: MX, cy: baseY, rx: 0, ry: 0, fill: HOLE, stroke: INK, 'stroke-width': 2.2 }, hole);
    var holeIn = el('ellipse', { cx: MX, cy: baseY + 2, rx: 0, ry: 0, fill: '#0B241C' }, hole);
    var pShadow = el('ellipse', { cx: MX, cy: baseY + 3, rx: 36, ry: 5.5, fill: INK, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- the fondue set (pot-local coords, origin at the feet) ----
    var pWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var pG = el('g', {}, pWrap);
    // stand legs + ring
    [[-1], [1]].forEach(function (s) {
      var d = 'M' + (s[0] * 23) + ' -29 Q' + (s[0] * 29) + ' -14 ' + (s[0] * 28) + ' -1';
      el('path', { d: d, fill: 'none', stroke: INK, 'stroke-width': 4.4, 'stroke-linecap': 'round' }, pG);
      el('path', { d: d, fill: 'none', stroke: METAL, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, pG);
      el('ellipse', { cx: s[0] * 28, cy: 0, rx: 4.2, ry: 2, fill: INK }, pG);
    });
    // burner cup
    el('rect', { x: -9, y: -9, width: 18, height: 9, rx: 2.5, fill: METAL, stroke: INK, 'stroke-width': 1.8 }, pG);
    el('path', { d: 'M-6 -6.5 L4 -6.5', stroke: '#FFFFFF', 'stroke-opacity': 0.7, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, pG);
    var flameG = el('g', {}, pG);
    el('path', { d: 'M0 0 C-6 0 -7 -6 -3.5 -10.5 C-1.8 -13 -0.4 -15 0 -18.5 C2.4 -14 7 -9.5 6 -4 C5.4 -1 2.6 0 0 0Z', fill: '#FF9F1C', stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, flameG);
    el('path', { d: 'M0 -1.5 C-3 -1.5 -3.3 -4.6 -1.6 -7 C-0.6 -8.5 0 -9.5 0.3 -11 C1.6 -8.6 3.4 -6.4 3 -3.8 C2.7 -2.2 1.4 -1.5 0 -1.5Z', fill: '#FFDA4D' }, flameG);
    var smoke = el('path', { fill: 'none', stroke: '#C9D3D6', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, pG);
    // ring (stand top)
    el('ellipse', { cx: 0, cy: -29, rx: 25, ry: 4.5, fill: 'none', stroke: INK, 'stroke-width': 4.4 }, pG);
    el('ellipse', { cx: 0, cy: -29, rx: 25, ry: 4.5, fill: 'none', stroke: METAL, 'stroke-width': 1.8 }, pG);
    // handle (side away from the chip)
    var hdl = el('g', { transform: 'scale(' + sx + ',1)' }, pG);
    el('path', { d: 'M27 -50 L42 -57', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round' }, hdl);
    el('path', { d: 'M27 -50 L42 -57', stroke: WOOD, 'stroke-width': 4.6, 'stroke-linecap': 'round' }, hdl);
    el('path', { d: 'M33 -53 L40 -56', stroke: '#FFFFFF', 'stroke-opacity': 0.3, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, hdl);
    // bowl
    el('path', { d: 'M-31 -58 C-31 -38 -19 -27 0 -27 C19 -27 31 -38 31 -58 Z', fill: IRON, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, pG);
    el('path', { d: 'M-25 -52 C-24 -42 -18 -35 -11 -32', fill: 'none', stroke: IRON_HI, 'stroke-width': 3, 'stroke-linecap': 'round' }, pG);
    el('path', { d: 'M24 -46 C22 -38 16 -33 9 -31', fill: 'none', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 3, 'stroke-linecap': 'round' }, pG);
    // pot eyes
    var pEyes = [[-9.5, -43], [9.5, -43]].map(function (p) {
      var g = el('g', { transform: 'translate(' + p[0] + ',' + p[1] + ')' }, pG);
      el('circle', { r: 4.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.5 }, g);
      return { p: p, pup: el('circle', { r: 2.3, fill: INK }, g), gl: el('circle', { r: 0.8, fill: '#FFFFFF' }, g), lid: el('path', { fill: IRON, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g) };
    });
    // rim + sauce
    el('ellipse', { cx: 0, cy: -58, rx: 31.5, ry: 8.8, fill: IRON, stroke: INK, 'stroke-width': 2.6 }, pG);
    el('ellipse', { cx: 0, cy: -58, rx: 28.3, ry: 7.4, fill: IRON_IN }, pG);
    el('ellipse', { cx: 0, cy: SY, rx: SRX, ry: SRY, fill: dealerC }, pG);
    el('path', { d: 'M-26 ' + (SY - 1) + ' A' + SRX + ' ' + SRY + ' 0 0 1 26 ' + (SY - 1) + ' A27 5 0 0 0 -26 ' + (SY - 1) + 'Z', fill: sauceD, opacity: 0.55 }, pG);
    el('ellipse', { cx: -11, cy: SY + 2.6, rx: 6.5, ry: 1.6, fill: '#FFFFFF', opacity: 0.4 }, pG);
    var wakeG = el('g', { 'clip-path': 'url(#' + id + 's)' }, pG);
    var wake = el('path', { fill: 'none', stroke: sauceD, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, wakeG);
    var wake2 = el('path', { fill: 'none', stroke: sauceL, 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, wakeG);
    // bubbles + splashes (pot-local)
    var bubbles = [0, 1, 2, 3].map(function () {
      var g = el('g', {}, pG);
      return { g: g, dome: el('path', { fill: sauceL, stroke: sauceD, 'stroke-width': 1 }, g), ring: el('ellipse', { fill: 'none', stroke: sauceD, 'stroke-width': 1.2 }, g) };
    });
    var splashes = [0, 1, 2, 3, 4].map(function () {
      var g = el('g', {}, pG);
      return { g: g, ring: el('ellipse', { fill: 'none', stroke: sauceD, 'stroke-width': 1.4 }, g), dots: el('path', { fill: 'none', stroke: dealerC, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g) };
    });
    // rim front lip highlight
    el('path', { d: 'M-24 -53.5 A31.5 8.8 0 0 0 4 -49.3', fill: 'none', stroke: IRON_HI, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, pG);
    var steam = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, pG);

    // ---- strands & drips (world, behind the chip) ----
    var strandL = el('g', {}, cam);
    var strand = el('path', { fill: dealerC, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0 }, strandL);
    var strandHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.5, 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0 }, strandL);
    var drops = [0, 1, 2, 3].map(function () {
      return { neck: el('path', { fill: dealerC, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, strandL), ball: el('circle', { fill: dealerC, stroke: INK, 'stroke-width': 1.5 }, strandL), hi: el('circle', { r: 1.1, fill: '#FFFFFF', 'fill-opacity': 0.7 }, strandL) };
    });

    // ---- the fork, the hand, the chip: clipped at the sauce surface ----
    var dipG = el('g', { 'clip-path': 'url(#' + id + 'd)' }, cam);
    var handG = el('g', {}, dipG);
    // tines + shaft
    var forkD = 'M-4 -1 L-4 -14 Q-4 -20 0 -20 Q4 -20 4 -14 L4 -1 M0 -20 L0 -88';
    el('path', { d: forkD, fill: 'none', stroke: INK, 'stroke-width': 4.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, handG);
    el('path', { d: forkD, fill: 'none', stroke: METAL, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, handG);
    el('path', { d: 'M-0.6 -30 L-0.6 -80', stroke: '#FFFFFF', 'stroke-width': 0.9, 'stroke-opacity': 0.8 }, handG);
    // handle with the colour-coded tip band (whose fork is it? Nick's)
    el('rect', { x: -4, y: -112, width: 8, height: 26, rx: 3.5, fill: WOOD, stroke: INK, 'stroke-width': 2 }, handG);
    el('rect', { x: -4, y: -96, width: 8, height: 6, fill: dealerC, stroke: INK, 'stroke-width': 1.6 }, handG);
    // sleeve
    el('rect', { x: -15, y: -720, width: 30, height: 580, fill: dealerC, stroke: INK, 'stroke-width': 2.6 }, handG);
    el('path', { d: 'M-7 -700 L-7 -160', stroke: '#FFFFFF', 'stroke-opacity': 0.22, 'stroke-width': 4 }, handG);
    el('rect', { x: -17, y: -153, width: 34, height: 15, rx: 3, fill: mix(dealerC, INK, 0.22), stroke: INK, 'stroke-width': 2.4 }, handG);
    el('circle', { cx: 9, cy: -145.5, r: 2.8, fill: GOLD, stroke: INK, 'stroke-width': 1.3 }, handG);
    // glove cuff
    el('path', { d: 'M-13 -139 L13 -139 L11 -129 L-11 -129 Z', fill: GLOVE, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, handG);
    // pinky (behind the fist)
    var pinkyG = el('g', {}, handG);
    el('path', { d: 'M0 0 L11 0', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round' }, pinkyG);
    el('path', { d: 'M0 0 L11 0', stroke: GLOVE, 'stroke-width': 4.4, 'stroke-linecap': 'round' }, pinkyG);
    // fist
    el('rect', { x: -14, y: -132, width: 27, height: 26, rx: 9, fill: GLOVE, stroke: INK, 'stroke-width': 2.4 }, handG);
    el('path', { d: 'M-12 -121 Q-2 -118 9 -121 M-12 -114 Q-2 -111 8 -114', fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, handG);
    el('path', { d: 'M-16 -128 Q-19 -119 -12 -116 Q-6 -115 -5 -121', fill: GLOVE, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, handG);
    el('path', { d: 'M-4 -130 L-4 -126 M1 -130 L1 -126 M6 -130 L6 -126', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, handG);

    // chip
    var vG = el('g', {}, dipG);
    var vVic = el('g', {}, vG); makeChip(vVic, victimC, vIni);
    var vDeal = el('g', { 'clip-path': 'url(#' + id + 'c)' }, vG); makeChip(vDeal, dealerC, dIni);
    var gloss = el('g', { opacity: 0 }, vG);
    el('path', { d: 'M-15 -6 Q-15 8 -5 15', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.6, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, gloss);
    el('circle', { cx: 10, cy: -13, r: 2.2, fill: '#FFFFFF', 'fill-opacity': 0.85 }, gloss);
    var glint = el('path', { d: 'M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 1, opacity: 0 }, gloss);
    var coatEdge = el('path', { fill: 'none', stroke: sauceD, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, vG);

    // meniscus collar where the chip pierces the sauce (world)
    var collar = el('ellipse', { fill: dealerC, stroke: sauceD, 'stroke-width': 1.3, opacity: 0 }, cam);
    var collarHi = el('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.55, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var plink = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // bubble events (deterministic)
    var bEv = [];
    for (var k = 0, te = 1380; te < 6860; k++) {
      te += 190 + 120 * hash(k);
      var u = (hash(k + 50) * 2 - 1) * 20, w = (hash(k + 90) * 2 - 1) * 0.65;
      if (te > 2950 && te < 5300 && Math.abs(u) < 16) u = (u < 0 ? -1 : 1) * (16 + 4 * hash(k + 7));
      bEv.push([te, u, w, 2.6 + 1.6 * hash(k + 20)]);
    }

    return {
      opts: opts, L: L, T: T, sx: sx, MX: MX, baseY: baseY, dealerC: dealerC, victimC: victimC, sauceD: sauceD, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, vSh: vSh, holeE: holeE, holeIn: holeIn, hole: hole, pShadow: pShadow, dust: dust, pWrap: pWrap, pG: pG,
      flameG: flameG, smoke: smoke, pEyes: pEyes, wake: wake, wake2: wake2, bubbles: bubbles, splashes: splashes, steam: steam,
      strand: strand, strandHi: strandHi, drops: drops, dipRect: dipRect, handG: handG, pinkyG: pinkyG, vG: vG, vVic: vVic, vDeal: vDeal,
      coatPath: coatPath, coatEdge: coatEdge, gloss: gloss, glint: glint, collar: collar, collarHi: collarHi,
      ripple: ripple, ticks: ticks, plink: plink, line: line, bEv: bEv
    };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var T = S.T, MX = S.MX, baseY = S.baseY, sx = S.sx;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6900, 7480)));
    var Z = lerp(1, 1.15, zk);
    var fy = clamp((T.y + baseY) / 2 - 40, 262, 330);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 650, 900)) * (1 - eio(seg(t, 7100, 7550)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    // ---- pot ----
    var m = potPose(t);
    var pVis = t >= 820 && t < 7480;
    S.pWrap.setAttribute('display', pVis ? 'inline' : 'none');
    var hk = holeK(t);
    S.holeE.setAttribute('rx', f1(40 * PS * hk)); S.holeE.setAttribute('ry', f1(9.5 * hk));
    S.holeIn.setAttribute('rx', f1(33 * PS * hk)); S.holeIn.setAttribute('ry', f1(5.5 * hk));
    S.hole.setAttribute('display', hk > 0.01 ? 'inline' : 'none');
    var standing = pVis ? clamp(1 - m.dy / 40) * clamp(1 - Math.max(0, -m.dy) / 30, 0.5, 1) : 0;
    S.pShadow.setAttribute('cx', f1(MX + m.dx + 2)); S.pShadow.setAttribute('rx', f1(34 * PS * (0.8 + 0.2 * standing)));
    S.pShadow.setAttribute('opacity', f1(standing * 22 * (t > 1120 ? 1 : 0)) / 100);
    if (pVis) S.pG.setAttribute('transform', 'translate(' + f1(MX + m.dx) + ',' + f1(baseY + m.dy) + ') rotate(' + f1(m.rot) + ') scale(' + f2((2 - m.sqy) * PS) + ',' + f2(m.sqy * PS) + ')');

    // eruption dust
    var dp0 = seg(t, 860, 1150);
    if (dp0 > 0 && dp0 < 1) {
      var dd = '';
      [-2.9, -2.5, -0.65, -0.25, 2.6, 0.5].forEach(function (a) {
        var r0 = 1 + 0.25 * eoC(dp0), r1 = r0 + 0.18 * (1 - dp0);
        dd += 'M' + f1(MX + Math.cos(a) * 50 * r0) + ' ' + f1(baseY + Math.sin(a) * 13 * r0) + 'L' + f1(MX + Math.cos(a) * 50 * r1) + ' ' + f1(baseY + Math.sin(a) * 13 * r1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // flame: whoomp on, flicker, snuff
    var fOn = t < 1270 ? 0 : backOut(seg(t, 1270, 1420), 2.4) * (1 - eio(seg(t, 7120, 7220)));
    var fl = 1 + 0.12 * Math.sin(t * 0.031) + 0.07 * Math.sin(t * 0.077 + 1);
    var fsk = 5 * Math.sin(t * 0.019) + 3 * Math.sin(t * 0.053);
    S.flameG.setAttribute('transform', 'translate(0,-9) skewX(' + f1(fsk) + ') scale(' + f2(Math.max(0.001, fOn * (2 - fl) * 0.9 + 0.1 * fOn)) + ',' + f2(Math.max(0.001, fOn * fl)) + ')');
    S.flameG.setAttribute('display', fOn > 0.01 ? 'inline' : 'none');
    var sm = seg(t, 7180, 7470);
    if (sm > 0 && sm < 1) { S.smoke.setAttribute('d', squiggle(0, -10 - 10 * sm, 12, t * 0.02)); S.smoke.setAttribute('opacity', f1(Math.sin(Math.PI * sm) * 80) / 100); }
    else S.smoke.setAttribute('opacity', 0);

    // ---- chip (base) ----
    var c = chipBase(S, t), crot = chipRot(S, t);

    // pot eyes
    var happy = seg(t, 3180, 3260) * (1 - seg(t, 4700, 4760)) + seg(t, 6830, 6900);
    var plid = kf([[0, 1], [1290, 1], [1360, -1], [2120, -1], [2160, 1], [2200, -1], [3180, -1], [3240, 1], [4700, 1], [4770, -1.15], [5950, -1.15], [5990, 1], [6030, -1], [6830, -1], [6890, 1]], t);
    S.pEyes.forEach(function (e) {
      var E = toWorld(S, m, e.p[0], e.p[1]);
      var tg = [c.x, c.y];
      if (t < 1500) tg = [E[0], E[1] + 40];
      // follow the drips down
      DRIPS.forEach(function (d) { var q = bump(t, d + 170, d + 330); if (q > 0) tg = [c.x, lerp(c.y, c.surfY || c.y, 0.5 * q)]; });
      var dx = tg[0] - E[0], dy = tg[1] - E[1], mm = Math.hypot(dx, dy) || 1;
      var vx = dx / mm, vy = dy / mm;
      if (t > 6900) { vx = 0; vy = 0.15; }
      e.pup.setAttribute('cx', f1(vx * 2)); e.pup.setAttribute('cy', f1(vy * 2));
      e.gl.setAttribute('cx', f1(vx * 2 - 0.8)); e.gl.setAttribute('cy', f1(vy * 2 - 0.8));
      var r = 4.8, Ly = clamp(plid, -1, 1) * r;
      if (plid <= -0.97) e.lid.setAttribute('d', '');
      else if (plid >= 0.99) e.lid.setAttribute('d', circleD(0, 0, r) + (happy > 0.5 ? 'M-3.2 1.3 Q0 -2.4 3.2 1.3' : 'M-3.4 0.3 Q0 2.2 3.4 0.3'));
      else { var ddx = Math.sqrt(r * r - Ly * Ly); e.lid.setAttribute('d', 'M' + f1(-ddx) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(ddx) + ' ' + f1(Ly) + 'Z'); }
      var wide = plid < -1.01 ? 1.12 : 1;
      e.pup.setAttribute('r', f1(2.3 * (wide > 1 ? 0.85 : 1)));
    });

    // bubbles: blip, blip
    var slot = [null, null, null, null];
    S.bEv.forEach(function (ev, k) { if (t >= ev[0] && t < ev[0] + 360) slot[k % 4] = ev; });
    // the last big BLIP
    var big = t >= 6880 && t < 7160 ? [6880, 4, 0.1, 8] : null;
    S.bubbles.forEach(function (b, k) {
      var ev = (k === 0 && big) ? big : slot[k];
      if (!ev || t < 1380) { b.g.setAttribute('display', 'none'); return; }
      var life = ev === big ? 280 : 360;
      var a = (t - ev[0]) / life, R = ev[3], y0 = SY + ev[2] * SRY * 0.8;
      b.g.setAttribute('display', 'inline');
      if (a < 0.72) {
        var g = eo(a / 0.72), rr = R * g;
        b.dome.setAttribute('d', 'M' + f1(ev[1] - rr) + ' ' + f1(y0) + 'A' + f1(rr) + ' ' + f1(rr * 0.85) + ' 0 0 1 ' + f1(ev[1] + rr) + ' ' + f1(y0) + 'Z');
        b.ring.setAttribute('rx', 0); b.ring.setAttribute('ry', 0);
      } else {
        var pp = (a - 0.72) / 0.28;
        b.dome.setAttribute('d', '');
        b.ring.setAttribute('cx', f1(ev[1])); b.ring.setAttribute('cy', f1(y0));
        b.ring.setAttribute('rx', f1(R * (1 + 1.4 * eo(pp)))); b.ring.setAttribute('ry', f1(R * 0.32 * (1 + 1.4 * eo(pp))));
        b.ring.setAttribute('opacity', f1((1 - pp) * 100) / 100);
      }
    });
    // splashes: entry, strand snap, three drips
    var spEv = [[3175, 0, 9], [5130, 0, 7]];
    DRIPS.forEach(function (d) { spEv.push([d + 320, 0, 6]); });
    S.splashes.forEach(function (s, k) {
      var ev = spEv[k], a = seg(t, ev[0], ev[0] + 380);
      if (a <= 0 || a >= 1) { s.g.setAttribute('display', 'none'); return; }
      s.g.setAttribute('display', 'inline');
      var y0 = SY + 0.5;
      s.ring.setAttribute('cx', ev[1]); s.ring.setAttribute('cy', y0);
      s.ring.setAttribute('rx', f1(3 + ev[2] * 1.6 * eoC(a))); s.ring.setAttribute('ry', f1((3 + ev[2] * 1.6 * eoC(a)) * 0.27));
      s.ring.setAttribute('opacity', f1((1 - a) * 100) / 100);
      var dd2 = '', ph = a;
      [-1, 1].forEach(function (sd) {
        var x = ev[1] + sd * (3 + 7 * ph), y = y0 - 9 * 4 * ph * (1 - ph) * (ev[2] / 8) * 1.5;
        if (ph < 0.85) dd2 += 'M' + f1(x) + ' ' + f1(y) + 'l0.1 0';
      });
      s.dots.setAttribute('d', dd2);
    });
    // steam wisps
    var stA = 0;
    if (stA > 0) {
      var sdd = '';
      [-12, 10].forEach(function (ox, k) {
        var ph2 = ((t / 1400) + k * 0.5) % 1;
        sdd += squiggle(ox, SY - 6 - 22 * ph2, 9, t * 0.006 + k * 2);
      });
      S.steam.setAttribute('d', sdd); S.steam.setAttribute('opacity', f1(30 * stA) / 100);
    } else S.steam.setAttribute('opacity', 0);

    // wake (figure-eight trail in the sauce)
    var wA = seg(t, SW0, SW0 + 150) * (1 - seg(t, SW1, SW1 + 450));
    if (wA > 0 && t >= SW0) {
      var wd = '', t0 = Math.max(SW0, Math.min(t, SW1) - 650), t1 = Math.min(t, SW1);
      for (var tt = t0, i = 0; tt <= t1 + 0.1; tt += 25, i++) {
        var uw = swirlUW(tt);
        wd += (i ? 'L' : 'M') + f1(uw[0]) + ' ' + f1(SY + uw[1] * SRY * 0.8 + 1.4);
      }
      S.wake.setAttribute('d', wd); S.wake2.setAttribute('d', wd);
      S.wake.setAttribute('opacity', f1(70 * wA) / 100); S.wake2.setAttribute('opacity', f1(80 * wA) / 100);
      S.wake2.setAttribute('transform', 'translate(0,-1.2)');
    } else { S.wake.setAttribute('opacity', 0); S.wake2.setAttribute('opacity', 0); }

    // ---- hand + fork ----
    var h = handPose(S, t);
    S.handG.setAttribute('display', h.vis ? 'inline' : 'none');
    S.handG.setAttribute('transform', 'translate(' + f1(h.x) + ',' + f1(h.y) + ') rotate(' + f1(h.rot) + ')');
    S.pinkyG.setAttribute('transform', 'translate(10,-110) rotate(' + f1(h.pinky) + ')');

    // ---- chip render ----
    var r = CR * c.s;
    var vx2 = c.x, vy2 = c.y;
    if (c.wob && c.wob > 0.002) {
      var wa2 = (t - 6760) * 0.02;
      S.vG.setAttribute('transform', 'translate(' + f1(vx2) + ',' + f1(vy2) + ') rotate(' + f1(wa2 * 57.3) + ') scale(' + f2(1 + c.wob) + ',' + f2(1 - c.wob) + ') rotate(' + f1(-wa2 * 57.3) + ')');
    } else {
      var pop = t < 2440 ? chipPop(T) : 1;
      S.vG.setAttribute('transform', 'translate(' + f1(vx2) + ',' + f1(vy2) + ') rotate(' + f1(crot) + ') scale(' + f2(c.s * pop * c.sqx * c.flip) + ',' + f2(c.s * pop * c.sqy) + ')');
    }
    // dip clip
    var clipY = c.inPot ? c.surfY : 3000;
    S.dipRect.setAttribute('height', f1(clipY + 2000));
    // coat
    var yc = coatLine(t); // chip-local coat line
    if (t > 4450) { S.coatPath.setAttribute('d', 'M-40 -40 L40 -40 L40 40 L-40 40 Z'); S.vVic.setAttribute('display', 'none'); S.coatEdge.setAttribute('opacity', 0); }
    else if (yc > CR + 2) { S.coatPath.setAttribute('d', 'M-40 60 L40 60 L40 61 Z'); S.vVic.setAttribute('display', 'inline'); S.coatEdge.setAttribute('opacity', 0); }
    else {
      S.vVic.setAttribute('display', 'inline');
      var cdd = '', ed = '', prevIn = false;
      for (var x = -26; x <= 26; x += 2) {
        var y = yc + 1.4 * Math.sin(x * 0.4 + t * 0.004) - 3.2 * Math.exp(-Math.pow((x + 7) / 3.2, 2)) - 2.4 * Math.exp(-Math.pow((x - 8) / 2.8, 2));
        cdd += (x === -26 ? 'M' : 'L') + x + ' ' + f1(y);
        var isIn = x * x + y * y < (CR - 1.5) * (CR - 1.5);
        if (isIn) ed += (prevIn ? 'L' : 'M') + x + ' ' + f1(y);
        prevIn = isIn;
      }
      S.coatPath.setAttribute('d', cdd + 'L26 40 L-26 40 Z');
      S.coatEdge.setAttribute('d', ed); S.coatEdge.setAttribute('opacity', 0.9);
    }
    var wet = wetness(t);
    S.gloss.setAttribute('opacity', f2(wet * (t > 3360 ? 1 : 0.4)));
    var gl = bump(t, 6150, 6420);
    S.glint.setAttribute('opacity', f2(gl)); S.glint.setAttribute('transform', 'translate(10,-13) scale(' + f2(0.4 + gl) + ') rotate(' + f1(t * 0.2) + ')');

    // chip shadow on the felt
    var shA = 1, lift = 0;
    if (t >= 2440 && t < 6760) {
      shA = (1 - seg(t, 2470, 2640)) + seg(t, 6560, 6760);
      lift = t < 4000 ? (T.y - c.y) * 0.25 : (T.y - c.y) * 0.25;
    }
    var shx = t < 4000 && t >= 2440 ? T.x : c.x;
    if (t >= 6560) shx = c.x;
    S.vSh.setAttribute('cx', f1(shx + 1.5 + Math.max(0, lift) * 0.3)); S.vSh.setAttribute('cy', f1((t >= 2440 && t < 6760 ? T.y : c.y) + 3.5 + Math.max(0, Math.min(10, lift))));
    S.vSh.setAttribute('r', f1(CR * (t < 2440 ? chipPop(T) : 1) * (1 - 0.15 * clamp(lift / 20))));
    S.vSh.setAttribute('opacity', f1(28 * clamp(shA)) / 100);

    // collar where the chip pierces the sauce
    if (c.inPot && Math.abs(c.surfY - c.y) < r) {
      var dy0 = c.surfY - c.y, half = Math.sqrt(r * r - dy0 * dy0);
      var lift2 = t > SW1 ? seg(t, SW1, 4900) : 0;
      S.collar.setAttribute('cx', f1(c.x)); S.collar.setAttribute('cy', f1(c.surfY - 0.5 - 2 * lift2));
      S.collar.setAttribute('rx', f1(half + 3.5)); S.collar.setAttribute('ry', f1(3.2 + 1.5 * lift2));
      S.collar.setAttribute('opacity', 1);
      S.collarHi.setAttribute('d', 'M' + f1(c.x - half) + ' ' + f1(c.surfY - 1.6) + 'Q' + f1(c.x - half * 0.5) + ' ' + f1(c.surfY - 3.2) + ' ' + f1(c.x) + ' ' + f1(c.surfY - 2.4));
      S.collarHi.setAttribute('opacity', 1);
    } else { S.collar.setAttribute('opacity', 0); S.collarHi.setAttribute('opacity', 0); }

    // the long glossy strand on the lift-out
    var bot = c.y + r, surfY = surf(S, 0, 0)[1];
    if (t >= SW1 && t < 5080 && bot < surfY - 1) {
      var Ls = surfY - bot, k2 = clamp(Ls / 58);
      var wt = lerp(16, 8, k2), wb = lerp(20, 10, k2), wn = lerp(13, 2.2, eo(k2));
      S.strand.setAttribute('d', strandD(c.x, bot - 4, wt, surf(S, 0, 0)[0], surfY + 1, wb, wn));
      S.strand.setAttribute('opacity', 1);
      S.strandHi.setAttribute('d', 'M' + f1(c.x - wt * 0.18) + ' ' + f1(bot + 2) + 'Q' + f1(c.x - wn * 0.3) + ' ' + f1(lerp(bot, surfY, 0.5)) + ' ' + f1(c.x - wb * 0.2) + ' ' + f1(surfY - 3));
      S.strandHi.setAttribute('opacity', 1);
    } else if (t >= 5080 && t < 5200) {
      // snapped: the lower half slumps back into the pot
      var ps = seg(t, 5080, 5200), hh = 30 * (1 - eo(ps)), sp0 = surf(S, 0, 0);
      S.strand.setAttribute('d', strandD(sp0[0], surfY - hh, 2, sp0[0], surfY + 1, lerp(10, 4, ps), lerp(4, 3, ps)));
      S.strand.setAttribute('opacity', 1); S.strandHi.setAttribute('opacity', 0);
    } else { S.strand.setAttribute('opacity', 0); S.strandHi.setAttribute('opacity', 0); }

    // drips: drip... drip... drip
    S.drops.forEach(function (D, k) {
      var start = k === 0 ? 5080 : DRIPS[k - 1] + 230, end = k === 0 ? DRIPS[0] + 230 : DRIPS[k - 1] + 230;
      if (k > 0) { start = DRIPS[k - 1] + 230 - 210; }
      var dStart = k === 0 ? 5080 : DRIPS[k - 1], detach = (k === 0 ? DRIPS[0] : DRIPS[k - 1]) + 180;
      if (k === 3) { D.neck.setAttribute('d', ''); D.ball.setAttribute('r', 0); D.hi.setAttribute('r', 0); return; }
      var d0 = DRIPS[k], tdet = d0 + 180, tland = d0 + 320;
      if (t < (k === 0 ? 5080 : d0) || t >= tland) {
        D.neck.setAttribute('d', ''); D.ball.setAttribute('r', 0); D.hi.setAttribute('r', 0); return;
      }
      var bx = c.x, by = c.y + r * Math.cos(crot * Math.PI / 180) - 2;
      bx -= r * Math.sin(crot * Math.PI / 180);
      if (t < tdet) {
        var g;
        if (k === 0 && t < d0) { g = 1 - 0.5 * eo(seg(t, 5080, d0)); } // retracting from the snapped strand
        else g = (k === 0 ? 0.5 : 0) + (k === 0 ? 0.5 : 1) * eo(seg(t, d0, tdet));
        var neck = lerp(3, 14, g) * (k === 0 && t < d0 ? 1.5 : 1), br = lerp(2.2, 6.2, Math.min(1, g)) * (k === 2 ? 0.85 : 1);
        D.neck.setAttribute('d', strandD(bx, by - 2, 12, bx, by + neck, br * 1.2, lerp(5, 3.2, g)));
        D.ball.setAttribute('cx', f1(bx)); D.ball.setAttribute('cy', f1(by + neck + br * 0.6)); D.ball.setAttribute('r', f1(br)); D.ball.setAttribute('transform', '');
        D.hi.setAttribute('cx', f1(bx - br * 0.35)); D.hi.setAttribute('cy', f1(by + neck + br * 0.2)); D.hi.setAttribute('r', f1(br * 0.28));
      } else {
        var pf = seg(t, tdet, tland), br2 = 6.2 * (k === 2 ? 0.85 : 1);
        var y0 = by + 14 + br2 * 0.6, yy = lerp(y0, surfY - 1, ei(pf));
        var nk = 12 * (1 - eo(seg(t, tdet, tdet + 90)));
        D.neck.setAttribute('d', nk > 0.5 ? strandD(bx, by - 2, 12, bx, by + nk, 2.4, 2.6) : '');
        D.ball.setAttribute('cx', f1(bx)); D.ball.setAttribute('cy', f1(yy)); D.ball.setAttribute('r', f1(br2 * (1 - 0.2 * pf)));
        D.ball.setAttribute('transform', 'translate(' + f1(bx) + ',' + f1(yy) + ') scale(' + f2(1 - 0.15 * pf) + ',' + f2(1 + 0.3 * pf) + ') translate(' + f1(-bx) + ',' + f1(-yy) + ')');
        D.hi.setAttribute('cx', f1(bx - 1.8)); D.hi.setAttribute('cy', f1(yy - 1.8)); D.hi.setAttribute('r', 1.5);
      }
    });

    // pickup plink
    var pk = seg(t, 2420, 2620);
    if (pk > 0 && pk < 1) {
      var pd = '';
      [-2.4, -1.9, -1.2, -0.7].forEach(function (a) {
        var r0 = 27 + 8 * eoC(pk), r1 = r0 + 5 * (1 - pk);
        pd += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1) + ' ' + f1(T.y + Math.sin(a) * r1);
      });
      S.plink.setAttribute('d', pd); S.plink.setAttribute('opacity', f1((1 - pk) * 90) / 100);
    } else S.plink.setAttribute('opacity', 0);

    // landing ring + ticks
    var rp = seg(t, 6760, 7260);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var tp = seg(t, 6760, 7030);
    if (tp > 0 && tp < 1) {
      var td = '', r0 = 27 + 9 * eoC(tp), r1b = r0 + 6 * (1 - tp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        td += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.ticks.setAttribute('d', td); S.ticks.setAttribute('opacity', f1((1 - tp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);

    // final line
    var lp2 = seg(t, 7600, 7930);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2fondue;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2fondue = S;
    return S;
  }

  window.CCSteal2_fondue = {
    title: 'The Fondue',
    blurb: 'A tiny fondue pot of Nick’s-colour sauce pops out of the felt, a white-gloved hand dips Nate’s chip in a lazy figure-eight, lets it drip, twirls it, and sets it back in its spot fully coated in Nick’s colour.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2fondue = S;
      var token = {};
      root.__cc2fondueToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2fondueToken !== token) { resolve(); return; }
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
