/* Closed Caption — THE STEAL, hand-drawn (thieves.js). Nick approved the demo (Oct 21 2026; scratchpad anim/steal_demo.html).
   The engine (CCSteal) and six thieves: at, isherman, ellhop, urglar, ainter, ickpocket. Loaded after the first screen
   (index.html SHOW list); steal.js drives it from the server's beat. Built by scratchpad rb/build_anim.py from anim/src —
   edit there and rebuild, or edit here and keep the two in step. */
/* ═══════════════════════════════════════════════════════════════════════════
   Closed Caption — THE STEAL, drawn  (CCSteal)
   Self-contained: inline SVG + vanilla JS. No libraries, no network.
   Same hand as the Mulligan skip gags: a wobbly ink line with a paper halo, re-drawn in one of three
   states 12×/s (the line boil), stick figures with a hat and a posture, motion on twos (12 drawings/s)
   and on ones (24/s) for fast action. The stage is the steal screen itself: the caption cards stacked
   as the table sees them, the chips perched on their top edges. The chips are the only colour.
   Everything on stage is a pure function of time t, so a frame at t is the same on every phone.

   CCSteal.play(container, opts) -> Promise   (resolves when the show is over)
   CCSteal.frame(container, opts, t)          draws one still (tests, posters)
   opts: { heist: 'cat'|'fisherman'|'bellhop'|'burglar'|'painter'|'pickpocket', mode: 'full'|'short',
           cards: [{ chips: [{ c: '#E8453A', i: 'L' }] }, …]   3–5 cards, up to 3 chips each,
           target: { card, chip }, victim: 'Lilah', dealer: 'Margaret', dealerColor: '#E8559E',
           caption (else the heist's first), startAt (performance.now() ms, for a shared clock),
           reduced (else the OS setting), onCue(name) — sound cue hook (the demo is silent) }
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var INK = '#1F1A17', HALO = '#FFFFFF', WASH = 'rgba(31,26,23,0.12)', WASH2 = 'rgba(31,26,23,0.22)', PENCIL = '#DCD6CC';
  var VW = 360, U0 = 150;
  var CARD = { x0: 16, x1: 344, h: 48, gap: 26, top0: 150, r: 13 };
  var CR = 13;   // chip radius

  /* ── maths ── */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  var E = {
    lin: function (t) { return t; }, in: function (t) { return t * t; }, out: function (t) { return 1 - (1 - t) * (1 - t); },
    io: function (t) { return t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t); },
    in3: function (t) { return t * t * t; }, out3: function (t) { return 1 - Math.pow(1 - t, 3); },
    back: function (t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    hold: function (t) { return t < 1 ? 0 : 1; }
  };
  function hash(n) { n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  function rnd(s, i) { return hash(Math.imul(s | 0, 7919) + Math.imul(i | 0, 104729) + 12345); }
  function rot(pt, c, a) { var s = Math.sin(a), co = Math.cos(a), x = pt[0] - c[0], y = pt[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; }
  function qb(a, b, c, u) { return (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c; }
  function mixPt(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
  function mix(a, b, k) {
    if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
    if (Array.isArray(a) && Array.isArray(b)) return a.map(function (v, i) { return mix(v, b[i], k); });
    if (a && b && typeof a === 'object' && typeof b === 'object') { var o = {}, key; for (key in b) o[key] = key in a ? mix(a[key], b[key], k) : b[key]; for (key in a) if (!(key in o)) o[key] = a[key]; return o; }
    return k < 1 ? a : b;
  }
  /* keyframes: [[t, {partial values}, ease?], …]; values carry over from the key before */
  function track(keys) {
    var K = [], prev = {};
    keys.forEach(function (k) { var full = Object.assign({}, prev, k[1]); K.push([k[0], full, k[2] || 'io']); prev = full; });
    return function (t) {
      if (t <= K[0][0]) return Object.assign({}, K[0][1]);
      for (var i = 1; i < K.length; i++) if (t <= K[i][0]) return mix(K[i - 1][1], K[i][1], E[K[i][2]]((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0] || 1)));
      return Object.assign({}, K[K.length - 1][1]);
    };
  }

  /* ── the pen: wobbly lines with a paper halo, re-jittered per boil state ── */
  function catmull(P, closed) {
    var n = P.length, f = function (v) { return Math.round(v * 10) / 10; };
    if (n < 2) return '';
    var d = 'M' + f(P[0][0]) + ',' + f(P[0][1]);
    if (n === 2 && !closed) return d + 'L' + f(P[1][0]) + ',' + f(P[1][1]);
    var get = function (i) { return closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)]; }, last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ',' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ',' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ',' + f(p2[1]);
    }
    return closed ? d + 'Z' : d;
  }
  function Pen(boil, U, seed) { this.b = boil; this.U = U; this.k = 0; this.s = seed | 0; this.lw = Math.max(1.6, U * 0.02); this.amp = Math.max(0.65, U * 0.0085); this.gs = []; this.g(); }
  Pen.prototype = {
    g: function (o) { this.cur = { h: [], i: [], halo: !(o && o.halo === false), op: o && o.op != null ? o.op : null }; this.gs.push(this.cur); return this; },
    wob: function (pts, closed, amp) {
      var s = (this.k++) * 31 + this.b * 977 + this.s * 13 + 7;
      if (amp == null) amp = this.amp;
      var step = Math.max(7, this.U * 0.085), n = pts.length, P = [], segs = closed ? n : n - 1, i, j;
      for (i = 0; i < segs; i++) {
        var a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (j = 0; j < m; j++) P.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]);
      }
      if (!closed) P.push([pts[n - 1][0], pts[n - 1][1]]);
      if (amp > 0) {
        var gx = (rnd(s, 901) - .5) * amp, gy = (rnd(s, 902) - .5) * amp;
        for (i = 0; i < P.length; i++) { P[i][0] += gx + (rnd(s, i * 2) - .5) * 2 * amp; P[i][1] += gy + (rnd(s, i * 2 + 1) - .5) * 2 * amp; }
      }
      return catmull(P, closed);
    },
    put: function (d, o) {
      var w = (o.w || 1) * this.lw, fill = o.fill || 'none', ns = o.stroke === false;
      if (this.cur.halo && o.halo !== false && !ns) this.cur.h.push('<path d="' + d + '" stroke-width="' + (w + this.lw * 2.4).toFixed(1) + '"' + (fill !== 'none' && !/rgba/.test(fill) ? ' fill="' + HALO + '"' : '') + '/>');
      this.cur.i.push('<path d="' + d + '" fill="' + fill + '"' + (ns ? ' stroke="none"' : ' stroke="' + (o.color || INK) + '" stroke-width="' + w.toFixed(2) + '"') + (o.op != null ? ' opacity="' + (+o.op).toFixed(3) + '"' : '') + '/>');
      return this;
    },
    line: function (pts, o) { o = o || {}; return this.put(this.wob(pts, false, o.amp), o); },
    shape: function (pts, o) { o = o || {}; return this.put(this.wob(pts, true, o.amp), o); },
    circ: function (cx, cy, r, o) {
      o = o || {}; var n = o.n || clamp(Math.round(r / 2), 8, 16), pts = [];
      for (var i = 0; i < n; i++) { var a = (o.a0 || 0) + i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r * (o.sx || 1), cy + Math.sin(a) * r * (o.sy || 1)]); }
      var oo = Object.assign({}, o); if (oo.amp == null) oo.amp = Math.min(this.amp * .8, r * .06);
      return this.shape(pts, oo);
    },
    dot: function (x, y, r, color) { this.cur.i.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) + '" fill="' + (color || INK) + '"/>'); return this; },
    raw: function (s) { this.cur.i.push(s); return this; },
    svg: function () {
      return this.gs.map(function (g) {
        return (!g.h.length && !g.i.length) ? '' : '<g' + (g.op != null ? ' opacity="' + (+g.op).toFixed(3) + '"' : '') + '>' +
          (g.h.length ? '<g fill="none" stroke="' + HALO + '" stroke-linecap="round" stroke-linejoin="round">' + g.h.join('') + '</g>' : '') +
          '<g stroke-linecap="round" stroke-linejoin="round">' + g.i.join('') + '</g></g>';
      }).join('');
    }
  };

  /* ── stick-figure rig: hip + feet + hands targets, two-bone IK for knees and elbows ── */
  function ik(a, t, l1, l2, bend) {
    var dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy) || .001, mx = (l1 + l2) * .999;
    if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
    var base = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), ang = base + bend * Math.acos(c);
    return [[a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1], [a[0] + dx, a[1] + dy]];
  }
  function sgnOf(f) { return f > .35 ? 1 : f < -.35 ? -1 : 0; }
  function face(p, P, hc, hr, st) {
    var f = P.face || 0, look = P.look || 0, ey = hc[1] - hr * .08 + look * hr * .22, ex = hc[0] + f * hr * .46, sp = hr * .33 * (1 - Math.abs(f) * .5);
    var xs = Math.abs(f) > .88 ? [ex + f * hr * .06] : [ex - sp, ex + sp];
    if (st.mask) {   // a burglar's eye mask: a black band, the eyes white holes in it
      p.shape([[hc[0] - hr * 1.02, ey - hr * .2], [hc[0] + hr * 1.02, ey - hr * .2], [hc[0] + hr * 1.0, ey + hr * .2], [hc[0] - hr * 1.0, ey + hr * .2]].map(function (q) { return [q[0], q[1]]; }), { fill: INK, w: .6, halo: false, amp: .2 });
      xs.forEach(function (x) { p.circ(x, ey, hr * .17, { fill: '#fff', stroke: false, n: 8 }); if (!P.blink) p.dot(x + (P.eyeX || 0) * hr * .08, ey, Math.max(1, hr * .07)); });
    } else xs.forEach(function (x) {
      if (P.blink) p.line([[x - hr * .14, ey], [x + hr * .14, ey]], { w: .7, amp: .2, halo: false });
      else if (P.wide) { p.circ(x, ey, hr * .17, { fill: '#fff', w: .55, halo: false, n: 8 }); p.dot(x + (P.eyeX || 0) * hr * .08, ey, Math.max(1, hr * .07)); }
      else p.dot(x + (P.eyeX || 0) * hr * .1, ey, Math.max(1.15, hr * .088));
    });
    if (P.brow) xs.forEach(function (x, i) { var tilt = (P.brow > 1 ? (i ? 1 : -1) * .1 : 0); p.line([[x - hr * .17, ey - hr * (.3 + tilt)], [x + hr * .17, ey - hr * (.27 - tilt)]], { w: .62, amp: .15, halo: false }); });
    if (Math.abs(f) > .35) { var s = Math.sign(f); p.line([[hc[0] + s * hr * .9, hc[1] - hr * .04 + look * hr * .1], [hc[0] + s * hr * (st.bigNose ? 1.45 : 1.24), hc[1] + hr * .2], [hc[0] + s * hr * .93, hc[1] + hr * .28]], { w: .8, amp: .25, halo: false }); }
    var mx = hc[0] + f * hr * .58, my = hc[1] + hr * .4 + look * hr * .08, mw = hr * (.44 - Math.abs(f) * .14);
    if (st.mustache) p.line([[mx - mw, my + hr * .1], [mx - mw * .45, my - hr * .03], [mx, my + hr * .05], [mx + mw * .45, my - hr * .03], [mx + mw, my + hr * .1]], { w: 1.15, amp: .3, halo: false });
    if (st.pencil) p.line([[mx - mw * .8, my + hr * .02], [mx, my - hr * .04], [mx + mw * .8, my + hr * .02]], { w: .55, amp: .1, halo: false });
    if (st.stubble) for (var i = 0; i < 7; i++) p.dot(hc[0] + f * hr * .35 + (rnd(i, 3) - .5) * hr * .9, hc[1] + hr * (.45 + rnd(i, 5) * .3), hr * .04, 'rgba(31,26,23,.55)');
    if (P.mouth === 'o') p.circ(hc[0] + f * hr * .62, hc[1] + hr * .46, hr * .13, { w: .7, halo: false, n: 8, amp: .15 });
    else if (P.mouth === 'smile') p.line([[mx - mw * .7, my + hr * .02], [mx, my + hr * .14], [mx + mw * .7, my + hr * .02]], { w: .7, halo: false, amp: .1 });
    else if (P.mouth === 'flat') p.line([[mx - mw * .5, my + hr * .08], [mx + mw * .5, my + hr * .08]], { w: .7, halo: false, amp: .1 });
    else if (P.mouth === 'shh') p.line([[mx - mw * .35, my + hr * .1], [mx + mw * .35, my + hr * .1]], { w: .7, halo: false, amp: .1 });
  }
  function hat(p, P, hc, hr, st) {
    var s = sgnOf(P.face || 0), tilt = P.tilt || 0, lift = (P.hatLift || 0) * hr;
    var T = function (pts) { return pts.map(function (q) { return rot([hc[0] + q[0] * hr, hc[1] + q[1] * hr - lift], hc, tilt); }); };
    var M = function (pts) { return pts.map(function (q) { return [q[0] * (s || 1), q[1]]; }); };
    switch (st.hat) {
      case 'bowler':
        p.shape(T([[-.82, -.62], [-.8, -1.1], [-.45, -1.5], [.45, -1.5], [.8, -1.1], [.82, -.62]]), { fill: INK });
        p.shape(T([[-1.3, -.56], [-1.18, -.72], [1.18, -.72], [1.3, -.56], [0, -.5]]), { fill: INK });
        p.line(T([[-.45, -1.25], [-.2, -1.4]]), { color: '#fff', w: .7, halo: false, amp: .1 });
        break;
      case 'pillbox':
        p.shape(T([[-.62, -.7], [-.58, -1.48], [.58, -1.48], [.62, -.7]]), { fill: INK });
        p.line(T([[-.6, -.92], [.6, -.92]]), { color: '#fff', w: .9, halo: false, amp: .1 });
        p.dot(T([[0, -1.6]])[0][0], T([[0, -1.6]])[0][1], hr * .12);
        p.line(T(s ? M([[-.7, -.7], [-.2, .5], [.5, .92]]) : [[-.85, -.6], [-.6, .6], [0, .98], [.6, .6], [.85, -.6]]), { w: .5, halo: false, amp: .1 });
        break;
      case 'bucket':
        p.shape(T([[-1.42, -.36], [-1.0, -.62], [1.0, -.62], [1.42, -.36], [1.05, -.28], [-1.05, -.28]]), { fill: '#fff', w: .9 });
        p.shape(T([[-.86, -.58], [-.8, -1.12], [-.4, -1.36], [.4, -1.36], [.8, -1.12], [.86, -.58]]), { fill: '#fff' });
        p.line(T([[-.84, -.78], [.84, -.78]]), { w: 1.4, halo: false, amp: .1 });
        p.line(T(M([[.35, -.85], [.62, -1.2], [.75, -1.08]])), { w: .6, halo: false, amp: .1 });
        break;
      case 'beanie':
        p.shape(T([[-1.04, -.22], [-.98, -.75], [-.55, -1.12], [.55, -1.12], [.98, -.75], [1.04, -.22]]), { fill: INK });
        p.line(T([[-1.0, -.4], [1.0, -.4]]), { color: '#fff', w: .6, halo: false, amp: .1 });
        break;
      case 'painter':   // a folded-paper painter's hat
        p.shape(T([[-1.08, -.3], [-.2, -1.5], [1.08, -.3]]), { fill: '#fff' });
        p.line(T([[-1.08, -.48], [1.08, -.48]]), { w: .8, halo: false, amp: .1 });
        if (P.paintDab) p.dot(T([[.25, -.8]])[0][0], T([[.25, -.8]])[0][1], hr * .16, P.paintDab);
        break;
      case 'cap':
        p.shape(T(M([[-1.04, -.25], [-.98, -.7], [-.55, -1.08], [.15, -1.17], [.78, -1.0], [1.12, -.6], [1.1, -.3], [.6, -.3]])), { fill: '#fff' });
        p.shape(T(M([[.6, -.32], [1.52, -.22], [1.48, -.12], [.66, -.2]])), { fill: INK, w: .8 });
        break;
    }
  }
  /* P: { hip, lean, fL, fR, hL, hR, face (-1 left … 1 right), look, blink, brow, wide, eyeX, mouth, hd, kb, eb, armsFront, tilt, hatLift }
     st: { hat, mustache, pencil, stubble, tie, bow, mask, bigNose, belly, coat, apron } */
  function figure(p, U, P, st) {
    st = st || {};
    var f = P.face || 0, sg = sgnOf(f), hip = P.hip, lean = P.lean || 0, T = U * .31, hr = U * .1;
    var neck = [hip[0] + Math.sin(lean) * T, hip[1] - Math.cos(lean) * T], hd = P.hd || [0, 0];
    var hc = [neck[0] + Math.sin(lean) * hr * 1.1 + hd[0], neck[1] - Math.cos(lean) * hr * 1.1 + hd[1]];
    var sh = [lerp(neck[0], hip[0], .08), lerp(neck[1], hip[1], .08)];
    var kb = P.kb || (sg ? [-sg, -sg] : [1, -1]), eb = P.eb || (sg ? [sg, sg] : [1, -1]);
    var J = { hip: hip, neck: neck, hc: hc, hr: hr, sh: sh };
    p.g();
    [['fL', 0], ['fR', 1]].forEach(function (k) {
      var r = ik(hip, P[k[0]], U * .235, U * .235, kb[k[1]]), kn = r[0], ft = r[1];
      p.line([hip, kn]); p.line([kn, ft]);
      var fd = P.fdir ? P.fdir[k[1]] : (sg || (k[1] ? 1 : -1));
      p.line([ft, [ft[0] + fd * U * .055, ft[1]]]);
      J[k[0]] = ft; J[k[0] + 'k'] = kn;
    });
    if (st.coat) {   // a long coat: a narrow shape from the shoulders to the knees
      var kneeY = lerp(hip[1], (J.fL[1] + J.fR[1]) / 2, .5);
      p.shape([[neck[0] - U * .045, neck[1] + U * .02], [neck[0] + U * .045, neck[1] + U * .02], [hip[0] + U * .07, kneeY], [hip[0] - U * .07, kneeY]], { fill: '#fff', w: .9 });
      p.line([[neck[0] + sg * U * .01, neck[1] + U * .03], [hip[0] + sg * U * .02, hip[1]]], { w: .5, halo: false, amp: .2 });
    } else if (st.apron) {
      p.shape([[lerp(neck[0], hip[0], .35) - U * .05, lerp(neck[1], hip[1], .35)], [lerp(neck[0], hip[0], .35) + U * .05, lerp(neck[1], hip[1], .35)], [hip[0] + U * .065, hip[1] + U * .1], [hip[0] - U * .065, hip[1] + U * .1]], { fill: '#fff', w: .8 });
      if (st.apronDab) p.dot(hip[0] + U * .02, hip[1] + U * .04, U * .016, st.apronDab);
      p.line([hip, neck]);
    } else if (st.belly && sg) { var m = [lerp(hip[0], neck[0], .42) + sg * U * .075, lerp(hip[1], neck[1], .42)]; p.line([hip, m, neck]); }
    else p.line([hip, neck]);
    if (st.stripes) [.3, .5, .7].forEach(function (u) { var c = mixPt(neck, hip, u); p.line([[c[0] - U * .045, c[1]], [c[0] + U * .045, c[1]]], { w: 1.6, amp: .2 }); });
    if (st.tie) { var kx = lerp(neck[0], hip[0], .07) + sg * U * .022, ky = lerp(neck[1], hip[1], .07), tw = sg ? U * .011 : U * .02; p.shape([[kx, ky], [kx - tw, ky + U * .035], [kx + (P.tieSwing || 0) * U, ky + U * .16], [kx + tw, ky + U * .035]], { fill: INK, w: .6, amp: .25 }); }
    if (st.bow) { var bx = lerp(neck[0], hip[0], .06) + sg * U * .02, by = lerp(neck[1], hip[1], .06), bw = sg ? U * .025 : U * .045; p.shape([[bx, by], [bx - bw, by - U * .024], [bx - bw, by + U * .024]], { fill: INK, w: .6, amp: .2 }); p.shape([[bx, by], [bx + bw, by - U * .024], [bx + bw, by + U * .024]], { fill: INK, w: .6, amp: .2 }); }
    if (st.buttons) [.2, .38, .56].forEach(function (u) { var c = mixPt(neck, hip, u); p.dot(c[0] + sg * U * .02, c[1], U * .011); });
    var arms = function () {
      [['hL', 0], ['hR', 1]].forEach(function (k) { var r = ik(sh, P[k[0]], U * .17, U * .17, eb[k[1]]); p.line([sh, r[0]]); p.line([r[0], r[1]]); J[k[0]] = r[1]; J[k[0] + 'e'] = r[0]; });
    };
    if (!P.armsFront) arms();
    p.circ(hc[0], hc[1], hr, { fill: P.headFill || '#fff' });
    face(p, P, hc, hr, st);
    if (P.underHat) P.underHat(p, hc, hr);   // whatever he keeps under his hat
    hat(p, P, hc, hr, st);
    if (P.armsFront) arms();
    return J;
  }
  /* walking: feet plant and swing on a stride, the hip bobs, arms counter-swing; it settles into a stance */
  function walk(U, G, P, t, t0, t1, x0, x1, o) {
    o = o || {};
    var dir = x1 >= x0 ? 1 : -1, k = clamp((t - t0) / (t1 - t0), 0, 1), x = lerp(x0, x1, o.ease ? E[o.ease](k) : k);
    var L = U * (o.stride || .62), u = Math.abs(x - x0) / L, w = k > .8 ? E.io((k - .8) / .2) : 0, lift = o.lift != null ? o.lift : .065;
    var feet = [0, .5].map(function (off) {
      var v = u + off, n = Math.floor(v), ph = v - n, fx = (n - off) * L + L / 4, lf = 0;
      if (ph >= .5) { var s = (ph - .5) * 2; fx += L * E.io(s); lf = Math.sin(Math.PI * s) * U * lift; }
      return [x0 + dir * fx, G - lf];
    });
    var fs = feet[0][0] < feet[1][0] ? feet : [feet[1], feet[0]], sp = o.spread != null ? o.spread : .07;
    var out = Object.assign({}, P);
    out.fL = [lerp(fs[0][0], x1 - U * sp, w), lerp(fs[0][1], G, w)];
    out.fR = [lerp(fs[1][0], x1 + U * sp, w), lerp(fs[1][1], G, w)];
    var bob = U * (o.bob || .012) * Math.cos(4 * Math.PI * (u - .25)) * (1 - w);
    out.hip = [x, G - U * (o.hipH || .415) - bob];
    if (!o.carry) { out.hL = [x - (feet[1][0] - x) * .55 * (1 - w), G - U * .44]; out.hR = [x - (feet[0][0] - x) * .55 * (1 - w), G - U * .44]; }
    out.face = o.face != null ? o.face : dir;
    out.lean = (o.lean != null ? o.lean : dir * .05) * (1 - w) + (P.lean || 0) * w;
    out._u = u;
    return out;
  }
  /* a standing pose at x on ground G, facing f */
  function stand(U, G, x, f, o) {
    o = o || {}; var sp = o.spread || .07;
    return { hip: [x, G - U * (o.hipH || .415)], fL: [x - U * sp, G], fR: [x + U * sp, G], hL: [x - U * .12, G - U * .44], hR: [x + U * .12, G - U * .44], face: f, lean: 0 };
  }
  function shadow(p, x, G, rx, op) { p.g({ halo: false, op: op }); p.circ(x, G + 1, rx, { sy: .13, fill: WASH, stroke: false, amp: .3, n: 12 }); p.g(); }
  function burst(p, c, r0, r1, n, a0, w) { p.g({ halo: false }); for (var i = 0; i < n; i++) { var a = a0 + i / n * Math.PI * 2; p.line([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1]], { w: w || .8, amp: .3 }); } p.g(); }
  function speed(p, c, dx, dy, n, len, gap) { var d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d; p.g({ halo: false }); for (var i = 0; i < n; i++) { var o = (i - (n - 1) / 2) * gap; p.line([[c[0] - uy * o - ux * 6, c[1] + ux * o - uy * 6], [c[0] - uy * o - ux * (6 + len), c[1] + ux * o - uy * (6 + len)]], { w: .6, amp: .2, color: 'rgba(31,26,23,.55)' }); } p.g(); }
  function puff(p, c, r, u) { if (u <= 0 || u >= 1) return; p.g({ op: 1 - u * .7 }); var R = r * (.5 + u); for (var i = 0; i < 4; i++) { var a = i / 4 * Math.PI * 2 + .4; p.circ(c[0] + Math.cos(a) * R * .55, c[1] + Math.sin(a) * R * .3 - u * r * .4, R * .45, { fill: '#F3EFE8', w: .6 }); } p.g(); }
  function sweat(p, x, y, u) { if (u <= 0 || u >= 1) return; p.g(); p.shape([[x, y - 3 + u * 9], [x + 2, y + 1.5 + u * 9], [x, y + 3 + u * 9], [x - 2, y + 1.5 + u * 9]], { fill: '#fff', w: .5, amp: .1 }); }
  function star(p, c, r, n, seed) { var pts = []; for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * Math.PI * 2 + seed, rr = i % 2 ? r * .45 : r * (.8 + rnd(seed * 100, i) * .4); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); } p.g(); p.shape(pts, { fill: '#fff', w: .7, amp: .3 }); }

  /* ── chips: front on, like the game's — the colour, six white notches, an inlay, the initial ── */
  var uidN = 0;
  function chip(p, x, y, col, ini, o) {
    o = o || {}; var r = (o.r || CR), sx = o.sx == null ? 1 : o.sx, a = o.rot || 0, sy = o.sy == null ? 1 : o.sy;
    var T = function (px, py) { var q = [px * sx, py * sy], c = Math.cos(a), s = Math.sin(a); return [x + q[0] * c - q[1] * s, y + q[0] * s + q[1] * c]; };
    var poly = function (pts) { return 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z'; };
    var circle = function (rr, n) { var pts = []; for (var i = 0; i < (n || 22); i++) { var t = i / (n || 22) * 6.2832; pts.push(T(Math.cos(t) * rr, Math.sin(t) * rr)); } return pts; };
    p.g({ halo: false, op: o.op });
    var shp = circle(r).map(function (q) { return [q[0], q[1] + 2.2]; });
    var s = '<path d="' + poly(shp) + '" fill="' + INK + '"/>' + '<path d="' + poly(circle(r)) + '" fill="' + col + '"/>';
    if (Math.abs(sx) > .18 && Math.abs(sy) > .18) {
      for (var i = 0; i < 6; i++) { var t0 = (i / 6 + .03) * 6.2832, d = .25; s += '<path d="' + poly([T(Math.cos(t0 - d) * r * .97, Math.sin(t0 - d) * r * .97), T(Math.cos(t0 + d) * r * .97, Math.sin(t0 + d) * r * .97), T(Math.cos(t0 + d * .8) * r * .64, Math.sin(t0 + d * .8) * r * .64), T(Math.cos(t0 - d * .8) * r * .64, Math.sin(t0 - d * .8) * r * .64)]) + '" fill="#fff"/>'; }
      s += '<path d="' + poly(circle(r * .6, 16)) + '" fill="' + col + '"/>';
      if (ini && Math.abs(sx) > .55 && Math.abs(sy) > .55) { var c0 = T(0, 0); s += '<text x="0" y="0" transform="translate(' + c0[0].toFixed(1) + ' ' + c0[1].toFixed(1) + ') rotate(' + (a * 57.3).toFixed(1) + ') scale(' + sx.toFixed(2) + ' ' + sy.toFixed(2) + ')" dy="' + (r * .32).toFixed(1) + '" text-anchor="middle" font-size="' + (r * .86).toFixed(1) + '" font-weight="800" font-family="Nunito,system-ui,-apple-system,sans-serif" fill="#fff">' + ini + '</text>'; }
    }
    p.raw(s);
    p.g({ op: o.op });
    p.shape(circle(r, 12), { w: .7, amp: .25 });
    p.g();
  }
  /* a stolen chip, as the game shows it afterwards: the dealer's colour, a drip of fresh paint */
  function paintedChip(p, x, y, col, ini, drip) {
    chip(p, x, y, col, ini);
    if (drip > 0) { p.g({ halo: false }); var L = CR * .55 * drip; p.raw('<path d="M' + (x - 2.4) + ' ' + (y + CR - 2) + 'Q' + (x - 2.6) + ' ' + (y + CR + L) + ' ' + x + ' ' + (y + CR + L + 1.6) + 'Q' + (x + 2.6) + ' ' + (y + CR + L) + ' ' + (x + 2.4) + ' ' + (y + CR - 2) + 'Z" fill="' + col + '" stroke="' + INK + '" stroke-width="1.1"/>'); p.g(); }
  }

  /* ── the table: caption cards stacked as the steal screen shows them, chips perched on their top edges ── */
  function layout(opts) {
    var cards = opts.cards, n = cards.length, h = n >= 5 ? 44 : CARD.h, gap = n >= 5 ? 24 : CARD.gap, L = { cards: [], n: n };
    for (var i = 0; i < n; i++) {
      var top = CARD.top0 + i * (h + gap), c = { i: i, num: cards[i].num, x0: CARD.x0, x1: CARD.x1, top: top, bot: top + h, h: h, chips: [] };
      c.lines = [.9 - rnd(i + 3, 1) * .25, .35 + rnd(i + 3, 2) * .35];
      (cards[i].chips || []).forEach(function (q, j) { c.chips.push({ j: j, x: CARD.x1 - 26 - j * (CR * 2 + 4), y: top - CR + 3, c: q.c, ini: q.i || '', card: c }); });
      L.cards.push(c);
    }
    var t = opts.target || { card: 0, chip: 0 };
    L.tc = L.cards[t.card]; L.tch = L.tc.chips[t.chip];
    L.H = L.cards[n - 1].bot + 66;
    return L;
  }
  function drawCard(p, c, o) {
    o = o || {}; var dx = o.dx || 0, dy = o.dy || 0, x0 = c.x0 + dx, x1 = c.x1 + dx, y0 = c.top + dy, y1 = c.bot + dy, r = CARD.r;
    var rr = function (ox, oy) { var pts = [], q = [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]]; q.forEach(function (k) { for (var j = 0; j < 4; j++) { var a = (k[2] + j * 30) * Math.PI / 180; pts.push([k[0] + Math.cos(a) * r + ox, k[1] + Math.sin(a) * r + oy]); } }); return pts; };
    p.g({ halo: false }); p.shape(rr(3, 3), { fill: INK, stroke: false, amp: .3 });
    p.g(); p.shape(rr(0, 0), { fill: '#fff', w: 1.05, amp: .45 });
    // stand-in caption: two grey lines where the words would be
    p.g({ halo: false });
    var ly = y0 + c.h * .42, w = x1 - x0 - 44;
    p.line([[x0 + 20, ly], [x0 + 20 + w * c.lines[0], ly + .5]], { w: 2.6, color: PENCIL, amp: .35 });
    p.line([[x0 + 20, ly + c.h * .3], [x0 + 20 + w * c.lines[1], ly + c.h * .3 - .4]], { w: 2.6, color: PENCIL, amp: .35 });
    // the number badge on the top edge
    p.g(); p.shape([[x0 + 14, y0 - 8], [x0 + 32, y0 - 8], [x0 + 36, y0], [x0 + 32, y0 + 8], [x0 + 14, y0 + 8], [x0 + 10, y0]], { fill: INK, w: .5, amp: .2 });
    p.raw('<text x="' + (x0 + 23) + '" y="' + (y0 + 3.6) + '" text-anchor="middle" font-size="10" font-weight="800" font-family="Nunito,system-ui,-apple-system,sans-serif" fill="#FFF8EA">' + (c.num != null ? esc(c.num) : c.i + 1) + '</text>');
    p.g();
  }

  /* ── the stage ── */
  var CSS = '.ccs{position:relative;width:100%;}' +
    '.ccs-scr{position:relative;background:var(--paper,#FFF8EA);border:1.5px solid var(--line,#E6DCC8);border-radius:12px;overflow:hidden;}' +
    '.ccs-bar{display:flex;justify-content:space-between;align-items:center;font:800 12px/1 var(--sans,"Nunito",system-ui,sans-serif);color:var(--muted,#6E655C);padding:11px 14px 0;letter-spacing:.02em;}' +
    '.ccs-bar b{color:var(--ink-2,#4A433D);font-weight:800;}' +
    '.ccs svg{display:block;width:100%;height:auto;overflow:visible;}' +
    '.ccs-under{text-align:center;padding:14px 8px 4px;min-height:104px;}' +
    '.ccs-cap{font-family:var(--serif,"Libre Caslon Text",Georgia,"Times New Roman",serif);font-style:normal;font-weight:400;font-size:clamp(18px,5.4vw,22px);line-height:1.3;color:var(--ink,#1F1A17);margin:0 auto;max-width:330px;opacity:0;transform:translateY(5px);transition:opacity .32s ease,transform .32s ease;text-wrap:balance;}' +
    '.ccs-who{font-family:var(--sans,"Nunito",system-ui,sans-serif);font-weight:800;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted,#6E655C);margin:10px 0 0;opacity:0;transition:opacity .3s;}' +
    '.ccs-who b{color:var(--ink,#1F1A17);font-weight:900;}' +
    '.ccs-who i{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 6px 0 0;vertical-align:-1px;border:1.5px solid var(--ink,#1F1A17);}' +
    '.ccs-cap.on{opacity:1;transform:none;}.ccs-who.on{opacity:1;}' +
    '.ccs-fade{animation:ccsFade .4s ease-out both}@keyframes ccsFade{from{opacity:0}to{opacity:1}}';
  function injectCSS() { if (document.getElementById('ccs-css')) return; var s = document.createElement('style'); s.id = 'ccs-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var HEISTS = {};
  function reg(id, def) { def.id = id; HEISTS[id] = def; }
  function setup(container, opts) {
    injectCSS();
    var h = HEISTS[opts.heist] || HEISTS.cat, mode = opts.mode === 'short' ? 'short' : 'full', L = layout(opts), M = h[mode];
    container.innerHTML = '<div class="ccs"><div class="ccs-scr"><div class="ccs-bar"><span>' + (opts.round ? 'Round ' + esc(opts.round) + ' · ' : '') + '<b>The steal</b></span><span>' + (opts.dealerYou ? 'You’re dealing' : esc(opts.dealer || 'The dealer') + ' is dealing') + '</span></div>' +
      '<svg viewBox="0 0 ' + VW + ' ' + L.H + '" role="img" aria-label="The dealer steals a chip"><g class="bs"></g><g class="dy"></g></svg></div>' +
      '<div class="ccs-under"><p class="ccs-cap"></p><p class="ccs-who"></p></div></div>';
    var root = container.firstChild;
    var st = { root: root, bs: root.querySelector('.bs'), dy: root.querySelector('.dy'), cap: root.querySelector('.ccs-cap'), who: root.querySelector('.ccs-who'), cache: {} };
    st.cap.textContent = opts.caption || (mode === 'short' ? h.tags[0] : h.captions[0]);
    st.who.innerHTML = '<i style="background:' + L.tch.c + '"></i>' + (opts.victimYou ? 'Your chip' : esc(opts.victim || 'Their') + '’s chip') + ' · now <b>' + (opts.dealerYou ? 'yours' : esc(opts.dealer || 'the dealer') + '’s') + '</b>';
    var S = { h: h, mode: mode, L: L, M: M, st: st, opts: opts, U: U0, dc: opts.dealerColor || '#E8559E', di: opts.dealerInitial || (opts.dealer || 'M').charAt(0), seed: opts.seed || 7 };
    if (h.setup) h.setup(S);
    return S;
  }
  /* the cards and the chips nobody touches: cached per boil state */
  function staticSVG(S, b) {
    if (S.st.cache[b]) return S.st.cache[b];
    var p = new Pen(b, S.U, 11), h = S.h;
    S.L.cards.forEach(function (c) {
      if (h.dynCard && c === S.L.tc) return;
      drawCard(p, c);
      if (h.ownChips && c === S.L.tc) return;   // the gag draws this card's chips itself (someone walks behind them)
      c.chips.forEach(function (q) { if (q !== S.L.tch) chip(p, q.x, q.y, q.c, q.ini); });
    });
    return (S.st.cache[b] = p.svg());
  }
  function onesAt(M, t) { return (M.ones || []).some(function (w) { return t >= w[0] && t < w[1]; }); }
  function render(S, t, still) {
    var M = S.M, fps = onesAt(M, t) ? 24 : 12, tq = still ? t : Math.min(M.T, Math.floor(t * fps + 1e-6) / fps), b = still ? 0 : Math.floor(t * 12) % 3;
    var s = staticSVG(S, b); if (S.st.lastS !== s) { S.st.bs.innerHTML = s; S.st.lastS = s; }
    var p = new Pen(b, S.U, 5);
    if (S.h.dynCard) { /* the gag draws the target card itself */ }
    S.h.draw(S, tq, p, S.mode);
    S.st.dy.innerHTML = p.svg();
    S.st.who.classList.toggle('on', tq >= M.tGone); S.st.cap.classList.toggle('on', tq >= M.tCap);
  }
  function reducedPref() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function frame(container, opts, t) { var S = setup(container, opts); render(S, t, !!opts.still); return S; }
  function play(container, opts) {
    opts = opts || {};
    var S = setup(container, opts), M = S.M, reduced = opts.reduced != null ? opts.reduced : reducedPref();
    if (reduced) {   // a short fade to the last drawing, then the closing line
      return new Promise(function (res) {
        render(S, Math.min(M.T - .05, M.tCap + .3), true); S.st.cap.classList.remove('on'); S.st.who.classList.add('on');
        S.st.root.querySelector('svg').classList.add('ccs-fade');
        setTimeout(function () { S.st.cap.classList.add('on'); }, 380);
        setTimeout(res, (S.mode === 'short' ? 1.9 : 3.4) * 1000);
      });
    }
    var t0 = opts.startAt != null ? opts.startAt : performance.now(), last = '', cues = (S.h.cues && S.h.cues[S.mode]) || [], ci = 0;
    return new Promise(function (res) {
      function tick(now) {
        var t = Math.max(0, (now - t0) / 1000);
        if (t >= M.T) { render(S, M.T - .001); res(); return; }
        var fps = onesAt(M, t) ? 24 : 12, key = Math.floor(t * fps) + ':' + (Math.floor(t * 12) % 3) + ':' + fps;
        if (key !== last) { last = key; try { render(S, t); } catch (e) { console.error(e); res(); return; } }
        while (ci < cues.length && t >= cues[ci][0]) { if (opts.onCue) try { opts.onCue(cues[ci][1]); } catch (e) {} ci++; }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  window.CCSteal = {
    play: play, frame: frame, HEISTS: HEISTS, reg: reg,
    kit: { INK: INK, WASH: WASH, WASH2: WASH2, CR: CR, CARD: CARD, VW: VW, clamp: clamp, lerp: lerp, seg: seg, E: E, hash: hash, rnd: rnd, rot: rot, qb: qb, mixPt: mixPt, track: track,
      Pen: Pen, ik: ik, figure: figure, walk: walk, stand: stand, shadow: shadow, burst: burst, speed: speed, puff: puff, sweat: sweat, star: star, chip: chip, paintedChip: paintedChip, drawCard: drawCard }
  };
})();

/* ═════════ THE CAT — walks along the top of the card, sits behind the chip, and, holding your eye the whole
   time, pushes it off the edge. ═════════ */
(function () {
  var k = CCSteal.kit, E = k.E, seg = k.seg, lerp = k.lerp, CR = k.CR, INK = k.INK;
  /* sitting, facing us: (x, G) the middle of her seat; o: {sc, sx, sy, eyeX, eyeY, lid (0 open … 1 shut), paw: [x,y] | null, tail, ear, tilt} */
  function catFront(p, x, G, o) {
    var s = o.sc || 1, sx = (o.sx || 1) * s * (o.flip ? -1 : 1), sy = (o.sy || 1) * s;
    var P = function (px, py) { return [x + px * sx, G + py * sy]; }, M = function (pts) { return pts.map(function (q) { return P(q[0], q[1]); }); };
    var tf = o.tail || 0;
    p.g();
    p.line(M([[20, -4], [32, -6], [38, -16 + tf * 2], [36 + tf * 5, -28 - tf * 3], [30 + tf * 8, -32 - tf * 4]]), { w: 1.6 });
    p.shape(M([[-23, 0], [-25, -12], [-20, -29], [-13, -41], [-6, -46], [6, -46], [13, -41], [20, -29], [25, -12], [23, 0], [0, 2]]), { fill: '#fff' });
    p.g({ halo: false }); p.shape(M([[-22, -1], [-24, -12], [-19, -28], [-13, -38], [-12, -22], [-13, -6]]), { fill: k.WASH, stroke: false });
    p.line(M([[-21, -8], [-15, -20], [-9, -14]]), { w: .55 }); p.line(M([[21, -8], [15, -20], [9, -14]]), { w: .55 });
    p.line(M([[-20, -25], [-15, -27]]), { w: .55 }); p.line(M([[-19, -31], [-14, -32.5]]), { w: .55 });
    p.g();
    p.circ(P(-17, -2.5)[0], P(-17, -2.5)[1], 6.5 * s, { fill: '#fff', sy: .45, w: .8 }); p.circ(P(17, -2.5)[0], P(17, -2.5)[1], 6.5 * s, { fill: '#fff', sy: .45, w: .8 });
    // the leg she isn't using
    p.line(M([[6, -29], [6.5, -14], [6.2, -3]]), { w: .9 }); p.circ(P(7, -2.4)[0], P(7, -2.4)[1], 5.4 * s, { fill: '#fff', sy: .5, w: .8 });
    // the leg she is
    var sh = P(-6, -30), pw = o.paw || P(-6.6, -2.4), mid = [(sh[0] + pw[0]) / 2 - 2 * s, (sh[1] + pw[1]) / 2];
    p.line([sh, mid, [pw[0], pw[1] - 1]], { w: .9 });
    p.circ(pw[0], pw[1], 5.4 * s, { fill: '#fff', sy: .5, w: .8 });
    // the head
    var hc = P(0, -58), T = function (pts) { return pts.map(function (q) { return k.rot([hc[0] + q[0] * s, hc[1] + q[1] * s], hc, (o.tilt || 0)); }); };
    hc[0] += (o.headX || 0) * s;
    var er = o.ear || 0;
    p.shape(T([[-18, -6], [-16 - er, -26], [-5, -15]]), { fill: '#fff', w: .9 });
    p.shape(T([[18, -6], [16, -26], [5, -15]]), { fill: '#fff', w: .9 });
    p.shape(T([[-20, 0], [-18, -10], [-10, -16], [0, -17.5], [10, -16], [18, -10], [20, 0], [16, 10], [6, 15.5], [-6, 15.5], [-16, 10]]), { fill: '#fff' });
    p.g({ halo: false });
    p.line(T([[-4, -15], [-3, -10.5]]), { w: .5 }); p.line(T([[0, -16], [0, -11]]), { w: .5 }); p.line(T([[4, -15], [3, -10.5]]), { w: .5 });
    var lid = o.lid == null ? .45 : o.lid, ex = o.eyeX || 0, eyY = o.eyeY || 0;
    [-8, 8].forEach(function (cx) {
      if (lid > .9) { p.line(T([[cx - 5, -1.5], [cx, -.6], [cx + 5, -1.5]]), { w: .7 }); return; }
      var top = -6.5 + lid * 9;
      p.shape(T([[cx - 5.2, top], [cx + 5.2, top], [cx + 5, -.5], [cx + 3, 2.6], [cx, 3.5], [cx - 3, 2.6], [cx - 5, -.5]]), { fill: '#fff', w: .55, amp: .15 });
      var py = Math.max(top + 1.8, -1 + eyY), q = T([[cx + ex * 2.4, py]])[0];
      p.shape([[q[0], q[1] - 2.3 * s], [q[0] + 1.2 * s, q[1]], [q[0], q[1] + 2.3 * s], [q[0] - 1.2 * s, q[1]]], { fill: INK, w: .3, amp: .05 });
      p.line(T([[cx - 6, top - .2], [cx + 6, top + .2]]), { w: .8, amp: .1 });
    });
    p.shape(T([[-2.4, 4.5], [2.4, 4.5], [0, 7]]), { fill: INK, w: .4, amp: .05 });
    p.line(T([[-4.2, 9.5], [-1.8, 10.6], [0, 8.4], [1.8, 10.6], [4.2, 9.5]]), { w: .5, amp: .1 });
    [-1, 1].forEach(function (sg) { [0, 1, 2].forEach(function (i) { p.line(T([[sg * 9, 5.5 + i * 1.6], [sg * (21 + (i === 1 ? 2 : 0)), 3.4 + i * 3.6]]), { w: .4, amp: .15 }); }); });
    p.g();
  }
  /* walking along the ledge, side on, tail up; ph = stride phase, f = facing */
  function catWalk(p, x, G, f, ph, s) {
    s = s || 1; var P = function (px, py) { return [x + px * f * s, G + py * s]; }, M = function (pts) { return pts.map(function (q) { return P(q[0], q[1]); }); };
    p.g();
    var legs = [[-14, 0], [13, .5], [-10, .5], [17, 0]];
    var leg = function (l, far) { var sw = Math.sin((ph + l[1]) * Math.PI * 2), lift = Math.max(0, Math.cos((ph + l[1]) * Math.PI * 2)) * 3; p.line(M([[l[0], -20], [l[0] + sw * 6, -lift]]), { w: far ? .8 : .95 }); };
    leg(legs[0], 1); leg(legs[1], 1);
    p.line(M([[-21, -27], [-30, -36], [-31, -50], [-26, -58], [-22, -56]]), { w: 1.5 });
    p.shape(M([[-22, -26], [-18, -33], [0, -34.5], [17, -32], [22, -25], [17, -18], [0, -17.5], [-17, -19]]), { fill: '#fff' });
    p.g({ halo: false }); p.shape(M([[-20, -22], [-14, -19], [10, -18.5], [18, -21], [10, -24], [-14, -24]]), { fill: k.WASH, stroke: false }); p.g();
    leg(legs[2], 0); leg(legs[3], 0);
    var hc = P(25, -38);
    p.shape(M([[17, -42], [19, -52], [24, -45]]), { fill: '#fff', w: .8 }); p.shape(M([[26, -45], [31, -53], [32, -42]]), { fill: '#fff', w: .8 });
    p.circ(hc[0], hc[1], 10 * s, { fill: '#fff', sx: 1.05 });
    p.g({ halo: false });
    var e = P(29, -40); p.line([[e[0] - 2.5 * s, e[1]], [e[0] + 2.5 * s, e[1] - .4]], { w: .7 }); p.dot(e[0] + f * 1 * s, e[1] + 1.2 * s, 1.3 * s);
    var n = P(34.5, -35.5); p.dot(n[0], n[1], 1.2 * s);
    p.line(M([[30, -34], [41, -36]]), { w: .4 }); p.line(M([[30, -32.5], [41, -31.5]]), { w: .4 });
    p.g();
  }

  function T(mode) {
    return mode === 'short' ? { walk1: -1, sit: -1, look: 0, pawOn: .14, push1: .3, push2: 9, hold2: 9, tap: .32, fall: .36, blink: 1.3, side: 9, end: 2 }
      : { walk0: .05, walk1: .95, sit: 1.1, look: 1.45, pawOn: 1.72, push1: 2.08, push2: 2.48, tap: 3.02, fall: 3.08, blink: 3.66, side: 5.15, end: 6.5 };
  }
  CCSteal.reg('cat', {
    name: 'The Cat',
    line: 'Walks along the top of the card, sits behind the chip and pushes it off the edge, never once looking away from you.',
    ownChips: true,
    full: { T: 6.5, tGone: 3.14, tCap: 3.86, ones: [[3.06, 3.42]] },
    short: { T: 2.0, tGone: .4, tCap: .78, ones: [[.3, .66]] },
    captions: [
      'She does it slower when you’re watching.',
      'Don’t chase her. You’ll only make it a game.',
      'It’ll turn up in a shoe in about a month.'
    ],
    tags: ['Oops.', 'And?'],
    cues: { full: [[.1, 'paws'], [1.1, 'flump'], [2.08, 'scrape'], [3.08, 'tip'], [3.5, 'tink']], short: [[.3, 'swat'], [.7, 'tink']] },
    poster: 1.3,
    draw: function (S, t, p, mode) {
      var L = S.L, c = L.tc, q = L.tch, G = c.top, U = S.U, X = T(mode), sc = U / 124 * 1.4;
      var others = c.chips.filter(function (z) { return z !== q; }), CX = q.x - 17 * sc;   // she sits just left of the chip
      // where the chip is: sitting, tipping toward us in two pushes, teetering, then over and down
      var tip = 0, cy = q.y, cx = q.x, falling = false, fu = 0;
      if (mode === 'full') tip = t < X.pawOn ? 0 : t < X.push1 ? .28 * E.out(seg(t, X.pawOn + .12, X.push1)) : t < X.push2 ? .28 : t < X.tap ? .28 + .3 * E.out(seg(t, X.push2, X.push2 + .26)) : .58;
      else tip = t < X.pawOn ? 0 : .3 * seg(t, X.pawOn, X.tap);
      var wob = (mode === 'full' && t > X.push2 + .26 && t < X.tap) ? Math.sin((t - X.push2) * 26) * .05 : 0;
      if (t >= X.fall) { falling = true; fu = (t - X.fall) / .45; }
      var drawChip = function () {
        if (!falling) {
          var a = (tip + wob) * Math.PI / 2, sy = Math.cos(a);
          k.chip(p, cx, G + 3 - CR * sy, q.c, q.ini, { sy: sy });
        } else if (fu < 1.5) {
          var yy = G + 3 + fu * fu * (L.H - G + 40), spin = fu * 5;
          k.chip(p, cx + fu * 6, yy, q.c, q.ini, { sy: Math.max(.15, Math.abs(Math.cos(spin))), rot: fu * .8 });
          if (fu > .1) k.speed(p, [cx + fu * 6, yy], 0, 1, 3, 16, 7);
        }
      };
      // the cat
      if (mode === 'full' && t < X.walk1 + .15) {
        var wx = lerp(-60, CX - 4, E.out(seg(t, X.walk0, X.walk1 + .1)));
        catWalk(p, wx, G, 1, (wx + 40) / 34, sc);
        others.forEach(function (z) { k.chip(p, z.x, z.y, z.c, z.ini); });
        drawChip();
        return;
      }
      var o = { sc: sc, flip: true, lid: .45, eyeX: 0, eyeY: 0, tail: Math.max(0, Math.sin((t - 1) * 2.2)) };
      var sit = mode === 'full' ? seg(t, X.sit - .15, X.sit + .1) : 1;
      o.sx = 1 + .12 * Math.sin(sit * Math.PI); o.sy = 1 - .12 * Math.sin(sit * Math.PI);
      // her eyes: down at the chip, then on you, and they stay on you
      if (mode === 'full' && t < X.look) { o.eyeY = 3; o.lid = .3; o.tilt = .12; }
      if (t >= X.blink && t < X.blink + .22) o.lid = 1;
      if (mode === 'full' && t > 2.75 && t < 2.86) o.ear = 4;
      if (t > X.side && t < X.end - .2) { o.eyeX = others.length ? (others[0].x > CX ? 1 : -1) : 1; o.lid = .5; }
      // the paw: lifted, set on top of the chip, the two pushes, the last little tap
      var top = function () { var a = (tip + wob) * Math.PI / 2; return [cx - 2 * sc, G + 3 - CR * 2 * Math.cos(a) - 1]; };
      var rest = [CX + 6.6 * sc, G - 2.4 * sc], up = [q.x - 4 * sc, G - 34 * sc];
      var paw = rest;
      if (t >= X.pawOn - .22 && t < X.pawOn) paw = k.mixPt(rest, up, E.out(seg(t, X.pawOn - .22, X.pawOn - .08)));
      if (t >= X.pawOn && t < X.fall + .1) paw = top();
      if (mode === 'full' && t >= X.push1 + .12 && t < X.push2 - .12) paw = k.mixPt(top(), up, .25);
      if (mode === 'full' && t >= X.tap - .2 && t < X.tap) paw = k.mixPt(top(), up, .45 * Math.sin(seg(t, X.tap - .2, X.tap) * Math.PI));
      if (t >= X.fall + .1) paw = k.mixPt(top(), rest, E.io(seg(t, X.fall + .1, X.fall + .4)));
      o.paw = paw;
      k.shadow(p, CX, G, 30 * sc);
      catFront(p, CX, G, o);
      others.forEach(function (z) { k.chip(p, z.x, z.y, z.c, z.ini); });
      drawChip();
      if (!falling || t < X.fall + .1) { p.g(); p.circ(paw[0], paw[1], 5.4 * sc, { fill: '#fff', sy: .5, w: .8 }); }
      if (mode === 'full' && t >= X.push1 - .1 && t < X.push1 + .12) k.speed(p, [cx, G - 10], 0, 1, 2, 6, 10);
    }
  });
})();

/* ═════════ THE FISHERMAN — sits on the edge of the screen and fishes the chip off the card. It puts up a fight.
   Landed hard, it comes up the line and smacks him in the face. He poses with it anyway. ═════════ */
(function () {
  var k = CCSteal.kit, E = k.E, seg = k.seg, lerp = k.lerp, CR = k.CR, INK = k.INK;
  var ST = { hat: 'bucket', stubble: true, bigNose: true };
  function T(mode) {
    return mode === 'short' ? { cast0: -1, cast1: -1, drop0: 0, drop1: .2, miss: 9, hook: .24, yank: .34, bonk: .48, peel: .95, pose: 1.15 }
      : { cast0: .12, cast1: .5, drop0: .5, drop1: 1.12, miss: 1.16, hook: 1.62, yank: 2.52, bonk: 2.7, peel: 3.2, pose: 3.4 };
  }
  CCSteal.reg('fisherman', {
    name: 'The Fisherman',
    line: 'Sits on the edge of the screen and fishes the chip off the card. It puts up a fight, then comes up the line into his face.',
    full: { T: 6.4, tGone: 2.6, tCap: 3.8, ones: [[2.5, 2.82]] },
    short: { T: 2.0, tGone: .4, tCap: .88, ones: [[.32, .56]] },
    captions: [
      'He’s having it mounted.',
      'By Sunday it’ll be the size of a dinner plate.',
      'Catch and release. He’s still working on release.'
    ],
    tags: ['Catch of the day.', 'A keeper.'],
    cues: { full: [[.36, 'cast'], [.5, 'reel-click'], [1.2, 'clink'], [1.62, 'bite'], [1.7, 'reel-whirr'], [2.52, 'zip'], [2.7, 'bonk'], [2.78, 'birdies']], short: [[.24, 'bite'], [.34, 'zip'], [.48, 'bonk']] },
    poster: .3,
    draw: function (S, t, p, mode) {
      var L = S.L, q = L.tch, U = S.U, X = T(mode), short = mode === 'short';
      var Y0 = 106, f = 1;
      var xf = k.clamp(q.x - 124, 34, 300), hip = [xf, Y0 - 3];
      // his perch: a short plank on two brackets, stuck to nothing in particular
      p.g(); p.shape([[xf - 46, Y0 - 1], [xf + 42, Y0 - 1], [xf + 42, Y0 + 5], [xf - 46, Y0 + 5]], { fill: '#fff', w: .7 });
      p.line([[xf - 34, Y0 + 5], [xf - 34, Y0 + 13], [xf - 26, Y0 + 5]], { w: .55 }); p.line([[xf + 30, Y0 + 5], [xf + 30, Y0 + 13], [xf + 22, Y0 + 5]], { w: .55 });
      /* the rod: butt in his lap, tip out over the chip; bent double while he fights */
      var B = [xf + U * .12, Y0 - U * .1], tipRest = [q.x + 4, Y0 - 30];
      var castBack = !short ? Math.sin(seg(t, X.cast0, X.cast1) * Math.PI) * (t < X.cast0 + .2 ? 1 : -.4) : 0;
      var tip = k.rot(tipRest, B, -castBack * .9);
      var fighting = t >= X.hook && t < X.yank, bend = 0;
      if (fighting) { bend = (.7 + .3 * Math.sin(t * 17)) * seg(t, X.hook, X.hook + .1); tip = [tip[0] - 14 * bend, tip[1] + 58 * bend]; }
      if (t >= X.yank && t < X.bonk) tip = k.rot(tipRest, B, -.55 * Math.sin(seg(t, X.yank, X.bonk) * Math.PI));
      var afterBonk = t >= X.bonk;
      if (afterBonk) tip = k.mixPt(k.rot(tipRest, B, -.9), [B[0] + U * .5, B[1] + U * .55], E.out(seg(t, X.bonk, X.bonk + .3)));
      /* the hook */
      var hookTop = q.y - CR - 2, hy, hx = q.x;
      if (short) hy = t < X.drop1 ? lerp(q.y - 70, hookTop, E.in(seg(t, X.drop0, X.drop1))) : hookTop;
      else hy = t < X.drop0 ? tip[1] + 14 : t < X.drop1 ? lerp(tip[1] + 14, hookTop - 16, Math.floor(seg(t, X.drop0, X.drop1) * 7) / 7) : hookTop - 16;
      var sw = (!short && t < X.miss) ? Math.sin(t * 7) * 5 * (1 - seg(t, X.drop0, X.miss)) : 0;
      if (!short && t >= X.miss && t < X.hook) {   // down beside it — clink — up, two twitches, and on
        hy = k.track([[X.miss, { y: hookTop - 16 }], [X.miss + .12, { y: hookTop + 4 }, 'in'], [X.miss + .24, { y: hookTop - 12 }, 'out'], [1.44, { y: hookTop - 9 }], [1.5, { y: hookTop - 14 }], [1.56, { y: hookTop - 8 }], [X.hook, { y: hookTop }, 'in']])(t).y;
        sw = k.track([[X.miss, { x: 0 }], [X.miss + .12, { x: -11 }], [X.miss + .3, { x: -4 }], [X.hook, { x: 0 }]])(t).x;
      }
      hx = q.x + sw;
      /* the chip: on the ledge; fighting (running about, hopping); up the line; in his face; held up */
      var cx = q.x, cy = q.y, crot = 0, csx = 1, inFace = false, held = false;
      if (fighting) { var r = t - X.hook; cx = q.x + Math.sin(r * 9) * 7 * Math.min(1, r * 4); cy = q.y - Math.abs(Math.sin(r * 18)) * 4; crot = Math.cos(r * 9) * .35; hx = cx; hy = cy - CR - 2; }
      if (short && t >= X.hook && t < X.yank) { cx = q.x + Math.sin((t - X.hook) * 60) * 2; }
      /* him */
      var P = { hip: hip, lean: 0, face: f, look: 0, eyeX: 0, hd: [0, 0] };
      var swing = Math.sin(t * 2.4) * U * .025;
      P.fL = [xf + U * .2 + swing, Y0 + U * .3]; P.fR = [xf + U * .27 - swing, Y0 + U * .29]; P.kb = [-1, -1]; P.fdir = [1, 1];
      var dir = [tip[0] - B[0], tip[1] - B[1]], dl = Math.hypot(dir[0], dir[1]) || 1; dir = [dir[0] / dl, dir[1] / dl];
      P.hL = [B[0] + dir[0] * U * .2, B[1] + dir[1] * U * .2]; P.hR = [B[0] + dir[0] * U * .03 + 2, B[1] + dir[1] * U * .03 + 6];
      if (fighting) { P.lean = -.32 * seg(t, X.hook, X.hook + .12); var rr = t * 16; P.hR = [B[0] + Math.cos(rr) * 7, B[1] + 8 + Math.sin(rr) * 7]; P.brow = 1; P.wide = true; P.fL = [xf + U * .34, Y0 + U * .12]; P.fR = [xf + U * .38, Y0 + U * .2]; }
      var face = null;
      if (t >= X.yank && t < X.bonk) { P.wide = true; P.lean = -.1; P.mouth = 'o'; }
      if (afterBonk) {
        var hit = seg(t, X.bonk, X.bonk + .14), rec = E.io(seg(t, X.bonk + .16, X.peel));
        P.lean = -.42 * (1 - rec) * Math.sin(Math.min(1, hit * 1.6) * Math.PI / 2) - .04;
        P.hatLift = 1.6 * Math.sin(seg(t, X.bonk, X.bonk + .32) * Math.PI); P.tilt = -.35 * seg(t, X.bonk, X.bonk + .32);
        P.blink = t < X.peel; P.fL = [xf + U * .3, Y0 + U * .16 * (1 - hit) + U * .24 * rec]; P.fR = [xf + U * .36, Y0 + U * .1 + U * .18 * rec];
        P.hL = [B[0] + U * .25, B[1] + U * .1];
      }
      // the flying chip, drawn under him until it hits
      var J0 = k.figure(new k.Pen(0, U, 1), U, P, ST);   // where his face is going to be
      if (t >= X.yank && t < X.bonk) {
        var u = E.in(seg(t, X.yank, X.bonk)), st = [q.x, q.y], ctl = [lerp(q.x, J0.hc[0], .6), q.y - 120], en = [J0.hc[0] + 4, J0.hc[1]];
        cx = k.qb(st[0], ctl[0], en[0], u); cy = k.qb(st[1], ctl[1], en[1], u); csx = Math.cos(u * 9); hx = cx; hy = cy - CR - 2;
      }
      if (afterBonk && t < X.peel) inFace = true;
      if (t >= X.peel) {
        held = true;
        var pu = E.out(seg(t, X.peel, X.pose));
        P.hR = k.mixPt([J0.hc[0] + 10, J0.hc[1] + 4], [xf + U * .46, Y0 - U * .4], pu); P.eb = [1, -1];
        P.face = lerp(1, .25, pu); P.blink = false; P.mouth = 'smile';
        if (!short && t > 5.3 && t < 5.42) P.blink = true;
      }
      // draw: the line, the rod, him, the chip
      p.g();
      if (!held && !inFace) {
        var mid = fighting || (t >= X.yank && t < X.bonk) ? k.mixPt(tip, [hx, hy], .5) : [lerp(tip[0], hx, .5) + 3, lerp(tip[1], hy, .5) + 4];
        p.line([tip, mid, [hx, hy]], { w: .32, amp: .2, halo: false });
        p.circ(hx, hy - 5, 1.8, { fill: INK, sy: 1.5, w: .3, halo: false, n: 6 });
        p.line([[hx, hy - 3], [hx, hy + 3], [hx - 1.4, hy + 5.6], [hx - 4.4, hy + 5.4], [hx - 5, hy + 2.6]], { w: .5, amp: .1, halo: false });
      } else {
        var dh = [tip[0] + Math.sin(t * 3) * 2, tip[1] + 22];
        p.line([tip, dh], { w: .32, amp: .2, halo: false }); p.line([[dh[0], dh[1]], [dh[0], dh[1] + 5], [dh[0] - 3, dh[1] + 6]], { w: .5, halo: false });
      }
      var bm = [lerp(B[0], tip[0], .5) + bend * 4, lerp(B[1], tip[1], .5) - bend * 36];
      p.line([[B[0] - dir[0] * U * .1, B[1] - dir[1] * U * .1], B, bm, tip], { w: .75, amp: .15 });
      p.circ(B[0] + dir[0] * 4, B[1] + dir[1] * 4 + 5, 4.2, { fill: '#fff', w: .55, n: 8 });
      if (!held && !inFace && !(t >= X.yank && t < X.bonk)) k.chip(p, cx, cy, q.c, q.ini, { rot: crot });
      if (t >= X.yank && t < X.bonk) { k.chip(p, cx, cy, q.c, q.ini, { sx: Math.abs(csx) < .2 ? .2 : csx }); k.speed(p, [cx, cy], cx - q.x, cy - q.y, 3, 14, 7); }
      var J = k.figure(p, U, P, ST);
      if (inFace) {
        k.chip(p, J.hc[0] + 4, J.hc[1] + 1, q.c, q.ini, { r: CR * 1.05 });
        if (t < X.bonk + .12) k.burst(p, [J.hc[0] + 4, J.hc[1]], 18, 28, 8, .2, .8);
      }
      if (held) { k.chip(p, P.hR[0] + 2, P.hR[1] - CR - 2, q.c, q.ini, { rot: .12 }); p.g(); p.circ(P.hR[0], P.hR[1], U * .028, { fill: '#fff', w: .7 }); }
      if (afterBonk && t < X.bonk + 1.25) {   // birdies: three little stars round his head
        for (var i = 0; i < 3; i++) { var a = (t - X.bonk) * 7 + i * 2.1, sc = Math.sin(a) > 0 ? 1 : .8; k.star(p, [J.hc[0] + Math.cos(a) * 20, J.hc[1] - J.hr * 1.7 + Math.sin(a) * 5], 4.2 * sc, 5, i + 1); }
      }
    }
  });
})();

/* ═════════ THE BELLHOP — pulls a luggage cart along the top of the card, lifts the chip like it weighs a ton,
   loads it (the cart takes it hard) and wheels it out. Then his hand comes back into the picture, palm up. ═════════ */
(function () {
  var k = CCSteal.kit, E = k.E, seg = k.seg, lerp = k.lerp, CR = k.CR, INK = k.INK;
  var ST = { hat: 'pillbox', buttons: true, bigNose: false };
  /* the cart, wheels on the ledge at (x, G); sq = how hard it just took a load; ph = wheel turn */
  function cart(p, x, G, sq, ph, load, Z) {
    Z = Z || 1; var w = 40 * Z, py = G - 11 * Z + sq * 3, top = py - 66 * Z + sq * 2;
    p.g();
    [-w + 7, w - 7].forEach(function (dx) { var c = [x + dx, G - 5 * Z]; p.circ(c[0], c[1], 5 * Z, { fill: '#fff', w: .7, n: 8 }); p.line([c, [c[0] + Math.cos(ph) * 4, c[1] + Math.sin(ph) * 4]], { w: .4, halo: false }); });
    p.shape([[x - w, py - 1], [x + w, py - 1 + sq * 2.5], [x + w, py + 4], [x - w, py + 4]], { fill: '#fff', w: .8 });
    [x - w + 3, x + w - 3].forEach(function (px, i) { p.line([[px, py], [px + .5, (py + top) / 2], [px, top + (i ? sq * 2 : 0)]], { w: 1.1 }); p.dot(px, top + (i ? sq * 2 : 0), 2.6); });
    p.line([[x - w + 3, top], [x - w * .45, top - 12], [x + w * .45, top - 12 + sq], [x + w - 3, top + sq * 2]], { w: 1.1 });
    p.line([[x - w + 3, top + 9], [x + w - 3, top + 9 + sq * 2]], { w: .55 });
    // somebody's suitcase and a hatbox, already aboard
    var sx = x - w + 9 * Z, z = function (v) { return v * Z; };
    p.shape([[sx, py - 1], [sx, py - z(28)], [sx + z(22), py - z(28)], [sx + z(22), py - 1]], { fill: '#fff', w: .8 });
    p.line([[sx + z(7), py - z(28)], [sx + z(7.5), py - z(33)], [sx + z(14.5), py - z(33)], [sx + z(15), py - z(28)]], { w: .55 });
    p.g({ halo: false }); p.circ(sx + z(15.5), py - z(19), z(3.4), { fill: k.WASH2, stroke: false }); p.line([[sx + 1, py - z(12)], [sx + z(21), py - z(12)]], { w: .4 }); p.g();
    if (!load) { var hx = x + w - z(15); p.shape([[hx - z(11), py - 1], [hx - z(11), py - z(17)], [hx - z(6), py - z(20)], [hx + z(6), py - z(20)], [hx + z(11), py - z(17)], [hx + z(11), py - 1]], { fill: '#fff', w: .8 }); p.line([[hx - z(11), py - z(15)], [hx + z(11), py - z(15)]], { w: .4, halo: false }); }
    return { slot: [x + w - z(16), py - CR - 1] };
  }
  /* an open hand, palm up, coming in from the edge of the picture */
  function palm(p, ex, y, u, curl) {
    var Z = 1.75, oy = y;   // drawn big: it's the punchline
    var M = function (pts) { return pts.map(function (q) { return [ex + (q[0] - ex) * Z, oy + (q[1] - oy) * Z]; }); };
    var p0 = p, pp = { line: function (pts, o) { return p0.line(M(pts), o); }, shape: function (pts, o) { return p0.shape(M(pts), o); }, dot: function (x, y, r, c) { var m = M([[x, y]])[0]; return p0.dot(m[0], m[1], r * Z, c); }, g: function (o) { return p0.g(o); } };
    p = pp;
    var x = ex + 46 * u - 20;
    p.g(); p.line([[ex - 30, y + 3], [x - 14, y + 2]], { w: 3.4, amp: .2 });
    p.line([[ex - 30, y + 3], [x - 14, y + 2]], { w: 2.1, color: '#fff', halo: false, amp: .2 });
    p.shape([[x - 19, y - 5], [x - 12, y - 5.5], [x - 12, y + 9.5], [x - 19, y + 9.5]], { fill: INK, w: .4 });
    p.dot(x - 15.5, y - 1, 1.1, '#fff'); p.dot(x - 15.5, y + 5, 1.1, '#fff');
    var c = curl || 0;
    p.shape([[x - 12, y - 3], [x + 3, y + 2.5], [x + 14, y + 1.5], [x + 19 - c * 5, y - 2 - c * 5], [x + 20 - c * 6, y + 2 - c * 3], [x + 14, y + 7], [x - 1, y + 8.5], [x - 12, y + 7.5]], { fill: '#fff', w: .8 });
    p.line([[x - 1, y + 1], [x + 1.5, y - 5.5], [x + 5.5, y - 5]], { w: .7, halo: false });
    p.line([[x + 5, y + 3.5], [x + 13, y + 3.2]], { w: .4, halo: false });
  }
  function T(mode) {
    return mode === 'short' ? { walk1: .42, bump: 9, crouch: .42, grab: .46, lift1: .5, turn: .5, heave0: .52, heave1: .64, brow0: 9, push0: .64, push1: 1.02, hand0: 1.12, hand1: 1.26 }
      : { walk1: .9, bump: .9, crouch: 1.1, grab: 1.32, lift1: 1.82, turn: 1.86, heave0: 2.02, heave1: 2.2, brow0: 2.3, push0: 2.56, push1: 3.12, hand0: 3.42, hand1: 3.62 };
  }
  CCSteal.reg('bellhop', {
    name: 'The Bellhop',
    line: 'Lifts the chip like it weighs a ton, loads it on his cart and wheels it out. Then his hand comes back in, palm up.',
    ownChips: true,
    full: { T: 6.4, tGone: 1.6, tCap: 3.86 },
    short: { T: 2.0, tGone: .5, tCap: 1.22 },
    captions: [
      'Does anyone have a dollar? He won’t leave.',
      'Somebody tip him, or he’ll come back for another one.',
      'We’re not even staying here.'
    ],
    tags: ['Tip?', 'Front desk.'],
    cues: { full: [[0, 'squeak'], [.92, 'bonk'], [1.35, 'strain'], [2.2, 'thunk'], [2.56, 'squeak'], [3.42, 'ahem']], short: [[0, 'squeak'], [.62, 'thunk'], [1.12, 'ahem']] },
    poster: .7,
    draw: function (S, t, p, mode) {
      var L = S.L, c = L.tc, q = L.tch, G = c.top, U = S.U, X = T(mode), short = mode === 'short', Z = U / 124;
      var others = c.chips.filter(function (z) { return z !== q; });
      var xs = q.x - U * .3 - (others.some(function (z) { return z.x < q.x; }) ? 30 * others.filter(function (z) { return z.x < q.x; }).length : 0);
      var cartGap = U * .22 + 40 * Z;
      var x = xs, f = 1, cx = xs - cartGap, sq = 0, ph = 0, P, chipAt = null, loaded = false, carry = false;
      var out = function (P) { return P; };
      if (t < X.walk1) {   // walking in, pulling the cart by its post
        var u = seg(t, 0, X.walk1); x = lerp(-50, xs, E.out(u)); cx = x - cartGap; ph = x / 5;
        P = k.walk(U, G, {}, t, 0, X.walk1, -50, xs, { ease: 'out' });
        P.hL = [cx + 37 * Z, G - 77 * Z]; P.lean = .08;
      } else if (t < X.turn) {   // the cart rolls on into the backs of his knees; then the lift
        var bump = short ? 0 : Math.sin(seg(t, X.bump, X.bump + .22) * Math.PI);
        cx = xs - cartGap + 7 * bump; x = xs + 3 * E.out(seg(t, X.bump + .05, X.bump + .2));
        P = k.stand(U, G, x, 1);
        P.lean = -.12 * bump; P.wide = bump > .3;
        var cr = E.out(seg(t, X.crouch - .1, X.grab)), up = E.in(seg(t, X.grab + .05, X.lift1));
        if (t >= X.crouch - .1) {
          var hipH = .415 - .14 * cr * (1 - up * .8), shake = t > X.grab && t < X.lift1 + .05 ? Math.sin(t * 75) * 1.4 : 0;
          P.hip = [x + 4 * cr, G - U * hipH + shake * .5]; P.lean = .55 * cr * (1 - up) + .02;
          P.fL = [x - U * .1, G]; P.fR = [x + U * .12, G];
          var lift = t >= X.grab ? up * U * .32 : 0;
          chipAt = [q.x + shake, q.y - lift];
          P.hL = [chipAt[0] - CR - 1, chipAt[1] + 2]; P.hR = [chipAt[0] + CR + 1, chipAt[1] + 1];
          P.blink = t >= X.grab; P.brow = t >= X.grab ? 2 : 0; P.mouth = t >= X.grab ? 'flat' : null; carry = t >= X.grab;
          if (t >= X.grab && t < X.lift1) P.kb = [1 + Math.sin(t * 40) * .3, -1];
        }
      } else if (t < X.push0) {   // turn, a step, heave it aboard; the cart takes it hard; he wipes his brow
        f = -1; cx = xs - cartGap; x = lerp(xs, xs - 10, E.io(seg(t, X.turn, X.heave0)));
        P = k.stand(U, G, x, -1);
        if (t < X.heave1) {
          var hu = E.in(seg(t, X.heave0, X.heave1)), from = [x - 16, G - U * .62], cs = cart(new k.Pen(0, U, 1), cx, G, 0, 0, true, Z).slot;
          chipAt = k.mixPt(from, cs, hu); chipAt[1] -= Math.sin(hu * Math.PI) * 16;
          P.hL = [chipAt[0] + CR + 1, chipAt[1] + 2]; P.hR = [chipAt[0] - CR - 1, chipAt[1] + 1]; P.blink = true; P.brow = 2; P.lean = -.05 + .25 * hu; carry = true;
        } else {
          loaded = true; sq = Math.max(0, Math.sin(seg(t, X.heave1, X.heave1 + .3) * Math.PI * 1.5)) * (1 - seg(t, X.heave1, X.heave1 + .4));
          var bu = short ? 0 : Math.sin(seg(t, X.brow0, X.brow0 + .26) * Math.PI);
          P.hR = k.mixPt(P.hR, [x - 12, G - U * .97], bu); P.blink = bu > .2; P.lean = -.06 * bu;
        }
      } else {   // wheel it out the way he came
        f = -1; loaded = true;
        var pu = seg(t, X.push0, X.push1);
        x = lerp(xs - 10, -U * 1.4, E.in(pu)); cx = x - cartGap + 8; ph = x / 5;
        P = k.walk(U, G, {}, t, X.push0, X.push1, xs - 10, -U * 1.4, { ease: 'in', carry: true });
        P.hL = [cx + 37 * Z, G - 74 * Z]; P.hR = [cx + 37 * Z, G - 64 * Z]; P.lean = -.2;
      }
      // the cart and its passengers
      var Cr = cart(p, cx, G, sq, ph, loaded, Z);
      if (loaded) { k.chip(p, Cr.slot[0], Cr.slot[1] + sq * 3, q.c, q.ini); if (sq > .3) k.burst(p, [Cr.slot[0], Cr.slot[1] + 4], CR + 4, CR + 11, 6, -.6, .6); }
      if (t >= X.heave1 && t < X.heave1 + .4 && !short) k.puff(p, [cx, G - 4], 14, seg(t, X.heave1, X.heave1 + .4));
      // him
      if (x > -U) {
        k.shadow(p, x, G, U * .2);
        if (!P.face) P.face = f;
        var J = k.figure(p, U, P, ST);
        if (carry && chipAt) { k.chip(p, chipAt[0], chipAt[1], q.c, q.ini); p.g(); p.circ(P.hL[0], P.hL[1], U * .026, { fill: '#fff', w: .7 }); p.circ(P.hR[0], P.hR[1], U * .026, { fill: '#fff', w: .7 }); if (t >= X.grab && t < X.lift1 + .2 && !short) k.sweat(p, J.hc[0] - 14, J.hc[1] - 6, ((t - X.grab) * 2.4) % 1); }
      }
      // the chips still on the card (in front of his feet), and the chip until he takes it
      others.forEach(function (z) { k.chip(p, z.x, z.y, z.c, z.ini); });
      if (!carry && !loaded && !chipAt) k.chip(p, q.x, q.y, q.c, q.ini);
      // and the hand, back in, palm up
      if (t >= X.hand0) {
        var hu2 = E.out(seg(t, X.hand0, X.hand1)), curl = 0;
        if (!short) [4.6, 5.5].forEach(function (a) { if (t > a && t < a + .24) curl = Math.sin(seg(t, a, a + .24) * Math.PI); });
        palm(p, 0, G - U * .5, hu2, curl);
      }
    }
  });
})();

/* ═════════ THE BURGLAR — mask, beanie, striped jumper, a sack. Tiptoes along the top of the card, lifts the chip —
   clink — and freezes. Turns, very slowly, to you. A finger to his lips. Into the sack, and away on tiptoe. ═════════ */
(function () {
  var k = CCSteal.kit, E = k.E, seg = k.seg, lerp = k.lerp, CR = k.CR, INK = k.INK;
  var ST = { hat: 'beanie', mask: true, stripes: true };
  /* tiptoe: big slow steps, knees high, the body low and leaning in, hands up like paws */
  function tiptoe(U, G, t, t0, t1, x0, x1, n) {
    var dir = x1 >= x0 ? 1 : -1, st = Math.abs(x1 - x0) / n, u = k.clamp(seg(t, t0, t1) * n, 0, n - 1e-6), i = Math.floor(u), ph = u - i;
    var Sx = function (j) { return x0 + dir * st * j; }, e = E.io(ph), lift = Math.sin(ph * Math.PI) * U * .17;
    var mov = [lerp(Sx(i - 1), Sx(i + 1), e), G - lift], pl = [Sx(i), G];
    var hipX = lerp(Sx(i - .5), Sx(i + .5), E.io(seg(ph, .2, 1)));
    var P = { hip: [hipX, G - U * .37 - Math.sin(ph * Math.PI) * U * .03], lean: dir * .32, face: dir };
    if (i % 2) { P.fL = mov; P.fR = pl; } else { P.fL = pl; P.fR = mov; }
    P.hL = [hipX + dir * U * .26, G - U * .64]; P.hR = [hipX + dir * U * .2, G - U * .58];
    P.eb = [dir, dir]; P.kb = [-dir, -dir]; P.fdir = [dir, dir];
    return P;
  }
  function sack(p, J, f, U, fat) {
    var c = [J.sh[0] - f * U * .17, J.sh[1] + U * .1], w = U * (.12 + fat * .025), h = U * .15;
    p.g(); p.line([J.sh, [c[0] + f * U * .03, c[1] - h * .85]], { w: .7 });
    p.shape([[c[0] - w * .35, c[1] - h * .8], [c[0] + w * .35, c[1] - h * .8], [c[0] + w, c[1] - h * .1], [c[0] + w * .85, c[1] + h * .7], [c[0], c[1] + h], [c[0] - w * .85, c[1] + h * .7], [c[0] - w, c[1] - h * .1]], { fill: '#fff' });
    p.line([[c[0] - w * .4, c[1] - h * .72], [c[0] + w * .4, c[1] - h * .7]], { w: .7, halo: false });
    if (fat) p.line([[c[0] - w * .3, c[1] + h * .3], [c[0], c[1] + h * .5], [c[0] + w * .3, c[1] + h * .25]], { w: .45, halo: false });
    return [c[0], c[1] - h * .8];
  }
  function T(mode) {
    return mode === 'short' ? { in1: -1, look0: 9, reach: 0, lift: .16, clink: .24, turn: .32, shh: .5, drop0: .95, drop1: 1.1, out0: 9, out1: 9 }
      : { in1: 1.4, look0: 1.4, reach: 1.64, lift: 1.84, clink: 1.92, turn: 2.12, shh: 2.52, drop0: 2.98, drop1: 3.16, out0: 3.2, out1: 3.86 };
  }
  CCSteal.reg('burglar', {
    name: 'The Burglar',
    line: 'Tiptoes along the top of the card and lifts the chip. Clink. He freezes, turns slowly to you, and puts a finger to his lips.',
    ownChips: true,
    full: { T: 6.4, tGone: 3.1, tCap: 3.95 },
    short: { T: 2.0, tGone: 1.0, tCap: 1.05 },
    captions: [
      'Well, now we’re all accessories.',
      'Nobody say anything. He knows where we sit.',
      'In fairness, he did ask us not to look.'
    ],
    tags: ['Shh.', 'You saw nothing.'],
    cues: { full: [[.1, 'tiptoe'], [1.92, 'clink'], [1.95, 'silence'], [2.52, 'shh'], [3.1, 'clunk-in-sack'], [3.2, 'tiptoe']], short: [[.24, 'clink'], [.5, 'shh']] },
    poster: 1.0,
    draw: function (S, t, p, mode) {
      var L = S.L, c = L.tc, q = L.tch, G = c.top, U = S.U, X = T(mode), short = mode === 'short';
      var others = c.chips.filter(function (z) { return z !== q; }), leftN = others.filter(function (z) { return z.x < q.x; }).length;
      var xs = q.x - U * .34 - leftN * 30, xOut = U * .52, P, f = 1, held = null, inSack = false, wob = {};
      if (!short && t < X.in1) P = tiptoe(U, G, t, 0, X.in1, -U * .7, xs, 3);
      else if (t < X.out0) {
        P = { hip: [xs + U * .08, G - U * .37], lean: .26, face: 1, fL: [xs - U * .1, G], fR: [xs + U * .16, G], hL: [xs + U * .3, G - U * .64], hR: [xs + U * .22, G - U * .58], eb: [1, 1], kb: [-1, -1] };
        if (!short && t < X.reach) { var g = t - X.look0; P.face = g < .08 ? 1 : g < .16 ? -1 : 1; P.eyeX = g < .08 ? -1 : 1; P.lean = .2; }
        // the reach and the lift
        var ru = E.out(seg(t, X.reach - (short ? .1 : .18), X.reach)), lu = E.out(seg(t, X.reach + .02, X.clink)) * .35 + (t >= X.drop0 - .3 ? .65 * E.io(seg(t, X.drop0 - .3, X.drop0)) : 0);
        var chipP = [q.x - 10 * lu, q.y - U * .3 * lu];
        if (t >= X.clink && t < X.clink + .25) chipP[0] += Math.sin((t - X.clink) * 70) * 1.5 * (1 - seg(t, X.clink, X.clink + .25));
        if (t >= X.reach - .2) { P.hR = k.mixPt(P.hR, [chipP[0] - CR * .4, chipP[1] + CR * .5], ru); held = chipP; }
        // clink — and he freezes. Then, slowly, he turns to you.
        if (t >= X.clink) {
          var tu = E.io(seg(t, X.turn, X.turn + .32));
          P.face = lerp(1, 0, tu); P.wide = true; P.lean = lerp(.26, .14, tu);
          if (t < X.turn + .5) P.eyeX = tu < 1 ? 0 : 0;
        }
        if (t >= X.shh) {   // a finger to his lips
          var su = E.out(seg(t, X.shh, X.shh + .16));
          P.armsFront = true; P.mouth = 'shh'; P.wide = false;
          var J0 = k.figure(new k.Pen(0, U, 1), U, P, ST);
          P.hL = k.mixPt(P.hL, [J0.hc[0], J0.hc[1] + J0.hr * 1.05], su);
        }
        if (t >= X.drop0) {   // into the sack
          var du = E.in(seg(t, X.drop0, X.drop1));
          var J1 = k.figure(new k.Pen(0, U, 1), U, P, ST), mouth = [J1.sh[0] - U * .17, J1.sh[1] - U * .03];
          held = k.mixPt(chipP, mouth, du); held[1] -= Math.sin(du * Math.PI) * 10;
          P.hR = k.mixPt([chipP[0] - CR * .4, chipP[1] + CR * .5], [J1.sh[0] - U * .08, J1.sh[1] - U * .02], du);
          if (t >= X.drop1) { held = null; inSack = true; }
        }
      } else if (t < X.out1) { P = tiptoe(U, G, t, X.out0, X.out1, xs, xOut, 2); inSack = true; f = -1; }
      else {   // at the edge, a look back, the finger to the lips again
        f = -1; inSack = true;
        P = { hip: [xOut - U * .06, G - U * .38], lean: -.18, face: lerp(-1, -.1, E.out(seg(t, X.out1, X.out1 + .2))), fL: [xOut - U * .16, G], fR: [xOut + U * .06, G], eb: [-1, -1], kb: [1, 1], mouth: 'shh', armsFront: true };
        P.hR = [xOut + U * .1, G - U * .55];
        var J2 = k.figure(new k.Pen(0, U, 1), U, Object.assign({}, P, { hL: [0, 0] }), ST);
        P.hL = k.mixPt([xOut - U * .2, G - U * .6], [J2.hc[0] - J2.hr * .05, J2.hc[1] + J2.hr * 1.05], E.out(seg(t, X.out1 + .12, X.out1 + .3)));
        if (t > 5.4 && t < 5.52) P.blink = true;
      }
      if (P.face == null) P.face = f;
      // the neighbour chip the stolen one knocked: it rocks
      var rock = t >= X.clink ? Math.sin((t - X.clink) * 30) * .35 * Math.max(0, 1 - (t - X.clink) * 2.2) : 0;
      k.shadow(p, P.hip[0], G, U * .2);
      var Jd = k.figure(new k.Pen(0, U, 1), U, P, ST);
      sack(p, Jd, P.face < -.35 ? -1 : 1, U, inSack ? 1 : 0);
      var J = k.figure(p, U, P, ST);
      others.forEach(function (z, i) { k.chip(p, z.x, z.y, z.c, z.ini, { rot: (z.x < q.x ? -rock : rock) * (Math.abs(z.x - q.x) < 35 ? 1 : 0) }); });
      if (!held && !inSack && t < X.drop1) k.chip(p, q.x, q.y, q.c, q.ini);
      if (held) { k.chip(p, held[0], held[1], q.c, q.ini); p.g(); p.circ(P.hR[0], P.hR[1], U * .026, { fill: '#fff', w: .7 }); }
      if (t >= X.clink && t < X.clink + .2) k.burst(p, [q.x, G - 2], 9, 18, 6, -2.6, .7);
      if (P.armsFront && (t >= X.shh || t >= X.out1)) { p.g(); var fx = J.hc[0] + (P.face || 0) * J.hr * .45, fy = J.hc[1] + J.hr * .5; p.circ(fx, fy + J.hr * .55, J.hr * .32, { fill: '#fff', w: .7 }); p.line([[fx, fy + J.hr * .35], [fx, fy - J.hr * .45]], { w: 1.25 }); }
    }
  });
})();

/* ═════════ THE PAINTER — paper hat, apron, a can of paint in the dealer's colour. Three strokes and the chip is
   the dealer's; he signs it; steps back to admire his work — straight into the can. ═════════ */
(function () {
  var k = CCSteal.kit, E = k.E, seg = k.seg, lerp = k.lerp, CR = k.CR, INK = k.INK;
  var cnt = 0;
  /* the paint can: base centre (x, y), paint in colour col; onFoot draws it round a foot */
  function can(p, x, y, col, o) {
    o = o || {}; var Z = o.Z || 1, w = 12 * Z, h = 22 * Z, tilt = o.tilt || 0;
    p.g();
    var T = function (pts) { return pts.map(function (q) { return k.rot([x + q[0], y + q[1]], [x, y], tilt); }); };
    p.shape(T([[-w, 0], [-w, -h], [w, -h], [w, 0]]), { fill: '#fff', w: .8 });
    p.shape(T([[-w, -h], [-w * .5, -h - 3], [w * .5, -h - 3], [w, -h], [w * .5, -h + 3], [-w * .5, -h + 3]]), { fill: col, w: .6 });
    p.g({ halo: false });
    p.shape(T([[-w + 1, -h + 2], [-w + 4 * Z, -h + 2], [-w + 4.5 * Z, -h + 9 * Z], [-w + 2.8 * Z, -h + 11 * Z], [-w + 1, -h + 8 * Z]]), { fill: col, stroke: false });
    p.line(T([[-w, -h * .45], [w, -h * .45]]), { w: .4 });
    p.g();
    if (!o.noBail) p.line(T([[-w, -h + 1], [-w * .4, -h - 12 * Z], [w * .4, -h - 12 * Z], [w, -h + 1]]), { w: .55 });
  }
  function brush(p, hand, ang, col, wet, Z) {
    Z = Z || 1; var d = [Math.cos(ang), Math.sin(ang)], tipC = [hand[0] + d[0] * 20 * Z, hand[1] + d[1] * 20 * Z], back = [hand[0] - d[0] * 8 * Z, hand[1] - d[1] * 8 * Z];
    p.g(); p.line([back, [hand[0] + d[0] * 9, hand[1] + d[1] * 9]], { w: 1.1 });
    var n = [-d[1], d[0]], b0 = [hand[0] + d[0] * 9 * Z, hand[1] + d[1] * 9 * Z];
    p.shape([[b0[0] + n[0] * 3 * Z, b0[1] + n[1] * 3 * Z], [tipC[0] + n[0] * 4.5 * Z, tipC[1] + n[1] * 4.5 * Z], [tipC[0] + d[0] * 2 * Z, tipC[1] + d[1] * 2 * Z], [tipC[0] - n[0] * 4.5 * Z, tipC[1] - n[1] * 4.5 * Z], [b0[0] - n[0] * 3 * Z, b0[1] - n[1] * 3 * Z]], { fill: wet ? col : '#fff', w: .7 });
    return tipC;
  }
  function T(mode) {
    return mode === 'short' ? { walk1: -1, set: -1, dip0: 9, paint0: 0, paint1: .4, admire0: 9, sign0: .42, sign1: .58, back0: .62, back1: .8, splosh: .8, look0: .9, look1: 1.15, shake: 9 }
      : { walk1: .88, set: .96, dip0: 1.0, paint0: 1.24, paint1: 1.96, admire0: 2.0, sign0: 2.32, sign1: 2.56, back0: 2.62, back1: 2.84, splosh: 2.84, look0: 2.98, look1: 3.36, shake: 3.48 };
  }
  CCSteal.reg('painter', {
    name: 'The Painter',
    line: 'Paints the chip in the dealer’s color, signs it, and steps back to admire his work, straight into the paint can.',
    ownChips: true,
    full: { T: 6.4, tGone: 1.98, tCap: 3.9 },
    short: { T: 2.0, tGone: .42, tCap: 1.05 },
    captions: [
      'He calls it a restoration.',
      'Nobody asked for a second coat.',
      'He’s done the whole house in that color.'
    ],
    tags: ['Signed.', 'Wet paint.'],
    cues: { full: [[.96, 'clank'], [1.0, 'dip'], [1.24, 'swish'], [1.5, 'swish'], [1.74, 'swish'], [2.32, 'flourish'], [2.84, 'sploosh'], [3.48, 'clonk']], short: [[0, 'swish'], [.42, 'flourish'], [.8, 'sploosh']] },
    poster: 1.5,
    draw: function (S, t, p, mode) {
      var L = S.L, c = L.tc, q = L.tch, G = c.top, U = S.U, X = T(mode), short = mode === 'short', dc = S.dc, Z = U / 124;
      var others = c.chips.filter(function (z) { return z !== q; }), leftN = others.filter(function (z) { return z.x < q.x; }).length;
      var xs = q.x - U * .36 - leftN * 30, canX = xs - U * .3, back = xs - U * .26;
      var ST = { hat: 'painter', apron: true, apronDab: dc, mustache: true };
      var P, x = xs, carryCan = false, wet = false, tip = null, inCan = false;
      if (!short && t < X.walk1) { P = k.walk(U, G, {}, t, 0, X.walk1, -U * .6, xs, { ease: 'out' }); carryCan = true; x = P.hip[0]; }
      else {
        P = k.stand(U, G, xs, 1); P.face = 1;
        if (!short && t < X.paint0) {   // the can goes down; the brush goes in
          var du = Math.sin(seg(t, X.dip0, X.paint0) * Math.PI);
          P.hR = k.mixPt([xs + U * .2, G - U * .5], [canX + 8, G - 30 * Z], du); P.lean = -.15 * du; P.face = du > .3 ? -.6 : 1; wet = t > X.dip0 + .1;
        } else if (t < X.paint1) {   // three strokes, top to bottom
          var su = seg(t, X.paint0, X.paint1) * 3, i = Math.min(2, Math.floor(su)), ph = su - i, yy = q.y - CR * .6 + i * CR * .6;
          var bx = lerp(q.x - CR - 4, q.x + CR + 2, ph < .8 ? E.io(ph / .8) : 1 - E.io((ph - .8) / .2) * .1);
          P.hR = [bx - 20 * Z, yy + 6]; P.lean = .12; wet = true; tip = [bx, yy];
        } else if (!short && t < X.sign0) {   // a step back, a hand to his chin
          var au = E.io(seg(t, X.admire0, X.admire0 + .18)) * (1 - E.io(seg(t, X.sign0 - .12, X.sign0)));
          P = k.stand(U, G, xs - U * .1 * au, 1); P.lean = -.12 * au; P.hL = [xs - U * .1 * au + U * .06, G - U * .9]; P.armsFront = au > .5; P.brow = au > .5 ? 1 : 0;
          P.hR = [xs + U * .18, G - U * .5];
        } else if (t < X.sign1) {   // the signature: a flourish of the brush tip
          var gu = seg(t, X.sign0, X.sign1);
          P.hR = [q.x - 20 * Z + Math.sin(gu * 14) * 4, q.y + 4 - gu * 6]; P.lean = .1; tip = [q.x + Math.sin(gu * 14) * 4, q.y - 2 - gu * 6];
        } else {   // back to admire — into the can
          var bu = E.io(seg(t, X.back0, X.back1));
          P = k.stand(U, G, lerp(xs, back + U * .07, bu), 1); P.fL = [lerp(xs - U * .07, canX, bu), G - Math.sin(bu * Math.PI) * U * .08]; P.lean = -.1 * bu; P.hL = [P.hip[0] + U * .06, G - U * .9]; P.armsFront = true;
          P.hR = [P.hip[0] + U * .2, G - U * .52];
          if (t >= X.splosh) {   // in. He sinks an inch, looks down, looks at you
            inCan = true; var sk = E.out(seg(t, X.splosh, X.splosh + .1));
            P.hip[1] += U * .06 * sk; P.fL = [canX, G - 6]; P.fR = [P.hip[0] + U * .1, G];
            P.armsFront = false; P.hL = [P.hip[0] - U * .2, G - U * .52]; P.lean = 0;
            // he looks down; lifts the foot — the can comes with it — and looks at you
            var lift = short ? E.out(seg(t, X.look0, X.look0 + .2)) : E.out(seg(t, X.shake - .2, X.shake + .1));
            P.face = lerp(.5, .05, seg(t, X.look1 - .1, X.look1 + .1)); P.look = t < X.look1 ? 1.2 : 0; P.blink = t >= X.look1 + .5 && t < X.look1 + .6;
            P.fL = [canX - U * .05 * lift, G - 6 - U * .3 * lift]; P.kb = [1, -1]; P.hip = [P.hip[0], P.hip[1] - U * .02 * lift]; P.lean = -.08 * lift;
            if (!short && t > 4.9 && t < 5.4) { var sh = Math.sin((t - 4.9) * 34) * (1 - seg(t, 4.9, 5.4)); P.fL[0] += sh * 6; P.fL[1] += Math.abs(sh) * 3; }
          }
        }
      }
      // the can: carried, set down, or on his foot
      var canPos = [canX, G], canTilt = 0;
      if (carryCan) canPos = [P.hip[0] - U * .2, G - U * .2 - 4];
      if (inCan) { canPos = [P.fL[0] + U * .02, P.fL[1] + 9 * Z]; canTilt = -.18 * (G - P.fL[1]) / (U * .3); }
      k.shadow(p, P.hip[0], G, U * .2);
      if (!inCan) can(p, canPos[0], canPos[1], dc, { Z: Z });
      if (carryCan) P.hL = [canPos[0], canPos[1] - 34 * Z];
      var J = k.figure(p, U, P, ST);
      if (inCan) can(p, canPos[0], canPos[1], dc, { tilt: canTilt, Z: Z });
      // the brush
      var bAng = tip ? Math.atan2(tip[1] - P.hR[1], tip[0] - P.hR[0]) : -2.2;
      brush(p, P.hR, bAng, dc, wet, Z);
      // the chip: being painted, painted, signed
      var painted = t >= X.paint1, signed = t >= X.sign1 - .05;
      others.forEach(function (z) { k.chip(p, z.x, z.y, z.c, z.ini); });
      if (!painted) {
        k.chip(p, q.x, q.y, q.c, q.ini);
        if (t >= X.paint0) {   // the strokes so far, clipped to the chip
          var id = 'pc' + (++cnt), su2 = seg(t, X.paint0, X.paint1) * 3, d = '';
          for (var s = 0; s < 3; s++) { var w = k.clamp(su2 - s, 0, 1); if (w <= 0) break; var y2 = q.y - CR * .6 + s * CR * .6; d += 'M' + (q.x - CR - 2) + ' ' + y2 + 'L' + (q.x - CR - 2 + (2 * CR + 4) * w) + ' ' + (y2 + 1); }
          p.g({ halo: false }); p.raw('<clipPath id="' + id + '"><circle cx="' + q.x + '" cy="' + q.y + '" r="' + CR + '"/></clipPath><path clip-path="url(#' + id + ')" d="' + d + '" stroke="' + dc + '" stroke-width="' + (CR * .8) + '" stroke-linecap="round" fill="none"/>'); p.g();
        }
      } else k.paintedChip(p, q.x, q.y, dc, signed ? S.di : '', seg(t, X.paint1, X.paint1 + .6));
      if (inCan && G - P.fL[1] > 10) { var dp = ((t * 1.3) % 1); p.g(); p.circ(canPos[0] - 6 * Z, canPos[1] + dp * (G - canPos[1] + 4), 1.8 * Z, { fill: dc, w: .4, n: 6 }); }
      // the splash
      if (inCan && t < X.splosh + .4) {
        var su3 = seg(t, X.splosh, X.splosh + .4); p.g();
        [-1.1, -.6, -.2, .3, .8].forEach(function (a, i) { var r = 8 + su3 * 22, dx = Math.cos(a - Math.PI / 2) * r, dy = Math.sin(a - Math.PI / 2) * r + su3 * su3 * 30; p.circ(canPos[0] + dx, canPos[1] - 22 + dy, 2.2 + (i % 2), { fill: dc, w: .5, n: 6 }); });
      }
    }
  });
})();

/* ═════════ THE PICKPOCKET — bowler, long coat, umbrella. Strolls along the top of the card and walks into the
   chips. Begs their pardon with a tip of the hat, and strolls off. Halfway out a chip spins up out of his hand. ═════════ */
(function () {
  var k = CCSteal.kit, E = k.E, seg = k.seg, lerp = k.lerp, CR = k.CR, INK = k.INK;
  var ST = { hat: 'bowler', coat: true, pencil: true, bigNose: true };
  function brolly(p, h, ang, len) {
    var d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]], e = [h[0] + d[0] * len, h[1] + d[1] * len];
    p.g(); p.line([[h[0] + n[0] * 5 - d[0] * 2, h[1] + n[1] * 5 - d[1] * 2], [h[0] + n[0] * 6 - d[0] * 7, h[1] + n[1] * 6 - d[1] * 7], [h[0] - d[0] * 7, h[1] - d[1] * 7], h], { w: .8 });
    p.line([h, e], { w: .7 });
    p.shape([[h[0] + d[0] * 14 + n[0] * 3, h[1] + d[1] * 14 + n[1] * 3], [h[0] + d[0] * (len - 7), h[1] + d[1] * (len - 7)], [h[0] + d[0] * 14 - n[0] * 3, h[1] + d[1] * 14 - n[1] * 3]], { fill: INK, w: .5 });
  }
  /* under the bowler: everything he's had off everyone tonight. top = the chip, if it's landed */
  function stash(q, withChip) {
    return function (p, hc, hr0) {
      var hr = hr0 * 1.35, y = hc[1] - hr0 * .95, x = hc[0];
      p.g();
      p.shape([[x - hr * .9, y + 1], [x - hr * .2, y - hr * .55], [x + hr * .5, y - hr * .45], [x + hr * .95, y + 1]], { fill: '#fff', w: .6 });          // a wallet
      p.line([[x - hr * .6, y - hr * .15], [x + hr * .6, y - hr * .1]], { w: .4, halo: false });
      p.circ(x - hr * .35, y - hr * .85, hr * .38, { fill: '#fff', w: .7 }); p.line([[x - hr * .35, y - hr * .85], [x - hr * .35, y - hr * 1.05], [x - hr * .2, y - hr * .8]], { w: .45, halo: false });   // a pocket watch
      p.line([[x - hr * .1, y - hr * .7], [x + hr * .3, y - hr * .55], [x + hr * .55, y - hr * .7]], { w: .45, halo: false });   // its chain
      p.line([[x + hr * .25, y - hr * .7], [x + hr * .95, y - hr * 1.25]], { w: .7 }); p.line([[x + hr * .95, y - hr * 1.25], [x + hr * 1.05, y - hr * 1.5]], { w: .4 }); p.line([[x + hr * .85, y - hr * 1.3], [x + hr * .9, y - hr * 1.55]], { w: .4 });   // a fork
      p.circ(x + hr * .55, y - hr * .45, hr * .17, { fill: 'none', w: .5, halo: false }); p.circ(x + hr * .75, y - hr * .5, hr * .17, { fill: 'none', w: .5, halo: false });   // keys
      if (withChip) k.chip(p, x - hr * .05, y - hr * 1.55, q.c, q.ini, { r: CR * .8, sy: .55 });
    };
  }
  function T(mode) {
    return mode === 'short' ? { in1: .45, bump: .45, tip0: .5, lift: .7, tip1: .78, out0: .8, out1: 1.7, flip0: 1.1, flip1: 1.4, look: 9, bowLen: .26 }
      : { in1: 1.22, bump: 1.22, tip0: 1.4, lift: 2.0, tip1: 2.1, out0: 2.14, out1: 3.4, flip0: 2.5, flip1: 2.92, look: 3.42, bowLen: .23 };
  }
  CCSteal.reg('pickpocket', {
    name: 'The Pickpocket',
    line: 'Walks into the chips and begs each one’s pardon. On his way out he flips the chip up under his hat, onto everything else he’s taken tonight.',
    ownChips: true,
    full: { T: 6.4, tGone: 2.0, tCap: 3.85, ones: [[1.56, 1.64]] },
    short: { T: 2.0, tGone: .7, tCap: 1.1 },
    captions: [
      'Lovely manners, though.',
      'He apologized to the chips. Nobody apologizes to the chips.',
      'So that’s where my watch went.'
    ],
    tags: ['Pardon me.', 'Do forgive me.'],
    cues: { full: [[0, 'whistle'], [1.22, 'clack'], [2.45, 'flick'], [2.85, 'catch']], short: [[.45, 'clack'], [1.1, 'flick']] },
    poster: .8,
    draw: function (S, t, p, mode) {
      var L = S.L, c = L.tc, q = L.tch, G = c.top, U = S.U, X = T(mode), short = mode === 'short';
      var others = c.chips.filter(function (z) { return z !== q; }), lead = c.chips.reduce(function (m, z) { return Math.min(m, z.x); }, 999);
      var xs = lead - CR - U * .2, xOut = U * .38, P, gone = t >= X.lift, flipC = null, rock = 0;
      if (t < X.in1) { P = k.walk(U, G, {}, t, 0, X.in1, -U * .7, xs, { stride: .7, lift: .08, bob: .022, lean: -.03 }); P.face = 1; }
      else if (t < X.out0) {   // the bump: a stumble back, and a tip of the hat to the chips
        var bu = Math.sin(seg(t, X.bump, X.bump + .16) * Math.PI);
        P = k.stand(U, G, xs - 6 * E.out(seg(t, X.bump, X.bump + .16)), 1); P.face = 1; P.lean = -.12 * bu; P.wide = bu > .3;
        // he begs each chip's pardon in turn: hat up, a little bow to each one
        var tu = E.out(seg(t, X.tip0, X.tip0 + .1)) * (1 - E.io(seg(t, X.tip1 - .1, X.tip1)));
        var nB = short ? 1 : c.chips.length, bi = Math.min(nB - 1, Math.floor((t - X.tip0) / X.bowLen)), bph = ((t - X.tip0) / X.bowLen) - bi;
        if (tu > 0) {
          var J0 = k.figure(new k.Pen(0, U, 1), U, P, ST);
          P.hR = k.mixPt(P.hR, [J0.hc[0] + 4, J0.hc[1] - J0.hr * 1.5], tu); P.hatLift = .9 * tu; P.tilt = -.25 * tu; P.mouth = 'smile';
          P.lean = (.06 + .2 * Math.sin(k.clamp(bph, 0, 1) * Math.PI)) * tu; P.look = .6; P.eyeX = (bi - (nB - 1) / 2) * .8;
        }
        if (t >= X.lift - .05 && t < X.lift + .04) P.hL = [q.x - CR, q.y];   // the other hand. Did you see it? No.
        rock = Math.sin((t - X.bump) * 26) * .3 * Math.max(0, 1 - (t - X.bump) * 2.5);
      } else if (t < X.out1) {   // and away the way he came, flipping it
        P = k.walk(U, G, {}, t, X.out0, X.out1, xs - 6, short ? -U * .8 : xOut, { stride: .7, lift: .08, bob: .022, lean: .03 });
        P.face = -1;
        if (t >= X.flip0 - .05 && t < X.flip1 + .38) {   // flips it up — lifts his hat — and it lands on the pile underneath
          var fu = seg(t, X.flip0, X.flip1), hp = [P.hip[0] - U * .17, G - U * .66];
          var J0 = k.figure(new k.Pen(0, U, 1), U, P, ST), top = [J0.hc[0], J0.hc[1] - J0.hr * 3.0];
          P.hR = t < X.flip0 + .12 ? hp : k.mixPt(hp, [P.hip[0] - U * .05, P.hip[1] + U * .02], E.io(seg(t, X.flip0 + .12, X.flip0 + .3)));
          var hl = E.out(seg(t, X.flip0 + .08, X.flip0 + .2)) * (1 - E.io(seg(t, X.flip1 + .2, X.flip1 + .34)));
          P.hatLift = 3.3 * hl; P.tilt = .15 * hl;
          if (hl > .05) P.hL = [J0.hc[0] - 2, J0.hc[1] - J0.hr * (1.3 + 3.3 * hl)];
          P.underHat = hl > .25 ? stash(q, t >= X.flip1) : null;
          if (t < X.flip1) { var sx0 = hp[0], sy0 = hp[1] - CR; flipC = [lerp(sx0, top[0], fu), lerp(sy0, top[1], fu) - Math.sin(fu * Math.PI) * U * .45, fu]; }
        }
      } else {   // at the edge: a look back over the shoulder, a touch of the brim
        P = k.stand(U, G, xOut, -1); P.face = lerp(-1, -.25, E.out(seg(t, X.look, X.look + .2)));
        var t2 = E.out(seg(t, X.look + .25, X.look + .4)) * (1 - E.io(seg(t, X.look + 1.0, X.look + 1.2)));
        var J1 = k.figure(new k.Pen(0, U, 1), U, P, ST);
        P.hR = k.mixPt(P.hR, [J1.hc[0] - 6, J1.hc[1] - J1.hr * 1.4], t2); P.hatLift = .5 * t2; P.tilt = .2 * t2; P.mouth = 'smile';
        if (t > 4.9 && t < 5.06) { P.blink = false; P.eyeX = 0; }
        if (t > 5.0 && t < 5.15) P.blink = true;
      }
      k.shadow(p, P.hip[0], G, U * .2);
      var J = k.figure(p, U, P, ST);
      // the umbrella, swinging from the free hand like a cane
      var sw = P._u != null ? Math.sin(P._u * Math.PI * 2) * .25 : 0, bumping = (t >= X.in1 && t < X.out0) || (P.underHat != null) || (t >= X.flip0 && t < X.flip1 + .2);
      brolly(p, bumping ? [J.hLe[0] + 2, J.hLe[1] + 2] : P.hL, Math.PI / 2 + (P.face > 0 ? -.18 : .18) + sw, U * .44);   // hooked on his arm while his hands are busy
      // the chips: they rock when he walks into them; then one fewer
      others.forEach(function (z) { k.chip(p, z.x, z.y, z.c, z.ini, { rot: rock }); });
      if (!gone) k.chip(p, q.x, q.y, q.c, q.ini, { rot: rock * 1.2 });
      if (flipC) { k.chip(p, flipC[0], flipC[1], q.c, q.ini, { sx: Math.cos(flipC[2] * Math.PI * 6) }); if (flipC[2] < .35) k.speed(p, [flipC[0], flipC[1]], 0, -1, 2, 8, 6); }
      if (t >= X.bump && t < X.bump + .14) k.burst(p, [lead - CR - 2, q.y - 2], 6, 13, 5, 2.4, .6);
    }
  });
})();
