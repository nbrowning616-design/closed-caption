/* Closed Caption steal film: cottoncandy (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE FAIR (cotton candy)
 *
 * Everyone knows what happens at the candy-floss stall: a stick goes round the bowl and comes out
 * wearing a big fluffy cloud of whatever colour the machine is spinning.
 * Top-down felt table; the little candy-floss machine is a front-view toy that pops out of the felt.
 *
 * Storyboard (ms)
 *    0- 650  Table deals in: rows drop in, chips pop on.
 *  600-1000  Camera eases in a touch (whole rows stay in frame). Others dim; Nate's chip hops nervously.
 *  900-1450  A hole irises open beside the chip; a candy-floss machine (steel bowl, striped awning in
 *            Nick's colour) pops up out of the felt, awning flaps bounce.
 * 1380-1700  Its eyes blink open, it looks at the chip and smiles. The spinner whirs up; a ring of floss
 *            in Nick's colour forms in the bowl and wisps start to rise and drift.
 * 1700-2150  A little arm unfolds from the awning pole holding a paper cone; it slides the cone in under
 *            Nate's chip (chip leans away, shivers).
 * 2150-2300  Tink - the chip is stuck to the cone (startled hop).
 * 2300-2750  Swung in an arc, flipped upside down and dipped into the bowl.
 * 2750-4350  TWIRL: round and round the bowl (4 turns, ease in/out). Wisps spiral in; a fluffy cloud in
 *            Nick's colour gathers on the chip and grows past the rim. Machine bounces, eyes squeezed happy.
 * 4350-4800  Little dip, then the cone lifts out and cartwheels upright: an enormous puffball on a stick.
 * 4800-5150  Hold: the puffball bobs, the machine goes "ooh" at it, then at us.
 * 5150-5600  Carried over and planted on Nate's spot - soft plop, the cloud squashes and wobbles.
 * 5600-5900  The cone slides out from underneath and telescopes away into the hand.
 * 5900-6480  Pat... PAT: the hand presses the cloud down twice; puffs escape out the sides; the cloud
 *            compresses, bumps smoothing out, into a smooth coat - Nick's colour, his initial. Hold.
 * 6400-6900  Reveal: ring flash + ticks, chip settles in its exact spot. Hand lifts, arm retracts.
 * 6900-7650  Machine glances at the chip, then at us; one last little puff from the bowl, a hop, and it
 *            sinks into the felt. Hole closes. Camera eases back. Others un-dim.
 * 7680-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var BASE = '#FBF3E4', STEEL = '#C9D3D9', STEEL_D = '#7C8992', STEEL_L = '#E4EAEE', HOLE = '#143A2E';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var MS = 1.1, STICK = 40, BOWL_Y = -62, NP = 9;
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
  function hex(c) { // rgb(...) or #hex -> #hex (so it can be mixed again)
    if (c.charAt(0) === '#') return c;
    var m = c.match(/\d+/g); return '#' + m.slice(0, 3).map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('');
  }
  function arc2(a, b, h, p) { return [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - h * 4 * p * (1 - p)]; }
  function dirB(bDeg) { var b = bDeg * Math.PI / 180; return [Math.sin(b), Math.cos(b)]; }

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
  function twirlTheta(t) { var u = seg(t, 2750, 4350); return 2 * Math.PI * 4 * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI)); }
  function machinePose(t, S) {
    var sx = S.sx, m = { dx: 0, dy: 0, rot: 0, sqy: 1 };
    if (t < 1380) { var p = seg(t, 1000, 1380); m.dy = 175 * (1 - backOut(p, 1.4)); m.sqy += 0.1 * Math.sin(Math.PI * p); }
    m.sqy += spring(t - 1380, -0.1, 3.4, 130);
    m.rot += spring(t - 1380, 4 * sx, 2.1, 230) + spring(t - 1460, -1.6 * sx, 3, 150);
    // spinner hum
    var hum = seg(t, 1500, 1700) * (1 - seg(t, 6950, 7150));
    m.rot += 0.6 * hum * Math.sin(t * 0.11);
    // happy bounce while twirling, in time with the orbit
    var tw = seg(t, 2750, 2950) * (1 - seg(t, 4150, 4350));
    var th = twirlTheta(t);
    m.dy -= 3 * tw * Math.abs(Math.sin(th));
    m.sqy += 0.035 * tw * Math.cos(2 * th);
    m.rot += 1.6 * tw * Math.sin(th) * sx;
    // proud stretch at the puffball reveal
    m.sqy += 0.07 * Math.sin(Math.PI * seg(t, 4450, 4850));
    m.sqy += spring(t - 4850, -0.04, 3, 140);
    // flinch at the plop, and the pats
    m.sqy += spring(t - 5600, -0.03, 4, 100) + spring(t - 6340, -0.04, 4, 100);
    // last puff hop, then down the hole
    var hp = seg(t, 6990, 7130);
    m.dy -= 7 * Math.sin(Math.PI * hp); m.sqy += 0.07 * Math.sin(Math.PI * hp);
    if (t >= 7090) m.dy += 185 * ei(seg(t, 7090, 7470));
    m.rot += 2 * Math.sin(t * 0.07) * seg(t, 7100, 7200);
    return m;
  }
  function holeK(t) {
    return kf([[800, 0], [1060, 1, function (x) { return backOut(x, 1.6); }], [1480, 1], [1760, 0], [6890, 0], [7060, 1, function (x) { return backOut(x, 1.6); }], [7440, 1], [7650, 0]], t);
  }
  function spinSpeed(t) { return 0.03 * seg(t, 1500, 1750) * (1 - seg(t, 6950, 7200)); }
  function spinAng(t) {
    var a = 0, end = Math.min(t, 7200);
    for (var s = 1500; s < end; s += 10) a += spinSpeed(s + 5) * Math.min(10, end - s);
    return a;
  }
  // machine local -> world
  function toWorld(S, m, px, py) {
    var a = m.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), sqx = 2 - m.sqy;
    var x = px * sqx * MS, y = py * m.sqy * MS;
    return [S.MX + m.dx + x * c - y * s, S.baseY + m.dy + x * s + y * c];
  }
  function bowlC(S, t) { return toWorld(S, machinePose(t, S), 0, BOWL_Y); }
  function shoulder(S, t) { return toWorld(S, machinePose(t, S), -S.sx * 37, -102); }
  function orbitPos(S, t) {
    var th = twirlTheta(t), B = bowlC(S, t);
    return [B[0] + S.sx * 16 * Math.sin(th), B[1] + 3 * Math.cos(th) - 2];
  }
  function holdPt(S) { return [lerp(S.MX, S.T.x, 0.42), S.T.y - 44]; }

  // cloud compress keys (pat ... PAT)
  var SQ_KEYS = [[5950, 1], [6060, 0.7, eoC], [6150, 0.93], [6250, 0.93], [6345, 0.64, eoC], [6460, 1, function (x) { return backOut(x, 2); }]];
  var R_KEYS = [[5950, 54], [6060, 43, eoC], [6250, 43], [6360, CR, eoC]];
  var SM_KEYS = [[5950, 0], [6060, 0.28, eoC], [6250, 0.28], [6370, 1, eoC]];
  var K_KEYS = [[5950, 0], [6060, 0.35, eoC], [6250, 0.35], [6370, 1, eoC]];

  // the chip + cone + cloud actor, as a pure function of t
  function actor(S, t) {
    var T = S.T, sx = S.sx;
    var A = { P: [T.x, T.y], b: sx * 78, d: 0, Ls: 0, hand: null, R: 0, sm: 0, k: 0, sq: 1, cOn: 0, phi: 0, crot: 0, dealer: 0,
      layer: 'top', vs: 1, vsx: 1, vsy: 1, sh: 1, shR: CR, shLift: 0 };
    var grow = eio(seg(t, 2850, 4300));
    if (t < 1700) {
      var nh = seg(t, 650, 980);
      A.P[1] -= 5 * Math.sin(Math.PI * seg(t, 650, 820));
      A.P[0] += 1.8 * Math.sin((t - 650) * 0.17) * (nh > 0 && nh < 1 ? 1 - nh : 0);
      A.vs = 1 + 0.08 * Math.sin(Math.PI * seg(t, 650, 820));
      // looks up at the machine popping out: little lean away
      var la = Math.sin(Math.PI * seg(t, 1250, 1650));
      A.P[0] -= sx * 2 * la; A.vsx = 1 - 0.05 * la;
    } else if (t < 2150) {
      var sh2 = seg(t, 1950, 2150);
      A.P[0] -= sx * 2.5 * eio(seg(t, 1700, 1900)) * (1 - sh2) - 1.2 * Math.sin(t * 0.2) * Math.sin(Math.PI * sh2) * 0;
      A.P[0] += 1.4 * Math.sin(t * 0.21) * Math.sin(Math.PI * sh2);
      A.Ls = eo(seg(t, 1700, 1860));
      var dir = dirB(A.b);
      var reach = [A.P[0] + (STICK + 26) * dir[0], A.P[1] + (STICK + 26) * dir[1]];
      if (t < 1950) {
        var u = eio(seg(t, 1700, 1950)), S0 = shoulder(S, t);
        var h = arc2(S0, reach, 14, u);
        A.hand = h; A.d = 26;
        // d consistent with the hand location so the stick reads as held
        A.d = Math.hypot(h[0] - A.P[0], h[1] - A.P[1]) - STICK;
        A.b = Math.atan2(h[0] - A.P[0], h[1] - A.P[1]) * 180 / Math.PI;
      } else {
        A.d = 26 * (1 - eoC(sh2));
        A.hand = [A.P[0] + (STICK + A.d) * dir[0], A.P[1] + (STICK + A.d) * dir[1]];
      }
    } else if (t < 2300) {
      var hu = seg(t, 2150, 2300);
      A.P[1] -= 8 * Math.sin(Math.PI * hu);
      A.vsx = 1 + 0.12 * Math.sin(Math.PI * seg(t, 2150, 2210)); A.vsy = 2 - A.vsx;
      A.Ls = 1;
      A.sh = 1; A.shLift = 8 * Math.sin(Math.PI * hu);
    } else if (t < 2750) {
      var du = seg(t, 2300, 2750), q = eio(du);
      A.P = arc2([T.x, T.y], orbitPos(S, 2750), 52, q);
      A.b = sx * lerp(78, 180, eio(seg(du, 0.05, 0.85)));
      A.Ls = 1;
      A.crot = -sx * 40 * Math.sin(Math.PI * du);
      A.layer = du > 0.7 ? 'mid' : 'top';
      A.sh = 1 - seg(du, 0, 0.22); A.shLift = 20 * du;
    } else if (t < 4350) {
      var th = twirlTheta(t);
      A.P = orbitPos(S, t);
      A.b = sx * (180 + 12 * Math.sin(th));
      A.Ls = 1; A.layer = 'mid'; A.sh = 0;
      A.crot = -sx * th * 180 / Math.PI * 0.5;
      A.cOn = seg(t, 2790, 2950);
      A.R = lerp(13, 47, grow); A.phi = th * 0.55;
      A.dealer = t >= 3700 ? 1 : 0;
    } else {
      A.Ls = 1; A.dealer = 1; A.cOn = 1; A.phi = 8 * Math.PI * 0.55 + (t - 4350) * 0.0005;
      var P0 = orbitPos(S, 4350), HP = holdPt(S);
      if (t < 4450) {
        A.P = [P0[0], P0[1] + 5 * Math.sin(Math.PI * 0.5 * seg(t, 4350, 4450))];
        A.b = sx * 180; A.layer = 'mid'; A.R = 47; A.sh = 0;
      } else if (t < 4800) {
        var lu = seg(t, 4450, 4800);
        var Pd = [P0[0], P0[1] + 5];
        A.P = arc2(Pd, HP, 34, eio(lu));
        A.b = sx * (180 + 180 * backOut(seg(lu, 0.05, 1), 1.3));
        A.layer = lu > 0.22 ? 'top' : 'mid';
        A.R = 47 + 7 * backOut(lu, 2.2);
        A.sq = 1 + 0.08 * Math.sin(Math.PI * lu);
        A.sh = 0;
      } else if (t < 5150) {
        A.P = [HP[0], HP[1] - 3 * Math.sin(Math.PI * 2 * seg(t, 4800, 5150))];
        A.b = sx * 360 + 4 * sx * Math.sin(Math.PI * 2 * seg(t, 4800, 5150));
        A.R = 54; A.sh = 0;
        A.sq = 1 + spring(t - 4800, -0.05, 2.5, 160);
      } else if (t < 5600) {
        var cu = seg(t, 5150, 5600), cq = eio(cu);
        A.P = arc2(HP, [T.x, T.y], 22, cq);
        A.b = sx * 360 - sx * 10 * Math.sin(Math.PI * cu);
        A.R = 54; A.sh = seg(cu, 0.45, 1); A.shR = 50; A.shLift = 12 * (1 - cu);
        A.sq = 1 + 0.05 * Math.sin(Math.PI * cu);
      } else {
        A.P = [T.x, T.y]; A.b = 0; A.sh = 1; A.shR = 50;
        A.R = 54;
        A.sq = 1 + spring(t - 5600, -0.17, 3.2, 120);
        if (t >= 5950) {
          A.sq = kf(SQ_KEYS, t) + spring(t - 6460, -0.03, 4, 90);
          A.R = kf(R_KEYS, t); A.sm = kf(SM_KEYS, t); A.k = kf(K_KEYS, t);
          A.shR = Math.max(CR, A.R * 0.93);
          A.vsy = Math.min(1, A.sq); A.vsx = 1 + (1 - A.vsy) * 0.6; // the chip under the cloud gets pressed too
        }
        A.cOn = 1 - seg(t, 6400, 6480);
        // stick: slide out, then telescope away into the hand
        var pu = eio(seg(t, 5600, 5790));
        A.d = 30 * pu;
        A.Ls = 1 - eio(seg(t, 5790, 5900));
        var lowHand = [T.x, T.y + STICK + 30];
        var topY = function (tt) { return T.y - kf(R_KEYS, tt) * 1.08 * kf(SQ_KEYS, tt) - 9; };
        if (t < 5790) A.hand = [T.x, T.y + STICK + A.d];
        else if (t < 5950) {
          var au = eio(seg(t, 5790, 5950));
          var above = [T.x, topY(5950) - 30];
          A.hand = arc2(lowHand, above, 0, au);
          A.hand[0] += S.sx * -44 * Math.sin(Math.PI * au); // swing round the side of the cloud
        } else if (t < 6600) {
          var lift = kf([[5950, 30], [6050, 0, ei], [6130, 0], [6220, 14, eo], [6335, 0, ei], [6480, 0], [6600, 22, eo]], t);
          A.hand = [T.x, topY(t) - lift];
        } else if (t < 6900) {
          var ru = eio(seg(t, 6600, 6900)), from = [T.x, topY(6600) - 22];
          A.hand = arc2(from, shoulder(S, t), 10, ru);
          A.hand.retract = ru;
        }
        if (t >= 6400) {
          var d0 = t - 6400;
          var land = Math.exp(-d0 / 80) * Math.sin(Math.PI * clamp(d0 / 120));
          A.vsx = 1 + 0.12 * land; A.vsy = 1 - 0.12 * land;
          A.shR = CR;
        }
      }
    }
    if (t >= 1950 && t < 2750 && !A.hand) {
      var dd = dirB(A.b);
      A.hand = [A.P[0] + (STICK + A.d) * dd[0], A.P[1] + (STICK + A.d) * dd[1]];
    }
    if (t >= 2750 && t < 5600) {
      var de = dirB(A.b);
      A.hand = [A.P[0] + STICK * de[0], A.P[1] + STICK * de[1]];
    }
    return A;
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

  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-cottoncandy-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.j < 2 ? 1 : -1;
    var MX = T.x + sx * 88, baseY = Math.min(L.bandY + 4, 566);
    var dealerC = hex(opts.dealerColor || '#E8559E'), victimC = opts.victimColor || T.color;
    var FL = hex(mix(dealerC, '#FFFFFF', 0.42)), FLH = mix(dealerC, '#FFFFFF', 0.75), FLW = mix(dealerC, '#FFFFFF', 0.25);
    var dIni = L.ini(opts.dealer), vIni = T.ini;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = el('defs', {}, svg);
    var gr = el('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    el('stop', { offset: '0', 'stop-color': '#317659' }, gr); el('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var cpM = el('clipPath', { id: id + 'm', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: -400, y: -400, width: 1200, height: f1(baseY + 6 + 400) }, cpM);

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

    // hole, shadows
    var hole = el('g', {}, cam);
    var holeE = el('ellipse', { cx: MX, cy: baseY, rx: 0, ry: 0, fill: HOLE, stroke: INK, 'stroke-width': 2.2 }, hole);
    var holeIn = el('ellipse', { cx: MX, cy: baseY + 2, rx: 0, ry: 0, fill: '#0B241C' }, hole);
    var mShadow = el('ellipse', { cx: MX, cy: baseY + 3, rx: 40, ry: 6, fill: INK, opacity: 0 }, cam);
    var aSh = el('ellipse', { fill: INK, opacity: 0 }, cam);
    var dust = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- machine: back / mid (world) / front ----
    var mWrap = el('g', { 'clip-path': 'url(#' + id + 'm)' }, cam);
    var mBack = el('g', {}, mWrap);
    var midSlot = el('g', {}, mWrap);
    var mFront = el('g', {}, mWrap);
    // poles
    [-1, 1].forEach(function (s) {
      el('rect', { x: s * 37 - 2.2, y: -126, width: 4.4, height: 70, rx: 2, fill: STEEL_L, stroke: INK, 'stroke-width': 1.8 }, mBack);
    });
    // stall backdrop (also hides whatever is behind the stall)
    el('rect', { x: -37, y: -126, width: 74, height: 70, fill: mix(dealerC, PAPER, 0.84), stroke: INK, 'stroke-width': 1.8 }, mBack);
    for (var bi = -2; bi <= 2; bi++) el('rect', { x: bi * 14 - 3.5, y: -124, width: 7, height: 66, fill: mix(dealerC, PAPER, 0.7) }, mBack);
    // awning
    var awn = el('g', {}, mBack);
    var aw = el('g', {}, awn);
    var nb = 6, tw = 60, bw = 96, yt = -144, yb = -124;
    var outline = 'M' + (-tw / 2) + ' ' + yt + 'L' + (tw / 2) + ' ' + yt + 'L' + (bw / 2) + ' ' + yb;
    for (var i = 0; i < nb; i++) {
      var x0t = -tw / 2 + tw * i / nb, x1t = -tw / 2 + tw * (i + 1) / nb, x0b = -bw / 2 + bw * i / nb, x1b = -bw / 2 + bw * (i + 1) / nb;
      var rr = f1((x1b - x0b) / 2);
      el('path', { d: 'M' + f1(x0t) + ' ' + yt + 'L' + f1(x1t) + ' ' + yt + 'L' + f1(x1b) + ' ' + yb + 'A' + rr + ' 6 0 0 1 ' + f1(x0b) + ' ' + yb + 'Z', fill: i % 2 ? PAPER : dealerC }, aw);
      var j = nb - 1 - i, xa = -bw / 2 + bw * (j + 1) / nb, xb = -bw / 2 + bw * j / nb;
      outline += 'A' + rr + ' 6 0 0 1 ' + f1(xb) + ' ' + yb;
      void xa;
    }
    outline += 'Z';
    el('path', { d: 'M-24 -140 L20 -140', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 2, 'stroke-linecap': 'round' }, aw);
    el('path', { d: outline, fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, aw);
    el('rect', { x: -33, y: -148, width: 66, height: 6, rx: 3, fill: mix(dealerC, INK, 0.25), stroke: INK, 'stroke-width': 2 }, awn);
    var finial = el('circle', { cx: 0, cy: -153, r: 4.6, fill: dealerC, stroke: INK, 'stroke-width': 2 }, awn);
    // shoulder bolt on the arm side
    var boltG = el('g', { transform: 'scale(' + (-sx) + ',1)' }, mBack);
    el('circle', { cx: 37, cy: -102, r: 4.2, fill: STEEL, stroke: INK, 'stroke-width': 1.8 }, boltG);
    // bowl interior
    el('ellipse', { cx: 0, cy: -60, rx: 40, ry: 9, fill: STEEL_D, stroke: INK, 'stroke-width': 2.4 }, mBack);
    el('ellipse', { cx: 0, cy: -58.5, rx: 31, ry: 5.5, fill: '#66737B' }, mBack);
    var ring = el('ellipse', { cx: 0, cy: -61, rx: 27, ry: 5.2, fill: 'none', stroke: FL, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '11 7', opacity: 0 }, mBack);
    var spinner = el('g', {}, mBack);
    el('rect', { x: -6, y: -66, width: 12, height: 9, rx: 3, fill: STEEL_L, stroke: INK, 'stroke-width': 1.6 }, spinner);
    var spinTick = el('path', { stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, spinner);
    var ring2 = el('ellipse', { cx: 0, cy: -62, rx: 18, ry: 3.6, fill: 'none', stroke: FLH, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-dasharray': '6 9', opacity: 0 }, mBack);

    // front: wheels, base, bowl front
    [-22, 22].forEach(function (x) {
      el('circle', { cx: x, cy: -4, r: 5.2, fill: INK }, mFront);
      el('circle', { cx: x, cy: -4, r: 1.8, fill: STEEL }, mFront);
    });
    el('rect', { x: -30, y: -40, width: 60, height: 36, rx: 7, fill: BASE }, mFront);
    el('path', { d: 'M-30 -32 L-30 -34 Q-30 -40 -24 -40 L24 -40 Q30 -40 30 -34 L30 -32 Z', fill: dealerC }, mFront);
    el('path', { d: 'M23 -28 L23 -12 Q23 -8 19 -8', fill: 'none', stroke: INK, 'stroke-opacity': 0.08, 'stroke-width': 4, 'stroke-linecap': 'round' }, mFront);
    el('rect', { x: -30, y: -40, width: 60, height: 36, rx: 7, fill: 'none', stroke: INK, 'stroke-width': 2.6 }, mFront);
    var eyes = [-10, 10].map(function (x) {
      var g = el('g', { transform: 'translate(' + x + ',-22)' }, mFront);
      el('circle', { r: 5.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.7 }, g);
      return { x: x, pup: el('circle', { r: 2.7, fill: INK }, g), gl: el('circle', { r: 0.9, fill: '#FFFFFF' }, g), lid: el('path', { fill: BASE, stroke: INK, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g) };
    });
    var cheeks = [-19, 19].map(function (x) { return el('ellipse', { cx: x, cy: -14, rx: 3.6, ry: 2, fill: dealerC, opacity: 0 }, mFront); });
    var mouth = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mFront);
    el('path', { d: 'M-40 -60 C-40 -43 -27 -38 0 -38 C27 -38 40 -43 40 -60 A40 9 0 0 1 -40 -60 Z', fill: STEEL, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, mFront);
    el('path', { d: 'M-38 -59 A38 8 0 0 0 38 -59', fill: 'none', stroke: STEEL_L, 'stroke-width': 2.2 }, mFront);
    el('path', { d: 'M-33 -50 Q-29 -43 -18 -41.5', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.75, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, mFront);
    el('path', { d: 'M31 -49 Q28 -44 22 -42.5', fill: 'none', stroke: INK, 'stroke-opacity': 0.12, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, mFront);

    // wisps (world)
    var wispG = el('g', {}, cam);
    var wisps = [];
    for (var wi = 0; wi < 7; wi++) wisps.push({
      o: el('path', { fill: 'none', stroke: FLW, 'stroke-width': 4.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, wispG),
      p: el('path', { fill: 'none', stroke: FLH, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, wispG)
    });

    // arm (world)
    var armG = el('g', {}, cam);
    var armO = el('path', { fill: 'none', stroke: INK, 'stroke-width': 7.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, armG);
    var armI = el('path', { fill: 'none', stroke: STEEL, 'stroke-width': 3.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, armG);
    var elbow = el('circle', { r: 3.4, fill: STEEL_L, stroke: INK, 'stroke-width': 1.6 }, armG);

    // actor (chip on the cone + cloud)
    var topSlot = el('g', {}, cam);
    var aG = el('g', {}, topSlot);
    var stickG = el('g', {}, aG);
    var stickP = el('path', { fill: '#F6EBD3', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, stickG);
    var stickS = el('path', { fill: 'none', stroke: dealerC, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, stickG);
    var vG = el('g', {}, aG);
    makeChip(vG, victimC, vIni);
    var vGD = el('g', { opacity: 0 }, vG); makeChip(vGD, dealerC, dIni);
    var cloudG = el('g', {}, aG);
    var cO = el('g', {}, cloudG), cF = el('g', {}, cloudG), cH = el('g', {}, cloudG);
    var puffs = [];
    for (var pi = 0; pi <= NP; pi++) puffs.push({
      o: el('circle', { r: 1, fill: INK }, cO),
      f: el('circle', { r: 1, fill: FL }, cF),
      h: el('path', { fill: 'none', stroke: FLH, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, cH)
    });
    var coat = el('circle', { r: CR, fill: dealerC, opacity: 0 }, cloudG);
    // hand (topmost of the rig)
    var handG = el('g', {}, cam);
    el('ellipse', { rx: 8.2, ry: 6.6, fill: STEEL, stroke: INK, 'stroke-width': 2 }, handG);
    el('path', { d: 'M-4.5 -2.6 Q-2 -4.4 1.5 -4', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.7, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, handG);

    // fx
    var parts = [];
    for (var qi = 0; qi < 12; qi++) {
      var pg = el('g', { opacity: 0 }, cam);
      parts.push({ g: pg, o: el('circle', { r: 1, fill: INK }, pg), f: el('circle', { r: 1, fill: FL }, pg) });
    }
    var ripple = el('circle', { fill: 'none', stroke: dealerC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var ticks = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var tink = el('path', { fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0 }, cam);

    var line = el('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return {
      opts: opts, L: L, T: T, sx: sx, MX: MX, baseY: baseY, dealerC: dealerC, FL: FL, svg: svg, cam: cam,
      rowsG: rowsG, chipsG: chipsG, holeE: holeE, holeIn: holeIn, mShadow: mShadow, aSh: aSh, dust: dust, mWrap: mWrap,
      mBack: mBack, mFront: mFront, midSlot: midSlot, topSlot: topSlot, aG: aG, aw: aw, finial: finial, ring: ring, ring2: ring2,
      spinTick: spinTick, eyes: eyes, cheeks: cheeks, mouth: mouth, wisps: wisps, armG: armG, armO: armO, armI: armI, elbow: elbow,
      stickG: stickG, stickP: stickP, stickS: stickS, vG: vG, vGD: vGD, cloudG: cloudG, puffs: puffs, coat: coat, handG: handG,
      parts: parts, ripple: ripple, ticks: ticks, tink: tink, line: line
    };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var T = S.T, sx = S.sx, MX = S.MX, baseY = S.baseY;

    // camera: gentle push-in that keeps whole rows in frame
    var zk = eioC(seg(t, 550, 1250)) * (1 - eioC(seg(t, 6950, 7650)));
    var Z = lerp(1, 1.13, zk);
    var fy = clamp((T.y + baseY) / 2 - 34, 290, 330);
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
    var mVis = t >= 1000 && t < 7475;
    S.mWrap.setAttribute('display', mVis ? 'inline' : 'none');
    var hk = holeK(t);
    S.holeE.setAttribute('rx', f1(52 * MS * hk)); S.holeE.setAttribute('ry', f1(11 * hk));
    S.holeIn.setAttribute('rx', f1(43 * MS * hk)); S.holeIn.setAttribute('ry', f1(6.5 * hk));
    S.holeE.parentNode.setAttribute('display', hk > 0.01 ? 'inline' : 'none');
    var standing = mVis ? clamp(1 - m.dy / 40) * clamp(1 - Math.max(0, -m.dy) / 30, 0.4, 1) : 0;
    S.mShadow.setAttribute('cx', f1(MX + m.dx + 2)); S.mShadow.setAttribute('rx', f1(34 * MS * (0.8 + 0.2 * standing)));
    S.mShadow.setAttribute('opacity', f1(standing * 24 * (t > 1300 ? 1 : 0)) / 100);
    var mt = 'translate(' + f1(MX + m.dx) + ',' + f1(baseY + m.dy) + ') rotate(' + f1(m.rot) + ') scale(' + f2((2 - m.sqy) * MS) + ',' + f2(m.sqy * MS) + ')';
    if (mVis) { S.mBack.setAttribute('transform', mt); S.mFront.setAttribute('transform', mt); }
    // awning flaps bounce on landing and on the reveal
    var flap = spring(t - 1330, 0.16, 3, 160) + spring(t - 4500, 0.08, 3, 150) + spring(t - 7000, 0.1, 3.5, 120);
    S.aw.setAttribute('transform', 'translate(0,-144) scale(' + f2(1 - flap * 0.3) + ',' + f2(1 + flap) + ') translate(0,144)');

    // eruption dust
    var dp0 = seg(t, 1040, 1330);
    if (dp0 > 0 && dp0 < 1) {
      var dd = '';
      [-2.9, -2.5, -0.65, -0.25, 2.6, 0.5].forEach(function (a) {
        var r0 = 1 + 0.25 * eoC(dp0), r1 = r0 + 0.18 * (1 - dp0);
        dd += 'M' + f1(MX + Math.cos(a) * 60 * r0) + ' ' + f1(baseY + Math.sin(a) * 14 * r0) + 'L' + f1(MX + Math.cos(a) * 60 * r1) + ' ' + f1(baseY + Math.sin(a) * 14 * r1);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp0) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // spinner + floss ring
    var sa = spinAng(t), spinOn = seg(t, 1500, 1750) * (1 - seg(t, 6950, 7200));
    var tx = 4.5 * Math.sin(sa * 0.5);
    S.spinTick.setAttribute('d', 'M' + f1(tx) + ' -64 L' + f1(tx) + ' -59');
    var ringA = seg(t, 1550, 1900) * (1 - 0.5 * seg(t, 3000, 4300)) * (1 - seg(t, 6950, 7250));
    S.ring.setAttribute('opacity', f2(ringA)); S.ring.setAttribute('stroke-dashoffset', f1(-sa * 14));
    S.ring.setAttribute('stroke-width', f1(3 + 2.5 * seg(t, 1550, 2700)));
    S.ring2.setAttribute('opacity', f2(ringA * 0.9)); S.ring2.setAttribute('stroke-dashoffset', f1(-sa * 10));

    // ---- actor ----
    var A = actor(S, t);
    S.__P = A.P;
    var slot = A.layer === 'mid' ? S.midSlot : S.topSlot;
    if (S.aG.parentNode !== slot) slot.appendChild(S.aG);
    // stick (paper cone)
    var dir = dirB(A.b);
    if (A.Ls > 0.02 && A.hand) {
      var hx = A.hand[0], hy = A.hand[1], len = STICK * A.Ls;
      var tipx = hx - dir[0] * len, tipy = hy - dir[1] * len;
      var nx = -dir[1], ny = dir[0], w0 = 2.6, w1 = 4.6;
      S.stickP.setAttribute('d', 'M' + f1(tipx + nx * w0) + ' ' + f1(tipy + ny * w0) + 'L' + f1(hx + nx * w1) + ' ' + f1(hy + ny * w1) + 'L' + f1(hx - nx * w1) + ' ' + f1(hy - ny * w1) + 'L' + f1(tipx - nx * w0) + ' ' + f1(tipy - ny * w0) + 'Z');
      var sd = '';
      [0.3, 0.6].forEach(function (f) {
        var cx = lerp(tipx, hx, f), cy = lerp(tipy, hy, f), w = lerp(w0, w1, f) - 0.6, o = 2.4;
        sd += 'M' + f1(cx + nx * w - dir[0] * o) + ' ' + f1(cy + ny * w - dir[1] * o) + 'L' + f1(cx - nx * w + dir[0] * o) + ' ' + f1(cy - ny * w + dir[1] * o);
      });
      S.stickS.setAttribute('d', sd);
      S.stickG.setAttribute('display', 'inline');
    } else S.stickG.setAttribute('display', 'none');
    // chip
    var vs = t < 520 + 70 * T.row + 60 * T.j ? chipPop(T) : A.vs;
    S.vG.setAttribute('transform', 'translate(' + f1(A.P[0]) + ',' + f1(A.P[1]) + ') rotate(' + f1(A.crot) + ') scale(' + f2(vs * A.vsx) + ',' + f2(vs * A.vsy) + ')');
    S.vGD.setAttribute('opacity', A.dealer);
    // cloud
    if (A.cOn > 0.001 && A.R > 0) {
      S.cloudG.setAttribute('display', 'inline');
      S.cloudG.setAttribute('opacity', f2(A.cOn));
      var sqy = A.sq, sqx = 1 + (1 - A.sq) * 0.6;
      S.cloudG.setAttribute('transform', 'translate(' + f1(A.P[0]) + ',' + f1(A.P[1]) + ') scale(' + f2(sqx) + ',' + f2(sqy) + ')');
      var R = A.R, sm = A.sm, fill = A.k > 0 ? mix(S.FL, S.dealerC, A.k) : S.FL;
      var grow = t < 4350 ? seg(t, 2790, 3100) : 1;
      S.puffs.forEach(function (p, i) {
        var cx, cy, r;
        var br = 1 + 0.045 * Math.sin(t * 0.0062 + i * 1.9) * (1 - sm);
        if (i === NP) { cx = 0; cy = 0; r = lerp(R * 0.66, R, sm); }
        else {
          var a = A.phi + i * 2 * Math.PI / NP, dist = R * 0.56 * (1 - sm) * lerp(0.6, 1, grow);
          cx = Math.cos(a) * dist; cy = Math.sin(a) * dist * 0.94;
          r = lerp(R * (0.47 + 0.07 * Math.sin(i * 2.3)) * grow, R, sm) * br;
        }
        var ow = 2.4 / ((sqx + sqy) / 2);
        p.o.setAttribute('cx', f1(cx)); p.o.setAttribute('cy', f1(cy)); p.o.setAttribute('r', f1(r + ow));
        p.f.setAttribute('cx', f1(cx)); p.f.setAttribute('cy', f1(cy)); p.f.setAttribute('r', f1(r));
        p.f.setAttribute('fill', fill);
        var hr = r * 0.62, a0 = 3.5 + 0.25 * Math.sin(i * 1.7), a1 = a0 + 1.0;
        if (sm < 0.9 && r > 4) p.h.setAttribute('d', 'M' + f1(cx + Math.cos(a0) * hr) + ' ' + f1(cy + Math.sin(a0) * hr) + 'A' + f1(hr) + ' ' + f1(hr) + ' 0 0 1 ' + f1(cx + Math.cos(a1) * hr) + ' ' + f1(cy + Math.sin(a1) * hr));
        else p.h.setAttribute('d', '');
        p.h.setAttribute('opacity', f2(0.9 * (1 - A.k) * (1 - sm)));
      });
      S.coat.setAttribute('opacity', f2(seg(A.sm, 0.85, 1)));
      S.coat.setAttribute('r', f1(R));
    } else S.cloudG.setAttribute('display', 'none');
    // actor shadow on the felt
    if (A.sh > 0.01) {
      var shr = A.shR * Math.min(1.04, chipPop(T));
      S.aSh.setAttribute('cx', f1(T.x + 1.5 + A.shLift * 0.4)); S.aSh.setAttribute('cy', f1(T.y + 3.5 + A.shLift));
      var big = A.cOn > 0.5 && A.R > CR + 2;
      S.aSh.setAttribute('rx', f1(shr * (big ? (1 + (1 - A.sq) * 0.6) : A.vsx))); S.aSh.setAttribute('ry', f1(shr * (big ? 0.92 * Math.min(1, A.sq + 0.1) : A.vsy)));
      S.aSh.setAttribute('opacity', f2((A.R > CR + 2 && A.cOn > 0.5 ? 0.2 : 0.28) * A.sh * clamp(chipPop(T))));
    } else S.aSh.setAttribute('opacity', 0);

    // ---- arm + hand ----
    if (A.hand && !(A.hand.retract > 0.97)) {
      var S0 = toWorld(S, m, -sx * 37, -102), H0 = A.hand;
      var dx = H0[0] - S0[0], dy = H0[1] - S0[1], d = Math.hypot(dx, dy) || 1;
      var lseg = Math.max(30, d / 2 + 0.01), hh = Math.sqrt(Math.max(0, lseg * lseg - d * d / 4));
      var px = -dy / d, py = dx / d; if (py > 0) { px = -px; py = -py; }
      var E = [S0[0] + dx / 2 + px * hh, S0[1] + dy / 2 + py * hh];
      var rk = A.hand.retract || 0;
      if (t < 1950) rk = 1 - seg(t, 1700, 1800);
      var sc = 1 - rk;
      E = [lerp(S0[0], E[0], 1), lerp(S0[1], E[1], 1)];
      var ad = 'M' + f1(S0[0]) + ' ' + f1(S0[1]) + 'L' + f1(E[0]) + ' ' + f1(E[1]) + 'L' + f1(H0[0]) + ' ' + f1(H0[1]);
      S.armO.setAttribute('d', ad); S.armI.setAttribute('d', ad);
      S.elbow.setAttribute('cx', f1(E[0])); S.elbow.setAttribute('cy', f1(E[1]));
      S.armG.setAttribute('display', 'inline');
      var hs = 0.4 + 0.6 * sc;
      var hrot = Math.atan2(dy, dx) * 180 / Math.PI, pat = seg(t, 5850, 5950) * (1 - seg(t, 6550, 6650));
      hrot = lerp(hrot, 0, pat);
      S.handG.setAttribute('transform', 'translate(' + f1(H0[0]) + ',' + f1(H0[1]) + ') rotate(' + f1(hrot) + ') scale(' + f2(hs * (1 + 0.45 * pat)) + ',' + f2(hs * (1 + 0.15 * pat)) + ')');
      S.handG.setAttribute('display', 'inline');
    } else { S.armG.setAttribute('display', 'none'); S.handG.setAttribute('display', 'none'); }

    // ---- machine face ----
    var mlid = kf([[0, 1], [1360, 1], [1440, -1], [1990, -1], [2040, 1], [2090, -1], [2780, -1], [2840, 1.05], [4320, 1.05], [4380, -1],
      [5250, -1], [5300, 1], [5350, -1], [5880, -1], [5960, 0.3], [6390, 0.3], [6430, -1], [6930, -1], [6990, 0.22], [7080, 0.22], [7130, 1.05]], t);
    var happy = (t > 2800 && t < 4360) || t > 7100;
    var lookKeys = [[0, 'cam'], [1420, 'chip'], [2780, 'cam'], [4380, 'chip'], [4880, 'cam'], [5080, 'chip'], [6700, 'cam'], [6900, 'chip'], [7010, 'cam']];
    S.eyes.forEach(function (e) {
      var Ew = toWorld(S, m, e.x, -22), v = lookVec(S, lookKeys, t, Ew);
      var wide = t > 4400 && t < 4900 ? 1.12 : 1;
      e.pup.setAttribute('cx', f1(v[0] * 2.4)); e.pup.setAttribute('cy', f1(v[1] * 2.4));
      e.pup.setAttribute('r', f1(2.7 * wide));
      e.gl.setAttribute('cx', f1(v[0] * 2.4 - 0.9)); e.gl.setAttribute('cy', f1(v[1] * 2.4 - 0.9));
      var r = 5.6, Ly = clamp(mlid, -1, 1.05) * r;
      if (mlid <= -0.97) e.lid.setAttribute('d', '');
      else if (mlid >= 0.99) e.lid.setAttribute('d', circleD(0, 0, r) + (happy ? 'M-3.8 1.6 Q0 -2.6 3.8 1.6' : 'M-4 0.4 Q0 2.4 4 0.4'));
      else { var dx2 = Math.sqrt(r * r - Ly * Ly); e.lid.setAttribute('d', 'M' + f1(-dx2) + ' ' + f1(Ly) + 'A' + r + ' ' + r + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(dx2) + ' ' + f1(Ly) + 'Z'); }
    });
    var blush = seg(t, 2850, 3100) * (1 - seg(t, 4300, 4500)) + seg(t, 6950, 7050);
    S.cheeks.forEach(function (c) { c.setAttribute('opacity', f2(0.55 * clamp(blush))); });
    var mouthD;
    if (t < 1420) mouthD = 'M-3 -11 L3 -11';
    else if (t < 2780) mouthD = 'M-4.5 -12 Q0 -8.5 4.5 -12';
    else if (t < 4380) mouthD = 'M-5.5 -12.5 Q0 -12.5 5.5 -12.5 Q4.5 -6.5 0 -6.5 Q-4.5 -6.5 -5.5 -12.5 Z';
    else if (t < 5100) { var oo = 1 + 0.15 * Math.sin(t * 0.02); mouthD = circleD(0, -10, 2.6 * oo); }
    else if (t < 5900) mouthD = 'M-4.5 -12 Q0 -8.5 4.5 -12';
    else if (t < 6430) mouthD = 'M-3.5 -10.5 Q-1 -12 1 -10.5 Q3 -9 4 -10.5'; // concentrating
    else mouthD = 'M-5.5 -12 Q0 -7.5 5.5 -12';
    S.mouth.setAttribute('d', mouthD);
    S.mouth.setAttribute('fill', t >= 2780 && t < 4380 ? INK : 'none');

    // ---- wisps of floss rising ----
    var wAmt = seg(t, 1550, 1850) * (1 - seg(t, 4350, 4800)) + 0.55 * seg(t, 4800, 5000) * (1 - seg(t, 5300, 5700));
    var attract = seg(t, 2750, 2950) * (1 - seg(t, 4200, 4400));
    var BC = toWorld(S, m, 0, BOWL_Y);
    S.wisps.forEach(function (w, k) {
      if (wAmt <= 0.001 || t < 1550) { w.o.setAttribute('opacity', 0); w.p.setAttribute('opacity', 0); return; }
      var u = (((t - 1550) / 1250 + k / 7) % 1 + 1) % 1;
      var x0 = BC[0] + (k - 3) * 9 + Math.sin(u * 4 + k * 1.3) * 9 + sx * 6 * u * Math.sin(k);
      var y0 = BC[1] - 8 - 78 * eo(u);
      // during the twirl the floss spirals in onto the chip
      var ang = u * 6 + k, rr = (1 - u) * 34 + 8;
      var tx2 = A.P[0] + Math.cos(ang) * rr * 1.1, ty2 = A.P[1] + Math.sin(ang) * rr * 0.45 - 6;
      x0 = lerp(x0, tx2, attract); y0 = lerp(y0, ty2, attract);
      var dd2 = '', ln = 5 + 2 * Math.sin(k);
      for (var j = 0; j <= 5; j++) {
        var xx = x0 + 3.2 * Math.sin(j * 1.15 + u * 7 + k) * (1 - attract) + j * ln * 0.6 * attract * Math.cos(ang + 1.6);
        var yy = y0 - j * ln * 0.55 * (1 + u) * (1 - attract);
        dd2 += (j ? 'L' : 'M') + f1(xx) + ' ' + f1(yy);
      }
      var op = wAmt * Math.sin(Math.PI * u) * 0.95;
      w.o.setAttribute('d', dd2); w.p.setAttribute('d', dd2);
      w.o.setAttribute('opacity', f2(op)); w.p.setAttribute('opacity', f2(op));
      w.o.setAttribute('stroke-width', f1(4.8 - 2 * u)); w.p.setAttribute('stroke-width', f1(2.6 - 1.1 * u));
    });

    // ---- particles: puffs escaping at the pats, and the machine's last puff ----
    var pi2 = 0;
    function puffEvt(te, n, ox, oy, angs, d0, d1, r0, dur) {
      for (var k = 0; k < n; k++) {
        var p = S.parts[pi2++]; if (!p) return;
        var u = seg(t, te + k * 15, te + k * 15 + dur);
        if (u <= 0 || u >= 1) { p.g.setAttribute('opacity', 0); continue; }
        var a = angs[k] * Math.PI / 180, dist = lerp(d0, d1, eoC(u));
        var cx = ox + Math.cos(a) * dist, cy = oy + Math.sin(a) * dist * 0.8 - 10 * u;
        var r = r0 * (1 - 0.55 * u) * (0.6 + 0.4 * eoC(seg(u, 0, 0.25)));
        p.o.setAttribute('cx', f1(cx)); p.o.setAttribute('cy', f1(cy)); p.o.setAttribute('r', f1(r + 2));
        p.f.setAttribute('cx', f1(cx)); p.f.setAttribute('cy', f1(cy)); p.f.setAttribute('r', f1(r));
        var op = 1 - ei(u);
        p.g.setAttribute('opacity', f2(op));
      }
    }
    puffEvt(6055, 4, T.x, T.y, [195, -15, 160, 20], 44, 62, 7, 300);
    puffEvt(6340, 5, T.x, T.y, [185, -5, 215, -35, 140], 30, 58, 6.5, 460);
    var top = toWorld(S, m, 0, -70);
    puffEvt(6990, 3, top[0], top[1], [-90, -125, -55], 4, 30, 7, 380);

    // tink: chip stuck to the cone
    var tk = seg(t, 2150, 2400);
    if (tk > 0 && tk < 1) {
      var td0 = '', Pc = A.P;
      [-2.4, -1.57, -0.74].forEach(function (a) {
        var r0 = 27 + 6 * eoC(tk), r1 = r0 + 6 * (1 - tk);
        td0 += 'M' + f1(Pc[0] + Math.cos(a) * r0) + ' ' + f1(Pc[1] + Math.sin(a) * r0) + 'L' + f1(Pc[0] + Math.cos(a) * r1) + ' ' + f1(Pc[1] + Math.sin(a) * r1);
      });
      S.tink.setAttribute('d', td0); S.tink.setAttribute('opacity', f2(1 - tk));
    } else S.tink.setAttribute('opacity', 0);

    // reveal ring + ticks
    var rp = seg(t, 6410, 6910);
    S.ripple.setAttribute('r', f1(CR + 28 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var tp = seg(t, 6420, 6700);
    if (tp > 0 && tp < 1) {
      var td = '', r0 = 28 + 9 * eoC(tp), r1b = r0 + 6 * (1 - tp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75, 1.0].forEach(function (a) {
        td += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.ticks.setAttribute('d', td); S.ticks.setAttribute('opacity', f1((1 - tp) * 90) / 100);
    } else S.ticks.setAttribute('opacity', 0);

    // final line
    var lp2 = seg(t, 7680, 8030);
    S.line.setAttribute('opacity', f1(eo(lp2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp2, 1.6)) * 14) + ')');
  }

  function lookSpec(S, spec, E) {
    if (spec === 'cam') return [0, 0.2];
    var p = S.__P || [S.T.x, S.T.y];
    var dx = p[0] - E[0], dy = p[1] - E[1], mm = Math.hypot(dx, dy) || 1;
    return [dx / mm, dy / mm];
  }
  function lookVec(S, keys, t, E) {
    var k = 0;
    for (var i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i;
    var b = lookSpec(S, keys[k][1], E);
    if (k === 0) return b;
    var a = lookSpec(S, keys[k - 1][1], E), q = backOut(seg(t, keys[k][0], keys[k][0] + 150), 1.3);
    return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  }

  function getScene(root, opts) {
    var c = root.__cc2cottoncandy;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2cottoncandy = S;
    return S;
  }

  window.CCSteal2_cottoncandy = {
    title: 'The Fair',
    blurb: 'A little candy-floss machine pops out of the felt, twirls Nate’s chip round its bowl into an enormous puffball of floss in Nick’s colour, then pats it down into a smooth new coat and sets it back in its spot.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2cottoncandy = S;
      var token = {};
      root.__cc2cottoncandyToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2cottoncandyToken !== token) { resolve(); return; }
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
