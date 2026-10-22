/* Closed Caption steal film: shellgame (built by the animation team, Oct 2026) */
/*
  CLOSED CAPTION - "The Shell Game" steal  (KEY: shellgame)

  Storyboard (ms, deterministic; picture = f(t)):
   B1    0-250    Establish: felt table, caption rows (1, 2, 3, CC), chips on printed bet spots.
   B2  250-1000   Single out: Nate's chip squashes, hops, lands; a blue pulse ring; the rest of the table dims.
   B3  880-1400   Push in on Nate's row. The chip gives a nervous little shiver (1030-1160).
   B4 1150-1650   Three red paper cups drop from above - the centre one onto Nate's chip first -
                  stretch on the fall, squash + wobble on landing, impact ticks.
   B5 1420-1850   The dealer's gloved hands (pink cuffs, dark sleeves) swoop in from across the table.
   B6 1880-4450   The hustle: 10 moves on overlapping front/back arcs, accelerating 360 -> 140 ms,
                  cups lean into the motion and follow through, smears at top speed, a feint,
                  a three-way rotation, then one slow, taunting swap. Chip cup rests in the middle.
   B7 4580-5250   Reveal: left cup lifted (empty spot) and flicked away; right cup (empty) flicked away.
   B8 5460-5620   Last cup: a press (anticipation), then yanked up and off.
   B9 5620-6240   The chip pops up, flipping Na/Ni - blue/pink - slowing, and lands on its exact spot, pink.
   B10 6240-6900  Coin-settle wobble, bounce, pink pulse rings; hands spread "ta-da" and withdraw.
   B11 6700-7450  Pull back to the whole table; stillness.
   B12 7450-10000 "Nick stole Nate's chip." fades up and holds (~2.5 s).
*/
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1F1A17', PAPER = '#FFF8EA', SPOT = '#F3E7CF', FELT = '#2E6B4F';
  var CUP = '#E0503C', CUP_DK = '#A93A2B', CUP_TOP = '#F2836C', CREAM = '#FFF1D6';
  var GLOVE = '#FFFDF6', SLEEVE = '#3A322E';
  var FONT = "Fredoka, Nunito, 'Trebuchet MS', system-ui, sans-serif";
  var PI = Math.PI;

  function E(tag, a, p) { var e = document.createElementNS(NS, tag); if (a) for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sg(t, a, b) { return cl((t - a) / (b - a), 0, 1); }
  function lr(a, b, u) { return a + (b - a) * u; }
  function ioC(u) { return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function oC(u) { return 1 - Math.pow(1 - u, 3); }
  function iC(u) { return u * u * u; }
  function oQ(u) { return 1 - (1 - u) * (1 - u); }
  function ioS(u) { return -(Math.cos(PI * u) - 1) / 2; }
  function oB(u) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')';
  }

  /* ---------------- timeline plan (geometry independent) ---------------- */
  var HOP0 = 250, PUSH0 = 880, PUSH1 = 1400, FALL = 230;
  var DROP = [1260, 1150, 1340];          // cup 1 starts over the chip
  var ENTER = 1420, SH0 = 1880, GAP = 18;
  var MOVES = [['s', 1, 2, 360], ['s', 0, 1, 300], ['s', 1, 2, 260], ['f', 0, 2, 280], ['s', 0, 1, 200],
               ['s', 0, 2, 175], ['s', 1, 2, 150], ['s', 0, 1, 140], ['c', 0, 2, 220], ['s', 0, 2, 320]];
  var SEGS = [[], [], []], HMOVES = [], END_SLOT, CUP_AT_END, SH_END;
  (function () {
    var slotOf = [0, 1, 2], cupAt = [0, 1, 2], t = SH0;
    MOVES.forEach(function (m, k) {
      var t0 = t, t1 = t + m[3];
      if (m[0] !== 'c') {
        var i = m[1], j = m[2], a = cupAt[i], b = cupAt[j], amp = (j - i === 1 ? 24 : 40), front = k % 2 === 0;
        SEGS[a].push({ t0: t0, t1: t1, s0: i, s1: j, amp: front ? amp : -amp * .8, f: m[0] === 'f' });
        SEGS[b].push({ t0: t0, t1: t1, s0: j, s1: i, amp: front ? -amp * .8 : amp, f: m[0] === 'f' });
        HMOVES.push({ t0: t0, t1: t1, cups: [a, b], slots: [i, j] });
        if (m[0] === 's') { cupAt[i] = b; cupAt[j] = a; slotOf[a] = j; slotOf[b] = i; }
      } else {
        var c0 = cupAt[0], c1 = cupAt[1], c2 = cupAt[2];
        SEGS[c0].push({ t0: t0, t1: t1, s0: 0, s1: 1, amp: 12 });
        SEGS[c1].push({ t0: t0, t1: t1, s0: 1, s1: 2, amp: 12 });
        SEGS[c2].push({ t0: t0, t1: t1, s0: 2, s1: 0, amp: -44 });
        HMOVES.push({ t0: t0, t1: t1, cups: [c0, c2], slots: [0, 2] });
        cupAt = [c2, c0, c1]; slotOf[c2] = 0; slotOf[c0] = 1; slotOf[c1] = 2;
      }
      t = t1 + GAP;
    });
    SH_END = t - GAP; END_SLOT = slotOf.slice(); CUP_AT_END = cupAt.slice();
  })();
  var R0 = SH_END + 130;
  var LA = R0 + 150, LF = R0 + 420, RA = R0 + 400, RF = R0 + 670;
  var MA = R0 + 880, MY = MA + 150, CL = MY + 12, LAND = CL + 620, TOSSH = 100;
  var EXIT0 = LAND + 200, EXIT1 = EXIT0 + 330;
  var PB0 = EXIT0 + 260, PB1 = PB0 + 500, TXT = PB1 + 250, TXT1 = TXT + 320;
  var DUR = Math.max(TXT + 2550, 7000);

  // hand tracks: keys {t, dur, spec, e, arc}
  function buildHandKeys() {
    var L = [{ t: 0, dur: 0, spec: { rest: 0 } }], R = [{ t: 0, dur: 0, spec: { rest: 1 } }];
    var hc = [null, null];
    HMOVES.forEach(function (m, k) {
      var a = m.cups[0], b = m.cups[1], want;
      if (k === 0) want = [a, b];
      else {
        var keep = (hc[0] === a && hc[1] === b) ? [a, b] : (hc[0] === b && hc[1] === a) ? [b, a] : null;
        if (keep) want = keep;
        else {
          var c1 = (hc[0] === a ? 0 : 1) + (hc[1] === b ? 0 : 1), c2 = (hc[0] === b ? 0 : 1) + (hc[1] === a ? 0 : 1) + .6;
          want = c1 <= c2 ? [a, b] : [b, a];
        }
      }
      [L, R].forEach(function (tr, h) {
        if (k === 0) tr.push({ t: ENTER + h * 70, dur: 400, spec: { cup: want[h] }, e: oB, arc: 0 });
        else if (hc[h] !== want[h]) tr.push({ t: m.t0 - 50, dur: 95, spec: { cup: want[h] }, e: ioS, arc: 14 });
      });
      hc = want;
    });
    var cL = CUP_AT_END[0], cM = CUP_AT_END[1], cR = CUP_AT_END[2];
    L.push({ t: R0, dur: 170, spec: { cup: cL, dy: -14 }, e: ioS, arc: 10 });
    L.push({ t: LA - 60, dur: 60, spec: { cup: cL }, e: oQ });
    L.push({ t: LF, dur: 280, spec: { pt: [-56, -118], r: -6 }, e: oC });
    L.push({ t: LAND - 160, dur: 320, spec: { pt: [-74, -88], r: -14 }, e: ioC, arc: 8 });
    L.push({ t: EXIT0, dur: EXIT1 - EXIT0, spec: { rest: 0 }, e: iC });
    R.push({ t: R0, dur: 170, spec: { cup: cR, dy: -14 }, e: ioS, arc: 10 });
    R.push({ t: RA - 60, dur: 60, spec: { cup: cR }, e: oQ });
    R.push({ t: RF, dur: 280, spec: { pt: [58, -118], r: 6 }, e: oC });
    R.push({ t: MA - 190, dur: 190, spec: { cup: cM }, e: ioS, arc: 16 });
    R.push({ t: MY + 80, dur: 300, spec: { pt: [74, -96], r: 14 }, e: oC });
    R.push({ t: EXIT0 + 40, dur: EXIT1 - EXIT0, spec: { rest: 1 }, e: iC });
    return [L, R];
  }
  var HKEYS = buildHandKeys();
  var SPREAD = [
    [[0, 1.7], [ENTER + 300, 1, 140], [R0, 1.4, 150], [LA - 60, 1, 60], [LF, 1.8, 140], [LAND - 80, 2.3, 220], [EXIT0, 1.2, 300]],
    [[0, 1.7], [ENTER + 370, 1, 140], [R0, 1.4, 150], [RA - 60, 1, 60], [RF, 1.8, 140], [MA - 190, 1.3, 150], [MA, 1, 60], [MY + 80, 1.9, 140], [LAND - 60, 2.3, 220], [EXIT0, 1.2, 300]]
  ];

  /* ---------------- geometry (per opts) ---------------- */
  var G; // current geometry, set before each render
  function initials(opts) {
    var d = opts.dealer || 'Dealer', v = opts.victim || 'Player', same = d.charAt(0).toLowerCase() === v.charAt(0).toLowerCase();
    return function (name) {
      if (same && (name === d || name === v)) return name.slice(0, 2);
      return name.charAt(0).toUpperCase();
    };
  }
  function layout(opts) {
    var cards = (opts.cards || []).slice(0, 5), n = Math.max(cards.length, 1);
    var pitch = Math.min(118, 500 / n), cardH = pitch - 18, total = n * pitch - 18, top = 318 - total / 2;
    var SP = [114, 170, 226, 282, 338], rows = [], target = null;
    cards.forEach(function (c, i) {
      var cy = top + i * pitch + cardH / 2, chips = [], hasT = c.chips.some(function (ch) { return ch.target; });
      var order = hasT ? [4, 0] : [2, 1, 3], oi = 0;
      c.chips.slice(0, 3).forEach(function (ch) {
        if (ch.target && !target) { target = { row: i, x: SP[2], y: cy }; return; }
        chips.push({ name: ch.name, color: ch.color, x: SP[order[oi++ % order.length]], y: cy });
      });
      rows.push({ label: c.label, cy: cy, chips: chips, target: hasT });
    });
    if (!target) { target = { row: 0, x: SP[2], y: rows[0] ? rows[0].cy : 318 }; }
    var g = { rows: rows, top: top, cardH: cardH, total: total, SP: SP, SPX: target.x, SPY: target.y, BASEY: target.y + 22,
      SLOTX: [SP[1], SP[2], SP[3]], trow: target.row };
    g.ANCH = [{ x: g.SPX - 175, y: g.BASEY - 360 }, { x: g.SPX + 175, y: g.BASEY - 360 }];
    g.REST = [{ x: g.SPX - 160, y: g.BASEY - 320 }, { x: g.SPX + 160, y: g.BASEY - 320 }];
    return g;
  }

  /* ---------------- motion functions ---------------- */
  function cupState(c, t) {
    var s = { x: G.SLOTX[c], y: G.BASEY, lift: 0, r: 0, sx: 1, sy: 1, sc: 1, vis: 1, shadow: 1, smear: null };
    var d0 = DROP[c], land = d0 + FALL;
    if (t < d0) { s.vis = 0; return s; }
    if (t < land) {
      var p = sg(t, d0, land), e = p * p;
      s.lift = (1 - e) * 340; s.sy = 1 + .16 * p; s.sx = 1 - .07 * p; s.shadow = e; return s;
    }
    var tau = t - land;
    if (tau < 500) { var k = .2 * Math.exp(-tau / 85) * Math.cos(tau * 2 * PI / 200); s.sy *= 1 - k; s.sx *= 1 + .7 * k; }
    // shuffle
    var segs = SEGS[c], x = G.SLOTX[c], yo = 0, r = 0;
    for (var i = 0; i < segs.length; i++) {
      var q = segs[i]; if (t < q.t0) break;
      var X0 = G.SLOTX[q.s0], X1 = G.SLOTX[q.s1], dur = q.t1 - q.t0, dir = X1 > X0 ? 1 : -1, dist = Math.abs(X1 - X0);
      var L = cl(dist / dur * 62, 5, 14);
      if (t < q.t1) {
        var u = (t - q.t0) / dur, ee, lean;
        if (q.f) { ee = .42 * Math.sin(PI * u); lean = dir * L * .9 * Math.sin(2 * PI * u); }
        else { ee = dur >= 250 ? ioC(u) : ioS(u); lean = dir * L * Math.sin(PI * u); }
        x = lr(X0, X1, ee); yo = q.amp * Math.sin(PI * (q.f ? ee / .42 * .5 : ee)); r += lean;
        if (dur < 250) { var sp = Math.sin(PI * u); s.sx *= 1 + .1 * sp; s.sy *= 1 - .05 * sp; }
        if (dur <= 230 && !q.f) s.smear = { q: q, u: u, ee: ee, X0: X0, X1: X1 };
      } else {
        x = q.f ? X0 : X1; yo = 0;
        var ta = t - q.t1; if (ta < 450) r += (q.f ? 1 : -1) * dir * L * .5 * Math.sin(2 * PI * ta / 230) * Math.exp(-ta / 110);
      }
    }
    s.x = x; s.y = G.BASEY + yo; s.r += r; s.sc = 1 + yo / 330;
    // reveal
    var es = END_SLOT[c];
    if (es !== 1) {
      var side = es === 0 ? -1 : 1, A = es === 0 ? LA : RA, F = es === 0 ? LF : RF;
      if (t >= A - 80 && t < A) { var pa = Math.sin(PI * sg(t, A - 80, A)); s.sy *= 1 - .08 * pa; s.sx *= 1 + .04 * pa; }
      if (t >= A) {
        var pl = oC(sg(t, A, A + 200)); s.lift = 52 * pl; s.r += side * 14 * pl; s.x += side * 5 * pl;
        if (t < F) s.r += side * 2 * Math.sin((t - A) / 60);
        if (t >= F) {
          var tf = t - F; s.lift += 1.05 * tf + .0009 * tf * tf; s.x += side * .55 * tf; s.r += side * (2 * Math.sin((F - A) / 60) + .5 * tf);
          if (tf > 650) s.vis = 0;
        }
      }
    } else {
      if (t >= MA && t < MY + 60) { var pm = oQ(sg(t, MA, MA + 110)); s.sy *= 1 - .12 * pm; s.sx *= 1 + .07 * pm; }
      if (t >= MY) {
        var ty = t - MY, rel = sg(ty, 0, 60);
        s.sy *= 1 + .26 * oQ(rel) * Math.exp(-ty / 220); s.sx *= 1 - .08 * oQ(rel);
        s.lift = 1.15 * ty + .0028 * ty * ty;
        s.r += -10 * Math.sin(cl(ty / 120, 0, 1) * PI / 2) - (ty > 120 ? .35 * (ty - 120) : 0);
        if (ty > 600) s.vis = 0;
      }
    }
    s.shadow = cl(1 - s.lift / 110, 0, 1);
    return s;
  }
  function cupTop(c, t, dy) {
    var s = cupState(c, t), a = s.r * PI / 180, h = (58 * s.sy * s.sc) - 1 - (dy || 0);
    return { x: s.x + Math.sin(a) * h, y: s.y - s.lift - Math.cos(a) * h, r: s.r };
  }
  function specPos(sp, t) {
    if (sp.rest !== undefined) return { x: G.REST[sp.rest].x, y: G.REST[sp.rest].y, r: 0 };
    if (sp.pt) return { x: G.SPX + sp.pt[0], y: G.BASEY + sp.pt[1], r: sp.r || 0 };
    return cupTop(sp.cup, t, sp.dy);
  }
  function keyPos(keys, i, t) {
    var k = keys[i], p = specPos(k.spec, t);
    if (i > 0 && t < k.t + k.dur) {
      var q = keyPos(keys, i - 1, t), u = (t - k.t) / k.dur, e = (k.e || ioS)(u);
      p = { x: lr(q.x, p.x, e), y: lr(q.y, p.y, e) - (k.arc || 0) * Math.sin(PI * u), r: lr(q.r, p.r, e) };
    }
    return p;
  }
  function handPos(h, t) {
    var keys = HKEYS[h], i = keys.length - 1;
    while (i > 0 && keys[i].t > t) i--;
    return keyPos(keys, i, t);
  }
  function spreadAt(h, t) {
    var ks = SPREAD[h], v = ks[0][1];
    for (var i = 1; i < ks.length; i++) {
      if (t < ks[i][0]) break;
      v = lr(v, ks[i][1], ioS(sg(t, ks[i][0], ks[i][0] + ks[i][2])));
    }
    return v;
  }
  function chipState(t) {
    var s = { x: G.SPX, y: G.SPY, h: 0, sx: 1, sy: 1, r: 0, th: 0, sc: 1, vis: 1, air: false };
    if (t >= HOP0 && t < 370) { var p = oQ(sg(t, HOP0, 370)); s.sy = 1 - .18 * p; s.sx = 1 + .12 * p; }
    else if (t >= 370 && t < 600) {
      var u = sg(t, 370, 600); s.h = 26 * Math.sin(PI * u);
      s.sy = u < .25 ? lr(.82, 1.12, oQ(u / .25)) : u < .7 ? lr(1.12, .98, ioS((u - .25) / .45)) : lr(.98, 1.06, (u - .7) / .3);
      s.sx = 2 - s.sy;
    } else if (t >= 600 && t < 1000) {
      var ta = t - 600, k = .19 * Math.exp(-ta / 70) * Math.cos(2 * PI * ta / 180) + (.06 * (1 - sg(ta, 0, 30)));
      s.sy = 1 - k; s.sx = 1 + .7 * k;
    }
    if (t >= 1030 && t < 1170) {
      var env = Math.sin(PI * sg(t, 1030, 1170));
      s.r = 7 * env * Math.sin(2 * PI * (t - 1030) / 56); s.sy *= 1 - .05 * env;
    }
    if (t >= DROP[1] + FALL - 4 && t < MY) s.vis = 0;
    if (t >= CL && t < LAND) {
      var v = sg(t, CL, LAND); s.h = TOSSH * 4 * v * (1 - v); s.th = 5 * PI * oQ(v);
      s.sc = 1 + .4 * (s.h / TOSSH); s.r = -18 * Math.sin(PI * v); s.air = true;
    } else if (t >= LAND) {
      var tl = t - LAND; s.th = PI;
      if (tl < 90) { var kk = .2 * Math.sin(PI * tl / 90); s.sy = 1 - kk; s.sx = 1 + .7 * kk; }
      else if (tl < 230) { s.h = 7 * Math.sin(PI * (tl - 90) / 140); var st = .05 * Math.sin(PI * (tl - 90) / 140); s.sy = 1 + st; s.sx = 1 - st; }
      else if (tl < 290) { var k2 = .07 * Math.sin(PI * (tl - 230) / 60); s.sy = 1 - k2; s.sx = 1 + .6 * k2; }
      if (tl >= 260 && tl < 1000) {
        var w = tl - 260, A = .55 * Math.exp(-w / 170), ph = 2 * PI * (w / 120 + w * w / 60000);
        s.th = PI + A * Math.sin(ph); s.r = 9 * A * Math.cos(ph);
      }
    }
    return s;
  }

  /* ---------------- build ---------------- */
  function makeChip(p, col, ini, shadow) {
    var g = E('g', {}, p);
    if (shadow) E('circle', { cx: 0, cy: 3.5, r: 21, fill: INK, opacity: .22 }, g);
    E('circle', { r: 21, fill: col, stroke: INK, 'stroke-width': 2.5 }, g);
    E('circle', { r: 15.5, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-dasharray': '4.1 3.2', opacity: .9 }, g);
    E('path', { d: 'M-14.5,-6 A15.5,15.5 0 0 1 -6,-14.3', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none', opacity: .4 }, g);
    var tx = E('text', { y: 0, dy: '.36em', 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 700, 'font-size': ini.length > 1 ? 15 : 18, fill: '#fff' }, g);
    tx.textContent = ini;
    return g;
  }
  function makeCup(p) {
    var g = E('g', {}, p);
    E('path', { d: 'M-26,0 L-17.5,-58 Q0,-62.5 17.5,-58 L26,0 Q0,8 -26,0Z', fill: CUP, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
    E('path', { d: 'M-22.8,-22 Q0,-16.5 22.8,-22 L21.3,-31 Q0,-25.5 -21.3,-31Z', fill: CREAM }, g);
    E('path', { d: 'M-22.8,-22 Q0,-16.5 22.8,-22 M21.3,-31 Q0,-25.5 -21.3,-31', fill: 'none', stroke: INK, 'stroke-width': 1.4, opacity: .55 }, g);
    E('path', { d: 'M-26,0 Q0,8 26,0 L25.3,-5 Q0,3 -25.3,-5Z', fill: CUP_DK, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    E('ellipse', { cx: 0, cy: -58, rx: 17.5, ry: 4.6, fill: CUP_TOP, stroke: INK, 'stroke-width': 2.2 }, g);
    E('path', { d: 'M-19.5,-9 L-14.5,-50', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: .32 }, g);
    return g;
  }
  function makeHand(p, color, mirror) {
    var g = E('g', {}, p), inner = E('g', { transform: mirror ? 'scale(-1,1)' : '' }, g), fingers = [];
    E('ellipse', { cx: -14, cy: -1, rx: 5, ry: 8.5, transform: 'rotate(28 -14 -1)', fill: GLOVE, stroke: INK, 'stroke-width': 2.2 }, inner);
    [-11, -3.7, 3.7, 11].forEach(function (fx, i) {
      var fg = E('g', {}, inner);
      E('rect', { x: -3.9, y: -4, width: 7.8, height: 20, rx: 3.9, fill: GLOVE, stroke: INK, 'stroke-width': 2.2 }, fg);
      fingers.push({ g: fg, x: fx, a: [14, 5, -5, -14][i], l: [0, 1, 1, 0][i] });
    });
    E('ellipse', { cx: 0, cy: -4, rx: 15.5, ry: 12.5, fill: GLOVE, stroke: INK, 'stroke-width': 2.2 }, inner);
    E('path', { d: 'M-6,-9 Q-3,-11 0,-9', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: .45 }, inner);
    E('rect', { x: -12.5, y: -25, width: 25, height: 9, rx: 3.5, fill: color, stroke: INK, 'stroke-width': 2.2 }, inner);
    return { g: g, fingers: fingers };
  }

  function build(el, opts) {
    while (el.firstChild) el.removeChild(el.firstChild);
    var g = layout(opts), ini = initials(opts), dCol = opts.dealerColor || '#E8559E', vCol = opts.victimColor || '#2F6FE0';
    var svg = E('svg', { viewBox: '0 0 390 700', preserveAspectRatio: 'xMidYMid meet', width: '100%', height: '100%', style: 'display:block;width:100%;height:100%;overflow:hidden' });
    svg.setAttribute('aria-label', (opts.dealer || '') + ' stole ' + (opts.victim || '') + "'s chip");
    el.appendChild(svg);
    E('rect', { x: -400, y: -400, width: 1190, height: 1500, fill: PAPER }, svg);
    var cam = E('g', {}, svg);
    var feltTop = g.top - 26, feltH = g.total + 52;
    E('rect', { x: 10, y: feltTop + 5, width: 370, height: feltH, rx: 30, fill: INK, opacity: .18 }, cam);
    E('rect', { x: 10, y: feltTop, width: 370, height: feltH, rx: 30, fill: FELT, stroke: INK, 'stroke-width': 3 }, cam);
    E('rect', { x: 19, y: feltTop + 9, width: 352, height: feltH - 18, rx: 23, fill: 'none', stroke: PAPER, 'stroke-width': 1.6, 'stroke-dasharray': '1 7', 'stroke-linecap': 'round', opacity: .3 }, cam);
    var rowG = [], tOthers = [];
    g.rows.forEach(function (row, i) {
      var rg = E('g', {}, cam); rowG.push(rg);
      var y0 = row.cy - g.cardH / 2;
      E('rect', { x: 24, y: y0 + 3.5, width: 342, height: g.cardH, rx: 14, fill: INK, opacity: .28 }, rg);
      E('rect', { x: 24, y: y0, width: 342, height: g.cardH, rx: 14, fill: PAPER, stroke: INK, 'stroke-width': 2.5 }, rg);
      E('rect', { x: 34, y: row.cy - 20, width: 46, height: 40, rx: 10, fill: INK }, rg);
      var lb = E('text', { x: 57, y: row.cy, dy: '.36em', 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 600, 'font-size': String(row.label).length > 1 ? 17 : 22, fill: PAPER }, rg);
      lb.textContent = row.label;
      g.SP.forEach(function (x) { E('circle', { cx: x, cy: row.cy, r: 21, fill: SPOT, stroke: INK, 'stroke-width': 1.5, opacity: .9, 'stroke-opacity': .25 }, rg); });
      row.chips.forEach(function (ch) {
        var cg = makeChip(row.target ? cam : rg, ch.color, ini(ch.name), true);
        cg.setAttribute('transform', 'translate(' + ch.x + ',' + ch.y + ')');
        if (row.target) tOthers.push(cg);
      });
    });
    var groundL = E('g', {}, cam), shadowL = E('g', {}, cam), fxLow = E('g', {}, cam), smearL = E('g', {}, cam), cupL = E('g', {}, cam), airL = E('g', {}, cam), armL = E('g', {}, cam), handL = E('g', {}, cam), fxL = E('g', {}, cam);
    // target chip
    var chipShadow = E('circle', { r: 21, fill: INK, opacity: .22 }, groundL);
    var chipG = E('g', {}, groundL);
    var edge = E('circle', { r: 21, fill: shade(vCol, .62), stroke: INK, 'stroke-width': 2.5 }, chipG);
    var fV = makeChip(chipG, vCol, ini(opts.victim || 'P'), false), fD = makeChip(chipG, dCol, ini(opts.dealer || 'D'), false);
    // cups
    var cups = [], shadows = [], smears = [];
    for (var c = 0; c < 3; c++) {
      shadows.push(E('ellipse', { rx: 29, ry: 7, fill: INK }, shadowL));
      smears.push(E('path', { fill: 'none', stroke: CUP, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, smearL));
      cups.push(makeCup(cupL));
    }
    // arms + hands
    var arms = [], hands = [];
    for (var h = 0; h < 2; h++) {
      arms.push([E('path', { fill: 'none', stroke: INK, 'stroke-width': 17, 'stroke-linecap': 'round' }, armL),
                 E('path', { fill: 'none', stroke: SLEEVE, 'stroke-width': 11.5, 'stroke-linecap': 'round' }, armL)]);
      hands.push(makeHand(handL, dCol, h === 1));
    }
    // fx
    var hopRing = E('circle', { cx: g.SPX, cy: g.SPY, fill: 'none', stroke: vCol }, fxLow);
    var rings = [E('circle', { cx: g.SPX, cy: g.SPY, fill: 'none', stroke: dCol }, fxLow), E('circle', { cx: g.SPX, cy: g.SPY, fill: 'none', stroke: dCol }, fxLow)];
    var ticks = [];
    for (var i = 0; i < 12; i++) ticks.push(E('line', { stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, fxL));
    var txt = E('text', { x: 195, y: 652, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 600, fill: INK }, svg);
    var line = (opts.dealer || 'Dealer') + ' stole ' + (opts.victim || 'Player') + "'s chip.";
    txt.textContent = line;
    txt.setAttribute('font-size', r2(Math.min(30, 355 / (line.length * .5))));
    return { g: g, opts: opts, svg: svg, cam: cam, rowG: rowG, tOthers: tOthers, groundL: groundL, airL: airL, cupL: cupL,
      chipShadow: chipShadow, chipG: chipG, edge: edge, fV: fV, fD: fD, vCol: vCol, dCol: dCol,
      cups: cups, shadows: shadows, smears: smears, arms: arms, hands: hands, hopRing: hopRing, rings: rings, ticks: ticks, txt: txt, order: '' };
  }

  /* ---------------- render ---------------- */
  function setTicks(R, t) {
    var k = 0, T = R.ticks;
    function line(x1, y1, x2, y2, o) { var l = T[k++]; l.setAttribute('x1', r2(x1)); l.setAttribute('y1', r2(y1)); l.setAttribute('x2', r2(x2)); l.setAttribute('y2', r2(y2)); l.setAttribute('opacity', r2(o)); }
    for (var c = 0; c < 3; c++) {
      var tl = t - (DROP[c] + FALL), x = G.SLOTX[c];
      for (var sd = -1; sd <= 1; sd += 2) {
        if (tl >= 0 && tl < 200) {
          var p = oC(tl / 200), x1 = x + sd * (31 + 12 * p), y1 = G.BASEY - 4 - 5 * p;
          line(x1, y1, x1 + sd * 10 * (1 - .6 * p), y1 - 4 * (1 - .6 * p), 1 - p);
        } else line(0, 0, 0, 0, 0);
      }
    }
    var tc = t - LAND;
    for (var a = 0; a < 6; a++) {
      if (tc >= 0 && tc < 240) {
        var pp = oC(tc / 240), ang = (a * 60 + 30) * PI / 180, r1 = 27 + 13 * pp, len = 9 * (1 - .6 * pp);
        line(G.SPX + Math.cos(ang) * r1, G.SPY + Math.sin(ang) * r1, G.SPX + Math.cos(ang) * (r1 + len), G.SPY + Math.sin(ang) * (r1 + len), 1 - pp);
      } else line(0, 0, 0, 0, 0);
    }
  }
  function ring(el, t, t0, d, r0, r1, w0) {
    var p = sg(t, t0, t0 + d);
    if (p <= 0 || p >= 1) { el.setAttribute('opacity', 0); return; }
    var e = oC(p);
    el.setAttribute('r', r2(lr(r0, r1, e))); el.setAttribute('stroke-width', r2(lr(w0, .5, e))); el.setAttribute('opacity', r2(1 - p));
  }
  function render(R, t) {
    G = R.g; t = cl(t, 0, DUR);
    // camera
    var z = ioC(sg(t, PUSH0, PUSH1)) * (1 - ioC(sg(t, PB0, PB1))), s = 1 + .45 * z;
    var cx = lr(195, G.SPX, z), cy = lr(350, G.SPY, z), ax = 195, ay = lr(350, 392, z);
    R.cam.setAttribute('transform', 'translate(' + r2(ax) + ',' + r2(ay) + ') scale(' + r2(s * 1000) / 1000 + ') translate(' + r2(-cx) + ',' + r2(-cy) + ')');
    // dimming
    var dim = ioS(sg(t, 450, 1000)) * (1 - ioS(sg(t, PB0, PB1)));
    R.rowG.forEach(function (rg, i) { rg.setAttribute('opacity', i === G.trow ? 1 : r2(1 - .58 * dim)); });
    R.tOthers.forEach(function (cg) { cg.setAttribute('opacity', r2(1 - .3 * dim)); });
    // cups
    var st = [0, 1, 2].map(function (c) { return cupState(c, t); });
    st.forEach(function (s, c) {
      var cup = R.cups[c], sh = R.shadows[c], sm = R.smears[c];
      cup.setAttribute('opacity', s.vis);
      cup.setAttribute('transform', 'translate(' + r2(s.x) + ',' + r2(s.y - s.lift) + ') rotate(' + r2(s.r) + ') scale(' + r2(s.sx * s.sc * 1000) / 1000 + ',' + r2(s.sy * s.sc * 1000) / 1000 + ')');
      sh.setAttribute('cx', r2(s.x)); sh.setAttribute('cy', r2(s.y + 1));
      sh.setAttribute('rx', r2(29 * s.sc * s.sx * (.55 + .45 * s.shadow))); sh.setAttribute('ry', r2(7 * s.sc * (.55 + .45 * s.shadow)));
      sh.setAttribute('opacity', s.vis ? r2(.28 * s.shadow) : 0);
      if (s.smear) {
        var m = s.smear, pts = [], e1 = m.ee, e0 = Math.max(0, e1 - .3);
        for (var k = 0; k <= 6; k++) {
          var e = lr(e0, e1, k / 6), px = lr(m.X0, m.X1, e), py = G.BASEY + m.q.amp * Math.sin(PI * e) - 30 * (1 + m.q.amp * Math.sin(PI * e) / 330);
          pts.push((k ? 'L' : 'M') + r2(px) + ',' + r2(py));
        }
        sm.setAttribute('d', pts.join(' ')); sm.setAttribute('stroke-width', r2(40 * s.sc)); sm.setAttribute('opacity', r2(.3 * Math.sin(PI * m.u)));
      } else sm.setAttribute('opacity', 0);
    });
    var ord = [0, 1, 2].sort(function (a, b) { return (st[a].y + (st[a].lift > 1 ? 1000 + st[a].lift : 0)) - (st[b].y + (st[b].lift > 1 ? 1000 + st[b].lift : 0)); });
    var os = ord.join('');
    if (os !== R.order) { ord.forEach(function (c) { R.cupL.appendChild(R.cups[c]); }); R.order = os; }
    // chip
    var ch = chipState(t), parent = ch.air ? R.airL : R.groundL;
    if (R.chipG.parentNode !== parent) parent.appendChild(R.chipG);
    var co = Math.cos(ch.th), sn = Math.abs(Math.sin(ch.th)), fy = Math.max(Math.abs(co), .05);
    var sxx = r2(ch.sc * ch.sx * 1000) / 1000, syy = r2(ch.sc * ch.sy * fy * 1000) / 1000;
    R.chipG.setAttribute('opacity', ch.vis);
    R.fV.setAttribute('transform', 'translate(' + r2(ch.x) + ',' + r2(ch.y - ch.h) + ') rotate(' + r2(ch.r) + ') scale(' + sxx + ',' + syy + ')');
    R.fD.setAttribute('transform', R.fV.getAttribute('transform'));
    R.fV.setAttribute('opacity', co >= 0 ? 1 : 0); R.fD.setAttribute('opacity', co >= 0 ? 0 : 1);
    R.edge.setAttribute('fill', shade(co >= 0 ? R.vCol : R.dCol, .62));
    R.edge.setAttribute('opacity', sn > .02 ? 1 : 0);
    R.edge.setAttribute('transform', 'translate(' + r2(ch.x) + ',' + r2(ch.y - ch.h + 5 * sn * ch.sc) + ') rotate(' + r2(ch.r) + ') scale(' + sxx + ',' + syy + ')');
    var hf = ch.h / TOSSH;
    R.chipShadow.setAttribute('cx', G.SPX); R.chipShadow.setAttribute('cy', r2(G.SPY + 3.5));
    R.chipShadow.setAttribute('r', r2(21 * (1 - .55 * hf)));
    R.chipShadow.setAttribute('opacity', ch.vis ? r2(.22 * (1 - .7 * hf)) : 0);
    // hands
    var hv = t >= ENTER && t <= EXIT1 + 10;
    for (var h = 0; h < 2; h++) {
      var hp = handPos(h, t), H = R.hands[h], A = R.arms[h], an = G.ANCH[h];
      H.g.setAttribute('opacity', hv ? 1 : 0); A[0].setAttribute('opacity', hv ? 1 : 0); A[1].setAttribute('opacity', hv ? 1 : 0);
      if (!hv) continue;
      H.g.setAttribute('transform', 'translate(' + r2(hp.x) + ',' + r2(hp.y) + ') rotate(' + r2(hp.r) + ') scale(1.15)');
      var spv = spreadAt(h, t);
      H.fingers.forEach(function (f) { f.g.setAttribute('transform', 'translate(' + f.x + ',' + (2 - f.l * (spv - 1) * 1.5) + ') rotate(' + r2(f.a * spv) + ')'); });
      var ra = hp.r * PI / 180, wx = hp.x + Math.sin(ra) * 25, wy = hp.y - Math.cos(ra) * 25;
      var d = 'M' + r2(an.x) + ',' + r2(an.y) + ' C' + r2(an.x) + ',' + r2(an.y + 120) + ' ' + r2(wx - Math.sin(ra) * 70) + ',' + r2(wy - Math.cos(ra) * 70) + ' ' + r2(wx) + ',' + r2(wy);
      A[0].setAttribute('d', d); A[1].setAttribute('d', d);
    }
    // fx
    ring(R.hopRing, t, 590, 460, 23, 50, 4.5);
    ring(R.rings[0], t, LAND + 30, 520, 23, 60, 5);
    ring(R.rings[1], t, LAND + 170, 560, 23, 74, 3.5);
    setTicks(R, t);
    // final line
    var tp = sg(t, TXT, TXT1), te = oC(tp);
    R.txt.setAttribute('opacity', r2(tp));
    R.txt.setAttribute('transform', 'translate(0,' + r2(10 * (1 - te)) + ')');
  }

  function inst(el, opts) {
    if (!el.__cc2shell || el.__cc2shell.opts !== opts) el.__cc2shell = build(el, opts);
    return el.__cc2shell;
  }

  window.CCSteal2_shellgame = {
    title: 'The Shell Game',
    blurb: 'Nick hides Nate\'s chip under three cups, hustles them, and lifts the last one to flip out a chip that is now his.',
    duration: DUR,
    frame: function (el, opts, ms) { render(inst(el, opts), ms || 0); },
    play: function (el, opts) {
      el.__cc2shell = null;
      var R = inst(el, opts);
      render(R, 0);
      return new Promise(function (resolve) {
        var t0 = null;
        function tick(now) {
          if (t0 === null) t0 = now;
          var t = now - t0;
          render(R, t);
          if (t < DUR) requestAnimationFrame(tick); else resolve();
        }
        requestAnimationFrame(tick);
      });
    }
  };
})();
