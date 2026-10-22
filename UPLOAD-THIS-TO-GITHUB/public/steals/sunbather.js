/* Closed Caption steal film: sunbather (built by the animation team, Oct 2026) */
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
