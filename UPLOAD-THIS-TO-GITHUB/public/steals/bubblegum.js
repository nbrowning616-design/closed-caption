/* Closed Caption steal film: bubblegum (built by the animation team, Oct 2026) */
/* Closed Caption - "steal" moment - concept: THE BUBBLE (bubblegum)
 *
 * Everyone knows what happens when a bubble pops too close: you get gum all over you.
 * Nick's chip is a cool little character chewing gum in his own colour; the gum ends up
 * coating Nate's chip, so of course Nate's chip is now Nick's colour.
 *
 * Storyboard (ms) - top-down felt table, caption rows 1/2/3/CC.
 *    0-  700  Table deals in: rows drop in, chips pop on.
 *  700- 1150  Camera eases in a touch (whole rows stay in frame). Other chips dim.
 *             Nate's chip blinks two little eyes open (label slides down), glances about.
 * 1150- 1950  Nick's chip (his colour, his initial, half-lidded eyes, chewing) rolls in
 *             from the right edge, spinning and hopping, eyes follow it in.
 * 1950- 2400  Skids to a stop right above Nate's chip: squash, wobble upright. Chews.
 *             Glances down at Nate (slow blink). Nate looks up at him. Worried brows.
 * 2400- 4400  THE BLOW: five puffs (inhale-stretch, blow-squash each time). The bubble
 *             swells from his lips, bigger, bigger, wobbling with squash-and-stretch,
 *             sliding down over Nate's chip. Nate looks up, eyes widen, glances at us,
 *             trembles, cowers, sweats as he's engulfed (seen through the bubble).
 * 4400- 4760  Tension: bubble strains past full, quivers faster, membrane thins.
 *             Nick's lids lift a hair. (He knows.)
 * 4760        POP. Burst ticks, tiny camera jolt; the bubble snaps down into a splat of
 *             gum all over Nate's chip; a strand runs up to a patch on Nick's face.
 * 4840- 5250  HELD BEAT. Total stillness. Nick blinks once, deadpan.
 * 5250- 5700  Nick leans back and peels the last bit off his face: the strand stretches,
 *             thins... snap. The bit flicks back into his mouth; the blob jiggles.
 * 5700- 6250  He resumes chewing, shrugs (stretch, tilt, eyes shut: "whatever").
 * 6250- 7000  Anticipation, then rolls off to the right, spinning.
 * 5300- 6500  Meanwhile the gum on Nate's chip settles: drips and specks slurp back in,
 *             lobes calm, it shrinks into a clean, glossy coat exactly on the chip.
 * 6450- 6900  The coat becomes a chip: dashed ring draws on, Nick's initial pops in.
 *             Plonk (squash) + ring flash + dust ticks, exactly in its original spot.
 * 6850- 7350  Camera eases back, other chips undim.
 * 7350- 7700  Stillness.
 * 7700-10000  "Nick stole Nate's chip." rises in and holds.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA';
  var FONT = 'Fredoka, Nunito, ui-rounded, system-ui, sans-serif';
  var W = 390, H = 700, CR = 22, NR = 25, T_END = 10000;
  var T_POP = 4760, HOLD_END = 5250;
  var PUFFS = [[2500, 9], [2950, 19], [3400, 30], [3850, 41], [4250, 50]];
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
  function springC(dt, amp, hz, decay) { return dt < 0 ? 0 : amp * Math.exp(-dt / decay) * Math.cos(2 * Math.PI * hz * dt / 1000); }
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
  // smooth closed path through points (Catmull-Rom -> cubic)
  function smoothClosed(p) {
    var n = p.length, d = 'M' + f1(p[0][0]) + ' ' + f1(p[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      d += 'C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d + 'Z';
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

  // ---------- chip drawing ----------
  function makeChip(parent, color, txt, r) {
    r = r || CR;
    var k = r / CR;
    var g = mk('g', {}, parent);
    mk('circle', { r: r, fill: color, stroke: INK, 'stroke-width': 2.6 }, g);
    var ring = mk('circle', { r: f1(15.5 * k), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.85, 'stroke-width': 1.6, 'stroke-dasharray': '3.4 3.1' }, g);
    mk('ellipse', { cx: f1(-8 * k), cy: f1(-10 * k), rx: f1(6.5 * k), ry: f1(3.4 * k), fill: '#FFFFFF', 'fill-opacity': 0.24, transform: 'rotate(-32 ' + f1(-8 * k) + ' ' + f1(-10 * k) + ')' }, g);
    var tx = mk('text', { x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#FFFFFF', 'font-family': FONT, 'font-weight': 700, 'font-size': txt.length > 1 ? 15 : 18 }, g);
    tx.textContent = txt;
    return { g: g, ring: ring, text: tx };
  }
  function makeEye(parent, r) {
    var g = mk('g', {}, parent);
    return {
      g: g, r: r,
      white: mk('circle', { r: r, fill: '#FFFFFF', stroke: INK, 'stroke-width': 1.5 }, g),
      pup: mk('circle', { r: f1(r * 0.5), fill: INK }, g),
      glint: mk('circle', { r: 0.8, fill: '#FFFFFF' }, g),
      lid: mk('path', { stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g)
    };
  }
  // lid: -1 open, 0 half, 1 closed. v: look vector (len<=1) in local coords. lidFill colour.
  function setEye(E, cx, cy, sc, v, lid, lidFill) {
    var r = E.r * sc;
    E.white.setAttribute('cx', f1(cx)); E.white.setAttribute('cy', f1(cy)); E.white.setAttribute('r', f1(r));
    var px = cx + v[0] * r * 0.45, py = cy + v[1] * r * 0.45;
    E.pup.setAttribute('cx', f1(px)); E.pup.setAttribute('cy', f1(py)); E.pup.setAttribute('r', f1(r * 0.5));
    E.glint.setAttribute('cx', f1(px - r * 0.18)); E.glint.setAttribute('cy', f1(py - r * 0.2));
    E.lid.setAttribute('fill', lidFill);
    var Ly = clamp(lid, -1, 1.05) * r;
    if (Ly <= -r + 0.05) E.lid.setAttribute('d', '');
    else if (Ly >= r - 0.05) E.lid.setAttribute('d', circleD(cx, cy, r + 0.3) + 'M' + f1(cx - r * 0.75) + ' ' + f1(cy + r * 0.25) + 'Q' + f1(cx) + ' ' + f1(cy + r * 0.7) + ' ' + f1(cx + r * 0.75) + ' ' + f1(cy + r * 0.25));
    else {
      var dx = Math.sqrt(r * r - Ly * Ly);
      E.lid.setAttribute('d', 'M' + f1(cx - dx) + ' ' + f1(cy + Ly) + 'A' + f1(r) + ' ' + f1(r) + ' 0 ' + (Ly > 0 ? 1 : 0) + ' 1 ' + f1(cx + dx) + ' ' + f1(cy + Ly) + 'Z');
    }
  }

  // ---------- build ----------
  function build(root, opts) {
    root.innerHTML = '';
    var id = 'cc2-bubblegum-' + (++uid) + '-';
    var L = layout(opts), T = L.target, ini = L.ini;
    var GUM = opts.dealerColor || '#E8559E';
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

    var rowsG = [], chipsG = [], V = {};
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
        var wrap = mk('g', {}, chipLayer);
        var sh = mk('circle', { r: CR, fill: INK, opacity: 0.28, cx: f1(c.x + 1.5), cy: f1(c.y + 3.5) }, wrap);
        if (c.target) {
          // Nate's chip, with a face that appears when singled out
          var ng = mk('g', {}, wrap);
          var chip = makeChip(ng, c.color, c.ini);
          var face = mk('g', {}, ng);
          var brows = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 1.7, 'stroke-linecap': 'round' }, face);
          var eyes = [makeEye(face, 4.3), makeEye(face, 4.3)];
          var sweat = mk('path', { fill: '#BFE6F5', stroke: INK, 'stroke-width': 1.2 }, ng);
          // final chip: dealer colour + dealer initial
          var fg = mk('g', {}, wrap);
          var fin = makeChip(fg, GUM, ini(opts.dealer));
          V = { wrap: wrap, sh: sh, ng: ng, chip: chip, face: face, brows: brows, eyes: eyes, sweat: sweat, fg: fg, fin: fin, c: c };
        } else {
          var cg = mk('g', {}, wrap); makeChip(cg, c.color, c.ini);
          chipsG.push({ wrap: wrap, g: cg, sh: sh, c: c });
        }
      });
    });

    // effects (world)
    var ripple = mk('circle', { fill: 'none', stroke: GUM, cx: T.x, cy: T.y, r: CR, opacity: 0 }, cam);
    var dust = mk('path', { fill: 'none', stroke: PAPER, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0 }, cam);

    // gum splat (on Nate's chip)
    var blobG = mk('g', {}, cam);
    var specks = mk('path', { fill: GUM, stroke: INK, 'stroke-width': 1.8 }, blobG);
    var blob = mk('path', { fill: GUM, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, blobG);
    var blobShine = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.45, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, blobG);
    var blobDot = mk('circle', { r: 2, fill: '#FFFFFF', 'fill-opacity': 0.6 }, blobG);

    // Nick's chip character
    var nShadow = mk('ellipse', { fill: INK, opacity: 0.28 }, cam);
    var strand = mk('path', { fill: GUM, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, cam);
    var nickG = mk('g', {}, cam);
    var nchip = makeChip(nickG, GUM, ini(opts.dealer), NR);
    nchip.ring.setAttribute('r', 20);
    nchip.text.setAttribute('y', -12.3); nchip.text.setAttribute('font-size', nchip.text.textContent.length > 1 ? 9.5 : 11);
    var nEyes = [makeEye(nickG, 4.7), makeEye(nickG, 4.7)];
    var mouthIn = mk('path', { fill: INK, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, nickG);
    var mouthGum = mk('circle', { r: 0, fill: GUM, stroke: INK, 'stroke-width': 1.2 }, nickG);
    var facePatch = mk('path', { fill: GUM, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, nickG);

    // bubble (above Nick, attached at his lips)
    var bubG = mk('g', {}, cam);
    var bub = mk('ellipse', { fill: GUM, 'fill-opacity': 0.55, stroke: INK, 'stroke-width': 2.4 }, bubG);
    var bubRim = mk('ellipse', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 2 }, bubG);
    var bubHi = mk('path', { fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': 0.8, 'stroke-width': 3, 'stroke-linecap': 'round' }, bubG);
    var bubDot = mk('circle', { r: 2, fill: '#FFFFFF', 'fill-opacity': 0.85 }, bubG);
    var lips = mk('circle', { r: 3.4, fill: GUM, stroke: INK, 'stroke-width': 1.6 }, cam);
    var burst = mk('path', { fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, cam);
    var flash = mk('path', { fill: GUM, 'fill-opacity': 0.22, stroke: GUM, 'stroke-width': 2, opacity: 0 }, cam);

    var line = mk('text', { x: W / 2, y: 640, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-family': FONT, 'font-weight': 600, 'font-size': 29, opacity: 0 }, svg);
    line.textContent = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'someone') + '’s chip.';
    if (line.textContent.length > 26) line.setAttribute('font-size', Math.max(16, Math.floor(29 * 26 / line.textContent.length)));

    // Nick rests just above Nate's chip; mouth points down at it.
    var Nx = T.x, Ny = Math.max(T.y - 56, 47);

    // blob tendrils (angles avoid straight up, where the strand is)
    var tend = [[0.25, 13, 0.16], [1.05, 9, 0.14], [1.75, 15, 0.13], [2.6, 10, 0.15], [3.35, 8, 0.14], [5.55, 11, 0.15]];
    var speckDef = [[0.6, 46, 3.2], [2.2, 48, 2.6], [2.95, 42, 2.2], [5.95, 44, 2.8], [4.0, 40, 1.8]];

    return {
      opts: opts, L: L, T: T, svg: svg, cam: cam, rowsG: rowsG, chipsG: chipsG, V: V, ripple: ripple, dust: dust,
      blobG: blobG, blob: blob, blobShine: blobShine, blobDot: blobDot, specks: specks, nShadow: nShadow, strand: strand, nickG: nickG, nchip: nchip,
      nEyes: nEyes, mouthIn: mouthIn, mouthGum: mouthGum, facePatch: facePatch, bub: bub, bubRim: bubRim, bubHi: bubHi, bubDot: bubDot, bubG: bubG,
      lips: lips, burst: burst, flash: flash, line: line, Nx: Nx, Ny: Ny, tend: tend, speckDef: speckDef, GUM: GUM
    };
  }

  // ---------- Nick's choreography ----------
  function nickState(S, t) {
    var Nx = S.Nx, Ny = S.Ny, x, y = Ny, rot = 0, sx = 1, sy = 1, hop = 0, vis = true;
    var X0 = W + 46, X1 = W + 70;
    if (t < 1150) { vis = false; x = X0; }
    else if (t < 7000) {
      var p = seg(t, 1150, 1950);
      var e = 1 - Math.pow(1 - p, 2.3);
      x = lerp(X0, Nx - 7, e) + (t > 1950 ? 7 - 7 * Math.exp(-(t - 1950) / 120) * Math.cos(2 * Math.PI * 2.2 * (t - 1950) / 1000) : 0);
      rot = (x - Nx) / NR * 180 / Math.PI;
      hop = Math.abs(Math.sin((X0 - x) / 34)) * (1 - seg(t, 1750, 1950));
      // exit
      if (t >= 6250) {
        var a = eio(seg(t, 6250, 6420)) * (1 - seg(t, 6420, 6500));
        var q = seg(t, 6420, 7000);
        x = Nx - 6 * a + (X1 - Nx) * Math.pow(q, 1.9);
        rot = (x - Nx) / NR * 180 / Math.PI;
        hop = Math.abs(Math.sin((x - Nx) / 30)) * seg(t, 6450, 6600);
        sx += 0.07 * a; sy -= 0.07 * a;
      }
    } else { vis = false; x = X1; }
    // landing squash (horizontal)
    var ls = springC(t - 1950, 0.13, 3.8, 120);
    sx += ls; sy -= ls * 0.9;
    // chew bob
    var ch = chewAmt(t);
    sy += 0.018 * ch * Math.sin(t / 1000 * 2 * Math.PI * 2.4 * 2);
    // inhale / blow per puff
    PUFFS.forEach(function (pf) {
      var Pt = pf[0];
      var inh = eio(seg(t, Pt - 230, Pt - 10)) * (1 - seg(t, Pt - 10, Pt + 30));
      sy += 0.07 * inh; sx -= 0.035 * inh;
      var bl = springC(t - Pt, 0.09, 3.5, 110) * (t >= Pt ? 1 : 0);
      sy -= bl; sx += bl * 0.7;
    });
    // tension: holds breath
    var tens = eio(seg(t, 4400, 4700));
    sy += 0.03 * tens * (t < T_POP ? 1 : 0);
    // pop recoil, frozen through hold
    if (t >= T_POP) {
      var rc = t < HOLD_END ? 1 : Math.exp(-(t - HOLD_END) / 90) * Math.cos(2 * Math.PI * 3 * (t - HOLD_END) / 1000);
      sy -= 0.1 * rc; sx += 0.06 * rc;
      y -= 4 * (t < HOLD_END ? eoC(seg(t, T_POP, T_POP + 50)) : 1);
    }
    // peel: lean back, strand stretches; snap at 5700
    if (t >= HOLD_END) {
      var pl = eio(seg(t, 5280, 5700));
      var post = t < 5700 ? 0 : eo(seg(t, 5700, 5790)) * 4 - 9 * eio(seg(t, 5790, 6150));
      var pdy = Math.min(15, Math.max(4, Ny - 44));
      x += (15 * pl + (t < 5700 ? 0 : 4 * eo(seg(t, 5700, 5790)))) * (1 - eio(seg(t, 5790, 6200))); y -= pdy * pl + post * pdy / 15;
      rot += -10 * pl * (1 - eio(seg(t, 5700, 5950))) + spring(t - 5700, 6, 3, 140);
      sy += 0.05 * pl * (1 - seg(t, 5700, 5760));
    }
    // shrug
    var sp = seg(t, 5930, 6230);
    if (sp > 0 && sp < 1) {
      sy += 0.13 * Math.sin(Math.PI * eio(seg(t, 5930, 6080))) - 0.05 * Math.sin(Math.PI * seg(t, 6080, 6230));
      sx -= 0.05 * Math.sin(Math.PI * eio(seg(t, 5930, 6080)));
      rot += 9 * Math.sin(2 * Math.PI * sp) * (1 - sp);
    }
    var s = 1 + 0.08 * hop;
    return { x: x, y: y, rot: rot, sx: sx * s, sy: sy * s, hop: hop, vis: vis };
  }
  function chewAmt(t) {
    return clamp(seg(t, 1150, 1250) * (1 - seg(t, 2330, 2420))) + clamp(seg(t, 5790, 5860) * (1 - seg(t, 5920, 5940))) + clamp(seg(t, 6180, 6260));
  }
  function toWorld(st, lx, ly) {
    var a = st.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    lx *= st.sx; ly *= st.sy;
    return [st.x + lx * c - ly * s, st.y + lx * s + ly * c];
  }
  function toLocalVec(st, vx, vy) {
    var a = -st.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [vx * c - vy * s, vx * s + vy * c];
  }
  function bubbleR(t) {
    if (t < PUFFS[0][0] - 20 || t >= T_POP) return 0;
    var r = 0, prev = 0;
    for (var i = 0; i < PUFFS.length; i++) {
      var Pt = PUFFS[i][0], tr = PUFFS[i][1];
      if (t >= Pt) { r = lerp(prev, tr, eoC(seg(t, Pt, Pt + 230))); prev = tr; }
    }
    // slow creep between puffs and final strain
    r += 1.2 * seg(t, PUFFS[0][0], 4250) * 0 + 5 * eio(seg(t, 4420, T_POP));
    return r;
  }
  function bubbleWobble(t) {
    var a = 0;
    PUFFS.forEach(function (pf, i) { a += springC(t - pf[0] - 60, 0.13 - i * 0.012, 3.2 + i * 0.3, 170); });
    var tens = seg(t, 4380, T_POP);
    a += 0.035 * tens * Math.sin(t / 1000 * 2 * Math.PI * (7 + 9 * tens));
    a += 0.015 * Math.sin(t / 1000 * 2 * Math.PI * 1.7);
    return a;
  }

  function lookVec(list, t, resolve) {
    var k = 0;
    for (var i = 0; i < list.length; i++) if (t >= list[i][0]) k = i;
    var b = resolve(list[k][1]);
    if (k === 0) return b;
    var a = resolve(list[k - 1][1]), p = clamp((t - list[k][0]) / (list[k][2] || 120));
    var q = backOut(p, 1.4);
    return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  }
  function unit(dx, dy) { var m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; }

  // ---------- render ----------
  function render(S, t) {
    t = clamp(t, 0, T_END);
    var L = S.L, T = S.T, V = S.V, GUM = S.GUM;

    // camera: gentle push, whole rows always in frame; small jolt at the pop
    var zk = eioC(seg(t, 700, 1150)) * (1 - eioC(seg(t, 6850, 7350)));
    var Z = lerp(1, 1.25, zk);
    var hz = H / (2 * Z);
    var ccx = lerp(W / 2, T.x > 250 ? 200 : 190, zk), ccy = lerp(H / 2, clamp(T.y - 24, hz, 612 - hz), zk);
    var jolt = t >= T_POP && t < T_POP + 160 ? Math.exp(-(t - T_POP) / 45) : 0;
    ccx += 2.6 * jolt * Math.sin((t - T_POP) * 0.21); ccy += 2.2 * jolt * Math.cos((t - T_POP) * 0.27);
    S.cam.setAttribute('transform', 'translate(' + (W / 2) + ',' + (H / 2) + ') scale(' + Z.toFixed(4) + ') translate(' + (-ccx).toFixed(2) + ',' + (-ccy).toFixed(2) + ')');

    // table intro
    S.rowsG.forEach(function (g, i) {
      var p = seg(t, 40 + 70 * i, 420 + 70 * i);
      g.setAttribute('transform', 'translate(0,' + f1((1 - backOut(p, 1.4)) * -16) + ')');
      g.setAttribute('opacity', f1(eo(p) * 100) / 100);
    });
    function chipPop(c) { var p = seg(t, 200 + 70 * c.row + 60 * c.j, 520 + 70 * c.row + 60 * c.j); return p <= 0 ? 0.001 : backOut(p, 2.2); }
    var dim = eio(seg(t, 850, 1100)) * (1 - eio(seg(t, 6900, 7350)));
    S.chipsG.forEach(function (o) {
      var sc = chipPop(o.c);
      o.g.setAttribute('transform', 'translate(' + o.c.x + ',' + o.c.y + ') scale(' + sc.toFixed(3) + ')');
      o.sh.setAttribute('r', f1(CR * sc));
      o.wrap.setAttribute('opacity', (1 - 0.55 * dim).toFixed(3));
    });

    var N = nickState(S, t);
    var mouthL = [0, 10.5];
    var mouthW = toWorld(N, mouthL[0], mouthL[1]);

    // ---- bubble ----
    var br = bubbleR(t), wob = bubbleWobble(t);
    var dir = unit(T.x - mouthW[0], T.y - mouthW[1]);
    var bcx = 0, bcy = 0, ry = 0, rx = 0;
    if (br > 0.5 && N.vis) {
      ry = br * (1 + wob); rx = br * (1 - wob * 0.85);
      bcx = mouthW[0] + dir[0] * ry * 0.93; bcy = mouthW[1] + dir[1] * ry * 0.93;
      var ang = Math.atan2(dir[1], dir[0]) * 180 / Math.PI - 90;
      var tr = 'translate(' + f1(bcx) + ',' + f1(bcy) + ') rotate(' + f1(ang) + ')';
      S.bub.setAttribute('transform', tr); S.bub.setAttribute('rx', f1(rx)); S.bub.setAttribute('ry', f1(ry));
      S.bub.setAttribute('fill-opacity', (0.58 - 0.16 * seg(t, 4300, T_POP)).toFixed(3));
      S.bubRim.setAttribute('transform', tr); S.bubRim.setAttribute('rx', f1(Math.max(0.1, rx - 3.5))); S.bubRim.setAttribute('ry', f1(Math.max(0.1, ry - 3.5)));
      var hr = Math.min(rx, ry) * 0.68;
      S.bubHi.setAttribute('d', 'M' + f1(bcx + hr * Math.cos(3.55)) + ' ' + f1(bcy + hr * Math.sin(3.55)) + 'A' + f1(hr) + ' ' + f1(hr) + ' 0 0 1 ' + f1(bcx + hr * Math.cos(4.35)) + ' ' + f1(bcy + hr * Math.sin(4.35)));
      S.bubHi.setAttribute('stroke-width', f1(clamp(br / 10, 1.2, 3.4)));
      S.bubDot.setAttribute('cx', f1(bcx + hr * Math.cos(4.75))); S.bubDot.setAttribute('cy', f1(bcy + hr * Math.sin(4.75)));
      S.bubDot.setAttribute('r', f1(clamp(br / 18, 0.6, 2.2)));
      S.bubG.setAttribute('opacity', 1);
    } else S.bubG.setAttribute('opacity', 0);

    // ---- Nate's chip ----
    var nsc = chipPop(T), ndx = 0, ndy = 0;
    // singled out: little hop-shiver
    if (t > 950 && t < 1250) { var hq = seg(t, 950, 1250); nsc *= 1 + 0.07 * Math.sin(Math.PI * hq); ndx = 1.4 * Math.sin((t - 950) * 0.12) * (1 - hq); }
    var trem = eio(seg(t, 3100, 4500)) * (t < T_POP ? 1 : 0);
    ndx += trem * 1.1 * Math.sin(t * 0.9); ndy += trem * 0.6 * Math.sin(t * 0.73 + 1);
    nsc *= 1 - 0.06 * eio(seg(t, 2900, 3700)) * (t < T_POP ? 1 : 0);
    nsc *= 1 + spring(t - 2050, 0.05, 4, 90); // flinch at Nick's skid
    var showNate = t < T_POP;
    V.ng.setAttribute('transform', 'translate(' + f1(T.x + ndx) + ',' + f1(T.y + ndy) + ') scale(' + nsc.toFixed(4) + ')');
    V.ng.setAttribute('opacity', showNate ? 1 : 0);
    var fp = eo(seg(t, 950, 1150));                 // face on
    var eyePop = t < 950 ? 0 : backOut(seg(t, 950, 1160), 2.4);
    V.chip.text.setAttribute('transform', 'translate(0,' + f1(10.5 * fp) + ') scale(' + f1((1 - 0.22 * fp) * 100) / 100 + ')');
    V.chip.ring.setAttribute('opacity', f1((1 - 0.6 * fp) * 100) / 100);
    var nateWide = 1 + 0.32 * eio(seg(t, 2900, 4400)) + spring(t - 2050, 0.25, 5, 70);
    var NateLooks = [[0, 'cam'], [1180, 'L', 140], [1350, 'nick', 160], [2150, 'nick', 100], [2560, 'bub', 140], [3250, 'cam', 130], [3550, 'bub', 120], [4000, 'cam', 110], [4200, 'bub', 110]];
    var nickPos = [N.x, N.y];
    var lv = lookVec(NateLooks, t, function (k) {
      if (k === 'cam') return [0, 0];
      if (k === 'L') return [0.9, -0.2];
      if (k === 'nick') return unit(nickPos[0] - T.x, nickPos[1] - T.y);
      if (k === 'bub') return [0.15, -1];
      return [0, 0];
    });
    var nLid = kf([[0, -1], [2280, -1], [2330, 1.05], [2400, -1], [3880, -1], [3920, 1.05], [3990, -1]], t);
    [-1, 1].forEach(function (sd, i) {
      setEye(V.eyes[i], sd * 6.6, -5.2, Math.max(0.001, eyePop) * nateWide, lv, nLid, V.c.color);
    });
    var bw = fp * (0.6 + 0.5 * eio(seg(t, 2050, 3300)));
    V.brows.setAttribute('d', fp > 0.01 ? 'M' + f1(-10.5) + ' ' + f1(-11.2 - 2.4 * nateWide + 2.2 * bw) + 'L' + f1(-3.6) + ' ' + f1(-11.2 - 2.4 * nateWide - 1.4 * bw) +
      'M' + f1(10.5) + ' ' + f1(-11.2 - 2.4 * nateWide + 2.2 * bw) + 'L' + f1(3.6) + ' ' + f1(-11.2 - 2.4 * nateWide - 1.4 * bw) : '');
    V.brows.setAttribute('opacity', f1(clamp(fp * 3 - 2) * 100) / 100);
    var swp = seg(t, 3500, 4600);
    if (swp > 0 && swp < 1 && showNate) {
      var sxw = 17.5 + 1.5 * swp, syw = -13 + 9 * eio(swp), ss = Math.min(1, swp * 6) * (1 - seg(swp, 0.85, 1));
      V.sweat.setAttribute('d', 'M' + f1(sxw) + ' ' + f1(syw - 5 * ss) + 'Q' + f1(sxw + 3.4 * ss) + ' ' + f1(syw + 0.5 * ss) + ' ' + f1(sxw) + ' ' + f1(syw + 2.6 * ss) + 'Q' + f1(sxw - 3.4 * ss) + ' ' + f1(syw + 0.5 * ss) + ' ' + f1(sxw) + ' ' + f1(syw - 5 * ss) + 'Z');
      V.sweat.setAttribute('opacity', 1);
    } else V.sweat.setAttribute('opacity', 0);

    // ---- gum splat on Nate's chip ----
    var showBlob = t >= T_POP && t < 6540;
    var finalIn = seg(t, 6440, 6540);
    if (t >= T_POP && t < 6560) {
      var col = eoC(seg(t, T_POP, T_POP + 90));               // collapse from bubble to splat
      var settle = eio(seg(t, 5320, 6450));
      var snapJig = spring(t - 5700, 0.09, 4, 140);
      var base = lerp(lerp(54, 30, col), 22.2, settle) * (1 + snapJig * (1 - settle));
      var amp = lerp(0.02, 0.11, col) * (1 - settle);
      var ten = col * (1 - eio(seg(t, 5350, 6200)));
      var pts = [], NP = 64;
      for (var k = 0; k < NP; k++) {
        var th = k / NP * Math.PI * 2;
        var r = base * (1 + amp * (0.5 * Math.sin(3 * th + 1) + 0.3 * Math.sin(5 * th + 2) + 0.25 * Math.sin(8 * th + 0.5)));
        S.tend.forEach(function (td) {
          var d = th - td[0]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
          r += td[1] * ten * Math.exp(-(d * d) / (td[2] * td[2]));
        });
        pts.push([T.x + r * Math.cos(th), T.y + r * Math.sin(th)]);
      }
      S.blob.setAttribute('d', smoothClosed(pts));
      var hb = base * 0.62;
      S.blobShine.setAttribute('d', 'M' + f1(T.x + hb * Math.cos(3.45)) + ' ' + f1(T.y + hb * Math.sin(3.45)) + 'A' + f1(hb) + ' ' + f1(hb) + ' 0 0 1 ' + f1(T.x + hb * Math.cos(4.3)) + ' ' + f1(T.y + hb * Math.sin(4.3)));
      S.blobDot.setAttribute('cx', f1(T.x + hb * Math.cos(4.7))); S.blobDot.setAttribute('cy', f1(T.y + hb * Math.sin(4.7)));
      // flung specks slide back in
      var sd = '', sk = eio(seg(t, 5380, 6150));
      S.speckDef.forEach(function (sp, i) {
        var rr = lerp(lerp(30, sp[1], eoC(seg(t, T_POP, T_POP + 70))), base - 2, sk), sr = sp[2] * (1 - 0.4 * sk);
        if (sk < 0.98) sd += circleD(T.x + rr * Math.cos(sp[0]), T.y + rr * Math.sin(sp[0]), sr);
      });
      S.specks.setAttribute('d', sd);
      S.blobG.setAttribute('opacity', f1((1 - finalIn) * 100) / 100);
    } else S.blobG.setAttribute('opacity', 0);

    // final chip: appears beneath the settled coat, ring + initial come in, then plonk
    var fsc = 1, fdy = 0;
    if (t >= 6800 && t < 7400) fsc = 1 - springC(t - 6800, 0.07, 4.5, 110);
    if (t >= 6640 && t < 6800) { var lq = eo(seg(t, 6640, 6740)) * (1 - ei(seg(t, 6740, 6800))); fsc = 1 + 0.08 * lq; fdy = -2.5 * lq; }
    V.fg.setAttribute('opacity', t >= 6440 ? 1 : 0);
    V.fg.setAttribute('transform', 'translate(' + f1(T.x) + ',' + f1(T.y + fdy) + ') scale(' + fsc.toFixed(4) + ')');
    V.fin.ring.setAttribute('opacity', f1(eo(seg(t, 6500, 6700)) * 100) / 100);
    V.fin.ring.setAttribute('stroke-dashoffset', f1(30 * (1 - eo(seg(t, 6500, 6700)))));
    var lp = seg(t, 6560, 6800);
    V.fin.text.setAttribute('transform', 'scale(' + (lp <= 0 ? 0.001 : backOut(lp, 2.6)).toFixed(3) + ')');
    var shOff = (fsc - 1) * 30;
    V.sh.setAttribute('r', f1(CR * Math.min(t < T_POP ? nsc : Math.max(fsc, t < 6440 ? 1 : fsc), 1.04)));
    V.sh.setAttribute('cx', f1(T.x + 1.5 + (t < T_POP ? ndx : 0))); V.sh.setAttribute('cy', f1(T.y + 3.5 + Math.max(0, shOff)));

    var rp = seg(t, 6800, 7300);
    S.ripple.setAttribute('r', f1(CR + 26 * eoC(rp)));
    S.ripple.setAttribute('opacity', rp > 0 && rp < 1 ? f1((1 - rp) * 85) / 100 : 0);
    S.ripple.setAttribute('stroke-width', f1(4 * (1 - rp) + 0.8));
    var dp = seg(t, 6800, 7080);
    if (dp > 0 && dp < 1) {
      var dd = '', r0 = 27 + 9 * eoC(dp), r1b = r0 + 6 * (1 - dp);
      [-2.5, -1.9, -0.65, -0.05, 2.2, 2.75].forEach(function (a) {
        dd += 'M' + f1(T.x + Math.cos(a) * r0) + ' ' + f1(T.y + Math.sin(a) * r0) + 'L' + f1(T.x + Math.cos(a) * r1b) + ' ' + f1(T.y + Math.sin(a) * r1b);
      });
      S.dust.setAttribute('d', dd); S.dust.setAttribute('opacity', f1((1 - dp) * 90) / 100);
    } else S.dust.setAttribute('opacity', 0);

    // ---- pop burst ----
    var pb = seg(t, T_POP, T_POP + 150);
    if (pb > 0 && pb < 1) {
      var bd = '', R0 = 58 + 14 * eoC(pb), R1 = R0 + 12 * (1 - pb);
      var c0 = [T.x, T.y - 2];
      for (var bi = 0; bi < 12; bi++) {
        var ba = bi / 12 * Math.PI * 2 + 0.13;
        bd += 'M' + f1(c0[0] + Math.cos(ba) * R0) + ' ' + f1(c0[1] + Math.sin(ba) * R0) + 'L' + f1(c0[0] + Math.cos(ba) * R1) + ' ' + f1(c0[1] + Math.sin(ba) * R1);
      }
      S.burst.setAttribute('d', bd); S.burst.setAttribute('opacity', f1((1 - ei(pb)) * 100) / 100);
      var fq = seg(t, T_POP, T_POP + 70), fd = '';
      for (var fi = 0; fi < 24; fi++) {
        var fa = fi / 24 * Math.PI * 2, fr = (fi % 2 ? 50 : 62) + 8 * eoC(fq);
        fd += (fi ? 'L' : 'M') + f1(c0[0] + Math.cos(fa) * fr) + ' ' + f1(c0[1] + Math.sin(fa) * fr);
      }
      S.flash.setAttribute('d', fd + 'Z'); S.flash.setAttribute('opacity', fq < 1 ? f1((1 - fq) * 100) / 100 : 0);
    } else { S.burst.setAttribute('opacity', 0); S.flash.setAttribute('opacity', 0); }

    // ---- Nick ----
    S.nickG.setAttribute('opacity', N.vis ? 1 : 0);
    S.nShadow.setAttribute('opacity', N.vis ? 0.28 - 0.1 * N.hop : 0);
    S.nickG.setAttribute('transform', 'translate(' + f1(N.x) + ',' + f1(N.y) + ') rotate(' + f1(N.rot) + ') scale(' + N.sx.toFixed(4) + ',' + N.sy.toFixed(4) + ')');
    S.nShadow.setAttribute('cx', f1(N.x + 1.5 + 3 * N.hop)); S.nShadow.setAttribute('cy', f1(N.y + 3.5 + 6 * N.hop));
    S.nShadow.setAttribute('rx', f1(NR * N.sx)); S.nShadow.setAttribute('ry', f1(NR * N.sy));

    // eyes
    var nickLooks = [[0, 'trav'], [1850, 'cam', 160], [2120, 'nate', 140], [2520, 'cam', 160], [3420, 'nate', 140], [3800, 'cam', 160], [4380, 'nate', 120], [T_POP, 'cam', 1], [5300, 'strand', 140], [5720, 'cam', 100], [6250, 'trav2', 140]];
    var nlv = lookVec(nickLooks, t, function (k) {
      if (k === 'cam') return [0, 0];
      if (k === 'trav') return toLocalVec(N, -1, 0);
      if (k === 'trav2') return toLocalVec(N, 1, 0);
      if (k === 'nate') { var u = unit(T.x - N.x, T.y - N.y); return toLocalVec(N, u[0], u[1]); }
      if (k === 'strand') return toLocalVec(N, 0.1, 1);
      return [0, 0];
    });
    var nLidV = kf([[0, 0.12], [2160, 0.12], [2210, 1.05], [2290, 1.05], [2370, 0.12], [4380, 0.12], [4560, -0.25], [T_POP - 1, -0.25], [T_POP, -1, function () { return 1; }],
      [4880, -1], [5060, 0.3], [5120, 0.3], [5160, 1.05], [5210, 1.05], [5250, 0.3], [5320, 0.55], [5700, 0.55], [5710, -0.7, function () { return 1; }], [5860, 0.12],
      [5940, 1.05], [6190, 1.05], [6280, 0.12]], t);
    [-1, 1].forEach(function (sd, i) {
      setEye(S.nEyes[i], sd * 7.6, -0.5, 1 + 0.12 * (nLidV < -0.5 ? (-nLidV - 0.5) * 2 : 0), nlv, nLidV + (i === 1 && t > 5320 && t < 5700 ? 0.25 : 0), GUM);
    });
    // mouth: chewing / puckered / flat
    var ch = chewAmt(t), cph = t / 1000 * 2 * Math.PI * 2.4;
    var blowing = t >= PUFFS[0][0] - 60 && t < T_POP;
    var pucker = clamp(seg(t, PUFFS[0][0] - 160, PUFFS[0][0] - 60) * (1 - seg(t, T_POP, T_POP + 1)));
    var mx = 1.8 * ch * Math.sin(cph), mh = 0.6 + 2.2 * ch * (0.5 + 0.5 * Math.sin(cph * 2)), mw = 5.2 - 1.2 * ch * Math.abs(Math.sin(cph));
    if (pucker > 0.01) {
      mw = lerp(mw, 2.4, pucker); mh = lerp(mh, 2.4, pucker); mx = lerp(mx, 0, pucker);
    }
    var my = mouthL[1];
    S.mouthIn.setAttribute('d', 'M' + f1(mx - mw) + ' ' + f1(my - 0.4) + 'Q' + f1(mx) + ' ' + f1(my - mh * 0.45 - 0.4) + ' ' + f1(mx + mw) + ' ' + f1(my - 0.4) + 'Q' + f1(mx) + ' ' + f1(my + mh) + ' ' + f1(mx - mw) + ' ' + f1(my - 0.4) + 'Z');
    // gum glimpsed while chewing
    S.mouthGum.setAttribute('cx', f1(mx + 1.2 * Math.sin(cph * 2))); S.mouthGum.setAttribute('cy', f1(my + 0.3));
    S.mouthGum.setAttribute('r', f1(ch * clamp(mh - 1.2, 0, 2.2)));
    // lips around the bubble neck
    if (blowing && br > 0.5) {
      S.lips.setAttribute('opacity', 1);
      S.lips.setAttribute('cx', f1(mouthW[0])); S.lips.setAttribute('cy', f1(mouthW[1]));
      S.lips.setAttribute('r', f1(2.6 + 0.6 * clamp(br / 20)));
    } else S.lips.setAttribute('opacity', 0);

    // gum patch on Nick's face + strand to the splat
    if (t >= T_POP && t < 5760) {
      var pk = eio(seg(t, 5300, 5700));
      var pcx = lerp(2.5, 0.5, pk), pcy = lerp(4, 10.5, pk), prr = lerp(11.5, 2.6, pk);
      var fpts = [];
      for (var q = 0; q < 24; q++) {
        var a = q / 24 * Math.PI * 2, rr2 = prr * (1 + 0.16 * Math.sin(3 * a + 0.7) + 0.09 * Math.sin(5 * a + 2));
        fpts.push([pcx + rr2 * Math.cos(a), pcy + rr2 * Math.sin(a) * 0.85]);
      }
      if (t >= 5700) { var fl = seg(t, 5700, 5760); fpts = fpts.map(function (p) { return [lerp(p[0], 0, fl), lerp(p[1], my, fl)]; }); }
      S.facePatch.setAttribute('d', smoothClosed(fpts));
      S.facePatch.setAttribute('opacity', 1);
    } else S.facePatch.setAttribute('opacity', 0);

    if (t >= T_POP && t < 5860) {
      var col2 = eoC(seg(t, T_POP, T_POP + 90));
      var anchorL = t < 5700 ? [lerp(2.5, 0.5, eio(seg(t, 5300, 5700))), lerp(9, 11, eio(seg(t, 5300, 5700)))] : [0, my];
      var A = toWorld(N, anchorL[0], anchorL[1]);
      var settle2 = eio(seg(t, 5320, 6450));
      var bR = lerp(lerp(54, 30, col2), 22.2, settle2) - 3;
      var ub = unit(A[0] - T.x, A[1] - T.y), B = [T.x + ub[0] * bR, T.y + ub[1] * bR];
      var w0, w1;
      if (t < 5700) {
        var str = eio(seg(t, 5280, 5700));
        w0 = lerp(6.5, 1.6, str); w1 = lerp(9, 4, str);
      } else {
        // snapped: two halves recoil - top into mouth, bottom into the blob
        var sn = eoC(seg(t, 5700, 5860));
        var Mid = [lerp(A[0], B[0], 0.5), lerp(A[1], B[1], 0.5)];
        var Atop = [lerp(Mid[0], A[0], sn), lerp(Mid[1], A[1], sn)], Bbot = [lerp(Mid[0], B[0], sn), lerp(Mid[1], B[1], sn)];
        var wq = 2.2 * (1 - sn) + 0.3;
        S.strand.setAttribute('d', taper(A, Atop, wq * 0.7, wq) + taper(Bbot, B, wq, wq * 2));
        S.strand.setAttribute('opacity', sn < 1 ? 1 : 0);
        w0 = -1;
      }
      if (w0 >= 0) {
        var sag = Math.sin(Math.PI * seg(t, T_POP, 5000)) * 0;
        S.strand.setAttribute('d', taper(A, B, w0, w1, sag));
        S.strand.setAttribute('opacity', 1);
      }
    } else S.strand.setAttribute('opacity', 0);

    // final line
    var lq2 = seg(t, 7700, 8150);
    S.line.setAttribute('opacity', f1(eo(lq2) * 100) / 100);
    S.line.setAttribute('transform', 'translate(0,' + f1((1 - backOut(lq2, 1.6)) * 14) + ')');
  }
  // tapered band from A (half-width wa) to B (half-width wb), slightly pinched in the middle
  function taper(A, B, wa, wb) {
    var dx = B[0] - A[0], dy = B[1] - A[1], m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m;
    var M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], wm = Math.min(wa, wb) * 0.7;
    return 'M' + f1(A[0] + nx * wa) + ' ' + f1(A[1] + ny * wa) + 'Q' + f1(M[0] + nx * wm * 2 - nx * Math.min(wa, wb)) + ' ' + f1(M[1] + ny * wm * 2 - ny * Math.min(wa, wb)) + ' ' + f1(B[0] + nx * wb) + ' ' + f1(B[1] + ny * wb) +
      'L' + f1(B[0] - nx * wb) + ' ' + f1(B[1] - ny * wb) + 'Q' + f1(M[0] - nx * wm * 2 + nx * Math.min(wa, wb)) + ' ' + f1(M[1] - ny * wm * 2 + ny * Math.min(wa, wb)) + ' ' + f1(A[0] - nx * wa) + ' ' + f1(A[1] - ny * wa) + 'Z';
  }

  function getScene(root, opts) {
    var c = root.__cc2bubblegum;
    if (c && c.opts === opts && root.contains(c.svg)) return c;
    var S = build(root, opts);
    root.__cc2bubblegum = S;
    return S;
  }

  window.CCSteal2_bubblegum = {
    title: 'The Bubble',
    blurb: 'Nick’s chip rolls up chewing, blows a bubble in his colour that swells over Nate’s nervous chip until it pops, and the gum settles into a clean coat with Nick’s initial.',
    duration: T_END,
    frame: function (root, opts, ms) {
      var S = getScene(root, opts);
      render(S, ms || 0);
    },
    play: function (root, opts) {
      var S = build(root, opts);
      root.__cc2bubblegum = S;
      var token = {};
      root.__cc2bubblegumToken = token;
      return new Promise(function (resolve) {
        var t0 = null;
        render(S, 0);
        function step(now) {
          if (root.__cc2bubblegumToken !== token) { resolve(); return; }
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
