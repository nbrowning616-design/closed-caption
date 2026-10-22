/* Closed Caption steal film: polaroid (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE SNAPSHOT (instant camera)
 *
 * Everyone knows the instant-photo ritual: flash, whirr, the square print slides out, you
 * shake it, and the picture slowly develops out of murky grey. Here the flash bleaches
 * Nate's chip to grey... and as the photo develops in the dealer's colour, so does the chip.
 *
 * Storyboard (ms) - top-down felt table, caption rows.
 *    0- 700  Table deals in: rows drop in, chips pop on.
 *  650-1250  Camera eases in (whole rows stay in frame). Others dim; Nate's chip hop-shivers.
 * 1000-1550  A chunky instant camera (stripe in the dealer's colour) swoops up from below
 *            and hovers beside the chip, shadow on the felt, gentle bob.
 * 1250-1600  The chip wakes up: swells a little, its initial gives way to a simple face,
 *            blinks, spots the camera.
 * 1600-1950  The camera turns to aim at the chip (3/4 yaw), lens zooms out with a twist.
 * 1950-2380  Chip plays it cool: looks away, lids at half-mast, whistles, sways; sweat drop;
 *            a sneaky glance back.
 * 2380-2800  ...then strikes a pose: squash, lean toward the lens, wink + big grin, sparkles.
 * 2620-2800  Camera anticipation: squashes, shutter button goes down.
 * 2800-3200  CLICK - white flash burst. The chip squeezes its eyes; it is bleached white,
 *            settling to murky grey (overexposed). Pose snaps back with a wobble.
 * 2950-3650  Whirr: the camera vibrates, turns back square, and ejects the square print.
 * 3300-3650  Chip looks down at itself: grey! Eyes wide.
 * 3500-4350  A white-gloved hand reaches in, pinches the print's border, tugs it free and
 *            raises it beside the chip; the camera backs off and watches.
 * 4350-5750  THE SHAKE. The print is shaken (motion ghosts); the image develops from murk:
 *            the posing chip appears - in the dealer's colour. The real chip develops in
 *            perfect sync, grey -> dealer colour (jiggling along). Chip checks itself, then
 *            the photo again.
 * 5750-6150  Beat: both fully developed. Chip gives us a sheepish half-lidded smile.
 * 6100-6550  The hand tucks the print away off-screen.
 * 6150-6350  The face settles back into a chip: the dealer's initial develops in.
 * 6300-6950  Chip lifts... plonks down in exactly its spot: squash, ring flash, dust ticks.
 * 6450-6950  Camera hops and sinks down onto its shadow, gone.
 * 6600-7150  Camera eases back out; table undims.
 * 7150-7400  Stillness.
 * 7400-10000 "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', GREY = '#8E8B86', BODY = '#F5F1E8', SIDE = '#D9D1C3', DARK = '#3A3532';
  var SLEEVE = '#34303D';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, T_END = 10000;
  var SLOT = 23.4, PH = 52, DEPTH = 26;
  var T_FLASH = 2800, T_PLUCK = 3920, D0 = 4350, D1 = 5750;
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
  // vector keyframes [[t, [a,b,..]], ...]
  function kfv(keys, t) {
    var n = keys[0][1].length, out = [];
    for (var k = 0; k < n; k++) out.push(kf(keys.map(function (q) { return [q[0], q[1][k]]; }), t));
    return out;
  }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function circleD(x, y, r) { return 'M' + f1(x - r) + ' ' + f1(y) + 'a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
  function hexRgb(h) {
    h = String(h || '#888888').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16); if (isNaN(n)) n = 0x888888;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  function star(r) { return 'M0 ' + f1(-r) + 'Q0 0 ' + f1(r) + ' 0Q0 0 0 ' + f1(r) + 'Q0 0 ' + f1(-r) + ' 0Q0 0 0 ' + f1(-r) + 'Z'; }

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

  // ---------- camera (prop) pose ----------
  function camPose(P, t) {
    var x = P.camX, y = P.camY, s = 1, rot = 0, op = 1, sx = P.sx;
    // swoop up from below
    var pr = seg(t, 1000, 1550);
    y = lerp(P.camY0, P.camY, backOut(pr, 1.15));
    x = lerp(P.camX + sx * 40, P.camX, eoC(pr));
    rot = sx * 16 * (1 - eo(pr)) + spring(t - 1450, -sx * 5, 1.8, 220);
    // hover bob
    y += 1.8 * Math.sin(2 * Math.PI * (t - 1550) / 1500) * seg(t, 1500, 1800);
    // back off after the pluck, tilt to watch the print
    var q = eio(seg(t, 3950, 4450));
    x = lerp(x, P.camX + sx * 12, q); y = lerp(y, P.driftY, q); s = lerp(1, 0.82, q); rot += -sx * 7 * q * (P.driftUp ? -1 : 1);
    // squash: click anticipation + recoil
    var sqy = 1 - 0.07 * eio(seg(t, 2620, 2780)) * (1 - seg(t, 2800, 2801)) + spring(t - 2800, 0.09, 4.5, 110);
    var sqx = 1 + 0.04 * eio(seg(t, 2620, 2780)) * (1 - seg(t, 2800, 2801)) - spring(t - 2800, 0.05, 4.5, 110);
    // whirr vibration
    var vib = seg(t, 2950, 3020) * (1 - seg(t, 3600, 3680));
    x += vib * 1.1 * Math.sin(t * 0.95); rot += vib * 1.4 * Math.sin(t * 0.63 + 1);
    // little tug recoil when the print is pulled free
    y += spring(t - T_PLUCK, 3, 5, 90);
    // sink away onto its shadow
    s *= 1 + 0.07 * Math.sin(Math.PI * seg(t, 6450, 6570));
    var sk = ei(seg(t, 6530, 6950));
    s *= lerp(1, 0.22, sk);
    op = 1 - seg(t, 6800, 6950);
    var yaw = 0.62 * backOut(seg(t, 1600, 1900), 1.6) * (1 - eio(seg(t, 2950, 3250)));
    var zoomL = eio(seg(t, 1750, 1980)) * (1 - eio(seg(t, 3000, 3300)));
    return { x: x, y: y, s: s, rot: rot, op: op, yaw: yaw, sqx: sqx, sqy: sqy, alt: 1 - sk, zoomL: zoomL };
  }
  function camToWorld(C, sx, lx, ly) {
    var c = Math.cos(C.yaw), sn = Math.sin(C.yaw);
    var fx = -sx * DEPTH * sn / 2 + lx * c; // through yaw
    var X = fx * C.s * C.sqx, Y = ly * C.s * C.sqy;
    var r = C.rot * Math.PI / 180;
    return [C.x + X * Math.cos(r) - Y * Math.sin(r), C.y + X * Math.sin(r) + Y * Math.cos(r)];
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-polaroid-' + (++uid) + '-';
    var L = layout(opts), T = L.target;
    var sx = T.x >= 250 ? -1 : 1;
    var camX = T.x + sx * 92, camY = T.y - 6;
    var driftUp = T.row > 0;
    var P = {
      sx: sx, camX: camX, camY: camY, camY0: Math.max(camY + 430, 820), driftUp: driftUp,
      driftY: driftUp ? T.y - 112 : T.y + 128, P2: [T.x + sx * 79, T.y + 40], PS2: 1.45
    };
    var dealerCol = opts.dealerColor || '#E8559E', victimCol = T.color || opts.victimColor || '#2F6FE0';

    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', style: 'display:block;width:100%;height:100%' }, root);
    var defs = mk('defs', {}, svg);
    var gr = mk('radialGradient', { id: id + 'felt', cx: '50%', cy: '42%', r: '70%' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#317659' }, gr); mk('stop', { offset: '1', 'stop-color': '#24594A' }, gr);
    var ic = mk('clipPath', { id: id + 'img', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('rect', { x: -18, y: -48, width: 36, height: 36 }, ic);
    var sc = mk('clipPath', { id: id + 'slot', clipPathUnits: 'userSpaceOnUse' }, defs);
    mk('rect', { x: -40, y: SLOT, width: 80, height: 200 }, sc);

    // ---- the print (photo-local: origin = bottom centre) ----
    var photo = mk('g', { id: id + 'photo' }, defs);
    mk('rect', { x: -22, y: -PH, width: 44, height: PH, rx: 1.6, fill: '#FDFBF5', stroke: INK, 'stroke-width': 1.5 }, photo);
    var img = mk('g', { 'clip-path': 'url(#' + id + 'img)' }, photo);
    mk('rect', { x: -18, y: -48, width: 36, height: 36, fill: '#2B6A53' }, img);
    mk('rect', { x: -26, y: -41.5, width: 52, height: 23, rx: 4, fill: PAPER, stroke: INK, 'stroke-width': 0.9 }, img);
    var pc = mk('g', { transform: 'translate(0,-30) rotate(' + (sx * 14) + ')' }, img);
    mk('circle', { r: 10, fill: dealerCol, stroke: INK, 'stroke-width': 1.3 }, pc);
    mk('circle', { r: 7, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 0.8, 'stroke-dasharray': '1.6 1.4' }, pc);
    // wink + grin
    var wl = -sx * 3.3;
    mk('path', { d: 'M' + f1(wl - 2) + ' -1.6Q' + f1(wl) + ' -4 ' + f1(wl + 2) + ' -1.6', fill: 'none', stroke: INK, 'stroke-width': 1.1, 'stroke-linecap': 'round' }, pc);
    mk('circle', { cx: -wl, cy: -2.2, r: 2.3, fill: '#FFFFFF', stroke: INK, 'stroke-width': 0.8 }, pc);
    mk('circle', { cx: -wl + sx * 0.8, cy: -2.3, r: 1.2, fill: INK }, pc);
    mk('path', { d: 'M-3.6 2.2Q0 2 3.6 2.2Q0 7.6 -3.6 2.2Z', fill: INK }, pc);
    [[-sx * 12.5, -41, 2.6], [-sx * 13.5, -23, 1.9], [sx * 12.5, -42.5, 1.7]].forEach(function (s) {
      mk('path', { d: star(s[2]), transform: 'translate(' + s[0] + ',' + s[1] + ')', fill: '#FFFFFF', stroke: INK, 'stroke-width': 0.5 }, img);
    });
    var sepia = mk('rect', { x: -18, y: -48, width: 36, height: 36, fill: '#C7B08E', opacity: 0 }, img);
    var murk = mk('rect', { x: -18, y: -48, width: 36, height: 36, fill: '#4D5155', opacity: 1 }, img);
    mk('path', { d: 'M-18 -30L0 -48M-18 -20L10 -48', stroke: '#FFFFFF', 'stroke-opacity': 0.12, 'stroke-width': 3 }, img);
    mk('rect', { x: -18, y: -48, width: 36, height: 36, fill: 'none', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 0.8 }, photo);

    function usePhoto(parent, attrs) {
      var u = mk('use', Object.assign({ href: '#' + id + 'photo' }, attrs || {}), parent);
      u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id + 'photo');
      return u;
    }

    // ---- table ----
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
      return g;
    }

    var rowsG = [], chipsG = [];
    var cardLayer = mk('g', {}, cam), chipLayer = mk('g', {}, cam);
    L.rows.forEach(function (r) {
      var g = mk('g', {}, cardLayer);
      mk('rect', { x: 30, y: f1(r.y + 4), width: W - 60, height: f1(r.h), rx: 14, fill: INK, opacity: 0.22 }, g);
      mk('rect', { x: 30, y: f1(r.y), width: W - 60, height: f1(r.h), rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, g);
      mk('circle', { cx: 70, cy: f1(r.mid), r: 18.5, fill: INK }, g);
      var t = mk('text', { x: 70, y: f1(r.mid + 0.5), 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: PAPER, 'font-family': FONT, 'font-weight': 700, 'font-size': r.label.length > 1 ? 15 : 19 }, g);
      t.textContent = r.label;
      rowsG.push(g);
      r.chips.forEach(function (c) {
        if (c.target) return;
        var wrap = mk('g', {}, chipLayer);
        var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        var cg = mk('g', {}, wrap); makeChip(cg, c.color, c.ini);
        chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
      });
    });

    // ---- the victim chip (single chip; colour set per frame) ----
    var V = {};
    V.wrap = mk('g', {}, chipLayer);
    V.sh = mk('circle', { r: CR, fill: INK, opacity: 0.28 }, V.wrap);
    V.g = mk('g', {}, V.wrap);
    V.disc = mk('circle', { r: CR, fill: victimCol, stroke: INK, 'stroke-width': 2.6 }, V.g);
    V.ring = mk('circle', { r: 15.5, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, V.g);
    mk('ellipse', { cx: -8, cy: -10, rx: 6.5, ry: 3.4, fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 -8 -10)' }, V.g);
    function txt(s) {
      var e = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': s.length > 1 ? 15 : 18 }, V.g);
      e.textContent = s; return e;
    }
    V.tv = txt(T.ini); V.td = txt(L.ini(opts.dealer || 'D'));
    V.face = mk('g', {}, V.g);
    V.eyes = [0, 1].map(function () {
      return {
        white: mk('circle', { r: 5.2, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.6 }, V.face),
        pup: mk('circle', { r: 2.6, fill: INK }, V.face),
        glint: mk('circle', { r: 0.9, fill: '#FFFFFF' }, V.face),
        lid: mk('path', { fill: 'currentColor', stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, V.face),
        shut: mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, V.face)
      };
    });
    V.mouth = mk('path', { fill: INK, stroke: INK, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, V.face);
    V.sweat = mk('path', { d: 'M0 -4.5Q3.6 0.6 0 2.6Q-3.6 0.6 0 -4.5Z', fill: '#BFE5F6', stroke: INK, 'stroke-width': 1 }, V.g);
    V.sparks = [[-sx * 32, -22, 5.4, 0], [-sx * 6, -38, 4, 60], [-sx * 36, 14, 3.6, 120]].map(function (s) {
      return { s: s, p: mk('path', { d: star(s[2]), fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.1 }, chipLayer) };
    });

    var ripple = mk('circle', { fill: 'none', stroke: dealerCol, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // ---- instant camera ----
    var camShadow = mk('ellipse', { rx: 40, ry: 9, fill: INK, opacity: 0.22 }, cam);
    var camG = mk('g', {}, cam);
    var sideFace = mk('path', { fill: SIDE, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, camG);
    var front = mk('g', {}, camG);
    var btn = mk('rect', { x: 23, y: -26, width: 12, height: 7, rx: 3, fill: DARK, stroke: INK, 'stroke-width': 1.8 }, front);
    mk('path', { d: 'M-35 -20L-29 -42Q-28 -45 -25 -45L25 -45Q28 -45 29 -42L35 -20Z', fill: BODY, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, front);
    mk('rect', { x: -44, y: -22, width: 88, height: 54, rx: 9, fill: BODY, stroke: INK, 'stroke-width': 2.6 }, front);
    mk('rect', { x: -42.7, y: 16, width: 85.4, height: 14.7, rx: 7, fill: DARK }, front);
    mk('path', { d: 'M-42.7 16H42.7', stroke: INK, 'stroke-width': 1.6 }, front);
    mk('rect', { x: -5, y: -44, width: 10, height: 60, fill: dealerCol }, front);
    mk('path', { d: 'M-5 -44V16M5 -44V16', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 1 }, front);
    mk('path', { d: 'M-40 -14Q-40 -19 -35 -19H-14', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.9, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, front);
    var flashWin = mk('rect', { x: -27, y: -40, width: 20, height: 13, rx: 2, fill: '#FFF2C4', stroke: INK, 'stroke-width': 1.6 }, front);
    mk('path', { d: 'M-22 -40V-27M-17 -40V-27M-12 -40V-27', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 0.9 }, front);
    mk('rect', { x: 11, y: -40, width: 12, height: 10, rx: 2.6, fill: '#26221F', stroke: INK, 'stroke-width': 1.4 }, front);
    mk('circle', { cx: 14.5, cy: -36.8, r: 1.4, fill: '#FFFFFF', opacity: 0.7 }, front);
    var lens = mk('g', {}, front);
    mk('circle', { r: 19.5, fill: '#2B2725', stroke: INK, 'stroke-width': 2.4 }, lens);
    var ticks = mk('circle', { r: 17, fill: 'none', stroke: '#9A928A', 'stroke-width': 2.2, 'stroke-dasharray': '1.4 3' }, lens);
    mk('circle', { r: 14, fill: '#57514B', stroke: INK, 'stroke-width': 1.4 }, lens);
    mk('circle', { r: 10, fill: '#18212D', stroke: INK, 'stroke-width': 1.2 }, lens);
    mk('ellipse', { cx: -3.6, cy: -3.8, rx: 4.2, ry: 2.6, fill: '#FFFFFF', opacity: 0.55, transform: 'rotate(-35 -3.6 -3.8)' }, lens);
    mk('circle', { cx: 4, cy: 4, r: 1.5, fill: '#FFFFFF', opacity: 0.4 }, lens);
    mk('rect', { x: -24, y: SLOT - 1.75, width: 48, height: 3.5, rx: 1.75, fill: '#100D0C' }, front);
    var slotPhoto = usePhoto(mk('g', { 'clip-path': 'url(#' + id + 'slot)' }, front));
    var whirr = mk('path', { d: 'M-52 -8Q-56 2 -52 12M-58 -4Q-61 2 -58 8M52 -8Q56 2 52 12M58 -4Q61 2 58 8', fill: 'none', stroke: PAPER, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, camG);
    var clickTicks = mk('path', { d: 'M29 -32L31 -38M35 -31L39 -36M22 -32L20 -37', fill: 'none', stroke: PAPER, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, camG);

    // ---- print in the world + hand ----
    var handLayer = mk('g', {}, cam);
    var ghosts = [usePhoto(handLayer, { opacity: 0 }), usePhoto(handLayer, { opacity: 0 })];
    var wPhoto = usePhoto(handLayer);
    var hand = mk('g', {}, handLayer);
    var hm = mk('g', { transform: sx === 1 ? '' : 'scale(-1,1)' }, hand);
    mk('path', { d: 'M36 17L330 105', stroke: INK, 'stroke-width': 25, 'stroke-linecap': 'round' }, hm);
    mk('path', { d: 'M36 17L330 105', stroke: SLEEVE, 'stroke-width': 20, 'stroke-linecap': 'round' }, hm);
    mk('rect', { x: -6, y: -13, width: 12, height: 26, rx: 4, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2, transform: 'translate(32,15) rotate(-18)' }, hm);
    [[5, 12, 5.4], [9, 18, 5.1], [15.5, 21, 4.7]].forEach(function (c) { mk('circle', { cx: c[0], cy: c[1], r: c[2], fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.9 }, hm); });
    mk('ellipse', { cx: 18, cy: 9, rx: 13.5, ry: 11.5, fill: '#FFFFFF', stroke: INK, 'stroke-width': 2.1, transform: 'rotate(-20 18 9)' }, hm);
    mk('path', { d: 'M16 5l3 6M21 3l3 6M26 3.5l2.6 5', fill: 'none', stroke: INK, 'stroke-opacity': 0.5, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, hm);
    var thumb = mk('path', { d: 'M20 1C13 -6 4 -7 0 -3C-2 0 1 3 5 2.6C10 2.2 15 3.4 19 6Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.9, 'stroke-linejoin': 'round' }, hm);

    var burst = mk('g', { opacity: 0 }, cam);
    var burstC = mk('circle', { r: 10, fill: '#FFFFFF' }, burst);
    var burstL = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round' }, burst);

    var flash = mk('rect', { x: 0, y: 0, width: W, height: H, fill: '#FFFFFF', opacity: 0 }, svg);
    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // face direction table (chip-local unit vectors)
    var LK = { us: [0, 0], cam: [sx * 0.95, -0.2], away: [-sx * 0.72, -0.68], down: [0.05, 0.95], photo: [sx * 0.97, 0.05] };
    var looks = [
      [0, 'us'], [1520, 'us'], [1640, 'cam'], [1960, 'cam'], [2060, 'away'], [2270, 'away'], [2310, 'cam'], [2350, 'cam'], [2520, 'cam'],
      [2800, 'cam'], [2900, 'us'], [3300, 'us'], [3400, 'down'], [3560, 'down'], [3700, 'photo'], [5080, 'photo'], [5180, 'down'], [5420, 'down'], [5520, 'photo'],
      [5780, 'photo'], [5900, 'us']
    ].map(function (k) { return [k[0], LK[k[1]]]; });

    return {
      opts: opts, L: L, P: P, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, ripple: ripple, dust: dust,
      camShadow: camShadow, camG: camG, sideFace: sideFace, front: front, btn: btn, flashWin: flashWin, lens: lens, ticks: ticks,
      slotPhoto: slotPhoto, whirr: whirr, clickTicks: clickTicks, ghosts: ghosts, wPhoto: wPhoto, hand: hand, thumb: thumb,
      burst: burst, burstC: burstC, burstL: burstL, flash: flash, line: line, murk: murk, sepia: sepia, looks: looks,
      dealerCol: dealerCol, victimCol: victimCol
    };
  }

  // ---------- hand + print path ----------
  function handPose(S, t) {
    var P = S.P, sx = P.sx;
    var C = camPose(P, Math.min(t, T_PLUCK));
    var p1 = camToWorld(C, sx, 0, SLOT + PH - 6);
    var s1 = C.s;
    var start = [sx > 0 ? W + 130 : -130, p1[1] + 70];
    var x, y, ang = 0, ps = s1, hs = 1.2, held = t >= T_PLUCK;
    if (t < 3850) {
      var q = eoC(seg(t, 3500, 3850));
      x = lerp(start[0], p1[0], q); y = lerp(start[1], p1[1], q) - 14 * Math.sin(Math.PI * q);
      ang = -sx * 12 * (1 - q);
    } else if (t < T_PLUCK) { x = p1[0]; y = p1[1]; }
    else {
      var tug = eo(seg(t, T_PLUCK, 4040)) * (1 - eio(seg(t, 4040, 4120)));
      var c = eioC(seg(t, 4060, 4380));
      var a0 = [p1[0], p1[1] + 7 * tug], P2 = P.P2;
      x = lerp(a0[0], P2[0], c); y = lerp(a0[1], P2[1], c) - 18 * Math.sin(Math.PI * c);
      ps = lerp(s1, P.PS2, eio(c)); hs = lerp(1.2, 1.3, c);
      ang = sx * 8 * tug - sx * 6 * Math.sin(Math.PI * c);
      // the shake
      var env = seg(t, D0, D0 + 120) * (1 - seg(t, D1 - 180, D1));
      var ph = 2 * Math.PI * 6.2 * (t - D0) / 1000;
      ang += env * 15 * Math.sin(ph);
      x += env * 3.5 * Math.sin(ph + 0.7);
      ang += spring(t - D1, sx * 3, 2.5, 160);
      // present, then tuck away
      y -= 4 * eio(seg(t, D1, 5950)) * (1 - seg(t, 6100, 6200));
      var e = eioC(seg(t, 6100, 6560));
      var end = [sx > 0 ? W + 160 : -160, P2[1] + 70];
      x = lerp(x, end[0], e); y = lerp(y, end[1], e) - 10 * Math.sin(Math.PI * e);
      ang += sx * 22 * e; ps = lerp(ps, 1.15, e);
    }
    var pinch = clamp(seg(t, 3820, 3900) * (1 - seg(t, 6480, 6560)));
    return { x: x, y: y, ang: ang, ps: ps, hs: hs, held: held, pinch: pinch };
  }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var P = S.P, L = S.L, T = L.target, V = S.V, sx = P.sx;

    // viewing camera: gentle push in, every chip stays in frame
    var zk = eioC(seg(t, 650, 1250)) * (1 - eioC(seg(t, 6600, 7150)));
    var Z = 1 + 0.18 * zk;
    var ccx = W / 2;
    var ccy = clamp(lerp(H / 2, T.y + 8, zk), H / (2 * Z), H - H / (2 * Z));
    S.cam.setAttribute('transform', 'translate(' + W / 2 + ',' + H / 2 + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 800, 1100)) * (1 - eio(seg(t, 6650, 7100)));
    S.chipsG.forEach(function (o) {
      var s = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + s.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * s));
      o.wrap.setAttribute('opacity', (1 - 0.5 * dim).toFixed(3));
    });

    // ---- development progress (shared by print and chip) ----
    var d = eio(seg(t, D0 + 80, D1 - 100));

    // ---- victim chip ----
    var s = chipPop(T), sxx = 1, syy = 1, dx = 0, dy = 0, tilt = 0, lift = 0;
    // singled out: hop + shiver
    var hp = seg(t, 850, 1150);
    if (hp > 0 && hp < 1) { dy = -7 * Math.sin(Math.PI * hp); dx = 1.6 * Math.sin((t - 850) * 0.15) * (1 - hp); }
    // wakes up: swells into a character
    var alive = backOut(seg(t, 1250, 1500), 2) * (1 - eio(seg(t, 6320, 6440)));
    s *= 1 + 0.22 * alive;
    // casual sway
    var cas = seg(t, 1960, 2060) * (1 - seg(t, 2300, 2380));
    tilt += cas * 4 * Math.sin(2 * Math.PI * (t - 1960) / 420);
    dx += cas * 1.4 * Math.sin(2 * Math.PI * (t - 1960) / 420);
    // pose: squash, then lean to the lens + stretch
    var an = eio(seg(t, 2380, 2470)) * (1 - seg(t, 2470, 2540));
    syy *= 1 - 0.12 * an; sxx *= 1 + 0.08 * an;
    var pose = backOut(seg(t, 2470, 2600), 2.2) * (1 - seg(t, T_FLASH, T_FLASH + 1));
    tilt += sx * 14 * pose;
    var st = Math.sin(Math.PI * seg(t, 2470, 2620));
    syy *= 1 + 0.08 * st; sxx *= 1 - 0.05 * st;
    // flash recoil: snaps back upright with a wobble, squeezed
    if (t >= T_FLASH) {
      tilt += sx * 14 * Math.exp(-(t - T_FLASH) / 90) * Math.cos(2 * Math.PI * 3.2 * (t - T_FLASH) / 1000);
      var fq = Math.exp(-(t - T_FLASH) / 120);
      syy *= 1 - 0.1 * fq; sxx *= 1 + 0.06 * fq;
    }
    // dismay jolt when it sees it's grey
    dy += -spring(t - 3400, 3, 3, 120);
    // jiggles along with the shaking print
    var shk = seg(t, D0, D0 + 150) * (1 - seg(t, D1 - 200, D1));
    dx += shk * 1.3 * Math.sin(2 * Math.PI * 6.2 * (t - D0) / 1000 + 0.4);
    tilt += shk * 3 * Math.sin(2 * Math.PI * 6.2 * (t - D0) / 1000);
    // the set-down: lift... plonk
    var lp = eo(seg(t, 6300, 6420)), dp = ei(seg(t, 6420, 6470));
    if (t >= 6300 && t < 6470) { s *= 1 + 0.08 * lp * (1 - dp); lift = 6 * lp * (1 - dp); dy -= 3 * lp * (1 - dp); }
    if (t >= 6470) { var dd = t - 6470; var sq = 0.1 * Math.exp(-dd / 110) * Math.cos(2 * Math.PI * 4.5 * dd / 1000); sxx *= 1 + sq; syy *= 1 - sq * 0.6; }
    var tr = 'translate(' + f1(T.x + dx) + ',' + f1(T.y + dy) + ') rotate(' + f1(tilt) + ') scale(' + f3(s * sxx) + ',' + f3(s * syy) + ')';
    V.g.setAttribute('transform', tr);
    V.sh.setAttribute('r', f1(CR * Math.min(s, 1.3)));
    V.sh.setAttribute('cx', f1(T.x + 1.5 + dx + lift * 0.4 + alive * 1.5)); V.sh.setAttribute('cy', f1(T.y + 3.5 + lift + alive * 3));
    V.sh.setAttribute('opacity', f1(28 - lift * 1.5) / 100);

    // colour: victim -> (flash) white -> murky grey -> develops to dealer colour
    var col, ringOp = 0.85;
    if (t < T_FLASH) col = S.victimCol;
    else if (t < D0) { col = mix('#FFFFFF', GREY, eio(seg(t, T_FLASH + 60, 3250))); ringOp = lerp(0.85, 0.35, seg(t, T_FLASH, 3250)); }
    else { col = mix(GREY, S.dealerCol, d); ringOp = lerp(0.35, 0.85, d); }
    V.disc.setAttribute('fill', col);
    V.ring.setAttribute('stroke-opacity', f1(ringOp * 100) / 100);
    V.face.setAttribute('color', col);
    var faceOp = seg(t, 1290, 1420) * (1 - seg(t, 6160, 6250));
    V.face.setAttribute('opacity', f3(faceOp));
    V.tv.setAttribute('opacity', f3(1 - seg(t, 1250, 1380)));
    var tdp = seg(t, 6235, 6400);
    V.td.setAttribute('opacity', f3(eo(tdp)));
    V.td.setAttribute('transform', 'scale(' + f3(tdp <= 0 ? 0.6 : lerp(0.6, 1, backOut(tdp, 2.4))) + ')');

    // ---- face ----
    if (faceOp > 0.001) {
      var lv = kfv(S.looks, t);
      var es = 1 + spring(t - 1600, 0.14, 4.5, 110) + 0.2 * eo(seg(t, 3380, 3470)) * (1 - eio(seg(t, 3650, 3900))) + 0.12 * eo(seg(t, 5180, 5260)) * (1 - eio(seg(t, 5420, 5600)));
      var both = kf([[0, 1], [1360, 1], [1470, 0], [1960, 0], [2060, 0.45], [2290, 0.45], [2330, 0], [2780, 0], [2800, 1], [2990, 1], [3080, 0.1], [3180, 0.1], [3220, 1], [3270, 0.05],
        [3380, 0], [3700, 0], [3760, 0.18], [5150, 0.18], [5190, 0], [5480, 0], [5560, 0.18], [5880, 0.2], [5960, 0.42], [6150, 0.42]], t);
      var wink = kf([[2470, 0], [2540, 1], [2780, 1], [2800, 1]], t) * (t < T_FLASH ? 1 : 0);
      var squeeze = t >= T_FLASH && t < 2990;
      var happy = t >= 2470 && t < T_FLASH;
      // left eye (screen) is the winking one on the far side from the camera
      [-1, 1].forEach(function (side, i) {
        var E = [side * 7.2, -4.5], Eo = V.eyes[i], r = 5.2 * es;
        var lid = both;
        if (side === -sx) lid = Math.max(lid, wink);
        if (squeeze || lid >= 0.93) {
          Eo.white.setAttribute('opacity', 0); Eo.pup.setAttribute('opacity', 0); Eo.glint.setAttribute('opacity', 0); Eo.lid.setAttribute('d', '');
          var dsh;
          if (squeeze) { var k = side; dsh = 'M' + f1(E[0] - k * 3.4) + ' ' + f1(E[1] - 3.2) + 'L' + f1(E[0] + k * 2.6) + ' ' + f1(E[1]) + 'L' + f1(E[0] - k * 3.4) + ' ' + f1(E[1] + 3.2); }
          else if (happy) dsh = 'M' + f1(E[0] - 4.4) + ' ' + f1(E[1] + 1.6) + 'Q' + f1(E[0]) + ' ' + f1(E[1] - 4.4) + ' ' + f1(E[0] + 4.4) + ' ' + f1(E[1] + 1.6);
          else dsh = 'M' + f1(E[0] - 4.4) + ' ' + f1(E[1]) + 'Q' + f1(E[0]) + ' ' + f1(E[1] + 3.4) + ' ' + f1(E[0] + 4.4) + ' ' + f1(E[1]);
          Eo.shut.setAttribute('d', dsh);
          return;
        }
        Eo.shut.setAttribute('d', '');
        Eo.white.setAttribute('opacity', 1); Eo.pup.setAttribute('opacity', 1); Eo.glint.setAttribute('opacity', 1);
        Eo.white.setAttribute('cx', E[0]); Eo.white.setAttribute('cy', E[1]); Eo.white.setAttribute('r', f1(r));
        var jit = shk * 0.35 * Math.sin(2 * Math.PI * 6.2 * (t - D0) / 1000 - 0.6);
        var px = E[0] + (lv[0] + jit) * (r - 2.7) * 0.85, py = E[1] + lv[1] * (r - 2.7) * 0.85;
        Eo.pup.setAttribute('cx', f1(px)); Eo.pup.setAttribute('cy', f1(py)); Eo.pup.setAttribute('r', f1(2.6 * Math.min(es, 1.1)));
        Eo.glint.setAttribute('cx', f1(px - 0.9)); Eo.glint.setAttribute('cy', f1(py - 0.9));
        if (lid <= 0.02) Eo.lid.setAttribute('d', '');
        else {
          var Ly = (-1 + 2 * lid) * r, dxl = Math.sqrt(Math.max(0, r * r - Ly * Ly));
          Eo.lid.setAttribute('d', 'M' + f1(E[0] - dxl) + ' ' + f1(E[1] + Ly) + 'A' + f1(r) + ' ' + f1(r) + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(E[0] + dxl) + ' ' + f1(E[1] + Ly) + 'Z');
        }
      });
      // mouth [halfWidth, cornerLift, upperCtl, lowerCtl] at y=8.5
      var m = kfv([[0, [3.8, 0.6, 0.6, 3]], [1560, [3.8, 0.6, 0.6, 3]], [1640, [2.4, 0, -2.6, 2.6]], [1940, [2.4, 0, -2.6, 2.6]],
        [2040, [1.8, 0, -1.9, 1.9]], [2300, [1.8, 0, -1.9, 1.9]], [2380, [3.4, -0.4, 0, 1.2]], [2470, [3.4, -0.4, 0, 1.2]], [2560, [7.4, 2.6, -0.6, 9]],
        [2790, [7.4, 2.6, -0.6, 9]], [2830, [5, 0, -0.5, 0.8]], [3200, [5, 0, -0.5, 0.8]], [3300, [3.8, -0.8, 0, 1.4]], [3380, [2.8, 0, -3.2, 3.2]],
        [3650, [2.8, 0, -3.2, 3.2]], [3800, [3.6, -1, 0, 1.3]], [5120, [3.6, -1, 0, 1.3]], [5200, [2.6, 0, -2.8, 2.8]], [5480, [2.6, 0, -2.8, 2.8]],
        [5600, [3.8, 0.4, 0.2, 2.6]], [5880, [3.8, 0.4, 0.2, 2.6]], [5980, [5.2, 1.6, 0.3, 3.6]]], t);
      var whistle = t > 2040 && t < 2300 ? 1.2 * Math.sin(2 * Math.PI * (t - 2040) / 260) : 0;
      var mx0 = sx * (t > 2000 && t < 2330 ? -2.2 : 0) + whistle * 0.3, my = 8.5;
      V.mouth.setAttribute('d', 'M' + f1(mx0 - m[0]) + ' ' + f1(my - m[1]) + 'Q' + f1(mx0) + ' ' + f1(my + m[2]) + ' ' + f1(mx0 + m[0]) + ' ' + f1(my - m[1]) +
        'Q' + f1(mx0) + ' ' + f1(my + m[3]) + ' ' + f1(mx0 - m[0]) + ' ' + f1(my - m[1]) + 'Z');
    }
    var swp = seg(t, 2120, 2420);
    V.sweat.setAttribute('opacity', swp > 0 && swp < 1 ? f3(Math.min(1, swp * 5) * (1 - seg(swp, 0.75, 1))) : 0);
    V.sweat.setAttribute('transform', 'translate(' + f1(-sx * 17) + ',' + f1(-15 + 9 * ei(swp)) + ')');
    V.sparks.forEach(function (o) {
      var a = seg(t, 2520 + o.s[3], 2640 + o.s[3]), live = a > 0 && t < T_FLASH + 40;
      var k = live ? backOut(a, 2.5) * (1 + 0.15 * Math.sin((t - 2520) / 50 + o.s[3])) : 0;
      o.p.setAttribute('opacity', live ? 1 : 0);
      o.p.setAttribute('transform', 'translate(' + f1(T.x + o.s[0] * 1.15) + ',' + f1(T.y + o.s[1] * 1.15) + ') rotate(' + f1((t - 2520) / 12) + ') scale(' + f3(k) + ')');
    });

    // set-down ring + dust
    var rp = seg(t, 6470, 6970);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dsp = seg(t, 6470, 6750);
    if (dsp > 0 && dsp < 1) {
      var dd2 = '', r0 = 27 + 9 * eoC(dsp), r1 = r0 + 6 * (1 - dsp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75, 1.1].forEach(function (a) {
        dd2 += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1) + ' ' + f1(T.y + Math.sin(a) * r1);
      });
      S.dust.setAttribute('d', dd2); S.dust.setAttribute('opacity', f1((1 - dsp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- instant camera ----
    var C = camPose(P, t);
    var vis = t > 1000 && C.op > 0.001;
    S.camG.setAttribute('opacity', vis ? f3(C.op) : 0);
    S.camShadow.setAttribute('opacity', vis ? f3(0.22 * C.op * (0.5 + 0.5 * C.alt)) : 0);
    if (vis) {
      S.camG.setAttribute('transform', 'translate(' + f1(C.x) + ',' + f1(C.y) + ') rotate(' + f1(C.rot) + ') scale(' + f3(C.s * C.sqx) + ',' + f3(C.s * C.sqy) + ')');
      var alt = C.alt;
      S.camShadow.setAttribute('cx', f1(C.x + 5 * alt * C.s));
      S.camShadow.setAttribute('cy', f1(C.y + (34 + 18 * alt) * C.s));
      S.camShadow.setAttribute('rx', f1(40 * C.s)); S.camShadow.setAttribute('ry', f1(9 * C.s));
      var c = Math.cos(C.yaw), sn = Math.sin(C.yaw), off = -sx * DEPTH * sn / 2, Ds = sx * DEPTH * sn;
      S.front.setAttribute('transform', 'translate(' + f1(off) + ',0) scale(' + f3(c) + ',1)');
      if (sn > 0.01) {
        var xe = off + sx * 44 * c, xh0 = off + sx * 35 * c, xh1 = off + sx * 26 * c, pd = 3 * sn;
        S.sideFace.setAttribute('d', 'M' + f1(xe) + ' -18L' + f1(xh0) + ' -20L' + f1(xh1) + ' -45L' + f1(xh1 + Ds) + ' ' + f1(-45 - pd) + 'L' + f1(xh0 + Ds) + ' ' + f1(-20 - pd) +
          'L' + f1(xe + Ds) + ' ' + f1(-18 - pd) + 'L' + f1(xe + Ds) + ' ' + f1(26 - pd) + 'Q' + f1(xe + Ds) + ' ' + f1(32 - pd) + ' ' + f1(xe + Ds * 0.6) + ' ' + f1(32 - pd * 0.6) + 'L' + f1(xe) + ' 32Z');
      } else S.sideFace.setAttribute('d', '');
      S.lens.setAttribute('transform', 'scale(' + f3(1 + 0.12 * C.zoomL) + ')');
      S.ticks.setAttribute('transform', 'rotate(' + f1(70 * C.zoomL) + ')');
      S.btn.setAttribute('transform', 'translate(0,' + f1(2.5 * eio(seg(t, 2640, 2780)) * (1 - seg(t, 2900, 3000))) + ')');
      var fw = seg(t, T_FLASH, 3150);
      S.flashWin.setAttribute('fill', t >= T_FLASH && fw < 1 ? '#FFFFFF' : '#FFF2C4');
      var e = seg(t, 3050, 3650), ej = eio(e) + 0.03 * Math.sin(e * Math.PI * 7) * Math.sin(Math.PI * e);
      S.slotPhoto.setAttribute('opacity', t >= 3050 && t < T_PLUCK ? 1 : 0);
      S.slotPhoto.setAttribute('transform', 'translate(0,' + f1(SLOT + ej * PH) + ')');
      var wr = seg(t, 2960, 3040) * (1 - seg(t, 3600, 3680));
      S.whirr.setAttribute('opacity', wr > 0 ? f3(wr * (0.55 + 0.45 * Math.sin(t * 0.08))) : 0);
      var ck = seg(t, T_FLASH, 3050);
      S.clickTicks.setAttribute('opacity', ck > 0 && ck < 1 ? f3(1 - ck) : 0);
    }

    // flash burst + whiteout
    var fb = seg(t, T_FLASH, 3150);
    if (t >= T_FLASH && fb < 1) {
      var fp = camToWorld(C, sx, -17, -33.5), rr = 8 + 60 * eoC(fb), bl = '';
      for (var k = 0; k < 10; k++) {
        var a = k * Math.PI / 5 + 0.3, r0b = 14 + 40 * eoC(fb), r1b = r0b + 16 * (1 - fb);
        bl += 'M' + f1(Math.cos(a) * r0b) + ' ' + f1(Math.sin(a) * r0b) + 'L' + f1(Math.cos(a) * r1b) + ' ' + f1(Math.sin(a) * r1b);
      }
      S.burst.setAttribute('transform', 'translate(' + f1(fp[0]) + ',' + f1(fp[1]) + ')');
      S.burstC.setAttribute('r', f1(rr)); S.burstC.setAttribute('opacity', f3(0.9 * (1 - fb)));
      S.burstL.setAttribute('d', bl);
      S.burst.setAttribute('opacity', 1);
    } else S.burst.setAttribute('opacity', 0);
    var fl = seg(t, T_FLASH, 3220);
    S.flash.setAttribute('opacity', t >= T_FLASH && fl < 1 ? f3(0.92 * Math.pow(1 - fl, 1.6)) : 0);

    // ---- the print: develop ----
    var dv = t < D0 ? 0 : d;
    S.murk.setAttribute('opacity', f3(1 - Math.pow(dv, 0.85)));
    S.sepia.setAttribute('opacity', f3(0.5 * Math.sin(Math.PI * dv)));

    // ---- hand & print ----
    var Hn = handPose(S, t);
    var handVis = t > 3500 && t < 6560;
    S.hand.setAttribute('opacity', handVis ? 1 : 0);
    if (handVis) {
      S.hand.setAttribute('transform', 'translate(' + f1(Hn.x) + ',' + f1(Hn.y) + ') rotate(' + f1(Hn.ang) + ') scale(' + f3(Hn.hs) + ')');
      S.thumb.setAttribute('transform', 'rotate(' + f1(-24 * (1 - Hn.pinch)) + ' 19 3)');
    }
    var pv = Hn.held && t < 6560;
    S.wPhoto.setAttribute('opacity', pv ? 1 : 0);
    function photoTr(x, y, ang, ps) { return 'translate(' + f1(x) + ',' + f1(y) + ') rotate(' + f1(ang) + ') scale(' + f3(ps) + ') translate(0,6)'; }
    if (pv) S.wPhoto.setAttribute('transform', photoTr(Hn.x, Hn.y, Hn.ang, Hn.ps));
    var gEnv = shk;
    [28, 56].forEach(function (lag, i) {
      var g = S.ghosts[i];
      if (gEnv > 0.05 && pv) {
        var Hg = handPose(S, t - lag);
        g.setAttribute('transform', photoTr(Hg.x, Hg.y, Hg.ang, Hg.ps));
        g.setAttribute('opacity', f3(gEnv * (i ? 0.13 : 0.26)));
      } else g.setAttribute('opacity', 0);
    });

    // final line
    var lq = seg(t, 7400, 7820);
    S.line.setAttribute('opacity', f1(eo(lq) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lq, 1.6)) * 14) + ')');
  }

  function getScene(root, opts) {
    var c = root.__cc2polaroid;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2polaroid = S;
    return S;
  }

  window.CCSteal2_polaroid = {
    title: 'The Snapshot',
    blurb: 'An instant camera flashes Nate’s posing chip grey; the print is shaken, and as the photo develops in Nick’s colour, so does the chip on the table.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2polaroid = S;
      var token = {};
      root.__cc2polaroidToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2polaroidToken !== token) { resolve(); return; }
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
