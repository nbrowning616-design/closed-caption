/* Closed Caption - "steal" moment - concept: THE WAVE (key: wave)
 *
 * Every chip on the table is a fan in the stands. The dealer is the hype-man in the
 * front row: a giant foam finger in his colour, his initial on the palm. He cues a
 * stadium wave; each fan pops up, arms high, flips over (its back is its own colour)
 * and sits. Nate's chip is busy with a hot dog and misses it completely.
 *
 * Storyboard (ms)
 *    0- 700  Table deals in; chips pop on, eyes blink open - they are fans. Nate's chip
 *            is happily munching a hot dog, eyes shut in bliss.
 *  600-1250  The dealer's foam finger swoops in over row 1 and pumps twice: "here we go!"
 * 1250-3200  THE WAVE: in reading order each fan crouches, pops up with arms raised,
 *            flips (back = own colour), sits. The finger leads it, then whooshes off.
 *            Everyone watches it coming. It reaches Nate... who is mid-bite. Skipped.
 * 3200-3800  Silence. Camera eases in (rows either side stay in frame). Nate stops
 *            chewing, opens his eyes, looks where the wave went, looks back. Sweat drop.
 * 3800-3950  Gulp. The hot dog is flung over his shoulder (spins out of frame).
 * 3850-4250  The foam finger dives back in, a round card-stunt card in the dealer's
 *            colour pinned under its fingertip.
 * 3950-4720  The frantic LATE SOLO WAVE: crouch, launch, arms flailing, flipping. The
 *            whole crowd snaps round to stare. At the top of the flip (back side up)
 *            the finger SLAPS the card onto his back (4400). He spins on and lands
 *            back-side up - in Nick's colour with Nick's initial - exactly on his spot.
 * 4720-5350  FREEZE. Wide eyes. Crowd staring. He looks down at himself... and back up.
 *            (the colour-change beat)
 * 5350-5750  Shrug: arms out, head tilt, wobbly mouth.
 * 5750-6100  He puffs up proud (hands on hips, big grin), then SITS: squash, ring, dust
 *            - firmly in his original spot. The finger gives a pump and leaves.
 * 6150-7000  The crowd looks away, eyes close, the fans become plain chips again.
 *            Camera eases back.
 * 7000-7400  Stillness.
 * 7400-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', SLEEVE = '#3A3346';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var WAVE0 = 1250, WD = 600, SLAP = 4400;
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
  function bump(t, a, b, c, d) { return eio(seg(t, a, b)) * (1 - eio(seg(t, c, d))); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function f3(v) { return Math.round(v * 1000) / 1000; }
  function kf(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        var a = keys[i - 1], b = keys[i];
        return lerp(a[1], b[1], (b[2] || eio)((t - a[0]) / (b[0] - a[0])));
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
  function rotv(x, y, deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function P2(x, y) { return f1(x) + ' ' + f1(y); }
  function shade(hex, k) {
    var h = String(hex || '#888888').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h.slice(0, 6), 16); if (isNaN(n)) n = 0x888888;
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.round(clamp(v * k, 0, 255)); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }
  // deterministic blink: 1 open, dips to 0 briefly every ~2.6 s
  function blink(t, ph) {
    var p = ((t + ph) % 2600) / 2600;
    return p > 0.94 ? Math.abs(Math.cos((p - 0.94) / 0.06 * Math.PI)) : 1;
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
    var ini = initialsFn(opts), rows = [], target = null, all = [];
    cards.forEach(function (c, i) {
      var y = y0 + i * (h + g), mid = y + h / 2;
      var row = { label: String(c.label), y: y, h: h, mid: mid, i: i, chips: [] };
      (c.chips || []).slice(0, 3).forEach(function (ch, j) {
        var chip = { name: ch.name, color: ch.color || '#888888', ini: ini(ch.name), x: 150 + 72 * j, y: mid, row: i, j: j, target: !!ch.target && !target };
        row.chips.push(chip); all.push(chip);
        if (chip.target) target = chip;
      });
      rows.push(row);
    });
    if (!target && all.length) { target = all[0]; target.target = true; }
    var n2 = all.length, gap = n2 > 1 ? Math.min(270, 1450 / (n2 - 1)) : 0;
    all.forEach(function (c, k) { c.k = k; c.ws = WAVE0 + gap * k; c.ph = (k * 977) % 2600; });
    var others = all.filter(function (c) { return c !== target; });
    return { rows: rows, target: target, all: all, others: others, h: h, ini: ini, gap: gap, waveEnd: WAVE0 + gap * Math.max(0, n2 - 1) + WD };
  }
  // where the wave is (interpolated chip position) at time t
  function waveHead(L, t) {
    var a = L.all; if (!a.length) return [W / 2, H / 2];
    var f = L.gap > 0 ? clamp((t - WAVE0 - 150) / L.gap, 0, a.length - 1) : 0;
    var i = Math.floor(f), u = f - i, A = a[i], B = a[Math.min(a.length - 1, i + 1)];
    return [lerp(A.x, B.x, u), lerp(A.y, B.y, u)];
  }

  // foam finger local geometry: finger points -y, wrist at +y; card sits under fingertip at (0,-70)
  var CARD_OFF = 70;

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-wave-' + (++uid) + '-';
    var L = layout(opts), T = L.target, DC = opts.dealerColor || '#E8559E';
    var dIni = L.ini(opts.dealer || 'Dealer');
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);

    mk('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
    var cam = mk('g', {}, svg);
    var tableG = mk('g', {}, cam);
    mk('rect', { x: 16, y: 34, width: W - 32, height: 542, rx: 28, fill: INK, opacity: 0.2, transform: 'translate(0,5)' }, tableG);
    mk('rect', { x: 14, y: 30, width: W - 28, height: 542, rx: 28, fill: 'url(#' + id + 'felt)', stroke: INK, 'stroke-width': 3 }, tableG);
    mk('rect', { x: 24, y: 40, width: W - 48, height: 522, rx: 20, fill: 'none', stroke: PAPER, 'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, tableG);

    var cardLayer = mk('g', {}, cam), floorFx = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
    var rowsG = [];
    L.rows.forEach(function (r) {
      var g = mk('g', {}, cardLayer);
      mk('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      mk('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      mk('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = mk('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
    });

    // one chip side: disc, ring, highlight, initial
    function side(parent, color, txt) {
      var g = mk('g', {}, parent);
      mk('circle', { r: CR, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
      mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
      mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, g);
      var tx = mk('text', { x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
      tx.textContent = txt;
      return { g: g, tx: tx };
    }

    var chips = [];
    function makeChip(c, parent) {
      var o = { c: c };
      o.wrap = mk('g', {}, parent);
      o.sh = mk('circle', { r: CR, fill: INK, opacity: 0.28 }, o.wrap);
      o.armG = mk('g', {}, o.wrap);
      o.arms = [mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, o.armG),
                mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, o.armG)];
      o.body = mk('g', {}, o.wrap);
      o.rim = mk('ellipse', { rx: CR, ry: CR, fill: shade(c.color, 0.62), stroke: INK, 'stroke-width': 2.6 }, o.body);
      o.face = mk('g', {}, o.body);
      o.front = side(o.face, c.color, c.ini);
      o.back = side(o.face, shade(c.color, 0.93), c.ini);
      if (c.target) { o.card = side(o.face, DC, dIni); o.cardRim = shade(DC, 0.62); }
      o.eyesG = mk('g', {}, o.face);
      o.eyes = [-1, 1].map(function (s) {
        var g = mk('g', {}, o.eyesG);
        var inner = mk('g', {}, g);
        var wh = mk('ellipse', { rx: 3.9, ry: 4.6, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.3 }, inner);
        var pu = mk('circle', { r: 2.1, fill: INK }, inner);
        var hp = mk('path', { d: 'M-3.6 1.4Q0 -3.4 3.6 1.4', fill: 'none', stroke: INK, 'stroke-width': 1.9, 'stroke-linecap': 'round' }, g);
        return { s: s, g: g, inner: inner, wh: wh, pu: pu, hp: hp };
      });
      o.mouth = mk('path', { fill: INK, stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, o.eyesG);
      o.extra = mk('g', {}, o.wrap);   // hot dog lives here (Nate only)
      o.handG = mk('g', {}, o.wrap);
      o.hands = [mk('circle', { r: 4.6, fill: PAPER, stroke: INK, 'stroke-width': 1.8 }, o.handG),
                 mk('circle', { r: 4.6, fill: PAPER, stroke: INK, 'stroke-width': 1.8 }, o.handG)];
      return o;
    }
    L.others.forEach(function (c) { chips.push(makeChip(c, chipLayer)); });
    var V = makeChip(T, chipLayer);
    // hot dog
    var hd0 = mk('g', {}, V.extra), hd = mk('g', { transform: 'scale(1.3)' }, hd0);
    mk('rect', { x: -17, y: -6.5, width: 34, height: 13, rx: 6.5, fill: '#E9B46A', stroke: INK, 'stroke-width': 1.8 }, hd);
    mk('rect', { x: -20, y: -3.6, width: 40, height: 7.2, rx: 3.6, fill: '#C4553A', stroke: INK, 'stroke-width': 1.6 }, hd);
    mk('path', { d: 'M-14 0l3 -2l3 2l3 -2l3 2l3 -2l3 2l3 -2l3 2', fill: 'none', stroke: '#F6CD3B', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, hd);
    var bite = mk('path', { d: 'M17 -6.5a4 4 0 0 1 0 13', fill: PAPER, stroke: 'none', opacity: 0 }, hd);
    V.hd = hd0; V.bite = bite;
    var sweat = mk('path', { d: 'M0 -7C2.5 -3 4.5 0 4.5 2.4A4.5 4.5 0 0 1 -4.5 2.4C-4.5 0 -2.5 -3 0 -7Z', fill: '#8FD3F4', stroke: INK, 'stroke-width': 1.5, opacity: 0 }, chipLayer);

    var ripple = mk('circle', { fill: 'none', stroke: DC, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var ticks = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, cam);

    // ---- the foam finger ----
    function fingerShapes(g, fill, ink, withDetails) {
      var sk = withDetails ? { stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round' } : {};
      function A(o) { for (var k in sk) o[k] = sk[k]; return o; }
      mk('rect', A({ x: -24, y: 36, width: 48, height: 560, fill: withDetails ? SLEEVE : fill }), g);
      if (withDetails) {
        mk('rect', { x: -24, y: 62, width: 48, height: 7, fill: PAPER, stroke: INK, 'stroke-width': 1.6 }, g);
        mk('rect', { x: -28, y: 26, width: 56, height: 15, rx: 6, fill: PAPER, stroke: INK, 'stroke-width': 2.6 }, g);
      }
      mk('rect', A({ x: -11.5, y: -84, width: 23, height: 76, rx: 11.5, fill: fill }), g);
      mk('rect', A({ x: -31, y: -24, width: 62, height: 56, rx: 20, fill: fill }), g);
      mk('ellipse', A({ cx: -32, cy: -1, rx: 10, ry: 17, fill: fill, transform: 'rotate(-18 -32 -1)' }), g);
    }
    var fShadow = mk('g', { opacity: 0.18 }, floorFx);
    fingerShapes(fShadow, INK, INK, false);
    var cardSh = mk('circle', { r: CR, fill: INK, opacity: 0.2 }, floorFx);
    var fxTop = mk('g', {}, cam);
    var cardG = mk('g', {}, fxTop);
    side(cardG, DC, dIni);
    var finger = mk('g', {}, fxTop);
    fingerShapes(finger, DC, INK, true);
    mk('path', { d: 'M-24 -14Q-28 -4 -38 4', fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-opacity': 0.5, 'stroke-linecap': 'round' }, finger);
    mk('path', { d: 'M4 -24q4.5 -7 9 0q4.5 -7 9 0', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, finger);
    mk('rect', { x: -6.5, y: -76, width: 5, height: 50, rx: 2.5, fill: '#FFFFFF', opacity: 0.28 }, finger);
    mk('ellipse', { cx: -16, cy: 4, rx: 5, ry: 13, fill: '#FFFFFF', opacity: 0.22 }, finger);
    var fTxt = mk('text', { x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', stroke: INK, 'stroke-width': 0.8, 'font-family': FONT, 'font-weight': 700, 'font-size': dIni.length > 1 ? 20 : 25 }, finger);
    fTxt.textContent = dIni;

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    return { opts: opts, L: L, svg: svg, cam: cam, rowsG: rowsG, chips: chips, V: V, sweat: sweat, ripple: ripple, dust: dust, ticks: ticks,
             finger: finger, fShadow: fShadow, fTxt: fTxt, cardG: cardG, cardSh: cardSh, line: line };
  }

  // ---------- chip drawing from a state ----------
  function applyChip(o, st) {
    var c = o.c, X = c.x + st.dx, Y = c.y + st.dy, s = st.s, lift = st.lift;
    o.sh.setAttribute('cx', f1(X + 1.5 + 6 * lift)); o.sh.setAttribute('cy', f1(Y + 3.5 + 10 * lift));
    o.sh.setAttribute('r', f1(CR * Math.max(0.001, st.pop) * (1 + 0.06 * lift)));
    o.sh.setAttribute('opacity', f3(0.28 - 0.1 * clamp(lift)));
    var base = 'translate(' + f1(X) + ',' + f1(Y) + ') rotate(' + f1(st.rot) + ')';
    o.body.setAttribute('transform', base + ' scale(' + f3(s * st.sqx) + ',' + f3(s * st.sqy) + ')');
    var th = st.th, cs = Math.cos(th), sn = Math.abs(Math.sin(th));
    var fy = Math.max(0.03, Math.abs(cs));
    o.face.setAttribute('transform', 'scale(1,' + f3(fy) + ')');
    o.rim.setAttribute('ry', f1(CR * fy)); o.rim.setAttribute('cy', f1(1 + 5 * sn));
    var showFront = cs >= 0, showCard = !showFront && st.card;
    o.front.g.setAttribute('display', showFront ? 'inline' : 'none');
    o.back.g.setAttribute('display', !showFront && !showCard ? 'inline' : 'none');
    if (o.card) {
      o.card.g.setAttribute('display', showCard ? 'inline' : 'none');
      o.rim.setAttribute('fill', st.card && (showCard || sn > 0.2 && !showFront) ? o.cardRim : shade(c.color, 0.62));
    }
    var A = st.A, tf = 'translate(0,' + f1(4.5 * A) + ') scale(' + f3(1 - 0.24 * A) + ')';
    (showFront ? o.front : showCard ? o.card : o.back).tx.setAttribute('transform', tf);
    // eyes
    o.eyesG.setAttribute('opacity', f3(A));
    o.eyesG.setAttribute('display', A > 0.01 ? 'inline' : 'none');
    var e = st.eye;
    o.eyes.forEach(function (ey) {
      ey.g.setAttribute('transform', 'translate(' + f1(ey.s * 6.4 + e.px * 0.4) + ',' + f1(-9 + e.py * 0.3) + ') scale(' + f3(e.big) + ')');
      ey.inner.setAttribute('transform', 'scale(1,' + f3(Math.max(0.06, e.open * (1 - e.happy))) + ')');
      ey.inner.setAttribute('opacity', e.happy > 0.5 ? 0 : 1);
      ey.hp.setAttribute('opacity', e.happy > 0.5 ? 1 : 0);
      ey.pu.setAttribute('cx', f1(e.px)); ey.pu.setAttribute('cy', f1(e.py));
    });
    var m = st.mouth, my = 15, w = m.w, d;
    if (m.wavy) {
      d = 'M' + P2(-w, my) + 'q' + P2(w / 4, -2.2) + ' ' + P2(w / 2, 0) + 't' + P2(w / 2, 0) + 't' + P2(w / 2, 0) + 't' + P2(w / 2, 0);
      o.mouth.setAttribute('fill', 'none');
    } else if (m.o > 0.08) {
      d = 'M' + P2(-w, my) + 'Q' + P2(0, my - 1.5 * m.o - 2 * m.cv) + ' ' + P2(w, my) + 'Q' + P2(0, my + 5.5 * m.o + 3 * m.cv) + ' ' + P2(-w, my) + 'Z';
      o.mouth.setAttribute('fill', INK);
    } else {
      d = 'M' + P2(-w, my) + 'Q' + P2(0, my + 4 * m.cv) + ' ' + P2(w, my);
      o.mouth.setAttribute('fill', 'none');
    }
    o.mouth.setAttribute('d', d);
    // arms + hands (in chip space, not flipped)
    var a = st.arms, ag = base + ' scale(' + f3(s) + ')';
    o.armG.setAttribute('transform', ag); o.handG.setAttribute('transform', ag);
    o.armG.setAttribute('opacity', f3(a.a)); o.handG.setAttribute('opacity', f3(a.a));
    [a.l, a.r].forEach(function (h, i) {
      var sx = i ? 1 : -1, shx = sx * (CR - 4), shy = 2;
      var cx = (shx + h[0]) / 2 + sx * 6, cy = (shy + h[1]) / 2 + 3;
      o.arms[i].setAttribute('d', 'M' + P2(shx, shy) + 'Q' + P2(cx, cy) + ' ' + P2(h[0], h[1]));
      o.hands[i].setAttribute('cx', f1(h[0])); o.hands[i].setAttribute('cy', f1(h[1]));
    });
    return [X, Y, s];
  }

  // arm poses (chip-local, hands)
  var POSE = {
    rest: [[-CR - 2, 8], [CR + 2, 8]],
    up: [[-CR - 9, -CR - 7], [CR + 9, -CR - 7]],
    hold: [[-13, 16], [13, 16]],
    shrug: [[-CR - 13, -5], [CR + 13, -5]],
    hips: [[-CR - 5, 4], [CR + 5, 4]]
  };
  function mixPose(a, b, u) { return { l: [lerp(a[0][0], b[0][0], u), lerp(a[0][1], b[0][1], u)], r: [lerp(a[1][0], b[1][0], u), lerp(a[1][1], b[1][1], u)] }; }

  function lookAt(c, x, y, mag) {
    var dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy);
    if (d < 1) return [0, 0];
    return [dx / d * mag, dy / d * mag];
  }
  function alive(t, c) { return eio(seg(t, 380 + 60 * c.k, 700 + 60 * c.k)) * (1 - eio(seg(t, 6500, 6850))); }
  function chipPop(t, c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }

  // ---------- crowd fan ----------
  function crowdState(t, c, L) {
    var T = L.target, pop = chipPop(t, c);
    var st = { dx: 0, dy: 0, rot: 0, sqx: 1, sqy: 1, th: 0, lift: 0, pop: pop, card: false, A: alive(t, c) };
    var u = (t - c.ws) / WD, up = 0;
    // anticipation crouch
    var cr = bump(u, -0.18, -0.04, -0.02, 0.06);
    st.sqx = 1 + 0.07 * cr; st.sqy = 1 - 0.09 * cr;
    if (u > -0.02 && u < 1.4) {
      up = eoC(seg(u, 0, 0.22)) * (1 - ei(seg(u, 0.72, 0.95)));
      st.th = 2 * Math.PI * eio(seg(u, 0.18, 0.78));
      var land = u - 0.95; if (land > 0) { var q = Math.exp(-land * 6) * Math.cos(land * 28); st.sqx *= 1 + 0.06 * q; st.sqy *= 1 - 0.07 * q; }
      st.sqy *= 1 + 0.08 * Math.sin(Math.PI * seg(u, 0, 0.25));
    }
    st.lift = up;
    st.s = pop * (1 + 0.24 * up);
    // eyes: watch the wave head, then look ahead, then stare at Nate
    var head = waveHead(L, t), pl = lookAt(c, head[0], head[1], 1.7);
    var lastC = L.all[L.all.length - 1], ahead = lookAt(c, lastC.x + 60, lastC.y, 1.4);
    var after = eio(seg(t, L.waveEnd - 200, L.waveEnd + 100));
    var dist = Math.hypot(c.x - T.x, c.y - T.y);
    var stare = eio(seg(t, 4130 + dist * 0.35, 4260 + dist * 0.35)) * (1 - eio(seg(t, 6150 + dist * 0.3, 6400 + dist * 0.3)));
    var ns = lookAt(c, T.x, T.y, 1.9);
    var px = lerp(lerp(pl[0], ahead[0], after), ns[0], stare), py = lerp(lerp(pl[1], ahead[1], after), ns[1], stare);
    st.dx = ns[0] * 0.7 * stare; st.dy = ns[1] * 0.7 * stare;
    var shock = bump(t, SLAP - 20, SLAP + 60, 4900, 5300);
    var open = blink(t, c.ph) * (1 - eio(seg(t, 6380, 6520)));
    st.eye = { px: px, py: py, big: 1 + 0.08 * stare + 0.14 * shock, open: open, happy: up > 0.25 ? 1 : 0 };
    st.mouth = up > 0.15 ? { w: 3.4, o: 1, cv: 0 } : { w: 2.6 + 0.6 * shock, o: shock > 0.4 ? 0.6 : 0, cv: shock > 0.4 ? 0 : 0.35 };
    var ap = up > 0 ? eoC(seg(u, 0, 0.2)) * (1 - eio(seg(u, 0.7, 0.92))) : 0;
    var arms = mixPose(POSE.rest, POSE.up, ap);
    arms.a = clamp(ap * 4);
    st.arms = arms;
    return st;
  }

  // ---------- Nate ----------
  var NK = {
    lift: [[0, 0], [4100, 0], [4260, 1, eoC], [4380, 1.08], [4410, 0.86, eoC], [4480, 1], [4570, 1.02], [4720, 0, ei],
           [5750, 0], [5900, 0.3, eoC], [5960, 0.32], [6050, 0, ei]],
    th: [[0, 0], [4130, 0], [4390, Math.PI, eio], [4470, Math.PI], [4700, 3 * Math.PI, eio]],
    rot: [[0, 0], [3950, 0], [4250, -10], [4450, 8], [4700, 0], [5350, 0], [5500, 8, eoC], [5650, 6], [5760, 0], [5900, -4], [6050, 0]]
  };
  function nateState(t, L) {
    var c = L.target, pop = chipPop(t, c);
    var st = { dx: 0, dy: 0, rot: kf(NK.rot, t), sqx: 1, sqy: 1, th: kf(NK.th, t), lift: 0, pop: pop, card: t >= SLAP + 20, A: alive(t, c) };
    var lift = kf(NK.lift, t);
    st.lift = clamp(lift);
    // chewing (before realising)
    var chewW = 1 - seg(t, 3250, 3330), ph = (t % 560) / 560;
    var chew = Math.sin(ph * Math.PI * 2);
    st.rot += 2.5 * Math.sin(t / 1000 * Math.PI * 1.6) * chewW;
    st.sqy *= 1 + 0.015 * chew * chewW;
    // gulp
    var gulp = bump(t, 3790, 3830, 3850, 3900);
    st.sqx *= 1 + 0.06 * gulp; st.sqy *= 1 - 0.05 * gulp;
    // crouch before launch
    var cr = bump(t, 3950, 4060, 4090, 4130);
    st.sqx *= 1 + 0.1 * cr; st.sqy *= 1 - 0.13 * cr;
    // slap squash in the air
    var sl = bump(t, SLAP - 10, SLAP + 20, SLAP + 50, SLAP + 120);
    st.sqx *= 1 + 0.12 * sl; st.sqy *= 1 - 0.14 * sl;
    // landings
    [[4720, 0.1], [6050, 0.11]].forEach(function (L2) {
      var d = t - L2[0]; if (d >= 0 && d < 500) { var q = Math.exp(-d / 95) * Math.cos(2 * Math.PI * 4.5 * d / 1000); st.sqx *= 1 + L2[1] * q; st.sqy *= 1 - L2[1] * q; }
    });
    // shrug bob
    var sh = bump(t, 5350, 5450, 5640, 5760);
    st.dy -= 3 * sh;
    // proud puff
    var proud = bump(t, 5750, 5880, 5960, 6050);
    st.s = pop * (1 + 0.3 * lift) * (1 + 0.05 * proud);

    // eyes
    var hold0 = 1 - eio(seg(t, 3360, 3440));        // blissful closed eyes until he notices
    var lastC = L.all[L.all.length - 1], firstC = L.all[0];
    var la = lookAt(c, lastC.x + 60, lastC.y, 1.9), lb = lookAt(c, firstC.x - 60, firstC.y, 1.9);
    var px = kf([[0, 0], [3440, 0], [3530, la[0], eoC], [3640, la[0]], [3720, lb[0], eoC], [3800, 0, eoC], [5000, 0], [5100, 0], [5250, 0], [5350, 0], [5450, 1.8], [5700, 1.8], [5800, 0]], t);
    var py = kf([[0, 0], [3440, 0], [3530, la[1], eoC], [3640, la[1]], [3720, lb[1], eoC], [3800, 0, eoC], [5000, 0], [5100, 2.3, eoC], [5250, 2.3], [5330, -0.8, eoC], [5450, 0.6], [5700, 0.6], [5800, 0]], t);
    var wide = bump(t, 3720, 3800, 4720, 4800) * 0.25 + bump(t, 4720, 4760, 5300, 5380) * 0.3 + bump(t, 3420, 3460, 3700, 3720) * 0.1;
    var open = 1;
    if (t > 3440 && t < 3950) open = blink(t, 900);
    open *= 1 - 0.45 * bump(t, 5380, 5460, 5650, 5740);              // shrug: half-lidded
    open *= 1 - bump(t, SLAP - 10, SLAP + 10, SLAP + 60, SLAP + 110); // squeezed shut at the slap
    open *= 1 - eio(seg(t, 6380, 6520));
    var happy = (hold0 > 0.5 && t < 3440) || (t > 5800 && t < 6250) ? 1 : 0;
    st.eye = { px: px, py: py, big: 1 + wide, open: open, happy: happy };

    // mouth
    if (t < 3330) st.mouth = { w: 3, o: ph < 0.5 ? 0.25 + 0.35 * Math.abs(chew) : 0, cv: ph < 0.5 ? 0 : 0.5 };
    else if (t < 3790) st.mouth = { w: 3.4, o: 0, cv: 0.1 };
    else if (t < 3950) st.mouth = { w: 2.2, o: 0, cv: -0.3 };
    else if (t < 4720) st.mouth = { w: 4, o: 1.1, cv: 0 };
    else if (t < 5350) st.mouth = { w: 2.6, o: 0.55, cv: 0 };
    else if (t < 5750) st.mouth = { w: 4.2, o: 0, cv: 0, wavy: 1 };
    else st.mouth = { w: 4.6, o: t < 6300 ? 0.55 : 0, cv: 1 };

    // arms
    var arms;
    if (t < 3880) { arms = mixPose(POSE.hold, POSE.hold, 0); arms.l[1] += 0; }
    else if (t < 3950) arms = mixPose(POSE.hold, POSE.up, eoC(seg(t, 3880, 3950)) * 0.4);
    else if (t < 4760) {
      arms = mixPose(POSE.rest, POSE.up, eoC(seg(t, 3950, 4130)) * (1 - eio(seg(t, 4640, 4760))));
      var fl = seg(t, 4100, 4180) * (1 - seg(t, 4600, 4700));
      arms.l[0] += 6 * fl * Math.sin(t * 0.075); arms.l[1] += 7 * fl * Math.cos(t * 0.09);
      arms.r[0] += 6 * fl * Math.sin(t * 0.083 + 2); arms.r[1] += 7 * fl * Math.cos(t * 0.07 + 1);
    } else if (t < 5350) arms = mixPose(POSE.rest, POSE.rest, 0);
    else if (t < 5750) arms = mixPose(POSE.rest, POSE.shrug, eoC(seg(t, 5350, 5450)) * (1 - eio(seg(t, 5650, 5750))));
    else arms = mixPose(POSE.rest, POSE.hips, eoC(seg(t, 5760, 5860)) * (1 - eio(seg(t, 6050, 6200))));
    var aa = t < 3880 ? 1 : t < 4760 ? 1 : t < 5350 ? 1 - seg(t, 4760, 4860) : t < 5750 ? seg(t, 5350, 5420) * (1 - seg(t, 5700, 5760)) : seg(t, 5760, 5800) * (1 - seg(t, 6100, 6200));
    arms.a = clamp(aa) * clamp(st.A * 3);
    if (t < 3880) {
      // hands follow the hot dog
      var hb = t < 3330 ? (ph < 0.25 ? Math.sin(ph / 0.25 * Math.PI) : 0) : 0;
      arms.l[1] -= 5 * hb; arms.r[1] -= 5 * hb;
      st.hdY = 17 - 5 * hb;
    }
    st.arms = arms;
    return st;
  }

  // foam finger keys: wrist x, y, rotation (180 = pointing down the table), z (nearness)
  function fingerAt(S, t) {
    var L = S.L, T = L.target, c0 = L.all[0];
    // opening cue: keyframe the fingertip point, derive the wrist
    var R = kf([[0, 228], [600, 228], [1000, 212, eoC], [1250, 212]], t), Z = 1;
    var gx = kf([[0, c0.x + 300], [600, c0.x + 300], [1000, c0.x + 34, eoC]], t), gy = kf([[0, c0.y - 330], [600, c0.y - 330], [1000, c0.y - 34, eoC]], t);
    var pm = Math.sin(Math.PI * seg(t, 1010, 1120)) + Math.sin(Math.PI * seg(t, 1130, 1240));
    Z += 0.13 * pm; gy -= 6 * pm;
    if (t > 1250) {
      var head = waveHead(L, Math.min(t, 1800)), u = eio(seg(t, 1250, 1450));
      gx = lerp(gx, head[0] + 34, u); gy = lerp(gy, head[1] - 34, u);
      var ex = eio(seg(t, 1650, 2050));
      gx = lerp(gx, gx + 260, ex); gy = lerp(gy, -330, ex); R = lerp(R, 236, ex);
    }
    var o0 = rotv(0, -84, R), X = gx - o0[0] * Z, Y = gy - o0[1] * Z;
    var vis = t < 2100 || t > 3800;
    if (t >= 3800) {
      // keyframe the point under the fingertip (card centre) + rotation; wrist is derived
      var sd = T.x > 230 ? 0.45 : 1;
      R = kf([[3800, 232], [4230, 208, eoC], [4330, 210], [SLAP, 196, ei], [SLAP + 70, 196], [4620, 226, eoC], [5850, 228], [6400, 240, eio]], t);
      R = 180 + sd * (R - 180);
      Z = kf([[3800, 1.1], [4230, 1], [4330, 1.06], [SLAP, 1.0, ei], [SLAP + 70, 1.0], [4620, 1.04]], t);
      var gx = T.x + sd * kf([[3800, 260], [4230, 22, eoC], [4330, 30], [SLAP, 0, ei], [SLAP + 70, 0], [4620, 46, eoC], [5850, 50], [6400, 330, eio]], t);
      gy = kf([[3800, T.y - 330], [4230, T.y - 34, eoC], [4330, T.y - 44], [SLAP, T.y, ei], [SLAP + 70, T.y], [4620, T.y - 44, eoC], [5850, T.y - 46], [6400, T.y - 420, eio]], t);
      var off = rotv(0, -CARD_OFF, R);
      X = gx - off[0] * Z; Y = gy - off[1] * Z;
      // satisfied pumps after the slap, and while Nate sits proudly
      var p1 = Math.sin(Math.PI * seg(t, 4650, 4780)) + Math.sin(Math.PI * seg(t, 5880, 6000));
      Z += 0.1 * p1; Y += 7 * p1;
      Y += 3 * Math.sin(t / 1000 * Math.PI * 2 * 0.8) * seg(t, 4800, 5000);
    }
    return { x: X, y: Y, r: R, z: Z, vis: vis && t < 6450 };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = L.target, V = S.V;

    // camera: gentle push-in on Nate's row that keeps neighbouring rows in frame
    var zk = eioC(seg(t, 3200, 3800)) * (1 - eioC(seg(t, 6300, 7000)));
    var ZM = 1.14, Z = lerp(1, ZM, zk);
    var fy = clamp(T.y - 20, H / (2 * ZM) - 10, 600 - H / (2 * ZM) + 20);
    var ccy = lerp(H / 2, fy, zk);
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-W / 2) + ',' + (-ccy).toFixed(2) + ')');

    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });

    // crowd; a chip mid-wave is raised above its neighbours
    S.chips.forEach(function (o) {
      var st = crowdState(t, o.c, L);
      applyChip(o, st);
    });

    // Nate
    var ns = nateState(t, L), P = applyChip(V, ns);
    // hot dog: held, then flung over the shoulder
    var tossU = seg(t, 3880, 4380);
    if (t < 3880) {
      var hy = ns.hdY || 17, v = rotv(0, hy, ns.rot);
      V.hd.setAttribute('transform', 'translate(' + P2(P[0] + v[0] * P[2], P[1] + v[1] * P[2]) + ') rotate(' + f1(ns.rot - 8) + ') scale(' + f3(P[2]) + ')');
      V.hd.setAttribute('opacity', P[2] > 0.05 ? 1 : 0);
      V.bite.setAttribute('opacity', t > 1700 ? 1 : 0);
    } else if (tossU < 1) {
      var ux = eo(tossU), x = T.x + 230 * ux, y = T.y + 17 - 170 * tossU + 90 * tossU * tossU;
      V.hd.setAttribute('transform', 'translate(' + P2(x, y) + ') rotate(' + f1(-8 + 760 * tossU) + ') scale(' + f3(1 + 1.1 * tossU) + ')');
      V.hd.setAttribute('opacity', 1);
    } else V.hd.setAttribute('opacity', 0);
    // sweat drop
    var sw = eoC(seg(t, 3640, 3760)) * (1 - eio(seg(t, 5750, 5880)));
    var swy = 3 * seg(t, 4720, 5300);
    S.sweat.setAttribute('opacity', f3(sw * (t > 3950 && t < 4720 ? 0 : 1)));
    S.sweat.setAttribute('transform', 'translate(' + P2(P[0] + 21 * P[2], P[1] - 19 * P[2] + swy) + ') scale(' + f3(0.6 + 0.4 * sw) + ')');

    // slap ticks
    var td = '';
    [[SLAP, 1], [4720, 0.6]].forEach(function (e) {
      var p = seg(t, e[0], e[0] + 260);
      if (p <= 0 || p >= 1) return;
      var R0 = (e[1] > 0.8 ? 30 : 27) + 12 * eoC(p), R1 = R0 + 8 * e[1] * (1 - p);
      [-160, -125, -55, -20, 20, 160].forEach(function (a) {
        var aa = a * Math.PI / 180;
        td += 'M' + P2(T.x + Math.cos(aa) * R0, T.y + Math.sin(aa) * R0) + 'L' + P2(T.x + Math.cos(aa) * R1, T.y + Math.sin(aa) * R1);
      });
    });
    S.ticks.setAttribute('d', td);

    // set-down ring + dust (proud sit)
    var rp = seg(t, 6050, 6550);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 6050, 6330);
    if (dp > 0 && dp < 1) {
      var dd = '', r0 = 27 + 9 * eoC(dp), r1b = r0 + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + P2(T.x + Math.cos(a) * r0, T.y + Math.sin(a) * r0) + 'L' + P2(T.x + Math.cos(a) * r1b, T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // foam finger
    var F = fingerAt(S, t);
    if (!F.vis) {
      S.finger.setAttribute('display', 'none'); S.fShadow.setAttribute('display', 'none');
    } else {
      S.finger.setAttribute('display', 'inline'); S.fShadow.setAttribute('display', 'inline');
      var hgt = clamp((F.z - 0.95) * 4, 0, 1.2) + 0.35;
      S.finger.setAttribute('transform', 'translate(' + P2(F.x, F.y) + ') rotate(' + f1(F.r) + ') scale(' + f3(F.z) + ')');
      S.fShadow.setAttribute('transform', 'translate(' + P2(F.x + 6 + 10 * hgt, F.y + 8 + 16 * hgt) + ') rotate(' + f1(F.r) + ') scale(' + f3(F.z) + ')');
      S.fTxt.setAttribute('transform', 'translate(2,6) rotate(' + f1(-F.r) + ')');
    }
    // the card-stunt card, pinned under the fingertip until it is slapped on
    var cardOn = t > 3800 && t < SLAP + 20;
    if (cardOn) {
      var cv = rotv(0, -CARD_OFF, F.r), cx = F.x + cv[0] * F.z, cy = F.y + cv[1] * F.z;
      var csz = F.z * (t > SLAP - 80 ? lerp(1, P[2], seg(t, SLAP - 80, SLAP)) : 1);
      S.cardG.setAttribute('display', 'inline'); S.cardSh.setAttribute('display', 'inline');
      S.cardG.setAttribute('transform', 'translate(' + P2(cx, cy) + ') rotate(' + f1(F.r - 180) + ') scale(' + f3(csz) + ')');
      S.cardSh.setAttribute('cx', f1(cx + 9)); S.cardSh.setAttribute('cy', f1(cy + 14)); S.cardSh.setAttribute('r', f1(CR * csz));
    } else { S.cardG.setAttribute('display', 'none'); S.cardSh.setAttribute('display', 'none'); }

    var lp = seg(t, 7400, 7850);
    S.line.setAttribute('opacity', f1(eo(lp) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lp, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2wave;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2wave = S;
    return S;
  }

  window.CCSteal2_wave = {
    title: 'The Wave',
    blurb: 'The chips do a stadium wave; Nate’s, busy with a hot dog, misses it, and in his frantic solo catch-up flip the dealer’s foam finger slaps a card-stunt card on his back, so he lands in Nick’s colours.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2wave = S;
      var token = {};
      root.__cc2waveToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2waveToken !== token) { resolve(); return; }
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
