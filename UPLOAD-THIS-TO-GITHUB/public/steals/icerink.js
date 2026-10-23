/* Closed Caption - "steal" moment - concept: BETWEEN PERIODS (key: icerink)
 *
 * Ice hockey intermission. Nate's caption card glazes over into a little rink;
 * Nate's chip sprouts skates and shows off. The resurfacing machine (painted in
 * the dealer's colour) lays a fresh glossy sheet of Nick-coloured ice behind it
 * - and resurfaces whatever is lying in its lane.
 *
 * Storyboard (ms) - top-down felt table, side-on "cartoon depth" for the actors.
 *    0- 700  Table deals in: rows drop in with a soft overshoot, chips pop on.
 *  500-1200  Camera eases in a touch (whole row + neighbours stay in frame).
 *  650-1250  Frost spreads out from Nate's chip: the card glazes into a tiny rink
 *            (boards, red centre line, blue lines). Other chips dim.
 * 1250-1500  Nate's chip shivers awake: eyes pop open, legs + skates pop out,
 *            it looks down at its skates - delighted.
 * 1500-1750  Hops off its spot into the skating lane (dashed ghost marks the spot).
 * 1750-2300  Glides forward along the lane, arms out, chin up.
 * 2300-2550  Hockey stop - ice spray. Show-off.
 * 2550-3500  Skates BACKWARDS, eyes shut, smug, swaying crossovers.
 *            Meanwhile (2900+) a boxy resurfacing machine putters in from the
 *            left behind it, laying a glossy Nick-coloured sheet. It can't see.
 * 3500-3900  The twirl: two spins on one skate, arms overhead.
 * 3900-4000  "Ta-da" pose, eyes closed...
 * 4000-4070  SPLAT. The machine rolls right over it (bump), flat as a pancake.
 * 4070-5050  The machine putters on; the rear squeegee lays the fresh sheet over
 *            the pancake - it comes out glossy, in Nick's colour, with "Ni".  (beat)
 * 5050-5300  POP! Springs back up (stretch/squash), dazed eyes; gloss glint sweeps.
 * 5300-5800  Looks down at its new finish... beams. Twinkles.          (beat)
 * 5800-6150  Pushes off proudly, chin up...
 * 6150-6700  ...and its own fresh ice gets it: legs everywhere, arms flailing.
 * 6700-7080  Flat on its back, it skids and spins - straight into its spot,
 *            stopping dead-exact. Plonk (squash, ring, dust ticks).
 * 7080-7450  Satisfied blink, eyes/legs tuck away; the rink thaws back to card,
 *            camera eases out, chips undim.
 * 7450-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var ICE1 = '#F3FAFE', ICE2 = '#D6EAF5', RED = '#D9483B', BLUE = '#3473D1';
  var STEEL = '#C9D2DA', BODYC = '#F6F2EA', DARK = '#4C5560';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var LEG = 13; // hip-to-blade
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
  function f3(v) { return Math.round(v * 1000) / 1000; }
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
  function P2(x, y) { return f1(x) + ' ' + f1(y); }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function star(x, y, r) { // 4-point twinkle
    var q = r * 0.28;
    return 'M' + P2(x, y - r) + 'Q' + P2(x + q, y - q) + ' ' + P2(x + r, y) + 'Q' + P2(x + q, y + q) + ' ' + P2(x, y + r) +
      'Q' + P2(x - q, y + q) + ' ' + P2(x - r, y) + 'Q' + P2(x - q, y - q) + ' ' + P2(x, y - r) + 'Z';
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
    var tr = rows[target.row];
    var gnd = Math.min(tr.mid + h / 2 + 5, 557);
    var rink = { x0: 24, x1: W - 24, y0: tr.y - 7, y1: Math.min(gnd + 13, 568) };
    return { rows: rows, target: target, others: others, h: h, g: g, ini: ini, trow: tr, gnd: gnd, rink: rink };
  }

  // ---------- choreography ----------
  var XC = 186;            // where the twirl (and the accident) happens
  var V_M = 0.18;          // machine speed px/ms
  var T_HIT = 4000;
  var MS = 1.3;            // machine scale
  var ML = 75 * MS;        // machine length (front to rear squeegee)
  function machineX(t) { return XC - 22 + V_M * (t - T_HIT) + 0.9 * Math.sin(t * 0.021); }

  // skater state: x,y = chip centre (world); rot deg; sx,sy face scale; stand 0..1 (legs);
  // la, lb leg angles (deg from straight down, + toward +x); aa, ab arm angles (deg from down, outward);
  // arms 0..1; eyes 0..1; lid 0..1; happy 0..1; lx,ly pupil dir; wide; spin (cos)
  function skater(L, t) {
    var T = L.target, gnd = L.gnd, sy0 = gnd - (CR + LEG), xR = clamp(Math.max(T.x + 70, 296), 0, 330), xP = XC + 52;
    var s = { x: T.x, y: T.y, rot: 0, sx: 1, sy: 1, stand: 0, la: 0, lb: 0, aa: 20, ab: 20, arms: 0, eyes: 0, lid: 0, happy: 0, lx: 0, ly: 0, wide: 1, spin: 1, puff: 1, legK: 1 };
    // --- wake (1250-1500)
    if (t >= 1250) {
      s.eyes = eoC(seg(t, 1280, 1360));
      s.stand = backOut(seg(t, 1340, 1500), 2);
      s.arms = backOut(seg(t, 1380, 1520), 2);
      if (t < 1360) s.x += 1.6 * Math.sin((t - 1250) * 0.2);
      s.ly = kf([[1300, 0], [1380, 0.9], [1520, 0.9], [1600, 0]], t);
      s.lx = kf([[1520, 0], [1640, 0.9]], t);
      s.wide = 1 + 0.25 * Math.sin(Math.PI * seg(t, 1300, 1460));
      s.aa = s.ab = kf([[1380, 20], [1520, 40]], t);
    }
    // --- hop (1500-1750)
    if (t >= 1500 && t < 1750) {
      var hp = seg(t, 1500, 1750), he = eio(hp);
      s.x = lerp(T.x, T.x + 22, he);
      s.y = lerp(T.y, sy0, he) - 18 * Math.sin(Math.PI * hp);
      s.sy = 1 + 0.08 * Math.sin(Math.PI * hp); s.sx = 1 / s.sy;
      s.la = -12 * Math.sin(Math.PI * hp); s.lb = 14 * Math.sin(Math.PI * hp);
      s.aa = s.ab = 40 + 60 * Math.sin(Math.PI * hp);
    }
    // --- glide forward (1750-2300) and hockey stop (2300-2550)
    if (t >= 1750 && t < 2550) {
      var x0 = T.x + 22;
      var gp = seg(t, 1750, 2420);
      s.x = lerp(x0, xR, 1 - Math.pow(1 - gp, 1.7));
      s.y = sy0;
      var land = t - 1750;
      s.sy = 1 - 0.1 * Math.exp(-land / 70) * Math.cos(land * 0.03); s.sx = 1 / s.sy;
      var ph = (t - 1750) * 0.016;
      var push = clamp(1 - seg(t, 2150, 2300));
      s.la = -32 * Math.max(0, Math.sin(ph)) * push;
      s.lb = -32 * Math.max(0, -Math.sin(ph)) * push;
      s.rot = 9 * push + Math.sin(ph) * 3 * push;
      s.aa = s.ab = 70 + 8 * Math.sin(ph);
      s.lx = 0.9; s.ly = -0.25; s.lid = 0.35;
      if (t >= 2300) { // hockey stop: lean back, skates turned, spray
        var hs = seg(t, 2300, 2550);
        s.rot = lerp(-16, 0, eio(seg(t, 2380, 2550)));
        s.la = s.lb = 38 * (1 - eio(seg(t, 2420, 2550)));
        s.y = sy0 + 4 * Math.sin(Math.PI * clamp(hs * 1.5));
        s.happy = seg(t, 2340, 2400); s.aa = 95; s.ab = 40;
      }
    }
    // --- backwards, smug (2550-3500)
    if (t >= 2550 && t < 3500) {
      var bp = seg(t, 2550, 3500);
      s.x = lerp(xR, XC, eio(bp) * 0.85 + bp * 0.15);
      s.y = sy0;
      var ph2 = (t - 2550) * 0.0125;
      s.rot = -6 + 7 * Math.sin(ph2);
      s.la = 22 * Math.sin(ph2) - 4; s.lb = 22 * Math.sin(ph2 + 2.2) + 4;
      s.y += 1.5 * Math.abs(Math.sin(ph2));
      s.happy = 1; s.aa = 80 + 10 * Math.sin(ph2); s.ab = 80 - 10 * Math.sin(ph2);
      if (t > 3050 && t < 3300) { s.happy = 0; s.lid = 0.5; s.lx = 0; s.ly = 0.1; } // a smug glance at camera
    }
    // --- twirl (3500-3900) + ta-da (3900-4000)
    if (t >= 3500 && t < 4000) {
      var tp = seg(t, 3500, 3900);
      s.x = XC; s.y = sy0 - 3 * Math.sin(Math.PI * tp);
      var ang = 2 * Math.PI * 2 * eioC(tp);
      s.spin = Math.cos(ang);
      s.la = 0; s.lb = lerp(0, -70, eo(seg(t, 3500, 3600))) * (1 - eio(seg(t, 3850, 3920)));
      s.aa = s.ab = lerp(80, 168, eo(seg(t, 3500, 3620)));
      s.happy = 1;
      if (t >= 3900) { var tq = seg(t, 3900, 3960); s.aa = s.ab = lerp(168, 140, eo(tq)); s.puff = 1 + 0.06 * eo(tq); s.rot = -5 * eo(tq); s.lb = 0; s.la = -8 * eo(tq); }
    }
    // --- splat & pancake (4000-5050)
    if (t >= 4000 && t < 5050) {
      var sp = seg(t, 4000, 4065);
      s.x = XC; s.spin = 1; s.happy = 1;
      var syv = lerp(1, 0.21, ei(sp)), sxv = lerp(1, 1.62, ei(sp));
      if (t >= 4065) { var d = t - 4065; syv = 0.21 + spring(d, 0.03, 6, 80); sxv = 1.62 - spring(d, 0.06, 6, 80); }
      s.sy = syv; s.sx = sxv; s.y = gnd - CR * syv;
      s.stand = 1 - seg(t, 4000, 4040); s.arms = 1 - seg(t, 4000, 4040); s.aa = s.ab = 140;
      s.eyes = 1;
      if (t > 4400) { s.happy = 0; s.lid = 0.85; } // squashed flat, eyes as slits
    }
    // --- pop (5050-5300), admire (5300-5800)
    if (t >= 5050 && t < 5800) {
      var pp = seg(t, 5050, 5160);
      var d2 = t - 5160;
      var syv2 = t < 5160 ? lerp(0.21, 1.3, eoC(pp)) : 1 + 0.3 * Math.exp(-d2 / 90) * Math.cos(2 * Math.PI * 4 * d2 / 1000);
      s.sy = syv2; s.sx = 1 / Math.sqrt(syv2);
      s.x = XC;
      var lift = t < 5300 ? 14 * Math.sin(Math.PI * seg(t, 5060, 5300)) : 0;
      s.stand = backOut(seg(t, 5100, 5260), 2); s.arms = backOut(seg(t, 5120, 5280), 2);
      s.y = sy0 - lift + (s.stand < 1 ? (1 - s.stand) * LEG : 0);
      s.eyes = 1; s.wide = 1.15;
      var dz = seg(t, 5100, 5420);
      if (dz > 0 && dz < 1) { var a2 = dz * Math.PI * 4; s.lx = 0.9 * Math.cos(a2); s.ly = 0.9 * Math.sin(a2); } // dazed spin
      if (t >= 5420) { s.wide = 1; s.lx = 0; s.ly = kf([[5420, 0], [5480, 1]], t); s.lid = 0.15; } // looks down at itself
      if (t >= 5640) { s.happy = 1; s.lid = 0; s.ly = 0; }
      s.puff = 1 + 0.07 * eio(seg(t, 5600, 5720)) ;
      s.aa = s.ab = kf([[5120, 40], [5300, 40], [5640, 35], [5720, 125, backOut]], t);
      s.rot = 3 * Math.sin(Math.PI * seg(t, 5600, 5800));
    }
    // --- proud stride (5800-6150)
    if (t >= 5800 && t < 6150) {
      var pr = seg(t, 5800, 6150);
      s.x = lerp(XC, xP, eio(pr)); s.y = sy0;
      var ph3 = (t - 5800) * 0.018;
      s.la = -28 * Math.max(0, Math.sin(ph3)); s.lb = -28 * Math.max(0, -Math.sin(ph3));
      s.rot = 6; s.puff = 1.07 - 0.07 * seg(t, 6050, 6150);
      s.lid = 0.55; s.lx = 0.5; s.ly = -0.85; // chin up
      s.aa = 60 + 30 * Math.sin(ph3); s.ab = 60 - 30 * Math.sin(ph3);
    }
    // --- the slip (6150-6700)
    if (t >= 6150 && t < 6700) {
      var sl = seg(t, 6150, 6700), u = t - 6150;
      var amp = Math.sin(Math.PI * clamp(sl * 1.15));
      s.x = xP + 10 * eo(sl) + 5 * Math.sin(u * 0.035) * amp;
      s.y = sy0 - 10 * Math.abs(Math.sin(u * 0.022)) * amp;
      s.rot = 30 * Math.sin(u * 0.03) * amp + 6 * (1 - sl);
      s.la = (-55 + 75 * Math.sin(u * 0.055)) * amp; s.lb = (55 + 75 * Math.sin(u * 0.055 + 1.9)) * amp;
      s.aa = 90 + 80 * Math.sin(u * 0.045) * amp; s.ab = 90 + 80 * Math.sin(u * 0.045 + 2) * amp;
      s.legK = 1 + 0.6 * amp;
      s.wide = 1.3; s.lx = 0.8 * Math.sin(u * 0.06); s.ly = -0.5 + 0.4 * Math.cos(u * 0.05);
      if (t < 6200) { s.wide = lerp(1, 1.3, seg(t, 6150, 6200)); s.lid = 0; }
      // feet fly up at the end: falls "on its back"
      if (t > 6560) { var fb = eio(seg(t, 6560, 6700)); s.la = lerp(s.la, -150, fb); s.lb = lerp(s.lb, 150, fb); s.rot = lerp(s.rot, 0, fb); s.y = lerp(s.y, sy0 - 6, fb); }
    }
    // --- the slide into its spot (6700-7080) and plonk
    if (t >= 6700) {
      var sd = seg(t, 6700, 7080), se = eoC(sd);
      var x0b = xP + 10, y0b = sy0 - 6;
      var cx1 = lerp(x0b, T.x, 0.5) + 30, cy1 = lerp(y0b, T.y, 0.5) + 14;
      var it = 1 - se;
      s.x = it * it * x0b + 2 * it * se * cx1 + se * se * T.x;
      s.y = it * it * y0b + 2 * it * se * cy1 + se * se * T.y;
      s.rot = -360 * se + 360; if (sd >= 1) s.rot = 0;
      s.stand = 1 - eio(seg(t, 6950, 7180));
      s.la = -150 + 20 * Math.sin(t * 0.04) * (1 - sd); s.lb = 150 - 20 * Math.sin(t * 0.04 + 1) * (1 - sd);
      s.legK = lerp(1.5, 1, seg(t, 6700, 6950));
      s.arms = 1 - eio(seg(t, 6950, 7180)); s.aa = s.ab = 120 + 30 * Math.sin(t * 0.04) * (1 - sd);
      s.eyes = 1 - eio(seg(t, 7280, 7420));
      s.wide = lerp(1.3, 1, seg(t, 6700, 6950));
      s.lx = 0; s.ly = 0;
      s.happy = t > 7120 ? 1 : 0;
      if (t >= 7080) {
        var d3 = t - 7080;
        var ps = d3 < 90 ? lerp(1, 0.9, eo(d3 / 90)) : 1 - 0.1 * Math.exp(-(d3 - 90) / 110) * Math.cos(2 * Math.PI * 4.5 * (d3 - 90) / 1000);
        if (d3 > 900) ps = 1;
        s.sx = s.sy = ps;
        s.x = T.x; s.y = T.y;
      } else { s.sx = s.sy = 1; }
    }
    return s;
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-icerink-' + (++uid) + '-';
    var L = layout(opts), T = L.target, R = L.rink, gnd = L.gnd;
    var DC = opts.dealerColor || '#E8559E', VC = T.color || opts.victimColor;
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var ig = mk('linearGradient', { id: id + 'ice', x1: '0', y1: '0', x2: '0.35', y2: '1' }, defs);
    mk('stop', { offset: '0', 'stop-color': ICE1 }, ig); mk('stop', { offset: '1', 'stop-color': ICE2 }, ig);
    var frostClipP = mk('path', { d: '' }, mk('clipPath', { id: id + 'frost', clipPathUnits: 'userSpaceOnUse' }, defs));
    var sheetClipR = mk('rect', { x: -500, y: -1000, width: 0, height: 3000 }, mk('clipPath', { id: id + 'sheet', clipPathUnits: 'userSpaceOnUse' }, defs));
    mk('circle', { cx: 0, cy: 0, r: CR - 1.3 }, mk('clipPath', { id: id + 'disc', clipPathUnits: 'userSpaceOnUse' }, defs));
    var rinkClipR = mk('rect', { x: R.x0 + 2, y: R.y0 + 2, width: R.x1 - R.x0 - 4, height: R.y1 - R.y0 - 4, rx: 14 }, mk('clipPath', { id: id + 'rinkc', clipPathUnits: 'userSpaceOnUse' }, defs));

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
      return { g: g, tx: tx };
    }
    function badge(parent, r) {
      mk('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, parent);
      var t = mk('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, parent);
      t.textContent = r.label;
    }

    var rowsG = [], chipsG = [];
    var cardLayer = mk('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = mk('g', {}, cardLayer);
      mk('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      mk('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      badge(g, r);
      rowsG.push(g);
    });

    // ---- the rink (glazes in from Nate's chip) ----
    var rinkWrap = mk('g', {}, cam);
    var rinkG = mk('g', { 'clip-path': 'url(#' + id + 'frost)' }, rinkWrap);
    var rw = R.x1 - R.x0, rh = R.y1 - R.y0, rmy = (R.y0 + R.y1) / 2;
    mk('rect', { x: R.x0, y: R.y0 + 4, width: rw, height: rh, rx: 16, fill: INK, opacity: 0.22 }, rinkG);
    mk('rect', { x: R.x0, y: R.y0, width: rw, height: rh, rx: 16, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.6 }, rinkG);
    mk('rect', { x: R.x0 + 4, y: R.y0 + 4, width: rw - 8, height: rh - 8, rx: 12, fill: 'url(#' + id + 'ice)', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 1.2 }, rinkG);
    var mark = mk('g', { 'clip-path': 'url(#' + id + 'rinkc)' }, rinkG);
    mk('rect', { x: W / 2 - 1.6, y: R.y0, width: 3.2, height: rh, fill: RED, opacity: 0.55 }, mark);
    mk('rect', { x: W / 2 - 74, y: R.y0, width: 3.2, height: rh, fill: BLUE, opacity: 0.45 }, mark);
    mk('rect', { x: W / 2 + 71, y: R.y0, width: 3.2, height: rh, fill: BLUE, opacity: 0.45 }, mark);
    mk('circle', { cx: W / 2, cy: f1(rmy - 6), r: 19, fill: 'none', stroke: BLUE, 'stroke-opacity': 0.35, 'stroke-width': 1.6 }, mark);
    mk('circle', { cx: W / 2, cy: f1(rmy - 6), r: 2.6, fill: BLUE, opacity: 0.5 }, mark);
    // skate scratches
    var scr = '';
    for (var k = 0; k < 9; k++) {
      var sx0 = R.x0 + 30 + hash(k) * (rw - 70), sy0 = R.y0 + 10 + hash(k + 20) * (rh - 22), ln = 14 + hash(k + 40) * 22;
      scr += 'M' + P2(sx0, sy0) + 'q' + P2(ln / 2, -3 + hash(k + 60) * 6) + ' ' + P2(ln, 0);
    }
    mk('path', { d: scr, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.9 }, mark);
    // fresh sheet (Nick's colour) along the lane
    var sheet = mk('g', {}, mark);
    var sheetR = mk('rect', { x: R.x0 + 3, y: f1(gnd - 9), width: 0, height: 16, fill: DC }, sheet);
    var sheetHi = mk('rect', { x: R.x0 + 3, y: f1(gnd - 7.2), width: 0, height: 2.6, rx: 1.3, fill: '#FFFFFF', opacity: 0.6 }, sheet);
    var sheetStreak = mk('path', { d: '', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.45 }, sheet);
    mk('rect', { x: R.x0 + 3, y: f1(gnd + 5), width: rw - 6, height: 2, fill: INK, opacity: 0.0 }, sheet);
    var rinkBadge = mk('g', {}, rinkG); badge(rinkBadge, L.trow);
    var frostRim = mk('path', { d: '', fill: '#FFFFFF', opacity: 0, 'clip-path': 'url(#' + id + 'rinkc)' }, rinkWrap);
    var ghost = mk('circle', { cx: T.x, cy: T.y, r: CR - 0.5, fill: INK, 'fill-opacity': 0.06, stroke: INK, 'stroke-opacity': 0.4, 'stroke-width': 1.6, 'stroke-dasharray': '4 3.5', opacity: 0 }, cam);

    // other chips
    var chipLayer = mk('g', {}, cam);
    L.others.forEach(function (c) {
      var wrap = mk('g', {}, chipLayer);
      var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
      var cg = makeChip(wrap, c.color, c.ini).g;
      chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
    });

    // ---- Nate's chip (the skater) ----
    var skW = mk('g', {}, cam);
    var vShadowC = mk('circle', { r: CR, fill: INK, opacity: 0.28 }, skW);
    var vShadowE = mk('ellipse', { rx: 18, ry: 3.5, fill: INK, opacity: 0 }, skW);
    var limbs = mk('g', {}, skW);
    function limb() {
      var g = mk('g', {}, limbs);
      return {
        g: g,
        ink: mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
      };
    }
    var legs = [limb(), limb()], arms = [limb(), limb()];
    var skates = [0, 1].map(function () {
      var g = mk('g', {}, limbs);
      mk('path', { d: 'M-6.5 4.2L7.5 4.2Q9.5 4.2 9.5 2.6', fill: 'none', stroke: STEEL, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
      mk('path', { d: 'M-6.5 4.2L7.5 4.2Q9.5 4.2 9.5 2.6', fill: 'none', stroke: INK, 'stroke-width': 0.9, 'stroke-linecap': 'round', opacity: 0.7 }, g);
      mk('path', { d: 'M-4.5 -3.6L1.5 -3.6L2.5 -0.6L6.5 0.2Q7.6 0.6 7.4 2.4L-5.5 2.4Q-6 -1 -4.5 -3.6Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
      return g;
    });
    var hands = [0, 1].map(function () { return mk('circle', { r: 2.8, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6 }, limbs); });
    var faceV = mk('g', {}, skW);
    var cV = makeChip(faceV, VC, T.ini);
    var dWrap = mk('g', { 'clip-path': 'url(#' + id + 'sheet)' }, skW);
    var faceD = mk('g', {}, dWrap);
    var cD = makeChip(faceD, DC, L.ini(opts.dealer));
    var over = mk('g', {}, skW);
    var sheenG = mk('g', { 'clip-path': 'url(#' + id + 'disc)' }, over);
    var sheen = mk('path', { d: 'M-8 -30L4 -30L-6 30L-18 30Z', fill: '#FFFFFF', opacity: 0 }, sheenG);
    var eyesG = mk('g', {}, over);
    var eyes = [-1, 1].map(function (sd) {
      var g = mk('g', { transform: 'translate(' + (sd * 6.4) + ',-11.3)' }, eyesG);
      return {
        g: g,
        white: mk('ellipse', { rx: 3.6, ry: 3.9, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.4 }, g),
        pup: mk('circle', { r: 1.9, fill: INK }, g),
        lid: mk('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g),
        arc: mk('path', { d: 'M-3.4 1.2Q0 -3.4 3.4 1.2', fill: 'none', stroke: INK, 'stroke-width': 2.1, 'stroke-linecap': 'round' }, g)
      };
    });
    var twinkle = mk('path', { d: '', fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round', opacity: 0 }, cam);
    var swirl = mk('path', { d: '', fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var flail = mk('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var spray = mk('path', { d: '', fill: '#FFFFFF', stroke: INK, 'stroke-width': 0.8, opacity: 0 }, cam);

    // ---- the resurfacing machine (side-on, faces right) ----
    var mWrap = mk('g', {}, cam);
    var mShadow = mk('ellipse', { cx: 0, cy: 0, rx: 52, ry: 4.5, fill: INK, opacity: 0.22 }, mWrap);
    var puffs = [];
    for (var pi = 0; pi < 7; pi++) puffs.push(mk('circle', { r: 3, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.3, opacity: 0 }, mWrap));
    var mBody = mk('g', {}, mWrap);
    // conditioner (rear squeegee) laying Nick's colour
    mk('path', { d: 'M-72 -2L-56 -2L-56 -15L-70 -15Q-73 -15 -73 -12Z', fill: DARK, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, mBody);
    mk('rect', { x: -75, y: -4, width: 21, height: 5, rx: 2, fill: DC, stroke: INK, 'stroke-width': 1.6 }, mBody);
    // exhaust pipe
    mk('path', { d: 'M-54 -36L-54 -50L-49 -50L-49 -36', fill: DARK, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, mBody);
    // main body (boxy)
    mk('path', { d: 'M-62 -6L-62 -34Q-62 -38 -58 -38L-16 -38Q-10 -38 -7 -32L-1 -18Q0 -15 0 -12L0 -9Q0 -6 -3 -6Z', fill: BODYC, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, mBody);
    mk('path', { d: 'M-62 -21L-3.5 -21L-1.6 -16L-62 -16Z', fill: DC, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, mBody);
    // hopper lid + cab rail
    mk('path', { d: 'M-46 -38L-46 -47Q-46 -49 -44 -49L-24 -49Q-22 -49 -22 -47L-22 -38', fill: '#DDE6EC', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, mBody);
    mk('path', { d: 'M-42 -44L-26 -44', stroke: INK, 'stroke-width': 1.2, opacity: 0.5 }, mBody);
    mk('path', { d: 'M-58 -32L-36 -32', stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.8 }, mBody);
    // headlight eye (oblivious)
    var mEyeG = mk('g', { transform: 'translate(-9,-27)' }, mBody);
    mk('circle', { r: 5.6, fill: '#FFF6C8', stroke: INK, 'stroke-width': 1.8 }, mEyeG);
    var mPup = mk('circle', { cx: 1.4, r: 2.2, fill: INK }, mEyeG);
    var mLid = mk('path', { d: '', fill: '#DDE6EC', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, mEyeG);
    // wheels
    var wheels = [-14, -50].map(function (wx) {
      var g = mk('g', {}, mBody);
      mk('circle', { r: 7.5, fill: DARK, stroke: INK, 'stroke-width': 2 }, g);
      mk('circle', { r: 3, fill: STEEL, stroke: INK, 'stroke-width': 1.2 }, g);
      var sp = mk('path', { d: 'M-5 0L5 0M0 -5L0 5', stroke: INK, 'stroke-width': 1.1, opacity: 0.6 }, g);
      return { g: g, x: wx, sp: sp };
    });
    var bonk = mk('path', { d: '', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var ripple = mk('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, rinkWrap: rinkWrap, frostClipP: frostClipP, frostRim: frostRim,
      sheetClipR: sheetClipR, sheetR: sheetR, sheetHi: sheetHi, sheetStreak: sheetStreak, ghost: ghost,
      vShadowC: vShadowC, vShadowE: vShadowE, limbs: limbs, legs: legs, arms: arms, skates: skates, hands: hands,
      faceV: faceV, faceD: faceD, cV: cV, cD: cD, over: over, sheen: sheen, eyesG: eyesG, eyes: eyes,
      twinkle: twinkle, swirl: swirl, flail: flail, spray: spray, mWrap: mWrap, mShadow: mShadow, mBody: mBody, puffs: puffs, mPup: mPup, mLid: mLid,
      wheels: wheels, bonk: bonk, ripple: ripple, dust: dust, line: line
    };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = L.target, R = L.rink, gnd = L.gnd;

    // camera: gentle push-in, never cropping the row
    var zk = eio(seg(t, 500, 1200)) * (1 - eio(seg(t, 6950, 7550)));
    var Z = 1 + 0.12 * zk;
    var vh = H / (2 * Z);
    var ccy = clamp(lerp(H / 2, (L.trow.mid + gnd) / 2, zk), vh, H - vh);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 1150, 1450)) * (1 - eio(seg(t, 7050, 7450)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.45 * dim).toFixed(3));
    });

    // rink glaze in / thaw out
    var gp = seg(t, 650, 1250);
    var maxR = 300, fr = gp >= 1 ? 1000 : maxR * eio(gp);
    S.frostClipP.setAttribute('d', fr > 0.3 ? circleD(T.x, T.y, fr) : '');
    S.frostRim.setAttribute('d', gp > 0 && gp < 1 ? circleD(T.x, T.y, fr) + circleD(T.x, T.y, Math.max(0.1, fr - 5)) : '');
    S.frostRim.setAttribute('opacity', gp > 0 && gp < 1 ? f1(Math.sin(Math.PI * gp) * 80) / 100 : 0);
    S.frostRim.setAttribute('fill-rule', 'evenodd');
    
    var thaw = eio(seg(t, 7100, 7500));
    S.rinkWrap.setAttribute('opacity', f3(1 - thaw));

    // machine
    var mx = machineX(t), rear = mx - ML;
    var mOn = t > 2700 && rear < W + 60;
    S.mWrap.setAttribute('opacity', mOn ? 1 : 0);
    var bump = 0;
    S.wheels.forEach(function (w) {
      var wxw = mx + w.x * MS, u = (wxw - XC) / 34;
      if (t > T_HIT && Math.abs(u) < 1) bump += 3.2 * Math.pow(Math.cos(u * Math.PI / 2), 2);
    });
    var bob = 0.8 * Math.abs(Math.sin(t * 0.024));
    S.mBody.setAttribute('transform', 'translate(' + f1(mx) + ',' + f1(gnd - bump - bob) + ') scale(' + MS + ')');
    S.mShadow.setAttribute('cx', f1(mx - 36 * MS)); S.mShadow.setAttribute('cy', f1(gnd + 1.5));
    S.wheels.forEach(function (w) {
      w.g.setAttribute('transform', 'translate(' + w.x + ',-6.5) rotate(' + f1((mx * 7.6) % 360) + ')');
    });
    // headlight: sleepy, jolts open at the bump, then back to oblivious
    var jolt = clamp(seg(t, 4040, 4090) * (1 - seg(t, 4350, 4600)));
    var lidY = lerp(-0.6, -5, jolt);
    S.mLid.setAttribute('d', 'M-6 ' + f1(lidY) + 'L6 ' + f1(lidY) + 'A6 6 0 0 0 -6 ' + f1(lidY) + 'Z');
    S.mPup.setAttribute('cx', f1(1.6 - 1.2 * jolt)); S.mPup.setAttribute('cy', f1(1.2 - 1.2 * jolt));
    // exhaust puffs: short-lived, rising, only while the machine is about
    S.puffs.forEach(function (p, i) {
      var period = 240, n0 = Math.floor((t - 2900) / period);
      var born = 2900 + (n0 - i) * period, age = t - born, life = period * 3;
      if (t < 2900 || age < 0 || age > life || i > 2) { p.setAttribute('opacity', 0); return; }
      var bx = machineX(born) - 51.5 * MS, k = age / life;
      p.setAttribute('cx', f1(bx - 18 * k)); p.setAttribute('cy', f1(gnd - 52 * MS - 4 - 22 * eo(k)));
      p.setAttribute('r', f1(2.5 + 4.5 * eo(k)));
      p.setAttribute('opacity', f1((1 - k) * 90) / 100);
    });
    // splat ticks
    var bk = seg(t, 4000, 4260);
    if (bk > 0 && bk < 1) {
      var bd = '', r0 = 30 + 10 * eoC(bk), r1 = r0 + 7 * (1 - bk), cx = XC + 6, cy = gnd - 64;
      [-2.6, -2.0, -1.4, -0.8].forEach(function (a) {
        bd += 'M' + P2(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6) + 'L' + P2(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6);
      });
      S.bonk.setAttribute('d', bd); S.bonk.setAttribute('opacity', f1((1 - bk) * 100) / 100);
    } else S.bonk.setAttribute('opacity', 0);

    // fresh sheet behind the machine
    var sx1 = clamp(rear - 1, R.x0 + 3, R.x1 - 3), sw = Math.max(0, sx1 - (R.x0 + 3));
    S.sheetR.setAttribute('width', f1(sw));
    S.sheetHi.setAttribute('width', f1(Math.max(0, sw - 6)));
    var st = '';
    for (var k = 0; k < 6; k++) {
      var xx = R.x0 + 20 + k * 58 + 10 * hash(k + 3);
      if (xx + 14 < sx1) st += 'M' + P2(xx, gnd + 1.5) + 'L' + P2(xx + 14, gnd + 1.5);
    }
    S.sheetStreak.setAttribute('d', st);
    S.sheetClipR.setAttribute('width', f1(Math.max(0, rear + 1 + 500)));

    // ---- the skater ----
    var s = skater(L, t);
    var pop = chipPop(T);
    if (t < 1250) { s.sx = s.sy = pop; }
    var tilt = s.rot;
    var ftr = 'translate(' + f1(s.x) + ',' + f1(s.y) + ') rotate(' + f1(tilt) + ') scale(' + f3(s.sx * s.spin * s.puff) + ',' + f3(s.sy * s.puff) + ')';
    if (Math.abs(s.spin) < 0.08) ftr = 'translate(' + f1(s.x) + ',' + f1(s.y) + ') rotate(' + f1(tilt) + ') scale(' + f3(0.08 * s.sx * (s.spin < 0 ? -1 : 1) * s.puff) + ',' + f3(s.sy * s.puff) + ')';
    S.faceV.setAttribute('transform', ftr); S.faceD.setAttribute('transform', ftr); S.over.setAttribute('transform', ftr);
    var front = s.spin > 0 ? 1 : 0;
    S.cV.tx.setAttribute('opacity', front); S.cD.tx.setAttribute('opacity', front);
    // shadows: lying circle vs standing ground ellipse
    var standV = clamp(s.stand);
    var lyingAmt = (t < 1340 || t > 7000) ? 1 - standV : 0;
    S.vShadowC.setAttribute('cx', f1(s.x + 1.5)); S.vShadowC.setAttribute('cy', f1(s.y + 3.5));
    S.vShadowC.setAttribute('r', f1(CR * Math.min(1.04, s.sx)));
    S.vShadowC.setAttribute('opacity', f3(0.28 * lyingAmt));
    var onIce = t >= 1340 && t < 7000;
    var gy = (t < 1500) ? T.y + CR + LEG : (t < 1750 ? lerp(T.y + CR + LEG, gnd, eio(seg(t, 1500, 1750))) : gnd);
    if (t > 6700) gy = s.y + CR + LEG;
    var hAbove = Math.max(0, gy - (s.y + (CR * s.sy) + LEG * standV));
    S.vShadowE.setAttribute('cx', f1(s.x)); S.vShadowE.setAttribute('cy', f1(gy + 1));
    S.vShadowE.setAttribute('rx', f1(Math.max(6, 19 * s.sx * Math.abs(s.spin) - hAbove * 0.3)));
    S.vShadowE.setAttribute('opacity', onIce ? f3(0.22 * (1 - lyingAmt)) : 0);

    // limbs (world, rotate with body)
    S.limbs.setAttribute('transform', 'translate(' + f1(s.x) + ',' + f1(s.y) + ') rotate(' + f1(tilt) + ')');
    var syS = s.sy * s.puff, sxS = s.sx * s.puff;
    [s.la, s.lb].forEach(function (a, i) {
      var Lg = S.legs[i], sk = S.skates[i];
      if (standV < 0.02) { Lg.ink.setAttribute('d', ''); sk.setAttribute('opacity', 0); return; }
      var side = i === 0 ? -1 : 1;
      var hx = side * 6.5 * (1 + 0.5 * (s.legK - 1)) * Math.abs(s.spin) * sxS, hy = CR * syS - 3;
      var ar = a * Math.PI / 180, len = 9.5 * standV * s.legK;
      var fx = hx + Math.sin(ar) * len, fy = hy + Math.cos(ar) * len;
      var kx = (hx + fx) / 2 + side * 1.5, ky = (hy + fy) / 2;
      Lg.ink.setAttribute('d', 'M' + P2(hx, hy) + 'Q' + P2(kx, ky) + ' ' + P2(fx, fy));
      sk.setAttribute('opacity', f3(clamp(standV * 1.4)));
      var dir = s.spin < 0 ? -1 : 1;
      sk.setAttribute('transform', 'translate(' + P2(fx, fy + 0.5) + ') rotate(' + f1(-a) + ') scale(' + f3(dir * clamp(standV * 1.2, 0, 1)) + ',' + f3(clamp(standV * 1.2, 0, 1)) + ')');
    });
    var armsV = clamp(s.arms);
    [s.aa, s.ab].forEach(function (a, i) {
      var A = S.arms[i], side = i === 0 ? -1 : 1;
      if (armsV < 0.02 || Math.abs(s.spin) < 0.25) { A.ink.setAttribute('d', ''); S.hands[i].setAttribute('opacity', 0); return; }
      var shx = side * (CR - 2) * Math.abs(s.spin) * sxS, shy = 2 * syS;
      var ar = a * Math.PI / 180, len = 12 * armsV;
      var hx = shx + side * Math.sin(ar) * len, hy = shy + Math.cos(ar) * len;
      var ex = (shx + hx) / 2 + side * 1.2, ey = (shy + hy) / 2 + 1.5;
      A.ink.setAttribute('d', 'M' + P2(shx, shy) + 'Q' + P2(ex, ey) + ' ' + P2(hx, hy));
      S.hands[i].setAttribute('cx', f1(hx)); S.hands[i].setAttribute('cy', f1(hy)); S.hands[i].setAttribute('opacity', 1);
    });

    // eyes
    var eyesV = front ? clamp(s.eyes) : 0;
    S.eyesG.setAttribute('opacity', f3(eyesV));
    S.eyes.forEach(function (E) {
      var w = s.wide;
      var happy = s.happy > 0.5;
      E.white.setAttribute('opacity', happy ? 0 : 1); E.pup.setAttribute('opacity', happy ? 0 : 1); E.arc.setAttribute('opacity', happy ? 1 : 0);
      E.lid.setAttribute('opacity', happy ? 0 : 1);
      var ry = 3.9 * w * (1 - 0.7 * s.lid), rx = 3.6 * w;
      E.white.setAttribute('rx', f1(rx)); E.white.setAttribute('ry', f1(ry)); E.white.setAttribute('cy', f1(3.9 * w - ry));
      var m = Math.hypot(s.lx, s.ly), lx = s.lx, ly = s.ly; if (m > 1) { lx /= m; ly /= m; }
      E.pup.setAttribute('cx', f1(lx * 1.6 * w)); E.pup.setAttribute('cy', f1(3.9 * w - ry + ly * 1.4 * Math.min(1, ry / 3)));
      E.pup.setAttribute('r', f1(Math.min(1.9 * w, ry * 0.75)));
      var ly0 = 3.9 * w - 2 * ry;
      E.lid.setAttribute('d', s.lid > 0.1 ? 'M' + P2(-rx - 0.6, ly0 + ry * 0.92) + 'L' + P2(rx + 0.6, ly0 + ry * 0.92) : '');
    });

    // gloss sheen sweep after the pop
    var shp = seg(t, 5170, 5480);
    S.sheen.setAttribute('opacity', shp > 0 && shp < 1 ? 0.55 : 0);
    S.sheen.setAttribute('transform', 'translate(' + f1(lerp(-34, 40, eio(shp))) + ',0)');

    // twinkles: on the fresh finish (5450-5850), and after the plonk (7150-7500)
    var tw = '', twO = 0;
    function tws(base, x, y, list) {
      list.forEach(function (q, i) {
        var a = seg(t, base + q[3], base + q[3] + 300);
        if (a > 0 && a < 1) { tw += star(x + q[0], y + q[1], q[2] * Math.sin(Math.PI * a)); twO = 1; }
      });
    }
    tws(5420, s.x, s.y, [[-24, -20, 6, 0], [25, -14, 5, 90], [20, 18, 4.5, 180], [-26, 10, 4, 240]]);
    tws(7120, T.x, T.y, [[24, -20, 5, 0], [-24, -16, 4, 110]]);
    S.twinkle.setAttribute('d', tw); S.twinkle.setAttribute('opacity', twO);

    // twirl swirl lines
    var swp = seg(t, 3520, 3920);
    if (swp > 0 && swp < 1) {
      var sd = '', a0 = swp * 14;
      for (var q = 0; q < 2; q++) {
        var aa = a0 + q * Math.PI, rr = 30, cxw = XC, cyw = s.y + 6;
        sd += 'M' + P2(cxw + Math.cos(aa) * rr, cyw + Math.sin(aa) * rr * 0.35) + 'A' + rr + ' ' + f1(rr * 0.35) + ' 0 0 1 ' + P2(cxw + Math.cos(aa + 1.1) * rr, cyw + Math.sin(aa + 1.1) * rr * 0.35);
      }
      S.swirl.setAttribute('d', sd); S.swirl.setAttribute('opacity', f1(Math.sin(Math.PI * swp) * 90) / 100);
      S.swirl.setAttribute('stroke', '#FFFFFF');
    } else S.swirl.setAttribute('opacity', 0);

    // scramble arcs round the flailing legs
    var fl = seg(t, 6180, 6640);
    if (fl > 0 && fl < 1) {
      var fd = '', fcx = s.x, fcy = s.y + CR + 6;
      [[-1, 0], [1, 1.3]].forEach(function (q) {
        var a0 = Math.PI / 2 + q[0] * (0.5 + 0.5 * Math.sin(t * 0.05 + q[1])), r = 19;
        fd += 'M' + P2(fcx + Math.cos(a0) * r, fcy + Math.sin(a0) * r * 0.6) + 'A' + r + ' ' + f1(r * 0.6) + ' 0 0 ' + (q[0] > 0 ? 0 : 1) + ' ' + P2(fcx + Math.cos(a0 + q[0] * -0.9) * r, fcy + Math.sin(a0 + q[0] * -0.9) * r * 0.6);
      });
      S.flail.setAttribute('d', fd); S.flail.setAttribute('opacity', f1(Math.sin(Math.PI * fl) * 60) / 100);
    } else S.flail.setAttribute('opacity', 0);

    // ice spray: hockey stop (2300-2650) and the slip (6150-6650)
    var spd = '', spO = 0;
    function sprayAt(t0, dur, ox, dir, n) {
      var p = seg(t, t0, t0 + dur);
      if (p <= 0 || p >= 1) return;
      for (var i = 0; i < n; i++) {
        var a = -0.25 - hash(i + t0) * 1.1, sp = 18 + 30 * hash(i * 3 + t0);
        var x = ox + dir * Math.cos(a) * sp * eo(p), y = gnd - 2 + Math.sin(a) * sp * 0.9 * eo(p) + 26 * p * p;
        spd += circleD(x, y, (1.3 + 1.3 * hash(i + 9)) * (1 - p * 0.5));
      }
      spO = Math.max(spO, 1 - ei(p));
    }
    var xR = clamp(Math.max(T.x + 70, 296), 0, 330);
    sprayAt(2300, 380, xR + 8, 1, 10);
    sprayAt(6200, 300, XC + 60, -1, 6);
    sprayAt(6420, 300, XC + 64, 1, 6);
    S.spray.setAttribute('d', spd); S.spray.setAttribute('opacity', f3(spO));

    // ghost of the spot while the chip is away
    S.ghost.setAttribute('opacity', f3(eio(seg(t, 1500, 1700)) * (1 - seg(t, 7020, 7090)) * (1 - thaw)));

    // plonk ripple + dust ticks
    var rp = seg(t, 7080, 7580);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 7080, 7360);
    if (dp > 0 && dp < 1) {
      var dd = '', r0d = 27 + 9 * eoC(dp), r1d = r0d + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + P2(T.x + Math.cos(a) * r0d, T.y + Math.sin(a) * r0d) + 'L' + P2(T.x + Math.cos(a) * r1d, T.y + Math.sin(a) * r1d);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 80) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // final line
    var lp = seg(t, 7450, 7900);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2icerink;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2icerink = S;
    return S;
  }

  window.CCSteal2_icerink = {
    title: 'Between Periods',
    blurb: 'Nate’s chip shows off on a pop-up ice rink, skating backwards right into the resurfacer’s path - it gets flattened, comes up freshly glazed in Nick’s colour, then slips on its own new ice and skids perfectly back into its spot.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2icerink = S;
      var token = {};
      root.__cc2icerinkToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2icerinkToken !== token) { resolve(); return; }
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
